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
   * Animation "revealTitle" : reveal rapide par lettres
   * @param {Element|string|NodeList|Array} targets - sélecteur ou éléments
   * @param {Object} opts - options GSAP
   */
  function revealTitle(targets, opts = {}) {
    if (inEditor()) return;

    // Options par défaut
    const {
      duration = 0.05,
      delay = 0.3,
      stagger = 0.05,
      ease = "none",
      classNameToRemove = 'hidden',
      onComplete = null
    } = opts;

    const els = typeof targets === "string" ?
      Array.from(document.querySelectorAll(targets)) :
      (targets?.length != null ? Array.from(targets) : [targets]).filter(Boolean);

    if (!els.length) return;

    afterFontsReady(() => {
      if (typeof gsap === "undefined" || typeof SplitText === "undefined") {
        console.warn("[TextFX] GSAP/SplitText indisponible");
        return;
      }

      els.forEach(el => {

        const prev = splits.get(el);
        if (prev?.revert) prev.revert();

        const split = new SplitText(el, { type: "words, chars" });
        splits.set(el, split);

        gsap.from(split.chars, {
          duration,
          delay,
          opacity: 0,
          ease,
          stagger: {
            each: stagger,
            from: "start",
            ease: "none"
          },
          onStart: () => {
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
   * Animation “revealTxtContent” : anime les titres puis les blocs de texte au moment où le conteneur devient visible.
   * @param {Element|string|NodeList|Array} targets - Le conteneur parent (ex: '.txt-content')
   * @param {Object} opts - Options GSAP pour les animations internes
   */
function revealTxtContent(targets, opts = {}) {
    if (inEditor()) return;

    // Options par défaut
    const {
      classNameToRemove = 'hidden',
      titleTotalDuration = 0.75,
      blockDuration = 0.25,
      blockStagger = 0.1,
      blockEase = "power1.inOut",
    } = opts;

    const els = typeof targets === "string" ?
      Array.from(document.querySelectorAll(targets)) :
      (targets?.length != null ? Array.from(targets) : [targets]).filter(Boolean);

    if (!els.length) return;

    afterFontsReady(() => {
      if (typeof gsap === "undefined" || typeof SplitText === "undefined" || typeof ScrollTrigger === "undefined") {
        console.warn("[TextFX] GSAP/SplitText/ScrollTrigger indisponible");
        return;
      }

      // On attache une timeline pré-construite mais en pause à chaque élément
      els.forEach(el => {
        const titles = el.querySelectorAll('.title-m-orange');
        const blocks = el.querySelectorAll('.txt-block');
        
        // On ne crée une timeline que si l'élément a du contenu à animer
        if (!titles.length && !blocks.length) return;

        let splitTitles; // Pour pouvoir le revert plus tard
        const tl = gsap.timeline({ paused: true });

        if (titles.length) {
          splitTitles = new SplitText(Array.from(titles), { type: "words, chars" });
          tl.from(splitTitles.chars, {
            duration: 0.05, opacity: 0, ease: "none",
            stagger: { amount: titleTotalDuration, from: "start" }
          });
        }
        if (blocks.length) {
          tl.from(blocks, {
            duration: blockDuration, opacity: 0, y: 16,
            ease: blockEase, stagger: blockStagger
          }, titles.length ? "<0.1" : "0");
        }

        // On stocke la timeline et les éléments à manipuler directement sur l'objet DOM
        el._animation = { timeline: tl, titles, blocks, splitTitles };
      });

      // ScrollTrigger.batch s'occupe de tous les éléments en une seule fois
      ScrollTrigger.batch(els, {
        onEnter: batch => {
          batch.forEach(el => {
            if (el._animation) {
              el.classList.remove(classNameToRemove);
              el._animation.timeline.restart();
            }
          });
        },
        onLeaveBack: batch => {
          batch.forEach(el => {
            if (el._animation) {
              // On remet l'animation à son état initial, prête à être rejouée
              el.classList.add(classNameToRemove);
              gsap.set([el._animation.titles, el._animation.blocks], {clearProps: "all"});
              if (el._animation.splitTitles) el._animation.splitTitles.revert();
            }
          });
        },
      });

      ScrollTrigger.refresh();
    });
  }

  /**
   * Test d'accessibilité : vérifie et log les éléments ciblés
   * @param {Element|string|NodeList|Array} targets - sélecteur ou éléments à tester
   */
  function testFile(targets) {
    console.log("▶️ [TextFX] Lancement du test de ciblage...");

    const els = typeof targets === "string" ?
      Array.from(document.querySelectorAll(targets)) :
      (targets?.length != null ? Array.from(targets) : [targets]).filter(Boolean);

    if (!els.length) {
      console.warn(`⏹️ [TextFX] Test terminé : Aucun élément trouvé pour le sélecteur "${targets}"`);
      return;
    }
    
    console.log(`✅ [TextFX] Test terminé : ${els.length} élément(s) trouvé(s) pour "${targets}":`);
    console.log(els);
  }

  // API publique
  return {
    revealTxtContent,
    revealTitle,
    testFile,
    revert(targets) {
      // ... code de la fonction revert
    }
  };

})();