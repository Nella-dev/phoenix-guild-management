#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🌍  Phoenix Guild — GeoIP 일괄 업데이트 스크립트  v3.0
 *  geoip_batch_update.js
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  [v3.0 변경사항]
 *  • HTTP 429 Rate-Limit 완전 대응:
 *    - Provider별 blackout 타이머 (429 받으면 해당 provider X초간 비활성화)
 *    - 전체 provider 429 시 글로벌 쿨다운(60초) 후 자동 재시도
 *    - Retry-After 헤더 자동 파싱
 *  • Provider 순서 변경: geojs.io(무제한)를 1순위로 배치
 *  • 스크립트 실행 IP vs 사용자 실제 IP 분리 명확화
 *  • lastIP 없는 회원: Firestore 직접 저장 불가 → 건너뜀 + 요약 출력
 *  • --batch-size / --cooldown 옵션 추가
 *
 *  실행 방법:
 *    node geoip_batch_update.js                    # 기본 (country 없는 회원)
 *    node geoip_batch_update.js --dry-run          # Firestore 미반영 미리보기
 *    node geoip_batch_update.js --force            # 전체 강제 재감지
 *    node geoip_batch_update.js --delay 3000       # API 딜레이 3초
 *    node geoip_batch_update.js --batch-size 5     # 5명씩 처리 후 쿨다운
 *    node geoip_batch_update.js --cooldown 30      # 배치 간 30초 휴식
 *
 *  ⚠  중요: lastIP 필드가 없는 회원은 다음 로그인 이후 자동 업데이트됩니다.
 *           이 스크립트는 lastIP가 저장된 회원만 서버사이드 업데이트 가능합니다.
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const path    = require('path');
const fs      = require('fs');
const fetch   = require('node-fetch');
const admin   = require('firebase-admin');

// ─── CLI 인자 파싱 ────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const FORCE      = args.includes('--force');
const DAYS_IDX   = args.indexOf('--days');
const DAYS       = DAYS_IDX   >= 0 ? parseInt(args[DAYS_IDX   + 1], 10) || 7   : 7;
const DEL_IDX    = args.indexOf('--delay');
const DELAY_MS   = DEL_IDX    >= 0 ? parseInt(args[DEL_IDX    + 1], 10) || 2000 : 2000;
const BATCH_IDX  = args.indexOf('--batch-size');
const BATCH_SIZE = BATCH_IDX  >= 0 ? parseInt(args[BATCH_IDX  + 1], 10) || 10  : 10;
const COOL_IDX   = args.indexOf('--cooldown');
const COOLDOWN_S = COOL_IDX   >= 0 ? parseInt(args[COOL_IDX   + 1], 10) || 20  : 20;

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const KEY_PATH    = path.join(__dirname, 'serviceAccountKey.json');
const OUTPUT_DIR  = path.join(__dirname, 'output');
const GEO_TTL_MS  = DAYS * 24 * 60 * 60 * 1000;
const TIMEOUT_MS  = 7000;
const MAX_RETRIES = 2; // provider당 최대 재시도

// ─── Provider Blackout 상태 관리 ─────────────────────────────────────────────
// 429를 받은 provider는 blackoutUntil 시각까지 사용 안 함
const providerState = {};

function isBlackedOut(name) {
  const until = providerState[name];
  return until && Date.now() < until;
}

function blackout(name, seconds) {
  providerState[name] = Date.now() + seconds * 1000;
  log.warn(`${name} → ${seconds}초 블랙아웃 (Rate Limit 쿨다운)`);
}

