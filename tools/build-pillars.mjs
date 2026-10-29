import { organize } from './discipline-architecture.mjs';
// WOLF: struttura a 5 pilastri (RUN RIDE SWIM STRENGTH ARTICOLI). Home, hub discipline, hub articoli, nav e footer.
// Usa solo pagine esistenti (controlla ogni link). Idempotente. Uso: node tools/build-pillars.mjs [root]
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(process.argv[2] || path.join(import.meta.dirname, '..'));
const SITE = 'https://wolflabsystem.com';
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), s); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const exists = (href) => { const p = href.split('#')[0].split('?')[0]; const c = [p + '.html', p.endsWith('/') ? p + 'index.html' : p + '/index.html', p + 'index.html']; return p === '/' || c.some((x) => fs.existsSync(path.join(root, x))); };
const bad = [];
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
const BIKE_RACES = JSON.parse(fs.readFileSync(path.join(root, 'content/races.json'), 'utf8')).races.filter((r) => r.sport === 'bike' && r.listed !== false && r.date >= TODAY).length;
const RUN_RACES = JSON.parse(fs.readFileSync(path.join(root, 'content/races.json'), 'utf8')).races.filter((r) => r.sport === 'run' && r.listed !== false && r.date >= TODAY).length;
const link = (href) => { if (!exists(href)) bad.push(href); return href; };

// ---- articoli: tag disciplina + tipo (da conferma editoriale dove marcato ?)
const TAGS = { 'cadenza-bici-protocolli': ['RIDE', 'METODO'], 'sprint-interval-training-ciclismo': ['RIDE', 'METODO'], 'push-pull-legs-varianti': ['STRENGTH', 'METODO'], 'starting-strength-progressione-novizi': ['STRENGTH', 'METODO'], 'phul-campbell-upper-lower': ['STRENGTH', 'METODO'], '8020-running-fitzgerald': ['RUN', 'METODO'], 'gzclp-progressione-lineare': ['STRENGTH', 'METODO'],
  'bici-per-la-maratona': ['RUN', 'ANALISI'], 'caffeina-e-prestazione': ['TRASVERSALE', 'GUIDA'], 'carboidrati-maratona': ['RUN', 'GUIDA'],
  'forza-per-endurance': ['STRENGTH', 'ANALISI'], 'ftp-e-zone-di-potenza': ['RIDE', 'GUIDA'], 'hyrox-triathlon-lungo-studi': ['HYBRID', 'ANALISI'],
  'quanta-intensita-serve': ['HYBRID', 'ANALISI'], 'nuoto-acque-libere-regole-fin-master': ['SWIM', 'GUIDA'], 'nuoto-acque-libere-sicurezza': ['SWIM', 'GUIDA'],
  'nuoto-css-velocita-critica': ['SWIM', 'GUIDA'], 'nuoto-gare-e-formati': ['SWIM', 'GUIDA'], 'nuoto-metodi-di-allenamento': ['SWIM', 'METODO'], 'usrpt-nuoto-ritmo-gara': ['SWIM', 'METODO'], 'total-immersion-nuoto': ['SWIM', 'GUIDA'], 'swim-smooth-zone-css': ['SWIM', 'METODO'],
  'nuoto-orientamento-sighting': ['SWIM', 'GUIDA'], 'nuoto-piscina-acque-libere': ['SWIM', 'ANALISI'], 'nuoto-ritmo-gara-triathlon': ['SWIM', 'GUIDA'],
  'nuoto-sedute-esercizi-transizione': ['SWIM', 'METODO'], 'nuoto-tecnica-bracciata': ['SWIM', 'ANALISI'], 'scarpe-con-piastra-carbonio': ['RUN', 'ANALISI'],
  'sonno-e-recupero': ['TRASVERSALE', 'GUIDA'], 'metodo-norvegese-doppia-soglia': ['RUN', 'METODO'], 'forza-corsa-metodi': ['STRENGTH', 'METODO'], 'forza-nuoto-metodi': ['STRENGTH', 'METODO'], 'forza-bici-metodi': ['STRENGTH', 'METODO'], 'daniels-vdot-metodo': ['RUN', 'METODO'], 'pfitzinger-maratona-18-settimane': ['RUN', 'METODO'], 'sweet-spot-ciclismo': ['RIDE', 'METODO'], 'intervalli-vo2max-ciclismo': ['RIDE', 'METODO'], 'maf-180-maffetone': ['RUN', 'METODO'], 'hansons-maratona-metodo': ['RUN', 'METODO'], 'lydiard-fasi-base-aerobica': ['RUN', 'METODO'], 'stronglifts-5x5-programma': ['STRENGTH', 'METODO'], 'texas-method-programma': ['STRENGTH', 'METODO'], '531-wendler-principianti': ['STRENGTH', 'METODO'], 'scarico-pre-gara': ['RUN', 'GUIDA'],
};
const arts = fs.readdirSync(path.join(root, 'content/articles')).filter((f) => f.endsWith('.it.html')).map((f) => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'content/articles', f), 'utf8').match(/<!--meta([\s\S]*?)-->/)[1]);
  const t = TAGS[m.slug]; if (!t) bad.push('TAG mancante ' + m.slug);
  return { ...m, d: (t || ['?', '?'])[0], k: (t || ['?', '?'])[1], href: link('/articoli/' + m.slug + '/') };
}).sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));
const PICKS = [
  ['Guida: scarpe da allenamento', '/picks/scarpe-allenamento/', 'RUN', 'GUIDA'], ['Confronto Evo SL, Novablast 6, Ghost 18', '/picks/confronto-evo-sl-novablast-6-ghost-18/', 'RUN', 'COMPARAZIONE'],
  ['Gel di carboidrati: tre confronti sui dati dichiarati', '/picks/gel-carboidrati/', 'RUN', 'COMPARAZIONE'], ['Ciclocomputer: come scegliere', '/picks/ciclocomputer/', 'RIDE', 'GUIDA'],
].map(([title, href, d, k]) => ({ title, href: link(href), d, k }));

