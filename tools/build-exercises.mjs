// Pagina statica /train/strength/esercizi/ (IT) e /en/train/strength/exercises/ (EN): sola consultazione del catalogo esistente (53 voci).
// Dati letti da strength-src/App.tsx (library, patterns) e dalle etichette EN gia presenti in en.py. Nessuna istruzione tecnica, nessun video.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || path.join(import.meta.dirname, '..'));
const src = path.resolve(import.meta.dirname, 'strength-src');
const SITE = 'https://wolflabsystem.com';
const app = fs.readFileSync(path.join(src, 'App.tsx'), 'utf8');
const grab = (n) => eval(app.match(new RegExp('const ' + n + '=(\\[.*?\\]);\\n'))[1]);
const lib = grab('library'), pats = grab('patterns');
if (lib.length !== 53 || pats.length !== 53) throw new Error('catalogo: attese 53 voci, trovate ' + lib.length + '/' + pats.length);
const EN = {}; for (const f of ['en.py', 'en_method.py', 'en_progress.py']) for (const m of fs.readFileSync(path.join(src, f), 'utf8').matchAll(/"([^"\n]+)":\s*"([^"\n]*)"/g)) if (!(m[1] in EN)) EN[m[1]] = m[2];
const MISS = new Set();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const C = {
 it: { rel: '/train/strength/esercizi/', alt: '/en/train/strength/exercises/', shell: 'gear.html', builder: '/train/strength/#library', t: (s) => s,
  title: 'Catalogo esercizi', kick: 'STRENGTH · ESERCIZI', desc: 'Elenco di 53 esercizi per gruppo muscolare, attrezzatura e schema motorio.',
  lede: 'Elenco di consultazione: 53 esercizi.', cols: ['Esercizio', 'Attrezzatura', 'Schema motorio'],
  note: 'Catalogo di consultazione, senza video né istruzioni tecniche. Le etichette sono organizzative e non esclusive. Non è una guida all’esecuzione.', open: 'Apri il catalogo interattivo →' },
 en: { rel: '/en/train/strength/exercises/', alt: '/train/strength/esercizi/', shell: 'en/gear.html', builder: '/en/train/strength/#library', t: (s) => { if (!EN[s]) MISS.add(s); return EN[s] || s; },
  title: 'Exercise catalogue', kick: 'STRENGTH · EXERCISES', desc: 'List of 53 exercises by muscle group, equipment and movement pattern.',
  lede: 'Reference list: 53 exercises.', cols: ['Exercise', 'Equipment', 'Movement pattern'],
  note: 'Reference catalogue, with no videos or technique instructions. Labels are organisational and not exclusive. It is not an execution guide.', open: 'Open the interactive catalogue →' },
};
const sp = path.join(root, 'sitemap.xml'); let sm = fs.readFileSync(sp, 'utf8');
for (const [lang, c] of Object.entries(C)) {
  const shell = fs.readFileSync(path.join(root, c.shell), 'utf8');
  const head0 = shell.slice(0, shell.indexOf('<main')), foot = shell.slice(shell.indexOf('</main>') + 7);
  const h = head0.replace(/<title>[^<]*<\/title>/, `<title>${c.title} - Wolf Lab</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(c.desc)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${SITE}${c.rel}">`)
    .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, `<link rel="alternate" hreflang="it" href="${SITE}${C.it.rel}">\n<link rel="alternate" hreflang="en" href="${SITE}${C.en.rel}">\n`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(c.title)} - Wolf Lab">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(c.desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${c.rel}">`)
    .replace(/<meta property="og:image"[^>]*data-seo="1">.*?(?=<\/head>)/s, '')
    .replace(/<a class="lang" href="[^"]*" hreflang="(it|en)" lang="(it|en)">/, `<a class="lang" href="${c.alt}" hreflang="${lang === 'it' ? 'en' : 'it'}" lang="${lang === 'it' ? 'en' : 'it'}">`);
  const groups = [...new Set(lib.map((e) => e[1]))];
  const body = groups.map((g) => { const rows = lib.map((e, i) => [e, i]).filter(([e]) => e[1] === g);
    return `<h2>${esc(c.t(g))} <small>${rows.length}</small></h2><table class="w-table"><thead><tr>${c.cols.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(([e, i]) => `<tr><td>${esc(lang === 'it' ? e[0] : (EN[e[0]] || e[0]))}</td><td>${esc(c.t(e[2]))}</td><td>${esc(c.t(pats[i]))}</td></tr>`).join('')}</tbody></table>`; }).join('\n');
  const main = `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${c.kick}</p><h1>${c.title}</h1><p class="w-lede">${c.lede}</p></div></header><div class="wrap w-body w-prose">${body}<p class="w-note">${c.note}</p></div></main>`;
  const out = path.join(root, c.rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
  if (!sm.includes(SITE + c.rel + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${c.rel}</loc></url>\n</urlset>`);
}
fs.writeFileSync(sp, sm);
console.log('senza traduzione EN (gia internazionali?):', [...MISS].join(', '));
console.log('exercises: 2 pagine,', lib.length, 'esercizi');
