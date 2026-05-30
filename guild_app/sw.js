// FCM 백그라운드 푸시는 firebase-messaging-sw.js 가 담당합니다.
//
// v4 변경사항:
//   - CACHE_NAME 'roider-v4' 로 업그레이드 (구버전 캐시 강제 삭제)
//   - 로컬 JS/CSS/HTML 전략: Cache-First → Network-First (항상 최신 파일 사용)
//   - CDN 자산만 Cache-First 유지 (성능)
//   - 오프라인 fallback: index.html 캐시 유지

const CACHE_NAME = 'roider-v4';  // ← 버전 올려서 구캐시 강제 삭제

// 사전 캐싱: 오프라인 fallback 용도 (index.html 최소화)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
];

// Firebase / Auth API → 무조건 네트워크 직접 요청
const NETWORK_ONLY_PATTERNS = [
  /firestore\.googleapis\.com/,
  /firebase\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /fcm\.googleapis\.com/,
];

// CDN 자산 → Cache-First (변경 드문 외부 라이브러리)
const CDN_PATTERNS = [
  /gstatic\.com\/firebasejs/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
  /cdn\.jsdelivr\.net/,
  /ui-avatars\.com/,
];

// SW/Push 관련 파일 → 절대 캐싱 금지 (항상 최신 유지)
const NO_CACHE_PATTERNS = [
  /firebase-messaging-sw\.js/,
  /sw\.js/,
  /push_manager\.js/,
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      clients.claim(),
      // v4 이전 캐시 전부 삭제
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => {
            console.log('[SW] 구버전 캐시 삭제:', k);
            return caches.delete(k);
          })
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // http(s) 이외 스킴 → 패스 (chrome-extension 등)
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  // SW/Push 관련 파일 → 캐시 금지, 항상 네트워크
  if (NO_CACHE_PATTERNS.some(p => p.test(url))) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Firebase/Auth API → 네트워크 직접
  if (NETWORK_ONLY_PATTERNS.some(p => p.test(url))) {
    e.respondWith(fetch(e.request));
    return;
  }

  // CDN 자산 → Cache-First (성능 유지)
  if (CDN_PATTERNS.some(p => p.test(url))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        });
      }).catch(() => new Response('CDN unavailable', { status: 503 }))
    );
    return;
  }

  // 로컬 정적 자산 (HTML, JS, CSS, 이미지) → Network-First
  // 네트워크 성공: 최신 버전 반환 + 캐시 갱신
  // 네트워크 실패: 캐시 fallback (오프라인 지원)
  if (e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 → 캐시 fallback
          return caches.match(e.request).then(cached => {
            return cached || caches.match('/index.html');
          });
        })
    );
  }
});
