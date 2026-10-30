import "./guard.mjs";
// Wolf Lab v3: home, hub (RUN RIDE TRAIN FUEL RACE GEAR), Wolf Engine, metodologia, guida decisionale, dati per i filtri.
// Pagine in file .html alla radice (si servono come /run, /engine...). Esegui: node tools/build-engine.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const ROOT = path.resolve(import.meta.dirname, "..");
const SITE = "https://wolflabsystem.com";
const rd = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const RACES = rd("content/races.json"), TRIPS = rd("content/trips.json");
const ver = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, f))).digest("hex").slice(0, 10);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wr = (file, txt) => { const p = path.join(ROOT, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, txt); };

// ---------- Indirizzi ----------
const R = {
  home: ["/", "/en/"], engine: ["/engine", "/en/engine"], run: ["/run", "/en/run"], ride: ["/ride", "/en/ride"], swim: ["/swim", "/en/swim"], train: ["/train", "/en/train"],
  fuel: ["/fuel", "/en/fuel"], race: ["/race", "/en/race"], gear: ["/gear", "/en/gear"],
  method: ["/metodologia", "/en/methodology"], decide: ["/piramidale-o-polarizzato", "/en/pyramidal-or-polarized"],
};
const L = { races: ["/gare/", "/en/races/"], trips: ["/viaggi/", "/en/trips/"], training: ["/allenamento/", "/en/training/"], news: ["/novita/", "/en/news/"], articles: ["/articoli/", "/en/articles/"], contact: ["/contatti/", "/en/contact/"] };
const art = (lang, it, en) => (lang === 0 ? `/articoli/${it}/` : `/en/articles/${en}/`);

const NAV = [["RUN", "run"], ["RIDE", "ride"], ["SWIM", "swim"], ["TRAIN", "train"], ["FUEL", "fuel"], ["RACE", "race"], ["GEAR", "gear"]];

function layout({ lang, key, title, desc, body, dark = false, extra = "" }) {
  const it = lang === 0, pathname = R[key][lang], alt = R[key][1 - lang];
  const nav = NAV.map(([n, k]) => `<a href="${R[k][lang]}"${key === k ? ' aria-current="page"' : ""}>${n}</a>`).join("") + `<a class="nav-engine" href="${R.engine[lang]}"${key === "engine" ? ' aria-current="page"' : ""}>WOLF ENGINE</a>`;
  const full = key === "home" ? "Wolf Lab - Endurance. Engineered." : `${title} - Wolf Lab`;
  return `<!doctype html>
<html lang="${it ? "it" : "en"}" class="wolf2"${dark ? ' data-theme-default="dark"' : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0A0A0A">
<script>try{var t=localStorage.getItem("wolf-theme");var d=document.documentElement;if(t==="dark"||(!t&&d.hasAttribute("data-theme-default")))d.setAttribute("data-theme","dark")}catch(e){}</script>
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${pathname}">
<link rel="alternate" hreflang="${it ? "it" : "en"}" href="${SITE}${pathname}">
<link rel="alternate" hreflang="${it ? "en" : "it"}" href="${SITE}${alt}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}${pathname}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${ver("assets/site.css")}">
<script defer src="/assets/site.js?v=${ver("assets/site.js")}"></script>${extra}
</head>
<body>
<a class="skip" href="#main">${it ? "Vai al contenuto" : "Skip to content"}</a>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${R.home[lang]}">WOLF<span class="brand-word">LAB<span class="brand-dot">.</span></span></a>
    <nav class="nav" aria-label="${it ? "Principale" : "Main"}">${nav}</nav>
    <a class="lang" href="${alt}" hreflang="${it ? "en" : "it"}" lang="${it ? "en" : "it"}">${it ? "English" : "Italiano"}</a>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <nav class="foot-links" aria-label="${it ? "Piè di pagina" : "Footer"}"><a href="${R.method[lang]}">${it ? "Metodologia" : "Methodology"}</a> <a href="${L.articles[lang]}">${it ? "Articoli" : "Articles"}</a> <a href="${L.training[lang]}">${it ? "Libreria" : "Library"}</a> <a href="${L.news[lang]}">${it ? "Novità" : "News"}</a> <a href="${L.contact[lang]}">${it ? "Contatti" : "Contact"}</a> <a href="${lang ? "/en/feed.xml" : "/feed.xml"}">RSS</a> <a href="https://www.instagram.com/wolflabsystem/" rel="noopener me" target="_blank">Instagram</a></nav>
  </div>
</footer>
</body>
</html>
`;
}

// Intestazione di pagina interna: titolo grande su nero, kicker e frase
const hero = (kicker, h1, lede) => `<header class="w-page-hero"><div class="wrap"><p class="w-kicker">${kicker}</p><h1>${h1}</h1>${lede ? `<p class="w-lede">${lede}</p>` : ""}</div></header>`;

// ---------- Articoli (per la home) ----------
function articles(lang) {
  const dir = path.join(ROOT, "content/articles"), out = [];
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/\.(it|en)\.html$/); if (!m || m[1] !== (lang ? "en" : "it")) continue;
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    out.push(JSON.parse(raw.match(/<!--meta\s*([\s\S]*?)-->/)[1]));
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

