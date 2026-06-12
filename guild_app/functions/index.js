/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  functions/index.js  ·  Phoenix Guild — Firebase Cloud Functions  v2.1
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Export 목록:
 *  ┌─────────────────────────────┬──────────────────────────────────────────┐
 *  │ sendNoticeNotification      │ 신규 공지 생성 → 전체 구독자 FCM 발송    │
 *  │ sendNoticeUpdatedNoti       │ 공지 수정(중요 변경) → FCM 재발송        │
 *  │ sendTestPush                │ HTTP Callable — 관리자 테스트 발송       │
 *  │ cleanupStaleTokens          │ 스케줄러 — 30일 미갱신 토큰 비활성화     │
 *  │ scheduledGeoUpdate          │ 스케줄러 — 매일 03:00 KST GeoIP 자동갱신 │
 *  │ triggerGeoUpdate            │ HTTP Callable — 관리자 즉시 GeoIP 갱신  │
 *  └─────────────────────────────┴──────────────────────────────────────────┘
 *
 *  동작 흐름 (sendNoticeNotification):
 *    ① notice/{id} 문서 생성
 *    ② fcmTokens 컬렉션에서 active=true 토큰 조회
 *    ③ 작성자 본인 제외 후 500개 단위 배치 멀티캐스트
 *    ④ 만료·무효 토큰 Firestore에서 자동 삭제
 *    ⑤ pushLogs 컬렉션에 발송 결과 기록
 *
 *  배포:
 *    cd functions && npm install
 *    firebase deploy --only functions
 *
 *  사전 요구사항:
 *    - Firebase Blaze (종량제) 플랜 필수
 *    - firebase-admin ^12 / firebase-functions ^5
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError }                   = require('firebase-functions/v2/https');
const { onSchedule }                           = require('firebase-functions/v2/scheduler');
const { initializeApp }                        = require('firebase-admin/app');
const { getMessaging }                         = require('firebase-admin/messaging');
const { getFirestore, FieldValue, Timestamp }  = require('firebase-admin/firestore');
const { logger }                               = require('firebase-functions');

// Admin SDK 초기화 (Cloud Functions 환경에서 자격증명 자동 적용)
initializeApp();

// ─── 공통 상수 ────────────────────────────────────────────────────────────────
const REGION        = 'asia-northeast3';   // 서울 리전
const BATCH_SIZE    = 500;                 // FCM sendEachForMulticast 최대 500개
const BATCH_DELAY   = 100;                 // 배치 간 딜레이(ms) — rate-limit 방지
const ICON_PATH     = '/assets/icon-192.png';
const BADGE_PATH    = '/assets/badge-72.png';
const NOTICE_TAG    = 'roider-notice';
const NOTICE_LINK   = '/notice.html';

// ─── 유틸리티 ──────────────────────────────────────────────────────────────────

/** ms 딜레이 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** body 텍스트 100자 자르기 */
const truncate = (text = '', max = 100) =>
  text.length > max ? text.slice(0, max) + '…' : text;

/**
 * FCM 메시지 객체 생성 헬퍼
 * @param {string[]} tokens
 * @param {object}   payload  { title, body, noticeId, author, isUpdate }
 */
function buildMulticastMessage(tokens, { title, body, noticeId, author, isUpdate = false }) {
  const prefix   = isUpdate ? '🔔 공지 수정' : '📢 새 공지';
  const fullTitle = `${prefix}: ${title}`;

  return {
    tokens,

    // ── 공통 알림 ──────────────────────────────────────────────
    notification: {
      title: fullTitle,
      body,
    },

    // ── 웹 푸시 ───────────────────────────────────────────────
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title:              fullTitle,
        body,
        icon:               ICON_PATH,
        badge:              BADGE_PATH,
        tag:                NOTICE_TAG,
        renotify:           true,              // 같은 tag여도 재알림
        requireInteraction: false,
        vibrate:            [200, 100, 200, 100, 200],
        timestamp:          Date.now(),
        actions: [
          { action: 'open',    title: '📋 공지 보기' },
          { action: 'dismiss', title: '✕ 닫기'       },
        ],
        // 알림 본문에 작성자 표기
        dir: 'auto',
        lang: 'ko-KR',
      },
      fcmOptions: {
        link: NOTICE_LINK,
      },
      data: {
        url:      NOTICE_LINK,
        noticeId: String(noticeId),
        title,
        author:   String(author),
        isUpdate: String(isUpdate),
        sentAt:   Date.now().toString(),
      },
    },

    // ── Android ───────────────────────────────────────────────
    android: {
      notification: {
        icon:         'ic_notification',
        color:        '#f4c430',
        channelId:    'roider_notice',
        priority:     'high',
        defaultSound: true,
        clickAction:  'FLUTTER_NOTIFICATION_CLICK',
      },
      priority: 'high',
      data: {
        url:      NOTICE_LINK,
        noticeId: String(noticeId),
      },
    },

    // ── iOS ───────────────────────────────────────────────────
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          badge:             1,
          sound:             'default',
          'content-available': 1,
          alert: { title: fullTitle, body },
        },
      },
    },
  };
}

