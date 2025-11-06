import { Application } from '@splinetool/runtime';

export function initHomescrollAnimations(splineContainer) {
    if (!splineContainer) {
        console.error('Spline container not found.');
        return;
    }

    // Ajout de ScrollToPlugin à la vérification
    if (!window.gsap || !window.ScrollTrigger || !window.SplitText || !window.ScrollToPlugin) {
        console.warn('GSAP, ScrollTrigger, SplitText ou ScrollToPlugin non disponible.');
        return;
    }

    // Enregistrement de ScrollToPlugin
   // gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin);

    // NOTE : On ne met AUCUNE configuration de scroller ici.
    // Le scrollerProxy configuré dans app.js s'en occupe pour tout le site.

    // --- AJOUT PARTIE 1 : GESTION DES CLICS SUR LES BOUTONS .NEXT ---
    // Utilisation du sélecteur corrigé : '.cta.second.next'
    const allSpeechBlocks = document.querySelectorAll('.homespeech-block');
    allSpeechBlocks.forEach((block, index) => {
        const nextButton = block.querySelector('.cta.second.next');
        
        if (nextButton) {
            // 1. Trouver le bloc suivant
            const nextBlock = allSpeechBlocks[index + 1]; 
            
            if (nextBlock) {
                // 2. Ajouter l'écouteur d'événement
                nextButton.addEventListener('click', (e) => {
                    e.preventDefault(); // Empêche le lien '#' de fonctionner
                    
                    // 3. Lancer l'animation de scroll GSAP
                    gsap.to(window, {
                        duration: 1.5, // Durée du scroll
                        scrollTo: nextBlock, // Cible
                        ease: 'power2.inOut'
                    });
                });
            }
        }
    });
    // --- FIN AJOUT PARTIE 1 ---


    // --- Logique Spline (inchangée) ---
    const canvas = document.createElement('canvas');
    canvas.id = 'spline-home';
    splineContainer.appendChild(canvas);

    const splineApp = new Application(canvas);
    
    splineApp.load('https://prod.spline.design/8FhyJKbr8T9z1n2j/scene.splinecode').then(() => {

        const TARGET_rotation = "00-all-objects"; 
        const sq01= "sq-01";
        const sq02= "sq-02";
        const sq03= "sq-03";
        const sq04= "sq-04";
        const sq05= "sq-05";
        const sq06= "sq-06";
        
        const groupObject = splineApp.findObjectByName(TARGET_rotation);
        
        function seq01on() { splineApp.emitEvent("mouseDown", sq01); }
        function seq01off() {}
        function seq02on() { splineApp.emitEvent("mouseDown", sq02); }
        function seq02off() {}
        function seq03on() { splineApp.emitEvent("mouseDown", sq03); }
        function seq03off() {}
        function seq04on() { splineApp.emitEvent("mouseDown", sq04); }
        function seq04off() {}
        function seq05on() { splineApp.emitEvent("mouseDown", sq05); }
        function seq05off() {}
        function seq06on() { splineApp.emitEvent("mouseDown", sq06); }
        function seq06off() {}

        if (groupObject) {
            gsap.to(groupObject.rotation, {
                scrollTrigger: {
                    trigger: '.homespeech-container',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                    pin: splineContainer,
                },
                y: Math.PI * 2,
                ease: 'none'
            });
        }
        // --- Fin Logique Spline ---


        // --- Logique d'animation des sections ---
        const homespeechBlocks = document.querySelectorAll('.homespeech-block[id]');
        homespeechBlocks.forEach(block => {
            const blockId = block.id;

            let onFunction, offFunction;
            switch (blockId) {
                case 'sp01': onFunction = seq01on; offFunction = seq01off; break;
                case 'sp02': onFunction = seq02on; offFunction = seq02off; break;
                case 'sp03': onFunction = seq03on; offFunction = seq03off; break;
                case 'sp04': onFunction = seq04on; offFunction = seq04off; break;
                case 'sp05': onFunction = seq05on; offFunction = seq05off; break;
                case 'sp06': onFunction = seq06on; offFunction = seq06off; break;
                default: return;
            }
            
            const tl = gsap.timeline({
                scrollTrigger: { 
                    trigger: `#${blockId}`, 
                    start: 'top center', 
                    end: 'bottom center', 
                    toggleActions: "play reverse play reverse", 
                    onEnter: onFunction, 
                    onLeave: offFunction, 
                    onEnterBack: onFunction, 
                    onLeaveBack: offFunction,
                }
            });

            if (blockId === 'sp01') {
                // ... (Logique sp01 inchangée) ...
                const titleContainer = block.querySelector('.title-4xl');
                if (titleContainer) {
                    const part1 = titleContainer.querySelector('.hometitle-part1');
                    const part2 = titleContainer.querySelector('.hometitle-part2');
                    const part3 = titleContainer.querySelector('.hometitle-part3');
                    const part4 = titleContainer.querySelector('.hometitle-part4');
                    const part5 = titleContainer.querySelector('.hometitle-part5');
                    const soul = titleContainer.querySelector('.soul');
                    const bulletEnd = titleContainer.querySelector('.hometitle-bullet-end');
                    const parts = [part1, part2, part3, part4, part5, soul, bulletEnd];
                    
                    if (parts.every(part => part !== null)) {
                        gsap.set(parts, { opacity: 0 });
                        
                        tl.to([part1, part2], {
                            duration: 0.05, opacity: 1,  ease: 'none', stagger: 0.3
                        }, 0.5);

                        tl.to(part3, {
                            duration: 0.05, opacity: 1,  ease: 'none'
                        }, "+=0.5");

                        tl.to([part4, part5, soul, bulletEnd], {
                            duration: 0.05, opacity: 1,  ease: 'none', stagger: 0.15
                        }, "+=1");
                    }
                }
            } else { 
                // ... (Logique pour titres et sous-sections inchangée) ...
                const mainTitle = block.querySelector('.home-title-reveal');
                if (mainTitle && mainTitle.textContent.trim() !== '') {
                    const splitTitle = new SplitText(mainTitle, { type: "words, chars" });
                    mainTitle.classList.remove('hidden');
                    gsap.set(splitTitle.chars, { opacity: 0 });
                    tl.to(splitTitle.chars, {
                        duration: 0.05, opacity: 1, ease: 'none', stagger: { from: "start", each: 0.02 }
                    }, 0.3);
                }

                const subsections = block.querySelectorAll('.subsection-home');
                subsections.forEach((subsection, index) => {
                    const subTitle = subsection.querySelector('h2');
                    const headings = subsection.querySelectorAll('h3');
                    const paragraphs = subsection.querySelectorAll('p');
                    const position = index === 0 ? ">" : "+=0.8";

                    if (subTitle && subTitle.textContent.trim() !== '') {
                        const splitSubTitle = new SplitText(subTitle, { type: "words, chars" });
                        gsap.set(splitSubTitle.chars, { opacity: 0 });
                        tl.to(splitSubTitle.chars, {
                            duration: 0.05, opacity: 1, ease: 'none', stagger: { from: "start", each: 0.02 }
                        }, position);
                    }
                    
                    if (headings.length > 0) {
                        tl.from(headings, {
                            duration: 0.5, opacity: 0, ease: 'power1.out', stagger: 0.1
                        }, subTitle && subTitle.textContent.trim() !== '' ? "-=0.2" : position);
                    }

                    if (paragraphs.length > 0) {
                        tl.from(paragraphs, {
                            duration: 0.5, opacity: 0, y: 10, ease: 'power1.out', stagger: 0.1
                        }, ">-0.3");
                    }
                });
            }

            // --- AJOUT PARTIE 2 : ANIMATION D'APPARITION DU BOUTON ---
            // Utilisation du sélecteur corrigé : '.cta.second.next'
            const nextButton = block.querySelector('.cta.second.next');
            if (nextButton) {
                // On retire la classe .hidden pour que GSAP puisse l'animer
                nextButton.classList.remove('hidden');
                
                // On ajoute son animation à la toute fin de la timeline ('>')
                tl.from(nextButton, {
                    duration: 0.5,
                    opacity: 0,
                    y: 10,
                    ease: 'power1.out'
                }, '>'); // '>' signifie "à la fin de la timeline existante"
            }
            // --- FIN AJOUT PARTIE 2 ---

        });
        
        // --- SUPPRESSION --- (inchangé)
        // Le ScrollTrigger qui gérait le snap a été retiré pour éviter les bugs.
        // ScrollTrigger.create({ ... });

        // On rafraîchit les positions une fois que tout est prêt.
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500);

    });
}