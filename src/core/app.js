// /src/core/app.js
// - Marque "Work" actif sur /work et /work/*.

import { initTransitions } from "../features/transitions.js";

(function () {
  // Namespace global
  const JF = (window.JF = window.JF || {});
  JF.version = JF.version || "1.0.0";

  // --------- Environnement (safe) ----------
  // Évite "Env is not defined". On expose JF.Env.EDITOR en se basant sur Webflow si dispo.
  if (!JF.Env) {
    try {
      const isEditor =
        !!(window.Webflow && typeof window.Webflow.env === "function" && window.Webflow.env("editor"));
      JF.Env = { EDITOR: isEditor };
    } catch (e) {
      JF.Env = { EDITOR: false };
    }
  }

  // --------- Util: marquer le lien actif dans la nav ----------
  // Force "Work" actif sur /work ET /work/<slug>
  function markNavCurrentByPath() {
    const path = window.location.pathname;
    const links = Array.from(document.querySelectorAll("a.navbar-link"));
    if (!links.length) return;

    // reset
    links.forEach((a) => a.classList.remove("w--current"));

    const byHref = (href) => links.find((a) => (a.getAttribute("href") || "") === href);

    if (path === "/" || path === "/home") {
      byHref("/")?.classList.add("w--current");
    } else if (path === "/about") {
      byHref("/about")?.classList.add("w--current");
    } else if (path === "/contact") {
      byHref("/contact")?.classList.add("w--current");
    } else if (path === "/work" || path.startsWith("/work/")) {
      // ✅ Work actif aussi sur les pages détail
      byHref("/work")?.classList.add("w--current");
    }
  }

  // --------- Boot ----------
  JF.boot = async () => {
    // Vendors / systèmes (si présents)
    JF.GSAP?.registerPlugins?.();
    JF.SystemAnims?.init?.();

    // Smooth seulement hors éditeur
    if (!JF.Env?.EDITOR) JF.Smooth?.mount?.();

    // Features
    JF.Slider?.mountAll?.();

    // Pages
    // On laisse la page décider via data-page, sinon on passe le pathname (normalisé côté _registry)
    const pageKey = document.body.getAttribute("data-page") || window.location.pathname;
    await JF.Pages?.mount?.(pageKey);

    // Nav active
    markNavCurrentByPath();
  };

  // Ready
  const start = () => JF.boot();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  // Transitions overlay (IN est géré par le bootstrap inline, ici on branche l'OUT)
  initTransitions();
})();
