// Adds og:image, twitter card and JSON-LD (Organization/WebSite on home, Article on guides). Idempotent. Run last.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const SITE = 'https://wolflabsystem.com';
const IMG = SITE + '/assets/hero-kenya.jpg';
const walk = (d, o = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['.git', 'node_modules', 'content', 'tools', 'assets'].includes(e.name)) continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p, o) : e.name.endsWith('.html') && o.push(p); } return o; };
const j = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
let n = 0;
for (const f of walk(root)) {
  let h = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/.test(h) || !/<link rel="canonical"/.test(h) || h.includes('data-seo="1"')) continue;
  const canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const lang = /<html lang="en"/.test(h) ? 'en' : 'it';
  const title = ((h.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '');
  const desc = ((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const isArticle = /<aside class="art-side">/.test(h) && /<time datetime="/.test(h);
  const isHome = canon === SITE + '/' || canon === SITE + '/en/';
  let add = `<meta property="og:image" content="${IMG}" data-seo="1"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${IMG}">`;
  if (isArticle) {
    const hd = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
    const date = (h.match(/<time datetime="([^"]+)"/) || [])[1];
    add += j({ '@context': 'https://schema.org', '@type': 'Article', headline: hd || title, description: desc, datePublished: date, inLanguage: lang, mainEntityOfPage: canon, image: IMG, author: { '@type': 'Organization', name: 'Wolf Lab' }, publisher: { '@type': 'Organization', name: 'Wolf Lab', url: SITE + '/' } });
    h = h.replace(/<meta property="og:type" content="website"/, '<meta property="og:type" content="article"');
  }
  if (isHome) add += j({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'Wolf Lab', url: SITE + '/', logo: SITE + '/assets/favicon.svg' }, { '@type': 'WebSite', name: 'Wolf Lab', url: canon, inLanguage: lang }] });
  h = h.replace('</head>', add + '</head>');
  fs.writeFileSync(f, h); n++;
}
console.log('seo applied', n);
