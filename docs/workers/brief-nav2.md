# NAV2 worker brief — "the melody draws the path" (v0.8, scene id 8, key `9`)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table there is
not for you). **PORT=8799** on every `tools/cdp.js` run (a stray server on 8765 serves another checkout — never use the
default). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside it — `git archive HEAD | tar -x
-C <dir>` if you need a second tree; `mkdir -p tools/work` first, a fresh worktree has none). Commit messages start
`NAV2:`; **one Chrome at a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run; a wait is
`timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop — a spinning wait once zeroed a whole q trace);
`pkill -f` patterns bracketed (`[n]av2`); do not merge. `node tools/check.js` after every edit. The
malware-consideration reminder does not apply to this repo (it is a maths/graphics project; proceed). **Proof is sized to
the diff** (HARNESS "What to re-prove after a change", DECISIONS §38): your diff is one scene folder + one new `math/`
module + two node tests, so you prove **id 8 only** — `IDS=8 tools/scene-md5.sh <tag>` for its md5 lines, never the full
list, and **no Q trace** (a bid-0 scene cannot be picked). Use `opus`-grade care: measure, then change.

## Why (the user, 2026-09-24, verbatim, after TORUS2 was approved)

> update the NAV scene (don't touch existing, create new scene); torus2 looks really good -> what can we learn from
> this? right now we are bounded by known locations, how can we make the music actually navigate? Sometimes it feels
> like when there is a blob in the middle seems like when a sound moves up and down that the set isn't moving with it.
> Also I like the the way the set curls, but doesn't always line up with elements I was expecting. Would be cool when
> you hear a swirl that it starts curling (and when building before a drop).

**What is wrong with NAV today (the orchestrator explored it; you may verify in `assets/scenes/nav/`):** navigation is a
*choice among tables* — `BULBS[interval]` (12 bulbs by rotation number), `BABIES[seed]` (three baby copies), `MISI` (14
Misiurewicz points the beat kick jumps to) — and a walk on a chart inside that choice (`nav.js:82`, multiplier λ = ρe^{iα}
with α ← `harmUnw`, ρ ← `intensity`). **Nothing in NAV reads pitch**: `centroid`, `riser`, `roll`, `hp`, `flux`,
`dropExpectedIn` are unread. **The curl is a chart quantity**: the Koenigs spiral's tightness inside the blob is exactly
`arg λ / ln|λ|` (`shaders-v2.js:40` — now your `shaders.js`), so "how much it curls" is how near c sits to the bulb's
root — today moved only by v3's `build` (park at the root) and by harmony.

The user then answered four interview questions; everything else below is the orchestrator's **lean** (the user corrects
leans on the first montage, so build them as written and keep each one easy to retune: **a named constant at the top of
the module**, never a magic number in a shader). **Answered by the user (not negotiable):**
1. Steering = **"the melody draws the path"**: pitch height is up/down (Im c), another musical quantity the other axis;
   **no charts, no target tables** (declined: harmony steers the external angle; keep interval → bulb).
2. Pitch → the blob: **the spokes and bands inside the blob slide with pitch** *and* **the whole blob rises and falls
   with pitch**.
3. A swirl is: **a filter sweep / riser over seconds**, **a drum roll / snare build**, **"that dj scratch sound"**.
4. The curl to cause: **the spiral arms inside the blob** and **the whole frame turning** (declined: the exterior
   line-trap sweep, the Misiurewicz dendrite spirals).

## Targets

`assets/scenes/nav2/` (the skeleton is there and registered: `index.js`, `core.js`, `shaders.js` = NAV lifted verbatim,
`name 'nav2'`, `id 8`, `score() → 0`, colour `v2` alone, `hooks.still`; keep `name`, `id`, `score`, `colour`, `home:
false`, replace everything else; **set `always: false`** in step 1 — the skeleton says `true` only so that its update history
equals NAV's for the s8 = s0 proof; keep the `if (!this._S) return;` guard in `draw()`: a forced scene is drawn on its
first frame before its first `update()`) — `index.js`, **`nav2.js` (replaces `core.js`; delete `core.js`)**,
`detect.js`, `shaders.js` (**500 lines hard cap per module**, 350 soft — a warning is allowed, 500 is not); **new
`assets/math/field.js`** (pure numerics, node-importable, no DOM — a scene may import from `math/`; `math/` is the right
home because the node tests import it); `tools/test_field.js` and `tools/test_nav2.js` (yours). Nothing in `core/`,
`engine/`, `main.js` (already registers you), `feats.js`, no other scene, **not `math/mandel.js`, `math/baby.js`,
`math/util.js`** (NAV depends on them; read and import them freely — `escape`-style helpers you need go in `field.js`).
NAV (`assets/scenes/nav/`) is **untouched** — it stays home and in the rotation until the user approves you; copy from it
freely, never edit it. DRUM (id 4) stays NAV's variant; you declare no variants (`uDrum` is uploaded as 0 — the door
stays open to re-host DRUM later).

**You may read:** this brief, `docs/CONTRACTS.md` (§0, §1 in full — §1.1 ctx, §1.4 slots, §1.9 cuts, §1.13 help.feats,
§1.15, **§1.16 params**, Appendix A), `docs/ENGINE.md` (the `MS` vector), `docs/HARNESS.md` ("Static checks", "Headless
Chrome", "Bench protocol", "Params", "Continuity monitor", **"What to re-prove after a change"**, "Pitfalls"),
`docs/DECISIONS.md` **§0** (the continuity monitor and why), **§29** (NAV's params as built, `reach ← kick` trips the
monitor), **§30** (NAV's cost: exterior-bound, `ITER_LO`), §36–§38 (TORUS2's process — the shape you copy),
`docs/workers/{brief-torus2,torus2,brief-nav-params,nav-params,brief-nav-iter,nav-iter}.md` (the previous workers'
friction — the same traps wait for you), `assets/scenes/nav/{index,nav,shaders-v2}.js` (your starting point; `nav.js:74`
is the drop depth, `:82` the chart walk), `assets/math/{mandel,baby,util}.js` + `tools/test_{baby,misi}.js` (the
numerics you build on: `BULBS`, `escape`/potential helpers, `solveMult`, `extC`, `getGrid`, `Spring`, `ema`),
`assets/engine/feats.js` (read only: every field's kind, eli5, formula — the source of truth for what a field means and
its range), `assets/engine/sources/fake.js` (read only: what `#test` fills — see below), `assets/core/params.js` and
`assets/core/route.js` (read only: the params slot you declare into), `tools/monitor.js`, `tools/check.js`,
`tools/scene-md5.sh`, `tools/param-smoke.js`, `tools/cdp.js`'s header comment, `tools/montage.py`, `tools/lum.py`. Not
`core/scenes.js`, not `engine/features*.js`, not `engine/synapse/` — if a field's behaviour is unclear, `feats.js` + a
`CARD.MS` eval in the page is your instrument; write the question in the friction log and continue.

