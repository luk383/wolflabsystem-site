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
  title: 'Catalogo esercizi', kick: 'STRENGTH · ESERCIZI', desc: 'Elenco di esercizi per gruppo muscolare, attrezzatura e schema motorio.',
  lede: 'Esercizi per gruppo muscolare, attrezzatura e schema motorio.', cols: ['Esercizio', 'Attrezzatura', 'Schema motorio'],
  note: 'Catalogo di consultazione, senza video né istruzioni tecniche. Le etichette sono organizzative e non esclusive. Non è una guida all’esecuzione.', open: 'Apri il catalogo interattivo →' },
 en: { rel: '/en/train/strength/exercises/', alt: '/train/strength/esercizi/', shell: 'en/gear.html', builder: '/en/train/strength/#library', t: (s) => { if (!EN[s]) MISS.add(s); return EN[s] || s; },
  title: 'Exercise catalogue', kick: 'STRENGTH · EXERCISES', desc: 'List of exercises by muscle group, equipment and movement pattern.',
  lede: 'Exercises by muscle group, equipment and movement pattern.', cols: ['Exercise', 'Equipment', 'Movement pattern'],
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
  const jump = `<nav class="exercise-groups" aria-label="${lang==='it'?'Gruppi muscolari':'Muscle groups'}">${groups.map((g,i)=>`<a href="#muscle-${i}">${esc(c.t(g))}</a>`).join('')}</nav>`;
  const filters = `<div class="exercise-filters"><label>${lang==='it'?'Cerca esercizio':'Find an exercise'}<input type="search" id="exercise-search" placeholder="${lang==='it'?'Nome o schema motorio':'Name or movement pattern'}"></label><label>${lang==='it'?'Attrezzatura':'Equipment'}<select id="exercise-equipment"><option value="">${lang==='it'?'Tutta':'All'}</option>${[...new Set(lib.map(e=>e[2]))].map(e=>`<option value="${esc(c.t(e))}">${esc(c.t(e))}</option>`).join('')}</select></label><button type="button" id="exercise-reset">${lang==='it'?'Azzera filtri':'Reset filters'}</button></div>`;
  const body = groups.map((g, gi) => { const rows=lib.map((e,i)=>[e,i]).filter(([e])=>e[1]===g);
    return `<section class="exercise-muscle" id="muscle-${gi}"><h2>${esc(c.t(g))}</h2><ul class="exercise-cards">${rows.map(([e,i])=>{const n=lang==='it'?e[0]:(EN[e[0]]||e[0]);const eq=c.t(e[2]),pat=c.t(pats[i]);const olds=['Squat con bilanciere','Stacco da terra','Panca piana','Military press','Trazioni','Farmer walk'];const old=olds.indexOf(e[0]);return `<li class="exercise-card" data-equipment="${esc(eq)}" data-search="${esc(n+' '+pat)}">${old>=0?`<span id="catalogue-${old}"></span>`:''}<h3>${esc(n)}</h3><dl><div><dt>${c.cols[1]}</dt><dd>${esc(eq)}</dd></div><div><dt>${c.cols[2]}</dt><dd>${esc(pat)}</dd></div></dl></li>`}).join('')}</ul></section>`;
  }).join('');
  const script=`<script>(function(){var q=document.getElementById('exercise-search'),eq=document.getElementById('exercise-equipment'),cards=[].slice.call(document.querySelectorAll('.exercise-card'));function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')}function apply(){var t=norm(q.value);cards.forEach(function(c){c.hidden=!!(t&&!norm(c.dataset.search).includes(t)||eq.value&&c.dataset.equipment!==eq.value)});document.querySelectorAll('.exercise-muscle').forEach(function(s){s.hidden=!s.querySelector('.exercise-card:not([hidden])')});document.getElementById('exercise-empty').hidden=cards.some(function(c){return !c.hidden})}q.addEventListener('input',apply);eq.addEventListener('change',apply);document.getElementById('exercise-reset').addEventListener('click',function(){q.value='';eq.value='';apply()})})()</script>`;
  const main=`<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${c.kick}</p><h1>${c.title}</h1></div></header><div class="wrap w-body exercise-catalogue">${jump}${filters}<p id="exercise-empty" hidden>${lang==='it'?'Nessun esercizio corrisponde ai filtri.':'No exercises match these filters.'}</p>${body}<p class="w-note">${c.note}</p></div></main>${script}`;
  const out = path.join(root, c.rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
  if (!sm.includes(SITE + c.rel + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${c.rel}</loc></url>\n</urlset>`);
}
fs.writeFileSync(sp, sm);
console.log('senza traduzione EN (gia internazionali?):', [...MISS].join(', '));
console.log('exercises: 2 pagine,', lib.length, 'esercizi');
