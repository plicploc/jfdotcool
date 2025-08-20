// src/features/transitions.js
// pas d'import, on prend gsap depuis window (défini par vendors/gsap.js)

function isInternalLink(a) {
  const href = a.getAttribute("href") || "";
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  const url = new URL(href, window.location.origin);
  return url.origin === window.location.origin;
}

function handleClick(e) {
  const a = e.target.closest("a[href]");
  if (!a) return;
  if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (!isInternalLink(a)) return;

  const href = a.getAttribute("href");

  if (document.startViewTransition) {
    e.preventDefault();
    document.startViewTransition(() => { window.location.href = href; });
    return;
  }

  // fallback GSAP overlay
  e.preventDefault();
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:#000;opacity:0;pointer-events:none;";
  document.body.appendChild(overlay);

  if (window.gsap) {
    window.gsap.to(overlay, {
      opacity: 1,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => { window.location.href = href; }
    });
  } else {
    // fallback sans gsap
    overlay.style.transition = "opacity .3s ease";
    overlay.style.opacity = "1";
    setTimeout(() => { window.location.href = href; }, 300);
  }
}

function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else { fn(); }
}

export function initTransitions() {
  onReady(() => { document.documentElement.classList.remove("is-entering"); });
  document.addEventListener("click", handleClick, { capture: true });
  window.addEventListener("load", () => {
    window.JF?.Smooth?.refresh?.();
    if (window.ScrollTrigger?.refresh) ScrollTrigger.refresh(true);
  }, { once: true });
}
