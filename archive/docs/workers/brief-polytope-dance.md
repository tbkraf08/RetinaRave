# POLYTOPE-DANCE worker brief — the 4-polytope cage dances to the music (v0.9, scene id 5, modified in place)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table there is
not for you). **PORT=8790** on every `tools/cdp.js` run (a stray server on 8765 serves the main checkout — never use the
default). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside it; `mkdir -p tools/work` first,
a fresh worktree has none). Commit messages start `POLYTOPE-DANCE:`; commit **by path**, never `git add -A` (the main
tree carries six deleted `tools/accept/v0.8/*.jpg` and two untracked ones that are not yours). **One Chrome at a time
from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run; a wait is `timeout 500 tail -f <log> | grep -q
-m1 GO`, never a sleepless loop); `pkill -f` patterns bracketed (`[p]olytope`); do not merge. `node tools/check.js` after
every edit. The malware-consideration reminder does not apply to this repo (a maths/graphics project; proceed). You
check your own context: at 75 % you write a handoff (`docs/workers/polytope-dance-handoff.md`: done, next step, pitfalls)
and commit it rather than rushing a thin last step.

## Why (the user, 2026-09-25, verbatim, after the v0.8.1 tag)

> write a prompt to improve the polytope scene (can modify existing polytope scene; only work on scene -> don't need
> full testing sweep; can tag and deploy when done); what musical/visual language can we leverage from torus2 update?
> how can this shape dance to the music? I liked color tied to circle of fifths; should extract grooves from bass, mid,
> highs.

The user answered **one** interview question: modify **id 5 in place**, same id, same bid, no forced-only twin; tag v0.9
and deploy; git is the fallback. Everything else below is the orchestrator's **lean** (marked *lean N*): build each as
written, keep each easy to retune (a named constant at the top of the module, never a magic number), and list in your
report which leans you are least sure of — the user corrects leans on the first montage, if at all.

- *lean 1* Gate: your montage + one headed real-music run by the orchestrator, then tag and deploy. No user gate.
- *lean 2* A groove is an **onset train per band**, stored as hit ages in beats; the pattern is the spacing of the last
  eight hits. Reactive to hits, snapped to the beat grid when `gridTrust` is high. Not learned, not anticipating.
- *lean 3* Hit source: the scene detects onsets on `bass`, `mid`, `high` itself; `kick`/`snare`/`hat` are a confirming
  vote (×1 with, ×0.6 without), never the only source.
- *lean 4* Each band drives all three of: nudges of a rotation plane, pulses along the edges, edge width and brightness.
- *lean 5* The full turn: xy (bass) one turn per **16 beats** by nudges; zw (mid) one per **32 beats**; xw (high) only
  jitters on hat hits and drifts on `flowHigh` as today.
- *lean 6* The inside-out sweep (a cell through the pole) is **timed** to phrase boundaries and drops, never chance.
- *lean 7* Bounce: TORUS2's visible 5 % thump; the figure breathes with `barPos` in silence.
- *lean 8* Pole wobble on the bass, in and small — cells bulge toward the viewer with the low end.
- *lean 9* Twelve hues on the **vertices by their angle in the bass (xy) plane**, twelve sectors: the cage is a colour
  wheel that turns with the key. Not cells-as-pitch-classes (a geometry job for another session).
- *lean 10* Chroma lights the sounding notes: the sector of a sounding pitch class brightens.
- *lean 11* Share TORUS2's key-colour code by moving the anchor math to `assets/math/keycolour.js`, both scenes
  importing it, TORUS2's md5s proven unmoved.
- *lean 12* No filled faces; strokes only, width pulses do the work.
- *lean 13* Intensity **visible** — nudges and pulses readable at arm's length, not TORUS2-subtle.

## Targets