/**
 * fcmTokens 컬렉션에서 활성 토큰 조회
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} excludeUid  제외할 UID (공지 작성자)
 * @returns {{ tokens: string[], uids: string[] }}
 */
async function fetchActiveTokens(db, excludeUid = '') {
  const tokens = [];
  const uids   = [];

  const snap = await db.collection('fcmTokens')
    .where('active', '==', true)
    .get();

  // 디버그: 전체 조회 결과 로깅
  logger.info(`[FCM] fcmTokens 전체 조회 결과: ${snap.size}개 (excludeUid="${excludeUid}")`);
  snap.forEach((doc) => {
    logger.info(`[FCM] 토큰 후보 uid=${doc.id} active=${doc.data().active} hasToken=${!!doc.data().token}`);
  });

  snap.forEach((doc) => {
    const d = doc.data();
    if (!d.token) {
      logger.warn(`[FCM] uid=${doc.id} 토큰 없음 → 스킵`);
      return;
    }
    // 작성자 본인 제외 비활성화 (소규모 앱에서는 본인도 수신)
    // if (excludeUid && d.uid === excludeUid) { return; }
    tokens.push(d.token);
    uids.push(doc.id);
  });

  return { tokens, uids };
}

/**
 * 배치 멀티캐스트 발송 + 무효 토큰 수집
 * @returns {{ successCount, failureCount, invalidUids }}
 */
async function sendBatched(messaging, tokens, uids, payload) {
  let successCount = 0;
  let failureCount = 0;
  const invalidUids = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batchTokens = tokens.slice(i, i + BATCH_SIZE);
    const batchUids   = uids.slice(i, i + BATCH_SIZE);

    const msg = buildMulticastMessage(batchTokens, payload);

    try {
      const res = await messaging.sendEachForMulticast(msg);
      successCount += res.successCount;
      failureCount += res.failureCount;

      res.responses.forEach((r, idx) => {
        if (r.success) return;
        const code = r.error?.code || '';
        logger.warn(`[FCM] Fail uid=${batchUids[idx]} code=${code}`);

        // 등록 취소 / 유효하지 않은 토큰 → 삭제 대상
        if ([
          'messaging/registration-token-not-registered',
          'messaging/invalid-registration-token',
          'messaging/unregistered',
          'messaging/invalid-argument',
        ].includes(code)) {
          invalidUids.push(batchUids[idx]);
        }
      });
    } catch (err) {
      logger.error(`[FCM] Batch ${i}-${i + BATCH_SIZE} error:`, err.message);
      failureCount += batchTokens.length;
    }

    // 다음 배치 전 딜레이 (rate-limit 방지)
    if (i + BATCH_SIZE < tokens.length) await sleep(BATCH_DELAY);
  }

  return { successCount, failureCount, invalidUids };
}

/**
 * 무효 토큰 Firestore 일괄 삭제
 */
async function purgeInvalidTokens(db, invalidUids) {
  if (invalidUids.length === 0) return;
  const batch = db.batch();
  invalidUids.forEach((uid) =>
    batch.delete(db.collection('fcmTokens').doc(uid))
  );
  await batch.commit();
  logger.info(`[FCM] Purged ${invalidUids.length} invalid token(s)`);
}

/**
 * 발송 결과를 pushLogs 컬렉션에 저장
 */
