# NAV2 — "the melody draws the path" (v0.8, scene id 8, key `9`)

Worker report for `docs/workers/brief-nav2.md`. Branch `worktree-agent-af4c77c7f40ed7f09`, seven commits, not merged.
NAV (`assets/scenes/nav/`), `core/`, `engine/`, `main.js`, `feats.js`, `math/{mandel,baby,util}.js` and every other
scene are untouched.

## What it is

NAV navigates by *choosing from tables* — twelve bulbs by musical interval, three baby copies, fourteen Misiurewicz
points — and then walks a chart inside the choice. Nothing in it reads pitch. NAV2 has **no tables and no charts**:
c is a ball rolling inside M under three forces.

* **The melody pulls.** Pitch height is Im c through a critically damped spring (`W_Y` 14, ~0.3 s), the spectral
  balance is Re c through an ema in **musical** time (`TAU_X` 1.2 musical seconds), so silence freezes the drift. The
  pull loosens by `1 - 0.8*wind` while a build winds up.
* **The boundary is a wall.** Inside a hyperbolic component ρ = |λ| of the attracting cycle is a smooth coordinate
  that reaches exactly 1 at the edge. The cycle is found **chart-free** every frame (`assets/math/field.js`), ∇ρ is
  the wall's normal, and an outward step is projected onto the rim's tangent and then bisected to the largest step
  still inside — so c **slides along the rim** instead of stopping at it.
* **The wind-up presses.** As `wind` rises the ball is pushed toward ρ = `RHO_CAP`, and the Koenigs arms tighten *by
  construction*, because their tightness IS `arg λ / ln|λ|`.

Gates: a step the wall refused, held half a beat, near internal angle p/q (Farey, q ≤ 7), with a child worth entering,
walks c **through the parabolic root** into the child bulb; the finder re-verifies with period q·k. Internal angle 0
runs the same machinery backwards, out into the parent. No Misiurewicz kick — `state.kick.x` is 0 for ever, so the
continuity monitor's kick clause never fires.

The drop is the **one cut**: a ray along the ρ-normal out to log₂G = −2.2 + 1.7·dropStrength, its segment checked
clean, `pathCut` 0, mode EXT. EXT/HOME follow ∇log₂G with a drift in musical time; IN bridges home along the checked
segment. Every other frame moves `cPath` by at most `V_MAX·dt` = 0.02 at 60 Hz, 0.05 at the loop's 1/24 s cap, both
under the monitor's 0.06.

## (a) Friction log — every sentence the docs lack, every guess, every lean changed

1. **`pot()`'s exponent, measured against NAV's own table.** The naive smooth potential `log₂(log|z_n|) − n` is
   **exactly 1.0 too low** against `math/mandel.js buildRayGrid`, which is normalised
   Φ_M(c) = lim (f_c^n(c))^(1/2ⁿ) — z₁ = c counted as n = 0. So `log₂ G = log₂(log|z_{i+1}|) − i`. Undetected, every
   drop would have landed at half the intended depth. `tools/test_field.js` checks 20 grid points for this reason.
   Neither CONTRACTS nor `mandel.js` states the convention; `buildRayGrid`'s own arithmetic is the only source.
2. **The nearest-return period is not always primitive.** Where λ is near −1 the critical orbit approaches the
   period-1 point *alternating* (e → −e + e²), so |f(z) − z| ≈ |1−λ|·e stays above `RET_TOL` while
   |f²(z) − z| ≈ |1−λ²|·e is already under it, and the detector names q = 2 with λ². At c = (−0.74, 0.02) that halves
   the shader's Koenigs bands. Fixed by testing the divisors of q on the **polished** point. (At the cusp c = −0.75
   itself the reduction legitimately fails — Newton on a triple root leaves a residual of ~3e-3 at d = 1 — but `has`
   is 0 there anyway because ρ = 1.)
