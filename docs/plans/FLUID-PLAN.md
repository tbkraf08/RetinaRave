# FLUID plan — the fluid as the engine's substrate (2026-10-09)

The user's ask, 2026-10-09: *"1) the fluid as the engine's substrate, not a scene. 2) replace the scalar feedback decay with
advection. 3) then build fluid sim with your recommendation … don't get caught up in local maxima, nothing is off limits."*
Three steps, each shippable and proven before the next. Planning only; nothing here is built.

## Summary for the orchestrator (≤ 15 lines)

1. **Step 1 — the substrate.** `assets/core/fluid/{fluid.js, inject.js, shaders.js}`: a Stam solver (Dobryakov's pass order) stepped
   once per frame in `loop.js` right after `uploadEngineTex` (`assets/core/loop.js:36`), publishing `ctx.engineTex.vel` (RG16F) and
   `.dye` (RGBA16F) on the same `ETEX` object (`assets/core/gl.js:156`), plus `ctx.fluid.{splat, force, params, on}`. `inject.js` is the
   shared MS→force grammar (table below), pure and node-testable (`tools/test_fluid.js`); its reads are declared in `FLUID_FEATS`, checked
   in `main.js` like a scene's and by a new `check.js` block. `&fluid=0`, key `W`, `CARD.fluid`. Tiers by `ctx.tier()`: sim 64/96/128/128,
   dye 256/384/512/512. Budget **≤ 1.0 ms** per step at full tier on this machine (Intel UHD 770-class iGPU; NAV reads 2.3–2.9 ms).
   Step 1 moves **no pixel**: no consumer yet → every md5 holds.
2. **Step 2 — advection in `effects/feedback.js`.** A second program back-traces `uPrev` along `engineTex.vel`; `post.fb.advect`
   (default **1**, a gain on the substrate's velocity in screen-fractions/s) with `decay` unchanged. `advect: 0` or `&fluid=0` runs the
   **old program object untouched** → bit-exact. All 24 reference lines re-base to `tools/accept/v0.35/`; parity (numeric) and the
   continuity monitor (scene state) must not move.
3. **Step 3 — FLUID, id 12.** `assets/scenes/fluid/`: renders the dye with a normal-from-gradient shading pass through this repo's
   chain; forced-only (`score() → 0`, `cuts: 'continuous'`), card + thumb, help with the credit sentence, `n` / `&scene=12`.
4. **Credit** is a deliverable of every step (section "Credit": exact text, exact files). Dobryakov's solver, the forks' ideas, the
   user's own validated mappings as the grammar's source. No code vendored.
5. Gates per step are checklists with HARNESS commands; the SeeYouDrop windows are frame-addressed (`at=0` f602 intro 10 s · `at=25`
   f602 groove 35 s / f1958 drop 1 57.6 s · `at=80` f602 build 90 s / f1202 build 100 s / f1538 + f1550 drop 2 105.6 s).

## Reference sim (what is kept, what is not)

PavelDoGreat/WebGL-Fluid-Simulation (MIT, 2017): curl → vorticity confinement (CURL 30) → divergence → pressure Jacobi (20, seeded
by last frame × PRESSURE 0.8) → gradient subtract → advect velocity (decay 1/(1+VELOCITY_DISSIPATION·dt), 0.2) → advect dye
(DENSITY_DISSIPATION 1.0). Dye RGBA16F linear, velocity RG16F linear, divergence/curl/pressure R16F nearest. Kept: that pass order, the
Gaussian splat `exp(-dot(p,p)/radius)` with aspect correction, the half-float formats. Not kept: its bloom/sunrays/dither (this repo's chain), its globals, its dt clamp, its leaky
`initFramebuffers`. Re-implemented in this repo's style on `mkProg` / `mkTarget` /
`tex` / `tri` (`gl.js:42,85,92,120`); nothing copied.

**Float textures.** `initGL` asks for `EXT_color_buffer_float` and sets `G.FLOAT` (`gl.js:35`); `mkTarget` already renders to RGBA16F
LINEAR when it is there (`gl.js:121-125`), so the whole chain is half-float today. WebGL2 filters 16F textures natively (the
`OES_texture_float_linear` at `gl.js:36` is for 32F). The fluid needs `G.FLOAT`; without it (`G.FLOAT === false`, SwiftShader is fine,
some old mobiles are not) the substrate is **off**: `ctx.fluid.on = false`, `engineTex.vel/dye` are 1×1 black placeholders so a sampler
always binds, feedback runs the old program, FLUID's `draw` paints its "needs float render targets" idle (the scene stays registered).
Signed velocity in RGBA8 was considered and rejected: two paths to prove for a device class the repo already renders 8-bit on.

## Step 1 — the substrate

**Files.** Create `assets/core/fluid/fluid.js` (the stepper, GL), `assets/core/fluid/inject.js` (pure: MS → forces; imports only
`../../math/*`), `assets/core/fluid/shaders.js` (GLSL strings), `tools/test_fluid.js`. Modify `assets/core/gl.js` (`ETEX` gets
`vel`, `dye`, `simW/simH`, `dyeW/dyeH`; the two placeholders made in `uploadEngineTex`'s first-call block, `gl.js:169`),
`assets/core/loop.js` (one call), `assets/main.js` (the `ctx.fluid` slot, `FLUID_FEATS` check next to the scene one at `main.js:71`,
`initFluid(ctx)` after `initLines()`, `main.js:66`), `assets/core/harness.js` (`&fluid=0`, `CARD.fluid`, `CARD.benchFluid`),
`assets/core/hud.js` (key `W`, the HUD line `fluid <ms> sim WxH dye WxH tier N`), `assets/core/help.js` (`keys()` row, `help.js:36`),
`assets/core/quality.js` (nothing: tiers come from `tier()`, `quality.js:54`), `tools/check.js` (the core-reads block),
`package.json` (`test` gains `tools/test_fluid.js`), docs (below).

**Where in the frame.** `loop.js:36` `uploadEngineTex(ENGINE.tex);` → next line `stepFluid(dt, S, now)` — MS is final
(`ENGINE.frame`, `loop.js:34`), scenes have not updated yet (`loop.js:41`), so a scene's `update`/`draw` sees this frame's field.
`document.hidden` returns before it (`loop.js:31`); `ENGINE.resumed` (`loop.js:35`) clears the pool's events the way `FX` is cleared.
The step binds its own targets and leaves BLEND/DEPTH/SCISSOR off — `renderScene` re-asserts them anyway (`scenes.js:267-269`).
`dt` is the loop's (≤ 1/24, `loop.js:28`); under `CLOCK=1` it is exactly 1/60, so file-mode and `#test` runs are deterministic.

**Design.**
- Targets (own, via `ctx.mkTarget`-style raw allocation in `fluid.js` because `mkTarget` is RGBA-only): velocity RG16F LINEAR ping-pong,
  dye RGBA16F LINEAR ping-pong, pressure R16F NEAREST ping-pong, divergence R16F, curl R16F. Sim resolution = short edge
  `SIM[tier]` with the canvas aspect (`G.PW/G.PH`, `gl.js:215-216`); dye short edge `DYE[tier]`. Allocated on `addResizeHook`
  (`gl.js:200`) and re-allocated on a **tier change** (`tier()`, `quality.js:54`) with a bilinear copy of the old velocity/dye so the
  picture never resets (Dobryakov's resizeFBO idea; hysteresis is the tier's own). `SIM = [64, 96, 128, 128]`, `DYE = [256, 384, 512,
  512]`, `ITER = [10, 14, 20, 20]`. Cost is set by the short edge, not DPR: at 1280×720 sim 228×128, dye 910×512; a 2560×1440 canvas
  (the `LONG_EDGE` cap, `gl.js:203`) costs the same sim, only feedback's fetch scales.
- Units: velocity in **screen fractions per second** (uv/s), aspect-corrected in the splat only; advection is `uv − v·dt`. One rule
  for the solver, the feedback pass and a scene's own sampling.
- Passes per step (sim res unless said): splats (one draw per splat, additive, velocity then dye at dye res) → curl → vorticity (CURL
  from `tension`) → divergence → clear pressure × 0.8 → Jacobi × ITER → gradient subtract → advect velocity (dissipation from
  `lpSweep`/`hush`) → advect dye (dye res; dissipation from `buildLive`/`dropLiveEvt`). ≈ 27 draws at full tier, as the reference.
- `ctx.fluid` (added to the `ctx` literal, `main.js:58`): `splat(x, y, dx, dy, rgb, r?)` (uv, uv/s, linear rgb 0..1, radius
  default `0.0025` aspect-corrected) · `force(fx, fy)` (a body force this frame, uv/s²) · `params` `{curl, velDiss, dyeDiss,
  pressure, iters, radius}` (the live values after `inject.js`; a scene may override for the frame) · `on` · `tex` = `{vel, dye}` (the
  same objects as `ctx.engineTex.vel/dye`). Scene calls queue into the same list `inject.js` fills; the step drains it. A scene that
  is not on screen must not splat (`visibility`, `scenes.js:314`, or the `on` flag in `env`).
- `engineTex.vel/dye` join `ETEX` (`gl.js:156`) as `{t, w, h}` like `spec`; they are GPU-written, so `uploadEngineTex` does not touch
  them and `ETEX.bytes` stays the bus count. CONTRACTS §1.1's `ctx.engineTex` block (`docs/CONTRACTS.md:86-94`) gains two rows. The
  HUD line names the step's ms (EMA, as `ENGINE.ms`); the help view's part B gets one data-driven line "the substrate reads: …" built
  from `FLUID_FEATS` (no literals — `check.js:84-88` forbids MS names as literals in `help.js`).
- Switches: `&fluid=0` under `#test` (`harness.js` next to `&loud=`, `harness.js:174`) and the key `W` (free: `hud.js:75-92` uses
  `f d m h ? p esc l r n 0–9`; `touch.js:40-43` names actions, not keys) toggle `FLUID.on`; off = no step, placeholders bound, the
  old feedback program. `CARD.fluid = FLUID` (on, ms, params, the last frame's splat count, `tex`).
- Determinism: no `Math.random`, no `Date.now` (CONTRACTS §0); hats seeded from `MS.seed.a` and `beatCount` through `hash()`
  (`gl.js:24` in GLSL, `frac(sin(…))` in JS as `scenes.js:97` does).

**The injection grammar (`inject.js`, `plan(S, dt, st) → {splats, body, params}` — pure; `fluid.js` applies it).** Every field below
is in `FLUID_FEATS`; every mapping is the kind CONTRACTS §1.18 asks for (levels at heard time, events placed by age, `*Amp` for size,
never `*Vel` on its frame, never `pred*`).

| MS field(s) | kind | → force / dye | notes |
|---|---|---|---|
| `subNote`, `subGate`, `subGlide`, `subHz`, `bassReg` | count/level | the **sub emitter**: a persistent splat at `x = ((7·subNote) mod 12)/12` (circle of fifths, `sectorPc`, `math/keycolour.js:97`), `y = 0.12 + 0.25·bassReg`; `dy = +0.08·sub` uv/s, `dx = 0.02·clamp(subGlide/12)`; `subGate 0` → nothing. `subNote -1` with gate open → x from `harmAngle` | one element, one channel |
| `kickEvt`, `kickAmp`, `kickAge` | event/level | **kick**: on the event, one impulse at `(xSub, 0.06)`, `dy = 0.9·sqrt(kickAmp)` uv/s, radius 2×; the first 2 frames after (`max(0, kickAge) < 2/60`) keep 40 % | upward push from the floor |
| `snareEvt`, `snareAmp` | event/level | **snare**: a lateral shear at `y = 0.5`: two splats `(0.3, 0.5, +0.6·snareAmp, 0)` and `(0.7, 0.5, −0.6·snareAmp, 0)` | mid height, sideways |
| `hat2`, `denH`, `beatCount`, `seed` | level/raw/count/vector | **hats**: while `hat2 > 0.3`, `min(3, round(denH))` droplets at `y = 0.9`, `x = hash(beatCount·7 + i, seed.a)`, `dy = −0.15`, radius 0.5×, dye 0.3 | seeded, never random |
| `beatPhase`, `beat` | level/event | **beat body force**: `fy = −0.35·cos⁴(π·beatPhase)` on the whole pool (uniform in the advect pass), not a splat | the pool breathes |
| `key`, `mode`, `keyConf`, `tonicConf`, `modeShade`, `valence`, `harmAngle` | count/level/raw | **dye colour**: `mkAnchor().anchor(dt, key, mode, keyConf, valence, harmAngle, moodHue, null, modeShade)` (`keycolour.js:62`) → `hsv(OUT.hue, OUT.sat·(0.4 + 0.6·tonicConf), 1)` (`math/util.js:43`), linear-decoded once | the shared key hue, warm/cool by the shade |
| `tension` | level | `curl = 10 + 40·tension` | vorticity |
| `lpSweep` | level | `velDiss = 0.2 + 2.8·smoothstep(0.80, 0.97, lpSweep)` | syrup when the filter closes |
| `buildLive`, `tongueAmbig`, `tongueOn` | level/count | `dyeDiss = 1.0 → 0.05` as `max(buildLive, tongueOn === 1 ? tongueAmbig : 0)` rises | ink accumulates through the void |
| `dropLiveEvt` | event | one impulse `(xSub, 0.06, 0, 2.5)` radius 4×, and `dyeDiss = 6` for `60/bpm` s (st.clearUntil) | the pool clears in ~1 beat |
| `hush`, `calm`, `loudRel`, `presence` | level | injection gain `g = presence·(0.3 + 0.7·loudRel)·(1 − 0.8·hush)·(1 − 0.5·calm)`; `velDiss += 2·hush` | quiet is quiet |
| `bpm` | raw | the clear's length | |

Not read: `pred*`, `*Vel`, `dropEvt`, `tension` as a "dream" detector (CONTRACTS §1.18, DECISIONS §76). `inject.js` keeps only
`st` = `{clearUntil, anchor}`; no `ema` on dt except the anchor's own ease (`HUETC`, `keycolour.js:34`).

**Declaring the reads.** Core has no `feats` today — the director's one MS write is noted in prose (`scenes.js:246`) and stages
declare writes (`engine.js:54`). Propose: `export const FLUID_FEATS = [...]` in `inject.js`; `main.js` checks `⊂ ENGINE.FEATS`
exactly as `main.js:71-72` does for a scene; `check.js` adds a block after the scene loop (`check.js:174`): import
`assets/core/fluid/inject.js` (pure), every `FLUID_FEATS` key in `FEATS` (fail), every `\b(S|MS)\.(\w+)` read in the source in
`FLUID_FEATS` (**fail** — stricter than a scene's warn, `check.js:141`, because the substrate feeds every scene), every declared key
read (warn). `tools/feats-doc.js` unchanged.

**Budget and bench.** `CARD.benchFluid(n = 300)`: n steps at the current tier, readPixels-synced on the dye target (`harness.js:37`
`readback`), interleaved with `bench(0, 300)` per "Bench protocol" (`docs/HARNESS.md:93-111`: q pinned, n ≥ 300, medians, pairs).
Budget: **≤ 1.0 ms at tier 3 (1280×720, GPU=1)** and ≤ 0.4 ms at tier 0, against NAV's 2.3–2.9 ms (DECISIONS:413, :632) on this
machine (Intel UHD 770-class iGPU, `lspci` 00:02.0 Intel a780). The Q trace (`docs/HARNESS.md:113-138`, `tools/q-trace.sh`) on house
+ aba, `none` (`&fluid=0`) vs `after`: the 0–40 s q mean must stay within 0.05 of `none`.

**Open decisions (made).** Core, not an effect: an effect runs only inside `runChain` after the scenes have drawn (`post.js:62`); the
substrate must exist before `update` (`loop.js:41`). Tiers by `tier()` not a continuous `q`: a re-allocation per q tick would
thrash. Velocity in uv/s: one unit everywhere. The key hue through `keycolour.js`, not a new table: it is the hue every key-anchored
scene already shows (`nav2/look2.js:12`, `chladni/index.js:21`, `polytope/colour.js:28`).

**Risks.** `check.js:54` — a core file must not contain the word `nav` (not even in a comment). Module cap 350/500 lines
(`check.js:14`): shaders in their own file. `ETEX` consumers that iterate its keys: none today (`uploadEngineTex` names them). The
help view must not grow a literal MS name. A `tier()` flip mid-md5-run cannot happen under `CLOCK=1` (`dtRaw` is 1/60 by the shim,
`loop.js:25`, so `updateQuality` never lowers q).

**Gate (Step 1).**
- [ ] `node tools/check.js` → 0 fail (the new block included); `npm test` exit 0 (`tools/test_fluid.js`: `plan()` on a synthetic MS
      sweep — gate closed → no sub splat, `kickEvt` → one impulse with `dy ∝ sqrt(kickAmp)`, `dropLiveEvt` → `dyeDiss 6`, two
      calls on the same input → identical output, no field outside `FLUID_FEATS` reached through a Proxy of MS)
- [ ] `node tools/license.js --check` → 0 missing (the three new core files + the test)
- [ ] `GPU=1 PORT=88xx tools/scene-md5.sh s1 && diff tools/work/s1-md5.txt tools/accept/v0.34/scene-md5-v034.txt` → **identical** (no consumer yet); `&fluid=0` list identical too
- [ ] `GPU=1 tools/accept.sh` "== parity fake" → the pre-existing `nav.*` MISMATCH line only (DECISIONS §102), MS 0 diff; "== monitor 60 s" viol []
- [ ] bench: `CLOCK=0` headless `GPU=1`, `setInterval(()=>CARD.Q.q=0.95,16)`, wait 8 s, three pairs `benchFluid(300)` / `bench(0,300)` → medians, the ratio, both tiers (q 0.95 / 0.1)
- [ ] `GPU=1 tools/q-trace.sh after house aba` vs `tools/q-trace.sh none` with `NONE` hash `&fluid=0` → `node tools/q-stats.js`
- [ ] a dye-readback shot for the eye: `CLOCK=1 GPU=1 PORT=88xx node tools/cdp.js 'test&scene=1&fluiddbg=1' …` where `&fluiddbg=1` makes the composite show the dye (a harness-only overlay in `fluid.js`, like `clipMask`, `docs/HARNESS.md:212`) at f360 / f840 — two runs, md5 equal
- [ ] `CARD.ERRS` `[]`, `CARD.nonFinite()` `[]`, `CARD.ctx.gl.getError()` 0, the help opened/closed (`docs/HARNESS.md:332-350`), key `W` toggles `CARD.fluid.on`
- [ ] `node tools/bundle.js` + `FILE=… cdp 'test'` from `file://`: errs [] (the bundle rewrites imports only, `tools/bundle.js:1-5`; a new folder needs no change)

## Step 2 — advection replaces the scalar feedback decay

**Files.** Modify `assets/effects/feedback.js`, `assets/core/manual.js` (`PARAMS` `manual.js:14`, the `ONE` regex `manual.js:81`,
the parse hint `manual.js:85`), `assets/core/panel.js` (nothing: `postCtl` walks `POST_PARAMS`, `panel.js:214`), `docs/CONTRACTS.md`
§1.4 (`CONTRACTS.md:170-173`) and §3, `tools/accept.sh` (`ACC` default → `v0.35`), new `tools/accept/v0.35/`.

**Design.** Two programs in `feedback.js`: `this.pr` = the current shader **unchanged** (`feedback.js:9-12`), and `this.prA` = the
same source plus `uniform sampler2D uVel; uniform vec2 uAdv;` with the back-trace inserted after the zoom/twist: `c = c + .5;
c -= uAdv.x * uAdv.y * texture(uVel, c).xy; vec3 p = texture(uPrev, c).rgb;` (`uAdv = [advect, dt]`; `uVel` is `engineTex.vel`,
sampled at the previous frame's position — Dobryakov's semi-Lagrangian step, Stam 1999). `run()` picks `prA` only when
`io.fluid.on && advect > 0`; otherwise the old program object runs with the old uniforms — the `advect: 0` / `&fluid=0` path is the
identical compiled program, so bit-exact by construction, not by hoping the compiler agrees. `io.fluid` is added to the `runChain` io in
`loop.js:58`. `post.fb.advect`: number or `fn(MS)` like `decay` (`feedback.js:35`; routed scenes resolve it in `nested()`,
`scenes.js:335-344`, nothing to add), **default 1**: the user said replace. Unit: a gain on the substrate's velocity, which is in
screen-fractions/s — 1 = the trail rides the current at its own speed; 0.5 = half. (The brief said "strength in screen-fractions
per second"; a cap in uv/s would alias on the drop impulse, so the slot is the gain and the unit lives in the velocity.) `decay`
stays the dissipation (`pow(d, 2.2)` in linear, `feedback.js:37`); `max(s, p)` composition stays; zoom and twist stay — the
back-trace adds to them. Manual: `fb.advect` joins `PARAMS` as `'number'`, the `ONE` alternation, `&post=scene.fb.advect=0`.

**Consequences, stated.** With the substrate on by default every scene's trails move, so **every line** of the reference moves:
`tools/accept/v0.34/scene-md5-v034.txt` (24 lines), `trans-mixs-md5.txt`, `gielis-still-md5.txt` → a new directory `tools/accept/v0.35/`
per §83's rule (`docs/HARNESS.md:1122-1140`): `PORT=88xx tools/scene-md5.sh v35; cp tools/work/v35-md5.txt tools/accept/v0.35/scene-md5-v035.txt`,
twice (`cmp`), the mixs value and the GIELIS still from the sweep's own shots, `ACC` default `v0.35` (`tools/accept.sh:8`). What must
**not** move: `tools/parity.js fake` (MS + `nav.*` state + `sc` + `q.*`, `parity.js:20-22` — numbers, no pixels; the montage is for eyes),
the continuity monitor (`tools/monitor.js` watches `cPath`/`kick`/`mode` of the home's state, not pixels), `hist rows == full`
(`accept.sh:33-38` — same frame both ways, still holds because the advection is the same both ways), `test_nav2.js`, `chain-smoke.js`
(synthetic input, no fluid: `io.fluid` undefined → old program; the smoke must keep passing unchanged). The **`&fluid=0` list must equal
the v0.34 list line for line** — that is the proof the old pass is intact. The NAV2 continuity (§1.9) is state, and the home scene
does not read `ctx.fluid` in this step.

**Risks.** A visible seam at the dye/vel edge: velocity is CLAMP_TO_EDGE, the back-trace stays inside [0,1] — clamp `c`. A
crossfade (`drawScenes`, `scenes.js:288`) feeds feedback a blended frame; the current is the same for both scenes, fine. Half-float
velocity sampled LINEAR at a different resolution than the frame: bilinear, as the reference. A GPU/driver change on the user's
machine re-bases every list anyway (already true: every reference says "GPU=1, 1280×720").

**Gate (Step 2).**
- [ ] `node tools/check.js` 0 fail (no dead uniform: `uVel`/`uAdv` are fetched through `tex(pr,'uVel'…)`/`u('uAdv')`, `check.js:39-42`); `npm test` 0
- [ ] `GPU=1 node tools/chain-smoke.js` → `chain-smoke: OK` unchanged (`docs/HARNESS.md:203`)
- [ ] `GPU=1 PORT=88xx tools/scene-md5.sh v35off '&fluid=0'; diff tools/work/v35off-md5.txt tools/accept/v0.34/scene-md5-v034.txt` → **identical**; the same with `&post=<every scene>.fb.advect=0` on one scene (s1) → s1's lines identical
- [ ] `GPU=1 PORT=88xx tools/scene-md5.sh v35` twice → `cmp` identical → the new reference; `python3 tools/montage.py` of f360/f840 old vs new per scene for the orchestrator (the trails must ride, not smear into mush — the `decay` meaning is unchanged)
- [ ] `GPU=1 node tools/parity.js fake` → MS 0 diff, the §102 `nav.*` line only; `GPU=1 tools/accept.sh` "== monitor 60 s" viol []
- [ ] `node tools/manual-smoke.js` + `&post=dust.fb.advect=0.5` moves s1, `=1` equals the reference (the §392 pattern, `docs/HARNESS.md:389-392`)
- [ ] bench: feedback's pass alone before/after — `CARD.benchTransition`-style timing is not there for effects; use the frame EMA `1/Q.fps` pinned at q .95 over 10 s, `&fluid=0` vs default, difference ≤ 0.15 ms
- [ ] SeeYouDrop shots (below) with `&fluid=0` vs default, montaged, for the orchestrator's eye
- [ ] `GPU=1 tools/accept.sh` in full at the step's tag (the "core/effects" row of `docs/HARNESS.md:1110`) → 0 FAIL against v0.35

## Step 3 — the FLUID scene (id 12, "slot 13")

**Files.** Create `assets/scenes/fluid/{index.js, shaders.js, help.js}`; modify `assets/main.js` (import + the list, `main.js:46,70`),
`tools/thumbs.sh` (`PICK` gains `12:840`, `thumbs.sh:6`), `site/thumbs/fluid.jpg` (by `name`, `landing.js:34-39`), `docs/CONTRACTS.md`
§1.8 id table (`CONTRACTS.md:267`), `site/about.html`, `README.md`, `releases.json` (at the tag).

**Design.** `name: 'fluid', id: 12, cuts: 'continuous', always: false, score() { return 0; }` (§93 roster rule — forced-only;
no digit key exists, `hud.js:91` stops at 9; `n` cycles, `&scene=12`), `card: { title: 'FLUID', blurb: 'ink in a pool: the bass note
is where it enters, every kick lifts it, the snare shears it, the key is its colour' }`, `post: { fb: { decay: 0.35, advect: 1 },
bloom: { thr: 0.5 }, kaleido: 0, morph: { flow: 0.4 } }`. `draw`: one fullscreen pass sampling `ctx.engineTex.dye` — shading =
normal from the dye's luminance gradient (`±1 texel`, light from the top, Dobryakov's SHADING idea, GPU Gems ch. 38) on a dark pool,
`linToSrgb` from `ctx.oklch` (§1.10: the scene writes encoded; the dye is linear); a porthole feather so the pool's edge never shows
(§1.10's rule, `CONTRACTS.md:286-289`). Exposure through `loudRel` (`baseLight`, `math/loudlight.js`, as NAV2). `update`: scene-local
injection on top of the grammar via `ctx.fluid.splat` — a ring of 6 droplets on `dropLiveEvt` and a `hat2`-sized sparkle at the
surface, both gated on `visibility(id) > 0` through `env` — and `ctx.fluid.params.curl += 10` while it is on screen (it may; the
grammar stays the core's). `feats: ['loudRel', 'dropLiveEvt', 'hat2', 'presence']` with `help.feats` lines (`CONTRACTS.md:380-402`);
`help.eli5/why/math` three depths, `why` carries the credit sentence (Credit §4). `hud()` one line. No `hooks` beyond `fldbg` (reads
the step's ms). Module cap: shaders in `shaders.js`.

**Risks.** The dye at tier 0 (256 short edge) upsampled to 1440p is soft — the shading pass hides it; say so in the help. The scene
reads only its four fields; the substrate's reads are the core's (the help's part B line, Step 1). A scene must not import
`core/fluid` (`check.js:48`): everything through `ctx.fluid`.

**Gate (Step 3).**
- [ ] `node tools/check.js` 0 fail: help depths, `help.feats ⊂ feats`, the bid-only grep (`score` returns a literal 0 — no field), card + thumb present
- [ ] `IDS=12 PORT=88xx GPU=1 tools/scene-md5.sh s12` twice → equal → append the two lines to `tools/accept/v0.35/scene-md5-v035.txt`; the other 24 lines unchanged (one full list once, the "main.js registration" row, `docs/HARNESS.md:1108`)
- [ ] help view: `CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=12' '[{"until":"window.CARD"},{"key":"h"},{"until":"window.__FRAME>=120"},{"shot":"work/help-s12-f120"},{"eval":"CARD.HELP.rows(true).join()"}]'` → the four feats; the credit sentence visible in the shot; `CARD.HELP.rows().length` unchanged (no new FEATS entry)
- [ ] landing: `GPU=1 node tools/cdp.js real "$(cat tools/landing-steps.json)"` → `TILES` = today's count + 1 (9 scene folders declare `card` today, FLUID makes 10), fluid.jpg width 480; `MOBILE=1` once
- [ ] bench: `bench(12, 300)` interleaved with `bench(0, 300)` ×3, q .95 and .1 → ≤ 0.5 ms (one fullscreen pass) + the step's ms
- [ ] the mixs 0→3 line unchanged (id 12 is not in the 0→3 fade); `&trans=morph` 0→12 and 12→0 at f178 for the eye (`docs/HARNESS.md:164`)
- [ ] SeeYouDrop shots (below) on `&scene=12`; `CARD.ERRS []`, `nonFinite []`, hidden-tab line (`accept.sh` "== hidden tab") still 0 events
- [ ] `node tools/bundle.js` → from `file://`, `&scene=12` renders, errs []

## SeeYouDrop windows (every step, for the orchestrator's eye)

Heard time = `at + (frame − 2)/60` (`docs/HARNESS.md:517-523`); ≥ 8 s warm-up before the first shot; two consecutive non-`__FRAME`
`until`s deadlock. Boundaries from `tools/truth/SeeYouDrop.sections.json:14-40`: intro 0–12.8, groove 25.6–44.8, void 49.6–57.6,
**drop 1 57.6056**, groove-return 89.6–96.0, climb-double 96.0–105.6, **drop 2 105.5959**.
```
S='[{"until":"window.CARD"},{"until":"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open","timeout":300000}'
# intro 10 s                 at=0   f602
PORT=88xx CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&track=SeeYouDrop&at=0&scene=<id>'  "$S"',{"until":"window.__FRAME>=602","timeout":300000},{"shot":"fl-intro-10"},{"eval":"JSON.stringify({heard:CARD.MS.heardT,errs:CARD.ERRS,bad:CARD.nonFinite(),ms:CARD.fluid.ms})"}]'
# groove 35 s / drop 1 57.6 s / +0.4 s     at=25  f602 / f1958 / f1982
PORT=88xx CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&track=SeeYouDrop&at=25&scene=<id>' "$S"',{"until":"window.__FRAME>=602","timeout":300000},{"shot":"fl-groove-35"},{"until":"window.__FRAME>=1958","timeout":300000},{"shot":"fl-drop1-576"},{"until":"window.__FRAME>=1982","timeout":300000},{"shot":"fl-drop1-580"}]'
# build 90 s / 100 s / drop 2 105.6 s / +0.2 s   at=80  f602 / f1202 / f1538 / f1550
PORT=88xx CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&track=SeeYouDrop&at=80&scene=<id>' "$S"',{"until":"window.__FRAME>=602","timeout":300000},{"shot":"fl-build-90"},{"until":"window.__FRAME>=1202","timeout":300000},{"shot":"fl-build-100"},{"until":"window.__FRAME>=1538","timeout":300000},{"shot":"fl-drop2-1056"},{"until":"window.__FRAME>=1550","timeout":300000},{"shot":"fl-drop2-1058"}]'
python3 tools/montage.py tools/work/fl-m.jpg 4 tools/work/fl-*.jpg      # + the same set with &fluid=0 for the A/B
```
Step 1: `<id>` = 1 and 0 with `&fluiddbg=1` (the dye itself). Step 2: 0, 1, 3 with and without `&fluid=0`. Step 3: 12. Two runs of any
one shot must be md5-equal (the four rules, `docs/HARNESS.md:517-525`).

## Credit

The user, 2026-10-09: *"be sure to give credit where credit is due."* A deliverable of **each** step; the executor copies the text
verbatim. No code from any of the named projects is vendored — the credit is for the solver's lineage and for ideas.

1. **File headers (Step 1: `assets/core/fluid/fluid.js`, `inject.js`, `shaders.js`, `tools/test_fluid.js`; Step 2: `assets/effects/feedback.js`;
   Step 3: `assets/scenes/fluid/index.js`, `shaders.js`, `help.js`).** The repo's three-line header first (`tools/license.js:13-17`,
   exact — `license.js --check` compares the prefix, `license.js:61-64`, so lines after it are free), then on line 4:
   `// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation`
   and, in `assets/core/fluid/shaders.js`, `assets/effects/feedback.js` and `assets/scenes/fluid/shaders.js` (the advect / pressure /
   shading passes descend from it), line 5: `// after GPU Gems ch. 38 (Harris 2004)`. Comments survive the bundle (`tools/bundle.js`
   rewrites import/export lines only, `bundle.js:3`), so the shipped single file carries the line.
2. **The MIT notice, reproduced as the licence requires.** New file **`THIRD-PARTY.md`** at the repo root (there is no `LICENSES/`;
   `LICENSE` is the repo's own text and stays untouched):
   ```
   # Third-party notices

   ## WebGL-Fluid-Simulation — the fluid solver's lineage (assets/core/fluid/, assets/effects/feedback.js, assets/scenes/fluid/)
   Re-implemented in this repo's style after Pavel Dobryakov's WebGL-Fluid-Simulation
   (https://github.com/PavelDoGreat/WebGL-Fluid-Simulation). No file of that project is copied; the pass order,
   the splat and the shading idea are his, and his licence is reproduced here as it asks.

   MIT License

   Copyright (c) 2017 Pavel Dobryakov

   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
   documentation files (the "Software"), to deal in the Software without restriction, including without limitation
   the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
   to permit persons to whom the Software is furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all copies or substantial portions
   of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
   THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   The solver's pass order follows Mark J. Harris, "Fast Fluid Dynamics Simulation on the GPU", GPU Gems ch. 38 (2004),
   after Jos Stam, "Stable Fluids" (1999).
   ```
   Ships with the build: `package.json` `build` gains `&& cp THIRD-PARTY.md dist/THIRD-PARTY.md` next to `cp LICENSE dist/LICENSE`
   (`package.json:1`), so `dist/` and retinarave.com carry it; `releases/retinarave-vX.html` carries the header lines (item 1).
3. **`site/about.html`, the License section (`about.html:112-116`, the "source on GitHub" sentence from commit 39c4a78).** Add, after
   that sentence, verbatim:
   `<p>The fluid under every scene is a re-implementation of <a href="https://github.com/PavelDoGreat/WebGL-Fluid-Simulation" rel="noopener">Pavel Dobryakov's WebGL-Fluid-Simulation</a> (MIT, 2017); its notice is at <a href="/THIRD-PARTY.md">/THIRD-PARTY.md</a>. Ideas from the forks that map music onto it are credited in the engineering notes.</p>`
   **`README.md`** (one heading today, `README.md:1`): a `## Credits` line at the end, verbatim:
   `The fluid substrate is after Pavel Dobryakov's [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) (MIT, 2017; notice in THIRD-PARTY.md). The way music drives it owes ideas to [WebGL-Fluid-Enhanced](https://github.com/michaelbrusegard/WebGL-Fluid-Enhanced) (the ESM API shape), [fluid-music-visualizer](https://github.com/oliver-kopcik/fluid-music-visualizer) (onsets → splats, pitch class → hue) and [Fero-Fluild-Lamp](https://github.com/little-noob/Fero-Fluild-Lamp) (bass / mid / high split); the grammar itself is this repo's own measured mappings (DECISIONS §57, §58, §70, §74, §79, §81).`
4. **`docs/DECISIONS.md` §104 and the `releases.json` entry** name the lineage in one paragraph, verbatim:
   *"Lineage. The solver is Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, 2017) re-implemented on this repo's `gl.js` helpers —
   nothing vendored, the notice in `THIRD-PARTY.md`. Three forks informed the design and no code was taken from them:
   michaelbrusegard/WebGL-Fluid-Enhanced (the ESM API shape — a simulation object with config, splat and pause, which `ctx.fluid`
   follows), oliver-kopcik/fluid-music-visualizer (spectral-flux onsets as splat force and size, pitch classes as hue — here the ears'
   `kickEvt`/`kickAmp` and the key anchor), little-noob/Fero-Fluild-Lamp (the band split bass / mid / high into deformation,
   turbulence and edge detail — here the register axis). The grammar's sources are the user's own validated mappings: TORUS2's waves at
   beat speed and the measured drum channels (DECISIONS §57, §58, §70, §74, §79, §81)."* `releases.json` `body` ends with: *"The fluid
   under every scene is after Pavel Dobryakov's WebGL-Fluid-Simulation (MIT); credits in THIRD-PARTY.md and on the about page."*
   **The help view (public): `assets/scenes/fluid/help.js`, `HELP.why`** ends with the sentence, verbatim: *"The solver is a
   re-implementation of Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, 2017); the mappings from music are this engine's own, with ideas
   from the music-visualiser forks credited in THIRD-PARTY.md."* (In the scene's own `help.js`, not `core/help.js`: `check.js:84-88`
   bans MS-field literals there and `check.js:153` bans scene names.)
5. **Gate, each step:** `node tools/license.js --check` 0 missing; `grep -l "Dobryakov" <the step's new files>` lists every one;
   Step 3 adds `grep -c Dobryakov site/about.html README.md THIRD-PARTY.md releases.json docs/DECISIONS.md` ≥ 1 each, and the help shot
   (Step 3 gate) shows the sentence.

## What a worker writes to the docs

- **`docs/DECISIONS.md` §104** (one section per step is better: §104 substrate, §105 advection, §106 the scene; next free is §104,
  `DECISIONS.md:9016` is §103). House style (§102/§103): a heading with the date, the user's words in italics, then bullets **What
  changed** (files, the slot names), **Numbers** (bench pairs with the ratio, tier table, q-trace means vs `none`), **Proof** (the md5
  table before/after, two runs, `&fluid=0` = v0.34 list, parity line, monitor line, errs), **Lineage** (Credit §4 verbatim), **Not
  done / Open** (the eye on the drop windows; HiDPI phones; the `G.FLOAT` fallback never seen on a device).
- **`docs/CONTRACTS.md`**: §1.1 `ctx.engineTex` block (`CONTRACTS.md:86-94`) + two rows (`vel` RG16F sim-res uv/s, `dye` RGBA16F
  linear colour, both GPU-written, placeholders when `ctx.fluid.on` is false) and a `ctx.fluid` row; §1.4 `post` (`CONTRACTS.md:170`)
  gains `fb.advect` (0 = the scalar pass, 1 default); §1.8 id table (`CONTRACTS.md:267`) gains **12 fluid**; §3 `io` gains `fluid`.
- **`docs/HARNESS.md`** "## Fluid" after "## Engine textures" (`HARNESS.md:181`): the switches (`&fluid=0`, `W`, `&fluiddbg=1`),
  `CARD.fluid`, `benchFluid`, the tier table, the budget, the re-base note (v0.35 = the advection re-base, every line), the SeeYouDrop
  window block above, the `&fluid=0` identity proof, `tools/test_fluid.js`; "## Acceptance sweep" `ACC` v0.35; "## Landing tiles"
  the tile count.
