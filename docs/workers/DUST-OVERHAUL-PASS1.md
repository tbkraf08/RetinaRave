# DUST overhaul, pass 1 — worker report (2026-09-30)

Brief: `DUST-OVERHAUL-SESSION-PROMPT.md` (the user's legibility standard, the four numbered steps). Built in place in
`assets/scenes/dust/`, four commits, each with its own numbers. **Not tagged, not pushed, not deployed.** The A/B for
the user is at the end of this file.

The acceptance standard, verbatim, is the user's: *"a viewer with the sound off should be able to roughly reconstruct
the song's structure … transients sharp, fast-attack/slow-decay … bands map to distinct visual behaviours so
instruments are separable … motion phase-locked to the beat grid … a tension accumulator that visibly tightens during
builds and releases all at once on the drop … preserve dynamic range … nothing moves without an audible reason."*

## The ruler

`tools/filetrace.js` records MS and MS says nothing about what a SCENE did with it; `tools/probe.js` reads the canvas
but needs a real window. So this session built **`tools/dust-trace.js`** (committed, HARNESS section "Scene ruler on a
real track"): it forces the scene on the deterministic file path (`#test&track=<T>&at=<t0−WARM>&map=0&scene=1`,
`CLOCK=1 GPU=1` — the live path on a file), registers its own rAF after the loop's, and records **per frame** the
composited default framebuffer's mean luminance (`lum`, plus the centre 20 % `lumC` and the 60–90 % rim annulus
`lumR` — the split `tools/lum.py` uses on a shot), the named MS fields, and every number of the scene's new
read-only `hooks.dinfo()`. Two runs of a window are bit-identical.

Reference window: **SeeYouDrop 20 → 110 s** (5401 frames), `at` 0 so the live build detector has its 32 s of history
(§54) — the truth grid is 150.03 BPM, bar 1.6 s, drops at **57.606 / 105.596 s**, so the window holds both drops and
the 16 bars before each. Control: **CyborgNinja 20 → 80 s** (no drop). Readers: `tools/work/d/an{,2,3,4}.py`
(scratch, not committed — the numbers below are their output).

Per-beat look montage: `tools/work/d/beatshots.sh` (one shot every 24 frames = one beat at 150 BPM) →
`tools/work/d/syd-d1.jpg`, the 30 beats 50 → 62 s across drop 1. **A montage cannot judge a per-beat motion** — every
motion number below is per frame.

## Step 1 — on the grid (commit `3425e5a`)

Replaced: the cloud's spin (`flow*.17`), the torus's main turn (`flow*.12`) and the galaxy's winding
(`flow*.35/(r+.35)`) — three rates read off the energy-weighted flow clocks, no beat grid anywhere — and the "every
64 kicks, jump 1..3 shapes on" re-pour.

With: one angle in `grid.js`, `spin ← ease((2π/32)·(beatCount + ½·barIndex), τ = 0.22 s)`, the target read off the
COUNTS so it cannot drift; `barIndex = round((beatCount + beatPhase − barPos)/4)` is synapse's own bar line, so the
downbeat is the downbeat and not the count's mod 4. The torus's `u` rides it at ×0.7 and the galaxy's winding at
×0.9 / (r + .35). The flow clocks keep only the slow drift (the per-grain wobble and the ribbon twist on `flowMid`,
the fibre tumble on `flowBass`, the jitter phase on `flow`).

| | before | after |
|---|---|---|
| the grid holds | — (no grid) | **0.2207 rad/beat** over 225 beats against a design 0.2209 — no drift in 90 s |
| it is a nudge, not a spin | — | spin velocity p05 0.192 / p50 0.487 / p95 1.088 rad/s, **peak/mean 2.28** |
| the downbeat is bigger | — | **0.1791 rad** in the 200 ms after the bar line vs **0.1320** on the other three (×1.36) |
| formation changes | one every ~32 s, at a kick count | **16 in 90 s, every one** on a phrase wrap (12), a `barNovelEvt` (2) or a drop (2) |
| lum mean | 109.65 | 134.89 |
| lum between-beat sd | 30.3 % of the mean | 26.7 % |
| corr(lum, lvl) / eS / bassS / highS | 0.469 / 0.407 / 0.356 / 0.093 | **0.592 / 0.601 / 0.558 / 0.431** |

