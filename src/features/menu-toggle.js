/**
 * Gère l'ouverture/fermeture du menu burger sur mobile/tablette.
 * Utilise GSAP pour l'animation du bouton croix et gère les classes 'active'.
 * @exports setupMenuToggle
 */
export function setupMenuToggle() { // <-- Ajout de 'export' ici
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
     * Fonction de basculement (toggle)
     * @param {Event} e - L'objet Event du clic
     */
    function handleMenuToggle(e) {
        // 🛑 Solution pour les doubles clics/touchers sur mobile
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

    // 4. Attacher l'écouteur d'événement
    opener.addEventListener('click', handleMenuToggle);
}

