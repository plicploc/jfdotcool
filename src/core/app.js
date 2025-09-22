// src/core/app.js
// Boot global: Smooth (ScrollSmoother) → Transitions → Lottie Logo → SuperGallery
// Diag + Horizontal Scroll: durée hybride (max(extraX, items*vhPerItem))

import { initTransitions } from "../features/transitions.js";
import { initLottieLogo } from "../features/lottie/index.js";
import { initSuperGallery } from "../features/supergallery.js";
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

  // Phase 1: diagnostics (détection + mesures)
  function bootSuperGalleryDiagnosticsOnce() {
    once(() => {
      initSuperGallery({
        selector: ".supergallery",
        wrapperSel: ".supergallery-wrapper",
        trackSel: ".supergallery-collectionlist",
        slideSel: ".slide-supergallery",
        debug: false,
        outline: false
      });
      setTimeout(() => {
        initSuperGallery({
          selector: ".supergallery",
          wrapperSel: ".supergallery-wrapper",
          trackSel: ".supergallery-collectionlist",
          slideSel: ".slide-supergallery",
          debug: false,
          outline: false
        });
      }, 700);
    }, "sg-diag");
  }

// Pin + horizontal + reveal stagger sur les items
// → corrige la distance en intégrant le padding-left du track (offset gauche réel)
function enableSuperGalleryHorizontalScrollOnce(defaultVhPerItem = 50) {
  const JF = (window.JF = window.JF || {});
  if (JF.__once_sgHScroll) return;
  JF.__once_sgHScroll = true;

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Sécurité: tuer d’anciens ST éventuels
  ScrollTrigger.getAll().forEach(st => {
    const trg = st.vars?.trigger;
    if (trg && trg.classList?.contains("supergallery")) st.kill(true);
  });

  document.querySelectorAll(".supergallery").forEach((gallery, idx) => {
    const wrapper = gallery.querySelector(".supergallery-wrapper");
    const track   = gallery.querySelector(".supergallery-collectionlist");
    const items   = track ? gsap.utils.toArray(".slide-supergallery", track) : [];
    if (!wrapper || !track || !items.length) return;

    // Option par data-attr (par galerie)
    const attr = parseFloat(gallery.getAttribute("data-vh-per-item"));
    const vhPerItem = Number.isFinite(attr) ? attr : defaultVhPerItem;

    // RESET transform (hyper important)
    gsap.set(track, { clearProps: "x,transform", x: 0, force3D: true });

    // ---- Mesures robustes (référentiel = wrapper pinné) ----
    const viewportW = () => wrapper.clientWidth || wrapper.offsetWidth || 0;

    // offset gauche initial du track vs wrapper (souvent = padding-left du track)
    let baseLeft = 0;
    const computeBaseLeft = () => {
      // Mesurer à x:0
      gsap.set(track, { x: 0 });
      const wr = wrapper.getBoundingClientRect();
      const tr = track.getBoundingClientRect();
      baseLeft = Math.max(0, tr.left - wr.left);
    };

    // distance horizontale totale à parcourir
    // scrollWidth inclut padding-left + padding-right
    // On rajoute baseLeft pour "récupérer" le padding-left visible au départ
    const travelWithPadding = () => {
      const sw = track.scrollWidth || 0;
      const vw = viewportW();
      return Math.max(0, (sw - vw) + baseLeft);
    };

    // Durée verticale souhaitée en px via “X vh par item”
    const vhPx        = () => Math.max(window.innerHeight, document.documentElement.clientHeight) * (vhPerItem / 100);
    const pinHeightPx = () => items.length * vhPx();

    // Durée hybride = on couvre au moins toute la largeur
    const endDistance = () => Math.max(1, Math.max(travelWithPadding(), pinHeightPx()));

    // Hauteur réelle de section (pinSpacing:false)
    const applySectionHeight = () => {
      const total = endDistance() + (wrapper.offsetHeight || 0); // 100vh wrapper + durée virtuelle
      gallery.style.minHeight = `${Math.ceil(total)}px`;
    };

    // Tweens reveal utilitaires (tes timings)
    const D = 0.4, STAG = 0.05, E = "power2.inOut";
    const revealInFromDown = () =>
      gsap.fromTo(items, { y: "20vh",  autoAlpha: 0 }, { duration: D, y: 0, autoAlpha: 1, stagger: STAG, ease: E, overwrite: "auto" });
    const revealInFromUp = () =>
      gsap.fromTo(items, { y: "-20vh", autoAlpha: 0 }, { duration: D, y: 0, autoAlpha: 1, stagger: STAG, ease: E, overwrite: "auto" });
    const revealOutToUp = () =>
      gsap.to(items, { duration: D, y: "-20vh", autoAlpha: 0, stagger: STAG, ease: E, overwrite: "auto" });
    const revealOutToDown = () =>
      gsap.to(items, { duration: D, y: "20vh",  autoAlpha: 0, stagger: STAG, ease: E, overwrite: "auto" });

    // Build ST unique
    let st = null;
    const build = () => {
      if (st) { st.kill(); st = null; }

      // init
      computeBaseLeft();
      gsap.set(track, { x: 0 });
      gsap.set(items, { y: "20vh", autoAlpha: 0 }); // état initial avant pin
      applySectionHeight();

      st = ScrollTrigger.create({
        id: `sg-${idx}`,
        trigger: gallery,
        // NE PAS définir "scroller" (Smoother auto)
        start: "top top",                 // démarre dès que la section touche le haut
        end: () => "+=" + endDistance(),  // durée réelle du pin
        pin: wrapper,
        pinType: "transform",
        pinSpacing: false,                // on gère la hauteur nous-mêmes
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // markers: true,

        // MAPPING horizontal
        onUpdate: self => {
          const x = -travelWithPadding() * self.progress; // 0 → -distance (avec pad-left)
          const cur = gsap.getProperty(track, "x");
          if (Math.abs(cur - x) > 0.5) gsap.set(track, { x });
        },

        // REVEAL: entrée/sortie (sens du scroll)
        onEnter:      () => revealInFromDown(), // arrive par le bas → y:+20vh → 0
        onEnterBack:  () => revealInFromUp(),   // on remonte → y:-20vh → 0
        onLeave:      () => revealOutToUp(),    // sort vers le haut → 0 → -20vh
        onLeaveBack:  () => revealOutToDown()   // redescend → 0 → +20vh
      });
    };

    build();

    // Désactive si pas d’overflow horizontal
    const updateActive = () => {
      computeBaseLeft();
      const active = travelWithPadding() > 2;
      if (!active) {
        st?.disable();
        gsap.set(track, { clearProps: "transform" });
        gsap.set(items, { clearProps: "all" }); // laissons-les visibles
      } else {
        st?.enable();
      }
    };

    // Re-mesures / hauteur / (lazy CMS & resize)
    const doRefresh = () => {
      computeBaseLeft();
      applySectionHeight();
      ScrollTrigger.refresh();
      updateActive();
    };

    ScrollTrigger.addEventListener("refresh", () => {
      computeBaseLeft();
      applySectionHeight();
      updateActive();
    });

    setTimeout(doRefresh, 120);
    setTimeout(doRefresh, 600);

    window.addEventListener("resize", () => {
      clearTimeout(JF.__sgRzTO);
      JF.__sgRzTO = setTimeout(() => {
        build();
        doRefresh();
      }, 120);
    }, { passive: true });
  });
}



  // ───────────────────────────────────────────────────────────────────────────
  // Orchestration stricte et unique
  function start() {
    mountSmoothOnce();                       // 1) Smooth
    mountTransitionsOnce();                  // 2) Transitions
    mountLottieLogoOnce();                   // 3) Lottie
    bootSuperGalleryDiagnosticsOnce();       // 4) Diag (logs)
    enableSuperGalleryHorizontalScrollOnce(50); // 5) Pin + scroll horizontal (50vh par item)
  }

  onDOMReady(() => onWebflowReady(start));
  window.addEventListener("load", () => once(start, "lateStart"), { once: true });

  // Cleanup Lottie au changement de page (reload)
  window.addEventListener("pagehide", () => { JF._destroyLottieLogo?.(); }, { once: true });
})();
