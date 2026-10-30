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
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (SKIPDIR.has(e.name)) continue; const p = path.join(d, e.name);
  if (e.isDirectory()) { walk(p); continue; } if (!e.name.endsWith(".html")) continue;
  const rel = path.relative(root, p).split(path.sep).join("/"); if (SKIP.has(rel)) continue;
  let s = fs.readFileSync(p, "utf8"); if (s.includes("hp-burger") || !s.includes('<header class="site-head">')) continue;
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
