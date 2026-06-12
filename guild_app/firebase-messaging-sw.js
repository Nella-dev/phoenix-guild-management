/* ═══════════════════════════════════════════════════════════════════════════
   firebase-messaging-sw.js  —  Phoenix Guild  FCM Service Worker  v2.0
   ═══════════════════════════════════════════════════════════════════════════

   이 파일은 반드시 웹 루트(/)에 위치해야 합니다.
   firebase.json hosting.headers 에서 Cache-Control: no-cache 설정 필수.

   이벤트 처리 흐름:
   ┌──────────────────────────────────────────────────────────────────────┐
   │  FCM 서버                                                            │
   │    │                                                                 │
   │    ├─ notification 필드 있음 → onBackgroundMessage() → _handlePush  │
   │    └─ data-only / fallback  → push 이벤트        → _handlePush      │
   │                                                                      │
   │  _handlePush(title, body, data)                                      │
   │    │                                                                 │
   │    ├─ 포그라운드 탭 있음  → postMessage(PUSH_RECEIVED) 만 전송      │
   │    │                         (OS 알림 생략 — 인앱 팝업이 담당)       │
   │    └─ 백그라운드 / 종료  → showNotification (OS 네이티브 알림)       │
   │                             + 열린 탭에 postMessage 병행             │
   └──────────────────────────────────────────────────────────────────────┘

   등록된 이벤트:
     install              — skipWaiting (즉시 활성화)
     activate             — clients.claim + 구버전 캐시 정리
     push                 — Web Push API fallback (data-only FCM 포함)
     notificationclick    — 알림 클릭 → notice.html 이동
     notificationclose    — 알림 닫기 추적
     pushsubscriptionchange — 구독 만료/변경 감지
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ── Firebase SDK (SW 전용 compat 버전) ─────────────────────────────────────
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ── 버전 / 상수 ──────────────────────────────────────────────────────────────
const SW_VERSION  = '2.1.0';
const CACHE_NAME  = 'roider-fcm-v3';          // SW 전용 캐시 (오프라인 fallback용)

// 아이콘 경로 (로컬 assets/ — 오프라인 환경에서도 표시)
const ICON_PATH   = '/assets/icon-192.png';
const BADGE_PATH  = '/assets/badge-72.png';
const NOTICE_URL  = '/notice.html';
const NOTICE_TAG  = 'roider-notice';

// 오프라인 fallback 캐시 대상
const OFFLINE_CACHE = [
  NOTICE_URL,
  ICON_PATH,
  BADGE_PATH,
  '/assets/icon-512.png',
];

// ── Firebase 초기화 ──────────────────────────────────────────────────────────
firebase.initializeApp({
  apiKey:            'AIzaSyCbqEcGsdSDBZs8PjiI05YRNEGupLf3nSc',
  authDomain:        'roider-guild-management.firebaseapp.com',
  projectId:         'roider-guild-management',
  storageBucket:     'roider-guild-management.firebasestorage.app',
  messagingSenderId: '1012249034459',
  appId:             '1:1012249034459:web:ec0f821f29170446af96fe',
});

const messaging = firebase.messaging();

console.log(`[FCM SW] v${SW_VERSION} 초기화 완료`);


/* ═══════════════════════════════════════════════════════════════════════════
   ① 공통 알림 처리 헬퍼
      - 포그라운드 탭 존재 시: postMessage(PUSH_RECEIVED)만 전송 (OS 알림 생략)
      - 백그라운드 / 종료 시: showNotification + 열린 탭에도 postMessage
   ═══════════════════════════════════════════════════════════════════════════ */
