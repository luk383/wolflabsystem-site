// WOLF PICKS: genera /picks/ (hub, guida, confronto, schede) da content/catalog/products.json.
// Solo dati con fonte e data nel catalogo. Nessun prezzo, voto o verdetto. Idempotente.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com';
const P = JSON.parse(fs.readFileSync(path.join(root, 'content/catalog/products.json'), 'utf8')).products;
const shell = fs.readFileSync(path.join(root, 'gear.html'), 'utf8');
const head0 = shell.slice(0, shell.indexOf('<main')), foot = shell.slice(shell.indexOf('</main>') + 7);
const f = (v) => String(v).replace('.', ',');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const ul = (l) => '<ul>' + l.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const URL = { hub: '/picks/', guide: '/picks/scarpe-allenamento/', cmp: '/picks/confronto-evo-sl-novablast-6-ghost-18/' };
const pu = (p) => '/picks/' + p.slug + '/';
const LAB = 'Misure di laboratorio RTINGS su un paio (taglia uomo): le cifre dei produttori possono differire. Consultato il 28/10/2026.';
const LV = '';
const DISC = '<p class="pk-note">Trasparenza: nessun link commerciale su questa pagina. Quando ci saranno link affiliati saranno indicati accanto al link e non cambiano la valutazione.</p>';
const srcs = (p) => '<ol>' + p.sources.map((s) => `<li><a href="${s.url}" rel="noopener">${esc(s.label)}</a></li>`).join('') + '</ol>';
function page(rel, title, desc, main) {
  let h = head0.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} - Wolf Lab</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${SITE}${rel}">`)
    .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, '')
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)} - Wolf Lab">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${rel}">`)
    .replace(/<meta property="og:image"[^>]*data-seo="1">.*?(?=<\/head>)/s, '');
  const out = path.join(root, rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
}
const hero = (kick, h1, lede) => `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${kick}</p><h1>${h1}</h1><p class="w-lede">${lede}</p></div></header><div class="wrap w-body">`;
const END = '</div></main>';
// schede
for (const p of P) {
  const s = p.specs;
  const rows = [['Peso', f(s.weightG.value) + ' g'], ['Altezza tallone', f(s.heelStackMm.value) + ' mm'], ['Drop', f(s.dropMm.value) + ' mm'], ['Ritorno di energia, avampiede', f(s.forefootEnergyReturnPct.value) + '%'], ['Ritorno di energia, tallone', f(s.heelEnergyReturnPct.value) + '%']];
  page(pu(p), `${p.brand} ${p.model}`, p.summary, hero('WOLF PICKS · RUNNING · SCARPE DA ALLENAMENTO', `${esc(p.brand)} ${esc(p.model)}`, esc(p.summary)) + LV +
    `<div class="pk-box"><h3>Dati misurati</h3><table class="pk-tbl"><tbody>${rows.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}<tr><th>Prezzo</th><td>Cambia per mercato e variante: guarda il prezzo corrente dal venditore.</td></tr></tbody></table><p class="pk-note">${LAB}</p></div>` +
    `<div class="pk-two"><div class="pk-box"><h3>Adatta a</h3>${ul(p.fitsIt)}</div><div class="pk-box"><h3>Meno adatta a</h3>${ul(p.lessFitIt)}</div></div>` +
    `<div class="pk-box"><h3>Confronto</h3><p><a href="${URL.cmp}">Evo SL, Novablast 6 e Ghost 18 a confronto →</a></p></div><div class="pk-box"><h3>Fonti</h3>${srcs(p)}<p class="pk-note">Ultima verifica: 28 ottobre 2026.</p></div>` + DISC + END);
}
// confronto
const qual = { 'adidas-adizero-evo-sl': ['Alta', 'Adeguata: tallone stretto'], 'asics-novablast-6': ['Molto alta', 'Discreta: morbida'], 'brooks-ghost-18': ["Adeguata: ottima al tallone, scarsa all'avampiede", 'Molto buona'] };
const row = (l, fn) => `<tr><th>${l}</th>${P.map((p) => `<td>${fn(p)}</td>`).join('')}</tr>`;
page(URL.cmp, 'Adizero Evo SL, Novablast 6, Ghost 18: quale scegliere', 'Tre scarpe da allenamento neutre a confronto su misure di laboratorio indipendenti. Ultima verifica 28/10/2026.',
  hero('WOLF PICKS · CONFRONTO', 'Adizero Evo SL, Novablast 6, Ghost 18: quale scegliere.', 'Tre scarpe da allenamento neutre, confrontate su misure di laboratorio indipendenti. Versioni correnti al 28/10/2026.') + LV +
  `<div class="pk-scroll"><table class="pk-tbl"><thead><tr><th></th>${P.map((p) => `<th>${esc(p.brand)} ${esc(p.model)}</th>`).join('')}</tr></thead><tbody>` +
  row('Peso', (p) => f(p.specs.weightG.value) + ' g') + row('Altezza tallone', (p) => f(p.specs.heelStackMm.value) + ' mm') + row('Drop', (p) => f(p.specs.dropMm.value) + ' mm') +
  row('Ritorno energia avampiede', (p) => f(p.specs.forefootEnergyReturnPct.value) + '%') + row('Ritorno energia tallone', (p) => f(p.specs.heelEnergyReturnPct.value) + '%') +
  row('Ammortizzazione (RTINGS)', (p) => qual[p.id][0]) + row('Stabilità (RTINGS)', (p) => qual[p.id][1]) + row('Prezzo', () => 'Vedi prezzo corrente') + '</tbody></table></div>' +
  `<p class="pk-note">${LAB}</p><div class="pk-box"><h3>Quale scegliere? (suggerimento ragionato dai dati, non un verdetto)</h3><ul>` +
  '<li><b>Ritmi diversi, anche qualche gara:</b> Adizero Evo SL. La più leggera (220 g) e con il ritorno di energia più alto delle tre.</li>' +
  "<li><b>Massima protezione e comfort quotidiano:</b> Novablast 6. Stack più alto e ammortizzazione molto alta; l'avampiede è più vivace del tallone.</li>" +
  '<li><b>Stabilità e chilometri tranquilli, atterraggio di tallone:</b> Ghost 18. La più pesante e meno reattiva, ma la più stabile in base a RTINGS.</li></ul></div>' +
  `<div class="pk-box"><h3>Schede</h3><p>${P.map((p) => `<a href="${pu(p)}">${esc(p.brand)} ${esc(p.model)}</a>`).join(' · ')}</p></div>` +
  `<div class="pk-box"><h3>Fonti</h3><ol>${P.map((p) => `<li><a href="${p.sources[0].url}" rel="noopener">${esc(p.brand)} ${esc(p.model)}: ${esc(p.sources[0].label)}</a></li>`).join('')}</ol><p class="pk-note">Ultima verifica: 28 ottobre 2026.</p></div>` + DISC + END);
// guida
page(URL.guide, 'Scarpe da corsa da allenamento: come scegliere', "Cosa guardare in una scarpa da allenamento neutra e tre modelli da cui partire. Fonti e data di verifica.",
  hero("WOLF PICKS · GUIDA ALL'ACQUISTO", 'Scarpe da corsa da allenamento: come scegliere.', 'Cosa guardare in una scarpa da allenamento neutra, e tre modelli da cui partire.') + LV +
  '<div class="pk-box"><h3>Cosa guardare</h3><ul><li><b>Peso:</b> una scarpa più leggera aiuta nei ritmi vivaci; una più pesante di solito offre più struttura.</li><li><b>Altezza e morbidezza:</b> più stack e schiuma morbida proteggono dagli impatti, ma possono dare meno stabilità.</li><li><b>Dove atterri:</b> tallone o mesopiede/avampiede cambiano quale scarpa funziona meglio, come mostrano le misure sul ritorno di energia.</li><li><b>Uso:</b> chilometri facili, lavori più veloci, lunghi.</li></ul></div>' +
  `<div class="pk-box"><h3>Tre punti di partenza</h3><ul>${P.map((p) => `<li><b><a href="${pu(p)}">${esc(p.brand)} ${esc(p.model)}</a></b>: ${esc(p.summary)}</li>`).join('')}</ul><p><a href="${URL.cmp}">Vai al confronto →</a></p></div>` +
  '<div class="pk-box"><h3>Fonti</h3><p>Misure di laboratorio e recensioni indipendenti elencate nelle schede e nel confronto. Ultima verifica: 28 ottobre 2026.</p></div>' + DISC + END);

// fuel
const FU = JSON.parse(fs.readFileSync(path.join(root, 'content/catalog/fuel.json'), 'utf8')).products;
const FURL = '/picks/gel-carboidrati/';
const fv = (p, k) => { const x = p.specs[k].value; return typeof x === 'number' ? f(x) : esc(x); };
const frow = (l, k, u) => `<tr><th>${l}</th>${FU.map((p) => `<td>${fv(p, k)}${typeof p.specs[k].value === 'number' ? u : ''}</td>`).join('')}</tr>`;
page(FURL, 'Gel di carboidrati: confronto dei dati dichiarati', 'Maurten Gel 100, SiS BETA Fuel e PF 30 a confronto sui dati dichiarati dai produttori. Ultima verifica 28/10/2026.',
  hero('WOLF PICKS · FUEL · GEL', 'Gel di carboidrati: cosa dicono le etichette.', 'Tre gel confrontati sui dati dichiarati dai produttori. Non è un test: non abbiamo provato i prodotti.') +
  `<div class="pk-scroll"><table class="pk-tbl"><thead><tr><th></th>${FU.map((p) => `<th>${esc(p.brand)} ${esc(p.model)}</th>`).join('')}</tr></thead><tbody>` +
  frow('Carboidrati per dose', 'carbsPerServingG', ' g') + frow('Rapporto', 'ratio', '') + frow('Peso della bustina', 'servingWeightG', ' g') + frow('Energia', 'kcal', '') + frow('Consistenza', 'texture', '') + frow('Versione con caffeina', 'caffeineVersion', '') +
  '<tr><th>Prezzo</th>' + FU.map(() => '<td>Vedi prezzo corrente</td>').join('') + '</tbody></table></div>' +
  '<p class="pk-note">Dati dei produttori, letti sulle loro pagine il 28/10/2026. "Non indicato": la pagina letta non lo riporta.</p>' +
  '<div class="pk-box"><h3>Come leggerli</h3><ul><li><b>Carboidrati per dose:</b> contano i grammi, non il numero di gel. Per arrivare allo stesso apporto orario con un gel da 25 g servono più bustine che con uno da 40 g.</li><li><b>Rapporto glucosio e fruttosio:</b> i due gel che lo dichiarano usano 1:0,8. Il rapporto riguarda come si assorbono i carboidrati; l\'articolo sotto riassume uno studio sulle quantità.</li><li><b>Tolleranza:</b> si allena prima della gara, con la stessa marca e la stessa quantità.</li></ul><p><a href="/articoli/carboidrati-maratona/">Carboidrati in maratona: cosa dicono gli studi →</a></p></div>' +
  `<div class="pk-box"><h3>Fonti</h3><ol>${FU.map((p) => `<li><a href="${p.sources[0].url}" rel="noopener">${esc(p.brand)} ${esc(p.model)}: ${esc(p.sources[0].label)}</a></li>`).join('')}</ol><p class="pk-note">Ultima verifica: 28 ottobre 2026.</p></div>` + DISC + END);
// hub
page(URL.hub, 'WOLF PICKS', 'Selezioni con fonti, livello di prova e data di verifica. Si parte dalle scarpe da allenamento.',
  hero('WOLF PICKS', 'Cosa scegliere, e perché.', 'Selezioni con fonti, livello di prova e data di verifica. Si parte da scarpe da allenamento e gel di carboidrati; Cycling segue.') +
  `<div class="pk-grid"><div class="pk-card"><h3>Guida</h3><ul><li><a href="${URL.guide}">Scarpe da allenamento: come scegliere</a><small>Guida all'acquisto</small></li></ul></div><div class="pk-card"><h3>Confronto</h3><ul><li><a href="${URL.cmp}">Evo SL, Novablast 6, Ghost 18</a><small>Misure di laboratorio indipendenti</small></li><li><a href="${FURL}">Gel di carboidrati</a><small>Dati dichiarati dai produttori</small></li></ul></div><div class="pk-card"><h3>Schede</h3><ul>${P.map((p) => `<li><a href="${pu(p)}">${esc(p.brand)} ${esc(p.model)}</a><small>SELECTED · verificato il 28/10/2026</small></li>`).join('')}</ul></div></div>` + DISC +
  '<p class="w-foot"><a class="w-cta" href="/metodologia">Come valutiamo <span aria-hidden="true">→</span></a></p>' + END);
