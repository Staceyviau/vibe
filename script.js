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


// Tarifs : prix fournisseur + marge de 660 MXN, convertis au taux du jour
const MARGE_MXN = 660;
const fmtNum = n => n.toLocaleString("fr-FR");
function applyRates(r) {
  // r.MXN et r.CAD = combien vaut 1 USD
  document.querySelectorAll(".price[data-usd], .price[data-mxn]").forEach(el => {
    const base = el.dataset.usd ? parseFloat(el.dataset.usd) * r.MXN : parseFloat(el.dataset.mxn);
    const total = Math.ceil((base + MARGE_MXN) / 10) * 10;
    const usd = total / r.MXN;
    el.querySelector(".mxn").textContent = `${fmtNum(total)} MXN`;
    el.querySelector(".fx").textContent = `≈ ${Math.round(usd)} USD · ${Math.round(usd * r.CAD)} CAD`;
  });
  const note = document.getElementById("fx-note");
  if (note) note.textContent = `Taux du jour : 1 USD = ${r.MXN.toFixed(2).replace(".", ",")} MXN · 1 CAD = ${(r.MXN / r.CAD).toFixed(2).replace(".", ",")} MXN`;
}
async function loadRates() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const c = JSON.parse(localStorage.getItem("vrm-fx") || "null");
    if (c && c.date === today) return applyRates(c);
  } catch (e) {}
  const sources = [
    async () => { const d = await (await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN,CAD")).json(); return { MXN: d.rates.MXN, CAD: d.rates.CAD }; },
    async () => { const d = await (await fetch("https://open.er-api.com/v6/latest/USD")).json(); return { MXN: d.rates.MXN, CAD: d.rates.CAD }; },
  ];
  for (const s of sources) {
    try {
      const r = await s();
      if (r.MXN > 5 && r.CAD > 0.5) {
        applyRates(r);
        try { localStorage.setItem("vrm-fx", JSON.stringify({ ...r, date: today })); } catch (e) {}
        return;
      }
    } catch (e) {}
  }
}
loadRates();