// ---------- Hub ----------
// item: [titolo, riga, link|null]  (null = in preparazione)
const HUBS = {
  run: {
    kicker: ["RUN", "RUN"], title: ["Correre meglio, con i numeri giusti.", "Run better, with the right numbers."],
    noLede: true, lede: ["Ritmi, soglia, gare e scarpe. Parti dai tuoi tempi: il Wolf Engine li trasforma in ritmi di allenamento.", "Paces, threshold, races and shoes. Start from your times: Wolf Engine turns them into training paces."],
    groups: [
      [["Ritmi e VDOT", "Dai tuoi tempi di gara ai ritmi di allenamento.", "engine#f-t5k"], ["Passaggi di gara", "Ritmo costante o negative split, ogni 5 km.", "engine#f-goal"], ["Metodi di allenamento", "Piramidale, polarizzato, modello norvegese.", "training#allenamento"], ["Come scegliere: piramidale o polarizzato", "Cosa dicono gli studi e cosa fare.", "decide"]],
      [["Scarpe con piastra in carbonio", "Cosa dicono gli studi.", ["/articoli/scarpe-con-piastra-carbonio/", "/en/articles/carbon-plate-running-shoes/"]], ["Scarico pre-gara", "Come ridurre il carico prima della gara.", ["/articoli/scarico-pre-gara/", "/en/articles/race-taper/"]], ["Maratone e mezze", "Date, quote e logistica.", "races"]],
    ],
  },
  ride: {
    kicker: ["RIDE", "RIDE"], title: ["Pedalare con la potenza come linguaggio.", "Ride with power as the language."],
    noLede: true, lede: ["FTP, zone e granfondo. Inserisci la FTP nel Wolf Engine e ottieni zone e potenza endurance.", "FTP, zones and gran fondos. Enter your FTP in Wolf Engine for zones and endurance power."],
    groups: [
      [["FTP e zone di potenza", "Zone di Coggan calcolate dalla tua FTP.", "engine#f-ftp"], ["FTP: come si misura", "Test, limiti e uso pratico.", ["/articoli/ftp-e-zone-di-potenza/", "/en/articles/ftp-and-power-zones/"]], ["Quanta intensità serve", "Distribuzione dell'intensità in pratica.", ["/articoli/quanta-intensita-serve/", "/en/articles/how-much-intensity/"]]],
      [["Granfondo", "Nove Colli, Maratona dles Dolomites, Étape du Tour.", "races"], ["Ciclocomputer e bici", "Novità e annunci datati.", "news"], ["Mete per la bici", "Maiorca, Calpe, Tenerife.", "trips"]],
    ],
  },
  swim: {
    kicker: ["SWIM", "SWIM"], title: ["Nuoto: metodi, tecnica, piscina, acque libere e gare.", "Swimming: methods, technique, pool, open water and races."],
    lede: ["Guide con fonti e limiti dichiarati, più un calcolatore di velocità critica con controlli sui dati. Zone di nuoto non ancora disponibili.", "Guides with sources and declared limits, plus a critical swim speed calculator with data checks. Swim zones are not available yet."],
    groups: [],
    sections: [
      ["metodi", ["Metodi di allenamento", "Training methods"], [
        ["Distribuzione dell'intensità", "Polarizzato, a soglia, piramidale: cosa fanno i nuotatori per distanza di gara.", ["/articoli/nuoto-metodi-di-allenamento/", "/en/articles/swim-training-methods/"]],
        ["HIIT e basso volume", "Cosa riportano meta-analisi e revisioni, con l'età dei gruppi studiati.", ["/articoli/nuoto-metodi-di-allenamento/", "/en/articles/swim-training-methods/"]],
        ["Forza a secco", "Miglioramenti medi riportati e perché non c'è un metodo migliore.", ["/articoli/nuoto-metodi-di-allenamento/", "/en/articles/swim-training-methods/"]],
        ["Scarico prima della gara", "Meta-analisi su atleti di più sport: 2 settimane, volume ridotto del 41-60%.", ["/articoli/nuoto-metodi-di-allenamento/", "/en/articles/swim-training-methods/"]],
      ], ["Methods", "Methods"]],
      ["tecnica", ["Tecnica", "Technique"], [
        ["Frequenza e lunghezza di bracciata", "Cosa si misura, come cambia con la fatica, perché non diamo valori obiettivo.", ["/articoli/nuoto-tecnica-bracciata/", "/en/articles/swim-stroke-technique/"]],
      ], ["Technique", "Technique"]],
      ["piscina", ["Piscina e velocità critica", "Pool and critical speed"], [
        ["Sedute di nuoto", "Struttura di una seduta, tre esercizi di respirazione, pull buoy: Swim England e U.S. Masters Swimming.", ["/articoli/nuoto-sedute-esercizi-transizione/", "/en/articles/swim-sessions-drills-transition/"]],
        ["Calcolatore CSS", "Due prove, controlli di coerenza, nessuna zona. Funziona nel browser.", ["/articoli/nuoto-css-velocita-critica/#s5", "/en/articles/swim-critical-speed/#s5"]],
        ["Velocità critica (CSS)", "Come si calcola, 16 protocolli in 41 studi, limiti del metodo.", ["/articoli/nuoto-css-velocita-critica/", "/en/articles/swim-critical-speed/"]],
      ], ["Pool", "Pool"]],
      ["acque-libere", ["Acque libere", "Open water"], [
        ["Sicurezza e acqua fredda", "Raccomandazioni RNLI, shock da acqua fredda, attrezzatura.", ["/articoli/nuoto-acque-libere-sicurezza/#s2", "/en/articles/open-water-swimming-safety/#s2"]],
        ["Orientamento (sighting)", "Come guardare avanti in acque libere: indicazioni Swim England e uno studio sulla resistenza.", ["/articoli/nuoto-orientamento-sighting/", "/en/articles/swim-open-water-sighting/"]],
        ["Regole FIN (Master)", "Tipologie, boa, temperatura e tempo massimo nelle gare Master FIN 2025-2026.", ["/articoli/nuoto-acque-libere-regole-fin-master/", "/en/articles/swim-open-water-italy-fin-masters/"]],
        ["Muta", "Cosa riporta una revisione sistematica e dove vale il regolamento dell'evento.", ["/articoli/nuoto-acque-libere-sicurezza/#s5", "/en/articles/open-water-swimming-safety/#s5"]],
      ], ["Open water", "Open water"]],
      ["gare", ["Gare e formati", "Races and formats"], [
        ["Nuoto in acque libere", "Programma olimpico dal regolamento World Aquatics.", ["/articoli/nuoto-gare-e-formati/#s2", "/en/articles/swim-race-formats/#s2"]],
        ["Triathlon", "Formati Standard e Sprint secondo World Triathlon: il nuoto è la prima frazione.", ["/articoli/nuoto-gare-e-formati/#s3", "/en/articles/swim-race-formats/#s3"]],
        ["Muta e prima transizione", "Tabella sulla muta e regole di T1 dal regolamento World Triathlon.", ["/articoli/nuoto-sedute-esercizi-transizione/#s6", "/en/articles/swim-sessions-drills-transition/#s6"]],
        ["Calendari ufficiali", "Collegamenti a FIN, IRONMAN e HYROX: nessuna copia dei calendari.", ["/articoli/nuoto-gare-e-formati/#s6", "/en/articles/swim-race-formats/#s6"]],
        ["Ritmo di gara e nuoto nel triathlon", "Pacing per distanza in piscina e intensità del nuoto nel triathlon: cosa dicono due revisioni.", ["/articoli/nuoto-ritmo-gara-triathlon/", "/en/articles/swim-pacing-triathlon/"]],
        ["Piscina e acque libere", "Cosa cambia nella bracciata tra piscina e acque libere in triatleti élite: uno studio.", ["/articoli/nuoto-piscina-acque-libere/", "/en/articles/swim-pool-vs-open-water/"]],
        ["HYROX e mezzo IRONMAN: studi", "Due piccoli studi su atleti amatoriali: cosa hanno misurato e i limiti.", ["/articoli/hyrox-triathlon-lungo-studi/", "/en/articles/hyrox-long-triathlon-studies/"]],
        ["IRONMAN e 70.3", "Contesto multisport: distanze dichiarate dall'organizzatore.", ["/articoli/nuoto-gare-e-formati/#s4", "/en/articles/swim-race-formats/#s4"]],
        ["HYROX", "Disciplina separata: corsa e stazioni di forza, senza nuoto.", ["/articoli/nuoto-gare-e-formati/#s5", "/en/articles/swim-race-formats/#s5"]],
      ], ["Races", "Races"]],
      ["mancano", ["Non ancora disponibile", "Not available yet"], [
        ["Zone di nuoto", "Richiedono un test tuo e una fonte valida per il tuo gruppo.", null],
        ["Piani personalizzati", "Nessun piano su misura né sedute in numeri: servono fonti valide e qualcuno che ti veda nuotare.", null],
        ["Altri esercizi tecnici", "Non ancora trattati, oltre a respirazione, pull buoy e orientamento.", null],
      ], ["Missing", "Missing"]],
    ],
  },
  train: {
    kicker: ["TRAIN", "TRAIN"], title: ["Forza, ibrido, prestazione e recupero.", "Strength, hybrid, performance and recovery."],
    noLede: true, lede: ["Dove corsa e bici si incontrano con la forza. Qui trovi anche i concetti di prestazione e di recupero.", "Where running and cycling meet strength. Performance and recovery concepts live here too."],
    groups: [
      [["Forza: catalogo e schede", "Catalogo di esercizi e schede metodologiche dei programmi.", ["/train/strength/", "/en/train/strength/"]], ["Libreria dei metodi", "Corsa, ciclismo e pesi: cosa dicono le prove.", "training#allenamento"], ["Forza per l'endurance", "Quanta, quando, con quali limiti.", ["/articoli/forza-per-endurance/", "/en/articles/strength-for-endurance/"]], ["Bici per la maratona", "Cosa trasferisce e cosa no.", ["/articoli/bici-per-la-maratona/", "/en/articles/cycling-for-the-marathon/"]]],
    ],
    sections: [
      ["performance", ["Prestazione", "Performance"], [
        ["VDOT", "Indice di Daniels e Gilbert che converte una gara in un valore confrontabile con il VO₂max; serve a ritmi e prestazioni equivalenti.", "engine#f-t5k"],
        ["FTP", "Potenza massima sostenibile in condizioni stabili per circa un'ora; si stima da un test (20 minuti × 0,95).", "engine#f-ftp"],
        ["Soglia", "Le due soglie dividono l'intensità in tre zone; i valori cambiano con il metodo di misura.", "training#allenamento"],
        ["VO₂max", "Massimo consumo di ossigeno, misurato in laboratorio: dice quanto è grande il motore, non come lo usi.", null],
        ["Durability", "Quanto tardi e quanto peggiorano i parametri fisiologici durante l'esercizio prolungato (Maunder et al., 2021).", null],
        ["Fatica e carico", "Quanta intensità serve davvero e come distribuirla.", ["/articoli/quanta-intensita-serve/", "/en/articles/how-much-intensity/"]],
      ], ["Performance", "Performance"]],
      ["recovery", ["Recupero", "Recovery"], [
        ["Sonno", "Cosa dicono gli studi sul sonno e sulla prestazione.", ["/articoli/sonno-e-recupero/", "/en/articles/sleep-and-recovery/"]],
        ["Scarico", "Ridurre il carico prima della gara senza perdere forma.", ["/articoli/scarico-pre-gara/", "/en/articles/race-taper/"]],
        ["HRV", "", null], ["FC a riposo", "", null],
      ], ["Recovery", "Recovery"]],
    ],
  },
  fuel: {
    kicker: ["FUEL", "FUEL"], title: ["Carboidrati, fluidi e strategia di gara.", "Carbohydrate, fluids and race strategy."],
    noLede: true, lede: ["Dal pasto pre-gara ai grammi all'ora. I numeri vengono da linee guida citate, non da mode.", "From the pre-race meal to grams per hour. Numbers come from cited guidelines, not fads."],
    groups: [
      [["Carboidrati all'ora", "Il Wolf Engine li calcola dalla durata.", "engine#f-duration"], ["Calcolatore carboidrati in gara", "Gel, grammi e tempi di assunzione.", "training#carboidrati"], ["Carboidrati in maratona", "Linee guida e limiti.", ["/articoli/carboidrati-maratona/", "/en/articles/marathon-carbohydrates/"]], ["Caffeina", "Dosi, tempi e quando evitarla.", ["/articoli/caffeina-e-prestazione/", "/en/articles/caffeine-and-performance/"]]],
      [["Nutrizione", "Fonti di carboidrati, proteine e grassi.", "training#nutrizione"], ["Integratori", "Come leggere le evidenze.", "training#integratori"], ["Idratazione ed elettroliti", "Punto di partenza e sudore personale.", "engine#f-duration"]],
    ],
  },
  race: {
    kicker: ["RACE", "RACE"], title: ["Scegliere la gara. Preparare il viaggio.", "Pick the race. Plan the trip."],
    lede: ["Gare e training camp con fonti e data di verifica. Filtri per sport, paese, mese e tipo di iscrizione.", "Races and training camps with sources and check dates. Filters by sport, country, month and entry type."],
    groups: [
      [["Gare", "Maratone, mezze e granfondo con date, quote e iscrizioni.", "races"], ["Nuoto, triathlon, IRONMAN e HYROX", "Distanze e formati dagli enti ufficiali, con i collegamenti ai loro calendari.", ["/articoli/nuoto-gare-e-formati/", "/en/articles/swim-race-formats/"]], ["Training camp e viaggi", "Altura, bici e corsa: dove, quando, quanto.", "trips"], ["Passaggi di gara", "Calcolali dal tuo obiettivo.", "engine#f-goal"], ["Scarico pre-gara", "Le ultime due settimane.", ["/articoli/scarico-pre-gara/", "/en/articles/race-taper/"]]],
    ],
  },
  gear: {
    kicker: ["GEAR", "GEAR"], title: ["Dal comunicato alla decisione.", "From press release to decision."],
    lede: ["Dati dichiarati dai produttori e fonti consultabili.", "Manufacturer-declared data with sources to read."],
    groups: [
      [["Novità", "Orologi, ciclocomputer, scarpe, bici: annunci datati con fonti.", "news"], ["Scarpe con piastra in carbonio", "Cosa dicono gli studi.", ["/articoli/scarpe-con-piastra-carbonio/", "/en/articles/carbon-plate-running-shoes/"]], ["Come valutiamo", "Livelli di prova e fonti.", "method"]],
    ],
    levels: true,
  },
};

