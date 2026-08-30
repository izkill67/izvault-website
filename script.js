document.addEventListener('DOMContentLoaded',()=>{
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')}),{threshold:.12});
 document.querySelectorAll('.hero-copy,.hero-visual,.stats-strip,.panel,.feature-card,.project-card,.trust-section,.about-section,.cta-section').forEach(el=>{el.classList.add('hidden');observer.observe(el)});
 const header=document.querySelector('header');
 window.addEventListener('scroll',()=>header?.classList.toggle('scrolled',window.scrollY>30),{passive:true});
 const mobile=document.getElementById('mobileMenu');
 const menu=document.getElementById('menu');
 mobile?.addEventListener('click',()=>{menu?.classList.toggle('open');mobile.innerHTML=menu?.classList.contains('open')?'<i class="fa-solid fa-xmark"></i>':'<i class="fa-solid fa-bars"></i>'});
 document.querySelectorAll('#menu a').forEach(a=>a.addEventListener('click',()=>menu?.classList.remove('open')));
 const sections=[...document.querySelectorAll('main section[id]')];
 const links=[...document.querySelectorAll('#menu a')];
 const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(l=>l.classList.remove('active'));const active=links.find(l=>l.getAttribute('href')==='#'+entry.target.id);active?.classList.add('active')}}),{rootMargin:'-35% 0px -55% 0px'});
 sections.forEach(s=>sectionObserver.observe(s));
 document.getElementById('themeToggle')?.addEventListener('click',()=>document.body.classList.toggle('light-preview'));
 document.getElementById('ctaSignIn')?.addEventListener('click',()=>document.getElementById('authOpen')?.click());
 document.querySelectorAll('.feature-card,.project-card,.panel,.stat').forEach(card=>card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mx',`${e.clientX-r.left}px`);card.style.setProperty('--my',`${e.clientY-r.top}px`)}));
 console.log('IZVAULT landing page loaded');
});