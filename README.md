# Wolf Lab — wolflabsystem.com

Sito di allenamento endurance basato sulle prove: corsa, bici, nutrizione e forza, in italiano (`/`) e inglese (`/en/`).

## Come funziona

Il sito è HTML statico: l'hosting serve i file così come sono, senza passaggi di build.
Le pagine si generano in locale con Node (nessuna dipendenza) e si committano.

```
node tools/build.mjs
```

## Struttura

- `content/articles/<nome>.it.html` e `<nome>.en.html` — un articolo per lingua. In cima c'è un blocco `<!--meta {...} -->` con `id` (uguale nelle due lingue), `slug`, `title`, `description`, `topic`, `minutes`, `date`.
- `tools/build.mjs` — modello delle pagine, testi fissi in IT/EN, generazione di indici, feed RSS, sitemap e reindirizzamenti dai vecchi indirizzi.
- `assets/` — stile, script dei calcolatori, logo.

## Gare e viaggi

- `content/races.json` — gare con data, quota, iscrizioni, logistica e fonte; `major: true` per le Abbott World Marathon Majors.
- `content/trips.json` — mete per training camp e viaggi.
- Aggiorna `verified` con la data dell'ultimo controllo sulle fonti.

## Aggiungere un articolo

1. Crea i due file in `content/articles/` con lo stesso `id`.
2. Struttura del corpo: riquadro "In breve", cosa dice la ricerca, cosa fare in pratica, fonti numerate.
3. `node tools/build.mjs`, controlla, committa.


## Wolf Engine
`node tools/build-engine.mjs` generates the hub pages (run, ride, train, fuel, race, gear), the engine page, methodology, the new home and `assets/explore-data.json`. The calculation model is in `assets/engine.js`, the UI in `assets/engine-ui.js`.

Build order (tools/build.mjs): base pages, library, news, Wolf Engine, then tools/normalize-legacy.mjs, which brings every older generated page (articles, races, trips, contact) to the Wolf v3 shell. Do not run the full build without reviewing the diff.


## Stile "rivista" (redesign del 30/10/2026)
Menu laterale, testata chiara in serif e solo tema chiaro vengono applicati da `node tools/apply-redesign.mjs` (idempotente, salta le pagine già convertite; usa `tools/redesign-templates.json` e `assets/home-preview.css`).
- Dopo aver generato nuove pagine (per esempio un articolo): copia solo i file necessari, poi `node tools/apply-redesign.mjs` e per ultimo `node tools/version-assets.mjs`.
- I generatori sono protetti da `tools/guard.mjs`: si rifiutano di girare senza `--force-regenerate` (o `WOLF_FORCE_REBUILD=1`), perché le pagine committate non coincidono più con il loro output (navigazione, home, hub, indici, hash asset) e un build completo le sostituirebbe con una versione diversa da quella online. Se serve generare, fallo in una copia di lavoro e copia solo i file necessari, poi `apply-redesign` e `version-assets`.
- Home e hub RUN sono stati rifiniti a mano e non vengono rigenerati da `apply-redesign.mjs`.

## Build completo (allineato al sito pubblicato)

`node tools/build.mjs --force-regenerate` ora riproduce il sito pubblicato: pagine generate, poi `tools/finalize.mjs` (pagine curate in `tools/overlay/`: home, hub RUN/RIDE/SWIM, gear, indici articoli, 404, Ask Wolf; più gli URL di sitemap delle sezioni costruite a parte in `tools/sitemap-extra.txt`), poi `apply-redesign` (barra, menu laterale, piè di pagina) e `node tools/version-assets.mjs`.
Differenze note e volute rispetto al pubblicato: elenco "Da leggere dopo" calcolato dal generatore (include gli articoli più recenti), meta social (og/twitter) presenti anche su novità e alcune guide, conteggio fonti corretto in "Forza per endurance".
Quando aggiungi un articolo, aggiorna anche l'indice in `tools/overlay/articoli/index.html` e `tools/overlay/en/articles/index.html` (il build avvisa se manca).