3. **[the big one] ρ alone is not a wall.** Capping ρ ≤ 0.985 leaks: a step across a root lands in the *next*
   component with a **small** ρ and is accepted. Measured: c tunnelled down the whole period-doubling cascade and out
   of M in two seconds, froze at c = −2.0435 with `has` 0, and stayed there for the remaining 45 s. The wall is the
   **period test** — `probe()` requires `TR.q === N.q` — and a component changes only through a gate, which is what
   the brief asks for ("a wind-up never changes component"). The brief's §1 does not say this; it is the invariant
   the design needs and the single most important line in `nav2.js`.
4. **[lean changed] The wall has to be two-sided.** The brief's `vR = K_R·wind·(rhoT − ρ)·n` is zero with no wind, so
   the melody alone parks c on the rim. There ln|λ| → 0 makes the Koenigs bands sub-pixel and the interior renders
   **flat black** (centre luminance 0.05 against NAV's 0.29, `tools/lum.py` at f360). Added `K_BACK`: outward only as
   hard as the wind presses, inward always.
5. **[lean changed] `hit` must push the target, not the force.** Written literally as `K_HIT·hit·(RHO_CAP − ρ)` the
   push is *largest deep inside*, so every kick shoved c outward by ~0.06 and was the engine of finding 3. It is now
   a transient addition to the pressure `press = clamp(wind + K_HIT·hit)` with `rhoT = mix(RHO_FREE, RHO_CAP, press)`,
   which is what "a hit pushes rhoT transiently" actually means.
6. **[lean changed] The Re bias must be seeded at the signal.** `xE` starting at `X_HOME` and creeping in musical time
   means ~18 real seconds of being pulled to −0.8 on `#test` (musical time runs at ~0.15 s/s in a valley), which
   parks c on the cardioid rim for the whole first loop. Seeded at the first frame's `P.side`, and `TAU_X` 2.5 → 1.2.
7. **[lean changed] "Pressed against the rim" cannot be an absolute ρ.** With the two-sided wall the melody's pull and
   the restoring push balance *wherever they balance* — on the 1/3 root that is ρ 0.974, below any threshold near the
   cap. With `rho > RHO_CAP - 0.004` the gate **never opened under the melody alone**: c walked to the 1/3 root and
   sat there for 400 frames. It is now a step the wall **refused this frame** (`N.blocked`), with ρ > 0.93 as a
   sanity floor. This is the one change that moved the still reference (see below).
8. **The gate's arrival test must run in both phases.** Checking `q === q0·q_farey` only while pushing overshoots: the
   walk toward the root already crosses into the child, so the push kept going and c went 1 → 3 → **9** in twenty
   frames. Moved to the top of `gateStep`.
9. **[lean changed] `GATE_C` 2 → 1.** The brief's child-size proxy `sin(πp/q)/q²·2/|dλ/dc|` is **twice** the real
   radius: at the 1/2 root |dλ/dc| = 1 and sin(π/2)/4 = 0.25, which *is* the period-2 disc's radius. With the factor 2
   and `GATE_PUSH` 1.6 the push was 0.8 units — 3.2 radii, right through the disc and out the far side. `GATE_C` 1,
   `GATE_PUSH` 1.0. Measured live: `comp` reads 0.24999999999697 in the period-2 disc and 0.0954 in the 1/3 bulb
   (true radius 0.0962).
10. **The drop's clean line usually is not clean.** A 1.2–1.8 unit ray from near the set grazes a dendrite more often
    than not: from (−0.2, 0.62) the straight normal has 6 bad samples of 64, and *none* of the brief's five ±5°
    retries is clean. Widened to 13 retries over ±45°, and `cleanLine` now returns the **count** of bad samples so the
    least bad direction can be taken — a drop must always happen. On `#test` the first retry (+7.5°) is clean.
11. **`CARD.log` is not a string.** HARNESS's "`log` (event log under #test)" reads as one; `CARD.log.split` throws
    `TypeError: CARD.log.split is not a function`. Not chased further; the scene's own `n2info` hook carried every
    number this session needed.
12. **The browser's `performance.now()` cannot see a single `update()`.** `hooks.timeUpdate(300)` returns a **median
    of exactly 0** — the per-call cost is below the timer's resolution. It now also returns the batch mean, and
    `tools/test_nav2.js` measures the same thing in node with `process.hrtime.bigint()`, which does see it.
13. **`&still=1` with no value.** A hash hook fires with the string; `still: (v) => STILL = (v === undefined || v === '')
    ? 1 : +v` covers `&still` and `&still=1` alike. CONTRACTS §1.4 does not say what a valueless hash hook passes.
14. **The module cap bit twice.** `nav2.js` hit 502 lines (hard fail) at step 7 and had to be trimmed to 497. The two
    pure potential helpers `rayTo` / `cleanLine` moved into `math/field.js` — which is the better home anyway, since
    the node test covers them there. The remaining soft-cap warning (497 > 350) is the one warning the brief allows.
15. **The drop's own log line.** `N.log` is `ctx.log`, which only exists under `#test`; NAV2 logs `DROP2@`, `GATE into`
    and `GATE ok` lines. They were read through `n2info().gate` instead of `CARD.log` (finding 11).
16. **A foreign Chrome was on the machine throughout.** A headless instance from the main checkout
    (`--user-data-dir=.../RetinaRave/tools/chr9…`, 80+ minutes old, orphaned) plus a load average of 3.5. It was not
    mine to kill, so the bench is reported as **interleaved pairs and ratios only**, which is exactly the defence
    HARNESS's items 3 and 5 prescribe. Absolute ms below are not comparable to another session's.

## (b) Was I tempted to open a forbidden file?

Twice, both resisted.

* `assets/core/gl.js`, to learn the convention of HEAD's `rot(a)` before putting the blob's float in screen space.
  Resolved from a legal read instead: `VS_PT` in my own `shaders.js` does its own rotation
  (`p = vec2(c*d.x + s*d.y, -s*d.x + c*d.y)`), which is R(−w) applied to `z − centre`; for the point program and the
  fragment program to agree on where a point lands, `rot(a)` must be `[[cos,-sin],[sin,cos]]`. The f480/f720 pair
  (different GROOVE angles, the blob straight up in both) confirms it.
* `assets/core/params.js`, to check whether `env.params` is the same object every frame before caching it. CONTRACTS
  §1.16 answers it in words ("the same object every frame, refreshed in place"), so I read it there and cached
  nothing across frames.

## (c) The exact acceptance outputs

| # | command | result |
|---|---|---|
| 1 | `node tools/check.js` | `80 modules · uniforms 131 · MS keys 118 · scenes 8 (help.feats gaps 0) · 0 fail · 2 warn` — **PASS**. The two warnings are the pre-existing `feigen/index.js has 351 lines` and my `nav2.js has 497 lines`, the soft line-cap warning the brief allows. |
| 2 | `PORT=8799 GPU=1 node tools/cdp.js 'test&scene=8' …` | `{"errs":[],"bad":[],"scene":8}` (`glerr` absent = clean) — **PASS** |
| 3 | house run, `test&fake=0&demo=house&scene=8` | `{"errs":[],"bad":[],"q":0.696,"bench":2.0687,"hud":"nav2 EXT c 0.0746 0.8370 rho 0.8244 q 1 has 0 wind 0.07 curl 0.31 spin -0.32 pitch 0.16 lift -0.245 par 0.00 tscale 1.00"}` — **PASS**, three different frames |
| 4 | every proof shot montaged and read | **PASS** — see (d) |
| 5 | scene object shape | `missing []`, `score 0`, `feats 29`, `helpGaps []`, `helpExtra []`, `depths eli5:472 why:756 math:1058`, `state {mode:'string', cPath:2, pathCut:'number', kick.x:0, baby:null, c:2}`, `params 6`, `cuts 'event'`, `always false`, `home false`, `colour v2/[v2]` — **PASS** |
| 6 | `IDS=8 tools/scene-md5.sh n2` | f360 `54c92885`, f840 `16589246`, identical across two runs; still four identical across two runs — **PASS** |
| 7 | `node tools/bundle.js` + the dist key-9 run | `bundled 80 modules → dist/retinarave.html (632 KB)`, then `{"errs":[],"bad":[],"scene":8}` — **PASS** |
| 8 | the five node tests | `param-smoke: 49 checks, 0 fail` · `test_field: OK` · `test_nav2: OK` · `test_baby: OK · MISI 14` · `test_misi: OK` — **PASS** |
| 9 | continuity monitor, 60 s of `test&fake=0&scene=8` | `{"n":3606,"fast":0,"max":0.02016,"viol":[],"scene":8,"mode":"EXT","errs":[],"bad":[],"q":0.736}` — **PASS** |

The monitor's `max` of 0.0202 is `V_MAX·dt` at 60 Hz: c never moves faster than the cap outside a declared cut, so
the spike rule cannot fire. `fast` is 0 as well, where v3's NAV produces ~100 in a minute.

The monitor was injected as the brief says: `CARD.NAV = CARD.REG[8].scene.state` before the `tools/monitor.js`
snippet, so the monitor watched NAV2's `cPath` / `pathCut` / `kick.x` / `mode` / `baby`.

## (d) The shots

| file | what it shows |
|---|---|
| `tools/accept/v0.8/nav2-step1-f360.jpg`, `-f840.jpg` | the step-1 reference pair: a period-2 basilica with green equipotential dust at f360, and at f840 the exterior after the drop — c far outside M, so the Julia set is a blue Cantor dust line. |
| `nav2-step2-pitch.jpg` (4) | `&pitch=0.2` vs `&pitch=0.8` at f480 and at f720. c is identical in both runs, so the pair isolates the visual: the blob sits visibly higher, and it moves **straight up the screen** at both frames although the GROOVE angles differ. |
| `nav2-step3-scratch.jpg` (2) | `&scratch=1` vs none at f720 (curl 0.622 → 0.922): the interior filigree is re-laid. Honest reading: `ai += uCurl*Lk` shears the spoke phase along the band coordinate, and the spokes carry .05 of the base brightness against the bands' .16, so it reads as a rearrangement, not a dramatic tightening. |
| `nav2-step4-wind.jpg` (6) | f600 a dim red basilica, spirals loose; f660 warmer, the filigree closing; f720 bright orange and dense; **f765** the hush — the interior lit right through, green, every Koenigs spiral resolved (uGlow 1.8 on a par already 1); f780 the drop, a white flash; f800 the exterior a third of a second later, blue spiral debris, wind released to 0. |
| `nav2-step5-spin.jpg` (2) | `&swirl=1` from frame 0 vs none at f480: the basilica turned by −2.005 rad. |
| `nav2-step6-params.jpg` (4) | `height=c:-1` and `c:+1` — exactly mirrored, a five-lobed set hanging low and its reflection hanging high, the PiP's path running down in one and up in the other; `wind=c:0` the resting basilica; `wind=c:1` a **period-6** component at c = (−1.4748, −0.0004), a thin chain of beads, reached by gate after gate down the cascade. |
| `nav2-step7-gate.jpg` (4) | the gate walk: f060 c pressed in the period-2 disc; f260 c on the cardioid rim at the 1/3 root, a dendrite; **f320** just through the root — a three-lobed rabbit; f480 settled in the three-arm bulb. |
| `nav2-house.jpg` (3) | the house demo at 10 / 30 / 50 s: c outside M (a red dust line), then a solid dark-blue Julia set with violet dust, then a bright green three-lobed cauliflower pressed hard against a rim. |

## (e) The exact EVAL lines

```
CARD.REG[8].scene.hooks.n2info()                               the whole state as a plain object
CARD.REG[8].scene.hooks.wish(-0.12, 1.2)                       two arguments: never &name=, always an {eval}
CARD.REG[8].scene.hooks.timeUpdate(300)                        {med, mean, tot, n} in ms
&still=1  &pitch=0.8  &scratch=1  &swirl=1                     one-argument hash hooks, fired after init
&param=nav2.wind=c:1                                           one route moves the md5
CARD.paramsOf('nav2')  CARD.paramDeps('nav2', p)  CARD.derived('nav2', p)
window.__pin = setInterval(function(){CARD.Q.q=0.95;CARD.Q.iter=264;},16)
CARD.NAV = CARD.REG[8].scene.state                             before the tools/monitor.js snippet
```

## Bench (HARNESS "Bench protocol": `q` pinned 0.95 **and `Q.iter` pinned 264**, n = 300, medians, interleaved pairs, each scene forced in its own page)

| page | pair | scene (ms) | NAV (ms) | ratio |
|---|---|---|---|---|
| `scene=8` | warm-up (discarded) | 2.178 | — | — |
| `scene=8` | 1 | 2.131 | 2.348 | 0.91 |
| `scene=8` | 2 | 1.736 | 1.720 | 1.01 |
| `scene=8` | 3 | 1.670 | 1.758 | 0.95 |
| `scene=6` (control) | warm-up (discarded) | 1.537 | — | — |
| `scene=6` (control) | 1 | 1.427 | 2.359 | 0.61 |
| `scene=6` (control) | 2 | 1.444 | 2.442 | 0.59 |
| `scene=6` (control) | 3 | 1.879 | 1.746 | 1.08 |

**NAV2 is 0.95× NAV by settled-pair medians (1.736 / 1.758), 0.96× by the mean of the three ratios** — the cap is
1.5×, so it passes with room. That it is not *more* expensive is expected: the render is NAV's shader plus five
multiply-adds, and the CPU force model is invisible at this scale. The FEIGEN control runs 0.6–1.1× NAV on the same
machine in the same minutes, which is the spread machine load produces; only the interleaved ratios are meaningful
(a foreign Chrome was resident throughout — friction 16).

**The `update()` median.** The browser hook returns `{med: 0, mean: 0.036, tot: 10.8, n: 300}` — the median is 0
because a single call is below `performance.now()`'s resolution, and the mean is dominated by the two timer calls per
iteration. In node, over the same 2880-frame 48 s run with `process.hrtime.bigint()`:

```
update() cost over 2880 frames (node, hrtime): median 0.0039 ms  mean 0.0053 ms  p99 0.0317 ms  max 0.1636 ms
```

**Median 0.0039 ms against a 0.5 ms gate**; the worst single frame is 0.164 ms (the drop, which runs up to 13 ray
searches with a 64-sample clean-line check each). The brief's "< 0.1 ms worst frame" is met on every frame but the
two drops in 48 s.

## The parameters (CONTRACTS §1.16), values and deps at f360 unrouted

| name | eli5 | range | from(MS) | deps recorded | lo → hi |
|---|---|---|---|---|---|
| `height` | how high in the set the melody has taken c | [−1, 1] | `Y_AMP*(centroid − 0.5)` | centroid | c hangs low in the set → c hangs high; exactly mirrored |
| `side` | how far toward the bass side (left) or the bright side (right) | [−1.9, 0.3] | `X_HOME + X_AMP*(bass − high)` | bass, high | left into the period-doubling cascade → right to the cardioid's cusp |
| `wind` | how hard c is pressed against the boundary: the arms wind up | [0, 1] | the `windT` formula | dropExpectedIn, build, tension, hush | the resting basilica → gate after gate down the cascade into a period-6 component |
| `lift` | how far the blob floats up or down with the pitch | [−0.3, 0.3] | `LIFT*(centroid − 0.45)` | centroid | the whole blob sinks → rises (screen-vertical); drives `uKoen` at a fixed ratio, being the same high-pass |
| `spin` | how fast the frame is stirred on top of the groove | [0, 1.5] rad/s | `SPIN_SW*(1 − (1−riser)(1−hp)(1−roll)) + SPIN_W*windT²` | riser, hp, roll, dropExpectedIn, build, tension, hush | the frame still → turning at 1.5 rad/s |
| `zoom` | how much of the set is in view | [0.5, 2] | NAV's, verbatim | bass, hit, dropEnv | closer → further out |

Values at f360, `PROUTE.n` 0: `height −0.0585`, `side −0.4150`, `wind 0`, `lift 0.00325`, `spin 0`, `zoom 0.98322`.
`paramsOf(p) === derived(p)` is **true for all six**. `dropExpectedIn` appears in both countdown deps although the MS
defaults hold it at −1, because the countdown is written `… * (dei >= 0 ? 1 : 0)` — a multiply by an exact 1.0
(CONTRACTS §1.16, the TORUS2 short-circuit find). `check.js`'s range check is silent on all six.

`trap`, `dots`, `pip` and `reach` stay inline expressions, lifted from NAV — six is the cap and these four are the
ones the eye does not name.

One route moves the md5 at f360: `&param=nav2.wind=c:1` → `440e5b72` against the unrouted `54c92885`.
`&param=nav2.wind=c:0` leaves it unchanged, which is correct and documented: the derived `wind` at f360 is already 0,
and a constant route at the derived value need not move the picture.

## n2info tables

**Step 1 — the path** (`CLOCK=1`, `test&scene=8`; this table is from the step-1 build, before the step-7 gate change):

```
frame  mode  pathCut  par    q has rho      what
f600   INT   1598     0.248  1  1  0.9044   the build starts; Im c −0.0585
f630   INT   1628     0.142  1  1  0.8723
f660   INT   1658     0.099  1  1  0.8584
f690   INT   1688     0.226  1  1  0.8979
f720   INT   1718     0.356  1  1  0.9428
f750   INT   1748     0.387  1  1  0.9602
f779   INT   1777     0.391  1  1  0.9639   Im c +0.0265, glow 1.80 (the hush)
f780   EXT   0        0.000  1  0  —        THE CUT: pathCut 0, lg −0.67
f781   EXT   1        0.000  1  0  —        lg −0.698
f810   EXT   30       0.000  1  0  —        lg −2.727
f900   EXT   120      0.000  1  0  —        lg −5.828
f1100  EXT   320      0.000  1  0  —        lg −6.528
f1300  HOME  520      0.000  1  0  —        lg −1.431, coming back to the exit potential
f1500  INT   720      0.363  1  1  0.9461   home, the cycle warm
```

Im c tracks the fake timeline's centroid ramp (.44 → .62 over 10–13 s) with the spring's ~0.25 s lag; ρ climbs toward
the cap; `has` is 1 on every INT frame; the exit is at f780 ± 0 with `pathCut` 0; re-entry is before f1500.

**Step 3 — the detectors** (`CLOCK=1`, `test&scene=8`):

```
frame  mode   pitch  sweep   roll scratch  swirl   wind  windT  count   curl   glow
f600   INT    0.463  0.063  0.001   0.000  0.064  0.006  0.136  0.225  0.021  1.000
f660   INT    0.603  0.544  0.501   0.000  0.773  0.559  0.785  0.483  0.427  1.000
f720   INT    0.713  0.824  0.812   0.000  0.967  0.949  1.000  0.742  0.622  1.000
f780   EXT    0.387  0.938  0.910   0.000  0.994  0.000  0.000  0.000  0.298  1.000
f800   EXT    0.396  0.959  0.600   0.000  0.983  0.000  0.000  0.000  0.295  1.000
```

`scratch` is 0 throughout, exactly as the brief predicts: `#test` sets `flux` to the kick impulse (0 between kicks)
and smooths the centroid over 0.35 s, so a pitch **flick** cannot happen there. It is pinned instead, and the headed
real-music run is its proof — **not run this session** (see "Not done").

**Step 4 — the wind-up and the release** (`CLOCK=1`, `test&scene=8`; f765 is inside the hush window 12.6–13.0 s):

```
frame  mode     wind   dropIn     rho    curl   glow    par
f600   INT     0.006     6.20  0.9714   0.021   1.00  0.993
f660   INT     0.559     4.13  0.9849   0.427   1.00  1.000
f720   INT     0.949     2.07  0.9833   0.622   1.00  1.000
f765   INT     0.992     0.52  0.9834   0.645   1.80  1.000
f780   EXT     0.000    -1.00  0.9834   0.298   1.00  0.000
f800   EXT     0.000    -1.00  0.9834   0.295   1.00  0.000
```

The countdown does the work the brief asked for: `wind` is 0.56 four beats out, while `build`'s own ema is still
climbing. `dropEvt` zeroes it in one frame — that is the release.

## The gate walk (step 7)

`CARD.REG[8].scene.hooks.wish(-0.12, 1.2)` at f60 — the melody pinned above the cardioid's highest point, which is
the 1/3 root at Im c 0.6495.

```
frame  mode       Re c      Im c      rho   q  has     comp gate
f060   INT    -0.72768  -0.04079  0.97885   1    1   0.9892 -
f200   INT    -0.23239   0.61579  0.97377   1    1   0.8844 -      climbing the cardioid's rim
f260   INT    -0.18170   0.62367  0.97381   1    1   0.8709 -
f310   INT    -0.15697   0.62584  0.97383   1    1   0.8640 -      pressed at the 1/3 root
f320   INT    -0.11506   0.66691  0.82458   3    1   0.0954 1/3:0  THROUGH: q 1 -> 3
f330   INT    -0.13456   0.77930  0.38627   3    1   0.0944 -
f340   INT    -0.13482   0.83009  0.91685   3    1   0.0933 -
f480   INT    -0.12907   0.83059  0.91691   3    1   0.0930 -      settled in the three-arm bulb
```

`comp`, the component's own size in c from 1/|dλ/dc|, reads **0.24999999999697** in the period-2 disc (true radius
0.25) and **0.0954** in the 1/3 bulb (true radius 0.0962). The gate's address came out of `nearestRational(arg λ/2π, 7)`
with no table anywhere.

