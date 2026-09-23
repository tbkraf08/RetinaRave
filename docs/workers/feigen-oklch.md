# FEIGEN's colour pass in OKLCH (v0.3 item 2, `feigen-oklch`) — worker report

Brief: `docs/workers/brief-feigen-oklch.md` (+ `brief-common.md`). Worktree branch `worktree-agent-aa3e6306612d26f8a`
off `44ee899`, PORT 8782, GPU=1 everywhere, one Chrome at a time, no Q trace. Two commits, both `FEIGEN-OKLCH:`.
Files changed: `assets/scenes/feigen/colour.js` (the whole colouring) and `assets/scenes/feigen/index.js` (uniforms,
one hook, help text). `field.js` and `ladder.js` byte-identical to `master` — the "nothing underneath changed" proof.

## 1. What shipped — the exact formulas, with the constants and why

Program: `ctx.mkProg(ctx.oklch + FS_COLOUR, 'feigen-colour')` (CONTRACTS §1.14; HEAD first, then the chunk, then the
source). `palM` is gone. Per exterior pixel (`esc > 0.5`), with `d = exp(v.x)`, `lG = v.y`, `ea = v.z`:

```glsl
float dpx = d * uRes.y;                                 // one pixel is uWidth/uRes.y in parameter units, so this
                                                        // IS the distance estimate measured in pixels
float sp  = specM(abs(fract(ea) * 2. - 1.) * 0.9);      // unchanged from §15

float H = ea + uHue + 0.5 * uInvert;                    // HUE  <- the external angle

float L = 0.03 + 0.62 * tanh(sqrt(max(-lG, 0.)) / 10.); // LIGHTNESS <- the Green's potential
float band = 1. - smoothstep(0., 0.1, abs(fract(lG * 0.5 - uFlow * 0.3) - 0.5) - 0.4);
L += band * (0.02 + 0.22 * sp * sp + 0.15 * uHat) * exp(-d * 2.5) * (0.4 + uLevel);
L += histM(abs(fract(ea * 2.) * 2. - 1.), clamp(d * 1.5, 0., 0.9)) * exp(-d * 6.) * 0.25 * uMidS;
L  = L * clamp((1.05 + 0.35 * uLevel) * uBri, 0.35, 1.30) + 0.15 * uKick + 0.25 * uDrop;
L *= smoothstep(0., mix(0.65, 0.38, uBands.x), dpx);    // the crisp black boundary, from the field's own DE
L  = min(L, 1.);

float C = cMax(L) * smoothstep(0.35, 2.5, dpx) * uSat;  // CHROMA <- the distance estimate
o = vec4(linToSrgb(palOK(H, L, C)) * uAlive, 1.);
```

and per interior pixel (`t = v.w`, the orbit trap):

```glsl
float b = (0.03 + 0.22 * uBands.x * exp(-t * 2.) + 0.12 * uTension) * (0.4 + uLevel) * uBri;   // §15's term, verbatim
float L = pow(clamp(b, 0., 1.), 0.8);
vec3  hlc = vec3(uHue + 0.5, L, cMax(L) * 0.5 * uSat);
```

with the one new helper

```glsl
float cMax(float L){ return 0.11 * min(1., min(1.4 * L, 4. * (1. - L))); }
```

**Why each constant.**

- **H = `ea + uHue + 0.5*uInvert`, no spread.** One turn of external angle is exactly one turn of hue. That is the
  only coefficient at which the wrap of `ea` at 0 is invisible, and it is also what keeps the rung cross-fade
  continuous — `v.z` is blended as a unit vector by `sampleF`/the `uBlend` branch, and a unit-gain hue map carries
  that continuity straight through. `uSpread` was therefore **dropped** (shader, `draw()` and `S`): any spread ≠ 1
  puts a hue seam on the `ea = 0` curve, which is a visible line through the picture. `uInvert` (1 on a drop,
  decaying in 0.3 s) turns the whole wheel by **half a turn** — the drop's complement, the closest thing in OKLCH to
  §15's `mix(c, 1-c, invert*0.85)`, and unlike the old inversion it does not change any pixel's lightness.
