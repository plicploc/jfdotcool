// /src/vendors/smooth.js
window.JF = window.JF || {};
window.JF.Smooth = (() => {
  let smoother = null;

  function mount() {
    console.log("[Smooth] mount called");

    if (window.JF.Env?.EDITOR) {
      console.warn("[Smooth] Aborted: Editor mode détecté");
      return;
    }

    if (!window.ScrollSmoother || !window.ScrollTrigger) {
      console.error("[Smooth] Aborted: ScrollSmoother ou ScrollTrigger manquant");
      return;
    }

    smoother = ScrollSmoother.create({
      smooth: 0.8,
      effects: true,
      normalizeScroll: true
    });

    console.log("[Smooth] ScrollSmoother créé:", smoother);
  }

  function mountPage() {
    console.log("[Smooth] mountPage called");
    if (smoother) {
      gsap.delayedCall(0.02, () => {
        console.log("[Smooth] ScrollTrigger.refresh()");
        ScrollTrigger.refresh();
      });
    } else {
      console.warn("[Smooth] mountPage sans smoother actif");
    }
  }

  function refresh() {
    console.log("[Smooth] refresh called");
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    } else {
      console.warn("[Smooth] refresh ignoré: ScrollTrigger absent");
    }
  }

  function destroyPage() {
    console.log("[Smooth] destroyPage called");
  }

  function destroyAll() {
    console.log("[Smooth] destroyAll called");
    smoother?.kill();
    smoother = null;
  }

  return { mount, mountPage, refresh, destroyPage, destroyAll };
})();