const resolve = (lang, tgt) => {
  if (Array.isArray(tgt)) return tgt[lang];
  const [k, rawHash] = tgt.split("#");
  const h = lang && k === "training" ? ({allenamento:"training",carboidrati:"carbs",nutrizione:"nutrition",integratori:"supplements"}[rawHash] || rawHash) : rawHash;
  const base = L[k] ? L[k][lang] : R[k][lang];
  return h ? `${base}#${h}` : base;
};
const en2 = (it, en) => ({ it, en }); // helper non usato
const EN_TXT = JSON.parse(fs.readFileSync(path.join(ROOT, "content/hubs-en.json"), "utf8"));

function itemHtml(lang, [t, line, tgt], i) {
  const tt = lang ? (EN_TXT[t]?.[0] ?? t) : t, ll = lang ? (EN_TXT[t]?.[1] ?? line) : line;
  const num = String(i + 1).padStart(2, "0");
  if (!tgt) return '';
  if (false) return `<li class="w-item soon"><span class="w-num">${num}</span><span class="w-txt"><b>${esc(tt)}</b>${ll ? `<small>${esc(ll)}</small>` : ""}</span><em>${lang ? "in preparation" : "in preparazione"}</em></li>`;
  return `<li class="w-item"><a href="${resolve(lang, tgt)}"><span class="w-num">${num}</span><span class="w-txt"><b>${esc(tt)}</b><small>${esc(ll)}</small></span><span class="w-go" aria-hidden="true">→</span></a></li>`;
}

