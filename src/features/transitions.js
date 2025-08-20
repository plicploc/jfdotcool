// /src/features/transitions.js
// Transition d'overlay limitée à .site > .smooth-wrapper > .smooth-content
// Bloque les clics uniquement pendant l'OUT. Logs inclus.

function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

function isInternalLink(a) {
  const href = a.getAttribute("href") || "";
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  const url = new URL(href, window.location.origin);
  return url.origin === window.location.origin;
}




function fadeOutAndNavigate(overlay, href, duration = 0.5) {
  console.log("[transition] OUT start →", href);
  overlay.style.pointerEvents = "auto"; // bloque les clics pendant l'OUT

  if (window.gsap) {
    window.gsap.killTweensOf(overlay);
    window.gsap.set(overlay, { opacity: 0 });
    window.gsap.to(overlay, {
      opacity: 1,
      duration,
      ease: "power2.inOut",
      onComplete: () => {
        console.log("[transition] OUT done → navigating");
        window.location.href = href;
      }
    });
  } else {
    overlay.style.transition = `opacity ${duration}s ease`;
    // force reflow
    void overlay.offsetHeight;
    overlay.style.opacity = "1";
    setTimeout(() => {
      console.log("[transition] OUT done (no GSAP) → navigating");
      window.location.href = href;
    }, duration * 1000);
  }
}

function fadeInOnLoad(overlay, duration = 0.5) {
  console.log("[transition] IN start");
  overlay.style.pointerEvents = "none"; // rend les clics à l'arrivée

  if (window.gsap) {
    window.gsap.killTweensOf(overlay);
    window.gsap.set(overlay, { opacity: 1 });
    window.gsap.to(overlay, {
      opacity: 0,
      duration,
      ease: "power2.inOut",
      onComplete: () => console.log("[transition] IN done")
    });
  } else {
    overlay.style.transition = `opacity ${duration}s ease`;
    // force reflow
    void overlay.offsetHeight;
    overlay.style.opacity = "0";
  }
}

export function initTransitions() {
  onReady(() => {
    // 0) Au cas où le fade-in global est activé dans le <head>, on le retire ici
    if (document.documentElement.classList.contains("is-entering")) {
      console.log("[transition] removing html.is-entering");
      document.documentElement.classList.remove("is-entering");
    }

    // 1) Prépare l'overlay 
const overlay = document.getElementById("transition-overlay");


    // 2) IN à l'arrivée : 1 → 0
    fadeInOnLoad(overlay, 0.5);

    // 3) Clics internes → OUT : 0 → 1, puis vraie navigation
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a[href]");
        if (!a) return;

        // laissons passer nouvel onglet / modificateurs
        if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!isInternalLink(a)) return;

        const href = a.getAttribute("href");
        if (!href) return;

        e.preventDefault();
        fadeOutAndNavigate(overlay, href, 0.5);
      },
      { capture: true }
    );
  });

  // 4) Sécurité au load complet (images, etc.)
  window.addEventListener(
    "load",
    () => {
      window.JF?.Smooth?.refresh?.();
      if (window.ScrollTrigger?.refresh) window.ScrollTrigger.refresh(true);
    },
    { once: true }
  );
}
