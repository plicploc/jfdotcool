// src/core/app.js

// ───────────────────────────────────────────────────────────────────────────
// 1. IMPORTATIONS DES MODULES
// ───────────────────────────────────────────────────────────────────────────
import { initTransitions } from "../features/transitions.js";
import { initLottieLogo } from "../features/lottie/index.js";
import { initSwiperSliders } from "../features/swiper-slider.js";
import { initHomescrollAnimations } from "../features/homescroll-anim.js";
import { initCustomCursors } from "../features/custom-cursor.js";
import "../vendors/smooth.js"; // Charge JF.Smooth (v1)
import "../features/textEffects.js"; // Charge (probablement) window.SplitText


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
function updateDebugStatus(status) {
    try {
      const debugEl = document.querySelector('.debug');
      if (debugEl) {
        debugEl.textContent = status;
      }
    } catch (e) {
      console.warn('Impossible de mettre à jour le texte de debug', e);
    }
  }
  
  // -- Smooth Scrolling --
  (function attachSmoothAPI() {
    JF.SmoothApp = (function () { // Renommé en JF.SmoothApp
      let smoother = null;
      let mm = gsap.matchMedia(); // On prépare matchMedia
      
      function isEditor() {
        try { return !!(window.Webflow?.env?.("editor") || window.Webflow?.env?.("design")); }
        catch { return false; }
      }
      
      function isActive() { 
        const v1Active = !!(window.JF?.Smooth?.isActive && window.JF.Smooth.isActive());
        const v2Active = !!(window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get());
        return v1Active || v2Active || !!smoother;
      }
      
      function setupScrollerProxy(smootherInstance) {
        if (!smootherInstance) return;

        ScrollTrigger.scrollerProxy(smootherInstance.wrapper, {
          scrollTop(value) {
            if (arguments.length) {
              smootherInstance.scrollTop(value);
            }
            return smootherInstance.scrollTop();
          },
          getBoundingClientRect() {
            return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
          },
          pinType: smootherInstance.wrapper.style.transform ? "transform" : "fixed"
        });

        ScrollTrigger.addEventListener("refresh", () => smootherInstance.update());
        ScrollTrigger.refresh();
        
        console.log("✅ [APP.JS] ScrollSmoother et ScrollerProxy sont configurés.");
      }

      // --- MODIFICATION MAJEURE : Retour à matchMedia + Vérification HTML ---
      function mount() {
        console.log("debut mount (app.js)"); 
               
        if (isEditor()) {
          updateDebugStatus("no smooth (editor)");
          return;
        }

        if (isActive()) {
          console.warn("[SmoothApp] Détecté un smoother déjà actif. On stoppe la double-init.");
          updateDebugStatus("withsmooth (legacy)");
          return;
        }

        // --- CORRECTION DE L'ERREUR 'transform' ---
        // On vérifie le HTML AVANT de faire quoi que ce soit.
        const wrapperEl = document.querySelector(".smooth-wrapper");
        const contentEl = document.querySelector(".smooth-content");
          
        if (!wrapperEl || !contentEl) {
            console.warn(`[SmoothApp] HTML manquant: .smooth-wrapper (${!!wrapperEl}), .smooth-content (${!!contentEl}). Initialisation annulée.`);
            updateDebugStatus("no smooth (HTML missing)");
            return; // On arrête tout si le HTML n'est pas là.
        }

        // --- NOUVELLE LOGIQUE matchMedia ---
        console.log("[SmoothApp] HTML trouvé. Initialisation de matchMedia...");
        
        // Configuration "Desktop" (768px et plus)
        mm.add("(min-width: 768px)", () => {
          console.log("[SmoothApp] Configuration DESKTOP activée.");
          updateDebugStatus("withsmooth (desktop)");
          
          smoother = window.ScrollSmoother.create({
            wrapper: wrapperEl,
            content: contentEl,
            smooth: 1.2,    // Lissage complet
            effects: true     // Effets activés
          });
          setupScrollerProxy(smoother);

          // Fonction de nettoyage
          return () => {
            if (smoother) smoother.kill();
            smoother = null;
          };
        });

        // Configuration "Mobile/Tablette" (767px et moins)
        mm.add("(max-width: 767px)", () => {
          console.log("[SmoothApp] Configuration MOBILE (optimisée) activée.");
          updateDebugStatus("withsmooth (mobile)");
          
          smoother = window.ScrollSmoother.create({
            wrapper: wrapperEl,
            content: contentEl,
            smooth: 1,      // Lissage réduit
            effects: false    // Effets DÉSACTIVÉS (gros gain de perf)
          });
          setupScrollerProxy(smoother);

          // Fonction de nettoyage
          return () => {
            if (smoother) smoother.kill();
            smoother = null;
          };
        });
      }

      function unmount() {
        if (isEditor()) return;
        try { 
          // On tue les instances matchMedia et le smoother
          if (mm) mm.revert();
          if (smoother) {
             smoother.kill();
             smoother = null;
          }
          if (window.JF?.Smooth?.destroyAll) {
            window.JF.Smooth.destroyAll();
          }
          updateDebugStatus(""); 
        } catch (e) { 
          console.warn("[SmoothApp] unmount failed", e); 
        }
      }
      return { isActive, mount, unmount };
    })();
  })();
  
  function mountSmoothOnce() { 
    once(() => JF.SmoothApp.mount(), "smooth_main"); 
  }

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
  
  // --- CORRECTION "buildTimeline" (inchangée) ---
  function herotitlerevealOnce() {
    once(() => {
      try { 
        if (window.SplitText && !gsap.plugins.SplitText) {
          gsap.registerPlugin(window.SplitText);
          console.log("[herotitlerevealOnce] SplitText registered.");
        }
        JF.TextFX.revealTitle('.main-title-block .txttitle'); 
      } catch (e) { 
        console.warn("[heroTitleReveal] init failed", e); 
      }
    }, 'heroTitleReveal');
  }
  
  function revealTxtContentOnce() {
    once(() => {
      try { 
        if (window.SplitText && !gsap.plugins.SplitText) {
          gsap.registerPlugin(window.SplitText);
          console.log("[revealTxtContentOnce] SplitText registered.");
        }
        JF.TextFX.revealTxtContent('.txt-content'); 
      } catch (e) { 
        console.warn("[revealTxtContent] init failed", e); 
      }
    }, 'revealTxtContent');
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

    // --- CORRECTION "buildTimeline" (inchangée) ---
    try {
        if (!window.gsap) throw new Error("GSAP core not loaded");
        if (!window.ScrollSmoother) throw new Error("ScrollSmoother not loaded");
        
        gsap.registerPlugin(window.ScrollSmoother);
        console.log("[START] GSAP Plugins registered by app.js (Smoother only).");
        
    } catch (e) {
        console.error("[START] Failed to register ScrollSmoother.", e);
        updateDebugStatus("no smooth (plugin error)");
        return; 
    }

    // Le reste de vos fonctions
    mountSmoothOnce(); 
    mountTransitionsOnce();
    herotitlerevealOnce(); // Va enregistrer SplitText
    revealTxtContentOnce(); // Va enregistrer SplitText
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