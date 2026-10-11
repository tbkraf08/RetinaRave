# Worker: POLYTOPE (v0.2 §8) — 2026-09-22

**Brief:** `brief-common.md` + `brief-polytope.md` + synapse2.html lines 1133–1148 / 1118 / 1207–1215 / 1585 /
985–1010 + `lines-smoke.js`; PORT 8775; own worktree. Model: opus. ~15 min, 51 tool calls.

**Outcome:** accepted, cherry-picked as-is. `index.js` 184 + `poly4.js` 218 lines; `check.js` 0 fail; ERRS/nonFinite
empty; frame-360 shots byte-identical across two runs (no `Math.random()`); house h10/h30/h50 three distinct frames
(24-cell ⊂ 120-cell · sparse amber tier-0 breakdown · flattened green cage); tier sweep same cast, 3 chords vs smooth
arcs; bench median 0.07–0.52 ms by cast/tier (worst: 120-cell at tier 2, 5.1 k segments). feats (16):
`flow flowBass flowMid flowHigh tension dropEnv kick hit lvl presence seed sectionEvt arc regularity clarity calm`;
post `{fb:{decay:.74}, bloom:{thr:.3}, kaleido:0}`; cuts 'continuous'; look = cast index.

**Friction (8) and fixes:** the synapse range stopped one line short of the projection → the worker derived that
samples must be renormalised onto S³ to bend (DECISIONS §8); line 1118 was `cyc3` not `signs` (wrote its own);
width formula under-specified → §1.12 wording; brief gain too low → ×1.8; `·presence` vs "muted audio idles" →
0.15 floor; near-plane pop on dropped `w ≤ 0` segments → depth fade; `this` inside `look.get/set` unstated → core now
calls them with the scene as `this` (§1.11); cap vs sub 8 on 1200 edges during a cross-fade → smaller sub table for the
600/120-cell. Doc errors: `CARD.glerr` undefined (HARNESS fixed), tier-sweep pin drifts (HARNESS fixed).
Temptations: TORUS's mvp/clip-z, `look.get` call site — neither opened.