## Step 2 — three transient voices, reactive v2 (commit `5a5f857`)

**Measured before it was designed.** DUST had one drum channel (`kick` scaled and brightened *every* grain, `hat`
made every grain bigger) and no snare at all. The spec pairs `kick2`/`kickAge`, `snare2`/`snareAge`,
`hat2`/`hatAge` — so the first question was whether those pairs are the same onsets. At every rising edge of the
level (≥ 0.18, `drumcheck`'s own rule), the matching age reads:

| pair | p50 | p10 | p90 | edges |
|---|---|---|---|---|
| `kick2` / `kickAge` | **+7 ms** | −4 | 1720 | 224 (4 with no fresh age at all) |
| `snare2` / `snareAge` | **+101 ms** | −3 | 389 | 143 |
| `hat2` / `hatAge` | **+92 ms** | −5 | 395 | 261 |

The v2 kick IS the ears' low lane (§51) and agrees to within a frame; the v2 snare and hat are synapse's, and the
ears' snare / hat come from a different picker. **So each voice keeps its own age** (`voices.js`): the level's rising
edge resets it, and the engine's age seeds it only when that age is within 40 ms of the edge — the sub-frame
placement where it is real, never a motion started 100 ms late. `max(amp·e^(−age/τ), lvl)` underneath is the safety
net. τ = 0.24 / 0.30 / 0.09 s, all longer than the level's own decay, which is what "slow decay" means.

The three are separated by the **band a grain owns** (CONTRACTS §1.18, one musical element → one visual channel):
`wLow` (fx < .34) takes the kick's outward shove and the sub's swell, `wMid` (a gaussian at fx .46) takes the NEW
voice — a flash ring launched at the centre on every snare, travelling out at 3.4 units/s and widening as it goes,
placed by the snare's age — and `wHigh` (fx > .52) takes the hat sparkle. `subNoteEvt` swells the core, `subGate` 0
lets it go entirely.

| | before | after |
|---|---|---|
| kick2 peak luminance lift at the hit (223 hits) | +6.1 (p90 +15.4) | **+9.5 (p90 +26.3)** |
| snare2 (143 hits) | +8.1 (p90 +19.5) | **+11.0 (p90 +28.5)** |
| hat2 (260 hits) | +4.3 (p90 +14.8) | **+8.3 (p90 +25.0)** |
| the picture's own motion, \|Δlum\| per frame | p50 0.79 · p90 2.58 · p99 6.08 | **p50 1.34 · p90 4.04 · p99 11.22** |
| \|Δlum<sub>rim</sub>\| (where the hats are) | p50 0.97 · p99 8.93 | **p50 1.61 · p99 14.99** |
| lum within-beat sd | 4.7 % of the mean | 5.6 % |
| corr(lum, kick2) | **−0.12** | +0.07 |

A first cut was measured and rejected as too timid (kick lift +7.1, hat +7.1): the coefficients above are the second
cut (brightness ×1.5 / ×4.0 / ×1.8 for kick / ring / spark, sizes ×1.0 / ×3.0 / ×2.2, the mid band widened .21 → .24).

## Step 3 — real tension (commit `9bc2b3c`)

Replaced: `tension` — v3's **roughness**, how dissonant the music is — shrinking the whole cloud by up to 20 % and
pulling the fibre rings in by up to 30 %. On SeeYouDrop it sits at 0.42 through the groove, so the cloud was
permanently ~8 % small for nothing a listener can hear, and it did not move into a drop at all.

With: `buildLive` (§54, the void — the bass pulled out for a bar or more). It arms **5.6 s before drop 1**
(52.0 → 57.6, reaching 1.00) and **3.2 s before drop 2** (102.4 → 105.6, reaching 0.75), and **never on
CyborgNinja**. `uBuild.x` pulls the cloud in −30 %, thins the torus's tube from `.38 + .2·bassS` to a .06 wire, draws
the fibre rings in 32 %, and drains the palette (`LOOK.mood.sat × (1 − .55b)`, spread × (1 − .35b) — the rings share
the mood object, so they drain with the grains). `dropLiveEvt` sets `uBuild.y` to 1 and it decays over 0.55 s:
everything lets go at once with a +17 % overshoot, and the fling on `dropEnv` is untouched. `tension` is jitter and
nothing else.

**`nextDropIn` was measured before it was used, and it is not a long runway**: while armed it never points further
than one bar ahead (1.56 s at the arm, 529 armed frames over the two drops), because it is the count-down to the next
bar line the detector expects the drop on. So it winds the **last bar** up (+0.3 of the contraction over 1.7 s) and
claims nothing more.

| drop 1 (57.606) | before | after |
|---|---|---|
| contraction (scene) | 0 always | 0.00 groove → **0.85** void (peak 1.25 with the wind-up) → 0.09 after |
| palette saturation | 0.66 throughout | 0.66 groove → **0.34** void → 0.71 after (a 48 % drain, restored) |
| lum<sub>C</sub>/lum<sub>R</sub> (how far in the light has drawn) | 1.044 / 0.941 / 1.279 | 0.918 / **1.010** / 1.177 |
| the slam (lum in the void's last 0.66 s → the peak 0.66 s after) | 85.4 → 232.0 = **+171.7 %** | 74.0 → 208.4 = **+181.9 %** |
| lum through the void (first third → last third) | +23.3 % | **+8.1 %** |

| drop 2 (105.596) | before | after |
|---|---|---|
| contraction / saturation | 0 / 0.69 | **0.35** / 0.69 → **0.51** → 0.69 |
| the slam | 70.3 → 189.0 = **+168.9 %** | 80.8 → 237.7 = **+194.2 %** |
| lum through the void | −15.2 % | **−36.6 %** |

Dynamic range over the whole 90 s window: **p95/p05 2.67 → 2.95**.

## Step 4 — formations as sections (commit `fff7569`)

Replaced: the shuffle (`formB = (formB + 1 + floor(h11(nRef)·3)) % 4` every 64 kicks). With, in `formations.js`:

```
buildLive > .35            -> torus    the ring that tightens through the void (step 3)
no sub && denK < 1.6       -> ribbon   a lone voice: the waveform itself and nothing else
eM < .74                   -> sphere   quiet for this track
else                       -> galaxy   the groove
```
asked only on a seam (`grid.js`: a phrase wrap or `barNovelEvt`), so it cannot chatter; a target equal to the shape
already on screen is not a change at all, which is why a phrase line in a steady groove leaves the picture alone. A
RETURN (`barReturnEvt`, or a `sectionAlt` change with `sectionReturn` > .5) pours back into the shape that section
had. The drop bursts the torus into the galaxy — the one change allowed off the seam. No new shapes.

**Two fields were measured and NOT used.** `eM / eMax` is the obvious way to read "low energy" without the track map
and it separates nothing: `eMax` is the loudest `eM` seen *lately* and follows it — over the window the ratio reads
p05 0.700, **p25 0.972, p50 1.000**. `lvl` is worse (the AGC flattens it: a quiet verse is as bright as the drop).
What does separate, per 4 s over SeeYouDrop 0–40 s (an MS-only `filetrace.js` run):

```
t/s      0    4    8   12   16   20   24   28   32   36   40
eM     0.30 0.55 0.68 0.75 0.84 0.88 0.87 0.83 0.83 0.84 0.85
subGate 0.14 0.00 0.00 0.78 1.00 1.00 0.95 1.00 1.00 1.00 1.00
denK   1.47 0.49 1.52 0.46 0.49 0.09 1.59 2.33 1.98 2.24 2.00
```

**The returns say THAT, not WHICH.** `sectionAlt` never repeats on either track (SeeYouDrop 2 → 3 → 4 → 5,
CyborgNinja 1 → 2 → 3) and `sectionReturn` is 0 on every frame of SeeYouDrop while `barReturnEvt` fires twice
(90.35 s, 107.67 s). So the `sectionAlt` key is kept — it is the contract, §1.11 — and the memory falls back to the
last shape filed under a *different* section. On these two tracks it is the fallback that would fire. Recorded in
CONTRACTS §1.11 for the next scene that copies it.

**What the shapes say** (SeeYouDrop 20 → 110 s, `&map=0`):

| t | change | why | what it is in the song |
|---|---|---|---|
| 50.13 | galaxy → ribbon | phrase | the sub leaves: the breakdown |
| 55.95 | ribbon → torus | phrase | the void, the ring tightening |
| **57.60** | torus → galaxy | **drop** | **the drop bursts it** |
| 101.33 | galaxy → ribbon | phrase | the breakdown before drop 2 |
| 104.45 | ribbon → torus | novel | the void |
| **105.60** | torus → galaxy | **drop** | **the drop** |
| 107.67 | galaxy → sphere | novel | after |

**7 changes against 16 at random.** Dwell: galaxy 75.9 s · ribbon 8.9 · torus 2.8 · sphere 2.3 (before, at random:
25.5 / 25.7 / 20.2 / 18.5 — i.e. a quarter of the time in each, which is what "shuffle" looks like).

With the picture no longer churning through a shape a phrase, everything the drop does gets bigger (step 3 → step 4):

| | step 3 | step 4 |
|---|---|---|
| the slam, drop 1 | +181.9 % | **+347.1 %** |
| the slam, drop 2 | +194.2 % | **+234.1 %** |
| lum<sub>C</sub>/lum<sub>R</sub> through drop 1's void | 0.918 groove → 1.010 void | **0.834 → 1.713** |
| kick2 peak lift in the centre | +8.3 (p90 +28.9) | **+10.9 (p90 +50.3)** |
| snare2 | +11.3 (p90 +37.5) | **+14.0 (p90 +50.5)** |
| hat2 | +9.7 (p90 +30.1) | +9.4 (**p90 +44.4**) |
| corr(lum, kick2) | +0.07 | **+0.10** |

**The trade, stated plainly:** whole-frame |Δlum| per frame p50 1.32 → 0.93 and the window's dynamic range p95/p05
2.95 → 2.54. Sixteen pours a minute were themselves a lot of the old motion and a lot of the old range; what is left
is the music's. Pass 2's dynamic-range work (`eM` against the TRACK's peak) is where the range comes back.

**The look** (`tools/work/d/syd-d1.jpg`, 30 beats, 50 → 62 s, one shot a beat): beats 0–11 the ribbon in magenta,
beats 6–14 the colour draining out of it as the void takes hold, beats 15–18 a small tight white core (the torus's
tube down to a wire), beat 19 the slam, beats 21–29 the galaxy, large and green. A montage cannot judge the per-beat
motion — that is what the per-frame numbers above are for — but it can say the sequence reads, and it does.

## The control — CyborgNinja 20 → 80 s (no drop)

The point of a control is that the scene must not *invent* structure. It does not:

| | before | after |
|---|---|---|
| formation changes in 60 s | ~2 (the 64-kick counter, at denK 2.7) | **0** — dwell galaxy 60.0 s |
| `buildLive` armed | never | never (so: no contraction, no drain, no release) |
| kick2 peak lift in the centre | +13.4 (p90 +39.4) = +7.5 % of the pre-level | **+18.7 (p90 +51.6) = +19.6 %** |
| corr(lum, kick2) | 0.035 | **0.241** |
| \|Δlum\| per frame (whole frame / centre) | 1.72 / 2.15 | 1.19 / **2.38** |
| lum between-beat sd | 17.2 % | 15.9 % |

The whole-frame churn goes down and the centre's motion goes up: on a track that is one long groove, everything that
moves is now the drums.

## Cost

`CARD.bench(1, 300)` interleaved with `CARD.bench(0, 300)` (NAV), `Q.q` pinned 0.95 for 9 s first, first call
discarded, three pairs, medians — HARNESS "Bench protocol":

| tier 3, q 0.95 | DUST `bench(1,300)` | NAV `bench(0,300)` | ratio |
|---|---|---|---|
| **before** (the v0.20 scene, the same tree) | 1.327 / 1.181 / 1.167 → **1.181 ms** | 1.931 / 1.795 / 1.750 → **1.795 ms** | 0.658 |
| **after** (all four steps) | 1.156 / 1.023 / 1.009 → **1.023 ms** | 1.802 / 1.821 / 1.821 → **1.821 ms** | **0.562** |

**It got cheaper, by 13 %,** and the reason is the point size, not luck: the old scene's `hat` and `kick` enlarged
*every* grain (`+ uHat·h.y·1.2 + uKick·.5`, and on the fake timeline `hat` is exactly 0.5 and `kick` 1.0), so a hit
was a whole-cloud overdraw event. The new voices enlarge only the grains of their own band — `wHigh` is non-zero for
~28 % of grains and `wLow` for ~43 % — so the same hit costs about half the fill. The shader gained ~12 ALU ops per
vertex and lost a lot of fragments; ALU is not where a 150 k-point cloud spends.

No Q trace was run: the cost did not move outside the noise of the protocol, and the scene's `draw` is the same one
`drawArrays(POINTS)` plus the same fibre pass. The shader gained ~12 ALU ops per vertex and the CPU gained four
envelopes per frame.

## Fake-timeline md5 (`tools/scene-md5.sh`)

Full eleven-scene list (`tools/scene-md5.sh dust-final`, PORT 8880) diffed against
`tools/accept/v0.14/scene-md5-v014.txt`. **Exactly three lines differ, and only one of them is this session's:**

```
s1-f360   c6166af903f80e0693471b5b28e4c6b6  ->  6696c6ebe1199c2c5b0037abf75059cd     THIS SESSION
s1-f840   7ca6598c6a3bfb726641ae3103450a79  ->  01143b8d43eb855612ac17d794df4a37     THIS SESSION
s0-f840   7225ea02adab09c37055b85189ac5d49  ->  8a0715dfb90ecf20d484578932a2f115     pre-existing, DECISIONS §54 addendum 2
s4-f840   be2e3c8d6f2484ef55753e4d5213ef97  ->  05bf21c0ee79e5343a6bd89baa2bd971     pre-existing, the SAME commit (22eb969)
```
s0-f360, s2, s3, s5, s6, s7, s8, s9, s10 and s1's own f360 through step 3 are byte-identical to v0.14.

**s4 is a doc gap, not a regression, and the orchestrator should know:** s4 is NAV's DRUM variant — it renders through
NAV's `draw`, so `22eb969` (NAV's `build` → `buildLive`, `dropEvt` → `dropLiveEvt`) moved its fake-timeline pixels
exactly as it moved s0's. §54 addendum 2 recorded only s0 f840. `git log -- assets/scenes/nav/` has nothing after
`22eb969`, and this session's diff is `assets/scenes/dust/*`, `tools/dust-trace.js` and docs — a scene folder cannot
reach another scene's pixels (HARNESS "What to re-prove").

Per step, for the record: f360 `c6166af9` → `7c824cd1` → `910e95f7` → `6696c6eb` → `6696c6eb` (step 4 does not move
frame 360: the fake timeline has no seam that early) · f840 `7ca6598c` → `479410ba` → `bb1540c6` → `30d06982` →
`01143b8d`.

## Open questions for the orchestrator / the user

1. **A grain's band is not its position in two of the four formations.** `fx` (the bin a grain owns) drives the
   palette, and in the galaxy it happens to be the radius too (`r = sqrt(h.x)`), but in the sphere and the ribbon the
   bands are scattered through the shape. So "the kick shoves the *inner* grains" is true of the *band*, not always of
   the *place*: what you see is a coherent radial jump of one colour family. It reads, and the numbers say so, but a
   band→radius bias would make the three voices spatially separate in every formation. It would change the look of all
   four shapes, so it is not a pass-1 decision — pass 2, or the user's call.
2. **`post.fb.decay` is 0.95, the highest in the set.** The trail is `max(scene, prev·decay)`, so an attack is never
   lost but the fall has a 0.22 s half-life — which is most of a beat at 150 BPM, and it is why the per-hit luminance
   lift is a few percent rather than tens. If the user says the transients still read soft, the first knob is this
   one, not the voices.
3. **The dynamic range went down, on purpose and not entirely.** p95/p05 2.95 (step 3) → 2.54 (step 4) because the
   shuffle's sixteen pours a minute were themselves range. Pass 2's item 1 (`eM` against the TRACK's running peak
   rather than `eMax`, which this session measured as useless: p25 0.972) is where it comes back.
4. **Three thresholds are tuned on two tracks.** `eM < .74` (sphere), `denK < 1.6` with no sub (ribbon),
   `buildLive > .35` (torus) — fitted to SeeYouDrop and checked against CyborgNinja. WhoLikesToParty and Malicious
   were not traced (time); the rule is a pure function in `formations.js` `K`, so a retune is three numbers.
5. **The return path could not be exercised.** `sectionAlt` never repeats and `sectionReturn` stayed 0 on SeeYouDrop,
   so the code path that fires is the fallback (the last shape filed under a different section), twice, on
   `barReturnEvt`. If the user wants returns to be visibly the same shape, the engine needs a key that names WHICH
   material is back — a bar-store question, not a scene one.
6. **`hush` is 0 for the whole window** on SeeYouDrop, so it was not used for the breakdown rule even though its
   Appendix A line says "the silence before a drop" — worth a look at some point.
7. **No audible run was done** (the brief forbids it for the worker): every number here is from the deterministic
   file path. The one audible capture run is the orchestrator's.

## The A/B for the user (stream mode, tab capture)

Two Chrome windows, the same track, key **2** (DUST is scene id 1 = key 2), the same point in the track:

- **A (old, v0.20):** open `releases/retinarave-v0.20.html` from `file://` —
  `file:///home/toma/Documents/Kraftek/RetinaRave/releases/retinarave-v0.20.html`
- **B (new):** the dev server — `http://127.0.0.1:8765/` (the user's own `node tools/serve.js`)

In each: press **2** for DUST, Share a tab, play the track. SeeYouDrop is the reference (drops at **57.6** and
**105.6** s); the things to watch, in track time:

- **every beat** — the cloud, the doughnut and the galaxy arms should *nudge*, not glide, and the first beat of each
  bar should be the bigger nudge
- **the drums** — the kick pushes the low, warm grains out; the snare sends a bright ring out through the middle of
  the cloud (this voice did not exist before); the hats sparkle only at the edge
- **52.0 → 57.6 s and 102.4 → 105.6 s** — the cloud should draw in, the colour drain out, and the doughnut's tube
  thin toward a wire, then let go all at once on the slam
- **50.1 / 55.9 / 57.6 s** — the shape should go breakdown (the waveform ribbon) → build (the tightening doughnut) →
  drop (the galaxy), and the same again at 101.3 / 104.5 / 105.6
- **CyborgNinja** (no drop) should hold one shape for the whole minute and never pretend a build is coming

A look remark is a retune request; the numbers above say which constant each remark lands on.