// partner
const PI=[['Audience','Atleti di running, ciclismo, nuoto, triathlon e forza. Nessun dato di pubblico finché non è misurato.'],['Research','Analisi basata su fonti: studi, regolamenti, schede ufficiali.'],['Testing','Test sul campo pianificati: i risultati compaiono solo quando esistono.'],['Content','Articoli, confronti e guide all\'acquisto.'],['Performance','Strumenti e calcolatori nel Wolf Engine.'],['Commerce','Link affiliati dichiarati.']];
page('/partner/','Partner with WOLFLAB','WOLFLAB è una piattaforma indipendente per atleti endurance. Collaborazioni dichiarate, valutazioni indipendenti.',hero('PARTNER WITH WOLFLAB','Lavoriamo con chi vuole essere confrontato.','WOLFLAB è una piattaforma indipendente per atleti endurance. Selezioniamo i primi partner da sottoporre alla nostra analisi.')+'<ul class="w-list">'+PI.map((x,i)=>`<li class="w-item"><a href="/contatti/"><span class="w-num">0${i+1}</span><span class="w-txt"><b>${x[0]}</b><small>${esc(x[1])}</small></span><span class="w-go">→</span></a></li>`).join('')+'</ul><div class="pk-box"><h3>Indipendenza</h3><p>Le valutazioni editoriali restano indipendenti. Contenuti sponsorizzati e link affiliati sono sempre indicati.</p></div><p class="w-foot"><a class="w-cta" href="/contatti/">Contatti <span aria-hidden="true">→</span></a></p>'+END);
// CSS
const css = `/*picks-start*/
.pk-chips{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.pk-chips span{font:500 12px var(--mono);border:1px solid var(--rule-strong);padding:6px 10px;color:var(--muted)}.pk-chips b{color:var(--text);letter-spacing:.1em;margin-right:6px}
.pk-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:24px 0}.pk-card{border-top:1px solid var(--text);padding-top:14px}.pk-card h3{margin:0 0 10px;font-size:22px}.pk-card ul{padding:0;margin:0}.pk-card li{list-style:none;padding:8px 0;border-bottom:1px solid var(--rule-strong)}.pk-card a{color:var(--text)}.pk-card small{display:block;color:var(--muted)}
.pk-tbl{width:100%;border-collapse:collapse;margin:12px 0}.pk-tbl th,.pk-tbl td{border-bottom:1px solid var(--rule-strong);padding:12px 10px;text-align:left;vertical-align:top}.pk-tbl thead th{font:600 12px var(--mono);letter-spacing:.1em;text-transform:uppercase}.pk-scroll{overflow-x:auto}
.pk-box{border:1px solid var(--rule-strong);padding:18px;margin:18px 0}.pk-box h3{margin:0 0 8px}.pk-box a{color:var(--text)}.pk-two{display:grid;grid-template-columns:1fr;gap:0}@media(min-width:701px){.pk-two{grid-template-columns:1fr 1fr;gap:18px}}
.pk-note{font-size:13px;color:var(--muted);border-left:3px solid var(--accent);padding-left:12px;margin:14px 0}
@media(max-width:700px){.pk-grid{grid-template-columns:1fr}.pk-tbl{font-size:13px}}
.pk-quick{border-bottom:1px solid var(--rule-strong)}.pk-quick .wrap{display:flex;flex-wrap:wrap;gap:8px 28px;padding:16px 0}.pk-quick a{font:500 12px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--text);text-decoration:none}.pk-quick a:hover{text-decoration:underline}
.w-btns{display:flex;gap:12px;flex-wrap:wrap;margin:0}.w-btn-ghost{background:transparent!important;color:#F5F4EF!important;border:1px solid #F5F4EF}.w-btn-ghost:hover{background:#F5F4EF!important;color:#0A0A0A!important}
@media(min-width:801px){.w-hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,.92fr)!important}.w-hero h1{font-size:clamp(48px,6.3vw,100px)!important}.w-hero-img:before{background-position:50% 30%!important}}
@media(max-width:900px){.site-head .nav a.nav-engine{flex:0 0 auto!important;margin:0!important;padding:4px 10px!important}}
@media(max-width:560px){.site-head .nav{gap:6px 12px!important}.site-head .nav a{font-size:11px!important;letter-spacing:.04em!important}.site-head .nav a.nav-engine{padding:3px 8px!important}}
/*picks-end*/`;
let c = fs.readFileSync(path.join(root, 'assets/site.css'), 'utf8').replace(/\n?\/\*picks-start\*\/[\s\S]*?\/\*picks-end\*\//, '');
fs.writeFileSync(path.join(root, 'assets/site.css'), c.trimEnd() + '\n' + css + '\n');
// sitemap
const sp = path.join(root, 'sitemap.xml'); let sm = fs.readFileSync(sp, 'utf8');
for (const u of [FURL, URL.hub, URL.guide, URL.cmp, '/partner/', ...P.map(pu)]) if (!sm.includes(SITE + u + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${u}</loc></url>\n</urlset>`);
fs.writeFileSync(sp, sm);
console.log('picks:', P.length + 5, 'pagine');