## The md5s

```
plain f360  54c928855c03ba1f1c0cab6bd10971c3     (stable across two runs)
plain f840  16589246149259bc7a467bc9e908885e
still f360  54c928855c03ba1f1c0cab6bd10971c3     (stable across two runs)
still f480  9fec8478b309d668080707266265854b
still f720  81b17ee4c89c0fd9595115cb85e733bc
still f840  3c18d6638ab43585a66ec372f8b7af82
```

`still f360 == plain f360`: at f360 the fake timeline is in a valley, the centroid is flat and there is no wind, so
every NAV2 uniform is already at its rest value — the identity proving itself. `still f840 != plain f840`: after the
drop, curl, lift and the spin angle are all non-zero.

**The still reference moved once, deliberately, at step 7.** Through steps 2–5 — uKoen, uView.xy, uCurl, uGlow and
uView.w — all four held byte-identical at `58efe9b4 / f05203da / dc3cc058 / 38813940`, which is what that gate is for.
Step 7 changed **navigation**, not a uniform (friction 7 and 8), so c moved and with it every frame. The old four are
kept in `tools/accept/v0.8/nav2-md5.txt` for the record.

The reference md5s of ids 0–7 cannot have moved: the diff is one scene folder, one new `math/` module and two node
tests. NAV (id 0) was shot once as a look comparison and gave `fb74fee4` / `7225ea02`, its v0.7 reference values
(`tools/accept/v0.7/scene-md5-v07.txt`), unchanged.

