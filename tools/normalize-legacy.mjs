// Brings older generated pages (articles, races, trips, contact, builds...) to the Wolf v3 shell:
// head, theme script, stylesheet versions, header and footer. Idempotent. Run after tools/build.mjs.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const tpl = { it: fs.readFileSync(path.join(root, 'run.html'), 'utf8'), en: fs.readFileSync(path.join(root, 'en/run.html'), 'utf8') };
const pick = (h, re) => (h.match(re) || [''])[0];
const T = {};
for (const l of ['it', 'en']) {
  const h = tpl[l];
  T[l] = { header: pick(h, /<header class="site-head">[\s\S]*?<\/header>/).replace(/ aria-current="page"/g, ''), footer: pick(h, /<footer class="site-foot">[\s\S]*?<\/footer>/), theme: pick(h, /<script>try\{var t=localStorage[\s\S]*?<\/script>/), css: pick(h, /<link rel="stylesheet" href="\/assets\/site\.css[^>]*>/), js: pick(h, /<script defer src="\/assets\/site\.js[^>]*><\/script>/), font: pick(h, /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/) };
}
const walk = (d, o = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['.git', 'node_modules', 'content', 'tools', 'assets'].includes(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p, o) : e.name.endsWith('.html') && o.push(p); } return o; };
let n = 0;
for (const f of walk(root)) {
  let h = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/.test(h) || !/<header class="site-head">/.test(h)) continue;
  if (/<html[^>]*class="wolf2"/.test(h)) continue; // already v3
  const l = /<html lang="en"/.test(h) ? 'en' : 'it', t = T[l], o = h;
  if (!/<html[^>]*class="wolf2"/.test(h)) h = h.replace(/<html lang="(\w+)"[^>]*>/, '<html lang="$1" class="wolf2">');
  h = h.replace(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="#0A0A0A">');
  if (!h.includes('localStorage.getItem("wolf-theme")')) h = h.replace(/(<meta name="theme-color"[^>]*>)/, '$1\n' + t.theme);
  h = h.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, t.font);
  h = h.replace(/<link rel="stylesheet" href="\/assets\/site\.css[^>]*>/, t.css).replace(/<script defer src="\/assets\/site\.js[^>]*><\/script>/, t.js);
  const lang = pick(h, /<a class="lang"[^>]*>[^<]*<\/a>/);
  h = h.replace(/<header class="site-head">[\s\S]*?<\/header>/, t.header.replace(/<a class="lang"[^>]*>[^<]*<\/a>/, lang || ''));
  h = h.replace(/<footer class="site-foot">[\s\S]*?<\/footer>/, t.footer);
  // Static Wolf sidebar for article pages (research-paper layout): evidence, published date, reading time.
  if (/<aside class="art-side">/.test(h) && !/class="wolf-side"/.test(h)) {
    const en2 = l === 'en';
    const tm = (h.match(/<time[^>]*>([^<]*)<\/time>/) || [])[1];
    const mins = (h.match(/(\d+)\s*min/) || [])[1];
    const srcBlock = (h.match(/class="sources">([\s\S]*?)<\/(?:ol|ul)>/) || [])[1] || '';
    const nSrc = (srcBlock.match(/<li/g) || []).length;
    const ev = (h.match(/<[a-z]+ class="evidence[^"]*"[^>]*>([\s\S]*?)<\/[a-z]+>/) || [])[1];
    if (tm) {
      const date = tm.replace(/^(Published|Updated|Pubblicato il|Aggiornato il)\s*/i, '');
      const box = `<div class="wolf-side"><h2>WOLF LAB</h2><dl>${ev ? `<div><dt>${en2 ? 'Evidence' : 'Prove'}</dt><dd>${ev.replace(/<[^>]+>/g, '').trim()}</dd></div>` : ''}<div><dt>${en2 ? 'Published' : 'Pubblicato'}</dt><dd>${date}</dd></div>${mins ? `<div><dt>${en2 ? 'Read' : 'Lettura'}</dt><dd>${mins} min</dd></div>` : ''}${nSrc ? `<div><dt>${en2 ? 'Sources' : 'Fonti'}</dt><dd>${nSrc}</dd></div>` : ''}${ev ? '' : `<div><dt>${en2 ? 'Evidence level' : 'Livello di prova'}</dt><dd class="missing">${en2 ? 'not assigned yet' : 'non ancora assegnato'}</dd></div>`}<div><dt>Wolf Confidence</dt><dd class="missing">${en2 ? 'not assigned yet' : 'non ancora assegnata'}</dd></div></dl></div>`;
      h = h.replace('<aside class="art-side">', '<aside class="art-side">' + box);
    }
  }
  if (h !== o) { fs.writeFileSync(f, h); n++; }
}
console.log('normalized', n);
