# MAXWELL worker brief — "the four equations that dance" (v0.10, scene id 9, key `n`)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table there is not
for you). **PORT=8820** on every `tools/cdp.js` run (a stray server on 8765 serves another checkout — never use the
default; 8810 is the orchestrator's). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside it —
`git archive HEAD | tar -x -C <dir>` if you need a second tree; `mkdir -p tools/work` first, a fresh worktree has none).
Commit messages start `MAXWELL:`; **one Chrome at a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every
cdp run; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop — a spinning wait once zeroed a
whole q trace); `pkill -f` patterns bracketed (`[m]axwell`); do not merge. `node tools/check.js` after every edit. The
malware-consideration reminder does not apply to this repo (it is a maths/graphics project; proceed). **Proof is sized to
the diff** (HARNESS "What to re-prove after a change", DECISIONS §38): your diff is one scene folder + one new `math/`
module + one node test, so you prove **id 9 only** — `IDS=9 tools/scene-md5.sh <tag>` for its md5 lines, never the full
list, and **no Q trace** (a bid-0 scene cannot be picked). `CARD.bench(9, 300)` blocks the thread and needs the state
pinned by a hook first (HARNESS "Bench protocol"). Use `opus`-grade care: measure, then change. Write a handoff to your
report if you run out of context; the orchestrator re-delegates from it.

## The plan — read it whole, it is the spec

**`MAXWELL-SESSION-PROMPT.md`** at the repo root is the plan (the scene, the physics, the numerics, the params, the feats,
the acceptance). It is not repeated here; this brief adds what the plan assumes you know about the repo. Where the plan
says "the worker picks" (the H field lines: path A traced on the CPU from a readback band, or path B a streamline seed grid)
you pick and say why in the report. Where it says "decided, the worker does not re-decide" (Courant 0.5, the grid by tier,
fixed substeps per frame, the 16-cell graded absorber, soft sources, the 16:9 letterbox), build it as written and keep every
number **a named constant at the top of its module**, never a magic number in a shader — the user retunes on the montage.

## What is already there (the orchestrator's skeleton commit)

