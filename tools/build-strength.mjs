// Genera /train/strength/ (IT) e /en/train/strength/ (EN). Builder IT in assets/strength/, EN in assets/strength/en/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com';
const v = (f) => crypto.createHash('md5').update(fs.readFileSync(path.join(root, 'assets/strength', f))).digest('hex').slice(0, 8);
const esc = (s) => s.replace(/"/g, '&quot;');
const L = {
  it: { rel: '/train/strength/', alt: '/en/train/strength/', shell: 'gear.html', dir: '', title: 'Forza: catalogo e schede', kick: 'TRAIN · FORZA',
    desc: 'Catalogo esercizi e schede metodologiche dei programmi di forza.', ns: 'Serve JavaScript per usare il builder.' },
  en: { rel: '/en/train/strength/', alt: '/train/strength/', shell: 'en/gear.html', dir: 'en/', title: 'Strength: catalogue and routines', kick: 'TRAIN · STRENGTH',
    desc: 'Exercise catalogue and methodological notes on strength programs.', ns: 'JavaScript is required to use the builder.' },
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
  const links = lang === 'it'
    ? [['/train/strength/esercizi/', 'Catalogo esercizi', '53 esercizi per muscolo, attrezzo e schema.'], ['/train/strength/starr-5x5/', 'Bill Starr 5×5', 'Origine, struttura e varianti, con fonti.'], ['/strength/', 'STRENGTH', 'Programmi, metodi e forza per l\'endurance.']]
    : [['/en/train/strength/exercises/', 'Exercise catalogue', '53 exercises by muscle, equipment and pattern.'], ['/en/train/strength/starr-5x5/', 'Bill Starr 5×5', 'Origin, structure and variants, with sources.'], ['/en/strength/', 'STRENGTH', 'Programs, methods and strength for endurance.']];
  const main = `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${c.kick}</p><h1>${c.title}</h1></div></header><div class="wrap w-body"><ul class="w-list">${links.map(([u, t, d], i) => `<li><a href="${u}"><span class="w-n">0${i + 1}</span><span class="w-t"><b>${t}</b><small>${d}</small></span><span class="w-go" aria-hidden="true">→</span></a></li>`).join('')}</ul></div></main>`;
  const out = path.join(root, c.rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
  if (!sm.includes(SITE + c.rel + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${c.rel}</loc></url>\n</urlset>`);
}
fs.writeFileSync(sp, sm);
console.log('strength: 2 pagine');
