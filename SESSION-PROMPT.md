# Fable Session Prompt — Eigenwobble v0.1 (modular Cardioid · merged music engine · 4 scenes)

You are starting **Eigenwobble**: the modular successor to Cardioid. Cardioid is a single-file WebGL2
audio-visual engine in which music navigates real mathematical objects; it got to v3 (`cardioid3.html`,
966 lines, zero deps) and then hit the wall every single-file project hits — adding a scene or an
effect meant loading the whole file into the context window. Eigenwobble is the same engine cut along
its natural seams so that **adding a scene, an effect, or a music-analysis stage means reading one
contract doc and writing one folder** — never opening the core.

Work in `~/Documents/Kraftek/Eigenwobble/` (this file lives there; the dir is otherwise empty).
`git init` it first and commit per deliverable. Sources you lift from — **read-only, never modify**:
- `~/Documents/Kraftek/Cardioid/cardioid3.html` — v3, the trusted source. Read it fully before writing
  anything. Sections: util · math (charts on M) · audio + demo synth · music-state extractor (`MS`) ·
  navigator (`NAV`) · sibling sims · GL + shaders (`FS.*`) · scene manager (`SC`) · frame loop.
- `~/Documents/Kraftek/Cardioid/cardioid4.html` — v4 is **buggy; do not lift code from it.** Its one
  good idea, the `FEATS` self-documenting feature glossary (lines ~440–500), may be read for *shape*.
- `~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html` (1693 lines) — a sibling project
  with a different analysis engine and two scenes we want. Read only the ranges named below.
- `~/Documents/Kraftek/Cardioid/tools/` — the headless harness; port it.
- `~/.claude/projects/-home-toma-Documents-TomaCoS/memory/project_cardioid_visualizer.md` — harness
  usage and every GL/JS pitfall already hit. Read it; **update it at the end** (or write a sibling
  `project_eigenwobble.md` and link the two).

## Why "Eigenwobble"
The feature vector `MS` is the eigen-thing — the one state every visual parameter traces to. The
wobble is `GROOVE`, the shared rotation that makes everything breathe with the beat. Both live in the
core; everything else is a plug-in.

---

## Non-negotiables (carried from Cardioid, one relaxed)
- Zero runtime dependencies. WebGL2, fragment-shader-first. Native ES modules, no bundler, no
  framework, no TypeScript. JSDoc types where a contract needs them.
- **Relaxed: "one .html file" → one `index.html` + `assets/` folder.** Dev serving needs a static
  server (`file://` blocks module imports) — ship `tools/serve.js` (node, zero deps). A single-file
  build (`tools/bundle.js` → `dist/eigenwobble.html`, inlining modules + GLSL) is a *late* deliverable,
  not a constraint on the architecture.
- Every visual parameter traces to `MS` (or an explicit test pin via `CARD.fix`) — never to a hidden
  timer or magic constant. Muted audio must visibly idle. Scene auto-changes fire only on musical events.
- The mathematics must be *correct to someone who knows it* and *legible to someone who doesn't*.
- 60 fps first; every scene respects the adaptive-quality knobs in `Q`. Landing card → click to start
  (demo synth or tab capture), then no chrome, cursor hidden. `d` HUD, `f` fullscreen, `m` monitor,
  `1–9` force scene, `0` auto.
- **Parity with v3 is the acceptance for the extraction.** Not "looks similar": same `#test` timeline
  ⇒ `MS` fields numerically equal within tolerance at 1 Hz, and screenshot pairs at T≈6/14/20 s that a
  montage shows as the same image. The NAV scene is the one Toma likes best — it must survive intact.

## The context-window discipline (this is the point of the project)
Bake these into `docs/CONTRACTS.md` and enforce them in `tools/check.js`:
1. **One required read.** A scene / effect / analysis-stage author reads `docs/CONTRACTS.md` and the
   folder they're writing. Nothing else. If a contract can't be understood without opening
   `assets/core/`, the contract is wrong — fix the doc, not the reader.
