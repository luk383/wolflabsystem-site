// Ask Wolf: a declared rule-based guide. NOT artificial intelligence. Fixed questions, fixed answers, sources.
// Run last (after normalize-legacy). Also adds an Ask Wolf link to every footer. Idempotent.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const Q = [
  { q: ['Che ritmi uso in allenamento?', 'Which paces should I train at?'], a: ['Parti da un tempo di gara recente nel Wolf Engine: calcola VDOT e ritmi (facile, maratona, soglia, intervalli, ripetute). Sono stime da formula, non un test.', 'Start from a recent race time in Wolf Engine: it computes VDOT and paces (easy, marathon, threshold, interval, repetition). They are formula estimates, not a test.'], go: ['/run', '/en/run'], src: [['Daniels, Gilbert. Oxygen Power (1979)', 'http://www.vivamarathon.com/OxygenPower.htm']] },
  { q: ['Quanti carboidrati in gara?', 'How many carbohydrates during a race?'], a: ['Per sforzi oltre circa 2 ore le linee guida citano 60-90 g/h di carboidrati; il sodio non ha un valore fisso. Il Wolf Engine mostra un intervallo, mai un numero unico.', 'For efforts beyond about 2 hours, guidelines cite 60-90 g/h of carbohydrate; sodium has no fixed value. Wolf Engine shows a range, never a single number.'], go: ['/fuel', '/en/fuel'], src: [['Jeukendrup 2014, Sports Medicine', 'https://pubmed.ncbi.nlm.nih.gov/24791914/'], ['ACSM 2016, Nutrition and Athletic Performance', 'https://doi.org/10.1016/j.jand.2015.12.006']] },
  { q: ['Piramidale o polarizzato?', 'Pyramidal or polarized?'], a: ['Le prove non indicano un vincitore netto per tutti. Leggi la sintesi: cosa dicono gli studi, i limiti e come scegliere in base al tempo disponibile.', 'The evidence does not show a clear winner for everyone. Read the summary: what studies say, the limits, and how to choose based on your available time.'], go: ['/piramidale-o-polarizzato', '/en/pyramidal-or-polarized'], src: [] },
  { q: ['Come combino corsa e bici?', 'How do I combine running and cycling?'], a: ['La compatibilità dipende da carico, obiettivi e recupero. La libreria distingue corsa, bici e forza, con fonti e limiti. Il Wolf Engine non genera settimane di allenamento.', 'Compatibility depends on load, goals and recovery. The library separates running, cycling and strength, with sources and limits. Wolf Engine does not generate training weeks.'], go: ['/allenamento/#allenamento-9', '/en/training/#training-9'], src: [] },
  { q: ['Come scelgo le zone di potenza?', 'How do I choose power zones?'], a: ['Servono una stima di FTP e le zone di Coggan. Il Wolf Engine le calcola; un test reale resta più affidabile di una stima.', 'You need an FTP estimate and Coggan zones. Wolf Engine computes them; a real test is more reliable than an estimate.'], go: ['/ride', '/en/ride'], src: [] },
  { q: ['Quanto scaricare prima di una gara?', 'How much should I taper?'], a: ['Nelle sintesi di studi lo scarico più efficace dura circa due settimane, con volume ridotto in modo progressivo e intensità mantenuta. Sono medie.', 'In study syntheses the most effective taper lasts about two weeks, with volume cut progressively and intensity kept. These are averages.'], go: ['/articoli/scarico-pre-gara/', '/en/articles/race-taper/'], src: [] },
  { q: ['Caffeina, creatina: servono?', 'Caffeine, creatine: do they work?'], a: ['Leggi il livello di prova ingrediente per ingrediente nella Libreria. Non è una lista di acquisti.', 'Read the level of evidence ingredient by ingredient in the Library. It is not a shopping list.'], go: ['/allenamento/#integratori', '/en/training/#supplements'], src: [] },
];
for (const l of ['it', 'en']) {
  const it = l === 'it', i = it ? 0 : 1;
  const tpl = fs.readFileSync(path.join(root, it ? 'run.html' : 'en/run.html'), 'utf8');
  const title = 'Ask Wolf';
  const main = `<main id="main"><div class="page art"><header class="art-hero"><div class="wrap"><h1>Ask Wolf</h1><p class="lede">${it ? 'Guida a regole. Non è intelligenza artificiale.' : 'Rule-based guide. Not artificial intelligence.'}</p></div></header><div class="wrap inner-body prose"><p>${it ? 'Scegli una domanda: la risposta è scritta da noi, con le fonti e il link allo strumento. Non scrivi testo libero e nessun dato viene inviato.' : 'Pick a question: the answer is written by us, with sources and a link to the tool. You do not type free text and no data is sent.'}</p>${Q.map((x) => `<details class="ask-q"><summary>${esc(x.q[i])}</summary><p>${esc(x.a[i])}</p><p><a href="${x.go[i]}">${it ? 'Apri lo strumento o la pagina' : 'Open the tool or page'}</a></p>${x.src.length ? `<ul class="w-src">${x.src.map(([t, u]) => `<li><a href="${u}" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>` : ''}</details>`).join('')}<p class="w-foot dim">${it ? 'Non è un consiglio medico. Una risposta libera con intelligenza artificiale non è attiva.' : 'This is not medical advice. A free-form AI answer is not active.'}</p></div></div></main>`;
  let h = tpl.replace(/ aria-current="page"/g, '').replace(/<title>[\s\S]*?<\/title>/, `<title>${title} - Wolf Lab</title>`).replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g, '$1' + esc(it ? 'Guida a regole di Wolf Lab, non intelligenza artificiale.' : 'Wolf Lab rule-based guide, not artificial intelligence.')).replace(/(<meta property="og:title" content=")[^"]*/, `$1${title} - Wolf Lab`);
  const url = `https://www.wolflabsystem.com${it ? '/ask-wolf/' : '/en/ask-wolf/'}`;
  h = h.replace(/(<link rel="canonical" href=")[^"]+/, '$1' + url).replace(/(<meta property="og:url" content=")[^"]+/, '$1' + url);
  h = h.replace(/<link rel="stylesheet" href="\/assets\/news\.css[^>]*>/, '').replace(/<script defer src="\/assets\/news\.js[^>]*><\/script>/, '');
  h = h.replace(/<main id="main">[\s\S]*?<\/main>/, main).replace(/<a class="lang"[^>]*>[^<]*<\/a>/, `<a class="lang" href="${it ? '/en/ask-wolf/' : '/ask-wolf/'}" hreflang="${it ? 'en' : 'it'}" lang="${it ? 'en' : 'it'}">${it ? 'English' : 'Italiano'}</a>`);
  h = h.replace(/<link rel="alternate" hreflang="(it|en)" href="[^"]*">/g, '');
  const out = path.join(root, it ? 'ask-wolf' : 'en/ask-wolf'); fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'index.html'), h);
}
// footer link everywhere (idempotent)
const walk = (d, o = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['.git', 'node_modules', 'content', 'tools', 'assets'].includes(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p, o) : e.name.endsWith('.html') && o.push(p); } return o; };
let n = 0;
for (const f of walk(root)) {
  let h = fs.readFileSync(f, 'utf8'); if (!/class="foot-links"/.test(h) || h.includes('/ask-wolf/')) continue;
  const en = /<html lang="en"/.test(h);
  const h2 = h.replace(/(<a href="[^"]*">(?:Novità|News)<\/a>)/, `$1 <a href="${en ? '/en/ask-wolf/' : '/ask-wolf/'}">Ask Wolf</a>`);
  if (h2 !== h) { fs.writeFileSync(f, h2); n++; }
}
const sp = path.join(root, 'sitemap.xml'); let sm = fs.readFileSync(sp, 'utf8');
for (const u of ['/ask-wolf/', '/en/ask-wolf/']) if (!sm.includes(`${u}</loc>`)) sm = sm.replace('</urlset>', `<url><loc>https://www.wolflabsystem.com${u}</loc></url>\n</urlset>`);
fs.writeFileSync(sp, sm);
console.log('ask-wolf built; footer links added to', n);
