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

// Formulaires : notification e-mail (FormSubmit, puis Web3Forms) + contact HubSpot ;
// en cas d'échec, le client peut envoyer sa demande déjà rédigée par e-mail ou WhatsApp.
const EMAIL = "viberivieramaya@gmail.com";
const bookingForm = document.getElementById("contact-form");
const bookingStatus = document.getElementById("booking-status");
const val = (f, k) => (f.get(k) || "").toString().trim();

const WEB3FORMS_KEY = "cc40b092-0033-42b9-8b1f-2b786b70a294"; // clé publique Web3Forms → viberivieramaya@gmail.com


async function postJSON(url, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    return r.ok && String(j.success) === "true";
  } catch (e) { return false; } finally { clearTimeout(timer); }
}

// Notification à l'équipe : FormSubmit (formulaire activé), puis Web3Forms en secours
const FORMSUBMIT_ID = "d6d17f4acf1c6b4d9e85cf68df698246"; // identifiant public FormSubmit → viberivieramaya@gmail.com
async function sendAuto(subject, data, replyto) {
  if (await postJSON(`https://formsubmit.co/ajax/${FORMSUBMIT_ID}`, { _subject: subject, _template: "table", _captcha: "false", ...(replyto ? { _replyto: replyto } : {}), ...data })) return true;
  return sendWeb3(subject, data, replyto);
}

// HubSpot : API officielle des formulaires (identifiants publics, aucune clé secrète dans le site).
// Renseigner HUBSPOT_FORM_GUID une fois le formulaire créé dans HubSpot.
const HUBSPOT_PORTAL_ID = "52374809";
const HUBSPOT_FORM_GUID = "";
async function sendHubSpot(fields, context) {
  if (!HUBSPOT_FORM_GUID) return null; // pas encore configuré
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
      body: JSON.stringify({
        fields: Object.entries(fields).filter(([, v]) => v !== "" && v != null).map(([name, value]) => ({ objectTypeId: "0-1", name, value: String(value) })),
        context,
        legalConsentOptions: { consent: { consentToProcess: true, text: "J'accepte que Vibe Riviera Maya conserve mes informations pour me répondre et me proposer des excursions." } },
      }),
    });
    return r.ok;
  } catch (e) { return false; } finally { clearTimeout(timer); }
}

async function sendWeb3(subject, data, replyto) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, signal: ctrl.signal,
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject, from_name: "Site Vibe Riviera Maya", ...(replyto ? { replyto } : {}), ...data }),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok && j.success === true;
  } catch (e) { return false; } finally { clearTimeout(timer); }
}

async function submitForm(subject, data, statusEl, okTitle, okText, replyto, form, button) {
  statusEl.className = "form-status"; statusEl.textContent = "Envoi en cours…";
  if (button) button.disabled = true;
  const ok = await sendAuto(subject, data, replyto);
  if (button) button.disabled = false;
  if (ok) {
    statusEl.className = "form-status ok"; statusEl.innerHTML = "";
    const t = document.createElement("p"); t.className = "st-title"; t.textContent = okTitle;
    const m = document.createElement("p"); m.textContent = okText;
    statusEl.append(t, m); form.reset();
    statusEl.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    showFallback(subject, data, statusEl);
  }
}

function toText(data) {
  return "Bonjour Vibe Riviera Maya !\n\n" + Object.entries(data).filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`).join("\n");
}

function showFallback(subject, data, statusEl) {
  const body = toText(data);
  statusEl.className = "form-status err"; statusEl.innerHTML = "";
  const t = document.createElement("p");
  t.textContent = "L'envoi automatique n'a pas abouti. Envoyez votre demande en un clic, elle est déjà rédigée :";
  const row = document.createElement("span"); row.className = "fallback-btns";
  const mail = document.createElement("a"); mail.className = "btn btn-dark";
  mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; mail.textContent = "Envoyer par e-mail";
  const wa = document.createElement("a"); wa.className = "btn btn-wa"; wa.target = "_blank"; wa.rel = "noopener";
  wa.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(body)}`; wa.textContent = "Envoyer sur WhatsApp";
  row.append(mail, wa); statusEl.append(t, row);
}

// ---------- Formulaire de découverte ----------
const INTERESTS = {
  catamaran: "Catamarans et sorties en bateau", snorkeling: "Snorkeling et activités nautiques", tortues: "Tortues marines",
  cenotes: "Cenotes et baignades naturelles", aventure: "Aventure extrême et sensations fortes", quad: "Quad et buggy",
  culture: "Culture et traditions mexicaines", archeologie: "Pyramides et sites archéologiques", chichen_itza: "Chichén Itzá",
  tulum: "Tulum et sites mayas", ecotourisme: "Parcs naturels et écotourisme", famille: "Excursions familiales",
  prive_vip: "Expériences privées et VIP", gastronomie: "Gastronomie et découvertes locales",
};
const BUDGETS = { moins_1500: "Moins de 1 500 MXN", "1500_2500": "1 500 à 2 500 MXN", "2500_4000": "2 500 à 4 000 MXN", plus_4000: "Plus de 4 000 MXN" };
const LANGUES = { francais: "Français", anglais: "Anglais", espagnol: "Espagnol" };

