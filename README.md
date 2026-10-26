# Wolf Lab — wolflabsystem.com

Sito di allenamento endurance basato sulle prove: corsa, bici, nutrizione e forza, in italiano (`/`) e inglese (`/en/`).

## Come funziona

Il sito è HTML statico: l'hosting serve i file così come sono, senza passaggi di build.
Le pagine si generano in locale con Node (nessuna dipendenza) e si committano.

```
node tools/build.mjs
```

## Struttura

- `content/articles/<nome>.it.html` e `<nome>.en.html` — un articolo per lingua. In cima c'è un blocco `<!--meta {...} -->` con `id` (uguale nelle due lingue), `slug`, `title`, `description`, `topic`, `evidence` (1–3), `minutes`, `date`.
- `tools/build.mjs` — modello delle pagine, testi fissi in IT/EN, generazione di indici, feed RSS, sitemap e reindirizzamenti dai vecchi indirizzi.
- `assets/` — stile, script dei calcolatori, logo.

## Aggiungere un articolo

1. Crea i due file in `content/articles/` con lo stesso `id`.
2. Struttura del corpo: riquadro "In breve", cosa dice la ricerca, cosa fare in pratica, fonti numerate.
3. `node tools/build.mjs`, controlla, committa.

Livello di prova: 3 = più revisioni o linee guida concordano; 2 = alcuni studi buoni o prove solide sul principio; 1 = pochi studi o esperienza degli allenatori.
