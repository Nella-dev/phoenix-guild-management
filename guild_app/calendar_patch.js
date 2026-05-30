// calendar_patch.js - Rerender calendar on language change (SAFE PATCH)
// Call your existing init/render function again when language changes.
(function(){
  window.onLanguageChanged = function(){
    if (typeof window.initCalendar === "function") {
      try { window.initCalendar(); } catch(e){ console.warn("initCalendar failed:", e); }
    }
  };
})();