// /src/vendors/smooth.js
// SmoothScroll basé sur GSAP ScrollSmoother
// Structure requise :
// <div class="smooth-wrapper">
//   <div class="smooth-content">[votre contenu]</div>
// </div>

window.JF = window.JF || {};
window.JF.Smooth = (() => {
  let smoother = null;

  const WRAPPER_SEL = ".smooth-wrapper";
  const CONTENT_SEL = ".smooth-content";

  const hasPlugins = () => !!(window.gsap && window.ScrollTrigger && window.ScrollSmoother);
  const registerPluginsIfNeeded = () => {
    if (window.gsap?.registerPlugin) {
      try { window.gsap.registerPlugin(window.ScrollTrigger, window.ScrollSmoother); } catch (_) {}
    }
  };

  // ── Mobile height stabilizer (—vh)
  function setVHVar() {
    const vv = window.visualViewport;
    const h  = (vv && vv.height) || window.innerHeight || document.documentElement.clientHeight;
    document.documentElement.style.setProperty("--vh", (h * 0.01) + "px");
  }

  function attachViewportListeners() {
    // idempotent
    if (window.__jfVhHooked) return;
    window.__jfVhHooked = true;

    setVHVar();
    // iOS/Android : la barre d'URL déclenche visualViewport.resize
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setVHVar, { passive: true });
      window.visualViewport.addEventListener("scroll", setVHVar, { passive: true }); // certains devices
    }
    window.addEventListener("orientationchange", () => {
      // petit délai pour laisser le viewport se stabiliser
      setTimeout(setVHVar, 150);
      // un refresh léger suffit; on évite rebuild en plein scroll
      setTimeout(() => {
        try { window.ScrollTrigger?.refresh(); } catch(_) {}
        try { window.ScrollSmoother?.get()?.refresh(true); } catch(_) {}
      }, 250);
    }, { passive: true });
  }

  function mount() {
    // 1) Éditeur Webflow ? On sort
    if (window.JF?.Env?.EDITOR) {
      console.warn("[Smooth] Aborted: Editor mode détecté");
      return;
    }

    // 2) Plugins GSAP
    if (!hasPlugins()) registerPluginsIfNeeded();
    if (!hasPlugins()) {
      console.warn("[Smooth] Aborted: ScrollSmoother/ScrollTrigger introuvables");
      return;
    }

    // 3) Wrapper & content
    const wrapper = document.querySelector(WRAPPER_SEL);
    const content = document.querySelector(CONTENT_SEL);
    if (!wrapper || !content) {
      console.warn("[Smooth] Aborted: wrapper/content manquants", {
        wrapper: !!wrapper, content: !!content, WRAPPER_SEL, CONTENT_SEL
      });
      return;
    }

    // 4) Accessibilité : si l’utilisateur préfère réduire les animations, on coupe le lissage
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 5) Kill précédent
    try { smoother?.kill?.(); } catch (_) {}
    smoother = null;

    // 6) Stabilise la hauteur mobile (--vh)
    attachViewportListeners();

    // 7) Créer le smoother
    //   - smoothTouch: 0.1 → un léger lissage tactile (0 = natif)
    //   - normalizeScroll: true pour une inertie cohérente
    smoother = ScrollSmoother.create({
      wrapper,
      content,
      smooth: reduceMotion ? 0 : 0.8,
      effects: !reduceMotion,
      normalizeScroll: true,
      smoothTouch: reduceMotion ? 0 : 0.1
    });

    // Debug
    window.__smoother = smoother;
    console.log("[Smooth] created", {
      wrapper: WRAPPER_SEL,
      content: CONTENT_SEL,
      reduceMotion
    });

    // Petit refresh
    try {
      window.gsap?.delayedCall?.(0.02, () => {
        try { window.ScrollTrigger?.refresh?.(); } catch(_) {}
        try { window.ScrollSmoother?.get()?.refresh(true); } catch(_) {}
      });
    } catch (_) {}
  }

  function mountPage() {
    if (!smoother) return;
    try {
      window.gsap?.delayedCall?.(0.02, () => {
        try { window.ScrollTrigger?.refresh?.(); } catch(_) {}
        try { window.ScrollSmoother?.get()?.refresh(true); } catch(_) {}
      });
    } catch (_) {}
  }

  function refresh() {
    try { window.ScrollTrigger?.refresh?.(); } catch(_) {}
    try { window.ScrollSmoother?.get()?.refresh(true); } catch(_) {}
  }

  function destroyAll() {
    try { smoother?.kill?.(); } catch (_) {}
    smoother = null;
  }

  const get = () => smoother;
  const isActive = () => !!smoother;

  return { mount, mountPage, refresh, destroyAll, get, isActive };
})();
