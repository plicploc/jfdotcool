window.JF = window.JF || {};
window.JF.PageWork = (() => {
  let ctx;
  async function init() { ctx = gsap.context(() => {}); }
  function destroy() { ctx?.revert(); ctx = null; }
  return { init, destroy };
})();
