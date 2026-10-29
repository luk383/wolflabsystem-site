// Generatore del sito Wolf Lab. Nessuna dipendenza: `node tools/build.mjs`
// Legge content/articles/*.{it,en}.html e scrive le pagine HTML statiche nella radice del repo.
// Le pagine generate vanno committate: l'hosting serve solo file statici, senza build.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://wolflabsystem.com";
const EMAIL = "lab@wolflabsystem.com";
// Versione dei file statici: cambia quando cambia il contenuto, così la cache non serve file vecchi
const ver = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, f))).digest("hex").slice(0, 10);
const ASSET_V = { css: ver("assets/site.css"), js: ver("assets/site.js"), art: ver("assets/article.css") };

// Percorsi delle pagine in ciascuna lingua
const ROUTES = {
  races: { it: "/gare/", en: "/en/races/" },
  trips: { it: "/viaggi/", en: "/en/trips/" },
  home: { it: "/", en: "/en/" },
  articles: { it: "/articoli/", en: "/en/articles/" },
  training: { it: "/allenamento/", en: "/en/training/" },
  news: { it: "/novita/", en: "/en/news/" },
  tools: { it: "/strumenti/", en: "/en/tools/" },
  contact: { it: "/contatti/", en: "/en/contact/" },
};
const articlePath = (lang, slug) => (lang === "it" ? `/articoli/${slug}/` : `/en/articles/${slug}/`);

