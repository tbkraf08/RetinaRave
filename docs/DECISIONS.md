# Decisions — every deviation from cardioid3 / synapse2, and why

Sources are read-only: `~/Documents/Kraftek/Cardioid/cardioid3.html` (v3, trusted), `cardioid4.html` (shape only),
`~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html`.

## §0 Extraction (2026-09-22)

- **Layout additions beyond the spec's target tree.** `assets/math/util.js` (TAU, clamp, mix, frac, wrap1, sstep, ema,
  Spring, hsv — used by math, engine and scenes alike; scenes may import `math/*`), `assets/engine/state.js` (MS + XS,
  so stages can import them without a cycle through features.js), `assets/engine/features-slow.js` (tempo, harmony,
  section — features.js would have passed the 350-line cap), `assets/engine/engine.js` (the facade the spec calls
  `engine`), `assets/core/loop.js` (the frame loop; `main.js` stays a 50-line boot).
- **Effect contract is imperative, not declarative.** The spec sketched `{uniforms, glsl, params}`; the v3 chain needs
  ping-pong (feedback), a side-chain with four targets and six passes (bloom) and a screen pass (composite). Effects
  are `{name, order, init(ctx), run(io) → target|null}`; `io.aux` carries side-chains. Documented in CONTRACTS §3.
