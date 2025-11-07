/**
 * file: features/swiper-testimonials.js
 * Swiper slider feature for testimonials
 */

// ------------------------------------------------------------------
// FONCTIONS UTILITAIRES
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
  const slideClass = swiper.params.slideClass || 'swiper-slide';
  swiper.slides.forEach((slide) => {
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

// --- NOUVELLE FONCTION ---
/**
 * Vérifie le nombre de slides réelles et masque la navigation si <= 1.
 * Désactive également Swiper si <= 1.
 * Gère l'attribut data-cursor si > 2.
 */
function checkSlideCountAndToggleNav(swiper) {
  if (!swiper || swiper.destroyed) return;
  
  // Compte les slides réelles (excluant les duplicata de la boucle)
  const realSlideCount = swiper.slides.filter(slide => !slide.classList.contains('swiper-slide-duplicate')).length;
  const navigationEl = swiper.el.querySelector('.swiper-testi-navigation');
  const containerEl = swiper.el; // Le conteneur .swiper-testi

  if (navigationEl) {
    if (realSlideCount <= 1) {
      navigationEl.style.display = 'none';
    } else {
      navigationEl.style.display = ''; // Rétablit l'affichage par défaut
    }
  }
  
  // Désactive/Réactive Swiper
  if (realSlideCount <= 1) {
    swiper.disable();
  } else {
    swiper.enable();
  }

  // --- AJOUT : LOGIQUE DU CURSEUR ---
  // "plus de deux" = 3 ou plus
  if (realSlideCount > 2) {
    containerEl.setAttribute('data-cursor', 'drag-slide'); // Ajoute l'attribut
  } else {
    containerEl.removeAttribute('data-cursor'); // Retire l'attribut
  }
  // --- FIN AJOUT ---
}
// --- FIN NOUVELLE FONCTION ---


// ------------------------------------------------------------------
// OPTIONS ET INITIALISATION
// ------------------------------------------------------------------

function buildOptions(containerEl) {
  const nav = containerEl.querySelector('.swiper-testi-navigation'); // Cible la classe correcte
  const nextEl = nav?.querySelector('.is-next') || containerEl.querySelector('.is-next');
  const prevEl = nav?.querySelector('.is-prev') || containerEl.querySelector('.is-prev');

  return {
    // Classes personnalisées
    wrapperClass: 'testi-wrapper',
    slideClass: 'testi-item',

    grabCursor: false,
    centeredSlides: true,
    loop: false, // Doit être false pour que la logique de comptage soit simple
    spaceBetween: 0,
    speed: 600,
    slidesPerView: "auto", // Garde le 'auto' de votre fichier
    
    navigation: {
      nextEl: nextEl || '.swiper-testi-navigation .is-next',
      prevEl: prevEl || '.swiper-testi-navigation .is-prev',
      // --- AJOUT ---
      // Swiper ajoutera cette classe aux flèches
      // (sur .is-prev au début, sur .is-next à la fin)
      // car loop: false est activé.
      disabledClass: 'is-disabled',
      // --- FIN AJOUT ---
    },
    on: {
      // --- MODIFICATIONS ---
      // On attache notre nouvelle fonction aux événements clés
      init(swiper) {
        markBoot(swiper);
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        checkSlideCountAndToggleNav(swiper); // Appel ici
      },
      update(swiper) {
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        checkSlideCountAndToggleNav(swiper); // Appel ici
      },
      resize(swiper) {
        containerEl.__resizing = true;
        containerEl.classList.remove('is-moving');
        updateSlideStates(swiper, false);
        checkSlideCountAndToggleNav(swiper); // Appel ici
        
        clearTimeout(containerEl.__resizeTO);
        containerEl.__resizeTO = setTimeout(() => {
          containerEl.__resizing = false;
          containerEl.classList.remove('is-moving');
          updateSlideStates(swiper, false);
        }, 150);
      },
      // --- FIN MODIFICATIONS ---
      
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
  
  const containers = Array.from(root.querySelectorAll('.swiper-testi'));

  containers.forEach(containerEl => {
    if (containerEl.hasAttribute('data-initialized-testi')) {
      return;
    }

    const wrapperEl = containerEl.querySelector('.testi-wrapper');
    if (!wrapperEl) {
      console.warn('[swiper-testimonials] Init annulée: .swiper-testi trouvé, mais .testi-wrapper manquant à l\'intérieur.', containerEl);
      return; 
    }
    
    // --- AJOUT DE LA VÉRIFICATION AVANT INIT ---
    // Pour masquer la nav même si Swiper ne s'initialise pas
    const slideItems = wrapperEl.querySelectorAll('.testi-item');
    const navigationEl = containerEl.querySelector('.swiper-testi-navigation');
    
    if (navigationEl && slideItems.length <= 1) {
       navigationEl.style.display = 'none';
    }
    
    // --- AJOUT : LOGIQUE CURSEUR (PRE-INIT) ---
    // "plus de deux" = 3 ou plus
    if (slideItems.length > 2) {
      containerEl.setAttribute('data-cursor', 'drag-slide');
    } else {
      containerEl.removeAttribute('data-cursor');
    }
    // --- FIN AJOUT ---

    const targetEl = containerEl; 
    
    try {
      const options = buildOptions(containerEl);
      const instance = new window.Swiper(targetEl, options);
      
      containerEl.setAttribute('data-initialized-testi', 'true');
      containerEl._swiperTestimonial = instance;
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
  const containers = root.querySelectorAll('.swiper-testi[data-initialized-testi="true"]');
  
  containers.forEach(containerEl => {
    const inst = containerEl._swiperTestimonial; 
    if (inst && typeof inst.destroy === 'function') {
      inst.destroy(true, true);
    }
    
    // Réaffiche la nav au cas où
    const navigationEl = containerEl.querySelector('.swiper-testi-navigation');
    if (navigationEl) {
      navigationEl.style.display = '';
    }

    // --- AJOUT : Nettoyage du curseur ---
    containerEl.removeAttribute('data-cursor');
    // --- FIN AJOUT ---

    clearTimeout(containerEl.__resizeTO);
    containerEl.removeAttribute('data-initialized-testi');
    delete containerEl._swiperTestimonial;
  });
}