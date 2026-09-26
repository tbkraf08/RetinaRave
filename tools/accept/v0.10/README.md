# v0.10 acceptance — MAXWELL (id 9) + the `n` key

- `scene-md5-v010-skeleton.txt`: the full `tools/scene-md5.sh v0.10` list on the skeleton commit — s0–s8 byte-identical to
  `tools/accept/v0.9/scene-md5-v09.txt` (registering id 9 at bid 0 moved nothing; the `stepScene` move and the `n` key are
  core edits covered by the same list), s9 = the skeleton's black frame (496ce9a8… at f360 and f840). mixs 0→3 f178 md5
  f0c9d637… = accept.sh's recorded value.
- The `n` cycling proof (CLOCK=1, `{key:'n'}` ×9 from the director): `CARD.SC.forced` 1 2 3 4 5 6 7 8 9 0, `9` → 8, `0` → −1,
  ERRS [] — a press on ids without a card (7, 8, 9) no longer throws in `landing.js mark()` (a v0.8.1 bug the `n` run found:
  key `8`/`9` had the same TypeError).
- `scene-md5-v010.txt`: the v0.10 reference — s0–s8 = the skeleton list = v0.9, s9 re-based on the built scene (4e26a427 / 57bac88e,
  the worker's numbers reproduced on the merged tree with `IDS=9 tools/scene-md5.sh v0.10`).
- `headed-v010.txt`: `audit10.sh` on CyborgNinja + WhoLikesToParty (80 s each, tab capture, key `9` then `n`), `det10.py` on both
  (hooks.energy / train / probe every 2 s), and one same-page bench triple. `ab-q-v09-vs-v010.txt`: the headed q A/B, v0.9 tree vs
  HEAD, director only, first 24 s — both collapse to ~0 at the capture start tonight and climb at the same .004/s.
- Montages: `montage-maxwell.jpg` (house / aba / dnb rows; MAXWELL f360, f840 · TORUS2 f360, f840), `montage-maxwell-real.jpg`
  (the two real tracks at 20/40/60/80 s), `montage-maxwell-media.jpg` (the four media), `montage-maxwell-drop.jpg` (drop vs no drop
  at f360/f420), `montage-maxwell-worker.jpg` (key warm/cool, the syncopated train, the field lines, the bar series, house h10/h30/h50, t14).