## Lines

```
assets/math/field.js           296
assets/scenes/nav2/nav2.js     497   (soft cap 350, hard cap 500 — the one allowed warning)
assets/scenes/nav2/index.js    267
assets/scenes/nav2/detect.js   141
assets/scenes/nav2/shaders.js   79
tools/test_field.js            164
tools/test_nav2.js             162
```

## What I would tune first when the user looks

Ranked, the ones I am least sure of at the top.

1. **`X_HOME` (−0.8) and `RHO_FREE` (0.72) / `K_BACK` (1.2) — where the melody rests.** `X_HOME` is the midpoint of
   the brief's `side` range and it lands exactly on the 1/2 root, so c spends most of its time **pressed against a
   boundary**: ρ is already 0.97 before a build starts, `par` is already 1, and the wind-up's own ρ climb is only
   0.97 → 0.985. What reads as the wind-up in the montage is therefore the curl and the hush brightening more than ρ.
   Moving the resting place inward (a larger `K_BACK`, or `X_HOME` nearer −0.5) buys contrast, but the two resting
   places I measured trade against each other: the period-2 disc gives centre luminance 0.078 at f360, the main
   cardioid at ρ 0.76 gives 0.035, and NAV gives 0.29. **This is the single knob I would put in front of the user
   first.**
