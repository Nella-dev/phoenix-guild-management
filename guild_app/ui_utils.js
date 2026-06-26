/* ═══════════════════════════════════════
   ui_utils.js  — Phoenix 공통 UI 유틸리티
   Toast 알림 / 커스텀 Confirm 다이얼로그
   ═══════════════════════════════════════ */

// ─── Toast 컨테이너 자동 생성 ───
// <head>에서 로드될 때 document.body가 null일 수 있으므로 안전하게 처리
function _ensureToastContainer() {
  if (document.getElementById('toast-container')) return;
  if (!document.body) return;  // body 아직 없으면 skip (DOMContentLoaded에서 재시도)
  const el = document.createElement('div');
  el.id = 'toast-container';
  document.body.appendChild(el);
}
// 즉시 시도 (body 안에서 로드된 경우 대비)
_ensureToastContainer();

// ─── Toast 표시 함수 ───
window.showToast = function(message, type = 'success', duration = 3200) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  // 컨테이너 보장
  _ensureToastContainer();
  let container = document.getElementById('toast-container');
  if (!container) return; // body가 없는 극단적 상황 방어

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span>${message}</span>`;

  container.appendChild(toast);

  // 자동 제거
  const timer = setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, duration);

  // 클릭으로 즉시 닫기
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    toast.classList.add('hiding');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  });
};

// ─── 커스텀 Confirm 다이얼로그 ───
// 기존 confirm() 을 대체. Promise<boolean> 반환
window.showConfirm = function(message, { okText, cancelText, danger = false, icon = '🤔' } = {}) {
  return new Promise((resolve) => {
    const lang = localStorage.getItem('roider_lang') || 'ko';

    // 기본 버튼 텍스트 (언어 대응)
    if (!okText)     okText     = lang === 'ko' ? '확인' : 'Confirm';
    if (!cancelText) cancelText = lang === 'ko' ? '취소' : 'Cancel';

    // 오버레이 생성 또는 재사용
    let overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'confirm-overlay';
      overlay.innerHTML = `
        <div id="confirm-box">
          <div id="confirm-icon"></div>
          <p id="confirm-msg"></p>
          <div class="confirm-btns">
            <button id="confirm-cancel"></button>
            <button id="confirm-ok"></button>
          </div>
        </div>`;
      if (document.body) document.body.appendChild(overlay);
    }

    document.getElementById('confirm-icon').textContent = icon;
    document.getElementById('confirm-msg').textContent = message;
    document.getElementById('confirm-ok').textContent = okText;
    document.getElementById('confirm-cancel').textContent = cancelText;

    const okBtn = document.getElementById('confirm-ok');
    okBtn.className = danger ? 'danger' : '';

    overlay.classList.add('active');

    // 버튼 핸들러 (한 번만 실행)
    const cleanup = (result) => {
      overlay.classList.remove('active');
      okBtn.replaceWith(okBtn.cloneNode(true));
      document.getElementById('confirm-cancel').replaceWith(
        document.getElementById('confirm-cancel').cloneNode(true)
      );
      resolve(result);
    };

    // 다시 바인딩
    document.getElementById('confirm-ok').addEventListener('click', () => cleanup(true),  { once: true });
    document.getElementById('confirm-cancel').addEventListener('click', () => cleanup(false), { once: true });

    // ESC 키
    const escHandler = (e) => {
      if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); cleanup(false); }
    };
    document.addEventListener('keydown', escHandler);
  });
};

// ─── 모든 페이지: ESC 키로 모달 닫기 ───
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  // display:flex 인 .modal 요소 닫기
  document.querySelectorAll('.modal').forEach(m => {
    if (m.style.display === 'flex') m.style.display = 'none';
  });
});

// ─── 로딩 오버레이 개선: 스피너 자동 삽입 ───
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay && !overlay.querySelector('.loading-spinner')) {
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <span class="loading-text">Phoenix Guild</span>`;
  }

  // Toast 컨테이너 보장
  _ensureToastContainer();
});

