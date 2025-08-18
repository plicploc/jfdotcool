// /src/features/slider.js
// Placeholder : brancher ta version stable “slider-works-bt-drag”
window.JF = window.JF || {};
window.JF.Slider = (() => {
  const instances = new Set();
  function mountAll() {
    window.JF.$$('[data-animate="slider"]').forEach((root) => {
      if (root._sliderMounted) return;
      root._sliderMounted = true;
      const api = mountOne(root);
      instances.add(api);
    });
  }
  function mountOne(root) {
    const ctx = gsap.context(() => {
      const track = root.querySelector('[data-slider="slides"]');
      if (!track) return;
      gsap.set(track, { x: 0 });
    }, root);
    return { destroy() { ctx?.revert(); root._sliderMounted = false; } };
  }
  function destroyAll() { instances.forEach(i => i.destroy()); instances.clear(); }
  return { mountAll, destroyAll };
})();