function hub(lang, key) {
  const h = HUBS[key], it = !lang;
  let body = hero(h.kicker[0], h.title[lang], h.noLede ? "" : h.lede[lang]);
  body += `<div class="wrap w-body">`;
  for (const g of h.groups) body += `<ul class="w-list">${g.filter(x => x[2]).map((x, i) => itemHtml(lang, x, i)).join("")}</ul>`;
  for (const s of h.sections || []) body += `<section id="${s[0]}" class="w-section"><h2>${s[1][lang]}</h2><ul class="w-list">${s[2].filter(x => x[2]).map((x, i) => itemHtml(lang, x, i)).join("")}</ul></section>`;
  body += `<p class="w-foot"><a class="w-cta" href="${R.engine[lang]}">${it ? "Apri il Wolf Engine" : "Open Wolf Engine"} <span aria-hidden="true">→</span></a></p></div>`;
  return layout({ lang, key, title: h.kicker[0], desc: h.lede[lang], body });
}

// ---------- Home ----------
function home(lang) {
  const it = !lang, A = articles(lang);
  const feat = A.find((a) => a.id === "bici-per-la-maratona") || A[0], rest = A.filter((a) => a !== feat).slice(0, 2);
  const nC = RACES.races.filter((r) => r.course).length, nR = RACES.races.filter((r) => r.listed !== false).length, nT = TRIPS.trips.length, nA = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "content/article-review.json"), "utf8"))).length;
  const link = (a) => art(lang, a.slug, a.slug);
  const tiles = [["RUN", it ? "Ritmi · Scienza · Scarpe" : "Paces · Science · Shoes", "run"], ["RIDE", it ? "Potenza · Zone · Granfondo" : "Power · Zones · Gran fondo", "ride"], ["TRAIN", it ? "Forza · Ibrido · Recupero" : "Strength · Hybrid · Recovery", "train"], ["FUEL", it ? "Carboidrati · Fluidi · Gara" : "Carbs · Fluids · Race day", "fuel"], ["RACE", it ? "Gare · Training camp" : "Races · Training camps", "race"], ["GEAR", it ? "Novità · Scarpe · Tech" : "News · Shoes · Tech", "gear"]];
  const body = `<section class="w-hero"><div class="wrap w-hero-grid">
  <div class="w-hero-copy">
    <h1 lang="en"><span>ENDURANCE.</span><span class="acc">ENGINEERED.</span></h1>
    <p class="w-serif"><em>Understand. Compare. Choose. Perform.</em></p>
    <p class="w-strip">Evidence-based endurance intelligence for runners, cyclists, swimmers and hybrid athletes.</p>
    <p class="w-btns"><a class="w-btn" href="${R.engine[lang]}">BUILD YOUR ENGINE <span aria-hidden="true">→</span></a><a class="w-btn w-btn-ghost" href="${lang ? "/en/picks/" : "/picks/"}">EXPLORE WOLF PICKS <span aria-hidden="true">→</span></a></p>
  </div>
  <div class="sport-photo w-hero-img" role="img" aria-label="${it ? "Nuotatore, ciclista e runner al tramonto in una scena scura" : "Swimmer, cyclist and runner at sunset in a dark scene"}"><img class="w-hero-logo" src="/assets/brand/logo-on-dark.svg" alt="" width="300" height="71" decoding="async"></div>
</div></section>
<nav class="pk-quick" aria-label="Wolf"><div class="wrap"><a href="${lang ? "/en/articles/" : "/articoli/"}">Latest Analysis</a><a href="${lang ? "/en/picks/" : "/picks/"}">Wolf Picks</a><a href="${lang ? "/en/picks/compare-evo-sl-novablast-6-ghost-18/" : "/picks/confronto-evo-sl-novablast-6-ghost-18/"}">Comparisons</a><a href="${R.engine[lang]}">Tools</a><a href="${lang ? "/en/races/" : "/gare/"}">Race Database</a></div></nav>
<section class="w-band"><div class="wrap">
  <p class="w-kicker">THE WOLF ENGINE</p>
  <h2 class="w-big">Calculate. Understand. Perform.</h2>
  <ul class="w-tools">${[["PACE","run",["Ritmi di allenamento dai tuoi tempi recenti.","Training paces from your recent times."]],["FTP","ride",["Zone di potenza dalla tua FTP.","Power zones from your FTP."]],["FUEL","fuel",["Carboidrati e liquidi per la gara.","Carbohydrate and fluids for race day."]],["RACE","race",["Passaggi di gara dal tempo obiettivo.","Race splits from your target time."]],["ZONES","ride",["Zone di potenza e cardio.","Power and heart-rate zones."]]].map(([n,k,d])=>`<li><a href="${R.engine[lang]}#${k}"><b>${n}</b><span>${d[lang]}</span><em>${it?"FUNZIONANTE":"WORKING"}</em></a></li>`).join("")}<li class="dev"><a href="${R.engine[lang]}#swim"><b>SWIM</b><span>${it?"CSS dai tuoi test su 200 e 400 m. Zone di nuoto non ancora disponibili.":"CSS from your 200 m and 400 m trials. Swim zones not available yet."}</span><em>${it?"PARZIALE · ZONE IN SVILUPPO":"PARTIAL · ZONES IN DEVELOPMENT"}</em></a></li></ul>
</div></section>
<section class="w-latest"><div class="wrap">
  <p class="w-kicker">LATEST FROM WOLF</p>
  <div class="w-feature-grid">
    <a class="w-feature" href="${link(feat)}"><span class="w-feature-sym">RUN<br>× RIDE</span><span class="w-meta">${esc(feat.topic)} · ${feat.minutes} MIN READ</span><h3>${esc(feat.title)}</h3><span class="w-go">→ ${it ? "LEGGI" : "READ"}</span></a>
    <div class="w-side">${rest.map((a) => `<a href="${link(a)}"><span class="w-meta">${esc(a.topic)} · ${a.minutes} MIN</span><h3>${esc(a.title)}</h3></a>`).join("")}</div>
  </div>
</div></section>
<section class="w-numbers"><div class="wrap">
  <div><strong>${nR}</strong><span>${it ? "gare in inventario" : "races in inventory"}</span></div>
  <div><strong>${nC}</strong><span>${it ? "gare con percorso da fonte ufficiale" : "races with course from an official source"}</span></div>
  <div><strong>${nT}</strong><span>${it ? "mete camp in inventario" : "camp destinations in inventory"}</span></div>
  <div><strong>${nA}</strong><span>${it ? "guide con fonti e limiti" : "guides with sources and limits"}</span></div>
  <p class="w-num-note">${it ? "Inventario non significa verificato: ogni scheda mostra cosa manca." : "Inventory does not mean verified: each card shows what is missing."}</p>
</div></section>

<section class="w-start"><div class="wrap">
  <p class="w-kicker">START HERE</p>
  <ol>
    <li><a href="${R.engine[lang]}"><span class="w-num">01</span><b>${it?"Calcola":"Calculate"}</b><small>${it?"Inserisci i tuoi tempi nel Wolf Engine.":"Enter your times in the Wolf Engine."}</small></a></li>
    <li><a href="${art(lang, "scarico-pre-gara", "race-taper")}"><span class="w-num">02</span><b>${it?"Capisci":"Understand"}</b><small>${it?"Leggi una guida con fonti e livello di prova.":"Read a guide with sources and evidence level."}</small></a></li>
    <li><a href="${R.race[lang]}"><span class="w-num">03</span><b>${it?"Scegli la gara":"Pick a race"}</b><small>${it?"Gare e training camp con fonte e data.":"Races and training camps with source and date."}</small></a></li>
  </ol>
</div></section>`;
  return layout({ lang, key: "home", title: "Home", desc: it ? "Wolf Engine gratuito per ritmi, zone, fuel e gara. Guide su corsa e bici con fonti e livello di prova, gare e training camp verificati." : "Free Wolf Engine for paces, zones, fuel and race plans. Running and cycling guides with sources and evidence level, plus checked races and training camps.", body });
}

