// Applies the per-article review (content/article-review.json) to generated article pages. Idempotent.
// Values come only from a documentary review of the sources cited in each article. No field test is claimed.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const R = JSON.parse(fs.readFileSync(path.join(root, 'content/article-review.json'), 'utf8'));
const TOOL = { 'ftp-e-zone-di-potenza': ['f-ftp', 'zone di potenza', 'power zones'], 'carboidrati-maratona': ['f-duration', 'Fuel', 'Fuel'], 'scarico-pre-gara': ['f-goal', 'passaggi di gara', 'race splits'], 'quanta-intensita-serve': ['f-t5k', 'ritmi di allenamento', 'training paces'], 'bici-per-la-maratona': ['f-ftp', 'zone di potenza', 'power zones'], 'forza-per-endurance': ['f-t5k', 'ritmi di allenamento', 'training paces'] };
let n = 0;
for (const [k, d] of Object.entries(R)) {
  const [it, en] = k.split('|');
  for (const [l, p] of [[0, `articoli/${it}/index.html`], [1, `en/articles/${en}/index.html`]]) {
    const f = path.join(root, p); if (!fs.existsSync(f)) continue;
    let h = fs.readFileSync(f, 'utf8'); if (h.includes('id="s-review"')) continue;
    const o = h;
    h = h.replace(/<div><dt>(Livello di prova|Evidence level)<\/dt><dd class="missing">[^<]*<\/dd><\/div>/, `<div><dt>${l ? 'Evidence level' : 'Livello di prova'}</dt><dd>${d.lv[l]}</dd></div>`);
    const tl = TOOL[it] ? `<p>${l ? 'Related tool' : 'Strumento correlato'}: <a href="${l ? '/en/engine' : '/engine'}#${TOOL[it][0]}">Wolf Engine, ${TOOL[it][l + 1]}</a>.</p>` : '';
    const sec = `<h2 id="s-review">${l ? 'How we reviewed it' : 'Come l\'abbiamo valutato'}</h2><p>${d.how[l]}</p><p><strong>${l ? 'Limits.' : 'Limiti.'}</strong> ${d.lim[l]}</p>${tl}`;
    const fm = h.match(/<h2 id="(s\d+)">(Fonti|Sources)</); if (!fm) continue;
    h = h.replace(`<h2 id="${fm[1]}">`, sec + `<h2 id="${fm[1]}">`);
    h = h.replace(new RegExp(`(<li><a href="#${fm[1]}">)`), `<li><a href="#s-review">${l ? 'How we reviewed it' : 'Come l\'abbiamo valutato'}</a></li>$1`);
    if (h !== o) { fs.writeFileSync(f, h); n++; }
  }
}
console.log('reviewed', n);
