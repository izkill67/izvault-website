// ===== IZVAULT V1 =====

document.addEventListener("DOMContentLoaded", () => {

    const hero = document.querySelector(".hero");
    const cards = document.querySelectorAll(".card");
    const buttons = document.querySelectorAll(".button");

    hero.style.opacity = "0";
    hero.style.transform = "translateY(30px)";

    setTimeout(() => {
        hero.style.transition = "1s ease";
        hero.style.opacity = "1";
        hero.style.transform = "translateY(0)";
    }, 200);

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if(entry.isIntersecting){

                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";

            }

        });

    },{

        threshold:.2

    });

    cards.forEach(card=>{

        card.style.opacity="0";
        card.style.transform="translateY(40px)";
        card.style.transition=".8s ease";

        observer.observe(card);

    });

    buttons.forEach(button=>{

        button.addEventListener("mouseenter",()=>{

            button.style.transform="translateY(-3px) scale(1.02)";

        });

        button.addEventListener("mouseleave",()=>{

            button.style.transform="translateY(0) scale(1)";

        });

    });

});

console.log("IZVAULT V1 Loaded");