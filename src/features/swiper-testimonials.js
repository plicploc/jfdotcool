/**
 * file: features/swiper-testimonials.js
 * Swiper slider feature for testimonials
 */

// ------------------------------------------------------------------
// FONCTIONS UTILITAIRES (COPIÉES DE SWIPER-SLIDER.JS, SANS LES CAPTIONS)
// ------------------------------------------------------------------

function getNativeStateForSlide(slide) {
  const C = slide.classList;
  if (C.contains('swiper-slide-active') || C.contains('swiper-slide-duplicate-active')) return 'active';
  if (C.contains('swiper-slide-prev')   || C.contains('swiper-slide-duplicate-prev'))   return 'prev';
  if (C.contains('swiper-slide-next')   || C.contains('swiper-slide-duplicate-next'))   return 'next';
  if (C.contains('swiper-slide-visible') || C.contains('swiper-slide-fully-visible'))   return 'visible';
  return 'inactive';
}

function updateSlideStates(swiper, moving = false) {
  // On utilise les classes personnalisées définies dans les options
  const slideClass = swiper.params.slideClass || 'swiper-slide';
  
  swiper.slides.forEach((slide) => {
    // S'assurer que la slide a la bonne classe de base (ex: 'testi-item')
    if (!slide.classList.contains(slideClass)) return; 
    
    const state = getNativeStateForSlide(slide);
    slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-visible', 'is-inactive');
    slide.classList.add(
      state === 'active'   ? 'is-active'   :
      state === 'prev'     ? 'is-prev'     :
      state === 'next'     ? 'is-next'     :
      state === 'visible'  ? 'is-visible'  : 'inactive'
    );
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

// ------------------------------------------------------------------
// OPTIONS ET INITIALISATION
// ------------------------------------------------------------------

function buildOptions(containerEl) {
  const nav = containerEl.querySelector('.swiper-navigation');
  const nextEl = nav?.querySelector('.is-next') || containerEl.querySelector('.is-next');
  const prevEl = nav?.querySelector('.is-prev') || containerEl.querySelector('.is-prev');

  return {
    // Classes personnalisées
    wrapperClass: 'testi-wrapper',
    slideClass: 'testi-item',

    grabCursor: false,
    centeredSlides: true,
    loop: false,
    spaceBetween: 0,
    
    speed: 600,
    slidesPerView: "auto",
    navigation: {
      nextEl: nextEl || '.swiper-testi-navigation .is-next',
      prevEl: prevEl || '.swiper-testi-navigation .is-prev',
    },
    on: {
      init(swiper) {
        markBoot(swiper);
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
      },
      slideChangeTransitionStart(swiper) {
        if (isBooting(swiper) && !swiper.__didRealMove) return;
        containerEl.classList.add('is-moving');
        updateSlideStates(swiper, true);
      },
      slideChangeTransitionEnd(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
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
      },
      resize(swiper) {
        containerEl.__resizing = true;
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        clearTimeout(containerEl.__resizeTO);
        containerEl.__resizeTO = setTimeout(() => {
          containerEl.__resizing = false;
          containerEl.classList.remove('is-moving');
          updateSlideStates(swiper, false);
        }, 150);
      },
      beforeDestroy(swiper) {
        clearTimeout(containerEl.__resizeTO);
        containerEl.__resizeTO = null;
        containerEl.__resizing = false;
      }
    }
  };
}

/**
 * Initialise tous les sliders de témoignages trouvés.
 */
export function initSwiperTestimonials(root = document) {
  if (!window.Swiper) {
    console.warn('[swiper-testimonials] Swiper n’est pas chargé (window.Swiper introuvable).');
    return [];
  }
  const instances = [];
  
  // On sélectionne le conteneur principal '.swiper-testi'
  const containers = Array.from(root.querySelectorAll('.swiper-testi'));

  containers.forEach(containerEl => {
    // On utilise un attribut unique pour éviter les conflits
    if (containerEl.hasAttribute('data-initialized-testi')) {
      return;
    }

    // VÉRIFICATION : On s'assure que le wrapper est bien présent
    const wrapperEl = containerEl.querySelector('.testi-wrapper');
    if (!wrapperEl) {
      console.warn('[swiper-testimonials] Init annulée: .swiper-testi trouvé, mais .testi-wrapper manquant à l\'intérieur.', containerEl);
      return; 
    }
    
    // L'élément cible pour new Swiper() EST le containerEl lui-même
    const targetEl = containerEl; 
    
    try {
      const options = buildOptions(containerEl); // buildOptions ajoute wrapperClass/slideClass
      const instance = new window.Swiper(targetEl, options); // On init sur le conteneur
      
      containerEl.setAttribute('data-initialized-testi', 'true'); // Attribut unique
      containerEl._swiperTestimonial = instance; // Propriété unique
      instances.push(instance);
    } catch (err) {
      console.error('[swiper-testimonials] Échec d’instanciation:', err, containerEl);
    }
  });
  return instances;
}

/**
 * Détruit tous les sliders de témoignages initialisés.
 */
export function destroySwiperTestimonials(root = document) {
  // On cible l'attribut unique
  const containers = root.querySelectorAll('.swiper-testi[data-initialized-testi="true"]');
  
  containers.forEach(containerEl => {
    // On utilise la propriété unique
    const inst = containerEl._swiperTestimonial; 
    if (inst && typeof inst.destroy === 'function') {
      inst.destroy(true, true);
    }
    
    clearTimeout(containerEl.__resizeTO);
    containerEl.removeAttribute('data-initialized-testi'); // Attribut unique
    delete containerEl._swiperTestimonial; // Propriété unique
  });
}

