/**
 * i18n_added.js  v4.0  (2026-05-30)
 * ─────────────────────────────────────────────────────────────────────────
 * ▸ i18n.js 를 직접 수정하지 않고 신규/수정 번역 키를 관리합니다.
 * ▸ i18n.js 보다 반드시 나중에 로드되어야 합니다.
 *
 * 변경 이력:
 *   v4.0  2026-05-30  10개 언어 지원 (fr, de, it, es, zh-CN, zh-TW, ja, pt 추가)
 *   v3.1  2026-03-04  가이드 모달 번역 키 추가, deleteRecord showConfirm 안전 처리
 *   v3.0  2026-03-04  attendance UTC+0 기준 패널티, admin 승인 버튼 fix,
 *                     프로필 변경 버튼, 메뉴 이모지 일괄 추가
 *   v2.0  2026-03-04  메뉴 이모지, 프로필 버튼, 신규 번역 키
 *   v1.0  2026-03-03  초기 작성
 * ─────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════
     1. 번역 패치 데이터 (10개 언어)
  ═══════════════════════════════════════════════════════════ */
  var patch = {
    ko: {
      /* ── 메뉴 이모지 ── */
      menu_home:         "🏠 홈",
      menu_notice:       "📢 공지사항",
      menu_calendar:     "📅 주간 출석부",
      menu_weekly:       "💰 주간 결산",
      menu_history:      "📜 결산 내역",
      menu_strategy:     "🗺️ 작전 지도",
      menu_members:      "👥 길드원 목록",
      menu_admin:        "🛡️ 권한 관리",
      menu_logout:       "🚪 로그아웃",
      weekly_folder:     "📋 주간 컨텐츠 기록부",

      /* ── 프로필 변경 버튼 ── */
      btn_profile_change: "✎ 프로필 변경",

      /* ── weekly.html 접기/펼치기 / 가이드 버튼 ── */
      btn_fold_close:    "📂 접기",
      btn_fold_open:     "📁 펼치기",
      btn_guide_open:    "❓ 가이드",
      btn_weekly_guide:  "❓ 가이드",
      weekly_guide_btn:  "💡 이용 방법 보기",

      /* ── notice.html 동적 버튼 ── */
      btn_edit:              "수정",
      noti_modal_title_new:  "공지사항 작성",
      noti_modal_title_edit: "공지사항 수정",
      noti_placeholder_title: "제목",
      noti_placeholder_body:  "내용",

      /* ── strategy.html ── */
      str_label_grid:           "그리드:",
      btn_apply:                "적용",
      str_cell_title:           "셀 설정",
      str_cell_count:           "할당 인원 수",
      str_vanguard_placeholder: "선봉대 명칭",

      /* ── nickname.html ── */
      nick_desc: "길드 시스템 이용을 위해\n게임 내 닉네임을 등록해주세요.",

      /* ── attendance 출석 기준 안내 ── */
      att_time_note: "출석 기준: UTC+0 자정 (한국 시간 오전 9시)",
      att_past_utc:  "⚠️ 과거 출석 (UTC 기준) – 점수의 50%만 인정됩니다.",

      /* ── attendance 이용 가이드 모달 ── */
      att_guide_modal_title:    "📅 주간 출석부 이용 가이드",
      att_guide_modal_subtitle: "처음 사용하시나요? 아래 단계를 따라해보세요!",
      att_guide_close:          "✅ 알겠습니다!",

      /* ── weekly 이용 가이드 모달 ── */
      weekly_guide_modal_title:    "💰 주간 결산 이용 가이드",
      weekly_guide_modal_subtitle: "결산 시스템이 어떻게 작동하는지 확인하세요!",
      weekly_guide_close:          "✅ 알겠습니다!",
    },

    en: {
      /* ── 메뉴 이모지 ── */
      menu_home:         "🏠 Home",
      menu_notice:       "📢 Notice",
      menu_calendar:     "📅 Weekly Attendance",
      menu_weekly:       "💰 Weekly Settlement",
      menu_history:      "📜 Settlement History",
      menu_strategy:     "🗺️ Strategy Map",
      menu_members:      "👥 Members",
      menu_admin:        "🛡️ Admin",
      menu_logout:       "🚪 Logout",
      weekly_folder:     "📋 Weekly Records",

      /* ── 프로필 변경 버튼 ── */
      btn_profile_change: "✎ Edit Profile",

      /* ── weekly.html 접기/펼치기 / 가이드 버튼 ── */
      btn_fold_close:    "📂 Collapse",
      btn_fold_open:     "📁 Expand",
      btn_guide_open:    "❓ Guide",
      btn_weekly_guide:  "❓ Guide",
      weekly_guide_btn:  "💡 How to Use",

      /* ── notice.html 동적 버튼 ── */
      btn_edit:              "Edit",
      noti_modal_title_new:  "New Notice",
      noti_modal_title_edit: "Edit Notice",
      noti_placeholder_title: "Title",
      noti_placeholder_body:  "Content",

      /* ── strategy.html ── */
      str_label_grid:           "Grid:",
      btn_apply:                "Apply",
      str_cell_title:           "Cell Settings",
      str_cell_count:           "Assigned Members",
      str_vanguard_placeholder: "Vanguard Name",

      /* ── nickname.html ── */
      nick_desc: "Please register your in-game nickname\nto use the guild system.",

      /* ── attendance 출석 기준 안내 ── */
      att_time_note: "Check-in basis: UTC+0 midnight (KST 09:00)",
      att_past_utc:  "⚠️ Past entry (UTC basis) – only 50% of score counted.",

      /* ── attendance 이용 가이드 모달 ── */
      att_guide_modal_title:    "📅 Weekly Attendance Guide",
      att_guide_modal_subtitle: "New here? Follow the steps below!",
      att_guide_close:          "✅ Got it!",

      /* ── weekly 이용 가이드 모달 ── */
      weekly_guide_modal_title:    "💰 Weekly Settlement Guide",
      weekly_guide_modal_subtitle: "Learn how the settlement system works!",
      weekly_guide_close:          "✅ Got it!",
    },

    fr: {
      menu_home:         "🏠 Accueil",
      menu_notice:       "📢 Annonces",
      menu_calendar:     "📅 Présence Hebdo",
      menu_weekly:       "💰 Bilan Hebdo",
      menu_history:      "📜 Historique",
      menu_strategy:     "🗺️ Carte Stratégique",
      menu_members:      "👥 Membres",
      menu_admin:        "🛡️ Admin",
      menu_logout:       "🚪 Déconnexion",
      weekly_folder:     "📋 Registre Hebdomadaire",
      btn_profile_change: "✎ Modifier Profil",
      btn_fold_close:    "📂 Réduire",
      btn_fold_open:     "📁 Développer",
      btn_guide_open:    "❓ Guide",
      btn_weekly_guide:  "❓ Guide",
      weekly_guide_btn:  "💡 Comment Utiliser",
      btn_edit:              "Modifier",
      noti_modal_title_new:  "Nouvelle Annonce",
      noti_modal_title_edit: "Modifier Annonce",
      noti_placeholder_title: "Titre",
      noti_placeholder_body:  "Contenu",
      str_label_grid:           "Grille :",
      btn_apply:                "Appliquer",
      str_cell_title:           "Paramètres Cellule",
      str_cell_count:           "Membres Assignés",
      str_vanguard_placeholder: "Nom de l'Avant-garde",
      nick_desc: "Veuillez enregistrer votre pseudo en jeu\npour utiliser le système de guilde.",
      att_time_note: "Base de présence : minuit UTC+0 (09h00 KST)",
      att_past_utc:  "⚠️ Entrée passée (base UTC) – seulement 50% du score compté.",
      att_guide_modal_title:    "📅 Guide de Présence Hebdo",
      att_guide_modal_subtitle: "Nouveau ? Suivez les étapes ci-dessous !",
      att_guide_close:          "✅ Compris !",
      weekly_guide_modal_title:    "💰 Guide du Bilan Hebdo",
      weekly_guide_modal_subtitle: "Découvrez comment fonctionne le système de bilan !",
      weekly_guide_close:          "✅ Compris !",
    },

    de: {
      menu_home:         "🏠 Startseite",
      menu_notice:       "📢 Ankündigungen",
      menu_calendar:     "📅 Wöchentl. Anwesenheit",
      menu_weekly:       "💰 Wöchentl. Abrechnung",
      menu_history:      "📜 Abrechnungshistorie",
      menu_strategy:     "🗺️ Strategiekarte",
      menu_members:      "👥 Mitglieder",
      menu_admin:        "🛡️ Verwaltung",
      menu_logout:       "🚪 Abmelden",
      weekly_folder:     "📋 Wöchentl. Aufzeichnungen",
      btn_profile_change: "✎ Profil bearbeiten",
      btn_fold_close:    "📂 Einklappen",
      btn_fold_open:     "📁 Ausklappen",
      btn_guide_open:    "❓ Anleitung",
      btn_weekly_guide:  "❓ Anleitung",
      weekly_guide_btn:  "💡 Verwendung",
      btn_edit:              "Bearbeiten",
      noti_modal_title_new:  "Neue Ankündigung",
      noti_modal_title_edit: "Ankündigung Bearbeiten",
      noti_placeholder_title: "Titel",
      noti_placeholder_body:  "Inhalt",
      str_label_grid:           "Raster:",
      btn_apply:                "Anwenden",
      str_cell_title:           "Zelleinstellungen",
      str_cell_count:           "Zugewiesene Mitglieder",
      str_vanguard_placeholder: "Vorhut-Name",
      nick_desc: "Bitte registrieren Sie Ihren Spielnamen\num das Gilden-System zu nutzen.",
      att_time_note: "Anwesenheitsbasis: Mitternacht UTC+0 (09:00 KST)",
      att_past_utc:  "⚠️ Vergangener Eintrag (UTC-Basis) – nur 50% der Punkte werden gezählt.",
      att_guide_modal_title:    "📅 Wöchentl. Anwesenheitsleitfaden",
      att_guide_modal_subtitle: "Neu hier? Folgen Sie den Schritten unten!",
      att_guide_close:          "✅ Verstanden!",
      weekly_guide_modal_title:    "💰 Wöchentl. Abrechnungsleitfaden",
      weekly_guide_modal_subtitle: "Erfahren Sie, wie das Abrechnungssystem funktioniert!",
      weekly_guide_close:          "✅ Verstanden!",
    },

    it: {
      menu_home:         "🏠 Home",
      menu_notice:       "📢 Avvisi",
      menu_calendar:     "📅 Presenze Settimanali",
      menu_weekly:       "💰 Bilancio Settimanale",
      menu_history:      "📜 Storico Bilanci",
      menu_strategy:     "🗺️ Mappa Strategica",
      menu_members:      "👥 Membri",
      menu_admin:        "🛡️ Amministrazione",
      menu_logout:       "🚪 Disconnetti",
      weekly_folder:     "📋 Registri Settimanali",
      btn_profile_change: "✎ Modifica Profilo",
      btn_fold_close:    "📂 Riduci",
      btn_fold_open:     "📁 Espandi",
      btn_guide_open:    "❓ Guida",
      btn_weekly_guide:  "❓ Guida",
      weekly_guide_btn:  "💡 Come Usare",
      btn_edit:              "Modifica",
      noti_modal_title_new:  "Nuovo Avviso",
      noti_modal_title_edit: "Modifica Avviso",
      noti_placeholder_title: "Titolo",
      noti_placeholder_body:  "Contenuto",
      str_label_grid:           "Griglia:",
      btn_apply:                "Applica",
      str_cell_title:           "Impostazioni Cella",
      str_cell_count:           "Membri Assegnati",
      str_vanguard_placeholder: "Nome dell'Avanguardia",
      nick_desc: "Registra il tuo nickname nel gioco\nper usare il sistema di gilda.",
      att_time_note: "Base presenze: mezzanotte UTC+0 (09:00 KST)",
      att_past_utc:  "⚠️ Entrata passata (base UTC) – solo il 50% del punteggio conta.",
      att_guide_modal_title:    "📅 Guida Presenze Settimanali",
      att_guide_modal_subtitle: "Sei nuovo? Segui i passaggi sottostanti!",
      att_guide_close:          "✅ Capito!",
      weekly_guide_modal_title:    "💰 Guida al Bilancio Settimanale",
      weekly_guide_modal_subtitle: "Scopri come funziona il sistema di bilancio!",
      weekly_guide_close:          "✅ Capito!",
    },

    es: {
      menu_home:         "🏠 Inicio",
      menu_notice:       "📢 Avisos",
      menu_calendar:     "📅 Asistencia Semanal",
      menu_weekly:       "💰 Liquidación Semanal",
      menu_history:      "📜 Historial de Liquidación",
      menu_strategy:     "🗺️ Mapa Estratégico",
      menu_members:      "👥 Miembros",
      menu_admin:        "🛡️ Administración",
      menu_logout:       "🚪 Cerrar Sesión",
      weekly_folder:     "📋 Registros Semanales",
      btn_profile_change: "✎ Editar Perfil",
      btn_fold_close:    "📂 Contraer",
      btn_fold_open:     "📁 Expandir",
      btn_guide_open:    "❓ Guía",
      btn_weekly_guide:  "❓ Guía",
      weekly_guide_btn:  "💡 Cómo Usar",
      btn_edit:              "Editar",
      noti_modal_title_new:  "Nuevo Aviso",
      noti_modal_title_edit: "Editar Aviso",
      noti_placeholder_title: "Título",
      noti_placeholder_body:  "Contenido",
      str_label_grid:           "Cuadrícula:",
      btn_apply:                "Aplicar",
      str_cell_title:           "Configuración de Celda",
      str_cell_count:           "Miembros Asignados",
      str_vanguard_placeholder: "Nombre de Vanguardia",
      nick_desc: "Por favor registra tu nombre en el juego\npara usar el sistema de gremio.",
      att_time_note: "Base de asistencia: medianoche UTC+0 (09:00 KST)",
      att_past_utc:  "⚠️ Entrada pasada (base UTC) – solo se cuenta el 50% del puntaje.",
      att_guide_modal_title:    "📅 Guía de Asistencia Semanal",
      att_guide_modal_subtitle: "¿Nuevo aquí? ¡Sigue los pasos a continuación!",
      att_guide_close:          "✅ ¡Entendido!",
      weekly_guide_modal_title:    "💰 Guía de Liquidación Semanal",
      weekly_guide_modal_subtitle: "¡Aprende cómo funciona el sistema de liquidación!",
      weekly_guide_close:          "✅ ¡Entendido!",
    },

    "zh-CN": {
      menu_home:         "🏠 首页",
      menu_notice:       "📢 公告",
      menu_calendar:     "📅 每周出勤",
      menu_weekly:       "💰 每周结算",
      menu_history:      "📜 结算记录",
      menu_strategy:     "🗺️ 战略地图",
      menu_members:      "👥 成员列表",
      menu_admin:        "🛡️ 权限管理",
      menu_logout:       "🚪 退出登录",
      weekly_folder:     "📋 每周内容记录",
      btn_profile_change: "✎ 编辑个人资料",
      btn_fold_close:    "📂 折叠",
      btn_fold_open:     "📁 展开",
      btn_guide_open:    "❓ 指南",
      btn_weekly_guide:  "❓ 指南",
      weekly_guide_btn:  "💡 使用方法",
      btn_edit:              "编辑",
      noti_modal_title_new:  "新建公告",
      noti_modal_title_edit: "编辑公告",
      noti_placeholder_title: "标题",
      noti_placeholder_body:  "内容",
      str_label_grid:           "网格：",
      btn_apply:                "应用",
      str_cell_title:           "格元设置",
      str_cell_count:           "分配人数",
      str_vanguard_placeholder: "先锋队名称",
      nick_desc: "请注册您的游戏内昵称\n以使用公会系统。",
      att_time_note: "出勤基准：UTC+0 午夜（韩国时间上午9时）",
      att_past_utc:  "⚠️ 过往出勤（UTC基准）– 仅计算50%的分数。",
      att_guide_modal_title:    "📅 每周出勤使用指南",
      att_guide_modal_subtitle: "初次使用？请按照以下步骤操作！",
      att_guide_close:          "✅ 了解了！",
      weekly_guide_modal_title:    "💰 每周结算使用指南",
      weekly_guide_modal_subtitle: "了解结算系统如何运作！",
      weekly_guide_close:          "✅ 了解了！",
    },

    "zh-TW": {
      menu_home:         "🏠 首頁",
      menu_notice:       "📢 公告",
      menu_calendar:     "📅 每週出勤",
      menu_weekly:       "💰 每週結算",
      menu_history:      "📜 結算記錄",
      menu_strategy:     "🗺️ 戰略地圖",
      menu_members:      "👥 成員列表",
      menu_admin:        "🛡️ 權限管理",
      menu_logout:       "🚪 登出",
      weekly_folder:     "📋 每週內容記錄",
      btn_profile_change: "✎ 編輯個人資料",
      btn_fold_close:    "📂 收合",
      btn_fold_open:     "📁 展開",
      btn_guide_open:    "❓ 指南",
      btn_weekly_guide:  "❓ 指南",
      weekly_guide_btn:  "💡 使用方法",
      btn_edit:              "編輯",
      noti_modal_title_new:  "新建公告",
      noti_modal_title_edit: "編輯公告",
      noti_placeholder_title: "標題",
      noti_placeholder_body:  "內容",
      str_label_grid:           "網格：",
      btn_apply:                "套用",
      str_cell_title:           "格元設定",
      str_cell_count:           "分配人數",
      str_vanguard_placeholder: "先鋒隊名稱",
      nick_desc: "請註冊您的遊戲內暱稱\n以使用公會系統。",
      att_time_note: "出勤基準：UTC+0 午夜（韓國時間上午9時）",
      att_past_utc:  "⚠️ 過去出勤（UTC基準）– 僅計算50%的分數。",
      att_guide_modal_title:    "📅 每週出勤使用指南",
      att_guide_modal_subtitle: "初次使用？請按照以下步驟操作！",
      att_guide_close:          "✅ 明白了！",
      weekly_guide_modal_title:    "💰 每週結算使用指南",
      weekly_guide_modal_subtitle: "了解結算系統如何運作！",
      weekly_guide_close:          "✅ 明白了！",
    },

    ja: {
      menu_home:         "🏠 ホーム",
      menu_notice:       "📢 お知らせ",
      menu_calendar:     "📅 週間出席",
      menu_weekly:       "💰 週間精算",
      menu_history:      "📜 精算履歴",
      menu_strategy:     "🗺️ 戦略マップ",
      menu_members:      "👥 メンバー一覧",
      menu_admin:        "🛡️ 権限管理",
      menu_logout:       "🚪 ログアウト",
      weekly_folder:     "📋 週間コンテンツ記録",
      btn_profile_change: "✎ プロフィール変更",
      btn_fold_close:    "📂 折りたたむ",
      btn_fold_open:     "📁 展開する",
      btn_guide_open:    "❓ ガイド",
      btn_weekly_guide:  "❓ ガイド",
      weekly_guide_btn:  "💡 使い方を見る",
      btn_edit:              "編集",
      noti_modal_title_new:  "お知らせ作成",
      noti_modal_title_edit: "お知らせ編集",
      noti_placeholder_title: "タイトル",
      noti_placeholder_body:  "内容",
      str_label_grid:           "グリッド：",
      btn_apply:                "適用",
      str_cell_title:           "セル設定",
      str_cell_count:           "割り当て人数",
      str_vanguard_placeholder: "先鋒隊名称",
      nick_desc: "ギルドシステムをご利用いただくために\nゲーム内ニックネームを登録してください。",
      att_time_note: "出席基準：UTC+0 深夜（韓国時間 午前9時）",
      att_past_utc:  "⚠️ 過去の出席（UTC基準）– スコアの50%のみ認定されます。",
      att_guide_modal_title:    "📅 週間出席利用ガイド",
      att_guide_modal_subtitle: "初めてお使いですか？以下の手順に従ってください！",
      att_guide_close:          "✅ わかりました！",
      weekly_guide_modal_title:    "💰 週間精算利用ガイド",
      weekly_guide_modal_subtitle: "精算システムの仕組みを確認してください！",
      weekly_guide_close:          "✅ わかりました！",
    },

    pt: {
      menu_home:         "🏠 Início",
      menu_notice:       "📢 Avisos",
      menu_calendar:     "📅 Frequência Semanal",
      menu_weekly:       "💰 Liquidação Semanal",
      menu_history:      "📜 Histórico de Liquidação",
      menu_strategy:     "🗺️ Mapa Estratégico",
      menu_members:      "👥 Membros",
      menu_admin:        "🛡️ Administração",
      menu_logout:       "🚪 Sair",
      weekly_folder:     "📋 Registros Semanais",
      btn_profile_change: "✎ Editar Perfil",
      btn_fold_close:    "📂 Recolher",
      btn_fold_open:     "📁 Expandir",
      btn_guide_open:    "❓ Guia",
      btn_weekly_guide:  "❓ Guia",
      weekly_guide_btn:  "💡 Como Usar",
      btn_edit:              "Editar",
      noti_modal_title_new:  "Novo Aviso",
      noti_modal_title_edit: "Editar Aviso",
      noti_placeholder_title: "Título",
      noti_placeholder_body:  "Conteúdo",
      str_label_grid:           "Grade:",
      btn_apply:                "Aplicar",
      str_cell_title:           "Configurações de Célula",
      str_cell_count:           "Membros Atribuídos",
      str_vanguard_placeholder: "Nome da Vanguarda",
      nick_desc: "Por favor, registre seu apelido no jogo\npara usar o sistema de guilda.",
      att_time_note: "Base de frequência: meia-noite UTC+0 (09:00 KST)",
      att_past_utc:  "⚠️ Entrada passada (base UTC) – apenas 50% da pontuação é contada.",
      att_guide_modal_title:    "📅 Guia de Frequência Semanal",
      att_guide_modal_subtitle: "É novo aqui? Siga os passos abaixo!",
      att_guide_close:          "✅ Entendi!",
      weekly_guide_modal_title:    "💰 Guia de Liquidação Semanal",
      weekly_guide_modal_subtitle: "Aprenda como o sistema de liquidação funciona!",
      weekly_guide_close:          "✅ Entendi!",
    }
  };

  /* ═══════════════════════════════════════════════════════════
     2. window.i18n 에 병합 (10개 언어)
  ═══════════════════════════════════════════════════════════ */
  if (window.i18n) {
    var LANGS = ["ko","en","fr","de","it","es","zh-CN","zh-TW","ja","pt"];
    LANGS.forEach(function(lang) {
      if (patch[lang]) {
        if (!window.i18n[lang]) window.i18n[lang] = {};
        Object.assign(window.i18n[lang], patch[lang]);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     3. DOM 적용 함수
  ═══════════════════════════════════════════════════════════ */
  function applyPatch() {
    var lang = localStorage.getItem("roider_lang") || "ko";
    var dict = (window.i18n && window.i18n[lang]) ? window.i18n[lang] : {};

    /* ── attendance 가이드 모달 제목/부제/닫기버튼 ── */
    var attTitle = document.getElementById("att-guide-title");
    if (attTitle) attTitle.textContent = dict.att_guide_modal_title || patch.en.att_guide_modal_title;

    var attSub = document.getElementById("att-guide-subtitle");
    if (attSub) attSub.textContent = dict.att_guide_modal_subtitle || patch.en.att_guide_modal_subtitle;

    var attClose = document.getElementById("att-guide-close-btn");
    if (attClose) attClose.textContent = dict.att_guide_close || patch.en.att_guide_close;

    /* ── weekly 가이드 모달 제목/부제/닫기버튼 ── */
    var wklyTitle = document.getElementById("weekly-guide-title");
    if (wklyTitle) wklyTitle.textContent = dict.weekly_guide_modal_title || patch.en.weekly_guide_modal_title;

    var wklySub = document.getElementById("weekly-guide-subtitle");
    if (wklySub) wklySub.textContent = dict.weekly_guide_modal_subtitle || patch.en.weekly_guide_modal_subtitle;

    var wklyClose = document.getElementById("weekly-guide-close-btn");
    if (wklyClose) wklyClose.textContent = dict.weekly_guide_close || patch.en.weekly_guide_close;

    /* ── weekly.html : 가이드 버튼 ── */
    var weeklyGuideBtn = document.querySelector("button.btn-guide-open[onclick='openWeeklyGuide()']");
    if (weeklyGuideBtn) weeklyGuideBtn.textContent = dict.weekly_guide_btn || patch.en.weekly_guide_btn;

    /* ── weekly.html : 접기/펼치기 버튼 ── */
    var foldBtn = document.getElementById("foldBtn");
    if (foldBtn) {
      var koOpen  = patch.ko.btn_fold_open;
      var enOpen  = patch.en.btn_fold_open;
      var cur = foldBtn.textContent.trim();
      var isFolded = (cur === koOpen || cur === enOpen);
      foldBtn.textContent = isFolded
        ? (dict.btn_fold_open  || patch.en.btn_fold_open)
        : (dict.btn_fold_close || patch.en.btn_fold_close);
    }

    /* ── attendance 패널티 안내 텍스트 ── */
    var penaltyWarn = document.getElementById("penaltyWarning");
    if (penaltyWarn) {
      var warnP = penaltyWarn.querySelector("p");
      if (warnP) warnP.textContent = dict.att_past_utc || patch.en.att_past_utc;
    }

    /* ── strategy.html 그리드/버튼 ── */
    var gridLabel = document.querySelector("#gridSettings span");
    if (gridLabel && /그리드:|Grid:|Grille|Raster|Griglia|Cuadrícula|网格|グリッド|Grade/.test(gridLabel.textContent.trim()))
      gridLabel.textContent = dict.str_label_grid || patch.en.str_label_grid;

    var applyBtn = document.querySelector("button[onclick='applyGrid()']");
    if (applyBtn) applyBtn.textContent = dict.btn_apply || patch.en.btn_apply;

    var saveStratBtn = document.querySelector("button[onclick='saveStrategy()']");
    if (saveStratBtn) saveStratBtn.textContent = dict.str_btn_save || (lang==="ko"?"💾 작전 저장 및 공유":"💾 Save & Share");

    var cellTitle = document.getElementById("cellTitle");
    if (cellTitle) cellTitle.textContent = dict.str_cell_title || patch.en.str_cell_title;

    var cellCountLabel = document.querySelector("#cellModal label");
    if (cellCountLabel) cellCountLabel.textContent = dict.str_cell_count || patch.en.str_cell_count;

    var cellCancelBtn = document.querySelector("#cellModal button:first-of-type");
    if (cellCancelBtn && !cellCancelBtn.getAttribute("data-i18n"))
      cellCancelBtn.textContent = dict.noti_btn_cancel || (lang==="ko"?"취소":"Cancel");

    var cellConfirmBtn = document.querySelector("#cellModal button:last-of-type");
    if (cellConfirmBtn && !cellConfirmBtn.getAttribute("data-i18n"))
      cellConfirmBtn.textContent = dict.btn_confirm || (lang==="ko"?"확인":"Confirm");

    var vanguardInput = document.getElementById("vanguardInput");
    if (vanguardInput) vanguardInput.placeholder = dict.str_vanguard_placeholder || patch.en.str_vanguard_placeholder;

    /* ── notice.html placeholder / 모달 타이틀 ── */
    var modalTitle = document.getElementById("modalTitle");
    if (modalTitle && /공지사항 작성|New Notice|Nouvelle Annonce|Neue Ankündigung|Nuovo Avviso|Nuevo Aviso|新建公告|お知らせ作成|Novo Aviso/.test(modalTitle.textContent))
      modalTitle.textContent = dict.noti_modal_title_new || patch.en.noti_modal_title_new;

    var noticeTitleInput = document.getElementById("noticeTitle");
    if (noticeTitleInput) noticeTitleInput.placeholder = dict.noti_placeholder_title || patch.en.noti_placeholder_title;

    var noticeContentInput = document.getElementById("noticeContent");
    if (noticeContentInput) noticeContentInput.placeholder = dict.noti_placeholder_body || patch.en.noti_placeholder_body;

    /* ── nickname.html ── */
    var nickDesc = document.querySelector(".container .card > p");
    if (nickDesc && /길드 시스템|guild system/.test(nickDesc.textContent)) {
      var rawDesc = dict.nick_desc || patch.en.nick_desc;
      nickDesc.innerHTML = rawDesc.replace(/\n/g, "<br>");
    }
  }

  /* ═══════════════════════════════════════════════════════════
     4. DOMContentLoaded 훅
  ═══════════════════════════════════════════════════════════ */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(applyPatch, 80); });
  } else {
    setTimeout(applyPatch, 80);
  }

  /* ═══════════════════════════════════════════════════════════
     5. applyLanguage 래핑 – 언어 전환 시 재적용
  ═══════════════════════════════════════════════════════════ */
  document.addEventListener("DOMContentLoaded", function() {
    function wrapApplyLanguage() {
      if (!window.applyLanguage || window.applyLanguage._patched) return;
      var orig = window.applyLanguage;
      window.applyLanguage = function() {
        orig.apply(this, arguments);
        applyPatch();
      };
      window.applyLanguage._patched = true;
    }
    wrapApplyLanguage();
    // applyLanguage가 나중에 정의될 경우 대비
    setTimeout(wrapApplyLanguage, 300);
    setTimeout(wrapApplyLanguage, 800);
  });

  /* ═══════════════════════════════════════════════════════════
     6. 공개 헬퍼
  ═══════════════════════════════════════════════════════════ */
  window.getI18nPatch = function(key, fallback) {
    var lang = localStorage.getItem("roider_lang") || "ko";
    var dict = (window.i18n && window.i18n[lang]) ? window.i18n[lang] : {};
    return dict[key] || fallback || key;
  };

  window.applyI18nPatch = applyPatch; // 외부에서 강제 재적용 가능

})();
