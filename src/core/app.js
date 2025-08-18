(function () {
  const JF = (window.JF = window.JF || {});
  JF.version = "1.0.0";

  const isClient = typeof window !== "undefined" && typeof document !== "undefined";
  if (!isClient) return;

  const Env = (JF.Env = (() => {
    const search = new URLSearchParams(location.search);
    const DEBUG = search.get("debug") === "1";
    const EDITOR = !!(window.Webflow && window.Webflow.env && window.Webflow.env("editor"));
    const PROD = !DEBUG && location.hostname.indexOf("webflow.io") === -1;
    return { DEBUG, EDITOR, PROD };
  })());

  JF.$  = (sel, el = document) => el.querySelector(sel);
  JF.$$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  JF.on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

  JF.bus = (() => {
    const m = new Map();
    return {
      on: (t, fn) => (m.has(t) ? m.get(t).push(fn) : m.set(t, [fn])),
      emit: (t, p) => (m.get(t) || []).forEach(fn => fn(p)),
      off: (t, fn) => m.set(t, (m.get(t) || []).filter(f => f !== fn)),
    };
  })();

  JF.boot = async () => {
    JF.GSAP?.registerPlugins?.();
    JF.SystemAnims?.init?.();
    if (!Env.EDITOR) JF.Smooth?.mount?.();
    JF.Slider?.mountAll?.();
    const pageKey = document.body.getAttribute("data-page") || location.pathname;
    await JF.Pages?.mount?.(pageKey);
    JF.Barba?.enable?.();
  };

  const ready = () => JF.boot();
  (document.readyState !== "loading") ? ready() : document.addEventListener("DOMContentLoaded", ready);
})();
