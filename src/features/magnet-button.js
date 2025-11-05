// src/features/magnet-button.js

const gsap = window.gsap;

const MAGNETIC_RADIUS = 80;
const BUTTON_SELECTOR = ".magnet-button";
const TEXT_CONTENT_SELECTOR = ".magnet-bt-content";

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

export function initMagnetButtons() {
  if (!gsap) {
    console.warn("[MagnetButtons] GSAP non disponible. Initialisation annulée.");
    return;
  }

  try { 
    if (window.Webflow?.env?.("editor") || window.Webflow?.env?.("design")) {
        return;
    }
  } catch {}

  if (window.JF && window.JF._magnetButtonsInit) return;
  if (window.JF) window.JF._magnetButtonsInit = true;

  const isTouchDevice = 
      document.documentElement.classList.contains('w-mod-touch') || 
      document.body.classList.contains('w-mod-touch');              

  if (isTouchDevice) {
      console.log("[MagnetButtons] Appareil tactile détecté (.w-mod-touch sur html ou body). Effet désactivé.");
      return;
  }
  
  const buttonsSelector = BUTTON_SELECTOR; 
  
  let buttons = Array.from(document.querySelectorAll(buttonsSelector));
  
  if (buttons.length === 0) {
      console.log("[MagnetButtons] Aucun bouton magnétique trouvé sur cette page.");
      return;
  }
  
  console.log(`✅ [MagnetButtons] ${buttons.length} boutons magnétiques initialisés.`);
  
  document.addEventListener("mousemove", (e) => {
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

      if (!text) return;

      if (distance < MAGNETIC_RADIUS) {
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;

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

        if (button.resetTimer) {
          clearTimeout(button.resetTimer);
          button.resetTimer = null;
        }
        
      } else {
        if (!button.resetTimer) {
          button.resetTimer = setTimeout(() => {
            resetMagnet(button, text);
            button.resetTimer = null;
          }, 200);
        }
      }
    });
  });
}