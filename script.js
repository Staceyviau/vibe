// Numéro WhatsApp (format international, sans + ni espaces)
const WHATSAPP = "529841306938";

document.getElementById("annee").textContent = new Date().getFullYear();

// Barre de navigation : fond clair après défilement
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Menu mobile
const btn = document.querySelector(".menu-btn");
const menu = document.querySelector(".menu");
btn.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  nav.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  menu.classList.remove("open");
  nav.classList.remove("open");
}));

// Liens "Réserver" : présélectionne l'excursion dans le formulaire
const select = document.getElementById("offre");
document.querySelectorAll("[data-tour]").forEach(el => {
  el.addEventListener("click", () => { select.value = el.dataset.tour; });
});

// Envoi du formulaire vers WhatsApp
document.getElementById("contact-form").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const texte =
    `Bonjour Vibe Riviera Maya ! Je m'appelle ${f.get("nom")}.\n` +
    `Je suis intéressé(e) par : ${f.get("offre")}\n` +
    `Date : ${f.get("date")} — Personnes : ${f.get("personnes")}\n` +
    (f.get("message") ? `Message : ${f.get("message")}` : "");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texte)}`, "_blank");
});

// Visionneuse des photos de location
const lb = document.getElementById("lightbox");
const lbImg = lb.querySelector("img");
const lbCount = lb.querySelector(".lb-count");
let gal = null, idx = 0;
const pad = n => String(n).padStart(2, "0");
function show(i) {
  idx = (i + gal.count) % gal.count;
  lbImg.src = `images/${gal.name}/${pad(idx + 1)}.jpg`;
  lbCount.textContent = `${idx + 1} / ${gal.count}`;
}
document.querySelectorAll("[data-gallery]").forEach(g => {
  g.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    gal = { name: g.dataset.gallery, count: +g.dataset.count };
    show(+b.dataset.index);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }));
});
function closeLb() { lb.hidden = true; document.body.style.overflow = ""; }
lb.querySelector(".lb-close").addEventListener("click", closeLb);
lb.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
lb.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
document.addEventListener("keydown", e => {
  if (lb.hidden) return;
  if (e.key === "Escape") closeLb();
  if (e.key === "ArrowLeft") show(idx - 1);
  if (e.key === "ArrowRight") show(idx + 1);
});
let tx = 0;
lb.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) show(idx + (d < 0 ? 1 : -1)); });
