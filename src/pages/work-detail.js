// /src/pages/work-detail.js
window.JF = window.JF || {};
window.JF.PageWorkDetail = (() => {
  let ctx;

  async function init() {
    // Contexte GSAP pour des anims spécifiques à la page (si besoin)
    ctx = gsap.context(() => {
      // ex: titre de la page détail
      const hero = document.querySelector("[data-hero]");
      if (hero) gsap.from(hero, { y: 20, autoAlpha: 0, duration: 0.6, ease: "power2.out" });
    });

    // Monte le slider du template
    window.JF.Slider?.mountAll?.();
  }

  function destroy() {
    // Démonte proprement
    window.JF.Slider?.destroyAll?.();
    ctx?.revert();
    ctx = null;
  }

  return { init, destroy };
})();
