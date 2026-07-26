document.addEventListener("DOMContentLoaded", () => {

    const hero = document.querySelector(".hero");

    hero.style.opacity = "0";
    hero.style.transform = "translateY(40px)";

    setTimeout(() => {
        hero.style.transition = "all 1s ease";
        hero.style.opacity = "1";
        hero.style.transform = "translateY(0)";
    }, 300);

});


const links = document.querySelectorAll("nav a");

links.forEach(link => {

    link.addEventListener("mouseenter", () => {
        link.style.transform = "translateY(-3px)";
    });

    link.addEventListener("mouseleave", () => {
        link.style.transform = "translateY(0)";
    });

});
