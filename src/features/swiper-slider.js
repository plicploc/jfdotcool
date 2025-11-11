/**
 * file: features/swiper-slider.js
 * Swiper slider feature
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
  

  captionEl.textContent = altText;
}

function getActiveCaptionEl(containerEl) {
  return containerEl.querySelector('.swiper-slide.swiper-slide-active .txt-slide');
}

function hideAllCaptions(containerEl) {
  containerEl.querySelectorAll('.swiper-slide .txt-slide').forEach(el => el.classList.add('info-hidden'));
}

function showActiveCaption(containerEl) {
  const el = getActiveCaptionEl(containerEl);
  if (el) {
    if (el.textContent && el.textContent.trim().length > 0) {
      el.classList.remove('info-hidden');
    } else {
      el.classList.add('info-hidden');
    }
  }
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

function getNativeStateForSlide(slide) {
  const C = slide.classList;
  if (C.contains('swiper-slide-active') || C.contains('swiper-slide-duplicate-active')) return 'active';
  if (C.contains('swiper-slide-prev')   || C.contains('swiper-slide-duplicate-prev'))   return 'prev';
  if (C.contains('swiper-slide-next')   || C.contains('swiper-slide-duplicate-next'))   return 'next';
  if (C.contains('swiper-slide-visible') || C.contains('swiper-slide-fully-visible'))   return 'visible';
  return 'inactive';
}

function updateSlideStates(swiper, moving = false) {
  swiper.slides.forEach((slide) => {
    const state = getNativeStateForSlide(slide);
    slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-visible', 'is-inactive');
    slide.classList.add(
      state === 'active'   ? 'is-active'   :
      state === 'prev'     ? 'is-prev'     :
      state === 'next'     ? 'is-next'     :
      state === 'visible'  ? 'is-visible'  : 'inactive'
    );
    fillSlideCaptionFromAlt(slide);
    const cap = slide.querySelector('.txt-slide');
    if (cap) {
      if (
        swiper.el.classList.contains('is-moving') ||
        !slide.classList.contains('is-active')
      ) {
        cap.classList.add('info-hidden');
      }
    }
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
  const nav = containerEl.querySelector('.swiper-navigation');
  const nextEl = nav?.querySelector('.is-next') || containerEl.querySelector('.is-next');
  const prevEl = nav?.querySelector('.is-prev') || containerEl.querySelector('.is-prev');

  function attachPointerActivity() {
    if (containerEl.__pointerHandlerAttached) return;
    const onPointerMove = () => {
      showActiveCaption(containerEl);
      if (containerEl.__captionHideTO) { clearTimeout(containerEl.__captionHideTO); containerEl.__captionHideTO = null; }
      if (containerEl.__activityTO) clearTimeout(containerEl.__activityTO);
      containerEl.__activityTO = setTimeout(() => {
        hideActiveCaption(containerEl);
        containerEl.__activityTO = null;
      }, 3000);
    };
    containerEl.__onPointerMove = onPointerMove;
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
    grabCursor: false,
    centeredSlides: true,
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    effect: 'creative',
    speed: 600,
    creativeEffect: {
      prev: { shadow: false, origin: 'left center', translate: ['-20%', 0, -20], rotate: [0, 50, 0] },
      next: { shadow: false, origin: 'right center', translate: ['20%', 0, -20], rotate: [0, -50, 0] },
    },
    navigation: {
      nextEl: nextEl || '.swiper-navigation .is-next',
      prevEl: prevEl || '.swiper-navigation .is-prev',
    },
    on: {
      init(swiper) {
        markBoot(swiper);
        containerEl.classList.remove('is-moving');
        hideAllCaptions(containerEl);
        updateSlideStates(swiper, false);
        showActiveCaption(containerEl);
        scheduleAutoHide(containerEl, 15000);
        attachPointerActivity();
      },
      slideChangeTransitionStart(swiper) {
        if (isBooting(swiper) && !swiper.__didRealMove) return;
        containerEl.classList.add('is-moving');
        clearCaptionTimers(containerEl);
        hideAllCaptions(containerEl);
        updateSlideStates(swiper, true);
      },
      slideChangeTransitionEnd(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        hideAllCaptions(containerEl);
        showActiveCaption(containerEl);
        scheduleAutoHide(containerEl, 3000);
      },
      setTranslate(swiper) {
       if (containerEl.__resizing) return;
        if (!detectRealMove(swiper)) return;
        if (isBooting(swiper)) return;
        containerEl.classList.add('is-moving');
        updateSlideStates(swiper, true);
      },
      transitionEnd(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
      },
     update(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        hideAllCaptions(containerEl);
        showActiveCaption(containerEl);
      },
      resize(swiper) {
        containerEl.__resizing = true;
        clearCaptionTimers(containerEl);
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        hideAllCaptions(containerEl);
        showActiveCaption(containerEl);
        clearTimeout(containerEl.__resizeTO);
        containerEl.__resizeTO = setTimeout(() => {
          containerEl.__resizing = false;
          containerEl.classList.remove('is-moving');
          updateSlideStates(swiper, false);
          hideAllCaptions(containerEl);
          showActiveCaption(containerEl);
        }, 150);
      },
      beforeDestroy(swiper) {
        clearCaptionTimers(containerEl);
        detachPointerActivity();
        clearTimeout(containerEl.__resizeTO);
        containerEl.__resizeTO = null;
        containerEl.__resizing = false;
      }
    }
  };
}

/**
 * VERSION CORRIGÉE de initSwiperSliders
 * Initialise tous les sliders d'images trouvés.
 */
