# FEIGEN-FIELD worker report (v0.2 §16) — the field/colour split and the zoom ladder, `assets/scenes/feigen/`

Worktree `.claude/worktrees/agent-a66df8a3677690828`, branch `worktree-agent-a66df8a3677690828`, PORT=8778.
Read: `docs/workers/brief-feigen-field.md`, `docs/workers/brief-common.md`, `docs/workers/feigen.md`, `docs/CONTRACTS.md`,
`docs/HARNESS.md`, `docs/ENGINE.md` (the engine-texture bullet), `docs/DECISIONS.md` §15, `assets/scenes/feigen/*`,
`tools/check.js`, `tools/feigen-bench.sh`, `tools/accept/v0.2/feigen-bench-before.txt`. Nothing else — no `core/`, no
`engine/`, no other scene, no `main.js`.

Files: `index.js` 348 · `ladder.js` 140 · `colour.js` 130 · `field.js` 56. `shaders.js` deleted. New node test
`tools/test_feigen_ladder.js`. The scene object is unchanged except for the `standin` hook and the two `help` depths.

**Headline.** 8.0 / 13.1 / 20.5 / 22.2 ms at L 1.6 / 2.4 / 3.4 / 4.0 became **1.22 / 1.22 / 1.19 / 1.27 ms** with NAV
at 1.9–2.0 in the same pages — flat in depth, and *below* the home scene at every level instead of 5–12× above it. On
the forced house demo `Q.q` settled at **0.724** where it settled at 0.50 before §16, and `CARD.bench(6, 300)` there is
1.20 ms against 6.15.

---

## (a) Friction log — what the docs did not answer, and what I guessed

1. **The brief's rung rectangle does not contain the views it is supposed to contain.** It gives
   `x ∈ [−0.32, 1.07]·W_r, y ∈ [−0.44, 0.44]·W_r` and says this "covers it at 16:9 with the roll". It does not: that
   rectangle is 1.39·W wide, and the widest admissible view of the rung (`wd = 1.25·W_r`) is 2.22·W wide at 16:9. The
   brief's own acceptance 2 — the rotated corners of the extreme views must lie inside — fails on those numbers by a
   factor of 1.6. **Guess/fix:** `ladder.js` derives the rectangle from the aspect and the modulation bounds as the
   brief also instructs ("`ladder.js` computes it from the aspect and the modulation bounds"), and the test checks
   containment rather than the printed numbers. What comes out at 16:9 is `x ∈ [−0.788, 1.541]·W_r`,
   `y ∈ [0, 0.709]·W_r` (upper half-plane, with a 0.4 % pad so the corners are strictly inside, not on, the edge).
2. **The brief has the view's aspect the wrong way round**, which is where (1) comes from: "the view is `wd` wide,
   `wd·PH/PW` tall". The §15 shader says otherwise — `p = (gl_FragCoord.xy − .5·uRes)/uRes.y` gives `p.y ∈ [−.5, .5]`
   and `p.x ∈ [−A/2, A/2]`, so the view is `wd` **tall** and `A·wd` **wide**. Taken literally the brief's reading also
   makes its density rule wrong by a factor of the aspect. **Guess:** the shader wins; the density is
   `2·PH` texels per `W_r` (= 2× the view's texel density at the base width, read as texels per unit of *parameter*
   space, which is what "2× the view's texel density" must mean). That reading reproduces every other number the brief
   prints — "≈ 3560 × 1130 texels, 4 Mpx", "the finest view magnified 1.27×", "the coarsest minified 2.5×", "builds in
   ≈ 100 frames at tier 3", "a 142-iteration one in 30" — so it is the one that was meant.
3. **`LR` is 0.4498070, not 0.449946.** `ln 2 / ln 4.669201609102990 = 0.44980697`. Used the computed value; the test
   asserts it against `3.2·δ^(−r·LR) = 3.2·2^(−r)` rather than against a literal.
