# Worker: TORUS2 (v0.7 §36, scene id 7) — 2026-09-24

**Brief:** `docs/workers/brief-torus2.md` (+ `brief-common.md`'s rules and report format). PORT 8798, own worktree
from `ce34cc8`. Model: opus. Eight commits, one per proven step.

**Outcome:** built. `assets/scenes/torus2/` = 7 modules, 1022 lines, plus `tools/test_torus2.js` (127).
`node tools/check.js` 0 fail throughout, the only warning is feigen's pre-existing 351 lines. All eight acceptance
items pass. Scene ids 0–6's reference md5s are byte-identical to `tools/accept/v0.5/scene-md5-v03.txt`; TORUS2's own
f360/f840 md5s are stable across three runs. Bench at tier 3 with `morph` 1 and every wave live: **1.23×–1.45×
TORUS** depending on the statistic, under the 1.5× cap. The oklch colour variant was **not** built (the brief says
last and only if time allows); `colour` declares `v2` alone, which is honest — a declared name a scene cannot render
throws on `&colour=`.

---

## (a) Friction log — every sentence the docs lack, every guess, every lean changed and why

Fifteen items. The five marked **[lean changed]** are the substantive ones.

1. **`arc === 'intro'` does not exist.** Spec 5 says the morph is "pinned to 0 while `arc` is the intro
   (`arc === 'intro'` — check `feats.js` for the enum's values)". `feats.js` line 41: the enum is
   `idle | valley | sustain | build | peak`. Used `arc === 'idle'` — the only value that means nothing has started.
2. **[lean changed] The wave amplitude.** Spec 2's `WAVE` ≈ 6 % of the tube radius is invisible. Shot at 0.06, 0.08
   and 0.14 of the fibre's own radius the pinned-train pair is *pixel-for-pixel indistinguishable* to the eye
   (`t2-zoom4x4.jpg` across the three); an isolation run with the brightness pulse off and the displacement at 0.5
   (`t2-dispon.jpg`) proved the mechanism right and only the scale wrong. 6 % of the fibre radius at this framing is
   a ~5 px kink inside a 144-ring nest. **`WAVE0` is 0.26.** It is one named constant at the top of `index.js` and
   the `wave` parameter's resting value, so it is one number to retune.
3. **[lean changed] Every wave is a displacement *and* a brightness pulse.** Spec 2's own first sentence says so
   ("a displacement normal to the stroke … plus a brightness pulse"), then the per-band list reads as though only
   the snare brightens. Giving only the snare a pulse left the rhythm unreadable; giving all three bands both, with
   the per-band split deciding which dominates (`uWaveD` / `uWaveP`), is what makes the *spacing* of the bumps
   legible, which is the stated point of the whole feature.
4. **The edge threshold.** Spec 2's rising edge is "a level above 0.5 that was below 0.25 last frame". The `#test`
   fake timeline sets `hat` to **exactly 0.5** (measured: max over 300 samples = 0.5 exactly, snare 0.7, kick 1.0),
   so a strict `> 0.5` never fired and the hat band was empty on every headless shot. `HI` is 0.45.
5. **[lean changed] The unwind cannot live on `psi`.** Spec 6 says `psi += UNWIND · riser · t`. `psi` is the fibre's
   own parameter and the fibre *is* that circle — adding phase only runs further round the same circle, so the ring
   overlapped itself by 40 % and looked untouched (first pair of `t2-unwind-*.jpg`). The slip is on the **longitude**
   `phi`, which carries the curve across the family's torus: a (1, 1+k) torus curve, a genuine open helix.
6. **[lean changed] The brief's 3-cell CNN weights are not chaotic.** `[[1.24, −3.2, 3.2], [3.2, 1.1, −4.4],
   [−3.2, 4.4, 1]]` settles onto a cycle from every initial condition tried (box 1.33–1.60, largest Lyapunov
   exponent −0.0013 … +0.0066). The standard three-cell template — off-diagonals `[[p₁, −s, −s], [−s, p₂, −r],
   [−s, r, p₃]]`, p = (1.24, 1.1, 1.0), r = 4.4, s = 3.21 — gives λ ≈ 0.118 from every initial condition. Measured,
   not assumed: `tools/test_torus2.js` reports the exponent and fails below 0.005.
7. **[lean changed] Major warm / minor cool needs the spread narrowed and centred.** Spec 3 asks for a "hue bias
   added to the anchor". Two separate problems. (i) A fixed offset cannot promise a half of the wheel, because the
   key has already rotated the wheel anywhere — key 7 major would have landed on orange and key 7 minor on
   yellow-green. The anchor is instead **pulled** 45 % of the short way toward WARM 0.02 / COOL 0.55. (ii) TORUS
   spread the twelve families over 0.55–1.25 of a turn and anchored them at the *first* hue, so every frame was a
   full rainbow and no bias could read: the first warm/cool pair was indistinguishable. Spread 0.30–0.75, centred on
   the anchor (`hueT = fam/12 − 0.5`). The second pair is unambiguous.
8. **`ctx.budget('segs')` contradicts itself for a path-B scene.** The brief says "the segment budget through
   `ctx.budget('segs')` stays the cost cap"; CONTRACTS §1.4 says `budget('segs')` is `[2500, 5000, 9000, 16384]` for
   **CPU stroke buffers** and that "per-ring subdivision tables (TORUS's segments per ring …) are geometry, not
   counts, and stay in the scene". TORUS at tier 3 draws 23 040 + knot segments — 1.4× that budget already. Kept
   TORUS's `SEGT` table verbatim and made the growth the *fibre count*, capped at TORUS's own 12 × 12, so TORUS2
   never draws more segments than TORUS does; the cost claim is carried by the bench, not by the budget call.
9. **The spec-2 proof is not legible at the default fibre count.** "The four bumps per ring are evenly spaced in one
   and not in the other" cannot be read in a 144-ring tangle. Added `hooks.fib(n)` — the pin of the drawn slot
   count, which step 4 drives from `build` anyway — and shot the pair at one thread per family.
10. **Two-argument hooks and the hash dispatcher.** `hooks.key(k, mode)` and `hooks.morph(m, which)` take two
    arguments; CONTRACTS §1.4 says a hash hook maps `&name=value`, one value. `harness.js` is not a legal read, so I
    do not know how it would split two. Every hook here is called through
    `CARD.REG[7].scene.hooks.<name>(a, b)` in an `{eval}` instead — which §1.4 names as the way to reach a specific
    scene's hook anyway. **Question for the docs: what does `&morph=0.5,1` do?**
11. **`CARD.goScene(id, hard)` does not beat a sticky `&scene=N`.** HARNESS says `&scene=N` is "sticky"; it does not
    say a `goScene` is ignored. `goScene(3, true)` from a `&scene=7` page left `SC.logical` at 7.
12. **`CARD.bench(id, n)` benches whatever state that scene's last `update()` left.** Benching TORUS from a
    torus2-forced page gave `seg 72` in its HUD — tier 1, 10 368 segments — because its `update` had barely run. The
    bench pairs are therefore two separate page loads, each with its own scene forced, `q` pinned and 9 s of settling,
    compared through their NAV ratios (which is exactly what the "Bench protocol" interleave is for). Worth a line in
    HARNESS: *a bench of a scene that is not on screen measures its last update's state.*
13. **`paramDeps` misses a field behind a short-circuit.** `morph`'s honest expression is
    `arc === 'idle' ? 0 : 0.9·tension`, but on the `MS` defaults `arc` **is** `'idle'`, so the Proxy never saw
    `tension` and the panel's source column would have read "derived: arc". Written as
    `0.9 · tension · (arc === 'idle' ? 0 : 1)` — the same float in every case (a multiply by 1.0 is exact, 0 is 0) —
    and both fields are recorded. Not in §1.16; it should be.
14. **`tools/probe.js` needs a real window** (it registers its own rAF after the loop's and reads the GL canvas
    through a 2-D canvas). The centre/rim luminance of spec 1 is measured from the saved screenshots with PIL
    instead (`tools/work/lum.py`, untracked). Caveat stated honestly: the screenshot is post-composite, so the
    vignette darkens the rim and the ratio is generous — which is why the number that matters below is TORUS's
    centre luminance measured the same way, as the control.
15. **`#test` runs at 124 BPM, not 120.** Spec 4's frame series ("frames 360, 375, … at 120 bpm = every half beat")
    is 0.517 beats per step, so `beatPhase` walks rather than alternating 0 / ½. The table below is still readable.
16. **The final montage is 2 columns, not 3.** The brief asks for 3, but the thing to see is TORUS *beside* TORUS2
    at the same frame, which only happens with one pair per row.

## (b) Temptations — forbidden files I wanted and did not open

- `assets/core/scenes.js` — when `CARD.bench` renders a scene, does it run its `update` first? And why does
  `goScene` lose to `&scene=`? (items 11, 12). Guessed from the HUD readout instead.
- `assets/engine/sources/fake.js` — why `hat` peaks at exactly 0.5, and whether `surpriseEvt` ever fires on the
  24 s loop (it does not; the twist was proven with `CARD.fix` instead).
- `assets/core/harness.js` — how `&hook=value` would pass two arguments (item 10).
- `assets/core/lines.js` — whether `lineCorner` drops a segment on its *input* `w` or its output, for the open-helix
  wrap skip. Used §1.12's sentence ("an endpoint at or behind the camera plane is dropped whole") and passed
  `vec4(0, 0, 0, −1)` as the far endpoint; the shots show the ring opening, so the sentence is right.

None opened.

## (c) Acceptance — the exact lines

**1. `node tools/check.js`**
```
check: 75 modules · uniforms 128 · MS keys 118 · scenes 7 (help.feats gaps 0) · 0 fail · 1 warn
warn assets/scenes/feigen/index.js has 351 lines (soft cap 350)      <- pre-existing, not mine
```

**2. `PORT=8798 GPU=1 node tools/cdp.js 'test&scene=7' …`**
```
EVAL … => "{"errs":[],"bad":[],"scene":7}"          (glerr absent = clean)
shot work/t2-t6 · shot work/t2-t14
```
`t2-t6.jpg` — a lit cyan/violet nest whose interior is full of visible threads rather than fog, with the bright knot
strand looping out to the right. `t2-t14.jpg` — the drop: the nest has collapsed toward its core and bloomed back
white-hot, with a magenta ring thrown out of the right side. Montage `t2-acc2.jpg`.

**3. the house run**
```
EVAL … => "{"errs":[],"bad":[],"q":0.692,"tier":2,"cold":1.610}"
EVAL … => "[1.7013,2.1127]"   [bench(7,300), bench(0,300)]
EVAL … => "[1.5293,2.0980]"
EVAL … => "[1.7117,2.1023]"
```
Three different frames (montage `t2-acc3.jpg`): `t2-h10` a dense pink-and-gold groove nest · `t2-h30` a sparse
violet breakdown of eight or nine wide rings · `t2-h50` a dense magenta/gold nest with a white core. bench at the
adaptive tier 2: s7 median **1.711 ms** against NAV **2.102 ms** (ratio 0.814).

**4.** every proof shot read and described — see "the shots" below.

**5.** the scene object's keys are
`name id tag feats cuts rt hooks score init update draw hud params post colour help`; `feats` is exactly the 40
fields read (listed below), every one has a `help.feats` line (`check.js` reports 0 gaps), `score()` returns 0.

**6. `PORT=8798 tools/scene-md5.sh t2`**
```
diff <(grep -v ' s7-' tools/work/t2-md5.txt | sort -k2) <(sort -k2 tools/accept/v0.5/scene-md5-v03.txt)
=> IDS 0-6 IDENTICAL
```
**TORUS2's own reference md5s (the v0.7 baseline), identical across three separate runs:**
```
7189a6ba6899e1e34d077eddbaaf4de8  s7-f360.jpg
48113eda4d94ff1f48c35b7b29f06a38  s7-f840.jpg
```

**7. bundle + the real start path**
```
bundled 75 modules → dist/retinarave.html (562 KB)
EVAL … => "{"errs":[],"bad":[],"scene":7}"        (key '8' reaches id 7)
```

**8.**
```
node tools/param-smoke.js  => param-smoke: 49 checks, 0 fail
node tools/test_hopf.js    => circle error 2.22e-12 · torus distance 1.67e-13 · min fibre separation 0.0125 ·
                              hopf map error 1.05e-15 · knot on torus 7.77e-16 · (1,1) knot circle error 6.66e-16 · OK
node tools/test_torus2.js  => thomas box 3.82 (extent 4.5) lambda 0.0286 step 0.22884 meanSpeed 1.352
                              cnn box 1.77 (extent 1.8) lambda 0.1184 step 0.01913 meanSpeed 6.469
                              aizawa box 1.85 (extent 1.85) lambda 0.1139 step 0.02489 meanSpeed 5.110
                              halvorsen box 13.32 (extent 10) lambda 0.7534 step 0.00960 meanSpeed 71.648
                              constants GLSL vs twin 0.00e+0 · advect determinism 0 · closure 0 ·
                              max radius 3.723 / 3.840 · TRAVEL 0.55 · steps 8 · OK
```

### The bench (HARNESS "Bench protocol": `q` pinned 0.95, 9 s of settling, cold call discarded, n = 400, five pairs)

Two page loads, each with its own scene forced so that scene's `update` actually runs at tier 3 (friction 12).
TORUS2 is benched with `hooks.morph(1, 0)` — morph 1, every wave live, `seg` 160, 12 slots per family.

| pair | TORUS2 s7 (ms) | NAV (ms) | s7/NAV | | TORUS s3 (ms) | NAV (ms) | s3/NAV |
|---|---|---|---|---|---|---|---|
| 1 | 1.517 | 1.983 | 0.765 | | 1.267 | 2.289 | 0.553 |
| 2 | 1.556 | 1.395 | 1.116 | | 1.419 | 2.366 | 0.600 |
| 3 | 1.467 | 1.783 | 0.823 | | 0.943 | 1.821 | 0.518 |
| 4 | 1.777 | 2.041 | 0.871 | | 1.234 | 1.931 | 0.639 |
| 5 | 1.827 | 1.813 | 1.008 | | 1.417 | 1.884 | 0.752 |
| **median** | **1.556** | **1.812** | **0.871** | | **1.267** | **1.931** | **0.600** |

| statistic | TORUS2 / TORUS | cap |
|---|---|---|
| medians of the raw ms | **1.23×** | 1.5 |
| NAV-normalised (median s / median NAV) | **1.31×** | 1.5 |
| median of the per-pair ratios | **1.45×** | 1.5 |

All three are under the cap; the most conservative is 1.45×. The extra cost is the attractor advection (8 RK2 steps
= 16 field evaluations per point, and `ringPt` evaluates a second point at t + ½ for the wave normal) — i.e. it is
paid only while `morph` > 0.002 and can be halved by dropping `STEPS` to 4, which is one constant.

## (d) Anything wrong in the docs

- CONTRACTS Appendix A / `feats.js`: the `arc` enum has no `'intro'` (friction 1) — the brief's, not the doc's, but
  worth the note.
- CONTRACTS §1.4's `ctx.budget('segs')` vs a path-B scene (friction 8) — the sentence that exempts per-ring
  subdivision tables is there, but the two paragraphs read as contradictory to someone sizing a new scene.
- CONTRACTS §1.16 should say that `from()`'s recorded dependencies are the fields **actually read on the `MS`
  defaults**, so a short-circuiting ternary hides one (friction 13).
- HARNESS "Bench protocol" should say a bench of a scene that is not on screen measures its last `update()`'s state
  (friction 12), and that `&scene=N` outranks `CARD.goScene` (friction 11).
- HARNESS: `tools/scene-md5.sh` does not pass `PORT` through to `cdp.js` of its own accord — it inherits it, which
  is fine, but the usage comment does not say so and the default 8765 would have hit the other checkout.

## (e) The final `feats` (40) and the `post` params

```
chroma harmAngle interval harmUnw beatPhase beatCount bass sub tension dropEvt dropEnv bpm presence flow
flowBass flowMid flowHigh barPos surpriseEvt sectionEvt roll riser intensity arc sectionAlt build arousal
phrase16Pos key mode keyConf valence kick snare hat beat alive novelty hush calm
```
`clarity` and `regularity` are dropped (TORUS read them for its bid; `score()` here returns 0 and reads nothing).
`post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } }` — unchanged from TORUS: the
geometry is its own symmetry, so no kaleidoscope, and long trails suit strokes.
`colour: { default: 'v2', variants: { v2: {} } }` — **the oklch variant is not built.**

---

## The parameters (CONTRACTS §1.16)

| name | eli5 | range | from(MS) | deps | lo → hi |
|---|---|---|---|---|---|
| `turn` | where the nest has been nudged to in its sixteen-beat turn | [0, 6.2832] | `((beatCount/16)·2π) mod 2π` | beatCount | the yaw the ease is chasing; a route can spin the nest freely |
| `bounce` | how hard the nest thumps on the beat | [0, 0.1] | `0.05·max(0, cos(2π·beatPhase))⁴` | beatPhase | 0 = dead still, 0.1 = a 10 % thump |
| `size` | how much of the screen the nest fills | [0.4, 0.9] | `.58 + .1·intensity + .07·arousal + .15·min(1, max(0, 2·build−1))` | intensity, arousal, build | a small nest adrift in an empty frame → filling it edge to edge (`t2-p-size-lo/hi`) |
| `glow` | how brightly the fibres inside are kept lit | [0, 0.5] | `.18·(1 − .4·max(hush, calm))` | hush, calm | 0 = TORUS's dark interior, 0.5 = every fibre near the loudest one's brightness |
| `morph` | how far the rings are pulled out along a strange attractor | [0, 1] | `.9·tension·(arc === 'idle' ? 0 : 1)` | tension, arc | the pure Hopf nest → sheared into a long comet along the CNN field (`t2-p-morph-lo/hi`) |
| `wave` | how deep the bump a kick sends along every thread | [0, 0.4] | `0.26 + 0.1·kick` | kick | 0 = a smooth ring, 0.4 = a ring with four deep lobes travelling round it |

`CARD.paramsOf('torus2')` at f360 = `{turn 4.71238898, bounce 0, size 0.66155941, glow 0.1224, morph 0.17999889,
wave 0.29179588}` — every one finite and inside its range. `paramsOf === derived` for all six: `true`, difference
exactly 0. `&param=torus2.morph=c:1` → `PROUTE.n` 1, value 1 against derived 0.17999889, and the f360 md5 moves
`7189a6ba…` → `3d82a293…`.

`wave`'s range is [0, 0.4] and not the brief's [0, 0.12]: the resting amplitude the step-2 montage forced is 0.26,
and a range that excluded its own derived value would be a lie the panel displays.

## The frame series of step 4 (`hooks.motion()`, `#test`, 124 BPM)

| frame | beatPhase | beatCount | `turn` | `turnT` | `bounce` | `size` | `fib` |
|---|---|---|---|---|---|---|---|
| 360 | 0.400 | 12 | 4.4027 | 4.7124 | 0.0000 | 0.6616 | 6.97 |
| 375 | 0.917 | 12 | 4.5175 | 4.7124 | 0.0281 | 0.6439 | 6.95 |
| 390 | 0.433 | 13 | 4.7195 | 5.1051 | 0.0000 | 0.6351 | 6.91 |
| 405 | 0.950 | 13 | 4.8624 | 5.1051 | 0.0409 | 0.6303 | 6.86 |
| 420 | 0.467 | 14 | 5.0901 | 5.4978 | 0.0000 | 0.6273 | 6.82 |
| 435 | 0.983 | 14 | 5.2412 | 5.4978 | 0.0489 | 0.6251 | 6.77 |
| 450 | 0.500 | 15 | 5.4818 | 5.8905 | 0.0000 | 0.6234 | 6.73 |

`turnT` advances by exactly 2π/16 = 0.392699 per beat and never drifts (it is read off `beatCount`, not
integrated); `turn` lags it and springs — the nudge. The bounce is zero at `beatPhase` ½ and climbs toward 0.05 as
`beatPhase` → 0. `turn` is reported unwrapped: 8.8466 at f690 is 2π + 2.5634 against `turnT` 2.7489.

Growth across the timeline: f180 (`arc` sustain, `build` 0) → 6.84 threads per family, `size` .6585 · f690 (`arc`
build, `build` .78) → 11.95 threads, `size` .7317, camera in · f840 (peak) → back to 6.72. Portrait (MOBILE=1,
390×844, aspect .462): camera distance 11.384 = 5.261 / .462 exactly — the short edge binds and nothing crops
(`t2-portrait.jpg`).

## The attractors — constants, sources, measurements

| # | name | equations | constants | EXT | step h | λ (largest Lyapunov) | box |
|---|---|---|---|---|---|---|---|
| 0 | Thomas | `ẋ = sin y − b x` (cyclic) | b = 0.208 | 4.5 | 0.22884 | 0.0286 | 3.82 |
| 1 | 3-cell CNN | `ẋᵢ = −xᵢ + Σⱼ aᵢⱼ f(xⱼ)`, `f(x) = ½(|x+1| − |x−1|)` | `a = [[1.24, −3.21, −3.21], [−3.21, 1.1, −4.4], [−3.21, 4.4, 1.0]]` | 1.8 | 0.01913 | 0.1184 | 1.77 |
| 2 | Aizawa | `ẋ = (z−b)x − dy`, `ẏ = dx + (z−b)y`, `ż = c + az − z³/3 − (x²+y²)(1+ez) + f z x³` | a .95 b .7 c .6 d 3.5 e .25 f .1 | 1.85 | 0.02489 | 0.1139 | 1.85 |
| 3 | Halvorsen | `ẋ = −a x − 4y − 4z − y²` (cyclic) | a = 1.4 | 10.0 | 0.00960 | 0.7534 | 13.32 |

Sources: Thomas, *Deterministic chaos seen in terms of feedback circuits*, Int. J. Bifurcation and Chaos 9 (1999)
1889 · Arena, Baglio, Fortuna, Manganaro, *Chua's circuit can be generated by CNN cells*, IEEE Trans. Circuits Syst.
I 42(2) (1995) 123–125 — the three-cell template, with the signs corrected as in friction 6 · Aizawa–Uezu, the
constants as circulated by Chaoscope · Halvorsen, the cyclically symmetric attractor.

The step size is not a magic number: `h = TRAVEL · EXT / (STEPS · meanSpeed)` with `TRAVEL` 0.55, `STEPS` 8 and
`meanSpeed` measured on a fixed 7³ lattice at module load — deterministic, the same on every machine. `EXT` is each
attractor's measured half-extent from the long RK4 run in the test.

**Which and how much.** `sectionAlt mod 4` picks (−1 before synapse identifies → 0); a change cross-fades over 1 s
(two fields per frame only while the fade is live, behind a uniform branch, so it is coherent). `morph` is
`0.9 · tension`, eased ~1 s, pinned to 0 while `arc` is `'idle'`. The advection runs in R³ **after** the projection,
never on S³, and is clamped inside 1.6 × the nest radius, so no advected point can reach the projection pole.

## The shots (all in `tools/work/`, untracked)

| file | what it shows |
|---|---|
| `t2-step1.jpg` | six-up: `#test` f360/f840 and t14, and house 10/30/50 — every one has a lit interior instead of TORUS's fog. |
| `t2-f360.jpg` / `t2-f840.jpg` | the v0.7 reference frames: a cool blue-violet nest (A minor) at f360, the drop's white bloom at f840. |
| `t2-s3-f360.jpg` / `t2-s3-f840.jpg` | TORUS at the same two frames — dimmer inside, full-rainbow, off to the right of frame. |
| `t2-step2.jpg` | the pinned trains side by side plus the house f600: 4×4's bumps evenly spaced, sync's bunched in pairs, and a real kick train putting bright beads round every green ring. |
| `t2-w4x4.jpg` / `t2-wsync.jpg` | the pair at one thread per family; `t2-zoom4x4/sync.jpg` are the crops that make the spacing readable. |
| `t2-dispon.jpg` | the isolation run (brightness pulse off, displacement 0.5) that proved the wave wiring before retuning it. |
| `t2-wh600.jpg` | `&demo=house` f600, 24 waves live across all three bands — the rings visibly ripple. |
| `t2-step3.jpg` | key 0 major beside key 7 minor: pink/gold/orange against cyan/blue/violet. Same frame, same geometry. |
| `t2-key-warm.jpg` / `t2-key-cool.jpg` | the two halves on their own. |
| `t2-step4.jpg` | `build` 0 beside `build` .78: six or seven threads per family and a smaller nest, against twelve and the camera in. |
| `t2-m360.jpg` / `t2-m450.jpg` | three beats apart — the nest has yawed about 62° and is still centred. |
| `t2-portrait.jpg` | 390×844: the nest fits the width with room to spare; the short edge binds the fill. |
| `t2-step5.jpg` | seven-up: pure, Thomas ½ and 1, CNN ½ and 1, Aizawa 1, Halvorsen 1. Thomas folds the nest into angular lobes, the CNN shears it into a long comet, Aizawa winds it into a tight swirl, Halvorsen sweeps it into a broad arc, and each ½ sits visibly between the pure torus and its own 1. |
| `t2-step6.jpg` | `hooks.unwind(0)` beside `(1)`: closed nested rings become open spiralling helices with loose ends. |
| `t2-step7.jpg` | the parameter lo/hi pairs — `size` .4 vs .9, `morph` 0 vs 1. |
| `t2-acc2.jpg` | acceptance 2's t6 and t14. |
| `t2-acc3.jpg` | acceptance 3's house 10/30/50: groove, breakdown, build. |
| **`t2-montage.jpg`** | **the final comparison, 11 rows: TORUS (left) beside TORUS2 (right) at `#test` f360 and f840 and at 10/30/50 s on house, aba and dnb.** TORUS2 is brighter through the middle of the nest in every row, better centred in the frame, and coherently coloured where TORUS is a full rainbow; the attractor morph is visible on aba-50 and dnb-30. |

## Line counts

| module | lines |
|---|---|
| `assets/scenes/torus2/index.js` | 343 |
| `assets/scenes/torus2/shaders.js` | 239 |
| `assets/scenes/torus2/attractors.js` | 146 |
| `assets/scenes/torus2/waves.js` | 105 |
| `assets/scenes/torus2/motion.js` | 75 |
| `assets/scenes/torus2/colour.js` | 64 |
| `assets/scenes/torus2/help.js` | 50 |
| **total** | **1022** |
| `tools/test_torus2.js` | 127 |

All under the 350 soft cap. `motion.js` (reframe + the nudge + the fill→distance solve), `colour.js` (the key
anchor) and `help.js` (the `?` overlay's prose) were split out of `index.js` as steps 3, 4 and 7 pushed it over.

## Test hooks

`probe(k)` (CPU reference fibre points, inherited from TORUS) · `info()` (every live look number, including the
bumps' positions round the ring) · `train('4x4' | 'sync' | null)` · `fib(n)` · `key(k, mode)` · `motion()` ·
`morph(m, which)` · `unwind(v)`. All are called through `CARD.REG[7].scene.hooks.<name>(…)`.

---

## What I would tune first when the user looks — the three leans I am least sure of

1. **The wave amplitude, `WAVE0` = 0.26 of the fibre radius (`index.js`, and the `wave` parameter's resting value).**
   This is 4× the brief's lean and the single biggest judgement call in the scene. At the brief's 6 % nothing is
   visible; at 0.26 the rings are noticeably lobed even between kicks. The user may well want it between the two —
   0.15 is the obvious next try — or want the resting value near zero and the *kick* term much larger
   (`from: (MS) => 0.04 + 0.3 * MS.kick`), so the threads are clean until something hits them. One constant, one
   parameter, either way.
2. **The palette narrowing, `SPREAD` = 0.30 + 0.45·mood.spread, centred on the anchor.** Making major read warm and
   minor read cool cost the v0.2 rainbow: TORUS2 is a two-or-three-hue picture where TORUS was a twelve-hue one.
   That is exactly the trade the user asked for in point 3, but they have not seen what it costs yet. If they want
   the rainbow back, widening `SPREAD` toward TORUS's 0.55–1.25 is one line and the mode bias simply stops reading.
3. **`MORPHK` = 0.9 — how much tension reaches the morph.** On `&demo=aba` at 50 s the nest is pulled into a long
   magenta comet (`t2-montage.jpg`, row 8): striking, and arguably too far for music that is not that tense.
   `morph` is a declared parameter, so the user can drive it from anything, but the default gain and the
   `TRAVEL` 0.55 that sets how far 8 steps carry a point are the two numbers I would move first. `STEPS` 8 → 4 also
   halves the scene's extra cost if the bench ever matters.

Runners-up: `FLASH` 0.95 (the kick flash on the quiet inner families may be too strong on busy music) and `UNWIND`
2.5 rad (the helices open a lot at `riser` 1 — spectacular on a build, possibly too loose).

## Not done

- **The `oklch` colour variant** (brief spec 3: "do the oklch variant last and only if time allows; say so if you
  skip it"). `colour` declares `v2` alone. The hue logic is already a single function (`colour.js` `anchor()`
  returning a turn), so a `palOK(h, L, C)` pass is a small piece of work for whoever picks it up.
- **The replacement path** (TORUS2 taking id 3's bid, TORUS moving to id 7 as `torus-v1`) is deliberately untouched:
  `score()` returns 0, TORUS is byte-identical, and the director never picks TORUS2 until the user approves it.