`assets/scenes/polytope/` (`index.js` 208 lines, `poly4.js` 227 — split into `index.js` / `poly4.js` / `grooves.js` /
`dance.js` / `colour.js` as needed; **500 lines hard cap per module**, 350 soft), plus the new `assets/math/keycolour.js`
(pure, must load in node — `check.js` imports it), plus a one-line import change in `assets/scenes/torus2/colour.js` (it
re-exports from `math/keycolour.js`; its behaviour and its md5s do not move). Optionally `tools/test_polytope.js` (node,
no DOM) for the onset detector and the train arithmetic. **Nothing else:** not `core/`, `engine/`, `main.js`,
`feats.js`, another scene's folder beyond that one TORUS2 import line, not `accept.sh` (the orchestrator writes the
"== polytope" section), not the docs outside `docs/workers/polytope-dance.md`.

**You may read:** this brief, `docs/CONTRACTS.md` (§0, §1 in full — §1.1 ctx, §1.4 colour slot, §1.9 cuts, §1.12 lines
**path A** (yours) and path B, §1.13 help.feats, §1.15 routed views, **§1.16 params**, §1.17 card, Appendix A),
`docs/ENGINE.md` (the `MS` vector), `docs/HARNESS.md` ("Static checks", "Headless Chrome", "Bench protocol", "Q trace",
"Real window", "Params", "Pitfalls"), `docs/DECISIONS.md` **§8** (POLYTOPE: the geometry, the pole gate, the cast by
section seed), §7 (strokes: depth + 'over'), §14 (0.4 µs/segment), §29 (params as built), **§36** (TORUS2 — the musical
language you port, and the harness friction it hit), §37–§40, `docs/workers/{brief-polytope,polytope,brief-polytope-pole,
polytope-pole,brief-torus2,torus2}.md` (the previous workers' friction — the same traps wait for you),
`assets/scenes/polytope/*` (yours), `assets/scenes/torus2/{colour,waves,motion,index}.js` (the three modules whose ideas
you port; `index.js` 328–340 for the six params, 127 for its feats, 155–175 for the `harmAngle`-derived chroma on `#test`),
`assets/math/*.js`, `assets/engine/feats.js` (read only: every field's kind, eli5, formula, range — the source of truth;
`node tools/feats-doc.js` prints it), `assets/core/params.js` and `assets/core/route.js` (read only), `tools/check.js`,
`tools/scene-md5.sh`, `tools/param-smoke.js`, `tools/cdp.js`'s header comment, `tools/montage.py`, `tools/test_torus2.js`
(the shape of a node test). Not `core/scenes.js`, not `engine/features*.js`, not `engine/synapse/`, not `fake.js` — if a
field's behaviour is unclear, `feats.js` + a `CARD.MS` eval in the page is your instrument; write the question in the
friction log and continue.

## The geometry stays (§8 is geometry, not taste)

The four regular 4-polytopes on S³, the SO(4) double rotation (xy angle `a1`, zw angle `a2`, xw angle `a3`), stereographic
projection from (0,0,0,1), edges subdivided **on the sphere** so every piece is a circular arc, the cast by section seed
with its one-second cross-fade, `ctx.lines` path A (CPU segments, a colour and a width per emitted segment), the pole gate
(`den > 0.16`, ramp `(den − 0.16)·3.5`) and the depth fade in `poly4.js`'s `emit`, the camera orbit on `flow`, the hashed
tension shake. What changes is *what moves it* and *what colours it*. Today's `update` is the whole music mapping —
`a1 = 0.1·flowBass`, `a2 = 0.14·flowMid`, `a3 = 0.04·flowHigh`, `g` from tension/dropEnv/kick, two palette coordinates
`ta` 0.15 / 0.55 for inner/outer — and that is what you replace.

## The spec — what POLYTOPE must do after this session

1. **Grooves from the three bands** (`grooves.js`, the port of `torus2/waves.js`). Per band `{bass, mid, high}`: an onset
   detector on the band level — a rise over a ~0.4 s EMA of that band above a per-band threshold (named constants
   `THR_BASS/MID/HIGH`), refractory one 16th at `bpm` (`15/bpm` s), amplitude = the rise (clamped to 1), ×1 if the
   matching drum detector (`kick` for bass, `snare` for mid, `hat` for high) fired within ±1 frame else ×0.6 — then a
   ring buffer of the last **8 launches per band as ages in beats** (`beatCount + beatPhase` at launch — musical time, no
   wall clock, so a set never drifts), the launch beat snapped to the nearest 16th (`round(4·b)/4`) when `gridTrust > .5`.
   Every consumer below reads these three trains. `beat` may launch a faint bass-train entry (amp ~0.25) when no band hit
   came in the last bar, so a drumless track still breathes. **The `#test` fake timeline sets `hat` to exactly 0.5 and
   fills `kick/snare/hat`, `key 9 / mode 1 / keyConf .8`; only `chroma` is zero** (§36 friction) — a strict `> 0.5`
   threshold never fires on hat there. Hooks: `hooks.train('4x4' | 'sync' | null)` pins the bass train to a fixed
   pattern on the fake clock (TORUS2's `PAT`) with the detectors off; `hooks.info()` returns JSON with the positions of
   each band's live bumps along an edge (`(age/4) mod 1`, sorted, 4 decimals) exactly as TORUS2's does, **plus per band**
   `n` (launches since load), `last` `{beat, amp, drum}` (the last launch and whether its drum vote fired), `ema` (the band's
   current EMA) and `thr` — the orchestrator's real-music trace reads these every 2 s to judge a dead or saturated train.
   *Acceptance:* the 4x4 pin shows **four evenly spaced bumps per edge** at f360 (gaps 0.25 ± 0.03 from `hooks.info`,
   de-duplicated — a bump a bar old sits where a new one launches) and the sync pin shows uneven spacing.
2. **Dance — the rotation planes nudge to the grooves** (`dance.js`, the port of `torus2/motion.js`'s `turn`).
   (a) **xy (bass):** target angle = `(beatCount/16)·2π` (read off the count, never integrated), the angle eases to it
   with a ~0.3 s time constant the short way round (TORUS2's `turn`), **plus** an impulse per bass-train hit: a
   critically-damped kick (`x'' + 2ω x' + ω² x = 0`, ω ~ 12 s⁻¹, velocity set to `KICK_XY · amp` at the hit) that
   overshoots and settles to zero net, so the groove is visible in the turn and the 16-beat lock holds.
   (b) **zw (mid):** the same with `(beatCount/32)·2π` and the mid train, its own `KICK_ZW`.
   (c) **xw (high):** today's `0.04·flowHigh` drift plus a small impulse per high-train hit (`KICK_XW`), bounded so that
   nothing crosses the pole gate on hats alone (see 3).
   `hush`/`calm` double the time constants (`slow = max(hush, calm)`). Keep the camera orbit on `flow`.
   (d) **Bounce:** `1 + BOUNCE·max(0, cos(2π·beatPhase))⁴` on the figure scale `p.g`, `BOUNCE` 0.05 — a thump, not a sine.
   (e) **Breath:** a ±2 % scale on `barPos` (`barPos` is **0..4 in beats**, ENGINE.md — `sin(2π·barPos/4)`), so silence
   still moves.
   (f) **Pole wobble:** an extra xw angle `≤ WOBBLE·bass`, `WOBBLE` 0.12 rad, eased ~0.2 s, that carries the near cells
   toward the pole so they bulge toward the viewer with the low end; bound the *sum* of (c) + (f) so no vertex passes the
   `den` gate on level alone (compute the margin from the vertex nearest the pole after the xy/zw rotation; clamp).
   *Acceptance:* a CLOCK=1 frame series across one bar on `test&fake=0&demo=house&scene=5` (every 8 frames from the bar
   start, a small table in the report: frame · beatCount+beatPhase · xy angle · its target · bounce) shows the xy angle
   advancing 1/16 of a turn per beat with an overshoot at each bass hit, and the bounce peaking at `beatPhase` 0.
   `hooks.motion()` returns the current `{a1, a1T, a2, a2T, a3, bounce, wobble}` as JSON for that table.
3. **The inside-out sweep, on cue.** On a phrase boundary (`phrase16Pos` wrap, i.e. it decreased since last frame, or
   `sectionEvt`) and on `dropEvt`, drive a deterministic xw rotation over **one beat** (`60/bpm` s, eased in and out)
   that carries **one vertex through the pole** — the cell blows up, fades through the existing gate, and the cage turns
   inside out — then let the plane settle back into its lock. Choose the vertex nearest the pole at the cue so the sweep
   is always the shortest move that crosses; the sweep is the only thing that may take a vertex past the gate (the bounds
   of 2c + 2f keep every vertex off it between cues). Pinned off while `arc` is `'idle'` (the enum is
   `idle|valley|sustain|build|peak`; there is no `'intro'`). No sweep more than once per 4 beats (`SWEEP_MIN` beats).
   `hooks.sweep()` fires one now on the fake clock; the `sweep` param (0–1, spec 7) is its progress.
   *Acceptance:* a CLOCK=1 series of five shots across a pinned sweep (`hooks.sweep()` at f300, shots f300 f315 f330 f345
   f360 — the cell inflating, the inside-out) and a shot 4 s after the sweep's end identical in *structure* (same cast,
   same lock) to one 4 s before it — say in words what the eye sees in each.
4. **Pulses along the edges** (the visible groove; the port of TORUS2's wave sum, on the CPU). Each edge piece already has
   a parameter `t ∈ [0,1)` along the edge from the subdivision. Each train paints a brightness (and width) bump wherever a
   hit's age lands — travelling **one edge length per bar** (`t = (age/4) mod 1`) and fading over ~2 bars (`LIFE` 8
   beats): bass → a wide slow bump on every edge (width σ ~0.18 of the edge), mid → a sharper pulse (σ ~0.08) on the
   *outer* figure's edges only, high → tiny fast ripples everywhere (σ ~0.04, amplitude small). Path A gives a colour and
   a width per emitted segment, so this is a per-piece multiplier inside `emit` (pass the three trains' ages/amps in `o`;
   ~7 k pieces × 24 slots of Gaussians is cheap but measure it — if the bench says otherwise, precompute a 64-entry
   profile per band per frame and index it by `t`). The amplitude of the whole thing is the `groove` param (spec 7),
   `GROOVE0` ~0.8 (*lean 13*: visible). Because launches are hits and the speed is fixed, the rhythm becomes the spacing
   of the bumps along every edge.
   *Acceptance:* the two pinned-train shots of spec 1 read as geometry: four bumps per edge on 4x4, uneven on sync; one
   house shot at 30 s with the bumps visible on the outer cage.
5. **Colour from the key, on the circle of fifths** (`colour.js` in your folder + `assets/math/keycolour.js`).
   Move the anchor math out of `torus2/colour.js` into `assets/math/keycolour.js` — the constants `WARM COOL PULL SATMAJ
   SATMIN VALW HUETC KEYC0 KEYC1`, `wrap`, and an `anchor(...)` that carries **its own state object** (so two scenes do
   not share `hueU`: `mkAnchor()` returns `{OUT, reset, anchor}` or `anchor(state, dt, …)` — your call, document it) —
   and make `torus2/colour.js` a thin re-export that keeps TORUS2's behaviour bit-identical: **`IDS=3 tools/scene-md5.sh`
   must equal the s3 lines of `tools/accept/v0.8/scene-md5-v08.txt` (`7189a6ba…` f360, `48113eda…` f840), two runs.**
   In POLYTOPE: each vertex gets a **sector** = its angle in the xy plane *after* the double rotation
   (`atan2(y, x)`), quantised to twelve; sector k is pitch class `(7k) mod 12` on the wheel;
   `hue_k = hueAnchor + k·spread/12` with the same `spread` the mood gives (TORUS2 narrowed it to 0.30–0.75 centred on
   the anchor — do the same), so the cage is a colour wheel that turns with the key and rolls with the bass nudges. An
   edge piece takes the hue of its nearer vertex (or lerps between its two vertices' hues the short way — say which).
   **Chroma** lights the sounding notes: sector brightness `= floor + (1 − floor)·chroma[pc]`, floor = the `glow`
   param (~0.35), eased ~0.15 s, so a chord glows and a melody walks round the wheel. **On `#test` every chroma bin is 0:**
   derive a chroma from `harmAngle` while `max(chroma) < 0.02` exactly as TORUS2's `index.js` 155–175 does, so the
   headless montage has notes to light and the md5s are deterministic. Major = warm, minor = cool through the shared
   PULL. The inner/outer split (`ta` 0.15 / 0.55) becomes inner = the anchor wheel, outer = the same wheel offset by a
   fifth (one twelfth), so the two figures are related keys. Colour slot: `v2` default; no OKLCH variant. Keep today's
   brightness law (`GAIN·0.75·(0.35 + lvl)·(0.15 + 0.85·presence)`, `v = 0.55 + 0.45·bri`) as the overall multiplier.
   Hooks: `hooks.key(k, m)` pins key/mode (two arguments — reached through `CARD.REG[5].scene.hooks.key(0,0)` in an eval,
   `CARD.hooks` is a flat map and same-named hooks shadow); `hooks.chroma([...12])` pins the chroma vector (`null` releases).
   *Acceptance:* `hooks.key(0,0)` vs `hooks.key(7,1)` side by side at f360 (warm vs cool, the wheel rotated a twelfth), a
   pinned C major triad `hooks.chroma([1,0,0,0,1,0,0,1,0,0,0,0])` lighting three sectors with the rest at the floor.
6. **Growth with the build, staged (TORUS2's):** `build` 0→0.5 raises the edge subdivision toward the tier's maximum
   (`SUB[3]`/`SUBB[3]`, the arcs get rounder — ease it, a subdivision step is a discontinuity, cross-fade or ease over
   ~1 s), 0.5→1 raises `p.g` toward a cap that never crops in portrait (the short edge binds; v0.6's phone is 390×844);
   `intensity`/`arousal` set the resting size; the drop keeps today's 60 % swell. `tension` keeps its shrink and its
   hashed camera shake. The segment cap `CAP` 16384 holds (check the worst case: the 120-cell at `SUBB[3]` during a cast
   cross-fade — clamp the subdivision if it would overflow, and say so).
7. **Params (CONTRACTS §1.16), six, named for the eye, `from(MS)` moved verbatim from the mapping, reading only fields
   in `feats`, pure:** `turn` (the xy target, rad, `[0, 2π]`), `bounce` (0–0.1), `size` (0.5–1.2, the resting `p.g`),
   `groove` (0–1, the pulse amplitude), `glow` (0–0.6, the sector floor), `sweep` (0–1, the inside-out progress — its
   `from` is the state-free part; write `a · (cond ? 0 : 1)` not a short-circuit, `paramDeps` misses a field behind one).
   Read them as `env.params.<name>` in `update()`. *Acceptance:* `CARD.paramsOf('polytope')` at f360 = finite numbers in
   range, `CARD.paramDeps('polytope', p)` per parameter listed in the report, `paramsOf == derived` (identity: the s5 md5
   with no route = the s5 md5 you report), and one route moves the md5 (`&param=polytope.groove=c:0` vs none at f360).
8. **`feats`:** today's list (`flow flowBass flowMid flowHigh tension dropEnv kick hit lvl presence seed sectionEvt arc
   regularity clarity calm`) plus `bass mid high sub snare hat key mode keyConf chroma harmAngle valence beat beatCount
   beatPhase barPos phrase16Pos build intensity arousal gridTrust dropEvt hush bpm`. **Every field in `feats` is read,
   every field has a `help.feats` line** (the score-only fields keep their `the bid:` prefix); drop from the list any
   field you end up not reading (`check.js` fails on a gap, warns on a phantom). `help.eli5/why/math` re-read so they
   still describe the scene — the "music sets the two turning speeds" sentence is now wrong; the nudge, the wheel and the
   sweep go in; `math` keeps the polytope counts and the projection. `tag` one line. `hud()` one line (label, segs, the
   key as `9m`/`0M`, live bumps per band, xy angle, sweep progress). `card.blurb` (§1.17) stays unless the picture changes
   character — if you change it, say why.

## Non-negotiables (README, CONTRACTS §0) and the traps the previous workers hit

- No `Math.random()`, no wall clock (`performance.now`, `Date`) — musical time only (`flow`, `beatCount + beatPhase`).
  A constant is a named manual setting at the top of the module. `'nav'` never appears in what you write. Scenes import
  nothing from `core/` or `engine/` and nothing from another scene — shared code goes to `assets/math/` and must load in
  node. Module cap 500 lines. `node tools/check.js` 0 fail after every edit (no new warning except a soft line-cap one);
  `npm test` unchanged.
- **Only the s5 md5s move.** Nothing here registers, re-orders or re-bids a scene: `score()` stays verbatim
  (`arc === 'build' ? 0 : 0.2 + 0.4·regularity + 0.3·clarity + 0.2·calm`), `id: 5`, `name: 'polytope'`, `cuts:
  'continuous'`, `colour`, `card`, `look` (the cast index) all stay. Prove at the end: `tools/scene-md5.sh pd` → ids 0–4 and
  6–8 identical to `tools/accept/v0.8/scene-md5-v08.txt`; your s5 f360/f840 md5s stable across two runs (write them in the
  report — they become the v0.9 reference). `git diff --stat -- assets/core assets/engine assets/main.js` must be empty.
- **Path A** (`ctx.lines.mk/set/draw`, CONTRACTS §1.12): a segment is 12 floats, the renderer drops `w ≤ 0` segments whole,
  alpha is coverage (opaque strokes, `depth: true, blend: 'over'`, DECISIONS §7 — additive strokes saturate to a white blob at
  the drop). A fade lives in the colour, not the alpha.
- **Cost (§14: 0.4 µs/segment):** the per-piece multiplier is CPU per segment. Bench protocol (HARNESS): `q` pinned 0.95
  (`setInterval(() => CARD.Q.q = 0.95, 16)`, wait 8 s), three throw-away calls, then **three interleaved pairs**
  `CARD.bench(5,300)` / `CARD.bench(0,300)` in a page with `&scene=5` forced (a bench of an off-screen scene measures its last
  update's state). **Before:** `[[0.476, 2.219], [0.429, 2.235], [0.332, 2.225]]` ms at tier 3 (tesseract ⊂ 24-cell, 960
  segs — the fake timeline's first cast; `tools/accept/v0.9/bench-before.txt`). **Cap: POLYTOPE ≤ 2× that**, measured the
  same way, and also once with all three trains live and the 120-cell cast (`look.set(2)` at tier 3, `hooks.train('4x4')`)
  — report ms, ratios to NAV, and both casts.
- `Q` tier flips vs `cuts: 'continuous'`: a subdivision change is a discontinuity — today the cast cross-fade and the
  600/120 swap ease over a second; the build's subdivision (spec 6) must too.
- Headless `Q.q` is not a perf verdict (`CARD.bench` is). The demo synths are random (`fake=0` runs differ run to run);
  `#test` with `CLOCK=1` is bit-identical — use it for every md5. Eval steps before the page finished loading silently fail
  (`{"until":"window.CARD"}` first). Nested `'"'"'` quoting in cdp eval steps breaks — use `\"`. `goScene` does not beat a
  sticky `&scene=`.
- **Pole safety:** the `den` gate exists because a vertex at the pole is a segment at infinity; today `a3 = 0.04·flowHigh`
  wanders slowly and the gate catches what crosses. With impulses on xw you must *bound*, not merely fade: after the
  xy/zw rotation compute `wmax` = the largest `w` over the vertices, and clamp the xw excursion (c + f) so `1 − w` stays
  above the gate for every vertex; the sweep alone crosses on purpose. Prove it with a 600-frame run on the fake timeline
  (no sweep pinned) logging `min(1 − w)` per frame: never below the gate.

## Process — one commit per proven step, in this order, a shot per step

1. **Keycolour to `math/`.** `assets/math/keycolour.js`, `torus2/colour.js` a re-export; `IDS=3 PORT=8790 tools/scene-md5.sh
   pd3` twice = the v0.8 s3 lines; `node tools/check.js`. Commit.
2. **Grooves (spec 1).** `grooves.js`, `hooks.train`, `hooks.info`; a node test of the detector on a synthetic level
   (optional but cheap). The two pinned shots (`pd-train-4x4`, `pd-train-sync`) with the positions in the report — they
   show as geometry only once spec 4 lands, so shoot them again after step 4. Commit.
3. **Nudges + bounce + breath + wobble (spec 2).** `dance.js`, `hooks.motion`; the bar series table; the pole-margin
   600-frame log. Commit.
4. **Pulses along the edges (spec 4).** The `emit` multiplier; the two train shots re-shot (four bumps per edge); the bench
   (both casts). Commit.
5. **The wheel + chroma (spec 5).** `colour.js`, `hooks.key`, `hooks.chroma`; the warm/cool pair, the triad shot. Commit.
6. **The sweep (spec 3).** `hooks.sweep`; the five-shot series + the before/after structure pair. Commit.
7. **Growth (spec 6).** A `build` lo/hi pair (`hooks` or a route on `size`); the CAP worst case. Commit.
8. **Params (spec 7) + `feats`/`help` (spec 8).** The identity proof, the route moving the md5, `paramDeps` per param;
   `tools/scene-md5.sh pd` full list; the final montage `tools/work/pd-montage.jpg` (`montage.py`, 3 columns): the
   orchestrator's before shots `tools/accept/v0.9/before-{house,aba,dnb}-f{360,840}.jpg` (copy them into your tree if the
   worktree lacks them: `git show main:tools/accept/v0.9/before-house-f360.jpg > …` after the orchestrator's commit — or
   ask via the friction log and montage your own six with the same recipe: `CLOCK=1 GPU=1 test&fake=0&demo=<s>&scene=5`
   at f360/f840) beside yours at the same frames. Commit.

## Acceptance (repo root of your worktree, all must pass; `PORT=8790` on every cdp run; shots in `tools/work/` prefixed `pd-`)

1. `node tools/check.js` → 0 fail; `npm test` passes; `node tools/param-smoke.js` passes.
2. `PORT=8790 GPU=1 node tools/cdp.js 'test&scene=5' '[{"until":"window.CARD"},{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical,glerr:CARD.glerr})"},{"shot":"pd-t6"},{"wait":8200},{"shot":"pd-t14"}]'`
   → ERRS `[]`, nonFinite `[]`, logical 5.
3. The house run (`test&fake=0&demo=house&scene=5`, shots at 10/30/50 s `pd-h10/h30/h50`) → three different frames, the
   pulses visible on the cage, no vertex blown up except during a cued sweep.
4. Every proof shot of steps 1–8, montaged, Read with your own eyes, one sentence each on what it shows.
5. The scene object has `name id tag card feats cuts score init update draw post colour look params help hud hooks`;
   `feats` is exactly the fields you read; `help.feats` has a line for every one; `score()` verbatim.
6. `tools/scene-md5.sh pd` → ids 0–4, 6–8 identical to `tools/accept/v0.8/scene-md5-v08.txt`; s5 stable across two runs.
7. `node tools/bundle.js` → 0 errors; `FILE=$PWD/dist/retinarave.html PORT=8790 NOAUTO=1 GPU=1 node tools/cdp.js 'real'
   '[{"wait":1500},{"clickSel":"#demo"},{"wait":3000},{"key":"6"},{"wait":3000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical})"}]'`
   → errs `[]`, scene 5 (key `6` reaches id 5).
8. The bench ≤ 2× before, both casts, reported as pairs and ratios.

**Report** (`docs/workers/polytope-dance.md`): brief-common (a)–(e) — the friction log (every sentence the docs lack,
every guess, every lean you changed and why), the temptation list, the exact EVAL lines, the bench table, the shot file
names with one sentence each, the parameter table (name · eli5 · range · from · deps · what lo→hi does), the bar-series
table of step 3, the pole-margin minimum, the train positions of step 2/4, the s5 md5s, the line count of every module,
the per-band thresholds you settled on and why (the orchestrator retunes them on real music — name them so a one-line
edit does it), and **what you would tune first when the user looks** (the leans you are least sure of, ranked). Leave
the worktree committed (`POLYTOPE-DANCE:` messages); do not merge.