// ---------- Engine ----------
function engine(lang) {
  const it = !lang, T = (a, b) => (it ? a : b);
  const f = (name, label, ph, extra = "") => `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" ${extra} placeholder="${ph}" autocomplete="off"></div>`;
  const num = (n, l, ph) => f(n, l, ph, 'inputmode="decimal"');
  const tm = (n, l, ph) => f(n, l, ph, 'inputmode="numeric"');
  const body = `${hero("WOLF ENGINE", T("Inserisci i tuoi dati.<br>Ricevi il tuo profilo.", "Enter your data.<br>Get your profile."))}
<div class="wrap w-engine">
<form id="engine-form" class="eng-form" novalidate>
  <fieldset><legend>${T("Atleta", "Athlete")}</legend><div class="fields">${num("age", T("Età", "Age"), "40")}${num("weight", T("Peso (kg)", "Weight (kg)"), "70")}</div></fieldset>
  <fieldset><legend>${T("Gare recenti (h:mm:ss)", "Recent races (h:mm:ss)")}</legend><div class="fields">${tm("t5k", "5K", "20:00")}${tm("t10k", "10K", "41:30")}${tm("thm", T("Mezza", "Half"), "1:32:00")}${tm("tm", T("Maratona", "Marathon"), "3:15:00")}</div></fieldset>
  <fieldset><legend>${T("Ciclismo e cuore", "Cycling and heart")}</legend><div class="fields">${num("ftp", "FTP (W)", "250")}${num("hrmax", T("FC max (bpm)", "Max HR (bpm)"), "185")}${num("lthr", T("FC di soglia, LTHR (bpm)", "Threshold HR, LTHR (bpm)"), "165")}</div></fieldset>
  <fieldset><legend>${T("Nuoto: due prove massimali (m:ss)", "Swim: two maximal trials (m:ss)")}</legend><div class="fields">${tm("s200", T("Tempo sui 200 m", "200 m time"), "m:ss")}${tm("s400", T("Tempo sui 400 m", "400 m time"), "m:ss")}</div></fieldset>
  <fieldset><legend>${T("Obiettivo", "Goal")}</legend><div class="fields">
    <div class="field"><label for="f-goal">${T("Obiettivo", "Goal")}</label><select id="f-goal" name="goal"><option value="m">${T("Maratona", "Marathon")}</option><option value="hm">${T("Mezza maratona", "Half marathon")}</option><option value="10k">10K</option><option value="bike">${T("Ciclismo", "Cycling")}</option></select></div>
    ${tm("target", T("Tempo obiettivo (opzionale)", "Goal time (optional)"), "3:15:00")}${tm("duration", T("Durata per il fuel (opzionale)", "Duration for fuel (optional)"), "3:15:00")}${num("sweat", T("Sudorazione, L/h (opzionale)", "Sweat rate, L/h (optional)"), "1.0")}</div></fieldset>
</form>
<div class="eng-my" id="my-wolf" role="group" aria-label="My Wolf">
  <p class="eng-my-t">MY WOLF</p>
  <div class="eng-my-b"><button type="button" id="my-save">${T("Salva su questo dispositivo", "Save on this device")}</button><button type="button" id="my-del">${T("Cancella dati salvati", "Delete saved data")}</button></div>
  <p class="dim" id="my-status" role="status"></p>
</div>
<div id="engine-out" class="eng-out" aria-live="polite"></div>
<p class="w-foot dim">${T("Sesso e altezza non sono richiesti: nessuna formula usata qui ne ha bisogno. I tempi equivalenti non sono previsioni di gara. I valori sono stime da modelli: nessun risultato è una misura di laboratorio. Come funzionano e da dove vengono: ", "Sex and height are not asked: none of the formulas used here needs them. Equivalent times are not race predictions. Values are model estimates: no result is a lab measurement. How they work and where they come from: ")}<a href="${R.method[lang]}">${T("Metodologia", "Methodology")}</a>.</p>
</div>`;
  return layout({ lang, key: "engine", title: "Wolf Engine", desc: T("Wolf Engine: ritmi, zone di potenza, fuel e passaggi di gara dai tuoi dati. Nessun dato lascia il browser.", "Wolf Engine: paces, power zones, fuel and race splits from your data. No data leaves your browser."), body, dark: true, extra: `<script defer src="/assets/engine.js?v=${ver("assets/engine.js")}"></script><script defer src="/assets/engine-ui.js?v=${ver("assets/engine-ui.js")}"></script>` });
}

