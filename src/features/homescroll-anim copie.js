import { Application } from '@splinetool/runtime';

export function initHomescrollAnimations(splineContainer) {
    if (!splineContainer) {
        console.error('Spline container not found.');
        return;
    }

    // GSAP et ScrollTrigger sont supposés être disponibles globalement
    if (!window.gsap || !window.ScrollTrigger) {
        console.warn('GSAP, ScrollTrigger ou Spline non disponibles globalement. Les animations ne peuvent pas être initialisées.');
        return;
    }

    // Crée le canvas pour le rendu Spline
    const canvas = document.createElement('canvas');
    canvas.id = 'spline-home';
    splineContainer.appendChild(canvas);

    // Initialise l'application Spline avec le canvas
    const splineApp = new Application(canvas);
    splineApp.load('https://prod.spline.design/MTBBrijQQCckMJMv/scene.splinecode').then(() => {
        const requiredVersion = splineApp.requiredVersion;
        const runtimeVersion = splineApp.version;
        console.log(`[Spline] Runtime version: ${runtimeVersion}, Required version: ${requiredVersion}`);

        // Récupère les objets Spline par leur nom
        const homeanimScene = splineApp.findObjectByName('homeanim');
        const coolcam = splineApp.findObjectByName('coolcam');
        const evol = splineApp.findObjectByName('évol');
        const groups = [
            splineApp.findObjectByName('seq-01'),
            splineApp.findObjectByName('seq-02'),
            splineApp.findObjectByName('seq-03'),
            splineApp.findObjectByName('seq-04'),
            splineApp.findObjectByName('seq-05'),
            splineApp.findObjectByName('seq-06'),
        ];
        
        console.log('[Spline] Objets trouvés:', { homeanimScene, coolcam, evol, groups });

        // --- DÉFINITION DES SÉQUENCES D'ANIMATION GSAP ---
        const homespeechBlocks = document.querySelectorAll('.homespeech-block');
        
        // Cache tous les groupes sauf le premier
        groups.forEach((group, index) => {
            if (group) {
                group.visible = index === 0;
            }
        });

        // Timeline principale pour orchestrer les animations
        const masterTimeline = window.gsap.timeline({
            scrollTrigger: {
                trigger: '.homespeech-container',
                start: 'top top',
                end: `+=${(homespeechBlocks.length) * window.innerHeight}`,
                scrub: true,
                pin: splineContainer,
                // Ajoute des marqueurs pour le débogage de ScrollTrigger
                markers: true,
                onUpdate: self => console.log(`[GSAP] Scroll progress: ${self.progress.toFixed(2)}`),
            },
        });
        
        // Anime la caméra et les groupes
        if (coolcam) {
            // Anime la rotation de la caméra sur la timeline principale
            masterTimeline.to(coolcam.rotation, {
                x: -Math.PI * 2,
                y: -Math.PI * 2,
                z: -Math.PI * 2,
                ease: 'none',
            });
        }
        
        // Gère les animations de groupe et de l'objet "évol"
        const durationPerBlock = masterTimeline.duration() / homespeechBlocks.length;
        
        if (evol) {
            homespeechBlocks.forEach((block, index) => {
                const stepName = `step-${index + 1}`;
                
                // Crée un label pour le début de l'animation de chaque bloc
                masterTimeline.addLabel(stepName, durationPerBlock * index);

                // Anime l'apparition du groupe actuel
                if (groups[index]) {
                    masterTimeline.to(groups[index], {
                        visible: true,
                    }, stepName);
                }
                
                // Fait disparaître le groupe précédent
                if (index > 0 && groups[index-1]) {
                     masterTimeline.to(groups[index-1], {
                        visible: false,
                    }, stepName);
                }

                // Anime l'objet "évol" pour passer à son état
                const stateName = index === 0 ? 'Base State' : `0${index}`;
                masterTimeline.to(evol, {
                    splineState: stateName,
                    ease: 'none',
                    onUpdate: () => {
                         evol.emitEvent('onStateChange', stateName);
                    }
                }, stepName);
            });
        }
    });
}
