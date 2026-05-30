# 🌍 ROIDER GUILD — GeoIP 일괄 업데이트 도구

## 📁 파일 구성

```
geoip_updater/
├── geoip_batch_update.js   ← 핵심: Firestore 전체 스캔 + GeoIP 갱신
├── geoip_report.js         ← 현황 리포트 (국가별 분포, 미등록 목록)
├── functions_addon.js      ← functions/index.js에 추가할 Cloud Function
├── package.json
├── serviceAccountKey.json  ← ⚠ 본인이 직접 발급 후 저장 (Git 제외)
└── output/                 ← 실행 결과 JSON/CSV 자동 저장
```

---

## ⚡ 빠른 시작

### 1단계: 서비스 계정 키 발급

1. [Firebase Console](https://console.firebase.google.com) → `roider-guild-management` 프로젝트
2. **⚙️ 프로젝트 설정** → **서비스 계정** 탭
3. **새 비공개 키 생성** 버튼 클릭 → JSON 다운로드
4. 파일 이름을 `serviceAccountKey.json`으로 변경 후 이 폴더에 저장

> ⚠️ `serviceAccountKey.json`은 절대 Git에 커밋하지 마세요!

### 2단계: 의존성 설치

```bash
npm install
```

### 3단계: 현황 확인 (선택사항)

```bash
npm run report
```

출력 예시:
```
════ 🌍 GeoIP 현황 리포트 ════
전체 회원 (승인): 42명
국가 정보 보유  : 38명 [████████████████░░░░] 90%
국가 정보 없음  : 4명
도시 정보 보유  : 35명

── 국가별 분포 ──
   1. KR  ▌▌▌▌▌▌▌▌▌▌▌▌▌  30명 (71%)
   2. US  ▌▌▌             5명 (12%)
   3. JP  ▌▌              4명 (10%)
...
── 국가 정보 없는 회원 (4명) ──
  • PlayerXYZ      (member) lastIP: 없음
```

### 4단계: 미리보기 실행 (Dry-run)

```bash
npm run dry-run
```

> Firestore에는 아무것도 쓰지 않고, 어떤 결과가 나올지 미리 확인합니다.

### 5단계: 실제 업데이트 실행

```bash
npm run update
```

---

## 🔧 고급 옵션

| 명령어 | 설명 |
|--------|------|
| `npm run report` | 현황 리포트만 출력 |
| `npm run dry-run` | 미리보기 (Firestore 미반영) |
| `npm run update` | 기본 실행 (country 없거나 7일 경과 대상) |
| `npm run force` | 전체 강제 재감지 |
| `npm run update:slow` | 느린 실행 (API 딜레이 2초, rate-limit 방지) |

### 직접 옵션 조합

```bash
node geoip_batch_update.js --days 30          # 30일 경과 회원도 갱신
node geoip_batch_update.js --delay 2000       # API 호출 간격 2초
node geoip_batch_update.js --force --dry-run  # 전체 재감지 미리보기
```

---

## 🌐 사용 GeoIP API (4-Provider 폴백 체인)

| 순위 | 서비스 | 무료 한도 | 특징 |
|------|--------|---------|------|
| 1st | **ipapi.co** | 1,000/일 | 정확도 최상, HTTPS |
| 2nd | **freeipapi.com** | 60 req/분 | 안정적, 키 불필요 |
| 3rd | **ipwho.is** | 10,000/월 | 가볍고 빠름 |
| 4th | **geojs.io** | 무제한 | Cloudflare CDN 캐시 |

> **ip-api.com은 무료 플랜 HTTPS 미지원으로 제외**

---

## ☁️ Cloud Function 방식 (선택적 추가)

`functions_addon.js` 내용을 `functions/index.js` 하단에 복사 붙여넣기 후:

```bash
firebase deploy --only functions
```

그러면 두 가지 기능이 추가됩니다:
- `scheduledGeoUpdate`: 매일 새벽 3시 KST 자동 실행
- `triggerGeoUpdate`: 관리자 페이지에서 즉시 트리거 가능

---

## ⚠️ 중요 주의사항

### Admin SDK vs 클라이언트 감지의 차이

```
클라이언트 감지 (firebase_config.js)
  → 사용자 브라우저에서 직접 ipapi.co 호출
  → 100% 정확 (사용자 실제 IP)
  ✅ 권장 방식

Admin SDK 스크립트 (이 도구)
  → Firestore의 lastIP 필드 필요
  → lastIP 없으면 감지 불가
  ✅ 클라이언트 감지를 보완하는 용도
```

### API 한도 계산

- 회원 100명 × 1초 딜레이 = 약 2분
- ipapi.co 1일 1,000회 → 회원 1,000명까지 하루 1회 가능
- 회원이 많으면 `--delay 2000` + `--days 30` 조합 권장

---

## 📊 결과 파일

실행 완료 후 `output/` 폴더에 저장됩니다:

```
output/
├── geoip_update_2026-03-03T01-55-00.json   ← 상세 결과 (JSON)
└── geoip_update_2026-03-03T01-55-00.csv    ← 스프레드시트용 (CSV)
```

CSV 컬럼: `uid, nickname, email, role, oldCode, newCode, city, timezone, via, status, timestamp`
