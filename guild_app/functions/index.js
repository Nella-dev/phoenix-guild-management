/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  functions/index.js  ·  ROIDER GUILD — Firebase Cloud Functions  v2.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Export 목록:
 *  ┌─────────────────────────────┬──────────────────────────────────────────┐
 *  │ sendNoticeNotification      │ 신규 공지 생성 → 전체 구독자 FCM 발송    │
 *  │ sendNoticeUpdatedNoti       │ 공지 수정(중요 변경) → FCM 재발송        │
 *  │ sendTestPush                │ HTTP Callable — 관리자 테스트 발송       │
 *  │ cleanupStaleTokens          │ 스케줄러 — 30일 미갱신 토큰 비활성화     │
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
const { getFirestore, FieldValue }             = require('firebase-admin/firestore');
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
          body:  'ROIDER GUILD 푸시 알림이 정상 작동합니다!',
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