export function initSwiperSliders(root = document) {
  if (!window.Swiper) {
    console.warn('[swiper-slider] Swiper n’est pas chargé (window.Swiper introuvable).');
    return [];
  }
  const instances = [];
  
  // MODIFICATION: On sélectionne les '.swiper' qui NE SONT PAS '.swiper-testi'
  const containers = Array.from(root.querySelectorAll('.swiper:not(.swiper-testi)'))
    .filter(Boolean); // Filtre au cas où

  containers.forEach(containerEl => {
    if (containerEl.hasAttribute('data-initialized')) return;
    
    // VÉRIFICATION: On s'assure que c'est bien un slider d'images
    // Il doit contenir '.swiper-images' pour être valide
    const imagesEl = containerEl.querySelector('.swiper-images');
    if (!imagesEl && !containerEl.classList.contains('swiper-images')) {
      return; // Ce n'est pas un slider d'images, on l'ignore.
    }

    // Cible '.swiper-images' si trouvé, sinon le conteneur principal
    const targetEl = imagesEl || containerEl; 
    
    try {
      const options = buildOptions(containerEl);
      const instance = new window.Swiper(targetEl, options);
      containerEl.setAttribute('data-initialized', 'true');
      containerEl._swiper = instance;
      instances.push(instance);
    } catch (err) {
      console.error('[swiper-slider] Échec d’instanciation:', err, containerEl);
    }
  });
  return instances;
}

/**
 * Détruit tous les sliders d'images initialisés.
 */
export function destroySwiperSliders(root = document) {
  const containers = root.querySelectorAll('.swiper[data-initialized="true"]:not(.swiper-testi)');
  
  containers.forEach(containerEl => {
    const inst = containerEl._swiper;
    if (inst && typeof inst.destroy === 'function') {
      inst.destroy(true, true);
    }
    
    // Nettoyage des timers et écouteurs
    clearCaptionTimers(containerEl);
    if (containerEl.__pointerHandlerAttached) {
      containerEl.removeEventListener('pointermove', containerEl.__onPointerMove);
      containerEl.removeEventListener('touchstart', containerEl.__onPointerMove);
      containerEl.__pointerHandlerAttached = false;
      containerEl.__onPointerMove = null;
    }
    
    // Nettoyage des timers de redimensionnement
    clearTimeout(containerEl.__resizeTO);
    containerEl.__resizeTO = null;
    containerEl.__resizing = false;

    containerEl.removeAttribute('data-initialized');
    delete containerEl._swiper;
  });
}