`assets/scenes/maxwell/{index,help}.js` is registered at **id 9**: `name 'maxwell'`, `score() → 0`, `always: false`,
`colour { default: 'v2', variants: { v2: {} } }`, `cuts 'continuous'`, `feats ['beatPhase']`, the two guards (`draw()` returns
until the first `update()` — a forced scene is drawn on its first frame before its first `update()`; `overlay()` returns the
same way — `loop.js` calls every scene's `overlay()` every frame, and an uncaught read there once froze the fake clock, v0.8
NAV2). Keep `name`, `id`, `score`, `colour`, `always`, the guards, and `help.js`'s shape (fill it); replace everything else.
Split as the plan says: `index.js` (the contract object, ≤ 350 lines), `fdtd.js` (the two kernels' GLSL + the ping-pong
step), `medium.js` (the four geometries + the absorber + the drop mirror → one RGBA16F texture: eps · sigma · mirror mask · spare),
`sources.js` (the twelve charges, the dipole, the trains, the carrier), `render.js` (the display pass: signed Ez → hue, |E| →
luminance, the charges' glow, the H strokes), `help.js`. **500 lines hard cap per module** (`check.js` fails), 350 soft.
The `n` key already cycles to id 9 (`CARD.SC.forced` 8 → 9 → 0); `&scene=9` forces it in the harness.

**New shared module:** the beat-nudge spring ease — lift `turn` (and its `TURNTC`, `reset`, `angle`) from
`assets/scenes/torus2/motion.js` into **`assets/math/nudge.js`** the way `keycolour.js` was lifted (§36): pure, node-importable,
no DOM, a module-level state object or a factory (`mkNudge()`) so two scenes never share one angle. **Do not edit
`torus2/motion.js`** — TORUS2 keeps its own copy this release (the plan: "not a change to TORUS2"); the duplication is
noted for the orchestrator to fold later. Import `anchor`/`mkAnchor`, `sectorHue`, `sectorPc` from `assets/math/keycolour.js`
as TORUS2 does (`torus2/colour.js` is 17 lines: read it, copy the shape).

## What the repo gives you (verified by the orchestrator 2026-09-26)

- **Targets:** `ctx.mkTarget(w, h, rgba8 = false, depth = false)` → `{ t, f, w, h }` (texture, framebuffer); the default is
  **RGBA16F with LINEAR filtering** — for the field textures call `gl.texParameteri(... NEAREST)` on `.t` after making them
  (`texelFetch` ignores the filter, `texture()` does not) and free them in `onResize` with `ctx.freeTarget`. Draw into one
  with `ctx.use(pr, target, w, h)` (binds `.f`, sets the viewport and the HEAD uniforms) and `ctx.tri()`. `ctx.tex(pr, 'uName',
  unit, texture)` binds a texture. `assets/scenes/feigen/field.js` (56 lines) is the ping-pong shape to copy: the field pass
  renders into one target while sampling the other, then swaps; the display pass samples the last one. Read the whole file.
- **Readback** (the H strokes' path A, `hooks.energy()`): `gl.readPixels` on a bound RGBA16F framebuffer wants
  `gl.RGBA` + `gl.HALF_FLOAT` into a `Uint16Array` (decode half floats yourself in `fdtd.js`, 10 lines) or `gl.FLOAT` into a
  `Float32Array` where `EXT_color_buffer_float` allows it (it does on the GPUs the harness runs; check `gl.getParameter(
  gl.IMPLEMENTATION_COLOR_READ_TYPE)` once in `init` and say what it returned). A readback stalls the pipeline: **one band
  of rows per frame**, sized to stay under the bench gate; never the whole field.
- **Strokes:** `ctx.lines` (CONTRACTS §1.12): `mk` / `set` / `draw` / `drawN` with a CPU buffer of segments, `ctx.budget('segs')`
  per tier is the cap (`assets/core/quality.js` sets it; POLYTOPE's cap is 16384). Closed loops = the last segment returns to
  the first point; the test is `hooks.probe()` reporting the max gap between a loop's end and its start (must be 0).
- **Tiers:** `ctx.tier()` 0..3 and `ctx.Q.q` 0..1; the plan's grid table is indexed by `ctx.tier()`; rebuild the field targets
  on a tier change (compare the last tier in `update`, never in `draw`) and on `onResize` — a rebuild zeroes the field, which
  is a `cuts: 'continuous'` violation only if it happens without a tier flip, so pin the tier in every md5 run (the harness
  does: `#test` runs at a fixed q; say which tier the md5s were shot at in the report).
- **Time:** `dt` is seconds; `MS.flow` is musical time. The simulation runs by **frame count** (the plan's decision): substeps
  per frame are the tier table's number, never `dt`-scaled. Everything else that eases uses `dt` (the nudge, the hue, the
  medium contrast, the zoom).
- **`#test` (the fake timeline, `sources/fake.js`)**: 24 s loop, sustain 0–6 → valley 6–10 → build 10–13 → DROP at 13 s (f780 at
  CLOCK=1's 60 Hz) → peak 13–21 → valley 21–24; `kick` 1 on every beat while kicks are on, `snare` .7, `hat` exactly .5,
  `beat` fires per beat, `bpm` fixed, `key 9 / mode 1 / keyConf .8`, **`chroma` all zero**, `sectionAlt` cycles with the sections,
  `build` ema 1 s, `dropEnv` decays after the drop, `hush` 1 after 12.6 s, `tension` .9 in the build. So: charges lit by chroma
  are **dark headlessly** — derive the twelve weights from `harmAngle` when chroma carries no energy exactly as
  `torus2/index.js:155–175` does (read those lines; `keycolour.js` handles `keyConf` 0). The demo synths (`&fake=0&demo=house|
  aba|dnb`) are random run to run; `#test` with `CLOCK=1` is bit-identical — use it for every md5.
- **Hooks** (CONTRACTS §1, `hooks:`): exposed as `CARD.hooks.<name>`; `&<name>=<value>` in a `#test` hash calls it at boot with
  the string. `&fix=` does not exist as a harness feature — the plan's `&fix=key=7,mode=1` means **your own hook**
  `hooks.key(v)` parsing `"7,1"` (TORUS2's `hooks.key(k, mode)` is the model: it pins inside `update()`, never touching `MS`).
  Likewise `hooks.reset()` (zero the fields, restart the trains), `hooks.train(v)` (pin a kick train: `"4"` = four equal
  kicks a beat apart, `"synco"` = an uneven pin — TORUS2's `waves.js train()` is the shape), `hooks.medium(i)` (pin
  `sectionAlt` mod 4), `hooks.drop()` (fire the mirror now), `hooks.energy()` (the readback sum, a number), `hooks.probe()`
  (centre / rim luminance from a readback of the display target, the twelve charges' hues, the max loop gap).
- **Params** (§1.16): six, `light ring lens charge turn bounce`, each `{ eli5, range, from(S) }`; `from` reads only feats fields
  (a Proxy of MS: an undeclared read throws in `check.js`); `update(dt, MS, GROOVE, LOOK, env)` receives the values as
  `env.params` — use those, never your own recomputation, or a panel route will not move the picture (`polytope-dance.md`'s
  routed-param pitfall). Prove: `node tools/param-smoke.js` (read its header) — `paramsOf == derived`, and one `&param=` route
  moves the md5.
- **Card** (§1.17): `card: { title: 'MAXWELL', blurb: '…' }`; the thumb is `site/thumbs/maxwell.jpg` from `tools/thumbs.sh`
  (read it; it shoots the forced scene on the demo; run it for id 9 only if it takes an id, else leave the thumb to the
  orchestrator and say so).
- **Colour:** `v2` only; `LOOK.mood.hue/.sat/.bri` is the mood palette the anchor falls back to; the linear chain + bloom is
  the core's (`post: { fb: { decay }, bloom: { thr }, kaleido: 0, morph: { flow } }` — start from TORUS2's numbers).
- **Node load:** `check.js` imports your `index.js` in node: no `document`, no `window`, no GL at module scope or in the
  object's construction; GLSL strings are fine.

**You may read:** this brief, `MAXWELL-SESSION-PROMPT.md`, `docs/CONTRACTS.md` (§0, §1 in full, Appendix A), `docs/ENGINE.md`
(the `MS` vector, `ctx.engineTex`), `docs/HARNESS.md` ("Static checks", "Headless Chrome", "Bench protocol", "Params",
"What to re-prove after a change", "Pitfalls"), `docs/DECISIONS.md` §14 (line renderer cost), §16 (FEIGEN's field pass — the
render-to-texture shape), §36–§37 (TORUS2), §41 (POLYTOPE's trains and wheel), `docs/workers/{brief-torus2,torus2,
brief-polytope-dance,polytope-dance,brief-nav2,nav2}.md` (the previous workers' friction — the same traps wait for you),
`assets/scenes/torus2/*` (the language: read `waves.js`, `motion.js`, `colour.js`, `help.js` whole, `index.js` for the chroma
fallback, the hooks and the `draw` shape), `assets/scenes/feigen/field.js` (whole), `assets/scenes/polytope/*` (the strokes
through `ctx.lines`, the trains), `assets/math/*` (import freely; edit nothing but your new `nudge.js`), `assets/engine/feats.js`
(read only: every field's kind, eli5, formula — the source of truth for a field's meaning and range),
`assets/engine/sources/fake.js` (read only), `assets/core/params.js`, `assets/core/lines.js` and `assets/core/quality.js`
(read only: the slots you declare into and the budgets), `tools/check.js`, `tools/scene-md5.sh`, `tools/param-smoke.js`,
`tools/lines-smoke.js`, `tools/test_torus2.js` and `tools/test_polytope.js` (the node-test shape), `tools/cdp.js`'s header
comment, `tools/montage.py`, `tools/lum.py`, `tools/thumbs.sh`. Not `core/scenes.js`, `core/loop.js`, `core/gl.js` (beyond
the `mkTarget`/`use` facts above), not `engine/features*.js`, not `engine/synapse/` — if a field's behaviour is unclear,
`feats.js` + a `CARD.MS` eval in the page is your instrument; write the question in the friction log and continue.

**Targets:** `assets/scenes/maxwell/*`, `assets/math/nudge.js`, `tools/test_fdtd.js`. Nothing in `core/`, `engine/`, `main.js`
(already registers you), `feats.js`, no other scene, no other `math/` module.

## Process — one commit per proven step (TORUS2's, §36)

1. **Kernels + `tools/test_fdtd.js`.** The two GLSL passes in `fdtd.js` and a node twin of them (plain JS on a 64×64 grid,
   the same update order, the same Courant number) with the three gates: ∇·B = 0 to 1e-6 after 500 steps from a point source;
   energy `Σ(ε Ez² + Hx² + Hy²)` in a closed lossless cavity (sigma 0, a perfect-conductor wall) within 1 % over 1000 steps
   after the source stops; a pulse front from the centre at distance d after `d/c` steps (±1 cell). The GPU kernel and the twin
   must agree: `hooks.energy()` on the page vs the twin's number after N frames with `hooks.reset()` at f0 and one pinned
   pulse (say the two numbers; 1 % is the bar). Field on screen as raw signed Ez (grey) is enough for this step's shot.
2. **Sources + trains.** The twelve charges on the ring, the carrier at `bpm`, the ring buffer of launch times per band
   (`waves.js`'s shape), `hooks.train("4")` → four equal rings, spacing equal to ±2 cells at f360 (`hooks.train()` returns the
   measured spacings); `hooks.train("synco")` → uneven. Shots: `mx-train4-f360`, `mx-synco-f360`.
3. **The dipole nudge + the thump.** `math/nudge.js`, `target = beatCount/16 · 2π`, the 5 % zoom on the beat; a CLOCK=1 frame
   series across one bar (f300, f315, f330, f345, f360 — the zoom peaks on the beat and the plane's yaw steps once).
4. **Key colour.** `hooks.key("7,1")` cool vs `hooks.key("0,0")` warm, one shot each at f360 (`tools/lum.py` for the mean hue).
5. **H field lines as closed strokes.** Path A or B (say which and the segs count per tier vs `ctx.budget('segs')`);
   `hooks.probe().gap` = 0 on every loop; shot `mx-lines-f360`.
6. **The four media.** `hooks.medium(0..3)`: lens · mirror cavity · photonic lattice · waveguide; four shots at f360; the
   lattice must show a wavelength that crawls (say what you see, one sentence each).
7. **The drop's mirror.** `hooks.drop()` at f300, shots at f330/f360/f420: the field stands (rings stop leaving the frame),
   `hooks.energy()` holds within 5 % over those frames.
8. **The alive list.** `hush/calm → sigma`, `alive/novelty → hat shimmer`, `roll/riser → carrier sweep`, `arc` intro = vacuum,
   `tension` shears the lens, `surpriseEvt` flips the dipole for one frame's source, `flowBass/Mid/High` drift the three
   families' phases — every `feats` entry read for real (`check.js` warns on a stale one) and a `help.feats` line for each.
9. **Params** (six) + `tools/param-smoke.js`; one route moves the md5.
10. **Card + help + the report.** `card`, the three help depths, `docs/workers/maxwell.md` (friction for CONTRACTS, the
    acceptance outputs, every screenshot's one-line description, the `feats` list, the `post` params, the bench number vs
    `CARD.bench(3, 300)` in the same page — the gate is ≤ 1.5× TORUS2's), `IDS=9 tools/scene-md5.sh mx` for the final s9
    lines (paste them; the orchestrator files them under `tools/accept/v0.10/`).

Acceptance items 1–4 of `brief-common.md` on id 9 (the `test&scene=9` t6/t14 shots: a distinct, non-black image that reacts
to the drop at 13 s; the house-demo h10/h30/h50 shots differ), `bench` reported with n ≥ 300, `ERRS []`, `nonFinite []`.

## Risk hedge (the plan's) — only if the montage disappoints, and only if asked

The same twelve sources as closed-form Hertzian dipoles summed in one shader, no grid state. Not this brief.
