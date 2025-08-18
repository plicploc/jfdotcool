// /src/pages/_registry.js
window.JF = window.JF || {};
window.JF.Pages = (() => {
  const map = new Map([
    ["home",    window.JF.PageHome],
    ["about",   window.JF.PageAbout],
    ["work",    window.JF.PageWork],
    ["contact", window.JF.PageContact],
      ["work-detail", window.JF.PageWorkDetail],
  ]);
  let currentKey = null;
  async function mount(key) {
    const k = normalize(key);
    currentKey = k;
    const mod = map.get(k);
    if (mod?.init) await mod.init();
  }
  function destroy(key) {
    const k = normalize(key || currentKey);
    const mod = map.get(k);
    mod?.destroy?.();
    currentKey = null;
  }
  function normalize(k) {
    if (!k) return "home";
    if (k.container && k.container.dataset?.page) return k.container.dataset.page; // Barba
    if (typeof k === "string" && k.startsWith("/")) k = k.replace(/\//g, "") || "home";
    return k;
  }
  return { mount, destroy };
})();
