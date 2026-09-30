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

## The audible capture run (orchestrator, after the worker) — see DECISIONS §57 addendum

SeeYouDrop 40 → 112 s, `&sync=27`, DUST forced: drop 2 `dropLiveEvt` +85 ms in listener time, `buildLive` 2.78 s before; drop 1
missed on warm-up (17.6 s from a 40 s start — not the scene). The one retune it bought: `FRESH` 0.04 → 0.06 in `voices.js`, because
on the capture path the engine's age at every level edge sits one heard-time step later (40–60 ms) than on det, and at 0.04 every
snare / hat voice and a third of the kick voices were placed on their frame, ~45 ms late. s1 md5 unchanged.

---

# Pass 1.5 — a grain's band is its place, and the accuracy review (2026-09-30, the same worker)

The user's look at the pass-1 A/B, verbatim: *"Overall it is looking good, but something still feels out of sync.
Visuals almost seem slow to register on the beat."* Two tasks — open item 1 above, then every place DUST's picture
could be later than its sound, in ms. Commits `fc590c0` (task A) and `b93ef4f` (task B). DECISIONS **§58**.
**Not tagged, not pushed, not deployed.**

## The ruler, extended

- `tools/dust-trace.js` now records a fourth zone per frame, **`lumM`** — the 25–55 % BODY annulus between `lumC`
  (< 20 %) and `lumR` (60–90 %), which is where the snare's ring travels.
- DUST has a test hook **`&form=<k>`** (`hooks.form`): the formation is pinned, so one shape can be measured at a
  time. SeeYouDrop spends 76 of 90 s in the galaxy, so without it three of the four shapes have no hits to measure.
- `hooks.dinfo()` gained `form` (the settled formation, −1 while a pour is running).
- **The grading moved from the detectors to the TRUTH.** `tools/truth/SeeYouDrop.json onsets.{low,mid,high}` and
  `beats` are the reference for every lag and every coverage number below (`tools/work/d15/an6.py`, scratch), because
  a detector cannot be its own ruler — which is exactly the mistake §57's "+101 ms" line made.

## Task A — a grain's band is its place (`fc590c0`)

`h.x`, the rank of the bin a grain owns, is uniform on 0..1 and `fx` (the bin) is a monotone function of it, so the
rank is the one coordinate all four shapes can share. Each shape turns it into a radius the way its own **dimension**
keeps its density even:

| shape | rank → radius | why |
|---|---|---|
| galaxy | `sqrt(rank)·1.7 + .05` — **unchanged** | uniform per unit AREA; the shape the brief said to match |
| sphere | `1.05·(.05 + .95·cbrt(rank))` | uniform per unit VOLUME — a ball whose nucleus is the bass |
| ribbon | `±(.02 + .98·rank)·1.9` | uniform per unit LENGTH; the wave is sampled where the grain is, so it is still the waveform |
| torus | tube angle `v = ±π(1 − rank)` | the tube is flat in `v` already: lows on the inner wall (R − r), highs on the outer (R + r) |

Two faults that only existed once a band meant a place — both found from the shader's own geometry, both fixed here:

1. **The snare's ring was launched at the ORIGIN.** A front expanding from nothing reaches a shell at r0 only after
   r0 / 3.4 s. From the shader's own visibility condition (`|R − ringR| < 0.83·ringW`) that is **0.24 s in the sphere,
   0.21 s in the torus** — and it was already true of the OLD sphere, a hollow shell at 1.05, so this was a latent
   pass-1 bug, not a new one. The ring is now launched ON the band (`MIDR = 0.89 / 1.21 / 1.36 / 1.14`, mixed through
   a pour) and travels out from there: **0 ms in all four shapes.** Measured on the real sequence, the body's
   luminance clears +2sd at p90 **161.7 → 119.7 ms** after the truth onset.
2. **The kick's shove was a fixed half a unit** — most of the core's own radius, so a kick emptied the core out of the
   middle of the frame. Now `.5·(.3 + .7R)`: the core swells instead of evacuating.

Measured with the formation pinned, SeeYouDrop 30–60 s, **clean hits only** (no other voice within 100 ms: 20 kicks,
10 hats; the snare never fires alone on this track, so its rows are all hits), peak lift as % of that zone's own
pre-hit level:

| | before | after |
|---|---|---|
| sphere, kick centre / rim | +5.3 % / +3.9 % (C/R 1.36) | **+4.9 % / +2.6 % (C/R 1.91)** |
| torus, hat centre share / body share | 27.3 % / 29.0 % | **15.6 % / 46.9 %** |
| ribbon, hat rim share | 51.8 % | **61.7 %** |
| ribbon, kick centre lift | +7.6 % | **+8.4 %** |
| galaxy, kick C/R · hat rim share | 1.44 · 89.6 % | 1.39 · 88.6 % (unchanged by design) |