2. **Module cap ≈ 350 lines** (GLSL template strings count). `check.js` warns above 350, fails above
   500. The v3 "many statements per line" style is *not* carried over — normal formatting, one
   statement per line, `//` comments allowed again.
3. **Core is closed.** `assets/core/*` and `assets/engine/*` change only in a phase whose goal is to
   change them. A scene never patches the core; if it needs something new, it goes through a slot
   declared in the contract (see §1.4).
4. **Worker sessions own leaves.** You (this session) stay hands-on for architecture, core, engine and
   parity. Scenes, effects, harness ports and test runs are delegated to worker subagents with a brief
   that contains *only* the contract doc + their target folder + the acceptance command. If a worker
   comes back saying it needed to read the core, that's a contract bug — log it in `docs/CONTRACTS.md`'s
   "friction" section and fix the doc.

## Target layout
```
index.html                      landing card, <canvas>, one <script type="module" src="assets/main.js">
assets/
  main.js                       boot: engine → core → registry → loop. ≤120 lines.
  engine/                       THE MUSIC ENGINE — audio in, MS out. No GL.
    audio.js                    AudioContext graph, analysers, AudioWorklet tap, sources plug in here
    sources/capture.js          getDisplayMedia tab capture + silence watchdog (v3 startCapture/watchCapture)
    sources/demo.js             v3 demo synth (126 BPM, intro/groove/break/build/drop)
    sources/demo-synapse.js     synapse's 6-style synth (house/halftime/dnb/ambient/fakeout/aba/mix)
    sources/fake.js             v3 fakeMusic: deterministic 24 s #test timeline, drives MS directly
    features.js                 v3 extractor: updateMusic/tempoEstimate/slowAnalysis/identifySection → MS
    features-synapse.js         synapse Analyzer stages grafted in (§2)
    feats.js                    FEATS glossary: every MS field {eli5, formula, kind, range} — the schema
    groove.js                   GROOVE rotator (drift + sway + nod)
    schema.d.ts / JSDoc         MS typedef — the contract scenes program against
  core/                         GL + composition. Knows nothing about any specific scene.
    gl.js                       context, program builder, ERRS, render targets, resize, tri(), tex()
    quality.js                  Q: adaptive iter/scale, bench()
    post.js                     effect chain runner (fb → bloom → comp) driven by effects/ registry
    scenes.js                   SC: registry, pickScene scoring, crossfade (mixs), forced/sticky, events
    look.js                     COMMON palette (hue/pal/tint) + synapse mood palette (valence/arousal)
    hud.js                      HUD + keys + landing card
    harness.js                  window.CARD, CARD.fix, #test/&scene=/&baby=, CARD.log, bench
  math/                         pure functions, node-importable, no DOM
    mandel.js                   extC/buildRayGrid/GRID, rootOf/rayAngles/bulbCenter/solveMult/BULBS
    baby.js                     cardChart/centreNewton/buildBaby/misiType/MISI/BABIES
    hopf.js                     (§4) Hopf fibration, Clifford tori, stereographic projection
  scenes/
    nav/      index.js nav.js shaders.js      NAV + DRUM interior + PiP + critical orbit (v3 scene 0/4)
    dust/     index.js shaders.js             synapse swarm (particle dust)
    mandala/  index.js shaders.js             synapse mandala
    torus/    index.js shaders.js             new
  effects/  feedback.js bloom.js composite.js (ca+glitch+kaleido+flash)  [later: exposure.js morph.js]
docs/  CONTRACTS.md  HARNESS.md  ENGINE.md  DECISIONS.md
tools/ serve.js cdp.js check.js parity.js monitor.js montage.py accept.sh test_baby.js test_misi.js test_scenes.js
dist/  (bundle output, gitignored until §6)
```

---