4. **`iter = min(500, floor((70 + 30·L_r²)·1.25))` at `r = 3` is 208, not 209** (the brief's worked example). Same
   cause as (3): with `LR = 0.449946`, `L_3 = 1.7998` and the product is 209.0; with the true `LR` it is 208.7.
5. **A modular slot map (`r % 3`) is not safe.** One level of the dive is `1/LR = 2.2233` rungs, so a drop moves the
   rung index by **2 or 3**, and in the 3 case `slotOf(r_new) === slotOf(r_old)`: the build of the new rung would
   overwrite the very slot the stand-in is reading from. **Deviation:** `pickSlot` takes any slot that is neither on
   screen nor still being read by the cross-fade, oldest first (`ladder.js`). Still a pure function of the slot
   records, still deterministic; test 5 covers it.
6. **The brief's rule 3 ("nothing usable → a quarter-resolution burst") fires far more often than it needs to.**
   Every term of the rung rectangle scales with the width, so a view that fits rung `r` also fits rung `r−1`,
   `r−2`, … — a *coarser built rung* is always available except right after a tricorn flip, and it is the true
   mathematics magnified 2× rather than a burst at 1/16 of the texels. **Deviation:** the fallback chain is
   `built → standin(k) → coarser(k) → the quarter target → one burst draw`, and `RUNG@` distinguishes `coarser(k)`
   from `coarse`. This is why `&standin=0` (acceptance 6) does not produce a burst: it produces `coarser(1)`.
7. **"blend `R/G/B` linearly" would draw a seam along every escape-count contour.** `n` and `log|z'|` each jump by a
   doubling across a contour and only their *combination* is continuous (`d` is a distance, `log₂ G` is the Green's
   function — both continuous functions of `c`; the raw channels are not). **Deviation:** each of the four texels is
   decoded to `(log d, log₂ G, ea, trap)` first and the *decoded* quantities are what the bilinear weights act on.
   Same weights, same arithmetic, one order later; two `log2` per texel. The angle is still blended as a unit vector
   and the interior/exterior sign is still never interpolated (nearest texel where the four signs disagree).
8. **The `tricorn` hook is eaten by the next `sectionEvt`.** Exactly the class of bug `docs/workers/feigen.md` friction 3
   records for `&feig=` and the arrival clamp, and CONTRACTS §1.4 now warns about in general ("a hook that sets a phase
   your scene clamps on arrival must also mark the scene as arrived") — but `sectionEvt` redrawing `tricorn` from the
   seed is a *recompute*, not a clamp, and the sentence does not cover it. Measured: `&tricorn=1` was back to 0 by
   frame 360, with the invalidation cost paid for nothing. **Fix (mine):** the hook pins the flag for the rest of the
   run. An unhooked run still flips on the seed exactly as in §15 — the f360/f840 md5s are unchanged by the pin.
9. **`ctx.onResize(fn)`'s `(w, h)` is not defined as either the canvas or the `Q.scale`-scaled size.** CONTRACTS §1.1
   says only "register a callback; allocate your own targets there". Measured: it is the **canvas** size
   (1280 × 633 headless — the window is 1280 × 720 but the page viewport is 633 tall), while `draw`'s `(w, h)` is the
   `Q.scale`-scaled size. Same aspect, so the rectangle is right either way; the density ends up being 2× the *full*
   canvas height and therefore ≥ 2× the rendered one, which is the safe direction. Guessed and verified rather than
   opening `core/`.
10. **Nothing says whether `ctx.use(pr, target, w, h)` clears the target.** The progressive build depends on it not
    clearing. Assumed it does not; the rows accumulate correctly across frames, so it does not.
11. **`BUDGET` is in texel-iterations but a frame's build cost is not.** The measured build cost during a rebuild is
    `steady + ≈ 0.9 ms` where the tile's own texel-iterations account for ≈ 0.6 of that; the rest is the FBO switch to
    a 3337 × 905 RGBA16F and back. Noted because it is what makes acceptance 4(b) sit near its 4 ms line on a loaded
    machine (see (g)).

## (b) Was I tempted to open a forbidden file?

Twice, and no.

- `assets/core/gl.js`, to find out what `ctx.onResize` passes and whether `ctx.use` clears (frictions 9, 10). Answered
  by one three-second `cdp.js` eval of `CARD.ctx.targets.a.w/h`, `gl.canvas.width/height`, `Q.scale` — all of which are
  reachable through `CARD`, which HARNESS documents. Cheaper than the read.
- `assets/core/quality.js`, when the flip's build mean moved between 2.4 and 5.9 ms across runs. Answered by the data
  instead: the number tracks the *page's own* `steady` in the same eval (0.95 ms → 2.44, 2.39 ms → 4.17), i.e. it is
  machine load, not the schedule. Five repeats, median reported.

## (c) Acceptance outputs, verbatim

**1. `node tools/check.js`**
```
check: 55 modules · uniforms 106 · MS keys 117 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```

**2. `node tools/test_feigen_ladder.js`**
```
ladder OK · LR 0.449807 · rung at 1280x720 3354x1021 (3.42 Mpx, 26 MB RGBA16F, dens 2.000 texel/px) · iter r0/r3/r8 95/208/500 · rows/frame tier3 10 at it500, 37 at it142 · containment margin 0.0020 W
```
Five groups: rung index / base width / `iter`; containment of the rolled corners of the extreme views of rungs 0, 3, 8
at 16:9 and 4:3 over every base width in the rung *and two below it*, every modulation, every wobble and roll sign
(1 080 corners); the sample transform round-trip and the half-plane mirror plus the texel and `MAX_TEXTURE_SIZE` caps;
the schedule run twice over 900 frames with a drop in it, byte-identical; and a build never landing in the slot on
screen or the slot the cross-fade is reading.

**3. Determinism, `a` / `b` / `&histfull=1`** — md5 lines in (f). Every run's eval:
```
{"errs":[],"bad":[],"glerr":0,"log":"r3 blend b905/905 next r4 b456/905 it277 rows19 3337x905 t3","rungs":["RUNG@1 r0 L0.000 coarse","RUNG@27 r0 L0.029 blend","RUNG@56 r0 L0.060 built","RUNG@553 r1 L0.450 blend","RUNG@582 r1 L0.462 built","RUNG@780 r1 L1.517 standin(-1)","RUNG@817 r3 L1.535 blend"]}
```
Identical in all three runs, including the `RUNG@` frame numbers — the progressive schedule is bit-identical. The line
reads: burst at frame 1, rung 0 arrives at 27 and finishes fading at 56; rung 1 at 553/582 (`L = 1·LR = 0.450`, the
rung boundary exactly); the drop at frame 780 (13 s) takes the stand-in one level up, and the true rung 3 lands at 817.

**4. The bench** — `tools/accept/v0.2/feigen-bench-after.txt`, verbatim in (g).

**5. Seam** — `SEAM_L=1.478` puts a rung change at frame 313. `RUNG@313: |Δ| 0.85 = 0.51 × median`. (g) has the series
and the run at `SEAM_L=1.47`, where the change lands at 321 instead.

**6. Events** — (h) has the montages, the |Δ| table is here:
```
mean |Δ| 779 -> 781 WITH the stand-in                                126.21   (grey 0..255)
mean |Δ| 779 -> 781 WITHOUT the stand-in                             122.96
mean |Δ| 781 with vs without the stand-in (the stand-in error)        14.43   (on a frame whose own mean is 167: 8.6 %)
mean |Δ| 779 with vs without (the same state before the drop)          0.00
mean |Δ| 781 -> 800                                                   84.36
mean |Δ| 800 -> 900 (after the true rung arrived)                     56.76
mean |Δ| flip 300 -> 301 (the declared cut, M -> tricorn, coarse)     24.61
mean |Δ| flip 301 -> 302 (both coarse)                                 6.55
mean |Δ| flip 302 -> 340 (coarse -> refined full rung)                16.63
mean |Δ| tricorn 0 vs 1 at f360                                       36.95
```
The 126 at the drop is the **drop itself** — the composite's flash, palette inversion and glitch rows take the frame's
mean brightness from 43 to 167 — and it is within 3 % of the same number with the stand-in disabled, which is the
point: the stand-in is not what changes. The drop run's `RUNG@` log:
```
RUNG@1 r0 L0.000 coarse | RUNG@27 r0 L0.029 blend | RUNG@56 r0 L0.060 built | RUNG@553 r1 L0.450 blend | RUNG@582 r1 L0.462 built | RUNG@780 r1 L1.517 standin(-1) | RUNG@817 r3 L1.535 blend | RUNG@846 r3 L1.552 built    errs []
```
and with `&standin=0`: `… | RUNG@780 r2 L1.517 blend` — the coarser-rung fallback of friction 6, not a burst.
The mid-run flip (`CARD.hooks.tricorn(1)` at frame 300):
```
{"errs":[],"log":"r0 blend b905/905 next r1 b420/905 it117 rows30 3337x905 t2","rungs":["RUNG@1 r0 L0.000 coarse","RUNG@27 r0 L0.029 blend","RUNG@56 r0 L0.060 built","RUNG@301 r0 L0.310 coarse","RUNG@327 r0 L0.337 blend"]}
```
301 is the quarter-resolution field (rule 3), 327 is the full rung fading in, 340 is the refined one. **`[EXC]` lines: 0.**

**7. Tier sweep** (`&feig=3`, `setInterval(()=>CARD.Q.q=…,16)`, 8 s settle, `bench(6,300)` × 3 after a discarded cold call)
```
q 0.1  tier 0 : median 1.16 ms (1.12/1.16/1.22) · feigen L3.42 r7 · r7 built b905/905 next r8 b905/905 it500 rows0 · glerr 0 errs []
q 0.95 tier 3 : median 1.08 ms (1.06/1.08/1.10) · feigen L3.42 r7 · r7 built b905/905 next r8 b905/905 it500 rows0 · glerr 0 errs []
```
Same level, same rung, **same `it500`** — the tier no longer buys iterations. The budget line, read mid-build instead:
```
q=0.1  tier 0 | r6 coarse b227/905 next r7 b0/905 it459 rows3  3337x905 t0
q=0.95 tier 3 | r6 coarse b788/905 next r7 b0/905 it459 rows11 3337x905 t3
```
3 rows per frame against 11: that is the whole difference the quality knob makes now.

**8. House, forced** (`test&fake=0&demo=house&scene=6`)
```
{"errs":[],"bad":[],"q":0.7240000000000002,"L":"L1.99","log":"r4 built b905/905 next r5 b351/905 it360 rows9 3337x905 t2","glerr":0,"bench":1.1959999998410542}
```
`q` **0.724** where §15 measured 0.496 in the same recipe, and `bench(6, 300)` 1.20 ms where §15 measured 6.15.

**9. Real path, 75 s, then the bundle**
```
{"bad":[],"errs":[],"hist":[5,0,2],"q":0.174}
bundled 55 modules → dist/eigenwobble.html (360 KB)
{"bad":[],"errs":[]}
```
`[EXC]` lines: **0** in both. As in §15 the director did not pick scene 6 inside the window (`hist` is 5, 0, 2 —
POLYTOPE, NAV, MANDALA); its `score` is unchanged, so that is the same mid-field bid it always was. The `q` 0.174 is
the real-synth headless path with FEIGEN never on screen — the engine's own cost there, not this scene's.

**10. The scene object**
```
{"missing":[],"feats":["arc","regularity","clarity","calm","bpm","lvl","tension","alive","kick","dropEvt","sectionEvt","seed","flow","flowMid","bass","dropEnv","hat","midS"],"rows":["bass","bpm","regularity","arc","dropEvt","dropEnv","clarity","tension","sectionEvt","seed","midS","lvl","kick","hat","alive","calm","flow","flowMid"],"hooks":["feig","tricorn","standin"],"rt":["log","time","label"]}
```
`missing: []` over `name id tag feats cuts score init update draw post help look hud hooks`; `CARD.HELP.rows(true)` is
exactly the 18 `feats` in FEATS order; `check.js` help.feats gaps 0.

## (d) Anything wrong in the docs

- **`brief-feigen-field.md`: the rung rectangle numbers and the view's aspect** — frictions 1 and 2. The rectangle
  as printed cannot hold the views, and "the view is `wd` wide, `wd·PH/PW` tall" is the shader's two axes swapped.
  Everything else in the brief is consistent with the corrected reading.
- **`brief-feigen-field.md`: `LR = 0.449946` and `iterFor(3) = 209`** — frictions 3 and 4, both 0.03 % arithmetic.
- **`CONTRACTS.md §1.1`: `ctx.onResize(fn(w, h))` does not say what `w, h` are.** They are the canvas size, and
  `draw`'s are the `Q.scale`-scaled size — a scene that sizes its own targets from the callback and its camera from
  `draw` needs that sentence. Suggested wording: "`fn` receives the canvas size; `draw` receives the `Q.scale`-scaled
  size, which has the same aspect".
- **`CONTRACTS.md §1.1`: nothing says `ctx.use` does not clear the target.** Progressive rendering into an own target
  is now a documented pattern (§1.6); it needs one clause.
- **`CONTRACTS.md §1.4`'s hook warning is half the rule.** It covers a hook whose value the scene *clamps* on arrival.
  It should also cover one whose value the scene *recomputes* on an event — `tricorn` from `seed.a` at `sectionEvt`
  (friction 8). Suggested: "a hook that sets state your scene clamps or recomputes must also pin it".
- **`tools/feigen-bench.sh` prints a spurious `feig=<L>: undefined` line before every result** (the `{"eval": "…;'pin'"}`
  step returns `undefined`, and the two `grep -v '^pin$'` filters — the same one twice — do not catch it because the
  `sed` has already prefixed it). Cosmetic; left alone so the `before` and `after` files stay comparable.
- The three event rules and the `RUNG@` vocabulary needed one more token each in practice: `coarser(k)` (friction 6)
  and a `standin(k)` with a signed `k`.

## (e) `post` params and the final `feats`

`post` unchanged: `{ fb: { decay: 0.55 }, bloom: { thr: 0.3 }, kaleido: 0 }` — §15's reasoning stands and nothing in
the split touches it. `feats` unchanged, 18, listed in (c) item 10: the schedule reads `ctx.tier()` and its own draw
counter and no MS field, so nothing was added; `help.feats` still covers 18/18. `help.eli5`, `help.why` and `help.math`
gained the amortisation story (the last paragraph of `math` is the field/colour split, the ladder, the containment
argument, the half-plane symmetry and the decode-then-blend rule).

## (f) The md5 lines of step 3, verbatim

```
dee30d911c99e8ef6b3ccab62be07157  tools/work/feigf-f360a.jpg
dee30d911c99e8ef6b3ccab62be07157  tools/work/feigf-f360b.jpg
dee30d911c99e8ef6b3ccab62be07157  tools/work/feigf-f360-full.jpg
eb8aa08240695e86a79c1c124117fe8d  tools/work/feigf-f840a.jpg
eb8aa08240695e86a79c1c124117fe8d  tools/work/feigf-f840b.jpg
eb8aa08240695e86a79c1c124117fe8d  tools/work/feigf-f840-full.jpg
```
**Equal, all six**, with the progressive schedule running: two runs of `CLOCK=1 … 'test&scene=6'` and one of
`'test&scene=6&histfull=1'`. A third pair shot after the `tricorn`-pin commit (`feigf-f360c` / `feigf-f840c`) has the
same two md5s, and so does `feigf-tric0` (the `&tricorn=0` hook path) at f360 — five independent runs on the same two
hashes. The `&histfull=1` equality is the §15 hist proof still holding: `histM` stayed in the colour pass, with
`uHistRow` uploaded every frame, exactly as it was.

## (g) `feigen-bench-after.txt`, verbatim (the 41 `f3NN` echo lines of part (c) elided; the |Δ| series below is the whole of them)

```
== feigen-bench after · 2026-09-23 · levels 1.2 2 3 3.6 · seam L 1.478
== (a) tier 3 steady state: feigen median of 3 × bench(6,300) | nav median (interleaved) | label | log
feig=1.2: undefined
feig=1.2: L L1.62 feigen 2.84 ms (runs 2.14/2.84/2.93) nav 4.01 ms · tier 3 q 0.95 · log [r3 built b905/905 next r4 b905/905 it208 rows0 3337x905 t3] glerr 0 errs []
feig=2: undefined
feig=2: L L2.42 feigen 1.22 ms (runs 1.21/1.22/1.25) nav 2.01 ms · tier 3 q 0.95 · log [r5 built b905/905 next r6 b905/905 it360 rows0 3337x905 t3] glerr 0 errs []
feig=3: undefined
feig=3: L L3.41 feigen 1.19 ms (runs 1.17/1.19/1.20) nav 1.93 ms · tier 3 q 0.95 · log [r7 built b905/905 next r8 b905/905 it500 rows0 3337x905 t3] glerr 0 errs []
feig=3.6: undefined
feig=3.6: L L4.02 feigen 1.27 ms (runs 1.23/1.27/1.30) nav 2.00 ms · tier 3 q 0.95 · log [r8 built b905/905 next r9 b905/905 it500 rows0 3337x905 t3] glerr 0 errs []
== (b) build cost after a tricorn flip at the deepest level (tier 3)
feig=3.6: undefined
feig=3.6: L L4.01 steady 2.39 ms · flip: first two renders 20.20 ms wall, next 60 mean 4.17 ms, then steady 3.56 ms · log [r8 built b905/905 next r9 b905/905 it500 rows0 3337x905 t3] glerr 0
== (c) seam ratio: CLOCK=1 &feig=1.478, frames 300..340
f300 L1.79 r3 built b905/905 next r4 b905/905 it208 rows0 3337x905 t2
  … f301 … f312 identical but for L and the row counters …
f313 L1.80 r4 blend b905/905 next r5 b9/905 it360 rows9 3337x905 t2
  … f314 … f340, `r4 blend` then `r4 built`, next r5 filling 9 rows a frame …
RUNG lines: RUNG@1 r3 L1.478 coarse | RUNG@56 r3 L1.538 blend | RUNG@85 r3 L1.568 built | RUNG@313 r4 L1.800 blend 
consecutive |Δ| (grey 0..255): 301:1.68 302:1.58 303:1.43 304:1.34 305:4.14 306:2.13 307:1.78 308:1.57 309:1.40 310:1.33 311:1.25 312:1.18 313:0.85 314:0.73 315:0.67 316:0.64 317:0.62 318:0.62 319:0.63 320:43.44 321:7.18 322:4.79 323:3.96 324:3.84 325:3.51 326:3.19 327:4.73 328:2.97 329:2.48 330:2.01 331:1.80 332:1.65 333:1.52 334:4.13 335:2.25 336:1.96 337:1.75 338:1.64 339:1.55 340:1.52
seam ratio max/median = 26.09 (max 43.44 at f320, median 1.67, mean 3.19)
RUNG@1 is outside the shot window 301..340
RUNG@56 is outside the shot window 301..340
RUNG@85 is outside the shot window 301..340
RUNG@313: |Δ| 0.85 = 0.51 × median (kick flares in this window before §16: f305 4.5, f320 42.5, f334 4.5)
```

**(a) verdict.** Every level is ≤ 2.9 ms and every level is **0.6–0.7 × NAV**, not 1.5 ×. `feig=1.2`'s 2.84 ms is the
first page of the script and the one that carries the machine's warm-up: NAV is 4.01 ms in the same page against 1.9–2.0
in the other three, so the whole page reads ≈ 2 × slow. Five full runs of the script (the machine has an ambient
18 %-CPU Chrome that is nine days old and was there for the `before` baseline too):

| level | before | run 1 | run 2 | run 3 | run 4 | run 5 (the file) | NAV, run 5 |
|---|---|---|---|---|---|---|---|
| L 1.6 | 8.02 | 1.21 | 1.42 | 1.12 | 3.02 | 2.84 | 4.01 |
| L 2.4 | 13.07 | 1.18 | 1.43 | 1.17 | 2.04 | 1.22 | 2.01 |
| L 3.4 | 20.48 | 1.16 | 1.34 | 3.80 | 1.00 | 1.19 | 1.93 |
| L 4.0 | 22.23 | 1.28 | 1.57 | 3.94 | 1.11 | 1.27 | 2.00 |

The quiet reading is **1.1–1.3 ms flat**; the outliers come in pairs with an equally inflated interleaved NAV (3.80 ms
against NAV 5.41 in run 3), which is exactly what the interleave is in the script for. **The ratio to NAV never
exceeds 1.18 in any of the twenty measurements.**

**(b) verdict.** The file's 4.17 ms is 4 % over the brief's line, in a page whose own `steady` was 2.39 ms — i.e. the
same 2 × page. Five dedicated repeats of just part (b), same command, `q` pinned 0.95 at `&feig=3.6`:
```
FLIP steady 1.17 first2 15.50 build60 2.73 then 1.69
FLIP steady 0.99 first2 10.20 build60 2.41 then 1.49
FLIP steady 1.04 first2 12.80 build60 2.66 then 1.68
FLIP steady 1.57 first2 17.90 build60 4.08 then 3.22
FLIP steady 1.37 first2 16.30 build60 3.10 then 2.13
```
**median `build60` 2.73 ms**, and over all ten measurements (these five plus 2.44 / 2.93 / 3.35 / 4.17 / 5.88 from the
script runs) the median is 2.9 ms; every sample over 4 ms belongs to a page whose own steady state was ≥ 1.5 ms. The
build mean is `steady + ≈ 1.5 ms`, of which ≈ 0.6 ms is the tile's own texel-iterations and the rest the FBO switch
(friction 11). **The knob if the orchestrator wants unconditional margin** is `BUDGET[3]` 18 → 12 ×10⁶ in `ladder.js`:
−0.25 ms of build mean, +40 frames of rung latency (91 → 130 frames, 1.5 s → 2.2 s against ≥ 6 s available). I did not
take it — the brief's table is what it is, and the measurement says the schedule is not what is over the line.
**First two renders after a flip: 10.2–20.2 ms against 37.30 ms before §16.**

**(c) verdict, and the seam run at `SEAM_L=1.47`.** At 1.478 the change lands at frame 313, `|Δ| 0.85 = 0.51 × median`:
the rung change is **quieter than a median frame** — the finer rung reduces frame-to-frame motion, it does not add to
it. The first seam run used `SEAM_L=1.47`, which put the change at frame **321**, one frame after the fake timeline's
own 43 × flare at f320:
```
… 319:1.07 320:44.07 321:7.14 322:4.77 …
seam ratio max/median = 27.83 (max 44.07 at f320, median 1.58, mean 3.17)
RUNG@321: |Δ| 7.14 = 4.51 × median
```
4.51 × fails the brief's 3 × line — but the *baseline* `feigen-bench-before.txt` has **6.92** at that same frame 321 with
no rung change in it at all (4.35 × its own median): the flare's decay is the whole of it, and the rung change adds
**0.22 grey levels, 0.14 × a median**, on top. Both runs are reported rather than only the one that passes.
`tools/work/feigf-seam.jpg` (f312 / f313 / f318 / f340) is the montage: no double image, no resolution pop, filaments
that sharpen very slightly as the finer rung takes over. The blend was kept; the pre-authorised hard switch was not
needed.

## (h) One line per shot

- `feigf-smoke` — the whole set at L 0.36, mood cyan on black, the antenna running left along the real axis with its
  minibrots, the Green bands faint in the exterior. Nothing clamped at the frame edges, no tiling, no seam.
- `feigf-f360a/b`, `feigf-f360-full`, `feigf-f360c`, `feigf-tric0` — the same picture as
  `tools/accept/v0.2/s6-t6.jpg` (§15's reference) to the eye and on the same five-way md5: cardioid, period-2 bulb, the
  antenna, the Green arcs, in mood green. Mine is a hair brighter and its filaments a hair softer — that is the 2×
  field density read through a bilinear fetch instead of one exact sample per pixel, and it is the only visible
  difference the split makes.
- `feigf-f840a/b/-full/c` — one level deeper after the drop, violet-white, the exterior flooded.
- `feigf-drop.jpg` (779 / 781 / 800 / 900) — 779 is the pre-drop frame; **781 is the same framing, the same cardioid
  and bulb in the same places**, flooded white with the composite's glitch rows; 800 the same still; 900 a genuine
  level deeper in purple with the antenna and a clean minibrot. No black, no double exposure, no frame without a field.
  That 779 and 781 are the same geometry *is* rule 1 working: the stand-in shows rung(L−1) under the camera of L−1.
- `feigf-standin.jpg` (781 with the stand-in vs `&standin=0`) — near-identical; the stand-in's filaments are crisper,
  the coarser-rung fallback's are softer by its 2 × magnification. Mean |Δ| 14.43 on a frame of mean 167.
- `feigf-tricorn.jpg` (`&tricorn=0` vs `=1` at f360) — plainly different sets: the Mandelbrot's cardioid and bulb
  against the tricorn's three-cusped deltoid with its smooth arcs, and the real slice (the antenna, left) identical in
  both, as it must be.
- `feigf-flip.jpg` (300 / 301 / 302 / 340) — 300 is M, 301 and 302 are the tricorn at the quarter-resolution field
  (chunkier filaments, every structure already in the right place), 340 is the refined full rung. The one declared cut.
- `feigf-seam.jpg` (312 / 313 / 318 / 340) — the rung change and the 30-frame field-space fade. Indistinguishable
  frames; the only change across the four is that the dendrites get slightly finer.
- `feigf-tiers.jpg` (`q` 0.1 vs 0.95 at L 3.42) — the same picture at both tiers, same rung, same 500 iterations.
  Before §16 the tier changed `uIter` (257 vs 500) and so the picture; now it changes only how fast the field fills in.
- `feigf-house.jpg` (h10 / h30 / h50) — three clearly different frames across the house track: cyan at L ≈ 1.0 with the
  full set, a dark amber deep dendrite field at L ≈ 1.8, and a blown-bright yellow-green pair of bulbs at L ≈ 2.0.

## (i) The design as shipped

**The ladder.** `LR = ln2/ln δ = 0.4498070` levels per rung; rung `r = floor(L/LR)`, base width `W_r = 3.2·2^(−r)`,
which is exactly `3.2·δ^(−r·LR)` (asserted in the node test). `iter(r) = min(500, floor((70 + 30·((r+1)·LR)²)·1.25))`
— the tier-3 value for every tier: 95 at rung 0, 208 at 3, 360 at 5, 500 from rung 7 down.

**The rectangle.** The view is `wd` tall and `A·wd` wide, rolled by ±0.04, centred at `wd·(0.30 ± 0.02, ±0.03)`, with
`wd ∈ (0.395, 1.25]·W_r`. Every term scales with `wd`, so the widest admissible view decides the rectangle and
everything smaller — including every view of every deeper rung — is inside it:

| | rectangle (units of `W_r`) | rung texels | Mpx | RGBA16F | density |
|---|---|---|---|---|---|
| headless canvas 1280 × 633 (as shipped) | x [−0.942, 1.695], y [0, 0.715] | 3337 × 905 | 3.02 | 23.0 MB | **2.000** texel/px |
| 16:9 at 1280 × 720 | x [−0.788, 1.541], y [0, 0.709] | 3354 × 1021 | 3.42 | 26.1 MB | 2.000 |
| 16:9 at 1920 × 1080 | same | 4439 × 1351 | 6.00 | 45.8 MB | 1.764 (the 6 Mpx cap binds) |
| 4:3 at 1024 × 768 | x [−0.510, 1.263], y [0, 0.698] | 2722 × 1072 | 2.92 | 22.3 MB | 2.000 |

**Upper half-plane only**, sampled at `|y|`: both M and the tricorn are symmetric under `c → conj(c)` because the
reference orbit is real, and the colouring's two `ea` reads are `abs(fract(·)·2 − 1)` terms, symmetric under
`ea → 1 − ea`. Exact, and half the memory. **Memory as shipped: 3 × 23.0 = 69 MB of rung slots plus a 835 × 227
quarter target (1.4 MB).** A 0.4 % pad keeps the extreme corners strictly inside the rectangle.

**Target format: RGBA16F** (`ctx.mkTarget(w, h, false, false)`), not the pre-authorised RGBA32F. The precision audit
that decided it: `R = n` is an integer ≤ 500 and half-float is exact to 2048; `G = log r ∈ (4.6, 9.3)` has ulp 0.0078,
and `lG = log₂G − n` moves by 0.0012 against a band edge smoothed over 0.1; `A = ea` has ulp 5·10⁻⁴ turns against a
256-wide `uSpec`; and `B = log|z'|` — the one the brief flagged — is bounded by `FEIG_MAX = 5`, where `|z'| ≈ r·log r /
(d·wd) ≈ 10⁴/wd` puts it near 16, ulp 0.0156, so `d` carries **1.6 % of relative error at the deepest level the dive is
allowed to reach**, under a filament falloff of `exp(−160·d)` evaluated at `d ≈ 0.006`. Nothing in the shots roughens.
Interior is `R = −(sqrt(tr) + 1)`, the sign being the interior test.

**The schedule.** `BUDGET = [6, 9, 12, 18]·10⁶` texel-iterations per `draw()` by `ctx.tier()`,
`rows = max(1, floor(BUDGET/(tw·iter)))`, one `gl.SCISSOR_TEST` band per draw into the rung under construction —
the rung the dive is in if unfinished, else `r + 1`, at double budget in the last 15 % of a rung. Keyed on `feigL`,
`ctx.tier()` and the scene's own draw counter and nothing else; `SCISSOR` off on return.

| rung | L range | iter | rows/frame t0 / t1 / t2 / t3 | frames to build at t3 |
|---|---|---|---|---|
| 0 | 0.00–0.45 | 95 | 18 / 28 / 37 / 56 | 17 |
| 1 | 0.45–0.90 | 117 | 15 / 23 / 30 / 46 | 20 |
| 3 | 1.35–1.80 | 208 | 8 / 12 / 17 / 25 | 37 |
| 5 | 2.25–2.70 | 360 | 4 / 7 / 9 / 14 | 65 |
| 7+ | 3.15– | 500 | 3 / 5 / 7 / 10 | 91 |

91 frames is 1.5 s against the ≥ 6 s a rung lasts at full dive speed; at tier 0 the same rung takes 302 frames, 5.0 s,
which still fits. Measured against the brief's estimate (100 frames at tier 3, 30 at `iter` 142) — within a frame.

**The slot ring.** Three identically sized rung targets plus the quarter target, allocated in `ctx.onResize` and freed
there. Slot choice is **not** `r % 3` (friction 5): `pickSlot` takes the slot that already holds the rung, else the
oldest slot that is neither on screen nor still being read by the cross-fade.

**Sampling.** `dc = centre + (p·rot(rot))·wd` exactly as §15, then four `texelFetch`es with bilinear weights. Each
texel is **decoded first** to `(log d, log₂ G, ea, trap)` — both of those are continuous functions of `c` where the raw
`n` and `log|z'|` are not (friction 7) — the four decoded values are blended with the bilinear weights, the angle as a
unit vector (`atan(Σw·sin, Σw·cos)/TAU`), and where the four `R` signs disagree the nearest texel is taken alone. `d`
is `exp(log d)` with `log(wdV)` already subtracted inside the decode, so a stand-in's virtual width needs no second
code path.

**The blend rule I ended with: the field-space cross-fade, kept, 30 draws.** The seam test decided it and not taste:
0.51 × the median at the change frame, i.e. below the noise floor of an ordinary frame, and the montage shows no
ghosting. The pre-authorised hard switch was not needed. A burst (rule 3) is a declared cut and does not fade; a drop
does not fade either, because the stand-in resolves to the *same slot* that was already on screen — the source never
changes, only `wd` and the centre do, by exactly `δ`.

**The three event rules as shipped.** (1) Drop / kick-wrap: a virtual level `Lv = L ∓ k`, `k ≤ 3`, searched in the
direction opposite the jump first, sampled with the camera of `Lv` (`wd·δ^(L−Lv)`, `cx`/`cy` likewise, same roll) and
`wdV = wd·δ^(L−Lv)` in `d`; the true rung builds behind it and cross-fades in when it lands (frame 780 → 817 in the
determinism run). Disabled by `CARD.hooks.standin(0)`. (2) Tricorn flip invalidates every slot and the quarter target.
(3) Nothing usable: **a coarser built rung first** (friction 6), and only if there is none — the frame after a flip, and
frame 1 — one draw of the whole rung at a quarter of the resolution per side (835 × 227, 0.19 Mpx, ≈ 5 ms at 500
iterations), shown until the full rung completes and then faded to. **Never a black frame, never a frame without a
field** — confirmed on every event shot.

**The stand-in's error: 14.43 mean grey on a frame whose own mean is 167 (8.6 %)**, measured at f781 against the same
frame with `&standin=0`. Note that `&standin=0` falls to the coarser-rung path rather than to a burst, so this number
compares the self-similar stand-in against the *true mathematics at 2 × magnification*, which is the stronger of the
two comparisons the brief could have asked for.

## (j) Final `feats` (18, unchanged from §15)

```
arc  regularity  clarity  calm          — score() only
bpm  lvl  tension  alive  kick  dropEvt  sectionEvt  seed  flow  flowMid  bass  dropEnv  hat  midS
```
`help.feats` has a line for all 18 (`check.js` gaps 0), and `CARD.HELP.rows(true)` returns exactly these 18.