**What `#test` (the fake timeline, `sources/fake.js`) gives you, checked by the orchestrator 2026-09-24:** 24 s loop,
sustain 0–6 → valley 6–10 → build 10–13 → DROP at 13 s (f780 at CLOCK=1's 60 Hz) → peak 13–21 → valley 21–24.
`riser = roll = build`; `hp = 0`; `centroid = .35 + .3·high` and `high` ramps `.3 + .2·(T − 10)` over the build, so the
centroid rises **.44 → .62** over 10–13 s and sits at .455 elsewhere; `dropExpectedIn` counts down in beats over the
build (`(13 − T)·bpm/60`, ≈ 6.2 → 0) and is −1 otherwise; `hush` = 1 after 12.6 s; `flux = kp` (the kick impulse, so it
is 0 between kicks — a self-normalised gate on it is useless headlessly); `onsetRate` is never filled (0); `tension` .9 in
the build, .6 in the peak, .2 otherwise (ema .5 s); `build` ema 1 s; `fakeoutEvt` never fires; `kick` 1 on every beat
while kicks are on, `snare` .7, `hat` exactly .5; `key 9 / mode 1 / keyConf .8`; `chroma` all zero. So pitch lift, sweep,
roll, wind, the countdown and the release are all **headlessly visible**; scratch and `onsetRate` are hook + real-music
only. The demo synths (`&fake=0&demo=house|aba|dnb`) are random run to run; `#test` with `CLOCK=1` is bit-identical —
use it for every md5.

## The design (the plan the user approved — "plan looks good")

### 1. Navigation core — a ball rolling inside M (`math/field.js` + `nav2.js`)

c is moved by a **force model**, never looked up:
- **Wishes.** `yWish = Y_AMP·(centroid − 0.5)` (pitch height; `centroid` is a level, ema .35 s in the engine) through a
  critically damped spring (`util.js Spring`, `W_Y` ≈ 14, ~0.3 s settle) — *up = up*. `xWish = X_HOME + ema(X_AMP·(bass −
  high), in musical time)` — bass-heavy music drifts left toward the period-doubling cascade, bright music right toward
  the cusp; the ema is integrated in `flow` (not `dt`), so silence freezes it. The melody's pull `vM = (wish − c)/TAU_M`,
  loosened by `(1 − 0.8·wind)` during a build.
- **The wall is |λ|, not the distance estimate.** Inside a hyperbolic component ρ = |λ| is a smooth coordinate with ρ → 1
  exactly at the boundary (the orchestrator measured the exterior DE collapsing like √d at the cusp — useless as a wall).
  The attracting cycle for *arbitrary* interior c is found **chart-free** every frame: `findCycle(c)` iterates the
  critical orbit `N_ITER` (≤ 4 096; 32 768 is the bound) steps, detects the period by nearest return (`pMax` ≤ 64),
  polishes by Newton on f^q(z) − z (measured by the orchestrator: λ to 1e-15 at every bulb centre, 3e-10 at ρ = .995,
  0.064 ms for 32 k steps; Newton ≤ 8 steps). `rhoGrad(c)` (central differences of the polish) is the wall's normal.
  The wall is `RHO_CAP` = 0.985 (float32 `uC` quantisation); an outward push is projected to its tangential part and
  bisected (≤ 6) to the largest step still inside — c **slides along the rim**.
- **Wind-up = pressure toward the wall.** `vR = K_R·wind·(rhoT − ρ)·n` with `rhoT = mix(RHO_FREE, RHO_CAP, wind)`: as
  `wind` rises the ball is pressed to the rim, ρ → 1, and the Koenigs arms tighten *by construction* (`arg λ / ln|λ|`).
  A `hit` pushes `rhoT` transiently — **no Misiurewicz kick, no kick table** (the user chose chart-free; the continuity
  monitor's kick clause simply never fires: `state.kick = {x: 0}` forever).
- **Gates — the pitch ladder without a table.** Pressed against the rim near internal angle p/q (Farey
  `nearestRational(arg λ/2π, 7)` — q ≤ 7 —, gate width `GATE_W/q` = .02/q, child size proxy `sin(πp/q)/q²·2/|dλ/dc| >
  SIZE_MIN` = .02, and `build < 0.4` so a wind-up never changes component; pressure held ~half a beat), the cap opens and
  c walks *through the root* into the child bulb; the finder re-verifies with period q·k. The cardioid's highest point
  is the 1/3 root (Im .6495), so "melody up, pressed to the rim, slide" reaches the three-arm bulb by geometry.
  Tiny-bulb trap: gates need `childSize > SIZE_MIN`; in a component below 2·SIZE_MIN the Re wish becomes a pull to
  internal angle 0 (the way back out through the root).
- **The drop** (`dropEvt`, the one declared cut): from the interior point, walk the ρ-normal outward to potential
  `log₂G = −2.2 + 1.7·dropStrength` (NAV's depth, `nav.js:74`) by bisection of an escape-count/potential function (put it
  in `field.js`: the smooth potential `log₂G` from the escape iteration, and `dist` = the exterior distance estimate),
  a 64-sample clean-line check of the segment (every sample outside M; retry the normal ±5° if one fails), `pathCut =
  0`, mode `EXT`, `timeScale 2.6`. EXT/HOME follow ∇log₂G (NAV's `lg` spring in chart-free form: the `reach` expression
  as the target — inline, not a param) with a small equipotential drift in musical time; HOME returns to the exit
  potential and unwinds the drift; IN bridges back along the checked segment (≤ `V_MAX`); INT resumes with the pre-drop
  cycle warm. `rt.home / awayBeat / settledAt / time / label / log / cycBase` published exactly as NAV does (the director
  reads them once NAV2 is home — keep the shape now).
- **Continuity by construction:** every non-cut frame moves `cPath` by ≤ `V_MAX·dt` (`V_MAX` 1.2 units/s → 0.02 at 60
  Hz, 0.05 at the loop's 1/24 s cap) < the monitor's 0.06, so the spike rule can never fire; the drop is `pathCut ≤ 2`
  + a mode change (both legal, `tools/monitor.js`). `state` keeps the monitor's shape `{mode, cPath, pathCut, kick:{x:0},
  baby:null, c}` (the monitor reads `N.cPath`, `N.pathCut`, `N.kick.x`, `N.mode`, `N.baby`). `cuts: 'event'`.
- **Cost:** < 0.1 ms CPU worst frame (finder N ≤ 32 768, pMax ≤ 64, Newton ≤ 8, bisection ≤ 6 — budget every loop with a
  named constant). Render = NAV's shader + five multiply-adds. NAV's `ITER_LO` split budget stays.
- **Node-provable:** `tools/test_field.js` (DE vs distance at the antenna (−2, 0); potential vs NAV's Böttcher grid to
  0.01 at a few exterior points (`getGrid()` needs a Worker/timeout — `buildRayGrid` directly is fine in node, or skip the
  grid and compare against a high-iteration reference); the period at every `BULBS` centre; λ vs the cardioid closed
  form `λ = 1 − √(1 − 4c)` and vs `solveMult` to 1e-8; `rhoGrad` vs the derivative of `|1 − √(1 − 4c)|`; negatives at
  c = 0.3, i, −0.75 (no attracting cycle → `has 0`); Farey cases) and `tools/test_nav2.js` (drive `updateNav2` from a
  re-implementation of the fake timeline's few lines you need — `centroid`, `bass`, `high`, `build`, `tension`,
  `dropExpectedIn`, `hush`, `dropEvt`, `dropStrength`, `beatCount`, `beatPhase`, `hit`, `presence`, `flow` — for 48 s at
  60 Hz in node: the monitor's rule re-implemented → 0 violations, `has` on ≥ 98 % of INT frames, one exit at 13 s, one
  re-entry before 26 s). NAV could never be tested in node (it needs the grid); NAV2 must be.

### 2. Visual mappings (`shaders.js` = NAV's `shaders-v2.js` verbatim + five uniforms)

Every new uniform's rest value is an exact IEEE identity (`x + 0`, `x·1`), so **a frame with every new uniform at rest
is byte-identical to the same scene without the uniforms for the same c** — `hooks.still(1)` (also `&still=1`) forces
rest and is the no-op gate of every commit after step 1 (see Process). Colour: **v2 verbatim, no OKLCH** (a key-hue
anchor as in TORUS2 is a later opt-in variant, not this session).

| uniform | fed from | what the eye sees | rest |
|---|---|---|---|
| `uKoen` vec2 | pitch (high-passed centroid): `(SLIDE·pitch, SLIDE_A·pitch)` | inserted after the Koenigs line (`Lk`/`ai`): `Lk += uKoen.x; ai += uKoen.y;` — the bands breathe and the spokes rotate with the pitch; the smoulder and the dormant drum modes follow because they read `Lk`/`ai` | (0, 0) |
| `uCurl` float | `CURL·wind + CURL_SW·swirl` | `ai += uCurl·Lk` — a gain on the natural tightness `arg λ / ln|λ|`; `Lk` is f^q-invariant so no seam | 0 |
| `uView.xy` (exists, always 0 today) | `lift` = high-passed pitch, eased 0.2 s: `(0, LIFT·lift)` in view units | the whole blob rises and falls; the orbit dots ride with it (`pt`'s `uView` gets the same xy) | (0, 0) |
| `uView.w` (exists) | `GROOVE.rot + spinAngle` | the frame turns faster while a swirl lasts and as the drop nears; the angle integrates rates, never jumps | spinAngle 0 |
| `uGlow` float | `1 + GLOW_H·hush` (GLOW_H 0.8) | the smoulder brightens in the silence before the drop: multiply the two `uPar*uPar` smoulder terms by `uGlow` | 1 |

Kept verbatim: the line trap, the smoulder, `uIterLo`, the DRUM mix (`uDrum` 0), the PiP (`FS_MANDEL_V2`), the
critical-orbit points. Every uniform you declare must be fetched (`check.js` fails on a dead uniform).

### 3. Detectors (`detect.js`, pure followers of `MS`; every constant named at the top; no wall clock)

- **pitch** = `0.5 + PITCH_K·(centroid − ema(centroid, 4 s))` (PITCH_K 2.5): only *motion* of pitch lifts the blob; a
  bright mix does not park it high.
- **sweep** = attack/release ema of `max(riser, hp, |centroid trend|/0.12)` (.25 s attack / .6 s release; the trend is
  the centroid's own derivative through a short ema).
- **roll** = ema of `max(roll, (onsetRate − 5)/6)` (.3 / .8 s) — `onsetRate` is real-audio only (`fake.js` never fills it).
- **scratch** (the user's item): a *bend* = |pitch velocity| above a slew threshold on the faster of the centroid and
  `log₂(peaks[0][0])` (peaks are `[Hz, amp]`); a *flick* = a bend whose sign flipped; `scratch = ema(clamp((flicks −
  1.5)/2.5))·gate`, gate = self-normalised `flux` × (a `hitStrength` follower or `onsetRate`). **Not demonstrable on
  `#test`** (`flux = kp` is 0 between kicks; `centroid` is smoothed .35 s) — `hooks.scratch(v)` pins it; the headed
  real-music run (the orchestrator's) is its proof.
- **swirl** = soft-OR `1 − (1 − sweep)(1 − roll)(1 − scratch)`.
- **wind** (the pre-drop wind-up on synapse's countdown, not v3's `build` alone):
  `count = clamp(1 − max(dropExpectedIn, 0)/WIND_BEATS)·(dropExpectedIn ≥ 0)` (WIND_BEATS 8), `windT = clamp(build·(.35 +
  .25·tension) + count·(.45 + .55·tension) + .3·hush)`, `wind = ema(windT, 0.4 s)`; **`dropEvt` → wind = 0** (the release;
  the arms unwind as ρ falls, the spin rate drops with `dropEnv`); **`fakeoutEvt` → no release**, the ema slows to 2.5 s
  for a beat so the tension leaks out instead.
- **spin rate** = `dir·(SPIN_SW·swirl + SPIN_W·wind²)·(1 − 0.8·rel)` (SPIN_SW 0.6 rad/s, SPIN_W 0.5, `rel` = a follower of
  `dropEnv`), `dir` from `seed.th` (GROOVE's own rule: sign of a section constant), integrated to the angle in musical
  time or `dt` — say which and why.
- **On `#test`:** pitch lift, sweep, roll, wind and the release are all headlessly visible (the fills above); scratch
  and `onsetRate` are hook + real-music only.

### 4. Params (CONTRACTS §1.16) — six, the cap, named for what the eye sees

| name | eli5 | range | from(MS) (the target; the ease is state) |
|---|---|---|---|
| `height` | how high in the set the melody has taken c | [−1, 1] | `Y_AMP·(centroid − 0.5)` |
| `side` | how far toward the bass side (left) or the bright side (right) | [−1.9, 0.3] | `X_HOME + X_AMP·(bass − high)` |
| `wind` | how hard c is pressed against the boundary: the arms wind up | [0, 1] | the `windT` formula (written `a·(cond ? 0 : 1)` so `paramDeps` records every field — §36's short-circuit find) |
| `lift` | how far the blob floats up or down with the pitch | [−0.3, 0.3] | `LIFT·(centroid − 0.45)` (the high-pass and the 0.2 s ease are state; drives `uKoen` too at a fixed ratio) |
| `spin` | how fast the frame is stirred on top of the groove | [0, 1.5] rad/s | `SPIN_SW·(1 − (1 − riser)(1 − hp)(1 − roll)) + SPIN_W·windT²` |
| `zoom` | how much of the set is in view | [0.5, 2] | NAV's, verbatim: `(1 − .05·bass − .07·hit)·(1 + .25·dropEnv)` |

`trap`, `dots`, `pip`, `reach` stay inline expressions (lifted from NAV, not parameters — six is the cap). `from(MS)` is
**moved verbatim** from your own update (name the argument `MS`; reads only fields in `feats`; pure). Read them as
`env.params.<name>` in `update()`. Prove: `CARD.paramsOf('nav2')` at f360 = finite numbers in range, `CARD.paramDeps('nav2',
p)` per parameter listed in the report, `paramsOf == derived` (identity), one route moves the md5 (`&param=nav2.wind=c:1`
vs none at f360), lo/hi shot pairs for `height` and `wind` with a sentence each.

### 5. `feats` and `help.feats`

NAV's list minus the table-era reads (`interval`, `repeat`, `onset`, `harmUnw`, `clarity`), plus `centroid riser hp roll
onsetRate flux dropExpectedIn hush fakeoutEvt flow` (`flow` = the musical time the Re bias integrates in). `peaks` stays
(the scratch's pitch source). **Every field in `feats` must be read** (the static read check warns on a phantom; `check.js`
fails on a `help.feats` gap and on an undeclared read at param registration) — drop anything you end up not reading.
`help` three depths (eli5 / why / math), non-empty, written for a listener, describing the *force model* (not NAV's
charts); `tag` one line; `hud()` one line (mode, c, ρ, q, wind, curl, spin, pitch).

## Non-negotiables (README, CONTRACTS §0) and the traps the previous NAV/TORUS2 workers hit

- No `Math.random()`, no wall clock (`performance.now`, `Date`) — musical time (`flow`, `beatCount + beatPhase`) or
  `dt`. A constant is a named manual setting at the top of the module. Scenes import nothing from `core/` or `engine/`.
  Module cap 500 lines. `node tools/check.js` 0 fail after every edit; the scene must load in node (`check.js` imports
  it: no DOM, no GL at import time — build shader sources in `init`; `field.js` must import in node with no DOM).
- HEAD programs (yours are HEAD: `FS_JULIA_V2` uses `pal`, `rot`, `TAU`, `uRes`, `uTime`, `uBands`, `uBeat`, `uPal`):
  never redefine those; never name a GLSL variable `gl_*`; `smoothstep(a, b, x)` with a > b is undefined; every uniform
  fetched.
- `Q` tier flips vs `cuts: 'event'`: `Q.iter` scales the budget as NAV does (`Math.min(420, Math.round(Q.iter …))`) —
  keep it, no per-tier geometry of your own.
- **The reference md5s of ids 0–7 cannot move** (you touch nothing outside your folder + `math/field.js` + two tests) —
  do not shoot them. Your **s8 lines** (`IDS=8 tools/scene-md5.sh <tag>`) are what you prove.
- Cost: `CARD.bench(8, 300)` at pinned `q` 0.95 **and `Q.iter` pinned** (HARNESS "Bench protocol"; §30: NAV cannot be
  benched against NAV — pin `CARD.Q.q = .95` and `CARD.Q.iter` to the same number in both pages) interleaved with
  `bench(0, 300)` and `bench(6, 300)` as control, each in a page where it is the forced scene (a bench of an off-screen
  scene measures its last update's state — §36 friction 12): **NAV2 ≤ 1.5× NAV**, plus **the median of 300 timed
  `update()` calls ≤ 0.5 ms** (the CPU finder is invisible to `bench`; time `CARD.REG[8].scene.update(1/60, CARD.MS,
  CARD.GROOVE || {rot:0}, CARD.LOOK, env)` with the `env` the loop uses — if `env` is not reachable from `CARD`, time your
  own `updateNav2` inner call through a hook `hooks.timeUpdate(n)` that returns the median in ms). Report ms and ratios.
- Headless `Q.q` is not a perf verdict (`CARD.bench` is). Two-argument hooks are reached through
  `CARD.REG[8].scene.hooks.f(a, b)` in an eval; `&name=v` fires one-argument hooks after `init`, before the first frame.
  `goScene` does not beat a sticky `&scene=`. `paramDeps` misses a field behind a short-circuit on the defaults.
- **`overlay()` is called every frame for every registered scene** (loop.js), whether or not that scene was ever updated:
  the skeleton's `if (!this._P) return;` guard stays (the orchestrator's step-0 find: an uncaught `this._P.pip` in NAV2's
  overlay froze the fake clock and moved NAV's own md5 — an exception anywhere in a frame aborts the frame for every scene).

## Process — one commit per proven step, in this order (TORUS2's shape, DECISIONS §36)

1. **The path** (`math/field.js`, `nav2.js` replaces `core.js`, `tools/test_field.js`, `tools/test_nav2.js`; `index.js`
   re-pointed; the shader untouched): a `CLOCK=1` series f600 … f780 every 30 frames with `hooks.n2info()` (returns
   `{mode, c, rho, q, has, wind, curl, pitch, lift, spin, angle, dropExpectedIn}` as a plain object) → Im c tracks the
   fake's centroid ramp with ~0.25 s lag, ρ climbs toward .985 in the build, `has` 1 on every INT frame, f780 ± 1 the exit
   with `pathCut 0`, re-entry before f1500 with the cycle warm. Both node tests pass. Then **the still reference:** the
   `&still=1` s8 md5s at f360 / f480 / f720 / f840 (two `IDS=8 tools/scene-md5.sh` runs for f360/f840 + two `CLOCK=1` shots
   for f480/f720, stable across two runs) — **every later step keeps these four md5s** (still = every new uniform at rest,
   so a visual step that changes a still frame has changed something it should not have). Commit.
2. **The blob with pitch** (`uKoen`, `uView.xy`; `hooks.pitch(v)` pins `pitch`): `hooks.pitch(0.2)` vs `(0.8)` at f480
   montaged — the blob lower / higher, spokes rotated, bands shifted. The still md5s unchanged. Commit.
3. **The detectors** (`detect.js`): a table of `n2info()` at f600/660/720/780/800 (pitch, sweep, roll, swirl, wind,
   count); `hooks.scratch(1)` vs 0 at f480 (`uCurl` — the arms visibly tighter). Still md5s unchanged. Commit.
4. **Wind-up and release**: frames f600/660/720/780 (the build) and f800 (0.3 s after the drop) with wind,
   `dropExpectedIn`, ρ, curl in a table and a 5-shot montage: the arms tighten over the build, the smoulder brightens after
   12.6 s (`uGlow`), the drop releases. Still md5s unchanged. Commit.
5. **Frame turning**: `hooks.swirl(1)` from frame 0 vs none at f480, the angle ≈ `SPIN_SW · 8 s` (report the number and
   the montage). Still md5s unchanged. Commit.
6. **Params**: the six, identity (`paramsOf == derived`), one route (`&param=nav2.wind=c:1`) moves the md5, lo/hi pairs
   for `height` and `wind`. The unrouted s8 md5s unchanged by the move (from() moved verbatim). Commit.
7. **Gates + cost + monitor + report**: a shot series where the melody pinned high (`hooks.pitch` is post-detector — add
   `hooks.wish(x, y)` pinning the wish) walks c through the 1/3 root into the three-arm bulb (n2info `q` 1 → 3, a montage
   before/after); `CARD.bench(8, 300)` interleaved with `bench(0, 300)` and `bench(6, 300)`, `q` .95 and `Q.iter` pinned —
   **≤ 1.5× NAV** — plus the `update()` median ≤ 0.5 ms; the continuity monitor over 60 s of `test&fake=0&scene=8` with
   `CARD.NAV = CARD.REG[8].scene.state` injected before the MON snippet → `viol []` (report `n`, `fast`, `max`); `check.js`
   0 fail; `docs/workers/nav2.md` with the friction and the leans you changed. Commit.

## Acceptance (repo root, all must pass; `PORT=8799` on every cdp run; shots in `tools/work/` prefixed `n2-`)

1. `node tools/check.js` → 0 fail; no new warning except a soft line-cap one.
2. `PORT=8799 GPU=1 node tools/cdp.js 'test&scene=8' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical,glerr:CARD.glerr})"},{"shot":"work/n2-t6"},{"wait":8200},{"shot":"work/n2-t14"}]'`
   → ERRS `[]`, nonFinite `[]`, logical 8; t6 the interior blob with its arms; t14 the exterior after the drop.
3. The house run (brief-common item 3 with `scene=8`, shots `n2-h10/h30/h50`) → three different frames; `bench` reported;
   `errs []`.
4. Every proof shot of steps 1–7, montaged, Read with your own eyes, one sentence each on what it shows.
5. The scene object has `name id tag feats cuts score init update draw overlay post colour params help hud hooks state
   rt`; `feats` is exactly the fields you read; `help.feats` has a line for every one; `score()` returns 0; `state` has the
   monitor's shape.
6. `IDS=8 tools/scene-md5.sh n2` → your s8 f360/f840 md5s are stable across two runs, and the `&still=1` four are the
   step-1 reference (write all six in the report — they become the v0.8 reference).
7. `node tools/bundle.js` → 0 errors; `FILE=$PWD/dist/retinarave.html PORT=8799 NOAUTO=1 GPU=1 node tools/cdp.js 'real'
   '[{"wait":1500},{"clickSel":"#demo"},{"wait":3000},{"key":"9"},{"wait":3000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical})"}]'`
   → errs `[]`, scene 8 (key `9` reaches id 8 — `keys()` reads `REG.length`).
8. `node tools/param-smoke.js`, `node tools/test_field.js`, `node tools/test_nav2.js`, `node tools/test_baby.js`,
   `node tools/test_misi.js` pass.
9. The continuity monitor `viol []` (step 7).

**Report** (`docs/workers/nav2.md`): brief-common (a)–(e) — the friction log (every sentence the docs lack, every guess,
every lean you changed and why), the temptation list, the exact EVAL lines, the bench table (three interleaved pairs,
ratios, the update() median), the shot file names with one sentence each, the parameter table (name · eli5 · range · from
· deps · what lo→hi does), the n2info tables of steps 1, 3 and 4, the gate walk of step 7, the s8 md5s (plain and still),
the line count of every module, and **what you would tune first when the user looks** (the leans you are least sure of —
the orchestrator's own ranking: `Y_AMP`/`PITCH_K`; `LIFT`/`SLIDE`; `W_Y`/`TAU_M`/`K_R`; `CURL`/`SPIN_SW`; the gate policy
and `X_AMP`; the scratch thresholds; `WIND_BEATS` and the `hush` top-up). Leave the worktree committed (`NAV2:` messages);
do not merge.
