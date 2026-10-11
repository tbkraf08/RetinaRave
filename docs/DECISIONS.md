# Decisions — every deviation from cardioid3 / synapse2, and why (§104 onward)

Sources are read-only: `~/Documents/Kraftek/Cardioid/cardioid3.html` (v3, trusted), `cardioid4.html` (shape only),
`~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html`.

**§0 … §103 are in [`docs/DECISIONS-ARCHIVE.md`](DECISIONS-ARCHIVE.md)** — 9 034 lines, 2026-09-22 (the extraction)
to 2026-10-08 (the v0.34 tag), split out on 2026-10-11 by §118 so this file stays readable. The section numbers were
NOT changed: a `§N` with N ≤ 103 cited anywhere in the code, the harness or a worker doc means a section of that file.
Its header carries the old → new scene-id map, because every id written before 2026-10-11 is pre-renumber.

Do not read the archive to find out what still binds. Read this:

## Standing rules (from §0–§103)

Everything in §0–§103 that is still a RULE and not just a record, one line each, with the § it was decided in. Read it
before you touch anything; the archive is for the measurement behind a line, not for the line. Two rules that belong in
spirit with these were decided after the split point and so live in this file's own sections: **credit where due** —
a borrowed solver or idea is credited in the file header, `site/about.html`, the README, DECISIONS and the release
entry (§104) — and **tune and test on every library track, prove it on real music** — the eight tracks, per-track
numbers, never SeeYouDrop or Raindrops alone; the fake timeline is a smoke test and the real-track lists are the proof
(§109, extended to the eighth track in §117; FLUID2 is the one standing exception, on the user's word, and owes its
sweep).

- Every visual parameter traces to a field of `MS`, `GROOVE` or `LOOK` — never a wall clock, never `Date.now()`, never `Math.random()`: `#test` must be bit-identical, so randomness comes from `MS.seed.a` / `sectionId` through a hash (§0)
- A module warns above 350 lines and fails above 500, GLSL template strings counted — `shaders.js` splits from `index.js` early (§0)
- A scene, effect or transition imports only its own folder and `assets/math/*`, reads `MS` and never writes it; stages add fields and never overwrite (§0)
- A cost number is measured one Chrome at a time, three runs, nothing else on the machine — anything inside that bench's noise floor is not a difference (§9)
- Look memory is keyed on synapse's `sectionAlt`, filed under the section the look ended on, and a soft switch waits for the bar line; the director's `SC.mem` keys, `prevAlt` and `due` move through synapse's renumber map before the frame is read (§10, §22)
- A colour-identity change is a variant until the user's own eye picks it — never the default on a worker's montage alone; the shipped look is v0.2's (§26)
- A new scene ships forced-only with `score()` 0 and is promoted to the roster — its id, its bid, the reference re-base — only on the user's word (§37)
- Proof is sized to the diff: a scene-folder change proves its own md5 lines, a registration change one full list, a core or engine change the whole sweep, and the Q trace only when a scene enters the rotation (§38)
- A forced scene is drawn on its first frame before its first `update()`, so `draw()` and `overlay()` must return on their first line until that update has run (§39)
- The reactive drum levels are what the eye reads as in sync, not the predicted routes: a prediction only PLACES a hit, and the reactive event goes through when the two disagree (§51)
- The display lead is 40 ms in file mode and 0 in stream mode — the eye wants the picture early only when the audio is decoded ahead; `dispNow()` carries it and no scene adds its own offset (§52, §53)
- The live build / drop detector owns anticipation on the live path: `buildLive` / `dropLiveIn` / `dropLiveEvt`, and NAV reads them by default (§54)
- The beat clock is the PCM clock: `CLOCK.src = 'pcm'`, so `bpm` / `beatPhase` / `beat` / `beatCount` are the PCM bus's, and `&clock=v3` is the A/B (§56)
- The nudge is a velocity profile, not a step — a glide plus a raised-cosine accent peaking ON the beat line, shared from `assets/math/beatgrid.js` so one knob serves every scene (§61)
- `key` and `mode` ARE the ears' tonic whenever the ears have one, so the palette anchor and the interval ruler agree — never synapse's fifth-above read (§62)
- Base light, base size and base radius read true loudness through one shared mapping (`loudlight.js` `baseLight`), with the AGC left on every detector and one calibration across every scene (§63, §65)
- A transient voice is gated by the swell veto — the ears' hat event does not fire the voice while the high band is swelling, because a picker that is wrong there hands the eye an uneven rhythm (§64)
- The drop detector's second arming path is the sub void: the bass pulled out for a bar or more arms, and the bass slamming back on a beat is the drop (§64)
- The ears' LOW lane is a 60–150 Hz band graded on its RISE, not a flux over 40–150 Hz — a continuous 808 drone otherwise reads as the kick (§68)
- A hit has a SIZE as well as a rank: the scenes' kick and snare read the lane alone at its own amplitude (`kickAmp` / `snareAmp`) (§70)
- A hand annotation survives a truth re-run: `trackmap.py` carries the hand block and the hand keys through a regeneration, and a re-run reproduces the json bit for bit (§72)
- TORUS2's fog is the tongues' ambiguity — the dream hazes the nest and the drop clears it; a depth cue, never a wall (§79)
- The double time ACCENTS and never drives: it rides the nudge's swing and the hat voice's gain, never a faster step (§78, §80)
- `tension` is normalised against the p10 / p98 of roughness over the last 30 s — it says "rougher than lately", not "rough", and it is never the build-to-drop tension (that is `buildLive`) (§81)
- `modeShade` is on by default: a per-bar major / minor pull on the key hue from the chord quality the key implies for the bass's degree, with `&shade=0` the A/B (§82)
- The acceptance references live in one directory under one `ACC` variable, every reference read from it, and a re-base is a new directory with those four files and that one default — never a hard-coded value from four versions (§83)
- Every public file carries the licence header and `/LICENSE` is served: MIT plus the Guest-List Clause — if Retina Rave runs at a party, Toma gets in free, with a guest (§90–§91)
- A look remark is a retune request, not a bug report: the user's words about what they saw become the next tuning pass (§92)
- Only the roster bids; every other registered scene returns 0 and is forced-only, and a scene joins the bid only on the user's word (§93)
- A boot never revives a forced scene: `restore()` deletes `manual.scene` from the stored preset before loading it, so the first frame is the director's (§94)
- A scene stays at least 30–90 s (`SC.dwell`, drawn by the director's own hash so a `CLOCK=1` trace is reproducible); the precedence above the gate — a drop hard-cuts home, silence drifts home, a build parks home — is not dwelled (§95)
- The retuned navigator is home and is the public NAV, with the kaleidoscope off on it; the previous navigator was kept registered forced-only as the control until §118 archived it — `tools/test_nav2.js` still A/Bs against `archive/scenes/nav/` (§97–§102)

Every one of these was checked against `docs/CONTRACTS.md` at §118; the ones it did not state are there now (§118's
commit 4 lists them).

---

## §104 the fluid substrate — a Stam solver under every scene, no consumer yet (2026-10-09, one worker; FLUID-PLAN Step 1; the user: *"1) the fluid as the engine's substrate, not a scene … be sure to give credit where credit is due"*)

- **What changed.** `assets/core/fluid/fluid.js` (the GL stepper), `inject.js` (the MS → force grammar, pure), `shaders.js` (the GLSL);
  `core/loop.js` — one line, `stepFluid(dt, S, ENGINE.resumed)` right after `uploadEngineTex`: MS is final, no scene has updated, so a
  scene's `update` / `draw` sees this frame's field; `&fluiddbg=` draws after the chain and before the overlays. `core/gl.js` — `ETEX`
  gains `vel`, `dye` (`{t, w, h}` like `spec`, GPU-written, never uploaded, not in `bytes`), `simW / simH / dyeW / dyeH`. `main.js` —
  `ctx.fluid` in the ctx literal, `FLUID_FEATS ⊂ ENGINE.FEATS` checked at boot exactly as a scene's feats, `initFluid(ctx)` after
  `initLines()` (its targets come from the first resize hook, like an effect's). `harness.js` — `&fluid=0`, `&fluiddbg=1|2`,
  `CARD.fluid`, `CARD.setFluid`, `CARD.benchFluid(n)`. `hud.js` — key `W` (a toast), the HUD line. `help.js` — the `W` row, part B's
  "the substrate" line built from `FLUID_FEATS` (data; `check.js` still forbids an MS literal there). `tools/check.js` — a fluid block
  after the scene loop: every `FLUID_FEATS` key in `FEATS` (fail), every `S.x` / `MS.x` read in `inject.js` in `FLUID_FEATS`
  (**fail** — stricter than a scene's warn, the substrate feeds every scene), a declared key never read (warn). `tools/test_fluid.js`
  in `npm test`. `tools/q-trace.sh` — `X='&fluid=0'` reaches the page (the A/B below). Docs: CONTRACTS §1.1 (`vel` / `dye` rows,
  `ctx.fluid`), §1.4 (the substrate slot), HARNESS "## Fluid".
- **The solver** (shaders.js, the reference's pass order): splats (one draw per target, the frame's splats in a uniform array of 16 —
  not the reference's ping-pong per splat) → curl → vorticity confinement (`curl` from `tension`) → divergence (closed walls: the
  neighbour outside the pool is the mirrored centre) → pressure warm-started × 0.8 → Jacobi × ITER → gradient subtract → advect the
  velocity (dissipation `velDiss`, the breath) → advect the dye at its own resolution (`dyeDiss`). Velocity RG16F LINEAR ping-pong,
  dye RGBA16F LINEAR ping-pong, pressure R16F NEAREST ping-pong, divergence and curl R16F — allocated raw in fluid.js (`mkTarget` is
  RGBA-only). **One unit: screen fractions per second.** The field stores uv/s; the stencils convert to texel units with
  `uScale = (simW, simH)` (square texels, so u_texel = v_uv · uScale) and back, and the back-trace is exactly `vUv − v·dt` — the
  feedback pass (Step 2) and a scene sample it with no conversion. `dt` is the loop's (1/60 under `CLOCK=1`). Tiers by `tier()`:
  sim short edge 64 / 96 / 128 / 128, dye 256 / 384 / 512 / 512, Jacobi 10 / 14 / 20 / 20, the canvas aspect — the cost is set by the
  short edge, not DPR; a tier flip re-allocates with a bilinear copy of the old velocity and dye (the picture never resets). Under
  `CLOCK=1` the tier cannot drop (dtRaw is the shim's 1/60), so every md5 run is one tier. No float render targets (`G.FLOAT` false):
  `avail` false, `on` false, the two 1×1 black placeholders stay on `engineTex.vel / .dye` so a sampler always binds; key `W` says so.
- **The grammar** (inject.js, the plan's table; the constants in one `K` table): the sub emitter at `x = (sectorPc(subNote) + ½)/12`
  (the circle of fifths — half a sector in from the wall, the plan's `((7·subNote) mod 12)/12` put C ON the left edge), `y = 0.12 +
  0.25·bassReg`, `+0.08` uv/s per frame while `subGate` is open (×60·dt: a 30 fps machine injects the same per second), a lean of
  0.02 per 12 st/s of `subGlide`, the mouth wider for a lower `subHz` (×1 at 120 Hz … ×1.5 at 30 Hz — the field was in the table
  with no mapping; this is the level → size kind §1.18 asks for); `subNote −1` with the gate open → x from `harmAngle`. The kick: one
  impulse `(xSub, 0.06)`, `dy = 0.9·sqrt(kickAmp)`, radius ×2; the two frames after (`max(0, kickAge) < 2/60`, never age 99) keep
  40 %. The snare: `(0.3, 0.5, +0.6·snareAmp)` and `(0.7, 0.5, −0.6·snareAmp)`. The hats: `min(3, round(denH))` droplets at `y 0.9`,
  `x = hash(beatCount·7 + i, seed.a)`, `dy −0.15`, radius ×0.5, dye 0.3, while `hat2 > 0.3` — seeded, the same beat gives the same x.
  The breath: `fy = −0.35·cos⁴(π·beatPhase)` — **shaped `cos(π(2x−1))` in the advect pass (centre down, edges up), not uniform**: a
  uniform body force in a closed pool is a pure pressure gradient (∇·F = 0, n·F = n·∇φ at every wall ⇒ F = ∇φ) that the projection
  removes to the Jacobi residual — the plan's "the pool breathes" would have been a no-op; the profile has curl, so the beat kneads two
  cells. `beat` (the event) is not read: it would duplicate `beatPhase`'s wrap. The colour: `mkAnchor().anchor(dt, key, mode,
  keyConf, valence, harmAngle, LOOK.mood.hue, null, modeShade)` → `hsv(hue, sat·(0.4 + 0.6·tonicConf), 1)`, decoded to linear once —
  the hue every key-anchored scene shows. `curl = 10 + 40·tension`; `velDiss = 0.2 + 2.8·smoothstep(0.80, 0.97, lpSweep) + 2·hush`;
  `dyeDiss = 1.0 → 0.05` as `max(buildLive, tongueOn === 1 ? tongueAmbig : 0)` rises; `dropLiveEvt` → one impulse `(xSub, 0.06, 0,
  2.5)` radius ×4 and `dyeDiss 6` for `60/bpm` s (a countdown on dt — `st.clearLeft` — not a clock field, which would be a read
  outside the list); the gain `g = presence·(0.3 + 0.7·loudRel)·(1 − 0.8·hush)·(1 − 0.5·calm)` on every injected velocity, every drop
  of dye and the breath. Not read: `pred*`, `*Vel`, `dropEvt`, `heardT`. Dye amounts (the table left them open): sub 0.015 per
  frame (≈ 0.9 at the mouth at dyeDiss 1), kick 0.5, snare 0.25, hats 0.3, drop 1.0 — in linear units, the key colour scaled.
  `ctx.fluid.splat` queues into the same list and the step drains it; the step runs before `update()`, so a scene's splat lands on
  the next step (one frame, said in CONTRACTS). `ctx.fluid.force` is a uniform body force — the same caveat, written on the slot.
- **Numbers** (this machine, Intel UHD 770-class iGPU, headless `GPU=1`, the 1280×720 window = a 1280×633 canvas, so the sim is
  259×128 and the dye 1035×512 at tier 3 — wider than the plan's 228×128 at a true 16:9; the budget holds anyway). Bench protocol
  (q pinned, 8 s, three pairs of `benchFluid(300)` / `bench(0, 300)`): tier 3 (q .95) **0.581 / 0.553 / 0.591 ms** against NAV
  1.414 / 1.35 / 1.335 → median **0.58 ms, ratio 0.43** (budget ≤ 1.0); tier 0 (q .1, sim 129×64, dye 518×256) **0.300 / 0.315 /
  0.288** against NAV 1.717 / 1.678 / 1.585 → median **0.30 ms** (budget ≤ 0.4). CPU submission (`CARD.fluid.ms`, EMA) 0.12–0.18 ms
  on the SeeYouDrop windows, 0.15 on the fake. ≈ 27 + 2 draws per step at tier 3 (2 splat, curl, vorticity, divergence, clear, 20
  Jacobi, gradient, 2 advect). `test_fluid.js` 50 ok. `check.js` 0 fail / 8 warn (the eight pre-existing soft caps). `license.js
  --check` 178 public files, 0 without the header. **Q trace** (`tools/accept/v0.35/q-{house,aba}-{after,fluidoff}.txt`, 3 runs each, the §16 visit; `X='&fluid=0'` is the new
  knob in `q-trace.sh`): house 0–40 / 40–70 / 70–100 s means **0.56 / 0.71 / 0.83** with the substrate on and **0.56 / 0.71 / 0.83**
  off (q mean 0.73 both, min .35 both); aba **0.56 / 0.71 / 0.83 / 0.98** on and the same off (mean 0.83 both) — a difference of
  0.00 against the ≤ 0.05 gate: a 0.6 ms step never trips the 17.5 ms good-frame line on this machine, so the knob does not see it.
- **Proof — nothing moved.** `GPU=1 PORT=8842 tools/scene-md5.sh s1` with the substrate ON: all 24 lines (s0–s11, f360 / f840) **=
  `tools/accept/v0.34/scene-md5-v034.txt`**, errs [] hop 840 row 72 on every id; `tools/scene-md5.sh s1off '&fluid=0'`: the same 24
  lines, identical. `parity.js fake` (ACC v0.35): MS 0 diff, the pre-existing §83 `nav.*` MISMATCH line to the digit (`max
  7.852214593751443`, 72 fields — §102's number). Monitor 60 s on the home: `n 3606 fast 0 max .0313 viol []`, errs [], the
  substrate on at tier 2 the whole minute (3676 steps, q .74 at the end). Help: 209 rows = the non-internal FEATS count (no new
  entry), top table 51 = DUST's feats, the `W` row in part D, part B's line `fluid 0.06 ms sim 259x128 dye 1035x512 tier 2 … · the
  substrate reads: subNote, subGate, …`; a synthetic `keydown w` turns it off (`engineTex.vel.w` 259 → 1 → 259 on the second press),
  errs [], glerr 0. `&fluid=0`: `on false, steps 0, vel 1×1, dye 1×1, the same texture`. Bundle (174 modules, 1670 KB) from
  `file://`: errs [], the substrate on, 345 steps in 6 s, 3 "Dobryakov" lines in the single file, 0 EXC. SwiftShader (no `GPU=1`):
  `EXT_color_buffer_float` is there too, 120 steps, glerr 0 — the `G.FLOAT` fallback has still never been seen on a device.
- **The eye** (`tools/accept/v0.35/fluid-s1-*.jpg`, `&track=SeeYouDrop&scene=1&fluiddbg=1` — the dye itself, encoded, the velocity
  as the inset bottom-right; the montage `tools/work/fluid-s1-m.jpg`): intro 10 s — only hat droplets at the surface, the pool black
  (no sub, no drums: right); groove 35 s — a stirred blue-teal pool, the sub's column at its sector, `n 1` splat per frame (the
  emitter); drop 1 57.6 / 58.0 s — the pool full, the two snare shears at mid height as two bright blobs, `dyeDiss .49` (the void's
  ink carried in); build 90 / 100 s — magenta then grey-blue as the key anchor and the shade move, `curl 39` at 100 s (tension);
  drop 2 105.6 / 105.8 s — the big impulse at the floor, lilac. Two runs of the intro shot: md5 equal. The velocity inset shows
  fine grain everywhere (vorticity confinement amplifying half-float curl noise, the reference does the same at CURL 30) under the
  large-scale cells — a consumer that samples it bilinearly at a coarser rate (feedback, Step 2) will not see the grain; a scene
  that shades from it should blur first. Whether the pool reads as *music* to the user's eye is Step 3's question, where it is shown.
- **Lineage.** The solver is Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, 2017) re-implemented on this repo's `gl.js` helpers —
  nothing vendored, the notice in `THIRD-PARTY.md`. Three forks informed the design and no code was taken from them:
  michaelbrusegard/WebGL-Fluid-Enhanced (the ESM API shape — a simulation object with config, splat and pause, which `ctx.fluid`
  follows), oliver-kopcik/fluid-music-visualizer (spectral-flux onsets as splat force and size, pitch classes as hue — here the ears'
  `kickEvt`/`kickAmp` and the key anchor), little-noob/Fero-Fluild-Lamp (the band split bass / mid / high into deformation,
  turbulence and edge detail — here the register axis). The grammar's sources are the user's own validated mappings: TORUS2's waves at
  beat speed and the measured drum channels (DECISIONS §57, §58, §70, §74, §79, §81).
- **Credit, where it is.** Line 4 of `fluid.js`, `inject.js`, `shaders.js`, `tools/test_fluid.js` (`shaders.js` also "after GPU Gems
  ch. 38 (Harris 2004)" on line 5); `THIRD-PARTY.md` at the root with the full MIT notice, copied into `dist/` by the build next to
  `LICENSE`; README "## Credits"; `site/about.html`'s License section (the plan's sentence, verbatim — the substrate is under every
  scene from this step, so the public page says so now, not at Step 3); the bundle carries the header lines (`bundle.js` rewrites
  import / export lines only). `grep -l Dobryakov` lists all four new files; `license.js --check` 0 missing.
- **Not done / open.** The user's eye on the drop windows (the dye is only visible through `&fluiddbg=` until Step 3). HiDPI phones:
  a 390×844 DPR-3 canvas is capped at 1600 long edge → sim 128×277 portrait at tier 2, untested on a device. The `G.FLOAT` fallback
  never seen on a device. The velocity grain (above). `ctx.fluid.force`'s uniform body force is honest but weak by construction.
  Scene splats land one frame late (by design: the step precedes `update`). `accept.sh` in full not run (its pieces by hand above);
  `ACC` stays v0.34 — Step 2 is the re-base. Step 2's worker: `io.fluid` is `ctx.fluid` (add it to `runChain`'s io in `loop.js`);
  sample `engineTex.vel` with `texture(uVel, c).xy` and back-trace `c −= advect · dt · v` — uv/s, no scaling, CLAMP_TO_EDGE; the
  `&fluid=0` list must still equal v0.34 line for line.

## §105 advection replaces the scalar feedback decay — every trail rides the substrate's current (2026-10-09, one worker; FLUID-PLAN Step 2; the user: *"2) replace the scalar feedback decay with advection"*)

- **What changed.** `assets/effects/feedback.js` — a second program object `prA`: the v0.2 shader plus `uniform sampler2D uVel;
  uniform vec2 uAdv;` and, after the zoom/twist, `c += .5; c -= uAdv.x·uAdv.y·texture(uVel, c).xy; c = clamp(c, 0, 1); p =
  texture(uPrev, c)` — Stam's semi-Lagrangian step (the reference's advect pass): the velocity is read at the frame's own position
  and the previous frame is fetched from where that parcel was `dt` ago. `uVel` is `engineTex.vel` (screen fractions per second, y
  up, sim res, bilinear — §104's grain averages out at frame res), `uAdv = (gain, dt)`. `pr` is the old program, byte for byte, and
  runs whenever the substrate is off (`&fluid=0`, key W, no float targets, `io.fluid` absent as in chain-smoke) or the gain is 0 —
  the same compiled program with the same uniforms, so the old path is bit-exact by construction. The slot: `post.fb.advect`,
  number or `fn(MS)` like `decay`, **default 1** (the user said replace) — a gain on the substrate's velocity, which already carries
  the unit (a cap in uv/s would alias on the drop impulse). `decay` is unchanged (still the dissipation, `pow(d, 2.2)` in linear),
  `max(s, p)` stays, zoom and twist stay — the back-trace adds to them. `core/loop.js` — `fluid: FLUID` in `runChain`'s io.
  `core/manual.js` — `fb.advect` is the fifth post param (`PARAMS`, the `ONE` alternation, the parse hint;
  `&post=<scene>.fb.advect=0`); the panel's `postCtl` walks `POST_PARAMS`, so the box appears with nothing added; `scenes.js`'s
  `nested()` already resolves any nested fn slot against a routed view, so a routed scene's `advect: (S) => …` works as `decay` does.
  `tools/manual-smoke.js` — the fifth param, the merge beside `fb.decay`, the grammar (46 checks). Docs: CONTRACTS §1.4 (the slot),
  §3 (`io.fluid`), HARNESS "## Effect chain" (the two programs, the identity proof), "## Fluid" and "## Acceptance sweep" (the re-base).
- **Numbers** (this machine, headless `GPU=1`, the 1280×633 canvas, q pinned .95 → tier 3, sim 259×128; the feedback pass alone,
  300 runs per sample, readPixels-synced on its output target, three pairs advect 1 / advect 0 interleaved, medians): first eval
  **0.470 / 0.420 ms** (pairs 0.484/0.425, 0.470/0.420, 0.470/0.396), second eval **0.241 / 0.208 ms** (0.310/0.223, 0.241/0.208,
  0.226/0.199) → the back-trace costs **+0.03–0.05 ms** per frame at frame res against the ≤ 0.15 gate (one bilinear fetch of a
  259×128 RG16F texture per frame pixel; the first eval ran while the GPU clock was still ramping, both deltas agree). The
  substrate's own step is §104's 0.58 ms (CPU submission 0.06 ms here). Check 0 fail / 8 warn (the pre-existing soft caps), `npm
  test` green (test_fluid 50 ok), `license.js --check` 178 files 0 missing, `chain-smoke: OK` unchanged (fringe 0.745 / 0.998,
  white 198 / 255, grey18 134 / 150 / 177 — the smoke's io has no `fluid`, so it exercises the scalar program as before).
- **Proof — the old path is intact.** `GPU=1 PORT=8852 tools/scene-md5.sh v35off '&fluid=0'`: all 24 lines **= `tools/accept/v0.34/
  scene-md5-v034.txt`** (diff empty), errs [] hop 840 row 72 on every id. `IDS=1 … '&post=dust.fb.advect=0'`: s1's pair = v0.34's
  s1 pair (`1faaa64e / 25dfdc48`) — the per-scene slot reaches the old program too. `'&post=dust.fb.advect=0.5'` moves s1
  (`879220fc / ab480a46`), `'&post=dust.fb.advect=1'` = the new reference's s1 pair (the §392 pattern). `parity.js fake` (ACC v0.35):
  MS 0 diff, the pre-existing §102 `nav.*` MISMATCH line to the digit (`max 7.852214593751443`, 72 fields). Monitor 60 s on the
  home (`test&fake=0`): `n 3603 fast 3 max .0655 viol []`, errs [], bad [], the substrate on at tier 2 (3675 steps, q .74) — the
  monitor watches the navigator's state, which does not read the fluid; `fast 3 / max .0655` are the real-clock run's own noise
  (HARNESS's example reads fast 97; the gate is viol []). GL error 0, errs [] on every shot.
- **Proof — the re-base (`tools/accept/v0.35/`, `ACC` default v0.35).** `tools/scene-md5.sh v35a` (PORT 8853) and `v35b` (PORT
  8856): the two 24-line lists byte-equal (`cmp`), errs [] on every id → `scene-md5-v035.txt`. Every line moved, as the plan said
  it would (the feedback pass is under every scene; the fake timeline stirs the pool from frame 0 — the sub emitter, the drums):

  | id | scene | frame | v0.34 | v0.35 |
  |---|---|---|---|---|
  | s0 nav2 (home) | f360 | `a8de2f03` | `f82a9174` |
  | s0 nav2 (home) | f840 | `7a65fd16` | `6abfd71e` |
  | s1 dust | f360 | `1faaa64e` | `9d7f4504` |
  | s1 dust | f840 | `25dfdc48` | `5b06a809` |
  | s2 mandala | f360 | `62515d49` | `e87cfa4b` |
  | s2 mandala | f840 | `f3a3721c` | `ee7956e3` |
  | s3 torus2 | f360 | `3122036e` | `e6fffff8` |
  | s3 torus2 | f840 | `a1e941af` | `8d3635a8` |
  | s4 drum (variant of 8) | f360 | `0bff278a` | `45b27bc9` |
  | s4 drum (variant of 8) | f840 | `05bf21c0` | `2bf0e217` |
  | s5 polytope | f360 | `9c3be023` | `3c8d8ac7` |
  | s5 polytope | f840 | `04fc1ffb` | `dc9e5783` |
  | s6 feigen | f360 | `fac80f37` | `73b7b0ea` |
  | s6 feigen | f840 | `6251d7e9` | `3fc6a766` |
  | s7 torus-v1 | f360 | `d3e73b38` | `c1c0afa7` |
  | s7 torus-v1 | f840 | `7e77c7b3` | `3ce3f944` |
  | s8 nav (control) | f360 | `fb74fee4` | `83c30184` |
  | s8 nav (control) | f840 | `8a0715df` | `b6257fe5` |
  | s9 maxwell | f360 | `fb52b874` | `839f3210` |
  | s9 maxwell | f840 | `02c317b8` | `fd7851f6` |
  | s10 gielis | f360 | `6ab60297` | `6e51a957` |
  | s10 gielis | f840 | `1fe93f2c` | `cbc891d7` |
  | s11 chladni | f360 | `380d0255` | `d05204e5` |
  | s11 chladni | f840 | `b0407176` | `347c6284` |

  The mixs 0→3 line: `724bbd72` → **`1ccfd0c1`** (twice, m .499, errs []) — the current is one field under both sides of the fade.
  The GIELIS `&still=1` pair: `b7d52757 / ca912a8d` → **`3edc1fbc / b3c0dda0`** (twice): the still rests the scene's uniforms, not
  the chain under it. `hist rows == full` still holds by construction (the same frame both ways; the advection is identical on both).
  How far a line moved (f840, grey-level mean |Δ| old vs new, % of pixels > 8): s0 0.44 / 0.4 %, s1 1.81 / 4.1 %, s2 1.10 / 0.8 %,
  s3 0.92 / 2.7 %, s4 0.57 / 0.5 %, s5 1.38 / 3.2 %, s6 0.21 / 0.1 %, s7 1.30 / 4.3 %, s8 0.38 / 0.4 %, s9 0.49 / 0.4 %, s10 1.07 /
  3.3 %, s11 2.19 / 7.7 % — small everywhere, largest on the particle and line scenes (DUST, CHLADNI, TORUS-v1) whose trails are the
  thinnest; the navigators barely move (their trail is short and the picture is the set, not the trail).
- **The eye** (`tools/accept/v0.35/fb-advect{1,0}-s{0,3}-*.jpg`, 16 shots, SeeYouDrop `at=25` f602 groove 35 s / f1958 drop 1 57.6
  s and `at=80` f1202 build 100 s / f1538 drop 2 105.6 s; the montage `tools/work/fluid-s2-m.jpg`, rows HOME 1 / HOME 0 / TORUS2 1 /
  TORUS2 0; the ×6 difference images `tools/work/fluid-s2-diff-m.jpg`). Nothing smears into mush and nothing loses legibility: at
  640 px the pairs read as the same picture. The difference (mean |Δ|, % > 8): HOME groove 2.1 / 7.5 %, build 3.3 / 10.5 %; TORUS2
  groove 4.8 / 16.4 %, build 4.4 / 14.7 %; **both drops ≈ 0** (0.02–0.13) — at a drop `decay` falls to 0.2 and the flash washes the
  frame, so there is no trail left to carry. Where it moves: along the trail strokes themselves (the ×6 images show the strokes'
  edges displaced coherently, not a haze), strongest on TORUS2's lower-left where the sub emitter sits in its sector. **The gain-1
  effect is subtle on these two scenes**: the substrate's ambient field is a few hundredths of a uv/s (§104's grammar: the sub
  column +0.08 uv/s, the snare shears ±0.6·snareAmp, kicks 0.9·√kickAmp as impulses that the projection and `velDiss` damp within a
  beat), so a parcel moves ~1 px per frame between hits and a few px on a hit — the trail rides, it does not travel. Whether that is
  the right amount is the user's eye; if he wants the current to be *seen* in the trails, `fb.advect` 2–4 on the long-trail scenes
  (TORUS2 decay .74-class) is the knob, per scene, not a retune of the grammar — reported, not done.
- **Lineage.** The solver is Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, 2017) re-implemented on this repo's `gl.js` helpers —
  nothing vendored, the notice in `THIRD-PARTY.md`. Three forks informed the design and no code was taken from them:
  michaelbrusegard/WebGL-Fluid-Enhanced (the ESM API shape — a simulation object with config, splat and pause, which `ctx.fluid`
  follows), oliver-kopcik/fluid-music-visualizer (spectral-flux onsets as splat force and size, pitch classes as hue — here the ears'
  `kickEvt`/`kickAmp` and the key anchor), little-noob/Fero-Fluild-Lamp (the band split bass / mid / high into deformation,
  turbulence and edge detail — here the register axis). The grammar's sources are the user's own validated mappings: TORUS2's waves at
  beat speed and the measured drum channels (DECISIONS §57, §58, §70, §74, §79, §81). The feedback pass's back-trace is the
  reference's advect pass (Stam 1999, GPU Gems ch. 38): `feedback.js` carries the two credit lines on its 4th and 5th header lines.
- **Not done / open.** `tools/accept.sh` in full was not run at a tag (there is none for Step 2); its pieces ran by hand above and
  every reference it reads is in `tools/accept/v0.35/`. The user's eye on the gain (above). A scene that wants the trail still
  (`advect: 0`) or faster declares it in its `post` — none does yet; `fb.advect` as `fn(MS)` (a trail that rides harder on
  `buildLive`) is a slot nobody fills. The HiDPI / `G.FLOAT`-false paths from §104 are unchanged and still unseen on a device.
  Step 3's worker: `io.fluid` is in the chain's io now; the FLUID scene's `post: { fb: { decay: 0.35, advect: 1 } }` is the plan's;
  the full list is v0.35's 24 lines + the two s12 lines it appends; the `&fluid=0` list stays v0.34's.

## §106 FLUID, id 12 — the substrate shown as itself (2026-10-09, one worker; FLUID-PLAN Step 3; the user: *"3) then build fluid sim with your recommendation … don't get caught up in local maxima, nothing is off limits"*)

- **What changed.** `assets/scenes/fluid/{index.js, shaders.js, help.js}` — a scene whose picture IS `ctx.engineTex.dye`: one fullscreen
  pass (`fluid-show`, `ctx.oklch` prepended) lights the linear ink as a liquid surface — the normal from the ink's luminance gradient over
  ±2 dye texels (Dobryakov's SHADING idea, the dye read as a height field; ±2 rather than the plan's ±1 because §104's velocity grain reaches
  the dye at 1035×512 and at ±1 the ×30 relief read it as crinkle — the first look, `tools/work/fl-look-f840.jpg`), a Lambert term from a
  light at the top (`.35 + .65·n·l`), a Blinn highlight `pow(n·h, 48)` that rides the ink (`.08 + .92·ink`), over a dark pool
  (`.0012 / .002 / .0045` linear — the chain's tonemap lifts the floor ×1.9, the first look's `.004 / .006 / .011` was grey), a porthole
  feather on the frame's superellipse `|x|⁴ + |y|⁴` between r .88 and 1.04 (the solver's closed walls stay outside the picture, §1.10's
  rule; the first look's .82 / 1.0 ate a quarter of the frame), `linToSrgb` at the end (the scene writes encoded, §1.10). Exposure
  `.5 + .9·baseLight(loudRel, loudRange, loudAbs)` (`math/loudlight.js`, as NAV2), eased τ .12 s. `name: 'fluid', id: 12, cuts:
  'continuous', always: false, score() → 0` (§93's roster rule — forced-only; no digit key, `n` cycles to it, `&scene=12`), `post: { fb:
  { decay: .35, advect: 1 }, bloom: { thr: .5 }, kaleido: 0, morph: { flow: .4 } }`, `card` + `site/thumbs/fluid.jpg` (f840, `tools/thumbs.sh`
  `12:840`), `params` `light` / `relief`, `hooks.flinfo()` / `.fldbg()` read-only, `hud()` one line (the step's ms, splats, `dyeDiss`,
  `curl`, or why the pool is empty), `state` for the monitor. Two injections of its own through `ctx.fluid.splat`, gated on being on screen
  (`vis > 0`, from `env.SC` — the pool is one under every scene): a ring of six droplets on the drop (radius .22 screen heights, thrown
  outward at 1.6 uv/s · presence, splat radius ×3, ink .04 white) and a sparkle on the surface while `hat2 > .3` (one droplet per 50 ms at
  y .93, x walking the golden ratio on the scene's own count — seeded, never random; ink .2·(hat2 − .3)/.7·presence, radius ×.4, falling
  −.12 uv/s). `feats` = exactly its own reads: `loudRel, loudRange, loudAbs, dropLiveEvt, mapDropEvt, mapOn, dropEvt, hat2, presence`;
  the substrate's reads stay `FLUID_FEATS` (part B of the help). `assets/main.js` the import + the list (twelve scenes); `tools/thumbs.sh`
  `12:840`; CONTRACTS §1.8 (12 fluid) and §1.4 (the `params` note below); HARNESS "## Fluid" (the scene's proofs, the strip recipe),
  "## Landing tiles" (`TILES 10` — the text said 6 since v0.10); `site/about.html` the scenes list. `releases.json` untouched (no tag here).
- **Three deviations from the plan, and why.** (1) `feats` is nine, not four: `baseLight()` reads `loudRange` and `loudAbs` as well as
  `loudRel` (NAV2 declares the same), and the drop is CHLADNI's slam rule `mapDropEvt || dropLiveEvt || (mapOn ≤ .5 && dropEvt)`, not
  `dropLiveEvt` alone — because on SeeYouDrop's drop 1 in file mode **`dropLiveEvt` never fires** (the strip below: `dropEvt` f578 = 57.600 s,
  `mapDropEvt` f579 = 57.617 s, the live detector silent from 56.5 to 58.9 s), so the plan's ring would never have landed where the user's
  eye is. (2) The plan's `ctx.fluid.params.curl += 10` while on screen is NOT done: `stepFluid` runs BEFORE `update()` (loop.js) and
  rewrites `params` from `plan()` at the top of every step, so a scene's write in `update()` is overwritten before any step reads it — the
  §104 contract sentence "a scene may override them for the frame" is dead as written. Fix, for a later step: a `ctx.fluid.bias`
  `{curl, velDiss, dyeDiss}` the step ADDS after the grammar and zeroes, as `force()` is handled; written on CONTRACTS §1.4. (3) The
  gradient is ±2 dye texels (above).
- **Numbers** (this machine, headless `GPU=1`, the 1280×633 canvas). Bench (q pinned, 8 s, three interleaved pairs `bench(12, 300)` /
  `bench(0, 300)`, readPixels-synced, the scene's pass alone — the substrate's step is §104's 0.58 ms and is paid under every scene):
  tier 3 (q .95) **0.420 / 0.369 / 0.409 ms** against NAV 1.383 / 1.317 / 1.373 → median **0.41 ms, ratio 0.30**; tier 0 (q .1)
  **0.395 / 0.426 / 0.365** against 1.450 / 1.436 / 1.399 → median **0.40 ms** — against the plan's ≤ 0.5 ms (one fullscreen pass, five
  taps of a 1035×512 RGBA16F texture; the tier does not move it because the pass is at frame res). `glerr 0`. CPU: `CARD.fluid.ms`
  0.05–0.16 ms on the windows. `check.js` 0 fail / 8 warn (the pre-existing soft caps). `npm test` exit 0 (`test_fluid` 50 ok).
  `license.js --check` 181 public files, 0 without the header; `grep -l Dobryakov` lists all three new files (`shaders.js` the GPU Gems
  line too). Help: `rows(true)` on 12 = the nine feats, `rows().length` **209** (unchanged — no new FEATS entry), the credit sentence on
  the page (`#help` contains "re-implementation of Pavel Dobryakov …", `tools/work/help-s12-why.jpg`), errs []. Landing: `TILES 10 imgs
  480 ×10`, `PEEK true 6 6 demo 0 peek`, `DIRECTOR -1`, `START demo false 3 hide true []`; `MOBILE=1` the same ten. Lumtrace
  (`tools/lumtrace.js SeeYouDrop --scene=12 --from=25 --to=60 --fps=5`): medY .12 / .15 / .19 / .18 / .23 / .18 / .21 per 5 s window,
  p90Y ≤ .26, clip 0 on 176 frames, `meanY ≥ .6` on exactly one frame (the drop's flash) — the pool never blows out and never goes black.
- **Proof.** `IDS=12 PORT=8874 GPU=1 tools/scene-md5.sh` twice → **`13e9acae` / `85cd3023`** (f360 / f840), equal, errs [] hop 840 row
  72 — appended to `tools/accept/v0.35/scene-md5-v035.txt` (26 lines). One full list (PORT 8882, the "main.js registration" row): the 24
  other lines **= v0.35 to the byte** (FLUID is forced-only and `always: false` — its `update` never runs under another forced scene, so
  it cannot stir the pool under them). `tools/scene-md5.sh v35off '&fluid=0'` (PORT 8883): the 24 lines **= v0.34** line for line; s12
  under `&fluid=0` = the empty-pool idle, **`70405a78` / `f048c5a2`** (twice, in the reference file's header — not in the v0.34 identity
  list, which has no id 12). The mixs 0→3 line **`1ccfd0c1`** = v0.35 (id 12 is not in the fade). `&trans=morph` 0→12 and 12→0 at f178:
  m .499, errs [] (`tools/work/fluid-s3-morph-m.jpg`). Monitor 60 s on `test&track=SeeYouDrop&at=25&scene=12` (real time, `CARD.NAV =
  REG[12].scene.state`): **`n 3606 fast 0 max .0057 viol []`**, errs [], bad [], the substrate on at tier 2 the whole minute (3717
  steps, q .54 at the end). Bundle: 177 modules, 1690 KB, `&scene=12` from `file://` errs [] bad [] `cur 12`, 351 steps in 6 s, 9
  "Dobryakov" lines in the single file. The hidden-tab line (`accept.sh` "== hidden tab") not re-run: nothing in this step touches the
  extractor, `ENGINE.resume` or the loop's resume line.
- **The eye** (`tools/accept/v0.35/fluid-s3-*.jpg`, the montage `tools/work/fluid-s3-m.jpg`; each shot errs [], bad []). Intro 10 s —
  the empty pool, a few lilac hat droplets at the surface (no sub, no drums: right). Groove 35 s — the picture the plan asked for: the
  sub's blue-teal column rising in its sector, the ink lit as liquid, the highlight along its edges, the sparkle droplets at the top.
  Drop 1 57.6 s — the composite's flash and glitch rows (as on every scene); +0.4 s — the ring's six blobs spreading outward through a
  pool that is still FULL (below). Build 90 s — magenta, two bright kick blobs and the sub column; build 100 s — the grey-blue, the pool
  packed with accumulated ink (`dyeDiss` .75 → the void's accumulation, tension's `curl 39`). Drop 2 105.6 s — the flash; +0.2 s — the
  ring at 1.0 over a lilac pool. The 24-frame strip across drop 1 (`tools/work/fluid-s3-drop1-strip.jpg`, 56.5 → 58.9 s every 0.1 s, mean
  grey level per frame): **34 34 33 34 34 33 33 34 34 34 33 | 153 95 60 45 42 40 39 38 40 40 39 38 40 40** — the flash at 57.6, then the
  pool settles at 38–40, BRIGHTER than before the drop (34), not emptier. **Finding: the pool does not clear on drop 1.** The logger
  shows why: the grammar's clear is `if (S.dropLiveEvt) … st.clearLeft = 60/bpm` (inject.js) and `dropLiveEvt` never fires there in
  file mode, so `dyeDiss` stays 1.0 through the drop (the strip's column reads 1 on every frame; the §104 montage at 57.6 / 58.0 s was
  the same event). Proposed inject.js change, for the user's decision (not done — the brief holds the grammar): fire the clear on the
  slam rule, `dropLiveEvt || mapDropEvt || (mapOn ≤ .5 && dropEvt)` (`mapDropEvt`, `mapOn`, `dropEvt` into `FLUID_FEATS`, the test's
  Proxy list, the help's part B line follows), and consider `DROP_DISS` 6 → 12: at 6 the pool keeps 10 % after 0.4 s (`(1/(1+.1))²⁴`),
  at 12 it keeps 1 % — "the pool clears" in under half a beat instead of fading over one. The scene's own ring is on the slam rule
  already, which is why it shows on the file at all. The hats' sparkles are the one part of the picture that lands on every hit.
- **Lineage.** The solver is Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, 2017) re-implemented on this repo's `gl.js` helpers —
  nothing vendored, the notice in `THIRD-PARTY.md`. Three forks informed the design and no code was taken from them:
  michaelbrusegard/WebGL-Fluid-Enhanced (the ESM API shape — a simulation object with config, splat and pause, which `ctx.fluid`
  follows), oliver-kopcik/fluid-music-visualizer (spectral-flux onsets as splat force and size, pitch classes as hue — here the ears'
  `kickEvt`/`kickAmp` and the key anchor), little-noob/Fero-Fluild-Lamp (the band split bass / mid / high into deformation,
  turbulence and edge detail — here the register axis). The grammar's sources are the user's own validated mappings: TORUS2's waves at
  beat speed and the measured drum channels (DECISIONS §57, §58, §70, §74, §79, §81). The scene's shading pass is the reference's
  SHADING idea (a normal from the dye's gradient) — `assets/scenes/fluid/shaders.js` carries the two credit lines on its 4th and 5th
  header lines, `index.js` and `help.js` the solver line; the help view's `why` ends with the public sentence, verbatim from the plan.
- **Not done / open.** The user's eye: the look (the relief at ×24, the highlight, the pool's darkness, the porthole), whether the pool
  reads as *music*, the ring's size and ink, and the drop clear above (the proposal needs a grammar change). `cuts: 'continuous'` is the
  plan's word and the monitor's line holds for the scene's OWN state; the ink's arrival on a hit is the substrate's Gaussian blob, which
  appears in one frame — if the user reads that as a jump, the honest word is `'onset'`. `params.curl` dead-override (above). The thumb
  is f840 of the fake (the green key's column with the hat droplets); the user may prefer the groove frame. `accept.sh` in full not run;
  `releases.json` and the version untouched (the orchestrator decides the tag). HiDPI phones and the `G.FLOAT`-false idle (drawn here
  for the first time, under `&fluid=0`) still unseen on a device.

## §107 the drop clears the pool — the grammar's clear on `dropLiveEvt || mapDropEvt`, `DROP_DISS` 12 (2026-10-09, one worker; the orchestrator's eye on §106's strip; the user's decision on §106's proposal, narrowed)

- **The defect.** `core/fluid/inject.js` keyed the pool's clear (`st.clearLeft = 60/bpm`, `dyeDiss = DROP_DISS`) and the drop's impulse
  on `dropLiveEvt` alone. In file mode with the map built, the live detector never fires on SeeYouDrop's drop 1 (§106's strip: `dropEvt`
  57.600 s, `mapDropEvt` 57.617 s, `dropLiveEvt` silent 56.5–58.9 s) and never on drop 2 either (this step's log at 105.6 s: `dropLiveEvt`
  0, `mapDropEvt` 1, `dropEvt` 1 on one frame). So the one place the grammar says WHERE IN THE PHRASE we are — the pool empties on the
  drop — never happened on the file: §106's strip read 34 before the drop and **38–40** after it, brighter, not emptier.
- **The rule.** The clear fires on `dropLiveEvt || mapDropEvt` — the live detector OR the map's own bar line (frame-exact, every run,
  CONTRACTS §1.18: file mode uses the map's own future). `mapDropEvt` joins `FLUID_FEATS` (34 reads; `mapOn` is not read, so not
  declared — check.js warns on an unread entry). **`dropEvt` stays out**, and the test now says so (a `dropEvt`-only frame does NOT arm
  the clear): the extractor's drop fires inside Vienna's dream (§1.18, `tongueAmbig` 1.0 sixteen seconds before its drop 1), and in
  live mode a missed drop is the detector's gap to close (`engine/build`), not the grammar's — a clear the detector did not call is
  a wrong clear on a live night, and the live detector is the live truth. CHLADNI's slam rule keeps its third term for a RING,
  which is cheap to be wrong about; an emptied pool is not. `DROP_DISS` 6 → **12**: the dye pass is `1/(1 + diss·dt)` per frame
  (shaders.js), so over the clear's beat (SeeYouDrop ≈ 150 bpm → 0.4 s = 24 frames) 6 keeps `(1/1.1)²⁴` = 10 % of the ink and 12
  keeps `(1/1.2)²⁴` = 1.3 % — "the pool clears", not "the pool fades". The scene's own ring (§106) is untouched; nothing in the hot
  path changed (one boolean OR in a pure function, one constant), so the bench was NOT re-run.
- **The numbers** (this machine, headless `GPU=1`, 1280×633, `CLOCK=1` file mode). `check.js` 0 fail / 8 warn (the pre-existing soft
  caps); `npm test` exit 0 — `test_fluid` **56 ok** (the new `mapdrop` block: a `mapDropEvt` frame arms the clear with the same
  one-beat countdown and the ×4 impulse, both events on one frame give one impulse, a `dropEvt`-only frame gives `dyeDiss 1` and no
  splat, `FLUID_FEATS` has `mapDropEvt` and not `dropEvt`, `DROP_DISS` 12 keeps < 2 % after 24 frames). **The strip** (`&track=
  SeeYouDrop&at=48&scene=12`, 24 shots keyed on HEARD time 56.5 → 58.9 s every ~0.104 s — the recipe on HARNESS "## Fluid": `frame0`
  moved from 2 to 20 with the md5 runs sharing the GPU, so a strip keyed on `__FRAME` is a different second from run to run — the
  montage `tools/work/fluid-s3-drop1-strip2.jpg`, kept as `tools/accept/v0.35/fluid-s107-drop1-strip.jpg`; mean grey of the whole
  frame, PIL `convert('L')`, the same metric as §106's line):
  before — **34 33 33 34 34 33 33 34 34 34 33 | 153 95 60 45 42 40 39 38 40 40 39 38 40 40** (§106, `tools/work/strip/`, re-measured);
  after — **34 33 32 34 34 33 33 34 34 33 33 | 122 63 38 29 29 27 27 27 31 31 31 33 34**. The empty pool at 10 s (`fluid-s3-intro-10.jpg`)
  reads **24**, the groove at 35 s 33. So: the pool is as full as before up to 57.55 s, the flash (122 here — sampled 3 frames after
  §106's 153), then two near-empty frames and a floor of **27** (3 above empty — the ring's six droplets and a faint residue) for the
  clear's beat, then **31 → 34** as the drop's kicks and the ring refill it; `dyeDiss` logged 12 on the 57.65 / 57.77 / 57.87 / 57.97 s
  shots and 1 again at 58.07 (the countdown's 0.4 s). The eye on the strip: frames 0–10 the full pool, 11–12 the flash, 13–14 the
  cleared pool with a faint lilac residue, 15–23 the new ink — the kick blobs in the key's new hue and the ring's droplets — spreading
  through an EMPTY pool: "cleared, now refilling from the drop", not a cut to black (12 does not over-clear; a second of black would
  read 24 on ten frames). The event log on the run: `dropEvt` 57.600 (f596), `mapDropEvt` 57.617 (f597), `dropLiveEvt` never — as
  §106. **Drop 2** (`at=80`, heard 105.6 / 105.8: `tools/accept/v0.35/fluid-s107-drop2-{1056,1058}.jpg`, errs [] bad []): the flash
  frame reads 157 both before and after (§106's 158 — the composite's flash washes everything); 0.2 s later §106's pool is still full
  at **75** and §107's is draining at **58**, the ink visibly thinning (`dyeDiss` 12 on both shots). A pitfall seen on that run: with
  `at=80` the map's first-frame crossing window `(−1e-9, 80]` contains drop 1, so `mapDropEvt` fires on the file's first frame (f20,
  heard 80.0) — a one-beat clear on a pool that is still empty; harmless, and the map's behaviour since pass 1, not this step's.
  **Monitor** 60 s on `test&track=SeeYouDrop&at=25&scene=12` (real time, `CARD.NAV = REG[12].scene.state`, the window 25 → 85 s
  across drop 1): **`n 3602 fast 0 max .034 viol []`**, errs [], bad [], the substrate on at tier 2, 3624 steps.
- **The md5 question.** The fake timeline never sets `mapDropEvt`: `earsStage` clears it and returns on `ENGINE.fakeOn` before the map
  branch (features-ears.js), and `sources/fake.js` writes only `dropEvt`. Proven, not assumed: the full list `GPU=1 PORT=8891
  tools/scene-md5.sh v107` = `tools/accept/v0.35/scene-md5-v035.txt` **line for line (26 of 26)**, errs [] hop 840 row 72 on every id;
  `tools/scene-md5.sh v107off '&fluid=0'` (PORT 8892) = `tools/accept/v0.34/scene-md5-v034.txt` **line for line (24 of 24)** with the
  s12 idle pair `70405a78` / `f048c5a2` as the v0.35 header records; `IDS=12` twice (PORTs 8896 / 8897) **`13e9acae` / `85cd3023`**,
  equal to each other and to the reference. **No line moved, so nothing is re-based** — the trans-mixs and gielis-still references
  are on the same fake path and cannot have moved when no scene line did. Parity fake (PORT 8899): max 7.852214593751443, 72 fields,
  the mismatch list exactly §102's `nav.*` line. The grey numbers above are the whole proof that the grammar changed; the md5 lists
  are the proof that nothing else did.
- **Docs.** CONTRACTS §1.1 (`ctx.fluid`): the grammar sentence names the trigger (`dropLiveEvt || mapDropEvt`, never `dropEvt`); §1.4's
  substrate paragraph does not name it and is unchanged. HARNESS "## Fluid": the node bullet (the clear's two arms), the strip recipe
  rewritten on heard time with both grey lines. `docs/plans/FLUID-PLAN.md` still reads `dyeDiss = 6` on `dropLiveEvt` — the plan is
  the plan; this section is the record.
- **Not done / open.** The user's eye on the strip (the floor of 27 for ~0.3 s: does it read as the drop or as a stall?) and on the
  ring through an empty pool. Whether `DROP_V`'s impulse should also ride `mapDropEvt`'s frame on the SCENE side (it does — the
  grammar's impulse and the scene's ring now land on the same frame). The `at=80` first-frame `mapDropEvt` (above) if anyone starts a
  take mid-track on a FLUID night. Live mode is unchanged by construction and unseen here: on a live night the clear is still the
  detector's call alone.


## §108 the harmonic channels — a dye floor from `mid` and chord shears from the v1 `snare` level; the take replayed (2026-10-09, one worker; FLUID-DIAG-2026-10-09 §9 proposals 1 + 2; the user on his recording: *"don't see first viz elements till 12 seconds in but there is sound. Then at 17/18s it seems like is working, but then at 19 seems to miss the same sounds"*; the user: *"start"*)

- **The report and the root cause** (`docs/plans/FLUID-DIAG-2026-10-09.md`, the take `retinarave-v0.34-fluid-2026-10-09T14-50-22.webm`:
  capture mode, a pad / bass-chord piece — sub 0 %, bass 20 %, low-mid 75 %, mid 4 %, high 0 %, two clickless 42 Hz kick tails in
  22 s). The grammar maps sub, kick, snare, hats, drop, beat — **it had no channel for pads, chords, mids or vocals, 95 % of that
  track**: on the take the only channel that fired was the snare lane, six floor-sized hits, **0 splats on 17 of 22 seconds**. The
  19–21 s "miss" was the same lane under its fixed 3.75 dB rise (the chord attacks rose 2.5–2.9 dB) with the 18.7 s ink still moving
  on screen. Not warm-ups, not gates, not a refractory (DIAG §8).
- **What changed.** `core/fluid/inject.js` — two channels, two reads (`FLUID_FEATS` 36: `mid`, `snare`), six `K` rows, two state
  fields (`snarePrev`, `chordLeft`), `plan()` returns `floor` and `chord` for the replay ruler.
  (1) **The harmonic floor**: while `mid` is above a knee (`sstep(FLOOR_LO .15, FLOOR_HI .40, mid) · mid` — `mid` is
  `pow(band(150–2000 Hz)/peak, .7)·presence`, so silence reads 0 and a residue stays under the knee), one splat per frame at the
  KEY's sector on the circle of fifths (`(sectorPc(key) + ½)/12` — the sub emitter's x rule on the tonic instead of the bass note),
  y 0.5, radius ×2, ink `FLOOR_DYE 0.004 · level · g · 60·dt` (a quarter of the sub's 0.015; ≈ 0.24 at the mouth at `dyeDiss` 1), in
  the key's hue, **dx = dy = 0** — dye only, never a velocity. On the take `mid` reads .84–.99 from 3 s: the pool shows the music's
  level and the key's colour from the first second of sound, and the attacks' shears land in ink that is already there.
  (2) **Chord shears**: the v1 `snare` level (the extractor's mid-band flux peak, 0.13 s decay — the field whose rises matched the
  truth's chord attacks at 19.42 / 20.16 s on the take) rising by more than `CHORD_RISE 0.05` in one frame with no `snareEvt` on it
  → the snare's two shears at `(0.3, 0.5)` / `(0.7, 0.5)`, `±CHORD_V 0.18 · Δsnare` (SNARE_V × 0.3 — a third of the lane's force,
  sized by the rise: Δ .27–.88 on the take → 0.05–0.16 uv/s against the lane's 0.19–0.26 at amp .31–.44), ink `CHORD_DYE 0.08 · Δ`;
  one refractory `CHORD_REF 0.15 s` armed by a chord shear OR a `snareEvt`, so a sustained chord is one attack (the level is a peak
  hold, it rises once) and a snare is never doubled by its own rise on the frame after. The lane's hit keeps its full size.
  `core/fluid/fluid.js` — the splat pass skips the velocity draw for a chunk with no force in it (the floor on a pad is the frame's
  only splat), and `CARD.fluid.K` exposes the grammar's constants for a one-knob A/B from an eval. `tools/test_fluid.js` **83 ok**
  (+27: the floor's splat, knee, silence, 120 pad frames with Σ|v| 0, the §107 clear holding it < 5 %; the chord's two shears, the
  force, the ink, the refractory, a held level, a `snareEvt` frame, a sub-threshold rise, silence, the feats). `tools/fluid-replay.js`
  (the DIAG's replay promoted: `plan()` over a filetrace JSON, per second / events / frame, `FLUIDK=` for an A/B) and
  `tools/rec-strip.sh` (the recording replay ruler, HARNESS "## Fluid"). Docs: CONTRACTS §1.1 (the grammar sentence), HARNESS "## Fluid"
  (the node bullet, the ruler), this section.
- **The take, before and after** (`tools/work/fluid-diag/rec-live.json` — the DIAG's cold `&map=0` trace of the take's audio on the
  live lanes, replayed through `plan()`; `before` = `FLUIDK='{"FLOOR_LO":9,"FLOOR_HI":10,"CHORD_RISE":9}'`, the two channels out of
  reach; rec Y / p99 = the take's own frames at 2 fps (PIL `convert('L')`, mean and p99 of the whole frame); headless = the same audio
  served as `&track=rec&map=0&scene=12` cold under `CLOCK=1` on this machine, `tools/rec-strip.sh`, mean / p99 of the shot on the
  second; the empty pool reads 22 here at the ladder's bottom, 24–26 with the exposure up):

  | s | mid | snare lane (amp) | before: splats · Σ\|dv\| | after: chords (Δsnare) · floor ink/s · splats · Σ\|dv\| | the take Y / p99 | headless before Y / p99 | headless after Y / p99 |
  |---|---|---|---|---|---|---|---|
  | 2 | 0.28 | 3 (0.74 1.00 1.00) | 125 · 3.74 | 2 (0.32 0.16) · 0.035 · 156 · 3.82 | 16 / 29 | 16 / 21 | 16 / 21 |
  | 3 | 0.95 | 0 () | 9 · 0.49 | 0 () · 0.187 · 69 · 0.49 | 19 / 32 | 22 / 90 | 22 / 90 |
  | 4 | 0.98 | 0 () | 0 · 0.00 | 1 (0.51) · 0.292 · 62 · 0.13 | 26 / 40 | 22 / 61 | 22 / 61 |
  | 5 | 0.94 | 0 () | 0 · 0.00 | 1 (0.47) · 0.266 · 62 · 0.14 | 29 / 42 | 22 / 45 | 22 / 51 |
  | 6 | 0.84 | 0 () | 0 · 0.00 | 0 () · 0.238 · 60 · 0.00 | 30 / 41 | 22 / 33 | 22 / 44 |
  | 7 | 0.98 | 0 () | 0 · 0.00 | 1 (0.28) · 0.252 · 62 · 0.09 | 29 / 38 | 22 / 29 | 23 / 44 |
  | 8 | 0.99 | 1 (0.34) | 2 · 0.35 | 1 (0.56) · 0.335 · 64 · 0.52 | 29 / 37 | 22 / 29 | 23 / 45 |
  | 9 | 0.98 | 0 () | 0 · 0.00 | 0 () · 0.328 · 60 · 0.00 | 29 / 38 | 24 / 65 | 25 / 78 |
  | 10 | 0.67 | 0 () | 0 · 0.00 | 1 (0.34) · 0.231 · 62 · 0.11 | 29 / 38 | 24 / 61 | 26 / 86 |
  | 11 | 0.69 | 1 (0.44) | 2 · 0.46 | 0 () · 0.251 · 62 · 0.46 | 28 / 37 | 24 / 61 | 26 / 89 |
  | 12 | 0.83 | 0 () | 0 · 0.00 | 0 () · 0.304 · 60 · 0.00 | 29 / 82 | 25 / 85 | 28 / 110 |
  | 13 | 0.97 | 0 () | 0 · 0.00 | 1 (0.27) · 0.358 · 62 · 0.09 | 29 / 103 | 26 / 80 | 28 / 111 |
  | 14 | 0.98 | 0 () | 0 · 0.00 | 1 (0.88) · 0.365 · 62 · 0.28 | 30 / 75 | 26 / 77 | 28 / 115 |
  | 15 | 0.91 | 0 () | 0 · 0.00 | 0 () · 0.334 · 60 · 0.00 | 30 / 55 | 26 / 72 | 29 / 116 |
  | 16 | 0.95 | 0 () | 0 · 0.00 | 1 (0.38) · 0.282 · 62 · 0.12 | 30 / 44 | 26 / 67 | 30 / 115 |
  | 17 | 0.94 | 1 (0.34) | 2 · 0.37 | 2 (0.36 0.86) · 0.334 · 66 · 0.77 | 30 / 40 | 26 / 62 | 30 / 109 |
  | 18 | 0.86 | 1 (0.40) | 2 · 0.44 | 0 () · 0.267 · 62 · 0.44 | 31 / 88 | 26 / 62 | 30 / 103 |
  | 19 | 0.89 | 0 () | 0 · 0.00 | 1 (0.75) · 0.292 · 62 · 0.25 | 32 / 104 | 26 / 62 | 29 / 81 |
  | 20 | 0.87 | 0 () | 0 · 0.00 | 1 (0.55) · 0.287 · 62 · 0.18 | 32 / 97 | 26 / 49 | 28 / 62 |
  | 21 | 0.84 | 0 () | 0 · 0.00 | 0 () · 0.259 · 60 · 0.00 | 34 / 112 | 26 / 39 | 27 / 52 |
  | 22 | 0.55 | 0 () | 0 · 0.00 | 0 () · 0.216 · 60 · 0.00 | 33 / 86 | 26 / 34 | 27 / 51 |
  | 23 | 0.57 | 2 (0.43 0.36) | 4 · 0.86 | 0 () · 0.199 · 64 · 0.86 | 29 / 55 | 26 / 34 | 27 / 52 |
  | 24 | 0.81 | 0 () | 0 · 0.00 | 0 () · 0.123 · 25 · 0.00 | 31 / 121 | 27 / 94 | 28 / 96 |

  **Seconds with any injection, 3–24 s: before 6 of 22 → after 22 of 22** (the floor on every second of sound, a chord shear on 11 of
  them; Σ|dv| injected 3–24 s: 2.5 → 4.5 uv/s, the floor adds none). The chord channel fires at 19.417 (Δ .75) and 20.150 (Δ .55) —
  the two attacks the user heard "missed" — and at 17.533 (Δ .36) / 17.900 (Δ .86), the frame before the lane's own 17.917 hit (the
  level rises on the hop before the lane confirms, as §57 measured; the lane's hit is never gated, only the chord is, so both land —
  0.139 then 0.19 uv/s, one frame apart — and the lane's event then arms the refractory). It fires once on the silence step (2.5 s, Δ .32 at
  g .15) and never on the 2.03 s digital-zero ghost (`g` 0).
  **The grey line** (whole frame, headless, per second 3 → 24 s): before **22 22 22 22 22 22 24 24 24 25 26 26 26 26 26 26 26 26 26 26 26 26**,
  after **22 22 22 23 23 23 25 26 26 28 28 28 29 30 30 30 29 28 27 27 27 28** — the mean moves 1–4 levels (one cloud at one sector
  is 5 % of the frame); the p99 is where the floor shows: before **90 61 45 33 29 29 65 61 61 85 80 77 72 67 62 62 62 49 39 34 34 94**,
  after **90 61 51 44 44 45 78 86 89 110 111 115 116 115 109 103 81 62 52 51 52 96** — from 5 s the p99 sits 15–50 levels above
  the empty pool's 29–34 where it sat at 29 before, and 103–116 through 12–17 s (the cloud fed at 0.3 dye/s against `dyeDiss`
  .13–.20 in the void), then 52 against 34 at 21–23 s. The floor's ink is the difference between "flat grey, nothing" (DIAG §5, s4–s10)
  and a lilac cloud at the key's sector that the 11.6 s shears then stir.
- **The eye** (`tools/accept/v0.35/fluid-s108-rec-strip.jpg` — per half second, rec | before | after, 0–24 s; the take's own frames from
  `ffmpeg -vf fps=2`, the headless frames from `tools/rec-strip.sh`): 0–2.5 s nothing on all three (digital silence; the "RETINA RAVE"
  card on the headless at 0 s is the landing before the track opens); 3–4 s the start burst's blue droplets on both headless columns
  (the silence-step artefact, DIAG §7.3) — and from **3.5 s a magenta cloud at the right in the after column** that the before column
  never has, growing to 8 s while the before stays flat; 9–11 s the floor cloud beside the first lilac pair (the 8.6 s floor hit that
  the take did not show — DIAG §4); 11.5–17 s the take's lilac pair / the headless pair, with the after column's cloud lit cream-white
  where the shears' ink meets it; 18–20 s the take's bright magenta pairs — the after column has the same pairs AND a stirred cloud,
  the before only the pairs; 19–21 s the after's shears at 19.4 / 20.2 s visible as the pairs' edges moving where the before's are
  advected only. The colours differ between the take and the headless (the key anchor's hue and its timing: capture `SYNC_OFS` vs
  `DET_LEAD`, the 2 s ema — DIAG §3) and the aspect differs (1282×1310 portrait vs 1280×633); the placements agree to the half second.
- **The md5 re-base — and what moved it.** All 26 lines of `tools/accept/v0.35/scene-md5-v035.txt` moved, as the DIAG said a velocity
  channel would; `trans-mixs-md5.txt` (`1ccfd0c1` → **`1c487222`**) and `gielis-still-md5.txt` (`3edc1fbc / b3c0dda0` → **`aadb70d9 /
  81039422`**) with them — each measured twice (PORTs 8903 / 8904 for the list, `cmp` equal; 8914 twice for the other two), errs []
  hop 840 row 72 on every id, re-based in place. The `&fluid=0` list (PORT 8905) **= `tools/accept/v0.34/scene-md5-v034.txt` line for
  line (24 of 24)**, s12's idle pair `70405a78 / f048c5a2` as before. **But the fake timeline cannot fire the chord channel as
  written**: its `snare` level jumps to 0.7 on the same beat crossings its lattice sets `snareEvt` (fake.js, §83), and a node replay of
  `fakeMusic` through `plan()` gives 0 chord fires in 840 frames. The in-page A/B through `CARD.fluid.K` on s0 (an eval at
  `__FRAME>=1`, then f360 / f840): chord off → **`f82a9174 / 6abfd71e`, the §105 pair to the byte**; floor off → still moved; both
  off → the §105 pair. So the chord DID fire in the page, and a `CARD.TRACE` of the fake (CLOCK=1, 839 frames) says why: `snareEvt`
  and `kickEvt` are **0 on every frame**, including the seven beat frames where `snare` jumps 0.7 — `features-ears.js`'s `earsStage`
  zeroes `EVT` (`kickEvt, snareEvt, hatEvt, subNoteEvt, subIn, subOut`) on every frame BEFORE its `ENGINE.fakeOn` return, and the
  stages run after `fake.update`. **The §83 lattice's events have never reached MS at the step or at any scene** (DUST's `kickEvt`
  voice, TORUS2's and CHLADNI's event-fired attacks all see `false` on the fake; the ages and `*Amp` do get through — they are not in
  `EVT`); the same early clear is why §107 found `mapDropEvt` never set on the fake. On what the fake actually publishes — a level
  that rises with no event — the chord rule is right to fire, and that is the whole of the 26-line move. The defect is left as found
  (open, below): fixing the clear moves every line again for a reason unrelated to this step and changes what three roster scenes do
  on the fake. The old → new table (f360 / f840):

  | id | scene | v0.35 (§105–§107) | §108 |
  |---|---|---|---|
  | s0 nav2 (home) | `f82a9174` / `6abfd71e` | `6930dffc` / `af295f18` |
  | s1 dust | `9d7f4504` / `5b06a809` | `2a2f5da8` / `46a6a8cd` |
  | s2 mandala | `e87cfa4b` / `ee7956e3` | `39004d77` / `feb58038` |
  | s3 torus2 | `e6fffff8` / `8d3635a8` | `f3c8f96f` / `00c14a4a` |
  | s4 drum | `45b27bc9` / `2bf0e217` | `704bbe0b` / `5cd068da` |
  | s5 polytope | `3c8d8ac7` / `dc9e5783` | `5d6307e1` / `0397295f` |
  | s6 feigen | `73b7b0ea` / `3fc6a766` | `b1a656e9` / `09743c0e` |
  | s7 torus-v1 | `c1c0afa7` / `3ce3f944` | `d600f191` / `c296ac6d` |
  | s8 nav (control) | `83c30184` / `b6257fe5` | `3ce7343e` / `fca2f0b4` |
  | s9 maxwell | `839f3210` / `fd7851f6` | `4aad2187` / `8fd11445` |
  | s10 gielis | `6e51a957` / `cbc891d7` | `a580cb9c` / `71e64c55` |
  | s11 chladni | `d05204e5` / `347c6284` | `967354f1` / `4029b81b` |
  | s12 fluid | `13e9acae` / `85cd3023` | `1d7f9f90` / `94040549` |

  The velocity-skip in `fluid.js` was written on the first hypothesis (a zero-force splat re-sampling the field) and the A/B killed
  it: the s0 pair is identical with and without the skip, so a `+ 0` re-write is bit-exact on this GPU. It stays as a guard — "dye
  only" now means the velocity target is not drawn at all on a pad frame — and its comment says it is not a fix.
- **The roster trails** (`tools/accept/v0.35/fb-s108-s{0,3}-{groove-35,build-100}.jpg` against §105's `fb-advect1-*` pairs; mean |Δ|
  grey, % of pixels > 8): HOME groove **1.44 / 3.9 %**, build **2.58 / 7.3 %**; TORUS2 groove **3.42 / 11.7 %**, build **3.23 / 11.5 %**
  — the §105 pairs were 2.1–4.8, so the chord shears (0.05–0.16 uv/s impulses at mid height, 1–2 per second on SeeYouDrop) move the
  trails by less than the advection itself did. Two runs of a pair: |Δ| 0.00. FLUID's own shots (`fluid-s108-{intro-10, groove-35}.jpg`
  against §106's): intro **1.62 / 5.2 %** — the hat droplets as before and a soft lilac floor cloud at the centre (the key's sector)
  where §106 had the empty pool; groove **7.61 / 25.4 %** — the sub's blue-teal column and the stirred pool carry the frame as
  before, the floor is one more cloud at the sector: not drowned (the eye, both shots).
- **The numbers** (this machine, headless `GPU=1`, 1280×633; the user's desktop Chrome at 44 % CPU, Slack and gnome-shell loaded it
  through this step — NAV read 4.7 ms against §104's 1.4, so only pair ratios compare). `check.js` 0 fail / 8 warn (the pre-existing
  soft caps); `npm test` exit 0, `test_fluid` 83 ok; `license.js --check` 181 public files, 0 missing. Help: `rows()` **209** = the
  non-internal FEATS count (no new entry); part B's substrate line gained `mid, snare` (data). Parity fake (ACC v0.35): max
  7.852214593751443, 72 fields, the §102 `nav.*` line to the digit. Monitor 60 s on `test&track=SeeYouDrop&at=25&scene=12` (`CARD.NAV =
  REG[12].scene.state`, 25 → 86.5 s across drop 1): **`n 3197 fast 0 max .0117 viol []`**, errs [], bad []; on the home (`test&fake=0`):
  **`n 3045 fast 3 max .0896 viol []`**, errs [], bad [] — both at tier 0 / q 0 under the load (the gate is `viol []`). **Bench** (q
  pinned .95, tier 3, sim 259×128, dye 1035×512, three interleaved pairs `benchFluid(300)` / `bench(0, 300)`, the fake): the
  substrate step **2.68 / 2.66 / 3.41 ms** against NAV 4.98 / 4.66 / 4.66 → median 2.68, **ratio 0.58** (§104: 0.58 ms at ratio
  0.43); the floor alone, interleaved on / off in one page through `CARD.fluid.K`: **2.24 / 2.69 / 2.34 vs 1.50 / 2.08 / 1.91 ms**
  → +0.43 ms here, ≈ +0.13 ms at §104's clock — one more 1035×512 dye draw on a frame that had no splat. On the FAKE 812 of 840
  frames had none (its `subGate` is 0); on music the sub emitter runs that pass every frame already, so the floor's cost there is
  one more term in a draw that is paid. Against the 1.0 ms budget: 0.58 × 1.4 ≈ 0.8 ms under §104's conditions — inside, by less
  than before; to be re-measured on an idle machine. CPU `CARD.fluid.ms` 0.09.
- **Not done / open.** (1) **The §83 lattice events never reach the scenes** (above): `earsStage` zeroes `EVT` before its `fakeOn`
  return — a one-line move of the clear under the return would publish them and move every md5 line, plus DUST / TORUS2 / CHLADNI's
  event voices on the fake; the orchestrator's call, not this step's. (2) The user's eye on the take replay and on SeeYouDrop:
  the floor's amount (0.004 — a quarter of the sub's), its radius (×2), whether a cloud at the key's sector reads as "the music"
  or as "the lights are on" (DIAG §9.1's open question), and the chord shears' force (a third). (3) The bench on an idle machine.
  (4) Proposals 3–6 of the DIAG (the bass lift from the v1 `kick` level, a `high` sparkle for the scene, the void rule latched on
  drums, the ears' start guard) are not built. (5) The take's colours differ from the headless replay's (the key anchor's timing
  in capture vs file-det, DIAG §3) — the ruler places events, it does not reproduce the hue. (6) `accept.sh` in full not run; its
  md5 references are the re-based ones above. Nothing pushed.

## §109 real-music acceptance — the fake events reach the scenes, and every proof moves onto the library (2026-10-09, one worker; the user: *"defect -> test uses fake data and not actually validating things in the scene? -> test should be real and simulate what would normally happen when visualizing music"*; then *"tune and test with all the real songs"*; then *"can ignore malicious until I validate the ruler"*)

- **The defect.** §108 found it and left it open: `features-ears.js`'s `earsStage` zeroed `EVT` (`kickEvt, snareEvt, hatEvt, subNoteEvt,
  subIn, subOut`) on every frame BEFORE its `ENGINE.fakeOn` return, and `fake.update` (the §83 percussion lattice, which writes the three
  percussion events) runs before the stages — so on the `#test` fake timeline no lattice event had ever reached a scene or the substrate's
  step (the ages and `*Amp` got through; they are not in `EVT`). And the whole identity harness — the scene md5 lists, parity, the
  continuity recipes, the director's fake trace, the chain smoke — ran on that timeline under `CLOCK=1`: the references proved pixel
  identity against a timeline that is not music, and that could not fire a kick. The user's reading is the right one: the proof has to be
  what the engine and the scenes do when music plays.
- **The fix** (`a96f21e`): on `fakeOn` the stage clears only the three sub events (which the fake never sets) and returns; the lattice's
  `kickEvt / snareEvt / hatEvt` stand. One branch, no other path touched (the real path clears `EVT` as before, after the fake return).
  **What moved:** the kick's impulses and the snare's shears now fire on the fake at the substrate's step, and the feedback pass rides that
  velocity, so EVERY line of the fake list moved (`tools/accept/v0.35/scene-md5-v035.txt`, re-based in place, `GPU=1 PORT=8911
  tools/scene-md5.sh s109a` and `s109b` byte-equal, errs [] hop 840 row 72 on every id); the `&fluid=0` list is its own file now
  (`scene-md5-v035-fluid0.txt`): v0.34's 24 lines with **s0, s3 and s11 moved** — NAV2 (`kickEvt / snareEvt`), TORUS2 (the snare wave on
  `snareEvt`) and CHLADNI (the sand throw on `kickEvt`), the three scenes whose event voices fire on the lattice now — and s12's idle pair
  `70405a78 / f048c5a2`; DUST and MANDALA read the events too and did NOT move (their voices, `math/voice.js`, fire on the union of the
  event and the v2 level's edge with a refractory, and the level's edge had already fired). `trans-mixs` `1c487222 → fb6010b0`,
  `gielis-still` `aadb70d9 / 81039422 → e8dd5f0a / b996f158` (each twice, equal). `parity.js fake`: MS 0 diff, the §83 `nav.*` MISMATCH
  line to the digit (`max 7.852214593751443 · 72 fields`) — the control navigator (id 8) reads only `dropLiveEvt`. The old → new table:

  | 0 | NAV2 (home) | 6930dffc / af295f18 | b76fb74e / a75534d1 |
  | 1 | DUST | 2a2f5da8 / 46a6a8cd | 6e33c1fd / 4a4663bf |
  | 2 | MANDALA | 39004d77 / feb58038 | 4de23806 / 6ae629d0 |
  | 3 | TORUS2 | f3c8f96f / 00c14a4a | bb79bda7 / 0e40bfac |
  | 4 | DRUM | 704bbe0b / 5cd068da | 5254d9d1 / 1d249693 |
  | 5 | POLYTOPE | 5d6307e1 / 0397295f | fa18b61e / 66d9eaff |
  | 6 | FEIGEN | b1a656e9 / 09743c0e | b4b5ca05 / 15cbef2d |
  | 7 | TORUS v1 | d600f191 / c296ac6d | 9ffb7d02 / 2a730c0d |
  | 8 | NAV (control) | 3ce7343e / fca2f0b4 | 98f95f35 / 89497847 |
  | 9 | MAXWELL | 4aad2187 / 8fd11445 | c7192b7d / ecc84a13 |
  | 10 | GIELIS | a580cb9c / 71e64c55 | 6d70690a / 77e19182 |
  | 11 | CHLADNI | 967354f1 / 4029b81b | 1ddf4113 / c2d305fb |
  | 12 | FLUID | 1d7f9f90 / 94040549 | bf9bcc3e / 35e85096 |

- **The advection comes OFF the roster (the user, on the §105 look: *"I don't like the fluid dynamics effecting the other scenes (I think is
  the advection?) -> ie. nav, particles, torus, etc."*).** `assets/effects/feedback.js`'s `post.fb.advect` default 1 → **0**: every scene
  runs the v0.2 scalar program unless it opts in, and only FLUID does (`scenes/fluid/index.js` keeps `post.fb.advect 1` — it shows the dye,
  so its trail riding the current is the point); `&post=<scene>.fb.advect=1` is the one-run A/B of the §105 look on any scene, the panel's
  fifth post param unchanged (`manual-smoke.js` 46 / 0). CONTRACTS §1.4 and §3 say "off by default, FLUID opts in"; HARNESS "## Effect
  chain" and "## Fluid" re-anchor the identity claim: with advect 0 the fake smoke list equals the `&fluid=0` list on every line but s12's
  (`GPU=1 PORT=8911 tools/scene-md5.sh s109adv0a` / `b`: byte-equal twice; the 24 roster lines = the `&fluid=0` list to the byte, s12 `bf9bcc3e / 35e85096` unchanged — against v0.34 only s0 / s3 / s11 (the lattice events) and s12 differ), `trans-mixs` `fb6010b0 → 9632647d` (not v0.34's 724bbd72: NAV2 and TORUS2 fire their event voices on the fixed fake; twice, equal), `gielis-still` back to §83's `b7d52757 / ca912a8d` exactly (GIELIS reads no event and no velocity: the pair had only ever moved through the advected trail; twice, equal); the opt-in path alive: `IDS=1 tools/scene-md5.sh s109optin '&post=dust.fb.advect=1'` gives `6e33c1fd / 4a4663bf`, the fake-events list's s1 pair before the flip, to the byte. The
  §105 / §108 roster |Δ| numbers and the `fb-advect*` / `fb-s108-*` strips are history: the roster never saw the current after §109.
  Run B's roster lines (shot with advect 1) were discarded; the roster's real references below were shot after the flip.
- **The rule (HARNESS "Real-music acceptance", CONTRACTS §1.18's first sentence):** a scene or engine change is proven on real tracks;
  the fake lists are a smoke test. The library is the proof: all seven tracks (`~/Music/RetinaRave`: Comptine, CyborgNinja, IBelongHere,
  Malicious, SeeYouDrop, Vienna, WhoLikesToParty) and the user's pad take, each in BOTH map modes (`&map=1` the file map, `&map=0` the
  live lanes on the same audio — what capture / mic / a take run on; the take `&map=0` only). **Malicious is in every sweep and every
  trace for the record but is NOT a gate** (windows.json `gate: false`; its FAILs print as notes, its claims as notes) — the user is yet to
  validate the map's sub ruler on it.
- **The windows** (`tools/truth/windows.py` → `windows.json`, committed): per track, from its own `trackmap.py` truth, the way §104 chose
  SeeYouDrop's — intro (at 0, 10 s) · groove (the loudest 30 s + 10) · quiet (the sparsest 10 s by the 5 s slices' onset density) · build /
  drop 1 and 2 (5 s before and ON each bar-pinned truth drop; CyborgNinja has none → its first two section boundaries) — one run per `at`
  (windows sharing an `at` share the run), `frame = 2 + round((t − at)·60)`; and a 60 s `rulers` window from 20 s before the loudest 30 s.
  33 runs, 49 shots per scene per mode in full. `trackmap.py WhoLikesToParty` re-run at the user's grains: byte-identical to the committed truth.
- **The identity references** (`tools/real-md5.sh`, HARNESS): `tools/accept/v0.35/real-md5-v035.txt` — 232 lines, the DEFAULT scope
  (the roster + FLUID, ids 0 1 3 12 × every track × both modes × intro / groove / build1 / drop1, + the take's intro / chords), measured
  with the advection off the roster: the roster's 174 lines twice (`v035r1` PORT 8921 PAR 1, `v035r2` PORT 8931 PAR 2), **cmp-equal**,
  FLUID's 58 from the full default run (`v035b`, PORT 8931; FLUID keeps `post.fb.advect 1`); `f0` 2, errs [] bad [] on every run. Every
  roster line differs from the same shot with the §105 advection on (174 / 174 moved against `v035a` / `v035b`). Wall, the default scope:
  **2884 s** for the 156 runs on one lane (`v035b`; `v035a` took 4336 s under three other lanes), the roster alone 2171 s on one lane, 1441 s with `PAR=2` —
  18.5 s per run. `FULL=1` (every id, every window: 845 runs, 809 k frames) was NOT run (the user: *"don't do full sweep"*); from the
  measured cost it is ≈ 4.3 h on one lane, ≈ 2.2 h with `PAR=2` — so the default is the roster + FLUID, the full matrix behind the flag (and `PAR=2` halves either: two lanes on PORT / PORT+1, the md5s unchanged — rule 1 holds the clock through the decode under
  load; the debug port is `PORT + 1000` since §109 so two lanes can never attach to one Chrome, HARNESS rule 4).
- **The behaviour rulers** (`tools/real-rulers.sh` → `tools/accept/v0.35/real-rulers-v035.txt`): one deterministic run per scene × track on
  the `rulers` window through `lumtrace.js --jump=1 --mon=1` — the luminance ruler (10 fps), the PICTURE's continuity on every frame (the
  monitor's spike rule, d > 0.06 and > 2.5× the previous frame + 0.01, on the whole-frame mean |ΔY| at 160 px, outside the scene's DECLARED
  cuts — `scene.cuts`: 'continuous' → only a drop; 'onset' → + onset / beat / the three events; 'event' → + section / boundary / surprise /
  identify / resolve / beat / onset / kickEvt — and the state's own declared cuts where it has a monitor-shaped state, with the monitor's
  0.3 s grace; black frames), and the continuity monitor on the scene's OWN state (`CARD.NAV = REG[id].scene.state`: nav2, nav, gielis,
  chladni, fluid have one; the monitor is frame-timed under `CLOCK=1` since §109, so two runs give the same `viol`). FAIL: mon viol · jump
  viol · black > 5 % · clipFrac ≥ .25 on > 2 % · errs / nonFinite. The table (default scope; the roster's 24 rows re-run on advect 0 — 1652 s with `PAR=2` —, FLUID's 8 from the advect-1 run of
  all 32 — 1894 s; the state monitor's numbers are identical across the flip, the pixel numbers moved by thousandths, the verdicts did not):

  ```
  id  scene     track           window    cuts       | frames clip25 medY   grad   | jumpN jumpMx jviol black | monN  monMx  mviol | verdict
  0   nav2      Comptine        11-71     event      | 600   0     0.154  0.0141 | 3599  0.056  0     0     | 3599  0.0286 0     | ok
  0   nav2      CyborgNinja     118-178   event      | 600   0     0.194  0.0133 | 3599  0.011  0     0     | 3599  0.0702 0     | ok
  0   nav2      IBelongHere     159-219   event      | 600   0     0.158  0.0151 | 3599  0.036  0     0     | 3599  0.0474 0     | ok
  0   nav2      Malicious       115-175   event      | 600   0     0.167  0.0160 | 3599  0.052  0     0     | 3599  0.0551 0     | ok
  0   nav2      rec             0-24.4    event      | 245   0     0.114  0.0145 | 1464  0.012  0     2     | 1464  0.0345 0     | ok
  0   nav2      SeeYouDrop      40-100    event      | 600   0     0.202  0.0149 | 3599  0.038  0     0     | 3599  0.0672 0     | ok
  0   nav2      Vienna          125-185   event      | 600   0     0.201  0.0167 | 3599  0.055  0     0     | 3599  0.0364 0     | ok
  0   nav2      WhoLikesToParty 8-68      event      | 600   0     0.156  0.0131 | 3599  0.035  0     0     | 3599  0.0746 0     | ok
  1   dust      Comptine        11-71     onset      | 600   0     0.132  0.0138 | 3599  0.046  0     42    | -     -      -     | ok
  1   dust      CyborgNinja     118-178   onset      | 600   0     0.195  0.0100 | 3599  0.000  0     11    | -     -      -     | ok
  1   dust      IBelongHere     159-219   onset      | 600   0     0.177  0.0107 | 3599  0.035  0     391   | -     -      -     | FAIL black 391
  1   dust      Malicious       115-175   onset      | 600   0     0.143  0.0113 | 3599  0.065  0     20    | -     -      -     | ok
  1   dust      rec             0-24.4    onset      | 245   0     0.000  0.0001 | 1464  0.000  0     1409  | -     -      -     | FAIL black 1409
  1   dust      SeeYouDrop      40-100    onset      | 600   0     0.253  0.0124 | 3599  0.109  0     8     | -     -      -     | ok
  1   dust      Vienna          125-185   onset      | 600   0     0.220  0.0121 | 3599  0.140  1     9     | -     -      -     | FAIL jump viol [[184.35,0.14,0.046]]
  1   dust      WhoLikesToParty 8-68      onset      | 600   0     0.151  0.0115 | 3599  0.025  0     13    | -     -      -     | ok
  3   torus2    Comptine        11-71     continuous | 600   0     0.120  0.0132 | 3599  0.053  0     17    | -     -      -     | ok
  3   torus2    CyborgNinja     118-178   continuous | 600   0     0.171  0.0168 | 3599  0.086  1     14    | -     -      -     | FAIL jump viol [[121.133,0.086,0.019]]
  3   torus2    IBelongHere     159-219   continuous | 600   0     0.119  0.0156 | 3599  0.070  2     22    | -     -      -     | FAIL jump viol [[189.783,0.065,0.022],[196.9,0.07,0.02]]
  3   torus2    Malicious       115-175   continuous | 600   0     0.144  0.0171 | 3599  0.088  0     20    | -     -      -     | ok
  3   torus2    rec             0-24.4    continuous | 245   0     0.078  0.0137 | 1464  0.033  0     29    | -     -      -     | ok
  3   torus2    SeeYouDrop      40-100    continuous | 600   0     0.103  0.0132 | 3599  0.089  4     27    | -     -      -     | FAIL jump viol [[42.417,0.089,0.014],[43.217,0.084,0.024],[44.217,0.075,0.02],[76.8,0.082,0.021]]
  3   torus2    Vienna          125-185   continuous | 600   0     0.135  0.0159 | 3599  0.066  0     19    | -     -      -     | ok
  3   torus2    WhoLikesToParty 8-68      continuous | 600   0     0.092  0.0126 | 3599  0.099  4     30    | -     -      -     | FAIL jump viol [[12.383,0.099,0.021],[13.15,0.097,0.019],[19.567,0.082,0.019],[53.417,0.065,0.022]]
  12  fluid     Comptine        11-71     continuous | 600   0     0.114  0.0089 | 3599  0.028  0     0     | 3599  0.0176 0     | ok
  12  fluid     CyborgNinja     118-178   continuous | 600   0     0.231  0.0244 | 3599  0.076  0     0     | 3599  0.0045 0     | ok
  12  fluid     IBelongHere     159-219   continuous | 600   0     0.168  0.0124 | 3599  0.033  0     0     | 3599  0.0184 0     | ok
  12  fluid     Malicious       115-175   continuous | 600   0     0.119  0.0069 | 3599  0.040  0     0     | 3599  0.0162 0     | ok
  12  fluid     rec             0-24.4    continuous | 245   0     0.061  0.0014 | 1464  0.009  0     0     | 1464  0.007  0     | ok
  12  fluid     SeeYouDrop      40-100    continuous | 600   0     0.205  0.0199 | 3599  0.030  0     0     | 3599  0.0042 0     | ok
  12  fluid     Vienna          125-185   continuous | 600   0     0.135  0.0088 | 3599  0.018  0     0     | 3599  0.005  0     | ok
  12  fluid     WhoLikesToParty 8-68      continuous | 600   0     0.219  0.0206 | 3599  0.065  0     0     | 3599  0.0145 0     | ok
  real-rulers v035: the roster (0 1 3) on advect 0 — 24 rows, 1652 s wall with PAR 2 — + FLUID (12) — 8 rows, from the 32-row run (1894 s): 7 FAIL, all findings
  ```

  **7 FAIL, every one a finding, none retuned** (the open list below): NAV2 and FLUID are clean on every track and the take
  (mon viol [] and jump viol [] on all 16 rows — FLUID's state monitor max 0.004–0.018, its picture max 0.009–0.076; NAV2's state max
  0.029–0.075, its picture max 0.011–0.056); DUST FAILS three rows and TORUS2 four. Two runs of a row are byte-identical (s3 × SeeYouDrop
  twice, csv and json cmp-equal — the monitor is frame-timed under `CLOCK=1` since §109).
- **The traces and the node tests on music** (`tools/traces.sh`, `tools/test_music.js`, `tools/test_fluid.js`'s `music` block; `6b9518c`):
  every recordable MS field per frame of a deterministic cold-start run, 0 → 110 s, 15 traces (7 tracks × 2 modes + the take), 16 MB each,
  gitignored, ~2 min each; two recordings cmp-equal — after the cold-start fix in `filetrace.js` (the recorder started after the open gate
  caught frame 2, 3 or 4: two recordings of the take differed by one frame; now it starts before the gate, the rows before frame0 are
  trimmed, the header is re-read from the engine; HARNESS "File source"). `npm test` exit 0 (`test_fluid` 125 ok, `test_music` 129 ok,
  11.6 s). Per track (both modes agree unless said):
  - **the grammar injects on 100 % of the seconds with music on every trace** (110 / 110 on each track, 21 / 21 on the take; the ≥ 95 % gate);
    a frame with presence 0 moves and inks nothing (the take's 150 silent frames, IBelongHere's 4, WhoLikesToParty's 2–3); the clear is armed ON
    every `mapDropEvt / dropLiveEvt` frame and held a beat on every trace (Comptine 5 + 4, IBelongHere 3, SeeYouDrop 4 + 2, Vienna 1 + 1,
    WhoLikesToParty 2 + 1); SeeYouDrop's map drops `57.606 → 57.617`, `105.596 → 105.600` (within one frame); the take 22 / 22 from 3 s.
  - **the clock** (`bpm`, the PCM clock) against the truth tempo: Comptine 108.29 = 214.3 × ½ · CyborgNinja 160.04 (162.2) · IBelongHere 118.02
    (117.6) · SeeYouDrop 150.01 = 75 × 2 · Vienna 89.99 (89.6) · WhoLikesToParty 117.05 (117.6) — all within 2 % of the truth or its octave;
    `beat` fires bpm/6 ± 15 % per 10 s on every track. Malicious 140.04 = 69.8 × 2 (a note).
  - **the map** against the truth drops: SeeYouDrop +0.011 / +0.004 s · IBelongHere +0.518 / +0.526 (`mapDropEvt` at 16.4, 32.667, 65.217 — the
    first a bar after the truth's 15.882, and one at 32.667 the truth does not list) · WhoLikesToParty −1.007 (56.5 against 57.507; `dropLiveEvt`
    +0.010) · Vienna: NO `mapDropEvt` on either truth drop (85.336, 106.669; `dropLiveEvt` −0.003 on the first) · Comptine: one `mapDropEvt` at
    107.367 against truth drops at 21.5 / 31.5 / 41.5 (the piano piece: `dropEvt` −0.513 / +9.3 / −0.671, the live detector 4 false arms) —
    printed, not gated (the map's drop rule is a bar-pinned sub rule, §83; these are the open findings below).
  - **the tongues** on (`tongueOn` 1) on 100 / 99.0 / 100 / 100 % of the frames from 20 s on CyborgNinja / IBelongHere / SeeYouDrop /
    WhoLikesToParty (the four with a beater, ≥ 1 click / s); Comptine 30.4 % (0.67 clicks / s), Vienna 98.6 %, the take 0 % — notes.
  - **the drums** over the rulers window, against the truth's CLICK onsets (kicks with a beater; `low` is the level picker that reads a piano's
    left hand): `kickEvt` ×1.00 / 1.00 / 1.00 / 1.00 / 1.00 / 1.00 of the truth with the map (Comptine 40, CyborgNinja 234, IBelongHere 106,
    SeeYouDrop 126, Vienna 36, WhoLikesToParty 230) and ×0.78 / 0.81 / 0.97 / 0.94 / 1.14 / 0.79 on the live lanes; `kick2` rises ×0.85 /
    0.51 / 0.63 / 0.90 / 1.03 / 0.47 — all inside the ×4 gate; `kick2`'s half on CyborgNinja and WhoLikesToParty (the 8th lattices) is a note.
  - **the build** (`&map=0`): `dropLiveEvt` within 1 s of both SeeYouDrop drops (57.600, 105.617); false arms per 110 s: Comptine 4 (47.5, 52.2,
    58.9, 107.9 — at the ≤ 4 gate), the others 0; CyborgNinja (no drops) 0 — the control holds.
  - **the queue** `queueN ≥ 1` on 100 % of the frames from 20 s on every trace.
  - **the director** driven by the real rows (`updateScenes` with test_director's stub scenes, a fresh `SC` per trace, dwell 30 s): every
    `dropEvt` frame hard-cuts home on that frame (Comptine's 5, SeeYouDrop's 2), and no switch away from home lands inside the dwell —
    SeeYouDrop: soft → 1 at 32.8, home at 54.9, soft → 2 at 90.4, home at 104.9; Comptine: 39.9 soft, 40.8 drop, 73.7 soft, 98.6 drop.
- **Wall times**: a trace 2 min (15 in ~30 min); the default md5 sweep 2884 s on one lane; the default rulers 1894 s for 32 rows with
  `PAR=2` (the roster's 24 on advect 0: 1652 s); `accept.sh` grew by ~80 min on one lane (`PAR=2` halves the two sweeps).
- **Not done / open.** (1) **The map's drops off the truth on three tracks** (above): Vienna fires no `mapDropEvt` on either truth drop,
  IBelongHere's are a bar late and one is extra, WhoLikesToParty's is a bar early; Comptine (a piano piece) has three truth drops the map
  does not see — the sub rule, §83; printed by `test_music`, not gated. (2) **Malicious**, pending the user's validation of the map's sub
  ruler: bpm 140.04 = 69.8 × 2, `kick2` rises 96 / `kickEvt` 28 (map) / 71 (live) over 50–110 s against 0.48 clicks / s (no beater),
  `queueN` 100 %, the grammar 100 % of seconds, its rulers rows all ok (NAV2 mon max 0.055, DUST jump max 0.066 black 20, TORUS2 jump max 0.088 black 20, FLUID mon max 0.016). (3) **The rulers' findings, for the user's eye** (`tools/accept/v0.35/real-rulers-v035.txt`): (a) **DUST is black for
  the whole pad take** — 1409 of 1464 frames, median Y 0.000, on music with presence 1.00 and no sub / no drums: DUST has no channel for a
  pad-only piece, the same root cause §108 found for FLUID (DIAG §9's proposals were for the substrate, not the roster); (b) **DUST black on
  IBelongHere** 175.8 → 178.2 s (the sub-less, kick-less bars before the 178.9 s drop — the truth reads sub 0.0, click 0.0, mids 64–70 %) and
  again from 214 s, 377 frames of the window; (c) **DUST's picture cuts 0.139** (3× the frame before) at Vienna 184.35 s — the truth's
  section line at 184.3 with the sub returning (0.3 → 72 → 82 %, no click), and DUST declares `cuts: 'onset'`, so a section seam is not one
  of its legal cuts: either the declaration or the seam is wrong; (d) **TORUS2's per-hit flash reads as a jump** under its own
  `cuts: 'continuous'` — CyborgNinja 121.13 s (0.084), IBelongHere 196.9 (0.070), SeeYouDrop 42.42 / 43.22 / 44.22 / 76.8 (0.074–0.090,
  on the 150 bpm grid), WhoLikesToParty 12.38 / 13.15 / 19.57 (0.083–0.098) — and, on advect 0, two more at 0.065 (IBelongHere 189.78,
  WhoLikesToParty 53.42): the snare wave / core flash, with `continuous` allowing only a
  drop. Either TORUS2 should declare `'onset'` (then these are legal) or the flash is the cut the contract forbids — and the picture rule's
  0.06 whole-frame threshold is §109's pick, to be calibrated against the user's eye on exactly these frames (`tools/work/rulers-v035/
  s3-*.csv` has the 10 fps luma around each). Black frames under the 5 % gate on the other rows are the cold start's fade-in
  (TORUS2 14–32, DUST 8–41 frames) — not a finding. (4) The `FULL=1` matrix (845 runs) has no reference and no measured wall — not run, by the user's word; the
  estimate above.
  (5) `kick2`'s rises read half the truth's clicks on the 8th-lattice tracks (CyborgNinja ×0.51, WhoLikesToParty ×0.47, the .3 threshold) —
  a number, not a defect; the ×4 gate is wide on purpose until a tighter one is measured. (6) `accept.sh` in full not run end to end at §109
  (its real-music block was run as the two sweeps above). Nothing pushed.
## §110 the glitch rows get a switch — `&glitch=0`, key `G`, `post.glitch` (2026-10-09, one worker in a worktree off 39c4a78, rebased onto §109's 9658d8f; the user: *"how can I disable the glitch effect (ie. where it tears the screen)?"*)

- **What the tear is.** The composite's glitch rows (`assets/effects/composite.js`, the `if(uFx.y>.01)` line): the frame is cut into
  14–34 horizontal bands (a seeded hash per frame, `FX.seed`), and a band whose hash lands in the top `0.6 · glitch` of the range is
  slid sideways by up to ±12.5 % of the width · `glitch`, wrapping (`fract`). `glitch` is `FX.glitch` (`core/post.js updateFX`): a drop
  sets it to 1, a surprise lifts it to ≥ .8, an onset with surprisal > .4 to surprisal·.7, and it decays with τ .22 s (~13 frames);
  a hard scene cut sets it to 1 as well (`core/scenes.js`); a resume from a hidden tab zeroes it (`loop.js`). It also feeds the
  chromatic aberration: `FX.ca` carries a `0.03 · glitch` term, so a drop fringes the whole frame while the rows tear. Until now
  there was no switch: the rows fired on every drop, surprise and hard cut on every scene.
- **The three switches, one mechanism.** `FX.glitchGain` (default 1) in `post.js`, and a per-scene `post.glitch` slot (0..1, default
  1 when absent). The gain is applied **in the composite**, not where `FX.glitch` is set: `g = FX.glitch · FX.glitchGain · post.glitch`
  goes to the shader as the rows' amount, and the aberration is handed `FX.ca − 0.03 · (FX.glitch − g)` — the share of the fringe
  the un-applied glitch would have added is removed, so gain 0 = no rows AND no extra aberration. Why there and not at the source:
  the per-scene slot is only knowable at the composite (`io.post`), `FX.glitch` stays the DRIVE the music fired (`CARD.FX.glitch`
  still says what happened; `tools/probe.js`'s `g` column keeps its meaning), and at the defaults the product is exactly
  `FX.glitch` and the correction exactly `0` (IEEE: `x·1·1 === x`, `x − x === 0`), which is the md5 identity below.
  1. `&glitch=0` in the page hash — **any page, no `#test`** (it sits with `&lead=` / `&shade=` in `harness.js`): `retinarave.com/#glitch=0`
     is a bookmark with the tear off for good; `&glitch=0.5` halves it; a value outside 0..1 throws at init like the other switches
     (`&glitch=2` → `[EXC] &glitch= must be a gain 0..1`, `frameN` 0).
  2. **Key `G`** (`hud.js`; `G` was free — the table is `? H P Esc D F M L 1–9 N R 0`): the gain 1 ↔ 0 live, a toast (*glitch rows off
     (no screen tear)* / *glitch rows on*), and the dev HUD (`D`) prints `glitch rows gain 0.00 (off)  drive 0.xx  (key G · &glitch=)`
     while the gain is not 1. The help view (`?`) lists it in part D; no short label, so the landing card's hint row is unchanged.
  3. **`post.glitch`** — the sixth manual post param (`manual.js PARAMS`, after `bloom.thr fb.decay fb.advect kaleido exposure.on`,
     §105's `fb.advect` pattern; the `&post=` grammar's alternation and its parse hint; the panel walks `POST_PARAMS`, so it has the
     number box without a change):
     `&post=nav2.glitch=0` under `#test`, `CARD.manual('post', 'nav2', 'glitch', 0)`, or a scene's own `post: { glitch: 0 }` (a
     number or `fn(MS)`, resolved by `postOf` like `kaleido`). It travels in the panel's preset block like the others; the page-wide
     gain does not persist (the URL is its memory).
- **The md5 proof (identity at the defaults), on the rebased tree** (this worktree's two commits rebased onto §109's `9658d8f`; the
  conflicts were all "both added a line here" — `harness.js`'s header list, `help.js`'s `W` / `G` rows, `hud.js`'s key note, `manual.js`'s
  five → six params and the `&post=` alternation, the smoke, DECISIONS §104–§109 / §110, CONTRACTS §1.4's `fb.advect` / `glitch` rows,
  HARNESS's `&post=` line — resolved by keeping both). The fake smoke: `GPU=1 PORT=8941 tools/scene-md5.sh g110r`, all thirteen ids,
  `errs [] hop 840 row 72` on every id: **every one of the 26 lines equals `tools/accept/v0.35/scene-md5-v035.txt`** (§109's re-based
  list, FLUID's s12 pair included). The real-music proof (HARNESS "Real-music acceptance"): `GPU=1 PORT=8951 SCENES=0 TRACKS=SeeYouDrop
  tools/real-md5.sh g110r` — the home scene on SeeYouDrop, both map modes, intro / groove / build1 / drop1 (`f0 2`, errs `[]`, bad `[]`
  on every run): **all 8 lines equal `real-md5-v035.txt`'s** (`73d742c6 / 7255a07d` build1, `beed9b9d / adeadd29` drop1, `cc7db288 /
  140df669` groove, `9b481b9d / 0e2e4721` intro). Before the rebase the same change held v0.34's 24-line list at the base 39c4a78.
- **The drop-frame proof.** The director fake's first drop is `DROP@13.00` (`tools/accept/v0.34/director-fake-s102.txt`) = frame 780.
  `CLOCK=1 GPU=1 PORT=8932 OUT=tools/work/glitch node tools/cdp.js 'test' '[{"until":"window.CARD"},{"until":"window.__FRAME>=780"},
  {"eval":"…CARD.FX…"},{"shot":"on-f780"}]'` and the same with `'test&glitch=0'` → `off-f780`: on both pages `FX.glitch` 0.927,
  `dropEvt` true, `SC.cur` 0, errs `[]`; `FX.glitchGain` 1 vs 0. A per-row circular cross-correlation of the two shots (PIL + numpy,
  1280 × 633): `on` has **4 torn bands, 114 rows displaced** — rows 89–127 by −58 px, 245–263 by +148 px, 266–282 by +21 px,
  400–438 by +22 px — and the other 474 rows differ by ≤ 2 levels (the removed `0.03 · 0.927` fringe; mean |ΔY| over all rows 1.02);
  `off` is the navigator whole. Frame 781 (`FX.glitch` 0.859): one band of 129 rows at −54 px on `on`, none on `off`. The per-scene
  route shoots the same frame **byte-identical** to the page switch's: `'test&post=nav2.glitch=0'` → `scene-off-f780.jpg`
  `78cc27b5` = `off-f780.jpg` `78cc27b5` (the same product 0 and the same correction). Shots under `tools/work/glitch/` (gitignored):
  `on-f780 c65353f2`, `off-f780 78cc27b5`, `on-f781 95fd2786`, `off-f781 fc48ec33`.
- **The smoke.** Headless on `'test&post=nav2.glitch=0'`: `postString()` = `nav2.glitch=0`; key `g` → `FX.glitchGain` 0, the toast and
  the HUD line above; `g` again → 1; `?` → the help row present; the panel's `glitch` box present. `node tools/manual-smoke.js` 50
  checks · 0 fail (the five params, set / clear / identity, `beta.glitch=0.5` through `applyPosts`, a non-number throws).
- **Gates.** `node tools/check.js` 0 fail · 8 warn (the seven soft-cap line counts, pre-existing) · `npm test` exit 0 · the smoke above.
  No scene folder touched; no uniform added (the gain rides the existing `uFx.y`).
- **Docs.** CONTRACTS §1.4 (the post table: `glitch`), §1.10 (the composite line), §3 (the `FX` line: `glitchGain`, the drive, the
  correction); HARNESS "Routes and manual overrides" (the five params, `&post=nav2.glitch=0`) and "Effect chain" (the *Glitch rows*
  bullet under the chain's switches: the URL, the key, the HUD line, the proof recipe).
- **Credit: none needed** — the rows, the aberration term and the switch convention are this repo's own.
- **Not done.** The user's eye on `#glitch=0` in stream mode; whether the tear should be off by default (it stays ON: the v0.2 look is
  the default, the switch is the opt-out — the user asked how to disable it, not for a new default); the kaleidoscope's `FX.kal` has no
  page-wide gain of this kind (per scene only, `post.kaleido`; §102 turned it off on the home scene).

## §111 the fluid grammar tuned on all seven tracks — the density governor, the key's colour, the sweep's syrup, the void's bound, the confirmed clear, the tonic's axis, the floor's range (2026-10-09, one worker; FLUID-TRACKS-2026-10-09 §10.1 built in its ranked order; the user: *"tune and test with all the real songs"*, *"can ignore malicious until I validate the ruler"*)

- **The ask and the method.** The seven-track survey (`docs/plans/FLUID-TRACKS-2026-10-09.md`) measured §104–§109's grammar on every
  library track and ranked what was wrong on ≥ 3 of the six (Malicious measured, never a gate or a target). This section builds §10.1's
  list in that order, one commit per item, each with its own per-track numbers, so the user can see what each change bought. The
  rulers: (1) `tools/fluid-tracks.js` (new, committed) — `plan()` replayed with no GL over the survey's whole-track traces
  (`tools/work/fluid-tracks/<Track>/trace-map{1,0}.json`, both map modes) and the pad take, one row per track × mode: coverage per
  channel, hits / droplets per second, the injected ink per second (area-weighted) and the governor's factor, Σ|dv|, void / syrup %,
  the clears (true · in IBelongHere's breakdown), the sub emitter's x span, the hit splats' x range, the kick's dy range, the hue's
  trust % and bins — `tools/work/fluid-s111/before.md` is HEAD 9658d8f's, `i<N>.md` each item's; (2) the survey's deterministic FLUID
  shots (`tools/work/fluid-s111/shots.sh <track> <tag> "<name:t …>"`: scene 12, file mode, `at=0`, `CLOCK=1 GPU=1`, keyed on
  `__FRAME`, whole-frame grey mean / p99 per shot — rec-strip.sh's metric; the survey's own shots are the "before") at the survey's
  windows — the two "it changed" rulers §10.1 named: SeeYouDrop's windows must stay (the reference), CyborgNinja's busiest 31 s must
  stop packing (31 / 31 seconds above grey 60 before). Every splat `plan()` emits now carries its kind (`k`: sub kick snare chord hat
  floor drop) — `fluid-replay.js` and the table read it instead of re-deriving the emit order. The user's taste the items serve: hits
  must launch something that travels; coverage + dynamics over ms timing; major warm / minor cool, the key the hue anchor; "I like the
  bright glowy look but want to see the shapes".
- **Item 1 — the density governor** (`inject.js`: `AMP0` .2, `RANK_N` 64, `HAT_RATE` 8, `INK_BUDGET` 14, `INK_TAU` 12; `mkState` gains
  the two rank buffers, the kick's ranked size, the hat bucket, the ink rate). Three parts. (a) **A hit's size is its rank in its
  lane's own recent range**: `sz = AMP0 + (1 − AMP0)·clamp((amp − p10) / (p90 − p10))` over the lane's last 64 hits (the pooled prior
  .3 / .95 until it has 8), the kick's `dy = KICK_V·√sz`, the snare's `dx = SNARE_V·sz` — the lane's .31 amp floor had given every
  track the same bottom (dy p10 .49–.63, the smallest kick 56 % of the biggest); now dy p10 / p50 / p90 reads **.39 / .56–.64 / .82–.89
  on all six** (the floor √.2 = .45 of the top), a lane whose hits all sit in .5–.6 spreads over the whole law (the test). SeeYouDrop's
  own p10 / p90 (.32 / 1.00) is the prior, so its hits map near-identity (p50 .61 → .58). (b) **The hat droplets out of a token bucket**
  (3 tokens, 8 / s back): a hat hit's first three droplets, the frames after wait for the refill — droplets per music second
  CyborgNinja **29.3 → 7.7**, WhoLikesToParty **26.1 → 6.1**, Vienna 11.1 → 3.5, IBelongHere 8.7 → 3.1, SeeYouDrop 5.5 → 2.4 (10 s of
  hats ≤ 83, was 1800; half a second of quiet refills it). (c) **The ink budget**: the injected ink per second, AREA-WEIGHTED (Σ dye ·
  (rad / RADIUS)² — a kick's ×2 radius is four snares' worth), as an ema over `INK_TAU` 12 s, scales the dissipation by
  `max(1, rate / INK_BUDGET)` — multiplying the void's `dyeDiss` too (a governed build still accumulates, at half the pace), the drop's
  impulse not counted. At twice the budget the pool drains twice as fast, so its ink saturates at the budget on a track with no
  range of its own. The factor, p50 / p90 over music frames: **CyborgNinja ×2.1 / 2.1, WhoLikesToParty ×1.8 / 2.0**, IBelongHere ×1.0 /
  1.4, SeeYouDrop ×1.1 / 1.4 (its builds' end), Vienna / Comptine / the pad ×1.0 (never). The τ was measured, not guessed: at 1 s
  SeeYouDrop's build-100 read 42 (61 before) and drop2 55 (78); at 6 s 49 / 60; at 12 s (three bars at 150 bpm) 54 / 67 — a 10 s
  roll passes, a 180 s boil does not. **The shots** (survey → item 1, grey mean): SeeYouDrop groove-35 **51 → 52**, drop1p-58.0
  **37 → 37**, drop2p-106.0 **37 → 36**, outro-150 33 → 33, intro / subin unchanged; build-100 61 → 54, the two drop flashes drop1-57.5
  71 → 60 and drop2-105.5 78 → 67 (the bucket takes the drop second's 22 droplets to 11 and the budget's factor reads 1.3–1.4 at the
  end of a 15 s build; the smaller mid-rank forces light less relief) — outside the survey's ±5 on the three transient windows, inside
  it on the groove and the clears; recorded, not hidden. **CyborgNinja's busiest 31 s (79–109 s): mean of means 73 → 46, min–max 66–79
  → 42–52, seconds above grey 60 31 → 0 (20 of 31 in SeeYouDrop's groove band 46–60), p99 max 205 → 179** — it stops packing.
  The replay per track is `tools/work/fluid-s111/i1.md`; the shots `tools/work/fluid-s111/{SeeYouDrop,CyborgNinja}-i1c/shots/`
  (the final per-track montages are below, after item 7). Tests: `test_fluid` kick (the rank's floor, the law's room 1/√AMP0 = 2.24×,
  the tail's 40 % of the ranked size, a .5–.6 lane over the whole law, the 64-hit buffer), snare (the ranked dx, the floor), hats (the
  bucket: a 12-frame burst → 3 + 1, 10 s ≤ 83, the refill), budget (nothing → the grammar's; 60 s of hits → the factor; the void's
  .05 scaled; 60 s of nothing decays it; a 5 s burst reaches a third; the drop not counted; INK_BUDGET 14). check 0 fail, npm test exit 0.
- **Item 2 — the pool's colour is the key's, never the mood's** (`KEY_TRUST` .1, `KEY_TAU` 30, `KEY_MARGIN` 1.5, `KEY_EV0` .5, `HARM_TAU` 15;
  `mkState` gains `pin`, the 24 keys' evidence, the harmony's eased centre; `fluid.js` no longer passes `LOOK.mood.hue` — the fourth
  argument is accepted and ignored). Before: the anchor took the key at `keyConf` ≥ .3 and slid to `LOOK.mood.hue` (the mood family's
  hue swung by intensity × arousal) below it — SeeYouDrop (p50 .43) and Vienna (.36) held their key, IBelongHere (p50 .13), WhoLikesToParty
  (.11), CyborgNinja (.01), Comptine (.00) rode the mood: IBelongHere walked seven hues in one key (the survey's shots: magenta →
  green → cyan → yellow → salmon → olive → lilac). Now the pool PINS the key: each key's evidence is Σ `keyConf`·dt over the frames it is
  the ears' key at trust ≥ .1, an ema of 30 s; the first key pins when its evidence reaches .5 (5.5 s at trust .1, 1 s at .5 — a cold
  start's first trusted guess is often wrong: SeeYouDrop C♯ major at 0.7 s, WhoLikesToParty B minor at 0.3 s), another key re-pins
  only when its evidence is 1.5× the pinned key's (10–40 s of equal trust; the KK's relative-key flicker — WhoLikesToParty's D ↔ Bm in
  10–23 s stretches — mostly does not reach it), and the pin holds through any run of no trust. Until the first pin the hue is the
  HARMONY'S CENTRE: `harmAngle`'s unit vector and the mode, each an ema of 15 s, the centre's nearest fifth with the mode's pull — a
  diatonic progression (IBelongHere's Dm F Am C: four fifths sectors) is one hue, not four, and it moves only when the harmony moves,
  never with arousal. The pin's key per trace (the truth traces, 0–110 s, both modes agree): SeeYouDrop C♯ 1.7 s → **C♯m 13.9 s** ·
  Vienna **D♯m 0.8 s** · IBelongHere Am 22.5 s → **Dm 65.8 s** · WhoLikesToParty **D 8.9 s** (never re-pinned to 110 s) · CyborgNinja Dm 4.8
  s → Cm 51.5 s (keyConf p50 .01: the pin is the ears' guess, held) · Comptine **never** (keyConf 0 throughout: the harmony's centre all
  piece) · the pad A♯ 3.6 s. The whole-track survey traces: IBelongHere Dm at 43 s to the end; WhoLikesToParty D 2.6 → Bm 60 → D 92 →
  Bm 141 → D 163 s (four relative-key flips in 256 s against the KK's dozens); CyborgNinja Gm 8 → G 102 s; SeeYouDrop C♯ 2.4 → C♯m 8.0 s.
  (The two trace sets disagree on the ears' key timeline for IBelongHere — Am 22.5 → Dm 65.8 against Dm at 43 — and CyborgNinja — Dm /
  Cm against Gm / G: recorded at different HEADs; open below.) The key-coloured frames (the anchor's `conf` 1): IBelongHere **2 → 81 %**,
  WhoLikesToParty 1 → 100, CyborgNinja 4 → 95, SeeYouDrop 75 → 99, Vienna 77 → 100, the pad 53 → 100 (`i2.md`). **The shots** —
  IBelongHere's 14 windows re-shot, the dominant hue (the circular mean of the pixels with V > 60, S > .25; `tools/work/fluid-s111/hue.py`):
  survey **273° 295° 101° 142° 185° 59° 5° 32° 292° 213° 56° 260°** (every window its own hue) → item 2 **348° 16° 16° 16°** (the vocal intro,
  the harmony's warm centre) **· 151° · 134° 128° 124° 122° 129° 129° 125°** (D minor held from 30 s to the end) — two hues on the track:
  the intro's and the key's. Its grey means moved by ≤ 3.6 (dye only: groove-30 54 → 52, groove3-200 59 → 55, falsedropp-157.5 24 → 24).
  `tools/work/fluid-s111/IBelongHere-i2/shots/`. Tests: `test_fluid` colour (keyConf .15 takes the key within 10 s; the hold through 5 s
  of no trust while the harmony and the mood move; two harmAngles → two fallback hues; the fourth argument ignored; a fifth flipping
  every half second moves the fallback < .02 / frame; 5 s of another key → no re-pin, 10–40 s → re-pin; the first pin's 5.5 s at trust
  .1), the music block prints the pin per trace and asserts IBelongHere D minor from < 70 s (≤ 2 pins) with one hue over 2 / 10 / 16 s and
  one over 60 / 100 s, WhoLikesToParty D major from < 10 s never re-pinned, SeeYouDrop C♯ minor from < 15 s, Comptine never trusted.
  check 0 fail, npm test exit 0 (`test_fluid` 157 ok).
- **Item 3 — syrup only on a sweep that moves** (`LP_RISE0` .03, `LP_RISE1` .12; `mkState` gains `lpSlow`, lpSweep's 1 s ema; the dead
  `2·hush` term dropped — `hush` read 0.00 on all seven tracks). `velDiss = .2 + 2.8·sstep(.80, .97, lpSweep)·sstep(.03, .12, lpSweep −
  lpSlow)`: the filter must be in its dark range AND closing against its own last second; a closed filter that is not closing is a dark
  mix (Comptine's piano, lpSweep p50 .93; IBelongHere's vocal mix, .83; SeeYouDrop's outro, ≥ .8 on its last 30 s with no sweep in the
  music), and the hits keep travelling there; opening is a release. The probe that set the knee: the rise's p50 / p90 on the frames with
  lpSweep > .8 — Comptine .014 / .095, SeeYouDrop .017 / .181 (its 10 s before each truth drop .084 / .257), IBelongHere .061 / .234,
  Vienna .204 / .341. **Syrup (velDiss > 1) on the music frames, whole tracks, before → after: Comptine 62 → 7 %, IBelongHere 46 → 20,
  SeeYouDrop 18 → 4 (its outro 57 → 11), WhoLikesToParty 19 → 15, Vienna 5 → 4, CyborgNinja 1 → 1**; and a finding: SeeYouDrop's syrup in
  the 10 s before its truth drops was 0 % BEFORE too — the §104 knee never fired on its builds (lpSweep < .8 there), only on the outro and
  the dark mixes (the truth traces, 0–110 s: Comptine 8.4, IBelongHere 24.3, SeeYouDrop 2.3, WhoLikesToParty 11.8, Vienna 4.6, the pad
  0 %). **The shots** — Comptine's 13 windows + its busiest 31 s re-shot (items 1–3 together): the grey means rise where the shears now
  travel and spread (busy-50 29 → 33, late-90 33 → 41, void-64 44 → 49, falsedrop-47 28 → 34), the busiest strip 31 → 33 (p99 max 153 →
  180); and item 2's hue on the piano: survey 245° 298° 336° 314° 318° 191° 71° 226° 279° 178° 231° 221° (twelve windows, nine hues) → **52–84°
  on every window** (the harmony's centre in D major, warm — the piece's key, never trusted by the ears, read from its harmony).
  `tools/work/fluid-s111/Comptine-i3/shots/`. Tests: `test_fluid` params (velDiss 3 on the frame the filter closes; hush adds nothing; held
  closed 6 s → .2; a sweep .5 → 1 over 2 s reaches 3.0; opening → .2), the music block prints the syrup share per trace and gates it at
  ≤ 30 %. check 0 fail, npm test exit 0 (`test_fluid` 173 ok).
- **Item 4 — the void bounded, and latched on the bass that left** (`VOID_FLOOR` .3, `VOID_BARS` 8; `mkState` gains `subAge`). The deep
  void (`dyeDiss` → .05, the ink accumulating for the drop) only when the live build detector is armed past .5 AND the sub emitter was
  open within 8 bars — the void before a drop IS the bass leaving; otherwise `dyeDiss ≥ .3` whatever `buildLive` or the tongues say
  (`tongueAmbig` is a clock-lock measure, `buildLive` reads 1.0 on a piano crescendo and a vocal swell). The budget's factor multiplies
  the result as before. **The deep void (dyeDiss < .3) on the music frames, whole tracks, before → after: Comptine 40 → 0 %, the pad
  42 → 0, IBelongHere 14 → 7, SeeYouDrop 12 → 2, Vienna 12 → 5, WhoLikesToParty 1 → 0**; the latched windows keep it: Vienna's dream
  64–86 s min dyeDiss .05 (deep on 40 % of its frames), SeeYouDrop's build 1 (47–57.5 s) min .055, IBelongHere's 144–178 s breakdown deep
  on 16 % (its first 8 bars, then bounded); SeeYouDrop's build 2 (95–105.5 s) was never a void in file mode (min .48 — the live
  detector does not arm there; a note). The dd < .5 column is unchanged (the bound sits under .5). **The shots**: Vienna's 9 windows
  re-shot — the dream keeps its ink exactly (dream-75 **30.1 → 29.7**, subout-64 50.4 → 50.0, return-85.0 33.1 → 31.9, returnp 33.9 → 34.1;
  groove-30 49.9 → 45.5 and late-130 38.3 → 35.5 are items 1–3's); Comptine's 13 windows re-shot against item 3's: the stale tri-blob
  drains — void-64 **49.1 → 44.3 (p99 181 → 160)**, falsedrop-47 34.4 → 29.3, late-90 40.5 → 35.0, fade-125 32.0 → 29.3 — the piano's ink
  now decays at τ 3.3 s where it sat still for 44 % of the piece. `tools/work/fluid-s111/{Vienna,Comptine}-i4/shots/`. The table
  (`tools/fluid-tracks.js`) gained the deep-void column and `INJECT=<path>` (another grammar's file, for a before → after of the same
  traces; `before.md` is now HEAD 9658d8f's grammar replayed by the final tool). Tests: `test_fluid` params (buildLive 1 with no sub →
  .3; with the sub seen → .05; .4 → the mapping's .62; .9 with no sub → .3; the latch expires 8 bars after the sub; tongueAmbig 1 →
  .3, .5 → .525), the music block prints the deep-void share per trace and asserts Comptine and the pad never under .3, Vienna's dream
  and SeeYouDrop's build 1 under .1. check 0 fail, npm test exit 0 (`test_fluid` 183 ok).
- **Item 5 — the clear is confirmed by the bass coming back, once per bar** (`CLEAR_PEND` 1.5 beats, `CLEAR_REF` 4 beats; `mkState` gains
  `pendLeft`, `refLeft`; `plan()` returns `drop` 1 on the frame a clear is confirmed; `scenes/fluid/index.js` throws its ring on the frame
  `ctx.fluid.params.dyeDiss` first reads the clear's 12 instead of its own slam rule — its `feats` lose `dropLiveEvt mapDropEvt mapOn
  dropEvt`, `help.js` the four rows). Both triggers stay, in both modes (`dropLiveEvt || mapDropEvt`: the map fires SeeYouDrop's drop 1
  where the detector never does; the detector fires Vienna's 85.33 s return where the map has no line — §10.1's "map only in file mode"
  would have lost Vienna's one clear in the mode the user hears, so it was not built that way), but a trigger only ARMS a pending window
  of 1.5 beats; the clear and the impulse fire on the first frame inside it that the sub emitter opens, then 4 beats of refractory (a
  trigger inside it is dropped; one inside a pending window re-arms it). The probe that chose the sub as the witness: every true trigger
  on the library opens the gate within 0.00–0.03 s (SeeYouDrop ×4, Vienna, IBelongHere's four map lines, WhoLikesToParty ×6); IBelongHere's
  four live arms in its 144–178 s breakdown have bass .07–.36 and no sub, Comptine's six (five live, one map line) no sub ever —
  `bass ≥ .5` alone would have confirmed four of Comptine's (its left hand reads .55–.89). **The clears, before → after (whole tracks,
  file mode / live lanes): SeeYouDrop 57.6 105.6 → 57.62 105.63 / 57.65 105.67 (1–3 frames after the trigger, the sub's frame) · Vienna
  85.33 → 85.33 / 85.4 · IBelongHere 9 (the five map lines + the four false arms) → 5 (16.43 32.68 65.23 130.3 179.13 — the breakdown's
  four GONE: 4 → 0) and on the live lanes 5 → 1 (179.18: the 178.58 live arm confirmed by the sub at 179.13) · WhoLikesToParty 6 (two per
  drop) → 3 (56.5 130.35 187.78: one per drop; the map's line a bar early is the one that wins in file mode — §109's open map finding,
  not the grammar's) / 57.52 131.38 188.78 · Comptine 5 → 0 / 5 → 0 · CyborgNinja, Malicious, the pad 0 → 0.** **The shots**:
  IBelongHere's falsedropp-157.5 — the survey's ruler for this item — **24.2 → 35.5** (p99 52 → 137: the breakdown's pool stays; before, the
  empty pool with the ring over nothing), falsedrop-157.0 35.9 → 34.1, returnp-179.2 22.0 → 25.6 (the clear now at 179.13, four frames
  before the shot, instead of 178.58); WhoLikesToParty's drop-57.0 23.8 → 23.3, drop2-131.0 24.9 → 25.2, drop3-188.0 31.4 → 25.3 (one
  clear each), its grooves 61–75 → 48–57 (item 1's budget: mid-112 75 → 53, groove2-160 74 → 49, end-252 71 → 57).
  `tools/work/fluid-s111/{WhoLikesToParty,IBelongHere}-i5/shots/`. Tests: `test_fluid` drop (pending → the sub confirms 11 frames later;
  the countdown; a second trigger inside the refractory → nothing, after the bar → at once; no sub for 1 s → never, and not after the
  window; trigger + sub on one frame → that frame), mapdrop (the line with the sub clears; both on one frame → one impulse; dropEvt never),
  the music block: every clear within 1.5 beats of a trigger with the sub open and held a beat, and the clears per trace ARE the expected
  list (SeeYouDrop 2, Vienna 1, WhoLikesToParty 1 in 110 s, IBelongHere's three map lines, Comptine / CyborgNinja / the pad none).
  check 0 fail, npm test exit 0 (`test_fluid` 200 ok).
- **Item 6 — the bass end relative to the tonic** (`inject.js`: `relX(pc) = ((sectorPc(pc − tonic) + 6) mod 12 + ½) / 12`, the tonic = the
  pinned key, or the harmony's centre's fifth before any pin; `xSub` starts at the tonic's place 6.5 / 12; the floor's cloud sits at the
  tonic's place too — the centre). Before, the sub emitter's x was the bass note's ABSOLUTE fifths sector (C at .04, the left wall):
  CyborgNinja's held C sat at the wall for 1161 of its 3699 open frames in file mode and 99 % on the live lanes, IBelongHere's A♯ / A
  at .04–.12, and the kicks launched from the same x. Now the tonic is the centre, its fifth one sector to the right, its fourth one to
  the left, the tritone at the walls — every track's "where" on one musical axis, which follows the key as the pin moves. **The sub
  emitter's x p10 / p50 / p90 (span), whole tracks, before → after**: CyborgNinja file .04 / .29 / .88 (.83) → **.04 / .46 / .71** (.67),
  live .04 / .21 / .79 → .04 / .46 / .88 — the held C (G's fourth) at .46, centre-left; its p10 stays at the wall because its chromatic
  bass walks C C♯ D D♯ and C♯ is G's tritone (12 % of the open frames: at the wall by design, and the key on this track is a guess at
  keyConf p50 .01) · IBelongHere .09 / .29 / .88 (.79) → .21 / .54 / .71 (.50) — off the left wall, the tune's A♯ / A / D / G now round
  the centre · Vienna .54 / .74 / .88 → .29 / .54 / .63 (D♯ minor's G♯ / D♯ / A♯ were the right third, now the centre) · SeeYouDrop
  .28 / .54 / .63 → .21 / .46 / .54 (C♯ at the centre, F♯ left) · WhoLikesToParty .13 / .32 / .63 → .29 / .63 / .79 · the pad's YIN ghost
  .88 / .90 / .94 → .38 / .46 / .46 · Comptine (no sub) the kick at .54 instead of .50 (`i6.md`). **The shots**: CyborgNinja's 8 windows
  re-shot (items 1–6 together): the column off the wall by the replay's numbers, the grey means groove-40 70 → 48, busy-88 68 → 43,
  mid-100 77 → 46, loudest-138 75 → 47, quiet-157 71 → 44, end-178 70 → 42 — the boil is gone on every window (item 1), intro-3 36 → 35,
  early-10 47 → 51. `tools/work/fluid-s111/CyborgNinja-i6/shots/`. Tests: `test_fluid` gate (E♭ three fifths flat of C → left of
  centre; the tonic at the centre, the fifth right, the fourth left, the tritone at the wall; with G pinned a G sub is the centre; a kick
  before any sub at the tonic; subNote −1 → harmAngle's fifth, the centre before a pin and the wall for F♯ with C pinned), floor (x =
  the centre), the music block prints the sub x per trace and asserts CyborgNinja's held bass near the centre (p50 in .3–.7) with a span
  ≥ .3. check 0 fail, npm test exit 0 (`test_fluid` 209 ok).
- **Item 7 — the floor on the track's own range** (`FLOOR_BASE` .5, `FLOOR_WIN` 30; `mkState` gains the ring of `mid`'s one-second means).
  `mid` sat above `FLOOR_HI` .40 on 94–100 % of every track's frames, so the §108 floor was a constant .24–.32 dye / s everywhere — "the
  lights are on" (§108's open question). Now the floor is × (.5 + .5·sstep(p20, p80, mid)) over the last 30 s of `mid` (one-second means
  in a ring; the plain floor until the ring has 5 s; the absolute knee still zeroes silence and a residue): a swell above the track's
  own p80 is the full floor, a steady level half of it, a dip under its p20 half. **The floor's ink / s (area-weighted) p10 / p50 / p90,
  before → after**: SeeYouDrop .90 / 1.20 / 1.38 → **.53 / .86 / 1.22**, Vienna .80 / 1.07 / 1.19 → .53 / .79 / 1.07, IBelongHere .49 / .99 /
  1.22 → .28 / .80 / 1.14, CyborgNinja .96 / 1.31 / 1.50 → .53 / 1.06 / 1.36, Comptine .68 / 1.17 / 1.64 → .35 / .89 / 1.58, the pad .15 /
  1.03 / 1.45 → .15 / .93 / 1.45 — the p10 : p90 ratio .65 → .43: the floor has a range now; its share of all ink 4–18 % → 4–15 %, the pad's
  77 → 75 % (the floor is still the pad's picture; its seconds with ink unchanged, 22 / 22). **The shots**: the pad's take re-run
  (`tools/rec-strip.sh … s111-i7`, 2 fps, against §108's `tools/work/rec/after/grey.txt`): the room's silence 15.6 → 15.6, the first
  sound at 3 s 22.3 → 21.7, the chords 12 s 27.6 → 26.8, 17 s 29.7 → 28.1, 18 s 29.8 → 28.1 (p99 110 → 94 at 12 s: the steady pad's cloud
  at half the floor after its first 5 s) — the take still reads from 3 s on; Vienna's dream-75 (the floor is the dream's only ink): mean
  29.7 → 29.4, p99 100 → 68 (the dream's `mid` sits under the groove's p20 → half the floor — for the user's eye: `tools/work/rec/s111-i7/`
  and `tools/work/fluid-s111/Vienna-i7/shots/`). Tests: `test_fluid` floor (40 s of a steady .8 → half; a swell to .95 → full; a dip to
  .6 → half; the first 5 s → plain; the knee). check 0 fail, npm test exit 0 (`test_fluid` 214 ok).
- **Item 8 — the harmonic branch, and the noise guard** (`HARM_BARS` 2, `HARM_LIFT` .3, `NOISE_DIRTY` .7, `NOISE_BASS` .2; `FLUID_FEATS`
  gains `centroid dirty bass`; `mkState` the guard's two emas; `plan()` returns `harmonic` / `noise`). Built because items 1–7 left
  Comptine and the pad unreadable BY THESE NUMBERS: the hit splats' x p10 / p90 still read **.30 / .70 on every track** — Comptine's 379
  hits and the pad's on the fixed pair, the kick at the centre (`i7.md`'s `x hits` column) — "where = what" absent on a piece with no
  sub. Now, with the sub emitter shut for 2 bars (a piano, a pad, a vocal breakdown), every hit goes to the HARMONY'S place on the
  tonic axis: x = `harmAngle`'s nearest fifth through item 6's `relX`, y = .25 + .5·`centroid` (a high note high), the snare-lane and
  chord hits ONE directed splat each (the pair's force as a push away from the centre, HARM_LIFT of it upward, the pair's ink), the
  kick-lane hits (a piano's low notes) lifting from under that place instead of the stale sub x; the drum grammar is back the frame
  the sub returns. And NOISE — `dirty` > .7 with `bass` < .2 (1 s emas) AND the sub gone 8 bars — injects nothing, no hit and no floor:
  the guard was set on the fields (Comptine's applause 133–144 s: dirty .84, bass .10, high .88, no sub ever; its piano .02 / .59; the
  pad .60 / .91; SeeYouDrop's build riser 52–57 s dirty 1.0 / bass .04 — a per-frame guard without the sub condition read it as noise and
  silenced the last 6 s of the build; IBelongHere's 148–150 and 213–216 s the same). **The numbers, before → after (whole tracks)**:
  Comptine's hits x p10 / p90 **.30 / .70 → .46 / .63** (the melody's fifths walk round D; 555 hits on 0–110 s with a p10–p90 span .17), the
  harmonic branch on 100 % of its frames, its applause **137–144 s read as noise: 8 seconds, 0 splats** (the 94 % injection on that
  trace's "music" seconds is those 8 — the test's music count excludes noise seconds; on the live lanes the YIN ghost's one sub second
  keeps the applause inside 8 bars: 0 noise seconds, a note); the pad .30 / .79, the branch on 80 % of its frames (after the ghost), its
  32 hits over a span .49; IBelongHere's breakdowns 84 s in the branch (file), Vienna's dream 18, SeeYouDrop 13, CyborgNinja 28 (its
  map-mode sub gaps), WhoLikesToParty 0; noise seconds 0 on every other track (`i8.md`). **The shots**: Comptine's 13 windows re-shot
  (items 1–8): applause-140 **33.7 → 32.1, p99 130 → 84** (nothing injected; the residue draining), falsedropp-47.5 26.8 → 24.7, late-110 28.7
  → 31.4, busy-50 31.7 → 32.1 (p99 146 → 157: the hits spread along the melody, no longer the tri-blob — the eye: `fluid-s111-Comptine-*`
  below), the busiest strip 31 → 31 (min–max 18–38); the pad's take re-run (`s111-i8b`) within .3 grey of item 7's on every half second
  (the floor is its picture; the 32 hits now at the harmony's place). `tools/work/fluid-s111/Comptine-i8b/shots/`, `tools/work/rec/s111-i8b/`.
  Tests: `test_fluid` harmonic (the sub shut 5 s → one snare splat at the centre for harmAngle 0, y .5 for centroid .5, the push at full
  force with HARM_LIFT upward; a fifth up → right and high, a fifth down → left and low; the kick lane under the harmony's place; a chord
  → one splat; the pair back the frame after the sub), noise (20 s flat / bassless / no sub → nothing; the same 6 s after the sub left →
  a build's riser, the floor stays; a pad never), the FEATS; the music block's music seconds exclude noise, the noise seconds inject
  nothing, Comptine and the pad in the branch with their hits spread (span ≥ .08); every pair test seeds the sub (`drumSt()`).
  check 0 fail, npm test exit 0 (`test_fluid` 243 ok).
- **The per-track table, before → after** (`tools/fluid-tracks.js` on HEAD 9658d8f's grammar and on item 8's — `tools/work/fluid-s111/
  {before,i8}.md`; whole tracks, file mode / the live lanes; the pad on the live lanes; Malicious for the record). inj = the music
  seconds that inject; ink/s the area-weighted injection p50; hats/s droplets per music second; void·deep = frames with dyeDiss < .5 ·
  < .3; clears (true · in IBelongHere's breakdown); x sub the emitter's p50 (p90 − p10); x hits the hit splats' p10 / p90; kick dy p10 /
  p90; hue = the key-coloured frames % · the hue bins visited (the "before" bins are the replay's with a fixed mood hue — the real walk
  before is the survey's shot hues, items 2–3 above):

  | track | mode | inj % | ink/s p50 | hats/s | void·deep % | syrup % | clears (true·brk) | x sub p50 (span) | x hits p10/p90 | kick dy p10/p90 | hue key %·bins |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | SeeYouDrop | 1 | 100 | 12 | 5.5 → 2.4 | 48·12 → 31·2 | 18 → 4 | 2(2) | 0.54(0.35) → 0.46(0.33) | 0.30/0.70 | 0.49/0.79 → 0.39/0.82 | 75·9 → 99·5 |
  | SeeYouDrop | 0 | 100 | 12 → 13 | 5.5 → 2.5 | 48·12 → 31·2 | 18 → 4 | 2(2) | 0.63(0.58) → 0.54(0.58) | 0.29/0.70 | 0.48/0.81 → 0.39/0.84 | 75·10 → 99·5 |
  | Vienna | 1 | 100 | 6 → 5 | 11.1 → 3.5 | 39·12 → 39·5 | 5 → 4 | 1(1) | 0.74(0.33) → 0.54(0.33) | 0.30/0.76 → 0.30/0.70 | 0.63/0.84 → 0.39/0.85 | 77·2 → 100·3 |
  | Vienna | 0 | 100 | 8 → 6 | 11.0 → 3.5 | 39·12 → 39·5 | 5 → 4 | 1(1) | 0.79(0.50) → 0.54(0.50) | 0.30/0.79 → 0.29/0.70 | 0.50/0.67 → 0.39/0.86 | 77·2 → 100·3 |
  | IBelongHere | 1 | 100 | 14 → 11 | 8.7 → 3.1 | 30·14 → 31·7 | 46 → 20 | 9(5·4) → 5(5·0) | 0.29(0.79) → 0.54(0.50) | 0.11/0.70 → 0.30/0.70 | 0.52/0.82 → 0.39/0.84 | 2·8 → 81·4 |
  | IBelongHere | 0 | 100 | 15 → 13 | 8.5 → 3.1 | 30·14 → 31·7 | 46 → 20 | 5(1·4) → 1(1·0) | 0.46(0.75) → 0.46(0.58) | 0.29/0.71 → 0.29/0.70 | 0.48/0.77 → 0.38/0.83 | 2·8 → 81·4 |
  | CyborgNinja | 1 | 100 | 31 → 29 | 29.3 → 7.7 | 0·0 | 1 | 0(0) | 0.29(0.83) → 0.46(0.67) | 0.21/0.79 → 0.21/0.70 | 0.51/0.84 → 0.40/0.86 | 4·6 → 95·5 |
  | CyborgNinja | 0 | 100 | 26 → 24 | 29.4 → 7.7 | 0·0 | 1 | 0(0) | 0.21(0.75) → 0.46(0.83) | 0.30/0.70 → 0.04/0.71 | 0.53/0.89 → 0.40/0.89 | 4·6 → 95·6 |
  | WhoLikesToParty | 1 | 100 | 27 | 26.1 → 6.1 | 13·1 → 1·0 | 19 → 15 | 6(6) → 3(3) | 0.32(0.50) → 0.63(0.50) | 0.25/0.70 → 0.30/0.71 | 0.37/0.80 → 0.39/0.82 | 1·7 → 100·6 |
  | WhoLikesToParty | 0 | 100 | 24 → 23 | 25.4 → 6.1 | 13·2 → 2·0 | 19 → 15 | 3(3) | 0.38(0.67) → 0.63(0.75) | 0.21/0.70 → 0.30/0.71 | 0.54/0.88 → 0.39/0.88 | 1·7 → 100·6 |
  | Comptine | 1 | 99 → 94 | 4 → 5 | 1.0 → 0.5 | 44·40 → 45·0 | 62 → 7 | 5(1) → 0(0) | — | 0.30/0.70 → 0.46/0.63 | 0.48/0.73 → 0.34/0.73 | 0·2 → 0·5 |
  | Comptine | 0 | 100 | 3 → 4 | 1.3 → 0.6 | 45·40 → 45·0 | 62 → 7 | 5(0) → 0(0) | 0.34(0.67) → 0.54(0.67) | 0.30/0.70 → 0.46/0.63 | 0.33/0.67 → 0.27/0.77 | 0·2 → 0·5 |
  | Malicious (record only) | 1 | 100 | 2 | 2.8 → 1.7 | 72·0 | 1 | 0(0) | 0.59(0.67) → 0.46(0.67) | 0.30/0.94 → 0.46/0.63 | 0.54/0.77 → 0.40/0.78 | 33·11 → 95·8 |
  | Malicious (record only) | 0 | 100 | 9 | 2.7 → 1.6 | 72·0 | 1 | 0(0) | 0.04(0.58) → 0.54(0.58) | 0.13/0.70 → 0.30/0.70 | 0.42/0.62 → 0.36/0.77 | 33·11 → 95·9 |
  | rec | 0 | 100 | 1 | 0.1 → 0.0 | 42·42 → 42·0 | 0 | 0(0) | 0.90(0.07) → 0.46(0.08) | 0.30/0.70 → 0.30/0.79 | 0.01/0.01 | 53·4 → 100·2 |

- **What the eye should look at, per track** (`tools/accept/v0.35/fluid-s111-<Track>-montage.jpg` = the survey's windows after §111, the
  window shots beside it as `fluid-s111-<Track>-<window>.jpg`; the survey's "before" montages are `tools/work/fluid-tracks/<Track>/
  montage.jpg`; the two 31 s strips after §111 in `tools/work/fluid-s111/<Track>-final/montage-{strip0,busy}.jpg`):
  - **SeeYouDrop** (the reference): groove-35 and the two clears (drop1p-58.0, drop2p-106.0) as before; build-100 and the two drop flashes
    dimmer by 7–12 grey (item 1 — the hat bucket at the drop second, the budget at a build's end: the final run groove-35 51.2 → 51.4,
    drop1p 37.1 → 36.5, drop2p 36.9 → 36.5, intro / subin ± .3, build-100 60.9 → 54.2, drop1-57.5 71.3 → 60.6, drop2-105.5 78.2 → 66.0,
    outro-150 32.7 → 36.2 (the harmonic branch's hits in the sub-less outro); its busiest 31 s mean of means 57 → 51, seconds > 60
    12 → 1, 46–60 17 → 24); the sub column at the centre (C♯ the tonic) with F♯ left of it (item 6); the hats three per hit.
  - **Vienna**: indigo as before (D♯m pinned at 0.8 s); the dream-75 keeps its ink (29.4 against 30.1) but its floor cloud at half (item 7,
    p99 100 → 68) — whether the dream should keep the full floor is the user's call; the return at 85.3 clears once; the sub column at
    the centre now (its G♯ / D♯ / A♯ were the right third); groove-30 49.9 → 44.0, the busiest strip 49 → 45 (item 1).
  - **IBelongHere**: ONE hue over the vocal intro (the harmony's warm centre) and ONE from 30 s to the end (D minor, 122–151°) against
    seven before (item 2); falsedropp-157.5 the breakdown's pool (35.5), never the empty one (item 5); the breakdowns' vocal hits at the
    tune's place, one directed splat each (item 8); the syrup gone from the dark mix (46 → 20 %); the final run's dominant hue 349° 17°
    18° 17° (the intro) · 151° 137° 127° 124° 124° 124° 128° 130° 127° (D minor to the end); the busiest strip 56 → 54, seconds > 60 6 → 4.
  - **CyborgNinja**: the boil gone — the final run groove-40 70.3 → 46.8, busy-88 68.3 → 43.0, mid-100 77.4 → 45.7, loudest-138 74.8 →
    47.1, quiet-157 71.1 → 44.2, end-178 70.1 → 42.0; the busiest 31 s mean of means 73 → 45 (42–49), seconds > 60 31 → 0, p99 max 205 →
    199 (item 1); the held C at centre-left, off the wall (item 6); the key a guess (Gm 10–100 s, G after: the dominant hue 123° then
    265–273° — two hues against eight) held, not walking with arousal.
  - **WhoLikesToParty**: one clear per drop (item 5; the map's early line wins in file mode, §109's open map finding: drop-57.0 23.8 →
    23.4, drop2-131.0 24.9 → 24.8, drop3-188.0 31.4 → 25.4); the grooves 48–57 against 61–75 (item 1: mid-112 75.3 → 55.3, groove2-160
    74.4 → 48.1, end-252 71.0 → 57.4; the busiest strip 64 → 47, seconds > 60 22 → 0); D major one hue — the dominant hue 21–31° on every
    window from 35 s against 35–329° on twelve (item 2).
  - **Comptine**: the hits spread along the melody's fifths instead of the tri-blob (item 8: x .46–.63, y by the brightness); one warm hue
    (D, 52–84°) against nine (item 2); the piano's ink drains (void-64 44, p99 187 → 153; item 4) and travels (item 3); the applause
    injects nothing (applause-140 p99 124 → 84; item 8); no false clears (item 5); the busiest strip 31 → 31.
  - **The pad take** (`tools/work/rec/s111-i8b/f-*.jpg`, 2 fps; §108's strip `tools/accept/v0.35/fluid-s108-rec-strip.jpg` is the before):
    the floor still its picture (75 % of its ink) at half after its first 5 s (item 7: 12 s 27.6 → 26.6, 17 s 29.7 → 28.0), its 32 hits at
    the harmony's place (item 8), its YIN-ghost sub at the centre-left instead of the right wall (item 6).
  - **Malicious** (record only): the table's rows; nothing asserted.
- **The gates** (every §111 commit: `node tools/check.js` 0 fail / 8 warn — the pre-existing soft caps —, `npm test` exit 0; the final
  tree `test_fluid` **243 ok**). (1) **The real-track identity references**: `GPU=1 SCENES=12 tools/real-md5.sh` twice — `s111a` (PORT
  8971) and `s111b` (PORT 8973), 39 runs each, **727 s** wall each, `f0` 2 / errs [] / bad [] on every run, the two 58-line lists
  **cmp-equal**, and **every one of the 58 FLUID lines moved** against `real-md5-v035.txt` (a grammar change must); **the roster's 174
  lines** (`SCENES="0 1 3" PAR=2 tools/real-md5.sh s111r`, 117 runs, 1450 s wall) **= the reference's 174, line for line** — the
  grammar's velocity reaches no roster scene on advect 0 (§109's call), proven on music after eight velocity changes; the reference's 58
  s12 lines re-based in place (the header says so). (2) **The behaviour rulers**: `SCENES=12 tools/real-rulers.sh s111` — FLUID's 8 rows
  **0 FAIL**, jump viol [] and mon viol [] on every track and the take (picture max .012–.054, state max .0042–.0289), 483 s; the rows
  replaced in `real-rulers-v035.txt`; the rec row reads 244 / 1463 frames against §109's 245 / 1464 — re-run alone (`s111rec`, 26 s):
  244 / 1463 again, deterministic (open below). (3) **The fake smoke**: `tools/scene-md5.sh s111` — **only s12's pair moved**
  (`bf9bcc3e / 35e85096 → 3e483039 / 2274bb4e`), the other 24 lines = `scene-md5-v035.txt`, errs [] hop 840 row 72 on all 13;
  `IDS=12 … s111pair` the same pair again to the byte; the list re-based. The `&fluid=0` list cannot move (the substrate off) — not re-run.
  (4) **Parity** `node tools/parity.js fake`: MS 0 diff, the §83 `nav.*` MISMATCH line to the digit (`max 7.852214593751443 · 72 fields`).
  (5) **The final per-track shots** (`tools/work/fluid-s111/final.sh`: the survey's windows + both 31 s strips per track, one run each, `f0`
  2 and errs [] on all seven, 17:21–17:32 on two ports) — the montages and window shots committed under `tools/accept/v0.35/
  fluid-s111-*` (73 files, 4.4 MB; the strips stay in `tools/work/fluid-s111/<Track>-final/`), the pad's strip `fluid-s111-rec-strip.jpg`.
- **Deviations from §10.1, said plainly.** (a) Item 1's SeeYouDrop windows are outside the survey's ±5 on the three transient windows
  (build-100 −7, the two drop flashes −11 / −12) — the τ and AMP0 were measured at three settings each and the groove / clears held; the
  flashes are dimmer because the hat bucket halves the drop second's 22 droplets and the budget's factor reads 1.3–1.4 at a 15 s build's
  end. (b) Item 5 keeps BOTH triggers in file mode (the proposal said the map's line alone there): Vienna's return has no map line, and
  the confirmation by the sub does what the mode split was for. (c) Item 2's pin is an evidence tally (τ 30 s, a margin, a first-pin
  threshold), not the plain "key at keyConf ≥ .1" — a plain pin re-pinned IBelongHere's Dm / F / Am / C guesses every few seconds (the
  bins 3 3 0 0 4 3 … 11 0 4 2), and the fallback is the harmony's eased CENTRE (15 s), not the frame's harmAngle — a diatonic progression
  walked four hues otherwise. (d) Item 8 was built: items 1–7 left Comptine's and the pad's hits on the fixed pair by the table's own
  column. (e) The noise guard needs the sub gone 8 bars, not `dirty` / `bass` alone: SeeYouDrop's build riser reads exactly like applause
  on those two fields.
- **Open, for the user's eye and the next pass.** (1) The eye on every montage above — in particular SeeYouDrop's dimmer flashes (item 1),
  Vienna's dream at half the floor (item 7: whether the dream should keep the full floor), the harmonic branch's hits on Comptine (do
  they read as the melody?), the pad's take at half the floor after 5 s. (2) The two trace sets disagree on the ears' key timeline
  (IBelongHere Am 22.5 → Dm 65.8 on the §109 truth traces against Dm at 43 s on the survey's whole-track traces; CyborgNinja Dm / Cm against
  Gm / G) — recorded at different HEADs; the ears' tonic, not the grammar; re-record the survey's traces at this HEAD before the next
  pass. (3) CyborgNinja's key is a guess (keyConf p50 .01) and its chromatic C♯ sits at the wall as the tritone of G — the pin holds a
  guess; nothing better exists on that track. (4) WhoLikesToParty's clear in file mode is the map's line a bar early (§109's open map
  finding); the live detector's would be the right one. (5) The rec rulers row's frame count (244 / 1463 against §109's 245 / 1464) —
  deterministic now, one frame off the §109 reference; which recording moved is not established. (6) The kick's and snare's INK is
  still constant per hit (only the force is ranked); the hats' ink too. (7) Malicious: every number for the record in the tables,
  nothing asserted (the user's ruler validation pending). (8) `accept.sh` end to end not run (its real-music block ran as the sweeps
  above; its `== real traces` and fake blocks are the node tests and the smoke here). (9) Not pushed; no version bump.

## §112 v0.35 tagged — a pool of ink under every scene (2026-10-09 evening, one worker; the user: *"tag and deploy once done ; (i'll validate once i'm home later)"*)

- **What ships** (§104–§111, 35 commits ahead of origin's `39c4a78`): the fluid substrate — a Stam solver on the GPU stepped once per frame
  under every scene, after Pavel Dobryakov's WebGL-Fluid-Simulation (MIT; the credit on about.html, in README and THIRD-PARTY.md, all three
  in `dist/`) (§104) · advection in the feedback pass, **opt-in since §109** (`post.fb.advect` default 0; only FLUID sets 1; `&post=<scene>.fb.advect=1`
  is the one-run A/B) (§105, §109) · **FLUID, id 12** — the dye lit as a liquid surface, forced-only, `n` cycles to it, `&scene=12` (§106) ·
  the drop clears the pool on `dropLiveEvt || mapDropEvt`, confirmed by the sub within 1.5 beats (§107, §111) · the harmonic floor from `mid`
  on the track's own range and the chord shears from the v1 `snare` level (§108, §111) · the real-music harness — the fake's lattice events
  reach the scenes, `real-md5-v035.txt` / `real-rulers-v035.txt` / the music traces are the proof, the fake lists the smoke (§109) · the glitch
  rows' switch — `#glitch=0` on any page, key `G`, `post.glitch` (§110) · the grammar tuned on all seven tracks: the density governor, the
  ranked hits, the hat bucket, the pinned key, syrup only while closing, the void's bound and latch, the tonic-relative axis, the floor on the
  track's range, the harmonic branch and the noise guard (§111).
- **The recipe (§91's ritual, as §103).** `package.json` + `assets/core/version.js` 0.34.0 → 0.35.0 · `releases.json` top entry (`v0.35`,
  2026-10-09, class `scene`, title *"A pool of ink under every scene — FLUID"*, decisions §104–§111, scenes `[12]`, no clip; the body credits
  Dobryakov by name with the repo path — `esc()` renders it as text, no link tag) · `npm run build` (33 entries → `site/whats-new.html` 41 KB,
  the card's `#newin` line *New in v0.35: A pool of ink under every scene — FLUID*, `dist/` with about.html's credit sentence and THIRD-PARTY.md)
  · `node tools/bundle.js releases/retinarave-v0.35.html` (**177 modules, 1714 KB** — the frozen page; v0.34's was 171 / 1642 KB).
- **The gates, each green, on the tree AFTER the bump (so the sweep saw the release's own files):** `node tools/check.js` 178 modules, **0 fail**
  / 8 warn (the soft-cap line counts) · `node tools/releases.js check` 33 entries, top v0.35 == package.json, 0 problems · `node tools/whatsnew.js
  --check` up to date · `node tools/license.js --check` **181 public files, 0 without the header** · `npm test` **exit 0** (`test_fluid` 243 ok,
  `test_music` 129 ok) · `GPU=1 PORT=8861 node tools/test_rec.js` **all ok** (`retinarave-v0.35-nav2-…webm`, VER == package.json) · the frozen
  page from `file://` headless (GPU=1, 6 s): `test&scene=0` **errs [] bad [] frameN 345, VER 0.35.0, fluid on**; `test&scene=12` **errs [] bad []
  frameN 341** · the no-third-party receipt on `/` (`NOAUTO=1 … real`) and `/whats-new`: the one host `127.0.0.1:8863` on both · the fake smoke
  (`tools/accept.sh`'s blocks before `== real music`, PORT 8830, ACC v0.35 — the real-music block is NOT re-run here: §109 / §111 ran it, see
  below): **0 FAIL lines in 1331 s** — check 0 fail, the node tests, parity fake (the montage `tools/accept/v0.35/parity-fake.jpg`), parity real (bpm 125.99 vs v3 125.86, arcs identical, drops within 0.5 s), the monitor 60 s on the home `n 3606 fast 2 viol []` errs [] bad [], **24 / 24 scene lines = `scene-md5-v035.txt`** and **24 / 24 = `scene-md5-v035-fluid0.txt`** (s12 `3e483039 / 2274bb4e`, the §111 pair), feigen L3.6 steady 1.32 ms ≤ 3.405 (nav 2.27), the transition, hidden tab / worklet clean, routes, params, landing 10 tiles / 10 thumbnails, help 209 / 209 fields on 13 / 13 ids, the real start path, the bundle 30 s errs [] bad [] · `SCENES=12 tools/real-md5.sh` once more at this HEAD (PORT 8971): **58 / 58 FLUID lines = `real-md5-v035.txt`** (721 s, 58 runs, `f0 2` and errs [] on every one — the §111 references hold at this HEAD, a third cmp-equal run) — the roster's 174 lines stand on §111's
  proof (117 runs, 174 / 174, the grammar's velocity reaches no roster scene on advect 0); the rulers on §111's run (0 FAIL on FLUID's 8 rows).
- **The bench at this HEAD** (HARNESS "## Fluid": q pinned .95, tier 3, sim 259×128, dye 1035×512, `benchFluid(300)` / `bench(0, 300)` interleaved,
  the fake, GPU=1 headless, `CLOCK=0`). The machine was NOT idle — the user's desktop Chrome had two renderers at ~50 % CPU each, load 3.7 —
  so two sets: (a) first, before the sweep: substrate **1.04 (cold, discarded) / 1.01 / 0.96 / 0.95 ms** against NAV **2.21 / 2.18 / 2.22 / 2.16**
  → median **0.96 ms, ratio 0.44**; (b) after the sweep (18:15): load 3.86, the same two renderers: substrate **1.05 (cold) / 1.00 / 1.05 / 0.99 ms** against NAV **2.49 / 2.44 / 2.40 / 2.22** → median **1.00 ms, ratio 0.41**. §104's idle reading was 0.58 ms at NAV 1.35–1.41 (ratio 0.43); §108's 2.68
  at NAV 4.66–4.98 (ratio 0.58) was under desktop load. The ratio is the decidable number (the bench protocol's rule 5): at 0.41–0.44 the substrate
  costs what it cost at §104 relative to NAV, and NAV itself read 1.6× §104's — the load. On the absolute ms the budget (≤ 1.0 ms at tier 3) holds
  at 0.96 / 1.00 under that load — at the line, not over it; a truly idle re-measure is owed (the open list) and would read ≈ 0.6 ms by the ratio. Not a stop.
- **What is live when.** One release commit (this note, `NEXT-SESSION-PROMPT.md`, the generated `site/whats-new.html` + `index.html`'s line, the
  two versions, the entry, the frozen page), `git tag -a v0.35`, `git push origin main --tags` (35 commits — §104–§111 were never pushed; the
  deploy carries all of them). Cloudflare's Git-connected build: 40–85 min on v0.30–v0.33, ~5 min on v0.32 / v0.34 — poll `VER = '0.35.0'` in
  the bundle at retinarave.com, the *New in v0.35* card line, `/whats-new` top card, `/THIRD-PARTY.md` 200. Do not re-push to kick it.
- **What the user validates at home (every remark in track time is a retune request):** (1) **FLUID on every track** — key `n` to the scene (or
  `#scene=12`), file mode, the eye's references are §111's montages `tools/accept/v0.35/fluid-s111-<Track>-montage.jpg` (Comptine, CyborgNinja,
  IBelongHere, Malicious, SeeYouDrop, Vienna, WhoLikesToParty) and the window shots beside them; (2) **the drop flashes dimmer** (§111 item 1: the
  bucket halves the drop second's droplets — SeeYouDrop drop1-57.5 / drop2-105.5); (3) **Vienna's dream at half the floor** (§111 item 7, dream-75:
  the dream's `mid` under the groove's p20 — whether it should keep the full floor); (4) **Comptine's melody placement** (§111 item 8: the hits walk
  with the melody on the tonic axis, .46–.63 — do they read as the melody? and the applause 137–144 s inked as noise, nothing); (5) **the pad at
  half the floor** after 5 s (`fluid-s111-rec-strip.jpg` — the user's own take replayed); (6) **`fb.advect` is opt-in** — NAV / DUST / TORUS2 look as
  v0.34 did (the user: not on nav / particles / torus); `#post=nav2.fb.advect=1` under `#test` is the §105 look for comparison; (7) **the glitch
  switch** — `G` toggles the tear, `retinarave.com/#glitch=0` is the bookmark with it off; the toast says which.
- **Open findings carried into the tag (none retuned — findings, not regressions):** §109's **seven ruler FAILs on DUST (3) and TORUS2 (4)**
  (`real-rulers-v035.txt`: DUST black 391 on IBelongHere 159–219, black 1409 on the take, a jump at Vienna 184.35; TORUS2 jump viol on CyborgNinja
  121.1, IBelongHere 189.8 / 196.9, SeeYouDrop 42.4–44.2 / 76.8, WhoLikesToParty 12.4–53.4 — each a finding to look at on the track, not a gate
  moved) · **the map-vs-ears sub ruler** on Malicious the user will validate (windows.json `gate: false`; every Malicious number is for the record,
  nothing asserted — "can ignore malicious until I validate the ruler") · **the trace-set key-timeline disagreement** (§111 open 2: IBelongHere Am
  22.5 → Dm 65.8 on the truth traces vs Dm at 43 s on the survey's; CyborgNinja Dm / Cm vs Gm / G — recorded at different HEADs; re-record the
  survey's traces at this HEAD before the next grammar pass) · §111's open 3–6 (CyborgNinja's key a guess at the wall; WhoLikesToParty's clear on
  the map's line a bar early; the rec rulers row one frame off §109's; the kick / snare / hat INK constant per hit) · the idle bench re-measure ·
  `accept.sh` end to end (its real-music block = §109 / §111's sweeps) · the §110 `G` key and `#glitch=0` unseen by the user.

## §113 the drop as a shockwave — item 1 of FLUID-DROP (2026-10-09 night, one worker in a worktree off 4bfa5ca; the user's ask after v0.35; item 2, the reversal, is the next worker's)

- **The ask (the user, 2026-10-09, verbatim from FLUID-DROP-SESSION-PROMPT.md):** two drop gestures from the brainstorm, built into the fluid so
  that they work in **live mode** (tab capture / mic — no map, no future; file mode must still work, but live is the design target):
  *"1. Shockwave on the drop — a radial velocity ring from the centre, out at beat speed, throwing the ink outward and leaving a clean centre
  that refills from the drop's kicks. A hit that launches something that travels (the user's validated taste). 2. Time reversal before the
  drop — in the last beat of the build the ink retraces its path inward and gathers (the tension); the drop frame releases it outward (the
  shockwave)."* The user asked whether the two interfere. **The answer agreed:** at the same instant they fight (a reversed dye pass on the
  shockwave's frame pulls ink back along an exploding field — a smear); phased, they are one gesture that matches the ear's arc:
  implosion (the last beat of the build) → explosion (the drop frame) → refill (the beat after). **The phased design:** item 1 the shockwave
  on the CONFIRMED drop trigger (§111 item 5's object: `dropLiveEvt || mapDropEvt` confirmed by the sub returning within `CLEAR_PEND`;
  never `dropEvt`, never a `pred*` field); item 2 an exact reversal by a dye-frame ring armed on the live build detector's last beat
  (`buildLive` latched + `dropLiveIn ≤ 1`), released into item 1's shockwave on the confirmed drop, cross-faded on a fake-out. This section
  is item 1; item 2 has its own heading at the end, for the next worker.
- **Step 0 — the owed bench pre-measure (§112's open list), BEFORE any change, on 4bfa5ca** (HARNESS "## Fluid": `GPU=1` headless 1280×633,
  `CLOCK=0`, the fake, q pinned .95 → tier 3, sim 259×128, dye 1035×512, 8 s settle, one cold `benchFluid(300)` discarded, three interleaved
  pairs `benchFluid(300)` / `bench(0, 300)`). **The machine was NOT idle** (`uptime` load 3.13 / 3.63 / 3.68 at 21:35; the user's desktop
  Chrome renderers at 40.7 / 22.3 / 15.2 / 13.3 % CPU; a second set at 21:37 under load 3.23 / 3.57 / 3.65 with a renderer at 82 %) — recorded
  as it was, not a stop. Set 1: substrate **0.772 (cold) / 0.699 / 0.802 / 0.772 ms** against NAV **1.770 / 3.742 / 2.139** → median
  **0.772 ms, ratio 0.36**. Set 2: **1.007 (cold) / 0.675 / 0.692 / 0.709 ms** against NAV **1.833 / 2.804 / 2.044** → median **0.692 ms,
  ratio 0.34**. §112's two sets under its load read 0.96 / 1.00 ms at ratio 0.44 / 0.41; §104's idle 0.58 at 0.43. So the pre-change number
  for this item is **0.69–0.77 ms at ratio 0.34–0.36** under a load of ~3.5 — the budget (≤ 1.0 ms at tier 3) holds with room; a truly idle
  reading is still unseen (every reading on this machine has the user's Chrome on it).
- **Item 1 — what changed.** `core/fluid/inject.js`: `K` gains `SW_C` .5 (the front travels one screen RADIUS — half the height — per beat),
  `SW_W` .08 (the ring's Gaussian width, screen heights), `SW_T` .5 (beats the wave runs), `SW_K` 1.5 (A at the top of the law, in units of
  the front speed), `SW_A0` .5 (the law's floor); `mkState` gains `rkB` (the track's own kicks' bass levels, RANK_N of them), `swLeft` / `swT` /
  `swA`; `plan()` returns **`ring`** `{a, r, w}` (uv/s at the front, the front's distance in screen heights, the width) or null — on the frame
  the clear is confirmed (`drop` 1) the wave fires with `A = SW_K · (SW_C / beat) · g · (SW_A0 + (1 − SW_A0) · rank)`, then every frame for
  `SW_T` beats the front is at `SW_C · t / beat`. `core/fluid/fluid.js`: **the force kind** — `FLUID.wave` (that step's ring) and
  `ctx.fluid.ring(a, r, w)` (a scene's, on the next step, the same one-frame caveat as `splat`; where both land the larger amplitude wins);
  no extra draw — the ring rides the ADVECT pass as uniforms `uRing` / `uAspect` / `uDye` (a uniform branch; A 0 is the identical program path,
  which the roster's identity proof below rests on); `benchFluid(n, S, ring)` holds a ring on every step (`CARD.benchFluid(n, ring)`).
  `core/fluid/shaders.js` ADVECT: on the velocity pass the ring is SET at the front — `v → mix(v, A·r̂, m)`, `m = exp(−((r − front)/w)²)` — not
  added, because a radial field is curl-free and the projection strips an added one to its Jacobi residual (§104's uniform-force lesson);
  set each step it never accumulates, and the dye advect, which samples this pass's output, rides it the same frame. **And on the dye pass the
  ring's own divergence** — the first strips (below) showed the ring emptying NOTHING: semi-Lagrangian advection copies the back-traced value,
  so a divergent field stretches the centre's ink over the disc (a smooth full disc with concentric ripples in the shot; WhoLikesToParty's
  centre 62 → 65–69 with the ring and no dissipation spike). A pressure wave is compressible for the ink: `ρ ← ρ · (1 − ∇·v · dt)`, and
  `∇·(m · A · r̂) = A · m · (1/r − 2(r − front)/w²)` is analytic — positive inside the front (the ink thinned as the front sweeps through
  it), negative outside (piled up at the front): the ink is CARRIED outward. The probe (the fake, `&fluiddbg=1`, `benchFluid(30, {a 1.5,
  r .15, w .08})` held): the disc r < .08 **24.5 → 12.6**, the .08–.2 band **31.3 → 8.3**, .2–.3 23.8 → 7.7, .3–.45 33.9 → 12.9 — the same
  probe before the term read 29.3 / 28.3 / 27.2 / 28.3. `scenes/fluid/index.js`: the §106 six-droplet ring on the drop is gone (below);
  `kick.x` (the monitor's declared cut) is the drop's envelope on the clear's frame; the sparkle is its one injection. `tools/fluid-drop-strip.sh`
  (the strip recipe, HARNESS "## Fluid"), `tools/fluid-replay.js` (the ring per frame / second), `tools/fluid-tracks.js` (a `shockwaves`
  column; `TRACES=<dir>`), `tools/test_fluid.js` (the `shock` block; the music block's shockwaves == clears). CONTRACTS §1.1 (`ctx.fluid`:
  `ring`, `wave`), §1.4 (the force kinds); HARNESS "## Fluid" (`CARD.fluid.wave`, `benchFluid(n, ring)`, the drop-strip recipe).
- **Trigger frame vs confirmation frame — the confirmation, measured.** The shockwave fires on the frame the §111 item 5 clear fires (the sub
  emitter opening within `CLEAR_PEND` after `dropLiveEvt || mapDropEvt`), never on the trigger alone. The prompt's rule: fire on the trigger if the
  false-positive count stays 0 on the gated six. It does not: on the survey's whole-track traces the TRIGGER frames carry **IBelongHere's four
  live arms in its 144–178 s breakdown (157.23 166.87 168.93 173.05) and Comptine's five (47.5 52.17 58.88 107.92 128.95) plus its one map line
  (107.37)** — ten shockwaves over pools that never cleared; the CONFIRMED frames carry none (0 clears off a truth drop or a map line on any
  trace, both modes). The cost of waiting, per clear (trigger → confirmation, frames): SeeYouDrop live **3 / 3**, file 0 / 1; Vienna live **4**,
  file 0; WhoLikesToParty live **0 / 0 / 0**, file 0 / 1 / 1; IBelongHere file 2 / 1 / 1 / 1 / 2, live **36** (the 178.58 arm; the sub returned
  at 179.13, the clear 179.18 — 0.6 s late on the one live drop its detector finds; the map's line, in file mode, is 2 frames). So the shockwave
  lands 0–67 ms after the ear's drop on every drop but IBelongHere's live return, where it lands 0.6 s late — a finding on the detector's
  placement (its arm is early: the slam the user hears is the sub's return at 179.13), not the grammar's.
- **The amplitude — a measured deviation from the design's `dropStrength` knee.** At the confirming frame `dropStrength` (the extractor's level,
  set on its own `dropEvt`, feats.js) reads **0.00 on all three WhoLikesToParty drops and on IBelongHere's 16.4 / 32.7 lines** (the extractor
  never fires a drop on WhoLikesToParty — FLUID-TRACKS §6 — and §107's rule is that its drop is not the grammar's), 1.00 on SeeYouDrop's, Vienna's
  and IBelongHere's 65.2; `loudAbs` is 1.0 on every one (no range); `loudRel` .69–1.00. The causal witness that is on every clear is the slam
  itself — **`bass` on the confirming frame: SeeYouDrop 1.00 / .93 (live), .95 / .87 (file); Vienna 1.00; IBelongHere 1.00 / .79 / 1.00;
  WhoLikesToParty .69 (live), .66 (file)** — §111 item 5's own witness (a drop IS the bass slamming back). So the law ranks that level among the
  track's OWN kicks' bass (`rkB`, pushed on every `kickEvt` with the sub open, the §111 rank: 0 at the lane's p10, 1 at its p90, the pooled
  prior .3 / .95 under 8 hits): `A = SW_K · (SW_C / beat) · g · (SW_A0 + (1 − SW_A0) · rank)` — SeeYouDrop's 1.00 against its kicks' p90 .96
  ranks 1, WhoLikesToParty's .66–.69 against .87 sits mid-range. Per clear, A in uv/s (the survey's whole-track traces, `tools/fluid-tracks.js`):
  **SeeYouDrop 1.36 / 1.55 (file), 1.37 / 1.60 (live) · Vienna 1.06 / 1.06 · IBelongHere file 1.31 / 1.22 / 1.32 / 1.30 / 0.94, live 0.97 ·
  WhoLikesToParty file 0.76 / 0.68 / 0.80, live 0.89 / 1.18 / 0.67** — the ring 12–21 frames, its front ending at .23–.25 screen heights
  (half a radius in half a beat). `g` carries `loudRel` (the track's own loudness ladder) and `presence` (a quiet frame fires A 0).
- **The live detector per track under `&map=0` (the whole tracks; hits within 1.5 s of a truth drop, windows.json):** SeeYouDrop **2 / 2**, 0
  false · Vienna **1 / 2** (85.33; the hand-listed bar 40 at 106.67 never arms), 0 false · IBelongHere **1 / 4** (178.58 only; 15.9 / 64.7 / 129.8
  unseen) + **4 false arms** in the breakdown, every one rejected by the confirmation · WhoLikesToParty **3 / 3**, 0 false · CyborgNinja 0 / 0, 0
  false (the control) · Comptine **0 / 3** (a piano piece) + **5 false arms**, none confirmed · Malicious 0 / 1 (record only). File mode adds the
  map's lines: IBelongHere's five (16.4 32.67 65.22 130.28 179.1) and WhoLikesToParty's three a bar early (56.5 130.33 187.77); Vienna has no
  map line on either drop. So on a live night the shockwave fires on SeeYouDrop ×2, Vienna ×1, WhoLikesToParty ×3, IBelongHere ×1 (late), nowhere
  else — exactly where the pool clears.
- **The droplets — gone (one ring).** FLUID's §106 ring of six droplets (`RING_N` 6 at `RING_R` .22, `RING_V` 1.6 uv/s, `RING_DYE` .04) fired on the
  same frame. Measured on SeeYouDrop's two live drops before the scene edit and after it (the centre disc, 0.1 s apart): with the droplets **81 →
  151 (the flash) → 93 → 57 → 44.6 → 41.6 (+0.4 s) → 42 → 44** and without **81 → 151 → 91 → 57 → 44.6 → 41.5 → 42 → 44**; drop 2 42.8 vs 43.0 at
  +0.4; the whole-frame p99 106 vs 107 — six point-pushes next to a velocity ring moved nothing the ruler or the eye can see, so they go: the
  substrate's ring is the one ring, and the scene throws nothing on the drop (its one injection is the sparkle).
- **The per-track table** (`tools/fluid-drop-strip.sh`: one deterministic whole-track run per track × mode × variant, `at=0`, CLOCK=1 GPU=1,
  `f0` 2 and errs [] on every run; shockwaves and confirmed drops on the survey's whole-track traces; the live detector's hit / miss against
  windows.json's truth drops under `&map=0`; the CENTRE grey — the disc of radius .25·H round the canvas centre — 0.4 s after the confirmed
  clear, for the §107 dissipation spike alone (`SW_K` 0) / the shockwave alone (`DROP_DISS` 1) / both (what ships); the empty centre reads
  27–36 on these tracks (SeeYouDrop's intro 32, Vienna's 36, WhoLikesToParty's cleared pool 27 — the porthole lights the centre above the
  whole-frame 22–24), the pre-drop centre 44–86):

  | track | shockwaves / confirmed drops (file · live) | live detector hit / miss (false arms, all unconfirmed) | centre +0.4 s: spike · ring · both |
  |---|---|---|---|
  | SeeYouDrop | 2 / 2 · 2 / 2 | 2 / 2 (0) | live 41.9 · 43.4 · **40.8** ; 43.9 · 44.8 · **42.2** (file both 40.0 / 42.7) |
  | WhoLikesToParty | 3 / 3 · 3 / 3 | 3 / 3 (0) | live 36.0 · 34.6 · **33.6** ; 34.3 · 31.3 · **30.5** ; 34.1 · **43.2** · **32.3** (file both 25.5 / 25.2 / 25.3 — the map's line a bar early clears an emptier pool) |
  | Vienna | 1 / 1 · 1 / 1 | 1 / 2 (0): bar 40 at 106.67 never arms | live 38.1 · 39.4 · **37.2** (the floors 37.4 · 37.7 · 36.5 at +0.3–0.6; file both 36.9) |
  | IBelongHere | 5 / 5 · 1 / 1 | 1 / 4 (4, the 144–178 s breakdown) | file 35.1 · 36.7 · **33.4** ; 38.3 · 41.4 · **37.3** ; 41.5 · 41.4 · **37.8** ; 44.8 · 46.3 · **41.3** ; 33.5 · 34.7 · **30.8** (live both, the 179.18 return: 66 → **29.4** at +0.3) |
  | CyborgNinja | 0 / 0 · 0 / 0 | 0 / 0 (0) — the control | — |
  | Comptine | 0 / 0 · 0 / 0 | 0 / 3 (5) — a piano piece; the map's one line at 107.37 unconfirmed | — |
  | Malicious (record only) | 0 / 0 · 0 / 0 | 0 / 1 (0) | — |
  | the pad take | 0 / 0 (live) | 0 / 0 (0) | — (`tools/rec-strip.sh … s113`: 49 shots, errs [], the grey line 16 … 28 … 27 as §111's; its two md5 lines unmoved) |

  Reading the strips (the committed montages, `tools/accept/v0.36/fluid-s113-<Track>-drops.jpg`, 0.1 s apart from 1.5 beats before to 1.5 beats
  after each clear): the pool full to the frame before; on SeeYouDrop the composite's flash (the centre 151–172) on the clear's frame; then the
  ring's front crossing the centre disc — the centre 92 → 52 → 42 at +0.1 / +0.2 / +0.3 s on SeeYouDrop, 48 → 38 → 34 on WhoLikesToParty, 47 →
  41 → 37 on Vienna — the floor at +0.3–0.4 s, held for the clear's beat, then the refill from the drop's kicks (+0.5 → +1.5 beats: 41 → 46 →
  49 on SeeYouDrop). The ring alone is AHEAD of the spike at +0.2 s on every track (SeeYouDrop 52 vs 59, IBelongHere 36–45 vs 46–53) — the
  centre empties physically, outward, instead of fading in place — and the whole frame stays full behind the front (whole-frame +0.4 s: ring
  alone 54–60, spike alone 27–35): the ink pushed to the edge survives, as the design wanted.
- **`DROP_DISS` stays 12 — both, and why.** The rule was: drop the spike to a small value if the shockwave alone clears to within 10 % of the
  spike's floor. It does on **10 of 11** drops (SeeYouDrop +3.6 / +2 %, WhoLikesToParty −4 / −9 %, Vienna +1 %, IBelongHere +5 / +8 / −3 / +3 /
  +4 %) and fails on **WhoLikesToParty's drop 3: 43.2 against 34.1 (+27 %)** — the softest slam in the library (bass .66 against the track's
  kicks, A .67, the lowest rank), where the ring at .67 uv/s does not outrun its own front and leaves a third more ink in the centre. And on
  every track the centre refills 5–10 grey faster without the spike over the beat after (IBelongHere's 130 s line +0.4 / +0.5 / +0.6 s: 46 /
  53 / 56 against 41 / 44 / 48; Vienna 39 / 42 / 42.5 against 37 / 38 / 37) — the spike is what holds "cleared, now refilling" for the beat
  (§107's read). So the amplitude law does what it should (a soft drop is a softer throw) and the spike stays as the floor's guarantee: the
  ring throws, the spike holds. The trade recorded for item 2 and the user's eye: with 12 the ink the ring pushes to the edge is dissolved
  within the beat too (whole-frame 27–35 at +0.4 s against 54–60 with the ring alone) — a smaller spike (6: 10 % of the ink left after the
  beat, §107's number) would keep more of the thrown ink and was NOT measured here; it is the one knob to try after the reversal lands, on
  every track, with WhoLikesToParty's drop 3 as the ruler.
- **The gates, each run on the tree as committed (wall times):** `node tools/check.js` **0 fail** / 8 warn (the pre-existing soft caps) ·
  `npm test` **exit 0** — `test_fluid` **299 ok** (the `shock` block; the music block's shockwaves == confirmed clears on every trace: SeeYouDrop 2
  / 2, Vienna 1 / 1, WhoLikesToParty 1 / 1 in 110 s, IBelongHere-map1 3 / 3 and -map0 0 / 0, Comptine / CyborgNinja / the pad 0 / 0, each ring
  SW_T beats ± 2 frames with its front at SW_C·SW_T ± .03), `test_music` 129 ok, 11.4 s · `SCENES=12 tools/real-md5.sh s113a / s113b`
  (PORT 8981, 39 runs each, **717 s** each): **58 / 58 cmp-equal twice**, `f0` 2 and errs [] on all 78 runs; **3 of 58 lines moved** against
  `real-md5-v035.txt` — `s12-SeeYouDrop-groove-f602-m1`, `s12-IBelongHere-groove-f602-m1` (their `at` contains a map line, so `mapDropEvt`
  fires on the file's first frame — §107's `at=80` pitfall — and the first-frame clear now throws the ring too) and `s12-WhoLikesToParty-
  drop1-f1532-m1` (one second after its map line: the ring's wake); the 55 others, the drop shots ON the clear's frame among them, unmoved
  — the ring is on the frame after the fire, the dye lands next step · the roster: `SCENES="0 1 3" PAR=2 tools/real-md5.sh s113r` (117 runs,
  **1440 s**): **174 / 174 = `real-md5-v035.txt`**, `f0` 2 on every run — the ring reaches no roster scene (advect 0; the ADVECT program's
  branch is A 0 there) · the fake smoke `tools/scene-md5.sh s113` **26 / 26 = `scene-md5-v035.txt`** (the fake has no drop: s12's pair does
  not move either) and `s113off '&fluid=0'` = `scene-md5-v035-fluid0.txt` line for line, errs [] on all 13 ids · parity fake (ACC v0.36):
  max **7.852214593751443**, 72 fields, the §102 `nav.*` MISMATCH line to the digit · `SCENES=12 tools/real-rulers.sh s113` (**481 s**): FLUID
  **8 / 8 ok** — jump viol [] (every shockwave frame inside the picture rule; max 0.017–0.054), mon viol [] (the state monitor max 0.004–0.029),
  black 0, clip25 0 on every row; the rec row 244 / 1463 as §111's. The new references: `tools/accept/v0.36/real-md5-v036.txt` (the roster's
  174 as v035 + FLUID's 58), `real-rulers-v036.txt`; the fake lists stay v035's.
- **The bench after the change** (the same recipe as step 0, the machine as loaded — the desktop Chrome's renderers at 22–40 % CPU): set 1
  (load 2.19 / 2.87 / 2.90) substrate **0.861 (cold) / 0.914 / 0.670 / 0.672 ms** against NAV **1.555 / 1.451 / 1.382** → median **0.672,
  ratio 0.46**; set 2 (load 2.24) **1.243 (cold) / 1.096 / 0.707 / 0.719** against **1.613 / 2.166 / 1.687** → median **0.719, ratio 0.43**.
  Pre-change 0.69–0.77 at ratio 0.34–0.36 under load ~3.5 (NAV read 2.0–2.1 then, 1.4–1.7 now): the substrate's absolute cost did not move
  (0.67–0.77 both sides, inside the ≤ 1.0 ms budget), the ratio rose with NAV's own speed, not ours. **The ring's cost** (`benchFluid(300,
  {a 1.4, r .12, w .08})` held on every step, three triples ring / no ring / NAV): **1.093 / 1.050 (cold pair) · 0.681 / 0.727 · 0.712 / 0.684**
  against NAV 1.554 / 1.412 / 1.378 — the ring costs nothing the bench can see (±0.03 ms, both ways): it rides the ADVECT pass as a uniform
  branch over 259×128 + 1035×512 texels, no draw added. **The phone path** (`MOBILE=1`: 390×844 at DPR 3 → the 1170×2532 canvas, q pinned .1 →
  tier 0, sim 64×139, dye 256×554): ring / no ring / NAV **0.518 / 0.508 / 2.203 (cold pair) · 0.290 / 0.344 / 1.842 · 0.347 / 0.387 / 1.970**
  → **0.35 ms with the ring at tier 0** (budget ≤ 0.4), errs [], glerr 0; and the live drop on the phone (`test&track=SeeYouDrop&at=0&scene=12
  &map=0`, CLOCK=1, cold from 0 so the detector has its 32 s): `f0` 2, errs [] bad [], the clear at 57.65 — the whole frame 111 → **42** and
  the centre 130 → **66** at +0.4 s, refilled to 113 at +1.0 (`tools/work/fluid-drop/phone/`; a first run at `at=40` armed nothing — inside
  the detector's 32 s warm-up, the pitfall for anyone shooting a live drop from mid-track).
- **What the eye should look at.** `tools/accept/v0.36/fluid-s113-SeeYouDrop-drops.jpg` (live, 2 × 15 frames: the flash, the front through
  the centre, the clean centre, the refill), `-WhoLikesToParty-drops.jpg` (live, 3 × 17: no flash — the extractor never fires there — so the
  ring is the whole gesture), `-Vienna-drops.jpg` (live, 23 at 90 bpm: the slowest front), `-IBelongHere-drops.jpg` (file mode, 5 × 17: the
  map's lines; the 179 s return the deepest), `-SeeYouDrop-variants.jpg` and `-WhoLikesToParty-drop3-variants.jpg` (rows: spike alone / ring
  alone / both — the first shows why the ring, the second why the spike stays). The strips themselves: `tools/work/fluid-drop/<Track>-m<map>-
  <both|sw|spike>/`, `grey.txt` with the centre column.
- **Deviations from the design, said plainly.** (a) The amplitude is ranked `bass` on the confirming frame, not a knee on `dropStrength` (0.00
  on five of eleven clears — measured above). (b) The shockwave fires on the CONFIRMED frame (the design allowed the trigger frame if the
  false count stayed 0; it is 10 on the gated six). (c) The ring is no extra draw — the design budgeted one; it rides the ADVECT pass. (d) The
  ring needed the compressible term on the dye pass that the design did not foresee (the first strips measured the copy-only ring emptying
  nothing). (e) `DROP_DISS` kept at 12 by the rule's own failure on one drop. (f) The scene's droplets removed, not made to ride the front
  (measured: invisible next to the ring).
- **Open.** (1) The survey's whole-track traces are still the §111 set — the §112 re-record at this HEAD was started and stopped: a whole-track
  `'*'` trace overflows `filetrace.js`'s chunk cap (25.6 of 40.5 MB on WhoLikesToParty); a field subset fits, and nothing here needed it (every
  FLUID_FEATS field, `bass` included, is in the survey's). (2) IBelongHere's live return lands 0.6 s late (the detector's arm at 178.58, the
  sub's return at 179.13) — the detector's placement, for `engine/build`. (3) Vienna's bar 40 (106.67) never arms the live detector; the map
  has no line there either — one of its two drops has no shockwave in any mode. (4) The first-frame `mapDropEvt` clear on a mid-track `at=`
  now throws the ring too (two groove references moved for it). (5) `DROP_DISS` 6 with the ring, untested (above). (6) The user's eye on all six
  montages, and the live night: the ring on a tab capture is the same object as on the file (the grammar is canvas- and mode-independent;
  the detector is the only difference, measured above). (7) The idle bench is still unseen on this machine (every reading has the desktop's
  Chrome on it); the post-change numbers are the honest ones.

### Item 2 — the reversal (next worker)

Not started. FLUID-DROP-SESSION-PROMPT.md "Item 2" is the design: a ring of dye frames at reduced resolution, armed on `buildLive` latched +
`dropLiveIn ≤ 1`, released into item 1's shockwave on the confirmed drop (`plan()`'s `drop` 1 / `ring` on that frame), a cross-faded resume
on a fake-out, the §1.9 step measured at every resume, the fake-out budget per track. What item 1 leaves it: `FLUID.wave` / `ctx.fluid.ring`
(the shockwave's frame is `P.drop === 1`), the strip recipe (`tools/fluid-drop-strip.sh`, the centre grey), the per-track clear times above,
and the open knob `DROP_DISS` 6 — to be measured with the reversal in place, on every track.

## §114 FLUID joins the bid (2026-10-10, one worker in a worktree off 4bfa5ca; the user: *"add fluid to the bid"*)

- **The ask**, verbatim: *"add fluid to the bid"*. FLUID (id 12, §106) shipped forced-only in v0.35 under §93's roster rule (*"only rotate
  through NAV, DUST, TORUS2"*). It bids now: the roster is NAV2 (0, home) + DUST (1) + TORUS2 (3) + FLUID (12); nothing else changed
  — `core/scenes.js` is untouched (the precedence, the 0.1 noise, the −0.6 / −0.25 history dock, the §95 dwell all stand), no solver
  or grammar file moved, no version bumped. `§113` is left for the drop session (FLUID-DROP-SESSION-PROMPT names it).
- **The fit model**, in §93's own terms (a territory read from smoothed fields the engine has, the §93 shape — a standing term, the rest
  to a 1.1 cap, 0 during a build since home parks there by precedence):

  | scene | id | bid | max | territory |
  |---|---|---|---|---|
  | NAV (home) | 0 | `0.5 + buildLive` | — | builds, drops, silence, by precedence (§93, moved to nav2 at §102) |
  | DUST | 1 | `0.3 + 0.4 punchy + 0.4 calm` | 1.1 | transients, slow / sparse sound (§93) |
  | TORUS2 | 3 | `0.35 + 0.35 clarity + 0.4 regularity` | 1.1 | tonal, steady grooves; +0.1 standing as the user's favourite (§93) |
  | **FLUID** | **12** | **`0.35 + 0.4 bassS + 0.2 min(1, keyConf / 0.6) + 0.15 (1 − centroid)`** | **1.1** | **sub-driven passages under a sure key, in a dark mix — was 0** |

  Why these terms, from what FLUID is (§104–§111): the ink ENTERS where the bass note is (inject.js's sub emitter; every library track
  injects on 94–100 % of its music seconds, §111's table, and the sub's x is the tonic axis), so the bass line carrying the mix is the
  first term — `bassS` (synapse's .5 s ema, AGC-normalised) rather than the fast `sub` band, because a bid is read at one instant (a
  trigger frame) and must not flicker between beats; the key is the ink's COLOUR through keycolour's KEYC0 .1 .. KEYC1 .3 gate, and a
  track with no key is a grey pool (Comptine's 0 % key-coloured frames in §111's table against 81–100 % on the six others), so a sure
  key is the second term with GIELIS's §93 normalisation (`keyConf / 0.6`: the ears' tonicConf reads .3–.7 on a right key); a dark
  mix is where a pool reads as a pool (CHLADNI's §93 `1 − centroid` term, small). The standing 0.35 is TORUS2's, so FLUID bids at
  least as readily as the user's favourite mapping (the ask's floor: the boring-ranking put MAXWELL and CHLADNI lowest, not FLUID);
  the 0.4 / 0.2 / 0.15 split puts the bass first, as the grammar does. What it does NOT read: `regularity` (TORUS2's axis, so the
  two territories split on it), `punchy` / `calm` (DUST's). The noise guard (§111 item 8: dirty > .7 and bass < .2 injects nothing)
  needs no term — a noise passage has no bass and no key, and the bid reads 0.45 there on its own.
- **The bid table on synthetic profiles** (`node tools/test_director.js` step 10 prints it from the four REAL `score()` functions,
  imported from the scene modules — no init, no GL; the lead is over the runner-up, the hash noise is 0.1):

  | profile (bassS keyConf centroid · clarity regularity · punchy calm) | NAV | DUST | TORUS2 | FLUID | picked, by |
  |---|---|---|---|---|---|
  | sub-driven drop window (.95 .4 .35 · .5 .8 · .6 .1) | .500 | .580 | .845 | **.961** | FLUID by .116 |
  | sub breakdown (.85 .3 .25 · .3 .5 · .3 .3) | .500 | .540 | .655 | **.902** | FLUID by .247 |
  | steady tonal groove (.8 .5 .5 · .9 .9 · .3 .3) | .500 | .540 | **1.025** | .912 | TORUS2 by .113 |
  | slow sparse intro (.2 .2 .5 · .4 .3 · .8 .7) | .500 | **.900** | .610 | .572 | DUST by .290 |
  | calm tonal pad (.3 .6 .4 · .8 .2 · .1 .8) | .500 | .660 | .710 | **.760** | FLUID by .05 — a near tie, the hash decides (the pad recording is FLUID's territory as much as TORUS2's) |
  | dense peak (.9 .5 .6 · .7 .9 · .7 .05) | .500 | .600 | **.955** | .937 | TORUS2 by .018 — a near tie, both read a peak |
  | noise, no bass (.1 .1 .8 · .2 .3 · .4 .3) | .500 | .580 | .540 | .453 | DUST, FLUID last |
  | neutral (.5 .3 .5 · .5 .5 · .5 .5) | .500 | .700 | .725 | .725 | the dock rotates |

- **What the Node proof shows** (`tools/test_director.js` step 10, 29 assertions, 67 in the file, OK): the four leads above (the three
  that matter wider than the noise); a build zeroes every away bid (NAV 0.5 stands); `pickScene` picks FLUID on the drop window for 50
  of 50 section hashes, TORUS2 on the groove for 50 of 50, home in a build for 50 of 50; 12 neutral picks through the history dock
  rotate DUST / TORUS2 / FLUID 4 / 4 / 4 (nobody starves; NAV is home by precedence, not by bid); through `updateScenes`: the groove
  lands TORUS2, the drop hard-cuts home, the identify in the window after it picks FLUID (hist 12,0,3 — the dock on TORUS2), a drop /
  a build / silence each take FLUID home; the dwell: a landing on FLUID draws 30 s and two identifies at 10 s and 20 s on TORUS2's
  profile move nothing, the first after 30 s switches to TORUS2; a forced scene (`SC.forced` — the panel's force and its preset's
  `manual.scene`, §94) shows DUST on the drop window through a surprise, an identify and a drop, forced FLUID stays on the groove
  TORUS2 would win, and the release picks by the bid (FLUID on the drop window, TORUS2 on the groove). Two things the test taught
  about the director, not bugs: the history dock counts forced stays too (`goScene` files every landing), so the first pick after a
  release docks the scene just released; and v3's phrase trigger fires every 16 beats from `awayBeat` once 32 beats have passed — the
  test pins the home stub's `awayBeat` at 0.5 so each pick is the trigger it fires. `check.js` 0 fail (`help.feats gaps 0`; the four bid
  fields carry `the bid:` lines and nothing else in the folder reads them), `npm test` exit 0 (the whole chain: test_fluid 243 ok,
  test_music 129 ok), `license.js --check` 0 without the header.
- **What moves and what does not.** No pixel: the bid changes PICKS, not frames — `parity.js fake` forces `&scene=0`, `scene-md5.sh`
  forces each id, `real-md5.sh` / `real-rulers.sh` force theirs, so every md5 and ruler reference (`scene-md5-v035.txt`,
  `real-md5-v035.txt`, `real-rulers-v035.txt`) is expected unchanged line for line. The director TRACES change — that is the point.
  Where §109 / §111 / HARNESS say "no roster scene reads the dye / velocity", roster means the three pre-§114 scenes (0 1 3); the
  identity claim (a grammar change moves s12's pair alone) is unchanged by this section because FLUID still is the only reader.
- **NOT proven here (owed to the orchestrator's release gates, Chrome / GPU):** the real-music director picks — HARNESS's rule for *"a
  scene enters the director's rotation"*: the Q trace on house + aba after the promotion (`tools/director-trace.sh`, `director-stats.js`:
  how often FLUID is picked, on what, and the stays' lengths under the dwell), and the user's eye on it in track time (§93's territories
  were a first cut too, retuned from remarks); the md5 / ruler lists re-run as the receipt that nothing underneath moved. The synthetic
  profiles are the fit model's own arithmetic, not a track: whether a real drop window reads `bassS` .95 / `keyConf` .4 is for the trace.

## §115 v0.36 tagged — the drop as a shockwave, FLUID in the rotation (2026-10-10 night, one worker on main; the user: *"add fluid to the bid; tag and deploy"*)

- **What ships** (two merged branches on v0.35's live tree): **§113** — the shockwave on the confirmed drop (branch fluid-drop-1: the velocity
  ring that carries, SET curl-free on the velocity pass with its analytic divergence on the dye pass, the amplitude from the bass rank, the
  droplets gone, `DROP_DISS` kept 12, `FLUID.wave` / `ctx.fluid.ring`, no extra draw) and **§114** — FLUID (id 12) joins the director's bid
  (branch fluid-bid: `0.35 + 0.4 bassS + 0.2 min(1, keyConf / 0.6) + 0.15 (1 − centroid)`, 0 in a build; `core/scenes.js` untouched). §114
  owed one proof — Chrome's: *"a scene enters the director's rotation"* (HARNESS "What to re-prove") — paid here first.
- **Step 1 — the director traces after the promotion** (`ACC=v0.36 GPU=1 PORT=8975 tools/director-trace.sh s114 house`, then `aba` on 8976 —
  one style per call once `PORT=` is set, two lanes on one PORT would share the debug port; `tools/accept/v0.36/director-{house,aba}-s114.txt`,
  `director-stats.js`; and, because a SCENE@ line says *that* FLUID was picked and not *why*, `tools/director-bids.js` (new: the four real
  `score()` values at 1 Hz with the director free, the fields they read, the bids on every pick's second — `tools/accept/v0.36/director-bids-
  <style>-s114.json`). The demo synths use `Math.random()`, so the counts are what to compare, as HARNESS says. Per trace:
  - **house, 120 s:** scene sequence **0 3! 0 3** (= §95's dwell trace, 0 3! 0! 3). Stays: NAV 0.39–53.47 (53.1 s, through the 6.71 and 45.61
    drops), TORUS2 53.47–76.16 (22.7 s, a surprise hard-cut in; **ended by the build parking home** at 76.16 — `bld` .55 on the nearest 1 Hz line,
    the SECTION build declared at 83.19, home through the 90.61 drop: the ungated precedence, as §95 read it), NAV 76.16–109.34 (33.2 s), TORUS2
    from 109.34 (an identify, on the bar line `bar0.01`, held 3.6 beats). **Away picks 2: TORUS2 2, FLUID 0, DUST 0**; time NAV 86.3 s (72 %) /
    TORUS2 33.3 s (28 %); 4 returns → 4 RESTORE@, 0 stale; 1 SWITCH@ on the bar line, 0 off. The bids on the pick seconds: @53 TORUS2 **.999**
    vs DUST .577 vs FLUID .579 (bassS .21, keyConf .14); @109 TORUS2 **1.072** vs .578 / .557 (bassS .27, keyConf .01). Raw lead over the 120 s
    (no noise, no dock): TORUS2 80 s, NAV 40 (31 of them the build's zeroes), FLUID **0**; among the away three TORUS2 89 / DUST 31 / FLUID 0.
    Medians: TORUS2 .98 (clarity .86, regularity .99), DUST .57, FLUID **.54** (bassS **.18**, keyConf **.02**, centroid .41). The house synth
    has no sub to speak of and no key the ears can hold — it is TORUS2's territory by §93's own terms, and FLUID's 0 of 2 there is the fit model
    doing what §114 says it does (a steady tonal groove → TORUS2 by .11 on the synthetic table; here by .42–.52).
  - **aba, 190 s:** scene sequence **0 3 12! 3!**. Stays: NAV 0.33–31.48 (31.2 s, through the 7.80 drop), TORUS2 31.48–117.21 (85.7 s, a phrase
    pick on the bar line `bar0.06`), **FLUID 117.21–163.17 (46.0 s**, a surprise hard-cut in, `bar1.24`), TORUS2 from 163.17 (26.5 s to the end, a
    surprise). **Away picks 3: TORUS2 2, FLUID 1 (33 %), DUST 0**; time NAV 31.2 s (16 %) / TORUS2 112.3 s (59 %) / FLUID 46.0 s (24 %); 7
    returns → 7 RESTORE@, 0 stale (two of them file FLUID as the owed scene: 142.29 alt1→12, 166.49 alt2→12 — the second is still owed at the
    trace's end, inside TORUS2's dwell); 1 SWITCH@ on the bar line, 0 off; no build on aba (0 build seconds), so no park. The bids on the pick
    seconds: @32 TORUS2 .974 vs FLUID .785 vs DUST .646 (bassS .36, keyConf .58); **@117 TORUS2 .951 raw, FLUID .687, DUST .513 — FLUID won
    through the −0.6 history dock on TORUS2 (the scene on screen, .951 → .35), not on the raw bid**; @163 TORUS2 .967 vs FLUID .694 (now docked)
    vs DUST .553. Raw lead over the 190 s: TORUS2 183, NAV 6, FLUID **1**. Medians: TORUS2 1.02, FLUID **.65** (bassS .23, keyConf .36,
    centroid .33), DUST .59. So on the demos FLUID is picked the way DUST is on house: by the dock's rotation, not by leading — the demo
    synths carry a quarter of the sub a real track does (next).
  - **DUST: 0 of 5 away picks across both traces.** Not new — §95's dwell traces on house had DUST 0 of 2 too (the dwell cut the house
    churn from 12 picks, 4 of them DUST, to 2); DUST's raw bid leads on 31 of house's 120 s (the sparse seconds) but never on a pick's
    second. A number to watch, not a stop: the dock rotates it in on a neutral profile (§114's table, 4 / 4 / 4), and the user's eye on real
    tracks decides the territories, as §93 said.
  - **Supplementary — two real tracks with the director free** (`CLOCK=1 … test&track=<T>&at=0`, 110 s from 0, `f0` 2 and errs [] on both;
    the bid sampler's recipe; a one-run measurement each, NOT the per-track sweep — that is the user's eye and the open list): **SeeYouDrop:**
    NAV 0–39.2, **FLUID 39.2–54.88 (15.7 s** — a phrase pick with gridTrust .40 so immediate; the raw bid **.818 led TORUS2 .783** and DUST .312,
    bassS .61 keyConf .55; **ended by the build parking home at 54.88** — NAV 1.301 on the build, the dwell does not gate precedence — through
    the 57.63 drop), NAV 54.88–86.28, TORUS2 86.28–104.92 (18.6 s, a settle; the raw bid read FLUID .898 over TORUS2 .79 but FLUID sat at
    hist[1], docked −0.25 → TORUS2), NAV from 104.92 (the park before the 105.63 drop). Raw lead over the 109 s: **FLUID 61**, NAV 25, TORUS2
    23; medians FLUID **.79** (bassS **.64**, keyConf .45, centroid .70), TORUS2 .78, DUST .30. **IBelongHere:** NAV 0–36.2, TORUS2 36.2–52.32
    (16.1 s, a phrase on the bar line held 10 beats; raw .771 vs FLUID .697; ended by the build parking home — the arc reads `build` from 53),
    NAV 52.32–89.47 (through the 64.48 drop), **FLUID from 89.47** (a phrase, held 2.7 beats; raw TORUS2 .841 docked −0.25 → .59 under FLUID's
    .648; bassS .48, keyConf .13 — the track whose key the ears never hold, §111). Raw lead: TORUS2 79, NAV 23, FLUID 7; medians FLUID .68
    (bassS .53, keyConf .13), TORUS2 .83. So on real music FLUID's bid reads .65–.90 where the sub carries (the demos' .54–.65), it LEADS on
    SeeYouDrop and lands on both; the stays under 30 s are the build's precedence, not the dwell's failure (§95: a build parks home, ungated).
    The real-track director run is a single take per track here; the sweep over all seven is for a session with the user's eye on it.
- **Step 2 — the receipt on the merged tree, after the bump** (so the sweep saw the release's own files): `SCENES=12 GPU=1 PORT=8981
  tools/real-md5.sh s115` (39 runs, **719 s**): **58 / 58 FLUID lines cmp-equal with `tools/accept/v0.36/real-md5-v036.txt`**, `f0` 2 and errs [] on all 39 (the bid changes picks, not forced frames — as §114 predicted) · `SCENES=12 PORT=8983 tools/real-rulers.sh s115` (**482 s**): FLUID **8 / 8 ok** — jump viol [] (max 0.012–0.054), mon viol [] (max 0.0042–0.0289), black 0, clip25 0 on every row, the rec row 244 / 1463; **the eight rows identical to `real-rulers-v036.txt` to the digit** · the fake smoke `PORT=8985 tools/scene-md5.sh
  s115` (198 s): **26 / 26 = `scene-md5-v035.txt`**, errs [] on all 13 ids · parity fake (ACC v0.36) (50 s): max **7.852214593751443**, 72 fields, the §102 `nav.*` MISMATCH line to the digit (`tools/accept/v0.36/parity-fake.jpg`). Nothing moved — the tag proceeds. The roster's 174 real lines stand on §113's proof (117 runs, 174 / 174, `f0` 2 — the bid
  changes picks, not forced frames; nothing in this release touches a roster scene's pixels).
- **The recipe (§91's ritual, as §112).** `package.json` + `assets/core/version.js` 0.35.0 → 0.36.0 · `releases.json` top entry (`v0.36`,
  2026-10-10, class `scene`, title *"The drop as a shockwave — and FLUID joins the rotation"*, decisions §113 + §114, scenes `[12]`, no clip) ·
  `npm run build` (34 entries → `site/whats-new.html` 43 KB, the card's `#newin` line *New in v0.36: The drop as a shockwave — and FLUID joins
  the rotation*, `dist/index.html` 177 modules 1722 KB) · `node tools/bundle.js releases/retinarave-v0.36.html` (**177 modules, 1 770 383 bytes**
  — the frozen page; v0.35's was 177 / 1 762 910).
- **The gates, each green on the tree after the bump (wall times):** `node tools/check.js` 178 modules **0 fail** / 8 warn (the soft-cap line
  counts), 2.5 s · `node tools/releases.js check` 34 entries, top v0.36 == package.json, 0 problems · `node tools/whatsnew.js --check` up to
  date · `node tools/license.js --check` **181 public files, 0 without the header** · `npm test` **exit 0**, 11.6 s (`test_fluid` 299 ok,
  `test_music` 129 ok, `test_director` with §114's step 10) · the frozen page from `file://` headless (GPU=1, 6 s): `test&scene=0` **errs [] bad [] frameN 343, fluid on**; `test&scene=12` **errs [] bad [] frameN 345**; `VER = '0.36.0'` in the file · `GPU=1 PORT=8987
  node tools/test_rec.js` **all ok**, 11 s (`retinarave-v0.36-nav2-…webm`, 360 frames at 60 fps composited, a frame decoded, VER == package.json) · the no-third-party receipt on `/` and `/whats-new`: the one host `127.0.0.1:8988` on both (`NOAUTO=1 … real` for `/`) · step 1's traces: house 121 s, aba 191 s
  wall, the bid samplers 120 / 190 s and the two real tracks ~130 s each.
- **What is live when.** One release commit (this note, HARNESS "Director traces" + the new `tools/director-bids.js`, the six proofs under
  `tools/accept/v0.36/`, `NEXT-SESSION-PROMPT.md`, `FLUID-DROP-SESSION-PROMPT.md` with item 1 marked DONE and the decisions that bind item 2,
  the generated `site/whats-new.html` + `index.html`'s line, the two versions, the entry, the frozen page), `git tag -a v0.36`, `git push origin
  main --tags` (one push; the deploy polled at retinarave.com for `VER = '0.36.0'`, never re-pushed). The deploy is polled AFTER the push (the live site's `VER` line until it reads 0.36.0, ~15 min cap); the LIVE time is in the release report and memory, not in this note — a second push to record it would be a second deploy.
- **What the user validates at home (every remark in track time is a retune request):** (1) **the shockwave on the drop in FLUID on the
  four dropping tracks** — SeeYouDrop 57.5 / 105.5, WhoLikesToParty 56.5 / 130.3 / 187.8 (file; a bar later live), Vienna 85.3, IBelongHere
  16.4 / 32.7 / 65.2 / 130.3 / 179.1 (file) — `#scene=12`; the references `tools/accept/v0.36/fluid-s113-<Track>-drops.jpg` and the two
  `-variants.jpg` (spike alone / ring alone / both); (2) **FLUID in the rotation** — the director lands on it on its own now; where it does
  and does not is the retune remark (§114's terms are a first cut, as §93's were — the traces above say it leads on SeeYouDrop's groove and
  rides the dock elsewhere); (3) the drop's flash with the ring and no droplets; (4) v0.35's list (§112), still unvalidated.
- **Open findings carried into the tag (none retuned):** from §113 — `DROP_DISS` 6 with the ring untested (the knob after the reversal, every
  track, WhoLikesToParty's drop 3 the ruler) · the idle bench still unseen on this machine · IBelongHere's live return 36 frames (0.6 s) late —
  the detector's arm at 178.58, the sub's return at 179.13 (`engine/build`) · Vienna's bar 40 (106.67) arms nothing in either mode · the
  first-frame `mapDropEvt` clear on a mid-track `at=` fires the ring too · the survey's whole-track traces still the §111 set (a `'*'` trace
  overflows the chunk cap) · the user's eye on the six montages; from §114 — the real-track director picks as a per-track sweep (two single
  takes above; the territories to be retuned from the user's remarks) · DUST 0 of 5 on the demo traces (above); from §112 — §109's seven
  ruler FAILs on DUST / TORUS2, the Malicious sub ruler, the key-timeline disagreement, CyborgNinja's key, WhoLikesToParty's early file clear,
  the constant INK per hit, `accept.sh` end to end, the §83 `nav.*` parity line.

## §116 FLUID2 — the bands (2026-10-10, one Fable worker per step in a worktree off c3ea530; the user: *"clone fluid -> do work in fluid2 -> do the different bands intuitively; explore: point sources and time"*)

**The ask, verbatim:** *"clone fluid -> do work in fluid2 -> do the different bands intuitively; explore: point sources and time"* — after the
user's question *"what are different grammars that can show sound in fluid? (besides the splat we are doing now?); can subbass/bass/mid/highs/vocals
all be treated differently intuitively?"*. The plan is `docs/plans/FLUID2-PLAN.md` (S0–S7, one worker-session each): each band a different KIND
of coupling — the sub a field, the kick a mass that travels, the mids the material, the highs the surface, the voice a pen, time breathing —
on FLUID's one pool. This note opens with S0 and grows one heading per step.

### S0 — the clone and the grammar switch, pixel-identical to FLUID (2026-10-10, branch `fluid2`, four commits)

- **What ships.** Scene **13 FLUID2** (`assets/scenes/fluid2/{index,shaders,help}.js`, FLUID's three files copied: `name 'fluid2'`, `id 13`,
  forced-only — `score()` 0, no `card`, the five own feats `loudRel loudRange loudAbs hat2 presence`, no bid fields; the help text says what it
  is) and **the grammar switch** (FLUID2-PLAN §2 option A, as planned): the scene card declares its grammar — `fluid: { grammar: 'bands' }` on
  FLUID2, nothing on FLUID — and the core serves it (CONTRACTS §1.4, "slots, not patches"). `inject.js` is UNTOUCHED (`git diff main --
  assets/core/fluid/inject.js` is empty).
- **The architecture as built.** `core/fluid/inject2.js` — the band grammar, pure, the same module interface as inject.js (`plan, mkState, K,
  FLUID_FEATS`): `plan(S, dt, st)` runs inject.js's `plan(S, dt, st.base)` first and at S0 returns it untouched (the identity); `mkState() =
  { base: null }` (fluid.js sets `base`; a standalone replay makes its own on the first call, so `INJECT=assets/core/fluid/inject2.js` works
  on `fluid-tracks.js` and now `fluid-replay.js` unchanged); `K = {}` (K2: `CARD.fluid.K2`, `K2=` / `FLUIDK2=`); `FLUID_FEATS` = the base's 39.
  `core/fluid/grammar.js` — **one deviation from the plan's letter, none from its mechanism:** the table `GRAMMARS = { pool: inject, bands:
  inject2 }` and `grammarOf(scene)` (the card's name if it is in the table, `'pool'` otherwise) live in a third pure module instead of inside
  fluid.js, so `loop.js`, `main.js`'s boot check, `help.js`'s part B, `check.js` and `test_fluid.js` read ONE table with no GL import —
  fluid.js still dispatches (`FLUID.grammar === 'bands' ? GRAMMARS.bands.plan(S, dt, st2) : GRAMMARS.pool.plan(S, dt, st)`, a strict branch
  on the name, never a mix). `fluid.js`: `st2 = inject2.mkState(); st2.base = st` — ONE base state, so the key pin, the rank buffers, the hat
  bucket, the ink rate, the confirmed clear's refractory, the §113 shockwave's countdown and the `midRing` run on warm across a switch in
  both directions, and the dye is carried, never reset; `stepFluid(dt, S, resumed, grammar)`; `FLUID.grammar` (the name that planned the
  last step), `FLUID.K2`; `benchFluid(n, S, ring, grammar)`; the HUD's fluid line says the grammar. **The owner** (`loop.js`): `REG[SC.next >= 0
  ? SC.next : SC.cur].scene` → `grammarOf()` — the incoming scene from the crossfade's first frame, else the current; a forced scene is
  `SC.cur` the moment `goScene` lands it; a function of `SC` alone (the harness forces it; no clock). `main.js` checks every grammar's
  `FLUID_FEATS` against `ENGINE.FEATS` at boot; `check.js`'s fluid block runs per grammar (undeclared → fail; a read outside the list →
  fail; the warn on never-read entries counts the base's reads as inject2's own; a composing grammar must keep the base's list; a card
  naming a grammar not in the table FAILS). No `&grammar=` switch (the plan's optional one): `&scene=13` is the recipe, and
  `CARD.benchFluid(300, null, 'bands')` benches the grammar under any scene.
- **The identity proof (the S0 gate), each with its wall time:** `SCENES=13 GPU=1 PORT=8975 tools/real-md5.sh s0-13` — **58 / 58 lines
  cmp-equal to s12's 58 in `tools/accept/v0.36/real-md5-v036.txt`** with the names mapped (`sed 's/ s12-/ s13-/'`), hash for hash, the same
  windows (**721 s**; a moved `frame0` would have moved the hashes, so the equality subsumes `f0` 2) · `SCENES=12 … s0-12` — **58 / 58 cmp-equal with `real-md5-v036.txt` (**721 s**; FLUID unmoved by the switch)** ·
  `SCENES="0 1 3" PAR=2 … s0-roster` — ****174 / 174 cmp-equal** with `real-md5-v036.txt` (**1442 s**, 117 runs)** (the switch is free when the owner is not FLUID2) · the fake `tools/scene-md5.sh s0` —
  ****28 lines = the 26 of `scene-md5-v035.txt` + s13's pair = s12's pair** (`3e483039…` f360 / `2274bb4e…` f840), errs [] on all 14 ids (**212 s**)** · `SCENES=13 tools/real-rulers.sh s0` — ****8 / 8 ok** — jump viol [], mon viol [], black 0, clip25 0 on every row, **every row identical to s12's in `real-rulers-v036.txt` to the digit** (medY .102–.203, jumpMx .012–.054, monMx .0042–.0289; **482 s**)** · the bench pair, one page, interleaved — **`CARD.benchFluid(300, null, 'pool')` / `(300, null, 'bands')` interleaved ×3 in ONE page (`test&scene=12`, q .95 pinned, 8 s warm, a cold call discarded, `uptime` load 4.1): **0.813 / 0.826 · 0.837 / 0.863 · 0.849 / 0.818 ms** — medians **0.837 / 0.826**, the pairs +0.013 / +0.026 / −0.031, within ±0.05 (a branch, not a pass; the absolute ms are the desktop's load, §113's 0.67–0.72 were under load 2.2–2.9); the show pass `bench(12, 300)` / `bench(13, 300)` ×3 **0.525 / 0.525 · 0.534 / 0.525 · 0.506 / 0.505** (the same program), `bench(0, 300)` 2.044 (ratio .41); tier 3, sim 259×128, dye 1035×512 (12 s)** · the crossfade
  `&trans=mixs` 12 → 13 → 0 — **CLOCK=1, SeeYouDrop at=25, scene 12 forced, at f300 a soft `goScene(13)` with `SC.forced` re-pinned to 13 (the forced branch is a no-op once `SC.logical` is 13; the fade steps on its own — a freed director parked the first attempt home): `{cur 12, next 13, dur 1.60}`, the grammar **`bands` from the fade's first frame** (`CARD.fluid.grammar` reads it on the next step), after the fade `{cur 13, next −1, bands}`; at f600 `goScene(0)`: `{cur 13, next 0}` → `{cur 0}`, **errs [] bad []** at heard 37.07 (20 s). The whole-frame grey every 6 frames across 12 → 13: 34.7 36.1 36.6 37.3 37.5 36.7 **29.1 21.3 20.3 23.1 24.9 26.9 29.0** 32.0 33.6 34.5 34.6 36.0 35.6 35.2 34.7 36.1 — max step 7.8 / 255, **§1.9 viol []** (no step > 2.5 × the last + .01 over .06); across 13 → 0: 35.2 … 36.6 flat, max step 1.95 / 255, viol []. The dip to 20 in the middle of the 12 → 13 fade is NOT the pool (one dye under both; s13's hashes = s12's): the two pictures differ only in the incoming scene's cold exposure (`U.expo` starts at 1 and eases over `EXPOTC` .12 s while the fade is 1.6 s) under the mixs key — carried as an open finding below (a hard cut, the `n` key the user switches with, has no fade; the director never fades to 13 — forced-only)** · `node tools/check.js` **183 modules, 0 fail / 8 warn** (the soft-cap lines; `help.feats gaps 0`,
  scenes 13) · `npm test` **exit 0** in 12 s (`test_fluid` **314 ok** = 299 + the `bands` block's 15; `test_music` 129; `test_director` untouched,
  OK) · `node tools/license.js --check` **186 public files, 0 without the header** · `npm run build` **182 modules → dist/index.html 1 796 307
  bytes** (177 + inject2, grammar, fluid2's three; `whatsnew` up to date; dist not committed) · the frozen bundle from `file://` `&scene=13` —
  **`test&scene=13` → **sc 13, grammar bands, errs [] bad [], frameN 302**; `test&scene=12` → pool, errs [] (`VER = '0.36.0'`, no bump — the user tags)** · `tools/fluid-replay.js` SeeYouDrop 20–40 s through `INJECT=inject2.js` = the base's lines (diff empty) · `node tools/releases.js
  check` untouched (no entry), landing `TILES 10`.
- **The `bands` test block** (`tools/test_fluid.js`): the interface; `FLUID_FEATS2 ⊇` the base's 39 and `⊂ FEATS`; the table and the default;
  `grammarOf(FLUID2) = 'bands'`, `grammarOf(FLUID) = 'pool'`, no slot / null / an unknown or inherited name → `'pool'`; FLUID2 forced-only (score
  0 on FLUID's best profile, no card); the identity on 600 synthetic frames (348 004 chars of JSON: kicks, snares, hats, a floor, a clear) and
  on SeeYouDrop's 6601 real frames (4 357 774 chars); a standalone `mkState2()` makes its own base; determinism (two fresh band states →
  identical); **the shared base state** — pool → bands → pool → bands every 300 frames on the real trace = `plan()` alone frame for frame,
  `st2.base === st` after 1200 frames (the switch warm in both directions); the Proxy MS through `plan2` over 6601 frames (no read outside
  inject2's list).
- **What S1's builder must know.** `plan2` edits the list `R.splats` by the tag `k` on every splat — the kinds the base emits, in its order:
  `sub` (the emitter), `kick` (the impulse + its two tail frames), `snare` (two shears), `chord` (two shears), `hat` (the droplets), `floor`
  (dye only), `drop` (the clear's impulse) — plus `R.body` (the breath), `R.params` (`curl velDiss dyeDiss pressure radius`), `R.ring`
  (the shockwave or null), and the replay rulers' fields (`gain colour floor chord ink drop harmonic noise`). Remove by `k`, append its own
  kinds (`heave` is a field, not a splat — it goes on `R.body` / a new uniform; `dip stroke jet pen` are splats), rewrite `params`, add the
  new return fields (`swirl noise dtSim curlMask spec`) — fluid.js reads them from S1 on (a new uniform's neutral value must be the
  byte-identical program path: branch on it as `uRing` does). Grammar-2 state goes BESIDE `base` in `st2` (`mkState() = { base: null, … }`),
  cold on the first FLUID2 frame — transients or eased from neutral. The base's constants through `FLUIDK=` / `CARD.fluid.K`, its own through
  `K2=` / `CARD.fluid.K2`. Every new MS read appends to inject2's `FLUID_FEATS` (check.js fails a read outside it; the base's 39 stay). The
  §111 state's own warm-up (the `midRing`'s 5 s, the ranks' 8 hits, the key's `KEY_EV0`) is in `st.base` — a FLUID2 ruler in a track's first
  10 s measures the priors. From S1 the s13 lines MOVE: the new reference is `tools/accept/v0.37/real-md5-v037.txt` (v036's 232 + s13's 58),
  `SCENES=12` must stay 58 / 58 = v036 and the roster 174 / 174 every step.
- **Open, carried:** the mixs fade's mid-dip into FLUID2 (above: the incoming scene's cold `U.expo`; cheap to fix by starting `U.expo` at
  the frame's `P.light` on a scene's first on-screen frame — FLUID's own, so a retune of FLUID too; not touched at S0, the pixel-identity
  commit) · `site/about.html`'s scenes list (a FLUID2 line when the scene differs from FLUID — S7) · the landing tile and the bid (the
  user's word) · the `&grammar=` harness switch (not needed) · the receipt `tools/accept/v0.37/fluid2-s116-s0.txt` (the s13 lines, the fake
  pair, the rulers' rows, the bench pairs, the fade's greys) · §115's own open list unchanged.

### S1 — sub = a field, never a dot (2026-10-10, branch `fluid2`, four commits; `git merge main` at 4372bc4 first — the eighth track's windows in)

- **The ask, as the orchestrator framed it and the user acted on:** *"sub = a field, never a dot — the whole pool heaves with the sub's
  envelope, gravity flips; its presence deserves the same scale as its absence (the void): global."* **The scope, changed by the user
  mid-step (2026-10-10, verbatim): *"only tune with Raindrops, don't do full sweep"*** — the tuning track for S1 and the later FLUID2 steps is
  RaindropsOnRoses (start 24 s, the 56 s sub pin, the 65.4–68.57 s two-bar sub cut before drop 2 at 68.569; 140 bpm, F♯; its truth being
  validated to a gate on main by another worker). What ran BEFORE the word is kept as data, not as a gate (below, marked); the eight-track
  real-rulers sweep and the 174-line roster re-proof were stopped and did not run; **the other seven tracks are untuned and unswept on the
  user's word, and the full sweep (`SCENES=12 / 13 real-md5`, the roster 0 1 3, `real-rulers` s13 on every track) is OWED before any tag.**
- **The field as built** (`core/fluid/inject2.js`, nothing in inject.js): the §104 emitter's JET (`k: 'sub'`, +SUB_V per frame at the bass
  note's place) is gone from FLUID2 — `dx = dy = 0` on the sub splat; its ink stays (below). The sub enters as a body force on the whole pool:
  **the HEAVE** on the breath's shaped channel (`body`, the cos(π(2x − 1)) profile — a uniform vertical force in a closed pool is a pressure
  gradient the projection removes, §104's lesson; no new uniform): `heave = −(HEAVE · (subEnv − subSlow) + HEAVE_DC · subEnv) · g · dir`,
  `subEnv` = the `sub` band (25–60 Hz, fast; the one new read in `FLUID_FEATS`) eased `SUB_TAU` .04 s, `subSlow` its `SUB_SLOW` 2 s mean, `g`
  the base's gain, `dir` +1 (FLIP 0). The minus is the finding of the day: **the sub is the pool's WEIGHT, with the breath** — the attack
  deepens the gravity the beat already applies (centre down), the void's entry (the slow mean above a sub that left) LIFTS against the
  breath and stills the pool, the drop's return slams it; the DC term is the level as a steady extra gravity while the bass plays.
  **The SWIRL** — a solid-body rotation as its own uniform `uSwirl` on the velocity advect pass (shaders.js: `v += uSwirl · dt · (−p.y, p.x)`,
  p aspect-corrected; `if (uSwirl != 0.)` — 0 is the byte-identical program path, as the ring's A = 0; the dye pass passes 0): the angular
  acceleration `SWIRL · subEnv · g`, its direction by the bar parity so it never winds up. **The FLIP**: `dir` by the bar parity (FLIP 1) or
  by the glide's sign (FLIP 2: a rising bass lifts, a falling one sinks, a held note heaves nothing; `GLIDE_K` 3 st/s saturates it). **The
  ink**: SUB_INK × the emitter's dye, spread over SUB_RAD × its radius at 1 / SUB_RAD² the dye — the same ink in the budget's area-weighted
  units; the §111 budget is re-derived over the grammar's own list whenever its ink differs (the own rate starts at the base's warm value:
  with the ink unchanged it IS the base's rate, and dyeDiss stays the base's within 1e-9). **Cold:** the envelopes start AT the frame's sub and
  the ink rate at the base's on the first frame the grammar plans — and `fluid.js` resets the band state's `n` on every step the pool
  grammar plans, so a re-entry (FLUID → roster → FLUID2) re-syncs: a switch is never a burst (the test: the first band frame after each of two
  switches carries the level's gravity alone, no rise). `FLUID.heave / .swirl` carry the last step's values (0 under the pool grammar); the
  HUD's fluid line and FLUID2's `fldbg` say them; `SUB_GATE` 1 confines the field to the base's drum branch (below). **K2 as shipped:**
  `HEAVE .6 · HEAVE_DC .15 · SUB_TAU .04 · SUB_SLOW 2 · FLIP 0 · GLIDE_K 3 · SWIRL 0 · SUB_GATE 0 · SUB_INK 1 · SUB_RAD 3`.
- **The ruler** (`tools/fluid-field-strip.sh`, HARNESS "## Fluid" — the S1 ruler): one deterministic whole-track run per scene × track on the live
  lanes (`&map=0`, `at=0`, CLOCK=1 GPU=1, keyed on `__FRAME`), a shot pair per second over a 31 s window — the composite at F and, after
  `CARD.fluid.dbg = 2`, the velocity alone at F + 1 (the overlay never feeds back) — **speed = Σ|vx| + |vy| per texel in uv/s** from the velocity
  shot (PIL's mean |c − 127.5| / 255), the `sub` band and the heave read at the shot. The number that reads the field is the **Δ against
  FLUID (scene 12) on the same frames**: the pool's mean speed is the kicks', the breath's and the field's together — SeeYouDrop's build-void
  (52–57 s, no sub at all) runs .24–.38 under FLUID from the build's kicks alone — so the per-shot delta, its correlation with `sub`, and the
  speed on sub-up (sub > .3) vs sub-down (< .15) shots (`tools/work/fluid2/s1/cmp.py`) are the columns. Per-shot `heave` from the plan, the
  envelope from the trace (`tools/fluid-tracks.js`'s `field` column through `INJECT=inject2.js`: |heave| p50 / p90 and the % of music frames
  the field is on — **on the truth traces 0–110 s: the whole-track traces in `tools/work/fluid-tracks/` predate `sub` and lack it; the row says
  so — carried to S7**).
- **The exploration (before the scope change — kept as what it is: the sign and the defaults were found here), round 1 (24 runs, the sign as
  the plan's letter: a rise LIFTS the centre), SeeYouDrop 40–70 / CyborgNinja 79–109 / Vienna 62–92:** every gesture read backwards against the breath. The control's speed on sub-up / sub-down shots: SeeYouDrop .235 / .246, Vienna
  .114 / .095; the jet removed and nothing added (`HEAVE 0`): −.025 / +.015 and −.017 / +.001 (the jet was ~10 % of a groove's speed, nothing of
  a void's); the heave at 1: SeeYouDrop **.187 / .337** (the attack cancels the beat's kneading — below even the no-field baseline; the
  settling tail ADDS to the breath in the void: .44 vs .36 at 51 s; the return's lift fights the slam: .136 vs .174 at 59 s), Vienna .092 / .107,
  r(Δ, sub) **−.91 / −.44 / −.71**; the bar flip (FLIP 1) ≈ the control (the sign averages out: .244 / .257); the DC term in that sign cancelled
  the pool's gravity on CyborgNinja outright (.170 vs .229, coverage 29 %); the swirl alone +.002 / +.011 / +.032 (r .29 / .12 / .35, never
  harmful). **Round 2 (15 runs, the sign flipped — with the breath):** HEAVE 1 alone r(Δ, sub) **.84 / .48 / .37**, SeeYouDrop .271 / .140 (the
  void stills to .14 from the control's .25, the groove +.04, the presence ratio **1.94** vs the control's .95), CyborgNinja −.019 (a steady
  groove settles back to the pool grammar's speed once the slow mean catches up), Vienna −.006 / −.010; HEAVE .6 alone .79 / .47 / .33;
  **HEAVE 1 + DC .3** r **.93 / .46 / .74**, the presence ratio 2.46 — but every groove 50–60 % faster (SeeYouDrop .386, CyborgNinja .354 vs
  .23: the DC alone, .3 × .7, is 1.6 × the breath's .13 mean — over it, not beside it); **HEAVE .6 + DC .15** r **.90 / .39 / .66**, the grooves
  +.07–.11 (SeeYouDrop .340 / .195, ratio 1.74; CyborgNinja .303; Vienna .165 / .126, the dream .13 vs .095 — the band holds .2–.5 there with the
  gate shut, so the pool keeps a slow turn on the soft sub pad), the swirl .4 on top of it = the same to ±.003. **Shipped: HEAVE .6 + DC .15**
  (the plan's rule — the best correlation at the control's ink — would pick 1 + .3; the plan's other rule — "read beside the breath, not over
  it" — picks the middle; 1 + .3 stays as the stronger switch, `K2='{"HEAVE":1,"HEAVE_DC":0.3}'`), SWIRL 0 (nothing measurable over the heave;
  alone it is a gentle turn the user can ask for), FLIP 0 (the bar flip averaged the sign out in round 1; the glide flip's number is the test's,
  not a strip's — the eye at home).
- **The sub-splat decision — the mouth's ink stays as a CLOUD (SUB_INK 1, SUB_RAD 3).** The velocity shots are IDENTICAL under the dot, no ink and
  the cloud (the dye never moves the field: r, speed, Δ to the digit); the grey moves 1–2 levels (SeeYouDrop 40–70 mean: the jet 50.8, the dot
  47.9, none 46.7, the cloud 46.1 — the sub's dye is .015 / frame, 3 % of a kick's); the eye (`tools/work/fluid2/s1/SeeYouDrop-ink.jpg`): the dot
  reads as a bright spot at the bass note's place on the drop's return (t 59, under the kick's plume) — the one thing S1 must not draw; the
  cloud is a faint haze there, the colour still entering where the bass note is (a sub-only passage is not colourless); none loses that. The
  ink/s and the governor are the base's on every track (the table: SeeYouDrop 13.7 / 27.6 × 1.1 / 1.4 … CyborgNinja 30.8 / 44.1 × 2.1 / 2.5,
  identical under both grammars); Σ|dv| per second drops to the hits' alone (SeeYouDrop 7.2 → 3.2, CyborgNinja 9.5 → 8.6, Vienna 6.3 → 1.9).
- **The tune on RaindropsOnRoses (the user's track; 50–80 s at `at=24`, map 0, 1 fps; the control FLUID .146 / .165 on sub-up / sub-down shots,
  r(speed, sub) .02):** the shipped K2 (.6 + .15) **.220 / .138 (ratio 1.60), Δ +.075 / −.027, r(Δ, sub) .73**; HEAVE 1 alone .155 / .118 (r .41:
  the void stills, the groove settles back); .6 alone r .47; **1 + .3 r .79, .283 / .152 (+.137 — the groove at 1.9 × the control's speed)**; the
  swirl alone r .16 (+.025 everywhere); the bar flip r .21 and SLOWER than the control (−.033 / −.062: the alternating sign averages the
  gravity out). The two moments the eye wants: **the 56 s pin** — the band sits .6–.9 from 50 s, the field a steady +.06–.13 over FLUID
  (ship .29 vs .18 at 56 s), the whole pool in two cells; **the 65.4–68.57 cut** — at 66–68 the heave turns +.28 / +.13 / +.06 (the lift against
  the breath) and the pool stills (.17 → .14 → .10 where FLUID holds .17 / .17 / .15), **the return at 68.57** — the heave −.23 / −.30 / −.19 at
  69–71 and the pool slams (.087 / .120 / .161 vs FLUID's .058 / .067 / .094: +50–80 %), the user's "something happens at 1:06" is the field's own
  gesture. **Shipped on Raindrops: HEAVE .6 + HEAVE_DC .15** — the plan's correlation rule alone would take 1 + .3 (.79 vs .73), its "beside the
  breath, not over it" rule takes the middle (1 + .3 doubles the groove's speed); the stronger one is the switch (`K2='{"HEAVE":1,"HEAVE_DC":0.3}'`)
  for the user's remark. The crops: `tools/accept/v0.37/fluid2-s116-s1-RaindropsOnRoses-{pin,cut}.jpg`, the strip montage
  `fluid2-s116-s1-RaindropsOnRoses.jpg`.
- **The other seven (measured BEFORE the scope change with the same K2 — untuned on the user's word; the rows are what the eye would see, not a
  gate; map 0, the S1 window, 31 shots; speed in uv/s; `r(Δ, sub)` the correlation of the per-shot delta with the sub band; up / down = mean
  speed on sub-up / sub-down shots):**

  | track · window | ctrl up / down | ship up / down (ratio) | Δ up / Δ down | r(Δ, sub) | the eye |
  |---|---|---|---|---|---|
  | SeeYouDrop 40–70 (groove → void 52–57.6 → drop → groove) | .235 / .246 | .340 / .195 (1.74) | +.106 / −.051 | .90 | the void's velocity goes flat where FLUID's keeps the build's plumes; at 58–61 one slam spans the whole width (the centre down, the walls up) where FLUID has the kicks' local plumes — and the kicks' own plumes rise less under it (the trade); the ink spreads wider on the groove |
  | CyborgNinja 79–109 (the busiest, the sub up throughout) | .229 / — | .303 / — | +.074 / — | .39 | the whole pool in two cells under the kicks' plumes; the grey 39–46 (the §111 packing ruler: 0 s above 60) |
  | Vienna 62–92 (groove → the dream 66–85 → the return) | .114 / .095 | .165 / .126 (1.32) | +.051 / +.030 | .66 | the groove's cells; the dream a faint steady band (the soft sub pad); the return's cells from 86 s |
  | IBelongHere 160–190 (the breakdown → the return 178.5) | .158 / .052 | .251 / .056 (4.48) | +.094 / +.004 | .92 | the break flat on both; from 180 s the ship's velocity is full-width cells, FLUID's local plumes |
  | WhoLikesToParty 40–70 (groove → drop 57) | .154 / .205 | .174 / .248 (.70) | +.020 / +.043 | .28 | the choppy sub (gate 30–80 %) gives a weak field; the drop's kicks dominate both |
  | Comptine 30–60 (a piano, the gate never open) | .102 / — | .178 / — | +.076 / — | .51 | the pool SWAYS with the piano's low notes (the band reads .44 there) — `SUB_GATE 1` turns it off (below) |
  | Malicious 45–75 (quiet → the bass in at 56; record only) | .236 / — | .363 / — | +.127 / — | −.02 | the loudest field of the eight: the band sits .6–.9 on the stutter; the eye at home |
  | RaindropsOnRoses 50–80 — THE TUNING TRACK, above | .146 / .165 | .220 / .138 (1.60) | +.075 / −.027 | .73 | the pin, the cut, the return — above |

  The pad take (`rec-strip.sh … 13`, 2 fps, 0–24 s): the grey mean within ±.3 of FLUID's on every half second (16.4 … 28.0), the p99 lower
  (82–97 → 71–78 while the chords hold: the jet's bright mouth gone); every second from 3 s still injects (the §108 ruler is the base's).
  The montages: `tools/accept/v0.37/fluid2-s116-s1-<Track>.jpg` (rows FLUID / FLUID2 / its velocity, 16 + 16 columns — RaindropsOnRoses's is the
  one the user is asked to look at; the seven others are the record of what ran before the scope change); the strips in `tools/work/fluid2/field/`. **What the eye should see at home (`#scene=13`):** on a groove the whole pool breathing with the bass rather than a
  jet at one place; when the bass leaves, the pool going still while the ink stays (the void, now a stillness and not a flat image); on the
  drop's return the whole surface slamming down the middle and up the walls; on Comptine a slow sway — a remark either way is `SUB_GATE`.
- **The gates (the Raindrops-filtered receipts, each with its wall time; the receipt `tools/accept/v0.37/fluid2-s116-s1.txt`):** `node tools/check.js`
  **183 modules 0 fail / 8 warn** · `npm test` **exit 0** (`test_fluid` **336 ok** — the bands block's 30 cases, `test_music` 129) · `SCENES=13
  tools/real-md5.sh` twice — ran on all eight BEFORE the scope change: **66 / 66 cmp-equal** (790 / 792 s), 66 / 66 moved against S0, the 8
  RaindropsOnRoses lines among them, all into **`tools/accept/v0.37/real-md5-v037.txt`** (v036's 240 + s13's 66 + the roster's 24 Raindrops
  lines = 330) · `SCENES=12` — also before the word: **66 / 66 = v036** (789 s; FLUID unmoved: `uSwirl` 0 and the band state's reset are the
  byte-identical path) · the roster `SCENES="0 1 3" TRACKS=RaindropsOnRoses` twice **24 / 24 cmp-equal** (207 s each; no reference existed
  — they enter v037; the stopped full-roster run's 112 finished lines read 96 / 96 = v036 where a reference exists) · `SCENES=13
  TRACKS=RaindropsOnRoses tools/real-rulers.sh` **1 / 1 ok** (66 s: jump viol [] max .058, mon viol [] max .0161, black 0, clip25 0, medY .173
  vs FLUID's .193) · the fake `tools/scene-md5.sh` **26 = v035 + s12's pair unmoved + s13's pair re-recorded** (`8a929b45…` / `afb7c178…`;
  errs [] on 14 ids; 212 s) · **the bench** in ONE page (q .95, load 1.97): `benchFluid(300, null, 'pool')` / `'bands'` (SWIRL 0) / `'bands'` with
  `SWIRL .8` and `MS.sub .8` held (the branch taken) interleaved ×3 = **.514 / .521 / .537 · .496 / .483 / .496 · .483 / .471 / .516 ms** —
  medians **.496 / .483 / .516**: the band grammar −.013, the swirl branch +.020, both within ±.05 (S0's .837 / .826 were under load 4.1);
  `bench(0, 300)` 1.257 · **MOBILE=1** `test&scene=13` tier 0 (sim 64×139, dye 256×554) alive — grammar bands, errs [] bad [], frameN 242;
  benchFluid bands .451 / bands + swirl .381 / pool .333 at tier 0 (single unpinned calls — a reading, not a pair) · `npm run build` 182
  modules → 1 806 244 bytes, the bundle from `file://` `&scene=13` sc 13 bands errs [] bad [] frameN 302, `&scene=12` pool errs [] · the
  crossfade under `&trans=mixs`: 12 → 13 the grammar bands from the fade's first frame, greys 34.7 … 20.0 … 34.1, max step 7.63 / 255, §1.9
  viol [] (S0's cold-exposure dip, unchanged); 13 → 0 **with `SC.forced` released first** lands on 0 ({cur 0, pool}, errs [] bad []) — its
  greys step up to 16 / 255 inside the fade: NAV2's kick flashes on SeeYouDrop's groove (the §1.9 monitor exempts event frames; the crude
  6-frame step does not); with the force still pinned, as S0's script left it, `goScene(0)` is reverted by the forced branch within the
  fade ({cur 13, next −1}) — **S0's flat "13 → 0" row was that revert, not scene 0** (a finding on S0's receipt, not on the fade) ·
  `node tools/license.js --check` 0 without the header · `git diff main -- assets/core/fluid/inject.js` empty.
- **Open, carried:** **the full sweep before any tag** (the user's word: `real-rulers` s13 on every track, the roster 0 1 3 on the 174, both
  `SCENES=12 / 13` lists re-run on the final code of the step that tags) · the whole-track traces lack `sub` (re-record with `FLUID_FEATS2` at S7 — the table's field column is on the truth traces 0–110 s)
  · Comptine's sway and the pad's heave (the band reads .4 on a piano's low register and the take's room: `SUB_GATE` is the switch, the eye
  decides) · Malicious's field is the loudest (.36 mean speed) — not a gate · the velocity ruler clips at |v| .5 per component (the DBG encode) —
  the p90s of .38–.43 sit near it; a `uGain` .5 variant of the dbg draw is one line if S2's travel needs headroom · the mixs fade's mid-dip into
  FLUID2 (S0's open) · the roster's 24 new RaindropsOnRoses lines (0 1 3) have no reference yet (measured once here, below) · §115's own list.


### S2 — bass = mass; the kick launches something that travels — the point-source exploration (2026-10-10, branch `fluid2`, four commits; `git merge main` at 6da0ca5 first — the Raindrops gate flip in)

- **The ask, as the plan framed it and the user's scope holds:** the kick as a MASS that travels — the variants the plan names (the jet, the
  stroke, the dipole, the local puff) at ONE momentum against the control, the ruler = where the hit's push is at +½ and +1 beat, the number
  first and then the eye; the launch direction decided from the strips; **tuned, stripped and proven on RaindropsOnRoses only (the user,
  2026-10-10: *"only tune with Raindrops, don't do full sweep"*; the other seven tracks untuned and unswept on the user's word — the full
  sweep OWED before any tag)**; the taste ruler §113's: *"a hit that launches something that travels"*, and *"the double time should be
  accenting rather than driving"*. S1's open trade measured first: *"the kicks' plumes rise less under the heave's slam"*.
- **The shapes as built** (`core/fluid/inject2.js`, nothing in inject.js): `KICK_SHAPE` picks the kick's shape, every one at the SAME MOMENTUM as
  the base's kick — Σ dy·rad over the hit's frames (a splat's Gaussian exp(−|p|²/rad) integrates to π·rad, so dy·rad is its impulse) — and
  the same ink in the budget's units: **0** the control (the base's splat untouched — the identical list); **1 the jet** — each of the base's
  kick frames (the hit, its tail) spread over `JET_N` 4 frames at 1 / JET_N of its push and ink, a pending queue in the band state (emptied
  on the cold frame: a scene switch is never a late push); **2 the stroke** — the jet drawn upward, `y = KICK_Y + STROKE_L · min(1, age /
  STROKE_T)` (.06 → .31 over .05 s, the user's "line stroke"); **3 the dipole** — two splats at `x ∓ DIP_D`, the lift and the ink halved, a
  sideways seed `±DIP_V · √rank · g` OPPOSITE on the two (> 0 inward: the pair's own flow between its cores; < 0 outward) — the net
  sideways momentum 0, Σ dy·rad the control's; **4 the puff** — the kick splat's velocity gone (its ink stays) and a radial ring round the
  hit's place: the §113 ring given a CENTRE (`uRingC`, shaders.js — `vUv − uRingC`, one exact subtraction, (.5, .5) the shockwave's path to
  the bit; `fluid.js` `ring(a, r, w, cx, cy)`, the larger A still wins the step with its own centre), A = `KPUFF_A · √rank · g`, the front 0 →
  `KPUFF_R` in `KPUFF_T` beats, `KPUFF_W` wide — SET semantics, no momentum in the splats' units. `kick` in the return (`{ shape, mom, ink, n }`,
  `CARD.fluid.kick`) and the HUD's fluid line say the shape; an unknown shape is the control. The momentum equality is a test: Σ dy·rad per
  kick = the control's within 1e-9 on shapes 1–3 over RaindropsOnRoses's 129 kicks (Σ .558662 over the track), the ink identical.
- **The ruler — TRAVEL, and the ruler that failed first** (`tools/fluid-kick-strip.sh` + `tools/fluid-kick-travel.py`, HARNESS "## Fluid"):
  one deterministic whole-track run per variant (at=24, CLOCK=1 GPU=1, map 0, keyed on `__FRAME`), 14 kicks (the return 68.567 — the drop's
  confirmation frame, listed and left out of the p50s — 69.217 69.867 70.717 71.367 72.650; the groove 77.583 78.867 84.433 87.867 89.150
  98.150 99.433 101.583; each ≥ .6 s before the next so +1 beat is its own), four moments per kick (pre F − 2 / +0 F + 1 / +½ / +1 beat) ×
  three shots on consecutive frames with the clock paused at each (the composite, the dye at `dbg 1`, the velocity at `dbg 2`). **The plan's
  ruler — the ink front's height in the dye above the pre-kick row + 10 — read nothing:** a groove's pool is full of moving ink, and a Δ
  of the dye over 13–26 frames is the pool's advection; the connected-component front read the whole screen under the field (h1 p90 .94),
  and a column mass profile read the column's middle (hc ≈ .45) under every variant. **The number that reads the kick is on the VELOCITY
  shot:** the breath and the heave push the centre DOWN, so what goes UP in the band x ± .3 above the kick's place is the hit's — **U = Σ
  max(vy, 0)** (/ 1000), **ΔU = U − U(pre)** the hit's own addition, **hc** U's centroid height above the kick's place (the travel), h90 the
  front, trail h90 − h10, **d** the centroid's distance from the launch, **w** the contiguous run of vy > .05 through the centroid's column;
  the §1.9 step at the hit from the composites. The velocity shot clips at |v| .5 per component, so the control's saturated column is
  UNDER-read (its U is a floor); `tools/work/fluid2/s2/cmp.py` tabulates, `montage.py` draws the same 8 frames per variant.
- **S1's trade measured — and what it actually was.** Round 1, the four shapes at one momentum under the S1 field, p50 over 13 kicks
  (all · the return · the groove; U pre / +0 / +½ / +1 · ΔU½ · ΔU1 · w1):

  | variant (K2) | U pre/0/½/1 (all) | ΔU½ · ΔU1 all | ΔU½ · ΔU1 return | ΔU½ · ΔU1 groove | hc0/½/1 | w1 | grey0 |
  |---|---|---|---|---|---|---|---|
  | **FLUID (scene 12, the control)** | 21.7 / 23.2 / 25.1 / 23.4 | **3.55 · 1.31** | 2.00 · 1.68 | 3.86 · 1.31 | .36 / .41 / .41 | **.127** | 53.0 |
  | FLUID2 S1's kick (shape 0) | 5.1 / 6.7 / 5.4 / 5.6 | .93 · .93 | .47 · −.00 | 1.22 · 1.29 | .39 / .43 / .45 | .009 | 46.4 |
  | the jet (1) | 5.1 / 6.4 / 5.7 / 5.6 | .77 · .83 | .71 · .40 | .90 · 1.10 | .39 / .42 / .42 | .004 | 46.1 |
  | the stroke (2) | 5.5 / 6.9 / 6.4 / 5.8 | 1.14 · .66 | 1.68 · .99 | 1.14 · .66 | .36 / .36 / .40 | .005 | 46.4 |
  | the dipole, DIP_V .3 in (3) | 5.3 / 7.3 / 6.2 / 5.5 | .98 · .77 | .98 · .29 | 1.04 · .91 | .35 / .35 / .38 | .005 | 47.0 |
  | the puff, A .4 (4) | 4.6 / 5.7 / 5.2 / 5.4 | .58 · .65 | .36 · −.03 | .60 · .80 | .41 / .44 / .44 | .008 | 46.0 |

  Every FLUID2 shape reads a quarter of FLUID's up-mass and a quarter of its hit addition, with no plume body (w ≤ .01 against the
  control's .13) — the eye (`tools/work/fluid2/s2/round1-variants.jpg`): FLUID's kick is a mushroom on a column at the centre, every FLUID2
  shape a pinhead pair at the floor on the return and nothing on the groove. The first reading — the heave's centre-down weight sitting on
  the kick's column — was WRONG: **the field OFF (`HEAVE 0, HEAVE_DC 0`, shape 0) reads U 6.0 / 7.7 / 7.1 / 6.7, ΔU½ 1.16, ΔU1 .57 — as low as
  with it on.** The heave costs 15 %; what FLUID's kick was riding is the sub emitter's JET that S1 removed — `+SUB_V` .08 up at the bass
  note's place on every gated frame, a standing updraft in the band (U 22 before any hit) that every kick's plume climbed. FLUID's kick never
  carried itself; under FLUID2 it must. The base's `KICK_V` × 2 under shape 0 (`K='{"KICK_V":1.8}'`, the trade's price in impulse — a
  measurement, not a candidate) reads 7.5 / 10.1 / 7.9 / 7.7, ΔU½ 1.48, ΔU1 1.43: double the impulse buys a third of FLUID's addition.
- **Round 2–3 — the launch against the field (the kind that carries itself):**

  | variant (K2) | U pre/0/½/1 (all) | ΔU½ · ΔU1 all | ΔU½ · ΔU1 return | ΔU½ · ΔU1 groove | hc½ / hc1 · d1 | w½ / w1 | grey0 |
  |---|---|---|---|---|---|---|---|
  | the dipole OUTWARD, DIP_V −.6 | 5.1 / 6.4 / 6.2 / 6.2 | 1.28 · 1.01 | 1.33 · .63 | 1.28 · 1.61 | .41 / .42 · .44 | .008 / .004 | 48.7 |
  | the dipole OUTWARD, −1.2, DIP_D .05 | 6.9 / 9.0 / 9.0 / 7.7 | 2.57 · .78 | 3.31 · .78 | 2.57 · 1.45 | .34 / .42 · .43 | .001 / .000 | 52.3 |
  | the dipole INWARD, +.8 | 8.2 / 9.7 / 9.4 / 8.2 | 2.66 · 1.95 | 2.66 · 1.95 | 3.14 · 3.17 | .28 / .31 · .33 | .004 / .000 | 48.9 |
  | **the dipole INWARD, +1.2 — SHIPPED** | **8.9 / 10.7 / 11.2 / 10.3** | **3.08 · 2.77** | **3.12 · 2.77** | **3.08 · 3.21** | **.29 / .32 · .32** | .015 / .019 | 49.5 |
  | the dipole INWARD, +1.6 (the switch) | 12.1 / 12.1 / 13.3 / 13.2 | 3.93 · 3.29 | 3.93 · 3.27 | 4.00 · 3.85 | .30 / .31 · .32 | .070 / .022 | 50.8 |
  | the dipole INWARD, +1.2, DIP_D .05 (the switch) | 10.0 / 12.1 / 14.0 / 13.0 | 3.68 · 3.56 | 4.08 · 3.56 | 3.68 · 4.31 | .28 / .31 · .31 | .077 / .028 | 50.4 |
  | the dipole INWARD, +1.2, DIP_D .02 | 8.3 / 10.0 / 10.2 / 9.8 | 2.44 · 2.08 | 2.44 · 2.08 | 3.06 · 3.17 | .28 / .30 · .32 | — | — |
  | the puff, A .8, R .2, T .5 beats | 5.2 / 5.7 / 7.9 / 6.3 | 2.79 · 1.22 | 2.79 · .48 | 3.95 · 1.45 | .33 / .45 · .47 | .010 / .006 | 47.9 |
  | the puff, A 1.2, R .25, T .5, W .05 | 5.4 / 7.4 / **20.9** / 8.2 | **15.9** · 2.31 | 15.9 · 1.61 | 20.9 · 3.35 | .26 / .44 · .46 | **.211** / .000 | 50.9 |

  The pair seeded OUTWARD runs along the floor and is gone by +1 beat (its ΔU1 .8 at −1.2); the strong puff is a STAMP — a ring of ink
  expanding to .25 over half a beat (ΔU½ 15.9 while the ring runs, w .21) and nothing a beat later (2.3) — the §113 set-semantics at a
  point, striking in the dye and not a mass that travels; **the pair seeded INWARD carries itself:** the up-mass it adds grows with the seed
  (.8 / 1.2 / 1.6 → ΔU½ 2.7 / 3.1 / 3.9, ΔU1 2.0 / 2.8 / 3.3) and with the spacing (DIP_D .02 / .03 / .05 at 1.2 → ΔU1 2.1 / 2.8 / 3.6 — Γ·d),
  **while the travel ties on every seed: hc1 .30–.32, d1 .31–.32 screen heights per beat** — a third of the screen per beat, beat speed
  (TORUS2's rule). The width rule (≤ 1.5 × the control's) holds trivially on every FLUID2 kind (≤ .08 against .13: the control's width is
  the jet column's, not a plume's); the §1.9 step at the hit ≤ .011 on every variant (max over the four moments ≤ .023, the drop's clear
  frame .46 aside); the ink the base's on every shape (the governor's rate within the ema's rounding; the dipole's two half-ink splats
  are one ink in the budget's units).
- **The decision — the dipole seeded inward, `KICK_SHAPE 3, DIP_V 1.2, DIP_D .03`** (`KICK_Y .06, JET_N 4, STROKE_L .25, STROKE_T .05,
  KPUFF_A .4, KPUFF_R .12, KPUFF_T .25, KPUFF_W .03` as the switches' table). The plan's rule — the greatest p50 travel at +1 beat under the
  width rule — is a tie across the inward seeds (d1 .31–.32), so the up-mass the pair carries to +1 beat and the eye decide: 1.2 at .03 sits
  BESIDE FLUID's own number (ΔU½ 3.1 vs 3.6; on the return 3.1 / 2.8 vs FLUID's 2.0 / 1.7, the kick reads MORE than FLUID's there), carries
  over twice FLUID's to +1 beat (2.8 vs 1.3 — FLUID's column is already saturated), keeps the groove's standing up-mass at half FLUID's (U
  12–17 against 25: *the double time accents, the sub's field drives*) and draws ONE blob in the dye (DIP_D .05 draws a double dot at +0,
  `round3-variants.jpg`; 1.6's pair reads over FLUID's addition, 3.9 vs 3.6). The eye on the montage (`tools/accept/v0.37/fluid2-s116-s2-
  RaindropsOnRoses.jpg`: rows FLUID / FLUID2 S1's kick / the shipped dipole — the composite, the dye, the velocity on the same 8 frames):
  two counter-rotating cores with the up-jet between them at the bass note's place on every hit, the ink lifted between them on the return,
  the pair visible under the field on the groove where S1's kick was nothing. **The S1 trade, answered:** the heave was 15 % of it; the shipped
  pair recovers the hit's addition to FLUID's level and above at +1 beat with the field ON — at the base's impulse and ink. The seven other
  tracks are untuned and unswept on the user's word.
- **What the eye should see at home (`#scene=13`):** every kick a small pair of eddies born at the bass note's place that lifts off on its own
  and climbs a third of the screen in a beat, carrying a puff of the ink with it — not FLUID's column; on a groove the double-time kicks
  accent (a pair each, half FLUID's standing updraft), the pool's heave with the bass still the driver; on drop 2's return (68.57 s) the
  pairs read MORE than FLUID's kicks did there. `K2='{"DIP_V":1.6}'` is the stronger pair, `{"DIP_D":0.05}` the wider; `{"KICK_SHAPE":4,
  "KPUFF_A":1.2,"KPUFF_R":0.25,"KPUFF_T":0.5,"KPUFF_W":0.05}` the ring stamp the user may want to see once; `{"KICK_SHAPE":0}` S1's kick.
- **The gates (Raindrops-filtered, each with its wall time; the receipt `tools/accept/v0.37/fluid2-s116-s2.txt`):** `node tools/check.js` **183
  modules 0 fail / 8 warn** (3 s; `uRingC` live in both advect passes, `help.feats gaps 0`) · `npm test` **exit 0** (13 s; `test_fluid` **370 ok** —
  the bands block's S2 cases: the momentum equality per kick on the real trace, the jet's frames per base frame, the stroke's monotone y, the
  dipole's mirror, the puff's ring centred and bounded with the base's shockwave winning the drop's 13 frames, the shipped kind on every one
  of the 129 kick frames, determinism, the cold frame dropping a pending jet, nothing but the kick kinds moved; `test_music` 151) ·
  `SCENES=13 TRACKS=RaindropsOnRoses tools/real-md5.sh` twice **8 / 8 cmp-equal** (69 / 69 s), all 8 moved against S1's — re-based into
  **`tools/accept/v0.37/real-md5-v037.txt`** (the other 322 lines untouched; 330 hash lines) · `SCENES=12` **8 / 8 = v036** (69 s: FLUID unmoved —
  `uRingC` (.5, .5) is the byte-identical path) · the roster `SCENES="0 1 3"` **24 / 24 = v037** (208 s: the centre uniform neutral under the
  roster's drop1 shockwave) · `SCENES=13 tools/real-rulers.sh` **1 / 1 ok** (66 s: jump viol [] max .056, mon viol [] max .0161, black 0,
  clip25 0, medY .181 vs S1's .173) · the fake `tools/scene-md5.sh` **26 = v035 + s12's pair unmoved + s13's pair re-recorded** (`1827743c…` /
  `0af6dd5b…`; errs [] on 14 ids; 212 s) · `node tools/parity.js fake` **max 7.852214593751443, 72 fields, the §102 `nav.*` line to the digit**
  (50 s) · **the bench** in ONE page (q .95, load 1.29, tier 2 sim 259×128): `benchFluid(300, null, 'pool')` / bands at the shipped shape (the
  fake's static MS carries no kick on the bench's steps — the branch) / bands at shape 0 / bands with `kickEvt` held on EVERY step (two dip
  splats + the sub, nSplat 3 — the dipole's cost as an upper bound) interleaved ×3 = **.728 / .734 / .732 / .760 · .721 / .725 / .778 / .807 ·
  .774 / .789 / .782 / .692 ms** — medians **.728 / .734 / .778 / .760**: ship − pool +.006 / +.004 / +.015 (within ±.05), a pair on every step
  +.03 over the pool (two splats in the same draw; a real kick is two frames in .43 s). The absolute ms moves with the desktop's state
  between sessions (S0 .837, S1 .483, S2 .728 — the pair is the number, not the level); `bench(0, 300)` 1.357 · **MOBILE=1** `test&scene=13`
  tier 0 (sim 64×139, dye 256×554) alive — bands, errs [] bad [], frameN 242; benchFluid bands .416 / + swirl .404 / pool .431 (single
  unpinned calls — the ≤ .4 budget at the reading's edge, S7's pair decides) · `npm run build` 182 modules → **1 816 420 bytes** (+10 176 over
  S1), the bundle from `file://` `&scene=13` sc 13 bands errs [] bad [] frameN 302, `&scene=12` pool errs [], VER 0.36.0 · the crossfade under
  `&trans=mixs`: 12 → 13 greys 34.7 … 20.5 … 35.1, max step 7.3 / 255, §1.9 viol [] (S0's cold-exposure dip, unchanged); the 13 → 0 row with
  `SC.forced` pinned is the forced branch's revert (S1's finding; flat, viol []) · `node tools/license.js --check` **0 without the header** ·
  `git diff main -- assets/core/fluid/inject.js` empty.
- **Open, carried:** **the full sweep before any tag** (the user's word: `real-rulers` s13 on every track, the roster 0 1 3 on the 174, both
  `SCENES=12 / 13` lists re-run on the final code of the step that tags — the dipole's seed is Raindrops's; CyborgNinja's 29 kicks/s and
  Malicious's stutter have not met the pair) · the sub jet's loss is now a measured fact (U 22 → 6 in the band): if the user misses FLUID's
  column at the bass note's place, it is one K2 switch away in S1's terms (a `SUB_V`-sized `dy` on the sub splat — not built; the field was
  the user's ask) · the kick's x under the harmonic branch (`xH`, the harmony's place) is the base's — the pair launches wherever the base's
  kick did · the puff's SET semantics stamp the pool's velocity at the front on every hit (measured: a ring of ink, gone in a beat; the §113
  interference with the pair was not measured — the puff is a switch) · the velocity ruler's clip at |v| .5 (the control's column is a
  floor; a `uGain` .5 dbg variant is one line if S3's horizontal travel needs it) · the dipole's seed is 3 × the lift at 1.2 (|dx| ≈ .9 per
  core against dy .37): the pair is mostly spin, and the §1.9 step holds (≤ .011) — the eye at home says whether it reads as a hit or a
  curl · S1's open list unchanged (Comptine's sway, Malicious's field, the mixs mid-dip, the whole-track traces without `sub`).

### S3 — mids = material (2026-10-10, branch `fluid2`, commits 4d3e3bd → the docs; `git merge main` at 17802d2 first — S2 merged, a fast-forward)

- **The ask, as the plan framed it and the user's scope holds:** the mids as MATERIAL — the weather, not the mass (the user: *"the double
  time should be accenting rather than driving"*). The plan's three parts: (a) the vorticity confinement from the mid band's own range,
  (b) a y-mask on the vort pass, (c) the snare as a shear burst / directed jet; the chords untouched. The user's scope words: *"only tune
  with Raindrops, don't do full sweep"* — tuned, stripped and proven on RaindropsOnRoses alone (the run at 24 s, the live lanes); **the other
  seven tracks are untuned and unswept on the user's word; the full sweep is owed before any tag.**
- **As built** (`core/fluid/inject2.js`, nothing in inject.js; `shaders.js` VORT, `fluid.js`, `fluid2/index.js`'s HUD line): **the curl** —
  `CURL_SRC 1`: `params.curl = CURL0 + CURL_MID · midEnv`, `midEnv` = the mid band's place in the track's own last FLOOR_WIN s — §111 item
  7's ring on the base's state (`st.base.midRing`, READ, never duplicated: the p20 / p80 of its one-second means, sstep between them; the
  level itself before the ring holds 5 s), eased `MID_TAU` .25 s so the constant never steps per frame (the largest step on the real trace
  2.578 ≤ CURL_MID·dt/MID_TAU 2.667); `CURL_SRC 0` is the base's `10 + 40·tension` to the bit. The base tied the curls to the BUILD (a
  riser tightens them); FLUID2 ties them to the mids' density — on Raindrops the breakdown's pads (118–126 s, mid .80–.88) read 49.8 where
  tension read 23.3, the thin stretch (111–116, mid .35–.48) 10.4 where tension read 16.4, the groove 42.1. **The mask** — `CURL_MASK 1`
  returns `params.curlMask { y0 .3, y1 .7, lo .25, fe .1 }`; `fluid.js` hands it to the vort pass as `uCurlMask` (vec4), the confinement ×
  mix(lo, 1, the feathered band); absent → (0, 1, 1, 0) and the branch is not taken — a uniform branch, never a mix (the ring's and the
  swirl's rule; the s12 real-md5 and the fake md5s prove the identical path). **The snare** — `SNARE_JET 1`: the drum branch's two shears at
  (.3, .5) / (.7, .5) (equal, opposite, inward) become ONE jet (`k: 'sjet'`) from x `SNARE_X` in from the left or the right wall, alternating
  by the snare count, at y `SNARE_Y` .5, at the pair's momentum Σ|dx|·rad and ink spread over `SNARE_N` 4 frames (S2's jet shape: a
  pending queue at 1 / SNARE_N per frame, emptied on the cold frame); the harmonic branch's one directed splat (`k: 'snare'`) and the chord
  shears (`k: 'chord'`) are untouched; the ink budget re-governs over the own list (the same ink SNARE_N frames later — within 10 % on every
  frame, the p50 dyeDiss the base's). `mids { pos, curl, mask }` and `snare { kind, mom, ink, n, side }` in the return (`CARD.fluid.mids /
  .snare`, the HUD's fluid line says the mids' place, the mask, the snare's kind and wall). **No new MS read**: `mid` and the snare lane are
  the base's (inject2's FLUID_FEATS is still the base's + `sub`).
- **The rulers** (HARNESS "## Fluid"): **the texture** — `tools/fluid-mids-lap.py` on a field strip's velocity shots (60–130 s at 1 fps): lap =
  the mean |3×3 Laplacian| of the velocity (the small-scale energy the plan names), speed, ratio = lap / speed (a still pool reads a low
  Laplacian whatever its confinement: the void's windows need the ratio), curlM; per window the p50, per dense / thin pair the margin. The
  windows from the trace (`tools/truth/traces/RaindropsOnRoses-map0.json`, the per-second `mid`): dense_groove 76–80 + 96–100 (.68),
  dense_pads 118–126 (.83, the sub gone), thin_break 111–116 (.48 — the ONE thin stretch the track has; "the breakdown is thin" holds for
  its first five seconds only, its pads are the densest mids on the track). **The sideways travel** — `LANE=snare tools/fluid-kick-strip.sh`
  + `tools/fluid-snare-travel.py`: the velocity ALONG THE PUSH, per column the fastest fibre (the p90 over the band y .5 ± .12 of dir·vx)
  minus the pre shot's, clipped: P the directed mass added, peak, front = how far from the launch it holds above .04 continuously. **The
  ruler that failed first:** the undirected added-mass centroid over the band (S2's U, turned sideways) read the busy pool's own change —
  span .8 of the width on every kind, the centroid at .4–.6 for a jet born at .05 — the directed fibre separates the hit from the traffic.
- **The mids, measured** (RaindropsOnRoses, the p50 per window; lap and curlM × 1000; `tools/work/fluid2/s3/cmp-mids.py`):

  | variant | curl groove / pads / thin | lap groove / pads / thin | speed groove / pads / thin | ratio groove / pads / thin | margin lap groove÷thin · pads÷thin | margin curlM | margin ratio |
  |---|---|---|---|---|---|---|---|
  | FLUID (s12, the control) | 22.8 / 23.3 / 15.4 | 14.9 / 12.8 / 9.7 | .147 / .041 / .067 | .112 / .331 / .135 | 1.54 · 1.32 | 2.09 · 1.37 | .83 · 2.46 |
  | FLUID2 CURL_SRC 0 (tension) | 22.8 / 23.3 / 15.4 | 15.8 / 12.6 / 8.9 | .228 / .045 / .054 | .080 / .285 / .176 | 1.77 · 1.42 | 2.79 · 1.61 | .46 · 1.62 |
  | **FLUID2 CURL_MID 40 (ships)** | 34.8 / 49.9 / 10.4 | 18.6 / 18.6 / 7.2 | .226 / .047 / .054 | .082 / .411 / .138 | **2.57 · 2.57** | **5.22 · 4.15** | .59 · 2.97 |
  | + CURL_MASK 1 | 34.8 / 49.9 / 10.4 | 14.4 / 13.3 / 5.2 | .215 / .046 / .053 | .072 / .304 / .109 | 2.79 · 2.57 | 4.00 · 3.42 | .66 · 2.80 |
  | CURL_MID 80 | 59.7 / 89.9 / 10.7 | 25.5 / 26.7 / 8.1 | .189 / **.091** / .052 | .117 / .317 / .144 | 3.14 · 3.29 | 7.52 · 6.99 | .81 · 2.21 |
  | CURL_MID 80 + mask | 59.7 / 89.9 / 10.7 | 18.5 / 19.3 / 5.8 | .221 / .060 / .053 | .084 / .331 / .110 | 3.17 · 3.30 | 6.34 · 6.26 | .76 · 3.01 |
  | CURL_MID 0 (the ruler's floor) | 10 / 10 / 10 | 11.6 / 6.9 / 6.3 | .232 / .056 / .054 | .056 / .119 / .129 | 1.84 · 1.09 | 2.10 · 1.04 | .43 · .92 |

  The reading: with the constant flat (CURL_MID 0) the groove still out-textures the thin stretch 1.84× — that is the MOTION's margin (the
  groove's speed is four times the void's), the ruler's floor; tension buys 1.42 on the pads (a build's riser); the mids' own range buys
  **2.57 on both pairs** (curlM 5.2 / 4.2: the curls twice as dense in the pads as tension gave, half as dense in the thin stretch), **at the
  pool's own speed** — the pads' speed .047 against tension's .045: the material changed, the mass did not (the frame: accenting, not
  driving). CURL_MID 80 buys 3.1–3.3 but DOUBLES the pads' speed (.091): a confinement at 90 pumps a still pool — the void driven, not
  textured — so 40 ships and 80 is the switch. **The mask buys nothing:** the lap margin +.2 on one pair and 0 on the other, the curlM margin
  DOWN (5.2 → 4.0, 4.2 → 3.4) and the dense windows' texture cut by a quarter (the confinement off on 60 % of the screen) — the plan's
  reason (the mids' ink enters at mid height) does not hold on the velocity: the curls the mids tighten live where the kick's pair and the
  sub's field put the motion, not where the floor's ink lands. `CURL_MASK` stays a K2 switch at 0 (the identical vort pass).
- **The snare, measured** (the 10 groove snares, p50 of the directed ruler: P the added directed mass, peak uv/s, front screen widths from
  the launch — at +0 / +½ / +1 beat):

  | variant | P 0 / ½ / 1 | peak 0 / ½ / 1 | front 0 / ½ / 1 | note |
  |---|---|---|---|---|
  | FLUID's pair (s12) | .133 / .171 / .167 | .210 / .175 / .125 | .088 / .086 / .086 | the control |
  | FLUID2 pair (SNARE_JET 0) | .168 / .194 / .171 | .224 / .191 / .172 | .077 / .135 / .078 | the base's shape under the field |
  | the jet AT the wall (.02, N 4) | .198 / .238 / .097 | .313 / .247 / .090 | .069 / .112 / **.000** | gone by +1 |
  | the stamp at the wall (.02, N 1) | .234 / .230 / .090 | .306 / .301 / .093 | .084 / .107 / .022 | gone by +1 |
  | **the jet .12 in (N 4) — ships** | .194 / **.347** / **.293** | **.412** / .345 / .243 | .067 / .142 / **.136** | carries itself |
  | .12 in, N 1 | .292 / .307 / .308 | .447 / .368 / .282 | .083 / .118 / .116 | the hardest hit, less reach |
  | .12 in, N 8 | .098 / .304 / .261 | .184 / .352 / .219 | .054 / .147 / .111 | soft at +0 |
  | .2 in, N 4 | .248 / .374 / .340 | .396 / .322 / .227 | .075 / **.208** / .176 (p10 0) | the furthest, born a fifth in |

  **The finding: a push AT a closed wall is projected away.** The plan's jet from (.02, .5) adds the most directed mass at +0 (.31 peak) and
  has NOTHING left at +1 beat — the pressure solve's no-through wall cancels the wall-normal push and spreads it along the wall (the velocity
  shots: a smear up and down the edge, no stroke). A hair in from the wall (.12 — two splat radii) the same impulse rolls up a burst that
  carries itself: front .136 at +1 beat (the pair's .078, FLUID's .086; the pair's own best, .135 at +½, it holds a full beat), the peak 1.4×
  the pair's at every moment, the directed mass at +1 1.7×. Spread over 4 frames beats one stamp on reach (the stamp's harder peak dies
  faster) and beats 8 on the hit's own frame (the eye wants the snare ON the snare). .2 in travels furthest but its p10 at +1 is 0 (one
  snare swallowed by the groove's traffic) and it is born a fifth of the way in — not "from a wall". **Ships: `SNARE_JET 1, SNARE_X .12,
  SNARE_N 4`; `SNARE_X .2`, `SNARE_N 1` and `SNARE_JET 0` the switches.** The §1.9 step at the hit ≤ .005 on every kind (max .0112 over
  the four moments), grey0 44–49 (the pair 48.9).
- **The decision — `CURL_SRC 1, CURL0 10, CURL_MID 40, MID_TAU .25, CURL_MASK 0` (`CURL_Y0 .3, CURL_Y1 .7, CURL_LO .25, CURL_FE .1` behind
  it), `SNARE_JET 1, SNARE_X .12, SNARE_Y .5, SNARE_N 4`.** The chords untouched (`k: 'chord'`, the base's to the byte on every frame).
- **What the eye should see at home (`#scene=13`, the montage `tools/accept/v0.37/fluid2-s116-s3-RaindropsOnRoses.jpg` — the mids rows
  (FLUID / FLUID2 on tension / FLUID2 on the mids, composite over velocity, at 78 / 98 / 113 / 122 s) above the snare rows (the pair / the
  jet .12, dye over velocity, two snares × four moments); `-variants.jpg` the mask, 80, 80 + mask, 0, and the six snare kinds):** in the
  breakdown's pads (118 s on) the ink grained with small eddies where FLUID's lay smooth, the thin five seconds before them smoother than
  FLUID's; every snare a burst of ink from the left wall then the right that rolls into the pool at mid height and is still travelling a
  beat later, where FLUID's two shears sat in the centre's traffic (the montage at 0.1 s cannot judge the rhythm — the user's eye in track
  time decides). The mids' reading is REACTIVE per frame (MID_TAU .25 s): at 98 s `mid` dips to .35 inside the groove and the curl follows
  (13) — the texture breathes with the mix, not with a 2 s mean.
- **The gates (Raindrops-filtered, each with its wall time; the receipt `tools/accept/v0.37/fluid2-s116-s3.txt`):** `node tools/check.js` **183 / 0 fail**;
  `npm test` **exit 0** (15 s; test_fluid 389 — S3's 19 cases, test_music 151); `license` 0 without the header; s13 real-md5 on Raindrops
  twice **8 / 8 cmp-equal** (69 / 69 s), all 8 moved against S2's → **re-based** into `real-md5-v037.txt` (the other 322 lines untouched);
  s12 **8 / 8 = v036** (69 s: the pool grammar's vort pass byte-identical under `uCurlMask` (0, 1, 1, 0)); the roster 0 1 3 **24 / 24 =
  v037** (207 s); real-rulers s13 **1 / 1 ok** (65 s: jump viol 0 max .054, mon viol 0 max .0161, black 0, clip25 0, medY .187); the fake
  **26 = v035** + s12's pair unmoved + s13's pair re-recorded 5dd1f1a7 / 9fd248b3 (213 s, errs [] on 14 ids); parity fake **max
  7.852214593751443 / 72 fields** / the §102 nav.* line to the digit (50 s); the bench in one page (q .95, load 1.61) pool / bands ship / bands
  mask / bands snare-every-step ×3 = .632 / .594 / .569 / .540 · .511 / .511 / .485 / .499 · .482 / .479 / .518 / .502 — **medians .511 / .511 /
  .518 / .502: ship − pool .000, the mask +.007, the snare −.009, within ±.05** (the mask is one vec4 uniform on the vort pass, no new pass;
  the fake page's snare lane has no rank, so the held snare exercises the harmonic splat — the jet's cost is S2's jet's, 1 + SNARE_N splats);
  bench(0) 1.259; **MOBILE=1 scene 13 tier 0 alive** (errs [] bad [] frameN 242; benchFluid bands .417 / mask .445 / snare .445 / pool .440 —
  the .4 budget's edge as S2 saw, the pool itself .440 on this desktop's phone canvas); `npm run build` 182 modules 1 825 515 bytes, file://
  scene 13 bands errs [] frameN 302, scene 12 pool errs []; the crossfade 12 → 13 greys 34.7 … 20.6 … 35.1 max step 7.49 / 255 §1.9 viol [],
  the 13 → 0 row the forced branch's revert, errs []. inject.js untouched.
- **Open, carried:** **the full sweep before any tag** (the user's word; S1's and S2's open lists stand); the tension → curl tie is GONE in
  FLUID2 (the mids drive the constant; a build's riser no longer tightens the curls — a `CURL_TENSION` term is one line if the eye misses
  it); the mask's cost is paid (one vec4 uniform on the vort pass, no new pass) for a switch that buys nothing on this track — remove it if
  the sweep agrees; the thin window on Raindrops is five seconds and the sub cut (65.5–68) reads dense mids at its frames — the dense /
  thin claim on the other seven tracks (Comptine's piano, IBelongHere's breakdown against SeeYouDrop's build-100, CyborgNinja's busiest) is
  the sweep's; the snare jet's wall alternation is by COUNT (left, right, left …) — a snare roll alternates every hit, which the eye may read
  as a flicker (by the bar is the one-line alternative); the directed ruler's band (y .5 ± .12) and THR .04 are this track's.
- **For S4's builder:** the vort pass now has a vec4 uniform (`uCurlMask`) beside `uCurlK` — S4's `uNoise` / `uSeed` go on ADVECT, not here;
  the per-step record set on `FLUID` is `heave, swirl, kick, mids, snare` (null under the pool grammar — `fldbg()` in fluid2/index.js
  carries them); the kinds in the band grammar's list are the base's + `dip` (S2) + `sjet` (S3) — a test that strips "the grammar's own
  kinds" lists both; `inkChanged` is set whenever SNARE_JET is on (the own ema decides; a no-op while it equals the base's); the strip tools
  take `LANE=` and the field strip's evals line carries `mid curl midsPos` — S4's hat-dense windows can use the same strip with S3's ruler
  (the Laplacian rises with the grain) beside S1's speed (the mass must not).


### S4 — highs = surface, never a force on the mass (2026-10-10, branch `fluid2`, commits 1acba17 → the docs; `git merge main` at 8ada5fc first — S3 merged, a fast-forward)

- **The ask, as the plan framed it and the user's scope holds:** the highs as the SURFACE — small scale, never a push on the mass (the
  frame: sparkle, grain, a glint; "air above 8 kHz is light only"). The plan's four parts: (a) the sparkle as it is, (b) small-scale velocity
  noise seeded on the step count, (c) a dip in the dye's dissipation on the highs, (d) the specular from `highS`. The user's scope words:
  *"only tune with Raindrops, don't do full sweep"* — tuned, stripped and proven on RaindropsOnRoses alone (the run at 24 s, the live lanes);
  **the other seven tracks are untuned and unswept on the user's word; the full sweep is owed before any tag.**
- **As built** — one driver per piece, three places: **the sparkle** (`fluid2/index.js`, hat2's droplets — FLUID's, untouched). **The
  grain** (`inject2.js` + `shaders.js` ADVECT + `fluid.js`): inject2 reads `high` (`FLUID_FEATS` + 'high'), `highEnv` by `HI_SRC` — 0 the
  level (`high`, 2–12 kHz, AGC'd — SHIPS), 1 its own-range place (this grammar's ring of one-second means over FLOOR_WIN s, p20 / p80 — cold
  on the switch), 2 the hats (`hat2`, the decaying hit level: bursts on the hits) — eased `HI_TAU` .05 s; `grain = NOISE_V · highEnv · g`
  (uv/s²) is returned and `fluid.js` hands it to the VELOCITY advect pass as `uNoise`, with `uCell` = `NOISE_CELL` sim texels per hash cell
  and `uSeed` = `floor(FLUID.steps / NOISE_HOLD) & 255` (the step count: deterministic from `at=0`, never a clock); the shader takes a
  uniform branch (0 = the byte-identical §104 pass; the dye pass always passes 0 — the velocity grain is velocity only) and adds per cell a
  Wang-hashed ±½·uNoise·dt push (uint arithmetic on cell + seed·2²⁴: bit-exact on every driver, no `sin`), x over the aspect. `JIT_V` (the
  dye-advect jitter: the DYE pass's back-trace sample point pushed ±½·JIT_V·highEnv·g dye texels by the same hash, `uJit`; (0, 0) the
  identical dye pass) was built as the zero-force grain and found to be a blur (below) — a switch at 0. **The dip** (`inject2.js`): `DIP_SRC 1`
  × (1 − HI_SHARP) on the governed dyeDiss for `DIP_N` frames from every frame the base's hat bucket paid a droplet (`k 'hat'`); `DIP_SRC 2`
  the plan's continuous × (1 − HI_SHARP · highEnv); 0 none; never inside the confirmed clear (DROP_DISS stands), bounded at 0 — after the ink
  governor, so the ink rate and the governor's factor are untouched (`fluid-tracks.js` on Raindrops: ink/s 9.6 / 18.7 ×1.0 / 1.0 under every
  dip, the base's 9.6 / 18.5; with `INJECT=inject2.js` plain `FLUIDK=` IS the band table — there is no `FLUIDK2` on the replays). **The
  specular** (`fluid2/{index,shaders}.js` — DISPLAY, where FLUID2's show pass diverges from FLUID's): the scene reads `highS` (feats +
  'highS'); uLook.y = SPEC.S0 .6 + SPEC.HI·highS, the Blinn exponent a uniform uSpecPow = SPEC.PW0 48 + SPEC.POW·highS (48 / .6 = FLUID's
  at highS 0); `SPEC` is the scene's live table (CARD.REG[13].scene.SPEC — `SPEC=` on the field strip; `K2=` cannot reach it), `SPEC.TIER0`
  0 holds FLUID's highlight at tier 0; `SPEC.GRAIN` the DISPLAY grain (the show pass reads the dye from a hashed point ±½·GRAIN·high texels
  off per pixel per frame, `uGrain` / its own `uSeed` = `ctx.fluid.steps & 255`; feats + 'high') — built as the grain that is surface and
  nothing else, found to be nothing (below), a switch at 0. "Air above 8 kHz" has no band (the plan's §3): `highS` (5–16 kHz, the synapse's
  slow band) is the nearest and the help line says so. `grain` and `highs { env, grain, dip, cell, hold, jit }` in the return
  (`CARD.fluid.grain` / `.highs`; the HUD's fluid line grain / dip, FLUID2's line spec gain / exponent / dgrain; `fldbg()` and `flinfo()`
  carry them). **Ships: `NOISE_V 1, NOISE_CELL 4, NOISE_HOLD 4, HI_SRC 0, HI_TAU .05, DIP_SRC 1, HI_SHARP .3, DIP_N 2, JIT_V 0`; `SPEC.S0 .6,
  HI 1.0, PW0 48, POW 40, TIER0 1, GRAIN 0`.**
- **The rulers** (HARNESS "## Fluid"): the field strip with `DYE=1` — a third shot per second, the dye itself (dbg 1) — and
  `tools/fluid-highs-grain.py`: per shot **speed** (S1's: THE GUARD, the grain on vs off within 10 %), **lap** (S3's small-scale energy of the
  velocity: the grain IS this), **dgrad** (the dye's mean gradient magnitude: the ink's edge sharpness — the plan's number for the dip),
  **dlap** (the dye's high-pass energy), **dink** (the ink on screen), **cgrad** (the composite's gradient: what the eye sees — the light
  moves it), the grey; per window the p50 (`tools/work/fluid2/s4/{run.sh, cmp.py, montage.py}`). The windows from the trace's per-second
  hat2 / high / highS: hat_rich 82–91 (hat2 .30–.38, 7–10 hatEvt/s), hat_poor 99–102 + 108–110 (hat2 ≤ .07 inside the groove — the same
  motion, no hats), groove 76–80 + 96–100 (the guard's), thin_break 111–116 (high .15–.22), dense_pads 118–126, outro 127–133 (highS
  .45–.52 with hat2 0: the air). A finding before any number: `high` (the 2–12 kHz level) does NOT separate hat-rich from hat-poor on this
  track (.32–.55 vs .39–.49 — the hats are a 5–12 k FLUX, the band is the mix's brightness); `hat2` does (the test: p50 .324 vs .024).
- **The dip, measured** (the strips against `spec` — the same light, no grain; the velocity bit-identical under every dip: speed and lap 1.000 on
  every window, the dip touches the dye's dissipation alone):

  | variant | window | dgrad (sharpness) | dlap | dink (the ink on screen) | cgrad | grey |
  |---|---|---|---|---|---|---|
  | DIP_SRC 1, HI_SHARP .3, DIP_N 2 (per hat) | hat_rich / hat_poor / groove / pads | 1.027 / 1.006 / 1.022 / 1.004 | 1.015 / 1.008 / 1.017 / 1.006 | **1.054 / 1.015** / 1.048 / 1.006 | 1.047 / 1.026 / 1.036 / 1.009 | 1.041 / 1.018 / 1.035 / 1.009 |
  | DIP_SRC 2, .3 (continuous × highEnv) | hat_rich / hat_poor / groove / pads | 1.042 / 1.065 / 1.059 / 1.009 | 1.034 / 1.045 / 1.043 / 1.020 | 1.096 / 1.108 / 1.122 / 1.035 | 1.088 / 1.078 / 1.077 / 1.044 | 1.079 / 1.079 / 1.092 / 1.053 |
  | DIP_SRC 1, HI_SHARP .9 (the big dip) | hat_rich / hat_poor / groove / pads | 1.084 / 1.015 / 1.066 / 1.010 | 1.056 / 1.030 / 1.047 / 1.012 | **1.186** / 1.046 / 1.156 / 1.019 | 1.156 / 1.079 / 1.116 / 1.028 | 1.146 / 1.043 / 1.121 / 1.028 |

  The reading: the dip buys INK, not edges — on every variant and window the sharpness rises LESS than the ink on screen (dgrad ÷ dink .97–.99):
  a dissipation is uniform over the picture, so a dip can only keep more of what is there, and a brighter ink has a brighter gradient. The
  per-hat dip is hat-SELECTIVE (+5.4 % ink in the hat-rich window against +1.5 % in the hat-poor one, the same groove) and the continuous
  form is not (+10 % everywhere the highs are up); the big dip fills the pool on the hats (+19 %, grey +15 % — the §111 packing the hat bucket
  was built against). The ink RATE (what the governor reads) is untouched by every dip (`fluid-tracks.js`: ink/s 9.6 / 18.7 ×1.0 / 1.0, the
  void % 24·11 per hat, 23·14 continuous, 19·11 off — the base's 19·11). The plan's rule — the dip on if the sharpness rises at equal ink/s —
  passes by the letter for the per-hat dip (+2.7 % at an unchanged rate) and is said plainly here to be the ink's brightness, not an edge.
  **Ships: `DIP_SRC 1, HI_SHARP .3, DIP_N 2`** (hat-selective, free, no packing: grey +4 % in the hat-rich window); `DIP_SRC 2` and `HI_SHARP
  .9` are the switches; the eye at home decides whether "the ink lingers on the hats" reads at all — the montage at 1 fps cannot.
- **The grain, measured** (ratios variant ÷ `spec` per window, the p50 over the window's shots; the guard is speed; the texture is lap (the
  velocity's Laplacian) and dlap (the dye's high-pass); `grain` is the amplitude the grammar sent, uv/s²):

  | variant | grain hat_rich / hat_poor / groove | speed hat_rich / hat_poor / groove / outro | lap | dlap | dgrad | note |
  |---|---|---|---|---|---|---|
  | NOISE_V .02 (the plan's K2) | .008 / .009 / .009 | 1.001 / .979 / 1.018 / .939 | .982 / .995 / .999 | .981 / .994 / .994 | .986 / .972 / 1.001 | nothing moves |
  | NOISE_V .1 | .04 / .04 / .04 | .986 / .977 / 1.003 / .938 | .992 / .993 / .995 | 1.007 / .983 / .983 | .998 / .974 / .985 | nothing |
  | NOISE_V .3 | .115 / .131 / .134 | .979 / .974 / 1.039 / .861 | 1.004 / .999 / .995 | 1.021 / .978 / .999 | 1.011 / .966 / 1.010 | nothing |
  | NOISE_V 1 | .38 / .44 / .45 | .987 / .963 / .986 / .915 | 1.000 / **1.035** / 1.028 | 1.010 / .983 / 1.015 | 1.000 / .946 / 1.016 | +3 % on the Laplacian at most |
  | NOISE_V .3, HI_SRC 2 (the hats) | .091 / .011 / .076 | .987 / .979 / 1.068 / .937 | .996 / .987 / 1.002 | 1.010 / .977 / 1.006 | 1.000 / .947 / 1.006 | the amplitude follows the hats 8 : 1, the pool does not |
  | NOISE_V .3, HI_SRC 1 (own range) | .031 / .096 / .144 | .987 / .987 / .995 / .922 | .995 / .998 / 1.012 | .981 / 1.002 / 1.011 | .962 / .980 / 1.013 | the ring reads the groove as the top of the range |

  The reading: **a per-texel, per-step white push is exactly what the solver removes.** At NOISE_V 1 (±.0037 uv/s per texel per step, the
  hash on every texel of the velocity pass) the velocity's Laplacian moves +3.5 % at most and the dye's high-pass +1.5 % — the projection
  strips the divergent half the same step and the semi-Lagrangian back-trace's bilinear sample diffuses the rest within a few steps; the
  per-window ratios sit inside the flow's own run-to-run divergence (±2–6 %: any change seeds a different turbulent history, which is why the
  outro — six shots with the 129.98 s clear in them — reads .86–.94 on speed for every variant, the grain-off control's history as much as
  the variant's). The guard holds everywhere, trivially: nothing happened. So the grain's cell and hold (NOISE_CELL, NOISE_HOLD) and the dye
  jitter (JIT_V) were built and stripped in a second batch:

  | variant | speed hat_rich / hat_poor / groove / thin / pads | lap (the velocity's texture) | dlap (the dye's high-pass) | dgrad | note |
  |---|---|---|---|---|---|
  | **NOISE_V 1, CELL 4, HOLD 4 — ships** | 1.023 / 1.065 / 1.054 / .974 / 1.010 | 1.009 / **1.080 / 1.112 / 1.292** / 1.008 | 1.021 / 1.023 / 1.111 / 1.050 / .994 | .999 / .998 / 1.086 / 1.033 / .999 | the first grain that registers; the guard holds (≤ +6.5 %) |
  | NOISE_V 1, CELL 2, HOLD 2 | .992 / .977 / 1.026 / .975 / .989 | 1.008 / 1.067 / 1.091 / 1.194 / 1.006 | 1.022 / 1.014 / 1.098 / 1.045 / 1.022 | 1.008 / .998 / 1.087 / 1.031 / 1.036 | half the cell, two thirds of the texture |
  | NOISE_V 3, CELL 4, HOLD 4 | **1.081 / 1.147 / 1.378** / 1.002 / 1.148 | 1.064 / 1.217 / 1.229 / 1.744 / 1.059 | 1.131 / 1.089 / 1.152 / 1.134 / 1.063 | 1.105 / 1.070 / 1.061 / 1.147 / 1.078 | A FORCE: the groove 38 % faster — the guard breaks |
  | JIT_V .5 (the dye-advect jitter) | 1.000 everywhere | 1.000 | .996 / .992 / .994 / .997 / .991 | .995 / .991 / .992 / .998 / .995 | zero force (bit-identical velocity) — and a BLUR |
  | JIT_V 1 | 1.000 | 1.000 | .993 / .978 / .985 / .995 / .974 | .981 / .973 / .974 / .993 / .978 | a blur |
  | JIT_V 2 | 1.000 | 1.000 | 1.013 / .952 / .968 / .984 / .938 | .940 / .919 / .923 / .976 / .935 | a blur, 6–8 % |
  | JIT_V 1, HI_SRC 2 (the hats) | 1.000 | 1.000 | .991 / .997 / .993 / .997 / .997 | .988 / .996 / .988 / 1.000 / .995 | the same, gated to the hats |

  Two findings. (1) **The grain needs a cell and a hold to exist at all**: a 4-texel push held 4 steps (NOISE_V 1: ±.0037 uv/s per step per cell,
  accumulating to ~.015 before the projection sees it) lifts the velocity's small-scale energy 8 % in the hat-poor groove, 11 % in the dense
  groove and 29 % in the still thin break (the grain shows most where the pool is still: on a moving pool the motion's own texture hides it),
  the dye's high-pass 2–11 %, at a mean speed within +6.5 % of the grain-off run (the guard) — and three times that amplitude is a FORCE (the
  groove 38 % faster, the pads 15 %): the guard's edge lies between 1 and 3 (the third batch brackets it at 2). The plan's "largest NOISE_V
  under the 10 % guard" is 1 at cell 4 / hold 4. (2) **A jitter on the dye advect pass is a blur, not a grain**: each step's white offset
  of the back-trace sample is baked into the ink and re-sampled the next step — a random walk of the read point IS diffusion (dgrad −2 % at
  JIT_V 1, −7 % at 2, the velocity bit-identical: zero force, as designed, and the wrong sign). The grain that is exactly "surface, never the
  mass, nothing accumulated" is the DISPLAY grain — FLUID2's show pass reads the dye from a hashed point ±½·GRAIN texels off per pixel per
  frame (`SPEC.GRAIN`, seeded on `ctx.fluid.steps`; a flat ink reads the same from a texel off, so it is grain on the ink's EDGES): the third
  batch below. `JIT_V` stays at 0 as a switch (a softening on the highs, said so).
- **The light, measured** (against `ctrl` = FLUID's constants, .6 / 48 — the pool bit-identical under every light: speed, lap, dgrad, dlap,
  dink 1.000 on every window, the proof that the specular is display only; cgrad = the composite's gradient, what the eye reads as sharpness):

  | SPEC.HI / SPEC.POW (gain .6 + HI·highS, exponent 48 + POW·highS) | cgrad hat_rich / groove / pads / outro | grey hat_rich / groove / pads / outro | reading |
  |---|---|---|---|
  | .5 / 80 (the plan's K2) | .975 / .978 / .967 / .938 | .928 / .920 / .919 / .889 | the tighter exponent shrinks the highlight's light faster than the gain grows: DARKER, 7–11 % |
  | 1.2 / 80 | 1.063 / 1.075 / 1.087 / 1.076 | .956 / .951 / .954 / .921 | sharper, still 4–8 % darker |
  | .5 / 0 (the gain alone) | 1.081 / 1.091 / 1.099 / 1.154 | 1.035 / 1.039 / 1.028 / 1.060 | brighter — the broad wash FLUID's pow 48 puts on the flat pool, more of it |
  | **1.0 / 40 — ships** | **1.096 / 1.109 / 1.120 / 1.151** | **.999 / .999 / 1.001 / .987** | tighter AND brighter: the eye's sharpness +10–15 %, the frame's light unchanged |

  FLUID's pow-48 highlight lights the whole flat surface (dot(n, h) ≈ 1 on a still pool: a grey wash); a tighter exponent takes the wash off
  and leaves the glint on the ink's edges — the gain must grow with the exponent to keep the frame's light (the Blinn lobe's integral falls
  as 1 / pow). At the outro's air (highS .5: gain 1.1, exponent 68) the composite's gradient is +15 % at grey −1 %.
- **The third batch** (the shipping light under every row; ratios against `specC`, the same light and no grain): NOISE_V 2 at cell 4 / hold 4 —
  speed hat_rich / hat_poor / groove / pads 1.032 / 1.082 / **1.249** / 1.040, lap 1.027 / 1.159 / 1.186 / 1.029 (the thin break 1.585): the
  guard breaks at 2 already — 1 is the largest tried value under it. **The display grain** (`SPEC.GRAIN` .5 / 1 / 2 dye texels): the pool
  bit-identical (every pool column 1.000) and the composite's gradient .999 / .997 / .995 at hat_rich, .998 / .994 / .985 at the outro —
  NOTHING, and nothing by eye at .7 on the fake page: a sub-texel shift of the read point on a smooth 16F ink field (bilinear, no detail at
  the texel) reads the same ink; what the eye calls film grain is a multiplicative noise on the lit colour, a post effect and not this
  scene's. `SPEC.GRAIN` stays 0 as a switch, said so.
- **The ship strip** (K2 + SPEC as shipped, against `specC` — the light alone): speed hat_rich / hat_poor / groove / thin / pads 1.023 /
  1.065 / 1.054 / .974 / 1.010 and lap 1.009 / 1.080 / 1.112 / 1.292 / 1.008 — the v1c4h4 strip's velocity numbers to the third digit (the
  dip never touches the velocity: a determinism proof across two runs for free), dlap 1.034 / 1.030 / 1.130 / 1.050 / 1.001, dink 1.000 /
  1.059 / 1.076 / .995 / 1.002 (the dip's ink), the composite's gradient 1.060 / 1.112 / 1.089 / 1.101 / 1.010. The hats as the grain's
  driver (`HI_SRC 2`, the same amplitude): grain .30 in the hat-rich window against .04 in the hat-poor (8 : 1) and NO texture from it (lap
  .999 / .999 / 1.061 / 1.014) — a hat's burst (hat2 decays in .06 s, eased .05) is shorter than the hold, and the hat-rich window is the
  pool's fastest (speed .32 against the groove's .21: the motion's own texture hides a grain). **So the hat-rich / hat-poor table reads
  AGAINST the hats** (the ship: lap +0.9 % hat-rich, +8 % hat-poor, +11 % groove, +29 % thin break): the grain follows the high BAND's level
  and shows where the pool is still; the hats are the sparkle and the dip, not the grain. `HI_SRC 2` stays a switch.
- **What the eye should see at home (`#scene=13`, the montage `tools/accept/v0.37/fluid2-s116-s4-RaindropsOnRoses.jpg` — rows FLUID's light
  on S3's grammar / the light alone / the SHIP, each as composite, velocity, dye, at 78 / 85 / 100 / 113 / 122 / 130 s; `-variants.jpg` the
  force, the half cell, the texel-white, the hats as driver, the blur, the big dip, the two other lights, the display grain):** the glint on
  the ink's edges tighter and brighter than FLUID's grey wash wherever the air is up (the outro from 127 s most), the frame no darker; in the
  breakdown's thin five seconds (111–116) a fine dapple on the still pool where FLUID2 S3 lay laminar; in the groove a texture the eye may
  or may not separate from the mids' curls (the ruler says +11 %); on the hats nothing new beyond the droplets — the ink lingers 5 % longer
  there, below what a montage shows. The user's eye in track time decides the grain's amplitude (1 is the guard's edge, not a taste) and
  whether the light's tighter glint reads as "the highs".
- **The gates (Raindrops-filtered, each with its wall time; the receipt `tools/accept/v0.37/fluid2-s116-s4.txt`):** `node tools/check.js` **183 / 0 fail**;
  `npm test` **exit 0** (test_fluid 403 — S4's 14 cases, test_music 151); `license` 0 without the header; s13 real-md5 on Raindrops twice **8 / 8
  cmp-equal** (69 / 69 s), all 8 moved against S3's (the grain is on the velocity every frame) → **re-based** into `real-md5-v037.txt` (the other
  322 lines untouched); s12 **8 / 8 = v036** (69 s: the pool grammar's advect pass byte-identical under uNoise 0 / uCell 1 / uJit (0, 0)); the
  roster 0 1 3 **24 / 24 = v037** (208 s); real-rulers s13 **1 / 1 ok** (66 s: jump viol 0 max .058, mon viol 0 max .0161, black 0, clip25 0);
  the fake **26 = v035** + s12's pair unmoved + s13's pair re-recorded 9a5a843b / 9ec3cf10 (213 s, errs [] on 14 ids); parity fake **max
  7.852214593751443 / 72 fields** / the §102 nav.* line to the digit (50 s); the substrate bench (one page, q .95, load 1.96 and the GPU clock
  ramping down over the run) pool / bands ship / grain-off / grain-1-at-cell-1 ×3 = 1.269 / 1.274 / 1.229 / 1.007 · .867 / .848 / .878 / .567 ·
  .629 / .524 / .496 / .494 — **medians .867 / .848 / .878 / .567: ship − pool −.019, within ±.05**; the grain's own cost is inside the ramp's
  noise (the full-amplitude texel hash reads below the grain-off quad every time — a branch and a hash on 33 k texels); **the show pass on
  FLUID2's own page** (q .95, tier 3; the knob set, a frame waited, then bench — `CARD.bench(13)` on another scene's page never runs this
  scene's `update()`, its spec and grain are the last frame's): bench(12) / bench(13) with the specular / with the display grain 1 ×3 = .491 /
  .479 / .577 · .452 / .435 / .522 · .426 — **the specular +.03 ms over FLUID's (.479 ≤ .5), the display grain +.09** (a hash per screen pixel —
  over FLUID's budget: one more reason `SPEC.GRAIN` is 0); **MOBILE=1 scene 13 tier 0 alive** (errs [] bad [] frameN 242; benchFluid bands ship
  .536 / grain-off .483 / grain-1 .499 / pool .483 — the pool itself .483 on this desktop's phone canvas under load 1.96 where S3 read .440 at
  1.61: the tier-0 substrate is over the .4 budget on this machine today with or without S4, the grain inside the quad's noise; the show pass
  at tier 0 bench(13) .601 / .591 at highS 1, .606 at 0, bench(12) .577 / .602 — **the specular costs nothing measurable at tier 0: `SPEC.TIER0`
  stays 1**); `npm run build` 182 modules 1 841 924 bytes, file:// scene 13 bands errs [] frameN 302, scene 12 pool errs []; the crossfade
  12 → 13 greys 34.7 … 19.7 … 33.4 max step 7.58 / 255 §1.9 viol [], 13 → 0 the forced branch's revert, errs []. inject.js untouched.
- **Open, carried:** **the full sweep before any tag** (the user's word; S1–S3's open lists stand); the tier-0 substrate reads .48–.54 ms on this
  desktop's phone canvas today (the pool itself .483 under load 1.96; S3 read .440, S2 .416) — the .4 budget wants a phone, not a loaded
  desktop, before any tier-0 cut is decided; the grain's amplitude is the GUARD's edge (1 at cell 4 / hold 4: +6.5 % speed; 2 is +25 %), not a
  taste — the user's eye may want less; the hat-rich window shows the LEAST grain (the pool's fastest window hides texture) — on a track whose
  hats sit on a still pool (a breakdown with hats) the reading inverts, the sweep's question; the dip is ink retention (+5 % on the hats), kept
  on the plan's rule by the letter and said plainly to be no edge; three switches that buy nothing are kept at 0 with their findings (`JIT_V`
  the blur, `SPEC.GRAIN` the nothing, `HI_SRC 1` the own range that reads the groove as the top) — remove them if the sweep agrees; the dye
  pass pays no new cost (uJit (0, 0) is a branch not taken), the velocity pass one branch and an integer hash; the 8 k "air" band still does
  not exist (`highS` 5–16 k lights the pool and the help line says so); `fluid-tracks.js` gained no S4 column (the grain and the dip read off
  the strips, not the replay — `highs.env` p50 / the dip frames per music second are one line if S7 wants them).
- **For S5's builder:** the band grammar's record set on `FLUID` is now `heave, swirl, kick, mids, snare, grain, highs` (null / 0 under the pool
  grammar; `fldbg()` carries them); the kinds in the list are the base's + `dip` + `sjet` — S4 added NO kind (the grain is a uniform, the dip a
  parameter); `R.params.dyeDiss` is touched AFTER the governor by the dip — a pen's ink must be counted in the governor's sum (before the S4
  block) and never read dyeDiss as the base's; the ADVECT shader has `uNoise, uSeed, uCell` (the velocity pass) and `uJit` (the dye pass) beside
  S1's `uSwirl` and S2's `uRingC` — a pen is a SPLAT (k 'pen'), nothing on the passes; FLUID2's show pass has `uSpecPow, uGrain, uSeed` and the
  scene's `SPEC` table (CARD.REG[13].scene.SPEC — `SPEC=` on the field strip); `DYE=1` on the field strip gives the dye shot per second and
  `tools/fluid-highs-grain.py` the dye's columns (dgrad / dlap / dink) — a pen's ink/s and x span can read off the same strip; the strip's
  per-window ratios carry the flow's own ±2–6 % run-to-run divergence (a different turbulent history from any change): read a window, never a
  shot, and expect the outro (the 129.98 s clear inside it) to wander; `CARD.bench(13)` on the scene-12 page never runs FLUID2's `update()`;
  the copied gates script's `scene-md5.sh` tag is a hand edit (s3 → s4 → s5); with `INJECT=inject2.js` the replays' `FLUIDK=` IS the band
  table (no `FLUIDK2`).

### S5 — vocals = the pen: the MECHANICS, the feature deferred (2026-10-10, branch `fluid2`, commits efc5bf1 → the docs; `git merge main` at 80d8aef first — S4 merged, a fast-forward)

- **The ask, as the plan framed it and the user's scope holds:** the voice is a PEN — a continuous emitter following pitch, brightness =
  presence, leaving a stroke the fluid carries off; it DRAWS, it does not inject mass (the user's frame on "can subbass / bass / mid / highs /
  vocals be treated differently"). The plan's §3 inventory found the one band the engine cannot hear as a band: no vocal-presence, no
  harmonic-to-noise, no pitch-continuity feature (the nearest proxies are `mid · clarity · (1 − dirty)` and the §108 floor, which IS "the mids
  are singing" today) — a thin one does not exist (one extractor session with its own ruler). So §4 S5's letter: **the mechanics only — a
  drifting emitter on the harmony's centre replacing the floor; the feature deferred to S5b, one read when it lands.** The user's scope
  words: *"only tune with Raindrops, don't do full sweep"* — tuned, stripped and proven on RaindropsOnRoses alone (the run at 24 s, the live
  lanes; the groove 76–110, the breakdown 111.4–137.1 where a lead would carry the pool, the pads 118–126); **the other seven tracks are
  untuned and unswept on the user's word; the full sweep is owed before any tag.** Kept small: one kind, six knobs, no new MS read.
- **As built** (`inject2.js`, the S5 block between S3's jet and the governor's sum — S4's note: a pen's ink is counted BEFORE the dip touches
  `dyeDiss`): **the kind** `k: 'pen'` — ONE sustained dye splat per frame that REPLACES the base's `floor` (§108: a fixed cloud at the
  tonic's x 6.5 / 12, y .5, radius ×2) while `PEN_SRC` > 0, at the floor's ink in the budget's units EXACTLY (its dye × (2 / PEN_RAD)² at
  radius PEN_RAD · RADIUS: a thinner, denser mark, the same area-weighted ink — the governor's own rate is the off run's to 1e-9 on every one
  of RaindropsOnRoses's 6601 real frames, dyeDiss too); no floor, no pen (the pen lifts on silence, on noise and in the clear, as the floor
  does — the §108 "it heard that one" ruler stays the floor's: 6599 pen frames = 6599 floor frames). So the pen's BRIGHTNESS is the floor's
  level — the mids' place on the track's own last 30 s × the gain (presence · loudRel: the brightness IS the presence) — and S5b's `voxS`
  multiplies it. **The place**: x on the TONIC AXIS (§111 item 6 — the base's own axis and its tonic rule: `pin.k`, or the centre's nearest
  fifth before any pin, `sectorPc` from keycolour.js) as a CONTINUOUS fifths position relative to the tonic, `x = frac((p + 6.5) / 12)` (the
  integer sectors land on relX's values; the tritone's sector is split at the walls), the target by `PEN_AX`: 0 the base's eased harmony centre
  (`st.base.hx / hy`, HARM_TAU 15 s — the plan's letter), 1 the frame's `harmAngle` (the chroma's fifths centroid — continuous; the pen's own
  ease the only inertia); y by `centroid` (.25 + .5·c, the harmonic branch's place). The position is EASED (`PEN_TAU` .3 s) on the fifths
  CIRCLE by the shortest arc (a +7-fifths target is walked as −5) and the move's LENGTH is clamped to `PEN_VMAX · dt` (.5 screen heights / s —
  the §1.9 step on every frame, the diagonal included: the first cut clamped x and y apart and the diagonal reached lim·√2, the test caught
  it); a re-pinned key is a stroke of k sectors, never a jump; the one lift is the tritone WALL (the axis's cut, x .99 → .01: `pen.wrap` 1 on
  that frame, its step read on the circle — the synthetic walk round the circle lifts exactly once; RaindropsOnRoses lifts never). The cold
  frame (fluid.js resets `n`) and a live `PEN_SRC` switch-on start AT the target (step 0, no sweep). **The push**: dx, dy = `PEN_V` × the
  pen's own drift velocity (uv/s) × g × f — zero while the pen is still (a stroke, never a plume), bounded by PEN_V · PEN_VMAX · g · f.
  **The switch**: `PEN_SRC` 0 off (the base's `floor` splat to the byte, no `pen` kind, `pen.on` 0), 1 the harmony stand-in, **2 RESERVED
  for the vocal feature** — the reads (`voxS`, `voxHz`) are NOT in the file (FLUID_FEATS unchanged: sub + high over the base's; check.js
  FAILS on a read outside it): 2 plans as 1 today and `pen.src` says 2. **The record** `pen` { on, src, x, y, step, v, ink, floor, wrap }
  in the return → `FLUID.pen`, `fldbg()`, the HUD's fluid line (`pen x,y`), `CARD.fluid.pen`; the field strip's evals line carries `penOn
  penX penY penStep penInk` after the highs' four (`fluid-highs-grain.py`'s regex opened to the trailing fields). help.js's eli5 says the pen
  draws the HARMONY today, not the voice, and must not be read as a vocal detector. inject.js untouched.
- **K2 (the ship table):** `PEN_SRC 1` · `PEN_AX 1` · `PEN_TAU .3` · `PEN_VMAX .5` · **`PEN_V 0`** · `PEN_RAD 1`. The plan's K2 named
  `PEN_DYE .004` (the floor's — here the floor's ink is inherited, not re-declared), `PEN_V .02` (the plan's units were a per-frame stamp;
  here PEN_V is a fraction of the pen's own speed and ships 0 — below), `PEN_LO .15 / PEN_HI .4` (the floor's own knee, inherited: the pen's
  presence proxy IS the floor's level, so no second knee), `PEN_TAU .3` (kept).
- **The rulers and the windows.** (1) The PURE ruler at 60 fps (`tools/work/fluid2/s5/ruler.js`, no GL — RaindropsOnRoses's real trace
  through inject2): per window the pen's frames vs the floor's, the ink/s of each, the own ink rate ÷ the control's and the largest relative
  dyeDiss difference (the governor), the STROKE PER BEAT (Σ `pen.step` over each beat's frames, p50 / p90 — the dye's path along the axis per
  beat), the largest per-frame step vs PEN_VMAX · dt, the lifts, the x span (p90 − p10), the drift speed, the push's max. (2) The EYE: the
  field strip with `DYE=1` over 76–137 at 1 fps per variant (eight strips, ~2 min each, `tools/work/fluid2/s5/{run.sh, strips*.log}`) with
  the S4 highs ruler on it for the pool's SPEED (the guard: within 10 % of the pen-off strip per window) and the dye's ink / edges; and two
  10 fps strips over the pads 118–121 (pen off / pen ink-only) for the beat's cadence. The windows: groove 76–110, breakdown 111.4–137.1,
  thin 111–116, pads 118–126, outro 127–137 (the 129.98 s clear inside it).
- **The pure ruler (RaindropsOnRoses, 6601 frames; every variant: floor frames = pen frames on every window, the ink/s equal, the ink rate
  ÷ control 1.000000, the dyeDiss difference 0, lifts 0):**

| tag | window (frames) | stroke / beat p50 | p90 | step max (lim .00833) | x p10 / p50 / p90 | span | drift p50 uv/s | push max |
|---|---|---|---|---|---|---|---|---|
| **ship** AX 1 V 0 | groove (2040) | .0233 | .0759 | .00833 | .389 / .553 / .611 | .223 | .059 | 0 |
| | breakdown (1357) | **.0539** | .0912 | .00654 | .261 / .402 / .515 | **.254** | .125 | 0 |
| | thin (300) | .0476 | .0598 | .00443 | .400 / .480 / .565 | .164 | .095 | 0 |
| | pads (480) | .0556 | .1211 | .00602 | .257 / .404 / .511 | .254 | .153 | 0 |
| | outro (421) | .0594 | .1150 | .00654 | .248 / .354 / .487 | .239 | .133 | 0 |
| AX 0 (the plan's letter) | groove | .0147 | .0221 | .00239 | .518 / .530 / .547 | .028 | .029 | 0 |
| | breakdown | **.0078** | .0191 | .00188 | .427 / .476 / .518 | **.091** | .018 | 0 |
| | pads | .0091 | .0170 | .00140 | .458 / .478 / .494 | .036 | .019 | 0 |
| AX 1 TAU .1 | breakdown | .0630 | .1276 | .00833 | .252 / .398 / .528 | .277 | .148 | 0 |
| AX 1 V .25 | breakdown | .0539 | .0912 | .00654 | (AX 1's) | .254 | .125 | 7.1e-2 |
| AX 1 V .25 | all | .0394 | .1015 | .00833 | .334 / .524 / .605 | .270 | .088 | .122 |

  At 140 BPM a beat is .43 s: the shipped pen walks a twentieth of the screen per beat on the breakdown (a quarter of the screen over the
  phrase), the plan's-letter centre a hundred-and-thirtieth (a dot that drifts .09 over the whole breakdown). The step never exceeds the
  clamp; the clamp is ACTIVE on the groove's chord changes (max = lim) and idle on the breakdown.
- **The strips (the S4 highs ruler per window, the ratio variant ÷ the pen-off strip; the flow's own run-to-run divergence is ±2–6 % per
  window — read a window, never a shot):**

| tag | window | speed | lap | dgrad | dink | grey |
|---|---|---|---|---|---|---|
| **ship** AX 1 V 0 | groove | **1.000** | 1.000 | 1.016 | 1.003 | 1.022 |
| | breakdown | **1.000** | 1.000 | 1.024 | 1.096 | 1.036 |
| | thin | 1.000 | 1.000 | 0.998 | 1.028 | 1.013 |
| | pads | 1.000 | 1.000 | 1.011 | 1.030 | 1.016 |
| | outro | 1.000 | 1.000 | 1.088 | 1.143 | 1.035 |
| AX 0 | groove / breakdown / pads | 1.003 / 1.046 / 0.994 | ≈ 1 | 1.036 / 1.011 / 1.055 | 1.005 / 1.164 / 1.045 | 1.025 / 1.002 / 1.007 |
| AX 1 V .05 | groove / breakdown / outro | 1.009 / 1.032 / 1.100 | ≈ 1 | 1.001 / 1.053 / 1.108 | 1.009 / 1.182 / 1.221 | 1.034 / 1.046 / 1.071 |
| AX 1 V .25 | groove / breakdown / thin / outro | 1.021 / **1.237** / 1.249 / **1.370** | 1.013 / 1.013 / 1.028 / 1.039 | 1.068 / 1.044 / 1.130 / 1.033 | 1.016 / 1.082 / 1.092 / 1.230 | 1.029 / 1.029 / 1.016 / 1.115 |
| AX 1 V 1 | groove / breakdown / pads / outro | 1.090 / **2.435** / **2.687** / 2.017 | 1.006 / 1.158 / 1.145 / 1.089 | 0.955 / 1.147 / 1.319 / 1.021 | 0.994 / 1.212 / 1.631 / 1.377 | 1.031 / 1.185 / 1.405 / 1.138 |
| AX 1 RAD 2 V .25 | groove / breakdown / outro | 1.037 / **1.443** / 1.474 | ≈ 1.03 | 0.994 / 0.974 / 0.912 | 0.996 / 1.007 / 0.996 | 1.002 / 1.038 / 0.990 |
| AX 1 TAU .1 V .25 | breakdown / outro | 1.248 / 1.454 | 1.007 / 1.031 | 1.088 / 1.041 | 1.084 / 1.166 | 1.029 / 1.061 |

  Ink only is zero force to the digit (the velocity pass sees a dye-only splat: speed and lap 1.000 everywhere); the dye's edges +1–9 % and
  the ink on screen +3–14 % — the floor's cloud spread its ink at one place where the eddies thinned it, the pen's mark is denser and moves,
  the same ink. **The push is the guard's edge on a NEAR-STILL pool**: the breakdown runs at .05 uv/s against the groove's .20–.32, so a push
  that is nothing on the groove (+2 % at .25) is +24 % on the breakdown and +37 % on the outro; 1 is a plume (×2.4–2.7, the eddies' lap +15 %);
  .05 sits inside the 10 % guard (+3 %, the outro +10 %) and the 1 fps eye finds nothing it buys; a wider pen (RAD 2) pushes more at the same
  PEN_V (+44 %: the impulse ∝ dx · rad) and reads no sharper (dgrad .91–.99).
- **The eye (the montages):** `tools/accept/v0.37/fluid2-s116-s5-RaindropsOnRoses.jpg` — 76–137 at 1 fps, rows off (composite + dye),
  SHIP (composite + dye), AX 0 (dye), V .25 (dye), V 1 (dye), at t 80 95 105 113 120 125 131 136 — at ONE second per shot the breakdown's
  ink is a cloud under every variant (the pool's own eddies smear whatever enters; V 1's plume is the one row that differs, and it differs
  by a bulge of ink, not a line). `…-pads10fps.jpg` — the pads 118.9–120.4 at 10 fps, six consecutive dye shots, the central band at full
  size, floor vs the shipped pen: **the floor's ink sits as two or three separate blobs that stay put (the eddies feeding a fixed source);
  the pen's is ONE continuous band bridging where the blobs were — the trail of its walk x .48 → .30 → .48 over 3 s. A line being drawn.**
  On the groove the fast pool smears either one (dgrad +1.6 %, the eye's difference nil) — the pen is the breakdown's instrument, which is
  where a lead or a voice carries the pool.
- **The ship decision:** `PEN_SRC 1` ships — the eye says line (at the beat's cadence, on the breakdown) and the budget holds to 1e-9;
  `PEN_AX 1` (the plan's letter, the 15 s centre, is a dot — its ease was built for the HUE, where a progression must be one colour; a pen
  wants the chord); `PEN_V 0` (the user's frame — it draws, it does not inject mass — and the guard: 0 is zero force to the digit, .25 breaks
  it on the still windows, .05 passes and buys nothing); `PEN_RAD 1`, `PEN_TAU .3`, `PEN_VMAX .5` (the clamp active only on the groove's
  chord steps). What the pen draws today is the HARMONY — help.js and CONTRACTS §1.1 say so.
- **The gates (RaindropsOnRoses-filtered; `tools/work/fluid2/s5/gates.sh`, the log `gates.log`; each with its wall time):** `node tools/check.js` 183 modules · 0 fail · 9 warn (inject2.js over the 350-line soft cap at 393 — the comments);
  `npm test` exit 0 — test_fluid **423 ok 0 fail** (S5's 20 cases in the bands block), test_music 151 ok (19 s); `node tools/license.js` 186 public
  files, 0 without the header (the ruler lives in tools/work); **SCENES=13 real-md5 Raindrops ×2: 8 / 8 cmp-equal (69 s + 69 s)**, all 8 moved
  against S4's (the floor's splat is the pen's on every frame) → re-based into `real-md5-v037.txt` (8 lines, the other 322 untouched; the first
  run shared the GPU with a 33 h-old headless Chrome found and killed mid-run — a/b still cmp-equal, frame0 2); **SCENES=12 real-md5 Raindrops:
  8 / 8 = v036 (68 s)** — the pool grammar returns no pen, the step the §104 pass; **the roster 0 1 3 Raindrops: 24 / 24 = v037 (208 s)**,
  differ [], new []; **real-rulers s13 Raindrops 56–116: 1 / 1 ok (65 s)** — jump viol 0 max .058, mon viol 0 max .0161, black 0, clip25 0,
  medY .194; **scene-md5 fake: 26 = v035 (s13's pair aside), errs [] on 14 ids (213 s)**; s12's pair unmoved (3e483039 / 2274bb4e = v035),
  s13's pair re-recorded 9a67af34 / fb6a5d6f (S4's 9a5a843b / 9ec3cf10 — the pen on the fake's floor); **parity fake: max |diff|
  7.852214593751443 over 72 fields, the §102 nav.* line to the digit (51 s)**; **the substrate bench** (one page test&scene=12, q .95 pinned,
  load 1.68, the GPU clock ramping over the run as in S4): pool / bands ship (the pen on, V 0) / bands pen-off (PEN_SRC 0: the floor's splat) /
  bands pen V 1 ×3 = 1.198 / 1.105 / 1.072 / 1.066 · 1.063 / 1.047 / 1.060 / 1.041 · 1.058 / 1.064 / .847 / .809 — **medians 1.063 / 1.064 /
  1.060 / 1.041: ship − pool +.001, ship − pen-off +.004, within ±.05** (one splat for one splat: no cost by construction; the absolute ms are
  this desktop's load — S4 read .85–.87 at load 1.96 after its own ramp); the show pass bench(13) .411 / bench(12) .363 (the pen is the pool's,
  nothing on the show pass), bench(0) 1.418; tier 3, sim 259×128, dye 1035×512; **MOBILE=1 scene 13 tier 0 alive** (errs [] bad [] frameN
  242, `pen` on at x .44; benchFluid bands ship .536 / pen-off .533 / pool .481 — the pen inside the quad's noise; show13 .603 / show12 .574 —
  the tier-0 substrate still over the .4 budget on this loaded desktop, S4's finding); `npm run build` 182 modules **1 851 843 bytes** (S4's
  1 841 924 + 9.9 KB, the comments mostly), file:// scene 13 bands errs [] frameN 302, scene 12 pool errs [] frameN 303; the crossfade 12 → 13
  greys 34.7 … 19.7 … 34.0 max step 7.66 / 255 §1.9 viol [], 13 → 0 the forced branch's revert, errs [], max step 1.96. inject.js untouched.
- **Open, carried:** **the full sweep before any tag** (the user's word; S1–S4's open lists stand) — the pen's x span and stroke per track
  (the pure ruler runs on any trace in a minute: `JR` is the one argument to change) and the tritone lifts on tracks whose harmony crosses
  the pinned key's tritone (Raindrops never does; a track in a key its chords leave would lift — the wrap is a cut by design, the sweep
  decides if it wants a fade instead); the pen on a track with NO floor (noise, silence) is nothing — correct, and not yet seen on
  Comptine's applause; `fluid-tracks.js` gained no S5 column (the pen's x span and stroke read off the pure ruler, not the replay — one line
  if S7 wants them; its `ORDER` counts `pen` as unclassified, as `dip` / `sjet`); the push stays a switch at 0 with its finding (remove it if
  the sweep agrees); the pen's y (the centroid) is barely exercised on Raindrops (y .43–.53 — the centroid sits mid-range) — a bright lead
  would lift it; a montage at 10 fps on the groove was not taken (the 1 fps groove reads nil either way).
- **S5b — the vocal feature (deferred; one extractor session, NOT this plan's; so the next session builds it in one go):** *The feature:*
  an ears stage on the PCM bus (`assets/engine/ears/`, beside the lanes): per hop a pitch estimate in 200–3000 Hz (a normalised
  autocorrelation or a cepstral peak over a ~40 ms window, the usual pitched-ness test) and its harmonic-to-noise ratio (the energy at the
  harmonics of that pitch over the rest of the band), gated by pitch CONTINUITY over ~100 ms (three hops within a semitone — a sung note
  holds, a hat does not) and by `presence`; the output eased ~.1 s. *The MS keys to add (FEATS entries, fake-timeline defaults, parity
  untouched — the parity set is the 72 v3 fields; md5 unmoved until a scene reads them):* **`voxS`** (0–1, the vocal presence — the HNR ×
  the continuity through a knee on the track's own range, §111 item 7's shape), **`voxHz`** (the pitch in Hz, −1 = none), `voxConf`
  (0–1, the estimate's confidence — optional). *The hook in inject2 (PEN_SRC 2, the reads added to FLUID_FEATS then):* the floor's ink SPLIT
  by `voxS` between the floor's cloud at the tonic (× (1 − voxS)) and the pen (× voxS) — Σ = the floor's budget, so an instrumental passage
  keeps the floor and a sung one moves it onto the pen (not `presence = voxS` in place of the floor's level, which would darken every
  instrumental track); the pen's x from `voxHz` as a pitch class on the tonic axis (`p = 12·log2(voxHz / 440) + 69`, `pc = p mod 12`, the
  fifths position `7·pc mod 12` continuous — the same `x = frac((d + 6.5) / 12)` as today, so the pen follows the melody up and down the
  circle), y from the octave (.25 + .5 · clamp(log2(voxHz / 110) / 4, 0, 1): 110–1760 Hz), the target eased and clamped as today; voxHz −1
  → the harmony's centre (today's AX 1). *The ruler:* a hand-marked vocal window on IBelongHere and WhoLikesToParty (the two library tracks
  with a voice — the plan's §3) in `windows.json` as the `test_music` ruler: `voxS` p50 inside the sung bars > 2× outside, `voxHz` within a
  semitone of the sung note on a hand-checked bar (the click render recipe, HARNESS "Hearing a truth grid"); RaindropsOnRoses's breakdown
  lead 111–137 as the third window (a lead is pitched and continuous — the feature will read it as a voice, and should). *The cost:* one
  full session — the stage (~150 lines), the three FEATS entries, the two-track ruler and its hand marks, the md5 re-base when FLUID2 reads
  it; parity untouched. *The pitfall:* the pen then draws the melody — a track with a lead synth and no voice draws it too (a pitched-ness
  test cannot tell them apart; the user must not read the pen as a vocal detector either way).
- **For S6's builder (time):** the kinds in the list are now the base's + `dip` + `sjet` + **`pen`** (and no `floor` while PEN_SRC > 0 —
  a ruler that counts `floor` frames under the band grammar counts zero; count `pen`); the band grammar's record set on `FLUID` is `heave,
  swirl, kick, mids, snare, grain, highs, pen`; the pen's state (`penN, penP, penY, penLx, penLy`) is reset on the cold frame and on
  PEN_SRC 0 — a freeze (S6's `dtSim` 0) must NOT advance the pen (its ease runs on `dt`: pass the frozen dt, or the pen keeps walking over
  frozen ink — the plan's precedence "a dtSim of 0 from the base wins" is fluid.js's multiply, the grammar still sees the wall dt); the
  replays' `FLUIDK=` is the band table with `INJECT=inject2.js`; the gates script's `scene-md5.sh` tag is a hand edit (s4 → s5 → s6); a
  stale headless Chrome from an earlier worker shares the GPU — `ps -o pid,etimes -p $(pgrep -d, -f 'chrome.*remote-debugging')` before
  any strip or gate and kill the day-old ones by pid (four were found this session, 32 h old); the 10 fps strip is the pen's cadence — a
  1 fps strip cannot show a stroke of a twentieth of the screen per beat.


### S6 — time: the solver's clock breathes with the sub, slows in the latched void, bursts on the drop (2026-10-10, branch `fluid2`, commits b5db91f → the docs; `git merge main` at d7adda5 first — S5 merged, a fast-forward)

- **The ask, as the plan framed it and the user's scope holds:** *"explore: point sources and time"* — S6 IS the time exploration; and on the
  eighth track, *"this is a good track that could play with time element (ideas modulate time -> example bass that starts at 56s -> something
  happens at 1:06 with the sound that seems like it would be good to modulate on)"*. §117 measured the two moments: the F♯1 sub PINS from 55.2 s
  (held 82–100 %), and 1:06 is a TWO-BAR SUB CUT 65.4 → 68.57 s (the 25–60 Hz band −6.8 → −39.7 dB in one 0.25 s step, the drums running,
  not a sweep, not a tempo change), then drop 2 at 68.569. The plan's letter (§4 S6): `dtSim` is the SOLVER's clock, not the grammar's — a
  multiplier on the vort and advect passes' dt; the splats, the emitters' ×60·dt, the key's evidence, the refractories, the clear's countdown
  and the shockwave's front stay on the grammar's dt (musical time). Item 2 of FLUID-DROP (the freeze + the reversal) is NOT built here —
  no freeze, no replay; the precedence for its future `dtSim 0` is written and tested. *"only tune with Raindrops, don't do full sweep"* —
  tuned, stripped and proven on RaindropsOnRoses alone (the run at 24 s, the live lanes; the file map only where a confirmed drop needs it);
  **the other seven tracks are untuned and unswept on the user's word; the full sweep is owed before any tag.**
- **As built** (`inject2.js`, the S6 block right after S1's envelopes — the pen below reads its clock): **five terms, each EXACTLY 1 at its
  neutral knob** (the byte-identical pass: x · 1 = x in fluid.js, proven below with every knob off = S5's hashes): the **BREATH** `DT_SUB` —
  1 + DT_SUB · (subEnv − subSlow): the sub's rise above its 2 s slow mean quickens the pool's time, its tail and a CUT slacken it; the
  **LEVEL** `DT_LVL` — 1 + DT_LVL · (subEnv − .5): time runs with the sub's level itself (slow while the sub is out, fast while it pins); the
  **VOID** `DT_VOID` — toward mix(1, DT_VOID, voidT) eased `DT_TAU` 1 s while the base's §111 latch holds (recomputed from the same fields —
  `buildLive` > .5 with the sub seen within VOID_BARS bars — never duplicated state) AND the sub is out (`subGate` 0) AND no clear runs: the
  gate on the sub is this step's finding — on the live lanes the detector stays armed two seconds past a return it never fired on
  (RaindropsOnRoses's drop 2: `buildLive` .68 through 68.57–70.5 with the sub back, §117's live-detector gap), and the clock must run when
  the bass does; the **DROP** `DT_DROP` — a burst on the confirmed clear's beat (`clearLeft` > 0: the §113 frame, the shockwave's): the clock
  × `DT_DROPX` 2 on the drop's frame decaying LINEARLY to 1 over the beat (accenting, never driving — the user's rule); `DT_DROP` 1 takes
  `DT_STEPS` 2 SUBSTEPS per frame at that clock (`substeps` in the return — the real thing, a second curl → dye-advect chain for one beat),
  2 the clock alone (the cheap stand-in; semi-Lagrangian is stable at any step, the ring's compressible term bounded in the shader); the
  **PULSE** `DT_BEAT` — 1 + DT_BEAT · (cos⁴(π·beatPhase) − 3/8), a zero-mean beat-synchronous tick (the judder test). The product is clamped
  [`DT_MIN` .5, `DT_MAX` 2] and SLEWED against the last frame's value (|Δ| ≤ `DT_SLEW` 8 · dt per frame: the §1.9 rule — every change eased,
  never a step; the cold frame starts AT its target, so a switch into this grammar is no jolt and a live knob change slews in). **The
  precedence** (FLUID2-PLAN §2): `composeDt(base, mine)` exported — the base's clock (none today → 1) × this grammar's, and a base **0 wins
  outright** (item 2's freeze; the grammar's bounds do not lift it). **The pen** eases on min(1, dtSim) · dt — it slows and freezes with the
  pool (S5's note: a frozen pool must not be drawn over) and never runs faster than the hand (the S5 step bound PEN_VMAX · dt holds on the
  ship run). `fluid.js`: the vort and velocity-advect `uDt` = dt · dtSim / substeps — the dye advect shares the program and INHERITS the
  uniform (it never set `uDt` itself; the dye's dissipation is the pool's time too, which is right: ink lingers in slow water, the clear's
  DROP_DISS runs faster in the burst); the curl → dye-advect chain looped `substeps` times, the splats landing once, the body / the wave
  riding every substep, the step counter counting frames (the grain's seed rides it); `benchFluid(n, S, ring, grammar, steps)` holds the
  substep count (the burst's cost at a tier); `FLUID.dtSim / substeps / time`, the HUD line `dt 0.84×2`. `harness.js`: **`&k2={…}`** on every
  page (no #test, as `&glitch=`) — the user's A/B at home; an unknown knob or bad JSON throws. `real-md5.sh HASHX=` (extra hash params: the
  neutral-knobs identity proof). The field strip's evals line carries `dtSim substeps latched breath void drop` after the pen's five. No new
  MS read (`FLUID_FEATS` unchanged; `pred*` and `dropLiveIn` not read — reactive over predicted). inject.js untouched.
- **The K2 ship table:** `DT_SUB` **.4**, `DT_LVL` **0** (a switch), `DT_VOID` **.5**, `DT_TAU` 1, `DT_DROP` **2** (`DT_DROPX` 2, `DT_STEPS` 2 for
  the switch), `DT_BEAT` **0** (a switch), `DT_SLEW` 8, `DT_MIN` .5, `DT_MAX` 2.
- **The rulers and the windows.** (1) The PURE ruler (`tools/work/fluid2/s6/ruler.js`, no GL, 60 fps on the map0 trace — 6601 frames, heard 24
  → 134 s): per window the clock's p10 / p50 / p90, min / max, its MEAN (the pool's seconds per wall-second), the largest per-frame |Δ| against
  the slew limit, the slewed / latched / substep frames, each term's span, the pen's largest step; the windows pin 52–58, cut 65.4–68.57, ret2
  68.57–70.5, groove 76–110, break 111.4–134. (2) The STRIPS (`tools/work/fluid2/s6/run.sh`; the field strip tool): **cut** at 10 fps 64–70.5 on
  the live lanes (the cut and the return — the eye's cadence for a clock that breathes), **arc** at 1 fps 50–140 on the live lanes (the pin,
  the cut, the groove, the breakdown, the return at 137.137), **drop** at 10 fps 67.5–70 on the FILE map (drop 2 is confirmed only there,
  at 68.62 — the live lanes never fire on it, §117). `tools/work/fluid2/s6/cmp.py` per shot: the velocity shot's mean speed (the S1 ruler),
  × dtSim = the DISPLACEMENT per wall-second (what the eye sees — a slowed clock dissipates less per wall-second, so the velocity itself
  READS HIGHER while the ink travels less), the composite's grey and centre grey, the §1.9 step between consecutive shots (mean |ΔY|, 0–255);
  per window the p50s and the ratio to the off run. (3) The montages `tools/accept/v0.37/fluid2-s116-s6-RaindropsOnRoses-{cut,break,drop}.jpg`
  with the clock on every frame's label (dt, ×substeps, L latched, speed, disp, grey, step).
- **The pure ruler (the live lanes):** the breath alone (DT_SUB .4): the cut **.873** mean (min .775 — the deficit is .4 × the 2 s slow mean's
  decay, deepest at the cut's start), the return **1.129** (max 1.27 — the slam), the groove **1.0007** (zero-mean: the sub's gesture, not a
  tempo), the pin .998 (it pulses per attack, p10 .947 / p90 1.068, and leans in on nothing); .8 doubles every number (the cut .746, the
  return 1.257, 66 slewed frames). The void alone (DT_VOID .5): latched on **750 of the breakdown's 1356 frames**, min .501, the break's mean
  .754; the cut's latch arms only at **67.5 s — 2.1 s into the 3.2 s cut** (the live detector's `buildLive` needs the time; the base's own deep
  void has the same lag) — so **the void cannot read the cut, the breath does**; through the return the clock rises .85 → .98 over 2 s
  (eased, no snap — the gate on the sub). The level (DT_LVL .4): the pin **1.10**, the groove **1.09**, the cut .84 flat, the break .91, all
  1.026 — a tempo change on every groove. The pulse (DT_BEAT .3): ±15 % per beat (p10 .888 / p90 1.173), zero-mean. The ship (breath + void):
  all .946 mean, 0 slewed frames, maxΔ .115 / frame (the slew limit .133 — the attack's ema at SUB_TAU .04 s is the fastest thing in the clock).
- **The strips (the live lanes, the ratio tag ÷ off per window; the off run's own speed falls .36 → .05 across the cut — the S1 field's void
  entry stills the pool, so the clock multiplies a pool that is already stilling):**

  | window | off speed / disp | ship (b.4 + v.5) | + level .4 | level .4 alone | void .5 alone | breath .8 alone |
  |---|---|---|---|---|---|---|
  | cut 65.4–68.57 (10 fps) | .228 / .228 | sp 1.086 **dp .934** dt .840 | 1.172 / **.835** / .710 | 1.085 / .900 / .844 | 1.000 / 1.000 / .965 | 1.139 / **.811** / .747 |
  | return 68.57–70.6 (10 fps) | .122 / .122 | 1.129 / **1.161** / 1.046 | 1.303 / **1.461** / 1.144 | 1.133 / 1.211 / 1.093 | .998 / .970 / .931 | 1.298 / **1.609** / 1.248 |
  | pre 64–65.4 (10 fps) | .360 / .360 | 1.010 / 1.019 / 1.018 | 1.064 / 1.218 / 1.126 | 1.077 / 1.190 / 1.104 | 1 / 1 / 1 | .983 / 1.003 / 1.036 |
  | pin 52–58 (1 fps) | .348 / .348 | 1.007 / .984 / .986 | 1.004 / 1.057 / 1.074 | — | 1 / 1 / 1 | — |
  | groove 76–110 (1 fps) | .318 / .318 | 1.007 / 1.015 / 1.004 | 1.064 / 1.142 / 1.098 | — | .984 / .984 / 1.000 | — |
  | break 111.4–137.1 (1 fps) | .059 / .059 | .967 / **.732** / .778 | 1.019 / .643 / .754 | — | .996 / .774 / .787 | — |
  | pads 118–126 (1 fps) | .049 / .049 | .948 / **.488** / .565 | .974 / .487 / .521 | — | .976 / .502 / .563 | — |
  | outro 127–137 (1 fps) | .230 / .230 | 1.174 / 1.261 / .936 | 1.338 / 1.280 / .994 | — | .912 / .906 / .902 | — |
  | return 3 137.1–140.5 (1 fps) | .207 / .207 | 1.143 / **1.205** / 1.050 | 1.258 / 1.457 / 1.168 | — | 1 / 1 / 1 | — |

  (each cell: speed ratio / displacement ratio / the clock's mean on the window.) The §1.9 step: the composite's mean |ΔY| per 0.1 s runs 16 →
  6 across the cut under every variant (the pool going still) with no spike from the clock; the one spike is the drop's own FX flash at 68.6
  (95–97 / 255 on the off run and on every variant alike — the picture's, not the pool's); at 1 fps the steps per window sit within ±1 of the
  off run's on every variant. **The drop (the file map, drop 2 confirmed 68.62):** the burst's clock .87 → **1.67** on the frame after (slewed;
  1.89 with DT_SLEW 1e9) → 1.37 → 1.12 → 1.01 by +0.5 s — within the beat; the displacement **1.39× (DT_DROP 1) / 1.74× (DT_DROP 2)** over the
  burst's five shots (the substep variant's velocity reads 1.016× the off run's, the clock-alone's 1.10× — two half-steps and one double step are
  not the same advection, as the plan said); **the centre grey at +0.4 s: off 25.3, DT_DROP 1 25.0, DT_DROP 2 25.0, the hard onsets 25.0** —
  within the plan's 10 % rule (−1 %), **the cheaper ships (2)**; the §1.9 step at the drop's frame 95.3 / 255 under every variant (the clear +
  the FX flash; the burst's own share +1 at 68.7); at 10 fps the four rows are ONE picture — the burst is a number on an emptied pool, not a
  look (the clear empties it, the ring's front is grammar time). The bench prices the honest variant: the burst ×2 **+.51 ms** at tier 3 (the
  plan's +0.6–0.7 budget — a second chain), so DT_DROP 1 stays the switch for the eye that wants the real thing.
- **The eye (the montages at 0.5 s / 0.1 s / 2 s):** across the cut the seven rows are the same picture frame for frame at this cadence — the
  difference is in the displacement numbers (−7 % on the cut, +16 % on the return for the ship; −17 / +46 % with the level) and shows in the
  return's spread by 69.5–70.5 (the ship's ink spreads wider than the off run's); through the pads the ship's ink sits more compact (half the
  displacement) and the breakdown's picture reads calmer; the drop rows are one picture. **The planner's risk stands: a dt that breathes can
  read as framerate wobble rather than music, and the montage cannot judge it — only the user's eye in track time can.** What the eye should
  see on `#scene=13` with RaindropsOnRoses: **at 56 s** the pool's time pulsing with each sub attack (±5–7 % per beat — the breath; with
  `DT_LVL` .4 the whole pinned passage runs a tenth faster); **at 65.4–68.57** the ink's travel slackening to ~.84 of its pace while the low
  end is out — the pool holding its breath on top of its own stilling — and **at 68.57** running again at 1.1–1.2× for two seconds (the slam);
  **at 111–137** the pads at half time (the latched void); **at 137.1** the return's clock 1.2× (the live lanes; on the file map the drop's burst
  rides the clear). Whether that reads as the music or as a wobble is the remark to make in track time.
- **The ship decision per knob:** the breath **ships** (zero-mean, the plan's K2, the cut and the return read on both rulers, the §1.9 rule
  holds: 0 slewed frames, the strips' steps the off run's); the void **ships** (the breakdown at .75–.78, the pads at half time, the return
  eased — gated on the sub out, this step's fix); the drop **ships as the clock alone (2)** by the 10 % rule; the level **stays a switch at 0**
  (it is a tempo change on every groove — +9–14 % — and the user's reading of "faster when it pins" may want it: the A/B is one URL); the pulse
  **stays a switch at 0** (a ±15 % tick per beat is the judder test, not a ship). **The A/B URLs for the user** (scene 13, RaindropsOnRoses, the
  live page; `&k2=` takes the JSON as is — Chrome accepts the braces and quotes in a hash; `%7B%22DT_SUB%22%3A0%7D` is the same encoded):
  the ship `https://retinarave.com/#scene=13` · the clock OFF `#scene=13&k2={"DT_SUB":0,"DT_VOID":1,"DT_DROP":0}` · the breath alone
  `#scene=13&k2={"DT_VOID":1,"DT_DROP":0}` · the breath doubled `#scene=13&k2={"DT_SUB":0.8}` · with the level `#scene=13&k2={"DT_LVL":0.4}` ·
  the level alone `#scene=13&k2={"DT_SUB":0,"DT_VOID":1,"DT_LVL":0.4}` · the void alone `#scene=13&k2={"DT_SUB":0}` · the honest drop
  `#scene=13&k2={"DT_DROP":1}` · the pulse `#scene=13&k2={"DT_BEAT":0.3}` · a hard clock (no slew) `#scene=13&k2={"DT_SLEW":1e9}` · the
  pads frozen (the plan's extreme, not a ship) `#scene=13&k2={"DT_VOID":0,"DT_MIN":0}`. Under `#test` the same `&k2=` works on the harness's
  file page (`test&track=RaindropsOnRoses&at=24&scene=13&k2=…`); live, `CARD.fluid.K2.DT_SUB = 0` from the console slews in on the next frame.
- **The gates (RaindropsOnRoses-filtered; `tools/work/fluid2/s6/gates.sh`, the log `gates.log`; each with its wall time):** `node tools/check.js` 183 modules · 0 fail · 9 warn (the standing soft caps);
  `npm test` exit 0 — test_fluid **442 ok 0 fail** (S6's 19 cases in the bands block), test_music 151 ok (24 s); `node tools/license.js --check` 186 public
  files, 0 without the header (the rulers live in tools/work); **SCENES=13 real-md5 Raindrops ×2: 8 / 8 cmp-equal (69 s + 69 s)**, all 8 moved against
  S5's (the clock on every frame) → re-based into `real-md5-v037.txt` (8 lines, the other 322 untouched); **the NEUTRAL knobs (`HASHX='&k2={"DT_SUB":0,
  "DT_VOID":1,"DT_DROP":0}'`, 69 s): 8 / 8 = S5's hashes to the byte** — the byte-identical pass (a first neutral run with DT_DROP left at 2 moved
  exactly one line, the file map's groove window after drop 2's burst, 7 / 8 — the burst is real and the proof names it); **SCENES=12 real-md5
  Raindrops: 8 / 8 = v036 (70 s)** — the pool grammar returns no clock, the step the §104 pass (`dts = dt · 1 / 1`); **the roster 0 1 3 Raindrops:
  24 / 24 = v037 (207 s)**, differ [], new []; **real-rulers s13 Raindrops 56–116: 1 / 1 ok (66 s)** — 600 frames, jump viol 0 max .060 (S5's .058),
  mon viol 0 max .0161, black 0, clip25 0, medY .193 — the clock's every change under the §1.9 rule on the 56–116 window (the pin, the cut, the
  return, the groove); **scene-md5 fake: 26 = v035 (s13's pair aside), errs [] on 14 ids (212 s)**; s12's pair unmoved (3e483039 / 2274bb4e = v035),
  s13's pair re-recorded 0e92a1c4 / ed3283fc (S5's 9a67af34 / fb6a5d6f — the breath on the fake's `sub`); **parity fake: max |diff| 7.852214593751443
  over 72 fields, the §102 nav.* line to the digit (51 s)**; **the substrate bench** (one page test&scene=12, q .95 pinned, twice — before the gates at
  load 2.5 and after at load 4.4): pool / bands ship (the clock on) / bands NEUTRAL (DT_SUB 0, DT_VOID 1) / bands BURST (the substep count held at 2)
  ×3 = .547 / .684 / .632 / 1.059 · .552 / .521 / .512 / .917 · .542 / .524 / .582 / 1.100, then .647 / .683 / .711 / 1.151 · .659 / .711 / .721 / 1.141 ·
  .680 / .725 / .704 / 1.132 — **medians (the two runs) ship .524 / .711 vs neutral .582 / .711 vs pool .547 / .659: the clock is a uniform value (ship −
  neutral −.058 / 0, inside the quads' own spread; the first quad of each run is the GPU clock's ramp, S4's note); the burst +.51 / +.43 ms over the
  ship — the plan's +0.6–0.7 budget for a second chain, paid only while DT_DROP 1 runs a clear**; the show pass bench(13) .390 / .418, bench(12) .385
  / .405, bench(0) 1.378 / 1.526; tier 3, sim 259×128, dye 1035×512; **MOBILE=1 scene 13 tier 0 alive** (errs [] bad [] frameN 242, dt .987 on the
  fake — the breath live; benchFluid bands ship .480 / .518, neutral .482 / .502, burst ×2 .768 / .707, pool .464 / .420 — the burst +.29 / +.19 at tier 0,
  over the .4 budget while it runs: the honest variant is a desktop switch, the shipped clock-alone costs tier 0 nothing; show13 .469 / .455, show12
  .396 / .369); `npm run build` 182 modules **1 862 682 bytes** (S5's 1 851 843 + 10.8 KB, the comments mostly), file:// scene 13 bands errs [] frameN
  302, scene 12 pool errs [] frameN 302; the crossfade 12 → 13 max step 7.51 / 255 §1.9 viol [], 13 → 0 max step 2.0 viol []. inject.js untouched.
- **Open, carried:** **the full sweep before any tag** (the user's word; S1–S5's open lists stand) — the clock on the other seven: the breath's
  numbers depend on SUB_TAU / SUB_SLOW's reading of each track's sub (a sub that never cuts breathes only per beat; Comptine's piano reads .4
  on the 25–60 Hz band with no sub — its clock will pulse on low piano notes, as its heave does at SUB_GATE 0), the void's latch per track
  (SeeYouDrop's build 47–57, Vienna's dream 64–86 — the plan's own windows), the drop's burst on the ELEVEN confirmed drops (§113's table —
  the 10 % rule re-read on each; the fake timeline has no drop); the pure ruler runs on any trace in a minute (`JR` is the one line). The eye
  in track time (the planner's risk) — not measurable here. The void cannot read a sub cut on the live lanes (the detector's lag; the file
  map's `mapDropEvt` confirms the drop but no map field says "the sub is cut" — a `subAge`-based void term (the sub gone ≥ N beats, no detector)
  is one line if the eye wants the cut read as a void rather than as the breath). `DT_LVL` as a tempo: if the user likes it, its mean must be
  re-centred (subEnv's track mean, the §111 item-7 shape) so a groove runs at 1. The substep variant's velocity reads 8 % under the clock-alone's
  at the burst — if item 2's reversal wants the honest integrator, DT_DROP 1 is there at +.5 ms for one beat. `fluid-tracks.js` gained no S6
  column (the clock's per-window mean reads off the pure ruler). The dye advect inheriting `uDt` from the velocity pass is a fact of the
  program's uniform state, not a line of code — a future pass order change must set it.
- **For S7's builder (the seven-track tune):** the return's record is `heave, swirl, kick, mids, snare, grain, highs, pen, dtSim, substeps, time`;
  the knobs that change the pixels on every frame are DT_SUB and DT_VOID (the s13 md5s moved on all 8 Raindrops lines; the neutral set
  `{"DT_SUB":0,"DT_VOID":1}` is S5's hashes to the byte — `HASHX=` on real-md5.sh proves a knob set's identity without editing K2); the strips'
  displacement column is speed × dtSim (the velocity alone misreads a slowed clock as a faster pool); the drop strips must run `MAP=1` on
  RaindropsOnRoses (the live lanes never confirm drops 1 / 2); the gates script's `scene-md5.sh` tag is a hand edit (s5 → s6 → s7); the
  bench's burst reads through `CARD.benchFluid(300, null, 'bands', 2)` (the wrapper forwards the hold since this step); `&k2=` is the user's
  switchboard — every K2 knob, not only S6's.

### S7 — the close on RaindropsOnRoses: the arc, the table, the fade finding, the gates, the docs (2026-10-10, branch `fluid2`, commits after ce5ab6f; `git merge main` at ce5ab6f first — S6 merged, a fast-forward)

- **The scope, as the user's words set it.** The plan's S7 was the seven-track tune; the user's *"only tune with Raindrops, don't do full sweep"*
  makes S7 the CLOSE on RaindropsOnRoses — the arc proof for the eye, the per-track table's band columns (so the sweep has its ruler), the S0
  finding measured again, the gates one last time on the merged branch, the docs. **No tag (the user tags), no push, inject.js untouched.
  The eight-track sweep is owed before any tag** — the first thing in NEXT-SESSION-PROMPT.
- **What FLUID2 is now (the one paragraph).** Scene 13 is FLUID's pool (the same dye, the same base state, the §111 machinery warm across the
  switch) under a second grammar in which each band is a different KIND of coupling, each with the K2 that ships: the **sub a FIELD** — the pool's
  weight: a body force on every texel from the sub envelope's rise above its slow mean, WITH the breath (`HEAVE .6 · HEAVE_DC .15`; the dot's
  push gone, its ink a cloud `SUB_RAD 3`); the **kick a MASS that travels** — a vortex pair seeded inward at the bass note's place at the base's
  impulse and ink (`KICK_SHAPE 3 · DIP_V 1.2 · DIP_D .03`), a third of the screen per beat; the **mids the MATERIAL** — the vorticity confinement
  from the mid band's place in the track's own last 30 s (`CURL_SRC 1`: 10 + 40 · pos) and the snare ONE jet from a hair in from a wall
  (`SNARE_JET 1 · SNARE_X .12`); the **highs the SURFACE** — a hashed grain on the velocity advect pass (`NOISE_V 1` at a 4-texel cell held 4
  steps), a dye dip per hat (`DIP_SRC 1 · HI_SHARP .3`), the light from `highS` (display); the **voice a PEN** — the harmony's angle drawn on the
  tonic axis in place of the floor cloud (`PEN_SRC 1 · PEN_AX 1 · PEN_V 0`: it draws, it injects no mass; the vocal feature S5b owed); **TIME the
  solver's own clock** — `dtSim` on the vort / advect passes: the breath (`DT_SUB .4`), the latched void at half time (`DT_VOID .5`, gated on the
  sub out), the drop's burst as the clock alone (`DT_DROP 2`); `DT_LVL`, `DT_BEAT`, `SWIRL`, `FLIP`, `CURL_MASK`, `JIT_V`, `DT_DROP 1` the
  switches left at 0 with their numbers in S1–S6. The per-step deviations from the plan's letter are the status table at the top of FLUID2-PLAN.
- **The arc strip (the proof for the eye; `tools/work/fluid2/s7/run.sh`, PORT 8978, ONE deterministic run per scene × map mode, 135 shots each
  at 10 fps in twelve windows — `WINS=` on `fluid-field-strip.sh`, this step's tool change; the first attempt died silent: 135 × the inline evals
  line passed Linux's 128 KB single-argument limit, so the line is one page-side helper now).** The montages: **`tools/accept/v0.37/fluid2-s116-s7-
  RaindropsOnRoses-arc.jpg`** (the LIVE lanes, `&map=0` — the design target) and **`-arc-map1.jpg`** (the file map), each four rows on the same 34
  shots — FLUID composite, FLUID2 composite, FLUID velocity, FLUID2 velocity — with t, sub, the clock (L = the void latched), heave, curl, grain,
  the pen's x and the grey on every FLUID2 label. `cmp.py` the numbers per window (the S1 speed off the velocity shot; the DISPLACEMENT = speed ×
  dtSim — S6's rule; the composite's grey and centre grey; the §1.9 step max between consecutive 0.1 s shots). **The live lanes (FLUID → FLUID2):**

  | window | FLUID speed · grey · centre · step | FLUID2 speed · DISP · grey · centre · step | disp ÷ FLUID | FLUID2 clock p50 (min–max) · latched % | heave · curl · grain · pen span · sub |
  |---|---|---|---|---|---|
  | 24 the mix opens | .018 · 21.5 · 40.6 · 3.2 | .027 · .026 · 18.0 · 40.2 · 5.1 | 1.48 | .979 (.89–1.02) · 0 | −.026 · 23 · .29 · .07 · .85 |
  | 27.4 the 808 | .074 · 25.4 · 47.2 · 3.8 | .048 · .047 · 25.6 · 62.3 · 4.3 | .64 | .909 (.83–1.16) · 0 | .000 · 31 · .21 · .03 · .41 |
  | 41.1 drop 1 | .180 · 60.1 · 81.8 · 70.3 | .252 · .275 · 58.8 · 80.0 · 70.6 | 1.53 | 1.155 (.93–1.27) · 0 | −.147 · 20 · .57 · .12 · .50 |
  | 55–57 the pin | .168 · 56.0 · 108.1 · 13.3 | .359 · .354 · 55.9 · 71.7 · 17.7 | 2.11 | .960 (.95–1.07) · 0 | −.079 · 34 · .47 · .21 · .72 |
  | 65.4–68.57 the cut | .155 · 48.7 · 80.2 · 11.8 | .246 · .212 · 50.0 · 60.8 · 17.3 | 1.36 | .840 (.77–1.07) · 29 | +.120 · 16 · .31 · .11 · .15 |
  | 68.57–69 the return | .056 · 68.9 · 93.8 · 97.1 | .113 · .118 · 69.7 · 92.5 · 96.1 | 2.09 | 1.058 (.92–1.09) · 20 | −.244 · 23 · .23 · .04 · .84 |
  | 84 the groove | .179 · 57.0 · 122.3 · 12.0 | .336 · .328 · 57.7 · 74.7 · 17.3 | 1.84 | .961 (.96–1.06) · 0 | −.063 · 14 · .40 · .00 · .69 |
  | 111 the breakdown | .032 · 39.3 · 65.1 · 2.4 | .058 · .059 · 37.3 · 37.4 · 3.5 | 1.86 | 1.031 (.97–1.04) · 0 | −.138 · 10 · .14 · .01 · .85 |
  | 118 the pads | .035 · 28.1 · 69.7 · 2.6 | .043 · .026 · 30.2 · 73.4 · 3.1 | .74 | .600 (.59–.61) · 100 | +.009 · 45 · .19 · .02 · .02 |
  | 126 the pads | .071 · 37.6 · 70.2 · 5.8 | .063 · .045 · 38.6 · 61.9 · 5.0 | .63 | .728 (.68–.75) · 100 | −.082 · 48 · .39 · .04 · .30 |
  | 134 late | .157 · 39.4 · 96.8 · 8.1 | .465 · .494 · 41.7 · 52.9 · 14.7 | 3.15 | 1.067 (1.04–1.07) · 0 | −.198 · 50 · .55 · .06 · .98 |
  | 136.8–137.1 before drop 3 | .049 · 36.8 · 107.2 · 3.0 | .167 · .154 · 38.3 · 41.4 · 6.4 | 3.18 | .943 (.88–.99) · 0 | +.041 · 47 · .63 · .01 · .41 |
  | 137.1–138.4 drop 3 | .077 · 50.6 · 103.8 · 76.9 | .200 · .208 · 50.9 · 52.1 · 75.5 | 2.70 | 1.031 (.98–1.15) · 0 | −.158 · 29 · .56 · .13 · .72 |
  | 180 the outro | .135 · 51.6 · 129.6 · 9.9 | .172 · .170 · 49.4 · 75.2 · 12.7 | 1.26 | .970 (.97–1.07) · 0 | −.075 · 29 · .53 · .04 · .69 |

  **The file map, where it differs** (the same windows, FLUID2's clock column): drop 1 **1.187 (.93–2.00)**, the return 68.57–69 **1.371
  (.87–1.67)**, drop 3 **1.060 (.98–1.98)** — the three bursts on the confirmed clears; the displacement ratios drop 1 2.12, the cut 1.92, the
  return 1.96, the pin 2.30, the groove 1.77, 134 5.02, before drop 3 4.03, drop 3 2.28; the step max at the drops 76–81 (the clear + the FX
  flash, both scenes alike, as S6 found); the pads' displacement .53 / .74 of FLUID's. **The one number that reads the whole table: FLUID2's pool
  moves 1.4–3.2× FLUID's displacement on every passage with a sub (the field, the pair, the mids' confinement), at the SAME whole-frame grey
  (±2 of FLUID's on every window — the ink budget holds: the governor's factor 1.0 / 1.0 on both) and a LOWER centre grey (72–75 against 108–130
  on the pin / the groove / the outro: FLUID's ink gathers at its emitter, FLUID2's travels) — and .63–.74× through the pads under the latched
  clock.** The §1.9 steps: FLUID2's 14–18 on the grooves against FLUID's 12–13 (a faster pool changes more per 0.1 s), the drops' 70–97 the
  flash's on both. The 808's entry at 27.4 is the one window FLUID2 reads SLOWER (.64): the base's kick impulse is split across the pair and the
  first hits land on a still pool — the pair needs a beat to roll up.
- **Live vs file on this track (what the eye must know before judging):** the live detector never confirms Raindrops' drops 1 and 2 (§117: the
  sub cuts leave no "bass came back" edge) and not drop 3 either on this run — the live lanes carry NO clear and NO shockwave and NO clock burst at
  41.1 / 68.57 / 137.1 (the montage: at 68.8 and 137.3 the live rows keep their ink where the file rows show the ring on an emptied pool); only the
  composite's flash fires on both (the engine's drop FX, the step 70–97 on both scenes). The live clock reads the cut as the BREATH (.84, the
  void latching only 29 % of the cut's shots — 2.1 s in, S6's finding) and the return as 1.06–1.09; the file clock bursts to 1.67–2.00. The one
  live clear in the table is 129.55 (the breakdown's late sub, a false one). So at home on the live page the user sees the field, the pair,
  the mids, the grain, the pen and the breath / the void — not the burst; the burst is a file-mode thing on this track until `engine/build`
  reads a sub cut.
- **The eye (the orchestrator's, on the montages — the user's in track time decides):** (1) **the ink ROLLS**: on every groove FLUID2's ink gathers
  into whorls with cores (the pair's vortices — 67.4, 84.0, 134, 180) where FLUID's is a shredded texture of flakes; (2) **the velocity lives on
  the whole frame**: FLUID2's velocity row is a frame-wide field with the grain's dapple and the pin's / the late breakdown's swirl (55–57, 134),
  FLUID's a few islands at the emitters; (3) **the breakdown is calmer and drawn**: under the latched clock the pads' ink sits compact, and the
  pen's row of marks runs across the width at 126 (the harmony's line) where FLUID's floor is a cloud; (4) the drops are the same gesture on the
  file map (the flash, the ring, the emptied centre) and the pool keeps its ink on the live lanes; (5) 24–27.8 the two are nearly one picture
  (the 808's first hits — the pair takes a beat).
- **The pad take** (`tools/rec-strip.sh tools/work/fluid-diag/music/rec.wav s7-pad-s13 0 24 2 13`, 49 shots, errs [], the grey line
  `tools/work/rec/s7-pad-s13/grey.txt`): against FLUID's (S1's `s1-pad-s12`, the pool grammar unmoved since) the mean reads **3.0 grey under
  on average, −5.7 at most (3–9 s)** — the pen in place of the floor cloud is a thinner mark — the same shape (16 → 18 → 21 → 23 → 25 → 23 against
  16 → 22 → 23 → 25 → 27 → 27), the p99s alike (51–101 against 50–97); 0 silent-with-sound seconds (the §108 ruler green).
- **The per-track table's band columns** (`tools/fluid-tracks.js`, no GL: `INJECT=assets/core/fluid/inject2.js node tools/fluid-tracks.js`, 3.5 s
  for all eight tracks × both modes + the pad): since S7 the `bands` column — the kick's shape / frames / impulse p50 / p90, the snare's kind /
  frames, the curl's p10 / p50 / p90 and the mask, the grain's p50 / p90 and the dip's share, the pen's share / x p10–p90 (span) / step p50 / max,
  the clock's p10 / p50 / p90 / min / max, the latched share, the burst and slewed frames. **RaindropsOnRoses (the tuned track), live / file:** kick
  shape 3 · 318 / 304 frames · impulse .0015 / .0014; snare harm · 1237 / 1152; curl 14 / 31 / 49 · mask off; grain .413 / .592 · dip 12 %; pen
  100 % · x .34–.60 (span .27) · step .0014 / .0083 (= PEN_VMAX · dt exactly, the clamp active); the clock .703 / .981 / 1.085 (min .50, max 1.90)
  live, .749 / .982 / 1.087 (min .50, max 2.00) file; latched 12 / 11 %; burst 26 / 78 frames; slewed 6 / 20. **The seven untuned (measured only,
  live mode; the file mode alike but for the bursts):** the clock sits at **1 to the digit on CyborgNinja, Comptine, Malicious** (no sub cut, no
  latched void on their traces — the breath needs a sub that moves); SeeYouDrop p10 .992 / min .53 / max 1.33 / latched 5 % / burst 49; Vienna .998 /
  .50 / 1.09 / 5 % / 41; IBelongHere .844 / .50 / 1.80 / 10 % / 31 (155 on the file map — its five clears); WhoLikesToParty .999 / .79 / 1.67 / 2 % /
  93; the grain's p50 **.75 SeeYouDrop / .79 CyborgNinja / .62 Malicious / .59 WhoLikesToParty / .56 Vienna / .48 IBelongHere / .26 Comptine**
  against Raindrops' .41 — the first knob the sweep must re-read (`HI_SRC` 1, the own range, is the switch); the curl p50 27–35 everywhere (Raindrops
  31); the pen's span .12 Vienna / Comptine to .37 CyborgNinja (Raindrops .27); the pad: curl 46, the pen's span .36, the clock .92–1.29. The
  table is the receipt's; the sweep reads it first.
- **The S0 finding, measured again — and re-rooted.** The mixs fade 12 → 13 on SeeYouDrop's groove (`tools/work/s0-fade.sh`): the grey row
  **34.7 36.3 36.5 36.9 37.0 36.1 28.6 21.2 19.5 22.2 23.8 25.6 27.4 30.0 31.4 32.3 32.4 33.9** — max step 7.51 / 255, §1.9 viol [], the dip to
  19.5 at the fade's middle exactly as at S0. The one-line fix the S0 note proposed — FLUID2's exposure at the frame's light on its first on-screen
  frame (`U.expo = cold ? P.light : ema(…)`, `cold` = no update for 0.5 s) — **lands and does NOT touch the dip**: the row after it 34.7 36.2 36.4
  36.9 37.0 36.1 **28.6 21.2 19.5** … identical to the digit from the seventh shot, because (the probe `CARD.REG[13].scene.hooks.flinfo()` per frame
  through the fade) **both scenes' exposure is already equal through the fade** — f301 13: .7857 / 12: .7830, f348 .802 / .802 — and FLUID's show
  pass carries no on-screen weight (`uLook` is expo / spec / relief / idle; `U.vis` gates only the sparkle). S0's reading was wrong: a cold `U.expo`
  of 1 above the groove's .78 would have made the incoming BRIGHTER, not darker. The dip is in the crossfade path of two pictures of ONE pool
  (`transitions/mixs.js`'s luminance-keyed wipe, or the chain's compositing of two fluid scenes — not read here); it is NOT in the scene (13 → 0
  reads flat 32–34, the `n` key is a hard cut with no fade, the director never fades to 13). **Left open with the number: 37 → 19.5 → 34 over 1.6 s
  on `&trans=mixs` 12 → 13 — for whoever puts FLUID2 on a fade.** The fix STAYS for what it does measure: the HARD cut 12 → 13 (`goScene(13, true)`,
  the `n` key's path; `tools/work/fluid2/s7/hardcut.sh`, a shot every frame f298–f312): before it FLUID2's first frame ran at expo .972 easing to
  .823 by f312 (`EXPOTC` .12 s) — the grey 34.7 → **36.8** (+2.1) then 37.2 → 34.6 drifting down over 13 frames (a blink); after it the first frame
  is AT FLUID's light (.7853 against .7822) — the grey 34.7 → 32.8 (−2.0: FLUID2's own picture under its tighter highlight) and flat within .3 after.
  The cold frame at its target is the §1.9 rule's own exception; the s13 md5s (f602+) and the fake pair (f360 / f840) cannot move for it.
- **The gates, one last time on the merged branch (RaindropsOnRoses-filtered; `tools/work/fluid2/s7/gates.sh` → `gates.log`, PORT 8975, one Chrome;
  the receipt `tools/accept/v0.37/fluid2-s116-s7.txt`; each with its wall time):** `node tools/check.js` **183 modules · 0 fail · 9 warn** (3 s; the standing
  soft caps); `npm test` **exit 0** — test_fluid **442 ok 0 fail**, test_music 151 ok (24 s); `node tools/license.js --check` **186 public files, 0
  without the header** (no new public file: the montages are images, the S7 scripts live in tools/work); **SCENES=13 real-md5 Raindrops ×2: 8 / 8
  cmp-equal (69 + 69 s) = `real-md5-v037.txt` 8 / 8 unmoved** — S6's re-base stands, no re-base at S7 (the exposure fix lands before f602; the code
  on the pool is S6's); **the NEUTRAL knobs (`HASHX='&k2={"DT_SUB":0,"DT_VOID":1,"DT_DROP":0}'`, 69 s): 8 / 8 = S5's hashes to the byte** (v037 as
  committed at f8e5fae, before S6's re-base — the clock's identity pass holds on the merged tree); **SCENES=12 Raindrops: 8 / 8 = v036 (69 s)** — the
  switch is free, proven at the end as at S0; **the roster 0 1 3 Raindrops: 24 / 24 = v037 (207 s)**, differ [], new []; **real-rulers s13 Raindrops
  56–116: 1 / 1 ok (66 s)** — 600 frames, jump viol 0 max .060, mon viol 0 max .0161, black 0, clip25 0, medY .193 — S6's row to the digit; **the
  fake `scene-md5.sh`: 26 = v035, errs [] on 14 ids (213 s)**, s12's pair unmoved (3e483039 / 2274bb4e), **s13's pair 0e92a1c4 / ed3283fc = S6's to
  the byte** (the fix cannot reach f360); **parity fake: max |diff| 7.852214593751443 over 72 fields, the §102 nav.* line to the digit (50 s)**; **the
  substrate bench** (one page test&scene=12, q .95 pinned, 8 s warm, a cold call discarded, load 2.65): pool / bands ship / bands NEUTRAL / bands
  BURST ×3 = .884 / .857 / .834 / 1.302 · .774 / .776 / .729 / 1.287 · .736 / .732 / .787 / 1.210 — **medians pool .774, ship .776, neutral .787, the burst
  1.287 (+.51 over the ship: S6's +.51 / +.43)**; the clock a uniform value (ship − neutral −.011); show13 .412, show12 .399, nav 1.392; tier 3, sim
  259×128, dye 1035×512; **MOBILE=1 scene 13 tier 0 alive** (errs [] bad [] frameN 242, dt .994 on the fake; bands ship .412, neutral .436, burst
  ×2 .672, pool .397, show13 .440, show12 .384 — the ship inside the .4 budget to the hundredth, the burst over it while it runs, as S6 said);
  `npm run build` 182 modules **1 863 210 bytes** (S6's 1 862 682 + 528: the fix and its comment), file:// scene 13 bands errs [] frameN 303, scene 12
  pool errs [] frameN 302, VER 0.36.0 (no bump: the user tags); the crossfade 12 → 13 max step 7.51 / 255 §1.9 viol [] (the dip above, open), 13 → 0
  max step 2.0 viol []. inject.js untouched. The parity run's rewrite of `tools/accept/v0.5/ew-t*.jpg` checked out before the commit.
- **The A/B URLs in one list (scene 13, RaindropsOnRoses from 24 s; `&k2=` takes the JSON as is on any page; under `#test` the same on the
  harness's file page `test&track=RaindropsOnRoses&at=24&scene=13&k2=…`):** the ship `#scene=13` · **the bands one at a time back to FLUID's:** the
  sub's field off `#scene=13&k2={"HEAVE":0,"HEAVE_DC":0,"SUB_INK":1,"SUB_RAD":1}` (the dot's push stays gone: `SUB_INK` / `SUB_RAD` are the cloud) ·
  the kick as FLUID's splat `#scene=13&k2={"KICK_SHAPE":0}` · the jet `{"KICK_SHAPE":1}` · the stroke `{"KICK_SHAPE":2}` · the puff `{"KICK_SHAPE":4}` ·
  the mids on tension `{"CURL_SRC":0}` · the mask `{"CURL_MASK":1}` · the snare as the pair `{"SNARE_JET":0}` · the grain off `{"NOISE_V":0}` · the dip
  off `{"DIP_SRC":0}` · the dye jitter `{"JIT_V":1}` · the pen off (the floor cloud) `{"PEN_SRC":0}` · the pen pushing `{"PEN_V":0.25}` · **the time:**
  the clock OFF `{"DT_SUB":0,"DT_VOID":1,"DT_DROP":0}` · the breath alone `{"DT_VOID":1,"DT_DROP":0}` · the breath doubled `{"DT_SUB":0.8}` · with the
  level `{"DT_LVL":0.4}` · the void alone `{"DT_SUB":0}` · the honest drop `{"DT_DROP":1}` · the pulse `{"DT_BEAT":0.3}` · a hard clock `{"DT_SLEW":1e9}`
  · the pads frozen `{"DT_VOID":0,"DT_MIN":0}` · the swirl `{"SWIRL":0.8}` · the bar flip `{"FLIP":1}`. Live, `CARD.fluid.K2.<KNOB> = x` from the
  console takes effect on the next step (the clock slews in).
- **What the user validates at home (every remark in track time is a retune request):** `#scene=13` on **RaindropsOnRoses from 24 s** — the
  references `tools/accept/v0.37/fluid2-s116-s7-RaindropsOnRoses-arc.jpg` (the live lanes — the page at home) and `-arc-map1.jpg` (the file map):
  **27.4** the 808 enters — the pool heaves under it and the first kicks launch pairs (a beat late to roll up: the one slower window); **41.1** drop 1
  — the flash; on the file map the clear, the ring and the clock's burst; on the live page none of the three (the detector's miss — not a retune of
  the grammar); **55–57** the sub pins — the breath per attack (±5–7 %), the whole pool in motion (2.1× FLUID's displacement), the centre no brighter
  than the rest; **65.4–68.57** the two-bar cut — the ink's travel slackens to ~.84 while the low end is out, the whorls hold their shape, and at
  **68.57** the return slams (the heave −.24) and the clock runs 1.06–1.09 (live) — *does the slackening read as the music or as a framerate
  wobble?* (the planner's risk; the montage cannot judge it); **84** the groove — every kick a pair that rolls across, every snare a burst from a
  wall, the ink in whorls not flakes (1.84×); **111–137** the breakdown — the pen's marks in a row across the width (the chords), the pads at half
  time (.60 / .73: the ink compact), then at **134** the late sub swings the whole pool (3.15×); **137.1** drop 3 — the flash; the burst on the file
  map only; **180+** the outro (1.26×). The time switches: the clock OFF against the ship, then the breath doubled, then the level. The switch itself:
  `n` from FLUID to FLUID2 mid-groove — the pool must not blink (the hard cut measured: 34.7 → 32.8 then flat). NOT asked yet: FLUID2 on the bid
  (forced-only), a landing tile, the vocal pen as a voice (it is the harmony until S5b), the other seven tracks (unswept).
- **Owed (carried, not hidden):** **the eight-track sweep before any tag** (the per-track table above is its ruler — the grain's p50 per track first,
  the breath on tracks whose sub never cuts, the void on SeeYouDrop's build 47–57 and Vienna's dream 64–86, the burst on the eleven confirmed drops
  of §113, the pen on Comptine and IBelongHere; then the full `SCENES=13` references, 58 lines + 8 rulers rows, and the per-track montages) ·
  **S5b the vocal feature** (`voxS / voxHz / voxConf`, one extractor session; `PEN_SRC 2` reserved) · **FLUID-DROP item 2** (the reversal — `composeDt`'s
  base-0 precedence and the pen's gate written for it in FLUID-DROP-SESSION-PROMPT) · **the tier-0 phone measure** of the whole band grammar on a
  real phone (the MOBILE=1 canvas is the proxy) · **the switches at 0 with their numbers** (`SWIRL`, `FLIP`, `CURL_MASK`, `JIT_V`, `PEN_V`, `DT_LVL` .4 =
  +9–14 % on every groove, `DT_BEAT` .3 = a ±15 % tick, `DT_DROP` 1 = the substeps at +.5 ms for one beat) · **the live detector's miss on Raindrops'
  drops 1 / 2 / 3** (`engine/build`: a sub cut leaves no "bass came back" edge — a `subAge`-based void term is one line if the eye wants the cut read as
  a void) · **the mixs fade's mid-dip into FLUID2** (37 → 19.5 → 34, re-rooted above: the crossfade path, not the scene) · `fluid-tracks.js`'s base
  channel column reads the kick as 0 s under the band grammar (the pair's splats are `dip`, not `kick` — the bands column carries them) · §115's own
  list (`DROP_DISS` 6 after item 2, the idle bench, IBelongHere's late live return, Vienna's bar 40, the director's per-track sweep).
- **The docs:** DECISIONS §116 this section; CONTRACTS §1.1 (the Raindrops-only exception named beside the every-track rule), §4 (id 13's line: S1–S6
  built, S7 closed, the sweep owed, `&k2=` the switchboard); HARNESS "## Fluid" (the FLUID2 recipe in one place: the switches, the neutral set,
  `HASHX=`, the rulers per step, the arc strip's `WINS=`, the no-GL table's bands column, the Raindrops-only state); site/about.html (FLUID2's line);
  FLUID2-PLAN.md (the status block at the top: S0–S7 with the decision and the deviation per step); NEXT-SESSION-PROMPT.md (the post-build truth:
  built, not tagged, not pushed; the sweep first; the validation list; the saved pieces); FLUID-DROP-SESSION-PROMPT.md (where item 2 meets
  `composeDt` and the pen). No `releases.json` entry, no version bump — the user tags.

## §117 the eighth track — RaindropsOnRoses, from 24 s, with the user's time note carried into FLUID2 S6 (2026-10-10, one worker in a worktree off c3ea530; the user: *"also added new test track (~/Downloads/An-ten-nae - Raindrops On Roses (Dimond Saints Remix).flac) -> note: start from 24 secs ; this is a good track that could play with time element (ideas modulate time -> example bass that starts at 56s -> something happens at 1:06 with the sound that seems like it would be good to modulate on)"*)

- **The file.** Copied (not moved) to `~/Music/RetinaRave/RaindropsOnRoses.flac` — the library keeps short names without spaces, as the seven
  — 44.1 kHz stereo FLAC (PCM_16), **222.857 s** (9 828 001 frames; 222.7 s at the truth's framing), md5 `b1ecf175ff240c140d75cc57161e1c23`.
  Nothing under `~/Music` is committed. **The memory rule "tune on all tracks" now means EIGHT** (CONTRACTS §1.18, HARNESS "Real-music
  acceptance", `windows.py` TRACKS, `traces.sh`, `fluid-tracks.js`).
- **The truth, the IBelongHere recipe as run** (`docs/truth/IBELONGHERE-2026-10-02.md` §0 — the recipe the last two imports used):
  `python3 tools/truth/trackmap.py RaindropsOnRoses --pcm --sr=48000` (allowed once: no truth dir existed; the default grains 8, 5, 3, 2, 1,
  0.569, 0.224 s + beat / bar / 4bar → `tools/truth/RaindropsOnRoses.json` 1.0 MB, `tools/truth/RaindropsOnRoses/grain-*.txt`, the gitignored
  dumps `tools/work/RaindropsOnRoses.{f32,48000.f32,48000.st.f32}`); `kicktruth.py` → `.kick.json` (**600 kicks, 2.69 /s**, p50 rise 10.1 dB,
  beat-slots [226 105 224 45] — the kicks on the beat and the 8th); `snaretruth.py` → `.snare.json` (775, 3.48 /s, p50 10.5 dB); `trackmap.py
  --loud` → `.loud.json` (integrated **−7.83 LKFS**, short-term p10 / p50 / p95 −15.21 / −7.34 / −6.26, range 8.96 LU); `key-truth.py`
  (`tools/work/v84/truth-RaindropsOnRoses.json`); `key-ears.mjs` (`ears-RaindropsOnRoses.json`); `gridcheck.py`; `--brief` →
  `others-brief.txt`. **`--pcm` is now banned on the EIGHT** (HARNESS "Loudness").
- **What is hand-marked, what is measured.** Hand: only the json's `notes` block (the user's words verbatim; `start_s` 24, `bass_s` 56,
  `event_s` 66) and the `START` / `USER` entries in `windows.py` that honour them — no beat, bar, section, drop or key was placed by hand.
  Measured, with the caveat the Malicious precedent (§72) names: `gridcheck.py` says *"beat phase never placed on the audio"* (dp_residual
  **62.2 ms** > 60, so the DP beat list was kept un-refit) — the sections and the three drops are bar-pinned to THAT grid. So, as Malicious:
  **`gate: false` — measured and swept for the record, no claim on it is a FAIL, until the user validates a ruler on it** (the click render
  is the recipe: HARNESS "Hearing a truth grid"). The ask to carry Malicious's flag to this track is honoured in `windows.py` `NO_GATE`.
- **Tempo and key.** The grid's `bpm` 139.6748 (beat 0.429569 s, bar 1.718 s) is §72's hop-median artefact (the DP gaps' median 429.60 ms =
  37 hops of 11.61 ms); the kick list folds at **140.00 BPM, phase 0.000 s, dead constant**: 78 % of the 600 kicks within 25 ms of an 8th
  line (median |off| 5.3 ms in the first half, 5.2 in the second; 139.95 / 140.05 read 22 ms, 139.67 reads 0.16 within 30 ms of a beat).
  The summary's 93.8 BPM is the onset ACF's 2 / 3 alias of 140.7 under the 135-centred prior — a half-time feel (70) is what the ear counts.
  Key **F♯** by every ruler: `key-truth.py` reads F♯m / F♯M as a PARALLEL pair in every section from 41 s (margins 0.005–0.062; the bass
  tonic F♯ 72–100 %: confirmed-by-bass; s9 96–111 s and s10 111–137 s CONFIRMED F♯m), trackmap's whole-track KK F♯ minor (conf 0.104), the
  sub a **46.3 Hz F♯1 held 71 %** of the loud half (sub 56 % / bass 34 % of the energy, h/f 0.05 — a sine sub); the ears (`key-ears.mjs`)
  F♯M 58 % / F♯m 26 % of frames 20–100 s, tonicConf p50 0.589 (over 56–116 s F♯M 91 %, 0.602); synapse F♯M 51 %, keyConf 0.628. The pitch
  class is settled; the mode (the parallel pair) is the user's ear. `test_ears.js` KEY_TRACKS: the row (pc 6, minor 1, `expect: true`,
  `conf ['>=', 0.3]`).
- **The three times the user named, measured** (the 0.569 / 0.224 s grains and a 0.25 s band-dB pass on the 48 kHz dump):
  - **24 s — the start.** 0–24 s is a mid-only intro: the 25–60 Hz band −56 to −97 dB, the mid 85 % of what little there is. At **24.5 s** the
    mix opens (the 400–2 kHz band −42 → −19 dB, the 2–12 kHz −48 → −29); the sub and bass stay silent until the 808 line with its slides
    enters at the 27.4 s bar (sub share 0 → 24 %; 166 `sub_slides` all track, 3–13 per 10 s); **drop 1 at 41.134 s** (+3.05 LU, ×2.02) after a
    one-bar sub cut at 40.0–40.9 s (sub 1 %, mid 83 %). The 24 s start is honoured, not derived.
  - **56 s — the bass.** Over 52.3–54.6 s the sub walks G1 → E1 → F♯1 (49.0 → 41.4 → 46.9 Hz, held 15–68 %); from **55.2 s the F♯1 sub PINS**
    (held 82–100 % over 55.2–57.5 s; the 56.33 s slice is the loudest sub moment of the groove, 83 % of the energy, 100 % held / voiced; the
    25–60 Hz band −7 to −10 dB). What the user hears starting at 56 s is the pedal settling on the tonic — `subEnv` at its fullest, the S6 (a)
    variant's input.
  - **1:06 — the event.** A **two-bar SUB CUT, 65.4 → 68.57 s**: the 25–60 Hz band falls **−6.8 → −39.7 dB** between the 65.25 and 65.50 s
    frames (the 60–150 Hz bass −16 → −33 → −39), the YIN contour goes unvoiced, the sub's share 86 → 1 %, the high band's **2 → 40–63 %** with
    its 2–12 kHz centroid flat at 3.2–4.4 kHz (no upward sweep — not a filter sweep), the drums still running (6 low / 4 click onsets in the 66 s
    slice), `h/f` 1–4 (what remains is harmonic-rich, no sub). Not a tempo change (the kick fold holds 5.2 ms through it), not a sidechain pump
    (no periodic dip — the band is gone for 3.2 s = 2 bars at 140). Then the bar-pinned **drop 2 at 68.569 s** (+3.39 LU, ×2.19; the sub back to
    −7.8 dB in one frame). The same gesture before drop 3 (134–137 s: sub 24 → 4 → 1 % → **137.137 s**, +3.25 LU, ×2.12). The long
    **breakdown 111.4–137.1 s** (sub 0–19 %, −12.87 LKFS against −7 in the grooves); 181.7–192 s is a variation (the sub stays 45–60 %).
- **The windows** (`windows.py` → `windows.json`; the seven's entries byte-equal to before): `START` 24 — the intro run is COLD at 24 (the
  thinnest start notion: `start` in the track's entry, absent = 0; no run, window, trace or rulers window before it; `traces.sh` records
  `start → start + 110`); `USER` moments `bass56` (56.0) and `event66` (66.0) on the run that covers them (at 24: f1922, f2522), behind
  `FULL=1` / `WINDOWS=` like quiet / drop2. The track: intro f602 @24 (34 s) · build1 f730 / drop1 f1030 @24 (36.1 / 41.1) · build2 f1236 /
  drop2 f1536 @43 (63.6 / 68.6) · groove f602 @76 (86 s) · quiet f602 @110 (120 s) · rulers **56–116** (holding the bass at 56, the cut, drop 2
  and the loudest 30 s).
- **FLUID2 S6 (`FLUID2-PLAN` §4 S6):** the note added — RaindropsOnRoses from 24 s, the bass at 56 s, the 1:06 cut as the first ruler for
  any `dtSim` modulation (the (b) void should read the cut as a latched void, the (c) double-step should fire on 68.569).
- **The traces and the node tests on music** (`PORT=8985 TRACKS=RaindropsOnRoses tools/traces.sh`, once the other builder's Chrome lock
  freed): `RaindropsOnRoses-map1.json` and `-map0.json`, 6601 frames each, **heard 24 → 134 s**, 213 fields, 16.7 / 17.2 MB, f0 2 (the map0
  header's `f0 -1` is HARNESS "File source"'s known race under `&map=0`; the recorder trims to frame0). `node tools/test_music.js` **129 ok,
  0 fail**, `node tools/test_fluid.js` **299 ok, 0 fail** — the eighth track's claims print as notes (`gate: false`). What they say: the
  PCM clock reads **139.95 BPM** in both modes (23.3 beats per 10 s; the "bpm is the truth's 93.8 × ?" NOTE is the truth SUMMARY's alias,
  not the clock — the clock agrees with the kick fold at 140.00); the map's drops land on the truth's to the frame (`mapDropEvt` +0.016 s on
  41.134, −0.002 s on 68.569; `dropEvt` −0.001 / −0.002); the LIVE detector fires ONCE in 24–134 s, at **129.517 s** — a false alarm by the
  4 s rule (7.6 s before drop 3, at the end of the 111–137 s breakdown) and it misses drops 1 and 2 (both `dropLiveEvt` lags are that 129.5 s
  fire: the sub cuts before the drops leave the low end empty, so the build detector has no "bass came back" edge to arm on — the open
  finding for the live night; `buildLive` max 1.00); the tongues ON 88.7 % of the frames from 20 s (the ≥ 90 % claim would FAIL by 1.3 points;
  the truth has 1.12 click onsets / s); the kick lane 59 rises / 67 `kickEvt` over 56–116 s against 67 truth clicks (×0.88 / ×1.00; the live
  lanes 73, ×1.09); `subGate` 87 % (map) / 94 % (live) of the frames; the key pins **F♯m at 42.9 s**, keyConf 0.60, 84 % of the frames
  key-coloured; the director's real rows: 4 switches, none inside the 30 s dwell, the drop at 68.57 cuts home. FLUID's grammar (file mode):
  injects on 110 / 110 music seconds, **3 clears = 3 shockwaves** at 41.18 / 68.62 / 129.98 s (A 1.269 / 0.979 / 0.648 — the two map drops
  and the false live one), the sub emitter's x p10 / p50 / p90 0.13 / 0.54 / 0.63 over 4435 open frames (F♯ at the centre, the walking 808
  line to the left), syrup 7.0 %, deep void 10.7 % (the breakdown); the live lanes: 1 clear at 129.55 s, void 11.7 %.
- **The FLUID per-track row** (`TRACKS=RaindropsOnRoses node tools/fluid-tracks.js`, FLUID-TRACKS §12): file mode — music 111 s, injects
  100 %, sub 89 s · kick 74 · snare 105 · chord 85 · hat 92 · floor 111; 1.1 kicks · 3.0 snares · 5.5 hats per s; ink 9.6 / 18.5 (p50 / p90,
  never governed); dv 7.4 /s; void 19 % (< .5) · 11 % (< .3); syrup 7 %; clears 3 (2 true) @ 41.18 68.62 129.98 = the shockwaves (A 1.27 /
  0.98 / 0.65); x sub 0.13 / 0.54 / 0.63 (span 0.50); hits 0.30 / 0.70 (harm 17 s); kick dy 0.37 / 0.49 / 0.76; the key's hue 84 %, 6 bins.
  The live lanes: sub 94 s, kicks 1.2 /s, ink 10.3 / 18.8, 1 clear @ 129.55 (0 true) — the one false live drop, and neither real one.
- **The identity references and the behaviour ruler** (once the GPU lock freed — the other builder's `real-md5.sh s0-roster` held it from
  13:50 to 14:24): `GPU=1 PORT=8986 SCENES=12 TRACKS=RaindropsOnRoses tools/real-md5.sh s117a` and `s117b` (PORT 8988) — **8 lines, 4 runs
  each, 69 s wall, cmp-equal**, f0 2 errs [] bad [] on every run (intro f602 / build1 f730 / drop1 f1030 on the run at 24, groove f602 at 76,
  both modes) — inserted into `tools/accept/v0.36/real-md5-v036.txt` after the s12 Malicious lines with a `#` note (232 → 240 shot lines; the file 246 → 259 with the five-line note); the
  roster's lines (0 1 3) on this track are owed with the next roster re-proof. `GPU=1 PORT=8987 SCENES=12 TRACKS=RaindropsOnRoses
  tools/real-rulers.sh s117` (66 s wall): **FLUID on 56–116 s — ok**: 600 frames, clip25 0, medY 0.193, grad 0.0179, jumpMx 0.055, jviol 0,
  black 0, monMx 0.0161, mviol 0 — appended to `real-rulers-v036.txt` with its note. Both references say the track is not a gate.
- **The gates:** `node tools/check.js` 0 fail (8 warn, the standing soft caps), `node tools/license.js --check` 181 / 0 (no new public code
  file — the truth json / grain tables / windows.json are data), `npm test` exit 0 with the traces in place (test_fluid 299 ok, test_music
  129 ok, the eighth track's claims as notes). `test_ears.js` (not in `npm test`) needs the seven's native-rate dumps in `tools/work/`, absent
  from a fresh worktree — a pre-existing condition; its KEY_TRACKS row for the eighth track is in.
- **Open, for the record (not gates):** the live build detector misses drops 1 / 2 (the sub cuts leave no "bass came back" edge) and fires
  once at 129.5 s, 7.6 s early for drop 3; the tongues 88.7 % (the ≥ 90 % claim); the truth summary's 93.8 BPM alias (the grid's 140.00 is
  right — a `tempo_note` as §72 gave Malicious would settle the json); the user's ear on a click render before any of it becomes a gate.
- **Addendum, 2026-10-10 afternoon — the ruler validated (the orchestrator rendered, the user listened; one Fable worker on main wrote it
  down: a3d8ae7 the truth + the gate, eaa7c1e the test rules, this commit the docs).** The renders, `clicktrack.py` into
  `~/Music/RetinaRave-clicks/`: **grid A** = the truth json's DP-tracked beats (`bpm_grid` 139.6748, phase 0.0348 s) and **grid B** = a flat
  140.00 BPM lattice at phase 0.0 (the kick fold above; the three drops 41.134 / 68.569 / 137.137 on its bar lines 24 / 40 / 80 within
  9 ms; `tools/work/RaindropsOnRoses-B.json`, gitignored) — `Raindrops-{A-dp139.67,B-140.00}-{24to84,125to160}.wav`, A and B twice each,
  plus `Raindrops-B-140.00-halftime-every2-40to80.wav` (B at `--every=2` = 70 BPM heard). The two grids differ by median 4.7 / p90 14.5 /
  max 41.8 ms over the 519 beats (the DP's first beat 34.8 ms after the lattice's, its last 17.2 ms before; the least-squares line through
  the DP beats is 140.0010 BPM). **The user, verbatim: *"can't tell difference between B / A; the 140 click nods better then the 70"*.**
  - **What that validates.** (1) The **octave: 140**, not 70 (the half-time feel) and not the summary's 93.8 (the ACF alias). (2) The
    **beat phase**: A and B are both on the kick within the ear's resolution (≤ 42 ms apart, inseparable by ear). (3) The **bar line**
    (mod4 0) is not contradicted: the downbeat accent was on both renders and was not called wrong, and the drops sit on both grids' bar
    lines. Not checked: the bar line on its own (no bar-only render), the phase at sample resolution (no waveform marks), 84–125 s and the
    outro, the key's mode. The record in the same format as the 2026-10-02 pass: `docs/truth/GRID-VALIDATION-2026-10-02.md` §11.
  - **The truth (`tools/truth/RaindropsOnRoses.json`), the way Vienna's and Malicious's carry theirs (§72's HANDK rule):** a `notes` entry
    (the words verbatim, the files, what they validate); **`bpm_grid.hand`** = the validated lattice — `bpm` 140.0, `beat` 0.428571, `phase`
    0.0, `bar` 1.714286, `downbeat_mod4` 0, `anchor: hand` dated 2026-10-10, `provisional: false`, `replaced` = the tool's 139.6748 /
    0.03483 + the summary's 93.8 (`summary_bpm`) with why, `octave` / `beat_phase` / `bar_line` / `beat_list` / `tempo_note` / `checked` /
    `not_checked` as Malicious's; **`summary.bpm` 93.8 → 140.0** with the tool's figure under **`summary.bpm_tool`** (and a `bpm_note`):
    `windows.py` and `test_music`'s clock rule read `summary.bpm`, so the "139.95 is the truth's 93.8 × ? (ratio 1.492)" note was the alias,
    not the clock. `trackmap.py`'s HANDK carry-over now also carries a hand-validated `summary.bpm` over a re-run (the fresh figure goes to
    `bpm_tool`) — `--pcm` stays banned on the eight; nothing was re-run. `gridcheck.py` now reads the track *"hand … hand date 2026-10-10"*
    (the *"beat phase never placed on the audio"* caveat is off); `clicktrack.py` prints *"grid provenance: hand"*.
  - **The `beats` / `downbeats` lists stay the DP tracker's** (the lattice is in `hand`, not in the lists — §72's *"phase corrected, beat list
    kept"*). The ear could not separate A from B, so the rule was: which list are the harness's consumers built on? Every one of them is on
    the DP list — `clicktrack.py` (grid A, heard), `kicktruth.py` / `snaretruth.py` (`grid16` off the truth beats: the `.kick.json` beat-slots
    [226 105 224 45] and the `.snare.json` stats), `dropcheck.py` / `predcheck.py` / `queuecheck.py` (the beat unit, the beat / bar events),
    `gridcheck.py`, `tongues-cold.js`, and `windows.py`'s `drops` + `sections` (bar-pinned to the DP downbeats: −0.1 / +0.5 / −0.1 ms; the
    lattice's bars are −8.9 / −2.4 / −5.9 ms away). `test_music` reads the 1 s slices, not the beats; the map (`assets/engine/map`) builds
    its own grid from the audio and reads neither. Against the 600 kicks the two grade the same (75 % DP / 72 % lattice within 25 ms of an
    8th line). Swapping would move the drops off their bar pin, re-bin the kick / snare slots and move no reference line for a difference
    no ear hears. **No real-md5 / real-rulers line moves** (none reads the lists) — the `#` notes beside the s117 lines in
    `tools/accept/v0.36/real-md5-v036.txt` / `real-rulers-v036.txt` saying the track is not a gate are superseded by this addendum, the
    md5s and the rows untouched.
  - **The gate.** `windows.py` `NO_GATE` {Malicious, RaindropsOnRoses} → **{Malicious}**, `windows.json` regenerated: the seven + rec
    entries json-identical, the file byte-equal outside the track's entry, which moves `gate` false → true and `bpm` 93.8 → 140.0 only.
  - **The three "would FAIL" notes, under the gate** (`tools/test_music.js`): the seven's *"from 20 s"* claims (the clock's bpm median, the
    beat count per 10 s, the tongues' on-fraction, the queue's) always excluded the cold start's first 20 s — on a trace that starts at the
    track's `start` (24 s here) *"from 20 s"* excluded nothing. Measured on the traces: `tongueOn` (tongues.js's window-full flag — 0 after
    a cold start, a re-seat or a lattice move until WIN 16 beats pass; **not a lead / vocal detector**) is 0 over 0–12.0 / 13.4 / 14.4 /
    20.9 s on Malicious / Vienna / SeeYouDrop / IBelongHere and over **24.00–36.38 s** on RaindropsOnRoses — the same 12–15 s warm-up,
    shifted by `start`. So the rule: **every "from 20 s" claim counts from `start` + 20** (0 + 20 on the seven, 44 on this track) — the
    generic warm-up, never a per-track exception. (a) **clock bpm**: 139.95 is the truth's **140 × 1 (ratio 1.000)** — step 1's
    `summary.bpm`. (b) **beat fires** 23.32 ± 15 % per 10 s from 44 s: **24 23 23 24 23 23 24 23 23, 0 windows off** (the old first window
    20–30 s held only 24–30 s = 13 beats, the one window off). (c) **tongues**: **100.0 % from 44 s** on both traces (88.7 % from 20 s was
    the 12.4 s cold start over the 110 s trace: 1 − 12.38 / 110 = 88.7 %) — the detector was right, the premise was the warm-up; no finding,
    nothing marked. The queue claim (100.0 %, median 27 / 26) and the bpm median (139.95) moved to the same origin and are unchanged on the
    seven. **`test_music` 129 → 151 ok, 0 fail** — the 22 new lines are the eighth track's claims as gates (both modes: shape ×2, clock ×2,
    map, tongues, drums ×2, queue, build, director ×2); the seven + rec's ok lines identical to before. `test_fluid`'s music block on the
    track (injects 110 / 110, 3 / 3 clears = shockwaves, syrup 7.0 %) was already clean and is now gated too: **314 → 328 ok, 0 fail**.
  - **The gates on the tree as committed:** `node tools/check.js` 183 modules **0 fail** / 8 warn (the standing soft caps), `node
    tools/license.js --check` 186 / 0, **`npm test` exit 0** (test_music 151 ok, test_fluid 328 ok, the unit tests OK), `python3
    tools/truth/clicktrack.py RaindropsOnRoses --from=60 --to=72` renders (29 clicks, provenance hand; not played). No Chrome, no sweep.
  - **Still open on the track (findings, not gates):** the live build detector's miss of drops 1 / 2 and its one fire at 129.5 s (the sub
    cuts before the drops; the ≤ 4 rule holds at 1); the roster's (0 1 3) real-md5 lines on the track, owed with the next roster re-proof
    (none run here); the key's mode by ear.

## §118 the lean-down — eight scenes archived, the kept six renumbered, the arrow keys (2026-10-11, one Opus worker on main; the user: *"I never look at polytope, feigen, maxwell, gielis, chladni, key5-nav, key8-torus, key9-nav, and OK to archive"*, then *"instead of skipping holes, can we shift kept scenes down to fill the gaps?"* / *"order: fluid, fluid2, nav2, dust, torus2, mandala"*, then *"we have "N" for next scene, should have a previous scene button -> use the arrow keys for changing scenes forward and backward; go"*)

The engine had fourteen registered ids and the user watched six of them. Eight scenes, their tests, their worker docs,
their accept references and their thumbnails are out of the live tree; the six that stay are renumbered to fill the
holes, so every one of them has a number key again; and the scene stepper gained a direction.

### The id map

| old | scene | new | key |
| --- | --- | --- | --- |
| 12 | FLUID | **0** | `1` |
| 13 | FLUID2 | **1** | `2` |
| 0 | NAV2 (the home) | **2** | `3` |
| 1 | DUST | **3** | `4` |
| 3 | TORUS2 | **4** | `5` |
| 2 | MANDALA | **5** | `6` |
| 5 · 6 · 7 · 8 (+ its variant 4) · 9 · 10 · 11 | POLYTOPE · FEIGEN · TORUS v1 · NAV v0.33 (+ DRUM) · MAXWELL · GIELIS · CHLADNI | archived | — |

The order is the user's, read as the order they would cycle in. `REG` is DENSE 0..5 now, which is the point of filling
the holes rather than skipping them: `stepScene`'s `(from + d + n) % n` walks every scene in both directions with no
empty slot to land on, the digit keys cover the whole roster (they had run out at 9 and ids 9–13 had no key at all),
and `help.js`'s `1–` range and `panel.js`'s hole filter both become trivially right.

**The HOME is still NAV2 — by NAME, not by the literal 0.** `SC.cur` was initialised to `0` in the struct literal and
for v0.1–v0.33 that WAS the navigator, so the two agreed by accident. The renumber put FLUID at 0, so
`core/scenes.js register()` now seats `SC.cur`, `SC.logical` and `SC.hist` on whichever scene declares `home: true`.
Measured on a page load: `cur 2, logical 2, home 2, hist [2], errs []`. If the user wants FLUID first on load, that one
line is where to say it.

### The arrows

`core/hud.js`: `ArrowRight` steps forward (what `n` already did, kept), `ArrowLeft` steps back —
`stepScene(-1)`, which is only correct because `REG` is dense. Both go through the landing picker like the digits, so a
press on the card previews like a tile click. The page has exactly ONE `keydown` listener and no arrow was bound
anywhere in it, in the panel or in `core/touch.js`, so **nothing was displaced** (the bottom bar's prev / next buttons
have called `stepScene(±1)` since v0.10 — the arrows are the same two calls on the desktop). `core/help.js`'s key
table lists `N or →` and `←`, and the landing card's hint row is rendered from that table, so the two cannot drift.

### What moved where

`archive/` is frozen: nothing in `assets/` imports it, `check.js` and `license.js` walk `assets/` only, the bundler
reaches it from no import. `archive/README.md` carries the id map from the other direction, how to cite an old id, and
how to bring a scene back.
- `archive/scenes/` — the eight folders, byte-unchanged (DRUM is NAV's variant and lives inside `nav/`).
- `archive/math/` — `nudge.js`, `gielis.js`, `chladni.js` as real files (only the archived scenes used them), plus
  one-line re-export shims for the seven shared modules that are still live in `assets/math/`. That keeps the archive
  IMPORTABLE, which matters: `tools/test_nav2.js` reads `archive/scenes/nav/{index,nav,shaders}.js` as its A/B control
  (the byte copy, the `nav.js` line diff, 48 s of trajectory) and stays green — a frozen tree is exactly what a control
  should be. Its declared id 8 is simply dead in the live registry.
- `archive/tools/` — `test_polytope.js`, `test_feigen_ladder.js`, `test_fdtd.js`, `test_gielis.js`, `test_chladni.js`,
  `navkicks.js`, `feigen-bench.sh`. None was in `npm test`.
- `archive/docs/workers/` — the 28 brief + report files about these scenes only. The `nav-*` docs stayed LIVE: NAV2 is a
  byte-faithful clone of NAV, so that lineage still binds.
- `archive/site/thumbs/` — six jpgs. `archive/accept/` — fourteen dead sweeps (below).

### What the renumber touched, and what it could not

Every md5 reference keyed by id had its `s<id>` KEYS renamed and **not one hash moved** — an id is a registration slot,
never a pixel. `scene-md5-v035.txt` and `-fluid0.txt` (26 lines → 10 kept; the eight archived ids dropped),
`scene-md5-v034.txt` (24 → 8), `real-md5-v035/36/37.txt` (232 / 240 / 330 lines, every one kept: the five ids that have
real-track lines are all kept scenes), `real-rulers-v035/36.txt` (the `id` column, rows re-sorted), and
`trans-mixs-md5.txt` — the same NAV2 → TORUS2 fade at f178 is `2→4` now instead of `0→3`, at the same hash. Each file
says so in its header. The scripts' defaults followed: `real-md5.sh` / `real-rulers.sh` `SCENES="0 2 3 4"`,
`director-bids.js` `IDS [0,2,3,4]`, `test_director.js` step 10 (rebuilt from an empty `REG`, one stub per kept scene at
its real id, with an assertion that `register()` seated the home), `test_fluid.js`'s two id assertions.

`accept.sh` lost the "== polytope", "== gielis" and "== feigen cost" blocks and had its ids remapped; the nav2 block
lost the archived control's lane. Its "== routes" and "== params" blocks used FEIGEN as their VEHICLE (id 6, a numeric
`bloom.thr`, a `params` slot) and were re-pointed to NAV2 (id 2, `bloom.thr` 0.35, `params` `trap`…). **Those two
blocks have not been run on the new vehicle — the next full `GPU=1 tools/accept.sh` is their first sweep.**
`tools/q-trace.sh` forced scene 6 and called FEIGEN's `hooks.feig`; it is parameterised now (`QID` default 0, `QHOME`
default 2, the depth field empty by default). `tools/landing-steps.json` clicks `data-id="4"`.

Two things the renumber reached that were not on the list. `releases.json`'s per-entry `scenes` arrays are scene IDS —
they drive `/whats-new`'s thumbnails — so they were remapped and the archived ids dropped; `site/whats-new.html` was
regenerated, and v0.35 / v0.36 had SILENTLY LOST FLUID's thumbnail the moment id 12 stopped existing. And
`site/about.html`'s cast is the six in id order with a key row; its `<b>TORUS</b>` line is TORUS2's public name and
stayed.

### Parity cut to the music state

`tools/parity.js` sampled the navigator's own state (`nav.c`, `nav.mode`, `nav.h`, …) beside MS. Since §102 that meant
forcing the v0.33 control at id 8, which §118 archived — and the check had been RED for weeks either way: the §116 S7
receipt reads `max |diff| 7.852214593751443`, every `nav.*` row a MISMATCH, every MS row 0, because the navigator the
engine ships walks somewhere else BY DESIGN. A gate that cannot go green is not a gate. The `nav.*` rows and `NAVID`
are gone, both sides force scene 0, the field-by-field max-diff and the 0-diff expectation on the fake path are
unchanged. It passes: `max |diff| … 0 · fields compared 62` (72 before — the ten `nav.*` rows are what went),
`MS parity: every field identical to 1e-9`. The fake montage's ew shots are committed rather than reverted this time:
the ew side renders scene 0, which is FLUID now, so they genuinely changed.

### DECISIONS split

`docs/DECISIONS.md` was 11 663 lines. §0 … §103 (2026-09-22 the extraction → 2026-10-08 the v0.34 tag) are
`docs/DECISIONS-ARCHIVE.md`, 9 077 lines with a header that says what it is, carries the old → new id map (every id
written before today is pre-renumber, including the two meanings id 0 and id 8 have had across the §102 swap) and says
how to cite it. The live log is 2 690 lines, §104 onward, and its head carries a pointer plus a
**"Standing rules (from §0–§103)"** block: 32 lines, one per rule that still binds, each with its §. Nothing was
renumbered and no cross-reference was rewritten — no tool parses this file, every `§N` is a comment pointing a reader
at a section, and rewriting 11 000 lines to prove a filename would have been the opposite of a lean-down.

Each of the 32 was then checked against `docs/CONTRACTS.md`; 20 were already there and the 12 that were not are now,
one line each: §0 gained proof-sized-to-the-diff (§38), one Chrome per bench (§9), the `ACC` reference discipline
(§83), durable hand annotations (§72), "a look remark is a retune request" (§92) and the licence + credit-where-due
(§90–§91, §104); §1.4 the colour-identity rule (§26); §1.18 the display lead's two values (§52–§53), the PCM clock as
the DEFAULT rather than a switch (§56) and REACTIVE OVER PREDICTED as a rule (§51); §4 the dwell with its exemptions
(§95), "a boot never revives a forced scene" (§94) and the section-renumber map (§21–§22). **Found while checking:**
Appendix A's five `*Pcm` rows still read "nothing by default; bpm with the switch on", wrong since §56 addendum 3 made
the PCM clock the default. Fixed in the same pass.

### Disk

| | before | after |
| --- | --- | --- |
| the checkout | 6.6 GB | 1.8 GB |
| `tools/accept` | 131 MB | 55 MB (+ 48 MB in `archive/accept`) |
| `releases/` | 40 MB, 37 pages | 5.0 MB, 3 pages |
| `tools/chr*` | 777 MB | gone |
| `tools/work` | 5.2 GB | 1.1 GB (4.1 GB moved to `~/Archive/RetinaRave-work/`) |
| `docs/DECISIONS.md` | 11 663 lines | 2 690 (+ 9 077 archived) |
| registered scenes | 14 ids | 6 |
| `check.js` modules | 183 | 144 |
| the bundle | 1 863 210 bytes, 182 modules | 1 378 966 bytes, 143 modules |

440 untracked scratch files under `tools/accept` were deleted (`git clean -f tools/accept` only, listed first), and
`tools/accept/v0.27` went with them — 0 of its 63 files were tracked. Moved to `archive/accept/`: v0.1, v0.4, v0.8,
v0.8.1, v0.9, v0.10, v0.11, v0.12, v0.13, v0.14, v0.15, v0.29, v0.31, v0.32 — every jpg still tracked
(`.gitignore` carries `!archive/accept/**/*.jpg`). KEPT live: v0.2, v0.3, v0.5, v0.7, v0.34, v0.35 (`$ACC`), v0.36,
v0.37, live-grid. 34 of the 37 frozen release pages were `git rm`'d; the ritual is unchanged and every older page is in
git history at its tag (`git show v0.29:releases/retinarave-v0.29.html`). In `tools/work` the eight tracks'
`.48000.st.f32` + `.f32` (+ `.json`), `rec/`, `fluid-tracks/` and `fluid-diag/` stayed — everything a live test or tool
opens; `tools/truth/traces` (254 MB) was not touched. `tools/work` is `.gitignore`'d but 61 files under it are TRACKED
(the fluid2 S2–S5 gate scripts), so those were checked straight back out.

### The gates

The receipt with every number and every wall time is `tools/accept/v0.37/lean-2026-10-11.txt`. In short, all eight green:

1. `node tools/check.js` — 2 s — **144 modules · scenes 6 · 0 fail · 4 warn** (183 / 13 / 0 / 9 at ebc372f; the four
   warns are the line-cap ones only, the five that went were the archived scenes').
2. `npm test` — 25 s, exit 0 — **test_fluid 442 ok 0 fail and test_music 151 ok 0 fail, ebc372f's counts to the test**;
   `test_director` green on the new ids and asserting that `register()` seated the home. Also `node tools/test_nav2.js`
   all ok, reading `archive/scenes/nav/` as its control.
3. the fake smoke `tools/scene-md5.sh` — 90 s — **12 lines, errs [] hop 840 row 72 on all six ids; 10 / 10 renamed
   reference lines cmp-equal to the byte, no line re-cut.** The twelfth pair (s1 = FLUID2, `0e92a1c4` / `ed3283fc`) is
   NEW to the list rather than renamed: §116 S7 measured it and left it unwritten, so it is recorded now.
4. `SCENES=0 TRACKS=RaindropsOnRoses tools/real-md5.sh` — 70 s — **8 / 8 cmp-equal** to `real-md5-v037.txt`;
   `SCENES="2 3 4" TRACKS=RaindropsOnRoses` — 205 s — **24 / 24 cmp-equal** (§116 S7's own wall for that was 207 s).
   `f0` 2, errs [], bad [], exc 0 on all 16 runs. The eight-track sweep was NOT run.
5. `node tools/parity.js fake` — 128 s, exit 0 — **max |diff| 0 · fields compared 62 · "MS parity: every field
   identical to 1e-9"** (72 fields before; the ten `nav.*` rows are what went).
6. `npm run build` — 0.14 s — **143 modules, 1 378 966 bytes** (182 / 1 863 210 before: −39 modules, −26 %).
7. the arrows, headless Chrome — 2 s — **ArrowRight 0→1→2→3→4→5→0 by name, ArrowLeft back, both wrapping; `n` still
   steps; errs []**. And the load with no `&scene=`: `cur 2, logical 2, home 2, name nav2, hist [2]`.
8. `node tools/license.js --check` — 0.02 s — **147 public files · 0 without the header** (186 / 0 before).

### Owed

- The seven-track FLUID2 sweep before any tag (§116 S7, the user's deferral) — unchanged by this.
- `accept.sh`'s "== routes" and "== params" blocks on their new NAV2 vehicle: never run.
- Nothing is tagged and nothing is pushed. `releases.json` still tops out at v0.36 and `package.json` is 0.36.0 — the
  renumber, the arrows and FLUID2 all ship in whatever the user tags next, and §118 is a visitor-facing change (the
  keys moved) so it needs its own release entry when that happens.

**§118 addendum — Share a tab opens on FLUID (2026-10-11, the user: *"sharing a tab should start with fluid"*).** The page's first
frame stays the home (NAV2, the `home: true` seat in `register()`); the **Share a tab** button (`core/hud.js` `$('go')`) now calls
`seatScene(0)` (`core/scenes.js`) before `ENGINE.start('capture')` — the same seat the home gets (cur / logical / hist, next −1,
m 0, since 0), NOT a force: `SC.forced` is left alone, so a picked landing tile wins and the director runs on from the pool (FLUID
bids, its dwell holds it, a build parks home). The demo fallback on the same button (no `getDisplayMedia`) seats it too; the
microphone and demo buttons do not. Proof (headless, PORT 8975, GPU=1): before the click `cur 2 forced −1`; `#go.onclick()` →
`{cur 0, logical 0, forced −1, hist [0], name fluid, errs []}`. check 144 modules 0 fail; npm test exit 0. No md5 line can move
(the harness forces its scene by hash). Open: the user's eye on the first seconds of a real tab share.
**The hold (same day, the user at 8765: *"still goes to nav"*).** Reproduced on the demo path: the seat held 0.8 s, then the director's
home rules undid it at 10 s (`hist [2, 0]`): a stream's first frames read `presence < .12` (the silence rule parks home) and a first
loud frame can read as `dropEvt` (home, hard). `seatScene()` now draws the §95 dwell for the seat (`dwellMin`, the same deterministic
formula, `SC.lands` advanced — never on a harness run, which forces by hash) and sets `SC.seatHold`; `updateScenes` skips the three
home rules (drop, silence, build) while the hold stands, clears it at `since ≥ dwellMin` or on any real landing (`goScene`). After the
hold the director is §93–§95 unchanged. Proof (headless, demo, PORT 8975): `dwellMin 84.2`, cur 0 at 10 / 25 / 60 s, hist [0], errs [].
check 0 fail, npm test exit 0.

## §119 v0.37 tagged — the lean-down goes public, FLUID2 rides along (2026-10-11, one Opus worker on main; the user: *"tag and deploy"*)

- **What ships** (everything on `main` since v0.36 — 58 commits, three sections and one addendum; this note adds no code):
  **§116 FLUID2** — scene **1**, "the bands": a second grammar on FLUID's one pool, where each band is a different KIND of coupling
  (the sub a field that heaves the whole pool, the kick a travelling vortex pair, the mids the material through the curl, the highs the
  surface — grain / dip / specular, the harmony a pen, and the solver's own clock `dtSim`: the breath on the sub, half time in the latched
  void, a double step on the drop; every knob A/B-able live through `&k2={…}`) · **§117** the eighth library track **RaindropsOnRoses**
  (the truth grid validated by the user's ear, 140 BPM, played from 24 s — internal, the harness and the windows) · **§118 the lean-down**:
  eight scenes archived to `archive/`, the kept six renumbered DENSE 0..5 so every one has a digit key again (`1` FLUID, `2` FLUID2,
  `3` NAV2 the home, `4` DUST, `5` TORUS2, `6` MANDALA), **← / → step scenes** both ways (`n` kept), `parity.js` cut to the music state,
  DECISIONS split at §104, `releases/` pruned to the last three frozen pages · **the §118 addendum**: **Share a tab opens on FLUID** and
  HOLDS it (`seatScene(0)` before `ENGINE.start('capture')` — a seat, not a force — drawing its own §95 dwell plus `SC.seatHold` so the
  director's silence / drop / build home rules cannot undo it, after the user's *"still goes to nav"*).
- **FLUID2 is tuned on ONE track and ships that way, on the user's word — say it plainly.** Every K2 in `core/fluid/inject2.js` was tuned
  and proven on **RaindropsOnRoses alone** (from 24 s, the live lanes first; the user: *"only tune with Raindrops, don't do full sweep"*),
  and **the eight-track sweep §116 S7 deferred was NOT run for this tag either** — the user said *"tag and deploy"* knowing it. The other
  seven tracks are MEASURED by the no-GL table (§116 S7's rows) and UNTUNED; the sweep stays at the top of NEXT-SESSION-PROMPT, owed, not
  skipped. FLUID2 is **forced-only**: `score()` 0 and no landing `card`, so the director never picks it and a visitor reaches it on key `2`
  or `#scene=1`. The release entry calls it *"new and experimental … tuned on one track … treat it as a sketch rather than a finished
  scene: the director never picks it, you have to"* — the honest word, in the house voice. **Every proof below shows the roster scenes and
  FLUID unmoved**: an id is a registration slot, never a pixel, and nothing in this release touches a roster scene's pixels.
- **The recipe (§91's ritual as §112 / §115, with §118's three-page rule standing from here).** `package.json` + `assets/core/version.js`
  0.36.0 → 0.37.0 (together, §89) · `releases.json` top entry (`v0.37`, 2026-10-11, class `scene`, title *"Six scenes, six keys, and the
  arrows"*, decisions §116 + §117 + §118, scenes `[0,1,2,3,4,5]` = the kept roster in key order, no clip; the headline is the keys and the
  arrows because that is what a visitor's hands feel, FLUID2 is the paragraph after it, and the eighth track is one clause — *"tuned on one
  track, the newest in my library"*) · `npm run build` (35 entries → `site/whats-new.html` 43 KB, the card's `#newin` line *New in v0.37:
  Six scenes, six keys, and the arrows*, `dist/index.html` **143 modules, 1 380 695 bytes**) · `node tools/bundle.js
  releases/retinarave-v0.37.html` (**143 modules, 1 380 695 bytes**, `VER = '0.37.0'`; v0.36's frozen page was 177 / 1 770 383 — the
  lean-down took 22 % off the page) · `git rm releases/retinarave-v0.34.html` (the three-page rule, now in HARNESS "## Release notes").
  `site/thumbs/` has no `fluid2.jpg`, so the entry renders five thumbs for its six ids — carried open, the user's word on a tile.
- **The gates, each green on the tree AFTER the bump (so every sweep saw the release's own files), with wall times.** The receipt with every
  number is `tools/accept/v0.37/tag-v0.37-2026-10-11.txt`:
  1. `node tools/check.js` — 2.5 s — **144 modules · scenes 6 · 0 fail · 5 warn** (the line-cap warns only; §118 read 4 — `core/scenes.js`
     crossed 350 in the addendum) · `releases.js check` 35 entries, top v0.37 == package.json, **0 problems** · `whatsnew --check` up to date
     · `license.js --check` **147 public files, 0 without the header** (0.02 s).
  2. `npm test` — 24 s, **exit 0** — `test_fluid` **442 ok**, `test_music` **151 ok**, §118's counts to the test.
  3. the fake smoke `PORT=8979 tools/scene-md5.sh s119` — **93 s** — errs [] hop 840 row 72 on all six ids, **12 / 12 lines cmp-equal to the
     byte** with the §118-renamed `tools/accept/v0.35/scene-md5-v035.txt`.
  4. `SCENES=0 TRACKS=RaindropsOnRoses PORT=8981 tools/real-md5.sh` — **70 s** — **8 / 8 cmp-equal** to `real-md5-v037.txt`'s s0 lines;
     `SCENES="2 3 4" … PORT=8983` — **209 s** — **24 / 24 cmp-equal** to its s2 / s3 / s4 lines (§118's wall 205 s, §116 S7's 207 s).
     `f0` 2 · errs [] · bad [] · exc 0 · the forced `sc` on all 16 runs.
  5. `PORT=8977 node tools/parity.js fake` — **51 s, exit 0** — **max |diff| 0 · 62 fields · "MS parity: every field identical to 1e-9"**,
     §118's numbers exactly. The run rewrites `tools/accept/v0.5/{ew,v3}-t{6,14,20}.jpg` + `parity-fake.jpg`; those shots are not
     deterministic in pixels (`features-slow.js` seeds a section's look with `Math.random`), so they were checked back out — the numbers are
     the proof, not the jpgs.
  6. `SCENES=1 TRACKS=RaindropsOnRoses PORT=8985 tools/real-rulers.sh s119` — **66 s, 0 FAIL** — FLUID2's row
     `1 fluid2 RaindropsOnRoses 56-116 continuous | 600 0 0.193 0.0222 | 3599 0.060 0 0 | 3599 0.0161 0 | ok` — **identical to §116 S7's row
     to the digit**, only the id column moved (13 → 1). S7's wall was 65 s.
  7. the frozen page from `file://`, headless, **CLOCK=1** GPU=1 — `test&scene=0` → `{sc 0, grammar pool, fluidOn true, errs [], bad [],
     frameN 300}` · `test&scene=1` → `{sc 1, grammar bands, fluidOn true, errs [], bad [], frameN 300}`. **A pitfall paid here:** a first
     pass without `CLOCK=1` proved the same errs / bad / sc / grammar but burned two 120 s `until` timeouts — `window.__FRAME` exists only
     under cdp.js's CLOCK shim, so a frame target without it always times out (242 s for what CLOCK does in 15 s).
  **What was NOT run, and why:** the eight-track FLUID2 sweep (above — the user's word) · `accept.sh`'s "== routes" / "== params" blocks on
  their new NAV2 vehicle (owed since §118) · a director trace, because **no scene entered the rotation** in this release (FLUID2 bids 0),
  so HARNESS's "a scene enters the director's rotation" tier does not apply.
- **The deploy shape, confirmed.** `dist/` is what `npm run build` writes and what `wrangler.jsonc` serves (`assets.directory ./dist`);
  `dist/` is **git-ignored and not committed**, and there is no `.github/` workflow — the deploy is **Cloudflare Workers, git-connected to
  `github.com/tbkraf08/RetinaRave`, building on a push to `main`** (README's deploy line; the build config lives in the Cloudflare dashboard,
  not in the repo). So the push IS the deploy: one push, then poll `https://retinarave.com/` for the `VER` line, **never a second push**
  (§115's rule — a second push is a second deploy). `archive/` reaches `dist/` through no import (the bundler walks imports; the only
  "archive" strings in the bundle are §118's own comments) and the bundled registry is exactly the six scenes.
- **What is live when.** ONE release commit (this note, HARNESS "## Release notes" with the three-page rule and the frozen-page step,
  the receipt `tools/accept/v0.37/tag-v0.37-2026-10-11.txt`, `NEXT-SESSION-PROMPT.md` rewritten for the post-release truth, the two versions,
  the entry, the generated `site/whats-new.html` + `index.html`'s line, `releases/retinarave-v0.37.html` in and v0.34's out), `git tag -a
  v0.37`, `git push origin main --tags` — **one push**. The LIVE time is in the release report and memory, not in this note.
- **What the user validates at home (every remark in track time is a retune request).** (1) **§118 on the live site**: the six scenes on
  keys `1`–`6` in the order asked for, the **arrow keys** forward and back and wrapping, `n` unchanged, a page load still opening on NAV2.
  (2) **Share a tab opens on FLUID and STAYS** through its dwell (headless demo: `dwellMin` 84.2, cur 0 at 10 / 25 / 60 s) — the first
  seconds of a real tab share are the test. (3) **FLUID2 on RaindropsOnRoses from 24 s** (`#scene=1`; `#scene=13` in every note written
  before §118) at **27.4** (the 808: the pool heaves, the pair launches), **41.1** (drop 1), **55–57** (the sub pins — the breath per
  attack), **65.4–68.6** (the two-bar cut: the pool stills, its clock slackens to ~.84, the return at 1.1–1.2× — the music, or a framerate
  wobble?), **84** (the groove), **111–137** (the breakdown: the pen draws the chords, the pads at half time), **137.1** (drop 3), **180+**;
  references `tools/accept/v0.37/fluid2-s116-s7-RaindropsOnRoses-arc.jpg` (the live lanes) and `-arc-map1.jpg` (the file map). **On a live
  tab this track carries no clear, no shockwave and no clock burst** — the live detector never confirms its drops (§117), so the burst is
  file-mode only here. (4) **the time switches** (`&k2=`): the clock off `{"DT_SUB":0,"DT_VOID":1,"DT_DROP":0}`, the breath alone, with the
  level `{"DT_LVL":0.4}`, the honest drop `{"DT_DROP":1}`, the pulse `{"DT_BEAT":0.3}` (§116 S6's list). (5) the hard cut `n` / `→` FLUID →
  FLUID2 mid-groove (the pool must not blink). (6) carried, still unvalidated: v0.36's shockwave on the four dropping tracks, FLUID in the
  rotation, the drop's flash with the ring and no droplets; v0.35's whole list.
- **Open findings carried into the tag (none retuned).** The eight-track FLUID2 sweep (the standing exception to CONTRACTS §1.1) ·
  **FLUID-DROP item 2, the reversal** (and `DROP_DISS` 6, the knob to re-read after it, on every track) · **S5b the vocal-presence
  feature** (`voxS / voxHz / voxConf`; `PEN_SRC 2` reserved) · a **tier-0 phone measure** of the whole band grammar · **IBelongHere's live
  return 36 frames late** and Vienna's bar 40 arming nothing in either mode · **the live detector's miss on Raindrops' drops 1 / 2** (the
  sub cuts leave no "bass came back" edge — `engine/build`, not the grammar) and the void term arming 2.1 s into the cut · **the mixs
  12→13 mid-dip** (the incoming scene's cold `U.expo`, measured at §116 S7 and left open with the number) · **DUST's bid share** (0 of 5
  away picks on §115's demo traces) · §109's seven ruler FAILs on DUST / TORUS2 · the idle bench, still unseen on this machine ·
  `accept.sh`'s routes / params blocks on NAV2 · no `fluid2.jpg` thumbnail, so the v0.37 entry shows five thumbs for six scenes.

## §120 FLUID2 reset to FLUID — the band grammar pulled, the slot kept for the emitter array (2026-10-11, one Fable session on main; the user: *"I'm not a fan of fluid2 (it moves too quickly); Reset fluid2 to fluid and lets try something else in fluid2; for the input that enters the scene -> how is position selected? I'm thinking of having an array of different sizes that line the sides and top where input is added to the scene (and also inside of the scene -> should be symetric / tasteful); how would a professional light designer do it?"*)

- **The verdict on §116.** The user watched v0.37's FLUID2 (the sub a field, the kick a vortex pair, the mids the confinement, the highs the
  surface, the pen, the solver's clock — tuned on RaindropsOnRoses alone) and pulled it: too fast. No retune, no sweep: the direction is
  wrong, not the numbers. The eight-track sweep §119 carried as owed is **no longer owed**.
- **The reset, to S0's identity, not to a deletion.** `core/fluid/inject2.js` is the identity again (plan() = inject.js's plan() on the
  shared base state, `K = {}`, `FLUID_FEATS` = the base's); `scenes/fluid2/{shaders,index,help}.js` re-cloned from FLUID's (name fluid2,
  id 1, key 2, forced-only `score()` 0, no card, the five own feats, the `fluid: { grammar: 'bands' }` slot kept — the switchboard for the
  next experiment, the identity until it lands). `fluid.js`'s plumbing for a grammar's optional return fields (heave / swirl / grain /
  highs / pen / curlMask / dtSim / substeps) STAYS: each absent is the §104 pass to the bit, and a new grammar may want them; the HUD line
  no longer prints `K2.KICK_SHAPE`. `tools/test_fluid.js`'s bands block is the identity's (331 ok): plan2 = plan() to the byte on 600
  synthetic frames and on SeeYouDrop's real trace, the mixed 300-frame run's base state AND every output frame = plan() alone's, the
  Proxy, FLUID2's five feats ⊂ FLUID's. The §116 S1–S6 grammar, its shaders and its tests are at v0.37 (`git show v0.37:…`); the strips'
  tools stay (HARNESS "## Fluid" says so).
- **The proof.** `node tools/check.js` 144 modules · 0 fail · 4 warn; `npm test` exit 0 (test_fluid 331 ok, test_music 151 ok); the fake
  scene-md5 `IDS="0 1"`: s1's pair = s0's pair to the hash (3e483039 / 2274bb4e), and s0's = `tools/accept/v0.35/scene-md5-v035.txt`'s —
  FLUID untouched, FLUID2 = FLUID to the pixel. The real-md5 reference `real-md5-v037.txt`'s s1 lines are STALE by construction (they
  hashed the band grammar); the next real sweep re-bases them to s0's.
- **The question — how is position selected, how would a lighting designer do it — answered in `docs/plans/FLUID2-EMITTERS.md`:** today
  one point per channel (the sub sliding on the fifths axis, a fixed snare pair, hashed hats, the centre for the harmony); an LD hangs a
  fixed symmetric PLOT in three sizes (washes low and central, spots on the sides, beams high and wide), groups it into SYSTEMS per
  function, and runs CHASES across them (odds / evens, inside → out, ping-pong, all-on) that change on the phrase and hold the outer
  fixtures back for the drop. The proposed rig: 23 mouths (5 floor washes, 3 + 3 side spots, 7 top beams, a 4 + 1 interior quad), the
  sub snapped to the nearest floor mouth, the drop the blinder. Not built: the user picks the edges, the snap and whether the rig is drawn.
- **No tag, no push.** v0.37 stays live with the band grammar; the reset ships with whatever lands in the slot next.

## §121 FLUID2 the RIG — the emitter array built in one step on the user's five decisions (2026-10-11, the same Fable session as §120; the user: *"remove the shockwave; add channel for vocals; pitch seems more like a virticle move rather than horizontal slide (more for vocals or melodies); rig should be invisible; color should be based on the coloring key (ie musical note) of circle of fifths"*)

- **The grammar** (`core/fluid/inject2.js`, FLUID2's slot; `docs/plans/FLUID2-EMITTERS.md` §0 the decisions against the proposal): inject.js's
  plan() runs on the shared base state (never written here) and its splats are RE-PLACED by kind onto a fixed, mirror-symmetric, invisible rig
  of 23 mouths in three sizes — the WHERE is the rig's, the force and the area-weighted ink (the §111 budget's units) are the base's to 1e-9.
  FLOOR: five washes (x .5 ± {0, .2, .4}, sizes 2 / 1.5 / 1) — the sub's ink and lift from the centre, the inner pair joining above
  `SPREAD_B` (.5 buildLive); the kick's impulse from the mouth the CHASE picks: even phrases ping-pong L R C R L C over the inner pair, odd
  phrases inside → out (centre, the inner pair at √½ each, the outer pair only above `OUTER_T` .6 tension / build — held back for the drop).
  SIDES: three spots per wall (x .08 / .92, y .5 / .7 / .3) — the snare's mirror pair inward at the height the 16-beat phrase's quarter picks
  (middle, upper, lower, middle), the chord's at the centroid's third. TOP: seven beams (x .5 ± .14·k, y .92, size ½) — the hats on the odd
  beams on even bars, the even on odd, each run outside → in; no hashed x. INSIDE: the floor cloud at the centre and a quad (± .2, ± .18)
  whose lower / upper pairs join above tension .35 / .65, the ink shared. LEAD (the vocal / melody channel): the strongest note above the
  bass — `interval` over the bass note, the chroma's lead (a true vocal detector is S5b's `voxS / voxHz`, two reads to swap in) — takes
  `LEAD_SHARE` .5 of the floor's ink at centre stage, its HEIGHT its pitch (the scale degree above the tonic, y .3 → .85), eased `LEAD_TAU`
  .35 s (the table below: 12 degree bins on every track, the feature is restless — a glide, not a hop) with a small push along its move;
  a re-entry after a rest starts at its note. DROP: the §113 shockwave is GONE under FLUID2 (`ring` null, no 'drop' impulse); the §107 /
  §111 clear stays, and on its frame every mouth pulses once — the BLINDER (floor up, sides in, top down, the inside's ink). COLOUR: every
  splat in the hue of ITS NOTE on the circle of fifths (keycolour's wheel with the mode's pull, as the key's own hue), normalised to the
  base colour's luminance sum (unnormalised the pool read .81–.88 of the base's ink); the sub and the kick in the bass note's, the lead in
  its own, the floor / sides / hats / blinder in the key's; `NOTE_COL 0` the key's on everything. New reads: `interval`, `phrase16Pos`,
  `bar`. fluid.js unchanged (the plumbing for a grammar's optional fields stays; the rig returns none but `rig` for the rulers).
- **The sub does not snap to a fifths mouth** (the proposal's (b)): the user's "pitch is vertical" ends the horizontal pitch axis in
  this slot — the bass enters at the centre wash, and the only pitch → position is the lead's height. The sub's y stays the base's register.
- **The eight-track table** (no GL, `tools/truth/traces/*-map1.json` + the pad take; the scratch ruler's columns):

| track | frames | music s | Σ ink rig / base (NOTE_COL 1: the note hues luminance) | clears | kicks C · iL · iR · oL · oR (pairs) | outer before 1st clear | snare q0·q1·q2·q3 | beams 0..6 | lead on % · deg bins · y p10/p50/p90 | lead max step | clears = blinders | quad % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Comptine-map1 | 6601 | 110 | 1.000 | 0 | 64 · 79 · 78 · 7 · 7 (57) | 7 | 66·75·56·45 | 12 6 11 6 12 5 12 | 88 · 12 · 0.49/0.59/0.68 | 0.0192 | 0 = 0 | 45 |
| CyborgNinja-map1 | 6601 | 110 | 1.000 | 0 | 462 · 444 · 463 · 0 · 0 (283) | 0 | 156·203·153·161 | 110 142 110 133 112 137 108 | 51 · 12 · 0.41/0.54/0.70 | 0.0256 | 0 = 0 | 30 |
| IBelongHere-map1 | 6601 | 110 | 1.000 | 3 | 191 · 208 · 202 · 5 · 5 (137) | 0 | 72·73·84·68 | 51 57 49 53 53 52 49 | 86 · 12 · 0.48/0.63/0.74 | 0.0237 | 3 = 3 | 46 |
| Malicious-map1 | 6601 | 110 | 1.000 | 0 | 45 · 52 · 36 · 0 · 0 (23) | 0 | 39·32·20·21 | 21 19 22 21 18 20 22 | 70 · 12 · 0.50/0.65/0.75 | 0.0228 | 0 = 0 | 44 |
| RaindropsOnRoses-map1 | 6601 | 110 | 1.000 | 3 | 120 · 135 · 133 · 5 · 5 (93) | 0 | 85·93·83·67 | 77 101 82 95 82 98 81 | 83 · 12 · 0.52/0.65/0.71 | 0.0210 | 3 = 3 | 45 |
| SeeYouDrop-map1 | 6601 | 110 | 1.000 | 2 | 170 · 176 · 186 · 7 · 7 (108) | 7 | 84·85·89·46 | 38 37 40 38 35 37 34 | 83 · 12 · 0.42/0.49/0.65 | 0.0255 | 2 = 2 | 48 |
| Vienna-map1 | 6601 | 110 | 1.000 | 1 | 80 · 96 · 98 · 3 · 3 (47) | 3 | 32·61·36·18 | 45 65 49 63 41 63 45 | 67 · 12 · 0.49/0.62/0.77 | 0.0237 | 1 = 1 | 40 |
| WhoLikesToParty-map1 | 6601 | 110 | 1.000 | 1 | 440 · 454 · 460 · 0 · 0 (267) | 0 | 140·145·125·135 | 83 113 88 120 82 116 83 | 61 · 12 · 0.40/0.62/0.75 | 0.0256 | 1 = 1 | 24 |
| rec-map0 | 1465 | 22 | 1.000 | 0 | 0 · 3 · 0 · 0 · 0 (0) | 0 | 1·5·1·2 | 0 3 0 2 0 2 0 | 83 · 7 · 0.46/0.64/0.76 | 0.0161 | 0 = 0 | 52 |

  Read: Σ area-weighted ink = the base's on every trace; the inner floor pair within 7 % L / R; the outer pair opens only on tension /
  build (Comptine 7, SeeYouDrop 7, Vienna 3 frames above OUTER_T before any clear — builds); the snare walks all four quarters; all seven
  beams, odd / even by the bar; the lead on 51–88 % of the music frames, 12 degree bins per track, its largest per-frame step .026 (the
  glide's cap on a whole-octave leap .55 · (1 − e^(−1/21)) = .026); the blinder = the clears (3 / 3 / 2 / 1 / 1 / 3).
- **The tests** (`tools/test_fluid.js`, the bands block — 342 ok): every splat on a rig mouth (or the lead's centre column) on 600 synthetic
  frames and SeeYouDrop's 6601 real ones; ring null everywhere and no 'drop' kind; 23 blinder pulses exactly on the clear's frames; the
  body / params / drop / ink rate the base's; Σ area-weighted ink = the base's to 1e-9 and Σ|dv| within the pair split; the inner pair's
  symmetry (synthetic to a cut cycle, real within 15 %); the top chase's seven beams disjoint by bar parity; the lead's height the degree's
  (settled within the ease's residual after 50 frames), its largest adjacent-frame step ≤ the ease's; no lead on interval 0; NOTE_COL 0 → the
  base's colour on every splat; the outer pair never below OUTER_T before the first clear; determinism; the shared base state (the mixed
  300-frame run's base state = plan() alone's to the byte, the body and params too); the Proxy.
- **The gates:** `node tools/check.js` 144 modules · 0 fail · 4 warn; `npm test` exit 0; `node tools/license.js --check` 147 / 0.
  FLUID's pixels cannot move (the grammar runs only while FLUID2 owns the pool; the base state is read, never written): the fake s0 pair
  and the real-md5 s0 lines stand; the s1 lines move by construction (re-based by the next real sweep).
- **The eye** (`tools/accept/v0.38/fluid2-s121-{RaindropsOnRoses,SeeYouDrop}-montage.jpg` — FLUID left, FLUID2 right, the same
  deterministic frames: Raindrops at 84 / 90 / 118 / 124 s from `at=80`, SeeYouDrop at 57 / 57.7 / 58.5 / 62 s from `at=50`; errs [] on
  all four runs): where FLUID is one central mass with the bass sliding it, FLUID2 is a symmetric picture — the side spots' ink at the
  walls, the quad's clouds at the four corners, the floor's washes along the bottom, the beams a row along the top; the LEAD is a tall
  thin column at centre in ITS note's hue (purple against Raindrops' cyan key in the breakdown at 118 / 124 s, pale against SeeYouDrop's
  green at 62 s); on SeeYouDrop's drop frame (57.7) FLUID shows the §113 ring at the centre and FLUID2 shows every mouth lit with no ring
  (the blinder), and at 58.5 s FLUID2's centre mushroom is the kick from the centre wash. The table's script is beside the montages
  (`fluid2-s121-rig-tracks.{mjs,md}`).
- **Not tagged, not pushed.** The user's eye first (`#scene=1` on the dev server); every remark in track time is a K2 retune on all eight
  tracks (CONTRACTS §1.1).

