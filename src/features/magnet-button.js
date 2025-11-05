// src/features/magnet-button.js

// Assurez-vous que GSAP est disponible globalement ou importez-le si nécessaire.
// Dans l'environnement Webflow, il est souvent global (window.gsap).
const gsap = window.gsap;

const MAGNETIC_RADIUS = 80;
const BUTTON_SELECTOR = ".magnet-button";
const TEXT_CONTENT_SELECTOR = ".magnet-bt-content";

/**
 * Réinitialise la position du bouton et de son contenu.
 * @param {HTMLElement} button - L'élément bouton.
 * @param {HTMLElement} text - L'élément de contenu du texte.
 */
function resetMagnet(button, text) {
  gsap.to(button, {
    x: 0,
    y: 0,
    duration: 1,
    ease: "elastic.out(1.2, 0.2)",
    overwrite: "auto",
  });

  gsap.to(text, {
    x: 0,
    y: 0,
    duration: 0.5,
    ease: "power3.out",
    overwrite: "auto",
  });
}

/**
 * Initialise l'effet magnétique en attachant un écouteur 'mousemove' au document.
 * L'effet est désactivé sur les appareils tactiles (Webflow ajoute .w-mod-touch).
 */
export function initMagnetButtons() {
  // On ne fait rien si GSAP n'est pas disponible
  if (!gsap) {
    console.warn("[MagnetButtons] GSAP non disponible. Initialisation annulée.");
    return;
  }

  // On vérifie le mode "éditeur" de Webflow pour éviter de lancer le script
  try { 
    if (window.Webflow?.env?.("editor") || window.Webflow?.env?.("design")) {
        return;
    }
  } catch {}

  // Utilisation d'un drapeau pour éviter l'initialisation multiple
  if (window.JF && window.JF._magnetButtonsInit) return;
  if (window.JF) window.JF._magnetButtonsInit = true;

  // On ajoute le sélecteur pour exclure les appareils tactiles
  // Note: La détection '.w-mod-touch' est très importante ici
  const buttonsSelector = `body:not(.w-mod-touch) ${BUTTON_SELECTOR}`;
  
  // Cache des boutons (mis à jour à l'événement si nécessaire, mais on le fait ici pour l'init)
  let buttons = Array.from(document.querySelectorAll(buttonsSelector));
  
  if (buttons.length === 0) {
      console.log("[MagnetButtons] Aucun bouton magnétique trouvé sur cette page.");
      return;
  }
  
  console.log(`[MagnetButtons] ${buttons.length} boutons magnétiques initialisés.`);
  
  document.addEventListener("mousemove", (e) => {
    // Si l'utilisateur passe d'une page à une autre (avec transitions), on peut
    // rafraîchir la liste des boutons
    if (buttons.length !== document.querySelectorAll(buttonsSelector).length) {
         buttons = Array.from(document.querySelectorAll(buttonsSelector));
    }
      
    buttons.forEach((button) => {
      const rect = button.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const distanceX = e.clientX - buttonCenterX;
      const distanceY = e.clientY - buttonCenterY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      const text = button.querySelector(TEXT_CONTENT_SELECTOR);

      if (!text) return; // S'assurer que le contenu existe

      if (distance < MAGNETIC_RADIUS) {
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;

        // Déplace le bouton et le texte avec GSAP
        gsap.to(button, {
          x: offsetX * 0.5,
          y: offsetY * 0.5,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });

        gsap.to(text, {
          x: offsetX * 0.2,
          y: offsetY * 0.2,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });

        // Annuler le timer de réinitialisation s'il est en cours
        if (button.resetTimer) {
          clearTimeout(button.resetTimer);
          button.resetTimer = null;
        }
        
      } else {
        // Appliquer la réinitialisation (avec throttling)
        if (!button.resetTimer) {
          button.resetTimer = setTimeout(() => {
            resetMagnet(button, text);
            button.resetTimer = null; // Réinitialiser le timer après l'exécution
          }, 200); // Throttling
        }
      }
    });
  });
}