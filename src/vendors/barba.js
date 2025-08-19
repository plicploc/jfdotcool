// /src/vendors/barba.js
window.JF = window.JF || {};
window.JF.Barba = (() => {
  let enabled = false;

  // ——— Helpers ———
  function updateCurrentLinksByLocation() {
    const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    document.querySelectorAll(".menu-item").forEach((link) => {
      const href = (link.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      link.classList.toggle("w--current", href === path);
    });
  }

  function reinitWebflowModules() {
    if (!window.Webflow) return;
    try {
      // purge anciens bindings et rebinde le core
      window.Webflow.destroy?.();
      window.Webflow.ready?.();

      // retard de 2 frames pour garantir que le container Barba est injecté
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const ix2 = window.Webflow.require?.("ix2");
          ix2?.init?.();
          window.Webflow.require?.("lightbox")?.ready?.();
          window.Webflow.require?.("video")?.ready?.();
          window.Webflow.require?.("forms")?.ready?.();
        });
      });
    } catch (err) {
      console.warn("[Barba] Webflow re-init error:", err);
    }
  }

  function afterDomMountedEffects() {
    // (re)monte Smooth si dispo, sinon refresh
    if (typeof window.JF?.Smooth?.mountPage === "function") {
      window.JF.Smooth.mountPage();
    } else {
      window.JF?.Smooth?.refresh?.();
    }

    // laisse le DOM respirer, puis reset scroll + refresh ScrollTrigger
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.JF?.Smooth?.scrollTo?.(0, { duration: 0 });
        if (window.ScrollTrigger?.refresh) ScrollTrigger.refresh(true);
      });
    });

    // ré‑init Webflow (IX2, lightbox, video, forms)
    reinitWebflowModules();

    // systèmes anims globaux
    window.JF?.SystemAnims?.refresh?.();

    // liens actifs
    updateCurrentLinksByLocation();
  }

  // ——— Enable ———
  function enable() {
    if (enabled || !window.barba) return;
    enabled = true;

    barba.init({
      preventRunning: true,
      timeout: 7000,

transitions: [
  {
    name: "fade",

    async leave({ current }) {
      console.log("[Barba] LEAVE →", current?.container?.dataset?.page);
      return window.JF.Transitions?.leaveFade?.(current);
    },

    async once({ next }) {
      console.log("[Barba] ONCE (first load) →", next?.container?.dataset?.page);
      await window.JF.Pages?.mount?.(next.container?.dataset.page || next.url?.path || window.location.pathname);
      await window.JF.Transitions?.enterFade?.(next);

      // post-mount tests
      console.log("[Barba] calling afterDomMountedEffects()");
      afterDomMountedEffects();
    },

    async enter({ next }) {
      console.log("[Barba] ENTER →", next?.container?.dataset?.page);

      await window.JF.Transitions?.enterFade?.(next);
      await window.JF.Pages?.mount?.(next.container?.dataset.page || next.url?.path || window.location.pathname);

      console.log("[Barba] updateCurrentLinksByLocation()");
      updateCurrentLinksByLocation();

      console.log("[Barba] refresh SystemAnims");
      window.JF.SystemAnims?.refresh?.();

      console.log("[Barba] Smooth.mountPage / refresh");
      if (typeof window.JF.Smooth?.mountPage === "function") {
        window.JF.Smooth.mountPage();
      } else {
        window.JF.Smooth?.refresh?.();
      }

      console.log("[Barba] scrollTo(0)");
      window.JF.Smooth?.scrollTo?.(0, { duration: 0 });

      console.log("[Barba] reinit Webflow modules");
      reinitWebflowModules();
    }
  }
],
    });
  }

  return { enable };
})();

// ——— Transitions par défaut ———
window.JF = window.JF || {};
window.JF.Transitions = (() => {
  function leaveFade(current) {
    return new Promise((res) => {
      const el = current?.container;
      if (!el || !window.gsap) return res();
      gsap.to(el, { autoAlpha: 0, duration: 0.25, ease: "power1.out", onComplete: res });
    });
  }

  function enterFade(next) {
    return new Promise((res) => {
      const el = next?.container;
      if (!el || !window.gsap) return res();
      gsap.fromTo(
        el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, ease: "power1.out", onComplete: res }
      );
    });
  }

  return { leaveFade, enterFade };
})();