// ─── GeoIP Provider 목록 ──────────────────────────────────────────────────────
//
//  ✅ 선택 근거:
//    • ip-api.com : 무료 HTTP only → HTTPS 호스팅에서 Mixed Content → 제외
//    • ipapi.co   : 1,000/일 BUT 같은 IP 단시간 다량 요청 시 429 빈번
//
//  ⚡ v3.0 변경: 무제한 geojs.io를 1순위로 이동
//
const PROVIDERS = [
  {
    // ① 무제한 (Cloudflare CDN 캐시) — rate limit 없음 → 1순위
    name     : 'geojs.io',
    rateNote : '무제한 (Cloudflare CDN)',
    urlFor   : (ip) => ip
      ? `https://get.geojs.io/v1/ip/geo/${ip}.json`
      : 'https://get.geojs.io/v1/ip/geo.json',
    parse    : (d) => ({
      country_code : d.country_code,
      country_name : d.country,
      city         : d.city,
      region       : d.region,
      timezone     : d.timezone,
      latitude     : parseFloat(d.latitude)  || null,
      longitude    : parseFloat(d.longitude) || null,
      org          : d.organization_name,
    }),
    validate : (d) => d && d.country_code && d.country_code !== 'XX',
  },
  {
    // ② 60 req/분 — 비교적 넉넉
    name     : 'freeipapi.com',
    rateNote : '60 req/분',
    urlFor   : (ip) => ip
      ? `https://freeipapi.com/api/json/${ip}`
      : 'https://freeipapi.com/api/json/',
    parse    : (d) => ({
      country_code : d.countryCode,
      country_name : d.countryName,
      city         : d.cityName,
      region       : d.regionName,
      timezone     : d.timeZone,
      latitude     : d.latitude,
      longitude    : d.longitude,
      org          : null,
    }),
    validate : (d) => d && d.ipVersion && d.countryCode && d.countryCode !== '-',
  },
  {
    // ③ 10,000/월 — 여유 있음
    name     : 'ipwho.is',
    rateNote : '10,000/월',
    urlFor   : (ip) => ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/',
    parse    : (d) => ({
      country_code : d.country_code,
      country_name : d.country,
      city         : d.city,
      region       : d.region,
      timezone     : d.timezone?.id || d.timezone,
      latitude     : d.latitude,
      longitude    : d.longitude,
      org          : d.connection?.org,
    }),
    validate : (d) => d && d.success !== false && d.country_code,
  },
  {
    // ④ 1,000/일 — 정확도 최고이지만 rate limit 주의
    name     : 'ipapi.co',
    rateNote : '1,000/일 (rate limit 주의)',
    urlFor   : (ip) => ip
      ? `https://ipapi.co/${ip}/json/`
      : 'https://ipapi.co/json/',
    parse    : (d) => ({
      country_code : d.country_code,
      country_name : d.country_name,
      city         : d.city,
      region       : d.region,
      timezone     : d.timezone,
      latitude     : d.latitude,
      longitude    : d.longitude,
      org          : d.org,
    }),
    validate : (d) => d && !d.error && d.country_code,
  },
];

// ─── 유틸리티 ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isValidCode = (c) => typeof c === 'string' && /^[A-Z]{2}$/.test(c.toUpperCase());

const C = {
  reset : '\x1b[0m',  bold: '\x1b[1m',
  green : '\x1b[32m', yellow: '\x1b[33m',
  red   : '\x1b[31m', cyan: '\x1b[36m',
  gray  : '\x1b[90m', white: '\x1b[97m',
  blue  : '\x1b[34m', magenta: '\x1b[35m',
};
const log = {
  info  : (...a) => console.log(C.cyan    + '[INFO]'   + C.reset, ...a),
  ok    : (...a) => console.log(C.green   + '[ OK ]'   + C.reset, ...a),
  warn  : (...a) => console.log(C.yellow  + '[WARN]'   + C.reset, ...a),
  err   : (...a) => console.log(C.red     + '[ERR ]'   + C.reset, ...a),
  skip  : (...a) => console.log(C.gray    + '[SKIP]'   + C.reset, ...a),
  dry   : (...a) => console.log(C.yellow  + '[DRY ]'   + C.reset, ...a),
  retry : (...a) => console.log(C.magenta + '[RETRY]'  + C.reset, ...a),
  cool  : (...a) => console.log(C.blue    + '[COOL ]'  + C.reset, ...a),
};

function printProgress(cur, total, label = '') {
  const pct    = Math.round((cur / total) * 100);
  const filled = Math.round(pct / 5);
  const bar    = '█'.repeat(filled) + '░'.repeat(20 - filled);
  process.stdout.write(`\r  [${bar}] ${pct}% (${cur}/${total}) ${label}          `);
  if (cur === total) process.stdout.write('\n');
}

/** 남은 쿨다운 시간을 mm:ss로 표시하며 대기 */
async function waitWithCountdown(seconds, reason = '쿨다운') {
  for (let s = seconds; s > 0; s--) {
    const min = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    process.stdout.write(`\r  ${C.blue}[COOL ]${C.reset} ${reason} — 재개까지 ${C.bold}${min}:${sec}${C.reset} 남음   `);
    await sleep(1000);
  }
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
}

// ─── 429 처리 포함 GeoIP 조회 ────────────────────────────────────────────────

