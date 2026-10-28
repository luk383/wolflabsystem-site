// Genera /train/strength/ (IT) dal guscio di gear.html. Il builder e' in assets/strength/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com', rel = '/train/strength/';
const shell = fs.readFileSync(path.join(root, 'gear.html'), 'utf8');
const head0 = shell.slice(0, shell.indexOf('<main')), foot = shell.slice(shell.indexOf('</main>') + 7);
const v = (f) => crypto.createHash('md5').update(fs.readFileSync(path.join(root, 'assets/strength', f))).digest('hex').slice(0, 8);
const title = 'Wolf Strength Lab', desc = 'Costruisci una scheda di forza, cerca esercizi e registra gli allenamenti. Nessun account: i dati restano nel tuo browser, solo se scegli di conservarli.';
const e = (s) => s.replace(/"/g, '&quot;');
let h = head0.replace(/<title>[^<]*<\/title>/, `<title>${title} - Wolf Lab</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${e(desc)}">`)
  .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${SITE}${rel}">`)
  .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, '')
  .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title} - Wolf Lab">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${e(desc)}">`)
  .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${rel}">`)
  .replace(/<meta property="og:image"[^>]*data-seo="1">.*?(?=<\/head>)/s, '')
  .replace('</head>', `<link rel="stylesheet" href="/assets/strength/main.css?v=${v('main.css')}">\n</head>`);
const main = `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">TRAIN · FORZA</p><h1>Wolf Strength Lab</h1></div></header><div class="wrap w-body"><div id="strength-root"><noscript>Serve JavaScript per usare il builder.</noscript></div></div></main><script defer src="/assets/strength/main.js?v=${v('main.js')}"></script>`;
const out = path.join(root, rel.slice(1), 'index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, h + main + foot);
const sp = path.join(root, 'sitemap.xml'); let sm = fs.readFileSync(sp, 'utf8');
if (!sm.includes(SITE + rel + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${rel}</loc></url>\n</urlset>`);
fs.writeFileSync(sp, sm);
console.log('strength: 1 pagina');
