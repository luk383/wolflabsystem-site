// Applies the per-article review (content/article-review.json) to generated article pages. Idempotent.
// Values come only from a documentary review of the sources cited in each article. No field test is claimed.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const R = JSON.parse(fs.readFileSync(path.join(root, 'content/article-review.json'), 'utf8'));
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
const names = { 5: ['Alta', 'High'], 4: ['Moderata', 'Moderate'], 3: ['Limitata', 'Limited'], 2: ['Molto limitata', 'Very limited'], 1: ['Non provata', 'Unproven'] };
const TOOL = { 'ftp-e-zone-di-potenza': ['ride', 'zone di potenza', 'power zones'], 'carboidrati-maratona': ['fuel', 'Fuel', 'Fuel'], 'scarico-pre-gara': ['race', 'passaggi di gara', 'race splits'], 'quanta-intensita-serve': ['run', 'ritmi di allenamento', 'training paces'], 'bici-per-la-maratona': ['ride', 'zone di potenza', 'power zones'], 'forza-per-endurance': ['run', 'ritmi di allenamento', 'training paces'] };
let n = 0;
for (const [k, d] of Object.entries(R)) {
  const [it, en] = k.split('|');
  for (const [l, p] of [[0, `articoli/${it}/index.html`], [1, `en/articles/${en}/index.html`]]) {
    const f = path.join(root, p); if (!fs.existsSync(f)) continue;
    let h = fs.readFileSync(f, 'utf8'); if (h.includes('id="s-review"')) continue;
    const o = h;
    h = h.replace(/<div><dt>(Livello di prova|Evidence level)<\/dt><dd class="missing">[^<]*<\/dd><\/div>/, `<div><dt>${l ? 'Evidence level' : 'Livello di prova'}</dt><dd>${d.lv[l]}</dd></div>`);
    h = h.replace(/<div><dt>Wolf Confidence<\/dt><dd class="missing">[^<]*<\/dd><\/div>/, `<div><dt>Wolf Confidence</dt><dd>${stars(d.stars)} ${names[d.stars][l]}</dd></div>`);
    const tl = TOOL[it] ? `<p>${l ? 'Related tool' : 'Strumento correlato'}: <a href="${l ? '/en/engine' : '/engine'}#${TOOL[it][0]}">Wolf Engine, ${TOOL[it][l + 1]}</a>.</p>` : '';
    const sec = `<h2 id="s-review">${l ? 'How we reviewed it' : 'Come l\'abbiamo valutato'}</h2><p>${d.how[l]}</p><p><strong>${l ? 'Limits.' : 'Limiti.'}</strong> ${d.lim[l]}</p><p><strong>Wolf Confidence ${stars(d.stars)}.</strong> ${d.why[l]} ${l ? 'This is a documentary review (ANALYSIS). Wolf Lab has not tested this ourselves (no TEST, no VERDICT). Reviewed 28 October 2026.' : 'È una revisione documentale (ANALYSIS). Wolf Lab non l\'ha provato di persona (nessun TEST, nessun VERDICT). Rivisto il 28 ottobre 2026.'}</p>${tl}`;
    const fm = h.match(/<h2 id="(s\d+)">(Fonti|Sources)</); if (!fm) continue;
    h = h.replace(`<h2 id="${fm[1]}">`, sec + `<h2 id="${fm[1]}">`);
    h = h.replace(new RegExp(`(<li><a href="#${fm[1]}">)`), `<li><a href="#s-review">${l ? 'How we reviewed it' : 'Come l\'abbiamo valutato'}</a></li>$1`);
    if (h !== o) { fs.writeFileSync(f, h); n++; }
  }
}
console.log('reviewed', n);
