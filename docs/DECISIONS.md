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
  forbade touching it in v0.1; scenes read `bpmSyn` when `beatConf > 0.5`. **Superseded by §9 (v0.2):** `bpm` is now
  within ±1 on every style and octave-stable; `bpmSyn` stays as the rival only.
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

## §8 POLYTOPE (v0.2, 2026-09-22, worker from the contract + brief, `docs/workers/polytope.md`)

- **Scene id 5**, `ctx.lines` path A: the regular 4-polytopes (tesseract 16/32, 24-cell 24/96, 600-cell 120/720,
  120-cell 600/1200 vertices/edges) built from their coordinates with nearest-neighbour edges, unit-normalised onto S³,
  double-rotated (xy, zw, + xw) by `flowBass/flowMid/flowHigh`, edges subdivided **and renormalised onto S³** — the
  stereographic map is a central projection, so a straight 4-D chord projects to a straight line; only samples on the
  sphere bend into the great-circle arcs the picture is about (synapse's `poly4` did the same on its line 1149+, which
  the brief's range omitted; the worker derived it). Segments fade through alpha as they approach the pole
  (`den > 0.16` gate, `(den − 0.16)·3.5` ramp) and over view depth 0.35→1.25 near the camera (no pop at the near
  plane, where `ctx.lines` drops `w ≤ 0` segments whole).
- **Cast by section seed** (`floor(seed.a·3)`: tesseract ⊂ 24-cell · 600-cell · 24-cell ⊂ 600/120-cell), re-cast only
  on `sectionEvt` with a one-second cross-fade of both casts; look memory = the cast index. Subdivisions per tier
  `[3, 4, 6, 8]` (600/120-cell `[2, 3, 4, 5]`), peak 6.5 k segments, cap 16 k; bench 0.07–0.52 ms.
- **Deviations from the brief:** gain ×1.8 (the brief's `0.75·(0.35+lvl)` peaked at 0.37; synapse carried a 0.45
  floor and a 1.5 "star" factor); `presence` enters as `0.15 + 0.85·presence` so muted audio idles visibly (§0) instead
  of going black; width is 2.2 px at the orbit centre (× eye distance ÷ view depth). Deterministic: frame-360 shots
  byte-identical (`md5 dfdeba3b…`), no `Math.random()` (jitter from a hash of `seed.a` and a counter).
- **Polish for later:** edges crossing near the pole leave long straight streaks off-frame at t6 (`accept/v0.2/
  poly-t6.jpg`); a tighter pole gate at low `den`, or fading by projected segment length, would calm them.

## §9 Tempo refinement (v0.2, 2026-09-23) — `engine/tempo.js` replaces cardioid3's `tempoEstimate`

- **What changed and why.** v3's estimator autocorrelated the 100 Hz onset envelope over lags 30–102, picked the
  integer peak under a 124-centred prior with a 3-point parabola, and switched after three agreeing votes. Measured
  on the demo styles (traces in `accept/v0.2/tempo-*-before.txt`) it was 1.7 BPM low on dnb (lag grid), halved to
  87.6 inside the dnb *groove* (the 2-beat lag wins once the ¾ hats enter), locked 116 (the 1.5-beat lag) in builds,
  never read halftime (75 → 95 → 70 → 147), drifted to 133 on fakeout and 129 on aba, and wandered 114–151 on
  beatless ambient with `regularity` 0.8. Same envelope, same window, same PLL; the estimator is new:
  1. **ACF over lags 8–410** (32nd notes at 200 BPM up to two bars) — the extra lags are what the comb, the
     refinement and the gates read. 396 lags × ≤ 792 products every 0.5 s.
  2. **Harmonic comb on a 0.25-sample grid**: `comb(l) = acf(l) + 0.6·acf(2l) + 0.3·acf(4l)` (linear-interpolated),
     times v3's prior *re-centred on 130 BPM* (σ 0.55 octaves, strong form). Not synapse's gentle `0.55 + 0.45·pr`
     and no sub-harmonic term: on v3's bass-weighted envelope every beat multiple of dnb reads ≈ 0.45 and halftime's
     1-beat lag is a quarter of its 2-beat lag (measured ACF at 14 s: dnb 34: .47 68: .50 102: .51 137: .41; halftime
     42: .11 84: .46 169: .40), so only the prior separates 174 from 87 and 140 from 70 — and 124 is the geometric
     mean of 87 and 176, which is why v3's centre could never decide dnb. A sub-harmonic term rewards the slower level
     whenever the beat is strong, so it is out.
  3. **Sub-lag precision from the harmonics.** The parabolic vertex of the ACF peak near k·P (k = 1, 2, 4) estimates
     the period with k× the precision of the fundamental; the estimates are averaged with weight k·height (a harmonic
     below 0.3 of the fundamental's height, or more than 0.75 samples off, is skipped). At 174 BPM the k=1 parabola
     lands ±0.3 samples (±1.5 BPM); the k=4 vertex at lag 137.9 lands ±0.08 (±0.4 BPM). Linear interpolation of the
     envelope at fractional lags (the prompt's option a) is pointless: it is the same as interpolating the ACF, whose
     piecewise-linear maximum is always at an integer.
  4. **Evidence gates.** `regularity` and every tempo update read the *family* evidence `y1 = max(acf(P), acf(2P),
     acf(4P))` (halftime's beat lives at 2P; with `acf(P)` alone halftime read `regularity` 0.15) scaled by the grid
     contrast `best comb / mean comb` (7–22 on a beat, 2–3 on pads → `sstep(2, 5)` → `regularity` ≈ 0 on ambient,
     which is the semantic v3 meant and never delivered: it read 0.8 there). Tracking and switching need
     `contrast > 4` and `y1 > 0.15` (white noise over 800 samples peaks near 0.1). An unrelated switch also has to
     beat the current tempo's own comb score by **25 %** (synapse's rule): a 16th/32nd-note build lights every lag
     equally and its comb winner — three or six grid steps, 171 at 128 or 116 at 174 — beats the beat by 2–10 %, so
     the old tempo holds through it. A sub-multiple gate ("the family must beat acf(P/2), acf(P/4) by 30 %") was
     tried first and rejected: house's off-beat bassline makes its 8th-note lag as strong as the beat, so the gate
     blocked house's own tracking (lock took 10 s) while the build's 3-step winner sailed through (its P/2 falls
     between the grid's peaks).
  5. **Relation-aware switching.** Within 6 %: track (ema 0.3). Otherwise the candidate votes (5 % agreement) and
     needs: unrelated → 3 votes (2 once the current lag has collapsed below half the candidate's height); a metrical
     relative (½, 2, ¼, 4, ⅓, 3, ⅔, 3/2 — **not 4/3**: 128 → 174 is one and must switch fast) → refused while the
     current lag is alive (the current tempo explains it), 16 votes (8 s, the whole window) for a slower one once it
     has collapsed, 4 for a faster one; and a tempo that has seen 16 estimates of solid evidence (`y1 > 0.3`)
     without being confirmed — and whose own lag is dead; a tempo whose lag is alive explains its relatives and does
     not age — lets anything through with 3 (a real change to a related tempo takes ≤ 8 s).
  6. **High-pass and loudness normalisation** of the window (1 s running mean removed, 2 s running RMS divided out,
     warm-started at the window's mean power so a silent start is not amplified): a build's rising ramp or a pad swell
     is otherwise a trend whose ACF decays with lag, which is what tipped the build's 3-step winner over the beat. The
     silence gate stays on the raw energy. **Recency taper** (oldest samples at half weight) so a cut drains from the window a little faster; **the ring is
     filled from the raw rAF clock** (`features.js`: `min(now − envNow, 0.5)` instead of the clamped `dt`): a stalled
     headless frame used to shrink the ring's seconds and read the tempo *high* (fakeout 130, halftime 141–147 in
     parallel runs). Both only feed the tempo ring and the comb-phase target.
- **Before / after per style** (`GPU=1 tools/tempo-trace.sh`, 50 s, `bpm` at 1 Hz; steady range, then events):

  | style (true) | before (v3) | after |
  |---|---|---|
  | house 128 | 128.0–128.4 | 128.0–128.3 from 9 s; lock 1 s; hush 128.0 |
  | halftime 140 | 75.3 → 95.0 → 70.5 → 95 → 145–147.8 (never within 1) | 139.7–140.4; lock 3 s; `regularity` 0.5–1.0 |
  | dnb 174 | 172.3; **87.6** 15–27 s; 173; **88** 32–34 s; **116** 42–50 s | 173.0–174.0 (one 172.8 at the breakdown's floor); lock 2 s; build 173.6–173.9; `bpmSyn` is the one that wanders (168–180) in the breakdown now |
  | fakeout 128 | 128.2–129.9, **131–133.5** from 39 s | 127.9–128.2 through the build, the fake-out hush and the return |
  | aba 124 | 124.3–129.6 (B section 128.5) | 124.0–124.2 (B section 124.1) |
  | ambient — | 114–151 wandering, `regularity` 0.6–0.96 | **124.0 constant**, `regularity` ≤ 0.21 |
  | mix (360 s) | 128 → 171.5 (2 s after dnb) → **87.5** at 144 s; → **116** → 139 (5 s); halftime 143 → 133 → 75 → 70 → 92; aba in 3 s | 128.1 → 172.1 (1.5 s after dnb; 173.8 through both dnb breakdowns and builds) → 138.3 (1.5 s after halftime, 140.0 by 7 s) → 124.1 (2.5 s after the direct cut); no wrong vote in 360 s |

  Earlier iterations of this phase (recorded because each was measured): a plain comb + gentle prior locked dnb at
  87/116; the strong 130-centred prior fixed that and halftime; the family evidence fixed halftime's `regularity`;
  the raw-clock ring fill removed a +1–7 BPM headless bias; the high-pass alone did not stop the build-end 4/3 vote
  (fakeout 171 for 12 s, dnb 116 after its build); the sub-multiple gate blocked house instead; the 25 % margin over
  the current tempo's score plus loudness normalisation is what holds. The synth uses `Math.random()`: judge on two
  runs, and never with more than two Chrome instances at once (HARNESS "Tempo traces").
- **Unit test** `tools/test_tempo.js`: a 60 Hz frame clock with ±1 ms jitter, one flux value per frame (each hit a
  2-frame triangle, amplitudes ±30 %, noise floor 0.05), the ring filled exactly as `features.js` does. Patterns are the
  synth's; dnb is calibrated to the measured ACF (beat multiples ≈ 0.45, 1.5/2.5-beat lags ≈ 0.17 — the first model,
  with the synth's nominal kick/hat amplitudes, read 116 like v3 did; the bass-weighted flux is what makes dnb's
  beat level ambiguous). Reads 120/128/140/174 within ±0.5 from 10 s, holds through a 6 s gap, holds 124 on pads
  with `regularity` < 0.3, picks 174 up 1 s after a silence and 5 s after a direct cut from 128. In `npm test` and
  `accept.sh`.
- **Parity.** `parity.js fake` is unchanged at **0 diff**: the fake path writes `bpm = 124` itself and never runs the
  estimator (`ENGINE.frame` skips `updateMusic` under `fakeOn`), so no tolerance was added. `parity.js real` compared
  `bpm` to v3's within 1; on v3's 126 BPM synth v3 reads 126.0–126.2 and the new estimator 126.2, so the criterion
  is now "both within 1 of 126" with the numbers printed (sweeps: ew 126.20–126.21, v3 125.80–126.00). Arcs and drop times still match (the drop detector reads `bassFast`/energy; `bpm`
  enters only `dropEnv`'s decay and the crossfade duration).
- **Cost.** `ENGINE.ms` (`GPU=1`, dnb, 25 s): back to back on the same machine state, single Chrome, three runs each —
  new 1.65 / 1.73 / 1.77, old 1.83 / 1.85 / 1.90 (the machine was loaded by then; earlier the same day, idle, the same
  pages read old 0.74–0.91 and new 0.67–0.85 in the trace runs). The new estimator is not the more expensive one: the
  ACF is 5.4× v3's products but runs once per 0.5 s (≈0.25 ms per call), which the per-frame EMA barely sees. Budget
  1.5 ms holds on an idle machine; the absolute number is machine load, not the estimator.
- **Semantics kept:** `beat`, `beatCount`, `beatPhase` (comb PLL, its gain now from the family evidence), `regularity`
  (steadier meaning: 0 on pads, unchanged on beats). `bpmSyn` stays the rival; ENGINE.md no longer recommends it.
- **Not done / open:** a 3:2 tempo change with the old lag still alive takes up to 8 s; the two-vote fast path only
  fires once the old lag has collapsed. A tempo below 59 or above 200 BPM is read at an octave (LMIN/LMAX unchanged).
