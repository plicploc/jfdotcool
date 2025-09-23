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
function fillSlideCaptionFromAlt(slide) {
  if (!slide) return;
  const captionEl = slide.querySelector('.txt-slide');
  if (!captionEl) return;
  const img =
    slide.querySelector('.swiper-slide-image img') ||
    slide.querySelector('img.swiper-slide-image') ||
    slide.querySelector('.swiper-slide-image');
  let altText = '';
  if (img && typeof img.getAttribute === 'function') {
    altText = (img.getAttribute('alt') || '').trim();
  }
  if (altText) {
    captionEl.textContent = altText;
  }
}

/* -----------------------------
   Helpers d’affichage légende
--------------------------------*/
function getActiveCaptionEl(containerEl) {
  return containerEl.querySelector('.swiper-slide.swiper-slide-active .txt-slide');
}

function hideAllCaptions(containerEl) {
  containerEl.querySelectorAll('.swiper-slide .txt-slide').forEach(el => el.classList.add('info-hidden'));
}

function showActiveCaption(containerEl) {
  const el = getActiveCaptionEl(containerEl);
  if (el) el.classList.remove('info-hidden');
}

function hideActiveCaption(containerEl) {
  const el = getActiveCaptionEl(containerEl);
  if (el) el.classList.add('info-hidden');
}

function clearCaptionTimers(containerEl) {
  if (containerEl.__captionHideTO) { clearTimeout(containerEl.__captionHideTO); containerEl.__captionHideTO = null; }
  if (containerEl.__activityTO)    { clearTimeout(containerEl.__activityTO);    containerEl.__activityTO = null; }
}

function scheduleAutoHide(containerEl, delay = 3000) {
  if (containerEl.__captionHideTO) clearTimeout(containerEl.__captionHideTO);
  containerEl.__captionHideTO = setTimeout(() => {
    hideActiveCaption(containerEl);
    containerEl.__captionHideTO = null;
  }, delay);
}

/* --------------------------------
   Logique d’état des slides
---------------------------------*/
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

    // Alimente la légende depuis l'alt si présent
    fillSlideCaptionFromAlt(slide);

    // Par défaut, on s'assure que TOUTES les captions sont masquées…
    const cap = slide.querySelector('.txt-slide');
        if (cap) {
      if (
        swiper.el.classList.contains('is-moving') || // en mouvement
        !slide.classList.contains('is-active')      // ou pas active
      ) {
        cap.classList.add('info-hidden');
      }
      // Sinon, c'est le cycle de timers (init, activité, auto-hide) qui décide
    }
  });
}

/* --------------------------------
   Boot & mouvement réel
---------------------------------*/
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

/* --------------------------------
   Options Swiper + événements
---------------------------------*/
function buildOptions(containerEl) {
  // Navigation scoped au container le plus proche (meilleure isolation quand plusieurs sliders)
  const nav = containerEl.querySelector('.swiper-navigation');
  const nextEl = nav?.querySelector('.is-next') || containerEl.querySelector('.is-next');
  const prevEl = nav?.querySelector('.is-prev') || containerEl.querySelector('.is-prev');

  // Gestion des listeners pointeur pour l’activité sur le container
  function attachPointerActivity() {
    if (containerEl.__pointerHandlerAttached) return;
    const onPointerMove = () => {
      // Sur activité: on montre la caption active et on lance un timer d’inactivité
      showActiveCaption(containerEl);
      // Ce cycle "inactivité" surpasse l'autohide court ; on annule l'autohide courant
      if (containerEl.__captionHideTO) { clearTimeout(containerEl.__captionHideTO); containerEl.__captionHideTO = null; }
      if (containerEl.__activityTO) clearTimeout(containerEl.__activityTO);
      containerEl.__activityTO = setTimeout(() => {
        hideActiveCaption(containerEl);
        containerEl.__activityTO = null;
      }, 3000);
    };
    containerEl.__onPointerMove = onPointerMove;
    // pointermove couvre souris + stylet + tactile (selon navigateur); on ajoute aussi touchstart pour fiabilité mobile
    containerEl.addEventListener('pointermove', onPointerMove, { passive: true });
    containerEl.addEventListener('touchstart', onPointerMove, { passive: true });
    containerEl.__pointerHandlerAttached = true;
  }

  function detachPointerActivity() {
    if (!containerEl.__pointerHandlerAttached) return;
    containerEl.removeEventListener('pointermove', containerEl.__onPointerMove);
    containerEl.removeEventListener('touchstart', containerEl.__onPointerMove);
    containerEl.__pointerHandlerAttached = false;
    containerEl.__onPointerMove = null;
  }

  return {
    grabCursor: true,
    centeredSlides: true,
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    effect: 'creative',
    speed: 600,
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
        markBoot(swiper);
        containerEl.classList.remove('is-moving');

        // 1) États + alt -> caption
        updateSlideStates(swiper, false);

        // 2) Par défaut, cacher toutes les captions puis montrer celle de la slide active 3s
        hideAllCaptions(containerEl);
        showActiveCaption(containerEl);
        scheduleAutoHide(containerEl, 15000);

        // 3) Pointeur actif sur le container
        attachPointerActivity();
      },

      slideChangeTransitionStart(swiper) {
        // Ignore la 1ère transition “fantôme” au boot
        if (isBooting(swiper) && !swiper.__didRealMove) return;
        containerEl.classList.add('is-moving');

        // La slide active devient inactive → on remasque tout de suite
        clearCaptionTimers(containerEl);
        hideAllCaptions(containerEl);

        updateSlideStates(swiper, true);
      },

      slideChangeTransitionEnd(swiper) {
        containerEl.classList.remove('is-moving');

        // Nouvelle slide active : montrer puis auto-masquer après 3s
        updateSlideStates(swiper, false);
        hideAllCaptions(containerEl);
        showActiveCaption(containerEl);
        scheduleAutoHide(containerEl, 3000);
      },

      setTranslate(swiper) {
        // Swiper spamme setTranslate au layout : on ne passe en moving qu’après un “vrai” move
        if (!detectRealMove(swiper)) return;
        if (isBooting(swiper)) return;
        containerEl.classList.add('is-moving');
        updateSlideStates(swiper, true);
      },

      transitionEnd(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
      },

      // Nettoyage si Swiper détruit l’instance via API
      beforeDestroy(swiper) {
        clearCaptionTimers(containerEl);
        // détacher les listeners pointeur
        if (containerEl.__pointerHandlerAttached) {
          containerEl.removeEventListener('pointermove', containerEl.__onPointerMove);
          containerEl.removeEventListener('touchstart', containerEl.__onPointerMove);
          containerEl.__pointerHandlerAttached = false;
          containerEl.__onPointerMove = null;
        }
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
    // Nettoyage timers + listeners
    clearCaptionTimers(containerEl);
    if (containerEl.__pointerHandlerAttached) {
      containerEl.removeEventListener('pointermove', containerEl.__onPointerMove);
      containerEl.removeEventListener('touchstart', containerEl.__onPointerMove);
      containerEl.__pointerHandlerAttached = false;
      containerEl.__onPointerMove = null;
    }
    containerEl.removeAttribute('data-initialized');
    delete containerEl._swiper;
  });
}