## How to verify (constantly — you cannot eyeball shaders from code)
Port `tools/cdp.js` first (§0). It drives headless Chrome over CDP and saves screenshots you Read as
images. Changes from Cardioid: it takes a **URL** (`http://localhost:PORT/?…#test&scene=0`) instead of
`FILE=`; `tools/serve.js` must be running (have `cdp.js` spawn it if not). Keep: steps `{wait}`,
`{eval}`, `{shot, clip}`, `{click:[x,y]}`, `{key}`, `awaitPromise`; env `GPU=1` (real GL; unset =
SwiftShader), `NOAUTO=1`, `FAKECAP=1`. An empty hash defaults to `test` — pass `real` for the real
start path.
- `#test` = deterministic fake music (24 s loop: sustain 0–6 → valley 6–10 → build 10–13 → DROP at
  13 → peak → valley 21–24). `#test&fake=0` = real extractor on the demo synth. `&scene=N` forces a
  scene (**0-based**, sticky). `&demo=house|dnb|…` picks the synapse synth. `CARD.fix={…}` pins `MS`
  fields every frame after extraction. `window.CARD` exposes `MS, NAV, SC, Q, FX, ERRS, GROOVE, log,
  goScene, bench, setBaby, GRID, SCENES, ENGINE`.
- **Always finish every phase with the real start path**: hash `real`, `NOAUTO=1`, click the demo
  link, then assert no non-finite numbers anywhere in `CARD.MS` and `CARD.ERRS` empty. v2 first
  shipped a black screen because a pre-click NaN latched into the EMA state and `#test` hid it.
- `tools/check.js` after every edit: `node --check` on every `assets/**/*.js`, dead-uniform grep
  (every `uniform` in a GLSL string must have a matching `u('…')`/`getUniformLocation`), module line
  caps, and a grep that no file outside `assets/core|engine` imports from `assets/core/gl.js` directly
  (scenes get `gl` handed to them).
- Math goes in node first. Because `assets/math/*` are real modules, `mathlib.js`'s string-slicing
  hack dies: `test_baby.js`/`test_misi.js` just `import`. Keep them green.
- `tools/monitor.js` (continuity monitor: flags per-frame jumps of `NAV.c` normalised by baby size
  unless `pathCut≤2` / kick just rose / mode changed) is the single most important NAV invariant.
  Port it and run it in every NAV acceptance.
- Save acceptance shots under `tools/accept/v0.1/`.

### Known pitfalls (already paid for — don't pay again)
- `gl.POINTS` vanish in an offset viewport on ANGLE-GL (fine in SwiftShader): the PiP path is drawn
  in-shader via `uPath[32]`. Dust draws POINTS full-viewport, which is fine.
- `smoothstep(a,b,x)` with a>b is undefined. Never name a GLSL variable `gl_*`.
- `readPixels(UNSIGNED_BYTE)` returns black from RGBA16F targets — use RGBA8 for CPU readback.
- Headless Chrome frame pacing sinks `Q.q` on any scene; don't read `Q.q` as a perf verdict —
  `CARD.bench(id,n)` micro-benchmarks with `readPixels` sync.
- A per-iteration `sin(atan)` in a unified shader sank `Q.q` to 0 — gate per-method work on uniform
  branches, or keep shaders per scene (we do).
- Module scripts are strict mode. v3 code leans on sloppy-mode globals (`frameN`, `COMMON`, `TEST`,
  `HASH`…); expect ReferenceErrors on first run and fix them with explicit imports, not `window.x`.
- v3's dead field: `MS.level` is declared and never read. v3's `FS.mixs` becomes reachable again in
  Eigenwobble (v3 collapsed scenes 0/4 to one base so crossfades never fired) — test the crossfade.
- Synapse-side (found while mapping, not in its notes): swarm's `VS_SWARM` writes NDC z on a 0.1–10.1
  range while its line renderer uses 0–24 and a different focal length — its Hopf-fibre overlay never
  depth-tests correctly; mandala's shader ignores `camPix()` so camera roll/offset are silently
  dropped; `uLineGain` is written twice per draw; its demo synth uses `Math.random()` noise so runs
  aren't bit-identical ("judge on 2+ runs").

---

Six deliverables, in order. Ship each verified before starting the next. Commit each.

