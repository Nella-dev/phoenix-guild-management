// firebase_config.js - 인증 도메인 충돌 및 세션 유실 방어 최종본
// ✅ [수정] isLoginPg 조건에 index.html 및 루트 경로(/) 추가 (SDK v10.8.0 통일 대응)

if (typeof firebaseConfig !== 'undefined') {
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.warn("Firebase already initialized:", e.message);
  }
}

const auth    = firebase.auth();
const db      = firebase.firestore();
// ✅ Firebase Storage (SDK가 로드된 페이지에서만 초기화)
const storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

/**
 * 🔐 세션 유지 설정 (즉시 실행)
 */
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("Auth persistence confirmed: LOCAL"))
  .catch(err => console.error("Persistence Error:", err));

// ℹ️ getRedirectResult는 index.html/login.html에서만 처리 (중복 호출 방지)

// 로그아웃 함수
function logout() {
  auth.signOut().then(() => {
    location.replace("login.html");
  });
}

/**
 * 🚨 전역 인증 감시자
 */
// ✅ 리다이렉트 중복 방지 플래그 (페이지 전환 시작 후 재처리 방지)
let _authRedirecting = false;

auth.onAuthStateChanged(async (user) => {
  if (_authRedirecting) return;

  const path = window.location.pathname;
  const isLoginPg = path.includes("login.html") || path.includes("index.html") || path === "/" || path.endsWith("/");
  const isNicknamePg = path.includes("nickname.html");
  const isPendingPg = path.includes("pending.html");

  console.log("Current Auth State:", user ? "LoggedIn (" + user.uid + ")" : "LoggedOut");

  // 1. 로그아웃 상태 처리
  if (!user) {
    if (!isLoginPg && !isNicknamePg && !isPendingPg) {
      console.log("Checking session... Waiting 3s");

      // [핵심] 브라우저가 세션을 불러오는 시간을 확보하여 무한 루프 방지
      setTimeout(() => {
        if (!auth.currentUser) {
          console.warn("No user found. Redirecting to login.html");
          location.replace("login.html");
        }
      }, 3000);
    }
    return;
  }

  // 2. 로그인 상태 처리
  try {
    _authRedirecting = true;
    const userRef = db.collection("users").doc(user.uid);
    const docSnap = await userRef.get();

    // 신규 유저 데이터 생성 로직
    if (!docSnap.exists) {
      if (!isNicknamePg) {
        console.log("New user - redirection to nickname.html");
        await userRef.set({
          uid: user.uid,
          email: user.email,
          nickname: "",
          role: "pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        location.replace("nickname.html");
      }
      return;
    }

    const data = docSnap.data();
    const userRole = data.role || "member";

    // 3. 페이지별 리다이렉트 제어
    if (isLoginPg) {
      // 로그인 완료 후 갈 곳 결정
      let target = "main.html";
      if (!data.nickname) target = "nickname.html";
      else if (userRole === "pending") target = "pending.html";
      
      console.log("Authenticated. Moving to:", target);
      location.replace(target);
      return;
    }

    // 닉네임 설정을 마쳤거나 승인된 유저가 불필요한 페이지에 머물 때
    if ((isNicknamePg || isPendingPg) && data.nickname && userRole !== "pending") {
      location.replace("main.html");
      return;
    }

    // 4. UI 업데이트 실행
    if (typeof updateGlobalUI === 'function') {
      updateGlobalUI(data, user);
    }

    // 5. 온라인 상태 업데이트 + 국가 감지
    if (!isLoginPg && !isNicknamePg && !isPendingPg) {
      // 국가 정보 없거나 7일 경과 시 재감지 (IP 변경 대응)
      const GEO_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7일
      const lastGeoTs = data.geoUpdatedAt?.seconds
        ? data.geoUpdatedAt.seconds * 1000
        : 0;
      if (!data.country || (Date.now() - lastGeoTs) > GEO_REFRESH_MS) {
        detectAndSaveCountry(userRef);
      }
      // lastIP 감지 (서버사이드 GeoIP 스크립트에서 활용)
      const detectIP = async () => {
        try {
          const r = await fetch('https://api.ipify.org?format=json',
            { signal: AbortSignal.timeout(4000) });
          if (r.ok) {
            const { ip } = await r.json();
            if (ip) return ip;
          }
        } catch (_) {}
        return null;
      };
      detectIP().then(ip => {
        const update = {
          online    : true,
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (ip) update.lastIP = ip;
        userRef.update(update).catch(() => {});
      });
    }

    _authRedirecting = false;
  } catch (e) {
    console.error("Firestore Critical Error:", e.code, e.message);
    _authRedirecting = false;
  }
});

function updateGlobalUI(data, user) {
  const elements = {
    navAdminMenu: document.getElementById("navAdminMenu"),
    adminSection: document.getElementById("adminSection"),
    badgeEl: document.getElementById("myRoleBadge"),
    userNameEl: document.getElementById("userName"),
    welcomeNameEl: document.getElementById("welcomeName"),
    userPhotoEl: document.getElementById("userPhoto")
  };

  const hasAdminAccess = (data.role === "admin" || data.role === "manager");
  
  if (elements.navAdminMenu) elements.navAdminMenu.style.display = hasAdminAccess ? "inline-block" : "none";
  if (elements.adminSection) elements.adminSection.style.display = hasAdminAccess ? "block" : "none";

  if (elements.badgeEl) {
    if (data.role === "member") {
      elements.badgeEl.style.display = "none"; 
    } else {
      elements.badgeEl.style.display = "inline-block";
      elements.badgeEl.textContent = data.role.toUpperCase();
    }
  }

  if (elements.userNameEl) elements.userNameEl.textContent = data.nickname || "User";
  if (elements.welcomeNameEl) elements.welcomeNameEl.textContent = data.nickname || "User";
  
  if (elements.userPhotoEl) {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nickname || 'U')}&background=2a3242&color=f4c430&bold=true`;
    elements.userPhotoEl.src = data.customPhotoURL || user.photoURL || avatarUrl;
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 *  🌍  GeoIP 국가 감지 — 4-Provider 폴백 체인
 * ═══════════════════════════════════════════════════════════
 *  우선순위 / 무료 한도 / HTTPS / API Key
 *  1. ipapi.co      — 1,000/일(30K/월)  ✅ HTTPS  ❌ Key 불필요  ★정확도 최상
 *  2. freeipapi.com — 60 req/분          ✅ HTTPS  ❌ Key 불필요  ★안정적
 *  3. ipwho.is      — 10,000/월          ✅ HTTPS  ❌ Key 불필요  ★가볍고 빠름
 *  4. geojs.io      — 무제한(CF 캐시)    ✅ HTTPS  ❌ Key 불필요  ★최후 보루
 *
 *  ✦ localStorage 캐시: 24시간 내 재감지 방지 → API 한도 절약
 *  ✦ Firestore 저장 필드: country / geoCity / geoTimezone / geoProvider
 *  ✦ 기존 country가 있어도 7일 경과 시 자동 갱신 (IP 변경 대응)
 * ═══════════════════════════════════════════════════════════
 */
async function detectAndSaveCountry(userRef) {

  // ── 0. 로컬 캐시 확인 (24시간) ──────────────────────────────────────────
  const GEO_CACHE_KEY = 'roider_geo_v2';
  const GEO_TTL_MS    = 24 * 60 * 60 * 1000; // 24시간
  const now = Date.now();

  try {
    const cached = JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || 'null');
    if (cached && cached.code && (now - (cached.ts || 0)) < GEO_TTL_MS) {
      // 캐시 유효 → Firestore만 조용히 갱신 후 종료
      await userRef.update({ country: cached.code }).catch(() => {});
      console.log(`[GeoIP] 📦 캐시 사용 (${cached.via}) → ${cached.code}`);
      return;
    }
  } catch (_) { /* localStorage 파싱 실패 무시 */ }

  // ── 1. Provider 목록 (순서대로 시도) ────────────────────────────────────
  const PROVIDERS = [
    {
      name    : 'ipapi.co',
      url     : 'https://ipapi.co/json/',
      timeout : 6000,
      parse   : d => ({
        code     : d.country_code,
        city     : d.city,
        timezone : d.timezone,
        org      : d.org
      })
    },
    {
      name    : 'freeipapi.com',
      url     : 'https://freeipapi.com/api/json/',
      timeout : 6000,
      parse   : d => ({
        code     : d.countryCode,
        city     : d.cityName,
        timezone : d.timeZone,
        org      : null
      })
    },
    {
      name    : 'ipwho.is',
      url     : 'https://ipwho.is/',
      timeout : 6000,
      parse   : d => ({
        code     : d.country_code,
        city     : d.city,
        timezone : d.timezone?.id || d.timezone,
        org      : d.connection?.org
      })
    },
    {
      name    : 'geojs.io',
      url     : 'https://get.geojs.io/v1/ip/geo.json',
      timeout : 6000,
      parse   : d => ({
        code     : d.country_code,
        city     : d.city,
        timezone : d.timezone,
        org      : d.organization_name
      })
    }
  ];

  // ── 2. 순차 시도 ─────────────────────────────────────────────────────────
  for (const provider of PROVIDERS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), provider.timeout);

      const res = await fetch(provider.url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(`[GeoIP] ${provider.name} HTTP ${res.status} → 다음 시도`);
        continue;
      }

      const raw  = await res.json();
      const info = provider.parse(raw);
      const code = (info.code || '').toString().toUpperCase().trim();

      // ISO 3166-1 alpha-2 검증
      if (!/^[A-Z]{2}$/.test(code)) {
        console.warn(`[GeoIP] ${provider.name} 코드 이상: "${info.code}" → 다음 시도`);
        continue;
      }

      // ── 3. 로컬 캐시 저장 ─────────────────────────────────────────────
      const cacheObj = { code, ts: now, via: provider.name };
      if (info.city)     cacheObj.city     = info.city;
      if (info.timezone) cacheObj.timezone = info.timezone;
      localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cacheObj));

      // ── 4. Firestore 업데이트 ──────────────────────────────────────────
      const geoUpdate = {
        country     : code,
        geoProvider : provider.name,
        geoUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (info.city)     geoUpdate.geoCity     = info.city;
      if (info.timezone) geoUpdate.geoTimezone = info.timezone;

      await userRef.update(geoUpdate).catch(e =>
        console.warn('[GeoIP] Firestore 저장 실패:', e.message)
      );

      console.log(`[GeoIP] ✅ ${provider.name} → ${code}${info.city ? ' / ' + info.city : ''}`);
      return; // 성공 → 종료

    } catch (e) {
      const reason = e.name === 'AbortError' ? '타임아웃' : e.message;
      console.warn(`[GeoIP] ${provider.name} 실패 (${reason}) → 다음 시도`);
    }
  }

  console.warn('[GeoIP] ⚠️ 모든 provider 실패 — 국가 정보 미저장');
}

window.addEventListener("beforeunload", () => {
  const user = auth.currentUser;
  if (user) {
    db.collection("users").doc(user.uid).update({
      online: false,
      lastActive: firebase.firestore.Timestamp.now()
    }).catch(() => {});
  }
});