async function writePushLog(db, logData) {
  try {
    await db.collection('pushLogs').add({
      ...logData,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // 로그 실패는 무시 (non-critical)
    logger.warn('[FCM] pushLogs write failed:', e.message);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
//  1.  신규 공지 → FCM 발송
// ═══════════════════════════════════════════════════════════════════════════
exports.sendNoticeNotification = onDocumentCreated(
  {
    document:       'notice/{noticeId}',
    region:         REGION,
    timeoutSeconds: 60,
    memory:         '256MiB',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return null;

    const data     = snap.data();
    const noticeId = event.params.noticeId;

    // 유효성 검사
    if (!data.title || !data.content) {
      logger.info('[FCM] Notice missing title/content → skip');
      return null;
    }

    logger.info(`[FCM][NEW] noticeId=${noticeId} title="${data.title}"`);

    const db        = getFirestore();
    const messaging = getMessaging();
    const payload   = {
      title:    data.title,
      body:     truncate(data.content),
      noticeId,
      author:   data.author    || '운영진',
      isUpdate: false,
    };

    // 토큰 조회
    const { tokens, uids } = await fetchActiveTokens(db, data.authorUid || '');
    if (tokens.length === 0) {
      logger.info('[FCM] No active tokens → skip');
      return null;
    }
    logger.info(`[FCM] Target devices: ${tokens.length}`);

    // 발송
    const { successCount, failureCount, invalidUids } =
      await sendBatched(messaging, tokens, uids, payload);

    logger.info(`[FCM] success=${successCount} failure=${failureCount}`);

    // 무효 토큰 정리
    await purgeInvalidTokens(db, invalidUids);

    // 발송 로그
    await writePushLog(db, {
      type:           'new_notice',
      noticeId,
      title:          data.title,
      targetCount:    tokens.length,
      successCount,
      failureCount,
      invalidCleaned: invalidUids.length,
    });

    return { successCount, failureCount };
  }
);


// ═══════════════════════════════════════════════════════════════════════════
//  2.  공지 수정 → FCM 재발송 (제목 또는 내용이 실질적으로 바뀐 경우만)
// ═══════════════════════════════════════════════════════════════════════════
exports.sendNoticeUpdatedNoti = onDocumentUpdated(
  {
    document:       'notice/{noticeId}',
    region:         REGION,
    timeoutSeconds: 60,
    memory:         '256MiB',
  },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    const noticeId = event.params.noticeId;

    // 제목/내용이 바뀌지 않으면 무시 (조회수, 좋아요 등 메타 업데이트 제외)
    const titleChanged   = before.title   !== after.title;
    const contentChanged = before.content !== after.content;
    if (!titleChanged && !contentChanged) {
      logger.info(`[FCM][UPDATE] noticeId=${noticeId} — no content change, skip`);
      return null;
    }

    logger.info(`[FCM][UPDATE] noticeId=${noticeId} title="${after.title}"`);

    const db        = getFirestore();
    const messaging = getMessaging();
    const payload   = {
      title:    after.title,
      body:     truncate(after.content),
      noticeId,
      author:   after.author || '운영진',
      isUpdate: true,
    };

    const { tokens, uids } = await fetchActiveTokens(db, after.authorUid || '');
    if (tokens.length === 0) return null;

    const { successCount, failureCount, invalidUids } =
      await sendBatched(messaging, tokens, uids, payload);

    await purgeInvalidTokens(db, invalidUids);
    await writePushLog(db, {
      type:           'updated_notice',
      noticeId,
      title:          after.title,
      targetCount:    tokens.length,
      successCount,
      failureCount,
      invalidCleaned: invalidUids.length,
    });

    logger.info(`[FCM][UPDATE] success=${successCount} failure=${failureCount}`);
    return { successCount, failureCount };
  }
);


// ═══════════════════════════════════════════════════════════════════════════
//  3.  관리자 전용 테스트 발송 (HTTP Callable)
//      클라이언트: firebase.functions().httpsCallable('sendTestPush')({ uid })
// ═══════════════════════════════════════════════════════════════════════════
exports.sendTestPush = onCall(
  {
    region:  REGION,
    memory:  '128MiB',
  },
  async (request) => {
    // 인증 확인
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const callerUid = request.auth.uid;
    const db        = getFirestore();

    // 호출자 역할 확인 (admin만 허용)
    const userDoc = await db.collection('users').doc(callerUid).get();
    if (!userDoc.exists || !['admin'].includes(userDoc.data()?.role)) {
      throw new HttpsError('permission-denied', '관리자만 테스트 발송이 가능합니다.');
    }

    // 본인 토큰만 조회 (테스트이므로 자신에게만 발송)
    const tokenSnap = await db.collection('fcmTokens').doc(callerUid).get();
    if (!tokenSnap.exists || !tokenSnap.data()?.token) {
      throw new HttpsError('not-found', '등록된 FCM 토큰이 없습니다. 알림 권한을 먼저 허용해 주세요.');
    }

    const token = tokenSnap.data().token;
    const messaging = getMessaging();

    try {
      const msgId = await messaging.send({
        token,
        notification: {
          title: '🔧 테스트 알림',
          body:  'Phoenix Guild 푸시 알림이 정상 작동합니다!',
        },
        webpush: {
          notification: {
            icon:  ICON_PATH,
            badge: BADGE_PATH,
            tag:   'roider-test',
          },
          fcmOptions: { link: NOTICE_LINK },
        },
      });
      logger.info(`[TEST] Sent to uid=${callerUid} msgId=${msgId}`);
      return { success: true, message: '테스트 알림이 발송되었습니다.' };
    } catch (err) {
      logger.error('[TEST] Send error:', err.message);
      throw new HttpsError('internal', `발송 실패: ${err.message}`);
    }
  }
);


// ═══════════════════════════════════════════════════════════════════════════
//  4.  스케줄러 — 30일 미갱신 토큰 비활성화 (매일 새벽 2시 KST)
// ═══════════════════════════════════════════════════════════════════════════
exports.cleanupStaleTokens = onSchedule(
  {
    schedule:  '0 2 * * *',           // 매일 02:00 KST
    timeZone:  'Asia/Seoul',
    region:    REGION,
    memory:    '128MiB',
    timeoutSeconds: 120,
  },
  async () => {
    const db     = getFirestore();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30일 전

    logger.info(`[Cleanup] cutoff=${cutoff.toISOString()}`);

    try {
      // 30일 이상 updatedAt이 없는 토큰 비활성화
      const staleSnap = await db.collection('fcmTokens')
        .where('active',    '==', true)
        .where('updatedAt', '<',  cutoff)
        .get();

      if (staleSnap.empty) {
        logger.info('[Cleanup] No stale tokens found');
        return null;
      }

      // 배치 업데이트 (500개 단위)
      let deactivated = 0;
      for (let i = 0; i < staleSnap.docs.length; i += 500) {
        const batch = db.batch();
        staleSnap.docs.slice(i, i + 500).forEach((doc) =>
          batch.update(doc.ref, { active: false, deactivatedAt: FieldValue.serverTimestamp() })
        );
        await batch.commit();
        deactivated += Math.min(500, staleSnap.docs.length - i);
      }

      logger.info(`[Cleanup] Deactivated ${deactivated} stale token(s)`);

      // 비활성화 로그 기록
      await writePushLog(db, {
        type:        'cleanup',
        deactivated,
        cutoff:      cutoff.toISOString(),
      });
    } catch (e) {
      logger.error('[Cleanup] Error:', e.message);
    }

    return null;
  }
);


// ═══════════════════════════════════════════════════════════════════════════
//  5.  GeoIP 자동 업데이트 — 매일 새벽 3시 KST
// ═══════════════════════════════════════════════════════════════════════════

const https_module = require('node:https');
const http_module  = require('node:http');

/** GeoIP Provider 목록 (서버 사이드 Node.js 전용) */
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
      headers: { 'User-Agent': 'Phoenix-Guild-CF-GeoIP/2.1' },
      timeout: timeoutMs,
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode === 200, status: res.statusCode, json: () => JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error',   (e) => reject(e));
  });
}

