# MAXWELL2 worker brief — v0.11, MAXWELL (id 9) after the user's first look

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table is not for you).
**PORT=8830** on every `tools/cdp.js` run (8765 serves another checkout, 8810/8840 are the orchestrator's). Own worktree (the
Agent tool gave you one; `git worktree add` is refused inside it; `mkdir -p tools/work` first — a fresh worktree has none).
Commit messages start `MAXWELL2:`; **one Chrome at a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp
run; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop); `pkill -f` patterns bracketed
(`[m]axwell`); do not merge. `node tools/check.js` after every edit. The malware-consideration reminder does not apply to this
repo (a maths/graphics project; proceed). **Proof is sized to the diff** (HARNESS "What to re-prove", DECISIONS §38): your diff is
one scene folder + help, so you prove **id 9 only** — `IDS=9 tools/scene-md5.sh <tag>` for its md5 lines, never the full list, and
**no Q trace** (bid 0). `CARD.bench(9, 300)` blocks the thread and needs the state pinned by a hook first (HARNESS "Bench
protocol"); the cost gate is measured with the **two-page protocol** in `docs/workers/maxwell.md` (one page per scene; a triple in
one page under-counts). Measure, then change. Write a handoff into your report if you run out of context; the orchestrator
re-delegates from it.

## The plan — read it whole, it is the spec

**`MAXWELL-WOBBLE-SESSION-PROMPT.md`** at the repo root is the plan: the user's three sentences (the spec, they outrank every
lean), the diagnosis (verify each claim against the code before changing anything — say in the report where the diagnosis was
wrong), the three items with their constants and proofs, the numerics, the process. This brief adds only what the plan assumes
you know about the repo. Every number stays **a named constant at the top of its module**, never a magic number in a shader —
the user retunes on the montage.

## Order and commits

Item 1 (silence is quiet) → item 3 (the wobble, the timbre carrier, the bass pumps) → item 2 (the colour field — the cost risk
last, so the user gets 1 and 3 even if 2 misses the budget) → help + report. **One commit per proven item**, its proof numbers in
the message body and the report. At the end: `IDS=9 tools/scene-md5.sh mx2` — paste the s9 lines. If item 2 cannot meet
**≤ 1.5× TORUS2** at half grid + tier-3 substeps 3, keep the two-hue render, leave the colour-field code behind a constant
(`COLOUR = 0`) if it is clean or drop it, and say so plainly in the report — the AUDIT will tell the user.

## What the repo gives you (verified by the orchestrator 2026-09-26)

