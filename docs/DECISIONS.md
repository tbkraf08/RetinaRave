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


## §122 The vocal ground truth — Demucs labels, the ear rules (2026-10-11, the vocal detector's step 1 of three, `docs/plans/VOCAL-PLAN.md`; the user: *"plan next session: 1. ground truth first 2. live mode with tier2 CNN 3. file mode with demucs vocal stem"*)

- **What ran** (the worktree branch `vox-truth`; nothing in the engine moved): `pip install --user demucs librosa` (Demucs 4.1.0, librosa 0.11.0,
  soundfile 0.14.0 in the user site; torch 2.12.0+cu130 untouched, no CUDA — CPU only), then `demucs -n htdemucs --two-stems=vocals` on
  the eight library tracks + the pad take (`tools/work/fluid-diag/music/rec.wav` copied as `PadRec.wav`) into the ABSOLUTE
  `tools/work/vox/htdemucs/<T>/{vocals,no_vocals}.wav` of the main checkout (gitignored; the stems outlive the worktree; never served,
  never bundled). Two lanes of 14 threads on the 28 cores: 75–124 s per track, the whole pass 7 min (`tools/work/vox/demucs.log`).
- **`tools/truth/voxtruth.py <T> [--render]`** (new; numpy + soundfile + librosa; clicktrack.py's click synthesis imported, not copied)
  → `tools/truth/<T>.vox.json`: per 10 ms hop over the stem the vocal SHARE rms(stem)/rms(mix) (23 ms frames, box .1 s, clipped 1.5),
  pYIN f0 on the stem (65–1050 Hz, 2048-sample frames, −1 unvoiced) and its voiced probability; the proposed sung WINDOWS = share ≥ a
  knee on the track's own range (max(.08, p10 + .3·(p95 − p10)) over the music frames — the mix within 40 dB of its p95; an
  instrumental's leak never clears .08) for ≥ 1 s with gaps under .5 s bridged, each with its mean share and median f0; the PASSAGES =
  the same windows with phrase gaps under 2 s bridged (IBelongHere's verses are 52 windows and 10 passages — the clicks and the table
  are the passages', the windows are the detector's frame-level grain; this is the one deviation from the plan's "a click at each
  window's edge": 52 click pairs in four minutes answer nothing). RaindropsOnRoses' breakdown lead is `LEAD` 111–137 → `kind: 'lead'`
  on the window and passage that cover it (1:51.5–2:17.1 found, .47 share, C4 — marked on purpose, the detector SHOULD read it).
  `windows_hand` is never written by the script and survives every re-run; the three arrays are complete (share 4 decimals, f0 1,
  vprob 3; 2.9 MB over the nine files) because the same file is step 3's lane. `provenance` carries the labeller, the Demucs / librosa
  lines, the method sentence and the Jamendo licence line. `windows.py` now writes a `vox` key per track (`tools/truth/<T>.vox.json`,
  the pad take's `rec` → `PadRec.vox.json`); `windows.json` regenerated — only the nine `vox` keys moved.
- **The table** (Demucs wall = one lane of 14 threads; music s = frames within 40 dB of the mix's p95; voiced % = windowed music frames;
  the passages in track time with their mean share; f0 = pYIN p10 / p50 / p90 inside the windows where voiced ≥ .5):

| track | Demucs wall | music s | voiced % | knee (share p95) | windows / passages | the passages (track time; share) | f0 p10 / p50 / p90 Hz |
|---|---|---|---|---|---|---|---|
| Comptine (the no-voice control) | 74.7 s | 144.4 | **0.0** | .080 (.002) | 0 / 0 | none | — |
| IBelongHere (vocal house) | 114.8 s | 229.1 | **68.3** | .293 (.893) | 52 / 10 | 0:00–0:06 (.46) · 0:08–0:14 (.43) · 0:17–0:47 (.39) · 0:50–1:10 (.51) · 1:14–1:18 (.46) · 1:22–2:33 (.41) · 2:36–2:38 (.73) · 2:44–3:06 (.52) · 3:08–3:13 (.37) · 3:16–3:48 (.44) | 222 / 335 / 523 (A3 / E4 / C5) |
| RaindropsOnRoses | 113.0 s | 218.1 | **41.7** | .300 (.996) | 13 / 10 | 0:00.5–0:41 (.88, the sung intro before the 24 s start) · 0:52–0:53 · 0:55–1:02 (.25) · 1:09–1:14 · 1:17–1:21 (.27) · **1:51.5–2:17 (.47, LEAD, C4)** · 2:28–2:29 · 2:45–2:47 (.30) · 2:59–3:05 (.26) · 3:07–3:10 | 254 / 302 / 427 (B3 / D4 / A4) |
| CyborgNinja | 89.6 s | 180.0 | **0.0** | .080 (.005) | 0 / 0 | none (stem max share .09, under the knee) | — |
| Malicious | 110.5 s | 221.1 | 0.5 | .080 (.009) | 1 / 1 | 0:13.4–0:14.6 (.20, E5 — one shot) | 668 / 678 / 705 |
| SeeYouDrop | 87.5 s | 157.2 | **44.2** | .141 (.468) | 11 / 7 | 0:10–0:47 (.22, C#5) · 0:50–0:58 (.52, unvoiced) · 1:05–1:12 (.10, A5) · 1:30–1:42 (.19, C5) · 1:57–2:04 (.19, unvoiced) · 2:11–2:13 (.18, C#4) · 2:36–2:37 (.35, D4) | 276 / 282 / 821 |
| Vienna | 98.4 s | 192.7 | **0.0** | .080 (.006) | 0 / 0 | none | — |
| WhoLikesToParty | 123.6 s | 253.5 | **20.1** | .083 (.237) | 25 / 14 | 0:01–0:16 (.12) · 0:37–0:39 · 0:41–0:43 · 0:46–0:47 · 0:50–0:57 (.20) · 0:59–1:13 (.11) · 1:51–1:52 · 1:55–1:57 · 2:04–2:11 (.23) · 2:14–2:16 · 2:25–2:27 · 3:01–3:08 (.19) · 3:11–3:13 · 3:23–3:24 | none voiced (pYIN < .5 throughout: shouted, not sung) |
| PadRec (the pad take, 24.5 s) | 14.2 s | 22.0 | **0.0** | .080 (.003) | 0 / 0 | none (FLUID-DIAG's "pads, vocal" intro: Demucs hears no voice in it) | — |

  Read: the control is clean (Comptine .002, CyborgNinja .005, Vienna .006, the pad .003 at p95 — a two-stem pass leaks under 1 % of
  the mix's rms into the vocal stem on an instrumental, and the .08 floor holds with a 10× margin); IBelongHere is sung over two thirds
  of its music frames, not only in the survey's intro + breakdowns (0–16, 48–64, 112–130, 144–178, 208–233 s are all inside the
  passages, and so are the verses between); Raindrops' intro is a voice at .88 share and the lead is where the user put it; SeeYouDrop's
  44 % at C#5 / A5 with a .52 passage pYIN calls unvoiced, and WhoLikesToParty's 20 % with no voicing at all, are the ear's calls —
  a vocal chop, a shout, or a synth the separator took for a voice (the stem render says which). Malicious has one shot.
- **The ear's renders** (`~/Music/RetinaRave-clicks/`, 18 files, never played here): `<T>-vox-windows.wav` = the mix at .85 with
  clicktrack.py's section double-click (3 kHz, 2 × 15 ms, −6 dB re peak) where a passage OPENS and its drop click (400 Hz 120 ms, +6 dB)
  where it CLOSES; `<T>-vox-stem.wav` = the Demucs vocal stem alone, 16-bit stereo 44.1 kHz. Listening order: Comptine (the control —
  silence and no clicks is the pass), IBelongHere (the known reference), RaindropsOnRoses (the lead), CyborgNinja, Malicious, SeeYouDrop,
  Vienna, WhoLikesToParty, the pad take; windows before stem per track. **The user answers in track time** ("vocals 48–64, the 112
  one is a synth") → `windows_hand: [{from, to, kind?}]` in the json by hand (PENDING THE EAR — no hand window exists yet; the script
  keeps the key on every re-run); `windows.json`'s `vox` keys already point at the files.
- **Jamendo** (step 2's public training set): Mathieu Ramona's original host `mathieuramona.com` no longer resolves; the corpus lives on
  Zenodo as record 2585988 ("Jamendo Corpus for Singing Voice Detection", `jamando.zip`, 327 156 782 bytes, metadata licence
  `cc-by-4.0`) → `~/Datasets/jamendo-svd/jamendo/{audio (75 ogg + 18 mp3, 317 MB), labels (93 .lab: `from to sing|nosing`),
  filelists (train 61 / valid 16 / test 16)}`. The licence line, verbatim from its README and now in every `.vox.json`'s provenance and
  in `~/Datasets/jamendo-svd/LICENCE-NOTE.md`: *"This is a public corpus of 93 creative-commons licensed music pieces annotated by voice
  (sung or spoken) and no-voice."* The per-piece CC terms (BY / SA / NC) are NOT in the archive — the weights question below.
- **Credits** ([[feedback-credit-where-due]]): THIRD-PARTY.md gains Demucs (Défossez et al., MIT, the licence reproduced), librosa
  (ISC, reproduced) and the Jamendo corpus (CC BY 4.0 on Zenodo; not in the repo). `voxtruth.py` carries the licence header
  (`license.js` stamps .js / .html only; the `.vox.json` files are data like every `tools/truth/*.json`, no header).
- **Open for the user** (the plan's three, verbatim): (a) the weights' licence given Jamendo's CC terms — ship or keep local;
  (b) in file mode, the lane wins or the CNN (recommended: the lane, the HUD says); (c) with `voxS` low the lead falls back to `interval`
  (today's chroma proxy) or goes dark (recommended: the share goes to 0, the floor keeps its ink — S5b's split).
- **The gates:** nothing in the engine moved — `node tools/check.js` 144 modules · 0 fail · 4 warn; `npm test` exit 0 (test_fluid 342 ok,
  test_music 151 ok — §121's numbers; the worktree needed main's gitignored `tools/truth/traces/*.json` linked in to run them);
  `node tools/license.js --check` 147 / 0. Not tagged, not pushed; the user's ear closes the step.
- **Addendum 2026-10-12 — the ear's verdict, and the three open questions closed** (the step-2 session, branch `vox-cnn`). The user on the
  18 renders: *"SeeYouDrop-vox-stem.wav is hard to tell because the sound is distorted and lined up with the other sounds so can understand
  the missed detection (but things have sounded accurate)"* — read: the Demucs PASSAGES stand as the hand windows on every track, so
  `windows_hand` = the `passages` list (from / to / kind) in each of the nine `tools/truth/<T>.vox.json`, `provenance.ear` carrying the
  date and the quote (Comptine / CyborgNinja / Vienna / the pad take: an empty hand — the control holds; Raindrops' 1:51.5–2:17 keeps
  `kind: 'lead'`). (b), answered: *"do the demucs for file; do cnn for live (note: I listen to live mode 90% of the time -> live mode is
  first concern)"* — the lane wins in file mode (step 3), the CNN alone in every live mode, and LIVE quality is what step 2 is built for.
  (a) and (c) were not answered; step 2 proceeds on the plan's recommendations and says so (§123): (a) the weights SHIP with
  attribution — the Jamendo corpus is CC BY 4.0 on Zenodo, so the credit goes in THIRD-PARTY.md, about.html's credits and the weights
  module's header, and the audio never ships; (c) with `voxS` low the LEAD's ink share goes to 0 and the floor keeps its ink
  (`LEAD_SHARE · voxS`), `interval` only as the fallback while `voxConf` is 0 (no detector read at all: the fake timeline, the old
  traces), the HUD's vox line says which source feeds the lead.


## §123 The live vocal detector — the tier-2 CNN in the ears, and the rig reads the voice (2026-10-12, the vocal detector's step 2 of three, `docs/plans/VOCAL-PLAN.md` §2; the user: *"do the demucs for file; do cnn for live (note: I listen to live mode 90% of the time -> live mode is first concern)"*; on step 1's renders: *"SeeYouDrop-vox-stem.wav is hard to tell because the sound is distorted and lined up with the other sounds so can understand the missed detection (but things have sounded accurate)"*)

- **What it is** (branch `vox-cnn`, one Fable session): three music-state keys, `voxS` (the vocal presence 0–1, eased .1 s), `voxHz` (the sung
  pitch in Hz, −1 none) and `voxConf` (0–1), from a new causal stage in the ears — `engine/ears/vox.js` beside the sub / perc / tonic
  lanes, its own ring of the mid signal, read-only to every other feature — and FLUID2's LEAD channel reading them (`core/fluid/inject2.js`).
  The FEATS entries (`ears/feats.js`), the `state.js` defaults 0 / −1 / 0 (the fake timeline's: `#test` never runs the ears), `EARS_FIELDS` +
  the history ring (the three appended at the END of `CONT`, so no other lane's index moved; `voxHz` is categorical in `read()` — the
  average of −1 and 300 Hz is not a pitch), FLUID2's help text, and the HUD's vox line (`vox S .xx hz 262 conf .xx lead ← live | interval`;
  step 3 adds `lane`). Parity's 72 untouched. (b) answered: the lane wins in file mode (step 3), the CNN alone in every live mode. (a) and
  (c) on the plan's recommendations (§122's addendum): the weights SHIP with attribution; `LEAD_SHARE · voxS`, `interval` only while
  `voxConf` is 0.
- **The front end** (`vox.js`; `tools/truth/voxtrain.py` re-implements it in numpy to the hop): per 512-sample hop a 2048-point periodic-Hann
  FFT (the ears' own class) over the 2048 samples ending at the hop, the POWER in 40 triangular HTK-mel bands 100 Hz–8 kHz, ln(E + 1e-9),
  then a per-band CAUSAL running mean / variance (an exact cumulative mean until the count passes the 30 s exponential window) →
  (x − m) / sqrt(v + .0625): the model sees the track's own range, never an absolute level (§111 item 7's shape). The first FFT at hop 3.
  **The mel parity** (`tools/test_vox.js` (i)): the ears' log-mel on SeeYouDrop's first 3000 hops = numpy's to **7.05e-5 raw, 1.29e-5
  normalised** (the gate 1e-4; the float32 FFT is the whole difference).
- **The net, run as a STREAM** (`ears/vox-net.js`, plain Float32Array loops — node, the page, a Worker): 40 × **34** hops → conv 3×3 ×16 →
  ReLU → max-pool 2 → conv 3×3 ×16 → ReLU → max-pool 2 → dense 32 → ReLU → dense 1 → sigmoid, **38 385 parameters**. The plan's 32 hops
  became 34 and the convolutions VALID in time (same in frequency) so that every pooling pair is full and the NEWEST hop reaches the dense
  layer — and so that the net runs one column at a time as the hops arrive: one conv1 column per hop (~6 k multiply-adds), one conv2
  column per two (~46 k), the dense every four (~36 k) ≈ 38 k per hop, where a batch inference of the window every four hops is ~1 M per
  run. The output at hop N is EXACTLY the batch model on the window [N − 33, N], firing at hops ≡ 1 (mod 4) from the first column (the
  first at hop 33). **The ONNX parity** ((ii)): the JS stream on 200 held Jamendo-test windows vs onnxruntime on `tools/work/vox/vox.onnx`
  (the same fp16-rounded weights; torch vs onnxruntime 3.3e-6 on the logit) — **1.17e-6** on the sigmoid output (the gate 1e-4); the stream
  fires on the 34th column and never before, 200 / 200. The weights: `ears/vox-weights.js`, Float16 little-endian base64, **104 297 bytes**
  (the plan's ≈ 100 KB; fp32 would be twice that), the provenance and the Jamendo attribution in its header; `bundle.js` inlines it like
  any module — nothing is fetched, the landing's on-device promise holds.
- **The pitch** (`vox.js`): a second `Yin` (the sub's class) on a 200–1000 Hz band-passed (4th-order high + low, dsp.js 'steep') copy
  decimated to 12 kHz, a 20 ms window, CMND .15, run on every inference; `voxHz` = its f0 while `voxS` > .3 and the periodicity ≥ .6, −1
  otherwise; **`voxConf` = voxS × the periodicity measured on EVERY inference whether or not the gate is open** — so it is 0 only where there
  is no read at all (the fake timeline, digital silence, a trace recorded before this), which is the rig's cue for `interval`. A pitch read
  on a MIX: the honest ceiling of this tier, measured below.
- **The training** (`voxtrain.py`, torch CPU, 24 threads; the Jamendo singing-voice corpus — Zenodo 2585988, CC BY 4.0 — at 48 kHz mono, the
  .lab labels at the window's END, 61 train / 16 valid (picks the epoch) / 16 test; the library's `windows_hand` (a frame inside a hand window
  with the stem's share ≥ the track's knee is sung, outside every window not, under the knee inside one — a breath — dropped), ×2; from run 2
  the training tracks' Demucs ACCOMPANIMENTS as negatives and eight cross-track REMIXES of their vocal stems over another track's
  accompaniment at −9 … +2 dB, labelled by the stem's share of the remix (≥ .15 sung, ≤ .04 not); 12–14 epochs × 400 k windows, batch 512,
  Adam 1e-3 cosine, BCE, gain / tilt / level / noise jitter on the normalised input; 70–130 s per epoch). **Five runs, the whole story:**

| run | the data | held out (library) | Jamendo test F1 / AUC | IBelongHere F1 / AUC (unseen) | Comptine fp % | Vienna fp % |
|---|---|---|---|---|---|---|
| 1 | Jamendo + the six library mixes | IBelongHere, Comptine | .789 / .868 | .806 / .842 | **28.2 unseen** | 6.6 |
| 2 | + the accompaniments + the remixes (the remix labels wrong: a stem judged against its own p95 read 100 % sung) | IBelongHere, Comptine | .803 / .880 | .768 / .826 | **21.9 unseen** | 2.7 |
| 3 | the remix labels fixed (the stem's SHARE), BCE pos_weight .6 | IBelongHere, Comptine | .784 / .870 | .730 / .848 | **16.5 unseen** | 1.5 |
| 4 | Comptine trains, pos_weight 1 | IBelongHere, Vienna | .797 / .873 | .768 / .815 | 3.8 | **31.1 unseen** |
| 5 (ships) | every no-voice track trains; the valid-AUC pick is a high-recall epoch (R .87, P .73) | IBelongHere | .792 / .875 | .819 / .838 | 10.0 (test_vox, eased) | 6.0 |

  Read: **the target F1 ≥ .88 on Jamendo test is MISSED at .79–.80** — the 2015 nets it was taken from are ten times the size with 1.6 s of
  CENTRED context; this one is 38 k parameters over 363 ms, causal, and five runs sat within two points of each other. **An unseen
  instrumental reads as a voice on 17–31 % of its frames** (Comptine's solo piano three times, Vienna's synth leads once): nothing in
  Jamendo teaches a 363 ms net that a harmonic line in the voice band is not a voice, and the user listens to THIS library live 90 % of
  the time — so the shipped weights know every library track but IBelongHere (the one unseen control, F1 .82 / P .93), and the fix for the
  world outside the library is a piano / lead-synth negative set or a longer window, not a sixth run of this net. Run 4's weights were the
  better no-voice set (Comptine 3.8) but its ONNX / parity files were overwritten by run 5 and its checkpoint with them; run 5 is the one
  set with a consistent parity reference, so it ships.
- **The ruler** (`tools/test_vox.js` (iii): the 48 kHz PCM dumps through the stage, `windows_hand` from the `.vox.json`; voxS eased):

| track | hand s | voxS p50 in / out | ratio | fp % (≥ .5 outside) | lead p50 | voiced | voxHz: a pitch on / within a semitone / modulo the octave |
|---|---|---|---|---|---|---|---|
| Comptine (the control, in-sample) | 0 | – / .111 | – | **10.0 — MISSED (< 5)** | – | 0 | – |
| IBelongHere (unseen) | 199 | .694 / .216 | **3.2×** | 20.7 | – | 5549 | 60 / **53** / 58 % |
| RaindropsOnRoses | 94 | .884 / .171 | **5.2×** | 18.9 | **.987** (the lead, by design) | 2613 | 81 / **63** / 72 % |
| CyborgNinja | 0 | – / .084 | – | 1.1 | – | 0 | – |
| Malicious | 1 | .440 / .122 | 3.6× | 2.3 | – | 52 | 6 / 0 / 0 % |
| SeeYouDrop | 75 | .764 / .204 | **3.7×** | 13.2 | – | 206 | 28 / **14** / 18 % |
| Vienna | 0 | – / .139 | – | 6.0 | – | 0 | – |
| WhoLikesToParty (shouted chops, no pYIN voicing — recorded) | 64 | .222 / .201 | 1.1× | 5.7 | – | 0 | – |

  Read: the three voiced tracks clear 2× (3.2 / 5.2 / 3.7); Raindrops' lead reads as a voice (.987); the control MISSES its 5 % at 10 %
  (recorded as a miss in the test, never a FAIL — HARNESS's `gate: false` shape); WhoLikesToParty's hand windows (the ear accepted the
  Demucs passages; §122: "shouted, not sung", pYIN voiced nowhere) read 1.1× — by the §122 table's own definition it is not a voiced track,
  so its claim is recorded. **The mix ceiling on voxHz:** within a semitone of the stem's pYIN on 53 / 63 / 14 % of the voiced frames
  (IBelongHere / Raindrops / SeeYouDrop; the plan's 70 % recorded, not gated), 58 / 72 / 18 % with an octave error forgiven, a pitch at all
  on 60 / 81 / 28 % — on a mix the YIN takes the loudest periodic thing in 200–1000 Hz, which on SeeYouDrop's C#5 chops over a synth is
  the synth; step 3's lane is the accurate file-mode read. The fp % on the voiced tracks (13–21 %) is frames OUTSIDE the hand windows
  above .5: reverb tails, backing lines and the breaths the knee dropped — the ear's "things have sounded accurate" was about the passages.
- **The wiring proof** ((iv)): Ears on 30 s of SeeYouDrop with the stage vs with it stubbed — every one of the 31 other fields byte-identical
  at 60 fps; the vox fields reach `read()` (voxS max .994, voxHz −1 or 200–1000 Hz, voxConf 0 wherever voxS is 0). **The bench** ((v),
  HARNESS "Bench protocol", the machine idle): the stage alone — the sample loop (four biquads + the decimation + its ring), the FFT, the
  mel, the net, the YIN — **72.6 µs per hop median, p99 135, mean 78** (the gate ≤ 100 µs; the 2048 FFT is 45 of it); `Ears.push`
  .172 ms per 512 block with the stage against .072 without (+100 µs = the stage), inside the PCM listener, outside `frame()` — the frame
  budget unmoved. One inference per 4.01 hops.
- **The rig reads it** (`inject2.js`): while `voxConf` > 0 the LEAD's ink share = `LEAD_SHARE · voxS` (none under `VOX_ON` .1: a splat is a
  GPU pass), its height `p = 12·log2(voxHz / 440) + 69`, the scale degree of p mod 12 above the tonic as before plus `LEAD_OCT` .3 of the
  octave term clamp(log2(voxHz / 110) / 4, 0, 1), its hue the SUNG note's; a voiced frame with no pitch read holds the last height and hue;
  `voxConf` 0 = the §121 stand-in exactly as it was. `tools/test_fluid.js` grew eight claims (350 ok): the defaults keep `interval`; with a
  read the lead is live with share LEAD_SHARE × voxS and the lead's area-weighted ink is exactly that fraction of lead + floor (the floor
  keeps the rest), Σ ink = the base's to 1e-9 on the live path too, the height = the degree + the octave term after 50 frames on a note, the
  hue the sung pitch class, voxS under VOX_ON → no lead splat and the floor whole, the hold on voxHz −1. The §121 eight-track table stands:
  the traces predate the keys (voxConf 0 → `interval`).
- **The md5 proof.** The fake smoke (`tools/scene-md5.sh`): every line = the v0.35 reference but the s1 pair — and the s1 pair (293d773c /
  96ad310a) = main's at 5f18a4d, shot from a plain archive of its tree: the reference's s1 lines (0e92a1c4 / ed3283fc) were stale since
  §121 moved the rig onto s1 and no fake list was re-based after it. So: **unmoved on every line against main.** The real sweep
  (`tools/real-md5.sh`, both map modes): the roster **s0 / s2 / s3 / s4 — 264 of 264 lines = the v0.37 reference** (the stage is read-only to
  every other feature on real music, in the file map mode and the live lanes); the s1 lines: the addendum below (the sweep ran last).
- **Credits and the licence** ([[feedback-credit-where-due]]; the plan's (a)): the Jamendo corpus in THIRD-PARTY.md (what ships, what does
  not), in about.html's credits and in the weights module's header; the audio and the labels never leave this machine. `node tools/license.js
  --check` 150 / 0 (`vox.js`, `vox-net.js`, `vox-weights.js` new).
- **The gates:** `node tools/check.js` 147 modules · 0 fail · 4 warn (the soft caps); `node tools/test_vox.js` all ok (the Comptine miss
  recorded); `test_fluid.js` 350 ok; `npm test` exit 0 (`test_vox.js` added to it; the gitignored inputs it needs print their one-line fix
  when missing, the traces' rule). Not tagged, not pushed; the user's eye on `#scene=1` with the HUD's vox line is next, then step 3.
- **Addendum — the s1 sweep** (`SCENES=1 PAR=2 tools/real-md5.sh`, 66 runs, f0 2 on every run, no errs): **all 66 s1 lines moved, 0 held** —
  every track, both map modes and the pad take: the rig reads the live CNN in file mode too (the map has no vocal lane until step 3), so
  FLUID2's picture changed everywhere the voice did. The list is `tools/accept/v0.38/real-md5-s123-s1.txt` for the record; the full reference
  is re-based by the next release's sweep, never here (the roster's 264 lines held, above). `npm test` exit 0 with `test_vox.js` in it.
- **Addendum 2026-10-12 — VALIDATED BY EYE.** The user on `#scene=1` with the CNN feeding FLUID2's LEAD: *"looks good, continue
  with file mode"* — §123 stands as shipped (the five runs' weights, the eased `voxS`, the rig's two reads) and step 3 is next.


## §124 The file-mode vocal lane — the Demucs sidecar wins where it exists (2026-10-12, the vocal detector's step 3 of three, `docs/plans/VOCAL-PLAN.md` §3; the user: *"do the demucs for file; do cnn for live (note: I listen to live mode 90% of the time -> live mode is first concern)"*; on §123's eye check: *"looks good, continue with file mode"*)

- **What it is** (branch `vox-lane`, one Opus session, plumbing only — no new design, nothing retuned): in FILE mode `voxS` /
  `voxHz` / `voxConf` come from an offline sidecar beside the track instead of the live CNN. The sidecar is step 1's Demucs
  truth, which heard the voice non-causally on a SEPARATED stem — no mix ceiling on the pitch, no 363 ms causal window, no
  false voice in a piano line — and it costs the engine nothing at run time. §123's CNN is untouched and still answers in
  every live mode, which is where the user listens 90 % of the time. The rig (`core/fluid/inject2.js`) did not move: it reads
  the three keys and `voxConf > 0`, and cannot tell which source filled them — the whole point of the plan's one interface.
- **The lane** (`tools/truth/voxlane.py <T> [--all]`, new) → `$MUSIC/<T>.vox.json`: `{ track, sr, hop .01, n, voxS[], voxHz[],
  voxConf[], provenance }` from `tools/truth/<T>.vox.json`'s `share` / `f0` / `vprob`.
  · `voxS` = the share with §122's own window KNEE AT .5 — the share is `rms(stem)/rms(mix)`, whose scale is the track's own
  (IBelongHere's sung p95 .89, SeeYouDrop's .47, WhoLikesToParty's .24), so p10 → knee maps to 0 → .5 and knee → p95 to .5 → 1,
  clipped both ends (the upper span floored at .1 where an instrumental's p95 sits UNDER the .08 knee floor). A lane frame reads
  ≥ .5 exactly where §122's frame-level rule says "sung", so the live tier's own .3 and .5 gates keep their meaning.
  · 0 / −1 / the floor OUTSIDE the music frames (the mix more than 40 dB under its own p95), which is voxtruth's mask
  re-derived from the mix rather than guessed: the pad take's fade read ≥ the knee on 10.5 % of its frames with no voice in it
  at all, because a ratio of two almost-zero levels can read anything. §122's knee is computed over the music frames for the
  same reason.
  · `voxHz` = `f0` where `vprob ≥ .5`, −1 elsewhere. · `voxConf` = `max(.001, vprob · voxS)` — the FLOOR is deliberate: the
  rig's switch is `voxConf > 0` = "the detector has a read at all", and a lane has a read on every frame of the track, so
  without a floor FLUID2's lead would flicker back to §121's `interval` stand-in through every instrumental bar of a file.
- **The plumbing, in order.** `tools/serve.js` serves `/music/<T>.vox.json` on the SAME route as the audio (the `.json` mime
  added; the path guard untouched — a name with a separator or `..` is still refused 400, an absent lane is 404). The file
  source fetches it with the track's own `encodeURIComponent` and keeps it on `F.vox`, **before `F.ready`** so the map's gate
  always sees it; awaited, not raced, because in deterministic mode the clock is still held and in real time the buffer node
  has not started — neither mode's `frame0` moves. `map.js` gains the lane beside `mapSubAt`: `voxLane(json)` packs it into
  three Float32Arrays (or returns null on a stale shape), `mapVoxAt(lane, t)` reads the NEAREST frame at heard time, never an
  interpolation (`voxHz` is categorical; the 10 ms grid is at most 5 ms away, a third of a frame). `features-ears.js` attaches
  it to the map it builds and overwrites the three keys inside the map branch, exactly as `map.sub` overwrites the causal sub.
  The live stage KEEPS RUNNING in file mode: its cost is paid in the PCM listener before this stage can know a lane exists,
  and skipping it would be neither trivial nor byte-safe.
- **The switch and the HUD.** `&vox=live` (ENGINE.voxLane false) leaves the CNN's values standing on a file — the A/B, and the
  only way to shoot the live tier's picture on a track; `&vox=lane` is the default. The HUD's vox line says which source fed
  the rig: `lead ← lane | live | interval`, off `EARS.voxFrom` — **no MS field was added for it**, so FEATS, parity's 72 and
  every trace column are as §123 left them. Proven on the page (det, `CLOCK=1`, RaindropsOnRoses at 24 s, scene 1, frame 3000
  = heard 73.967 s): with the lane `voxS / voxHz / voxConf` = .088 / 281.9 / .060, byte-exact the lane file's frame 7397;
  with `&vox=live` AND with `&map=0`, the same .3869 / −1 / .0399 — the CNN, unperturbed by the fetch.
- **The A/B** (`tools/vox-ab.js`, new, no GL: the live stage replayed over the 48 kHz PCM dumps in node against the lane the
  page fetches; `sung %` = frames with `voxS ≥ .3`, `agree %` = both above the gate or both below, `pitched %` = frames where
  BOTH publish a pitch as a share of the frames the LANE pitches, `semi %` = of those, within 100 cents of the lane's):

| track | lane KB | sung % lane / live | agree % | both % | lane pitched | pitched % | semi % | oct % | lag ms | r |
|---|---|---|---|---|---|---|---|---|---|---|
| Comptine (the no-voice control) | 208 | **0.0** / 23.6 | 76.4 | 0.0 | 98 | 19 | 26 | 42 | — | −.17 |
| IBelongHere (vocal house) | 350 | **67.6** / 72.5 | 70.3 | 55.2 | 6219 | 58 | **87** | 96 | **180** | .53 |
| RaindropsOnRoses | 331 | **44.2** / 60.0 | 75.6 | 39.9 | 5089 | 56 | **77** | 88 | **150** | .73 |
| CyborgNinja | 261 | 0.4 / 5.9 | 93.8 | 0.0 | 151 | 5 | 0 | 14 | — | .17 |
| Malicious | 321 | 1.9 / 12.3 | 86.8 | 0.5 | 584 | 5 | 0 | 0 | — | .12 |
| SeeYouDrop | 227 | **47.2** / 56.4 | 73.3 | 38.5 | 682 | 13 | **48** | 61 | **160** | .70 |
| Vienna | 281 | 1.4 / 22.1 | 78.2 | 0.9 | 589 | 15 | 79 | 79 | — | .19 |
| WhoLikesToParty (shouted chops) | 367 | 22.5 / 27.6 | 64.8 | 7.5 | **0** | — | — | — | — | .20 |

  Read: on the three voiced tracks the two sources agree about "is someone singing" on **70 / 76 / 73 %** of frames, and where
  both pitch, the CNN is within a semitone of the lane on **87 / 77 / 48 %** (SeeYouDrop's C#5 chops over a synth are the mix
  ceiling §123 already measured against the stem's pYIN — 14 % there, 48 % here against the lane, the same story). The CNN
  reads MORE voice than the lane on every single track: +24 points on Comptine's solo piano, +21 on Vienna, +10 on Malicious,
  +5 to +16 on the voiced three — §123's "an unseen instrumental reads as a voice on 17–31 % of frames" seen from the other
  side, and the plainest argument for the lane in file mode. **The CNN's lag, by cross-correlation of the two `voxS` series:
  median 160 ms (150 / 160 / 180 on the voiced three)** — the ~100 ms the causal front end owes plus the .1 s ease, measured
  at last rather than estimated. A lag only means something where the series share a signal, so it prints `-` below r .3: on a
  no-voice track the argmax lands on the search bound and says nothing. WhoLikesToParty's lane pitches NOTHING (§122: "shouted,
  not sung" — pYIN voiced nowhere), so its pitch columns are empty by construction, not by failure.
- **What the lane costs.** Live: **nothing** — no lane is fetched, built or read in capture, mic or demo mode, and the live
  stage's 72.6 µs per hop (§123) is unchanged in every mode. File: one fetch of **208–367 KB** per track (2.4 MB for the nine
  lanes), decoded once into three Float32Arrays, then one `Math.round` and three array reads per frame; the map build it waits
  behind is 1.6 s. **A tab share has no lane and no file** — live mode is the CNN alone, which is why step 2 came first.
- **Local only by construction**, like the tracks themselves: `$MUSIC` is the one directory `serve.js` serves from and the one
  place `tools/bundle.js` and `npm run build` cannot see, so no lane can be bundled or deployed. Nothing on retinarave.com
  changes. The pad take's lane goes beside `rec.wav` as `rec.vox.json` and is never read (a take is `map0only` in
  `windows.json`: the live lanes, no map).
- **The md5 proof.** The fake smoke (`tools/scene-md5.sh s124`, errs [] hop 840 row 72 on all six ids): every line = the v0.35
  reference but the s1 pair, and the s1 pair = **293d773c / 96ad310a — main's, to the byte** (§123 shot that pair from a plain
  archive of main's tree and recorded why the reference's s1 lines are stale: no fake list was re-based after §121 moved the rig
  onto s1). So **unmoved on every line against main** — the fake timeline has no file, so it has no lane, and the stage's map
  branch never runs there. The real sweep (`GPU=1 PORT=8930 SCENES=1 tools/real-md5.sh s124`, 43 runs, 66 lines, 789 s wall, f0 2
  on every run, no errs, no WARN): **all 32 `&map=1` lines moved and all 34 `&map=0` lines HELD to the byte** — every one of the
  eight tracks changed in file mode (even Comptine's, where the lane reads 0 and the rig's lead goes dark instead of splatting on
  the CNN's false piano voice) and the live path is untouched, including the pad take's two `map0only` lines. That is the shape
  the step predicted: the lane exists only in file mode with the map on, and only FLUID2 reads the voice. The list is
  `tools/accept/v0.38/real-md5-s124-s1.txt`; the full reference is re-based by the next release's sweep, never here. The roster's
  264 lines (s0 / s2 / s3 / s4) were not re-shot: no roster scene reads a vox field (`FLUID_FEATS` is FLUID2's) and §123's sweep
  already held them against the v0.37 reference with the three keys live in both map modes.
- **The gates:** `node tools/check.js` 147 modules · 0 fail · 4 warn (the soft caps); `npm test` exit 0 — `test_vox.js` all ok
  (§123's Comptine miss still recorded as a note) with its new **(vi) the lane's grid**: `voxLane` / `mapVoxAt` put the 10 ms
  sidecar on the 60 fps clock with the index == `round(t / hop)` and **no drift over an hour of frames**, `voxHz` never averaged
  with its −1, the ends clamped, no lane = 0 / −1 / 0; `test_fluid.js` 350 ok and `test_music.js` 151 ok unchanged (the traces
  predate the keys, so the rig still reads `interval` there); `node tools/license.js --check` 150 / 0. Not tagged, not pushed,
  nothing deployed — the user tags. **To A/B at home:** `#track=<T>&scene=1` is the lane and `#track=<T>&scene=1&vox=live` is the
  CNN, with the HUD's `lead ←` saying which.

## §125 v0.38 tagged — the engine learns to hear a voice (2026-10-12, one Opus worker on main; the user: *"tag and deploy"*)

- **What ships** (everything on `main` since v0.37 — 16 commits, five sections; this note adds no code): **§120 the FLUID2 reset** — the §116
  band grammar pulled on the user's *"I'm not a fan of fluid2 (it moves too quickly)"*, `inject2.js` the identity, the slot kept ·
  **§121 the RIG** — the emitter array built in one step on the user's five decisions: **23 invisible mouths** lining the two sides and the
  top and set symmetrically inside, each part of the music on its own mouths, a run across them a chase, every splat in its note's hue off
  the circle of fifths (luminance-normalised, the budget the base's), the LEAD channel's **height = pitch**, no shockwave, the blinder on
  the clear · **§122 the vocal ground truth** — Demucs `htdemucs` vocal stems + librosa pYIN through `tools/truth/voxtruth.py`, the hand
  windows and passages the detector is measured against, the ear rules · **§123 the LIVE tier-2 CNN in the ears** — `engine/ears/vox.js`
  (a causal stage beside sub / perc / tonic, read-only to every other feature), `ears/vox-net.js` (38 385 parameters run as a STREAM, one
  column per hop), `ears/vox-weights.js` (104 297 bytes, Float16 base64, inlined by the bundler), the three keys `voxS` / `voxHz` /
  `voxConf`, and FLUID2's LEAD reading them · **§124 the FILE-mode Demucs lane** — `tools/truth/voxlane.py` → `$MUSIC/<T>.vox.json`,
  served beside the audio, overwriting the three keys in the map branch exactly as `map.sub` overwrites the causal sub, with `&vox=live`
  the A/B and the HUD's `lead ← lane | live | interval` saying which source fed the picture.
- **The class is `engine`, and the entry names all FIVE sections, not the three the brief listed.** A new causal stage in the ears and
  three new music-state keys is an engine release: no scene was added and no id moved. But §120 and §121 landed after v0.37's tag and ship
  here, and **v0.37's own release entry described the band grammar §120 pulls at length** — a visitor who read it and presses `2` is owed
  the sentence that it is gone and what replaced it. So `decisions` is `[§120, §121, §122, §123, §124]` and the body's second paragraph is
  the rig before the voice. Nothing else in the entry, and no line of code, moved for that call.
- **What the entry says about the limits, in a visitor's words** (the honest word, in the house voice — §123's numbers without the table):
  *"the network is small and hears only a third of a second at a time, so it is quick rather than clever. It knows the eight tracks in my
  own library well; on music it has never heard, a solo piano or a lead synth sitting in the voice's range can read as a voice on a fifth
  of the frames, and a pitch taken off a full mix lands within a semitone about three times in four when there is a clear lead vocal, less
  when the voice is a chopped sample riding over a synth."* The weights ship and the page fetches nothing — *"the weights are part of the
  page, so nothing is fetched and nothing leaves your device. The on-device promise on the landing page is unchanged."* The second, more
  accurate route is named as what it is: **local only**, a file on this machine, with the switch and the HUD readout for the A/B.
- **The credits were already in place and were PROVEN to render, not re-written** ([[feedback-credit-where-due]]): `THIRD-PARTY.md` carries
  Demucs (§122), librosa (§122, its licence reproduced in full) and **the Jamendo singing-voice corpus (Zenodo 2585988, CC BY 4.0,
  "not in the repo")**; `site/about.html` carries the Jamendo paragraph — *"The weights ship with the engine; the music does not"* — and
  its DOM was read on the live `/about` route to confirm both the corpus line and the `CC BY 4.0` string. The weights module's own header
  carries the provenance. **Nothing was added for this tag.**
- **The recipe (§91's ritual as §119's, the three-page rule standing).** `package.json` + `assets/core/version.js` 0.37.0 → 0.38.0
  (together, §89) · `releases.json` top entry (`v0.38`, 2026-10-12, class `engine`, title *"The engine learns to hear a voice"*, the five
  §s, `scenes: [1]`, no clip) — **hand-inserted as `JSON.stringify(rel, null, 1)`, which is the file's own
  layout to the byte — a 19-line pure insertion.** `releases.js`'s own `save()` writes a DIFFERENT, compact layout: calling it
  reformatted the whole file for a 546-line diff, so it was reverted and the round-trip (`JSON.stringify(load(), null, 1) + '\n'` ==
  the file) was checked identical before the insertion. **A note for the next tag: add the entry by hand in indent-1, never through
  `save()`** · `npm run build` (36 entries → `site/whats-new.html` 47 KB, the card's `#newin` line *New in v0.38: The engine learns to hear a
  voice*, `dist/index.html` **146 modules, 1 468 403 bytes**) · `node tools/bundle.js releases/retinarave-v0.38.html` (**146 modules,
  1 468 403 bytes**, `VER = '0.38.0'`; v0.37's frozen page was 143 / 1 380 695 — the +3 modules are `vox.js`, `vox-net.js` and
  `vox-weights.js` and the **+87 708 bytes are almost all the weights**) · `git rm releases/retinarave-v0.35.html` (the three-page rule;
  `releases/` keeps v0.36 / v0.37 / v0.38, and v0.35's page is in history at its tag).
- **The gates, each green on the tree AFTER the bump, with wall times.** The receipt with every number is
  `tools/accept/v0.38/tag-v0.38-2026-10-12.txt`:
  1. `node tools/check.js` — 0.5 s — **147 modules · uniforms 159 · MS keys 223 · scenes 6 (help.feats gaps 0) · 0 fail · 4 warn** (the
     line-cap warns only; v0.37 read 5 — `core/fluid/inject2.js` dropped back under the soft cap when §120 pulled the band grammar) ·
     `releases.js check` **36 entries, top v0.38 == package.json 0.38.0, 0 problems** · `whatsnew --check` up to date ·
     `license.js --check` **150 public files, 0 without the header** (147 at v0.37 + the three new vox modules).
  2. `npm test` — 29.4 s, **exit 0** — `test_vox.js` all ok across its six blocks (the mel parity against numpy, the ONNX parity of the
     streaming net, the per-track ruler, the wiring's 31 byte-identical fields, the bench, and §124's **(vi) the lane's grid** — no drift
     over an hour of frames); `test_fluid` **350 ok**, `test_music` **151 ok**, every other suite OK. §123's Comptine false-positive miss
     still prints as a **note**, never a FAIL (HARNESS's `gate: false` shape): *10.05 % against the plan's < 5 %*.
  3. the frozen page from `file://`, headless, **CLOCK=1** GPU=1 (`FILE=$PWD/releases/retinarave-v0.38.html`) — `test&scene=0` →
     `{sc 0, grammar pool, fluidOn true, errs [], bad [], frameN 300}` · `test&scene=1` → `{sc 1, grammar bands, fluidOn true, errs [],
     bad [], frameN 300}`, 15 s per scene. **CLOCK=1 from the first pass** — v0.37's pitfall paid forward (`window.__FRAME` exists only
     under cdp.js's CLOCK shim, so a frame target without it burns its 120 s timeout). A grep on the page returns 13 hits for
     `vox-weights` / `VOX_W` / `Jamendo`: the weights **and their attribution** are in the artifact.
  4. the no-third-party receipt (SOCIAL-PLAN §4) — **ONE host on every route**: `/whats-new` → `["127.0.0.1:8993"]` · `/` (`NOAUTO=1 real`)
     → `["127.0.0.1:8995"]` with `#newin` reading *"New in v0.38: The engine learns to hear a voice → what's new"* · `/about` →
     `["127.0.0.1:8997"]` with the Jamendo line and `CC BY 4.0` in the DOM. The v0.38 article renders (`id="v0.38"`, the `engine` label,
     12 October 2026, the notes line **§120 · §121 · §122 · §123 · §124**) and shows **no thumbnails at all** — `scenes` is `[1]` and
     `site/thumbs/` still has no `fluid2.jpg`, carried open since v0.37 on the user's word about a tile.
- **What was NOT run, and why — the brief's own instruction, and it holds.** The **real-md5 sweeps** and **`accept.sh`**: both were paid in
  §123 / §124 and **the engine has not moved since**. §123 held the roster **264 of 264 lines** against the v0.37 reference with the three
  vox keys live in BOTH map modes (the stage is read-only to every other feature) and swept s1 (66 lines, all moved — the rig reads the
  voice; `tools/accept/v0.38/real-md5-s123-s1.txt`). §124 re-swept s1 (43 runs, 66 lines, 789 s) and found **all 32 `&map=1` lines moved
  and all 34 `&map=0` lines HELD to the byte** — the lane exists only in file mode with the map on, and only FLUID2 reads the voice
  (`real-md5-s124-s1.txt`). HEAD was **853dc12**, the same tree §124's sweep shot; only version strings, `releases.json`, the generated
  site files, the frozen page and docs moved after it. The **fake smoke** was §124's too: every line = the v0.35 reference but the s1 pair,
  and that pair is main's own `293d773c / 96ad310a` (the reference's s1 lines went stale when §121 moved the rig onto s1 and no fake list
  was re-based after it) — **unmoved on every line against main**. **No `scene-md5`/`real-md5` reference was re-based here**: the next
  release's sweep does it, never the tag. `accept.sh`'s "== routes" / "== params" blocks on the NAV2 vehicle are **still owed** (since
  §118). **No director trace**: FLUID2 still bids 0 (forced-only, no landing card), so HARNESS's "a scene enters the director's rotation"
  tier does not apply. **No audio was played and nothing was retuned.**
- **The deploy shape, unchanged and confirmed.** `dist/` is what `npm run build` writes and what `wrangler.jsonc` serves
  (`assets.directory ./dist`); `dist/` is **git-ignored and not committed**, and there is no `.github/` workflow — the deploy is
  **Cloudflare, git-connected to `github.com/tbkraf08/RetinaRave`, building on a push to `main`**. So the push IS the deploy: **ONE push**,
  then poll `https://retinarave.com/` for the `VER` line, **never a second push** (§115 — a second push is a second deploy; 2026-10-03 one
  build took 40–85 minutes, slow and not broken). The lanes cannot leak: `$MUSIC` is the one directory `serve.js` serves from and the one
  place the bundler cannot see, so no `<T>.vox.json` is bundled or deployed (§124).
- **What is live when.** ONE release commit (this note, the receipt `tools/accept/v0.38/tag-v0.38-2026-10-12.txt`,
  `NEXT-SESSION-PROMPT.md` rewritten for the post-release truth, the two versions, the entry, the generated `site/whats-new.html` +
  `index.html`'s line, `releases/retinarave-v0.38.html` in and v0.35's out), `git tag -a v0.38`, `git push origin main --tags` — one push.
  The push and LIVE times are in the addendum below.
- **What the user validates at home (every remark in track time is a retune request).** (1) **the voice in FLUID2** on the live site
  (`#scene=1`, key `2`): the lead mouth rides the singer, height = pitch, hue = the sung note, quiet when nobody sings — on
  **RaindropsOnRoses** (the breakdown lead 111–137 s reads .987), **IBelongHere** and **SeeYouDrop**; a shared tab is the CNN alone.
  (2) **the two sources side by side**, dev server only: `#track=<T>&scene=1` the lane against `&vox=live` the CNN, the HUD's `lead ←`
  naming it — §124 measured 70 / 76 / 73 % agreement and a **150–180 ms lag**, and the question for the eye is whether that lag is
  visible. (3) **the false voice** on a LIVE tab, where there is no lane: Comptine's solo piano and Vienna's synth leads, the measured
  10 % / 6 % of frames above the gate seen rather than counted. (4) **§121 the rig itself**, owed from before the tag: the chases, the note
  hues, the blinder on the clear (RaindropsOnRoses 84 / 118 / 137 s, SeeYouDrop 57.6 s). (5) the hard cut `n` / `→` FLUID → FLUID2
  mid-groove (the pool must not blink). (6) **§118 on the live site**: keys `1`–`6`, the arrows both ways, a page load on NAV2, Share a tab
  opening on FLUID and STAYING. (7) carried, still unvalidated: v0.36's shockwave on the four dropping tracks, FLUID in the rotation, the
  drop's flash with the ring and no droplets; v0.35's whole list.
- **Open findings carried into the tag (none retuned).** The **Jamendo-test F1 target ≥ .88, missed at .79–.80**, and §123's own verdict on
  the fix — a piano / lead-synth negative set or a longer window, not a sixth run of this 38 k net · **an unseen instrumental reading as a
  voice on 17–31 % of its frames** (the in-sample control itself at 10.0 %) · **`voxHz` on a mix** within a semitone of the lane on
  87 / 77 / 48 % · **the CNN's 150–180 ms lag** · the eight-track FLUID2 sweep (the standing exception to CONTRACTS §1.1) · the **real-md5
  s1 reference**, stale since §121 and re-based by the next real sweep · **FLUID-DROP item 2, the reversal** (and `DROP_DISS` 6 after it) ·
  a **tier-0 phone measure** of the rig · **IBelongHere's live return 36 frames late** and Vienna's bar 40 arming nothing · the live
  detector's miss on Raindrops' drops 1 / 2 and the void term arming 2.1 s into the cut · the **mixs mid-dip** (the incoming scene's cold
  `U.expo`) · **DUST's bid share** (0 of 5 away picks) · §109's seven ruler FAILs on DUST / TORUS2 · the idle bench, still unseen on this
  machine · `accept.sh`'s routes / params blocks on NAV2 · no `fluid2.jpg` thumbnail, so the v0.38 entry renders no thumbs.
- **Next, and being planned in parallel right now:** the **CNN accuracy / lag plan** and the **per-scene vocal reads**. Read both plans
  before starting either; `NEXT-SESSION-PROMPT.md` says the same in one line.
- **Addendum — PUSHED AND LIVE.** The release commit is **73f848c**, the annotated tag **v0.38** is
  `008d226ae182ec4f642a9abb07b7ce4e54b3fbf0`. **`git push origin main --tags` at 12:28:31 EDT, 2026-10-12**
  (`971b2c0..73f848c  main -> main` and `* [new tag] v0.38 -> v0.38`) — **ONE push**, as §115 requires.
  **LIVE at 12:30:22 EDT: `VER = '0.38.0'` on `https://retinarave.com/`** — the Cloudflare build took **1 min 51 s**,
  the fastest of the recent tags (2026-10-03's once took 40–85 min; slow is not broken, and a second push is never the
  answer). Confirmed on all three routes at 12:30:33: `/` serves `VER = '0.38.0'` and the card line *"New in v0.38: The
  engine learns to hear a voice → what's new"* · `/whats-new` **http 200** with `id="v0.38"`, the `cls engine` label and
  `<h3>The engine learns to hear a voice</h3>` · `/about` carries the Jamendo Corpus credit. The user validates the rest
  at home — the list is above.

## §126 The live vocal detector's second pass — the lag measured per stage, the data, three runs, run 2 ships (2026-10-12, branch `vox-cnn2`, two Fable sessions, `docs/plans/VOX-CNN2-PLAN.md`; the user: *"what are next steps to improve the CNN accuracy (and speed up detection lag)"*; on the licences: *"use the non-commercial sets -> still can publish the weights; don't worry we are not monetizing this"*; on the plan's open questions: *"I don't understand this question"*)

- **What it is.** The §123 net (38 385 parameters, 40 × 34, run as a stream) retrained on a second recipe and re-eased, the interface
  unmoved: `voxS` / `voxHz` / `voxConf`, the rig's two reads, parity's 72, the fake md5 — nothing in `assets/scenes`, `math/vox.js` or
  `core/fluid` touched. Four commits in the plan's order: **item 1** the ruler (`tools/vox-ab.js --stage=raw|held|eased`, `--stamp=end|centre`,
  the flicker and the run-length histogram), **item 3** the ease (`ears/vox.js`: VOX_ATTACK .03 s under a 2-of-3 vote at the .3 gate,
  VOX_RELEASE .05 s otherwise, the pitch gated by the vote; everything causal), **item 2** the data (`tools/truth/voxtrain.py`'s second
  recipe), **item 4** the retrain (three runs, run 2 ships: `ears/vox-weights.js` 105 339 bytes). **The user's decisions, taken as the
  plan recommended where the answer was *"I don't understand this question"*:** no look-ahead — everything causal (the plan's (b)); chops
  are not voice — WhoLikesToParty's mix is OUT of the loss and its row is recorded (the plan's (c)); the rig `inject2.js` untouched; the
  NC-licensed sets are IN and the weights SHIP (the plan's (a), the user's override above — MAESTRO's CC BY-NC-SA 4.0 line verbatim in
  `~/Datasets/maestro/LICENCE-NOTE.md`, in the weights module's header and in THIRD-PARTY.md with the paragraph that Retina Rave is
  non-commercial); the net's shape (the plan's (d), TCN vs GRU head) is session 3's by the numbers.
- **The lag, measured before it was changed** (`vox-ab.js --stage=all`, the lane's 10 ms grid, hops stamped at the frame's END = what the
  display sees; the hold = held − raw, the ease = eased − held; medians over the voiced three, then IBelongHere / Raindrops / SeeYouDrop):

| weights · ease | raw | held | eased | hold · ease | flicker live / lane | Comptine · Vienna % ≥ .3 |
|---|---|---|---|---|---|---|
| §123 · one ease .1 s (v0.38 as shipped) | 60 (80 / 60 / 60) | 80 (100 / 80 / 80) | **160** (180 / 150 / 160) | 20 · 80 | 0.65x | 23.6 · 22.1 |
| §123 · attack .03 / release .05, voted (item 3) | 60 | 80 | **120** (130 / 110 / 120) | 20 · 30 | 0.92x | 24.0 · 23.0 |
| run 1 · the same ease | 60 (90 / 60 / 60) | 80 (110 / 80 / 70) | 120 (160 / 120 / 110) | 20 · 40 | 0.82x | 17.6 · 15.2 |
| **run 2 · the same ease (ships)** | 60 (90 / 60 / 60) | 90 (110 / 90 / 80) | **120** (160 / 120 / 120) | 20 · 40 | 0.77x | **3.5 · 7.0** |

  Read: **the plan's budget was wrong and the ruler corrected it before anything trained** — the ease was HALF the 160, not three fifths
  (80, not 100), and the raw stage is 60–80 ms (the 2048-point frame's centroid 21 + the net's own commit on a boundary 40–60), not 46.
  The ease retune took 40 ms off (160 → 120) for a flicker that stays UNDER the lane's (0.92x → 0.77x with the new weights — the vote
  kills the ≤ 50 ms spikes a faster attack would otherwise let through); the hold's 20 and the raw 60 are the floor of THIS net at a
  4-hop cadence. **The plan's ≤ 100 ms is MISSED at 120** and cannot be reached by smoothing: raw + hold = 80–90 before any ease. The
  inference cadence 4 → 2 was NOT taken (+20 µs/hop for −8 ms mean, the plan's own arithmetic); session 3's net (an output every hop,
  no hold) is where the next 20–40 ms live. IBelongHere's eased lag is 160 on the new weights (ease 50): a net with precision .97 and
  recall .61 rises later on a soft onset — the lag is paid in the same coin as the false voice. Agreement with the lane 70 / 78 / 76 %
  (§124: 70 / 76 / 73). Comptine's voiced runs on the new weights: 28 runs, none over 1 s (§123's weights: 82, eight over 1 s).
- **The data** (`voxtrain.py`, the second recipe; the front end, the net and the export unchanged, the parities re-proven): the 93 Jamendo
  tracks through Demucs (`htdemucs --two-stems=vocals`, two lanes, 61 train stems used; the valid / test stems exist for session 3's pitch
  head) — the TRAIN labels cleaned by the stem as a second annotator (a `sing` frame under .04 of the mix dropped, a no-voice frame over
  .3 dropped; valid and test keep the raw labels so the numbers compare to §123's), the 61 accompaniments as hard negatives; **random
  remixes re-drawn every epoch** (60 × 150 s: a Jamendo-train or library vocal stem over another track's accompaniment or a classical
  recording, random offsets, labelled by the stem's share ≥ .15 AND the source's own label, ≤ .04 not, between dropped); **the Demucs lane
  as a SOFT target** on the library's hand windows (the §122 knee at .5; 0 outside); mel-domain pitch shift ±2 bands + time stretch
  .8–1.2 on half the windows; **MusicNet** (4.6 h: 13 solo piano + 15 strings / winds) and **MAESTRO v3** (2.3 h solo piano) as pure
  negatives and remix beds, one file of each kind held out as an unseen-classical control; the draw by quota jam .35 · lib .10 · neg .25
  · remix .30, 400 k windows per epoch, 12 epochs, the Jamendo-valid AUC picks the epoch. **Held out, UNSEEN: IBelongHere and Comptine**
  (§123's final split trained on Comptine, so its 10 % was in-sample — this round the number is honest). Jamendo train 1.24 M windows
  (55 % sung), the library 183 k, the negatives 3.6 M.
- **Three runs, the pick by the held-out pair + Jamendo test, never in-sample** (`--soft-floor=F`: a hand-window frame whose lane reads
  under F leaves the loss instead of teaching near-silence inside a passage; `--snr=LO,HI` the remix range; `--quota=` the shares — the
  three knobs are CLI flags now, the defaults = run 1):

| run | the knobs | Jamendo test F1 / P / R / AUC | IBelongHere F1 / P / R / AUC (unseen) | Comptine fp % at .5 (unseen) | at the .3 gate | classical held out (mn-pi / mn-st / ma) | best epoch |
|---|---|---|---|---|---|---|---|
| §123 run 5 (v0.38) | — | .792 / .73 / .87 / .875 | .819 / .93 / – / .838 | 10.0 in-sample | 23.6 | – | – |
| 1 | the recipe as committed (SNR −12..+6, the lane's read as the target) | .798 / .808 / .788 / .877 | .788 / .963 / .666 / .879 | **7.6 — MISSED** | 17.6 | 1.5 / 10.3 / 4.9 | 8 (.881) |
| **2 (ships)** | soft floor .3, SNR −6..+6 | .795 / .861 / .738 / **.886** | .748 / .971 / .608 / .869 | **1.4 — met** | **3.5** | 0.4 / 4.1 / 1.1 | 11 (.884) |
| 3 | soft floor .3, SNR −12..+6 | .795 / .849 / .748 / .883 | .765 / .970 / .632 / .871 | 4.3 — met | – | 0.7 / 5.4 / 1.9 | 8 (.882) |

  Read: run 1's failure mode was the piano still reading as a voice (7.6 % unseen, against 28 / 22 / 17 % when §123 held it out — the
  classical negatives did most of the work) while recall sat at two thirds; the soft floor paid 7.6 → 4.3 and the SNR narrowing 4.3 →
  1.4, each for a few points of recall on the unseen voiced track (.666 → .632 → .608). **Run 2 ships** for the best rank (AUC .886), the
  best unseen control and the highest contrast on the ruler; its recall is RECORDED, not hidden: IBelongHere reads 54.5 % of its frames
  sung at the gate where the lane reads 67.6, SeeYouDrop 35.5 vs 47.2. **The plan's Jamendo F1 ≥ .82 is MISSED at .795–.798** — three
  more runs within .003 of each other on F1 and §123's five within two points: the number is this net's ceiling, as §123 said, and the
  next point is session 3's net, not a seventh run. Raindrops' in-sample fp 10.6 % is the lead synth the user WANTS read as a voice
  (§123: "the lead, by design" — the hand windows do not cover it). The unseen-classical controls 0.4 / 4.1 / 1.1 % (a string quartet
  the hardest); the in-sample classical mean 2.0 %. WhoLikesToParty out of the loss reads F1 .07 — the chops are not what the net was
  taught, as decided.
- **The ruler** (`tools/test_vox.js` (iii), the 48 kHz PCM dumps through the stage, the eased `voxS`, the shipped weights; §123's row in
  brackets):

| track | hand s | voxS p50 in / out | ratio | fp % (≥ .5 outside) | lead p50 | voiced | voxHz: a pitch on / within a semitone / modulo the octave |
|---|---|---|---|---|---|---|---|
| Comptine (the control, **UNSEEN**) | 0 | – / .026 | – | **1.3 — met** (10.0 in-sample) | – | 0 | – |
| IBelongHere (unseen) | 199 | .508 / .062 | **8.2×** (3.2) | 7.4 (20.7) | – | 5549 | 50 / **45** / 48 % (60 / 53 / 58) |
| RaindropsOnRoses | 94 | .739 / .067 | **11.0×** (5.2) | 10.2 (18.9) | **.900** (.987) | 2613 | 70 / **55** / 64 % (81 / 63 / 72) |
| CyborgNinja | 0 | – / .006 | – | 0.0 (1.1) | – | 0 | – |
| Malicious | 1 | .250 / .045 | 5.5× (3.6) | 0.3 (2.3) | – | 52 | 0 / 0 / 0 % |
| SeeYouDrop | 75 | .465 / .083 | **5.6×** (3.7) | 2.4 (13.2) | – | 206 | 16 / **9** / 13 % (28 / 14 / 18) |
| Vienna (in-sample) | 0 | – / .054 | – | 1.6 (6.0) | – | 0 | – |
| WhoLikesToParty (chops, recorded) | 64 | .114 / .180 | 0.6× (1.1) | 10.4 (5.7) | – | 0 | – |

  Read: the voiced three clear 2× by a wider margin than §123 (8.2 / 11.0 / 5.6 vs 3.2 / 5.2 / 3.7) because the OUTSIDE fell (.062–.083
  from .17–.22), not because the inside rose — the inside fell too (IBelongHere .694 → .508, SeeYouDrop .764 → .465: the recall above);
  the "outside the windows" fp on the voiced tracks halved and more (20.7 → 7.4, 18.9 → 10.2, 13.2 → 2.4 — the plan's "halved" met).
  **voxHz within a semitone 45 / 55 / 9 %** against §123's 53 / 63 / 14 — the YIN on the mix is untouched and publishes on fewer
  frames now that the vote gates it; the pitch head is session 3's (the plan's item 4), the ceiling the mix's. The semitone column is
  recorded, never gated; the Comptine note prints **met** for the first time; the Jamendo F1 note prints MISSED.
- **The gates.** `node tools/check.js` **147 modules · 0 fail · 4 warn** (the soft caps) · `license.js --check` **150 public files, 0 without the header** · `npm test` **exit 0** (`test_vox.js` all ok: the mel
  parity 7.05e-5 / 1.29e-5, the stream vs onnxruntime **8.81e-7** on the shipped weights, the training table as notes, the ruler, the
  wiring's 31 fields identical, the bench, the lane's grid). **The bench** (`test_vox.js --bench`, the machine idle at load 2.9 (this machine's floor), three runs):
  **75.7 / 74.8 / 74.2 µs per hop median**, p99 136–140, mean ≈ 80 — the gate ≤ 100 µs, the ease is free (§123: 72.6). **The fake smoke** (`tools/scene-md5.sh s126`): every line = the v0.35 reference but the s1 pair, which = main's 293d773c / 96ad310a (the reference's s1 lines stale since §121, as §123 and §127 record) — the twelve lines = main's §127 list byte for byte, **UNMOVED against main** (the fake timeline has voxConf 0). **The real sweep**
  (`SCENES=1 PAR=2 tools/real-md5.sh s126-s1`, the s124 reference's scope — intro / groove / build1 / drop1 / boundary1 / chords, both
  modes, the take; 66 lines, f0 2 on every run, errs []): **all 32 `&map=1` lines HELD to the byte** (the lane feeds the picture in file mode, the weights are not read there) and **all 34 `&map=0` lines MOVED** (the live CNN feeds the lead: new weights, new ease) — exactly the expected shape, no wiring bug, nothing re-baselined — the list `tools/accept/v0.38/real-md5-s126-s1.txt`; the roster's
  lines were not re-shot (the stage is read-only to every other feature, §123's 264 / 264, and nothing outside `ears/vox*.js` and
  `tools/` moved on this branch). No audio played; not tagged, not pushed, not merged (main gained §127 in parallel; the merge is the
  orchestrator's).
- **The corpora and their licences** ([[feedback-credit-where-due]]; each set's `LICENCE-NOTE.md` beside the audio on this machine, the
  lines in THIRD-PARTY.md and the weights module's header; none of the audio is in the repo): **the Jamendo singing-voice corpus**
  (Ramona, Richard, David, ICASSP 2008; Zenodo 2585988, `license: cc-by-4.0`; the README verbatim: *"This is a public corpus of 93
  creative-commons licensed music pieces annotated by voice (sung or spoken) and no-voice."*) · **MusicNet** (Thickstun, Harchaoui,
  Kakade, ICLR 2017; Zenodo 5120004, `cc-by-4.0` = Creative Commons Attribution 4.0 International; the bytes from the HuggingFace mirror
  `DreamyWanderer/MusicNet` of the same recordings, the Zenodo tarball streaming at 60 KB/s) · **MAESTRO v3.0.0** (Hawthorne et al.,
  ICLR 2019; the archive's LICENSE opens *"Attribution-NonCommercial-ShareAlike 4.0 International"*; the dataset page: *"The dataset is
  made available by Google LLC under a Creative Commons Attribution Non-Commercial Share-Alike 4.0 (CC BY-NC-SA 4.0) license."*) — the
  weights were trained with NC-licensed audio among their negatives and ship on the user's word that Retina Rave is non-commercial
  (MIT + the Guest-List Clause, nothing sold); THIRD-PARTY.md says so in one paragraph. Demucs (MIT) made every stem.
- **What is left for session 3** (the plan's step 3): **the net** — the causal TCN over the mel column (≈ 19 k MAC/hop, an output EVERY
  hop, no 4-hop hold: the 20 ms hold and part of the raw 60 are its to take) or the GRU(32) head on the 2-D trunk if the TCN's Jamendo F1
  is not ≥ the trunk's + 2 on the same data — the F1 .82 and the lag ≤ 100 both wait on it; **the pitch head** (61-way, trained on the
  stems' pYIN — the library's in `tools/truth/<T>.vox.json`, Jamendo's from the 93 stems now on disk) with the harmonic salience
  replacing the YIN on the mix (45 / 55 / 9 % within a semitone is the mix ceiling, not the net's); the recall on the unseen voiced
  track (.61) — a longer memory is the plan's answer, not a threshold; the per-hop ONNX parity for a streaming net; the user's eye on
  `#scene=1` with `&vox=live` on IBelongHere, Comptine and Vienna (the false voice seen, not counted) and the lag beside the lane; the
  eight-track FLUID2 sweep still owed; the real-md5 s1 reference re-based by the next release's sweep.
## §127 The vocal lane on TORUS2 and DUST — one shared gate, the strand and the grains (2026-10-12, one Fable worker in a worktree off 85e98c1, branch `vox-scenes-a`; the plan `docs/plans/VOX-SCENES-PLAN.md`; the user: *"skip fluid for now; director -> don't bias the bid toward fluid"*)

- **What it is.** The plan's session A minus FLUID, plus DUST from session B minus the director: `assets/math/vox.js` (the shared
  gate) + TORUS2 + DUST. No director change at all (no bid term, no roster change, §95's dwell untouched); FLUID's `inject.js` and
  FLUID2's rig untouched — the plan's open question 3 is answered the user's way: the NEW reads use the shared gate's knee, the rig
  keeps the raw `voxS` the user validated by eye (§123). Nothing tagged, pushed or deployed; no audio played.
- **The gate** (`math/vox.js`, pure, per-caller state like keycolour's `mkAnchor`): `vox(st, dt, MS)` → `{ w, pc, y01, hue }`.
  `w = sstep(.45, .85, voxS)` — the knee ABOVE the live tier's own .3 / .5 gates, no rise ease, release .3 s (0 under .01);
  `pc` the sung pitch class only after it has HELD .085 s (~two CNN inferences — a flicker or a shut YIN gate colours nothing; a
  consonant holds the last); `y01` the rig's height `(1 − .3)·deg/11 + .3·clamp(log2(hz/110)/4, 0, 1)` eased .35 s, deg above the
  key's tonic; `hue` the note's on the circle of fifths with the mode's pull (inject2's `hueOf` verbatim), the key's until a note
  holds. **`voxConf` 0 → w 0 / pc −1 / y01 −1 exactly** — the no-op on the fake timeline and the traces; `voxConf` is the switch,
  never a weight (live `voxConf = voxS × periodicity`, and a piano is periodic). Knobs: `&voxk=<lo>,<hi>` on any page (harness.js).
- **TORUS2 (id 4) — the knot strand becomes the voice** (`scenes/torus2/voice.js`): the knot is already "the melody traces the
  knot"; while someone sings three numbers blend by w — its LATITUDE → `TH0 + THS·(.35 + .5·y01)` (the sung pitch lifts the strand
  toward the equator, the nest's own vertical, as a glide), its HUE → the sung note's slot `pc/12 − .5 + .09` (where the loudest
  class's slot sits today; `uKnotBH.y` is a CPU number now), its BRIGHTNESS × (1 + .6·w); and the sung class's family ring is LIT,
  `ch[pc] = max(ch[pc], w)` after `briMax` and `loudest` are read — the other eleven keep their light, the glow floor stands. Cost
  none. `&t2vox=0` (hooks.t2vox) = today's bytes on a voiced track. hud() appends `vox w .xx pcN`.
- **DUST (id 3) — the singer's grains, and the ribbon as the lone voice** (`scenes/dust/voice.js`; the plan's (a) AND (b) — the
  planner's pick on open question 4, pending the eye): a grain's band is its PLACE (§58), so the grains whose bin sits at the sung
  pitch's first three PARTIALS (voxHz, 2×, 3× on the log axis, bin j = 30·(16000/30)^(j/256) Hz — three thin shells at the pitch's
  radii) are LIFTED in the sung note's hue (palette t = pc/12) and the rest of the cloud is scaled by (1 − .25·w): **the light is
  moved** — the lift's gain is normalised on the CPU from the grains' own density over the axis (fx = .95·u^1.4 → ρ ∝ fx^(−2/7); the
  partials' share p ≈ Σ aₖ·σ√π·ρ(fₖ) ≈ 2.2–2.8 %, the gain .25·w·(1 − p)/p ≈ ×10–12, capped at 12) so the brightness factor's
  population mean is 1 (measured over 50 000 hashed grains: 1 ± .02 from C3 to C6). `shapeFor(MS, voxSec)` gains the voice:
  `!subGate && (denK < lone || voxSec > .5)` → RIBBON, `voxSec` = w over 8 s (a seam decision is about a section) — the ribbon IS "the
  breakdown, or a lone voice" and until now only knew "no kicks"; in the ribbon the line's y rises with the pitch (added to the
  WAVE behind a branch that leaves w untouched at 0). The shader's block runs only at w > 0 (`uVox` vec4 + `uVoxC` vec2, ~8 ALU per
  vertex inside it). `&dvox=0` (hooks.dvox) = today's bytes. hud() appends `vox w .xx pcN sec .xx`; dinfo() carries nine voice
  numbers for dust-trace.
- **The no-op proof.** `tools/test_voxscene.js` (27 ok, in `npm test`): the gate's defaults on 600 frames; each scene's `update()`
  driven in node on a stub ctx, one module instance per run — the defaults = the switch off TO THE BYTE (TORUS2's five knot numbers
  on 240 frames, DUST's pour / shape / spin / drive / hue / uniforms on 720), the switch off with a sung A4 = the defaults, a piano's
  false voice (voxS .35 at voxConf .9) = the defaults; a sung A4 → TORUS2 w 1 / pc 9 / y01 .7227 / the hue slot .34 / brightness ×1.6
  / the latitude's formula / family 9 lit with the other eleven, briMax and loudest unchanged; DUST rank .4277 / p 2.4 % / gain 10.6
  / hue t .75 / the ribbon's rise; with the sub sounding the voice asks for no other shape; a lone voice pours into the ribbon on the
  8 s seam once voxSec passes .5 (4.4 s) and the defaults never do. The fake smoke (`tools/accept/v0.38/scene-md5-s127.txt`): every
  line = the v0.35 reference but the s1 pair = main's 293d773c / 96ad310a (§123's stale-reference note) — **unmoved against main**.
- **The Comptine-live lit share — the plan's §0 claim is MISSED** (`tools/vox-gate-ruler.js`, the CNN replayed over the PCM dumps
  and the lane, the gate at 60 fps; `tools/accept/v0.38/vox-gate-ruler-s127.txt`): at the default knee Comptine LIVE lights (w > 0,
  the .3 s release included) on **27.3 %** of its frames and is hued (a class held) on **15.0 %**, at a mean w of **.070** — the
  piano's voxS hovers around .45–.6, so the knee lets a LITTLE light through OFTEN; Vienna 14.5 / 4.5 %, CyborgNinja 4.0 / 2.1 %,
  Malicious 4.9 / 1.4 %; the voiced three 48–77 % lit live (62–91 % on the lane). The knee sweep: .5/.9 → Comptine 22.6 %, .55/.9 →
  18.2 %, .6/.95 → 14.3 % at a mean w of .017 — but SeeYouDrop's lane hue falls 26 → 4 % and Raindrops' lane lit 62 → 43 %. The
  default stays the plan's; `&voxk=` is the user's A/B at home. What the knee held back: the CNN's raw sung-% on Comptine is 23.6
  at the .3 gate (§124) and the gate's mean w there is .07 — a seventh of a voiced track's — so the false voice is dim, not absent.
- **The md5 result** (`GPU=1 PORT=8951 PAR=2 SCENES="3 4" tools/real-md5.sh s127`, 86 runs, f0 2 on every run, errs [], 927 s;
  the lists `tools/accept/v0.38/real-md5-s127-s3.txt` / `-s4.txt`, read against a SWITCH-OFF baseline shot at the same tree,
  `real-md5-s127off-s3.txt` / `-s4.txt`): **s4 19 of 66 moved by the voice, 47 held; s3 25 of 66 moved, 41 held.** FILE mode on the
  instrumentals: Comptine / CyborgNinja / Malicious / WhoLikesToParty **0/4 held on TORUS2**, Comptine / CyborgNinja / Malicious 0/4
  on DUST — the read is a no-op where the lane says no voice; Vienna's groove moved on both (the lane ITSELF read a voice on 560
  frames before the shot, the last 2.4 s before it: w was 0 at the shot but the scenes' eases carry — with the switch off the line
  = the reference); WhoLikesToParty's drop1 on DUST (the lane's shouts light w with no pitch and voxSec passes .5 → the ribbon).
  LIVE: Comptine build1 + drop1 moved on both scenes (the piano's false voice at the shot), Vienna build1 + Malicious groove on
  DUST, the voiced three on both — **the live lines are re-shot after the CNN's second pass (VOX-CNN2, a parallel branch) lands.**
  Every other scene's lines were not re-shot (nothing they read moved; the ears are untouched here). **A finding:** 11 s3 lines of
  the v0.37 reference were already stale BEFORE this branch (the switch-off list differs from v0.37 on them — CyborgNinja intro +
  boundary1 m1, Malicious build1 m1 + m0, WhoLikesToParty groove m1 + build1 m0, IBelongHere drop1 m1 + intro / groove m0, Raindrops
  groove m1, SeeYouDrop groove m0); s4's 66 = v0.37. The next release's sweep re-bases; nothing here retunes DUST for it.
- **The bench: NOT OBTAINED.** The HARNESS bench harness (q pinned .95, 8 s settle, three interleaved pairs against NAV2, on the
  fake timeline and on IBelongHere at 60 s, switch on / off) was run after the sweeps with the machine idle, and `tools/cdp.js`
  crashed at module import in that invocation on every case (the same driver ran 258 md5 runs on this tree today; the eval string
  is the suspect). On the fake timeline the voice path is a skipped branch and three uniform uploads, so the no-op cost is the
  upload; the voiced cost is the gate (a few dozen flops per frame) plus ~8 ALU per vertex in DUST's shader — unmeasured. Owed
  (`docs/plans/VOX-SCENES-HANDOFF.md`).
- **The gates:** `node tools/check.js` 150 modules · 0 fail · 4 warn (the soft caps: dust/index.js 364, torus2/index.js 361 — the
  reads live in each scene's `voice.js`); `node tools/license.js --check` 153 / 0; `npm test` exit 0 (`test_voxscene.js` added).
- **The eye is owed** — the voiced tracks on `#scene=4` (TORUS2) and `#scene=3` (DUST), file and live, on the dev server:
  `#track=IBelongHere&scene=4` / `&scene=3` (the lane), the same with `&vox=live` (the CNN's picture), `RaindropsOnRoses` (from
  24 s) and `SeeYouDrop` likewise, and `#track=Comptine&scene=3&vox=live` as the control (what the knee lets through on a piano);
  `&t2vox=0` / `&dvox=0` under `#test` is the before. Every remark in track time is a K2 retune on all eight tracks (CONTRACTS §1.1).
**§127 addendum — the voice no longer moves the camera (2026-10-12, one Opus worker on main; the user, testing: *"feedback while testing t2vox -> it being on causes performance issues"*).** The read itself costs nothing per frame (CPU numbers into uniforms that already exist, §127 above) — what the user saw was the CAMERA. `voice.js` lifts the sung family in place (`ch[pc] = max(ch[pc], w)`), and `index.js` then handed that same array to `reframe(dt, th, ch, …)`, whose sample gate is `ch[k] < 0.3` (`motion.js`): every note's onset admitted one more family — 25 fibre sample points, 5 × 5 per family — and its offset dropped them again, so the centroid, the radius and `dist(CEN[3], …)` jumped ON the note. Eased at 2.5 / s, that reads as a pump, and a sung line pumps it on every note: not a frame cost, a continuity cost. **The fix is the ORDER, not a copy:** the `voiceStep(...)` block moved to AFTER `reframe(...)` in `update()`. Every input is already final there (`loudest` and `th[]` are written in the chroma loop, `U.collapse` a few lines after it, `U.subP` with the knot, `MS.intensity` is the frame's snapshot — none of them moves between the two points) and `U.knotTh / knotBri / knotHue` are read only in `draw()`, so the strand is the same to the byte; the lit ring still reaches the shader, because `uChroma` is uploaded from `ch` in `draw()`. The camera simply no longer hears the voice. The alternative — handing `reframe` a copy of `ch` taken before the lift — buys the same picture for a per-frame copy (or a thirteenth module array) and leaves two chroma vectors to keep straight: the cheaper correct option won. The rings DUST lifts never reach a sample gate, so nothing there moves.
- **The gates:** `node tools/test_voxscene.js` **27 ok** (the switch-off byte-identity claims hold — the block's position is not one of its numbers); `node tools/check.js` **150 modules · 0 fail · 4 warn** (`torus2/index.js` 367 lines, the soft cap's warn of §127, +6 for the note above the block); `npm test` — **the ONNX parity (ii) FAILS on this tree and on 3ce1e90 alike** (`max |Δ| 8.00e-1` vs 1e-4): the VOX-CNN2 worktree is training as this lands and rewrote the SHARED fixture `tools/work/vox/onnx-parity.json` (13:34) with its new model's outputs, while main ships §123's `vox-weights.js` (11:02) — a cross-branch work-artifact collision, verified by `git stash` + `node tools/test_vox.js bench` at the clean tree (same single FAIL). Everything else in `npm test` passes; nothing in the file path reads a scene.
- **The fake smoke, scoped to the scene folder's own lines** (HARNESS "What to re-prove": `IDS=4 GPU=1 PORT=8942 tools/scene-md5.sh s127d`): `80c43f0fc1aeb607ccbbe9971826c672` / `248ad4c9b188a1e29fadca7f90442bdd` = the s4 pair of `tools/accept/v0.38/scene-md5-s127.txt`, `errs []`. It could not have moved: the fake timeline reports `voxConf 0`, the gate returns `w 0`, the block is a no-op on either side of `reframe()` — the shot is the receipt that the move is the only edit.
- **The real-md5 s4 lines are NOT re-shot here** — they get re-shot after §126 (VOX-CNN2, the parallel branch) lands, together with the live lines §127 already owed. This change can only move a line where `w > 0` (the voiced tracks, and the piano's false voice live), and it moves it TOWARD the pre-§127 camera.
- **The eye is owed:** `#track=IBelongHere&scene=4` against `&t2vox=0` — the strand should still take the sung note's hue and height, with the nest sitting still.

## §128 The two voice branches merged — the gates, the bench §127 owed, the re-shoot, and the false voice down to 7 % (2026-10-12, one Opus worker on main, no worktree; the brief: *"Plumbing on main … if a gate fails, report it, do not fix"*)

- **What it is.** Plumbing only: `main` at `7153fc1` is §126 (the CNN's second round — run-2 weights + the attack / release ease)
  merged onto §127 (scenes A: the shared gate `assets/math/vox.js`, TORUS2's strand, DUST's grains) with `941dd7a` (voiceStep after
  reframe) on top, and the two branches each owed the other's receipts. **Not one byte under `assets/` was edited here** — four
  measurements and this entry. Nothing tagged, pushed or deployed; no retune; no audio played.
- **The gates, all green.** `node tools/check.js` 150 modules · uniforms 161 · MS keys 223 · scenes 6 (help.feats gaps 0) · **0 fail
  · 4 warn** (the soft caps: `core/scenes.js` 370, `ears/perc.js` 407, `dust/index.js` 364, `torus2/index.js` 367).
  `node tools/license.js --check` **153 / 0**. `npm test` **exit 0** — and the ONNX parity that §127's addendum recorded as FAILING
  (max |Δ| 8.00e-1 against 1e-4: the `vox-cnn2` worktree had rewritten the SHARED fixture `tools/work/vox/onnx-parity.json` with run
  2's outputs while main still shipped §123's weights) **now passes at 8.81e-7** — the merge brought the weights the fixture was
  written from, exactly as that finding predicted. The mel parity 7.05e-5 / 1.29e-5; the stage 74.8 µs per hop median (p99 144, mean
  82.0) against ≤ 100; the wiring's 31 non-vox fields identical; `test_voxscene` 27 ok (the switch-off byte-identity claims hold on
  the merged tree), `test_fluid` 350 ok, `test_music` 151 ok. The fake smoke scoped to the scenes that read the voice (`IDS="1 3 4"
  GPU=1 PORT=8941 tools/scene-md5.sh s128`): **all six lines = `tools/accept/v0.38/scene-md5-s127.txt` byte for byte**, `errs []` hop
  840 row 72 on each — the fake timeline reports `voxConf` 0, the gate returns `w` 0, no voice block is entered, so no new list.
- **Why §127's bench crashed, and the bench** (`tools/accept/v0.38/bench-s128.txt` pass A, `bench-s128b.txt` pass B — **read B**).
  It was never cdp.js: `tools/cdp.js` `JSON.parse`s `argv[3]` at module top level, so a regex written `\d` instead of `\\d` inside
  the eval string is an invalid JSON escape and node throws `SyntaxError: Bad escaped character in JSON` before the driver starts —
  a "crash at module import" with no page involved. Escaped, the same driver runs. Pass A (one page per hash, the handoff's literal
  recipe) is kept for the record but is **not comparable on TORUS2**: the scene picks its attractor per page load (`cnn` / `aizawa` /
  `thomas` across three pages) and the attractors do not cost the same — the s4 fake pair's 1.138 vs 1.606 ms is the attractor, not
  the switch. Pass B toggles `hooks.dvox` / `hooks.t2vox` INSIDE one page, three interleaved triples ON / OFF / nav2, q pinned .95,
  8 s settle, one cold call discarded:

  | page | voice ON | voice OFF | nav2 | ON/OFF | ON/nav2 |
  |---|---|---|---|---|---|
  | `#test&scene=3` DUST | 0.949 ms | 1.000 ms | 1.865 ms | 0.949 | 0.509 |
  | `#test&scene=4` TORUS2 | 0.984 ms | 0.990 ms | 1.827 ms | 0.994 | 0.539 |
  | `#test&track=IBelongHere&at=60&scene=3` | 1.000 ms | 0.986 ms | 3.930 ms | 1.014 | 0.254 |
  | `#test&track=IBelongHere&at=60&scene=4` | 1.453 ms | 1.384 ms | 3.907 ms | 1.050 | 0.372 |

  **Unmoved within noise:** the spread WITHIN one side is wider than the gap between the sides (DUST's fake ON runs 1.124 / 0.917 /
  0.949; TORUS2's IBelongHere OFF runs 1.384 / 1.654 / 1.378). The fake rows have `voxConf` 0 on both sides, so they price the three
  uniform uploads alone; on IBelongHere the lane has the voice (hud `vox w 0.03 pc7`) so the `w > 0` branch IS live, and w's
  magnitude does not change its instruction count (~8 ALU per vertex inside DUST's branch; CPU numbers into existing uniforms on
  TORUS2). The user's *"it being on causes performance issues"* was the CAMERA, fixed in `941dd7a` — not a frame cost this bench can
  see, which is why it took a continuity argument and not a bench to find it.
- **The false voice is down to a third of what it was — the plan's §0 claim is now MET** (`tools/vox-gate-ruler.js`, the same tool
  and inputs as §127, the lane columns identical to the tenth as the control; `tools/accept/v0.38/vox-gate-ruler-s128.txt`).
  **Comptine LIVE lights on 7.1 % of its frames against the plan's ≤ 10 % (§127: 27.3 %), is hued on 1.8 % (15.0), at a mean w of
  .015 (.070), in 10 separate runs (40).** The other controls fell with it: Vienna 14.5 → **4.2** % lit, CyborgNinja 4.0 → **0.1**,
  Malicious 4.9 → **0.7**. The price is the recall §126 measured and chose: IBelongHere 77.1 → **67.0** % lit, RaindropsOnRoses 55.4
  → **48.2**, SeeYouDrop 47.7 → **32.5**. WhoLikesToParty LIVE ROSE, 13.8 → **23.7** %, at a hue share of 0.5 % — its shouted chops
  read as presence with no pitch (the chops are out of the loss by the user's call, §126), so the light they make is colourless;
  recorded, not retuned. No knee sweep: the default knee is the one the user A/Bs at home with `&voxk=lo,hi`, and `§127`'s sweep
  stands as the trade-off curve.
- **The re-shoot** (`GPU=1 PORT=8951 PAR=2 SCENES="3 4" tools/real-md5.sh s128`, the s127 scope: 86 runs, `f0` 2 on every run,
  `errs []`, `bad []`, 777 s; `real-md5-s128-s3.txt` / `-s4.txt`). s1 was NOT re-shot (§126 shot it at this engine tree) and neither
  was the roster. **s4 TORUS2 — 16 of 66 moved, 50 held, and the grade is the shape the two changes predict.** FILE (`&map=1`): 6 of
  32 moved, every one a line where the lane reads a voice at or just before the shot — THREE back to the switch-off picture EXACTLY
  (Vienna / IBelongHere / Raindrops groove: w is 0 at those shots and all the voice had left was the camera's eases, which `941dd7a`
  removes — §127 wrote "the scene's eases carry"; they no longer do), THREE to a new value (IBelongHere build1 + drop1, Raindrops
  drop1: w > 0, so the strand still takes the sung note's hue, height and brightness while the nest sits still); **every instrumental
  file line HELD** (Comptine / CyborgNinja / Malicious / WhoLikesToParty 0/4 each). LIVE (`&map=0`): 10 of 34 — Comptine build1 +
  drop1 back to the switch-off picture (the piano's false voice gone), Vienna build1 to a new value, the voiced three + the take's
  chords 7 of 18; CyborgNinja / Malicious / WhoLikesToParty 0/4. **s3 DUST — 17 of 66 moved, 49 held.** LIVE 13 of 34, exactly the
  lines §127 said it would re-shoot: Comptine build1 + drop1 and Malicious groove back to the switch-off picture (the ruler's 27.3 →
  7.1 % in one frame each), Vienna build1 to a new value, the voiced three + the chords 9 of 18.
- **A finding: four s3 FILE-mode lines moved that should have held** — RaindropsOnRoses intro / build1 / drop1 and SeeYouDrop intro,
  voice ON. The lane did not change and no DUST file did, so they could not move; they did. Ruled out in order: (1) **determinism** —
  two fresh `PAR=1` shoots of those eight lines agree with the sweep to the byte; (2) **§126's engine** — with `ears/vox.js` +
  `vox-weights.js` checked out at `3ce1e90` they are STILL today's bytes, not §127's; (3) **any code at all** — with the WHOLE
  `assets/` tree checked out at `3ce1e90`, the exact tree §127 shot from, they are STILL today's bytes; (4) **the lane as an input** —
  the page's `voxS` / `voxHz` / `voxConf` match `~/Music/RetinaRave/<T>.vox.json` to the digit at heard 24.000 and 33.967 s, `mapOn`
  1 from frame 2, and the sidecars have not been written since 11:17, before the §127 sweep; (5) **DUST's own non-voice path** — all
  eight `&dvox=0` lines shot here are byte-identical to `real-md5-s127off-s3.txt`. So the §127 voice-ON values for those four shots
  **are not reproducible from the tree and the lane they name**: stale, the same class as the 11 stale s3 lines of v0.37 that §127
  itself recorded. The suspect is the QUALITY TIER — at the Raindrops-intro shot `q` reads 0.75 / tier 2 with the voice on and off
  alike (the sweep does not pin q), and DUST's grain work scales with q, so a two-lane sweep's load can move a DUST line without
  moving a code byte. **Recorded, nothing re-baselined beyond writing the honest list**; `real-md5-s128-s3.txt` is the reference for
  s3 from here, and a DUST line is a proof only when the sweep that shot it is the sweep that reads it.
- **What is owed.** (1) **The user's eye**, the only thing left before a tag: scenes 1 / 3 / 4 live and file on the dev server —
  `#track=IBelongHere&scene=4` and `&scene=3` (the lane) · the same with `&vox=live` (the CNN's picture) · `#track=RaindropsOnRoses&at=24&scene=1`
  (the rig's lead on the new weights) · `#track=SeeYouDrop&scene=3` · `#track=Comptine&scene=3&vox=live` as the control, which should
  now be nearly dark · `&t2vox=0` / `&dvox=0` / `&voxk=lo,hi` the A/Bs. (2) **Session 3 of the CNN plan** (`docs/plans/VOX-CNN2-PLAN.md`):
  the TCN / GRU net for the last of the lag (raw + hold is 80–90 ms before any ease, so the plan's ≤ 100 cannot be reached by easing),
  the pitch head, and the recall the narrowed SNR cost (IBelongHere live 54.5 % sung at the gate vs the lane's 67.6). (3) Jamendo test
  F1 stays **MISSED at .795** against the plan's ≥ .82 — this net's ceiling, §126's record.

## §129 v0.39 tagged, NOT deployed — the voice reaches the scenes (2026-10-12, one Opus worker on main, no worktree; the user: *"tag for now, don't deploy"*)

- **What ships** (everything on `main` since v0.38 — 20 commits, three sections; this note adds no code): **§126 the live
  detector's second pass** — the lag measured per stage, a second data recipe (`--soft-floor=.3`, `--snr=-6,6`, the three knobs now
  `voxtrain.py` flags), three retrains and **run 2 shipped** on the best AUC (.886), the unseen control (Comptine 7.6 → **1.4 %**) and
  the highest contrast on the ruler, its recall recorded as the price; MusicNet and MAESTRO added to the negatives on the user's
  *"use the non-commercial sets → still can publish the weights; don't worry we are not monetizing this"* · **§127 the vocal lane on
  the scenes** — `assets/math/vox.js`, the ONE shared gate (knee 0.45 → 0.85, hold .085 s, release .3 s) read by `scenes/dust/voice.js`
  and `scenes/torus2/voice.js`: TORUS2's strand takes the sung note's **height, hue and brightness**, DUST's grains light the sung
  register and the ribbon rides a lone voice, `&t2vox=0` / `&dvox=0` / `&voxk=lo,hi` the A/Bs · **§127's addendum `941dd7a`** — the
  `voiceStep` moved AFTER `reframe()` so the sung family no longer admits fibre sample points and **the camera no longer pumps on a
  note** (the user, testing: *"it being on causes performance issues"* — the read costs nothing per frame; it was the camera) ·
  **§128 the proof** — the merged gates, the bench §127 owed, the s3 / s4 re-shoot and the lit share.
- **The class is `engine`, and `scenes` is `[3, 4]`.** The ears' weights and ease moved and two scenes grew a read; **no scene was
  added and no id moved**, so it is not a `scene` release. But `site/thumbs/` has `dust.jpg` and `torus2.jpg`, so this is the first
  entry since v0.34 to render **any** thumbnails — two of them. The entry's `decisions` is `[§126, §127, §128]`.
- **What the entry says about the limits, in a visitor's words** (the honest word, in the house voice, no numbers in the prose):
  *"Its old failing was a confident false alarm: a solo piano or a lead synth sitting in the voice's range read as singing… It now
  lights on about one frame in fourteen there… That was bought with caution: it also misses more of the quiet singing than it did,
  about a tenth of what it used to catch, and that is the trade I would rather have — a scene that stays dark through a piano solo is
  honest, a scene that pulses at a piano is a lie."* The lag and the ceiling are there too (*"about an eighth of a second behind the
  note… on music it has never heard it is right about four times in five"*), and so is the colourless light of a chopped sample. The
  camera bug is named as what it was: *"One bug went with all this, and it turned out to be the camera rather than the sound."*
- **The credits were already in place and were PROVEN to render, not re-written** ([[feedback-credit-where-due]]). §126 put all three
  corpora in both files, so **this tag added not one line**: `THIRD-PARTY.md` carries Demucs, librosa (its licence in full), the
  **Jamendo** corpus (CC BY 4.0), **MusicNet** (CC BY 4.0) and **MAESTRO v3.0.0** (CC BY-NC-SA 4.0, the archive's `LICENSE` line
  verbatim and the non-commercial paragraph), and `npm run build` copies it to `dist/`; the `/about` DOM was read on the dev route and
  returns **Jamendo true · MusicNet true · MAESTRO true · "CC BY 4.0" true · "CC BY-NC-SA 4.0" true**. The weights module's own header
  names the three.
- **The recipe (§125's ritual, the three-page rule standing, and §125's pitfall paid forward).** `package.json` +
  `assets/core/version.js` 0.38.0 → 0.39.0 (together, §89) · `releases.json` top entry (`v0.39`, 2026-10-12, class `engine`, title
  *"The voice reaches the scenes"*, the three §s, `scenes: [3, 4]`, no clip) — **hand-inserted as `JSON.stringify(rel, null, 1)` after
  the round-trip (`JSON.stringify(load(), null, 1) + '\n'` == the file) was checked byte-identical FIRST, for an 18-line pure
  insertion.** `releases.js`'s own `save()` still writes a different, compact layout and would reformat all 37 entries; **§125's note
  held and cost nothing this time** · `npm run build` (37 entries → `site/whats-new.html` 50 KB, the card's `#newin` line *New in
  v0.39: The voice reaches the scenes*, `dist/index.html` **149 modules, 1 494 624 bytes**) · `node tools/bundle.js
  releases/retinarave-v0.39.html` (**149 modules, 1 494 624 bytes**, `VER = '0.39.0'`; v0.38's frozen page was 146 / 1 468 403 — the
  +3 modules are `math/vox.js`, `dust/voice.js` and `torus2/voice.js`, and the +26 221 bytes are those three plus the weights module
  growing 104 297 → 105 339) · `git rm releases/retinarave-v0.36.html` (the three-page rule; `releases/` keeps v0.37 / v0.38 / v0.39,
  and v0.36's page is in history at its tag).
- **The gates, each green on the tree AFTER the bump.** The receipt with every number is
  `tools/accept/v0.39/tag-v0.39-2026-10-12.txt`:
  1. `node tools/check.js` — **150 modules · uniforms 161 · MS keys 223 · scenes 6 (help.feats gaps 0) · 0 fail · 4 warn** (the
     line-cap warns only: `core/scenes.js` 370, `ears/perc.js` 407, `dust/index.js` 364, `torus2/index.js` 367 — §127's reads live in
     each scene's own `voice.js`) · `releases.js check` **37 entries, top v0.39 == package.json 0.39.0, 0 problems** ·
     `whatsnew --check` up to date · `license.js --check` **153 public files, 0 without the header** (150 at v0.38 + the three new
     modules).
  2. `npm test` — 30 s, **exit 0** — and **the ONNX parity that §127's addendum recorded as FAILING now passes at 8.81e-7** (the
     `vox-cnn2` worktree had rewritten the shared fixture with run 2's outputs while main still shipped §123's weights; the merge
     brought the weights the fixture was written from, exactly as that finding predicted). The mel parity 7.05e-5 / 1.29e-5; the stage
     **74.3 µs per hop** median against ≤ 100; `test_voxscene` **27 ok**, `test_fluid` **350 ok**, `test_music` **151 ok**, every other
     suite OK. The misses still print as **notes**, never FAILs: Jamendo-test **F1 .795 against the plan's ≥ .82**, `voxHz` within a
     semitone on 45 / 55 / 9 %.
  3. the frozen page from `file://`, headless, **CLOCK=1** GPU=1 — `test&scene=0` → `{sc 0, pool, fluidOn true, errs [], bad [],
     frameN 300}` · `scene=1` → `{sc 1, bands, …}` · **`scene=3`** → `{sc 3, pool, …}` · **`scene=4`** → `{sc 4, pool, …}` — the two
     scenes the voice reaches, shot on the artifact itself. `CLOCK=1` from the first pass (v0.37's pitfall, paid forward twice now).
     A grep on the page returns **15 hits** for `vox-weights` / `VOX_W` / `Jamendo`: the weights and their attribution are in it.
  4. the no-third-party receipt (SOCIAL-PLAN §4) — **ONE host on every route**: `/whats-new` → `["127.0.0.1:8993"]` · `/`
     (`NOAUTO=1 real`) → `["127.0.0.1:8995"]` with `#newin` reading *"New in v0.39: The voice reaches the scenes → what's new"* ·
     `/about` → `["127.0.0.1:8995"]` with all three corpora and both licence strings in the DOM. The v0.39 article renders
     (`id="v0.39"`, the `engine` label, 12 October 2026, the notes line **§126 · §127 · §128**) and shows **two thumbnails**.
- **What was NOT run, and why — the brief's own instruction, and it holds.** The **full real-md5 roster** and **`accept.sh`**: §128
  paid the sweep this release needs and **the engine has not moved since**. §128 re-shot **s3 + s4** — the only two scenes that grew a
  read — at 86 runs, `f0` 2 on every run, `errs []`, `bad []`, 777 s, and §126 shot **s1** at this engine tree; the roster's other
  lines read nothing that moved (§123 held **264 of 264** with the vox keys live in both map modes: the stage is read-only to every
  other feature). The **fake smoke** was §128's, scoped to `IDS="1 3 4"`: all six lines = `tools/accept/v0.38/scene-md5-s127.txt` byte
  for byte, `errs []` hop 840 row 72 — the fake timeline reports `voxConf` 0, so the gate returns `w` 0 and no voice block is entered.
  HEAD at the last sweep was `7153fc1` / `73c37e0`; after it only the two version strings, `releases.json`, the generated site files,
  the frozen page, the receipt and docs moved. **No reference was re-based here** — the next release's sweep does that, never the tag.
  `accept.sh`'s routes / params blocks on NAV2 are **still owed** (since §118). **No director trace**: the roster is unchanged at
  `SCENES="0 2 3 4"`, no scene entered or left the rotation. **No audio was played and nothing was retuned.**
- **§128's finding is CARRIED, not fixed.** Four s3 FILE-mode lines of §127's list (RaindropsOnRoses intro / build1 / drop1,
  SeeYouDrop intro) are not reproducible from the tree and the lane they name — ruled out in five steps (determinism, §126's engine,
  the whole `assets/` tree at `3ce1e90`, the lane as an input, DUST's non-voice path), the suspect the **unpinned quality tier**
  (`q` 0.75 / tier 2 at the Raindrops-intro shot, and DUST's grain work scales with `q`). `real-md5-s128-s3.txt` is the reference for
  s3 from here, and **a DUST line is a proof only when the sweep that shot it is the sweep that reads it**. The 11 stale s3 lines of
  the v0.37 reference and the stale s1 pair are the same class; the next full sweep re-bases all of them.
- **The deploy shape, unchanged — and this is why the tag stays local.** `dist/` is what `npm run build` writes and what
  `wrangler.jsonc` serves (`assets.directory ./dist`); `dist/` is git-ignored and not committed, and there is no `.github/` workflow —
  the deploy is **Cloudflare, git-connected to `github.com/tbkraf08/RetinaRave`, building on a push to `main`**. **So the push IS the
  deploy**, and the user said *"tag for now, don't deploy"*: **nothing was pushed, `origin/main` is still at `66129a3` (v0.38's
  own addendum, the last thing pushed) and `retinarave.com` still serves `VER = '0.38.0'`.** When the word comes it is **ONE push** of `main --tags`, then poll for the `VER`
  line, **never a second push** (§115).
- **What is live when.** ONE release commit (this note, the receipt, `NEXT-SESSION-PROMPT.md` rewritten for the post-tag truth, the
  two versions, the entry, the generated `site/whats-new.html` + `index.html`'s line, `releases/retinarave-v0.39.html` in and v0.36's
  out), then `git tag -a v0.39 -m "v0.39: the vocal lane on the scenes, the CNN's second pass (§126–§128)"` — **and stop.**
- **What the user validates at home before the push (every remark in track time is a retune request).** (1) **THE NEW READS, unseen
  by any eye** — `#track=IBelongHere&scene=4`: TORUS2's strand takes the sung note's height, hue and brightness **while the nest sits
  still** (`941dd7a`); then `&scene=3`, DUST's grains on the sung register and the ribbon as a lone voice; both again with
  **`&vox=live`**; then `#track=RaindropsOnRoses&at=24` and `#track=SeeYouDrop`; the control **`#track=Comptine&scene=3&vox=live`**,
  which should now be nearly dark; `&t2vox=0` / `&dvox=0` / `&voxk=lo,hi` the A/Bs. (2) **FLUID2 on the NEW weights** (`#scene=1`,
  key `2`) — §123's read was validated by eye, but these are different weights: the quiet is quieter and the catch thinner.
  (3) the **false voice** on a live tab, now the measured 7.1 % / 4.2 % rather than 27.3 / 14.5. (4) carried from v0.38: §121 the rig
  itself, the two sources side by side, the hard cut FLUID → FLUID2, §118's keys and the Share-a-tab seat; from v0.36 the shockwave,
  FLUID in the rotation; v0.35's whole list.
- **Next, in order:** the eye above · **session 3 of `docs/plans/VOX-CNN2-PLAN.md`** (the TCN / GRU net — the only route to the last
  of the lag, since raw + hold is 80–90 ms before any ease — the pitch head, and the recall the narrowed SNR cost) · **scenes B
  (NAV2, MANDALA) only if the user asks.** `NEXT-SESSION-PROMPT.md` says the same in one line.

## §130 The governor and the vocal stage's cost — the load hold, no CNN under the lane, the pruned FFT (2026-10-13, one Fable worker in a worktree off v0.39 27728aa, branch `perf-vox`; the user: *"the quality of torus and dust seems lower (both file mode and t2vox=0)"*, then *"see poor quality in vox=live also; do the fixes"*)

- **What the bench found, and what it did not.** A bench across v0.37 / v0.38 / v0.39 (file mode, IBelongHere, scenes 3 + 4, the governor
  free) found **no scene-time regression** between the tags; what it found was in the governor and in the ears. (1) `core/quality.js`
  (−.2 per half second over 26.5 ms, −.07 over 18.8, +.04 per 2.5 s of good frames, the ceiling +.002 per window) took the file LOAD as
  bad frames: the track map's build is ~1–1.6 s of synchronous work on the main thread inside the file source's gates (§48), and the frame
  after it measures 0.25 s (the loop's cap), so the window it lands in averages 25–31 ms and costs −.2 — on every file load, in every tag,
  identically. (2) The loop's FIRST frame measures from t = 0 to the first rAF (the modules, the GL context, the first compiles: 0.25 s
  capped), so the first window of EVERY run — the fake timeline included — closed at 19–26 ms and took −.07 and a ceiling of .53; the
  ".69 at 40 s" the file load was measured against was that ceiling climbing at +.002 per window, not a level. (3) The vocal stage
  (§123, `ears/vox.js`: a 2048-point FFT + 40 mel + the stream net + a second YIN, ~75 µs per hop) ran in the PCM listener in every mode,
  and in file mode the §124 lane overwrote its three keys on the same frame — the CNN's read was computed and thrown away, ~0.15 ms per
  frame at 48 kHz. At 60 Hz the governor's good band above 16.67 ms is under a millisecond wide, so that is not nothing on a GPU nearer
  the edge. **Measured in real time** (`tools/load-bench.js`, new: q / Q.fps / ENGINE.ms / the ears' ms per frame every 500 ms of a
  real-time run, `MUTE=1` → `--mute-audio`, proven silent on the sink's monitor — rms 0 / peak 0 while IBelongHere ran; under `CLOCK=1`
  every frame is 16.67 ms and the clock is held through the decode, so the governor never SEES a load there, which is why no md5
  reference and no q trace had ever shown it). **Before** (`3c04e1d`, main + the bench's handles; IBelongHere, GPU=1, load 2.9–3.5,
  three runs each): the fake timeline s3 / s4 — q .48 at 1 s (the −.07 of the first window), **.57 at 10 s**, .68 at 40 s, no drop after
  1 s; file mode s3 (the lane) — q .35 / .48 / .35 at 1 s, the open at 4.5–4.8 s of page time, **−.2 at the open on every run** (.35 →
  .15, once twice: .35 → .15 → .08), **.27 / .28 / .14 at 10 s**, .43 / .40 / .26 at 40 s; s4 — **.27 / .27 / .36 at 10 s**, .44 / .44 /
  .57 at 40 s; `&vox=live` s3 — .36 / .15 / .23 at 10 s, .57 / .26 / .44 at 40 s; s4 — .36 / .40 / .23, .56 / .57 / .44; `&map=0` (the live
  lanes: no map, no stall) — the fake's curve exactly, .57 at 10 s, .68 at 40 s. ENGINE.ms (EMA, 10–40 s): the lane .93–1.01, `&vox=live`
  .94–1.03, `&map=0` .97–.98; the ears' ms per frame (the PCM listener, `EARS.cpuAcc / frames`, new): the lane **.276–.291**, live
  .272–.304, `&map=0` .291–.303 — the same in every mode, because the stage ran in every mode.
- **Fix 1 — the load hold** (`core/quality.js` `Q.load`, `LOAD_TAIL` 30; `sources/file.js` `AU.loading`; `loop.js` passes it). The file
  source raises `AU.loading` at the start of its decode and drops it when the map is built and the playhead opens (the error path and
  `teardown` drop it too; a newer source owns the flag); `updateQuality` holds while it is up and for LOAD_TAIL frames after — the stall's
  own frame is the first frame AFTER the open, so the window it lands in closes inside the tail. Held means: a window over either knee
  lowers neither q nor its ceiling and resets no good run; the controller keeps measuring (`Q.fps`) and keeps climbing on good windows
  exactly as before — so q resumes from where it stood before the load, never from the floor the stall sent it to. **The page's own
  start begins held too** (the first window's 0.25 s is the same kind of stall, in every mode). The thresholds and the climb rate are
  untouched; the recorder's pin (§92 `Q.hold`) still wins at every window, held or not; the HUD's q line says `load` / `pin` while one is
  on. The capture start was checked, not assumed: `getDisplayMedia` and the worklet's `addModule` are async, nothing synchronous waits
  there (and capture is only provable headed, HARNESS), so it gets the page-start hold like every mode and no more. **Why nothing
  deterministic can move:** under `CLOCK=1` no window is ever over a knee (16.67 ms frames, the clock held through the decode, the fake
  has no load), and the hold only changes what a window OVER a knee does — so every md5 reference holds by construction, the fake smoke
  included. **After** (`ff6d0e1`, the same protocol, load 2.6–3.4): the fake s3 / s4 — q .55 at 1 s, **.83 / .83 / .87 at 10 s**, 1.00 by
  20 s; file mode s3 (the lane) — **.55 flat through the open, no drop on any run, .67 / .67 / .67 at 10 s**, .99 at 20 s, 1.00 at 40 s;
  s4 — **.67 / .67 / .67 at 10 s**, .99–1.00 at 20 s; `&vox=live` s3 — .67 / .67 / .67, s4 — .67 / .63 / .67, both 1.00 by 40 s; `&map=0`
  — .87 / .83 / .83 at 10 s. fps 59.4–60.0 everywhere, errs [] everywhere. **The brief's criterion read in page time is MISSED by .16**
  (the file's .67 against the fake's .83 at 10 s, the allowance .05): the 4.5 s the fetch + decode + map build take are 4.5 s in which q
  stands at .55 and does not climb (it did not climb through the load before §130 either — the page is decoding and the windows are not
  under the 17.5 ms knee), while the fake's climb starts at 2.5 s; read from the OPEN the two curves are the same curve (+.04 per second
  from the first good 2.5 s: the file reaches .83 at ~14.5 s of page time, 10 s after its open). The user's symptom — **.14–.36 at 10 s
  and .26–.57 at 40 s, every file load, every scene — is .67 at 10 s and 1.00 by 20 s**, which is what the fake timeline now reads too.
- **Fix 2a — no CNN while the lane feeds the keys** (`features-ears.js` `laneFeeds()`, `Ears.setVoxSkip`, `VoxTrack.skip`). The one
  condition under which `earsStage` overwrites voxS / voxHz / voxConf with the Demucs sidecar (§124: file mode, the map built for this
  file, a lane, `ENGINE.voxLane`) is now read per block in `onBlock`, and while it holds the vocal stage is not run — the ring, the
  band-pass, the FFT, the mel, the net, the YIN. `&vox=live`, `&map=0`, a track without a sidecar and every live source keep it running:
  the live tier is exactly what it was. Turning the skip off replaces the track with a fresh `VoxTrack` (the ring, the normaliser and the
  net re-prime as on a new source) — it never happens mid-stream today (a new source is a new `Ears`), but the door is honest. **The
  wiring proof** (`test_vox.js` (iv)): with the skip on, every one of the 31 other ears fields byte-identical on 30 s of SeeYouDrop at
  60 fps, the three keys idle at 0 / −1 / 0, `Ears.push` **0.158 → 0.064 ms per block (−94 µs per hop)**, the stub's own 0.079 beside
  it. MS cannot move in file mode: the lane overwrote the same three fields before and after. **After, in the page:** the ears' ms per
  frame on the lane **.276–.291 → .136–.143** (−.14–.15 ms per frame, the whole stage at ~1.56 hops per frame — the brief's "~0.19"
  was the §126 p99 figure per hop, the median is 75); ENGINE.ms on the lane .93–1.01 → **.80–.84**.
- **Fix 2b — NOT taken: reading the synapse Analyzer's FFT.** The finding, in full: `synapse/analyzer.js` computes `f2 = FFT(2048)` —
  the SAME class the ears copied verbatim (periodic Hann, |X|·2/Σwin) — at every 512-sample hop over the 2048 samples ending at the hop,
  which is exactly the vox front end's spectrum. In DETERMINISTIC file mode the two are the same floats: `tickFile` pushes the same 512
  blocks to the tap and to the PCM bus, `F.mono` is (L + R)·0.5 in float32 and the ears' mid is 0.5·(l + r) stored into a Float32Array,
  the same rounding. In LIVE mode they are not: the Analyzer's hop phase counts from the worklet's first (silent) block while the ears
  start a fresh `Ears` on every stamp jump, and the worklet's own downmix feeds the tap while the ears downmix the PCM bus's L / R — the
  two 2048-sample windows are not the same samples, so the mel would not be bit-identical in the mode the user listens in 90 % of the
  time, and the live md5 lines (`&map=0`) could not be promised. Two more reasons it stays undone: the ears' contract (`ears.js`: no DOM,
  no clock, no import outside `engine/ears` — node == page == Worker) would be broken by reaching into a stage that runs in `frame()`,
  and the Worker move below puts the two on different threads. **What it would have saved:** the FFT alone, **45.1 µs per hop** of the
  stage's 74.8 (the parts bench, below) — ~70 µs per frame in live mode. Inside the ears there is no other 2048: `tonic.js` runs an 8192
  every 32 hops over a different window.
- **Fix 2c — the pruned FFT, bit-identical** (`dsp.js` `FFT.magsLo(ring, start, mask, out, kMax)`; `vox.js` `kMax` 341). `mags()` for
  the bins 0..kMax only: the first stage written as the add / subtract its exact (1, −0) twiddle evaluates to (`re[b]·1 − im[b]·(−0)` is
  `re[b]` up to the sign of a zero, and no later product, sum or squared magnitude can see the sign of a zero — the one way it could,
  `sqrt(re² + im²)`, squares it away), each later stage producing only the sub-bins the next stage reads — min(size − 1, kMax) — so the
  2048's last two stages run 342 butterflies per block instead of 1024 / 512, and the magnitude loop stops at kMax. The vocal front end's
  40 HTK-mel triangles end at bin 341 (8 kHz at 48 kHz). `mags()` itself is untouched (`tonic.js`, synapse). **The proof is exact, not
  1e-4** (`test_vox.js` (vii)): `magsLo == mags` with `Object.is` on every bin 0..341 of every hop of SeeYouDrop — **14 775 hops, 0 bins
  differ** — and the front end through it (the log-mel, the normalised column, voxS / voxHz / voxConf) **identical hop for hop over 60 s**.
  **The parts bench** (`test_vox.js --bench`, new notes; the machine at its floor, load ~2.9): the FFT **45.1 → 37.8 µs** per call, the
  sample loop alone 4.8 µs per hop, the stage **74.8 µs per hop through `mags` → 64.4 through `magsLo`** (median; §126 recorded 75.7 /
  74.8 / 74.2), the ruler's per-track medians **65–67 µs** (§126: 74–76), p99 130–207. What else was looked at and left: the net (38 k
  multiply-adds per hop, its accumulation order is the ONNX parity's — any reordering moves bits), the YIN (14.6 k ops per inference,
  every 4 hops), the per-sample band-pass (4.8 µs for the whole loop), the per-inference `{hz, conf}` object — nothing bit-identical and
  material is left in the hop path; the rest is the FFT's 38 µs and the net's ~20. In the page the live modes read within noise of
  before (`&vox=live` .272–.304 → .264–.277 ms per frame, `&map=0` .291–.303 → .283–.293; ENGINE.ms .94–1.03 → .92–.97): ~16 µs per
  frame is under what a 500 ms sample of a real-time page resolves — the node bench is the number.
- **The gates.** `node tools/check.js` **150 modules · 0 fail · 4 warn** (the soft caps) · `node tools/license.js --check` **153 public files, 0 without the header** · `npm test` **exit 0** (`test_vox.js` all ok: the mel parity, the ONNX parity, the ruler unchanged, the wiring's 31 fields with the stub AND with the skip, the lane's grid, the pruned FFT's 0 bins / 0 values, the bench under 100 µs; every other test as before) · **`test_rec.js` all ok** (the §92 pin still wins: `Q.hold` .75 held through the take, q0 .55, free again after the stop; `MUTE=1`) · **the fake smoke** (`GPU=1 PORT=8952 IDS="1 3 4" tools/scene-md5.sh s130`): the six lines = `tools/accept/v0.38/scene-md5-s127.txt` byte for byte — the hold did not leak into the fake path · **the real sweep** (`GPU=1 PORT=8953 PAR=2 SCENES=1 tools/real-md5.sh s130-s1`, the s126 reference's scope, 43 runs, f0 2 on every run, errs [], 78 s wall): **all 66 lines HELD to the byte** against `tools/accept/v0.38/real-md5-s126-s1.txt` — the 32 `&map=1` AND the 34 `&map=0` — so no q-pinned content proof was needed: the governor runs free in the sweep, but under `CLOCK=1` it never sees a window over a knee (Fix 1 changes no q there), the skip feeds the lane's own values (Fix 2a), and the FFT is the same floats (Fix 2c). The list and the load bench's raw runs are recorded as `tools/accept/v0.39/real-md5-s130-s1.txt` and `tools/accept/v0.39/load-bench-s130.txt`.
- **Out of scope, the next structural step: the ears to a Worker.** Everything the ears need is already there — `ears.js` has no DOM,
  no clock, no `Math.random`, no import outside `engine/ears`, and `vox-net.js` was written to "run in node, in the page and in a
  Worker, and cost the same" — so the PCM listener's whole cost (the lane .14, live .27 ms per frame, plus the §123 CNN's p99 hops) can
  leave the main thread: blocks go over a port, the history ring comes back per frame (or the Worker keeps the ring and answers `read(t)`
  with one `postMessage` per frame, as `math/mandel.js` does today, the only Worker in `assets/`). The determinism contract (node == page
  == Worker, CONTRACTS) is what makes it safe; the det-mode harness (`tickFile` pushing blocks inside `frame()`) is what makes it a
  design — the Worker's answer must be back before the stage reads, so det mode either keeps the ears in-thread or waits on the port.
  Not started here.
- **The bench's handles** (`3c04e1d`): `tools/load-bench.js`, `MUTE=1` in `tools/cdp.js` and `tools/test_rec.js`, `EARS.cpuAcc` /
  `EARS.frames` (running totals, accounting only) and `ENGINE.EARS` (the harness's handle). No behaviour moves. HARNESS: the env line
  and "The load bench" under "Q trace".
- **Not tagged, not pushed, not merged, nothing deployed; no audio played** (every real-time run muted and proven so). The user retests
  on main once `perf-vox` is merged (his server on 8765 serves main): `#test&track=IBelongHere&scene=4` and `&scene=3` (the lane),
  the same with `&vox=live` (the CNN on a file), `&map=0` (the live lanes) — the HUD's `q` line reads `load` through the decode and
  climbs from .55 after the open instead of from .15.

**§129 addendum — the v0.39 tag RE-POINTED to include §130 (2026-10-13, one Fable worker on main, no worktree; the user: *"tag"*).**
§130's five commits (`3c04e1d` the bench's handles · `898e790` the load hold · `55df446` no CNN under the lane · `ff6d0e1` the pruned
FFT · `68775ba` the record) landed AFTER the v0.39 release commit, so the local tag at `27728aa` named a tree without them. On the
user's one word the tag was **moved to a new release commit on `main`** rather than left behind: `releases.json`'s v0.39 entry gains
**§130 in `decisions`** (the article's notes line now reads *§126 · §127 · §128 · §130*) and **one clause in the body**, in the entry's
own voice and with no numbers — the governor that *"was reading the pause while a track is read off the disk as the machine
struggling"* and now *"waits out a load and carries on from where it stood"*, and the network that is *"no longer asked for an answer
that is thrown away on the same frame"*. **The entry's date stays 2026-10-12** (the release's own day; only the tag moved), and
§125's pitfall was paid forward again — the round-trip (`JSON.stringify(load(), null, 1) + '\n'` == the file) was checked
byte-identical FIRST and the edit was a hand insertion of 3 lines, never `save()`.
- **Regenerated, not rewritten:** `node tools/whatsnew.js` → `site/whats-new.html` 52 030 bytes (37 entries, two lines changed);
  `index.html`'s `#newin` line **did not move** (the title is unchanged, so the card's string is the same one) — the generator says
  `#newin current`. `npm run build` 149 modules → `dist/index.html` 1 502 547 bytes, and `node tools/bundle.js
  releases/retinarave-v0.39.html` the same **149 / 1 502 547, `VER = '0.39.0'`**: the module count is unchanged (§130 added no module)
  and the **+7 923 bytes over the first cut's 1 494 624** are §130's code — `LOAD_TAIL` 7 occurrences, `AU.loading` 7, `setVoxSkip` 4,
  `laneFeeds` 3, `magsLo` 3 in the artifact. The three-page rule already stood from §129; nothing was `git rm`'d.
- **The gates, all green on the re-pointed tree** (the receipt `tools/accept/v0.39/tag-v0.39-2026-10-13.txt`): `check.js` **150
  modules · 0 fail · 4 warn** (§129's four line caps) · `releases.js check` **37 entries, top v0.39 == 0.39.0, 0 problems** ·
  `whatsnew --check` stale before the regeneration, **up to date** after · `license --check` **153 / 0** · `npm test` **exit 0** in
  31.4 s (the mel parity 7.05e-5 / 1.29e-5, the ONNX parity 8.81e-7, the stage **66.0 µs per hop** median against §129's 74.3 —
  Fix 2c — the skip's 31 fields, `magsLo == mags` on 14 772 hops / 0 bins, `test_voxscene` 27 ok, `test_fluid` 350 ok, `test_music`
  151 ok; the two misses still notes) · the **frozen page from `file://`** headless `CLOCK=1 GPU=1 MUTE=1` on **scenes 0, 1, 3, 4** —
  `{sc, pool/bands, fluidOn true, errs [], bad [], frameN 300}`, all four lines §129's to the character · **ONE host** on
  `/whats-new` and on `/` (`NOAUTO=1 real`), the v0.39 article rendering the `engine` label, 12 October 2026, the new notes line and
  its two thumbs. **No sweep was re-run and no reference re-based:** §130 paid the roster this release needs three commits ago
  (`real-md5-s130-s1.txt` — all 66 lines held to the byte, `&map=1` and `&map=0`; the fake smoke byte for byte) and the engine has not
  moved since. **No audio was played** — `MUTE=1` on every run.
- **Not pushed, not deployed.** `git tag -f -a v0.39` at the new commit, `git describe --tags` == `v0.39` at HEAD, and **that is
  where it stops**: the push IS the deploy (§129's shape, unchanged), the user's standing word today is *tag*, and `retinarave.com`
  still serves `VER = '0.38.0'`. Owed before the word is still **the user's eye on scenes 1 / 3 / 4**, live and file — and now the
  HUD's `q` line reading `load` through a decode and climbing from .55 after it.
## §131 The ears off the main thread — a dedicated Worker for the live modes (2026-10-13, one worker in a worktree off main 68775ba, branch `ears-worker`; §130's "out of scope, the next structural step")

- **THE DESIGN, before any of it was written.** The ears are already a causal, pure-DSP facade on 512-sample hops with no DOM,
  no clock and no `Math.random` (CONTRACTS: node == page == Worker), so what had to be designed was not the DSP but the SEAM.
  It is the facade's own split: everything that COMPUTES a frame (the sub, the perc bank, the tonic, the texture, the pulse and
  §123's vocal net) goes to a dedicated Worker, and everything that READS one — the history ring, the release rule, the
  interpolation at heard time, `out` — stays on the main thread as `EarsReader`, because that read is what the stage must do
  inside `frame()` and it costs nothing (0.001 ms per read, §130's cost table). Blocks go over a port and per-hop FEATURE
  FRAMES come back; the host writes them into the same ring with the same field order (`pushFrame`), so the heard-time read
  discipline is untouched and one implementation of `read(tHeard)` serves both transports. **Not** `read(t)` over the port:
  that would make the frame wait a round trip, which is the stall this move exists to remove. **Deterministic file mode keeps
  the ears in this thread** (`PCM.local`: `sources/file.js` pushes the blocks inside `frame()` and the stage reads them in the
  same frame), so every md5 reference, every trace and every ruler runs the path it always ran and the Worker is exactly what
  the user watches 90 % of the time: capture, mic, demo and a file played in real time. The PCM bus itself stays on the main
  thread — the PCM clock (§56) and the loudness stage (§63) are listeners too — so what leaves is the ears' DSP, not the
  samples: a 4 KB copy into a pooled transferable and one `postMessage` stay behind. Node and every tool keep the in-process
  `Ears` class unchanged: one code path for the DSP, two transports.
- **The transport.** `ears/core.js` is the producer protocol (pure, no `self`): `init` (a stream: sample rate, options, a
  generation), `b` (one block: L, R, the stamp, the vocal-skip flag and the PCM clock's line STATE), `beat` (the pulse's beat
  length) in; `f` per block out — the frames (`t` Float64Array, `v` Float32Array, nf × 23 in the ring's field order), the
  onsets, §90's line corrections, the block's DSP ms, and the two block buffers handed BACK for the next block (the steady
  state allocates nothing). `ears/worker.js` is that core on a Worker scope; `ears/host.js` is `EarsHost extends EarsReader`
  on the main thread: one Worker per page, one GENERATION per stream (a seek or a new source builds a new host, which the
  stages already detect by object identity, and frames from an older generation are dropped). A Worker that will not start or
  dies hands the next block back to an in-process `Ears` — the fallback is the old path, whole.
- **The two things a function cannot do over a port, and what was done instead.** (1) §90's clock-line hook
  (`PercTrack.line`): the host ships the clock's STATE (t, b, f, conf) with every block and the Worker evaluates `Clock.at`'s
  own arithmetic on it — and the state it ships is the one the in-process ears read, because the clock pushes AFTER the ears in
  the bus's listener order, so both see the previous block's. (2) The onsets the clock takes as ticks: `EarsReader.onsetFeed()`
  is the seam, the pending list in this thread and the host's own (identical) pending list over the port. An arrival buffer was
  tried first and REJECTED by measurement: on IBelongHere it offered the clock two kicks this thread never offers (a line kick
  whose flag drops after a read has already released it) and the published clock drifted from 17.5 s on 2553 of 3601 reads
  while every ears field was still identical. The port's job is to be the same floats.
- **The determinism proof** (`tools/test_earsw.js`, in `npm test` at 30 s; `tools/ears-worker-node.js` is a web-shaped Worker
  scope for node). A track streamed through BOTH transports at once, block for block, read at the same heard times, with a
  `Clock` beside each lane fed exactly as features-clock.js feeds it. On **all eight library tracks** (40 s each, the "tune on
  all tracks" rule): every one of the 34 `EARS_FIELDS` at every read identical under `Object.is` — **a tolerance was never
  used** — the released onsets (type, t, vel, amp) identical, the LOW lane the reactive drums read identical, the published
  PCM clock (bpm, phase, count) identical on every read, and §90's promoted kicks and the clock's ticks equal in count
  (0–24 line kicks, 145–504 ticks per window). 56 pass, 0 fail. On SeeYouDrop at 60 s: 3601 reads × 34 fields, 0 differ; 600
  events; 160 low onsets. And the REAL `ears/worker.js`, started over a `worker_threads` port, returns 400 blocks / 20 999
  floats **bit-identical** to the in-process frames — the file the page starts is the file node proved.
- **The one behaviour a real port moves, measured.** The onsets reach the PCM clock on the next main-thread task after the
  reply — about one block (10.7 ms at 48 kHz) after the hop that found them, where in this thread the clock reads them inside
  that same block. Each onset still carries its own sample-exact time, so what is late is the ARRIVAL of a right measurement
  (an out-of-sequence Kalman update), not the measurement. `test_earsw.js` (vi) runs the in-process ears with the clock fed one
  block late: over 20–40 s, **max |Δbpm| 0.025–0.238 and max |Δ beat phase| 1.6–25.2 ms** across the eight tracks (CyborgNinja
  the tightest, Comptine the loosest, SeeYouDrop 0.090 / 8.0, IBelongHere 0.059 / 5.7). Live only, and under the eye's own
  threshold for a beat line; it is the price of the margin below, and it is stated here rather than discovered later.
- **The latency, and the number that matters.** The message lag (`EARS.lagAcc / lagN`) is the round trip's own delay and is
  bounded by the main thread's frame cadence — the Worker's reply waits for the next task between frames, so on a 60 Hz page it
  reads 11 ms mean with a 104 ms worst at the page's start (the Worker's script parsing while the first blocks queue). That
  number is NOT the feature delay, and the brief's "under one hop" cannot be read off it. The honest comparator is
  `EARS.staleAcc / staleN` — **heard time minus the newest history frame in the ring at the moment the frame reads it**, which
  carries everything in the ear's way: the capture buffering, the hop that has not closed, the display lead and, over a port,
  the round trip. On a 30 s real-time run (IBelongHere, scene 4, `&vox=live`, muted): **main −44.0 ms mean / +17 ms worst,
  worker −44.4 / 0** — the ears run ~44 ms AHEAD of heard time in both transports (the output buffering), so the round trip
  lands inside slack that already existed, and the worker lane never once left a frame reading past the newest frame where the
  main-thread lane did. **The display lead for live (0 ms) needs no change on this evidence** (§131 does not touch
  `dispNow()`): the features a live frame reads are not later than they were.

- **The before / after, the §130 protocol** (`tools/load-bench.js`, real-time muted file runs of IBelongHere, GPU=1, three runs
  per cell, this machine's floor is not free — the user's own Chrome was up, load 4.5–6.0 — so read the PAIRS, which ran
  minutes apart under the same load). `ears` is the PCM listener's ms per frame on the MAIN thread (`EARS.cpuAcc / frames`),
  which is the whole point; `ENGINE.ms` is the engine's EMA 10–40 s; the Worker's own DSP ms per block is beside it.

  | cell (scene · vox) | ears ms/frame **worker** | **main** | ENGINE.ms **worker** | **main** | q@10 s W / M | q@20 s W / M |
  |---|---|---|---|---|---|---|
  | s4 · the lane | **.034 / .034 / .038** | .152 / .142 / .144 | **.798 / .794 / .837** | .855 / .889 / .866 | .67 .63 .63 / .67 .67 .67 | .99 / .99–1.00 |
  | s4 · `&vox=live` | **.035 / .040 / .046** | .324 / .335 / .295 | **.802 / .881 / .944** | 1.15 / 1.18 / 1.09 | .67 .63 .67 / .63 .63 .63 | .95–.99 / .95–.99 |
  | s4 · `&map=0` | **.038 / .037 / .037** | .324 / .324 / .323 | **.837 / .811 / .823** | 1.09 / 1.12 / 1.09 | .83 .83 .83 / .79 .87 .87 | 1.00 / 1.00 |
  | s3 · the lane | **.041 / .046 / .043** | .165 / .146 / .153 | **.873 / .963 / .871** | .971 / .874 / .916 | .67 .63 .63 / .63 .67 .67 | .95–1.00 / .99–1.00 |
  | s3 · `&vox=live` | **.034 / .032 / .033** | .272 / .279 / .266 | **.751 / .749 / .750** | .963 / .995 / .947 | .63 .67 .63 / .67 .63 .67 | .95–1.00 / .99 |
  | s3 · `&map=0` | **.032 / .034 / .034** | .330 / .297 / .321 | **.744 / .760 / .750** | 1.01 / .994 / 1.05 | .83 .83 .83 / .87 .83 .87 | 1.00 / 1.00 |

  So the main thread gives up **.11–.13 ms per frame on the lane and .24–.29 ms in the live lanes** (`&map=0` / `&vox=live`,
  where the §123 CNN runs), and `ENGINE.ms` falls **.05–.09 on the lane and .20–.30 live** — the Worker's own 0.175–0.198 ms
  per block is now somebody else's thread. fps 58.4–60.0 and errs [] in every cell. **`q` does not move**, and it should not:
  at 60 Hz the governor's good band starts at 16.67 ms and these pages sit at 0.7–1.2 ms of engine time with the GPU doing the
  rest, so a third of a millisecond is margin, not a tier — it is the margin the user's *"quality seems lower"* came out of
  (§130), and the next GPU nearer the edge is where it shows. The file-load curve is §130's exactly (q .55 held through the
  decode, .63–.67 at 10 s, .99–1.00 by 20 s; `&map=0` .83 at 10 s, 1.00 by 20 s): the hold is untouched.
- **The latency, measured both ways** (three 30 s muted real-time runs per transport, s4, IBelongHere; `lag` is the message
  round trip, `stale` is heard time minus the newest ring frame at read time — negative means the ears are AHEAD of the ear).

  | cell | ears ms/frame | Worker DSP ms/block | lag mean / worst | stale mean / worst |
  |---|---|---|---|---|
  | `&map=0` **worker** (the live path) | .033–.040 | .192–.198 | **0.32–0.41 / 7.7–14.1 ms** | **−43.1…−44.6 / 0 ms** |
  | `&map=0` **main** | .293–.302 | — | — | −43.6…−43.9 / 0 ms |
  | `&vox=live` **worker** (a file's map) | .032–.038 | .175–.200 | 4.07–4.73 / 96–108 ms | −43.2…−43.7 / 10.3–17 ms |
  | `&vox=live` **main** | .309–.326 | — | — | −42.5…−44.3 / 0–6.7 ms |

  **Under one hop, on the path that matters**: in the live lanes the round trip is 0.32–0.41 ms mean and 7.7–14.1 ms at its
  worst, against the hop's 10.7 ms. The 96–108 ms worst in the two map cells is the TRACK MAP'S OWN STALL (§48: 1–1.6 s of
  synchronous main-thread work inside the file source's gates): the worklet keeps posting blocks through it and no reply can be
  delivered until it ends, so the queue drains afterwards — the same stall shows as the only positive `stale` in the table
  (10.3–17 ms against main's 0–6.7). **No live source has that stall** (`getDisplayMedia` and `addModule` are async, §130), and
  `&map=0` is the live path on a file: 0 positive staleness on every run. **So the display lead for live (0 ms) needs no
  change** and §131 does not touch `dispNow()`: on the user's path the features a frame reads are not later than they were,
  and they were already ~43 ms ahead of heard time in both transports.

- **The switch and the HUD.** `&ears=main | worker` parses outside `#test` (like `&lead=` / `&glitch=`): `main` keeps the DSP
  in the PCM listener for the whole page — the A/B, and the path for a browser without module Workers — and `worker` is the
  default. The HUD's engine line says which and what it costs: `ears main 0.29 ms` or
  `ears worker 0.04 ms (dsp 0.19 lag 1.2/14.8)` — this thread's drained ms per frame, then the Worker's own DSP ms per block
  and the round trip's current / worst delay; neither of the last two is main-thread time, so neither is in `ENGINE.ms`.
- **Starting a Worker in a page that may fetch nothing.** The module page has a file, so the host starts
  `assets/engine/ears/worker.js` as a module Worker by URL. The single-file build has no file and the landing promises no
  runtime fetch, so `tools/bundle.js` now bundles the Worker's graph with the same transform it bundles the page with and
  writes it into `ears/wsrc.js`'s one export; the host wraps that string in a Blob and starts a classic Worker from it. The
  build line prints both: **151 modules + 12 in the ears Worker, 218 KB inline, the page 1468 → 1695 KB** (the ears graph is
  in the document twice — once for the main thread's fallback and the det path, once for the Worker — which is the price of
  one file and no fetch). So `dist/` and the frozen release pages run the Worker from `file://` too.

- **The gates.** `node tools/check.js` **154 modules · 0 fail · 4 warn** (the same four soft caps as §130) · `node
  tools/license.js --check` **157 public files, 0 without the header** · `npm test` **exit 0** with `test_earsw` in the chain
  (`test_vox` unchanged — the mel parity, the ONNX parity, the ruler, the wiring, the lane grid, the pruned FFT; `test_music`
  151 ok, 0 fail) · `tools/test_ears.js --sr=48000 --trace` before and after step 1 **cmp-identical** (9456 frames, 44 fields)
  · **the fake smoke** (`GPU=1 PORT=8952 IDS="1 3 4" tools/scene-md5.sh s131`): the six lines = `tools/accept/v0.38/scene-md5-s127.txt`
  **byte for byte** · **the real sweep** (`GPU=1 PORT=8930 PAR=2 SCENES="0 1 2 3 4" tools/real-md5.sh s131`, the HARNESS default
  scope — every track, both map modes, the take — **215 runs, 330 lines, f0 2 on every run, errs [] on every run, 37 min
  wall**): **EVERY LINE HELD TO THE BYTE** against the reference each scene's lines belong to — s0 and s2 (66 + 66) against
  `tools/accept/v0.37/real-md5-v037.txt`, s1 (66) against `tools/accept/v0.39/real-md5-s130-s1.txt`, s3 and s4 (66 + 66)
  against `tools/accept/v0.38/real-md5-s128-s3.txt` / `-s4.txt`: **0 moved of 330**, which is what deterministic file mode
  keeping the in-process ears means · **the frozen page from file://** on scenes 0 / 1 / 3 / 4: errs [] on all four, 60 fps —
  and the honest note that in CHROMIUM from `file://` the PCM bus's own worklet cannot load at all (`blob:null/<uuid>` is
  cross-origin there), so no block is delivered and the ears never run on that page: **the same error on
  `releases/retinarave-v0.38.html`**, a build from before §131, so it is not §131's and it is not new. The Chromium proof of
  the inline Worker is the bundle over http (844 blocks, lag 0.2–0.5 ms, errs [] on all four scenes), and **headless Firefox
  runs the inline Worker from `file://`** (Playwright `firefox-1509`, §96, with `media.autoplay.default: 0` or the context
  stays suspended and nothing is ever delivered): **842 blocks round-tripped, 60 fps, presence 0.98, errs [], no console
  line** on scenes 0 / 1 / 3 / 4. Capture and mic were not measured — they are only provable headed (HARNESS) — and they take
  the same code path as `&map=0`.
- **The records.** `tools/accept/v0.39/real-md5-s131.txt` (the sweep's 330 lines and what they were read against),
  `load-bench-s131.txt` (the raw runs of both tables) and `earsw-s131.txt` (the two transports on all eight tracks).

- **What is left.** (1) The PCM bus still wakes the main thread for every block, because the PCM clock (§56) and the loudness
  stage (§63) read the same samples there — moving the clock into the same Worker would close §131's one behavioural gap (the
  tick that arrives a block late) and take another ~0.1 ms per frame off this thread; it is the next structural step, and it is
  bigger than this one (the clock publishes through the lead and is swapped into v3's fields per frame). (2) The worklet could
  post straight to the Worker's port (a `MessageChannel` handed into the AudioWorklet) once nothing on the main thread needs
  the blocks — that is the same step. (3) `SharedArrayBuffer` would turn the reply into a lock-free ring and remove the
  task-queue wait altogether, but it needs COOP/COEP on `site/_headers`, which changes what the page may embed; not taken,
  and not needed at the measured slack. (4) The ears graph is in the single-file page twice (218 KB); a shared module table
  across the page and its Worker would need the Worker to be a module Worker from a Blob, which cannot resolve relative
  imports. (5) `&ears=main` keeps the old path for an A/B in the user's own eye — the HUD says which thread is talking.
- **No scene, no CNN weight, no gate was touched; nothing tagged, pushed, merged or deployed; no audio played** (every
  real-time run `MUTE=1`). The user's A/B once this is merged (his server on 8765 serves main):
  `127.0.0.1:8765/#test&track=IBelongHere&scene=4&vox=live` against the same with `&ears=main` — the HUD's engine line reads
  `ears worker …` / `ears main …`, and the look must be the same look.

## §132 v0.40 tagged, NOT deployed — the ears off the main thread (2026-10-14, one Opus worker on main, no worktree; the user: *"cut v0.40"*)

- **What ships** (everything on `main` since the v0.39 tag at `3592a32`, which already carried §130; this note adds no code):
  **§131 THE EARS OFF THE MAIN THREAD** — the facade's own seam, designed before a line was written: everything that COMPUTES a
  frame (the sub, the perc bank, the tonic, the texture, the pulse and §123's vocal net) goes to a dedicated Worker
  (`ears/core.js` the pure producer protocol, `ears/worker.js` that core on a Worker scope, `ears/host.js` `EarsHost extends
  EarsReader`, `ears/wsrc.js` the bundled inline source for the single-file build), and everything that READS one — the history
  ring, the release rule, the interpolation at heard time — stays here, because that read is what the stage must do inside
  `frame()` and it costs nothing. **Deterministic file mode keeps the in-process ears** (`PCM.local`), so every md5 reference,
  trace and ruler runs the path it always ran; the PCM bus stays on this thread because the PCM clock (§56) and the loudness
  stage (§63) read the same blocks; a Worker that will not start falls back to the old path whole. `&ears=main | worker` is the
  A/B (`worker` the default) and the HUD's engine line says which thread is talking and what it costs. Measured: **live ears
  .03–.04 ms per frame against .27–.34**, `ENGINE.ms` down .05–.09 on the lane and .20–.30 in the live lanes, the round trip
  **0.32–0.41 ms mean against the hop's 10.7**, every `EARS` field `Object.is`-identical on all eight tracks with **no tolerance
  ever used**, and **0 of 330 real-md5 lines moved**. · plus **`0a60073`**, the handoff commit — docs only.
- **The class is `engine`, and `scenes` is `[]`.** Nothing a listener sees moved: no scene was added, no id moved, no look, no
  MS key, no CNN weight and no gate. So **no thumbnail was rendered** — the first entry since v0.33 with an empty `scenes`, and
  deliberately so (§129's two thumbs were `dust.jpg` + `torus2.jpg`; this release renders none). The entry's `decisions` is
  **`[§131]`** alone.
- **What the entry says, in a visitor's words** (the house voice, no numbers in the prose, no § — `check.js` refuses one):
  the title *"The listening moves to its own thread"*, and the honest shape of a release that changes nothing you can see —
  *"Nothing a scene is handed changed, and I proved that rather than claimed it: the old arrangement and the new one were run
  side by side on the same sound, on every track in my library, and every value a scene reads was compared one at a time,
  exactly, never within a tolerance"*; what it buys is *"the thread that draws no longer stops to listen"*, and the limit is
  named at once — *"On this machine you will not see the detail level move, because that time was margin rather than a step; on
  a machine nearer its limit it is the difference between a frame arriving and a frame arriving late, and it is the same margin
  the softness I went looking for last release came out of."* The two honest limits are both in it: §131's **one behavioural
  move** (*"the part that follows the beat is now told about a kick a hop of the thread after the ears found it… it is a shift,
  and it exists only while listening live; the kick itself still carries the moment it happened"*) and the **old** Chromium
  limit, named because it now looks new (*"a single saved page opened straight off the disk cannot start this browser's audio
  plumbing at all, which was already true of the page before this one"*). **The user A/B'd the two transports by eye today** on
  his own server and said the Worker is the better of the two (*"first line, ears worker"*), which is what the entry's *"and the
  new one is the one I would keep"* carries — the first time a tag's entry states a preference the user had already given.
- **The recipe (§125's ritual, §129's step for step, the three-page rule standing, §125's pitfall paid forward a third time).**
  `package.json` + `assets/core/version.js` 0.39.0 → 0.40.0 (together, §89 — and `test_rec.js` is the gate that they agree:
  the take's file name came out `retinarave-v0.40-nav2-…webm`) · `releases.json` top entry (`v0.40`, **2026-10-14**, class
  `engine`, title *"The listening moves to its own thread"*, `decisions` `[§131]`, `scenes` `[]`, no clip) — **hand-inserted as
  `JSON.stringify(rel, null, 1)` after the round-trip (`JSON.stringify(load(), null, 1) + '\n'` == the file) was checked
  byte-identical FIRST**, for a **13-line pure insertion** (`git diff --numstat` 13 added, **0 removed**). `releases.js`'s own
  `save()` still writes a different, compact layout and would reformat all 38 entries; **the note held and cost nothing again**
  · `npm run build` (38 entries → `site/whats-new.html` **54 951 bytes**, and `index.html`'s `#newin` line **did move** this
  time, because the title did: *New in v0.40: The listening moves to its own thread → what's new*; `dist/index.html`
  **151 modules + 12 in the ears Worker, 218 KB inline, 1 744 344 bytes**) · `node tools/bundle.js
  releases/retinarave-v0.40.html` (**the same 151 / +12 / 1 744 344, `VER = '0.40.0'`**) · `git rm
  releases/retinarave-v0.37.html` (the three-page rule; `releases/` keeps v0.38 / v0.39 / v0.40, and v0.37's page is in history
  at its tag).
- **The frozen page, read against v0.39's** (149 modules / 1 502 547 bytes): the page graph gains **exactly two** modules —
  `ears/host.js` and `ears/wsrc.js`, diffed module key by module key against `releases/retinarave-v0.39.html` — while
  `ears/core.js` and `ears/worker.js` live in the **Worker's** graph only, which is why `check.js` counts four new files and the
  bundler counts two. The **+241 797 bytes** are those two plus the **218 KB inline Worker source**: the ears graph is in the
  document TWICE, once for this thread's fallback and the det path and once for the Worker, which is §131's stated price of one
  file and no runtime fetch. In the artifact `EARS_WORKER_SRC` returns **6 hits**, the first of them the Worker's own source
  string. **A finding on the receipt I was asked for:** the literal `ears worker` is **not** in the page and never was — the
  HUD assembles the line at draw time (`ears ${earsLine()}` in `core/hud.js`, with `'worker ' + me + ' ms (dsp '` and
  `'main ' + me + ' ms'` both present), so a grep for the assembled phrase is empty by construction and the three greps above
  are what prove the word ships.
- **The gates, each green on the tree AFTER the bump.** The receipt with every number is
  `tools/accept/v0.40/tag-v0.40-2026-10-14.txt`:
  1. `node tools/check.js` — **154 modules · uniforms 161 · MS keys 223 · scenes 6 (help.feats gaps 0) · 0 fail · 4 warn**
     (154 = §130's 150 + §131's four files; the four warns are §129's line caps unchanged: `core/scenes.js` 370,
     `ears/perc.js` 407, `dust/index.js` 364, `torus2/index.js` 367) · `releases.js check` **38 entries, top v0.40 ==
     package.json 0.40.0, 0 problems** · `whatsnew --check` **up to date** · `license.js --check` **157 public files, 0 without
     the header** (153 at v0.39 + §131's four).
  2. `npm test` — **51.5 s, exit 0** — with **`test_earsw` in the chain**: 1800 reads × 34 fields **0 differ**, the onsets
     211 vs 211, the LOW lane 42 vs 42, the published PCM clock 0 differ on 1800 reads, §90's line kicks 7 vs 7 and ticks
     170 vs 170, and the **real `ears/worker.js` over a real port 400/400 blocks / 20 999 floats identical**; (vi) the clock fed
     one block late **max |Δbpm| 0.090, max |Δ beat phase| 8.0 ms** (the price, stated). `test_vox` unchanged — the mel parity
     7.05e-5 / 1.29e-5, the ONNX parity 8.81e-7, the stage **70.3 µs per hop** median against ≤ 100, the pruned FFT
     **14 772 hops / 0 bins**, the wiring's 31 fields; `test_voxscene` **27 ok**, `test_fluid` **350 ok**, `test_music`
     **151 ok**, every other suite OK. The two misses still print as **notes**, never FAILs: Jamendo-test **F1 .795 against the
     plan's ≥ .82**, and IBelongHere's recall.
  3. `node tools/test_rec.js` (the version pair's own gate) — **GPU=1 MUTE=1: all ok**, the §92 pin still wins (`Q.hold` .75
     through the take, free again from q0 .55 after the stop), 360 frames at 60.0 fps composited, the name and the sidecar
     carrying **v0.40**. **A LOAD FINDING, recorded not fixed:** *without* `GPU=1`, on swiftshader under this machine's load of
     19–20 (another agent's worktree was building at the same time), the single assertion *"after the stop the governor is free
     again … from q0 0.55"* FAILS — the diagnostic read is `{hold: null, q: 0.15, load: 0, fps: 10.9}`, so **`Q.hold` IS null
     and the pin released correctly**; the governor is doing its job on a page running at 11 fps and the failure is the
     assertion's own tolerance (`|q − q0| < 0.05`) meeting a software-GL frame rate. Not a §131 regression, and nothing was
     re-baselined.
  4. the **frozen page from `file://`**, headless, **CLOCK=1 GPU=1 MUTE=1** — `test&scene=0` → `{sc 0, pool, fluidOn true,
     errs [], bad [], frameN 300}` · `scene=1` → `{sc 1, bands, …}` · `scene=3` → `{sc 3, pool, …}` · `scene=4` → `{sc 4,
     pool, …}` — **all four lines §129's and §130's to the character**. `CLOCK=1` from the first pass (v0.37's pitfall, paid
     forward a third time). §131's honest note stands and is **not this tag's**: in Chromium from `file://` the PCM bus's own
     worklet cannot load at all (`blob:null/<uuid>` is cross-origin there), so the live ears never run on a saved page — **the
     same error on `releases/retinarave-v0.38.html`**, a build from before §131. The fake timeline needs no PCM, which is why
     those four lines are clean; the Chromium proof of the inline Worker is §131's bundle over http (844 blocks, lag 0.2–0.5 ms)
     and headless Firefox from `file://` (842 blocks, 60 fps), neither re-run here because the Worker's source bytes are the
     same bytes.
  5. the no-third-party receipt (SOCIAL-PLAN §4) — **ONE host on every route**: `/whats-new` → `["127.0.0.1:8993"]` · `/`
     (`NOAUTO=1 real`) → `["127.0.0.1:8995"]` with `#newin` reading *"New in v0.40: The listening moves to its own thread →
     what's new"* · `/about` → `["127.0.0.1:8997"]`. The v0.40 article renders (`id="v0.40"`, the `engine` label, 14 October
     2026, the notes line carrying §131) and shows **no thumbnails at all**, which is what `scenes: []` means. The credits were
     **already in place and unchanged** ([[feedback-credit-where-due]]): §131 borrowed nothing — no corpus, no solver, no idea —
     so `THIRD-PARTY.md` and the `/about` DOM are v0.39's, proven there. **The user's own dev server on 8765 was left running
     and untouched**; every port here was 8993+.
- **What was NOT run, and why — the brief's own instruction, and it holds.** The **full real-md5 roster**, **`accept.sh`**, the
  **fake smoke**, `test_ears --trace` and a fresh **load bench**: **§131 paid every one of them** on its own branch and **the
  engine has not moved since** the merge (after it only the two version strings, `releases.json`, the generated site files, the
  frozen page, the receipt and docs moved). §131's receipts stand as this release's content proof —
  `tools/accept/v0.39/real-md5-s131.txt` (the HARNESS default scope, **215 runs, 330 lines, f0 2 on every run, errs [] on every
  run, 37 min wall: EVERY LINE HELD TO THE BYTE, 0 moved of 330**), the fake smoke byte for byte against
  `tools/accept/v0.38/scene-md5-s127.txt`, and `load-bench-s131.txt` / `earsw-s131.txt`. **No reference was re-based here** —
  the next release's sweep does that, never the tag. §128's md5 finding is still **CARRIED, not fixed** (four s3 FILE-mode lines
  of §127's list; `real-md5-s128-s3.txt` is the reference for s3 from here). `accept.sh`'s routes / params blocks on NAV2 are
  **still owed** (since §118). **No director trace**: the roster is unchanged at `SCENES="0 2 3 4"`, no scene entered or left
  the rotation. **No audio was played and nothing was retuned.**
- **The deploy shape, unchanged — and this is why the tag stays local.** `dist/` is what `npm run build` writes and what
  `wrangler.jsonc` serves (`assets.directory ./dist`); `dist/` is git-ignored and not committed, and there is no `.github/`
  workflow — the deploy is **Cloudflare, git-connected to `github.com/tbkraf08/RetinaRave`, building on a push to `main`**.
  **So the push IS the deploy**, and the user's word was *"cut v0.40"*: **nothing was pushed, `origin/main` is still at
  `66129a3` (v0.38's own addendum, the last thing pushed) and `retinarave.com` still serves `VER = '0.38.0'`** — it is now
  **two** tags behind the tree. When the word comes it is **ONE push** of `main --tags`, then poll for the `VER` line, **never a
  second push** (§115).
- **What is live when.** ONE release commit (the two versions, the entry, the generated `site/whats-new.html` +
  `index.html`'s line, `releases/retinarave-v0.40.html` in and v0.37's out, the receipt and this note), then
  `git tag -a v0.40 -m "v0.40 — the ears off the main thread"` — **and stop.** Nothing in `../RetinaRave-vox-net3` (branch
  `vox-net3`) and nothing under `assets/engine/ears/vox*` was touched.
- **Next, in order:** the user's word on the push · **session 3 of `docs/plans/VOX-CNN2-PLAN.md`** (the TCN / GRU net for the
  last of the lag, the pitch head, and the recall the narrowed SNR cost — Jamendo-test F1 .795 is still the plan's miss) ·
  §131's own "what is left" (the PCM clock into the same Worker, which closes the one-block tick and takes another ~0.1 ms off
  this thread) · **scenes B (NAV2, MANDALA) only if the user asks.**

## §132 FLUID2 reset to the §108 pool — the take of 2026-10-09 15:51 EDT, before the ring (2026-10-14, one Opus worker in a worktree off main ac46def; the user: *"the version I liked was before ring was added"* / *"do option 1"*)

- **What the user watched.** A screen recording of the LOCAL build of **2026-10-09, 15:51 EDT (19:51 UTC)** — its sidecar says page
  version **0.34.0** (the tree had not bumped yet: v0.35 was cut at 18:16 EDT the same day), source **tab capture, i.e. LIVE mode**,
  **scene id 12 "fluid"**, **225 s**. The tree at that minute was `9658d8f` (§109's last commit, 15:48 EDT) — and
  `git diff feb1f67 9658d8f -- assets/core/fluid/ assets/scenes/fluid/ assets/math/` is **EMPTY**, so **`feb1f67` IS the take's FLUID
  to the byte**: §104's substrate + §106's scene + §107's drop clear + §108's harmonic floor and chord shears.
- **Why `feb1f67` and not v0.35.** Both are pre-ring (§113's shockwave ships in v0.36), but v0.35 (`eaa745b`, 18:16 EDT) carries
  **§111's eight tuning items**, every one of them committed between 16:16 and 17:34 that afternoon — **after** the recording. The
  density governor, the pinned key, the syrup rule, the bounded void, the confirmed clear, the tonic-relative axis, the floor on the
  track's own range and the harmonic branch are all absent from what the user saw; and **§111 was never A/B'd by eye** (it was tuned
  against `fluid-tracks.js`'s per-track table and the survey's strips). Taking v0.35 would have handed back a reading the user has never
  judged. So the slot gets §108, exactly.
- **The recipe is §120's, a second time.** FLUID2's card keeps its slot — `fluid: { grammar: 'bands' }` (CONTRACTS §1.4) — and
  `core/fluid/inject2.js` is **overwritten**; the name `'bands'` is now only a slot key, not a description. **What is retrievable where:**
  the §121 RIG grammar (the 23 invisible mouths, the chases, the note hues, the lead's height, the blinder) is at
  **`git show v0.40:assets/core/fluid/inject2.js`**, its test block at `git show v0.40:tools/test_fluid.js`, its strips in
  HARNESS "## Fluid"; the §116 band grammar before it is at `git show v0.37:assets/core/fluid/inject2.js`. **FLUID (id 0) was not
  touched** — not `inject.js`, not `grammar.js`, not `core/fluid/shaders.js`, not its scene folder, not the ears or the engine.
- **The grammar** (`core/fluid/inject2.js`): `git show feb1f67:assets/core/fluid/inject.js` to the byte under a ten-line §132 note.
  36 declared reads, 21 constants, `mkState()` = `{clearLeft, anchor, xSub, snarePrev, chordLeft}`. It **composes nothing** — there is no
  `base` in its state, so it is not inject.js's plan() re-placed, it IS inject.js's plan() as it was. `assets/math/{util,keycolour,oklab}.js`
  and `assets/engine/feats.js` have **not moved since feb1f67** (`git diff` empty on all four), so the replay is the take and not an
  approximation of it.
- **The mood hue, the one line of plumbing.** The §108 `plan(S, dt, st, moodHue = 0.6)` takes a fourth argument — `LOOK.mood.hue`, the
  colour anchor's fallback while `keyConf < .3`; §111 removed that read from the pool grammar and `fluid.js` stopped passing it. So
  `core/fluid/fluid.js` re-imports `LOOK` (as it did at feb1f67) and passes it **on the `'bands'` call alone**:
  `GRAMMARS.bands.plan(S, dt, st2, LOOK.mood.hue) : GRAMMARS.pool.plan(S, dt, st)` — the pool call is byte-identical to §111's, and
  `look.js` imports only `math/util.js`, so no cycle. `st2.base = st` and `st2.n = 0` stay (minimal diff): both keys are **inert** on a
  state the §108 grammar never reads, and the line says so now.
- **The six droplets are back, on purpose.** FLUID's §106 scene threw a ring of **six droplets** outward from the centre on the confirmed
  drop (`RING_N` 6, `RING_R` .22, `RING_V` 1.6, `RING_DYE` .04, radius ×3) on the **slam rule** —
  `mapDropEvt || dropLiveEvt || (mapOn <= .5 && dropEvt)`. §113 (`e49c7f3`) deleted them: measured against the new velocity shockwave the
  centre grey moved 41.6 → 41.5, so they bought nothing *next to the ring*. With the ring gone they are the only thing the drop does to
  the picture, and they are in **every pre-§113 build** — therefore in the take. They stay, with the nine feats that feed them.
- **The scene** (`assets/scenes/fluid2/{index,help}.js`): `git show feb1f67:assets/scenes/fluid/*` with **only the card's identity**
  carried over from today's FLUID2 — `name: 'fluid2'`, `id: 1` (key 2, the §118 renumber), `score() { return 0; }` and **no `card`**
  (forced-only, no landing tile), the `fluid: { grammar: 'bands' }` slot, and the show program renamed `'fluid2-show'` so the two scenes
  do not share a program key. Everything else is feb1f67's: the constants, the nine feats
  (`loudRel loudRange loudAbs dropLiveEvt mapDropEvt mapOn dropEvt hat2 presence`), the slam rule, `update` / `draw` / `hud`, the two
  params, `post: { fb: { decay: .35, advect: 1 }, bloom: { thr: .5 }, kaleido: 0, morph: { flow: .4 } }`.
  `assets/scenes/fluid2/shaders.js` already equalled feb1f67's FLUID shader but for two header lines and was left alone.
- **`check.js`, one rule relaxed and one tightened — the same question.** The fluid block FAILED a non-default grammar whose
  `FLUID_FEATS` lacks any of the pool's, because until today every non-default grammar **composed** the pool and therefore ran its reads.
  The §108 copy does not: its list is its own 36 reads and lacks today's `bass`, `centroid`, `dirty` (§111 item 8's noise guard). The rule
  is now gated on composition — **`'base' in GRAMMARS[g].mkState()`** (the RIG's state had `base: null`, the §108 state has no such key) —
  rather than padded with fields the file never touches. **The judgment call:** the `unread` *warn* two lines above exempts the pool's
  reads for a non-default grammar for exactly the same reason, so it is gated on the same test; that is a tightening, not a relaxation,
  and it produces **0 new warns**. Nothing else in `check.js` moved.
- **The tests** (`tools/test_fluid.js`, the `bands` block): the RIG's 24 behaviour assertions are replaced by an **identity** proof, since
  identity is the whole claim. (a) the interface, `FLUID_FEATS ⊂ FEATS` with no `pred*` / `*Vel` / `dropEvt`, no `base` in `mkState()`,
  the table / the slot / `grammarOf` / forced-only with the nine reads named. (b) **BYTE-IDENTITY against the reference read out of git at
  test time** — `git show feb1f67:assets/core/fluid/inject.js` written to a temp module whose three `../../math/` specifiers are made
  absolute (so both modules import the same math), then `K`, `FLUID_FEATS`, `mkState()`, and **every output frame and the end state** over
  600 synthetic frames and over SeeYouDrop's 6 601 real frames, at **moodHue .6 and .2** (the frames at `keyConf` .1 exercise the fallback
  the fourth argument feeds). Where git cannot reach `feb1f67` it prints a **note**, never a FAIL. (c) determinism — two fresh states on
  the real trace, identical JSON — and the Proxy MS that throws on a read outside the declared list. `test_fluid` **331 ok, 0 fail**
  (350 under the RIG).
- **The eight-track replay** (`tools/accept/v0.40/fluid-tracks-s132.txt`): `INJECT=<the feb1f67 temp module>` vs
  `INJECT=assets/core/fluid/inject2.js`, `node tools/fluid-tracks.js` over all eight library tracks in both map modes plus the pad take —
  **`diff` of the two JSON row files is empty, and so is the diff of the two markdown tables**. `fluid-tracks.js` needed **no fix**: its
  RIG / band reads are already guarded (`rows[0].P.kick !== undefined`, `rows[0].P.heave !== undefined`, `st.base || st`), and under the
  §108 grammar they simply report `—`. The table is the §108 reading on the record: SeeYouDrop map 1 injects on 100 % of its music
  seconds, **2 clears at 57.6 / 105.6 s (both true), 0 shockwaves**, hit x pinned at **.30 / .70** (the survey's "three fixed points" that
  §111 item 8 spread), the governor column `—` because `INK_BUDGET` does not exist yet.
- **The gates.** `node tools/check.js` — **154 modules · uniforms 161 · MS keys 223 · scenes 6 (help.feats gaps 0) · 0 fail · 4 warn**
  (the four are §129's unchanged line caps). `npm test` **exit 0** — `test_fluid` 331 ok / 0 fail, `test_music` 151 ok / 0 fail,
  `test_vox` / `test_earsw` / `test_voxscene` / every other suite OK. The **fake scene-md5** (`IDS="0 1" GPU=1 PORT=8871
  tools/scene-md5.sh s132`, errs `[]` hop 840 row 72 on both): **s0 = `3e483039` / `2274bb4e`, the reference's to the hash**
  (`tools/accept/v0.38/scene-md5-s127.txt`, itself v0.35's s0 pair — **FLUID did not move**), and **s1 is new at `aa626832` /
  `8372bc28`**, which is what a different grammar under the same show pass must read (it was `293d773c` / `96ad310a` under the RIG).
  And the **real-music proof, which is the one that counts** (`SCENES="0" GPU=1 PORT=8871 tools/real-md5.sh s132`, the HARNESS default
  scope for one scene — every library track + the pad take, intro / groove / build1 / drop1 / boundary1 / chords, both map modes):
  **43 runs, 66 lines, f0 2 · errs [] · bad [] · sc 0 on every run, 780 s wall — 0 of 66 MOVED** against
  `tools/accept/v0.39/real-md5-s131.txt`'s s0 lines. s2–s5 were not shot: nothing outside `core/fluid/{fluid,inject2}.js` and
  `scenes/fluid2/` moved, and the pool's velocity reaches no roster scene at `fb.advect` 0 (§109). The records are
  `tools/accept/v0.40/scene-md5-s132.txt`, `real-md5-s132-s0.txt` and `fluid-tracks-s132.txt`.
- **A finding on the way, not fixed and not mine.** `npm test` fails on **untouched `main`** in this working tree: `test_vox`'s ONNX
  parity block throws `TypeError: Cannot read properties of undefined` because `tools/work/vox/onnx-parity.json` (gitignored scratch) was
  **overwritten at 20:48 today by the CNN session-3 worker** with the new net's shape (`voice` / `pitch` heads in place of
  `logit` / `prob`; `run-s133.done` is beside it at 20:49). Reproduced on the clean repo before anything of §132 was written. The gate
  above was run with that one file pointed at `onnx-parity-run2.json` — run 2 is the net that ships (§126) — and `test_vox` then passes
  with its own numbers (mel parity 7.05e-5 / 1.29e-5, the stage 64.5 µs per hop, the pruned FFT 14 772 hops / 0 bins). **Nothing in
  `tools/work` was rewritten**; the worktree holds read-only symlinks to the main tree's artefacts.
- **What will NOT look exactly like the take, and why that is right.** Two things have moved under the scene since October and neither is
  FLUID2's to undo. (1) **§130's load hold**: the quality governor no longer dips at startup, so the first ~10 s run at a higher tier than
  they did on 9 October — the sim and dye grids reach their size sooner and the opening is cleaner than the recording. (2) **The voice
  loses its only consumer in the pool**: §121's RIG was what read `voxS` / `voxHz` / `voxConf` into a fluid picture, and the §108 grammar
  predates the detector entirely. TORUS2 and DUST keep theirs (§127, §128), and FLUID (id 0) never had one. Everything else the engine
  gained since — the ears in a Worker (§131), the vocal lane, the renumber, the arrow keys — is upstream of the grammar or outside it,
  and file-mode determinism is unchanged (the byte-identity run is the proof).
- **No tag, no push, no deploy, `releases.json` untouched.** `origin/main` is still at `66129a3` and retinarave.com still serves
  **v0.38.0**, two tags behind. The eye check is the user's: `http://127.0.0.1:8765/` → Share a tab → key **2** (LIVE mode, which is the
  mode the take was shot in), or `http://127.0.0.1:8765/#test&scene=1` for the fake timeline.

## §133 The live vocal detector's third pass — a streaming net every hop, a pitch head on the stem's pYIN, the YIN on the mix pulled (2026-10-14/15, branch `vox-net3` in a worktree off main 0a60073, one Fable session; `docs/plans/VOX-CNN2-PLAN.md` session 3 "THE NET"; the user's decisions carried from §126: no look-ahead, chops are not voice, the NC sets stay in and the weights ship, the net's shape *"by the numbers"*)

- **What it is.** The §123–§126 net was a 40 × 34 log-mel WINDOW read once per four hops (conv / pool / conv / pool / dense) and a
  second YIN on the mix for the pitch. This pass replaces it with a net that outputs EVERY hop and carries its own pitch: a causal
  TCN over the normalised mel column (`ears/vox-net.js`: 40 → 48 with kernel 3, five 48 → 48 blocks at dilations 1 2 4 8 16, residual,
  ReLU — receptive field 65 hops ≈ 693 ms, 43 296 multiply-adds per hop, 43 646 parameters) with two heads on its shared 48-wide
  column: the VOICE logit and a 61-way PITCH softmax (60 semitone bins C3..B7 + none), trained on pYIN of the Demucs vocal STEMS —
  the Jamendo train stems' computed this pass (`voxtrain.py --pyin-only`, voxtruth.py's recipe, cached under `tools/work/vox/pyin/`),
  the library's from `tools/truth/<T>.vox.json`. `voxHz` is the head's bin refined inside it by HARMONIC SALIENCE on the ears' own
  2048-point FFT (Σ k = 1..5 of |X| at k·f over 11 candidates across the bin's ±50 cents); the YIN, its band-pass and its decimation
  ring are gone from the stage (the Yin class stays in dsp.js for the sub). The vote (§126) is per hop now — 3 of the last 4 hops at
  the .3 gate — and the ease is unchanged (.03 attack under the vote, .05 release); `voxConf` = voxS × the head's voiced mass. The
  interface did not move: `voxS` / `voxHz` / `voxConf`, the rig's two reads, nothing in `assets/scenes`, `math/vox.js`, `core/`, or the
  ears' other stages (test_vox.js (iv): 31 fields identical with the stage stubbed; the fake smoke's six lines = s127's). The whole
  pipeline keeps §126's front end and data recipe (the mel cache reused as is; held out unseen: IBelongHere + Comptine; WhoLikesToParty
  out of the loss); `voxtrain.py --net=cnn|tcn|gru` trains the three shapes, the stream nets on windows of 128 hops with the loss on
  the last 64 columns (every column its own voice and pitch target; a band-shifted window has no pitch loss, a mel band is not a
  semitone), `--tcn-c` / `--tcn-dil` / `--onset-w` / `--pitch-w` the knobs, `export_stream` the weights module for both heads and the
  parity frames with EVERY column. The stream is exact: left zero-padding in the batch model = 64-slot rings that start at zero in the
  JS, so column t here is the batch model's column t (test_vox.js (ii): 200 held windows × 64 columns, voice 6.8e-6, pitch 1.2e-5).
- **The runs — seven, the budget's six plus a one-epoch smoke; all on run 2's data (the quota 35/10/25/30 unless said, SNR −6..+6, soft
  floor .3, 12 or 16 epochs × 200 k windows of 128 hops), Jamendo valid picks the epoch.** The 2-D baseline is §126's run 2 as shipped
  (the same data, 400 k windows of 34). `MAC` is per hop; `fp` Comptine's false-positive frames at .5 (the report), raw ≥ .3 (the net
  alone), eased ≥ .3 (`vox-ab`'s live sung %); `pitch ±1` the head within a semitone of the stem's pYIN on Jamendo test / IBelongHere /
  RaindropsOnRoses / SeeYouDrop; `lag` raw / eased from `vox-ab --stage=all` (the voiced three's medians); the bench `test_vox.js --bench`.

| run | shape | MAC/hop · params | Jamendo test F1 / P / R / AUC | IBelongHere F1 / P / R / AUC (unseen) | Comptine fp .5 / raw ≥ .3 / eased ≥ .3 | classical held (mn-pi / mn-st / ma) | pitch ±1 % (Jam / IBH / RoR / SYD) | lag raw / eased ms | bench µs |
|---|---|---|---|---|---|---|---|---|---|
| §126 run 2 (v0.39, the 2-D window) | 40 × 34 conv/pool ×2, dense | 38 385 · 38 385 | .795 / .861 / .738 / .886 | .748 / .971 / .608 / .869 | 1.4 / – / 3.5 | 0.4 / 4.1 / 1.1 | the YIN on the mix: 45 / 55 / 9 % vs the lane | 60 / 120 | 74–76 |
| 1 tcn1 | TCN C 32, dil 1 2 4 8 16 | 21 184 · 21 438 | .806 / .871 / .750 / .892 | .737 / .958 / .600 / .852 | 4.1 / 12.8 / 12.9 | 1.9 / 5.0 / 2.7 | 43.7 / 41.3 / 47.3 / 8.7 | 90 / 140 | 77 (loaded) |
| 2 gru1 | the 2-D trunk per hop (pool (2,1) ×2) → GRU 32 | 72 256 · 23 150 | .812 / .895 / .743 / .906 | .694 / .970 / .541 / .856 | 0.3 / 1.8 / – | 0.4 / 1.9 / 0.3 | **5.3 / 4.6 / 5.4 / 0** | – | – (72 k is over the gate by construction; not built in JS) |
| 3 tcn2 | TCN C 48, 16 epochs | 43 296 · 43 646 | **.819** / .852 / .788 / .896 | .781 / .955 / .661 / .847 | 3.8 / 11.2 / 11.6 | 1.1 / 5.1 / 3.4 | 48.5 / 48.7 / 56.9 / 11.7 | 140 / 180 | ~100 under a training load |
| 4 tcn3 | TCN C 48, dil 1 2 4 8 (RF 33) | 36 384 · 36 686 | .788 / .865 / .723 / .880 | .750 / .976 / .609 / .864 | 5.4 / – / 13.0 | 1.8 / 5.6 / 2.5 | 43.4 / 43.4 / 46.8 / 7.3 | **70 / 110** | 71–72 |
| 5 tcn4 | TCN C 40, quota 30/10/35/25 | 31 280 · 31 582 | .810 / .874 / .754 / .892 | .741 / .971 / .599 / .847 | 3.1 / 9.6 / 9.7 | 0.5 / 3.4 / 2.2 | 43.4 / 42.9 / 52.6 / 5.3 | 150 / 190 | 68 |
| **6 tcn5 (ships)** | TCN C 48, the onset weight ×3 on 10 hops | 43 296 · 43 646 | **.818** / .858 / .782 / .896 | .776 / .966 / .649 / .857 | **2.3** / 9.1 / 9.5 | 0.9 / 4.6 / 3.2 | **48.6 / 48.3 / 55.0 / 10.2** | 150 / 180 | **76.6 / 77.9 / 76.6** |

  **Why the TCN, why run 6.** The brief's rule: the TCN ships if its Jamendo F1 reaches the 2-D baseline + .02 = .815, otherwise the
  GRU head. Runs 3 and 6 reach it (.819 / .818); the GRU at the same width (.812) does not, and it could not ship anyway: the 2-D
  trunk's two frequency poolings leave 10 bands for the GRU to read a semitone from — its pitch head never learned (5 % within a
  semitone, 4 % on IBelongHere: the §126 YIN's own ceiling again), and 72 k MAC is 3.4× the TCN's for the same voice number. Run 6 is
  run 3 with the voice loss weighted ×3 on the ten hops after a 0 → 1 edge of the target (asking the net to commit early, from the past
  alone — causal): the same F1, Comptine's false voice 3.8 → 2.3 % at .5, and NO change in the lag (below). WhoLikesToParty (chops,
  recorded): 10.2 % of frames ≥ .5. The TCN at width 32 (run 1) stays in the table as the cheap point (21 k MAC, F1 .806).
- **The lag, measured and not fixed.** The hold is gone — raw = held on every row — but the TCN's own commit is LATER than the window
  net's: the receptive field decides it (RF 65: 90–150 ms raw across four runs; RF 33: 70; the 2-D's 34-hop window: 60), neither the
  onset weight (run 6) nor the ease moves it — the ease sweep (`vox-ab --ease=attack,release,of,on`, six settings on run 1, three on
  run 6) changes the eased lag by 20–50 ms at the cost of flicker (.75× → 1.16× the lane's), so the §126 ease stays. The stage lags:

| weights · ease | raw | held | eased | hold · ease | flicker live / lane | Comptine · Vienna % ≥ .3 |
|---|---|---|---|---|---|---|
| §126 run 2 · attack .03 / release .05, voted 2 of 3 inferences (v0.39) | 60 (90 / 60 / 60) | 90 (110 / 90 / 80) | **120** (160 / 120 / 120) | 20–30 · 30–40 | 0.77x | 3.5 · 7.0 |
| run 4 tcn3 (RF 33) · the same ease, voted 3 of 4 hops | 70 (70 / 100 / 60) | 70 | 110 (110 / 140 / 100) | 0 · 40 | 0.91x | 13.0 · 23.1 |
| **run 6 tcn5 (ships) · the same ease, voted 3 of 4 hops** | 150 (100 / 150 / 180) | 150 | **180** (140 / 180 / 210) | 0 · 30 | **0.75x** | **9.5 · 15.6** |

  Run 4 is the measured trade: 70 ms raw for F1 .788 (under the baseline). The brief's rule put accuracy first, so run 6 ships with
  the lag MISSED and recorded; swapping to run 4's weights is one copy (`tools/work/vox/vox-weights-tcn3.js` + `onnx-parity-tcn3.json`),
  and the next pass should look for the shape that keeps RF 65's F1 with RF 33's commit (a loss on the END column only, as the window
  net had; or a shorter field with more width).
- **The eight-track ruler (`test_vox.js` (iii) on run 6: `voxS` through the stage; `voxHz` = the head + the salience against the
  stem's pYIN; `vox-ab` against the lane).**

| track | hand s | voxS p50 in / out | ratio | fp % (≥ .5 outside) | lead p50 | voiced | voxHz vs the stem: a pitch on / within a semitone / modulo the octave | vs the LANE: pitched % · semi % · oct % | sung % lane / live · agree | lag eased |
|---|---|---|---|---|---|---|---|---|---|---|
| Comptine (the control, UNSEEN) | 0 | – / .061 | – | **2.3 — met** (1.3 in §126) | – | 0 | – | – | 0.0 / 9.5 · 90.5 | – |
| IBelongHere (unseen) | 199 | .583 / .101 | **5.8×** (8.2) | 9.1 (7.4) | – | 5549 | 49 / **48** / 48 % (50 / 45 / 48) | 47 · **97** · 98 (42 · 45 · 48) | 67.6 / 58.9 · 69 | 140 |
| RaindropsOnRoses | 94 | .770 / .068 | **11.4×** (11.0) | 12.9 (10.2) | **.829** (.900) | 2613 | 59 / **54** / 58 % (70 / 55 / 64) | 37 · **93** · 98 (31 · 55 · 61) | 44.2 / 47.6 · 79 | 180 |
| CyborgNinja | 0 | – / .008 | – | 0.0 (0.0) | – | 0 | – | 0 · – | 0.4 / 0.0 · 99.6 | – |
| Malicious | 1 | .217 / .067 | 3.2× (5.5) | 1.6 (0.3) | – | 52 | 0 / 0 / 0 % | 0 · – | 1.9 / 6.6 · 92 | – |
| SeeYouDrop | 75 | .662 / .105 | **6.3×** (5.6) | 2.1 (2.4) | – | 206 | 14 / **10** / 11 % (16 / 9 / 13) | 5 · **74** · 77 (3 · 9 · 9) | 47.2 / 41.2 · 77 | 210 |
| Vienna (in-sample) | 0 | – / .103 | – | 5.2 (1.6) | – | 0 | – | 2 · 91 | 1.4 / 15.6 · 84 | – |
| WhoLikesToParty (chops, recorded) | 64 | .097 / .173 | 0.6× (0.6) | 9.2 (10.4) | – | 0 | – | – | 22.5 / 23.7 · 62 | – |

  (§126's run 2 in parentheses.) The pitch is the pass's clear win: against the lane the page reads, 97 / 93 / 74 % within a semitone
  on the three sung tracks (45 / 55 / 9 % for the YIN on the mix), 98 / 98 / 77 % modulo the octave; against the stem's pYIN the head
  publishes a pitch on 49 / 59 / 14 % of the voiced frames and is within a semitone on 48 / 54 / 10 % — SeeYouDrop's processed,
  stacked lead stays the hard case (§122's own note). The false voice outside the hand windows rose on the two sung tracks (IBelongHere
  9.1, RaindropsOnRoses 12.9 %, the Vienna in-sample 5.2) and fell on Comptine.
- **The gates (per step `check` + `npm test`; the full set once at the close).** (1) `node tools/check.js` 0 fail / 4 warn (the two
  scene files over the soft cap, pre-existing) — **met**; `node tools/license.js --check` 157 public files, 0 without the header —
  **met**; `npm test` exit 0 (166 passes; test_fluid 350 ok; test_earsw OK — the ears Worker's determinism proof runs the new net
  inside the Worker; the first run of `npm test` in the worktree failed on the 17 gitignored MS traces that live only in the main
  checkout, linked in like `tools/work` — not a code fault) — **met**; `node tools/bundle.js` 151 modules + 12 in the ears Worker,
  236 KB inline — **met**. (2) The ONNX parity for a per-hop net: 200 held windows × 64 columns, voice max |Δ| 6.8e-6, pitch head
  1.2e-5 (≤ 1e-4) — **met**; the mel parity unmoved (7.05e-5 / 1.29e-5) — **met**. (3) The bench, three runs on the shipped net:
  76.6 / 77.9 / 76.6 µs per hop median (≤ 100; the FFT is ~47 of it; load 9–10 with the user's Chrome and Code open) — **met**. (4)
  Jamendo test F1 .818 against ≥ .84 — **MISSED** (the best of six runs; +.023 over the 2-D baseline); IBelongHere unseen P .966 /
  R .649 — recorded; Comptine unseen fp 2.3 % at .5 — **met**, 9.5 % at the .3 gate against ≤ 5 — **MISSED** (the net's raw ≥ .3 is
  9.1 %: every TCN sat at 9–13 % here, the GRU at 1.8 — the dense first layer over 40 bands is not frequency-shift invariant the way the
  2-D trunk is, the pitch-shift jitter alone does not buy it back); classical held-out 0.9 / 4.6 / 3.2 % — recorded. (5) eased lag
  median 180 ms against ≤ 80 — **MISSED** (above); flicker .75× the lane's (≤ 1.5) — **met**; semi % vs the lane 74 on SeeYouDrop (≥ 60),
  97 on IBelongHere and 93 on RaindropsOnRoses (≥ 85) — **met**. (6) The fake smoke `IDS="1 3 4" tools/scene-md5.sh s133`: six lines =
  `tools/accept/v0.38/scene-md5-s127.txt` to the byte — **met**; the real sweep `SCENES=1 PAR=2 MUTE=1 tools/real-md5.sh s133-s1`:
  43 runs, f0 2 and errs [] on every run; against `real-md5-s130-s1.txt` ALL 32 `&map=1` lines HELD to the byte (the lane feeds the
  lead and the CNN is skipped there, §130) and ALL 34 `&map=0` lines MOVED — expected, the live tier feeds FLUID2's lead there and
  the net, its weights and its pitch all changed; each moved line is listed with its old hash — **met as specified**. Records: `tools/accept/v0.39/vox-s133.txt` (the runs, the ruler, the A/B, the bench, the ease sweep) and
  `real-md5-s133-s1.txt`.
- **What is left.** (1) The user's eye on the three sung tracks in live mode (`#test&track=IBelongHere&scene=1&vox=live`, then 3 and
  4): the pitch should sit on the note now, the entrance ~60 ms later than v0.39's. (2) The lag: the next pass's one question (above);
  run 4's weights are the measured alternative. (3) Comptine at the .3 gate and the false voice on the sung tracks' quiet bars: a
  frequency-shift-invariant front layer (a small 2-D conv before the TCN, pooled in frequency but not time) is the obvious shape, and
  the GRU row says the negatives come with it. (4) F1 .84 stays unmet; the data recipe is unchanged since §126 and the Jamendo
  valid/test labels carry their own slop (§126). (5) No merge, tag, push or deploy from this branch; nothing on main touched.

## §134 The streaming net's second pass — a 2-D front layer and the loss on the END column: the lag back to 130 ms, run 10 ships (2026-10-15/16, branch `vox-net3` continued in the same worktree, served to the user on 8765; the user chose §133's option 3: *"one more pass on the shape that keeps RF 65's accuracy with RF 33's commit"*)

- **What it is.** Two candidates on §133's recipe (run 2's data, the onset weight ×3 that helped Comptine), four runs: **(b)** a 2-D FRONT
  LAYER ahead of the TCN — conv 3×3 ×8, causal in time, ReLU, max-pooled ×4 in frequency, its 8 × 10 column CONCATENATED to the raw 40
  bands as the TCN's input (`voxtrain.py --front=8`; the GRU row had read Comptine 1.8 % at .3 through a 2-D trunk where every pure TCN
  sat at 9–13 — a frequency-shift-invariant view beside the raw column the pitch head needs); **(a)** the loss on the END column only
  (`--loss-cols=1`: the net optimised for the newest frame's commit, as the §123 window net was, not averaged over 64 positions). Run 7 =
  (b); run 8 = (a)+(b); runs 9 and 10 = (a)+(b) at receptive fields 33 and 57 (`--tcn-dil=1,2,4,8` / `1,2,4,8,12`). `ears/vox-net.js`
  runs the front layer in the stream when the module carries one (`front` / `frontPool`; the ring of the four newest mel columns, the
  pooled features after the 40 raw bands — the batch model's concatenation order). Nothing else moved: the interface, the stage's ease
  and vote, the scenes, the ears' other stages (test_vox.js (iv) 31 fields identical).

| run | shape | MAC/hop · params | Jamendo test F1 / P / R / AUC | IBelongHere F1 / P / R (unseen) · fp outside the hand windows % | Comptine fp .5 / raw ≥ .3 / eased ≥ .3 | Vienna raw ≥ .3 | classical held (mn-pi / mn-st / ma) | chops ≥ .5 % | pitch ±1 % Jam · semi % vs the lane SYD / IBH / RoR | lag raw / eased (IBH / RoR / SYD) | flicker | bench µs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| §133 run 6 tcn5 (shipped) | C 48, RF 65, onset ×3 | 43 296 · 43 646 | .818 / .858 / .782 / .896 | .776 / .966 / .649 · 9.1 | 2.3 / 9.1 / 9.5 | 15.4 | 0.9 / 4.6 / 3.2 | 10.2 | 48.6 · 74 / 97 / 93 | 150 / **180** (140 / 180 / 210) | 0.75x | 77 |
| §133 run 4 tcn3 | C 48, RF 33 | 36 384 · 36 686 | .788 / .865 / .723 / .880 | .750 / .976 / .609 · – | 5.4 / – / 13.0 | – | 1.8 / 5.6 / 2.5 | 9.7 | 43.4 · 74 / 98 / 96 | 70 / 110 | 0.91x | 71 |
| 7 tcn6 | (b) front 8, RF 65 | 57 696 · 55 246 | .828 / .773 / .891 / .909 | .862 / .936 / .800 · **23.5** | 3.9 / 9.6 / 9.5 | 20.2 | 1.5 / 7.2 / 3.1 | 28.4 | **58.0** · 70 / 94 / 94 | **50** / 140 (140 / 90 / 190) | 0.82x | 90–92 |
| 8 tcn7 | (a)+(b), RF 65 | 57 696 · 55 246 | **.831** / .855 / .809 / .907 | .810 / .974 / .693 · 7.2 | **1.8 / 5.7 / 5.7** | **7.6** | 0.4 / 3.4 / 0.8 | 7.9 | 50.1 · 80 / 97 / 94 | 110 / 150 (150 / 110 / 200) | 0.72x | 90 |
| 9 tcn8 | (a)+(b), RF 33 | 50 784 · 48 286 | .807 / .840 / .776 / .886 | .782 / .952 / .664 · 13.0 | 4.8 / 12.2 / 12.3 | 17.9 | 1.8 / 3.6 / 2.2 | 17.8 | 46.8 · 83 / 96 / 92 | 80 / **120** (120 / 120 / 200) | 0.96x | 84–85 |
| **10 tcn9 (ships)** | (a)+(b), RF 57 (dil 1 2 4 8 12) | 57 696 · 55 246 | **.825** / .850 / .803 / .902 | .814 / .961 / .706 · 11.8 | 2.5 / 7.0 / 6.9 | 9.1 | 0.6 / 3.7 / 1.2 | 12.7 | 50.5 · 70 / 96 / 94 | 90 / **130** (130 / 130 / 150) | **0.63x** | **88.9 / 89.5 / 89.7** |

  **Why run 10.** The ship rule was: replace tcn5 only for ≥ 40 ms off the eased lag with ≤ .01 F1 lost and the semitone gates kept.
  Run 7 qualifies on the letter (−40, +.010) but the front layer alone made the net recall-heavy (P .773; false voice outside the hand
  windows 23.5 % on IBelongHere, 28 % on the chops, Vienna 20 % ≥ .3) — the quiet bars would light. Run 8 (the END-column loss on top)
  is the best detector of the pass (F1 .831, Comptine 5.7 % at .3, Vienna 7.6, precision .855) and misses the −40 by one 10 ms grid
  step (−30). Run 9 at RF 33 buys the lag (120) and pays .011 of F1 (one thousandth over the rule). Run 10 at RF 57 sits between: −50 ms
  (130 eased, and 130 / 130 / 150 per track — the first row with no 200 ms outlier), F1 +.007, the best flicker, Comptine 2.5 / 6.9,
  the semitone gates kept (70 / 96 / 94). The front layer is what moved the needle on both counts: F1 .818 → .825–.831 and the raw
  commit 150 → 50–110 with the END-column loss setting the precision; the receptive field then trades the last 30 ms against F1 (RF 65
  → 33 → 57: lag 150 / 120 / 130, F1 .831 / .807 / .825).
- **The lag table (vox-ab --stage=all, the voiced three's medians; hold 0 everywhere since §133).**

| weights | raw | eased | ease | flicker live / lane | Comptine · Vienna % ≥ .3 |
|---|---|---|---|---|---|
| §126 run 2 (v0.39, the 2-D window) | 60 | 120 | 20–30 hold + 30–40 | 0.77x | 3.5 · 7.0 |
| §133 run 6 tcn5 | 150 (100 / 150 / 180) | 180 (140 / 180 / 210) | 30 | 0.75x | 9.5 · 15.6 |
| run 7 tcn6 (front) | 50 (100 / 50 / 40) | 140 (140 / 90 / 190) | 40–150 | 0.82x | 9.5 · 20.0 |
| run 8 tcn7 (front + END loss) | 110 (110 / 70 / 180) | 150 (150 / 110 / 200) | 40 | 0.72x | 5.7 · 8.2 |
| run 9 tcn8 (RF 33) | 80 (70 / 80 / 180) | 120 (120 / 120 / 200) | 40 | 0.96x | 12.3 · 18.2 |
| **run 10 tcn9 (RF 57, ships)** | 90 (80 / 90 / 110) | **130** (130 / 130 / 150) | 40 | **0.63x** | 6.9 · 8.9 |

- **The eight-track ruler on run 10 (`test_vox.js` (iii); §133's tcn5 in parentheses).** Comptine fp 2.6 % (2.3); IBelongHere p50 in / out
  .675 / .088 = 7.6× (5.8), fp outside 11.8 (9.1), voxHz vs the stem: a pitch on 51 / within a semitone 49 / modulo the octave 49 %
  (49 / 48 / 48); RaindropsOnRoses .762 / .039 = 19.4× (11.4), the lead p50 .952 (.829), fp 8.6 (12.9), pitch 56 / 53 / 55 % (59 / 54 / 58);
  SeeYouDrop .659 / .103 = 6.4× (6.3), fp 4.3 (2.1), pitch 15 / 10 / 11 % (14 / 10 / 11); Vienna fp 1.8 (5.2); CyborgNinja 0.0; Malicious
  .139 / .053, fp 0.7; WhoLikesToParty (chops) .129 / .178, fp 12.4 (9.2). Against the lane: 96 / 94 / 70 % within a semitone (97 / 93 / 74).
- **The gates.** check 0 fail / 4 warn (pre-existing) — **met**; license 157 / 0 — **met**; `npm test` exit 0 (201 passes, test_fluid 350
  ok, test_earsw OK) — **met**; bundle 151 + 12 Worker modules (269 KB inline, the module 144 KB) — **met**; parity every column both heads
  8.95e-6 / 1.99e-5 — **met**; bench 88.9 / 89.5 / 89.7 µs per hop (≤ 100; inside npm test 89.9; p99 100–120 — the gate's margin is 10 µs
  now, 57 696 MAC/hop) — **met, thin**; eased lag 130 against ≤ 110 — **MISSED** (−50 vs §133's 180; the ship rule's −40 met); Jamendo F1
  .825 ≥ .815 — **met**; Comptine 2.5 % at .5 — **met**, 6.9 % at the .3 gate against ≤ 5 — **MISSED** (run 8's 5.7 is the pass's best);
  semi vs the lane 70 / 96 / 94 against 60 / 85 / 85 — **met**; the fake smoke `IDS="1 3 4" tools/scene-md5.sh s134`: six lines = s127's — **met**; the real
  sweep `SCENES=1 PAR=2 MUTE=1 tools/real-md5.sh s134-s1`: 43 runs, f0 2 and errs [] on every run; against `real-md5-s133-s1.txt` ALL 32
  `&map=1` lines HELD to the byte, 31 of the 34 `&map=0` lines MOVED (the live tier feeds the lead there) and 3 held (s1-CyborgNinja-boundary1-f1533-m0.jpg s1-CyborgNinja-build1-f1233-m0.jpg s1-CyborgNinja-intro-f602-m0.jpg — no voice read
  under either net) — **met as specified**. Records: `tools/accept/v0.39/vox-s134.txt`, `real-md5-s134-s1.txt`.
- **What is left.** (1) The user's eye in live mode on the three sung tracks (`#test&track=IBelongHere&scene=1&vox=live`, then 3 and 4):
  the entrance ~10 ms later than v0.39's eased 120, the pitch on the note, fewer false lights on Comptine / Vienna than §133's. (2) The
  lag's last 20 ms to the 110 target and the F1 .84: the front layer's channels (8 → 12–16 at the bench's cost) or a second 2-D layer are
  the next knobs; the bench margin is 10 µs, so a cheaper front end (the FFT is 47 of the 90) is the pre-condition. (3) Comptine at the
  .3 gate (6.9): the END-column loss halved it; a negative-heavier quota on that recipe (§133's run 5 bought 2–3 points) is one run.
  (4) The alternative modules stay under `tools/work/vox/vox-weights-{tcn5-ship,tcn6,tcn7,tcn8}.js` with their parity files — a one-copy
  swap each. (5) No merge, tag, push or deploy; nothing on main touched; the worktree is served on 8765 so the user sees run 10 on reload.

## §135 The fluid substrate idles under the scenes that do not read it (2026-10-17, branch `fluid-idle` in a worktree off main d72a96d, one Fable worker; the user: *"dust seems slow? also nav seems slower"* → *"dropped frames"* → *"fix it"*)

- **The finding.** `core/loop.js` called `stepFluid()` EVERY frame on EVERY scene — §104's own words, *"a Stam solver under every
  scene"* — and only `scenes/fluid` (id 0) and `scenes/fluid2` (id 1) ever sample what it writes (`ctx.engineTex.dye` in their show
  pass, `ctx.engineTex.vel` through the `post.fb.advect` feedback they are the only two to opt into, §109). At q 1 that step is
  tier 3 (sim 259×128, dye 1035×512, 20 Jacobi sweeps) and `CARD.benchFluid(300)` measures **1.34–1.63 ms of GPU per frame** on this
  box — spent for nobody under DUST, NAV2, TORUS2 and MANDALA. On the software renderer (the starved GPU the user's dropped frames
  show up on) main runs DUST at 22.8 fps against 25.6 with `&fluid=0`, NAV2 at 28.2 against 31.7; v0.34, before §104, 26.2 and 32.4.
  The vocal net is not involved (`ears` 0.11–0.14 ms/frame on every run, the same before and after).
- **The gate is DATA on the scene, never an id list in `core/`.** The card's existing `fluid` slot takes a second key:
  `fluid: { reads: true }` on FLUID, `fluid: { grammar: 'bands', reads: true }` on FLUID2 (CONTRACTS §1.4 "The substrate's READERS";
  either key stands alone, so FLUID declares the read and keeps the default `'pool'` grammar). `core/fluid/grammar.js` gains
  `readsFluid(scene)` beside `grammarOf(scene)` — pure, node-importable, and the two are independent: a card may name a grammar
  without reading the pool, and the slot without `reads` is exactly that.
- **The step's gate** (`loop.js`, one line). It steps when a scene that READS the substrate is on screen: the §116 owner
  (`REG[SC.next >= 0 ? SC.next : SC.cur]`), **or the scene fading OUT** (`REG[SC.cur]` while `SC.next >= 0` — it is still visible and
  still samples; gating on the owner alone would have blacked the pool on the first frame of every fade OUT of FLUID, a pop the user
  would have seen immediately), **or the one `SC.forced` names** — a forced scene lands in `updateScenes()`, which runs AFTER the step,
  so on the page's first frame the owner is still the home `register()` seated and a forced fluid run lost exactly one step (measured:
  the s0 and s1 fake-smoke pairs both moved by that one frame, s2–s5 held because nothing else samples the pool). `grammarOf()` is
  untouched: the grammar is still the owner's. Otherwise `idleFluid()`.
- **Idle** (`fluid.js`). No GL work at all: `FLUID.idle` 1, `ms` 0, `nSplat` 0, and `publish()` binds the two 1×1 black placeholders
  exactly as the switch's off path does — **without touching `FLUID.on`**, which stays the user's word (`&fluid=0`, key `W`) and the
  HUD's. `fluidLine()` reads `fluid idle  grammar …  sim …  (this scene does not read the substrate — §135)`. `benchFluid()` saves and
  restores the idle bookkeeping, so a bench under a non-fluid owner leaves neither the flag nor the pool's picture changed behind it.
- **Resume** (point 3). The first stepped frame after an idle stretch calls `clearPool()` — the velocity, the dye, the pressure and the
  two scratch stencils to black on BOTH ping-pong faces — before any splat of that frame lands, so the crossfade into a fluid scene
  fills from dark and never fades in the picture the pool held minutes ago. The grammar's own state is left warm (it is a function of
  MS, not of the picture); only the PICTURE goes stale. `ENGINE.resumed` keeps its meaning. **Finding:** §107's "clear" is a
  DISSIPATION ramp (`inject.js`'s `DROP_DISS` over a beat), not a GL clear — there was no hard-clear path in `fluid.js` to reuse, so
  this is one, built from the same `clearColor` / `clear` pair `mkT()` already runs on allocation.
- **The guard.** `check.js`'s fluid-slot rule now takes `{ grammar?, reads? }`, and FAILS a scene folder that samples the substrate
  (`engineTex.dye` / `.vel` anywhere in the folder, or a non-zero `post.fb.advect` on the card) without the flag — it would draw the
  1×1 placeholder and look broken; a flag with no sampling read warns (the pool would be stepped for nobody). Both directions
  verified by hand on a throwaway edit.
- **The bench** (`tools/load-bench.js`, SwiftShader — no `GPU=1`, 30 s, two runs each, `errs []` on all eight; machine load 5.65,
  the user's own Chrome + VS Code sit at ~6). The governor collapses q to 0 by 8–9 s on the software renderer, so these are the
  TIER 0 step's cost; the tier-3 cost is the bench line below.

| run | before (main d72a96d) | after (`fluid-idle`) | delta | ENGINE.ms before → after |
|---|---|---|---|---|
| `test&track=IBelongHere&scene=3` (DUST) | 22.8 / 22.8 fps | **25.2 / 25.2** | **+10.5 %** | 2.394 / 2.400 → 2.255 / 2.197 |
| `test&track=IBelongHere&scene=2` (NAV2) | 28.2 / 28.4 fps | **31.5 / 32.1** | **+12.4 %** | 2.106 / 2.121 → 2.019 / 1.919 |
| the brief's `&fluid=0` reads (the target) | — | DUST 25.6 / 23.9 · NAV2 31.7 | — | — |

  One `GPU=1` read with q pinned to 1 (`CARD.Q.hold=1`, tier 3, sim 259×128 dye 1035×512), 9 s of page time: `#test&scene=3` reads
  `idle` 1, `on` true, `ms` 0, **`steps` 0** — the step never ran once; `#test&scene=0` on the same build reads `idle` 0, `steps` 543,
  `ms` 0.07. `CARD.benchFluid(300)` on those two pages: **1.338 ms** per step under DUST, **1.634** under FLUID — the GPU time the rule
  removes from every non-fluid frame (§104's budget is ≤ 1.0 ms at tier 3; this box has never met it).
- **The crossfade into FLUID looks right** (real time, `GPU=1`, `test&track=IBelongHere`, `tools/lum.py` centre means of the 20 % box).
  A forced switch is a HARD CUT (`goScene(id, true)` — key `1` sets `SC.forced`), so the fade is made the harness way:
  `CARD.goScene(0, false)` then `CARD.SC.forced = 0`, which leaves the director's home rules out and lets the fade run (`SC.m` 0 →
  .049 → .492 → landed, `SC.dur` 1.54 s). **The clear's proof** is the run that STARTS on FLUID so the pool is full first
  (`&fluiddbg=1`, the dye over the composite): FLUID alive **.1205** (steps 639) → away to NAV2, the fade out still stepping (639 →
  643 while FLUID was visible, the out clause) then idle at steps 735 and the pool **.0000** → back to FLUID, the fade's first frames
  **.0187** (dark, although it had been .1205), its middle **.0756**, 3 s on **.1098**. The plain-composite run of the same switch:
  .3386 → .2277 → .2060 (NAV2 fading out of a bright frame into the pool). `errs []` on every run; shots under the worktree's
  (gitignored) `tools/work/fluid-idle/`.
- **The director's roster is unchanged.** Nothing here touches a bid: FLUID still bids beside NAV2, DUST and TORUS2 (§114), with
  `score()` and the §93–§95 dwell exactly as they were, and `SCENES="0 2 3 4"` is still the roster. The idle rule reads the director's
  output; it never writes it.
- **The gates.** `node tools/check.js` 0 fail — **met** (5 warn, one of them new: `assets/core/fluid/fluid.js` is 376 lines, over the
  350 soft cap, under the 500 fail cap); `node tools/license.js --check` 157 / 0 — **met**; `npm test` exit 0 — **met**
  (`test_fluid` 331 → **345 ok, 0 fail**: +14 for the idle rule — the declaration on all six cards and its agreement with §109's
  advect opt-ins, then `fluid.js`'s own state machine through a FAKE WebGL2 context, a Proxy with every enum a number, every call a
  no-op and `drawArrays` / `clear` counted: a fluid owner draws 29 and allocates the tier, an idle frame does 0 draws / 0 clears and
  holds the step counter at `ms` 0 with the placeholder texture itself bound, 20 more idle frames still 0 / 0, the first step after
  the stretch clears 8 faces then draws, the next clears 0, the next idle→fluid edge clears 8 again). The fake smoke
  `IDS="0 1 2 3 4 5" GPU=1 MUTE=1 PORT=8875 tools/scene-md5.sh s135`: **10 of 12 lines HOLD** against
  `tools/accept/v0.39/scene-md5-s134-full.txt` — **met**, with a finding: the two s1 (FLUID2) lines differ from that reference and
  from it alone. Main d72a96d shot on this box today gives EXACTLY the branch's two values (`aa626832` / `8372bc28`), and CONTRACTS
  §1.4 already records that pair as FLUID2's current one — the s134 list was cut at `8c464a0`, BEFORE the merge that brought §132's
  FLUID2 reset in, so it is stale on s1. Not re-baselined.
  The real roster `GPU=1 PORT=8875 PAR=2 MUTE=1 SCENES="0 1 2 3 4" tools/real-md5.sh s135` (215 runs, 330 lines, ~68 min on a box at
  load 6–8; `f0` 2 on every run, `errs []` and `bad []` throughout, 0 exceptions, 0 missing shots): against
  `real-md5-s134-full.txt`, 330 joined 330 with no ref-only and no new-only name, **264 HOLD and 66 moved** — and all 66 are **s1
  (FLUID2), both map modes, all of it**; s0 (FLUID), s2 (NAV2), s3 (DUST) and s4 (TORUS2) hold 66 / 66 each. The 66 were then
  re-shot ON MAIN d72a96d, this box, same scope (`SCENES="1" tools/real-md5.sh s135base`, 43 runs, clean): **branch s1 vs main s1 =
  0 of 66 moved, byte-identical name for name; main s1 vs the s134 reference = 66 of 66 moved.** The same stale reference, the same
  cause as the fake smoke. **So §135 moved 0 of the 330 lines** — **met**. Records: `tools/accept/v0.39/scene-md5-s135.txt`,
  `real-md5-s135.txt` (the full 330 of this sweep, including the branch's own s1 list for the next one), `load-bench-s135.txt`.
- **What is left.** (1) The user's eye: that DUST and NAV2 feel right again at home, and that the crossfade into FLUID from the
  director (not the harness's soft switch) reads as a fill rather than a pop — the pool now starts from dark on every entry,
  which is a LOOK change the numbers cannot settle. (2) `assets/core/fluid/fluid.js` is 376 lines, over `check.js`'s 350 soft cap;
  the idle machinery is ~25 of them. Splitting the solver's passes out of the file is the obvious cut and is not done here.
  (3) `tools/accept/v0.39/{scene-md5,real-md5}-s134-full.txt` are stale on s1 from the merge, not from this work — the next
  engine sweep should read against `real-md5-s135.txt` instead, or those two lists should be re-cut on main and said so.
  (4) The pool's grammar still PLANS nothing while idle, which is the point; a scene that wants a warm pool the instant it
  lands (rather than a fill from dark) would need a pre-roll, and nobody has asked for one. (5) No merge, tag, push or deploy;
  main is untouched and the site stays at v0.38.

## §136 v0.41 tagged, NOT deployed — the voice finds its pitch, the pool rests (2026-10-17, one Opus worker on main, no worktree; the user: *"tag new version"*)

- **What ships** (everything on `main` since the v0.40 tag at `ac46def`; this note adds no code):
  **§132 THE FLUID2 RESET TO THE §108 POOL** — the grammar in FLUID2's slot is the pre-ring pool of the 2026-10-09 15:51 EDT
  take, proved frame by frame against `git show feb1f67:…/inject.js` rather than rebuilt, with the six droplets back on the
  confirmed drop; **the voice loses its only consumer in a fluid picture** (the §121 RIG was the read, and it is at
  `git show v0.40:assets/core/fluid/inject2.js`). · **§133 + §134 THE STREAMING VOCAL NET WITH ITS PITCH HEAD** — a causal TCN
  with a 2-D front layer (conv 3×3 ×8, causal, max-pooled ×4 in frequency, its 8 × 10 column beside the raw 40 bands), the loss
  on the END column, RF 57, **an output every hop instead of every window**, and a 61-way pitch head on the shared hidden column
  trained on the stems' pYIN with the YIN on the mix pulled: 55 246 params, 57 696 MAC/hop, **the sung pitch within a semitone
  of the Demucs lane 70 / 96 / 94 % on SeeYouDrop / IBelongHere / RaindropsOnRoses against 9 / 45 / 55 before** — which is the
  release — Jamendo-test **F1 .825 against .795**, the eased lag **130 ms against 120** (the one number that got worse), Comptine
  false voice **2.5 % at .5**, bench **89 µs/hop**; the voice reaches DUST and TORUS2. · **§135 THE FLUID SUBSTRATE IDLES UNDER
  THE SCENES THAT DO NOT READ IT** — the step runs only for the §116 owner, the scene fading OUT or the one `SC.forced` names,
  otherwise `idleFluid()` with no GL work and the 1×1 placeholders bound and **`FLUID.on` untouched**: **DUST +10.5 % / NAV2
  +12.4 % on the software renderer**, 1.3–1.6 ms of GPU per frame removed from every non-fluid frame, and the pool **fills from
  dark on entry** because the first stepped frame after an idle stretch clears it. **The user's eye has already spoken on two of
  these three**: DUST / NAV2's *"dropped frames"* **was** the substrate and is fixed, and §131's Worker A/B — v0.40's content —
  he had confirmed the better of the two.
- **The class is `engine`, and `scenes` is `[1, 3, 4]`.** Not a `scene` release: no scene was added and no id moved. But three
  of them look different. **1 FLUID2** draws a different picture outright — a different grammar under the same slot, which is
  the one case where a reset is a visible change. **3 DUST** and **4 TORUS2** carry the voice, and the voice's **hue** is the
  pitch, so the new net's win lands on the lit seam through the grains and on the strand lifted out of the nest. **0 FLUID and
  2 NAV2 are deliberately NOT listed**: §135 made them faster without changing a pixel they draw, and §135's own sweep proved
  that at **0 of 330 real-md5 lines moved**. The entry's `decisions` is **`[§132, §133, §134, §135]`**. **Thumbnails: two,
  rendered by the build and by nothing else.** `tools/whatsnew.js` renders one per listed scene that has
  `site/thumbs/<name>.jpg`; the directory holds `dust fluid mandala nav2 torus2`, so the article shows **DUST and TORUS** and
  **FLUID2 shows none** for want of a `fluid2.jpg`. Nothing was shot by hand — §129 and §125 let the build decide the same way.
- **A FINDING ON THE ENTRY, and the one place this tag departs from its brief.** The brief asked `decisions` to carry the
  duplicate number honestly, e.g. `"§132 (the FLUID2 reset)"`. **It cannot:** `tools/releases.js` line 36 validates every
  element against **`/^§\d+[a-z]?$/`** and `node tools/releases.js check` reports a problem on that string — verified in node
  before a byte was written. So the entry carries the **four bare numbers**, which does name all four sections, and the
  duplicate is recorded in prose instead: **`docs/DECISIONS.md` has TWO sections numbered §132** — the v0.40 tag note and the
  FLUID2 reset, in that order — and **both stay that way**, because renumbering a published section that a shipped
  `releases.json` entry already links to is the worse of the two wrongs. Nothing in `releases.js` or `check.js` was relaxed to
  fit the brief.
- **What the entry says, in a visitor's words** (the house voice, no measurement in the prose, no § — `releases.js` refuses
  one): the title *"The voice finds the note, and the ink rests"*, and it leads on the pitch because that is the release —
  *"the thing it got better at is the one it was worst at: the note … on two of the three sung tracks in my library the note it
  named was wrong more often than it was right — which means the colour a sung line painted was mostly a colour the song was
  not in."* **The three honest limits are in it, and the one that got worse is named first:** *"The voice still enters a beat
  behind the note at a walking tempo, and a shade later than it did in the last release — that is the trade for a network that
  hears further back before it commits, and it is the gate I most wanted to meet and did not"*; *"A solo piano sitting in a
  singer's range still lights the scenes a little; it is a fraction of what it was two releases ago, and it is not nothing"*;
  and the chops, *"a voice being present with no note in it, so the light it makes has no colour."* FLUID2's reset is given as
  the user's own preference (*"the version I had on a recording from a week before and could not stop preferring"*) with the
  proof named (*"proved frame by frame against the old file rather than rebuilt from memory"*) and its cost owned (*"the pool no
  longer reads the voice at all, because reading it was the rig's own idea"*). §135 closes the body with its visible
  consequence rather than only its win: *"when a pool scene comes in now, it fills from dark instead of fading up the picture
  the pool happened to be holding from minutes ago."*
- **The recipe (§132's ritual step for step, the three-page rule standing, §125's `releases.json` pitfall paid forward a FOURTH
  time).** `package.json` + `assets/core/version.js` 0.40.0 → 0.41.0 **together** (§89 — and `test_rec.js` is the gate that they
  agree: the take came out `retinarave-v0.41-nav2-2026-10-17T18-05-23.webm` with the sidecar reading `retinarave 0.41.0`) ·
  `releases.json` top entry (`v0.41`, **2026-10-17**, class `engine`, the title above, `scenes [1, 3, 4]`, no clip) —
  **hand-inserted as `JSON.stringify(rel, null, 1)` after `JSON.stringify(load(), null, 1) + '\n'` == the file was checked
  byte-identical FIRST** (31 534 bytes, true), the script also re-proving that the **result** round-trips and that the 38
  existing entries are byte-identical in the tail before it wrote: a **20-line pure insertion** (`git diff --numstat` **20
  added, 0 removed**). `releases.js`'s own `save()` still writes a different compact layout and would reformat all 39 entries;
  **it was never called, and the note has now held and cost nothing four times running** · `npm run build` (39 entries →
  `site/whats-new.html` **59 045 bytes**, and `index.html`'s `#newin` line **did** move because the title did: *New in v0.41:
  The voice finds the note, and the ink rests → what's new*; `dist/index.html` **151 modules + 12 in the ears Worker, 269 KB
  inline, 1 848 752 bytes**) · `node tools/bundle.js releases/retinarave-v0.41.html` (**the same 151 / +12 / 269 KB /
  1 848 752**, `VER = '0.41.0'`) · `git rm releases/retinarave-v0.38.html` (the three-page rule; `releases/` keeps v0.39 / v0.40
  / v0.41, and v0.38's page is in history at its tag).
- **The frozen page, read against v0.40's** (151 + 12 modules / 1 744 344 bytes): **the module counts are IDENTICAL — 151 + 12,
  nothing entered or left the page graph** — and the **+104 408 bytes** are **DATA, not code**. `ears/vox-weights.js` went from
  43 646 params (§126 run 2) to **55 246** (§134 run 10: the front layer and the pitch head), and the ears graph is in the
  document **TWICE**, once for this thread's fallback and the det path and once for the Worker, which is §131's stated price of
  one file and no runtime fetch — so the weights module's own growth lands in the page doubled, and the **inline Worker goes
  218 KB → 269 KB**. The three greps asked for are all in it: **`EARS_WORKER_SRC` 6 hits** (v0.40's count exactly, the first of
  them the Worker's own source string), the weights module's header line **verbatim** (*"front layer conv 3x3 x8 (causal in
  time) max-pooled x4 in frequency, its 8 x 10 column beside the raw 40 bands (§134), then a causal TCN over the mel column:
  120 -> 48 (k3…"*, with the shape line `net 'tcn', nParams 55246, macPerHop 57696, dil [1,2,4,8,12], front 8, frontPool 4`),
  and **`idleFluid` 4 hits** — plus **`reads: true` 3 hits**, the two fluid cards' §135 declarations (CONTRACTS §1.4).
- **The gates, each run on the tree AFTER the bump.** The receipt with every number is
  `tools/accept/v0.41/tag-v0.41-2026-10-17.txt`:
  1. `node tools/check.js` — **154 modules · uniforms 161 · MS keys 223 · scenes 6 (help.feats gaps 0) · 0 fail · 5 warn**,
     exit 0 — **met** (the brief's 5 warns expected; they are line caps, all under the 500 fail cap, and the fifth is §135's
     own new one: `core/fluid/fluid.js` **376**, beside §129's unchanged four — `core/scenes.js` 370, `ears/perc.js` 407,
     `dust/index.js` 364, `torus2/index.js` 367) · `releases.js check` **39 entries, top v0.41 == package.json 0.41.0, 0
     problems** — **met** · `whatsnew --check` **39 entries, up to date** — **met** · `license.js --check` **157 public files,
     0 without the header** — **met** (157 at v0.40 too: §132–§135 added no public file).
  2. `npm test` — **exit 0, 39.6 s** — **met**. `test_fluid` **345 ok, 0 fail** (331 before §135: +14 for the idle rule — the
     declaration on all six cards, its agreement with §109's advect opt-ins, and `fluid.js`'s own state machine through a FAKE
     WebGL2 context with `drawArrays` / `clear` counted); `test_music` **151 ok, 0 fail**; `test_loud` **43 pass, 5.99 µs per
     frame under the 40 µs budget**; `test_earsw`, `test_voxscene` and every other suite **OK**. `test_vox`: the mel parity and
     the **ONNX parity on 200 held Jamendo-test windows, every column and both heads**, both pass; the stage **90.4 µs/hop
     median (p99 97) against ≤ 100 — met, and thin**, the margin ~10 µs at 57 696 MAC/hop; the pruned FFT **14 775 hops /
     14 772 inferences**; `Ears.push` per 512 block **.174 with the stage / .071 without**, §130's skip **.069**; (vii) the
     front end through `magsLo` == through `mags`, **5 622 hops, 0 values differ**. **§134's two known misses still print as
     `note`, never as FAIL, and were not re-baselined:** Jamendo-test **F1 .825 against the §133 gate's ≥ .84 — MISSED**, and
     IBelongHere (unseen) **F1 .814 / P .961 / R .706** — §126's recall.
  3. `GPU=1 MUTE=1 node tools/test_rec.js` (the version pair's own gate) — **all ok** — **met**: the sidecar's
     `app/version` **retinarave 0.41.0** and the file name **`retinarave-v0.41-…`**, the two strings moved together. §92's pin
     still wins (`Q.hold` .75 through the take, free again from q0 .48 after the stop); webm 13 468 274 bytes, EBML magic,
     5.95 s / 7 clusters ≈ the sidecar's 6.006, a frame decoded, the HUD on in the DOM, the timeline 2 → 3 → 1 within 0.6 s of
     the keys. **A LOAD NOTE, not a regression:** **270 frames at 45.0 fps** composited against §132's 360 at 60.0 — this box
     sat at **load 6.70** (the user's own Chrome + VS Code are ~6 of it; the idle floor here is 2.5–3 and was never waited for).
     `GPU=1` throughout; §132's finding that the governor assertion fails on swiftshader *without* `GPU=1` is known and was not
     re-tested.
  4. the **frozen page from `file://`**, headless, **CLOCK=1 GPU=1 MUTE=1** — `test&scene=0` → `{sc 0, grammar pool, fluidOn
     true, idle 0, errs [], bad [], frameN 300}` · `scene=1` → `{sc 1, bands, true, idle 0, …}` · `scene=3` → `{sc 3, pool,
     true, **idle 1**, …}` · `scene=4` → `{sc 4, pool, true, **idle 1**, …}` — **`errs []` and `bad []` (`CARD.nonFinite()`) on
     all four — met.** The lines are §129's / §130's / §132's to the character **but for one field added on purpose**: `idle`,
     0 on the two fluid scenes and **1 on DUST and TORUS2** — §135's rule made visible on the frozen page, exactly where it
     should be — while **`fluidOn` stays true on all four**, which is §135's point: the idle path never touches `FLUID.on`, so
     `&fluid=0` and key `W` still mean what they meant. `CLOCK=1` from the first pass (v0.37's pitfall, paid forward a fourth
     time). §131's honest note stands and is not this tag's: from `file://` in Chromium the PCM bus's worklet cannot load
     (`blob:null/<uuid>` is cross-origin there), so the live ears never run on a saved page; the fake timeline needs no PCM,
     which is why these four lines are clean.
  5. the **no-third-party receipt** (SOCIAL-PLAN §4) — **ONE host on every route** — **met**: `/whats-new` →
     `["127.0.0.1:8993"]` · `/` (`NOAUTO=1 real`) → `["127.0.0.1:8995"]` with `#newin` reading *"New in v0.41: The voice finds
     the note, and the ink rests → what's new"* · `/about` → `["127.0.0.1:8997"]`. The v0.41 article renders (`id="v0.41"`, the
     `engine` label, **17 October 2026**, the title, the notes line *§132 · §133 · §134 · §135*) and shows **exactly two
     thumbnails, DUST and TORUS**, which is what `scenes: [1, 3, 4]` means against a `site/thumbs/` with no `fluid2.jpg`. The
     credits were **already in place and needed no move** ([[feedback-credit-where-due]]): the new net borrowed no NEW corpus,
     solver or idea — **Demucs** and **librosa / pYIN** (Mauch & Dixon) have been in `THIRD-PARTY.md` with their licences since
     §122 — and the only `site/about.html` line that moved since v0.40 is §132's own FLUID2 description, committed with that
     work. **The user's two dev servers were left running and untouched** — 8765 (this checkout) and 8874 (the v0.34 checkout);
     every port used here was 8993 / 8995 / 8997.
- **What was NOT run, and why — the brief's own instruction, and it holds.** The **full real-md5 roster** and **`accept.sh`**:
  **§135 paid the 330-line sweep** on its own branch (215 runs, 330 lines, `f0` 2 and `errs []` and `bad []` on every run,
  ~68 min, and after re-shooting the 66 s1 lines on main for the comparison: **0 of 330 moved against main**) — **and the engine
  has not moved since that merge**: `git diff 8f20ca9..HEAD -- assets/` is **EMPTY**, and this commit holds only the two version
  strings, `index.html`'s `#newin` line, `releases.json`, `site/whats-new.html`, the frozen page swap, the receipt and this
  note. So §135's receipts **are** this release's content proof — `tools/accept/v0.39/real-md5-s135.txt` (the full 330),
  `scene-md5-s135.txt` (the fake smoke, 10 of 12 holding), `load-bench-s135.txt`, and `vox-s134.txt` for the net. Also not run
  and not owed: the fake smoke, `test_ears --trace`, a fresh load bench, `fluid-tracks.js`, and a **director trace** (the roster
  is unchanged at `SCENES="0 2 3 4"`; nothing entered or left the rotation). **No reference was re-based here** — the next
  release's sweep does that, never the tag. **No audio was played and nothing was retuned.**
- **Carried findings — recorded, NOT fixed, and none of them this tag's.** (1) **`tools/accept/v0.39/{scene-md5,real-md5}-s134-full.txt`
  (and `real-md5-s134-s1.txt`) are STALE ON s1**: cut at `8c464a0`, **before** the merge that brought §132's FLUID2 reset onto
  main, so every s1 line in them is the RIG's picture and not the page's. §135 proved it twice (main's own s1 == the branch's
  byte for byte; main's s1 vs the s134 reference = 66 of 66 moved). **`real-md5-s135.txt` supersedes them for s1** and is what
  the next engine sweep should read against. (2) The `decisions` regex vs the duplicate §132 — above. (3) §134's two MISSED
  gates and §126's IBelongHere recall, all three stated plainly in the entry's prose. (4) `core/fluid/fluid.js` at 376 lines
  over the 350 soft cap (§135's own item 2). (5) `accept.sh`'s routes / params blocks on NAV2, **still owed since §118**.
- **The deploy shape, unchanged — and this is why the tag stays local.** `dist/` is what `npm run build` writes and what
  `wrangler.jsonc` serves (`assets.directory ./dist`); `dist/` is git-ignored and not committed, and there is no `.github/`
  workflow — the deploy is **Cloudflare, git-connected to `github.com/tbkraf08/RetinaRave`, building on a push to `main`**.
  **So the push IS the deploy**, and the user's word was *"tag new version"*: **nothing was pushed and nothing was merged.**
  When the word comes it is **ONE push** of `main --tags`, then poll for the `VER` line, **never a second push** (§115).
  ONE release commit, then `git tag -a v0.41 -m "v0.41 — the voice finds its pitch, the pool rests"` — **and stop.** The three
  sibling worktrees (`../RetinaRave-vox-net3`, `../RetinaRave-fluid-idle`, `../RetinaRave-v034`) were **not touched**.
- **Next, in order:** the user's word on the push · **the user's EYE**, which is what §134 and §135 both end on and neither can
  settle — that DUST and NAV2 feel right again at home, and that the crossfade into a fluid scene reads as a **fill** rather
  than a pop now the pool starts from dark (the eye-check URLs need `#test&`, §130's note) · **CNN session 4** if the user wants
  it: the lag's last 20 ms to the 110 target and F1 .84, for which §134 named the knobs (the front layer's channels 8 → 12–16,
  or a second 2-D layer) and the **~10 µs bench margin makes a cheaper front end the pre-condition** (the FFT is 47 of the 90) ·
  splitting the solver's passes out of `core/fluid/fluid.js` · re-cutting or formally retiring the stale s134 lists.

## §137 the ninth track — TheChain (Fleetwood Mac, the 2004 remaster), and the voice gate's first UNSEEN test (2026-10-17, one Fable worker in a worktree off main 7ecf804, branch `track9`; the user: *"~/Downloads/Fleetwood Mac - The Chain (2004 Remaster).flac here is a new test song to first analyze and get golden truths -> its a great song to test vocals with"*, and separately on DUST: *"feels like it doesn't follow the vocals (more so the instruments)"*)

- **The file.** Copied (not moved) to `~/Music/RetinaRave/TheChain.flac` — the library's short names, as the eight — 44.1 kHz
  stereo FLAC (PCM_16), **270.213 s** (270.0 at the truth's framing), md5 `a6300ee5ee8f146ff7ce4b613e81e1f7`. Nothing under
  `~/Music` is committed; the truth files are. **"Tune on all tracks" now means NINE** (`windows.py` TRACKS → `windows.json`,
  which is the one list `real-md5.sh` and `test_music.js` read; `traces.sh`, `fluid-tracks.js`, `vox-ab.js`,
  `vox-gate-ruler.js`, `test_vox.js` TRACKS + VOICED).
- **The truth, the §117 recipe as run.** `python3 tools/truth/trackmap.py TheChain --pcm --sr=48000` (allowed once: no truth
  dir existed; the default grains 8, 5, 3, 2, 1, 0.569, 0.224 s + beat / bar / 4bar → `tools/truth/TheChain.json` 1.27 MB,
  `tools/truth/TheChain/grain-*.txt`, the gitignored dumps `tools/work/TheChain.{f32,48000.f32,48000.st.f32}` written to the
  MAIN checkout so they outlive the worktree). Then `kicktruth.py` → `.kick.json` (**940 kicks, 3.48 /s**, p50 rise 12.6 dB,
  beat-slots **[576 30 303 31]** — the kicks on the beat and the backbeat, almost nothing on the 8ths: a drum kit, not a
  machine); `snaretruth.py` → `.snare.json` (985, 3.65 /s, p50 9.9 dB, slots [584 16 366 19] — the same two-and-four);
  `trackmap.py --loud` → `.loud.json`; `--brief` → `others-brief.txt`; `TheChain.txt` = the stdout summary with the vocal
  passages appended in TRACK TIME (the user reports that way). `--pcm` is now banned on the NINE (HARNESS "Loudness").
  **Two pre-existing breakages fixed on the way:** `kicktruth.py` and `snaretruth.py` both loaded the §66 reference lists
  (`tools/work/v66/{kick,clap}-ref-rise.json`, a gitignored one-off long gone from this machine) UNCONDITIONALLY, which made
  them fail on **every** track, not only Vienna — now loaded when the file exists, and its absence costs the Vienna row one
  column rather than the run.
- **What is hand-marked, what is measured.** NOTHING is hand-marked: no beat, bar, section, drop, key or vocal window was
  placed by hand, and the user named no moment on this track (no `START`, no `USER`). Measured, with the Malicious / §72
  caveat: `gridcheck.py` says *"beat phase never placed on the audio"* (dp_residual **77.2 ms** > 60, no anchor, no hand), so
  the DP list was kept un-refit and the 30 sections and the one drop are bar-pinned to THAT grid. So, as Malicious and as
  Raindrops was for an afternoon: **`gate: false` (`windows.py` NO_GATE) — measured and swept for the record, no claim on it
  is a FAIL, until the user validates a ruler on it.**
- **Tempo and key.** The grid's `bpm` **151.9991** (beat 0.394739 s, phase 0.0232 s, coherence 0.214, 684 beats, 171 bars of
  1.579 s, `downbeat_mod4` 3 on a weak margin — scores [4.76 6.30 4.59 6.58], 1 and 3 nearly tied, which is what a backbeat
  kit does to the low/mid downbeat test); the summary's 153.8 is the onset ACF. **The number to doubt is the octave, not the
  phase:** The Chain is a ~76 BPM song, and 152.00 is its double — the click render's `--every=2` lattice is exactly 75.9996,
  so the A/B the user must hear is 152 against 76 (the §117 precedent: *"the 140 click nods better then the 70"* settled
  Raindrops the other way). Key **A, mode unsettled — a PARALLEL pair again**: trackmap's KK on the sub-inclusive chroma reads
  A major +0.745 against A minor +0.709 (margin **0.036**) with E major / E minor +0.681 / +0.680 right behind, conf **0.0491**
  — far under the §84 shade gate 0.3, so `modeShade` would stay shut on this track. The chroma is E 0.211 / A 0.151 / D 0.095 /
  B 0.092 — the Am–E–A modal shape of the song. The independent key rulers (`key-truth.py`, `key-ears.mjs`) were NOT run and
  **no `test_ears.js` KEY_TRACKS row was added**: with a 0.036 parallel margin and conf under the shade gate there is nothing
  to assert yet (left below).
- **The loudness shape, and the one drop.** Integrated **−12.219 LKFS** (the quietest of the nine — a 2004 rock remaster, not
  a club master: the eight run −7 to −9.2); short-term p10 / p50 / p90 / p95 **−22.05 / −15.01 / −9.28 / −8.83**, range
  **13.22 LU** (the widest in the library — Raindrops' is 8.96). The per-bar low-end share of its own p90 tells the whole
  arrangement: bars 1–52 sit at **0.18–0.21** (the dobro-and-bass intro and the verses), bar 65 jumps to **0.83**, bars 179–192
  fall to **0.12–0.34** (the famous bass break), then 204 → 242 climb **0.77 → 1.06** (the guitar outro, the loudest 30 s from
  **224 s**). One bar-pinned drop, **199.692 s**, and it is a real one: **+8.23 LU, ×6.653** power across the 5.1 s pair — the
  biggest drop ratio in the library. The loud half: sub 15 % · bass 30 % · lm 20 % · mid 24 % · high 11 %, bass f0 54.9 Hz
  **A1 held 31 %**, centroid 145 Hz, h/f 0.51 — a BAND, with the mid-band energy the eight (sub 34–56 %) do not have.
  650 low / 436 click / 606 mid / 968 high onsets; 214 bare-808 note starts (33 % of the low onsets — a kick with no click
  layered on it is what a real kick drum sounds like to this test); 80 sub slides.
- **The vocal truth** (`voxtruth.py`, the §122 recipe: `htdemucs --two-stems=vocals` on CPU, 2 min 38 s, then librosa pYIN).
  **46.2 %** of the 257.5 music seconds are inside a sung window — second only to IBelongHere's 68.3 %. knee **0.2651**
  (share p10 / p95 0.0005 / **0.8825** — a cleanly separated lead); **15 windows, 8 passages**; f0 inside the windows p10 /
  p50 / p90 **325.7 / 341.1 / 406.8 Hz = E4 / F4 / G#4** over 1236 voiced frames — the highest-sitting lead in the library
  (Raindrops D4, IBelongHere E4, SeeYouDrop C#5 on 206 frames). `windows_hand` = the passages, per §122's addendum rule for
  every track; `provenance.ear` says so and says the ear on THIS track's own renders is still owed. **The passages in track
  time** (mean share, median f0):

| passage (mm:ss) | s | share | f0 | what it is |
|---|---|---|---|---|
| 0:30.4–0:37.3 | 6.9 | .72 | unvoiced | the first verse's entry ("listen to the wind blow") — pYIN finds no stable pitch in it |
| 0:43.3–0:48.9 | 5.6 | .79 | unvoiced | the verse's second line |
| 0:53.6–1:20.0 | 26.5 | .42 | 337.2 E4 | the verse into the first chorus |
| 1:34.0–1:39.8 | 5.8 | .68 | 290.2 D4 | — |
| 1:46.6–1:52.8 | 6.2 | .75 | 110.6 **A2** | the low harmony line — an octave below the lead, and the one passage pYIN puts there |
| 1:59.3–2:05.5 | 6.1 | .72 | unvoiced | — |
| **2:09.7–2:48.7** | **39.0** | .46 | 368.0 F#4 | the long chorus — the biggest single passage |
| **3:54.8–4:23.4** | **28.6** | .42 | 333.3 E4 | the "chain, keep us together" outro chant |

  **And the gap that matters: 2:48.7 → 3:54.8, 66 s with no voice at all** — the famous bass break (the user's "around 3:00")
  and the first half of the guitar outro. The lane says the track is 0:00–0:30 instrumental, sung in bursts to 2:49, silent
  for 66 s, then sung to 4:23 — which is the song. `voxlane.py` → `~/Music/RetinaRave/TheChain.vox.json` (381 KB, local only,
  never bundled): voxS ≥ .5 on **36.3 %** of 27 022 frames, a pitch on 4.7 %, voxConf 0.001–0.946.
- **Ruler 1 — the A/B, `node tools/vox-ab.js TheChain --stage=all`** (the live CNN replayed over the PCM dump against the
  file-mode lane). **The net has never seen this track** (`voxtrain.py` LIB_HELD gains it beside IBelongHere and Comptine;
  never LIB_TRAIN, ACC_TRACKS or LIB_VOX_SOURCES), so this is the honest row:

| | sung % lane / live | agree % | lane pitched | pitched % | semi % | oct % | lag raw / held / eased ms | r | flicker lane / live |
|---|---|---|---|---|---|---|---|---|---|
| TheChain | **40.3 / 36.6** | **85.7** | 1270 | 53 | **95** | 95 | **80 / 80 / 120** | 0.82 | 47.1 / 51.1 /min |

  Read: the CNN finds 36.6 % against the lane's 40.3 % and agrees with it on **86 %** of frames; where both publish a pitch
  the live one is within **a semitone 95 % of the time** (95 % modulo the octave — so there is no octave error to forgive),
  against the plan's ask of 70 and against the 49 / 53 / 10 % the three known voiced tracks read on the same column. The
  lag is **120 ms** eased (80 raw, hold 0 since §133's net fires every hop, 40 on the ease) — the §134 budget, unchanged by
  an unseen track. 115 live runs against the lane's 106, flicker 1.08× — the stage is not chattering on this material.
- **Ruler 2 — `node tools/test_vox.js --ruler`**, TheChain's row beside the library's (`voxS` p50 inside the hand windows
  against outside; `fp %` = frames ≥ .5 outside them):

| track | hand s | voxS p50 in / out | ratio | fp % | voiced | hz cov % | semi % |
|---|---|---|---|---|---|---|---|
| Comptine (the control, unseen) | 0 | – / .039 | – | 2.6 | 0 | – | – |
| IBelongHere (unseen) | 199 | .675 / .088 | 7.6× | 11.8 | 5549 | 51 | 49 |
| RaindropsOnRoses | 94 | .762 / .039 | 19.4× | 8.6 | 2613 | 56 | 53 |
| SeeYouDrop | 75 | .659 / .103 | 6.4× | 4.3 | 206 | 15 | 10 |
| Malicious | 1 | .139 / .053 | 2.6× | 0.7 | 52 | 0 | 0 |
| WhoLikesToParty (shouted) | 64 | .129 / .178 | 0.7× | 12.4 | 0 | – | – |
| **TheChain (UNSEEN)** | **125** | **.720 / .054** | **13.3×** | **0.5** | **1185** | **53** | **50** |

  Read: **13.3×, second only to Raindrops' in-sample 19.4×, and a false voice of 0.5 % — the lowest of any track in the
  library, lower than the solo-piano CONTROL's 2.59 %.** On a track the net was never trained on, with a real singer over a
  real band, it says "voice" almost nowhere the Demucs stem does not. `npm test` adds TheChain to the gated VOICED rows and
  its `> 2×` claim passes. The pitch columns (hz cov 53 %, semi 50 %) sit with the library's — the mix ceiling §123 named,
  recorded not gated.
- **Ruler 3 — `node tools/vox-gate-ruler.js`** (§127: how much of a track LIGHTS through `assets/math/vox.js`, which is the
  gate DUST, TORUS2 and FLUID2 all read):

| track | frames | live lit % | live hue % | lane lit % | lane hue % | lane entries |
|---|---|---|---|---|---|---|
| Comptine | 8662 | 12.4 | 3.1 | 0.0 | 0.0 | 0 |
| CyborgNinja | 10803 | 0.0 | 0.0 | 1.3 | 0.5 | 3 |
| Vienna | 11559 | 10.1 | 0.0 | 4.8 | 4.6 | 4 |
| Malicious | 13375 | 6.2 | 0.0 | 6.4 | 2.9 | 10 |
| WhoLikesToParty | 15380 | 43.9 | 0.0 | 82.4 | 0.0 | 50 |
| IBelongHere | 13986 | 81.0 | 71.9 | 91.4 | 80.0 | 22 |
| RaindropsOnRoses | 13371 | 55.5 | 43.8 | 61.8 | 57.6 | 23 |
| SeeYouDrop | 9456 | 50.4 | 34.3 | 64.9 | 26.4 | 18 |
| **TheChain** | **16212** | **44.4** | **33.0** | **50.3** | **31.3** | **8** |

  **And the number the complaint needs** (`tools/work/v137/gate-sung.mjs`, gitignored — the same gate state machine, the same
  inputs, partitioned by the hand windows instead of summed over the music frames):

| track | sung % | lane lit of SUNG | lane lit of UNSUNG | lane sung-of-lit | live lit of SUNG | live lit of UNSUNG | live sung-of-lit |
|---|---|---|---|---|---|---|---|
| **TheChain** | 46.1 | **100.0** | **7.7** | **91.7** | **88.8** | **6.4** | **92.3** |
| IBelongHere | 85.5 | 97.7 | 54.2 | 91.4 | 87.3 | 43.6 | 92.2 |
| RaindropsOnRoses | 42.3 | 100.0 | 33.9 | 68.3 | 89.2 | 30.9 | 67.9 |
| SeeYouDrop | 47.4 | 98.3 | 34.8 | 71.8 | 83.0 | 21.1 | 78.0 |

- **What it says about DUST** (the user: *"feels like it doesn't follow the vocals (more so the instruments)"*). **The gate is
  not the problem.** On TheChain the shared gate is lit on **100 % of the sung time and only 7.7 % of the unsung** in file mode
  (88.8 / 6.4 live) — a sung-of-lit precision of **92 %**, the sharpest in the library by a wide margin (Raindrops 68 %,
  SeeYouDrop 72 %; and the lane's lit share, 50.3 %, is only 4 points over the 46.1 % the track is actually sung). The signal
  DUST needs is present, accurate and nearly leak-free on this material. What is small is DUST's USE of it: `dust/voice.js`
  (§127) spends the voice on `VOXD.DIM` **0.25** — a quarter of the cloud's light moved onto three thin partial shells — plus
  a RIBBON seam that needs `!subGate && voxSec > .5` over an **8 s** window to fire at all. On a track whose drums run two-and-
  four through every passage, `subGate` is up and the ribbon never opens, so the whole vocal grammar on screen is 25 % of the
  light on three shells while 100 % of the kick and snare lanes drive shape, scale and formation. **That is the gap to close,
  and it is a weighting question, not a detection one — the measurement above is the evidence, and nothing in `assets/` was
  touched here.** (The analogous read for TORUS2 and FLUID2 is not taken; only DUST was asked about.)
- **The renders, for the ear** (`~/Music/RetinaRave-clicks/`, five files, never played here — memory `feedback_listen_via_paplay`):
  `TheChain-vox-windows.wav` (the mix at .85 with a 3 kHz double-click where a passage opens and a 400 Hz click where it
  closes) and `TheChain-vox-stem.wav` (the Demucs vocal stem alone) are the §122 pair; `TheChain-A-152-25to85.wav`,
  `TheChain-B-76-25to85.wav` (`--every=2`) and `TheChain-A-152-170to230.wav` (the drop at 199.692 on its bar line) are the
  grid, which is what `gate: false` is waiting on. Listening order: the vox windows, the vox stem, then A against B on the
  same 25–85 s window, then the drop.

```
! paplay /home/toma/Music/RetinaRave-clicks/TheChain-vox-windows.wav
! paplay /home/toma/Music/RetinaRave-clicks/TheChain-vox-stem.wav
! paplay /home/toma/Music/RetinaRave-clicks/TheChain-A-152-25to85.wav
! paplay /home/toma/Music/RetinaRave-clicks/TheChain-B-76-25to85.wav
! paplay /home/toma/Music/RetinaRave-clicks/TheChain-A-152-170to230.wav
```

- **The traces and the gates.** `PORT=8876 tools/traces.sh TheChain-map1 TheChain-map0` → `tools/truth/traces/TheChain-map{1,0}.json`
  (6601 frames, 216 fields, heard 0 → 110 s, 16.2 MB each; gitignored, recorded into the MAIN checkout so they outlive the
  worktree) — `test_music.js` reads `windows.json`'s track list, so the ninth track's entry would have failed it with
  "no trace" without them. **`npm test` exit 0** with the ninth track in the lists: test_fluid 345 ok / 0 fail, test_music **151 ok / 0 fail**,
  test_vox's gated VOICED row for TheChain PASSES, test_loud 43 pass, the rest OK; the fake md5 untouched and no real-md5
  sweep (nothing in the engine moved here). TheChain's own claims print as NOTES, `gate: false` doing its job — and one of
  them says `[would FAIL; not a gate]`: *"the 2 seconds read as noise inject nothing (1 did) @ 2 3"* on map1, which is the
  dobro-and-bass opening being quiet enough that FLUID's noise test and its injector disagree about seconds 2 and 3. What the
  traces say about the engine on this material: the PCM clock reads **151.57 BPM**, the truth's 153.8 × 1 (ratio 0.986) — the
  clock locks the 152 octave, not the 76, which is half of the A/B above and the half that does NOT need the user's ear;
  `kickEvt` 101 over 50–110 s against 101 truth clicks (**×1.00** in file mode, ×1.22 live); tongues on 100 % of the frames
  from 20 s; the key pins **A at 7.0 s**, 94 % of the frames key-coloured, but `keyConf` **0.03** — under the §84 shade gate,
  so the mode question above is the engine's too; `subGate` 47 % (map) / 76 % (live); the LIVE build detector fires ONCE in
  0–110 s, at **86.117 s**, a false alarm by the 4 s rule (the only truth drop is at 199.692, outside the trace window) with
  `buildLive` max 0.87 — within the ≤ 4 rule; 3 director switches, none inside the 30 s dwell; FLUID injects on 100 % of the
  music seconds with 1 shockwave on the one confirmed clear, syrup 2.6 %, deep void 1.2 %. `node tools/check.js` **0 fail**
  (5 warn, the standing soft caps), `node tools/license.js --check` **157 / 0** (no new public code file — the truth json, the
  grain tables and windows.json are data).
- **Open, for the record (not gates):** the user's EAR on the five renders — the vox pair (do the eight passages and the 66 s
  break land where he hears them?) and above all **152 against 76**, which is what `gate: false` is waiting on · the mode of
  the A (a 0.036 parallel margin, conf 0.0491 under the shade gate): `key-truth.py` / `key-ears.mjs` not run and no
  `test_ears.js` KEY_TRACKS row yet · DUST's weighting of a gate that is now measured as accurate (`VOXD.DIM` 0.25 and the
  ribbon's `!subGate` condition) · the roster's identity references (`real-md5.sh`) and the behaviour ruler
  (`real-rulers.sh`) on the ninth track, owed with the next roster re-proof as §117's were · the three remaining passages
  pYIN calls unvoiced (0:30, 0:43, 1:59) — a .72–.79 share with no stable pitch is either the chest-voice entry or the
  separator's reverb, and the stem render says which.

**§137 addendum — the octave is 76, and B clicked the wrong half of the bar; and the §66 reference lists were never lost (2026-10-17, one Fable worker in a worktree off main 89547bc, branch `chain-truth`; the user on the two §137 click renders: *"I nod my head at 76 bpm, but the B clicks off beat"*, and on the gone §66 lists: *"why not generate so truth is there?"*).** Four commits on the branch, nothing merged, tagged or pushed.

- **The ear, read twice.** One sentence settled §137's open question and opened a smaller one. **The OCTAVE is 76** — not `bpm_grid.bpm` 151.9991 and not the summary's onset-ACF 153.8 — which is what §137 said the A/B had to decide (*"the number to doubt is the octave, not the phase"*), and the §117 precedent settled Raindrops the other way (*"the 140 click nods better then the 70"*). And **B took the wrong parity**: `clicktrack.py --every=2` keeps the beats where `k % 2 == 0`, the EVEN indices, while the map's bar line is `downbeat_mod4` **3** — an odd index — so B's half-time beat sat on the other half of the bar. Reproduced and measured here: B is **76 clicks over 25–85 s with ZERO accents**, because every downbeat it would have accented is at an odd `k` the lattice skipped. A flat, unaccented, off-parity click, which is exactly what the ear said.
- **The tool could only make one of the two parities, so it learned both** (`tools/truth/clicktrack.py`, `8cc4abf`). `--offset=N` starts the `--every` lattice at beat index N — *which* parity is clicked. `--bar=N` accents every Nth **clicked** beat instead of the truth `downbeats` list: at `--every=2` the grid's 4-beat bar is only **2** heard beats, so a bar of 4 at half time is `--every=2 --bar=4`, and the count runs from beat index `offset` so the accent phase does not move with `--from` / `--to`. The printed grid provenance now also reads `provisional` for a hand lattice nobody has listened to yet wherever the flag sits, as `gridcheck.py` already did.
- **The two B2 renders, the OTHER parity** (`--every=2 --offset=3 --bar=4`, the same tool, the same default −6 dB and the same 60 s stretch as A and B): **`TheChain-B2-76-25to85.wav`** (75 clicks, 19 accents) and **`TheChain-B2-76-170to230.wav`** (76 clicks, 19 accents — the bass break and the one drop at 199.692 s = 3:19.7, left as a pure grid render so it A/Bs cleanly against §137's `TheChain-A-152-170to230.wav`). **Why `--offset=3`:** the bar of 4 at 76 is **8** of the 152-beats (3.157912 s), and `downbeat_mod4` 3 pins the bar only to `k ≡ 3 mod 4`, so the bar line is `k ≡ 3 mod 8` **or** `k ≡ 7 mod 8` — both inside the odd parity. **Chosen 3**, because 1.2074 s is the map's own first printed downbeat and mod-4 index 3 carries its winning score (6.577). The two halves are a genuine tie in the numbers and the choice is carried as UNCHECKED: folded mod 8, the 940 kicks read **77** on index 3 against **76** on index 7 and the 985 snares **73** against **75**. The accents land on alternate map downbeats (26.5636, 29.768, … 3.19 s apart against the lattice's 3.158) — audibly a bar of four.
- **The parity itself is not a taste call, and the map was already sure of it.** Its `downbeat_phase` scores **[4.763, 6.298, 4.593, 6.577]** put both their peaks on the **ODD** indices 1 and 3, a **1.35×** margin over the even 0 and 2 — §137's "weak margin" note is about 1 against 3, not about odd against even. Independently, the track's own drums fold the same way: of the **940** kicks in `TheChain.kick.json`, **576** sit within 50 ms of a truth beat and split **312 odd / 264 even**; of the **985** snares, **584** sit on a beat and split **312 / 272**. Only 1.18×, because a 1970s kit plays the 8ths too — but it agrees with the grid, and with the ear.
- **The truth, as a hand grid in the §117 / §72 shape** (`tools/truth/TheChain.json` `bpm_grid.hand`, `cb99c1d`): `provisional: true` (so `gridcheck.py` prints `TheChain  provisional  … | hand yes anchor no provisional yes`), **bpm 75.9996**, beat **0.789478 s** (= 2 × 0.394739), phase **0.417959 s** = the tool's phase plus ONE 152-beat (the beats at odd `k`, `beats[1::2]`, **342** of them, 0.418 → 269.758 s), bar **3.157912 s**, bar phase **1.207400 s**, `downbeat_mod4` **1** on that lattice, **85** complete bars; plus `octave` / `parity` / `parity_evidence` / `bar_line` / `what_moved` / `beat_list` / `checked` / `not_checked` / `replaced` in the Raindrops block's own words, with the user's verdict quoted verbatim under `checked`. `summary.bpm` **153.8 → 76.0** with the tool's figure kept as `summary.bpm_tool` and a `bpm_note` saying not to quote 153.8 or 151.9991 as this track's tempo — `trackmap.py`'s HANDK block carries all of it through a re-run. `windows.json`'s `bpm` follows (153.8 → 76.0, the only line that moved), and `test_music.js`'s clock rule allows the 0.5 / 1 / 2 octave, so the page's ~152 now reads as **76.0 × 2** and passes. `TheChain.txt` carries the same grid as a "the FELT GRID" block beside §137's vocal appendix.
- **The `beats` / `downbeats` lists are UNCHANGED** — the Malicious (§72) and Raindrops (§117) rule: *the figure is recorded, the list stays*. Every consumer is built on the 152 list: `clicktrack.py` (A, B and B2 all index it), `kicktruth.py` / `snaretruth.py` (the 16th grids behind beat-slots [576 30 303 31] and [584 16 366 19]), `dropcheck.py` / `predcheck.py` / `queuecheck.py`, `gridcheck.py`, and `windows.py`'s one drop + 30 sections, bar-pinned to the 152 downbeats. Halving the list would re-bin every drum slot and move the 199.692 s drop off its bar pin, for an octave the ear has already named. The 76 grid is a 2:1 fold of the kept list: `beats[1::2]`, bar lines `beats[3::8]`.
- **The gate stays shut, by one word.** `windows.py` `NO_GATE` still names TheChain, now with a line saying the octave is settled, the parity is not, and **the gate turns on when the user confirms B2** (drop the name, and `bpm_grid.hand.provisional` to false with it). `npm test` **exit 0** — test_fluid 345 ok / 0 fail, test_music **151 ok / 0 fail**.
- **The §66 reference lists were never lost — only archived** (`a0e5cf9`). §137 made `kicktruth.py` / `snaretruth.py` load them conditionally because `tools/work/v66/{kick,clap}-ref-rise.json` were gone from the checkout. They are in **`/home/toma/Archive/RetinaRave-work/v66/`** — the lean-down's copy of `tools/work` — together with **the one-off that wrote them**, `kick3.py` and its `lib.py`. Restored to `tools/work/v66/` (gitignored, as the original) and proved by **re-running the generator instead of trusting the copy**: `(cd tools/work/v66 && python3 kick3.py)` reproduces both 2026-09-30 files **BIT-IDENTICAL** — `kick-ref-rise.json` md5 `5e2f7125e02ba3726590996f7ea52780` (**60** hits = 1.67 /s) and `clap-ref-rise.json` `f060d5822243e628eaf426259f8258f3` (**72** = 2.00 /s), both spanning **24.0026–59.8359 s**, which is §66's record to the digit. The Vienna columns print again, and they are §68's and §69's own published rows: `kicktruth.py Vienna … | §66 24-60: 57/60 m55 **P 0.96 R 0.92**` and `snaretruth.py Vienna … | §66 24-60: 70/72 m70 **P 1.00 R 0.97**`.
- **What the §66 lists actually are, now written at both load sites.** **NOT hand-marked**: no ear placed a hit. §68's phrase *"§66's own Vienna hand-grid list"* is the accurate one, and §69's *"hand-made"* means **built on Vienna's 90.000 BPM HAND GRID**, by tool. `kick3.py` runs the very rise these two tools run — a 4th-order band envelope (|x|, 5 ms box, 64-sample hop), `rise = 20log10(peak[−5, +60] ms / mean[−85, −5] ms)`, a hit = rise ≥ 4.0 dB and a local max over ±1 line — on 60–150 and 150–800 Hz, but on a **dead-flat 16th lattice** (phase 0.0026 s, bar 8/3 s) over an audio slice trimmed to **21–63 s**, where `kicktruth` / `snaretruth` use the DP `beats` list and the whole file. Those two differences are the entire 60-vs-57 and 72-vs-70 gap — and they are also what keeps the comparison from being circular, which is why regenerating the reference *from the committed tools* was rejected: it would have made the Vienna column read P/R ≡ 1.00 and graded the band sweep against itself. Both load sites now carry the provenance, the two differences and the one-line copy-and-run recipe; the loads stay conditional, because the files are still gitignored one-offs.
- **One correction to §69's prose.** It calls the clap list *"72 rim/clap hits on Vienna's beats 2 and 4"*. Its slot histogram over the 16 slots of the bar is **[11 0 8 0 14 0 0 6 6 7 0 1 12 0 7 0]** — the two biggest bins **are** beats 2 and 4 (slots 4 and 12), but only **26 of the 72** are there, and 2.0 hits/s cannot be a backbeat at 90 BPM (that is 0.75 /s). It is the **MID-BAND TRANSIENT list §69 itself says it is**, not 72 backbeats; `snaretruth.py`'s docstring now says so. The band choice §69 made with it is unaffected — a sweep against a transient list is what it always was.
- **Open, for the record.** The user's ear on **B2** — the parity, and with it the gate and `provisional` · the **half-bar** (`k ≡ 3` vs `k ≡ 7 mod 8`), a tie in the numbers that only a bar-only render or the ear can break · the beat phase at sample resolution (no anchor, no waveform marks: `gridcheck.py` still says *"beat phase never placed on the audio"*, dp_residual 77.2 ms) · the 199.692 s drop on its bar line · and §137's own open items, unmoved: the mode of the A, DUST's weighting of the voice gate, the roster's identity references on the ninth track.

```
! paplay /home/toma/Music/RetinaRave-clicks/TheChain-B2-76-25to85.wav
! paplay /home/toma/Music/RetinaRave-clicks/TheChain-B2-76-170to230.wav
```

## §138 DUST follows the singer — the sung register as a band that rides the pitch's height (2026-10-17, one Fable worker in a worktree off main 89547bc, branch `dust-voice2`; the user, watching DUST on main: *"looking at dust -> feels like it doesn't follow the vocals (more so the instruments)"* → *"retune dust"*)

- **The finding that scoped it (§137, not re-measured).** The scenes read ONE voice gate, `assets/math/vox.js` (§127: knee .45 → .85
  on `voxS`, hold .085 s, release .3 s), fed by the live net or the file-mode Demucs lane. On TheChain, unseen by the net, that
  gate is lit on **100 % of the sung time and 7.7 % of the unsung** (precision 92 %), the pitch within a semitone 95 %, false
  voice 0.5 %. The signal DUST received was full and clean; **DUST spent it thinly**: `dust/voice.js` (§127) moved a quarter of
  the light (`DIM` .25) onto three partial shells of sigma **.0075** on the log axis — in the galaxy that is a ring **.009 scene
  units thick** in a 1.7-unit disc, a HAIRLINE holding 2.4 % of the grains — and its one motion with the melody was RADIAL, a
  semitone = .011 units; pitch-as-height lived in the ribbon alone, which needs `!subGate && voxSec > .5` over 8 s. Under a kit
  whose kick, ring and sparkle drive every other number on screen, that is invisible. **A weighting question, not a detection
  one** — nothing in `math/vox.js` or the ears moved here; everything still comes through `vox()`, one gate, no second detector.
- **The design (three sentences).** The sung register is a BAND, not a hairline — `W` .03, three semitones' sigma, ~9 % of the
  grains at E4 — lifted in the sung note's hue at ×5–6 and GROWN (`SZ` 1.2 on the point-size sum beside the kick's 1· and the
  ring's 3·), and the rest of the cloud, the drums' flashes included, gives up nearly half its light to it (`DIM` .45) and takes
  it back within the gate's .3 s release — so the drums RECEDE under a sustained voice and the picture's colour follows the
  melody's notes. THE VERTICAL (the user's §121 rule, *"pitch seems more like a vertical move"*): the gate's height `y01` (the
  scale degree, a little of the octave, eased .35 s — the rig's recipe) moves the whole cloud by `Y0` .6·w·(y01 − ½) scene units
  and the band by `Y1` 1.6·vk more, so the lit hoop floats up out of the body on a high note and sinks under it on a low one, in
  every formation, on top of the drum grammar which is untouched (§61–§82: not one kick, ring, hat, fog or tension number moved).
  The ribbon seam is NOT opened on `w` alone — kept as §127 left it, a bonus state: on IBelongHere (68 % sung, four on the
  floor) a `w`-only seam would have put the cloud on a line for most of the track and thrown the twenty sections of drum
  grammar away with the shapes; a seam decision stays a section decision (reactive over predicted is about the per-frame
  response, which the band and the ride are). The candidates not taken: the fog and a separate hit-recession knob — `DIM` on
  the whole grain already recedes the flashes by the same share, one budget, one knob.
- **Two things §127 had wrong, found on the way.** (1) **The light budget**: §127's gain was `DIM·(1 − p)/p`, the budget of a band
  that is NOT dimmed, but the shader's factor `1 − DIM·w + gain·vk` dims every grain — so the population mean was `1 − DIM·p` =
  .994 at the hairline's p .024, inside `test_voxscene`'s ±.02; at the band's p .085 and DIM .45 it read **.957** and the test
  caught it. The gain is **`DIM/p`** now and the exact sum over 50 000 hashed grains reads .993–1.000 from C3 to C6, ×5.5–6.7,
  never capped (`GMAX` 8, was 12 — nothing reaches it). (2) **The sign of up**: `lookVP()`'s side vector is −cross(f, up), so
  its up vector is −up — screen up is world **−y**, and every formation has always lived mirrored with nobody able to tell. The
  first after-traces read the vertical ruler NEGATIVE (r(ΔlumY, ΔvoxY) −.39 on IBelongHere) and the shot at TheChain 54.1 s
  (E, y01 .12, ride −.38) put the hoop ON TOP of the sphere: §127's ribbon rise `w += uVoxC.y` had been lifting the line for a
  LOW note too. Both rises are subtractions in the shader now; the CPU numbers (`ribY`, `ride`) keep their sign.
- **The knobs** (`VOXD` in `dust/voice.js`; the shader's `#define`s mirror them; `&dvox=0` = the pre-§127 cloud on every frame):

| knob | §127 | §138 | what |
|---|---|---|---|
| `DIM` | .25 | **.45** | the cloud's share given up at w 1 — the drums recede with it |
| `W` | .0075 | **.03** | the band's sigma on the 0..1 log axis (a semitone .0092): a band, not a hairline |
| `A` | 1 / .6 / .4 | **1 / .5 / .25** | the three partials' weights — one band moving, not three |
| `GMAX` | 12 | **8** | the gain cap (unreached: 5.5–6.7 across C3–C6) |
| gain | DIM·(1 − p)/p | **DIM/p** | the budget: the factor's mean is 1 at every w |
| `Y0` | – | **.6** | the whole cloud's rise, scene units per unit of w·(y01 − ½) — ±.12 on a melody's ±.2 |
| `Y1` | – | **1.6** | the band's rise on top, × vk — ±.3 more: the hoop leaves the 1.1-unit body |
| `SZ` | – | **1.2** | the band's grains' size term, × vk |
| `RIBY`, `SEC`, the seam | .8, 8 s, `!subGate && voxSec > .5` | unchanged | the ribbon's rise (sign fixed), the section window, the entry rule |

- **The ruler** — `tools/dust-trace.js` gains `lumY`, the composited frame's luminance-weighted VERTICAL centroid (0 bottom … 1 top;
  the one column that can see a ride), and `tools/dust-voice.js` reads a set of traces: sung frames by the hand passages of
  `tools/truth/<T>.vox.json` (the truth, never the detector — §58), r(lum, voxS) against r(lum, kickAmp), the gate's lit share
  of sung / unsung, **r(lumY, voxY)** and its .25 s change **r(ΔlumY, ΔvoxY)** against the kick's Δ on the same frames, the ride's
  p10 / p90, the ribbon share, lum sung / unsung. Nine windows at scene 3, `&map=0` (the live net on the file — the user's 90 %
  case; `URLSearchParams` keeps the first `map=`, so dust-trace cannot be asked for the lane), "before" = `&dvox=0` on the same
  build (`tools/accept/v0.39/dust-voice-s138.txt` has the full table):

| track · window | sung % | lit sung / unsung % | r(lum,voxS) before → after | r(lumY,voxY) | r(ΔlumY,ΔvoxY) · kick's Δ | ride p10 / p90 | ribbon % before → after |
|---|---|---|---|---|---|---|---|
| TheChain 50–130 | 56.1 | 78.4 / 0.0 | −.05 → .06 | .15 | .04 · .04 | −.26 / .14 | 8.0 → 37.7 |
| TheChain 170–240 (the bass break + the chant's first 5 s) | 7.4 | 8.0 / 0.0 | −.19 → −.19 | −.09 | **.78** · .00 | .00 / .00 | 15.2 → 15.2 |
| IBelongHere 40–100 | 81.9 | 79.6 / 10.6 | −.22 → −.09 | .24 | **.37** · .15 | −.20 / .11 | 15.1 → 27.5 |
| RaindropsOnRoses 100–140 (the lead) | 63.9 | 81.2 / 1.6 | −.07 → −.07 | **.47** | .03 · −.02 | −.19 / .00 | 25.6 → 42.7 |
| SeeYouDrop 40–100 (chops) | 52.8 | 32.8 / 2.7 | −.53 → −.38 | **.71** | .18 · −.02 | −.17 / .00 | 30.5 → 41.1 |
| Comptine 11–71 · CyborgNinja 118–178 · Malicious 115–175 | 0 | – / 0.0 | identical rows | – | – | – | identical |
| Vienna 125–185 | 0 | – / 5.1 | −.08 → −.05 (unsung) | – | – | – | 9.6 → 9.6 |

  Read: **the vertical is the number** — where the ruler can see the sung height at all it follows it (SeeYouDrop .71, Raindrops
  .47, IBelongHere .24 per frame; the chant .78, IBelongHere .37 on the note's own .25 s), and the kick's Δ on the same frames
  is ~0, so what moves the picture up and down while someone sings is now the singer. The luminance correlations barely move
  because they cannot: the light is moved, not added (lum sung +2–6 % under the bloom, unsung within 1 %, SeeYouDrop −7 %).
  TheChain's long window reads weakest (.15 / .04): 37.7 % of it is the ribbon, whose line IS the waveform and owns the
  centroid, and the live pitch read on this track covers 53 % of the lane's (§137) — the eye check on the lane is owed. The
  three silent controls are identical to the frame; Vienna's 5.1 % lit is the live net's known false voice on its synth leads
  (§123, §127) and was already spent by §127's cloud. The ribbon shares in the "before" column are the pre-§127 rule (`&dvox=0`
  turns `voxSec` off too); §127's own cloud read 37.7 % on TheChain 50–130 (the first run of this work, on main's bytes).
- **The eye, so far mine.** Shot pairs at TheChain 68 s (`&dvox=0` against the defaults) and the ride's two extremes (54.1 s, E
  y01 .12; 120.5 s, D y01 .74): the band is a visible green/pink hoop of larger grains that changes hue with the note, and after
  the sign fix sits low on the low note and high on the high one. The user's eye is the gate (`#test&track=TheChain&scene=3&vox=live`
  for the live net, `#test&track=TheChain&scene=3` for the lane; `&dvox=0` on either for the before).
- **The md5s.** The fake smoke `IDS="3" tools/scene-md5.sh s138` (`tools/accept/v0.39/scene-md5-s138.txt`): **2 of 2 HOLD** — the
  fake timeline has voxConf 0 → w 0 → both shader blocks skipped. The real roster, s3 only, both map modes
  (`SCENES=3 PAR=2 tools/real-md5.sh s138-s3`, `tools/accept/v0.39/real-md5-s138-s3.txt`): **50 of 66 HOLD, 16 move, 8 new** (74 lines, 49 runs, f0 2 on all, 908 s wall).
  Every line of Comptine, CyborgNinja, Malicious, WhoLikesToParty and the take holds in both map modes (w 0: the blocks skipped).
  The voiced tracks move where the gate is open at the window's frame — IBelongHere 5, RaindropsOnRoses 6, SeeYouDrop 4 — and
  hold where it is shut; TheChain's 8 lines are new (§137 came after s135). **One line of an unvoiced track moves**: Vienna
  `drop1-f1522-m0`, the live path, where the net's known false voice on its synth leads (§123, 5.1 % of Vienna's frames through
  the §127 knee) has w > 0 and §127's cloud was already spending it — the gate's leak, not DUST's; the brief's "every unvoiced
  line holds" is MISSED on that one line, by the same mechanism `&vox=live` on Vienna has always shown. Its `m1` line holds.
- **Pitfalls paid.** A `tools/serve.js` left on a port by an earlier lane from the MAIN checkout served main's bytes to the first
  fake-md5 attempt (one md5 for both frames, hop 5106); a Chrome left on a debug port (PORT + 1000) by a killed lane was ATTACHED
  TO by the next run on that PORT, which then shot the stale page 74 times (every line one md5, "heard 171.417" on all of them) —
  `ss -ltnp | grep 88` and `pgrep -fa remote-debugging-port` before a list, and kill by pid. `pgrep -f` with the pattern's own text
  elsewhere in the same command line (a relaunch line) kills the shell (exit 144). `URLSearchParams` keeps the FIRST `map=`.
- **What is left.** The user's eye on all four voiced tracks, live and lane; the lane's picture under the ruler (dust-trace would
  need a `&map=1` path); TORUS2 and FLUID2 under the same question (§137 left them untaken); the §127 ribbon rise's sign on
  TORUS2's strand if it shares the recipe (not checked); the mirrored view in `lookVP()` left as it is (every formation was tuned
  under it); the full real roster (s0 / s2 / s4) not re-cut here — only scene 3's folder moved.

## §139 v0.42 tagged, NOT deployed — the cloud follows the singer, a ninth song (2026-10-17, one Opus worker on main, no worktree; the user: *"tag and merge"*)

- **What ships** (everything on `main` since the v0.41 tag at `7ecf804`; this note adds no code):
  **§137 THE NINTH TRACK** — TheChain (Fleetwood Mac, the 2004 remaster) joins the library, and *"tune on all tracks"* now means
  **NINE** (`windows.py` TRACKS → `windows.json`, the one list `real-md5.sh` and `test_music.js` read): the map, the seven grains,
  940 kick and 985 snare click truths, the loudness shape (**−12.219 LKFS**, range **13.22 LU** — the widest in the library) with
  its one bar-pinned drop at 199.692 s (**+8.23 LU, ×6.653**, the biggest ratio there is here), the Demucs vocal truth (**46.2 %**
  of the music sung, 15 windows / 8 passages, the lead sitting at E4 / F4 / G#4 — the highest in the library) and the file-mode
  lane. **It was held OUT of the net's training** (`voxtrain.py` LIB_HELD), so its rulers are the **first unseen word on the
  §133 / §134 net, and the news is good**: the sung pitch **within a semitone 95 %**, false voice **0.5 %** (the lowest of any
  track, under the solo-piano control's 2.59), voxS p50 in / out **.720 / .054 = 13.3×**, and the shared gate lit on **100 % of
  the sung time against 7.7 % of the unsung** — a sung-of-lit precision of **92 %**. · **ITS ADDENDUM** — the user's ear settled
  the octave (*"I nod my head at 76 bpm, but the B clicks off beat"*): the felt grid is **76 on the ODD parity**, recorded as
  `bpm_grid.hand` with `provisional: true` and the `beats` / `downbeats` lists **unchanged** (§72's and §117's rule: the figure is
  recorded, the list stays); `clicktrack.py` learned `--offset` and `--bar`; **the beat gate stays shut** until the user confirms
  the B2 render. Also in it: the **§66 Vienna reference lists were never lost, only archived** — restored and re-proven by
  **re-running the generator** (both 2026-09-30 files bit-identical), so the Vienna P/R columns print again, and §69's
  *"72 rim/clap hits on beats 2 and 4"* is corrected in prose (26 of the 72 are there; it is the mid-band transient list §69 itself
  says it is). **Nothing in `assets/` was touched by §137.** · **§138 DUST FOLLOWS THE SINGER** — the user, watching DUST on main:
  *"feels like it doesn't follow the vocals (more so the instruments)"* → *"retune dust"*. §137's measurement scoped it: the gate
  was accurate and **DUST spent it thinly** (`DIM` .25 onto three shells of sigma .0075 — a hairline **.009 scene units thick in a
  1.7-unit disc**, 2.4 % of the grains — and its one motion with the melody was RADIAL). Now the sung register is a **BAND**
  (`W` .03, ~9 % of the grains at E4) lit in the note's hue at **×5.5–6.7** and grown (`SZ` 1.2), **the rest of the cloud gives up
  nearly half its light to it** while a voice sounds (`DIM` .45) and takes it back within the gate's .3 s release — so the drums
  recede under a held line and are as bright as ever the moment it stops — and **the pitch is a HEIGHT** (the user's §121 rule):
  `Y0` .6 moves the whole cloud, `Y1` 1.6 the band on top, so the lit hoop leaves the body on a high note. The drum grammar
  (§61–§82) is untouched. **Two §127 slips fixed**: the light budget (`DIM/p`, not `DIM·(1 − p)/p` — the brightness factor's
  population mean now reads .993–1.000 from C3 to C6, and `test_voxscene`'s ±.02 caught the old one at the band's p) and
  **the sign of up** (`lookVP()`'s up vector is −up, so screen up is world −y: §127's ribbon rise had been lifting the line for a
  LOW note). The proof is the vertical: **r(lumY, voxY) .71 / .47 / .24** on SeeYouDrop / Raindrops / IBelongHere with the kick's
  Δ ~0 on the same frames.
- **The class is `scene`, and `scenes` is `[3]`.** The file's own rule, as its entries show it: §129 (v0.39), §132 (v0.40) and
  §136 (v0.41) each say *"no scene was added and no id moved, so it is not a `scene` release"* — **and in all three the content was
  the ears or the shared substrate.** Here **nothing in the ears, in `math/vox.js` or in `core/` moved at all**:
  `git diff v0.41..HEAD -- assets/` is **FOUR FILES, every one of them `assets/scenes/dust/`** (help.js, index.js, shaders.js,
  voice.js). The only engine code in this release is **one scene's own picture**, which is exactly what **v0.21** (*"DUST rebuilt:
  read the song with the sound off"*, class `scene`, scenes `[3]`) and **v0.34** (*"NAV moves with the music"*, class `scene`,
  scenes `[2]`) are. **`tuning` was rejected**: §138 is not a knob pass — it adds a grammar element (the band, the ride), three new
  knobs (`Y0`, `Y1`, `SZ`) and a sign fix. **§137 is truth and tools only** and so lands in `decisions`, never in the class.
  **TORUS2 is deliberately NOT listed**: §137 left the analogous read on TORUS2 and FLUID2 untaken and no TORUS2 byte moved.
  **Thumbnails: ONE, rendered by the build and by nothing else** — `tools/whatsnew.js` renders one per listed scene that has
  `site/thumbs/<name>.jpg`, the directory holds `dust fluid mandala nav2 torus2`, so the article shows **DUST** and only DUST
  (verified in the DOM, gate 5). Nothing was shot by hand; §136 / §129 / §125 let the build decide the same way. The entry's
  `decisions` is **`[§137, §138]`** — **bare numbers only**, because `tools/releases.js` line 36 validates every element against
  **`/^§\d+[a-z]?$/`** (§136's own finding, paid forward): *"§137 (the addendum)"* would be a problem, so the addendum is named in
  prose here and in the receipt and lives inside §137 where it was written.
- **What the entry says, in a visitor's words** (the house voice, no measurement in the prose, no § — `releases.js` refuses one):
  the title *"The cloud follows the singer"*, and it leads on the complaint it answers — *"the kick, the snare and the hat each had
  a voice in that picture and the singer had a hairline: a quarter of the light moved onto a ring so thin that under a real drum kit
  you would never find it… The detector was not at fault, and I measured that before I touched anything."* Then the band, the
  recession (*"the rest of the cloud — the drums' flashes included — gives up nearly half its light to it while a voice is sounding,
  then takes it all back within a breath of the voice stopping"*) and the height (*"the lit band floats up out of the body of the
  cloud on a high note and sinks under it on a low one"*), with the drum grammar's innocence stated (*"not one kick, ring or hat
  moved — this is only a question of who gets the light while somebody sings"*). The sign fix gets one sentence in the open
  (*"the view this engine draws through is mirrored top to bottom, which nothing on screen could ever tell you"*). The ninth song is
  given as **the only unseen word there is** (*"it was deliberately kept out of that learning… It says the detector is good"*).
  **The honest limits close it, as they must:** the solo piano *"can still make the cloud flicker a little; it is a fraction of what
  it was two releases ago and it is not nothing"*; the chops, *"a voice with no note in it, so the light it makes has no colour"*;
  *"on one song the lit line through the swarm is bright enough to own the picture by itself"*; the seam is *"still a once-a-section
  decision rather than something a voice can open on its own"*; the new song's pulse *"reads at double the speed you would nod your
  head to… the song is in the library for watching rather than for measuring against"*; and **the eye** — *"so far the eye on all of
  this is mine; the one it has to convince is at home in front of a big screen."*
- **The recipe (§136's ritual step for step, the three-page rule standing, §125's `releases.json` pitfall paid forward a FIFTH
  time).** `package.json` + `assets/core/version.js` 0.41.0 → 0.42.0 **together** (§89 — and `test_rec.js` is the gate that they
  agree: the take came out `retinarave-v0.42-nav2-2026-10-18T01-26-18.webm` with the sidecar reading `retinarave 0.42.0`) ·
  `releases.json` top entry (`v0.42`, **2026-10-17**, class `scene`, the title above, `scenes [3]`, no clip) — **hand-inserted as
  `JSON.stringify(entry, null, 1)` indented one space, after proving FIRST that `JSON.stringify(load(), null, 1) + '\n'` == the file
  byte for byte** (34 850 chars / 35 069 bytes, true), the script then re-proving that the **result** round-trips and that the 39
  existing entries are byte-identical in the tail: a **16-line pure insertion** (`git diff --numstat` **16 added, 0 removed**).
  `releases.js`'s own `save()` writes a different compact layout and would reformat all 40 entries; **it was never called, and the
  note has now held and cost nothing five times running** · `npm run build` (40 entries → `site/whats-new.html` **63 388 bytes**,
  and `index.html`'s `#newin` line moved because the title did: *New in v0.42: The cloud follows the singer → what's new*;
  `dist/index.html` **151 modules + 12 in the ears Worker, 269 KB inline, 1 854 024 bytes**) · `node tools/bundle.js
  releases/retinarave-v0.42.html` (**the same 151 / +12 / 269 KB / 1 854 024**, `VER = '0.42.0'`) · `git rm
  releases/retinarave-v0.39.html` (the three-page rule; `releases/` keeps v0.40 / v0.41 / v0.42, and v0.39's page is in history at
  its tag).
- **The frozen page, read against v0.41's** (151 + 12 modules / 1 848 752 bytes): **the module counts are IDENTICAL — 151 + 12 —
  and the inline Worker is the same 269 KB, because not one byte of the ears moved.** The **+5 272 bytes** are DUST's four files
  and the two version strings: the band and the ride in the shader, the knob table in `voice.js`, the help line. The greps asked
  for are all in it: **`EARS_WORKER_SRC` 6 hits** (v0.41's count exactly), **`idleFluid` 4 hits**, **`reads: true` 3 hits** (the two
  fluid cards' §135 declarations, CONTRACTS §1.4), **`nParams: 55246` 2 hits** (§134's weights module, unmoved), and **§138's new
  knobs with their values**: `#define VOX_W 0.03` · `VOX_DIM 0.45` · `VOX_A2 0.5` · `VOX_A3 0.25` · `VOX_Y0 0.6` · `VOX_Y1 1.6` ·
  `VOX_SZ 1.2`, beside `VOXD`'s own `DIM: 0.45`.
- **The gates, each run on the tree AFTER the bump.** The receipt with every number is
  `tools/accept/v0.42/tag-v0.42-2026-10-17.txt`:
  1. `node tools/check.js` — **154 modules · uniforms 161 · MS keys 223 · scenes 6 (help.feats gaps 0) · 0 fail · 5 warn**, exit 0
     — **met** (the brief's 5 warns expected; they are the line soft caps, all far under the 500 fail cap — `core/fluid/fluid.js`
     376, `core/scenes.js` 370, `ears/perc.js` 407, `dust/index.js` **365** (364 at v0.41: §138's one line), `torus2/index.js` 367)
     · `releases.js check` **40 entries, top v0.42 == package.json 0.42.0, 0 problems** — **met** · `whatsnew --check` **40 entries,
     up to date** — **met** · `license.js --check` **157 public files, 0 without the header** — **met** (157 at v0.41 too: §137 and
     §138 added no public file — the truth json, the grain tables and `windows.json` are data).
  2. `npm test` — **exit 0, 43.4 s** — **met**. `test_fluid` **345 ok, 0 fail**; `test_music` **151 ok, 0 fail** with the ninth
     track in the lists and its own claims printing as notes (`gate: false` doing its job); `test_loud` **43 pass, 6.30 µs per frame
     under the 40 µs budget**; `test_earsw` **OK** (1800 reads × 34 fields, 0 differ across the two transports); `test_voxscene`
     **OK** — and it is the suite that owns §138: the `&dvox=0` identity on 720 frames, the piano's false voice under the knee to
     the byte, and **the light budget's population mean 1 ± .02 over 50 000 hashed grains from C3 to C6** (.993–1.000, ×5.5–6.7,
     the cap unreached), which is the test that caught §127's gain. `test_vox`: the mel parity and the **ONNX parity on 200 held
     Jamendo-test windows, every column and both heads**, both pass; the stage **91.2 µs/hop median (p99 158) against ≤ 100 — met,
     and thin**; **TheChain's gated VOICED row passes at 13.3×**. **§134's and §126's known misses still print as `note`, never as
     FAIL, and were not re-baselined:** Jamendo-test **F1 .825 against the §133 gate's ≥ .84 — MISSED**, IBelongHere (unseen)
     **F1 .814 / P .961 / R .706**, and the mix pitch ceiling (within a semitone 49 / 53 / 10 / 50 % against the plan's 70).
  3. `GPU=1 MUTE=1 node tools/test_rec.js` (the version pair's own gate) — **all ok** — **met**: the sidecar's `app/version`
     **retinarave 0.42.0** and the file name **`retinarave-v0.42-…`**, the two strings moved together. §92's pin still wins
     (`Q.hold` .75 through the take, free again from q0 .55 after the stop); webm 15 864 866 bytes, EBML magic, 5.92 s / 7 clusters
     ≈ the sidecar's 6.014, a frame decoded, the HUD on in the DOM, the timeline 2 → 3 → 1 within 0.6 s of the keys. **358 frames at
     59.5 fps** composited — **better than §136's 270 at 45.0** on the same box at **load 6.42** (the user's own Chrome + VS Code are
     most of it; the idle floor here is 2.5–3 and was not waited for). `GPU=1` throughout; §132's finding that the governor
     assertion fails on swiftshader *without* `GPU=1` is known and was not re-tested.
  4. the **frozen page from `file://`**, headless, **CLOCK=1 GPU=1 MUTE=1** — `test&scene=0` → `{sc 0, grammar pool, fluidOn true,
     idle 0, errs [], bad [], frameN 300}` · `scene=1` → `{sc 1, bands, true, idle 0, …}` · `scene=3` → `{sc 3, pool, true,
     **idle 1**, …}` · `scene=4` → `{sc 4, pool, true, **idle 1**, …}` — **`errs []` and `bad []` (`CARD.nonFinite()`) on all four
     — met.** The four lines are **§136's to the character, `idle` included**, which is the point for a release that moved one
     scene's shader: DUST's picture changed and its MS read did not. `CLOCK=1` from the first pass (v0.37's pitfall, paid forward a
     fifth time). §131's honest note stands and is not this tag's: from `file://` in Chromium the PCM bus's worklet cannot load
     (`blob:null/<uuid>` is cross-origin there), so the live ears never run on a saved page — and on the fake timeline `voxConf` is
     0, so **DUST's two new shader blocks are skipped**, which is also why §138's fake smoke held 2 of 2.
  5. the **no-third-party receipt** (SOCIAL-PLAN §4) — **ONE host on every route** — **met**: `/whats-new` →
     `["127.0.0.1:8993"]` · `/` (`NOAUTO=1 real`) → `["127.0.0.1:8995"]` with `#newin` reading *"New in v0.42: The cloud follows the
     singer → what's new"* · `/about` → `["127.0.0.1:8997"]`. The v0.42 article renders (`id="v0.42"`, the label **new scene**,
     **17 October 2026**, the title, the notes line *§137 · §138*) and shows **exactly ONE thumbnail, DUST**, which is what
     `scenes: [3]` means. The credits were **already in place and needed no move** ([[feedback-credit-where-due]]): §137 borrowed no
     NEW corpus, solver or idea — **Demucs** (Défossez et al.) and **librosa / pYIN** (Mauch & Dixon) have been in
     `THIRD-PARTY.md` with their licences since §122, and §137's §66 regeneration ran the repo's **own** one-off; `git diff
     v0.41..HEAD -- site/about.html THIRD-PARTY.md` is **empty**, correctly. **The user's dev server was left running and
     untouched** — 8765 (this checkout, the only port listening in that range); every port used here was 8993 / 8995 / 8997, and no
     `serve.js` this session did not start was killed.
- **What was NOT run, and why — the brief's own instruction, and it holds.** The **full real-md5 roster** and **`accept.sh`**:
  **§138 paid the sweep on the only folder that moved** — `SCENES=3 PAR=2 tools/real-md5.sh s138-s3`, 74 lines, 49 runs, `f0` 2 on
  all, 908 s wall: **50 of 66 HOLD, 16 move, 8 new** (`tools/accept/v0.39/real-md5-s138-s3.txt`). Every line of Comptine,
  CyborgNinja, Malicious, WhoLikesToParty and the take holds in both map modes (w 0: the blocks are skipped); the voiced tracks move
  **exactly where the gate is open at the window's frame** (IBelongHere 5, Raindrops 6, SeeYouDrop 4) and hold where it is shut;
  TheChain's 8 lines are new (§137 came after s135); and **one unvoiced line moves** — Vienna `drop1-f1522-m0`, the live path, the
  net's known false voice on its synth leads (§123, 5.1 % of Vienna's frames) which §127's cloud was already spending: **the gate's
  leak, not DUST's**, carried, its `m1` line holding. The fake smoke held **2 of 2**. **§135's 330-line sweep covers s0 / s2 / s4
  and nothing else in the engine has moved since** — `git diff v0.41..HEAD -- assets/` is the four dust files and nothing else — so
  **§138's and §135's receipts ARE this release's content proof.** Also not run and not owed: a fresh load bench,
  `test_ears --trace`, `fluid-tracks.js`, a **director trace** (the roster is unchanged at `SCENES="0 2 3 4"`; nothing entered or
  left the rotation), and the key rulers on TheChain (§137 left them: a 0.036 parallel margin, conf under the shade gate).
  **No reference was re-based here** — the next engine sweep does that, never the tag. **No audio was played and nothing was
  retuned.**
- **Carried findings — recorded, NOT fixed, and none of them this tag's.** (1) **`tools/accept/v0.39/{scene-md5,real-md5}-s134-full.txt`
  (and `real-md5-s134-s1.txt`) are STALE ON s1** — cut at `8c464a0`, before §132's FLUID2 reset landed on main;
  `real-md5-s135.txt` supersedes them for s1. Unmoved since §136 named it. (2) **TheChain's beat gate is OFF** (`windows.py`
  NO_GATE) until the user confirms the **B2** render at 76 on the odd parity, with `bpm_grid.hand.provisional` true beside it; the
  **half-bar** (`k ≡ 3` vs `7 mod 8`) is a tie in the numbers (kicks 77 / 76, snares 73 / 75) only the ear can break. (3) **The
  up-vector sign on TORUS2's strand is UNCHECKED** — §127's ribbon rise was wrong-signed in DUST and TORUS2 may share the recipe
  (§138 did not look). (4) §134's two MISSED gates, §126's IBelongHere recall and the mix pitch ceiling, all stated plainly in the
  entry's prose. (5) `core/fluid/fluid.js` at 376 lines over the 350 soft cap (§135's item 2). (6) `accept.sh`'s routes / params
  blocks on NAV2, **still owed since §118**. (7) **The user's EYE is the gate on §138 and has not been given**: all four voiced
  tracks, live and lane (`#test&track=TheChain&scene=3&vox=live`, and without `&vox=` for the lane; `&dvox=0` on either for the
  before) — and §136's two eye items (DUST / NAV2 at home, the fluid filling from dark) are open too.
- **The deploy shape, unchanged — and this is why the tag stays local.** `dist/` is what `npm run build` writes and what
  `wrangler.jsonc` serves (`assets.directory ./dist`); `dist/` is git-ignored and not committed, and there is no `.github/`
  workflow — the deploy is **Cloudflare, git-connected to `github.com/tbkraf08/RetinaRave`, building on a push to `main`**.
  **So the push IS the deploy**, and the user's word was *"tag and merge"* — the merge was already done: **nothing was pushed.**
  When the word comes it is **ONE push** of `main --tags`, then poll for the `VER` line, **never a second push** (§115). ONE
  release commit, then `git tag -a v0.42 -m "v0.42 — the cloud follows the singer, a ninth song"` — **and stop.** The six sibling
  worktrees (`../RetinaRave-vox-net3`, `-fluid-idle`, `-v034`, `-track9`, `-chain-truth`, `-dust-voice2`) were **not touched**.
- **Next, in order:** **the user's EYE on §138** — the band, the recession and the ride on all four voiced tracks, live and lane,
  which is the one thing no ruler here can settle · **the user's EAR on B2**, which turns TheChain's beat gate on and
  `provisional` off · the user's word on the push · TORUS2 and FLUID2 under §137's own question (the voice's weighting there, and
  the ribbon rise's sign on the strand) · **CNN session 4** if the user wants it (§134's knobs; the ~10 µs bench margin makes a
  cheaper front end the pre-condition) · splitting the solver's passes out of `core/fluid/fluid.js` · re-cutting or formally
  retiring the stale s134 lists.

## §140 NAV3 — the navigator that ROLLS, and the drop as a parabolic implosion (2026-10-17, one Fable worker in a worktree off main fc8e1c8, branch `nav3`, NOT merged; the user: *"clone nav -> review [the QuantumComputing repo's "what is not implemented": chart-free navigation, parabolic implosion] ; improve nav clone"*)

- **What it is.** `assets/scenes/nav3/`, id 6, key `7`, forced-only (`score()` 0, `home: false`, `always: false`): a clone of NAV2
  whose navigation needs no chart and no table, and whose drop crosses the parabolic point. The §93 roster is unchanged (NAV2,
  DUST, TORUS2, FLUID bid), NAV2 (`assets/scenes/nav2/`, the home) is byte-untouched, `assets/math/field.js` is untouched
  (`test_field.js` OK on every run — it was NAV2's v0.8 numerics, built for exactly this and dead since §97's reset: the brief
  quotes the QuantumComputing review's words, *"built in assets/math/field.js but is dead code"*). Three commits, one per step:
  `3226203` the clone · `11cb152` the roll · `e454504` the implosion; the gate's records and this entry follow. The worker
  report with the friction log is `docs/workers/nav3.md`; the brief `docs/workers/brief-nav3.md`.
- **Step 1, the clone (the §97 recipe).** Every file byte-copied, `index.js` differing in the registration, the program names
  (`julia3-v2`, …, `pt3`), the label, and EVERY hook renamed — `n2*` → `n3*`, `green` → `green3`, `baby` → `baby3` — because
  hooks are dispatched by NAME across scenes (`core/harness.js`: `CARD.hooks[k]` is whichever scene registered last, and `&k=`
  in the hash reaches every scene that declares `k`); the brief's "hooks kept" would have left `&baby=` and `CARD.hooks.green`
  ambiguous between the two navigators. `main.js` registers it seventh (REG dense 0..6; `help.js`'s digit range follows
  `REG.length`); CONTRACTS §1.8 has the row; `scene-md5.sh`'s comment says 7 scenes / 14 lines. `always: false` by the brief: the
  s6 pair is not s2's bytes (frame 0's update is missed — §97's own note), and it is the step-1 record
  (`tools/accept/nav3/scene-md5-step1.txt`: `7ffaa4d4 / e8718212`).
- **Step 2, the roll (`nav.js`, new; `walk2.js` gone; `move2.js` / `look2.js` / `green.js` byte copies).** Inside a hyperbolic
  component the attracting cycle's multiplier is a coordinate: **log λ = ln ρ + i·2πθ** is holomorphic in c, so the whole
  continuation is one complex division, **Δc = Δlog λ / (λ′/λ)** (λ′ by `rhoGrad`'s central differences), in every component of
  every period — the Newton-on-twelve-bulbs of NAV's `bulbChart` without the twelve. The wall is ρ: a step whose linear
  prediction passes `RHO_WALL` .97 loses its radial part (the ball SLIDES along the rim), and a step is accepted only when
  `findCycle` at `N_ITER` names the SAME period (v0.8's finding, `docs/workers/nav2.md` 3: *"ρ alone is not a wall — the period
  test is"*), else halved once, else dropped: c and λ stand, never a visible jump (the 96 s node drive: 0 failures, the largest
  per-frame step .017). The music: **loud is out** — the track's own loudness ladder (`loudlight.js baseLight`) sets ρ from
  `RHO_LO` .25 (the Koenigs spiral loose) to `RHO_HI` .93 (tight against the rim: the curl, arg λ / ln|λ|); **pitch is up** —
  `math/vox.js`'s height y01 (the centroid when nobody sings) sets θ from `TH0` .5 (opposite the root; c = −.75 on the cardioid)
  by `TH_SPAN` −.17 toward 1/3 (the cardioid's highest point, Im c .65); `harmAngle` (`HARM` .05 turns per π) and the key's place
  on the fifths circle (`KEY` .08 turns × keyConf) turn it; a `sectionEvt` mirrors θ ↔ 1 − θ (the conjugate picture); the beat
  breath and the sub press (`move2.js`, unchanged) ride on ρ; the targets go through springs (`W_RHO` 3.5, `W_TH` 1.4) and the
  step closes `GAIN` 4·(.35 + .65·intensity) of the error per second, capped at `VMAX` 1.2 in |Δlog λ|. **Into a child by
  geometry:** against the rim (`GATE.RHO` .9) where `nearestRational(θ, QMAX 7)` names p/q within `TOL` .5/q² and the music
  ASKS (`buildLive` ≥ .45, `dropExpectedIn` > 0, or the ladder risen `RISE` .1 over `BARS` 2) — and while it asks the θ target
  snaps to the nearest p/q whose child is inside `P_MAX` 32, so the rim slides TOWARD the gateway (without that the fake's 3 s
  build never crossed) — the ball crosses: the root by `ROOT_STEPS` 2 secant steps along the normal (`ROOT_K` .9 each), the
  child's size **R = 1/(|dλ/dc|·q²)** (exact on the cardioid: sin(πp/q)/q² — field.js's own header), the landing the DEEPEST of
  `DIVE` .6·R·`TRIES` {1, 1.5, 2, .6, 2.6} that `findCycle` names q·q₀ (the first valid one sat at ρ_child .988, on the child's
  rim), and `CROSS` eases c ball → root → landing over `T` .8 s with the last chart held and `par` peaking at the root. The
  way out: the ladder under `FALL` .3 for `EXIT_BARS` 1.5 bars latches `leaving` (released only above FALL + `HYST` .3), θ →
  0 at `EXIT_SPEED` 2× (θ_child = 0 IS the root to the parent), and the crossing back lands on the stack's saved parent c,
  re-verified. The kick: `move2.js`'s lane as before, the jump along the outward normal by `KICK3.LEN` .5 × the size, the
  chart hidden while it rings (NAV's Misiurewicz jump without the table). The drop reads `dropLiveEvt` OR `mapDropEvt` (§107's rule — the first nine-track run read the live slam and synapse's `dropEvt` only, and six tracks never left; a slip, fixed before the gate's table) OR `dropEvt`
  (`OUT3.ANY`; `&n3drop=live` = NAV2's read) with `DROP_REFR` 4 beats — the fake timeline never arms the live detector, and NAV2
  on `#test` never leaves either (measured: `n2info().mode` INT, `extBeat` 0 at 15 s). Knobs: `&n3roll=RHO_LO,RHO_HI[,TH0,
  TH_SPAN[,GAIN,VMAX]]` · `&n3gate=QMAX,TOL[,BUILD,RISE[,FALL,EXIT_BARS[,DIVE]]]` · `&n3kick3=LEN`; a bare call READS the table
  (a bare `knob5('roll')` once parsed `''` as `[0]` and set `RHO_LO` 0 — fixed; look2's / move2's knobs keep the old pattern).
- **Step 3, the implosion (`implode.js`, new; `shaders-v2.js` + the uniforms `uImp uZ0 uA uSig uQ0`).** Three stages, one per
  mode. **OUT** (`T_IN` 1.4 s): the ball walks to the root c₀ — `solveMult` (`math/mandel.js`, a Newton in (z, c) onto λ =
  e^{2πi p/q} continued from the ball's λ in `LAM_STEP` .1, a SOLVER and the only `mandel.js` import) gives c₀ and the parabolic
  point z₀ to `ROOT_TOL` 1e-9 (the secant root + the rim's cycle point stand in at q = 1, the cusp, where that Newton
  degenerates); the Koenigs chart holds to `CHART_TO` .85 of the way (ρ → 1, the smoulder) and the **Fatou petals** fade in
  from `PET_FROM` .6: a non-escaping pixel is coloured by the sector of w = z_final − z₀ (q sectors; one per beat turns the
  wheel) and the phase of **Φ ≈ −1/(q·a·w^q)** — the time-to-leave, concentric bands in each petal — with `a` MEASURED at the
  root (g = f^{Qq} at |w| = `W0` .02 × the cycle's spacing, four directions averaged; measured at the rim's cycle point instead
  the linear term (λ^q − 1)·w swamps it and `a` read 2.7·10⁶; at the root 28 for 2/5, 55 for the 1/3 of a period-2 component).
  **EXT**: **c = c₀ + d̂·ε** — and d̂ is NOT the rim's normal: at a satellite root the parent's outward normal points INTO the
  child (the child hangs there; c₀ + n̂ε is its slow attracting cycle, the parabolic bifurcation, not the implosion), and the
  exterior is the thin wedge between the two tangent components, α ∈ (π/2 − ε/2R_child, π/2 + ε/2R_parent) from the normal
  (.17 rad wide at ε .014 on a 2/5 bulb). `FAN` probes a fan dense around ±π/2 with **`field.escapes()`** (the exterior Green's
  potential — no table) and takes the first direction outside at both ε₀ and 4ε₀ (3 of the node drive's 4 drops; the 4th, a
  1/6 root of a period-7 component at ε₀ 3·10⁻⁴, finds none and keeps the normal — owed). ε₀ = `EPS` .004 · 2^(reach + 6) ·
  the component's size (the `reach` parameter is log2 of ε in the component's own size now, range −10 … −2), breathing ×(1 +
  `EPS_BEAT` .5·(1 − beatPhase)) per beat and ×(1 + `EPS_DROP` 2·dropEnv) on the slam — the transit **σ = frac(π/√ε)** (the
  horn-map phase, the q = 1 normal form's, `IMP.sig`) sweeps its cycle with the beat and turns the layers' hue. The shader
  draws the imploded set as **the former interior's ESCAPE**: an escaped pixel takes the dust bands plus the gate-passage layer
  (an entry into R = `GATE_FRAC` .3 × the petal radius `(PET_K .03/|a|)^{1/q}` after `OUT_RUN` 2·q₀ iterates beyond 2R — the
  period cycle's own alternation is not a transit) and the glow of time spent near z₀; a pixel still inside keeps its petal.
  **IN** (`T_BACK` 1.2 s): back to the ball, the chart restored (`findCycle` re-verified). The budget is `ITER` 420 and the
  no-chart short budget is off while the implosion runs (GPU=1 bench 5.8–7.2 ms per frame in EXT against 3.2 rolling —
  a drop's seconds). Knobs: `&n3imp=EPS[,EPS_BEAT[,EPS_DROP[,PET_K[,PET_R[,T_IN[,SETTLE]]]]]]`.
- **The finding that reshaped step 3 — the budget against a q-petal point.** The brief's *"each passage costs ~π/√|ε|"* is the
  cusp's (q = 1) normal form. At a q-petal parabolic point the approach from |w| = r costs ~1/(q·a·r^q) iterations of f^Q — the
  critical slowing itself, algebraic — so from .15 at the cardioid's 1/3 root an orbit is still .08 from z₀ after 420 iterations
  of f (`tools/work/nav3/scan.mjs`), and a 2/5 root needs ~2·10⁵ steps of f⁵ to reach a gate of .02. Gate passages at q ≥ 3 are
  beyond any shader budget this engine will carry; the passage layer stays in the shader and lights where it can (the outer
  petal zones, low q), but the implosion's PICTURE inside 420 iterations is the escape of the former interior — the dust
  eating inward as ε grows and re-filling as it shrinks — and its CPU ruler is `implode.js layer()`: the fraction of 24 orbits on
  three circles in the former petal (.3 / .6 / .9 of its radius) that escape inside the budget, **8–58 % at ε₀ and 33–92 % at
  3ε₀** on the node drive's four drops (the brief's "implosion frames" = the EXT frames with that fraction > 0), beside their
  mean passage count (.2–.4 at the cardioid's roots, 2 at a deep one).
- **The node drive** (`tools/test_nav3.js`, 96 s at 60 Hz on a fake timeline with a loudness ladder, a singer on alternate
  sustains, a build at 10 s and the drop at 13 s of each 24 s loop; `N3TRACE=1` per second, `N3SCAN=1` the ε scan at each drop):
  every frame finite · the wall held (max ρ .927 against .97) · 2 crossings (into the 1/7 child, period 7, out again on the quiet
  breakdown) · 4 drops → OUT 1.4 s each → EXT → IN → INT, the chart back · 0 `findCycle` failures, 0 stalls · the ball's largest
  per-frame step .017 · **.047 ms per update()** in node (findCycle at N_ITER + rhoGrad + Green's ruler; NAV2's was .042) · the
  byte copies (move2, look2, green, shaders) · the registration · the guards. `node tools/check.js` 0 fail (nav.js 354 lines, a
  soft-cap warn; the card's thumb cut at the end), `license.js --check` 0 without, `test_field` OK, `test_nav2` all ok; `npm test`
  carries `test_nav3`.
- **The gate** (every run on PORT 8813, one Chrome at a time; records under `tools/accept/nav3/`). `node tools/check.js` **0 fail**
  (7 warn: nav.js 354 lines over the 350 soft cap, the five pre-existing) · `license.js --check` 0 without · `test_field` OK ·
  `test_nav2` all ok · `test_nav3` OK. **The full list** (`tools/scene-md5.sh nav3s3`, 14 lines, `scene-md5-step3.txt`): the
  **12 existing lines unmoved** against `v0.39/scene-md5-s135.txt` / `-s138.txt` to the byte (s2 `a6c725fa / a12256fd`), s6
  `9fc210b7 / 71635e5c` (f360 = step 2's: the roll before the drop; f840 the implosion at 13 s). **SwiftShader bench**
  (`load-bench.js`, IBelongHere from 0, 30 s, 2 runs, `load-bench-nav3.txt`): NAV3 **30.1 / 29.3 fps**, ENGINE.ms 1.94 / 1.92 ·
  NAV2 **33.0 / 33.6 fps**, 1.85 / 1.74 — the governor collapses q to 0 by 8 s on the software renderer, and IBelongHere's
  first drop at 15.9 s puts the 420-iteration implosion inside the window: NAV3 is ~10 % slower there. **On the GPU** (`GPU=1`,
  q held at 1, tier 3) both hold 60 fps on every track; `CARD.bench` NAV3 2.1–2.2 ms rolling (NAV2 1.6–2.1), 3–5 ms in a
  child of period 5–7, **10.2–10.9 ms while the implosion runs** (SeeYouDrop, Raindrops — a drop's seconds, 420 iterations).
  **The nine tracks** (`tracks-tr2.txt`; the window `at = drop − 14`, the counters at drop + 12 s heard; `tracks-run1.txt` is
  the first run, which read the live slam and synapse's `dropEvt` only — six tracks never left, the `mapDropEvt` slip above):

  | track | drop (s) | rim s | children | max period | drops | implosion frames | petals q | escMax / passMax | fps t3 (bench ms) NAV3 · NAV2 |
  |---|---|---|---|---|---|---|---|---|---|
  | SeeYouDrop | 57.6 | 0 | 0 | 1 | 1 | 635 | 3 | .08 / .25 | 59.7 (10.2) · 60 (4.44) |
  | IBelongHere | 64.7 | 2.6 | 1 | 7 | 1 | 156 | 2 | 0 / .17 | 60 (2.08) · 60 (2.02) |
  | Comptine | 31.5 | 0 | 0 | 1 | 1 | 1171 | 2 | .08 / .13 | 60 (5.29) · 60 (2.04) |
  | RaindropsOnRoses | 68.6 | 0.7 | 0 | 1 | 1 | 636 | 2 | .08 / .29 | 58.9 (10.9) · 60 (2.10) |
  | Vienna | 85.3 | 7.4 | 1 | 3 | 0 | 0 | — | — | 60 (2.23) · 60 (2.05) |
  | WhoLikesToParty | 57.5 | 1.7 | 0 | 1 | 1 | 190 | 7 | .08 / .33 | 59.9 (2.09) · 60 (1.67) |
  | Malicious | 148.3 | 0 | 1 | 5 | 0 | 0 | — | — | 60 (2.09) · 60 (2.09) |
  | TheChain | 199.7 | 5.8 | 1 | 5 | 1 | 111 | 2 | 0 / .17 | 59.9 (3.07) · 60 (1.58) |
  | CyborgNinja | (48, no drop) | 0 | 0 | 1 | 0 | 0 | — | — | 60 (4.20) · 60 (2.08) |

  0 `findCycle` failures and 0 stalls on every track, `errs []`, `bad []`. Six of nine cross into a child inside their window
  (max period 3–7); the rim time runs 0–7.4 s of 26. **Why three tracks show no drop:** CyborgNinja has no drop in
  `tools/truth/windows.json` (its window is the loudest 30 s — nothing to fire). Vienna (85.34) and Malicious (148.32) carry
  bar-pinned drops in the truth tool's list, but inside these windows neither the live detector nor the engine's own track
  map (`mapDropEvt`, `engine/map`) raised one on this build — the same reads NAV2 and FLUID take (§107), so this is the
  detectors on those two tracks, not the window and not the scene; which of the two maps disagrees with the truth tool is
  not measured here (owed: a `filetrace.js` of `dropLiveEvt / mapDropEvt / dropEvt` over Vienna 71–97 and Malicious 134–160).
  The escape fraction `escMax` reads .08 on every track that imploded (one of the 24 sampled orbits — the outer zone at
  ε₀), 0 on IBelongHere and TheChain (deep roots, ε₀ ∝ the small component): the implosion's visible depth on real tracks is
  thinner than the fake drive's 8–58 % promised, and the `EPS` knob (`&n3imp=`) is where the eye retunes it.
  **Montages:** `tools/work/nav3/montage-test.jpg` (`#test`: the roll at 6 and 26 s, the way in at 13.9, the explosion at 15 and
  17.5, the return at 21.5, the s6 pair) and `montage-tracks.jpg` (four shots per track: drop − 6, drop − 1, drop + 1.5, drop + 5).
  `site/thumbs/nav3.jpg` is f360 of the fake timeline (thumbs.sh's recipe by hand — its id grep misses an `id: 6,   // …` line).
- **What is NOT done.** (1) **Nothing is validated by eye** — every number here is a ruler's; the user's eye on key `7` is the
  gate that matters (the roll's feel, the petals, the implosion's depth, the mirror flips on a section). (2) The implosion's
  depth on real tracks is thin (`escMax` .08 / 0): `EPS` .004, `EPS_DROP` 2 and `GATE_FRAC` .3 are the fake drive's numbers,
  not retuned per track; the per-track retune the brief asked for stops at the counters above. (3) The direction fan finds
  no exterior at deep roots (the node drive's 4th drop; `fan` 0 on 7 of the 9 tracks' drops means the normal itself was
  outside or the fan fell back — the record does not separate the two; owed). (4) Vienna and Malicious: no drop raised in
  their windows (above). (5) Gate PASSAGES at q ≥ 3 are beyond the budget (the finding) — the Lavaurs "hair" is the escape
  layer, not a passage count; the OKLCH mapping (`&colour=oklch`) carries neither layer. (6) `nav.js` is 354 lines (soft cap
  350). (7) The implosion costs 10–11 ms per frame at tier 3 on this GPU and ~10 % of SwiftShader's fps: the governor will
  drop q on a weak GPU during drops; `OUT3.ITER` is the knob. (8) The thumb, `site/about.html`, README and THIRD-PARTY carry
  the scene and the credits; `releases.json` is untouched; no merge, no tag, no push — main is untouched and NAV2 is
  byte-identical to main's.
- **ADDENDUM — the dance retune (2026-10-18; the user, watching NAV3 on 8765: *"the fractal shape doesn't seem to be changing that
  much (I did see something cool around the drops which did line up) but the set doesn't seem to be dancing with the music"*).**
  The implosion stays as it was (its knobs untouched); the ROLL is what moved. **Measured first** (`tools/work/nav3/dance.mjs`: one
  deterministic window, NAV3 forced with NAV2 updated beside it, per frame both navigators' c, log λ, period, mode; 18 windows =
  the nine drop windows of the gate + a 30 s mid-song window per track with no drop; `tools/accept/nav3/dance-{before,after1,
  after2}.txt`): before the retune NAV3 moved **|Δlog λ| .008–.144 per beat** (median .06) against **NAV2's .29–1.14** (median
  .57); its arg λ swing per bar .03–.39 rad against NAV2's .83–1.81; its time near the rim (ρ > .9) 0–22 % of the frames
  against NAV2's 7–23 %; effectively still (|Δc| < 10⁻⁴ of the component's size) on 0–3 % of frames (NAV2 0). The ball was alive
  but ten times quieter than the chart walk the user's eye is used to — c sat at ρ .25–.6 with a 3.5/s spring and a 1.2/s speed
  cap, and nothing reactive touched log λ between drops.
  **What moved (every number a constant, `ROLL` / `DANCE` / `KICK3` in `nav.js`, the knob `&n3dance=BASS,KICK[,HIT[,TURN[,SWAY
  [,SNARE]]]]`):** the ball lives at the rim — `RHO_LO` .25 → **.45**, `RHO_HI` .93 → **.955**, `RHO_WALL` .97 → **.985**
  (field.js converges there inside 1000 steps); the springs and gains are a beat's, not a bar's — `W_RHO` 3.5 → **9**, `W_TH`
  1.4 → **5**, `GAIN` 4 → **12**, `VMAX` 1.2 → **3.5** (4 put the per-frame c step at .059 on the node drive, over the
  continuity monitor's .06 with no margin; 3.5 reads .053); and **THE DANCE**, reactive only (the user's rule: reactive levels look
  in sync, predicted routes don't — no `pred*`, no `next*`): ρ += (`BASS` .6·bass + `KICK` .8·kp + `HIT` .3·hit)·(1 − ρ) — the
  bass level and the kick lane's impulse (kickAmp on kickEvt, τ `KICK_TAU` .2 s) press the ball out so the spiral's tightness
  arg λ / ln|λ| pulses with every kick; θ += `TURN` .1 turns per bar (the lobes rotate, a full turn in 10 bars) + `SWAY` .18
  turns·sin(2π·phrase16Pos/16) (the shape is never the same two bars running) + `SNARE` .08·sn·(±1) (snareAmp on snareEvt, τ .25 s,
  the side alternating: the 2-and-4 twitch); and the kick's jump leaves along the normal turned by ±`KICK3.ANG` .9 rad, the
  side alternating per kick, so the jump swings the lobes and not only the rim. The wall, the child crossings, the exit and the
  implosion are untouched.
  **After (two passes — the first at BASS .35 / KICK .45 / TURN .06 / SWAY .1 / RHO_LO .55 read |Δlog λ| .03–.24 per beat; the
  second is what ships):** NAV3 **|Δlog λ| .06–.40 per beat** (median .20, 3–4× before; Vienna .40, Raindrops .35, Malicious .29,
  TheChain .26), arg λ swing per bar **.34–1.20 rad** (inside NAV2's range on 15 of 18 windows), near the rim **13–62 %** of the
  frames (0–2 % only on Comptine's drop window and TheChain's verse, where the ladder is low), still on 0 % of frames, the
  per-frame step under the monitor's rule on every window (`maxStep` .053 on the node drive, no findCycle failure, no stall).
  **Not met:** the brief's "per-beat |Δlog λ| at least NAV2's" — NAV2's per-beat figure (median .57) is its ±1.3 rad φ lean on
  `harmUnw` plus the breath; NAV3 sits at a third of it per beat and matches it per bar in angle. Pushing further means a
  bigger `VMAX` (the monitor's .06 per frame is the ceiling) or a bigger `TURN` / `SWAY` (the knob is there).
  **The strips** (`tools/work/nav3/strip.sh`: 8 shots at half-bar steps across 4 bars, deterministic): `tools/work/nav3/
  dance-ibh-{before,after,nav2}.jpg` (IBelongHere 24–32 s, 117.6 bpm) and `dance-chain-{before,after,nav2}.jpg` (TheChain's verse
  104–116.6 s, 76 bpm); the first pass's strips are under `after1/`. Before, one outline holds for three half-bars (TheChain
  frames 1–3, IBelongHere 1–3); after, the arms, the pinch at the rim and the Koenigs spokes differ frame to frame. The s6 pair
  after the retune: `tools/accept/nav3/scene-md5-dance.txt`; the 12 other lines cannot move (a scene-folder change). `check.js` 0
  fail, `test_nav3` OK (the node drive's step rule is the monitor's .06 now), `test_field` OK; 60 fps at tier 3 held on every
  window of the ruler (the real-time runs of the gate are unchanged in cost: the roll's per-update cost is .048 ms).
- **ADDENDUM — the quality pass (2026-10-18; the user on 8765: *"how to increase the quality of the render? (seems pixelated)
  sometimes the glow washes out the fractal and is hard to see it"*).** Two retunes, both measured first, the implosion's look kept.
  **Pixelation = the governor's q** (`core/quality.js`: scale = .38 + .62 q, iter = 64 + 200 q). The q trace (`tools/work/nav3/
  qtrace.mjs`: a 30 s REAL-TIME run on the GPU from each drop window's `at`, q and fps sampled every 250 ms; `tools/accept/nav3/
  q-before.txt`): on this box q never went under .55 for either scene, but NAV3 sat **.77–.84 on the five windows with an
  implosion** (SeeYouDrop .812, IBelongHere .837, Raindrops .766, WhoLikesToParty .796, TheChain .833; fps min 46–52 in EXT)
  against **NAV2's .91–.92** on the same windows, and matched NAV2 where it only rolled (Vienna .905, Malicious .909, CyborgNinja
  .925, Comptine .913 vs .908–.921). So the pixelation is the implosion's 420-iteration budget: on a GPU with less headroom than
  this one the governor answers it with a halved render scale. The rolling cost was NOT 2–5× — the gate's `bench` numbers of 10–11
  ms were read inside EXT (the settle after a `peak` is 48 beats) and CyborgNinja's 4.2 ms was its rolling at ρ .9+ where an orbit
  needs ln(eps/|w₀|)/ln ρ iterations to converge (55 at ρ .95, 190 at .985, 10 at .75); its q trace reads .925, NAV2's .916.
  **The cuts:** (1) the implosion's budget follows the governor — `IMP_ITER_MUL` × `Q.iter`, capped at `OUT3.ITER` (a first pass
  at 1.6 / 420 lifted the five windows to .818–.891, still under NAV2; what ships is **1.2 / 320**: 317 iterations at q 1, 228 at
  q .63); escaped pixels already left the loop, the passage layer costs ~10 flops per iteration and is not the cost. (2) the
  shader's convergence radius grows toward the rim (`ROLL.CONV_RIM` 2 past `CONV_R0` .85, capped at `CONV_MAX` .12 on the
  cardioid and .4 × the cycle's spacing in a child — `nav.js publish()`): the Koenigs coordinate the shader reports, Lw/(−ln ρ) +
  n/q, is an invariant, so stopping the orbit earlier at a bigger eps moves no band. (3) the period cap `GATE.P_MAX` 32 → **14**: at
  period 21–30 the Julia set is hair-thin and both the cost and the wash were at their worst.
  **The glow.** The ruler is `tools/lumtrace.js` (HARNESS "Luminance ruler") on the nine drop windows at 2 fps, NAV3 before / after
  and NAV2 on the same frames (`tools/accept/nav3/lum-{before,after,after2,nav2}/`, the per-track summary `lumworst.mjs`: meanY,
  clipFrac, the structure score grad's p50 / p10, the WASH frames — grad under .012 with meanY over .2 — and the three worst by
  grad/Y), plus `edge.py` on the worst frames' shots (the fraction of pixels with a local gradient over .08 = where an edge reads,
  the fraction over Y .5 = the wash). **Before:** NAV3 meanY .17–.27 against NAV2's .135–.215, wash 8 % of frames against 4 %,
  the worst rolling frames with 20–25 % of the pixels over Y .5 and edges on 0.9–1.5 % (CyborgNinja 59.5 s, Malicious 157.5,
  Vienna 95.5 — all at ρ .92–.985 in a period 15–28 child: the interior smoulder, whose ρ window .5–.98 was ALWAYS open now that the
  ball lives at the rim, plus the halo's 90 px half-reach over a hair-thin set); the other worst frames are the implosion's EXT
  (TheChain 210, Raindrops 71.5, Comptine 41) and the drop flash itself (Comptine 21.0, IBelongHere 64.5: Y .5–.6 — the composite's
  flash, the same on NAV2), both kept. **What moved (nav3's own `look2.js`, off the byte-copy list; the knobs `&n3lum` / `&n3ext` /
  `&n3smo` as before, `&n3ext=GAIN,SHARP[,SHARP_IN[,TAU]]` now):** the smoulder lights only at the very rim — `SMO` R0 .5 → **.85**,
  R1 .98 → **.995**, HI .4 → **.3**; the interior knee `LUM_IN` (.3, 1.5) → **(.25, 2.5)**; the halo's reach narrowed INSIDE the
  set too — `EXT.SHARP_IN` **1.6** (NAV2's rest is 1) and `SHARP` 1.5 → **2.2** outside. A first pass that also took the exterior
  knee to (.35, 3) and SHARP to 3 / 2.2 read the three rolling frames right (edges 3.0 / 1.0 / .84 % of pixels, the wash under 1 % —
  CyborgNinja's edge-to-wash ratio .08 → 3.55) but dimmed the whole picture under NAV2's (meanY .127–.17, grad p50 under NAV2's on
  every track): §99's lesson again, a dim keeps a flat wash flat; the exterior knee went back to NAV2's (.45, 1.5).
  **After (pass 2, what ships; `tools/accept/nav3/q-after2.txt`, `lum-after2/`, `glow-edge-after2.txt`):** the q trace NAV3
  **.884–.924** on the nine windows against NAV2's .908–.923 — inside NAV2's band on 7, a hair under on SeeYouDrop (.895) and
  WhoLikesToParty (.884); q never under .55 or .35 on either scene; fps 57.4–60 mean, min 50–54 inside an implosion (NAV2 60
  throughout). The glow ruler: wash frames **2.9 %** (before 8 %, NAV2 4 %), meanY .15–.23 and grad p50 .0097–.0154 inside NAV2's
  .135–.215 / .0109–.0177 on every track. The worst rolling frames by the edge ruler (`tools/work/nav3/glow-{before,after,after2}.jpg`,
  the same deterministic frames): CyborgNinja 59.5 s edges 1.5 → **3.7 %** of pixels, the wash 19.8 → **8.6 %**; Malicious 157.5 s
  edges 1.3 → **2.4 %**, the wash 22.1 → **11.7 %** — the set's boundary and its spiral arms read against a dark interior where
  the before frames were a lit blob. **Not met:** Vienna 95.5 s (ρ .985 at period 14) is still a flat cyan blob (edges .9 %, the
  wash 24 %): at the wall in a deep child the Julia set is hair-thin and the halo fills it whatever the knee does — the next move
  is a smaller `P_MAX` or a lower `RHO_WALL` inside a child, both knobs, the user's eye to decide. The implosion's frames
  (TheChain 210, Raindrops 71.5, Comptine 41) are a lit blob by this ruler too and are KEPT — the user liked them. The s6 pair after
  the pass: `tools/accept/nav3/scene-md5-quality.txt`; the 12 other lines cannot move (a scene-folder change). `check.js` 0 fail,
  `test_nav3` OK (look2.js off its byte-copy list), `test_field` OK, 60 fps at tier 3 held on every window of the dance ruler.
- **ADDENDUM — the depth pass (2026-10-18; the user, from a recording of NAV3 on 8765 at 08f7c2a: *"why does it look like the set is
  lots of little circles? it doesn't look like the mandelbrot/julia fractal?"* — a rosette of small flat-green petals, c's cursor
  on a child far down a bulb, the outline barely changing over 8 s).** Three causes named, measured first (`tools/work/nav3/
  periods.mjs` on the dance ruler's rows — the share of frames by period class, the longest run at period ≥ 8, the share of INT
  frames pinned at the wall ρ > .98, the longest still run; `tools/accept/nav3/depth/`), on the nine mid-song windows at 08f7c2a:
  **period ≥ 8 on 23 % of the frames** overall and 55–65 % on Malicious, Raindrops and WhoLikesToParty (runs of 16–19 s at
  period 10–28), 29 % on Vienna; **pinned at the wall 35–39 % of INT frames** on IBelongHere, SeeYouDrop and Vienna; no still run
  over .27 s by |Δc| (the ball moved — but in a period-28 child the rosette's outline is the parent's dynamics, and the tiny
  component's λ moves only its petals: the picture stands still while the ball dances). (1) **DEPTH.** The quality pass's `P_MAX`
  14 let the gate cross a child's child (period q₀·q); a filled Julia set of period ≥ 8 is a cluster of small components — right,
  and not the one blob with spiral arms the user knows from NAV2 (the cardioid and its first-level bulbs). Policy now: **the home
  is the cardioid and its first-level bulbs** — `GATE.DEPTH_MAX` **1** (the gate refuses a crossing from inside a child), `P_MAX` **7**
  (= `QMAX`), and a child crossing **holds `CHILD_BARS` 2 bars once the music stops asking**, then rolls back out (`N.leaving` 2; the
  fallen ladder's exit, `leaving` 1, still goes first). (2) **THE WALL.** The breath and the dance's pulse pressed toward 1 − ρ, so
  on a loud track (`RHO_HI` .955) the ball sat at `RHO_WALL` .985 with every step's radial part projected to zero — the stall by
  the ruler. `RHO_HI` .955 → **.9** and the press reaches **`PULSE_TOP` .965**, never the wall; the `DANCE` numbers of 44eda55 are
  untouched. (3) **THE CONVERGENCE RADIUS** (the quality pass's `CONV_RIM` 2 past .85, cap .12) was the suspect for the flat
  interior; it is NOT the cause: the same-frame A/B (`&n3conv=2,0.85,0.12` against the new .6 / .93 / .05, the gate forced by
  `&n3gate=7,0.5,0[,…,14,2,99]` so `#test` reproduces the recording's situation — period 14 at depth 2, ρ .945) reads the band
  ruler (`bands.py`: the share of interior pixels on a band edge) **identical on 6 of 8 frames and within 1 % on the other two**,
  at period 14 and at period 2 alike (`tools/accept/nav3/depth/bands-test-strips.txt`). The flat interior is the depth itself: at
  ρ .98 in a hair-thin component the Koenigs bands are sub-pixel. The milder radius is kept (the q trace did not move).
  **After** (`periods-after.txt`, `dance-d3after.txt`, `q-after3.txt`, the strips `tools/work/nav3/deep-{before,after}.jpg` on
  `#test` with the gate forced): **period ≥ 8 on 0 % of the frames, ≤ 7 on 100 %** (target ≥ 80 %), period 1 on 64 %; pinned at
  the wall **0–5 %** of INT frames (was 35–39 %); the dance held or rose — |Δlog λ| .07–.37 per beat, the arg swing .65–1.15 rad
  per bar, the rim 1–54 %, still 0 %, the per-frame step .047 on the node drive; the q trace **.903–.926, 60 fps min 60 on all
  nine windows** (NAV2 .908–.923). On the forced-gate `#test` strip the before run sat at period 14 (depth 2) as a hairy spindle
  whose outline held across the eight half-bars; the after run lands in the 1/2 bulb (period 2, depth 1) — one blob, spiral arms,
  a different outline each half-bar. The s6 pair after the pass: `tools/accept/nav3/scene-md5-depth.txt`; the 12 other lines
  cannot move. `check.js` 0 fail, `test_nav3` OK (10 crossings / 5 exits on the node drive now that a child is left on its own),
  `test_field` OK. **Not done:** the user's eye on the result; the gate's `&n3gate=` list is 10 numbers now (documented in knob5).

## §141 v0.43 tagged, NOT deployed — NAV3: the navigator that rolls, the drop as a parabolic implosion (2026-10-18, one Opus worker on main, no worktree; the user: *"tag what has been done so far"*)

- **What ships** (everything on `main` since the v0.42 tag at `ba45bd5`; this note adds no code). It arrived in ONE merge,
  **`188734c`**, of the branch `nav3` — seven commits on a line that was fast-forwardable off `main` `fc8e1c8`, so `--no-ff`
  wrote a merge commit and **nothing was resolved by hand**. **§140 NAV3** — `assets/scenes/nav3/`, **id 6, key `7`,
  FORCED-ONLY** (`score()` 0, `home: false`, `always: false`): the §93 roster is unchanged and the director cannot pick it;
  **NAV2, the home on key 3, is byte-untouched** and `assets/math/field.js` is untouched (it was NAV2's v0.8 numerics, built for
  exactly this and dead since §97's reset — the QuantumComputing review's *"built in `assets/math/field.js` but is dead code"*
  is what the brief quoted). Three steps: **`3226203` the clone** (every nav2 file byte-copied, every hook renamed `n2*` → `n3*`
  / `green3` / `baby3` because hooks dispatch by NAME across scenes, `main.js` registers it seventh) · **`11cb152` the roll**
  (`nav.js` on `math/field.js`: **log λ = ln ρ + i·2πθ** is holomorphic in c, so the whole continuation is **one complex
  division** `Δc = Δlog λ / (λ′/λ)`, in every component of every period — NAV's `bulbChart` without the twelve bulbs; no BULBS,
  no BABIES, no MISI, no ray grid, `walk2.js` gone; loud → ρ, pitch → θ, the key and the harmony turn it, a section mirrors it,
  and a build snaps θ to the nearest p/q and **crosses the root into the child**, a fallen ladder rolling it back out) ·
  **`e454504` the implosion** (`implode.js`: OUT walks the ball to the root c₀ by `solveMult`'s Newton in (z, c) — **a solver, no
  table** — the Koenigs chart holds and then the **Fatou petals** come up from the orbit's final z, with the coefficient `a`
  MEASURED at the root; EXT puts **c = c₀ + d̂·ε in the EXTERIOR**, `d̂` found by `field.escapes()` in a fan because at a
  satellite root the parent's normal points INTO the child and the exterior is the thin wedge between the two tangent
  components; ε breathes with the beat and the slam, and the shader draws the imploded set as the former interior's ESCAPE).
  Then **`3920fca` the gate** (the drop reads `mapDropEvt` too — §107's rule, a slip that had kept six of nine tracks from ever
  leaving — the full 14-line list with the **12 existing lines unmoved**, the bench, the nine-track table, the thumb, §140,
  `docs/workers/nav3.md`, and the maths credited in `implode.js`, `site/about.html`, README and `THIRD-PARTY.md`:
  Douady–Hubbard, Lavaurs, Shishikura, Inou–Mukherjee).
- **The three retunes, and the three remarks that drove them — each measured BEFORE anything was touched.** This is the whole
  shape of the session after the gate: the user watched NAV3 on 8765, said one sentence, and a ruler was built for that sentence
  before a constant moved. (1) **`44eda55` THE DANCE** — *"the fractal shape doesn't seem to be changing that much (I did see
  something cool around the drops which did line up) but the set doesn't seem to be dancing with the music"*. `dance.mjs` on 18
  windows read NAV3 at **|Δlog λ| .008–.14 per beat against NAV2's .29–1.14** — alive, and ten times quieter than the chart walk
  the eye is used to. The ball moved to the rim (`RHO_LO` .45, `RHO_HI` .955, `RHO_WALL` .985), the springs and gains became a
  beat's (`W_RHO` 9, `W_TH` 5, `GAIN` 12, `VMAX` 3.5 — 4 put the per-frame step over the continuity monitor's .06 with no
  margin), and **THE DANCE** went in, **reactive only** ([[feedback-reactive-over-predicted]]: no `pred*`, no `next*`) — bass /
  kick / hit press ρ, θ turns .1 per bar + sways over the phrase + the snare's 2-and-4 twitch, the kick jump turned ±.9 rad
  alternating. After: **.06–.40 per beat (3–4×)**, the arg swing .34–1.2 rad per bar, the rim 13–62 %. (2) **`08f7c2a` THE
  QUALITY** — *"how to increase the quality of the render? (seems pixelated) sometimes the glow washes out the fractal and is
  hard to see it"*. The q trace found the pixelation was the governor answering the implosion's 420-iteration budget: **NAV3
  .77–.84 on the five implosion windows against NAV2's .91**, and matching NAV2 where it only rolled. The budget now follows the
  governor (`IMP_ITER_MUL` 1.2 × `Q.iter`, cap 320), the convergence radius grows at the rim (**the Koenigs coordinate is an
  invariant, so stopping earlier moves no band**), `P_MAX` 14; and nav3's own exposure in `look2.js` — the smoulder only at the
  very rim, the halo narrowed inside too — with **the exterior knee put BACK to NAV2's** after a first pass that read the edges
  right and dimmed the whole picture (**§99's lesson again: a dim keeps a flat wash flat**). After: q **.884–.924** against
  NAV2's .908–.923, wash **2.9 %** (before 8, NAV2 4), CyborgNinja and Malicious edges 1.5 → 3.7 % and 1.3 → 2.4 % of pixels.
  (3) **`d0da382` THE DEPTH** — *"why does it look like the set is lots of little circles? it doesn't look like the
  mandelbrot/julia fractal?"*, from a recording: a rosette of small flat petals whose outline barely moved over 8 s.
  `periods.mjs` named it: **period ≥ 8 on 23 % of the frames** (55–65 % on three tracks, runs of 16–19 s) and **35–39 % of INT
  frames pinned at the wall** on three more — and the ball WAS moving, which is the trap: in a period-28 child the outline is
  the parent's dynamics and the tiny component's λ moves only its petals. **The home is now the cardioid and its first-level
  bulbs**: `GATE.DEPTH_MAX` **1**, `P_MAX` **7**, a child held `CHILD_BARS` 2 bars once the music stops asking and then rolled
  out of; the press reaches `PULSE_TOP` .965 and **never the wall** (`RHO_HI` .9, the DANCE numbers untouched). The convergence
  radius was the suspect for the flat interior and **the same-frame A/B cleared it** — the band ruler is identical on 6 of 8
  frames and within 1 % on the other two, at period 14 and at period 2 alike; the depth itself was the cause. After: **period
  ≥ 8 on 0 %, ≤ 7 on 100 %**, the wall 0–5 %, the dance held or rose, **q .903–.926 at 60 fps on all nine**.
- **The class is `scene`, and `scenes` is `[6]`.** A new scene with a new id is the plainest `scene` release the file has —
  v0.37's FLUID2 and v0.36's FLUID are the precedents, and nothing else in this release moved: `git diff v0.42..HEAD --
  assets/` is **nine files, eight of them `assets/scenes/nav3/` and the ninth `main.js`'s one registration line**. `decisions`
  is **`["§140"]`**, the bare number only, because `tools/releases.js` line 36 validates every element against
  **`/^§\d+[a-z]?$/`** (§136's finding, paid forward): *"§140 (the depth pass)"* would be a problem, so **the three addenda are
  named in prose** here and in the receipt and live inside §140 where they were written. **Thumbnails: ONE, NAV3, rendered by
  the build and by nothing else** — `tools/whatsnew.js` renders one per listed scene that has `site/thumbs/<name>.jpg`, and
  `site/thumbs/nav3.jpg` came in with the gate commit (verified in the DOM, gate 5).
- **What the entry says, in a visitor's words** (the house voice, no § — `releases.js` refuses one): the title *"The navigator
  that rolls, and a drop that implodes"*, and it leads on the thing that is actually new — *"the navigator you already know
  walks a hand-drawn map… This one carries no map at all. Wherever it happens to be sitting, the shape itself hands it a
  coordinate… and the music steers in that coordinate directly, which means it can be anywhere in the set and still know which
  way is out."* Then the gateway and the crossing (*"the pinch where a smaller bulb is budded onto the one it is in"*), and the
  drop given as what it is — *"at the pinch itself the orbit neither escapes nor settles: it crawls… it comes apart from the
  inside out, and the dust eats inward as the step grows with the slam and fills back in as it shrinks."* The three retunes get
  a paragraph in the user's own terms (ten times quieter than the scene it was cloned from; soft during drops with the glow
  washing it out; wandering deep enough that *"the set stops looking like the set and becomes a rosette of little circles"*).
  **The honest limits close it, as they must:** *"nobody has watched this but me, and the eye it has to convince is at home in
  front of the big screen — that is the whole reason it is on a key of its own and out of the rotation"*; the implosion eats in
  *"much more thinly"* on real tracks than on the test timeline; two songs raise no drop in their window *"and I do not yet know
  which of the two detectors is at fault"*; the cost during a drop, so *"on a weaker machine the governor will soften the
  picture for those few seconds"*; one song still washing out; and **the home navigator on key 3 unchanged by a single byte**.
- **The recipe (§139's ritual step for step, the three-page rule standing, §125's `releases.json` pitfall paid forward a SIXTH
  time).** `package.json` + `assets/core/version.js` 0.42.0 → 0.43.0 **together** (§89 — and `test_rec.js` is the gate that they
  agree: the take came out `retinarave-v0.43-nav2-2026-10-18T17-46-45.webm` with the sidecar reading `retinarave 0.43.0`) ·
  `releases.json` top entry (`v0.43`, **2026-10-18**, class `scene`, the title above, `scenes [6]`, no clip) — **hand-inserted
  as `JSON.stringify(rel, null, 1)`, after proving FIRST that `JSON.stringify(load(), null, 1) + '\n'` == the file byte for byte**
  (38 752 chars / 38 989 bytes, true), the script then re-proving that the **result** round-trips and that the 40 existing
  entries are byte-identical in the tail: a **15-line pure insertion** (`git diff --numstat` **15 added, 0 removed**).
  `releases.js`'s own `save()` would reformat all 41 entries; **it was never called, and the note has now held and cost nothing
  six times running** · `npm run build` (41 entries → `site/whats-new.html` **68 212 bytes**, and `index.html`'s `#newin` line
  moved because the title did; `dist/index.html` **160 modules + 12 in the ears Worker, 269 KB inline, 1 985 044 bytes**) ·
  `node tools/bundle.js releases/retinarave-v0.43.html` (**the same 160 / +12 / 269 KB / 1 985 044**, `VER = '0.43.0'`) ·
  `git rm releases/retinarave-v0.40.html` (the three-page rule; `releases/` keeps v0.41 / v0.42 / v0.43).
- **The frozen page, read against v0.42's** (151 + 12 modules / 1 854 024 bytes): **160 + 12 modules, 1 985 044 bytes.** The
  **+9 modules and +131 020 bytes are nav3's eight files plus the registration**, and **the inline ears Worker is the same
  269 KB because not one byte of the ears moved**. The greps: `EARS_WORKER_SRC` **6 hits** (v0.42's and v0.41's count exactly),
  `idleFluid` **4**, `reads: true` **3**, `nParams: 55246` **2** — all unmoved — beside step 2's and step 3's own
  (`solveMult` 12, `nearestRational` 12, `uImp` 14) and **the depth pass's numbers with their values**: `DEPTH_MAX: 1` ·
  `P_MAX: 7` · `CHILD_BARS: 2` · `RHO_HI: 0.9` · `PULSE_TOP: 0.965` · `RHO_WALL: 0.985` · `VMAX: 3.5` · `GAIN: 12` ·
  `SHARP_IN: 1.6`.
- **The gates, each run on the tree AFTER the bump.** The receipt with every number is
  `tools/accept/v0.43/tag-v0.43-2026-10-18.txt`:
  1. `node tools/check.js` — **162 modules · uniforms 165 · MS keys 223 · scenes 7 (help.feats gaps 0) · 0 fail · 6 warn**,
     exit 0 — **met** (the warns are the line soft caps, far under the 500 fail cap; `scenes/nav3/nav.js` **403** is the new
     one — §140's own item 6, 354 at the gate and 403 after the three retunes — beside `core/fluid/fluid.js` 376,
     `core/scenes.js` 370, `ears/perc.js` 407, `dust/index.js` 365, `torus2/index.js` 367). **`scenes 7`** is id 6 joining the
     register · `releases.js check` **41 entries, top v0.43 == package.json 0.43.0, 0 problems** — **met** ·
     `whatsnew --check` **41 entries, up to date** — **met** · `license.js --check` **165 public files, 0 without the header**
     — **met** (157 at v0.42: nav3's eight public files and `tools/test_nav3.js` carry it).
  2. `npm test` — **exit 0, 40.4 s, 0 FAIL lines** — **met**, run twice with identical output. `test_fluid` **345 ok, 0 fail**;
     `test_music` **151 ok, 0 fail** on the nine tracks in both map modes; `test_loud` **43 pass, 5.79 µs per frame** under the
     40 µs budget; `test_earsw` **OK**; `test_voxscene` **OK** (§138's light budget still .993–1.000 from C3 to C6);
     `test_vox`'s mel and ONNX parities pass and **the stage reads 87.8 µs/hop median (p99 102) against ≤ 100 — met**.
     **`test_nav3` OK, and it is the suite that owns §140**: on the 96 s node drive every frame is finite, the wall holds
     (max ρ **.9790** against `RHO_WALL` .985, 0 frames over), there are **10 crossings** (max period 6, 3004 frames inside a
     child) and **5 exits**, **4 drops → 1580 EXT frames → 4 returns**, the implosion's 340 OUT frames, the petal coefficient
     |a| 5.52e+1 with the layer's escape fraction up to **0.38** and passages up to 4.0 over 879 implosion frames,
     **0 findCycle failures and 0 stalls**, the largest per-frame step **.04731** under the continuity monitor's .06, and
     **.0466 ms per `update()`** in node (NAV2's was .042). **§134's and §126's known misses still print as `note`, never as
     FAIL, and were not re-baselined** (Jamendo-test F1 .825 against the §133 gate's ≥ .84, IBelongHere F1 .814, the mix pitch
     ceiling) — **none of them is this release's: no byte of the ears, `math/vox.js` or `core/` moved.**
  3. `GPU=1 MUTE=1 PORT=8991 node tools/test_rec.js` (the version pair's own gate) — **all ok** — **met**: the sidecar's
     `app/version` **retinarave 0.43.0** and the file name `retinarave-v0.43-…`, the two strings moved together. §92's pin
     still wins (`Q.hold` .75 through the take, free again from q0 .55); webm 16 228 030 bytes, EBML magic, 5.96 s / 8 clusters
     ≈ the sidecar's 6.008, a frame decoded, the HUD on in the DOM, the timeline 2 → 3 → 1 within 0.6 s of the keys.
     **360 frames at 59.9 fps** composited.
  4. the **frozen page from `file://`**, headless, **CLOCK=1 GPU=1 MUTE=1**, PORT 8993 — `test&scene=0` → `{sc 0, grammar pool,
     fluidOn true, idle 0, errs [], bad [], frameN 300}` · `scene=1` → `{sc 1, bands, true, idle 0, …}` · `scene=3` → `{sc 3,
     pool, true, **idle 1**, …}` · `scene=4` → `{sc 4, pool, true, **idle 1**, …}` · **`scene=6` → `{sc 6, pool, true, idle 1,
     errs [], bad [], frameN 300}`** — **`errs []` and `bad []` (`CARD.nonFinite()`) on all five — met.** The four old lines
     are **§139's and §136's to the character, `idle` included**, which is the point for a release that only ADDS a folder; the
     fifth is NAV3's first, and its **`idle 1` is §135 doing its job** — NAV3 declares no read of the fluid substrate, so the
     pool does not step under it. `CLOCK=1` from the first pass (v0.37's pitfall, a sixth time). **`MUTE=1` on every run — no
     audio was played at any point.**
  5. the **no-third-party receipt** (SOCIAL-PLAN §4) — **ONE host on every route** — **met**: `/whats-new` →
     `["127.0.0.1:8993"]` · `/` (`NOAUTO=1 real`) → `["127.0.0.1:8995"]` with `#newin` reading *"New in v0.43: The navigator
     that rolls, and a drop that implodes → what's new"* · `/about` → `["127.0.0.1:8997"]`. The v0.43 article renders
     (`id="v0.43"`, the label **new scene**, **18 October 2026**, the title, the notes line *§140*) and shows **exactly ONE
     thumbnail, NAV3**, which is what `scenes: [6]` means. **The credits were already in place and needed no move at the tag**
     ([[feedback-credit-where-due]]): §140's gate commit put Douady–Hubbard, Lavaurs, Shishikura and Inou–Mukherjee into
     `implode.js`'s header, `site/about.html`, README and `THIRD-PARTY.md` **when the maths was borrowed** — `git diff
     v0.42..HEAD -- site/about.html THIRD-PARTY.md README.md` is +16 lines, all of it that credit. **The user's dev server was
     left running and untouched** — 8765 (this checkout) and 8813 (the nav3 worker's) were the only ports listening in that
     range before and after; every port used here was 8991 / 8993 / 8995 / 8997, and no `serve.js` this session did not start
     was killed.
- **What was NOT run, and why.** The **full `real-md5` roster** and **`accept.sh`**: §140's gate already paid the only sweep
  this release can owe. `tools/scene-md5.sh nav3s3` is the **full 14-line list with the 12 existing lines unmoved to the byte**
  against `v0.39/scene-md5-s135.txt` and `-s138.txt` (s2 `a6c725fa / a12256fd`), and each retune re-recorded **the s6 pair
  alone** (`scene-md5-{dance,quality,depth}.txt`) because a change inside one scene folder cannot move another scene's pixels
  (HARNESS *"What to re-prove"*, row 1) — and `main.js`'s registration, which is row 2 and IS the full list, is what the gate
  commit ran. **Nothing entered the director's rotation** (NAV3 is forced-only, `score()` 0), so **row 5's Q trace is not owed
  and was not run** — a scene with bid 0 cannot be picked, so a trace of it measures nothing. Also not run and not owed: a
  fresh load bench (the gate's `load-bench-nav3.txt` stands), `test_ears --trace`, `fluid-tracks.js`, a director trace, and any
  real-music render. **No reference was re-based here** — the next engine sweep does that, never the tag. **No audio was played
  and nothing was retuned at the tag.**
- **Carried findings — recorded, NOT fixed.** (1) **The user's EYE on NAV3 has not been given**, above all on the depth pass,
  which is the newest of the three retunes and the only one he has not seen a frame of (key `7`, or `#test&scene=6`). (2) The
  implosion's depth on real tracks is **thin** (`escMax` .08, or 0 at deep roots); `EPS`, `EPS_DROP` and `GATE_FRAC` are the
  fake drive's numbers, not retuned per track. (3) **Vienna (85.34 s) and Malicious (148.32 s) raise no drop inside the gate's
  windows** on either detector, so NAV3 never implodes on them; **which of the two maps disagrees with the truth tool is not
  measured** — owed: a `filetrace.js` of `dropLiveEvt / mapDropEvt / dropEvt` over Vienna 71–97 and Malicious 134–160. This is
  the detectors, not the scene. (4) The direction fan finds no exterior at deep roots and the record does not separate *"the
  normal was outside"* from *"the fan fell back"*. (5) Gate passages at q ≥ 3 are beyond any shader budget this engine will
  carry (the finding: the approach is algebraic). (6) `nav.js` 403 lines and `core/fluid/fluid.js` 376, both over the 350 soft
  cap. (7) Vienna 95.5 s was still a flat cyan blob by the edge ruler after the quality pass; the depth pass's `P_MAX` 7 may
  already have taken it, **not re-measured on that frame**. (8) **The older open eyes, carried and not closed here:** §138's
  DUST band on the four voiced tracks, the fluid filling from dark on a director entry into FLUID, the **ear on TheChain's B2**
  (the beat gate stays off, `bpm_grid.hand` provisional), the up-vector sign on TORUS2's strand, and the stale s134 lists on s1.
  (9) `accept.sh`'s routes / params blocks on NAV2, owed since §118.
- **The deploy shape, unchanged — and this is why the tag stays local.** `dist/` is what `npm run build` writes and what
  `wrangler.jsonc` serves; it is git-ignored and not committed, and there is no `.github/` workflow — the deploy is
  **Cloudflare, git-connected to `github.com/tbkraf08/RetinaRave`, building on a push to `main`**. **So the push IS the
  deploy**, and the user's word was *"tag what has been done so far"*: the merge and the tag were done, **nothing was pushed**.
  When the word comes it is **ONE push** of `main --tags`, then poll for the `VER` line, **never a second push** (§115). One
  merge commit (`188734c`), one release commit, then `git tag -a v0.43` — **and stop.** The branch `nav3` was left in place at
  `d0da382` and the sibling worktrees were not touched.
- **Next, in order:** **the user's eye on NAV3, key `7`** — the roll's feel, the petals, the implosion's depth, and above all
  whether the depth pass answered *"lots of little circles"* · the per-track `EPS` retune, once the eye has spoken · the
  Vienna / Malicious drop filetrace · the user's eye on §138's DUST band and his ear on TheChain's **B2** · the user's word on
  the push.

## §142 NAV3 on Comptine — the seven remarks, NAV3-only (2026-10-18, one Fable worker in a worktree, branch `nav3-comptine` off v0.43 `4f1f527`, NOT merged; the user's capture `retinarave-v0.42-nav3-2026-10-18T17-08-55.webm` of NAV3 at d0da382, the analyst's reconstruction `COMPTINE-PASS-PLAN.md` — the offset recording = track + 3.89 s, the sheets, the node replay)

- **The seven remarks, as the plan records them (track time):** 1 — the silence before the music (−3.9 … 0 s): the ball frozen on a
  lumpy set, the exterior ray bands and spokes drifting. 2 — 27 s, 1:21, 1:29, 2:06: circles — clustered orbit sprites, round
  lobes, the period-2 discs of a child crossing, the Koenigs rings. 3 — 32–38 s: a child entered on a loudness rise, the outline
  the parent's, loud read as glow not shape. 4 — 47 s – 1:10: the whole interior painted flat (cyan / pink / orange) through the
  drops. 5 — 47 vs 52 s and the sustain to 1:10 (the drops: engine's — not this branch). 6 — 1:34 / 1:38: a kick jump from the rim
  landing OUTSIDE M, the set a pale wash for .6 s; the section mirror flipping seven times in 110 s. 7 — 1:44–2:00, the early
  crossing at 1:45, the paint again at 1:49–2:05. The user agreed to five NAV3-only picks; `OUT3.ANY`, the re-arm during EXT/IN,
  the reactive ladder drop and the energy hold are branch 2's (the engine's drop work) and are untouched here.
- **The causes (the plan's, confirmed by the replay — `tools/work/nav3/replay.mjs`, NAV3's `updateNav` as pure state through
  `tools/truth/traces/<T>-map0.json`, no Chrome; the nine tracks, `tools/accept/nav3/comptine/replay-cbefore.txt`):** the ladder-rise
  ask crossed **13 times in 110 s on Comptine** (8 of them on the rise; 9–17 on the other tracks, 4–14 of them rises); kick jumps of
  `LEN` .5 × the component's size from a ball at ρ .93 landed the DRAWN c **outside M on 6 of 8** Comptine kicks (12–101 of 19–115
  on the other tracks: the set to dust on a kick); the orbit sprites were on at the rim or in a crossing on **72–98 %** of the
  frames; the petal layer painted every non-escaped pixel at mix .85 for the drop's six seconds (the centre's luma on 47–70 s:
  median .50, p90 .59); idle froze the ball where it was (`if (!idle)`) at ρ .3 and the clock kept .15 of its rate.
- **What moved (every number a constant; `assets/scenes/nav3/` only, NAV2 and the engine untouched):**
  1. **Silence.** Idle (presence < `ROLL.IDLE` .15) rolls the ball to `IDLE_RHO` .08 (= RHO_MIN·4: c ≈ λ/2 ≈ 0, the Julia set a
     circle, Q → 1 by green.js) with the roll's own gain, and the visual clock's floor `T_FLOOR` .15 → **0** — `N.vtime` is what
     `loop.js` takes as the palette / spoke time (`LOOK.time = cur.time`), so at presence 0 the ray bands, the spokes and the trap
     stand still. The gate stays shut while idle.
  2. **The circles.** The critical-orbit sprites draw only with a chart on and ρ under `DOTS_RHO` .85 (off at the rim and in a
     crossing); the child convergence disc's cap `CONV_CHILD` .4 → **.15** × the cycle's spacing. `&n3conv=RIM,R0,MAX[,CHILD[,DOTS_RHO]]`
     — `&n3conv=.6,.93,.05,.4,9` is v0.43's picture.
  3. **Children.** The ladder-rise ask is gone: `GATE.RISE` .1 → **0** (0 = off; the gate guards `RISE > 0`), a crossing needs
     `buildLive ≥ BUILD` or `dropExpectedIn > 0`; `BUILD` .45 → **.7**.
  4. **The petal paint.** The Fatou-petal layer is confined to the petal — mix × exp(−r / (`PET_R`·Rp)) — and its base lightness
     `PET_LUM` .22 → **.08** (`uPet`; `&n3imp=…,PET_LUM` the eighth number).
  5. **The kick jump and the mirror.** The jump is `KICK3.LEN`·(1 − ρ)·size — LEN of the way to the wall ((1 − ρ)·size ≈ the
     distance to the rim), never past it; the section mirror flips only with `keyConf > 0`.
- **The numbers (`tools/accept/nav3/comptine/`).** *The replay, nine tracks, before → after* (`replay-cbefore.txt` / `replay-cafter.txt`):
  crossings Comptine 13 → **5** (all on `buildLive`: 53.4, 83.3, 106.0 s in, 65.3 / 87.8 out), SeeYouDrop 9 → 5, IBelongHere 10 → 0,
  Raindrops 17 → 6, Vienna 8 → 2, WhoLikesToParty 9 → 2, Malicious 14 → 0, TheChain 13 → 2, CyborgNinja 4 → 0 — every remaining
  crossing a build or an expected drop, none a rise; kick jumps landing outside M **6 / 37 / 39 / 27 / 16 / 50 / 12 / 53 / 101 → 0 on
  every track** (the jumps themselves unchanged: 8–119 per track); orbit-sprite frames at the rim **72–98 % → 0 %**; idle frames roll
  to ρ .30 → the circle's target (`IDLE_RHO` .08: TheChain's 189 idle frames read a mean ρ .23 on their way down). *The Comptine
  replay at the seven times* (track time; `replay-cafter.txt`): 0.5 s INT q1 (the opening's presence .88 — the capture's silence is
  before the trace's 0), 27 s IN q1 (back from the 21 s implosion, the sprites off), 33 s INT q1 ρ .84 (no crossing: the 33.0 rise
  ask is gone), 47 s INT q1 ρ .93 (the 46.9 build crossing comes at 53.4 now, `BUILD` .7), 52 s EXT q1 (the 47.5 live arm's
  implosion, unchanged — branch 2), 1:21 INT q1, 1:29 INT q1 ρ .97 (the 92.3 rise crossing is gone), 1:33.8 INT q1 with the kick
  at .74 and ρ .85 — the jump inside M, 1:45 INT q1 (the 105.1 crossing comes at 106.0 on `buildLive` 1.0), 1:49 OUT q7 (the
  107.9 live arm, as before). *The circles' same-frame A/B* (`circles-ab-states.txt`, `tools/work/nav3/circles-ab.jpg`; file mode at
  27 s, 1:21, 1:29, 2:06 — the ball in the cardioid at ρ .79 / .87 / .85 / .53 there): at 1:21 and 1:29 (ρ ≥ `DOTS_RHO`) the only
  pixels that differ are a 50 × 50 patch at the cycle point — the sprites gone, the set identical (the band ruler 4.0 → 3.9 %,
  2.4 → 2.2 %); at 27 s and 2:06 the frames are byte-equal (ρ under the gate, the sprites stay). The child disc's cap (.4 → .15 ×
  the spacing) has no file-mode frame at these times to show (no child there in file mode); it is proven by the replay's
  `eps2` and by the node drive. *The centre's wash* (`lumtrace.js` 2 fps, `lum-{before,after}-Comptine-*`): 47–70 s the centre's
  luma median **.50 → .15** (p90 .59 → .58: the drop flashes), 1:49–2:05 median **.23 → .085**, p90 .56 → .33; the structure score's
  median .0144 → .0111 and .0114 → .0105 (the painted petal wedges were edges too). *The dance* (`dance-cafter.txt`, 18 windows):
  |Δlog λ| .05–.32 per beat, the arg swing .62–1.22 rad per bar, the rim 0–56 %, still 0 % — the depth pass's range held; the
  mid-song windows sit at period 1 on 100 % of frames (nothing asks without a build). *The q trace* (`q-cafter.txt`): **.913–.926,
  60 fps min 60** on all nine windows (NAV2 .908–.923). *The eye:* `tools/work/nav3/comptine-after.jpg` — Comptine 20–130 s at 2 fps
  (lumtrace's sheet, a tile every .5 s). `check.js` 0 fail · `test_field` OK · `test_nav3` OK (8 crossings / 5 exits on the node
  drive) · the s6 pair `tools/accept/nav3/scene-md5-comptine.txt`; the 12 other lines cannot move (a scene-folder change).
- **The knob table.** `&n3roll` as before · `&n3gate=QMAX,TOL,BUILD,RISE,FALL,EXIT_BARS,DIVE,P_MAX,DEPTH_MAX,CHILD_BARS` (v0.43's asks:
  `…,0.45,0.1,…`) · `&n3conv=RIM,R0,MAX,CHILD,DOTS_RHO` (v0.43's circles: `.6,.93,.05,.4,9`) · `&n3imp=EPS,EPS_BEAT,EPS_DROP,PET_K,
  PET_R,T_IN,SETTLE,PET_LUM` (v0.43's paint: `…,0.22` — the confinement has no off switch but `PET_R` 99) · `&n3kick3=LEN,ANG` ·
  `&n3dance`, `&n3drop` as before. New constants: `ROLL.IDLE_RHO` .08, `ROLL.T_FLOOR` 0, `ROLL.DOTS_RHO` .85, `ROLL.CONV_CHILD` .15,
  `OUT3.PET_LUM` .08; moved: `GATE.RISE` 0, `GATE.BUILD` .7; the kick jump's length `LEN·(1 − ρ)·size`; the mirror on `keyConf > 0`.
- **NOT done.** The user's eye on all of it (every number here is a ruler's). Remark 5 whole (the 47.5 false arm, the lost 52.17
  arm, the fixed 8-beat settle through 52 → 70 and 1:49 → 2:05): branch 2 — `OUT3.ANY`, the re-arm during EXT/IN, the reactive
  ladder drop and the energy hold are untouched here, so the drops on Comptine are exactly v0.43's. The silence pick is measured in
  the replay only (the traces start at presence .88; no capture-mode trace of the opening exists) — the roll to the circle and the
  stopped clock are the node drive's and the code's word. The petal confinement is not A/B'd on a Comptine frame (the centre's
  luma is the ruler). `nav.js` is over the 350 soft cap (a warn, as since §140).

## §143 the engine's drop on a delicate piece — the two gates, the energy shift, NAV3's hold, the gesture resume (2026-10-18, one Fable worker in a worktree, branch `drop-piano` off `nav3-comptine` 1e20a18, NOT merged; the user's three remarks on the §142 capture; the analyst's plan `COMPTINE-PASS-PLAN.md` remark 5; `docs/workers/brief-drop-piano.md`, `docs/workers/drop-piano.md`)

- **The user's three remarks (2026-10-18, watching NAV3 on Comptine, verbatim).** *5. "at 47s again (this song is very delicate and the
  energy changes very rapidly) -> 47s looks like a drop, when really should do a drop viz at 52s with energy sustained till 1m10s (a
  little slow (2-4 bars) to detect and show the shift in energy"* · *6. "the visual shift at 1m34 was too harsh for how delicate the
  song was being, there was a big change at 1m38 but song was delicate"* · *7. "… at 1m45 would consider it dropping too early (it starts
  at 1m49 and goes till 2m05 where it starts to pull back)"*. The analyst's reconstruction: the drops that fired on the capture were
  40.8 (v3's dropEvt), 47.5 (the live detector, false), 58.9 (both), 67.4 (v3), 98.57 (v3); the live arm at 52.17 — the one the user
  wanted — was lost because NAV3 was mid-implosion; every implosion held a fixed 8 beats whatever the energy; §113 had already
  counted Comptine's five live arms with 0 confirmed. The user chose: the engine fixes this, for every scene.
- **The measurement (before anything moved; the nine page traces `tools/truth/traces/<T>-map0.json`, the node harness; `tools/work/drop/
  measure*.py`, `subdiag.mjs`, `slamdiag.mjs`).** (a) *Which path armed.* Every one of Comptine's six live arms (41.6, 47.9, 52.2, 61.1,
  82.8, 98.8 s) was the SUB-VOID path (§64) — hp's 5 s mean 0.00–.06, the bass ratio .70–1.19 (no void), and the causal sub gate's 2 s
  mean AND its 32 s mean at **0.00**: a piano has no sub, and the path counted a sub that was never there as having LEFT. The dance
  tracks' sub-void arms read 32 s means of .62–.98 (SeeYouDrop .94, WhoLikesToParty .78, Vienna .62 / .87, Raindrops .63–1.0, TheChain
  .74–.89). (b) *What a confirmed slam has.* After every confirmed live slam the ears' causal sub gate opened within .25 s (SeeYouDrop
  ×2, WhoLikesToParty ×3, Vienna 85.3, Raindrops 68.6, IBelongHere 179.9: max 1.00 by +.25 s) and the loudness ladder (math/loudlight
  `baseLight` on `loudRel` — the track's own 3 s loudness over the range it has shown, every scene's base light) stood at **.53–.99**
  within a beat; after the false slams the gate never opened (IBelongHere's breakdown 157.3 / 166.9: 0.00 through +2 s; every piano slam)
  or the ladder sat at **.17–.38** (TheChain 86.9, a kick in a quiet passage; Raindrops 129.5, a fill). (c) *The ladder's RISE* (the
  brief's first-named witness): at the confirmed slams the slow ladder read +.16 … +.52 over the bar before and the false ones −.48 …
  +.10 — but the fast ladder (loudM, 400 ms) read **+.34** on TheChain's quiet kick and **−.61** on Vienna's drop (the window straddles
  the slam), the slow one **−.33** on Raindrops' drop after its gap (the window is full of the gap): no rise rule separated what the sub
  and the level did, so the rise is not a knob. Comptine's 47.5 (−.48) against 52.17 (+.52) is what the shift stage reads.
- **Item 1 — the false drops at the source (`engine/build/build.js`, `confirm.js`, `feed.js`, `features.js`).** `BUILD.SUBV_HAD` .3: the
  sub-void path arms only when the causal gate's 32 s mean is at or above it. `SUB_BACK` .5 / `LEVEL` .5 / `PEND` 4: once the bass
  confirms the onset (§54's rule, unchanged), the slam is PENDING in `build/confirm.js` until the sub gate is back and the ladder at a
  drop's level — released on that frame (the same frame when both already hold), dropped after PEND beats without them with the arm
  kept. `LEVEL_RNG` 4 LU: the level test applies once the track has shown that much range — a mid-track start (`&at=`, a seek)
  restarts the loud stage with the §67 warm-up guard holding `loudRel` near .8 and `loudRange` growing from 0 (measured: Comptine from
  36 s reads .28 → .58 across 48–53 s where the whole-track ladder reads 0 → .9). With the loud stage off (`&loud=0`, `loudAbs` −1) the
  level test passes: the pre-§143 slam, the A/B. **v3's `dropEvt` takes the same confirmation** (features.js `dropCand` → `Confirm` →
  `dropFire`: the strength, the envelope, the refractory and the arc's `build` reset land on the release frame; a resume clears it;
  with `loudAbs` < 0 — node's v3, the fake — the candidate fires at once, so parity fake cannot move). *Node, whole tracks (`tools/work/
  drop/slams-final.txt`, `v3-final.txt`; the live slams before → after against windows.json):* SeeYouDrop 2/2 → 2/2 (57.60 → 57.65,
  105.62 → 105.67) · WhoLikesToParty 3/3 → 3/3 (+.08 / +.37 / +.18 s) · Vienna 1/2 → 1/2 (85.33 → 85.40) · Raindrops 68.6 kept, **129.52
  gone** · IBelongHere 179.88 kept, **157.25 / 166.87 gone** · TheChain **86.92 gone** · Comptine 42.93 / 45.13 (node's) **gone, 0 arms but
  127.6** · Malicious / CyborgNinja 0 / 0 — **every confirmed slam kept, 5 false → 0, the release 50–370 ms later** (the sub gate opening).
  v3's drops: every truth hit kept (SeeYouDrop 2, IBelongHere 3 — now +.8 / +.3 / +1.3 s late, Raindrops 3), 15 false → 5 (Comptine's
  six gone — 21.0 among them, the tool's provisional 21.5 the user never named; Malicious' three intro hits and TheChain's 8.3 / 171.1
  stay: a sub and a loud level are there).
- **Item 2 — the energy shift as an engine field (`engine/shift/shift.js`, `features-shift.js`, after 'build').** `shiftEvt` fires when the
  ladder is `STEP` .3 above its value `BARS` 1 bar ago (a `BeatRing` of one sample per frame, read by beat) AND at or above `LEVEL`
  .75, after `MIN_HIST` 4 s of music, `REFR` 2 bars after the last shift or confirmed drop (`dropLiveEvt || mapDropEvt` levels the hold
  itself — a slam IS a shift, never doubled), and never while the live detector is armed (`ARMED` 1 — SeeYouDrop's riser read +.33
  a bar before its slam, Vienna's dream +.3 three seconds before: the slam names those). `shiftHold` is 1 from the shift while the ladder
  stays at or above `HOLD` .5 × the level it stepped to, 0 once it has sat under that line for `REL` .5 bar, or in silence (`PRESENT`
  .15). Reactive, about a bar late by the 3 s window — the user: "sooner is better". **The level, three times:** `STEP` alone chained
  NAV3's implosions on Comptine into one 50 s exterior (steps 0 → .3 at 31.9 / 42.7 / 81.8 / 89.8, each a re-arm); `LEVEL` .5 still fired
  the four-second swells (44.4 at .56, 90.5 at .69 — the user's "too harsh at 1:34", 101.9 at .53); .7 fired the 1:34 swell on the
  whole-track page trace (.711); **.75** sits .04 above the loudest swell and .11 under the softer drop (the whole-track page ladder:
  the drop at 52 peaks .93, the 1:49 one .86, the opening's 34.5 s .79; the swells .54 / .71 / .54). *The page, whole track, Comptine
  (`tools/work/drop/page/Comptine-after.json`, the live lanes from 0; the replay = the page to the frame):* shifts **32.98, 51.72, 111.30,
  120.67 (a re-level inside the hold), 135.38**; holds **33.0–36.9, 51.7–67.0, 111.3–125.0**, 135.4–end; nowhere in silence; no live
  arm but 128 s, no slam, no v3 drop. The user's 52 → 51.7; "energy sustained till 1m10" → the hold to 1:07 and NAV3's 8-beat settle to
  1:11; "it starts at 1m49" → 1:51.3 (2.3 s, one bar at Comptine's heard 109 BPM — the 3 s window); "till 2m05 where it starts to pull
  back" → **the hold ends at 125.0 = 2:05**. The eight other tracks (0–110 s traces, `shift-final.txt`): SeeYouDrop / WhoLikesToParty /
  Vienna / Raindrops / CyborgNinja **none**, IBelongHere 65.9 (its 64.7 drop, which the live detector never finds — a gain for live
  mode), Malicious 68.9, TheChain 44.7 / 55.3 (the loud section; its truth drop is 199.7). `feats.js` entries, `state.js` defaults,
  `sources/fake.js` runs the same `Shift` on its mirrored ladder (the loud stage's convention), `tools/test_shift.js` in `npm test`
  (34 checks), the node harness runs the loud stage (`build-node.js`, page = node on `loudRel` to 6e-4).
- **Item 3 — NAV3 reads it (`assets/scenes/nav3/` only; NAV2 byte-untouched).** `OUT3.ANY` 1 → **0** (v3's `dropEvt` no longer fires the
  implosion — NAV2 never read it, four of Comptine's false drops came in by it; `&n3drop=any` restores it; the fake timeline leaves on
  its own shift now). The drop = `dropLiveEvt || mapDropEvt || shiftEvt` (`DROP_REFR` 4 beats as before). `HOLD` 1: EXT holds while
  `shiftHold` is 1 and the `SETTLE` 8 beats count from the hold's last beat; `HOLD_MAX` 32 beats the hold's own cap (without it every
  dance-track drop held to the 48-beat `PEAK`, 19–25 s: a drop section stays up for a minute; Comptine's 52 → 1:07 is 27 beats); PEAK
  and silence still end it. `REARM` 1: a drop or shift during OUT / EXT / IN re-arms (`rearm()`: beat0 and the hold reset, the slam's own
  ε pulse `IMP.slam` decaying over `SLAM_T` 2 beats in the `EPS_DROP` term, IN turned back into OUT from where c is — `st.start`, so no
  jump) instead of being discarded. The §142 kick jump and mirror unchanged. *The Comptine replay (`tools/work/drop/replay3.mjs`
  through the 0–110 s trace; before = v0.43's reads):* **7 implosions → 2** — before 21.0, 40.8, 47.5, 58.9, 67.4, 98.6, 107.9, each a
  fixed 8 beats; after 32.9 → 43.9 and **51.4 → 72.1 (EXT 52.8 → 70.9)**, nothing at 47, nothing at 1:34 / 1:38 / 1:45. The page's
  own record and the 1:49 → 2:05 hold: the page's own record (`tools/work/drop/n3rec.mjs`, CLOCK=1 scene 6 from 0 — file mode, so the map's one line at 107.37 is on; `tools/accept/drop/n3-page-comptine-s143.txt`): **3 implosions in 132 s — 33.0 → 42.2, 51.7 → 72.1 (EXT 53.1 → 70.9), 107.4 → 129.6 (the map's line, EXT 108.8 → 128.4, the hold to 2:05)**; at 47 INT (ρ .74), at 52 OUT, 58.9 / 66 EXT held, 70 EXT settling, 94 / 98 / 105 INT, 109 / 112 / 120 EXT held, 125 the hold off, 130 INT; errs [] bad []. The 2 fps eye strip `tools/work/drop/comptine-after.jpg` (40–130 s): the ball inside through 47, the set imploding at 51.5–53, the exploded pinwheel held to 66, back inside by 72.5, out again 107.5–129.5, inside at 130 — the 1:34 / 1:38 / 1:45 tiles show the ball rolling inside; the luminance ruler reads 0 clipped frames, median Y .104 (§142's .149 — less exterior wash). *The other eight (the node replay, 0–110 s):* SeeYouDrop 57.6 → 75.2 (EXT 15 s: the
  32-beat cap + the settle) and 105.6; WhoLikesToParty 57.5 → 79.7; Vienna 85.3; IBelongHere 65.8 (on the shift; v0.43's 64.5 was v3's);
  Malicious 68.9 (the shift; v0.43's three intro implosions 12 / 18.8 / 25.7 are gone); TheChain 44.7 + 55.3 (a re-arm) and 86.1;
  Raindrops 129.5 (the page trace's pre-§143 slam, gone on the page after); CyborgNinja none.
- **Item 4 — the gesture resume (`engine/audio.js`, the orchestrator's add).** On a fresh origin Chrome keeps a new AudioContext
  suspended until a gesture; `initAudio()`'s `resume()` is a no-op without one and only `sources/mic.js` resumed on its own gesture —
  a file-mode track on a new port (8813 tonight) ran the clock and played no sound. `GESTURE_RESUME` 1: one document-level
  `pointerdown` / `keydown` listener (capture), removed the moment it fires, that resumes the context when it is not running. No pixel
  reads it: headless cdp runs with the autoplay flag and never fires it — the md5 lines below cannot move by it.
- **The gate.** `check.js` **0 fail** (6 warns, the pre-existing soft caps) · `npm test` **exit 0** — test_build 38 pass, **test_shift OK** (34), test_nav3 OK, test_fluid 345 ok, test_music 151 ok, the rest OK (every suite OK once the worktree has
  the main checkout's untracked `tools/truth/traces/` and `tools/work/vox/` — see the pitfall in HARNESS) · the md5 list `PORT=8815 tools/scene-md5.sh s143` (`tools/accept/drop/scene-md5-s143.txt`): **the 12 lines s0–s5 = `tools/accept/nav3/scene-md5-step3.txt` to the byte** (no scene but NAV3 reads the fields; the fake's `dropEvt` is written by fake.js itself and v3's gate never runs on the fake; the gesture listener never fires headless), **s6-f360 = §142's `4ac1d5fe`**, **s6-f840 moved `2c703f67` → `aaa34ba3`**: NAV3 no longer reads the fake's dropEvt and its own shift on the fake lands at 25.45 s (the fake's ladder needs a loop of history), so the 14 s frame shows the ball still rolling, not the implosion — the IDS=6 pair re-run after the fake fix gave the same two hashes; errs [] hop 840 row 72 on all seven ids ·
  the director `tools/director-trace.sh s143 house` / `aba` (`tools/accept/drop/director-*-s143.txt`): the scene ids picked are **0 / 2 / 4 only** — NAV3 (6) never (its bid is 0: the §93 roster unchanged); `q-trace.sh s143 house aba`: house q mean **.97 / .97 / .97** (min .55 on the load), aba **.98 / .98 / .58** — the third aba run dipped to .14 in its last window with nothing of this branch on screen (the user's desktop Chrome loads every trace; the two others read 1.00 there) · the q trace `tools/work/nav3/q-all.sh s143 6` (the nine drop windows, NAV3 forced, real time on the GPU; `tools/accept/drop/q-nav3-windows-s143.txt`): **q .912–.921, fps mean 60 min 60 on all nine**, errs [] — the held exterior costs nothing the governor sees (§142 read .913–.926) · parity fake **`MS parity: every field identical to 1e-9`** (`tools/accept/drop/parity-fake.jpg`) · the strips `tools/work/drop/comptine-after.jpg` (Comptine 40–130 s at 2 fps, 181 tiles, 0 clipped) and `tools/work/drop/seeyoudrop-after.jpg` (45–80 s: the ball inside to 57.5, the way in at 58, the exploded set held 59–74, back by 78 — nothing lost).
- **The per-track table (the whole tracks on the page, the live lanes; before = the 0–110 s traces / §113 / the node harness):**
  (`tools/accept/drop/per-track-s143.txt`, `tools/work/drop/table.mjs`; live = `dropLiveEvt`, v3 = `dropEvt`, the page's live lanes; ·n = the node harness past the 110 s before-traces; the shift column is re-derived from the after-traces at the shipped knobs — replay = page; NAV3 = `replay3.mjs` through the traces: implosions start → end)

  | track | truth | live before → after | v3 before → after | shifts · holds | NAV3 before → after |
  |---|---|---|---|---|---|
  | Comptine | 21.5 31.5 41.5 (the tool's, provisional) | 47.5 52.2 58.9 107.9 (4 false) → **none** | 21 40.8 58.9 67.4 98.6 129 (4 false) → **none** | **33.0 51.7 111.3 120.7 135.4** · 33–36.9, **51.7–67.0**, **111.3–125.0**, 135.4–end | 7 (8 beats each) → **4: 33→42, 51.7→72.1, 111.3→129.6, 135.4→end** |
  | SeeYouDrop | 57.6 105.6 | 2/2 → **2/2** (+50 ms) | 2/2 → 2/2 (+70 ms) | none · the slams' hold 57.6–134.7 | 57.6→62.4, 105.6→110 → 57.6→75.2, 105.7→123.2 |
  | IBelongHere | 15.9 64.7 129.8 178.9 | 157.3n 166.9n 179.9n (1/4, 2 false) → **179.6 (1/4, 0 false)** | 64.5 130n 178.3n (3/4) → 65.3 130.4 179.7 (3/4, +.8/+.4/+1.4 s) | **65.8 130.7 180.4** (the three drops the live detector misses, 1.1–1.5 s late) · 65.8–123.4, 130.7–148.8, 180.4–214.3 | 1 (64.5, v3's) → **3** on the shifts |
  | WhoLikesToParty | 57.5 131.4 188.8 | 3/3 → **3/3** (+.1/+.4/+.2 s) | 0/3 → 0/3 | none (never a shift: its range 2.9 LU) | 1 → **3** (every slam, 32 beats each) |
  | Vienna | 85.3 106.7 | 1/2 → 1/2 (+70 ms) | 73.3 (false) → **none** | 185.7 · 85.4–end | 73.3 (false), 85.3 → 85.4→112.0, 185.7 |
  | RaindropsOnRoses | 41.1 68.6 137.1 | 129.5 (false) → **none** | 3/3 → 3/3 (+.1 s) | **26.0** · 26.0–114.3 (the 5.0 s cold-start shift gone with MIN_HIST 16) | 41.1, 68.6, 129.5 (v3's, v3's, false) → **26.0→44.5** (the first chorus; the 41.1 / 68.6 drops are v3's and the map's — in live mode NAV3 no longer sees them) |
  | Malicious | 148.3 | 0/1 → 0/1 | 12 18.8 25.7 (3 false) → 12.3 19.7 25.9 (3 false, +.3 … +.9 s) | 68.9 · 68.9–113.7 | 3 (v3's intro hits) → **1: 68.9→87.3** |
  | TheChain | 199.7 | 86.1 (false) → **none** | 8.3 86.1 171.1n 186.2n (4 false) → 8.3 171.1 (2 false) | 44.7 55.3 121.6 131.4 **202.7** (the truth drop, 3 s late — the live detector never arms there) · 44.7–83.1, 121.6–175.0, 202.7–258.8 | 8.3, 86.1 (both false) → 44.7→72.6 (1 re-arm), 121.6→148.8 (1 re-arm), 202.7→219.7 |
  | CyborgNinja | — | 0 → 0 | 0 → 0 | none | 0 → 0 |

  Read: **no confirmed live slam lost on any track and 0 false live slams on all nine** (was 8: Comptine 4, IBelongHere 2, Raindrops 1,
  TheChain 1); v3's truth hits all kept at +50 ms … +1.4 s, its false drops 15 → 5; the piano's drops are gone from both detectors and
  the shift carries its two (and its 33 s one, the tool's own 31.5 truth); the shifts on the dance tracks sit on the drops the live
  detector misses (IBelongHere ×3, TheChain's 199.7) or on loud sections (TheChain 44.7 / 55.3 / 121.6 / 131.4, Malicious 68.9,
  Raindrops 26.0, Vienna 185.7). NAV3's exteriors run 32 beats + the settle where the energy holds (15–22 s) against 8 beats before.
- **The knob table.** `BUILD.SUBV_HAD` .3 · `SUB_BACK` .5 · `LEVEL` .5 · `LEVEL_RNG` 4 · `PEND` 4 (`BUILDK='{"SUB_BACK":0}'` in node;
  `&loud=0` = no level test on the page) · `SHIFT.STEP` .3 · `LEVEL` .75 · `BARS` 1 · `HOLD` .5 · `REL` .5 · `MIN_HIST` 4 · `REFR` 2 ·
  `PRESENT` .15 · `ARMED` 1 · `DROP_LEVELS` 1 (`CARD.ENGINE.SHIFTK.LEVEL = …` live; the replay's `--set`) · `OUT3.ANY` 0 (`&n3drop=any`) ·
  `HOLD` 1 · `HOLD_MAX` 32 · `REARM` 1 · `SLAM_T` 2 (`&n3imp=EPS,EPS_BEAT,EPS_DROP,PET_K,PET_R,T_IN,SETTLE,PET_LUM,HOLD,REARM,HOLD_MAX` —
  `…,0,0` is v0.43's settle and discard) · `audio.js GESTURE_RESUME` 1.
- **NOT done.** The user's eye on all of it. The page's own NAV3 record exists for Comptine and SeeYouDrop only (the seven others are the node replay through their page traces). The shift's LEVEL .75 is fitted
  on Comptine with its margins stated (.04 / .11); TheChain's 44.7 / 55.3 and Malicious' 68.9 shifts are real loud sections, not the
  user's drops — whether NAV3 should implode there is for the eye. IBelongHere's three v3 drops now land +.8 … +1.3 s late for the
  scenes that read `dropEvt` (TORUS2, FLUID2) and its 64.7 drop reaches NAV3 1.1 s late on the shift (the live detector still misses
  it, 1/4). The release lag of 50–370 ms on the live slams is the sub gate's opening. The shift and the level test need the track's
  loudness history: a `&at=` start mid-track is cold for ~20 s (friction 4) — in live mode the stream runs from the start of listening.
  DUST / TORUS2 do not read the fields (the user's word). Appendix A is stale against feats.js on nine rows (`tools/feats-doc.js`
  regenerates them; reverted here to keep the diff its own). `nav.js` and `implode.js` are inside the caps (407 / 262 lines, the warn as
  since §140).

## §144 NAV3's look on Comptine — the hold's interior, the jitter, the kick blink, the palette (2026-10-18, one Fable worker in a worktree, branch `nav3-look` off `drop-piano` a50410e, NOT merged; the user's two captures of NAV3 on Comptine; the analyst's `COMPTINE2-PASS-PLAN.md` with its `sim2.mjs` / `ruler.py`; `assets/scenes/nav3/` only — no engine, NAV2 or core byte moved)

- **The user's remarks (verbatim).** Branch 1 (`nav3-comptine`): *"a fractal pattern starts at 8s -> the shape looks cool but the movement is too
  quick and jittery for the music (especially around 13s-15s)"* · *"at 18s, 26s the fractal is washed out and can't see it"* · *"1m34s the fractal
  shape is washed out"* · *"from 1m38s the spirals around the set look like they loop (ie. moving all the way and cutting back to starting point)
  -> spiraling should be smooth"*. Branch 2 (`drop-piano`): *"I don't like what happens to the set at 34s-42s, 52s-1m9s, 1m48-2m8s -> there seem
  to be blobby artifacts, the interior color is weird (should it be black on interior here?), the shape of the set stops changing."*
- **The causes (the plan's, each confirmed by the replay or a frame ruler before anything moved; `tools/accept/nav3/look/`).** (1) *The jitter:*
  the §140 dance on a piano — `DANCE.BASS` .6 × bass (the left hand IS bass), the kick / hit press on ρ with `W_RHO` 9 and `GAIN` 12, `SWAY` .18
  turns per phrase: the replay read **|Δlog λ| .535 per beat on Comptine against .32–.49 on the dance tracks**, 5.4 ρ-reversals/s. (2) *The kick
  blink:* every kick (`k > .02`) hid the chart (`nav.js` `N.cyc.has = 0`) for the ring's .4 s — **chart-off on 13.6 % of Comptine's INT frames
  (23 % with the map), 11–66 % on the others** (CyborgNinja 66): the interior blinked black on every piano attack, the 1:34 "washed out" is one
  of them. (3) *18 s / 26 s:* `pal()`'s luma is a tenth as bright in blue as in green and the interior's bands were `pal(…) × (.03 + .16·bands·…)`
  with no luma normalisation — the before frames read **26 s: black 57 % of the frame (centre 57 %) at rim hue 295°** (violet: the bands under
  Y .04), 18 s: wash 11 %, structure .83. (4) *The hold's blobs and the weird interior:* in EXT ~96 % of the former interior does not escape inside
  the budget (esc ≤ .04 at ε₀/size .004 on B's roots), so the shader painted those pixels with the Fatou-petal layer at mix .85 (`max(uImp.x,
  uImp.y)`) — in the imploded set nothing attracts and z_final sits anywhere on its loop, so the paint landed on preimage blobs lit by a
  meaningless Fatou phase; the .03 base + the line trap filled the rest; v3's `dropEnv` pumped ε through `EPS_DROP` on every v3 hit (esc 1.0 at 59
  / 68 s). (5) *The sweep-and-snap:* `pal(.55 + .07·pl + .3·uSig)` on every escaped pixel with σ = frac(π/√ε) and ε a per-beat sawtooth — σ wraps
  9× a beat. The 60 fps ruler on the deterministic page (`look-hue.py`, the far-exterior annulus's circular-mean hue): EXT 36–38.5 |Δhue| median
  1.21° p90 2.78° with **sign reversals on 59 % of frames**, 56–59 median .85° p90 4.99° max 19.8° reversals 47 %, against the INT control's
  .84° / 1.83° / reversals 16 % — the sawtooth (the plan's 4.1° / 16° / 39° were the recording's 36–48 fps frames). (6) The orbit head dot: the
  white comet at 15.7–21.7, 47, 50, 74, 105 s (INT at ρ < `DOTS_RHO`).
- **What moved (every number a constant in `assets/scenes/nav3/`, v0.43's reachable by the knobs below).**
  1. **The hold's interior (`implode.js`, `shaders-v2.js`).** `OUT3.BLACK` 1: a non-escaped pixel with no chart is BLACK while the implosion is up
     (OUT past the chart, EXT, IN), the petal layer weights `uImp.x` (the way in) instead of `max(x, y)`. **ε₀ is calibrated per drop** —
     `ESC_FLOOR` .3 / `ESC_TOP` .8: two bisections in log ε (`ESC_STEPS` 8 inside [EPS/`ESC_SPAN` 4, EPS·4] × size, `layer()` as the ruler, along
     the sweep's middle) give ε_lo where the former petal's escape fraction is .3 and ε_hi where it is .8; the hold walks between them by the
     ENERGY `drive` = `HOLD_LOUD` 1 × the loudness ladder (eased `HOLD_TAU` 1 s) + `EPS_BEAT` .25 × the beat profile's crest (move2.js `M2.crest`:
     continuous, 1 on the line, 1.5 on the downbeat — the sawtooth is gone) + `EPS_DROP` 1 × the slam's own pulse (`IMP.slam` 1 at the drop and at
     a re-arm, over `SLAM_T`), ε = ε_lo·(ε_hi/ε_lo)^min(drive, `DRIVE_MAX` 1.6). Why calibrated and not ×4: the scan (`look-replay.mjs SCAN=1`)
     read the fraction as a CLIFF whose place is the root's — a cusp root goes .00 → .96 between ε/size .008 and .016, a q 4–7 root needs .03–.06
     for .3 — so one `EPS` .016 was dust at Comptine's 34 s root and a black blob at its 53 s root. `EPS` .016 is the bracket's centre (was .004);
     the `reach` param is a constant −6 now (its old route, .55 eS + .5 tension + 1.5 dropEnv, double-counted the energy the ladder carries and put
     a dance track's whole former interior to dust). **The dropEnv leak is closed:** v3's envelope reaches ε only with `&n3drop=any`.
  2. **What moves in a long hold.** (a) the depth follows the ladder (above); (b) **the direction sweeps the exterior wedge**: at the drop the wedge
     [aLo, aHi] around the fan's direction is probed with `escapes()` at ε₀ and 4ε₀ (`WEDGE_STEP` .02 rad, up to a half turn each way), and in EXT
     the direction is the wedge's middle + a sine of `TURN_BARS` 4 bars with the half-sweep min(`TURN_MAX` .5 rad, (1 − `TURN_MARGIN` .15) × the
     half-width) — a cusp root sweeps ±.3–.5 rad, a satellite root ±.03 (its wedge is .06 rad): Lavaurs' phase changes with arg ε and the
     imploded set morphs continuously. `IMP.phi / wedge / loudE / eps0 / epsHi / drive` in `n3info().imp`.
  3. **The jitter (`nav.js`).** Every DANCE term is × the PERCUSSIVENESS scale s = clamp(perc / `PERC_REF` .33, `PERC_MIN` .2, 1), perc the engine's
     onset-envelope spikiness eased over `PERC_TAU` 3 s (`N.percE / percS`); the bar turn ACCUMULATES at the scaled rate (`N.turn`, not TURN × N.bar —
     the product would jump with s); the kick jump's length too (`KICK3.PERC` 1). **Which field, and the nine numbers** (`look/perc.txt`, the 0–110 s
     traces' means): **perc** — Comptine **.100** · Malicious .164 · Raindrops .261 · SeeYouDrop .263 · Vienna .304 · IBelongHere .359 · TheChain .567
     · CyborgNinja .649 · WhoLikesToParty .750 → the scale Comptine **.30**, Malicious .50, SeeYouDrop / Raindrops .80, Vienna .92, the rest 1.
     `punchy` is NOT it: the crest factor of a solo piano reads **.248 against SeeYouDrop's .068** (Raindrops .128, Vienna .157).
  4. **The chart through the kick (`nav.js` `KICK3.CHART` 1, `N.shown`).** While the kick rings the DRAWN c is off the ball, so its chart is found on
     its own — `findCycle` at `N.c` each frame (`N_ITER`, the same period), published with the rim-scaled convergence radius, uploaded by index.js as
     `N.shown` — the Koenigs bands tighten toward the rim with the jump; a drawn c findCycle cannot name draws none (v0.43's blink). The ball's chart
     is untouched.
  5. **The palette (`look2.js`, `shaders-v2.js`).** `pal3(t)` = `pal(t)` × min(`PAL3.Y` .5 × uPal.w / luma, `PAL3.MAX` 4): the interior's bands
     (`base` and the smoulder) at one luma whatever the hue — blue ×4 (Y .07 → .29), green ×.7; the drum, the trap and the exterior keep `pal()`.
     `LUM_IMP` (.3, 2.5): the exterior's knee while the implosion is up (mixed by uImp.y; was LUM_EX's .45).
  6. **Assumed.** `SIG_TINT` 0 (σ off the exterior layer's and the petals' hue; `IMP.sig` still computed) · `EPS_BEAT` on the crest (above) · the
     orbit dots: `params.dots` from() → 0 (draw() skips at 0; route it on with `&param=nav3.dots=c:1.5`).
- **The knob table.** `&n3imp=EPS,EPS_BEAT,EPS_DROP,PET_K,PET_R,T_IN,SETTLE,PET_LUM,HOLD,REARM,HOLD_MAX,HOLD_LOUD,TURN_BARS,TURN_MAX,SIG_TINT,BLACK,
  ESC_FLOOR,ESC_TOP` — **v0.43's hold: `&n3imp=0.004,0.5,2,0.03,1,1.4,8,0.08,1,1,32,0,0,0.5,0.3,0,0`** (ε₀ .004 uncalibrated, the linear breath,
  no ladder, no sweep, σ on, the petals both ways) · `&n3dance=BASS,KICK,HIT,TURN,SWAY,SNARE,PERC_REF,PERC_MIN,PERC_TAU` (v0.43: `…,0.08,0` — the
  scale off) · `&n3kick3=LEN,ANG,PERC,CHART` (v0.43: `.5,.9,0,0`) · `&n3pal3=0` (pal(); `=Y,MAX`) · `&n3lum=L0,K,L0x,Kx,L0i,Ki` (v0.43: `…,.45,1.5`)
  · `&n3drop=any` (v3's dropEnv back in ε) · `&param=nav3.dots=c:1.5` (the dots). New: `OUT3.ESC_FLOOR ESC_TOP ESC_SPAN ESC_STEPS DRIVE_MAX HOLD_LOUD
  HOLD_TAU TURN_BARS TURN_MAX TURN_MARGIN WEDGE_STEP SIG_TINT BLACK`, `DANCE.PERC_REF PERC_MIN PERC_TAU`, `KICK3.PERC CHART`, `look2.LUM_IMP PAL3`;
  moved: `EPS` .004 → .016, `EPS_BEAT` .5 → .25 (on the crest), `EPS_DROP` 2 → 1 (on the slam), `reach` → −6. `feats` + `perc`, − `tension`.
- **The numbers.** *The nine-track replay* (`look-replay.mjs`: `updateNav` as pure state through the 0–110 s live-lane traces with §143's shift and
  SUBV_HAD; `look/replay-{before,after}.txt`; INT frames only for the dance columns):

  | track | \|Δlog λ\|/beat | ρ-rev/s | chart-off % | crossings | implosions (esc min/mean/max over the hold) |
  |---|---|---|---|---|---|
  | Comptine | .535 → **.246** | 5.4 → 5.3 | 13.6 → **0** | 0 → 0 | 2 → 2: 33.0→43.9 (.00/.01/.04 → **.13/.66/1.0**), 51.7→72.1 (.00/.51/1.0 → **.00/.71/1.0**) |
  | Comptine (map) | .556 → **.252** | 4.9 → 4.8 | 23.0 → **0** | 0 → 0 | 3 → 3: + 107.4→ (.00 → .00/.78/.96) |
  | SeeYouDrop | .382 → .282 | 3.9 → 3.5 | 23.6 → 0 | 3 → 3 | 2 → 2: 57.6→75.2 (.00 → .33/.71/1.0), 105.6→ (.04 → .85) |
  | IBelongHere | .361 → .306 | 3.7 → 3.6 | 31.0 → .1 | 0 → 0 | 1 → 1: 65.8→87.7 (.06 → .38/.58/.63) |
  | Raindrops | .399 → .392 | 3.6 → 3.3 | 28.5 → 0 | 6 → 10 | 1 → 1: 129.5→ (.04 → .54/.79/.96) |
  | Vienna | .490 → .415 | 4.2 → 4.0 | 11.2 → 0 | 1 → 1 | 1 → 1: 85.3→ (.00 → .33/.67/1.0) |
  | WhoLikesToParty | .419 → .421 | 5.5 → 5.4 | 46.6 → .1 | 2 → 2 | 1 → 1: 57.5→79.7 (.00 → .00: a q 7 root, no escape inside the budget at any ε of the bracket) |
  | Malicious | .361 → .262 | 4.8 → 4.0 | 13.7 → 0 | 0 → 0 | 1 → 1: 68.9→87.3 (.15 → .21/.67/1.0) |
  | TheChain | .355 → .364 | 3.8 → 3.7 | 40.2 → .2 | 2 → 2 | 2 → 2: 44.7→72.6 (.00 → .29/.69/1.0), 86.1→90.8 (.00 → .42/.77/1.0) |
  | CyborgNinja | .321 → .311 | 4.0 → 4.1 | 65.7 → .2 | 0 → 0 | 0 → 0 |

  Read: Comptine's dance at **.25 per beat** (half; inside the dance tracks' .26–.42 now), the dance tracks within 0–26 % of before (SeeYouDrop and
  Malicious the most, at scales .8 / .5); the ρ-reversal count barely moves on any track — it counts the spring's sign changes, not their size, and
  the dance tracks read 3.3–5.4 too, so it was never the piano's discriminant; **chart-off 11–66 % → 0–.2 %** on all nine (the .1–.2 % = kicks whose
  drawn c findCycle could not name); the holds' escape fraction **.00–.04 → a floor of .13–.54 and a mean of .58–.79** on every root but
  WhoLikesToParty's. The implosions' times are §143's to the frame (the shift and the hold are the engine's; the roots differ where the dance's
  path differs). *The frame rulers* (`look-ruler.py` on the deterministic page from 0, `look/frames-{before,after-peek}.txt`): **18 s** black 15 → 12 %,
  structure .83 → .96; **26 s** black **57 → 39 % (centre 57 → 13 %)**, structure .60 → .91, the violet bands legible; **36 s** (the first hold)
  structure .70 → 2.38, wash 0; **60 s** (hold 2 at loud .78) black 52 % (the exterior dark), the centre's wash 22 % = the dust at esc .96;
  **94.0 → 94.4 s** (the kick at 94.1): black 1 → 10 %, structure 1.41 → 1.21 — the bands stay (before: the chart off, the centre black .84);
  **110 s** the painted basilica → the dust shape. *The eye* (`tools/work/nav3/peek-ba-{1,2,3}.jpg`, before over after at 18 / 26 / 36 / 57 / 60 / 66
  / 94 / 110 / 115 / 120 / 34.5 / 40 s): at 18 and 26 the interior's spiral bands read where the before frames are black with a white comet; the holds
  are a dust-eaten silhouette with black cores where the before frames are painted petal blobs (66 s: pink lobes with dark holes) or a flat black
  blob with a green rim (115 s).
- **The gate.** `node tools/check.js` **0 fail** (6 warn: the pre-existing soft caps; `nav.js` 435 lines, `implode.js` 310 — inside the 500 hard
  cap) · `npm test` **exit 0** (test_nav3 OK: 8 crossings, 4 drops → 1580 EXT frames, the layer's escape fraction up to 1.00, max step .0502,
  .041 ms per update; test_shift OK, test_fluid 345 ok, test_music 151 ok, test_vox's gate lines met — the worktree needed `tools/truth/traces/`,
  `tools/work/vox/` AND the PCM dumps `tools/work/<T>.48000.st.f32` + their `.json` sidecars symlinked from the main checkout: the HARNESS pitfall
  grew two files) · **the full list** `PORT=8817 tools/scene-md5.sh look` (`tools/accept/nav3/scene-md5-look.txt`): **s0–s5 = `scene-md5-step3.txt`
  to the byte (0 of 12 moved)**, s6 `374f0f81 / dfd88623` (was `4ac1d5fe / aaa34ba3`: the dots off, pal3, the scaled dance, the black calibrated
  hold), errs [] hop 840 row 72 on all seven · **the q trace** (`q-all.sh look 6`, the nine drop windows real-time on the GPU, `look/q-look.txt`):
  **q .902–.931, fps mean 60 min 60, errs [] on all nine** (§143 read .912–.921) — WhoLikesToParty **.902 is under the .91 asked** (its hold sits at
  the bracket's top ε with the q 7 root; §143 read .915 there, min .59 on both runs — a noisy real-time trace, re-run owed) · **the 60 fps |Δhue|
  ruler after** (`look/hue-after.txt`, the same deterministic frames): EXT 36–38.5 **median .18° p90 .45° max 2.89° reversals 19 %** (before 1.21 /
  2.78 / 4.28 / 59 %), EXT 56–59 **.25° / 2.25° / 5.65° / 18 %** (before .85 / 4.99 / 19.8 / 47 %), the INT control .93 / 2.79 / 14.6 / 8 % — the
  exterior inside the control's band on every column, the sawtooth gone; the picture's own |ΔY| per frame in EXT .0147 → .0061 and .0137 → .0050 ·
  **the frames after** (`look/frames-after.txt`, = the peek's to the digit — the page is deterministic): 18 s black 12 % / structure .96, 26 s black
  39 % (centre 13 %), 94.0 → 94.4 → 94.5 black 1 → 10 → 13 % with the structure 1.41 → 1.21 → 1.18 (the bands through the kick) · **the strips**
  `tools/work/nav3/look-comptine-30-75.jpg` and `look-comptine-105-130.jpg` (2 fps, 91 + 51 tiles: the ball rolling to 33, the first hold's
  dust-eaten set 34–43, back inside 44–51, the long hold 53–71 breathing with the ladder and turning, inside again 72–75; 107.5 → 129.5 the
  third) and `look-seeyoudrop.jpg` (50–70 s at 2 fps from `at=40`: inside to 57.5, the way in at 58, the exploded set at 59–70 — a dance drop
  still slams: the dust fills the former interior at esc .7–1.0 with black cores, the exterior dark).
- **NOT done.** The user's eye on all of it (every number here is a ruler's). The hold's escape fraction is the former PETAL's three zones inside the
  budget — at a deep root (WhoLikesToParty's q 7, SeeYouDrop's 107 s q 4 of period 7) no ε of the bracket reaches the floor and the hold sits at the
  bracket's top edge (ε/size .064): a black silhouette on dust, as v0.43's but black. The direction sweep moves the escape fraction too (a wedge's
  edge is nearer M: Comptine 37 s reads .54 at φ .29 against .58 at the middle) — the floor is the middle's. The ρ-reversal count is not a jitter
  ruler (above). `ESC_FLOOR` .3 / `ESC_TOP` .8, `HOLD_LOUD` 1, `TURN_BARS` 4, `PAL3.Y` .5 are first numbers for the eye, not swept. The OKLCH mapping
  (`&colour=oklch`) carries none of the shader changes (as since §140). `nav.js` 435 lines (soft cap 350, as since §140).
