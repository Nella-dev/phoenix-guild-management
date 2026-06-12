// ══════════════════════════════════════════════════════════════════
//  Phoenix Guild Discord Bot — bot.js
//
//  담당 채널:
//    - #yaphalla-guides  → Firestore yaphalla_guide_posts 컬렉션
//
//  기능:
//    ① 새 메시지 저장 (텍스트 + 이미지 첨부 + embed 이미지)
//    ② 메시지 수정 → Firestore 문서 content / imageUrls 업데이트
//    ③ 메시지 삭제 → visible: false (데이터 보존)
//    ④ 봇 자신의 메시지 무시
//
//  필요 Gateway Intents (Discord Developer Portal):
//    - MESSAGE CONTENT INTENT ✅ (반드시 활성화)
//
//  필요 Bot Permissions:
//    - View Channels
//    - Read Message History
// ══════════════════════════════════════════════════════════════════

'use strict';

require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const admin = require('firebase-admin');

// ── Firebase Admin 초기화 ─────────────────────────────────────────
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Railway 등 환경변수로 JSON 전달 (권장)
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON 파싱 실패:', e.message);
    process.exit(1);
  }
} else {
  // 로컬 파일 방식
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
  try {
    serviceAccount = require(path);
  } catch (e) {
    console.error(`❌ 서비스 계정 파일 로드 실패 (${path}):`, e.message);
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || 'roider-guild-management',
});

const db = admin.firestore();

// ── 컬렉션 설정 ───────────────────────────────────────────────────
// #yaphalla-guides → yaphalla_guide_posts
const YAPHALLA_COLLECTION = process.env.YAPHALLA_COLLECTION || 'yaphalla_guide_posts';

// ── 감시 채널 ID 목록 ─────────────────────────────────────────────
// .env 의 WATCH_CHANNEL_IDS 에 채널 ID를 쉼표로 구분하여 입력
// 예) WATCH_CHANNEL_IDS=123456789012345678
const WATCH_IDS = (process.env.WATCH_CHANNEL_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

console.log('🤖 Phoenix Guild Bot 시작...');
console.log(`📁 컬렉션: ${YAPHALLA_COLLECTION}`);
console.log('📡 감시 채널:', WATCH_IDS.length > 0 ? WATCH_IDS : '(미설정 — 모든 채널)');

// ── Discord Client ─────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Developer Portal에서 반드시 활성화 필요
  ],
});

// ── 이미지 URL 추출 헬퍼 ──────────────────────────────────────────
function extractImageUrls(message) {
  const urls = [];

  // 첨부파일 이미지
  message.attachments.forEach(att => {
    const ct = att.contentType || '';
    if (ct.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(att.name || '')) {
      urls.push(att.url);
    }
  });

  // Embed 이미지 (image / thumbnail)
  message.embeds.forEach(embed => {
    if (embed.image?.url)     urls.push(embed.image.url);
    if (embed.thumbnail?.url) urls.push(embed.thumbnail.url);
  });

  return [...new Set(urls)]; // 중복 제거
}

// ── 채널 필터 ─────────────────────────────────────────────────────
function isWatched(channelId) {
  if (WATCH_IDS.length === 0) return true; // 미설정 시 모든 채널
  return WATCH_IDS.includes(channelId);
}

// ══════════════════════════════════════════════════════════════════
//  이벤트: 새 메시지
// ══════════════════════════════════════════════════════════════════
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (!isWatched(message.channelId)) return;

  const imageUrls = extractImageUrls(message);
  if (!message.content && imageUrls.length === 0) return;

  try {
    const authorName   = message.member?.displayName || message.author.globalName || message.author.username;
    const authorAvatar = message.author.displayAvatarURL({ size: 128, extension: 'webp', forceStatic: false });

    const data = {
      discordMessageId : message.id,
      channelId        : message.channelId,
      channelName      : message.channel?.name || '',
      authorId         : message.author.id,
      authorName,
      authorAvatar,
      content          : message.content || null,
      imageUrls,
      discordTimestamp : admin.firestore.Timestamp.fromDate(message.createdAt),
      visible          : true,
      createdAt        : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt        : admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(YAPHALLA_COLLECTION).doc(message.id).set(data);
    console.log(`✅ [${data.channelName}] ${authorName} — 이미지 ${imageUrls.length}개 저장`);

  } catch (err) {
    console.error('❌ 저장 실패:', err.message);
  }
});

// ══════════════════════════════════════════════════════════════════
//  이벤트: 메시지 수정
// ══════════════════════════════════════════════════════════════════
client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
  if (newMsg.author?.bot) return;
  if (!isWatched(newMsg.channelId)) return;

  // 내용 변화 없으면 무시 (embed 로드 등으로 update 이벤트 중복 발생 방지)
  if (oldMsg.content === newMsg.content && oldMsg.attachments.size === newMsg.attachments.size) return;

  try {
    const imageUrls = extractImageUrls(newMsg);
    await db.collection(YAPHALLA_COLLECTION).doc(newMsg.id).update({
      content      : newMsg.content || null,
      imageUrls,
      updatedAt    : admin.firestore.FieldValue.serverTimestamp(),
      edited       : true,
    });
    console.log(`✏️ 수정됨: ${newMsg.id}`);
  } catch (err) {
    // 문서가 없으면 무시 (감시 시작 전 메시지)
    if (err.code !== 5) console.error('❌ 수정 업데이트 실패:', err.message);
  }
});

// ══════════════════════════════════════════════════════════════════
//  이벤트: 메시지 삭제 → visible: false
// ══════════════════════════════════════════════════════════════════
client.on(Events.MessageDelete, async message => {
  if (!isWatched(message.channelId)) return;
  try {
    await db.collection(YAPHALLA_COLLECTION).doc(message.id).update({
      visible   : false,
      deletedAt : admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`🗑️ 숨김 처리: ${message.id}`);
  } catch (_) {
    // 문서 없으면 무시
  }
});

// ══════════════════════════════════════════════════════════════════
//  봇 준비 완료
// ══════════════════════════════════════════════════════════════════
client.once(Events.ClientReady, c => {
  console.log(`\n✅ 로그인 완료: ${c.user.tag}`);
  console.log(`📋 서버 목록: ${[...c.guilds.cache.values()].map(g => g.name).join(', ')}`);
  console.log(`🔍 감시 채널 수: ${WATCH_IDS.length || '(전체)'}\n`);
});

// ── 봇 시작 ───────────────────────────────────────────────────────
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN 환경변수가 설정되지 않았습니다!');
  process.exit(1);
}

client.login(token).catch(err => {
  console.error('❌ Discord 로그인 실패:', err.message);
  process.exit(1);
});