/** IP 기반 GeoIP 조회 (서버 환경용, IPv4 전용) */
async function geoLookupByIP(ip) {
  if (!ip || !/^[\d.]+$/.test(ip)) return null;

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
    } catch (_) { /* 다음 provider 시도 */ }
  }
  return null;
}

/**
 * 5-1. 스케줄러 — 매일 새벽 3시 KST, country 없는 회원 자동 감지
 */
exports.scheduledGeoUpdate = onSchedule(
  {
    schedule       : '0 3 * * *',
    timeZone       : 'Asia/Seoul',
    region         : REGION,
    memory         : '256MiB',
    timeoutSeconds : 540,
  },
  async () => {
    const db       = getFirestore();
    const BATCH_MS = 1200;

    logger.info('[GeoIP-Schedule] 시작');

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
      if (!geo)   { fail++; continue; }

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

      await sleep(BATCH_MS);
    }

    logger.info(`[GeoIP-Schedule] 완료 — success:${success} fail:${fail}`);
    return null;
  }
);


/**
 * 5-2. HTTP Callable — 관리자 즉시 GeoIP 갱신 트리거
 *   클라이언트: firebase.functions().httpsCallable('triggerGeoUpdate')({ force, targetUid })
 */
exports.triggerGeoUpdate = onCall(
  {
    region        : REGION,
    memory        : '256MiB',
    timeoutSeconds: 540,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const db = getFirestore();

    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', '관리자만 실행 가능합니다.');
    }

    const { force = false, targetUid = null } = request.data || {};

    let queryDocs;
    if (targetUid) {
      const single = await db.collection('users').doc(targetUid).get();
      queryDocs = single.exists ? [single] : [];
    } else {
      const q = await db.collection('users').where('role', '!=', 'pending').get();
      queryDocs = force ? q.docs : q.docs.filter((d) => !d.data().country);
    }

    logger.info(`[GeoIP-Callable] 대상: ${queryDocs.length}명 (force=${force})`);

    let success = 0, fail = 0;
    const summary = [];

    for (const doc of queryDocs) {
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

      await sleep(1200);
    }

    logger.info(`[GeoIP-Callable] 완료 success:${success} fail:${fail}`);
    return { success, fail, total: queryDocs.length, summary };
  }
);