## 0) Scaffold + harness + NAV lifted verbatim — parity with v3
Goal: Eigenwobble renders v3's NAV scene (id 0, with DRUM as its interior mode) from `index.html` +
modules, and `tools/parity.js` proves it.

- Lay down the layout above. `docs/CONTRACTS.md` starts as a stub that you grow through §1.
- Cut v3 along its existing sections into the modules named above. **Lift, don't rewrite**: same
  algorithms, same constants, reformatted only. Drop TUNNEL/TONGUES/LOEWNER/KLEIN: shaders 647–728,
  sims 521–576 (keep `GROOVE` 577–587), Maskit math 206–228, `VS_LN/FS_LN`, Maskit PiP, `renderScene`
  branches 1/2/3/5, `test_maskit.js`/`test_klein_de.js`.
- NAV's closure (from the map — verify against the file): all of math 74–204; `NAV` 437–519 incl.
  `bulbChart/babySwap/navDrop/updateNav`; the Koenigs drum `modes[4]` built from `MS.peaks` in
  `renderScene` id 0 (850–852); `FS.julia`, `FS.mandel` (PiP), `VS_PT/FS_PT` (critical orbit,
  `B_ORB`), post chain `FS.fb/down/blur/comp` (+`FS.mixs`); `PIP` springs; the 96-sample `NAV.path`
  ring with `pathCut` weights → `uPath[32]`.
- `MS` fields NAV and its frame read (put this list in `scenes/nav/index.js` as `feats:[…]` — it is
  the first instance of the contract): `interval repeat seed beat beatPhase beatCount dropEvt
  dropStrength dropEnv intensity build suspension presence harmUnw harmAngle harmVel arc onset
  hitStrength hit eS eM eMax tension resolveEvt bass mid high peaks regularity surprisal surpriseEvt
  sectionId sectionEvt identifyEvt bpm bassFast clarity` plus `GROOVE.rot/vel` and `SC.drum`.
- **Undeclared `MS` fields v3 creates at runtime** — declare them in `schema`: `highM buildPk liveT
  arcT surRaw repeat _susHi`.
- `tools/parity.js`: runs `cardioid3.html` (via `FILE=`, old cdp semantics — keep a copy of the old
  cdp as `tools/cdp-legacy.js`) and Eigenwobble on `#test&scene=0`, dumps `CARD.MS` at 1 Hz from both
  for 24 s, diffs every numeric field (tolerance 1e-9 for the fake path — it is deterministic — and
  prints max abs diff per field), and takes shots at T≈6/14/20 from both into one montage. Then the
  same for `#test&fake=0` with tolerances loosened (the demo synth is real audio; assert `bpm`
  within 1, `arc` sequence identical, drop times within 0.5 s).

**Acceptance:** parity montage indistinguishable at 6/14/20; `MS` fake-path diff = 0 for every field;
`monitor.js` reports 0 violations over 60 s of `#test&fake=0`; `CARD.ERRS` empty on `#test`,
`#test&fake=0`, and the real start path; `check.js` green (caps, dead uniforms, imports);
`test_baby.js`/`test_misi.js` green via plain `import`; frame time at 1280×720 `GPU=1` within 5 % of
v3 (`CARD.bench(0)` both sides).

## 1) The contracts — make the seams real
Goal: `docs/CONTRACTS.md` is sufficient for a worker who has never seen the core to add a scene or
an effect. Prove it by having a worker do exactly that (§3 uses this).

1. **Scene contract** (`assets/scenes/<name>/index.js` default export):
   ```
   { name, id, tag,                       // tag = one-line for HUD/help
     feats: ['bass','tension',…],         // every MS field read — checked at load against feats.js
     score(MS, NAV, SC) → 0..1,           // pickScene contribution; may return 0 = never auto
     cuts: 'continuous'|'onset'|'event',  // what the scene promises about discontinuities
     init(ctx)   // ctx = {gl, mkProg, tri, tex, targets, Q, log} — everything a scene may touch
     update(dt, MS, GROOVE, LOOK)         // CPU state; may write scene.rt = {c, label, …} for HUD/PiP
     draw(target, {scale, w, h})          // render into the given target only
     post: {fb:{decay, zoom, rot}, bloom:{thr, gain}, ...}  // per-scene effect params, or a fn of MS
     overlay?(w,h)                        // post-composite, scissored, direct to screen (NAV PiP)
     help: {eli5, why, math}
   }
   ```
   Scenes get a `ctx`, never the module namespace of `core/gl.js`. Shared GLSL (`HEAD` uniforms
   `uRes uTime uBands uBeat uArc uHarm uPal uTint`, `pal()`, `hsv()`) is a string exported from
   `core/gl.js` and injected by `mkProg` — document the exact uniform list.
