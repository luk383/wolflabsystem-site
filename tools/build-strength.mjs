// Genera /train/strength/ (IT) e /en/train/strength/ (EN). Builder IT in assets/strength/, EN in assets/strength/en/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com';
const v = (f) => crypto.createHash('md5').update(fs.readFileSync(path.join(root, 'assets/strength', f))).digest('hex').slice(0, 8);
const esc = (s) => s.replace(/"/g, '&quot;');
const L = {
  it: { rel: '/train/strength/', alt: '/en/train/strength/', shell: 'gear.html', dir: '', title: 'Wolf Strength Lab', kick: 'TRAIN · FORZA',
    desc: 'Costruisci una scheda di forza, cerca esercizi e registra gli allenamenti. Nessun account: i dati restano nel tuo browser, solo se scegli di conservarli.', ns: 'Serve JavaScript per usare il builder.' },
  en: { rel: '/en/train/strength/', alt: '/train/strength/', shell: 'en/gear.html', dir: 'en/', title: 'Wolf Strength Lab', kick: 'TRAIN · STRENGTH',
    desc: 'Build a strength routine, browse exercises and log your workouts. No account: your data stays in your browser, and only if you choose to keep it.', ns: 'JavaScript is required to use the builder.' },
};
const sp = path.join(root, 'sitemap.xml'); let sm = fs.readFileSync(sp, 'utf8');
for (const [lang, c] of Object.entries(L)) {
  const shell = fs.readFileSync(path.join(root, c.shell), 'utf8');
  const head0 = shell.slice(0, shell.indexOf('<main')), foot = shell.slice(shell.indexOf('</main>') + 7);
  const itRel = L.it.rel, enRel = L.en.rel;
  let h = head0.replace(/<title>[^<]*<\/title>/, `<title>${c.title} - Wolf Lab</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(c.desc)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${SITE}${c.rel}">`)
    .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, `<link rel="alternate" hreflang="it" href="${SITE}${itRel}">\n<link rel="alternate" hreflang="en" href="${SITE}${enRel}">\n`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${c.title} - Wolf Lab">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(c.desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${c.rel}">`)
    .replace(/<meta property="og:image"[^>]*data-seo="1">.*?(?=<\/head>)/s, '')
    .replace(/<a class="lang" href="[^"]*" hreflang="(it|en)" lang="(it|en)">/, `<a class="lang" href="${c.alt}" hreflang="${lang === 'it' ? 'en' : 'it'}" lang="${lang === 'it' ? 'en' : 'it'}">`);
  const sub = lang === 'en' ? 'en/' : '';
  h = h.replace('</head>', `<link rel="stylesheet" href="/assets/strength/${sub}main.css?v=${v(sub + 'main.css')}">\n</head>`);
  const main = `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${c.kick}</p><h1>${c.title}</h1></div></header><div class="wrap w-body"><div id="strength-root"><noscript>${c.ns}</noscript></div></div></main><script defer src="/assets/strength/${sub}main.js?v=${v(sub + 'main.js')}"></script>`;
  const out = path.join(root, c.rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
  if (!sm.includes(SITE + c.rel + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${c.rel}</loc></url>\n</urlset>`);
}
fs.writeFileSync(sp, sm);
console.log('strength: 2 pagine');