// ═══════════════════════════════════════════════════════════════════════════
//  6.  Discord OAuth2 로그인 — 인증 코드 교환 + Firebase Custom Token 발급
// ═══════════════════════════════════════════════════════════════════════════
//
//  흐름:
//    ① 클라이언트  → Discord OAuth2 인증 URL 열기 (discord_callback.html)
//    ② Discord     → redirect_uri?code=XXX 로 콜백
//    ③ 클라이언트  → discordExchangeToken({ code }) 호출
//    ④ CF          → Discord API에 code 교환 → access_token 획득
//    ⑤ CF          → /users/@me 로 Discord 유저 정보 획득
//    ⑥ CF (옵션)   → /users/@me/guilds/{guildId}/member 로 서버닉 조회 (봇토큰 불필요)
//    ⑦ CF          → Firebase Admin Custom Token 발급 (uid = "discord:{discordId}")
//    ⑧ 클라이언트  → signInWithCustomToken() → 로그인 완료
//
//  필요한 Firebase 환경변수 (firebase functions:secrets:set 또는 .env.local):
//    DISCORD_CLIENT_ID     — Discord 앱 Client ID
//    DISCORD_CLIENT_SECRET — Discord 앱 Client Secret
//    DISCORD_GUILD_ID      — 닉네임 조회할 Discord 서버 ID (선택)
//    DISCORD_REDIRECT_URI  — 콜백 URI (https://your-domain.web.app/discord_callback.html)
//    DISCORD_BOT_TOKEN     — Discord Bot Token (역할 이름 조회용, /guilds/{id}/roles API)
//
// ═══════════════════════════════════════════════════════════════════════════

const { defineSecret } = require('firebase-functions/params');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');

// ─── Secret Manager 파라미터 정의 (Google Cloud Secret Manager 연동) ──────────
// 'firebase functions:secrets:set' 또는 Cloud Console에서 등록한 시크릿 참조
const DISCORD_CLIENT_ID     = defineSecret('DISCORD_CLIENT_ID');
const DISCORD_CLIENT_SECRET = defineSecret('DISCORD_CLIENT_SECRET');
const DISCORD_GUILD_ID      = defineSecret('DISCORD_GUILD_ID');
const DISCORD_REDIRECT_URI  = defineSecret('DISCORD_REDIRECT_URI');
const DISCORD_BOT_TOKEN     = defineSecret('DISCORD_BOT_TOKEN');

const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_UID_PREFIX = 'discord:';

/** Discord API 요청 헬퍼 */
async function discordFetch(path, accessToken, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${DISCORD_API}${path}`, opts);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Discord API ${path} → ${res.status}: ${errText}`);
  }
  return res.json();
}

