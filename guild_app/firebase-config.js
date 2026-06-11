// firebase-config.js — Phoenix Firebase compat 초기화 (compat SDK 전용)
// firebase_key.js 와 firebase_config.js 를 로드한 뒤 이 파일이 필요 없는 페이지는 무시 가능

(function(){
  const cfg = {
    apiKey:            "AIzaSyCbqEcGsdSDBZs8PjiI05YRNEGupLf3nSc",
    authDomain:        "roider-guild-management.firebaseapp.com",
    projectId:         "roider-guild-management",
    storageBucket:     "roider-guild-management.firebasestorage.app",
    messagingSenderId: "1012249034459",
    appId:             "1:1012249034459:web:ec0f821f29170446af96fe",
    measurementId:     "G-J7W4LFLHPP"
  };
  if(typeof firebase !== 'undefined' && !firebase.apps.length){
    firebase.initializeApp(cfg);
  }
  // 전역에 firebaseConfig 노출 (다른 스크립트에서 참조 가능)
  window.firebaseConfig = cfg;
})();
