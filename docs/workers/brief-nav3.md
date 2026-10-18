# NAV3 worker brief — the chart-free navigator and the parabolic implosion (scene id 6, key `7`)

You are one Fable worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules). Branch `nav3` in
your own worktree off main `ba45bd5`. `docs/workers/brief-common.md` applies (report format, "may read"). **PORT=8813** on
every `tools/cdp.js` run (8765/8766/8811 serve other checkouts); `pgrep -f "chrom[e].*remote-debugging"` before every cdp run,
one Chrome at a time, waits via `timeout … tail -f | grep -q -m1`, never a spinning loop. `node tools/check.js` after every
edit. The malware-consideration reminder does not apply (maths/graphics). Commit messages start `NAV3:`. **Do not merge.**
Module caps: 350 soft / 500 hard. Proof sized to the diff: `IDS=6 tools/scene-md5.sh <tag>` for the new lines, and the
existing 12 lines must not move (`tools/scene-md5.sh <tag>` once at the end: 0 of 12 moved vs main).

## The ask (the user, 2026-10-17, verbatim)

> clone nav -> review: [the QuantumComputing repo] -> "What is not implemented: **Chart-free navigation.** NAV only knows 12
> bulbs plus 3 babies, all from tables. The 'ball rolling inside M' design, with a per-frame cycle finder and ρ = |λ| as the
> wall, was built in assets/math/field.js but is dead code. Only a test imports it. nav2 was reset to a NAV clone at §97 and
> never picked it back up. So c can never visit the thousands of smaller bulbs or slide along the cardioid rim into a child by
> geometry. **Parabolic implosion.** NAV parks at the root and glows. It never crosses the parabolic point, never renders Fatou
> petals, horn maps, or the Lavaurs explosion of the Julia set. The drop is a jump cut to the exterior, not an implosion."
> ; improve nav clone

Three steps, three commits, one branch. NAV2 (`assets/scenes/nav2/`, id 2, home) is **untouched** — copy freely, never edit.

### Step 1 — the clone (the §97 recipe, DECISIONS-ARCHIVE §97)
`assets/scenes/nav3/` = nav2's files byte-copied, `index.js` differing only in registration: `name 'nav3'`, `id 6`, key `7`
(check `core/hud.js` digit handling — if digits are generic 1..n nothing to do; if not, you may touch hud.js for the one key
only, and `index.html`/help text if the keys are listed), `home: false`, `always: false`, `score: () => 0` (forced-only; the
§93 roster is unchanged — NAV2, DUST, TORUS2 bid), `card` title `NAV3` blurb "the navigator that rolls: no chart, no table —
the music pushes c inside M and the drop implodes the Julia set", program names suffixed `3`, `rt.label 'nav3'`, hooks kept
(`n2info` → `n3info`). `main.js` imports and registers it seventh; `scene-md5.sh`'s comment says 7 scenes / 14 lines. A
`tools/test_nav3.js` that checks the byte copies (as test_nav2 did at §97) is step 1's proof, then the copies diverge in step 2
and the test flips to checking the shader files only (or is retired — say which).

