window.JF = window.JF || {};
window.JF.PageAbout = (() => {
  let ctx;
  async function init() { ctx = gsap.context(() => {}); }
  function destroy() { ctx?.revert(); ctx = null; }
  return { init, destroy };
})();