**Stated, not hidden.** The torus's KICK moves from the centre to the body and rim (C share 35.6 → 23.1 %): a
doughnut's "inward" is the inner wall of its tube, at 31 % of the frame — its centre is a hole and nothing can be
there. And a ball's shell projects onto the whole disc, so the sphere's separation is real in three dimensions and
diluted in two. Both are properties of the shapes, not of the mapping.

Aggregates over the real sequence (SeeYouDrop 20–110 s, nothing pinned): per-beat peak/trough lum 1.189 → 1.209,
centre 1.284 → 1.307, rim 1.231 → 1.266; the window's range p95/p05 lum 2.80 → 2.86, centre 3.70 → 4.14, rim 2.82 →
3.14; |Δlum| p50 1.11 → 1.17; the shape sequence identical (10 changes). Cost flat: DUST 1.131 → 1.112 ms.

## Task B — the accuracy review (`b93ef4f`)

| lag source | was | now |
|---|---|---|
| the beat nudge, 50 % of the step | 167 ms | **50 ms** |
| the beat nudge, 90 % of the step | 417 ms | **183 ms** |
| of the step done when the next beat arrives (400 ms) | 84 % | **98 %** |
| the snare's voice, coverage of the truth's mid onsets | 54 % | **85 %** |
| the snare's envelope after the truth onset, p50 / p90 | +7.0 / +196 ms | +9.0 / **+128 ms** |
| the hat's voice, coverage | 85 % | **96 %** |
| the hat's envelope, p50 / p90 | +8.0 / +87 ms | +7.0 / **+79 ms** |
| the kick's voice, coverage · envelope p50 | 85 % · +15.7 ms | 85 % · +15.7 ms (`kick2` IS the ears' low lane) |
| the snare's ring reaching the body (sphere) | 240 ms | **0 ms** (task A) |
| the picture's per-beat peak/trough (whole / rim) | 1.189 / 1.231 | **1.319 / 1.400** |

### 1. The nudge is a shaped impulse, not one ease

τ 0.22 s put the peak VELOCITY on the beat and half the step on the screen 167 ms later; 90 % took 417 ms, longer
than the 400 ms beat, so the cloud was always still travelling and the eye read a glide. Now **τ 0.055 s** until less
than 18 % of the step is left, then **τ 0.14 s** to settle — fast attack, slow tail, which is what keeps it from
reading as a mechanical snap. The picture is now STILL between the nudges: spin velocity p50 **0.486 → 0.121 rad/s**
while its p95 goes **1.059 → 2.854**. The target is still read off the beat COUNT, so it cannot drift, and the
downbeat is still worth half a step more.

TORUS2, for the record, eases at τ 0.3 s — slower than DUST ever was — but carries an instantaneous
`BOUNCE·cos⁴(2π·beatPhase)` camera thump on top, which is a zero-latency beat channel DUST has none of. That is the
real reason the user's favourite reads as on the beat. DUST's answer here is to make the one channel it has land fast
rather than to add a second; a beat bounce is a look decision for the user, not this task's.

### 2. The attack fires on whichever detector hears the hit first — and this corrects §57

**§57's "+101 ms" was never a lag.** Graded against the truth by `tools/truth/drumcheck.py` on the same window, the
hits each source MATCHES are on time:

| | ears (`*Evt`) | v2 (`kick2` / `snare2` / `hat2`) |
|---|---|---|
| kick vs `low` | P 0.87 R 0.35 · lag med **+3 ms** | P 0.74 R 0.50 · **+4 ms** |
| snare vs `mid` | P 0.68 R **0.71** · **+0 ms** | P 0.93 R 0.50 · **−13 ms** |
| hat vs `high` | P 0.68 R **0.82** · **+2 ms** | P 0.79 R 0.70 · **−11 ms** |

