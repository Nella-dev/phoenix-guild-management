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
      menu_deckbuilder:  "🃏 덱 빌딩 제작소",
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

      /* ── 공통 버튼 ── */
      btn_save:  "저장",
      btn_close: "닫기",

      /* ── strategy / editor ── */
      stra_title:  "🗺️ 길드전 작전지도",
      stra_empty:  "등록된 지도가 없습니다.",
      deck_folder: "⚔️ 덱 빌딩 종합 사령실",
      share_modal_title: "🔗 편성 공유하기",
      share_btn_cancel:  "취소",

      /* ── formation board ── */
      board_title:       "🔗 편성 공유 게시판",
      board_subtitle:    "길드원들의 공략 덱 및 편성을 공유하는 공간입니다",
      board_open_editor: "✗ 에디터 열기",
      board_filter_all:  "전체",
      board_filter_1:    "1개 진형",
      board_filter_2:    "2개 진형",
      board_filter_3:    "3개 진형",

      /* ── infographics ── */
      menu_infographics:    "얍할라 종합 인포그래픽",
      infographics_subtitle: "Discord 채널 글이 자동으로 반영됩니다",
      menu_yaphalla_guides:  "얍할라 가이드",
      yaphalla_guides_subtitle: "Discord #yaphalla-guides 채널 글이 실시간으로 반영됩니다",
    },

    en: {
      /* ── 메뉴 이모지 ── */
      menu_home:         "🏠 Home",
      menu_notice:       "📢 Notice",
      menu_calendar:     "📅 Weekly Attendance",
      menu_weekly:       "💰 Weekly Settlement",
      menu_history:      "📜 Settlement History",
      menu_strategy:     "🗺️ Strategy Map",
      menu_deckbuilder:  "🃏 Deck Builder",
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

      /* ── 공통 버튼 ── */
      btn_save:  "Save",
      btn_close: "Close",

      /* ── strategy / editor ── */
      stra_title:  "🗺️ Guild War Strategy Map",
      stra_empty:  "No map registered.",
      deck_folder: "⚔️ Deck Building HQ",
      share_modal_title: "🔗 Share Formation",
      share_btn_cancel:  "Cancel",

      /* ── formation board ── */
      board_title:       "🔗 Formation Share Board",
      board_subtitle:    "Share your guild strategy decks and formations",
      board_open_editor: "✗ Open Editor",
      board_filter_all:  "All",
      board_filter_1:    "1 Formation",
      board_filter_2:    "2 Formations",
      board_filter_3:    "3 Formations",

      /* ── infographics ── */
      menu_infographics:    "Yaphalla Infographics",
      infographics_subtitle: "Discord channel posts are automatically reflected",
      menu_yaphalla_guides:  "Yaphalla Guides",
      yaphalla_guides_subtitle: "Discord #yaphalla-guides channel posts are reflected in real time",
    },

    fr: {
      menu_home:         "🏠 Accueil",
      menu_notice:       "📢 Annonces",
      menu_calendar:     "📅 Présence Hebdo",
      menu_weekly:       "💰 Bilan Hebdo",
      menu_history:      "📜 Historique",
      menu_strategy:     "🗺️ Carte Stratégique",
      menu_deckbuilder:  "🃏 Constructeur de Deck",
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
      att_btn_past:        "📝 Entrée Passée",
      att_btn_done:        "✅ Enregistré",
      att_summary_title:   "Cette Semaine",
      att_summary_days:    "jours enreg.",
      att_summary_total:   "Total",
      att_penalty_days:    "Pénalité",
      att_guide_modal_title:    "📅 Guide de Présence Hebdo",
      att_guide_modal_subtitle: "Nouveau ? Suivez les étapes ci-dessous !",
      att_guide_close:          "✅ Compris !",
      weekly_guide_modal_title:    "💰 Guide du Bilan Hebdo",
      weekly_guide_modal_subtitle: "Découvrez comment fonctionne le système de bilan !",
      weekly_guide_close:          "✅ Compris !",

      /* ── commun ── */
      btn_save:  "Enregistrer",
      btn_close: "Fermer",
      main_welcome: "Bienvenue, ",
      main_admin_title: "🛠️ Menu Admin",
      main_card_notice: "📢 Annonces de Guilde",
      main_card_notice_desc: "Consultez les dernières nouvelles et mises à jour de la guilde.",
      main_card_calendar: "📅 Calendrier d'Activité",
      main_card_calendar_desc: "Enregistrez vos scores quotidiens et gérez votre progression.",
      main_card_weekly: "💰 Récompenses Hebdo",
      main_card_weekly_desc: "Consultez vos récompenses en fonction de votre contribution.",
      main_card_strategy: "🗺️ Carte Stratégique",
      main_card_strategy_desc: "Consultez les ordres en temps réel sur la carte. (En construction...)",
      main_card_deckbuilder: "🃏 Constructeur de Deck",
      main_card_deckbuilder_desc: "Concevez le meilleur deck avec l'éditeur Yaphalla.",
      main_card_members: "👥 Liste des Membres",
      main_card_members_desc: "Consultez les infos et l'activité des membres.",
      main_card_admin: "🛡️ Approbation & Gestion des Rôles",
      main_card_admin_desc: "Gérez les approbations et les paramètres de rôle.",
      guide_title: "🚩 Guide de la Guilde Phoenix",
      guide_calendar_desc: "Entrez votre score chaque jour. Un oubli peut vous exclure des récompenses.",
      guide_strategy_desc: "Les marqueurs sur la carte sont des ordres en temps réel. Vérifiez avant d'attaquer.",
      guide_weekly_desc: "Chaque dimanche soir, les récompenses sont calculées automatiquement.",
      adm_filter_all: "Tous",
      adm_filter_pending: "⏳ En Attente",
      adm_filter_approved: "✅ Approuvé",
      admin_dist_setting: "Paramètre de distribution (Staff)",
      btn_save_dist: "Enregistrer les données",
      admin_manage_attendance: "Gestion des présences (Staff)",
      col_date: "Date",
      col_edit: "Modifier",
      col_laby_short: "Laby",
      col_duel_short: "Duel",
      col_act_short: "Activité",
      col_manage: "Gérer",
      msg_no_records: "Aucun enregistrement cette semaine.",
      login_nick_prompt: "Enregistrer le pseudo",
      login_nick_btn: "S'inscrire",
      login_pending: "⏳ En attente d'approbation",
      login_pending_desc: "Vous aurez accès après approbation de l'admin.",
      noti_btn_write: "✍️ Écrire",
      pending_live: "Surveillance en direct · Redirection auto à l'approbation",
      mem_title: "👥 Tableau de Bord des Membres",
      txt_guide: "Guide",
      txt_install: "Installer",
      att_guide_btn: "💡 Guide d'utilisation",
      att_error_notice: "Si vous avez saisi un score incorrect, veuillez contacter le staff.",
      att_activity_notice: "Pour les points d'activité, entrez la valeur de la liste des membres.",

      /* ── strategy / editor ── */
      stra_title:  "🗺️ Carte Stratégique Guilde",
      stra_empty:  "Aucune carte enregistrée.",
      deck_folder: "⚔️ QG Deck Building",
      share_modal_title: "🔗 Partager la Formation",
      share_btn_cancel:  "Annuler",
      board_title:       "🔗 Tableau de Partage de Formation",
      board_subtitle:    "Partagez vos decks et formations de guilde",
      board_open_editor: "✗ Ouvrir l'Éditeur",
      board_filter_all:  "Tous",
      board_filter_1:    "1 Formation",
      board_filter_2:    "2 Formations",
      board_filter_3:    "3 Formations",
      menu_infographics:    "Infographies Yaphalla",
      infographics_subtitle: "Les posts du canal Discord sont automatiquement reflétés",
      menu_yaphalla_guides:  "Guides Yaphalla",
      yaphalla_guides_subtitle: "Les posts du canal Discord #yaphalla-guides sont reflétés en temps réel",
      weekly_guide_btn: "💡 Comment Utiliser",
    },

    de: {
      menu_home:         "🏠 Startseite",
      menu_notice:       "📢 Ankündigungen",
      menu_calendar:     "📅 Wöchentl. Anwesenheit",
      menu_weekly:       "💰 Wöchentl. Abrechnung",
      menu_history:      "📜 Abrechnungshistorie",
      menu_strategy:     "🗺️ Strategiekarte",
      menu_deckbuilder:  "🃏 Deck-Baukasten",
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
      att_btn_past:        "📝 Vergangener Eintrag",
      att_btn_done:        "✅ Gespeichert",
      att_summary_title:   "Diese Woche",
      att_summary_days:    "Tage eingetr.",
      att_summary_total:   "Gesamt",
      att_penalty_days:    "Strafe",
      att_guide_modal_title:    "📅 Wöchentl. Anwesenheitsleitfaden",
      att_guide_modal_subtitle: "Neu hier? Folgen Sie den Schritten unten!",
      att_guide_close:          "✅ Verstanden!",
      weekly_guide_modal_title:    "💰 Wöchentl. Abrechnungsleitfaden",
      weekly_guide_modal_subtitle: "Erfahren Sie, wie das Abrechnungssystem funktioniert!",
      weekly_guide_close:          "✅ Verstanden!",

      /* ── allgemein ── */
      btn_save:  "Speichern",
      btn_close: "Schließen",
      main_welcome: "Willkommen, ",
      main_admin_title: "🛠️ Admin-Menü",
      main_card_notice: "📢 Gilden-Ankündigungen",
      main_card_notice_desc: "Neueste Gilden-Nachrichten und Updates ansehen.",
      main_card_calendar: "📅 Aktivitätskalender",
      main_card_calendar_desc: "Tägliche Punkte eintragen und Fortschritt verwalten.",
      main_card_weekly: "💰 Wöchentliche Belohnungen",
      main_card_weekly_desc: "Belohnungen basierend auf wöchentlichem Beitrag ansehen.",
      main_card_strategy: "🗺️ Strategiekarte",
      main_card_strategy_desc: "Echtzeit-Befehle auf der Karte ansehen. (Im Aufbau...)",
      main_card_deckbuilder: "🃏 Deck-Baukasten",
      main_card_deckbuilder_desc: "Baue das beste Deck mit dem Yaphalla-Editor.",
      main_card_members: "👥 Mitgliederliste",
      main_card_members_desc: "Mitgliederinfos und Aktivitätsstatus ansehen.",
      main_card_admin: "🛡️ Genehmigung & Rollenverwaltung",
      main_card_admin_desc: "Neue Mitglieder genehmigen und Rollen verwalten.",
      guide_title: "🚩 Phoenix Gilden-Leitfaden",
      guide_calendar_desc: "Trage täglich deinen Punkte ein. Auslassen kann dich von Belohnungen ausschließen.",
      guide_strategy_desc: "Marker auf der Karte sind Echtzeit-Befehle. Vor dem Angriff prüfen.",
      guide_weekly_desc: "Jeden Sonntagabend werden Belohnungen automatisch berechnet.",
      adm_filter_all: "Alle",
      adm_filter_pending: "⏳ Ausstehend",
      adm_filter_approved: "✅ Genehmigt",
      admin_dist_setting: "Verteilungseinstellung (Personal)",
      btn_save_dist: "Daten speichern",
      admin_manage_attendance: "Anwesenheitsverwaltung (Personal)",
      col_date: "Datum",
      col_edit: "Bearbeiten",
      col_laby_short: "Laby",
      col_duel_short: "Duell",
      col_act_short: "Aktivität",
      col_manage: "Verwalten",
      msg_no_records: "Keine Einträge diese Woche.",
      login_nick_prompt: "Nickname registrieren",
      login_nick_btn: "Registrieren",
      login_pending: "⏳ Warte auf Genehmigung",
      login_pending_desc: "Nach Admin-Genehmigung erhältst du Zugang.",
      noti_btn_write: "✍️ Schreiben",
      pending_live: "Live-Überwachung · Auto-Weiterleitung bei Genehmigung",
      mem_title: "👥 Mitglieder-Statusübersicht",
      txt_guide: "Anleitung",
      txt_install: "Installieren",
      att_guide_btn: "💡 Nutzungshinweise",
      att_error_notice: "Bei falsch eingetragenen Punkten bitte das Personal kontaktieren.",
      att_activity_notice: "Für Gildenaktivitätspunkte bitte den Wert aus der Mitgliederliste eingeben.",

      /* ── Strategie / Editor ── */
      stra_title:  "🗺️ Gildenkrieg-Strategiekarte",
      stra_empty:  "Keine Karte registriert.",
      deck_folder: "⚔️ Deck-Bau-Zentrale",
      share_modal_title: "🔗 Formation teilen",
      share_btn_cancel:  "Abbrechen",
      board_title:       "🔗 Formations-Teilen-Brett",
      board_subtitle:    "Teile deine Gildenstrategie-Decks und Formationen",
      board_open_editor: "✗ Editor öffnen",
      board_filter_all:  "Alle",
      board_filter_1:    "1 Formation",
      board_filter_2:    "2 Formationen",
      board_filter_3:    "3 Formationen",
      menu_infographics:    "Yaphalla Infografiken",
      infographics_subtitle: "Discord-Kanal-Posts werden automatisch übernommen",
      menu_yaphalla_guides:  "Yaphalla Guides",
      yaphalla_guides_subtitle: "Discord #yaphalla-guides Kanal-Posts werden in Echtzeit übernommen",
      weekly_guide_btn: "💡 Verwendung",
    },

    it: {
      menu_home:         "🏠 Home",
      menu_notice:       "📢 Avvisi",
      menu_calendar:     "📅 Presenze Settimanali",
      menu_weekly:       "💰 Bilancio Settimanale",
      menu_history:      "📜 Storico Bilanci",
      menu_strategy:     "🗺️ Mappa Strategica",
      menu_deckbuilder:  "🃏 Costruttore Mazzo",
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
      att_btn_past:        "📝 Inserimento Passato",
      att_btn_done:        "✅ Salvato",
      att_summary_title:   "Questa Settimana",
      att_summary_days:    "gg registrati",
      att_summary_total:   "Totale",
      att_penalty_days:    "Penalità",
      att_guide_modal_title:    "📅 Guida Presenze Settimanali",
      att_guide_modal_subtitle: "Sei nuovo? Segui i passaggi sottostanti!",
      att_guide_close:          "✅ Capito!",
      weekly_guide_modal_title:    "💰 Guida al Bilancio Settimanale",
      weekly_guide_modal_subtitle: "Scopri come funziona il sistema di bilancio!",
      weekly_guide_close:          "✅ Capito!",

      /* ── comune ── */
      btn_save:  "Salva",
      btn_close: "Chiudi",
      main_welcome: "Benvenuto, ",
      main_admin_title: "🛠️ Menu Admin",
      main_card_notice: "📢 Annunci della Gilda",
      main_card_notice_desc: "Consulta le ultime notizie e aggiornamenti della gilda.",
      main_card_calendar: "📅 Calendario Attività",
      main_card_calendar_desc: "Registra i punteggi quotidiani e gestisci i progressi.",
      main_card_weekly: "💰 Ricompense Settimanali",
      main_card_weekly_desc: "Controlla le ricompense in base al tuo contributo.",
      main_card_strategy: "🗺️ Mappa Strategica",
      main_card_strategy_desc: "Consulta ordini in tempo reale sulla mappa. (In costruzione...)",
      main_card_deckbuilder: "🃏 Costruttore Mazzo",
      main_card_deckbuilder_desc: "Progetta il miglior mazzo con l'editor Yaphalla.",
      main_card_members: "👥 Lista Membri",
      main_card_members_desc: "Visualizza info e stato attività dei membri.",
      main_card_admin: "🛡️ Approvazione & Gestione Ruoli",
      main_card_admin_desc: "Gestisci le approvazioni e i ruoli dei nuovi membri.",
      guide_title: "🚩 Guida della Gilda Phoenix",
      guide_calendar_desc: "Inserisci il tuo punteggio ogni giorno. Dimenticarlo potrebbe escluderti dalle ricompense.",
      guide_strategy_desc: "I marker sulla mappa sono ordini in tempo reale. Controlla prima di attaccare.",
      guide_weekly_desc: "Ogni domenica sera le ricompense vengono calcolate automaticamente.",
      adm_filter_all: "Tutti",
      adm_filter_pending: "⏳ In Attesa",
      adm_filter_approved: "✅ Approvato",
      admin_dist_setting: "Impostazione distribuzione (Staff)",
      btn_save_dist: "Salva dati",
      admin_manage_attendance: "Gestione presenze (Staff)",
      col_date: "Data",
      col_edit: "Modifica",
      col_laby_short: "Laby",
      col_duel_short: "Duello",
      col_act_short: "Attività",
      col_manage: "Gestisci",
      msg_no_records: "Nessun record questa settimana.",
      login_nick_prompt: "Registra nickname",
      login_nick_btn: "Registrati",
      login_pending: "⏳ In attesa di approvazione",
      login_pending_desc: "Avrai accesso dopo l'approvazione dell'admin.",
      noti_btn_write: "✍️ Scrivi",
      pending_live: "Monitoraggio live · Reindirizzamento auto all'approvazione",
      mem_title: "👥 Bacheca Membri",
      txt_guide: "Guida",
      txt_install: "Installa",
      att_guide_btn: "💡 Come si usa",
      att_error_notice: "Se hai inserito un punteggio errato, contatta lo staff.",
      att_activity_notice: "Per i punti attività, inserisci il valore dalla lista membri.",

      /* ── strategia / editor ── */
      stra_title:  "🗺️ Mappa Strategica Guerra Gilda",
      stra_empty:  "Nessuna mappa registrata.",
      deck_folder: "⚔️ Quartier Generale Deck",
      share_modal_title: "🔗 Condividi Formazione",
      share_btn_cancel:  "Annulla",
      board_title:       "🔗 Bacheca Condivisione Formazioni",
      board_subtitle:    "Condividi i tuoi deck e formazioni della gilda",
      board_open_editor: "✗ Apri Editor",
      board_filter_all:  "Tutti",
      board_filter_1:    "1 Formazione",
      board_filter_2:    "2 Formazioni",
      board_filter_3:    "3 Formazioni",
      menu_infographics:    "Infografiche Yaphalla",
      infographics_subtitle: "I post del canale Discord vengono riflessi automaticamente",
      menu_yaphalla_guides:  "Guide Yaphalla",
      yaphalla_guides_subtitle: "I post del canale Discord #yaphalla-guides vengono riflessi in tempo reale",
      weekly_guide_btn: "💡 Come Usare",
    },

    es: {
      menu_home:         "🏠 Inicio",
      menu_notice:       "📢 Avisos",
      menu_calendar:     "📅 Asistencia Semanal",
      menu_weekly:       "💰 Liquidación Semanal",
      menu_history:      "📜 Historial de Liquidación",
      menu_strategy:     "🗺️ Mapa Estratégico",
      menu_deckbuilder:  "🃏 Constructor de Mazo",
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
      att_btn_past:        "📝 Entrada Pasada",
      att_btn_done:        "✅ Guardado",
      att_summary_title:   "Esta Semana",
      att_summary_days:    "días registr.",
      att_summary_total:   "Total",
      att_penalty_days:    "Penalización",
      att_guide_modal_title:    "📅 Guía de Asistencia Semanal",
      att_guide_modal_subtitle: "¿Nuevo aquí? ¡Sigue los pasos a continuación!",
      att_guide_close:          "✅ ¡Entendido!",
      weekly_guide_modal_title:    "💰 Guía de Liquidación Semanal",
      weekly_guide_modal_subtitle: "¡Aprende cómo funciona el sistema de liquidación!",
      weekly_guide_close:          "✅ ¡Entendido!",

      /* ── común ── */
      btn_save:  "Guardar",
      btn_close: "Cerrar",
      main_welcome: "Bienvenido, ",
      main_admin_title: "🛠️ Menú Admin",
      main_card_notice: "📢 Anuncios del Clan",
      main_card_notice_desc: "Consulta las últimas noticias y actualizaciones del clan.",
      main_card_calendar: "📅 Calendario de Actividad",
      main_card_calendar_desc: "Registra tus puntos diarios y gestiona tu progreso.",
      main_card_weekly: "💰 Recompensas Semanales",
      main_card_weekly_desc: "Consulta tus recompensas según tu contribución.",
      main_card_strategy: "🗺️ Mapa Estratégico",
      main_card_strategy_desc: "Consulta órdenes en tiempo real en el mapa. (En construcción...)",
      main_card_deckbuilder: "🃏 Constructor de Mazo",
      main_card_deckbuilder_desc: "Diseña el mejor mazo con el editor Yaphalla.",
      main_card_members: "👥 Lista de Miembros",
      main_card_members_desc: "Ve la información y actividad de los miembros.",
      main_card_admin: "🛡️ Aprobación y Gestión de Roles",
      main_card_admin_desc: "Gestiona aprobaciones y configuración de roles.",
      guide_title: "🚩 Guía del Clan Phoenix",
      guide_calendar_desc: "Ingresa tu puntuación diariamente. Olvidarlo puede excluirte de las recompensas.",
      guide_strategy_desc: "Los marcadores en el mapa son órdenes en tiempo real. Verifica antes de atacar.",
      guide_weekly_desc: "Cada domingo por la noche, las recompensas se calculan automáticamente.",
      adm_filter_all: "Todos",
      adm_filter_pending: "⏳ Pendiente",
      adm_filter_approved: "✅ Aprobado",
      admin_dist_setting: "Configuración de distribución (Personal)",
      btn_save_dist: "Guardar datos",
      admin_manage_attendance: "Gestión de asistencia (Personal)",
      col_date: "Fecha",
      col_edit: "Editar",
      col_laby_short: "Laby",
      col_duel_short: "Duelo",
      col_act_short: "Actividad",
      col_manage: "Gestionar",
      msg_no_records: "Sin registros esta semana.",
      login_nick_prompt: "Registrar apodo",
      login_nick_btn: "Registrar",
      login_pending: "⏳ Esperando aprobación",
      login_pending_desc: "Tendrás acceso después de la aprobación del admin.",
      noti_btn_write: "✍️ Escribir",
      pending_live: "Monitoreo en vivo · Redirección automática al aprobar",
      mem_title: "👥 Panel de Estado de Miembros",
      txt_guide: "Guía",
      txt_install: "Instalar",
      att_guide_btn: "💡 Cómo usar",
      att_error_notice: "Si ingresaste una puntuación incorrecta, contacta al personal.",
      att_activity_notice: "Para puntos de actividad, ingresa el valor de la lista de miembros.",

      /* ── estrategia / editor ── */
      stra_title:  "🗺️ Mapa Estratégico Guerra de Clan",
      stra_empty:  "No hay mapa registrado.",
      deck_folder: "⚔️ Centro de Construcción de Mazos",
      share_modal_title: "🔗 Compartir Formación",
      share_btn_cancel:  "Cancelar",
      board_title:       "🔗 Tablero de Formaciones",
      board_subtitle:    "Comparte tus mazos y formaciones de clan",
      board_open_editor: "✗ Abrir Editor",
      board_filter_all:  "Todos",
      board_filter_1:    "1 Formación",
      board_filter_2:    "2 Formaciones",
      board_filter_3:    "3 Formaciones",
      menu_infographics:    "Infografías Yaphalla",
      infographics_subtitle: "Los posts del canal Discord se reflejan automáticamente",
      menu_yaphalla_guides:  "Guías Yaphalla",
      yaphalla_guides_subtitle: "Los posts del canal Discord #yaphalla-guides se reflejan en tiempo real",
      weekly_guide_btn: "💡 Cómo Usar",
    },

    "zh-CN": {
      menu_home:         "🏠 首页",
      menu_notice:       "📢 公告",
      menu_calendar:     "📅 每周出勤",
      menu_weekly:       "💰 每周结算",
      menu_history:      "📜 结算记录",
      menu_strategy:     "🗺️ 战略地图",
      menu_deckbuilder:  "🃏 卡组构建器",
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
      att_btn_past:        "📝 补录出勤",
      att_btn_done:        "✅ 已保存",
      att_summary_title:   "本周",
      att_summary_days:    "天记录",
      att_summary_total:   "合计",
      att_penalty_days:    "惩罚",
      att_guide_modal_title:    "📅 每周出勤使用指南",
      att_guide_modal_subtitle: "初次使用？请按照以下步骤操作！",
      att_guide_close:          "✅ 了解了！",
      weekly_guide_modal_title:    "💰 每周结算使用指南",
      weekly_guide_modal_subtitle: "了解结算系统如何运作！",
      weekly_guide_close:          "✅ 了解了！",

      /* ── 通用 ── */
      btn_save:  "保存",
      btn_close: "关闭",
      main_welcome: "欢迎，",
      main_admin_title: "🛠️ 管理员菜单",
      main_card_notice: "📢 公会公告",
      main_card_notice_desc: "查看公会最新消息和更新内容。",
      main_card_calendar: "📅 活动日历",
      main_card_calendar_desc: "每天记录分数并管理累计状况。",
      main_card_weekly: "💰 每周奖励",
      main_card_weekly_desc: "根据本周贡献查看分配的奖励。",
      main_card_strategy: "🗺️ 战略地图",
      main_card_strategy_desc: "在地图上查看实时命令和目标信息。（建设中...）",
      main_card_deckbuilder: "🃏 卡组构建器",
      main_card_deckbuilder_desc: "使用Yaphalla编辑器设计最佳卡组。",
      main_card_members: "👥 成员列表",
      main_card_members_desc: "查看公会成员信息和活动状态。",
      main_card_admin: "🛡️ 审批与权限管理",
      main_card_admin_desc: "管理新成员审批和等级设置。",
      guide_title: "🚩 Phoenix 公会使用指南",
      guide_calendar_desc: "每天输入您的分数。遗漏可能导致被排除在每周奖励之外。",
      guide_strategy_desc: "地图上的标记是实时命令，攻击前请务必确认。",
      guide_weekly_desc: "每周日晚上，系统会根据活动量自动计算奖励。",
      adm_filter_all: "全部",
      adm_filter_pending: "⏳ 待审核",
      adm_filter_approved: "✅ 已批准",
      admin_dist_setting: "分配数量设置（管理员专用）",
      btn_save_dist: "保存分配数据",
      admin_manage_attendance: "全员出勤管理（管理员专用）",
      col_date: "日期",
      col_edit: "修改",
      col_laby_short: "迷宫",
      col_duel_short: "决斗",
      col_act_short: "活跃度",
      col_manage: "管理",
      msg_no_records: "本周暂无记录。",
      login_nick_prompt: "注册昵称",
      login_nick_btn: "注册",
      login_pending: "⏳ 等待管理员审批",
      login_pending_desc: "审批通过后可自动登录。",
      noti_btn_write: "✍️ 写公告",
      pending_live: "实时监控 · 审批后自动跳转",
      mem_title: "👥 公会成员状态栏",
      txt_guide: "使用指南",
      txt_install: "安装",
      att_guide_btn: "💡 使用方法及计算方式",
      att_error_notice: "如果出勤分数输入有误，请联系管理员。",
      att_activity_notice: "公会活跃度分数请输入成员名单中的活跃度数值。",

      /* ── 战略 / 编辑器 ── */
      stra_title:  "🗺️ 公会战作战地图",
      stra_empty:  "暂无地图。",
      deck_folder: "⚔️ 卡组构建综合指挥室",
      share_modal_title: "🔗 分享阵型",
      share_btn_cancel:  "取消",
      board_title:       "🔗 阵型分享公告板",
      board_subtitle:    "分享公会攻略卡组及阵型",
      board_open_editor: "✗ 打开编辑器",
      board_filter_all:  "全部",
      board_filter_1:    "1个阵型",
      board_filter_2:    "2个阵型",
      board_filter_3:    "3个阵型",
      menu_infographics:    "Yaphalla 综合信息图",
      infographics_subtitle: "Discord 频道内容自动同步",
      menu_yaphalla_guides:  "Yaphalla 攻略指南",
      yaphalla_guides_subtitle: "Discord #yaphalla-guides 频道内容实时同步",
      weekly_guide_btn: "💡 使用方法",
    },

    "zh-TW": {
      menu_home:         "🏠 首頁",
      menu_notice:       "📢 公告",
      menu_calendar:     "📅 每週出勤",
      menu_weekly:       "💰 每週結算",
      menu_history:      "📜 結算記錄",
      menu_strategy:     "🗺️ 戰略地圖",
      menu_deckbuilder:  "🃏 卡組構建器",
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
      att_btn_past:        "📝 補錄出勤",
      att_btn_done:        "✅ 已儲存",
      att_summary_title:   "本週",
      att_summary_days:    "天記錄",
      att_summary_total:   "合計",
      att_penalty_days:    "懲罰",
      att_guide_modal_title:    "📅 每週出勤使用指南",
      att_guide_modal_subtitle: "初次使用？請按照以下步驟操作！",
      att_guide_close:          "✅ 明白了！",
      weekly_guide_modal_title:    "💰 每週結算使用指南",
      weekly_guide_modal_subtitle: "了解結算系統如何運作！",
      weekly_guide_close:          "✅ 明白了！",

      /* ── 通用 ── */
      btn_save:  "儲存",
      btn_close: "關閉",
      main_welcome: "歡迎，",
      main_admin_title: "🛠️ 管理員選單",
      main_card_notice: "📢 公會公告",
      main_card_notice_desc: "查看公會最新消息和更新內容。",
      main_card_calendar: "📅 活動日曆",
      main_card_calendar_desc: "每天記錄分數並管理累計狀況。",
      main_card_weekly: "💰 每週獎勵",
      main_card_weekly_desc: "根據本週貢獻查看分配的獎勵。",
      main_card_strategy: "🗺️ 戰略地圖",
      main_card_strategy_desc: "在地圖上查看即時命令和目標資訊。（建設中...）",
      main_card_deckbuilder: "🃏 卡組構建器",
      main_card_deckbuilder_desc: "使用Yaphalla編輯器設計最佳卡組。",
      main_card_members: "👥 成員列表",
      main_card_members_desc: "查看公會成員資訊和活動狀態。",
      main_card_admin: "🛡️ 審批與權限管理",
      main_card_admin_desc: "管理新成員審批和等級設定。",
      guide_title: "🚩 Phoenix 公會使用指南",
      guide_calendar_desc: "每天輸入您的分數。遺漏可能導致被排除在每週獎勵之外。",
      guide_strategy_desc: "地圖上的標記是即時命令，攻擊前請務必確認。",
      guide_weekly_desc: "每週日晚上，系統會根據活動量自動計算獎勵。",
      adm_filter_all: "全部",
      adm_filter_pending: "⏳ 待審核",
      adm_filter_approved: "✅ 已批准",
      admin_dist_setting: "分配數量設定（管理員專用）",
      btn_save_dist: "儲存分配數據",
      admin_manage_attendance: "全員出勤管理（管理員專用）",
      col_date: "日期",
      col_edit: "修改",
      col_laby_short: "迷宮",
      col_duel_short: "決鬥",
      col_act_short: "活躍度",
      col_manage: "管理",
      msg_no_records: "本週暫無記錄。",
      login_nick_prompt: "註冊暱稱",
      login_nick_btn: "註冊",
      login_pending: "⏳ 等待管理員審批",
      login_pending_desc: "審批通過後可自動登入。",
      noti_btn_write: "✍️ 寫公告",
      pending_live: "即時監控 · 審批後自動跳轉",
      mem_title: "👥 公會成員狀態欄",
      txt_guide: "使用指南",
      txt_install: "安裝",
      att_guide_btn: "💡 使用方法及計算方式",
      att_error_notice: "如果出勤分數輸入有誤，請聯絡管理員。",
      att_activity_notice: "公會活躍度分數請輸入成員名單中的活躍度數值。",

      /* ── 戰略 / 編輯器 ── */
      stra_title:  "🗺️ 公會戰作戰地圖",
      stra_empty:  "暫無地圖。",
      deck_folder: "⚔️ 卡組構建綜合指揮室",
      share_modal_title: "🔗 分享陣型",
      share_btn_cancel:  "取消",
      board_title:       "🔗 陣型分享公告板",
      board_subtitle:    "分享公會攻略卡組及陣型",
      board_open_editor: "✗ 開啟編輯器",
      board_filter_all:  "全部",
      board_filter_1:    "1個陣型",
      board_filter_2:    "2個陣型",
      board_filter_3:    "3個陣型",
      menu_infographics:    "Yaphalla 綜合資訊圖",
      infographics_subtitle: "Discord 頻道內容自動同步",
      menu_yaphalla_guides:  "Yaphalla 攻略指南",
      yaphalla_guides_subtitle: "Discord #yaphalla-guides 頻道內容即時同步",
      weekly_guide_btn: "💡 使用方法",
    },

    ja: {
      menu_home:         "🏠 ホーム",
      menu_notice:       "📢 お知らせ",
      menu_calendar:     "📅 週間出席",
      menu_weekly:       "💰 週間精算",
      menu_history:      "📜 精算履歴",
      menu_strategy:     "🗺️ 戦略マップ",
      menu_deckbuilder:  "🃏 デッキビルダー",
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
      att_btn_past:        "📝 過去の出席",
      att_btn_done:        "✅ 保存済み",
      att_summary_title:   "今週",
      att_summary_days:    "日記録",
      att_summary_total:   "合計",
      att_penalty_days:    "ペナルティ",
      att_guide_modal_title:    "📅 週間出席利用ガイド",
      att_guide_modal_subtitle: "初めてお使いですか？以下の手順に従ってください！",
      att_guide_close:          "✅ わかりました！",
      weekly_guide_modal_title:    "💰 週間精算利用ガイド",
      weekly_guide_modal_subtitle: "精算システムの仕組みを確認してください！",
      weekly_guide_close:          "✅ わかりました！",

      /* ── 共通 ── */
      btn_save:  "保存",
      btn_close: "閉じる",
      main_welcome: "ようこそ、",
      main_admin_title: "🛠️ 管理者メニュー",
      main_card_notice: "📢 ギルドお知らせ",
      main_card_notice_desc: "ギルドの最新ニュースとアップデートを確認しましょう。",
      main_card_calendar: "📅 活動カレンダー",
      main_card_calendar_desc: "毎日スコアを記録して累計状況を管理しましょう。",
      main_card_weekly: "💰 週間報酬",
      main_card_weekly_desc: "今週の貢献に基づいて分配された報酬を確認しましょう。",
      main_card_strategy: "🗺️ 戦略マップ",
      main_card_strategy_desc: "マップでリアルタイムの命令を確認しましょう。（工事中...）",
      main_card_deckbuilder: "🃏 デッキビルダー",
      main_card_deckbuilder_desc: "Yaphallaエディターで最高のデッキを設計しましょう。",
      main_card_members: "👥 メンバー一覧",
      main_card_members_desc: "ギルドメンバーの情報と活動状況を確認しましょう。",
      main_card_admin: "🛡️ 承認・権限管理",
      main_card_admin_desc: "新規メンバーの承認とランク設定を管理します。",
      guide_title: "🚩 Phoenix ギルド利用ガイド",
      guide_calendar_desc: "毎日スコアを入力してください。漏れると週間報酬から除外される場合があります。",
      guide_strategy_desc: "マップ上のマーカーはリアルタイム命令です。攻撃前に必ず確認してください。",
      guide_weekly_desc: "毎週日曜の夜、活動量に基づいて報酬が自動計算されます。",
      adm_filter_all: "すべて",
      adm_filter_pending: "⏳ 承認待ち",
      adm_filter_approved: "✅ 承認済み",
      admin_dist_setting: "分配数量設定（運営専用）",
      btn_save_dist: "分配データ保存",
      admin_manage_attendance: "全メンバー出席管理（運営専用）",
      col_date: "日付",
      col_edit: "修正",
      col_laby_short: "迷宮",
      col_duel_short: "決闘",
      col_act_short: "活躍度",
      col_manage: "管理",
      msg_no_records: "今週の記録がありません。",
      login_nick_prompt: "ニックネームを登録",
      login_nick_btn: "登録",
      login_pending: "⏳ 管理者の承認待ち",
      login_pending_desc: "承認後に自動でアクセスできます。",
      noti_btn_write: "✍️ 書く",
      pending_live: "リアルタイム監視中 · 承認後に自動移動",
      mem_title: "👥 メンバー状態ボード",
      txt_guide: "ガイド",
      txt_install: "インストール",
      att_guide_btn: "💡 利用方法と算定方式",
      att_error_notice: "出席スコアを誤入力した場合は運営にお問い合わせください。",
      att_activity_notice: "ギルド活躍度スコアはメンバー一覧の活躍度を入力してください。",

      /* ── 戦略 / エディター ── */
      stra_title:  "🗺️ ギルド戦作戦マップ",
      stra_empty:  "登録されたマップがありません。",
      deck_folder: "⚔️ デッキ構築総合司令室",
      share_modal_title: "🔗 編成をシェア",
      share_btn_cancel:  "キャンセル",
      board_title:       "🔗 編成シェア掲示板",
      board_subtitle:    "ギルドの攻略デッキと編成をシェアするスペースです",
      board_open_editor: "✗ エディターを開く",
      board_filter_all:  "すべて",
      board_filter_1:    "1編成",
      board_filter_2:    "2編成",
      board_filter_3:    "3編成",
      menu_infographics:    "Yaphalla 総合インフォグラフィック",
      infographics_subtitle: "Discordチャンネルの投稿が自動で反映されます",
      menu_yaphalla_guides:  "Yaphalla ガイド",
      yaphalla_guides_subtitle: "Discord #yaphalla-guides チャンネルの投稿がリアルタイムで反映されます",
      weekly_guide_btn: "💡 使い方を見る",
    },

    pt: {
      menu_home:         "🏠 Início",
      menu_notice:       "📢 Avisos",
      menu_calendar:     "📅 Frequência Semanal",
      menu_weekly:       "💰 Liquidação Semanal",
      menu_history:      "📜 Histórico de Liquidação",
      menu_strategy:     "🗺️ Mapa Estratégico",
      menu_deckbuilder:  "🃏 Construtor de Deck",
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
      att_btn_past:        "📝 Entrada Passada",
      att_btn_done:        "✅ Salvo",
      att_summary_title:   "Esta Semana",
      att_summary_days:    "dias regist.",
      att_summary_total:   "Total",
      att_penalty_days:    "Penalidade",
      att_guide_modal_title:    "📅 Guia de Frequência Semanal",
      att_guide_modal_subtitle: "É novo aqui? Siga os passos abaixo!",
      att_guide_close:          "✅ Entendi!",
      weekly_guide_modal_title:    "💰 Guia de Liquidação Semanal",
      weekly_guide_modal_subtitle: "Aprenda como o sistema de liquidação funciona!",
      weekly_guide_close:          "✅ Entendi!",

      /* ── comum ── */
      btn_save:  "Salvar",
      btn_close: "Fechar",
      main_welcome: "Bem-vindo, ",
      main_admin_title: "🛠️ Menu Admin",
      main_card_notice: "📢 Avisos da Guilda",
      main_card_notice_desc: "Confira as últimas notícias e atualizações da guilda.",
      main_card_calendar: "📅 Calendário de Atividade",
      main_card_calendar_desc: "Registre pontuações diárias e gerencie o progresso.",
      main_card_weekly: "💰 Recompensas Semanais",
      main_card_weekly_desc: "Confira suas recompensas com base na contribuição.",
      main_card_strategy: "🗺️ Mapa Estratégico",
      main_card_strategy_desc: "Veja ordens em tempo real no mapa. (Em construção...)",
      main_card_deckbuilder: "🃏 Construtor de Deck",
      main_card_deckbuilder_desc: "Projete o melhor deck com o editor Yaphalla.",
      main_card_members: "👥 Lista de Membros",
      main_card_members_desc: "Veja informações e atividade dos membros.",
      main_card_admin: "🛡️ Aprovação e Gestão de Funções",
      main_card_admin_desc: "Gerencie aprovações e configurações de funções.",
      guide_title: "🚩 Guia da Guilda Phoenix",
      guide_calendar_desc: "Insira sua pontuação diariamente. Esquecer pode excluí-lo das recompensas.",
      guide_strategy_desc: "Marcadores no mapa são ordens em tempo real. Verifique antes de atacar.",
      guide_weekly_desc: "Todo domingo à noite, as recompensas são calculadas automaticamente.",
      adm_filter_all: "Todos",
      adm_filter_pending: "⏳ Pendente",
      adm_filter_approved: "✅ Aprovado",
      admin_dist_setting: "Configuração de distribuição (Staff)",
      btn_save_dist: "Salvar dados de distribuição",
      admin_manage_attendance: "Gestão de frequência (Staff)",
      col_date: "Data",
      col_edit: "Editar",
      col_laby_short: "Laby",
      col_duel_short: "Duelo",
      col_act_short: "Atividade",
      col_manage: "Gerenciar",
      msg_no_records: "Sem registros esta semana.",
      login_nick_prompt: "Registrar apelido",
      login_nick_btn: "Registrar",
      login_pending: "⏳ Aguardando aprovação",
      login_pending_desc: "Você terá acesso após a aprovação do admin.",
      noti_btn_write: "✍️ Escrever",
      pending_live: "Monitoramento ao vivo · Redirecionamento automático na aprovação",
      mem_title: "👥 Painel de Status dos Membros",
      txt_guide: "Guia",
      txt_install: "Instalar",
      att_guide_btn: "💡 Como usar e calcular",
      att_error_notice: "Se inseriu uma pontuação incorreta, entre em contato com o staff.",
      att_activity_notice: "Para pontos de atividade, insira o valor da lista de membros.",

      /* ── estratégia / editor ── */
      stra_title:  "🗺️ Mapa Estratégico de Guerra da Guilda",
      stra_empty:  "Nenhum mapa registrado.",
      deck_folder: "⚔️ Quartel General de Construção de Decks",
      share_modal_title: "🔗 Compartilhar Formação",
      share_btn_cancel:  "Cancelar",
      board_title:       "🔗 Quadro de Compartilhamento de Formações",
      board_subtitle:    "Compartilhe seus decks e formações da guilda",
      board_open_editor: "✗ Abrir Editor",
      board_filter_all:  "Todos",
      board_filter_1:    "1 Formação",
      board_filter_2:    "2 Formações",
      board_filter_3:    "3 Formações",
      menu_infographics:    "Infográficos Yaphalla",
      infographics_subtitle: "Posts do canal Discord são refletidos automaticamente",
      menu_yaphalla_guides:  "Guias Yaphalla",
      yaphalla_guides_subtitle: "Posts do canal Discord #yaphalla-guides são refletidos em tempo real",
      weekly_guide_btn: "💡 Como Usar",
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
