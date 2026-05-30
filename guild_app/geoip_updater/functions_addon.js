/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🌍  ROIDER GUILD — GeoIP 스케줄러 Cloud Function  (functions/index.js 추가분)
 *
 *  이 코드를 functions/index.js 파일 하단에 추가하세요.
 *
 *  기능:
 *    • 매일 새벽 3시 (KST) — 국가 정보 없는 신규 회원 자동 감지
 *    • HTTP Callable (관리자 전용) — 즉시 일괄 업데이트 트리거
 *
 *  주의:
 *    • Cloud Functions에서는 사용자 IP를 알 수 없으므로
 *      lastIP 필드가 Firestore에 저장되어 있어야 정확도가 높음.
 *      (없으면 서버 IP 기준 → 데이터 센터 위치로 잡힐 수 있음)
 *    • 대안: 클라이언트 감지(firebase_config.js)를 우선 사용하고
 *      이 함수는 최후 보루로만 동작시키세요.
 *
 *  배포:
 *    firebase deploy --only functions
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── import (기존 index.js에 이미 있으면 중복 추가 불필요) ──────────────────
// const { onSchedule }   = require('firebase-functions/v2/scheduler');
// const { onCall, HttpsError } = require('firebase-functions/v2/https');
// const { getFirestore, FieldValue } = require('firebase-admin/firestore');
// const { logger } = require('firebase-functions');

const https_module = require('node:https');
const http_module  = require('node:http');

// ─── GeoIP Provider (서버 사이드용 — node fetch) ─────────────────────────────
const GEO_PROVIDERS_CF = [
  {
    name    : 'ipapi.co',
    urlFor  : (ip) => ip ? `https://ipapi.co/${ip}/json/` : null,
    parse   : (d) => ({ code: d.country_code, city: d.city, tz: d.timezone }),
    validate: (d) => d && !d.error && d.country_code,
  },
  {
    name    : 'freeipapi.com',
    urlFor  : (ip) => ip ? `https://freeipapi.com/api/json/${ip}` : null,
    parse   : (d) => ({ code: d.countryCode, city: d.cityName, tz: d.timeZone }),
    validate: (d) => d && d.ipVersion,
  },
  {
    name    : 'ipwho.is',
    urlFor  : (ip) => ip ? `https://ipwho.is/${ip}` : null,
    parse   : (d) => ({ code: d.country_code, city: d.city, tz: d.timezone?.id }),
    validate: (d) => d && d.success !== false && d.country_code,
  },
  {
    name    : 'geojs.io',
    urlFor  : (ip) => ip ? `https://get.geojs.io/v1/ip/geo/${ip}.json` : null,
    parse   : (d) => ({ code: d.country_code, city: d.city, tz: d.timezone }),
    validate: (d) => d && d.country_code,
  },
];

/** Node.js 내장 https로 JSON fetch (Cloud Functions 환경) */
function nodeFetchJson(url, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https_module : http_module;
    const req = mod.get(url, {
      headers: { 'User-Agent': 'ROIDER-Guild-CF-GeoIP/2.0' },
      timeout: timeoutMs,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode === 200, json: () => JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error',   (e) => reject(e));
  });
}

/** IP 기반 GeoIP 조회 (서버 환경용) */
async function geoLookupByIP(ip) {
  if (!ip || !/^[\d.]+$/.test(ip)) return null; // IPv4만 지원

  for (const p of GEO_PROVIDERS_CF) {
    const url = p.urlFor(ip);
    if (!url) continue;
    try {
      const res = await nodeFetchJson(url);
      if (!res.ok) continue;
      const raw = res.json();
      if (!p.validate(raw)) continue;
      const info = p.parse(raw);
      const code = (info.code || '').toUpperCase().trim();
      if (/^[A-Z]{2}$/.test(code)) {
        return { code, city: info.city || null, timezone: info.tz || null, via: p.name };
      }
    } catch (_) { /* 다음 시도 */ }
  }
  return null;
}

