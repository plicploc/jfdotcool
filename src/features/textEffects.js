// src/features/textEffects.js
window.JF = window.JF || {};
window.JF.TextFX = (function () {
  let splits = new WeakMap();

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
   * NOUVELLE FONCTION
   * Animation "revealTitle" : reveal rapide par lettres
   * @param {Element|string|NodeList|Array} targets - sélecteur ou éléments
   * @param {Object} opts - options GSAP
   */
  function revealTitle(targets, opts = {}) {
    if (inEditor()) return;

    // Options par défaut basées sur votre demande
    const {
      duration = 0.05, // Durée d'animation pour chaque lettre (très rapide)
      delay    = 0.3,    // Délai avant le début de l'animation
      stagger  = 0.05,   // Décalage temporel entre chaque lettre
      ease     = "none", // Aucune accélération/décélération ("no ease")
      classNameToRemove = 'hidden', // La classe CSS à retirer
      onComplete = null
    } = opts;

    const els = typeof targets === "string"
      ? Array.from(document.querySelectorAll(targets))
      : (targets?.length != null ? Array.from(targets) : [targets]).filter(Boolean);

    if (!els.length) return;

    afterFontsReady(() => {
      if (typeof gsap === "undefined" || typeof SplitText === "undefined") {
        console.warn("[TextFX] GSAP/SplitText indisponible");
        return;
      }

      els.forEach(el => {
            console.log("▶️ [TextFX] revealTitle lancé...");

        const prev = splits.get(el);
        if (prev?.revert) prev.revert();

        // 1. Split text, letters
        const split = new SplitText(el, { type: "chars" });
        splits.set(el, split);

        // 2. Animation des lettres
        gsap.from(split.chars, {
          duration,
          delay,
          opacity: 0, // Opacity from 0 to 100
          ease,      // No ease
          stagger: {
            each: stagger, // Stagger: offset time 0,05s
            from: "start", // from start
            ease: "none"   // no ease (pour le stagger lui-même)
          },
          onStart: () => {
            // 3. Remove-class « hidden »
            if (classNameToRemove) {
              el.classList.remove(classNameToRemove);
            }
          },
          onComplete
        });
      });

      if (window.ScrollTrigger && typeof ScrollTrigger.refresh === "function") {
        ScrollTrigger.refresh();
      }
    });
  }
  /**
   * Animation “pouetpouet” : reveal par lettres
   */
  function pouetpouet(targets, opts = {}) {
    // ... (code inchangé)
  }

  /**
   * Animation “headTitle” : reveal par lignes
   */
  function headTitle(targets, opts = {}) {
    // ... (code inchangé)
  }

  /**
   * NOUVELLE FONCTION
   * Test d'accessibilité : vérifie et log les éléments ciblés
   * @param {Element|string|NodeList|Array} targets - sélecteur ou éléments à tester
   */
  function testFile(targets) {
    console.log("▶️ [TextFX] Lancement du test de ciblage...");

    const els = typeof targets === "string"
      ? Array.from(document.querySelectorAll(targets))
      : (targets?.length != null ? Array.from(targets) : [targets]).filter(Boolean);

    if (!els.length) {
      console.warn(`⏹️ [TextFX] Test terminé : Aucun élément trouvé pour le sélecteur "${targets}"`);
      return;
    }
    
    console.log(`✅ [TextFX] Test terminé : ${els.length} élément(s) trouvé(s) pour "${targets}":`);
    console.log(els);
  }


  // API publique (Mise à jour)
  // API publique (Mise à jour)
return {
  pouetpouet,
  headTitle,
  revealTitle, // <-- Ajoutez la nouvelle fonction ici
  testFile,
  revert(targets) {
    // ... code de la fonction revert
  }
};

})();