// ---- shell
const shell = rd('run.html'); const head0 = shell.slice(0, shell.indexOf('<main')); const foot0 = shell.slice(shell.indexOf('</main>') + 7);
const NAV = [['RUN', '/run'], ['RIDE', '/ride'], ['SWIM', '/swim'], ['STRENGTH', '/strength/'], ['ARTICOLI', '/articoli/'], ['WOLF ENGINE', '/engine']];
const navHtml = (cur) => `<nav class="nav" aria-label="Principale">${NAV.map(([l, h]) => `<a href="${h}"${cur === l ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const footHtml = `<nav class="foot-links" aria-label="Piè di pagina"><a href="/metodologia">Metodologia</a> <a href="/contatti/">Contatti</a> <a href="/app/">App Android</a> <a href="https://www.instagram.com/wolflabsystem/" rel="noopener" target="_blank">Instagram</a> <a href="/feed.xml">RSS</a></nav>`;
const patchChrome = (h, cur) => h.replace(/<nav class="nav"[\s\S]*?<\/nav>/, navHtml(cur)).replace(/<nav class="foot-links"[\s\S]*?<\/nav>/, footHtml);
const meta = (h, { title, desc, url, en }) => h.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`).replace(/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`)
  .replace(/(<link rel="canonical" href=")[^"]*/, `$1${SITE}${url}`).replace(/(<link rel="alternate" hreflang="it" href=")[^"]*/, `$1${SITE}${url}`).replace(/(<link rel="alternate" hreflang="en" href=")[^"]*/, `$1${SITE}${en}`)
  .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`).replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`).replace(/(<meta property="og:url" content=")[^"]*/, `$1${SITE}${url}`)
  .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`).replace(/(<a class="lang" href=")[^"]*/, `$1${en}`);
const page = (cur, m, main) => patchChrome(meta(head0, m), cur) + `<main id="main">\n${main}\n</main>` + foot0.replace(/<nav class="foot-links"[\s\S]*?<\/nav>/, footHtml);
const item = (n, t, s, href) => `<li class="w-item"><a href="${link(href)}"><span class="w-num">${String(n).padStart(2, '0')}</span><span class="w-txt"><b>${esc(t)}</b><small>${esc(s)}</small></span><span class="w-go" aria-hidden="true">→</span></a></li>`;
const tag = (d, k) => `<span class="pl-tag">${d} · ${k}</span>`;

// ---- discipline: 4 blocchi, solo link a pagine esistenti
const DISC = {
  RUN: { url: '/run', en: '/en/run', desc: 'Allenamento, prestazione, gare e materiali per la corsa.', lead: 'Allenamento, prestazione, gare e materiali.', leadHtml: 'Maratona di New York, 1 novembre 2026: <a href="/articoli/scarico-pre-gara/" style="color:#D6FF35;text-decoration:underline">scarico pre-gara</a> · <a href="/articoli/carboidrati-maratona/" style="color:#D6FF35;text-decoration:underline">carboidrati</a>.', blocks: [
    ['TRAINING', [['80/20 Running', 'Zone, conteggio dei minuti e limiti.', '/articoli/8020-running-fitzgerald/'], ['Distribuzione dell\'intensità', 'Piramidale e polarizzato in corsa.', '/allenamento/?s=run#allenamento-0'], ['Scarico pre-gara', 'Quanto e come ridurre.', '/articoli/scarico-pre-gara/'], ['La bici per preparare la maratona', 'Cosa trasferisce e cosa no.', '/articoli/bici-per-la-maratona/'], ['Pfitzinger', 'Maratona in 18 settimane.', '/articoli/pfitzinger-maratona-18-settimane/'], ['Daniels e il VDOT', 'Cinque intensità e 24 settimane.', '/articoli/daniels-vdot-metodo/'], ['Lydiard', 'Base aerobica, colline e rifinitura.', '/articoli/lydiard-fasi-base-aerobica/'], ['Hansons', 'Maratona con fatica accumulata.', '/articoli/hansons-maratona-metodo/'], ['MAF di Maffetone', 'La formula 180 e i suoi limiti.', '/articoli/maf-180-maffetone/'], ['Metodo norvegese', 'Soglia guidata dal lattato: versioni, prove, limiti.', '/articoli/metodo-norvegese-doppia-soglia/'], ['Forza per la corsa', 'Metodi studiati e protocolli.', '/articoli/forza-corsa-metodi/'], ['Metodi di allenamento', 'Libreria dei metodi, filtro Corsa.', '/allenamento/?s=run#allenamento']]],
    ['PERFORMANCE', [['Wolf Engine', 'Ritmi, VDOT e zone dai tuoi tempi.', '/engine'], ['Passaggi in maratona', 'Tempi di passaggio a ritmo costante.', '/allenamento/#passaggi']]],
    ['RACE', [['Gare di corsa', 'Date, distanze e fonti.', '/gare/?f=run']]],
    ['FUEL & RECOVERY', [['Carboidrati in maratona', 'Quanti all\'ora, in base alla durata.', '/articoli/carboidrati-maratona/'], ['Calcolatore carboidrati', 'Gel, grammi e tempi di assunzione.', '/allenamento/#carboidrati'], ['Gel di carboidrati', 'Confronto sui dati dichiarati.', '/picks/gel-carboidrati/'], ['Sonno e recupero', 'Il miglioramento più economico.', '/articoli/sonno-e-recupero/'], ['Caffeina e prestazione', 'Dosi, tempi e quando evitarla.', '/articoli/caffeina-e-prestazione/']]],
    ['GEAR', [['Scarpe da allenamento', 'Guida e criteri.', '/picks/scarpe-allenamento/'], ['Confronto Evo SL, Novablast 6, Ghost 18', 'Dati con fonte, nessun punteggio.', '/picks/confronto-evo-sl-novablast-6-ghost-18/'], ['Scarpe con piastra in carbonio', 'Cosa dicono gli studi.', '/articoli/scarpe-con-piastra-carbonio/']]]] },
  RIDE: { url: '/ride', en: '/en/ride', desc: 'Potenza, FTP, gare e materiali per la bici.', lead: 'Potenza, gare e materiali.', blocks: [
    ['TRAINING', [['Cadenza in bici', 'Protocolli, recuperi e limiti delle prove.', '/articoli/cadenza-bici-protocolli/'], ['Sprint interval training', 'Protocollo massimale e limiti delle prove.', '/articoli/sprint-interval-training-ciclismo/'], ['FTP e zone di potenza', 'Cosa misurano e quanto fidarsi.', '/articoli/ftp-e-zone-di-potenza/'], ['Distribuzione dell\'intensità', 'Piramidale e polarizzato in bici.', '/allenamento/?s=ride#allenamento-4'], ['Sweet spot', 'Una convenzione, non una soglia.', '/articoli/sweet-spot-ciclismo/'], ['Intervalli per il VO₂max', 'Brevi o lunghi, con lo studio.', '/articoli/intervalli-vo2max-ciclismo/'], ['Forza per la bici', 'Carichi pesanti e protocollo studiato.', '/articoli/forza-bici-metodi/'], ['Metodi di allenamento', 'Libreria dei metodi, filtro Bici.', '/allenamento/?s=ride#allenamento']]],
    ['PERFORMANCE', [['Wolf Engine', 'Zone di potenza dalla tua FTP.', '/engine']]],
    ['RACE', [['Gare in bici', 'Granfondo, date e fonti.', '/gare/?f=bike']]],
    ['FUEL & RECOVERY', [['Sonno e recupero', 'Il miglioramento più economico.', '/articoli/sonno-e-recupero/']]],
    ['GEAR', [['Ciclocomputer', 'Guida.', '/picks/ciclocomputer/']]]] },
  SWIM: { url: '/swim', en: '/en/swim', desc: 'Velocità critica, metodi, acque libere e gare di nuoto.', lead: 'Velocità critica, metodi e acque libere.', blocks: [
    ['TRAINING', [['Velocità critica (CSS)', 'Cos\'è e dove smette di valere.', '/articoli/nuoto-css-velocita-critica/'], ['Forza per nuotatori', 'Metodi a secco e in acqua.', '/articoli/forza-nuoto-metodi/'], ['Metodi di allenamento', 'Distribuzione dell\'intensità.', '/articoli/nuoto-metodi-di-allenamento/'], ['USRPT', 'Ripetizioni brevi a ritmo gara.', '/articoli/usrpt-nuoto-ritmo-gara/'], ['Total Immersion', 'Una scuola di tecnica.', '/articoli/total-immersion-nuoto/'], ['Swim Smooth', 'Zone basate sulla CSS.', '/articoli/swim-smooth-zone-css/'], ['Tecnica di nuoto', 'Frequenza e lunghezza di bracciata.', '/articoli/nuoto-tecnica-bracciata/'], ['Sedute ed esercizi', 'Struttura, esercizi e passaggio al triathlon.', '/articoli/nuoto-sedute-esercizi-transizione/'], ['Piscina e acque libere', 'Cosa cambia tra i due ambienti.', '/articoli/nuoto-piscina-acque-libere/']]],
    ['PERFORMANCE', [['Wolf Engine', 'CSS dai tuoi test su 200 e 400 m. Zone di nuoto non ancora disponibili.', '/engine'], ['Ritmo di gara nel triathlon', 'Gestire la frazione di nuoto.', '/articoli/nuoto-ritmo-gara-triathlon/']]],
    ['RACE', [['Gare e formati', 'Acque libere, triathlon, IRONMAN.', '/articoli/nuoto-gare-e-formati/'], ['Regolamento FIN Master', 'Acque libere in Italia.', '/articoli/nuoto-acque-libere-regole-fin-master/'], ['Sicurezza in acque libere', 'Acqua fredda e muta.', '/articoli/nuoto-acque-libere-sicurezza/'], ['Orientamento in acque libere', 'Sighting ed esercizi in piscina.', '/articoli/nuoto-orientamento-sighting/']]],
    ['FUEL & RECOVERY', [['Sonno e recupero', 'Il miglioramento più economico.', '/articoli/sonno-e-recupero/']]],
    ['GEAR', []]] },
  STRENGTH: { url: '/strength/', en: '/en/strength/', desc: 'Forza per l\'atleta endurance: programmi, esercizi, metodi.', lead: 'Come deve allenare la forza un atleta endurance?', blocks: [
    ['PROGRAMS', [['Push/Pull/Legs', 'Ripartizione e versioni: tre giorni non sono sei.', '/articoli/push-pull-legs-varianti/'], ['Starting Strength', 'Progressione del novizio e tre fasi ufficiali.', '/articoli/starting-strength-progressione-novizi/'], ['PHUL', 'Upper/lower: forza e ipertrofia in quattro giorni.', '/articoli/phul-campbell-upper-lower/'], ['GZCLP', 'Tre livelli, progressione e ripartenze.', '/articoli/gzclp-progressione-lineare/'], ['Bill Starr 5×5', 'Origine, struttura e varianti, con fonti.', '/train/strength/starr-5x5/'], ['StrongLifts 5×5', 'Due sedute a corpo intero alternate: struttura e progressione.', '/articoli/stronglifts-5x5-programma/'], ['Texas Method', 'Volume, recupero e intensità nella settimana.', '/articoli/texas-method-programma/'], ['5/3/1 di Wendler', 'Variante per principianti e training max.', '/articoli/531-wendler-principianti/'], ['Protocolli studiati: corsa', 'Serie, ripetizioni e carichi negli studi.', '/articoli/forza-corsa-metodi/#protocolli'], ['Protocolli studiati: bici', 'Il protocollo di 12 settimane testato.', '/articoli/forza-bici-metodi/#protocolli']]],
    ['EXERCISES', [['Catalogo esercizi', 'esercizi per muscolo, attrezzo e schema.', '/train/strength/esercizi/']]],
    ['METHODS', [['Forza per la corsa', 'Carichi alti, pliometria e altri metodi.', '/articoli/forza-corsa-metodi/'], ['Forza per la bici', 'Cosa mostrano gli studi sui ciclisti.', '/articoli/forza-bici-metodi/'], ['Forza, ipertrofia e potenza', 'Tre risultati diversi, da non confondere.', '/allenamento/#allenamento-4'], ['Forza e endurance insieme', 'Cosa dicono le revisioni.', '/allenamento/#allenamento-4']]],
    ['ENDURANCE STRENGTH', [['Forza per nuotatori', 'Studi in piscina, protocolli e limiti di trasferimento.', '/articoli/forza-nuoto-metodi/'], ['Forza per runner e ciclisti', 'Interferenza o vantaggio?', '/articoli/forza-per-endurance/'], ['Sonno e recupero', 'Il miglioramento più economico.', '/articoli/sonno-e-recupero/']]],
    ['GEAR', []]] },
};
organize(DISC, false);
for (const [name, d] of Object.entries(DISC)) {
  const file = name === 'STRENGTH' ? 'strength/index.html' : name.toLowerCase() + '.html';
  const blocks = d.blocks.map(([b, items]) => `<details class="pl-d"><summary><span>${b}</span></summary>${items.length ? `<ul class="w-list">${items.map((it, i) => item(i + 1, ...it)).join('')}</ul>` : '<p class="pl-empty">Nessuna guida pubblicata in questa categoria.</p>'}</details>`).join('');
  const more = `<p class="pl-more"><a href="/articoli/?d=${name}">Tutti gli articoli ${name} →</a></p>`;
  wr(file, page(name, { title: `${name} - Wolf Lab`, desc: d.desc, url: d.url, en: d.en },
    `<header class="w-page-hero"><div class="wrap"><p class="w-kicker">${name}</p><h1>${name === 'STRENGTH' ? 'Forza per chi corre, pedala e nuota.' : name}</h1>${name === 'STRENGTH' ? '' : `<p class="pl-lead">${d.leadHtml ? esc(d.lead) + ' ' + d.leadHtml : esc(d.lead)}</p>`}</div></header><div class="wrap w-body"><div class="pl-blocks">${blocks}</div>${more}</div>`));
}

// ---- articoli: un solo hub con tag
const DISCS = ['RUN', 'RIDE', 'SWIM', 'STRENGTH', 'HYBRID'], TYPES = ['ANALISI', 'GUIDA', 'REVIEW', 'COMPARAZIONE', 'METODO'];
const rows = [...arts.map((a) => ({ title: a.title, href: a.href, d: a.d, k: a.k, min: a.minutes })), ...PICKS];
const row = (r) => `<li class="pl-row" data-d="${r.d}" data-k="${r.k}"><a href="${r.href}">${tag(r.d, r.k)}<b>${esc(r.title)}</b>${r.min ? `<small>${r.min} min</small>` : ''}</a></li>`;
const chips = (arr, key) => arr.map((x) => `<button type="button" class="pl-chip" data-${key}="${x}">${x}</button>`).join('');
wr('articoli/index.html', page('ARTICOLI', { title: 'Articles - Wolf Lab', desc: 'Analisi, guide, review, comparazioni e metodi per RUN, RIDE, SWIM e STRENGTH.', url: '/articoli/', en: '/en/articles/' },
  `<header class="w-page-hero"><div class="wrap"><p class="w-kicker">ARTICLES</p><h1>Articles</h1></div></header><div class="wrap w-body"><div class="pl-filters" aria-label="Filtri"><div>${chips(DISCS, 'd')}</div><div>${chips(TYPES, 'k')}</div></div><ul class="pl-rows" id="pl-rows">${rows.map(row).join('')}</ul><p class="pl-empty" id="pl-empty" hidden>Nessun contenuto ancora.</p><p class="pl-more"><a href="/allenamento/">Libreria dei metodi →</a></p></div>
