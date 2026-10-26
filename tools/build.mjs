// Generatore del sito Wolf Lab. Nessuna dipendenza: `node tools/build.mjs`
// Legge content/articles/*.{it,en}.html e scrive le pagine HTML statiche nella radice del repo.
// Le pagine generate vanno committate: l'hosting serve solo file statici, senza build.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://wolflabsystem.com";
const EMAIL = "luca@wolflabsystem.com";

// Percorsi delle pagine in ciascuna lingua
const ROUTES = {
  home: { it: "/", en: "/en/" },
  articles: { it: "/articoli/", en: "/en/articles/" },
  tools: { it: "/strumenti/", en: "/en/tools/" },
  method: { it: "/metodo/", en: "/en/method/" },
  contact: { it: "/contatti/", en: "/en/contact/" },
};
const articlePath = (lang, slug) => (lang === "it" ? `/articoli/${slug}/` : `/en/articles/${slug}/`);

const T = {
  it: {
    tagline: "Allenamento endurance, con le fonti",
    nav: { articles: "Articoli", tools: "Strumenti", method: "Metodo" },
    switchTo: "English", switchLang: "en",
    skip: "Vai al contenuto",
    evidence: ["", "Prove limitate", "Prove moderate", "Prove forti"],
    evidenceLabel: "Livello di prova",
    read: "min di lettura",
    foot: "Corsa, bici, nutrizione e allenamento per amatori, basati sulle prove. Le informazioni non sostituiscono il parere di un medico.",
    contact: "Contatti",
    updated: "Pubblicato il",
    months: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
    note: "Questo articolo è stato preparato con l'aiuto dell'intelligenza artificiale per la ricerca e la prima stesura, poi rivisto e verificato sulle fonti. Non sostituisce il parere di un medico o di un nutrizionista.",
    allArticles: "Tutti gli articoli",
  },
  en: {
    tagline: "Endurance training, with sources",
    nav: { articles: "Articles", tools: "Tools", method: "Method" },
    switchTo: "Italiano", switchLang: "it",
    skip: "Skip to content",
    evidence: ["", "Limited evidence", "Moderate evidence", "Strong evidence"],
    evidenceLabel: "Evidence level",
    read: "min read",
    foot: "Running, cycling, nutrition and training for amateurs, grounded in evidence. This information doesn't replace advice from a doctor.",
    contact: "Contact",
    updated: "Published",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    note: "This article was prepared with the help of AI for research and a first draft, then reviewed and checked against the sources. It doesn't replace advice from a doctor or dietitian.",
    allArticles: "All articles",
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
function layout({ lang, title, description, current, alt, body, pathname }) {
  const t = T[lang];
  const navItems = ["articles", "tools", "method"]
    .map((k) => `<a href="${ROUTES[k][lang]}"${current === k ? ' aria-current="page"' : ""}>${t.nav[k]}</a>`)
    .join("");
  const fullTitle = current === "home" ? `Wolf Lab — ${t.tagline}` : `${title} — Wolf Lab`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0a0e17">
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
<link rel="stylesheet" href="/assets/site.css">
<script defer src="/assets/site.js"></script>
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${ROUTES.home[lang]}"><span class="brand-mark" aria-hidden="true"></span>Wolf Lab</a>
    <nav class="nav" aria-label="${lang === "it" ? "Principale" : "Main"}">${navItems}</nav>
    <a class="lang" href="${alt}" hreflang="${t.switchLang}" lang="${t.switchLang}">${t.switchTo}</a>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-foot">
  <div class="wrap">
    <p>${t.foot}</p>
    <nav class="foot-links" aria-label="${lang === "it" ? "Piè di pagina" : "Footer"}"><a href="${ROUTES.contact[lang]}">${t.contact}</a> <a href="${ROUTES.method[lang]}">${t.nav.method}</a> <a href="${lang === "it" ? "/feed.xml" : "/en/feed.xml"}">RSS</a></nav>
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
    ${evidenceBadge(a.evidence, lang)}
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

// ---------- Pagine ----------
const PAGES = {
  home(lang, articles) {
    const it = lang === "it";
    return {
      title: it ? "Home" : "Home",
      description: it
        ? "Articoli e calcolatori su corsa, bici, nutrizione e forza per amatori di endurance, ogni consiglio con il suo livello di prova e le fonti."
        : "Articles and calculators on running, cycling, nutrition and strength for amateur endurance athletes, each piece of advice with its evidence level and sources.",
      body: `<section class="hero">
  ${ROUTE_SVG}
  <div class="wrap hero-grid">
    <div>
      <h1${it ? ' lang="en"' : ""}>Two feet.<br>Two wheels.<br>One engine.</h1>
      <p class="lede">${it
        ? "Corsa, bici, nutrizione e forza spiegate partendo dalla ricerca. Ogni consiglio con le sue fonti e quanto è solido."
        : "Running, cycling, nutrition and strength explained from the research. Every piece of advice with its sources and how solid it is."}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${ROUTES.articles[lang]}">${it ? "Leggi gli articoli" : "Read the articles"}</a>
        <a class="btn" href="${ROUTES.tools[lang]}">${it ? "Prova gli strumenti" : "Try the tools"}</a>
      </div>
    </div>
    ${paceBand(lang, "home-target")}
  </div>
</section>
<section>
  <div class="wrap">
    <div class="section-title"><h2>${it ? "Ultimi articoli" : "Latest articles"}</h2><a href="${ROUTES.articles[lang]}">${T[lang].allArticles}</a></div>
    ${articleRows(articles.slice(0, 5), lang)}
  </div>
</section>
<section>
  <div class="wrap">
    <h2>${it ? "Come lavoriamo" : "How we work"}</h2>
    <div class="principles">
      <div><h3>${it ? "Fonti in chiaro" : "Sources in the open"}</h3><p>${it ? "Ogni articolo cita gli studi e le linee guida da cui parte, con il link per controllarli." : "Every article cites the studies and guidelines it starts from, with a link to check them."}</p></div>
      <div><h3>${it ? "Livello di prova" : "Evidence level"}</h3><p>${it ? "Tre tacche dicono se un consiglio poggia su revisioni solide, su pochi studi o sull'esperienza degli allenatori." : "Three bars show whether advice rests on solid reviews, a handful of studies or coaching experience."}</p></div>
      <div><h3>${it ? "Niente da venderti" : "Nothing to sell you"}</h3><p>${it ? "Nessuna pubblicità e nessun link di affiliazione a integratori o scarpe." : "No ads and no affiliate links to supplements or shoes."}</p></div>
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <div class="callout">
      <div class="figure">${it ? "42,195" : "42.195"}<span>km</span></div>
      <div>
        <p>${it ? "Passaggi, ritmi di allenamento e carboidrati per la tua maratona, calcolati con i numeri delle linee guida." : "Splits, training paces and carbohydrate for your marathon, worked out with guideline numbers."}</p>
        <a class="btn" href="${ROUTES.tools[lang]}">${it ? "Apri gli strumenti" : "Open the tools"}</a>
      </div>
    </div>
  </div>
</section>`,
    };
  },

  articles(lang, articles) {
    const it = lang === "it";
    return {
      title: it ? "Articoli" : "Articles",
      description: it ? "Tutti gli articoli su corsa, bici, nutrizione e forza, con livello di prova e fonti." : "All articles on running, cycling, nutrition and strength, with evidence level and sources.",
      body: `<div class="page"><div class="wrap">
  <h1>${it ? "Articoli" : "Articles"}</h1>
  <p class="lede">${it ? "Un tema per volta: cosa dice la ricerca, cosa fare in pratica, quanto è solido." : "One topic at a time: what the research says, what to do in practice, how solid it is."}</p>
  ${articleRows(articles, lang)}
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

  method(lang) {
    const it = lang === "it";
    return {
      title: it ? "Metodo" : "Method",
      description: it ? "Come scegliamo le fonti, come assegniamo il livello di prova e come usiamo l'intelligenza artificiale." : "How we choose sources, how we assign evidence levels and how we use AI.",
      body: `<div class="page"><div class="wrap prose">
  <h1>${it ? "Metodo" : "Method"}</h1>
  <p class="lede">${it ? "Wolf Lab è un laboratorio sull'allenamento di endurance: corsa, bici, nutrizione e forza per chi si allena da amatore." : "Wolf Lab is a lab on endurance training: running, cycling, nutrition and strength for people who train as amateurs."}</p>
  <h2>${it ? "Da dove partiamo" : "Where we start"}</h2>
  <p>${it
    ? "Prima le revisioni sistematiche e le linee guida delle società scientifiche, poi i singoli studi, poi l'esperienza di allenatori e scienziati che spiegano il loro ragionamento. Forum e social servono per capire le domande, non per dare le risposte."
    : "First systematic reviews and guidelines from scientific bodies, then single studies, then the experience of coaches and scientists who explain their reasoning. Forums and social media help us understand the questions, not provide the answers."}</p>
  <h2>${it ? "Il livello di prova" : "The evidence level"}</h2>
  <p>${evidenceBadge(3, lang)} ${it ? "Più revisioni o linee guida concordano." : "Several reviews or guidelines agree."}</p>
  <p>${evidenceBadge(2, lang)} ${it ? "Alcuni studi di buona qualità, oppure prove solide sul principio ma non sull'applicazione pratica." : "Some good-quality studies, or solid evidence for the principle but not for the practical application."}</p>
  <p>${evidenceBadge(1, lang)} ${it ? "Pochi studi, studi piccoli o soprattutto esperienza degli allenatori." : "Few or small studies, or mainly coaching experience."}</p>
  <h2>${it ? "Niente da venderti" : "Nothing to sell you"}</h2>
  <p>${it ? "Il sito non ha pubblicità, sponsor né link di affiliazione. Quando citiamo un prodotto è perché serve all'esempio, non perché qualcuno paga." : "The site has no ads, sponsors or affiliate links. When we mention a product it's because the example needs it, not because someone pays."}</p>
  <h2>${it ? "Intelligenza artificiale" : "Artificial intelligence"}</h2>
  <p>${it
    ? "Usiamo l'intelligenza artificiale come assistente: per cercare studi, riassumerli e preparare una prima bozza. Ogni articolo viene poi rivisto e i dati principali vengono controllati sulle fonti originali."
    : "We use AI as an assistant: to find studies, summarise them and prepare a first draft. Every article is then reviewed and the key figures are checked against the original sources."}</p>
  <h2>${it ? "Non è un parere medico" : "Not medical advice"}</h2>
  <p>${it ? "Le informazioni sono generali. Per dolori, infortuni, malattie o diete specifiche rivolgiti a un medico o a un nutrizionista." : "The information is general. For pain, injuries, medical conditions or specific diets, talk to a doctor or registered dietitian."}</p>
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
  <p class="lede">${it ? "Domande, correzioni a un articolo o un tema che vorresti approfondito." : "Questions, corrections to an article or a topic you'd like covered."}</p>
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
      const body = `<article class="page"><div class="wrap prose">
  <h1>${esc(a.title)}</h1>
  <div class="article-meta"><span>${esc(a.topic)}</span>${evidenceBadge(a.evidence, lang)}<span>${a.minutes} ${T[lang].read}</span><time datetime="${a.date}">${T[lang].updated} ${fmtDate(a.date, lang)}</time></div>
  ${a.body.trim()}
  <p class="note">${T[lang].note}</p>
  <p><a href="${ROUTES.articles[lang]}">${T[lang].allArticles}</a></p>
</div></article>`;
      write(pathname, layout({ lang, title: a.title, description: a.description, current: "articles", alt: twin ? articlePath(other, twin.slug) : ROUTES.articles[other], pathname, body }));
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
  const redirects = { "/system/": "/metodo/", "/builds/": "/", "/roadmap/": "/", "/contact/": "/contatti/" };
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