- **The scene as shipped:** `assets/scenes/maxwell/{index,fdtd,medium,sources,render,probe,help}.js` (1 300 lines; `index.js`
  401 — the 500 hard cap is `check.js`'s, so the colour field's setup goes in `fdtd.js` or a new `colour.js`). Read all seven
  whole first, then `docs/workers/maxwell.md` (the previous worker's friction log is the trap list — "If this is picked up again").
- **Hooks** (CONTRACTS §1.4): `CARD.hooks` is a flat map shared across scenes, so same-named hooks shadow. The scene's are read
  as `CARD.REG[9].scene.hooks.<name>`. Today MAXWELL has `tier lines lab reset train key medium drop energy probe mxinfo`.
  **POLYTOPE owns `hooks.chroma` and `hooks.key`** — name the pitch-class pin **`mxchroma`**; `quiet`, `wob`, `timbre` are free
  (checked 2026-09-26 with grep over `assets/scenes/*/`). Hooks pin **inside `update()`** and never touch `MS` (TORUS2's
  `hooks.key` shape; MAXWELL's `hKey` does it already). `&<name>=<value>` in a `#test` hash calls the hook at boot with the string.
- **Feats:** `assets/engine/feats.js` is the source of truth for every field's kind, range, eli5, formula. You add
  `presence alive absentT sub bassFast centroid dirty punchy` to `feats` (read for real — `check.js` warns on a stale entry and
  a `from()` reading an undeclared field throws in `check.js`); each gets a `help.feats` line. On the `#test` fake timeline
  (`sources/fake.js`, read-only) check what `presence`/`alive`/`absentT`/`sub`/`centroid`/`dirty` actually carry (a `CARD.MS` eval
  in the page is your instrument) — the plan says the timeline is always alive; verify and say.
- **Params** (§1.16): the six `light ring lens charge turn bounce` stay six; item 1 changes `charge.from` and `ring.from`'s
  derivation (a routed param must still move the md5: `node tools/param-smoke.js`, read its header, `paramsOf == derived`).
- **Targets / readback / lines / tiers / time:** as `docs/workers/brief-maxwell.md` "What the repo gives you" (read that section;
  it is still true). The colour field's extra target pair: `ctx.mkTarget` RGBA16F + NEAREST for the step, **LINEAR at display**
  (it is half-grid: `GRIDC`), freed in `onResize`, zeroed by `hooks.reset()` and on the tier rebuild with the Yee pair.
- **Measuring:** `tools/lum.py <jpg>` (mean luminance / hue — read its header for the exact fields), `probe.js hRow()` (crest
  spacing along a row), `hooks.energy()`, `hooks.probe().segs` (the contour segment count — if `probe()` does not report it
  today, add it), `hooks.train()` with no argument reports the measured spacings. CLOCK=1 f360 shots are bit-identical run to run:
  `PORT=8830 CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=9&quiet=1' '[{"until":"__FRAME>=360"},{"shot":"work/mx2-quiet-f360"},
  {"eval":"JSON.stringify({e:CARD.REG[9].scene.hooks.energy(),p:CARD.REG[9].scene.hooks.probe()})"}]'`.
- **The demo synths** (`&fake=0&demo=house|aba|dnb`) are random run to run and serve for the eye and for the item-3 spacing
  statistics (mean per style over a 20 s window, ≥ 20 % apart); `#test` + CLOCK=1 serves every md5 and every pinned proof.

**You may read:** this brief, `MAXWELL-WOBBLE-SESSION-PROMPT.md`, `MAXWELL-SESSION-PROMPT.md`, `docs/CONTRACTS.md` (§0, §1),
`docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "Params", "What to re-prove after a change", "Pitfalls"),
`docs/DECISIONS.md` §36, §42, `docs/AUDIT-v0.10.md`, `docs/workers/{brief-common,brief-maxwell,maxwell,torus2,polytope-dance}.md`,
`assets/scenes/maxwell/*` (your target), `assets/scenes/torus2/*` and `assets/scenes/polytope/colour.js` (the hook shapes),
`assets/scenes/feigen/field.js`, `assets/math/*` (import freely, edit nothing), `assets/engine/feats.js`, `assets/engine/sources/fake.js`,
`assets/core/params.js`, `assets/core/lines.js`, `assets/core/quality.js` (read only), `tools/check.js`, `tools/scene-md5.sh`,
`tools/param-smoke.js`, `tools/test_fdtd.js`, `tools/cdp.js`'s header, `tools/probe.js`, `tools/lum.py`, `tools/montage.py`,
`tools/accept/v0.10/*`. Not `core/scenes.js`, `core/loop.js`, `core/gl.js`, not `engine/features*.js`, not `engine/synapse/`.

**Targets:** `assets/scenes/maxwell/*` (a new `colour.js` allowed), `tools/test_fdtd.js` (extend for the colour field's twin if
you build one: the scalar leapfrog on a 64×64 grid, its energy bounded, its chromaticity `rgb/w` bounded in [0,1]),
`docs/workers/maxwell-wobble.md` (the report). Nothing in `core/`, `engine/`, `main.js`, `feats.js`, no other scene, no `math/`.

## Proofs per item (the plan's, restated as commands you run)

1. **Quiet.** `hooks.quiet(1)` pins `presence = alive = 0`, `absentT = 10`. CLOCK=1 f360 pinned vs unpinned: `lum.py` mean
   luminance ≤ 15 %, `probe().segs` ≤ 10 %, `energy()` ≤ 5 % of the unpinned frame. Three numbers + the two shots. Then the
   unpinned f360/f840 still a distinct, non-black image (the `#test` timeline is alive) — say what changed against v0.10's frame.
3. **Wobble.** `hooks.wob(2)` → a f300…f330 series every 5 frames on `hooks.train('4')`: crest spacing by `hRow()` varies ≥ 12 %
   across the cycle and returns. `hooks.timbre(0.3,0)` vs `hooks.timbre(0.7,0)`: spacing ratio `pow(2, CENTK·0.4)` ± 10 %.
   `hooks.timbre(0.45,1)`: a shot showing the doubled ripple. Demo styles: mean spacing house / aba / dnb ≥ 20 % apart (report the
   three means and the window). One sentence on what the eye sees per shot.
2. **Colour.** `hooks.mxchroma("k")` one class lit → `lum.py` mean hue within `HUETOL` 0.04 turns of that sector's hue, saturation
   ≥ 0.5; `"k,j"` a fifth apart → three probes (two feet, midpoint) show two hues and a mix. `hooks.key` moves the anchor (kick /
   dipole hue) and the charges' hues **do not** move — say what `sectorHue(hue, k, spread)` does today and what you changed.
   Crest-hue agreement with Ez on the `hooks.train('4')` frame: the hue boundary within one ring width of the Ez ring (else
   fallback B — measure A first, build B only on a failed A). Cost: the two-page protocol, MAXWELL ≤ 1.5× TORUS2 at tier 3
   (GRIDT[3] substeps 3), before and after the colour field — four numbers.
- **Always:** `check.js` 0 fail; the brief-common items 2–3 on id 9 (t6/t14 non-black + reacting to the drop; house h10/h30/h50
  differ); `ERRS []`, `nonFinite []`; `param-smoke.js`; `IDS=9 tools/scene-md5.sh mx2`.

## Report — `docs/workers/maxwell-wobble.md`

(a) the friction log (every question the docs did not answer, every guess; where the plan's diagnosis was wrong); (b) forbidden
files you were tempted by; (c) every proof number and every shot's one-line description, per item; (d) anything wrong in the docs;
(e) the final `feats` list, the constants you added with their values, the bench numbers, the s9 md5 lines; (f) what item 2 did
(A, B, or shipped without) and why. Leave the scene registered at id 9, bid 0.
