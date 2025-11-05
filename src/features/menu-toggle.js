/**
 * Gère l'ouverture/fermeture du menu burger sur mobile/tablette.
 * Utilise GSAP pour l'animation du bouton croix et gère les classes 'active'.
 * Gère le conflit click/touchend sur iOS et permet la navigation des liens.
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
                // Gérer les NodeList et les HTMLCollections
                if (NodeList.prototype.isPrototypeOf(element) || HTMLCollection.prototype.isPrototypeOf(element)) {
                    element.forEach(el => el.classList.toggle('active', isActive));
                } else {
                    // Gérer les éléments simples
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
        // 🛑 Conserver e.stopPropagation() pour le bouton BURGER (protection anti-bug)
        e.stopPropagation(); 
        
        // La logique pure de bascule
        toggleMenuState();
    }

    /**
     * Fonction pour fermer le menu, appelée par les LIENS.
     * Ne fait AUCUN e.stopPropagation() ou e.preventDefault().
     */
    function closeMenuIfOpen() {
        const isCurrentlyActive = opener.classList.contains('is-active');
        if (isCurrentlyActive) {
            // Appeler la fonction de bascule pour inverser l'état
            toggleMenuState();
        }
    }


    // 4. Attacher les écouteurs d'événement pour le bouton BURGER (PROTÉGÉ)
    // Clic pour Desktop (souris)
    opener.addEventListener('click', handleMenuToggle); 

    // Toucher pour Mobile/iPad (priorité et protection)
    opener.addEventListener('touchend', function(e) {
        e.preventDefault(); 
        e.stopPropagation(); 
        handleMenuToggle(e); 
    });
    
    
    // 5. Fermeture automatique du menu après un clic sur un lien (NAVIGATION AUTORISÉE)
    const navbarLinks = document.querySelectorAll('.navbar-link');

    navbarLinks.forEach(link => {
        // Clic pour Desktop (souris)
        link.addEventListener('click', function(e) {
            // Aucune action sur 'e' pour ne pas bloquer la navigation
            closeMenuIfOpen(); 
        });
        
        // Toucher pour Mobile/iPad
        link.addEventListener('touchend', function(e) {
             // Nous faisons e.stopPropagation() ici pour éviter que l'événement remonte
             // et déclenche une logique de fermeture *globale* (si elle existe),
             // mais nous n'utilisons PAS e.preventDefault() pour laisser la navigation s'opérer.
             e.stopPropagation(); 
             
             closeMenuIfOpen(); 
             
             // Le navigateur naviguera vers le href immédiatement après
        });
    });

}