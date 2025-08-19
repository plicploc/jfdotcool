// /src/vendors/barba.js
window.JF = window.JF || {};
window.JF.Barba = (() => {
  let enabled = false;
  function enable() {
    if (enabled || !window.barba) return;
    enabled = true;
    barba.init({
      preventRunning: true,
      timeout: 7000,
      transitions: [{
        name: "fade",
        async leave({ current }) { return window.JF.Transitions?.leaveFade?.(current); },
        async enter({ next }) {
          await window.JF.Transitions?.enterFade?.(next);
          await window.JF.Pages?.mount?.(next.container?.dataset.page || next.url.path);
          window.JF.SystemAnims?.refresh?.();
          window.JF.Smooth?.refresh?.();
          window.JF.Smooth?.scrollTo?.(0, { duration: 0 });

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
