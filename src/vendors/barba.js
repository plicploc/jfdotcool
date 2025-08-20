// /src/vendors/barba.js
// JF.Barba : helpers & hooks centrés autour de Barba.js
// - Ne fait PAS barba.init() ici (laisse ça à ton bootstrap système)
// - Met à jour les liens "current" y compris pour les routes enfant CMS (/work/*)
// - Safe si Barba n'est pas chargé (fonctionne aussi en mode "no-Barba")

window.JF = window.JF || {};
window.JF.Barba = (() => {
  let enabled = false;

  // --------- (optionnel) logger interne ---------
  function dbg(...args) {
    if (window.__JF_DEBUG__) {
      // eslint-disable-next-line no-console
      console.log('[JF.Barba]', ...args);
    }
  }

  // --------- Helpers URL ---------
  function normalizePath(p) {
    if (!p) return '/';
    try {
      const clean = p.replace(/\/{2,}/g, '/');
      return (clean.length > 1) ? clean.replace(/\/+$/, '') : '/';
    } catch {
      return '/';
    }
  }

  function hrefPath(link) {
    const raw = (link.getAttribute('href') || '').trim();
    if (!raw) return '/';
    try {
      if (raw.startsWith('http')) {
        const u = new URL(raw);
        return normalizePath(u.pathname);
      }
    } catch {}
    return normalizePath(raw);
  }

  /**
   * Règles de parentage pour activer un lien parent quand on est sur une page enfant CMS.
   * Étends ce tableau si tu veux d'autres sections (blog, cases, etc.).
   */
  const PARENT_RULES = [
    { parent: '/work', match: (path) => path === '/work' || path.startsWith('/work/') },
    // Exemple :
    // { parent: '/blog',  match: (path) => path === '/blog'  || path.startsWith('/blog/')  },
    // { parent: '/cases', match: (path) => path === '/cases' || path.startsWith('/cases/') },
  ];

  function isParentActive(href, path) {
    for (const rule of PARENT_RULES) {
      if (href === rule.parent && rule.match(path)) return true;
    }
    return false;
  }

  /**
   * Met à jour l'état "current" des liens de nav:
   * - exact match   : href === path
   * - parent actif  : ex. href="/work" quand path="/work/slug"
   */
  function updateCurrentLinksByLocation() {
    const path = normalizePath(window.location.pathname || '/');

    // Couvre ta sidebar (.navbar-link) et l'ancien sélecteur (.menu-item) si encore présent
    const links = document.querySelectorAll('.navbar-link, .menu-item');

    links.forEach((link) => {
      const href = hrefPath(link);
      const isExact = (href === path);
      const isParent = isParentActive(href, path);
      link.classList.toggle('w--current', isExact || isParent);
    });

    dbg('nav.updateCurrent', { path, count: links.length });
  }

  // Expose publiquement si besoin (pour forcer la MAJ depuis ailleurs)
  function refresh() {
    updateCurrentLinksByLocation();
  }

  // --------- Init hooks Barba (si présent) + DOM Ready fallback ---------
  function init() {
    if (enabled) return;
    enabled = true;

    // 1) DOM prêt : première passe (marche même sans Barba)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateCurrentLinksByLocation, { once: true });
    } else {
      updateCurrentLinksByLocation();
    }

    // 2) Hooks Barba (si dispo) : re-run après chaque navigation
    if (window.barba && window.barba.hooks) {
      // after() : le nouveau container est injecté → liens présents → on peut mettre à jour
      window.barba.hooks.after(() => {
        updateCurrentLinksByLocation();
      });
      dbg('hooks.attached');
    } else {
      dbg('hooks.skipped (no Barba)');
    }
  }

  // Auto-boot (idempotent)
  init();

  return {
    init,     // rejouable sans danger
    refresh,  // public: forcer la MAJ "current" manuellement
  };
})();
