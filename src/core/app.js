// src/core/app.js

// ───────────────────────────────────────────────────────────────────────────
// 1. IMPORTATIONS DES MODULES
// ───────────────────────────────────────────────────────────────────────────
import { initTransitions } from "../features/transitions.js";
import { initLottieLogo } from "../features/lottie/index.js";
import { initSwiperSliders } from "../features/swiper-slider.js";
import { initHomescrollAnimations } from "../features/homescroll-anim.js";
import { initCustomCursors } from "../features/custom-cursor.js";
import "../vendors/smooth.js"; 
import "../features/textEffects.js";


(function () {
  // ───────────────────────────────────────────────────────────────────────────
  // 2. CONFIGURATION DE BASE (NAMESPACE ET HELPER 'ONCE')
  // ───────────────────────────────────────────────────────────────────────────
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
  // 3. FONCTIONS D'INITIALISATION POUR CHAQUE FONCTIONNALITÉ
  // ───────────────────────────────────────────────────────────────────────────

  // -- Smooth Scrolling --
  (function attachSmoothAPI() {
    JF.Smooth = JF.Smooth || (function () {
      let smoother = null;
      function isEditor() {
        try { return !!(window.Webflow?.env?.("editor") || window.Webflow?.env?.("design")); }
        catch { return false; }
      }
      function isActive() { return !!(window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get()); }
      
      // --- CETTE FONCTION CONTIENT LA CONFIGURATION FINALE ET CORRECTE ---
      function mount() {
        if (isEditor() || isActive()) {
          return;
        }
        
        try {
          gsap.registerPlugin(window.ScrollSmoother);
          
          smoother = window.ScrollSmoother.create({
            wrapper: ".smooth-wrapper",
            content: ".smooth-content",
            smooth: 1.2,
            effects: true,
          });

          // Configuration complète du proxy pour une synchronisation parfaite
          ScrollTrigger.scrollerProxy(smoother.wrapper, {
            scrollTop(value) {
              if (arguments.length) {
                smoother.scrollTop(value);
              }
              return smoother.scrollTop();
            },
            getBoundingClientRect() {
              return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
            },
            // Cette ligne est cruciale pour que le "pinning" fonctionne
            pinType: smoother.wrapper.style.transform ? "transform" : "fixed"
          });

          // Lie les événements de rafraîchissement pour une synchronisation continue
          ScrollTrigger.addEventListener("refresh", () => smoother.update());
          
          // Lance un rafraîchissement initial pour tout synchroniser
          ScrollTrigger.refresh();
          
          console.log("✅ [APP.JS] ScrollSmoother et ScrollerProxy sont configurés.");

        } catch (e) { 
          console.warn("[Smooth] L'initialisation de ScrollSmoother a échoué :", e); 
        }
      }

      function unmount() {
        if (isEditor() || !isActive()) return;
        try { if (smoother) smoother.kill(); smoother = null; } catch (e) { console.warn("[Smooth] unmount failed", e); }
      }
      return { isActive, mount, unmount };
    })();
  })();
  
  function mountSmoothOnce() { once(() => JF.Smooth.mount(), "smooth"); }

  // -- Le reste du fichier est inchangé --
  function mountTransitionsOnce() {
    once(() => {
      try { initTransitions(); } catch (e) { console.warn("[transitions] init failed", e); }
    }, "transitions");
  }

  function mountLottieLogoOnce() {
    once(() => {
      try { initLottieLogo(); } catch (e) { console.warn("[lottieLogo] init failed", e); }
    }, "lottieLogo");
  }
  
  function herotitlerevealOnce() {
    once(() => {
      try { JF.TextFX.revealTitle('.main-title-block .txttitle'); } catch (e) { console.warn("[heroTitleReveal] init failed", e); }
    }, 'heroTitleReveal');
  }
  
  function mountSwiperOnce() {
    once(() => {
      try {
        const instances = initSwiperSliders(); 
        JF._swiperInstances = instances; 
      } catch (e) { console.warn("[swiper] init failed", e); }
    }, "swiper");
  }

  function mountCustomCursorsOnce() {
    once(() => {
      try { initCustomCursors(); } catch (e) { console.warn("[customCursor] init failed", e); }
    }, "customCursors");
  }

  function mountSplineAnimationsOnce() {
    once(() => {
      try {
        const splineContainer = document.querySelector('.homeanim-wrapper');
        if (splineContainer) { initHomescrollAnimations(splineContainer); }
      } catch (e) { console.warn("[spline] init failed", e); }
    }, 'spline');
  }

  function initNavigation() {
    const MENU_LINKS_SELECTOR = '.navbar-link'; const ADDED_FLAG = 'data-added-current';
    const PARENT_RULES = [{ parentHref: '/work', test: (path) => path.startsWith('/work/') && path !== '/work/' }];
    function normalizePath(path) { try { let p = path.replace(/\/{2,}/g, '/'); if (p.length > 1) p = p.replace(/\/+$/, ''); return p || '/'; } catch { return '/'; } }
    function matchesHref(el, targetHref) { const href = (el.getAttribute('href') || '').trim(); if (!href) return false; try { if (href.startsWith('http')) { const u = new URL(href); return normalizePath(u.pathname) === normalizePath(targetHref); } } catch {} return normalizePath(href) === normalizePath(targetHref); }
    function removeAddedCurrents() { document.querySelectorAll(`${MENU_LINKS_SELECTOR}[${ADDED_FLAG}="true"]`).forEach((el) => { el.classList.remove('w--current'); el.removeAttribute(ADDED_FLAG); }); }
    function applyParentCurrent() { const path = normalizePath(window.location.pathname); removeAddedCurrents(); const rule = PARENT_RULES.find((r) => r.test(path)); if (!rule) return; const parentLink = Array.from(document.querySelectorAll(MENU_LINKS_SELECTOR)).find((a) => matchesHref(a, rule.parentHref)); if (parentLink) { parentLink.classList.add('w--current'); parentLink.setAttribute(ADDED_FLAG, 'true'); } }
    applyParentCurrent();
    const nav = document.querySelector('.sidebar, .navbar, [data-nav], .sidebar-new') || document.body;
    const mo = new MutationObserver(() => applyParentCurrent());
    mo.observe(nav, { childList: true, subtree: true });
  }
  function mountNavigationOnce() {
    once(() => {
      try { initNavigation(); } catch (e) { console.warn("[navigation] init failed", e); }
    }, "navigation");
  }

  function linkSwiperAndCursors() {
    try {
      const swiperContainers = document.querySelectorAll('.swiper[data-cursor]');
      swiperContainers.forEach(container => {
        const swiperInstance = container._swiper;
        const cursorInstance = container._customCursorInstance;
        if (swiperInstance && cursorInstance && typeof cursorInstance.listenToSwiper === 'function') {
          cursorInstance.listenToSwiper(swiperInstance);
        }
      });
    } catch(e) {
      console.warn("[linkSwiperAndCursors] failed", e);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ORCHESTRATION (LA FONCTION 'START' QUI LANCE TOUT)
  // ───────────────────────────────────────────────────────────────────────────
  function start() {
    mountSmoothOnce();
    mountTransitionsOnce();
    herotitlerevealOnce();
    mountLottieLogoOnce();
    mountSwiperOnce();
    mountCustomCursorsOnce();
    mountSplineAnimationsOnce();
    mountNavigationOnce();
    
    linkSwiperAndCursors();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. DÉCLENCHEMENT
  // ───────────────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", start);

})();

