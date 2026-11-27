# Régénère le contenu des fiches /excursions/<slug>/ et le catalogue de l'accueil
# à partir de outils/excursions.py.  Usage : python3 outils/fiches.py
import html, re, sys, pathlib
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "outils"))
from excursions import X, CATS, APPORTER

esc = html.escape
WA = "529841306938"


def grab(s, pat, default=""):
    m = re.search(pat, s, re.S)
    return m.group(1) if m else default


def first_price(card):
    m = re.search(r'<span class="price( na)?"([^>]*)>.*?<b( class="mxn")?>([^<]*)</b></span>', card)
    if not m:
        return '<b>Prix sur demande</b>'
    if m.group(1):
        return '<b>Prix sur demande</b>'
    return f'<span class="price"{m.group(2)}><em>dès</em> <b class="mxn">{m.group(4)}</b></span>'


pages = {}
for slug, d in X.items():
    p = ROOT / "excursions" / slug / "index.html"
    s = p.read_text(encoding="utf-8")
    main = grab(s, r"<main>(.*)</main>")
    name_html = grab(main, r"<h1>(.*?)</h1>")
    name = html.unescape(name_html)
    sub = grab(main, r'<p class="x-sub">(.*?)</p>')
    hero = grab(main, r'(<div class="x-hero[^"]*".*?</div>)')
    if "x-hero-brand" in hero:
        hero = f'<div class="x-hero" style="background-image:url({d["img"]})" role="img" aria-label="{esc(name)}"></div>'
    gallery = grab(main, r'(<div class="x-gallery">.*?</div>)')
    card = grab(main, r'(<div class="x-card">.*?</div>\s*</div>)')
    facts = grab(main, r'(<dl class="x-facts">.*?</dl>)')
    facts = re.sub(r"<div><dt>Durée</dt>.*?</div>", "", facts)
    facts = facts.replace('<dl class="x-facts">', f'<dl class="x-facts"><div><dt>Durée</dt><dd>{esc(d["dur"])}</dd></div>', 1)
    incl = grab(main, r'(<section class="x-block"><h2>Ce qui est inclus</h2>.*?</section>)')
    taxe = html.unescape(grab(facts, r"<dt>Taxe</dt><dd>(.*?)</dd>"))
    jours = html.unescape(re.sub("<[^>]+>", "", grab(facts, r"<dt>Jours</dt><dd>(.*?)</dd>")))
    incl_items = [html.unescape(re.sub("<[^>]+>", "", x)) for x in re.findall(r"<li>(.*?)</li>", incl)]
    policy = html.unescape(grab(incl, r'<p class="x-policy">(.*?)</p>'))
    pages[slug] = dict(name=name, card=card, price=first_price(card), sub=html.unescape(sub),
                       prices=grab(card, r'(<div class="pr-prices">.*?</div>)'), jours=jours, taxe=taxe,
                       incl="|".join(incl_items), policy=policy)

    prog = "".join(f"<li>{esc(x)}</li>" for x in d["prog"])
    kinds = d["t"].split()
    app = [a for k in ("eau", "site", "quad") if k in kinds for a in APPORTER[k]] + APPORTER["toujours"]
    app_html = "".join(f"<li>{esc(a)}</li>" for a in app)
    note = []
    if taxe:
        note.append(f"{taxe} : à payer sur place, en argent liquide.")
    note.append("L'horaire de départ et le point de rencontre vous sont confirmés au moment de la réservation. Une question ? Écrivez-nous sur WhatsApp.")
    note_html = "".join(f"<p>{esc(n)}</p>" for n in note)
    related = [k for k, v in X.items() if v["cat"] == d["cat"] and k != slug][:3]
    rel_html = "".join(
        f'<a class="x-rel" href="/excursions/{k}/"><img src="{X[k]["img"]}" alt="" loading="lazy"><span>{grab((ROOT/"excursions"/k/"index.html").read_text(encoding="utf-8"), r"<h1>(.*?)</h1>")}</span></a>'
        for k in related)
    resa = f"/?tour={quote(name)}#contact"
    wa = f"https://wa.me/{WA}?text=" + quote(f"Bonjour Vibe Riviera Maya ! Je souhaite réserver l'excursion « {name} ». Date : … · Personnes : …")

    new_main = f"""
    {hero}
    <article class="container x-main">
      <p class="kicker">{esc(CATS[d["cat"]])}</p>
      <h1>{name_html}</h1>
      <p class="x-sub">{sub}</p>
      <p class="x-dur"><span>⏱ {esc(d["dur"])}</span></p>
      <p class="x-intro">{esc(d["desc"])}</p>
      {gallery}
      {card}
      {facts}
      <section class="x-block"><h2>Au programme</h2><ol class="x-prog">{prog}</ol></section>
      {incl}
      <section class="x-block"><h2>À prévoir</h2><ul class="x-incl">{app_html}</ul></section>
      <section class="x-block"><h2>Bon à savoir</h2>{note_html}</section>
      <section class="x-block x-cta"><h2>Prêt à partir ?</h2><p>Envoyez-nous votre date et le nombre de personnes, on s'occupe du reste.</p><div class="x-actions"><a class="btn btn-dark" href="{resa}">Réserver cette excursion</a><a class="btn btn-wa-solid" href="{wa}" target="_blank" rel="noopener">Réserver sur WhatsApp</a></div></section>
      {"<section class='x-block'><h2>Vous aimerez aussi</h2><div class='x-rels'>" + rel_html + "</div></section>" if rel_html else ""}
      <p class="x-back"><a href="/#excursions">← Toutes nos excursions</a></p>
    </article>
    <div class="x-sticky"><div class="x-sticky-price">{pages[slug]["price"]}</div><a class="btn btn-dark" href="{resa}">Réserver</a></div>
  """
    s = s.replace(main, new_main)
    s = s.replace('href="/#tarifs"', 'href="/#excursions"')
    p.write_text(s, encoding="utf-8")