/** Discord OAuth2 code → access_token 교환 */
async function exchangeDiscordCode(code, redirectUri, clientId, clientSecret) {
  const params = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    redirect_uri:  redirectUri,
    client_id:     clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Discord token exchange failed ${res.status}: ${errText}`);
  }
  return res.json();
}

/**
 * 6-1.  discordExchangeToken
 *   클라이언트: firebase.functions().httpsCallable('discordExchangeToken')({ code })
 *   반환: { customToken, discordUser: { id, username, globalName, avatar, serverNick } }
 */
exports.discordExchangeToken = onCall(
  {
    region:  REGION,
    memory:  '256MiB',
    // Secret Manager 시크릿을 이 함수에서 사용할 수 있도록 명시적으로 선언
    secrets: [DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, DISCORD_GUILD_ID, DISCORD_BOT_TOKEN],
    // GitHub Pages 등 외부 도메인에서 호출 허용
    cors: [
      'https://nella-dev.github.io',
      'https://roider-guild-management.web.app',
      'https://roider-guild-management.firebaseapp.com',
      'https://phoenix-guild-management.pages.dev',
    ],
  },
  async (request) => {
    const { code } = request.data || {};
    if (!code) throw new HttpsError('invalid-argument', 'code 파라미터가 필요합니다.');

    const clientId     = DISCORD_CLIENT_ID.value();
    const clientSecret = DISCORD_CLIENT_SECRET.value();
    const redirectUri  = DISCORD_REDIRECT_URI.value();
    const guildId      = DISCORD_GUILD_ID.value();

    logger.info(`[Discord] 환경변수 확인 — clientId=${clientId ? '✅' : '❌'} clientSecret=${clientSecret ? '✅' : '❌'} redirectUri=${redirectUri || '(비어있음)'}`);

    if (!clientId || !clientSecret || !redirectUri) {
      throw new HttpsError('failed-precondition', 'Discord OAuth 환경변수가 설정되지 않았습니다.');
    }

    // ① code → access_token 교환
    let tokenData;
    try {
      tokenData = await exchangeDiscordCode(code, redirectUri, clientId, clientSecret);
    } catch (e) {
      logger.error('[Discord] Token exchange error:', e.message);
      throw new HttpsError('unauthenticated', `Discord 인증 실패: ${e.message}`);
    }

    const accessToken = tokenData.access_token;

    // ② Discord 유저 정보 조회
    let discordUser;
    try {
      discordUser = await discordFetch('/users/@me', accessToken);
    } catch (e) {
      logger.error('[Discord] User fetch error:', e.message);
      throw new HttpsError('internal', `Discord 유저 조회 실패: ${e.message}`);
    }

    const discordId = discordUser.id;
    const firebaseUid = `${DISCORD_UID_PREFIX}${discordId}`;

    // ③ 서버 닉네임 + 역할 조회 (guildId 설정 시)
    let serverNick   = null;
    let serverAvatar = null;
    let memberRoles  = [];   // Discord 역할 ID 목록

    // Discord 역할 이름 → Firebase 권한 매핑
    // "Alliance Admin" 또는 "Synergies" 역할 보유 시 → manager
    const MANAGER_ROLE_NAMES = ['Alliance Admin', 'Synergies'];

    if (guildId) {
      try {
        const member = await discordFetch(
          `/users/@me/guilds/${guildId}/member`,
          accessToken
        );
        serverNick   = member.nick   || null;
        serverAvatar = member.avatar || null;
        memberRoles  = member.roles  || [];   // 역할 ID 배열

        logger.info(`[Discord] Guild member nick="${serverNick}" roles=${JSON.stringify(memberRoles)} guild=${guildId}`);

        // 역할 이름 조회 (Guild Roles API — Bot Token 불필요, OAuth2 guilds.members.read 스코프)
        // member.roles 는 ID 배열이므로 이름으로 비교하려면 Guild 역할 목록 필요
        // → /guilds/{guildId}/roles 는 Bot Token 필요 → member 객체의 roles 배열에서
        //   역할 이름을 직접 얻을 수 없으므로, Bot Token을 사용하거나
        //   Secret Manager에 저장된 DISCORD_BOT_TOKEN 으로 역할 이름을 조회
        // Bot Token 없이 처리하기 위해 member.roles ID 와 함께
        // Guild Roles를 Bot Token으로 조회
      } catch (e) {
        logger.warn(`[Discord] Guild member fetch failed (guild=${guildId}): ${e.message}`);
      }
    }

    // ③-2. 역할 이름 조회 및 Firebase 권한 결정
    // Discord Bot Token으로 서버 역할 목록 조회 → 역할 ID → 이름 매핑
    let assignedRole = 'member';  // 기본 권한

    if (guildId && memberRoles.length > 0) {
      try {
        const botToken = DISCORD_BOT_TOKEN.value();
        if (botToken) {
          const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            headers: { Authorization: `Bot ${botToken}` },
          });
          if (rolesRes.ok) {
            const guildRoles = await rolesRes.json();
            // 멤버가 보유한 역할 이름 추출
            const memberRoleNames = guildRoles
              .filter(r => memberRoles.includes(r.id))
              .map(r => r.name);
            logger.info(`[Discord] Member role names: ${JSON.stringify(memberRoleNames)}`);

            // manager 역할 여부 확인
            const isManager = MANAGER_ROLE_NAMES.some(name => memberRoleNames.includes(name));
            assignedRole = isManager ? 'manager' : 'member';
            logger.info(`[Discord] Assigned role: ${assignedRole}`);
          } else {
            const errText = await rolesRes.text().catch(() => '');
            logger.warn(`[Discord] Guild roles fetch failed ${rolesRes.status}: ${errText}`);
          }
        } else {
          logger.warn('[Discord] DISCORD_BOT_TOKEN 미설정 — 기본 member 권한 적용');
        }
      } catch (e) {
        logger.warn(`[Discord] Role fetch failed: ${e.message} — 기본 member 권한 적용`);
      }
    }

    // ④ Firebase Custom Token 발급
    const adminAuth = getAdminAuth();
    let customToken;
    try {
      customToken = await adminAuth.createCustomToken(firebaseUid, {
        discord:    true,
        discordId:  discordId,
        username:   discordUser.username,
        globalName: discordUser.global_name || discordUser.username,
      });
    } catch (e) {
      logger.error('[Discord] Custom token error:', e.message);
      throw new HttpsError('internal', `Firebase 토큰 발급 실패: ${e.message}`);
    }

    // ⑤ Firestore에 Discord 연동 정보 저장
    const db = getFirestore();
    const avatarHash  = discordUser.avatar;
    const avatarUrl   = avatarHash
      ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`;

    try {
      await db.collection('discordLinks').doc(firebaseUid).set({
        firebaseUid,
        discordId,
        username:    discordUser.username,
        globalName:  discordUser.global_name || discordUser.username,
        serverNick,
        serverAvatar,
        avatarUrl,
        linkedAt:    FieldValue.serverTimestamp(),
        updatedAt:   FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      logger.warn('[Discord] discordLinks write failed:', e.message);
    }

    // ⑥ users 컬렉션 자동 승인 + 권한 부여
    // Discord 로그인 유저는 pending 없이 바로 승인, 역할 자동 결정
    try {
      const userRef = db.collection('users').doc(firebaseUid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        // 신규 유저 — 자동 승인 + 역할 부여
        await userRef.set({
          uid:           firebaseUid,
          email:         discordUser.email || null,
          nickname:      serverNick || discordUser.global_name || discordUser.username,
          role:          assignedRole,
          loginProvider: 'discord',
          discordId,
          avatarUrl,
          createdAt:     FieldValue.serverTimestamp(),
          updatedAt:     FieldValue.serverTimestamp(),
        });
        logger.info(`[Discord] 신규 유저 생성 uid=${firebaseUid} role=${assignedRole}`);
      } else {
        // 기존 유저 — 역할만 업데이트 (강등 방지: admin은 유지)
        const existingRole = userSnap.data().role;
        const shouldUpdateRole = existingRole !== 'admin';  // admin은 변경하지 않음
        const updateData = {
          discordId,
          avatarUrl,
          loginProvider: 'discord',
          updatedAt:     FieldValue.serverTimestamp(),
        };
        if (shouldUpdateRole) {
          updateData.role = assignedRole;
        }
        await userRef.set(updateData, { merge: true });
        logger.info(`[Discord] 기존 유저 업데이트 uid=${firebaseUid} role=${shouldUpdateRole ? assignedRole : existingRole}(유지)`);
      }
    } catch (e) {
      logger.warn('[Discord] users 컬렉션 업데이트 실패:', e.message);
    }

    logger.info(`[Discord] Login success uid=${firebaseUid} username=${discordUser.username} role=${assignedRole} serverNick=${serverNick}`);

    return {
      customToken,
      assignedRole,   // 'manager' 또는 'member'
      discordUser: {
        id:         discordId,
        username:   discordUser.username,
        globalName: discordUser.global_name || discordUser.username,
        avatar:     avatarUrl,
        serverNick: serverNick,
        // 닉네임 우선순위: 서버닉 > globalName > username
        suggestedNick: serverNick || discordUser.global_name || discordUser.username,
      },
    };
  }
);


// ═══════════════════════════════════════════════════════════════════════════
//  7.  Discord Webhook 수신 — #yaphalla-guides 채널 → Firestore 저장
// ═══════════════════════════════════════════════════════════════════════════
//
//  설정 방법:
//    ① Discord 서버 관리자: #yaphalla-guides 채널 설정 → 연동 → 웹훅 만들기
//    ② 웹훅 URL 복사 (https://discord.com/api/webhooks/{id}/{token})
//    ③ Google Cloud Secret Manager에 DISCORD_WEBHOOK_SECRET 등록
//       (웹훅 URL의 토큰 부분 — 외부 검증용 시크릿)
//    ④ Discord 웹훅 URL 끝에 ?wait=true 추가 후 이 함수 URL 사용
//
//  실제 사용 방식:
//    Discord 서버봇 또는 외부 서비스가 이 Cloud Function URL로
//    Discord 웹훅 형식(JSON)으로 POST 요청을 보냄
//    → Firestore yaphalla_guide_posts 컬렉션에 저장
//    → yaphalla_guides.html 실시간 피드에 자동 반영
//
//  저장 필드:
//    discordMessageId, authorId, authorName, authorAvatar,
//    content, imageUrls[], channelName, channelId,
//    discordTimestamp, visible, createdAt
//
// ═══════════════════════════════════════════════════════════════════════════

const { onRequest } = require('firebase-functions/v2/https');

const DISCORD_WEBHOOK_SECRET = defineSecret('DISCORD_WEBHOOK_SECRET');

/**
 * Discord 웹훅 메시지 → 이미지 URL 목록 추출
 * attachments(파일 첨부) + embeds(임베드 이미지) 모두 처리
 */
function extractImageUrls(message) {
  const urls = [];

  // 파일 첨부 이미지
  if (Array.isArray(message.attachments)) {
    message.attachments.forEach(att => {
      const ct = (att.content_type || '').toLowerCase();
      if (ct.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(att.url || '')) {
        if (att.url) urls.push(att.url);
      }
    });
  }

  // 임베드 이미지 (image.url, thumbnail.url)
  if (Array.isArray(message.embeds)) {
    message.embeds.forEach(embed => {
      if (embed.image?.url)     urls.push(embed.image.url);
      if (embed.thumbnail?.url) urls.push(embed.thumbnail.url);
    });
  }

  return urls;
}

/**
 * 7-1.  discordYaphallaWebhook
 *
 *  Discord 채널에 설정된 아웃고잉 웹훅 또는 외부 봇이
 *  이 HTTP 엔드포인트로 메시지를 POST합니다.
 *
 *  보안:
 *    - DISCORD_WEBHOOK_SECRET 헤더 검증 (x-webhook-secret)
 *    - 중복 메시지 방지 (discordMessageId 기반 dedup)
 *
 *  요청 형식 (Content-Type: application/json):
 *  {
 *    "id":         "Discord 메시지 ID",
 *    "content":    "메시지 본문",
 *    "author": {
 *      "id":       "유저 ID",
 *      "username": "유저명",
 *      "avatar":   "아바타 해시"  // nullable
 *    },
 *    "attachments": [...],   // 파일 첨부
 *    "embeds":      [...],   // 임베드
 *    "channel_id":  "채널 ID",
 *    "timestamp":   "ISO 8601"
 *  }
 */
exports.discordYaphallaWebhook = onRequest(
  {
    region:  REGION,
    memory:  '256MiB',
    secrets: [DISCORD_WEBHOOK_SECRET],
    cors:    false,   // 서버 간 통신이므로 CORS 불필요
  },
  async (req, res) => {
    // ① POST 메서드만 허용
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    // ② 시크릿 헤더 검증
    const webhookSecret = DISCORD_WEBHOOK_SECRET.value();
    if (webhookSecret) {
      const receivedSecret = req.headers['x-webhook-secret'] || '';
      if (receivedSecret !== webhookSecret) {
        logger.warn('[Webhook] Unauthorized request — invalid secret');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }

    const body = req.body;
    if (!body) {
      res.status(400).json({ error: 'Empty body' });
      return;
    }

    // ③ 메시지 파싱
    const messageId  = body.id || null;
    const content    = (body.content || '').trim();
    const channelId  = body.channel_id || body.channelId || null;
    const channelName = body.channel_name || body.channelName || 'yaphalla-guides';

    // 봇 메시지 또는 시스템 메시지 무시
    if (body.type && body.type !== 0 && body.type !== 'DEFAULT') {
      res.status(200).json({ status: 'ignored', reason: 'non-default message type' });
      return;
    }

    // 내용도 이미지도 없으면 무시
    const imageUrls = extractImageUrls(body);
    if (!content && imageUrls.length === 0) {
      res.status(200).json({ status: 'ignored', reason: 'empty message' });
      return;
    }

    // ④ 작성자 정보
    const author = body.author || body.member?.user || {};
    const authorId   = author.id       || 'unknown';
    const authorName = author.username  || author.global_name || '알 수 없음';
    const avatarHash = author.avatar    || null;
    const authorAvatar = avatarHash
      ? `https://cdn.discordapp.com/avatars/${authorId}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(authorId || '0') % 5}.png`;

    // ⑤ 타임스탬프
    let discordTimestamp;
    try {
      discordTimestamp = body.timestamp
        ? Timestamp.fromDate(new Date(body.timestamp))
        : FieldValue.serverTimestamp();
    } catch (_) {
      discordTimestamp = FieldValue.serverTimestamp();
    }

    const db = getFirestore();

    // ⑥ 중복 방지 — 같은 messageId가 이미 존재하면 스킵
    if (messageId) {
      const existing = await db.collection('yaphalla_guide_posts')
        .where('discordMessageId', '==', messageId)
        .limit(1)
        .get();
      if (!existing.empty) {
        logger.info(`[Webhook] Duplicate messageId=${messageId} — skipped`);
        res.status(200).json({ status: 'duplicate' });
        return;
      }
    }

    // ⑦ Firestore에 저장
    try {
      const docData = {
        discordMessageId: messageId,
        channelId,
        channelName,
        authorId,
        authorName,
        authorAvatar,
        content:          content || null,
        imageUrls,
        discordTimestamp,
        visible:          true,
        createdAt:        FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('yaphalla_guide_posts').add(docData);
      logger.info(`[Webhook] Saved yaphalla_guide_posts/${docRef.id} author=${authorName} images=${imageUrls.length}`);

      res.status(200).json({ status: 'ok', docId: docRef.id });
    } catch (e) {
      logger.error('[Webhook] Firestore write error:', e.message);
      res.status(500).json({ error: 'Firestore write failed' });
    }
  }
);
