/**
 * Gère l'ouverture/fermeture du menu burger sur mobile/tablette.
 * Utilise GSAP pour l'animation du bouton croix et gère les classes 'active'.
 * Gère le conflit click/touchend sur iOS et permet la navigation manuelle des liens.
 */
export function setupMenuToggle() {
    // Sélecteurs des éléments clés
    const opener = document.querySelector('.sidebar .navbar-main .opener');
    const iconBurger = opener ? opener.querySelector('.icon-burger') : null;
    const iconCross = opener ? opener.querySelector('.icon-cross') : null;

    // Éléments auxquels la classe 'active' doit être ajoutée/retirée
    const targetElements = [
        document.querySelector('.nav-content'),
        document.querySelector('.navbar-vertical'),
        document.querySelectorAll('.navbar-link'),
        document.querySelectorAll('.navbar-link .menu-link-text'),
        document.querySelector('.navbar-main')
    ];

    if (!opener || !iconBurger || !iconCross) {
        console.error("Erreur: Un ou plusieurs sélecteurs d'éléments du menu sont introuvables.");
        return;
    }

    // Initialisation de l'icône croix
    if (window.gsap) {
         gsap.set(iconCross, { rotation: 0, display: 'none' });
    } else {
         iconCross.style.display = 'none';
    }


    /**
     * Logique PURE de bascule (ouverture/fermeture sans gestion d'événements)
     */
    function toggleMenuState() {
        // 1. Basculer les icônes (Burger <-> Cross)
        const isActive = opener.classList.toggle('is-active');

        // Basculer l'affichage (display: flex <-> display: none)
        iconBurger.style.display = isActive ? 'none' : 'flex';
        iconCross.style.display = isActive ? 'flex' : 'none';

        // 2. Animer l'icône Croix avec GSAP
        if (window.gsap) {
            const rotationValue = isActive ? 90 : 0;
            gsap.to(iconCross, { 
                rotation: rotationValue, 
                duration: 0.3,
                ease: 'power2.out' 
            });
        }
        
        // 3. Basculer la classe 'active' sur les éléments cibles
        targetElements.forEach(element => {
            if (element) {
                if (NodeList.prototype.isPrototypeOf(element) || HTMLCollection.prototype.isPrototypeOf(element)) {
                    element.forEach(el => el.classList.toggle('active', isActive));
                } else {
                    element.classList.toggle('active', isActive);
                }
            }
        });
    }

    /**
     * Fonction de basculement (toggle) appelée par le bouton BURGER.
     * Contient la protection anti-bug mobile.
     * @param {Event} e - L'objet Event du clic
     */
    function handleMenuToggle(e) {
        // Conserver e.stopPropagation() pour le bouton BURGER (protection anti-bug)
        e.stopPropagation(); 
        
        toggleMenuState();
    }

    /**
     * Fonction pour fermer le menu, appelée par les LIENS.
     */
    function closeMenuIfOpen() {
        const isCurrentlyActive = opener.classList.contains('is-active');
        if (isCurrentlyActive) {
            toggleMenuState();
        }
    }


    // 4. Attacher les écouteurs d'événement pour le bouton BURGER (PROTÉGÉ)
    opener.addEventListener('click', handleMenuToggle); 
    opener.addEventListener('touchend', function(e) {
        e.preventDefault(); 
        e.stopPropagation(); 
        handleMenuToggle(e); 
    });
    
    
    // 5. Fermeture automatique du menu après un clic sur un lien (NAVIGATION FORCÉE)
    const navbarLinks = document.querySelectorAll('.navbar-link');

    navbarLinks.forEach(link => {
        const linkHandler = function(e) {
            const linkHref = this.getAttribute('href');

            // 1. Empêcher la navigation par défaut et stopper la propagation
            e.preventDefault(); 
            e.stopPropagation();
            
            // 2. Fermer le menu
            closeMenuIfOpen(); 
            
            // 3. Forcer la navigation avec un court délai pour laisser l'animation GSAP commencer
            if (linkHref) {
                // Délai ajusté à la durée de l'animation GSAP (0.3s)
                setTimeout(() => {
                    // Utiliser Webflow.lauch(linkHref) si vous utilisez des transitions de page Webflow
                    // Sinon, simple navigation JS :
                    window.location.href = linkHref; 
                }, 300); // 300ms = 0.3s
            }
        };

        // On attache le même gestionnaire aux deux événements pour fiabilité maximale
        link.addEventListener('click', linkHandler);
        link.addEventListener('touchend', linkHandler);
    });

}