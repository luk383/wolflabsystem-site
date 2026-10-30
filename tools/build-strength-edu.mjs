import "./guard.mjs";
// Pagina educativa /train/strength/starr-5x5/ (IT) e /en/train/strength/starr-5x5/ (EN). Separata dal builder eseguibile.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com';
const esc = (s) => s.replace(/"/g, '&quot;');
const src = (u, t) => `<li><a href="${u}" rel="noopener" target="_blank">${t}</a></li>`;
const C = {
 it: { rel: '/train/strength/starr-5x5/', alt: '/en/train/strength/starr-5x5/', shell: 'gear.html', builder: '/train/strength/',
  title: 'Bill Starr 5×5: origine, struttura e varianti', kick: 'TRAIN · FORZA · SCHEDA METODOLOGICA',
  desc: 'Cosa descrivono le fonti sul 5×5 di Bill Starr, le versioni da tenere separate, i limiti e cosa resta non verificato.',
  lede: 'Cinque serie da cinque non bastano per dire «Starr». Qui le versioni restano separate, con fonte e limiti.',
  body: `<h2>Tre versioni, non una</h2>
<table class="w-table"><thead><tr><th>Versione</th><th>Cosa dicono le fonti</th><th>Stato</th></tr></thead><tbody>
<tr><td>Starr, programma del 1976</td><td>Power clean, panca, squat; tre sedute alla settimana con giorno pesante, leggero e medio; serie a rampa; esecuzione a circuito.</td><td>Solo fonti secondarie. Il libro non è stato letto direttamente.</td></tr>
<tr><td>Adattamento intermedio: Madcow 5×5</td><td>Sedute A/B/C. Secondo StrongLifts, il lavoro più noto di Madcow si chiamava «Bill Starr 5×5 linear version for intermediate lifters» e prese poi il nome Madcow 5×5.</td><td>Fonti secondarie discordanti sui dettagli. Il sito originale di Madcow non è stato verificato. Non è una variante scritta da Starr.</td></tr>
<tr><td>Schede online «Bill Starr»</td><td>Molte usano percentuali fisse o serie a carico costante.</td><td>Non vanno attribuite al programma del 1976.</td></tr></tbody></table>
<h2>Struttura e carichi della versione storica</h2>
<p>Le fonti riportano power clean, panca piana e squat, cinque serie da cinque, in ordine power clean, panca, squat. StrongLifts e «Strength training for sport» descrivono un circuito: una serie per esercizio, poi si ripete fino a cinque serie. Il giorno pesante sale a rampa fino a una serie finale da cinque. Il riferimento è il carico di quella serie, non il massimale a una ripetizione.</p>
<p>Le percentuali dei giorni leggero e medio <b>cambiano da fonte a fonte</b> e restano in versioni separate, senza media:</p>
<ul><li>80% leggero e 90% medio: «Strength training for sport» e StrongLifts.</li><li>70–75% leggero e 80–85% medio: Patrick Ward (2015).</li></ul>
<h2>Progressione</h2>
<p><b>Dalle fonti:</b> Ward propone di provare un aumento di 5–10 lb sul carico più alto del lunedì. Le fonti lette non descrivono cosa fare se le serie non vengono completate.</p>
<h2>Limiti</h2>
<ul><li>Il power clean richiede tecnica. Se lo sostituisci, la scheda è «ispirata a», non originale.</li><li>Tre sedute con squat e lavoro multiarticolare pesano se si somma molta corsa, bici o lavoro fisico.</li><li>Una progressione fissa può non andare bene vicino ai propri limiti o con poco recupero.</li><li>È un modello di forza generale, non un protocollo per l'ipertrofia o per la prestazione endurance.</li><li>Dolore o limitazioni richiedono una valutazione appropriata: la scheda non è diagnostica né riabilitativa.</li><li>Il circuito storico non è una seduta HIIT.</li></ul>
<h2>Compatibilità con endurance</h2>
<p>Etichetta per ogni versione: <b>non valutata</b>. Nessuna fonte letta valuta questo metodo per runner o ciclisti. Le revisioni scientifiche sotto valgono per l'allenamento di forza in generale, non per questa scheda.</p>
<h2>Cosa resta aperto</h2>
<ul><li>Il libro di Starr del 1976 non è verificato direttamente.</li><li>Il sito originale di Madcow non è verificato.</li><li>Nessuna variante «Starr per intermedi» distinta da Madcow è stata trovata nelle fonti.</li></ul>
<h2>Fonti</h2>
<ul class="w-src">__SRC__</ul>`,
  s: ['Patrick Ward, Bill Starr and the 5×5 Training Template (2015), secondaria', 'Strength training for sport, Bill Starr 5x5 Program (secondaria)', 'StrongLifts, History of the 5×5 Workout (secondaria)', 'StrongLifts, Madcow 5×5 workout guide (secondaria)', 'ACSM Position Stand 2026, prescrizione dell\'allenamento di forza (revisione generale)', 'Concurrent training, meta-analisi 2022 (revisione generale)'] },
 en: { rel: '/en/train/strength/starr-5x5/', alt: '/train/strength/starr-5x5/', shell: 'en/gear.html', builder: '/en/train/strength/',
  title: 'Bill Starr 5×5: origin, structure and variants', kick: 'TRAIN · STRENGTH · METHOD SHEET',
  desc: 'What the sources describe about Bill Starr’s 5×5, the versions to keep apart, the limits and what is still unverified.',
  lede: 'Five sets of five is not enough to say “Starr”. Here the versions stay separate, with sources and limits.',
  body: `<h2>Three versions, not one</h2>
<table class="w-table"><thead><tr><th>Version</th><th>What the sources say</th><th>Status</th></tr></thead><tbody>
<tr><td>Starr, 1976 program</td><td>Power clean, bench press, squat; three sessions a week with a heavy, light and medium day; ramp sets; circuit execution.</td><td>Secondary sources only. The book was not read directly.</td></tr>
<tr><td>Intermediate adaptation: Madcow 5×5</td><td>A/B/C sessions. According to StrongLifts, Madcow’s best-known work was called “Bill Starr 5×5 linear version for intermediate lifters” and later became known as Madcow 5×5.</td><td>Secondary sources disagree on details. Madcow’s original site was not verified. It is not a variant written by Starr.</td></tr>
<tr><td>Online “Bill Starr” routines</td><td>Many use fixed percentages or constant-load sets.</td><td>They should not be attributed to the 1976 program.</td></tr></tbody></table>
<h2>Structure and loads of the historical version</h2>
<p>The sources report power clean, bench press and squat, five sets of five, in the order power clean, bench, squat. StrongLifts and “Strength training for sport” describe a circuit: one set per exercise, then repeat until five sets are done. The heavy day ramps up to a final set of five. The reference is the load of that set, not a one-rep max.</p>
<p>The light and medium day percentages <b>differ between sources</b> and stay in separate versions, with no average:</p>
<ul><li>80% light and 90% medium: “Strength training for sport” and StrongLifts.</li><li>70–75% light and 80–85% medium: Patrick Ward (2015).</li></ul>
<h2>Progression</h2>
<p><b>From the sources:</b> Ward suggests trying a 5–10 lb increase on Monday’s highest load. The sources read do not describe what to do when sets are not completed.</p>
<h2>Limits</h2>
<ul><li>The power clean needs technique. If you replace it, the routine is “inspired by”, not original.</li><li>Three sessions with squats and other compound lifts add up if you also run, ride or do physical work.</li><li>A fixed progression may not suit you near your limits or with poor recovery.</li><li>It is a general strength model, not a protocol for hypertrophy or endurance performance.</li><li>Pain or limitations call for proper assessment: the routine is neither diagnostic nor rehabilitative.</li><li>The historical circuit is not an HIIT session.</li></ul>
<h2>Endurance compatibility</h2>
<p>Label for each version: <b>not assessed</b>. No source read assesses this method for runners or cyclists. The scientific reviews below apply to strength training in general, not to this routine.</p>
<h2>What stays open</h2>
<ul><li>Starr’s 1976 book is not verified directly.</li><li>Madcow’s original site is not verified.</li><li>No “Starr for intermediates” variant distinct from Madcow was found in the sources.</li></ul>
<h2>Sources</h2>
<ul class="w-src">__SRC__</ul>`,
  s: ['Patrick Ward, Bill Starr and the 5×5 Training Template (2015), secondary', 'Strength training for sport, Bill Starr 5x5 Program (secondary)', 'StrongLifts, History of the 5×5 Workout (secondary)', 'StrongLifts, Madcow 5×5 workout guide (secondary)', 'ACSM Position Stand 2026, resistance training prescription (general review)', 'Concurrent training, 2022 meta-analysis (general review)'] },
};
const U = ['https://optimumsportsperformance.com/blog/bill-starr-and-the-5x5-training-template/', 'https://billstarrr.blogspot.com/2012/01/semchem.html', 'https://stronglifts.com/stronglifts-5x5/history/', 'https://stronglifts.com/madcow-5x5/workout-guide/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8891239/'];
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
  const list = U.map((u, i) => src(u, c.s[i])).join('');
  const main = `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${c.kick}</p><h1>${c.title}</h1><p class="w-lede">${c.lede}</p></div></header><div class="wrap w-body w-prose">${c.body.replace('__SRC__', list)}</div></main>`;
  const out = path.join(root, c.rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
  if (!sm.includes(SITE + c.rel + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${c.rel}</loc></url>\n</urlset>`);
}
fs.writeFileSync(sp, sm);
console.log('strength-edu: 2 pagine');
