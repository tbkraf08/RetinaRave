# archive/ — what the engine no longer shows (DECISIONS §118, 2026-10-11)

This tree is FROZEN. Nothing in `assets/` imports it, `tools/check.js` does not walk it, `npm run build` does not bundle
it, and no reference list here gates anything. It is kept because the work is real and the code is readable, and because
one piece of it is still used as a test control.

The user, 2026-10-11:

> I never look at polytope, feigen, maxwell, gielis, chladni, key5-nav, key8-torus, key9-nav, and OK to archive

> instead of skipping holes, can we shift kept scenes down to fill the gaps? order: fluid, fluid2, nav2, dust, torus2, mandala

## The id map — old → new

| old id | scene | now |
| --- | --- | --- |
| 12 | FLUID | **0**, key `1` |
| 13 | FLUID2 | **1**, key `2` |
| 0 | NAV2 (the home) | **2**, key `3` |
| 1 | DUST | **3**, key `4` |
| 3 | TORUS2 | **4**, key `5` |
| 2 | MANDALA | **5**, key `6` |
| 5 | POLYTOPE | archived |
| 6 | FEIGEN | archived |
| 7 | TORUS (v1) | archived |
| 8 | NAV (the v0.33 control) | archived |
| 4 | DRUM (NAV's variant) | archived with NAV |
| 9 | MAXWELL | archived |
| 10 | GIELIS | archived |
| 11 | CHLADNI | archived |

`REG` is dense 0..5 now, so every scene has a number key again and `stepScene(±1)` — the `n` key, the right arrow and
the new left arrow (§118) — walks all six in both directions with no empty slot to land on. The director's HOME is still
NAV2 by NAME: `core/scenes.js register()` seats `SC.cur` / `SC.logical` / `SC.hist` on whichever scene declares
`home: true`, so a page load opens on NAV2 and not on the literal id 0 (which is FLUID now).

## How to cite an id in an old document

A `§N` or a line written before 2026-10-11 means the OLD ids; that is not an error to fix. When you quote an old number
in new prose, write it as "id 0 since §118 (12 at §106)" — the form the live docs use. `docs/DECISIONS-ARCHIVE.md`
(§0–§103) and every file under this tree are old by definition.

## What is here

- `scenes/` — the eight scene folders, byte-unchanged. They import `../../math/*.js`; `archive/math/` holds the three
  modules only they used (`nudge.js`, `gielis.js`, `chladni.js`) as real files and one-line re-export shims for the
  shared ones that are still live in `assets/math/`. So `import('./archive/scenes/<name>/index.js')` still works —
  `tools/test_nav2.js` depends on exactly that for its A/B control against `assets/scenes/nav2/`.
- `math/` — see above.
- `tools/` — the node tests only these scenes had (`test_polytope.js`, `test_feigen_ladder.js`, `test_fdtd.js`,
  `test_gielis.js`, `test_chladni.js`), `navkicks.js`, and `feigen-bench.sh` (still the worked example of the five bench
  rules in HARNESS "Bench protocol"). None of them were in `npm test`.
- `accept/` — the acceptance sweeps no live script reads: `v0.1`, `v0.4`, `v0.8`, `v0.8.1`, `v0.9` (POLYTOPE's
  references), `v0.10`, `v0.11`, `v0.12`, `v0.13`, `v0.14` (GIELIS's), `v0.15`, `v0.29`, `v0.31`, `v0.32`. The live
  sweeps stay in `tools/accept/`: `v0.2`, `v0.3`, `v0.5`, `v0.7`, `v0.34`, `v0.35`, `v0.36`, `v0.37`, `live-grid`.
  (`v0.27` was entirely untracked scratch and was deleted.)
- `docs/workers/` — the brief + report pairs for these scenes only. The `nav-*` worker docs stayed live: NAV2 is a
  byte-faithful clone of NAV, so its lineage still binds.
- `site/thumbs/` — the landing thumbnails of the archived scenes.

## Bringing one back

Move its folder to `assets/scenes/`, give it a free id (6 upward, or take a slot and renumber again), add the two lines
in `assets/main.js` (CONTRACTS §1.8), re-shoot its thumbnail (`tools/thumbs.sh`), and re-cut its lines in
`tools/accept/$ACC/scene-md5-*.txt`. If it imports one of `archive/math/`'s real modules, move that back to
`assets/math/` with it.
