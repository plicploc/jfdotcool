/**
 * file: features/slider-embed-video.js
 * Gère l'intégration (embed) des vidéos YouTube dans les diapositives Swiper.
 * Utilise l'API YouTube IFrame Player pour un contrôle total.
 */

// Préfixe utilisé dans le texte alt pour identifier une vidéo YouTube
const VIDEO_ALT_PREFIX = 'video:';
const PLAYERS = {}; // Stockage des instances de lecteurs YouTube par ID de slide

/**
 * 1. CHARGEMENT DE L'API YOUTUBE
 * Cette fonction s'assure que l'API IFrame Player de YouTube est chargée
 * une seule fois.
 */
function loadYoutubeAPI() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // 1. Crée un élément <script>
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 2. Définit la fonction globale que l'API appellera une fois chargée
    window.onYouTubeIframeAPIReady = function() {
      resolve();
    };
  });
}

/**
 * 2. INSTANCIATION DU LECTEUR VIDÉO
 * Crée un lecteur vidéo YouTube avec des paramètres spécifiques pour
 * l'autoplay, la boucle et le masquage des contrôles/logos.
 * @param {HTMLElement} slideElement L'élément de la diapositive où intégrer la vidéo.
 * @param {string} videoId L'identifiant de la vidéo YouTube (ex: fRY1JPd2VWI).
 */
async function embedVideo(slideElement, videoId) {
  await loadYoutubeAPI(); // Assurez-vous que l'API est chargée

  // Crée un conteneur temporaire pour le lecteur
  const videoContainerId = `Youtubeer-${Date.now()}`;
  const videoContainer = document.createElement('div');
  videoContainer.id = videoContainerId;
  // Les classes 'w-full h-full absolute top-0 left-0' assurent que le conteneur prend la taille de la slide.
  videoContainer.classList.add('youtube-embed-container', 'w-full', 'h-full', 'absolute', 'top-0', 'left-0');
  
  // Masque l'image (thumbnail) et insère le conteneur vidéo
  const imageWrapper = slideElement.querySelector('.swiper-slide-image');
  if (imageWrapper) {
    imageWrapper.style.opacity = '0'; // Masque le thumbnail
    imageWrapper.style.transition = 'opacity 0.5s';
    imageWrapper.style.pointerEvents = 'none'; // Empêche l'interaction sur le thumbnail
  }

  slideElement.appendChild(videoContainer);

  const player = new window.YT.Player(videoContainerId, {
    // Ajout de width et height à 100% pour essayer de forcer l'adaptabilité
    width: '100%', 
    height: '100%', 
    videoId: videoId,
    playerVars: {
      // PARAMÈTRES REQUIS POUR LE "HACK" WEBFLOW/YOUTUBE:
      autoplay: 1,      // Démarrage automatique
      loop: 1,          // Lecture en boucle (nécessite 'playlist')
      playlist: videoId,// Pour activer la lecture en boucle
      controls: 0,      // Cache les contrôles du lecteur
      iv_load_policy: 3,// Cache les annotations/cartes de la vidéo
      // *** Paramètres anti-interface :
      showinfo: 0,      // Cache le titre de la vidéo/logo
      autohide: 1,      // Cache les contrôles pendant la lecture (obsolète mais peut aider)
      modestbranding: 1,// Masque le logo YouTube (le moins possible)
      rel: 0,           // Supprime les suggestions de vidéos à la fin
      disablekb: 1,     // Désactive les contrôles clavier
      fs: 0,            // Désactive le mode plein écran (optionnel)
      mute: 1           // Couper le son (souvent nécessaire pour l'autoplay sur mobile)
    },
    events: {
      onReady: (event) => {
        // ** LOGIQUE CLÉ POUR LE RESPONSIVE **
        const iframe = videoContainer.querySelector('iframe');
        if (iframe) {
            iframe.removeAttribute('width');
            iframe.removeAttribute('height');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            
            // Fixe le problème de survol au début/fin de boucle
            // L'ajout de 'pointer-events: none;' sur l'iframe devrait être neutralisé
            // par notre overlay.

            // *** AJOUT DU BOUCLIER ANTI-SURVOL ***
            // Crée un div transparent absolu au-dessus de l'iframe pour intercepter les événements souris
            const overlay = document.createElement('div');
            overlay.classList.add('youtube-iframe-overlay', 'w-full', 'h-full', 'absolute', 'top-0', 'left-0');
            
            // ** Augmentation du z-index ** pour être sûr de couvrir l'interface YT.
            overlay.style.zIndex = '99'; // Très élevé pour être au-dessus des éléments YT internes
            // Important : L'overlay doit intercepter les événements sans les consommer
            // L'absence de style de fond le rend transparent, mais il intercepte les clics/survols.
            
            videoContainer.appendChild(overlay);
        }
        
        // Le lecteur est prêt, nous pouvons nous assurer de l'autoplay et de la boucle
        event.target.mute(); // Assure que c'est muet (important pour l'autoplay)
        event.target.playVideo();
      },
      onStateChange: (event) => {
        // Redémarre la vidéo si elle est terminée (pour la boucle)
        if (event.data === window.YT.PlayerState.ENDED) {
          event.target.playVideo();
        }
      }
    }
  });

  // Stocke le lecteur pour pouvoir le détruire plus tard
  PLAYERS[slideElement.id] = player;
}

/**
 * 3. DÉSINSTATIATION DU LECTEUR VIDÉO
 * Détruit le lecteur YouTube et nettoie le DOM.
 * @param {HTMLElement} slideElement L'élément de la diapositive.
 */
function destroyVideo(slideElement) {
  const slideId = slideElement.id;
  const player = PLAYERS[slideId];

  if (player) {
    player.destroy(); // Détruit l'instance YT Player
    delete PLAYERS[slideId]; // Supprime de notre stockage
  }

  // Supprime le conteneur vidéo du DOM
  const videoContainer = slideElement.querySelector('.youtube-embed-container');
  if (videoContainer) {
    videoContainer.remove();
  }

  // Réaffiche le thumbnail
  const imageWrapper = slideElement.querySelector('.swiper-slide-image');
  if (imageWrapper) {
    imageWrapper.style.opacity = '1';
    imageWrapper.style.pointerEvents = 'auto';
  }
}

/**
 * 4. FONCTION UTILITAIRE POUR VÉRIFIER L'ALT TEXT
 * @param {HTMLElement} slideElement 
 * @returns {string|null} L'ID de la vidéo s'il est trouvé, sinon null.
 */
function getVideoIdFromSlide(slideElement) {
  const img = 
    slideElement.querySelector('.swiper-slide-image img') ||
    slideElement.querySelector('img.swiper-slide-image') ||
    slideElement.querySelector('.swiper-slide-image');

  let altText = '';
  if (img && typeof img.getAttribute === 'function') {
    altText = (img.getAttribute('alt') || '').trim();
  }

  if (altText.startsWith(VIDEO_ALT_PREFIX)) {
    return altText.substring(VIDEO_ALT_PREFIX.length).trim();
  }
  return null;
}

/**
 * 5. EXPORTATION DES FONCTIONS PUBLIQUES
 */
export { embedVideo, destroyVideo, getVideoIdFromSlide };