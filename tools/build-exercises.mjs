// Pagina statica /train/strength/esercizi/ (IT) e /en/train/strength/exercises/ (EN): sola consultazione del catalogo esistente (53 voci).
// Dati letti da strength-src/App.tsx (library, patterns) e dalle etichette EN gia presenti in en.py. Approfondimenti tecnici da fonti separate; nessun video.
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
const TECH=JSON.parse(fs.readFileSync(path.join(root,'content/exercise-technique.json'),'utf8'));
function variantText(name,lang){const d=TECH[name];return d&&d[lang]&&d[lang].variant?d[lang].variant.replace(/^[^:]*:\s*/,''):'';}
function variantLine(name,lang){const t=variantText(name,lang);if(!t)return '';return `<p class="exercise-variant">${lang==='en'?'Variant documented:':'Variante documentata:'} ${t}</p>`;}
function technique(name,lang){const d=TECH[name];if(!d)return '';const v=d[lang],en=lang==='en';return `<details class="exercise-technique"><summary>${en?'Technique and programming':'Tecnica e programmazione'}</summary><h4>${en?'Movement':'Movimento'}</h4><ol>${v.steps.map(x=>`<li>${x}</li>`).join('')}</ol><h4>${en?'Checks to avoid errors':'Controlli per evitare errori'}</h4><ul>${v.checks.map(x=>`<li>${x}</li>`).join('')}</ul><h4>${en?'Programming':'Programmazione'}</h4><p>${v.program}</p><p class="small">${en?'Editorial summary of the cited technique guide; no frequency of errors or comparative injury-risk claim.':'Sintesi editoriale della guida tecnica citata; non stima della frequenza degli errori o del rischio comparativo.'} <a href="${d.url}">${d.source}</a>.</p></details>`;}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const C = {
 it: { rel: '/train/strength/esercizi/', alt: '/en/train/strength/exercises/', shell: 'gear.html', builder: '/train/strength/#library', t: (s) => s,
  title: 'Catalogo esercizi', kick: 'STRENGTH · ESERCIZI', desc: 'Elenco di esercizi per gruppo muscolare, attrezzatura e schema motorio.',
  lede: 'Esercizi per gruppo muscolare, attrezzatura e schema motorio.', cols: ['Esercizio', 'Attrezzatura', 'Schema motorio'],
  note: 'Le schede con approfondimento tecnico riportano la fonte e, dove la fonte descrive una variante precisa, la variante sotto il nome. Le altre voci descrivono soltanto attrezzatura e movimento. I gruppi sono organizzativi e non esclusivi.', open: 'Apri il catalogo interattivo →' },
 en: { rel: '/en/train/strength/exercises/', alt: '/train/strength/esercizi/', shell: 'en/gear.html', builder: '/en/train/strength/#library', t: (s) => { if (!EN[s]) MISS.add(s); return EN[s] || s; },
  title: 'Exercise catalogue', kick: 'STRENGTH · EXERCISES', desc: 'List of exercises by muscle group, equipment and movement pattern.',
  lede: 'Exercises by muscle group, equipment and movement pattern.', cols: ['Exercise', 'Equipment', 'Movement pattern'],
  note: 'Entries with technique details cite their source and, where the source describes a specific variant, show it under the name. Other entries describe equipment and movement only. Groups are organisational and not exclusive.', open: 'Open the interactive catalogue →' },
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
  const filters = `<div class="exercise-filters"><label>${lang==='it'?'Cerca esercizio':'Find an exercise'}<input type="search" id="exercise-search" placeholder="${lang==='it'?'Nome o schema motorio':'Name or movement pattern'}"></label><label>${lang==='it'?'Attrezzatura':'Equipment'}<select id="exercise-equipment"><option value="">${lang==='it'?'Tutta':'All'}</option>${[...new Set(lib.map(e=>e[2]))].map(e=>`<option value="${esc(c.t(e))}">${esc(c.t(e))}</option>`).join('')}</select></label><label>${lang==='it'?'Movimento':'Movement'}<select id="exercise-movement"><option value="">${lang==='it'?'Tutti':'All'}</option>${[...new Set(pats)].map(p=>`<option value="${esc(c.t(p))}">${esc(c.t(p))}</option>`).join('')}</select></label><button type="button" id="exercise-reset">${lang==='it'?'Azzera filtri':'Reset filters'}</button></div>`;
  const body = groups.map((g, gi) => { const rows=lib.map((e,i)=>[e,i]).filter(([e])=>e[1]===g);
    return `<section class="exercise-muscle" id="muscle-${gi}"><h2>${esc(c.t(g))}</h2><ul class="exercise-cards">${rows.map(([e,i])=>{const n=lang==='it'?e[0]:(EN[e[0]]||e[0]);const eq=c.t(e[2]),pat=c.t(pats[i]);const olds=['Squat con bilanciere','Stacco da terra','Panca piana','Military press','Trazioni','Farmer walk'];const old=olds.indexOf(e[0]);return `<li class="exercise-card" data-equipment="${esc(eq)}" data-movement="${esc(pat)}" data-search="${esc(n+' '+pat+' '+variantText(e[0],lang))}">${old>=0?`<span id="catalogue-${old}"></span>`:''}<h3>${esc(n)}</h3>${variantLine(e[0],lang)}<dl><div><dt>${c.cols[1]}</dt><dd>${esc(eq)}</dd></div><div><dt>${c.cols[2]}</dt><dd>${esc(pat)}</dd></div></dl>${technique(e[0],lang)}</li>`}).join('')}</ul></section>`;
  }).join('');
  const script=`<script>(function(){var q=document.getElementById('exercise-search'),eq=document.getElementById('exercise-equipment'),mv=document.getElementById('exercise-movement'),cards=[].slice.call(document.querySelectorAll('.exercise-card'));function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')}function apply(){var t=norm(q.value);cards.forEach(function(c){c.hidden=!!(t&&!norm(c.dataset.search).includes(t)||eq.value&&c.dataset.equipment!==eq.value||mv.value&&c.dataset.movement!==mv.value)});document.querySelectorAll('.exercise-muscle').forEach(function(s){s.hidden=!s.querySelector('.exercise-card:not([hidden])')});document.getElementById('exercise-empty').hidden=cards.some(function(c){return !c.hidden})}q.addEventListener('input',apply);eq.addEventListener('change',apply);mv.addEventListener('change',apply);function reset(){q.value='';eq.value='';mv.value='';apply()}document.getElementById('exercise-reset').addEventListener('click',reset);document.querySelectorAll('.exercise-groups a').forEach(function(a){a.addEventListener('click',reset)})})()</script>`;
  const main=`<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${c.kick}</p><h1>${c.title}</h1></div></header><div class="wrap w-body exercise-catalogue">${jump}${filters}<p id="exercise-empty" hidden>${lang==='it'?'Nessun esercizio corrisponde ai filtri.':'No exercises match these filters.'}</p>${body}<p class="w-note">${c.note}</p></div></main>${script}`;
  const out = path.join(root, c.rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
  if (!sm.includes(SITE + c.rel + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${c.rel}</loc></url>\n</urlset>`);
}
fs.writeFileSync(sp, sm);
console.log('senza traduzione EN (gia internazionali?):', [...MISS].join(', '));
console.log('exercises: 2 pagine,', lib.length, 'esercizi');
