// File: features/custom-cursor.js

export const CURSOR_TYPES = {
  // --- Type de curseur existant ---
  drag: {
    classes: ['cursor--drag'],
    options: {
      easing: 0.5,
      rotationFactor: 0.4,
      handOpenedUrl: 'https://cdn.prod.website-files.com/68627ab79a156f2070af6b9f/68dcf2072117f64a1bc9cc81_hand-opened.svg',
      handClosedUrl: 'https://cdn.prod.website-files.com/68627ab79a156f2070af6b9f/68dcf2075d0fefafb143d0a3_hand-closed.svg',
    }
  },
  
  // --- NOUVEAU type de curseur ---
  point: {
    classes: ['cursor--point'],
    options: {
      // Pour un suivi "ferré" (collé), on met l'amorti à 1
      easing: 1, 
      // Pas de rotation
      rotationFactor: 0, 
      // URL unique pour ce curseur
      imageUrl: 'https://cdn.prod.website-files.com/68627ab79a156f2070af6b9f/68dd28c44408921d0600c0de_hand-point.svg',
    }
  }
};

class CustomCursor {
  constructor(targetElement, typeConfig) {
    this.targetElement = targetElement;
    this.typeConfig = typeConfig;
    this.options = typeConfig.options || {};
    this.mouse = { x: 0, y: 0 };
    this.pos = { x: 0, y: 0 };
    this.lastPos = { x: 0, y: 0 };
    this.isVisible = false;
    this.scale = 1.0;
    this.init();
  }

  init() {
    this.createCursorElement();
    this.bindEvents();
    this.update();
  }

  createCursorElement() {
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'custom-cursor';
    if (this.typeConfig.classes) {
      this.cursorEl.classList.add(...this.typeConfig.classes);
    }
    // Logique adaptée : utilise l'image "ouverte" OU l'image unique
    const initialImageUrl = this.options.handOpenedUrl || this.options.imageUrl;
    if (initialImageUrl) {
      this.cursorEl.style.backgroundImage = `url('${initialImageUrl}')`;
    }
    document.body.appendChild(this.cursorEl);
  }

  bindEvents() {
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.targetElement.addEventListener('pointerenter', this.onMouseEnter);
    this.targetElement.addEventListener('pointerleave', this.onMouseLeave);
    this.targetElement.addEventListener('pointerdown', this.onMouseDown, { capture: true });
    window.addEventListener('pointermove', this.onMouseMove, { capture: true });
    window.addEventListener('pointerup', this.onMouseUp, { capture: true });
  }

  onMouseEnter() {
    this.isVisible = true;
    this.cursorEl.classList.add('is-visible');
    this.targetElement.style.cursor = 'none';
  }

  onMouseLeave() {
    this.isVisible = false;
    this.cursorEl.classList.remove('is-visible');
    this.targetElement.style.cursor = '';
  }

  onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }
  
  onMouseDown(e) {
    if (!this.isVisible) return;
    // Ne change l'image que si une URL "fermée" est définie
    if (this.options.handClosedUrl) {
      this.cursorEl.style.backgroundImage = `url('${this.options.handClosedUrl}')`;
    }
    this.scale = 0.9;
  }

  onMouseUp(e) {
    // Ne revient à l'image "ouverte" que si elle est définie
    if (this.options.handOpenedUrl) {
      this.cursorEl.style.backgroundImage = `url('${this.options.handOpenedUrl}')`;
    }
    this.scale = 1.0;
  }

  update() {
    const easing = this.options.easing ?? 0.5;
    const rotationFactor = this.options.rotationFactor ?? 0.4;
    this.pos.x += (this.mouse.x - this.pos.x) * easing;
    this.pos.y += (this.mouse.y - this.pos.y) * easing;
    const dx = this.pos.x - this.lastPos.x;
    const dy = this.pos.y - this.lastPos.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    const rotation = Math.min(Math.max(speed * rotationFactor, -15), 15);
    this.lastPos.x = this.pos.x;
    this.lastPos.y = this.pos.y;
    this.cursorEl.style.transform = `
      translate(calc(${this.pos.x}px - 50%), calc(${this.pos.y}px - 50%)) 
      rotate(${rotation}deg) 
      scale(${this.scale})
    `;
    requestAnimationFrame(this.update.bind(this));
  }
  
  listenToSwiper(swiperInstance) {
    if (!swiperInstance) return;
    swiperInstance.on('touchMove', (swiper, event) => {
      this.onMouseMove(event);
    });
  }
}

export function initCustomCursors(root = document) {
  const elements = root.querySelectorAll('[data-cursor]');
  elements.forEach(el => {
    const type = el.dataset.cursor;
    if (CURSOR_TYPES[type]) {
      if (!el._customCursorInstance) {
        el._customCursorInstance = new CustomCursor(el, CURSOR_TYPES[type]);
      }
    } else {
      console.warn(`[CustomCursor] Le type de curseur "${type}" n'existe pas.`);
    }
  });
}