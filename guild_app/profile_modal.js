/**
 * profile_modal.js
 * Phoenix Guild — Profile selector modal (inline popup, no page navigation)
 *
 * Usage: add <script src="profile_modal.js"></script> to any page.
 * Then call openProfileModal() from any button/onclick.
 *
 * Requires: firebase (auth + firestore + storage) already initialised,
 *           showToast() from ui_utils.js
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     AFK Journey hero list (afk-journey.fandom.com / CC-BY-SA)
  ══════════════════════════════════════════════════════════ */
  const AFK_HEROES = [
    {name:"Aliceth",  url:"https://static.wikia.nocookie.net/afk-journey/images/2/28/Hero_Aliceth.png/revision/latest"},
    {name:"Alna",     url:"https://static.wikia.nocookie.net/afk-journey/images/e/e5/Hero_Alna.png/revision/latest"},
    {name:"Alsa",     url:"https://static.wikia.nocookie.net/afk-journey/images/9/9e/Hero_Alsa.png/revision/latest"},
    {name:"Antandra", url:"https://static.wikia.nocookie.net/afk-journey/images/1/13/Hero_Antandra.png/revision/latest"},
    {name:"Arden",    url:"https://static.wikia.nocookie.net/afk-journey/images/2/29/Hero_Arden.png/revision/latest"},
    {name:"Atalanta", url:"https://static.wikia.nocookie.net/afk-journey/images/5/55/Hero_Atalanta.png/revision/latest"},
    {name:"Athalia",  url:"https://static.wikia.nocookie.net/afk-journey/images/3/3c/Hero_Athalia.png/revision/latest"},
    {name:"Aurora",   url:"https://static.wikia.nocookie.net/afk-journey/images/5/5a/Hero_Aurora.png/revision/latest"},
    {name:"Baelran",  url:"https://static.wikia.nocookie.net/afk-journey/images/9/9e/Hero_Baelran.png/revision/latest"},
    {name:"Berial",   url:"https://static.wikia.nocookie.net/afk-journey/images/0/0f/Hero_Berial.png/revision/latest"},
    {name:"Bonnie",   url:"https://static.wikia.nocookie.net/afk-journey/images/8/8d/Hero_Bonnie.png/revision/latest"},
    {name:"Brutus",   url:"https://static.wikia.nocookie.net/afk-journey/images/9/91/Hero_Brutus.png/revision/latest"},
    {name:"Bryon",    url:"https://static.wikia.nocookie.net/afk-journey/images/9/9b/Hero_Bryon.png/revision/latest"},
    {name:"Callan",   url:"https://static.wikia.nocookie.net/afk-journey/images/3/35/Hero_Callan.png/revision/latest"},
    {name:"Carolina", url:"https://static.wikia.nocookie.net/afk-journey/images/1/10/Hero_Carolina.png/revision/latest"},
    {name:"Cassadee", url:"https://static.wikia.nocookie.net/afk-journey/images/a/a6/Hero_Cassadee.png/revision/latest"},
    {name:"Cecia",    url:"https://static.wikia.nocookie.net/afk-journey/images/3/3b/Hero_Cecia.png/revision/latest"},
    {name:"Chippy",   url:"https://static.wikia.nocookie.net/afk-journey/images/f/ff/Hero_Chippy.png/revision/latest"},
    {name:"Contess",  url:"https://static.wikia.nocookie.net/afk-journey/images/d/db/Hero_Contess.png/revision/latest"},
    {name:"Cryonaia", url:"https://static.wikia.nocookie.net/afk-journey/images/5/57/Hero_Cryonaia.png/revision/latest"},
    {name:"Cyran",    url:"https://static.wikia.nocookie.net/afk-journey/images/7/73/Cyran.png/revision/latest"},
    {name:"Daimon",   url:"https://static.wikia.nocookie.net/afk-journey/images/7/73/Hero_Daimon.png/revision/latest"},
    {name:"Damian",   url:"https://static.wikia.nocookie.net/afk-journey/images/a/ab/Hero_Damian.png/revision/latest"},
    {name:"Dionel",   url:"https://static.wikia.nocookie.net/afk-journey/images/6/67/Hero_Dionel.png/revision/latest"},
    {name:"Dunlingr", url:"https://static.wikia.nocookie.net/afk-journey/images/4/4d/Hero_Dunlingr.png/revision/latest"},
    {name:"Eironn",   url:"https://static.wikia.nocookie.net/afk-journey/images/a/aa/Hero_Eironn.png/revision/latest"},
    {name:"Evie",     url:"https://static.wikia.nocookie.net/afk-journey/images/5/53/Hero_Evie.png/revision/latest"},
    {name:"Faramor",  url:"https://static.wikia.nocookie.net/afk-journey/images/6/6d/Hero_Faramor.png/revision/latest"},
    {name:"Fay",      url:"https://static.wikia.nocookie.net/afk-journey/images/c/c8/Hero_Fay.png/revision/latest"},
    {name:"Florabelle",url:"https://static.wikia.nocookie.net/afk-journey/images/1/13/Hero_Florabelle.png/revision/latest"},
    {name:"Galahad",  url:"https://static.wikia.nocookie.net/afk-journey/images/9/98/Hero_Galahad.png/revision/latest"},
    {name:"Gerda",    url:"https://static.wikia.nocookie.net/afk-journey/images/2/29/Hero_Gerda.png/revision/latest"},
    {name:"Granny Dahnie", url:"https://static.wikia.nocookie.net/afk-journey/images/1/18/Hero_Granny_Dahnie.png/revision/latest"},
    {name:"Hammie",   url:"https://static.wikia.nocookie.net/afk-journey/images/e/eb/Hero_Hammie.png/revision/latest"},
    {name:"Harak",    url:"https://static.wikia.nocookie.net/afk-journey/images/8/81/Hero_Harak.png/revision/latest"},
    {name:"Hewynn",   url:"https://static.wikia.nocookie.net/afk-journey/images/0/0d/Hero_Hewynn.png/revision/latest"},
    {name:"Hodgkin",  url:"https://static.wikia.nocookie.net/afk-journey/images/4/4a/Hero_Hodgkin.png/revision/latest"},
    {name:"Hogan",    url:"https://static.wikia.nocookie.net/afk-journey/images/7/7a/Hero_Hogan.png/revision/latest"},
    {name:"Hugin",    url:"https://static.wikia.nocookie.net/afk-journey/images/8/8e/Hero_Hugin.png/revision/latest"},
    {name:"Igor",     url:"https://static.wikia.nocookie.net/afk-journey/images/a/a2/Hero_Igor.png/revision/latest"},
    {name:"Indris",   url:"https://static.wikia.nocookie.net/afk-journey/images/5/59/Hero_Indris.png/revision/latest"},
    {name:"Kafra",    url:"https://static.wikia.nocookie.net/afk-journey/images/8/83/Hero_Kafra.png/revision/latest"},
    {name:"Koko",     url:"https://static.wikia.nocookie.net/afk-journey/images/f/f9/Hero_Koko.png/revision/latest"},
    {name:"Kordan",   url:"https://static.wikia.nocookie.net/afk-journey/images/c/c8/Hero_Kordan.png/revision/latest"},
    {name:"Korin",    url:"https://static.wikia.nocookie.net/afk-journey/images/f/f4/Hero_Korin.png/revision/latest"},
    {name:"Kruger",   url:"https://static.wikia.nocookie.net/afk-journey/images/7/71/Hero_Kruger.png/revision/latest"},
    {name:"Kulu",     url:"https://static.wikia.nocookie.net/afk-journey/images/5/5c/Hero_Kulu.png/revision/latest"},
    {name:"Laios",    url:"https://static.wikia.nocookie.net/afk-journey/images/2/24/Hero_Laios.png/revision/latest"},
    {name:"Lenya",    url:"https://static.wikia.nocookie.net/afk-journey/images/6/68/Hero_Lenya.png/revision/latest"},
    {name:"Lily May", url:"https://static.wikia.nocookie.net/afk-journey/images/b/be/Hero_Lily_May.png/revision/latest"},
    {name:"Lorsan",   url:"https://static.wikia.nocookie.net/afk-journey/images/2/2d/Hero_Lorsan.png/revision/latest"},
    {name:"Lucca",    url:"https://static.wikia.nocookie.net/afk-journey/images/3/3e/Hero_Lucca.png/revision/latest"},
    {name:"Lucius",   url:"https://static.wikia.nocookie.net/afk-journey/images/9/9a/Hero_Lucius.png/revision/latest"},
    {name:"Lucy",     url:"https://static.wikia.nocookie.net/afk-journey/images/8/81/Hero_Lucy.png/revision/latest"},
    {name:"Ludovic",  url:"https://static.wikia.nocookie.net/afk-journey/images/a/a9/Hero_Ludovic.png/revision/latest"},
    {name:"Lumont",   url:"https://static.wikia.nocookie.net/afk-journey/images/3/3a/Hero_Lumont.png/revision/latest"},
    {name:"Lyca",     url:"https://static.wikia.nocookie.net/afk-journey/images/4/4e/Hero_Lyca.png/revision/latest"},
    {name:"Marcille", url:"https://static.wikia.nocookie.net/afk-journey/images/3/3f/Hero_Marcille.png/revision/latest"},
    {name:"Marilee",  url:"https://static.wikia.nocookie.net/afk-journey/images/c/cb/Hero_Marilee.png/revision/latest"},
    {name:"Mehira",   url:"https://static.wikia.nocookie.net/afk-journey/images/a/a6/Hero_Mehira.png/revision/latest"},
    {name:"Merlin",   url:"https://static.wikia.nocookie.net/afk-journey/images/1/17/Hero_Mikola.png/revision/latest"},
    {name:"Mirael",   url:"https://static.wikia.nocookie.net/afk-journey/images/1/16/Hero_Mirael.png/revision/latest"},
    {name:"Nara",     url:"https://static.wikia.nocookie.net/afk-journey/images/5/57/Hero_Nara.png/revision/latest"},
    {name:"Natsu",    url:"https://static.wikia.nocookie.net/afk-journey/images/e/ef/Hero_Natsu.png/revision/latest"},
    {name:"Nazrik",   url:"https://static.wikia.nocookie.net/afk-journey/images/e/ee/Hero_Nazrik.png/revision/latest"},
    {name:"Niru",     url:"https://static.wikia.nocookie.net/afk-journey/images/a/ad/Hero_Niru.png/revision/latest"},
    {name:"Odie",     url:"https://static.wikia.nocookie.net/afk-journey/images/c/c0/Hero_Odie.png/revision/latest"},
    {name:"Pandora",  url:"https://static.wikia.nocookie.net/afk-journey/images/9/9b/Hero_Pandora.png/revision/latest"},
    {name:"Pang",     url:"https://static.wikia.nocookie.net/afk-journey/images/a/a3/Hero_Pang.png/revision/latest"},
    {name:"Parisa",   url:"https://static.wikia.nocookie.net/afk-journey/images/d/d2/Hero_Parisa.png/revision/latest"},
    {name:"Perseus",  url:"https://static.wikia.nocookie.net/afk-journey/images/e/eb/Hero_Perseus.png/revision/latest"},
    {name:"Phraesto", url:"https://static.wikia.nocookie.net/afk-journey/images/1/11/Hero_Phraesto.png/revision/latest"},
    {name:"Pippa",    url:"https://static.wikia.nocookie.net/afk-journey/images/a/a0/Hero_Pippa.png/revision/latest"},
    {name:"Ravion",   url:"https://static.wikia.nocookie.net/afk-journey/images/7/7b/Hero_Ravion.png/revision/latest"},
    {name:"Reinier",  url:"https://static.wikia.nocookie.net/afk-journey/images/5/5e/Hero_Reinier.png/revision/latest"},
    {name:"Rhys",     url:"https://static.wikia.nocookie.net/afk-journey/images/7/77/Hero_Rhys.png/revision/latest"},
    {name:"Rowan",    url:"https://static.wikia.nocookie.net/afk-journey/images/7/7a/Hero_Rowan.png/revision/latest"},
    {name:"Saida",    url:"https://static.wikia.nocookie.net/afk-journey/images/5/58/Hero_Saida.png/revision/latest"},
    {name:"Salazer",  url:"https://static.wikia.nocookie.net/afk-journey/images/d/df/Hero_Salazer.png/revision/latest"},
    {name:"Satrana",  url:"https://static.wikia.nocookie.net/afk-journey/images/0/0e/Hero_Satrana.png/revision/latest"},
    {name:"Scarlita", url:"https://static.wikia.nocookie.net/afk-journey/images/e/e7/Hero_Scarlita.png/revision/latest"},
    {name:"Seth",     url:"https://static.wikia.nocookie.net/afk-journey/images/1/11/Hero_Seth.png/revision/latest"},
    {name:"Shakir",   url:"https://static.wikia.nocookie.net/afk-journey/images/f/fb/Hero_Shakir.png/revision/latest"},
    {name:"Shemira",  url:"https://static.wikia.nocookie.net/afk-journey/images/d/d1/Hero_Shemira.png/revision/latest"},
    {name:"Silven",   url:"https://static.wikia.nocookie.net/afk-journey/images/0/08/Hero_Silven.png/revision/latest"},
    {name:"Silvina",  url:"https://static.wikia.nocookie.net/afk-journey/images/6/63/Hero_Silvina.png/revision/latest"},
    {name:"Sinbad",   url:"https://static.wikia.nocookie.net/afk-journey/images/1/1f/Hero_Sinbad.png/revision/latest"},
    {name:"Smokey & Meerky", url:"https://static.wikia.nocookie.net/afk-journey/images/2/21/Hero_Smokey_%26_Meerky.png/revision/latest"},
    {name:"Solise",   url:"https://static.wikia.nocookie.net/afk-journey/images/3/30/Hero_Solise.png/revision/latest"},
    {name:"Sonja",    url:"https://static.wikia.nocookie.net/afk-journey/images/2/2b/Hero_Sonja.png/revision/latest"},
    {name:"Soren",    url:"https://static.wikia.nocookie.net/afk-journey/images/7/73/Hero_Soren.png/revision/latest"},
    {name:"Talene",   url:"https://static.wikia.nocookie.net/afk-journey/images/6/69/Hero_Talene.png/revision/latest"},
    {name:"Tasi",     url:"https://static.wikia.nocookie.net/afk-journey/images/a/a4/Hero_Tasi.png/revision/latest"},
    {name:"Temesia",  url:"https://static.wikia.nocookie.net/afk-journey/images/e/e1/Hero_Temesia.png/revision/latest"},
    {name:"Thador",   url:"https://static.wikia.nocookie.net/afk-journey/images/2/2b/Hero_Thador.png/revision/latest"},
    {name:"Thoran",   url:"https://static.wikia.nocookie.net/afk-journey/images/8/8f/Hero_Thoran.png/revision/latest"},
    {name:"Tilaya",   url:"https://static.wikia.nocookie.net/afk-journey/images/3/3b/Hero_Tilaya.png/revision/latest"},
    {name:"Ulmus",    url:"https://static.wikia.nocookie.net/afk-journey/images/0/0a/Hero_Ulmus.png/revision/latest"},
    {name:"Vala",     url:"https://static.wikia.nocookie.net/afk-journey/images/b/bb/Hero_Vala.png/revision/latest"},
    {name:"Valen",    url:"https://static.wikia.nocookie.net/afk-journey/images/7/75/Hero_Valen.png/revision/latest"},
    {name:"Valka",    url:"https://static.wikia.nocookie.net/afk-journey/images/5/5a/Hero_Valka.png/revision/latest"},
    {name:"Velara",   url:"https://static.wikia.nocookie.net/afk-journey/images/2/2f/Hero_Velara.png/revision/latest"},
    {name:"Viperian", url:"https://static.wikia.nocookie.net/afk-journey/images/c/c7/Hero_Viperian.png/revision/latest"},
    {name:"Walker",   url:"https://static.wikia.nocookie.net/afk-journey/images/1/17/Hero_Walker.png/revision/latest"},
    {name:"Zandrok",  url:"https://static.wikia.nocookie.net/afk-journey/images/3/30/Hero_Zandrok.png/revision/latest"},
    {name:"Zanie",    url:"https://static.wikia.nocookie.net/afk-journey/images/7/7f/Hero_Zanie.png/revision/latest"},
    {name:"Zorya",    url:"https://static.wikia.nocookie.net/afk-journey/images/c/c7/Hero_Zorya.png/revision/latest"},
  ];

  /* ══════════════════════════════════════════════════════════
     CSS injection (once)
  ══════════════════════════════════════════════════════════ */
  const CSS = `
  #pmOverlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(4px);
    z-index: 9000;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
  }
  #pmOverlay.pm-open { display: flex; }

  #pmPanel {
    background: linear-gradient(160deg, #2a2e3d 0%, #1c1f2a 60%, #16192a 100%);
    border: 1px solid #3a4055;
    border-radius: 20px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: pmSlideIn 0.22s ease;
  }
  @keyframes pmSlideIn {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }

  /* header bar */
  #pmHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 14px;
    border-bottom: 1px solid #3a4055;
    flex-shrink: 0;
  }
  #pmTitle {
    font-size: 15px;
    font-weight: 800;
    color: #f4c430;
    letter-spacing: 0.03em;
  }
  #pmClose {
    background: none;
    border: none;
    color: #666;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
  }
  #pmClose:hover { color: #eee; background: rgba(255,255,255,0.08); }

  /* tabs */
  #pmTabs {
    display: flex;
    border-bottom: 1px solid #3a4055;
    background: rgba(0,0,0,0.2);
    flex-shrink: 0;
  }
  .pm-tab {
    flex: 1;
    padding: 13px 8px;
    text-align: center;
    font-size: 13px;
    color: #888;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    font-weight: 600;
  }
  .pm-tab.active { color: #eee; }
  .pm-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 20%; right: 20%;
    height: 2px;
    background: #f4c430;
    border-radius: 2px 2px 0 0;
  }

  /* preview */
  #pmPreviewArea {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0 14px;
    background: linear-gradient(180deg, rgba(244,196,48,0.04) 0%, transparent 100%);
    flex-shrink: 0;
  }
  #pmPreviewRing {
    width: 80px; height: 80px;
    border-radius: 50%;
    border: 3px solid #f4c430;
    box-shadow: 0 0 20px rgba(244,196,48,0.3);
    overflow: hidden;
    animation: pmPulse 3s ease-in-out infinite;
  }
  @keyframes pmPulse {
    0%,100% { box-shadow: 0 0 20px rgba(244,196,48,0.3); }
    50%      { box-shadow: 0 0 34px rgba(244,196,48,0.5); }
  }
  #pmPreviewRing img { width:100%; height:100%; object-fit:cover; }

  /* scrollable grid area */
  #pmProfilePane {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #3a4055 transparent;
    padding: 8px 14px 10px;
  }
  #pmProfilePane::-webkit-scrollbar { width: 4px; }
  #pmProfilePane::-webkit-scrollbar-thumb { background: #3a4055; border-radius: 2px; }

  .pm-section-label {
    font-size: 10px;
    font-weight: 700;
    color: #666;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 2px 6px;
  }
  #pmGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
    gap: 8px;
    padding: 2px;
  }
  @media (max-width: 380px) {
    #pmGrid { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 6px; }
  }

  .pm-cell {
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.15s;
  }
  .pm-cell:hover  { transform: scale(1.08); }
  .pm-cell:active { transform: scale(0.95); }
  .pm-cell .pm-img {
    width: 100%; aspect-ratio: 1;
    border-radius: 50%;
    object-fit: cover;
    border: 2.5px solid #3a4055;
    display: block;
    background: #1c1f2a;
    transition: border-color 0.15s;
  }
  .pm-cell:hover .pm-img { border-color: rgba(244,196,48,0.5); }
  .pm-cell.pm-selected .pm-img {
    border-color: #f4c430;
    box-shadow: 0 0 12px rgba(244,196,48,0.5);
  }
  .pm-cell.pm-selected::after {
    content: '✓';
    position: absolute;
    bottom: 2px; right: 2px;
    width: 18px; height: 18px;
    background: #f4c430;
    color: #111;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 18px;
    text-align: center;
  }
  .pm-cell[data-name]:hover::before {
    content: attr(data-name);
    position: absolute;
    bottom: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.85);
    color: #fff;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
  }

  /* upload cell */
  .pm-upload-cell {
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.15s;
    position: relative;
  }
  .pm-upload-cell:hover { transform: scale(1.08); }
  .pm-upload-cell .pm-upload-btn {
    width: 100%; aspect-ratio: 1;
    border-radius: 50%;
    border: 2.5px dashed #555;
    background: rgba(255,255,255,0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: border-color 0.2s, background 0.2s;
  }
  .pm-upload-cell:hover .pm-upload-btn { border-color: #f4c430; background: rgba(244,196,48,0.1); }
  .pm-upload-icon  { font-size: 20px; }
  .pm-upload-label { font-size: 8px; color: #888; font-weight: 600; letter-spacing: 0.05em; }
  .pm-del-btn {
    display: none;
    position: absolute;
    top: 0; right: 0;
    width: 20px; height: 20px;
    background: #ff4444;
    color: #fff;
    border-radius: 50%;
    font-size: 11px;
    line-height: 20px;
    text-align: center;
    cursor: pointer;
    z-index: 10;
    border: none;
  }
  .pm-cell:hover .pm-del-btn { display: block; }

  /* yaphalla pane */
  #pmYaphallaPane {
    flex: 1;
    display: none;
    flex-direction: column;
    min-height: 0;
  }
  #pmYaphallaPane .pm-yap-hint {
    padding: 10px 16px 8px;
    font-size: 11px;
    color: #888;
    line-height: 1.5;
    border-bottom: 1px solid #2a3242;
    flex-shrink: 0;
  }
  #pmYaphallaWrap {
    position: relative;
    flex: 1;
    min-height: 300px;
  }
  #pmYaphallaLoading {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; background: #0f1015; z-index: 5;
  }
  #pmYaphallaBlocked {
    display: none;
    position: absolute; inset: 0;
    background: #0f1015;
    flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; text-align: center; padding: 24px; z-index: 4;
  }
  #pmYaphallaIframe { width: 100%; height: 100%; border: none; display: block; }

  /* save / bottom bar */
  #pmFooter {
    padding: 10px 14px 14px;
    border-top: 1px solid #3a4055;
    flex-shrink: 0;
  }
  #pmSaveBtn {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: #f4c430;
    color: #111;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s, opacity 0.2s;
  }
  #pmSaveBtn:hover    { background: #e5b82d; }
  #pmSaveBtn:active   { transform: scale(0.98); }
  #pmSaveBtn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* upload progress overlay */
  #pmUploadOverlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(15,16,21,0.85);
    z-index: 9100;
    align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
  }
  #pmUploadOverlay.pm-show { display: flex; }

  .pm-spin {
    width: 28px; height: 28px;
    border: 3px solid #333;
    border-top-color: #f4c430;
    border-radius: 50%;
    animation: pmSpin 0.8s linear infinite;
  }
  @keyframes pmSpin { to { transform: rotate(360deg); } }
  #pmUploadStatus { color: #f4c430; font-size: 14px; font-weight: 600; }
  `;

  function injectStyles() {
    if (document.getElementById('pm-styles')) return;
    const s = document.createElement('style');
    s.id = 'pm-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════
     HTML injection
  ══════════════════════════════════════════════════════════ */
  function injectHTML() {
    if (document.getElementById('pmOverlay')) return;

    const el = document.createElement('div');
    el.id = 'pmOverlay';
    el.innerHTML = `
      <div id="pmPanel" role="dialog" aria-modal="true" aria-label="Profile Selector">

        <!-- header -->
        <div id="pmHeader">
          <span id="pmTitle">🎨 Change Profile</span>
          <button id="pmClose" onclick="closeProfileModal()" title="Close">✕</button>
        </div>

        <!-- tabs -->
        <div id="pmTabs">
          <div class="pm-tab active" id="pmTabProfile"  onclick="_pmSwitchTab('profile')">🎨 Profile</div>
          <div class="pm-tab"        id="pmTabYaphalla" onclick="_pmSwitchTab('yaphalla')">🃏 Deck Editor</div>
        </div>

        <!-- preview ring -->
        <div id="pmPreviewArea">
          <div id="pmPreviewRing">
            <img id="pmPreviewImg" src="" alt="preview" />
          </div>
        </div>

        <!-- profile grid pane -->
        <div id="pmProfilePane">
          <div class="pm-section-label">Select your profile icon</div>
          <div id="pmGrid">
            <!-- upload cell -->
            <div class="pm-upload-cell" data-name="Upload photo" onclick="_pmTriggerFile()">
              <div class="pm-upload-btn">
                <span class="pm-upload-icon">📷</span>
                <span class="pm-upload-label">Upload</span>
              </div>
            </div>
            <!-- uploaded preview cell (hidden by default) -->
            <div class="pm-cell" id="pmUploadedCell" style="display:none;" data-name="My upload">
              <img class="pm-img" id="pmUploadedImg" src="" alt="uploaded"
                   onclick="_pmSelectIcon(this,'__uploaded__')" />
              <button class="pm-del-btn" onclick="_pmClearUpload(event)">✕</button>
            </div>
          </div>
        </div>

        <!-- yaphalla pane -->
        <div id="pmYaphallaPane">
          <div class="pm-yap-hint">
            💡 Set up your deck in the Yaphalla editor, take a screenshot,
            then upload it in the Profile tab.
          </div>
          <div id="pmYaphallaWrap">
            <div id="pmYaphallaLoading">
              <div class="pm-spin"></div>
              <span style="font-size:12px;color:#888;">Loading Yaphalla editor…</span>
            </div>
            <div id="pmYaphallaBlocked">
              <div style="font-size:36px;">🔗</div>
              <div style="color:#f4c430;font-size:15px;font-weight:700;">Open external editor</div>
              <div style="color:#aaa;font-size:12px;line-height:1.6;">
                The Yaphalla editor may be blocked<br>from embedding due to security policy.
              </div>
              <button onclick="window.open('https://www.yaphalla.com/editor','_blank')"
                style="background:#f4c430;color:#000;border:none;padding:11px 24px;
                       border-radius:8px;font-size:13px;font-weight:bold;cursor:pointer;">
                🚀 Open Yaphalla Editor
              </button>
            </div>
            <iframe id="pmYaphallaIframe" src="about:blank"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              title="Yaphalla Editor"></iframe>
          </div>
        </div>

        <!-- footer save button -->
        <div id="pmFooter">
          <button id="pmSaveBtn" onclick="_pmSaveProfile()" disabled>In Use</button>
        </div>
      </div>

      <!-- upload progress overlay -->
      <div id="pmUploadOverlay">
        <div class="pm-spin" style="width:36px;height:36px;border-width:3px;"></div>
        <span id="pmUploadStatus">Uploading image…</span>
      </div>

      <!-- hidden file input -->
      <input type="file" id="pmFileInput"
             accept="image/png,image/jpeg,image/jpg,image/webp"
             style="display:none" onchange="_pmHandleFile(event)" />
    `;
    document.body.appendChild(el);

    // Close on backdrop click
    el.addEventListener('click', function(e) {
      if (e.target === el) closeProfileModal();
    });

    // ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeProfileModal();
    });
  }

  /* ══════════════════════════════════════════════════════════
     State
  ══════════════════════════════════════════════════════════ */
  let _uid            = null;
  let _currentPhoto   = null;
  let _selectedUrl    = null;
  let _uploadedData   = null;
  let _gridBuilt      = false;
  let _yapLoaded      = false;
  const FALLBACK = 'https://ui-avatars.com/api/?name=U&background=2a3242&color=f4c430&bold=true';

  /* ══════════════════════════════════════════════════════════
     Public API
  ══════════════════════════════════════════════════════════ */
  window.openProfileModal = async function () {
    injectStyles();
    injectHTML();

    const overlay = document.getElementById('pmOverlay');

    // Reset to profile tab each open
    _pmSwitchTab('profile');

    // Load current photo from Firestore
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      _uid = user.uid;

      const snap = await db.collection('users').doc(_uid).get();
      if (snap.exists) {
        const d = snap.data();
        _currentPhoto = d.customPhotoURL || d.photoURL || user.photoURL || FALLBACK;
      } else {
        _currentPhoto = user.photoURL || FALLBACK;
      }
    } catch(e) {
      const user = firebase.auth().currentUser;
      _currentPhoto = (user && user.photoURL) || FALLBACK;
    }

    _pmSetPreview(_currentPhoto);
    _pmResetSaveBtn();

    if (!_gridBuilt) {
      _pmBuildGrid();
      _gridBuilt = true;
    }

    _pmMarkSelected(_currentPhoto);

    overlay.classList.add('pm-open');
    document.body.style.overflow = 'hidden';
  };

  window.closeProfileModal = function () {
    const overlay = document.getElementById('pmOverlay');
    if (overlay) overlay.classList.remove('pm-open');
    document.body.style.overflow = '';
  };

  /* ══════════════════════════════════════════════════════════
     Internal helpers  (prefixed _pm to avoid collisions)
  ══════════════════════════════════════════════════════════ */
  function _pmSetPreview(url) {
    const img = document.getElementById('pmPreviewImg');
    if (!img) return;
    img.src = url || FALLBACK;
    img.onerror = () => { img.src = FALLBACK; };
  }

  function _pmResetSaveBtn() {
    const btn = document.getElementById('pmSaveBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = 'In Use';
    _selectedUrl = null;
  }

  function _pmBuildGrid() {
    const grid = document.getElementById('pmGrid');
    if (!grid) return;

    // Restore previously uploaded image
    const saved = localStorage.getItem('roider_uploaded_photo');
    if (saved) {
      _uploadedData = saved;
      const cell = document.getElementById('pmUploadedCell');
      const img  = document.getElementById('pmUploadedImg');
      img.src = saved;
      cell.style.display = '';
    }

    // Hero icons
    AFK_HEROES.forEach(hero => {
      const cell = document.createElement('div');
      cell.className   = 'pm-cell';
      cell.dataset.name = hero.name;
      cell.dataset.url  = hero.url;

      const img = document.createElement('img');
      img.className = 'pm-img';
      img.alt       = hero.name;
      img.loading   = 'lazy';
      img.onerror   = () => { cell.style.display = 'none'; };
      img.src       = hero.url;
      img.onclick   = () => _pmSelectIcon(img, hero.url);

      cell.appendChild(img);
      grid.appendChild(cell);
    });
  }

  function _pmMarkSelected(url) {
    document.querySelectorAll('#pmGrid .pm-cell').forEach(c => {
      c.classList.toggle('pm-selected', c.dataset.url === url);
    });
    const uploadedCell = document.getElementById('pmUploadedCell');
    if (uploadedCell && _uploadedData && url === _uploadedData) {
      uploadedCell.classList.add('pm-selected');
    }
  }

  window._pmSelectIcon = function(imgEl, url) {
    _selectedUrl = url;
    _pmSetPreview(url === '__uploaded__' ? _uploadedData : url);

    document.querySelectorAll('#pmGrid .pm-cell, #pmUploadedCell').forEach(c => {
      c.classList.remove('pm-selected');
    });
    const cell = imgEl.closest('.pm-cell') || imgEl.closest('#pmUploadedCell');
    if (cell) cell.classList.add('pm-selected');

    const btn = document.getElementById('pmSaveBtn');
    btn.disabled    = false;
    btn.textContent = 'Save';
  };

  window._pmTriggerFile = function() {
    document.getElementById('pmFileInput').click();
  };

  window._pmHandleFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG).', 'warning'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be 5 MB or less.', 'warning'); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      _uploadedData = dataUrl;
      localStorage.setItem('roider_uploaded_photo', dataUrl);

      const cell = document.getElementById('pmUploadedCell');
      const img  = document.getElementById('pmUploadedImg');
      img.src = dataUrl;
      img.onclick = () => _pmSelectIcon(img, '__uploaded__');
      cell.style.display = '';

      _pmSelectIcon(img, '__uploaded__');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  window._pmClearUpload = function(e) {
    e.stopPropagation();
    _uploadedData = null;
    localStorage.removeItem('roider_uploaded_photo');
    const cell = document.getElementById('pmUploadedCell');
    cell.classList.remove('pm-selected');
    cell.style.display = 'none';
    if (_selectedUrl === '__uploaded__') {
      _selectedUrl = null;
      _pmSetPreview(_currentPhoto);
      _pmResetSaveBtn();
    }
  };

  window._pmSaveProfile = async function() {
    if (!_selectedUrl) return;

    const uploadOverlay = document.getElementById('pmUploadOverlay');
    const status        = document.getElementById('pmUploadStatus');
    const saveBtn       = document.getElementById('pmSaveBtn');
    saveBtn.disabled = true;

    let finalUrl = _selectedUrl;

    // Upload image to Firebase Storage if custom upload
    if (_selectedUrl === '__uploaded__' && _uploadedData) {
      try {
        uploadOverlay.classList.add('pm-show');
        status.textContent = 'Uploading image…';

        if (!window.storage) throw new Error('Firebase Storage not loaded.');
        const storageRef = window.storage.ref(`profile_photos/${_uid}.jpg`);
        const response   = await fetch(_uploadedData);
        const blob       = await response.blob();
        const snapshot   = await storageRef.put(blob);
        finalUrl = await snapshot.ref.getDownloadURL();
        localStorage.removeItem('roider_uploaded_photo');
        status.textContent = 'Saving…';

      } catch (err) {
        uploadOverlay.classList.remove('pm-show');
        const msg = err.code === 'storage/unauthorized'
          ? 'Storage permission denied. Please contact an admin.'
          : 'Upload error: ' + err.message;
        showToast(msg, 'error');
        saveBtn.disabled = false;
        return;
      }
    }

    // Save to Firestore
    try {
      uploadOverlay.classList.add('pm-show');
      status.textContent = 'Saving profile…';

      await db.collection('users').doc(_uid).update({
        customPhotoURL: finalUrl,
        photoUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      _currentPhoto = finalUrl;
      _pmSetPreview(finalUrl);

      // Update every profile photo on the current page
      document.querySelectorAll('#userPhoto, #headerPhoto, .sidebar-user-info img').forEach(el => {
        el.src = finalUrl;
      });

      uploadOverlay.classList.remove('pm-show');
      showToast('Profile saved! ✅', 'success', 2000);
      saveBtn.textContent = 'In Use';
      // keep disabled — already applied

      // Close modal after brief delay
      setTimeout(closeProfileModal, 1400);

    } catch (err) {
      uploadOverlay.classList.remove('pm-show');
      showToast('Save failed: ' + err.message, 'error');
      saveBtn.disabled = false;
    }
  };

  /* ── Tab switcher ── */
  window._pmSwitchTab = function(tab) {
    const profilePane  = document.getElementById('pmProfilePane');
    const yapPane      = document.getElementById('pmYaphallaPane');
    const footer       = document.getElementById('pmFooter');
    const tabP         = document.getElementById('pmTabProfile');
    const tabY         = document.getElementById('pmTabYaphalla');
    if (!profilePane) return;

    if (tab === 'profile') {
      profilePane.style.display  = '';
      yapPane.style.display      = 'none';
      footer.style.display       = '';
      tabP.classList.add('active');
      tabY.classList.remove('active');
    } else {
      profilePane.style.display  = 'none';
      yapPane.style.display      = 'flex';
      footer.style.display       = 'none';
      tabP.classList.remove('active');
      tabY.classList.add('active');

      if (!_yapLoaded) {
        _yapLoaded = true;
        const iframe  = document.getElementById('pmYaphallaIframe');
        const loading = document.getElementById('pmYaphallaLoading');
        const blocked = document.getElementById('pmYaphallaBlocked');

        const showBlocked = () => {
          loading.style.display = 'none';
          blocked.style.display = 'flex';
        };

        let timer = setTimeout(() => {
          try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc || doc.URL === 'about:blank') showBlocked();
            else loading.style.display = 'none';
          } catch(e) { loading.style.display = 'none'; }
        }, 7000);

        iframe.addEventListener('load', () => {
          clearTimeout(timer);
          try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc || doc.URL === 'about:blank') { showBlocked(); return; }
          } catch(e) {}
          loading.style.display = 'none';
        });
        iframe.addEventListener('error', showBlocked);
        iframe.src = 'https://www.yaphalla.com/editor';
      }
    }
  };

})();
