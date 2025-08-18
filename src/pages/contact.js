window.JF = window.JF || {};
window.JF.PageContact = (() => {
  let ctx;
  async function init() { ctx = gsap.context(() => {}); }
  function destroy() { ctx?.revert(); ctx = null; }
  return { init, destroy };
})();
