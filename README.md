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
