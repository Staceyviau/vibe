// Numéro WhatsApp (format international, sans + ni espaces) — à remplacer
const WHATSAPP = "520000000000";

document.getElementById("annee").textContent = new Date().getFullYear();

// Menu mobile
const btn = document.querySelector(".menu-btn");
const menu = document.querySelector(".menu");
btn.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => menu.classList.remove("open")));

// Boutons "Réserver" : présélectionne l'offre dans le formulaire
const select = document.getElementById("offre");
document.querySelectorAll("[data-book]").forEach(el => {
  el.addEventListener("click", () => { select.value = el.dataset.book; });
});

// Envoi du formulaire vers WhatsApp
document.getElementById("contact-form").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const texte =
    `Bonjour ! Je m'appelle ${f.get("nom")}.\n` +
    `Je souhaite réserver : ${f.get("offre")}\n` +
    `Date : ${f.get("date")} — Personnes : ${f.get("personnes")}\n` +
    (f.get("message") ? `Message : ${f.get("message")}` : "");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texte)}`, "_blank");
});
