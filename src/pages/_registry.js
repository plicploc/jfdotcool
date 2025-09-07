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

  // Si on passe déjà une clé (ex. "work-detail"), on ne touche pas
  if (typeof k === "string" && !k.startsWith("/")) return k;

  // Si on passe un pathname, mappe proprement
  if (typeof k === "string" && k.startsWith("/")) {
    if (k === "/" || k === "/home")   return "home";
    if (k === "/about")               return "about";
    if (k === "/contact")             return "contact";
    if (k === "/work")                return "work";
    if (k.startsWith("/work/"))       return "work-detail";
  }

  // Fallback: lis l'attribut data-page si présent
  const attr = document.body.getAttribute("data-page");
  return attr || "home";
}


  return { mount, destroy };
})();
