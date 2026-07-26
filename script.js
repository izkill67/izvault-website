/* =====================================
   IZVAULT V2
   script.js
===================================== */

document.addEventListener("DOMContentLoaded", () => {

const observer = new IntersectionObserver((entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("visible");

}

});

},{
threshold:0.15
});

document.querySelectorAll(".hero,.card,.about,.contact").forEach(el=>{

el.classList.add("hidden");

observer.observe(el);

});

/* Navbar */

const header=document.querySelector("header");

window.addEventListener("scroll",()=>{

if(window.scrollY>30){

header.classList.add("scrolled");

}else{

header.classList.remove("scrolled");

}

});

/* Buttons */

document.querySelectorAll(".primary,.secondary,.socials a").forEach(btn=>{

btn.addEventListener("mouseenter",()=>{

btn.style.transform="translateY(-4px)";

});

btn.addEventListener("mouseleave",()=>{

btn.style.transform="translateY(0px)";

});

});

/* Card Glow */

document.querySelectorAll(".card").forEach(card=>{

card.addEventListener("mousemove",(e)=>{

const rect=card.getBoundingClientRect();

const x=e.clientX-rect.left;
const y=e.clientY-rect.top;

card.style.background=

`radial-gradient(circle at ${x}px ${y}px,
rgba(201,162,39,.12),
#121212 60%)`;

});

card.addEventListener("mouseleave",()=>{

card.style.background="#121212";

});

});

/* Smooth Anchor */

document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

anchor.addEventListener("click",(e)=>{

const target=document.querySelector(anchor.getAttribute("href"));

if(target){

e.preventDefault();

target.scrollIntoView({

behavior:"smooth"

});

}

});

});

console.log("IZVAULT V2 Loaded");

});