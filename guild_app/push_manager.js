/* ═══════════════════════════════════════════════════════════════════════════
   push_manager.js  —  ROIDER GUILD  푸시 알림 매니저  v2.1
   ═══════════════════════════════════════════════════════════════════════════

   v2.1 변경사항:
     - Whale 브라우저 대응: SW 등록 방식 개선 + User-Agent 기반 플랫폼 저장
     - PWA(standalone) 대응: 독립 컨텍스트에서 SW/토큰 재등록 보장
     - 토큰 발급 실패 시 최대 3회 재시도 (지수 백오프)
     - iOS PWA 버전 체크 (16.4 미만 안내 메시지)
     - getToken 에러별 세분화 처리

   역할:
     ① Service Worker(firebase-messaging-sw.js) 등록 & 준비 대기
     ② FCM Messaging 인스턴스 생성 + SW 명시 연결
     ③ 브라우저 Notification 권한 요청 / 상태 관리
     ④ FCM 토큰 발급 → Firestore 'fcmTokens/{uid}' 저장
     ⑤ 포그라운드 메시지 수신 → 인앱 팝업 표시
     ⑥ Firestore 공지 실시간 감지 → 인앱 알림
     ⑦ 권한 배너(_initPushBanner) 노출 / 숨김 관리
     ⑧ 토큰 갱신 / 구독 해제 / 스토리지 설정 관리
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     ① 설정 상수
     ══════════════════════════════════════════════════════════════ */
  const VAPID_KEY  = 'BFQSq_Y1p1jIoNar5uyRieqFV3vzcZR4xNfD4l3H4fSJxYEEUs-C-CQEMDMkLYiEkOds517EkGkbkpBp9gQJ4F0';
  const SW_PATH    = '/firebase-messaging-sw.js';
  const SW_SCOPE   = '/';
  const ICON_PATH  = '/assets/icon-192.png';
  const NOTICE_URL = 'notice.html';

  /* ══════════════════════════════════════════════════════════════
     ② 내부 상태 변수
     ══════════════════════════════════════════════════════════════ */
  let _db           = null;
  let _uid          = null;
  let _messaging    = null;
  let _swReg        = null;
  let _lastNoticeId = null;
  let _initialized  = false;
  let _vapidMissing = VAPID_KEY === 'YOUR_VAPID_KEY_HERE';

  /* ══════════════════════════════════════════════════════════════
     ③ 공개 API  (window.PushManager)
     ══════════════════════════════════════════════════════════════ */
  window.PushManager = {
    init,
    requestPermission,
    getPermissionStatus,
    unsubscribe,
    sendTestNotification,
    showInAppNotification,
    initPushBanner,
  };


  /* ══════════════════════════════════════════════════════════════
     ④ 브라우저/환경 감지 헬퍼
     ══════════════════════════════════════════════════════════════ */

  /** 네이버 Whale 브라우저 여부 */
  function _isWhale() {
    return /\bWhale\b/i.test(navigator.userAgent);
  }

  /** PWA standalone 모드 여부 (홈 화면 추가 앱) */
  function _isPWA() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true  // iOS Safari PWA
    );
  }

  /** iOS 여부 + 버전 반환 */
  function _getIOSVersion() {
    const ua = navigator.userAgent;
    if (!/iPhone|iPad|iPod/i.test(ua)) return null;
    const m = ua.match(/OS (\d+)_(\d+)/i);
    return m ? parseFloat(`${m[1]}.${m[2]}`) : 0;
  }

  /** FCM 토큰 발급이 가능한 환경인지 확인 */
  function _isFCMSupported() {
    // Service Worker 미지원
    if (!('serviceWorker' in navigator)) return { ok: false, reason: 'sw_unsupported' };
    // Notification API 미지원
    if (!('Notification' in window)) return { ok: false, reason: 'notification_unsupported' };

    // iOS PWA: 16.4 미만은 Web Push 미지원
    const iosVer = _getIOSVersion();
    if (iosVer !== null && _isPWA() && iosVer < 16.4) {
      return { ok: false, reason: 'ios_pwa_old', version: iosVer };
    }
    // iOS Safari (비PWA): 17+ 에서 지원
    if (iosVer !== null && !_isPWA() && iosVer < 17) {
      return { ok: false, reason: 'ios_browser_old', version: iosVer };
    }

    return { ok: true };
  }


  /* ══════════════════════════════════════════════════════════════
     ⑤ 초기화 — SW 등록 → FCM 연결 → 포그라운드 리스너
     ══════════════════════════════════════════════════════════════ */
  async function init(db, uid) {
    if (_initialized) return;
    _db          = db;
    _uid         = uid;
    _initialized = true;

    const env = _isPWA() ? 'PWA(standalone)' : _isWhale() ? 'Whale' : 'Browser';
    console.info(`[PushManager] 초기화 — 환경: ${env}`);

    if (_vapidMissing) {
      console.warn('[PushManager] VAPID 키가 설정되지 않았습니다.');
    }

    // Firestore 실시간 공지 감지 (인앱 포그라운드)
    _startNoticeListener();

    // FCM SDK 미로드 시 인앱 전용 모드
    if (!('firebase' in window) || typeof firebase.messaging !== 'function') {
      console.info('[PushManager] FCM SDK 미로드 — 인앱 실시간 알림 전용 모드');
      return;
    }

    // iOS 버전 체크
    const fcmCheck = _isFCMSupported();
    if (!fcmCheck.ok) {
      _handleUnsupportedEnv(fcmCheck);
      return;
    }

    // ── Service Worker 등록 ─────────────────────────────────────
    _swReg = await _registerServiceWorker();

    // ── FCM Messaging 연결 ──────────────────────────────────────
    await _connectFCMMessaging();
  }


  /* ══════════════════════════════════════════════════════════════
     ⑥ 미지원 환경 처리
     ══════════════════════════════════════════════════════════════ */
  function _handleUnsupportedEnv({ reason, version }) {
    switch (reason) {
      case 'ios_pwa_old':
        console.warn(
          `[PushManager] iOS PWA 푸시 미지원: iOS ${version} (16.4+ 필요)\n` +
          '→ iOS 업데이트 후 홈 화면 앱을 다시 추가해 주세요.'
        );
        break;
      case 'ios_browser_old':
        console.warn(
          `[PushManager] iOS Safari 푸시 미지원: iOS ${version} (17+ 필요)\n` +
          '→ iOS를 업데이트하거나 홈 화면에 앱을 추가(PWA)해 주세요.'
        );
        break;
      case 'sw_unsupported':
        console.warn('[PushManager] 이 브라우저는 Service Worker를 지원하지 않습니다.');
        break;
      case 'notification_unsupported':
        console.warn('[PushManager] 이 브라우저는 알림 API를 지원하지 않습니다.');
        break;
    }
  }


  /* ══════════════════════════════════════════════════════════════
     ⑦ Service Worker 등록 (Whale + PWA 대응 강화)
     ══════════════════════════════════════════════════════════════ */
  async function _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;

    try {
      // ── 기존 등록 확인 ───────────────────────────────────────
      let existing = null;
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        if (r.scope.includes(SW_SCOPE) || r.active?.scriptURL?.includes('firebase-messaging-sw')) {
          existing = r;
          break;
        }
      }

      // PWA or Whale: 기존 SW가 있어도 강제로 업데이트 체크
      if (existing && existing.active) {
        console.info('[PushManager] SW 이미 활성화됨 — 업데이트 체크');
        try { await existing.update(); } catch (e) { /* 무시 */ }

        _setupSWMessageListener();
        return existing;
      }

      // ── 신규 등록 (updateViaCache: 'none' — 항상 최신 SW) ────
      console.info(`[PushManager] SW 등록 중... (${_isWhale() ? 'Whale' : _isPWA() ? 'PWA' : 'Browser'})`);

      const reg = await navigator.serviceWorker.register(SW_PATH, {
        scope:          SW_SCOPE,
        updateViaCache: 'none',
      });

      await _waitForSWActive(reg);
      console.info('[PushManager] SW 활성화 완료, scope:', reg.scope);

      _setupSWMessageListener();
      return reg;

    } catch (err) {
      console.error('[PushManager] SW 등록 실패:', err.message);

      // Whale에서 실패 시 — controller가 이미 있으면 재활용
      if (_isWhale() && navigator.serviceWorker.controller) {
        console.info('[PushManager] Whale — controller 재활용');
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs[0] || null;
      }
      return null;
    }
  }

  /** SW active 대기 (최대 12초) */
  function _waitForSWActive(reg) {
    return new Promise((resolve) => {
      if (reg.active) { resolve(); return; }
      const sw = reg.installing || reg.waiting;
      if (!sw) { resolve(); return; }
      const timeout = setTimeout(resolve, 12000);
      sw.addEventListener('statechange', function handler(e) {
        if (e.target.state === 'activated') {
          clearTimeout(timeout);
          sw.removeEventListener('statechange', handler);
          resolve();
        }
      });
    });
  }

  /** SW → 클라이언트 메시지 리스너 */
  function _setupSWMessageListener() {
    if (!('serviceWorker' in navigator)) return;
    // 중복 등록 방지
    if (navigator.serviceWorker._pmListenerSet) return;
    navigator.serviceWorker._pmListenerSet = true;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};

      if (type === 'PUSH_RECEIVED') {
        const { title, body, data } = payload || {};
        _showForegroundNotification(title, body, data);
      } else if (type === 'NOTICE_CLICK') {
        const { noticeId } = event.data || {};
        if (noticeId && window.location.pathname.includes('notice')) {
          const card = document.getElementById('notice-' + noticeId)
                    || document.querySelector(`[data-id="${noticeId}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('notice-highlight');
            setTimeout(() => card.classList.remove('notice-highlight'), 3000);
          }
        }
      } else if (type === 'PUSH_SUBSCRIPTION_CHANGED') {
        console.warn('[PushManager] Push 구독 변경 — 재구독 시도');
        if (Notification.permission === 'granted') {
          _refreshToken(0).catch(e => console.warn('[PushManager] 재구독 실패:', e.message));
        }
      }
    });
  }


  /* ══════════════════════════════════════════════════════════════
     ⑧ FCM Messaging 연결
     ══════════════════════════════════════════════════════════════ */
  async function _connectFCMMessaging() {
    try {
      if (!firebase.apps.length) {
        console.warn('[PushManager] Firebase 앱 미초기화');
        return;
      }

      _messaging = firebase.messaging();

      // 포그라운드 메시지 수신 (Chrome: 탭 포커스 있을 때 SW 대신 여기로 옴)
      _messaging.onMessage((payload) => {
        console.info('[PushManager] 포그라운드 FCM 수신:', payload?.notification?.title);
        const { title, body } = payload.notification || {};
        // forceOS=true: Chrome 포그라운드에서도 OS 알림 강제 표시
        _showForegroundNotification(title, body, payload.data, true);
      });

      // 기존 권한 있으면 토큰 즉시 갱신
      if (Notification.permission === 'granted') {
        await _refreshToken(0);
      }

    } catch (err) {
      console.warn('[PushManager] FCM 연결 오류:', err.message);
    }
  }


  /* ══════════════════════════════════════════════════════════════
     ⑨ 권한 요청
     ══════════════════════════════════════════════════════════════ */
  async function requestPermission() {
    if (!('Notification' in window)) {
      showToast('이 브라우저는 푸시 알림을 지원하지 않습니다.', 'warning');
      return false;
    }

    // iOS PWA 버전 경고
    const iosVer = _getIOSVersion();
    if (iosVer !== null && _isPWA() && iosVer < 16.4) {
      showToast(
        `iOS ${iosVer} PWA는 알림 미지원입니다. iOS 16.4 이상으로 업데이트 해주세요.`,
        'warning', 8000
      );
      return false;
    }

    if (Notification.permission === 'denied') {
      _showPermissionDeniedGuide();
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        showToast('🔔 푸시 알림이 활성화되었습니다!', 'success');
        await _refreshToken(0);
        _savePushSetting(true);
        _hidePermissionBanner();
        return true;
      } else {
        showToast('알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.', 'warning', 5000);
        _savePushSetting(false);
        return false;
      }
    } catch (err) {
      console.error('[PushManager] requestPermission 오류:', err);
      showToast('알림 권한 요청 중 오류가 발생했습니다.', 'error');
      return false;
    }
  }


  /* ══════════════════════════════════════════════════════════════
     ⑩ 권한 상태 조회
     ══════════════════════════════════════════════════════════════ */
  function getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }


  /* ══════════════════════════════════════════════════════════════
     ⑪ 구독 해제
     ══════════════════════════════════════════════════════════════ */
  async function unsubscribe() {
    try {
      if (_messaging) {
        try {
          const token = await _messaging.getToken({ vapidKey: VAPID_KEY });
          if (token) await _messaging.deleteToken();
        } catch (e) {
          console.warn('[PushManager] 토큰 삭제 오류:', e.message);
        }
      }
      if (_db && _uid) {
        await _db.collection('fcmTokens').doc(_uid).delete();
      }
      if (_swReg) {
        const sub = await _swReg.pushManager?.getSubscription?.();
        if (sub) await sub.unsubscribe();
      }
      _savePushSetting(false);
      showToast('🔕 푸시 알림 구독이 해제되었습니다.', 'info');
    } catch (err) {
      console.warn('[PushManager] unsubscribe 오류:', err.message);
    }
  }


  /* ══════════════════════════════════════════════════════════════
     ⑫ 테스트 알림
     ══════════════════════════════════════════════════════════════ */
  function sendTestNotification() {
    if (Notification.permission !== 'granted') {
      showToast('먼저 알림 권한을 허용해 주세요.', 'warning');
      return;
    }
    if (_swReg) {
      _swReg.showNotification('📢 ROIDER GUILD 테스트', {
        body:    '푸시 알림이 정상적으로 동작합니다! ✅',
        icon:    ICON_PATH,
        badge:   '/assets/badge-72.png',
        tag:     'roider-test',
        vibrate: [200, 100, 200],
        actions: [
          { action: 'open',    title: '공지 보기' },
          { action: 'dismiss', title: '닫기'       },
        ],
      });
    } else {
      try {
        new Notification('📢 ROIDER GUILD 테스트', {
          body: '푸시 알림이 정상적으로 동작합니다! ✅',
          icon: ICON_PATH,
          tag:  'roider-test',
        });
      } catch (e) { /* Safari 일부 버전 무시 */ }
    }
  }


  /* ══════════════════════════════════════════════════════════════
     ⑬ FCM 토큰 발급 & Firestore 저장 (재시도 로직 포함)
        retryCount: 0부터 시작, 최대 3회
     ══════════════════════════════════════════════════════════════ */
  async function _refreshToken(retryCount = 0) {
    if (!_messaging || !_db || !_uid) return;
    if (_vapidMissing) {
      console.info('[PushManager] VAPID 키 미설정 — 토큰 발급 건너뜀');
      return;
    }

    // SW가 없으면 재등록 시도
    if (!_swReg) {
      console.info('[PushManager] SW 미등록 — 재시도 중...');
      _swReg = await _registerServiceWorker();
    }

    // Whale: SW controller가 준비될 때까지 짧게 대기
    if (_isWhale() && !navigator.serviceWorker.controller) {
      console.info('[PushManager] Whale — SW controller 대기 중 (1.5s)');
      await new Promise(r => setTimeout(r, 1500));
    }

    try {
      const tokenOptions = { vapidKey: VAPID_KEY };
      if (_swReg) tokenOptions.serviceWorkerRegistration = _swReg;

      const token = await _messaging.getToken(tokenOptions);

      if (!token) {
        console.warn('[PushManager] FCM 토큰 빈 값 — 재시도 예약');
        if (retryCount < 3) {
          const delay = (retryCount + 1) * 2000; // 2s, 4s, 6s
          setTimeout(() => _refreshToken(retryCount + 1), delay);
        }
        return;
      }

      // Firestore 저장
      await _db.collection('fcmTokens').doc(_uid).set({
        token,
        uid:       _uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        platform:  _getPlatformInfo(),
        active:    true,
      }, { merge: true });

      console.info('[PushManager] FCM 토큰 저장 완료');

    } catch (err) {
      const code = err.code || '';

      if (code === 'messaging/permission-blocked') {
        console.warn('[PushManager] 알림 권한 차단됨 — 사용자가 차단 설정');

      } else if (code === 'messaging/unsupported-browser') {
        console.warn('[PushManager] FCM 미지원 브라우저:', err.message);

      } else if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/token-subscribe-failed'
      ) {
        // 토큰 만료/갱신 필요 — 재시도
        console.warn('[PushManager] 토큰 갱신 필요:', code);
        if (retryCount < 3) {
          const delay = (retryCount + 1) * 2000;
          console.info(`[PushManager] ${delay / 1000}초 후 재시도 (${retryCount + 1}/3)...`);
          setTimeout(() => _refreshToken(retryCount + 1), delay);
        }

      } else if (err.message?.includes('SW가 준비되지') || err.message?.includes('service worker')) {
        // SW 문제 — SW 재등록 후 재시도
        console.warn('[PushManager] SW 문제로 토큰 발급 실패 — SW 재등록 후 재시도');
        _swReg = null;
        if (retryCount < 2) {
          setTimeout(async () => {
            _swReg = await _registerServiceWorker();
            _refreshToken(retryCount + 1);
          }, 3000);
        }

      } else {
        console.warn('[PushManager] getToken 오류:', code, err.message);
        // 알 수 없는 오류 — 1회 재시도
        if (retryCount < 1) {
          setTimeout(() => _refreshToken(retryCount + 1), 3000);
        }
      }
    }
  }

  /** 플랫폼 정보 수집 (Whale / PWA 포함) */
  function _getPlatformInfo() {
    const ua       = navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(ua);
    const isIOS    = /iPhone|iPad|iPod/i.test(ua);
    const isWhale  = _isWhale();
    const isPWA    = _isPWA();
    const browser  = isWhale  ? 'Whale'
                   : /Chrome/i.test(ua)   ? 'Chrome'
                   : /Firefox/i.test(ua)  ? 'Firefox'
                   : /Safari/i.test(ua)   ? 'Safari'
                   : 'Other';

    return {
      userAgent: ua.slice(0, 200),
      isMobile,
      isIOS,
      isWhale,
      isPWA,
      browser,
      language: navigator.language || 'ko',
    };
  }


  /* ══════════════════════════════════════════════════════════════
     ⑭ Firestore 공지 실시간 감지 (포그라운드 인앱 알림)
     ══════════════════════════════════════════════════════════════ */
  function _startNoticeListener() {
    if (!_db) return;
    let isFirst = true;

    _db.collection('notice')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot((snap) => {
        if (isFirst) { isFirst = false; return; }
        if (snap.empty) return;

        const doc  = snap.docs[0];
        const data = doc.data();
        const id   = doc.id;

        if (id === _lastNoticeId) return;
        _lastNoticeId = id;

        if (data.authorUid === _uid) return;

        const title   = data.title  || '새 공지';
        const author  = data.author || '운영진';
        const content = (data.content || '').slice(0, 80);
        const body    = `${author} · ${content}${content.length >= 80 ? '…' : ''}`;

        _showForegroundNotification(
          `📢 새 공지: ${title}`,
          body,
          { url: NOTICE_URL, noticeId: id }
        );
      }, (err) => {
        console.warn('[PushManager] 공지 리스너 오류:', err.message);
      });
  }


  /* ══════════════════════════════════════════════════════════════
     ⑮ 포그라운드 알림 표시
     ══════════════════════════════════════════════════════════════ */
  // forceOS=true: Chrome 포그라운드처럼 document.hidden 무관하게 OS 알림 강제 표시
  function _showForegroundNotification(title, body, data = {}, forceOS = false) {
    showInAppNotification({ title, body, data });

    // OS 알림 조건: 권한 있고 (탭이 숨겨지거나 OR forceOS)
    const shouldShowOS = Notification.permission === 'granted' &&
                         (document.hidden || forceOS);
    if (!shouldShowOS) return;

    if (_swReg) {
      _swReg.showNotification(title || '📢 ROIDER GUILD', {
        body:               body || '',
        icon:               ICON_PATH,
        badge:              '/assets/badge-72.png',
        tag:                'roider-notice-fg',
        renotify:           true,
        requireInteraction: false,
        data:               data,
      }).catch((err) => {
        console.warn('[PushManager] SW showNotification 실패:', err.message);
        // SW 실패 시 직접 Notification으로 fallback
        try { new Notification(title || '📢 ROIDER GUILD', { body: body || '', icon: ICON_PATH }); }
        catch (e) { /* 무시 */ }
      });
    } else {
      try {
        new Notification(title || '📢 ROIDER GUILD', {
          body: body || '',
          icon: ICON_PATH,
          tag:  'roider-notice-fg',
        });
      } catch (e) { /* Safari 일부 무시 */ }
    }
  }


  /* ══════════════════════════════════════════════════════════════
     ⑯ 인앱 알림 팝업 (공개 API)
     ══════════════════════════════════════════════════════════════ */
  function showInAppNotification({ title, body, data = {}, duration = 7000 }) {
    let center = document.getElementById('in-app-notification-center');
    if (!center) {
      center = document.createElement('div');
      center.id = 'in-app-notification-center';
      document.body.appendChild(center);
    }

    const notif = document.createElement('div');
    notif.className = 'in-app-notif';
    notif.setAttribute('role', 'alert');
    notif.setAttribute('aria-live', 'polite');
    notif.innerHTML = `
      <div class="ian-icon">📢</div>
      <div class="ian-body">
        <div class="ian-title">${_escHtml(title || 'ROIDER GUILD')}</div>
        <div class="ian-text">${_escHtml(body || '')}</div>
      </div>
      <button class="ian-close" aria-label="알림 닫기" title="닫기">×</button>
    `;

    notif.addEventListener('click', (e) => {
      if (e.target.classList.contains('ian-close')) return;
      const url = (data && data.url) ? data.url : NOTICE_URL;
      window.location.href = url;
    });

    notif.querySelector('.ian-close').addEventListener('click', (e) => {
      e.stopPropagation();
      _removeNotif(notif);
    });

    center.prepend(notif);

    const timer = setTimeout(() => _removeNotif(notif), duration);
    notif.addEventListener('mouseenter', () => clearTimeout(timer));
    notif.addEventListener('mouseleave', () =>
      setTimeout(() => _removeNotif(notif), 2000)
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => notif.classList.add('ian-show'));
    });
  }

  function _removeNotif(el) {
    if (!el || !el.parentNode) return;
    el.classList.remove('ian-show');
    el.classList.add('ian-hide');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 380);
  }


  /* ══════════════════════════════════════════════════════════════
     ⑰ 권한 배너 초기화
     ══════════════════════════════════════════════════════════════ */
  function initPushBanner() {
    const status     = getPermissionStatus();
    const suppressed = localStorage.getItem('roider_push_banner_suppressed') === '1';

    if (status === 'granted' || status === 'unsupported' || suppressed) {
      _hidePermissionBanner();
      return;
    }

    const banner = document.getElementById('push-permission-banner');
    if (!banner) return;

    if (_vapidMissing) {
      const msg = banner.querySelector('.push-banner-msg');
      if (msg) {
        msg.textContent = '⚙️ VAPID 키 미설정 — push_manager.js 설정 후 배포하세요.';
        msg.style.color = '#ff9800';
      }
    }

    // iOS PWA 제한 안내
    const iosVer = _getIOSVersion();
    if (iosVer !== null && _isPWA() && iosVer < 16.4) {
      const msg = banner.querySelector('.push-banner-msg');
      if (msg) {
        msg.textContent = `⚠️ iOS ${iosVer} PWA는 알림 미지원 — iOS 16.4+로 업데이트 필요`;
        msg.style.color = '#ff9800';
      }
      return;
    }

    const allowBtn = banner.querySelector('#pushAllowBtn, .push-allow-btn, [data-push="allow"]');
    if (allowBtn && !allowBtn._bound) {
      allowBtn._bound = true;
      allowBtn.addEventListener('click', async () => {
        const granted = await requestPermission();
        if (granted) _hidePermissionBanner();
      });
    }

    const denyBtn = banner.querySelector('#pushDenyBtn, .push-deny-btn, [data-push="deny"]');
    if (denyBtn && !denyBtn._bound) {
      denyBtn._bound = true;
      denyBtn.addEventListener('click', () => {
        localStorage.setItem('roider_push_banner_suppressed', '1');
        _hidePermissionBanner();
      });
    }

    banner.style.display = '';
    requestAnimationFrame(() => banner.classList.add('push-banner-show'));
  }


  /* ══════════════════════════════════════════════════════════════
     내부 헬퍼
     ══════════════════════════════════════════════════════════════ */
  function _showPermissionDeniedGuide() {
    const lang = localStorage.getItem('roider_lang') || 'ko';
    const isWhaleBrowser = _isWhale();

    let msg;
    if (isWhaleBrowser) {
      msg = lang === 'ko'
        ? 'Whale: 주소창 왼쪽 🔒 → 알림 → 허용으로 변경하거나,\nWhale 설정 → 개인정보 보호 → 사이트 설정 → 알림에서 허용해 주세요.'
        : 'Whale: Click 🔒 in address bar → Notifications → Allow, or go to Whale Settings → Privacy → Site Settings → Notifications.';
    } else {
      msg = lang === 'ko'
        ? '알림이 차단되어 있습니다. 주소창 왼쪽 🔒 아이콘 → 알림 → 허용으로 변경해 주세요.'
        : 'Notifications are blocked. Click 🔒 in the address bar → Notifications → Allow.';
    }
    showToast(msg, 'warning', 9000);
  }

  function _hidePermissionBanner() {
    const banner = document.getElementById('push-permission-banner');
    if (!banner) return;
    banner.style.transition = 'opacity 0.4s, max-height 0.4s';
    banner.style.opacity    = '0';
    banner.style.maxHeight  = '0';
    banner.style.overflow   = 'hidden';
    setTimeout(() => {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 450);
  }

  function _savePushSetting(enabled) {
    localStorage.setItem('roider_push_enabled', enabled ? '1' : '0');
  }

  function _escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
