// src/core/app.js
// Boot global: Smooth (ScrollSmoother) → Transitions → Lottie Logo → Swiper

import { initTransitions } from "../features/transitions.js";
import { initLottieLogo } from "../features/lottie/index.js";
import { initSwiperSliders } from "../features/swiper-slider.js"; // NEW
import "../vendors/smooth.js"; // <- rend JF.Smooth dispo dans le bundle

(function () {
  const JF = (window.JF = window.JF || {});
  if (JF.__bootLocked) return;
  JF.__bootLocked = true;

  function once(fn, key) {
    const k = `__once_${key}`;
    if (JF[k]) return false;
    JF[k] = true;
    try { fn(); } catch (e) { console.warn(`[once:${key}]`, e); }
    return true;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Smooth bootstrap (API stable)
  (function attachSmoothAPI () {
    JF.Smooth = JF.Smooth || (function () {
      let smoother = null;

      function isEditor() {
        try { return !!(window.Webflow?.env?.("editor") || window.Webflow?.env?.("design")); }
        catch { return false; }
      }
      function isActive() {
        return !!(window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get());
      }
      function mount() {
        if (isEditor()) { console.info("[Smooth] skip (Webflow Editor/Designer)"); return; }
        if (!window.gsap || !window.ScrollTrigger) { console.warn("[Smooth] GSAP/ScrollTrigger manquant"); return; }
        gsap.registerPlugin(ScrollTrigger);
        if (!window.ScrollSmoother) { console.warn("[Smooth] ScrollSmoother non chargé"); return; }

        const existing = window.ScrollSmoother.get();
        if (existing) { console.log("[Smooth] get", existing); return; }

        const wrapper = document.querySelector(".smooth-wrapper");
        const content = document.querySelector(".smooth-content");
        if (!wrapper || !content) { console.warn("[Smooth] wrapper/content introuvables"); return; }

        smoother = window.ScrollSmoother.create({
          wrapper: ".smooth-wrapper",
          content: ".smooth-content",
          smooth: 1.2,
          effects: true,
          normalizeScroll: true
        });
      }
      function mountPage() {
        try { window.ScrollTrigger?.refresh(); } catch {}
        try { window.ScrollSmoother?.get()?.refresh(true); } catch {}
      }
      return { mount, isActive, mountPage };
    })();
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // Hooks DOM / Webflow
  function onDOMReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => once(fn, "domReady"), { once: true });
    } else {
      once(fn, "domReady");
    }
  }
  function onWebflowReady(fn) {
    if (window.Webflow && Array.isArray(window.Webflow.push)) {
      window.Webflow.push(() => once(fn, "webflowReady"));
    } else {
      once(fn, "webflowReady-noWF");
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Mount steps
  function mountSmoothOnce() {
    once(() => {
      JF.Smooth.mount();
      if (JF.Smooth.isActive()) JF.Smooth.mountPage();
    }, "smooth");
  }
  function mountTransitionsOnce() {
    once(() => { initTransitions?.(); }, "transitions");
  }
  function mountLottieLogoOnce() {
    once(() => {
      try {
        JF._destroyLottieLogo?.();
        JF._destroyLottieLogo = initLottieLogo({
          selector: ".new-sidebar .navbar-main .logo-horizontal",
          path: "/animation/logo/jfdotcool-wiggle-website.json",
          pixelsPerLoop: 1000,
          loopMultiplier: 0.5
        });
      } catch (e) { console.warn("[lottieLogo] init failed", e); }
    }, "lottieLogo");
  }
  function mountSwiperOnce() {
    once(() => {
      try {
        const instances = initSwiperSliders(document);
        // Option de debug: stocker les instances si besoin
        JF._swiperInstances = instances;
      } catch (e) {
        console.warn("[swiper] init failed", e);
      }
    }, "swiper");
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Orchestration stricte et unique
  function start() {
    mountSmoothOnce();        // 1) Smooth
    mountTransitionsOnce();   // 2) Transitions
    mountLottieLogoOnce();    // 3) Lottie
    mountSwiperOnce();        // 4) Swiper (remplace SuperGallery)
  }

  onDOMReady(() => onWebflowReady(start));
  window.addEventListener("load", () => once(start, "lateStart"), { once: true });

  // Cleanup Lottie au changement de page (reload)
  window.addEventListener("pagehide", () => { JF._destroyLottieLogo?.(); }, { once: true });
})();
