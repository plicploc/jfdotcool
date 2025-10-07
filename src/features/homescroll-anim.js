import { Application } from '@splinetool/runtime';

export function initHomescrollAnimations(splineContainer) {
    if (!splineContainer) {
        console.error('Spline container not found.');
        return;
    }

    if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
        console.warn('GSAP, ScrollTrigger, ou SplitText non disponible.');
        return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);

    // NOTE : On ne met AUCUNE configuration de scroller ici.
    // Le scrollerProxy configuré dans app.js s'en occupe pour tout le site.

    const canvas = document.createElement('canvas');
    canvas.id = 'spline-home';
    splineContainer.appendChild(canvas);

    const splineApp = new Application(canvas);
    
    splineApp.load('https://prod.spline.design/MTBBrijQQCckMJMv/scene.splinecode').then(() => {

        const TARGET_OBJECT = "home-scene"; 
        const particules= "particules"; 
        const turbulences= "turbulences";
        const seq01= "seq01"; 
        const groupObject = splineApp.findObjectByName(TARGET_OBJECT);
        
        function seq01on() { 
            //intro
             splineApp.emitEvent("start", particules); 
            splineApp.emitEvent("start", TARGET_OBJECT);
        
        }
        function seq01off() {}
        function seq02on() { 
            //awesome
        splineApp.emitEvent("mouseUp", particules);
         splineApp.emitEvent("mouseUp", TARGET_OBJECT);

    }
        function seq02off() {}
        function seq03on() { 
            //but
            splineApp.emitEvent("mouseDown", particules);
            splineApp.emitEvent("mouseDown", TARGET_OBJECT);

         }
        function seq03off() {}
        function seq04on() {
            console.log("seq04on");
             splineApp.emitEvent("mouseUp", seq01);
             splineApp.emitEvent("start", particules);


         }
        function seq04off() {}
        function seq05on() { splineApp.emitEvent("mouseHover", TARGET_OBJECT); }
        function seq05off() {}
        function seq06on() { splineApp.emitEvent("keyUp", TARGET_OBJECT); }
        function seq06off() {}

        // Le trigger pour le pinning et la rotation reste inchangé.
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
        });
        
        // --- SUPPRESSION ---
        // Le ScrollTrigger qui gérait le snap a été retiré pour éviter les bugs.
        // ScrollTrigger.create({ ... });

        // On rafraîchit les positions une fois que tout est prêt.
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500);

    });
}

