// /src/features/index.js
import "./navigation.js";
import "./textEffects.js";
import "./slider.js"; // 👈 remet le module slider dans le graphe

export { initTransitions } from "./transitions.js";

// Helper titres (optionnel)
export function initTextTiles(opts = {}) {
  return window.JF?.TextFX?.pouetpouet?.(".txttile", {
    duration: 0.3,
    delay: .5,
    stagger: 0.05,
    y: "30%",
    rotationX: -90,
    rotationY: 45,
    ease: "back.inOut(1.7)",
    ...opts
  });
}

// ✅ Helper sliders (appel unique depuis app.js)
export function initSliders() {
  return window.JF?.Slider?.mountAll?.();
}

export {}; // empêche l’élagage par le bundler
