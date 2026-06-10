# ROIDER GUILD — 백그라운드 푸시 알림 설정 가이드

> **버전**: v2.0 (2025-03)  
> **대상**: Firebase Hosting + Cloud Functions 기반 PWA  
> **완료 시 동작**: 앱이 완전히 닫혀 있어도 새 공지 등록 즉시 OS 알림 수신

---

## 📋 사전 요구사항 체크리스트

| 항목 | 확인 |
|---|:---:|
| Firebase 프로젝트 생성 완료 | ☐ |
| **Firebase Blaze (종량제) 플랜** 활성화 | ☐ |
| Firebase CLI 설치 (`npm install -g firebase-tools`) | ☐ |
| Node.js 22+ 설치 | ☐ |
| `firebase login` 완료 | ☐ |

> ⚠️ **Cloud Functions는 Blaze(종량제) 플랜에서만 배포 가능합니다.**  
> Spark(무료) 플랜에서는 Functions 없이 인앱 실시간 알림만 동작합니다.

---

## 🔑 STEP 1 — VAPID 키 발급 (필수)

VAPID(Voluntary Application Server Identification) 키는 웹 푸시 알림의 신원 증명에 사용됩니다.  
**이 키 없이는 FCM 토큰 발급이 불가하여 백그라운드 푸시를 받을 수 없습니다.**

### 1-1. Firebase Console 접속
```
https://console.firebase.google.com/project/roider-guild-management/settings/cloudmessaging
```

### 1-2. 웹 푸시 인증서 생성
1. **[프로젝트 설정]** (⚙️ 아이콘) 클릭
2. **[클라우드 메시징]** 탭 선택
3. **[웹 구성]** 섹션 확인
4. **"웹 푸시 인증서"** → **[키 쌍 생성]** 클릭
5. 생성된 **공개 키(Public Key)** 전체 복사

> 공개 키 형식 예시:  
> `BEl62iUYgUivxIkv69yViEuiBIa40HI7xAHMGQ6kj7Ql...` (87자 내외)

### 1-3. push_manager.js에 키 적용
`push_manager.js` 파일 **43번째 줄** 수정:

```js
// 수정 전
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

// 수정 후 (발급받은 키로 교체)
const VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI7xAHMGQ6kj...';
```

---

## ⚡ STEP 2 — Cloud Functions 배포

### 2-1. 의존성 설치
```bash
cd functions
npm install
cd ..
```

### 2-2. Functions만 먼저 배포 (테스트)
```bash
firebase deploy --only functions
```

배포 완료 시 출력 예시:
```
✔  functions[sendNoticeNotification(asia-northeast3)]: Successful
✔  functions[sendNoticeUpdatedNoti(asia-northeast3)]: Successful
✔  functions[sendTestPush(asia-northeast3)]: Successful
✔  functions[cleanupStaleTokens(asia-northeast3)]: Successful
```

### 2-3. 배포된 Functions 확인
```
https://console.firebase.google.com/project/roider-guild-management/functions
```

---

## 🌐 STEP 3 — Hosting 배포

### 3-1. 전체 배포 (Functions + Hosting 동시)
```bash
firebase deploy
```

### 3-2. Hosting만 재배포
```bash
firebase deploy --only hosting
```

### 3-3. 배포 후 Service Worker 확인
브라우저에서 접속 후:
1. **DevTools** (F12) → **Application** 탭
2. **Service Workers** 섹션 확인
3. `firebase-messaging-sw.js` 상태: **activated and is running** ✅

---

## 🔒 STEP 4 — Firestore 보안 규칙 설정

### 4-1. firestore.rules 파일 생성
프로젝트 루트에 `firestore.rules` 파일 생성:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 사용자 문서
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // 공지사항 — 인증된 사용자 읽기, admin/manager만 쓰기
    match /notice/{noticeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
        in ['admin', 'manager'];
    }

    // FCM 토큰 — 본인만 읽기/쓰기
    match /fcmTokens/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // 푸시 발송 로그 — Functions만 쓰기 (관리자 읽기)
    match /pushLogs/{logId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Cloud Functions Admin SDK만 허용
    }
  }
}
```

### 4-2. Firestore 규칙 배포
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 STEP 5 — 동작 테스트

### 5-1. 알림 권한 허용 테스트
1. 앱 접속 → 메인 화면 배너 확인
2. **[알림 허용]** 클릭 → 브라우저 권한 팝업 → 허용
3. 성공 시: `✅ 푸시 알림이 활성화되었습니다!` 토스트 메시지

### 5-2. 포그라운드 알림 테스트
1. 앱이 열린 상태에서 관리자 계정으로 공지 등록
2. **다른 탭**(앱 열려 있음)에서 인앱 팝업 우측 상단 표시 확인

### 5-3. 백그라운드 알림 테스트
1. 앱 탭을 **최소화** 또는 **다른 탭으로 이동**
2. 관리자 계정으로 공지 등록
3. OS 우측 상단 알림 팝업 확인 (약 5~10초 소요)

### 5-4. 완전 종료 알림 테스트 (가장 중요)
1. 브라우저에서 앱 탭 **완전히 닫기**
2. 관리자 계정으로 공지 등록 (다른 기기 또는 Firebase Console 직접)
3. **OS 알림 수신** 확인 (10~30초 소요)
4. 알림 클릭 → 브라우저에서 `notice.html` 자동 열림

### 5-5. 관리자 테스트 발송 (admin 계정)
브라우저 콘솔에서 직접 실행:
```js
firebase.functions().httpsCallable('sendTestPush')()
  .then(r => console.log('테스트 발송 성공:', r.data))
  .catch(e => console.error('오류:', e));
