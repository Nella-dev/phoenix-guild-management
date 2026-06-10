#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🔍  ROIDER GUILD — GeoIP 현황 리포트 스크립트
 *  geoip_report.js
 *
 *  실행: node geoip_report.js
 *  기능: Firestore users 컬렉션의 국가 정보 현황을 분석해 콘솔 출력
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const path  = require('path');
const fs    = require('fs');
const admin = require('firebase-admin');

const KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

const C = {
  reset : '\x1b[0m',  bold: '\x1b[1m',
  green : '\x1b[32m', yellow: '\x1b[33m',
  red   : '\x1b[31m', cyan: '\x1b[36m',
  gray  : '\x1b[90m', white: '\x1b[97m',
  blue  : '\x1b[34m',
};

async function main() {
  if (!fs.existsSync(KEY_PATH)) {
    console.error('❌ serviceAccountKey.json 없음');
    process.exit(1);
  }

  const sa = require(KEY_PATH);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  const db = admin.firestore();

  console.log(`\n${C.bold}${C.white}════ 🌍 GeoIP 현황 리포트 ════${C.reset}\n`);
  console.log(`${C.gray}프로젝트: ${sa.project_id}${C.reset}`);
  console.log(`${C.gray}분석 시각: ${new Date().toLocaleString('ko-KR')}${C.reset}\n`);

  const snap = await db.collection('users').get();
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.role !== 'pending');

  const total       = users.length;
  const hasCountry  = users.filter(u => u.country).length;
  const noCountry   = users.filter(u => !u.country).length;
  const hasCity     = users.filter(u => u.geoCity).length;
  const hasLastIP   = users.filter(u => u.lastIP).length;

  // 커버리지 바
  const pct     = total ? Math.round(hasCountry / total * 100) : 0;
  const barFill = Math.round(pct / 5);
  const bar     = C.green + '█'.repeat(barFill) + C.gray + '░'.repeat(20 - barFill) + C.reset;

  console.log(`${C.bold}전체 회원 (승인): ${total}명${C.reset}`);
  console.log(`국가 정보 보유  : ${C.green}${hasCountry}명${C.reset} [${bar}] ${C.bold}${pct}%${C.reset}`);
  console.log(`국가 정보 없음  : ${noCountry > 0 ? C.yellow : C.gray}${noCountry}명${C.reset}`);
  console.log(`도시 정보 보유  : ${C.cyan}${hasCity}명${C.reset}`);
  console.log(`lastIP 보유     : ${C.blue}${hasLastIP}명${C.reset}`);
  console.log('');

  // 국가별 분포
  const countryMap = {};
  users.filter(u => u.country).forEach(u => {
    const code = u.country.toUpperCase();
    countryMap[code] = (countryMap[code] || 0) + 1;
  });

  const sorted = Object.entries(countryMap).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    console.log(`${C.bold}── 국가별 분포 ──${C.reset}`);
    sorted.forEach(([code, cnt], i) => {
      const barW  = Math.round(cnt / total * 30);
      const mini  = C.yellow + '▌'.repeat(barW) + C.reset;
      const pctC  = Math.round(cnt / total * 100);
      console.log(`  ${String(i+1).padStart(2)}. ${C.bold}${code}${C.reset}  ${mini}  ${cnt}명 (${pctC}%)`);
    });
    console.log('');
  }

  // Provider별 감지 현황
  const provMap = {};
  users.filter(u => u.geoProvider).forEach(u => {
    provMap[u.geoProvider] = (provMap[u.geoProvider] || 0) + 1;
  });
  if (Object.keys(provMap).length > 0) {
    console.log(`${C.bold}── Provider별 감지 현황 ──${C.reset}`);
    Object.entries(provMap).sort((a,b) => b[1]-a[1]).forEach(([name, cnt]) => {
      console.log(`  ${name.padEnd(20)} ${cnt}명`);
    });
    console.log('');
  }

  // 국가 없는 회원 목록
  const noGeoUsers = users.filter(u => !u.country);
  if (noGeoUsers.length > 0) {
    console.log(`${C.bold}${C.yellow}── 국가 정보 없는 회원 (${noGeoUsers.length}명) ──${C.reset}`);
    noGeoUsers.forEach(u => {
      const ip = u.lastIP ? `lastIP: ${u.lastIP}` : 'lastIP: 없음';
      console.log(`  • ${(u.nickname || u.id).padEnd(20)} ${C.gray}(${u.role || 'member'}) ${ip}${C.reset}`);
    });
    console.log('');
    if (noGeoUsers.filter(u => !u.lastIP).length > 0) {
      console.log(`${C.gray}  💡 lastIP가 없는 회원은 다음 로그인 시 자동 저장됩니다.${C.reset}`);
      console.log(`${C.gray}     lastIP 저장 후 --force 옵션으로 재실행하면 업데이트됩니다.${C.reset}`);
    }
  } else {
    console.log(`${C.green}✅ 모든 회원의 국가 정보가 등록되어 있습니다!${C.reset}`);
  }

  console.log('\n');
}

main().catch(e => { console.error(e); process.exit(1); });
