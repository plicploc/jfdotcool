// /src/vendors/barba.js
// Gère les liens .w--current et aria-current="page" avec support des pages CMS enfants (/work/slug)
// Safe, extensible, anti-freeze, sans dépendre d’un appel à barba.init()

window.JF = window.JF || {};
window.JF.Barba = (() => {
  let enabled = false;

  // --- Helpers URL ---
  function normalizePath(p) {
    if (!p) return '/';
    try {
      const clean = p.replace(/\/{2,}/g, '/');
      return (clean.length > 1) ? clean.replace(/\/+$/, '') : '/';
    } catch { return '/'; }
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

  // --- Parent CMS rules (extensible)
  const PARENT_RULES = [
    { parent: '/work', match: (path) => path === '/work' || path.startsWith('/work/') },
    // { parent: '/blog', match: (path) => path === '/blog' || path.startsWith('/blog/') },
  ];

  function isParentActive(href, path) {
    for (const r of PARENT_RULES) {
      if (href === r.parent && r.match(path)) return true;
    }
    return false;
  }

  function selectNavRoot() {
    return document.querySelector('.sidebar, .navbar, [data-nav], .sidebar-new') || document.body;
  }

  // --- Met à jour les liens w--current + aria-current
  function updateCurrentLinksByLocation() {
    const path = normalizePath(window.location.pathname || '/');
    const navRoot = selectNavRoot();

    // Nettoyage uniquement des ajouts dynamiques
    navRoot.querySelectorAll('.navbar-link[data-added-current="true"], .menu-item[data-added-current="true"]').forEach((el) => {
      el.classList.remove('w--current');
      if (el.getAttribute('aria-current') === 'page') el.removeAttribute('aria-current');
      el.removeAttribute('data-added-current');
    });

    const links = navRoot.querySelectorAll('.navbar-link[href], .menu-item[href]');
    links.forEach((link) => {
      const href = hrefPath(link);
      const isExact = (href === path);
      const isParent = isParentActive(href, path);

      if (isExact) {
        if (!link.classList.contains('w--current')) link.classList.add('w--current');
        if (link.getAttribute('aria-current') !== 'page') link.setAttribute('aria-current', 'page');
        return;
      }

      if (isParent) {
        link.classList.add('w--current');
        link.setAttribute('aria-current', 'page');
        link.setAttribute('data-added-current', 'true');
      }
    });
  }

  // --- MutationObserver sécurisé
  let _navObserver;
  function ensureNavObserver() {
    const root = selectNavRoot();
    if (_navObserver) return;

    _navObserver = new MutationObserver((muts) => {
      const shouldUpdate = muts.some(m =>
        (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) ||
        (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'href'))
      );

      if (shouldUpdate) {
        _navObserver.disconnect(); // 🔐 évite le rebouclage
        try {
          updateCurrentLinksByLocation();
        } finally {
          _navObserver.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'href']
          });
        }
      }
    });

    _navObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'href']
    });
  }

  // --- Boot complet
  function bootBarbaNavCurrent() {
    if (enabled) return;
    enabled = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        updateCurrentLinksByLocation();
        ensureNavObserver();
      }, { once: true });
    } else {
      updateCurrentLinksByLocation();
      ensureNavObserver();
    }

    if (window.barba?.hooks) {
      window.barba.hooks.after(() => {
        updateCurrentLinksByLocation();
      });
    }
  }

  // Auto-init
  bootBarbaNavCurrent();

  // Public API si besoin
  return {
    refresh: updateCurrentLinksByLocation,
    init: bootBarbaNavCurrent
  };
})();
