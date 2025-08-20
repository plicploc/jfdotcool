// /src/features/index.js
// Boot des features globales (navigation, slider…)
// - navigation.js : IIFE auto-init (DOM Ready + Barba)
// - slider.js : JF.Slider.mountAll() / destroyAll()

import './navigation.js'; // side-effect: s’installe tout seul
import './slider.js';     // side-effect: définit window.JF.Slider

function runSliders() {
  if (window.JF?.Slider?.mountAll) {
    window.JF.Slider.mountAll();
  }
}

function destroySliders() {
  if (window.JF?.Slider?.destroyAll) {
    window.JF.Slider.destroyAll();
  }
}

// helper DOM ready
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

// ---- Boot initial (au chargement) ----
onReady(() => {
  runSliders();
});

// ---- Hooks Barba ----
if (window.barba?.hooks) {
  window.barba.hooks.before(() => {
    destroySliders();
  });
  window.barba.hooks.after(() => {
    runSliders();
    // navigation.js a déjà son propre hook après transition
  });
}

// Debug global si besoin
window.__jfFeatures = { runSliders, destroySliders };
