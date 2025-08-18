// /src/vendors/gsap.js
window.JF = window.JF || {};
window.JF.GSAP = (() => {
  function registerPlugins() {
    if (!window.gsap) { console.warn("[JF] GSAP not found"); return; }
    const { gsap } = window;
    try {
      window.ScrollTrigger  && gsap.registerPlugin(window.ScrollTrigger);
      window.Draggable      && gsap.registerPlugin(window.Draggable);
      window.ScrollSmoother && gsap.registerPlugin(window.ScrollSmoother);
    } catch (e) { console.warn("[JF] GSAP register error", e); }
  }
  return { registerPlugins };
})();