```

---

## 🐛 문제 해결 (Troubleshooting)

### ❌ "VAPID 키가 미설정 상태" 경고가 뜸
→ `push_manager.js` 43번째 줄 `VAPID_KEY` 값을 실제 키로 교체 후 재배포

### ❌ Service Worker 등록 실패
→ `firebase-messaging-sw.js`가 반드시 웹 루트(`/`)에 있어야 함  
→ Firebase Hosting 배포 시 자동으로 루트에 배치됨  
→ 로컬 테스트 시 `http-server` 또는 `firebase serve` 사용

### ❌ FCM 토큰 발급 오류 (`messaging/permission-blocked`)
→ 브라우저 주소창 🔒 아이콘 → 알림 → **허용** 으로 변경

### ❌ 백그라운드 알림이 안 옴 (Functions 배포 후)
1. Firebase Console → Functions → 로그 확인
2. `[FCM] No active tokens` → 권한 허용 후 토큰 저장 대기
3. `[FCM] Multicast error` → Blaze 플랜 확인, FCM API 활성화 확인

### ❌ Functions 배포 오류 (`Billing account not configured`)
→ Firebase 프로젝트를 **Blaze(종량제) 플랜**으로 업그레이드 필요  
→ https://console.firebase.google.com/project/roider-guild-management/usage/details

### ❌ iOS Safari에서 알림 안 옴
→ iOS 16.4+ / Safari 16.4+ 에서만 Web Push 지원  
→ **홈 화면에 추가(PWA로 설치)** 후 알림 권한 허용 필요  
→ 일반 Safari 브라우저 탭에서는 지원 안 됨

### ❌ `functions[cleanupStaleTokens]` 배포 오류
→ Cloud Scheduler API 활성화 필요:  
```
https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com
```

---

## 📁 신규/수정 파일 목록

### 신규 생성
| 파일 | 설명 |
|---|---|
| `firebase-messaging-sw.js` | FCM 백그라운드 푸시 수신 Service Worker v2 |
| `push_manager.js` | 클라이언트 푸시 알림 매니저 v2 |
| `functions/index.js` | Cloud Functions — Firestore 트리거 FCM 발송 |
| `functions/package.json` | Functions 의존성 (firebase-admin, firebase-functions) |
| `assets/icon-192.png` | PWA 알림 아이콘 (192×192) |
| `assets/icon-512.png` | PWA 스플래시 아이콘 (512×512) |
| `assets/badge-72.png` | 알림 배지 아이콘 (72×72) |

### 수정된 파일
| 파일 | 주요 변경 내용 |
|---|---|
| `firebase.json` | functions 섹션 추가, SW no-cache 헤더, 보안 헤더 3종 추가 |
| `manifest.json` | 아이콘 CDN URL → 로컬 assets/ 경로로 수정 |
| `common_style.css` | 인앱 알림 스타일, notice-highlight 애니메이션 추가 |
| `notice.html` | 알림 토글 버튼, PushManager 초기화 추가 |
| `main.html` | 권한 요청 배너, PushManager 초기화 추가 |

---

## 🏗️ 전체 아키텍처

```
사용자 브라우저
  │
  ├─ [앱 열림, 포그라운드]
  │    Firestore onSnapshot ──→ push_manager.js
  │                              └─ 인앱 팝업 (우측 상단)
  │
  ├─ [앱 열림, 백그라운드 탭]
  │    FCM 서버 ──→ firebase-messaging-sw.js
  │                  ├─ OS 네이티브 알림
  │                  └─ postMessage(PUSH_RECEIVED) ──→ 인앱 팝업
  │
  └─ [앱 완전 종료]
       FCM 서버 ──→ firebase-messaging-sw.js (SW만 동작)
                     └─ OS 네이티브 알림 → 클릭 시 앱 열림

Firebase Cloud Functions (서버)
  Firestore notice/{id} 생성
    └─ sendNoticeNotification() 트리거
         ├─ fcmTokens 컬렉션 조회 (active=true)
         ├─ FCM Admin SDK sendEachForMulticast (500개/배치)
         ├─ 만료 토큰 자동 삭제
         └─ pushLogs 기록

스케줄러 (매일 02:00 KST)
  cleanupStaleTokens()
    └─ 30일 미갱신 토큰 비활성화
```

---

## 💰 비용 참고 (Firebase 요금)

| 서비스 | 무료 한도 | 초과 시 |
|---|---|---|
| Cloud Functions 호출 | 2,000,000회/월 | $0.0000004/회 |
| Firestore 읽기 | 50,000회/일 | $0.06/100만회 |
| FCM 발송 | **무료** | 무료 |
| Hosting | 10GB/월 | $0.026/GB |

> 소규모 길드 앱 기준 **월 $0~$1 이하** 예상

---

*ROIDER GUILD APP — Push Notification System v2.0*
