// /src/systems/sys-anims.js
window.JF = window.JF || {};
window.JF.SystemAnims = (() => {
  let ctx;
  function init() {
    if (!window.gsap) return;
    ctx = gsap.context(() => {
      window.JF.$$('[data-anim="reveal"]').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 20, duration: 0.6, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" }
        });
      });
    });
  }
  function destroy() { ctx?.revert(); ctx = null; }
  function refresh() { window.ScrollTrigger && ScrollTrigger.refresh(); }
  return { init, destroy, refresh };
})();
