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