2. **Engine contract** (`docs/ENGINE.md`): `MS` typedef from `feats.js`; the rule that scenes read and
   never write `MS`; the source interface (`{start(audio), stop(), name}`); how a new analysis stage
   registers (`engine.addStage(fn(frames, MS, dt))` — stages run in registration order, each may only
   *add* fields it declares in `feats.js`, never overwrite another stage's fields; `check.js` verifies
   the declared-vs-written sets by running `#test` and diffing `Object.keys(MS)` against `FEATS`).
3. **Effect contract** (`assets/effects/<name>.js`): `{name, order, uniforms:{…}, glsl, params(MS,
   FX, scene.post) → uniform values, targets: [...]}`; `core/post.js` runs them in `order`.
4. **Slots, not patches.** Whatever a lifted scene needed from the core that wasn't in the contract
   (e.g. NAV's `SC.drum` uniform fade, the PiP scissor, `Q.iter` ×1.6 inside a baby) becomes a
   declared slot in the contract, not a special case in the core.
5. `docs/HARNESS.md`: every command a worker needs, copy-pasteable, with the expected output.

**Acceptance:** NAV is re-expressed through the contract with zero special-casing in `core/scenes.js`
(grep: no `nav` string in `core/`); parity from §0 still holds; a worker subagent given *only*
`CONTRACTS.md` + `HARNESS.md` writes a trivial "solid colour from `bass`" scene into
`assets/scenes/_probe/` that auto-registers and renders — then delete it. Log every question the
worker had to ask in the friction section and fix the doc.

## 2) Merge the two music engines into one
Cardioid's extractor and synapse's Analyzer are ~85 % different code with the same demo-synth DNA.
Toma's call: **one engine, richer than either** (not two engines behind a switch). Do it as stages.

Synapse's engine lives at `synapse2.html` 129–584 (fenced `/*<<ANALYSIS*/ … /*ANALYSIS>>*/`): own
radix-2 FFT with Hann 131–145 · `Band` 146–159 · `Onset` 160–174 · `Tempo` 175–215 (comb/PLL with
hysteresis + rival-tempo arbitration) · `Analyzer` 217–494 · `AudioEngine` 501–522 (AudioWorklet tap
`synapse-tap`, AnalyserNode fallback, OfflineAudioContext mode) · `makeDemo` 526–583. Everything lands
in one global `A` (105–128). Its `A` fields → std140 UBO map is at 596–658 / 1557–1588.

- **Canonical = Cardioid** for every concept both compute. `bpm/beat/beatPhase/regularity` stay v3's
  autocorrelation tempo; `dropEvt/dropEnv/dropStrength` stay v3's; `sectionId/identifyEvt` stay v3's.
  Parity from §0 must not move by a single bit on the fake path and must stay within §0's tolerances
  on `fake=0`.
- **Additive from synapse**, each a stage in `engine/features-synapse.js` (split the file if it
  passes the cap), declared in `feats.js` under its own names so nothing collides:
  - `key`, `mode`, `keyConf` — Krumhansl–Kessler over 3-timescale chroma (396–404). Cardioid has
    chroma already; feed synapse's finder from Cardioid's `chroma[12]` if the scales match, otherwise
    run its own.
  - `bar`, `barPhase`, `phrasePos`, `phraseConf`, `gridTrust`, `beatConf` — the 16/32-beat grid
    (175–215 + the grid code in `Analyzer`). It may *listen* to v3's beat but not replace it.
  - `novelty`, `boundaryEvt`, `sectionReturn` — Foote novelty + 23-dim per-beat fingerprint
    clustering (417–475). Compare with v3's 17-dim `identifySection`; keep both, note in
    `DECISIONS.md` which one scenes should prefer and why.
  - `dropExpectedIn`, `dropConf`, `fakeoutEvt` — phrase-snapped drop anatomy (340–371).
  - `valence`, `arousal` — mood plane (406–409) → `core/look.js` mood palette.
  - `flow`, `flowBass/Mid/High`, `level`(synapse's, rename `lvl` — v3's `level` is dead, delete it),
    `kick`, `snare`, `hat`, `sub`, `kickCount`, `alive`, `resolve`, `dirty`, `punchy`, `centroid`,
    `flux`, and the `riser/roll/swell/hush` events. These are what DUST and MANDALA read.
  - Textures the synapse scenes sample: `uSpec` (R8 256×1 log-spectrum), `uWave` (R8 512×1),
    `uHist` (R8 256×128 ring, one row per frame). Engine exposes the arrays; `core/gl.js` owns the
    textures and uploads when `engine.frame()` reports a new hop.
- Audio graph: v3 uses two AnalyserNodes (2048 fast, 8192 slow); synapse taps raw frames through an
  AudioWorklet and does its own FFT. Merged graph: keep the analysers for v3's stages (parity), add
  the worklet tap for synapse's stages, single `AudioContext`, one `engine.frame(dt)` that runs all
  stages. `sources/demo-synapse.js` ports `makeDemo` (it is already `A`-independent) and is selected
  by `&demo=<style>`; `sources/demo.js` stays the default so `fake=0` parity holds.
- Every new field gets a `feats.js` entry with the three depths (ELI5 · what it drives · formula).
  `check.js` fails on any `MS` key without one.

**Acceptance:** §0 parity unchanged; `#test&fake=0&demo=dnb` shows `bpm` 174±1 and `key` stable
within 8 s (synapse's own notes: dnb `dropConf` is often 0 on the first drop — record, don't fix);
`&demo=house` shows `bar`/`phrasePos` locking within 2 bars; `#test` (fake path) leaves every
synapse-stage field finite and idle (fake.js must set sane defaults for them — extend the fake
timeline with a plausible `flow`/`kick`/`valence` so DUST/MANDALA have something to react to
headlessly); `Object.keys(MS)` == declared `FEATS` keys exactly; engine CPU cost per frame
(`CARD.ENGINE.ms` EMA) under 1.5 ms at 60 fps on `GPU=1`.

## 3) DUST and MANDALA — lifted from synapse, through the contract, by workers
Both are fullscreen-independent of synapse's camera/UBO/director; they need only the merged engine
from §2 and the contract from §1. **Delegate each to a worker subagent** whose brief is:
`CONTRACTS.md` + `HARNESS.md` + `ENGINE.md` + the synapse line ranges below + the acceptance. You
review the result with screenshots and the parity of *your* NAV (regression check).

- **DUST** (synapse scene 4 `swarm`): `VS_SWARM` 848–883, `FS_SWARM` 884–887, `GLSL_COMMON` 592–686
  for the helpers it uses (`hash11`, `pal`, `ang`), formation logic `form()` 851–860 (Fibonacci sphere ·
  torus · 3-arm galaxy · waveform ribbon, cross-faded per particle with a hash-staggered smoothstep),
  CPU state `formA/formB/formT/formKick` (1431, `reform` 1456, drop 1468, every-64-kicks 1488, `formT`
  integration 1506). `gl.drawArrays(POINTS, 0, count)` with *no VBO* — everything from `gl_VertexID`;
  `Q.PARTICLES = [20000, 45000, 90000, 150000]` by tier, `uCount` normalises brightness. Additive
  `ONE,ONE`, clears colour+depth. It is the highest-trail scene (`trails 0.90` → feedback decay ~0.95):
  declare that through `post.fb.decay`, don't fake it in-shader. Reads: `flow flowMid bassS midS
  level kick drop tension hat time res angular alive` + palette + `uSpec` (per-particle frequency
  ownership) + `uWave` (ribbon). Drop its Hopf-fibre line overlay (broken depth, see pitfalls) —
  §4 does Hopf properly.
- **MANDALA** (synapse scene 2): `FS_MANDALA` 769–798 + `GLSL_COMMON` helpers. N-fold angular fold
  (`N = 4 + 2⌊hash·5⌋` ∈ {4,6,8,10,12} from the section seed), 7–10-iteration box-fold/inversion
  `z = abs(z)/clamp(dot(z,z)) − c; z = R·z` with the spectrum injected per iteration (785), orbit-trap
  glow, spectrum ring, centre kick flare, vignette. Writes `gl_FragDepth = 1`. Reads: `res seed
  kickCount flowMid flow bass bassS midS kick tension drop level high hat quality alive angular` +
  palette + `uSpec`. Synapse damps the post-kaleidoscope to 0.6 on this scene (1535) — express as
  `post.kaleido: 0.6`. Its 24-cell wireframe overlay is optional; skip unless cheap.
- Both scenes' `score()` must make them auto-pickable on real music (`#test&fake=0` 60 s shows all
  three of NAV/DUST/MANDALA), and the `mixs` crossfade must look right between a POINTS scene and a
  fragment scene (DUST clears depth — check the crossfade targets).
