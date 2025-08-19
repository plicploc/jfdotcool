// /src/vendors/barba.js
window.JF = window.JF || {};
window.JF.Barba = (() => {
  let enabled = false;

  // ====== DBG: canal hors-console ======
  window.jfDebug = window.jfDebug || [];
  window.JF.BUILD = window.JF.BUILD || {
    name: "jf.cool",
    file: "app.latest.js",
    builtAt: new Date().toISOString()
  };
  function dbg(label, data) {
    try {
      const entry = { t: Date.now(), label, data };
      window.jfDebug.push(entry);
      window.dispatchEvent(new CustomEvent("JF:debug", { detail: entry }));
    } catch (_) {}
  }
  // =====================================

  // ——— Helpers ———
  function updateCurrentLinksByLocation() {
    const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    document.querySelectorAll(".menu-item").forEach((link) => {
      const href = (link.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      link.classList.toggle("w--current", href === path);
    });
    dbg("nav.updateCurrent", { path });
  }

  function reinitWebflowModules() {
    if (!window.Webflow) return;
    try {
      window.Webflow.destroy?.();
      window.Webflow.ready?.();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const ix2 = window.Webflow.require?.("ix2");
          ix2?.init?.();
          window.Webflow.require?.("lightbox")?.ready?.();
          window.Webflow.require?.("video")?.ready?.();
          window.Webflow.require?.("forms")?.ready?.();
          dbg("webflow.reinit.done", {});
        });
      });
    } catch (err) {
      dbg("webflow.reinit.error", { err: String(err) });
    }
  }

  function afterDomMountedEffects() {
    // Smooth
    if (typeof window.JF?.Smooth?.mountPage === "function") {
      window.JF.Smooth.mountPage();
      dbg("smooth.mountPage", {});
    } else {
      window.JF?.Smooth?.refresh?.();
      dbg("smooth.refresh", {});
    }

    // Double rAF → scrollTo + refresh ST
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.JF?.Smooth?.scrollTo?.(0, { duration: 0 });
        if (window.ScrollTrigger?.refresh) ScrollTrigger.refresh(true);
        dbg("smooth.scrollToTop+st.refresh", {});
      });
    });

    // Webflow + System + Nav
    reinitWebflowModules();
    window.JF?.SystemAnims?.refresh?.();
    dbg("systemAnims.refresh", {});
    updateCurrentLinksByLocation();
  }

  function enable() {
    if (enabled || !window.barba) return;
    enabled = true;

    // Ping immédiat pour vérifier chargement du bundle
    dbg("bundle.loaded", window.JF.BUILD);

    barba.init({
      preventRunning: true,
      timeout: 7000,
      transitions: [
        {
          name: "fade",

          async leave({ current }) {
            dbg("barba.leave", { page: current?.container?.dataset?.page });
            return window.JF.Transitions?.leaveFade?.(current);
          },

          async once({ next }) {
            dbg("barba.once", { page: next?.container?.dataset?.page });

            if (next?.container && window.gsap) gsap.set(next.container, { autoAlpha: 0 });
            await window.JF.Pages?.mount?.(
              next.container?.dataset.page || next.url?.path || window.location.pathname
            );
            dbg("pages.mount", { page: next?.container?.dataset?.page });

            await window.JF.Transitions?.enterFade?.(next);
            dbg("trans.enterFade", {});

            afterDomMountedEffects();
          },

          async enter({ next }) {
            dbg("barba.enter", { page: next?.container?.dataset?.page });

            if (next?.container && window.gsap) gsap.set(next.container, { autoAlpha: 0 });
            await window.JF.Pages?.mount?.(
              next.container?.dataset.page || next.url?.path || window.location.pathname
            );
            dbg("pages.mount", { page: next?.container?.dataset?.page });

            await window.JF.Transitions?.enterFade?.(next);
            dbg("trans.enterFade", {});

            afterDomMountedEffects();
          }
        }
      ]
    });

    // Confirme l’enable
    dbg("barba.enabled", {});
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
