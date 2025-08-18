// /src/pages/home.js
window.JF = window.JF || {};
window.JF.PageHome = (() => {
  let ctx;
  async function init() {
    if (!window.gsap) return;
    ctx = gsap.context(() => {
      const hero = document.querySelector("[data-hero]");
      if (hero) gsap.from(hero, { y: 20, autoAlpha: 0, duration: 0.6, ease: "power2.out" });
    });
  }
  function destroy() { ctx?.revert(); ctx = null; }
  return { init, destroy };
})();