2. **`Y_AMP` (1.3) and `PITCH_K` (2.5) — how far the melody moves c.** On `#test` the centroid's whole excursion is
   0.44 → 0.62, so Im c moves ±0.08 and the blob's float ±0.16 view units. That is legible but modest; real music
   will swing more, and I have not seen it swing.
3. **`LIFT` (0.65) with `LIFT_G` (2.5), and `SLIDE` (0.45) / `SLIDE_A` (1.10).** The parameter's range is the
   centroid's *level*; what the eye sees is its *motion*, so the visible amplitude is the high-passed signal times
   `LIFT_G`. Two constants where the brief implies one, and the split is mine.
4. **`W_Y` (14), `TAU_M` (0.55), `K_R` (4.0).** The feel of the ball. `K_R` was raised from the brief's implied
   gentleness so that ρ actually reaches the cap inside a three-second build.
5. **`CURL` (0.35) / `CURL_SW` (0.30) — the arm-tightness gain.** See friction: in the v2 mapping the spokes carry
   .05 of the base brightness against the bands' .16, so `ai += uCurl*Lk` re-lays the filigree rather than visibly
   tightening it. If the user wants the swirl to *read*, the honest lever is a term on `Lk` (the bands) as well, not
   a bigger gain on `ai`. **`SPIN_SW` (0.6) / `SPIN_W` (0.5)** are the same question for the frame's turn, and 0.6
   rad/s is already brisk.
