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
