# Fable Session Prompt — Retina Rave v0.8: NAV2, "the melody draws the path" (written 2026-09-24, after the v0.7 tag)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine, native ES
modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com). **v0.7 "alive"
is tagged** (TORUS2 at id 3, `torus-v1` at id 7; DECISIONS §36–§38). This session builds **one new scene, NAV2 (id 8, key `9`)**, a
from-scratch successor to NAV (id 0, the home scene) designed in plan mode on 2026-09-24 with the user; the design below is that plan,
approved ("plan looks good"). NAV stays untouched and home until the user approves NAV2; then the swap (step 4).

**The user asked for this scene** ("update the NAV scene (don't touch existing, create new scene)"), which lifts the "no new scenes
until asked" rule for NAV2 only.

**Read first, in this order:** this file to the end · `TORUS2-SESSION-PROMPT.md` + `docs/workers/brief-torus2.md` + `torus2.md`
(the process this one copies) · `docs/DECISIONS.md` §0 (the continuity monitor), §5, §29 (NAV params, `reach ← kick`), §30 (NAV cost),
§36–§38 · `docs/CONTRACTS.md` §0, §1 (§1.4, §1.9, §1.13, §1.16) · `docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "Params",
**"What to re-prove after a change"**, "Pitfalls") · `assets/scenes/nav/{index,nav,shaders-v2}.js` · `assets/math/{mandel,baby,util}.js`
· `assets/engine/feats.js`, `assets/engine/sources/fake.js` · `tools/monitor.js`, `tools/parity.js` (forces `&scene=0`), `tools/scene-md5.sh`
(`IDS=`) · memory `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/{project_torus2,feedback_test_scope,feedback_colour_default}.md`.

---

## Context

The user, after TORUS2 was approved and v0.7 tagged: *"enter planning mode for next fable session to update the NAV scene (don't
touch existing, create new scene); torus2 looks really good -> what can we learn from this? right now we are bounded by known
locations, how can we make the music actually navigate? Sometimes it feels like when there is a blob in the middle seems like when a
sound moves up and down that the set isn't moving with it. Also I like the the way the set curls, but doesn't always line up with
elements I was expecting. Would be cool when you hear a swirl that it starts curling (and when building before a drop)."*

**What is wrong with NAV today (explored):** navigation is a *choice among tables* — `BULBS[interval]` (12 bulbs by rotation number),
`BABIES[seed]` (three baby copies on a repeated section), `MISI` (14 Misiurewicz points the beat kick jumps to) — and a walk on a chart
inside that choice (`nav.js:82`, multiplier λ = ρe^{iα} with α ← `harmUnw`, ρ ← `intensity`). **Nothing in NAV reads pitch**: `centroid`,
`riser`, `roll`, `hp`, `flux`, `dropExpectedIn` are unread; the only pitch-aware term (`uMode` from `peaks`) is behind the DRUM variant's
mix. **The curl is a chart quantity**: the Koenigs spiral's tightness inside the blob is exactly `arg λ / ln|λ|` (`shaders-v2.js:40`), so
"how much it curls" is how near c sits to the bulb's root — today moved only by v3's `build` (park at the root) and by harmony.

**The interview (four questions; these answers are the user's, not leans):**
1. Steering = **"the melody draws the path"**: pitch height is up/down (Im c), another musical quantity the other axis; no charts, no
   target tables. (Declined: harmony steers the external angle; keep interval → bulb.)
2. Pitch → the blob: **the spokes and bands inside the blob slide with pitch** *and* **the whole blob rises and falls with pitch**.
3. A swirl is: **a filter sweep / riser over seconds**, **a drum roll / snare build**, **"that dj scratch sound"**.
4. The curl to cause: **the spiral arms inside the blob** and **the whole frame turning**. (Declined: the exterior line-trap sweep,
   the Misiurewicz dendrite spirals.)

**This file is that deliverable.** The orchestrator writes `docs/workers/brief-nav2.md` from it, exactly as TORUS2's did.

## The design

### 1. Navigation core — a ball rolling inside M (new `assets/math/field.js` + `assets/scenes/nav2/nav2.js`)

c is moved by a **force model**, never looked up:
- **Wishes.** `yWish = Y_AMP·(centroid − 0.5)` (pitch height, `centroid` is a level, ema .35 s in the engine) through a critically damped
  spring (`util.js Spring`, w ≈ 14, ~0.3 s settle) — *up = up*. `xWish = X_HOME + ema(X_AMP·(bass − high), musical time)` — bass-heavy
  music drifts left toward the period-doubling cascade, bright music right toward the cusp; integrated in `flow`, so silence freezes it.
  The melody's pull `vM = (wish − c)/TAU_M`, loosened by `(1 − 0.8·wind)` during a build.
- **The wall is |λ|, not the distance estimate.** Inside a hyperbolic component ρ = |λ| is a smooth coordinate with ρ → 1 exactly at the
  boundary (the design agent measured the exterior DE collapsing like √d at the cusp — useless as a wall). The attracting cycle for
  *arbitrary* interior c is found **chart-free** every frame: `findCycle` iterates the critical orbit 4 096 steps, detects the period by
  nearest return, polishes by Newton on f^q(z) − z (measured: λ to 1e-15 at every bulb centre, 3e-10 at ρ = .995, 0.064 ms for 32 k
  steps). `rhoGrad` (central differences of the polish) is the wall's normal. The wall is `RHO_CAP` = 0.985 (float32 `uC` quantisation);
  an outward push is projected to its tangential part and bisected to the largest step still inside — c **slides along the rim**.
- **Wind-up = pressure toward the wall.** `vR = K_R·wind·(rhoT − ρ)·n` with `rhoT = mix(RHO_FREE, RHO_CAP, wind)`: as `wind` rises the
  ball is pressed to the rim, ρ → 1, and the Koenigs arms tighten *by construction* (`arg λ / ln|λ|`). A hit pushes `rhoT` transiently
  — **no Misiurewicz kick, no kick table** (the user chose chart-free; the continuity monitor's kick clause simply never fires).
- **Gates — the pitch ladder without a table.** Pressed against the rim near internal angle p/q (Farey `nearestRational(arg λ/2π, 7)`,
  gate width `GATE_W/q`, child size proxy `sin(πp/q)/q²·2/|dλ/dc| > SIZE_MIN`, and `build < 0.4` so a wind-up never changes component),
  the cap opens and c walks *through the root* into the child bulb; the finder re-verifies with period q·k. The cardioid's highest point
  is the 1/3 root (Im .6495), so "melody up, pressed to the rim, slide" reaches the three-arm bulb by geometry. Tiny-bulb trap: gates
  need `childSize > SIZE_MIN`; in a component below 2·SIZE_MIN the Re wish becomes a pull to internal angle 0 (the way back out).
- **The drop** (`dropEvt`, the one declared cut): from the interior point, walk the ρ-normal outward to potential `log₂G = −2.2 + 1.7·
  dropStrength` (NAV's depth, `nav.js:74`) by bisection of `escape()`, a 64-sample clean-line check (retry the normal ±5°), `pathCut = 0`,
  mode EXT, `timeScale 2.6`. EXT/HOME follow ∇log₂G (NAV's `lg` spring in chart-free form: `reach` as the target) with a small
  equipotential drift in musical time; HOME returns to the exit potential and unwinds the drift; IN bridges back along the checked
  segment (≤ V_MAX); INT resumes with the pre-drop cycle warm. `rt.home / awayBeat / settledAt` published exactly as NAV does.
- **Continuity by construction:** every non-cut frame moves `cPath` by ≤ `V_MAX·dt` (1.2 units/s → 0.02 at 60 Hz, 0.05 at the loop's
  1/24 s cap) < the monitor's 0.06, so the spike rule can never fire; the drop is `pathCut ≤ 2` + a mode change (both legal). `state`
  keeps the monitor's shape `{mode, cPath, pathCut, kick:{x:0}, baby:null}`. `cuts: 'event'`.
- **Cost:** < 0.1 ms CPU worst frame (finder N ≤ 32 768, pMax ≤ 64, Newton ≤ 8, bisection ≤ 6). Render = NAV's shader + five multiply-adds.
- **Node-provable:** `tools/test_field.js` (DE vs distance at the antenna, potential vs NAV's Böttcher grid to 0.01, period at every
  `BULBS` centre, λ vs the cardioid closed form and `solveMult` to 1e-8, `rhoGrad` vs `1 − √(1 − 4c)`, negatives at c = 0.3, i, −0.75,
  Farey cases) and `tools/test_nav2.js` (drive `updateNav2` from the fake timeline for 48 s in node: the monitor's rule re-implemented,
  `has` on ≥ 98 % of INT frames, one exit at 13 s, one re-entry before 26 s). NAV could never be tested in node (it needs the grid).

### 2. Visual mappings (new `assets/scenes/nav2/shaders.js` = `nav/shaders-v2.js` lifted verbatim + five uniforms)

Every new uniform's rest value is an exact IEEE identity (`x + 0`, `x·1`), so **a frame with every new uniform at rest is byte-identical to
NAV for the same c** — `hooks.still(1)` forces rest and is the no-op gate of every commit. Colour: **v2 verbatim, no OKLCH** (a key-hue
anchor as in TORUS2 is a later opt-in variant, not this session).

| uniform | fed from | what the eye sees | rest |
|---|---|---|---|
| `uKoen` vec2 | pitch (high-passed centroid) | inserted after `shaders-v2.js:40`: `Lk += uKoen.x; ai += uKoen.y;` — the bands breathe and the spokes rotate with the pitch, DRUM's modes and the smoulder follow | (0,0) |
| `uCurl` | `CURL·wind + CURL_SW·swirl` | `ai += uCurl·Lk` — a gain on the natural tightness `arg λ/ln|λ|`; `Lk` is f^q-invariant so no seam | 0 |
| `uView.xy` (exists, always 0 today) | `lift` = high-passed pitch, eased 0.2 s | the whole blob rises and falls; the orbit dots ride with it | (0,0) |
| `uView.w` (exists) | `GROOVE.rot + spin` | the frame turns faster while a swirl lasts and as the drop nears; the angle integrates rates, never jumps | spin 0 |
| `uGlow` | `1 + 0.8·hush` | the smoulder brightens in the silence before the drop | 1 |

Kept verbatim: the line trap, the smoulder, `uIterLo`, the DRUM mix (`uDrum` uploaded as 0 — the door stays open to re-host DRUM).

### 3. Detectors (new `assets/scenes/nav2/detect.js`, pure followers of MS; every constant named at the top)

- **pitch** = `0.5 + PITCH_K·(centroid − ema(centroid, 4 s))`: only *motion* of pitch lifts the blob; a bright mix does not park it high.
- **sweep** = attack/release ema of `max(riser, hp, |centroid trend|/0.12)` (.25 s / .6 s).
- **roll** = ema of `max(roll, (onsetRate − 5)/6)` (.3 / .8 s) — `onsetRate` is real-audio only (`fake.js` never fills it).
- **scratch** (the user's item): a *bend* = |pitch velocity| above a slew threshold on the faster of the centroid and `log₂(peaks[0].Hz)`;
  a *flick* = a bend whose sign flipped; `scratch = ema(clamp((flicks − 1.5)/2.5))·gate`, gate = self-normalised `flux` × (`hitStrength`
  follower or `onsetRate`). **Not demonstrable on `#test`** (`flux = kp` is 0 in the build; `centroid` is smoothed .35 s) — a hook pins it;
  the headed real-music run is its proof (Cyborg Ninja has scratch-like sweeps).