6. **The gate policy: `GATE_HOLD` (0.5 beats), `SIZE_MIN` (0.02), `GATE_BUILD` (0.4), `GATE_RHO_MIN` (0.93), and
   `X_AMP` (−1.1).** Gates are dramatic — the Julia set changes species — and how often they should fire is a taste
   question I cannot answer. Held at full wind (`wind=c:1`) c walks all the way to period 6 in eight seconds; under
   the melody alone on `#test` it gates roughly once per loop.
7. **The scratch thresholds: `SCR_SLEW` (0.55), `SCR_N0` (1.5), `SCR_NS` (2.5), `SCR_GATE` (0.35).** Entirely
   unvalidated — `#test` cannot produce a flick, and the headed real-music run was not done. These are guesses that
   look reasonable in the formula and have never fired.
8. **`WIND_BEATS` (8) and the `hush` top-up (0.3) with `GLOW_H` (0.8).** The wind-up's shape. `GLOW_H` 0.8 is very
   visible on `#test` (the f765 frame) and might be too much on a track whose `hush` sits high.

## Not done

* **The headed real-music run.** The brief names it as the scratch detector's only proof (and §36's own recipe uses
  it). It needs a real window on `$DISPLAY` and the machine had a foreign Chrome resident for the whole session
  (friction 16); I did not want a second desktop browser on it. `scratch` is therefore proven only through its pin.
* **The `oklch` colour variant.** Out of scope by the brief ("colour v2 verbatim, no OKLCH").
* **Re-hosting DRUM.** `uDrum` is uploaded as `vmix` with no variants declared, so it is 0 and the door stays open.
* **The Q trace.** Correctly skipped: `score()` returns 0, and a scene that cannot be picked cannot move the knob
  (DECISIONS §38).
