// Protezione: le pagine committate non coincidono più con l'output di questo generatore
// (navigazione, home, hub, indici, asset). Un build completo le sovrascrive con una versione diversa da quella online.
// Per generare comunque (in una copia di lavoro, poi copiare solo i file necessari):
//   node tools/build.mjs --force-regenerate   oppure   WOLF_FORCE_REBUILD=1 node tools/build.mjs
// Poi: node tools/apply-redesign.mjs && node tools/version-assets.mjs
if (!process.argv.includes("--force-regenerate") && process.env.WOLF_FORCE_REBUILD !== "1") {
  console.error("Generazione bloccata: sovrascriverebbe il sito committato con pagine diverse da quelle online. Vedi tools/guard.mjs e README.");
  process.exit(1);
}
