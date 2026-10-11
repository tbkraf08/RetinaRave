# FEIGEN's colour pass in OKLCH (v0.3 item 2, `feigen-oklch`) — worker report

Brief: `docs/workers/brief-feigen-oklch.md` (+ `brief-common.md`), plus the orchestrator's mid-task decision on the
first pass's friction items (§8 below records what changed and why). Worktree branch
`worktree-agent-aa3e6306612d26f8a` off `44ee899`, PORT 8782, GPU=1 everywhere, one Chrome at a time, no Q trace.
Four commits, all `FEIGEN-OKLCH:`. Files changed: `assets/scenes/feigen/colour.js` (the whole colouring) and
`assets/scenes/feigen/index.js` (uniforms, one hook, help text). `field.js` and `ladder.js` byte-identical to
`master` — the "nothing underneath changed" proof.

## 1. What shipped — the exact formulas, with the constants and why

Program: `ctx.mkProg(ctx.oklch + FS_COLOUR, 'feigen-colour')` (CONTRACTS §1.14; HEAD first, then the chunk, then the
source). `palM` is gone. Per exterior pixel (`esc > 0.5`), with `d = exp(v.x)`, `lG = v.y`, `ea = v.z`:

```glsl
float dpx = d * uRes.y;                                  // one pixel is uWidth/uRes.y in parameter units, so this
                                                         // IS the distance estimate measured in pixels
float sp  = specM(abs(fract(ea) * 2. - 1.) * 0.9);       // unchanged from §15

float H = ea + uHue + 0.5 * uInvert;                     // HUE       <- the external angle

float L = 0.72 * (1. - exp(-d * 200.));                  // LIGHTNESS <- the scale-free distance estimate
float band = 1. - smoothstep(0., 0.1, abs(fract(lG * 0.5 - uFlow * 0.3) - 0.5) - 0.4);
L += (2. * band - 1.) * 0.08 * min(1.5, 0.6 + 0.6 * sp * sp + 0.5 * uHat);        // the Green's level sets, +-0.08
L -= histM(abs(fract(ea * 2.) * 2. - 1.), clamp(d * 1.5, 0., 0.9)) * exp(-d * 6.) * 0.20 * uMidS;
L *= clamp(mix(1., uBri, 0.4) * (0.92 + 0.14 * uLevel), 0.65, 1.02);
L += (0.15 * uKick + 0.25 * uDrop) * (1. - clamp(L, 0., 1.));
L *= smoothstep(0., mix(0.65, 0.38, uBands.x), dpx);     // the crisp black boundary, from the field's own DE
L  = clamp(L, 0., 1.);

float C = cMax(L) * smoothstep(0.35, 2.5, dpx) * uSat;   // CHROMA    <- the distance estimate, in pixels
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

- **H = `ea + uHue + 0.5·uInvert`, no spread.** One turn of external angle is exactly one turn of hue. That is the
  only coefficient at which the wrap of `ea` at 0 is invisible, and it is also what keeps the rung cross-fade
  continuous — `v.z` is blended as a unit vector by `sampleF` and by the `uBlend` branch, and a unit-gain hue map
  carries that continuity straight through. `uSpread` was therefore **dropped** (shader, `draw()` and `S`): any
  spread ≠ 1 puts a hue seam on the `ea = 0` curve, which is a visible line through the picture. `uInvert` (1 on a
  drop, decaying in 0.3 s) turns the whole wheel by **half a turn** — the drop's complement, the closest thing in
  OKLCH to §15's `mix(c, 1-c, invert*0.85)`, and unlike the old inversion it changes no pixel's lightness.
- **L = `0.72·(1 − exp(−d·200))`.** `d` is the distance estimate *already divided by the view width* by `dec()`, so
  it is scale-free: the same shape of view has the same `d` at every depth, the grade never moves under the fall,
  and a rung change cannot re-grade the picture (which is what §16 paid for). **0.72** is the plateau because
  `cMax(0.72) = 0.11` — the full chroma budget at every hue — so the open field is where the hue cells can be
  colour rather than pastel-on-grey. **200** is the knee, chosen on the montage: it half-darkens at
  `d = ln2/200 = 3.5·10⁻³`, which is **2.5 px** at 720p, is 90 % of the way back to the plateau by **8 px**, and is
  flat beyond ~15 px. I picked it from measurement, not taste — `hooks.clipdbg=2` (whose green channel is now
  `log2 d`, because `d` spans twenty doublings) gives the exterior's distribution:

  | view | `d` p50 | p75 | p90 | p99 | p99.9 |
  |---|---|---|---|---|---|
  | `test&scene=6` f360 (arrival, L0.37) | 0.074 | 0.22 | 0.43 | 0.72 | — |
  | `test&scene=6` f840 (L1.55) | 3.7e-4 | 0.060 | 0.172 | 0.35 | — |
  | `&feig=3.6` f360 (L3.97) | 1.1e-5 | 1.9e-3 | 0.0118 | 0.0435 | 0.057 |

  The deep view has ~8× less open space in units of the view width than the arrival view — the dive sits inside
  dense dendrite, the arrival view has the whole set plus empty exterior — so no knee makes the two *histograms*
  identical. What 200 does make identical is the **structure**, which is the acceptance: at every depth the gaps
  read at the 0.72 plateau, each filament carries a dark rim about a dozen pixels wide, and the boundary itself is
  black. That is the same picture at every scale because `d` is scale-free, i.e. the grade is self-similar in
  exactly the way the scene is.
- **C = `cMax(L)·smoothstep(0.35, 2.5, dpx)·uSat`.** The `0.35 … 2.5` knee is the brief's: under about half a pixel
  of DE the colour is achromatic, by 2.5 px it is at full chroma. `cMax(L)` is `min(0.11, …)` by construction —
  0.11 is only in gamut *near L 0.7*: minimising `maxChroma(L, h)` (`assets/math/oklab.js`) over 180 hues at 199
  lightnesses gives 0.170·L below L 0.75, falling to 0 at L 1, and `0.11·min(1, 1.4L, 4(1−L))` sits under that
  envelope at every L (worst true/envelope ratio **1.058**, at L 0.99). At the field's L 0.72 it evaluates to the
  full **0.11**; it only bites in the rim and on a drop's brightest pixels. So `okClip` is 1 on every pixel and
  chroma is never pulled toward grey — which is how acceptance 4 reads exactly 0 on all four probed frames.
- **The Green's level sets are now a ±0.08 ripple**, not an additive highlight: `(2·band − 1)·0.08·amp` with the
  same `lG`, the same `uFlow` drift and the same `sp²`/`uHat` amplitude §15 had (`amp` runs 0.6 … 1.5, so the
  ripple is ±0.048 … ±0.12). Signed, because the field now sits at a plateau: an additive band would only push it
  toward white, where the chroma budget collapses.
- **The spectrogram darkens instead of lifting.** `L −= histM(ea·2, age)·exp(−d·6)·0.20·uMidS` — same read, same
  `ea·2` argument, same age envelope, opposite sign, for the same reason. **Both `specM` and `histM` reads are
  unchanged**, so the `&histfull=1` equality still means something.
- **The music.** `uLevel` and the mood's `uBri` scale L but are clamped to **≤ 1.02**, so the field cannot leave the
  L band where C is full (`uBri` reaches 1.20 on the fake timeline; it enters at `mix(1., uBri, 0.4)`). The kick and
  the drop then lift **toward white by ≤ 0.15 and ≤ 0.25 of the remaining headroom** — so the brief's "a kick lifts
  by ≤ .15, a drop by ≤ .25, so nothing clips" holds by construction rather than by luck, and no gain can take L
  past 1 at all. `uAlive` multiplies the encoded result, `uTension` lights the interior, `uBands.x` narrows the
  black boundary edge (§15's `mix(160, 70, bass)` filament sharpening, on the same `d`).
- **Interior**: hue `uHue + 0.5` (half a turn off the mood), chroma half the envelope, lightness = §15's brightness
  expression **read as a lightness**. That conversion is exact, not a fudge: for a grey, OKLab's L is Y^(1/3) (the
  three cube roots coincide and the L row of Ottosson's matrix sums to 1.0000000), and the sRGB curve is ≈ enc^2.4,
  so an encoded grey `enc` is the lightness `enc^0.8`. The interior keeps exactly the visual weight it had in §15.

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

$ md5sum assets/scenes/feigen/field.js assets/scenes/feigen/ladder.js
ab1be22dd67f74d57ad6e272a1f92bdd  assets/scenes/feigen/field.js     <- = git show 44ee899:…/field.js  | md5sum
89e1b602bb368f38f315c6606e58bdbe  assets/scenes/feigen/ladder.js    <- = git show 44ee899:…/ladder.js | md5sum
```
`index.js`: `ctx.oklch +` on the `mkProg` line, `uSpread` removed from `S`/`update`/`draw`, `uClipDbg` added,
`hooks.clipdbg` added, `help.why` + the required sentence, six `help.feats` clauses re-worded to stay true.
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
820981ab01949bf83d541af44f8512c7  s6-f360.jpg
2718d3558770991806ca730cc95fb00a  s6-f840.jpg
```
`PORT=8782 tools/scene-md5.sh oklch-h '&histfull=1'` — **the same twelve hashes, byte for byte**, FEIGEN's two
included. Rows == full still holds with the new `histM` read.

s0 `92438f2d…` / `d697789c…` are §16's NAV `par = 0` frames and s1-f840 `ed87b7f7…` is the dust-fibre-count
follow-up's, so scenes 0/1 (and by the same token 2/3/5) are untouched. **The two md5s to re-base:**

| | v0.2 tag | first pass | **this worktree** (plain **and** `&histfull=1`) |
|---|---|---|---|
| s6-f360 | `dee30d91…` | `3f239c77…` | **`820981ab01949bf83d541af44f8512c7`** |
| s6-f840 | `eb8aa082…` | `5510a087…` | **`2718d3558770991806ca730cc95fb00a`** |

### 4. Gamut — `hooks.clipdbg=1`, clipped pixels of 921600

`clipdbg=1` writes `okClip(h, L, C)` into `o.r` and 1 into `o.gb`; the readback is `ctx.mkTarget(1280, 720, true)` +
`REG[6].scene.draw()` + `readPixels`, counting `r < 255`. `CLOCK=1 GPU=1`, frames 360 and 840:

| run | frame | label | clipped | min `o.r` |
|---|---|---|---|---|
| `test&scene=6&feig=3.6&clipdbg=1` | f360 | L3.97 | **0** | 255 |
| `test&scene=6&feig=3.6&clipdbg=1` | f840 | L4.15 | **0** | 255 |
| `test&scene=6&feig=1.2&clipdbg=1` | f360 | L1.57 | **0** | 255 |
| `test&scene=6&feig=1.2&clipdbg=1` | f840 | L2.75 | **0** | 255 |

The hook stays in the scene (both modes) for the orchestrator's re-check.

### 5. Banding — distinct 8-bit triplets along a horizontal line, from the same RGBA8 readback (not the JPEG)

Rows y = 360 (centre), 540 and 180 of the 1280 × 720 readback, `CLOCK=1`:

| view | y360 before → after | y540 before → after | y180 before → after |
|---|---|---|---|
| **`test&scene=6` f360 (the brief's test)** | 357 → **395** | 305 → **781** | 354 → **768** |
| `test&scene=6` f840 | 425 → 404 | 574 → **690** | 567 → **610** |
| `test&scene=6&feig=3.6` f360 | 362 → 116 | 607 → 368 | 606 → 359 |

The brief's test passes on all three rows — **after ≥ before everywhere**, and 2.2–2.6× on the two rows that do not
cross the set (the first pass managed 1.6–1.9×; putting the field on the 0.72 plateau, where `cMax` is the full
0.11, is what bought the rest). The two rows that go *down* are honest:
- f840 y360 (425 → 404, −4.9 %) is the row through the cardioid's interior, which is now one hue at low chroma by
  design instead of `palM(0.5 + 0.6·trap)` sweeping the wheel.
- **`&feig=3.6` f360 drops to a third.** At that depth the view subtends a narrow band of external angle, so the
  hue is nearly constant across the frame and the picture is carried by lightness alone; the gaps between the deep
  filaments are also only a few pixels wide, so `smoothstep(0.35, 2.5, dpx)` holds chroma down over much of them.
  It is not posterisation — the deep montage tile is visibly *more* resolved than `master`'s flat blown-out green —
  but the deep view is close to monochrome, and that follows from `H ← ea` on a view this small. §17's linear-light
  phase (the composite tonemaps *encoded* values today, which desaturates) is where some of it comes back.

### 6. Seam and cost — `tools/feigen-bench.sh`

`SEAM_L=1.478 PORT=8782 GPU=1 tools/feigen-bench.sh oklch 1.2 3.6` → `tools/accept/v0.3/feigen-bench-oklch.txt`:
```
== (a) tier 3 steady state: feigen median of 3 × bench(6,300) | nav median (interleaved) | label | log
feig=1.2: L L1.62 feigen 1.97 ms (runs 1.96/1.97/2.34) nav 3.06 ms · tier 3 q 0.95 · log [r3 built b905/905 next r4 b905/905 it208 rows0 3337x905 t3] glerr 0 errs []
feig=3.6: L L4.02 feigen 2.77 ms (runs 2.25/2.77/2.79) nav 3.71 ms · tier 3 q 0.95 · log [r8 built b905/905 next r9 b905/905 it500 rows0 3337x905 t3] glerr 0 errs []
== (b) build cost after a tricorn flip at the deepest level (tier 3)
feig=3.6: L L4.02 steady 1.73 ms · flip: first two renders 17.60 ms wall, next 60 mean 3.96 ms, then steady 2.58 ms · log [r8 built b905/905 next r9 b905/905 it500 rows0 3337x905 t3] glerr 0
== (c) seam ratio: CLOCK=1 &feig=1.478, frames 300..340
RUNG lines: RUNG@1 r3 L1.478 coarse | RUNG@56 r3 L1.538 blend | RUNG@85 r3 L1.568 built | RUNG@313 r4 L1.800 blend
consecutive |Δ| (grey 0..255): 301:1.29 302:1.08 303:0.97 304:0.89 305:1.59 306:1.12 307:1.10 308:0.98 309:0.96 310:0.89 311:0.84 312:0.84 313:0.48 314:0.47 315:0.50 316:0.52 317:0.56 318:0.59 319:0.62 320:32.51 321:6.82 322:4.97 323:4.09 324:3.52 325:2.99 326:2.57 327:2.43 328:1.95 329:1.70 330:1.51 331:1.29 332:1.18 333:1.08 334:1.73 335:1.29 336:1.29 337:1.17 338:1.17 339:1.12 340:1.09
seam ratio max/median = 28.36 (max 32.51 at f320, median 1.15, mean 2.34)
RUNG@313: |Δ| 0.48 = 0.42 × median (kick flares in this window before §16: f305 4.5, f320 42.5, f334 4.5)
```

**Seam** (`SEAM_L = 1.478`, §16's own level, which lands a rung change at frame 313 — the accept file's default 1.3
lands none in the shot window, in its run as much as in mine):

| | §16 / `accept/v0.2` | this pass | |
|---|---|---|---|
| **rung change `\|Δ\|` at f313** | **0.85** | **0.48** | 44 % **quieter** ✔ |
| same, as × the window median | 0.51 × | **0.42 ×** | still far below an ordinary frame ✔ |
| max/median over 301..340 | 27.91 (at `SEAM_L` 1.3) | **28.36** | **+1.6 %** ✔ within 10 % |
| the f320 kick flare, absolute | 42.45 | 32.51 | −23 % (the kick lifts *headroom*, so a bright field moves less) |
| ordinary-frame median | 1.52 | 1.15 | −24 % |

The rung change is still **quieter than an ordinary frame**, which is the property §16 bought, and this pass is
quieter on every number than both `master` and the first pass (whose field carried the kick additively and pushed
the flare to 65.8).

**Cost** — HARNESS "Bench protocol", `q` pinned .95, 8 s settle, `bench(6,300)` discarded then 3 × interleaved with
`bench(0,300)`, medians; `master`'s colour pass re-benched **on this machine in the same session, alternating**,
because the same build moved 1.58–2.77 ms across the session:

| build | interleaved ratios feigen/NAV at `&feig=3.6` | median |
|---|---|---|
| `master` (44ee899), 3 pairs, this session | 0.618 / 0.647 / 0.680 | **0.647** |
| **this pass**, 5 pairs, alternating with the above | 0.640 / 0.644 / 0.650 / 0.671 / 0.747 | **0.650** |
| (first pass, earlier in the session: 7 pairs) | 0.603 … 0.672 | 0.649 |
| (`master`, 5 pairs earlier in the session) | 0.535 … 0.637 | 0.619 |
| `accept/v0.2/feigen-bench-accept.txt` (1.14 / 1.90 ms) | — | 0.600 |

**+0.5 % against the same-session interleaved control — the gate the orchestrator ruled on, comfortably inside 5 %.**
Against the v0.2 accept file it is +8.3 %, but that file was recorded on a much quieter machine (its FEIGEN absolute
is 1.14 ms against 1.58–2.77 here) and the ratio to NAV is itself only good to a few per cent across sessions —
which is why the control build was re-benched beside it. A tricorn flip: first two renders 17.6 ms wall / next 60
mean 3.96 ms (§16: 13.4 / 2.62 on its quieter machine) — the same shape.

### 7. Montage — `tools/work/feigen-oklch-ab.jpg` (master left, this pass right; f360, f840, `&feig=3.6` f360, house 30 s)

**All four tiles now show the same L distribution: a bright field at the 0.72 plateau, a dark rim hugging every
piece of boundary, and a black set** — which is the acceptance the orchestrator set for this change, and it holds
across a 250× range of view width.

- **f360 (arrival, whole set in view).** Master: a neon-green DE glow hugging the boundary on black. Mine: the set
  and its fringe are hard black, a dark halo about a dozen pixels wide follows every filament, and the open
  exterior is a **binary-decomposition fan in colour** — concentric Green's equipotential arcs (now the ±0.08
  ripple) crossed by radial cells of constant hue, each cell splitting in two at every level set outward. That is
  `ea = arg(z_n)` behaving exactly as it should: iso-hue lines *are* external-ray segments, and the cells double
  per doubling of the potential. The hues visibly **pinch along the antenna to the left of the set** — the 1/2 ray
  and the Misiurewicz tips on the real spine are where whole fans of cells converge to a point — and around the
  root of the period-2 bulb, where the wake rays 1/3 and 2/3 squeeze the cells between them.
- **f840 (post-drop, L1.55).** A bright plateau carrying the cells and the level-set ripple, the dendrite antenna
  and the cardioid as clean black with their rims, and the right-hand third — the interior of the period-2^n
  component — as the low-chroma interior shading. The drop reads: `uInvert` has turned the wheel and the headroom
  lift has raised the plateau; nothing is white.
- **`&feig=3.6` f360 (deep).** The tile that makes the case. Master is a flat blown-out green field with the
  dendrites barely separable. Mine has every filament of the Feigenbaum dendrite crisp and black, each with its own
  grey rim, against the bright plateau in the gaps — **the black boundary holds at 3.6** and the rim is the same
  handful of pixels it is at the arrival depth, because `d` is scale-free. The cost is colour: the view subtends
  too little external angle to show much hue (§5).
- **house 30 s (`fake=0`, real extractor, L2.48, q 0.646).** The same structure on the real synth, with the cells
  visible in the open gaps top-left. `errs []`, `nonFinite []`.
- **The music still reads.** The kick is the headroom lift (the f320 kick flare is |Δ| 32.5 between consecutive
  frames), the drop is the lift plus the half-turn hue flip plus §16's one-δ depth jump, `uHat` and `sp²` drive the
  ±0.08 level-set ripple, `uMidS` still smudges the spectrogram's past off the boundary, `uAlive` still fades to
  black in silence.
- **One thing for the orchestrator that is not mine to change:** `post.bloom.thr` is 0.3, tuned in §15/§16 against a
  picture whose bright pixels were thin filaments. The bright pixels are now broad plateaux, so most of the frame
  is above the threshold and the bloom softens the whole image — the milky look in the f360/f840 tiles is mostly
  that, not the colouring. Raising it (≈ 0.6) would bring back the crispness the readback shows is there. I left it
  alone because the brief limits `index.js` to uniforms and help.

### 8. `help`
Three depths present and non-empty (`check.js` enforces); `help.feats` has all 18 `feats` keys, `feats` unchanged.
`help.why` gained, verbatim:

> And the colour is not a palette laid over it: hue is the external angle, lightness the Green's potential, chroma
> the distance estimate — the three coordinates the field already carries. A ray landing on a wake is a line of
> constant hue, a level set of the potential a line of constant lightness, and the edge stays a pixel wide however
> deep you fall, because the distance to the set draws it and not a filter.

*(Note for the orchestrator: the brief prescribes this sentence verbatim, and it is now half a step from the code —
lightness is driven by the distance and the potential rides it as the ±0.08 level-set ripple. It is still true that
a level set of the potential is a line of constant lightness, because the ripple is a function of `lG` alone. If
you want the sentence to match the code exactly, "lightness the Green's potential" would become "lightness the
distance, rippled by the Green's potential" — your call, since the wording was specified.)*

### 9. Real path, 45 s
```
$ PORT=8782 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"…"}]'
EVAL JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS}) => "{\"bad\":[],\"errs\":[]}"
```
`[]`, `[]`, and **0 `[EXC]`** lines.

## 3. The first pass, and why it was wrong

The first pass (commits `d8b27b0` + `e12d666`) drove L from the **Green's potential**:
`L = 0.03 + 0.62·tanh(sqrt(max(−lG,0))/10)`, bright near the set and dark outward, following the brief's prose over
its printed formula. Its numbers, for the record: md5s `3f239c77…` / `5510a087…`; 0 clipped on the same four frames
(after the `min(L,1.)` fix — before it, 13 of 921600 at f840 `&feig=3.6`); banding at the fake f360 view
357/305/354 → 375/590/573; bench ratio median 0.649 over 7 pairs against a same-session `master` median of 0.619
(+4.8 %); seam at `SEAM_L` 1.478 |Δ| 0.82 = 0.41 × median, f320 kick flare 65.8.

Two things were wrong with it, and the orchestrator was right on both:

1. **`−lG` is large over the *whole* of a deep view** (34 … 478 at `&feig=3.6` against 0 … 85 at the arrival
   depth), because the potential's scale is tied to the escape count and so to the depth. Any monotone map of
   `−lG` therefore grades the two depths differently — mine made `&feig=3.6` uniformly dark, which is the failure
   the brief's "does not saturate" clause was trying to prevent. `d` does not have this problem *because `dec()`
   already divides it by the view width*: it is the one decoded quantity that is scale-free, so it is the one that
   can carry the grade through a dive whose whole premise is self-similarity.
2. **The bulk of the exterior sat at L 0.1 … 0.5**, where `cMax(L)` is a third to two thirds of 0.11, so the hue
   cells came out pastel on grey. Putting the field on the 0.72 plateau puts it exactly where the chroma budget is
   full. The banding count is the objective trace of that: 590/573 → 781/768 on the same two rows.

The prose ("bright near the set, darker outward") and the printed formula (`0.72 − 0.5·tanh(…)`, dark near the set)
still contradict each other in the brief; the formula was the intent, and the fix generalises it — the same
"bright field, darkening into the set, black at the edge" shape, but driven by the quantity that makes it hold at
every depth.

## 4. (a) Friction log — questions the docs did not answer, and every guess

1. **The brief contradicts itself on the direction of L** — prose vs printed formula (above). I guessed the prose;
   the orchestrator ruled for the formula and for driving it from `d` instead of `lG`. Resolved, but the brief
   should be corrected before anyone re-reads it.
2. **`0.11` is not in gamut at most lightnesses.** The brief says "C ≤ 0.11 at L ≈ 0.7 is in gamut at every hue …
   above that the chunk clips toward grey" and then asks for **0** clipped pixels. Both cannot hold with a flat
   `C = 0.11`: at L 0.30 the tightest hue tolerates 0.051, at L 0.90 it tolerates 0.048. Resolved by deriving the
   `cMax(L)` envelope (§1). CONTRACTS §1.14's own sentence is accurate; the brief read it as if it held at every L.
3. **`hooks.clipdbg` had to grow a second mode**, and then to change its encoding. The brief specifies mode 1
   (`okClip` → `o.r`). Choosing the L knee needed the actual distribution of `−lG` and of `d`, which nothing in the
   repo exposes, so mode 2 writes `(−lG)/512` in red and `esc` in blue; green started as `dpx/8` and became
   `(log2 d + 24)/24` once it was clear `d` spans twenty doublings and the linear encoding saturated. Mode 1 is
   exactly as specified; mode 2 is additive and documented in `colour.js` and in `hooks`.
4. **`scene.draw()` into a readback target is not documented anywhere.** Acceptance 4 says "`ctx.mkTarget(w, h, true)`
   + `readPixels`" but not how to get the scene to draw into it. Guess, from `CARD.bench`'s existence and
   CONTRACTS §1.1's `draw()` contract: `CARD.REG[6].scene.draw(T, {w, h})` from an `{eval}` at the pinned `CLOCK=1`
   frame. It works, is deterministic, and is how every readback number in this report was taken; HARNESS's
   "`window.CARD`" list could say so.
5. **The brief's banding test is under-specified.** "a row of pixels at fixed `lG`, i.e. a horizontal line at the
   fake f360 view" — a horizontal line is *not* an equipotential, and the centre row runs through the interior,
   where the new colouring is deliberately one hue. I reported three rows at three views rather than pick the
   flattering one. Also: the shots are **JPEG**, so counting distinct triplets on a `tools/work/*.jpg` would count
   the codec; the counts here come from the RGBA8 readback.
6. **`SEAM_L = 1.3` has no rung change in the shot window**, in the accept file as much as in a fresh run, so the
   brief's "seam ratio at `RUNG@` frames within 10 % of the accept file's" compares two numbers that are both
   absent. I used 1.478 (§16's level) for both passes; the orchestrator is making it the tool's default.
7. **A ratio to NAV is not drift-immune either.** The brief's ±5 % gate is against a file recorded on a different
   day; the same build moved 1.58 → 2.77 ms within one session here. The only comparison I trusted was `master`
   re-benched on this machine, alternating with mine (§6) — which the orchestrator has confirmed is the gate.
   HARNESS's "Bench protocol" rule 3 could say that *the pair ratio itself* drifts a few per cent, so a 5 % gate
   needs the control build re-benched in the same session, not a file.
8. **`index.js` is at the line cap.** It was 348 lines before this change and 358 after; getting back under 350
   needed merging four `gl.uniform1f` calls onto two lines (CONTRACTS §0 says "one statement per line", which the
   file already breaks at its `texParameteri` pair) and trimming the new help sentence. Any further work in that
   file will have to split it.
9. **A `git checkout HEAD -- <file>` ate an uncommitted fix.** Mid-session I benched `master`'s colour pass by
   checking its two files out over mine, and the restore silently dropped a not-yet-committed change. Caught by
   grepping for it before the next bench; every acceptance number here was taken with the committed tree, and the
   second pass was committed *before* the A/B benches for exactly this reason.
10. **Where the bench file lands.** `tools/feigen-bench.sh` writes `tools/accept/${ACC:-v0.3}/`, outside the two
    paths this brief allows me to touch. I let it write (`feigen-bench-oklch.txt`) and left it **untracked** rather
    than commit it; it is quoted in full above.
11. **`post.bloom.thr` is now mistuned by the change** (§7). Not touched — `post` is neither a uniform nor help.

## 5. (b) Forbidden files

Tempted twice, opened neither.
- **`assets/core/quality.js` / `core/gl.js`** — when the first pass's cost came out +5 %, to find out whether
  `mkProg` does anything with the prepended chunk. Answered instead by data: re-benching `master` on the same
  machine, and by one attribution run with the `okClip` call removed from the debug branch.
- **Another scene that uses `ctx.oklch`** — to copy an idiom. There is none yet (this is the first consumer), and
  `tools/oklch-smoke.js`, which the brief allows, shows the whole calling convention.
- Read and **not** modified: `assets/core/oklch.js`, `assets/math/oklab.js` (imported read-only in a `node -e` to
  compute the `cMax` envelope and its worst-case ratio), `tools/check.js`, `tools/oklch-smoke.js`,
  `tools/feigen-bench.sh`, `tools/scene-md5.sh`, CONTRACTS §0/§1.1/§1.2/§1.5/§1.10/§1.13/§1.14, HARNESS, DECISIONS
  §16/§17. No file outside `assets/scenes/feigen/` and this report was written.

## 6. (d) Things wrong in the docs

- **The brief's L example formula contradicts its own prose** (friction 1), and **its flat `C = 0.11` cannot give 0
  clipped pixels** (friction 2). CONTRACTS §1.14 is correct as written, but it would help to add one line:
  *"0.11 is the budget at L ≈ 0.7 only — `maxChroma` is ≈ 0.170·L below L 0.75 and falls to 0 at L 1, so a scene
  whose L moves should scale C with L or let `okClip` do it."*
- **`okClip(h, L, C)` with `L > 1` returns 0, not 1.** Nothing says so. It is the correct answer (no chroma is in
  gamut there) but it reads as "this pixel was clipped" in exactly the test CONTRACTS invites you to write, while
  `palOK` clamps L and renders white. Worth a clause in §1.14: *"`okClip` does not clamp L; `palOK` does. Clamp L
  before you use `okClip` as a gamut probe."*
- **`tools/feigen-bench.sh`'s default `SEAM_L = 1.3` measures no seam** (friction 6) — being fixed on master.
- **HARNESS "Bench protocol"** could say that the NAV-interleaved *ratio* drifts a few per cent between sessions
  (friction 7), and **"`window.CARD`"** could document `REG[id].scene.draw(target, {w, h})` as the supported way to
  render one scene into a readback target (friction 4).
- Everything else ran exactly as printed: `scene-md5.sh`, `feigen-bench.sh`, `cdp.js` with `CLOCK=1` / `GPU=1` /
  `NOAUTO=1` / `OUT=` / `SEAM_L=`, `montage.py`, `check.js`. No command failed as written.

## 7. (e) `feats` and `post`

`feats` **unchanged** (18 entries, no read added or dropped):
```
arc, regularity, clarity, calm, bpm, lvl, tension, alive, kick, dropEvt, sectionEvt,
seed, flow, flowMid, bass, dropEnv, hat, midS
```
`post` **unchanged**: `{ fb: { decay: 0.55 }, bloom: { thr: 0.3 }, kaleido: 0 }` — but see §7 of the acceptance:
`bloom.thr` is the one number this change makes stale, and it is the orchestrator's to move.

## 8. For the orchestrator

- **Re-base**: FEIGEN f360 `820981ab01949bf83d541af44f8512c7`, f840 `2718d3558770991806ca730cc95fb00a` (identical
  with and without `&histfull=1`). Every other scene's md5 is unchanged from the tag.
- **Cost**: +0.5 % of the NAV ratio against `master` re-benched in the same session, alternating (0.650 over 5 pairs
  against 0.647 over 3). `bench(6,300)` 1.97 ms at `&feig=1.2` and 2.77 ms at `&feig=3.6` in a loaded page — the
  spread is the machine, not the depth; the four dedicated pairs at 3.6 ran 1.62–1.78 ms.
- **Seam**: better than `master` on every number at `SEAM_L = 1.478` — rung change |Δ| 0.48 (§16: 0.85), 0.42 × the
  window median, max/median 28.36 against the accept file's 27.91.
- **Two loose ends**: `post.bloom.thr` 0.3 is now mistuned (§7 of the acceptance), and the `help.why` sentence the
  brief prescribes says "lightness the Green's potential" where the code now says "lightness the distance, rippled
  by the Green's potential" (§8 of the acceptance). Both are one-line calls I did not want to make unasked.
- **Still true from the first pass**: the deep view is close to monochrome (§5) — `H ← ea` on a view that subtends
  little external angle. Worth re-checking when `&linear=1` lands.
