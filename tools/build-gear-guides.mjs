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
 { it: '/picks/scarpe-daily-tempo-marathon/', en: '/en/picks/running-shoes-daily-tempo-marathon/' },
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
const HINT = { it: 'Scorri la tabella di lato per vedere tutte le colonne.', en: 'Scroll the table sideways to see every column.' };
const tbl = (head, rows, lang) => `<p class="pk-hint" aria-hidden="true">${HINT[lang]} <span>→</span></p><div class="pk-scroll" role="region" tabindex="0" aria-label="${lang === 'it' ? 'Tabella di confronto, scorrevole' : 'Comparison table, scrollable'}"><table class="pk-tbl"><thead><tr><th></th>${head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th>${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
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
 gar970: 'https://www8.garmin.com/manuals/webhelp/GUID-025D75CF-3445-49E1-8D81-1AA74AB4E00F/EN-US/GUID-1933DAC3-8171-4995-A1F0-CD298E1F5A33.html',
 corosBuy4: 'https://coros.com/buy/pace4',
 corosEU4: 'https://coros.com/de/product/coros-pace-4-gps-sport-watch',
 corosUS4: 'https://shop.coros.com/products/coros-pace-4-gps-sport-watch-aluminum',
 corosD2: 'https://coros.com/eu/dura2solar',
 corosEUp: 'https://coros.com/eu/products',
 mageneC506: 'https://www.magene.com/en/bike-computers/171-c506-smart-gps-bike-computer.html',
 igpBSC: 'https://arg.igpsport.com/bsc300/',
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
   ['Prezzo di lancio', '549,99 € (Garmin Italia)', '749,99 € (Garmin Italia)', 'da 269 € (store COROS Europa, letto il 29/10/2026)'],
   ['Batteria dichiarata', 'Solo GPS fino a 18 ore; modalità smartwatch fino a 10 giorni (42 mm) o 11 giorni (47 mm)', 'Solo GPS fino a 26 ore; modalità smartwatch fino a 15 giorni (manuale Garmin)', 'Fino a 41 ore di GPS (All Systems, High); uso quotidiano 19 giorni, 6 con display sempre acceso (COROS)'],
   ['Schermo', 'AMOLED (misure 42 e 47 mm)', 'AMOLED 1,4 pollici, cassa in titanio 47 mm (DC Rainmaker)', 'AMOLED 1,2 pollici, 1.500 nit (DC Rainmaker)'],
   ['Peso dichiarato', 'non indicato nei manuali letti', 'non indicato nei manuali letti', '32 g con cinturino in nylon, 40 g in silicone (COROS)'],
   ['Mappe a bordo', 'No', 'Sì, mappe a colori', 'No (il Pace Pro ha le mappe offline, DC Rainmaker)'],
  ],
  tester: [
   `<b>Forerunner 970, DC Rainmaker (16/06/2025):</b> con il display sempre acceso la batteria è durata circa 2,5 giorni. Il tester scrive che i Garmin con display da 1.000 nit e cassa da 45-47 mm gli durano di solito 4-6 giorni nello stesso uso.`,
   `<b>COROS Pace 4, DC Rainmaker (10/11/2025):</b> lo definisce un ottimo rapporto qualità prezzo. Nel nuoto in acque libere la traccia GPS è "non male" ma taglia un angolo all'inizio; per COROS, dice, è un buon risultato. Nell'uscita in bici la frequenza cardiaca al polso è più variabile.`,
   `<b>Forerunner 570:</b> nessun test completo letto per ora, solo il comunicato Garmin e la scheda tecnica. Non lo giudichiamo.`,
  ],
  how: 'Come leggere i dati', howl: ['Le ore di batteria di marche diverse non sono confrontabili: cambiano GNSS, schermo e sensori.', 'Il Pace 4 ha un prezzo di lancio molto più basso. DC Rainmaker lo definisce un ottimo affare, ma ricorda che Forerunner 255 e Vivoactive 6 in offerta possono arrivare al suo prezzo con più funzioni. È il giudizio del tester, non un nostro verdetto.', 'COROS è un marchio emergente: il titolare del marchio risulta a Dongguan, Cina (registro marchi canadese).'],
  src: [['Garmin Italia, comunicato Forerunner 570 e 970 (15/05/2025)', S.garPress], ['Garmin, manuale Forerunner serie 570, durata batteria', S.garBatt], ['DC Rainmaker, Forerunner 970 in-depth review (16/06/2025)', S.dcrFR970], ['DC Rainmaker, COROS Pace 4 in-depth review (10/11/2025)', S.dcrPace4], ['Garmin, manuale Forerunner 970, durata batteria', S.gar970], ['COROS, pagina Pace 4 (ore GPS, peso)', S.corosBuy4], ['COROS Europa, prezzo Pace 4', S.corosEU4], ['COROS, specifiche batteria', S.corosBatt], ['CIPO Canada, marchio COROS', S.corosTM]],
 },
 en: {
  rel: G[0].en, title: 'Running GPS watches: Forerunner 570, Forerunner 970, COROS Pace 4', desc: 'Three running GPS watches side by side: manufacturer data and results from tests already published by DC Rainmaker. Last checked 29/10/2026.',
  h1: 'Running GPS watches, side by side.', lede: 'Garmin Forerunner 570 and 970, and COROS Pace 4. Manufacturer data on one side, tester results on the other. No tests of our own and no ranking.',
  cols: ['Garmin Forerunner 570', 'Garmin Forerunner 970', 'COROS Pace 4'],
  rows: [
   ['Launch price', '€549.99 (Garmin Italy)', '€749.99 (Garmin Italy)', 'from €269 (COROS Europe store, read 29/10/2026)'],
   ['Claimed battery', 'GPS only up to 18 hours; smartwatch mode up to 10 days (42 mm) or 11 days (47 mm)', 'GPS only up to 26 hours; smartwatch mode up to 15 days (Garmin manual)', 'Up to 41 hours of GPS (All Systems, High); 19 days of daily use, 6 with always-on display (COROS)'],
   ['Display', 'AMOLED (42 and 47 mm sizes)', '1.4-inch AMOLED, 47 mm titanium case (DC Rainmaker)', '1.2-inch AMOLED, 1,500 nits (DC Rainmaker)'],
   ['Claimed weight', 'not given in the manuals we read', 'not given in the manuals we read', '32 g with nylon band, 40 g with silicone (COROS)'],
   ['Onboard maps', 'No', 'Yes, colour maps', 'No (the Pace Pro has offline maps, DC Rainmaker)'],
  ],
  tester: [
   '<b>Forerunner 970, DC Rainmaker (16/06/2025):</b> with the always-on display the battery lasted about 2.5 days. The tester writes that Garmin watches with 1,000-nit displays and 45-47 mm cases usually last him 4-6 days in the same use.',
   '<b>COROS Pace 4, DC Rainmaker (10/11/2025):</b> he calls it a very good value watch. In open-water swimming the GPS track is "not too bad" but cuts a corner early on; for COROS, he says, that is a good result. On the bike ride the wrist heart rate is more variable.',
   '<b>Forerunner 570:</b> no full test read yet, only Garmin\'s release and spec page. We do not judge it.',
  ],
  how: 'How to read the data', howl: ['Battery hours from different brands are not comparable: GNSS mode, screen and sensors differ.', 'The Pace 4 has a much lower launch price. DC Rainmaker calls it a fantastic bargain, but notes that the Forerunner 255 and Vivoactive 6 on sale can reach its price with more features. That is the tester\'s view, not our verdict.', 'COROS is an emerging brand: the trademark owner is listed in Dongguan, China (Canadian trademark register).'],
  src: [['Garmin Italy, Forerunner 570 and 970 release (15/05/2025)', S.garPress], ['Garmin, Forerunner 570 series manual, battery life', S.garBatt], ['DC Rainmaker, Forerunner 970 in-depth review (16/06/2025)', S.dcrFR970], ['DC Rainmaker, COROS Pace 4 in-depth review (10/11/2025)', S.dcrPace4], ['Garmin, Forerunner 970 manual, battery life', S.gar970], ['COROS, Pace 4 page (GPS hours, weight)', S.corosBuy4], ['COROS Europe, Pace 4 price', S.corosEU4], ['COROS, battery specifications', S.corosBatt], ['CIPO Canada, COROS trademark', S.corosTM]],
 },
};
// ---------- BIKE COMPUTERS
const C = {
 it: {
  rel: G[1].it, title: 'Ciclocomputer di marchi emergenti: COROS Dura 2, Magene C506, iGPSPORT BSC300', desc: 'Tre ciclocomputer di marchi con sede in Cina, letti attraverso test già pubblicati. Ultima verifica 29/10/2026.',
  h1: 'Ciclocomputer di marchi emergenti.', lede: 'COROS Dura 2 Solar, Magene C506 e iGPSPORT BSC300, dai test di DC Rainmaker, road.cc e Cyclists Hub. Nessun test nostro e nessuna classifica.',
  cols: ['COROS Dura 2 Solar', 'Magene C506', 'iGPSPORT BSC300'],
  rows: [
   ['Prezzo', '499 € (store COROS Europa); 499-549 USD, la versione da 499 USD senza supporto (COROS USA)', '99 USD (Magene); 109 £ al lancio per road.cc', 'non indicato nelle pagine ufficiali lette'],
   ['Schermo', '3,5 pollici Memory-in-Pixel, antiriflesso (COROS)', '2,4 pollici a colori, touchscreen (Magene, road.cc)', '2,4 pollici, 320 x 240 pixel, senza touchscreen (iGPSPORT, Cyclists Hub)'],
   ['Peso dichiarato', '99 g (COROS); il supporto standard aggiunge meno di 40 g', '76 g (Magene). road.cc indica 94 g: la differenza non è spiegata', '67 g (iGPSPORT)'],
   ['Batteria dichiarata', '120 ore di GPS con una carica, senza contare il solare (COROS)', '17 ore in uso normale, fino a 24 ore in modalità lunga durata (Magene)', '20 ore (iGPSPORT)'],
  ],
  tester: [
   '<b>COROS Dura 2 Solar, DC Rainmaker (22/10/2026):</b> il tester scrive che "COROS non sta consegnando un dispositivo premium": software e stabilità non sono ancora al livello del prezzo. Nel box non c\'è nessun supporto per il manubrio. Per la batteria, COROS la ottiene con uno schermo meno visibile: "non è discutibile", dice, lo si vede su strada.',
   '<b>Magene C506, road.cc:</b> il touchscreen è "rather good" per il prezzo e mostra bene le mappe, ma risponde con lentezza ("hesitant"): a volte servono più tocchi. Il sensore di luce ambiente regola bene la luminosità.',
   '<b>iGPSPORT BSC300, Cyclists Hub:</b> piccolo e capace, a pulsanti, con menu intuitivi, ispirato alla serie Edge 5xx. Punteggio complessivo 4,1/5 del recensore. Manca il sensore di luce ambiente e lo schermo potrebbe essere più luminoso.',
  ],
  how: 'Come leggere i dati', howl: ['Sono tre prodotti molto diversi per fascia: il Dura 2 punta ai ciclocomputer premium, gli altri due al prezzo.', 'I voti e le frasi sono dei recensori citati, non nostri. I dati non verificati sono segnati come tali.', 'Sede dei marchi: COROS risulta a Dongguan (registro marchi canadese). iGPSPORT ha una società a Wuhan (dichiarazione FCC) e si dichiara fondata nel 2012. Magene si presenta nel profilo aziendale come leader del mercato cinese dei rulli e sensori.', 'Per i modelli Garmin, Wahoo e Hammerhead vedi il <a href="/picks/ciclocomputer/">confronto dedicato</a>.'],
  src: [['COROS, pagina Dura 2 Solar (specifiche)', S.corosD2], ['COROS Europa, prezzi', S.corosEUp], ['Magene, scheda C506', S.mageneC506], ['iGPSPORT, scheda BSC300', S.igpBSC], ['DC Rainmaker, COROS Dura 2 Solar in-depth review (22/10/2026)', S.dcrDura2], ['road.cc, recensione Magene C506', S.roadMagene], ['Cyclists Hub, recensione iGPSPORT BSC300', S.hubBSC], ['iGPSPORT, pagina aziendale', S.igpAbout], ['FCC, lettera iGPSPORT (Wuhan Qiwu Technology)', S.igpFCC], ['Magene, profilo aziendale', S.mageneCo], ['CIPO Canada, marchio COROS', S.corosTM]],
 },
 en: {
  rel: G[1].en, title: 'Bike computers from emerging brands: COROS Dura 2, Magene C506, iGPSPORT BSC300', desc: 'Three bike computers from brands based in China, read through tests already published. Last checked 29/10/2026.',
  h1: 'Bike computers from emerging brands.', lede: 'COROS Dura 2 Solar, Magene C506 and iGPSPORT BSC300, from tests by DC Rainmaker, road.cc and Cyclists Hub. No tests of our own and no ranking.',
  cols: ['COROS Dura 2 Solar', 'Magene C506', 'iGPSPORT BSC300'],
  rows: [
   ['Price', '€499 (COROS Europe store); USD 499-549, the USD 499 unit without a mount (COROS US)', 'USD 99 (Magene); £109 at launch per road.cc', 'not given on the official pages we read'],
   ['Screen', '3.5-inch Memory-in-Pixel, anti-glare (COROS)', '2.4-inch colour touchscreen (Magene, road.cc)', '2.4 inch, 320 x 240 pixels, no touchscreen (iGPSPORT, Cyclists Hub)'],
   ['Claimed weight', '99 g (COROS); the standard mount adds under 40 g', '76 g (Magene). road.cc lists 94 g: the gap is not explained', '67 g (iGPSPORT)'],
   ['Claimed battery', '120 hours of GPS on one charge, not counting solar (COROS)', '17 hours in normal use, up to 24 hours in long-battery mode (Magene)', '20 hours (iGPSPORT)'],
  ],
  tester: [
   '<b>COROS Dura 2 Solar, DC Rainmaker (22/10/2026):</b> the tester writes that "COROS isn\'t delivering a premium device": software and stability are not yet at the level of the price. There is no handlebar mount in the box. On battery, COROS gets it with a screen that is harder to see: "not debatable", he says, you can see it on the road.',
   '<b>Magene C506, road.cc:</b> the touchscreen is "rather good" for the price and renders route maps well, but it is slow to react ("hesitant"): sometimes it takes several taps. The ambient light sensor adjusts brightness well.',
   '<b>iGPSPORT BSC300, Cyclists Hub:</b> small and capable, button-based, intuitive menus, inspired by the Edge 5xx series. Overall score 4.1/5 from the reviewer. It lacks an ambient light sensor and the screen could be brighter.',
  ],
  how: 'How to read the data', howl: ['These are very different products by price tier: the Dura 2 targets premium computers, the other two target price.', 'Scores and quotes belong to the reviewers named, not to us. Data we did not verify is marked as such.', 'Brand base: COROS is listed in Dongguan (Canadian trademark register). iGPSPORT has a company in Wuhan (FCC filing) and says it was founded in 2012. Magene\'s company profile presents it as a market leader for trainers and sensors in China.', 'For Garmin, Wahoo and Hammerhead see the <a href="/en/picks/bike-computers/">dedicated comparison</a>.'],
  src: [['COROS, Dura 2 Solar page (specs)', S.corosD2], ['COROS Europe, prices', S.corosEUp], ['Magene, C506 page', S.mageneC506], ['iGPSPORT, BSC300 page', S.igpBSC], ['DC Rainmaker, COROS Dura 2 Solar in-depth review (22/10/2026)', S.dcrDura2], ['road.cc, Magene C506 review', S.roadMagene], ['Cyclists Hub, iGPSPORT BSC300 review', S.hubBSC], ['iGPSPORT, company page', S.igpAbout], ['FCC, iGPSPORT letter (Wuhan Qiwu Technology)', S.igpFCC], ['Magene, company profile', S.mageneCo], ['CIPO Canada, COROS trademark', S.corosTM]],
 },
};

// ---------- SHOES (RTINGS lab data and use-case scores; categories follow the use each review states)
const R = 'https://www.rtings.com/running-shoes/reviews/';
const SH = {
 evo: ['adidas Adizero Evo SL', '220,0 g', '36,9 mm', '6,7 mm', 'Piastra in plastica (shank)', '8.3', '8.0', '6.6', R + 'adidas/adizero-evo-sl'],
 nova: ['ASICS Novablast 6', '247,7 g', '41,9 mm', '8,8 mm', 'Nessuna', '7.2', '8.5', '7.1', R + 'asics/novablast-6'],
 ghost: ['Brooks Ghost 18', '283,3 g', '36,6 mm', '10,8 mm', 'Nessuna', '4.3', '6.6', '8.1', R + 'brooks/ghost-18'],
 speed: ['Saucony Endorphin Speed 6', '222,0 g', '37,8 mm', '7,3 mm', 'Piastra in plastica', '8.5', '7.7', '7.4', R + 'saucony/endorphin-speed-6'],
 anta: ['ANTA C202 7', '212,9 g', '37,8 mm', '7,5 mm', 'Carbonio', '7.5', '8.0', '6.3', R + 'anta/c202-7'],
 x260: ['XTEP 260X 3.0', '216,0 g', '36,8 mm', '10,4 mm', 'Carbonio', '8.2', '6.8', '7.1', R + 'xtep/260x-3-0'],
 adios: ['adidas Adizero Adios Pro 4', '197,5 g', '39,5 mm', '7,0 mm', 'Aste in fibra di carbonio', '8.8', '7.9', '5.5', R + 'adidas/adizero-adios-pro-4'],
 fei: ['Li-Ning Feidian 6 Elite', '205,1 g', '39,7 mm', '5,4 mm', 'Carbonio', '8.9', '9.0', '6.2', R + 'li-ning/feidian-6-elite'],
 x160: ['XTEP 160X 7.0 PRO', '226,8 g', '38,2 mm', '4,0 mm', 'Carbonio', '8.3', '8.3', '6.7', R + 'xtep/160x-7-0-pro'],
};
// use-case scores: [Half/Full marathon racing, 5K/10K racing, Long run, Daily training]
const UC = { evo: [7.6, 7.3, 7.3, 7.4], nova: [7.4, 6.5, 7.4, 7.9], ghost: [5.4, 6.2, 6.4, 7.4], speed: [8.0, 7.6, 7.7, 7.0], anta: [7.9, 7.9, 7.5, 6.2], x260: [7.1, 8.0, 7.0, 6.1], adios: [8.1, 7.9, 7.2, 6.0], fei: [8.4, 7.5, 8.0, 6.5], x160: [8.2, 7.8, 7.9, 6.5] };
const PL = { Nessuna: 'None', 'Piastra in plastica (shank)': 'Plastic shank', 'Piastra in plastica': 'Plastic plate', Carbonio: 'Carbon fibre plate', 'Aste in fibra di carbonio': 'Carbon fibre rods' };
const shoeTable = (keys, ucIdx, lang) => {
  const it = lang === 'it', n = (x) => (it ? x : x.replace(',', '.'));
  const rows = [
    [it ? 'Peso' : 'Weight', ...keys.map((k) => n(SH[k][1].replace(' g', ' g')))],
    [it ? 'Altezza tallone' : 'Heel stack', ...keys.map((k) => n(SH[k][2]))],
    ['Drop', ...keys.map((k) => n(SH[k][3]))],
    [it ? 'Piastra' : 'Plate', ...keys.map((k) => (it ? SH[k][4] : PL[SH[k][4]]))],
    [it ? 'Ritorno di energia (0-10)' : 'Energy return (0-10)', ...keys.map((k) => SH[k][5])],
    [it ? 'Ammortizzazione (0-10)' : 'Cushioning (0-10)', ...keys.map((k) => SH[k][6])],
    [it ? 'Stabilità (0-10)' : 'Stability (0-10)', ...keys.map((k) => SH[k][7])],
    [it ? ['Uso: allenamento quotidiano', 'Uso: gara 5-10 km', 'Uso: gara mezza e maratona'][ucIdx === 3 ? 0 : ucIdx === 1 ? 1 : 2] + ' (0-10)' : ['Use: daily training', 'Use: 5K/10K racing', 'Use: half and full marathon racing'][ucIdx === 3 ? 0 : ucIdx === 1 ? 1 : 2] + ' (0-10)', ...keys.map((k) => Number(UC[k][ucIdx]).toFixed(1))],
  ];
  return tbl(keys.map((k) => SH[k][0]), rows, lang);
};
const SHOE = {
 it: { rel: G[2].it, title: 'Scarpe da corsa per categoria: Daily, Tempo, Marathon', desc: 'Nove scarpe da corsa, anche di marchi cinesi, divise in Daily, Tempo e Marathon sui test di laboratorio RTINGS. Ultima verifica 29/10/2026.',
   h1: 'Scarpe da corsa: Daily, Tempo, Marathon.', lede: 'Misure di laboratorio e punteggi d\'uso di RTINGS, con marchi cinesi inclusi. Nessun test nostro e nessuna classifica.',
   intro: ['Come abbiamo diviso le categorie: RTINGS non usa la parola "Tempo". Per Daily e Marathon usiamo i suoi punteggi d\'uso ("Daily Training", "Half/Full Marathon Racing"). Per Tempo mettiamo le scarpe che le recensioni RTINGS descrivono per allenamenti veloci e gare brevi. Sono scelte nostre di raggruppamento, i numeri sono di RTINGS.', 'I punteggi 0-10 e le misure sono di RTINGS su un paio (taglia uomo) e cambiano con gli aggiornamenti del loro banco di prova. Prezzi non inclusi: variano per mercato.'],
   sec: [
    ['Daily', 'Chilometri di tutti i giorni. In ordine di punteggio d\'uso, la più alta è la ASICS Novablast 6; Evo SL e Ghost 18 hanno lo stesso punteggio. Nessuna scarpa daily di marchi cinesi letta finora.', ['nova', 'evo', 'ghost'], 3,
     'RTINGS sulla Novablast 6: nella sua comparazione, la Gel-Nimbus 28 è migliore per allenamento quotidiano e lunghi per stabilità e ammortizzazione più resistente; la Novablast resta più reattiva.'],
    ['Tempo', 'Allenamenti veloci e gare corte. RTINGS descrive la ANTA C202 7 come più pratica "per allenamenti e sedute veloci" della versione da gara; la XTEP 260X 3.0 come scarpa "da allenamenti e gare brevi"; la Endorphin Speed 6 come aggiornamento utile "per allenamenti lunghi e gare".', ['speed', 'anta', 'x260'], 1,
     'ANTA e XTEP: dai marchi cinesi testati da RTINGS. XTEP è citata come marchio cinese da Outside (Running).'],
    ['Marathon', 'Scarpe da gara con piastra in carbonio. Punteggio RTINGS per mezza e maratona più alto: Li-Ning Feidian 6 Elite (8,4), poi XTEP 160X 7.0 PRO (8,2) e Adizero Adios Pro 4 (8,1). Outside (Running) definisce Feidian 6 Elite e XTEP 160X 7.0 PRO "marathon racers" cinesi con piastra in carbonio.', ['fei', 'x160', 'adios'], 2,
     'Stabilità bassa in tutte e tre (5,5-6,7 su 10): sono scarpe da gara, non da uso quotidiano, e il loro punteggio daily è tra 6,0 e 6,5.'],
   ],
   src: [['RTINGS, Adizero Evo SL', R + 'adidas/adizero-evo-sl'], ['RTINGS, ASICS Novablast 6', R + 'asics/novablast-6'], ['RTINGS, Brooks Ghost 18', R + 'brooks/ghost-18'], ['RTINGS, Saucony Endorphin Speed 6', R + 'saucony/endorphin-speed-6'], ['RTINGS, ANTA C202 7', R + 'anta/c202-7'], ['RTINGS, XTEP 260X 3.0', R + 'xtep/260x-3-0'], ['RTINGS, adidas Adizero Adios Pro 4', R + 'adidas/adizero-adios-pro-4'], ['RTINGS, Li-Ning Feidian 6 Elite', R + 'li-ning/feidian-6-elite'], ['RTINGS, XTEP 160X 7.0 PRO', R + 'xtep/160x-7-0-pro'], ['Outside (Running), 8 scarpe cinesi testate (10/06/2026)', 'https://run.outsideonline.com/gear/road-shoes/chinese-running-shoes/']], cap: ['Daily', 'Tempo', 'Marathon'] },
 en: { rel: G[2].en, title: 'Running shoes by category: Daily, Tempo, Marathon', desc: 'Nine running shoes, including Chinese brands, split into Daily, Tempo and Marathon on RTINGS lab tests. Last checked 29/10/2026.',
   h1: 'Running shoes: Daily, Tempo, Marathon.', lede: 'RTINGS lab measurements and use scores, Chinese brands included. No tests of our own and no ranking.',
   intro: ['How we split the categories: RTINGS does not use the word "Tempo". For Daily and Marathon we use its use scores ("Daily Training", "Half/Full Marathon Racing"). For Tempo we group shoes that RTINGS reviews describe for fast workouts and short races. The grouping is ours; the numbers are RTINGS\'.', 'The 0-10 scores and measurements are RTINGS\' on one pair (men\'s size) and change as their test bench updates. Prices are left out: they vary by market.'],
   sec: [
    ['Daily', 'Everyday miles. By use score the ASICS Novablast 6 is highest; Evo SL and Ghost 18 score the same. No Chinese-brand daily shoe read so far.', ['nova', 'evo', 'ghost'], 3,
     'RTINGS on the Novablast 6: in its comparison, the Gel-Nimbus 28 is better for daily training and long runs thanks to stability and more resilient cushioning; the Novablast stays more lively.'],
    ['Tempo', 'Fast workouts and short races. RTINGS describes the ANTA C202 7 as more practical "for workouts and general faster training sessions" than the race version; the XTEP 260X 3.0 as a "short-distance workout and racing shoe"; the Endorphin Speed 6 as a meaningful upgrade "especially for longer workouts and races".', ['speed', 'anta', 'x260'], 1,
     'ANTA and XTEP: Chinese brands tested by RTINGS. XTEP is named as a Chinese brand by Outside (Running).'],
    ['Marathon', 'Carbon-plated race shoes. Highest RTINGS half and full marathon scores: Li-Ning Feidian 6 Elite (8.4), then XTEP 160X 7.0 PRO (8.2) and Adizero Adios Pro 4 (8.1). Outside (Running) calls the Feidian 6 Elite and XTEP 160X 7.0 PRO Chinese carbon-plated "marathon racers".', ['fei', 'x160', 'adios'], 2,
     'Low stability on all three (5.5-6.7 out of 10): race shoes, not everyday shoes, and their daily-training score is between 6.0 and 6.5.'],
   ],
   src: null, cap: ['Daily', 'Tempo', 'Marathon'] },
};
SHOE.en.src = [['RTINGS, Adizero Evo SL', R + 'adidas/adizero-evo-sl'], ['RTINGS, ASICS Novablast 6', R + 'asics/novablast-6'], ['RTINGS, Brooks Ghost 18', R + 'brooks/ghost-18'], ['RTINGS, Saucony Endorphin Speed 6', R + 'saucony/endorphin-speed-6'], ['RTINGS, ANTA C202 7', R + 'anta/c202-7'], ['RTINGS, XTEP 260X 3.0', R + 'xtep/260x-3-0'], ['RTINGS, adidas Adizero Adios Pro 4', R + 'adidas/adizero-adios-pro-4'], ['RTINGS, Li-Ning Feidian 6 Elite', R + 'li-ning/feidian-6-elite'], ['RTINGS, XTEP 160X 7.0 PRO', R + 'xtep/160x-7-0-pro'], ['Outside (Running), 8 Chinese running shoes tested (10/06/2026)', 'https://run.outsideonline.com/gear/road-shoes/chinese-running-shoes/']];
for (const lang of ['it', 'en']) {
  const kick = lang === 'it' ? ['WOLF PICKS · RUNNING · OROLOGI', 'WOLF PICKS · CYCLING · CICLOCOMPUTER'] : ['WOLF PICKS · RUNNING · WATCHES', 'WOLF PICKS · CYCLING · BIKE COMPUTERS'];
  [W[lang], C[lang]].forEach((p, i) => {
    page(lang, p.rel, p.title, p.desc, hero(kick[i], p.h1, p.lede) + tbl(p.cols, p.rows, lang) +
      box(lang === 'it' ? 'Cosa dicono i test già pubblicati' : 'What the published tests say', ul(p.tester)) +
      box(p.how, ul(p.howl)) +
      box(lang === 'it' ? 'Fonti' : 'Sources', '<ol>' + p.src.map((s) => `<li>${a(s[1], s[0])}</li>`).join('') + '</ol>' + note(D[lang])) + note(TR[lang]) + END);
  });
  { const p = SHOE[lang];
    page(lang, p.rel, p.title, p.desc, hero(lang === 'it' ? 'WOLF PICKS · RUNNING · SCARPE' : 'WOLF PICKS · RUNNING · SHOES', p.h1, p.lede) + ul(p.intro) +
      p.sec.map((x) => `<h2 class="pk-h2">${x[0]}</h2><p>${x[1]}</p>` + shoeTable(x[2], x[3], lang) + note(x[4])).join('') +
      box(lang === 'it' ? 'Fonti' : 'Sources', '<ol>' + p.src.map((q) => `<li>${a(q[1], q[0])}</li>`).join('') + '</ol>' + note(D[lang])) + note(TR[lang]) + END); }
  // hub links
  const hubp = path.join(root, lang === 'it' ? 'picks/index.html' : 'en/picks/index.html');
  let h = fs.readFileSync(hubp, 'utf8');
  for (const [p, sub] of [[W[lang], lang === 'it' ? 'Dati dei produttori e test già pubblicati' : 'Manufacturer data and published tests'], [C[lang], lang === 'it' ? 'Marchi emergenti, da test già pubblicati' : 'Emerging brands, from published tests'], [SHOE[lang], lang === 'it' ? 'Daily, Tempo e Marathon, da test di laboratorio già pubblicati' : 'Daily, Tempo and Marathon, from published lab tests']]) {
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
