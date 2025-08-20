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

    document.querySelectorAll(".menu-item, .navbar-link").forEach((link) => {
      const rawHref = (link.getAttribute("href") || "").trim();
      const href = rawHref.replace(/\/+$/, "") || "/";

      const isExact = href === path;
      const isParent = (
        href === "/work" &&
        (path === "/work" || path.startsWith("/work/"))
      );

      const shouldBeCurrent = isExact || isParent;

      link.classList.toggle("w--current", shouldBeCurrent);

      if (shouldBeCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    dbg("nav.updateCurrent", { path });
  }

  // ——— Ré-init Webflow robuste ———
  function reinitWebflowModules(next) {
    if (!window.Webflow) return;
    dbg("webflow.reinit.begin", {
      widBefore: document.querySelectorAll("[data-w-id]").length
    });
    try {
      const ix2 = window.Webflow.require?.("ix2");

      // 1. Update l’attribut data-wf-page de <html>
      const htmlEl = document.documentElement;
      if (next?.container?.getAttribute("data-wf-page")) {
        htmlEl.setAttribute("data-wf-page", next.container.getAttribute("data-wf-page"));
      }

      // 2. Stop / reset IX2 store
      if (ix2?.store) {
        ix2.store.dispatch({ type: "IX2_STOP" });
        ix2.store.dispatch({ type: "IX2_RAW_DATA", payload: window.Webflow.rawData });
      }

      // 3. Destroy & reinit
      try { window.Webflow.destroy?.(); } catch (_) {}
      ix2?.init?.();

      // 4. Nudge other modules
      try { window.Webflow.resize?.(); } catch (_) {}
      try { window.Webflow.require?.("lightbox")?.ready?.(); } catch (_) {}
      try { window.Webflow.require?.("video")?.ready?.(); } catch (_) {}
      try { window.Webflow.require?.("forms")?.ready?.(); } catch (_) {}

      dbg("webflow.reinit.afterInit", {
        widAfter: document.querySelectorAll("[data-w-id]").length
      });
      dbg("webflow.reinit.done", {});
    } catch (err) {
      dbg("webflow.reinit.error", { err: String(err) });
    }
  }

  function afterDomMountedEffects() {
    dbg("afterDomMountedEffects.begin", {
      widNow: document.querySelectorAll("[data-w-id]").length
    });

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

    // System + Nav
    window.JF?.SystemAnims?.refresh?.();
    dbg("systemAnims.refresh", {});
    updateCurrentLinksByLocation();

    dbg("afterDomMountedEffects.end", {
      widNow: document.querySelectorAll("[data-w-id]").length
    });
  }

  async function mountAndPrime(next) {
    await window.JF.Pages?.mount?.(
      next.container?.dataset.page || next.url?.path || window.location.pathname
    );
    dbg("pages.mount", { page: next?.container?.dataset?.page });

    reinitWebflowModules(next);

    // Attendre un frame pour que IX2 accroche au DOM
    await new Promise((r) => requestAnimationFrame(r));
    dbg("webflow.reinit.synced", {});
  }

  function enable() {
    if (enabled || !window.barba) return;
    enabled = true;

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
            if (next?.container && window.gsap) {
              gsap.killTweensOf(next.container);
              gsap.set(next.container, { opacity: 0 });
            }
            await mountAndPrime(next);
            await window.JF.Transitions?.enterFade?.(next);
            dbg("trans.enterFade", {});
            afterDomMountedEffects();
          },

          async enter({ next }) {
            dbg("barba.enter", { page: next?.container?.dataset?.page });
            if (next?.container && window.gsap) {
              gsap.killTweensOf(next.container);
              gsap.set(next.container, { opacity: 0 });
            }
            await mountAndPrime(next);
            await window.JF.Transitions?.enterFade?.(next);
            dbg("trans.enterFade", {});
            afterDomMountedEffects();
          }
        }
      ]
    });

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
      gsap.killTweensOf(el);
      gsap.to(el, {
        opacity: 0,
        duration: 0.35,
        ease: "power1.out",
        overwrite: "auto",
        onComplete: res
      });
    });
  }

  function enterFade(next) {
    return new Promise((res) => {
      const el = next?.container;
      if (!el || !window.gsap) return res();
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 0, clearProps: "visibility" });
      requestAnimationFrame(() => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.35,
            ease: "power1.out",
            immediateRender: false,
            overwrite: "auto",
            onComplete: res
          }
        );
      });
    });
  }

  return { leaveFade, enterFade };
})();
