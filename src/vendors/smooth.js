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

  function hasPlugins() {
    return !!(window.gsap && window.ScrollTrigger && window.ScrollSmoother);
  }
  function registerPluginsIfNeeded() {
    if (window.gsap?.registerPlugin) {
      try { window.gsap.registerPlugin(window.ScrollTrigger, window.ScrollSmoother); } catch (_) {}
    }
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

    // 4) Kill précédent
    try { smoother?.kill?.(); } catch (_) {}
    smoother = null;

    // 5) Créer le smoother
    smoother = ScrollSmoother.create({
      wrapper,
      content,
      smooth: 0.8,
      effects: true,
      normalizeScroll: true,
    });

    // debug
    window.__smoother = smoother;
    //console.log("[Smooth] created", { wrapper: WRAPPER_SEL, content: CONTENT_SEL });

    // Petit refresh
    window.gsap?.delayedCall?.(0.02, () => window.ScrollTrigger?.refresh?.());
  }

  function mountPage() {
    if (smoother) {
      window.gsap?.delayedCall?.(0.02, () => {
        window.ScrollTrigger?.refresh?.();
      });
    } else {
    }
  }

  function refresh() {
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    } else {
    }
  }

  function destroyAll() {
    try { smoother?.kill?.(); } catch (_) {}
    smoother = null;
  }

  const get = () => smoother;
  const isActive = () => !!smoother;

  return { mount, mountPage, refresh, destroyAll, get, isActive };
})();
