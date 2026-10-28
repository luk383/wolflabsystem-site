# Wolf Lab rebuild: status (updated 2026-10-28, no secrets)

## Done and verified live
- Architecture and nav: RUN RIDE TRAIN FUEL RACE GEAR + WOLF ENGINE CTA, IT and EN, hubs for each area.
- Wolf Engine: VDOT and paces, race splits, HR zones, power zones, fuel ranges, hybrid week (our own rule, declared). Sources listed in tools/build-engine.mjs.
- My Wolf: local profile in the browser, saved only on the Save button, deletable. No account, nothing sent.
- Methodology: evidence levels, Wolf Confidence, Wolf Score rules (no score published), NEWS > ANALYSIS > TEST > VERDICT (only NEWS published), method card template, AI use and image credits.
- Home: hero "RUN. RIDE. ONE ENGINE.", palette per brief, label "WOLF VISUAL / KENYA".
- Dark mode and toggle on all pages. All 100+ legacy pages (articles, races, trips, contact) normalized to the v3 shell by tools/normalize-legacy.mjs, hooked in tools/build.mjs.
- Library: methods with sport filter, nutrition, supplements, calculators, books. /biblioteca/ and /strumenti/ redirects kept.
- News with NEWS tag. Ask Wolf: declared rule-based guide, not AI.
- Articles: static Wolf sidebar (date, read time, source count, evidence level and Wolf Confidence shown as "not assigned yet").
- Races: "Course" row on all 27 pages. 24 have official-source data (see content/races.json fields course and courseSource), the other 3 (Florence, Sydney, Budapest) say "not yet verified". Filter "Course data" on /gare/ uses only this flag. NYC and Cape Town entries are qualitative (no figures read).

## Not done (real gaps)
- Wolf Score values, ANALYSIS/TEST/VERDICT content: need real tests. None exist.
- Research-paper article template is partial: no formal abstract, methods, per-article limits, evidence level or Wolf Confidence values (needs article-by-article review).
- Race filters for difficulty, elevation, temperature, hotel, transport; training camp database: data not verified for 16 races, none for climate, lodging, transport, camps. No filter built on empty data.
- Real AI for Ask Wolf: free Cloudflare Workers AI tier exists (10,000 Neurons/day, no training on content per Cloudflare docs) but hosting type and dashboard access are unverified (dashboard did not load in the cloud browser). Nothing activated.
- Logo: wolf mark draft at /wolf-mark (noindex), not in header, waits for owner choice.
- /32-engine (old prefixed upload address) still answers 200 live; no such file in the repo.

## Build
tools/build.mjs runs: base, engine, library, news, normalize-legacy, ask. Review the diff before committing a full build.
