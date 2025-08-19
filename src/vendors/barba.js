// /src/vendors/barba.js
window.JF = window.JF || {};
window.JF.Barba = (() => {
  let enabled = false;
  function enable() {
    if (enabled || !window.barba) return;
    enabled = true;
    function updateCurrentLinks(nextUrl) {
  document.querySelectorAll(".menu-item").forEach(link => {
    link.classList.remove("w--current");
    if (link.getAttribute("href") === nextUrl.pathname) {
      link.classList.add("w--current");
    }
  });
}

    barba.init({
      preventRunning: true,
      timeout: 7000,
      transitions: [{
        name: "fade",
        async leave({ current }) { return window.JF.Transitions?.leaveFade?.(current); },
        async enter({ next }) {
          await window.JF.Transitions?.enterFade?.(next);
          await window.JF.Pages?.mount?.(next.container?.dataset.page || next.url.path);
         
          updateCurrentLinks(new URL(next.url?.href || window.location.href));


          window.JF.SystemAnims?.refresh?.();
          window.JF.Smooth?.refresh?.();
          window.JF.Smooth?.scrollTo?.(0, { duration: 0 });
          // --- Re-init Webflow modules après Barba enter ---
        if (window.Webflow && typeof window.Webflow.require === "function") {
          try {
            // Réinit des interactions IX2 (anims Webflow Designer)
            const ix2 = window.Webflow.require("ix2");
            if (ix2 && typeof ix2.init === "function") {
              ix2.init();
            }

            // Réinit Lightbox
            const lightbox = window.Webflow.require("lightbox");
            if (lightbox && typeof lightbox.ready === "function") {
              lightbox.ready();
            }

            // Réinit Video backgrounds
            const video = window.Webflow.require("video");
            if (video && typeof video.ready === "function") {
              video.ready();
            }

            // Réinit Forms
            const forms = window.Webflow.require("forms");
            if (forms && typeof forms.ready === "function") {
              forms.ready();
            }
          } catch (err) {
            console.warn("[Barba] Webflow re-init error:", err);
          }
        }
        }
      }]
    });
    
  }
  return { enable };
})();

// Transitions par défaut
window.JF = window.JF || {};
window.JF.Transitions = (() => {
  function leaveFade(current) {
    return new Promise((res) => {
      const el = current.container;
      if (!el || !window.gsap) return res();
      gsap.to(el, { autoAlpha: 0, duration: 0.25, onComplete: res });
    });
  }
  function enterFade(next) {
    return new Promise((res) => {
      const el = next.container;
      if (!el || !window.gsap) return res();
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, onComplete: res });
    });
  }
  return { leaveFade, enterFade };
})();