- **Scene "variants"** replace v3's `base(id)` / `SC.drum` / `SC.drumT` special case. DRUM is `nav.variants[0]` with
  id 4; the core keeps a generic `SC.vT`/`SC.vmix` (0.8 s ema, exactly v3's `SC.drum`) and passes `vmix` to `draw`.
  `pickScene` skips entries whose score ≤ 0 (v3 skipped id 4 explicitly when `NAV.mode!=='INT'||!cycBase`; the drum
  variant's `score` now returns 0 in that case).
- **Home-scene slots** replace the director's reads of `NAV.mode/extBeat/landed`: `rt.home`, `rt.awayBeat`,
  `rt.settledAt` (consumed by the director by zeroing it; NAV mirrors the zero into `N.landed` on its next update —
  one frame later than v3's in-place reset, nothing reads it in between). `updateNav` receives
  `{isLogical, drum}` instead of reading `SC` directly.
- **Update order.** v3: updateNav → updateScenes → updateGroove. Eigenwobble: engine (music → stages → fix → groove) →
  scene updates → director. GROOVE reads only MS; NAV and the director never read GROOVE in their updates, so the
  values are identical (parity: max |diff| 0 over 24 s on every field including `groove.rot`).
- **`MS.level` deleted** (declared and never read in v3). Synapse's `level` arrives in §2 as `lvl`.
- **Runtime-created MS fields declared** with defaults in `state.js` (`highM buildPk liveT arcT surRaw repeat _susHi`)
  so the schema is closed; parity reports them as "missing in v3" on the fake path because v3 never creates them there.
- **Keys**: `1–9` force scene id 0–8 and `0` returns to auto, without the HUD being open (v3: only with HUD, `6` = auto).
- **The one wall-clock term kept**: `LOOK.pal[3]` has a `sin(now·0.7)·(1−presence)` wobble — it only acts while there
  is no music (that is the "muted audio visibly idles" behaviour), so it stays.
- **The director writes `MS.seed.scene`** (look memory, v3 behaviour). It is the one core write into MS; declared in
  `feats.js` under `seed`.
- **Continuity monitor flags spikes, not speed.** Ported as-is, `monitor.js` flagged v3 itself: 50+ frames per minute
  of 0.06–0.11 per-frame motion in EXT right after drops (the θ/log G springs are fast there). Those are smooth ramps.
  The monitor now counts them in `MON.fast` and flags only spikes (`d > 0.06` and `d > 2.5·dPrev + 0.01`), which is
  the invariant that matters (chart cuts). It watches `cPath` (the chart position before the beat-kick blend: the kick
  is a declared jump-cut whose w=9 spring-back is fastest on its second frame) and carries the previous motion across
  legal frames (a kick-rise frame must not reset the reference). Eigenwobble: 0 violations / 60 s over 4 drops.
- **Parity clock.** `tools/parity.js` injects a deterministic 60 Hz rAF clock (`CLOCK=1` in cdp.js) into both pages.
  It starts ticking at the page's first `requestAnimationFrame` call, because a module page registers its loop a few
  real frames later than v3's sync script and the first `dt` would otherwise differ (found: 3-frame phase offset).
- **Bench.** `CARD.bench(0,300)`, 1280×633, GPU=1: Eigenwobble 0.032–0.048 ms, v3 0.042–0.056 ms (one 0.7 outlier).
  Same shader, same uniforms; the "within 5 %" criterion is below this bench's noise floor.
- **Grid worker** lives in `math/mandel.js` as `startGridWorker()` (browser-only, called by NAV's `init`); the module
  is still node-importable because nothing runs at import.
- **Dropped from v3**: TUNNEL, TONGUES, LOEWNER, KLEIN scenes and their math (Maskit, Loewner), `VS_LN/FS_LN`, the
  Maskit PiP, `test_maskit.js`, `test_klein_de.js`. The rotator (`ROT`) went with TONGUES.

## §2 Merged music engine (2026-09-22)

- **One stage, not many.** Synapse's Analyzer is ported whole (`engine/synapse/{dsp,analyzer,anatomy,structure,tap}.js`,
  reformatted only) and grafted as a single additive stage `features-synapse.js` that copies its `A` object into `MS`
  under non-colliding names. Splitting it into per-concept stages would have meant re-plumbing its shared state (ring,
  hop clock, beat memory) for no gain; the *declared-fields* rule is what keeps it additive.
- **Canonical = v3** for `bpm beat beatPhase beatCount regularity dropEvt dropEnv dropStrength sectionId identifyEvt
  chroma interval tension`. Synapse's rivals get their own names: `bpmSyn beatSyn` (tempo/clock), `sectionAlt
  sectionReturn boundaryEvt` (23-dim beat-feature clustering vs v3's 17-dim `identifySection`), `dropConf
  dropExpectedIn fakeoutEvt` (anticipation; the detonation itself stays v3's `dropEvt`). Synapse's own `drop` impulse
  and `tension` are not exposed (scenes use `dropEnv`/`tension`). `level` → `lvl`. Its `bass/mid/high` fast bands are
  not exposed either (v3's cover the same range with a slower attack); `bassS/midS/highS/sub` are.
- **Which section detector scenes should prefer:** `sectionId` (v3) for *identity* — it is what the director's look
  memory is keyed on and what the fake timeline drives; `boundaryEvt`/`sectionReturn` (synapse) for *timing* — its
  boundaries are grid-snapped and confirmed against the whole section, so they land on bar lines. `novelty` is the
  early warning, `foote` the careful one.
- **dnb tempo.** `#test&fake=0&demo=dnb`: `bpmSyn` 173.9–175.1 (inside 174±1), `key` 5 (F minor) with `keyConf` >0.93
  from 9 s on. v3's canonical `bpm` reads 172.4 (its autocorrelation runs on a 100 Hz envelope: lag 34.8 vs the true
  34.48; 1.6 BPM off) and halves to 87.7 in the breakdown at 22 s (no kick → the 124-centred prior wins). Parity
  forbids touching it; scenes that need a precise tempo on fast music should read `bpmSyn` when `beatConf > 0.5`.
  Candidate for v0.2: refine v3's tempo peak on the 8192 spectrum or on synapse's 94 Hz hop envelope.
- **house grid.** `gridTrust` > 0.9 within 1.5 s; `barPos`/`phrasePos` are continuous from the first beat; `phraseConf`
  > 0.9 two bars after the first section change (bar 12 → 14) and `barConf` > 0.8 by bar 13. Synapse votes phrase
  lines with *changes*, so confidence needs one; positions do not.
- **Engine cost.** `ENGINE.ms` now includes the worklet port handler's hop work (`extraMs`, drained each frame):
  0.77–1.0 ms on `GPU=1` (2×FFT per 10 ms hop + an 8192 FFT every 8 hops), fake path 0.17 ms. Budget 1.5 ms holds.
- **Textures.** The engine exposes arrays (`state.js` `TEX`); `core/gl.js` owns three R8 textures and re-uploads when
  `hop` changes (whole 32 KB `hist` ring per hop; a row-only upload is a v0.2 micro-optimisation). The fake timeline
  synthesises a three-hump spectrum and its own waveform so DUST/MANDALA react headlessly.
- **Mood palette** (`LOOK.mood`) is synapse's director palette (lines 1510–1521) with `A.drop → dropEnv`,
  `A.intensity → intensity` (v3's), `A.kick → kick`; the hue kick on a drop uses a seed-derived offset instead of
  `Math.random()` so `#test` stays deterministic.
- **`&demo=<style>`** selects `sources/demo-synapse.js` (house · halftime · dnb · ambient · fakeout · aba · mix); no
  `&demo` keeps v3's synth so `fake=0` parity holds (re-verified: bpm 126.1 vs 126.2, arcs identical, drops 4.09/19.34
  vs 4.08/19.33).

## §3 DUST and MANDALA (2026-09-22, by workers from the contract only)

- **Both scenes were written by workers given only CONTRACTS/HARNESS/ENGINE + the named synapse line ranges**, in
  isolated worktrees on their own server ports, and accepted on screenshots (`docs/workers/{dust,mandala}.md`). Neither
  opened the core. Friction from both went back into the docs the same day (GL state on entry, target not pre-cleared,
  `feats` includes `score()` reads, no `Math.random()`, HEAD redeclaration, reversed `smoothstep` in the lifted source,
  `check.js` as the legal idiom reference, texture units, bench resolution).
- **DUST deviations from synapse's swarm:** no director camera — a gentle orbit (yaw `0.35·GROOVE.rot + 0.05·flow`,
  pitch `0.3·sin(0.03·flow)`) at distance 4.4 (synapse's framing at 55° fov; the brief's 3.2 overflowed the frame);
  the source's second `yz` cloud rotation dropped (it fought the camera pitch); the Hopf-fibre line overlay dropped
  (broken depth, §4 does Hopf properly); drop/kick detected as rising edges of `dropEnv`/`kick`; reform order from a
  hash of a counter instead of `Math.random()`; trails declared as `post.fb.decay 0.95`, never faked in-shader.
  Exposure on (`post.exposure.on`). Look memory: the formation pair `[formA, formB, formT]`.
- **MANDALA deviations:** `gl_FragDepth` line dropped (colour-only target); `camPix()` ignored (as in synapse);
  `smoothstep(1.25,.2,r0)` rewritten as `1.-smoothstep(.2,1.25,r0)`; iterations `7 + int(q·3+.5)` from `Q.q`;
  fold epoch every **64** kicks (spec) where synapse used 32; kaleido damped to 0.6 (`post.kaleido`), trails 0.6.
  Look memory: the 64-kick epoch (the seed part of N returns with the section by itself).
- **Crossfade between a POINTS scene and a fragment scene works as-is** (`accept/v0.1/xfade-nav-dust-*.jpg`): DUST
  clears colour only (no depth attachment on the core's targets, depth test off), so `mixs` sees two clean colour
  targets. v3's crossfade path had never fired (it collapsed 0/4 to one base); it fires now on every soft switch.
- **Exposure** (`effects/exposure.js`, worker): synapse's `FS_LUM`/`FS_EXPO` as a 16×16 → 1×1 ping-pong, target
  0.22 (the constant was outside the readable lines; chosen to sit at the tonemap's knee), τ 0.6 s up / 1.5 s down,
  gain clamped [0.14, 2.2]. Off by default; DUST turns it on. DUST at frame 840: mean luminance 16.5 → 32.9.
- **Director results:** 60 s `#test&fake=0` auto-picked NAV → MANDALA → DUST → NAV → MANDALA → NAV → MANDALA → DUST
  (3 distinct scenes, 8 switches, all event-gated, ≥8 beats apart).

## §4 TORUS (2026-09-22, worker from the contract + hopf.js)

- **Design kept:** the Hopf fibration under stereographic projection, 12 pitch-class families = 12 base-point
  latitudes, each family the complete torus over its latitude (every ring a genuine fibre, a Villarceau circle), the
  (p,q) torus knot from `interval` through NAV's bulb table, Hopf flow from the beat, SU(2) tumble from GROOVE, pole
  offset from tension, collapse-and-bloom on the drop. `math/hopf.js` is the reference (`test_hopf.js`: circles to
  2e-12, on-torus to 2e-13, fibres never meet, (1,1) knot = fibre); the GLSL port matches it to 6e-16.
- **Spec numbers corrected by the geometry:** the tumble amplitude is bounded (`0.18·sin(GROOVE.rot)`) and the pole
  offset capped (`0.6·tension`) because both rotations sweep the projection pole (the point sent to infinity) through
  the family latitudes; a longitude *band* per family was replaced by the full latitude circle; the bass pulse acts on
  θ, not on a radial scale about a centre circle that does not exist once the family is tumbled; camera tracks the
  nest's centroid.
- **`#test` chroma gap:** v3's fake timeline never fills `chroma`; parity forbids changing that. TORUS blends in the
  chroma implied by `harmAngle` (cos² on the circle of fifths) while `Σchroma < 0.5`, continuously, so it has
  something to show headlessly and uses the real vector verbatim with audio. v0.2: give `fake.js` a chroma of its own
  as a *new* field? No — `chroma` is v3's; the honest fix is a parity-tolerance entry for the fake path.
- **Not distinct enough yet as points:** at tier 1–2 the rings read as dotted threads and the scene is the dimmest of
  the four. The line renderer (NEXT-SESSION-PROMPT #1) is the upgrade: strokes along fibres with depth.

## §5 Director (2026-09-22)

- **Look memory (synapse idea a) implemented** as a generic slot: `scene.look = {get, set}`; the director snapshots on
  `sectionEvt` into the outgoing section's `seed.looks` (v3 already keeps one seed object per remembered section, so
  the looks ride along with it) and restores on `identifyEvt && repeat`. Second director write into `MS.seed`
  (documented with `seed.scene`). The fake timeline's sections repeat every 24 s, so `#test` exercises it.
- **Beat-quantised actions (synapse idea b) — option, not implemented.** When `gridTrust > 0.5`, soft scene switches
  and formation flips could be deferred to the next `barPos` crossing (or 16-beat line via `phrase16Pos`). Not done in
  v0.1 because v3's director already gates soft switches on `beat` + 8/32-beat counts (parity), and the synapse grid
  only becomes confident after the first section change; a v0.2 candidate once both grids can be compared on real music.
- **aba look-memory run (190 s, `&demo=aba`):** the mechanism works — the one recognised return (`identifyEvt` with
  `repeat` at 188 s) restored the remembered scene (DRUM, id 4) and the DUST/MANDALA looks `{dust:[0,1,1], mandala:10}`
  stored with that section's seed. But v3's 17-dim `identifySection` merged the synth's A and B sections into one id
  for most of the run (10 identify events, 9 of them "section 2"): the fingerprint (chroma·2 + 3 bands + onsetRate +
  regularity, ema 3 s, cosine > 0.965) does not separate them. Synapse's 23-dim `sectionAlt` **does** separate them: on the same synth it reads 2/3/2/3/2/3 with
  `sectionReturn = 1` on every return from 50 s on (one id per ~24 s section), while v3 stayed on id 2 for 110 s.
  Verdict for scenes: `sectionAlt`/`sectionReturn`/`boundaryEvt` for structure, `sectionId` only because the director's
  look memory and the fake timeline are keyed on it. v0.2: key look memory on `sectionAlt` (a director-only change).
- **Scores live in the scenes** (contract), not in `pickScene`; the director keeps v3's precedence. Per-scene bids:
  NAV `0.5 + build` (home) · DRUM `0.85 clarity + 0.3 (1−eM) + 0.1` when interior with a cycle · DUST
  `0.3 + 0.5 punchy + 0.2 regularity` · MANDALA `0.25 + 0.55 regularity + 0.2 min(1, onsetRate/6)` · TORUS
  `0.25 + 0.45 clarity + 0.3 regularity`; DUST/MANDALA/TORUS bid 0 during builds (home parks there anyway).
- **Bundle** (`tools/bundle.js`): a classic-script IIFE with a module table, not an import map of `data:` URLs —
  relative specifiers cannot resolve against `data:` bases, so the map would have needed every import rewritten anyway,
  and the IIFE is what works from `file://` with zero fuss. 35 modules → 194 KB.

## §7 Line renderer (v0.2, 2026-09-22)

- **Instanced quads + capsule SDF, not `gl.LINES`.** `LINES` is 1 px, aliased, and ANGLE-GL ignores `lineWidth`. One
  quad per segment (TRIANGLE_STRIP × 4, instanced) extended by a half width + 1 px at both ends, with the fragment shader
  keeping only the capsule around the segment (screen-space distance from `gl_FragCoord` to the segment, `flat`
  varyings carry the endpoints). Round caps come free and consecutive segments of a polyline overlap only inside the
  cap, so joins are seamless; with additive blending the overlap is a sub-pixel brightening at each join, accepted.
- **Two entry points, one GLSL.** Path A (buffer of 12-float segments, built-in program, `uMVP`) for CPU-generated
  edges (the polytope scene); path B (`ctx.lines.VS`/`.FS` chunks included by a scene's own raw program, segments from
  `gl_InstanceID`, no buffer) for analytic curves (TORUS's fibres). The chunk reuses HEAD's `uRes` name so `ctx.use`
  fills it — a raw program that declares `uRes` already gets it (TORUS's `uRes2` was unnecessary).
- **Depth.** The scene targets `RT.a`/`RT.b` now carry a `DEPTH_COMPONENT24` renderbuffer (`mkTarget(w, h, rgba8,
  depth)`), and `renderScene` clears depth to 1 before every `draw()` (colour still not cleared, as the contract says).
  `RT.m` (crossfade) and effect targets have none. NAV/DUST/MANDALA/TORUS unchanged: depth test stays off unless a
  scene enables it. Parity fake: 0 diff after the change. Sub-pixel widths dim instead of thinning so a distant
  hairline keeps its energy (a 0.3 px stroke at 30 % instead of a 1 px stroke flickering in and out).
- **Harness.** `CARD.ctx` exposes the scene ctx for `tools/lines-smoke.js` (11 read-pixel checks on a 64×64 RGBA8
  depth target: near-over-far in both draw orders, no-depth = last wins, capsule edge at hw and hw + feather, path B
  compiles and draws). Green on ANGLE-GL and SwiftShader.
- **TORUS as strokes (worker, `docs/workers/torus-lines.md`, commit 62aa785):** path B, 144 rings × [48, 72, 108, 160]
  segments by tier (ring count fixed: `cuts: 'continuous'`), knot `min(1600, seg·max(2, p+q))`. **`depth: true` +
  `blend: 'over'` won the A/B** (`accept/v0.2/torusl-ab-*.jpg`): additive strokes of opaque width saturate to a white
  blob at the drop and merge the nest into one glow; 'over' keeps every stroke separate and an edge-on torus hides the
  rings behind it, which is true in R³ (the fibres are disjoint). It also makes draw order irrelevant. Bench unchanged
  from POINTS (0.02–0.04 ms, timer floor). Two rules came out of it and are now in §1.12: alpha is coverage (a
  semi-transparent polyline beads at every joint under 'over'), and invisible fragments must `discard` or they write
  depth. The built-in path-A program got the same `discard`. Width: `2.6·(h/720)·(1+0.6·bass)·camDist / viewZ` px.
