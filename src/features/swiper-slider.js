/**
 * file: features/swiper-slider.js
 * Swiper slider feature
 */

// Importe les fonctions d'intégration vidéo
import { embedVideo, destroyVideo, getVideoIdFromSlide } from './slider-embed-video.js';

/**
 * Récupère le texte 'alt' de l'image de la diapositive et l'insère
 * comme contenu texte dans l'élément de légende (.txt-slide).
 * @param {HTMLElement} slide L'élément de la diapositive Swiper.
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
    // 3. Récupère la valeur de l'attribut 'alt' de l'image
    altText = (img.getAttribute('alt') || '').trim();
  }
  
  // 4. Définit le contenu de l'élément de légende avec le texte 'alt'. 
  // NOTE: Même si l'alt contient "video:...", il est utilisé ici pour la légende texte.
  // Cependant, nous pourrions vouloir le nettoyer pour la légende, mais pour l'instant, 
  // nous laissons l'alt complet pour la compatibilité avec la légende d'origine.
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
  let slideIndex = 0;
  swiper.slides.forEach((slide) => {
    // Assure un ID unique pour l'intégration/désintégration de la vidéo
    if (!slide.id) {
        slide.id = `swiper-slide-${swiper.el.dataset.swiperId || 'default'}-${slideIndex++}`;
    }

    const state = getNativeStateForSlide(slide);
    slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-visible', 'is-inactive');
    slide.classList.add(
      state === 'active'   ? 'is-active'   :
      state === 'prev'     ? 'is-prev'     :
      state === 'next'     ? 'is-next'     :
      state === 'visible'  ? 'is-visible'  : 'inactive'
    );
    // Remplissage de la légende (.txt-slide) avec le texte 'alt'
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
        
        // ** Vidéo **: Tente de charger la vidéo sur la slide initiale active
        const activeSlide = swiper.slides[swiper.activeIndex];
        const videoId = getVideoIdFromSlide(activeSlide);
        if (videoId) {
            embedVideo(activeSlide, videoId);
        }
      },
      slideChangeTransitionStart(swiper) {
        if (isBooting(swiper) && !swiper.__didRealMove) return;
        containerEl.classList.add('is-moving');
        clearCaptionTimers(containerEl);
        hideAllCaptions(containerEl);
        updateSlideStates(swiper, true);

        // ** Vidéo **: Désintègre la vidéo de l'ancienne slide active dès le début du mouvement
        const previousSlide = swiper.slides[swiper.previousIndex];
        if (getVideoIdFromSlide(previousSlide)) {
             destroyVideo(previousSlide);
        }
      },
      slideChangeTransitionEnd(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        hideAllCaptions(containerEl);
        showActiveCaption(containerEl);
        scheduleAutoHide(containerEl, 3000);

        // ** Vidéo **: Intègre la vidéo dans la nouvelle slide active APRÈS la fin de la transition
        const activeSlide = swiper.slides[swiper.activeIndex];
        const videoId = getVideoIdFromSlide(activeSlide);
        if (videoId) {
            embedVideo(activeSlide, videoId);
        }
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

        // ** Vidéo **: Détruit la vidéo de toutes les slides lors de la destruction du swiper
        swiper.slides.forEach(slide => destroyVideo(slide));
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

  containers.forEach((containerEl, index) => {
    if (containerEl.hasAttribute('data-initialized')) return;
    
    // Ajoute un ID pour gérer les vidéos dans un contexte multi-swiper
    containerEl.dataset.swiperId = index;

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
      // Le hook beforeDestroy s'occupe de détruire les vidéos
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