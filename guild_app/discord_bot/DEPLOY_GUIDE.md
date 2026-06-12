# 🤖 Phoenix Guild Discord Bot — Railway 배포 가이드

## 동작 흐름

```
#yaphalla-guides 채널에 글 올라옴
         ↓
Phoenix Guild Bot 감지 (MessageCreate)
         ↓
Firestore yaphalla_guide_posts/{messageId} 저장
         ↓
yaphalla_guides.html onSnapshot 수신 (수 초 이내)
         ↓
실시간 피드 자동 렌더링 ✅
```

---

## 1단계 · Discord Developer Portal 설정

1. https://discord.com/developers/applications 접속
2. 해당 Application 선택 → **Bot** 탭
3. **Privileged Gateway Intents** 섹션에서 **MESSAGE CONTENT INTENT** ✅ 활성화
   - 이게 없으면 봇이 메시지 내용을 읽을 수 없습니다!
4. Bot Token 복사 (이후 Railway 환경변수에 사용)

---

## 2단계 · Firebase 서비스 계정 키 발급

1. https://console.firebase.google.com → `roider-guild-management`
2. ⚙️ 프로젝트 설정 → **서비스 계정** 탭
3. **새 비공개 키 생성** → JSON 다운로드
4. 이 JSON 파일 내용 전체를 **한 줄 문자열**로 복사해두기 (Railway 환경변수용)

---

## 3단계 · #yaphalla-guides 채널 ID 확인

1. Discord **사용자 설정 → 고급 → 개발자 모드** 활성화
2. `#yaphalla-guides` 채널 우클릭 → **ID 복사**
3. 이 값을 `WATCH_CHANNEL_IDS`에 입력

---

## 4단계 · Railway 배포

### 4-1. 봇 코드를 별도 GitHub 레포로 push

```bash
# discord_bot 폴더만 새 레포로
cd discord_bot
git init
git add .
# .gitignore 에 .env, firebase-service-account.json 포함 확인!
git commit -m "Phoenix Guild Discord Bot"
git remote add origin https://github.com/YOUR_USER/phoenix-discord-bot.git
git push -u origin main
```

### 4-2. Railway 프로젝트 생성

1. https://railway.app → GitHub로 로그인
2. **New Project → Deploy from GitHub repo**
3. 위에서 만든 `phoenix-discord-bot` 레포 선택
4. Railway가 자동으로 `npm install && npm start` 실행

### 4-3. Railway 환경변수 설정

Railway 대시보드 → 프로젝트 → **Variables** 탭:

| 변수명 | 값 |
|---|---|
| `DISCORD_BOT_TOKEN` | Bot Token (Developer Portal에서 복사) |
| `WATCH_CHANNEL_IDS` | `#yaphalla-guides` 채널 ID |
| `YAPHALLA_COLLECTION` | `yaphalla_guide_posts` |
| `FIREBASE_PROJECT_ID` | `roider-guild-management` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON 전체 (한 줄) |

### 4-4. 배포 확인

Railway 로그 탭에서:
```
✅ 로그인 완료: PhoenixBot#1234
📋 서버 목록: Phoenix Guild
🔍 감시 채널 수: 1
```
위와 같이 출력되면 성공!

---

## 5단계 · Firestore 복합 인덱스 생성

웹앱이 `visible == true` + `orderBy discordTimestamp desc` 쿼리를 사용합니다.

1. Firebase Console → Firestore → **인덱스** 탭
2. **복합 인덱스 추가**
   - 컬렉션: `yaphalla_guide_posts`
   - 필드1: `visible` (오름차순)
   - 필드2: `discordTimestamp` (내림차순)
3. 저장 → 빌드 완료까지 1~2분 대기

> 웹앱 첫 접속 시 콘솔에 인덱스 생성 링크가 자동으로 뜨기도 합니다.

---

## 로컬 테스트 (선택)

```bash
cd discord_bot
cp .env.example .env
# .env 에 실제 값 입력

npm install
node bot.js
# → "✅ 로그인 완료: PhoenixBot#1234" 출력되면 성공
```

---

## 메시지 수정 / 삭제 처리

| Discord 이벤트 | 봇 동작 |
|---|---|
| 새 메시지 | Firestore 문서 생성 (ID = Discord 메시지 ID) |
| 메시지 수정 | `content`, `imageUrls`, `edited: true` 업데이트 |
| 메시지 삭제 | `visible: false` → 웹앱에서 숨김 (데이터 보존) |

---

## Firestore 수동 관리

Firebase Console → Firestore → `yaphalla_guide_posts` 컬렉션

| 필드 | 설명 |
|---|---|
| `visible: false` | 웹앱에서 해당 포스트 숨김 |
| `content` | 텍스트 본문 |
| `imageUrls[]` | 이미지 URL 배열 |
| `authorName` | 작성자 디스플레이명 |
| `discordTimestamp` | Discord 메시지 원본 시각 |