- Mapping synapse's palette: synapse's `hue/sat/bri/spread/invert` are director state driven by
  valence/arousal + section seed. Put that in `core/look.js` as `LOOK.mood` alongside v3's
  `COMMON.hue/pal`; NAV keeps reading the v3 palette (parity), DUST/MANDALA read `LOOK.mood`.

**Acceptance:** shots at T≈6 and T≈14 on `#test` for both (they must visibly react to the drop at 13),
plus 3 shots across a 60 s `&demo=house` run; `ERRS` empty; NAV parity montage from §0 re-run and
unchanged; `check.js` green including the 350-line cap per file (split `shaders.js` from `index.js`);
each worker's brief and friction notes saved under `docs/workers/`.

## 4) TORUS — new scene, sacred geometry that is real geometry
Toma asked for "a toroid trippy viz (think spiritual geometry)". Default design (refine if a
different reading produces a *more distinct* image, and say so):

**Hopf fibration.** S³ ⊂ C² fibres over S² by circles; stereographic projection to R³ sends the fibres
over a latitude circle of S² onto a Clifford torus, each fibre a Villarceau circle. Nested tori for
nested latitudes — the classic "torus field" image, except every circle here is a genuine fibre.
`assets/math/hopf.js`: fibre(θ,φ,t) → R³, torus radii for a latitude, the Hopf flow
`(z₁,z₂) → (e^{iψ}z₁, e^{iψ}z₂)`, and a second SO(4) rotation that is *not* the Hopf flow (so the
picture can tumble). Test it in node: fibres over distinct base points never intersect (sample
min-distance > 0), each fibre is a circle (planarity + constant radius to 1e-9), Villarceau
circles lie on the torus (|distance to torus surface| < 1e-9).

