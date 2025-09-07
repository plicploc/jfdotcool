window.JF = window.JF || {};
window.JF.PageWork = (() => {
  let ctx;
  async function init() { ctx = gsap.context(() => {}); }
  function destroy() { ctx?.revert(); ctx = null; 
  console.log("ca passe par la!");

window.addEventListener("DOMContentLoaded", () => {
  console.log("ca passe par la!");
  JF.TextFX.pouetpouet(".txttile", {
    duration: 0.3,
    delay: 1.5,
    stagger: 0.05,
    y: "30%",
    rotationX: -90,
    ease: "back.inOut(1.7)", // facteur 1.7 = overshoot
    rotationY: 45
  });
});



  }
  return { init, destroy };
})();
