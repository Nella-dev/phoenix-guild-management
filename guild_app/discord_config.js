/**
 * discord_config.js — Discord OAuth2 클라이언트 설정
 *
 * ⚠️  배포 전 반드시 아래 값들을 실제 값으로 교체하세요.
 *
 * 설정 방법:
 *   1. https://discord.com/developers/applications 접속
 *   2. 앱 선택(또는 신규 생성) → OAuth2 탭
 *   3. CLIENT ID 복사 → DISCORD_CLIENT_ID에 입력
 *   4. Redirects에 아래 DISCORD_REDIRECT_URI 추가
 *   5. Bot 탭 → 봇 생성 후 서버 초대 (서버닉 자동 조회 시 필요)
 *
 * DISCORD_GUILD_ID (선택):
 *   - Discord 서버 ID (서버 우클릭 → 서버 ID 복사)
 *   - 설정하면 해당 서버의 닉네임을 자동으로 인게임 닉네임 후보로 제안
 *   - 미설정 시 Discord 글로벌 이름으로 대체
 */

// ── Discord 앱 Client ID (공개 값, 노출 무방) ──────────────────────────────
window.DISCORD_CLIENT_ID = '1514261057273860220';

// ── OAuth 콜백 URI (Discord Developer Portal Redirects에 등록 필수) ────────
// 예) 'https://roider-guild-management.web.app/discord_callback.html'
window.DISCORD_REDIRECT_URI = window.location.origin + '/discord_callback.html';

// ── 대상 Discord 서버 ID (서버 닉네임 자동 조회용, 선택) ────────────────────
// 미설정 시 Discord 글로벌 이름 사용
window.DISCORD_GUILD_ID = '1349683763642236959';

// ── 개발/프로덕션 자동 감지 ────────────────────────────────────────────────
(function() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    // 로컬 개발: Firebase Emulator 사용 시 아래 주석 해제
    // if (typeof firebase !== 'undefined' && firebase.functions) {
    //   firebase.functions().useEmulator('localhost', 5001);
    // }
    console.log('[Discord] 로컬 개발 모드');
  }
})();
