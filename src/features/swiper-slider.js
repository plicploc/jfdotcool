/**
 * Swiper slider feature
 * - Instancie tous les sliders .swiper-images trouvés dans le DOM (une ou plusieurs instances).
 * - N'instancie pas deux fois (data-initialized).
 * - Gère les boutons .swiper-navigation .is-prev / .is-next scoping dans le même wrapper.
 * - Ajoute des classes d'état: .is-moving sur le wrapper, .is-active sur la slide active.
 *
 * Dépendances:
 *  - Swiper (window.Swiper doit être disponible)
 */
function getNativeStateForSlide(slide) {
  const C = slide.classList;
  // priorité stricte : active > prev > next > visible > inactive
  if (C.contains('swiper-slide-active') || C.contains('swiper-slide-duplicate-active')) return 'active';
  if (C.contains('swiper-slide-prev')   || C.contains('swiper-slide-duplicate-prev'))   return 'prev';
  if (C.contains('swiper-slide-next')   || C.contains('swiper-slide-duplicate-next'))   return 'next';
  if (C.contains('swiper-slide-visible') || C.contains('swiper-slide-fully-visible'))   return 'visible';
  return 'inactive';
}

function updateSlideStates(swiper, moving = false) {
  swiper.slides.forEach((slide) => {
    const state = getNativeStateForSlide(slide);

    // reset classes miroir (faciles à styliser dans Webflow)
    slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-visible', 'is-inactive');
    slide.classList.add(
      state === 'active'   ? 'is-active'   :
      state === 'prev'     ? 'is-prev'     :
      state === 'next'     ? 'is-next'     :
      state === 'visible'  ? 'is-visible'  : 'is-inactive'
    );

    // texte dans .txt-slide (si présent)
    const txt = slide.querySelector('.txt-slide');
    if (txt) txt.textContent = moving ? `${state} (moving)` : state;
  });
}

function markBoot(swiper) {
  swiper.__bootAt = performance.now();
  swiper.__didRealMove = false;
  swiper.__lastTranslate = swiper.translate || 0;
}

function isBooting(swiper, ms = 300) {
  return typeof swiper.__bootAt === 'number' && (performance.now() - swiper.__bootAt) < ms;
}

function detectRealMove(swiper, threshold = 0.5) {
  const t = swiper.translate || 0;
  const moved = Math.abs(t - (swiper.__lastTranslate || 0)) > threshold;
  swiper.__lastTranslate = t;
  if (moved) swiper.__didRealMove = true;
  return moved || swiper.__didRealMove;
}


function buildOptions(containerEl) {
  // Navigation scoped au container le plus proche (meilleure isolation quand plusieurs sliders)
  const nav = containerEl.querySelector('.swiper-navigation');
  const nextEl = nav?.querySelector('.is-next') || containerEl.querySelector('.is-next');
  const prevEl = nav?.querySelector('.is-prev') || containerEl.querySelector('.is-prev');

  return {
    grabCursor: true,
    centeredSlides: true,
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    effect: 'creative',
    speed:600,
    creativeEffect: {
      prev: {
        shadow: false,
        origin: 'left center',
        translate: ['-20%', 0, -20],
        rotate: [0, 50, 0],
      },
      next: {
        shadow: false,
        origin: 'right center',
        translate: ['20%', 0, -20],
        rotate: [0, -50, 0],
      },
    },
    navigation: {
      nextEl: nextEl || '.swiper-navigation .is-next',
      prevEl: prevEl || '.swiper-navigation .is-prev',
    },
    // Events utiles pour états UI
    on: {
    init(swiper) {
        markBoot(swiper);                // ← horodatage du boot
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false); // ← pas de "(moving)" au chargement
    },

    slideChangeTransitionStart(swiper) {
        // Ignore la 1ère transition “fantôme” au boot
        if (isBooting(swiper) && !swiper.__didRealMove) return;
        containerEl.classList.add('is-moving');
        updateSlideStates(swiper, true);
    },

    slideChangeTransitionEnd(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
    },

    setTranslate(swiper) {
        // Swiper spamme setTranslate au layout : on ne passe en moving qu’après un “vrai” move
        if (!detectRealMove(swiper)) return;         // ← ignore tant que ça n’a pas vraiment bougé
        if (isBooting(swiper)) return;               // ← et ignore la fenêtre de boot
        containerEl.classList.add('is-moving');
        updateSlideStates(swiper, true);
    },

    transitionEnd(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
    }
    }


    };
    }

/**
 * Instancie tous les sliders dans `root` (document par défaut).
 * Retourne un tableau des instances.
 */
export function initSwiperSliders(root = document) {
  if (!window.Swiper) {
    console.warn('[swiper-slider] Swiper n’est pas chargé (window.Swiper introuvable).');
    return [];
    // Option: charger dynamiquement la lib ici si tu as un loader maison.
  }

  const instances = [];
  const containers = Array.from(root.querySelectorAll('.swiper-images'))
    .map(el => el.closest('.swiper') || el) // au cas où tu utilises le markup Swiper standard
    .filter(Boolean);

  containers.forEach(containerEl => {
    if (containerEl.hasAttribute('data-initialized')) return;

    // L’élément qui porte les slides doit être le wrapper .swiper-images (ou containerEl si c’est lui)
    const targetEl = containerEl.querySelector('.swiper-images') || containerEl;

    try {
      const options = buildOptions(containerEl);
      const instance = new window.Swiper(targetEl, options);

      containerEl.setAttribute('data-initialized', 'true');
      // Stocke l’instance pour debug/destroy
      containerEl._swiper = instance;

      instances.push(instance);
    } catch (err) {
      console.error('[swiper-slider] Échec d’instanciation:', err);
    }
  });

  return instances;
}

/**
 * Détruit proprement toutes les instances dans `root`.
 */
export function destroySwiperSliders(root = document) {
  const containers = root.querySelectorAll('[data-initialized][data-initialized="true"]');
  containers.forEach(containerEl => {
    const inst = containerEl._swiper;
    if (inst && typeof inst.destroy === 'function') {
      inst.destroy(true, true);
    }
    containerEl.removeAttribute('data-initialized');
    delete containerEl._swiper;
  });
}
