# Phoenix Guild Management System
# 차세대 아키텍처 기획 보고서 v1.0

> 작성일: 2026-07-14  
> 대상: 개발팀 검토용  
> 분류: 기술 기획 / 자동화 전략

---

## 목차

1. [현황 진단 — 현재 시스템의 한계](#1-현황-진단)
2. [근본 원인 분석](#2-근본-원인-분석)
3. [차세대 아키텍처 설계](#3-차세대-아키텍처-설계)
4. [자동화 시스템 로드맵](#4-자동화-시스템-로드맵)
5. [마이그레이션 전략](#5-마이그레이션-전략)
6. [기술 스택 최종 선정](#6-기술-스택-최종-선정)
7. [리스크 및 대응방안](#7-리스크-및-대응방안)
8. [우선순위 실행 계획](#8-우선순위-실행-계획)

---

## 1. 현황 진단

### 1-1. 현재 시스템 구성 (있는 것)

```
phoenix-guild-management/guild_app/
│
├── 프론트엔드 (Vanilla HTML/JS, 21,846 lines)
│   ├── main.html          — 대시보드 홈
│   ├── notice.html        — 공지사항 (FCM 연동)
│   ├── admin.html         — 권한 관리 (1,015 lines)
│   ├── weekly.html        — 주간 결산 (1,043 lines)
│   ├── attendance.html    — 출석 캘린더 (1,020 lines)
│   ├── history.html       — 결산 내역
│   ├── members.html       — 길드원 목록
│   ├── deckbuilder.html   — 덱 빌딩
│   ├── yaphalla_guides.html  — Discord 가이드 피드
│   ├── formation_board.html  — 진영 배치판
│   └── strategy.html      — 작전 지도
│
├── 공통 레이어
│   ├── firebase_config.js — 인증/DB 전역 처리 (363 lines)
│   ├── push_manager.js    — FCM 관리 (776 lines)
│   ├── ui_utils.js        — 스와이프/네비 유틸 (287 lines)
│   ├── i18n.js + i18n_added.js — 다국어 10개국어 (2,430 lines)
│   ├── header_standard.css / common_style.css — 공통 스타일
│   └── firebase-messaging-sw.js — SW FCM 처리
│
├── 백엔드 (Firebase Cloud Functions v2)
│   └── functions/index.js
│       ├── sendNoticeNotification   — 공지 FCM 발송
│       ├── sendNoticeUpdatedNoti    — 공지 수정 알림
│       ├── sendTestPush             — 테스트 발송 (Callable)
│       ├── cleanupStaleTokens       — 30일 토큰 정리 (스케줄)
│       ├── scheduledGeoUpdate       — GeoIP 자동갱신 (스케줄)
│       └── triggerGeoUpdate         — 수동 GeoIP 갱신 (Callable)
│
├── 데이터베이스 (Firestore)
│   ├── users/             — 회원 (role: admin/manager/member/pending)
│   ├── notice/            — 공지사항
│   ├── attendance_logs/   — 출석 (uid > days > 날짜)
│   ├── weekly_config/     — 주차별 분배금 설정
│   ├── weekly_results/    — 주간 결산 결과
│   ├── weekly_history/    — 결산 내역
│   ├── guild_strategy/    — 작전 지도
│   ├── fcmTokens/         — FCM 토큰
│   ├── pushLogs/          — 발송 로그
│   ├── yaphalla_guide_posts/ — Discord 가이드 피드 (Bot 전용 쓰기)
│   ├── infographic_posts/ — Discord 인포그래픽 (Bot 전용)
│   └── discordLinks/      — Discord OAuth 연동
│
├── 외부 연동
│   ├── Discord Bot (discord_bot.zip) — Firestore 동기화
│   ├── Discord OAuth2 — 로그인 연동
│   └── GeoIP API (ipify.org) — 국가 감지
│
└── 배포
    ├── Cloudflare Pages — 프론트엔드
    └── Firebase Hosting + Functions — 백엔드/CDN
```

### 1-2. 현재 시스템이 버티고 있는 것

| 기능 | 상태 | 비고 |
|------|------|------|
| 회원 인증 (Google/Discord OAuth) | ✅ 작동 | 이중 로그인 |
| 역할 기반 접근 제어 (admin/manager/member/pending) | ✅ 작동 | Firestore Rules |
| 공지사항 + FCM 푸시 알림 | ✅ 작동 | Cloud Functions |
| 주간 출석 캘린더 | ✅ 작동 | Firestore subcollection |
| 주간 결산/분배 | ✅ 작동 | 수동 입력 |
| Discord 채널 피드 동기화 | ✅ 작동 | Bot → Firestore |
| 다국어 지원 (10개국어) | ✅ 작동 | i18n 로컬 |
| PWA + 오프라인 알림 | ✅ 작동 | SW + FCM |
| 진영 배치판 / 작전 지도 | ✅ 작동 | 이미지 기반 |

---

## 2. 근본 원인 분석

### 2-1. 코드 구조 문제 (기술 부채)

#### ① 스파게티 HTML (Monolithic Pages)
```
현재: 각 HTML 파일 = HTML + CSS + JS + 비즈니스 로직 + 데이터 액세스 혼재
      weekly.html   → 1,043 lines (1개 파일에 모든 것)
      admin.html    → 1,015 lines
      attendance.html → 1,020 lines
      editor.html   → 1,822 lines (최대)

문제:
  - 사이드바 CSS 1개 누락이 전체 페이지 레이아웃 붕괴 (오늘 발생한 버그)
  - 동일 코드(toggleNav, handleLangChange, logout 등) 14개 파일에 복붙
  - 새 기능 추가 시 모든 HTML 파일을 각각 수정해야 함
  - 팀 개발 불가 → 머지 충돌 위험 극대화
```

#### ② 단일 Firestore 플랫 구조
```
현재: 모든 데이터가 단일 Firestore 프로젝트에 평탄하게 존재
      users/ attendance_logs/ weekly_results/ guild_strategy/ ...

문제:
  - 길드원 50명 → 100명 → 200명 증가 시 쿼리 비용 기하급수 증가
  - 다중 길드 지원 불가 (현재 단일 길드 하드코딩)
  - 분기/연간 데이터 누적 시 인덱스 폭발 위험
  - 실시간 onSnapshot 남용 → 클라이언트 Firestore 연결 수 증가
```

#### ③ 클라이언트 사이드 비즈니스 로직
```
현재: 모든 계산 로직이 브라우저에서 실행
      주간 결산: weekly.html에서 JS로 직접 합산
      출석 처리: attendance.html에서 JS로 직접 집계
      권한 승인: admin.html에서 JS로 직접 role 변경

문제:
  - 보안: 클라이언트 JS 조작으로 데이터 위변조 가능성
  - 일관성: 여러 탭/기기에서 동시 작업 시 데이터 충돌
  - 자동화 불가: 스케줄 기반 자동 처리 불가
  - 감사 로그: 누가 무엇을 변경했는지 추적 불가
```

#### ④ 자동화 시스템 부재
```
현재: 수동 프로세스 목록
  - 주간 결산 → 관리자가 매주 수동으로 분배금 입력 후 확정
  - 출석 체크 → 개인이 매일 수동 클릭
  - 회원 승인 → 관리자가 개별 확인 후 수동 승인
  - 역할 변경 → 관리자가 수동 변경
  - Discord 연동 → Bot이 단방향으로만 Firestore에 기록

결과: 관리자 부담 증가, 휴먼 에러 발생, 규모 확장 불가
```

#### ⑤ 중복 & 불필요 파일
```
제거 대상:
  - editor.html / editor_test.html → 공지 에디터인데 notice.html에 통합 가능
  - formation_board_test.html       → 테스트 파일 프로덕션 배포됨
  - guild_app (2).zip / guild_app.zip → 소스코드가 배포에 포함됨
  - migrate_attendance.html          → 1회성 마이그레이션 스크립트 잔존
  - calendar_patch.js               → 패치 파일이 영구 배포됨
  - yaphalla_infographics.html      → yaphalla_guides와 중복 기능
  - main.min.js / daygrid.min.js    → CDN 대체 가능한 로컬 번들
  - fullcalendar.min.js (270KB!)    → 전체 앱에서 출석 1개 페이지만 사용
  - serviceAccountKey.json          → 🚨 보안 위험 (프로젝트에 노출!)
  - firebase-service-account.json   → 🚨 보안 위험 (프로젝트에 노출!)
```

---

## 3. 차세대 아키텍처 설계

### 3-1. 설계 원칙

```
① 자동화 우선 (Automation-First)
   → 관리자가 하던 반복 작업을 시스템이 처리

② 컴포넌트 분리 (Component-Based)
   → HTML 파일 = 레이아웃만, 로직은 모듈 JS

③ 서버 사이드 로직 (Server-Side Logic)
   → 비즈니스 규칙은 Cloud Functions에서 실행

④ 확장 가능한 데이터 구조 (Scalable Schema)
   → 다중 길드, 시즌제, 이력 관리 지원

⑤ 옵저버빌리티 (Observability)
   → 모든 주요 액션에 감사 로그 + 알림
```

### 3-2. 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                     클라이언트 레이어                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web App     │  │  Mobile PWA  │  │  Discord Bot │          │
│  │  (SPA/Vue)   │  │  (PWA)       │  │  (Node.js)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────────┐
│                     API 게이트웨이 레이어                         │
│              Firebase Cloud Functions (Node.js 22)               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Auth API   │ │ Guild API  │ │ Weekly API │ │ Discord API  │  │
│  │            │ │            │ │            │ │              │  │
│  │ - 로그인   │ │ - 멤버관리 │ │ - 결산처리 │ │ - 가이드동기 │  │
│  │ - 역할변경 │ │ - 공지발송 │ │ - 자동집계 │ │ - 명령처리   │  │
│  │ - 승인처리 │ │ - 출석처리 │ │ - 분배계산 │ │ - 알림발송   │  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └──────┬───────┘  │
└────────┼──────────────┼──────────────┼───────────────┼───────────┘
         │              │              │               │
┌────────▼──────────────▼──────────────▼───────────────▼───────────┐
│                      데이터 레이어                                │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Firestore (NoSQL)                        │  │
│  │  guilds/{guildId}/                                          │  │
│  │    ├── members/       — 길드원 (역할, 상태, 통계)            │  │
│  │    ├── seasons/{id}/  — 시즌별 데이터 격리                  │  │
│  │    │   ├── attendance/ — 출석 기록                          │  │
│  │    │   └── results/    — 주간 결산                          │  │
│  │    ├── notices/        — 공지사항                           │  │
│  │    ├── config/         — 길드 설정                          │  │
│  │    └── audit_logs/     — 감사 로그 (자동 기록)              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Firebase Storage                               │  │
│  │  guilds/{guildId}/profiles/  — 프로필 이미지               │  │
│  │  guilds/{guildId}/strategy/  — 작전 이미지                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
         │
┌────────▼──────────────────────────────────────────────────────────┐
│                   자동화 스케줄러 레이어                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ 주간 자동 결산   │  │ 출석 자동 마감   │  │ 토큰 정리      │  │
│  │ (월요일 00:01)   │  │ (일요일 23:59)   │  │ (매일 03:00)   │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐                       │
│  │ 미활동 감지      │  │ 랭킹 자동 갱신   │                       │
│  │ (매일 09:00)     │  │ (매주 월요일)    │                       │
│  └──────────────────┘  └──────────────────┘                       │
└───────────────────────────────────────────────────────────────────┘
```

### 3-3. Firestore 데이터 스키마 재설계

#### 현재 → 차세대 비교

```javascript
// ❌ 현재: 단일 플랫 구조
/users/{uid}                    → role, nickname, country...
/attendance_logs/{uid}/days/    → 날짜별 출석
/weekly_results/{mondayStr}     → 주간 결산
/guild_strategy/main_order      → 하나의 전략만 존재

// ✅ 차세대: 길드 중심 계층 구조
/guilds/{guildId}/              ← 루트 → 다중 길드 지원 가능
  config                        → 길드 설정 (이름, 아이콘, 규칙)
  members/{uid}                 → 멤버 (role, stats, joinedAt)
  notices/{noticeId}            → 공지사항
  seasons/{seasonId}/           ← 시즌별 데이터 완전 격리
    attendance/{uid}/days/      → 출석 기록
    weekly/{weekId}             → 주간 결산
    rankings/{uid}              → 주간/시즌 랭킹 (자동 집계)
  strategies/{strategyId}       → 다수의 전략 저장 가능
  audit_logs/{logId}            → 감사 로그 (자동 기록)

/users/{uid}                    → 전역 프로필 (어느 길드에서도 사용)
  profile                       → 닉네임, 아바타, 국가
  guilds: [guildId1, guildId2]  → 소속 길드 목록 (다중 길드 대응)
```

### 3-4. 프론트엔드 구조 개편

#### 현재 문제 → 해결 방향

```
현재: 14개 HTML 파일에 각각 toggleNav, logout 등 중복 코드 존재
      사이드바 CSS 1개 누락 → 전체 페이지 레이아웃 붕괴 (실제 발생)

해결: 컴포넌트 기반 설계

src/
├── components/          — 재사용 컴포넌트
│   ├── Sidebar.js       ← toggleNav, CSS 한 곳에서만 관리
│   ├── Header.js
│   ├── NotificationBell.js
│   └── ConfirmDialog.js
│
├── pages/               — 각 페이지 로직만 담당
│   ├── main.js
│   ├── notice.js
│   ├── weekly.js
│   └── admin.js
│
├── services/            — 데이터 액세스 분리
│   ├── authService.js   ← firebase_config.js 역할
│   ├── guildService.js  ← Firestore CRUD
│   ├── weeklyService.js
│   └── pushService.js   ← push_manager.js 역할
│
├── utils/               — 순수 유틸리티
│   ├── i18n.js
│   ├── date.js
│   └── format.js
│
└── store/               — 전역 상태 (Zustand/Pinia)
    ├── authStore.js     ← 현재 사용자 정보
    └── guildStore.js    ← 길드 정보
```

---

## 4. 자동화 시스템 로드맵

> 핵심 목표: 관리자 반복 작업 80% 이상 자동화

### 4-1. 자동화 우선순위 매트릭스

```
          낮은 노력  ←──────────────→  높은 노력
높은 임팩트  [A] 즉시 구현            [B] 계획 구현
낮은 임팩트  [C] 기회 구현            [D] 보류

[A] 즉시 구현 (Phase 1)
  ✓ 주간 결산 자동 집계 (출석 데이터 → 분배금 자동 계산)
  ✓ 회원 승인 자동 알림 (가입 신청 → 관리자 즉시 알림)
  ✓ Discord 명령어로 출석 체크 (/출석)
  ✓ 미활동 멤버 자동 감지 (7일 미접속 → 경고)

[B] 계획 구현 (Phase 2)
  ✓ 랭킹 자동 계산 및 시즌 정산
  ✓ 역할 자동 조정 (출석률/기여도 기반)
  ✓ 주간 리포트 자동 발송 (매주 월요일)
  ✓ Discord ↔ 웹앱 양방향 동기화

[C] 기회 구현 (Phase 3)
  ✓ AI 기반 전략 추천
  ✓ 게임 데이터 API 연동 자동 통계
```

### 4-2. Phase 1 — 자동화 핵심 (즉시 구현 가능)

#### A. 주간 결산 자동화

```javascript
// Cloud Functions 스케줄러
// 매주 월요일 00:01 KST 자동 실행

exports.autoWeeklyFinalize = onSchedule({
  schedule: '1 15 * * 0',  // UTC 일요일 15:01 = KST 월요일 00:01
  timeZone: 'Asia/Seoul',
  region: 'asia-northeast3',
}, async () => {

  // 1. 지난 주 출석 데이터 자동 집계
  const weekAttendance = await aggregateWeeklyAttendance(lastWeekId);

  // 2. 분배금 자동 계산 (출석 일수 × 일일 분배금)
  const distributions = calculateDistributions(weekAttendance, weeklyConfig);

  // 3. 결과 자동 저장 (관리자 수동 입력 불필요)
  await saveWeeklyResults(distributions);

  // 4. 결과 Discord + FCM 알림 자동 발송
  await notifyAllMembers('주간 결산이 자동으로 완료되었습니다.');

  // 5. 감사 로그 기록
  await writeAuditLog('weekly_finalize', 'system', { weekId, distributions });
});
```

#### B. Discord 출석 자동화

```
현재 흐름 (수동):
  Discord 게임 → 웹앱 접속 → 버튼 클릭 → 출석 기록

자동화 흐름:
  Option 1: Discord 명령어
    /출석 입력 → Bot → Cloud Functions → Firestore → 완료 알림
  
  Option 2: 자동 감지 (고급)
    Discord 특정 채널 메시지 → Bot 감지 → 자동 출석 처리
    (예: #출석-인증 채널에 메시지 → 자동 출석)

Discord Bot 명령어 확장:
  /출석          → 오늘 출석 체크
  /내현황         → 이번주 출석/점수 확인
  /길드랭킹       → 주간 랭킹 조회
  /공지          → 최신 공지 확인
  /분배내역       → 지난 결산 내역
```

#### C. 회원 관리 자동화

```javascript
// 가입 신청 시 자동 처리 플로우

exports.onNewMemberPending = onDocumentCreated('users/{uid}', async (event) => {
  const data = event.data.data();
  if (data.role !== 'pending') return;

  // 1. 관리자에게 즉시 FCM + Discord DM 알림
  await notifyAdmins({
    title: '새 가입 신청',
    body: `${data.nickname}님이 가입을 신청했습니다.`,
    action: 'admin.html#pending'
  });

  // 2. 신청자에게 접수 확인 메시지 자동 발송
  await sendWelcomeMessage(data.uid, data.email);

  // 3. 24시간 후에도 미처리 시 재알림
  await scheduleReminder(data.uid, 24 * 60 * 60 * 1000);
});

// 역할 변경 자동화 (출석률 기반)
exports.autoRoleAdjust = onSchedule('0 9 * * 1', async () => {
  const members = await getActiveMembers();

  for (const member of members) {
    const attendanceRate = await calcAttendanceRate(member.uid, lastMonth);

    // 출석률 30% 미만 → 경고 알림 자동 발송
    if (attendanceRate < 0.3) {
      await sendWarningNotification(member.uid);
      await writeAuditLog('attendance_warning', 'system', { uid: member.uid, rate: attendanceRate });
    }
  }
});
```

#### D. 미활동 멤버 자동 감지 시스템

```javascript
exports.detectInactiveMembers = onSchedule('0 9 * * *', async () => {
  const threshold7  = Date.now() - 7  * 24 * 60 * 60 * 1000;  // 7일
  const threshold14 = Date.now() - 14 * 24 * 60 * 60 * 1000;  // 14일
  const threshold30 = Date.now() - 30 * 24 * 60 * 60 * 1000;  // 30일

  const members = await db.collection('users')
    .where('role', '==', 'member').get();

  for (const doc of members.docs) {
    const lastActive = doc.data().lastActive?.toMillis() || 0;

    if (lastActive < threshold30) {
      // 30일 미접속 → 자동 비활성화 + 관리자 알림
      await doc.ref.update({ status: 'inactive' });
      await notifyAdmins(`${doc.data().nickname} — 30일 미접속 자동 비활성화`);
    } else if (lastActive < threshold14) {
      // 14일 미접속 → Discord DM 경고
      await sendDiscordDM(doc.data().discordId, '14일간 미접속 감지 — 활동 확인 요청');
    } else if (lastActive < threshold7) {
      // 7일 미접속 → 앱 FCM 알림
      await sendFCMToUser(doc.id, '길드 활동을 확인해주세요!');
    }
  }
});
```

### 4-3. Phase 2 — 자동화 고도화

#### A. 시즌제 자동 관리

```
시즌 자동 전환:
  시즌 종료일 도래 → 자동 정산 → 시즌 랭킹 확정 → 보상 공지
  → 새 시즌 자동 시작 → 데이터 초기화 (이전 시즌 아카이브 보존)

구현:
  /guilds/{guildId}/seasons/{seasonId}/
    status: 'active' | 'finalizing' | 'archived'
    startDate, endDate, autoFinalizeAt

  스케줄러: endDate 도래 시 자동으로 시즌 종료 플로우 실행
```

#### B. 스마트 알림 시스템

```
현재: 전체 발송 (모든 멤버에게 동일 알림)

차세대: 개인화 알림
  - 출석 안 한 멤버에게만 출석 독려 알림
  - 결산일 D-1에만 분배 예정 금액 개인 알림
  - 랭킹 변동 시 본인에게만 알림 ("2위로 올라섰습니다!")
  - Discord 채널별 맞춤 피드 구독
```

#### C. Discord ↔ 웹앱 양방향 동기화

```
현재: Discord Bot → Firestore (단방향)

차세대: 양방향
  웹앱 공지 작성 → Discord #공지 채널 자동 게시
  Discord /출석 → 웹앱 출석부 자동 반영
  웹앱 결산 → Discord #결산 채널 자동 요약 게시
  Discord 이모지 반응 → 웹앱 투표/확인 반영
```

### 4-4. Phase 3 — 지능형 자동화 (장기)

```
① 게임 데이터 API 연동 (게임사 공식 API 존재 시)
   → 인게임 스코어 자동 수집 → 수동 입력 완전 제거

② AI 분석 대시보드
   → 멤버별 활동 패턴 분석
   → 최적 전략 추천 (과거 승률 기반)
   → 이탈 위험 멤버 사전 감지

③ 멀티 길드 관리 포털
   → 연합 길드 / 서브 길드 통합 관리
   → 길드 간 자원 공유 / 이적 시스템
```

---

## 5. 마이그레이션 전략

### 5-1. 3단계 무중단 전환

```
Phase 0 (현재 ~ 2주): 즉시 정리
  → 보안 위험 파일 즉시 제거 (serviceAccountKey.json, firebase-service-account.json)
  → 불필요 파일 정리 (테스트 파일, 임시 파일, 압축 파일)
  → nav-folder CSS → common_style.css 통합 (반복 버그 근절)
  → Cloud Functions에 자동화 기초 구현

Phase 1 (2주 ~ 2개월): 자동화 구현 + 코드 정리
  → 주간 결산 자동화 Cloud Function 구현
  → Discord Bot 출석 명령어 구현
  → 공통 JS 모듈 분리 (toggleNav, logout 등 중복 제거)
  → 사이드바 HTML/CSS → 외부 include 방식으로 표준화
  → 감사 로그 시스템 구현

Phase 2 (2개월 ~ 4개월): 프론트엔드 현대화
  → Vite + Vanilla JS (또는 Vue 3 Composition API) SPA 전환
  → 공통 컴포넌트 라이브러리 구축
  → 기존 HTML 페이지 → 컴포넌트 기반으로 순차 이전
  → Firestore 스키마 v2 마이그레이션 (길드 중심 구조)

Phase 3 (4개월 이후): 확장 기능
  → 다중 길드 지원
  → 시즌제 시스템
  → AI 분석 대시보드
```

### 5-2. 기존 데이터 마이그레이션

```javascript
// 기존 users/ → guilds/{guildId}/members/ 마이그레이션
// 단 1회 실행하는 마이그레이션 스크립트

exports.migrateToGuildSchema = onCall({ region: REGION }, async (request) => {
  // Admin 전용 1회성 마이그레이션
  const GUILD_ID = 'phoenix-guild';

  const oldUsers = await db.collection('users').get();

  const batch = db.batch();
  oldUsers.forEach(doc => {
    const newRef = db
      .collection('guilds').doc(GUILD_ID)
      .collection('members').doc(doc.id);
    batch.set(newRef, { ...doc.data(), migratedAt: FieldValue.serverTimestamp() });
  });
  await batch.commit();

  // 기존 데이터는 30일 후 삭제 (충분한 검증 기간)
});
```

---

## 6. 기술 스택 최종 선정

### 6-1. 추천 스택

| 레이어 | 현재 | 추천 차세대 | 이유 |
|--------|------|------------|------|
| 프론트엔드 | Vanilla HTML/JS | **Vite + Vanilla JS** | 빌드 최적화, 모듈 번들링. Vue/React는 학습 비용 고려 시 선택적 |
| 공통 상태 | 전역 변수 | **ES Module + 이벤트 버스** | 프레임워크 없이 상태 공유 |
| 백엔드 | Firebase Functions v2 | **Firebase Functions v2 유지** | 이미 서울 리전, 스케줄러 검증됨 |
| 데이터베이스 | Firestore | **Firestore v2 스키마** | 기존 투자 보존, 구조만 개선 |
| 인증 | Firebase Auth | **Firebase Auth 유지** | Discord/Google 연동 안정적 |
| 알림 | FCM + SW | **FCM + SW 유지** | 검증됨, Discord 채널 확장 |
| 배포 | CF Pages + Firebase | **CF Pages + Firebase 유지** | 듀얼 배포 안정적 |
| Discord Bot | discord_bot.zip | **discord.js v14 리팩터** | slash commands, 양방향 동기화 |
| 모니터링 | console.log | **Firebase Crashlytics + 감사로그** | 운영 이슈 추적 |

### 6-2. 선택하지 않는 이유

```
Next.js / Nuxt.js → SSR 불필요 (인증 필요 앱, SEO 필요 없음)
                    Firebase Auth와 SSR 연동 복잡
                    팀 학습 비용 과다

Supabase           → 기존 Firestore 데이터 이전 비용 과대
                    현재 Discord Bot이 Firestore에 종속

AWS / GCP 직접     → Firebase 생태계(Auth+Firestore+Functions+FCM)
                    한 번에 해결하는 것을 굳이 분리할 이유 없음

React Native       → PWA로 충분 (모바일 브라우저 + 설치 가능)
                    별도 앱 스토어 배포 불필요
```

---

## 7. 리스크 및 대응방안

### 7-1. 즉각 대응 필요 (보안)

```
🚨 CRITICAL: 서비스 계정 키 노출
  파일: serviceAccountKey.json, firebase-service-account.json
  위험: GitHub 저장소에 있을 경우 Firebase 전체 관리자 권한 탈취 가능
  
  즉시 조치:
  1. Firebase Console → 서비스 계정 → 해당 키 즉시 비활성화/삭제
  2. 새 서비스 계정 키 생성 (필요한 경우)
  3. 파일을 .gitignore에 추가 + git history에서 purge
  4. GitHub secret scanning alert 확인
```

### 7-2. 기술 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Firestore 쿼리 비용 폭증 | 중 | 높음 | 페이지네이션, 집계 캐싱 |
| Cloud Functions 콜드 스타트 | 중 | 중 | 최소 인스턴스 1 설정 |
| Discord API 레이트 리밋 | 낮 | 중 | 큐잉 + 재시도 로직 |
| 마이그레이션 중 다운타임 | 낮 | 높음 | 블루/그린 배포 전략 |
| FCM 토큰 만료 급증 | 낮 | 중 | 기존 cleanup 스케줄러 유지 |

### 7-3. 운영 리스크

```
현재 단일 관리자 의존도가 높음
  → 관리자 부재 시 시스템 마비

해결:
  1. 자동화로 관리자 개입 최소화 (Phase 1 목표)
  2. 역할 계층 세분화 (admin > manager > officer > member)
  3. 운영 매뉴얼 + runbook 문서화
  4. 알림 우회 채널 (Discord 관리자 채널 직접 알림)
```

---

## 8. 우선순위 실행 계획

### Week 1-2: 즉시 조치

```
[보안]
  □ serviceAccountKey.json, firebase-service-account.json Git에서 제거
  □ .gitignore 업데이트
  □ Firebase 서비스 계정 키 교체

[정리]
  □ 불필요 파일 제거 (*.zip, *_test.html, migrate_*.html, calendar_patch.js)
  □ nav-folder/nav-sub-link CSS → common_style.css 통합 (버그 근절)
  □ 사이드바 HTML → 외부 include JS로 단일화 (모든 페이지)

[자동화 기초]
  □ 주간 결산 자동화 Cloud Function 작성
  □ 미활동 감지 스케줄러 추가
  □ 감사 로그(audit_logs) 컬렉션 생성 + 기록 시작
```

### Week 3-4: 자동화 1차

```
  □ Discord Bot /출석 slash command 구현
  □ 가입 신청 자동 알림 Cloud Function
  □ 역할 변경 시 감사 로그 자동 기록
  □ 주간 결산 Discord 자동 발송
```

### Month 2: 코드 현대화

```
  □ Vite 빌드 시스템 도입
  □ 공통 Sidebar 컴포넌트 JS 모듈화 (14개 파일 중복 제거)
  □ authService.js 분리 (firebase_config.js 리팩터)
  □ 전체 HTML → Vite 번들 이전 시작
```

### Month 3-4: 스키마 마이그레이션

```
  □ guilds/{guildId}/ 루트 스키마 설계 확정
  □ 마이그레이션 스크립트 작성 + 테스트
  □ 신구 스키마 병렬 운영 (안전 전환)
  □ 구 스키마 deprecated 처리 후 제거
```

---

## 부록: 주요 질문 사전 답변

**Q. 프레임워크를 꼭 도입해야 하나?**  
A. 현 단계에서는 NO. Vite + 모듈 분리만으로 현재 문제의 80%를 해결 가능. 팀/길드 규모가 더 커지거나 기능이 급증하면 그때 Vue 3 전환 검토.

**Q. Supabase로 갈아타는 건?**  
A. 현재 시점에서 권장하지 않음. Firestore + Discord Bot 연동이 이미 구축됨. 이전 비용 대비 이득 없음. Firebase 스키마 재설계로 충분히 해결 가능.

**Q. 자동 출석이 실제로 가능한가?**  
A. Discord Bot 방식은 즉시 구현 가능. 인게임 API 방식은 게임사 공식 API 여부에 따라 결정. 현실적으로 Discord /출석 명령어가 가장 빠른 개선.

**Q. 다중 길드는 언제부터?**  
A. Phase 2 완료 후 (약 4개월). Firestore 스키마 guilds/{guildId}/ 구조가 전제 조건.

**Q. 현재 운영 중에 이전하면 다운타임 생기나?**  
A. 페이지 단위 점진적 이전 전략을 쓰면 다운타임 없음. 신규 페이지는 새 스택, 기존 페이지는 그대로 유지하며 순차 이전.

---

*본 보고서는 2026-07-14 기준 코드베이스 전체 분석을 토대로 작성되었습니다.*  
*검토 후 우선순위 및 방향 확정 시 세부 기술 명세서를 별도 작성합니다.*