// ─── 신규 공지 뱃지 체크 ───
window.checkNoticeBadge = async function(db, uid) {
  if (!db || !uid) return;
  try {
    // 최신 공지 1개 가져오기
    const snap = await db.collection('notice')
      .orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) return;

    const latestTs = snap.docs[0].data().createdAt;
    if (!latestTs) return;
    const latestDate = latestTs.toDate ? latestTs.toDate() : new Date(latestTs);

    // 내 lastRead 가져오기
    const userSnap = await db.collection('users').doc(uid).get();
    const lastRead = userSnap.data()?.noticeLastRead;
    const lastReadDate = lastRead
      ? (lastRead.toDate ? lastRead.toDate() : new Date(lastRead))
      : new Date(0);

    const hasNew = latestDate > lastReadDate;

    // 모든 공지 nav-link에 뱃지 표시
    document.querySelectorAll('a[href="notice.html"].nav-link').forEach(el => {
      let badge = el.querySelector('.notice-badge');
      if (hasNew) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'notice-badge';
          badge.textContent = 'N';
          el.style.position = 'relative';
          el.appendChild(badge);
        }
      } else if (badge) {
        badge.remove();
      }
    });

    // 대시보드 카드에도 뱃지
    document.querySelectorAll('a[href="notice.html"].menu-card').forEach(el => {
      let badge = el.querySelector('.card-notice-badge');
      if (hasNew) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'card-notice-badge';
          badge.textContent = '🔔 NEW';
          el.appendChild(badge);
        }
      } else if (badge) {
        badge.remove();
      }
    });

  } catch(e) { console.warn('Notice badge check failed:', e); }
};

// ─── 공지 읽음 처리 ───
window.markNoticeRead = async function(db, uid) {
  if (!db || !uid) return;
  try {
    await db.collection('users').doc(uid).update({
      noticeLastRead: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(e) { console.warn('markNoticeRead failed:', e); }
};

// ─── 모바일 스와이프 사이드바 ───────────────────────────
(function initSwipeNav() {
  const EDGE_THRESHOLD  = 30;   // 화면 왼쪽 30px 이내에서 시작해야 열기
  const SWIPE_THRESHOLD = 60;   // 최소 스와이프 거리 (px)
  const SWIPE_VELOCITY  = 0.3;  // 최소 속도 (px/ms)

  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  let isSwiping = false;

  function getNav() { return document.getElementById('sideNav'); }
  function getOverlay() { return document.getElementById('overlay'); }
  function isNavOpen() {
    const n = getNav(); return n && n.classList.contains('active');
  }
  function openNav() {
    const n = getNav(), o = getOverlay();
    if (n) n.classList.add('active');
    if (o) o.classList.add('active');
  }
  function closeNav() {
    const n = getNav(), o = getOverlay();
    if (n) n.classList.remove('active');
    if (o) o.classList.remove('active');
  }

  // 터치 추적: 스와이프 중 nav 위치를 실시간 반영 (선택적 드래그 효과)
  document.addEventListener('touchstart', (e) => {
    touchStartX    = e.touches[0].clientX;
    touchStartY    = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;

    // 열기 조건: 화면 왼쪽 EDGE_THRESHOLD 이내에서 시작
    if (!isNavOpen() && touchStartX <= EDGE_THRESHOLD) {
      isSwiping = true;
    }
    // 닫기 조건: nav가 열려 있으면 어디서든 가능
    if (isNavOpen()) {
      isSwiping = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    // 수직 스크롤이 더 크면 무시
    if (Math.abs(dy) > Math.abs(dx) + 10) { isSwiping = false; return; }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const velocity = Math.abs(dx) / dt;

    // 수직 방향 우세 → 무시
    if (Math.abs(dy) > Math.abs(dx) + 10) return;

    const isRightSwipe = dx > SWIPE_THRESHOLD || (dx > 20 && velocity > SWIPE_VELOCITY);
    const isLeftSwipe  = dx < -SWIPE_THRESHOLD || (dx < -20 && velocity > SWIPE_VELOCITY);

    if (!isNavOpen() && isRightSwipe && touchStartX <= EDGE_THRESHOLD + 20) {
      openNav();
    } else if (isNavOpen() && isLeftSwipe) {
      closeNav();
    }
    isSwiping = false;
  }, { passive: true });

  // 스와이프 힌트 : 모바일에서 처음 방문 시 좌측 엣지에 시각적 힌트 표시
  function showSwipeHint() {
    if (window.innerWidth > 850) return;  // PC에서는 표시 안함
    if (localStorage.getItem('swipe_hint_shown')) return;
    const hint = document.createElement('div');
    hint.id = 'swipe-hint';
    hint.innerHTML = `<div class="swipe-hint-arrow">›</div>`;
    if (!document.body) return;
    document.body.appendChild(hint);
    setTimeout(() => {
      hint.classList.add('visible');
      setTimeout(() => {
        hint.classList.remove('visible');
        setTimeout(() => { if (hint.parentNode) hint.remove(); }, 400);
        localStorage.setItem('swipe_hint_shown', '1');
      }, 2500);
    }, 800);
  }

  document.addEventListener('DOMContentLoaded', showSwipeHint);
  // 이미 로드된 경우
  if (document.readyState !== 'loading') showSwipeHint();
})();
