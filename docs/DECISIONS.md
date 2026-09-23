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