- **swirl** = soft-OR `1 − (1 − sweep)(1 − roll)(1 − scratch)`.
- **wind** (the pre-drop wind-up, synapse's countdown not v3's build alone):
  `count = clamp(1 − max(dropExpectedIn, 0)/8 beats)·(dropExpectedIn ≥ 0)`, `windT = clamp(build·(.35 + .25·tension) + count·(.45 +
  .55·tension) + .3·hush)`, `wind = ema(windT, 0.4 s)`; **dropEvt → wind = 0** (the release; the arms unwind as ρ falls, the spin rate
  drops with `dropEnv`); **fakeoutEvt → no release**, the ema slows to 2.5 s for a beat so the tension leaks out instead.
- **spin rate** = `dir·(SPIN_SW·swirl + SPIN_W·wind²)·(1 − 0.8·rel)`, `dir` from `seed.th` (GROOVE's own rule), integrated to the angle.
- **On `#test`:** `riser = roll = build`, `centroid = .35 + .3·high` rises .44 → .62 over the build (10–13 s), `dropExpectedIn` counts
  6.2 → 0, `hush` 1 after 12.6 s — so pitch lift, sweep, roll, wind and the release are all headlessly visible; scratch and `onsetRate`
  are hook + real-music only.

### 4. Params (§1.16) — six, the cap, named for what the eye sees

| name | eli5 | range | from(MS) (the target; the ease is state) |
|---|---|---|---|
| `height` | how high in the set the melody has taken c | [−1, 1] | `Y_AMP·(centroid − 0.5)` |
| `side` | how far toward the bass side (left) or the bright side (right) | [−1.9, 0.3] | `X_HOME + X_AMP·(bass − high)` |
| `wind` | how hard c is pressed against the boundary: the arms wind up | [0, 1] | the `windT` formula (written `a·(cond ? 0 : 1)` so `paramDeps` records every field) |
| `lift` | how far the blob floats up or down with the pitch | [−0.3, 0.3] | `LIFT·(centroid − 0.45)` (high-pass and 0.2 s ease are state; drives `uKoen` too at a fixed ratio) |
| `spin` | how fast the frame is stirred on top of the groove | [0, 1.5] rad/s | `SPIN_SW·(1 − (1 − riser)(1 − hp)(1 − roll)) + SPIN_W·windT²` |
| `zoom` | how much of the set is in view | [0.5, 2] | NAV's, verbatim: `(1 − .05 bass − .07 hit)(1 + .25 dropEnv)` |

`trap`, `dots`, `pip`, `reach` stay inline expressions (lifted from NAV, not parameters — six is the cap).

### 5. `feats` (every field read, one `help.feats` line each)

NAV's minus the table-era reads (`interval`, `repeat`, `onset`, `harmUnw`, `clarity`), plus `centroid riser hp roll onsetRate flux
dropExpectedIn hush fakeoutEvt flow` (`flow` = the musical time the Re bias integrates in). `peaks` stays (the scratch's pitch source).

## Process (TORUS2's shape — `docs/DECISIONS.md` §36–§38, `docs/workers/brief-torus2.md`)

**Orchestrator, step 0 — the skeleton, proven a no-op:** `assets/scenes/nav2/{index,core,shaders}.js` = NAV lifted verbatim (`nav.js`
→ `core.js` for this one commit), `name 'nav2'`, `id 8`, key `9`, `home: false`, `always: false`, `score: () => 0`, no variants, colour v2
alone, `hooks.still`; `main.js` list `[…, torus, nav2]`; CONTRACTS §1.8 table. Proof (HARNESS "What to re-prove", the registration row):
**one** full `tools/scene-md5.sh` — ids 0–7 = `tools/accept/v0.7/scene-md5-v07.txt` and **s8's lines equal s0's** (`fb74fee4` / `7225ea02`:
NAV2 *is* NAV pixel for pixel), mixs `641f6633` unchanged, parity 0. Commit, then write `docs/workers/brief-nav2.md`.

**Worker (opus, own worktree, own PORT, one commit per proven step, `IDS=8` md5 lines only, no Q trace — §38):**
1. **The path** (`math/field.js`, `nav2.js` replaces `core.js`, `tools/test_field.js`, `tools/test_nav2.js`): a `CLOCK=1` series
   f600…f780 every 30 frames with `hooks.n2info()` → Im c tracks the fake's centroid ramp with ~0.25 s lag, ρ climbs to .985 in the build,
   `has` 1 on every INT frame, f780 ± 1 the exit with `pathCut 0`, re-entry before f1500 warm. The `&still=1` s8 f360/f840/f480/f720
   md5s become the **still reference** every later step keeps.
2. **The blob with pitch** (`uKoen`, `uView.xy`): `hooks.pitch(0.2)` vs `(0.8)` at f480 montaged — the blob lower/higher, spokes rotated.
3. **The detectors** (`detect.js`): a table of `n2info()` at f600/660/720/780/800; `hooks.scratch(1)` vs 0 at f480 (`uCurl`).
4. **Wind-up and release**: frames f600/660/720/780 (the build) and f800 (0.3 s after the drop) with wind, `dropExpectedIn`, ρ, curl.
5. **Frame turning**: `hooks.swirl(1)` from frame 0 vs none at f480, the angle ≈ SPIN_SW·8 s.
6. **Params**: identity (`paramsOf == derived`), one route (`&param=nav2.wind=c:1`) moves the md5, lo/hi pairs for `height` and `wind`.
7. **Gates**: `CARD.bench(8, 300)` interleaved with `bench(0, 300)` and `bench(6, 300)` as control, `q` .95 **and** `Q.iter` pinned (§30:
   NAV cannot be benched against NAV) — **≤ 1.5× NAV**, plus the median of 300 timed `update()` calls ≤ 0.5 ms (the CPU finder is invisible
   to `bench`); the continuity monitor over 60 s of `test&fake=0&scene=8` with `CARD.NAV = CARD.REG[8].scene.state` injected → `viol []`;
   `check.js` 0 fail; report `docs/workers/nav2.md` with the friction and the leans it changed.

**Orchestrator, step 3:** merge, its own md5 lines + still reference, the headed real-music runs (both mp3s, key `9` beside key `1`, the
scratch on Cyborg Ninja), a NAV vs NAV2 montage at the same clock times, `docs/AUDIT-v0.8.md`. **The user looks.**

**Step 4 — the swap, one commit (§37's shape), only on the user's word:** NAV2 → `id 0`, `home: true`, `always: true`, `score: (S) =>
0.5 + S.build` (NAV's bid verbatim); NAV → `nav-v1` at `id 8`, `home: false`, `always: false`, `score 0`, forced-only (key `9`) for one
release. Re-pointed in the same commit: **DRUM (id 4)** stays nav-v1's variant with `score 0` (re-hosting it on NAV2 is later work);
**`tools/parity.js`** `&scene=0` → `8` and `CARD.NAV || CARD.home` → `CARD.REG[8].scene.state` (parity is about the engine; nav-v1 stays
its reference); **`tools/monitor.js`** unchanged if `state` keeps the shape; **the mixs reference** re-bases (the A side is now NAV2);
**scene-md5 lists** with s0 ↔ s8 exchanged → `tools/accept/v0.8/`; `accept.sh` and HARNESS pointers; **`site/about.html`'s NAV line**
rewritten ("the music pushes c through the Mandelbrot set: the melody draws the path, the build presses it against the boundary, the drop
breaks through"); CONTRACTS §1.8; `keys()` needs nothing. Then **the Q trace on house + aba** (NAV2 is the home scene, picked every phrase —
this is where the CPU finder shows or doesn't), `accept.sh` 0 FAIL, DECISIONS §39, tag v0.8, push.

## Leans the user judges on the first montage (ranked by doubt; TORUS2's amplitude leans were 4× off)

1. `Y_AMP` 1.6 and `PITCH_K` 2.5 — how far a melody moves c; may need a running normaliser (a follower like `rLo/rHi`).
2. `LIFT` 0.6 screen / `SLIDE` 3 bands per unit pitch — invisible or nauseating; the fake's build lifts the blob ~0.15 of the frame.
3. `W_Y` 14 / `TAU_M` 0.12 s — musical vs sluggish; and `K_R` with the 0.8 loosening (who wins when the build winds up).
4. `CURL` 2.4 rad/band on top of the natural tightness — may double it into noise; `SPIN_SW` 0.6 rad/s is 2–20× GROOVE's drift.
5. The gate policy (Farey q ≤ 7, `GATE_W` .02, half a beat of pressure, `SIZE_MIN` .02) — how eager the ladder is; `X_AMP` (how far down
   the cascade bass can reach).
6. The scratch thresholds — untested headlessly; the .35 s centroid smoothing may leave only the `peaks[0]` path.
7. `WIND_BEATS` 8 and the `hush` top-up — depends on synapse arming `dropExpectedIn` (tension > .3 and a trusted grid) on real music.

## What this session is not

Not a change to NAV (id 0) or DRUM, not the OKLCH variant, not re-hosting DRUM on NAV2, not deleting `torus-v1`, not TORUS2's leans,
not the Cloudflare dashboard steps (still open; remind once). If the user's first sentence of the session changes the spec, it outranks
every lean above; the four interview answers are theirs.

