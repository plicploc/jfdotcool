// src/features/lottie/scrollLogo.js
// Scroll → Lottie frames (linéaire pendant le scroll, micro ease à l’arrêt).
// IMPORTANT: n’importe PAS "gsap" ici. On utilise la même instance globale (CDN) que Smooth.

import lottie from "lottie-web";

// Récupère un scrollY fiable (support ScrollSmoother si présent)
function getScrollY() {
  const smoother = window.ScrollSmoother?.get?.();
  if (smoother && typeof smoother.scrollTop === "function") {
    return smoother.scrollTop();
  }
  return window.pageYOffset || document.documentElement.scrollTop || 0;
}

// Résout un chemin JSON vers la bonne base (CDN /dist ou site)
function resolveLottiePath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p; // URL absolue
  const clean = p.replace(/^\//, "");

  // Option: base fixe (CDN) si définie
  if (window.JF?.ASSETS_BASE) {
    return `${String(window.JF.ASSETS_BASE).replace(/\/$/, "")}/${clean}`;
  }

  // Essaie de retrouver la base /dist/ à partir du <script src=".../dist/app.*.js">
  const scripts = Array.from(document.scripts);
  const carrier = scripts.reverse().find((s) => /\/dist\/app\./.test(s.src)) || null;
  if (carrier?.src && carrier.src.includes("/dist/")) {
    const base = carrier.src.split("/dist/")[0] + "/dist";
    return `${base}/${clean}`;
  }

  // Fallback: relatif au domaine
  return `/${clean}`;
}

/**
 * Init Lottie logo dans le sélecteur donné.
 * @param {Object} opts
 * @param {string} [opts.selector='.new-sidebar .navbar-main .logo-horizontal']
 * @param {string} [opts.path='/animation/logo/jfdotcool-wiggle-website.json']
 * @param {number} [opts.pixelsPerLoop=1000]
 * @param {number} [opts.loopMultiplier=0.5]
 * @param {boolean} [opts.injectContainer=true]
 * @returns {Function} cleanup function
 */
export function initLottieLogo(opts = {}) {
  const {
    selector = ".new-sidebar .navbar-main .logo-horizontal",
    path = "/animation/logo/jfdotcool-wiggle-website.json", // ← ton dossier actuel "logo"
    pixelsPerLoop = 8000,
    loopMultiplier = 0.2,
    injectContainer = true,
  } = opts;

  const host = document.querySelector(selector);
  if (!host) {
    console.warn("[lottieLogo] host not found:", selector);
    return () => {};
  }

  // Permettre de surcharger le fichier via data-lottie-path
  const dataPath = host.getAttribute("data-lottie-path");
  const animPath = resolveLottiePath(dataPath || path);
  console.log("[lottieLogo] JSON →", animPath);

  // Trouver / créer un container propre pour la Lottie
  let container = host.querySelector(".logo-lottie");
  if (!container && injectContainer) {
    container = document.createElement("div");
    container.className = "logo-lottie logo-container";
    host.prepend(container);
  }
  if (!container) {
    console.warn("[lottieLogo] container .logo-lottie missing inside host");
    return () => {};
  }

  // Instancier Lottie
  const animation = lottie.loadAnimation({
    container,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: animPath,
  });

  let totalFrames = 0;
  let tl = null;
  const dummy = { frame: 0 };
  let stopTimer = null;

  // Diagnostics utiles si le JSON ne charge pas / assets manquants
  animation.addEventListener("data_failed", () => {
    console.error("[lottieLogo] data_failed (JSON introuvable ?)", animPath);
  });
  animation.addEventListener("config_ready", () => {
    console.log("[lottieLogo] config_ready");
  });
  animation.addEventListener("loaded_images", () => {
    console.log("[lottieLogo] loaded_images");
  });

  // Map scroll → progress [0..1] (boucles fractionnaires)
  function scrollToProgress(scrollY) {
    const numLoops = (scrollY / pixelsPerLoop) * loopMultiplier;
    // JS % peut être négatif: on normalise
    const progress = ((numLoops % 1) + 1) % 1;
    return progress;
  }

  // On utilise la même instance GSAP globale que Smooth (pas d'import)
  const GSAP = window.gsap;

  // Mise à jour principale
  const tickUpdate = () => {
    if (!tl) return;
    const p = scrollToProgress(getScrollY());
    tl.progress(p);
  };

  // Scroll natif: update + micro ease-out quand on s'arrête
  const onScroll = () => {
    if (!tl) return;
    tickUpdate();

    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      const currentProgress = tl.progress();
      const targetFrame = currentProgress * (totalFrames - 1);
      // si GSAP global est là, on applique un petit ease; sinon, on pousse direct
      if (GSAP?.to) {
        GSAP.to(dummy, {
          frame: targetFrame,
          duration: 0.25,
          ease: "power2.out",
          onUpdate: () => {
            animation.goToAndStop(Math.floor(dummy.frame), true);
          },
        });
      } else {
        dummy.frame = targetFrame;
        animation.goToAndStop(Math.floor(dummy.frame), true);
      }
    }, 90);
  };

  // Bind / Unbind
  const loco = window.locoScroll;
  const bind = () => {
    if (loco?.on) {
      loco.on("scroll", (args) => {
        const y =
          args?.scroll && typeof args.scroll.y === "number"
            ? args.scroll.y
            : getScrollY();
        const p = scrollToProgress(y);
        tl && tl.progress(p);
      });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      // Avec ScrollSmoother, si GSAP global est présent, utiliser le ticker pour un update fluide
      if (GSAP?.ticker?.add) GSAP.ticker.add(tickUpdate);
    }
  };

  const unbind = () => {
    if (!loco) {
      window.removeEventListener("scroll", onScroll);
      if (GSAP?.ticker?.remove) GSAP.ticker.remove(tickUpdate);
    }
  };

  animation.addEventListener("DOMLoaded", () => {
    totalFrames = animation.totalFrames || 0;

    // Afficher immédiatement la frame 0
    try {
      animation.goToAndStop(0, true);
    } catch (e) {}

    // Si GSAP global est absent (peu probable chez toi), on fait un fallback sans timeline
    if (!GSAP?.timeline) {
      console.warn("[lottieLogo] GSAP global manquant, mode basique (sans timeline)");
      bind();
      tickUpdate();
      return;
    }

    // Timeline linéaire 0→totalFrames-1 (pilotée via tl.progress)
    tl = GSAP.timeline({ paused: true }).to(
      { frame: 0 },
      {
        frame: Math.max(0, totalFrames - 1),
        duration: 1,
        ease: "none",
        onUpdate() {
          const f = Math.floor(this.targets()[0].frame);
          animation.goToAndStop(f, true);
          dummy.frame = f;
        },
      }
    );

    bind();
    tickUpdate();
  });

  // Cleanup
  return () => {
    try {
      unbind();
      animation?.destroy?.();
    } catch (_) {}
  };
}