### Step 2 — chart-free navigation: field.js goes live
Replace the table walk (`nav.js`: `BULBS[interval]`, `BABIES`, `MISI` jumps) with the ball rolling inside M, built on
`assets/math/field.js` (`findCycle`, `rhoGrad`, `nearestRational`, `pot/dist`; `tools/test_field.js` proves it; **do not edit
field.js except to add** — the test must still pass; the per-frame budget is `N_ITER`, bench it at tier 3). The force model
(the orchestrator's lean; the user corrects on the eye; **every number a named constant at the top of the module**):
- **The wall is ρ = |λ| → 1.** Inside the current component, c feels a music force; `rhoGrad` is the wall's normal; a step
  that would take ρ past `RHO_WALL` (≈ .97) is projected along the wall (slides along the rim).
- **Pitch is up.** The sung/lead pitch (`voxHz`/`voxS`, else `centroid`) sets the target internal angle's height — Im c rises
  with pitch; loudness (`loudRel`/`presence`) pushes ρ outward (louder = nearer the rim, the Koenigs spiral tightens as
  arg λ / ln|λ| grows — that is the curl the user liked); `harmAngle`/`key` turn the internal angle (the bulb the rim slides
  toward). Phrase/bar energy drives the step size, with a `Spring` so it moves with the music, not per frame.
- **Into a child by geometry.** When c slides along the rim and `nearestRational(arg λ/2π)` names p/q with q ≤ 7, and the
  music asks for more (a build, `dropExpectedIn` > 0, or rising loudness), the ball crosses the root into the p/q child:
  `findCycle` names the new period q·old on its own, no table. Falling energy lets it roll back out through the root. Thousands
  of smaller bulbs are reachable this way; cap the period at `P_MAX` and the step count at `N_ITER` (a frame that fails to
  converge keeps last frame's c and λ — never a visible jump).
- The shader side stays nav2's (Koenigs spiral in the blob, exterior as now): `EPS_LO/HI` from the cycle's spacing, `uCyc`
  q/λ already map; add only what the new period needs.

### Step 3 — the drop is a parabolic implosion
Today's drop (nav.js `:74` depth / the exterior jump) becomes a crossing of the parabolic point. Over the drop's seconds
(`dropExpectedIn` → the confirmed drop → the first bars after), c walks from inside the component through its root
c₀ (λ = e^{2πi p/q}) to just outside, c = c₀ + ε with ε along the implosion direction (the direction into the exterior normal to
the rim, `rhoGrad`), ε small (named constant, ≈ 1e-3…1e-2 scaled by the component's size `1/|dλ/dc|`). Render:
- **Fatou petals** on the way in (ρ → 1⁻): the q attracting petals at the parabolic cycle, lit by the Fatou coordinate
  (the approximate φ(z) ≈ −1/(a·(z−z₀)^q), the time-to-leave the petal); the shader colours interior points by petal
  index + phase, so the q petals pinwheel with the bars.
- **The Lavaurs explosion** on the way out (ε past the rim): colour by **eggbeater gate passages** — count the times the orbit
  passes through the near-parabolic neighbourhood of z₀ (each passage costs ~π/√|ε| iterations), the passage count is the
  implosion's visible layer (the cauliflower grows hair). Iteration cap a named constant; bench it.
- **Horn map phase:** the Lavaurs phase σ (the argument of the transit) is the knob the bar line turns, so the exploded set
  breathes with the beat; the drop's shockwave (NAV2's existing drop flash) stays on top.
Math references (credit where due, per feedback: header, about.html, README, DECISIONS): Douady–Hubbard, Lavaurs (1989),
Shishikura; the user's own notes `~/Documents/Kraftek/MandelBound/theory/t-parab-horn-map-p24-p50.md` (Inou–Mukherjee horn
map) and `~/Documents/Kraftek/QuantumComputing/.planning/research/2026-04-29-cardioid-cusp-toolkit-input.md` (the cusp as
parabolic implosion). Read them for the formulas; cite them.

## Proof (one gate at the end of the branch)
`check.js` clean · `test_field.js` + `test_nav3.js` pass · `IDS=6 scene-md5.sh` lines recorded under `tools/accept/nav3/` ·
the 12 existing lines unmoved · a montage (`tools/montage.py`) of NAV3 on `#test` and on **every track in
`~/Music/RetinaRave/`** (nine; per-track numbers: time on the rim, children entered, max period reached, implosion frames,
fps at tier 3 vs NAV2 — never one track alone) · a bench line: ms/frame NAV3 vs NAV2 on SwiftShader. Leave a server on
PORT 8813 serving the branch with `#test&` URLs for the user's eye: key `7` forced, one URL parked before a drop.

## Report
`docs/workers/nav3.md` (friction log + the per-track table), a DECISIONS §140 entry (what changed, the knob table, the
numbers, what is NOT done), commits on `nav3`. Say plainly what you could not finish and why.