# Catalogue de l'accueil
chips = '<button class="chip on" data-cat="all">Toutes</button>' + "".join(
    f'<button class="chip" data-cat="{k}">{esc(v)}</button>' for k, v in CATS.items())
cards = []
for cat in CATS:
    for slug, d in X.items():
        if d["cat"] != cat:
            continue
        pg = pages[slug]
        attrs = f'data-tour="{esc(pg["name"])}" data-dur="{esc(d["dur"])}" data-days="{esc(pg["jours"])}" data-tax="{esc(pg["taxe"])}" data-incl="{esc(pg["incl"])}" data-policy="{esc(pg["policy"])}"'
        cards.append(f"""          <a class="xc" href="/excursions/{slug}/" data-cat="{cat}" {attrs}>
            <span class="xc-img"><img src="{d["img"]}" alt="{esc(pg["name"])}" loading="lazy" decoding="async"></span>
            <span class="xc-body">
              <span class="xc-cat">{esc(CATS[cat])}</span>
              <span class="xc-name">{esc(pg["name"])}</span>
              <span class="xc-sub">{esc(pg["sub"])}</span>
              <span class="xc-meta"><span>⏱ {esc(d["dur"])}</span><span class="xc-price">{pg["price"]}</span></span>
              <span class="xc-go">Voir la fiche →</span>
              <span class="xc-prices" hidden>{pg["prices"]}</span>
            </span>
          </a>""")
catalog = f"""<!-- CATALOGUE:debut (généré par outils/fiches.py) -->
    <section id="excursions" class="section">
      <span id="tarifs" class="anchor"></span>
      <div class="container">
        <div class="section-head">
          <p class="kicker">Toutes nos excursions</p>
          <h2>Choisissez votre aventure</h2>
          <p class="sub">Toutes nos excursions partent de Playa del Carmen et de la Riviera Maya. Prix en pesos mexicains, par personne. Touchez une excursion pour voir sa fiche complète : durée, programme et réservation.</p>
        </div>
        <div class="chips" role="group" aria-label="Filtrer les excursions">{chips}</div>
        <div class="xcs">
{chr(10).join(cards)}
        </div>
      </div>
    </section>
    <!-- CATALOGUE:fin -->"""
idx = ROOT / "index.html"
s = idx.read_text(encoding="utf-8")
if "<!-- CATALOGUE:debut" in s:
    s = re.sub(r"<!-- CATALOGUE:debut.*?<!-- CATALOGUE:fin -->", lambda m: catalog, s, flags=re.S)
else:
    a = s.index('<section id="excursions"')
    b = s.index('<section id="apropos"')
    s = s[:a] + catalog + "\n\n    " + s[b:]
idx.write_text(s, encoding="utf-8")
print(f"{len(pages)} fiches et le catalogue mis à jour")
