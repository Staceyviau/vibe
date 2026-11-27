// Assistant Vibe : répond aux questions sur les excursions à partir du contenu du site
(() => {
  const WA = "529841306938";
  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
  const has = (q, words) => words.some(w => new RegExp("(^| )" + w).test(q));

  // ---- Interface ----
  const root = document.createElement("div");
  root.className = "vbot";
  root.innerHTML = `
    <button class="vbot-open" type="button" aria-expanded="false" aria-controls="vbot-panel">
      <img class="vbot-avatar" src="images/stacey.jpg" alt="" width="44" height="44"><span>Une question ?</span>
    </button>
    <section class="vbot-panel" id="vbot-panel" role="dialog" aria-label="Assistant Vibe Riviera Maya" hidden>
      <header class="vbot-head">
        <img class="vbot-avatar" src="images/stacey.jpg" alt="Stacey, Vibe Riviera Maya" width="40" height="40">
        <div><strong>Stacey · Vibe Riviera Maya</strong><small>Assistante virtuelle · réponses instantanées, Stacey prend le relais sur WhatsApp</small></div>
        <button type="button" class="vbot-close" aria-label="Fermer l'assistant">×</button>
      </header>
      <div class="vbot-log" aria-live="polite"></div>
      <div class="vbot-chips"></div>
      <form class="vbot-form">
        <label class="vbot-sr" for="vbot-input">Votre question</label>
        <input id="vbot-input" type="text" autocomplete="off" placeholder="Ex. : prix de Bacalar ?" maxlength="300">
        <button type="submit" aria-label="Envoyer">➤</button>
      </form>
    </section>`;
  document.body.appendChild(root);
  const openBtn = root.querySelector(".vbot-open"), panel = root.querySelector(".vbot-panel");
  const log = root.querySelector(".vbot-log"), chips = root.querySelector(".vbot-chips");
  const form = root.querySelector(".vbot-form"), input = root.querySelector("#vbot-input");
  let started = false, lastQuestion = "";

  function setOpen(o) {
    panel.hidden = !o; openBtn.setAttribute("aria-expanded", o); root.classList.toggle("is-open", o);
    if (o) { if (!started) { started = true; greet(); } setTimeout(() => input.focus(), 50); }
  }
  openBtn.addEventListener("click", () => setOpen(panel.hidden));
  root.querySelector(".vbot-close").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) setOpen(false); });

  function bubble(who, build) {
    const b = document.createElement("div");
    b.className = "vbot-msg " + who;
    if (typeof build === "string") b.textContent = build; else build(b);
    log.appendChild(b); log.scrollTop = log.scrollHeight;
    return b;
  }
  const p = (el, text) => { const x = document.createElement("p"); x.textContent = text; el.appendChild(x); return x; };
  function action(el, label, fn) {
    const a = document.createElement("button"); a.type = "button"; a.className = "vbot-act"; a.textContent = label;
    a.addEventListener("click", fn); el.appendChild(a);
  }
  function setChips(list) {
    chips.innerHTML = "";
    list.forEach(t => { const c = document.createElement("button"); c.type = "button"; c.textContent = t; c.addEventListener("click", () => ask(t)); chips.appendChild(c); });
  }
  function goto(sel, tour) {
    setOpen(false);
    if (tour) { const s = document.getElementById("offre"); const o = [...s.options].find(o => o.text === tour); if (o) s.value = o.value; }
    const t = document.querySelector(sel); if (t) { if (t.tagName === "DETAILS") t.open = true; t.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  function waLink(text) {
    const a = document.createElement("a");
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent(text)}`; a.target = "_blank"; a.rel = "noopener"; a.click();
  }

  // ---- Connaissances lues sur la page (prix à jour) ----
  function catalog() {
    const items = [];
    document.querySelectorAll(".day-trip").forEach(d => items.push({
      name: d.querySelector("h3").textContent.trim(), note: d.querySelector(".dt-days")?.textContent.trim() || "",
      prices: [...d.querySelectorAll(".price")].map(priceText), anchor: "#tarifs", tour: d.querySelector("[data-tour]")?.dataset.tour,
      incl: [...d.querySelectorAll("details li")].map(li => li.textContent.trim()), policy: d.querySelector(".policy")?.textContent.trim() || "",
    }));
    document.querySelectorAll(".pr-cat").forEach(cat => cat.querySelectorAll(".pr-row").forEach(r => items.push({
      name: r.querySelector("strong").textContent.trim(), note: r.querySelector("small")?.textContent.trim() || "",
      cat: cat.querySelector("summary span").textContent.trim(), catNote: cat.querySelector("summary small").textContent.trim(),
      prices: [...r.querySelectorAll(".price")].map(priceText), anchor: "#" + cat.id, tour: r.querySelector("strong").textContent.trim(),
    })));
    document.querySelectorAll(".tour").forEach(t => {
      const name = t.querySelector("h3").textContent.trim();
      if (!items.some(i => norm(i.name) === norm(name))) items.push({ name, note: t.querySelector("p").textContent.trim(), prices: [], anchor: "#excursions", tour: t.querySelector("[data-tour]")?.dataset.tour });
    });
    return items;
  }
  function priceText(el) {
    const label = el.querySelector("em")?.textContent.trim() || "";
    const main = el.querySelector("b")?.textContent.trim() || "";
    const fx = el.querySelector(".fx")?.textContent.trim() || "";
    return `${label} : ${main}${fx ? " (" + fx + ")" : ""}`;
  }

  const ALIASES = {
    bacalar: ["bacalar", "7 couleurs", "sept couleurs"], holbox: ["holbox"], contoy: ["contoy"], mujeres: ["mujeres"],
    chichen: ["chichen", "kukulcan", "merveille"], tulum: ["tulum"], coba: ["coba"], akumal: ["akumal", "tortue", "turtle"],
    yalku: ["yalku"], xcaret: ["xcaret"], quad: ["quad", "atv", "vtt", "moto"], cheval: ["cheval", "chevaux", "horse"],
    cenote: ["cenote", "senote"], casatortuga: ["casa tortuga", "tortuga"], siankaan: ["sian", "kaan"], cozumel: ["cozumel", "cielo", "etoile de mer"], recif: ["recif", "snorkel", "plong"],
  };
  function findTours(q) {
    const keys = Object.entries(ALIASES).filter(([, w]) => w.some(x => q.includes(x))).map(([k]) => k);
    if (!keys.length) return [];
    const items = catalog();
    const keyWords = { bacalar: "bacalar", holbox: "holbox", contoy: "contoy", mujeres: "mujeres", chichen: "chichen", tulum: "tulum", coba: "coba",
      akumal: "akumal", yalku: "yalku", xcaret: "xcaret", quad: "quad", cheval: "cheval", cenote: "cenote", casatortuga: "casa tortuga", siankaan: "sian", cozumel: "cozumel", recif: "recif" };
    // excursions qui contiennent TOUS les mots demandés, sinon au moins un
    const by = field => i => keys.filter(k => norm(field(i)).includes(keyWords[k])).length;
    for (const score of [by(i => i.name), by(i => i.name + " " + (i.note || ""))]) {
      const best = Math.max(...items.map(score));
      if (best) {
        const found = items.filter(i => score(i) === best);
        // si des excursions détaillées (avec prix ou programme) existent, on n'affiche pas les cartes sans prix
        const detailed = found.filter(i => i.prices.length || (i.incl && i.incl.length));
        return detailed.length ? detailed : found;
      }
    }
    return [];
  }

  // ---- Réponses ----
  function greet() {
    bubble("bot", b => {
      p(b, "Bonjour ! 👋 Je suis l'assistante virtuelle de Stacey, chez Vibe Riviera Maya.");
      p(b, "Je connais nos 39 excursions, leurs prix du jour, les jours de départ et la réservation. Posez-moi votre question !");
    });
    setChips(["Que me conseillez-vous ?", "Prix de Bacalar", "Tours en quad", "Comment réserver ?", "Transport depuis l'hôtel ?"]);
  }

  function showTours(list, q) {
    const wantsPrice = has(q, ["prix", "tarif", "combien", "cout", "price", "cuanto", "precio"]);
    const wantsIncl = has(q, ["inclu", "compris", "comprend", "include"]);
    const shown = list.slice(0, 4);
    bubble("bot", b => {
      if (list.length > 1) p(b, `J'ai trouvé ${list.length} excursions${list.length > 4 ? " ; voici les 4 premières" : ""} :`);
      shown.forEach(t => {
        const card = document.createElement("div"); card.className = "vbot-card"; b.appendChild(card);
        const h = document.createElement("strong"); h.textContent = t.name; card.appendChild(h);
        if (t.note) p(card, t.note);
        if (t.prices.length) t.prices.forEach(x => p(card, x).className = "vbot-price");
        else if (wantsPrice) p(card, "Prix sur demande : Stacey vous répond sur WhatsApp.").className = "vbot-price";
        if (t.catNote && /taxe/i.test(t.catNote) && !/aucune/i.test(t.catNote) && !/taxe/i.test(t.note)) p(card, t.catNote.split("·").pop().trim());
        if (t.incl && t.incl.length && (wantsIncl || list.length === 1)) { const ul = document.createElement("ul"); t.incl.forEach(i => { const li = document.createElement("li"); li.textContent = i; ul.appendChild(li); }); card.appendChild(ul); }
        if (t.policy && list.length === 1) p(card, t.policy);
        action(card, "Réserver", () => goto("#contact", t.tour || t.name));
      });
      if (list.length > 4) action(b, "Voir toutes les excursions", () => goto(shown[0].anchor));
      p(b, "Prix en pesos mexicains. Le prix final est confirmé à la réservation.").className = "vbot-small";
    });
  }

  const INTENTS = [
    { k: ["bonjour", "salut", "allo", "hello", "hi", "hola", "bonsoir", "coucou"], r: () => bubble("bot", "Bonjour ! 😊 Que puis-je faire pour vous ? Une excursion en tête, une question de prix ou de réservation ?") },
    { k: ["merci", "thank", "gracias", "parfait", "super", "genial"], r: () => bubble("bot", "Avec plaisir ! 💕 Belle journée et à bientôt en Riviera Maya ☀️") },
    { k: ["reserv", "book", "reserver", "booking", "inscri"], r: () => bubble("bot", b => {
      p(b, "Pour réserver, c'est simple :");
      p(b, "1. Remplissez le formulaire de réservation (excursion, date, nombre de personnes, hôtel).");
      p(b, "2. Stacey vérifie la disponibilité et vous confirme l'horaire et le prix final par e-mail ou WhatsApp.");
      p(b, "Aucun paiement en ligne : votre place est confirmée après vérification.");
      action(b, "Aller au formulaire", () => goto("#contact"));
      action(b, "Réserver sur WhatsApp", () => waLink("Bonjour Vibe Riviera Maya ! J'aimerais réserver une excursion."));
    }) },
    { k: ["pai", "payer", "carte", "credit", "cash", "espece", "acompte", "depot", "paypal", "virement"], r: () => bubble("bot", b => {
      p(b, "Il n'y a pas de paiement sur le site. Une fois votre place confirmée, Stacey vous explique les modalités de paiement.");
      p(b, "Pour certaines excursions, comme Holbox au départ de Tulum, un acompte est demandé.");
      action(b, "Poser la question sur WhatsApp", () => waLink("Bonjour ! Quelles sont les modalités de paiement pour une excursion ?"));
    }) },
    { k: ["transport", "hotel", "chercher", "pick", "ramass", "navette", "point de rencontre", "depart d"], r: () => bubble("bot", b => {
      p(b, "La plupart de nos excursions incluent le transport aller-retour depuis votre hôtel ou un point de rencontre, en minibus climatisé.");
      p(b, "Indiquez le nom de votre hôtel dans le formulaire : on vous confirme l'heure et le lieu de rendez-vous.");
      action(b, "Réserver", () => goto("#contact"));
    }) },
    { k: ["enfant", "bebe", "kid", "child", "nino", "famille", "age"], r: () => bubble("bot", b => {
      p(b, "Oui, les enfants sont les bienvenus sur la plupart des excursions ! 👨‍👩‍👧 Les tarifs enfant sont indiqués dans la section Tarifs.");
      p(b, "Sur certaines activités (quad conduit seul, par exemple), il n'y a pas de tarif enfant. Pour une sortie en famille, Xcaret, Bacalar, les cénotes ou Isla Mujeres sont parfaits.");
      action(b, "Voir les tarifs", () => goto("#tarifs"));
    }) },
    { k: ["taxe", "tax", "impot", "entree", "frais"], r: () => bubble("bot", b => {
      p(b, "Certaines entrées ont une taxe à payer en plus, toujours indiquée à l'avance :");
      p(b, "• Tulum : 25 USD\n• Récifs : 25 USD\n• Akumal et Yalkú : 10 USD");
      p(b, "Les excursions de Cobá, des cénotes et de Chichén Itzá de la dernière catégorie n'ont aucune taxe à payer.");
    }) },
    { k: ["apporter", "emporter", "sac", "prevoir", "mettre", "bring", "maillot", "creme"], r: () => bubble("bot", b => {
      p(b, "À prévoir pour une excursion :");
      p(b, "👙 Maillot de bain\n🧴 Crème solaire biodégradable\n🧢 Chapeau et lunettes\n👟 Chaussures d'eau\n🏖️ Serviette et vêtements de rechange\n💵 Un peu d'argent liquide pour les taxes et pourboires\n📱 Une pochette étanche");
    }) },
    { k: ["annul", "rembours", "cancel", "no show", "absence", "modifier"], r: () => bubble("bot", b => {
      p(b, "Les conditions dépendent de l'excursion et vous sont confirmées à la réservation. Par exemple :");
      p(b, "• Holbox : absence le jour du tour = 20 USD par personne\n• Isla Contoy : absence = prix total facturé");
      action(b, "Demander sur WhatsApp", () => waLink("Bonjour ! J'ai une question sur les conditions d'annulation."));
    }) },
    { k: ["langue", "francais", "anglais", "english", "espagnol", "guide"], r: () => bubble("bot", "Vous pouvez réserver en français avec Stacey 🇫🇷🇨🇦 Plusieurs excursions ont un guide bilingue (espagnol et anglais). Demandez-nous pour une excursion précise !") },
    { k: ["whatsapp", "telephone", "appeler", "contact", "joindre", "parler", "humain", "stacey"], r: () => bubble("bot", b => {
      p(b, "Stacey vous répond sur WhatsApp au +52 984 130 6938.");
      action(b, "Écrire sur WhatsApp", () => waLink(lastQuestion ? `Bonjour ! ${lastQuestion}` : "Bonjour Vibe Riviera Maya !"));
    }) },
    { k: ["meteo", "temps", "temperature", "pluie", "saison", "quand venir"], r: () => bubble("bot", "De décembre à avril, c'est la saison sèche : soleil, environ 25 à 30 °C et une mer calme. Idéal pour toutes les excursions ☀️") },
    { k: ["conseil", "recommand", "suggest", "quoi faire", "que faire", "meilleur", "idee", "choisir", "propos"], r: () => {
      bubble("bot", "Avec plaisir ! Qu'est-ce qui vous fait le plus envie ?");
      setChips(["Plage et îles", "Ruines mayas", "Cénotes", "Aventure", "Nager avec les tortues", "En famille"]);
      return true;
    } },
  ];
  const THEMES = [
    { k: ["plage", "ile", "iles", "beach", "island", "turquoise", "lagune"], r: "Pour la plage et les eaux turquoise : Bacalar (la lagune aux 7 couleurs), Holbox, Isla Contoy & Isla Mujeres, ou El Cielo à Cozumel. 🏝️", t: ["Prix de Bacalar", "Holbox", "Isla Contoy"] },
    { k: ["ruine", "maya", "pyramide", "histoire", "culture", "archeo"], r: "Pour la culture maya : Chichén Itzá (merveille du monde), Tulum face à la mer, et Cobá dans la jungle. On peut aussi combiner Tulum et Cobá. 🏛️", t: ["Chichén Itzá", "Tours à Tulum", "Cobá"] },
    { k: ["aventure", "adrenaline", "sensation", "sport"], r: "Pour l'aventure : le quad dans la jungle, les cénotes-grottes, ou les tours Adrenaline qui combinent quad, cénotes et snorkeling. 🏍️", t: ["Tours en quad", "Cénotes", "Cobá Adrenaline"] },
    { k: ["famille", "en famille"], r: "En famille : Xcaret, Bacalar, Isla Mujeres et les cénotes sont parfaits, avec des tarifs enfant. 👨‍👩‍👧", t: ["Xcaret", "Prix de Bacalar", "Cénotes"] },
  ];

  function answer(raw) {
    const q = norm(raw);
    if (!q) return;
    for (const th of THEMES) if (has(q, th.k) && !findTours(q).length) { bubble("bot", th.r); setChips(th.t.concat(["Comment réserver ?"])); return; }
    const tours = findTours(q);
    if (tours.length) { showTours(tours, q); setChips(["Comment réserver ?", "Transport depuis l'hôtel ?", "Les taxes ?", "Autre excursion"]); return; }
    for (const it of INTENTS) if (has(q, it.k)) { const keep = it.r(); if (!keep) setChips(["Que me conseillez-vous ?", "Prix de Bacalar", "Comment réserver ?"]); return; }
    if (has(q, ["prix", "tarif", "combien", "cout", "price", "precio", "cher"])) {
      bubble("bot", b => {
        p(b, "Nos prix sont affichés en pesos mexicains. De quelle excursion parlez-vous ?");
        action(b, "Voir tous les tarifs", () => goto("#tarifs"));
      });
      setChips(["Prix de Bacalar", "Tours en quad", "Chichén Itzá", "Tours à Tulum"]);
      return;
    }
    if (has(q, ["autre"])) { bubble("bot", "Bien sûr ! Écrivez le nom d'un lieu (Tulum, Cobá, Holbox, Akumal…) ou une envie (plage, ruines, aventure)."); return; }
    bubble("bot", b => {
      p(b, "Je n'ai pas la réponse à cette question, mais Stacey peut vous répondre directement 😊");
      action(b, "Envoyer ma question sur WhatsApp", () => waLink(`Bonjour Vibe Riviera Maya ! ${raw}`));
    });
    setChips(["Que me conseillez-vous ?", "Comment réserver ?", "Voir les tarifs"]);
  }

  function ask(text) {
    if (norm(text) === "voir les tarifs") { goto("#tarifs"); return; }
    bubble("me", text); lastQuestion = text;
    const typing = bubble("bot typing", "…");
    setTimeout(() => { typing.remove(); answer(text); }, 450);
  }
  form.addEventListener("submit", e => { e.preventDefault(); const t = input.value.trim(); if (!t) return; input.value = ""; ask(t); });
})();
