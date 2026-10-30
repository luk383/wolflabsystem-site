// Aggiunge ?v=<hash> agli asset di brand e all'immagine og nelle pagine, per evitare cache vecchia. Idempotente. Eseguire per ultimo.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const root = path.resolve(import.meta.dirname, "..");
const h = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, f))).digest("hex").slice(0, 8);
const A = ["assets/brand/logo-on-dark.svg", "assets/brand/logo-on-light.svg", "assets/og-wolflab.png", "assets/site.css", "assets/site.js", "assets/run-hub.css", "assets/home-preview.css", "assets/home-a.css"].map((f) => [f, h(f)]);
let n = 0;
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === ".git" || e.name === "node_modules" || e.name === "assets") continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(html|xml)$/.test(e.name)) { let s = fs.readFileSync(p, "utf8"), o = s; for (const [f, v] of A) s = s.replace(new RegExp(f.replace(/[.\/]/g, "\\$&") + "(\\?v=[0-9a-f]+)?(?=[\"'\\s)])", "g"), `${f}?v=${v}`); if (s !== o) { fs.writeFileSync(p, s); n++; } } } };
walk(root); console.log("versioned assets in", n, "files");