async function _handlePush(title, body, data) {
  const notifTitle   = title || '📢 Phoenix Guild 공지';
  const notifBody    = body  || '새 공지사항이 등록되었습니다.';
  const targetUrl    = (data && data.url) ? data.url : NOTICE_URL;
  const noticeId     = (data && data.noticeId) ? data.noticeId : '';

  // 현재 열려있는 모든 클라이언트(탭/창) 조회
  const clientList = await clients.matchAll({
    type:               'window',
    includeUncontrolled: true,
  });

  // 열린 탭 전체에 postMessage 전송 (포그라운드 인앱 팝업용)
  clientList.forEach((c) => {
    c.postMessage({
      type:    'PUSH_RECEIVED',
      payload: { title: notifTitle, body: notifBody, data: { url: targetUrl, noticeId } },
    });
  });

  // OS 네이티브 알림: 항상 표시 (포그라운드/백그라운드 무관)
  // 포그라운드에서는 인앱 팝업 + OS 알림이 동시에 뜨지만,
  // 이것이 훨씬 신뢰성 높음 (탭 포커스 감지가 부정확한 환경 대응)
  console.log('[FCM SW] 알림 전송 시작:', notifTitle);

  // OS 네이티브 알림 표시
  await self.registration.showNotification(notifTitle, {
    body:               notifBody,
    icon:               ICON_PATH,
    badge:              BADGE_PATH,
    tag:                NOTICE_TAG,    // 동일 태그 → 이전 알림 덮어쓰기
    renotify:           true,          // 덮어쓰더라도 진동/소리 재알림
    requireInteraction: false,
    vibrate:            [200, 100, 200, 100, 200],
    timestamp:          Date.now(),
    silent:             false,
    data: {
      url:      targetUrl,
      noticeId: noticeId,
      sentAt:   Date.now(),
    },
    actions: [
      { action: 'open',    title: '📋 공지 보기' },
      { action: 'dismiss', title: '✕ 닫기'       },
    ],
  });

  console.log(`[FCM SW] OS 알림 표시 완료: "${notifTitle}"`);
}


/* ═══════════════════════════════════════════════════════════════════════════
   ② FCM SDK — onBackgroundMessage
      notification 필드가 있는 FCM 메시지 수신 (앱 백그라운드/종료 시)
      FCM SDK가 자동으로 표시하지 않도록 수동으로 처리
   ═══════════════════════════════════════════════════════════════════════════ */
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] onBackgroundMessage 수신:', payload?.notification?.title);

  const notif  = payload.notification || {};
  const data   = payload.data         || {};

  // FCM data 필드와 notification 필드 병합
  const mergedData = {
    url:      data.url      || NOTICE_URL,
    noticeId: data.noticeId || '',
    ...data,
  };

  // event.waitUntil 없이 직접 호출 (onBackgroundMessage는 이미 waitUntil 처리됨)
  return _handlePush(notif.title, notif.body, mergedData);
});


/* ═══════════════════════════════════════════════════════════════════════════
   ③ Web Push API — push 이벤트 (Fallback)
      - data-only FCM 메시지 (notification 필드 없음)
      - FCM SDK가 처리하지 못한 Raw Web Push
      - 네트워크 단절 복구 후 재전달되는 메시지
   ═══════════════════════════════════════════════════════════════════════════ */
self.addEventListener('push', (event) => {
  console.log('[FCM SW] push 이벤트 수신');

  // payload 없으면 기본 알림
  if (!event.data) {
    event.waitUntil(
      _handlePush('📢 Phoenix Guild', '새 공지사항이 있습니다.', { url: NOTICE_URL })
    );
    return;
  }

  let title, body, data = {};

  // JSON payload 파싱 시도
  try {
    const parsed = event.data.json();

    // FCM 형식 (notification + data 필드)
    if (parsed.notification) {
      title = parsed.notification.title;
      body  = parsed.notification.body;
      data  = {
        url:      parsed.data?.url      || parsed.fcmOptions?.link || NOTICE_URL,
        noticeId: parsed.data?.noticeId || '',
        ...(parsed.data || {}),
      };
    }
    // data-only FCM 형식
    else if (parsed.data) {
      title = parsed.data.title || '📢 Phoenix Guild 공지';
      body  = parsed.data.body  || parsed.data.content || '새 공지사항이 등록되었습니다.';
      data  = {
        url:      parsed.data.url      || NOTICE_URL,
        noticeId: parsed.data.noticeId || '',
        ...parsed.data,
      };
    }
    // 기타 형식
    else {
      title = parsed.title || '📢 Phoenix Guild';
      body  = parsed.body  || '새 공지사항이 있습니다.';
      data  = { url: parsed.url || NOTICE_URL };
    }
  } catch (_) {
    // JSON 파싱 실패 → 텍스트로 처리
    title = '📢 Phoenix Guild 공지';
    body  = event.data.text() || '새 공지사항이 등록되었습니다.';
    data  = { url: NOTICE_URL };
  }

  event.waitUntil(_handlePush(title, body, data));
});


