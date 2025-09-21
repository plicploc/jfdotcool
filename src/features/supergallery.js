// src/features/supergallery.js
// Phase 1: détection & mesures uniquement (aucune anim/pin)

// Petit util pour loggers cohérents
function logDebug(enabled, ...args) { if (enabled) console.log("[supergallery]", ...args); }

// Détecte l’environnement Webflow Editor/Designer/Preview
function isWebflowEditorLike() {
  try {
    if (window.Webflow && window.Webflow.env) {
      return !!(Webflow.env("editor") || Webflow.env("design"));
    }
  } catch (e) {}
  // fallback sur l’attribut de <html> que Webflow pose souvent
  const html = document.documentElement;
  return html?.dataset?.wfMode === "editor" || html?.dataset?.wfMode === "preview";
}

export function initSuperGallery(options = {}) {
  const {
    selector = ".supergallery",
    wrapperSel = ".supergallery-wrapper",
    trackSel   = ".supergallery-collectionlist",
    slideSel   = ".slide-supergallery",
    debug = true,              // active les logs/outline
    outline = true             // ajoute un outline visuel discret
  } = options;

  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST   = typeof window.ScrollTrigger !== "undefined";
  const hasSS   = typeof window.ScrollSmoother !== "undefined" && !!window.ScrollSmoother.get;

  const smoother = hasSS ? window.ScrollSmoother.get() : null;
  const scrollerEl = smoother ? smoother.content() : window;
  const inEditor   = isWebflowEditorLike();

  logDebug(debug, "Boot phase1", { hasGSAP, hasST, hasSS: !!smoother, inEditor, scrollerEl });

  // Sélection des galeries
  const galleries = Array.from(document.querySelectorAll(selector));
  logDebug(debug, `Found ${galleries.length} .supergallery`);

  const results = [];

  galleries.forEach((gallery, idx) => {
    const wrapper = gallery.querySelector(wrapperSel);
    const track   = gallery.querySelector(trackSel);
    const slides  = Array.from(gallery.querySelectorAll(slideSel));

    // Diagnostics de structure
    if (!wrapper || !track) {
      logDebug(true, `#${idx} structure incomplète`, { wrapper: !!wrapper, track: !!track });
      return;
    }

    // Mesures
    const wrapperW = wrapper.clientWidth;
    const trackSW  = track.scrollWidth;
    const trackCW  = track.clientWidth;
    const extraX   = Math.max(0, trackSW - wrapperW);
    const slidesCount = slides.length;

    // Styles visuels (optionnels) pour voir les zones
    if (outline) {
      gallery.style.outline = "1px dashed rgba(0,128,255,0.35)";
      wrapper.style.outline = "1px dashed rgba(0,255,128,0.35)";
      track.style.outline   = "1px dashed rgba(255,128,0,0.35)";
    }

    // Protection contre les transforms hérités qui faussent les mesures
    // (on ne modifie pas encore la mise en page, juste un set "lecture")
    const computed = getComputedStyle(track);
    const hasTransform = computed.transform && computed.transform !== "none";

    // Dump diag
    logDebug(debug, `#${idx} OK`, {
      wrapperW, trackCW, trackSW, extraX, slidesCount, hasTransform,
      gallery, wrapper, track
    });

    results.push({
      index: idx,
      el: gallery,
      wrapper, track, slides,
      measures: { wrapperW, trackCW, trackSW, extraX, slidesCount },
      env: { hasGSAP, hasST, smoother: !!smoother, scrollerEl, inEditor }
    });
  });

  // Petit résumé en table pour debug UX (facile à repérer)
  try {
    if (debug && results.length) {
      const table = results.map(r => ({
        index: r.index,
        wrapperW: r.measures.wrapperW,
        trackCW:  r.measures.trackCW,
        trackSW:  r.measures.trackSW,
        extraX:   r.measures.extraX,
        slides:   r.measures.slidesCount,
        smoother: r.env.smoother,
        inEditor: r.env.inEditor
      }));
      console.table(table);
    }
  } catch (e) {}

  return results; // on retourne les données pour tests unitaires ou logs externes
}