**Rendering.** Like DUST, geometry from `gl_VertexID`: K fibres × N points, drawn as POINTS (and
optionally as instanced line quads once `core` grows a line renderer — not in this milestone). Tier
scales K·N like `Q.PARTICLES`.

**Music → geometry (all through `MS`):**
- The 12 pitch classes are 12 base points on S² at equal longitude spacing; `chroma[k]` sets that
  fibre family's brightness and its latitude (louder pitch class → nearer the equator → fatter torus).
  The chroma vector literally *is* the torus.
- `interval` (circle-of-fifths, the same feature NAV uses to choose bulbs) picks the (p,q) of a
  highlighted torus-knot fibre traced by the melody — mathematically coherent with NAV.
- `beatPhase` advances the Hopf flow ψ (every circle rotates in place, in lockstep — the "breathing");
  `GROOVE.rot` drives the second SO(4) rotation (tumble); `bass` → tube radius pulse; `tension` →
  stereographic pole offset (the picture pinches toward the pole as roughness rises); `dropEvt` →
  collapse to the core circle over one beat and bloom back out; `valence/arousal` → `LOOK.mood`.
- `cuts: 'continuous'`. `score()` favours `clarity` high and `regularity` high (harmonically clear,
  steady music), never auto-picks during `arc==='build'` (that's NAV's parking time).

