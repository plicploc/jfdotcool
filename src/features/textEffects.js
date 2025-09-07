
// src/features/textEffects.js (ou intégré dans ton bundle)
window.JF = window.JF || {};
window.JF.TextFX = (function () {
  let splits = new WeakMap(); // pour revert proprement par élément
  function inEditor() {
    try {
      if (window.Webflow && typeof Webflow.env === "function") {
        return Webflow.env("editor") || Webflow.env("design");
      }
    } catch (e) {}
    return false;
  }

  function afterFontsReady(cb) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(cb).catch(cb);
    } else {
      window.addEventListener("load", cb, { once: true });
    }
  }

  /**
   * Animation “pouetpouet” : reveal par lettres
   * @param {Element|string|NodeList|Array} targets - sélecteur ou éléments
   * @param {Object} opts - options GSAP
   */
  function pouetpouet(targets, opts = {}) {
    if (inEditor()) return;

    const {
      duration = 0.3,
      delay    = .2,
      stagger  = 0.05,
      y        = "30%",     // move Y
      rotationX= -90,       // deg
      rotationY= 45,        // deg
      ease     = "power2.out(1.7",
      onComplete = null
    } = opts;

    const els = typeof targets === "string"
      ? Array.from(document.querySelectorAll(targets))
      : (targets?.length != null ? Array.from(targets) : [targets]).filter(Boolean);

    if (!els.length) return;

    // Attendre les fonts pour éviter l’erreur SplitText
    afterFontsReady(() => {
      if (typeof gsap === "undefined" || typeof SplitText === "undefined") {
        console.warn("[TextFX] GSAP/SplitText indisponible");
        return;
      }

      els.forEach(el => {
        // revert d’un ancien split si ré-init
        const prev = splits.get(el);
        if (prev?.revert) prev.revert();

        // split par lettres
        const split = new SplitText(el, { type: "chars", charsClass: "is-char" });
        splits.set(el, split);

        // état de départ (optionnel : set silencieux)
        gsap.set(split.chars, { transformOrigin: "50% 50% -1px" });

        // anim FROM → TO (to = identité)
        gsap.from(split.chars, {
          duration,
          delay,
          y,
          rotationX,
          rotationY,
          opacity: 0,
          ease,
          stagger,
          onComplete
        });
      });

      // Si ScrollTrigger présent, rafraîchir après le split
      if (window.ScrollTrigger && typeof ScrollTrigger.refresh === "function") {
        ScrollTrigger.refresh();
      }
    });
  }

  // API publique
  return {
    pouetpouet,
    // utilitaire si tu veux nettoyer manuellement
    revert(targets) {
      const els = typeof targets === "string"
        ? Array.from(document.querySelectorAll(targets))
        : (targets?.length != null ? Array.from(targets) : [targets]).filter(Boolean);
      els.forEach(el => {
        const s = splits.get(el);
        if (s?.revert) s.revert();
        splits.delete(el);
      });
    }
  };
})();