async function detectGeoIP(ip = null) {
  // 사용 가능한 provider만 필터
  const available = PROVIDERS.filter(p => !isBlackedOut(p.name));
  if (available.length === 0) {
    // 모든 provider가 blackout → 가장 빨리 풀리는 것 대기
    const soonest = Math.min(...Object.values(providerState));
    const waitMs  = Math.max(0, soonest - Date.now()) + 500;
    log.cool(`모든 provider 블랙아웃 — ${Math.ceil(waitMs/1000)}초 후 재개`);
    await sleep(waitMs);
    // 상태 초기화 후 재귀 호출
    Object.keys(providerState).forEach(k => {
      if (Date.now() >= providerState[k]) delete providerState[k];
    });
    return detectGeoIP(ip);
  }

  for (const provider of available) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const url        = provider.urlFor(ip);
        const controller = new AbortController();
        const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(url, {
          signal : controller.signal,
          headers: {
            'User-Agent': 'Phoenix-Guild-GeoIP-Updater/3.0',
            'Accept'    : 'application/json',
          },
        });
        clearTimeout(timer);

        // ── 429 Rate Limit 처리 ────────────────────────────────────────────
        if (res.status === 429) {
          // Retry-After 헤더 확인 (초 단위)
          const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10);
          const waitSec    = retryAfter > 0 ? retryAfter + 2 : 60; // 기본 60초
          blackout(provider.name, waitSec);
          break; // 이 provider 포기, 다음 provider로
        }

        // ── 기타 HTTP 에러 ──────────────────────────────────────────────────
        if (!res.ok) {
          log.warn(`${provider.name} HTTP ${res.status} → 다음 시도`);
          if (attempt < MAX_RETRIES) {
            await sleep(1500 * (attempt + 1)); // 지수 백오프
            continue;
          }
          break;
        }

        // ── 응답 파싱 ───────────────────────────────────────────────────────
        const raw = await res.json();
        if (!provider.validate(raw)) {
          log.warn(`${provider.name} 유효성 실패 → 다음 시도`);
          break;
        }

        const info = provider.parse(raw);
        const code = (info.country_code || '').toString().toUpperCase().trim();

        if (!isValidCode(code)) {
          log.warn(`${provider.name} 코드 이상: "${info.country_code}" → 다음 시도`);
          break;
        }

        return {
          code      : code,
          name      : info.country_name || null,
          city      : info.city         || null,
          region    : info.region       || null,
          timezone  : info.timezone     || null,
          latitude  : info.latitude     || null,
          longitude : info.longitude    || null,
          org       : info.org          || null,
          via       : provider.name,
        };

      } catch (e) {
        const reason = e.name === 'AbortError' ? '타임아웃' : e.message;
        if (attempt < MAX_RETRIES) {
          log.warn(`${provider.name} 오류(${reason}) — ${attempt + 1}차 재시도`);
          await sleep(1000 * (attempt + 1));
        } else {
          log.warn(`${provider.name} 최종 실패: ${reason} → 다음 provider`);
        }
      }
    }
  }

  return null;
}

// ─── Firebase Admin 초기화 ────────────────────────────────────────────────────

