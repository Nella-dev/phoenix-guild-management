// i18n_deck.js - 덱 빌딩 종합 사령실 전용 번역 파일 (v1.0 2026-03-05)
// 기존 i18n.js / i18n_added.js 를 덮어쓰지 않고 독립적으로 동작합니다.
// main.html, editor.html, editor_test.html, formation_board.html, formation_board_test.html 에 로드됩니다.

(function () {
  /* ─────────────────────────────────────────────────────────
   * 1. 덱 빌딩 전용 번역 키 정의
   * ───────────────────────────────────────────────────────── */
  var DECK_I18N = {
    ko: {
      /* ── 사이드바 메뉴 ── */
      deck_folder:          "⚔️ 덱 빌딩 종합 사령실",
      menu_editor:          "⚔️ 덱 빌딩 편성",
      menu_formation_board: "📋 편성 공유 게시판",

      /* ── 대시보드 카드 ── */
      main_card_deck:       "⚔️ 덱 빌딩 종합 사령실",
      main_card_deck_desc:  "포메이션을 편집하고 길드원들과 전략을 공유하세요.",

      /* ── 에디터 공통 ── */
      ed_title:             "포메이션 에디터",
      ed_save:              "저장",
      ed_load:              "불러오기",
      ed_clear:             "초기화",
      ed_share:             "공유하기",
      ed_save_png:          "PNG 저장",
      ed_copy_clipboard:    "클립보드 복사",
      ed_search_hero:       "영웅 검색...",
      ed_filter_all:        "전체",
      ed_filter_faction:    "진영",
      ed_filter_class:      "직업",
      ed_arena_label:       "아레나 선택",
      ed_formation_count:   "진형 수",
      ed_my_formations:     "내 편성 목록",
      ed_no_formation:      "저장된 편성이 없습니다.",

      /* ── 공유 모달 ── */
      share_modal_title:    "🔗 편성 공유하기",
      share_title_label:    "편성 제목",
      share_title_ph:       "예) 속공 3진형 공략",
      share_arena_label:    "아레나",
      share_count_label:    "진형 수",
      share_desc_label:     "설명 (선택)",
      share_desc_ph:        "전략 설명을 간단히 적어주세요.",
      share_author_label:   "작성자",
      share_author_ph:      "닉네임 (미입력 시 익명)",
      share_btn_cancel:     "취소",
      share_btn_submit:     "공유하기",
      share_success:        "✅ 편성이 공유 게시판에 등록되었습니다!",
      share_fail:           "❌ 공유에 실패했습니다. 다시 시도해주세요.",
      share_login_required: "로그인 후 공유할 수 있습니다.",

      /* ── 편성 공유 게시판 ── */
      board_title:          "🔗 편성 공유 게시판",
      board_subtitle:       "길드원들이 공유한 덱 빌딩 편성을 확인하세요.",
      board_open_editor:    "✗ 에디터 열기",
      board_filter_all:     "전체",
      board_filter_1:       "1개 진형",
      board_filter_2:       "2개 진형",
      board_filter_3:       "3개 진형",
      board_no_post:        "아직 공유된 편성이 없습니다.\n에디터에서 첫 번째 편성을 공유해보세요!",
      board_likes:          "좋아요",
      board_like_btn:       "👍 좋아요",
      board_detail_close:   "✕ 닫기",
      board_load_editor:    "⚔️ 에디터에서 열기",
      board_delete:         "🗑️ 삭제",
      board_arena_label:    "아레나",
      board_author_label:   "작성자",
      board_date_label:     "작성일",
      board_loading:        "편성 목록을 불러오는 중...",
      board_load_error:     "불러오기 실패. 새로고침 해주세요.",
      board_realtime_badge: "🔴 실시간",
      board_count_suffix:   "개 진형",

      /* ── 공통 액션 ── */
      btn_back_main:        "🏠 메인으로",
      btn_back_board:       "📋 게시판으로",
      lbl_anonymous:        "익명",
      lbl_just_now:         "방금 전",
      lbl_minutes_ago:      "분 전",
      lbl_hours_ago:        "시간 전",
      lbl_days_ago:         "일 전",
    },

    en: {
      /* ── 사이드바 메뉴 ── */
      deck_folder:          "⚔️ Deck Building HQ",
      menu_editor:          "⚔️ Deck Building",
      menu_formation_board: "📋 Formation Board",

      /* ── 대시보드 카드 ── */
      main_card_deck:       "⚔️ Deck Building HQ",
      main_card_deck_desc:  "Edit formations and share strategies with guild members.",

      /* ── 에디터 공통 ── */
      ed_title:             "Formation Editor",
      ed_save:              "Save",
      ed_load:              "Load",
      ed_clear:             "Clear",
      ed_share:             "Share",
      ed_save_png:          "Save PNG",
      ed_copy_clipboard:    "Copy to Clipboard",
      ed_search_hero:       "Search heroes...",
      ed_filter_all:        "All",
      ed_filter_faction:    "Faction",
      ed_filter_class:      "Class",
      ed_arena_label:       "Select Arena",
      ed_formation_count:   "Formation Count",
      ed_my_formations:     "My Formations",
      ed_no_formation:      "No saved formations.",

      /* ── 공유 모달 ── */
      share_modal_title:    "🔗 Share Formation",
      share_title_label:    "Formation Title",
      share_title_ph:       "e.g. Fast Push 3-Formation",
      share_arena_label:    "Arena",
      share_count_label:    "Formation Count",
      share_desc_label:     "Description (optional)",
      share_desc_ph:        "Briefly describe your strategy.",
      share_author_label:   "Author",
      share_author_ph:      "Nickname (anonymous if empty)",
      share_btn_cancel:     "Cancel",
      share_btn_submit:     "Share",
      share_success:        "✅ Formation shared to the board!",
      share_fail:           "❌ Share failed. Please try again.",
      share_login_required: "Please log in to share.",

      /* ── 편성 공유 게시판 ── */
      board_title:          "🔗 Formation Board",
      board_subtitle:       "Check formations shared by guild members.",
      board_open_editor:    "✗ Open Editor",
      board_filter_all:     "All",
      board_filter_1:       "1 Formation",
      board_filter_2:       "2 Formations",
      board_filter_3:       "3 Formations",
      board_no_post:        "No formations shared yet.\nBe the first to share from the editor!",
      board_likes:          "Likes",
      board_like_btn:       "👍 Like",
      board_detail_close:   "✕ Close",
      board_load_editor:    "⚔️ Open in Editor",
      board_delete:         "🗑️ Delete",
      board_arena_label:    "Arena",
      board_author_label:   "Author",
      board_date_label:     "Date",
      board_loading:        "Loading formations...",
      board_load_error:     "Failed to load. Please refresh.",
      board_realtime_badge: "🔴 Live",
      board_count_suffix:   "Formation(s)",

      /* ── 공통 액션 ── */
      btn_back_main:        "🏠 Back to Main",
      btn_back_board:       "📋 Back to Board",
      lbl_anonymous:        "Anonymous",
      lbl_just_now:         "Just now",
      lbl_minutes_ago:      " min ago",
      lbl_hours_ago:        " hr ago",
      lbl_days_ago:         " day(s) ago",
    }
  };

  /* ─────────────────────────────────────────────────────────
   * 2. window.i18n 에 머지 (덮어쓰기 방지: 기존 키가 없을 때만 추가)
   * ───────────────────────────────────────────────────────── */
  function mergeDeckI18n() {
    if (!window.i18n) window.i18n = { ko: {}, en: {} };
    ['ko', 'en'].forEach(function (lang) {
      if (!window.i18n[lang]) window.i18n[lang] = {};
      var src = DECK_I18N[lang];
      Object.keys(src).forEach(function (key) {
        // menu_editor / menu_formation_board 는 덱 전용 번역으로 덮어씀
        window.i18n[lang][key] = src[key];
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
   * 3. DOM 요소에 번역 적용 (data-i18n-deck 속성 우선, data-i18n 도 처리)
   * ───────────────────────────────────────────────────────── */
  function applyDeckTranslations() {
    var lang = window.currentLang || localStorage.getItem('roider_lang') || 'ko';
    var dict = DECK_I18N[lang] || DECK_I18N['ko'];

    /* data-i18n-deck 속성 처리 */
    document.querySelectorAll('[data-i18n-deck]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-deck');
      if (dict[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    /* data-i18n 속성 중 덱 전용 키 처리 */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
   * 4. 공개 API
   * ───────────────────────────────────────────────────────── */
  window.getDeckI18n = function (key) {
    var lang = window.currentLang || localStorage.getItem('roider_lang') || 'ko';
    var dict = DECK_I18N[lang] || DECK_I18N['ko'];
    return dict[key] !== undefined ? dict[key] : key;
  };

  window.applyDeckI18n = applyDeckTranslations;

  /* ─────────────────────────────────────────────────────────
   * 5. 초기화
   * ───────────────────────────────────────────────────────── */
  mergeDeckI18n();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDeckTranslations);
  } else {
    applyDeckTranslations();
  }

  /* 언어 전환 시 재적용 — applyLanguage 래핑 */
  var _origApplyLang = window.applyLanguage;
  window.applyLanguage = function (lang) {
    if (_origApplyLang) _origApplyLang(lang);
    setTimeout(applyDeckTranslations, 50);
  };

  /* toggleLanguage 래핑 (일부 페이지에서 직접 호출) */
  var _origToggleLang = window.toggleLanguage;
  window.toggleLanguage = function () {
    if (_origToggleLang) _origToggleLang();
    setTimeout(applyDeckTranslations, 100);
  };

})();
