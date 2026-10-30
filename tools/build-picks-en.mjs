import "./guard.mjs";
// WOLF PICKS EN: genera /en/picks/ e /en/partner/ dagli stessi dati di content/catalog. Idempotente.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')).products;
const P = rd('content/catalog/products.json'), FU = rd('content/catalog/fuel.json');
const shell = fs.readFileSync(path.join(root, 'en/gear.html'), 'utf8');
const head0 = shell.slice(0, shell.indexOf('<main')), foot = shell.slice(shell.indexOf('</main>') + 7);
const f = (v) => String(v);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const ul = (l) => '<ul>' + l.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const U = { hub: '/en/picks/', guide: '/en/picks/training-shoes/', cmp: '/en/picks/compare-evo-sl-novablast-6-ghost-18/', fuel: '/en/picks/carb-gels/' };
const IT = { hub: '/picks/', guide: '/picks/scarpe-allenamento/', cmp: '/picks/confronto-evo-sl-novablast-6-ghost-18/', fuel: '/picks/gel-carboidrati/', partner: '/partner/' };
const pu = (p) => '/en/picks/' + p.slug + '/';
const LAB = 'RTINGS lab measurements on one pair (men\'s size): manufacturer figures can differ. Checked on 28/10/2026.';
const LPR = { 'adidas-adizero-evo-sl': ['€150', 'adidas.it'], 'asics-novablast-6': ['€160', 'asics.com/it'], 'brooks-ghost-18': ['€150', 'brooksrunning.com, Italy store'] };
const LPN = "List price: price shown by the brand on its own site (Italian store), men's version, checked on 28/10/2026. These are not retailer offers and can change by variant and market.";
const CYP = { 'garmin-edge-1060': '€799.99', 'wahoo-elemnt-roam-3': '€449.99' };
const DISC = '<p class="pk-note">Transparency: no affiliate links on this page; external links are technical sources and official product pages. When affiliate links appear they will be marked next to the link and do not change the assessment.</p>';
const srcs = (p) => '<ol>' + p.sources.map((s) => `<li><a href="${s.url}" rel="noopener">${esc(s.label)}</a></li>`).join('') + '</ol>';
const EN = {
  'adidas-adizero-evo-sl': { summary: 'Lightstrike Pro midsole with no carbon plate, light. In RTINGS tests, cushioning and energy return are high for the weight.',
    fits: ['Runners who want a shoe for daily miles, faster sessions and the odd race', 'Runners who want cushioning without a tall stack'],
    less: ['Runners who need support or roll inwards (RTINGS)', 'Runners who want maximum stability when tired: the platform is narrow at the heel and hollow under the arch', 'Wet grip rated poor by RTINGS'],
    src: ['RTINGS, review with lab measurements', 'adidas US, product page (description; indicative price USD 150 on 28/10/2026)', "Runner's World, review (declared data: stack 39/33 mm, drop 6 mm, 8.1 oz)"] },
  'asics-novablast-6': { summary: 'FF BLAST MAX foam with FF TURBO SQUARED pods under the forefoot. Very cushioned. In RTINGS tests the forefoot rebounds more than the heel.',
    fits: ['Runners who want one shoe for all their weekly mileage', 'Midfoot or forefoot strikers who want a cushioned, lively ride', 'Runners who put impact protection first'],
    less: ['Heel strikers who want a lively shoe (the heel returns less)', 'Runners who want snap for intervals or short races (weight and soft forefoot, RTINGS)'],
    src: ['RTINGS, review with lab measurements', 'ASICS, official Novablast 6 press release (29/05/2026)', 'ASICS Australia, Novablast 6 vs Novablast 5', "Runner's World, review (declared data: heel stack 41.5 mm, drop 8 mm, 8.7 oz)"] },
  'brooks-ghost-18': { summary: 'Classic neutral trainer with DNA Loft v3 foam. In RTINGS tests the platform is very stable and the heel protected, but it is heavy with little energy return.',
    fits: ['Runners who want a stable, predictable shoe for easy miles', 'Heel strikers who want heel protection'],
    less: ['Runners who want to pick up the pace: heavy and not very responsive (RTINGS)', 'Runners who want cushioning under the forefoot (rated poor by RTINGS)'],
    src: ['RTINGS, review with lab measurements', "Runner's World, Ghost 18 (declared data: 10.2 oz, drop 10 mm, stack 36 mm)"] },
};
const nm = (p) => `${p.brand} ${p.model}`;
function page(rel, itRel, title, desc, main) {
  const h = head0.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} - Wolf Lab</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${SITE}${rel}">`)
    .replace(/<link rel="alternate" hreflang[^>]*>\s*/g, `<link rel="alternate" hreflang="en" href="${SITE}${rel}">\n<link rel="alternate" hreflang="it" href="${SITE}${itRel}">\n`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)} - Wolf Lab">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${rel}">`)
    .replace(/<meta property="og:image"[^>]*data-seo="1">.*?(?=<\/head>)/s, '')
    .replace(/<a class="lang" href="[^"]*" hreflang="it" lang="it">/, `<a class="lang" href="${itRel}" hreflang="it" lang="it">`);
  const out = path.join(root, rel.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h + main + foot);
}
const hero = (kick, h1, lede) => `<main id="main"><header class="w-page-hero"><div class="wrap"><p class="w-kicker">${kick}</p><h1>${h1}</h1>${lede ? `<p class="w-lede">${lede}</p>` : ''}</div></header><div class="wrap w-body">`;
const END = '</div></main>';
const itOf = (p) => '/picks/' + p.slug + '/';
for (const p of P) {
  const s = p.specs, t = EN[p.id];
  const rows = [['Weight', f(s.weightG.value) + ' g'], ['Heel stack', f(s.heelStackMm.value) + ' mm'], ['Drop', f(s.dropMm.value) + ' mm'], ['Energy return, forefoot', f(s.forefootEnergyReturnPct.value) + '%'], ['Energy return, heel', f(s.heelEnergyReturnPct.value) + '%']];
  page(pu(p), itOf(p), nm(p), t.summary, hero('WOLF PICKS · RUNNING · TRAINING SHOES', esc(nm(p)), esc(t.summary)) +
    `<div class="pk-box"><h3>Measured data</h3><table class="pk-tbl"><tbody>${rows.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}<tr><th>List price</th><td>${LPR[p.id][0]} <small>(${LPR[p.id][1]}, checked 28/10/2026)</small></td></tr></tbody></table><p class="pk-note">${LAB} ${LPN}</p></div>` +
    `<div class="pk-two"><div class="pk-box"><h3>Good for</h3>${ul(t.fits)}</div><div class="pk-box"><h3>Less suited to</h3>${ul(t.less)}</div></div>` +
    `<div class="pk-box"><h3>Comparison</h3><p><a href="${U.cmp}">Evo SL, Novablast 6 and Ghost 18 side by side →</a></p></div><div class="pk-box"><h3>Sources</h3><ol>${p.sources.map((x, i) => `<li><a href="${x.url}" rel="noopener">${esc(t.src[i])}</a></li>`).join('')}</ol><p class="pk-note">Last checked: 28 October 2026.</p></div>` + DISC + END);
}
const qual = { 'adidas-adizero-evo-sl': ['High', 'Adequate: narrow heel'], 'asics-novablast-6': ['Very high', 'Fair: soft'], 'brooks-ghost-18': ['Adequate: great at the heel, poor at the forefoot', 'Very good'] };
const row = (l, fn) => `<tr><th>${l}</th>${P.map((p) => `<td>${fn(p)}</td>`).join('')}</tr>`;
page(U.cmp, IT.cmp, 'Adizero Evo SL, Novablast 6, Ghost 18: which to choose', 'Three neutral training shoes compared on independent lab measurements. Last checked 28/10/2026.',
  hero('WOLF PICKS · COMPARISON', 'Adizero Evo SL, Novablast 6, Ghost 18: which to choose.', 'Three neutral training shoes compared on independent lab measurements. Current versions as of 28/10/2026.') +
  `<div class="pk-scroll"><table class="pk-tbl"><thead><tr><th></th>${P.map((p) => `<th>${esc(nm(p))}</th>`).join('')}</tr></thead><tbody>` +
  row('Weight', (p) => f(p.specs.weightG.value) + ' g') + row('Heel stack', (p) => f(p.specs.heelStackMm.value) + ' mm') + row('Drop', (p) => f(p.specs.dropMm.value) + ' mm') +
  row('Forefoot energy return', (p) => f(p.specs.forefootEnergyReturnPct.value) + '%') + row('Heel energy return', (p) => f(p.specs.heelEnergyReturnPct.value) + '%') +
  row('Cushioning (RTINGS)', (p) => qual[p.id][0]) + row('Stability (RTINGS)', (p) => qual[p.id][1]) + row('List price', (p) => LPR[p.id][0]) + '</tbody></table></div>' +
  `<p class="pk-note">${LAB} ${LPN}</p><div class="pk-box"><h3>Which to choose? (reasoned from the data, not a verdict)</h3><ul>` +
  '<li><b>Mixed paces, the odd race:</b> Adizero Evo SL. The lightest of the three (220 g) with the highest energy return.</li>' +
  '<li><b>Maximum protection and everyday comfort:</b> Novablast 6. Taller stack and very high cushioning; the forefoot is livelier than the heel.</li>' +
  '<li><b>Stability and easy miles, heel landing:</b> Ghost 18. The heaviest and least responsive, but the most stable according to RTINGS.</li></ul></div>' +
  `<div class="pk-box"><h3>Shoe pages</h3><p>${P.map((p) => `<a href="${pu(p)}">${esc(nm(p))}</a>`).join(' · ')}</p></div>` +
  `<div class="pk-box"><h3>Sources</h3><ol>${P.map((p) => `<li><a href="${p.sources[0].url}" rel="noopener">${esc(nm(p))}: ${esc(EN[p.id].src[0])}</a></li>`).join('')}</ol><p class="pk-note">Last checked: 28 October 2026.</p></div>` + DISC + END);
page(U.guide, IT.guide, 'Running training shoes: how to choose', 'What to look at in a neutral training shoe and three models to start from. Sources and check date.',
  hero('WOLF PICKS · BUYING GUIDE', 'Running training shoes: how to choose.') +
  '<div class="pk-box"><h3>What to look at</h3><ul><li><b>Weight:</b> a lighter shoe helps at lively paces; a heavier one usually offers more structure.</li><li><b>Stack and softness:</b> more stack and softer foam protect against impact, but can feel less stable.</li><li><b>Where you land:</b> heel or midfoot/forefoot changes which shoe works best, as the energy-return measurements show.</li><li><b>Use:</b> easy miles, faster sessions, long runs.</li></ul></div>' +
  `<div class="pk-box"><h3>Three starting points</h3><ul>${P.map((p) => `<li><b><a href="${pu(p)}">${esc(nm(p))}</a></b>: ${esc(EN[p.id].summary)}</li>`).join('')}</ul><p><a href="${U.cmp}">Go to the comparison →</a></p></div>` +
  '<div class="pk-box"><h3>Sources</h3><p>Lab measurements and independent reviews are listed on the shoe pages and the comparison. Last checked: 28 October 2026.</p></div>' + DISC + END);
const FEN = {
  'maurten-gel-100': { texture: 'hydrogel (alginate), taken without water', caf: 'Gel 100 Caf 100 with caffeine', ratio: 'glucose:fructose 1:0.8', kcal: 'about 100 kcal', src: 'Maurten, Gel 100 product page' },
  'sis-beta-fuel-gel': { texture: 'liquid gel', caf: 'not stated', ratio: 'maltodextrin:fructose 1:0.8', kcal: 'not stated', src: 'SiS, BETA Fuel Gel product page' },
  'pf-30-gel': { texture: 'designed to be less sticky, neutral "Original" flavor', caf: 'not stated', ratio: 'not stated', kcal: 'not stated', src: 'Precision Fuel & Hydration, PF 30 Gel page' },
};
const fcell = (p, k) => { const v = p.specs[k].value; if (k === 'ratio') return FEN[p.id].ratio; if (k === 'kcal') return FEN[p.id].kcal; if (k === 'texture') return FEN[p.id].texture; if (k === 'caffeineVersion') return FEN[p.id].caf; return v === 'non indicato' ? 'not stated' : f(v) + ' g'; };
const frow = (l, k) => `<tr><th>${l}</th>${FU.map((p) => `<td>${fcell(p, k)}</td>`).join('')}</tr>`;
page(U.fuel, IT.fuel, 'Carb gels: what the labels say', 'Maurten Gel 100, SiS BETA Fuel and PF 30 compared on manufacturer-declared data. Last checked 28/10/2026.',
  hero('WOLF PICKS · FUEL · GELS', 'Carb gels: what the labels say.', 'Three gels compared on manufacturer-declared data.') +
  `<div class="pk-scroll"><table class="pk-tbl"><thead><tr><th></th>${FU.map((p) => `<th>${esc(nm(p))}</th>`).join('')}</tr></thead><tbody>` +
  frow('Carbs per serving', 'carbsPerServingG') + frow('Ratio', 'ratio') + frow('Sachet weight', 'servingWeightG') + frow('Energy', 'kcal') + frow('Texture', 'texture') + frow('Caffeine version', 'caffeineVersion') +
  '<tr><th>List price</th>' + FU.map(() => '<td>not verified</td>').join('') + '</tbody></table></div>' +
  '<p class="pk-note">Manufacturer data, read on their pages on 28/10/2026. "Not stated": the page we read does not report it.</p>' +
  '<div class="pk-box"><h3>How to read them</h3><ul><li><b>Carbs per serving:</b> grams matter, not the number of gels. Reaching the same hourly intake takes more sachets with a 25 g gel than with a 40 g one.</li><li><b>Glucose and fructose ratio:</b> the two gels that declare it use 1:0.8. The ratio is about how carbohydrates are absorbed; the article below summarises a study on amounts.</li><li><b>Tolerance:</b> train with it before race day, same brand and same amount.</li></ul><p><a href="/en/articles/marathon-carbohydrates/">Carbohydrates in the marathon: what the studies say →</a></p></div>' +
  `<div class="pk-box"><h3>Sources</h3><ol>${FU.map((p) => `<li><a href="${p.sources[0].url}" rel="noopener">${esc(nm(p))}: ${esc(FEN[p.id].src)}</a></li>`).join('')}</ol><p class="pk-note">Last checked: 28 October 2026.</p></div>` + DISC + END);

const CY = JSON.parse(fs.readFileSync(path.join(root, 'content/catalog/cycling.json'), 'utf8'));
U.cyc = '/en/picks/bike-computers/'; IT.cyc = '/picks/ciclocomputer/';
const cv = (m, k) => (m[k] ? esc(m[k].en) : 'not verified');
const crow = (l, k) => `<tr><th>${l}</th>${CY.models.map((m) => `<td>${cv(m, k)}</td>`).join('')}</tr>`;
page(U.cyc, IT.cyc, 'GPS bike computers: how to choose', 'What to look at in a GPS bike computer and three models with declared specs, conditions included. Last checked 28/10/2026.',
  hero('WOLF PICKS · CYCLING · BIKE COMPUTERS', 'GPS bike computers: how to choose.', 'What to look at, and three models with declared specs. No ranking.') +
  '<div class="pk-box"><h3>What to look at</h3><ul><li><b>Navigation:</b> loaded route, turn-by-turn prompts, maps on the device or on the phone.</li><li><b>Battery:</b> each brand states hours under different conditions. Check the condition (screen, navigation, sensors) and leave margin for your longest ride.</li><li><b>Screen:</b> size, sunlight readability, use in rain or with gloves.</li><li><b>Compatibility:</b> sensors, electronic shifting, e-bikes, the apps you already use.</li><li><b>Memory and maps:</b> room for maps and smoothness.</li></ul></div>' +
  `<div class="pk-scroll"><table class="pk-tbl"><thead><tr><th></th>${CY.models.map((m) => `<th>${esc(m.name)}</th>`).join('')}</tr></thead><tbody>` +
  crow('Declared battery', 'battery') + crow('Screen', 'screen') + crow('Memory', 'memory') + crow('Water resistance', 'water') + crow('Weight', 'weight') +
  '<tr><th>List price</th>' + CY.models.map((m) => '<td>' + (CYP[m.id] || 'not verified') + '</td>').join('') + '</tbody></table></div>' +
  '<p class="pk-note">Data declared by manufacturers or reported by the reviews listed, read on 28/10/2026. "Not verified": we have not read the figure on a source. Battery hours from different brands are not comparable: conditions and tests differ. List price: price shown by the brand on its own site (garmin.com/it-IT, wahoofitness.com IT store), checked 28/10/2026, not retailer offers; "not verified" if not read on an official page.</p>' +
  '<div class="pk-box"><h3>Good to know</h3><ul><li>Edge 1060 came out on 20/10/2026: full reviews with battery tests may not exist yet.</li><li>No winner: choose on the ecosystem, shifting and screen you prefer.</li></ul></div>' +
  `<div class="pk-box"><h3>Sources</h3><ol>${CY.sources.map((x, i) => `<li><a href="${x.url}" rel="noopener">${esc(['Garmin, Edge 1060 specifications', 'Garmin Malaysia, Edge 1060 page', 'Wahoo, ELEMNT ROAM 3 product information', 'Hammerhead, Karoo specifications', 'Cyclist, Karoo 3 review', 'DC Rainmaker, Edge 1060 hands-on (20/10/2026)', 'Cycling Weekly, ELEMNT ROAM 3 review'][i])}</a></li>`).join('')}</ol><p class="pk-note">Last checked: 28 October 2026.</p></div>` + DISC + END);
page(U.hub, IT.hub, 'WOLF PICKS', 'Selections with sources, level of evidence and check date. Starting with training shoes and carb gels.',
  hero('WOLF PICKS', 'What to choose, and why.', '') +
  `<div class="pk-grid"><div class="pk-card"><h3>Guide</h3><ul><li><a href="${U.guide}">Training shoes: how to choose</a><small>Buying guide</small></li></ul></div><div class="pk-card"><h3>Comparison</h3><ul><li><a href="${U.cmp}">Evo SL, Novablast 6, Ghost 18</a><small>Independent lab measurements</small></li><li><a href="${U.fuel}">Carb gels</a><small>Manufacturer-declared data</small></li><li><a href="${U.cyc}">GPS bike computers</a><small>Declared specs, no ranking</small></li></ul></div><div class="pk-card"><h3>Shoe pages</h3><ul>${P.map((p) => `<li><a href="${pu(p)}">${esc(nm(p))}</a><small>SELECTED · checked 28/10/2026</small></li>`).join('')}</ul></div></div>` + DISC +
  '<p class="w-foot"><a class="w-cta" href="/en/methodology">How we evaluate <span aria-hidden="true">→</span></a></p>' + END);
const PI = [['Audience', 'Endurance, running, cycling, swimming, triathlon and strength athletes. No audience figures until they are measured.'], ['Research', 'Source-based analysis: studies, rules, official product pages.'], ['Testing', 'Field tests planned: results appear only when they exist.'], ['Content', 'Articles, comparisons and buying guides.'], ['Performance', 'Tools and calculators in Wolf Engine.'], ['Commerce', 'Declared affiliate links.']];
page('/en/partner/', IT.partner, 'Partner with WOLFLAB', 'WOLFLAB is an independent platform for endurance athletes. Declared collaborations, independent assessments.',
  hero('PARTNER WITH WOLFLAB', 'We work with brands that want to be compared.', 'WOLFLAB is an independent platform for endurance athletes. We pick the first partners to put through our analysis.') +
  '<ul class="w-list">' + PI.map((x, i) => `<li class="w-item"><a href="/en/contact/"><span class="w-num">0${i + 1}</span><span class="w-txt"><b>${x[0]}</b><small>${esc(x[1])}</small></span><span class="w-go">→</span></a></li>`).join('') + '</ul><div class="pk-box"><h3>Independence</h3><p>Editorial assessments stay independent. Sponsored content and affiliate links are always marked.</p></div><p class="w-foot"><a class="w-cta" href="mailto:luca@wolflabsystem.com">Partnerships: luca@wolflabsystem.com <span aria-hidden="true">→</span></a></p><p class="w-foot"><a class="w-cta" href="/en/contact/">Other contact <span aria-hidden="true">→</span></a></p>' + END);
const sp = path.join(root, 'sitemap.xml'); let sm = fs.readFileSync(sp, 'utf8');
for (const u of [U.cyc, U.hub, U.guide, U.cmp, U.fuel, '/en/partner/', ...P.map(pu)]) if (!sm.includes(SITE + u + '</loc>')) sm = sm.replace('</urlset>', `<url><loc>${SITE}${u}</loc></url>\n</urlset>`);
fs.writeFileSync(sp, sm);
console.log('picks EN: ' + (P.length + 5 + 1) + ' pagine');
