# NAV3-shift worker report — the shift waits for the slam, the slam hears the sub (branch `nav3-shift`, §147)

Brief: `docs/workers/brief-nav3-shift.md`. Off `main` c3eb3cd (v0.44 + the brief). Four commits, prefixed `SHIFT:`. Not merged.

## What the user saw (The Roots by Long Arm, live, ~97 BPM, 56 s in: "missing a lot of complexity … off beat")

Reproduced on the deterministic clock from 0 on the live lanes (`&map=0`; `tools/work/nav3/roots/trace-full0.json`, every field):
the engine's `shiftEvt` fired at **55.12** (beat 91.73 — between beats), the piece read percussive, NAV3 took the implosion on that
frame (OUT 55.1 → EXT 56.5) and **held EXT to the end** on `shiftHold`; the real drop at **59.05** — a kick at velocity 1 on the beat,
the ears' causal sub gate opening 0 → 1 .08 s later, the ladder .77 — armed nothing: `hp` 0, `bassS` never left (2 s / 32 s ratio .89),
the gate's 32 s mean **0.00** (the sub-void path rightly shut by §143's SUBV_HAD: a sub that was never there has not left), the tongues
locked (.66). And no bass-return ratio could have confirmed it: `bassS` peaked .58 against a 2 s mean of .40 (RET 1.75×), `sub` .99
against .52 (SUB_RET 5×, SUBV_RET 2×). What the drop HAS is the gate opening — §143's own receipt (after every confirmed slam the
gate opened within .25 s).

## 1. The engine's SHIFT arm (`assets/engine/build/build.js`, `feed.js`; every scene)

A fourth arming path. A `shiftEvt` (the frame before — the shift stage runs after the build stage) while nothing is armed, after
MIN_HIST, **arms at once** (not on the bar line: the shift is already a bar late), with no SLAM_AFTER wait; `buildLive` sits at
`SHIFT_L0` .3 — under DUST's .35 void (formations.js), move2's .4 kick veto and NAV2's .45 park, above 0 for the shift stage's own
ARMED rule (no second shift while armed). The void lifting never releases it; MAX bars, silence, a seek, a tempo jump do.

