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
- **Which section detector scenes should prefer:** `sectionId` (v3) for *identity* in v0.1 — it was what the director's
  look memory was keyed on and what the fake timeline drives; `boundaryEvt`/`sectionReturn` (synapse) for *timing* — its
  boundaries are grid-snapped and confirmed against the whole section, so they land on bar lines. **v0.2 §10:** the
  director's memory is keyed on `sectionAlt`; `sectionId` remains the seed key (palette offsets, score noise). `novelty` is the
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
- **Beat-quantised actions (synapse idea b) — done in v0.2, see §10.** Soft scene switches wait for the bar line while
  `gridTrust > 0.5` (formation flips inside scenes are still the scenes' own business).
- **aba look-memory run (190 s, `&demo=aba`):** the mechanism works — the one recognised return (`identifyEvt` with
  `repeat` at 188 s) restored the remembered scene (DRUM, id 4) and the DUST/MANDALA looks `{dust:[0,1,1], mandala:10}`
  stored with that section's seed. But v3's 17-dim `identifySection` merged the synth's A and B sections into one id
  for most of the run (10 identify events, 9 of them "section 2"): the fingerprint (chroma·2 + 3 bands + onsetRate +
  regularity, ema 3 s, cosine > 0.965) does not separate them. Synapse's 23-dim `sectionAlt` **does** separate them: on the same synth it reads 2/3/2/3/2/3 with
  `sectionReturn = 1` on every return from 50 s on (one id per ~24 s section), while v3 stayed on id 2 for 110 s.
  Verdict for scenes: `sectionAlt`/`sectionReturn`/`boundaryEvt` for structure, `sectionId` only because the director's
  look memory and the fake timeline are keyed on it. v0.2: look memory is keyed on `sectionAlt` (§10).
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
  (v0.2's `den > 0.16` gate, `(den − 0.16)·3.5` ramp — **superseded** by the pole worker: `GATE` 0.24 with the ramp reaching 1 at 0.4457, `poly4.js`; two workers copied the old numbers from here before v0.9 corrected this line) and over view depth 0.35→1.25 near the camera (no pop at the near
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

## §10 Director on synapse's structure (v0.2, 2026-09-23) — look memory on `sectionAlt`, soft switches on the bar line

- **A. Look memory is keyed on synapse's `sectionAlt`.** `SC.mem[alt] = {scene, looks}` is filed when synapse declares
  a boundary (`boundaryEvt`) under the *outgoing* id (`SC.prevAlt`, last frame's `sectionAlt`) with the scene on
  screen — or the one already decided and held for the bar line (B) — and every scene's `look.get()`. It is read when
  synapse identifies a return: `sectionAlt` changes with `sectionReturn = 1`. Synapse identifies 4–8 beats *after* the
  boundary (`structure.js identify()`: ≥ 4 beat-frames for a return, ≥ 8 for a new section), exactly the shape of the
  fake timeline's 2.2 s `identifyAt`, so `SC.altOpen` closes at the boundary and reopens when the id lands: nothing
  is filed or looked up in the gap (the stale id belongs to the section that just ended). Before synapse has identified
  anything (`sectionAlt < 0`) v3's seed still carries the memory (`sectionEvt` saves, `identifyEvt && repeat`
  restores, `seed.scene` lookup) — so the real start path and a page without the worklet behave as in v0.1.
  `S.seed.scene` is still written on every event-branch switch (declared; the fake path keys coincide).
  - *The filed scene is the one the section ended on*, not the one last chosen in it (the prompt left this open). A
    section that never switched (v3's `seed.scene` stays −1 → `pickScene`) or whose last visit ended in a park still
    gets a definite scene; on the fake timeline the two readings coincide in every section (measured: identical scene
    sequence, below).
  - *The return trigger is sticky* (`SC.due`): v3's `surpriseEvt` fires a hard cut at nearly every synth section change
    (aba: 13 in 190 s), ~2 s before synapse identifies the return, and the 8-beat spacing then swallowed the restore
    (first after-run, kept as `director-aba-aonly.txt` — A alone, hold off: 7 restores of the looks, 0 switches to the
    remembered scene, the section's scene only came back with the next phrase/settled trigger). The owed switch stays a trigger
    until the precedence gates open (precedence itself unchanged), and is cleared at the next boundary.
  - **Measured, `&demo=aba` 190 s** (`accept/v0.2/director-aba-{before,after}.txt`, `tools/director-stats.js`): synapse
    recognises 7 returns from 50 s on (ids alternate A/B every ~24 s; v3's `sectionId` sits on 2–3 for the whole run).
    Before: 0 restores. After: **7 restores of 7**, 7 `return`-triggered switches, scene sequence A/B-periodic
    (`… 2 1! 4 2! 1 4! 2 1! 4 2! 1 …`: the hard cut at the boundary, then the section's own scene back on the bar line).
    house 120 s: 4 returns → 4 restores. mix 360 s: 11 returns → 11 restores (8–11 per run; the synth is random).
    The `#test` fake timeline: 11 returns in 72 s → 11 restores (0 before — see the engine fix below), scene sequence
    identical to v3's.
- **B. Soft switches land on the bar line.** An event-branch decision (`identifyEvt`, return, phrase, settled) with
  `gridTrust > 0.5` is held (`SC.pend`, one slot: a later decision replaces the target, the deadline stands) until
  `barPos` wraps — for the phrase trigger until the bar line that opens a 16-beat phrase (`phrase16Pos < 4`; synapse
  picks `o16` on the `o4` grid, so that is a bar line too — the first version waited for a `phrase16Pos` wrap alone
  and landed at barPos 1.17 once when the anchor re-voted). Cap 4 beats (16 for phrase); a decision taken within 0.1
  beat after a line fires at once; `gridTrust` falling to ≤ 0.5 while waiting fires at once; a drop, a surprise, a
  forced scene, low presence or a build (home parking) cancel it. `SC.quantise = false` (harness `QOFF=1`) restores
  the immediate switch. Hard cuts, parking and the crossfade are untouched; `pickScene` and `goScene` untouched.
  - **Engine fix (a deviation from "nothing in the engine"):** the first after-run landed at barPos 0.21–0.27, not
    < 0.1. `structure.js grid()` refreshes `A.barPos/phrasePos/phrase16Pos` every 16 hops = 160 ms (0.33 beat at 124),
    while `A.beat` is per frame. `features-synapse.js` now derives the three positions per frame from `A.beat` and the
    anchors `o4/o16/o32` (the way it already computed `S.bar`); the fields mean what `feats.js` says. MANDALA's fold
    rotation (the other `barPos` reader) gets a smooth position instead of a 6 Hz staircase.
  - **Measured landings** (`SWITCH@t -> id bar<pos> gt<trust> (held N beats, <trigger>)`, on the line = barPos < 0.1
    or > 3.9): aba 8 of 8 on the line (held max 4.0, mean 1.7 beats); house 5 of 5 (max 3.3); mix 9 of 9 with
    `gridTrust > 0.5` plus 2 immediate at `gridTrust` 0.10 (the ambient hand-over, by rule); fake 9 of 9 (max 3.8,
    mean 1.6). Before: 1 of 8 (aba), 1 of 6 (house), 1 of 16 (mix), 1 of 12 (fake) — v3's triggers are on its own
    beat count, ~2.8 beats off synapse's bar on aba. One more rule came out of the mix trace: a phrase hold (16-beat
    cap) replaced by an identify decision used to inherit the 4-beat cap retroactively and fire mid-bar (141 s, barPos
    1.03); the tightened cap now counts from the new decision, and a wrap must land at barPos < 0.5 (a grid re-vote in
    the dnb hand-over can jump the position anywhere).
- **Second engine fix, found by the fake trace:** `synapseStage` reset `boundaryEvt/fakeoutEvt/moodEvt` *before* its
  "no analyzer" return, and the stage runs after `fake.update`, so on `#test` the fake mirror's `boundaryEvt` was
  wiped every frame (nothing had consumed it before). The reset now follows the return. Parity unaffected (v3 has no
  such fields).
- **Parity decision.** `parity.js fake` forces `&scene=0`, so the director's soft-switch branch never runs there: A
  and B cannot move it, and measured they do not — **0 diff over 72 fields with B on and with B off** (`QOFF=1`, added
  to `parity.js` for exactly this check). No per-field allowance was needed or added. What the `#test` fake timeline
  *does* change without `&scene=` is recorded instead: `director-fake-{before,after}.txt` — same 13-scene sequence,
  the 9 event-branch switches moved onto bar lines by 0.01–1.85 s (≤ 3.8 beats), the 3 home parkings and the drop
  cuts at the same frames. The `monitor 60 s` and the per-scene checks in `accept.sh` run with B on. `parity.js real`
  (v3 synth): bpm / arcs / drops unchanged (the director does not feed back into `MS` except `seed.scene`).
- **Harness.** `tools/test_director.js` (node, stub scenes, scripted MS at 120 BPM / 60 Hz: filing, restore + switch on
  a synapse-only return, bar-line landing, the 4-beat cap on a stalled grid, grid loss, drop cancel, on-the-line
  immediacy, `quantise` off, the owed switch after a hard cut, filing across a held switch) in `npm test` and
  `accept.sh`. `tools/director-trace.sh` + `director-stats.js` (HARNESS "Director traces"). `scenes.js` 250 lines.
- **Left open.** Synapse renumbers section ids when it merges a fresh section into a return or drops the oldest of 24;
  `SC.mem` is not renumbered with it (a stale entry restores the wrong section's look once; the ids then settle). The
  section-return trigger respects v3's 8-beat spacing, so after a surprise hard cut the restore lands 8–12 beats after
  the cut, not at the identification.

## §11 Transition slot + synapse's morph (v0.2, 2026-09-23) — `assets/transitions/`, worker `docs/workers/morph.md`

- **The slot.** The crossfade pass left `core/scenes.js`: `addTransition(tr, ctx)` registers by name, `setTransition(name)`
  picks the current one, and `drawScenes(sw, sh, io)` renders `a`, renders `b`, then hands the transition
  `io = {a, b, m, out, w, h, sw, sh, uvS, MS, FX, GROOVE, LOOK, dt}` (CONTRACTS §5) with BLEND/DEPTH/SCISSOR off and
  `out` (= `RT.m`, no depth) bound at `(sw, sh)`. The transition returns the target the chain starts from; `loop.js`
  builds the `io` and honours `io.uvS = [1, 1]` (a transition that re-rendered the whole target) by starting the chain
  at `(w, h)` — the §3 rule, unchanged in spirit. `SC.m`/`SC.dur`/`goScene`, the director, `visibility`, `postParams`
  and `Q.scale · 0.8` are untouched: `m` is the director's clock and a transition only draws between its ends.
  `scenes.js` 263 lines; no `core/transition.js` was needed.
- **`mixs` as a transition is byte-identical.** The `MIXS` string and its four uploads moved verbatim to
  `transitions/mixs.js`. Proof: the fake timeline's first fade (NAV → TORUS, `SWITCH@3.88`, 116 frames) at frame 290,
  `m = 0.4994`, under `CLOCK=1 GPU=1`: **md5 `4ac523e9770e7d0625d46ed1f3e44769`** before the refactor
  (`trans-before-f290.jpg`, taken twice — identical), after it (`trans-mixs-f290.jpg`) and from `dist/eigenwobble.html`.
  Same `[cur, next, m]` triple. `accept.sh` re-takes the shot on every sweep and compares against the recorded md5.
  Regression net around the moved pass: `parity.js fake` 0 diff / 72 fields, `test_director` and `lines-smoke` OK,
  `director-fake-after.txt` identical to §10's to the line (the clock did not move), `parity.js real` unchanged
  (bpm 126.2 vs v3 125.9, arcs identical, drops within 0.05 s), aba 190 s: 7 restores of 7, 7 of 7 soft switches on the
  bar line, A/B-periodic scene sequence (§10 had 8 switches on one more `return`; the synth is random).
- **`morph` (worker, opus, worktree, 12 min, from CONTRACTS §5 + brief + `mixs.js` + five synapse line ranges).**
  Synapse's `FS_MORPH` with `POST_HEAD` replaced by HEAD, `gl_FragCoord.xy/uR → vUv`, every sample clamped into `[0,1]`
  then scaled by `uUvS` (unclamped, the advected edge reads the stale border of a larger frame), `hash21`/`vnoise`
  brought along in the file. Uniforms `uA uB uUvS uT = (t, MS.flow, MS.kick)`; `MS` reads `lvl kick flow`. One pass,
  four texture reads, six `vnoise`. Deterministic: frame 290 md5 `4775571949db4941443c039930cba15c` across two runs in
  the worktree and again on main.
  - *The musical ease.* `t = max(m, ease)`, `ease = min(1, ease + dm·(1 + 0.18·lvl) + kick·dt·0.12)` with
    `dm = max(0, m − mPrev)`, reset to `m` whenever `m` is not ≥ last frame's (a new fade, or a reversal — the core
    swaps `a`/`b` and sets `1 − m`). At frame 290 `t = 0.589` for `m = 0.499`, `lvl = 0.5`; the fade's last frame
    (`m = 0.9989`) already has `t = 1`. Synapse's push was the whole clock (`trans += dt·rate·(0.35 + 1.3·level) +
    kick·dt·0.9`); here it is a shape on the director's clock, so the visible transition is complete when the core
    drops `b` — the §5 invariant, verified in the trace (`t = 0.0106 → a` everywhere, `t = 1 → b` everywhere).
  - *Deviation from "lifted verbatim": three front constants.* The brief asked for the front to be mid-screen at
    `m ≈ 0.5` so the A/B on one frame means something. The worker showed that cannot be tuned through the ease:
    synapse's front threshold is `n* = (1.05 − 1.5t)/0.9` against a noise field whose mean runs 0.75 (centre) → 0.43
    (corner) at 16:9, so the front crosses the whole frame in `Δt ≈ 0.19` centred on `t ≈ 0.40` — at `t = 0.5`
    (the minimum, since `t ≥ m`) the picture is ~95 % `b`, and the ease only pushes `t` up. Retuned, every term kept:
    `c` aspect-corrected (a round front), the radial weight `.35 → .75`, the sweep `t·1.5 − 1.05 → t·2.1 − 1.65`, and
    `min(length(c), .9)` bounding the radial term so `n ∈ [−0.1275, 1.55]` and `X(t=0) ≤ −0.255 < −0.15`,
    `X(t=1) ≥ 0.335 > 0.15`: exactly `a` at `m → 0` and `b` at `m = 1` at any aspect ratio, no `step()` gate. The
    front now leaves the centre at `t ≈ 0.3`, is mid-screen at `0.5`, clears the corners at `0.73`. The additive edge
    stays at synapse's `.9`: measured 0.000 % pure-white pixels and ≤ 0.008 % single-channel clipping on the four shots.
- **A/B verdict — `morph` is the default** (`main.js`; `mixs` is `&trans=mixs` away and stays the byte-exact
  reference). `tools/accept/v0.2/montage-trans.jpg`: the f290 fade and three `goScene` pairs at `m = 0.499`
  (NAV → MANDALA, DUST → TORUS, POLYTOPE → NAV; recipe in HARNESS "Transition"), `mixs` left, `morph` right. `mixs`
  is a rotating, counter-zooming double exposure: both whole scenes over the whole frame, the incoming one ghosted
  across the outgoing one (on NAV → MANDALA its zoomed chart texture stripes the borders). `morph` hands the frame to
  the incoming scene as a region — TORUS owns the centre with NAV melting into teal bands outside the front, MANDALA
  eats a hole with the bright serrated edge ring, NAV's filigree takes the middle band against POLYTOPE's arcs — both
  scenes recognisable, no border, no white-out; the flow field drags the outgoing scene into filaments, which is the
  synapse look. Cost against taste: the double exposure never lets either scene be read; the front does.
- **Cost, measured** (`CARD.benchTransition(300)`, 1280×720 full resolution, GPU=1 headless, three runs):
  `mixs` 0.55–0.78 ms · `morph` 1.34–1.54 ms per pass (≈ 2×), against NAV 2.7–2.9 ms and TORUS 2.2 ms for a scene
  pass (`CARD.bench`). During a fade the pass runs at `0.8 · Q.scale` (≈ 0.36 of the area at `scale = .75`), so the
  transition adds well under a millisecond to two scene passes — the budget holds.
  - *Harness finding on the way:* the worker's first numbers were 0.016 ms for both and it flagged them as not
    physical. `CARD.bench` and `benchTransition` synced with `readPixels(…, UNSIGNED_BYTE)` on RGBA16F targets, which
    is INVALID_OPERATION (`getError` 1282; `IMPLEMENTATION_COLOR_READ_TYPE` is HALF_FLOAT) — rejected before it reached
    the GPU, so **no bench before §11 was synced** (they measured submission time; the "quantises at ~1/24 ms" note
    in the memory was this). Both now read FLOAT when `G.FLOAT`; `getError` is 0 after a bench. Earlier `bench` figures
    in this file (§3/§4/§7/§8) are not render times.
- **Harness.** `&trans=<name>` under `#test` (selection only; no branch in the pass), `CARD.TRANSITIONS`,
  `CARD.benchTransition(n)`, `accept.sh` "== transition" (md5 check + the morph shot + `montage-trans.jpg`), `check.js`:
  `assets/transitions/` gets the effects' import rule and the `'nav'` rule. `bundle.js` needed nothing (the folder is
  reached from `main.js`): 49 modules, 286 KB.
- **Worker friction (7, `docs/workers/morph.md`)** → CONTRACTS §5: no `feats`/`frameN` for a transition, who swaps on a
  reversal, the aspect convention, the `'nav'` rule, `CARD.TRANSITIONS.<name>` as the handle; §1 sub-heads reordered.
  The brief's real-path check waited 20 s for a fade that lands at ~23 s on house (fixed to 45 s). Temptations, neither
  opened: `core/scenes.js` (to reach the transition object — solved with `ctx.log`, now `this.t`) and
  `effects/composite.js` (to know the tone curve — solved by measuring the JPEGs). Its per-frame `ctx.log` line was
  dropped on merge (116 lines per fade in `CARD.log`).
- **Left open.** The morph's advection warps stroke scenes (TORUS's ribbons comb mid-fade) — synapse's look, but a
  per-scene `post.morph.flow` multiplier would be the slot for a scene that wants a stiffer front. A reversed fade
  resets the ease to `m` (a small jump of the front on an already jumping frame).
- **Bundle finding (the "starts and fades from `dist/`" check).** `dist/eigenwobble.html` threw `RangeError` in the
  synapse analyzer's `hopStep` on every frame after the first hop — on the real start path too, and on the pre-§11
  bundle as well (179 uncaught exceptions in 3 s). `tools/bundle.js` rewrote `export const SPEC_W = 256, WAVE_W = 512,
  HIST_H = 128;` (`engine/synapse/dsp.js`) with a regex that kept only the first declarator, so `HIST_H`/`WAVE_W` were
  `undefined` in the bundle and the spectrogram ring was a zero-length array. The sweep's bundle line never saw it:
  `CARD.ERRS` holds shader errors only, and the page still answers evals while its frame loop dies inside
  `ENGINE.frame`. Fixed in `bundle.js` (every top-level declarator of a `const/let/var` export goes into the module
  table); `accept.sh`'s real-path and bundle lines now count cdp's `[EXC]` lines (`FAIL N uncaught exceptions`) and
  the bundle line waits 30 s and reports `hop` and whether a switch happened. Verified after the fix: bundle real path
  45 s — 0 exceptions, hops advancing, switches; `test&fake=0` on http and on the bundle: the same phrase soft switch
  at 26.8 s ran the morph to `t = 1`, the rest drop/surprise hard cuts, `ERRS []`; the bundle's f290 `mixs` md5 is
  still `4ac523e9…`. The http page was never affected (native modules).

## §12 The help view (v0.2, 2026-09-23) — `core/help.js`, the `help.feats` slot, orchestrator-written

- **What is shown, and why these four parts.** `?` / `h` opens a DOM overlay (`Esc` closes; `d f m 0–9` keep working):
  (A) the scene on screen — `tag`, the three depths of `help` (`math` collapsed), `cuts` in words, the scene's `hud()`
  line as "developer readout", then one row per field in its `feats` with *name · ELI5 · what it drives here ·
  formula · live value*, and, collapsed, the other fields the engine produces; (B) the director — logical / rendered
  scenes and history, the crossfade (`SC.m`, `SC.dur`, the transition's name), a held switch (`SC.pend` with its
  trigger and the line it waits for), the look memory (`SC.mem` keys → scenes, the current `sectionAlt`), the engine's
  stages and `ENGINE.ms`, the effect chain; (C) the cast — every registered scene and variant with `tag` + three
  depths, the current one marked; (D) the keys. A is the v4 idea ("what is driving what", live) with the row set
  taken from the scene's `feats` instead of v4's mapping table; B is what a listener wonders when the picture changes
  ("why did it switch?"); C is the contract's §0 promise made visible ("correct to someone who knows it, legible to
  someone who doesn't"); D replaces the landing card's hint once the card is gone. v4's Mandelbrot map and SVG
  diagrams were not lifted: they were one scene's story, and here every scene is a peer. The `d` HUD is untouched.
- **`help.feats` is a scene slot, not a table in core.** `FEATS[k].drives` says what a field moves in general; the
  per-scene half ("in DUST, `bassS` fattens the torus tube and dollies the camera in") is knowledge only the scene
  has, so it lives next to its `feats` list (CONTRACTS §1.13) and a worker writing a scene writes both. A table in
  `core/` keyed by scene name would be the special case §1.4 forbids and would rot silently; `check.js` now fails on a
  `help.feats` key that is not in `feats` and warns on a `feats` entry without a line (the help shows the general
  `drives` dimmed in that case, so the gap is visible on screen too), and fails on an empty `help` depth. The rule
  imports the scene modules in node — they reach only `math/*` and their folder, and all five load without a DOM.
  Lines written by reading each scene's `update`/`draw`/shaders (the orchestrator may open scenes): 27 + 13 + 17 + 16 +
  16 = 89 clauses, one visual consequence each, 0 gaps.
- **`feats` reality check, both sides.** NAV declared 38 fields; 11 of them (`harmAngle harmVel eMax regularity
  surprisal surpriseEvt sectionId sectionEvt identifyEvt bpm bassFast`) are read nowhere in `nav/` — v3-era leftovers
  from when NAV was the whole page and the director read through it. Trimmed to the 27 it reads (`high` stays: it is
  `uBands.z` in the circular-trap highlight). Nothing rendered changes (the list is documentation the core validates,
  never a switch); the top table *is* the list, so a stale entry would have been a lie on screen. On the engine side
  `flowHigh` had `drives: '-'` while POLYTOPE reads it (now "the xw turn"), and `wave` said "nothing in NAV" (now: the
  engine's wave texture, DUST's ribbon; no scene reads it from `MS`). Fields nothing reads keep `'-'` and the view says
  "not used by any scene yet". Appendix A regenerated (107 fields).
- **Cost: zero when hidden, by construction and by count.** `drawHelp` is called from `loop.js` right after `drawHUD`
  (so it inherits the `document.hidden` early return) and its first line is `if (!HELP.on) return;`. Nothing is built
  until the first open (the landing card does not pay for it). Open: the event fields are latched per frame (14
  reads, no DOM) so a one-frame event is shown as "● just now" for half a second; the live cells and part B refresh
  every 6th frame like the HUD; part A rebuilds only when `SC.logical` changes. `CARD.HELP.ticks`: **0** after 600
  frames hidden, **100** after 600 frames open. `CARD.bench` back to back (HEAD then the phase, two runs each,
  `test&trans=mixs` at frame 290, 1280×720): NAV 4.66 / 4.60 → 4.57 / 5.40 ms, TORUS 0.66 / 0.56 → 0.64 / 0.62,
  DUST 0.47 / 0.35 → 0.42 / 0.42 — within the run-to-run noise (the bench never touches `help.js`; it measures
  `renderScene`). The overlay itself is the compositor's business: `rgba(4,4,10,.82)` with a 2 px backdrop blur.
- **Nothing the engine or the director decides changed — the checks chosen to prove exactly that.** The §11 frame:
  `trans-mixs-f290` md5 **`4ac523e9770e7d0625d46ed1f3e44769`**, unchanged (help closed). The same frame with the help
  open (`{key:'h'}` before the `until`): `[cur, next, m] = [0, 3, 0.4994]`, the same triple, and `__FRAME` advances
  after the next `{wait}` (290 → 308) — the overlay dims, it does not stop. `parity.js fake` 0 diff (the sweep).
  Coverage by eval, not by eye: `CARD.HELP.rows()` (read back from the DOM) has **107/107** non-internal keys, each
  once, and `rows(true)` equals the scene's `feats` as a set on **all 6 registered ids** (`goScene(id, true)` then
  `rows`). Real start path on `index.html` and `dist/eigenwobble.html` with the help opened and closed: `ERRS []`,
  `nonFinite []`, `[EXC]` 0.
- **One line in `core/scenes.js`** — `export const currentTransition = () => trans;` — a read-only getter for the
  module-local current transition so part B can name it. The alternative (main.js and harness.js each remembering
  the name they passed to `setTransition`) duplicates a fact the registry already owns. No behaviour touched.
- **Harness.** `CARD.HELP` (`on`, `ticks`, `nTop`, `rows(topOnly)`), `accept.sh` "== help" (the two shots
  `help-s0-f120` / `help-s3-f360`, the cast scrolled, `help fields N/N · top table = feats on 6/6 ids`, ticks
  hidden/open, the real path with the help opened and closed and its `[EXC]` count; the bundle line now opens and
  closes it too). `check.js` prints `scenes 5 (help.feats gaps 0)`. Shots in `tools/accept/v0.2/help-*.jpg`.
- **Left open.** The formula column truncates with an ellipsis (the full text is the cell's tooltip); a click-to-expand
  would suit touch. `wave`'s ELI5 still says "the last 2048 audio samples" while DUST samples the engine's 512-wide
  texture — the texture, not `MS.wave`, is what a scene sees (ENGINE.md). A `help.feats` line for a *variant* (DRUM)
  shares the parent's slot; a variant with its own reads would want its own.

## §13 Row-only `hist` upload + `ctx.budget` (v0.2, 2026-09-23, orchestrator-written)

- **The upload.** `uploadEngineTex` (core/gl.js) re-sent the whole 256×128 R8 spectrogram ring (32 KB) on every frame
  in which the engine reported a new hop, although the analyzer writes exactly one row per hop
  (`histTex.set(A.spec, histRow·256)`, `histRow = (histRow+1) % 128`; the fake timeline does the same per frame). Now
  the number of hops since the last upload, `delta = T.hop − ETEX.hop`, is the number of rows to send: the last
  `delta` rows ending at `T.row − 1`, as one `texSubImage2D` of `256×delta`, or two when they wrap the ring's top
  (`rows(128 + start, −start)` + `rows(0, T.row)`), and the whole texture only on the first upload, when `delta ≥ 128`
  (a hidden tab: rAF stops, the worklet does not) or when `ETEX.full` is set. No engine change: `TEX.row`/`TEX.hop`
  were already the ring contract (ENGINE.md now says a stage must advance them together).
- **Bytes over the bus, measured** (`ETEX.bytes`, real synth `test&fake=0`, ~95 hops/s, 60 fps): whole-texture path
  24.08 MB in 1130 hops ≈ **2.0 MB/s**; row path 878 KB in 1134 hops ≈ **73 KB/s** — of which spec + wave (768 B per
  frame, unchanged) are 46 KB/s and `hist` 24 KB/s (256 B per hop). `hist` alone: 32 KB/frame → 256 B/hop, 80× less.
- **Proof.** (1) `tools/hist-check.js` reads the GPU texture back through a framebuffer (R8 is colour-renderable in
  WebGL2; `readPixels` RGBA/UNSIGNED_BYTE, R channel) and compares all 32768 bytes with `ENGINE.tex.hist`: under
  `CLOCK=1` **0 mismatch** at frames 100 and 400 (three wraps of the ring); on the real synth 0 mismatch at four
  checks 3 s apart (hops 282 → 1134). The first real-synth run showed 251–256 mismatching bytes, always in row
  `T.row` — the row the analyzer wrote *between* the frame's upload and the eval (the same count appeared with
  `&histfull=1`, which uploads everything); inside a `requestAnimationFrame` callback, which runs in the frame's own
  task batch, it is 0. HARNESS.md records the recipe. (2) `tools/scene-md5.sh`: every registered scene at frames 360
  and 840 (`CLOCK=1 GPU=1`), ten shots, **md5-identical before and after** — nothing samples `hist` yet, so identical
  is the only acceptable answer; FEIGEN (§15) is the first sampler and its `&histfull=1` equality is the proof that
  the row path renders the same picture. (3) `parity.js fake` 0 diff / 72 fields; the §11 md5
  `4ac523e9770e7d0625d46ed1f3e44769` unchanged at frame 290, `[0, 3, 0.4994]`.
- **`&histfull=1`** (`#test`, `core/harness.js` → `ETEX.full`) keeps the v0.1 whole-texture path one hash param away so
  the FEIGEN proof is an md5 equality between two runs, not an argument about the code.
- **Budgets.** DUST's `TIERS = [20000, 45000, 90000, 150000]` was the only particle table but CONTRACTS §1.4 quoted it
  as "the" budget for any POINTS scene to copy. It is core data now: `BUDGET = {points, segs}` in `core/quality.js`,
  `budget(kind) = BUDGET[kind][tier()]`, on `ctx` as `ctx.budget`. `segs = [2500, 5000, 9000, 16384]` is the stroke
  budget for CPU segment buffers (path A): 16384 is POLYTOPE's `CAP`, the lower tiers sized so a 2 k-segment overlay
  (§14) fits at tier 0. DUST reads `ctx.budget('points')` — same numbers, same `tier()` thresholds, so its ten shots
  are byte-identical (above) and `CARD.bench(1, 300)` before/after is inside the noise (three alternated runs,
  medians 0.92 / 0.73 / 0.33 ms after vs 0.92 / 0.73 ms before; the count is the same number by construction).
  **TORUS and POLYTOPE keep their tables** (`SEGT` segments per ring, `SUB/SUBB` subdivisions per edge): those are
  geometry resolution, not counts — TORUS's ring count is fixed because its `cuts` is `'continuous'`, and POLYTOPE's
  segment count is a product of cast × subdivision that no shared table expresses. §1.4/§1.6 say so.
- **Harness additions:** `tools/scene-md5.sh <tag> [&extra]` (the before/after shot loop as a `diff`, reusable for any
  core change and for §15's determinism check), `tools/hist-check.js`, `CARD.ctx.engineTex.bytes`. `check.js` 0 fail
  / 0 warn after every edit.

## §14 DUST's Hopf-fibre overlay (v0.2, 2026-09-23, worker from the brief, `docs/workers/dust-fibre.md`)

- **What came back.** Synapse's swarm overlay (scene 4: `nl` latitude tori of `nF` Hopf fibres, `N` segments each,
  through its `seg()` with additive glow and a depth test that never worked — dropped in v0.1, §3) as `ctx.lines`
  path A inside `scenes/dust/` (`fibre.js` 92 lines: counts, `emit`, `fit`; `index.js` 181 → 225). The fibres come from
  `math/hopf.js` (`fibre4` → `rotSU2` → `stereo`, the pole gate on `den = 1 − z₄` before projecting: emit when
  `min(den) > 0.14`, brightness × `min(1, (min(den) − 0.14)·4)`, alpha 1 — coverage, §1.12), scaled by `S0·g` with
  `g = (1 − 0.3·tension)(1 + 0.6·dropEnv + 0.08·kick)` and `S0 = 0.7` (0.9 swept out of frame at `dist` 4.4, 0.55 stopped
  reading as rings), drawn after the points into the same target with `{ mvp: this.vp, blend: 'add' }` and no depth
  (the points write none). Counts per tier from synapse's `q = [0.4, 0.7, 1, 1.4]`: 2×7×40 = 560 · 3×8×48 = 1152 ·
  4×10×56 = 2240 · **4×12×66 = 3168** (the brief's "tier 3 = 2240" was tier 2; the worker sized `CAP` from the formulas
  instead of the brief's `mk(2560)`, which would have silently lost 3 of 12 fibres per torus). Brightness per fibre
  `0.3·(0.35 + lvl)·(0.35 + 1.3·b)·alive` with `b = [bassS, midS, highS][l % 3]` per torus (scenes have no spectrum
  array; `chroma` skipped — zero on the fake timeline), palette coordinate `0.15 + 0.22·l + 0.6·f/nF` through DUST's
  mood palette, width `1.5·(h/720)·dist/viewZ` px. `feats` + 3 (`flowBass`, `highS`, `alive` was there), `help.feats`
  updated for every field the rings also move; `look`, `cuts: 'onset'`, `score`, `post`, id untouched.
- **A/B.** `hooks.fibres(0|1)` (`&fibres=0`): the `CLOCK=1` f360/f840 shots with the overlay off are **byte-identical to
  §13's DUST** (`e49cf54e…`, `7119a542…`) — the points path is untouched; with it on, identical across two runs
  (`669aac71…`, `f26d50de…`). `tools/work/dustf-ab.jpg` / `accept/v0.2/s1-t6.jpg`, `s1-t14.jpg`: faint nested arcs
  inside the sphere at t6, linked rings threading the pour at t14, the swarm still the subject, nothing like TORUS's
  144-ring nest; 0.0000 % pure-white pixels on all four shots.
- **Cost — the finding.** `CARD.bench(1, 400)`, interleaved on/off (an all-on-then-all-off sequence was destroyed by
  load drift): tier 0 **0.87 / 0.70 ms**, tier 3 **2.72 / 1.35 ms**, i.e. **+1.37 ms for 3168 segments**; house at
  tier 3 +1.12 ms. A node micro-bench puts `emit` at 0.02–0.11 ms, so ~0.4 µs per segment is `ctx.lines.set` + the
  instanced draw. That is 10× the brief's "~0.1 ms" expectation, which came from POLYTOPE's §8 bench — a number the
  §11 harness finding later showed was submission time, not render time (no bench before §11 synced). §1.12 now says
  0.4 µs/segment and that 50 k is *not* fine. Accepted as is: DUST at tier 3 is 2.7 ms against NAV's 2.7–2.9. Polish
  candidates: a smaller tier-3 count (`4×10×56` is visually the same picture), or a `stride` in `set` for static rings.
- **Friction (9) → docs:** hooks' receiver and timing (§1.4: plain call, before `init`, state on the literal); the
  per-segment cost (§1.12); `SC.hist` and `bench`'s default `n` (HARNESS); the brief's `rotSU2` parenthetical was
  wrong (synapse's `(y, q)` rotation is `poleOffset`, a rotation of S³ that is not in SU(2); the worker kept `rotSU2`,
  which carries fibres to fibres — the better choice, and invisible on screen); DUST has no `presence` read, so the
  rings scale with `alive` like the grains. Temptation not taken: `core/lines.js` (bisected the cost from outside).

## §15 FEIGEN (id 6) and the JULIA decision (v0.2, 2026-09-23, worker from the brief, `docs/workers/feigen.md`)

- **The JULIA question — outcome (c), dropped, on the side-by-side** (`tools/accept/v0.2/julia-vs-nav.jpg`: NAV at t6
  on the fake timeline, then synapse's scene 5 driven headless from `synapse2.html#scene=5&demo=house` at 10 s and
  30 s). Synapse's JULIA is `c = λ/2 − λ²/4` with `λ = ρe^{iθ}` inside the main cardioid: tension drives `ρ → 1` toward
  the parabolic point `θ = 2πp/q` (`PARAB`), the hush holds `ρ = 1`, the drop pushes `ρ > 1` and the set shatters.
  The pictures are the same family to a viewer: a filled Julia set with Green's-function bands (log₂G level sets as
  rays/annuli) outside and DE filaments on the boundary — NAV's exterior at t6 *is* that picture, and its interior
  chart is the multiplier `λ = ρe^{iφ}` of *every* bulb (main cardioid included) with `rho → min(1 − h, 0.985)`,
  `N.par = sstep(0.8, 0.98, ρ)` (nav.js 157–176) and drops that exit through parabolic roots onto landing rays —
  synapse's whole story, generalised. What synapse's colouring adds is the "critical slowing" interior smoulder
  (`slow = clamp(lastStep·40, 0, 1)` brightening the filled set as ρ → 1) — a colouring, not a scene. The director
  argument closes it: synapse used JULIA as *the* build scene ("a build deserves the scene that can implode", line
  1498), and here the home scene owns builds (§4: a build parks home), so a peer JULIA's one narrative could never
  play, and as a NAV variant it would need the chart walk restricted to the cardioid and the parabolic targets — NAV's
  chart code, which this session does not touch. Left as a polish note: NAV could take the smoulder term on `N.par`.
  Ids 7–8 stay free.
- **FEIGEN, what came back** (`scenes/feigen/index.js` 203 + `shaders.js` 96 lines; registration two lines in `main.js`,
  ids table `6 feigen · 7–8 free`). Synapse's scene 6 as written in its header: the real-axis dive toward
  `c∞ = −1.401155189…`, one Feigenbaum factor `δ = 4.6692…` per 32-beat phrase (`feigL += dt/(32·period)·(0.25 +
  1.5·lvl)·(1 − 0.8·tension)·alive`, `period = 60/bpm`, wrapped at `feigMax() + 1` with `feigMax = [3.4, 4, 4.6, 5][tier]`,
  the kick-hidden wrap, `+1` on a drop — a jump by exactly one δ is the self-similarity, so it is nearly invisible),
  perturbation iteration `e' = 2·Z·e + e² + dc` against the reference orbit of `c∞` computed in JS doubles and uploaded
  once as an R32F 512×1 texture with raw `gl` in `init` (`ctx.tex` binds any `{t}`), the tricorn flip `e' = conj(…) +
  dc` **on the section seed** (`floor(seed.a·1000) % 2` at `sectionEvt`; synapse flipped on drops, which here hard-cut
  to home and would never be seen), DE filaments, Green bands, and `hist()` on `ctx.engineTex.hist` with `uHistRow =
  (row − 0.5)/128` — the first scene that samples the spectrogram ring. `cuts: 'event'` (the flip is the one declared
  jump); `score = build ? 0 : 0.2 + 0.4·regularity + 0.25·clarity + 0.15·calm`; `look = [feigL, tricorn]`; hooks
  `&feig=<L>` (also marks the scene as arrived, or the arrival clamp `min(feigL, 1.2)` ate it — the worker's one
  deviation) and `&tricorn=1`; `post {fb .55, bloom .3, kaleido 0}`; `feats` 18 exactly, `help.feats` 18/18.
  `accept/v0.2/s6-t6.jpg` / `s6-t14.jpg`: the whole set at L 0.37, one δ deeper and magenta with the Green bands
  after the drop (L 1.56).
- **The #7 proof.** `CLOCK=1` frames 360 and 840: `7c976ae1…` / `9d859b1f…` across two runs (determinism) **and with
  `&histfull=1`** (the v0.1 whole-texture upload) — equal. The row-delta upload feeds `histM` the same texture; `accept.sh`
  now takes that pair for every scene whose folder mentions `engineTex.hist`.
- **The md5 story (registration).** With id 6 registered the director's first pick on the fake timeline became NAV →
  FEIGEN instead of NAV → TORUS, so the §11 frame-290 shot changed md5 (`585e73b5…` for `[0, 6, 0.499]`) with no
  transition pixel changed. Re-based, as the session prompt required, on the director-blind recipe (HARNESS
  "Transition": `&scene=0`, at frame 120 `SC.forced = −1; goScene(3, false)`, shoot at 178, `m = 0.4994`):
  **`a6e2b8cdcc47316cebb04f5529a26b06`**, identical on two runs on HEAD and on a third run with `main.js` from the
  commit before FEIGEN's registration (the same pixels from the same code), `git diff 8646186 HEAD` empty on
  `transitions/mixs.js` and `core/scenes.js`. `accept.sh` "== transition" and the morph line use the forced pair now;
  the rule in HARNESS: a reference md5 must never depend on a director pick. `parity.js fake` 0 diff / 72 (director-blind
  by design).
- **Director on the fake timeline with six scenes** (`director-fake-after15.txt` vs `-after`, `director-stats.js`): the
  same 9 soft switches, all 9 on the bar line (held max 3.80, mean 1.64 beats, identify 7 / return 2), the same 11
  restores at the same seconds; the sequence `0 3 4 0 4 3 4 …` became `0 6 4 0 4 6 4 …` — FEIGEN's score wins TORUS's
  slot in the alt-1 section (0.2 + 0.4·regularity + 0.25·clarity + 0.15·calm against 0.25 + 0.45·clarity +
  0.3·regularity, plus the seed noise) and comes back on every return of that section, as look memory should.
- **Cost — the open item.** `CARD.bench(6, 300)` at full resolution, tier 3: L 1.21 / `uIter` 142 → **6.85 ms**, L 2.02
  / 240 → 10.9, L 3.02 / 428 → 17.7, L 3.59 / 500 → 21.1 (NAV 2.3–2.7 in the same session); ≈ 1.7 ms + 0.036 ms per
  iteration. The brief's "in NAV's range" is met only while shallow; the worker refused to retune synapse's `uIter =
  min(500, (70 + 30·L²)·[0.6, 0.8, 1, 1.25][tier])` behind the orchestrator's back — rightly: the DE and the bands come
  out of the escape count, and `Q` already trades both the multiplier and `feigMax` down (house settled at q 0.5,
  tier 1, 6.2 ms with no artefact). Left open for a polish phase: scale `uIter` by `ctx.Q.iter/264` instead of the
  tier row, or render the dive at `0.8·scale` — a §1.6 question, not a scene one.
- **Friction (9) → docs:** hooks fire before `init` and clamp-on-arrival (§1.4, with §14's); `SC.hist` and `bench`'s
  default `n` (HARNESS; brief-common's `bench(id, 60)` → 300); the brief's `928–962` range stopped one line short of
  `FS_FEIGEN`'s end (the same off-by-one as POLYTOPE's brief — the worker took `o = vec4(col·uAlive, 1)` from MANDALA);
  "`tricorn` also at `init`" is not computable without `MS` (0 until the first `sectionEvt`); `Math.floor` for `uIter`;
  `look.set` guarded with `Array.isArray`. Temptations not taken: `core/` for hook timing and for whether `bench` is
  full-res (both answered by experiment and HARNESS's own wording).

## §16 FEIGEN's cost at depth — the field/colour split and the zoom ladder (v0.2, 2026-09-23, worker from `docs/workers/brief-feigen-field.md`, report `feigen-field.md`)

- **The disease, measured before anything was changed** (`tools/q-trace.sh`, `q-stats.js`; the recipe forces scene 6
  at 40 s with the dive set to L 2.5 — a visit from the arrival depth stayed under L 1.3 for 30 s and cost nothing —
  and releases it home at 70 s; one Chrome, three runs per style, `none` = FEIGEN's `score` made 0 after load).
  House, mean of three: q during the visit **min 0.47–0.50 against 0.68–0.69 with FEIGEN out**, the 70–100 s window
  **0.62 against 0.86**, 100 s to the end **0.73 against 0.96**: one deep 30 s visit costs every other scene ~0.2 of
  `q` for the rest of the track, because the controller climbs back at +0.04 per 2.5 s and its ceiling at +0.002 per
  half second. aba: look memory restores the section's filed shallow depth mid-visit (`L 1.03` at release in all three
  runs), so only run 1 dipped (0.48); the house number is the one that justifies the session.
  `feigen-bench.sh before`, tier 3, NAV interleaved: **8.0 / 13.1 / 20.5 / 22.2 ms** at L 1.6 / 2.4 / 3.4 / 4.0 against
  NAV 1.5–1.8; a tricorn flip's first two renders 37 ms.
- **What was built** (`scenes/feigen/`: `index.js` 348 + `ladder.js` 140 + `colour.js` 130 + `field.js` 56;
  `shaders.js` gone; `tools/test_feigen_ladder.js`). The per-pixel loop now writes a **field** — `R = esc ? n :
  −(√tr + 1)` (the sign is the interior test), `G = log r`, `B = log|z′|`, `A = ea` — into a rung target, and a
  per-frame **colour** pass samples it through the frame's affine camera and applies exactly §15's colouring
  (`specM`/`histM`/palette/gains unchanged; the `&histfull=1` equality holds). Rungs every factor 2 in the base width
  (`LR = ln2/lnδ = 0.449807` levels; `W_r = 3.2·2^−r`), the rectangle of every admissible view of the rung derived from
  the aspect and the modulation bounds (`x ∈ [−0.79, 1.54]·W_r`, `y ∈ [0, 0.71]·W_r` at 16:9 — the brief's printed
  rectangle was 1.6× too small because it had the view's aspect swapped; the node test proves containment over 1080
  rolled corners), **upper half-plane only** (M and the tricorn are conjugation-symmetric because the reference orbit
  is real, and both `ea` reads are `abs(fract(·)·2−1)` terms), density 2 texels per view pixel at the base width
  (3337 × 905 = 3.0 Mpx, 23 MB RGBA16F per rung at the headless 1280 × 633; a 6 Mpx cap binds only at 1080p), three
  slots + an 835 × 227 quarter target = 70 MB. `iter = min(500, (70 + 30·L_r²)·1.25)` at every tier — the tier no
  longer trades iterations away; it scales the **work per frame**: `BUDGET = [6, 9, 12, 18]·10⁶` texel-iterations per
  `draw()`, one scissored band of rows into the rung under construction (the current rung if unfinished, else `r + 1`,
  double in the last 15 %), keyed on `feigL`, `tier()` and the scene's own draw counter — a 500-iteration rung builds
  in 91 frames at tier 3, 302 at tier 0, against ≥ 6 s per rung at full dive speed. Sampling: four `texelFetch`, each
  texel **decoded first** to `(log d, log₂G, ea, trap)` and the decoded values blended bilinearly (`n` and `log|z′|`
  each jump by a doubling across every escape-count contour; only their combination is continuous), `ea` as a unit
  vector, the nearest texel alone where the four signs disagree. RGBA16F kept over the pre-authorised 32F on a
  precision audit: `log|z′|`'s ulp at the deepest allowed level puts 1.6 % on `d` under `exp(−160·d)`; nothing
  roughened.
- **The blend rule: field-space cross-fade over 30 draws, kept.** The seam test decided it (`feigen-bench.sh` (c):
  `CLOCK=1`, `&feig=1.478`, a shot per frame 300–340, mean |Δ| between consecutive frames): the rung change at frame
  313 measured **0.85 = 0.51 × the median** — quieter than an ordinary frame — where the timeline's own kick beats are
  4.1–4.5 and the kick flare at f320 is 43 (the same series before §16: median 1.59, f320 42.5). The pre-authorised
  hard switch was not needed; `accept/v0.2/feigen-field-seam.jpg`.
- **The three event rules as shipped.** Drop and kick-wrap: a virtual level `Lv = L ∓ k` (k ≤ 3) whose rung is built,
  sampled with the camera of `Lv` and `wdV` in `d` — the frame after the drop is the frame before it under the
  composite's flash and glitch rows (`feigen-field-drop.jpg`: 779 / 781 same geometry, 900 one δ deeper); the true
  rung cross-fades in when it lands (780 → 817 in the determinism run). The stand-in's error, measured with
  `&standin=0`: **14.4 mean grey on a frame of mean 167 (8.6 %)**, and against the true mathematics at 2× magnification
  (the coarser built rung), not a burst — the worker's fallback chain is `built → standin(k) → coarser(k) → quarter →
  one burst draw`, because every view of rung `r` fits rung `r − 1`. Tricorn flip: every slot invalid, one quarter-
  resolution draw of the current rung on that frame (≈ 5 ms at 500 iterations, first two renders 10–20 ms wall
  against 37 before), refined at the budget (`feigen-field-flip.jpg`: 301 already the tricorn, 340 sharp). Never a
  black frame, never a frame without a field, on every event shot.
- **Cost after** (`feigen-bench-after.txt`, tier 3, NAV interleaved): **1.22 / 1.19 / 1.27 ms** at L 2.4 / 3.4 / 4.0
  against NAV 2.0 (the L 1.6 page read 2.84 with NAV at 4.0 in the same page — a loaded page; 1.1–1.4 in four other
  runs); flat in depth. The 60 frames after a flip average 2.7 ms (median of ten; 4.2 in the file's loaded page).
  House forced, 60 s: `q` **0.72** (§15: 0.50), `bench(6,300)` **1.20 ms** (§15: 6.15). Tier sweep: the same picture
  and `it500` at q 0.1 and 0.95 — only rows per frame differ (3 vs 11).
- **The Q trace after — the acceptance** (`q-{house,aba}-after.txt`, mean of three runs, the same recipe; the dive
  reached L 2.8–3.8 at tier 3 during every house visit):

  | house, q | 0–40 s | 40–70 s (visit) | min in visit | 70–100 s | 100 s– | run mean |
  |---|---|---|---|---|---|---|
  | before | 0.60 | 0.59 | **0.49** | **0.62** | 0.73 | 0.63 |
  | none | 0.60 | 0.74 | 0.69 | 0.86 | 0.96 | 0.76 |
  | **after** | 0.60 | **0.74** | **0.68** | **0.86** | **0.96** | **0.76** |

  aba: after 0.84 / none 0.85 run mean, 0.74 / 0.73 in the visit, 0.83 / 0.85 after it (look memory shortens its
  visits to L ≈ 1). `after` is indistinguishable from `none` to the second decimal on every window; `before` is 0.2
  lower for the rest of the track. The first `after` run of the day sat at q 0.00–0.05 from its first second, before
  FEIGEN was on screen: a sibling worker's wait loop spinning at 100 % CPU plus the desktop Chrome's renderers — kept
  as `scratchpad`-only evidence, not in `accept/`; a q trace with anything else on the machine measures the machine.
- **Parity plan.** `parity.js fake` 0 diff (no core change); `tools/scene-md5.sh` on the commit before the merge and
  after: scenes 0/1/2/3/5 **byte-identical**, FEIGEN's two frames `dee30d91…` / `eb8aa082…` equal to the worker's md5s
  from its worktree (five runs, two hashes, the progressive schedule running, and with `&histfull=1`); the director-
  blind mixs md5 `a6e2b8cd…` unchanged (`accept.sh`); `[EXC]` 0 on the real path (75 s) and the bundle (55 modules).
- **Principle** (CONTRACTS §1.6): *separate what the mathematics computes from what the music changes per frame, and
  amortise the first over musical time.* NAV's Böttcher table and FEIGEN's reference orbit were already this; the
  field/colour split is the same idea for a per-pixel scene whose camera is an affine map. TORUS and POLYTOPE rebuild
  seed-fixed geometry every frame and could not take it — their cost is the stroke count (§1.12), not the mathematics.
  Interior acceleration (period checking, `|z′| → 0`) was ruled out before the session: near `c∞` the visible components
  have period ~2^L with multiplier −1 at every doubling, convergence is algebraic, critical slowing *is* the scene.
  The render-scale slot in core (the prompt's traced fallback) was **not needed** and was not built.
- **Harness added:** `tools/q-trace.sh` / `q-stats.js` (HARNESS "Q trace"), `tools/feigen-bench.sh` (per-level bench
  with NAV interleaved, flip cost, seam ratio at the scene's `RUNG@` frames), `accept.sh` "== feigen cost" (fails above
  `max(2.9 ms, 1.5 × NAV)` at L 3.6). `check.js` 0 fail / 0 warn.
- **Friction (11) → docs:** the brief's rung rectangle and view aspect (recorded above; the worker derived both);
  `LR` 0.449946 → 0.449807; a modular slot map collides with the drop's 2–3-rung jump (slots picked by age);
  decode-then-blend; the `tricorn` hook eaten by the next `sectionEvt` (pinned; CONTRACTS §1.4 now covers hooks whose
  state the scene *recomputes*); `ctx.onResize` receives the canvas size and `ctx.use` never clears (§1.1);
  `feigen-bench.sh`'s spurious `undefined` line (fixed). Temptations not taken: `core/gl.js` (answered through `CARD`),
  `core/quality.js` (answered by the data: the flip's build mean tracked the page's own steady, i.e. machine load).
- **Ride-alongs (own workers, own briefs, none in `core/`).** *POLYTOPE's pole streaks* (`brief-polytope-pole.md`,
  `polytope-pole.md`): the tighter gate shipped — `den > 0.24` (was 0.16) with the ramp re-based to reach 1 at the same
  `den` as before, so everything inside `den = 0.4457` is bit-identical; the projected-length fade (option a) was
  rejected on an offline sweep of 60 phases × every cast × 4 tiers — a fade per *piece* shortens with `sub`, so it
  would have fixed the streaks only at tier 0 and dimmed the body 8 %; the gate is tier-independent (max reach
  3.38 → 2.70·g at every tier). Streaks at t6/t14 no longer reach the frame edge (`accept/v0.2/polytope-pole-ab.jpg`),
  consecutive-frame |Δ| 4.59/4.48 → 3.92/3.82 (no spike, `cuts: 'continuous'` kept), f360/f840 md5s identical across
  two runs, bench 0.71× → 0.66× NAV interleaved. §8's polish note is closed; its `0.16` is history. Friction: a bench
  "×3 medians" without the NAV interleave read a fake 1.8× regression (40 % drift between sessions) — HARNESS's
  interleave rule is the only protocol on this machine; §1.12's alpha rule now says the pole fade is the one place
  alpha may fall (a colour-only fade would leave an opaque black streak writing depth).
  *DUST's tier-3 fibre count* (`brief-dust-fibre-count.md`, `dust-fibre-count.md`): `QT[3]` 1.4 → 1, so tier 3 draws
  tier 2's `4 × 10 × 56 = 2240` segments (was 3168); the points path byte-identical to §14 (`e49cf54e…`/`7119a542…`
  with `&fibres=0`), f360 unchanged even with the fibres on (that frame is at tier 2), f840 deterministic across runs.
  Cost, measured drift-immune (one Chrome, three geometries rotated through 11 cycles, each `on` paired with the `off`
  right after it, median of the pair differences): **0.948 ms** (was 1.184 in the same harness; §14's +1.37 reproduced
  at +1.40 in the brief's shape). **The saving is sub-linear**: 29 % fewer segments bought 20 % of the cost — the
  marginal rate is ~0.25 µs/segment under a fixed per-`draw()` cost, against §1.12's 0.4 µs average (§1.12 says so
  now). The worker's proposal `4 × 12 × 48` (all twelve fibres, 0.913 ms — the same price, and the picture closer to
  the old one, `accept/v0.2/dust-fibre-count-3way.jpg`) is taken: shipped as the follow-up commit (`N3 = 48` at tier 3, 2304 segments, `CAP` 2304; f840 `ed87b7f7…`,
  interleaved on−off 0.53 ms in the quietest triple of the day; `dust-fibre-count.md` (k)). Friction: a bench
  threshold is not decidable from three medians on a shared machine (four repeats of the brief's command spread 0.09–
  1.13 ms around a 0.95 threshold while sibling workers' Chromes ran); the brief's t6/t14 shots run at tier 2 and could
  not see the change (the `CLOCK=1` pinned-`q` pair could).
  *NAV's interior smoulder* (`brief-nav-smoulder.md`, `nav-smoulder.md`): §15's one thing JULIA had. `uPar` = `N.par`
  (the multiplier chart's approach to a parabolic root, `sstep(0.8, 0.98, ρ)`) uploaded from `draw`; in `FS_JULIA`'s
  known-cycle branch `col += pal(.5 + .1·bands)·par²·(.35 + .3·bass)·(.3 + .7·bands)` and in the plain interior
  `pal(.45)·par²·(.16 + .2·bass)` — retuned from the brief's bass-dominant suggestion because `MS.bass` is 0 through
  the fake timeline's build, exactly where `par` rises (a bass coefficient collapsed to 0.15 against an interior base
  of 0.03–0.13). `nav.js` untouched: `parity.js fake` 0 diff / 72; monitor 60 s `viol []`; frames with `par` 0
  (f360 `92438f2d…`, f840 `d697789c…`) **byte-identical** before and after, f660/f720/f760 (`par` 0.46/0.78/0.19)
  differ; `accept/v0.2/nav-smoulder.jpg` (f760 with `par` forced to 1 through a wrapped `update` — provably inert, the
  same forcing on the old build is byte-identical to its own baseline): the dark silhouette lights from within, Koenigs
  bands as smouldering rings, centre-crop mean 17/38/32 → 33/77/61, nothing clips, filaments / rays / PiP pixel-
  identical. `par` never exceeds 0.79 on the fake timeline. Friction: `CARD.bench` on NAV is confounded by `Q.iter`
  adapting between calls unless `q` is pinned first (HARNESS says so now).

## §17 Ship v0.2 — the real-window audit, the tag, the v0.3 triage (2026-09-23, orchestrator in a real window)

- **Why a real window.** Every number before this section came from headless Chrome at 1280 × 633/720 on the fake
  timeline or the demo synth. Five things headless cannot do — real sizes and DPR (three 46 MB rung slots at 1080p),
  tab-capture audio, a hidden tab on the worklet path, the keys on a real screen, the bundle from `file://` — were done
  once, by the orchestrator, in `/usr/bin/google-chrome` on the desktop display, driven over the same CDP steps as the
  headless harness (`HEADED=1`, HARNESS "Real window"). `docs/AUDIT-v0.2.md` is the ledger: one line per check, a
  number or a shot, a verdict; `tools/accept/v0.2/audit-*.jpg` and `audit-q-song.txt` are the evidence.
- **Findings, in one paragraph each.** *Size/DPR:* at 1920 × 1080 and DPR 1.5 the 2560 cap binds (2560 × 1309, 4.1×
  headless pixels), FEIGEN's rung is 4632 × 1295 (the 6 Mpx cap, ~150 MB for three slots + quarter) and it benches
  0.93–1.10× NAV interleaved (5.6 vs 5.3 ms — both scale with the pixels); the desktop's native DPR is 0.75, so a
  1920 × 1080 window is 1407 × 712 and FEIGEN is 0.74× NAV there; at fullscreen 2560 × 1439 FEIGEN 0.5–1.2× NAV, DUST
  0.13–0.28× NAV. A drag-resize and a fullscreen with FEIGEN on screen re-allocate the ladder (`coarse` → `built`
  within 4 s) with no black frame and one 33 / 83 ms frame; every other scene's resize is luminance-continuous; the
  lazy-allocation fallback the prompt reserved was not needed. *Real audio:* a 4:16 track captured from its own
  window is heard within 6 s, both tempo estimators sit at 116.9, `q` climbs from the page-load 0.56 to 0.8 at 58 s
  and holds 1.0 for the last 150 s with FEIGEN visits, 14 331 frames with 0 black and 0 over 100 ms, 18 switches all
  on sustain/section-return. *Hidden tab:* on `#test` the fake source does not hop while hidden (rAF-driven, by
  design) and the ladder answers the 30 s jump with `standin(-1)`; on the worklet path the engine kept hopping (2822
  hops in 30 s), the whole-ring upload was taken silently, and FEIGEN/DUST/NAV's first frames back were 55 / 22 / 62
  mean luminance — never black. *Keys/help:* every key does what `hud.js` says; keys 8–9 on free ids are no-ops; the
  help's formula column was truncated at **every** real width (47/107 rows; `.hinner` was capped at 1180 px) — fixed
  by wrapping (`pre-wrap`, `overflow-wrap: anywhere`, the column follows the window to 1500 px): 0/107 after, tallest
  cell three lines. *Bundle:* `dist/eigenwobble.html` from `file://` with capture: heard, 160 BPM read, help 107 rows,
  `ERRS []`, `nonFinite []`, `[EXC]` 0.
- **Fixed in the session (no worker needed — index.html CSS and a `feats.js` string):** the help wrap above; `wave`'s
  ELI5 now names the 512-wide engine texture a scene samples (CONTRACTS appendix regenerated). Both are §12's
  "Left open" lines. Parity untouched (`parity.js fake` 0 diff, the two reference md5s unchanged — `accept-17.txt`).
- **Harness added:** `tools/cdp.js` `HEADED=1` (`WIN`, `WINPOS`, `DPR`, `CAPTITLE`; steps `tab`/`window`, `evalTab`,
  `activate`, `bounds`, `clickSel`, `dblclick`, `sh`; `[EVAL-ERR]` lines), `tools/probe.js` (per-frame luminance/dt,
  scene/visibility/resize/black/long events, the first frame back), HARNESS "Real window" and the consolidated "Bench
  protocol". **Harness friction paid for:** a media document in a same-window tab that was never shown does not play,
  a non-playing captured tab delivers no frames, the worklet then sees zero-channel input and never hops, and the tab
  picker focuses the shared tab so the page is hidden and nothing runs (not the loop, not the watchdog) — every
  "stall" in the first capture runs was this; the music goes in **its own window**. Sharing a tab adds Chrome's
  infobar and shrinks the viewport 56 CSS px (a real `resize()` at t ≈ 0). Headed Chrome ignores `background:true`
  for a same-window tab (that *is* the hidden-tab check); with a second window open the new tab lands there instead —
  minimize the window (`{bounds:{windowState:'minimized'}}`) for a hidden check on the worklet path. `Page.captureScreenshot`
  activates a hidden tab. `pgrep -f` from inside a `{sh}` step must bracket a letter (`gpu-proces[s]`).
- **Not fixed, on purpose (v0.3 triage below):** the spurious drop rows on the first frames back from a hidden tab;
  DUST's near-black stretches in the fake valley at real size (its look); the probe's hard-vs-soft blindness.
- **The tag.** `v0.2` at the accept commit, `releases/eigenwobble-v0.2.html` = `dist/eigenwobble.html` (the artefact
  that runs from `file://` anywhere), `accept-17.txt` the sweep behind it. v0.1 was a commit, never a tag; this is the
  first.
- **The v0.3 triage** — every "Left open" line decided (a brief title + its acceptance number, or closed with the reason):

  | source | line | decision |
  |---|---|---|
  | §9 tempo | a 3:2 tempo change with the old lag alive takes up to 8 s | **brief `tempo-3to2`**: the 25 % margin over the current tempo's score is what holds the old lag; acceptance: `tools/test_tempo.js`'s 3:2 case (128 → 192 and back) locks within **4 s** (was ≤ 8), every other case unchanged to ±1 BPM, `parity.js fake` 0 diff (the fake path never runs the estimator), `parity real` both within 1 of 126. Audible? The director quantises soft switches to the bar line while `gridTrust > .5` — 8 s of a wrong bar is two switches held to the wrong line; the trace (`tempo-trace.sh`) says when the lag moved vs when the music did |
  | §9 tempo | below 59 / above 200 BPM reads at an octave | **closed**: outside every style the engine is built for (house 120–130, dnb 170–176, ambient holds the prior); an octave read there is the correct musical answer for the visuals (the beat clock still lands on beats) |
  | §10 director | `SC.mem` is not renumbered when synapse merges/drops a section (one stale restore) | **brief `director-renumber`**: the slot is a `sectionRenumber` event from `features-synapse.js` (old id → new id, or −1 for dropped) that `scenes.js` applies to `SC.mem` keys; acceptance: `director-trace.sh mix` × 3 shows **0** `RESTORE@` lines whose filed `sectionAlt` no longer exists, and the count of renumber events per `mix` run is in the report (if it is 0–1 per run the brief closes itself as "measured, harmless") |
  | §10 director | the section-return restore lands 8–12 beats after a surprise hard cut | **closed**: v3's 8-beat spacing after a hard cut is the contract's "no two cuts inside 8 beats" (§1.9); the restore is a soft switch and waits for the bar line on top — landing 8–12 beats later is the promised behaviour, not a lag |
  | §11 morph | the advection combs TORUS's ribbons mid-fade; `post.morph.flow` per scene is the slot | **brief `morph-flow-slot`** (low priority): one `&trans=morph` A/B pair per stroke scene (TORUS 3, POLYTOPE 5, DUST 1 with fibres) at CLOCK f178 against `mixs`; the slot is `scene.post.morph.flow` (default 1) read by `transitions/morph.js`; acceptance: the three pairs in one montage, the stroke scenes' pair |Δ| against the mixs pair at most 1.5× mixs's — if the comb is not visible in the montage the brief closes without the slot |
  | §11 morph | a reversed fade jumps the front | **closed**: the reversal is itself a director hard cut (`goScene` mid-fade), an already-jumping frame |
  | §12 help | the formula column truncates (touch wants click-to-expand) | **fixed this session** (audit 4): wrapping instead of an ellipsis, the inner column follows the window; 47/107 → 0/107 at 1080p; click-to-expand is moot |
  | §12 help | `wave`'s ELI5 describes `MS.wave`, not the 512-wide texture | **fixed this session**: `feats.js` `wave` now says what a scene samples (the 512 × 1 engine texture) and that `MS.wave` is the raw read behind it; CONTRACTS appendix regenerated |
  | §12 help | a variant (DRUM) has no `help.feats` of its own | **closed**: a variant reads exactly its parent's fields by construction (`REG[id].variant` over the same scene object); a variant with its own reads would be a scene, not a variant (CONTRACTS §1.13 says so now) |
  | §16 FEIGEN | 70 MB at 1280 × 633; the density fallback at 1080p | **closed by audit 1**: at 2560 × 1309 the cap binds at 4632 × 1295 (6.0 Mpx, ~150 MB for three slots + quarter), FEIGEN benches 0.93–1.10× NAV, fullscreen re-allocation costs one 83 ms frame, no black frame, no stall — lazy allocation is not needed; the density fallback (1.76 → 1.4 texel/px at 2560 wide) is invisible against the colour pass's bilinear decode |
  | §16 FEIGEN | the brief's aspect/rectangle error — patch `brief-feigen-field.md` or leave | **leave as history**: the report (`feigen-field.md`) and DECISIONS §16 both record the correction; a brief is a dated instruction, not a living doc — patching it would hide what the worker had to derive |
  | §16 FEIGEN | `&standin=0` falls to a coarser rung, not a burst, so the burst is only seen after a flip | **closed, fine**: every view of rung r fits rung r − 1, so a coarser rung is always the better fallback; the burst exists for the one case with no built rung at all (a flip, or the first frame after a resize — audit 1 saw exactly that: `r6 coarse` after every size change) |
  | §14/§16 DUST | fibre cost = fixed per-`draw()` + 0.25 µs/segment; `stride` for static rings | **closed unless run D says otherwise**: DUST vs NAV interleaved at the native 1407 × 712 and at fullscreen 2560 × 1439 (audit 1, run D) — see the numbers there; `stride` stays closed while DUST ≤ NAV |
  | §15 JULIA | dropped; NAV took the smoulder | **closed**: `audit-1-nav-native-1080p.jpg` (real window, demo) — the interior lights from within at `par` > 0; at `par` 0 the silhouette is v3's, which is the parity promise |
  | ids 7–8 | a scene candidate list for v0.3 (contract-only, no source) | **list, no build**: (a) **NEWTON** — Newton's-method basins of `z³ − 1` and the music-chosen polynomial, per-pixel with an affine camera → the field/colour split lifted verbatim (`ladder.js` is scene-agnostic in its geometry; the field is `(root id, log rate, arg)`), the first reuse of §16's principle; (b) **MODULAR** — the `j`-invariant / a modular form on the upper half-plane rendered through `SL(2,ℤ)` tiles, the camera walking the fundamental domain by section, drops jumping to a cusp (per-pixel, one reference orbit per tile, `hist` sampler like FEIGEN); (c) **KLEIN** — path-A strokes: a Boy's surface / Klein bottle immersion in `R³` as 144 rings × 96 segments through `ctx.lines`, the immersion parameter on `MS.tension`, the seed-fixed geometry per section like POLYTOPE (the stroke budget is the cost, §1.12); (d) **LORENZ** — path-B strokes: a strange attractor's trajectory bundle (Lorenz / Rössler / Thomas by section seed) integrated in-shader from `gl_VertexID`, `kick` kicking the parameter across the bifurcation. The contract test for v0.3 is (a): it needs nothing but CONTRACTS §1, §1.6 and `scenes/feigen/ladder.js` as a library |
  | harness | the bench protocol lived in three places | **done this session**: HARNESS "Bench protocol" (five rules), the Q-trace paragraph and the `CARD.bench` bullet point at it |
  | harness | `q-trace.sh`'s `VISIT` is FEIGEN-specific (`hooks.feig`) | **closed, say so**: `VISIT=40:70:<L>` is FEIGEN's dive depth; a scene that will ever need a forced deep visit brings its own hook and a `VISIT` of its own shape in its brief — no other scene has a "depth" (HARNESS says so now) |
  | audit 3 (new) | the first frames back from a hidden tab read as a drop (the v3 followers were frozen for the gap; on `#test` the fake timeline's `now` jumped over DROP@13) | **brief `resume-hold`** (small, engine-side, parity-neutral): on `visibilitychange` → visible, hold `drop`/`hit` detection for 1 s and let the followers re-seat (`ENGINE.resumeAt`), fake path untouched (`parity.js fake` 0 diff); acceptance: the probe's first 5 frames back show no glitch rows (lum step ≤ 10 %), `audit-3-*-back.jpg` re-shot |
- **Added after the tag (2026-09-23, from a note on OKLCH and escape-data channels; the full briefs are in
  NEXT-SESSION-PROMPT items 2–6):** FEIGEN's colour pass on OKLCH channels — L ← log₂G, H ← external angle, C ← the
  distance estimate — is a colour-pass-only change because §16's field already decodes exactly those three quantities;
  an opt-in OKLCH palette chunk in core; hue from arg λ on NAV's interior and the PiP sharing the external-angle hue;
  and the effect chain in linear light. The last one is a correctness item, not taste: bloom (blur + add) and the
  `ONE, ONE` scene layers are light transport done on gamma-encoded values, and the composite's tonemap
  `1 − exp(−1.5c)` is a linear-radiance operator applied to encoded values with no encode step after it (display
  white is unreachable: 1 → 0.78). Feedback is a `max` (space-invariant); crossfades stay encoded or go to OKLab —
  a linear dissolve has the mid-fade brightness bump. Decided: `&linear=1` first, an A/B montage per scene, then every
  final-frame md5 (scene-md5, mixs `a6e2b8cd…`, FEIGEN `dee30d91…`/`eb8aa082…`) re-based in one commit that says
  so; `parity.js fake` is unaffected (state, not pixels). Not taken from the note: Julia sets as a scene (§15) and
  derivative iteration (the field already carries `log|z′|`).

## §18 resume-hold — the first frames back from a hidden tab (v0.3, 2026-09-23, orchestrator; NEXT-SESSION-PROMPT item 1 + the probe polish, item 10)

- **The bug, measured.** AUDIT-v0.2 §3 saw the composite's drop rows on the first frames back from a hidden tab (FEIGEN
  155 → 125 over 5 frames on the worklet path). Mechanism: rAF stops while hidden, so `updateMusic`'s followers freeze
  for the gap while the audio and the worklet stage keep going; on return the spectral-flux baseline (`lmPrev`) is the
  spectrum from before the gap (a huge onset), `eM`/`eL` are stale (drop path 2's `e > 2·eM + 0.1` reads the loud
  passage as a drop), the surprisal model's mean is stale (a surprise), and the loop's 1/24 s dt clamp carries `hit`,
  `dropEnv`, `FX.glitch/flash` across the gap undecayed. Headless reproduction (a second tab activated hides the page —
  HARNESS "Hidden tab"; `Page.setWebLifecycleState` `frozen`/`active` never restores visibility headless, tried and
  dropped), v3 demo, 15–19 s hidden, 8 trials: a drop within 0.5 s of return in **3 of 8** (at 0.13 / 0.32 / 0.47 s;
  glitch 0.93, the flash frame at luminance 172 on FEIGEN), `hit` 0.1–0.5 carried into the first frames on **8 of 8**.
  In the real window the glitch is intermittent (it depends on what the music did across the gap: the same minimize
  recipe with the hold disabled came back clean once, 47 → 51 → 54), which is why the trial count is the evidence.
- **The fix (engine, ENGINE.md "Resume").** `main.js` → `ENGINE.resume()` on `visibilitychange` → visible; the next
  `frame()` stamps `resumeAt` (`resumed` true for that frame) and, real path only: a 1 s hold on `onset`/`dropEvt`/
  `surpriseEvt`; the flux baseline re-seated (flux 0 on that frame); the slow followers advanced by the gap they missed
  (`dtF = dt + now − X.envNow` on the resume frame for `presence`, `eS/eM/eL/eMax`, `highM`, `build/buildPk`, the
  surprisal model's mean/variance and band inputs, the section fingerprint — as if the current value had held
  throughout); `hit`/`dropEnv` zeroed; the loop zeroes `FX.glitch/flash` on the `resumed` frame. The first cut (hold +
  a snap of the surprisal mean only) still fired a drop 2.4 s after resume in 1 of 8 — `eM` was 62 % re-seated when
  the hold ended and path 2 fired on the next onset; advancing the followers by the gap is what closes it. Fake path
  untouched (a function of `now`, nothing frozen): `parity.js fake` 0 diff; `parity real` bpm 126.18 vs v3 125.96, arcs
  identical, drops within 0.5 s; `dtF = dt` off the resume frame, so the real path is byte-identical to v3 otherwise.
- **After, headless (same 8 trials):** 0 of 8 drops, 0 onsets / surprises in the first 60 frames, glitch 0, `hit` 0.
  **After, real window** (worklet path, "Who Likes to Party" captured from its own window, minimized 20 s, `tools/accept/
  v0.3/audit-3-{feigen,dust,nav}-back-worklet.jpg`): FEIGEN's first 5 frames back 46.7 / 45.4 / 42.6 / 42.1 / 40.7
  (max step **6.2 %** — the brief's ≤ 10 %), NAV 48.7 / 50.8 / 48.3 / 51.1 / 51.2 (5.8 %), 0 onsets / drops / glitch in
  the first 60 frames on all three, `ERRS []`, `nonFinite []`, `getError` 0. DUST's first frames swing (14.6 / 17.2 /
  8.8 / 11.6 / 13.1): its own per-frame flicker at low luminance — headless the same scene reads 15 → 9 → 18 across 8
  frames with no event fired — not the hold's concern. The scene md5 list (`scene-md5.sh`) is identical to the v0.2 tag's
  (shot in a worktree at the tag on `PORT=8766`); the core change is one line that only runs on the resumed frame.
- **Harness.** `tools/probe.js` (item 10): `next` events (a hard cut moves `cur` with `next` still −1; a soft switch sets
  `next` first), `drop` events, per-frame `g` (`FX.glitch`), `hit`, `o`/`s` flags; frame-tick events carry the frame's
  rAF time (before, `frames.filter(f => f.t >= back.t)` skipped the first frame back — the audit's "first 5 frames"
  were frames 2–6). `accept.sh` "== hidden tab" (deterministic by construction: the hold masks events whatever the
  music) and its output now goes to `tools/accept/v0.3/`.
- **Left open:** none. The synapse stage's own followers run on the hop clock and were never frozen; DUST's exposure
  re-adapts over its own constants after a gap (audit 3's 22 → 51 climb) — its look, by design.

## §19 oklch-palette — an OKLCH chunk as an opt-in core slot (v0.3, 2026-09-23, orchestrator; NEXT-SESSION-PROMPT item 4)

- **What.** `assets/core/oklch.js` exports `OKLCH_GLSL`, handed to scenes and effects as `ctx.oklch` (CONTRACTS §1.14):
  `linToOkLab` / `okLabToLin` (Ottosson's matrices), `srgbToLin` / `linToSrgb` (the piecewise curve), `okClip(h, L, C)`
  (the chroma scale the gamut clip keeps), `palOK(h, L, C)` → linear sRGB in gamut, `palOKs` encoded. `assets/math/
  oklab.js` is the JS twin with the same constants plus `maxChroma(L, h)`. HEAD's `pal()` is untouched — the chunk is
  prepended by whoever wants it (`ctx.mkProg(ctx.oklch + FS, name)`), so no program that exists today changes: the
  scene md5 list is identical to the v0.2 tag's, `parity.js fake` 0 diff, the mixs md5 unchanged (main.js only gained
  the `ctx.oklch` line).
- **The clip rule, decided.** Chroma is shrunk toward the grey axis at the same L until the colour is inside sRGB
  (bisection, 14 halvings, only on pixels that are outside): hue and lightness are kept, a clipped colour goes greyer.
  A channel clamp — what every cosine palette in the repo does implicitly — darkens and hue-shifts instead. 10 halvings
  were tried first and left 11/255 between the GPU and the twin at C 0.3 (a channel moves several units per unit of
  chroma at the gamut edge); the residual after 14 is 1/255. The half-pixel hue offset in the first smoke test (pixel
  `i` is hue `i/360`, `gl_FragCoord.x − .5`) read as a 10/255 "clip disagreement" at blue for twenty minutes: near
  blue the max chroma moves that much in half a degree.
- **Numbers (`tools/test_oklab.js`, `tools/oklch-smoke.js`, both in `accept.sh`).** Reference triples to 2e-4 (red
  0.6280/0.2249/0.1258 …), round trip 2.6e-7 on a 5³ grid; **C 0.11 at L 0.7 is inside sRGB at every hue** — the
  tightest is 200° at 0.119 — which is the constant the FEIGEN brief (item 2) and NAV's hue (item 5) build on; GPU =
  twin to 1/255 over 360 hues at L .7 C .11 and at L .5 C .3 (all clipped); the OKLab midpoint of two complementary
  hues at L .7 has L 0.699, the gamma midpoint 0.670 — the reason §1.14 says interpolate in OKLab; 360 distinct 8-bit
  colours over 360 hues; `ERRS []`, `getError` 0.
- **Not done here, by design:** no scene uses the chunk yet (items 2, 5, 6 do); the chain is still encoded, so a
  scene writes `palOKs`/`linToSrgb(palOK(…))` until item 3 moves the chain to linear light.

## §20 linear-chain — the effect chain in linear light (v0.3, 2026-09-23, orchestrator; NEXT-SESSION-PROMPT item 3)

- **What was wrong.** Bloom (a blur and an add), the composite's bloom and flash adds and the exposure's metering ran on
  sRGB-encoded values, and the composite's tonemap `1 − exp(−1.5c)` — a linear-radiance operator — was applied to
  encoded values and written to the screen with no encode after it: display white was unreachable (white in → 198/255),
  a blurred edge between complementary hues dipped in luminance (the encoded midpoint of equal-luminance magenta and
  green has 0.75 of their luminance in `chain-smoke.js`'s measurement), and additive light clipped channel-wise long
  before white (10.6 % of DUST's pixels at the fake drop frame had a channel ≥ 1 before the tonemap).
- **The shape (CONTRACTS §1.10, §3).** The scene's output stays encoded (every palette in the repo is, and `ctx.oklch`
  users write `palOKs`). Feedback — the chain's first pass — decodes it (`srgbToLin` from the §19 chunk, `uFb.w`) and
  sets `io.decoded`; `post.js` decodes itself before the first effect above order 10 if feedback was skipped (no scene
  does that today, the fallback is 10 lines). Bloom thresholds linear values; exposure meters linear luminance; the
  composite adds bloom and flash in linear, tonemaps with `(1 − exp(−k·c)) / (1 − exp(−k))`, k 1.5, so linear 1.0
  reaches white, encodes (`linToSrgb`), then vignette and dither on the encoded value (a display-space darkening and a
  quantisation step). `CHAIN = { linear, k }` in `post.js`, `io.linear / io.k / io.decoded` per frame; `&linear=0`
  under `#test` is the v0.2 chain (one uniform per program, no recompile) — the A/B and the history.
- **Slots keep their encoded meaning — the re-tune list came out empty.** `post.bloom.thr` is decoded through the sRGB
  curve (0.35 encoded → 0.10 linear, the knee `thr + .5` likewise), `post.fb.decay` becomes `d^2.2` per frame (a factor
  on encoded values is that on linear ones: the trail a scene tuned stays), exposure's `TARGET` is decoded (0.22 →
  0.040), and the flash — "+0.9 on encoded values" — becomes the linear add that puts the same wash on a black pixel:
  `f' = −ln(1 − (1 − e^−k)·lin(1 − e^−1.5f)) / k` (0.9 → 0.34). Without the last one a drop whited the whole frame out
  (0.9 of linear radiance is nearly white); with it the fake drop frame on DUST has mean luminance 150.5 vs 152.7
  encoded. The brief's "unblended pixels byte-identical" could not hold: the tonemap moved with the chain, so every
  pixel's tone curve changed (mid-tones a little brighter, highlights much brighter) — the per-scene A/B montage
  (`tools/accept/v0.3/chain-linear-ab.jpg`, f360/f840 × 6 scenes) decided it: the same pictures with cleaner highlights,
  FEIGEN's f840 filament and MANDALA's rim the most visible gains; nothing lost, nothing to re-tune.
- **Numbers (`tools/chain-smoke.js`, in `accept.sh`; the DUST clip recipe in HARNESS "Effect chain").** Fringe: 0.745
  encoded → 0.998 linear (the brief asked ≈ 0.6 → ≥ 0.95). White: 198 → 255. DUST clip fraction at the fake drop frame:
  **10.6 % → 0.12 %** (`chain-linear-drop-clip.jpg`). `linear=0` is byte-identical to the v0.2 tag (scene md5 list
  identical, mixs md5 unchanged) — the proof that only the space changed. Cost: one `pow` per pixel in feedback's decode
  and one in the composite's encode; nothing else.
- **The re-base (this commit: the default flips to linear after the FEIGEN OKLCH and NAV hue merges, so every
  reference moves once).** mixs 0 → 3 f178: `a6e2b8cd…` → **`425a66e5b50c14786e6e25bc215a3169`** (three shots identical;
  `accept.sh`). The scene list: `tools/accept/v0.3/scene-md5-v03.txt` (s0 87d5f8bd/6c1aadab, s1 c6166af9/7ca6598c,
  s2 9a57626c/5e59be93, s3 d3e73b38/7e77c7b3, s5 24493420/2b1e1333, s6 923b314f/b438daf2). FEIGEN's `&histfull=1`
  equality is computed by the sweep, not recorded. `parity.js fake` 0 diff throughout (state, not pixels).

## §22 director-renumber — `SC.mem` follows synapse's section ids (v0.3, 2026-09-23, orchestrator; NEXT-SESSION-PROMPT item 8)

- **The slot.** Synapse's section ids are indices into its ring (`engine/synapse/structure.js`): a fresh section merged
  into a recognised return is spliced out and every id above it moves down; past 24 sections the ring shifts and every
  id moves down by one. Both now push `{type: 'renumber', map}` (`map[old] = new`, −1 dropped); the stage publishes it
  for that frame as `MS.sectionRenumber` (`null` otherwise; two in one frame compose) and the director's `memory()`
  moves `SC.mem`'s keys, `prevAlt` and `due` through it before reading the frame's `sectionAlt` (which synapse already
  reports in the new numbering). `SC.renumberOn = false` is the §10 behaviour (`RENUMOFF=1 director-trace.sh`);
  `#test` logs `FILE@` (a filing) and `RENUMBER@ <map> kept<n> dropped<n>`; `director-stats.js` replays the maps over the
  `FILE@` records and counts a `RESTORE@` whose key holds no live record as stale. `tools/test_director.js` case 8: a
  filing under 5, a map dropping 3, a return identified as 4 restores the filed looks with the renumbering on and finds
  nothing with it off.
- **Measured: harmless today, by construction.** `director-trace.sh mix` × 3 with the fix and × 1 without
  (`director-mix-renum{1,2,3,off}.txt`): renumber events **2 / 0 / 1 / 0** per 6-minute run, every one the merge of the
  *newest* section (a fresh section is always the last index — nothing can be pushed while it is unsettled), so every
  map was the identity on every filed key (`kept 7–8, dropped 0`); stale restores **0 of 11** in all four runs — also
  in the run without the fix, which is the §10 "one stale restore" measured: the demo never produces it. Where the map
  is not the identity is the 24-section ring shift (a long set: 24 boundaries) — every filed key moves down by one and
  the oldest is dropped; that is the case the fix exists for, and case 8 of the node test is its proof. Closed as the
  brief allowed: measured, harmless, the slot in place.

## §21 tempo-3to2 — a 3:2 change decided by the last 2.5 s (v0.3, 2026-09-23, orchestrator; NEXT-SESSION-PROMPT item 7)

- **The case, measured first.** `tools/test_tempo.js` gained the 3:2 case (the house pattern at 128 → the same pattern
  at 192 → back). The §9 estimator never picked 192 up at all (12 s, not the 8 s §9 recorded on the synth): the old
  tempo's comb `l + .6·2l + .3·4l` at lag 47 is propped by its harmonics at 94 and 188, which are exactly 3 and 6
  beats of the new grid (2·L128 = 3·L192), so 128's comb keeps winning the whole-window argmax while its own lag dies;
  and once the old material has drained the prior prefers 96 (192's halftime, 0.73 vs 0.60), which is a ½ relative and
  refused while the 192 lag is alive. The 2:3 way (192 → 128) locked in 1 s already.
- **The rule (tempo.js, rule 6).** The last 2.5 s of the normalised envelope get their own comb at the current lag and
  at its 3:2 and 2:3 relatives (only those: ½/2/¼/4 are drum patterns a tempo explains and keep §9's rules); when the
  relative's short comb is > 0.6, > 1.25× the current tempo's, **and the current beat lag itself has died relative to
  the relative's** (`short(Lcur) < 0.5·short(Lrel)`) for three consecutive estimates (1.5 s), the tempo is the relative
  (refined on the whole-window vertex). `test_tempo.js`: **192 in 4 s, 128 back in 4 s**, every other case unchanged
  (dnb/four/house/halftime lock, gap and after to the same max err; build hold 0.53; the 174 changes 4 s and 5 s).
- **What was tried and dropped, in one line each.** The beat lag alone as the reference (> 1.5× the current beat lag):
  locked the synthetic case but flipped the mix demo's 140 halftime section to 93 eight times (halftime's 1-beat lag is
  a quarter of its 2-beat lag — no reference at all). Per-product normalisation of the short ACF (a long lag has fewer
  products): sent dnb to its 2:3 relative in the node test — the attenuation of long lags is a taper the rule needs.
  Comb-only (no dead-beat-lag condition): steady house read the relative's comb at 1.06× its own, a margin too thin.
- **Traces (`tempo-{mix,house,dnb,fakeout}-after32c.txt`, with `r32 sc/v/n/s1/sq` on every 1 Hz line).** mix: the same
  three jumps as v0.2's trace (128 → 172 at 134 s, 174 → 139 at 258 s, 140 → 124 at 343 s — the demo's real changes)
  and no other; house 0 jumps, fakeout 0, dnb 1 (the initial lock). The closest approach to a false vote: one second
  of the mix's 140 section (279 s) met all three conditions (beat lag 0.29 vs the 2:3 relative's 0.95 — that passage
  really has a 1.5-beat period) and no second before or after it did; three consecutive are needed. `parity real`:
  ew 126.23 vs v3 125.99, arcs identical, drops within 0.5 s.

## §23 morph-flow-slot — `post.morph.flow` (v0.3, 2026-09-23, orchestrator; NEXT-SESSION-PROMPT item 9)

- **The montage decided it.** The three stroke-scene pairs at CLOCK f178 (`morph-flow-ab.jpg`: TORUS → NAV, POLYTOPE →
  NAV, DUST → TORUS, mixs beside morph) show the comb once: in DUST → TORUS the incoming ribbons are smeared along the
  flow field into a comb; TORUS → NAV and POLYTOPE → NAV land on NAV's drop frame and either transition reads the
  same. So the slot exists and one scene sets it.
- **The slot.** `drawScenes` hands the transition `io.postA` / `io.postB` (the outgoing and incoming scene's resolved
  `post`, CONTRACTS §5); `morph` reads `post.morph.flow` (0..1, default 1) per side and scales that side's advection
  (`uFlow`). At 1 the pass is byte-identical to before (the f178 md5 of the 1 → 3 morph unchanged). `morph-flow-
  slot.jpg`: flow 1 / 0.4 / 0 — at 0.4 the ribbons are intact with a slight drift and the front still reads as a
  morph; at 0 only the front moves. **TORUS ships 0.4**; POLYTOPE stays at 1 (its pair showed no comb — the brief's
  closing rule), DUST at 1 (its fibres were the outgoing side and were not combed). `mixs` untouched.

## §24 feigen-oklch — FEIGEN's colour pass on the field's three coordinates (v0.3, 2026-09-23, worker from `docs/workers/brief-feigen-oklch.md`, report `feigen-oklch.md`; NEXT-SESSION-PROMPT item 2)

- **What shipped (`scenes/feigen/colour.js` only; `field.js`/`ladder.js` byte-identical):** H ← the external angle
  (+ the mood hue, a half-turn flip on a drop), **L ← the scale-free distance estimate** `0.72·(1 − exp(−200·d))` — the
  far field at 0.7 (where the chroma budget is full), darkening to the DE black band under half a pixel — rippled
  ±0.08 by the Green's potential on musical time; C ← `cMax(L)·smoothstep(0.35, 2.5, d_px)·uSat`; kick/drop lift L by
  ≤ 0.15 / 0.25 of the remaining headroom. The brief's first mapping (L ← log₂G compressed) was built and measured
  first: a deep view spans hundreds of doublings, so the whole `&feig=3.6` frame went dark; the distance is the
  quantity that is scale-free at every depth (the same picture — bright field, dark rim, black boundary — over a 250×
  range of view width). The worker's `cMax(L)` envelope (now `okCmax` in the chunk) is what makes "0 clipped" true:
  a flat C 0.11 would clip 621 k of 810 k pixels at L 0.3.
- **Numbers.** Gamut 0 clipped of 921 600 on `&feig=1.2` and `3.6` at f360/f840. Banding along a Green's equipotential
  (distinct 8-bit triplets per row): 357/305/354 → **395/781/768**. Cost +0.5 % vs a same-session interleaved master
  control (the v0.2 accept file's ratio would read +8 %: machine drift, HARNESS "Bench protocol"). Seam at the rung
  change (`SEAM_L` 1.478 — the tool's old default 1.3 measured no rung change; 1.478 is the default now) 0.42× the
  window median (§16: 0.51×); the f320 kick flare 32.5 (was 42.5). `&histfull=1` equality holds (same md5s). Real path
  45 s clean. Ride-along: `post.bloom.thr` 0.3 → 0.6 (the bright pixels are plateaux now, bloom softened the frame),
  the `help.why` sentence corrected to what the code does.
- **Under the linear chain (§20) the field's 0.72 came out near white** (the tonemap lifts mid-tones: encoded 0.72 →
  0.83 on screen) — the shipped constant is **0.5** (`feig-l50.jpg`): a pale pastel field with a dark rim and the
  black boundary, the same picture at `&feig=3.6`. Left open as taste: the field's lightness (0.4–0.5 is the band
  where the hue cells still read as colour; the v0.2 look — dark field, glowing filament — is the inverse of this
  design, not a setting of it).
- **The Q trace after the merges and the chain flip (`q-{house,aba}-after.txt`, 3 runs each, one Chrome, nothing
  else):** house mean 0.75 / windows 0.59 · 0.73 · 0.85 · 0.95, aba 0.84 / 0.59 · 0.73 · 0.85 · 0.99 — against v0.2's
  `none` 0.76 / 0.60 · 0.74 · 0.86 · 0.96 and 0.85 / 0.59 · 0.73 · 0.85 · 0.99: **the same to the second decimal** with
  six forced deep visits per style (entry 0.74–0.79, min during the visit the same, 0.95 at exit + 30 s). Cost
  neutral, as the brief asked; `accept.sh` FEIGEN L3.6 1.21 ms vs NAV 1.77.
- **The FEIGEN reference md5s are re-based in §20's commit** (the chain flip moves them again).

## §25 nav-hue — NAV's interior by the multiplier, its exterior by the external angle (v0.3, 2026-09-23, worker from `docs/workers/brief-nav-hue.md`, report `nav-hue.md`; NEXT-SESSION-PROMPT items 5 + 6)

- **What shipped (`scenes/nav/shaders.js` + `index.js`; `nav.js` untouched, `parity.js fake` 0 diff, monitor `viol []`).**
  Interior (a known cycle): hue = arg λ + the mood hue, L = 0.10 + 0.32·|λ| modulated by the Koenigs bands (a centre
  dark, a root a lit mid-tone — the multiplier is one value per frame, so the brightening is temporal, not a spatial
  rim), C = `cMax(L)·(0.6 + 0.4·bands)` with the spokes as a ±12 % chroma ripple; the critical-slowing smoulder stays
  the additive term outside the DRUM mix (§16's worker's). Exterior (main view and the PiP): hue = the external angle
  + the mood hue — the doubling expansion accumulated per iteration as the itinerary bits `b_n = sign(Im z_n)`, closed
  with `arg z_N·2^−N` — L capped at 0.55 (saturated hue lives there), the white DE rim unchanged. `LOOK.pal[0]`
  still rotates the whole wheel.
- **Two passes.** The first put the interior at L 0.30–0.65 (+ smoulder → 0.92) and the exterior uncapped: the montage
  showed a pale interior and a washed drop frame — OKLCH puts bright colours at low chroma, so the identity of v3's
  picture (dark interior, saturated exterior) lives below L 0.55. The second pass is the shipped one: dark interior
  with a lit root at f660, the f840 drop an X of teal / amber / rose sectors on black (`nav-hue-ab.jpg`); v3's vivid
  cyan is outside sRGB at C ≤ 0.119 — §19's price. Named ray: θ = 7/8 reads hue 0.399 in the main view and 0.393 in
  the PiP (predicted 0.386). Gamut 0 clipped of 810 240 (main) and 23 104 (PiP) at f360/f840; a flat C 0.11 would clip
  646 k / 696 k. Bench: NAV/id-3 ratio 5.81 → 5.33 in one session (id 3 rose 13 % with the machine; the ratio is the
  figure). Real path 45 s clean.
- **Friction into the docs:** `feigen/field.js` does not accumulate the external angle by itinerary (the brief said so —
  it stores the escape argument); the itinerary derivation is in the report. Benching NAV against NAV is impossible:
  the protocol's control is "the other scene in the same session" (id 3 here); pinning `Q.q` does not pin `Q.iter`.


## §26 Ship v0.3 — the colour default, the hue diagnosis, the real-window audit, the tag (2026-09-23, orchestrator + two workers)

**The feedback.** After the §24/§25 montages the user said: "I don't like the colour pastel change — the colours don't seem
to match up with the set. Not opposed to pastel, but it shouldn't be the default." Two decisions follow, both permanent:
**the default look is v0.2's** (FEIGEN's cosine palette over the distance/potential grade, NAV's v3 blue exterior with the
Koenigs bands), and **a colour-identity change is a variant until the user picks it** — never the default on a worker's
montage alone (memory: `feedback_colour_default.md`).

- **`colour` slot (core, `4d00d89`; CONTRACTS §1.4 "Colour variants").** `scene.colour = {default, variants: {name: {…}}}`;
  the core sets `colour.cur` at registration, `setColour(name)` switches every scene that declares the name (an unknown
  name throws), `&colour=<name>` under `#test`, `CARD.setColour` / `CARD.colour`, `draw(target, {…, colour})`, a variant's
  `post` replaces the scene's (FEIGEN's OKLCH pass needs bloom thr 0.6, the v0.2 pass 0.3), the cast line names the
  current and the declared variants, `check.js` fails on a default that is not a variant. Proof the slot alone changed
  nothing: scene-md5 identical, parity fake 0 diff.
- **`colour-default` (worker, `docs/workers/colour-default.md`).** The v0.2 shaders lifted verbatim into `colour-v2.js` /
  `shaders-v2.js`, each mapping with its own `upload()` (the v0.2 → HEAD uniform diff was a clean subset/superset pair:
  FEIGEN dropped `uSpread`, added `uClipDbg`; NAV added `uClipDbg`). **Byte identity on all twelve md5 lines** with a
  v0.2 tree + the §20 chain files (`post.js`, `effects/*`, `oklch.js`, `oklab.js`, `main.js`), first shoot, zero fixes;
  `&colour=oklch` identical to the §24/§25 list on all twelve. Re-based: `scene-md5-v03.txt` = the v2 default,
  `scene-md5-v03-oklch.txt` = the variant, mixs `425a66e5…` → **`5892ddc5c1f553cbca140bbc1ef6b54d`** (NAV is scene 0 of
  the pair; the same md5 from the v2chain tree). FEIGEN's `help.feats` lines back to v0.2's brightness wording.
- **`hue-follows-the-set` (worker, `docs/workers/hue-follows-set.md`, the diagnosis before any mapping).** One montage per
  scene at L ≤ 0.5 and full chroma `okCmax(L)` (the pale look was L 0.7 + the linear tonemap, not the hue): FEIGEN hue by
  the external angle (shipped) / the Green's potential / the distance, at f360, f840 and `&feig=3.6`; NAV by arg λ + ea
  (shipped) / Koenigs inside + smooth escape count outside; a v0.2 row under each. **Read by the orchestrator:** the
  external angle draws a comb of radial stripes perpendicular to the boundary that goes finer than a pixel at depth
  (the frame averages to grey — the mapping deletes itself); potential and distance both wrap the set in concentric
  hue shells, **distance wins** (scale-free: the band width at f840 equals f360's; `−lG`'s p10–p90 spans 0.8 → 16 turns
  from L 0.4 to L 4.2, no `K_G` works at both depths — §24's lightness failure again); on NAV the shipped mapping split
  each lobe down a sector seam into a teal and an amber half, the **escape count** wraps every lobe in rings. The
  user's sentence was exact: v0.2 is one hue per frame with brightness following the boundary — itself a
  potential/distance colouring. Applied to the `oklch` variant only (second pass): FEIGEN `H = 0.25·log2 d + uHue`,
  L capped 0.5, C = `okCmax(L)`; NAV exterior `H = 0.2·sn·uSc.y + uPal.x`, the PiP the same rule, the interior's arg λ
  kept (one hue per component follows the set; its chroma is 0.02–0.07 at the shipped L — open); the itinerary
  accumulation left NAV's loops (nothing read `ea` any more). `s6-f360` of the variant is byte-identical to the
  montage's winning column. `clipdbg` 0 clipped on both scenes and the PiP; parity 0; the v2 default did not move by a
  byte (the gate). Montages: `tools/accept/v0.3/colour-default.jpg`, `oklch-variant.jpg`.
- **Two contract errors the workers found.** CONTRACTS §1.4 said a hash hook fires *before* `init`; main.js inits and
  registers every scene, then `initHarness` reads the hash — a hook fires **after `init`, before the first frame** (a
  program a hook selects is built lazily in `draw`); `CARD.hooks` is one flat map, so FEIGEN's and NAV's `clipdbg`
  shadow each other — `REG[id].scene.hooks`. Fixed in §1.4 (`0477310`). `git worktree add` is refused inside an agent
  worktree (`git archive | tar -x`); `FILE=` must be absolute.
- **The real-window audit (`docs/AUDIT-v0.3.md`)** — five checks in a headed Chrome, the shape of §17. Numbers: the 2560
  cap and the rung sizes as §17; FEIGEN **0.60×** NAV at 1920 × 1080 DPR 1.5 (3.6 vs 6.0 ms), 0.58× native, 0.69×
  native fullscreen; 0 black frames on resize and fullscreen, no long frame from the transition itself; a real track
  heard within 8 s, `bpm` 116.8–117.0 on both estimators, `q` 0.80 at 72 s and 1.00 from 154 s with the linear chain,
  0 black / 0 long frames; the keys; the cast line's colour key on a real page; the bundle from `file://` with capture
  at 160 BPM. **One engine bug:** after a 20 s minimize on the worklet path the §18 hold kept the first second clean,
  but **a surprise cut followed the hold in 3 of 4 restores** (+3.1, +2.1, +1.5 s; run B's baseline: one hard cut per
  23 s). The probe grew `sr/su/pr` (raw surprisal, surprisal, presence per frame) and showed the raw surprisal
  **ramping 0.10 → 1.51 over 1.1 s** after `back`: the band followers (`aB/aM/aH/fB`, τ 0.03–0.2 on `dt`) and the chroma
  emas (τ 0.25 on `dt`) were left to catch up after the gap, so the model's input moved for ~1 s while its mean lagged
  at 1.5 s; and `va` advanced by `dtF` on the reseed frame had collapsed to one stale d² (k2 0.86). Fix
  (`features.js`, ENGINE.md "Resume"): `va` never advanced by the gap and the reseed frame's error not scored; the band
  and chroma followers snap with `dtF` (`slowAnalysis` runs on the reseed frame with the gap); a **2.5 s `settle`**
  window (longer than the 1 s event hold) in which the model re-learns its mean at 0.25 s and learns no variance. dnb
  raw peak in the first 2.5 s 1.51 → 1.18 → 0.86 by step, surprisal 0.76 → 0.35 → 0; the demos' own events still fire
  at their no-hide control times. Headed, final surprisal code: restores 1 and 3 clean for 8 s, restore 2 a surprise at
  +3.05 s — 1 of 3 at the song's rate. **Then the sweep's own hidden check (v3's demo, `&fake=0`) flaked on a drop at
  +1.3 s** (accept-28; 2 of 3 standalone): a no-hide control has no drop there; the probe (now `bf ab es em bp hs arc
  ds` too) showed `eS = eM = 0.24` on the resume frame — the followers snap to one instantaneous energy, not a mean —
  and `eS` 0.65 a second later, so the second drop rule's `e > eM + 0.25` gate was open for every kick until `eM` had
  ~one time constant of data; whichever run had an onset coincide fired. **Both drop rules now wait for `settle`**
  (2.5 s) as the surprisal model does; `absentT` zeroed on the reseed frame. 3 of 3 demo restores clean for 8 s, dnb
  and house keep their own events at control times (+3.2 / +4.0 s). **Method:** a hidden-tab finding needs a no-hide control of the same demo at the same
  clock time before it is an artefact (house's "+3.9 s surprise" was its own drop), a baseline of hard cuts per second
  from the run itself, and a per-frame trace of the model's inputs — the ramp is visible in one line. Guard:
  `accept.sh` "== hidden worklet" (dnb hidden 20 s at 15 s: 150 frames back, 0 surprise, `srMax` < 1.4). Parity fake
  0 diff (the fake path never resumes; `dtF = dt` elsewhere).
- **NAV's cost depends on the parameter** (audit check 1): `bench(0, 200)` 1.79 ms at f480, **7.68 at f1500** (`par`
  0.76, the walk near a parabolic root, iter 264), 4.07 at f2100; 22.6 ms at 2560 × 1439 in the DPR-1.5 run. Not a v0.3
  change (v3's loop, parity-bound), but the thing `Q` pays for most → v0.4 item 2.
- **The v0.3 triage** — every "Left open" line decided:

  | source | line | decision |
  |---|---|---|
  | §20 chain | FEIGEN's field lightness under the linear chain (0.5, taste) | **variant only now** (the default is v0.2's pass); tuned with the variant if the user ever picks it (v0.4 stub item 5) |
  | §21 tempo | the halftime 2:3 margin (comb-only read the relative at 1.06×) | **closed**: the dead-beat-lag condition holds it; no trace flips; instrument before touching |
  | §22 director | the 24-section ring shift never observed | **carried, low**: a 4-minute track files ~20; `RENUMBER@` on a long set first (v0.4 stub item 6) |
  | §24 FEIGEN | the OKLCH mapping | **a variant, re-mapped by distance** (this section); the §24 lightness derivation stays as the variant's L |
  | §25 NAV | the OKLCH mapping; the PiP ray-matching | **a variant, re-mapped by escape count**; the ray-matching rationale is gone with the external angle — §25 / `nav-hue.md` keep the derivation |
  | §24 / §25 | `min(L, 0.5)` clips the band ripple; NAV's interior chroma | **open in the variant** (v0.4 stub item 5) |
  | §18 hold | the first frames back | **extended** (this section): followers snap, `settle` 2.5 s, the worklet-path guard |
  | audit 1 | NAV 4.6× with `c` | **v0.4 item 2** |

- **Ship.** `GPU=1 tools/accept.sh` → `accept-29.txt` 0 FAIL (accept-27: the new check's verdict grep; accept-28: the drop-rule flake, fixed above) → `git tag v0.3` → `releases/eigenwobble-v0.3.html` =
  `dist/eigenwobble.html` at the tag (59 modules, 410 KB) → `NEXT-SESSION-PROMPT.md` = the v0.4 stub.
- **How v0.3 was run** (for the next orchestrator): core slot first, proven no-op by md5 + parity, then two workers in
  parallel from committed briefs (one Chrome each), the orchestrator's own eyes on every montage before a merge, the
  audit only after the sweep on the merged code, and a finding on the real path chased to a per-frame mechanism with a
  control run before any fix — then the fix proven headless on two demos and headed on the track.

## §27 routes — a control panel that maps music features to visuals by hand (v0.4, 2026-09-24, orchestrator + one worker; `NEXT-SESSION-PROMPT.md` of the v0.3 tag)

**The decision (with the user, 2026-09-24).** v0.4 is one feature: the listener re-wires, by hand and per scene, which
music feature drives which field a scene reads — "in FEIGEN, `bass` is fed by `centroid`" — with gain, offset, invert
and an ema, or a constant; the manual overrides the keys already do (forced scene, transition, colour variant, the
four post params) gathered into the same panel; part E of the `?` help view, key `p`; `localStorage` + JSON presets +
a hash form for the harness; **a no-op until touched** (every reference md5 unchanged); the director off limits; the
per-*visual-parameter* level (a scene declaring its knobs as a slot) is the follow-on, not this. The earlier v0.4 stub
(NEWTON, NAV's iteration budget, a colour slot everywhere, the chain's k) moved to the v0.5 candidates.

- **`route-core` (`9a0c2c9`, `core/route.js`, CONTRACTS §1.15, HARNESS "Routes").** `ROUTES[scene][field] = {src | 'const',
  c, k, b, inv, tau}`; the core hands each scene a *view* of `MS`: **the same `MS` object while the scene has no routes**
  (identity by construction — not a copy, not a proxy: zero cost and no way to drift), else an object made once with
  `Object.create(MS)` whose routed fields are own properties refreshed by `refreshRoutes(dt)` in the loop after the
  engine wrote `MS` and before any `update()`; unrouted fields fall through the prototype live. The view goes wherever
  the core hands a scene `MS` — `update`, `score` (a variant reads its parent's view), a `post` fn, a nested post fn
  slot (`fb.decay(S)`, resolved by `postOf` against the view while routed) — never to the director, the transitions or
  the effects (`io.MS` is the real `MS`). **Kinds are the contract:** `level`/`raw`/`angle` route from the same kind or
  a constant (`inv` = 1 − x on a level, −x otherwise; a level clamped 0..1 after the transfer so the kind's promise
  survives a gain), an `event` only from an event with no transfer, `count`/`enum`/`vector`/`internal` never (`chroma`,
  `wave`, `seed`, `arc`, `sectionId` are always the engine's). A route names a field the scene lists in `feats` — the
  panel's rows are that list, so `feats` is finally load-bearing (§1.13's "a stale entry is a visible lie" now has a
  control attached). Unknown scene / field / source / kind mismatch **throws** (a typo in `&route=` kills init, as
  `&colour=` does); lists and presets are all-or-nothing (checked, then applied). The ema is on `dt` (no wall clock).
  **The one thing the design missed:** `bass`/`mid`/`high`, `beatPhase`/`hit`/`beatCount`/`dropEnv`, `eS`/`build`/
  `tension`/`surprisal`, `harmAngle`/`harmVel`/`clarity`/`regularity` reach every shader through the HEAD uniforms
  `use()` uploads from `LOOK` — a routed `bass` would have moved nothing on FEIGEN, whose only `bass` read is
  `uBands.x`. `look.js headVecs(S, C)` is the split-out derivation; `renderScene` swaps the four vectors from the view
  into `LOOK` around a routed scene's `draw()` and restores them (`pal`/`tint`/`time`/`GROOVE` stay the director's — a
  scene's palette is not its own field). Proof the view path is exact: `&route=feigen.bass=bass` (an identity route
  *through* the view, own property and HEAD swap included) leaves s6 f360/f840 byte-identical, also with ten identity
  routes; `feigen.bass=high` moves both frames (`3fa9434e…`/`12d4c045…`). Cost: ten routes on FEIGEN, `q` pinned,
  interleaved `bench(6,300)/bench(0,300)` none → ten → none: ratios .68 / .64 / .77 (the noise band); `ROUTE.ms`
  0.007–0.023 ms (its own 1 s ema, 0 with no route; the refresh runs outside `ENGINE.frame`). Grammar:
  `scene.field=src[*k][+b|-b][~tau][!]`, `scene.field=c:0.4`; a `+` arrives as a space through `URLSearchParams` — the
  parser reads both. `tools/route-smoke.js` (node, no DOM: 60 checks).
- **`manual-core` (`a4e4545`, `core/manual.js`).** `MANUAL.scene` **is** `SC.forced`, `.trans` the current transition,
  `.colour` each scene's `colour.cur` — live getters/setters over the director's own state, never a second copy (the
  keys `1–9`/`0` and the panel move the same thing); `.post` is `MANUAL_POST` (kept in `scenes.js` so `postOf` merges it
  without an import cycle — **the bundler cannot order a cycle**, so core stays a DAG: `route ← scenes ← manual ←
  harness`, `hash.js` a leaf for `TEST`). The four params `bloom.thr fb.decay kaleido exposure.on` per scene, merged
  over the resolved post *after* the colour variant's; with nothing set `postOf` returns the scene's own post object.
  `&post=feigen.bloom.thr=0.3,…`; the block rides in `routesJSON()`/`loadRoutes()` through `route.js BLOCKS`;
  `resetManual()` returns to main.js's transition (snapshotted at `initHarness`) and each scene's colour default. Proofs:
  md5 identity (v2 + oklch lists, mixs) with the module loaded, parity 0; `feigen.bloom.thr=0.3` (the v2 default's own
  value) leaves s6 identical, `=2` moves it (`da43c0e1…`), `kaleido=0,fb.decay=0.2` too; `tools/manual-smoke.js` 43.
- **`panel-ui` (worker, `docs/workers/brief-panel.md` → `panel.md`, `cbbd0fe` merged `23120c7`; `core/panel.js` 339
  lines, DOM only).** One block per scene (the current one first and marked), a row per routable field of `feats` with
  the `help.feats` clause (part A's rule, from the same data), a source `<select>` from `sources(k)`, gain / offset / τ
  / invert / a `c` input for `const`, a per-row reset, a two-segment live meter (source → routed; two bars for a level,
  numbers for raw, dots for events); per block "copy to all scenes" and "reset scene", a global "reset everything"
  (`clearRoutes()` + `resetManual()`); the manual section (forced scene incl. variants, transition, colour per scene,
  the four post params with the scene's own value as placeholder — a checkbox is `indeterminate` while unset, with a
  `×`); presets (textarea of `routesJSON()`, load, copy) and `localStorage['ew.routes.v1']` saved on every change and
  read at boot by `restore()` — **never under `#test`**. The core's side (`eba7582`): `help.js` gives a `<section
  id="helpE">` and calls `buildE / markE / refreshE(frameN, hot)` on its existing 6-frame tick — no second rAF, no
  timer; `hud.js` maps `p` → `openHelpAt('helpE')`; `harness.js` calls `restore()` after the hash when not under
  `#test`; `check.js` fails on a quoted `FEATS` key or scene name in `help.js`/`panel.js` (the views show data). First
  shoot, every acceptance line passed; the worker found **the bundler broken at HEAD**: `IMPORT_RE` rejected an import
  line with a trailing `//` comment, which four v0.4 core modules carry — fixed with a shared `TAIL` (the `[EXC]` count
  in `accept.sh` would have caught it at the sweep, the worker caught it at item 7). Two things it could not do from
  its side and said so: an event lasts one frame and the panel runs every 6th — its own latch saw one dot in six; the
  orchestrator passes `help.js`'s per-frame `hot` map into `refreshE` (`e01c157`), and a routed event's dot is its
  source's. The brief's coverage line said `6/6` where the registry has 7 entries (DRUM) — fixed in the brief.
- **Two design corrections while building.** (1) Lists are all-or-nothing: the first draft applied routes in order and
  threw at the first bad one, leaving a half-applied list — `checkRoute` (pure) then `setRoute`. (2) A fresh route is
  in force at once (`rebuild` evaluates it with `dt 0`: a fresh ema snaps, a kept one holds) so a route set by an eval
  between the refresh and `update` is not one frame late.
- **What is not routed, and why:** `LOOK.pal/tint/mood` (stateful palettes — the director's, and §1.5 says so),
  `GROOVE`, `uTime`; the director's inputs (`pickScene` reads the scene's *routed* `score`, which is the scene's to
  compute — but `updateScenes` reads the real `MS`); a scene's `look` memory (no `MS` argument). A scene must not keep
  the `MS` object across frames (§1.15; audited: none does — every scene copies what it reads in `update`).
- **The real-window check** (`docs/AUDIT-v0.4.md`, runs E1/E2 + a control): two routes set through the panel's own
  controls while a real track plays, in force on the next frame; the meter's routed value is the source's transfer
  (`centroid` 0.608 × 1.5 = `view('feigen').bass` 0.911 while `MS.bass` was 0.79) and the FEIGEN shot shows it (the
  HEAD swap); the routes survive a scene switch and a 10 s minimize (the §26 hold intact, ticks and meters on); 0 black,
  the only long frame the minimize; `ROUTE.ms` 0.01; "reset everything" stores the identity state. **Run E1's `q` sat
  at 0** for 52 s at 58 fps — not reproduced in E2 (0.52 → 0.63, the v0.3 climb), and the control (v0.3 release vs the
  v0.4 bundle, `file://`, same track, 30 s each, minutes apart) climbed **identically to the second decimal** — a
  machine moment, recorded so a single low run is never read as the routes' cost.
- **Ship.** `GPU=1 tools/accept.sh` → `accept-30.txt` **0 FAIL, 17 sections, 0 exceptions** (first run on the merged code; the new "== routes" section all green, help 107/107 on 7/7 ids, ticks 0/100, parity 0, mixs `5892ddc5…`, FEIGEN L3.6 1.34 ms vs NAV 2.16, hidden tab / worklet clean) → `git tag v0.4` → `releases/eigenwobble-v0.4.html` =
  `dist/eigenwobble.html` at the tag → `NEXT-SESSION-PROMPT.md` = the v0.5 candidates with **per-visual-parameter
  routes** as the first line (a scene declares its visual parameters as a slot — "the tube radius", "how many
  mirrors" — and the panel routes `MS` fields into *those*, the natural second level of the same panel; the per-field
  level shipped here is what it composes over).
- **How v0.4 was run:** core first as two leaf-ish modules proven no-op by md5 + parity before any UI existed, the
  contract section written before the worker's brief, the brief naming the four calls the core would make and the
  elements the orchestrator would later drive, one worker from the brief alone (first shoot), the merge judged on its
  screenshots, the audit only on the merged code, and a cost finding on the real path chased with a second run and a
  same-conditions control of the previous release before being written down as "the machine, not the code".

## §28 panel-legibility — the panel you can read (v0.4.1, 2026-09-24, orchestrator + one worker from `docs/workers/brief-panel-2.md`, report `panel-2.md`)

The user's first hands-on with the v0.4 panel on real music produced three sentences; each became one change, nothing
else was touched (the routes core, the director, every reference md5 and the v0.2 look are as at v0.4).

- **"It looks like I'm mapping musical features to other musical features"** → the row's first column is now the visual
  ("what it drives here", bright and wide), the jack (`bass · level`) second, and each block says under its heading
  *each row is one input of this scene: the left column is what it moves on screen, the source is the music feature
  you plug into it*. Same data as v0.4 (`help.feats` / `FEATS.drives`); the panel merely names the visual first.
- **"It doesn't seem like changing the parameters changes the viz"** → four causes, four answers. (b) *bid-only
  fields*: a field a scene reads only in `score()` is now a contract convention — its `help.feats` line begins `the
  bid:` (CONTRACTS §1.13); the audit found 17 such fields across the six scenes and 6 lines without the prefix (`arc`
  in TORUS/DUST/MANDALA/FEIGEN/POLYTOPE, NAV's `clarity`), fixed; the panel dims the row and says *bid only — moves
  nothing while the scene is forced; changes when the director picks it*; `check.js` warns both ways (a `the bid:`
  field read outside `score()`, a `score()`-only field without the prefix — static per scene folder, score bodies cut
  out, HEAD uniform components in GLSL counted as `draw()` reads since `mandala.bass/high`, `feigen.bass` and `nav.high`
  are read only through `uBands`). (a/c) *preview the extremes*: per row `0` / `1` route the jack to `FEATS.range`'s
  ends (a raw field: 0 and twice the live value) for 2 s of help ticks, then the previous route — or none — comes back;
  `fire` on an event row is a new core call `pulse(scene, field)` (route.js): the event is `true` on the scene's view for
  exactly the next frame, a view created for that frame if the scene has none, never a route, never stored; `closeE()`
  (help.js → panel) ends a preview when the view closes. Storage is never written by a preview and the preset textarea
  is not refreshed while one runs. (d) *which scene am I dialling*: a line under the E heading — *the director is
  choosing scenes — force this one while you dial* with **force** / **release** (`MANUAL.scene`), and every block heading
  says `on screen` / `not on screen` live.
- **"The drop down is white background with white text"** → `#help{color-scheme:dark}` plus `#help option{…}`: the
  native popup is the browser's window, not the page's, and only `color-scheme` reaches it. Judged headed with the
  list open (`tools/work/p2-dropdown.jpg` in the worker's tree): dark list, light rows, the first row highlighted.
- **What the worker found** (`panel-2.md`): a `<select>` popup is an override-redirect X window that
  `Page.captureScreenshot` never contains and `xwd -root` refuses (`BadColor`) while it is up — python-Xlib grabs it;
  `xdotool … windowactivate` by class raised other Chrome-class windows on the desktop (never do it in a headed run);
  the trusted `{clickSel}` click opens the list, `{key:'Alt+ArrowDown'}` does not (cdp.js sends no modifiers);
  `CARD.view` takes a name; a DOM-built table has no `tbody`. `panel.js` reached 403 lines with the list moved in, so
  the DOM helpers and the four cell builders became the leaf `core/panel-ui.js` (89 lines, imports nothing); `check.js`
  now covers it in the literal-name check.
- **Proofs.** `check.js` 0 fail 0 warn (the bid check proven to fire both ways on a deliberately broken FEIGEN); route
  smoke 68/68 with 10 pulse checks; `parity.js fake` 0 diff over 72 fields after the route.js change; both scene-md5
  lists (v2 default, `&colour=oklch`) identical to the v0.4 references before the merge; the worker's ten acceptance
  items (identity md5s `8d6ac4a6…` / `fb74fee4…` with the panel opened and closed, ticks 0/100, the preview by eval at
  f150/f300, `fire` at f121/f122, closeE, force/release, the bid rows, the bundle from `file://`); `accept.sh` "== routes"
  gained the preview / closeE / force-release sequence; the sweep is `accept-31.txt`.
- **Not done here, carried to v0.5:** the real answer to sentence 1 is a row that says *filament sharpness ← centroid* —
  per-visual-parameter routes (`NEXT-SESSION-PROMPT.md` item 1). v0.4.1 is the panel naming what it already has
  correctly; v0.5 gives it the thing the user asked for.

## §29 params — the visual parameters of a scene as a slot the panel routes into (v0.5 item 1, 2026-09-24, orchestrator + three workers from `docs/workers/brief-{feigen-params,nav-params,panel-3}.md`)

**The decision (the user, 2026-09-24: "proceed" on `NEXT-SESSION-PROMPT.md` without looking at v0.4.1 first).** The real
answer to sentence 1 of the v0.4.1 brief ("how do I map the musical features to the visual ones?"): a route whose *target*
is a visual parameter — *"in FEIGEN, the filament sharpness is fed by the centroid"*. A scene declares `params: {name:
{eli5, range: [lo, hi], from: (MS) => …}}` (CONTRACTS §1.16); the core hands `update()` the values as `env.params`,
**exactly `from(view)` while nothing is routed** (identity by construction, as v0.4's view is), else the route
`PROUTES[scene][param] = {src | 'const', c, k, b, inv, tau}` with the transfer in the parameter's unit interval and the
range scaling it. Everything else composes over v0.4: a field route still feeds `from()`, the preset JSON gains a
`params` block through `route.js BLOCKS`, `&param=` uses `route.js`'s grammar.

- **`params-core` (`8d5bbd0`, `core/params.js` ~150 lines, a leaf-ish module: `route ← params ← scenes ← manual ←
  harness`, `loop.js` sets `env.params = refreshParams(sc, dt)` before each `update()`).** Design choices: (1) the values
  live in one object per scene refreshed in place (no allocation per frame), handed as `env.params` rather than
  `this.params` so the declaration object is never shadowed; (2) `from()`'s reads are recorded once at registration
  with a **Proxy of `MS`** — a read of a field not in `feats` (or not an `MS` field) throws at boot and fails `check.js`
  the same way in node; the recorded list is the panel's "derived: bass, tension" source label; (3) the transfer works
  in the unit interval (`u = clamp01(k·x̃ + b)`, `value = lo + (hi − lo)·u`) so `k 1 b 0` maps any level onto the whole
  range and a constant is typed in the parameter's own units; an `event` source is 1 on its frame (with τ a decaying
  pulse — "brightness ← kick"); any level / raw / angle / event field may feed a parameter whether or not it is in the
  scene's `feats` (the parameter is the scene's, the source the engine's); (4) a constant `from: () => 0.04` is allowed
  and shown as a manual setting — "every visual parameter traces to `MS`; a constant is a manual setting, shown as one".
  Proofs before any scene declared a parameter: both md5 lists identical, parity 0, mixs `5892ddc5`, `tools/param-smoke.js`
  49 (two smoke findings fixed: a scene without params gets `null`, and `centroid` is a *level*, not raw — the test's
  assumption, not the code's).
- **FEIGEN (worker, `feigen-params.md`, 5 commits, one per move, each md5-identical on v2 + oklch f360/f840):** `width`
  (1 + 0.25 tension − 0.18 dropEnv − 0.03 kick, [0.4, 1.8]), `dive` (0.25 + 1.5 lvl, [0, 2]), `roll` (the constant 0.04,
  [0, 0.4]), `glow` (lvl → `uLevel`, [0, 1]), `thick` (bass → a new `uThick` replacing the `uBands.x` read in both colour
  passes, [0, 1]). Three finds now in §1.16: `from`'s argument must be named `MS` in a module whose state is a `const S`
  (`check.js`'s decoy rule); an expression moves whole or not at all (the dive's `dt/(32·period)·A·B·C` is
  left-associative — lifting `B·C` re-associates: 46 % of random draws differ in the last ulp, and `feigL` integrates —
  only `A` moved); a shader-side value becomes a parameter only through an existing uniform (fp32 → fp64 folding is a
  pixel change). `feigen.thick=centroid*1.5` is the user's sentence, literally, at f360 = 0.6825.
- **NAV (worker, `nav-params.md`, 5 commits, each md5-identical + parity 0):** `trap` (0.35 + 0.9 mid, [0.35, 1.25]),
  `zoom` ((1 − 0.05 bass − 0.07 hit)(1 + 0.25 dropEnv), [0.5, 2]), `dots` (1 + bass, [0, 3]), `pip` (sstep(0.05, 0.3,
  presence), [0, 1]), `reach` (the exterior depth target, [LG_MIN, LG_MAX] = [−11.9, 0.9]; reads eS, tension, dropEnv;
  passed into `updateNav` through `opts.P`). `spin` (the trap rotation) was built, proved identical and **reverted**: an
  unwrapped angle cannot honour a finite range (§1.16 open end). Continuity monitor `viol []` unrouted and with
  `trap ← kick`; **`reach ← kick` trips it 7 times** (the exterior spring's response is exponential in `reach`; an
  impulse snaps c across 12.8 units) — the honest answer for that parameter, recorded in §1.16 rather than clamped
  (a clamp would break the identity). DRUM (id 4) has no reference line (`scene-md5.sh` lists scene ids only) — the
  worker baselined it at `2b9fd7e` and it is identical at HEAD.
- **Panel (worker, `brief-panel-3.md` → `panel-3.md`, 3 commits, merged `1e051fd`^):** a **parameters table per scene
  block above the jacks** — what it moves (the `eli5`, first and wide) · parameter (name, `[lo, hi]`) · source (a select
  whose first option reads *"derived: tension, dropEnv, kick"* from the Proxy-recorded reads, or *"derived: constant"*;
  then every routable field with its kind, `const` last) · transfer (`k b τ invert`, a `c` input with the range as
  `min`/`max`) · reset + **`lo` / `hi`** previews (a constant route at the range ends for 2 s of help ticks, the v0.4.1
  mechanism generalised into `panel-ui.js` over a row protocol `{tr, msg, err, ctl, get, set, done}` so both tables share
  one preview engine) · meter *derived → in force* (both live; equal while unrouted — the panel proves the identity every
  tick). The jacks table folds under `<details>` *"the inputs behind these — 16 jacks"* for a scene with params; a scene
  without keeps the v0.4.1 layout and ids. New leaf `core/panel-params.js` (125 lines; imports `params.js`, `feats.js`,
  `panel-ui.js` only), `panel.js` 347 → 328, `panel-ui.js` 89 → 122. Ids `pe-psrc/pc/pk/pb/ptau/pinv/prst/plo/phi-<scene>-
  <param>`, `pe-pdet-<scene>`. All ten acceptance items first shoot; storage through the existing `params` block of the
  preset, `reset everything` clears it. Two finds now in §1.16: `env.params` is refreshed only on frames the scene
  updates (an off-screen scene's "in force" meter is its last value), and an event *source* takes the full transfer
  (unlike a v0.4 event jack) — the panel hides `k b inv` for `const` only. **The user's sentence in a real window**
  (`p3-real-2.jpg`, DPR 1.5): the FEIGEN block's row *"how thick the glowing filaments are · thick [0, 1] · centroid ·
  level"*, derived 0.237 → in force 0.455, set through the panel's own select — judged by the orchestrator's eyes.
- **Merged-tree proofs (before the panel merge; the panel is closed-by-default DOM):** both md5 lists identical, parity 0
  diff, mixs `5892ddc5`, `&param=feigen.thick=centroid*1.5,nav.zoom=c:2` → `PROUTE.n` 2, FEIGEN's values `{width 1.040,
  dive 0.460, roll 0.04, glow 0.140, thick 0.6825}`, errs `[]`.
- **Ship (not tagged).** `GPU=1 tools/accept.sh` → `tools/accept/v0.5/accept-32.txt`: 18 sections, the new "== params"
  all green (smoke 49, identity `paramsOf == derived` on 5 parameters, a centroid route and both range ends move the s6
  md5 and lo ≠ hi, the panel sets a route by select and previews `hi` for 2 s of ticks with storage null), help 107/107 on
  7/7 ids, parity 0, mixs `5892ddc5`, bundle clean, **one FAIL: "hidden tab back … onsets:1"** — the v0.3 resume-hold check,
  which item 1 cannot touch; re-run twice in isolation → `onsets:0` both times (as accept-30/31), recorded as an addendum in
  the log: a machine moment (the check counts 60 frames, the hold is 1 s — slow frames let the demo's next onset into the
  window). **v0.5 is not tagged on item 1 alone**: the user has not looked at v0.4.1 or at this panel; `NEXT-SESSION-PROMPT`
  asks them to, and to decide whether the tag comes now or after the list. `dist/eigenwobble.html` is the build to open.
- **How it was run:** the core as one leaf-ish module proven a no-op (both md5 lists, parity, mixs) before any scene declared
  a parameter; the contract section written before the three briefs; two scene workers in parallel (the two Chrome slots),
  each move its own commit proven byte-identical; the panel worker after the first scene merge, from the brief alone,
  first shoot; every worker's friction folded into §1.16 the same day; the merge judged on the workers' montages.

## §30 nav-iter — the iteration budget without a chart (v0.5 item 2, 2026-09-24, orchestrator + a NAV worker from `docs/workers/brief-nav-iter.md`, report `nav-iter.md`)

**The diagnosis was wrong, and the worker showed it before touching a line.** §26 / `AUDIT-v0.3.md` check 1 said NAV's
f1500 cost (7.7 ms vs 1.8 at f480) was "convergence detection taking the full `uIter` near a parabolic root". At f1500
`cyc.has` is **0** — `nav.js` hides the chart while the beat kick is up (`k > 0.02`, kick 0.147 there) — so the shader has
**no convergence exit at all**, and the budget is **420**, not 264: c sits inside a period-4 baby, where `draw()`
multiplies `Q.iter` by 1.6. The control is f2100 — the same baby, 420, |λ| as close to 1, but *with* a chart — at 2.7 ms.
The brief's first candidate (widen `uEps2` as |λ| → 1) had nothing to widen. Corrected in `AUDIT-v0.3.md` (a dated note).

- **The exit rule (`ITER_LO = 0.5`, `uIterLo` uploaded beside `uIter`, the same three lines in both shader files):** the
  loop already computes `|(f^n)'|²` for the `big` test; now named `dd`, loop-local. Without a chart (`uLam.w < .5`) an
  orbit whose `dd < 1` after half the budget is inside a basin — it can no longer escape, and the only thing its remaining
  iterations could move is the line trap `tL`, which settled long before — so it breaks. The exterior path, `tL`, `tC`
  and the escape branch are untouched by construction (nothing they read depends on where the loop stops). `nav.js` (the
  state, parity's dump) is untouched.
- **Measured (bench protocol, `Q.iter` pinned 264, medians of 3 × `bench(0, 300)`, interleaved A/B, two runs; the machine
  drifted 2.5× across the session — ratios are the signal):** f1500 6.69 → 4.67 / 6.17 → 4.87 (**0.70 / 0.79**), f480
  0.86 / 0.98, f900 0.97 / 1.05, f2100 0.89 / 1.05; f1500 / f480 **4.5 → 3.7**. Headed 1920 × 1080 agrees (0.74 / 0.76).
  **The brief's target (f1500 ≤ 2 × f480, ≤ 0.5 × before) is not met and cannot be by the interior alone:** the exterior at
  that baby-copy view costs ~2.55 ms extrapolated to zero iterations — more than all of f480 (1.62 ms) — so the ratio's
  floor is ~1.6 with a free interior. The levers left are the 1.6× baby boost and the view scale, both design, not budget.
- **Pixels:** every scene-md5 line byte-identical (v2 and oklch, s0 *and* s4 — DRUM had no reference line: `scene-md5.sh`
  grepped `^  id:` and never saw a variant's four-space `id: 4`; fixed, both lists carry s4 now from the worker's HEAD
  baseline); `par` 0.00 at f360 and f840 (the `conv` branch is dead at both checkpoints, so they could not see the change);
  parity 0; monitor `viol []` (n 3606). **f1800: 0 pixels differ at a third the cost.** f1500: 1.20 % of pixels > 2, 0.037 %
  > 32, max 85 — two small dendrite spirals deep inside the dark lobe, late-escaping filigree the 420 cap was already
  deciding (`ni-1500-montage.jpg`, cap probes `ni-cap{420,264,211,158,106}-f1500.jpg`); exterior dust, equipotential
  ripple, trap ring, outline, interior wash, PiP untouched. `ITER_LO 0.4` buys another ~8 % at f1500 and moves the OKLCH
  s0-f360 jpg by 2/255 at one pixel — shipped 0.5 because the acceptance said byte-identical (the user's call to lower it).
- **Rejected with numbers:** a Brent save + contraction certificate never fired at f1500 and cost +18–22 % everywhere; the
  guard `dd·uPx² < 1` doubled the f1500 damage; `dd·uPx < 1` broke f360; a plain lower cap moved 2.43 % of f1500 *and* f360.
- **Q trace (orchestrator, merged code, `q-house-{before,after}-nav-iter.txt`, `VISIT=` empty — the director's own picks, 3 runs
  each, one Chrome, nothing else on the machine):** identical to the second decimal — q mean 0.75 / min 0.44, windows 0.59 / 0.73 /
  0.85 / 0.95, the same scene sequence `0 5 0 2 1 5 0 5 2 1` — the house demo never walks NAV into the baby-copy region the fake
  timeline reaches at f1500, so the trace proves a non-regression, not a gain; the gain is the bench table above.
- **Lesson:** a cost finding's cause is measured before it is briefed — the audit wrote the plausible mechanism, not the
  observed one, and the item's acceptance was derived from it. The worker's first move (a cap probe at f1500 and the f2100
  control) is what the brief should have asked for first.

## §31 chain-k — the tonemap knee as a LOOK parameter (v0.5 item 4, 2026-09-24, orchestrator)

`CHAIN.k` (1.5, §20) was the composite's fixed knee. Now `LOOK.k = CHAIN.k · (1 + CHAIN.kMood · (2·arousal − 1))`, ≥ 0.2,
computed in `look.js` every frame and handed to `runChain` as `io.k` by the loop (`runChain` falls back to `CHAIN.k` for a
caller without one — `chain-smoke`). **`kMood` defaults to 0**, so the knee is *exactly* `CHAIN.k` and every reference md5
holds — the default look is v0.2's, the mood drive is a knob (arousal → a harder knee: with kMood 1, calm music k 0.75,
fierce 3 — a harder knee lifts the mids: 0.18 grey through the linear composite reads 135 / 150 / 177 at k 0.75 / 1.5 / 3).
`&k=` and `&kmood=` under `#test`; `chain-smoke.js` checks the three-k ladder, `io.k` = the default's pixel at 1.5, and
`LOOK.k === CHAIN.k` at kMood 0. Not in the panel yet (a "chain" row in the manual section is a panel item — carried).
**Proofs (merged tree, item 2 in):** both scene-md5 lists identical (14 lines each, DRUM included), parity 0 diff, mixs
`5892ddc5`, `chain-smoke` OK (the ladder 135 / 150 / 177, `io.k` 1.5 = the default's pixel, `LOOK.k === CHAIN.k`); the DUST
drop-frame clip (`CLOCK=1`, mask at 780, shot 781, pixels > 128): **0.117 %** at the default (§20 read 0.12) and **0.143 %** with
`kmood=1` (LOOK.k 0.825 at that frame's arousal 0.275 — calm music softens the knee), both under the 0.2 % gate; `&k=3` moves
DUST's s1-f360 (`bd378864…` vs `c6166af9…`). Not benched: the composite's cost does not depend on k.

**The cycle (found by the colour-slot worker's file:// check, fixed `7406869`).** The first cut computed `LOOK.k` in `look.js`,
which imported `CHAIN` from `post.js` — and `gl.js` imports `look.js`, `post.js` imports `gl.js`: `gl → look → post → gl`. The
http page never noticed (native modules resolve a cycle), `bundle.js` wrote a file (it does not detect one), and the bundle died
from `file://` with "Cannot destructure property 'G' of gl.js as it is undefined" — the second time a worker's `file://` item has
caught a dead bundle (v0.4's `TAIL` regex was the first). Now `LOOK.k` is set in `loop.js` (which imports both) and **`check.js`
fails on any import cycle in `assets/`** (a DFS over the relative-import graph; proven on the broken commit). Two bundle gates
exist now: the sweep's `[EXC]` count and the static cycle check after every edit.

## §32 colour-slot — a colour slot on every scene (v0.5 item 3, 2026-09-24, one worker from `docs/workers/brief-colour-slot.md`, report `colour-slot.md`)

DUST, MANDALA, TORUS and POLYTOPE declare `colour: { default: 'v2', variants: { v2: {} } }` (16 inserted lines, one commit per
scene) so `CARD.colour` lists six scenes, the cast line names `v2` on each, the panel's colour select (`pe-col-<scene>`) exists
for all six, and `setColour('oklch')` still moves exactly NAV and FEIGEN. Every md5 line byte-identical under both mappings (the
empty variant object carries no `post`, so the scene's own stays). The worker's finds: the v0.5 reference lists had DRUM's s4
lines appended after s6 while `scene-md5.sh` emits ids in order (a `sort` compare hid it) — re-sorted; a fresh worktree has no
`tools/work/` (the script mkdirs it now); HARNESS's help example labelled "the cast" scrolls to part E since the panel exists —
relabelled; and **the dead bundle above**, which its item 6 caught on a clean extraction of the base commit.

## §33 Ship items 2–4 (2026-09-24, orchestrator; not tagged)

`GPU=1 tools/accept.sh` → `tools/accept/v0.5/accept-33.txt`: **18 sections, 0 FAIL, 0 exceptions** on the merged code (items 1–4 +
the cycle fix) — parity 0, mixs `5892ddc5`, "== params" green, help 107/107 on 7/7 ids, hidden tab / worklet clean, the bundle 30 s
clean from `file://` (`hop 2831`, `switched true`). `dist/eigenwobble.html` at `6d6fe68`^ is the build for the user's eyes. **v0.5 stays
untagged**: items 5 (the OKLCH variant's open ends — opt-in, only if the user wants the variant tuned) and 6 (§21's halftime margin and
§22's ring shift — no failing trace, carried) are the user's call, as is the tag, and they have not yet looked at v0.4.1's panel or
this one. What the day changed for a listener: the panel's second level — *"in FEIGEN, the filament thickness is fed by the centroid"*
— on FEIGEN and NAV; a cheaper NAV where it was dearest; six scenes that answer `colour` the same way; a tonemap knee that can follow
the mood. What it changed for a worker: §1.16 with its finds, a cycle check, a variant-aware md5 script, and a corrected audit.

**Tag (later the same day).** The user opened the build on real music and routed a parameter from the panel: *"looks good and is ready to tag"* → `git tag v0.5` at this state, `releases/eigenwobble-v0.5.html` = `dist/eigenwobble.html` at the tag (the bundle accept-33 proved from `file://`). Items 5 and 6 stay carried into the next prompt. The project is renamed **Retina Rave** in the commits after the tag (§34) and pushed with its history to `github.com/tbkraf08/RetinaRave`.

## §34 Retina Rave — the rename and the push (2026-09-24, after the v0.5 tag; the user: "rename project to Retina Rave and push code (all the git history if possible)")

The engine is **Retina Rave** from the commit after v0.5. What changed: `index.html`'s title and landing word, the bundle's name
(`dist/retinarave.html`; `tools/bundle.js`, `accept.sh`, HARNESS), `cdp.js`'s tab-capture title match, `package.json` (`retina-rave`
0.5.0), the first line of CONTRACTS / HARNESS / brief-common, a `README.md`, and `NEXT-SESSION-PROMPT.md`. What did not: every
historical document — DECISIONS §1–§33, the worker briefs and reports, the audit files, the accept logs, the earlier session
prompts, `releases/eigenwobble-v0.*.html` — keeps the old name, because they are records of what was said when. The directory is
`~/Documents/Kraftek/RetinaRave/` (a symlink at the old path keeps old commands and the old memory key working); the twenty agent
worktrees of merged branches were removed (branches kept); the branch is `main`; the remote is `git@github.com:tbkraf08/RetinaRave.git`
with the whole history (every commit since v0.1) and the tags v0.2–v0.5.


## §35 v0.6 "public" — mobile, landing polish, about page, SEO (2026-09-24, orchestrator, plan `~/.claude/plans/i-have-a-clodeflare-delegated-squirrel.md`)

The site went public at retinarave.com the same day (§34) and the first look listed five things: mobile was a poor experience, the
landing card named two of the keys, the help headline still read EIGENWOBBLE, there was no about/support page, no SEO metadata.
Five commits, one per step of the plan, `npm run check` + `npm test` green between each.

**Step 1 — leftovers.** `help.js` h1 → RETINA RAVE. The key table became `keys()` (a function: the scene digit range reads
`REG.length`, and scenes register after the module loads) with a third, short label per key; `hud.js renderHint()` renders the
landing card's key row from it, so part D and the card cannot drift. `1–7`: only ids 0–6 are registered; `8`/`9` were silent no-ops.
The `keydown` listener now returns on `input,select,textarea` targets (typing `0.5` in a panel number field released the director;
`p`/`d`/`h`/`m` in the preset textarea fired shortcuts); Esc still passes. The panel's store line no longer prints the localStorage key
(`ew.routes.v1` stays: renaming orphans saved presets). README dropped "a file" — no file source exists.

**Step 2 — SEO + `site/`.** `index.html` head: title, description, canonical, theme-color, manifest, SVG favicon + apple-touch-icon,
Open Graph + twitter card with `og.jpg` (1200×630: the FEIGEN f420 frame under `CLOCK=1 GPU=1 'test&scene=6'`, composed with the
card's gradient h1 in an HTML page shot through cdp with a clip), JSON-LD `WebApplication`. A quiet `<p class="seo">` under the card
names the scenes (Google renders JS, but the help text exists only after a keypress). `site/` (tracked; `npm run build` = bundle +
`cp -r site/. dist/`): `robots.txt`, `sitemap.xml` (`/`, `/about`), `site.webmanifest` (standalone, any orientation), `favicon.svg`
(the main cardioid c = e^{iθ}/2 − e^{2iθ}/4 and the period-2 bulb, stroked in the h1 gradient; PNG icons 192/512/180 are Chrome
shots of it), `_headers` (page 300 s, images a week). `.gitignore` gained `!site/*.jpg`. The landing scrolls when the card is taller
than the viewport (`overflow-y:auto`, `.card{margin:auto}`) — the card was exactly 633 px at 1280×720 headless. **Harness fix:** the
"real start path" and bundle sections clicked `[695,440]`, which was the *demo link's* position on the old layout, not the button —
`{clickSel:'#demo'}` now (`#go` starts tab capture, which hangs headless without a picker; the first attempt used `#go` and saw
`mode none` — the button took focus, the promise never settled).

**Step 3 — `site/about.html`.** Toma's voice ("I like music and math and built this for fun"), the six scenes in one line each,
Venmo `@toma-kraft` / Cash App `$toma5`, Instagram and YouTube `@retinarave`, how to use it (desktop and phone), "▶ open the show".
Linked from the card's alt row and the help view's foot as a relative `about.html` (Workers static assets serve it at `/about`
and redirect `/about.html` there; the `file://` bundle beside `dist/about.html` resolves it too).

**Step 4 — microphone.** `engine/sources/mic.js`: `getUserMedia` audio with EC/NS/AGC off, the same bus, analyser tap and silence
watchdog as capture (`watchCapture` now watches both live modes), `stopAll` says "Microphone stopped." `ENGINE.start('mic')`. The
card is capability-aware in `hud.js`: no `getDisplayMedia` (every mobile browser) or `(pointer:coarse)` → `#landing.mobile`
(speaker copy + the mic button alone); desktop: Share a tab, then the mic under it. Proof: cdp `FAKEMIC=1` (Chrome's fake device +
fake permission UI) → `mode 'mic'`, `heard true`, landing hidden; a stopped track returns to the card; without the flag the
declined path runs the demo with its message. `parity.js fake` 0 diff over 72 fields.

**Step 5 — touch.** `core/touch.js` (new leaf over scenes/help/hud): `#tbar` (CSS-only: `(pointer:coarse)` and `body.running`) with
help · ‹ · › · ⛶, a horizontal swipe on `#gl` (> 60 px, < 700 ms, dx > 2|dy|) steps `SC.forced` through `REG` from the logical scene, a
press held 600 ms toggles the help; a swipe while the help is open does nothing (it scrolls). ⛶ → `fullscreen()` (now with the
WebKit-prefixed path) or, where no fullscreen API exists (iOS Safari), a toast pointing at Add to Home Screen. `hud.js` keeps a
screen wake lock while running (re-requested on visibilitychange; released on stop). `quality.js` seeds `Q.q` 0.35 under a coarse
pointer; `gl.js` caps the long edge at 1600 there (2560 elsewhere). `touch-action:none` is scoped to the canvas, `overscroll-behavior:none`
on the page; `#help` and `#landing` keep touch scrolling. Proof: cdp `MOBILE=1` (390×844, DPR 3, touch, `pointer:coarse` emulated) —
`.mobile` card, key row hidden, bar `flex` while running, synthetic `TouchEvent`s: swipe left 0→1, right →0, hold → `HELP.on`, bar
next×2 → forced 2; `Q.q` read 0.15 half a second in (the 0.35 seed after one SwiftShader step). `scene-md5.sh v06` = the v0.5
reference list on all 14 lines; test suite and parity as before. NAV in portrait: nothing cropped (the PiP sits under the bar's ⛶).

**Left to the user (plan E6, C7):** Cloudflare dashboard — add `www.retinarave.com`, a 301 www → apex rule, disable the
`*.workers.dev` route, verify in Search Console (DNS TXT) and submit `/sitemap.xml`, turn on Web Analytics; then the portrait
review of scenes 1–6 on a real phone (the scenes were tuned landscape; nothing in code yet). Not done on purpose: a file/drop
source (README's claim was dropped instead), shareable `&route=`/`&param=` URLs outside `#test`, the panel on a phone (its 10–12 px
mono columns overflow at 390 px; it stays a desktop tool).

**Tag v0.6 (2026-09-24):** the user looked at the live site ("looks good; tag v0.6"). `releases/retinarave-v0.6.html` = `dist/retinarave.html` at the tag (the first release under the new name; `about.html` and the icons are not inside it — they live in `site/`). package.json 0.6.0.

## §36 TORUS2 — the Hopf torus that is alive with the music (v0.7, 2026-09-24, orchestrator + one worker from `docs/workers/brief-torus2.md`, report `torus2.md`; `TORUS2-SESSION-PROMPT.md`)

**The decision (the user, 2026-09-24, after TORUS on real music):** *"1. the inside fibres are dark color and never seem to
light up; 2. should be able to detect rhythms in the bass / mids / lows; 3. color should be based on musical key; 4. rotation
of the object should be based on the speed of the music (16 beats == full turn), should subtly bounce with the beat; object
should grow is music builds / intensity; mix in different attractors like the thomas / 3 cells cnn attractor; What else can
be controlled by music to make object feel interesting and alive with music?"* — and *"create as a net new scene for now
that will replace the existing torus scene once approved"*. So: **TORUS2, id 7, forced-only** (key `8`, `&scene=7`;
`score()` 0 — the director never picks it, DECISIONS §15's lesson: a registered scene must not move a reference pick),
TORUS (id 3) byte-identical and still in the rotation. The interview settled five things as the user's: waves on the
threads for rhythm, major warm / minor cool, the key as a hue *anchor* (twelve hues keep their spacing, the wheel turns),
the 16-beat turn as a **nudge per beat**, the bounce 5 % and visible. Everything else is a lean, marked in the brief.

- **Skeleton first (`ce34cc8`):** the registration alone, proven a no-op — scene-md5 ids 0–6 = `tools/accept/v0.5/scene-md5-v03.txt`,
  mixs `5892ddc5`, parity fake 0 — before a pixel. The session prompt was wrong about one thing: `sources/fake.js` **does**
  fill `key` 9 / `mode` 1 / `keyConf` 0.8 and `kick`/`snare`/`hat` on `#test`; only `chroma` is zero (§4).
- **The scene (worker, eight commits `8a13ec3`…`9e5be87`, `assets/scenes/torus2/{index,shaders,waves,colour,motion,attractors,help}.js`,
  1022 lines, `tools/test_torus2.js`):** (1) the inside lights — a brightness floor (`GLOW`), the fog capped, the quiet inner
  families flash on `kick`, `hat` shimmers along every fibre: centre luminance at f360 **0.56 vs TORUS's 0.29** (`tools/lum.py`,
  centre 20 % / rim annulus; ratio 2.6); (2) **waves on the threads** — a rising edge of `kick`/`snare`/`hat` launches a bump
  (displacement normal to the stroke *and* a brightness pulse) that travels **one ring per bar** on the beat clock
  (`beatCount + beatPhase`, no wall clock), a ring buffer of 8 launch beats per band as uniforms, summed in the vertex shader;
  the rhythm is the spacing: the pinned 4x4 train reads positions `.10 .35 .60 .85` (gaps .25), the syncopated one `.10 .225
  .60 .725` (gaps .125/.375) — `hooks.train`, `hooks.info`; (3) **colour from the key** — anchor `((7·key) mod 12)/12` on the
  circle of fifths, eased ~2 s on the unwrapped hue, `mode` pulls the anchor 45 % toward warm 0.02 / cool 0.55, `keyConf` < 0.3
  holds the last key and slides toward `LOOK.mood`, `valence` on top; the spread narrowed to 0.30–0.75 **centred on the anchor**
  (a full-rainbow spread let no bias read — the cost is the v0.2 twelve-hue look, the user has not seen it yet); (4) a
  **nudge per beat** (`turnT = beatCount/16 · 2π`, a 0.3 s spring, `hush`/`calm` ×2 slower), the **5 % bounce** through the
  camera distance (`max(0, cos 2π·beatPhase)^4`), growth in two stages (fibre slots per family 6→12 on `build` 0–0.5, camera in
  on 0.5–1, resting size from `intensity`/`arousal`, the drop collapse kept); (5) **attractors by advection** — Thomas, the
  3-cell CNN (the brief's weights were *not* chaotic — λ ≈ 0; the standard three-cell template with s = 3.21 gives λ ≈ 0.118,
  measured in `test_torus2.js`), Aizawa, Halvorsen; 8 RK2 steps in the vertex shader after projection, normalised into the
  nest's ball, clamped at 1.6× its radius (the §4 pole), lerped by `morph = 0.9·tension` (0 in `arc` idle), picked by
  `sectionAlt mod 4` with a 1 s cross-fade; (6) the alive list — all eleven, one `help.feats` line each (the unwind lives on the
  longitude φ, not on ψ: adding phase to a fibre's own parameter runs round the same circle). Six params (§1.16): `turn bounce
  size glow morph wave`, identity proven, a `morph=c:1` route moves the md5.
- **Cost (bench protocol, two page loads each with its own scene forced — a bench of an off-screen scene measures its last
  update's state, friction 12):** TORUS2 1.556 ms vs TORUS 1.267 ms at tier 3 with morph 1 and every wave live — **1.23× raw,
  1.31× NAV-normalised, 1.45× by per-pair ratios**, all under the 1.5× cap; the extra is the advection (halved by `STEPS` 8 → 4).
- **Merged-tree proofs (`9e5be87` + the accept section):** ids 0–6 identical, s7 md5s `7189a6ba` / `48113eda` stable across three
  runs (`tools/accept/v0.7/scene-md5-v07.txt` = the v0.7 list), mixs `5892ddc5`, parity 0, `accept.sh` "== torus2" (md5s, the
  luminance gate centre ≥ .4 ratio ≥ .35, the two trains even/uneven from `hooks.info` de-duplicated — a wave a bar old sits
  where a new one launches —, the param route).
- **Friction now owed to the docs:** `arc` has no `'intro'` (the enum is `idle|valley|sustain|build|peak`); `#test` sets `hat`
  to exactly 0.5 (an edge detector's threshold must be below it); `ctx.budget('segs')` is the CPU-buffer budget, a path-B scene's
  segments per ring stay geometry (§1.4 says so; the brief contradicted it); a two-argument hook is reached through
  `CARD.REG[id].scene.hooks.f(a, b)` in an eval, not `&name=`; `goScene` does not beat a sticky `&scene=`; `paramDeps` misses a
  field behind a short-circuit on the defaults (write `a · (cond ? 0 : 1)`); `tools/probe.js` needs a real window (headless
  luminance is `tools/lum.py` on the shot, post-composite).
- **What the user should look at first (the worker's own doubts):** the wave amplitude `WAVE0` 0.26 of the fibre radius (4× the
  lean; 6 % was invisible; the rings are lobed between kicks), the narrowed spread, `MORPHK` 0.9 (aba at 50 s is a magenta comet).
  Not built: the `oklch` variant (v2 alone is declared; `colour.js anchor()` returns a turn, so a `palOK` pass is small).
- **Replacement (not done — waits for the user):** TORUS2 takes id 3's bid (`0.25 + 0.45 clarity + 0.3 regularity`, 0 in builds),
  TORUS moves to id 7 as `torus-v1` forced-only for one release, both md5 lists re-based in the same commit, §37 records it, then tag v0.7.

## §37 TORUS2 promoted — the swap, the re-base, the v0.7 tag (2026-09-24, orchestrator; the user: "torus2 looks good, promote it. tag then deploy")

**The decision:** the user looked at `tools/accept/v0.7/montage-torus2-{real,demo}.jpg` and the build and approved TORUS2 as built —
none of §36's leans was questioned (the wave amplitude .26, the narrowed spread, `MORPHK` .9, minor not always cool), so they stand
as the v0.7 look and stay the first knobs if the user ever objects. The Replacement path of `TORUS2-SESSION-PROMPT.md` step 4, exactly:

- **The swap:** `torus2` is **id 3** and carries TORUS's bid verbatim (`arc === 'build' ? 0 : 0.25 + 0.45 clarity + 0.3 regularity`;
  `clarity`/`regularity` added to its `feats` with "the bid:" lines). The old TORUS is **`torus-v1`, id 7**, `score()` 0 —
  forced-only (key `8`) for one release; `arc` and `regularity` left its `feats` (only the bid read them). `main.js` registers
  `[nav, dust, mandala, torus2, polytope, feigen, torus]` so the cast order is by id. CONTRACTS §1.8's table says so. Deleting v1 is a
  later, separate decision of the user's. The about page's TORUS line ("the Hopf fibration itself: circles on the three-dimensional
  sphere, projected down to where we can see them") is still true of TORUS2 and stays.
- **The re-base, in this same commit:** `tools/scene-md5.sh` after the swap is the v0.5 v2 list with **s3 ↔ s7 exchanged and nothing
  else moved** (s3 = `7189a6ba` / `48113eda`, s7 = `d3e73b38` / `7e77c7b3`) → `tools/accept/v0.7/scene-md5-v07.txt`; the OKLCH list
  likewise → `scene-md5-v07-oklch.txt`; `accept.sh` and HARNESS point at them. The **mixs reference md5 is `641f6633`** (stable across
  two runs): the director-blind 0→3 fade at f178 now lands on TORUS2 (was `5892ddc5` with TORUS at 3 — the recipe is unchanged, the
  pixels are the new scene's). Parity fake 0 diff (the swap touches no core file). `test_director.js`, the manual / route / param
  smokes unchanged.
- **Q trace with TORUS2 in the rotation (`q-{house,aba}-promoted.txt`):** house 0.56 / 0.71 / 0.83 / 0.93 (minima .66 / .77), aba 0.56 / 0.71 / 0.83 / 0.98 (.65 / .77) over three runs
  each — the same digits as `q-*-after.txt` with TORUS2 unregistered-as-good-as (§36) and as the v0.5 trace; the director now picks
  id 3 on aba in every run (`seq … 3 …`) and the knob never notices: a 1.23× TORUS scene under the 0.4 µs/segment line cost is invisible
  to a controller that moves on 18.8 / 26.5 ms frames.
- **Tag v0.7 "alive":** `GPU=1 ACC=v0.7 tools/accept.sh` → `tools/accept/v0.7/accept-34.txt`, 19 sections, **0 FAIL** (parity 0, mixs `641f6633` = recorded, hidden tab / worklet
  clean, params identity, "== torus2" all green at id 3, bundle 30 s clean). `releases/retinarave-v0.7.html` = `dist/retinarave.html` at the tag; package.json 0.7.0; pushed to
  `main` (deploys retinarave.com: key `4` is TORUS2, key `8` the old torus).

## §38 Proof sized to the diff (2026-09-24, the user: "when building/updating a scene only need to test that one scene")

**The decision.** After TORUS2 the user asked why a new scene took so long to test; the answer was four eight-scene md5 lists, two
Q traces and a full sweep for a change confined to one folder. The §15 incident that started the habit was a *registration* effect
(the director's pick moved a reference), fixed by making the mixs reference director-blind — not evidence that one scene's folder
can reach another's pixels (it cannot: CONTRACTS §0, a forced shot runs one scene). HARNESS "What to re-prove after a change" is
now the rule: a scene-folder diff proves its own lines (`IDS=<id> tools/scene-md5.sh`, ~1 min), a registration change one full list
once, core/engine changes the sweep, and the Q trace only when a scene *enters the rotation* (a bid of 0 cannot be picked — the
forced-only trace in §36 measured nothing). `scene-md5.sh` honours `IDS=`; `brief-common.md` tells workers so.

## §39 NAV2 — "the melody draws the path" (v0.8, 2026-09-25, orchestrator + one worker from `docs/workers/brief-nav2.md`, report `nav2.md`; `NAV2-SESSION-PROMPT.md`)

**The decision (the user, 2026-09-24, after TORUS2):** *"update the NAV scene (don't touch existing, create new scene) … right now we
are bounded by known locations, how can we make the music actually navigate? … when a sound moves up and down that the set isn't
moving with it … I like the way the set curls, but doesn't always line up … when you hear a swirl that it starts curling (and when
building before a drop)."* The interview settled four things as the user's: pitch height is Im c ("the melody draws the path", no
charts, no target tables); the blob's spokes/bands *and* the whole blob move with pitch; a swirl = filter sweep / drum roll / dj
scratch; the curl to cause = the spiral arms and the whole frame turning. So: **NAV2, id 8, forced-only** (key `9`, `score()` 0), NAV
(id 0) byte-identical and home until the user approves.

- **Skeleton first (`eab125a`):** NAV lifted verbatim under the new name, proven a no-op with one full list (ids 0–7 = the v0.7 list,
  **s8 = s0** `fb74fee4`/`7225ea02`), mixs `641f6633`, parity 0. Two engine facts paid for on the way: `loop.js` calls **every**
  registered scene's `overlay()` every frame, and a forced scene is **drawn on its first frame before its first `update()`** — an
  uncaught read in NAV2 aborted the frame for every scene, froze the CLOCK=1 clock and moved NAV's own md5 (CONTRACTS §1 overlay line;
  the skeleton guards both and was `always: true` for that one commit so its update history equalled NAV's). `math/mandel.js` starts
  the ray-grid worker once per page.
- **The scene (worker, seven commits `167bbd9`…`4f38399`, `assets/scenes/nav2/{index,nav2,exit,detect,shaders}.js` + `assets/math/field.js`,
  `tools/test_field.js`, `tools/test_nav2.js`):** c is a ball rolling inside M under three forces — the melody's pull (Im c ← centroid
  through a `W_Y` 14 spring, Re c ← bass − high in musical time), **the wall = |λ| of the attracting cycle found chart-free every frame**
  (critical orbit → nearest return → divisor test on the polished point → Newton on f^q(z) − z; ∇ρ by central differences; an outward
  step is projected tangential and bisected — c slides along the rim; ρ alone is not a wall: a step across a root lands in the next
  component with a *small* ρ, the period test is), the wind-up pressing c to `RHO_CAP` .985 so the arms tighten by construction
  (`arg λ / ln|λ|`); **gates through parabolic roots by Farey** (q ≤ 7, a step the wall refused held `GATE_HOLD`, child size proxy);
  **the drop** the one cut (a clean-checked ray along the ρ-normal to NAV's depth, `pathCut` 0, EXT/HOME/IN legs = NAV's settle rule in
  chart-free form); no Misiurewicz kick (`state.kick.x` 0 for ever); every non-cut frame ≤ `V_MAX·dt` = 0.02 < the monitor's 0.06 by
  construction. Five uniforms with IEEE-identity rests (`uKoen`, `uCurl`, `uView.xy`, `uView.w`, `uGlow`) so `&still=1` is byte-identical
  to the scene without them — the no-op gate of every visual step. Detectors in `detect.js` (pitch = high-passed centroid, sweep, roll,
  scratch = flicks of a bend, swirl = soft-OR, wind on synapse's `dropExpectedIn` countdown + `build` + `hush`, spin rate integrated).
  Six params `height side wind lift spin zoom`. Bugs found by the node tests, not by pixels: `pot()` off by exactly 1 against
  `buildRayGrid`; the nearest return naming a non-primitive period where λ ≈ −1.
- **Cost:** 0.95–0.99× NAV (bench protocol, q .95 + `Q.iter` pinned, each scene forced in its own page); `update()` median 0.004 ms in
  node; the monitor `viol []` with max exactly `V_MAX·dt`.
- **Two retune passes from real-music traces (the orchestrator's headed runs + an 80 s `n2info` trace at 2 s on each mp3,
  `AUDIT-v0.8.md`):** the headless build passed every gate and was wrong twice on real music. (a) `sweep` saturated (median .67/.86)
  because its centroid-trend term fired on ordinary jitter → the frame stirred on a plain groove; now a *sustained monotone climb* (≥ 1.2 s,
  rate-scaled, capped .85 — only `riser`/`hp` reach 1): median .01/.03. (b) c rested at the 1/2 root (Re −0.8, the cardioid's neck), so
  the melody's Im wish was capped at ±0.17 and every drop rode out toward the antenna; then, in the belly, ρ rested at .4–.9 and the
  interior was dark (`lum.py` centre .13–.17 vs NAV .5–.8). Pass 3: **the wall owns the radial direction** (a two-sided spring to
  `RHO_FREE` .91, the melody's pull projected onto the ρ-contour's tangent *unconditionally* — a conditional projection made its
  threshold an unstable equilibrium; the normal is degenerate at c = 0 and pushed c to the cusp) and the running centroid normaliser
  centred on its window (anchored at the floor it read −1 on a flat centroid). After: c covers the whole cardioid on WLTP, three gates on
  CN under the melody alone, `RHO_FREE` chosen on a luminance table (`&rho=` pin: .91 is where the melody riding the rim first reaches the
  1/2 root). **Lesson (HARNESS "Real window" gains a line):** a detector's false-positive rate and a navigator's resting place are
  invisible headlessly — the acceptance for any music-follower is a real-track trace of its own state at 2 s, with the tab URL and
  `AU.mode` printed (the first driver's tab URL was broken and traced other audio: two "tracks" with identical numbers).
- **Definition, not weakening (the worker's record):** at a parabolic root there is no attracting cycle, so `has` is 0 and ρ is 1 by
  definition while a gate transits; those frames are counted and reported separately in `test_nav2.js`, not failed.
- **What the user should look at first (ranked in `nav2.md`):** `RHO_FREE` .91 (resting brightness — NAV2 is darker than NAV in most
  real-music frames, ratio median ≈ .3), `GATE_HOLD` 1 beat (9.9 % of `#test` interior frames are gate transits with no chart), `Y_AMP` /
  `PITCH_K`, `LIFT`/`SLIDE`, `CURL`/`SPIN_SW`, the scratch thresholds (never fired on either track). Not built: the `oklch` variant,
  re-hosting DRUM (`uDrum` uploaded 0, no variants).
- **Replacement (not done — waits for the user):** NAV2 → id 0 with NAV's bid, NAV → `nav-v1` id 8 forced-only, DRUM stays nav-v1's,
  `parity.js` `&scene=0` → 8 + `CARD.REG[8].scene.state`, mixs re-based, lists → `tools/accept/v0.8/`, the about page's NAV line, the Q
  trace on house + aba, §40, tag v0.8.
- **Tagged v0.8 as is (2026-09-25, the user: "tag and push as is for now" — "i validated the build, should just be tagging and pushing? full sweep is expensive"):** NAV2 stays id 8 / key `9` / forced-only, NAV stays home; no swap, no Q trace. The acceptance sweep was **not** run for this tag — the user's own look at the build is the gate, and the sweep costs ~10 % of a weekly token budget; it is for core/engine changes when asked. `tools/accept.sh` gained the "== nav2" section (s8 md5s vs `tools/accept/v0.8/scene-md5-v08.txt` = the v0.7 list + s8, the still four vs `nav2-still-md5.txt`, the node tests, the monitor) for whenever it next runs; `releases/retinarave-v0.8.html` = dist at the tag; package.json 0.8.0; pushed (deploys retinarave.com: key `9` is NAV2).

## §40 v0.8.1 "this is what it sees" — the tagline and the scene tiles (2026-09-25, orchestrator; the user: "more cosmetic changes → on landing page")

**The ask:** *"'music navigating real mathematics' → how can we change this? inspo: visualizing music / 'I taught the computer how to
listen to music'; also, how can we preview the different scenes before anything happens? (maybe give an option for people click
specific one?)"*

**Tagline.** The sub-line under the title was a product statement in small caps ("music navigating real mathematical objects"); it is
now two sentences in the first person, sentence case, the about page's voice ("Hi, I'm Toma"): **"I taught a computer to listen to
music. / This is what it sees."** The first sentence is the user's inspiration with "the computer" → "a computer" (a claim about one
machine, not the machine); the second is what "visualizing music" means here and hands the eye to the tiles right under it. The
`<title>`, the meta/OG descriptions and the JSON-LD keep the search-engine wording (they are what a search result shows, not what a
visitor reads); `site/about.html` carries the same two lines. `.sub` lost the uppercase and the letter-spacing — a sentence is read,
a label is glanced at.

**Scene tiles (the preview).** Three ways were on the table: (1) still thumbnails only; (2) a live preview by forcing a scene with no
music (the canvas renders under the card from the first frame — a dim, slowly turning NAV at presence 0, `prestart-canvas.jpg`);
(3) a live preview on the built-in demo synth. (3) won because the synth is already **silent unless monitored** (`mon.gain` 0, key
`m`) — a click can start it as a user gesture and the listener hears nothing — and because a still cannot show that the thing moves
*to music*. (1) rides along as the row's face: a tile is a real frame from the fake timeline, so the row is honest before any click.
Built: `core/landing.js` (78 lines) renders one tile per scene with a **`card` slot** (CONTRACTS §1.17: `title`, `blurb`; core stays
scene-blind — `check.js`'s no-'nav' rule holds) plus a first **DIRECTOR** tile (no picture, "on" by default); a click = `pick(id)`:
`SC.forced = id` and, while the card is up and no source runs, `ENGINE.start('demo')` with `LANDING.peek` set, which `hud.js`'s
`AU.onRun` reads to keep the card and add `#landing.peek` (the card slims to a bottom strip over a bottom-up gradient: small title,
the row, "previewing FEIGEN on the built-in demo signal — blurb", the start buttons). Keys `1–9`/`0` go through `pick()` too, so a
key on the landing previews like a click; during the show `pick()` is exactly the old key handler (SC.forced + the tile marks). A start
button calls `leavePeek()` first, so the run that follows hides the card whatever mode it lands in (a declined capture still falls to
the demo with its message); `stopAll` → `onStop` also leaves peek (the demo is muted then). `CARD.LANDING = {peek, picked, tiles}`.
Thumbnails: `tools/thumbs.sh` shoots `test&scene=<id>` at `CLOCK=1 GPU=1` and writes 480×270 q82 JPEGs to `site/thumbs/<name>.jpg`
(13–32 KB each, 115 KB for six); frames by eye from a f360/f840 montage — NAV f360 (the Julia stop), MANDALA f840 (blue), TORUS f360,
POLYTOPE f840, FEIGEN f360 (the cardioid); DUST is dim at both (green haze, `c-s1-f{360,840}.jpg`) → f1200 (the swarm in flight).
`tools/serve.js` falls back to `site/<path>` for a miss at the root so `thumbs/x.jpg` resolves in dev as it does after `npm run
build` (`cp -r site/. dist/`); the release file opened alone from `file://` has no thumbs — `img.onerror` removes the image and the
tile keeps its gradient and title (the bundle test below). Cards on the six director-pickable scenes; `torus-v1` (id 7) and `nav2`
(id 8) have none — a forced-only scene is not offered to a visitor. Phone: four tiles per row (`flex:0 0 calc(25% - 6px)`; the
first cut let a lone seventh tile stretch the full width, `landing-mobile.jpg` before the fix), the same peek.

**Proof (sized to the diff: core/hud.js + harness.js changed, no render code):** `check.js` 0 fail; headless real path (`GPU=1`):
6 tiles, six images at natural width 480, DIRECTOR on; click FEIGEN → `peek true, forced 6, cur 6, mode demo, mon 0, running false`,
`#landing.peek`; click DIRECTOR → `forced -1`; key `4` in peek → `forced 3`, tile 3 on; click the demo link → `mode demo, peek false,
forced 3, landing hidden, running true, errs []`; key `6` in the show → `forced 5`, `0` → `-1`. `FAKEMIC=1`: tile MANDALA → `#mic` →
`mode mic, forced 2, cur 2, hidden, demo gain 0`. `MOBILE=1`: `.mobile` card with the 4+3 row, tile TORUS → `.mobile.peek`, forced 3.
Full scene-md5 list vs `tools/accept/v0.8/scene-md5-v08.txt` (below), bundle from `file://` (below). Shots in `tools/accept/v0.8.1/`.
The full `accept.sh` sweep was not run (the user's rule since v0.8: the tag gate is their look at the build; no render code moved).

**Tagged v0.8.1 (2026-09-25, the user: "build, commit, tag, and deploy" after looking at the local build):** `releases/retinarave-v0.8.1.html` = the
bundle at the tag; `npm run build` → `dist/` (index + `thumbs/`) deployed by the push to `main`. No sweep, per §39's rule.


## §41 POLYTOPE dances — v0.9 "the cage dances" (2026-09-25, orchestrator + one opus worker from `docs/workers/brief-polytope-dance.md`, report `polytope-dance.md`; `POLYTOPE-DANCE-SESSION-PROMPT.md`, `docs/AUDIT-v0.9.md`)

**The decision (the user, 2026-09-25, after the v0.8.1 tag):** *"write a prompt to improve the polytope scene (can modify existing
polytope scene; only work on scene -> don't need full testing sweep; can tag and deploy when done); what musical/visual language can we
leverage from torus2 update? how can this shape dance to the music? I liked color tied to circle of fifths; should extract grooves from
bass, mid, highs."* One interview answer: **id 5 modified in place** (same id, same bid, no forced-only twin), tag v0.9, deploy, no user
gate — git is the fallback. Thirteen leans (in the brief, each marked) stood unanswered; the user has not looked at the result.

- **What changed (`assets/scenes/polytope/{index,poly4,grooves,dance,colour,help}.js`, 349/336/247/162/132/47 lines; `tools/test_polytope.js`
  220; ten worker commits `57f1e34`…`afebe63`):** the geometry of §8 untouched (the four polytopes on S³, the double rotation, the
  stereographic arcs, the cast by section seed, path A, the pole gate `GATE` 0.24). What moves it: (1) **three onset trains** — the scene
  detects onsets on `bass`/`mid`/`high` itself (a rise over a ~0.4 s EMA above `THR_BASS/MID/HIGH` 0.18/0.15/0.17, a hysteresis latch
  `ARMF` 0.5 so a ramp-and-hold files one entry not six, refractory one 16th at `bpm`, amplitude normalised by `AMPN` 0.45, ×1 when
  `kick`/`snare`/`hat` voted within a frame else ×0.6), a ring of the last 8 launches per band as ages in beats, snapped to the 16th grid
  above `gridTrust` .5, a faint bass entry from `beat` when a bar passes without a hit; (2) **the dance** — the xy plane's target is
  `beatCount/16 · 2π` and zw's `beatCount/32 · 2π` (read off the count, never integrated), a 0.3 s spring to each (×2 slower on
  `hush`/`calm`) plus a critically-damped impulse per train hit (`KICK_XY/ZW/XW` 10/7/1.8; a full bass onset lurches 18°), xw keeps
  `0.04·flowHigh` plus the high train's small kicks and the bass **pole wobble** (`WOBBLE` 0.12 rad), the sum capped at `XWMAX` 0.18;
  the **5 % thump** `max(0, cos 2π·beatPhase)⁴` on the scale, a ±2 % breath on `barPos`; (3) **the inside-out sweep on cue** — on a
  `phrase16Pos` wrap, `sectionEvt` or `dropEvt` (never in `arc` idle, at most one per `SWEEP_MIN` 4 beats) a deterministic one-beat xw
  move carries the vertex nearest the pole through it, the cell blows up and fades through the gate, then the plane settles back to
  its lock; (4) **beads along the edges** — each train paints a Gaussian bump (`SIG` .055/.042/.032 of an edge) wherever a hit's age
  lands, travelling one edge per bar, fading over `LIFE` 8 beats, bass on every edge, mid on the outer figure, high everywhere and small;
  the profile is **zero-mean** so the groove redistributes light along an edge instead of adding it (the first build added a DC lift and
  bloomed white, §7's failure — the fix raised the peak/trough contrast to 2.26× on 4x4, 8.4× on sync; f360 mean luminance +4.6 %,
  saturation unchanged, 0 % pixels blown); (5) **the colour wheel** — the anchor math of `torus2/colour.js` moved whole to
  `assets/math/keycolour.js` (`mkAnchor()`: per-scene state, so two scenes never ease one hue; `torus2/colour.js` is a 17-line
  re-export, its s3 md5s `7189a6ba`/`48113eda` unmoved in four runs), each vertex's sector = its xy angle after the rotation quantised
  to twelve, sector k = pitch class (7k mod 12), hue = anchor + k·spread/12 (spread 0.30–0.45 centred, TORUS2's), inner figure the
  anchor wheel, outer the same wheel a fifth on, chroma lights a sector `GLOW0 .35 + .65·chroma[pc]` (eased 0.15 s; on `#test`
  derived from `harmAngle` as TORUS2 does), major warm / minor cool through the shared PULL; (6) **growth** staged on `build` (the
  subdivision from the tier's own toward the maximum on 0–.5, the size on .5–1, resting size from `intensity`/`arousal`, the drop's
  60 % kept); (7) six params `turn bounce size groove glow sweep`, identity a byte-exact no-op, `groove=c:0` moves the md5; (8) `feats`
  36 fields, every one read and lined.
- **Proofs:** s5 `06b46063…`/`cccb0094…` stable on `GLOW0` .55 (the worker's `177c300f…`/`84a6bb55…` at .35; the v0.9 reference `tools/accept/v0.9/scene-md5-v09.txt` = the v0.8 list with s5
  re-based); ids 0–4, 6–8 byte-identical on the merged tree; parity fake 0 / 72 fields; `git diff 033f800 -- assets/core assets/engine
  assets/main.js` empty; the bundle runs from `file://` with key `6` → scene 5, errs `[]`. Pinned trains: 4x4 `.10 .35 .60 .85` (gaps
  .25 ×4), sync `.10 .225 .60 .725` (.125/.375). Bar series on house: the target advanced exactly four sixteenths over four beats, the
  angle lurches at each bass entry (peak nudge 0.187 rad against the 0.393 the lock advances per beat), the bounce peaks at beatPhase
  0. Pole margin over 600 frames on `#test` and house: **0 vertices newly gated by the dance** (max excursion 0.139 < `XWMAX`); the
  brief's "clamp so no vertex passes the gate" is unachievable as written (the 24-, 600- and 120-cell each reach `1 − w = 0` under the
  xy/zw rotation alone) — the bound proven instead is `|den(a) − den(0)| ≤ |a|`, so a capped excursion cannot gate a vertex outside
  `GATE + XWMAX`. **Bench** (protocol, cast pinned by `hooks.cast` — `CARD.bench` blocks the thread, a `setInterval` cannot pin state
  re-picked on an event): cast 0 tier 3 960 segs **0.528 ms vs 0.429 before, 1.23× raw / 1.25× NAV-normalised** (cap 2×); cast 2
  (24-cell ⊂ 120-cell, 6279 segs, all 24 slots live) 1.118 ms, ratio to NAV .58 (v0.2's pole worker measured .66 for this cast).
  **Q trace** house + aba, `before` (`753f985`) vs `after` (the merge), three runs each: every window mean identical to the second
  decimal (house 0.73 · .56/.71/.83/.93, aba 0.83 · .56/.71/.83/.98), 0 EXC, id 5 in every sequence.
- **The mixs reference md5 moved before this session:** `641f6633…` → `f0c9d637…` at v0.8.1 (`d7bb5b7` touched `core/hud.js` and
  `harness.js`; the user tagged on a look, no sweep ran). Proven not this merge's: the same `f0c9d637…` on `753f985` and on `de6a5fe`.
  `accept.sh` re-based with the note.
- **Docs paid:** §8's pole-gate line quoted v0.2's 0.16/3.5 two workers after the pole worker replaced it (corrected); HARNESS —
  `CARD.ctx`, `REG[id].scene` as the live object, the bench-blocks-the-thread pin, the routed-param look rule, the v0.9 re-prove row,
  `det9.py`; `check.js` now refuses `export { … } from` (the http page and `check.js` were green while `bundle.js` threw `unhandled
  export form` and the shipped single-file build died — the worker found it at step 1).
- **The headed real-music run (`tools/accept/v0.9/audit9.sh`, id 5 forced by key `6`, tab capture, 80 s each):** CyborgNinja (160 bpm)
  and WhoLikesToParty (117 bpm): 0 black frames, 0 long frames, `errs []`, `nonFinite []`, capture mode, ~4850 frames each, q climbing
  .39 → .83 as the controller warms (the same ramp NAV2's v0.8 run showed). **The three trains traced at 2 s over 80 s (`det9.py`,
  `tools/accept/v0.9/det9-{cn,wltp}-pass1.txt`), one pass, no retune:** bass 0.88 / 0.94 launches per beat (never a 2 s window without
  one, median 4–5 per window, amplitude median .28/.36 — one per beat, not one per 16th: neither dead nor saturated); mid 0.24 / 0.36
  per beat (7 and 6 of 39 windows empty, snare vote 28 % / 15 % — the snare-and-vocal lane, about every third beat); high 0.24 per beat
  on CyborgNinja (9 empty windows; its high band is a sustained wash — level median .81 against an EMA of .78 leaves no headroom for a
  rise) and 0.69 per beat on WhoLikesToParty (never empty, **62 % hat-confirmed** — the hats). `gridTrust` .8–1.0 throughout, so the
  launches sat on the 16th grid. The kick vote on the bass train is low (10 % / 25 %): the ±1-frame coincidence window is tight against
  a decaying `kick` impulse — the amplitude ×0.6 without the vote is the lean to widen first if the bass beads look faint.
- **One orchestrator pass on the look, from the real-track montage:** the after frames were plainly dimmer than v0.8's on both tracks
  though the worker had measured no loss on `#test` (f360 mean luminance +4.6 %). The cause is the wheel itself: a sector's brightness
  is `glow + (1 − glow)·chroma[pc]`, the fake timeline's `harmAngle`-derived chroma lights the wheel broadly, real chroma lights two or
  three pitch classes and leaves nine sectors at the floor — v0.8 lit every stroke fully. **`GLOW0` .35 → .55** (one constant, the
  `glow` param's resting value; the sounding sectors keep their 1.0 so the chord still reads), s5 re-based, the accept section, thumb,
  demo and real-track shots re-taken on the new value. `GAIN` and `PBRI/PWID` untouched.
- **The leans, ranked by how likely the user is to want them retuned (the worker's order, with the orchestrator's two on top):** the
  glow floor `GLOW0` .55 and the overall brightness against v0.8 (`GAIN` 1.8, `PBRI` 1.7 / `PWID` 1.2) — the pass above is one look,
  the user's is the one that counts; the high-band threshold `THR_HIGH` .17 and the EMA's ~0.4 s on dense
  highs (sparse on CyborgNinja); the bump widths `SIG` .055/.042/.032 (the brief's lean .18/.08/.04 merged a bar's four bumps into one
  on a 9-sample edge); the nudge gains `KICK_XY/ZW/XW` 10/7/1.8 with `AMPN` .45 (18° per full bass onset); `XWMAX` .18 and the
  reinterpreted clamp; the spread `SPREAD0/1` .30/.45 (TORUS2's, but its families are spatially apart and these sectors interleave);
  `GLOW0` .35; `WOBBLE` .12; `LIFE` 8; the three thresholds; `SWEEP_MIN` 4; `SIZE0/I/A/B`; `SECB` .3. Every one is a named constant at
  the top of its module.
- **Not built, for the next POLYTOPE session:** cells-as-pitch-classes (lean 9's other branch — the sixteen cells of the tesseract or
  the twenty-four of the 24-cell as the twelve pitch classes doubled, a geometry job); the OKLCH variant; portrait cropping (pre-existing,
  `polytope-dance.md` friction 15 — the outer cage runs off a 390×844 frame at every size; TORUS2's `min(1, aspect)` rule would fix it
  and shrink the phone view to 46 %, a look change the user has not asked for).

## §42 MAXWELL — the four equations that dance, v0.10 (2026-09-26, orchestrator + one opus worker from `docs/workers/brief-maxwell.md`, report `maxwell.md`; `MAXWELL-SESSION-PROMPT.md`, `docs/AUDIT-v0.10.md`)

**What the user asked (2026-09-26):** "just plan for now; new scene -> maxwells equations (right now torus2 is my favorite scene)",
one planning answer ("add 'N' for cycling next scene"), then the same day: run the plan, no full sweep (only the new scene), commit and
tag v0.10 so it deploys. So the scene is **forced-only** (bid 0, id 9, reached by `n`) and the tag has **no montage gate** — the user
looks after, as NAV2 (v0.8) and POLYTOPE (v0.9) were shipped. Everything else below is a lean the user has not seen.

**The scene (id 9, `assets/scenes/maxwell/{index,fdtd,medium,sources,render,probe,help}.js`, `math/nudge.js`, `tools/test_fdtd.js`):**
a Yee-grid FDTD in the TE mode — `Ez, Hx, Hy` on ping-pong float targets, two fragment passes a substep, Courant 0.5, grid and substeps
by tier (256×144×2 … 768×432×4), **fixed substeps per frame** (by frame count, so CLOCK=1 md5s hold: s9 4e26a427/57bac88e), a 16-cell
graded absorber, soft sources. Twelve charges on a ring by pitch class (`sectorPc`: the ring *is* the circle of fifths), lit by chroma
(from `harmAngle` when chroma is silent — the `#test` case, TORUS2's fallback), a dipole at the centre that nudges `beatCount/16 · 2π`
through `math/nudge.js` (TORUS2's `turn` ease, lifted; TORUS2 keeps its own copy this release), every hit a real wavefront (TORUS2's ring
buffer of launch times; `hooks.train('4')` → four rings 35.05 / 35.07 / 34.90 / 34.88 cells apart, predicted 35.22, worst 0.34 cells;
`'synco'` → 52.4 / 17.8 / 52.3 / 17.8 — **the rhythm is the spacing, measured off the field, not drawn**), the carrier at `bpm`.
The section is the medium (`sectionAlt` mod 4: lens · mirror cavity · photonic lattice · waveguide, 1.2 s cross-fade); `build` lowers
sigma and raises contrast; the drop turns the absorber into a mirror. Signed `Ez` → the key's anchor hue vs its warm/cool opposite
(`keycolour.js`), |E| → luminance, the H field lines as closed strokes in the anchor hue, a 5 % thump, the yaw with the nudge.
`post { fb .72, bloom .28, kaleido 0, morph .55 }`, six params (`light ring lens charge turn bounce`), 38 feats (the plan's 37 +
`harmAngle`), card + thumb at f360.

**Decided by measurement (the worker; each a named constant at the top of its module):**
1. **A source in Faraday's pass is a magnetic monopole density.** The plan's "magnetic dipole whose changing B induces the E rings",
   built literally as a magnetic current `M` in the H update, gave H a charge −∇·M: the field lines opened (`hooks.probe()` loops 0 /
   open 18). Faraday now carries **no source**; the dipole is what one is — a pair of antiparallel z-currents in the Ampère pass, its
   axis the nudge (loops 44 / open 0 on the same frame). `test_fdtd` asserts it structurally. The plan's sentence was wrong; the plan's
   "∇·B = 0 … they must never open" was the rule that caught it.
2. **The field lines are contours of the stream function** (marching squares on A, H = curl A, from a whole readback of the small
   target every `LINEF` frames), not seeded streamlines (RK4 drifted across level sets; Newton-projected RK4 was polygonal). Equal levels =
   equal flux, so line density *is* |H|. `gap` 0 at every tier; 516–3508 segments = 6–21 % of `ctx.budget('segs')`. Path A.
3. **The energy gate as the brief worded it is not a leapfrog invariant** (Σ(εEz²+Hx²+Hy²) ripples 10.4 % because E and H sit half a
   step apart); the Yee invariant (H as the product of its two half steps) holds to 1.2e-14 and the naive sum's drift is 0.41 %. The
   test gates on the invariant. ∇·B to 1e-6 after 500 steps; a pulse front at d/c ± 1 cell (measured speed 0.4966 vs 0.5).
4. **The drop's mirror takes the bulk loss away too, is a ~1.5-cell shell, holds 2.2 s then relaxes over 3.2 s.** With the music's own
   sigma a wave dies before the absorber, so a mirror at the edge alone changed the energy 0.2–2.8 %; a thick conductor ate a third of
   it; a pure exponential from the first frame never let the standing wave form. With the drive cut at f300: mirrored 752 → 745 → 705
   (−6.3 % over two seconds, −0.9 % over the first half) against a control that loses 97.4 %.
5. **A round porthole, not the grid's rectangle.** A yawing rectangle sweeps four black corners across the frame and cut the drop's
   standing wave with a straight edge; the plane fades to black on a disc of half the grid height, `FITK` frames it, `RINGM` keeps the
   ring inside a portrait frame.
6. **Cost:** 3.2× TORUS2 before, 1.25× after (medians of NAV-normalised pairs, seven pairs a page, cold pair dropped; the early pairs say
   1.6×, the late 1.28× — both pages drift together). The two levers pulled without touching the picture: the lines rebuilt every 2–3
   frames instead of every frame (the readback + marching squares was 1.0 of 2.6 ms at tier 3), the twelve-charge loop bounded by the ring
   (skips ~85 % of texels). The lever not pulled: tier 3's four substeps (three would be ~0.8× at the cost of slower light at the top
   tier) — the plan marked the table decided, so it stands; the user's eye decides.
7. Float readback: `IMPLEMENTATION_COLOR_READ_TYPE` is `FLOAT` here, so the field targets are RGBA32F and read with `gl.FLOAT` (7e-8
   against the float64 twin); the half-float path is written and unexercised. CONTRACTS §1.2's "readPixels from RGBA16F returns black"
   is true of `UNSIGNED_BYTE` reads only.

**The `n` key (core, the user's one answered item):** `stepScene` moved from `core/touch.js` to `core/scenes.js` (touch.js and hud.js
both import it; hud.js must not import touch.js — a cycle), returns the id, and both the key and the swipe go through the landing picker
`pick(id)` so a press on the card previews like a tile. `keys()` row `N`, the hint row has 8 kbd. **A v0.8.1 bug found by the cycling
proof:** `landing.js mark()` read `card.title` on a scene without a tile, so keys `8` and `9` (torus-v1, nav2) had thrown a TypeError since
v0.8.1; it now falls back to the scene's name + tag. Proof: the full scene-md5 list on the skeleton commit = v0.9's s0–s8 line for line
(registering id 9 at bid 0 moves nothing), mixs f0c9d637 unchanged, `n` ×9 from the director → forced 1…9 → 0, `9` → 8, `0` → −1.

**The real tracks (AUDIT-v0.10):** 80 s on CyborgNinja (160 bpm, 7m → 8m) and WhoLikesToParty (117 bpm, 11m), tab capture, key `9`
then `n`: 0 black, ERRS [], one long frame (2018 ms) at the capture start on WLTP before the key; the hue turns with the key; `probe().gap`
0 on all 80 samples, energy 115–867 and finite, the trains' spacings follow the kicks. q sat at 0–.34 (tier 0) for both runs where
v0.8/v0.9's runs sat at .4–.8 — an A/B the same night (`tools/accept/v0.10/ab-q-v09-vs-v010.txt`) shows the v0.9 tree collapsing the same
way at the capture start (q .28 → .01, a 984 ms frame) and climbing at the same .004/s, so the machine, not the scene; HEAD's start frame
is twice as long (2014 ms) — one sample, on the watch list. Tag v0.10 on these proofs, no sweep, no bid — the user's word.

**Leans for the user's eye, ranked:** (1) the overall brightness and the porthole's size against TORUS2 side by side (`montage-maxwell*.jpg`);
(2) tier 3's substep count (cost vs the speed of light on a big screen); (3) the mirror's hold (2.2 s) and the standing wave's length;
(4) the line density (levels per tier 9–15) and their alpha; (5) the carrier's lock to the beat grid under `regularity` (a guess — the plan
gave `regularity` no job); (6) the Ricker envelope of a hit (the plan said "a hit"); (7) the medium cross-fade (1.2 s); (8) whether MAXWELL
should bid (a score, then the Q trace on house + aba, the `accept.sh` section — not this release).

**Docs owed and paid here:** CONTRACTS §1 id line + §1.8 (id 9, the `n` key), HARNESS keys, README keys, `site/about.html` line,
`tools/thumbs.sh` PICK `9:360`. **Owed to CONTRACTS, from the worker's friction (not yet written):** §1.2 readback sentence (item 7);
§1.4 — a hook a proof calls by name is `CARD.REG[id].scene.hooks.<name>` (`CARD.hooks.key` reaches the last scene registered and `&key=`
calls every scene's), and a read-only hook must not mutate; §1.10 — a scene under a rotating camera needs a porthole; "one band of rows
per frame" is wrong for a downsampled target (a time-patchwork field is not divergence-free — read it whole, less often).

## §43 MAXWELL — "the wave remembers its note", v0.11 (2026-09-26, orchestrator + one opus worker from `docs/workers/brief-maxwell-wobble.md`, report `maxwell-wobble.md`; `MAXWELL-WOBBLE-SESSION-PROMPT.md`, `docs/AUDIT-v0.11.md`)

**What the user asked (2026-09-26, after looking at v0.10, verbatim):** "1) it feels too noisy when there is no sound ; 2) the color of
the wave should match the color associated with the coord/note (it seems to just be two colors that switches sometimes?) ; 3) the waves
don't wobble like I was expecting listening to dubstep (different music kinda looked similar)". Those three sentences are the spec.
MAXWELL is **modified in place** — same id 9, still forced-only (bid 0, key `9` then `n`) — and the gate is v0.10's: no sweep, proof on
id 9 only. Everything else below is a lean the user has not seen; **the user has not looked at v0.11.**

**The scene (id 9, `assets/scenes/maxwell/{index,fdtd,medium,sources,render,probe,help}.js` + new `colour.js`; `tools/test_fdtd.js`
group 5):** unchanged Yee FDTD, plus (1) `presence` / `alive` / `absentT` gating every source and the contours, and the plane's porthole
now shared with `strokes()`; (2) a **second, half-resolution wave equation** carrying `rgb` and a non-negative weight `w` with the same
sources, the hue being `rgb/w` — so a wavefront carries the colour of the note that launched it, and the sign of Ez became brightness;
(3) the carrier driven by **timbre** rather than tempo, a cosine second harmonic on `dirty`, the bass pumping the centre, and a wobble
that breathes the medium and pumps the carrier's amplitude. `feats` 38 → **43** (minus `regularity`, plus `presence absentT bassFast
centroid dirty punchy`); hooks 11 → **16** (plus `quiet wob timbre mxchroma mxcol`, mx-prefixed where `CARD.hooks` already owns the
name). s9 md5 `d268a071` / `473e474c` (v0.10: `4e26a427` / `57bac88e`) — the whole picture changed, so both moved; the merged tree
reproduces the worker's pair exactly.

**Decided by measurement (the worker; each a named constant at the top of its module). The plan's diagnosis was right on every claim
about v0.10's code, verified line by line before anything changed. Three things in the plan did not survive a measurement:**

1. **A uniform breath of ε cannot bunch a wave that is already in flight.** The plan wanted the rings to bunch and stretch at the wobble
   rate. A spatially uniform ε(t) leaves a plane wave an eigenmode with its **k unchanged** — only the frequency moves — so the
   wavelength of a wave in flight is frozen. Measured at 2 Hz with ε swinging 0.74 → 1.26: crest spacing moved **4 %** against the 12 %
   gate. And at an LFO rate it cannot be resolved anyway — light crosses the porthole in ~1.5 s and one 2 Hz cycle is 36 cells of travel,
   so a wavelength chirp has one crest per period. What a wobbling bass does to a spectrum is pump the LEVEL, so `WOBA` 0.85 rides the
   carrier's **amplitude**: shells of bright and dark 36 cells apart marching outward at c, **39 % peak-to-trough** on a clean 30-frame
   period (`hooks.wob(2)`, energy 356.8 → 495.9, peaks one cycle apart to 2 %). The graded breath stayed — it is real physics, it moves
   the local speed and the loss — but the gate did not.
2. **`hooks.quiet(1)` pinning `presence`, `alive` and `absentT` is not a picture of silence.** CONTRACTS §1.16: a param's `from()` is
   evaluated by the ENGINE from `MS`, so a hook that pins a field inside `update()` never reaches the params — `charge` stayed at exactly
   the value silence was supposed to take away, and the first pinned frame came back only 13 % down. The hook now pins the three band
   impulses and `sub` as well and takes `charge` and `ring` to what their own `from()`s give on the pinned fields. Then the energy is 0.
3. **"the hue boundary within one ring width of the Ez ring" has no referent.** Once the sign of Ez is brightness and the hue comes from
   the colour field, a smooth hue field has no boundary at a crest. What was measured instead: the colour field's wave keeps step with
   Ez's (colour rings 36 cells apart vs Ez's 35.2; the colour front at r = 175 against the outermost visible Ez crest at 179.8, about an
   eighth of a spacing) and the hue is the right one (0.0018 turns).

   And two smaller ones. **`ASCALE` as the plan defined it** — the A range of a `hooks.train('4')` frame at charge 1 — measures 1.118,
   which is ABOVE every musical frame (0.77…0.95), so it would thin every musical frame and (measured) would not even reduce the segment
   count. `ASCALE` is **0.55**, half that, a floor under the level spacing: above it the picture is v0.10's exactly, below it a weak
   field reaches a fraction of the levels. **The two-class chroma proof "a fifth apart"** is one sector on this ring, i.e. `spread/12` =
   0.045 turns, which no picture can separate; it is run on sectors 3 and 9, a tritone, the furthest-apart pair.

4. **The strokes needed the plane's own porthole, and that is the single biggest part of "too noisy."** In v0.10 the plane faded to black
   on a disc and the H contours did not, so the near-empty corners were stroked over the black — the loose loops outside the porthole in
   every v0.10 shot. `PORTW`/`PORTE`/`portFade` are now shared between the shader and `strokes()`; a segment whose midpoint is outside
   the disc is not emitted. **64 of 994 segments at f360, 1315 of 3480 at f840.** `hooks.probe()` now reports `drawn` beside `segs`.
5. **A linear wave operator does not preserve `0 ≤ rgb ≤ w` even though every source does.** Where the Green's function is negative, `w`
   clamps to zero under a positive `rgb` and the "chromaticity" reaches 2950. The projection `min(rgb, w)` after `max(0)` costs one
   instruction and is what makes `rgb/w` a colour — the one line of `colour.js` not in the plan, and without it item 2 does not work.
   (Related: a second-order leapfrog cannot ping-pong between two targets. The Yee pair gets away with two because each pass reads one
   field and writes the other; `u_{n+1} = f(u_n, u_{n−1})` needs three. That is the difference between 2 and 3 extra targets in the cost
   estimate.)
6. **The anchor shifts the whole wheel, and that is what made a note change colour with the key.** `sectorHue(hue, k, spread)` =
   `hue + spread(k/12 − 1/2)`. The spread stays, the anchor's offset goes (`CHUE0` 0.0) and the spread widens to `CSPREAD` **1.6** (capped
   at `CSPMAX` 0.92 of a turn), because a third of the wheel is right for twelve small glows on a ring and wrong once those hues are the
   colour of every wave in the picture. `CSPREAD = 1` is v0.10's spacing exactly, for the user to put back.
7. **`FGAIN` 3.4 → 6.0 pays for the trough.** With the sign of Ez as brightness, half the picture is dimmed to `TROUGH` 0.35 and the
   reference frame's mean luminance fell 31 %; 6.0 puts f360 back to 0.3259 against v0.10's 0.3830 — **−15 %, with centre/rim 1.69 → 1.37,
   so the picture is flatter as well as slightly dimmer**. `TROUGH` is the one constant to raise if the user wants v0.10's contrast back.
8. **"Different music must look different" is answered by `dirty`, `sub` and `punchy`, not by the carrier.** The ≥ 20 % gate on the mean
   crest spacing per demo style is **not met and cannot be**: house / aba / dnb have mean spectral centroid 0.485 / 0.459 / 0.459, i.e.
   the same mean carrier to 4 %. What separates them is `dirty` (3.0× aba↔dnb), `sub` (10× — aba's wobble swings ε 0.89…1.49 against
   dnb's 0.83…1.06) and `punchy` (1.6×), which are exactly the three new mappings; and within a style the carrier does move (house's
   centroid ran 0.37 → 0.77 in one 20 s window, `lam` 42.3 → 19.2 cells, a factor of 2.2). The honest summary is that the styles look
   different and the thing that makes them look different is not the one the plan named. Lever with the most room: `CENTK` (2.5);
   next, `bpm` back as a second carrier term.
9. **Cost: 1.24× TORUS2 on the worker's tree, 1.01× on the merged tree, gate ≤ 1.5×.** Two-page protocol, seven NAV-interleaved pairs a
   page, cold pair dropped, median of the ratios. The worker's levers: the porthole cull took 38 % of the strokes out of the drop frame
   (MAXWELL measured **0.96×** after items 1 and 3), then the colour field plus tier-3 substeps **4 → 3** (`GRIDT[3][2]`, the session's
   one numerics change) landed at 1.24×. The orchestrator's re-run on the merged tree medians 1.230 / 1.216 = **1.01×** (early pair 1.35×,
   late 1.17×) — the NAV drift both reports warn about. Undoing the substep change costs about 0.25× of TORUS2.

**The proofs (AUDIT-v0.11, `tools/accept/v0.11/`):** worker, tier 1 CLOCK=1 — silence gives lum centre 1.2 %, segs 0, energy 0 against
the unpinned frame; one pinned sector gives worst hue error **0.0018 turns** at saturation ≥ 0.983, two sectors a tritone apart give
their exact circular midpoint between them, a key change moves the anchor 0.0090 → 0.2933 with the twelve note hues **identical to four
decimals**. Orchestrator, headed, three 90 s real tracks with a **paused start** (`audit11.sh`, `det11.py` — new): with the tab paused,
energy **0.002 / 0.021 / 0.000034** against 2885 / 1808 / 2729 playing, `segs` and `drawn` **0**, probe centre ≤ 0.003, and every black
frame PROBE counted (291 / 202 / 392) falls inside the paused window — **0 black frames in 72 s of play**, `long` 0, ERRS [], nonFinite
[], `probe().gap` 0 on all 120 samples, q .39 → .87. `check.js` 0 fail / 3 warn (maxwell `index.js` **498** lines, two under the hard
cap), `param-smoke` 49/0, `test_fdtd` OK including group 5.

**What this release does NOT prove, and says so:** (a) item 2 is proven **per note only under a pin**. On real music the chroma vector is
flat (no bin clears 0.3 in 37 of 39 samples) and the twelve hues are symmetric about the anchor, so a chroma-weighted "expected hue"
collapses onto the anchor and the agreement number is at chance at every lag; what the headed run does show is that the wave is no longer
anchor-coloured (mean |dominant hue − anchor| 0.254 / 0.252 / 0.153 turns, i.e. a whole half-span) and that a third to two-thirds of the
dominant hues land outside the arc the twelve sectors occupy. (b) The wobble is proven only at CLOCK=1: a 2 s trace cadence cannot
resolve a 1–4 Hz LFO (Nyquist 0.25 Hz). (c) **No dubstep track exists in the scratchpad** — `Malicious` (Kevin MacLeod, 140 BPM, CC-BY)
stood in, and it has no wobble bass, so the user's 3 has still never been tested on the music it was about.

**Leans for the user's eye, ranked:** (1) `TROUGH` 0.35 and the 15 % dimmer, flatter picture — the price of "the sign of Ez is
brightness", one constant to raise; (2) `CSPREAD` 1.6 against v0.10's 1 (and note 1.6 spans more than half the wheel, which is why some
mixtures land on a hue no note owns); (3) the wobble being amplitude and not wavelength — physics, not effort; a bunching ring needs a
different mechanism and a new plan; (4) the demo styles separating on `dirty`/`sub`/`punchy` rather than the carrier, with `CENTK` 2.5 the
lever; (5) `FGAIN` 6.0; (6) the dubstep stand-in — one mp3 is the cheapest improvement to the next round; (7) tier-3 substeps 4 → 3
(~0.25× of TORUS2 to undo); (8) `VACT`/`VACW` 1.0/1.0 s, how fast silence lets the rings go.

**Docs owed and paid here:** `docs/AUDIT-v0.11.md`, this section, `tools/accept/v0.11/README.md`, the thumb re-shot
(`tools/thumbs.sh "9:360"` — the f360 frame changed), `package.json` 0.11.0, `releases/retinarave-v0.11.html`; **and the six CONTRACTS
sentences** — the four owed from §42 (§1.2 readback by `IMPLEMENTATION_COLOR_READ_TYPE` + a small target read whole, §1.4 hook naming
via `CARD.REG[id].scene.hooks` + read-only hooks must not mutate, §1.10 a plane under a rotating camera needs a porthole; commit
`06de82a`) plus the two this session adds (§1.4: a test hook that pins a field must also pin the **params derived from it**, because a
param's `from()` is evaluated by the engine from `MS` — `hooks.quiet(1)` left `charge` at its musical value until it did; and a `hud`/
`info` hook's object literal is not namespaced, so a second key of the same name silently wins — `mxinfo`'s `sub:` was overwritten by
the sub's ema and a bench script read the wrong number, renamed `subS`; commit `6587f06`). **Still owed to HARNESS:** `tools/lum.py` has
no hue field (v0.10's report quotes a "saturation-weighted mean hue" from an instrument that was never committed), the scene palette
is `0.5 + 0.5 cos(TAU(h + [0, .33, .67]))`, not HSV — every hue number in these reports is in palette turns recovered by `probe.js
hueFit`, and a proof that quotes HLS degrees against a constant in palette turns is comparing nothing; and the **500-line hard cap** is
the real constraint on a scene that grows (`check.js` only says so after the edit) — a brief that adds a subsystem to a 400-line scene
should say where the line budget is going first.

**The release bundle (found at the tag, fixed here):** `tools/bundle.js`'s `declarators()` split an `export const` line on the
commas of its trailing `//` comment, so `colour.js`'s `export const CDIP = 0.05; // … with them on, every` exported a phantom `every`
and `releases/retinarave-v0.11.html` threw `ReferenceError` at load (the v0.10 release, run as the control, was fine). The parser now
stops at `//` outside a string. Proof: `FILE=$PWD/releases/retinarave-v0.11.html … 'test'` keys `9` then `n` → scene 9, forced 9,
errs `[]`, nonFinite `[]`, 43 feats (`tools/accept/v0.11/release-file-9n.jpg`). Every release from now on is proven from `file://`
before the tag, as v0.10 was — the bundler is not the served page.

## §44 MAXWELL — "every sound a wave", v0.12 (2026-09-26, orchestrator + one opus worker from `docs/workers/brief-maxwell-onset.md`, report `maxwell-onset.md`; `MAXWELL-ONSET-SESSION-PROMPT.md`, `docs/AUDIT-v0.12.md`)

**What the user asked (2026-09-26, after looking at v0.11, verbatim):** "it still seems like the waves coming out of the center are at a
constant rate -> I'm expecting every sound to generate a wave (and the wave color is based on musical note being played) sometimes the
music goes double time, doesn't seem like what is being immited from middle matches ; also why are there a pattern of small circles in
the background?" Then "1. no sound -> quiet (ie. wave not generated) 2. what are the media?" and, told what the four media were, "follow
your rec" (drop the photonic lattice, keep the lens and the mirror cavity, decide the waveguide after seeing sound-only ripples in the
cavity). Those sentences are the spec. MAXWELL is **modified in place** — id 9, still forced-only (bid 0, key `9` then `n`); the gate is
v0.10's and v0.11's: no sweep, proof on id 9 only. **The user has not looked at v0.12.**

**The diagnosis held.** The constant rate was the continuous carrier (twelve charges, the dipole and the sub's standing current
oscillating at the timbre's wavelength the whole time the music played) plus the beat-locked `FAINT` ring; the only discrete launches
were three drum bands behind a hysteresis edge that could not re-fire while hits overlapped; the pale cream was the carrier mixing all
twelve hues; the small circles were the photonic lattice's ε dots. The worker verified each claim in the code before changing it.

**The scene now (`assets/scenes/maxwell/{index,fdtd,colour,medium,sources,onsets,render,probe,help}.js`, `index.js` 497 → 465, `onsets.js`
new, 151):** nothing radiates continuously. Every launch is a Ricker shell from a place with an amplitude and **one hue** injected into
v0.11's colour field: (1) **kicks** by the `kickCount` delta per frame (a counter — any rate; N kicks in a frame = N launches), from the
centre and through the dipole, hue = `argmax(bchroma)` — the bass note — or the key's anchor below `BCHMIN`; (2) **snares and hats** by a
**re-armed edge** (fire above `HI` after falling to `REARM` 0.5 × the last peak, refractory `REFR` 70 ms), the snare from the pitch class
that rose most in `NOTEW` 150 ms, the hat on all twelve at `HATA`; (3) the engine's **`onset`** event when no band launched within
`ONSETW` 50 ms, at `ONSETA` from the loudest-rising sector; (4) a **note** onset — a chroma bin rising by `NOTEK` **0.05** (the plan's 0.08
fired 4 times in 14 s of house; the worker measured the chroma-rise distribution over 481 frames per synth) from its own sector at
`NOTEA` 0.045, per-bin refractory 200 ms. One shared 32-slot launch ring (`NSLOT`) replaces 8 per band. Timbre survives on the shell:
`TSIGK` (thickness by centroid), `DIRTK` (a second lobe for `dirty`); the sub still breathes the medium's ε (`WOBK`) — it moves the light,
it is not a source. Media: **lens · mirror cavity** in rotation (`sectionAlt mod 2`), the waveguide by `hooks.medium(3)` only, `medium(2)`
empty space, the lattice's code gone. `feats` 41: `bchroma onset kickCount` in, `beat roll riser novelty flowHigh dropEnv` out.
Hooks: `launches()` (read-only: `{n, perBand, last[≤16], medium}`; `reset()` zeroes the ring but not the counters, so a trace can
difference them); `wob`/`timbre` kept (they are the only way to prove `WOBK`/`TSIGK`/`DIRTK` — `#test` pins `centroid`, `dirty`, `sub`
flat); `mxchroma` no longer silences the centre in the colour field (the centre is no longer pitchless — under the plan's own gate the
silencing zeroed the only source).

**The proofs (AUDIT-v0.12, `tools/accept/v0.12/`):** worker, CLOCK=1 — `train('off')` with music on: energy **0** exactly, segs 0 (v0.11
396.41 / 468); one `#test` bar launches kick 4 / snare 2 / hat 8 = the fake timeline's; `train('8')`/`('4')` crest gaps **0.4999**;
`mxchroma("3")` plane hue **0.0018 turns** off the target; all five bands fire on house / aba / dnb (32–40 launches per 2 s). Orchestrator,
merged tree — s9 md5 `4ad6d2ea` / `4c2ab3c8` = the worker's; the paused start on three real tracks: **0 launches in every band 8 s into
the pause**, energy 1e-5…2e-2 vs playing medians 73…505, every black frame inside the paused window, 0 long, ERRS `[]`, q .57 → .87;
launches per 2 s 16 / 23 / 29 (Malicious / WLTP / CN) moving with the track; the plane's dominant hue within 0.08 turns of the last
kick's bass note on **79 % of Malicious samples, 45 % WLTP, 17 % CN**; `medium` never 2. Cost **0.80× TORUS2** (worker 0.92×), from
1.01× / 1.24×. `releases/retinarave-v0.12.html` proven from `file://` (keys `9` `n` → scene 9, errs `[]`, 30 launches by 9 s).

**What this release does NOT prove, and says so:** (a) the plan's ≥ 70 % per-note gate is met on Malicious only — on CyborgNinja the
bass alternates between two notes and the plane remembers a second of shells, so "distance to the newest kick's hue" is the wrong
instrument for a mixture; a launch-weighted expected hue is owed to `det12.py`. (b) "Launches within 30 % of `onsetRate`" cannot hold by
construction: the scene launches per band, the engine counts one onset per frame for the whole stack (measured 2.9–3.6×); read
`dpb`. (c) The note source, `TSIGK` and `DIRTK` are proven on the demo synths and by pin only. (d) No double-time passage was found in
the three tracks' 80 s windows; the double-time proof is `train('8')`. (e) Still no dubstep.

**Leans for the user's eye, ranked:** (1) the rate — 13–20 launches a second on house; `REARM` 0.5 → 0.35 first, then `HATA`; (2)
brightness between hits — dimmer than v0.11 by construction, `FGAIN` 6.0 is the knob, a floor is not; (3) the hat as the last
all-twelve source — weight it by chroma, one line; (4) the waveguide back into rotation (the worker's vote; the rails are the only
non-concentric composition); (5) one stray contour stroke outside the porthole at WLTP 20 s; (6) tier-3 substeps 3 → 4 with the
headroom; (7) `TSIGK`/`DIRTK` on a real dubstep track.

**Docs owed and paid here:** HARNESS's three §43 notes (the 500-line cap as a budget, `lum.py` has no hue field, cosine palettes →
hue numbers are palette turns); CONTRACTS §1.4 the release-on-`undefined` convention (every pin hook is a mutator when read — the
worker lost a run to `hooks.medium()` un-pinning its own shot; a trace reads `hud()` or a read-only hook). **Owed:** the
launch-weighted expected hue in `det12.py`; the `CDIP` comment in `colour.js` now describes v0.11's workaround.

## §45 MAXWELL — thin waves and fat waves, the breakdown rule, v0.12.1 (2026-09-26, orchestrator alone, from the user's look at SeeYouDrop)

**The user's word.** Watching the first dubstep (Ray Volpe — SEE YOU DROP, `~/Music/RetinaRave/SeeYouDrop.flac`) through MAXWELL:
"the part that was missing ripples was 50s-57s", then "the sounds didn't feel quiet tho. feel like there should be more skinnier
waves, (vs bass fatter waves)?". A per-second replay of 46–62 s (`tools/accept/v0.12/breakdown-window.py`, `montage-syd-breakdown.jpg`)
agreed: 50.5–58 s is the breakdown, `kick` 0 and the engine's `kickCount` frozen at 65 for six seconds, `bass` .04, while `snare`
peaked .35 and `hat` .57 (the drum bar HI is .45) and the mids and highs stayed loud. v0.12's rule put every non-kick launch on the
ring of charges at SNAREA .11 / HATA .025 / ONSETA .07, and only the kick launched from the centre — so the breakdown's launches
(2–6 a second, real) were dim sector pulses nobody could read, and the plane was a dim disc until the drop at 58 s.

**Two changes, both retunes on the v0.12 machinery, no new scene:**

1. **A launch carries its own width** (`sources.js` `AS[]`, `WSIG = [1, .55, .45, .5, .5]` per band, `KWB = .35`): the shell's
   Ricker sigma is the frame's `OUT.sig` times the launch's multiplier, floored at SIGLO. The kick is the fat one and gets fatter with
   the bass under it (x (1 + .35 x bass), so a drop kick at bass .95 is 1.33x v0.12's width); a snare is half a kick, a hat under
   half, an onset and a note half. `hooks.launches().last[].w` reports it; `rings()` uses it for the bookkeeping radius. `centroid`
   still scales the whole frame's sigma (TSIGK) on top.
2. **The breakdown rule** (`onsets.js` `KSIL = 1.0`, `ONSC0 = .4`; `sources.js` `ONSETC = .85`): once no kick has launched for a
   second, EVERY launch — snare, hat, the engine's onset — comes from the centre instead of its sector, thin, and drives the centre
   current at .85 of a kick's; the engine's onset takes max(.4, mid, high) as its amplitude there (the scene now reads `mid` and
   `high`). The dipole is still driven by kicks alone. The first cut moved the onset alone at .5 of a kick: two shells in six
   seconds and a dot at the centre, not a ring (`montage-syd-breakdown-v0121.jpg` is the second cut). The centre's colour
   (`OUT.khue`, colour.js uAC) now follows the last CENTRE launch — a kick's bass note, or the loud sector during a breakdown.

**Proof.** The replay after: from 53 s every launch in `last` is sector −1 (hats at w .45, amp .3–.45, three to five a second), and
the frames 52–58 s show thin concentric shells from the centre where v0.12 showed a disc; 58–61 s the drop's kick rings, wider.
`det12.py` on SeeYouDrop: launches 0–25 median 18, per band 406/15/47/139/8, engine kickCount Δ406, dkick ≤ .08 on 80 % (med .02),
dbass 78 % — the per-note gate unchanged; Malicious 73 % (med .03) / 68 %, still over the 70 % bar but down from 79 % / 82 %: with
the centre's hue following the breakdown's loud sector, dkick (measured against the last KICK's note) drifts in Malicious's quiet
bars — the number moved for a reason the rule states. `audit12.sh` paused start on SeeYouDrop: every black frame inside the pause
but six on resume, none after 20 s, `long` 0, `errs []`. `IDS=9 tools/scene-md5.sh` twice: 95fd7d73 / 4e2108a7 (re-based in
`scene-md5-v012.txt`; v0.12 was 4ad6d2ea / 4c2ab3c8). `tools/check.js` 0 fail (help lines for `mid`, `high` added), `test_fdtd`
OK. Thumb 9:360 re-shot. `releases/retinarave-v0.12.1.html` proven from file:// (9+n → scene 9, errs [], 32 launches by 9 s,
widths per band on the launches).

**Not done / open.** The drum bar HI .45 is unchanged, so a breakdown whose snares sit under it (the first replay read snare
.15–.35; the third .5–.67 — run-to-run variance in the extractor) still rings only on the engine's onsets. Whether the double-time
fill at 59–61 s (§44's open question) should double the launches is untouched: `dn` 21 then 15 against onsets 11.9. No sweep of
WSIG / KWB / ONSETC — three numbers chosen by eye on one track; the other three tracks were not re-watched, only re-measured.

## §46 NAV2 — "bump with the beat", Green's ruler, v0.13 (2026-09-26, orchestrator alone, from the user's ask on SeeYouDrop; `docs/AUDIT-v0.13.md`)

**The user's word:** *"audit the NAV2 scene with SeeYouDrop.flac; can make modifications; I want the mandelbrot set to bump with the
beat. no beat == more of a circle (some variation), as the beat happens it spirals in showing the complexity of the mandelbrot set.
The edge of the set should always be moving with the music. How can Green's theorem help?"*

**What was there:** v0.8 rested c ON the rim (`RHO_FREE` 0.91, chosen for brightness, §39) — ρ 0.88–1.00 on every interior sample
of the 80 s SeeYouDrop trace, the set always a spiky blob, a hit worth `K_HIT` 0.35 of press. Nothing measured the shape.

**Decisions:**
1. **The beat is the press, the circle is the rest.** `detect.js` `bump` (peak-hold of kick/hit, `BUMP_TAU` 0.35 s) and `pulse`
   (its 2 s ema, the beat's density); `nav2.js` `RHO_REST` 0.30 replaces `RHO_FREE`, press = wind + `BUMP_K` 1.0·bump + `PULSE_K`
   0.8·pulse, `K_R` 4 → 10, `K_HIT` gone; `CURL_B` 0.5 curls the arms on the beat. The brightness that `RHO_FREE` bought is paid by
   `uRound` (5.) instead of by resting on the rim.
2. **Gates leak, not reset** (`GATE_LEAK` 0.3, `GATE_RHO_MIN` 0.80): pulses touch the rim briefly; the held pressure now leaks between
   them. Set by a 16-point node sweep — the mildest point where a kick-per-beat timeline opens and closes a gate (1 → 3 → 1) with 0
   violations; at `GATE_RHO_MIN` 0.86 or `BUMP_TAU` 0.28 no gate opened at all. `test_nav2.js`'s melody run gained the kick.
3. **The beat reaches outside** (`exit.js` `BUMP_LG` 1.5 on the exterior target potential).
4. **Green's theorem is the ruler, not the engine** (`green.js`, `hooks.green()`, `test_green.js`): A = ½∮(x dy − y dx) on c's
   equipotential |φ_c| = 1.06 (256 points, 7 pull-backs through ±√(z − c), branch continuous in the external angle), Q = 4πA/L²,
   dA/dt = ∮ v·n ds and the mean edge speed. Q is 1 at c = 0 exactly (the 256-gon's), 0.99 → 0.70 as ρ 0.2 → 0.99 along the 1/3
   root; Gronwall's area theorem says the area deficit IS the Böttcher tail. 0.032 ms. The AUDIT's "How Green's theorem helps"
   is the user's answer. Not built: the phase-winding colour (the argument principle, same family).
5. **`uRound`** (rest 0, exact): the interior base and the exterior glow × (1 + `ROUND_G` 1.5 (1 − ρ)). Measured need: centre
   luminance fell to a median 0.06 on the window frames (v0.12 0.20); with it 0.19.

**Proof:** `det13.py` + `nav2-window.py` (`tools/accept/v0.13/`, tracks from `$MUSIC`): ρ 0.671 / 0.827 / 0.985, Q 0.700 / 0.805 /
0.947, v 0.189 median / 0.578 max and > 0 on 29/29 interior samples, one gate, ms 2.04 (2.02), errs []. The paused start (8 s): ρ
0.97 → 0.39, Q 0.71 → 0.96, v → 0.006; first kick after play ρ 0.74, v 0.31. `test_nav2` no-beat: ρ 0.300, Q ≥ 0.977, v > 0 on
100 %. s8 md5 17f888e8 / 83d37910 twice (v0.12 9021eac8 / f6299795); `check.js` 0 fail; `npm test`, `test_fdtd`, `test_field`,
`test_green`, `test_nav2` OK; `releases/retinarave-v0.13.html` proven from file:// (key 9 → scene 8, errs []).

**Open:** the six look constants by eye on one track (the four gate/press ones swept); no beatless passage on a real track (paused
start + node stand in); the drop's 20 s outside untouched; the v0.8 `&still=1` = NAV identity no longer holds (c's path differs);
NAV2 still forced-only, the swap question unchanged; the other three tracks not re-watched.

**§46 addendum — after the user's look (2026-09-26):** *"25s-1m03s set should be bumping in some way with each beat (as beat evolves
the set should come back to a slightly different shape); 1m04 it starts to get swirly/wobbly; also is a little too bright."*
`RHO_BEAT` 0.93 (the beat's ceiling; the smoulder at `RHO_CAP` was the wash-out), `PULSE_K` 0.4 (ρ ~0.6 between kicks: the outline
moves), the kick pumps `zoom` 6 %, `GATE_RHO_MIN` 0.72 (a gate is the shape coming back different — 8 per minute on a plain beat in
node), `EXT_BEATS` 8 (the drop is a two-bar excursion; 1:04 was 20 s of dust under NAV's peak rule — NAV's own rule is untouched in
NAV), the spin gains halved, `BUMP_LG` 0.5, `ROUND_G` 0.8 with the exterior at half, `arc` out of `feats`. Trace: ρ 0.49/0.66/0.93,
Q 0.64/0.88/0.95, v > 0 on 37/37, EXT 4 s, spin max 0.43 (0.79), ms 2.00. AUDIT-v0.13's second table.

**§46 addendum 2 — the extremes (2026-09-26):** *"0-13s the high rise up to their max (edge should be bumping on every beat / light
oscillating off the edge); at 25s it really starts moving the edge on every beat."* The engine's `kick` reads 0.1–0.3 in this intro,
so the bump is now read against the track's own running kick/hit peak (`BUMP_PK_TAU` 3 s, floor 0.25) times energy (`BUMP_E0` 0.5 →
1 at `eS` 1); `uBump` (rest 0) widens the exterior halo's reach 1 + 1.5·bump — the light off the edge. Intro bump median 0.47 (0.31),
ρ 0.64–0.84 on every sample; the gate at 25 s into period 2 is the shape coming back different. AUDIT-v0.13's third section.

**§46 addendum 3 (2026-09-27):** *"each beat should make the set close up (different pitches are different shapes); at 1:38 it goes
double time -> should be moving faster / reacting more; 1:45 -> highest energy, should be reacting more."* The beat's NOTE: the bass
note's pitch class latched on each hit names an internal angle (k + ½)/12 and c is pulled around the rim to it (`NOTE_V` 8 × bump;
`bchroma` in `feats`) — twelve pitches, twelve species; the bump's decay follows the running hit interval (`BUMP_IV` 0.7, so double
time breathes at τ 0.14 s instead of pinning ρ high — the before trace read ρ 0.87–0.93 flat there); the energy gain E lifts the
ceiling (`RHO_E`), the halo, the curl and the kick zoom. Edge speed median 2.4× on the double-time stretch (0.333 vs 0.138), seven
notes latched in 30 s, the Q median 0.93 → 0.90. `BUMP_IV` 0.55 → 0.7 by the node sweep (the 124 bpm test beat opened no gate at
0.55). AUDIT-v0.13's fourth section.


**§46 addendum 4 (2026-09-27, no new word from the user — the open list's item 4):** the other three tracks re-measured and re-watched
under v0.13 (`det13-{cn,wltp,mal}-v013.txt`, the 0–60 s montages). CyborgNinja and WhoLikesToParty bump as asked (the first on a
one-note bassline, so notes 0 / 1 only and a fat near-cusp set; the second latches ten pitch classes at 117 bpm). **Malicious found the
fault:** its stuttering bass intro fires the engine's bass-returns `dropEvt` three times in 14 s (`dropStrength` 1.0 each) and NAV2 cut
every time — 18 of its first 25 s were the exterior dust, the 1:04 complaint on another track (`EXT_BEATS` made the drop a two-bar
excursion; a re-drop undid it). **Decision: `DROP_GAP` 32 beats (`exit.js`)** — a `dropEvt` inside eight bars of NAV2's last cut is a
hit, not a cut (`doDrop` returns; the beat's press answers the kick; `N.dropBeat` is the only new state). No drop recurs inside eight
bars; SeeYouDrop's two (58 s, 1:45; 47 s apart) both stand, so pass 4's look is untouched: s8 md5 253b19c4 / 778fb7e2 twice, every node
test OK, the release re-proven from file://. Malicious after: two excursions in 40 s instead of three in 14 s. Also measured, not
changed: **1:45 on SeeYouDrop is a full-strength drop** (`ds` 1.0, arc build → peak; det13's D line now carries `ds` and `arc`) — NAV2
answers the user's "highest energy" with the cut and ~6 s outside, and the interior after it reads eS 0.78 against 0.87–0.94 at 1:33–1:39;
the two ways to make 1:45 "react more" inside (no cut above some `away`, or E read against the track's own energy peak) wait for the
user's look. `tab13.py` tabulates a trace. AUDIT-v0.13's fifth section.

**§46 addendum 5 (2026-09-27, the user's look at pass 4):** *"the movement is still too subtle -> all the shapes ... the beat causes
the set (ie. black circle in the middle) [to collapse] into interesting shapes, then the silence rebounds to the circle (original NAV does
this ~38s-42s) ... [two frames] too bright and can't see the complexity ... do 'energy gain read against the track's own peak' ... why do
different sounds look so similar?"* NAV at 38–42 s is the basilica's pinch: c at the 1/2 root with |λ| → 1. **Decisions:** the twelve
notes are the twelve simplest roots (`NOTE_ANG`; pass 4's (k + ½)/12 sat *between* the roots by construction, so every note was a
dimpled circle — that is why the sounds looked alike); the beat presses to the cap (`RHO_BEAT` 0.985) with the smoulder handed to the
wind alone (`PAR_WIND`), so the interior no longer lights on the press; the press holds its peak (`BUMP_HOLD` 0.3 of the interval —
the node sweep showed `K_R` was not the lever, `V_MAX` and the decay were: 0.89 without the hold, 0.98 with it); gates lock while a
note drives (`NOTE_LOCK`), because a bulb never rounds again and the rebound is to the circle; E is read against the track's own
energy peak (`E_PK_TAU` 20 s); and the brightness, measured, is the palette's green phase plus the saturated exterior halo — two
NAV2-only uniforms, exact at rest: `uLum` (a luminance knee, (0.12, 6) interior / (0.35, 2) exterior) and `uExtG` (`EXT_DIM` 0.5 on the
exterior while c is outside, eased 0.5 s, applied after the knee), with `EXT_ENV` 1.2 landing the drop nearer the set. Q median 0.90 →
0.84 over 80 s, the green frames' centre 0.36 → 0.10–0.22, the dust after the 58 s drop 0.75 → 0.30. s8 md5 f5d4f051 / 0671f15a twice.
`test_nav2` §8 (the collapse and the rebound) added. AUDIT-v0.13's sixth section. The user has not seen it.

**§46 addendum 6 (2026-09-27, the user's look at pass 6):** *"still not deforming enough"; "a bit too muted now (looks almost pastel
sometimes). I like the bright / glowy look, but I don't want it to be so bright that can't see the mandelbrot shapes."* **Decisions:**
the interior gets its own speed cap `V_INT` 2.4 with an acceleration slew `A_MAX` 30 (the continuity monitor's rule is a spike rule, so
speed is free and acceleration is what is bounded; the first step from rest is 0.052 at the 1/24 s cap), `BUMP_IV` 0.5 and `K_R` 20 —
the node sweep showed the trough between kicks (0.84) was the *target's* slow fall, not the speed: peak 0.985 / trough 0.667 at 150 bpm,
the Q swing through a beat doubled. The pastel, measured with `sat13.py`, was not saturation (unchanged) but the halo's peaks (p95
luminance 0.72 → 0.53): the exterior knee is off, the interior knee milder (0.2, 3), and the dust's dim alone carries the post-drop
frames (`EXT_DIM` 0.35). p95 0.81, the green frames' centre 0.26–0.42 against a rim of 0.53–0.71, the dust 0.30. s8 md5 c0373ec5 /
d61162a7 twice. AUDIT-v0.13's seventh section. The user has not seen it; `nav2.js` 470 lines — the next machinery change extracts `beat.js`.

**§46 addendum 7 (2026-09-27, the user's look at pass 7):** *"getting closer but still not deforming enough with the music (this is an
extreme example and pretty much should be deforming on every beat)."* **Decisions:** `beat.js` (the press, the note, the cap, the slew;
a pure move out of nav2.js, md5 identical); a per-frame beat trace (`nav2-window.py DT= SHOT=0 MIN=1`, `perbeat13.py`) because a montage
cannot see a 0.12 s pinch; **every tick of the engine's beat grid is a full press while kicks are recent** (`GRID_K` 1.0, `GRID_T` 2 s,
`GRID_ARM` 0.5 — the kick's own press was 0.34–0.76 on a third of the beats); the trough is the target's fall, not the speed (`BUMP_IV`
0.3, `PULSE_K` 0.3, the slew as the monitor's own growth rule `STEP_G` 2.4 / `STEP_0` 0.008 on the realised step, `V_INT` 3.5); **the
wind's weight squared** (`WIND_P` 2) because the engine's 0.3 wind-up through the groove floored the trough at 0.6 on the track where the
windless sweep said 0.52; the hold 0.4 so the climb from the low trough finishes on every beat. Per frame on 27–33 s: press 0.90–0.92 on
every beat, trough 0.68 → 0.55, a fifth of each beat near the circle, the Q swing ≥ 0.12 on two beats in three. s8 md5 2daaa2c0 /
f2342b7f twice. AUDIT-v0.13's eighth section. The user has not seen it; the swing is now bounded by the beat's own length.

**§46 closed (2026-09-27):** the user on pass 8: *"nav2 looks good, can tag and deploy it. (leave it at slot9)"*. v0.13 tagged and pushed
to `main` (retinarave.com). NAV2 stays id 8 / key `9`, forced-only, `score()` 0 — the §39 swap question (NAV2 → id 0 / home) is answered:
no swap; NAV (id 0) stays home and byte-identical.

**§46 addendum 8 (2026-09-27, the same day, after the tag):** the user: *"I wouldn't say nav2 validated. (I'm just taking a break tuning
it)"*. The word "validated" in the §46 closing line, in the v0.13 commit message and in the first NEXT-SESSION-PROMPT after the tag is
**wrong**: v0.13 is tagged and deployed, NAV2 is **paused mid-tune, not validated**. NAV2's mechanics (the `beat.js` press, the roots,
`K_R`, `V_INT`, the running-peak bump) are therefore not a proven model and are not copied into GIELIS (§47); only the user's music
descriptions from the NAV2 sessions carry over. Do not touch NAV2 (id 8, key `9`) until the user resumes it.

## §47 GIELIS — the superformula nest, v0.14 (2026-09-27, orchestrator + one opus worker from `docs/workers/brief-gielis.md`, report `gielis.md`; `GIELIS-SESSION-PROMPT.md`, `docs/AUDIT-v0.14.md`)

**The user's ask (verbatim, the same day as the v0.13 tag):** *"goal new scene (slot 11); use 'see you drop' as the inspiration for
the scene … how can we use the superformula to visualize music?"* — which lifts the standing "no new scenes until asked" rule
(memory `feedback_no_new_scenes.md`) **for GIELIS only**. And, on the model: *"torus2 is my favorite visually for how music lines up
to the viz"*. And, on NAV2: *"I wouldn't say nav2 validated. (I'm just taking a break tuning it)"* (§46 addendum 8).

**The interview — the five answers, verbatim from `GIELIS-SESSION-PROMPT.md`, everything else a lean:** *(1) renderer = **3D
supershape nest as strokes**, TORUS2's lineage · (2) species = **interval-to-key ratios** · (3) **section morph on the lobe lean is
in** · (4) **id 10, reached by `n` / `&scene=10`, no digit key, forced-only until approved; the folder and card are `GIELIS`** ·
(5) acceptance windows on SeeYouDrop = intro 0–13 s, groove 25–63 s, breakdown 49–58 s, double time 1:38, drop 1:45, per-beat
rulers on the n1 swing and the wave spacing.*

**Why TORUS2's model and not NAV2's.** The user named TORUS2 as the mapping that works, so GIELIS speaks its language: twelve
pitch classes as twelve visible things, hits launching events that travel at a musical speed, a thump on the beat, a nudge per
beat, key on the circle of fifths with major warm / minor cool, section picks the morph target, drop = collapse and rebound,
everything on the musical clock, `cuts: 'continuous'`, **no running-peak normalisation**. NAV2's mechanics are explicitly **not** a
model: v0.13 is tagged and deployed but **paused mid-tune, not validated** (§46 addendum 8), so `beat.js`'s press, the roots,
`K_R`, `V_INT` and the running-peak bump are not copied — only the user's *music sentences* from the NAV2 sessions carry over
(the collapse-and-rebound, "different pitches are different shapes", "deforming on every beat", bright but legible). NAV2 (id 8,
key `9`) was not touched. What GIELIS does borrow from §46 is the **measuring lesson**: Green's Q is the ruler, and a montage
cannot judge a per-beat pinch — measure per frame.

**The design, one paragraph per spec item (every constant a named lean at the top of its module).**

1. **The nest.** Family k (pitch class) is one nested supershape drawn as `RINGS` 7 latitude rings of strokes over ±`PHI_MAX` 0.85
   of latitude, path B through `ctx.lines`, the vertex shader building every point from `gl_VertexID`. Size and brightness follow
   `chroma[k]` (`SIZE0` 0.25 + `SIZEK` 0.75·chroma, the loudest outermost and brightest) with the circle-of-fifths `harmAngle`
   fallback blended continuously so `#test` and silence still have a nest; a brightness floor `FLOOR` 0.18 of the loudest and a
   capped fog. `kick` flashes the families below the median brightness (`FLASHT` 0.25 s max-hold decay); `hat` shimmers along every
   ring (`SHIM` 0.55); `sub` fattens `a, b` (`SUBK` 0.15) and the bar breathes them ±`BREATH_B` 3 % even in silence; below
   `PRES0` 0.05 presence nothing is drawn.
2. **The species.** Family k's lobe count is the just-intonation ratio of its interval above the key: `m = M0 · p/q` with `M0` 4,
   so the root is a rounded square (m 4), the major third five lobes, the fifth six, the tritone 28 over five turns, the minor
   seventh 36 over five. `QCAP` 5 caps the turns a ring may need, which snapped exactly one entry — the minor second, 16/15 →
   17/4 (0.4 %), because 16/15 needs fifteen turns to close. Twelve distinct lobe counts, so twelve distinct shapes;
   `keyConf` gates the key exactly as `keycolour.js` gates the hue, the fallback key is the nearest fifth of `harmAngle`, and a key
   change **cross-fades the two radii** over `MTC` 0.7 s ×3 — a rational m never interpolates. The table lives in
   `math/gielis.js`, so the fallback `m = k + 3` is one line.
3. **The breath.** `n1` rests at `N1_REST` 12 (a circle, Q ≥ 0.987 on every family) and every beat presses toward `N1_BEAT` 1.2
   with TORUS2's thump `press = max(0, cos 2π·beatPhase)^4`, read off the engine's beat **grid** — never the kick detector, which
   reads 0.09–0.44 in this track's intro. The depth is the `breath` parameter (0.5 + 0.5·eS), so 25 s presses harder than 0–13 s
   and the double-time stretch hardest; a `kick` inside the beat adds `HIT_K` 0.3 on top. `build`/`tension` go to the lean, never
   to n1 — the wind must not floor the breath (the NAV2 pass-8 trap). Green's Q of the loudest family's equatorial profile
   (512 samples, `N_Q`) is the ruler and `hooks.green()` exposes it.
4. **The waves.** `torus2/waves.js`'s launch ring buffer was lifted to `assets/math/waves.js` as **`mkWaves()`**, per caller (a
   module-level buffer would have made TORUS2's eight slots and GIELIS's the same slots); TORUS2's pixels did not move (s3
   `7189a6ba` / `48113eda` before and after, twice). Rising edges in kick / snare / hat launch a bump running round every ring at
   one ring per bar, `WAVEW` [0.05, 0.017, 0.008] wide, `WAVED` [`WAVE0` 0.26, 0.008, 0.01] deep with `WAVEP` brightening, both
   displacement and pulse, 2-beat decay and 8-beat life; the wave rides the ring parameter, so on a q-turn family one wave runs the
   whole closed curve in a bar. Each slot carries its launching family's hue in GIELIS's own `WHUE` column — the note's colour, as
   MAXWELL was validated to do. Silence is quiet: `presence`/`hush` gate the floor, no carrier.
5. **Motion.** `mkNudge()` yaws the nest 1/16 turn per beat (`hush`/`calm` slow the spring); `BOUNCE` 0.05 is the beat's second
   thump on the camera distance; `build` 0→0.5 raises the drawn family count `FIBMIN` 6 → `FIBMAX` 12 with `FIBTC` 0.25 easing so a
   family fades in instead of popping, 0.5→1 brings the camera in; `intensity`/`arousal` set the resting size, `FILL0` 0.6 and
   `FILLMAX` 0.85 so nothing crops in portrait; `flowBass/Mid/High` advance the low / mid / high families' ring phase (`PSIK` 0.25);
   camera elevation `CAM_EL` 0.55 rad, distance 3.2·size.
6. **Section and drop.** `sectionAlt mod 4` picks a lean template — `round` (1,1,1,1) · `petal` (1,4,1,1) · `blade` (4,1,1,1.3) ·
   `shard` (0.6,0.6,1,1) — cross-faded over `MORPHTC` 1 s by `morph = MORPHK 0.9 · tension · (arc idle ? 0 : 1)`; `dropEvt`
   collapses every n1 to the pinch and the nest to `DROP_SZ` 0.4 for about a beat and rebounds with `DROP_G` 1.6 on `dropEnv`;
   `surpriseEvt` twists the camera by at most `TWIST` 0.4 rad (`TWISTTC` 0.35); `riser`/`roll` drift the rings in latitude so the
   closed rings open into helices (`UNWIND` 0.35) and snap back on the drop. There is no cut, so there is no refractory to tune.
7. **Colour.** `mkAnchor()` from `math/keycolour.js` — key on the fifths, major warm / minor cool by pull, `keyConf` gate, `HUETC`
   ease — with the twelve families spread around the anchor and `valence` warmth on top. A soft luminance knee in the fragment
   shader (`KNEE` 0.8, `KNEE_S` 3) keeps the glow peaks and stops the stroke's core washing the lobes out ("I like the bright /
   glowy look, but I don't want it to be so bright that can't see the … shapes"). `colour: { default: 'v2', variants: { v2: {} } }`
   — **the `oklch` variant is not built**, per `feedback_colour_default.md`; it stays a later opt-in.

**Six parameters (§1.16):** `breath` · `wave` · `turn` · `size` · `lean` · `glow`. `paramsOf === derived` with a difference of
exactly 0; five `from()`s are the inline expressions moved byte-identically (proven with `&param=gielis.wave=c:0.26` reproducing
the pre-move pair `d7806c9b` / `a0097ad3`), and `wave` = `WAVE0 + 0.1·kick` is declared as the one behavioural change of the move.
`feats` is 38 fields, all read, `help.feats` 38 with 0 gaps; `clarity` and `regularity` were dropped because `score(MS) { return 0; }`
reads nothing.

**The four leans the worker changed, every one for a measured reason** (`docs/workers/gielis.md` (a) items 1–4):
(i) the brief's resting lean (2, 2, 1, 1) is **exactly a circle for every m and every n1** — `|cos|² + |sin|² = 1`, Pythagoras — so
the breath would have been a no-op at rest; `BASE` is (1, 1, 1, 1), still a circle as n1 → ∞ and the pinch acts. (ii) `N1_BEAT`
1.5 → **1.2**: at 1.5 the root family swings only 0.106 of Q through a beat, under the brief's own 0.15 gate, while the starry
families swing 0.15–0.32; 1.2 puts all twelve over it (0.158–0.414). (iii) **the press travels along `1/n1`, not `n1`** — the
single most important change: `1/n1` is the superformula's exponent and the shape is a circle for every n1 above ~4, so the
brief's linear ramp dipped n1 to 7.8–8.4 on every beat for a Q move of 0.9916 → 0.9791, invisible;
`pinchOf(d) = 1/(1/N1_REST + (1/N1_BEAT − 1/N1_REST)·d)` makes a half press n1 2.56 and Q 0.92. (iv) `depth = breath`, not
`(0.5 + 0.5·eS)·breath` — the `breath` parameter's own `from()` IS `0.5 + 0.5·eS`, so the brief's product squared `eS`.
Two arithmetic corrections stand with them: the fifth's six lobes close in **one** turn, not two (the q-turn rule uses the
denominator of the reduced m), and the rule holds only under a symmetric lean (a lopsided one needs 2q turns when the numerator is
odd), so the scene draws the symmetric count and skips the wrapping segment (`uOpen`) when the lean or the unwind has opened the ring.

**The continuity monitor, and what it took to make it mean anything.** `viol []` on `#test` 40 s (n 2407, max 0.0583) and on 60 s
of the house synth (n 3606, max 0.0533) — but only after three findings. **`state.pathCut` is a constant 9, not the brief's 0**:
`tools/monitor.js` reads `legal = N.pathCut <= 2`, so a constant 0 declares every frame a legal cut and `viol []` is true by
construction. **The witness cannot be the loudest family's rim** — the loudest family changes by a *swap*, a discontinuity in the
witness and not on screen; the first 60 s run read 16 violations, every one a reorder, so the witness (`nest.js witnessR()`) is now
the chroma-weighted mean family radius times the mean radius of the shared latitude profile at the pinch and lean in force: it sees
the breath, the lean, the growth, the drop and the sub, and never the species. (The brief's other idea, the nest's centroid on
screen, is exactly 0 for a centred nest.) **Three event-driven quantities stepped** — the drop stepped the witness by 0.063–0.072
per frame, over the 0.06 spike rule and a genuine jump — so the drop's collapse, the surprise's twist and the section's ring phase
all attack/ease (`ATK` 0.12 s, `PHITC` 0.35 s, the short way round the turn); at 150 bpm a 0.12 s attack is under a third of a
beat and still reads as a slam.

**Proof.** ids 0–9: **all twenty md5 lines identical** to the v0.12/v0.13 references, measured on the v0.13 tag, after the
`waves.js` lift and after the registration (`tools/accept/v0.14/scene-md5-v014.txt`); the skeleton's own s10 pair was `496ce9a8`
twice (a black frame). **s10 = `2c1b21c8` / `2e978a09`** twice; **`&still=1` = `89664dad` / `fe2809bc`** (`gielis-still-md5.txt`),
set at step 2 and byte-identical through steps 3–8 — the no-op gate for every future GIELIS change. mixs 0→3 f178 `641f6633`
before and after; parity fake every field identical to 1e-9. `check.js` 0 fail / 4 warn (three pre-existing line caps + the missing
thumb), `test_gielis` OK, `test_torus2` OK, `param-smoke` 49/0, the monitor `viol []`. **Cost 0.50× TORUS2** at tier 3 with all
twelve families drawn (0.658 ms against 1.327 ms, cap 1.5×; 7 140 segments at tier 3, `SEGT` [16, 26, 38, 52] per turn capped at
`SEGMAX` 96 per ring) and the CPU path 0.052 ms against the 0.5 ms gate — the 512-sample Green trace is essentially all of it.
**Q trace** (`none`, house + aba, `ACC=v0.14`, three runs each, GIELIS not forced): GIELIS never appears in any run's scene sequence (bid 0), no FEIGEN visit; house q mean 0.73 / min 0.35, windows 0–40 · 40–70 · 70–100 · 100– = 0.56 · 0.71 · 0.83 · 0.93; aba 0.83 / 0.35, 0.56 · 0.71 · 0.83 · 0.98 — within 0.04 of the only earlier `none` trace (v0.2's: house 0.76, 0.60 · 0.74 · 0.86 · 0.96; aba 0.85, 0.59 · 0.73 · 0.85 · 0.99); the min 0.35 vs 0.48 is the load-time dip (`tools/accept/v0.14/q-{house,aba}-none.txt`, `node tools/q-stats.js`).

**What SeeYouDrop measured, blunt** (`docs/AUDIT-v0.14.md` §3; eleven runs, `KEY=9,n,n SCENE=10`, `au capture`, `errs []`,
`scene 10` on every one):
- **The brief's swing ruler is NOT met.** Per frame, the Q swing clears 0.15 on 8 % (27–32 s), 62 % (33–38 s), 0 % (the breakdown)
  and 58 % (97–102 s) of the beats against a gate of 90 %; the swing medians are 0.130 / 0.155 / 0.095 / 0.157. Two five-second
  traces on the same groove disagree by a factor of eight, so the number is not settled: 250 samples is the argv's ceiling.
- **The rest between beats IS met on every beat** (49 of 49 beats back to Q ≥ 0.9; median rest Q 0.994–0.997). The rebound to the
  circle is exactly right.
- **The depth is bounded by the shape, not the press:** n1 reaches 1.24–1.33 against `N1_BEAT` 1.2 on the groove, so the pinch is
  full on every beat and the Q swing is still 0.13–0.16. More press buys nothing.
- **The breakdown is shallower with `kick` 0, as designed** (n1 trough 1.56), and the hats carry the ripples the user missed there
  (waves median 11, `hat` to 0.68) — §45's thin-waves rule, on the grid press alone.
- **The brief's brightness band is NOT met, in the other direction.** p95 luminance 0.20–0.45 on the groove, 0.14–0.38 in the
  breakdown, 0.19–0.35 in the 1:45 window, against 0.6–0.8; `lum.py` centre 0.15–0.31 with a rim of 0.009–0.07. The nest is **dark
  and small** — it fills about 40 % of the frame height on black — not washed out. Saturation is fine (0.51–0.74 on bright pixels).
  The only frames in the band are the 58 s drop (0.49–0.72).
- **The 58 s drop reads** (`ds` 1, `dropEnv` 0.55 → n1 1.32 / Q 0.890, waves 15 → 17; a yellow burst on `break-07…09`). **The 1:45
  drop did not fire in this run at all** — `dropStrength` and `dropEnv` are 0 on all eight samples of 105.4–113.1 s. That is the
  engine's bass-returns rule, run to run (AUDIT-v0.13 saw the same twice), so GIELIS's answer to the user's biggest moment is
  **untested**. Separately, the engine fired a full-strength `dropEvt` at 9–10 s in the intro, where the track was documented as
  having only two drops 47 s apart.
- **The species walk is real:** the loudest pitch class walks eight values across the groove and m walks 4 → 4.8 → 6 → 5.33 → 7.5
  → 6.4 → 5.6 → 5 with it. "Different pitches are different shapes" is built in, by construction.
- **The hue sweeps more than a full turn across the groove** (0.278 → 1.631) while the engine's key is stable at 8 minor for 37 of
  40 samples — so it is the anchor's ease and the mood terms, not a wandering key. The engine's key *is* wrong at the start of
  three of five windows (6 major, 1, 4 on a G♯ minor track); that is the extractor.
- **Also shown, not tuned:** CyborgNinja and WhoLikesToParty 0–30 s. CyborgNinja's one-note bassline gives four of twelve species
  in 30 s (NAV2 found the same bassline); WhoLikesToParty is the best-behaved — one stable key, eight loudest pitch classes, all
  four templates, the deepest pinch of the session (Q 0.658).

**The open retune list, ranked, for the user's look** (AUDIT-v0.14 §5): (1) **size** — the nest fills ~40 % of the frame
(`FILL0` / `FILLMAX` / `CAM_D`); (2) **brightness** — p95 0.2–0.45 against 0.6–0.8 (`FLOOR` 0.18, `GLOWQ` 0.4, `KNEE` 0.8 /
`KNEE_S` 3); (3) **the breath's visible depth** — the lean at the pinch (`n2`/`n3`, and the templates: `round` is now
`(1,1,1,1)` = `BASE`, so a `round` section shows **no** lean and only three of four templates do anything) and `N1_BEAT` (1.5 with
the reciprocal law is the worker's own next try); (4) **the hoops → a shell** — `RINGS` 7 / `PHI_MAX` 0.85 read as a lantern, and
`SEGT`/`SEGMAX` have roughly **3×** headroom because §14's 0.4 µs/segment is path A while path B measures 0.067–0.092 µs/segment
here (a five-turn family gets 19 segments per turn today and its lobes read as a polygon); (5) **the hue's ease** (`HUETC`, the
same anchor TORUS2 uses — a scene-side slower ease is the lever, not a change in `math/keycolour.js`); (6) **`M0` 4 and the ratio
table** against the fallback `m = k + 3`, if the starry families read as noise rather than as species. Lower: `WAVE0` 0.26 /
`WAVEW` on twelve shells instead of TORUS2's 144 rings, and `ATK` 0.12 s — for which the honest answer to "the drop should hit
harder" is a declared cut (`cuts: 'event'`, `pathCut` → 0 on `dropEvt`), a contract change, not a lean.

**Standing items.** The **digit-key question is the user's**, raised once when they approve: a tenth digit key, or GIELIS taking a
slot; until then id 10 is forced-only, `score()` 0, reached by `n` or `&scene=10`. **`site/thumbs/gielis.jpg`** is missing (one
`tools/thumbs.sh "10:<frame>"` run when the look is approved) — `check.js`'s fourth warn. The **mixs 0→3 f178 mismatch** is
pre-existing on this machine (`641f6633` measured, `f0c9d637` recorded in `tools/accept.sh`, also on a leftover shot of
2026-09-25): not moved by v0.14, to be re-based or explained before the next release. The **`oklch` variant** stays a later opt-in.
The **Cloudflare dashboard steps** are still open from v0.6. **The user has not looked at GIELIS yet**; nothing is tagged or pushed.

**§47 addendum 1 (2026-09-27, the user's first look: *"shouldn't the superformula be making more shapes?"* → *"yes retune"*):** the
diagnosis in the constants, not the formula — `N1_REST` 12 is a circle for every m, so the twelve species existed only in the thump's fifth
of a beat; the base lean (1,1,1,1) is round and the `round` template equalled it; the latitude curve had one fixed lobe count, so the body
was a ball of hoops. **Pass 1 (the worker, three commits 58353ac / 2c27578 / 8b1b03f, merged):** lobes at rest — `N1_REST` 2.0 (the
brief's lean 3 overridden by its own gate: the root reads Q 0.936, the tritone 0.776; twelve species 0.94 → 0.78 where the build had twelve
circles 0.998 → 0.991), `N1_BEAT` 0.6, a radius normalisation `normOf()` (`NRM` 64) because the deep pinch grew a family 9.8× its radius;
the per-family lean — `n2 = 1 − 0.7·chroma` (**the brief's `1 + 1.5·chroma` had the wrong sign**: (2, 2) is exactly a circle, so the loudest
family became the roundest thing on screen and item 1's gain was spent — measured, rest Q 0.936 → 0.976), `n3 = 1 + (0.5 − valence)·2`,
the template an offset on it, `round` → `bloom` (2, 0.5, 1, 1), `uLean[12]`; the latitude curve takes the family's own m at `N1_PHI` 4 and
six meridians per family (`MERID` 6, `SEGMAX` 112; segments per tier 5 296 / 8 102 / 10 086 / 11 780, bench 0.44× TORUS2, `timeUpdate`
0.15 ms); the sub fattens the radius, not `a, b`. Monitor `viol []` max 0.0557; s10 4f6c8cb0 / 1dc4cb4c, still fd8e256b / 88f6d5cb (re-based
twice by design, item 2 byte-identical). **On the track** (`gielis-window-gi-syd-{groove,intro,break}-p1.txt`, `groove-trace-p1` at 33 s):
per-beat Q swing median 0.130/0.155 → **0.375, 13/13 beats ≥ 0.15** (the build: 1/13 and 8/13), rest Q 0.994 → 0.836 (no longer a circle,
by design), n1 trough 0.62. The orchestrator's look at `montage-gi-syd-{groove,intro}-p1.jpg`: the meridians turn the lantern into a
wireframe globe whose silhouette is now squared, pentagonal or starred frame to frame, and the pinched frames read as shapes rather than
flinches; the globe look now dominates the way the hoops did; still ~40 % of the frame and p95 luminance 0.20–0.44 — size and brightness
were not in this pass and are next. The user has not seen pass 1.

**§47 addendum 2 (2026-09-27, tagged and pushed on the user's word):** *"is the gielis scene tagged and pushed? if not can do that now"*
(and the user's note on `NEXT-SESSION-PROMPT.md`: "ok to tag and push before starting new work"). **v0.14 = pass 1 as merged**:
`releases/retinarave-v0.14.html`, package.json 0.14.0, `site/thumbs/gielis.jpg` from the build (`thumbs.sh 10:360`), tag `v0.14`, push →
retinarave.com. No sweep (memory `feedback_sweep_cost`; the full sweep also waits for the user's word under the v0.15 prompt): `check.js`
0 fail, `npm test` + `test_gielis` OK, `npm run build` bundles. GIELIS stays id 10, forced-only (`score` 0, `n` / `&scene=10`, no digit
key). **Tagged is not validated** (the NAV2 lesson, §46 addendum 8): the user has not said the look is right; size and brightness remain
the first retune items when they look.


## §48 v0.15 — the engine's ears, the file source, the track map, CHLADNI (2026-09-27, orchestrator + opus workers FILE, EARS (two passes), CHLADNI; briefs `docs/workers/brief-{file,ears,ears2,chladni}.md`, reports `file.md`, `ears.md`, `chladni.md`; `ENGINE-CHLADNI-SESSION-PROMPT.md`, `docs/AUDIT-v0.15.md`)

**The ask** (the user, verbatim): "what needs to be added to the engine to extract the highest quality possible elements from
music to make the most intuitive and legible visualization that make it looked synced with the music? … additionally create a
net new scene (slot 12) to highlight engine updates ; tune for SEE YOU DROP specifically; wait for my say before running full
sweep; think". **No `tools/accept.sh` this session** — the cheap proofs after every engine step (check, node tests, parity fake,
one full md5 list, mixs).

**What was built (additive: no existing MS value, no existing pixel moved — parity fake 0, ids 0–10 md5 = v0.14, mixs 641f6633):**
1. **File source + deterministic real-track runs (FILE):** `&track=<name>&at=<s>` (served by `tools/serve.js` `/music/` from
   `$MUSIC`, local only; a pick / drop control on the landing card, local decode). Under `CLOCK=1` nothing plays; the playhead is
   frame-exact, `AU.fast` / `AU.slow` are PCM-backed AnalyserNode shims (`engine/shim.js`), the synapse tap gets exact 512 blocks
   on the main thread — two runs are byte-identical. `DET_LEAD` 0.0427 s (the measured `outputLatency` + a quantum) models the
   analysers running ahead of the listener. A seeded `Math.random` in det mode only (`features-slow.js:125` is reachable on real
   music). `tools/filetrace.js` → the trace JSON `compare.py` reads.
2. **Heard time (FILE):** `MS.heardT` / `fileOn` (stage `clock`), the PCM bus (`engine/pcm.js`, a stereo worklet stamped with
   `currentFrame`, lazy), `ENGINE.log`. Deviation: real-time `heardT` does not subtract `outputLatency` again (`contextTime`
   already lags by it, measured). Capture-mode lag not measured this session (`&sync=` exists).
3. **The ears (EARS):** `engine/ears/` pure DSP, the stage `ears` (`features-ears.js`, orchestrator) — sub pitch / slides /
   purity / gate, tonic with the sub (C# minor on SeeYouDrop; the old `key` said G#), register, clean kicks (a beater click
   within 25 ms), snare / hat, densities, felt pulse, low-pass, width; events released at heard time with ages.
   `subCents` = from the nearest note (the field list), not from the tonic (the spec's prose) — the interval is computable.
4. **The track map (EARS + orchestrator):** `engine/map/` — beats (Ellis DP), bars, sections (Foote, labels, returns), drops by
   the whole track (the low end entering after ≥ 1 bar of absence + a kick-density gate over 8 bars — a limited master defeats
   every energy-only gate), `eG`. Built **on the main thread inside the file source's gates** (1.6 s for SeeYouDrop), not in a
   Worker as the spec leaned: a Blob worker cannot resolve the module imports and the bundle has no module URLs; the playhead
   waits for it anyway, so the only cost is a one-time pause before playback.
5. **CHLADNI** (id 11, forced-only): see the addenda.

**Measured (AUDIT-v0.15 §1):** kick F 0.25 → 0.79 on the groove, drops exact on every run, tonic right, slides 32/41 — and the
misses stated: kick F < 0.9 and 13 % on bare 808s (the causal front end), sub ±30 cents 73 %, boundaries 7/11 (4 annotated
times are off the bar grid), returns 4/5. Pass 2 (EARS) takes the file-mode onsets and sub from the non-causal map.

**Addendum 1 — EARS pass 2 (merged `f42bf93`).** File mode takes kicks / snares / hats and the sub from the non-causal map
(STFT + HPSS, a centred YIN, the map analysed at 44.1 kHz whatever the context rate); events are released on the frame
*nearest* the onset (ages ≥ −1/120 s on that frame, stated in `EARS_FEATS`). `SeeYouDrop.sections.json` v2 is bar-pinned
(drop 2 = 105.596, the walk arrivals, `not_drops`; old numbers kept as `was`). Result (AUDIT §2): kick F 1.000, 0 % on bare
808s, first-frame lag +2 ms, sub 100 %, returns 5/5, boundaries 9/10 — with the caveat that file mode now reproduces the truth
tool's own analysis, so the causal live path's §1 numbers remain the independent engine measurement. `buildMap` 2.9 s.

**Addendum 2 — CHLADNI (merged `1d155a5`, id 11, forced-only).** `math/chladni.js` (the square-plate figure, a 12-entry table
by Tenney height of the interval to `tonic`: the walk C#–A–F#–E = (1,2) (2,5) (2,3) (1,5); an asymptotic-Bessel circular
plate while the bass is away from the tonic), GPU sand ping-pong, leaps analytic in `kickAge`, gate / register / void /
anticipation / low-pass / colour on one channel each. Deviations from the brief: `subGlide` unread (measured useless on this
track), the plate boundary keyed to "bass away from the tonic" not `mapSection`, `state.pathCut` 3, a preset `&ears=1&figure=i`
instead of `&fix=`. 8 of 9 windows met or on timing (AUDIT §3); open: the drop's figure under the global flash, the slides.

**Addendum 3 — v0.15 tagged and deployed (2026-09-27, the user: "I watched in stream mode and looks good; add thumbnail,
commit, tag, and deploy").** The user validated CHLADNI in **stream mode** (tab capture: the causal ears, no track map — the
live fallbacks `dropConf` / `dropEvt`). The tile `site/thumbs/chladni.jpg` is a **file-mode** frame (SeeYouDrop `&at=10`,
CLOCK=1 f482 = heard 17.6 s, the walk's A1 figure on the circular plate) — not `tools/thumbs.sh`'s fake-timeline frame, where
CHLADNI's ears fields are idle and the plate is dark; `thumbs.sh` cannot drive file mode, so the tile is regenerated by hand.
`releases/retinarave-v0.15.html`, package.json 0.15.0, `git tag v0.15`, pushed. **`tools/accept.sh` still not run** — the
user asked for the tag and deploy, not the sweep; the cheap proofs stand (AUDIT-v0.15). CHLADNI stays forced-only (score 0).

## §49 v0.16 — live mode: the clocks measured, the capture lag, the lead (2026-09-28, orchestrator alone; `docs/AUDIT-live-grid.md`)

**The ask** (the user, verbatim): "focus on live mode (while file mode is useful, I don't expect to have the file normally)",
then "yes" to the six-step live plan (1 measure · 2 run the clocks ahead · 3 bar fingerprints · 4 build detector v2 ·
5 predicted-event queue · 6 tempo on the PCM bus / Kalman only if jitter demands it), then "yes" to step 2.

**Step 1 (`cd27c77`):** `tools/truth/gridcheck.py` (the v3 + synapse clocks against the truth grid; self-tested on synthetic
traces), `tools/caplag.js` + `tools/capsrc.html` (tab-capture lag from a click train, capture traces in listener time).
Capture lag **27 ms** here. The clocks jitter ~8 ms (p50) but sit at a constant −47 ms (real-time file / demo) / +14 ms
(capture): where the audio is analysed against when it is heard. `&sync` moved the ears' ages onto the beat (kick +32 → +7 ms)
and not the clocks, which do not read `heardT`. Fixed on the way: `&sync=` reached only the file source, never capture.

**Step 2 (`1fad9a4`) — `engine/lead.js`.** After every stage the engine publishes `beatPhase / beat / beatCount` (at `bpm`)
and `beatSyn / barPos / barPhase / phrasePos / phrase16Pos / bar` (at `bpmSyn`) moved by `leadT` = heardT − the analysers'
newest audio time (+ `&disp`); the raw values go back before the next frame, so the PLL, the tempo comb and fake.js never see
a lead. Lag off → on (SeeYouDrop 22–90 s): det −50 → −7, real-time file −54 → −7 / −20, capture +14 → −11 ms; beat F
0.60–0.88 → 0.94–1.00. **Lean:** a lead stage over the published names, not a second set of `…L` fields — every scene is fixed
at once and none reads a new name; the cost is that `MS.beatPhase` is no longer the PLL's own variable between frames (it is
the moved one; the stage owns the swap). **Lean:** the lead estimate is a median of 64 samples with stale output timestamps
dropped, not an EMA: one stale first-frame timestamp (+0.24 s) held an EMA at +40 ms for seconds (4 runs in 6). `&disp`
(the frame's path to the glass) stays 0 — unmeasured, and every clock already sits a few ms early.

**v0.16 (this commit):** the user reviewed in stream mode — "looks good; commit and tag work completed so far" — so the lead is
**on by default** (`&lead=0` / the `L` key turn it off). The fake timeline never gets a lead: parity fake 0, s11
`&ears=1&figure=0` md5 606f721a / f7b1c6ee unchanged; `&lead=0` reproduces v0.15's det trace byte for byte; a default det
trace carries `leadT` −42.7 ms. `package.json` 0.16.0, `releases/retinarave-v0.16.html`. Not run: `tools/accept.sh`; not
pushed or deployed (not asked). Next: step 3, `LIVE-STEP3-SESSION-PROMPT.md`.

## §50 v0.17 (in progress) — live step 3: bar fingerprints (2026-09-28, orchestrator + one worker for 3.1; `LIVE-STEP3-SESSION-PROMPT.md`, `docs/AUDIT-live-grid.md` "Step 3")

**The ask:** step 3 of the agreed six-step live plan ("focus on live mode … I don't expect to have the file normally"; "yes" to the
plan): predict the next bar's hits so they land on time, and know a section change / a return when it starts.

**3.0 `&map=0` (`3428c9e`).** `ENGINE.useMap` gates the file's track map, so a file runs the causal ears — the live path,
deterministic under `CLOCK=1`. Default traces unchanged (`cmp`); SeeYouDrop 25–45 s kick F 0.786 (the brief's 0.77–0.79).
**3.1 truth grids (worker, `f0e69e8`, `docs/workers/truth-grid-s3.md`).** CyborgNinja's grid re-anchored onto its kicks (a
general rule in `trackmap.py`: an eighth-note kick grid > 25 ms off the beat grid moves it; the beat half is the one with more
40–150 Hz energy) — median |kick error| 72 → 3 ms at every grain; WhoLikesToParty's tempo re-fitted (drift +20 → −22 ms gone),
its bar line not verified; SeeYouDrop / Malicious byte-identical. **3.2 `predcheck.py` (`06d089b`)**, self-tested.

**3.3 the store (`d4a62c5`, `engine/bars/`: `bars.js` + mixins `vote.js`, `sections.js`, `feed.js`, `common.js`; `features-bars.js`).**
The leans, each measured before it was taken:
- **The grid is v3's, not synapse's.** The brief said "quantised on the synapse grid"; measured on the causal path (whole-track
  det) synapse's tempo is right 61.6 % of frames (half-time through the groove-return and the climb-double, the bar line right
  57 %) against v3's 95.5 % (beat F 0.91). Bars are 4 v3 beats; synapse proposes the bar PHASE only when `barConf` ≥ 0.9 in the same
  octave (held 8 beats before the store moves). The v3 bar lines landed on all 10 annotated SeeYouDrop downbeats.
- **THE TIME BASE: release inside the stage on the heard grid, with the lead's own estimate** — not a hook after `leadApply`.
  `B = beatCount + beatPhase + LEAD.L·bpm/60` (raw v3 + heardT − the analysers' newest audio time), onsets at `B − age·bpm/60`,
  a step released when `B` (+ `&disp` with the lead on) crosses it. Why: an onset can only be placed by its age on a heard grid,
  and that needs the true audio lead whether or not the lead PUBLISHES the clocks, so `lead.js` now estimates `LEAD.L` with the
  lead off too (it still publishes nothing: the `&lead=0` whole-track trace is `cmp`-identical to v0.16). A post-lead hook would
  have put `&lead=0` predictions on the analysis grid (43 ms early in det, 27 ms late in capture). Proof: the stage's output is
  identical with the lead on and off (0 of 8965 frames differ); predicted lags in capture +1…+5 ms, in det −5…+3 ms (groove) — no
  constant ±27–43 ms anywhere.
- **Per-class micro-timing.** Each class is released at its line + a learned offset (EMA of where its onsets land, ±0.4 step):
  the causal kicks sit +25 ms after the heard v3 line, the snares +6, the hats 0 — without it the predicted kicks read −16 ms.
- **Reliability is precision.** `predConf` = match quality × the recent bars' prediction precision × the vote's agreement.
  Graded as Jaccard against what the ears heard, a right prediction was punished for every onset the ears added or missed
  (reliability sat at 0.25–0.5 on the groove); the harm of a released event is a hit that does not come.
- **The per-beat energy vector is 12 MS fields** (synapse `bassS midS highS sub lvl centroid`, the ears' `bassReg subGate subPure
  denK denS denH`), not synapse's per-beat `F` (23-dim). Self-contained and node-testable, the brief's own suggestion; `F` is
  the next lever for the section test (AUDIT "Open").
- **No pattern → bars map.** A linear scan of the 256-bar ring per decided 16th costs 5.1 µs/frame mean (worst 0.66 ms);
  the exact-pattern index the design notes proposed buys nothing at that size, and exact bits never repeat through the ears' noise.
- **The first steps of a bar come from the previous vote's successors** (the bar before is still open for CLOSE_M = 0.35
  beat — the capture path's +52 ms detection lag); a candidate with no bar before it scores a neutral 0.5 on context.
- **Section tests against the recent bars, not against the prediction.** A section start = the heard part (5 / 8 steps) is
  unlike every one of the last 4–8 bars while those were alike, on the mean of the THREE largest per-dim distances (the plain
  mean over 12 dims read the drop — sub 0.04 → 0.94 — as 0.62 similar). A first version gated it on a confident prediction and
  found 0 of 10 (the confidence is low exactly where sections change). A return = an older bar (≥ 8 back) matches 0.15 better
  than the recent bars and is itself unlike them; a return whose source moves forward no faster than time within 8 bars of the
  last return is that return going on (a fill bar in a returned loop), which also swallows the climb-double (its material
  follows the groove's in the original order) — accepted: a false return on every fill after every return is worse.
- **Additive fields** (FEATS, `feats-doc.js`, Appendix A checked): `predKickEvt / predSnareEvt / predHatEvt`, `predKickAge /
  predSnareAge / predHatAge` (raw, like `kickAge`), `predKick / predSnare / predHat` (levels decaying 0.16 s, synapse's `kick`
  shape — so TORUS2's kick channel can be routed from them with no scene edit), `predKickIn`, `predConf`, `barMatch`,
  `barNovelEvt`, `barReturnEvt`. Nothing existing changes value: default and `&lead=0` whole-track det traces `cmp`-identical to
  v0.16, parity fake 0 diff, s11 `606f721a` / `f7b1c6ee`.

**3.4 numbers** (AUDIT "Step 3", rows `tools/accept/live-grid/*-bars-*.md`): capture 22–90 s kick / snare / hat F 0.46 / 0.47 /
0.53 at +5 / +1 / +3 ms, 100 % released before the audio arrived (reactive first frame F 0.02–0.11, +38–52 ms); section starts
3 / 10 at +1.2–2 beats (synapse 3 / 10 at +3–5), returns 1 / 3 (synapse 0 / 3). **3.5:** no new scene; the A/B is a route
(the report and NEXT-SESSION-PROMPT.md). Not run: `tools/accept.sh` (not asked). Not tagged, not pushed.


**§50 addendum — the warm-up (2026-09-28, `LIVE-STEP3-WARMUP-SESSION-PROMPT.md`, AUDIT "Step 3 — warm-up").** The user's look at
the TORUS2 A/B: *"the predicted seems to bring more energy / brighter strands which I like, but seems like beat is off
slightly in the beginning and gets better over time"*. The leans, each measured first:
- **A cold-start ruler that grades against the same audio, warm.** Binning by time since the start (the prompt's capture
  table) mixes the warm-up with whatever section the start lands in; the first releases were set beside the whole-track
  (warm) store's releases in exactly those seconds (`warmcheck.py` "warm, same s"). On 24 det cold starts the baseline's
  early PRECISION already equals the warm store's (0.73 / 0.72, 0.66 / 0.71); its early TIMING does not (−13 / −9 / −5 ms in
  the first 4 s, then 0). The fix went after the timing.
- **Cause: the clock's pull-in, not the store's thin history.** From a cold start v3 cuts its tempo once (1.5–5.6 s in) and
  pulls its phase in for 2–4 s (cold − warm +69 +30 +15 +8 +3 ms per s); the kicks' residual reads −28 ms on bars 1–4, +28
  after. The store learned its offsets from those residuals and released on the moving grid.
- **Settle on the clock's slip, per bar, with a cap.** The slip is causal, needs nothing new from upstream (v3 has no lock
  field) and is the pull-in itself. Measured against the alternatives: a signed 2-bar sum (hunting cancels) settles in the
  middle of CyborgNinja's hunting; a per-bar gate at 0.05 forever untrusts 41 % of CyborgNinja's bars (its warm p75 slip is
  0.084 beat) — so 0.05 decides only the settling, 0.12 the per-bar trust after it, and 6 bars settle a clock that never
  gets quieter. Sweep (SLIP_SET 0.05 / 0.08 / 0.1, SET_BARS 1 / 2, SET_MAX 4 / 6 / 8 / none, REL_N0 0 / 2 / 3): within noise
  of each other on P; the chosen row is the least quiet with the first-4-s lags on time.
- **Two trusts.** A bar's 16th pattern votes only from a settled grid (`okS`); its per-beat energies feed the section tests
  whenever the grid was ok (`okE`) — the first version shared one trust and lost the void boundary.
- **Not built: re-cutting the history on a bar-phase move** (hypothesis 3). 4 of 8 cold starts move the phase 10–24 s in;
  after W.1 no row blames it.
- **The level shape is untouched** (the look the user liked: pred* peak 1.0, no velocity). The price is quiet: the median
  first release after a cold start 12.6 → 15.2 s on SeeYouDrop, 23.2 → 24.2 s on CyborgNinja (one of 12 starts silent 40 s).
- The CyborgNinja v3 clock sits 80–180 ms off its kick-anchored truth warm and cold (near half a beat at 160 BPM) — a clock
  item for later (step 4+), recorded in AUDIT.
- **Follow-up the same day (W.1b): the offset is a median, the gate is off.** The start-at-0 real-time run (the user's
  scenario: an intro, then the drums) was still early after W.1 (−7 ms ×3): the grid settles during a quiet intro, so the
  gate never sees the groove arrive, and the EMA took 13 s to move the kick offset from the intro's to the groove's. A
  median of the last 16 residuals follows it within half a window; with it the gate measured no better on timing or
  precision and cost 2–3 s of quiet, so `WARM.GATE = 0` (a switch, not deleted: the "quiet until right" variant if the user
  prefers it). What stays: the settle state times the offsets' learning, the reliability is earned, both reset at a
  discontinuity, the section tests keep their own trust. The first-4-s lags: SeeYouDrop 0 / 0 / −6 ms (baseline −13 / −9 / −5).

## §51 the reactive drums v2 — `kick2` / `snare2` / `hat2` (2026-09-28, orchestrator; `docs/AUDIT-drums.md`)

**The ask.** The user, after the warm-up A/B: "I think the reactive still looks better (ie. seems like it moves in sync with
the music better)"; to the three options offered (improve the reactive path · prediction only as a supplement · stop), "do #1".
(The offer mislabelled it "live step 4"; the plan's step 4 is the build-up detector — told the user, left for later.)

- **Additive, by route.** The reactive look lives in `kick` / `snare` / `hat`, read by five scenes; changing them moves every
  md5. v2 is three new levels of the same shape (`engine/drums/drums.js`, stage `features-drums.js` after the ears), A/B'd by
  `torus2.kick=kick2,torus2.snare=snare2,torus2.hat=hat2`; the default moves only on the user's word.
- **The kick = the ears' low onsets**, measured against synapse's flux peaks and the ears' beater-gated kicks on four tracks
  (AUDIT table): the truth's own `low` definition computed causally, already inside `perc.js` and dropped — now a separate
  lane in `Ears` (`pendLow` / `lowReleased`), so the event log and every existing field stay byte-identical. A second, retuned
  low picker was measured and not built (plateau: ±0.01 F).
- **Strength by rank, times synapse's bass loudness.** The ears' velocity saturates (p50 1.0 — the uniform brightness of the
  predicted route); the rank keeps synapse's distribution and synapse's own bass factor keeps the section dynamics.
- **Snare / hat stay synapse's, held to heard time.** Synapse's are better than the ears' on 3 of 4 tracks; they lit up 6–12
  ms early in file modes (analysis ahead of the ear) — the hold makes them +5…+10 (the 60 Hz frame), nothing held in capture.
- **Graded by what shows** (`drumcheck.py`, level rising edges ≥ 0.18) and, in capture, with each source's constant lag removed
  and a chance level beside it: synapse's capture kick is 0.39 against a 0.29 chance, v2's 0.54 against 0.15.

**v0.17 tagged locally (2026-09-29) on the user's word** ("v2 looks good" → "tag v0.17 locally then switch back to v0.16"): live
step 3 (the bar store, pred* fields, used by no scene by default), its warm-up (W.0–W.1c), the reactive drums v2 (kick2 /
snare2 / hat2, opt-in by route — the TORUS2 default the user chose is NOT in the tag). `releases/retinarave-v0.17.html`,
package.json 0.17.0. Not pushed (retinarave.com serves v0.15). The user then asked to compare v0.16 with v0.15 on NAV.

## §52 the display lead: 40 ms by default (2026-09-29, the user's eye)

**The look.** On NAV in file mode the user found v0.15 better than the current tree ("in theory v0.16 should be on par with
v0.15"). On NAV the only v0.15 → v0.16 difference is the lead (v0.16's default: the clocks published on heard time); in file
mode it moved them ~43 ms LATER (v0.15's clocks ran ~43–47 ms ahead of the ear, AUDIT-live-grid step 1). Three links on v0.16:
as shipped · `&lead=0` · `&disp=40` → "second and third look good".
**Reading:** the lead is right about the ear, and the frame's own path to the glass (compositor + display — unmeasured, noted
in HARNESS "Not in any number") is ~40 ms on this desktop; v0.15's early clocks happened to cover it. So `LEAD.disp` = 0.040 by
default (`&disp=0` = v0.16). The display lead reaches everything timed on the lead: the clocks (leadT −43 → −2.7 ms in file
det), the bar store's releases (bars feed uses `disp` when the lead is on), and the drums v2 hold, now net of it
(`features-drums.js`: with 40 ms nothing is held in file modes — the eye wants a hit ~40 ms before the ear). Not moved: the
ears' events (kickEvt … are released on heard time; releasing them early is possible in file modes only — left open).
In capture the clocks now run 40 ms further ahead too: the user approved v0.16 there at 0 — to be re-looked.
Proofs: check 0 fail, npm test OK, the `&lead=0` whole-track trace `cmp`-identical (the display lead needs the lead).

**§51 addendum — TORUS2 reads v2 by default (2026-09-29).** The user: "v2 looks good", then "Default on TORUS2 only". TORUS2's
feats `kick / snare / hat` → `kick2 / snare2 / hat2` (the wave step, the core flash, the hat shimmer, the `wave` param, help);
every other scene unchanged. Proof (one scene folder): s3 f360 / f840 md5 7189a6ba / 48113eda before and after (v2 mirrors
synapse on the fake timeline), check 0 fail, the real-track page live. A route that named `torus2.kick` must now name `torus2.kick2`.

**v0.17.1 tagged locally (2026-09-29) on the user's word** ("tag as v0.17.1, don't deploy yet"): v0.17 + the 40 ms display lead
by default (§52) + TORUS2 on the reactive drums v2 (§51 addendum). `releases/retinarave-v0.17.1.html`, package.json 0.17.1. Not
pushed (retinarave.com serves v0.15); the display lead in stream mode not yet re-looked.

## §53 the display lead is file-mode only (2026-09-29, the user's stream-mode A/B)

**The look.** Two links in stream mode (tab capture) on v0.17.1: A = the default (40 ms display lead, §52) · B = `#disp=0`
(v0.16's stream timing) → "B looks better". So in capture the clocks read right on the heard time (capture −11 ms, AUDIT-live-grid
step 2), and the 40 ms that the eye wanted in file mode is not wanted live.
**The change.** `LEAD.dispLive` = 0 beside `LEAD.disp` = 0.040; `dispNow()` in `engine/lead.js` = 0 with the lead off,
`dispLive` on a capture / mic source, `disp` in the file modes and the demo — read by the lead, the bars feed and the drums v2
hold (the three §52 consumers). An explicit `&disp=<ms>` sets both (so `#disp=40` is A in capture again). **Not explained:** the
glass path is the same screen in both modes; why the eye wants it in file mode and not in capture is open (the capture lag
27 ms may be under-measured, or file mode's own lead estimate off by about that much) — recorded, not chased.
Proofs: SeeYouDrop 20–50 s file-det trace identical before / after (1801 frames × 170 fields, log too); `dispNow()` per mode
default `file .04 demo .04 capture 0 mic 0`, `&disp=40` → .04 everywhere, `&lead=0` → 0 everywhere; check 0 fail, npm test OK.

## §54 live step 4 — the live build / drop detector: `buildLive` / `dropLiveIn` / `dropLiveEvt` (2026-09-29, orchestrator + one worker for B.2–B.3; `LIVE-STEP4-BUILD-SESSION-PROMPT.md`, `docs/AUDIT-live-grid.md` "Step 4")

**The ask.** Live (tab capture — the user's real use) nothing anticipated a drop: the v0.15 track map's `buildProg` / `toDrop` /
`mapDropEvt` need the whole file; v3's `build` is "the energy went up" (2 of 6 drops, as often armed on CyborgNinja as on the
drop tracks) and synapse's anticipation chain is dead on the live path (B.0). Measure first (B.0 the ruler, B.1 the node loop
and the study), then build (B.2), then prove (B.3). The leans, each with the number that decided it:

- **A drop is announced by the void, 2–5 bars out — not by a 16-bar build.** Over 16 bars no causal candidate separates a
  build from elsewhere (AUC ≤ 0.76, CyborgNinja-safe ones ≤ 0.73); the last 2–5 bars do: the bass and sub pulled, the highs
  left, synapse's high-pass evidence `hp` on — one signature on all five SeeYouDrop / WhoLikesToParty drops (`subConf` 5 s
  deviation AUC 0.94, `hp` 8 s rise 0.91). So the detector reads the void, and its arm can only be 2–4 bars ahead.
- **The arm is synapse's `hp` (5 s mean > 0.1) or `bassS` (2 s mean < 0.6 × its 32 s mean), after 32 s of music.** `hp` alone
  arms 5 of 6 drops with 0 false arms on every track (0.05 and 0.2 change nothing but false arms at 0.05); the bass term
  buys WhoLikesToParty 3 a bar (7 → 11 beats) for two 0.9 s false arms (0.19 / min: a bass-less bar 14 s after SeeYouDrop's
  drop 2, Malicious' end fade). 32 s of history before anything arms: the 32 s mean IS the reference (16 s lets Malicious'
  intro bass cuts arm and fire, 48 s changes nothing). `subConf` / `subGate` (the study's best AUC) were not added: the ears'
  sub fields are the map's in file mode — a detector on them would run two different inputs in file and stream mode — and
  `hp` + `bassS` already reach the 5 of 6 the study predicted.
- **No hold before the arm; armed on the next bar line.** B.1 proposed "held ≥ 1 bar"; measured, a bar of hold costs a bar
  of anticipation on every drop (15.9 7.9 · 11 7 11 → 12 4 · 7 7 7 beats) and buys nothing (0 false arms either way) — the
  5 s mean is the hold. The arm waits for a bar line of the heard grid (v3's count, or synapse's sure bar phase after 8 beats,
  the bars store's rule); WhoLikesToParty's drops sit at v3's bar phase 3, so its arms are 4k + 3 beats and `dropLiveIn`
  points +1.0 beat late there (0.0 on SeeYouDrop) — the WhoLikesToParty downbeat is the unverified one (the map's own drop
  sits 2 beats before the truth, synapse's anchor 1 beat after).
- **The slam needs the bass back, not a bar line.** Every void carries kicks on bar lines (SeeYouDrop 1: one on every beat,
  bass-less) and a bar gate on the detector's phase fires 2 of 6 — so the slam is an ears low onset (the drums v2's causal
  lane: SeeYouDrop 2's drop is an 808, no kick) within ⅛ beat of a BEAT line, confirmed within ¼ beat by `bassS` ≥ 1.75 ×
  its 2 s mean (the gap: pickup kicks' bumps reach 1.56, the softest drop 1.87; 1.5 fires a beat early on WhoLikesToParty
  1 and 3, 2 loses two drops) or `sub` ≥ 5 × its own (SeeYouDrop 2's 808 return, +87 → +21 ms; void kicks reach 3.0, the
  drop 17). **No slam in the void's first bar** (`SLAM_AFTER` 1): a pickup 2 beats into WhoLikesToParty 3's arm read 1.72 —
  a void is 2–5 bars, a bass return inside its first bar is a pickup. Six drops tune a slam, they do not prove one; on
  WhoLikesToParty the truth itself is ±2 beats. Result det: −6 +21 · +10 +48 +12 ms, 5 of 6, 0 false on every track.
- **Additive, causal in every mode, no default moves.** A new stage after the drums, on the bars stage's heard time base,
  reading synapse's levels, v3's clock and the ears' causal lane (never the map's onsets), writing three new fields; disarm
  on the slam, after 8 bars armed (a breakdown), on silence, a seek, a tempo jump. The 32-field whole-track det trace, its
  `&lead=0` twin and a 72-field one `cmp`-identical to the pre-change tree; check 0 fail, npm test + `test_build.js` OK,
  parity fake 0 diff; page = node (`dropLiveEvt` identical on all four tracks, the arms within a bar at the thresholds).
  No scene reads the fields by default; NAV takes them by route (`nav.build=buildLive,nav.dropEvt=dropLiveEvt`, set live on
  the capture page with `CARD.routes(...)` — `&route=` needs `#test`, which hides the capture button) for the user's
  stream-mode A/B. **Page `&map=0`: armed 15.9 8.0 · 8.0 7.0 11.0 · 0 beats, 0.28 false / min, 0 on CyborgNinja;
  `dropLiveEvt` −6 +21 · +10 +48 +12 ms, 0 false.** Not done: the audible capture run (the orchestrator's), a second no-drop
  control, a hand check of WhoLikesToParty's / Malicious' drops.

**§54 addendum — the audible capture run (2026-09-29).** SeeYouDrop from 0 in tab capture (`&sync=27`): `buildLive` arms 14 / 6 beats
before the two drops, 0 false arms in 111 s, armed 7.3 % of the time; `dropLiveEvt` +61 / +89 ms (reactive, as expected in
capture). The A/B for the user is a live route on the capture page (`CARD.routes('nav.build=buildLive,nav.dropEvt=dropLiveEvt')`);
no default moves until their word. Not tagged, not pushed.

**§54 addendum 2 — NAV reads the live detector by default (2026-09-29).** The user's stream-mode A/B on NAV (A = v3's `build` /
`dropEvt`, B = the live route): "B looks good"; to "where should it be the default" (NAV only · every scene reading build / dropEvt ·
opt-in): "#1". NAV's `feats` `build` → `buildLive` (the park at the cusp, the director's bid `score`) and `dropEvt` → `dropLiveEvt`
(the exit along a ray); `dropStrength` / `dropEnv` stay v3's (what the A/B showed). MAXWELL, POLYTOPE, GIELIS unchanged. The old
look by route: `nav.buildLive=build,nav.dropLiveEvt=dropEvt`. Fake-timeline md5 s0: f360 `fb74fee4` unchanged, f840 `7225ea02` →
`8a0715df` (the fake timeline has v3 builds and drops, none of the live detector's — NAV no longer parks or exits there; the
landing's demo synth runs the real stages, so it does). check 0 fail, npm test OK. The trade: in file mode v3's `build` armed
before 2 of 6 truth drops on its own, the live detector 5 of 6 (§54); a scene on `buildLive` gives up the first for the second.

**v0.18 tagged locally (2026-09-29) on the user's word ("B looks good" → "#1"; "don't deploy" stands from earlier the same day):**
v0.17.1 + the display lead file-mode only (§53) + the live build / drop detector (§54) + NAV on it by default (§54 addendum 2).
`releases/retinarave-v0.18.html` (1252 KB, 142 modules; from `file://` 348 frames in 6 s, errs [], nonFinite []), package.json
0.18.0. Not pushed (retinarave.com serves v0.15).

## §55 live step 5 — the predicted-event queue: `next*In` / `next*Conf` / `next*Up` / `queueN` (2026-09-29, one worker; `docs/AUDIT-live-grid.md` "Step 5")

**The ask** (the six-step live plan, §49; NEXT-SESSION-PROMPT item 2): one queue of the events the engine expects — the bar
store's `pred*` hits, `dropLiveIn`'s bar line, the beat lines — released on heard time minus the display lead, so a scene reads
"what comes next" from one place instead of three. Measure first, additive, A/B by route in stream mode, a default only on the
user's word. The lesson behind it (2026-09-28's A/B): reactive levels look more in sync than predicted ones, so a queue is for
ANTICIPATION — a motion that winds up and PEAKS at the hit — not a replacement for the hit itself. The leans, each with the number:

- **The queue predicts nothing.** `engine/queue/queue.js` rebuilds ONE list `{ cls, t, conf }` every frame from what the other
  stages already decided: the lead-moved v3 clock's next beat lines (at least 4), the bar lines of the build detector's phase
  (v3's count, or synapse's sure anchor — the same rule the bars store keeps; no third bar line), the store's own steps still to
  come (`Bars.upcoming`: the decided ones waiting for their class offset + the bits `release()` reads for this bar and the next,
  at `predConf`), and, while armed, the drop on `dropLiveIn`'s line at `buildLive`. A step the next re-vote clears is gone from
  the next call; below `CONF_MIN` nothing is listed, as nothing is released. Proof: on a taught loop every one of 112 released
  predictions was listed ahead of its release (median 5.4 beats), `nextBeatIn` is the page's own moved clock to 1e-14, `nextDropIn`
  = `dropLiveIn`/bps outside the detector's ⅛-beat hold after a line.
- **The time base is the bars store's release position** (`rel` = the heard v3 beat + `dispNow()`), so an entry's `t` is when the
  eye should see it and `nextKickIn` reaches 0 on the frame `predKickEvt` fires: graded by its roll-overs, the kick's lag reads
  +1 ms on SeeYouDrop (det, `&map=0`) where `predKickIn` — the same step without the class offset — reads −18 ms. The
  half-frame release lead is not in the count-down (a scene wants 0 on the hit, not −8 ms).
- **HOLD 0.25 s — the one deviation from "withdrawn is withdrawn", measured.** With the list rebuilt from the store alone,
  `nextKickIn` jumped 96 times a live minute on SeeYouDrop (97 withdrawals against 148 roll-overs; 87 of them emptied the list:
  the store's confidence gate flickering under 0.35 between 16ths, not a bit flipping), and 56–76 % of the withdrawn entries
  pointed at a real onset. A hit entry already inside HOLD s stays for its time when the store withdraws it. The sweep
  (node, four tracks): HOLD 0 / 0.1 / 0.25 / 0.5 → SeeYouDrop kick jumps 96 / 92 / 39 / 20 per minute, F 0.46 / 0.47 / 0.48 /
  0.50 (P 0.59 / 0.59 / 0.58 / 0.58); CyborgNinja kick P 0.66 / 0.63 / 0.59 / 0.52 — 0.25 = the wind-up's own length is the
  knee where precision holds (−0.01…−0.07) and the wind-up can complete; 0.5 buys smoothness with precision. A held entry
  the store then decides against still rolls over (a `nextKickIn` arrival `predKickEvt` does not fire) — the cost, inside 250 ms.
- **`-1` is "none", and three levels beside the count-downs.** `next*In` keep the −1 of `predKickIn` / `dropLiveIn` / `toDrop`
  (a scene author learns one convention). But a param route is `u = clamp01(k·x + b)`: a wind-up needs k < 0, and then −1 lands
  at the TOP (`clamp01(−4·−1 + 1) = 1` — the wave at its deepest exactly when nothing is predicted). So `nextKickUp` /
  `nextSnareUp` / `nextHatUp` = `clamp01(1 − in / WIND)` (WIND 0.25 s), 0 with no entry: the route-friendly form, and the A/B's
  source. `next*Conf` beside them for a scene that weights instead of gates.
- **Horizon 8 beats bounds the list, not the reach.** `queueN` counts inside 2 bars; the hit fields' reach is the store's (this bar
  + the next), the drop's `dropLiveIn`'s (≤ 4 beats): HORIZON 4 changes no `next*In` on any track. The horizon actually
  DELIVERED by a "next" field is the class's inter-onset interval — SeeYouDrop's kicks are on every beat, so `nextKickIn` first
  points at a kick 0.39 s before it (its median) and can never see further: a wind-up longer than a beat needs the list, not the
  field (`CARD.QUEUE`).
- **Additive, every mode, no default moves.** A new stage after 'build' (before the lead, on the raw clocks like bars / build);
  13 new MS fields (`feats.js`, `state.js` defaults, Appendix A regenerated), `ENGINE.QUEUE.list` / `CARD.QUEUE`. No scene reads
  them. The three §54 whole-track SeeYouDrop det traces from a `git archive e23db09` tree against this tree `cmp`-identical
  (32-field default, its `&lead=0` twin, the 72-field set); check 0 fail; `npm test` + `test_queue.js` (38 checks); parity fake: the 72 MS
  fields 0 diff, the `nav.*` rows red identically on the e23db09 tree (pre-existing since 22eb969 — NAV on the live detector,
  no live drops on the fake timeline; OPEN-ITEMS); the bundle from `file://` clean.
- **What it says (page `&map=0` det, four tracks; AUDIT Step 5 table):** the count-downs to the hits land where the store's
  events land (kick lag +1 / +5 / +6 ms, F 0.50 / 0.39 / 0.54 against a chance 0.05 / 0.16 / 0.18 on SeeYouDrop / CyborgNinja /
  WhoLikesToParty, the groove window = predcheck's step-3 row; Malicious releases nothing, as before), the beat and bar count-downs are the moved clock (F 0.88 / 0.93 / 0.69 on SeeYouDrop /
  WhoLikesToParty / Malicious, 0.2–0.4 jumps per minute) — CyborgNinja's beat F 0 is the v3 clock 80–180 ms off its
  kick-anchored truth (§50 addendum, still open), WhoLikesToParty's bar F 0 is its unverified downbeat (§54) — and `nextDropIn`
  reproduces §54's arms (15.9 / 8.0 · 8.0 7.0 11.0 · 0 beats). The A/B for the user is a PARAM route on TORUS2 in stream mode
  (`CARD.params('torus2.wave=nextKickUp*0.35+0.65')`: the wave depth winds up 0.26 → 0.40 over the 250 ms before each predicted
  kick, the default 0.26 in between; `CARD.clearParams('torus2')` back) — proved headless on the real page with `CARD.fix`;
  the audible capture run is the orchestrator's. Not tagged, not pushed.

**§55 addendum — the audible capture run (2026-09-29).** SeeYouDrop from 0 in tab capture: `nextKickIn` zero crossings +3 ms
(P 0.60, chance 0.05; the base `predKickIn` −20 ms), `nextSnareIn` +0, `nextBeatIn` −8 (P 0.83), both drops queued 14 / 8 beats
ahead, 0 false. The A/B for the user is a live PARAM route on the capture page (TORUS2's `wave` winding up over the 250 ms before
each predicted kick); no default moves until their word. Not tagged, not pushed.

**v0.19 tagged locally (2026-09-30) on the user's word ("tag what we currently have as v0.19 (don't deploy)"):** v0.18 + live step 5,
the predicted-event queue (§55; no scene reads it by default). `releases/retinarave-v0.19.html` (1267 KB, 145 modules; from
`file://` 347 frames in 6 s, errs [], nonFinite [], the fake timeline has no queue: queueN 0), package.json 0.19.0. Not pushed
(retinarave.com serves v0.15). The user's direction for what follows: "still need to work on the predictions"; step 6 (tempo on
the PCM bus) next — "on the PCM bus seems more accurate and would be wanted regardless".

## §56 live step 6 — the beat clock on the PCM bus: `bpmPcm` / `beatPhasePcm` / `beatPcm` / `beatCountPcm` / `clockConfPcm`, the `&clock=pcm` switch (2026-09-30, one worker; `docs/AUDIT-live-grid.md` "Step 6")

**The ask** (the user, 2026-09-30: "on the PCM bus seems more accurate and would be wanted regardless … still need to work on the
predictions → continue onto step 6"; the six-step plan's last step, §49): tempo + phase estimated from the raw samples on the
audio's own clock instead of once per video frame, and a proper filter so one odd onset cannot yank the beat line — a steadier
line for the bar store's offsets and the queue's count-downs to ride. Measure first, additive, A/B by a switch, a default only on
the user's word: every scene reads `bpm` / `beatPhase` / `beat` / `beatCount` and none of them moves by default. The leans:

- **What v3's clock actually is (T.0).** One spectral-flux value per rAF frame from an AnalyserNode read at frame time, into the
  100 Hz ring by zero-order hold from the raw frame clock — an onset lands in the ring at the FRAME's time, ± half a frame — then
  a PLL whose target is the comb line with a hand-tuned `+0.03` beat and whose onset corrections (`bassFast` hits) bleed over
  0.18 s. Its onset events read +17 / +32 / +32 / +23 ms after the truth kicks on the four tracks (p90 33–42). Graded on heard
  time (`gridcheck.py --heard`, new): lag −4 / −87 / +3 / +22 ms with jitter p50/p90 8/32 · 43/244 · 4/11 · 10/67 on SeeYouDrop /
  CyborgNinja / WhoLikesToParty / Malicious. CyborgNinja's "half-beat offset" (§50 addendum) turned out to be a TEARING: its
  kicks sit on every 8th (two lattices half a beat apart, 162 vs 158 of the ears' kicks), the comb target pulls one way and the
  last kick the other, and the PLL sits between them at p90 247 ms.
- **The comb's input is v3's own onset function, per hop — not the ears' band flux (T.1).** The ears' 7-band dB flux was the
  obvious reuse and was measured first: its beat-lag autocorrelation reads 0.11 in SeeYouDrop's intro and 0.44 in its groove
  where v3's full-spectrum log flux reads 0.59 / 0.79 (the HPSS residual gated at −34 dB is nearly binary per hop: a detector's
  signal, not a periodicity function), and tempo.js's comb on it held SeeYouDrop's intro at 121 BPM for 20 s. So `engine/clock`
  computes v3's `(flux + 3·bassFlux)/100` from a 2048-point FFT on the PCM bus's newest 2048 samples every 512, timed by the
  sample count. Synapse's Analyzer has that FFT but on its own tap without sample stamps: the clock runs its own (the ears' FFT
  class), 0.045 ms per hop.
- **The ticks are the ears' onsets (T.1).** Onsets picked from that flux (first hop over mean + 1.5 sd, timed by the rise's split
  between hops) sit +3 / +18 / +19 / +9 ms after the truth kicks — a kick's full-spectrum flux peaks a hop after its click on two
  tracks — where the ears' kicks (perc.js, the beater-click rule, ONSET_LAG 6 ms) sit +3 / +8 / +6 / +2.5 (sd 6–8) and their
  snares / hats within ±3. Sample-timed, already computed, already validated (v0.15): `features-clock.js` reads `EARS.ears.pending`
  right after the ears' own PCM listener ran and hands each new kick / snare / hat to the clock with its class and velocity.
  KICK_LAG 4 ms = the median of the four kick placements.
- **The filter is a 2-state Kalman with PDA gating, not a PLL (T.2).** x = [beat position, rate]; each onset says "a line is
  here" with R = R_ON·R_CLS[class] / vel (0.03² beats²; kick 1 / snare 1.5 / hat 3) and its gain is scaled by
  beta = N(y; 0, S) / (N + CLUTTER) — the posterior weight of "on the grid" against one off-grid hit per beat: 0.9 on the line,
  0.6 three sigma out, 0.06 four sigma out. Cold, the first onset sets the phase; locked, a vel-1.5 hit half a beat off moves the
  next beat 0.4 ms (test_clock). The comb's tempo (period.js = tempo.js's steps 1–6 copied to the letter with its state in the
  object; v3's estimator untouched) is a rate measurement every 0.5 s of audio, a re-seat on a vote switch; no presence gate —
  the line coasts through silence on its rate (6 s of silence: 21 ms p90, no jump).
- **The comb line VOTES the lattice; it never pulls.** The onsets alone cannot pick between two half-beat lattices (WhoLikesToParty
  first locked exactly half a beat off: −249 ms), and a continuous pull toward the 8-beat comb line is what tears v3 on
  CyborgNinja (the line itself flips lattice on ~30 % of its 8 s windows there). So the line is one more gated phase measurement
  (R_LINE 0.08²) and, first, a vote: 7 of the last 8 clear lines more than 0.3 beat from the clock's line move it onto the comb's,
  always forward (the count never steps back). 3 consecutive flipped CyborgNinja 4 times in 40 s (p90 72 ms); 7 of 8 never
  flips it and still puts WhoLikesToParty on the comb's lattice within its first bars. The sweep (11 knob variants × 4 tracks):
  R_LINE off loses 20–65 ms on two tracks; LINE_N 5 flips CyborgNinja; CLUTTER 3 triples SeeYouDrop's lock time; the rest ±3 ms.
- **What it measures to (T.3, page `&map=0&lead=0` det, heard time):** lag +2 / +179 / +7 / +11 ms with jitter p50/p90 6/19 ·
  1/3 · 2/6 · 7/25, `beatPcm` F 0.97 / — / 0.96 / 0.94, lock 7.6 / never / 10.9 / 6.1 s (v3: −4 / −66 / +3 / +9, 8/32 · 93/247 ·
  4/11 · 10/92, F 0.91 / 0.14 / 0.945 / 0.77, 10.5 / never / 8.0 / 6.1). Through SeeYouDrop's drop 1 p90 1–6 ms against v3's
  46–62. CyborgNinja's +179 is the OTHER lattice, exactly half a beat, stable to 3 ms: the truth's downbeat rests on a 9 %
  low-band margin, the comb's on 70 % of its windows — undecidable from the audio; the stable line is the useful one.
- **The switch, and what it keeps.** `&clock=pcm` under #test, `CARD.setClock('pcm' | 'v3')` live, `ENGINE.CLOCK.src`: the stage
  (after 'ears', before bars / drums / build / queue and the lead) writes the PCM clock's RAW values (at the analysers' time,
  heardT − LEAD.L) into `bpm` / `beatPhase` / `beat` / `beatCount`, so everything downstream rides it through the lead exactly as
  it rides v3's; v3's own values come back at the top of the next frame (`ENGINE.restores`, beside the lead's), so the PLL and
  the comb never see the swap. A whole-beat offset k is set AT THE FLIP so the swapped-in count matches v3's to within half a
  beat: the line moves, `beatCount` and the bar phase (which the stages hold in count units) do not. k set at lock time instead
  was measured and rejected: the count jump under the anchored stages put the bar line 2 beats off for 50 s.
- **Do the predictions improve? Yes, where the clock was the limit.** With the switch on, CyborgNinja's predicted hits go from F
  0.33 / 0.33 / 0.43 to 0.70 / 0.68 / 0.86 (P 0.95–1.00), `nextKickIn` 0.36 → 0.72 with a quarter of the jumps; WhoLikesToParty
  +0.05 / +0.02 / +0.05; every release-lag p90 tightens. SeeYouDrop reads −0.02…−0.06 — the bar phase, not the clock: the
  stages' bar line is the count's mod 4 wherever synapse is not sure (0–30 % of frames outside 60–90 s), v3's count from t = 0
  lands on the truth downbeat by the accident of a track that starts on one, the PCM clock's own cold-start count lands 2 beats
  off (`nextBarIn` 0.87 → 0.63). With the same bar phase under both (node, `CLOCKKOFF=14`) the PCM clock wins on SeeYouDrop
  too (0.470 / 0.585 / 0.532 vs 0.465 / 0.586 / 0.524, `nextBarIn` 0.94 vs 0.87) and by more on WhoLikesToParty (0.611 / 0.557 /
  0.723). No live start is at t = 0, so v3's luck is not a property the A/B has. Malicious predicts nothing either way; its
  `nextBeatIn` goes 0.72 → 0.91.
- **Cost, on the main thread:** 0.17 ms per frame in the headless page (`CARD.ENGINE.CLOCK.cpuTotal / frameN`: the mono mix, the
  FFT per hop, the flux, the ring, the filter, the pending scan; node 0.09 against the ears' 0.12) — under the 0.2 target,
  where the PCM bus and the ears' onsets already are. A worklet would have to re-derive the ears' onsets or ship them back.
- **Proofs (T.4):** check 0 fail, `npm test` + `test_clock.js` (13 checks: lock 4.5 s, phase 2.0 / 3.5 ms, a 128 → 132 ramp
  within 0.48 BPM, 6 s of silence coasted within 21 ms, the outlier, the lattice, bit-identical runs); parity fake 72 fields 0
  diff (the `nav.*` rows red as since 22eb969); the bundle 1299 KB / 148 modules clean from `file://`; additive: SeeYouDrop
  whole-track det traces from a `git archive 4a1e24c` tree against this tree `cmp`-identical on the 32-field default set
  (`22bfb9e9`), its `&lead=0` twin (`01d9c307`) and an 80-field set (`25107502`); page = node on the PCM fields (2.4e-4) and,
  under the switch, on `predKickIn` / `nextKickIn` (5e-5); the switch flips the published clock headless on the real page
  (`bpm === bpmPcm`, `beatPhase === beatPhasePcm` to 1e-14, the count continuous) and back. Found on the way: v3 is not
  deterministic run to run at the 1e-8 level HOURS apart (its `regularity` at the first comb estimate moves by 4e-7; on
  CyborgNinja's torn cold start that becomes a different lock, −87 vs −66 ms) — three runs within one hour on two trees are
  bit-identical, so the code is deterministic and something in the decode or Chrome's state is not. The A/B for the user is
  the switch itself on the capture page (`CARD.setClock('pcm')` on TORUS2 / NAV, back with 'v3'; AUDIT T.4 has the caplag
  command); the audible run is the orchestrator's. Not tagged, not pushed. Default 'v3' until the user's word.
- **Open:** the bar phase is the count's mod 4 wherever synapse is not sure — a bar-line source of its own (the store's fingerprints,
  the low-band-on-beat test the truth tool uses) would end the from-0 luck for both clocks; the stages hold `a` in count units
  and would not survive a count jump (why k is set at the flip); CyborgNinja's lattice needs a musical rule (the truth's own
  is a 9 % margin); a published-line bleed (v3's 0.18 s) is a knob to add if the user's eye reads the cold start's steps (0.7 %
  of frames > 5 ms, 58 of 66 in the first 10 s) as a twitch; mic / capture not re-measured with the switch (the caplag command).

**§56 addendum — the publish time is heard time smoothed onto the frame clock (2026-09-30, after the audible capture run).** The
orchestrator's two capture runs (SeeYouDrop 0–110, sync 27) had the PCM clock winning live (lag +1 vs +11 ms, jitter p50/p90 4/11 vs
9/53, beat F 0.949 vs 0.876, pred kick F 0.30 vs 0.19, `nextBeatIn` P 0.95 vs 0.79) — but `queuecheck` read the count-downs jumping
1479 / min under it (v3 3.2). The cause was not a held state: the clock WAS extrapolated to heardT (its phase advance minus heardT's
advance reads 0.00 ms p50 on the trace) — heardT itself steps in whole render blocks in capture (10.7 / 21.3 ms per 16.7 ms frame,
p10 / p50), and v3, integrated on the frame's dt, does not follow it (its advance 16.1 / 16.7 / 17.0 ms; the ruler's "one frame's
worth" is the median 21.3). So `features-clock.js` now evaluates the clock at `now` + the median of (heardT − now) over the last
64 frames (lead.js's device; a jump > 0.1 s re-seats it): the same beat position on average, advancing evenly per frame on the
glass. Replayed on the capture trace's heardT this advances 16.7 / 16.7 / 16.7 ms per frame with 0 % of frames off by > 10 ms
(42.9 % before). In det mode heardT − now is a constant, so nothing moves: the 25 s det page traces are bit-identical to the ones
before on v3 (`bpm` / `beatPhase` / `regularity` / `kickEvt` 0.00) and page = node on the PCM fields (`beatPhasePcm` 2.4e-4,
`predKickIn` / `nextKickIn` exact under the switch). A real-time file trace (`RT=1`, 0–60 s, heardT smooth there: dt 15.9 / 16.6 /
17.5) reads the PCM clock's advance 16.6 / 16.7 / 16.8 ms per frame (v3 16.3 / 16.7 / 17.1) and 5 count-down jumps after 10 s
(28–37 ms Kalman corrections while the intro settles; 42 / min over the whole minute is the cold start). The capture re-run is the
orchestrator's.

**§56 addendum 2 — the audible capture runs (2026-09-30).** SeeYouDrop in tab capture, PCM clock vs v3 (AUDIT Step 6 addendum 2):
beat line +0 / 6 / 14 ms (med / p50 / p90) vs +11 / 15 / 45, jitter 6 / 14 vs 9 / 53, beat F 0.938 vs 0.876; the predicted kicks on it
F 0.38 (P 0.66) at +4 ms vs 0.19 (P 0.34) at +25; `nextBeatIn` P 0.92 vs 0.79, drops 14 / 8 beats ahead both. The A/B for the user is
the live switch (`CARD.setClock('pcm')` / `'v3'`); the default stays v3 until their word. Not tagged, not pushed.

**§56 addendum 3 — the PCM clock is the default (2026-09-30, the user's stream-mode A/B).** "B really seems to handle the double
time as it builds before drop better; default and tag what has been done so far." `CLOCK.src = 'pcm'`: `bpm / beatPhase / beat /
beatCount` publish the PCM clock for every stage and scene; `&clock=v3` / `CARD.setClock('v3')` is v0.19's clock. Proofs: check 0
fail, npm test OK, feats appendix regenerated (188 fields); the fake timeline never runs the clock stage, so s0 f360 / f840 md5
`fb74fee4` / `8a0715df` unchanged; a SeeYouDrop det trace (`&map=0`, 20–40 s): `clockPcm` 1 on 1201 / 1201 frames, `bpm ==
bpmPcm` on all, `beatPhase` vs `beatPhasePcm` within 1.4e-14, conf median 0.93, ENGINE.ms 0.09–0.14.

**v0.20 tagged locally (2026-09-30) on the user's word ("default and tag what has been done so far"; deploy still held):** v0.19 +
live step 6, the beat clock on the PCM bus (§56) as the default clock. All six steps of the live plan (§49) are in. `releases/
retinarave-v0.20.html` (1301 KB, 148 modules; from `file://` 348 frames in 6 s, errs [], nonFinite [], clock pcm), package.json
0.20.0. Not pushed (retinarave.com serves v0.15).

## §57 DUST, pass 1 — the legibility overhaul: on the grid, three transient voices, real tension, formations as sections (2026-09-30, one worker; `DUST-OVERHAUL-SESSION-PROMPT.md`, report `docs/workers/DUST-OVERHAUL-PASS1.md`)

**The ask** (the user, 2026-09-30): *"lets go one scene at a time; start with DUST (can do a full overhaul in place, not
limited to whats new)"*, against a brief that is now **the acceptance standard for every scene**: a viewer with the sound off
should be able to roughly reconstruct the song's structure · transients sharp, fast-attack / slow-decay, from band-limited
onset detection · bands mapped to distinct visual behaviours so instruments are separable · motion phase-locked to the beat
grid, emphasis on downbeats and phrase boundaries · a tension accumulator that visibly tightens through builds and releases
all at once on the drop · timbral novelty gets a new voice, sustained sounds habituate · preserve dynamic range · zero
perceptible latency, nothing moves without an audible reason. Pass 1 is four steps, each measured and committed with its
numbers; pass 2 (dynamic range against the track's peak, per-bin habituation, harmony) is next session.

**What DUST was.** 20k–150k `gl_VertexID` grains, each owning one bin of the 256-bin log spectrum and pushed out by it
(the core idea — kept). Four formations cross-faded per grain, Hopf-fibre rings threaded through. Fifteen fields, and **no
beat grid at all**: `flow`/`flowMid`/`flowBass` drove every rotation, the 64th kick re-poured to a random shape, `tension`
(which is v3's ROUGHNESS) shrank the cloud, and there was one drum channel and no snare.

**The ruler, because there was none.** `filetrace.js` records MS and MS says nothing about what a scene did with it;
`probe.js` reads the canvas but needs a real window. New **`tools/dust-trace.js`** (HARNESS "Scene ruler on a real track"):
forces the scene on the deterministic live-on-a-file path (`#test&track=<T>&at=<t0−WARM>&map=0&scene=1`, `CLOCK=1 GPU=1`),
registers its own rAF after the loop's, and records per frame the COMPOSITED framebuffer's luminance (whole / centre 20 % /
60–90 % rim) beside the MS fields and every number of the scene's new read-only `hooks.dinfo()`. Reference window
SeeYouDrop 20 → 110 s at `at` 0 (5401 frames, both drops and the 16 bars before each; the detector needs 32 s of history
before it can arm, §54); control CyborgNinja 20 → 80 s. Two runs are bit-identical.

- **Step 1, on the grid (`3425e5a`).** One angle: `spin ← ease((2π/32)·(beatCount + ½·barIndex), τ 0.22 s)`, the target read
  off the COUNTS so it cannot drift (TORUS2's rule, §36), `barIndex = round((beatCount + beatPhase − barPos)/4)` so the
  downbeat is synapse's bar line and not the count's mod 4. Torus turn ×0.7, galaxy winding ×0.9/(r+.35). Measured:
  **0.2207 rad/beat over 225 beats against a design 0.2209** — no drift in 90 s; spin velocity p05 0.192 / p50 0.487 / p95
  1.088 rad/s, **peak/mean 2.28** (a steady spin would be flat); the downbeat advances **0.1791 rad** in its first 200 ms
  against **0.1320** for the other three. The 64-kick re-pour is gone: a change lands on a phrase wrap or `barNovelEvt`,
  never on a kick count — **16 changes in 90 s, every one on a seam**. corr(lum, lvl) 0.469 → 0.592, eS 0.407 → 0.601,
  bassS 0.356 → 0.558, highS 0.093 → 0.431.
- **Step 2, three transient voices (`5a5f857`), and the measurement that shaped them.** The spec pairs `kick2`/`kickAge`,
  `snare2`/`snareAge`, `hat2`/`hatAge` — **they are not always the same onsets.** At every rising edge of the level the
  matching age reads p50 **+7 ms** (kick, p90 1720, 4 of 224 edges with no fresh age), **+101 ms** (snare), **+92 ms** (hat):
  the v2 kick IS the ears' low lane (§51), the v2 snare and hat are synapse's and the ears' are a different picker. So each
  voice keeps its OWN age, reset by the level's edge and seeded from the engine's age only within 40 ms of it — the
  sub-frame placement where it is real, never a motion started 100 ms late (now a rule in CONTRACTS §1.18). The three are
  separated by the BAND a grain owns: `wLow` the kick's outward shove and the sub's swell, `wMid` a NEW voice (a flash ring
  launched at the centre on every snare, travelling out at 3.4 units/s), `wHigh` the hat sparkle. Peak luminance lift at the
  hit: kick **+6.1 → +9.5** (p90 +15.4 → +26.3, 223 hits), snare **+8.1 → +11.0**, hat **+4.3 → +8.3**; the picture's own
  motion |Δlum| per frame p50 **0.79 → 1.34**, p99 **6.08 → 11.22**; corr(lum, kick2) **−0.12 → +0.07**. A first, timider cut
  was measured and rejected (kick +7.1, hat +7.1).
- **Step 3, real tension (`9bc2b3c`).** `tension` is v3's roughness and sits at 0.42 through SeeYouDrop's groove, so the
  cloud was permanently ~8 % small for nothing audible and did not move into a drop. The build is the VOID, `buildLive`
  (§54): it arms 5.6 s before drop 1 (reaching 1.00) and 3.2 s before drop 2 (0.75), **never on CyborgNinja**. It pulls the
  cloud in −30 %, thins the torus's tube from `.38+.2·bassS` to a .06 wire, draws the fibre rings in 32 % and drains the
  palette (sat ×(1−.55b), spread ×(1−.35b) — the rings share the mood object, so they drain too); `dropLiveEvt` releases it
  all at once over 0.55 s with a +17 % overshoot and leaves `dropEnv`'s fling alone; `tension` is jitter and nothing else.
  **`nextDropIn` was measured before it was used and is NOT a runway**: while armed it never points further than one bar
  ahead (1.56 s at the arm, 529 armed frames), because it is the count-down to the bar LINE — so it winds the last bar up
  (+0.3 of the contraction over 1.7 s) and claims nothing more. Drop 1: contraction 0 → **0.85** (peak 1.25) → 0.09,
  saturation 0.66 → **0.34** → 0.71, the slam **+171.7 % → +181.9 %**, lum through the void **+23.3 % → +8.1 %**. Drop 2:
  the slam **+168.9 % → +194.2 %**, lum through the void **−15.2 % → −36.6 %**.
- **Step 4, formations as sections (`fff7569`).** `buildLive > .35` → torus · no sub and `denK < 1.6` → ribbon (a lone
  voice) · `eM < .74` → sphere (quiet for this track) · else galaxy; asked only on a seam, so it cannot chatter, and the
  drop bursts the torus into the galaxy. **`eM / eMax` was tried first and is useless**: `eMax` is the loudest `eM` seen
  lately and follows it (ratio p05 0.700, p25 0.972, p50 1.000), and `lvl` is worse — the AGC flattens it. The absolute `eM`
  (0.30 → 0.88 through SeeYouDrop's intro), `subGate` (0 for the first 12 s) and `denK` (0.5–1.5 intro vs 2.0–2.3 groove)
  are what separate. **The returns say THAT, not WHICH**: `sectionAlt` never repeats on either track (2→3→4→5, 1→2→3) and
  `sectionReturn` is 0 for all of SeeYouDrop while `barReturnEvt` fires twice — so the memory is keyed on `sectionAlt` as
  the contract says and falls back to the last shape filed under a different section (CONTRACTS §1.11 now carries the
  caveat). The sequence on SeeYouDrop is the song: galaxy → **ribbon 50.1** (the sub leaves) → **torus 55.9** (the void) →
  **galaxy 57.6 (THE DROP bursts it)** → ribbon 101.3 → torus 104.5 → **galaxy 105.6 (THE DROP)** → sphere 107.7; **7
  changes against 16 at random**, dwell galaxy 75.9 s / ribbon 8.9 / torus 2.8 / sphere 2.3 (before, at random: 25.5 / 25.7 /
  20.2 / 18.5). With the picture no longer churning a shape a phrase, the slam reads **+347.1 %** (drop 1) and **+234.1 %**
  (drop 2), lumC/lumR through drop 1's void goes 0.834 → **1.713**, and the centre's peak lift is kick **+10.9** (p90 +50.3),
  snare **+14.0** (p90 +50.5), hat **+9.4** (p90 +44.4). **The trade, stated:** whole-frame |Δlum| p50 1.32 → 0.93 and the
  window's p95/p05 2.95 → 2.54, because sixteen pours a minute were themselves much of the old motion and range. What is
  left is the music's.

**The control.** CyborgNinja 20 → 80 s, no drop: **0 formation changes** (dwell galaxy 60.0 s; the old 64-kick counter would
have given ~2), `buildLive` never armed, so no contraction, no drain, no release — the scene invents no structure. And the
drums read better there than anywhere: the kick's peak lift in the centre **+13.4 → +18.7** (p90 +39.4 → +51.6, +7.5 % →
**+19.6 %** of the pre-level), corr(lum, kick2) **0.035 → 0.241**, whole-frame |Δlum| p50 1.72 → 1.19 while the CENTRE's goes
2.15 → 2.38: on a track that is one long groove, what moves is now the drums.

**Cost — it got 13 % CHEAPER** (`CARD.bench(1,300)` interleaved with NAV, `q` pinned 0.95, tier 3, first call discarded,
three pairs, machine otherwise idle): DUST **1.181 → 1.023 ms**, NAV 1.795 → 1.821 in the same pages (ratio 0.658 → 0.562).
The reason is fill, not luck: `hat` and `kick` used to enlarge EVERY grain (`+uHat·h.y·1.2 + uKick·.5`), so a hit was a
whole-cloud overdraw event; the new voices enlarge only their own band (`wHigh` ~28 % of grains, `wLow` ~43 %). No Q trace:
the cost did not rise.

**Proofs.** `check` 0 fail · `npm test` OK · the full eleven-scene `scene-md5.sh` list against
`tools/accept/v0.14/scene-md5-v014.txt` differs on **exactly three lines**: s1 f360 `c6166af9` → `6696c6eb` and f840
`7ca6598c` → `01143b8d` (this session), and the two pre-existing ones from `22eb969` / §54 addendum 2 — s0 f840 `7225ea02` →
`8a0715df` (recorded there) and **s4 f840 `be2e3c8d` → `05bf21c0`, which §54 addendum 2 did NOT record**: s4 is NAV's DRUM
variant and renders through NAV's `draw`, so NAV going onto the live detector moved it exactly as it moved s0. Everything
else is byte-identical. Per step, s1: f360 `c6166af9` → `7c824cd1` → `910e95f7` → `6696c6eb` → `6696c6eb` (step 4 moves
nothing at frame 360: no seam that early on the fake timeline) · f840 `7ca6598c` → `479410ba` → `bb1540c6` → `30d06982` →
`01143b8d`. The per-beat montage `tools/work/d/syd-d1.jpg` (50 → 62 s across drop 1) reads breakdown → void → slam → groove.

**Open, in the report:** a grain's BAND is not its POSITION in the sphere and ribbon formations (it is in the galaxy, where
`r = sqrt(h.x)`), so the three voices are separated by colour family there rather than by place — a band→radius bias would
fix it and would change all four shapes, so it is the user's call, not pass 1's; `post.fb.decay` 0.95 (the highest in the
set, half-life 0.22 s = most of a beat) is the knob to reach for first if the user reads the transients as soft; the window's
p95/p05 fell 2.95 → 2.54 because sixteen pours a minute were themselves range, and pass 2's `eM`-against-the-track's-peak is
where it returns; three thresholds are fitted on two tracks; the return path could not be exercised; no audible run was done
(the worker's brief forbids it — the one capture run is the orchestrator's).

**Not tagged, not pushed, not deployed**; the A/B for the user is `releases/retinarave-v0.20.html` from `file://` against the
dev server, key 2, the same track, in stream mode.

### §57 addendum — the audible capture run, and `FRESH` 0.04 → 0.06 (orchestrator, 2026-09-30)

The one audible run: `PORT=8830 HASHX='&scene=1' FIELDSX='kick2,kickAge,…,eM,denK' node tools/caplag.js track SeeYouDrop 40 72 27`
→ `tools/work/caplag/SeeYouDrop-cap-sync27-scene-1-fx.json`, 4443 frames, listener time 38.96 → 113.05 s, fits 4.2 / 2.9 ms rms.
(Grader's trap, recorded so nobody chases it again: `barPos / phrase16Pos / kickAge / snareAge / hatAge` are already in caplag's
FIELDS, so naming them in FIELDSX INTERLEAVES a second copy — 8886 values for 4443 frames; take every other one. Read raw it looked
like `kickAge` never reset; de-duplicated it resets 121 times for 120 logged kicks.)

- **Drop 2 in listener time:** `dropLiveEvt` at 105.685 s = **+85 ms** after the truth (det path +17); `buildLive` armed **2.78 s**
  before (det 3.2); `barNovelEvt` 98.5 / 101.71 / 106.5, `barReturnEvt` 98.5 / 106.5. **Drop 1 was not seen** — the run started at
  40 s and the detector had 17.6 s (~11 bars) of warm-up; the earlier captures from 0 s armed 5.6 s before it (§56). Warm-up, not DUST.
  `buildLive` never rose between the drops (0). 181 beats over 74 s = 146.6 BPM read (truth 150: the clock's start-up).
- **The voices' seed on the capture path.** At each level's rising edge (≥ 0.18, +0.02) the engine's age of the same class reads:
  kick2 / kickAge **<40 ms 51, 40–60 32, >120 101** (of 184 edges; 120 logged kicks — the level chatters), snare2 / snareAge **<40 0,
  40–60 87, 60–80 21, 80–120 5, >120 32** (145), hat2 / hatAge **<40 0, 40–60 150, 60–80 29, 80–120 25, >120 57** (261). The det path
  had put kick p50 at +7 ms; capture puts every class one heard-time step later, in the 40–60 band — exactly past `FRESH = 0.04`, so a
  live hit's voice started from age 0 on its frame, ~45 ms late to the ear, for ALL snares and hats and a third of the kicks.
  **Lean: `FRESH` 0.06.** No two logged kicks were within 80 ms (0 of 120), so 0.06 cannot seed from the previous hit; 60–80 stays
  unseeded (the different-picker cases the worker measured at p50 +101 / +92 on det). The fake-timeline s1 md5 is **unchanged**
  (`6696c6eb` / `01143b8d`: no det age falls in the band), `check` 0 fail. Live-only change, by design.
- Nothing else in the capture contradicts the det numbers; the scene ran the whole window with `errs []`.

**v0.21 tagged locally (2026-09-30) on the user's word ("tag what we have so far"; deploy still held — "don't deploy yet"):** v0.20 +
the DUST overhaul pass 1 (§57 + addendum, `FRESH` 0.06). `releases/retinarave-v0.21.html` (1326 KB, 151 modules; from `file://`
on scene 1: errs [], nonFinite [], clock pcm), package.json 0.21.0. Not pushed (retinarave.com serves v0.15). The user's first look:
"Overall it is looking good, but something still feels out of sync. Visuals almost seem slow to register on the beat" — the
accuracy review is next (§58).

## §58 DUST, pass 1.5 — a grain's band is its place, and the accuracy review (2026-09-30, one worker; report `docs/workers/DUST-OVERHAUL-PASS1.md` "Pass 1.5")

**The ask** (the user, after the pass-1 A/B in stream mode): *"Overall it is looking good, but something still feels out of
sync. Visuals almost seem slow to register on the beat"* — plus §57's own open item 1 (a grain's band was not its position
in two of the four formations). Two tasks, each measured on the deterministic path (`#test&track=SeeYouDrop&map=0`,
`CLOCK=1`, 20 → 110 s = 5401 frames, control CyborgNinja 20 → 80 s) and committed with its numbers. **Not tagged, not
pushed, not deployed.**

New in the ruler: `tools/dust-trace.js` records a fourth zone, `lumM` (the 25–55 % BODY annulus, where the snare's ring
travels), and DUST has a test hook `&form=<k>` that pins the formation so one shape can be measured at a time.

### Task A — a grain's band is its place (`fc590c0`)

The rank of the bin a grain owns (`h.x`, uniform on 0..1 and monotone with `fx`) is now its distance from the centre, and
each shape maps that rank the way its own DIMENSION keeps its density even: **the galaxy's `sqrt(rank)` is uniform per unit
AREA and is untouched** (the shape the brief said to match), a ball is uniform per unit VOLUME at `cbrt(rank)`, a line is
uniform per unit LENGTH at the rank itself, and the torus's tube is flat in its own angle so the rank goes straight onto it
— the low bins ride the tube's INNER wall (R − r), the highs its outer wall (R + r). Every shape's density is therefore
unchanged; only which grain sits where is. The ribbon samples the waveform where the grain actually is, so it is still
literally the waveform.

Two things that only broke once a band meant a place, both found by geometry and fixed in the same commit:

- **the snare's ring was launched at the ORIGIN.** With the mid band a shell at radius r0, a front expanding from nothing
  does not reach it until r0 / 3.4 — from the shader's own condition (`|R − ringR| < 0.83·ringW`), **0.24 s in the sphere
  and 0.21 s in the torus after the hit**, and that was true of the OLD sphere too (a hollow shell at 1.05). It is now
  launched ON the band (`formations.js MIDR = 0.89 / 1.21 / 1.36 / 1.14`, mixed through a pour) and travels out from
  there: **0 ms in all four shapes**; the body's luminance clears +2sd at p90 161.7 → **119.7 ms** after the truth onset.
- **the kick's shove was a fixed half a unit**, which is most of the core's own radius — a kick EMPTIED the core out of the
  middle of the frame. It is now in proportion to where the grain is (`.5·(.3 + .7R)`), so the core swells instead.

Measured with the formation pinned (SeeYouDrop 30–60 s, clean hits only — no other voice within 100 ms — peak lift as % of
that zone's own pre-hit level): **sphere** kick centre/rim 5.3/3.9 % → **4.9/2.6 %** (C/R 1.36 → **1.91**) · **torus** hat
centre share 27.3 → **15.6 %** and body share 29.0 → **46.9 %** · **ribbon** hat rim share 51.8 → **61.7 %**, the kick's
centre lift 7.6 → 8.4 % · **galaxy** unchanged by design (kick C/R 1.44 → 1.39, hat rim share 89.6 → 88.6 %).

**Stated, not hidden:** the torus's KICK moves from the centre to the body and rim (C share 35.6 → 23.1 %), because a
doughnut's "inward" is the inner wall of its tube at 31 % of the frame — its centre is a hole and nothing can be there; and
a ball's shell projects onto the whole disc, so the sphere's separation is real in three dimensions and diluted in two.
Cost flat (`CARD.bench(1,300)`, tier 3, q 0.95, three pairs interleaved with NAV: DUST 1.131 → 1.112 ms).

### Task B — the accuracy review, in ms (`b93ef4f`)

| what | was | now |
|---|---|---|
| the beat nudge, 50 % of the step | 167 ms | **50 ms** |
| the beat nudge, 90 % of the step | 417 ms | **183 ms** |
| of the step done when the next beat arrives (400 ms at 150 BPM) | 84 % | **98 %** |
| the snare's voice, coverage of the truth's mid onsets | 54 % | **85 %** |
| the snare's envelope, p90 after the truth onset | +196 ms | **+128 ms** |
| the hat's voice, coverage | 85 % | **96 %** |
| the hat's envelope, p90 | +87 ms | **+79 ms** |
| the kick (`kick2` IS the ears' low lane — nothing to win on det) | 85 %, +16 ms | 85 %, +16 ms |
| the snare's ring reaching the body (sphere) | 0.24 s | **0 s** (task A) |

1. **The nudge is a shaped impulse.** One exponential with τ 0.22 s had its peak VELOCITY on the beat but put only half the
   step on the screen 167 ms later, so the cloud was still travelling when the next beat came and the eye read a glide.
   Now τ 0.055 s until less than 18 % of the step is left, then 0.14 s to settle. The picture is STILL between the nudges
   (spin velocity p50 0.486 → **0.121 rad/s**) while the peak more than doubles (p95 1.059 → **2.854**). The target is
   still read off the beat COUNT, so it cannot drift.
2. **The attack fires on whichever detector hears the hit first** — the ears' event (`kickEvt` / `snareEvt` / `hatEvt`) or
   the v2 level's rising edge — with a 60 ms refractory per voice. **This corrects §57: neither detector is late.** Graded
   against the truth by `tools/truth/drumcheck.py` on the same window, the matched hits read ears **+3** / v2 **+4** ms
   (kick), ears **+0** / v2 **−13** (snare), ears **+2** / v2 **−11** (hat). §57's "+101 ms" was the last ears' snare being
   a DIFFERENT onset from the one the level was confirming, not a lag. What the two do is MISS different hits — recall ears
   0.35 / v2 0.50 (kick), **0.71 / 0.50** (snare), 0.82 / 0.70 (hat) — so the union buys COVERAGE, which is what the user's
   own A/B said the eye reads as in sync (memory `feedback_reactive_over_predicted`). **The event only PLACES the hit; the
   level still SIZES it** — the ears' velocity saturates (§51: `kickVel` p50 1.0, "the uniform brightness of the predicted
   route"), so `kickVel` / `snareVel` / `hatVel` are NOT read: a fire starts at the floor and the level raises it without
   moving the age, so a hit the level never confirms costs a flicker, not a flash. Attacks per 90 s: kick 261 → 261, snare
   152 → **319** (297 truth mid onsets), hat 250 → **379** (295 truth high) — the snare now matches the truth's own
   density, the hat fires 1.28× it.
3. **The trail: `post.fb.decay` 0.95 → 0.88.** 0.95 is a 0.22 s half-life on the encoded picture — most of a beat at
   150 BPM, so the last hit's ghost was still a third of its size when the next one landed (§57's open item 2, "the first
   knob to reach for"). Measured over SeeYouDrop 30–60 s at 0.95 / 0.88 / 0.85: per-beat peak/trough **1.261 / 1.431 /
   1.470**, the rim 1.323 / 1.545 / 1.575, |Δlum| per frame 1.40 / 1.72 / 1.74, mean luminance 117 / 96 / 92. 0.88 takes
   nearly all of the contrast for the least light; 0.85 is TORUS2's own.

**Everything else DUST could smooth was measured and is zero or deliberate:** all twenty `m.*` copies in `index.js` are
direct assignments (no EMA between MS and the uniform); `this.rt.time = MS.flow` is musical time; the voices' attack is
instant and only the DECAY has a τ (0.24 / 0.30 / 0.09 s); the slow envelopes are slow on purpose (`buildLive` 0.35 s, the
last bar's wind-up 0.12, the sub's gate 0.28, the drop's release 0.55 — all with instant attacks on their events); the
fibre rings read `build` / `drop` / `rel` / `vk` with no filter of their own; the camera's dolly rides `bassS`, an engine
band follower. The spectrum texture the grains are pushed by is peak-hold with a 0.11 s RELEASE and an instant attack
(`synapse/analyzer.js`), so nothing is smoothed on the way in either.

**Whole window, before → after (SeeYouDrop 20–110 s):** per-beat peak/trough lum 1.189 → **1.319**, centre 1.284 → 1.386,
rim 1.231 → **1.400**; |Δlum| p50 1.11 → **1.54**, p99 10.15 → 17.38; the window's own range p95/p05 lum 2.80 → **3.24**,
centre 3.70 → 4.30, rim 2.82 → **3.71** (§57's open item 3 — the dynamic range is back and past where it was); the mean is
14 % darker (121.0 → 103.9); the shape sequence is untouched (10 changes, the same ones). **The one number that got
worse:** the drop's slam, drop 1 +392.3 → +383.1 % but drop 2 **+117.2 → +88.5 %** — a shorter trail accumulates less over
the burst. Kept, because the range over the whole window went UP and the brief's own measure is that a viewer can read the
song, not that one frame is bright. Control CyborgNinja: still **0 formation changes**, no build, per-beat peak/trough
1.229 → 1.350, hat coverage 94 % both ways.

### Engine-side, for the orchestrator — measured here, NOT changed (no engine file touched)

- **The beat clock's own offset against the truth beat grid.** SeeYouDrop, file-det: **−35.7 ms** (p10 −43.3, p90 −28.5) —
  the det lead net of the 40 ms display lead, i.e. the count increments 36 ms BEFORE the audible beat. Harmless while the
  nudge took 417 ms to land; now that it lands in 183 ms the eye sees the clock's offset directly, so it is worth knowing
  that in stream mode (`dispNow()` 0, §53) that −36 ms becomes roughly 0 and the capture path's own +27 ms (CONTRACTS
  §1.18) is then the whole of it.
- **CyborgNinja: the PCM beat clock sits +146.8 ms off the truth grid** (p10 −45.0, p90 +155.1 — locked to the OFF-BEAT for
  most of the window, 159 of 160 beats matched). Every beat-locked motion in every scene is a third of a beat out on that
  track. A clock item (§56), not a scene one.
- **The ears' and synapse's mid/high pickers disagree about WHICH onsets** (recall 0.71 vs 0.50 on the snare, precision
  0.68 vs 0.93). A scene can only take the union, as DUST now does; a better mid picker is an engine job.
- **`snare2` / `hat2` are synapse's hits held by `max(0, ahead − SYN_DELAY)`** (`drums/drums.js`): in capture `ahead` ≤ 0,
  so nothing is held and they arrive with synapse's own 31 ms confirm delay after the analyser sees them.
- The 40 ms display lead is file-mode only (§53) — recorded again because it is the largest single number in the chain and
  the user watches in the mode that has none.

### Proofs

`check` 0 fail · `npm test` OK · `CARD.bench(1,300)` tier 3 (150k points), q pinned 0.95, first call discarded, three pairs
interleaved with NAV in the same page: DUST/NAV ratio 0.794 (HEAD) → 0.758 (task A) → 0.813 (task B) — flat inside the
run-to-run spread. s1 fake-timeline md5 **f360 `6696c6eb` → `0526245e` → `a73fbe67`, f840 `01143b8d` → `123033ed` →
`35fe02c6`** (per task). Against `tools/accept/v0.14/scene-md5-v014.txt` the only other lines that differ are the two
pre-existing ones (s0-f840 `7225ea02` → `8a0715df`, s4-f840 `be2e3c8d` → `05bf21c0`, both from `22eb969` / §54 addendum 2)
and s11, which post-dates that list; s2, s3, s5, s6, s7, s8, s9, s10 and s0-f360, s4-f360 are byte-identical. `help` moved
to `assets/scenes/dust/help.js` (index.js was one line over the 350 soft cap) — data only, not a word changed by the move.
No audible run (the worker's brief forbids it): every number above is the deterministic file path.

**Look changes the user may notice beyond the two tasks:** the picture is ~14 % darker and its trails are much shorter
(the decay); the sphere is a filled ball instead of a hollow shell and every shape is now colour-graded from the core out,
because a grain's band is both its hue and its radius; the doughnut's tube no longer rolls on mid time (a slow breath
instead), since the roll would have scrambled the band ordering around the tube.

## §59 the beat clock's half-beat lattice — the low band decides it, and CyborgNinja comes onto the beat (2026-09-30, one worker; the miss found by §58's accuracy review, `docs/AUDIT-live-grid.md` "Step 6 addendum 3")

**The miss** (§58, `docs/workers/DUST-OVERHAUL-PASS1.md` "Pass 1.5", its engine-side list): on CyborgNinja the DEFAULT beat clock —
the PCM clock, §56 addendum 3 — sits **+146.8 ms** off the truth beat grid with 159 of 160 beats matched, so every beat-locked
motion in every scene is out on that track. Re-measured here on the page's det path (`#test&track=CyborgNinja&map=0&lead=0`,
`CLOCK=1`, the whole track, `gridcheck.py --heard`): **+179 ms, |lag| p50 179 p90 181, jitter p50 1 p90 3, `beatPcm` F 0.004, never
locked** — §56's own recorded number. CyborgNinja is 160.0003 BPM, so half a beat is **187.5 ms**, and the ears' kicks sit +4 ms
after the truth beat: +179 is the OTHER LATTICE, held to 2 ms for 180 s. Not a drift, and not the "third of a beat" the review read
— §58 measured the same line through the 40 ms file-mode display lead (146.8 + 40 = 186.8). SeeYouDrop's −35.7 ms in the same
review IS that display lead (§52–§53) and was left alone.

**The truth grid is right, so this is a clock miss.** §56 called the choice "undecidable from the audio … the stable line is the
useful one", on the 9 % low-band margin the truth tool recorded. Three pieces of evidence outside the low band say otherwise: the
five novelty peaks the truth tool's downbeat vote runs on (34.895, 48.02, 84.02, 96.02, 168.02 s) are **integer beats from the
grid's phase to within 1 ms** — 93, 128, 224, 256 and 448 beats after 0.02005 s — so the section boundaries land on the chosen
beat, not on the offbeat eighth; the file's first attack is at 25 ms, on the chosen grid; and the hats are stronger on the offbeat,
90 against 64, which is the classic offbeat hat (`docs/workers/truth-grid-s3.md`). Sections do not start on an offbeat eighth.

**Why the clock picks the offbeat — three measurements, no guesses.**

- **The ears' onsets cannot tell the two lattices apart on this track.** Its kicks land on every 8th. Counted within ±0.15 beat of
  each lattice: kick **236** on the truth beat against **213** on the offbeat, snare 307 / 303, hat 405 / 449; the Kalman's own
  weight (velocity / `R_CLS`) **485.3 against 477.1**. A coin flip. And the onsets are not what holds the line there: with the comb
  line's measurement off (`R_LINE` 1e9) the clock still read −185 ms. The cold start picks the lattice, the PDA gate keeps it, and
  nothing ever asks again.
- **The comb line agrees with the wrong lattice, so §56's lattice vote never fires.** `period.js line()` maximises the 8-beat comb
  on the FULL-spectrum flux (`flux + 3·bassFlux`), and this track's flux is on the offbeat hats: over its 344 clear windows the
  comb's line is half a beat off the truth's on **264 of them** (SeeYouDrop 3 of 279, WhoLikesToParty 4 of 496, Malicious 110 of
  423). Clock and comb sit on the same wrong lattice, so `LINE_N` of `LINE_W` never counts — `jumps 0` for the whole track.
- **The LOW BAND does tell them apart, on all four tracks.** The positive 40–150 Hz flux summed over the hops within 0.15 beat of
  each lattice, truth lattice against its half-beat: **CyborgNinja 1.199** · SeeYouDrop 1.299 · WhoLikesToParty 1.684 · Malicious
  1.009. Every wider band loses it — 20–150 Hz 1.178 / 1.303 / 1.614 / 1.010, 150–800 Hz 1.043 / 1.208 / 1.217 / 1.034, above
  800 Hz 1.064 / 1.101 / 1.260 / 1.039, the whole flux 1.074 / 1.124 / 1.289 / 1.035. 40–150 Hz is the truth tool's own band and
  the truth tool's own rule (`trackmap.py anchor_grid`: "the beat is the one with more 40–150 Hz onset strength on it").

**The rule — THE LATTICE CHECK** (`engine/clock/clock.js` `lattice()`, the `LAT_*` knobs). Two leaky energies of the 40–150 Hz
flux: one over the hops within `LAT_W` 0.15 beat of the clock's own beat line, one over the hops within `LAT_W` of its half-beat,
both leaking with `LAT_TAU` 90 s; `lat` is their log ratio. The two windows are the same width and they SWAP under a half-beat
shift, so `lat` is exactly antisymmetric — the clock reading its own line against the only other candidate, with no grid in it.
Read in the loop over the four tracks (t > 15 s, the move disabled; min / p50): the three lattices the clock already had right read
**+0.213 / +0.363** SeeYouDrop · **+0.054 / +0.399** WhoLikesToParty · **+0.110 / +0.151** Malicious — and that last track has NO
lattice (its kicks are uniform over the beat, DP residual 90 ms) yet still never crosses zero — while CyborgNinja, half a beat off,
reads **−0.193 / −0.167** with a maximum of −0.044. `LAT_MARG` **0.06** sits in that gap: 0.11 clear of the nearest "right"
reading, 0.11 past CyborgNinja's median. When `lat` has been past the margin for `LAT_SUS` 4 s of NET time (time inside the margin
counts back down, floor 0) and the clock is locked, the line moves FORWARD half a beat — the comb vote's own rule, so the count
never steps back — and the two energies swap with it. Three things keep the cold start out of the decision:

- **the evidence only counts while the comb is clear** (`per.clear`). Cold, the Kalman rate is dragged down by the first onsets
  before the first comb estimate lands — the page read **116 → 57 → 34 → 9.7 → 5.0 BPM over the first 2 s** — and at 5 BPM every
  hop falls inside the on-window: 2 s of one-sided energy that a 90 s leak then carries for 90 s. Without this gate the page moved
  the line at 63 s where node moved it at 14.
- **a period re-seat throws the evidence away** (`reseat()` → `latClear()`): every window measured before a tempo switch was the
  wrong width.
- **the hold is net time, not an unbroken run.** The margin is 0.06 wide, so an unbroken-run rule turned a 1e-4 page/node
  difference into tens of seconds of delay (19 s against 63 s).

One gate the other way: **the comb line's vote may not move the line onto a lattice the low band has ruled against** — `lat >
LAT_MARG` vetoes the jump. Without it CyborgNinja's full-spectrum comb line, which prefers the offbeat on 77 % of its windows,
drags the line straight back (7 of 8 windows "far" fires with probability 0.42 per window). Cold, both energies are ~0, `lat` is 0
and §56's vote is untouched.

**Before → after: the four tracks, both clocks, the page's det path** (`&map=0&lead=0`, `CLOCK=1`, `gridcheck.py --heard`, so every
lag is that clock's own error on heard time; CyborgNinja the whole track, the other three 0–120 s). "Before" is this same tree with
`CLOCKK='{"LAT_MARG":1e9}'`, which turns both halves of the rule off and gives §56's published clock exactly — a new `filetrace.js`
env (the one `clock-study.js` and `test_clock.js` already take), so a one-knob engine A/B is one run each instead of two trees.

| track | clock | beat lag med / p50 / p90 | `beat` F ±50 ms | locked | synapse bar line |
|---|---|---|---|---|---|
| **CyborgNinja** | **pcm before** | **+179 / 179 / 181 ms** | **0.004** | never | 10.7 % |
| | **pcm after** | **−9 / 9 / 13 ms** | **0.896** | **19.3 s** | 10.7 % — identical |
| | v3 (`&clock=v3`) | −65 / 144 / 183 | 0.138 | never | — |
| SeeYouDrop | pcm before | −0 / 5 / 13 | 0.959 | 7.6 s | 74.6 % |
| | pcm after | −0 / 5 / 13 — every row identical | 0.959 | 7.6 s | 74.6 % — identical |
| **WhoLikesToParty** | pcm before | +7 / 7 / 10 (jitter p90 7) | 0.906 | 10.9 s | not verified (truth) |
| | pcm after | +7 / 7 / 10 (jitter p90 **5**) | **0.949** | **5.6 s** | not verified (truth) |
| Malicious | pcm before | +10 / 11 / 27 | 0.960 | 6.1 s | tempo only (truth) |
| | pcm after | +10 / 11 / 27 — every row identical | 0.960 | 6.1 s | tempo only (truth) |

The same A/B in node over the WHOLE of each track (`tools/clock-study.js`, no browser): CyborgNinja **−184 / 184 / 186 ms, never
locked → +3 / 3 / 5 ms, locked 17.9 s**; SeeYouDrop and WhoLikesToParty traces **byte-identical** to the ones before the change on
every field except WhoLikesToParty's own improvement (lock 10.9 → 5.6 s, 97 → 99 % of frames within ±30 ms); Malicious' graded lag
identical (+22 / 23 / 34, locked 6.1 s) with its jitter p90 23 → 22 ms. v3's rows are identical before and after on all four tracks
— none of v3's code is touched and the switch still restores its values every frame.

**What moved, track by track.** CyborgNinja's line comes onto the beat 19 s in and stays there: its phase against the truth beats
then reads p10 −0.011 / p50 −0.007 / p90 −0.001 beat (−2.6 ms median), and `beatPcm` goes from matching 2 of 479 beats to 429. The
cold start costs three line moves in the first 18 s — a lattice move at 9.2 s, a comb-line jump at 12.0 s in the window where a
re-seat had just voided the evidence, the final lattice move at 18.3 s — and then nothing for 162 s. Each forward move advances
`beatCount` by up to a beat and so shifts the bar phase the bars / build / queue stages hold in count units; that is the same cost
§56 already pays on WhoLikesToParty and Malicious, and the count still never steps back. SeeYouDrop triggers neither half of the
rule. WhoLikesToParty's cold-start half-beat error — the one §56 built the comb-line vote for — is now corrected by the lattice
check at 6.0 s instead of by the vote's 8 windows, and that is where its lock time and its F come from. Malicious' two comb-line
jumps are now vetoed (`lat` sits at +0.115…+0.185 for the whole track: the low band backs the clock's own line) with no change to
its grade.

**The bar / downbeat line does not move, because it is not the clock's.** `barPos` / `beatSyn` / `barConf` / `phrase16Pos` come from
synapse's own grid (`features-synapse.js` reads `A.beat`, not the published clock), and a trace carrying them reads **every one of
those rows identical before and after** on both gradeable tracks: CyborgNinja's bar line 10.7 % of in-octave frames on the truth
downbeat (bar 1 on truth beat +1 in 70 %), its `beatSyn` +58 / 61 / 113 ms and its 16-beat line 1 of 5 section starts within a beat;
SeeYouDrop's bar line 74.6 %, `beatSyn` −39 / 40 / 60, 1 of 8 section starts, 0 of 2 drops. CyborgNinja's synapse bar line being
wrong is a separate, pre-existing miss (`docs/workers/truth-grid-s3.md` recorded 0 % in live step 3.1) and is NOT this item.

**Cost: flat.** One more accumulator inside the FFT loop that already runs, over the six bins below 150 Hz, plus ~10 operations per
512-sample hop (94 hops/s). Node microbenchmark of `Clock.push` over 60 s of CyborgNinja, best of 5, three pairs interleaved
against a `git archive HEAD` tree: **56.50 / 56.99 / 56.93 µs per hop before against 56.44 / 56.77 / 56.98 after** — 0.089 ms per
60 Hz frame either way, §56's own node figure. On the page `CLOCK.cpuTotal / frameN` over 3600 frames reads 0.205 (HEAD) against
0.217 ms (this tree), inside the run-to-run spread of a machine with a second worker's Chrome on it.

**Proofs.** `node tools/check.js` 0 fail (153 modules, the 5 pre-existing line-cap warns) · `npm test` OK · `test_clock.js` now 17
checks: the two new ones are **`band`** (hits on every 8th, the off-beat one 2.2× louder but with NO low band, and the line has to
land on the KICKS — it reads −231 ms with the check disabled and −2.6 ms with it on) and **`band flip`** (the same audio with only
the loud snares for the first 8 s so the cold start locks to them: −227 → −2.6 ms, the line moved at 21.8 s, `latJumps 1`) · **the
full fake-timeline md5 sweep** (`PORT=8884 tools/scene-md5.sh s59`, all 12 scene ids × f360 / f840) is unchanged where §56 said it
must be: s0-f360, s2, s3, s4-f360, s5, s6, s7, s8, s9, s10 byte-identical to `tools/accept/v0.14/scene-md5-v014.txt`, s0-f840
`8a0715df` and s4-f840 `05bf21c0` the two pre-existing moves from `22eb969`, s11 post-dating that list. The clock stage returns at
its first line under `ENGINE.fakeOn`, so the fake timeline never runs it. **s1 read `5a9b6bc7` / `b70a98e1`, not §58's `a73fbe67` /
`35fe02c6`** — those are §60 step 4's own recorded pair: the DUST pass-2 worker was in `assets/scenes/dust/` in the same tree while
this sweep ran. Not this change, and not chased; this session touched no file under `assets/scenes/`.

**Not tagged, not pushed, not deployed.**

## §60 DUST, pass 2 — dynamic range, per-bin habituation, harmony (2026-09-30, one worker; report `docs/workers/DUST-OVERHAUL-PASS2.md`)

**The ask**: the three items `DUST-OVERHAUL-SESSION-PROMPT.md` deferred out of pass 1, against the same acceptance
standard — a viewer with the sound off can reconstruct the song. The user's word on pass 1 + 1.5 was *"is looking
good"*, so nothing already signed off was allowed to get worse: the groove keeps the brightness it has, and every
step is calibrated on it. Four commits, each measured and committed with its numbers. **Not tagged, not pushed, not
deployed.** `§59` is unused at the time of writing (the engine worker's).

**New rulers** (all in `tools/work/d2/`, scratch): `spec-trace.js` records the 256 bytes of `ENGINE.tex.spec` — the
grains' own input — every frame, so a per-bin detector can be swept OFFLINE in python (`nov.py`, `nov2.py`) instead
of costing a page run per candidate; `sim.py` does the same for the dynamic-range drive, which is a pure function of
`eM` / `eS` / `dropEnv` and so can be simulated on a trace that already exists. Three of the four steps were decided
on recorded music before anything was rendered. New DUST test hooks: `&dyn=<v>` pins the drive (a bench must not run
at the fake timeline's own `eM` of 0.374), `&hab=0` restores pass 1's drive exactly (verified bit-identical over
5401 frames), `&key=<k>` pins the key.

### Step 1 — quiet is quiet, loud is loud (`10bde08`)

`lvl` was the whole of the cloud's brightness and it is AGC-normalised (p05 0.513 / p50 0.882 / p95 0.992 over
SeeYouDrop 20–110 s); §57 had already measured `eM / eMax` useless (p25 0.972). `dyn.js` holds the TRACK's own peak
— instant attack, 25 s release, floored (step 4) — and `eM / peak` drives the BASE brightness, the grain size and
the swarm's radius, with the three voices and the sub on a gain that barely moves: between the groove and the
breakdown the base loses 76 % and the hits 24 %, because a quiet section's kick is still a kick. The rings dim with
the cloud. The energy is `eM + ½·max(0, eS − eM)` — the slow window plus half of what the fast one hears above it —
picked from four candidates simulated first: on `eM` alone the drops read 0.75 / 0.70 against the groove's 0.91
(a 2.5 s mean on the frame of a slam is still half-full of the void), on `max(eM, eS)` the drops are right but the
intro opens at 0.74. `dropEnv` / the drop's release floor the drive for the same reason at a shorter timescale.

### Step 2 — novelty and per-bin habituation (`54e3033`)

Each grain's drive is its bin's level minus that bin's own 1.2 s average — what is NEW in the band — floored at
0.35, so a sustained pad settles to 35 % of a fully novel band and never to nothing. The state is a 256×1 ping-pong
of the scene's own targets (one 256-pixel pass, one extra fetch per grain): a CPU-side EMA is impossible (the array
behind `ctx.engineTex.spec` is core state), and building the average out of `hist` taps would be 600 k fetches a
frame at tier 3 and capped at 1.3 s.

**The brief's own form of the detector measures as nothing.** `uSpec` is floor-subtracted and peak-normalised, so a
bin's level is a spectral SHAPE and barely moves: `(level − slow) / level` has a per-bin median of 0.010 and a p90
of 0.090, i.e. a flat 0.35 on every grain — a 65 % dimming, not a detector. A z-score on the bin's own deviation has
range but goes hypersensitive as a bin settles (a new bar reads ×1.02 against the bars after it). An **absolute**
step of 0.10 of full scale is right, because the spectrum is already normalised, and τ 1.2 s habituates hardest
(a sustained bin-onset's drive 0.776 → 0.502 in 2.5 s) while keeping the new-bar signal (×1.20).

**The gain is normalised every frame**, by its own RMS over the bins weighted by the grain density AND by `raw²`.
Three weaker divisors were measured on the picture first (mean lum, step 1 = 100.3): raw gain → four times darker;
its mean over the window → 125.1; its RMS over the window → 117.5 and the void 24.2 → 54.2; its unweighted
per-frame RMS → 107.9 and the void 39.9. The bins that read novel are preferentially the LOUD ones, most so where
the mix is sparse, so a fixed divisor raises the quiet end far more than the loud one and half undoes step 1.

### Step 3 — harmony (`5bd7d7d`)

The palette's centre is the key anchor from `assets/math/keycolour.js`, the module TORUS2 (id 3) and POLYTOPE (id 5)
already share, with DUST's own `mkAnchor()` state. **The two scenes are bit-for-bit the same colour**: forced on
SeeYouDrop `&at=12&map=0` and sampled at frames 2400 / 3600 / 4800, DUST and TORUS2 both read key 8 mode 1 and
unwrapped hue −0.33410 / 0.92363 / 1.85418. Against the truth grids the engine reads **the fifth above the tonic**
(G# for C# minor on both test tracks) — the known v0.14 `key` behaviour on sub-heavy tracks that CONTRACTS §1.18
already records, an engine reading and not a scene one; the MODE, which is what warm-or-cool turns on, is right on
both. On SeeYouDrop `keyConf` p50 is 0.154, so the gate sits at 0.27 and the palette is mostly `LOOK.mood` slid a
quarter of the way toward G# minor — the designed behaviour for an untrusted read. The hue moves as an ease
(p50 0.029 turns/s, p99 0.361), never a jump.

### Step 4 — the intro guard, and two rejected fixes for the same problem (`55f7021`)

The intro came out BRIGHTER than the groove (SeeYouDrop 8–14 s at 1.56× the groove against 0.92× before the
overhaul). Two causes. **The peak hold's floor was too low** (0.70, against the track's own `eM` of 0.697 there):
0.84 — at or a little above the resting `eM` of a normal groove on both test tracks — puts the drive at 0.681 there
and 0.268 through 2–8 s, and above the floor the peak is the track's own, so the floor only binds while the hold
warms up. **And the habituation leaks light into a sparse mix**, because holding the mean of `amp²` is not holding
the light: the brightness carries `min(1, sz)` and a grain's area buys overdraw, so the novel grains grow past a
pixel and stop being attenuated. Both fixes for that — the gain to the power 0.6, and leaving the grain's SIZE on
the raw level — were measured and **rejected**: each fixes the intro and each gives back almost all of what step 2
bought, because the per-frame motion and the per-beat contrast ARE the novelty and they travel through the size
(|Δlum| p50 2.10 → 1.72 / 1.63, per-beat 1.436 → 1.366 / 1.366).

### Pass 2 end to end — `765b61c` (pre-§60) against HEAD, traced BACK TO BACK on one clock

| SeeYouDrop 20–110 s | before | after | | CyborgNinja 20–80 s (no drop) | before | after |
|---|---|---|---|---|---|---|
| the window's range p95/p05 lum | 2.921 | **4.179** (+43 %) | | p95/p05 | 1.982 | **2.380** (+20 %) |
| mean luminance | 101.8 | 101.0 | | mean luminance | 106.2 | 106.2 |
| \|Δlum\| per frame p50 | 1.52 | **2.08** (+37 %) | | \|Δlum\| p50 | 1.64 | **2.17** (+32 %) |
| per-beat peak/trough | 1.349 | **1.440** | | per-beat peak/trough | 1.364 | **1.446** |
| the hat's rim lift p50 / mean | 0.1 / 6.4 % | **8.6 / 14.8 %** | | the hat's rim lift | −0.8 / 2.8 % | **0.2 / 9.0 %** |
| the snare's body lift p50 / mean | 3.2 / 9.5 % | 5.5 / 11.3 % | | the snare's body p50 | 41.3 % | 46.8 % |
| the void before drop 1 (55–57.6 s) | 49.9 | **29.6** (−41 %) | | formation changes | 0 | 0 |
| breakdown 1 (49–55 s) · drop 1 | 59.8 · 103.3 | 57.9 · 106.0 | | | | |
| the void / drop 1 | 0.483 | **0.279** | | | | |
| breakdown 2 (100.5–104) · drop 2 | 103.8 · 127.8 | 106.9 · 121.3 | | | | |

The intro (SeeYouDrop 2–40 s): the first eight seconds against the groove at 28–40 s, **0.671 → 0.633**; 8–14 s,
where the track assembles itself and almost every band is new, 0.922 → 1.283 — there the novelty channel beats the
dynamic-range one, which is the brief's own "a new sound gets a fresh voice" beating its own "quiet is quiet".
**Breakdown 2 is the one section pass 2 does not improve**: the engine's energy does not say drop 2 is louder than
the breakdown before it (`eM` 0.729 against 0.771, `eS` 0.78 against 0.62) and its bands are all new, so both
channels read it as loud. An engine question — a loudness that is not AGC-flattened — not a scene one.

### A MEASUREMENT HAZARD, for the harness

An engine worker was editing `assets/engine/clock/clock.js` in the same worktree and its md5 moved from `45eb547f`
to `3ddf490b` mid-session. Only `beatCount` changed — the md5s of the `dropEnv` and `eM` columns are identical
across every trace either side of it — but that was enough: on the second clock SeeYouDrop 20–110 s reads **227
beats instead of 225**, the build and the formation sequence land differently, and drop 1's mean luminance moved
160 → 106 for reasons that are not the scene's. Two candidate tables had to be thrown away. **The rule this buys:
when two workers share a worktree, a scene's before/after is only valid if the two traces were taken back to back,
and the proof is the md5 of the MS columns of both traces** — `beatCount`, `dropEnv`, `eM` are enough to catch a
clock change, an analyser change and a source change. Every headline number above was re-taken that way.

### Proofs

`check` 0 fail (help.feats gaps 0) · `npm test` 0 FAIL · s1 fake-timeline md5 per step: f360 `a73fbe67` →
`8934dc86` → `5f1b796b` → `4781f104` → `5a9b6bc7`, f840 `35fe02c6` → `d3545bc8` → `984ed577` → `b70a98e1` →
`b70a98e1` (step 4 does not move frame 840: the peak has already grown past 0.84 there, so the floor does not
bind). No other scene's folder was touched, and DUST's files are imported by nothing else, so the other ten scenes'
lines cannot move for anything in this pass. Cost, HEAD and FINAL benched back to back on the same machine (5 pairs
interleaved with NAV, `q` pinned 0.95, tier 3, `&dyn=1`): **DUST/NAV 0.527 → 0.580, DUST 1.169 → 1.238 ms** — the
whole of pass 2 is **+0.07 ms** at 150 k points. Within it: the two new passes and the two extra per-vertex fetches
about +0.07 ms and the novel grains' extra fill about +0.03 ms (isolated with `&hab=0`, which leaves the passes
running); sampling the normaliser on every fourth bin would save 5 % of the step and was rejected because it would
put sampling noise on the brightness of the whole cloud. No audible run (the worker's brief forbids it): every
number is the deterministic file path. Files: `dust/dyn.js` (new, 70), `dust/habit.js` (new, 162), and index /
shaders / fibre / help — all under the 350-line soft cap.

**v0.22 tagged locally (2026-09-30) on the user's word ("dust looks good -> tag what we have so far"; deploy still held):** v0.21 +
§58 (band = radius, the accuracy review), §59 (the beat clock's half-beat lattice is the low band's call), §60 (DUST pass 2).
`releases/retinarave-v0.22.html` (1368 KB, 154 modules; from `file://` on scene 1: errs [], nonFinite [], clock pcm), package.json
0.22.0. Not pushed (retinarave.com serves v0.15). The user's next observations: "still finding some observations on the
visualization that make it feel jerky" — a new test track, Vienna (Thom Sonny Green, `~/Music/RetinaRave/Vienna.flac`; "fast
elements … but actually a slow rolling flowy groove"; "the nudge on this looked weird and jerky around 1:40–1:50 (probably more)").

## §61 the nudge is a velocity profile, and the clock does not leave a live tempo — the jerk hunt on Vienna and on SeeYouDrop (2026-09-30, one worker; report `docs/workers/VIENNA-TUNING.md`)

**The asks**, in the order the user gave them, verbatim:

> "still finding some observations on the visualization that make it feel jerky -> just downloaded a new flac file to pull into
> the test folder … this track has fast elements to it but actually has a slow rolling flowy groove to it. The nudge on this
> looked weird and jerky around 1:40-1:50 (probably more) -> run test tuning on new song"

> "lots of modularization and some panning; 1:05 - 1:25 sound gets interesting and feels like in a dream before first drop at
> 1:25 where it adds a double time; the double time should be accenting rather than driving."

> "rewatching see you drop, think nudge is jerky there also."

The third note re-ranked the hunt: the jerk is not Vienna's, it is **§58 task B's own nudge shape**, and Vienna is where it was
loudest because Vienna's clock was also running at twice the felt beat there. Three commits, each measured. Not tagged, not
pushed, not deployed.

### The track — Vienna is 90.00 BPM and `trackmap.py` got the octave wrong

`~/Music/RetinaRave/Vienna.flac`, Thom Sonny Green — *Vienna (Original Mix)*, 192.4 s. trackmap read **178.21 BPM with a
68.0 ms DP residual**, so it kept the WOBBLING DP beats (the first five gaps 0.3367 / 0.3251 / 0.3250 / 0.3251 / 0.3367 s); its
log-normal tempo prior scores 180 at 0.84 against 90 at 0.70. The onset-envelope ACF settles it: the LOW lane (kicks) reads
**−0.005 at lag 0.3333 s and +0.052 at 0.6667 s** — no 180 BPM periodicity at all — the MID lane (snare / clap) **0.038 at
0.3333 and 0.299 at 0.6667** (0.414 at the half-bar, 0.310 at the bar, 0.379 at the 4-bar phrase), and only the HIGH lane has
0.3333 (0.329) and 0.1667 (0.229): **the hats ARE the "fast elements"** and the beat a listener nods to is 0.6667 s. The mid
lane fits P 0.666779 s = 89.985 BPM at resultant 0.642 over the whole track, and with P pinned to 0.666667 its phase per 20 s
slice moves 37 ms in 180 s — dead constant.

`tools/truth/Vienna.json` now carries that hand grid — phase **0.00260 s**, bar 2.666667 s, `downbeat_mod4` **0** — the user's
notes verbatim, and a `provisional` flag (measured, never listened to). The bar line has two independent votes: the kick onsets
per beat of bar read **169 / 117 / 117 / 72** (40–150 Hz flux mean 0.819 / 0.808 / 0.636 / 0.722), and a grid-free Foote
novelty (12 log band shares, 46 ms hop, 4-bar checkerboard kernel) puts the track's five boundaries at 21.223 / 43.514 /
66.502 / 85.310 / 106.626 s with a **median 113 ms** from these bar lines against 667 for a random set (220 ms with the grid
shifted half a beat, 244 with trackmap's own +0.31 s bias). Those boundaries are the user's own structure: the dream is bar 25
(66.669 s) → bar 32, **the first drop is bar 32 = 85.336 s** — which trackmap's `drops` list missed entirely, having only
105.639 → bar 40 — and the jerk window 1:40–1:50 = 100–110 s sits inside the double-time section. `tools/truth/Vienna.180.json`
is the same grid subdivided, so a clock that locks to the double can still be graded on phase.

### The jerk sources, ranked by what they measure

| # | source | before | after |
|---|---|---|---|
| **1** | **the nudge's own velocity shape** | max \|a\| **187 / 187 / 187 rad/s²** · **75 / 73 / 75 %** of every beat under a tenth of the peak velocity · the floor **0.9 / 1.2 / 0 %** of the peak · SeeYouDrop turned BACKWARD on **103 of 5400 frames** | **19 / 16 / 26** · **0 / 0 / 0 %** · **17 / 18 / 11 %** · **0 of 5400** |
| **2** | **the clock at twice the felt beat** (Vienna's double-time section, 85–107 s) | 100–110 s: **2.90** nudges/s against the music's 1.50 (**1.93×**), the spin at **0.647 rad/s** against 0.327 where the clock is locked; whole track 1.890 ticks/s and **62.3 %** of frames in the right octave | **1.60** /s (**1.07×**), spin **0.362** · 1.548 ticks/s, **95.6 %** |
| **3** | **a clock re-seat delivered on one frame** | the frame's own \|a\| up to **605 rad/s²** (SeeYouDrop's cold start walks the lattice at 22.00 / 29.02 / 30.40 s; Vienna six times) | **36** |
| **4** | **a pour re-started on top of one 1 % done** | Vienna 73.27 s phrase galaxy→torus, 73.28 s the drop's burst at `formT` 0.009: one frame OF torus | 0 |
| 5 | the snare ring re-launches before it has left its band | it travels **0.85 / 0.62 / 0.51** units p50 between launches; the mid band is at 0.89–1.36 | not changed (open) |
| 6 | `buildLive` / `dropLiveEvt` never fire at the user's own drop | `buildLive` arms once, 70.1–74.5 s, max 0.67; **`dropLiveEvt` 0 times in 190 s** | not changed (an engine item) |

(SeeYouDrop 20–110 s / CyborgNinja 20–80 s / Vienna 0–190 s throughout.)

### Step 1 — the clock does not leave a tempo whose own ACF lag is still alive (`c4dbedf`)

`period.js`: `alive` is the FIRST test in the switch-vote cost. tempo.js already had exactly this rule but only on the
DOWN-octave branch (`alive ? 1e9 : 16`), so a half-time track could be **doubled on 4 votes (2 s) and then could not come
back**, and an unrelated lag could take it on 3. The default PCM clock read **179.5 BPM over 85–107 s and 120.0 over 132–161**
on a 90.00 BPM track, ticking 1.890 beats/s against 1.500, with 55 % of its ticks in 100–110 s landing 186 ms off the music —
that is the double time DRIVING. Whole-track node A/B (`tools/clock-study.js`, every column compared):

| track | in-octave | lag med | \|lag\| p50 / p90 | line moves | jumps |
|---|---|---|---|---|---|
| Vienna before | 62.3 % | +11.9 ms | 29.7 / 314.9 ms | 6 | 5 |
| **Vienna after** | **95.6 %** | **+6.3 ms** | **8.6 / 86.1 ms** | **4** | **3** |
| SeeYouDrop · CyborgNinja · WhoLikesToParty · Malicious | 94.9 / 98.1 / 98.8 / 97.8 % | +1.5 / +2.8 / +7.1 / +22.2 | 6.3/19.2 · 3.0/5.0 · 7.2/10.1 · 22.3/33.9 | 0 / 4 / 2 / 0 | 0 / 3 / 1 / 0 |

— and all four control traces are **byte-identical** before and after. Per 10 s on Vienna, \|lag\| p50/p90 and the clock's own
tick rate against 1.50 Hz: 20–30 s 167/300 → **4.9/30** (2.90 → 1.50 Hz) · 90–100 165/299 → **3.8/11** (3.10 → 1.50) ·
**100–110 164.6/299.3 → 11.2/53.1** (3.00 → 1.70) · 130–160 166/301 → **5.6/10** (2.00 → 1.50). The escape hatch is the one
that was already there (the held lag DIES → `tempoAge > 16` → 3 votes), which is how a real tempo change is followed; the cost,
stated, is that a track moving to a genuinely unrelated tempo while the old lag stays a live peak is not followed.

**Measured and rejected inside the clock** (so nobody re-runs them): a **mid-band lattice voter** — Vienna's mid band separates
its beat from its 8th by +0.325 ln, but CyborgNinja's reads **−0.282**, preferring the OFF-beat, so the voter would drag
CyborgNinja onto the wrong lattice (§59's own finding that every band wider than 40–150 Hz loses it); an **even/odd
"the clock is at the double" test** — Vienna reads +0.325 ln in the mid band but a correctly locked clock reads up to +0.206 on
CyborgNinja's low band and +0.302 on Malicious' high band, and any track whose snare is only on 2 and 4 is a false positive by
construction.

### Step 2 — the nudge is a velocity profile: a glide plus a raised-cosine accent on the beat

The two shapes before it each fixed the other's complaint: §57's single exponential (τ 0.22) was "slow to register on the beat";
§58's shaped impulse (0.055 / 0.14, 50 % of the step in 50 ms) is "jerky". §58 bought its 50 ms by making the angle's VELOCITY
jump from nothing to 3.14 rad/s in one frame and fall back to nothing — a floor 1 % of the peak, 75 % of every beat under a
tenth of it, 187 rad/s² of acceleration, and **1.91 % of frames turning backward**. For comparison TORUS2, the user's own
favourite mapping (`scenes/torus2/motion.js`: a 2π/16 step eased with ONE τ of 0.3 s), never stops at all: floor 28 % of peak,
75 rad/s².

So the angle is a CLOSED FORM of `beatCount` / `beatPhase` whose derivative is `GLIDE + (1 − GLIDE)·bump(u)` with
`bump = (1/W)(1 + cos(2π(u − W/2)/W))` on `u ∈ [0, W]`, integrated exactly: `ang = A(m) + step(m)·PHI(u)` with `PHI(0) = 0`,
`PHI(1) = 1`. Nothing is integrated per frame, so §57's no-drift rule survives (measured: **0.220916 rad/beat over 2500 beats
against a design 0.220893**). `u` is the phase of `beatCount + beatPhase + W/2`, so the accent STARTS a quarter-beat before the
beat line and PEAKS ON it — the eye sees the crest on the beat instead of the motion starting there, which is how a dancer
anticipates, and the acceleration is finite everywhere by construction. The downbeat is still worth half a step more, and it is
the accent's AMPLITUDE that grows, not its sharpness. `GLIDE 0.45`, `W 0.55`, chosen from a sweep at 150 / 90 / 160 BPM and then
on the three real traces (.20/.40 still 67 % dead; .30/.50 still 50 % dead; .40/.50 already clean at max \|a\| 23/21/32 and a
13/14/9 % floor; .45/.55 keeps §58's own 90 % completion time to the frame and lands nearest TORUS2's 28 % floor).
`&nudge=<g>,<w>` / `hooks.nudge(g, w)` moves both live, so the next A/B is one page and not one build.

**The A/B is exact and cost no page run**: the nudge is a pure function of `beatCount` / `beatPhase` / `barPos`, all three in
`dust-trace.js`'s field set, so `tools/work/v/replay.py` replays BOTH designs on the SAME recorded clock — and its "§58" row
reproduces the traced `d_spin` to the digit. Per-beat medians, from the real traces:

| | SeeYouDrop 20–110 | CyborgNinja 20–80 | Vienna 0–190 |
|---|---|---|---|
| max \|a\| per beat (the jerk) | **186.6 → 19.1** | **187.1 → 15.6** | **186.6 → 16.8** |
| \|a\| p99 over the window | 187.1 → **28.2** | 187.3 → **23.2** | 187.8 → **26.0** |
| \|a\| max over the window | 291.8 → **101.0** | 279.5 → **31.9** | 277.5 → **101.0** |
| dead time (v < 10 % of peak) | **75 % → 0 %** | **73 % → 0 %** | **75 % → 0 %** |
| velocity floor / peak | 0.9 % → **16.7 %** | 1.2 % → **18.3 %** | 0.4 % → **14.2 %** |
| velocity peaks at | −8.3 ms → −8.3 ms | −8.3 → −8.3 | −8.3 → −8.3 |
| 25 % of the step | +16.7 ms → **+0.0** | +16.7 → **+0.0** | +33 → **+0** |
| 50 % / 90 % of the step | +200 / +467 → +200 / +467 | +183 / +433 → +183 / +433 | +333 / +733 → +333 / +767 |
| spin rad/s (the design rate) | 0.559 → **0.558** | 0.591 → **0.589** | 0.419 → 0.344 (step 1: 27 % fewer ticks) |
| frames turning BACKWARD | **1.91 % → 0.00 %** | 0 → 0 | **3.64 % → 0.00 %** (415 of 11400 frames) |

Three things the closed form needed that the ease hid, each measured:

- **a re-seat is not motion.** §56 sets a whole-beat offset at the flip, §59's lattice check advances the line half a beat, and
  `Clock.read()` publishes a forward jump as it comes: measured per frame as |advance − rate·dt|, SeeYouDrop 20–110 s has
  **three +0.5 beat moves** (22.00 / 29.02 / 30.40 s — a cold start 12 s into the track lands on the wrong lattice and the check
  walks it back) and Vienna six. The ease absorbed them because it only ever travelled part of the way; the closed form
  delivered half a step on ONE frame and measured **605 rad/s²**, three times the jerk this step exists to remove. So a frame
  may never carry more beat phase than its own tempo says (`JUMP` 1.05 × `dt·bpm/60`) and the excess is given back at `BLEED`
  0.75 beat/s. **Two looser gates were measured and rejected**: a fixed 0.25 beat (391 rad/s² on a half-beat re-seat, whatever
  the bleed did) and 3× the frame's own advance (238) — both let the excess through ON the accent's peak, where the profile's
  own gain is 2/W, and that IS the spike. A time constant instead of a rate limit was also rejected (393): what matters is not
  how long the catch-up takes but how fast the beat phase may run while it happens.
- **the step must not change mid-beat.** The step is the SCALE on the whole profile, so a bar line that wobbles under a re-seat
  and credits a downbeat mid-beat moves the angle by `dstep·PHI(u)` — half a step is 8° of instant turn. The accumulator absorbs
  the difference; what it costs is that the window's total is the design total only to that amount.
- **the cloud must never turn backward.** §58's ease could and did (103 of 5400 frames on SeeYouDrop, worst 0.024 rad), because
  it takes its delta the short way round and a clock that re-publishes a lower phase pulls the target back. The closed form is
  monotone by construction and guarded anyway: 0 of 5400.

**The picture, SeeYouDrop 20–110 s, before → after**: the window's own range p95/p05 lum **4.195 → 4.482 (+6.9 %)**, the rim
3.986 → **4.196 (+5.3 %)**, mean luminance 100.4 → 99.8, |Δlum| per frame p50 **2.085 → 1.967 (−5.6 %)** and p99 18.34 → 17.51,
the body's p99 29.5 → **26.7 (−9.7 %)**, per-beat peak/trough 1.408 → 1.381 (−2.0 %), formation changes 8 → 8 (the same ones).
**CyborgNinja**: mean luminance 109.05 → 109.02, |Δlum| p50 2.243 → 2.170, per-beat peak/trough 1.446 → 1.418, 0 pours both
ways — and **the one number that got worse anywhere**: CyborgNinja's window range p95/p05 2.314 → **2.152 (−7.0 %)**, because
on a track that is one long groove the old spike's own overdraw WAS some of the range. SeeYouDrop's range went up by as much as
CyborgNinja's came down, the per-frame flicker is down on both, and the brief's measure is that a viewer can read the song.

### Step 3 — a pour that lands on one barely started is re-aimed, not re-started

`formA` / `formB` / `formT` are a single interpolation, so `formA = formB` while the cloud is 1 % of the way across declares it
to be AT a shape it has not reached: the picture snaps there for a frame and then pours back. Measured **once** in the three
traces and it is a real snap — Vienna 73.27 s a phrase pour galaxy → torus, 73.28 s the drop's burst on top of it with `formT`
at 0.009. Under `RETARGET` 0.2 a pour that far in or less keeps `formA` and `formT` and only re-aims `formB`. SeeYouDrop's own
two drop bursts land at `formT` **0.933** and **0.721** and CyborgNinja never pours, so nothing already signed off moves.

### Measured and REJECTED, scene-side

- **A per-beat weight from the beat's own strength** — the brief's own first candidate ("a beat with no kick is a smaller
  nudge"), and the measurement is unambiguous that it cannot work on this track. At every clock tick in 100–110 s, on-beat
  against off-beat: the voices' energy `max(vk, vs)` **0.248 / 0.232** (ratio 1.07), the raw levels `max(kick2, snare2)`
  **0.121 / 0.148** (0.82 — the off-beat ticks are LOUDER), `bassS` 0.630 / 0.646, `lvl` 0.812 / 0.803, and "an attack within
  80 ms of the tick" 54 % against 38 %. Vienna's double-time layer puts REAL transients on the off-eighths — which is exactly
  the user's point — so PRESENCE cannot separate them and only periodicity can, which is the clock's job.
- **A tempo-feel SCALE on the step** (step ∝ the beat's period, so the angular rate is immune to the octave). It works
  arithmetically — at 179.5 BPM it gives 0.476 rad/s against 0.481 at 90 instead of 0.647 against 0.327 — but it speeds every
  track that is not 150 BPM up or down (Vienna's correctly locked groove 0.29 → 0.48 rad/s, +67 %), and step 1 removes the need.
- **A rate limit on each voice** (the brief's candidate b, "hits faster than ~6–8 Hz merge into a level"). The voices' own fire
  rates: kick 3.01 / 3.23 / 2.04 Hz, snare 3.70 / **6.37** / 4.17, hat 4.32 / **7.62** / 3.94, worst single second 10 / 10 / 11
  and 12 / 9 / 9 — **CyborgNinja is the densest of the three and it is the control the user has already signed off**. A 6–8 Hz
  limiter would fire hardest there and barely on Vienna.
- **A longer formation cross-fade / a no-pour rule in a steady groove** (candidate d): Vienna has 11 pours in 189 s (3.47/min,
  against §57's 7 in 90 s on SeeYouDrop) and **none at all in 100–110 s** (0.0 % of frames mid-pour there), so pours are not the
  user's jerk. `barNovelEvt` fires **once** in 190 s and there is no storm to guard against.

### Open, and all of it is for the orchestrator

- **`dropLiveEvt` never fires on Vienna** in 190 s, and `buildLive` arms only in the dream section (70.1–74.5 s, max 0.67). The
  user names a drop at 1:25 and the independent novelty agrees (85.310 s). DUST's whole tension machinery — the contraction, the
  palette drain, the slam — therefore does nothing on this track. §54's detector, not the scene.
- **Vienna sits on the wrong half-beat lattice for 110–130 s** (\|lag\| 314 ms). Its 40–150 Hz on-beat / half-beat margin is
  **+0.082 ln**, the thinnest of the five tracks and barely past §59's `LAT_MARG` 0.06, so the check needs ~18 s after a re-seat
  to move the line. Step 1's four fewer re-seats already help; the rest is §59's own cost structure.
- **the snare ring never leaves its band** on any of the three tracks (0.85 / 0.62 / 0.51 units of travel p50 against a band at
  0.89–1.36): §58 task A launched it ON the band so it lands at 0 ms, and it then re-launches before it has gone anywhere, so
  the eye gets a flicker on the band instead of a shell leaving. Changing it moves all three tracks equally, so it is the user's
  call, not this session's.
- **synapse's bar line is 2 beats off on Vienna** (`barPos`: engine bar 1 is truth beat +2 in 82 % of frames, `barConf` 0.00
  when right and 0.67 when wrong), and its 16-beat line hits 2 of 22 section starts and 0 of 1 drop. The downbeat's bigger
  nudge is therefore on the wrong beat of the bar there — a consistent 4-cycle, so it reads as a pattern, not a jerk.
  `bpmSyn` reads **164.93** on Vienna (median), so synapse's tempo is a third voice and wrong on this track too.
- "Lots of panning": DUST reads no stereo field at all (its 42 `feats` are mono), so panning cannot drive a flicker here.
- `tools/truth/Vienna.json` is **provisional** — nobody has listened to the grid against the track.

### Proofs

`node tools/check.js` **0 fail** (154 modules, the 5 pre-existing line-cap warns) · `npm test` **7/7 OK** · `test_clock.js` all
17 checks OK including the 128 → 132 ramp (±0.48 BPM), 6 s of silence coasted within 21 ms, the outlier and both lattice cases ·
the four control tracks' whole-track clock traces `cmp`-identical · `node -e` on `grid.js` alone: `PHI(0) = 0`, `PHI(1) = 1`,
0.220916 rad/beat over 2500 beats against a design 0.220893, and re-seats of +0.5 / +1 / −0.3 / −1 beat give max \|a\| 35.5 /
35.5 / 106.6 / 106.6 with the velocity never negative. **The §60 harness rule was honoured on every pair**: the MS columns'
md5s (`beatCount`, `bpm`, `beatPhase`, `dropEnv`, `eM`, `eS`, `kick2`, `snare2`, `hat2`, `subNoteEvt`, `buildLive`) are
IDENTICAL between the head and final traces on SeeYouDrop and CyborgNinja, and on Vienna only the three clock columns moved
(step 1) with every analyser and source column identical — so each before/after is valid. s1 fake-timeline md5 f360
**`5a9b6bc7` → `42e4871c`**, f840 **`b70a98e1` → `6eae9916`** — and the "before" pair is exactly §60's own recorded one, taken
in THIS tree with only `dust/{grid,index}.js` reverted to HEAD, which isolates this section's change from §62's (the fake
timeline gives the ears no tonic, so `key` never moved there). No other scene's folder was touched and DUST's files are imported
by nothing else, so no other line can move. Cost: **flat**. `CARD.bench(1, 300)` at tier 3 (150 k points), `q` pinned 0.95 and
settled over 600 frames, the first call discarded, four pairs interleaved with NAV, THREE runs of each tree alternating:
DUST/NAV medians **0.723 / 0.816 / 0.768 (before)** against **0.837 / 0.776 / 0.797 (after)** — 0.768 against 0.797, inside a
within-run spread of 0.50 to 1.37 on a machine carrying a second worker's Chrome; DUST's own ms 1.078 against 1.134. The change
adds one `cos` per FRAME on the CPU in place of one `exp` and touches no shader and no per-grain work, so no cost number could
honestly move. No Q trace (the cost did not rise). A second worker was committing `assets/engine/{feats,features-ears}.js` (§62) in the same
worktree throughout; its change is `key` / `mode`, which DUST reads only for the hue, and the md5s above prove it did not reach
any number in this section. No audible run (the worker's brief forbids it): every number is the deterministic file path.

**Not tagged, not pushed, not deployed.** The A/B for the user, in track time, is `docs/workers/VIENNA-TUNING.md`.

## §62 `key` is the TONIC — the engine read the fifth above it, and the fix is which detector answers (2026-09-30, one worker; the miss found by §60 step 3, the user: "fix it")

§60 step 3 measured DUST and TORUS2 taking a bit-identical hue out of `assets/math/keycolour.js` and the engine
handing both of them **G# for C# minor on SeeYouDrop** — "the known v0.14 `key` behaviour". Three candidates for where
the fifth came from, and the measurement that settles it: the engine's `MS.key` against the truth grids' tonic over
20–100 s of all five tracks (`filetrace.js … 'key,mode,keyConf,tonic,tonicMinor,tonicConf,eM'`, PORT 8890), the modal
read per track.

| track | truth tonic | `MS.key` **before** | d | the ears' `tonic` | d | the map's whole-track KK | d |
|---|---|---|---|---|---|---|---|
| SeeYouDrop | C#m (conf .277, **human**) | **G#m 93 %** | +7 | **C#m 76 %** | 0 | C#m (.222) | 0 |
| CyborgNinja | C#m (.174) | G#m 53 % | +7 | G#M 40 % | +7 | Dm (.019) | +1 |
| Malicious | GM (.159) | Cm 50 % | +5 | Cm 53 % | +5 | CM (.036) | +5 |
| WhoLikesToParty | DM (.191) | **Bm 100 %** | +9 | **DM 47 %** | 0 | Em (.277) | +2 |
| Vienna | D#m (.451) | D#m 100 % | 0 | D#m 100 % | 0 | D#m (.362) | 0 |

**The diagnosis is (a), the detector — and NOT (b), the mapping.** (b) was §60's lean and a one-line fix, and it is
refuted by the second column: the error is +7, +7, +5, +9, 0, not a constant. A circle-of-fifths offset in
`keycolour.js` cannot produce that, and `hueKey = ((7k) mod 12)/12` is a correct circle of fifths besides (C G D A E B
F# C# G# D# A# F at positions 0…11) — rotating it would have hidden a detector fault inside the colour layer while
leaving GIELIS's shapes and CHLADNI's interval table reading the wrong root. The three errors are instead the three
classic Krumhansl–Kessler confusions: the **dominant** (SeeYouDrop, CyborgNinja), the **subdominant** (Malicious) and
the **relative minor** (WhoLikesToParty, B minor for D major — the same twelve notes, a different profile weighting).
(c) is **partly true and recorded as an open item**: only SeeYouDrop's C# minor has a human annotation behind it
(`SeeYouDrop.sections.json`, the sub loop C#1–A1–F#1–E1 = i–VI–iv–III); on CyborgNinja and Malicious the "truth" is
itself a low-margin KK read of the same signal.

**Where the fifth comes from, exactly.** `MS.key` was synapse's own KK (`synapse/anatomy.js` `longFrame`): a chroma
peak-picked from a 8192 FFT over **65–2100 Hz**, `sqrt(magnitude)` weights, a 12 s EMA, 2.5 s hysteresis. On a track
whose root is a 34.6 Hz C#1 that floor is below the first harmonic and the bins near it are a whole tone wide
(5.4 Hz bins: bin 6 is C1, bin 7 is D1), so the root's own pitch class is not reliably in the chroma at all. The
engine already solved that once: `ears/tonic.js` bins 130–2100 Hz by **power** and adds the sub's own **YIN** pitch
class weighted by its energy share, which is why its header has carried the sentence "the engine reports the fifth
(G# instead of C#)" since v0.15 — the diagnosis was in the tree, unacted on, while five scenes read the wrong field.
Both solvers' rotation conventions were checked and are identical (`c[k]` aligns with `P[0]`), so the fault is the
chroma, not the correlation.

**The fix — `engine/features-ears.js`, two lines in the stage.** The `ears` stage runs after `synapse` and takes
`key` / `mode` over from it when `tonic >= 0`: `if (o.tonic >= 0) { S.key = o.tonic | 0; S.mode = o.tonicMinor | 0; }`.
This is the move the track map already makes on the drums and the sub (§48 addendum 1) — a better detector of the same
quantity wins — so CONTRACTS §2's "never overwrite another stage's" gained its one declared exception, and the two
fields are declared on the stage. **Rejected: fixing `anatomy.js`.** Its chroma also feeds `MS.chroma`, which TORUS2,
POLYTOPE, MAXWELL, GIELIS and DUST all read, and resolving a 35 Hz root out of a 5.4 Hz-bin FFT needs the YIN the ears
already run — the fix would have been a duplicate of `ears/tonic.js` paid for by moving every chroma scene.
**Rejected: the map's whole-track tonic** (2/5, the table's last column) — it is non-causal and so file-mode only, and
it is *worse* than the causal ears on three tracks, because one average over the loud half throws away the fact that
the key is a thing that holds for a while.

**`keyConf` deliberately does NOT move.** The ears' own clarity on synapse's documented `(best r − .35)/.45` scale was
built and measured — p50 0.548 / 0.648 / 0.767 / 0.976 / 1.000 — and **reverted**: `keycolour.js` gates on `keyConf`
at `KEYC1` 0.3, so each of those opens the gate to 1.0 and the hue stops being `LOOK.mood` slid part of the way toward
the key and becomes the key's own hue outright, on all five scenes that call `mkAnchor()`. SeeYouDrop's gate would go
§60's measured **0.27 → 1.00**. Which key the hue anchors on was the user's ask; how far the hue travels toward it is a
look change that wants its own A/B (`docs/OPEN-ITEMS.md`).

**Proof, on the music.** The same five traces re-taken after the fix: `MS.key`/`MS.mode` equal the ears' tonic on
**4801 / 4801** frames of every track, `keyConf` p50 **identical** on all five (0.154 / 0.706 / 0.778 / 0.755 / 1.000
before and after), SeeYouDrop **G# → C#** and WhoLikesToParty **B → D**, Vienna unchanged, CyborgNinja and Malicious
unchanged and never worse. §60's own recipe re-run on TORUS2 (`#test&track=SeeYouDrop&at=12&map=0&scene=3`, `info()` at
frames 2400 / 3600 / 4800, errs []), **back to back on this tree**:

| | key / mode | unwrapped hue | `keyConf` |
|---|---|---|---|
| before (`12f63a1`) | 8 / 1 | −0.3341 · 0.9236 · 1.8542 (= §60's −0.33410 / 0.92363 / 1.85418) | 0.1661 · 0.1095 · 0.1720 |
| after | **1 / 1** | −0.3538 · 0.9191 · 1.8389 | 0.1661 · 0.1095 · 0.1720 (unchanged) |

The hue moved **−0.0197 / −0.0045 / −0.0153 turns** — small, because the held gate is 0.04–0.36 there, which is the
open item above stated as a number: the right key is at present barely more visible than the wrong one was.

**Proof, on the fake timeline: NOTHING moved.** The ears never run under `#test` (`earsStage` returns on
`ENGINE.fakeOn`), so `tonic` is −1, the override cannot fire and `state.js`' defaults stand. The full sweep
(`PORT=8890 tools/scene-md5.sh s62`, all 12 ids, errs [] on every one) is **equal to `tools/accept/v0.14/scene-md5-v014.txt`
line for line** apart from the four already accounted for: s0-f840 `8a0715df` and s4-f840 `05bf21c0`, the two
pre-existing moves from `22eb969` / §54 addendum 2; s1 `5a9b6bc7` / `b70a98e1`, exactly §60's recorded DUST values (the
parallel DUST worker had not moved them); s11, which post-dates that list. So §62 moved **0 of 25 lines** — the
stronger result than the "three key-colour scenes move" the brief expected, and the right one: a change gated behind
the ears cannot touch a timeline the ears do not run on. (Five scenes read `mkAnchor()`, not three: DUST, TORUS2,
POLYTOPE, MAXWELL, GIELIS, and CHLADNI reads `tonic` with `key` as its fallback.)

**Proofs.** `node tools/check.js` **0 fail** (154 modules, MS keys 199, help.feats gaps 0, 5 pre-existing line-cap
warns) · `npm test` **0 FAIL** (all 10 groups OK) · a new **`node tools/test_ears.js --keys`** ruler: the modal
`(tonic, tonicMinor)` over 20–100 s of every track with a PCM dump against that track's truth tonic, with the page's
synapse read recorded beside it, asserting the three tracks that must match, the two recorded misses, `ears > synapse`
on the pitch class and `0 tracks where synapse wins and the ears lose` — **8 pass**, 4.0 s (a `stopAt` option on
`stream()` keeps it to the graded window). `tools/test_ears.js` itself still reports its four known causal-path misses
(subNote 88.4 %, the walk arrivals, kick F 0.786, 13.9 % on bare 808s — AUDIT-v0.15 §1's published numbers, which is
why it is not in `npm test`); the diff touches neither `ears/sub.js` nor `ears/perc.js` and `test_ears` never imports
`features-ears.js`, so it cannot have moved them. No audible run. Files: `engine/features-ears.js`, `engine/feats.js`
(the three FEATS entries), `tools/test_ears.js`, `docs/CONTRACTS.md` (§1.18, §2, Appendix A), `docs/OPEN-ITEMS.md`.

## §63 an AGC-free loudness for the engine — ITU-R BS.1770-4 on the PCM bus (2026-09-30, one worker; the user: "loudness plan approved", `docs/plans/LOUDNESS-PLAN.md`)

§60's one failure: DUST's pass 2 did not improve SeeYouDrop's breakdown 2, because **the engine's energy does not know
the drop after it is louder**. Every energy in `MS` is AGC-normalised — the band followers divide by a running peak with
a 14 s release (`synapse/dsp.js`), and 14 s is shorter than a dubstep breakdown, so by the end of one the peak has
decayed onto the breakdown's own level and `eM` reads near full. The plan's answer: the one measure of "how loud does
this sound" with a standard behind it, added as a stage, with **the AGC left on every detector** and only a scene's
BASE light, base size and base radius moved onto it. Phases 1, 2, 3, 5, 7 of the plan are below; **4 (DUST) and 6
(NAV2) were out of this worker's scope** — DUST was being edited in the same worktree and NAV2 is paused.
Not tagged, not pushed, not deployed.

### Phase 1 — `trackmap.py --loud`: the offline reference (`a3a3a0e`)

`--loud` runs ONLY the loudness analysis and writes ONLY `tools/truth/<name>.loud.json` (`--loud-out=<dir>`,
`--loud-win=<s>`): it reads `<name>.json` for the sections and the bar-pinned drops — preferring the hand-corrected
`sections_hand` / `drops_user` / `drops_hand` when a worker has put them there — and never rewrites it. The measure is
K-weighting (a +4 dB high shelf, then the RLB high-pass, per channel, **causal** IIR) and
`L = −0.691 + 10·log10(Σ_ch mean(y_ch²))`, G_L = G_R = 1. The spec tabulates the biquads at 48 kHz only; `kcoef(sr)`
derives them from the analog prototypes by the spec's bilinear recipe and reproduces that table to **8.9e-16**.
Windows: momentary 400 ms, short-term 3 s, both as two subtractions on a cumulative sum of the K-weighted squares, so
the value at `t` is EXACTLY the mean square over (t − W, t] — the same quantity the engine's ring holds.

The plan's table reproduces (window-integrated, SeeYouDrop): intro 2–8 s **−8.32**, groove 28–40 **−3.99**, breakdown 1
49–55 **−6.09**, void 55–57.6 **−4.68** (plan −4.67), breakdown 2 100.5–105.596 **−4.02**, whole track gated **−3.88**
(plan −3.89). **The headline pair**, equal 5.1 s windows: breakdown 2 short-term p50 **−4.845** (plan −4.84) → drop 2's
head −1.967 (plan −2.19) = **+2.88 LU, ×1.94 in power**, against `eM`'s **×0.994**. The 0.22 LU on the drop side is the
one number that did not reproduce; the breakdown side, the one `eM` gets wrong, is exact to 0.005 LU.
The other four: CyborgNinja −9.05 LKFS and **0 drops** (the control), WhoLikesToParty −10.03 (+2.27 / +1.34 / +1.54 LU
over its three drops), Malicious −12.46 (+1.17 over its one), Vienna −6.89 (+0.92 / +0.26 over the two the Vienna
worker's `drops_user` names). Short-term p95−p10: 4.96 / 1.37 / 2.86 / 7.82 / 3.25 LU.

**A hazard paid for here, for the harness.** `trackmap.py <Track>` — including `--pcm` — runs the FULL analysis and
**rewrites `tools/truth/<Track>.json`**. Regenerating Vienna's 48 kHz dump (which already existed) destroyed the Vienna
worker's provisional truth in the same worktree: `bpm_grid`, `beats`, `downbeats`, `sections_hand`, `drops_hand`,
`drops_user`, `provisional`, `notes`. It was restored from `HEAD` (commit `c4dbedf`) and verified key by key, so
nothing committed was lost — but **anything that worker had not yet committed was**. The rule: never run the truth tool
on a track another worker is annotating; `--loud` is safe because it writes its own file, and the dumps are already in
`tools/work/`.

### Phase 2 — the stage: `engine/loud.js` + `features-loud.js`, six fields (`70c6624`)

`assets/engine/loud.js` is pure DSP (no DOM, no clock, no imports) so `tools/test_loud.js` runs it in node;
`features-loud.js` subscribes it to the PCM bus with `PCM.on`, registers `ENGINE.addStage('loud', …)` **after `ears`
and before the PCM beat clock**, and reads it at `MS.heardT` exactly as the ears are read. The cost is paid in the PCM
listener, outside `frame()`, and drained through `ENGINE.extraMs`.

| field | kind | what |
|---|---|---|
| `loudM` | raw | momentary loudness, LKFS (the 400 ms window) |
| `loudS` | raw | short-term loudness, LKFS (3 s) |
| `loudPk` | raw | the loudest `loudS` this track has reached, LKFS |
| `loudRel` | level | **the one a scene reads**: `clamp01((loudS − loudPk + 18) / 18)`, gain-invariant |
| `loudRange` | raw | p95 − p10 of `loudS` so far, LU |
| `loudAbs` | count | 1 absolute (file, demo) · 0 the tab's / the mic's gain (capture, mic) · **−1 the stage is off** |

The plan's `kind: level` for the first three became **`raw`**: `FEATS`' own legend says `level` is 0..1 and LKFS is not.

**Three decisions the plan did not settle, each measured:**

1. **The peak's release is 0.02 LU/s, not a 25 s exponential.** DUST's `dyn.js` holds its peak with a 25 s release,
   which on a mean square is 0.174 dB/s — and that forgets **6.6 LU in the 38 s** between SeeYouDrop's drop 1 and its
   breakdown 2, more than the whole track's 4.96 LU of range. The hold would have decayed *under* the present loudness
   and `loudRel` would read 1.000 at both ends of the very pair this field exists to separate. `dyn.js` got away with
   25 s because it holds an AGC-normalised 0..1 energy, whose peak barely moves. 0.02 LU/s = 3 LU over a 150 s track.
2. **No absolute floor on the peak; a relative warm-up guard instead.** §60 step 4 floored DUST's peak at 0.84 of its
   normalised scale. The same move here (a floor at, say, −6 LKFS) is NOT gain-invariant: CyborgNinja, Malicious and
   WhoLikesToParty all master 8–9 LU quieter than SeeYouDrop, so the floor would bind for their whole length and a
   quietly mastered track would be permanently darker — the AGC's own sin inverted. The guard is
   `loudPk ≥ loudS + 4·exp(−age/6 s)`: until the stream has heard something louder it assumes 4 LU of headroom,
   decaying to 0.03 LU by 30 s. Without it a track's first frames read `loudS == loudPk`, i.e. `loudRel` 1.0 — the
   intro would be the brightest thing in the song, which is exactly what §60 step 4 paid to fix.
3. **The ring holds one entry per 32 samples, not per 512-sample block.** The window edge cutting a ring entry is the
   WHOLE of this stage's error against a sample-exact reference, and it is not small on a transient in a quiet passage.
   Measured over the five tracks (`test_loud.js --truth`, max |error| per frame, loudM / loudS): sub **512 → 4.45 /
   0.19 LU** · 128 → 0.30 / 0.13 · 64 → 0.16 / 0.02 · **32 → 0.006 / 0.000 LU**, for 3.53 → 3.80 µs/block. 32 is also
   not a taste: at 48 kHz a 60 fps frame is exactly 800 samples and the two windows exactly 19 200 and 144 000, all
   multiples of 32, so every page read lands ON an entry and the interpolation never runs. 0.27 µs bought all of it.

The switch lives on **`LOUDK.on`** (`&loud=0`), not on `ENGINE` — `sources/fake.js` has to read it and `engine.js`
imports `fake.js`, so an `ENGINE.useLoud` would close an import cycle `check.js` fails. `fake.js` mirrors the six
fields from its own synthetic energy (`−0.691 + 20·log10(e)`, so the 24 s loop spans about −13 … −1 LKFS): without it
the fake timeline — where every md5 proof in this project is taken — would be a hole where `loudRel` is 0 and a
migrated scene goes dark. Under `&loud=0` it leaves `loudAbs` at −1 instead, which is what makes `&loud=0` reproduce
the pre-migration md5 list line for line.

**Proofs.** `node tools/check.js` **0 fail** (156 modules, MS keys 205, help.feats gaps 0, 5 pre-existing line-cap
warns) · `npm test` **0 FAIL**, now with `tools/test_loud.js` in it (**38 pass**, 1.4 s): the 48 kHz coefficients
against the spec table, the K curve's two sections, a **−23 → −13 LKFS step of a 997 Hz stereo sine reading each level
to 0.0001 LU and the step to +9.9999 LU**, the 400 ms and 3.0 s windows measured from the step's own rise time
(0.4000 / 3.0000 s), the heard-time read and the ring's lookback limit, the peak's attack / release / warm-up guard,
`loudRange` on a signal whose true span is 8 LU (reads 8.50), **gain invariance** (×0.1 moves `loudS` by −20.00 LU and
leaves `loudRel` and `loudRange` identical to 8e-13 — the capture path), 44.1 kHz through the derived coefficients
(the same waveform reads the same LKFS at both rates to 0.0025 LU), determinism, and the cost.
**Cost: 3.73 µs/block → 5.83 µs/frame at 48 kHz / 60 fps = 0.035 % of a frame**, against the plan's estimate of
4.08 µs/frame.
**The fake timeline: NOTHING moved.** `PORT=8892 tools/scene-md5.sh p2loud`, all 12 ids, `errs []` and `hop 840
row 72` on every one, is **equal to `tools/accept/v0.14/scene-md5-v014.txt` line for line** apart from the four already
accounted for: s0-f840 `8a0715df` and s4-f840 `05bf21c0` (the §54 addendum 2 moves), s1 `42e4871c` / `6eae9916` (DUST —
the parallel worker's, moved past §60's `5a9b6bc7` / `b70a98e1`; noted, not chased) and s11 `8a930b26` / `5a5c795a`,
which post-dates that list. **0 of 25 lines** — the six fields move no scene until a scene reads them.
`node tools/parity.js fake`: **every MS field identical to 1e-9** (62 numeric fields compared), the six new ones listed
as "missing in v3" info as every post-v3 field is. The `nav.*` snapshot differs (`nav.lg` 7.85, `nav.mode`,
`nav.cyc.has`) — **pre-existing drift of this engine's NAV from cardioid3's**, not reachable from here: MS is identical
frame for frame, so a scene difference can only be the two programs' own NAV code (this NAV has read `dropLiveEvt`
since §54, and the event log shows `ew`'s extra `FILE@` / `RESTORE@` look-memory lines, "absent in v3"). No audible run.

### Phase 3 — the truth grading: `test_loud.js --truth` (`fec7131`)

`--truth` runs the stage over the 48 kHz stereo dumps of all five tracks, one `read()` per 60 fps frame as the page
does, against **two** references, because they answer different questions:

- **(a) an exact in-test reference on the same samples** — the same K-weighting coefficients (pinned to the spec table
  by the `coef48` case and independently re-derived in python to 9e-16), but written the obvious way: a second spelling
  of the biquads in direct form I, a whole-file Float64 cumulative sum, no ring, no sub-block edge, no interpolation.
  This is what grades the engine's MACHINERY. Result, max |error| per frame after 8 s of warm-up:
  **loudM 0.0009 / 0.0000 / 0.0063 / 0.0000 / 0.0000 LU and loudS 0.0000 LU on all five**
  (SeeYouDrop 8977 frames · CyborgNinja 10324 · Malicious 12896 · WhoLikesToParty 14901 · Vienna 11080 — 58 179 graded
  frames). The plan asked for 0.1 LU; the gate is set at 0.02.
- **(b) `tools/truth/<name>.loud.json`, python's own implementation**, which ran at the FILE's rate (44.1 kHz) while
  the stage runs on the 48 kHz resample — so a per-frame gate on it would be grading `resample_poly`. Reported, and
  gated only on the 3 s window, which is insensitive to it: **0.018 / 0.028 / 0.260 / 0.051 / 0.028 LU**. (Momentary:
  0.3–1.9 LU, all of it in fades and near-silent bars, where a 400 ms window's dB is wild and two different sample
  sets diverge.)

**Proof 2, the assertion §60 could not make** — for every annotated drop on the five tracks, is the drop head louder
than the breakdown before it? Equal 5.1 s windows, `loudS` p50 as the page reads it:

| track | drop | `loudS` p50 before → after | ΔLU | in power | truth | `loudRel` p50 before → after |
|---|---|---|---|---|---|---|
| SeeYouDrop | 57.61 | −6.46 → −3.98 | **+2.48** | ×1.77 | +2.50 | 0.648 → 0.792 (×1.222) |
| SeeYouDrop | **105.60** | **−4.84 → −1.97** | **+2.88** | **×1.94** | +2.88 | 0.790 → 0.957 (×1.212) |
| CyborgNinja | — | the control: 0 drops in the truth, and nothing claims one | | | | |
| Malicious | 148.29 | −10.88 → −11.07 | −0.19 | ×0.96 | −0.20 | 0.972 → 0.966 (×0.995) |
| WhoLikesToParty | 57.51 | −13.24 → −9.70 | +3.54 | ×2.26 | +3.54 | 0.737 → 0.939 (×1.274) |
| WhoLikesToParty | 131.35 | −12.60 → −10.82 | +1.78 | ×1.51 | +1.79 | 0.786 → 0.891 (×1.134) |
| WhoLikesToParty | 188.79 | −12.26 → −10.22 | +2.05 | ×1.60 | +2.05 | 0.786 → 0.903 (×1.149) |
| Vienna | 85.34 | −9.07 → −8.03 | +1.04 | ×1.27 | +1.06 | 0.881 → 0.945 (×1.072) |
| Vienna | 106.67 | −6.38 → −6.05 | +0.33 | ×1.08 | +0.32 | 0.999 → 0.987 (×0.988) |

**7 of 8**, and every one of the eight agrees with the offline truth's own ΔLU to **0.05 LU** — the stage and the
reference are measuring the same thing. The one miss is **Malicious's drop at 148.29 s**, and it is a miss in the
TRUTH, not in the engine: its 5.1 s short-term p50 reads −0.20 LU while the same window's integrated loudness reads
+1.17 (phase 1), i.e. its "breakdown" is already loud and the drop's own head is ducked. Recorded as the one
exception, asserted as such. **`eM` on the headline pair is ×0.994.**

**The number to carry into the scenes.** `loudRel`'s own ratio on the headline pair is **×1.212**, not ×1.94: its span
is a fixed 18 LU (`LOUDK.RANGE`) while the section ladders of real tracks span 1.4–7.8 LU, so the whole ladder lives in
`loudRel`'s top third. That is the plan's design, not a fault — `loudRange` is published beside it so a scene can
expand onto the track's own contrast, and `(loudRel − 1)·18 = loudS − loudPk` exactly. A scene that divides by
`max(loudRange, R_MIN)` instead of 18 recovers the power ratio; phase 5 does that and measures it.

### Phase 5 — the base light onto true loudness: FEIGEN, MANDALA, POLYTOPE

One scene-side mapping, in `assets/math/loudlight.js` (pure, `assets/math/` the way `keycolour.js` is shared, so there
is one definition to tune and one place the numbers live). `baseLight(loudRel, loudRange, loudAbs, fallback)`:

    loudAbs < 0  ->  fallback                     the stage is off (&loud=0): the pre-loudness value, bit for bit
    else         ->  clamp01((loudRel - 1) / (max(loudRange, 7) / 18) + 1)

**Why not just `loudRel`.** `loudRel`'s span is a fixed 18 LU, and real section ladders span 1.4–7.8 LU, so a whole
song lives in the top fifth of it and the headline pair reads ×1.21 where the music is ×1.94 in power. Dividing by the
range the track has ACTUALLY shown (`loudRange`, itself gain-invariant, so this stays gain-invariant) puts that ladder
across the full 0..1. The identity `(loudRel − 1)·18 = loudS − loudPk` makes it exact: "how many LU under the track's
own peak, over how many LU the track uses". **The top is anchored** — at the track's own loudest it returns 1.0,
exactly where `lvl` sat (p95 0.99) — which is what keeps a migrated scene recognisable; what changes is the bottom.

**`L_RNG_MIN` = 7 LU, swept over 4 … 18 on all five tracks.** The headline breakdown 2 → drop 2 ratio of the mapping:

| `R` | 4 | 5 | 6 | **7** | 8 | 10 | 12 | 18 |
|---|---|---|---|---|---|---|---|---|
| ratio | ×14.5 | ×3.46 | ×2.36 | **×1.93** | ×1.71 | ×1.48 | ×1.37 | ×1.21 |

7 is where the picture moves **by as much as the sound does and no more** (the music's own power ratio is ×1.936), and
where the other four tracks keep the median `lvl` already had — base light p50 **0.857 / 0.861 / 0.866 / 0.900**
(CyborgNinja / Malicious / WhoLikesToParty / Vienna) against `lvl`'s measured p50 0.882 (§60 step 1) — so they look as
they did, while SeeYouDrop, the one track with real breakdowns, gets the dynamic: p05 0.150 / p50 0.474 / p95 0.907,
and **52 % of the base light lost between the groove (28–40 s) and breakdown 1 (49–55 s)**, against the 76 % §60 step 1
measured for DUST and the user signed off as "dust looks good". Below 6 LU the void before drop 1 clamps to 0 and the
ratio stops meaning anything (×738 at R = 4); above 10 LU the ladder is back inside the top third it came from.

**The field, measured on all five tracks** (`node tools/test_loud.js --truth`; `loudS` p50 over equal 5.1 s windows,
and the mapping's own p50):

| track | drop | `loudS` ΔLU (power) | `loudRel` | **`baseLight`** |
|---|---|---|---|---|
| SeeYouDrop | 57.61 | +2.48 (×1.77) | 0.648 → 0.792 ×1.22 | 0.096 → 0.466 **×4.87** (the void is near-silent) |
| SeeYouDrop | **105.60** | **+2.87 (×1.94)** | 0.790 → 0.958 ×1.21 | 0.460 → 0.891 **×1.935** |
| CyborgNinja | — | the control: 0 drops, and nothing claims one | | |
| Malicious | 148.29 | −0.19 (×0.96) | ×0.995 | ×0.990 — the recorded exception (its breakdown is already loud) |
| WhoLikesToParty | 57.51 / 131.35 / 188.79 | +3.54 / +1.79 / +2.04 | ×1.27 / ×1.13 / ×1.15 | **×2.61 / ×1.61 / ×1.67** |
| Vienna | 85.34 / 106.67 | +1.04 / +0.34 | ×1.07 / ×0.99 | ×1.24 / ×0.97 |

**In each scene's own units** (what the shader actually multiplies by, on the headline pair), against what `lvl` gave:

| scene | the term | on `lvl` (0.606 → 0.866) | on the base light (0.460 → 0.891) |
|---|---|---|---|
| FEIGEN | `0.45 + 1.3·uLevel` (filaments) | ×1.273 | **×1.535** |
| FEIGEN | `0.4 + uLevel` (Green bands, interior) | ×1.258 | **×1.501** |
| MANDALA | `0.35 + 1.3·uLevel` (the fractal body) | ×1.297 | **×1.591** |
| POLYTOPE | `0.35 + lvl` (the stroke) | ×1.272 | **×1.532** |

The shaders' constant terms are what keep the ratio under the field's own ×1.93 — and what keep a base light of 0 from
being black: FEIGEN's filaments idle at 0.45/1.75 = 26 % of full, MANDALA's body at 0.35/1.65 = 21 %, POLYTOPE's stroke
at 0.35/1.35 = 26 %. On the void → drop 1 pair the same terms read ×1.84 / ×1.75 / ×2.01 / ×1.83.

#### FEIGEN (id 6) — `99c9cb7`

One line: the `glow` param's `from()`. `uLevel` in both colour passes IS "the brightness of the filaments, the bands
and the interior" (the scene's own comment since v0.5), so it is the one thing here that must not ride an AGC. `dive`
keeps `lvl`: how FAST the fall goes is motion, not light, and the AGC's "there is a lot going on" is the right input
for it. The param stays routable (CONTRACTS §1.15), so the listener can put anything back on it.
`feats` + `loudRel` / `loudRange` / `loudAbs` with a `help.feats` line each; `lvl`'s line now says "how fast the dive
falls (the brightness moved to loudRel)".
**md5** (`IDS=6 PORT=8892 tools/scene-md5.sh`, errs []): s6-f360 `8d6ac4a6` → **`39d51392`**, s6-f840 `9adb1f5b` →
**`f4032da8`**. **And `&loud=0` reads `8d6ac4a6` / `9adb1f5b` — v0.14's own two lines, bit for bit**: the A/B is exact
and the migration is the only thing that moved.

**A bug this found, in phase 2's own stage.** FEIGEN's md5 did not move on the first attempt: `loudStage` wrote
`S.loudAbs = -1` under `ENGINE.fakeOn` and so CLOBBERED the mirror `sources/fake.js` had just written, leaving every
migrated scene on its fallback on the one timeline every md5 proof in this project is taken on. The stage now returns
without touching the six fields under `fakeOn`. Two more fake-mirror fixes came with it: the amplitude floor is 0.12
rather than 1e-3 (at `eM` 0 the first frames read −60 LKFS and seeded `loudRange` with a 54 LU swing the EMAs then
spent 40 s forgetting — it read 34.1 LU), and the mirror now applies the real stage's own warm-up guard, so it has the
field's SHAPE and not just its units. The fake loop now spans about −11.1 … −2.1 LKFS with ~9–11 LU of range.

#### MANDALA (id 2) — `f94b1c0`

One line: `S.lvl = baseLight(…)`. `uLevel` here is the BODY's brightness and nothing else —
`palM(…) · pow(acc·3.2, 2.6) · (0.35 + 1.3·uLevel)` — and the per-hit lift needed no new term, because in this scene
the hits are already their own uniforms on their own terms: the trap ring `0.12 + 1.4·uBands.z + 0.8·uHat` and the
centre flare `uKick·0.8 + uDrop·1.2`, both untouched and both still on the AGC, which is right (§60 step 1: a quiet
section's kick is still a kick). `feats` + the three fields with a `help.feats` line each.
**md5** (`IDS=2`, errs []): s2-f360 `9a57626c` → **`1124721c`**, s2-f840 `5e59be93` → **`cb3442e9`**; **`&loud=0`
reads `9a57626c` / `5e59be93`, v0.14's own two lines.** The body's own ratio on the headline pair: **×1.297 → ×1.591**.

#### POLYTOPE (id 5) — `630fdf1`

One line: the stroke's base brightness, `GAIN · 0.75 · (0.35 + base) · presence`, where `base` was `MS.lvl`. The
per-hit lift is `p.pulse = 1 + 0.4·MS.hit` and the beads are `grooves.js`'s own trains — both untouched, both still on
the AGC. `feats` + the three fields, `help.js` + a line each. `index.js` stays at **349 lines** (the comment went onto
the end of the statement line rather than above it, because the file was at 349 and the import spends the last one).
**md5** (`IDS=5`, errs []): s5-f360 `06b46063` → **`4bcf26a3`**, s5-f840 `cccb0094` → **`c7469414`**; **`&loud=0`
reads `06b46063` / `cccb0094`, v0.14's own two lines.** The stroke's own ratio on the headline pair:
**×1.272 → ×1.532**.

#### Phase 5 end to end — the fake-timeline sweep, and the cost in the page

`PORT=8892 tools/scene-md5.sh p5all`, all 12 ids, `errs []` and `hop 840 row 72` on every one. **Exactly the three
migrated scenes' six lines moved and nothing else**, against `tools/accept/v0.14/scene-md5-v014.txt`:

| | f360 | f840 |
|---|---|---|
| s2 MANDALA | `9a57626c` → **`1124721c`** | `5e59be93` → **`cb3442e9`** |
| s5 POLYTOPE | `06b46063` → **`4bcf26a3`** | `cccb0094` → **`c7469414`** |
| s6 FEIGEN | `8d6ac4a6` → **`39d51392`** | `9adb1f5b` → **`f4032da8`** |

s0 `fb74fee4` / `8a0715df`, s3, s4 `0bff278a` / `05bf21c0`, s7, s8, s9, s10 are **line for line equal** to the v0.14
list (s0-f840 and s4-f840 being §54 addendum 2's recorded moves); s1 is `42e4871c` / `6eae9916`, the parallel DUST
worker's, unmoved between the phase-2 and the phase-5 sweeps of this session; s11 `8a930b26` / `5a5c795a` post-dates
that list and is also unmoved between the two sweeps. **And under `&loud=0` all three scenes read their v0.14 lines
bit for bit** — so the six md5 lines that moved are the migration and nothing else in the engine is reachable from here.

**The cost in the page.** `#test&track=SeeYouDrop&at=20&scene=6`, CLOCK=1 GPU=1, 1800 frames (heard 20 → 49.97 s),
`errs []`, `nonFinite []`, three pairs interleaved with `&loud=0`:
`ENGINE.LOUD.cpuTotal / blocks` = **10.99 / 11.84 / 12.02 µs per 512-sample block → 17.2 / 18.5 / 18.8 µs/frame** at
48 kHz / 60 fps, i.e. **0.11 % of a 16.7 ms frame**. That is 3× the 3.73 µs/block node measures, which is the per-sample
loop under headless Chrome's JIT (the accounting's own two `performance.now()` calls are nanoseconds); in **deterministic
file mode the source pushes on the main thread inside `file.tick`**, so this is synchronous frame work and the honest
number. It is invisible in the frame: `ENGINE.ms` ON 3.607 / 2.817 / 2.691 ms against OFF 3.137 / 2.438 / 3.894 — the
stage is **inside the ±1.2 ms run-to-run spread of a headless det run** — and `CARD.bench(6, 300)` ON 1.406 / 1.187 /
1.629 against OFF 1.337 / 1.303 / 1.555 ms, which is the same number twice, as it must be: the stage is CPU and
`bench` measures the draw. (DUST, which the plan's proof 4 names, was being edited by another worker in this worktree,
so benching it would have measured their work in progress; FEIGEN, a scene this phase moved, is benched instead.)

#### Det / capture parity — what `loudRel` does when the gain is the tab's (the plan §6)

- **The capture path's gain is the TAB's**, set by the user's OS / browser mixer, so `loudM` / `loudS` / `loudPk` are
  not absolute there. `loudAbs` says so (0), and `baseLight` never reads an absolute value — only the DIFFERENCE
  `loudS − loudPk` (through `loudRel`) and `loudRange`.
- **`loudRel` and `loudRange` are gain-invariant, and that is measured, not argued**: `tools/test_loud.js` `gain`
  multiplies a whole 60 s signal by 0.1 and reads `loudS` exactly **−20.00 LU** lower (max |error| 8.3e-10 LU) while
  `loudRel` and `loudRange` are **identical to 8.0e-13 and 0.0e+0**. A constant gain `g` adds `20·log10(g)` to `loudS`
  *and* to `loudPk`, which cancels in the difference, and shifts both of `loudRange`'s percentiles equally. **A scene
  that reads only `loudRel` / `loudRange` behaves identically in file and capture mode.** That is why the three
  migrated scenes read exactly those two and `loudAbs`, and nothing absolute.
- **No new lag term.** The ring is read at `MS.heardT` like every ears field, so `SYNC_OFS` (`&sync=27`) aligns it the
  way it aligns the ears' `…Age` fields and nothing else has to be declared. In deterministic file mode the bus is
  `PCM.local` and the source pushes exact 512-sample blocks, so two runs are byte-identical — `test_loud.js`'s `determ`
  case asserts it in node and the md5 sweep asserts it in the page.
- **The ring's lookback is the one hard limit**: `read(t)` needs `t − 3 s` to still be in the ring, which the default
  12 288 entries put at **5.2 s** behind the newest block (48 kHz). heardT is at most `DET_LEAD` 43 ms + the display
  lead behind it, so that is ~50× the worst lag; past the limit a read returns the floor rather than a wrong number
  (asserted).
- `node tools/parity.js fake` was run after phase 2 (every MS field identical to 1e-9); phases 3, 5 and 7 add no
  engine field and no scene edit can move MS, `NAV`, `GROOVE`, `SC` or `Q`, which is all that run compares.

### Phase 7 — NAV and GIELIS reviewed, nothing changed, and the `eG` decision (`05b06cf`)

The plan budgeted "≤ 2 lines" here and the answer is **0**. Both reviews, with the reason.

**NAV (ids 0 / 4).** Four `eM` / `eS` reads, and the plan's guess ("one a bloom param") is not what is there:
1. `post.fb.decay = 0.7 + 0.16·eM` — the FEEDBACK decay, not the bloom (whose `thr` is the constant 0.35). It is the
   only `eM` in NAV's look path, and **the term is dead**: §57 measured `eM`'s p25 at 0.972 on this material, so the
   decay sits at ~0.855 whatever the music does. Moving it to the base light is **not** a one-line drop-in: a feedback
   decay's steady-state gain is `1/(1 − d)`, so 0.72 → 0.84 is **3.6× → 6.3× of accumulated brightness** — four times
   the lever the three migrated scenes got, on the HOME scene, where a long trail is also a motion decision and not
   only a brightness one. **Recommended, not done**: it wants its own A/B in front of the user, like §57–§60 ran DUST.
2. `score` on the DRUM variant, `0.3·(1 − eM)` — a **bid**. The AGC is what makes a bid comparable across tracks
   (CONTRACTS §1.13 marks it "the bid:"). No change, by the plan's own rule that every detector keeps the AGC.
3. `reach`, `clamp(mix(−2.6, −9, 0.55·eS + 0.5·tension) + 3.2·dropEnv, …)` — how far outside the set a drop throws the
   picture. Geometry on a transient, not base light. No change.
4. `modes[j·4+2] = … · (0.3 + 0.7·eS) · presence` (the DRUM variant's membrane amplitudes) — `eS` is the 0.3 s window,
   a transient channel, and the plan's own rule is "scale the base, not the hits". No change.
   (`nav.js:238`'s `eS > 0.3` is a gate. No change.)

**GIELIS (id 10).** One read: `breath`, `0.5 + 0.5·eS` — "how deep every shape pinches on the beat". That is a SHAPE
on a transient, not light; GIELIS's own light is `glow`, which is `FLOOR·(1 − GLOWQ·max(hush, calm))` and touches no
AGC energy at all. **Nothing to move**, and the plan's "expect one `feats` param" overestimated it.

#### The `eG` decision (the plan's proof 5): KEEP it, and never read it as a loudness

`eG` is the track map's own energy arc — the per-100 ms sum of the analysis bands, mapped **p5 → 0, p98 → 1 over the
whole track** (`engine/map/map.js`, `EG_FPS` 10) — non-causal and file-mode only (`mapOn` 0 in every live mode). The
plan called it "the proof that the quantity is useful". Measured against the causal field, by building the real map in
node on each 48 kHz dump (2.98–4.33 s per track) and reading `eG` at every 60 fps frame:

| track | r(eG, loudRel) | r(eG smoothed to 3 s, loudRel) | ρ | eG's own drop ratios | the music's (power) |
|---|---|---|---|---|---|
| SeeYouDrop | 0.480 | 0.656 | 0.638 | ×5.92 (×2.84 smoothed) on the headline pair | **×1.94** |
| CyborgNinja | 0.065 | 0.553 | 0.566 | — (no drops) | — |
| Malicious | 0.234 | 0.423 | 0.431 | **×1.84** at 148.29 s | **×0.96** |
| WhoLikesToParty | 0.109 | 0.583 | 0.251 | ×3.21 / ×2.35 / ×2.08 | ×2.26 / ×1.51 / ×1.60 |
| Vienna | 0.479 | 0.679 | 0.597 | **×8.90** at 85.34 s · **×2.45** at 106.67 s | ×1.27 · **×1.08** |

**They are not the same quantity.** Even smoothed onto the same 3 s timescale the two agree at r 0.42–0.68, and `eG`
**over-states** every transition by 2–7×, because a percentile map over a whole track is a **RANK, not a loudness**: a
quiet bar sits near 0 however few LU down it actually is. On two of the eight drops it claims a rise the music does
not have — Vienna's 106.67 s reads ×2.45 against +0.34 LU (×1.08) and Malicious's 148.29 s reads ×1.84 against
−0.19 LU (×0.96). A scene that put its base light on `eG` would be lying about the music in file mode and reading 0 in
every live one.

**So: `eG` is kept, unchanged, and documented as a rank.** Retiring it is not free — one scene already reads it.
`scenes/chladni/index.js:299`: `U.drive = AMPK · lvl · (mapOn > 0.5 ? 0.35 + 0.65·eG : 1)`, i.e. **CHLADNI's plate is
driven differently in file mode and in every live mode**, which is exactly the split `loudRel` exists to close (the
plan's phase-5 table says CHLADNI "reads `hush` only — nothing changes"; it reads `eG` too). **The recommendation out
of phase 7** is that CHLADNI's one `eG` term becomes `baseLight(…)`, which works in every mode and does not over-state
— but CHLADNI's look is the user's, signed off at v0.15, so it is a phase of its own and not a review's two lines.
`eG` keeps its place as the only non-causal whole-track arc, which is the right input for a *file-mode* section-level
decision (where its rank normalisation is a feature, not a fault).

## §64 the hat's trigger quality, and the sub void — Vienna's sparkle and Vienna's drop (2026-09-30, one worker; the user on DUST: "the high hat that starts at 0:25-1:00 still seems jerky also (wonder if the sparkly / dreamy sounds are interfering in the high section?)" and, on §61's open item, "fix it"; report `docs/workers/VIENNA-TUNING.md`, `docs/AUDIT-live-grid.md` "B.4")

### Task 1 — the hat voice is jerky on Vienna 0:25–1:00

**What "jerky" measured as.** Not the rate, not the decay, not an amplitude chatter the rim can see: it is **fires in
the wrong place**. Over Vienna 20–110 s (`tools/dust-trace.js`, DUST, `&map=0`, graded against `tools/truth/Vienna.json`
`onsets.high` within ±50 ms, with a new `dinfo()` fire counter `fH` / `aH` / `srcH`) the hat voice fires **310 times for
224 truth hats** — the right density — and only **59 %** of those fires are hats. The 125 that are not land a median
**86 ms off the 8th-note line** (the real ones land 3 ms off), they flash at the voice's **floor 0.200** against a
confirmed hat's **0.757**, and only **76.8 %** of all fires sit on the truth's 16th grid against the truth's own 91.1 %.
The user's control, CyborgNinja, reads **P 0.99** with 8 % of its fires at the floor. So the eye is handed an uneven
rhythm, big and tiny alternating, where the ear hears even 8ths.

**The cause is the SCENE's trigger reading an ENGINE picker that is wrong there.** The user's hypothesis is confirmed
and the mechanism is specific: the false fires happen where `highS` reads **0.643 against the real hats' 0.283** and is
RISING (`highS` − its own 2 s EMA: **+0.058** at a false event, **0.000** at a real one), and `ears/perc.js` is an
HPSS-lite whose harmonic part is a RUNNING MEDIAN of each band's dB envelope — a median lags a swell, so a pad's, an
arp's or a reverb tail's leading edge rises above it and is released as a percussive onset. Per track, the share of the
ears' hat events that synapse's `hat2` confirms (≥ 0.10 within ±2 frames) is **90 % of the real ones and 2 % of the
false ones** on Vienna, 75 / 30 % on SeeYouDrop, 98 % / — on CyborgNinja. `hat2` is the precise picker here (P
0.96–0.99 everywhere); `hatEvt` is the loose one (P **0.56** Vienna, 0.71 SeeYouDrop, 1.00 CyborgNinja). §58's union
was chosen for coverage, before anyone measured precision.

**The fix (`assets/scenes/dust/voices.js`, `index.js`).** The ears' hat EVENT does not fire the voice while the high
band is more than **R = 1.05** times its own **TC = 2 s** average — a band getting louder on its own is a swell, and a
swell's edge is not a stick. `hat2`'s rising edge still fires the voice, and the ears' age still places a hit the level
confirms, so no timing moves. The picker itself is untouched (the engine item: `docs/OPEN-ITEMS.md` §64 items 1–2).
Knob for the user's own A/B: `&bed=<ratio>,<seconds>` under `#test`, `hooks.bed(r, tc)` from the console, `99` = off.

| page window (truth hats/s) | fires/s | P | §58 coverage | at the floor | on the 16th grid |
|---|---|---|---|---|---|
| **Vienna 20–110** (2.49) | 3.44 → **2.38** | 0.59 → **0.80** | 96.8 → 91.9 % | 49 → **26 %** | 76.8 → **88.8 %** |
| **Vienna 85–107**, the double time (3.00) | 4.32 → **3.23** | 0.60 → **0.77** | 95.4 → 93.8 % | 45 → **27 %** | 76.8 → **88.7 %** |
| SeeYouDrop 20–110, §58's window (3.29) | 4.33 → 3.91 | 0.71 → **0.74** | 95.9 → **94.9 %** | 51 → 44 % | 80.0 → 80.7 % |
| CyborgNinja 20–50 (7.67) | 7.63 → 7.57 | 0.99 → 0.99 | 94.7 → **94.7 %** | 8 → 7 % | 79.5 → 79.3 % |

The brief's floor was SeeYouDrop coverage ≥ 93 %; it reads **94.9 %**, and its precision went UP. The median gap between
flashes on Vienna becomes the 8th note itself — 250 → **333 ms** against the truth's 325. The rim's own picture is
untouched where it was right: `lumR` p95/p05 range 4.572 → 4.632 (Vienna), 4.196 → 4.199 (SeeYouDrop), 2.794 → 2.794
(CyborgNinja); `|ΔlumR|` p50 1.420 → 1.419 / 2.431 → 2.438 / 2.546 → 2.547. The fires that survive are bigger (amp p50
0.229 → 0.374; the matched ones 0.522 → 0.659) because the ones that went were the floor-sized ones.

**Measured and REJECTED**, each with the number:
- **The DIFFERENCE form the brief proposed** (`highS` minus a slow EMA of itself, "a real step above the high-band
  bed"): it discriminates (real +0.000 / false +0.058) but its operating point does not travel — the bed is 0.28 on
  Vienna and 0.62 on SeeYouDrop, so one absolute step is 7 % of the band on one and 3 % on the other, and the threshold
  that cleans Vienna (0.02) takes SeeYouDrop's coverage to **92.2 %**, under the floor. The RATIO is the same idea,
  normalised; swept over TC 1 / 2 / 3 / 5 / 8 / 12 s × R 1.03 / 1.05 / 1.08 / 1.12 / 1.18, 1.05 at 2 s is the knee with
  the most SeeYouDrop margin (1.03 → SeeYouDrop 92.2 %, 1.08 → SeeYouDrop 94.6 % for 3 points of Vienna's precision).
- **Dropping `hat2`'s edge and keeping the ears alone** (the brief's first candidate, "band-limited onset detection"):
  the ears are the unreliable half — Vienna 3.44 → 3.08 fires/s at P 0.59 → **0.56** with 55 % at the floor.
- **Gating the ears' event on `hat2` confirming it** — the cleanest discriminator by AUC (0.93 Vienna 20–65, 0.99
  Vienna 85–107, 0.77 SeeYouDrop): Vienna P 0.59 → **0.95**, but SeeYouDrop's coverage falls to **85.4 %**, because half
  of its real hats are invisible to synapse's picker. Same for the edge alone (85.4 %). This is §58's reason for the
  union, and it still holds.
- **A self-calibrating version of that gate** (require confirmation only while the level's own recent confirmed hits are
  loud — a 20 s peak-hold, 0.74 on Vienna against 0.34 on SeeYouDrop over 20–50 s): over the full 20–110 s window
  SeeYouDrop's hold reads 0.52 (p50), the gate switches on there too, coverage **92.2 %**. A 20–50 s window was not
  representative; the knee moved with the window, which is the sign of a fit rather than a rule.
- **A smaller floor for an unconfirmed fire** (0.08 instead of 0.20): it keeps every coverage number — the envelope
  still rises — and dims SeeYouDrop's real-but-unconfirmed hats (amp p50 0.22 there) by the same factor as Vienna's
  false ones. It makes the metric pass without making the picture better.
- **A rate limit** (§61 rejected it already, re-measured here): at 8 Hz, Vienna P 0.59 → 0.63 and CyborgNinja loses
  69 of 229 fires.

### Task 2 — `dropLiveEvt` never fired on Vienna

**Why.** Not a bug: **Vienna has no void of the kind §54 reads.** Whole-track node run (`tools/build-node.js Vienna`):
`bassS` sits at 0.51–0.83 all through, its 2 s / 32 s ratio bottoms at **0.514** for 4.6 s (the dream, 68.9–73.5 s) and
is back over 0.85 **eleven seconds** before the drop; `hp`'s 5 s mean peaks at **0.166** over the same 4.6 s and is 0
from 74 s. **One** void run in 192.6 s, armed 69.3–76.3 s, and the drop is at 85.336. The slam could not have fired
either: at 85.343 `bassS` reads **0.97 ×** its own 2 s mean (`RET` 1.75) and `sub` **2.14 ×** (`SUB_RET` 5), against
SeeYouDrop drop 1's 2.80 × and 15.7 × — SeeYouDrop's bass had been at 0.04, Vienna's never left. (The clock is also in
the wrong octave from 88 to 108 s, `bpm` 119.9 against 90 — §61's open item — and `barConf` 0.02–0.75, so synapse's bar
anchor is never taken; neither of those is why it did not fire.)

**What IS out: the SUB.** The ears' causal sub gate is shut from **69.7 to 85.8 s — 16.05 s, 6.02 bars** — and the drop
IS the sub note coming back (`sub` 0.356 → 0.991 on one frame, two low onsets at 85.343 / 85.354, **+7 ms** from the
truth). Over all five tracks the longest sub-gate-shut run (2 s box mean < 0.2, after `MIN_HIST`) is Vienna's 6.02 bars,
then **SeeYouDrop 3.85** (before its own drop 1, which the void path already arms 15.9 beats ahead), **Malicious 3.37**
(twelve runs, 0.70–3.37), and WhoLikesToParty and CyborgNinja **never reach a bar**.

**The change (`assets/engine/build/build.js`, `feed.js`, `features-build.js`): a SECOND arming path, the sub void.**
`SUBV_OFF` 0.2 (the gate's 2 s mean below which the sub is out; 0 = the path off), **`SUBV_HOLD` 4 bars** — the hold
that clears Vienna's 6.02 and every other track's longest by 57 % — armed on the next bar line as before; the slam is
the same on-beat low onset confirmed by `sub` ≥ **`SUBV_RET` 2** × its 2 s mean, with no `SLAM_AFTER` wait (the void has
already run four bars before this path arms, so the first bass return is not a pickup); and the bass/hp void lifting now
disarms a bass/hp arm only. **The gate is the CAUSAL one**: `MS.subGate` is the file map's when a map is ready
(`features-ears.js mapOverride`), and this stage must read the same inputs in every mode — the same reason §54 took the
ears' low lane over the map's onsets — so `features-build.js` passes `EARS.ears.out.subGate` to `feed()`, and node and
`build-replay.js` read it from the trace where it is already causal. §54's objection to `subGate` is answered, not
overruled.

**Node, `&map=0`, det, five tracks** (`build-replay.js`; SeeYouDrop 1 2 · WhoLikesToParty 1 2 3 · Malicious · Vienna 1 2):

| rule | before | after |
|---|---|---|
| `buildLive>=0.4` anticipation, beats | 15.9 7.9 · 11.0 7.0 11.0 · 0 · **0 0** | 15.9 7.9 · 11.0 7.0 11.0 · 0 · **4.4 0** |
| `dropLiveEvt` lag | −6 +21 · +10 +48 +12 · — · **— —** | −6 +21 · +10 +48 +12 · — · **−3 —** |
| armed at drop · events | 5/8 · 5 | **6/8 · 6** |
| false arms / min drop tracks · CyborgNinja | 0.14 · **0** | 0.14 · **0** |
| false events anywhere | 0 | **0** |

The replayed traces for SeeYouDrop, WhoLikesToParty, Malicious and CyborgNinja are **md5-identical with the path on and
off** (`d61565e3` / `498acde0` / `cb8e2724` / `54759f6d`): only Vienna moves. Sweep: `SUBV_OFF` 0.5 arms Malicious 3.9
beats before its drop and takes false arms 0.14 → **0.36**; `SUBV_HOLD` 3 gives Vienna 8.3 beats for false arms →
**0.22**; 5 loses the anticipation (the arm lands inside the last beat, the event still fires); `SUBV_RET` 1.5 changes
nothing and **3 loses the event**. So 4 bars is the only hold that buys the drop and changes nothing else, and
`SUBV_RET` 2 is tuned on one drop — noted as open.

**Vienna's SECOND drop (106.6693) is not detectable causally, and nothing was shipped for it.** `buildstudy.py` over all
five tracks: of 60 candidates × 7 grains × 4 causal transforms, at PRE 4 bars and PRE 8 bars, **every one gives it a
lead of 0 beats**. In the 20 s before it `hp`'s 5 s mean is 0.000, `bassS` 2 s / 32 s bottoms at 0.887, the sub gate is
open throughout, and at the drop `bassS` reaches 1.25 × its 2 s mean and `sub` 1.32 ×. The brief's second lean (a
tension accumulator: energy slope, centroid rise, onset density) was measured in that study — the candidates that would
arm it at all (`presence` dev 5 s, `novelty`, `flux` dev, `eFast`, `eShort`) carry **0.35–6.71 CyborgNinja false arms /
min**. Vienna's bar 40 is a density / texture jump (the double-time layer thickening) with no causal precursor.

**`tools/truth/Vienna.json`:** `drops` is now the HAND list **85.3359 / 106.6693** (bar 32, the user's own "first drop at
1:25", and bar 40 — trackmap's 105.639 snapped to the bar, an independent Foote novelty peak at 106.626 and the one full
low+click+mid+high hit there); `drops_tool` keeps trackmap.py's own list, `drops_note` says why. Every ruler that reads
`drops` (`dropcheck.py`, `buildstudy.py`) now grades the drops the user named; `trackmap.py` already preferred
`drops_user`.

**Page `&map=0&lead=0`, Vienna whole track** (`tools/filetrace.js`, graded by `dropcheck.py`): **armed 4.9 beats
before the drop, `dropLiveEvt` +14 ms, 0 false arms / min over 3.2 min, 1 event, 0 on the second drop.** `buildLive`
runs 71.42–76.23 (the dream, max 0.66) and **82.10–85.35 (max 1.00)** — so DUST's contraction and palette drain get
the last 1.2 bars and the slam releases on the drop. `dropLiveIn` points **+3.0 beats late**, because synapse's
`barConf` never reaches the 0.9 anchor gate on this track (and §61 measured its bar line 2 beats off), so the detector
is on v3's own arbitrary count mod 4; the EVENT is right anyway because the slam keys on BEAT lines, not bar lines.
A scene's last-bar wind-up (`nextDropIn`) is therefore on the wrong beat of the bar on Vienna — the same open item
§61 raised, not a new one.

**Page = node** (`build-node.js --cmp`, the `&map=0&lead=0` page trace against the `--disp 0` node run, 11520 frames):
**`subGate` identical on 11520/11520 frames (max |diff| 0.00)** — the causal gate is the same quantity in both, which
is the claim the implementation rests on; `bassS` / `sub` to ≤ 5.8e-5; `dropLiveEvt` 11519/11520 (the one frame is the
event itself, node −3 ms / page +14 ms — one frame apart); `buildLive` 94.7 % and `dropLiveIn` 95.8 % of frames, the
difference being the arm's bar line (node 82.38, page 82.10).
**The causal gate, proved:** the same Vienna page run with `&map=1` (the file map on, so `MS.subGate` IS the map's)
against `&map=0`. `MS.subGate` differs on **1748 of 11520 frames** (a boolean flip, max |diff| 1) — and `buildLive`,
`dropLiveIn` and `dropLiveEvt` are **identical on all 11520 frames**, with `dropLiveEvt` at 85.35 s and the arm at
82.10 s in both. The stage reads `EARS.ears.out.subGate`, so the map cannot reach it.
**A finding worth recording:** on Vienna the NODE harness's v3 clock is in the wrong octave for part of the track
(`bpm` p50 143.1 / 119.9 / 120.0 over 0–20, 80–100 and 140–160 s) while **the page reads 90.1 for the whole track**.
Vienna's octave margin is the thinnest in the set (§61: its 40–150 Hz on-beat / half-beat ratio is 1.031), so the
small input differences between `tools/node-stream.js`'s det stream and the page's file source flip it. The page is
the one that is right, and it is the page the user watches; but **a node-only grading of anything clock-dependent on
Vienna is not the page's answer** — the numbers above are the page's.

### Proofs

- `node tools/check.js` **0 fail** (157 modules, 205 MS keys, help.feats gaps 0, 5 pre-existing soft-cap warns) ·
  `npm test` **OK**, `tools/test_build.js` now 26 cases (six new for the sub void: too short does not arm; longer arms
  on a bar line with the BASS STILL IN; the void's own bass-less on-beat kicks never fire; the sub back at 2.5 × its 2 s
  mean fires once on the onset's frame with `bassS` flat and under `SUB_RET`; `SUBV_OFF` 0 makes the same stream inert;
  an input with no `subGate` reads as "the sub is there", so every caller written before §64 behaves as it did; and
  `SLAM_AFTER` 4 bars does not gate the sub-void slam).
- **s1 fake-timeline md5 UNCHANGED: f360 `42e4871c`, f840 `6eae9916`** — §61's own two lines. The hat veto cannot move
  it (the ears stage never runs under `#test`, so `highS` and `hatEvt` are state.js's defaults there) and the build
  stage returns early on `ENGINE.fakeOn`. The other accounted-for lines are untouched for the same reason (s0-f840
  `8a0715df`, s4-f840 `05bf21c0`); the loudness worker's own lines moved in parallel and are not this worker's.
- `CARD.bench` not re-run: the cost added is one scalar EMA per frame in the scene and one `BoxMean.push` per frame in
  the build stage.

## §65 DUST migrates onto true loudness — LOUDNESS phase 4, and §60's one failure is fixed (2026-09-30, one worker; `docs/plans/LOUDNESS-PLAN.md` §8, report `docs/workers/DUST-OVERHAUL-PASS2.md` "Pass 2 addendum")

§60's one failure was SeeYouDrop's **breakdown 2**: the picture did not get dimmer there, because the engine's energy
does not know the drop after it is louder (`eM` ×0.994 where the music is +2.88 LU / ×1.94 in power). §63 built the
causal, AGC-free loudness that answers it and migrated FEIGEN, MANDALA and POLYTOPE onto the shared mapping
`assets/math/loudlight.js` `baseLight(loudRel, loudRange, loudAbs, fallback)`. This is phase 4: **DUST, the scene that
paid for the problem privately, gives up its private peak and reads the same mapping**, so there is ONE definition and
ONE calibration across four scenes. Commit `94e4d8b`. **Not tagged, not pushed, not deployed.**

### The lean — one line of drive, and what deliberately did NOT come across

`dust/dyn.js` held a track-level running peak on `eM + ½·max(0, eS − eM)` (instant attack, 25 s release, floored 0.84)
and drove the cloud's base brightness, grain size and swarm radius with `eM / peak`. Now:

    D.fb   = clamp01((D.r - LO) / (1 - LO))                        §60's drive, kept LIVE as the fallback
    D.base = baseLight(MS.loudRel, MS.loudRange, MS.loudAbs, D.fb) the drive (loudlight.js, the shared mapping)
    D.dyn  = min(1, max(D.base, MS.dropEnv, rel))                  the slam's floor, unchanged

The private peak **keeps running** rather than being deleted: it is what `baseLight`'s `loudAbs < 0` branch returns, so
`&loud=0` is bit-exact against §60, and so flipping the switch mid-stream does not hand the scene a peak frozen since
the track began. `PK_REL` / `PK_FLOOR` / `LO` survive as the fallback's constants and are documented as such.

**The 25 s release did not come across** (§63 phase 2 decision 1): on a mean square that is 0.174 dB/s, which forgets
6.6 LU in the 38 s between SeeYouDrop's drop 1 and its breakdown 2 — more than the whole track's 4.96 LU of range, so
the hold would decay *under* the present loudness and both ends of the very pair this migration exists to separate
would read 1.000. `loudPk` releases at 0.02 LU/s. **The 0.84 floor was not re-invented as an absolute one** (§63
decision 2): the other four test tracks master 8–9 LU quieter, so an absolute floor binds for their whole length and a
quietly mastered track is permanently darker — the AGC's own sin inverted. `loudPk`'s relative warm-up guard
(`loudS + 4·exp(−age/6 s)`) already solves §60 step 4's bright intro, and the table below shows it does.

### §60's pass-2 table, re-taken BACK TO BACK on one tree

**The measurement condition changed on purpose**: §60 traced with `WARM=8`, i.e. the file opened 8 s before the window.
`loudPk` and `loudRange` are *causal* — they are what the stage has heard so far — so a mid-track start measures a
field the listener never sees. Every number below opens the file at **t = 0** (`WARM=20`), the real listening
condition and the one §63's `L_RNG_MIN` sweep was done in. Both sides of every pair were traced back to back, and
**the MS columns are md5-identical across all six pairs** (`beatCount` / `dropEnv` / `eM` / `loudRel` / `loudPk` /
`loudRange`, §60's own validity rule) — the engine did not move, only the scene did.

| SeeYouDrop 20–110 s (`&map=0`, CLOCK=1) | before | after |
|---|---|---|
| **breakdown 2 → drop 2, equal 5.1 s windows** | 120.5 → 125.2 = **×1.039** | 114.5 → 147.7 = **×1.290** |
| **breakdown 2 (§60's own 100.5–104 window) → drop 2** | 143.2 → 125.2 = **×0.875** (the breakdown was BRIGHTER) | 128.0 → 147.7 = **×1.154** |
| the void before drop 1 (55–57.6 s) · drop 1 | 27.9 · 104.0 — void/drop **0.268** | 36.2 · 86.8 — void/drop **0.416** |
| groove (28–40) · breakdown 1 (49–55) | 92.8 · 60.9 (−34 %) | 69.9 · 45.1 (−35 %) |
| the window's range p95/p05 lum | **4.593** | 4.251 |
| mean luminance | 96.5 | 81.4 (−16 %) |
| base light p05 / p50 / p95 | — (`dyn` 0.261 / 0.873 / 1.000) | **0.248 / 0.532 / 0.764** |

**The gate is met: breakdown 2 improves, and it is the headline.** Where §60 left the second breakdown *brighter* than
the drop that follows it (×0.875), the drop is now half again as bright as the breakdown on §60's own windows and
×1.29 on equal 5.1 s ones. The music's own figure is ×1.94 in power; the picture now moves ×1.29 of it, the rest being
the shader's constant terms (`gBase = .22 + 1.42·uDyn` idles at 13 % of full rather than black) — the same compression
§63 measured for the other three scenes.

**The intro, SeeYouDrop 2–40 s** (`WARM` leaves the file at t = 0 either way, so this pair is directly §60's):

| / groove 28–40 | before (§60) | after |
|---|---|---|
| intro 2–8 s | 0.634 | **0.357** |
| intro 8–14 s | **1.268** | **1.021** |

The 0.84 floor is gone and the intro is *more* clearly the quietest part of the song, not less — `loudPk`'s relative
guard does the floor's job without the floor's cost. §60's **open item 2 is closed as a side effect**: 8–14 s, where
the track assembles itself and the novelty channel used to beat the loudness one (1.268× the groove), now reads
1.021×. The truth agrees with the new reading: the intro integrates to −8.32 LKFS against the groove's −3.99, i.e.
4.3 LU down, and 6.6 LU under the track's peak — which is `L_RNG_MIN`'s whole 7 LU span, so the intro clamps near 0
and is drawn at the shader's idle. That is the measure being honest, not the scene being broken.

**Vienna 20–110 s** (`~/Music/RetinaRave/Vienna.flac`, truth `tools/truth/Vienna.json`, drops 85.336 / 106.669):
mean lum 91.1 → 93.9, range 3.656 → 3.702, pre-drop/drop 0.601 → 0.627 (drop 1) and 0.743 → 0.767 (drop 2). Almost
unmoved, and it should be: §63 phase 3 measured Vienna's two drops at only **+1.04 and +0.33 LU**, so there is nothing
there for a loudness to find. Vienna is the control that the migration does not invent dynamics.

**The quiet tracks are NOT dim for their whole length** — the §8 hazard the absolute floor would have caused:

| track | master (gated LKFS) | mean lum before → after |
|---|---|---|
| SeeYouDrop | −3.88 | 96.5 → 81.4 (**−16 %**) |
| CyborgNinja | −9.05 | 105.8 → 97.1 (−8 %) |
| WhoLikesToParty | −10.03 | 111.1 → **120.9 (+9 %)** |
| Malicious | −12.46 | 90.0 → **109.6 (+22 %)** |
| Vienna | −6.89 | 91.1 → 93.9 (+3 %) |

The two quietest masters got **brighter**, and the only track that dims materially is the **loudest** one — the one
with real breakdowns, which is the whole point. Base light p50 per track: SeeYouDrop **0.532**, CyborgNinja 0.690,
Vienna 0.833, WhoLikesToParty 0.836, Malicious 0.855 — §63's sweep predicted 0.857 / 0.861 / 0.866 / 0.900 for the
four and 0.474 for SeeYouDrop, so DUST lands where the shared calibration said it would.

**The hits are untouched**, within the noise of §58 / §64 (per-hit lum lift, clean hits only, p50 / mean %):

| | snare (body) | hat (rim) | kick (centre) | per-beat peak/trough |
|---|---|---|---|---|
| SeeYouDrop | 5.7/10.4 → 6.5/10.7 | 1.7/8.1 → 3.6/11.3 | — (no clean hits) | 1.409 → 1.458 |
| CyborgNinja | 17.7/28.7 → 16.0/23.7 | 0.6/8.5 → 2.1/8.9 | — | 1.446 → 1.423 |
| Vienna | 3.8/11.9 → 2.7/11.4 | 4.1/11.1 → 3.6/10.6 | 7.4/7.5 → 7.9/7.8 | 1.417 → 1.394 |

`gHit = 1.05 + .45·uDyn` moves one third as far as `gBase` by construction (§60 step 1: a quiet section's kick is
still a kick), and that is what these say.

**The two regressions, stated plainly.** (a) **The void before drop 1 brightens**, 27.9 → 36.2, and void/drop goes
0.268 → 0.416 — §60's best-measured win. The reason is not a bug: the truth says that void integrates to
**−4.68 LKFS against the groove's −3.99**, i.e. it is 0.7 LU quieter than the groove, because it is a riser and a
reverb tail and those are broadband and loud. `eM`'s AGC crashed there and the eye liked it; BS.1770 says it should
not. **This is the one thing in this phase the user may want back**, and it is one term, not a redesign — see the
watch-list. (b) **SeeYouDrop's p95/p05 falls 4.593 → 4.251 and its mean −16 %**, because the whole track moves down
into a band whose bottom the shader's 0.22 idle holds up.

### `&loud=0` — the A/B is bit-exact

| s1, `IDS=1 PORT=8896 tools/scene-md5.sh`, errs [] | f360 | f840 |
|---|---|---|
| before (HEAD `7096ffd`) | `42e4871c` | `6eae9916` |
| **after, default** | **`11ca47d0`** | **`d21222ba`** |
| **after, `&loud=0`** | **`42e4871c`** | **`6eae9916`** — the pre-migration lines, bit for bit |

So the two lines that moved are the migration and nothing else is reachable from here. Only `assets/scenes/dust/`
was touched (`dyn.js`, `index.js`, `help.js`, `shaders.js` — a comment), `loudlight.js` is unchanged, and DUST's files
are imported by nothing else, so no other scene's line can move (`IDS=1` is the whole proof, HARNESS "What to re-prove").

### Proofs

`node tools/check.js` **0 fail** (157 modules, MS keys 205, help.feats gaps 0, **the same 5 pre-existing line-cap
warns** — `dyn.js` 99 lines, `index.js` 336, both under the 350 soft cap) · `npm test` **0 FAIL** (test_loud 38 pass) ·
`feats` + `loudRel` / `loudRange` / `loudAbs` with a `help.feats` line each; `eM` / `eS` keep theirs, reworded as the
fallback they now are · **no audible run** — every number is the deterministic file path.
**Cost**, `q` pinned 0.95, tier 3, `&dyn=1`, five pairs interleaved with NAV, the two legs taken back to back 20 s
apart (medians): **DUST 1.346 → 1.383 ms, NAV 2.086 → 2.155 ms, DUST/NAV 0.645 → 0.641**. **The machine was NOT
idle** — another worker (`tools/work/v66/`) was running its own `dust-trace.js` pages throughout, which is why both
legs sit ~0.9 ms above §60's 1.238 ms and why NAV, which this phase does not touch, "moved" by more (+0.07 ms) than
DUST did (+0.04 ms). **That is exactly the case the interleaved-pair ratio exists for** (HARNESS "Bench protocol"),
and the ratio is the same number twice, as it must be: the drive is one divide and one clamp a frame, and the stage's
own 5.85 µs/frame was already being paid before DUST read it. The absolute ms here are not comparable to §60's.
The TRACES are unaffected by that load — the deterministic file path is frame-locked, so load changes wall time and
not one number — and the six before/after pairs' MS columns are md5-identical, which is the proof.

### Open items

1. **`loudPk` is seeded by a partially-filled window on the first block, and SeeYouDrop pays 1.46 LU for it.**
   `Loud.push` feeds `zAt(tEnd, SHORT_W)` into the instant-attack peak from the very first block, and `zAt` returns a
   mean over as few as 32 samples (`dn >= 32`). SeeYouDrop's file **starts on a loud transient**: its first block
   reads **+0.97 LKFS** (`loudPk` +4.96 with the warm-up guard) against a true track maximum `loudS` of **−1.69**, and
   the 0.02 LU/s release needs **147 s** to walk that off — longer than the track. Measured at 100 s: `loudPk` −1.03,
   **1.46 LU above the honest peak**, so every base light on this track is 1.46/7 = **0.21 too low** and SeeYouDrop's
   intro clamps to 0 where it should sit near 0.06. The other four tracks begin in silence (first block −51 to
   −105 LKFS) and are unaffected, which is why §63's synthetic `peak` case did not catch it. The fix is one condition
   — let the peak attack only on a FULL short-term window, the guard already covering the first 3 s — but it is an
   ENGINE change that silently re-calibrates FEIGEN, MANDALA, POLYTOPE and now DUST, and `L_RNG_MIN` was swept against
   the current behaviour. **A phase of its own, with `L_RNG_MIN` re-swept after it.** Not touched here.
2. **The void before drop 1 (above).** If the user's eye wants §60's dark void back, the honest way is a short-window
   term, not a louder floor: `loudM` (400 ms) resolves a 2.6 s void where `loudS` (3 s) cannot. One term in
   `baseLight`, measured across four scenes, and again not a DUST worker's unilateral call.
3. **`shapeFor()` still uses the absolute `eM < 0.74`** (§60 open item 5), untouched here on purpose so the shape
   sequence §58 verified does not move. It is now the last AGC absolute left in DUST's look path.
4. **The look is the user's**, one scene at a time, the way §57–§60 ran DUST. The watch-list is in
   `docs/workers/DUST-OVERHAUL-PASS2.md`. `tools/accept.sh` still has not been run since v0.14.

## §66 the bounce is a wall-clock crest, and drop 2 is the bass moving up an OCTAVE — Vienna 0:25–1:00 and 1:46.7 (2026-09-30, one worker; the user on DUST: "something still feels off about 0:25-1m the bounce feel slow and jerky on the kick and high hat (?is what I think is there); drop 2 -> at 1:46 what plays? it feels like there is bass starting"; report `docs/workers/VIENNA-TUNING.md`)

Two questions, analysis first. One commit (`c027e8c`, `assets/scenes/dust/grid.js`); nothing shipped for the second
question, because the number says there is nothing to ship.

### Q1 — what plays at 0:25–1:00, in numbers

Offline from the PCM (`tools/work/v66/{q1,q1b,q1c,q1d,kick3}.py` on `tools/work/Vienna.48000.st.f32`, Butterworth band
envelopes, the peak in [line − 10 ms, line + 120 ms] at each 16th line of the 90.00 BPM hand grid, averaged over bars
9–21 with the ODD and EVEN bars kept apart because the groove's own cycle is two bars). dB over the window mean:

| band | slot 0 | 4 | 8 | 12 | the off-8ths (2 / 6 / 10 / 14) | the odd 16ths | what it is |
|---|---|---|---|---|---|---|---|
| **sub 20–60** | 6.7 / 8.9 | 5.1 / 5.5 | 8.3 / 9.6 | 7.3 / 4.0 | 6.5 / 8.8 · 6.0 / 5.6 · 8.2 / 4.9 · 3.7 / 2.6 | 4.8–8.1 | **a continuous D♯1 / F♯1 drone, no pulse at all** (a 7 dB span over all 16 slots) |
| **kick 60–150** | **11.4 / 10.1** | 4.2 / 6.5 | **10.8 / 12.4** | 4.2 / 3.5 | 3.2 / 4.8 · 1.8 / 6.3 · 3.7 / 1.7 · 5.5 / 1.6 | 1.5–6.0, and **slot 15 = 5.7 / 11.1** | **the kick is BEATS 1 AND 3 plus a 16th pickup into the next bar (loud on the even bars) — 2–3 a bar, 0.75–1.125 Hz** |
| **click 150–800** | 2.8 / 6.1 | **13.3 / 12.0** | 4.4 / 6.3 | **13.0 / 11.9** | 4.0 / 4.3 · 3.9 / 1.8 · 1.6 / −3.4 · 5.2 / −2.4 | odd bars add slots 3 and 7 at 6.4 | **a dry rim / clap on BEATS 2 AND 4 — the backbeat, which is what the ear takes for a second kick** |
| **mid 800–5 k** | 4.4 / 3.6 | 3.3 / 2.0 | 3.6 / **11.5** | 5.2 / 8.2 | 2.8 / −5.7 · 1.2 / −5.0 · −0.9 / 8.6 · −2.6 / 10.8 | — | **a gated synth layer on a TWO-BAR cycle: −6 dB over the even bars' first half, +8 to +11.5 over their second** |
| **hat > 5 k** | 10.0 / 10.9 | **13.0 / 12.4** | 6.4 / 10.8 | **12.6 / 12.6** | **11.5 / 12.4 · 11.7 / 12.4 · 10.1 / 11.9 · 9.3 / 11.4** | **−8.8 to +4.3** | **DEAD-STRAIGHT 8ths**, filling to 16ths on bars 17 and 21 only |

**The swing is zero.** The high band's onsets inside the beat: the median off-8th phase is **0.5001** of the beat
against a straight 0.5000 — a **1.000:1** ratio, 0.1 ms late — and the on-8th ones land 7.9 ms off the line. The gap
between high onsets reads p10/p50/p90 **112 / 197 / 341 ms** against the 8th's own 333.

So what the user hears as "the kick" is two instruments: a soft masked thud on 1 and 3 and a dry rim on 2 and 4. The
only continuous lattice in the track is the hats, at **3.00 Hz**. Nothing is on 16ths except bars 17 and 21.

### Q1 — what the engine hears, and what DUST does

The clock is right and §61's fix holds: over 24–60 s the page reads **89.98 bpm**, **54 ticks in 36 s = 1.500 /s**
against the music's 1.500, **100 %** of them inside a quarter-beat of the truth beat line at a **constant −35.9 ms**
(|lag| p50 = p90 = 35.9), and **zero** line moves. `barPos` is still 2 beats off (the engine's bar wrap lags the truth
downbeats by +1297 ms, §61's open item). So the jerk is not the clock.

The four sources, ranked by what they measure (`tools/dust-trace.js` Vienna 24–60 s, `&map=0`):

| # | source | the number |
|---|---|---|
| **1** | **the KICK voice fires in the wrong place, and it cannot be fixed in the scene** | **73 fires** for 56 kick hits (2.03 /s). Its biggest slot bins are **slot 1 (14 fires)** and **slot 3 (10)**, where the music has no kick, against **6 on slot 0** and **2 on slot 8**, which ARE the kick. **P 0.21 / R 0.27**, |dev| from the 16th grid p50 30.7 ms, 67 % on the grid. The matched fires sit at the voice's **FLOOR (amp p50 0.250)** and the unmatched ones are **BIGGER (0.371)** — the real kicks flash small and the false ones flash big. 81 % of the fires are the level's edge, 3 % the ears' event. |
| **2** | **the SNARE voice fires 2.7× too often** | **4.81 /s** against a truth `mid` of 1.81 /s, **P 0.35**, 39 % at the floor, spread over all 16 slots, and tc 0.30 s leaves **57 %** of a hit on the body annulus when the next lands (gap p50 167 ms = the 16th). It is the loudest of the three voices. |
| **3** | **the nudge's crest is 67 % longer at 90 BPM than at 150** | the accent lasts **367 ms** and peaks at **1.08 rad/s** on Vienna against **220 ms / 1.78** on SeeYouDrop, and starts **183 ms** before the line instead of 110. Only **53 of the window's 108 8th lines** carry a nudge. |
| 4 | the HAT voice is **fine** | §64's veto leaves it **96 % on the truth's 16th grid**, |dev| p50 **2.6 ms**, amp p50 **0.757**, **8 %** at the floor, and its slot histogram (14 / 11 / 11 / 11 / 8 / 12 / 11 / 12 on the even slots, 0–2 on the odd ones) IS the straight 8ths. Not touched. |

**Source 1 is an engine item, proved.** `kick2`'s AUC against the kick lines (its peak in [line, +60 ms], kick slots
against the other 184 16th lines of the window) is **0.316** — *below* chance: it reads **0.031** at a kick and
**0.130** at a non-kick 16th. Its mean shape from the beat-1 line over 13 bars is 0.07 at the line rising to
**0.35 at +200 ms** — the lane peaks a quarter-beat after the kick, which is exactly the slot-1 / slot-3 bins. The
**60–150 Hz band's own RISE** (the peak in [−5, +60] ms over the mean of [−85, −5] ms) separates the same lines at
**AUC 0.999** (+11.21 dB at a kick against +4.56 elsewhere), so the information is in the audio and the lane throws it
away: Vienna's low end is a loud continuous 38–46 Hz drone and the kick is a soft masked thud above it. Nothing else
low carries it either — `bassS` 0.546, `eS` 0.543, `eM` 0.515, `subGate` 0.500 — and the only engine signal that does
is `lvl` (0.925), which is the beat grid in disguise. **No scene-side gate can rescue a signal with AUC 0.316.**

**§64's swell veto does not transfer to the snare**, measured: `midS` / its own 2 s EMA separates the snare voice's
matched from its unmatched fires at **AUC 0.615** (the hat's was 0.93 on this track), and every ratio from 1.03 to 1.18
holds precision at **0.34–0.36** while taking recall **0.92 → 0.83**. Rejected.

### Q1 — the change: `WREF`, the accent's wall-clock width (`assets/scenes/dust/grid.js`, `c027e8c`)

`W` is a width in BEATS, so §61's own .45 / .55 pair gives a different crest at every tempo
(`tools/work/v66/nudge66b.py`, grid.js's `spin()` reproduced at 60 fps on an exact clock):

| track | bpm | accent | lead | v peak | v floor | floor/peak | dead | \|a\| p99 |
|---|---|---|---|---|---|---|---|---|
| CyborgNinja | 160.0 | 206 ms | 103 ms | 1.916 | 0.236 | 12.3 % | 0 % | 23.4 |
| SeeYouDrop | 150.0 | 220 ms | 110 ms | 1.776 | 0.221 | 12.4 % | 0 % | 20.4 |
| Malicious | 139.7 | 236 ms | 118 ms | 1.674 | 0.206 | 12.3 % | 0 % | 17.8 |
| WhoLikesToParty | 117.0 | 282 ms | 141 ms | 1.404 | 0.172 | 12.3 % | 0 % | 12.6 |
| **Vienna** | **90.0** | **367 ms** | **183 ms** | **1.076** | 0.133 | 12.3 % | 0 % | 7.4 |

That IS "slow", and it is the crest, not the rate. So below `WREF` the accent keeps its width in MILLISECONDS:
`wFor()` returns `W` at and above WREF and `W · bpm / WREF` under it. Narrowing it ALONE brings §61's dead time
straight back — the accent's area is fixed at (1 − GLIDE), so a narrower bump is a taller one, and at .45 / .330 the
floor falls to 8.1 % of the peak and **52.6 %** of the beat is under a tenth of it — so `gFor()` raises the glide by
exactly as much as holds the velocity **floor/peak RATIO** where the reference pair puts it. Both are **exact
identities at `w = K.W`**, which is what makes the controls immovable.

**`WREF` is 145, not 150**, for one measured reason: it must sit below the clock floor of every track the user has
signed off. The published `bpm` reads **149.798 – 150.820** on SeeYouDrop (33 % of its frames are under 150.000) and
159.966 – 160.112 on CyborgNinja, and at WREF 150 the cap bit on **18 of SeeYouDrop's 5401 frames**. 0.55 beat at
145 BPM is **227.6 ms**, and that is the crest DUST now holds at every tempo under it.

**Page A/B, Vienna 24–60 s, the only difference being this file, and all 50 MS columns md5-IDENTICAL** (§60's harness
rule, so the pair is valid):

| | before | after |
|---|---|---|
| the accent · the lead · GLIDE · W | 366.8 ms · 183.3 ms · .450 · .550 | **227.3 ms · 113.7 ms · .569 · .341** |
| the spin's own rate | 0.3300 rad/s | **0.3300** (+0.01 %) |
| velocity p05 / p50 / p95 / p99 | 0.132 / 0.199 / 0.863 / 1.074 | **0.167** (+26.4 %) / 0.170 / 0.913 / **1.339** (+24.7 %) |
| floor / peak · dead time · backward frames | 11.27 % · 0.0 % · 0 | **11.43 %** · **0.0 %** · **0** |
| \|a\| p50 / p99 / max | 1.3154 / 16.62 / 26.46 | **0.0042** (−99.7 %) / 20.68 / 37.59 |
| lum range p95/p05 · mean · \|Δ\| p50 | 2.745 · 95.59 · 1.356 | 2.773 (+1.0 %) · 95.30 · 1.367 |
| lumC / lumM / lumR \|Δ\| p99 | 17.14 / 18.27 / 19.50 | 17.86 / **17.66** / **19.24** |
| the three voices' fires/s · pours · re-seats | 2.028 / 4.806 / 2.639 · 1 · 37 | **identical** · 1 · 37 |

SeeYouDrop's own |a| p99 is **25.44** and its max **93.67**, so Vienna's jerk stays BELOW the control's even after.

**The controls do not move.** Page, SeeYouDrop 20–110 s and CyborgNinja 20–80 s: `d_nv`, `d_nu`, `d_nstep` and
`d_noff` are **md5-identical on all 5401 / 3601 frames** (max |diff| 0.000000), and the only difference anywhere is a
**constant** offset on the absolute angle of **−9.23e-4 rad** (SeeYouDrop, 0.053°) / **−1.79e-3 rad** (CyborgNinja,
0.103°), picked up in the un-recorded warm-up where the cold clock passes through WREF. The exact replay of both
designs on the recorded clock columns (`tools/work/v66/replay66.py`, §61's method; it reproduces the traced `d_spin`
to **1e-6 rad** on Vienna) gives max |Δangle| **0.0001 / 0.0000 rad** over the two control windows. A bonus the replay
also shows: over Vienna 100–116 s, the one window where §61 left the clock in the wrong octave (`bpm` 120.18), the
dead time falls **19.6 → 8.4 %**.

### Q1 — measured and REJECTED

- **A nudge on the 8TH** (the brief's first lean, and the right instinct: the hats are straight 8ths at 3.00 /s and
  only 53 of the window's 108 8th lines carry a nudge). A half step twice per beat keeps the rate — 0.313 against
  0.332 rad/s — but doubles the crests to **3.00 /s**, which is exactly the **2.90 nudges/s §61 measured as Vienna's
  jerk source #2 and removed**, on the user's own instruction that "the double time should be accenting rather than
  driving". It is also not gateable: the test would have to be "the fine lattice is dense", and **CyborgNinja's hats
  are 16ths at 160 BPM**, so the same test fires on the signed-off control and gives **5.33 crests/s at |a| p99 39.3**
  (SeeYouDrop 5.00 /s at 36.8) — double the control's jerk.
- **A decay in BEATS for the voices** (lean b). tc / median inter-fire gap, SeeYouDrop / CyborgNinja / Vienna:
  **kick 0.80 / 0.65 / 0.76** and **snare 1.20 / 1.64 / 1.80** — Vienna sits BETWEEN the two signed-off controls on the
  kick and 10 % past CyborgNinja on the snare, so the kick's and the snare's decays are already fair against their own
  hit rate. The **hat's reads 0.45 / 0.90 / 0.27** and is the one that travels — but replayed exactly off the recorded
  `d_ageH` / `d_aH` / `hat2` columns (`tools/work/v66/hattc.py`, which reproduces `d_vh` to 2.5e-6), the envelope just
  BEFORE the next flash is **0.0265 on SeeYouDrop and 0.0224 on Vienna already**, and a tempo-scaled tc takes Vienna to
  **0.0851** — past the control it matches and toward CyborgNinja's 0.1043. It is also a `tc` in `index.js`, which a
  second worker holds. Not shipped; the one-line diff and its numbers are in `docs/workers/VIENNA-TUNING.md`.
- **A `WMS` sweep** (0.26 / 0.24 / 0.22 / 0.20 / 0.18 s of wall-clock accent) and a **GLIDE sweep** at the narrowed
  width (.40 / .45 / .50 / .55 / .577 / .62): the glide the floor/peak rule derives (.577 at W .330, .569 at W .341) is
  the one that puts the dead time back at **0.0 %** — .45 reads 52.6 %, .50 reads 52.6 %, .55 is the first to reach 0.

### Q2 — what plays at 1:46.7 (106.6693, bar 40), and is bass starting?

**Yes, and precisely: the bass line steps up an OCTAVE.** Offline, band RMS per beat in dB over the 8 bars before the
drop (`tools/work/v66/{q2,q2b}.py`):

| beat of the drop bar | sub 20–60 | bass 60–150 | lowmid 150–800 | mid 800–5 k | high > 5 k |
|---|---|---|---|---|---|
| +0 (106.669) | **−2.1** | +1.7 | +0.6 | −5.6 | **+7.6** |
| +1 | **−5.7** | +3.2 | +4.0 | −4.8 | +5.3 |
| +2 | **−9.8** | +5.1 | +4.9 | −4.0 | +7.0 |
| +3 | **−15.7** | **+6.5** | **+5.1** | −1.3 | +7.0 |
| mean over the 4 bars after | **−3.6** | **+2.6** | **+3.8** | −0.4 | **+5 to +10** |

So the **20–60 Hz sub drone that has held the whole track is pulled out** (−15.7 dB by the fourth beat; the engine's
own `subGate` closes at 108.30 s) and **a 60–150 Hz bass line enters in its place** (+6.5 dB over four beats) with the
150–800 layer (+5.1) and a hat / noise layer above 5 kHz (**+7.6 dB on the drop's first beat**, the biggest single
jump). The 800–5 kHz band does not move. The bass/sub band ratio goes from **p50 −0.31 dB over the 30 beats before**
to **+3.64 / +8.80 / +14.75 / +22.08 dB** across the drop bar, and the sub note goes from **D♯1 / F♯1 (38–46 Hz)**
before to **A1 / F♯2 / D♯2 (46–92 Hz)** after (the truth's f0 contour: p50 46.4 Hz over the 4 bars before, **77.0 Hz**
over the 4 after). A 40 Hz drone is felt; an 80–92 Hz line is **heard**. That is the whole of "it feels like there is
bass starting".

**BS.1770** (`tools/work/Vienna.loud.json`, the existing file — `trackmap.py --loud` was NOT re-run, so the truth dir
was not touched): short-term **−7.16 → −6.08 LUFS, a +1.1 LU step**, against **drop 1's +3.2 LU** (−10.63 → −7.48).
And the drop's own beat is the **quietest momentary in the window** — **−7.92 LUFS**, 1.9 LU under beat −3's −5.88 —
because the sub leaves before the bass arrives. Drop 2 is a texture jump with a third of drop 1's energy step, exactly
as §64 concluded. Per-band spectral flux across bars −4 to +4 is flat to ±0.05 in every band.

### Q2 — the pitch channel gives it NO lead either, so nothing was shipped

§64 searched 60 candidates × 7 grains × 4 causal transforms on ENERGY and got 0 beats of lead. The brief's new
hypothesis was that a **sub-register / pitch** event might be the precursor the search missed. It is not, and the
number is unambiguous: the **bass/sub ratio at beat −1 (106.003) reads −0.01 dB**, inside the 30-beat pre-window
(p50 −0.31, **max +2.78**), and the crossover starts **on the drop beat** (+3.64) — **0 beats of lead**. The truth's
`sub_runs` does show an F♯2 at 106.0, one beat early, but F♯2 also appears at 100.20, 101.10 and 103.00 in the same
four bars (the bass slides constantly — `sub_slides` has ten 1.6-semitone glides), and the band ratio cannot see it.
A ratio threshold is not gateable either: **+8 dB fires on 14 consecutive beats in the dream section (70.3–81.0 s)**.
So the pitch channel adds nothing to §64's conclusion and **nothing was shipped for drop 2**.

**What the eye already gets there, without a detector** (`tools/dust-trace.js` Vienna 98–118 s, the final tree):
on the drop's own beat the KICK voice's envelope p50 goes **0.085 → 0.208 (+144 %)**, the HAT's **0.107 → 0.161
(+51 %)**, the centre **lumC 149.1 → 161.6 (+8.4 %)** and the whole frame **lum 98.8 → 110.2 (+11.6 %)**; over the next
two bars the CORE's sub swell drains **0.882 → 0.589 (−33 %)**, the rim darkens **lumR 113.9 → 91.5 (−20 %)** and the
hat voice's fire rate **doubles, 1.69 → 3.37 /s** (the new layer above 5 kHz). `buildLive`, `dropLiveIn`, `dropLiveEvt`
and `dropEnv` are all 0 on both sides of it. So the picture does read the hand-over — the core drains and the rim's
sparkle doubles — it just does not ANNOUNCE it, and §64's measurement says it cannot be made to.

### Proofs

`node tools/check.js` **0 fail** (157 modules, 202 uniforms, 205 MS keys, help.feats gaps 0, the 5 pre-existing
soft-cap warns) · `npm test` **OK** (test_tempo / director / bars / drums / build / queue / clock, test_loud 38 pass) ·
`node` on `grid.js` alone: `wFor` and `gFor` return `K.W` and `K.GLIDE` **identically (`===`)** at 150, 150.0303, 160,
160.0003, 200 and 1e6; the floor/peak ratio is **18.367 %** at 90, 117, 139.7, 150 and 160 to six figures; PHI(0) = 0
and PHI(1) = 1 at every derived pair; 2500 beats at 90 BPM give **0.220868 rad/beat** against a design 0.220893 with
`off` back at 0 and 0 jumps; re-seats of +0.5 / +1 / −0.3 / −1 beat give max |a| **35.8** with the velocity never
negative. s1 fake-timeline md5, the pair taken in THIS tree with only `grid.js` reverted: f360
**`d3b80fc8` → `becb1a45`**, f840 **`d21222ba` → `80956d08`** — the absolute values are NOT §64's `42e4871c` /
`6eae9916` because a second worker's **uncommitted** `assets/scenes/dust/dyn.js`, `assets/math/loudlight.js`,
`assets/engine/feats.js` and `assets/engine/loud.js` (LOUDNESS phase 4) were in the tree throughout; the isolated pair
is the claim, and the same worker's `d_dyn` / `d_base` / `d_lpk` columns moving under one of my trace pairs is exactly
what §60's harness rule exists to catch (that pair was discarded and re-taken). No `CARD.bench`: the change adds one
`min`, one `round` and one divide per BEAT on the CPU and touches no shader and no per-grain work. No audible run.
**Not tagged, not pushed, not deployed.** The A/B for the user, in track time, is `docs/workers/VIENNA-TUNING.md`.

### Open, for the orchestrator

- **The ears' LOW lane is blind to a masked kick.** `kick2`'s AUC against Vienna's kick lines is **0.316** (below
  chance) and its mean shape peaks **200 ms** after the beat-1 line, while the 60–150 Hz band's own RISE separates the
  same lines at **0.999**. Vienna's low end is a continuous 38–46 Hz 808 drone with a soft thud above it, so a lane
  that reads a LEVEL over a band that includes the drone cannot see the thud. DUST's kick voice — the shove on the low
  grains, the centre of the picture — therefore fires at 2.03 /s in the wrong places on this track. The remedy is in
  the picker, not any scene: a 60–150 Hz lane kept separate from the sub, graded on its RISE. This is the third item of
  the same shape (§64 items 1 and 2 are the HIGH and MID classes).
- **The snare voice is still the loudest wrong voice** (4.81 /s at P 0.35 against a truth of 1.81 /s on Vienna) and
  §64's swell veto does not transfer to it (AUC 0.615). §64 open item 2 stands, now with the scene-side measurement.
- **The hat's `tc` is an index.js line**, held by another worker this session. The diff and its numbers are in
  `docs/workers/VIENNA-TUNING.md`; it is a taste call between SeeYouDrop's rim and CyborgNinja's, and the measurement
  says Vienna already matches SeeYouDrop's.
- **`barPos` is still 2 beats off on Vienna** (§61, §64): the engine's bar wrap lags the truth downbeats by +1297 ms
  over 24–60 s, so the downbeat's bigger nudge is on the wrong beat of the bar on this track.
- **Vienna's hats fill to 16ths on bars 17 and 21 only** (45.3–48.0 and 56.0–58.7 s). Nothing in the engine reads that,
  and §58's `denH` is a count, not a lattice. Noted, not acted on.

## §67 the peak hold was seeded by a window that did not exist — the `loudPk` defect, and the re-calibration it forces (2026-09-30, one worker; §65 open item 1, `docs/plans/LOUDNESS-PLAN.md` phase 8)

§65 left one open item and called it "a phase of its own": **`Loud.push` fed a partially-filled short-term window into
the peak hold's instant attack**. `loudM` and `loudS` are read-only functions of the ring and `zAt` will answer a
"3 s" window from as few as 32 samples — which is the honest causal answer for them, and the warm-up guard covers it.
The **peak hold** and the **range histogram** are not read-only: they are recursive state, and what they take in on the
first block they keep. At `PK_REL` 0.02 LU/s a wrong seed is kept for minutes. **SeeYouDrop's file starts on a
transient**: its first block read **+0.97 LKFS** against a true track maximum `loudS` of **−1.69**, and the hold needed
**147 s** — longer than the track — to walk that off. The other four tracks begin in silence, which is why §63's
synthetic `peak` case (one level for 30 s, silence first) did not catch it. Fixed here, with `L_RNG_MIN` and the
warm-up guard re-swept on the five tracks as §65 said they would have to be. Commit `ff747da`.
**Not tagged, not pushed, not deployed.**

### The fix — BS.1770's own gating, one condition

BS.1770-4 measures **complete gating blocks only**, and that is all this is: `zAt` now also reports the sample count
its mean was taken over, and the hold and the histogram attack only when that count is `SHORT_W * sr` (exact at the
boundary — `cn` is linear in `t` inside a sub-block, so `dn` crosses 144 000 samples one block after 3.0 s). `loudM` /
`loudS` are untouched: a partial window is still measured over what there is, because a track's first frames reading
as silence would be worse than reading as a short mean, and `loudRel` does not care — during warm-up the guard sets
`loudPk = loudS + WARM_LU·exp(−age/WARM_T)`, so `loudRel` is `1 − guard/18` **whatever `loudS` says**. That is the
whole reason the guard is relative, and it is why the partial window was invisible in every field except the one that
remembers.

**Two alternatives measured and rejected.** *Weighting the partial window by its fill* (zero-padding the mean, so the
hold ramps over the first 3 s) is **identical from the moment the window fills** — the ramp is monotone and reaches
exactly `loudS(3 s)` there — and before it fills, its deficit (4.77 LU at 1 s, 1.76 at 2 s, 0.15 at 2.9 s) is smaller
than the guard at the same instants (4.80 / 4.62 / 4.45 LU at the chosen 5 LU / 25 s), so the guard wins every frame
and the extra term buys nothing. *Seeding from the gated momentary* re-introduces the overshoot by construction: a
transient's 400 ms loudness is the quantity that was too loud in the first place.

**The same hazard, checked in the other fields.** `loudRel` — covered by the guard, shown above, and gain-invariant
either way. `loudRange` — it **had** the hazard, through the same histogram, and the same condition fixes it: the first
~3 s of partial windows used to enter the percentiles (first non-zero range at **0.18 s**, now at **3.3–4.3 s**), and
dropping them moves Malicious 8.50 → **8.00** LU against the reference's whole-track 7.82 and Vienna 3.00 → **3.50**
against 3.25. `loudAbs` is a mode flag with no window in it. The **warm-up guard** has no partial-window hazard — it is
a difference, not a level — but it needed re-tuning for a different reason (below). `sources/fake.js`'s mirror has no
window at all (`loudS = lkfs(eM)`, `eM` floored at 0.12), so the fake timeline never had this defect.
One more wart, found while checking the guard: `LKFS_MIN` was only the value digital silence mapped to, not a floor, so
the first ~70 ms of WhoLikesToParty read `loudS` **−158 LKFS** — outside the range FEATS publishes, and the one way
`loudPk` (which *is* floored) could sit above `loudS` with no guard involved. `lk` now clamps. No graded frame of the
five tracks is near it (min `loudS` −38.6, min `loudM` −86.8 LKFS), so it moves no measured number.

### The defect, in numbers

| `loudPk`, LKFS | t=5 s | 10 s | 20 s | 50 s | **100 s** | end | max overshoot of the HOLD over the honest running max, t ≥ 30 s |
|---|---|---|---|---|---|---|---|
| SeeYouDrop, before | +0.87 | +0.77 | +0.57 | −0.03 | **−1.03** | −2.18 | **+3.01 LU** |
| SeeYouDrop, after | −6.22 | −3.38 | −2.18 | −3.38 | **−2.72** | −2.49 | **0.00 LU** |

The track's true full-window `loudS` maximum is **−1.69 LKFS**. At 100 s the hold was **1.46 LU above** it and is now
**1.03 LU below** it — the 0.02 LU/s release doing its job over the 38 s between drop 1 and breakdown 2, which is the
honest answer. (In the page `loudPk` reads −1.13 → −2.73 at the same instant: the extra 0.1 LU is the display lead.)

**It was not only SeeYouDrop.** The defect needs a loud first 3 s, not a loud first block: a partial window over a
sparse-but-loud lead-in beats the eventual 3 s mean. Max overshoot of the hold, t ≥ 30 s: **SeeYouDrop +3.01 ·
CyborgNinja +1.46 · Vienna +1.37 · WhoLikesToParty +0.02 · Malicious +0.01 LU** → **0.00 LU** on all five after.
Vienna's first block reads −7.24 LKFS against its own track maximum of −4.96, so it carried 1.4 LU of it for the whole
song; §65's "Vienna is the control that the migration does not invent dynamics" was measured through that.

`tools/test_loud.js` grows a **`transient`** case: a −13 LKFS burst at t = 0 with **no silence first**, then −26 LKFS
to 20 s and −20 LKFS after (true short-term max −20.00, graded against the file's exact in-test reference, which moved
above the synthetic cases so they can use it). It asserts that `loudPk` never exceeds the loudest FULL 3 s window heard
so far plus the guard by more than **0.1 LU**, that the hold alone (guard subtracted) never exceeds it at all, and that
inside the first 3 s `loudPk − loudS` **is** the guard and nothing else. Against HEAD's `loud.js` the same case reads
**+8.3 LU** of guarded overshoot at 3.2 s and **+7.9 LU** of hold at 21 s, and **3 of its 4 assertions fail** — which
is the receipt that the case tests the defect and not the fix.

### The re-calibration — `L_RNG_MIN` 7 → 6, and the guard 4 LU / 6 s → 5 LU / 25 s

§63 fitted `L_RNG_MIN` against the broken hold and §65 said so. With the hold honest the whole sweep moves, and it
moves for a structural reason worth writing down: **a causal hold pins the track's own loudest moment to `loudRel` 1.0
and `baseLight` 1.0**, so a breakdown can only sit at `1 − dLU/max(loudRange, R)` and the ratio the mapping can show on
a breakdown → drop pair is bounded by `1/(1 − dLU/R)`. The inflated hold used to push the whole track down into the
bottom of 0..1, where the *same* dLU is a bigger *ratio* — that is where §63's ×1.93 came from, and it was a loan
against a wrong number.

Re-swept 3 … 18 LU on all five tracks (`tools/work/v67/{sweep,warm,clamp}.mjs`, one `read()` per 60 fps frame as the
page does, 58 179 graded frames):

| `R` | 4 | 4.5 | 5 | **6** | 7 | 8 |
|---|---|---|---|---|---|---|
| headline breakdown 2 → drop 2, base light (equal 5.1 s windows) | ×2.04 | ×1.82 | ×1.68 | **×1.51** | ×1.40 | ×1.34 |
| SeeYouDrop base light p05 | 0.000 | 0.000 | 0.015 | **0.179** | 0.296 | 0.384 |
| frames clamped to 0 — SeeYouDrop | 6.1 % | 6.0 % | 4.5 % | **0.0 %** | 0.0 % | 0.0 % |
| ... WhoLikesToParty (from 52 s, **mid-track**) | 4.2 % | 3.3 % | 1.2 % | **0.0 %** | 0.0 % | 0.0 % |
| ... Vienna (from 69 s, **mid-track**) | 3.6 % | 1.4 % | 0.7 % | **0.0 %** | 0.0 % | 0.0 % |

**§63's two criteria no longer meet.** The music's own power ratio on that pair is ×1.936, which now needs R ≈ 4.3 —
and there the mapping clamps 4.2 % of WhoLikesToParty and 3.6 % of Vienna to the shader's idle **mid-track**, which is
exactly what §63 rejected R < 6 for ("the ratio stops meaning anything"). A clamped frame carries no information at
all, so that is the hard constraint and it wins: **6 is the smallest floor that clamps no frame of any of the five
tracks** (Malicious's 43 clamped frames are the last 0.7 s of the file), and it takes the largest ratio available under
it. §63's rule was "the picture moves by as much as the sound does **and no more**"; ×1.51 is under the music's ×1.94,
which is the safe side of it. 6 also puts §63's other anchor back: the four tracks that are not SeeYouDrop read base
light p50 **0.914 / 0.803 / 0.814 / 0.880** (CyborgNinja / Malicious / WhoLikesToParty / Vienna), mean **0.853**
against §63's measured 0.871 and `lvl`'s own p50 0.882 (§60 step 1).

**The warm-up guard had to grow, and this is the one thing here that is not just "the measure being honest".** A
causal hold means every moment that is a NEW loudest reads 1.0 — and SeeYouDrop's **8–14 s**, where the track
assembles itself, is a new loudest almost every frame. At the old 4 LU / 6 s (gone to 0.03 LU by 30 s, long before a
14 s intro ends) that stretch came out **brighter than the groove**, which is the exact failure §60 step 4 paid the
0.84 floor to fix and §65 reported closed at 1.021×. Swept on **DUST's own luminance** — because the gate is a
luminance ratio and the scene's own channels multiply the base light by ~1.2–1.5× there, so the base light's ratio is
not the gate (one 2–40 s trace per candidate, `tools/work/v67/intro.mjs`):

| `WARM_LU` / `WARM_T` | intro 2–8 s / groove | intro 8–14 s / groove | four-track base p50 mean |
|---|---|---|---|
| 4 / 6 s (§65, on the broken hold) | 0.357 | 1.021 | 0.894 |
| 4 / 20 s | 0.787 | **1.177** ✗ | 0.868 |
| 4 / 30 s | 0.757 | **1.094** ✗ | 0.850 |
| 5 / 20 s | 0.673 | **1.047** ✗ | 0.866 |
| **5 / 25 s** | **0.650** | **0.984** ✓ | **0.853** |
| 6 / 20 s | 0.556 | 0.918 ✓ | 0.860 |

**5 LU / 25 s** is the only candidate that clears the gate *and* lands 2–8 s on **§60's own signed-off 0.633**; 6 LU
clears it by more but takes the first bars under that figure. `FEATS` has described a 6 LU / 20 s guard since the plan
while the code did 4 / 6; both are now one number, and it is the measured one.

### §65's pass-2 table, re-taken BACK TO BACK — and the compression, stated plainly

Every trace below was taken in a **separate git worktree at `66e9977`** on its own server (see "the machine was
shared"), before leg = that commit, after leg = that commit plus this section's files and nothing else, `WARM=20` so
the file opens at t = 0 as §65's did. **The before leg reproduces §65's table to the digit** (mean lum 81.4, p95/p05
4.251, base light 0.248 / 0.532 / 0.764, breakdown 2 114.5 / 128.0, drop 2 147.7, groove 69.9, breakdown 1 45.1,
intro 0.357 / 1.021), which is the receipt that the isolation works. The **MS columns the loudness stage does not own
are md5-identical across all nine pairs** (`lvl` / `eM` / `eS` / `alive` / `beatCount` / `dropEnv`) — §60's validity
rule, and the engine did not move anywhere else.

| DUST, SeeYouDrop 20–110 s (`&map=0`, CLOCK=1) | §65 | §67 |
|---|---|---|
| mean luminance | 81.4 | **97.1 (+19 %)** |
| the window's range p95/p05 lum | 4.251 | 3.189 |
| base light p05 / p50 / p95 | 0.248 / 0.532 / 0.764 | **0.581 / 0.849 / 0.966** |
| `loudPk` at 100 s | −1.13 | **−2.73** (true max −1.69) |
| **breakdown 2 → drop 2, equal 5.1 s windows** | 114.5 → 147.7 = ×1.290 | 126.9 → 155.1 = **×1.222** |
| **breakdown 2 (§60's own 100.5–104 window) → drop 2** | 128.0 → 147.7 = ×1.154 | 141.5 → 155.1 = **×1.096** |
| the void before drop 1 (55–57.6) · drop 1 | 37.3 · 91.6 — void/drop **0.407** | 53.2 · 116.8 — void/drop **0.456** |
| groove (28–40) · breakdown 1 (49–55) | 69.9 · 45.1 — break1/groove 0.645 | 89.4 · 65.6 — **0.733** |
| **intro 2–8 s / groove** | 0.357 | **0.650** (§60's signed-off figure: 0.633) |
| **intro 8–14 s / groove** | 1.021 | **0.984** — §60's open item 2 stays closed |

**The one thing that got worse, and why `L_RNG_MIN` cannot fix it.** The breakdown → drop separation in the PICTURE
falls (×1.290 → ×1.222 on equal windows, ×1.154 → ×1.096 on §60's), even though the base light's own ratio rose from
×1.21 (`loudRel`) to ×1.51. Every migrated scene's shader is affine with a large constant term — DUST's
`gBase = .22 + 1.42·uDyn`, and in this window the measured map is `lum ≈ 79.1 + 77.0·base` — so a base light nearer 1
compresses the ratio. §65's ×1.290 was **bought by the defect**: a hold 1.46 LU too high pushed the breakdown's base
light down to 0.460, where the same 2.9 LU is a bigger fraction. Lowering R does not buy it back (R = 4 gives only
×1.33 in luminance, and it clamps mid-track), so the lever for absolute contrast is the scene's own gain, which §65's
watch-list item 4 already named. **The gate is still met in the sense §60 set it** — the drop is brighter than the
breakdown before it, where §60 had it *darker* at ×0.875.

**The quiet masters are still not dim** (DUST, 20–110 s, mean luminance and base light p50):

| track | master (gated LKFS) | mean lum §65 → §67 | base light p50 §65 → §67 |
|---|---|---|---|
| SeeYouDrop | −3.88 | 81.4 → **97.1 (+19 %)** | 0.532 → 0.849 |
| CyborgNinja | −9.05 | 99.5 → 106.0 (+7 %) | 0.719 → 0.897 |
| Vienna | −6.89 | 93.9 → 92.4 (−2 %) | 0.833 → 0.847 |
| WhoLikesToParty | −10.03 | 120.0 → 115.2 (−4 %) | 0.848 → 0.795 |
| Malicious | −12.46 | 114.4 → 112.7 (−1 %) | 0.906 → 0.855 |

The track that moves is the one that had the defect; the two quietest masters move by 1–4 % and stay at the top of the
range, which is what the relative guard and the relative floor are for. **WhoLikesToParty's three drops get a bigger
base-light step** (×2.61 / ×1.61 / ×1.67 → ×3.88 / ×1.89 / ×1.98): its hold was already honest, so all it got was the
new floor.

**The other three migrated scenes** (SeeYouDrop 20–110 s, one trace each, same pair rule):

| scene | mean lum | drop 2 / breakdown 2 (§60 win) | breakdown 1 / groove |
|---|---|---|---|
| FEIGEN (6) | 155.5 → 163.4 (+5 %) | 1.159 → 1.124 | 0.753 → 0.804 |
| MANDALA (2) | 165.7 → 170.5 (+3 %) | 1.293 → 1.286 | 0.795 → 0.846 |
| POLYTOPE (5) | 37.3 → 52.9 (**+42 %**) | 2.438 → 1.966 | 0.613 → 0.690 |

Same shape on all four: brighter, and a little less contrast, because all four read one mapping. POLYTOPE moves most
because its own gain is the smallest (`0.75·(0.35 + base)·presence`), so it sat lowest on the compressed part of the
curve.

### The fake timeline — exactly the four migrated scenes, and `&loud=0` is bit-exact

`PORT=8900 tools/scene-md5.sh`, all twelve ids, both legs on the current HEAD (`937c510`) in the isolated worktree,
`errs []` and `hop 840 row 72` on every one:

| id | scene | HEAD | HEAD + §67 | HEAD + §67, `&loud=0` |
|---|---|---|---|---|
| **1** | **DUST** | `eef2dd9a` / `80956d08` | **`6afe61f2` / `d3bed410`** | `e970e8dc` / `466b5d3b` |
| **2** | **MANDALA** | `1124721c` / `cb3442e9` | **`f2df3a81` / `c93dcf77`** | `9a57626c` / `5e59be93` |
| **5** | **POLYTOPE** | `4bcf26a3` / `c7469414` | **`e6aed873` / `e6ec96a0`** | `06b46063` / `cccb0094` |
| **6** | **FEIGEN** | `39d51392` / `f4032da8` | **`fac80f37` / `6251d7e9`** | `8d6ac4a6` / `9adb1f5b` |
| 0, 3, 4, 7, 8, 9, 10, 11 | the rest | — | **identical, line for line** | — |

**Exactly 8 of the 24 lines moved, and they are the four scenes that read `baseLight`.** Nothing else is reachable:
the only files touched are `engine/loud.js`, `engine/feats.js` (text) and `math/loudlight.js`, and the only scene-side
consumer of either is `baseLight`. The move comes through `sources/fake.js`'s mirror, which reads `LOUDK.WARM_LU` /
`WARM_T` — the fake timeline has no real `Loud`, so the full-window condition itself cannot move it; the guard and
`L_RNG_MIN` can, and did.

**`&loud=0` is BIT-EXACT.** The right-hand column is **identical to the same four lines taken at HEAD under
`&loud=0`** (`IDS="1 2 5 6" tools/scene-md5.sh b67x '&loud=0'`), and s2 / s5 / s6 are **v0.14's own lines**
(`9a57626c` / `5e59be93`, `06b46063` / `cccb0094`, `8d6ac4a6` / `9adb1f5b`) bit for bit, exactly as §63 phase 5 left
them. **s1's is `e970e8dc` / `466b5d3b` and NOT §65's recorded `42e4871c` / `6eae9916`** — because §66 committed
`dust/grid.js` between the two phases and moved DUST's pre-loudness rendering; the receipt that this phase did not
touch it is that the `&loud=0` line is the same number on both legs of this phase's own pair.

### §65's open item 2, measured and left alone

§65 suggested that if the user's eye wants §60's dark void back, the honest way is a short-window term — `loudM`
(400 ms) resolving a 2.6 s void where `loudS` (3 s) cannot. Measured as the one-line variant (the base light's
numerator becomes `min(loudS, loudM)`, so a brief void darkens at once and a transient cannot brighten anything), at
R = 6: **void 1 / drop 1 does not move at all** (0.712 → 0.712) and breakdown 2 / drop 2 moves only 0.606 → 0.591. It
is not a win, and the reason is in the truth: that void is a riser and a reverb tail, it integrates to −4.68 LKFS
against the groove's −3.99, and a 400 ms window agrees with the 3 s one that it is loud. **Not implemented.** The eye's
complaint about the void is not a window-length problem — `eM`'s AGC crashing there was the thing the eye liked, and
recovering it would mean deliberately un-measuring the loudness, which is not a worker's unilateral call.

### Proofs

`node tools/check.js` **0 fail** (157 modules, uniforms 202, MS keys 205, help.feats gaps 0, **the same 5 pre-existing
line-cap warns**) · `npm test` **0 FAIL** — taken in the isolated worktree at HEAD + §67, because the main tree's
`test_drums` has **3 failures from the parallel worker's uncommitted `ears/perc.js`** and its own new "§68" block;
`test_drums` is **OK** both at clean HEAD and at HEAD + §67's five files, which is the attribution · `node
tools/test_loud.js` **43 pass** (38 before: the `transient` case's 4
and one re-spelt `rel` assertion) · `node tools/test_loud.js --truth` **63 pass**: the engine is still within
**0.0000–0.0063 LU** of the exact reference on all 58 179 graded frames and within 0.018–0.260 LU of python's 3 s
window across the resample, and **7 of 8** truth drops still read louder than the breakdown before them with every
dLU agreeing with the truth's to 0.05 LU (Malicious 148.29 s remains the one recorded exception). **No audible run** —
every number is the deterministic file path or pure node.

**Cost**: `test_loud`'s own line, **3.76–3.83 µs/block → 5.88–5.99 µs/frame** at 48 kHz / 60 fps (0.036 % of a frame)
against §63's 3.73 / 5.83. The fix adds one array write per block to a loop that already runs 1024 biquad sections per
block, which is inside this measurement's run-to-run noise, so `CARD.bench` was not re-taken.

**THE MACHINE WAS SHARED.** Another worker was running its own pages on port 8898 (`assets/scenes/dust/grid.js`,
`ears/perc.js`, `tools/work/v66/`) throughout, and it **committed `grid.js`** (§66) while this section was being
measured. Two consequences, both handled. (1) Its uncommitted `grid.js` would have contaminated a DUST trace taken in
the main tree, so every trace above was taken in a **separate worktree** (`/tmp/rr67`, its own server on port 8900) at
`66e9977` — before §66 — with both legs on that one tree; the before leg reproducing §65's table to the digit is the
receipt. (2) The md5 list below is instead taken at the **current HEAD (`937c510`, i.e. with §66's `grid.js`)**, both
legs, because that is what "nothing else may move" has to be proved against; §65's recorded s1 lines
(`11ca47d0` / `d21222ba`) therefore do **not** appear — §66 moved them before this phase ran, which is why the before
column is measured here rather than quoted. Wall-clock load does not reach any of these numbers: the deterministic
file path is frame-locked (HARNESS), which is why a bench would have needed the interleaved-pair protocol and a trace
does not.

### Open items

1. **The look is the user's, and this moves it on all four migrated scenes.** §65 was never signed off; §67 moves it
   again, and towards §60's approved brightness (SeeYouDrop's base light p50 0.532 → 0.849 against the `dyn` drive's
   own signed-off 0.873, and `lvl`'s 0.882). The intro is back under the groove and 2–8 s lands on §60's own 0.633,
   but the **void before drop 1 keeps getting brighter** (void/drop 0.268 at §60 → 0.407 at §65 → 0.456 here) and the
   **breakdown → drop step in the picture is smaller than §65's**, for the measured reason above.
2. **A seek now warms up over ~25 s, not ~6.** `features-loud.js` starts a fresh `Loud` on a stamp jump, so a scrub
   re-arms the full 5 LU guard. Nobody has looked at a scrub with the loudness on; if it reads as a long fade-in, the
   fix is to carry the previous hold across a seek within the same source, not to shorten the guard.
3. **`L_RNG_MIN` 6 is a compromise, stated plainly**: §63's ratio criterion wants 4.3 and the no-clamping constraint
   wants ≥ 6. If the user's eye says the breakdown → drop step is too small, the knob is the SCENE's gain first
   (§65 watch-list item 4) and this floor second, and the floor's price is the shader's idle mid-track on
   WhoLikesToParty and Vienna.
4. **`shapeFor()` still reads the absolute `eM < 0.74`** (§60 open item 5, §65 open item 3) — untouched, still the last
   AGC absolute in DUST's look path.
5. `tools/accept.sh` still has not been run since v0.14.

## §68 the ears' LOW lane is a 60–150 Hz RISE — the masked kick, and the picker that could not see it (2026-10-01, one worker; §66 open item 1, the user on DUST: "the bounce feel slow and jerky on the kick"; `docs/AUDIT-drums.md` "§68")

One engine commit (`fbc57ae`, `assets/engine/ears/perc.js` and its ruler), one docs commit. **Not tagged, not pushed,
not deployed.**

### What §66 handed over, reproduced

§66 Q1 measured Vienna (90.00 BPM, D♯ minor) and found the kick on beats 1 and 3 plus a 16th pickup, the sub a
**continuous D♯1 / F♯1 drone with no pulse at all** (a 7 dB span over all 16 slots of the bar), and `kick2`'s AUC
against those kick lines **0.316 — below chance**, reading 0.031 at a kick and 0.130 at a non-kick 16th and peaking
**+200 ms** late, while the 60–150 Hz band's own RISE separated the same lines at **0.999**. DUST's kick voice fired
**2.03 /s at P 0.21 / R 0.27**, biggest bins on the 16ths AFTER the beat.

Reproduced on the node harness over the whole of all five tracks (`tools/drums-node.js`, `drumcheck.py`), `kick2`
against the truth's `low` — the baseline table: SeeYouDrop P 0.55 R 0.43 F **0.49** · CyborgNinja 0.99 / 0.64 /
**0.78** · WhoLikesToParty 0.97 / 0.51 / **0.67** · Malicious 0.31 / 0.22 / **0.26** · Vienna 0.30 / 0.23 / **0.26**.

### Why it failed — the band AND the onset function, measured separately

`tools/work/v68/{lab,diag,fine,sweep*}.js` run the ENGINE's own filter bank at PHOP over each track and score
candidate lanes, so band and onset function move independently.

- **The band.** `BANDS[2]` was **40–150 Hz** and a 4th-order Butterworth high-pass at 40 Hz is ~3 dB down at 40: it
  passes D♯1 (38.89 Hz) and F♯1 (46.25 Hz) at essentially full level. The lane's band WAS the drone. Band dB at a
  kick against elsewhere, Vienna: 22–70 Hz **−17.2 / −17.8**, 40–150 Hz **−13.7 / −14.5** — the kick is worth under a
  dB of the band it was supposed to own.
- **The onset function.** `flux = res[i] − res[i−1]` with `res = dB − median9(dB)` is a ONE-HOP difference of a
  median residual. Both halves fail here: a running median of the whole mix tracks the drone's own slow wobble (the
  same mechanism §64 found on the HIGH band — "a median lags a swell"), and a thud whose attack spans two or three
  10.7 ms hops shows only a fraction of its rise in any single one of them.

AUC against the kick truth (the peak in [line − 10, +70] ms at a kick line against the other 16th lines of the truth
beat grid), old lane → `rise8` on 60–150 Hz:

| | SeeYouDrop | CyborgNinja | WhoLikesToParty | Malicious | **Vienna** |
|---|---|---|---|---|---|
| `flux(res9)` 40–150 Hz (the old lane) | 0.653 | 0.954 | 0.790 | 0.522 | **0.511** |
| `rise8` 40–150 Hz (the band alone) | 0.787 | 0.996 | 0.880 | 0.803 | 0.666 |
| `flux(res9)` 70–150 Hz (the function alone) | 0.639 | 0.989 | 0.794 | 0.526 | 0.600 |
| **`rise8` 60–150 Hz (both)** | **0.816** | **0.997** | **0.892** | **0.811** | **0.713** |

Neither change alone is the fix: the band alone buys Vienna 0.511 → 0.666, the function alone 0.511 → 0.600, the two
together 0.713. **§66's 0.999 is not reachable causally and should not be read as a target** — it was measured with a
zero-phase `sosfiltfilt` envelope on the SAME statistic that defines the kick truth. A finer hop for the lane (256 /
128 / 64 samples, swept × pre-window × peak-window) buys at most **0.735** against 0.714 at PHOP, so PHOP stays and
§48's "a 128-sample hop costs 2–5× the false onsets" is not reopened.

### The lane

`BANDS[2]` **40–150 → 60–150 Hz** — no new filter, because band 2 is the lane's own (`map.js` already excludes it
from every energy sum as a duplicate of 22–70 + 70–150) — and the onset function is the band's **RISE over a short
LOCAL baseline**: `rise = dB[i] − mean(dB[i−1 … i−KICK_BASE])`, half-wave rectified, against an **absolute** floor.

- **`KICK_BASE` 8 hops (~85 ms)**. A mean of the recent past, not a median of the whole mix: a steady drone
  contributes the same level to the hop and to its own baseline, so it cancels, while a thud's whole rise shows at
  once. Plateau 7 / 8 / 9 hops = mean F .589 / **.605** / .600; 10 breaks CyborgNinja (P .80 — the baseline reaches
  back past its own 160 BPM kicks).
- **`KICK_RISE` 5.0 dB, with NO adaptive `fm + k·fd` term.** A rise is a RATIO, so one dB number travels across
  tracks and loudnesses — which is exactly what §64 found the HIGH band's absolute step did NOT do. The adaptive term
  is what used to cost the recall: at the same floor, `k` 3.0 takes CyborgNinja R **0.96 → 0.53** (its own loud kicks
  inflate `fd` and suppress the quieter ones) and the mean F 0.605 → 0.46. Floor plateau 4.5 / 5.0 / 5.5 / 6.0 dB =
  .594 / **.605** / .604 / .596; 5.0 is the centre.
- **`REFRACT[0]` 0.085 s, unchanged — but applied to the LANE.** `last[0]` is set only in `emit()`, so a bare 808
  note start never reached it and the low stream had no refractory of its own; under the old adaptive threshold that
  was hidden, and a rise against a mean baseline needs it explicitly (the hop after a hit still reads ~7/8 of its
  rise, because the hit is 1 of the 8 hops in that hop's baseline). A new `lastLow` fixes it: **1042 / 1035 / 2458 /
  1796 / 412 fires → 488 / 616 / 1155 / 821 / 290**. Shorter refractories were swept and are worse (mean F 0.529 at
  45 ms, 0.557 at 60 ms, **0.605** at 85 ms).
- **`KICK_LAG` 0.012 s**, the lane's own, replacing `ONSET_LAG`'s 0.006. A 5 dB floor needs the hop to be most of the
  way up where a 1.2 dB flux floor cleared on the hop that merely CONTAINED the attack; without the correction the
  raw median lag went +11/+7/+10/−4/−1 ms → +14/+9/+12/+3/+13.
- The existing level gate (`dB < p90 + GATE_DB`) is kept. Swept with and without and on three bands: **identical to
  every digit**, so it costs nothing and still protects a silent band's noise floor.
- **60–150 Hz beats the alternatives**, mean F: **.605** against 40–150 .570, 70–150 .595 (free — it is already
  `B_LOWBASS` — and 0.010 worse) and 60–120 .571.

**Two designs measured and REJECTED**, both the obvious ones:

- **(b) a UNION of the two lanes** (an onset if either fires, 60 ms refractory — the DUST pattern): mean F **0.537**
  against 0.605. It keeps the old lane's false fires, which is the whole problem: Vienna P 0.19–0.21 against 0.44.
- **(c) the old lane VETOED by the rise** (§64's own pattern — the flux fires, the rise has to confirm it): mean F
  **0.479–0.495**. The veto cleans Vienna's precision (0.12 → 0.17–0.37) and destroys its recall (0.20 → **0.09–0.17**),
  because the old lane does not FIND Vienna's kicks in the first place — a veto can only remove.

Replacing the lane is the only design that wins, and it wins on precision AND recall on every track.

### The ruler, and why the kick needed a fourth reference

`tools/truth/kicktruth.py` (new, beside `trackmap.py` and `drumcheck.py`) writes `tools/truth/<T>.kick.json`: the
**offline 60–150 Hz rise at the truth beat grid's 16th lines** — `tools/work/v66/kick3.py`'s own method, generalised
off each track's `beats` instead of Vienna's hand grid so it grades a whole track and the four controls. A kick =
rise ≥ 4.0 dB and a local max over ±1 line. `drumcheck.py` grades the kick against it as a fourth reference.

It exists because **`low` is itself a 40–150 Hz level picker**, so on this one track the reference shares the
detector's blindness: Vienna's `low` lists **475 onsets = 2.46 /s where the groove has 1.74 kicks/s**. The new
reference is validated where `click` is trustworthy — it reproduces **CyborgNinja's `click` at P 0.99 / R 0.89**,
WhoLikesToParty's at 0.82 / 0.66, and **§66's own Vienna hand-grid list at P 0.96 / R 0.92** (57 against 60 over
24–60 s, lag p50 −1 ms). Grid-free peak picking at the same floor was tried first and rejected: Vienna's 60–150 Hz
envelope has 5.5 local maxima/s clearing 4 dB, so the GRID is what makes it a kick list.

### The five-track table

**`kick2`, node, whole track, F** (before → after), against the three references:

| | vs `low` | vs `click` | vs `kick` (§68) |
|---|---|---|---|
| SeeYouDrop | 0.49 → **0.54** (P 0.55→0.63, R 0.43→0.48) | 0.46 → **0.48** | 0.40 → **0.53** (P 0.48→0.65, R 0.34→0.44) |
| CyborgNinja | 0.78 → **0.83** (P 0.99→0.99, R 0.64→0.71) | 0.79 → **0.84** | 0.84 → **0.90** (P 0.99→0.99, R 0.74→0.81) |
| WhoLikesToParty | 0.67 → **0.72** (P 0.97→0.92, R 0.51→0.59) | 0.74 → **0.78** | 0.71 → **0.78** (P 0.80→0.79, R 0.64→0.77) |
| Malicious | 0.26 → **0.32** (P 0.31→0.35, R 0.22→0.30) | 0.10 → **0.13** | 0.23 → **0.39** (P 0.27→0.41, R 0.20→0.37) |
| **Vienna** | 0.26 → 0.23 (P 0.30→**0.39**, R 0.23→0.16) | **0.08 → 0.30** (P 0.05→0.23, R 0.17→0.42) | **0.19 → 0.42** (P 0.18→**0.56**, R 0.19→0.34) |

**14 of the 15 rows go up.** The one that falls is Vienna against `low`, the reference §66 proved is the drone — and
its precision rises there too. **Lag p50 against `low`: +4 / +5 / +3 / +6 / +4 ms against the old +4 / +7 / +7 / +2 /
+2** — the same mean (+4.4 vs +4.4), §58's "+3/+4 ms" preserved, nothing later on 3 of 5 and +4 ms on Malicious,
whose kicks neither detector finds (§51). `kickEvt` (the beater-gated class on top of the lane) on Vienna goes
P 0.09 → **0.26** / R 0.10 → 0.25 against `click`.

**Page, det, `&map=0`, `CLOCK=1`, 20–110 s, one `tools/filetrace.js` trace per track, `drumcheck.py`** — `kick2` F:

| | vs `low` | vs `click` | vs `kick` | lag p50 vs `low` |
|---|---|---|---|---|
| SeeYouDrop | 0.59 → **0.63** | 0.59 → 0.55 | 0.50 → **0.62** | +4 → +4 ms |
| CyborgNinja | 0.81 → **0.84** | 0.82 → **0.85** | 0.87 → **0.91** | −5 → −7 |
| WhoLikesToParty | 0.64 → **0.71** | 0.70 → **0.76** | 0.70 → **0.77** | +7 → +4 |
| Malicious | 0.33 → **0.39** | 0.17 → 0.14 | 0.21 → **0.38** | −9 → −4 |
| **Vienna** | 0.30 → **0.32** | **0.11 → 0.41** | **0.16 → 0.51** (P 0.15→0.56) | +2 → +3 |

**Stated, not hidden:** on SeeYouDrop the BEATER-gated class loses a little (`ears` vs `click` P 0.71 → 0.66 / R 0.57
→ 0.51 on the page; `test_ears.js`'s own 25–45 s window reads kick F 0.786 → 0.729) because its kicks are 808-ish
with fundamentals under 60 Hz — §51 already recorded "a sub below the 40 Hz band edge" as that track's miss. The LOW
lane, which is what `kick2` and every scene read, gains there on both the `low` and the `kick` references.

### What DUST does with it — the user's own complaint

`tools/dust-trace.js` on the final tree, scene 1, `&map=0`, graded by `tools/work/v68/dustkick.py` against
`<T>.kick.json` at ±50 ms (§64's tolerance). The two traces of each pair differ only in `perc.js`.

| | before | after |
|---|---|---|
| **Vienna 24–60 s** (truth 57 kicks = 1.58 /s) | **74 fires (2.06 /s), P 0.11 / R 0.14 / F 0.12** | **54 fires (1.50 /s), P 0.72 / R 0.68 / F 0.70** |
| … amp at a MATCHED fire / at an unmatched one | 0.323 / **0.374** — the real kicks flashed SMALLER | **0.458** / 0.292 — the right way round |
| … `kick2`'s AUC at a kick line vs the other 16ths | 0.482 (mean 0.118 at a kick / 0.151 elsewhere) | **0.697** (0.323 / 0.154) |
| **SeeYouDrop 20–110 s** (truth 344 = 3.82 /s) | 271 fires (3.01 /s), P 0.68 / R 0.54 / F 0.60 | **305 (3.39 /s), P 0.79 / R 0.70 / F 0.75** |
| … `kick2`'s AUC | 0.627 | **0.698** |

The voice now fires at the music's own kick rate on Vienna (1.50 against 1.58 /s) instead of a third too often, and
§66's own signature — "the matched fires sit at the voice's FLOOR and the unmatched ones are BIGGER" — is inverted.
The control is not merely unharmed: SeeYouDrop's kick voice is better too. (§66's 0.21 / 0.27 was graded against its
own 24–60 s hand-grid list; the same trace reads 0.11 / 0.14 against this one. The FIRE COUNT matches exactly — 74
here, 73 there — so it is the same picture, measured against a slightly different list.)

### Everything else that reads these onsets, proved

- **The whole-track MAP is byte-identical on all five tracks** — `bpm`, `beat`, `phase`, `bar`, `drops`, `dropWhy`,
  `sections`, `tonic`, every `onsets` count, `beats`, `downbeats`, `novelty` (`md5 d809f6e7` before and after). Its
  non-causal front end never touched band 2, but `map.js` DOES feed the causal `kick` events into `densE`, the drop
  rule's "does this bar carry the beat" measure — that input moved (SeeYouDrop 209 → 192 causal kicks, Vienna 112 →
  104) and no drop or section line moved with it.
- **§59's clock tables hold.** The PCM clock takes these onsets as phase measurements (`features-clock.js`), so it
  was re-measured on all five tracks (`tools/clock-study.js` + `gridcheck.py --heard`, the whole track). **Lattice
  jumps 0 / 3 / 1 / 0 / 3 — identical** — and no track changes lattice: CyborgNinja still locks at **17.9 s** and
  reads **+3 → +1 ms** (|lag| p50 3 → 2, p90 5 → 4), WhoLikesToParty +7 → +6 and locks at 5.6 s both ways, Vienna
  |lag| p50 9 → 7 / p90 86 → 82 (71 → 73 % of in-octave frames within 30 ms), Malicious +22 → +23 (83 → 80 %), and
  SeeYouDrop's lag med +2 → +1 with its lock 7.6 → **9.2 s**, the one row that gets worse. `clockConfPcm` on / off
  the beat on SeeYouDrop goes 0.93 / 0.86 → **0.93 / 0.47**, which is the row's own target (a useful confidence
  separates them) moving the right way.
- **The fake-timeline md5 sweep: 0 of the 24 lines move.** The ears never run under `#test`. Taken as an ISOLATED
  pair in a `git worktree` of HEAD with only `perc.js` different, because the first pair taken in the working tree
  was INVALID — a second worker's §67 (`loudlight.js`) landed between the two sweeps and moved s1, s2, s5, s6, which
  is exactly what §60's harness rule exists to catch. That pair was discarded and re-taken clean.
- **Cost flat.** `Ears.push` over the whole of Vienna, best of 3, three interleaved pairs: **70.39 / 70.36 / 70.33 →
  70.61 / 71.36 / 70.79 µs per 512-sample block** = 0.1099 → 0.1106 ms per 60 Hz frame at 48 kHz (**+0.6 %**). The
  band COUNT is unchanged (band 2 moved, nothing was added) and the lane adds 8 adds and one divide per hop, 94
  hops/s. `test_ears.js`'s own gate reads 0.0585 → 0.0596 ms median per block against a 0.19 ms budget.
- **`node tools/check.js` 0 fail** (157 modules, 202 uniforms, 205 MS keys, help.feats gaps 0, the 5 pre-existing
  soft-cap warns) · **`npm test` OK**. `tools/test_drums.js` has **6 new cases**: a synthetic masked kick (20 bars at
  120 BPM, 48 kHz — a continuous D♯1 at 0.40 with NO pulse and a 95 Hz thud decaying over 30 ms at 0.18 on beats 1
  and 3, plus its 4 kHz beater, which is the Vienna geometry in its purest form: **+0.9 dB in a 40–150 Hz band, under
  the old lane's own 1.2 dB floor, and +9 dB in 60–150**) reads **P 1.000 / R 1.000 at lag p50 +1.3 ms** against the
  old lane's **P 0.87 / R 0.87 at +12.7**, never fires twice for one thud, and `kickEvt` / `kickVel` / `denK` all
  follow. `tools/test_ears.js` now reports the LOW lane's own P/R/lag row (SeeYouDrop: `low` P 0.60 R 0.58 F 0.59,
  `kick` P 0.65 R 0.57 F 0.61); its 4 failures at 48 kHz are pre-existing and unmoved.
- **No audible run.** Every number above is the deterministic file path or node.

### Open, for the orchestrator

- **§66 open item 1 is CLOSED.** The lane is in the picker, so every reader benefits: `kick2`, `kickEvt`, `kickAge`,
  `kickVel`, `denK`, DUST's kick voice, the PCM clock's phase measurements and the map's own drop density.
- **The SNARE / rim lane is obvious and cheap, and it was NOT built** (the brief forbids it; §66 open item 2 and §64
  open item 2 stand). The same design — `rise = dB[i] − mean(dB[i−1 … i−8])` against an absolute dB floor — on the
  **existing 150–2500 Hz band** (`B_SNARE`, no new filter at all) against the truth's `mid` onsets, mean F over the
  five tracks **0.528 → 0.633** at a 3.5–4.5 dB floor: SeeYouDrop F 0.58 → **0.70**, WhoLikesToParty 0.70 → **0.78**,
  Malicious 0.29 → 0.37, **Vienna P 0.22 → 0.76 / F 0.34 → 0.66** — and CyborgNinja F 0.73 → 0.72 flat but its
  RECALL 0.61 → 0.51, which is the one number that needs a decision before anyone ships it. On Vienna's own rim/clap
  reference (§66's `clap-ref-rise.json`, 72 hits on beats 2 and 4 over 24–60 s) the rise on the existing **150–600 Hz**
  band reads **P 0.83 / R 0.56 / F 0.67 at lag +2 ms** against the current lane's **P 0.37 / R 0.67 / F 0.48** — so
  §66's "the snare voice fires 2.7× too often at P 0.35" has an engine answer of the same shape as this one. A floor
  of 4.5 dB on 150–2500 Hz is one line; the CyborgNinja recall and whether `snare2` (synapse's, better on 3 of 4
  tracks per §51) should change at all are the decisions, not the measurement.
- **`tools/truth/<T>.kick.json` is built from the truth BEAT grid**, so it inherits each track's grid. Vienna's
  `Vienna.json` is still marked `provisional` (a hand grid) and Malicious has "tempo only" — the reference is only as
  good as those, which is why `low` and `click` are still graded beside it rather than replaced.
- The lab and sweep scripts are `tools/work/v68/{lab,diag,fine,sweep,sweep2..5,snare,dustkick,mapsum}.js`,
  gitignored like §66's; the reference BUILDER was promoted to `tools/truth/kicktruth.py` because `drumcheck.py` now
  depends on its output.
- **`tools/accept.sh` still has not been run since v0.14** (§65 item 5, unchanged by this session).

**v0.23 tagged locally (2026-10-01) on the user's word ("tag what has been done so far"; deploy still held):** v0.22 + §61 (the
nudge as a velocity profile, Vienna's clock octave), §62 (`key` is the tonic), §63/§65/§67 (LOUDNESS: the BS.1770 `loud` stage,
FEIGEN / MANDALA / POLYTOPE / DUST base light on true loudness, the peak-hold fix), §64 (the hat bed gate, the sub-void arming
path), §66 (Vienna in numbers, `K.WREF`), §68 (the ears' low lane is a 60–150 Hz rise). `releases/retinarave-v0.23.html` (1454 KB,
157 modules; from `file://` on scene 1: errs [], nonFinite [], clock pcm), package.json 0.23.0. Not pushed (retinarave.com serves
v0.15). The user's next word: the snare / rim lane — "yes" (§69).

## §69 the ears' SNARE lane is the two MID bands' RISE — the rim the picker could not hear, and the hat it called a snare (2026-10-01, one worker; §68 open item 1, §66 open item 2, §64 open item 2, the user on the trade: "yes"; `docs/AUDIT-drums.md` "§69")

One engine commit (`e136243`, `assets/engine/ears/perc.js` + its feature docs), one tooling commit (`7f80a8d`,
the new ruler, the harness knobs and the test cases), one docs commit. **Not tagged, not pushed, not deployed.**

### What §68 handed over, reproduced

§68 measured the snare lane and did not build it, leaving one number for the user: *CyborgNinja's recall
0.61 → 0.51*. Reproduced on the node harness over the whole of all five tracks (`tools/drums-node.js`,
`drumcheck.py`), `snareEvt` against the truth's `mid` — the baseline: SeeYouDrop P 0.52 R 0.69 F **0.59** ·
CyborgNinja 0.92 / 0.59 / **0.72** · WhoLikesToParty 0.79 / 0.62 / **0.69** · Malicious 0.20 / 0.56 / **0.29** ·
Vienna 0.24 / 0.71 / **0.35**; mean F **0.528**, §68's own number to the digit.

### A fourth reference, because `mid` is the same kind of picker as the lane

`tools/truth/snaretruth.py` (new, beside `kicktruth.py`) writes `tools/truth/<T>.snare.json`: the **offline
150–800 Hz rise at the truth beat grid's 16th lines**, `kicktruth.py`'s method moved to the mid band — a 4th-order
zero-phase envelope, `rise = 20log10(peak[−5, +60] ms / mean[−85, −5] ms)`, a hit = rise ≥ 4.0 dB and a local max
over ±1 line. `drumcheck.py` grades `snare` against it as a fourth reference beside `mid` / `click` / `kick`.

It exists for §68's reason, one band up: **the truth's `mid` is itself a 150–2500 Hz MEDIAN-residual flux list at a
3 dB threshold** (`trackmap.py`), so on the one track that matters it shares the detector's blindness — Vienna's
`mid` lists **201 onsets = 1.04 /s** where §66's hand-built rim/clap reference reads **2.0 /s** over 24–60 s.

**The band was chosen on the one hand-made list there is** (§66's `tools/work/v66/clap-ref-rise.json`, 72 rim/clap
hits on Vienna's beats 2 and 4). At 4.0 dB, 150–800 Hz reproduces it at **P 1.00 / R 0.97 (70 of 72) at lag +0 ms**
against 150–600's 0.87 / 0.81, 150–1200's 0.95 / 0.96 and 150–2500's 0.98 / 0.90, and it lists **1.83 hits/s** on
Vienna against §66's own measured 1.81. The floor plateaus at 3.0–4.0 dB (R 0.97 both) and breaks at 5.0 (R 0.67),
so 4.0 is the top of the plateau, as it is for the kick. Validated where the control is trustworthy: **CyborgNinja's
`mid` at P 0.97**, WhoLikesToParty's at 0.81. Like the kick reference it is a MID-BAND TRANSIENT list, not a
snare-only one — a kick's 150–800 Hz body is a rise at a grid line too, exactly as `mid` and the engine's own
`snareEvt` count it.

### The lane, and why its band is TWO bands

`tools/work/v69/{lab,sweep,cmp,fine,grid,final}.js` run the ENGINE's own filter bank at PHOP over each track and
score candidate lanes against both references, so band, floor, baseline and refractory move independently.

The honest difficulty is that **the two references disagree about the band because each was built on one of them**.
Mean F over the five tracks against both, each candidate at its own best floor:

| lane | vs `mid` | vs `snare` | sum |
|---|---|---|---|
| the old `flux(res9)` on 150–2500 | 0.528 | 0.498 | 1.026 |
| `rise8` 150–2500 alone (`B_SNARE`) | **0.647** | 0.570 | 1.217 |
| `rise8` 150–600 alone (`B_HARM`) | 0.571 | 0.594 | 1.165 |
| `rise8` on a NEW 150–800 filter | 0.615 | **0.601** | 1.216 |
| `rise8` 150–1200 (new filter) | 0.627 | 0.586 | 1.213 |
| **`rise8` MEAN of 150–600 and 150–2500** | 0.621 | 0.609 | **1.230** |
| `rise8` MAX of the two (a union) | 0.586 | 0.589 | 1.176 |
| `rise8` MIN of the two (a hard AND) | 0.628 | 0.573 | 1.201 |

So the lane is

```
rise = ½·[ rect(dB[B_HARM]  − mean of the previous 8 hops of dB[B_HARM])
         + rect(dB[B_SNARE] − mean of the previous 8 hops of dB[B_SNARE]) ]
```

against an absolute floor. Three properties earn each piece, and each sits on a measured plateau:

- **TWO EXISTING bands, averaged.** A snare is a BODY (150–600) and a NOISE (up to ~2.5 kHz) at once, and a pad's
  or an arp's swell is usually one band only, so averaging halves it. It is the only candidate near the top on both
  references, and it needs **no new filter** — a 150–800 Hz lane of its own scores the same sum and would add an
  eighth band to the bank. MAX is a union and keeps the loose band's false fires (Vienna P 0.46 against 0.59); MIN
  is a hard AND and costs CyborgNinja's recall (0.48). Each band's rise is **rectified BEFORE the mean**, so a
  falling band contributes 0 rather than cancelling the other; the other order was measured and is identical to
  three decimals. The weight sweep 0 / .25 / .4 / .5 / .6 / .75 / 1 on the 150–600 term gives sums 1.220 / 1.228 /
  1.226 / **1.224** / 1.216 / 1.195 / 1.149 — a plateau over .25–.6, so **plain half-and-half is the centre, not a
  fit**.
- **`SNARE_BASE` 8 hops (~85 ms), `KICK_BASE`'s own number.** Swept 6 / 7 / 8 / 9 → sum 1.270 / 1.275 / 1.270 /
  1.194. One number serves both lanes and sits inside the plateau.
- **`SNARE_RISE` 3.75 dB, with NO adaptive `fm + k·fd` term**, for §68's reason: a rise is a RATIO, so one dB number
  travels across tracks and loudnesses. (Swept here too — `k` 1 buys 0.02 of sum and `k` 3 takes CyborgNinja's
  recall 0.57 → 0.40.) Floor plateau 3.5 / 3.75 / 4.0 / 4.25 dB → 1.262 / 1.270 / 1.275 / 1.275; **3.75 is the end
  of it where CyborgNinja keeps the most recall (0.57 against 0.55 at 4.0) and Vienna fires closest to its own rate
  (1.25 /s against a truth of 1.83)**.
- **`REFRACT[1]` 0.060 → 0.075 s.** The single biggest knob after the onset function: a rise against an 8-hop
  baseline still reads ~7/8 of itself on the hop AFTER a hit (§68's own observation for the low lane), so the lane
  needs the refractory explicitly. Swept 0.060 / 0.070 / 0.075 / 0.085 / 0.100 s → sum 1.224 / 1.275 / 1.275 /
  1.275 / 1.266. **0.075 is the shortest on the plateau**: 0.085 (the low lane's) would block a 16th note above
  176 BPM, and no track here goes there — which is exactly why the margin is taken on material we do not have.
  Unlike the low lane this one needs no private `last`: `emit(1)` is unconditional (a snare has no beater gate), so
  `last[1]` already IS the lane's last fire.
- **`SNARE_LAG` 0.010 s**, the lane's own, replacing `ONSET_LAG`'s 0.006 — `KICK_LAG`'s story on the mid band. At
  `ONSET_LAG` the median lag per track against `mid` reads +3 / +5 / +5 / +5 / +4 ms; the extra 4 ms puts it at
  **−1 / +1 / +1 / +1 / 0 ms, mean +0.4**, which is the OLD lane's own mean to the digit (§58: "ears +0").
- The existing level gate (`dB < p90 + GATE_DB`) is kept, per band, as the flux lane applied it.

### The five-track table

**`snareEvt`, node, whole track** (before → after), against both references:

| | vs `mid` | vs `snare` (§69) |
|---|---|---|
| SeeYouDrop | 0.59 → **0.69** (P 0.52→0.63, R 0.69→0.77) | 0.51 → **0.59** (P 0.51→0.62, R 0.51→0.57) |
| CyborgNinja | 0.72 → 0.72 (P 0.92→**0.99**, R 0.59→0.57) | 0.78 → **0.90** (P 0.77→0.94, R 0.79→0.87) |
| WhoLikesToParty | 0.69 → **0.82** (P 0.79→0.82, R 0.62→0.81) | 0.52 → **0.64** (P 0.46→0.52, R 0.58→0.84) |
| Malicious | 0.29 → **0.41** (P 0.20→0.30, R 0.56→0.68) | 0.28 → **0.46** (P 0.28→0.50, R 0.29→0.42) |
| **Vienna** | 0.35 → **0.59** (P 0.24→**0.54**, R 0.71→0.65) | 0.32 → **0.53** (P 0.25→0.65, R 0.43→0.44) |
| **mean F** | **0.528 → 0.646** | **0.482 → 0.624** |

**10 of 10 rows up or flat**, and on Vienna's own rim/clap list the lane reads **P 0.84 / R 0.57 / F 0.68 at +2 ms**
against the old lane's **P 0.37 / R 0.68 / F 0.48**. Lag p50 vs `mid` **+1 / +1 / +1 / +1 / −2 ms** against the old
+0 / +2 / +1 / −2 / +1.

**Page, det, `&map=0`, `CLOCK=1`, 20–110 s, one `tools/filetrace.js` trace per track, `drumcheck.py`** — `snareEvt` F:

| | vs `mid` | vs `snare` | lag p50 vs `mid` |
|---|---|---|---|
| SeeYouDrop | 0.69 → **0.73** | 0.63 → **0.68** | +0 → +1 ms |
| CyborgNinja | 0.70 → **0.71** (P 0.92→**1.00**) | 0.78 → **0.91** | −9 → −12 |
| WhoLikesToParty | 0.70 → **0.82** | 0.54 → **0.65** | +1 → +1 |
| Malicious | 0.32 → **0.46** | 0.25 → **0.45** | −11 → −10 |
| **Vienna** | 0.42 → **0.72** (P 0.29→**0.77**) | 0.32 → **0.55** (P 0.24→0.68) | −1 → −3 |

### CyborgNinja's recall: the question was mis-framed

The user accepted a recall loss. It is smaller than §68's preview (0.59 → **0.57**, not 0.61 → 0.51 — §68's figure
came from the lab's own picker, the engine's reads 0.59), and the diagnosis says it should not be bought back.

Of the **101** `mid` onsets the old lane found and the new one drops (`tools/work/v69/final.js --diag --diag2`):

| | median two-band rise | median hat-band (5–12 k) rise | on the truth `high` list | on the §69 snare reference | on the `click` list |
|---|---|---|---|---|---|
| the 101 LOST | **2.46 dB** | 9.18 dB | 97 % | **21 %** | 41 % |
| the 627 KEPT | **7.56 dB** | 9.63 dB | 99 % | **92 %** | 94 % |

They are **hats** — a 150–2500 Hz flux list counts a hat's spill and a mid-band RISE rightly does not. Hat
co-incidence is not the discriminator (94 % of the lost and 90 % of the kept have a hat within 30 ms; on this track
almost everything does); the absence of a mid-band BODY is. Measured and **rejected**: a lower floor for the mid
lane does buy the recall back and buys hats with it — floor 2.0 dB takes CyborgNinja R 0.58 → 0.69 and **92 % of
the lane's fires onto a hat**, while its F against the snare reference falls 0.89 → 0.84. Also measured and not
needed: excluding the >2.5 kHz band is what the 150–600 term already does inside the mean, and gating on the HIGH
lane's own onset would veto 90 % of the real snares on this track. **Nothing was added.** The row the user was
warned about moves −0.02 and the same track's F against the grid reference moves 0.78 → **0.90**.

### What DUST does with it — §66's own complaint

`tools/dust-trace.js` on the final tree, scene 1, `&map=0`, graded by `tools/work/v69/dustsnare.py` against
`<T>.snare.json` at ±50 ms (§64's tolerance). The two traces of each pair differ only in `perc.js`. DUST's snare
voice is the flash ring on the body annulus, and it fires on **the earlier of** `snareEvt` and the `snare2` edge
(§58 task B), so it sees the lane through a union with a level that did NOT change.

| | before | after |
|---|---|---|
| **Vienna 24–60 s** (truth 70 hits = 1.94 /s) | **173 fires (4.81 /s), P 0.29 / R 0.71 / F 0.41** | **114 fires (3.17 /s), P 0.45 / R 0.73 / F 0.55** |
| … share of fires at the voice's FLOOR | **39 %** | **11 %** |
| … amp at a matched fire / at an unmatched one | 0.618 / 0.263 | 0.642 / **0.417** |
| **SeeYouDrop 20–110 s** (truth 307 = 3.41 /s) | 333 (3.70 /s), P 0.64 / R 0.70 / F 0.67 | **367 (4.08 /s), P 0.66 / R 0.79 / F 0.72** |
| **CyborgNinja 20–50 s** (truth 110 = 3.67 /s) | 197 (6.57 /s), P 0.52 / R 0.93 / F 0.66 | 193 (6.43 /s), P 0.53 / R 0.94 / **F 0.68** |

§66's own number is reproduced to the digit — **4.81 /s** — and it falls to 3.17, with the share of floor-sized
flashes (the uneven big-and-tiny rhythm §64 named) going **39 % → 11 %**. Both controls are better too.

**The remaining over-firing on Vienna is `snare2`'s, and that is measurable.** `tools/work/v69/voicesim.js` replays
`voices.js`'s own `voice()` rule over each trace's columns under three trigger policies:

| after the change | Vienna 24–60 (truth 1.94 /s) | SeeYouDrop 20–110 (3.41 /s) | CyborgNinja 20–50 (3.67 /s) |
|---|---|---|---|
| UNION (what ships) | 3.19 /s · P 0.45 · F 0.56 | 4.08 /s · P 0.66 · F 0.72 | 6.43 /s · P 0.53 · F 0.68 |
| **the LANE alone** | **1.39 /s · P 0.80 · F 0.67** | 3.88 /s · P 0.68 · **F 0.73** | **3.17 /s · P 0.94 · F 0.87** |
| `snare2` alone (unchanged) | 3.03 /s · P 0.42 · F 0.51 | 1.72 /s · P 0.74 · F 0.50 | 6.30 /s · P 0.53 · F 0.68 |

The lane alone is now the best policy on **all three windows, including SeeYouDrop** — which is where §64's same
question about the HAT had to keep the union, because coverage fell there. It is not taken here: it is a SCENE
change the user has not seen, and a voice that drops the level loses its SIZE (the amp p50 sits at the floor 0.200,
because `voices.js` deliberately does not read the ears' velocity — §51's "the velocity saturates"). It is §69's
open item with the numbers already in hand.

### The `snare2` decision: it stays synapse's

`snare2` — the level the scenes read for SIZE, and TORUS2's default since 2026-09-29 — **does not move.** Measured
both ways on the whole of all five tracks (`drumcheck.py --src ears,v2`): synapse's `snare2` reads mean F **0.664**
against `mid` and **0.448** against the snare reference, the new lane **0.646** and **0.624**; per track the lane
now wins on `mid` on 3 of 5 (SeeYouDrop 0.69 vs 0.63, WhoLikesToParty 0.82 vs 0.79, Vienna 0.59 vs 0.52) and on
the grid reference on **5 of 5**, and its lag is ≈ 0 against `snare2`'s +5 / +10 / +10 / +6 / +12 ms. §51's own
criterion — "synapse's are better than the ears' on 3 of 4 tracks" — has therefore flipped.

It stays anyway, for three reasons that are not about the measurement: moving it needs a new `snare` / `snareFl`
stream out of the ears and a strength rank in `engine/drums/drums.js` (the brief is the picker, not the reactive
stage); it would move a scene's DEFAULT look, and §51's rule is that the default moves only on the user's word; and
DUST's voice already fires on **the earlier of** `snareEvt` and the `snare2` edge, so the lane reaches the picture
without it, with the level still SIZING each hit (voices.js: "the event only PLACES the hit"). The numbers that
would justify moving it are in DUST's own table below, and it is the §69 open item.

Note where each field comes from, because it decides what the lane reaches: in FILE + MAP mode
`snareEvt` / `snareAge` / `snareVel` / `denS` are the map's own non-causal list (`features-ears.js mapOverride`),
so **§69 is a LIVE-mode and `&map=0` change** — which is where the user's attention has been since 2026-09-28 —
while `snare2`, being synapse's, is causal in every mode. The kick lane has the same split.

### Everything else that reads these onsets, proved

- **The whole-track MAP is byte-identical on all five tracks** (`md5 d809f6e7`, §68's own hash). `map.js` runs its
  own `PercTrack` but collects only `'kick'` from it (`densE` is kicks per second), and `map.onsets.snare` is the
  offline picker in `map/onsets.js` — 387 / 1078 / 1219 / 236 / 201, the truth's `mid` counts exactly.
- **The LOW lane and the HAT are byte-identical**, column for column, on all five node traces: `lowEvt`, `lowFl`,
  `lowT`, `kickEvt`, `kickVel`, `denK`, `hatEvt`, `denH`. The two lanes share only `BANDS`, and class 1 touches
  `p95[1]` / `last[1]` / `hist[1]` and nothing else.
- **The live build / drop detector (§54) is byte-identical** on all five tracks: `buildLive`, `dropLiveIn`,
  `dropLiveEvt`, `dropEvt`, `dropEnv`, `tension`, `subGate`, `bassReg`. `build/feed.js` reads bass / hp / sub, not
  snares. 89 of the 122 columns of `tools/build-node.js`'s trace are identical on every track.
- **The bar store (§50) moves and improves.** `bars/feed.js` takes `denS` in `FEAT_NAMES` and `snareEvt` / `snareAge`
  in `EVT`, so `barMatch` and the bar events move. Graded by `predcheck.py` on the same node traces, the store's
  SNARE route: SeeYouDrop pred F 0.562 → **0.608**, reactive 0.591 → **0.693**; Vienna pred F 0.300 → **0.337** with
  P 0.420 → **0.796** and lag p90 +14.0 → **+1.6 ms**, reactive 0.353 → **0.590** with P 0.235 → 0.542. The kick and
  hat routes of the same ruler are unmoved to the digit.
- **The predicted-event queue (§55) moves and improves on 4 of 5.** `nextSnareIn` (`queuecheck.py`): SeeYouDrop
  0.59 → **0.64** (jumps 23.7 → **9.4** /min) · CyborgNinja 0.45 → 0.39 (31.3 → 25.9) · WhoLikesToParty 0.55 →
  **0.66** (18.6 → **5.5**) · Malicious 0.10 → **0.25** (75.0 → 33.6) · **Vienna 0.30 → 0.33 with P 0.42 → 0.76,
  lag p90 13 → 8 ms and 8.1 → 0.0 jumps/min** — and Vienna's predicted snare PERIOD becomes 0.66 s, the half note
  at 90 BPM, against 0.33 before. `nextKickIn` / `nextHatIn` / `nextBeatIn` / `nextBarIn` / `nextDropIn` are
  unmoved on every track.
- **§59's clock tables move; they were re-measured on all five tracks** (`tools/clock-study.js` + `gridcheck.py
  --heard`, the whole track). The PCM clock takes every percussion onset as a phase measurement
  (`clock.js R_CLS[1]` = 1.5), so this is the one stage §68 could prove unmoved and §69 cannot:

  | | lock | lag med | \|lag\| p50 / p90 | within ±30 ms | conf on / off beat |
  |---|---|---|---|---|---|
  | SeeYouDrop | 9.2 → 12.0 s | +1 → +3 ms | 8/19 → 8/21 | 98 → 97 % | 0.93/0.47 → 0.93/0.80 |
  | **CyborgNinja** | **17.9 → 3.4 s** | +1 → +1 | 2/4 → **1/3** | 93 → **97 %** | 0.93/0.93 → 0.94/0.92 |
  | WhoLikesToParty | 5.6 → 5.6 s | +6 → +6 | 6/9 → 6/10 | 99 → 99 % | 0.93/0.92 → = |
  | Malicious | 6.1 → 6.1 s | +23 → **+30** | 23/36 → 30/49 | 80 → **50 %** | 0.90/0.90 → 0.91/0.90 |
  | **Vienna** | 20.9 → 20.9 s | +6 → **+4** | 7/82 → **5/67** | 73 → 74 % | 0.91/0.86 → 0.92/0.81 |

  **CyborgNinja's lock — §59's own worst number — falls from 17.9 s to 3.4 s** and its in-octave accuracy rises to
  97 %. The two rows that get worse are stated, not hidden: SeeYouDrop's lock (9.2 → 12.0 s) and the confidence
  separation §68 had just won there (off-beat 0.47 → 0.80), and **Malicious's bias** (+23 → +30 ms), which drops it
  through the 30 ms gate from 80 % to 50 % — on the one track whose truth grid is marked "tempo only" and whose own
  tempo is 0.33 BPM from the clock's, and whose BIAS-REMOVED steadiness is unchanged (94 → **95 %** within ±30 ms
  of its own median). Nothing in the lane is tuned on the clock.
- **The fake-timeline md5 sweep: 0 of the 24 lines move.** The ears never run under `#test`; taken as an ISOLATED
  pair in a `git worktree` of HEAD (`PORT=8906 tools/scene-md5.sh`) with only `perc.js` different, per §60's harness
  rule. 12 scenes, `errs []` on every one, both sides.
- **Cost: inside the noise.** `Ears.push` over the whole of Vienna, three interleaved old/new pairs per run, two
  runs: best **72.85 → 72.92** µs per 512-sample block (+0.1 %) and **73.36 → 73.03** (−0.4 %) — the two runs
  disagree in sign, so the change is under the ±0.5 % this machine can resolve. **The machine was NOT idle** (load
  average 3.5–3.8 throughout; the busy processes are outside this session and could not be stopped), which is why
  only the interleaved pair is quoted. Expected: the band COUNT is unchanged — both bands were already in the bank
  — and the lane adds 16 adds and 2 divides per hop at 94 hops/s against a 7-band 4th-order filter bank running at
  48 kHz. `test_ears.js`'s own gate reads 0.0605 → 0.0579 ms median per block against a 0.19 ms budget.
- **`node tools/check.js` 0 fail** (157 modules, 202 uniforms, 205 MS keys, help.feats gaps 0, the 5 pre-existing
  soft-cap warns) · **`npm test` OK**. `tools/test_drums.js` has **9 new cases** on two synthetics, each graded
  against the old lane in a worktree of HEAD: **a rim on 2 and 4 under 16th hats over a continuous mid bed** (the
  CyborgNinja geometry — without the bed a hat on silence is an infinite rise in every band it touches, however
  faint, and the test would say nothing) reads **40 fires for 40 rims, P 1.000 / R 1.000 at lag p50 −8.7 ms**
  against the old lane's **51 fires, P 0.78**, with the hat lane untouched at 310 fires for 320 hats either way;
  and **a snare under a 1.5 s mid pad swell** fires once, on the stick, where the old lane fires twice inside the
  swell (1.034 and 1.162 s) — §64's "a median lags a swell", one band down. `snareEvt` / `snareVel` / `denS` all
  follow the lane in the same cases. `tools/test_ears.js`'s own windows read snare F (25–45 / 57–90 / 105–130 s)
  **0.72 / 0.73 / 0.64 → 0.67 / 0.83 / 0.72** at n 513 → 470 and its onset-error row snare med −1 p90 6 → −1 p90
  11 ms; its 4 failures at 48 kHz are pre-existing and unmoved.
- **No audible run.** Every number above is the deterministic file path or node.

### Open, for the orchestrator

- **§68 open item 1 is CLOSED, and with it §66 open item 2 and §64 open item 2.** The lane is in the picker, so
  every reader benefits: `snareEvt`, `snareAge`, `snareVel`, `denS`, DUST's flash ring, the bar store's
  fingerprints, the predicted queue's snare row and the PCM clock's phase measurements.
- **`snare2` is the next decision and it is the user's** (above): the lane now beats synapse's level on the grid
  reference 5 of 5 and on `mid` 3 of 5, at ~0 ms against +5…+12, but moving it needs a new stream out of the ears
  and it moves TORUS2's DEFAULT look.
- **DUST's snare voice could take the lane ALONE** — better on all three windows, including the control §64 had to
  protect. One argument in `assets/scenes/dust/index.js`; it needs the user's eye and a size for an unconfirmed
  hit, not another number.
- **Malicious's PCM clock bias** +23 → +30 ms (80 % → 50 % within ±30 ms of a truth grid marked "tempo only" and
  0.33 BPM away; bias-removed 94 → 95 %). The one row that gets worse and cannot be blamed on the reference.
- **SeeYouDrop's PCM lock** 9.2 → 12.0 s and the confidence separation §68 had just won there (off-beat 0.47 →
  0.80). Both are the same track's clock finding fewer, cleaner snare measurements early.
- `tools/truth/<T>.snare.json` is built from the truth BEAT grid, so like the kick reference it inherits each
  track's grid — Vienna's `Vienna.json` is still `provisional` and Malicious is "tempo only", which is why `mid` is
  still graded beside it rather than replaced.
- The lab and sweep scripts are `tools/work/v69/{lab,sweep,cmp,fine,grid,final,lagsel,snarelab,voicesim,dustsnare,
  diffcols,cost,syndbg*}.js|py`, gitignored like §68's; the reference BUILDER was promoted to
  `tools/truth/snaretruth.py` because `drumcheck.py` now depends on its output.
- **`tools/accept.sh` still has not been run since v0.14** (§65 item 5, unchanged by this session).

**The A/B watch list, in TRACK time** (the user listens in stream / live mode, where the lane is what the scenes read;
in file + map mode `snareEvt` is still the map's own list and only `snare2` is causal):
- **Vienna 0:24–1:00** — the rim/clap on beats 2 and 4. DUST's flash ring should now land ON the backbeat and stop
  flickering between hits: 4.81 → 3.17 flashes/s against a groove of 1.94, and the tiny floor-sized flashes 39 % →
  11 %. This is §66's own complaint ("the snare voice is still the loudest wrong voice").
- **Vienna 1:46–2:00** (drop 2) — the same ring over the octave change; the lane's precision there is where the
  biggest gain is.
- **CyborgNinja 0:20–0:50** — the control for "does it still fire enough at 160 BPM". The ring's rate is unchanged
  (6.57 → 6.43 /s) but the beat should sit tighter: the PCM clock locks at **3.4 s instead of 17.9**.
- **SeeYouDrop 0:20–1:50** — the second control; the ring fires a little MORE often (3.70 → 4.08 /s against a truth
  of 3.41) and better placed. Watch whether its clock feels slower to settle (lock 9.2 → 12.0 s).
- **Malicious** — the one track that gets worse: the beat grid sits ~7 ms further off the truth. Nothing else on
  this track is reliable either (§51: neither detector finds its kicks).

**v0.24 tagged locally (2026-10-01) on the user's word ("it does look better, tag what has been done already"; deploy still held):**
v0.23 + §69 (the ears' snare / rim lane). `releases/retinarave-v0.24.html` (1460 KB, 157 modules; from `file://` on scene 1:
errs [], nonFinite [], clock pcm), package.json 0.24.0. Not pushed (retinarave.com serves v0.15). Next on the user's word: the
scenes' snare size onto the lane (`snare2` → the lane's own velocity) and Malicious's +30 ms clock bias (§70, §71).

## §70 the SCENES' snare is the lane alone, and a hit now has a SIZE — `kickAmp` / `snareAmp`, and the saturation was a sign (2026-10-01, one worker; §69's open item, the user's word; `docs/AUDIT-drums.md` "§69")

Three commits: `074061b` the engine's new fields, `e2c950a` DUST's flash ring, `7d679d2` TORUS2's snare wave.
**Not tagged, not pushed, not deployed.**

### What §69 handed over

§69 simulated DUST's snare voice on the lane ALONE and found it best on all three windows (Vienna 1.39 /s at
P 0.80 against the union's 3.19 /s at P 0.45; SeeYouDrop P 0.68 / F 0.73; CyborgNinja P 0.94 / F 0.87) and did not
ship it, for two reasons: it changes cross-scene defaults, and **a lane-only hit has no size** — `voices.js`
deliberately does not read the ears' velocity, because §51 measured it saturated ("`kickVel` p50 1.0, the uniform
brightness of the predicted route"), so every lane-only flash came out at the voice's floor 0.200.

### The saturation is a SIGN, not the music

`dsp.js`'s stochastic quantile is

```js
this.v += x > this.v ? s * (1 - this.q) : -s * this.q;      // q = 0.95 → up 0.001, down 0.019
```

At equilibrium the fraction of samples BELOW `v` satisfies `(1 − F)·(1 − q) = F·q`, i.e. **F = 1 − q**. So
`new Quantile(0.95, …)` settles on the **5th** percentile, not the 95th — confirmed directly
(`tools/work/v70/qtest.mjs`: 200 000 draws from U(0, 10) give `Quantile(0.95).v` = **0.384** and
`Quantile(0.05).v` = **9.376**, against the true p05 0.5 and p95 9.5). The snare lane's `p95[1]` therefore sits at
**3.86 / 4.41 / 4.18 / 3.84 / 4.31 dB** on the five tracks — a hair over `SNARE_RISE` 3.75 — against a true-hit p95
of **11.9 / 19.4 / 23.1 / 7.7 / 9.0**, and `snareVel = clamp01(rise / p5)` reads exactly 1.000 for **91 / 54 / 55 /
74 / 52 %** of the hits. §51's observation was right and its explanation was wrong.

**The convention is deliberately NOT fixed.** The same class carries every percussion band's level gate
(`perc.js lvl`, p90, the `GATE_DB −34` reference), the sub gate's own p90 (`sub.js q90`) and `lpSweep`'s
(`texture.js rollP90`) — four live readers, every one of them calibrated against the number it actually gets.
Flipping the sign moves every band gate in the picker, which moves the map, the bar store, the queue and §59's clock
tables all at once. It is an engine item with its own session (docs/OPEN-ITEMS.md), not a side-effect of a scene
change.

### The field: `amp = clamp01(rise_dB / SPAN)`

No quantile at all — §68's own principle, one band up: *a rise is a RATIO, so one absolute dB number travels across
tracks and loudnesses.*

`tools/work/v70/{risedist,ampsweep}.js` run the engine's own `PercTrack` over the whole of all five tracks, record
the rise that fired every lane fire, and match each fire to `tools/truth/<T>.snare.json` / `<T>.kick.json` at
±50 ms. The rise at a TRUE hit, in dB:

| | p10 | p50 | p95 | | p10 | p50 | p95 |
|---|---|---|---|---|---|---|---|
| | **snare lane** | | | | **low lane** | | |
| SeeYouDrop | 4.08 | 6.32 | **11.90** | | 5.36 | 7.75 | **16.47** |
| CyborgNinja | 4.23 | 6.95 | 19.45 | | 5.98 | 9.69 | 23.15 |
| WhoLikesToParty | 4.65 | 8.78 | 23.08 | | 6.35 | 19.15 | 37.26 |
| Malicious | 3.90 | 4.73 | 7.75 | | 5.21 | 6.28 | 9.55 |
| Vienna | 4.20 | 5.62 | 8.97 | | 5.39 | 6.81 | 10.74 |
| pooled | 4.13 | 6.47 | 19.62 | | 5.45 | 8.76 | 30.37 |

**SPAN is the MEDIAN TRACK's p95, rounded** — 11.9 → **12 dB** for the snare, 16.5 → **16 dB** for the kick. One
absolute mapping cannot put a 7.7 dB track and a 23 dB track both at 1, and the median track is the honest centre of
that spread; the pooled p95 (19.6 / 30.4) would leave Vienna's hardest rim at 0.46 and Malicious's at 0.40.

Each lane's **FLOOR is 0**, which is not a convenience: it makes each lane's own threshold map to itself over its
span, and `3.75/12` and `5.0/16` are both exactly **0.3125**. So "a hit that only just fired" is the same soft
0.31-sized hit in BOTH lanes, the two channels are directly comparable, and — the thing a lane-only trigger needs —
no fire is ever invisible. (A FLOOR term was swept at 1 / 2 / 2.5 / 3 dB and only pushes a threshold hit toward
invisibility. The SPAN sweep: snare 10 / 12 / 14 / 16 dB puts the threshold at 0.38 / 0.31 / 0.27 / 0.23 and the
ceiling share at 23 / 17 / 13 / 9 %; **12 is where the threshold IS the brief's "a soft hit ≈ 0.3"**.)

What the published fields read at each event, `tools/drums-node.js` whole track (`tools/work/v70/ampnode.js`):

| | `snareVel` p10/p50/p90 · at 1.000 | `snareAmp` p10/p50/p90 · at 1.000 |
|---|---|---|
| SeeYouDrop | 1.000 / 1.000 / 1.000 · 91 % | 0.330 / 0.477 / 0.828 · 3 % |
| CyborgNinja | 0.612 / 1.000 / 1.000 · 54 % | 0.346 / 0.561 / 1.000 · 18 % |
| WhoLikesToParty | 0.472 / 1.000 / 1.000 · 55 % | 0.339 / 0.586 / 1.000 · 23 % |
| Malicious | 0.835 / 1.000 / 1.000 · 74 % | 0.323 / 0.382 / 0.545 · 0 % |
| Vienna | 0.753 / 1.000 / 1.000 · 52 % | 0.329 / 0.427 / 0.689 · 0 % |

### The amp RIDES THE EVENT — and that is why `*Vel` is one hit stale

`kickAmp` / `snareAmp` are NOT `CONT` history fields. `kickVel` / `snareVel` are, and the ears read a `CONT` field
by interpolating the history ring AT heard time — while an onset's audio time is `(hop end) − half a hop − the
lane's lag`, about **16 ms BEFORE the hop that found it**. So on the frame the event is released, the ring still
holds the PREVIOUS hit's velocity. `snareAge` has always been exact because it comes from the released event; the
amp does the same (`perc.js emit(c, t, vel, amp)` → `Ears.read` holds `lastAmp[cls]`). Caught by the first
synthetic probe, where the amp was non-monotone in the hit's amplitude, and now a `test_drums.js` case: on the frame
the first synthetic rim fires, `snareVel` reads **0.000** and `snareAmp` reads its own **0.322**.

There is no `hatAmp`: the hat is the one class still on the HPSS-lite flux (§69), whose onset function is a one-hop
difference of a median residual and has no magnitude in dB to publish.

In **FILE + map** mode `kickAmp` / `snareAmp` are the map's own velocity, which is an OFFLINE `numpy` p95 over the
class's peak fluxes (`map/onsets.js` `VEL_P`) and so does not saturate — the honest size the causal path had to
build is simply what the map already published. As in §69, this is therefore a **LIVE-mode and `&map=0` change**.

### DUST's flash ring: the lane alone, sized by `snareAmp`

`voices.js voice()` takes a 7th argument `amp`. Given it, the voice is in LANE mode: the level's rising edge is not a
trigger and its confirm branch is dead; a fire's size is `max(floor, amp)`. **`snare2` is still passed and is still
the FLOOR under the envelope** — measured, not assumed (`tools/work/v70/voicesim.js`, five policies over the same
traces): dropping it takes Vienna's `v.e` p50 0.285 → 0.245 and p95 0.659 → 0.595, so the level still holds the body
annulus up BETWEEN hits. The KICK and the HAT keep the union: the v2 kick IS the ears' low lane (§51), and §64's
answer for the hat was that coverage matters more than precision there.

`tools/dust-trace.js` scene 1 `&map=0`, graded by `tools/work/v70/dustsnare.py` against `<T>.snare.json` at ±50 ms.
Each pair back to back in an isolated `git worktree` of `074061b` with only `assets/scenes/dust/` different, and the
pair proved by the md5 of each trace's `beatCount` / `dropEnv` / `eM` columns (identical on all three windows).

| | before (the union) | after (the lane + `snareAmp`) |
|---|---|---|
| **Vienna 24–60 s** (truth 70 = 1.94 /s) | 114 fires (3.17 /s), P 0.45 / R 0.73 / F 0.55 | **49 (1.36 /s), P 0.80** / R 0.56 / F **0.66** |
| … at the voice's FLOOR · amp p10 / p50 | 11 % · 0.259 / 0.495 | **0 %** · **0.407** / 0.590 |
| … median gap between flashes | 267 ms | **667 ms** — the half note at 90 BPM, the backbeat itself |
| … lumC lift per flash p50 · lag p90 | +13.85 · +14 ms | **+26.05** · **−3 ms** |
| **SeeYouDrop 20–110 s** (307 = 3.41 /s) | 367 (4.08 /s), P 0.66 / R 0.79 / F 0.72 | 349 (3.88 /s), P **0.68** / R 0.78 / F **0.73** |
| … at the floor · amp p50 | **72 %** · 0.250 | **0 %** · **0.494** |
| **CyborgNinja 20–50 s** (110 = 3.67 /s) | 193 (6.43 /s), P 0.53 / R 0.94 / F 0.68 | **95 (3.17 /s), P 0.94** / R 0.81 / F **0.87** |
| … at the floor · lumC lift · gap p50 | 15 % · +11.23 · 183 ms | **0 %** · **+17.37** · **367 ms** (the 8th at 160 BPM) |

Every number reproduces §69's own simulation of this policy to the digit, and **both controls are better than the
union** — which is the test §64's same question about the HAT had to fail. The one row that gets worse is stated:
**Vienna's recall 0.73 → 0.56**, 49 flashes against 70 reference hits on the one track whose truth beat grid is still
`provisional`. §66's complaint was the opposite one ("the snare voice is still the loudest wrong voice", 4.81 /s
against a groove of 1.94); what is left now lands one flash per backbeat at P 0.80 with none of them floor-sized.

### TORUS2's snare wave — and the channel that was dead on SeeYouDrop

`math/waves.js step()` takes an optional `hits` array: a non-negative entry replaces that band's LEVEL EDGE with "an
event just fired, launch at this amplitude", anything else leaves the band on the edge detector. GIELIS, the other
`mkWaves()` caller, is untouched (its md5 lines are identical). TORUS2 passes
`[-1, snareEvt ? max(0.01, snareAmp) : 0, -1]`.

The edge detector needed `snare2 > HI (0.45)` having been under `LO (0.25)`, and **synapse's `snare2` never gets
there on SeeYouDrop** — §69 measured its mean at 0.125 at a snare line (0.370 CyborgNinja, 0.422 Vienna). So
TORUS2's snare band launched **17 waves in 90 s** of the user's own reference track against a groove of 3.41 /s. The
channel was effectively dead and no ruler had ever counted it: `info()` reported wave POSITIONS, never LAUNCHES.
`mkWaves` now keeps a per-band launch count and last amplitude (`fires()` / `lastAmp()`, reset with the buffer, never
read by the look), TORUS2 reports them from a new read-only `hooks.dinfo()`, and `tools/work/v70/t2snare.py` grades a
step in `d_fS`. The BEFORE side of each pair is the same tree with only the `hits` argument removed.

| | before (`snare2`'s edge) | after (the lane + `snareAmp`) |
|---|---|---|
| **SeeYouDrop 20–110 s** (truth 307 = 3.41 /s) | **17 launches (0.19 /s)**, P 0.59 / R 0.03 / F 0.06 | **349 (3.88 /s), P 0.68 / R 0.78 / F 0.73** |
| **CyborgNinja 20–50 s** (110 = 3.67 /s) | 55 (1.83 /s), P 0.80 / R 0.40 / F 0.53 | **95 (3.17 /s), P 0.94 / R 0.81 / F 0.87** |
| **Vienna 24–60 s** (70 = 1.94 /s) | 56 (1.56 /s), P 0.52 / R 0.41 / F 0.46 | **49 (1.36 /s), P 0.80** / R 0.56 / F **0.66** |
| lag p50/p90 · launch amp p10 (SYD · CN · Vienna) | −21/−14 · −16/−12 · −3/+1 ms · 0.551 / 0.475 / 0.566 | **−4/+16 · −12/−2 · −3/−3 ms** · **0.334 / 0.345 / 0.407** |

`HI`/`LO` also meant a wave could only ever launch at 0.45 or more; the lane's amplitude starts at 0.31, so a soft
rim now sends a small wave where before it sent none. **The look is otherwise the same picture:** mean luminance p50
Vienna 100.10 → 98.23, CyborgNinja 99.99 → 100.32, SeeYouDrop 60.60 → 62.79; lumC 166.27 → 164.60 / 160.85 → 161.96
/ 103.23 → 107.74; lumR 116.10 → 113.60 / 119.65 → 120.11 / 83.43 → 85.72. Waves alive p50 8 → 13 on SeeYouDrop (its
snare band now has some). `hooks.train('4x4'|'sync')` is unaffected — `step` returns before the band loop while a
pattern is pinned.

### Every consumer of the snare, and what each now reads

`grep -rn "snare2\|snareVel\|snareEvt\|snareAmp" assets` — six readers, three of them documentation:

| reader | before | now |
|---|---|---|
| `scenes/dust` (flash ring) | the earlier of `snareEvt` and the `snare2` edge; `snare2` sizes it | **`snareEvt` alone; `snareAmp` sizes it**; `snare2` is the envelope's floor |
| `scenes/torus2` (snare wave) | the `snare2` edge; `min(1, snare2)` sizes it | **`snareEvt` alone; `snareAmp` sizes it**; `snare2` still in `feats` |
| `scenes/chladni` (the plate's ring) | `snareAge` + `snareVel` | **unchanged** — see below |
| `engine/bars/feed.js` | `snareEvt` / `snareAge` / `denS` | unchanged (it does not read `snareVel`, so §70 cannot move the bar store) |
| `engine/features-ears.js` | the map override | **publishes `snareAmp` = the map's velocity in file+map mode** |
| `scenes/{dust,torus2,chladni}/help.js` | — | the two new entries, and `snare2` re-described as the level underneath |

**CHLADNI is left alone, with the number.** It already reads the lane (`snareAge`), and its size is
`U.snF = SNAMP(0.55) · clamp(snareVel, 0, 1.5) · exp(−snareAge/SNTC(0.16))`. Moving it to `snareAmp` would take the
ring from full brightness on 52–91 % of hits to 0.33–0.69 — a **brightness recalibration** of a scene's validated
default (the user OK'd CHLADNI in v0.15), not a trigger change, and `SNAMP` would have to be re-tuned with it. It
wants its own A/B. `snare2` likewise stays published and routable: nothing was deleted.

### Proofs

- **The existing engine is byte-identical.** Every column of a `tools/drums-node.js` trace on all five tracks, against
  an isolated worktree of `9b164e2` (`tools/work/v70/diffcols.js`: 21 identical, 0 moved, only `+kickAmp +snareAmp`).
  The event log's vocabulary is unchanged (it writes `vel` only).
- **The fake-timeline md5 sweep: 4 of the 24 lines move — DUST (s1) and TORUS2 (s3), f360 and f840 — and the other
  20 (ten scenes, GIELIS among them) are identical.** Taken as an isolated pair in `git worktree`s, `errs []` on
  every scene on both sides. **Why they move, measured, not guessed:** under `#test` the ears never run, so
  `snareEvt` is `false`, `snareAge` 99 and `snareAmp` 0, while `snare2` is synapse's own fake snare level — read
  straight off the page at f840: `{snareEvt: false, snareAmp: 0, snareAge: 99, snare2: 0.001, dustFS: 0, dustFK: 14,
  t2FS: 0}`. So both scenes' snare channels are simply SILENT on the fake timeline, where the level used to drive
  them. **CHLADNI's snare ring has been dark there since v0.15 for exactly this reason** (`exp(−99/0.16)` = 0), which
  is the precedent — and the open item: the fake timeline should carry the ears' event channels so the md5 sweep
  exercises them. Giving it `snareEvt` / `snareAge` / `snareAmp` would move CHLADNI's lines too, so it is a tools
  decision like the `parity.js` NAV rows, not a scene one.
- **`tools/parity.js fake`:** 72 fields compared, unchanged — the only MISMATCH is the pre-existing NAV block
  (`nav.lg 7.852`, OPEN-ITEMS 2026-09-29, to the digit), and `kickAmp` / `snareAmp` appear as "missing in v3" INFO,
  which is what an additive field is supposed to do.
- **Cost is flat.** `CARD.bench(id, 300)` interleaved with NAV, three pairs each, warm-up discarded, `q` pinned 0.95
  for 9 s (HARNESS bench protocol): DUST **1.323 → 1.286 ms** against NAV 2.458 → 2.376, ratio **0.538 → 0.541**;
  TORUS2 **1.392 → 1.374** against NAV 2.412 → 2.422, ratio **0.577 → 0.567**. Both moves are inside the ±2 % spread
  of the three pairs themselves. Expected: one MS read and one branch per frame in each scene. **The machine was not
  idle** (load average 3.3–3.8, a parallel session's processes), which is why only interleaved pairs are quoted.
- **`node tools/check.js` 0 fail** (157 modules, 202 uniforms, MS keys 205 → **207**, help.feats gaps 0, the 5
  pre-existing soft-cap warns — `torus2/index.js` was kept under its own cap) · **`npm test` OK** with **6 new
  `test_drums.js` cases**: a hit under the 3.75 dB floor does not fire at all; a SOFT rim reads `snareAmp` **0.322**
  and a HARD one **1.000** (± 0.1); 3.2× the hit amplitude moves the amp 0.322 → 0.901, so the SPAN and not the clamp
  does the work; `kickAmp` reads 0.313–0.562 with **0** at the ceiling where `kickVel` puts **12 of 39** identical
  synthetic kicks at 1.000; and `snareVel` reads 0.000 on the frame `snareAmp` reads 0.322. The synthetic hits are
  ONE rim template scaled and placed ON a hop boundary — a rim that starts mid-hop shows only part of its rise in the
  hop that fires, and that phase swamps the amplitude itself.
- **No audible run.** Every number is the deterministic file path, the node harness or the fake timeline.
- The lab scripts are `tools/work/v70/{risedist,veldist,ampsweep,ampnode,ampsyn,ampsyn2,voicesim,diffcols,qtest}.js`
  and `{dustsnare,t2snare}.py`, gitignored like §68's and §69's.

### Open, for the orchestrator

- **`dsp.js`'s `Quantile(q)` returns the (1 − q) quantile** (above). Four live readers depend on the number they
  actually get: `perc.js lvl` (every band's level gate, with `GATE_DB`), `perc.js p95` (`*Vel`), `sub.js q90` (the
  sub gate) and `texture.js rollP90` (`lpSweep`). Fixing the sign is an engine session with the map, the bar store,
  the queue and §59's clock tables all downstream of it. **Nothing should be tuned against `*Vel` until it is.**
- **CHLADNI's ring still reads `snareVel`** (above) — a brightness recalibration with `SNAMP`, wants the user's A/B.
- **`kickAmp` is published and no kick consumer moved** (the brief's instruction). DUST's kick voice and TORUS2's
  kick wave still fire on the union / the `kick2` edge and size themselves from `kick2`, which §51 built a RANK for
  precisely because `kickVel` saturated. Whether the rank or `kickAmp` is the better size is now a measurable
  question and is not measured here.
- **The fake timeline carries no percussion EVENTS** (above), so the md5 sweep cannot see a scene's event-driven
  channel at all — three scenes' snare rings are silent under `#test`.
- **Vienna's recall** on both scenes (0.73 → 0.56 DUST, 0.41 → 0.56 TORUS2 — one down, one up) against a
  `provisional` truth grid. The user's eye decides.
- Carried from §69 and still open: `tools/accept.sh` has not been run since v0.14; SeeYouDrop's PCM lock 9.2 → 12.0 s.

**The A/B watch list, in TRACK time** (stream / live mode or `&map=0`: in file + map mode `snareEvt` and `snareAmp`
are the map's own list, so DUST and TORUS2 change there too but to the MAP's snares, not the lane's):
- **SeeYouDrop 0:20–1:50, TORUS2** — the biggest change of the session and the one to look at first. The snare band
  launched 17 waves in that whole 90 s and now launches 349: the sharp bright pulse along the loudest family should
  go from "almost never" to one per snare. This is the user's own favourite music-to-viz mapping.
- **Vienna 0:24–1:00, DUST** — §66's complaint. The flash ring should land ON the backbeat and stop flickering:
  3.17 → 1.36 flashes/s against a groove of 1.94, the median gap 267 → 667 ms (the half note at 90 BPM), nothing
  floor-sized any more and each flash lifting the centre nearly twice as much (+13.9 → +26.1). Watch for the
  opposite failure: a rim the lane misses is now a flash that does not happen at all.
- **Vienna 1:46–2:00 (drop 2), DUST + TORUS2** — the ring and the wave over the octave change, where the lane's
  precision gain is largest.
- **CyborgNinja 0:20–0:50, both** — the 160 BPM control. DUST's ring 6.43 → 3.17 /s at P 0.53 → 0.94 and TORUS2's
  waves 1.83 → 3.17 /s: on this track BOTH scenes get the backbeat they were missing, from opposite directions.
- **Any track, a soft rim vs a hard snare** — the new thing to look for: the size of a flash and the height of a
  wave now follow how hard the hit was, where before they were one brightness (`snareVel` 1.000 on 52–91 % of hits)
  or a follower's level.

## §71 Malicious's +30 ms is its TRUTH GRID, not the clock — the one track whose beat line was never put on the audio (2026-10-01, one worker; §69's open item, the user's word; `docs/AUDIT-live-grid.md` "Step 6 addendum 4")

**The ask:** §69 re-measured §59's clock tables after the snare lane and found the PCM clock's beat line on Malicious a
constant **+30 ms late** (was +23; within ±30 ms 80 % → 50 %, bias-removed 94 → 95 %). Every scene's nudge crests ~30 ms
after the beat there, at the edge of the 40 ms the user's eye reads (§52–§53). Remove it without moving the four tracks
§69 improved — **or prove it is the reference and fix nothing.**

**It is the reference.** `engine/clock/` and `engine/ears/` are untouched. Two tool files changed: a `test_clock.js`
case that nails the property the diagnosis rests on, and a printed caveat in `gridcheck.py` so the next worker is not
sent after this again. **Not tagged, not pushed, not deployed.**

### Reproduced first, both trees, in isolated worktrees

`tools/clock-study.js` + `gridcheck.py --heard`, node, whole track, five tracks, at HEAD (`9b164e2`) and at `4e175e5`
(pre-§69) in two `git worktree`s — §69's table to the digit:

| node, whole track | lag med | \|lag\| p50 / p90 | within ±30 ms | bias-removed | lock |
|---|---|---|---|---|---|
| SeeYouDrop | +1 → +3 ms | 8/19 → 8/21 | 98 → 97 % | 98 → 96 % | 9.2 → 12.0 s |
| CyborgNinja | +1 → +1 | 2/4 → **1/3** | 93 → **97 %** | 93 → 97 % | **17.9 → 3.4 s** |
| WhoLikesToParty | +6 → +6 | 6/9 → 6/10 | 99 → 99 % | 99 → 99 % | 5.6 → 5.6 s |
| **Malicious** | +23 → **+30** | 23/36 → 30/49 | 80 → **50 %** | 94 → **95 %** | 6.1 → 6.1 s |
| Vienna | +6 → **+4** | 7/82 → **5/67** | 73 → 74 % | 76 → 75 % | 20.9 → 20.9 s |

### What moved the phase, exactly: the clock's line IS the weighted mean of its phase measurements

Every ears onset is a PDA phase measurement with weight `vel / R_CLS[cls]` scaled by the gate's `beta` (`clock.js
measureLine`). Summed over the whole track from `clock-study.js`'s own `log` — each onset's offset to the nearest truth
beat, kept where it is inside ±0.15 beat (§59's own window), weighted by `beta·vel/R_CLS`:

| β-weighted offset to the truth beat (ms) | kick | snare | hat | **all** | the clock's own lag |
|---|---|---|---|---|---|
| SeeYouDrop pre-§69 → HEAD | +2.5 → +3.0 | −2.7 → −1.4 | −4.9 → −4.3 | **−1.3 → −0.5** | +1 → +3 |
| CyborgNinja | −0.4 → −0.5 | +2.7 → +1.3 | +3.0 → +3.0 | **+1.4 → +0.9** | +1 → +1 |
| WhoLikesToParty | +2.9 → +3.0 | +4.7 → +6.4 | +4.8 → +4.9 | **+3.8 → +4.7** | +6 → +6 |
| **Malicious** | **+18.5 → +21.4** | **+21.0 → +31.1** | **+12.9 → +13.8** | **+18.0 → +24.2** | **+23 → +30** |
| Vienna | +2.8 → +2.5 | +11.1 → +3.5 | +4.0 → +3.6 | **+7.3 → +3.2** | +6 → +4 |

The "all" column predicts the clock's lag on every track to within 6 ms, which is what the model says it should: the
Kalman line settles on the weighted centre of its measurements. §69 moved Malicious because the snare lane's own
placement went +21.0 → +31.1 ms **and** its share of the weight grew (β·w sum 119.5 → 142.8, 43 % → 49 % of the
total) — so the centre went +18.0 → +24.2 and the line with it. Nothing about the lane is wrong: the SAME change took
Vienna's snare term +11.1 → +3.5 and its clock +6 → +4.

**But on Malicious ALL THREE classes are late** — kick +21, snare +31, hat +14 — and the kick lane, which is the
reference the other four tracks sit on (−0.5…+3.0), is +21 there. A common-mode offset on all three inputs cannot be a
class-weighting artefact, so no re-weighting of the classes can remove it. Measured, not argued (below).

### Four independent rulers: Malicious's truth beat lines sit ~20 ms before the music's attacks

1. **The truth tool's own offline onset lists against its own beats** (median offset, onsets inside ±0.15 beat; these
   lists are zero-latency by construction and read within ±7 ms on the other four tracks):

   | median ms | `low` | `click` (kicks) | `mid` | `high` |
   |---|---|---|---|---|
   | SeeYouDrop | +6.6 | +4.3 | −2.4 | −3.9 |
   | CyborgNinja | +0.2 | +0.2 | +2.0 | +3.1 |
   | WhoLikesToParty | +4.2 | +4.3 | +6.5 | +6.0 |
   | **Malicious** | **+11.6** | **+23.5** | **+23.3** (p25 +23.0, p75 +23.6) | **+22.8** |
   | Vienna | +0.1 | +1.4 | +2.1 | −1.9 |

   Malicious's `mid` offsets are a near-delta at **+23.3 ms** — a constant, not a spread.
2. **A zero-phase attack-time measurement that uses no engine and no truth list** (4th-order `filtfilt` band, its
   `filtfilt`-smoothed envelope, the 20 % crossing of each rise; median offset to the nearest truth beat):

   | median ms | 25–60 | 40–150 | 150–800 | 800–2500 | 5 k–12 k |
   |---|---|---|---|---|---|
   | SeeYouDrop | +28.5 | +12.2 | −0.7 | −8.8 | −11.1 |
   | WhoLikesToParty | +15.2 | +13.4 | +5.1 | +5.1 | +6.3 |
   | **Malicious** | **+11.5** | **+21.4** | **+22.9** | **+17.3** | **+13.8** |

   On the two controls the bands straddle the grid line (the sub leads, the hats trail it). **On Malicious every band
   from 25 Hz to 12 kHz is late** — the grid's line sits in a gap where nothing is. So this is NOT the "beats marked on
   the kick while the felt beat is the snare" case: there is no band it is marked on.
3. **The truth tool's own rule, as a continuous scan** (`trackmap.py anchor_grid`: "the beat is the one with more
   40–150 Hz onset strength on it") — the positive zero-phase rise summed within ±0.05 beat of `beats + d`, over d.
   `E(0)/E(dmax)`, the energy at the grid's own line as a share of the best line's: SeeYouDrop 0.87 / 0.99,
   CyborgNinja 0.995 / 0.83, WhoLikesToParty 0.98 / 0.995, Vienna 0.88 / 0.98 — and **Malicious 0.89 (40–150) /
   0.53 (150–800)**, the only reading under 0.82, with the argmax at **+41 / +45 ms**.
4. **The provenance, in `trackmap.py` itself.** The beat LINE is put on the audio in exactly three ways: the kick
   anchor + drift fit (`bpm_grid.anchor`), a hand-made grid (`bpm_grid.hand`), or the hand check `gridcheck.py`'s
   docstring records. Four of the five have one — SeeYouDrop hand-checked (+2.9 ms off its own kick list),
   CyborgNinja re-anchored (+0.1), WhoLikesToParty re-anchored + drift-fitted (+0.0), Vienna hand-made (90.000 BPM,
   dp residual 0.0). **Malicious has none**: `if dpres > 0.06: beats = bdp` fires on its 89.7 ms DP residual, so its
   `beats` are the raw Ellis DP tracker's output (hop-quantised at 11.6 ms, 15.9 ms rms off a straight line, period sd
   5.05 ms), and the whole anchor branch — `if dpres <= 0.06` — is skipped. And the anchor could not have run anyway:
   its kicks' eighth-lattice resultant is **0.134** against the tool's own `ANCHOR_R` floor of 0.5 (CyborgNinja 0.959,
   WhoLikesToParty 0.544, SeeYouDrop 0.500, Vienna 0.351). `gridcheck.py`'s docstring already said so —
   *"Malicious' kicks are uniform over the beat (DP residual 90 ms): TEMPO rows only"* — and §69 graded a row the ruler
   disclaims.

**So, with the grid's own ~+23 ms taken off, the ears' three lanes on Malicious are not outliers at all** (lane's
β-weighted offset minus the same band's independently measured attack offset): kick **+0.0**, snare **+8.2**, hat
**+0.0** ms, against SeeYouDrop −9.2 / −0.7 / +6.8 · CyborgNinja −2.5 / +3.8 / +2.7 · WhoLikesToParty −10.4 / +1.3 /
−1.4 · Vienna −0.9 / +5.1 / +12.2. The hat lane lands within **0.5 ms** of the track's own 5–12 kHz attacks. And the
clock: **+30 − 23 = +7 ms** in node, which is WhoLikesToParty's row. On the **page** (one `filetrace.js` det run,
`&map=0&lead=0`, whole track) the same clock reads **+19 ms, 81 % within ±30 ms, bias-removed p50 8 / p90 24** — the
page/node gap of ~11 ms on this track is §59's own recorded pre-existing one (§59: page +10 vs node +22) and is not
this item. Against the music the page's line is therefore ~4 ms **early**.

### The three candidate fixes, measured — all three make Malicious worse and cost the others

One knob each (`CLOCKK`, no code change), the same five node runs, `gridcheck.py --heard`:

| `R_CLS` (kick / snare / hat) | SeeYouDrop | CyborgNinja | WhoLikesToParty | **Malicious** | Vienna |
|---|---|---|---|---|---|
| **1 / 1.5 / 3 (ships)** | +3 ms, 97 %, lock 12.0 s | +1, 97 %, **3.4 s** | +6, 99 %, 5.6 s | **+30, 50 %** | +4, 74 %, p90 **67** |
| (a) kick only (1 / 1e9 / 1e9) | +13, **84 %**, 12.6 s | −0, **92 %**, **17.1 s** | +6, 99 %, 3.3 s | **+36, 33 %**, lock **27.4 s** | +6, **63 %**, p90 **329** |
| (c) kick-weighted 1 / 3 / 12 | +6, 94 %, 12.2 s | −2, 93 %, 18.7 s | +5, 99 %, 5.6 s | **+37, 29 %** | +4, **69 %**, p90 **320** |
| (c) kick-weighted 1 / 6 / 24 | +8, **89 %**, 13.1 s | −2, 93 %, 18.7 s | +4, 99 %, 5.6 s | **+39, 24 %** | +4, 73 %, p90 **320** |

Kicks-define-the-beat is **backwards on this track**: its hat lane is the one at +14, so dropping the hats moves the
line LATER, +30 → +36. It also gives back exactly what §69 bought — CyborgNinja's lock 3.4 → 17.1 s — and takes
Vienna's p90 from 67 ms to 320+. Candidate (b), a per-class lag compensation at the clock's input, has nothing to
compensate: the per-class spread on the four anchored tracks is **±3 ms** (kick −0.5…+3.0, snare −1.4…+6.4, hat
−4.3…+4.9), and on Malicious the three classes are late TOGETHER, which a per-class constant cannot touch. The only
thing that removes a common-mode +30 on one track is a global constant — and the other four sit at +1 / +1 / +6 / +4.

### The rule

**A truth grid whose beat PHASE was never placed on the audio cannot grade a clock's phase.** `gridcheck.py` now prints
that, per track, from the truth file itself — no `bpm_grid.anchor`, no `bpm_grid.hand`, and `dp_residual_ms > 60` ⇒ a
caveat above the table saying the lag MEDIAN is the grid's offset plus the clock's error and the "jitter (bias removed)"
row is the gradeable one. It fires on Malicious and on none of the other four. **Printed, not applied: no number in the
table moves** (verified: the five tables above are byte-identical with and without it).

`CLOCK.KICK_LAG` (0.004 s, §56's median of the four kick placements) is **left alone**, and so is the absence of a
snare / hat term: both would be fitted to a 23 ms annotation offset.

### Proofs

- **`node tools/check.js` 0 fail** (157 modules, 202 uniforms, 205 MS keys, help.feats gaps 0, the 5 pre-existing soft-cap
  warns) · **`npm test` OK** — `test_clock.js` is **14 checks** now (12 at HEAD), the two new ones being **`backbeat`**: kicks on every
  beat and snares **40 ms late on 2 and 4** (loud 1.3, no low band, cls 1 — a laid-back backbeat, the shape §69's row was
  blamed on). Every snare is a phase measurement at `R_CLS[1]` 1.5, so an averaging filter would settle ~10 ms late; the
  clock reads **med +3.20 ms, p90 4.17 ms** against the kicks after 20 s, 127.90 BPM, `jumps 0` — the gate is `BACK_MS`
  **5 ms**. This is the characterisation the diagnosis needs: the clock does NOT follow a late backbeat, so the +30 on
  Malicious cannot be one.
- **The engine is byte-identical to `9b164e2`** (v0.24, the tree every number here was taken on; a parallel worker has since
  landed `074061b` §70 step 1 on `assets/engine/ears/`) — `git diff` touches `tools/test_clock.js` and `tools/truth/gridcheck.py`
  and nothing else, so the fake-timeline md5 sweep, the bar store / queue tables (§55/§56) and node `Clock.push`
  µs/hop are HEAD's by construction. The sweep was taken anyway as the receipt (an isolated `git worktree` of HEAD +
  the two tool files, `PORT=8908 tools/scene-md5.sh s71`, 12 scene ids × f360/f840, `errs []` on every one): the three
  lines §56/§59 pinned read exactly as recorded — **s0-f360 `fb74fee4`, s0-f840 `8a0715df`, s4-f840 `05bf21c0`** — so
  the clock stage is still inert under `#test` (it returns at its first line under `ENGINE.fakeOn`). The full list is
  `tools/work/s71-md5.txt`; it differs from `tools/accept/v0.14/scene-md5-v014.txt` on s1 / s2 / s4-f840 / s5 / s6 /
  s0-f840, which is seven releases of scene work (DUST §57–§60/§65, the colour and loudness passes) and not this
  session — a parallel worker was in `assets/engine/ears/` and the snare-reading scenes while this ran.
- **No audible run.** Every number here is the deterministic node path or one det `filetrace.js` page run.
- Scratch: `/tmp/rr/{head,pre69}` worktrees, `tools/work/clock/{h,p}-<Track>.json` inside them, the three `R_CLS`
  sweeps, `indep.py` / `scan.py` / `perclass.py` (the zero-phase rulers, scratch — the reproducible path is in the
  AUDIT addendum).

### Open

- **Malicious's truth grid is the real open item.** Its beat phase needs a hand check or a new anchor, and until then
  its beat-phase rows are not evidence. The measured offset is **+23 ms** (the `mid` list's near-delta; the 150–800 Hz
  scan says +41 at the argmax of a ±21 ms window). Cheapest honest fix: hand-mark 8–16 beats and re-phase, as live
  step 3.1 did for CyborgNinja. **Do not fit the engine to it in the meantime.**
- `trackmap.py`'s `dp_beats()` / `refit_grid()` work in FRAME INDEX units and convert with `index / fps`, while the
  onset lists use `t2[pk]` — real times that include the STFT's `t0 = 1024/sr = 23.2 ms`. On a track with sharp
  attacks the omission cancels against the flux's own half-window delay (SeeYouDrop's grid lands +2.9 ms off its
  kicks), which is why four of five grids are fine; on a smeared track it does not. Worth a look when the grid is
  re-made, but it is a RULER change with every table downstream of it: not taken here.
- **SeeYouDrop's PCM lock 9.2 → 12.0 s** (§69's other losing row) is untouched and still open.
- The +11 ms page/node gap on Malicious's clock (§59 recorded it; neither reading is the one in doubt).

**v0.25 tagged locally (2026-10-01) on the user's word ("I looked at torus2 and dust both look better -> tag what we have"; deploy
still held):** v0.24 + §70 (`kickAmp` / `snareAmp`; DUST's ring and TORUS2's waves on the lane alone) + §71 (Malicious's bias is
its truth grid). `releases/retinarave-v0.25.html` (from `file://` on scene 3: errs [], nonFinite [], clock pcm), package.json
0.25.0. Not pushed (retinarave.com serves v0.15). Next on the user's word: 1. Malicious's truth grid, 2. the `Quantile` sign
session, 3. `kickAmp` → CHLADNI.

## §73 the `Quantile` sign — a p95 that was a p5, a p90 that was a p10, and the four readers that had been calibrated against the wrong number (2026-10-01, one worker; §70's open item 1, the user's word: priority 2, "the `Quantile` sign engine session"; `docs/AUDIT-drums.md` "§73")

### The bug, in one line

`assets/engine/ears/dsp.js`'s `Quantile(q)` had its two Robbins-Monro weights swapped and settled on the
**(1 − q)** quantile.

```js
this.v += x > this.v ? s * (1 - this.q) : -s * this.q;      // v0.25 and back to §44
this.v += x > this.v ? s * this.q : -s * (1 - this.q);      // §73
```

Write `p = P(x > v)`. At equilibrium the up-pushes and the down-pushes balance, so the two weights fix `p` and
nothing else does: `p·w_up = (1 − p)·w_down`. The old pair balances at `p·(1 − q) = (1 − p)·q`, i.e. **p = q** —
`q` of the stream lies ABOVE `v`, which is the (1 − q) quantile. The fixed pair balances at `p = 1 − q`: `q` of
the stream lies BELOW `v`, the q-th quantile, the thing the class is named for.

**The receipt is `tools/test_dsp.js`** (in `npm test`, first in the list), 200 000 draws per distribution,
`abs` mode, step 0.02, the estimate read as the mean of `v` over the last 40 000 pushes because a Robbins-Monro
tracker never stops dithering:

| distribution | q | true | BEFORE | AFTER |
|---|---|---|---|---|
| U(0,10) | 0.10 | 0.998 | 8.986 | 0.999 |
| U(0,10) | 0.50 | 5.001 | 5.008 | 5.008 |
| U(0,10) | 0.90 | 8.994 | 0.999 | 8.986 |
| U(0,10) | 0.95 | 9.495 | **0.508** | 9.487 |
| two-level (80 % at 1.0, 20 % at 9.0) | 0.50 | 1.025 | 1.026 | 1.026 |
| two-level | 0.90 | 8.999 | **0.925** | 9.000 |
| two-level | 0.95 | 9.049 | **0.912** | 9.051 |

The two-level row is the engine's own case: a band that is quiet most of the time with loud hits in it. Nine of
the file's assertions failed before and all pass after — the sign guard (`v` must RISE with `q`; before it read
8.99 < 5.01 < 1.00 < 0.51), convergence within 2 % of the range at all four `q`, a 20 dB step change reached in
1960 pushes (before: never), `rel`-mode scale invariance, determinism, the 16-push warm-up. A monotone ramp's rows
are printed and NOT asserted: a causal tracker has no stationary quantile on a non-stationary stream, and a low-q
floor follower on a rising stream is dragged to the top by its up-pushes alone.

**The weights also set the two SPEEDS, and that is the half of the fix that forced three of the four
re-calibrations.** For `q` near 1 the FAST leg is `step·q` and the slow one `step·(1 − q)`: a peak follower that
leaps onto a new loud level and leaks away from it slowly. Under the old weights the same `q` was a FLOOR
follower — fast down, slow up — so the magnitude of the fast leg is unchanged by the fix (0.045 dB/hop for `lvl`
either way; "~3 s at the 86 Hz hop" still holds) but the DIRECTION it applies to flips. A consumer whose stated
time constant describes the *slow* leg therefore needs ten times the step to keep it, for `q = 0.9`. Every comment
in these files already wanted the peak follower: *"a 4 s follower collapsed inside the 8 s void and the gate then
opened on its rumble"* is a floor follower's failure, and a peak follower cannot have it.

### The consumer table — meant / got / decided

The method: `tools/work/v73/rec.js` runs the real `Ears` over each of the five tracks on the page's det time base
(`tools/node-stream.js`, the path `drums-node.js` takes) and records **the stream each estimator is pushed with**;
`tools/work/v73/sweep.js` then replays both signs and sweeps that consumer's own constant in milliseconds. Only
`fires` depends on the sign at all (through the level gate); `sms` / `ssh` / `roll` / `bdb` are raw band powers and
are the same stream either way. **Every base number below is from a `git worktree` at `35242cf`** and every after
number from a second worktree at the same commit with the patch applied, because a parallel worker is re-phasing
Malicious's truth grid — no row in this section can move under the measurement.

| consumer | what it MEANT | what it GOT | decided |
|---|---|---|---|
| **`perc.js lvl`** — `Quantile(0.9, 0.05, 'abs')` x 7 bands; the `GATE_DB` level gate, "ignore flux while a band sits this far under its own running p90" | the band's dB envelope p90, a LOUD reference | the **p10** — its p50 landed within 0.1–8.0 dB of the track's true p10 on every band | **keep q = 0.9, keep step 0.05, re-fit `GATE_DB` −34 → −54.** The step needs nothing (the fast leg's magnitude is unchanged); the offset does, because the reference moved up by the band's own p10→p90 spread, 10–30 dB on this material |
| **`perc.js p95`** — `Quantile(0.95, STEP, 'abs')` x 3; `*Vel = clamp01(fire / p95.push(fire))` | the p95 of the lane's own fire magnitudes, so `*Vel` = 1 means the top 5 % of hits | the **p5** — 3.86–4.41 dB on the snare lane against a true-hit p95 of 7.7–23.1, so 52–91 % of hits read exactly 1.000 (§51's "the velocity saturates", diagnosed in §70) | **keep q = 0.95, re-fit step 0.02 → 0.2.** This is the one consumer whose bug was the point, and the one constant fitted to an outcome rather than derived |
| **`sub.js q90`** — `Quantile(0.9, P90_STEP)`; `rel = ms / q90`, the gate hysteresis `GATE_ON` / `GATE_OFF`, and the `vel` of every `subIn` / `subOut` / `subNote` event | the p90 of the gate band's RMS, so `0.16` means "16 % of the sub's own loud level" | **0.04 / 0.24 / 0.07 / 0.04 / 0.33x** the trailing-32 s p90 on the five tracks — not a p90 at all, and `rel`'s p50 of 1.23–15.99 made `clamp01(rel)` 1.000 almost always, so the sub's note velocity was saturated exactly the way `*Vel` was | **keep q = 0.9, `P90_STEP` 2.5e-4 → 2.5e-3 (derived), `GATE_ON` / `GATE_OFF` 0.16 / 0.075 → 0.020 / 0.0094 (fitted to the gate's own five-track timeline)** |
| **`texture.js rollP90`** — `Quantile(0.9, 4e-4)`; `lpSweep = clamp01(1 − roll / p90)` | the p90 of `roll` over ~30 s | the **p10**, so `roll / p10` was above 1 nearly always and the field clamped to 0: `lpSweep` read a p50 of **exactly 0.000 on all five tracks** and was non-zero on 0.3–35 % of hops. A DEAD CHANNEL | **keep q = 0.9, step 4e-4 → 4e-3 (derived).** Nothing to preserve — the field had no validated behaviour, it had no behaviour |

**The two derived steps.** For `q = 0.9` the slow leg is `step/10`, and after the fix the slow leg is the one the
stated time constant belongs to, so the step must be ten times bigger. Measured against the offline trailing-window
p90 of the same stream, as a median ratio per track:

```
sub.q90 vs the trailing-32 s p90   v0.25  0.04 / 0.24 / 0.07 / 0.04 / 0.33x
                                   sign only  0.28 / 0.87 / 0.67 / 0.35 / 0.95x
                                   + 2.5e-3   0.93 / 1.00 / 0.97 / 0.96 / 1.00x
tex.rollP90: mean |lpSweep - the offline 1 - roll/p90(30 s)|
                                   v0.25  0.30 / 0.47 / 0.63 / 0.30 / 0.42
                                   sign only  0.074 / 0.199 / 0.382 / 0.265 / 0.420   (Vienna still dead)
                                   + 4e-3     0.070 / 0.058 / 0.086 / 0.067 / 0.112
```
(order: SeeYouDrop / CyborgNinja / WhoLikesToParty / Malicious / Vienna.) `lpSweep`'s own p50 goes
**0.000 → 0.407 / 0.547 / 0.732 / 0.413 / 0.347** — the outro's closing filter is a channel again.

**`p95`'s step is fitted, and why it had to be.** `p95[c]` is pushed only AT A FIRE, so its stream is a few hundred
values a track. Under the old sign the fast leg was downward and the trip short — from the 16-fire warm-up mean
down ~2 dB to the p5 — so 0.02 settled in ~100 fires. With the sign right the trip is UPWARD to the p95, 5–30 dB,
which 0.019 dB/fire cannot finish inside a track: at step 0.02 the low lane's estimator still read
**7.9 / 15.6 / 25.3 / 8.2 / 6.8 dB** against a true fire-stream p95 of **16.5 / 23.2 / 36.5 / 9.1 / 10.2**, and
32 % of pooled true hits still saturated. Swept 0.02 / 0.05 / 0.1 / **0.2** / 0.4 / 0.8 — the ceiling share over
the five tracks' true hits reads 32 % → 24 → 18 → **14** → 10 → 8 (kick), and past 0.2 the estimator over-tracks
the top so the LOUDEST hits stop reaching 1.000 at all (`vel` p90 0.88–0.99 on three tracks at 0.4). 0.2 is the end
of the plateau where a `*Vel` of 1 still means the top of the lane; at 0.2 the estimator's own p50 sits within
9–19 % of the true fire-stream p95 on every lane and track.

**`GATE_DB` and the sub pair are fitted to BEHAVIOUR, not scaled.** They have to be: the old reference's error is
10–30 dB per band for `lvl` and 3–25x per track for `q90`, so no single scale factor is right for all five tracks.

### The five tracks, before → after

**The drum table** — 5 tracks x {`ears`, `v2`} x {kick, snare, hat} x their references (`low` / `click` / `kick`,
`mid` / `snare`, `high`), 60 rows, `tools/drums-node.js` + `tools/truth/drumcheck.py`:

| `GATE_DB` | rows that differ from base | worst change |
|---|---|---|
| −34 (the sign alone) | 22 | SeeYouDrop kick 192 → 188 fires, F 0.40 → 0.38 (`low`), 0.50 → 0.48 (`click`); WhoLikesToParty kick F 0.75 → 0.76 |
| −44 | 8 | WhoLikesToParty v2 kick F 0.78 → 0.77 |
| **−54 (shipped)** | **6** | **1–3 fires; every P / R / F identical to two decimals** |

The 4 kicks −34 cost are in SeeYouDrop's **ducked 51–56 s bar before drop 1** — real hits in a high-passed
build-up, where the 60–150 Hz band genuinely sits 34–44 dB under its own p90. That is the one thing the gate must
not eat, and it is the whole reason the offset moved. −54 restores §68's measured posture exactly: *"swept with and
without and on three bands, identical to every digit, so it costs nothing and still protects a silent band's noise
floor"* — insurance, now read off the loud level the comment has always named. (At −34 SeeYouDrop's intro also lost
the 2.4–4.0 s hats as silence at −51 dB; the hat F was unchanged at 0.72 either way, but `denH` went 7/s → 0/s
through four seconds of "the intro's rising hats", which is a look, not a score.)

**The sub gate** — `tools/work/v73/sweep.js sub`, the gate replayed off the recorded `(ms, share)` stream with the
full hysteresis / dwell / confirm:

| track | gate OPEN base → final | `subIn` base → final | frame agreement with v0.25 |
|---|---|---|---|
| SeeYouDrop | 83.2 % → 81.5 % | 29 → 29 | 98.1 % |
| CyborgNinja | 98.6 % → 99.7 % | 41 → 7 | 98.9 % |
| WhoLikesToParty | 81.0 % → 77.6 % | 533 → 506 | 93.0 % |
| Malicious | 49.6 % → 49.7 % | 127 → 127 | 100.0 % |
| Vienna | 80.4 % → 80.8 % | 55 → 38 | 99.5 % |

The two `subIn` counts that FALL are CyborgNinja's and Vienna's, where the old gate chattered at the edge of a gate
that is open 99 % and 80 % of the track. At the un-refitted 0.16 / 0.075 the new gate chatters instead:
`subIn` 29 / **283** / 591 / 136 / 133 and the open share drops as far as 65.3 % — the pathology the author already
fought once ("made the gate chatter 5.4 times a bar through the ducked drop 2 and halved the slide count"), which
is why the pair moved.

**§64's build table** — `tools/build-node.js` + `tools/truth/dropcheck.py --summary`, pooled over the 8 truth drops
(SeeYouDrop x2 · WhoLikesToParty x3 · Malicious x1 · Vienna x2):

```
base   `buildLive>=0.4`  15.9 7.9 11.0 7.0 11.0 0.0 4.4 0.0   6/8  false 0.14/min  chance 0.00  armed 4.1 %
final  `buildLive>=0.4`  15.9 7.9 11.0 7.0 11.0 0.0 4.4 0.0   6/8  false 0.14/min  chance 0.00  armed 4.1 %
base   `dropLiveEvt:evt`  -6 +21 +10 +48 +12  —  -3  —         6/8
final  `dropLiveEvt:evt`  -6 +21 +10 +48 +12  —  -3  —         6/8
```
**Identical** — Vienna drop 1 still fires (4.4 beats armed, the event +12 ms) and CyborgNinja, the false-alarm
control, still reads 0.14 false arms/min. All 18 of `dropcheck.py`'s default rules are identical too, including
`hush`, `tension`, `roll`, `swell`, `hp` and synapse's own anatomy.

**§59's clock table** — `tools/truth/gridcheck.py --heard`. **Every v3 row is identical on all five tracks**
(`bpm`, `beatPhase`, its jitter, its lock, the bar line, `dropEvt`). The PCM clock moves slightly and net upward:

| track | beat-event F ±50 ms | `beatPhasePcm` \|lag\| p50 |
|---|---|---|
| SeeYouDrop | 0.903 → **0.915** | 40 → 39 ms |
| CyborgNinja | 0.966 → 0.966 | 42 → 43 ms |
| WhoLikesToParty | 0.973 → 0.973 | 37 → 38 ms |
| Malicious | 0.987 → 0.986 | 14 → 12 ms (med −13 → −9) |
| Vienna | 0.865 → 0.862 | 39 → 40 ms |

`clockConfPcm` on/off the beat moves by at most 0.03. **The queue** (`queuecheck.py`): every F identical to two
decimals except SeeYouDrop `nextHatIn` 0.56 → 0.55. **The bar store** (`predcheck.py`): every F within 0.002 on all
five tracks. **The OFFLINE map** (`tools/work/v73/mapsum.js` — bpm, phase, bar, `drops`, `dropWhy`, sections, every
onset list's length, beats, downbeats, novelty): **byte-identical** on all five tracks, and so is the map's own sub
gate (`map.js` builds a `SubTrack` too, so this was the one place the sub re-fit could have moved the FILE+map path).
`kickAmp` / `snareAmp` / `subPure` / `bassReg` / `width` / `tension` / v3's `bpm` / `beatCount`: unmoved.

### `*Vel` after the fix, and the `*Vel` vs `*Amp` verdict

Pooled over the five tracks' TRUE hits (every lane fire matched to `tools/truth/<T>.{kick,snare}.json` at ±50 ms;
the hat has no truth list of its own so its row is every fire):

| field | share at exactly 1.000, per track, v0.25 | pooled =1.000 after | pooled p10 / p50 / p90 after |
|---|---|---|---|
| `kickVel` | 87 / 46 / 50 / 83 / 83 % | **14 %** | 0.301 / 0.627 / 1.000 |
| `snareVel` | 91 / 53 / 59 / 72 / 47 % | **13 %** | 0.285 / 0.585 / 1.000 |
| `hatVel` | 92 / 61 / 43 / 81 / 89 % | **12 %** | 0.237 / 0.511 / 1.000 |
| `kickAmp` (§70, unchanged) | — | 26 % | 0.34 / 0.55 / 1.00 |
| `snareAmp` (§70, unchanged) | — | 17 % | 0.34 / 0.54 / 1.00 |

So **`*Vel` is now as good a SPREAD as `*Amp`** — the brief's target was ≤ 25 % at the ceiling and the three
velocities read 12–14 %, below `*Amp`'s own 17–26 % — and §51's observation finally has its true cause on record.

**The verdict is still `*Amp` for a SIZE, and the per-track rows are why.** `*Vel`'s divisor is a running quantile
of THIS TRACK's fire magnitudes, so its per-track p95 reads **1.000 on every one of the five tracks** — it
renormalises, which is the right answer for "how hard, for this track" and the wrong one for "how big". `*Amp`'s
per-track p95, measured at the fire frames of the shipped engine, reads **1.00 / 1.00 / 1.00 / 0.62 / 0.59** (kick)
and **0.96 / 1.00 / 1.00 / 0.63 / 0.73** (snare): Malicious and Vienna never reach 1 because they are genuinely
quieter tracks, and one absolute dB mapping says so (§70 recorded 0.99 / 1.00 / 1.00 / 0.65 / 0.75 for the snare,
reproduced here to two digits). The same 12 dB snare reads **1.00 on Malicious**
(fire-stream p95 7.5 dB) and **0.55 on WhoLikesToParty** (21.8 dB). **Both stay published**: `*Vel` is the honest
per-track RANK the reactive drums' own `kick2` strength was hand-built to be in §51, `*Amp` is the absolute SIZE a
scene reads. **No scene changed in this session**, and at the shipped constants the scenes' own
inputs barely did. Field by field, base vs final over every frame of all five tracks: `snareAmp` **bit-identical on
all five**, `kickAmp` identical on four and different on 0.1 % of WhoLikesToParty's frames (mean 0.0006);
`snareEvt` identical on all five, `kickEvt` on four, `hatEvt` on three and 0.0-0.1 % on the other two; `bassReg`
and `subPure` identical everywhere. So **DUST's flash ring and TORUS2's snare wave cannot have moved at all** —
`snareEvt` + `snareAmp` is the whole of their input since §70. `*Vel` differs on 74-92 % of frames, which is the
session. The two fields a scene DOES read that moved are `subGate` (0.0 / 1.1 / **7.2** / 0.0 / 0.5 % of frames)
and `subNoteEvt` (0.4 / 0.8 / **3.8** / 0.0 / 0.3 %) — DUST's core hold, its core swell and the RIBBON
formation's `!subGate && denK < K.lone` test read them, which is why WhoLikesToParty is the track to look at.

### The proofs

- `node tools/check.js` **0 fail** · `npm test` clean with `tools/test_dsp.js` first in the list
- **The fake-timeline md5 sweep**, `PORT=8912 tools/scene-md5.sh q73` in an isolated `git worktree`: checked first
  that nothing on the `#test` path can reach a `Quantile` at all — `sources/fake.js`, `features.js` and `shim.js`
  import nothing from `engine/ears/`, and `engine/clock/clock.js` (which DOES run in every mode) imports only
  `FFT` from `dsp.js`. So the expectation was **0 of the 24 lines move**, and that is what the sweep says.
- **Page = node** (`tools/filetrace.js <T> 0 <dur> … '&map=0&lead=0'`, `CLOCK=1`, then `build-node.js --cmp`), on
  the fields §73 touches: `kickEvt` / `hatEvt` / `subGate` / `beatCountPcm` identical on all 9450 frames of
  SeeYouDrop, `snareEvt` on 9449, `kickVel` within 4.8e-4, `beatPhasePcm` within 2.1e-4, `denK` / `denH` within
  5e-5, `lpSweep` within 3.9e-3. `buildLive` / `dropLiveIn` / `nextKickIn` / `predKickIn` disagree more, for the
  reason HARNESS already records and not for a §73 reason: the node run takes its low onsets at the default
  `--disp 40` and the page ran `&lead=0`, and the v3 queue path differs page/node in its first seconds (B.1).
  CyborgNinja's page trace agrees with node on only 94 % of `kickEvt` frames and 3 of 10800 `beatPhasePcm` ones —
  and it agrees with the **BASE** node trace EXACTLY as badly (`kickEvt` 10102/10800, `hatEvt` 9235/10800,
  `beatCountPcm` 109/10800 against both), while base-node vs final-node is **10800/10800 identical** on `kickEvt`
  and `hatEvt`. So that gap is the harness's own on this track — its page frame grid lands one frame off node's
  (10801 against 10800) and §59 already recorded CyborgNinja's PCM clock flipping between its two kick lattices —
  and §73 cannot have caused it: the comparison is unchanged by the patch, which is the stronger statement.
  **WhoLikesToParty, Malicious and Vienna were NOT page-traced.** The loop reached WhoLikesToParty and died:
  something outside this session removed the measurement worktrees under `/tmp` and SIGKILLed the dev server on
  8912 mid-run (exit 137), so the last two never started. They were redundancy rather than evidence — SeeYouDrop is
  the clean row and CyborgNinja is the stronger one, since a gap identical against base AND final cannot have been
  opened by the patch — but a reader should not infer from this section that five tracks were walked. Re-running
  them is a fresh worktree at this commit plus three `filetrace.js` calls.
- Cost: flat — the fix changes two multiplications in one branch and nothing else; `test_loud`'s own budget row
  reads 5.79 µs/frame against its 40 µs cap.
- No audible run. Every number here is the deterministic file path, the node harness or the fake timeline.
- The lab scripts are `tools/work/v73/{rec,sweep,mapsum}.js`, gitignored like §68's, §69's and §70's.

### Open, for the orchestrator

- **CHLADNI reads `kickVel` and `snareVel`** (`U.snF = 0.55 · clamp(snareVel) · exp(-snareAge/0.16)`). It flashed
  at full brightness on 52–91 % of hits and now flashes at a graded one on 86–88 % — the ring is no longer a binary.
  §70 left a `snareAmp` move pending the user's A/B and priority 3 is `kickAmp` → CHLADNI; that worker now has a
  THIRD option (keep `*Vel`, which finally means something) and a re-tune of `SNAMP` either way.
- **`lpSweep` is live for the first time** and CHLADNI's `fog` is its only reader. On a real track the plate now
  takes fog through the outro (p50 0.35–0.73) where it never did. Nothing was tuned against it, because nothing
  could be; it wants the user's eye.
- **The reactive drums' `kick2` RANK vs `kickAmp` vs the now-honest `kickVel`** is still the measurable question
  §70 left open, and is still not measured.
- `tools/accept.sh` has not been run since v0.14, and SeeYouDrop's PCM lock 9.2 → 12.0 s is still open (both
  carried from §69).
- Malicious's row above is from the v0.25 truth grid, by construction (both worktrees at `35242cf`). When the
  parallel re-phase lands, its drum / clock rows move with the RULER and this section's base and final move
  together — the DELTAS stand, the absolute numbers do not.

## §72 Malicious's truth grid is RE-PHASED by +23.22 ms — the bias was `dp_beats`'s frame-index conversion, not the track (2026-10-01, one worker; §71's open items 1 and 2, the user's word "ensure Malicious truth grid is accurate"; `docs/AUDIT-live-grid.md` "Step 6 addendum 5")

**The ask:** §71 proved Malicious's +30 ms clock bias IS its truth grid and left two open items — hand-mark the beats
and re-phase (item 1), and look at `trackmap.py`'s `index / fps` frame conversion (item 2). They are the same item.

**It was the ruler, and it bit exactly one grid.** `tools/truth/trackmap.py` and `gridcheck.py` changed; `tools/truth/Malicious.*`
and three of its ten grain tables were regenerated. `assets/` is untouched. Not tagged, not pushed, not deployed.

### Step 0: the +23 ms IS `t0`, and it reached one grid of five

`dp_beats()` returns FRAME-INDEX times (`index / fps`). The short STFT's frame i is really centred at
`t2[i] = t0 + i / fps`, `t0 = 1024 / 44100 = 23.2200 ms` (nperseg 2048, `boundary=None`, `padded=False`). The
`dpres > 0.06` branch wrote those straight out as `beats`, so such a grid sits `t0` BEFORE the audio. Three facts
nail it:

1. **Malicious's `beats` are exact multiples of the hop.** Residual against `512 / 44100` = **0.0025 of a hop**
   (0.03 ms, the json's own 4-decimal rounding); against `512 / 48000` it is 0.287. The other four are sub-hop
   (0.288–0.289) — they are refit / anchored / hand grids. One grid of five is on the DP branch.
2. **Its own `mid` onset list (REAL times, `t2[pk]`) sits +23.3 ms after its own beats, p25 +23.0 / p75 +23.6** — a
   near-delta 0.1 ms from `t0`, because both sides are the same STFT frames and the only difference is the missing `t0`.
3. **A global conversion fix is WRONG.** Adding `t0` to all five grids and re-measuring each against its own attacks
   (zero-phase, five bands, no engine, no truth list): the band-median profile moves to −23.7 / −23.0 / −16.7 / −24.5 ms
   on SeeYouDrop / CyborgNinja / WhoLikesToParty / Vienna, i.e. every validated grid lands 17–25 ms off its own music,
   while Malicious moves to −5.9. `refit_grid`'s phase is in the same frame-index units and is DELIBERATELY left there:
   its own lag against the attacks cancels `t0` (SeeYouDrop's refit grid sits +2.9 ms from its kick list as it is, and
   the hand-pass PNGs show its line landing on the waveform's attack while `+t0` lands 23 ms inside the hit). The fix
   is therefore in the `dpres > 0.06` branch alone: `beats = bdp + t2[0]`. `dpres` itself is a frame-coordinate
   comparison on both sides and does not move, so no branch decision changes on any track.

### The three rulers, and they agree

| ruler | number | how |
|---|---|---|
| the tool's own onset lists | **+23.3 ms** (p25 +23.0 / p75 +23.6) | `mid` / `click` / `high` against its own beats; the other four read within ±7 |
| zero-phase band profile | **+21.0 ms** (flat 20–24, rms 4.0 ms) | `filtfilt` band → `filtfilt` envelope → the 20 % crossing, 1 ms step, 25 Hz–12 kHz, scanned for the shift that makes this track's per-band profile match the four controls' mean (+17.2 / +8.2 / +0.4 / −3.1 / −2.1 ms) |
| the ears' lanes | **+18.1 ms** | `drums-node.js` at HEAD in an isolated worktree: all-lane mean +20.1 ms here against +1.9 / +3.4 / +0.3 / +2.2 on the four controls. The coarsest (60 Hz frames + the lanes' own detection lag) |
| **the hand pass** | **+21.0 / +20.7 / +26.4 ms** | 16 beats marked one by one at SAMPLE resolution in the native 44.1 kHz dump, 5–12 kHz (the one lane with a clean on-beat transient here): the 20 % crossing (+18.5, sd 3.6), the envelope peak (+36.6, sd 6.5), the first sample the 100 Hz-highpassed \|x\| leaves its pre-attack floor (+28.6, sd **1.6**) — each MINUS the same estimator on the four validated grids, 16 marks each |

Four numbers, 18.1 … 23.3, spread 5.2 ms, around `t0` = 23.22. **`t0` exactly is what was applied** — the cause is
identified, not fitted. The 40–150 Hz lane is not usable as a hand ruler on this track (808 kicks with a slow rise over
the previous note's tail: sd 19 ms); the montages are `tools/work/v72/hand3-*.png`, and the Malicious one shows every
one of 16 beats with the shipped line in flat floor and the attack starting at the `+t0` line.

### The DP beat list is KEPT, measured against the alternative

The track is dead constant: its onset lattice is coherent over all 222 s (resultant **0.552** `click` / **0.590** `mid`
at P = 0.42850–0.42856 s = **140.00–140.02 BPM**), which a moving tempo could not give over 520 beats. So §71's
`bpm_grid.bpm` 139.675 is wrong — it is the median of hop-quantised DP gaps (0.429569 s; the least-squares line through
the DP beats reads 140.033 BPM and they sit 15.9 ms rms / 59 ms max off it). **But a linear grid grades WORSE against
the track's own attacks than the DP beats do**, each at its own best phase — mean \|offset\| p50 over the five bands:

| grid | 25–60 | 40–150 | 150–800 | 0.8–2.5 k | 5–12 k | mean \|off\| p50 |
|---|---|---|---|---|---|---|
| **DP + t0 (ships)** | 33.7 | 28.6 | 19.5 | 17.8 | **10.2** | **22.0 ms** |
| linear 140.000 BPM | 37.3 | 30.2 | 25.2 | 24.1 | 3.0 (p90 **43**) | 24.0 |
| linear LS 140.033 | 37.0 | 24.9 | 20.8 | 22.2 | 15.6 | 24.1 |
| linear lattice 140.023 | 36.0 | 24.6 | 20.6 | 21.9 | 17.3 | 24.1 |

The hats lock to a 140.000 line at p50 3.0 ms but with p90 43 — the groove is on that lattice in places and off it
elsewhere, which one straight line cannot follow and the DP beats can. **So: the phase moved, the beat list did not.**
Every one of the 520 beats moved by the same +23.2 ms (`bpm_grid.phase` 0.04644 → 0.06966); the period, the shape, the
`downbeat_mod4` = 2 and the bar line are untouched. `bpm_grid.bpm` still reads 139.6748 — inside `gridcheck.py`'s ±1 BPM
tolerance, so no table moves, but **140.00 is this track's tempo** and `bpm_grid.hand.tempo_note` says so.

### What the fix bought, measured

| Malicious, whole track | before | after |
|---|---|---|
| PCM clock, node, `--heard` | **+30 ms**, \|lag\| p50 30 / p90 49, **50 %** within ±30, jitter p50 7 / p90 24, lock 6.1 s | **+7 ms**, p50 9 / p90 28, **92 %**, jitter p50 7 / p90 23, lock 6.1 s |
| v3 clock, node | +23 ms, p50 23 / p90 82, 72 % | **−1 ms**, p50 8 / p90 59, 82 % |
| PCM clock, PAGE (`&map=0&lead=0`, `--heard`) | **+19 ms**, p50 19 / p90 38, **81 %**, beat events F **0.916** | **−4 ms**, p50 9 / p90 25, **94 %**, F **0.980** |
| `gridcheck.py`'s un-anchored-grid caveat | fires | silent |

**§71 predicted +7 node and −4 page. Both land exactly.** The four other tracks' rows are byte-identical to §71's HEAD
column — their truth files did not change (verified by md5) and were re-measured anyway: SeeYouDrop +3 ms / 97 % /
lock 12.0 s · CyborgNinja +1 / 97 % / 3.4 s · WhoLikesToParty +6 / 99 % / 5.6 s · Vienna +4 / 74 % / p90 67 ms.

The §68/§69 drum references are built ON the grid's 16th lines, so they moved with it and the lanes graded against them
rose (`drumcheck.py`, node, ±30 ms; `vs low` / `click` / `mid` / `high` are real-time onset lists and did not move at all):

| Malicious | `kick vs kick` (§68, n 644 → 654) | `snare vs snare` (§69, n 639 → 633) |
|---|---|---|
| ears | P 0.40 → **0.50**, R 0.10 → 0.13, F 0.16 → **0.20**, lag +9 → **+3** | P 0.50 → 0.52, R 0.42 → 0.45, F 0.46 → **0.48**, lag +14 → **+3** |
| v2 | P 0.41 → 0.43, R 0.37 → 0.38, F 0.39 → 0.40, lag +5 → **+2** | P 0.26 → **0.69**, R 0.04 → 0.12, F 0.08 → **0.20**, lag +26 → **+7** |
| syn | P 0.16 → 0.15, R 0.26 → 0.24, F 0.20 → 0.19, lag −4 → **−1** | P 0.54 → **0.68**, R 0.09 → 0.11, F 0.15 → **0.19**, lag +13 → **−10** |

### A hand annotation now survives a re-run

`--pcm` once destroyed a worker's uncommitted Vienna truth (§63 phase 1). `analyse()` now carries `bpm_grid.hand` and the
top-level hand keys (`sections_hand`, `drops_hand`, `drops_user*`, `drops_tool`, `drops_note`, `provisional`, `notes`,
`feel`) over from the file on disk — never computed, only preserved. Verified: SeeYouDrop / CyborgNinja /
WhoLikesToParty regenerate **byte-identical** (json + all ten grain tables each) with the whole patch in, and a second
`trackmap.py Malicious` reproduces the new json bit for bit, hand block included.

`Malicious.json`'s `bpm_grid` gains `dp_t0` (the tool's own record: src, `t0_ms`, sr, hop, nperseg) and `hand` (the
human record: what moved, the cause, the four rulers, the 16 marks, the DP-vs-linear comparison, the tempo note, the bar
line, `not_checked`, and what it replaced). `gridcheck.py`'s caveat now takes `anchor | hand`; `dp_t0` ALONE is
deliberately not enough — the conversion would be right but the line would still be the tracker's, and the printed note
says so.

### What moved on disk

`tools/truth/Malicious.json` (phase, the 520 beats, 130 downbeats, 15 sections, the one drop 148.294 → 148.317, novelty,
energy, the three beat-synchronous `slices`, the tonic's confidence 0.159 → 0.138 — G major unchanged; the seven
fixed-time grains, the onset lists, the contour and the sub runs are byte-identical), `Malicious.kick.json`,
`Malicious.snare.json`, `Malicious.loud.json` (its `sections` and drop `pairs`; the contour did not move), and
`tools/truth/Malicious/grain-{beat,bar,4bar}.txt`. The other seven grain tables are byte-identical.

### Proofs

- `node tools/check.js` **0 fail** (157 modules, 202 uniforms, 207 MS keys, help.feats gaps 0, the 5 pre-existing soft-cap
  warns) · **`npm test` OK** (test_clock 14 checks) · `node tools/test_loud.js --truth` **OK on all five**, Malicious's drop
  148.32 agreeing to 0.05 LU on the moved boundary. `tools/test_map.js` / `test_ears.js` cannot run in this environment at
  all (they want `tools/work/<T>.st.f32`, a native-rate stereo dump that has never been made; pre-existing, not in `npm test`).
- **`assets/` is byte-identical to HEAD** — the change is two python tools and the truth data — so no md5 sweep, no bar /
  queue tables, no `Clock.push` µs/hop. Every engine number above was taken in an isolated `git worktree` at `35242cf`
  (`/tmp/rr-v72`) because a parallel worker has `assets/engine/ears/dsp.js` dirty in the main tree.
- **No audible run.** One page Chrome at a time, `PORT=8910` on the worktree; the first page trace was discarded on
  `filetrace`'s own `frame0 is -1` determinism warning and re-taken (`f0 2`).
- Scratch (on disk, `tools/work/` is git-ignored, as §71's `v71/` is): `tools/work/v72/` — `prov.py` (provenance + the tool's own lists), `ruler_a.py` / `shift.py` (the
  zero-phase ruler and the shift scan), `hand2.py` / `hand3.py` (the hand pass, any track / any lane, + the PNGs and the
  mark lists), `laneoff.py` (the ears' lanes), `tempo.py` (the 140.00 BPM lattice), `cand.py` (DP+t0 vs linear),
  `pickrun.py` / `clean.py` (choosing the beats), `writehand.py` (the provenance block). The 16 hand marks themselves
  are NOT only there: they are written into `tools/truth/Malicious.json`'s `bpm_grid.hand.hand_marks`, which the tool now
  preserves across a re-run.
- **A note on this file:** the §72 section below §73 is where a concurrent worker's `git add docs/DECISIONS.md` put it
  (commit `2a8670b`, which swept this section in with its own seven lines). Both sections are intact; the order is not.

## §74 CHLADNI's kick is `kickAmp`, and the throw is an ENERGY — the stale-on-the-event-frame trap, and `lpSweep`'s knee (2026-10-01, one worker; §70's open items 2 and 3 and §73's open items 1 and 2, the user's word: priority 3, "`kickAmp` → CHLADNI")

Three commits: `64a9b19` the `dinfo()` ruler, `c8a8d6a` the kick / snare / fog leans and the file split,
`5a24fb6` this section plus CONTRACTS and OPEN-ITEMS. **Not tagged, not pushed, not deployed.**

### What §73 alone did to CHLADNI — because no scene was measured in that session

§73's own words were *"at the shipped constants the scenes' own inputs barely did"* move. For CHLADNI that is
wrong, and the reason is in this scene's own shaders: **`kickVel` is fed in as a LAUNCH VELOCITY and the leap's
peak height is (v·w)² / 2g, so the field is read SQUARED.** The scene had no ruler at all (no `hooks.dinfo()`),
so nothing had ever counted it.

`tools/dust-trace.js <T> <t0> <t1> <out> 11` (`&map=0`, `CLOCK=1`, `GPU=1`) on the four A/B windows, the v0.25
side in an isolated `git worktree` at `35242cf` with only `assets/scenes/chladni/` carrying the new read-only
`dinfo()` (and nothing else: the s11 md5 pair below is byte-identical across all three trees, so the ruler
cannot have moved the picture). `kH` is the leap's peak at the median grain's `w`, as a multiple of the
validated full throw (0.1430 plate units):

| | v0.25 | HEAD = §73 |
|---|---|---|
| **SeeYouDrop** kick size p50 · at 1.000 | 1.000 · 68 % | **0.629 · 23 %** |
| … throw height p50, x the validated throw | **1.00** | **0.40** |
| … lum lift per kick p50 · settle dip p50 | +24.0 · 0.340 | +15.8 · 0.270 |
| **CyborgNinja** throw height p50 · lumC lift | 0.45 · +58.6 | 0.33 · +49.0 |
| **Vienna** throw height p50 · lumC lift | 0.86 · +92.2 | 0.55 · +72.2 |
| **Malicious** throw height p50 · lumC lift | 1.00 · +75.6 | 0.48 · +62.6 |
| **the plate ring** snF p50 · at the 0.55 ceiling (SYD/CN/VI/MAL) | 0.54 / 0.48 / 0.55 / 0.53 · 40 / 16 / 53 / 30 % | 0.42 / 0.43 / 0.49 / 0.42 · 9 / 11 / 31 / 6 % |
| **`lpSweep`** p50 · frames over 0.5 (same order) | 0.00 / 0.00 / 0.00 / 0.00 · 0 / 0 / 0 / 3 % | **0.35 / 0.45 / 0.19 / 0.33 · 15 / 39 / 24 / 22 %** |
| … and so the fog: lumC p50 | 185.2 / 150.4 / 151.7 / 147.2 | **168.4 / 131.8 / 145.7 / 137.7** |

So §73 **more than halved the median kick's throw** on three of the four tracks and **switched a dead channel
on**: the plate's centre lost 4-12 % of its brightness to a fog that had never existed, permanently, because
the field drives it raw. Both are the honest fields finally arriving; neither is the look anyone tuned.

### The kick: `kickAmp`, and the size is the throw's ENERGY

**`kickVel` is unusable for this read, and not because of its spread.** It is a `CONT` history field and the
ears read one by interpolating the ring AT heard time, while an onset's audio time is ~16 ms BEFORE the hop
that found it (§70). So on the frame the event fires it still holds the **previous** hit's velocity. Measured
on CyborgNinja 20-50 s, 85 kicks: the velocity read on the event frame correlates **0.172** with the velocity
of the hit it is arming; `kickAmp` on the same frame correlates **0.986**, and `kickAmp` changes on event
frames and on **no others** (75 changes, all 75 on an event frame, min 0.3135 = the lane's own threshold).
Up to v0.25 this was invisible because the velocity was pinned at 1.0 on 46-87 % of hits. **§73 made the field
honest and so made the staleness bite.** That kills the third option §73 offered as well as the first.

**And the field must go in as the throw's ENERGY, not its velocity.** `uLeap.y` is multiplied by the age, so
the height is quadratic: a size of 0.55 fed in as `v` shows **0.30** of the full throw. The brief's channel is
*"how high that kick throws the sand"* — a HEIGHT — so `v = sqrt(size)` and the height is linear in the field.
At a size of 1 that is byte-for-byte the validated v0.15 throw, so **the loud hits keep the look they were
tuned at and only the soft ones come down**, which is exactly the shape the ask names. The scatter
(`CH_KICKJ`) is a velocity too and takes the same root. `DROPV` 2.40 was always a velocity and is unchanged.

Both readings were measured, the raw one in a second isolated worktree at `64a9b19` with that one line changed:

| track | | v0.25 | HEAD (§73) | `kickAmp` raw | **§74** |
|---|---|---|---|---|---|
| **SeeYouDrop 20-110 s** | throw height p10 / p50 / p95, x the validated throw | 0.66 / 1.00 / **1.00** | 0.18 / 0.40 / **1.00** | 0.13 / 0.32 / **1.00** | 0.36 / 0.56 / **1.00** |
| | the size armed, p50 · at 1.000 | 1.000 · 68 % | 0.629 · 23 % | 0.563 · 9 % | 0.750 · 9 % |
| | lumC lift per kick p50 · lum lift p50 | +54.9 · +24.0 | +56.5 · +15.8 | +53.5 · +15.0 | **+58.1 · +18.6** |
| | settle DIP per kick p50 | 0.340 | 0.270 | 0.212 | 0.281 |
| **CyborgNinja 20-50 s** | throw height p10 / p50 / p95 | 0.23 / 0.45 / **1.00** | 0.14 / 0.33 / **1.00** | — | 0.39 / 0.56 / **1.00** |
| | lumC lift · lum lift · settle dip | +58.6 · +12.7 · 0.334 | +49.0 · +9.8 · 0.355 | — | **+52.5 · +13.3 · 0.391** |
| **Vienna 24-60 s** (kick p95 amp 0.57) | throw height p10 / p50 / p95 | 0.74 / 0.86 / **1.00** | 0.36 / 0.55 / **1.00** | 0.11 / 0.19 / **0.32** | 0.34 / 0.44 / **0.57** |
| | lumC lift · lum lift · settle dip | +92.2 · +18.5 · 0.462 | +72.2 · +15.2 · 0.390 | **+47.2 · +9.8 · 0.267** | +66.8 · +12.5 · 0.363 |
| **Malicious 20-80 s** (kick p95 amp 0.79) | throw height p10 / p50 / p95 | 0.70 / 1.00 / **1.00** | 0.28 / 0.48 / **1.00** | 0.10 / 0.16 / **0.63** | 0.32 / 0.40 / **0.79** |
| | lumC lift · lum lift · settle dip | +75.6 · +12.3 · 0.445 | +62.6 · +8.9 · 0.354 | +42.0 · +6.2 · 0.272 | +57.7 · +8.7 · 0.363 |

**The raw reading is rejected on Vienna's row and nothing else.** A quiet master's LOUDEST kick would throw
**32 %** of the validated height (Malicious 63 %) and its lumC lift per kick would fall 92 → 47, below §73's
already-reduced 72 — limp, which is precisely what the ask said to check. The energy reading holds Vienna's
loudest at **57 %** and Malicious's at **79 %**, with the lift at 67 and 58 (HEAD: 72 and 63). **A per-track
slow normaliser was therefore not needed and is declined**: §73 already measured where it leads — `kickVel`'s
per-track p95 is 1.000 on all five tracks, so it would put every track's loudest kick at full height and
delete §70's whole point, that a soft track reads soft. A soft track now reads soft in the one channel the
brief gives the kick, and the FLOOR (0.3125, the lane's own threshold over its 16 dB span) means no throw is
invisible: the smallest possible kick still throws 31 % of the validated height.

On the two reference tracks the result is **above v0.25 on the per-kick lift** (SeeYouDrop +54.9 → +58.1 lumC,
CyborgNinja +12.7 → +13.3 lum) with the median hit at 0.56 of the full throw instead of 1.00 — the grading is
there and the loud kicks are not weaker than they were. The one number that does not come back is the plate's
standing brightness (SeeYouDrop lumC p50 185 → 169 with the fog off entirely): less airborne sand at any one
moment is the direct, intended consequence of grading the throw.

### The predicted route carries no size, and does not need one

`chladni.kickAge=predKickAge` (CONTRACTS Appendix A) replaces only the AGE; the SIZE is still armed by the real
`kickEvt`, and `kickAmp` is HELD between events, so **a predicted kick is thrown at the last real kick's size** —
the right answer on a four-on-the-floor, and no code. Proved end to end with the route in the hash
(`&route=chladni.kickAge%3DpredKickAge`, SeeYouDrop 60-80 s): `d_kAge` equals `max(0, predKickAge)` on
**1201 / 1201** frames and the real age on 0, **24 predicted throws in 20 s**, size p10 / p50 / p95
0.566 / 0.694 / 0.812, lumC lift per throw p50 **+65.5**, and the armed size never below **0.560** = `sqrt(KSFLOOR)`.
`KSFLOOR` is what answers "before the first real kick": the lane's own 0.3125, so the first predicted throw of a
track is a threshold-sized throw and not a dead one.

### The snare: `snareAmp`, `SNAMP` unchanged — and the ring was the wrong size all along

§70 held this back as *"a brightness recalibration of a validated default"*. The recalibration is real, and it
is not the reason to move: **the ring's brightest frame is the event frame** (`exp(-snareAge/SNTC)` = 1 there),
which is exactly where `snareVel` is stale. So the flash's size correlated with the hit it belonged to at
**−0.011 / 0.305 / −0.027 / 0.073** on the four tracks in v0.25 — nothing at all on SeeYouDrop and Vienna —
and 0.183-0.453 after §73. With `snareAmp` it is **0.997-1.000**.

| the plate ring | v0.25 | HEAD (§73) | **§74 (`snareAmp`)** |
|---|---|---|---|
| **SeeYouDrop** snF p10/p50/p95 · at the 0.55 ceiling | 0.517 / 0.537 / 0.550 · 40 % | 0.262 / 0.419 / 0.550 · 9 % | 0.181 / 0.265 / **0.510** · 1 % |
| … corr(the flash's peak, its own hit) · lumM lift p50 (349) | **−0.011** · +27.0 | 0.379 · +23.7 | **0.999** · +19.8 |
| **CyborgNinja** snF p10/p50/p95 · at the ceiling | 0.365 / 0.482 / 0.550 · 16 % | 0.268 / 0.426 / 0.550 · 11 % | 0.187 / 0.270 / **0.550** · 6 % |
| … corr · lumM lift p50 (95) | 0.305 · +41.3 | 0.453 · +38.2 | **0.999** · **+39.7** |
| **Vienna** snF p10/p50/p95 · at the ceiling | 0.463 / 0.550 / 0.550 · 53 % | 0.390 / 0.487 / 0.550 · 31 % | 0.224 / 0.325 / **0.412** · 0 % |
| … corr · lumM lift p50 (49) | **−0.027** · +49.3 | 0.183 · +37.6 | **1.000** · +35.3 |
| **Malicious** snF p10/p50/p95 · at the ceiling | 0.470 / 0.532 / 0.550 · 30 % | 0.342 / 0.422 / 0.550 · 6 % | 0.177 / 0.210 / **0.346** · 0 % |
| … corr · lumM lift p50 (145) | 0.073 · +22.8 | 0.331 · +17.4 | **0.997** · +16.7 |

**`SNAMP` stays 0.55** and the arithmetic says why: brightness is LINEAR in the field, so there is no square to
undo, and the loudest hits on the two reference tracks still reach the validated ceiling (snF p95 0.510 and
0.550 — their `snareAmp` p95 on these windows is 0.94 and 1.00). The quiet masters' loudest read 0.41 and 0.35,
which is §70's sentence in this channel. Raising `SNAMP` to keep the MEDIAN at the validated brightness would
need **1.11** and would push the loud hits past 1.0 — against the user's own *"I don't want it to be so bright
that can't see the shapes"*. **The ring is NOT left binary**: it never was one in the eye, it was one brightness
attached to the wrong hit, and the measured cost of fixing it is a 4-27 % smaller median flash in the body
annulus (lumM lift p50 +41.3 → +39.7 CyborgNinja, +27.0 → +19.8 SeeYouDrop).

The HAT keeps the rank: `hatVel` is all there is — §70 established there is no `hatAmp`, the hat being the one
class still on the HPSS-lite flux with no rise in dB to publish. Its ripple is stale on its own event frame for
the same reason, and that is an open item below, not something this session can fix.

### `lpSweep`: live, and a RELATIVE measure — so a knee, and an ease

CHLADNI's `params.fog` is `lpSweep`'s only reader anywhere. Run over the WHOLE of all five tracks with the real
`Ears` on the page's det time base (`tools/work/v74/lpprof.js`):

```
lpSweep p25 / p50 / p75 / p90 / p99      last 20 s p50  vs the rest
SeeYouDrop        0.238 0.407 0.559 0.967 0.999      0.956  vs 0.371     <- a real closing filter
CyborgNinja       0.321 0.547 0.658 0.745 0.853      0.456  vs 0.555     <- LOWER at the end
WhoLikesToParty   0.464 0.732 0.840 0.897 0.956      0.627  vs 0.746     <- LOWER at the end
Malicious         0.226 0.413 0.586 0.736 0.920      0.325  vs 0.423     <- (its last 10 s do read 0.955)
Vienna            0.039 0.348 0.592 0.766 0.962      0.403  vs 0.340
```

The field is `clamp01(1 − roll / roll's own running p90)`, so **a track sits part of the way up it by
construction** and its middle says nothing about a filter. Only SeeYouDrop's outro is the thing the help text
promises, and it reads 0.96 there against 0.37 for the body. Fed raw, the fog greyed the plate 34 % and dimmed
the sand 25 % on CyborgNinja for the whole track.

**The lean is a knee in `params.fog`'s own `from()`** — `smoothstep(FOGLO 0.80, FOGHI 0.97, lpSweep)` — swept
0 / 1 (raw), 0.55 / 0.95, 0.65 / 0.95, 0.72 / 0.96, **0.80 / 0.97**, 0.85 / 0.98, eased, over whole tracks:

| knee | frames with fog over 0.5 (SYD / CN / WLTP / MAL / VI) | SeeYouDrop last 20 s vs the rest |
|---|---|---|
| raw | 27 / 55 / 74 / 30 / 30 % | 0.993 vs 0.288 |
| 0.72 / 0.96 | 18 / 0 / 18 / 2 / 4 % | 0.992 vs 0.000 |
| **0.80 / 0.97** | **17 / 0 / 7 / 1 / 2 %** | **0.964 vs 0.000** |
| 0.85 / 0.98 | 17 / 0 / 2 / 1 / 2 % | 0.883 vs 0.000 |

0.80 / 0.97 is where the body of every track is off and the one real closing filter still reaches 0.96; 0.85
starts eating that outro and 0.72 leaves WhoLikesToParty an 18 % veil. **And the output is EASED at `FOGTC`
0.50 s, which is its own fix:** the raw field steps by 0.13-0.26 at its p99 and by **0.20-0.66 in a single
frame** at its worst on the four A/B windows — a jump under CONTRACTS §1.9, on a channel that greys the whole
plate, and it was there in v0.25 too (max step 0.20 / 0.24 / 0.37 / 0.56) where the field was merely too dead
for it to matter. Eased, the per-frame step's p99 is 0.000-0.020 and its max 0.000-0.028.

| the fog, on the A/B window | v0.25 | HEAD (§73) | **§74** |
|---|---|---|---|
| **SeeYouDrop** fog p50 / p90 · over 0.5 · max step | 0.000 / 0.098 · 0 % · 0.200 | 0.353 / 0.530 · 15 % · 0.456 | 0.000 / 0.000 · 0 % · **0.000** |
| **CyborgNinja** | 0.000 / 0.157 · 0 % · 0.244 | 0.454 / 0.653 · 39 % · 0.404 | 0.000 / 0.000 · 0 % · **0.001** |
| **Vienna** | 0.000 / 0.000 · 0 % · 0.369 | 0.193 / 0.682 · 24 % · 0.661 | 0.000 / 0.024 · 3 % · **0.028** |
| **Malicious** | 0.000 / 0.281 · 3 % · 0.555 | 0.327 / 0.657 · 22 % · 0.625 | 0.000 / 0.001 · 0 % · **0.010** |
| … and the plate: lumC p50 (same four) | 185 / 150 / 152 / 147 | 168 / 132 / 146 / 138 | 169 / **142** / 141 / 138 |

The fog is now a channel that waits for the music it is named after. **Nothing about it is validated** — it had
no behaviour before §73 — so it is on the watch list below.

### The file split, and the ruler

`index.js` was 479 lines before this session and the changes took it to 536, past check.js's **hard 500 cap**
(not the 350 soft one). Two subjects came out, both mechanical: **`cam.js`** — the eye's own geometry
(`FOV` / the two registers' pitch and distance / `CAMTC` / `BOUNCE` / `TILTB` / near-far, `EYE`, `BAS`,
`camera()`, `lookVP()`) — and **`ears.js`** — the ear block the scene reads, the tonic's slow latch and the two
test pins (`EARS`, `PRESETS`, `PINS`, `figure()`, `ears()`, `readEars()`). `index.js` is **428 lines**, 51 fewer
than at HEAD; the soft-cap warn stands and is one of six in the repo (the others 361-467). The split is proved
byte-identical by the md5 pair below and by the four traces.

**`hooks.dinfo()` is new** (commit `64a9b19`): `tools/dust-trace.js` records every numeric key of a scene's
read-only `dinfo()`, and CHLADNI published none, which is why no ruler had ever counted a throw. It reports the
kick's held size / age / `kH` / scatter, the ring, the drive, gate, lift, spiral, glow, fog, the figure, and
`set` / `air` from the **settle instrument** — the fraction of the sand within `DELTA` of a nodal line, which is
the number a throw actually moves (a readback, so a pipeline stall, which is why it lives in `dinfo` and never
in `update()` / `draw()`). `CH_KICKJ` became `export const KICKJ` in `shaders.js` so the scene and the shader
share one number; the template prints it back byte-identical.

### The proofs

- **`node tools/check.js` 0 fail** (159 modules, 202 uniforms, MS keys 207, `help.feats` gaps 0, the 6 soft-cap
  warns) · **`npm test` exit 0**, every suite clean. `tools/test_chladni.js` needed **no change**: it tests
  `assets/math/chladni.js`'s numerics (the figure, the table, the slide's continuity, the Bessel rings, the GLSL
  twin) and encodes no scene-side size at all, and `math/` was not touched.
- **The s11 fake-timeline md5, the first time it is recorded** (`IDS="11" tools/scene-md5.sh`, `GPU=1`,
  1280x720), as an isolated pair — a pristine worktree at `35242cf` against this tree:
  ```
  s11-f360.jpg  8a930b26be89a46ec070dae9a897ce03     <- IDENTICAL on v0.25, §73 and §74
  s11-f840.jpg  5a5c795afac268921e60ae09b18fdbbb
  ```
  `scene 11 errs []` on both, `hop 840 row 72`. **0 of the 2 lines move**, and that is the prediction, not a
  surprise: under `#test` the ears never run, so `kickEvt` is false and `kickAmp` / `snareAmp` 0 and `snareAge`
  99 and `lpSweep` 0 — and `smoothstep(0.80, 0.97, 0)` is 0, so the eased fog never leaves 0 either. It is §70
  open item 4 in this scene: **the fake timeline cannot exercise any of the three channels this session changed.**
  No other scene's lines can have moved — the diff is `assets/scenes/chladni/` and nothing else, not `math/`,
  not `core/`, not `engine/` (HARNESS "What to re-prove": a scene-folder change is proven on its own lines).
- **The continuity monitor on scene 11, on a real track** (`tools/monitor.js` with
  `CARD.NAV = CARD.REG[11].scene.state`, SeeYouDrop from 20 s, 70 s, `GPU=1`): **`n` 4206 frames, `viol` [],
  `fast` 0, the worst undeclared jump 0.0289** against the 0.06 threshold. `CARD.ERRS` 0.
- **Cost flat.** `CARD.bench(11, 300)` interleaved with `bench(0, 300)` in the same page, `q` **and `Q.ceil`**
  pinned 0.95 (the pacer's own step sinks `q` after a blocking bench — the plain `setInterval` of the HARNESS
  recipe left it at 0.75, tier 2, and the grain count follows the tier), 9 s warm-up, the first pair of each run
  discarded, two runs per tree, `points` 150000 and `gl.getError()` 0 on every one: **ratio median 0.856 (v0.25,
  eight pairs 0.762-0.900) → 0.837 (§74, eight pairs 0.708-0.871)**. The two spreads overlap completely and
  NAV's own absolute ms drifted 13 % between runs, which is why only the ratio is quoted. Expected: one
  `Math.sqrt` per kick event and one `ema` + one `smoothstep` per frame. **The machine was not idle** (load
  2.5-3.8, the user's own Chrome).
- **`tools/parity.js` was not run**: it compares the core / engine against v3 and this diff is one scene folder.
- **No audible run.** Every number is the deterministic file path (`&map=0`, `CLOCK=1`), the node harness or the
  fake timeline. At most two page Chromes, on `PORT=8914` / `8915`; the user's server on 8765 was never touched.
  A 19-hour-old orphaned headless Chrome from an earlier session (`tools/chr9678`, reparented to systemd) was
  killed by pid before the bench.
- Scratch, gitignored like §70's and §73's: `tools/work/v74/` — `chl.py` (the per-hit ruler), `cmp.py` (the
  before/after tables), `lpprof.js` (`lpSweep` over whole tracks + the knee sweep), `bench.sh`, and the
  16 traces `{base,head,varA,after}-{SYD,CN,VI,MAL}.json` plus `route-SYD.json`. The two worktrees
  (`/tmp/rr-v73base` at `35242cf`, `/tmp/rr-v74A` at `64a9b19`) are removed.

### Open, for the orchestrator

- **The fog has never been validated by anyone** — it had no behaviour until §73 and no tuning until now. The
  knee's two numbers are fitted to five tracks' distributions, not to an eye. **SeeYouDrop's last 20 s is the
  one place on the four A/B tracks where it does anything at all**, and the A/B window (20-110 s) does not
  reach it: watching the fog means watching the outro.
- **The hat's ripple is stale on its own event frame** and there is nothing to move it to: `hatVel` read at
  `hatAge` ≈ 0 is the previous hat's rank, and §70 established there is no `hatAmp` because the hat's onset
  function is a median-residual flux with no magnitude in dB. Either the hat lane grows a rise in dB (an engine
  item) or the ripple's depth is read a frame or two late on purpose (a scene item). Measured consequence not
  yet taken: the hat fires 8-16/s, so consecutive hats are usually similar and the error is small.
- **`kickVel` / `snareVel` are no longer read by this scene** and came out of `feats` and `help.feats`
  accordingly (a route to a field nobody reads is a lie — `route.js`). They are still published, still routable
  on other scenes, and `snare2` / `kick2` are untouched. **DUST's kick voice and TORUS2's kick wave still size
  themselves from `kick2`'s rank** — §70 open item 3 and §73 open item 3, still unmeasured, and this session is
  evidence for `kickAmp` there too: the staleness argument applies to any one-shot armed on an event.
- **The plate's standing brightness fell and did not come back** (SeeYouDrop lumC p50 185 → 169 with no fog at
  all), because there is less sand in the air at any moment once the throw is graded. If the user wants the old
  density back, the lever is `LEAPK` or `SANDB`, not the field — and raising `LEAPK` would take the loud hits
  past the validated throw.
- **Vienna and Malicious now read visibly softer than SeeYouDrop and CyborgNinja in the kick AND the ring**
  (loudest throw 57 % / 79 % of full, loudest ring 0.41 / 0.35 against 0.51 / 0.55). That is §70's design
  working, and it is the first time this scene has shown it. If the user reads it as "those tracks look weak",
  the per-track normaliser is the lever and the decision is theirs, not the measurement's.
- Carried and still open: `tools/accept.sh` has not been run since v0.14; SeeYouDrop's PCM lock 9.2 → 12.0 s;
  the fake timeline carries no percussion events (§70 item 4, which is why s11's md5 cannot see this session);
  `tools/parity.js fake`'s pre-existing NAV rows.

**The A/B watch list, in TRACK time.** Old = `releases/retinarave-v0.25.html` from `file://` (pre-§73 CHLADNI);
new = `http://127.0.0.1:8765/`. **Scene 11 has no digit key** — press **`n`** to cycle to it (ids 9+ have none),
or open `#scene=11`. In FILE + map mode `kickAmp` / `snareAmp` are the map's own velocities, so use stream /
live mode or `&map=0` to see the lane's.
- **SeeYouDrop 0:20-1:50, the kick** — the one to look at first and the track this scene was tuned on. In v0.25
  essentially every kick threw the sand to the same full height (68 % of hits at size 1.000); now the loud ones
  still reach that height and the median reaches 56 % of it. Watch for the throw reading as GRADED rather than
  as weaker: the per-kick lift is slightly ABOVE v0.25 (+54.9 → +58.1 lumC) even though the median throw is
  lower. What genuinely did go down and stayed down is how much sand is in the air between kicks.
- **SeeYouDrop 2:17-2:37 (the outro), the FOG** — the only place on these four tracks where `lpSweep` reaches a
  real closing filter (p50 0.956 against 0.371 for the body). The plate should grey and dim into its figure
  there, and nowhere else. **Against the OLD build the comparison is three-way**: v0.25 had no fog at all, HEAD
  had 0.35 everywhere, and this has it only here.
- **Vienna 0:24-1:00 and Malicious, the kick** — the quiet-master test. Their loudest kicks now throw 57 % and
  79 % of the full height where v0.25 threw ~100 %. If that reads as limp rather than as honest, say so: the
  raw absolute reading (rejected here at 32 % / 63 %) is the direction NOT to go, and the per-track normaliser
  is the other way.
- **CyborgNinja 0:20-0:50, the fog** — the control. Its whole track sat at fog 0.45-0.55 under HEAD (39 % of
  frames over 0.5) and now sits at 0.000. The plate's centre goes 132 → 142 and the sand stops being dimmed.
- **Any track, a soft kick against a hard one** — the new thing to look for in this scene, and the thing the
  validated default could not show: the height of the throw and the brightness of the ring now follow how big
  the hit was, and the ring in particular is now attached to the RIGHT hit (its correlation with its own hit was
  −0.01 to 0.31 in v0.25).

## §75 the shape did not move because the sub was not there — and the one engine fault behind it: the gate's cold start assumed the sub owned the low end (2026-10-01, one worker; the user on CHLADNI in stream mode: "opening 10 secs the pitch is changing but the shape isn't?", rated low priority *unless* it is the engine)

Three commits: `3186ed9` the `dinfo()` figure columns, `d67890c` the engine fix plus `test_ears.js --cold`, this
section plus OPEN-ITEMS. **Not tagged, not pushed, not deployed.** No audible run.

### The ruler

`WARM=0 PORT=8916 node tools/dust-trace.js <T> 0 20 <out> 11 '<21 MS fields>'` on all five tracks — `WARM=0` so the
engine starts cold at t = 0 exactly as the user's play button does — and `dinfo()` gained the three numbers the FIGURE
is made of, because `s` alone cannot say which of them moved it: `note` (the sub note the vote sits on), `win` (the
vote's winner), `ton` (the tonic the interval is measured from), `latch` (the scene's raw TONIC LATCH) and `sTgt`.
The audible pitch is measured offline from the decoded PCM, independent of the engine: a 0.25 s harmonic-product
spectrum over the **70-200 Hz mid-bass** (the layer the ear hears when there is no sub) beside a 22-130 Hz YIN and the
22-70 / 70-150 / 150-600 band shares. The rulers are in `tools/work/v75/` (gitignored, as §73's were):
`openpitch.py` the two offline contours per track, `midbass.py` the 70-200 Hz HPS contour of SeeYouDrop's intro,
`firstblocks.py` the zero-phase band levels of the first 0.6 s, `cold2.js` the gate's internals block by block,
`gateab.js` the whole-track A/B, `an.js` the trace reader.

### The timeline, per track (cold, file-det, scene 11, 0-20 s)

| track | the audible pitch changes at | the sub's own share of the low end | `tonic` / `key` first report | `subGate` first open | `subNote` first / first change | the FIGURE first change / **held** |
|---|---|---|---|---|---|---|
| **SeeYouDrop** | **2.25 · 3.25 · 5.25 · 6.00 · 9.50 · 12.75 s** (the mid-bass walks C#2 E2 A2 E2 F#2 E2 C#2 at 70-110 Hz, −12 to −20 dB) | **0.001-0.008 to 12.9 s**, then 0.92 | 0.35 s (F) → **0.68 s C#**, held to 8.5 | 0.17 s, shuts 0.77 s | 0.20 s (A1) / 0.48 s, then −1 | 0.20 s … then **FROZEN at s = 7.000, figure (1,3), 2.23 → 13.02 s** |
| **CyborgNinja** | continuously (C2 / C#2 / D2 sub from the first beat) | 0.47 by 0.075 s, 0.23-0.38 throughout | 0.35 s (G), then **11 changes in 12 s** | 0.17 s, 98.5 % of 0-10 s | 0.17 s / 0.23 s | 0.35 s, then ~40 changes in 0-10 s |
| **Malicious** | from 0 s (a 98 Hz G2 lead; the track fades in from digital silence, \|x\| 4e-4 at t = 0) | **never above 0.011 to 0.63 s**, real sub at 5.37 s | 0.35 s (G) → 1.37 s (D) | **was 0.17 s (FALSE) → now 5.37 s** | **was 0.28 s (FALSE) → now 5.42 s** | **was 0.40 s then s = 2.000 held to 5.42 → now s = 0.000 (home) to 5.47 s** |
| **WhoLikesToParty** | continuously (a D2/F#2 bass + a sub from the first beat) | 0.42 by 0.117 s, 0.01-0.71 | 0.35 s (D), then **8 changes in 6.5 s** | 0.17 s, 84.5 % of 0-10 s | 0.17 s / 0.32 s | 0.40 s, then ~40 changes in 0-10 s |
| **Vienna** | continuously (D#1 → A#0 → F#0 → F1 → E1, every bar) | 0.51 by 0.053 s, 0.39-0.54 | 0.35 s (D#), **never changes** | 0.17 s, never shuts in 0-20 s | 0.17 s / 0.20 s | 0.28 s, then every bar | 

### The answer: on SeeYouDrop it is (c), the scene — and the engine is right

**(b), the §62 override, is eliminated outright.** `tonic` first reports at **0.35 s on all five tracks** and `key` /
`mode` take it over on the same frame. 0.35 s is `tonic.js`'s structure and not a ramp: the chroma FFT needs `CH_N`
8192 samples in the ring (0.17 s at 48 kHz) and `CH_EVERY` 32 blocks (0.34 s) before the FIRST `solve()`, after which
`tonicConf` is the KK margin and is available immediately (0.04-0.27 at 0.5 s). `HIST` is the read-back ring (512
frames, ~4 s of history to interpolate at heard time), not a warm-up. **Nothing the figure reads is late.**

**On SeeYouDrop the figure is frozen for 10.8 s, and every field feeding it is correct.** The first 12.9 s of that
track contain **no sub at all** — the 22-70 Hz band holds 0.1-0.8 % of 22-600 Hz, measured zero-phase offline — and
the pitch the user hears move is the **70-110 Hz mid-bass**, which `sub.js` rejects on purpose (`SUB_LP` 100, `SUB_FMAX`
130, `GATE_BAND` 22-60 and `GATE_SHARE_ON` 0.30: *"without this the intro's 109 Hz mid-bass … read as a sub"*). So
`subNote` is −1 from 0.77 s to 13.02 s, CHLADNI's vote has nothing to vote on, and `index.js` **holds the last figure
while the sub is gone** — stated in its own header, and right: drop 2's 60 ms ducks must not reset the plate. **This
is (c), by design, and nothing in the engine is at fault for it.**

What makes it look worse than a held home figure is which figure is held. The gate DID open at 0.17 s on
SeeYouDrop, and honestly: there is a **real −3.8 dB 22-70 Hz hit at 0.050-0.125 s** (share 0.96, 40 dB over the intro
that follows), a sub impact at the top of the track. The first YIN frame cannot run before 0.167 s (`need` = W + tmax
+ 2 = 334 decimated samples), by which time that hit is over, so YIN read its **−45 dB tail** — A1, then G#1, G1,
A1, C#1 — at conf 0.86-0.98, and the scene's vote took `win` = 8 off 0.28 s of it. The plate then sat on interval 7
(a fifth above C#), figure **(1,3)**, from 2.23 s to 13.02 s. Removing that reading would not make the shape move; it
would make the held shape the **home figure (1,2) on the tonic**, which is the honest picture of "no sub".

### The engine fault: two defaults that said "the sub owns the low end" before anything had been measured

The gate has two halves and **at a cold start the level half cannot say no.** `rel = ms / q90` and `Quantile` is a
running MEAN of its first 16 samples, so on the first frame `rel` ≡ 1.000 whatever the absolute level, against
`GATE_ON` 0.020 — and the first frame's `ms` is worse than that: `rmsAcc` / `rmsN` accumulate from input sample 0
while `frame()` does not run until 0.167 s, so the first level sample is an RMS over a **171 ms** window where every
later one covers one 7.3 ms hop. That leaves the SHARE half as the only half that can refuse — and it was seeded
`this.share = 1` and re-fed `sh = 1` on every block with `den === 0`. So:

- `subGate`, `subIn` and `subNote` fired on the **first YIN frame of every one of the five tracks, 0.167 s**, and the
  share then needed `SHARE_DOWN` (0.45 s) to decay off a claim no sample supported: the gate shut at 0.63-0.77 s.
- On **Malicious** that is unambiguously false. The track fades in from digital silence (the first 512-block's peak
  sample is 4e-4; the 22-70 band runs −107 → −54 dB over 0-0.6 s) and its share of the low end **never exceeds 0.011**
  against `GATE_SHARE_ON` 0.30. Only the seed held the gate open. CHLADNI then latched `win` = 4 and walked the plate
  through figures 11, 10, 9, 10, 11, 0, 1, 2 and sat on s = 2.000 until 5.42 s — all of it off two notes read in a
  0.63 s window with no sub in it.

**The fix, two lines.** `sub.js`: `this.share = 0` — the honest prior, and it costs a real sub nothing, because
`SHARE_UP` is 0.012 s (two 512-blocks, 21 ms) and the first YIN frame is at 0.167 s regardless. `ears.js`: with
`den === 0` the share is UNDEFINED, so it is **held**, not set to 1. **Rejected: a time-based warm-up** that forces
the gate shut for N seconds — three of the five tracks have their sub in the first beat and report truthfully on the
first possible frame, and a dead plate for the first half-second of a live set is a visible regression bought for
nothing. **Rejected: an absolute level floor** — the ears are relative by design (AGC-proof) and at t = 0 there is no
loud reference to be relative to; the share is the one measurement that is meaningful on the first block.

**Proof, on the music.** The whole-track gate timeline of all five tracks, per YIN frame, before and after
(`tools/work/v75/gateab.js`):

| | frames differing | window | gate-open share | `subIn` | `subNote` | events lost |
|---|---|---|---|---|---|---|
| SeeYouDrop | **0 / 14775** | — | 81.32 % → 81.32 % | 30 → 30 | 365 → 365 | none |
| CyborgNinja | **0 / 16880** | — | 99.60 % → 99.60 % | 8 → 8 | 975 → 975 | none |
| Malicious | 43 / 20899 (**99.794 %**) | **0.171-0.619 s only** | 49.63 % → **49.42 %** | 127 → **126** | 408 → **406** | `subIn@0.167` `subNote@0.167` `subNote@0.471` `subOut@0.623` |
| WhoLikesToParty | **0 / 24032** | — | 77.31 % → 77.31 % | 510 → 510 | 1076 → 1076 | none |
| Vienna | **0 / 18061** | — | 80.73 % → 80.73 % | 38 → 38 | 736 → 736 | none |

So the change is **43 frames of one track, all inside its first 0.62 s**, and it removes exactly the four false
reports. **No true report is lost or delayed**: the four tracks whose sub is in the first beat still open the gate on
the very first YIN frame, 0.1707 s, to the frame. The two §73 numbers it touches are Malicious's gate-open share
(49.7 → 49.4 %) and its `subIn` count (127 → 126) — stated here because §73 published them.

**A new ruler, `node tools/test_ears.js --cold`, 16 pass.** Per track: the first gate open, the first `subNote`, and
the invariant the fix buys — **the gate may not open before the share has been measured to say the sub owns the low
end** (`open >= the first block whose raw share reaches GATE_SHARE_ON`), plus `new SubTrack(sr).share === 0`. Run
against the two old defaults it reports **4 FAIL** (the negative control).

**Proofs.** `node tools/check.js` **0 fail** (159 modules, MS keys 207, help.feats gaps 0, the same 6 line-cap warns
as HEAD) · `npm test` **0 FAIL** (all 12 groups) · `node tools/test_ears.js --cold` **16 pass** ·
`node tools/test_ears.js --keys` (§62's table) **byte-identical to HEAD** · `node tools/test_ears.js --sr=48000`
**ruler output byte-identical to HEAD** (the same 5 recorded causal-path misses; only the wall-clock cost line
differs) · `node tools/test_chladni.js` **OK, 12 figures** · the 12-scene md5 sweep **24 / 24 lines identical** to an isolated `git worktree` at `1a5eadb`, `errs []` on every scene (the ears never run under `#test`). The offline map is untouched:
`map/map.js` ASSIGNS `sub.share` at `i % PHOP === 0` starting at i = 0, so the constructor's value is never read
there. Nothing but the sub gate reads `sub.share`. Files: `assets/engine/ears/sub.js`, `assets/engine/ears/ears.js`,
`assets/engine/ears/feats.js` (the `subGate` formula), `assets/scenes/chladni/index.js` (`dinfo()` only),
`tools/test_ears.js`, `docs/DECISIONS.md`, `docs/OPEN-ITEMS.md`.

### What the SCENE would do about the frozen figure — for the user to decide, NOT shipped

The user rated this low priority unless it was the engine, and the part of it that is the engine is fixed above; the
rest is the scene, so nothing in `assets/scenes/chladni/` moved but the read-only `dinfo()`. Two candidates, measured
but not applied. **(1) An absolute floor on the vote's evidence, one constant.** `win` is taken outright the first
time any note is voted (`this.win < 0 || …`), and on SeeYouDrop that first vote is worth `dt · sub² · conf` ≈
**0.0014** of accumulated evidence against the drop's **0.096** — a 70x margin, so a floor anywhere near 0.01 would
refuse the intro's reading and leave the plate on the home figure (1,2) at interval 0 until a real sub arrives. It
makes the held figure honest; it does not make the shape move. **(2) Let the figure follow the bass where the bass
LIVES.** The scene already computes exactly that for its camera and its drive — `lvl = sub + (bass − sub)·reg` through
the `REGLO` / `REGHI` knee, and on SeeYouDrop's intro `bassReg` reads 1.000 — so the information "the bass has moved
an octave up" is already in the frame; what is missing is a PITCH for that layer, which the ears do not publish
(`subNote` is the 22-130 Hz sub and nothing else). Offline, the intro's mid-bass is C#2 E2 A2 E2 F#2 E2 C#2 =
intervals 0, 3, 8, 3, 5, 3, 0 to the C# tonic, which would draw **(1,2) → (1,5) → (2,5) → (2,3)**: four figures
distinct by eye, changing on the six bar lines the user heard. That is the fix that answers the complaint as asked,
and it costs a new engine field (a 60-200 Hz pitch track) and a second pitch channel in a scene whose whole premise is
one element, one channel (CONTRACTS §0). (1) is a constant; (2) is a milestone.

**v0.26 tagged locally (2026-10-01) on the user's word ("tag what we have so far"; deploy still held):** v0.25 + §72 (Malicious's
grid re-phased +23.22 ms, the `dp_beats` t0 bug), §73 (`Quantile(q)` returned the (1−q) quantile — fixed, four consumers
re-calibrated, `*Vel` an honest rank), §74 (CHLADNI's kick / snare on `kickAmp` / `snareAmp`, the fog knee).
`releases/retinarave-v0.26.html` (from `file://` on scene 11: errs [], nonFinite [], clock pcm), package.json 0.26.0. Not pushed
(retinarave.com serves v0.15). The user on CHLADNI: "opening 10 secs the pitch is changing but the shape isn't?" — lower priority
unless it is the engine. **§75 measured it:** on SeeYouDrop it is the SCENE and by design (the first 12.9 s have no sub; the pitch
that moves is the mid-bass the ears reject on purpose), and the one engine fault beside it — the sub gate's cold start assumed the
sub owned the low end — is fixed on top of v0.26, untagged.

## §76 the Arnold tongues in shadow mode — a circle-map phase-locking descriptor on the PCM clock, twelve fields no scene reads yet (2026-10-01, one worker; the user: "rec for tongues approved (do work with fable)"; `docs/plans/TONGUES-PLAN.md` phase 1; the probe `tools/truth/tongues/{env,probe}.py` is the target)

Commit `de64fa5` (the stage, the fields, the tests, the node tool), this section plus the plan's table and OPEN-ITEMS. **Not
tagged, not pushed, not deployed.** No audible run. Phase 2's receipt table and its decision are in §76a below (the knob is
built, left OFF); phase 3 is §77, phase 4 §78; phase 5 (TORUS2's fog) is not in scope.

### What was built

`assets/engine/clock/tongues.js` (pure, 200 lines): a bank of sine circle maps θ += Ω·f_beat·dt − (K/2π)·ô·sin 2πθ with
λ += ln|1 − K·ô·cos 2πθ|, driven per 512-sample hop by the PCM clock's own band-flux NOVELTY (the flux minus a causal 0.5 s
EMA, rectified, normalised so ô sums to ~1 per oscillator cycle — the probe's definition, §2 of the plan), the bank's natural
rates following the CLOCK's rate (`Clock.f`), the windows closing on the CLOCK's beats (`floor(b)` stepping, in audio time)
over a ring of 16 beat snapshots. The MID band (150–2500 Hz, §69's snare lane band; one new accumulator `smid` over bins 7–107 in
`strength()`'s existing loop) carries the ladder: Ω ∈ [0.25, 4] at 1/16 oct plus every p/q with q ≤ 4 — **84 oscillators**;
the LOW band (40–150 Hz, §59's `s40`) carries **one** oscillator, Ω = 1, for `tongueLat` / `tongueLatConf`. Per beat: ρ_i =
Δθ_i / 16, d_i = (1 − exp(Δλ_i / (Ω_i·16))) / K; a tongue p/q = the contiguous run with |ρ − p/q| < 0.02 and d > 0.05; its width
in octaves (+ one bank step), the 1:1 width → K_impl = 2π × its half-width in Ω. `Clock.hop()` calls `tongues.hop()` when one is
attached; `features-clock.js` attaches one to every new Clock while `TONGUEK.on` (so the first hop feeds it and page = node);
`features-tongues.js` (after `clock-pcm`, before bars) only publishes, easing `tongueDepth` 0.3 s. A clock re-seat or lattice
move (|Δb − f·dt| > 0.3 in a hop) clears the ring (`tongueOn` 0 for 16 beats); an onset's small backward correction does not
(the first cut cleared on ANY backward step and Vienna's dream read "warming" for 20 s). `&tongues=0` / `ENGINE.TONGUEK.on`:
no bank, `tongueOn` −1 (`loudAbs`'s A/B convention). `sources/fake.js` mirrors the twelve as constants from its phase, the
8th / 16th depths and the swing the SAME constant in every phase (§78 reads a change in `tongue21`: it must see none here).

**Three definitions settled against the numbers, each with the one that lost:**
- `tongueAmbig` = **1 − max(tongue11, tongue21, tongue41)** — the music locks none of the clock's beat family. The plan's
  "1 − the ladder winner's depth" was built first and read 0.84–0.94 through Vienna's dream where the beat's own depth is
  0.00: on a window where nothing is wide a 1-step run at d 0.1 wins the width tie. The octave ladder's best depth reads
  **1.00** there and 0.4–0.6 in a groove.
- the ladder's winner (`tongueP`/`tongueQ`): the widest tongue, ties to the LOWER q then the lower p (the probe's rule).
  Ties to the deeper give 2:1 every tie on every track (Vienna's "1:1 wins" 74 → 29 %), which is the plan's own finding that
  depth prefers the denser lattice. On a PURE 1:1 click train the field reads **2/1** (the Ω = 2 oscillator takes twice the
  drive per cycle under the per-cycle normalisation) — a width ranking, honest to the probe's 39–82 %, not an octave verdict.
- `swing`: the drive's histogram over the CLOCK's phase (64 bins), the beat's own peak found within ±0.15 of the line, the
  off-8th the parabolic mode in 0.4–0.75 of it — and 1.0 unless the Ω = 1 oscillator is locked (d > 0.05) and the mode is a
  local maximum carrying ≥ 25 % of the beat's peak. Over the oscillator's OWN phase (the probe's axis) a swung train at 0.6
  read 2.0 (the phase jumps at every click it is pulled by); over the clock's phase alone the five straight tracks read
  1.16–1.30 (the hats' flux peaks a hop after the line); referenced to the flux's own on-beat peak they read 1.00–1.02 and the
  swung train 1.51.

### Node = probe (`tools/tongues-node.js`, the clock-centred bank; the probe's truth-centred `smid` / `s40` rows in brackets)

| track | 1:1 wins | d 1:1 p50 | d 2:1 | d 4:1 | w 1:1 oct (K) | low d 1:1 | lock phase mid / low ms | swing | ambig ≥ 0.9 runs ≥ 8 beats |
|---|---|---|---|---|---|---|---|---|---|
| SeeYouDrop 150 | 29 % (43) | **0.288** (0.287) | 0.400 (0.409) | 0.394 (0.376) | 0.125 (0.125; K 0.27 = 0.27) | 0.172 (0.116) | +61 / +51 (+46 / +48) | 1.000 | none |
| CyborgNinja 160 | 0 % (0) | **0.073** (0.073) | 0.607 (0.613) | 0.680 (0.679) | 0.063 (0.062; 0.14 = 0.14) | 0.178 (0.204) | −90 / +22 (−91 / +18) | 1.018 | none |
| WhoLikesToParty 117 | 21 % (20) | **0.169** (0.161) | 0.443 (0.446) | 0.546 (0.546) | 0.063 (0.062) | 0.251 (0.253) | +9 / +49 (+10 / +48) | 1.024 | none |
| Malicious 140 | 35 % (13) | **0.359** (0.359) | 0.438 (0.438) | 0.174 (0.184) | 0.187 (0.187; 0.41 = 0.41) | 0.122 (0.109) | +71 / +96 (+75 / +93) | 1.000 | none |
| Vienna 90 | 74 % (82) | **0.352** (0.363) | 0.459 (0.453) | 0.414 (0.420) | 0.187 (0.187; 0.41 = 0.41) | 0.037 (0.032) | +8 / +176 (−7 / +179) | 1.000 | **72.0–86.0 s (22 beats)** |

Every MID-band depth within **±0.016** of the probe and the low band's within ±0.056 (the plan's stop line was ±0.05 — one low-band cell, SeeYouDrop, sits 0.006 past it, explained below), the widths to the bank step, the lock phases within
15 ms, the low band's half-beat reading on Vienna (+176 at d 0.04) and the kick lattice on CyborgNinja (+22 at d 0.18) both
reproduced. Where the engine differs and why: SeeYouDrop's low d 0.172 against 0.116 and CyborgNinja's 0.178 against 0.204 —
the probe's medians are over 16-beat windows on the TRUTH downbeats every four bars, the engine's over every clock beat (the
trailing window steps once a beat, so 4× the samples, and the bank's rates follow `bpmPcm`, which wanders in the first 20 s);
the "1:1 wins" column is the noisiest (a width tie decides it) and Malicious's 35 against 13 is that. Vienna's dream: `tongue11`
= `tongue21` = 0.00 from 73.4 to 89.3 s, `tongueAmbig ≥ 0.9` for **22 clock beats, 72.0–86.0 s** (the probe's `o`-drive run
74.0–86.0); at ≥ 0.8 none of CyborgNinja / WhoLikesToParty / Malicious holds 4 beats, SeeYouDrop's outro holds 7 at 0.9 and 18
at 0.85 (150–157 s). Swing: all five straight, 1.00–1.02. First full window 9.8–18.4 s after a cold start (16 beats after the
clock's first beat, plus any re-seat: SeeYouDrop re-seats at 9–18 s and refills at 18.4).

### Proofs

- `node tools/check.js` **0 fail** (161 modules, 219 MS keys, 12 new FEATS entries + Appendix A rows, help.feats gaps 0; the six
  pre-existing soft-cap warns) · `npm test` **OK** with `tools/test_tongues.js` (16 cases: a 1:1 train d 0.976 / width 0.50 oct
  against the sine map's K/π = 0.46 / K_impl 1.00 / `tongueLat` 0.02 at conf 0.98; a 2:1 train d₂:₁ 0.965 with d₁:₁ 0.273;
  8ths 2.46 dB under the quarters: d₁:₁ − d₂:₁ = −1.00 / −0.74 / +0.27 at K 0.5 / 1 / 2 — **at the engine's K 1 the denser
  train is still the deeper**, so the plan's "1:1 > 2:1 only when K is in the probe's range" holds only at K 2, and the octave
  stays with §61; a swung train at 0.6 reads 1.51; silence d 0 / ambig 1; a 0.5-beat jump clears and refills at +16; two runs
  bit-identical) · `node tools/parity.js fake`: the same max |diff| 7.852 and the same `nav.*` MISMATCH line as HEAD in the
  base worktree (pre-existing, v3's reference page; the twelve fields show as "missing in v3" info).
- **Page = node** (`filetrace.js <T> 0 60 … '&map=0&lead=0'`, `WARM=0`, against `tongues-node.js`'s trace, `build-node.js --cmp`):
  SeeYouDrop and WhoLikesToParty **3600 / 3600 frames within 1e-3 on all twelve** (max |diff| 1e-4 on the depths, 2.6e-3 on one
  `tongue41` window); Vienna 0–110 s 84–100 % within 1e-3 (max 0.015 on `tongue11`, 0.116 on one `tongue21` window — the
  page's `bpmPcm` differs from node's by up to 1.6 BPM transiently and the windows close on the clock's beats). **CyborgNinja and
  Malicious do not agree — because the page's CLOCK is not node's there**: `bpmPcm` max |diff| 46 / 31 BPM in the first seconds
  and `beatCountPcm` 1–3 off for the whole minute, and the HEAD worktree's `build-node.js` clock is **bit-identical** to the new
  node's (10800 / 10800 on `bpmPcm` / `beatCountPcm` / `beatPhasePcm`), so this is §59's cold-start page / node gap (OPEN-ITEMS,
  AUDIT-live-grid Step 6 addendum 3), pre-existing; the depths agree to ±0.02 once both clocks are locked. Two Vienna det runs
  `cmp`-identical (1.25 MB).
- **The fake-timeline md5 sweep in an isolated worktree: 0 of 24 lines moved** (`git worktree add --detach /tmp/rr-base HEAD`,
  `PORT=8921 tools/scene-md5.sh base76` against `PORT=8920 tools/scene-md5.sh new76` on the new tree, `errs []` on all 12 ids;
  `tools/work/tongues/md5-{base76,new76}.txt`). The stage never runs under `#test`; the mirror is written by fake.js; no scene
  reads a field.
- **Re-taken on §78's warm normaliser (`c849b38`)**: SeeYouDrop 0–60 s page = node 3600 / 3600 within 1e-3 on eleven of the
  twelve fields (max |diff| 1e-4 on the depths, 4e-3 on `tongue41`; `tongueP` differs on 143 frames by a width tie); the
  §77 page rows re-taken whole-track: Vienna 8.9 beats / −3 ms / 0 false, CyborgNinja 0 arms — unchanged.
- **Cost.** Node: the bank alone **1.0–1.7 µs per hop = 1.6–2.7 µs per 60 Hz frame** (`tongues-node.js`'s last column; the
  first cut with two 84-oscillator banks and no fast path read 4.1–4.7 µs/hop, and the PAGE read it at +0.035–0.044 ms per
  frame on `CLOCK.cpuTotal / frameN` — 5× node, so two things were cut: a hop with zero novelty rotates freely without the
  sin / cos / log (half the hops), bit-identical to the full step, and the low bank became its one Ω = 1 oscillator). Page,
  SeeYouDrop 20–60 s det, interleaved on / off: `CLOCK.cpuTotal / frameN` **0.230 / 0.235 against 0.234 / 0.222 ms** — inside the
  noise, under the plan's +0.01; `ENGINE.ms` 3.36 / 3.11 against 3.09 / 3.15. The ladder's per-beat pass (24 rationals × 84) is
  not measurable.

### What the shadow stage says about the plan's five questions, in the engine's numbers

The bank reproduces the probe and the plan's verdict stands: it does not decide the octave (2:1 deeper than 1:1 on all five,
and on a pure 1:1 train), it re-derives §59's low-band lattice statistic with a confidence (`tongueLatConf` 0.18 on CyborgNinja,
0.04 on Vienna where §59's rule is silent), it sees nothing at Vienna's drop 2 (`tongueAmbig` 0.53–0.77 through 100–108 s, a
groove), and it carries the one thing nothing in MS carried: Vienna's dream as **22 beats of `tongueAmbig ≥ 0.9` ending at the
drop** — §77 reads it. Open: the "1:1 wins" statistic is a tie-breaker's and should not be read as a tempo vote; the bank
re-centres on `bpmPcm`, so on the two tracks whose page clock is not node's the fields inherit that gap.

### §76a phase 2 — `tongueLat` as the lattice input: the knob is built and stays OFF (the cold-start table said so)

`CLOCK.LAT_SRC` (`'low'` = §59's two leaky 40–150 Hz energies, the default; `'tongue'` = the bank's Ω = 1 phase against the
clock's line, the low band while `tongueLatConf ≥ 0.06`, the mid band's otherwise, |phase| > `LAT_TJUMP` 0.3 for `LAT_SUS`
of net time → forward half a beat, exactly §59's hold and move) and `tools/tongues-cold.js`: **the cold-start table the engine
never had** — the clock started cold at 10, 25, 40 … 145 s of each truth track in node on the det time base (46 starts), graded
at the truth beats: the lattice it lands on (the median lag over the last 30 s within ±0.25 beat), the lock time (|lag| <
0.1 beat for 8 s), lag p50 / p90 and the share within 30 ms from 15 s after the start, the lattice moves. `CLOCKK='{"LAT_SRC":
"tongue"}'` is the one-knob A/B. `tools/work/tongues/cold-{low,tongue}.md` hold every row.

| track | starts on the truth lattice, low / tongue | lock s p50 (max) | within 30 ms p50 | lag p90 p50 (ms) | lattice moves |
|---|---|---|---|---|---|
| SeeYouDrop | 7 / 7 · 7 / 7 | 11.2 (24.8) · 11.2 (24.8) | **98.8** · 94.3 % | **18** · 21 | 3 · 2 |
| CyborgNinja | 9 / 9 · 9 / 9 | 2.8 (14.0) · 2.8 (12.9) | 100.0 · 100.0 % | 3 · 3 | **2** · 4 |
| WhoLikesToParty | 10 / 10 · 10 / 10 | 3.3 (13.1) · 3.3 (13.1) | 100.0 · 100.0 % | 9 · 9 | 0 · 0 |
| Malicious | 10 / 10 · 10 / 10 | 8.9 (17.1) · 8.9 **(12.3)** | 82.5 · 82.4 % | 36 · 35 | 2 · 1 |
| Vienna | 10 / 10 · 10 / 10 | 15.7 (44.0) · 15.7 (44.0) | **80.5** · 77.6 % | **109** · 160 | **0** · 4 |

**Both rules land on the truth lattice from every one of the 46 starts** — §59's rule is not right "by cold-start luck" on
Vienna (§66's reading): ten starts, ten right. The tongue rule is better on one cell (Malicious's worst lock 17.1 → 12.3 s, the
start-10 run 17.1 → 11.1) and worse on three tracks: Vienna's low band has no lattice (d 0.04), so the rule falls to the mid
band, and the mid band's Ω = 1 phase sits +8 ms with a fat tail that crosses 0.3 cycle for 4 s on four starts — **four
lattice moves §59's rule never made**, p90 lag 109 → 160 ms, within-30 80.5 → 77.6 %; SeeYouDrop 98.8 → 94.3 % (start 85: p90
15 → 38 ms, one spurious move); CyborgNinja's moves 2 → 4 (start 40: 100 → 93.4 %). The plan's stop line — "any track §59 wins
and the tongue loses" — is met three times. **`LAT_SRC` stays `'low'`.** What the knob is kept for: a track whose kicks fool the
low-band ratio but lock the Ω = 1 oscillator; none of the five is one. WhoLikesToParty is identical under both.

Commit: `assets/engine/clock/clock.js` (the knob, 6 lines of decision), `tongues.js` (`latMid` / `latMidConf`, unpublished),
`tools/tongues-cold.js`. The default's behaviour is bit-identical to `de64fa5` (the `'low'` branch is the same line; the cold
table's `low` rows re-run after the bank's cost cut are identical to the first run's, row for row).

## §77 the build detector's third arming path — the beat the music is not committing to (2026-10-01, one worker; `docs/plans/TONGUES-PLAN.md` phase 3; the user's approval of the plan)

Commit `a761b43` (the path, the node / replay tools, nine `test_build.js` cases), this section plus the plan's table and
OPEN-ITEMS. **Not tagged, not pushed, not deployed.** No audible run.

**What it reads.** §64 left Vienna's first drop with 4.9 beats of lead (the sub void) and §54 / §64 / §66 together found
nothing causal before its second. The tongues (§76) publish the one quantity none of the detector's inputs carried: Vienna's
dream is **22 clock beats of `tongueAmbig ≥ 0.9`, 72.0–86.0 s** — the music locks none of the clock's beat family — and no
other track in the set holds 0.8 for four beats (SeeYouDrop's outro holds 7 beats at 0.9). So `engine/build/build.js` gains
a third arm beside the void and the sub void: `tongueOn` 1 and `tongueAmbig ≥ AMB_ARM` (0.9) after `MIN_HIST`, counted in
beats with gaps ≤ 1 beat bridged, **`AMB_HOLD` 8 beats** → armed on the next bar line; the slam is the sub-void's (an on-beat
low onset confirmed by `sub ≥ SUBV_RET ×` its 2 s mean, no `SLAM_AFTER` wait), the ambiguity lifting for more than a beat
releases an ambiguity arm only, `MAX` bars times it out. `feed.js` passes `tongueAmbig` / `tongueOn` from MS; absent, or the
stage off (−1), reads as "not ambiguous", so every caller before §77 is unchanged. **The one bug the receipt caught**: the
bass / hp void's "gone for a beat" branch disarmed any arm that was not the sub void's — it fired every beat of a groove and
killed an ambiguity arm within a beat (the replay showed Vienna flapping 78 → 79 → 80 s at 0.24 / 0.03 / 0.87); it now
spares `am` as it spared `sv`, and `test_build.js` asserts the arm HOLDS while the ambiguity lasts.

**Node, `&map=0`, det, the §64 table re-taken** (`build-node.js` with the bank attached to its clock, `build-replay.js`; drops
in order SeeYouDrop 1 2 · WhoLikesToParty 1 2 3 · Malicious · Vienna 1 2):

| rule | path off (`AMB_ARM=0`) | path on (0.9 / 8) |
|---|---|---|
| `buildLive>=0.4` anticipation, beats | 15.9 7.9 · 11.0 7.0 11.0 · 0 · **4.4 0** | 15.9 7.9 · 11.0 7.0 11.0 · 0 · **12.2 0** |
| `dropLiveEvt` lag ms | −6 +21 · +10 +48 +12 · — · −3 — | −6 +21 · +10 +48 +12 · — · −3 — |
| armed at drop · events · armed % | 6/8 · 6 · 4.1 | 6/8 · 6 · 4.8 |
| false arms / min drop tracks · **CyborgNinja** · false events | 0.14 · **0** · 0 | 0.14 · **0** · 0 |

The replayed traces for SeeYouDrop, WhoLikesToParty, Malicious and CyborgNinja are **md5-identical with the path on and off,
and identical to §64's own hashes** (`d61565e3` / `498acde0` / `cb8e2724` / `54759f6d`): only Vienna moves (`d0793af7` →
`5064fb54`). Sweep: `AMB_ARM` 0.85 or `AMB_HOLD` 6 → one false arm (SeeYouDrop's outro, 0.14 → 0.22 / min); 0.95 → Vienna back
to 4.4 (the dream's depth hovers at 0.05); `AMB_HOLD` 12 → 8.3. **0.9 / 8 is the one setting that buys the lead and changes
nothing else.**

**Page, `&map=0&lead=0`, whole tracks** (`filetrace.js`, `WARM=0`, graded by `dropcheck.py`): **Vienna armed 8.9 beats before
drop 1** (79.38 → 85.33 s; §64: 4.9), `dropLiveEvt` **−3 ms**, 0 false arms / min over 3.2 min, 1 event, **drop 2: 0 beats** —
the plan claimed nothing there and the engine confirms it (`tongueAmbig` 0.53–0.77 through 100–108 s, a groove). The page
reads 8.9 where the replay reads 12.2 because the bass void (71.4–74.4 s on the page) disarms first and the detector re-arms
only once that void has been gone a bar (77.1 s) and on the next BAR line (79.38 — the lines fall at 76.7 / 79.4 on the
page's clock, which is the PCM clock; node's build stage rides v3's), so the ambiguity's 8 beats (ready at 77.3) wait for the
bar. **CyborgNinja: 0 arms, 0 events, 0.00 / min over 3.0 min** — the hard gate. The page's ambiguity run is 72.0–86.7 s
against node's 72.0–86.0.

### Proofs

`node tools/check.js` 0 fail · `npm test` OK, `test_build.js` **38 pass** (nine new: a 6-beat run does not arm; 7 bars of
1.0 arm on a bar line with the bass AND the sub in, and the arm holds; the kicks under it never fire; the sub at `SUBV_RET ×`
fires once and disarms; 120 s of a dense train at 0.32 never arms; the ambiguity gone for a beat releases; `tongueOn` −1 /
`AMB_ARM` 0 / no field are inert) · the four controls' replays md5-identical on / off (above) · the s1 fake-timeline md5
cannot move (the build stage returns early on `fakeOn`; no scene edit in this commit).

## §78 DUST: the double time ACCENTS, it does not drive — the nudge's amplitude on the tongue ladder's rise (2026-10-01, one worker; `docs/plans/TONGUES-PLAN.md` phase 4; the user at Vienna 1:25 since §61: "the double time should be accenting rather than driving")

Commit `c849b38` (grid.js, index.js, help.js; plus one engine line in `clock/tongues.js` the receipt forced — below), this
section plus the plan's table and OPEN-ITEMS. **Not tagged, not pushed, not deployed.** No audible run; the A/B is the
user's, stream mode, the watch-list at the end.

### The lever, and the lean

§66 measured and rejected an 8th-note NUDGE: CyborgNinja's 16th hats fire the same gate at 5.33 crests/s. The nudge stays on
the beat. What the tongues add (§76) is the 8th / 16th tongue DEPTHS, `tongue21` / `tongue41` — and the level alone cannot be
the lever either, because **CyborgNinja's `tongue21` sits at 0.61 for the whole track and Vienna's groove reads 0.46**: by level
the control would be accented harder than the headline. What separates them is a **CHANGE over bars**: the 16-beat window's
depth 16 beats ago against now. CyborgNinja's never rises more than **0.13** (`tongue41` 0.13) from the cold start to the end;
Vienna's rises **0.00 → 0.52** over 87–101 s as the double time arrives after drop 1, and 0.15–0.30 over 27–39 s as the hats the
user heard at 0:25 come in; SeeYouDrop's rise at every return (up to 0.51); WhoLikesToParty's 0.14 / 0.31 and Malicious's
0.16 / 0.26 on a few bars. So, `assets/scenes/dust/grid.js`: at the beat line, `rise = max(tongue21, tongue41) − the same 16
beats ago` (a ring per step), `acc = 0 under ACC.LO 0.15, 1 at ACC.HI 0.45`, and the step is `STEP · (1 + DOWN·isDown + ACC.K
0.25 · acc)` — **the accent's AMPLITUDE, the way DOWN already treats the downbeat: a bigger crest on the same beat, never a
faster one.** The ring resets whenever `tongueOn` is not 1, so a warming gap cannot read as a rise, and `tongueOn` −1
(`&tongues=0`) is §66's step bit for bit. `hooks.dinfo()` gains `nacc`; the scene's `feats` gain `tongue21` / `tongue41` /
`tongueOn` with `help.feats` lines. Not touched: the hat voice's gain (the second lever the brief allowed) — one lever, one
receipt; it is open.

**The engine line the receipt forced (`clock/tongues.js`).** The first `dust-trace.js` run (WARM 8, the engine cold at 12 s)
put two accented bars on CyborgNinja at 26–27 s (acc 0.78 → 0.13) where the whole-track rise never passes 0.13: the bank's
drive normaliser was an EMA started from 1e-6, 1.6× too small 8 s in, so the first windows after a cold start read 0.2 too
deep (`tongue21` 0.67 → 0.88 → 0.73 over 20–30 s) and the FALL back read as a rise 16 beats later. The normaliser is now the
running MEAN of the novelty until `EMA_TAU` has passed and the EMA after (the same memory): the §76 table re-taken moves no
mid-band median by more than 0.014 (Malicious 0.359 → 0.345; SeeYouDrop's low band 0.172 → 0.156, nearer the probe's 0.116),
the 1:1 click train's width 0.50 → 0.44 oct (theory 0.46), §77's replay hashes are unchanged to the byte, and CyborgNinja's
cold-start rise is 0.13. The §76 proofs below were re-taken on it.

### The ruler (`tools/dust-trace.js`, DUST forced, `&map=0`, the engine started at 0:00 — `WARM = t0` — in two worktrees: HEAD `67d98c1` and this; `tools/work/v78/nudge78.py`, the §61 / §66 grader on the trace's own `d_spin` plus the step per bar)

| window (clock) | peak @ | floor / peak | dead | 25 / 50 / 90 % | max \|a\| p50 / p99 | step / STEP mean (max) | bars accented (acc max) | hat fires |
|---|---|---|---|---|---|---|---|---|
| **Vienna 80–110** (90.1) before | −8.3 ms | 16.4 % | 0.0 % | +0 / +317 / +767 | 16.3 / 49.2 | 1.130 (1.146) | 0 / 12 | 87 |
| after | −8.3 ms | 14.5 % | 0.0 % | +0 / +317 / +767 | 16.9 / 49.8 | **1.223 (1.395)** | **7 / 12 (1.00)** | 87 |
| **Vienna 24–60** (90.0) before | +8.3 ms | 17.2 % | 0.0 % | +0 / +308 / +767 | 11.7 / 19.1 | 1.119 (1.144) | 0 / 14 | 95 |
| after | +8.3 ms | 16.7 % | 0.0 % | +0 / +317 / +767 | 12.4 / 19.8 | 1.138 (1.219) | **6 / 14 (0.37)** | 95 |
| SeeYouDrop 20–110 (150.0) before | −8.3 ms | 17.5 % | 0.0 % | +0 / +200 / +467 | 17.4 / 35.9 | 1.123 (1.219) | 0 / 57 | 351 |
| after | −8.3 ms | 16.7 % | 0.0 % | +0 / +200 / +467 | 17.6 / 36.7 | 1.153 (1.353) | 28 / 57 (0.91) | 351 |
| **CyborgNinja 20–80** (160.0) before | −8.3 ms | 18.4 % | 0.0 % | +0 / +183 / +433 | 15.6 / 23.9 | 1.123 (1.217) | 0 / 41 | 454 |
| after | −8.3 ms | 18.4 % | 0.0 % | +0 / +183 / +433 | 15.6 / 23.9 | 1.123 (1.217) | **0 / 41 (0.00)** | 454 |

The §61 / §66 metrics hold on every window: the crest peaks at the same frame (±8.3 ms), the dead time stays 0, the 25 / 50 /
90 % completion times are the frame they were, the velocity floor is unchanged (0.165–0.236 rad/s) and the floor / peak ratio
moves only where the peak does (16.4 → 14.5 % on Vienna 80–110, inside §66's 12.3–17 % band); the jerk's p99 moves ≤ 0.8
rad/s² (Vienna 80–110's 49 is the drop's own re-seat, before and after). The hat fires are identical on all four windows
(flashes/s unchanged). **CyborgNinja is identical to the digit** — every metric, every bar, the luminance columns. Vienna's
accent, per bar on the page: 1:27 0.07 · **1:30 0.93 · 1:32 1.00 · 1:35 1.00 · 1:38 0.90 · 1:40 0.45** · 1:43 0.00 — the step
reads 1.25× on the ordinary beats and 1.75× on the downbeats through 1:30–1:38 and is back to §66's by 1:43; **nothing moves
at drop 2 (1:46.7)**, where the ladder's depth does not change. Luminance: Vienna 80–110 p05 / p50 / p95 44.5 / 129.9 / 188.1
→ 48.2 / 127.6 / 188.6, |Δlum| p50 1.29 → 1.29 — the accent is motion, not light.

### Proofs

- `node tools/check.js` 0 fail (help.feats gaps 0; grid.js 302 lines, index.js 343 — under the soft cap) · `npm test` OK
  (`test_tongues.js`'s `tongueK` case loosened to one bank step: the warm normaliser reads 0.956 where the cold one's 1.6×
  drive read 1.00 against a theory of 1.00 at infinite resolution).
- **s1 fake-timeline md5 UNCHANGED with the tongues on AND under `&tongues=0`: f360 `d16d35f7`, f840 `57a9c49c`** (= HEAD's
  `base76` lines). The mirror's `tongue21` / `tongue41` are constants (0.5 / 0.4) in every phase of the loop, so the rise is 0
  and the accent never fires there — the mirror that keeps the timeline an md5 reference, as §76 planned.
- `CARD.bench(1, 300)` / `bench(0, 300)` interleaved, q pinned 0.95, three pairs: this tree **DUST 1.03 / 0.79 / 0.81 ms
  against NAV 1.94 / 2.00 / 1.95** (ratio 0.42); the base worktree DUST 1.32 / 1.20 / 1.22 against NAV 1.96 / 1.94 / 1.94
  (0.63) — the scene's new work is two ring writes and a max per beat; the difference is the machine's drift between the two
  pages, not a cost.
- Page = node on the warm normaliser (SeeYouDrop 0–60 s, the twelve fields): see the line appended to §76's proofs.

### The user's A/B, stream mode, in track time (old = `releases/retinarave-v0.26.html` from `file://`, new = `http://127.0.0.1:8765/`, key `2` for DUST, `&tongues=0` on the new page = the exact before)

- **Vienna 1:25 → 1:43.** At the drop the nudge is §66's; over the next bar the double-time layer fills the 16-beat window and
  from **1:30 to 1:38 every beat's crest is a quarter bigger** (the downbeat's 1.75× instead of 1.5×), fading through 1:40 and
  gone by 1:43. The RATE of crests does not change (1.50 /s — one per beat), the hats flash exactly as before. Look for a
  heavier swing of the whole cloud on each beat, not a faster one.
- **Vienna 1:40–1:50.** The accent is fading (0.45 at 1:40) and is 0 before drop 2 at 1:46.7: this change does nothing there,
  by measurement (the ladder's depth is flat across that drop). If 1:46.7 wants an accent it is a different field.
- **Vienna 0:27–0:40.** The hats' arrival the user heard at 0:25 reads as a rise of 0.15–0.30: a smaller accent (0.26–0.37,
  the step 1.07–1.09×) on four bars. Subtle by design — it is under the dead zone's knee.
- **SeeYouDrop** 0:23–0:28, 0:34–0:39, 0:41–0:48 (0.91 at the return after breakdown 1), 1:28–1:33: the same accent at its
  returns.
- **CyborgNinja, anywhere:** nothing. Identical to the digit — the control the brief named.
- **WhoLikesToParty / Malicious:** a few bars at 0.1–0.5 (their 16th-note depth rises at 0:50–0:55 and 2:03–2:10 on
  WhoLikesToParty; 1:40–1:45, 2:51–2:56 on Malicious) — not graded here, named so the eye is not surprised.

**v0.27 tagged AND DEPLOYED (2026-10-02) on the user's word ("tag and deploy; what i've seen so far is beautiful"):** v0.26 + §75
(the sub gate's cold start), §76–§78 (the Arnold tongues: shadow stage, the clock knob built and left off, the ambiguity arming
path, DUST's accent amplitude). First push to `main` since v0.15 (128 commits, v0.16–v0.27). Pre-deploy: `tools/accept.sh`
(ACC=v0.27, first run since v0.14): check 0 fail, all 11 scenes `errs [] bad []` on `#test`, monitor 60 s 0 violations, route /
manual / param smokes 0 fail; the FAIL lines are stale md5 references (s6 POLYTOPE moved at §63/§67 as recorded, NAV2 stills and the
`mixs` 0→3 route moved with the scenes) plus one script bug — node now colours `util.inspect`, so the params block parsed
`\e[33m0.4\e[39m` as a number (`FORCE_COLOR=0 NO_COLOR=1` added; the routes themselves verified: PROUTE.n 1, width 0.4 vs 1.8).
Landing tiles regenerated (`tools/thumbs.sh`: dust / feigen / mandala / polytope / torus2 moved, nav / maxwell byte-identical);
`site/` copy has no version text. `releases/retinarave-v0.27.html` (1522 KB, 161 modules; `file://` smoke on scenes 1 and 3:
errs [], nonFinite [], clock pcm), package.json 0.27.0.