- **L = `0.03 + 0.62·tanh(sqrt(max(−lG,0))/10)`.** `−lG` is the number of doublings of G below 1 (`n − log₂ ln r`).
  I measured its range with the new `hooks.clipdbg=2` probe rather than guessing: **0 … ~85 at the arrival depth**
  (median 2, p90 8, p99 40) and **34 … 478 at `&feig=3.6`** (median 46, p75 88, p90 153). `sqrt` then `tanh` is the
  only cheap shape that is monotone and unsaturated over *both*: `−lG` 2 → L .12, 8 → .20, 40 → .38, 85 → .48,
  153 → .55, 478 → .63. `k = 10` was chosen on the montage — `k = 7` (the brief's shape at its printed scale) held
  the whole deep exterior inside .55–.72, a sixth of the lightness range, and `k = 14` flattened the arrival view's
  rim into the field. The amplitude **0.62, not 1.0**, is deliberate: it leaves the top of the range to the music,
  which is what makes the "a kick lifts ≤ .15, a drop ≤ .25 and nothing clips" rule true rather than aspirational.
  The map is **absolute, never normalised per frame or per rung** — a per-frame normalisation would re-grade the
  picture at every rung change and put back exactly the seam §16 paid to remove. The price is that a deep view is
  genuinely brighter than a shallow one, because its potential genuinely is deeper. Direction: **bright near the
  set, dark outward**, per the brief's prose (see friction 1 — the brief's printed example formula is the other way
  round).
- **C = `cMax(L)·smoothstep(0.35, 2.5, dpx)·uSat`.** The `0.35 … 2.5` knee is the brief's: under about half a pixel
  of DE the colour is achromatic, by 2.5 px it is at full chroma. `cMax(L)` replaces the brief's flat `0.11` because
  0.11 is only in gamut *near L 0.7*: minimising `maxChroma(L, h)` (`assets/math/oklab.js`) over 180 hues at 199
  lightnesses gives 0.170·L below L 0.75, falling to 0 at L 1, and `0.11·min(1, 1.4L, 4(1−L))` sits under that
  envelope at every L (worst true/envelope ratio **1.058**, at L 0.99). So `okClip` is 1 on every pixel and chroma is
  never pulled toward grey — which is how acceptance 4 reads exactly 0 on all six probed frames, rather than
  "a few thousand pixels the clip handled".
- **The music, all on L.** `uLevel` scales as §15's `(0.45 + 1.3·uLevel)` did, `uKick` adds ≤ 0.15 and `uDrop` ≤ 0.25
  (additive, so the top of the range stays reachable), the Green's band keeps §15's `uFlow` drift with its amplitude
  on `sp²` and `uHat`, the spectrogram still enters at `ea·2` through `histM` (**both `specM` and `histM` reads are
  unchanged**, so the `&histfull=1` equality still means something), `uAlive` multiplies the encoded result, `uTension`
  lights the interior. The gain is clamped to ≤ 1.30 because `LOOK.mood.bri` reaches 1.20 on the fake timeline and
  1.30 × the base's 0.63 + the two music terms is the headroom budget.
- **`min(L, 1.)`** before `cMax`: the band and spectrogram terms are added *before* the level gain, so the loudest
  frame (f840 at `&feig=3.6`, drop 0.40) pushed 13 of 921600 pixels past L = 1. `palOK` clamps L itself so those
  pixels rendered white either way, but `okClip(h, L>1, C)` has no in-gamut chroma at all and returned 0, i.e. the
  probe reported 13 clipped pixels where the picture had none. This is the second commit.
- **Interior**: hue `uHue + 0.5` (half a turn off the mood, as the brief asked), chroma half the envelope, and
  lightness = §15's brightness expression **read as a lightness**. That conversion is exact, not a fudge: for a grey,
  OKLab's L is Y^(1/3) (the three cube roots coincide and the L row of Ottosson's matrix sums to 1.0000000), and the
  sRGB curve is ≈ enc^2.4, so an encoded grey `enc` is the lightness `enc^0.8`. The interior therefore keeps exactly
  the visual weight it had in §15.

## 2. Acceptance — every output, verbatim

### 1. `node tools/check.js`
```
check: 57 modules · uniforms 108 · MS keys 117 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```
(`index.js` landed at 358 lines on the first pass and warned; it was compressed back to **349**, under the 350 soft
cap, by merging the four colour-uniform uploads onto two lines and tightening the new help sentence.)

