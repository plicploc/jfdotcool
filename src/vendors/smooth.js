// /src/vendors/smooth.js
window.JF = window.JF || {};
window.JF.Smooth = (() => {
  let smoother = null;
  function mount() {
    if (window.JF.Env?.EDITOR) return;
    if (!window.ScrollSmoother || !window.ScrollTrigger) return;
    smoother = ScrollSmoother.create({ smooth: 0.8, effects: true, normalizeScroll: true });
  }
  function mountPage() { if (smoother) gsap.delayedCall(0.02, () => ScrollTrigger.refresh()); }
  function refresh()   { window.ScrollTrigger && ScrollTrigger.refresh(); }
  function destroyPage() {}
  function destroyAll() { smoother?.kill(); smoother = null; }
  return { mount, mountPage, refresh, destroyPage, destroyAll };
})();