// ---------- Metodologia ----------
function method(lang) {
  const it = !lang, T = (a, b) => (it ? a : b);
  const lv = [[1, T("Revisione sistematica / meta-analisi", "Systematic review / meta-analysis")], [2, T("Studio randomizzato controllato", "Randomized controlled trial")], [3, T("Studio controllato", "Controlled study")], [4, T("Studio osservazionale", "Observational study")], [5, T("Parere di esperti", "Expert opinion")], [6, T("Dichiarazione del produttore", "Manufacturer claim")]];
  const crit = [[T("Gare", "Races"), T("percorso, clima, logistica, organizzazione, costo, possibilità di PB, prestigio, accessibilità", "course, climate, logistics, organisation, cost, PB potential, prestige, accessibility")], [T("Training camp", "Training camps"), T("ciclismo, corsa, salite, altitudine, meteo, alloggio, aeroporto, costo", "cycling, running, climbing, altitude, weather, accommodation, airport, cost")], [T("Prodotti", "Gear"), T("solo dopo un nostro test: prestazione, valore, durabilità, versatilità", "only after our own test: performance, value, durability, versatility")], [T("Metodi", "Methods"), T("solo dal livello e dalla coerenza delle prove", "from level and consistency of evidence only")]];
  const src = [["Daniels, Gilbert. Oxygen Power (1979)", "http://www.vivamarathon.com/OxygenPower.htm"], ["Allen, Coggan. Training and Racing with a Power Meter (zone di potenza)", "https://www.trainingpeaks.com/blog/power-training-levels/"], ["Friel. A Quick Guide to Setting Zones", "http://www.trainingbible.com/joesblog/labels/zones.html"], ["Tanaka, Monahan, Seals (2001). Age-predicted maximal heart rate revisited", "https://pubmed.ncbi.nlm.nih.gov/11153730/"], ["Jeukendrup (2014). Carbohydrate intake during exercise", "https://pubmed.ncbi.nlm.nih.gov/24791914/"], ["Thomas et al. (2016). Nutrition and Athletic Performance (ACSM, AND, DC)", "https://doi.org/10.1016/j.jand.2015.12.006"], ["Sawka et al. (2007). Exercise and Fluid Replacement (ACSM)", "https://doi.org/10.1249/mss.0b013e31802ca597"], ["Wilson et al. (2012). Concurrent training: a meta-analysis", "https://pubmed.ncbi.nlm.nih.gov/22002517/"], ["Maunder et al. (2021). The importance of durability", "https://pubmed.ncbi.nlm.nih.gov/33886100/"]];
  const body = `${hero(T("METODOLOGIA", "METHODOLOGY"), T("Come valutiamo.", "How we evaluate."), T("Prove prima dell'opinione. Ogni numero ha una fonte, ogni stima dice che cosa non sa.", "Evidence before opinion. Every number has a source and every estimate says what it does not know."))}
<div class="wrap w-body w-prose">
<h2>${T("Gerarchia delle prove", "Evidence hierarchy")}</h2>
<ol class="w-levels w-ev">${lv.map(([n, d]) => `<li class="on"><span class="w-num">L${n}</span><b>${d}</b></li>`).join("")}</ol>
<p>${T("È una semplificazione: un buon studio osservazionale può valere più di un trial piccolo e mal fatto. Il livello è il punto di partenza, poi guardiamo qualità, popolazione e coerenza.", "A simplification: a good observational study can beat a small, poorly run trial. Level is the starting point; then we look at quality, population and consistency.")}</p>
<h2>${T("Scheda metodo", "Method card")}</h2>
<p>${T("Ogni metodo della Libreria seguirà la stessa scheda. Un campo senza fonte resta vuoto e visibile, non viene riempito.", "Every method in the Library will follow the same card. A field without a source stays empty and visible, not filled in.")}</p>
<table class="w-table"><tbody>${[[T("Cos'è", "What it is"), T("una frase, senza gergo", "one sentence, no jargon")], [T("Per chi", "Who it is for"), T("sport, livello, tempo disponibile", "sport, level, time available")], [T("Come si applica", "How it is applied"), T("una settimana tipo o una seduta tipo", "a typical week or session")], [T("Evidenza", "Evidence"), T("tipo e qualità delle fonti", "source type and quality")], [T("Limiti", "Limits"), T("popolazione studiata, durata, cosa non dimostra", "population studied, duration, what it does not show")], [T("Fonti", "Sources"), T("link a studi o testi primari", "links to studies or primary texts")]].map(([a, b]) => `<tr><th scope="row">${a}</th><td>${b}</td></tr>`).join("")}</tbody></table>
<h2>My Wolf</h2>
<p>${T("My Wolf salva i valori del Wolf Engine solo su questo dispositivo, nel browser, e solo se premi Salva. Non c'è un account e non viene inviato nulla a Wolf Lab. Puoi cancellare tutto con un pulsante.", "My Wolf saves the Wolf Engine values only on this device, in the browser, and only if you press Save. There is no account and nothing is sent to Wolf Lab. You can delete everything with one button.")}</p>
<h2>Wolf Engine</h2>
<p>${T("Il Wolf Engine usa formule pubblicate (VDOT di Daniels e Gilbert, zone di Coggan, zone cardio di Friel, linee guida ACSM). Il calcolo è dentro il browser. Non genera settimane di allenamento.", "Wolf Engine uses published formulas (Daniels and Gilbert VDOT, Coggan zones, Friel heart-rate zones, ACSM guidelines). Calculation runs inside your browser. It does not generate training weeks.")}</p>
<p>${T("Nessun test è presentato come reale se non lo è.", "No test is presented as real unless it is.")}</p>
<h2>${T("Confronti (Wolf Picks)", "Comparisons (Wolf Picks)")}</h2>
<ul>${[["Ogni confronto mostra solo specifiche con fonte, metodo e data di consultazione per ciascun campo. Non c'è punteggio, classifica o vincitore.", "Each comparison shows only specifications with a source, method and date checked for every field. There is no score, ranking or winner."],["Fonti ammesse: pagine ufficiali dei produttori (dato dichiarato, livello L6) e misure o test pubblicati da terzi, sempre attribuiti per nome.", "Accepted sources: official manufacturer pages (declared data, level L6) and measurements or tests published by third parties, always credited by name."],["Una misura fatta da terzi resta di chi l'ha fatta: indichiamo chi, con quale metodo e quando. Non la presentiamo come nostra.", "A third-party measurement stays theirs: we say who made it, how and when. We do not present it as ours."],["I dati dichiarati dal produttore sono segnalati come tali e non sono messi sullo stesso piano delle misure.", "Manufacturer-declared data is labelled as such and is not put on the same footing as measurements."],["Se un dato manca, la scheda lo dice. Non lo stimiamo.", "If a value is missing, the page says so. We do not estimate it."],["Test WOLFLAB: finora nessuno. Se ne faremo, protocollo, attrezzatura e limiti saranno pubblicati insieme al risultato. Fino ad allora nessuna pagina dice «testato da noi».", "WOLFLAB tests: none so far. If we run any, the protocol, equipment and limits will be published with the result. Until then no page says \"tested by us\"."],["Link affiliati: oggi nessuno. Quando ci saranno, saranno indicati accanto al link e non cambiano il confronto.", "Affiliate links: none today. When there are some, they will be marked next to the link and do not change the comparison."],["Ogni scheda riporta la data dell'ultima verifica. I dati possono cambiare con le nuove versioni dei prodotti.", "Each page shows the date it was last checked. Data can change with new product versions."]].map(([a, b]) => `<li>${T(a, b)}</li>`).join("")}</ul>
<h2>${T("Fonti dei modelli", "Model sources")}</h2>
<ul class="w-src">${src.map(([t, u]) => `<li><a href="${u}" rel="noopener">${t}</a></li>`).join("")}</ul>
</div>`;
  return layout({ lang, key: "method", title: T("Metodologia", "Methodology"), desc: T("Gerarchia delle prove e fonti dei modelli del Wolf Engine.", "Evidence hierarchy and the model sources behind Wolf Engine."), body });
}

