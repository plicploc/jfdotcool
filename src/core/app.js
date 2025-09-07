// src/core/app.js
// Boot global (sans Barba) + Lottie logo scroll-sync dans la sidebar.

import { initTransitions } from "../features/transitions.js";
import { initLottieLogo } from "../features/lottie/index.js";

(function () {
  // Namespace global
  const JF = (window.JF = window.JF || {});
  JF.version = JF.version || "1.0.0";

  // ───────────────────────────────────────────────────────────────────────────
  // Smooth: tente de monter, puis réessaie un peu si le DOM n'était pas prêt
  function tryMountSmooth(retries = 6, delay = 120) {
    if (JF.Smooth?.isActive?.()) return;          // déjà actif
    JF.Smooth?.mount?.();                         // 1ère tentative
    if (JF.Smooth?.isActive?.()) {
      JF.Smooth?.mountPage?.();                   // petit refresh
      return;
    }
    if (retries > 0) {
      setTimeout(() => tryMountSmooth(retries - 1, delay), delay);
    } else {
      console.warn("[Smooth] mount retry épuisé");
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

  JF.boot = async () => {
    // Vendors / systèmes (si présents)
    JF.GSAP?.registerPlugins?.();
    JF.SystemAnims?.init?.();

    const onReady = () => {
      // Smooth seulement hors éditeur
      if (!JF.Env?.EDITOR) {
        console.log("[Smooth] mount (with retry)");
        tryMountSmooth();                         // ← au lieu d'un seul mount direct
      }

      // Transitions overlay / hooks
      initTransitions?.();

      // ── Lottie Logo (sidebar) ────────────────────────────────────────────────
      try {
        if (JF._destroyLottieLogo) {
          JF._destroyLottieLogo();
        }
        JF._destroyLottieLogo = initLottieLogo({
          selector: ".new-sidebar .navbar-main .logo-horizontal",
          path: "/animation/logo/jfdotcool-wiggle-website.json",
          pixelsPerLoop: 1000,
          loopMultiplier: 0.5,
        });
      } catch (e) {
        console.warn("[lottieLogo] init failed", e);
      }

      // Autres features éventuelles
      JF.Slider?.mountAll?.();

      // Filet de sécurité: si des éléments arrivent plus tard (images/IX2),
      // on retente 2 fois après l'évènement load.
      window.addEventListener("load", () => tryMountSmooth(2, 150), { once: true });
    };

    // Lance onReady tout de suite si le DOM est déjà prêt
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady, { once: true });
    } else {
      onReady();
    }
  };

  // Boot de l’app
  const start = () => JF.boot();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  // Cleanup sur navigation complète (pas de SPA)
  window.addEventListener(
    "pagehide",
    () => {
      JF._destroyLottieLogo?.();
    },
    { once: true }
  );
})();
