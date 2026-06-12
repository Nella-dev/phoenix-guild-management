// ══════════════════════════════════════════════════════════════════
//  ROIDER Discord Bot — Firestore Security Rules 추가분
//  기존 firestore.rules 파일의 rules_version 블록 안에 추가하세요
// ══════════════════════════════════════════════════════════════════
//
//  아래 규칙을 firestore.rules 파일의 match /databases/{db}/documents { ... } 안에 붙여넣으세요

/*

    // ── 인포그래픽 포스트 (Discord Bot이 Admin SDK로 씀) ──────────
    match /infographic_posts/{postId} {
      // 로그인한 사용자 = 읽기 허용
      allow read: if request.auth != null;

      // 웹앱에서 직접 쓰기 금지 (봇 Admin SDK만 씀)
      allow write: if false;
    }

*/

// ══════════════════════════════════════════════════════════════════
//  Firestore 컬렉션 스키마 (참고용)
// ══════════════════════════════════════════════════════════════════
/*

infographic_posts/{discordMessageId}
├── discordMessageId : string   // Discord 메시지 ID (= 문서 ID)
├── channelId        : string   // Discord 채널 ID
├── channelName      : string   // 채널 이름 (예: "gloommaw")
├── guildId          : string
├── guildName        : string
│
├── authorId         : string   // Discord 유저 ID
├── authorName       : string   // 유저네임
├── authorDisplayName: string   // 서버 닉네임
├── authorAvatar     : string   // 아바타 이미지 URL
├── authorRoles      : array    // [{id, name, color}]
│
├── content          : string   // 메시지 원문 (마크다운 포함)
├── title            : string   // **굵은텍스트**에서 자동 추출
├── imageUrls        : array    // 이미지 URL 목록 (CDN)
├── attachments      : array    // 첨부파일 전체 정보
├── embeds           : array    // Discord embed 데이터
├── tags             : array    // 자동 태그 (epic, gloommaw 등)
│
├── createdAt        : timestamp
├── updatedAt        : timestamp
├── editedAt         : timestamp | null
├── deletedAt        : timestamp | null
│
├── visible          : boolean  // false = 웹앱에서 숨김
├── featured         : boolean  // true = 상단 고정 (수동 설정)
└── pinned           : boolean  // Discord 핀 여부

*/
