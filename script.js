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
// Lien venant d'une fiche excursion : /?tour=Nom#contact
const tourParam = new URLSearchParams(location.search).get("tour");
if (tourParam) {
  const opt = [...select.options].find(o => o.text === tourParam);
  if (opt) select.value = opt.value;
}

// Réservation : la demande part par e-mail (messagerie du client) vers viberivieramaya@gmail.com,
// ou par WhatsApp. Aucun service extérieur : rien ne peut tomber en panne.
const EMAIL = "viberivieramaya@gmail.com";
const bookingForm = document.getElementById("contact-form");
const bookingStatus = document.getElementById("booking-status");
const val = (f, k) => (f.get(k) || "").toString().trim();

function toText(data) {
  return "Bonjour Vibe Riviera Maya !\n\n" + Object.entries(data).filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`).join("\n");
}

function sendByEmail(subject, data, statusEl, thanks) {
  const body = toText(data);
  window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  statusEl.className = "form-status ok";
  statusEl.innerHTML = "";
  const t = document.createElement("p"); t.className = "st-title"; t.textContent = thanks;
  const s1 = document.createElement("p");
  s1.textContent = "Votre application e-mail vient de s'ouvrir avec votre demande déjà écrite. Il ne vous reste qu'à appuyer sur « Envoyer ».";
  const s2 = document.createElement("p"); s2.className = "st-small";
  s2.textContent = `Votre messagerie ne s'est pas ouverte ? Copiez votre demande et envoyez-la à ${EMAIL}, ou écrivez-nous sur WhatsApp.`;
  const row = document.createElement("span"); row.className = "fallback-btns";
  const copyBtn = document.createElement("button"); copyBtn.type = "button"; copyBtn.className = "btn btn-dark"; copyBtn.textContent = "Copier ma demande";
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(`À : ${EMAIL}\nObjet : ${subject}\n\n${body}`); copyBtn.textContent = "Demande copiée ✓"; }
    catch (e) { copyBtn.textContent = EMAIL; }
  });
  const wa = document.createElement("a"); wa.className = "btn btn-wa"; wa.target = "_blank"; wa.rel = "noopener";
  wa.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(body)}`; wa.textContent = "Envoyer sur WhatsApp";
  row.append(copyBtn, wa);
  statusEl.append(t, s1, s2, row);
}

function waMessage(f) {
  return `Bonjour Vibe Riviera Maya ! Je m'appelle ${val(f, "nom")}.\n` +
    `Je souhaite réserver : ${val(f, "offre")}\n` +
    `Date : ${val(f, "date")} · Adultes : ${val(f, "adultes")} · Enfants : ${val(f, "enfants") || 0}\n` +
    (val(f, "hotel") ? `Hôtel : ${val(f, "hotel")}\n` : "") +
    (val(f, "message") ? `Message : ${val(f, "message")}` : "");
}

bookingForm.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(bookingForm);
  if (val(f, "_honey")) return;
  sendByEmail(`Réservation : ${val(f, "offre")} le ${val(f, "date")}`, {
    "Nom": val(f, "nom"), "E-mail": val(f, "email"), "WhatsApp / téléphone": val(f, "telephone"),
    "Excursion": val(f, "offre"), "Date": val(f, "date"), "Adultes": val(f, "adultes"), "Enfants": val(f, "enfants") || "0",
    "Hôtel / point de rencontre": val(f, "hotel"), "Message": val(f, "message"),
  }, bookingStatus, `Merci ${val(f, "nom").split(" ")[0]} !`);
});

document.getElementById("wa-send").addEventListener("click", () => {
  if (!bookingForm.reportValidity()) return;
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waMessage(new FormData(bookingForm)))}`;
  const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.click();
});

// Avis clients : seuls les avis validés par Vibe Riviera Maya sont ajoutés ici
const AVIS = [
  // { prenom: "Marie", origine: "Montréal", excursion: "Bacalar", note: 5, texte: "…", date: "2026-12" },
];
const reviewsList = document.getElementById("reviews-list");
if (AVIS.length) {
  document.getElementById("reviews-empty").hidden = true;
  AVIS.forEach(a => {
    const el = document.createElement("blockquote");
    el.className = "review";
    el.innerHTML = '<p class="r-stars"></p><p class="r-text"></p><footer><strong></strong> <span></span></footer>';
    el.querySelector(".r-stars").textContent = "★".repeat(a.note) + "☆".repeat(5 - a.note);
    el.querySelector(".r-stars").setAttribute("aria-label", `${a.note} sur 5`);
    el.querySelector(".r-text").textContent = a.texte;
    el.querySelector("strong").textContent = a.prenom + (a.origine ? `, ${a.origine}` : "");
    el.querySelector("span").textContent = "· " + a.excursion;
    reviewsList.appendChild(el);
  });
}
const reviewForm = document.getElementById("review-form");
reviewForm.addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(reviewForm);
  if (val(f, "_honey")) return;
  sendByEmail(`Avis client (${val(f, "note")}/5) : ${val(f, "excursion")}`, {
    "Prénom": val(f, "prenom"), "Ville ou pays": val(f, "origine"), "Excursion": val(f, "excursion"),
    "Note": `${val(f, "note")} / 5`, "Avis": val(f, "avis"),
  }, document.getElementById("review-status"), "Merci pour votre avis !");
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