document.getElementById("picks").addEventListener("change", () => { document.getElementById("picks-error").hidden = true; });
const kids = document.getElementById("bk-enfants"), agesWrap = document.getElementById("ages-wrap");
const syncAges = () => { agesWrap.hidden = !(+kids.value > 0); };
kids.addEventListener("input", syncAges); syncAges();

function readForm() {
  const f = new FormData(bookingForm);
  const interets = f.getAll("interets");
  return {
    f, interets,
    prenom: val(f, "prenom"), nom: val(f, "nom"), email: val(f, "email"), tel: val(f, "phone"),
    date: val(f, "date"), offre: val(f, "offre"), adultes: val(f, "adultes"), enfants: val(f, "enfants") || "0",
    ages: +val(f, "enfants") > 0 ? val(f, "ages") : "", budget: val(f, "budget"), langue: val(f, "langue"),
    hotel: val(f, "hotel"), message: val(f, "message"),
  };
}
function summary(d) {
  return [
    `Bonjour Vibe Riviera Maya ! Je m'appelle ${d.prenom} ${d.nom}.`,
    d.interets.length ? `Ce qui m'intéresse : ${d.interets.map(i => INTERESTS[i]).join(", ")}` : "",
    d.offre ? `Excursion : ${d.offre}` : "",
    d.date ? `Date souhaitée : ${d.date}` : "",
    `Adultes : ${d.adultes} · Enfants : ${d.enfants}${d.ages ? ` (âges : ${d.ages})` : ""}`,
    d.budget ? `Budget : ${BUDGETS[d.budget]} par personne` : "",
    d.message ? `Message : ${d.message}` : "",
  ].filter(Boolean).join("\n");
}
function waMessage() { return summary(readForm()); }

bookingForm.addEventListener("submit", async e => {
  e.preventDefault();
  const d = readForm();
  if (val(d.f, "_honey")) return;
  const pickErr = document.getElementById("picks-error");
  pickErr.hidden = d.interets.length > 0;
  if (!d.interets.length) { document.getElementById("picks").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  if (!bookingForm.reportValidity()) return;

  const button = bookingForm.querySelector('button[type="submit"]');
  bookingStatus.className = "form-status"; bookingStatus.textContent = "Envoi en cours…";
  button.disabled = true;

  const subject = `Nouvelle demande : ${d.prenom} ${d.nom} · ${d.interets.length} intérêt(s)${d.date ? " · " + d.date : ""}`;
  const notif = {
    "Prénom": d.prenom, "Nom": d.nom, "Courriel": d.email, "WhatsApp": d.tel,
    "Intérêts": d.interets.map(i => INTERESTS[i]).join(", "),
    "Excursion précise": d.offre || "Conseillez-moi", "Date souhaitée": d.date,
    "Adultes": d.adultes, "Enfants": d.enfants, "Âges des enfants": d.ages,
    "Budget par personne": BUDGETS[d.budget] || "Pas de préférence", "Langue": LANGUES[d.langue],
    "Hôtel ou quartier": d.hotel, "Commentaires": d.message,
  };
  const hub = {
    firstname: d.prenom, lastname: d.nom, email: d.email, phone: d.tel, message: d.message,
    vrm_interets: d.interets.join(";"), vrm_excursion_souhaitee: d.offre, vrm_date_souhaitee: d.date,
    vrm_adultes: d.adultes, vrm_enfants: d.enfants, vrm_ages_enfants: d.ages,
    vrm_budget: d.budget, vrm_langue_preferee: d.langue, vrm_hotel: d.hotel, vrm_source: "site_formulaire_decouverte",
  };
  const ctx = { pageUri: location.href, pageName: document.title };
  const [mailOk, hubOk] = await Promise.all([sendAuto(subject, notif, d.email), sendHubSpot(hub, ctx)]);
  button.disabled = false;

  if (mailOk || hubOk) {
    const text = summary(d);
    bookingStatus.className = "form-status ok"; bookingStatus.innerHTML = "";
    const t = document.createElement("p"); t.className = "st-title"; t.textContent = `Merci ${d.prenom} !`;
    const m = document.createElement("p");
    m.textContent = "Votre demande est bien reçue. Stacey vous prépare une sélection d'excursions adaptées et vous répond très vite. Pour aller plus vite, écrivez-nous sur WhatsApp :";
    const row = document.createElement("span"); row.className = "fallback-btns";
    const wa = document.createElement("a"); wa.className = "btn btn-wa"; wa.target = "_blank"; wa.rel = "noopener";
    wa.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`; wa.textContent = "Continuer sur WhatsApp";
    row.append(wa); bookingStatus.append(t, m, row);
    bookingForm.reset(); syncAges();
    bookingStatus.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    showFallback(subject, notif, bookingStatus);
  }
});

document.getElementById("wa-send").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waMessage())}`; a.target = "_blank"; a.rel = "noopener"; a.click();
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
  submitForm(`Nouvel avis client (${val(f, "note")}/5) : ${val(f, "excursion")}`, {
    "Prénom": val(f, "prenom"), "Ville ou pays": val(f, "origine"), "Excursion": val(f, "excursion"),
    "Note": `${val(f, "note")} / 5`, "Avis": val(f, "avis"),
  }, document.getElementById("review-status"), "Merci pour votre avis !", "Il sera publié sur le site après vérification.",
     "", reviewForm, reviewForm.querySelector('button[type="submit"]'));
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