const T = {
  it: {
    tagline: "Allenamento endurance, con le fonti",
    nav: { articles: "Articoli", races: "Gare", trips: "Viaggi", training: "Allenamento", news: "Novità" },
    switchTo: "English", switchLang: "en",
    skip: "Vai al contenuto",
    evidence: ["", "Prove limitate", "Prove moderate", "Prove forti"],
    evidenceLabel: "Livello di prova",
    read: "min di lettura",
    contact: "Contatti",
    updated: "Pubblicato il",
    months: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
    allArticles: "Tutti gli articoli",
    toc: "In questa pagina",
    related: "Da leggere dopo",
  },
  en: {
    tagline: "Endurance training, with sources",
    nav: { articles: "Articles", races: "Races", trips: "Trips", training: "Training", news: "News" },
    switchTo: "Italiano", switchLang: "it",
    skip: "Skip to content",
    evidence: ["", "Limited evidence", "Moderate evidence", "Strong evidence"],
    evidenceLabel: "Evidence level",
    read: "min read",
    contact: "Contact",
    updated: "Published",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    allArticles: "All articles",
    toc: "On this page",
    related: "Read next",
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (iso, lang) => {
  const [y, m, d] = iso.split("-").map(Number);
  return lang === "it" ? `${d} ${T.it.months[m - 1]} ${y}` : `${T.en.months[m - 1]} ${d}, ${y}`;
};

function evidenceBadge(level, lang) {
  return `<span class="evidence" data-level="${level}" title="${T[lang].evidenceLabel}"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>${T[lang].evidence[level]}</span>`;
}

// ---------- Articoli ----------
function loadArticles() {
  const dir = path.join(ROOT, "content/articles");
  const out = { it: [], en: [] };
  for (const file of fs.readdirSync(dir).sort()) {
    const m = file.match(/\.(it|en)\.html$/);
    if (!m) continue;
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const meta = JSON.parse(raw.match(/<!--meta\s*([\s\S]*?)-->/)[1]);
    const body = raw.replace(/<!--meta[\s\S]*?-->\s*/, "");
    out[m[1]].push({ ...meta, lang: m[1], body });
  }
  for (const lang of ["it", "en"]) out[lang].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return out;
}

// ---------- Impaginazione ----------
// Pagine interne: titolo (e sottotitolo o dati) in fascia rossa, come gli articoli
function heroize(body) {
  const m = body.match(/^<(article|div) class="page"><div class="wrap( prose)?">\s*(<p class="crumb">[\s\S]*?<\/p>\s*)?(<h1>[\s\S]*?<\/h1>)\s*(<p class="lede">[\s\S]*?<\/p>|<div class="article-meta">[\s\S]*?<\/div>)?/);
  if (!m) return body;
  const rest = body.slice(m[0].length);
  return `<${m[1]} class="page art"><header class="art-hero"><div class="wrap">${m[3] || ""}${m[4]}${m[5] || ""}</div></header><div class="wrap inner-body${m[2] ? " prose" : ""}">${rest}`;
}

function layout({ lang, title, description, current, alt, body, pathname, extraCss = "" }) {
  if (current !== "home") {
    const hb = heroize(body);
    if (hb !== body) { body = hb; extraCss = `<link rel="stylesheet" href="/assets/article.css?v=${ASSET_V.art}">`; }
  }
  const t = T[lang];
  const navItems = ["training", "races", "trips", "news"]
    .map((k) => `<a href="${ROUTES[k][lang]}"${current === k ? ' aria-current="page"' : ""}>${t.nav[k]}</a>`)
    .join("");
  const fullTitle = current === "home" ? "Wolf Lab - Endurance. Engineered." : `${title} — Wolf Lab`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#BF251B">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${pathname}">
<link rel="alternate" hreflang="${lang}" href="${SITE}${pathname}">
<link rel="alternate" hreflang="${t.switchLang}" href="${SITE}${alt}">
<link rel="alternate" type="application/rss+xml" title="Wolf Lab" href="${lang === "it" ? "/feed.xml" : "/en/feed.xml"}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}${pathname}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${ASSET_V.css}">${extraCss}
<script defer src="/assets/site.js?v=${ASSET_V.js}"></script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${ROUTES.home[lang]}" aria-label="WOLFLAB"><img class="brand-img brand-on-dark" src="/assets/brand/logo-on-dark.svg" alt="WOLFLAB" width="190" height="44"><img class="brand-img brand-on-light" src="/assets/brand/logo-on-light.svg" alt="" width="190" height="44"></a>
    <nav class="nav" aria-label="${lang === "it" ? "Principale" : "Main"}">${navItems}</nav>
    <a class="lang" href="${alt}" hreflang="${t.switchLang}" lang="${t.switchLang}">${t.switchTo}</a>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <nav class="foot-links" aria-label="${lang === "it" ? "Piè di pagina" : "Footer"}"><a href="${ROUTES.contact[lang]}">${t.contact}</a> <a href="${lang === "it" ? "/feed.xml" : "/en/feed.xml"}">RSS</a> <a href="https://www.instagram.com/wolflabsystem/" rel="noopener me" target="_blank">Instagram</a></nav>
  </div>
</footer>
</body>
</html>
`;
}

function articleRows(list, lang) {
  return `<ol class="article-list" reversed>
${list
  .map(
    (a) => `  <li><a href="${articlePath(lang, a.slug)}">
    <span class="topic">${esc(a.topic)}</span>
    <span><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p></span>
  </a></li>`
  )
  .join("\n")}
</ol>`;
}

function paceBand(lang, id) {
  const it = lang === "it";
  return `<div class="pace-card" data-paceband>
  <div class="pace-top">
    <label for="${id}">${it ? "Obiettivo in maratona" : "Marathon goal"}</label>
    <input class="time-input" id="${id}" value="3:30" inputmode="numeric" autocomplete="off" aria-describedby="${id}-foot">
  </div>
  <p class="pace-big" aria-live="polite"><span data-pace>4:59</span><small>/km</small></p>
  <div class="band" aria-label="${it ? "Passaggi a ritmo costante" : "Even-pace splits"}"></div>
  <p class="band-foot" id="${id}-foot"></p>
</div>`;
}

const ROUTE_SVG = `<svg class="route" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true"><path class="glow" d="M-20 170 C 160 150, 240 90, 420 110 S 700 200, 880 150 S 1140 40, 1300 80 S 1440 120, 1470 100"/><path d="M-20 170 C 160 150, 240 90, 420 110 S 700 200, 880 150 S 1140 40, 1300 80 S 1440 120, 1470 100"/></svg>`;

// Sezioni degli articoli, nell'ordine in cui compaiono
const TOPIC_ORDER = ["Allenamento", "Training", "Corsa", "Running", "Bici", "Cycling", "Nutrizione", "Nutrition", "Forza e recupero", "Strength and recovery", "Materiali", "Gear"];
const slugify = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const topicsOf = (list) => [...new Set(list.map((a) => a.topic))].sort((x, y) => (TOPIC_ORDER.indexOf(x) + 1 || 99) - (TOPIC_ORDER.indexOf(y) + 1 || 99));
const topicNav = (list) => `<nav class="topic-nav">${topicsOf(list).map((t) => `<a href="#${slugify(t)}">${esc(t)} <span class="count">${list.filter((a) => a.topic === t).length}</span></a>`).join("")}</nav>`;

// Icone stilizzate del titolo: corsa, bici, cuore-motore (disegnate a mano, tratto unico)
const svgGlyph = (name, body) => `<svg class="glyph glyph-${name}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;
const GLYPH = {
  run: svgGlyph("run", `<circle cx="41" cy="9" r="5"/><path d="M38 17 L31 34"/><path d="M37 21 L45 27 L52 23"/><path d="M37 21 L28 23 L22 30"/><path d="M31 34 L40 43 L37 56"/><path d="M31 34 L23 44 L12 45"/>`),
  bike: svgGlyph("bike", `<circle cx="13" cy="47" r="10"/><circle cx="51" cy="47" r="10"/><path d="M13 47 L26 47 L40 32 L21 32"/><path d="M26 47 L20 28"/><path d="M40 32 L51 47"/><circle cx="45" cy="11" r="4"/><path d="M20 27 L38 19 L41 31"/><path d="M20 27 L31 37 L26 47"/>`),
  heart: svgGlyph("heart", `<path d="M32 55 C 12 42, 6 28, 13 19 C 19 11, 28 13, 32 20 C 36 13, 45 11, 51 19 C 58 28, 52 42, 32 55 Z"/><path class="pulse" d="M4 34 L19 34 L23 27 L29 43 L35 21 L40 34 L60 34"/>`),
};


// ---------- Gare e trip ----------
const RACES = JSON.parse(fs.readFileSync(path.join(ROOT, "content/races.json"), "utf8"));
const TRIPS = JSON.parse(fs.readFileSync(path.join(ROOT, "content/trips.json"), "utf8"));
RACES.races.sort((a, b) => a.date.localeCompare(b.date));
const racePath = (lang, r) => (lang === "it" ? `/gare/${r.slug.it}/` : `/en/races/${r.slug.en}/`);
const tripPath = (lang, t) => (lang === "it" ? `/viaggi/${t.slug.it}/` : `/en/trips/${t.slug.en}/`);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const kindOf = (r) => (r.sport === "bike" ? "bike" : r.distance.startsWith("21") ? "half" : "marathon");
const SPORT = { run: { it: "Corsa", en: "Running" }, bike: { it: "Bici", en: "Cycling" } };
function raceDate(iso, lang, short) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = T[lang].months;
  const mon = short ? months[m - 1].slice(0, 3) : months[m - 1];
  return lang === "it" ? `${d} ${mon} ${y}` : `${mon} ${d}, ${y}`;
}
// Keep both dates visible for races held across multiple days.
const raceDateLabel = (r, lang, short) => r.endDate
  ? `${raceDate(r.date, lang, short)} / ${raceDate(r.endDate, lang, short)}`
  : raceDate(r.date, lang, short);
const raceTime = (r, lang, short) => r.endDate
  ? `<span class="race-dates"><time datetime="${r.date}">${raceDate(r.date, lang, short)}</time> / <time datetime="${r.endDate}">${raceDate(r.endDate, lang, short)}</time></span>`
  : `<time datetime="${r.date}">${raceDate(r.date, lang, short)}</time>`;
const raceDistance = (r, lang) => (lang === "en" && r.distanceEn ? r.distanceEn : lang === "en" ? r.distance.replace(",", ".") : r.distance);
const verifiedNote = (lang, iso) => (lang === "it"
  ? `Dati verificati il ${fmtDate(iso, "it")} sulle fonti indicate. Quote e date possono cambiare: controlla sempre il sito ufficiale prima di iscriverti o prenotare.`
  : `Details checked on ${fmtDate(iso, "en")} against the sources listed. Fees and dates can change: always check the official site before entering or booking.`);

function factTable(rows) {
  return `<dl class="facts">${rows.filter((r) => r[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}

// ---------- Pagine ----------
const PAGES = {
  home(lang, articles) {
    const it = lang === "it";
    return {
      title: it ? "Home" : "Home",
      description: "Wolf Lab - Endurance. Engineered.",
      body: `<section class="sport-home"><div class="wrap">
<div class="sport-hero"><div class="sport-copy"><h1 lang="en">Endurance.<br><span>Engineered.</span></h1></div><div class="sport-photo" role="img" aria-label="${it ? "Runner su un sentiero di montagna al tramonto" : "Runner on a mountain trail at sunset"}"></div></div>
<div class="sport-latest" id="read-next"><div class="section-title"><a href="${ROUTES.articles[lang]}">${T[lang].allArticles} ↗</a></div>
<div class="sport-stories">${articles.slice(0,1).map(a=>`<a href="${articlePath(lang,a.slug)}"><div class="sport-symbol">↗<span>RUN<br>× RIDE</span></div><span class="sport-topic">${esc(a.topic)} / ${a.minutes} ${it ? "MIN" : "MIN"}</span><h3>${esc(a.title)}</h3><span class="sport-read">${it ? "Leggi l'articolo" : "Read the article"} ↗</span></a>`).join("")}<div class="sport-support">${articles.slice(1,3).map(a=>`<a href="${articlePath(lang,a.slug)}"><span class="sport-topic">${esc(a.topic)}</span><h3>${esc(a.title)}</h3><span class="sport-read">${it ? "Leggi" : "Read"} ↗</span></a>`).join("")}</div></div>
${articles.slice(3,4).map(a=>`<a class="sport-more" href="${articlePath(lang,a.slug)}">${esc(a.title)} ↗</a>`).join("")}</div>
<div class="sport-utility"><div><span class="sport-eyebrow">${it ? "DAL SAPERE AL FARE" : "FROM KNOWING TO DOING"}</span><h2>${it ? "La prossima sfida<br>comincia qui." : "Your next challenge<br>starts here."}</h2></div><a href="${ROUTES.races[lang]}"><b>01 / ${T[lang].nav.races}</b><span>${it ? "Maratone, mezze e bici" : "Marathons, halves and cycling"} ↗</span></a><a href="${ROUTES.tools[lang]}"><b>02 / ${T[lang].nav.tools}</b><span>${it ? "Calcola i tuoi ritmi" : "Work out your paces"} ↗</span></a></div>
</div></section>`,
    };
  },

  articles(lang, articles) {
    const it = lang === "it";
    return {
      title: it ? "Articoli" : "Articles",
      description: it ? "Tutti gli articoli su corsa, bici, nutrizione e forza, con le fonti." : "All articles on running, cycling, nutrition and strength, with sources.",
      body: `<div class="page"><div class="wrap">
  <h1>${it ? "Articoli" : "Articles"}</h1>
  ${topicNav(articles)}
  ${topicsOf(articles).map((t) => `<section class="topic-section" id="${slugify(t)}"><h2>${esc(t)}</h2>${articleRows(articles.filter((x) => x.topic === t), lang)}</section>`).join("\n")}
</div></div>`,
    };
  },

  tools(lang) {
    const it = lang === "it";
    return {
      title: it ? "Strumenti" : "Tools",
      description: it ? "Calcolatori gratuiti: passaggi e ritmi di allenamento per la maratona, carboidrati in gara e carico pre-gara." : "Free calculators: marathon splits and training paces, race-day carbohydrate and carb loading.",
      body: `<div class="page"><div class="wrap">
  <h1>${it ? "Strumenti" : "Tools"}</h1>
  <p class="lede">${it ? "Calcolatori semplici, con i numeri delle linee guida. Tutto resta sul tuo dispositivo." : "Simple calculators using guideline numbers. Everything stays on your device."}</p>

  <div class="tool" id="${it ? "passaggi" : "splits"}">
    <h2>${it ? "Passaggi in maratona" : "Marathon splits"}</h2>
    <p class="small">${it ? "Tempi di passaggio a ritmo costante, da stampare o copiare su una banda da polso." : "Even-pace split times, to print or copy onto a wrist band."}</p>
    ${paceBand(lang, "tool-band")}
  </div>

  <div class="tool" id="pace-tool">
    <h2>${it ? "Ritmi di allenamento" : "Training paces"}</h2>
    <p class="small">${it
      ? "Ritmi espressi in percentuale della velocità maratona, l'approccio usato da molti allenatori della scuola italiana e da John Davis. Sono un punto di partenza: adattali a come ti senti."
      : "Paces as a percentage of marathon speed, the approach used by many coaches of the Italian school and by John Davis. They are a starting point: adjust to how you feel."}</p>
    <div class="fields">
      <div class="field"><label for="target">${it ? "Tempo obiettivo (h:mm)" : "Goal time (h:mm)"}</label><input id="target" value="3:30" inputmode="numeric" autocomplete="off"></div>
    </div>
    <div class="results" id="pace-out" aria-live="polite"></div>
  </div>

  <div class="tool" id="${it ? "carboidrati" : "carbs"}">
    <div id="carb-tool">
    <h2>${it ? "Carboidrati in gara" : "Race-day carbohydrate"}</h2>
    <p class="small">${it
      ? "Basato sulle linee guida dell'American College of Sports Medicine e sugli studi di Asker Jeukendrup."
      : "Based on American College of Sports Medicine guidelines and Asker Jeukendrup's research."} <a href="${articlePath(lang, it ? "carboidrati-maratona" : "marathon-carbohydrates")}">${it ? "Leggi l'articolo" : "Read the article"}</a></p>
    <div class="fields">
      <div class="field"><label for="race-time">${it ? "Tempo di gara (h:mm)" : "Race time (h:mm)"}</label><input id="race-time" value="3:30" inputmode="numeric" autocomplete="off"></div>
      <div class="field"><label for="weight">${it ? "Peso (kg)" : "Weight (kg)"}</label><input id="weight" type="number" value="70" min="30" max="200" inputmode="decimal"></div>
      <div class="field"><label for="gel">${it ? "Grammi per gel" : "Grams per gel"}</label><input id="gel" type="number" value="25" min="5" max="100"><p class="hint">${it ? "Lo trovi sull'etichetta" : "Check the label"}</p></div>
      <div class="field"><label for="rate">${it ? "Carboidrati all'ora" : "Carbs per hour"}: <span id="rate-val"></span></label><input class="range" id="rate" type="range" min="30" max="90" step="5" value="60"></div>
    </div>
    <div class="results" id="carb-out" aria-live="polite"></div>
    </div>
  </div>
</div></div>`,
    };
  },


  races(lang) {
    const it = lang === "it";
    const rows = RACES.races.filter((r) => r.listed !== false).map((r) => `<li data-sport="${kindOf(r)}" data-major="${r.major ? "1" : "0"}"><a href="${racePath(lang, r)}">
      ${raceTime(r, lang, true)}
      <span class="r-name">${esc(r.name)}${r.major ? ` <span class="major">Major</span>` : ""}<small>${esc(r.city[lang])}</small></span>
      <span class="r-dist">${esc(raceDistance(r, lang))}</span>
      <span class="r-fee">${esc(r.feeShort[lang])}</span>
    </a></li>`).join("\n");
    return {
      title: it ? "Gare" : "Races",
      description: it ? "Calendario di maratone, mezze e granfondo in Italia ed Europa con date, distanze, quote di iscrizione e logistica." : "Calendar of marathons, half marathons and gran fondos in Italy and Europe with dates, distances, entry fees and logistics.",
      body: `<div class="page"><div class="wrap">
  <h1>${it ? "Gare" : "Races"}</h1>
  <div class="filter" role="group" aria-label="${it ? "Filtra per sport" : "Filter by sport"}">
    <button type="button" data-filter="all" aria-pressed="true">${it ? "Tutte" : "All"}</button>
    <button type="button" data-filter="marathon" aria-pressed="false">${it ? "Maratone" : "Marathons"}</button>
    <button type="button" data-filter="half" aria-pressed="false">${it ? "Mezze maratone" : "Half marathons"}</button>
    <button type="button" data-filter="bike" aria-pressed="false">${SPORT.bike[lang]}</button>
    <button type="button" data-filter="major" aria-pressed="false">World Marathon Majors</button>
  </div>
  <div class="race-head" aria-hidden="true"><span>${it ? "Data" : "Date"}</span><span>${it ? "Gara" : "Race"}</span><span>${it ? "Distanza" : "Distance"}</span><span>${it ? "Quota" : "Fee"}</span></div>
  <ul class="race-list" data-filter-list>
${rows}
  </ul>
  <p class="note">${verifiedNote(lang, RACES.verified)}</p>
</div></div>`,
    };
  },

  trips(lang) {
    const it = lang === "it";
    return {
      title: it ? "Viaggi" : "Trips",
      description: it ? "Mete per training camp e viaggi di corsa e bici: quando andare, cosa allenare, costi indicativi e logistica." : "Training camp and travel destinations for running and cycling: when to go, what to train, indicative costs and logistics.",
      body: `<div class="page"><div class="wrap">
  <h1>${it ? "Viaggi" : "Trips"}</h1>
  <ul class="trip-list">
${TRIPS.trips.map((t) => `    <li><a href="${tripPath(lang, t)}"><span class="t-name">${esc(it ? t.name : t.nameEn)}</span><span class="t-kind">${esc(t.kind[lang])}</span><span class="t-season">${esc(t.season[lang].split(";")[0])}</span></a></li>`).join("\n")}
  </ul>
</div></div>`,
    };
  },

  contact(lang) {
    const it = lang === "it";
    return {
      title: it ? "Contatti" : "Contact",
      description: it ? "Scrivi a Wolf Lab per domande, correzioni o proposte di argomenti." : "Write to Wolf Lab with questions, corrections or topic ideas.",
      body: `<div class="page"><div class="wrap prose">
  <h1>${it ? "Contatti" : "Contact"}</h1>
  <p><a href="mailto:${EMAIL}">${EMAIL}</a></p>
  <p>${it ? "Se trovi un errore in un articolo, indica il passaggio e, se puoi, la fonte: lo correggiamo e lo segnaliamo in fondo alla pagina." : "If you spot an error in an article, point to the passage and, if you can, the source: we'll fix it and note the correction at the bottom of the page."}</p>
</div></div>`,
    };
  },
};

// ---------- Scrittura ----------
function write(pathname, html) {
  const file = path.join(ROOT, pathname.endsWith("/") ? pathname + "index.html" : pathname);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function rss(lang, articles) {
  const items = articles
    .map(
      (a) => `<item><title>${esc(a.title)}</title><link>${SITE}${articlePath(lang, a.slug)}</link><guid>${SITE}${articlePath(lang, a.slug)}</guid><pubDate>${new Date(a.date + "T08:00:00Z").toUTCString()}</pubDate><description>${esc(a.description)}</description></item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Wolf Lab${lang === "en" ? " (English)" : ""}</title>
<link>${SITE}${ROUTES.home[lang]}</link>
<description>${esc(T[lang].tagline)}</description>
<language>${lang}</language>
${items}
</channel></rss>
`;
}

function main() {
  const articles = loadArticles();
  const byId = { it: Object.fromEntries(articles.it.map((a) => [a.id, a])), en: Object.fromEntries(articles.en.map((a) => [a.id, a])) };
  const urls = [];

  for (const lang of ["it", "en"]) {
    const other = lang === "it" ? "en" : "it";
    for (const [key, fn] of Object.entries(PAGES)) {
      const page = fn(lang, articles[lang]);
      const pathname = ROUTES[key][lang];
      write(pathname, layout({ lang, ...page, current: key, alt: ROUTES[key][other], pathname }));
      urls.push(pathname);
    }
    for (const a of articles[lang]) {
      const twin = byId[other][a.id];
      const pathname = articlePath(lang, a.slug);
      const toc = [];
      const bodyHtml = a.body.trim().replace(/<h2>([\s\S]*?)<\/h2>/g, (m, t) => {
        const label = t.replace(/<[^>]+>/g, "");
        if (toc.length === 0 && /^(In breve|In brief|Summary|At a glance)$/i.test(label)) { toc.push(null); return m; }
        const id = "s" + (toc.length + 1);
        toc.push({ id, label });
        return `<h2 id="${id}">${t}</h2>`;
      });
      const tocItems = toc.filter(Boolean);
      const rel = articles[lang].filter((x) => x.id !== a.id);
      const DISC = (x) => /^(run-|intensity$|strength-run|carbon-shoes)/.test(x.id) ? "run" : /^(ride-|ftp$|strength-ride)/.test(x.id) ? "ride" : /^bike$/.test(x.id) ? "runbike" : /^swim-/.test(x.id) ? "swim" : /^(prog-|strength$)/.test(x.id) ? "strength" : "";
      const dA = DISC(a);
      const relOk = dA ? rel.filter((x) => DISC(x) === dA || DISC(x) === "") : rel;
      const related = [...relOk.filter((x) => dA && DISC(x) === dA), ...relOk.filter((x) => !(dA && DISC(x) === dA) && x.topic === a.topic), ...relOk.filter((x) => !(dA && DISC(x) === dA) && x.topic !== a.topic)].slice(0, 3);
      const side = `<aside class="art-side">${tocItems.length ? `<nav class="art-toc" aria-label="${T[lang].toc}"><h2>${T[lang].toc}</h2><ol>${tocItems.map((i) => `<li><a href="#${i.id}">${i.label}</a></li>`).join("")}</ol></nav>` : ""}<nav class="art-related" aria-label="${T[lang].related}"><h2>${T[lang].related}</h2><ul>${related.map((x) => `<li><a href="${articlePath(lang, x.slug)}"><span>${esc(x.topic)}</span>${esc(x.title)}</a></li>`).join("")}</ul></nav></aside>`;
      const body = `<article class="page art">
<header class="art-hero"><div class="wrap">
  <h1>${esc(a.title)}</h1>
  <div class="article-meta"><span>${esc(a.topic)}</span><span>${a.minutes} ${T[lang].read}</span><time datetime="${a.date}">${T[lang].updated} ${fmtDate(a.date, lang)}</time></div>
</div></header>
<div class="wrap art-grid">
<div class="prose art-body">
  ${tocItems.length ? `<details class="art-toc-m"><summary>${T[lang].toc}</summary><ol>${tocItems.map((i) => `<li><a href="#${i.id}">${i.label}</a></li>`).join("")}</ol></details>` : ""}
  ${bodyHtml}
  <p><a href="${ROUTES.articles[lang]}">${T[lang].allArticles}</a></p>
</div>
${side}
</div></article>`;
      write(pathname, layout({ lang, title: a.title, description: a.description, current: "articles", alt: twin ? articlePath(other, twin.slug) : ROUTES.articles[other], pathname, body, extraCss: `<link rel="stylesheet" href="/assets/article.css?v=${ASSET_V.art}">` }));
      urls.push(pathname);
    }

    // Schede delle gare e dei trip
    for (const r of RACES.races) {
      const pathname = racePath(lang, r);
      const it = lang === "it";
      const body = `<article class="page"><div class="wrap prose">
  <p class="crumb"><a href="${ROUTES.races[lang]}">${it ? "Gare" : "Races"}</a></p>
  <h1>${esc(r.name)}</h1>
  <div class="article-meta"><span>${SPORT[r.sport][lang]}</span>${r.major ? `<span class="major">Abbott World Marathon Major</span>` : ""}${raceTime(r, lang)}<span>${esc(r.city[lang])}</span></div>
  ${factTable([
    [it ? "Distanza" : "Distance", esc(raceDistance(r, lang))],
    [it ? "Quota" : "Fee", esc(r.fee[lang])],
    [it ? "Iscrizioni" : "Entry", esc(r.status[lang])],
    [it ? "Dettagli" : "Details", r.start ? esc(r.start[lang]) : ""],
    [it ? "Tempo massimo" : "Time limit", r.limit ? esc(r.limit[lang]) : ""],
    [it ? "Percorso" : "Course", r.course ? `${esc(r.course[lang])} <a href="${r.courseSource}" rel="noopener">${it ? "Fonte ufficiale" : "Official source"}</a>` : (it ? "Dato non ancora verificato: dislivello, difficoltà e temperatura non sono ancora pubblicati qui." : "Not yet verified: elevation, difficulty and temperature are not published here yet.")],
  ])}
  ${r.travel ? `<h2>${it ? "Come arrivare" : "Getting there"}</h2>
  <p>${esc(r.travel[lang])}</p>` : ""}
  ${r.tips ? `<h2>${it ? "Da sapere" : "Good to know"}</h2>
  <p>${esc(r.tips[lang])}</p>` : ""}
  <p class="note">${verifiedNote(lang, RACES.verified)} ${it ? "Fonte" : "Source"}: <a href="${r.source}">${host(r.source)}</a></p>
</div></article>`;
      write(pathname, layout({ lang, title: r.name, description: `${r.name}: ${raceDateLabel(r, lang)}, ${r.city[lang]}. ${r.fee[lang]}.`, current: "races", alt: racePath(other, r), pathname, body }));
      urls.push(pathname);
    }
    for (const t of TRIPS.trips) {
      const pathname = tripPath(lang, t);
      const it = lang === "it";
      const name = it ? t.name : t.nameEn;
      const body = `<article class="page"><div class="wrap prose">
  <p class="crumb"><a href="${ROUTES.trips[lang]}">${it ? "Viaggi" : "Trips"}</a></p>
  <h1>${esc(name)}</h1>
  <div class="article-meta"><span>${esc(t.kind[lang])}</span><span>${esc(t.place[lang])}</span></div>
  ${factTable([
    [it ? "Quando" : "When", esc(t.season[lang])],
    [it ? "Quota" : "Altitude", esc(t.altitude[lang])],
  ])}
  <h2>${it ? "Perché andarci" : "Why go"}</h2>
  <p>${esc(t.why[lang])}</p>
  <h2>${it ? "Cosa allenare" : "What to train"}</h2>
  <p>${esc(t.train[lang])}</p>
  <h2>${it ? "Costi" : "Costs"}</h2>
  <p>${esc(t.costs[lang])}</p>
  <h2>${it ? "Come arrivare" : "Getting there"}</h2>
  <p>${esc(t.travel[lang])}</p>
  <h2>${it ? "Da sapere" : "Good to know"}</h2>
  <p>${esc(t.tips[lang])}</p>
  <p class="note">${verifiedNote(lang, TRIPS.verified)}${t.sources.length ? ` ${it ? "Fonti" : "Sources"}: ${t.sources.map((u) => `<a href="${u}">${host(u)}</a>`).join(", ")}` : ""}</p>
</div></article>`;
      write(pathname, layout({ lang, title: name, description: `${name}: ${t.kind[lang]}. ${t.season[lang]}.`, current: "trips", alt: tripPath(other, t), pathname, body }));
      urls.push(pathname);
    }
    write(lang === "it" ? "/feed.xml" : "/en/feed.xml", rss(lang, articles[lang]));
  }

  // 404
  write("/404.html", layout({
    lang: "it", title: "Pagina non trovata", description: "Pagina non trovata", current: null, alt: "/en/", pathname: "/404.html",
    body: `<div class="page"><div class="wrap prose"><h1>Questa pagina non c'è</h1><p class="lede">Il sito è stato rinnovato e alcuni indirizzi sono cambiati.</p><p><a href="/">Torna alla home</a> · <a href="/articoli/">Leggi gli articoli</a> · <a href="/en/">English version</a></p></div></div>`,
  }));

  // Vecchi indirizzi del sito precedente
  const redirects = { "/system/": "/", "/builds/": "/", "/roadmap/": "/", "/contact/": "/contatti/", "/metodo/": "/", "/en/method/": "/en/", "/trip/": "/viaggi/" };
  for (const t of TRIPS.trips) redirects[`/trip/${t.slug.it}/`] = tripPath("it", t);
  for (const [from, to] of Object.entries(redirects)) {
    write(from, `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Wolf Lab</title><link rel="canonical" href="${SITE}${to}"><meta http-equiv="refresh" content="0; url=${to}"><meta name="robots" content="noindex"></head><body><p><a href="${to}">Wolf Lab</a></p></body></html>\n`);
  }

  write("/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${SITE}${u}</loc></url>`).join("\n")}
</urlset>
`);
  write("/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`Generate ${urls.length} pagine.`);
}

main();

// Order matters: the Wolf v3 pages (engine) first, because library/news reuse their shell,
// then older pages are normalized to that shell, then Ask Wolf and footer links.
await import("./build-engine.mjs");
await import("./build-library.mjs");
await import("./build-news.mjs");
await import("./normalize-legacy.mjs");
await import("./apply-review.mjs");
await import("./build-ask.mjs");
await import("./apply-brand.mjs");
await import("./seo.mjs");
