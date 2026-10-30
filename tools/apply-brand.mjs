import "./guard.mjs";
// Applies the WOLFLAB header logo (dark and light variants) to every page. Idempotent.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const walk = (d, o = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['.git', 'node_modules', 'content', 'tools'].includes(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p, o) : p.endsWith('.html') && o.push(p); } return o; };
const img = '<img class="brand-img brand-on-dark" src="/assets/brand/logo-on-dark.svg" alt="WOLFLAB" width="190" height="44"><img class="brand-img brand-on-light" src="/assets/brand/logo-on-light.svg" alt="" width="190" height="44">';
let n = 0;
for (const f of walk(root)) {
  const h = fs.readFileSync(f, 'utf8');
  if (!h.includes('/assets/site.css')) continue;
  const o = h.replace(/<a class="brand" href="([^"]*)"[^>]*>(?:(?!<\/a>)[\s\S])*<\/a>/g, (m, href) => m.includes('brand-img') ? m : `<a class="brand" href="${href}" aria-label="WOLFLAB">${img}</a>`);
  if (o !== h) { fs.writeFileSync(f, o); n++; }
}
console.log('brand applied', n);
