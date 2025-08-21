// /src/features/transitions.js
// Gère l'OUT (0→1) sur #transition-overlay + "hold" du lien cliqué

function isInternalLink(a) {
  const href = a.getAttribute("href") || "";
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  const url = new URL(href, location.origin);
  return url.origin === location.origin;
}

function holdSidebarHover(linkEl) {
  linkEl.classList.add("is-held");
  const sidebar = linkEl.closest(".sidebar, .navbar, [data-nav], .sidebar-new");
  if (sidebar) sidebar.classList.add("is-transitioning");
}

function playOutAndGo(overlay, href, duration = 1) {
  // rendre visible sans transition puis 0→1
  overlay.style.visibility = "visible";
  overlay.style.transition = "none";
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "auto"; // bloque interactions
  requestAnimationFrame(() => {
    if (window.gsap) {
      window.gsap.killTweensOf(overlay);
      window.gsap.to(overlay, { opacity: 1, duration, ease: "power2.inOut", onComplete: () => location.href = href });
    } else {
      overlay.style.transition = `opacity ${duration}s ease`;
      overlay.style.opacity = "1";
      setTimeout(() => (location.href = href), duration * 1000);
    }
  });
}

export function initTransitions() {
  const overlay = document.getElementById("transition-overlay");
  if (!overlay) return;

  // Clics internes → OUT
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;

      if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!isInternalLink(a)) return;

      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return;

      // gèle visuel + verrouille la sidebar
      holdSidebarHover(a);

      e.preventDefault();
      playOutAndGo(overlay, href, 1);
    },
    { capture: true }
  );

  // Safety: retour bfcache → overlay doit rester caché
  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) {
      overlay.style.transition = "none";
      overlay.style.opacity = "0";
      overlay.style.visibility = "hidden";
      overlay.style.pointerEvents = "none";
      document.querySelectorAll(".is-held").forEach((el) => el.classList.remove("is-held"));
      document.querySelectorAll(".is-transitioning").forEach((el) => el.classList.remove("is-transitioning"));
    }
  });
}