The slam on a shift arm: the on-beat low onset confirmed by **the causal sub gate OPENING** — its 2 s mean under SUBV_OFF as the
onset arrived (shut), at or above SUB_BACK now (`SHIFT_GATE`), on a sub that **arrives** (`SHIFT_HAD` .3: the gate's 32 s mean under
it — the mirror of SUBV_HAD) — and by nothing else (the bass-return ratios are the void paths'), then §143's Confirm (the ladder's
level) as every slam. Measured on the way there (node, `tools/accept/nav3/shift/slams-node.txt`): with the ratios allowed on the
shift arm, TheChain 130.67 slammed on a chorus's bass swell (2× its 2 s mean, the gate open all along — a false one); with the gate
opening alone and no SHIFT_HAD, The Roots 78.72 slammed on a 6 s sub dip inside its own groove (the gate's 32 s mean .54 — a fill)
— the two rules remove both; a kit whose gate is open through the shift (a groove getting louder) never slams by it, the shift is the
scene's to swell on.

**ON_BEAT .125 → .2, and SHIFT_LAST.** Measured before changing: in node's time base the drop kick reads **+.100** past the line
(inside .125); on the page it reads past .125 — the page's lead estimate is −.003 s against node's −.043 (`leadT`), .065 beats at
97 BPM — and the page lost it twice. At .2 the pickup kick a quarter beat before it (−.137 node / −.021 page) took the candidate
under v0.44's first-keeps-it rule (+.5 beat) and expired (CONF .25) a frame before the gate opened. `SHIFT_LAST` 1: on a shift arm
the NEWEST on-beat onset is the candidate — the gate's opening names the last kick before it; the void paths keep the first-keeps-it
rule. Probed on the page frame by frame (`tools/work/nav3/shift/probe.mjs`: the live `BUILDS` imported into the page): the pickup
at x 97.979, the kick at **98.094**, the gate opens on the frame at **59.133** → `dropLiveEvt` there (beat 98.24).

### The slam table (node harness + the Shift stage, `tools/build-node.js`; before = v0.44's knobs; `tools/accept/nav3/shift/slams-node.txt`)

| track | truth | before (v0.44) | after | path |
|---|---|---|---|---|
| **TheRoots80** | 59.05 | none (0/1) | **59.13** (1/1; the page: **59.133**, kick +.094, the gate's frame) | shift |
| SeeYouDrop | 57.6, 105.6 | 57.65, 105.67 | 57.65, 105.67 (the same frames) | void |
| WhoLikesToParty | 57.5, 131.4, 188.8 | 3/3 | 3/3, the same frames | void |
| Vienna | 85.3, 106.7 | 85.40 | 85.40 (+ a shift arm at 185.7, no slam) | amb |
| RaindropsOnRoses | 41.1, 68.6, 137.1 | 68.65 | 68.65 | void |
| IBelongHere | 15.9, 64.7, 129.8, 178.9 | 179.88 | 179.88 (+ shift arms 65.8 / 130.7, no slam) | void |
| Malicious | 148.3 | none | none (a shift arm at 68.9, no slam) | — |
| TheChain | 199.7 | none | none (shift arms 44.7 / 121.6 / 202.7, no slam) | — |
| Comptine | — | none | none (shift arms 33.0 / 111.3 / 120.8, no slam) | — |
| CyborgNinja | — | none | none | — |

**No confirmed slam lost, no slam moved by a frame, 0 new false slams** (the one "false" line, IBelongHere 179.88, is §143's hit on
the 178.85 drop at +1.03 s, before and after alike — the grader's 2-beat window at 128 BPM is .94 s). The Roots slams at **59.13**
(.08 s after the kick — the gate's opening; the brief's 59.0 ± .2).

## 2. NAV3: on a kit a shift ARMS, the slam FIRES (`assets/scenes/nav3/nav.js`, `knobs.js`)

`SWELL.SHIFT_WAIT` 4 bars (0 = v0.44). At or above PERC_LT a shift no longer implodes on its own frame: it sets a PENDING state —
the swell's own latch (`N.swellOn`, the ball pressed to GATE.RHO + .02, θ steered to the nearest gateway, uSwell up: nothing copied)
held through the window whatever shiftHold does — and the first confirmed slam (`dropLiveEvt`, on a beat line by construction) fires
the implosion (kind 'slam', the full pulse) and closes it; none inside the window → the pending lapses into the swell (held while
shiftHold, as §145). **No implosion without a slam.** A shift mid-implosion no longer re-arms (it has no slam); a slam does.
`n3info()`: `pend` (the beat it armed, −1 none), `pends`, `pendSlams`, `pendLapsed`.

`nav.js` stood at 479 lines: the six knob tables and `knob5()` moved to **`knobs.js`** (123 lines; re-exported from nav.js so
`import { ROLL, GATE } from './nav.js'` and index.js's `SWELL` read as before); nav.js 368.

### The shift table (`tools/work/nav3/shift/shift-table.mjs` = §145's replay + the pending counters, through the page traces;
`tools/accept/nav3/shift/shift-table.txt`; before = SHIFT_WAIT 0)

| track | shifts → before | after | implosions (trigger, beat phase) before → after |
|---|---|---|---|
| **TheRoots80** | 55.1 IMPLODED (φ −.27, between beats), 74.4 swelled | 55.1 → pending → **the 59.13 slam fires** (EXT 60.5→), 74.4 swelled | 1 (shift, −.274) → **1 (slam, +.305)** |
| SeeYouDrop | — | — | 2 (slams +.109 / +.150) → the same |
| IBelongHere | 65.8 IMPLODED | 65.8 pending → lapsed → swelled | 1 (shift, +.349) → **0** |
| RaindropsOnRoses | — | — | 1 (slam) → the same |
| Vienna | — | — | 1 (slam, −.015) → the same |
| WhoLikesToParty | — | — | 1 (slam, +.097) → the same |
| Malicious | 68.9 swelled | 68.9 swelled | 0 → 0 |
| TheChain | 44.7 IMPLODED, 55.3 swelled | 44.7 / 55.3 pending → lapsed → swelled | 2 (shift −.262, slam +.162) → **1 (slam +.162)** |
| Comptine | 33.0 swelled, 51.7 swelled (the 52.17 slam) | the same | **0 → 0, 2 swells** (§145 held) |
| CyborgNinja | — | — | 0 → 0 |

Every implosion now has a slam's beat phase (−.015 … +.33: the release frame is the gate's, ≤ CONF .25 beats after an on-beat kick
plus the frame); the three shift-triggered implosions (two of them between beats) are gone. IBelongHere's 65.8 (its 64.7 drop,
which no live path hears) and TheChain's 44.7 (a loud section) now swell — a trade the brief chose ("no implosion without a slam").

## 3. A held EXT breathes with the beat (`implode.js`)

Measured first (`tools/work/nav3/shift/breath.mjs` + `breath.py`: a frame at every beat line and every half beat, 64×64 luma, mean
|ΔY|; v0.44 served from the main checkout): The Roots INT 45–55 BEAT |ΔY| .0450 / HALF .0361; the held EXT 60–75 (v0.44's, from
56.5) **.0497 / .0426** — the hold already moved as much as the interior frame to frame, so the "missing complexity" was not a frozen
picture but the implosion's shape (a c₀ + ε dust at the cusp with the one-way sweep) 4 s early and off the beat. The breath asked
for anyway, as the brief named it:

- `EPS_KICK` .6 (0 = v0.44): ε × (1 + EPS_BEAT·crest·percS **+ EPS_KICK × N.kp × (1 − KICK_LOUD + KICK_LOUD·ladder)**) — the dance's
  own kick impulse (kickAmp on kickEvt, decaying over DANCE.KICK_TAU .2 s), REACTIVE (the user's rule), scaled by the eased ladder
  (`KICK_LOUD` .5: a quiet passage's kick breathes half, a loud one the whole). The dust eats in on every kick and refills between.
- `BAR_STEP` 1 (0 = v0.44): the one-way direction sweep STEPS on the bar line (barPos wrapping) — TURN_MAX/TURN_BARS rad per bar
  landing as the bar turns, the wedge's edge still the stop: a re-chart of the explosion on each bar instead of the free-running
  sweep. `IMP.kickP`, `IMP.steps` in `n3info().imp`.

After (the same grabs on this branch; The Roots imploding at 59.1, EXT 60.5 → held; `tools/accept/nav3/shift/breath.txt`):

| window | BEAT \|ΔY\| mean / p90 | HALF \|ΔY\| | centre black | wash | Y |
|---|---|---|---|---|---|
| INT 45–55 (both) | .0450 / .0656 | .0361 | .149 | .013 | .097 |
| EXT 60–75 v0.44 (held from 56.5) | .0497 / .0623 | .0426 | .140 | .007 | .155 |
| **EXT 60–75 after** (from the slam) | **.0539 / .0728** | **.0467** | .255 | .054 | .209 |
| EXT 60–67 after (the slam's bars) | .0555 / .0757 | .0460 | .333 | .093 | .214 |
| EXT 67–75 after (the held tail) | .0539 / .0702 | .0469 | .178 | .016 | .203 |

EXT's per-beat difference is 1.2× INT's (the target: within 2×), the half-beat breath 1.3×; the centre stays black (.18–.33 ≥ 15 %
of the box under Y .04 — §144's "centre black ≤ 15 %" reads the other way, a floor on blackness, met); the wash over the slam's first
bars (.093) is the slam's own pulse (drive up to 1.6, EPS_DROP 1) eating the former interior to dust, the held tail .016 against
§144's .01 and v0.44's .007 on this track — the kick breath's price, 2× the §144 number on the held bars, for the eye.

## The gates (once, at HEAD)

- `node tools/check.js` **0 fail** (6 pre-existing warns; nav.js 368, implode.js 335, knobs.js 123) · `npm test` **exit 0** (test_build
  **51 pass** — 11 new, test_shift OK, test_nav3 OK, the rest OK).
- the md5 list `PORT=8817 tools/scene-md5.sh shift` (`tools/accept/nav3/shift/scene-md5-shift.txt`): **all 14 lines = `scene-md5-swell.txt` (v0.44) to the byte — 0 moved**, errs [] hop 840 row 72 on the seven ids. The fake timeline never runs the build detector (features-build.js returns on fakeOn) and its own shift lands at 25.45 s, past both frames; NAV3's EXT changes need an implosion the fake reaches at no shot.
- the q trace on the nine drop windows (`tools/work/nav3/q-all.sh shift 6`, real time on the GPU; `tools/accept/nav3/shift/q-shift.txt`): **q .905–.930, fps mean 60 min 60, errs [] on all nine** — SeeYouDrop .930 · IBelongHere .910 · Comptine .914 · Raindrops .910 · Vienna .917 · WhoLikesToParty .928 · Malicious .911 · TheChain **.905** (min .59; §145 read .921 — its window now carries no implosion's OUT at 186 but the 86.1 slam's EXT as before; the one under .91, over the .90 ask) · CyborgNinja .909.
- The Roots real time at tier 3 from 0 on the live lanes (`qtrace.mjs TheRoots80 0 76 6`, the implosion inside: INT 216 / CROSS 4 / OUT 6 / EXT 62 samples): **q mean .966, fps mean 60 min 60**, errs []. (A run seeking to 45 s read q .90 and never imploded — the ladder's history is the read, as the brief warned.)
- the strips `tools/work/nav3/shift-before-55-62.jpg` / `shift-after-55-62.jpg` (2 fps, The Roots 55–62 s): before, the blue set at 55 going
  violet and imploding at 55.5–56.5 (the petals), the red dust from 57, the exploded set turning to 62 with the drop still 3.5 s away
  when it began; after, the ball rolling at the rim through the pending (55–59: the blue set, a crossing into a child at 55.4, the swell's lift turning
  it pink by 57), the way in on the slam at 59.1–60.5 (the petals), the dust from 60.5 — the explosion lands where the drum does.

## The knobs (v0.44 value → this branch)

| knob | where | v0.44 | now |
|---|---|---|---|
| `BUILD.SHIFT_ARM` | build.js (`BUILDK` in node) | — (0) | 1 |
| `BUILD.SHIFT_L0` | | — | .3 |
| `BUILD.SHIFT_GATE` | | — | 1 (0 = the ratios) |
| `BUILD.SHIFT_HAD` | | — | .3 (0 = off) |
| `BUILD.SHIFT_LAST` | | — (0) | 1 |
| `BUILD.ON_BEAT` | | .125 | .2 |
| `SWELL.SHIFT_WAIT` | knobs.js, `&n3swell` 13th | — (0) | 4 bars |
| `OUT3.EPS_KICK` / `KICK_LOUD` / `BAR_STEP` | implode.js, `&n3imp` 26th–28th | 0 / .5 / 0 | .6 / .5 / 1 |

`&n3swell=.5,15,1,8,.4,.6,.15,3,2,.5,1,60,0` + `&n3imp=…(25 of §145's),0,.5,0` is v0.44's NAV3 on this engine; `BUILDK='{"SHIFT_ARM":0,"ON_BEAT":0.125}'` the v0.44 detector in node.

## Trade-offs, not done

- The pending's look on a kit is the §145 swell's (the bands ×1.6, +.15 lum), tuned on a piano. On The Roots with no slam (the
  74.4 shift, and the 55.1 one in a run where the slam was lost) the hold read centre Y .275 / wash .25 over 60–75 s against the
  implosion's .155 / .007 — bright. With the slam it implodes at 59.1 and the swell clears. A kit's own swell look is for the eye.
- The shift arm's `MIN_HIST` is the void paths' 32 s; the shift stage's own is 16 s — a shift in the first 32 s arms nothing.
- The page and node disagree on the lead by ~.04 s (`leadT`); ON_BEAT .2 covers it on The Roots, measured nowhere else (no slam moved).
- `nav.js` 368 / `implode.js` 335 still over the 350 soft cap by the brief's standing warn.
- The breath's numbers were already within 2× before the change; the two knobs are the brief's ask, shipped on, measured, for the eye.

## Addendum — the kit's pending PRESSES, it does not cross (the coordinator's follow-up before the eye; commit 5)

`shift-after-55-62.jpg` showed the pending window 56.5–58.5 as a pink wash. Measured on the frames at 57.5 / 58.5 with one term off per run
(`tools/work/nav3/shift/variants.sh`): the swell's uSwell lift scaled to 0 (`PEND_BANDS` / `PEND_LUM`) moved nothing (centre Y .215 → .214,
wash .155 → .154 over 55.5–59.0); the loudness smoulder off (`&n3smo=0`) moved nothing; the child crossing off (DEPTH_MAX 0) took the frames
from centre Y .25 / .26, wash .21 / .24 to **.11 / .14, .03 / .04**. The wash is the swell's ask opening the gate and the ball CROSSING into a
period-4 child at the rim (par .8) on a loud kit — §145's crossing, which on a piano reads dark. So **`SWELL.PEND_CROSS` 0**: on a kit the
shift's press keeps the rim press and the gateway steer but does not open the gate; the under-PERC_LT swell crosses exactly as §145 (Comptine's
replay: 4 crossings, 2 swells, 0 implosions, unchanged). `PEND_BANDS` / `PEND_LUM` 0 are kept as knobs (`&n3swell` 14th–16th with PEND_CROSS;
`1,1,1` = the piano treatment on a kit) and are inert on The Roots. **55.1–59.1 before this commit: centre Y .215, wash .155, black .275; after:
centre Y .113, wash .022, black .341** (8 frames at 2 fps; v0.44's early implosion over the same seconds read .125 / .016). The replay on The
Roots: 0 crossings (was 1), the 59.13 slam's implosion as before. check.js 0 fail, test_nav3 OK, npm test's other suites untouched by a
scene-folder line. The q trace sees a scene line only where a kit's shift sits in a window: TheChain's (its 202.7 shift falls inside the map's
199.7 implosion, so the press never runs there); re-run three times: **.882 (fps min 48, load 3.9 — a hiccup), .917, .911** against .905 before.
The md5 list cannot move (the fake's shift lands past both frames). 8765 is a static server over this worktree: a reload serves the new
`knobs.js` / `nav.js` / `index.js` — no restart.