They do not disagree about WHEN; they disagree about WHICH. §57 measured "the age at the level's edge" and read the
LAST ears' snare — usually a different onset, one 16th earlier — as the same hit. So the fix is the union, for
coverage, not for milliseconds: fire on `kickEvt`/`snareEvt`/`hatEvt` or the level's rising edge, whichever comes
first, with a **60 ms refractory** per voice so one hit can never fire twice (it also kills the level's own chatter:
§57's addendum counted 184 kick edges for 120 logged kicks on the capture path). On the capture path the union is
also genuinely EARLIER — the addendum's 40–60 ms band.

**The event places the hit; the level sizes it.** The ears' velocity saturates (§51: `kickVel` p50 1.0, "the uniform
brightness of the predicted route"), so `*Vel` is deliberately not read: a fire starts at the voice's floor and the
level's own edge raises the amplitude when it arrives, without moving the age. A hit the level never confirms stays
small — a false positive costs a flicker, not a flash, which is what keeps "nothing moves without an audible reason"
honest while recall goes up. Attacks per 90 s: kick 261 → 261, snare 152 → **319** (against 297 truth mid onsets),
hat 250 → **379** (against 295 truth high) — the snare now matches the truth's own density, the hat fires 1.28× it.

### 3. The trail

`post.fb.decay` 0.95 → **0.88**. 0.95 is a 0.22 s half-life on the encoded picture (the chain squares it into linear,
but the eye reads the encoded one), most of a beat at 150 BPM: the last hit's ghost was still a third of its size
when the next one landed. Swept on SeeYouDrop 30–60 s with `&post=dust.fb.decay=<d>` (no code change, same build):

| decay | per-beat peak/trough (whole / rim) | \|Δlum\| p50 | mean lum |
|---|---|---|---|
| 0.95 | 1.261 / 1.323 | 1.40 | 117.4 |
| **0.88** | **1.431 / 1.545** | **1.72** | 96.1 |
| 0.85 (TORUS2's) | 1.470 / 1.575 | 1.74 | 91.9 |

### 4. Everything else, measured and left alone

All twenty `m.*` copies in `index.js` are **direct assignments** — there is no EMA anywhere between MS and a uniform.
`this.rt.time = MS.flow` is musical time. The voices' ATTACK is instant; only their decay has a τ (0.24 / 0.30 /
0.09 s). The slow envelopes are slow on purpose and all have instant attacks on their events: `buildLive` 0.35 s, the
last bar's wind-up 0.12 s, the sub's gate 0.28 s and swell 0.5 s, the drop's release 0.55 s. The fibre rings read
`build` / `drop` / `rel` / `vk` with no filter of their own. The camera's dolly rides `bassS`, an engine band
follower, and the formation cross-fade takes 0.6–2 s by design. Upstream, the spectrum texture every grain is pushed
by is **peak-hold with a 0.11 s release and an instant attack** (`synapse/analyzer.js`), so nothing is smoothed on the
way in either.

### The one number that got worse

The drop's slam, measured as the mean of the 0.66 s before against the peak of the 0.66 s after: drop 1 **+392.3 →
+383.1 %**, drop 2 **+117.2 → +88.5 %**. A shorter trail accumulates less light over the burst. Kept, because the
window's own dynamic range went UP (p95/p05 lum 2.80 → 3.24, rim 2.82 → 3.71) and the brief's measure is that a
viewer can read the song, not that one frame is bright.

## Engine-side lags — measured here, NOT changed (no engine file touched)

| what | ms | note |
|---|---|---|
| the beat clock vs the truth grid, SeeYouDrop file-det | **−35.7** (p10 −43.3, p90 −28.5) | the det lead net of the 40 ms display lead: the count increments 36 ms BEFORE the audible beat. Harmless while the nudge took 417 ms; now it lands in 183 ms and the eye sees the offset directly. In stream mode `dispNow()` is 0, so this is ~0 and the capture path's +27 ms is the whole of it. |
| the beat clock vs the truth grid, CyborgNinja | **+146.8** (p10 −45.0, p90 +155.1) | locked to the OFF-BEAT for most of the window (159 of 160 beats matched). Every beat-locked motion in every scene is a third of a beat out on that track. A §56 clock item. |
| the display lead in stream mode | **0** (§53) over a capture path measured at 27 ms | the user's own A/B chose it; recorded because it is the largest single number in the chain and it is not a scene's to set. |
| `snare2` / `hat2` release | synapse's **31 ms** confirm delay, unheld in capture | `drums/drums.js`: `hold = max(0, ahead − SYN_DELAY)`, and `ahead` ≤ 0 in capture. |
| the ears' vs synapse's mid/high pickers | — | recall 0.71 vs 0.50 (snare), precision 0.68 vs 0.93. A scene can only take the union, as DUST now does; a better mid picker is an engine job. |

## Proofs

`check` 0 fail · `npm test` OK · `CARD.bench(1,300)` at tier 3 (150k points), q pinned 0.95, first call discarded,
three pairs interleaved with NAV in the same page: DUST/NAV ratio **0.794** (HEAD) → **0.758** (task A) → **0.813**
(task B) — flat inside the run-to-run spread. s1 fake-timeline md5 **f360 `6696c6eb` → `0526245e` → `a73fbe67`,
f840 `01143b8d` → `123033ed` → `35fe02c6`**. Against `tools/accept/v0.14/scene-md5-v014.txt` the only other lines
that differ are the two pre-existing ones (s0-f840, s4-f840, both `22eb969` / §54 addendum 2) and s11, which
post-dates that list; everything else is byte-identical. `help` moved to `assets/scenes/dust/help.js` (index.js was
one line over the 350 soft cap) — data only, not a word changed by the move. No audible run.

## What the user may see beyond the two tasks

- the picture is **~14 % darker** and its trails are much shorter (the decay) — the fibre rings are visible again
  because of it;
- the sphere is a **filled ball** instead of a hollow shell, and every shape is now colour-graded from the core
  outward, because a grain's band is both its hue and its radius;
- the doughnut's tube no longer ROLLS on mid time (a slow breath instead): the roll would have scrambled the band
  ordering around the tube.

Shots for the A/B, one per formation at 40.0 s on SeeYouDrop (`&form=<k>`, `tools/work/d15/`): `before-forms.jpg`
(v0.21) · `final-forms.jpg` (both tasks).
