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
