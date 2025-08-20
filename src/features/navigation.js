// navigation.js — parent "current" hack pour templates CMS (Webflow)
// - Ajoute .w--current sur le lien parent "Work" quand on est sur /work/slug
// - Idempotent (on retire uniquement ce qu'on a ajouté nous-mêmes)
// - Compatible Barba (re-run après navigation)

(function () {
  const MENU_LINKS_SELECTOR = '.navbar-link';
  const ADDED_FLAG = 'data-added-current';

  // Déclare ici les règles parent -> test d'URL
  const PARENT_RULES = [
    {
      parentHref: '/work',
      test: (path) => path.startsWith('/work/') && path !== '/work/'
    },
    // Exemple pour d’autres sections (à activer si besoin) :
    // { parentHref: '/blog', test: (path) => path.startsWith('/blog/') && path !== '/blog/' },
  ];

  function normalizePath(path) {
    try {
      // retire doublons de slash et trailing slash (sauf la racine "/")
      let p = path.replace(/\/{2,}/g, '/');
      if (p.length > 1) p = p.replace(/\/+$/, '');
      return p || '/';
    } catch {
      return '/';
    }
  }

  function matchesHref(el, targetHref) {
    // Webflow peut générer /work, /work/, ou une URL absolue
    const href = (el.getAttribute('href') || '').trim();
    if (!href) return false;
    try {
      if (href.startsWith('http')) {
        const u = new URL(href);
        return normalizePath(u.pathname) === normalizePath(targetHref);
      }
    } catch {}
    return normalizePath(href) === normalizePath(targetHref);
  }

  function removeAddedCurrents() {
    document.querySelectorAll(`${MENU_LINKS_SELECTOR}[${ADDED_FLAG}="true"]`).forEach((el) => {
      el.classList.remove('w--current');
      el.removeAttribute(ADDED_FLAG);
    });
  }

  function applyParentCurrent() {
    const path = normalizePath(window.location.pathname);

    // 1) Nettoie ce qu’on a pu ajouter précédemment (sans toucher au current natif Webflow)
    removeAddedCurrents();

    // 2) Cherche une règle qui matche l’URL courante
    const rule = PARENT_RULES.find((r) => r.test(path));
    if (!rule) return;

    // 3) Marque le lien parent comme current (si trouvé)
    const parentLink = Array.from(document.querySelectorAll(MENU_LINKS_SELECTOR))
      .find((a) => matchesHref(a, rule.parentHref));

    if (parentLink) {
      parentLink.classList.add('w--current');
      parentLink.setAttribute(ADDED_FLAG, 'true');
    }
  }

  // Run au chargement
  document.addEventListener('DOMContentLoaded', applyParentCurrent);

  // Re-run après navigation Barba si présent
  if (window.barba && window.barba.hooks) {
    // after/enter suffisent selon ta config, on met after pour être sûr que le DOM est prêt
    window.barba.hooks.after(() => {
      applyParentCurrent();
    });
  }

  // Petit filet de sécurité si du contenu nav est ré-injecté dynamiquement
  const nav = document.querySelector('.sidebar, .navbar, [data-nav], .sidebar-new') || document.body;
  const mo = new MutationObserver((muts) => {
    // évite la boucle : on ne re-run que si des liens ont été ajoutés/retirés
    if (muts.some(m => Array.from(m.addedNodes).some(n => n.querySelector?.(MENU_LINKS_SELECTOR))
                    || Array.from(m.removedNodes).some(n => n.querySelector?.(MENU_LINKS_SELECTOR)))) {
      applyParentCurrent();
    }
  });
  mo.observe(nav, { childList: true, subtree: true });
})();
