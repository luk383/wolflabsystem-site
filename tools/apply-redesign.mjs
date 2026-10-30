// Applica lo stile "rivista" (menu laterale, testata chiara, solo tema chiaro) alle pagine generate.
// Idempotente: salta le pagine che hanno già il menu. Da eseguire DOPO la generazione delle pagine e PRIMA di version-assets.mjs.
// Non tocca app, Ask Wolf, 404, wolf-mark e i reindirizzamenti (pagine senza intestazione del sito).
// La home e gli hub RUN sono stati rifiniti a mano: questo script non li rigenera.
import fs from "node:fs"; import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const T = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "redesign-templates.json"), "utf8"));
const SKIP = new Set(["404.html", "wolf-mark.html", "app/index.html", "en/app/index.html", "ask-wolf/index.html", "en/ask-wolf/index.html"]);
const SKIPDIR = new Set([".git", "node_modules", "assets", "builds", "content", "tools"]);
let n = 0;
// Barra principale e piè di pagina uniformi (stato pubblicato): cinque pilastri, nessun altro link.
const NAVS = { it: [["RUN", "/run"], ["RIDE", "/ride"], ["SWIM", "/swim"], ["STRENGTH", "/strength/"], ["ARTICOLI", "/articoli/"]], en: [["RUN", "/en/run"], ["RIDE", "/en/ride"], ["SWIM", "/en/swim"], ["STRENGTH", "/en/strength/"], ["ARTICLES", "/en/articles/"]] };
const FOOTS = { it: '<nav class="foot-links" aria-label="Piè di pagina"><a href="/metodologia">Metodologia</a> <a href="/contatti/">Contatti</a> <a href="/app/">App Android</a> <a href="https://www.instagram.com/wolflabsystem/" rel="noopener" target="_blank">Instagram</a> <a href="/feed.xml">RSS</a></nav>', en: '<nav class="foot-links" aria-label="Footer"><a href="/en/methodology">Methodology</a> <a href="/en/contact/">Contact</a> <a href="/en/app/">Android app</a> <a href="https://www.instagram.com/wolflabsystem/" rel="noopener me" target="_blank">Instagram</a> <a href="/en/feed.xml">RSS</a></nav>' };
const currentOf = (rel) => { const r = rel.replace(/^en\//, ""); if (r.startsWith("articoli/") || r.startsWith("articles/")) return "articles"; if (/^(run|ride|swim)\.html$/.test(r)) return r.split(".")[0]; if (r.startsWith("strength/") || r.startsWith("train/")) return "strength"; return null; };
const normChrome = (s, rel) => {
  const en = rel.startsWith("en/"); if (!/<nav class="nav"/.test(s)) return s;
  const cur = currentOf(rel); const base = en ? "/en/" : "/";
  const href = { articles: en ? "/en/articles/" : "/articoli/", run: base + "run", ride: base + "ride", swim: base + "swim", strength: base + "strength/" }[cur];
  const nav = `<nav class="nav" aria-label="${en ? "Main" : "Principale"}">` + NAVS[en ? "en" : "it"].map(([a, h]) => `<a href="${h}"${h === href ? ' aria-current="page"' : ""}>${a}</a>`).join("") + "</nav>";
  return s.replace(/<nav class="nav"[\s\S]*?<\/nav>/, () => nav).replace(/<nav class="foot-links"[\s\S]*?<\/nav>/, () => FOOTS[en ? "en" : "it"]);
};
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (SKIPDIR.has(e.name)) continue; const p = path.join(d, e.name);
  if (e.isDirectory()) { walk(p); continue; } if (!e.name.endsWith(".html")) continue;
  const rel = path.relative(root, p).split(path.sep).join("/"); if (SKIP.has(rel)) continue;
  let s = fs.readFileSync(p, "utf8"); s = normChrome(s, rel);
  if (s.includes("hp-burger") || !s.includes('<header class="site-head">')) { if (s !== fs.readFileSync(p, "utf8")) fs.writeFileSync(p, s); continue; }
  const t = T[rel.startsWith("en/") ? "en" : "it"];
  s = s.replace(/<body[^>]*>/, '<body class="hp hp-hub">');
  s = s.replace("</head>", '<link rel="stylesheet" href="/assets/home-preview.css"></head>');
  s = s.replace(/(<header class="site-head">\s*<div class="wrap">\s*)(<a class="brand")/, (m, a, b) => a + t.burger + b);
  s = s.replace("</header>", () => "</header>" + t.drawer).replace("</body>", () => t.js + "</body>");
  s = s.replace(/if\(t==="dark"\|\|\(!t&&d\.hasAttribute\("[^"]*"\)\)\)d\.setAttribute\("data-theme","dark"\)/, "void 0");
  if (rel === "articoli/index.html") s = s.replace('<p class="w-kicker">ARTICLES</p><h1>Articles</h1>', '<p class="w-kicker">ARTICOLI</p><h1>Articoli</h1>');
  if (/^(en\/)?engine\.html$/.test(rel)) s = s.replace(' data-theme-default="dark"', "");
  fs.writeFileSync(p, s); n++;
} };
walk(root); console.log("redesign applied to", n, "pages");