// ---------- Guida: piramidale o polarizzato ----------
function decide(lang) {
  const it = !lang, T = (a, b) => (it ? a : b);
  const body = `${hero(T("GUIDA DECISIONALE", "DECISION GUIDE"), T("Piramidale o polarizzato?<br>Cosa fare tu.", "Pyramidal or polarized?<br>What you should do."), T("La meta-analisi 2025 non trova un vincitore. Non c'è una regola per ore a settimana che le prove sostengano. Ecco cosa si può decidere.", "The 2025 meta-analysis finds no winner. No rule by weekly hours is supported by the evidence. Here is what you can decide."))}
<div class="wrap w-body w-prose">
<h2>${T("Cosa sappiamo", "What we know")}</h2>
<p>${T("Entrambi i modelli tengono la maggior parte del lavoro facile, sotto la prima soglia. Cambia la quota tra zona media e alta. Per VO₂max e prove a cronometro, la meta-analisi 2025 non trova una superiorità complessiva; indica possibili differenze per livello atletico. Prove: moderate.", "Both models keep most work easy, below the first threshold. They differ in the split between medium and high zones. For VO₂max and time trials the 2025 meta-analysis finds no overall superiority, with possible differences by athlete level. Evidence: moderate.")}</p>
<h2>${T("Cosa fare, in ordine", "What to do, in order")}</h2>
<ol class="w-steps">
<li><b>${T("Misura il tuo lavoro attuale.", "Measure your current work.")}</b> ${T("Per due settimane conta il tempo in tre zone, sempre con lo stesso metodo (soglie, non solo le zone dell'orologio).", "For two weeks count time in three zones, always with the same method (thresholds, not just your watch zones).")}</li>
<li><b>${T("Se la zona media domina e non è voluta,", "If the middle zone dominates and it is not intended,")}</b> ${T("sposta quel lavoro: o più facile, o in poche sedute di qualità vere. Non aggiungere sedute dure solo per raggiungere una percentuale.", "move that work: either easier, or into a few real quality sessions. Do not add hard sessions just to hit a percentage.")}</li>
<li><b>${T("Scegli ciò che riesci a ripetere.", "Pick what you can repeat.")}</b> ${T("La distribuzione deve tenere conto del carico complessivo, anche delle sedute di forza. La scelta dei giorni duri richiede una valutazione del piano, non una percentuale generata dal Wolf Engine.", "Distribution must account for the total load, including strength sessions. Choosing hard days requires assessment of the plan, not a percentage generated by Wolf Engine.")}</li>
<li><b>${T("Valuta dopo un blocco.", "Review after a block.")}</b> ${T("Per confrontare due periodi, mantieni le condizioni di misura più simili possibile e annota anche carico e recupero. Questa è una scelta pratica di monitoraggio, non una durata universale dimostrata dagli studi.", "To compare two periods, keep measurement conditions as similar as possible and record load and recovery too. This is a practical monitoring choice, not a universal duration demonstrated by studies.")}</li>
</ol>
<p class="w-note">${T("I passaggi di monitoraggio e applicazione sono scelte pratiche Wolf Lab, non un protocollo sperimentale con efficacia dimostrata.", "The monitoring and application steps are practical Wolf Lab choices, not an experimental protocol with demonstrated effectiveness.")}</p>
<h2>${T("Fonti", "Sources")}</h2>
<ul class="w-src"><li><a href="https://link.springer.com/article/10.1007/s40279-024-02149-3" rel="noopener">${T("Revisione e meta-analisi 2025", "Systematic review and meta-analysis 2025")}</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6582670/" rel="noopener">Treff et al., 2019</a></li><li><a href="${art(lang, "quanta-intensita-serve", "how-much-intensity")}">${T("Guida Wolf Lab: quanta intensità serve", "Wolf Lab guide: how much intensity")}</a></li></ul>
</div>`;
  return layout({ lang, key: "decide", title: T("Piramidale o polarizzato", "Pyramidal or polarized"), desc: T("Quale distribuzione dell'intensità usare: cosa dicono gli studi e cosa fare, senza regole inventate.", "Which intensity distribution to use: what studies say and what to do, without invented rules."), body });
}