function initFirebase() {
  if (!fs.existsSync(KEY_PATH)) {
    log.err('serviceAccountKey.json 없음!');
    log.err('Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성');
    log.err(`저장 위치: ${KEY_PATH}`);
    process.exit(1);
  }
  const sa = require(KEY_PATH);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  log.info(`Firebase 프로젝트: ${C.bold}${sa.project_id}${C.reset}`);
  return admin.firestore();
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log(C.bold + C.white + '═══════════════════════════════════════════════════════════' + C.reset);
  console.log(C.bold + C.white + '   🌍  Phoenix Guild — GeoIP 일괄 업데이트  v3.0           ' + C.reset);
  console.log(C.bold + C.white + '═══════════════════════════════════════════════════════════' + C.reset);
  console.log('');

  log.info(`모드      : ${DRY_RUN ? C.yellow + 'DRY-RUN' : FORCE ? C.red + 'FORCE (전체)' : C.green + '일반'}${C.reset}`);
  log.info(`딜레이    : ${DELAY_MS}ms / 요청`);
  log.info(`배치 크기 : ${BATCH_SIZE}명 → ${COOLDOWN_S}초 쿨다운`);
  log.info(`갱신 기준 : country 없거나 ${DAYS}일 경과`);
  console.log('');

  const db = initFirebase();

  // ── 1. 전체 users 조회 ─────────────────────────────────────────────────────
  log.info('Firestore users 로딩...');
  const snapshot  = await db.collection('users').get();
  const allUsers  = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  log.info(`전체 회원: ${C.bold}${allUsers.length}명${C.reset}`);
  console.log('');

  // ── 2. 대상 분류 ───────────────────────────────────────────────────────────
  const now = Date.now();
  const targets    = allUsers.filter(u => {
    if (u.role === 'pending') return false; // pending 제외
    if (FORCE) return true;
    if (!u.country) return true;
    const lastTs = u.geoUpdatedAt?.seconds ? u.geoUpdatedAt.seconds * 1000 : 0;
    return (now - lastTs) > GEO_TTL_MS;
  });

  // lastIP 보유 여부로 추가 분류
  const hasIP  = targets.filter(u =>  u.lastIP);
  const noIP   = targets.filter(u => !u.lastIP);
  const skip   = allUsers.length - targets.length;

  log.info(`업데이트 대상 : ${C.bold}${C.green}${targets.length}명${C.reset}`);
  log.info(`  ✅ lastIP 보유 (즉시 가능) : ${C.bold}${hasIP.length}명${C.reset}`);
  log.info(`  ⚠  lastIP 없음 (로그인 후 자동) : ${C.yellow}${noIP.length}명${C.reset}`);
  log.info(`스킵 (최신) : ${C.gray}${skip}명${C.reset}`);
  console.log('');

  // lastIP 없는 회원 안내
  if (noIP.length > 0) {
    console.log(C.yellow + '  ┌─ lastIP 없는 회원 (다음 로그인 시 자동 감지) ─' + C.reset);
    noIP.slice(0, 10).forEach(u => {
      console.log(C.gray + `  │  • ${(u.nickname || u.id).padEnd(20)} (${u.role || 'member'})` + C.reset);
    });
    if (noIP.length > 10) console.log(C.gray + `  │  ... 외 ${noIP.length - 10}명` + C.reset);
    console.log(C.yellow + '  └────────────────────────────────────────────────' + C.reset);
    console.log('');
  }

  if (hasIP.length === 0) {
    log.warn('lastIP 보유 회원이 없습니다. 회원들이 한번씩 로그인 후 재실행하세요.');
    log.info('(firebase_config.js의 lastIP 저장 로직이 적용된 버전 배포 필요)');
    process.exit(0);
  }

  // 예상 시간
  const estSec = Math.ceil(hasIP.length * DELAY_MS / 1000) +
                 Math.floor(hasIP.length / BATCH_SIZE) * COOLDOWN_S;
  log.info(`예상 소요: 약 ${Math.ceil(estSec / 60)}분 (${estSec}초)`);
  console.log('');

  // ── 3. 출력 디렉토리 ───────────────────────────────────────────────────────
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const ts      = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logPath = path.join(OUTPUT_DIR, `geoip_update_${ts}.json`);
  const csvPath = path.join(OUTPUT_DIR, `geoip_update_${ts}.csv`);

  // ── 4. 배치 처리 ───────────────────────────────────────────────────────────
  const results    = [];
  let successCount = 0, failCount = 0;

  console.log('─'.repeat(62));

  for (let i = 0; i < hasIP.length; i++) {
    const user    = hasIP[i];
    const uid     = user.id;
    const nick    = user.nickname || uid.slice(0, 8);
    const oldCode = user.country || '없음';

    printProgress(i + 1, hasIP.length, nick);

    const geo = await detectGeoIP(user.lastIP);

    const result = {
      uid, nickname: nick, email: user.email || '', role: user.role || 'member',
      lastIP: user.lastIP, oldCode,
      newCode: geo ? geo.code : null,
      city: geo ? geo.city : null,
      timezone: geo ? geo.timezone : null,
      via: geo ? geo.via : 'FAILED',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    if (!geo) {
      log.err(`\n  ${nick} — 모든 provider 실패`);
      failCount++;
      result.status = 'failed';
    } else if (!DRY_RUN) {
      try {
        const update = {
          country      : geo.code,
          geoProvider  : geo.via,
          geoUpdatedAt : admin.firestore.FieldValue.serverTimestamp(),
        };
        if (geo.city)      update.geoCity      = geo.city;
        if (geo.timezone)  update.geoTimezone  = geo.timezone;
        if (geo.region)    update.geoRegion    = geo.region;
        if (geo.latitude)  update.geoLatitude  = geo.latitude;
        if (geo.longitude) update.geoLongitude = geo.longitude;

        await db.collection('users').doc(uid).update(update);
        successCount++;
        result.status = 'updated';
      } catch (e) {
        log.err(`\n  ${nick} Firestore 오류: ${e.message}`);
        failCount++;
        result.status = 'firestore_error';
      }
    } else {
      log.dry(`\n  ${nick}: ${oldCode} → ${geo.code} (${geo.city || '-'}) via ${geo.via}`);
      successCount++;
      result.status = 'dry_run';
    }

    results.push(result);

    // ── 배치 간 쿨다운 ────────────────────────────────────────────────────
    const isLastItem    = (i === hasIP.length - 1);
    const batchComplete = ((i + 1) % BATCH_SIZE === 0) && !isLastItem;

    if (batchComplete) {
      console.log('');
      await waitWithCountdown(COOLDOWN_S, `배치 완료 (${i + 1}/${hasIP.length}명)`);
    } else if (!isLastItem) {
      await sleep(DELAY_MS);
    }
  }

  // ── 5. 결과 요약 ───────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(62)}`);
  console.log(C.bold + C.white + '═══════════════ 📊 결과 요약 ═══════════════' + C.reset);
  log.ok (`성공: ${C.bold}${successCount}명${C.reset}`);
  if (failCount > 0) log.err(`실패: ${C.bold}${failCount}명${C.reset}`);
  if (noIP.length > 0) log.warn(`lastIP 없어서 건너뜀: ${C.bold}${noIP.length}명${C.reset} → 다음 로그인 시 자동`);
  log.skip(`스킵(최신): ${skip}명`);
  console.log('');

  // Provider 통계
  const pStats = {};
  results.filter(r => r.via !== 'FAILED').forEach(r => {
    pStats[r.via] = (pStats[r.via] || 0) + 1;
  });
  if (Object.keys(pStats).length > 0) {
    log.info('Provider별 감지:');
    Object.entries(pStats).sort((a, b) => b[1] - a[1]).forEach(([name, cnt]) => {
      const bar = '▌'.repeat(Math.round(cnt / hasIP.length * 20));
      console.log(`    ${name.padEnd(18)} ${bar} ${cnt}명`);
    });
    console.log('');
  }

  // 국가 통계
  const cStats = {};
  results.filter(r => r.newCode).forEach(r => {
    cStats[r.newCode] = (cStats[r.newCode] || 0) + 1;
  });
  if (Object.keys(cStats).length > 0) {
    log.info('국가별 분포:');
    Object.entries(cStats).sort((a, b) => b[1] - a[1]).forEach(([code, cnt]) => {
      console.log(`    ${code}  ${cnt}명`);
    });
    console.log('');
  }

  // ── 6. 파일 저장 ───────────────────────────────────────────────────────────
  // noIP 회원도 결과에 포함
  const allResults = [
    ...results,
    ...noIP.map(u => ({
      uid: u.id, nickname: u.nickname, email: u.email, role: u.role,
      lastIP: null, oldCode: u.country || '없음', newCode: null,
      city: null, timezone: null, via: 'NO_IP',
      status: 'skipped_no_ip', timestamp: new Date().toISOString(),
    })),
  ];

  fs.writeFileSync(logPath, JSON.stringify({
    meta: {
      runAt: new Date().toISOString(), dryRun: DRY_RUN, force: FORCE,
      totalUsers: allUsers.length, targetCount: targets.length,
      hasIP: hasIP.length, noIP: noIP.length,
      successCount, failCount, skipCount: skip,
    },
    results: allResults,
  }, null, 2), 'utf-8');

  const csvHeader = 'uid,nickname,email,role,lastIP,oldCode,newCode,city,timezone,via,status,timestamp\n';
  const csvRows   = allResults.map(r =>
    [r.uid, `"${r.nickname}"`, `"${r.email}"`, r.role, r.lastIP || '',
     r.oldCode, r.newCode || '', `"${r.city || ''}"`,
     `"${r.timezone || ''}"`, r.via, r.status, r.timestamp].join(',')
  ).join('\n');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf-8');

  log.info(`결과 파일: ${logPath}`);
  log.info(`CSV 파일 : ${csvPath}`);
  console.log('');

  if (DRY_RUN) log.warn('DRY-RUN 완료. 실제 적용은 --dry-run 없이 실행하세요.');
  else if (successCount > 0) log.ok(`✅ Firestore 업데이트 완료! (${successCount}명)`);

  console.log('');
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => {
  log.err('치명적 오류:', e.message);
  console.error(e);
  process.exit(1);
});
