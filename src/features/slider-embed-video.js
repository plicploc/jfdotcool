/**
 * file: features/slider-embed-video.js
 * Gère l'intégration (embed) des vidéos YouTube dans les diapositives Swiper et en mode Background.
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
 * 2. INSTANCIATION DU LECTEUR VIDÉO (UTILISÉ PAR SWIPER)
 * Crée un lecteur vidéo YouTube avec des paramètres spécifiques, et le rend
 * NON-INTERACTIF (pointer-events: none) pour masquer définitivement l'interface de survol.
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
    width: '100%', 
    height: '100%', 
    videoId: videoId,
    playerVars: {
      // PARAMÈTRES ANTI-INTERFACE (contrôles, logo, suggestions, etc.)
      autoplay: 1,      
      loop: 1,          
      playlist: videoId,
      controls: 0,      
      iv_load_policy: 3,
      showinfo: 0,      
      autohide: 1,      
      modestbranding: 1,
      rel: 0,           
      disablekb: 1,     
      fs: 0,            
      mute: 1,          
      // ** FIX iOS/Safari **: Force la lecture dans la fenêtre sans passer en plein écran
      playsinline: 1    
    },
    events: {
      onReady: (event) => {
        const iframe = videoContainer.querySelector('iframe');
        if (iframe) {
            iframe.removeAttribute('width');
            iframe.removeAttribute('height');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            
            // FIX DÉFINITIF POUR L'INTERFACE (mode non-interactif)
            iframe.style.pointerEvents = 'none';

            // ** FIX iOS/Safari **: Ajoute l'attribut playsinline à l'iframe directement
            iframe.setAttribute('playsinline', '1');
        }
        
        // 1. Assure que le son est coupé (crucial pour l'autoplay sur mobile)
        event.target.mute(); 

        // 2. Tente de démarrer la vidéo. 
        // Sur iOS, parfois l'appel playVideo() fonctionne mieux s'il est un peu retardé,
        // ou s'il est relancé dans un état "prêt".
        event.target.playVideo();
      },
      onStateChange: (event) => {
        // -1: non démarré (unstarted), 0: terminée (ended), 1: en lecture (playing), 
        // 2: en pause (paused), 3: en mémoire tampon (buffering), 5: mise en file d'attente (cued)
        
        // ** NOUVEAU FIX iOS/Safari **
        // Si la vidéo est en file d'attente (cued) ou non démarrée, on la force à jouer APRES le mute
        if (event.data === window.YT.PlayerState.CUED || event.data === -1) {
             // Vérifie si la vidéo n'est pas déjà muette et la coupe à nouveau
             if (!event.target.isMuted()) {
                 event.target.mute();
             }
             // Tente de jouer à nouveau
             event.target.playVideo();
        }

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
    // Rétablit pointer-events avant destruction (par sécurité)
    const iframe = slideElement.querySelector('.youtube-embed-container iframe');
    if (iframe) {
        iframe.style.pointerEvents = 'auto'; 
    }
    
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
 * 5. NOUVELLE FONCTION: INITIALISATION D'UNE VIDÉO DE FOND STATIQUE
 *
 * Cette fonction permet d'utiliser la logique d'embed pour n'importe quel bloc.
 * Le bloc cible doit avoir la classe 'video-background-block' et un 'data-videoid'.
 * Ex: <div class="video-background-block" data-videoid="ID_YOUTUBE_ICI">...</div>
 * @param {HTMLElement} targetBlock L'élément où injecter la vidéo.
 */
function initBackgroundVideo(targetBlock) {
    const videoId = targetBlock.dataset.videoid;
    if (!videoId) return;

    // Assure que le conteneur peut positionner l'embed en absolu
    targetBlock.style.position = targetBlock.style.position || 'relative';

    // Crée un conteneur pour le lecteur
    const videoContainerId = `BackgroundYT-${Date.now()}`;
    const videoContainer = document.createElement('div');
    videoContainer.id = videoContainerId;
    
    // Le conteneur doit être sous les autres éléments du bloc
    videoContainer.style.zIndex = '-1'; 
    videoContainer.classList.add('youtube-background-embed', 'w-full', 'h-full', 'absolute', 'top-0', 'left-0');
    
    targetBlock.prepend(videoContainer); // Ajout en début de bloc pour qu'il soit derrière

    // Démarrage de l'embed
    loadYoutubeAPI().then(() => {
        new window.YT.Player(videoContainerId, {
            width: '100%', 
            height: '100%', 
            videoId: videoId,
            playerVars: {
                // Background video parameters (mêmes que Swiper)
                autoplay: 1, loop: 1, playlist: videoId, controls: 0, iv_load_policy: 3, 
                showinfo: 0, autohide: 1, modestbranding: 1, rel: 0, disablekb: 1, fs: 0, mute: 1,
                // ** FIX iOS/Safari **
                playsinline: 1
            },
            events: {
                onReady: (event) => {
                    const iframe = videoContainer.querySelector('iframe');
                    if (iframe) {
                        iframe.removeAttribute('width');
                        iframe.removeAttribute('height');
                        iframe.style.width = '100%';
                        iframe.style.height = '100%';
                        // ** IMPORTANT **: Rendre la vidéo non-interactive
                        iframe.style.pointerEvents = 'none'; 

                        // ** FIX iOS/Safari **
                        iframe.setAttribute('playsinline', '1');
                    }
                    event.target.mute();
                    event.target.playVideo();
                },
                onStateChange: (event) => {
                     // ** FIX iOS/Safari **: Force la lecture si elle est en file d'attente/non démarrée
                    if (event.data === window.YT.PlayerState.CUED || event.data === -1) {
                         if (!event.target.isMuted()) {
                             event.target.mute();
                         }
                         event.target.playVideo();
                    }
                    if (event.data === window.YT.PlayerState.ENDED) {
                        event.target.playVideo();
                    }
                }
            }
        });
    });
}

/**
 * 6. INITIALISATION DE TOUS LES BLOCS DE FOND STATIQUES
 * Recherche les blocs marqués pour une vidéo de fond et les initialise.
 */
function initAllBackgroundVideos(root = document) {
    root.querySelectorAll('.video-background-block').forEach(initBackgroundVideo);
}


/**
 * 7. EXPORTATION DES FONCTIONS PUBLIQUES
 */
export { embedVideo, destroyVideo, getVideoIdFromSlide, initAllBackgroundVideos };