**Acceptance:** node tests for `hopf.js` green; shots at T≈6/14 on `#test`; a 30 s `&demo=ambient`
run shows the torus family visibly re-shaping with chroma; `bench` within budget at tier 2; a
first-time viewer can be told "every ring is one fibre of the Hopf map" and the help entry says why.

## 5) Director polish + effects registry proven
- `core/scenes.js` `pickScene` rescored for four scenes (NAV home/build-park/drop; DUST needs `flow`
  or `punchy`; MANDALA `regularity`+`onsetRate`; TORUS `clarity`+`regularity`). Keep v3's precedence:
  forced → drop hard-cuts to NAV → low presence drifts to NAV → build parks in NAV → otherwise
  event-gated soft switches (`surpriseEvt` hard, `identifyEvt`/32-beat/`landed+4` soft), ≥8 beats
  between switches. Add synapse's two good director ideas as *options* in `DECISIONS.md`, implement
  the first: (a) look memory — a recognised section (`identifyEvt` with `repeat`) restores its scene
  *and* its DUST formation / MANDALA N; (b) beat-quantised actions when `gridTrust>0.5`.
- Prove the effects registry by adding **one** new effect as a worker task: synapse's GPU
  auto-exposure (`FS_LUM`/`FS_EXPO` 1225–1236, 16×16 → 1×1 ping-pong, no readback) as
  `effects/exposure.js`, off by default, on for DUST. Worker gets only the contract + those lines.

**Acceptance:** 60 s `#test&fake=0` auto-picks ≥3 distinct scenes; a 3-minute `&demo=aba` run
returns to the A-section's scene on the return; exposure on/off screenshot pair for DUST;
NAV parity unchanged.

## 6) Bundle + docs + handoff
- `tools/bundle.js`: inlines `assets/**/*.js` (resolve imports in dependency order into one IIFE or
  an inline `type="module"` with an import map of `data:` URLs — pick the simpler one that works in
  file://) → `dist/eigenwobble.html`. `cdp.js` against the bundle must pass the §0 real-start-path
  check and the `#test` parity.
- `docs/DECISIONS.md` complete: every deviation from v3/synapse, every "canonical vs additive" call
  from §2, the toroid design choice, the friction log outcomes.
- Update the memory note; write `NEXT-SESSION-PROMPT.md` for v0.2 (candidates: line renderer in
  core, synapse's morph transition as an effect, synapse's julia/feigen/polytope scenes as workers,
  the v4 config-panel/help idea rebuilt on `feats.js`).

---

## Working style
- Small increments; screenshot after every visible change; `tools/check.js` after every edit; commit
  per deliverable with a one-line "what parity says" in the message.
- **You** write core/engine/contracts/parity and review. **Workers** write scenes, effects, harness
  ports, and run long test sweeps. Brief a worker with the minimum (contract + target + acceptance);
  never paste the core into a worker prompt. If you catch yourself about to open `cardioid3.html`
  or `synapse2.html` a second time for a range you already lifted, stop — the module you wrote is
  now the source of truth.
- Never modify `cardioid3.html` or `synapse2.html`. A v3 bug that blocks parity gets fixed in
  Eigenwobble *and* listed in `DECISIONS.md` with the parity tolerance it required.
- When the spec is wrong or a scene idea doesn't produce a *distinct* image, change it and say so.
  Four different-looking scenes beat four faithful ones.
- Finish with: the summary of deviations, `tools/accept/v0.1/` shots (montaged), the real start-path
  check on both `index.html` and `dist/eigenwobble.html`, the memory-note update, and
  `NEXT-SESSION-PROMPT.md`.
