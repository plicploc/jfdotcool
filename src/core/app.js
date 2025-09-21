// src/core/app.js
// Boot global: Smooth (ScrollSmoother via JF.Smooth) → Transitions → Lottie Logo → SuperGallery
// Diag + Horizontal Scroll (durée hybride) + Reveal stagger

import { initTransitions } from "../features/transitions.js";
import { initLottieLogo } from "../features/lottie/index.js";
import { initSuperGallery } from "../features/supergallery.js";

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
      if (!window.JF?.Smooth) {
        console.warn("[Smooth] API non trouvée (assure-toi de charger smooth.js avant app.js)");
        return;
      }
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

  // ───────────────────────────────────────────────────────────────────────────
  // Pin + horizontal + reveal stagger (corrige padding-left au départ)
  function enableSuperGalleryHorizontalScrollOnce(defaultVhPerItem = 50) {
    const JF = (window.JF = window.JF || {});
    if (JF.__once_sgHScroll) return;
    JF.__once_sgHScroll = true;

    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Kill anciens ST sur .supergallery (sécurité)
    ScrollTrigger.getAll().forEach(st => {
      const trg = st.vars?.trigger;
      if (trg && trg.classList?.contains("supergallery")) st.kill(true);
    });

    const isTouch = ScrollTrigger.isTouch; // mobile/tablette

    // viewport height stable (visualViewport si dispo)
    const getViewportHeight = () =>
      (window.visualViewport && window.visualViewport.height) ||
      window.innerHeight ||
      document.documentElement.clientHeight;

    document.querySelectorAll(".supergallery").forEach((gallery, idx) => {
      const wrapper = gallery.querySelector(".supergallery-wrapper");
      const track   = gallery.querySelector(".supergallery-collectionlist");
      const items   = track ? gsap.utils.toArray(".slide-supergallery", track) : [];
      if (!wrapper || !track || !items.length) return;

      const attr = parseFloat(gallery.getAttribute("data-vh-per-item"));
      const vhPerItem = Number.isFinite(attr) ? attr : defaultVhPerItem;

      // RESET transform
      gsap.set(track, { clearProps: "x,transform", x: 0, force3D: true });

      // Mesures robustes (référentiel = wrapper pinné)
      const viewportW = () => wrapper.clientWidth || wrapper.offsetWidth || 0;

      // offset gauche initial du track vs wrapper (≈ padding-left)
      let baseLeft = 0;
      const computeBaseLeft = () => {
        gsap.set(track, { x: 0 });
        const wr = wrapper.getBoundingClientRect();
        const tr = track.getBoundingClientRect();
        baseLeft = Math.max(0, tr.left - wr.left);
      };

      // distance horizontale totale (inclut pad-left visible au départ)
      const travelWithPadding = () => {
        const sw = track.scrollWidth || 0;
        const vw = viewportW();
        return Math.max(0, (sw - vw) + baseLeft);
      };

      // Durée verticale via “X vh par item” (viewportHeight stable mobile)
      const vhPx        = () => getViewportHeight() * (vhPerItem / 100);
      const pinHeightPx = () => items.length * vhPx();

      // Durée hybride: couvrir au moins toute la largeur
      const endDistance = () => Math.max(1, Math.max(travelWithPadding(), pinHeightPx()));

      // Hauteur réelle de section (pinSpacing:false)
      const applySectionHeight = () => {
        const total = endDistance() + (wrapper.offsetHeight || 0); // 100vh wrapper + durée virtuelle
        gallery.style.minHeight = `${Math.ceil(total)}px`;
      };

      // Reveal (timings de ton fichier actuel)
      const D = 0.4, STAG = 0.05, E = "power2.inOut";
      const revealInFromDown = () =>
        gsap.fromTo(items, { y: "20vh",  autoAlpha: 0 }, { duration: D, y: 0, autoAlpha: 1, stagger: STAG, ease: E, overwrite: "auto" });
      const revealInFromUp = () =>
        gsap.fromTo(items, { y: "-20vh", autoAlpha: 0 }, { duration: D, y: 0, autoAlpha: 1, stagger: STAG, ease: E, overwrite: "auto" });
      const revealOutToUp = () =>
        gsap.to(items, { duration: D, y: "-20vh", autoAlpha: 0, stagger: STAG, ease: E, overwrite: "auto" });
      const revealOutToDown = () =>
        gsap.to(items, { duration: D, y: "20vh",  autoAlpha: 0, stagger: STAG, ease: E, overwrite: "auto" });

      const smoother = window.ScrollSmoother?.get?.();
      const pinType = smoother ? "transform" : undefined; // auto si pas de smoother

      // Build ST unique
      let st = null;
      const build = () => {
        if (st) { st.kill(); st = null; }

        computeBaseLeft();
        gsap.set(track, { x: 0 });
        gsap.set(items, { y: "20vh", autoAlpha: 0 }); // état initial avant pin
        applySectionHeight();

        st = ScrollTrigger.create({
          id: `sg-${idx}`,
          trigger: gallery,
          // NE PAS définir "scroller" (Smoother auto)
          start: "top top",
          end: () => "+=" + endDistance(),
          pin: wrapper,
          pinType,                  // "transform" si smoother actif
          pinSpacing: false,        // on gère la hauteur nous-mêmes
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // markers: true,

          onUpdate: self => {
            const x = -travelWithPadding() * self.progress;
            const cur = gsap.getProperty(track, "x");
            if (Math.abs(cur - x) > 0.5) gsap.set(track, { x });
          },

          onEnter:      () => revealInFromDown(),
          onEnterBack:  () => revealInFromUp(),
          onLeave:      () => revealOutToUp(),
          onLeaveBack:  () => revealOutToDown()
        });
      };

      build();

      // Activer/désactiver si pas d’overflow
      const updateActive = () => {
        computeBaseLeft();
        const active = travelWithPadding() > 2;
        if (!active) {
          st?.disable();
          gsap.set(track, { clearProps: "transform" });
          gsap.set(items, { clearProps: "all" });
        } else {
          st?.enable();
        }
      };

      // Refresh / hauteur / lazy CMS
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

      // Desktop: rebuild sur resize; Mobile: éviter le rebuild perpétuel (barre URL)
      if (!isTouch) {
        window.addEventListener("resize", () => {
          clearTimeout(JF.__sgRzTO);
          JF.__sgRzTO = setTimeout(() => { build(); doRefresh(); }, 120);
        }, { passive: true });
      } else {
        window.addEventListener("orientationchange", () => {
          setTimeout(() => { build(); doRefresh(); }, 250);
        }, { passive: true });
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Orchestration stricte et unique
  function start() {
    mountSmoothOnce();                       // 1) Smooth (fourni par smooth.js)
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
