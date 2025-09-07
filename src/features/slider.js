// /src/features/slider.js
// Version sans manipulation de .mask-diapo (parallaxe retirée)
// Conserve : loop infini, drag, snap, boutons + snap après resize

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
    document
      .querySelectorAll(".superslide-collectionlist-wrapper")
      .forEach((w) => (w._sliderMounted = false));
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

    const state = {
      index: ORIGINAL_COUNT, // démarrer au milieu (série centrale)
      centers: [],
      period: 0,
      firstCentralLeft: 0,
      lastCentralRight: 0
    };

    const getVW = () => wrapper.clientWidth;

    function measure() {
      // centres de toutes les slides (pour le snap)
      state.centers = slides.map((s) => s.offsetLeft + s.offsetWidth / 2);

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

    function normalizeIntoMiddle() {
      // repositionne l'index dans la série centrale
      if (state.index < ORIGINAL_COUNT) {
        state.index += ORIGINAL_COUNT;
        gsap.set(track, { x: xForIndex(state.index) });
      } else if (state.index >= ORIGINAL_COUNT * 2) {
        state.index -= ORIGINAL_COUNT;
        gsap.set(track, { x: xForIndex(state.index) });
      }
    }

    function goToIndex(i, vars = {}) {
      state.index = gsap.utils.wrap(0, slides.length, i);
      return gsap.to(track, {
        x: xForIndex(state.index),
        duration: 0.6,
        ease: "power2.inOut",
        overwrite: true,
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
      } else if (viewCenter > rightThreshold) {
        gsap.set(track, { x: x - state.period });
      }
    }

    function initPosition() {
      measure();
      gsap.set(track, { x: xForIndex(state.index) });
    }

    // ————————— Context GSAP + initialisation après chargement images
    ctx = gsap.context(() => {
      const imgs = list.querySelectorAll("img");
      let left = imgs.length;
      if (left) {
        imgs.forEach((img) => {
          if (img.complete) {
            if (--left === 0) initPosition();
          } else {
            img.addEventListener(
              "load",
              () => { if (--left === 0) initPosition(); },
              { once: true }
            );
          }
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
          },
          onDrag() {
            loopIfNeeded();
          },
          onThrowUpdate() {
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

      // ——— Snap après resize (debounce)
      let resizeTimer;
      const handleResize = () => {
        // stoppe une éventuelle anim en cours pour éviter les artefacts
        gsap.killTweensOf(track);
        // re-mesure tout (slides/centres/période)
        measure();
        // réaligne la slide courante au centre géométrique
        gsap.set(track, { x: xForIndex(state.index) });
        // sécurité boucle infinie si viewport a beaucoup changé
        loopIfNeeded();
        // puis snap sur la plus proche (au cas où le layout ait bougé)
        snapToClosest();
      };

      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 180); // debounce
      };

      window.addEventListener("resize", onResize);

      // garder la réf pour cleanup
      wrapper.__onResize = onResize;
    }, wrapper);

    // API instance
    return {
      destroy() {
        if (wrapper.__onResize) {
          window.removeEventListener("resize", wrapper.__onResize);
          wrapper.__onResize = null;
        }
        ctx?.revert();
        wrapper._sliderMounted = false;
      }
    };
  }

  return { mountAll, destroyAll };
})();
