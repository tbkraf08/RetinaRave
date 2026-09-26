# v0.10 acceptance — MAXWELL (id 9) + the `n` key

- `scene-md5-v010-skeleton.txt`: the full `tools/scene-md5.sh v0.10` list on the skeleton commit — s0–s8 byte-identical to
  `tools/accept/v0.9/scene-md5-v09.txt` (registering id 9 at bid 0 moved nothing; the `stepScene` move and the `n` key are
  core edits covered by the same list), s9 = the skeleton's black frame (496ce9a8… at f360 and f840). mixs 0→3 f178 md5
  f0c9d637… = accept.sh's recorded value.
- The `n` cycling proof (CLOCK=1, `{key:'n'}` ×9 from the director): `CARD.SC.forced` 1 2 3 4 5 6 7 8 9 0, `9` → 8, `0` → −1,
  ERRS [] — a press on ids without a card (7, 8, 9) no longer throws in `landing.js mark()` (a v0.8.1 bug the `n` run found:
  key `8`/`9` had the same TypeError).
- `scene-md5-v010.txt` (the list with s9 re-based on the built scene) lands at the merge.
