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
  if (typeof k === "string") {
    return k.startsWith("/") ? (k.replace(/\//g, "") || "home") : k;
  }
  const attr = document.body.getAttribute("data-page");
  return attr || "home";
}

  return { mount, destroy };
})();