<script>(function(){var s={},rows=[].slice.call(document.querySelectorAll('.pl-row'));function a(){rows.forEach(function(r){r.hidden=!!((s.d&&r.dataset.d!==s.d&&r.dataset.d!=='TRASVERSALE')||(s.k&&r.dataset.k!==s.k))});document.getElementById('pl-empty').hidden=rows.some(function(r){return !r.hidden});[].forEach.call(document.querySelectorAll('.pl-chip'),function(c){var k=c.dataset.d?'d':'k';c.setAttribute('aria-pressed',s[k]===(c.dataset.d||c.dataset.k))})}[].forEach.call(document.querySelectorAll('.pl-chip'),function(c){c.addEventListener('click',function(){var k=c.dataset.d?'d':'k',v=c.dataset.d||c.dataset.k;s[k]=s[k]===v?null:v;a()})});var q=new URLSearchParams(location.search);if(q.get('d')){s.d=q.get('d');}if(q.get('k')){s.k=q.get('k');}a()})()</script>`));

// ---- home
const lab = [...DISCS.map((d) => arts.find((a) => a.d === d)).filter(Boolean)]; for (const a of arts) { if (lab.length >= 6) break; if (!lab.includes(a)) lab.push(a); }
const card = (n, t, s, href) => `<a class="pl-card" href="${link(href)}"><span class="pl-card-t">${t}</span><span class="w-go" aria-hidden="true">→</span></a>`;
const home = `<section class="w-hero"><div class="wrap pl-hero"><h1 lang="en"><span>ENDURANCE.</span><span class="acc">ENGINEERED.</span></h1><p class="pl-lead">Run. Ride. Swim. Strength.</p></div></section>
<section class="pl-cards-wrap"><div class="wrap pl-cards">${card(1, 'RUN', 'Corsa', '/run')}${card(2, 'RIDE', 'Bici', '/ride')}${card(3, 'SWIM', 'Nuoto', '/swim')}${card(4, 'STRENGTH', 'Forza', '/strength/')}</div></section>
<section class="w-band"><div class="wrap pl-engine"><p class="w-kicker">WOLF ENGINE</p><h2 class="w-big">Calcola la tua prestazione.</h2><p class="pl-lead">Ritmi · FTP · Zone · Fuel · Gara · CSS</p><p class="w-btns"><a class="w-btn" href="${link('/engine')}">COSTRUISCI IL TUO ENGINE <span aria-hidden="true">→</span></a></p></div></section>
<section class="w-latest"><div class="wrap"><p class="w-kicker">LATEST FROM THE LAB</p><div class="pl-filters lab-filters" aria-label="Filtra gli ultimi articoli"><div>${['ALL','RUN','RIDE','SWIM','STRENGTH'].map(d=>`<button type="button" class="pl-chip" data-lab-d="${d}" aria-pressed="${d==='ALL'}">${d}</button>`).join('')}</div></div><ul class="pl-rows" id="lab-rows">${lab.map((a) => row({ title: a.title, href: a.href, d: a.d, k: a.k, min: a.minutes })).join('')}</ul><p class="pl-more"><a href="/articoli/">Tutti gli articoli →</a></p></div></section>
<section class="w-numbers"><div class="wrap pl-race"><p class="w-kicker">GARE</p><a class="w-cta" href="${link('/gare/')}">Trova la tua prossima gara <span aria-hidden="true">→</span></a></div></section><script>(function(){var root=document.querySelector('.w-latest');if(!root)return;root.querySelectorAll('[data-lab-d]').forEach(function(b){b.addEventListener('click',function(){var d=b.dataset.labD;root.querySelectorAll('.pl-row').forEach(function(r){r.hidden=d!=='ALL'&&r.dataset.d!==d});root.querySelectorAll('[data-lab-d]').forEach(function(c){c.setAttribute('aria-pressed',c===b?'true':'false')})})})})()</script>`;
wr('index.html', patchChrome(meta(rd('index.html').slice(0, rd('index.html').indexOf('<main')), { title: 'Wolf Lab - Endurance. Engineered.', desc: 'Run, ride, swim, strength: articoli con fonti e il Wolf Engine per calcolare la tua prestazione.', url: '/', en: '/en/' }), '') + `<main id="main">\n${home}\n</main>` + foot0.replace(/<nav class="foot-links"[\s\S]*?<\/nav>/, footHtml));

// ---- nav e footer su tutte le altre pagine IT (non toccano il contenuto)
const cur = (rel) => /^articoli\//.test(rel) ? 'ARTICOLI' : /^(run|ride|swim)\.html$/.test(rel) ? rel.split('.')[0].toUpperCase() : /^train\/strength\//.test(rel) || /^strength\//.test(rel) ? 'STRENGTH' : '';
const skip = new Set(['index.html', 'run.html', 'ride.html', 'swim.html', 'strength/index.html', 'articoli/index.html']);
let n = 0; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['.git', 'node_modules', 'assets', 'tools', 'content', 'builds', 'en'].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) { const rel = path.relative(root, p); if (skip.has(rel)) continue; const h = fs.readFileSync(p, 'utf8'); if (!/<nav class="nav"/.test(h)) continue; const o = patchChrome(h, cur(rel)); if (o !== h) { fs.writeFileSync(p, o); n++; } } } };
walk(root);
if (bad.length) { console.error('PROBLEMI:', bad); process.exit(1); }
console.log('pillars ok; nav/footer aggiornati in', n, 'pagine IT; articoli', arts.length);
