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
    // --- MODIFICATION : On utilise JF.SmoothApp pour éviter le conflit avec smooth.js ---
    JF.SmoothApp = (function () { // RENOMMÉ pour éviter le conflit
      let smoother = null;
      let mm = null; 
      
      function isEditor() {
        try { return !!(window.Webflow?.env?.("editor") || window.Webflow?.env?.("design")); }
        catch { return false; }
      }
      
      // On vérifie si l'un OU l'autre smoother est actif
      function isActive() { 
        const v1Active = !!(window.JF?.Smooth?.isActive && window.JF.Smooth.isActive());
        const v2Active = !!(window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get());
        return v1Active || v2Active;
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

      function mount() {
        // --- MODIFICATION : On vérifie le HTML AVANT tout ---
        const wrapperEl = document.querySelector(".smooth-wrapper");
        const contentEl = document.querySelector(".smooth-content");

        if (isEditor()) {
          return;
        }

        // Si l'autre script (smooth.js) a déjà démarré, on n'initialise pas
        if (isActive()) {
           console.warn("[SmoothApp] Conflit détecté. JF.Smooth (smooth.js) est déjà actif. On annule l'init de SmoothApp.");
           // On s'assure que les plugins sont bien enregistrés pour le reste des scripts (ex: textEffects)
           try {
             if (window.gsap && window.ScrollSmoother && !gsap.plugins.ScrollSmoother) {
               gsap.registerPlugin(window.ScrollSmoother);
             }
           } catch(e) {}
           return;
        }

        // Si le HTML est manquant (ex: homepage), on n'initialise pas
        if (!wrapperEl || !contentEl) {
            console.warn(`[SmoothApp] HTML manquant: .smooth-wrapper (${!!wrapperEl}), .smooth-content (${!!contentEl}). Initialisation annulée.`);
            return;
        }
        
        try {
          gsap.registerPlugin(window.ScrollSmoother);
          
          mm = gsap.matchMedia();

          // Configuration "Desktop" (écrans de 768px et plus)
          mm.add("(min-width: 768px)", () => {
            
            // --- MODIFICATION DEMANDÉE (votre logique) ---
            // Détecter la classe .w-mod-touch sur le body (ajoutée par Webflow)
            const isTouch = document.body.classList.contains('w-mod-touch');
            
            // Définir les paramètres en fonction de la détection
            // Si w-mod-touch est présent (ex: iPad), on désactive le lissage (smooth: 0) et les effets (effects: false)
            const smoothValue = isTouch ? 0 : 1.2;
            const effectsValue = isTouch ? false : true;

            if (isTouch) {
              console.log("[SmoothApp] DESKTOP-sized device with TOUCH detected. Disabling smooth (0) and effects (false).");
            } else {
              console.log("[SmoothApp] DESKTOP-sized device with MOUSE detected. Enabling smooth (1.2) and effects (true).");
            }
            // --- FIN DE LA MODIFICATION ---

            smoother = window.ScrollSmoother.create({
              wrapper: wrapperEl,   // On passe les éléments
              content: contentEl,
              smooth: smoothValue,    // <-- Paramètre conditionnel
              effects: effectsValue,  // <-- Paramètre conditionnel
            });
            
            setupScrollerProxy(smoother);

            return () => {
              if (smoother) smoother.kill();
              smoother = null;
            };
          });

          // Configuration "Mobile" (écrans de 767px et moins)
          mm.add("(max-width: 767px)", () => {
            console.log("[SmoothApp] Configuration MOBILE (optimisée) activée.");
            smoother = window.ScrollSmoother.create({
              wrapper: wrapperEl, // On passe les éléments
              content: contentEl,
              smooth: 1,      // Lissage réduit pour plus de réactivité
              effects: false,   // <-- Effets désactivés
            });

            setupScrollerProxy(smoother);

            return () => {
              if (smoother) smoother.kill();
              smoother = null;
            };
          });

        } catch (e) { 
          console.warn("[SmoothApp] L'initialisation de ScrollSmoother a échoué :", e); 
        }
      }

      function unmount() {
        if (isEditor()) return; 
        
        try { 
          if (mm) {
            mm.revert();
            mm = null;
          }
          if (smoother) { // On ne tue que le smoother de SmoothApp
             smoother.kill();
             smoother = null;
          }
        } catch (e) { 
          console.warn("[SmoothApp] unmount failed", e); 
        }
      }
      return { isActive, mount, unmount };
    })();
  })();
  
  // --- MODIFICATION : On appelle JF.SmoothApp ---
  function mountSmoothOnce() { once(() => JF.SmoothApp.mount(), "smooth_app"); } // Clé renommée

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
  
  // --- MODIFICATION : Enregistrement de SplitText "Just-in-Time" ---
  function registerSplitTextIfNeeded() {
      try {
          if (window.SplitText && !gsap.plugins.SplitText) {
              gsap.registerPlugin(window.SplitText);
              console.log("[GSAP] SplitText registered.");
          }
      } catch(e) {
          console.warn("Failed to register SplitText", e);
      }
  }

  function herotitlerevealOnce() {
    once(() => {
      try { 
        registerSplitTextIfNeeded(); // Correction pour 'buildTimeline'
        JF.TextFX.revealTitle('.main-title-block .txttitle'); 
      } catch (e) { 
        console.warn("[heroTitleReveal] init failed", e); 
      }
    }, 'heroTitleReveal');
  }
  
  function revealTxtContentOnce() {
    once(() => {
      try { 
        registerSplitTextIfNeeded(); // Correction pour 'buildTimeline'
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
    // On n'enregistre PAS les plugins ici, on laisse mount() le faire
    // pour que JF.Smooth (de smooth.js) puisse s'exécuter en premier s'il le doit.
    // La correction de 'buildTimeline' se fait maintenant dans herotitlerevealOnce.
    
    // --- MODIFICATION : On appelle l'ancien mount de smooth.js ---
    // pour garder le comportement de base, et SmoothApp s'exécutera
    // en second et s'arrêtera s'il détecte un conflit.
    once(() => JF.Smooth.mount(), "smooth"); // L'appel original de smooth.js
    
    mountSmoothOnce(); // Notre nouvel appel (JF.SmoothApp)
    mountTransitionsOnce();
    herotitlerevealOnce();
    revealTxtContentOnce(); 
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
