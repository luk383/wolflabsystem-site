// Passo finale del build: pagine curate a mano (tools/overlay) e voci di sitemap delle sezioni costruite a parte.
// Le pagine in tools/overlay sono la versione pubblicata di home, hub RUN/RIDE/SWIM, gear, indici articoli, 404 e Ask Wolf:
// se cambi una di queste, modifica il file in tools/overlay (non solo quello nella radice) o il build lo riporta com'era.
import fs from "node:fs"; import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const OV = path.join(import.meta.dirname, "overlay");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let n = 0;
for (const f of walk(OV)) { const rel = path.relative(OV, f); const t = path.join(root, rel); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(f, t); n++; }
// sitemap: unisce gli URL costruiti dagli script di sezione (tools/sitemap-extra.txt) a quelli generati
const sp = path.join(root, "sitemap.xml"); let sm = fs.readFileSync(sp, "utf8");
const extra = fs.readFileSync(path.join(import.meta.dirname, "sitemap-extra.txt"), "utf8").split("\n").filter(Boolean);
const add = extra.filter((u) => !sm.includes(`<loc>${u}</loc>`));
if (add.length) sm = sm.replace("</urlset>", add.map((u) => `<url><loc>${u}</loc></url>`).join("\n") + "\n</urlset>");
fs.writeFileSync(sp, sm);
// avviso: articoli presenti nel sito ma assenti dall'indice curato
for (const [idx, base] of [["articoli/index.html", "/articoli/"], ["en/articles/index.html", "/en/articles/"]]) {
  const h = fs.readFileSync(path.join(OV, idx), "utf8"); const dir = path.join(root, base.slice(1));
  const miss = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && !h.includes(`href="${base}${e.name}/"`)).map((e) => e.name);
  if (miss.length) console.warn(`ATTENZIONE: ${idx} (overlay) non elenca: ${miss.join(", ")}`);
}
console.log(`overlay ${n} pagine, sitemap +${add.length} URL`);