// ---------- Esecuzione ----------
const urls = [];
for (const lang of [0, 1]) {
  for (const k of ["run", "ride", "swim", "train", "fuel", "race", "gear"]) { wr(`${R[k][lang].replace(/^\//, "")}.html`, hub(lang, k)); urls.push(R[k][lang]); }
  wr(R.engine[lang].replace(/^\//, "") + ".html", engine(lang)); urls.push(R.engine[lang]);
  wr(R.method[lang].replace(/^\//, "") + ".html", method(lang)); urls.push(R.method[lang]);
  wr(R.decide[lang].replace(/^\//, "") + ".html", decide(lang)); urls.push(R.decide[lang]);
  wr(lang ? "en/index.html" : "index.html", home(lang));
}
// Dati per i filtri di gare e training camp (solo campi con fonte nel repo)
const entry = { firenze: "soldout", boston: "qualifying" };
for (const id of ["valencia", "tokyo", "paris", "london", "capetown", "sydney", "berlin", "chicago", "nyc", "dolomites", "berlin-half", "cph-half"]) entry[id] = "lottery";
const meta = { races: {}, trips: {} };
for (const r of RACES.races) {
  const info = { country: r.city.en.split(", ").pop(), month: Number(r.date.slice(5, 7)), entry: entry[r.id] || "open", sport: r.sport === "bike" ? "bike" : r.distance.startsWith("21") ? "half" : "marathon", major: !!r.major, course: r.course ? 1 : 0 };
  meta.races[`/gare/${r.slug.it}/`] = info; meta.races[`/en/races/${r.slug.en}/`] = info;
}
const tripSports = { tenerife: ["bike", "run", "altitude"], mallorca: ["bike"], calpe: ["bike"], livigno: ["run", "bike", "altitude"], iten: ["run", "altitude"], "sierra-nevada": ["run", "bike", "altitude"] };
for (const t of TRIPS.trips) {
  const info = { sports: tripSports[t.id] || [], altitude: t.altitude, season: t.season };
  meta.trips[`/viaggi/${t.slug.it}/`] = info; meta.trips[`/en/trips/${t.slug.en}/`] = info;
}
wr("assets/explore-data.json", JSON.stringify(meta));
// Sitemap
let sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
for (const u of urls) if (!sm.includes(`${SITE}${u}</loc>`) && !sm.includes(`wolflabsystem.com${u}</loc>`)) sm = sm.replace("</urlset>", `<url><loc>${SITE}${u}</loc></url>\n</urlset>`);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sm);
console.log(`Wolf v3: ${urls.length} pagine + 2 home.`);