/* ═══════════════════════════════════════════════════════════════════════════
   ④ 알림 클릭 처리
      - 'dismiss' 액션: 알림만 닫기
      - 'open' 액션 / 본문 클릭: notice.html 이동 (기존 탭 포커스 우선)
   ═══════════════════════════════════════════════════════════════════════════ */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action    = event.action;
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || NOTICE_URL;

  console.log(`[FCM SW] 알림 클릭 — action="${action}" url="${targetUrl}"`);

  // '닫기' 액션이면 탭 이동 없이 종료
  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList) => {
        // 이미 notice.html 이 열린 탭이 있으면 포커스 + navigate
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === '/notice.html' || clientUrl.pathname.endsWith('notice.html')) {
            await client.focus();
            client.postMessage({ type: 'NOTICE_CLICK', noticeId: notifData.noticeId });
            return;
          }
        }

        // 다른 탭이 열려 있으면 그 탭을 notice.html 로 이동
        for (const client of clientList) {
          if ('navigate' in client) {
            await client.focus();
            await client.navigate(targetUrl);
            return;
          }
        }

        // 탭이 없으면 새 탭 열기
        await clients.openWindow(targetUrl);
      })
  );
});


/* ═══════════════════════════════════════════════════════════════════════════
   ⑤ 알림 닫기 추적 (notificationclose)
      사용자가 알림 센터에서 직접 닫은 경우
   ═══════════════════════════════════════════════════════════════════════════ */
self.addEventListener('notificationclose', (event) => {
  const tag = event.notification.tag || '';
  console.log(`[FCM SW] 알림 닫힘 — tag="${tag}"`);

  // 열린 클라이언트에 닫힘 이벤트 전달 (선택적 분석용)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        clientList.forEach((c) =>
          c.postMessage({ type: 'NOTIFICATION_CLOSED', tag })
        );
      })
  );
});


/* ═══════════════════════════════════════════════════════════════════════════
   ⑥ 구독 변경 감지 (pushsubscriptionchange)
      토큰 만료 또는 브라우저가 구독을 자동 갱신할 때 발생
      → 클라이언트에 재구독 요청 메시지 전송
   ═══════════════════════════════════════════════════════════════════════════ */
self.addEventListener('pushsubscriptionchange', (event) => {
  console.warn('[FCM SW] Push 구독이 변경/만료되었습니다 — 재구독이 필요합니다.');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        clientList.forEach((c) =>
          c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' })
        );
      })
  );
});


/* ═══════════════════════════════════════════════════════════════════════════
   ⑦ SW 설치 (install)
      - skipWaiting: 대기 없이 즉시 새 SW 활성화
      - 오프라인 fallback 리소스 캐시
   ═══════════════════════════════════════════════════════════════════════════ */
self.addEventListener('install', (event) => {
  console.log(`[FCM SW] install — v${SW_VERSION}`);
  self.skipWaiting();

  // 오프라인에서도 notice.html + 아이콘이 열리도록 캐시
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(OFFLINE_CACHE).catch((err) => {
        // 캐시 실패는 치명적이지 않으므로 경고만 출력
        console.warn('[FCM SW] 오프라인 캐시 일부 실패:', err.message);
      })
    )
  );
});


/* ═══════════════════════════════════════════════════════════════════════════
   ⑧ SW 활성화 (activate)
      - clients.claim: 즉시 현재 페이지 제어 획득
      - 구버전 캐시(CACHE_NAME 불일치) 삭제
   ═══════════════════════════════════════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  console.log(`[FCM SW] activate — v${SW_VERSION}`);

  event.waitUntil(
    Promise.all([
      // 즉시 모든 클라이언트 제어
      clients.claim(),

      // 구버전 캐시 정리
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => {
              console.log(`[FCM SW] 구버전 캐시 삭제: ${k}`);
              return caches.delete(k);
            })
        )
      ),
    ])
  );
});


/* ═══════════════════════════════════════════════════════════════════════════
   ⑨ fetch 이벤트 — 오프라인 fallback (notice.html / 아이콘)
      캐시 히트 → 즉시 반환
      캐시 미스 → 네트워크 → 실패 시 캐시된 notice.html fallback
   ═══════════════════════════════════════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  const reqUrl = event.request.url;

  // ── http(s) 이외의 스킴(chrome-extension 등)은 캐싱 불가 → 즉시 반환
  if (!reqUrl.startsWith('http://') && !reqUrl.startsWith('https://')) return;

  const url = new URL(reqUrl);

  // 오프라인 캐시 대상 경로만 처리
  const isCached = OFFLINE_CACHE.some(
    (path) => url.pathname === path || url.pathname.endsWith(path)
  );
  if (!isCached) return;  // 나머지는 sw.js(메인 SW)가 처리

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // 유효한 응답은 캐시 갱신
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 + 캐시 없음 → notice.html fallback
          if (url.pathname.endsWith('.html')) {
            return caches.match(NOTICE_URL);
          }
        });
    })
  );
});