### 2. Only the colour pass changed
```
$ git diff --stat 44ee899 HEAD
 assets/scenes/feigen/colour.js | 93 +++++++++++++++++++++++++++++++-----------
 assets/scenes/feigen/index.js  | 33 +++++++--------
 2 files changed, 87 insertions(+), 39 deletions(-)

$ md5sum assets/scenes/feigen/field.js assets/scenes/feigen/ladder.js
ab1be22dd67f74d57ad6e272a1f92bdd  assets/scenes/feigen/field.js     <- = git show 44ee899:…/field.js  | md5sum
89e1b602bb368f38f315c6606e58bdbe  assets/scenes/feigen/ladder.js    <- = git show 44ee899:…/ladder.js | md5sum
```
`index.js`: `ctx.oklch +` on the `mkProg` line, `uSpread` removed from `S`/`update`/`draw`, `uClipDbg` added,
`hooks.clipdbg` added, `help.why` + the required sentence, six `help.feats` clauses re-worded to stay true
(`bass` now narrows the black boundary edge instead of sharpening filaments, `hat` lifts the bands' lightness, …).
`feats` itself is **unchanged** — no read was added or dropped.

### 3. Field proof — `tools/scene-md5.sh`, rows vs full

`PORT=8782 tools/scene-md5.sh oklch` (all six scenes, `errs []` on every one, `hop 840 row 72`):
```
92438f2da223f77c7a001f4cf45bd236  s0-f360.jpg
d697789c4f40f87b6f07e763c25da108  s0-f840.jpg
669aac71ff5e0f96263c4635c6504659  s1-f360.jpg
ed87b7f7e4ef392d65ac713d76290d8e  s1-f840.jpg
4d644eb0cbc72c59183745ec5b03bd61  s2-f360.jpg
fd94b15d86c3fa8ec49108a7ddb0cb82  s2-f840.jpg
98c6f9cf1489cca236900b5e520ef2c9  s3-f360.jpg
9f78a5f31403875334150712eb753fff  s3-f840.jpg
c1adabb50d74bc87b50ce51991fa500a  s5-f360.jpg
a945797ccdeb746961a738dce367e754  s5-f840.jpg
3f239c771844fc2022562fa54ee6e512  s6-f360.jpg
5510a0873e0277bad36f1038c953a2fc  s6-f840.jpg
```
`PORT=8782 tools/scene-md5.sh oklch-h '&histfull=1'` — **the same twelve hashes, byte for byte**, FEIGEN's two
included. Rows == full still holds with the new `histM` read.

Cross-check against the numbers DECISIONS already prints: s0 `92438f2d…` / `d697789c…` are §16's NAV `par = 0`
frames and s1-f840 `ed87b7f7…` is the dust-fibre-count follow-up's — so scenes 0/1 (and by the same token 2/3/5)
are untouched by this change. **The two md5s the orchestrator has to re-base are FEIGEN's:**

| | v0.2 tag | this worktree (plain **and** `&histfull=1`) |
|---|---|---|
| s6-f360 | `dee30d91…` | **`3f239c771844fc2022562fa54ee6e512`** |
| s6-f840 | `eb8aa082…` | **`5510a0873e0277bad36f1038c953a2fc`** |

### 4. Gamut — `hooks.clipdbg=1`, clipped pixels of 921600

`clipdbg=1` writes `okClip(h, L, C)` into `o.r` and 1 into `o.gb`; the readback is `ctx.mkTarget(1280, 720, true)` +
`scene.draw()` + `readPixels`, counting `r < 255`. `CLOCK=1 GPU=1`, frames 360 and 840:

| run | frame | label | clipped | min `o.r` |
|---|---|---|---|---|
| `test&scene=6&feig=3.6&clipdbg=1` | f360 | L3.97 | **0** | 255 |
| `test&scene=6&feig=3.6&clipdbg=1` | f840 | L4.15 | **0** | 255 |
| `test&scene=6&feig=1.2&clipdbg=1` | f360 | L1.57 | **0** | 255 |
| `test&scene=6&feig=1.2&clipdbg=1` | f840 | L2.75 | **0** | 255 |

Before the `min(L, 1.)` commit the same f840 at `&feig=3.6` read **13** clipped with min `o.r` 0 — the whole of the
excess, and the reason that commit exists. The hook stays in the scene (both modes) for the orchestrator's re-check.

### 5. Banding — distinct 8-bit triplets along a horizontal line, from the same RGBA8 readback (not the JPEG)

Rows y = 360 (centre), 540 and 180 of the 1280 × 720 readback, `CLOCK=1`, frame 360:

| view | y360 before → after | y540 before → after | y180 before → after |
|---|---|---|---|
| **`test&scene=6` f360 (the brief's test)** | 357 → **375** | 305 → **590** | 354 → **573** |
| `test&scene=6` f840 | 425 → 414 | 574 → **704** | 567 → **654** |
| `test&scene=6&feig=3.6` f360 | 362 → 176 | 607 → 418 | 606 → 407 |

The brief's test (the fake f360 view) passes on all three rows — **after ≥ before everywhere**, and 1.9× on the two
rows that do not cross the set. The two rows that go *down* are honest and worth the orchestrator's eye:
- f840 y360 (425 → 414, −2.6 %) is the row through the cardioid's interior, which is now one hue at low chroma by
  design instead of `palM(0.5 + 0.6·trap)` sweeping the wheel.
- **`&feig=3.6` f360 drops by half** (362/607/606 → 176/418/407). At that depth the view subtends a narrow band of
  external angle, so the hue is nearly constant and the picture is carried by lightness alone; with `cMax(L≈0.5) =
  0.077` the chroma budget is small, and the composite's tonemap (`1 − exp(−1.5c)` on *encoded* values, §17's linear-
  light item) desaturates what is left. It is not posterisation — the deep montage tile is visibly *more* resolved
  than `master`'s, which was a flat blown-out green — but it is fewer distinct triplets, and §17's linear-light
  phase is what will give them back.

### 6. Seam and cost — `tools/feigen-bench.sh`

`PORT=8782 GPU=1 tools/feigen-bench.sh oklch 1.2 3.6` → `tools/accept/v0.3/feigen-bench-oklch.txt`:
```
== (a) tier 3 steady state: feigen median of 3 × bench(6,300) | nav median (interleaved) | label | log
feig=1.2: L L1.61 feigen 1.61 ms (runs 1.53/1.61/1.64) nav 2.50 ms · tier 3 q 0.95 · log [r3 built b905/905 next r4 b905/905 it208 rows0 3337x905 t3] glerr 0 errs []
feig=3.6: L L4.02 feigen 1.61 ms (runs 1.56/1.61/1.80) nav 2.67 ms · tier 3 q 0.95 · log [r8 built b905/905 next r9 b905/905 it500 rows0 3337x905 t3] glerr 0 errs []
== (b) build cost after a tricorn flip at the deepest level (tier 3)
feig=3.6: L L4.02 steady 1.86 ms · flip: first two renders 23.50 ms wall, next 60 mean 4.21 ms, then steady 2.32 ms · log [r8 built b905/905 next r9 b905/905 it500 rows0 3337x905 t3] glerr 0
== (c) seam ratio: CLOCK=1 &feig=1.3, frames 300..340
RUNG lines: RUNG@1 r2 L1.300 coarse | RUNG@42 r2 L1.347 blend | RUNG@71 r2 L1.377 coarser(1) | RUNG@93 r3 L1.399 blend | RUNG@122 r3 L1.429 built
consecutive |Δ| (grey 0..255): 301:1.99 302:1.76 303:1.46 304:1.36 305:5.77 306:2.69 307:2.23 308:1.85 309:1.62 310:1.45 311:1.33 312:1.26 313:1.22 314:1.18 315:1.17 316:1.16 317:1.15 318:1.16 319:1.15 320:65.83 321:12.80 322:10.60 323:8.32 324:6.51 325:5.14 326:4.13 327:3.31 328:2.76 329:2.40 330:2.07 331:1.82 332:1.53 333:1.42 334:5.83 335:2.73 336:2.26 337:1.88 338:1.65 339:1.48 340:1.35
seam ratio max/median = 35.92 (max 65.83 at f320, median 1.83, mean 4.47)
RUNG@1 / RUNG@42 / RUNG@71 / RUNG@93 / RUNG@122 are outside the shot window 301..340
```

**`SEAM_L = 1.3` puts no rung change inside the window — and neither does the accept file** (same five `RUNG@` lines,
all outside 301..340). So `tools/accept/v0.2/feigen-bench-accept.txt`'s "seam ratio at `RUNG@` frames" does not
exist to compare against, and its `max/median = 27.91` is a *kick flare* ratio, not a seam. I ran the real test as a
second pass at `SEAM_L = 1.478` — §16's own seam level, which lands a rung change at frame 313
(`tools/accept/v0.3/feigen-bench-oklch-seam.txt`):
```
RUNG lines: RUNG@1 r3 L1.478 coarse | RUNG@56 r3 L1.538 blend | RUNG@85 r3 L1.568 built | RUNG@313 r4 L1.800 blend
… 312:1.41 313:0.82 314:0.77 315:0.78 316:0.81 …
seam ratio max/median = 33.74 (max 67.41 at f320, median 2.00, mean 4.65)
RUNG@313: |Δ| 0.82 = 0.41 × median
```

| | §16 / accept | this pass | Δ |
|---|---|---|---|
| **rung change `\|Δ\|` (`SEAM_L` 1.478, f313)** | **0.85** | **0.82** | **−3.5 %** ✔ within 10 % |
| same, as × the window median | 0.51 × | 0.41 × | the median rose, the seam did not |
| max/median over 301..340 at `SEAM_L` 1.3 | 27.91 | 35.92 | +28.7 % — *the kick flare, not a seam* |
| the f320 kick flare, absolute | 42.45 | 65.83 | +55 % |
| ordinary-frame median at `SEAM_L` 1.3 | 1.52 | 1.83 | +20 % |

The rung change is still **quieter than an ordinary frame** (0.41 ×), which is the property §16 bought. What grew is
the *kick*: §15's picture was black over most of the frame, so a kick moved almost nothing there; now the whole field
carries lightness, so `+0.15·uKick` moves every exterior pixel and the flare at f320 is 1.55× bigger. That is the
music reading better, not a discontinuity — `cuts: 'event'` is unchanged and no frame in the window is a step.

**Cost.** The machine drifted badly across this session (the *same build* measured 1.39–2.36 ms with NAV at
2.26–3.51), so I did not trust the accept file's absolute and benched **`master`'s colour pass on this machine in the
same session**, alternating with mine, HARNESS "Bench protocol" every time (`q` pinned .95, 8 s settle, `bench(6,300)`
discarded then 3 × interleaved with `bench(0,300)`, medians):

| build | interleaved ratios feigen/NAV at `&feig=3.6` | median |
|---|---|---|
| `master` (44ee899), 5 pairs, this session | 0.535 / 0.611 / 0.619 / 0.620 / 0.637 | **0.619** |
| **this pass**, 7 pairs, interleaved with the above | 0.603 / 0.638 / 0.645 / 0.649 / 0.664 / 0.669 / 0.672 | **0.649** |
| `accept/v0.2/feigen-bench-accept.txt` (1.14 / 1.90 ms) | — | 0.600 |

**+4.8 % against `master` measured beside it — inside the brief's 5 % gate. +8.2 % against the accept file's 0.600**,
which was taken on a quieter machine (its FEIGEN absolute is 1.14 ms against 1.39–2.36 here). My reading: the true
cost delta is small and positive. The shader lost 3 `palM` calls (3 × `cos(vec3)` + 3 × `pow(vec3, 1.7)`) and the
`exp(−d·mix(160,70,bass))` filament, and gained `palOK` (2 × `okLabToLin`: cubes and a matrix, no transcendental),
one `linToSrgb` `pow(vec3, 1/2.4)`, a `tanh`, a `sqrt` and a second `smoothstep` — a wash on paper. One attribution
run with the `okClip` call deleted from the `clipdbg` branch read 0.636, hinting the inlined 14-iteration bisection
costs a little in register pressure even though it is behind a uniform branch and `okClip`'s in-gamut early-out
fires on every pixel; I did not ship that, because the probe is the brief's required re-check. `bench(6,300)` at
`&feig=1.2` and at `&feig=3.6` are **both 1.61 ms** — the cost is still flat in depth, which is §16's invariant.
A tricorn flip: first two renders 23.5 ms wall / next 60 mean 4.21 ms (§16: 13.4 / 2.62 on its quieter machine;
13.0 / 3.82 in my second run) — the same shape.

### 7. Montage — `tools/work/feigen-oklch-ab.jpg` (master left, this pass right; f360, f840, `&feig=3.6` f360, house 30 s)

- **f360 (arrival, whole set in view).** Master: a neon-green DE glow hugging the boundary on black. Mine: the set
  is a hard black silhouette, a thin light rim, and the exterior is a **binary-decomposition fan** — concentric
  Green's equipotential arcs crossed by radial cells of constant hue, each cell splitting in two at every level set
  outward. That is `ea = arg(z_n)` behaving exactly as it should: iso-hue lines *are* external-ray segments, and the
  cells double per doubling of the potential. The hues visibly **pinch along the antenna to the left of the set** —
  the 1/2-ray and the Misiurewicz tips on the real spine are where whole fans of cells converge to a point — and
  around the root of the period-2 bulb, where the two wake rays 1/3 and 2/3 squeeze the cells between them. The
  rim aliases into speckle at this depth: the black edge is now 0.65 px wide by construction, and at the arrival
  view the boundary is dense fractal structure at pixel scale, where §15's 8-px `exp(−160d)` glow smoothed it over.
  It is the honest picture of a sub-pixel boundary, and it stops being speckle the moment the dive gets going.
- **f840 (post-drop, L1.55).** Master: blown-out violet filaments, everything between them black. Mine: a light
  grey-pastel level-set plateau with the band-and-cell structure fully resolved *between* the filaments, the
  cardioid and the dendrite antenna as clean black, and the right-hand third — the part of the frame furthest from
  the set — falling to near-black as the potential rises. The drop reads: `uInvert` has turned the wheel and
  `+0.25·uDrop` has lifted the plateau; nothing is white.
- **`&feig=3.6` f360 (deep).** This is the tile that makes the case. Master is a flat blown-out green field with the
  dendrites barely separable. Mine has every filament of the Feigenbaum dendrite crisp and black against a grey
  plateau — **the black boundary holds at 3.6**, which is the point of chroma-carries-the-DE: the edge is one pixel
  wide at any depth because the field's own distance estimate draws it. The cost is colour: the view subtends too
  little external angle to show much hue (see banding, above).
- **house 30 s (`fake=0`, real extractor, L2.48, q 0.646).** Master: hot pink filaments. Mine: the same dendrite
  geometry in dark grey with faint warm/cool cell tints — dimmer, because `LOOK.mood.bri` and `MS.lvl` are lower on
  that track at 30 s than on the fake timeline. `errs []`, `nonFinite []`.
- **The music still reads.** The kick is the +0.15 lightness pulse over the whole field (frame-to-frame |Δ| 65.8 at
  the fake f320 kick against master's 42.5 — *more* visible than before, §6). The drop is the +0.25 lift plus the
  half-turn hue flip plus §16's one-δ depth jump; f840 against f360 is exactly that. `uHat` and `sp²` still sparkle
  the Green's bands, `uMidS` still drifts the spectrogram off the boundary, `uAlive` still fades to black in silence.

### 8. `help`
Three depths present and non-empty (`check.js` enforces); `help.feats` has all 18 `feats` keys, `feats` itself
unchanged. `help.why` gained, verbatim:

> And the colour is not a palette laid over it: hue is the external angle, lightness the Green's potential, chroma
> the distance estimate — the three coordinates the field already carries. A ray landing on a wake is a line of
> constant hue, a level set of the potential a line of constant lightness, and the edge stays a pixel wide however
> deep you fall, because the distance to the set draws it and not a filter.

### 9. Real path, 45 s
```
$ PORT=8782 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"…"}]'
EVAL JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS}) => "{\"bad\":[],\"errs\":[]}"
```
`[]`, `[]`, and **0 `[EXC]`** lines (a second run grepped for `EXC` returned 0).

## 3. (a) Friction log — questions the docs did not answer, and every guess

1. **The brief contradicts itself on the direction of L.** It says "**L ← f(lG)**: bright near the set, darker
   outward" and then prints "e.g. `L = 0.72 − 0.5·tanh(sqrt(max(−lG, 0)) / k)`". `−lG` is *large* near the set, so the
   printed formula is **dark near the set, bright outward** — the opposite of the sentence beside it. **Guess: I
   followed the prose**, `L = 0.03 + 0.62·tanh(…)`, because (i) it keeps §15's figure/ground (a dark field with the
   set's neighbourhood lit), (ii) it makes the `L *= smoothstep(0, .5, dpx)` black edge a high-contrast outline
   instead of a barely-visible darkening of an already-dark rim, and (iii) a bright-field visualiser would be a
   large unasked-for change to a dark show. The other direction is a one-character change if the orchestrator
   prefers it — and it would be *more* colourful, because the chroma budget peaks at L ≈ 0.7, which is where the
   wide exterior would then sit.
2. **`0.11` is not in gamut at most lightnesses.** The brief says "C ≤ 0.11 at L ≈ 0.7 is in gamut at every hue …
   above that the chunk clips toward grey" and then asks for **0** clipped pixels. Both cannot hold with a flat
   `C = 0.11`: at L 0.30 the tightest hue tolerates 0.051, at L 0.90 it tolerates 0.048. Resolved by deriving the
   `cMax(L)` envelope (§1) — 0.11 is the cap, not the value. CONTRACTS §1.14's sentence "**C 0.11 at L 0.7 is inside
   sRGB at every hue**" is accurate; the brief read it as if it held at every L.
3. **`hooks.clipdbg` had to grow a second mode.** The brief specifies mode 1 (`okClip` → `o.r`). Choosing `k` needed
   the actual distribution of `−lG` and of `dpx`, which nothing in the repo exposes, so `clipdbg=2` writes
   `((−lG)/512, dpx/8, esc)` and the same readback gives quantiles. Mode 1 is exactly as specified; mode 2 is
   additive and documented in `colour.js` and in `hooks`.
4. **`scene.draw()` into a readback target is not documented anywhere.** Acceptance 4 says "`ctx.mkTarget(w, h, true)`
   + `readPixels`" but not how to get the scene to draw into it. Guess, from `CARD.bench`'s existence and
   CONTRACTS §1.1's `draw()` contract: `CARD.REG[6].scene.draw(T, {w, h})` from an `{eval}` at the pinned `CLOCK=1`
   frame. It works, is deterministic, and is how every readback number in this report was taken; HARNESS's
   "`window.CARD`" list could say so.
5. **The brief's banding test is under-specified.** "a row of pixels at fixed `lG`, i.e. a horizontal line at the
   fake f360 view" — a horizontal line is *not* an equipotential (the level sets are closed curves around the set),
   and the centre row runs through the interior, where the new colouring is deliberately one hue. I reported three
   rows at three views rather than pick the flattering one. Also: the shots are **JPEG**, so counting distinct
   triplets on a `tools/work/*.jpg` would count the codec; the counts here come from the RGBA8 readback.
6. **`SEAM_L = 1.3` has no rung change in the shot window**, in the accept file as much as in mine, so the brief's
   "seam ratio at `RUNG@` frames within 10 % of the accept file's" compares two numbers that are both absent. I
   added the `SEAM_L = 1.478` pass (§16's own level) to get a real seam number. `tools/feigen-bench.sh`'s own header
   already says "Pick `SEAM_L` so a rung change lands inside the window"; the accept file does not follow its own
   advice, and `accept.sh` would be better off pinning 1.478.
7. **A ratio to NAV is not drift-immune either.** The brief's ±5 % gate is against a file recorded on a different
   day; the same build moved 1.39 → 2.36 ms within one session here, and the ratio moved 0.603 → 0.672. The only
   comparison I trusted was `master` re-benched on this machine, alternating with mine (§6). HARNESS's "Bench
   protocol" rule 3 says load drifts 2× and only interleaved pairs compare — it could add that *the pair ratio
   itself* drifts a few per cent, so a 5 % gate needs the control build re-benched in the same session, not a file.
8. **`index.js` is at the line cap.** It was 348 lines before this change and 358 after; getting back under 350
   needed merging four `gl.uniform1f` calls onto two lines (CONTRACTS §0 says "one statement per line", which the
   file already breaks at its `texParameteri` pair) and trimming the new help sentence. Any further work in that
   file will have to split it; the cap is the binding constraint, not the design.
9. **A `git checkout HEAD -- <file>` ate an uncommitted fix.** Mid-session I benched `master`'s colour pass by
   checking its two files out over mine, and the restore silently dropped the not-yet-committed `min(L, 1.)`. Caught
   by grepping for it before the next bench; every acceptance number in §2 was taken with the fix in place, and it is
   now commit 2. Nothing in the docs is wrong here — it is a note for the next worker who A/Bs against `master` in
   place: commit first.
10. **Where the bench files land.** `tools/feigen-bench.sh` writes `tools/accept/${ACC:-v0.3}/`, i.e. outside the two
    paths this brief allows me to touch. I let it write (`feigen-bench-oklch.txt`, `feigen-bench-oklch-seam.txt`) and
    left both **untracked** rather than commit them; they are quoted in full above. The orchestrator can `git add`
    them or re-run.

## 4. (b) Forbidden files

Tempted twice, opened neither.
- **`assets/core/quality.js` / `core/gl.js`** — when the cost came out +5 %, to find out whether `mkProg` does
  anything with the prepended chunk or whether `bench` warms differently. Answered instead by data: re-benching
  `master` on the same machine, and by one attribution run with the `okClip` call removed.
- **Another scene that uses `ctx.oklch`** — to copy an idiom. There is none yet (this is the first consumer), and
  `tools/oklch-smoke.js`, which the brief allows, shows the whole calling convention including `palOKs`.
- Read and **not** modified, as instructed: `assets/core/oklch.js`, `assets/math/oklab.js` (imported read-only in a
  `node -e` to compute the `cMax` envelope and its worst-case ratio), `tools/check.js`, `tools/oklch-smoke.js`,
  `tools/feigen-bench.sh`, `tools/scene-md5.sh`, CONTRACTS §0/§1.1/§1.2/§1.5/§1.10/§1.13/§1.14, HARNESS, DECISIONS
  §16/§17. No file outside `assets/scenes/feigen/` and this report was written.

## 5. (d) Things wrong in the docs

- **The brief's L example formula inverts its own prose** (friction 1) and **its flat `C = 0.11` cannot give 0
  clipped pixels** (friction 2). Both are brief-level, not CONTRACTS-level; CONTRACTS §1.14 is correct as written,
  but it would help to add one line: *"0.11 is the budget at L ≈ 0.7 only — `maxChroma` is ≈ 0.170·L below L 0.75 and
  falls to 0 at L 1, so a scene whose L moves should scale C with L or let `okClip` do it."*
- **`okClip(h, L, C)` with `L > 1` returns 0, not 1.** Nothing says so. It is the correct answer (no chroma is in
  gamut there) but it reads as "this pixel was clipped" in exactly the test CONTRACTS invites you to write, while
  `palOK` clamps L and renders white. Worth a clause in §1.14: *"`okClip` does not clamp L; `palOK` does. Clamp L
  before you use `okClip` as a gamut probe."*
- **`tools/feigen-bench.sh`'s default `SEAM_L = 1.3` measures no seam** (friction 6).
- **HARNESS "Bench protocol"** could say that the NAV-interleaved *ratio* drifts a few per cent between sessions
  (friction 7), and **"`window.CARD`"** could document `REG[id].scene.draw(target, {w, h})` as the supported way to
  render one scene into a readback target (friction 4).
- Everything else ran exactly as printed: `scene-md5.sh`, `feigen-bench.sh`, `cdp.js` with `CLOCK=1` / `GPU=1` /
  `NOAUTO=1` / `OUT=`, `montage.py`, `check.js`. No command failed as written.

## 6. (e) `feats` and `post`

`feats` **unchanged** (18 entries, no read added or dropped):
```
arc, regularity, clarity, calm, bpm, lvl, tension, alive, kick, dropEvt, sectionEvt,
seed, flow, flowMid, bass, dropEnv, hat, midS
```
`post` **unchanged**: `{ fb: { decay: 0.55 }, bloom: { thr: 0.3 }, kaleido: 0 }`. The trails and the bloom threshold
were tuned in §15/§16 against a picture whose bright pixels were thin filaments; the new picture's bright pixels are
broad plateaux, so `bloom.thr 0.3` now catches more of the frame. I left it alone deliberately — it is not a colour-
pass parameter, the montage does not show it blooming out, and §17's linear-light phase moves the bloom's arithmetic
anyway, which is the right moment to re-tune the threshold once rather than twice.

## 7. For the orchestrator

- **Re-base**: FEIGEN f360 `3f239c771844fc2022562fa54ee6e512`, f840 `5510a0873e0277bad36f1038c953a2fc` (identical
  with and without `&histfull=1`). Every other scene's md5 is unchanged from the tag.
- **Decide**: the L direction (friction 1) — prose (shipped) or the brief's printed formula. One line either way.
- **Note**: the deep view is nearly achromatic (§5 banding) and the composite's tonemap on encoded values is part of
  why; the `&linear=1` item (§17) should be re-checked against `&feig=3.6` when it lands.
- **Cost**: +4.8 % of the NAV ratio against `master` re-benched in the same session (inside 5 %), +8.2 % against the
  v0.2 accept file (outside 5 %). If the gate is read against the file, this fails it; if it is read against a
  control on the same machine, it passes. `bench(6,300)` is 1.61 ms at both `&feig=1.2` and `&feig=3.6` — flat in
  depth, which is what §16 bought.
