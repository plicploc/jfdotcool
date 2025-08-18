// /src/features/slider.js
// Intègre la version "works.js" (loop infini + parallaxe cosinus + drag + boutons)

window.JF = window.JF || {};
window.JF.Slider = (() => {
  const instances = new Set();

 function mountAll() {
  const page = document.body.getAttribute("data-page");

  // 1) Si on trouve la structure slider, on monte (prioritaire)
  const wrappers = document.querySelectorAll(".superslide-collectionlist-wrapper");

  // 2) Sinon, on limite aux pages connues
  const allowByPage = page === "work" || page === "work-detail";

  if (!wrappers.length && !allowByPage) return;

  wrappers.forEach((wrapper) => {
    if (wrapper._sliderMounted) return;
    const api = mountOne(wrapper);
    if (api) {
      wrapper._sliderMounted = true;
      instances.add(api);
    }
  });
}

  function destroyAll() {
    instances.forEach((api) => api.destroy());
    instances.clear();
    document.querySelectorAll(".superslide-collectionlist-wrapper").forEach(w => (w._sliderMounted = false));
  }

  function mountOne(wrapper) {
    const track     = wrapper.closest(".superslide-track");
    const list      = wrapper.querySelector(".superslide-collectionlist");
    let   slides    = list ? Array.from(list.querySelectorAll(".superslide")) : [];
    const container = wrapper.closest(".superslide-container"); // parent global (boutons)

    if (!track || !list || !slides.length || typeof gsap === "undefined") {
      console.warn("[superslide] init abort");
      return null;
    }

    let ctx;
    // états partagés
    const ORIGINAL_COUNT = slides.length;
    const clonesBefore   = slides.map((s) => s.cloneNode(true));
    const clonesAfter    = slides.map((s) => s.cloneNode(true));
    list.prepend(...clonesBefore);
    list.append(...clonesAfter);
    slides = Array.from(list.querySelectorAll(".superslide")); // re-scan

    const paraEls = slides.map((s) => s.querySelector("img.mask-diapo"));
    const para    = { spreads: [] };

    const state = {
      index: ORIGINAL_COUNT, // démarrer au milieu (série centrale)
      centers: [],
      period: 0,
      firstCentralLeft: 0,
      lastCentralRight: 0
    };

    const getVW = () => wrapper.clientWidth;

    function measure() {
      state.centers = slides.map((s) => s.offsetLeft + s.offsetWidth / 2);

      // spread (innerW - slideW) par slide pour la parallaxe (si image présente)
      para.spreads = slides.map((s, i) => {
        const el = paraEls[i];
        if (!el) return 0;
        return Math.max(0, el.offsetWidth - s.offsetWidth);
      });

      // métriques pour la boucle infinie
      const firstCentral = slides[ORIGINAL_COUNT];
      const lastCentral  = slides[ORIGINAL_COUNT + ORIGINAL_COUNT - 1];
      if (firstCentral && lastCentral) {
        state.firstCentralLeft = firstCentral.offsetLeft;
        state.lastCentralRight = lastCentral.offsetLeft + lastCentral.offsetWidth;
        state.period = state.lastCentralRight - state.firstCentralLeft;
      }
    }

    function xForIndex(i) {
      i = gsap.utils.wrap(0, slides.length, i);
      const sCenter = slides[i].offsetLeft + slides[i].offsetWidth / 2;
      return Math.round(getVW() / 2 - sCenter);
    }

    function updateParallaxPositions() {
      const vw = getVW();
      const viewCenter = -gsap.getProperty(track, "x") + vw / 2;

      for (let i = 0; i < slides.length; i++) {
        const el = paraEls[i];
        if (!el) continue;

        const slide = slides[i];
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;

        // p ∈ [-1, 1] : -1 gauche, 0 centre, +1 droite
        let p = (slideCenter - viewCenter) / (vw / 2);
        if (p < -1) p = -1;
        else if (p > 1) p = 1;

        const spread = para.spreads[i] || 0;
        const x = spread * Math.cos(Math.PI * p);

        gsap.set(el, { x: Math.round(x) });
      }
    }

    function normalizeIntoMiddle() {
      if (state.index < ORIGINAL_COUNT) {
        state.index += ORIGINAL_COUNT;
        gsap.set(track, { x: xForIndex(state.index) });
        updateParallaxPositions();
      } else if (state.index >= ORIGINAL_COUNT * 2) {
        state.index -= ORIGINAL_COUNT;
        gsap.set(track, { x: xForIndex(state.index) });
        updateParallaxPositions();
      }
    }

    function goToIndex(i, vars = {}) {
      state.index = gsap.utils.wrap(0, slides.length, i);
      return gsap.to(track, {
        x: xForIndex(state.index),
        duration: 0.6,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: updateParallaxPositions,
        ...vars,
        onComplete: () => normalizeIntoMiddle()
      });
    }

    function snapToClosest() {
      const viewCenter = -gsap.getProperty(track, "x") + getVW() / 2;
      let idx = 0, min = Infinity;
      for (let i = 0; i < state.centers.length; i++) {
        const d = Math.abs(state.centers[i] - viewCenter);
        if (d < min) { min = d; idx = i; }
      }
      goToIndex(idx);
    }

    function loopIfNeeded() {
      if (!state.period) return;
      const x = gsap.getProperty(track, "x");
      const vw2 = getVW() / 2;
      const viewCenter = -x + vw2;

      const leftThreshold  = state.firstCentralLeft - state.period / 2;
      const rightThreshold = state.lastCentralRight + state.period / 2;

      if (viewCenter < leftThreshold) {
        gsap.set(track, { x: x + state.period });
        updateParallaxPositions();
      } else if (viewCenter > rightThreshold) {
        gsap.set(track, { x: x - state.period });
        updateParallaxPositions();
      }
    }

    function initPosition() {
      measure();
      gsap.set(track, { x: xForIndex(state.index) });
      updateParallaxPositions();
      requestAnimationFrame(updateParallaxPositions);
    }

    // ————————— Context GSAP + initialisation après chargement images
    ctx = gsap.context(() => {
      const imgs = list.querySelectorAll("img");
      let left = imgs.length;
      if (left) {
        imgs.forEach((img) => {
          if (img.complete) { if (--left === 0) initPosition(); }
          else img.addEventListener("load", () => { if (--left === 0) initPosition(); }, { once: true });
        });
        setTimeout(() => { if (left > 0) initPosition(); }, 700); // fallback sécurité
      } else {
        initPosition();
      }

      // DRAG (infinite loop via reposition à la volée)
      if (typeof Draggable === "function") {
        Draggable.create(track, {
          type: "x",
          inertia: true,
          onPressInit() {
            measure();
            updateParallaxPositions();
          },
          onDrag() {
            updateParallaxPositions();
            loopIfNeeded();
          },
          onThrowUpdate() {
            updateParallaxPositions();
            loopIfNeeded();
          },
          onDragEnd() {
            snapToClosest();
          }
        });
      }

      // Boutons prev/next dans le container
      const btnNexts = container ? container.querySelectorAll(".superslide-next, [data-slider='next']") : [];
      const btnPrevs = container ? container.querySelectorAll(".superslide-prev, [data-slider='prev']") : [];

      btnNexts.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          goToIndex(state.index + 1);
        });
      });

      btnPrevs.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          goToIndex(state.index - 1);
        });
      });
    }, wrapper);

    // API instance
    return {
      destroy() {
        ctx?.revert();
        wrapper._sliderMounted = false;
      }
    };
  }

  return { mountAll, destroyAll };
})();