// ─── 스케줄 함수: 매일 새벽 3시 KST ─────────────────────────────────────────
exports.scheduledGeoUpdate = onSchedule(
  {
    schedule       : '0 3 * * *',    // 매일 03:00 KST
    timeZone       : 'Asia/Seoul',
    region         : 'asia-northeast3',
    memory         : '256MiB',
    timeoutSeconds : 540,            // 9분 (최대 처리 여유)
  },
  async () => {
    const db       = getFirestore();
    const BATCH_MS = 1200;           // 1.2초 딜레이

    logger.info('[GeoIP-Schedule] 시작');

    // country가 없는 회원 대상
    const snap = await db.collection('users')
      .where('role', '!=', 'pending')
      .get();

    const targets = snap.docs.filter((d) => !d.data().country);
    logger.info(`[GeoIP-Schedule] 대상: ${targets.length}명`);

    let success = 0, fail = 0;
    for (const doc of targets) {
      const data   = doc.data();
      const lastIP = data.lastIP || null;

      if (!lastIP) { fail++; continue; }

      const geo = await geoLookupByIP(lastIP);
      if (!geo) { fail++; continue; }

      try {
        await doc.ref.update({
          country      : geo.code,
          geoCity      : geo.city      || FieldValue.delete(),
          geoTimezone  : geo.timezone  || FieldValue.delete(),
          geoProvider  : geo.via,
          geoUpdatedAt : FieldValue.serverTimestamp(),
        });
        success++;
        logger.info(`[GeoIP] ${data.nickname || doc.id} → ${geo.code} (${geo.city})`);
      } catch (e) {
        fail++;
        logger.warn(`[GeoIP] Firestore 저장 실패 ${doc.id}: ${e.message}`);
      }

      await new Promise((r) => setTimeout(r, BATCH_MS));
    }

    logger.info(`[GeoIP-Schedule] 완료 — success:${success} fail:${fail}`);
    return null;
  }
);


// ─── HTTP Callable: 관리자 즉시 트리거 ───────────────────────────────────────
exports.triggerGeoUpdate = onCall(
  {
    region : 'asia-northeast3',
    memory : '256MiB',
    timeoutSeconds: 540,
  },
  async (request) => {
    // 인증 확인
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const db = getFirestore();

    // 역할 확인 (admin만 허용)
    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', '관리자만 실행 가능합니다.');
    }

    const { force = false, targetUid = null } = request.data || {};

    // 대상 선정
    let querySnap;
    if (targetUid) {
      // 특정 유저 한 명
      const single = await db.collection('users').doc(targetUid).get();
      querySnap = single.exists ? [single] : [];
    } else {
      // 전체 (country 없거나 force=true면 전체)
      const q = force
        ? await db.collection('users').where('role', '!=', 'pending').get()
        : await db.collection('users').where('role', '!=', 'pending').get();
      querySnap = q.docs.filter(d => force || !d.data().country);
    }

    logger.info(`[GeoIP-Callable] 대상: ${querySnap.length}명 (force=${force})`);

    let success = 0, fail = 0;
    const summary = [];

    for (const doc of querySnap) {
      const data   = doc.data();
      const lastIP = data.lastIP || null;

      if (!lastIP) {
        fail++;
        summary.push({ uid: doc.id, nick: data.nickname, status: 'no_ip' });
        continue;
      }

      const geo = await geoLookupByIP(lastIP);
      if (!geo) {
        fail++;
        summary.push({ uid: doc.id, nick: data.nickname, status: 'geo_failed' });
        continue;
      }

      try {
        await doc.ref.update({
          country      : geo.code,
          geoCity      : geo.city     || FieldValue.delete(),
          geoTimezone  : geo.timezone || FieldValue.delete(),
          geoProvider  : geo.via,
          geoUpdatedAt : FieldValue.serverTimestamp(),
        });
        success++;
        summary.push({ uid: doc.id, nick: data.nickname, country: geo.code, city: geo.city, via: geo.via, status: 'ok' });
      } catch (e) {
        fail++;
        summary.push({ uid: doc.id, nick: data.nickname, status: 'firestore_error', error: e.message });
      }

      await new Promise((r) => setTimeout(r, 1200));
    }

    logger.info(`[GeoIP-Callable] 완료 success:${success} fail:${fail}`);
    return { success, fail, total: querySnap.length, summary };
  }
);
