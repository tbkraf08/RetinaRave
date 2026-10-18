# NAV3 — the navigator that rolls, and the drop as a parabolic implosion (scene id 6, key `7`; DECISIONS §140)

Worker report for `docs/workers/brief-nav3.md` (2026-10-17). Branch `nav3` in a worktree off main `fc8e1c8`, three commits
(`NAV3:` step 1 / 2 / 3) plus the gate's records, **not merged**. NAV2 (`assets/scenes/nav2/`, the home) is byte-untouched;
`assets/math/field.js` is untouched (`tools/test_field.js` OK on every run); `main.js` gained the one import + the seventh
entry of the registration list; `tools/scene-md5.sh`'s comment says 7 scenes / 14 lines; CONTRACTS §1.8 has the id-6 row.

## What it is

* **Step 1 — the clone (3226203).** `assets/scenes/nav3/` = nav2's eight files byte-copied, `index.js` differing in the
  registration only: `name 'nav3'`, `id 6` (key `7` — `core/hud.js`'s digits are generic, `REG[k − 1]`, nothing to touch),
  `home: false`, `always: false`, `score: () => 0`, the card, the program names `julia3-v2 / mandel3-v2 / julia3 / mandel3 /
  pt3`, `rt.label 'nav3'`. **Hooks are dispatched by NAME across scenes** (`core/harness.js`: `CARD.hooks[k] = sc.hooks[k]`, the
  last registered wins, and `&k=` in the hash is applied to EVERY scene that declares `k`), so every hook is renamed: `n2*` →
  `n3*`, `green` → `green3`, `baby` → `baby3` — `&n2lum=0`, `&baby=` and `CARD.hooks.green` stay NAV2's. `always: false` means the
  s6 pair is not s2's bytes (an `always: false` scene misses frame 0's update — §97's note); the pair is the step-1 record.
* **Step 2 — chart-free navigation (11cb152).** `nav.js` is new: the ball rolling inside M on `math/field.js`. No `BULBS`,
  `BABIES`, `MISI`, no ray grid, no `startGridWorker()`; `walk2.js` is gone. `move2.js` (the kick lane, the beat breath, the sub
  press), `look2.js` (exposure, colour on key) and `green.js` stay byte copies. The component's own coordinate is
  log λ = ln ρ + i·2πθ, holomorphic in c, so one complex division **Δc = Δlog λ / (λ′/λ)** (λ′ from `rhoGrad`'s central
  differences) is the whole continuation — the Newton-on-a-table NAV's `bulbChart` did, in every component of every period.
  The wall is ρ = |λ|: a step whose linear prediction passes `RHO_WALL` .97 loses its radial part (the ball slides along the
  rim); the step is ACCEPTED only when `findCycle` at `N_ITER` names the same period (the §39/v0.8 finding of `docs/workers/
  nav2.md`: *"ρ alone is not a wall — the period test is"*), else it is halved once, else dropped — c and λ stand, never a
  visible jump. Loud is out (the loudness ladder → ρ, `RHO_LO` .25 … `RHO_HI` .93), pitch is up (`math/vox.js` y01 → θ from
  `TH0` .5 toward 1/3, the centroid when nobody sings), `harmAngle` and the key turn θ, a new section mirrors it. **Into a
  child:** against the rim (`GATE.RHO` .9) where `nearestRational(θ, 7)` names p/q within `TOL/q²` and the music asks (a build ≥
  .45, an expected drop, the ladder risen .1 over 2 bars) — while it asks, θ's target snaps to the nearest p/q, so the rim
  slides TOWARD the gateway — the ball crosses: the root by two secant steps along the normal, the child's size
  **R = 1/(|dλ/dc|·q²)** (exact on the cardioid: sin(πp/q)/q²), the landing the DEEPEST of `DIVE·R·{1, 1.5, 2, .6, 2.6}` that
  `findCycle` names q·q₀ (the first that did sat at ρ_child .988 — on the child's rim); `CROSS` eases c ball → root → landing
  over .8 s with the last chart held and `par` peaking at the root. Falling loudness (< .3 for 1.5 bars, latched with a .3
  hysteresis) rolls θ → 0 at double speed and crosses back to the parent (a stack). The kick jumps along the outward normal by
  `KICK3.LEN` .5 × the size. The drop reads `dropLiveEvt` OR `mapDropEvt` (the file map's frame-exact line, §107's rule — missed in the first nine-track run: six tracks never left) OR `dropEvt` (the fake timeline never arms the live detector, so
  `#test` would never leave; `&n3drop=live` is NAV2's read) with a 4-beat refractory.
* **Step 3 — the parabolic implosion (e454504), `implode.js`.** `OUT` (1.4 s): the ball walks to the root c₀ — `solveMult`
  (`math/mandel.js`, a Newton in (z, c) onto λ = e^{2πi p/q}, continued from the ball's λ in steps of .1; a SOLVER, not a
  table) gives c₀ and the parabolic point z₀ to 1e-9 — the Koenigs chart holds to 85 % of the way (ρ → 1: the smoulder), the
  **Fatou petals** fade in from 60 %: the shader colours a non-escaping pixel by the sector of w = z_final − z₀ (q sectors, one
  per beat turns the wheel) and the phase of **Φ ≈ −1/(q·a·w^q)** (concentric time-to-leave bands in each petal), `a` MEASURED
  at the root (g = f^{Qq} at |w| = .02·the cycle's spacing, four directions averaged). `EXT`: **c = c₀ + d̂·ε** with d̂ the first
  direction of a fan around the normal that `field.escapes()` says is OUTSIDE M at ε₀ and 4ε₀, ε₀ = `EPS` .004 · 2^(reach+6) ·
  size, breathing ×(1 + .5·(1 − beatPhase)) per beat and ×(1 + 2·dropEnv) on the slam — σ = frac(π/√ε) sweeps its cycle with
  the beat (uSig turns the hue). The shader draws the imploded set as **the former interior's escape**: an escaped pixel takes
  the dust bands plus the gate-passage layer (entries into R after 2q₀ iterates beyond 2R, so the cycle's own alternation is
  not a transit) and the glow of time spent near z₀; a pixel still inside keeps its petal. `IN` (1.2 s) eases back to the ball
  and restores the chart (`findCycle` re-verified). The budget is 420 iterations and the no-chart short budget is off while
  the implosion runs.

## Friction log — every sentence the docs lacked, every guess, every lean changed

1. **The brief's "ball inside M" is the v0.8 NAV2 of `docs/workers/nav2.md`** (§39, reset at §97) — field.js was built for
   it and its report's finding 3 (the period test IS the wall) and finding 4 (the wall must be two-sided) are the two rules
   this nav.js lives by. Not named in the brief; found by reading the file the brief told me to read.
2. **Hooks are global by name.** CONTRACTS says a scene declares `hooks`; nothing says `&n2lum=0` reaches every scene with an
   `n2lum` and that `CARD.hooks.green` is whichever scene registered last. The clone renames everything. The brief's "hooks
   kept (n2info → n3info)" would have left `&baby=`, `&n2*` and `CARD.hooks.green` ambiguous.
3. **A bare knob call WROTE.** `knob5('roll', undefined)` parsed `''` → `[0]` and set `RHO_LO = 0`; my own eval of
   `hooks.n3imp()` set `OUT3.EPS = 0` mid-run and the first implosion shots were of a ball parked ON the root. Every §140 knob
   now READS on an empty / `1` argument (`CARD.hooks.n3roll()` returns the table). look2's / move2's `knob()` / `knob3()` have
   the same hazard (`'0'` → off, `''` → on with the old numbers — harmless there, but the pattern is a trap).
4. **The fake timeline never fires `dropLiveEvt`** — NAV2 on the same `#test` page never leaves either (checked: `n2info().mode`
   INT, `extBeat` 0 at 15 s). Not in HARNESS. NAV3 takes `dropEvt` too, behind `&n3drop=live`.
5. **[lean changed] the landing.** The brief's "the ball crosses the root into the child, findCycle names the new period" is
   right but the FIRST landing findCycle accepted (DIVE·R from a one-step linear root) sat at ρ_child .988 — on the child's rim,
   the slowest place there is — and the ball then climbed down from the wall for a second. Two secant steps onto the root and
   the DEEPEST valid landing fixed it (ρ_child ≈ .4–.6).
6. **[lean changed] the ball needed steering onto the gate.** With the gate waiting for coincidence (θ within TOL/q² of a
   p/q while pressed to the rim) the fake's 3 s build never crossed: ρ lagged (VMAX .6/s) and θ sat between gates. Now the ask
   itself snaps the θ target to the nearest p/q and the roll is twice as fast (`VMAX` 1.2, `GAIN` 4, `W_RHO` 3.5).
7. **[the big one, lean changed] the parent's outward normal at a satellite root points INTO the child.** The brief's
   "c = c₀ + ε along the implosion direction (the direction into the exterior normal to the rim, rhoGrad)" is true at the
   cardioid's cusp (c = ¼ + ε, the classic cauliflower) and FALSE at every satellite root: the child hangs on the outside of
   the parent at exactly that point, so c₀ + n̂ε is the child's slow attracting cycle (the parabolic BIFURCATION, not the
   implosion). The exterior near a satellite root is the thin wedge between the two tangent components, α ∈
   (π/2 − ε/2R_child, π/2 + ε/2R_parent) from the normal (.17 rad wide at ε .014 on a 2/5 bulb). `implode.js` probes a fan
   dense around ±π/2 with `field.escapes()` (the exterior potential, no table) and takes the first direction outside at both
   ε₀ and 4ε₀. In the node drive it finds the wedge on 3 of 4 drops; the 4th (a 1/6 root of a period-7 component, ε₀ 3e-4)
   finds none and falls back to the normal (owed: a finer fan, or ε scaled to the wedge).
8. **[the budget, lean changed] gate PASSAGES at a q-petal root are beyond 420 iterations.** The brief's "each passage costs
   ~π/√|ε|" is the q = 1 normal form; at a q-petal point the orbit's approach from |w| = r costs ~1/(q·a·r^q) iterations of
   f^Q (algebraic, the critical slowing itself): from .15 at the cardioid's 1/3 root the orbit is still .08 away after 420
   iterations of f (measured: `tools/work/nav3/scan.mjs`), and a q = 5 root needs 2·10⁵ g-steps to reach a gate of .02. So the
   "cauliflower grows hair" passage layer exists in the shader (and lights where it can — the outer petal zones, low q) but
   cannot be the implosion's picture inside this budget. What the budget CAN see, and the layer the user gets: at ε = 0 the
   Fatou petals from the orbit's FINAL z (exact — the sector and the phase of Φ are properties of where the orbit sits after
   n steps), and past the rim **the former interior's ESCAPE** — the dust eating inward as ε grows, re-filling as it shrinks,
   breathing with the beat and the slam. The CPU ruler for it is `implode.js layer()`: the fraction of 24 orbits on three
   circles in the former petal (.3 / .6 / .9 of the petal radius) that escape inside 420 iterations — 8–58 % at ε₀, 33–92 % at
   3ε₀ on the node drive's four drops — and their mean passage count (.2–.4 at the cardioid's roots, 2 at a deep one).
9. **The petal coefficient must be measured AT the parabolic point.** Measured at the rim's cycle point (ρ .9) the linear
   term (λ^q − 1)·w swamps a·w^{q+1} and `a` came out 2.7·10⁶; at the Newton root it is 28 (2/5), 55 (1/3 of a period-2
   component). Hence `solveMult` — the one `mandel.js` import, a solver.
10. **Hysteresis on the way out.** `fell` alone flickered: the fake's 2-bar valleys reached 1.5 bars just as the next build
    reset it. `leaving` is latched until the ladder climbs .3 above `FALL`.
11. **`nav.js` is 354 lines** (soft cap 350, hard 500 — a warn, not a fail): the roll, the gate, the crossing and the kick.
    The drop already lives in `implode.js` (213). The next cut is the knobs (`knob5`, 12 lines) to a `knobs3.js`.
12. **Tempted to open a forbidden file:** `core/harness.js` (to learn how hooks dispatch — CONTRACTS does not say; read it,
    the finding is 2 above) and `core/hud.js` (the brief allowed it for the digit key; nothing to change). Nothing in
    `core/` was edited.
13. **The OKLCH mapping (`&colour=oklch`, `shaders.js`) does not carry the implosion's layers** — the uniforms are fetched
    on both programs (a null location is a no-op), the petals and the escape layer are drawn by `shaders-v2.js` (the default)
    only. `shaders.js` stays a byte copy of nav2's.
14. **The thumbnail** `site/thumbs/nav3.jpg` is cut from f360 of the fake timeline (`tools/thumbs.sh "6:360"`); check.js's
    card warn is the reason.

## The per-track table (the gate; `tools/work/nav3/tracks.sh`, PORT 8813)

Deterministic run per track (`CLOCK=1 GPU=1 MUTE=1`, `test&track=<T>&at=<drop − 14>&scene=6`), the counters read at drop + 12 s
of heard time; the fps columns from a 30 s REAL-TIME run per scene with `CARD.Q.hold = 1` (tier 3), the mean of `Q.fps` over
its last 20 s and `CARD.bench(id, 120)` (ms per frame, GPU-timed). See the gate bullet of DECISIONS §140 for the table and the
montage `tools/work/nav3/montage-tracks.jpg` (four shots per track: drop − 6, drop − 1, drop + 1.5, drop + 5).
  | track | drop (s) | rim s | children | max period | drops | implosion frames | petals q | escMax / passMax | fps t3 (bench ms) NAV3 · NAV2 |
  |---|---|---|---|---|---|---|---|---|---|
  | SeeYouDrop | 57.6 | 0 | 0 | 1 | 1 | 635 | 3 | .08 / .25 | 59.7 (10.2) · 60 (4.44) |
  | IBelongHere | 64.7 | 2.6 | 1 | 7 | 1 | 156 | 2 | 0 / .17 | 60 (2.08) · 60 (2.02) |
  | Comptine | 31.5 | 0 | 0 | 1 | 1 | 1171 | 2 | .08 / .13 | 60 (5.29) · 60 (2.04) |
  | RaindropsOnRoses | 68.6 | 0.7 | 0 | 1 | 1 | 636 | 2 | .08 / .29 | 58.9 (10.9) · 60 (2.10) |
  | Vienna | 85.3 | 7.4 | 1 | 3 | 0 | 0 | — | — | 60 (2.23) · 60 (2.05) |
  | WhoLikesToParty | 57.5 | 1.7 | 0 | 1 | 1 | 190 | 7 | .08 / .33 | 59.9 (2.09) · 60 (1.67) |
  | Malicious | 148.3 | 0 | 1 | 5 | 0 | 0 | — | — | 60 (2.09) · 60 (2.09) |
  | TheChain | 199.7 | 5.8 | 1 | 5 | 1 | 111 | 2 | 0 / .17 | 59.9 (3.07) · 60 (1.58) |
  | CyborgNinja | (48, no drop) | 0 | 0 | 1 | 0 | 0 | — | — | 60 (4.20) · 60 (2.08) |

## The dance retune (2026-10-18)

See DECISIONS §140, the addendum "the dance retune": the before / after1 / after2 movement tables are `tools/accept/nav3/dance-*.txt`, the strips `tools/work/nav3/dance-{ibh,chain}-{before,after,nav2}.jpg`, the knobs `ROLL` / `DANCE` / `KICK3.ANG` in `nav.js` (`&n3dance=`). Per beat NAV3 moves a third of NAV2 (median .20 against .57 in |Δlog λ|), per bar it matches NAV2 in angle; the rim time went from 0–22 % to 13–62 %.

## The quality pass (2026-10-18)

See DECISIONS §140, the addendum "the quality pass": the q traces `tools/accept/nav3/q-{before,after1,after2}.txt`, the luminance rows `lum-{before,after,after2,nav2}/`, the edge ruler `glow-edge-*.txt` and the shots `tools/work/nav3/glow-{before,after,after2}.jpg`. The implosion budget follows the governor (`IMP_ITER_MUL` 1.2 × Q.iter, cap 320), the convergence radius grows at the rim (`ROLL.CONV_*`), `P_MAX` 14, nav3 has its own exposure numbers in `look2.js` (`SMO` .85–.995, `LUM_IN` .25/2.5, `EXT.SHARP_IN` 1.6 / `SHARP` 2.2). q .884–.924 against NAV2 .908–.923; wash frames 8 % → 2.9 % (NAV2 4 %). Vienna at period 14 on the wall still washes.

## The depth pass (2026-10-18)

See DECISIONS §140, the addendum "the depth pass": the period-class / wall / stall tables `tools/accept/nav3/depth/periods-{before,after}.txt`, the band rulers `depth/bands-test-strips.txt`, the strips `tools/work/nav3/deep-{before,after}.jpg` and `deepAB-{newconv,oldconv}.jpg`, the q trace `q-after3.txt`. The home is the cardioid and its first-level bulbs (`GATE.DEPTH_MAX` 1, `P_MAX` 7, `CHILD_BARS` 2); the press reaches `ROLL.PULSE_TOP` .965, never the wall (`RHO_HI` .9); the convergence radius was not the flat interior (the same-frame A/B is identical) and stays at the milder numbers.

## The Comptine pass (2026-10-18, branch `nav3-comptine` off v0.43)

See DECISIONS §142: the seven remarks, the five NAV3-only picks (silence rolls to the circle and stops the clock; the sprites and the child disc; the ladder-rise ask gone, BUILD .7; the petal paint confined; the kick jump to the wall, the mirror on keyConf), the replay ruler `tools/work/nav3/replay.mjs` (the nine tracks through their live-lane traces, no Chrome), the records under `tools/accept/nav3/comptine/`, the eye strip `tools/work/nav3/comptine-after.jpg`. Remark 5 (the drops) is branch 2.

## The look pass (2026-10-18, branch `nav3-look` off `drop-piano` a50410e, DECISIONS §144)

The user's remarks on two Comptine captures (the jitter, the washed-out interior at 18 / 26 / 1:34, the spirals that "loop", the hold's blobby
artifacts and weird interior colour); six picks, NAV3-only. Pointers:

* **The rulers** — `tools/work/nav3/look-replay.mjs` (the plan's `sim2.mjs` + replay3's §143 feeds: per track |Δlog λ|/beat, ρ-reversals/s, the
  chart-off share of INT frames, crossings, the implosions with the escape fraction over each hold; `SCAN=1` prints the escape fraction against
  ε/size at every root — the cliff that made the calibration), `look-replay-all.sh <tag>` (the nine + Comptine on the map), `look-shots.mjs`
  (deterministic frame grabs from 0 at any fps list), `look-hue.py` (the 60 fps far-exterior |Δhue| ruler), `look-ruler.py` (the plan's
  black / wash / structure), `look-perc.mjs` (perc vs punchy on the nine), `look-chain.sh` (the Chrome gate in one script).
* **The records** — `tools/accept/nav3/look/`: `replay-{before,after}.txt`, `perc.txt`, `hue-{before,after}.txt`, `frames-{before,after-peek,after}.txt`,
  `scene-md5-look.txt`, `q-look.txt`; the eye `tools/work/nav3/peek-ba-{1,2,3}.jpg` (before over after) and the strips `look-comptine-*.jpg`,
  `look-seeyoudrop.jpg`.
* **Friction.** (1) The escape fraction is a cliff whose place is the root's (a cusp .00 → .96 between ε/size .008 and .016; a q 4–7 root needs
  .03–.06) — the plan's "×4" is one number for every root; the floor is calibrated per drop instead (`ESC_FLOOR` / `ESC_TOP`). (2) `punchy` reads
  a solo piano above SeeYouDrop (the crest factor); `perc` is the scale. (3) The ρ-reversal count never separated the piano from the kit (3.3–5.5
  on all); |Δlog λ| per beat did. (4) `TURN × N.bar` with a time-varying scale would jump — the turn accumulates. (5) The worktree needed the PCM
  dumps and their sidecars (`tools/work/<T>.48000.st.f32{,.json}`) symlinked for `test_vox` beside the traces and `tools/work/vox/`. (6) The 60 fps
  page ruler reads the sawtooth as sign reversals (47–59 % of frames in EXT against 16 % inside), smaller degrees than the recording's frames.
