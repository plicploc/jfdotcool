// /src/vendors/barba.js
window.JF = window.JF || {};
window.JF.Barba = (() => {
  let enabled = false;
  function enable() {
    if (enabled || !window.barba) return;
    enabled = true;
    function updateCurrentLinks(nextUrl) {
  document.querySelectorAll(".menu-item").forEach(link => {
    link.classList.remove("w--current");
    if (link.getAttribute("href") === nextUrl.pathname) {
      link.classList.add("w--current");
    }
  });
}

    barba.init({
      preventRunning: true,
      timeout: 7000,
      transitions: [{
        name: "fade",
        async leave({ current }) { return window.JF.Transitions?.leaveFade?.(current); },
        async enter({ next }) {
  // transition visuelle IN
  await window.JF.Transitions?.enterFade?.(next);

  // monter le module de page
  await window.JF.Pages?.mount?.(next.container?.dataset.page || next.url.path);

  // maj du lien actif (robuste si next.url manque)
  (function updateCurrentLinks(u) {
    const url = new URL(u || window.location.href);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".menu-item").forEach(link => {
      const href = (link.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      link.classList.toggle("w--current", href === path);
    });
  })(next?.url?.href);

  // systèmes globaux
  window.JF.SystemAnims?.refresh?.();

  // IMPORTANT : (re)monter Smooth pour le nouveau container
  if (typeof window.JF.Smooth?.mountPage === "function") {
    window.JF.Smooth.mountPage();
  } else {
    // fallback si tu n’as que refresh()
    window.JF.Smooth?.refresh?.();
  }

  // reset scroll en haut
  window.JF.Smooth?.scrollTo?.(0, { duration: 0 });

  // Re‑init Webflow (ordre sûr)
  if (window.Webflow) {
    try {
      // purge les bindings de l’ancienne page
      window.Webflow.destroy?.();
      // rebinde les modules core
      window.Webflow.ready?.();

      // modules spécifiques
      const ix2 = window.Webflow.require?.("ix2");
      ix2?.init?.();
      window.Webflow.require?.("lightbox")?.ready?.();
      window.Webflow.require?.("video")?.ready?.();
      window.Webflow.require?.("forms")?.ready?.();
    } catch (err) {
      console.warn("[Barba] Webflow re-init error:", err);
    }
  }
}
      }]
    });
    
  }
  return { enable };
})();

// Transitions par défaut
window.JF = window.JF || {};
window.JF.Transitions = (() => {
  function leaveFade(current) {
    return new Promise((res) => {
      const el = current.container;
      if (!el || !window.gsap) return res();
      gsap.to(el, { autoAlpha: 0, duration: 0.25, onComplete: res });
    });
  }
  function enterFade(next) {
    return new Promise((res) => {
      const el = next.container;
      if (!el || !window.gsap) return res();
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, onComplete: res });
    });
  }
  return { leaveFade, enterFade };
})();
