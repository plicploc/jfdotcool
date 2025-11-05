/**
 * Gère l'ouverture/fermeture du menu burger sur mobile/tablette.
 * Utilise GSAP pour l'animation du bouton croix et gère les classes 'active'.
 * Gère le conflit click/touchend sur iOS.
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

    // Initialisation de l'icône croix (pour être sûr qu'elle est cachée au début)
    if (window.gsap) {
         gsap.set(iconCross, { rotation: 0, display: 'none' });
    } else {
         iconCross.style.display = 'none';
    }


    /**
     * Fonction de basculement (toggle) qui contient toute la logique
     * @param {Event} e - L'objet Event (peut être click ou touchend)
     */
    function handleMenuToggle(e) {
        // 🛑 Solution pour les doubles clics/touchers sur mobile :
        // Stoppe l'événement de remonter aux parents et d'être interprété ailleurs.
        e.stopPropagation();

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


    // 4. Attacher les écouteurs d'événement
    
    // Écouteur standard pour la souris (Desktop)
    opener.addEventListener('click', handleMenuToggle); 

    // Écouteur tactile pour Mobile/iPad (prioritaire sur 'click' simulé)
    opener.addEventListener('touchend', function(e) {
        // Annule l'action par défaut (par exemple, le zoom ou le menu contextuel iOS)
        e.preventDefault(); 
        
        // Stoppe la propagation de l'événement tactile
        e.stopPropagation(); 
        
        // Exécute la logique de bascule
        handleMenuToggle(e); 
    });
    

}

