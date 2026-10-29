// GEAR guide pages built only from published tests and manufacturer pages we read. No tests of our own.
// Writes /picks/orologi-gps-corsa/, /picks/ciclocomputer-marchi-emergenti/ and the EN twins, then links them from the hubs. Idempotent.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const a = (u, t) => `<a href="${u}" rel="noopener">${esc(t)}</a>`;
const L = {
 it: { shell: 'gear.html', home: '/picks/', alt: 'en', other: (r) => G.find((g) => g.it === r).en, lang: 'it' },
 en: { shell: 'en/gear.html', home: '/en/picks/', alt: 'it', lang: 'en' },
};
const G = [
 { it: '/picks/orologi-gps-corsa/', en: '/en/picks/running-gps-watches/' },
 { it: '/picks/ciclocomputer-marchi-emergenti/', en: '/en/picks/bike-computers-emerging-brands/' },
];
function page(lang, rel, title, desc, main) {
  const shell = fs.readFileSync(path.join(root, L[lang].shell), 'utf8');
  const head0 = shell.slice(0, shell.indexOf('<main')), foot = shell.slice(shell.indexOf('</main>') + 7);
  const g = G.find((x) => x[lang] === rel), itRel = g.it, enRel = g.en;
  const h = head0.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} - Wolf Lab</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${SITE}${rel}">`)
    .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, `<link rel="alternate" hreflang="it" href="${SITE}${itRel}">\n<link rel="alternate" hreflang="en" href="${SITE}${enRel}">\n`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)} - Wolf Lab">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${rel}">`)
    .replace(/<meta property="og:image"[^>]*data-seo="1">.*?(?=<\/head>)/s, '')
    .replace(/<a class="lang" href="[^"]*"/, `<a class="lang" href="${lang === 'it' ? enRel : itRel}"`);
  const out = path.join(root, rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
}
const hero = (k, h1, lede) => `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${k}</p><h1>${h1}</h1><p class="w-lede">${lede}</p></div></header><div class="wrap w-body">`;
const END = '</div></main>';
const tbl = (head, rows) => `<div class="pk-scroll"><table class="pk-tbl"><thead><tr><th></th>${head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th>${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const box = (h, inner) => `<div class="pk-box"><h3>${h}</h3>${inner}</div>`;
const ul = (l) => '<ul>' + l.map((x) => `<li>${x}</li>`).join('') + '</ul>';
const note = (t) => `<p class="pk-note">${t}</p>`;
const D = { it: 'Ultima verifica: 29 ottobre 2026.', en: 'Last checked: 29 October 2026.' };
const TR = { it: 'Trasparenza: WOLFLAB non fa test propri. Qui sintetizziamo test e recensioni già pubblicati, citando chi li ha fatti, e separiamo i dati dei produttori dai risultati dei tester. Nessun link affiliato su questa pagina.', en: 'Transparency: WOLFLAB does not run its own tests. We summarise tests and reviews already published, name who ran them, and keep manufacturer data apart from tester results. No affiliate links on this page.' };
const S = {
 dcrFR970: 'https://www.dcrainmaker.com/2025/06/garmin-forerunner-970-in-depth-review-brillance.html',
 dcrPace4: 'https://www.dcrainmaker.com/2025/11/coros-pace-4-in-depth-sports-review.html',
 garPress: 'https://www.garmin.com/it-IT/newsroom/forerunner-570-970/',
 garBatt: 'https://www8.garmin.com/manuals/webhelp/GUID-25E3235D-44D2-4384-A591-DD1D71BEBCB1/IT-IT/GUID-6E1935AD-17DC-48E6-8C54-B2FC79917B0B.html',
 corosBatt: 'https://support.coros.com/hc/en-us/articles/23476623096980-Battery-Specifications',
 corosTM: 'https://ised-isde.canada.ca/cipo/trademark-search/1716656',
 dcrDura2: 'https://www.dcrainmaker.com/2026/10/coros-dura-2-solar-in-depth-review.html',
 roadMagene: 'https://road.cc/content/review/magene-c506-smart-gps-bike-computer-314411',
 hubBSC: 'https://www.cyclistshub.com/igpsport-bsc300-review/',
 igpAbout: 'https://www.igpsport.com/enterprise',
 igpFCC: 'https://fccid.co/api/files/s1/2au4m_igs520_coverletters_4924192_c07f78889c.pdf',
 mageneCo: 'https://www.magene-enterprise.com/wp-content/uploads/2026/04/Company-Introduction.pdf',
};
const NV = { it: 'non verificato', en: 'not verified' };
// ---------- WATCHES
const W = {
 it: {
  rel: G[0].it, title: 'Orologi GPS per la corsa: Forerunner 570, Forerunner 970, COROS Pace 4', desc: 'Tre orologi GPS da corsa a confronto: dati dei produttori e risultati dei test già pubblicati da DC Rainmaker. Ultima verifica 29/10/2026.',
  h1: 'Orologi GPS per la corsa, a confronto.', lede: 'Garmin Forerunner 570 e 970 e COROS Pace 4. Dati dei produttori da una parte, risultati dei tester dall\'altra. Nessun test nostro e nessuna classifica.',
  cols: ['Garmin Forerunner 570', 'Garmin Forerunner 970', 'COROS Pace 4'],
  rows: [
   ['Prezzo di lancio', '549,99 € (Garmin Italia)', '749,99 € (Garmin Italia)', `non verificato in euro. DC Rainmaker: 20 USD più del Pace 3, che prima del taglio costava 229 USD`],
   ['Batteria dichiarata', 'Solo GPS fino a 18 ore; modalità smartwatch fino a 10 giorni (42 mm) o 11 giorni (47 mm)', 'non letta sulla pagina Garmin', 'Uso quotidiano con sonno e stress: 19 giorni; con display sempre acceso: 6 giorni. Ore di GPS: non indicate nella tabella letta'],
   ['Schermo', 'AMOLED (misure 42 e 47 mm)', 'AMOLED 1,4 pollici, cassa in titanio 47 mm (DC Rainmaker)', 'AMOLED 1,2 pollici, 1.500 nit (DC Rainmaker)'],
   ['Mappe a bordo', 'No', 'Sì, mappe a colori', 'No (il Pace Pro ha le mappe offline, DC Rainmaker)'],
  ],
  tester: [
   `<b>Forerunner 970, DC Rainmaker (16/06/2025):</b> con il display sempre acceso la batteria è durata circa 2,5 giorni. Il tester scrive che i Garmin con display da 1.000 nit e cassa da 45-47 mm gli durano di solito 4-6 giorni nello stesso uso.`,
   `<b>COROS Pace 4, DC Rainmaker (10/11/2025):</b> lo definisce un ottimo rapporto qualità prezzo. Nel nuoto in acque libere la traccia GPS è "non male" ma taglia un angolo all'inizio; per COROS, dice, è un buon risultato. Nell'uscita in bici la frequenza cardiaca al polso è più variabile.`,
   `<b>Forerunner 570:</b> nessun test completo letto per ora, solo il comunicato Garmin e la scheda tecnica. Non lo giudichiamo.`,
  ],
  how: 'Come leggere i dati', howl: ['Le ore di batteria di marche diverse non sono confrontabili: cambiano GNSS, schermo e sensori.', 'Il Pace 4 ha un prezzo di lancio molto più basso. DC Rainmaker lo definisce un ottimo affare, ma ricorda che Forerunner 255 e Vivoactive 6 in offerta possono arrivare al suo prezzo con più funzioni. È il giudizio del tester, non un nostro verdetto.', 'COROS è un marchio emergente: il titolare del marchio risulta a Dongguan, Cina (registro marchi canadese).'],
  src: [['Garmin Italia, comunicato Forerunner 570 e 970 (15/05/2025)', S.garPress], ['Garmin, manuale Forerunner serie 570, durata batteria', S.garBatt], ['DC Rainmaker, Forerunner 970 in-depth review (16/06/2025)', S.dcrFR970], ['DC Rainmaker, COROS Pace 4 in-depth review (10/11/2025)', S.dcrPace4], ['COROS, specifiche batteria', S.corosBatt], ['CIPO Canada, marchio COROS', S.corosTM]],
 },
 en: {
  rel: G[0].en, title: 'Running GPS watches: Forerunner 570, Forerunner 970, COROS Pace 4', desc: 'Three running GPS watches side by side: manufacturer data and results from tests already published by DC Rainmaker. Last checked 29/10/2026.',
  h1: 'Running GPS watches, side by side.', lede: 'Garmin Forerunner 570 and 970, and COROS Pace 4. Manufacturer data on one side, tester results on the other. No tests of our own and no ranking.',
  cols: ['Garmin Forerunner 570', 'Garmin Forerunner 970', 'COROS Pace 4'],
  rows: [
   ['Launch price', '€549.99 (Garmin Italy)', '€749.99 (Garmin Italy)', 'not verified in euro. DC Rainmaker: USD 20 more than the Pace 3, which cost USD 229 before its price cut'],
   ['Claimed battery', 'GPS only up to 18 hours; smartwatch mode up to 10 days (42 mm) or 11 days (47 mm)', 'not read on Garmin\'s page', 'Daily use with sleep and stress: 19 days; always-on display: 6 days. GPS hours: not given in the table we read'],
   ['Display', 'AMOLED (42 and 47 mm sizes)', '1.4-inch AMOLED, 47 mm titanium case (DC Rainmaker)', '1.2-inch AMOLED, 1,500 nits (DC Rainmaker)'],
   ['Onboard maps', 'No', 'Yes, colour maps', 'No (the Pace Pro has offline maps, DC Rainmaker)'],
  ],
  tester: [
   '<b>Forerunner 970, DC Rainmaker (16/06/2025):</b> with the always-on display the battery lasted about 2.5 days. The tester writes that Garmin watches with 1,000-nit displays and 45-47 mm cases usually last him 4-6 days in the same use.',
   '<b>COROS Pace 4, DC Rainmaker (10/11/2025):</b> he calls it a very good value watch. In open-water swimming the GPS track is "not too bad" but cuts a corner early on; for COROS, he says, that is a good result. On the bike ride the wrist heart rate is more variable.',
   '<b>Forerunner 570:</b> no full test read yet, only Garmin\'s release and spec page. We do not judge it.',
  ],
  how: 'How to read the data', howl: ['Battery hours from different brands are not comparable: GNSS mode, screen and sensors differ.', 'The Pace 4 has a much lower launch price. DC Rainmaker calls it a fantastic bargain, but notes that the Forerunner 255 and Vivoactive 6 on sale can reach its price with more features. That is the tester\'s view, not our verdict.', 'COROS is an emerging brand: the trademark owner is listed in Dongguan, China (Canadian trademark register).'],
  src: [['Garmin Italy, Forerunner 570 and 970 release (15/05/2025)', S.garPress], ['Garmin, Forerunner 570 series manual, battery life', S.garBatt], ['DC Rainmaker, Forerunner 970 in-depth review (16/06/2025)', S.dcrFR970], ['DC Rainmaker, COROS Pace 4 in-depth review (10/11/2025)', S.dcrPace4], ['COROS, battery specifications', S.corosBatt], ['CIPO Canada, COROS trademark', S.corosTM]],
 },
};
// ---------- BIKE COMPUTERS
const C = {
 it: {
  rel: G[1].it, title: 'Ciclocomputer di marchi emergenti: COROS Dura 2, Magene C506, iGPSPORT BSC300', desc: 'Tre ciclocomputer di marchi con sede in Cina, letti attraverso test già pubblicati. Ultima verifica 29/10/2026.',
  h1: 'Ciclocomputer di marchi emergenti.', lede: 'COROS Dura 2 Solar, Magene C506 e iGPSPORT BSC300, dai test di DC Rainmaker, road.cc e Cyclists Hub. Nessun test nostro e nessuna classifica.',
  cols: ['COROS Dura 2 Solar', 'Magene C506', 'iGPSPORT BSC300'],
  rows: [
   ['Prezzo', 'circa 500 USD (DC Rainmaker); più del doppio del Dura 1, 249 USD', '109 £ (road.cc)', NV.it],
   ['Schermo', 'Leggibile al sole, dimensione simile all\'Edge 1040 Solar (DC Rainmaker)', 'Touchscreen a colori da 2,4 pollici (road.cc)', '2,4 pollici, 240 x 320 pixel, senza touchscreen (Cyclists Hub)'],
   ['Peso', NV.it, '94 g (road.cc)', NV.it],
   ['Batteria', 'Dichiarata da COROS senza il contributo del solare. Nel test: guadagno solare di circa 0,5% l\'ora al sole di Maiorca, fermo e fuori bici', NV.it, 'Valutata 4/5 dal recensore'],
  ],
  tester: [
   '<b>COROS Dura 2 Solar, DC Rainmaker (22/10/2026):</b> il tester scrive che "COROS non sta consegnando un dispositivo premium": software e stabilità non sono ancora al livello del prezzo. Nel box non c\'è nessun supporto per il manubrio. Per la batteria, COROS la ottiene con uno schermo meno visibile: "non è discutibile", dice, lo si vede su strada.',
   '<b>Magene C506, road.cc:</b> il touchscreen è "rather good" per il prezzo e mostra bene le mappe, ma risponde con lentezza ("hesitant"): a volte servono più tocchi. Il sensore di luce ambiente regola bene la luminosità.',
   '<b>iGPSPORT BSC300, Cyclists Hub:</b> piccolo e capace, a pulsanti, con menu intuitivi, ispirato alla serie Edge 5xx. Punteggio complessivo 4,1/5 del recensore. Manca il sensore di luce ambiente e lo schermo potrebbe essere più luminoso.',
  ],
  how: 'Come leggere i dati', howl: ['Sono tre prodotti molto diversi per fascia: il Dura 2 punta ai ciclocomputer premium, gli altri due al prezzo.', 'I voti e le frasi sono dei recensori citati, non nostri. I dati non verificati sono segnati come tali.', 'Sede dei marchi: COROS risulta a Dongguan (registro marchi canadese). iGPSPORT ha una società a Wuhan (dichiarazione FCC) e si dichiara fondata nel 2012. Magene si presenta nel profilo aziendale come leader del mercato cinese dei rulli e sensori.', 'Per i modelli Garmin, Wahoo e Hammerhead vedi il <a href="/picks/ciclocomputer/">confronto dedicato</a>.'],
  src: [['DC Rainmaker, COROS Dura 2 Solar in-depth review (22/10/2026)', S.dcrDura2], ['road.cc, recensione Magene C506', S.roadMagene], ['Cyclists Hub, recensione iGPSPORT BSC300', S.hubBSC], ['iGPSPORT, pagina aziendale', S.igpAbout], ['FCC, lettera iGPSPORT (Wuhan Qiwu Technology)', S.igpFCC], ['Magene, profilo aziendale', S.mageneCo], ['CIPO Canada, marchio COROS', S.corosTM]],
 },
 en: {
  rel: G[1].en, title: 'Bike computers from emerging brands: COROS Dura 2, Magene C506, iGPSPORT BSC300', desc: 'Three bike computers from brands based in China, read through tests already published. Last checked 29/10/2026.',
  h1: 'Bike computers from emerging brands.', lede: 'COROS Dura 2 Solar, Magene C506 and iGPSPORT BSC300, from tests by DC Rainmaker, road.cc and Cyclists Hub. No tests of our own and no ranking.',
  cols: ['COROS Dura 2 Solar', 'Magene C506', 'iGPSPORT BSC300'],
  rows: [
   ['Price', 'about USD 500 (DC Rainmaker); more than double the Dura 1, USD 249', '£109 (road.cc)', NV.en],
   ['Screen', 'Readable in sun, similar size to the Edge 1040 Solar (DC Rainmaker)', '2.4-inch colour touchscreen (road.cc)', '2.4 inch, 240 x 320 pixels, no touchscreen (Cyclists Hub)'],
   ['Weight', NV.en, '94 g (road.cc)', NV.en],
   ['Battery', 'Claimed by COROS without solar gains. In the test: about 0.5% an hour solar gain in Mallorca sun, parked off the bike', NV.en, 'Rated 4/5 by the reviewer'],
  ],
  tester: [
   '<b>COROS Dura 2 Solar, DC Rainmaker (22/10/2026):</b> the tester writes that "COROS isn\'t delivering a premium device": software and stability are not yet at the level of the price. There is no handlebar mount in the box. On battery, COROS gets it with a screen that is harder to see: "not debatable", he says, you can see it on the road.',
   '<b>Magene C506, road.cc:</b> the touchscreen is "rather good" for the price and renders route maps well, but it is slow to react ("hesitant"): sometimes it takes several taps. The ambient light sensor adjusts brightness well.',
   '<b>iGPSPORT BSC300, Cyclists Hub:</b> small and capable, button-based, intuitive menus, inspired by the Edge 5xx series. Overall score 4.1/5 from the reviewer. It lacks an ambient light sensor and the screen could be brighter.',
  ],
  how: 'How to read the data', howl: ['These are very different products by price tier: the Dura 2 targets premium computers, the other two target price.', 'Scores and quotes belong to the reviewers named, not to us. Data we did not verify is marked as such.', 'Brand base: COROS is listed in Dongguan (Canadian trademark register). iGPSPORT has a company in Wuhan (FCC filing) and says it was founded in 2012. Magene\'s company profile presents it as a market leader for trainers and sensors in China.', 'For Garmin, Wahoo and Hammerhead see the <a href="/en/picks/bike-computers/">dedicated comparison</a>.'],
  src: [['DC Rainmaker, COROS Dura 2 Solar in-depth review (22/10/2026)', S.dcrDura2], ['road.cc, Magene C506 review', S.roadMagene], ['Cyclists Hub, iGPSPORT BSC300 review', S.hubBSC], ['iGPSPORT, company page', S.igpAbout], ['FCC, iGPSPORT letter (Wuhan Qiwu Technology)', S.igpFCC], ['Magene, company profile', S.mageneCo], ['CIPO Canada, COROS trademark', S.corosTM]],
 },
};
for (const lang of ['it', 'en']) {
  const kick = lang === 'it' ? ['WOLF PICKS · RUNNING · OROLOGI', 'WOLF PICKS · CYCLING · CICLOCOMPUTER'] : ['WOLF PICKS · RUNNING · WATCHES', 'WOLF PICKS · CYCLING · BIKE COMPUTERS'];
  [W[lang], C[lang]].forEach((p, i) => {
    page(lang, p.rel, p.title, p.desc, hero(kick[i], p.h1, p.lede) + tbl(p.cols, p.rows) +
      box(lang === 'it' ? 'Cosa dicono i test già pubblicati' : 'What the published tests say', ul(p.tester)) +
      box(p.how, ul(p.howl)) +
      box(lang === 'it' ? 'Fonti' : 'Sources', '<ol>' + p.src.map((s) => `<li>${a(s[1], s[0])}</li>`).join('') + '</ol>' + note(D[lang])) + note(TR[lang]) + END);
  });
  // hub links
  const hubp = path.join(root, lang === 'it' ? 'picks/index.html' : 'en/picks/index.html');
  let h = fs.readFileSync(hubp, 'utf8');
  for (const [p, sub] of [[W[lang], lang === 'it' ? 'Dati dei produttori e test già pubblicati' : 'Manufacturer data and published tests'], [C[lang], lang === 'it' ? 'Marchi emergenti, da test già pubblicati' : 'Emerging brands, from published tests']]) {
    if (h.includes(`href="${p.rel}"`)) continue;
    const li = `<li><a href="${p.rel}">${p.h1.replace(/\.$/, '')}</a><small>${sub}</small></li>`;
    const m = h.match(/(href="[^"]*ciclocomputer\/"|href="[^"]*bike-computers\/")[^]*?<\/li>/);
    h = h.replace(m[0], m[0] + li);
  }
  fs.writeFileSync(hubp, h);
}
let sm = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const g of G) for (const u of [g.it, g.en]) if (!sm.includes(SITE + u + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${u}</loc></url>\n</urlset>`);
fs.writeFileSync(path.join(root, 'sitemap.xml'), sm);
console.log('gear guides ok');
