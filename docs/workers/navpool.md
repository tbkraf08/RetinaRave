# NAVPOOL (id 7, key 8) — worker notes (DECISIONS §149, 2026-10-28)

Toma: *"make a net new scene (don't touch old ones); goal of scene: combine nav3 with fluid2 -> fluid moving around inside of the dancing set"*.

**Shape.** A whole clone of `assets/scenes/nav3/` (the set rolls, dances, implodes as NAV3) whose Julia INTERIOR is the fluid
substrate's dye, lit as FLUID2's show pass (`shaders-v2.js` `poolSh`), over `trace` × NAV3's old interior. The card declares
`fluid: { grammar: 'bands', reads: true }` (FLUID2's grammar; the substrate steps while this is on screen).

**The stirring (`pool.js`).** Ink is splatted along the critical orbit of the drawn c (inside the filled Julia set while c ∈ M),
mapped plane → screen by the inverse of the shader's view (`p = R(−w)(z − xy)/s`, `uv = (p/(aspect, 1) + 1)/2`), thrown along the
orbit's step in the key hue (look2.js `L2.hueT`). `stir` (= `MS.mid`) sets the rate (`PK.RATE` 40/s × (0.15 + stir) × presence, ≤
`ORB_MAX` 8 a frame); a kick bursts along z₁…z₆; the drop (live slam / map line / shift) rings eight droplets outward. Gated on
visibility (FLUID2's rule). First pass at INK .05 / RATE 90 saturated the pool to white under the bloom; .012 / 40 keeps the hue.

**Params.** `pool` (FLUID2's light on the loudness ladder), `trace` .25, `relief` 24, `spec` .6, `stir` mid — plus NAV3's five.

**Hooks.** NAV3's renamed `n3*` → `np*`, `green3` → `greenp`, `baby3` → `babyp`, `key` → `nppin` (the key pin; `npkey` is the §99 hue-drift knob, as `n3key`); `clipdbg` dropped (no OKLCH
mapping). `CARD.REG[7].scene.hooks.npinfo().pool` = `{vis, on, n, nSplat, total, kicks, rings}`.

**Proof.** `node tools/test_navpool.js`; `IDS=7 tools/scene-md5.sh <tag>`; the full list is `tools/accept/navpool/scene-md5-step1.txt`
(s0–s6 unmoved). The thumbnail is `tools/thumbs.sh "7:360"`.

**Open.** `post.fb.advect` is 0 (an advected trail would drag NAV3's exterior along the current). Toma's eye on the live scene is owed.

## Unit 2 — the set's edge is the wall (Toma: *"I thought the edge of the set would become the walls that it bounces the fluid off of?"*)

**Shape.** No shared substrate any more (no `fluid` slot): `pool-sim.js` is the scene's own Stam solver (`pool-shaders.js`), the core's
tier tables and pass order, RGBA16F `ctx.mkTarget` ping-pongs, stepped in `draw()` once per `update()` (`armSim` / `stepSim`), right
after the Julia pass so the MASK uses that frame's own uniforms. Step: MASK (escape test at the sim grid, 1 inside, ≤ .5 outside with a
one-cell soft edge from the distance estimate; fluid is m > .75) → splats → curl → vort [§151: curl / vort GONE; EDGE + PADDLE after WALLV — see Unit 3] → WALLV (solid cells move at −Δm/Δt along ∇m,
`WALL_K` 1, capped `WALL_VMAX`) → div (0 in the wall) → Jacobi (Neumann: a solid neighbour reads the centre) → grad → advect (never out of
the wall; the dye's wall level is `DYE_THR` .3 so the ink reaches the drawn edge; dye in the wall leaves in `FADE_TAU`, `SQUEEZE` of it onto
the rim; `pool.js` FLOOR adds a thin ink floor per second in every fluid cell).

**Seeing it.** `CARD.REG[7].scene.hooks.npwall()` reads the wall back (rim / deep / wall cells: dye, speed, v·n). On the fake timeline
the kicks land at f204, 236, 264, 292, 320, 352 (`npinfo().pool.kicks` steps): the wall speed jumps ×10 and the rim's inward velocity ×5
for ~16 frames. f760–840: the set breaks into spirals, the ink held in the shrinking basins. Knobs: `&npsim=WALL_K:4,FADE_TAU:.4,SQUEEZE:0`;
`&npsim=BENCH:1` makes `CARD.bench(7, n)` step the solver on every draw.

**Lessons.** `WALL_K` > 1 is a net compression of an incompressible pool: the Jacobi cannot absorb it and semi-Lagrangian advection loses
ink in convergent flow (4 cost 5× the dye). Without the floor the ink sat around the critical orbit, far from the wall.

**Cost** (GPU=1, q .95): NAV3 2.45 ms · NAVPOOL draw 3.8–4.2 · + mask and solver 4.4–6.2 ms.

**Tester round 2.** The dye is conservative at the wall (`ADYE`: mask-weighted back-trace with the own ink for solid taps; solid texels hand
all their ink onto the rim or one texel up the mask; `INK_CAP` .5); the kick multiplies the wall's push (`KICK_WALL` 3, `KICK_TAU` .12);
the solver steps before the Julia pass. Watch-outs: a renormalised back-trace or a squeeze < 1 each look harmless and are not — the first
pumps ink without bound, the second drains the edge because the boundary flickers a cell every frame.

**Tester round 3.** Grain in re-grown lobes on long runs was the vorticity confinement amplifying the wall's velocity jump: VORT is off
on and beside the wall. Deep wall ink is held (not walked up the mask). Bisect recipe: `&npsim=CURL:0` / `SQUEEZE:0` / `WALL_K:0` at f2000.
[§151: VORT and KS.CURL are gone, so `CURL:0` is a no-op now; bisect the paddle with `PADDLE_GAIN:0` / `SLIP:0` / `EDGE_NORM:0`.]

**Quiet-machine bench** (2026-10-28, after the tester's sign-off; GPU=1, `CARD.bench(id, 300)` × 4 at f600, q pinned .95 = tier 3, each
scene on its own page; medians): NAV3 1.75 ms · FLUID2 0.53 ms (its show pass only — the shared substrate step is outside `bench`) ·
NAVPOOL 2.63 ms draw only, **3.87 ms with its mask + solver** (`&npsim=BENCH:1`). Unpinned, all three hold q 1.000 at f900.

## Silence — the pool coasts to rest, the dance idles [§151: the confinement and its gate are gone; the dance gate is unchanged] (DECISIONS §149 addendum; Toma: *"when the music stops something weird happens where the fluid speeds up really quickly"* · *"I also noticed that the set keeps rotating even though there is no sound, it was just faint"*)
- **The finding (the pool).** The solver self-excites in silence through the vorticity confinement: VORT's force is linear in |curl|
  (`uCurlK·|C|·dt`, `KS.CURL` 30, the core's pool default) and at 30 on the 128 grid it beats VEL_DISS .2/s + the scheme's numerical
  damping, so any residual (the last music, a droplet, the wall's Δm flicker) grows until advection saturates it at ~.5–.7 uv/s and winds the
  leftover ink into a tight spiral 5–10 s after the stop. Tails (recipe B, deep speed 30 s after the mute): CURL 30 surges to .5–.7 again
  and again, 20 surges after 15 s calm, 10 stays calm (.008 floor), 0 decays to rest. `WALL_K:0` still self-excites: the wall seeds it but
  does not cause it. The core never runs it flat: its grammars use `curl: 10 + 40·tension`, and tension → 0 in silence.
- **The finding (the set).** NAV3's dance coasts on the beat clock in silence. The clock holds the bpm and keeps cycling beatPhase with
  clockConfPcm .7–.86, and percS RISES to 1 because `perc` → 1 on a dying onset envelope. So the bar turn `N.turn`, the phrase sway and
  the beat breath as read at nav.js `rhoEff` keep moving the edge (≈ .35 rad/s plus a ±.18-turn swing) and ρ bounces .1–.33 instead of
  resting at IDLE_RHO .08. trapA turns too, but the exterior is near black in silence and the turn is invisible, so it is not gated.
- **The gate.** `nav.js idleGate(p) = isFinite(p) ? sstep(ROLL.IDLE, ROLL.IDLE + ROLL.IDLE_W, p) : 1` (`IDLE_W` .15): exactly 1 for
  presence ≥ .3 (every library track after its lead-in), 0 at ≤ .15 (the §142 idle threshold), smooth between. It is an instantaneous
  function of MS.presence, which is already the engine's ema. The finite guard is load-bearing: `30·NaN` would poison `vel` until reload.
  (1) pool: `armSim(dt, on, idleGate(S.presence))` → `SIM.gate` (initial 1 for the BENCH / first-draw path) → `uCurlK = KS.CURL * SIM.gate`.
  (2) the dance (Toma's choice **a**): `N.turn += ps·g·…`, the sway `g·DANCE.SWAY·sin(…)`, the breath as read `ROLL.BREATH·M2.breath·N.g`,
  and (tester round 1, A7) §145's centroid running range eased with `dt * g`. With a frozen centroid, cLo crept up to it, the range fell
  under its .05 floor, and θ drifted about .0017 per 100 frames in a run muted from the start.
  Under music g = 1.0 and every term is `x·1`, which is bit-exact, so the fake pair `eedd6403 / 62b63ea2` does not move. No new uniform,
  feat or param. KS.CURL stays 30. [§151: the confinement and its gate are gone (KS.CURL, SIM.gate, armSim's gate, VORT); the dance gate
  `idleGate` in nav.js is unchanged.]
- **Which files diverged from nav3 and why.** `nav.js` is no longer a copy of nav3's: the gate is navpool's local idle. [§152: it is main's
  nav3/nav.js + §149's seven gate hunks (IDLE_W, idleGate, g) and nothing else; test_navpool section 9 un-gates it and asserts it equals
  nav3/nav.js byte for byte. knobs.js (§147's split) is gone; implode.js and look2.js are byte copies of nav3's again and pinned.]
  nav3 keeps dancing in silence as §142 designed (scene 6 is the control). `move2.js` / `green.js` / `shaders.js` stay byte copies: the
  breath is gated where it is READ, not where move2 makes it, so `M2.breath` itself still pulses in silence. New read-only npinfo
  fields: `g` and `breathG` (= g·M2.breath, the applied breath).
- **Recipes** (`&map=0` REQUIRED: the track map fires kicks into a zero-filled buffer; PORT 88xx, one Chrome at a time): B, music →
  silence by zero-filling `F.mono/L/R` from `F.pushed` at f600 (`at=20`, SeeYouDrop). A, muted from the start. C, the track's end
  (`at=149`). The step lists and readouts are in `tools/accept/navpool/silence-step3.txt`. Results on the final tree (the tester's runs; silence-step3.txt has the before / after
  tables). Recipe B deep speed: .049 (f900), .029 (f1000), .012 (f1200), .0036 (f1500), .0001 (f2400), monotone; before, it surged to
  .98 at f1400. θ is frozen from f900, the turn is flat from f760, ρ is .08 and the applied breath is 0. Recipe A deep speed stays ≤ .018.
  Recipe C deep speed is .0134 (f1000) and .0017 (f1500), non-increasing. The fake pair eedd6403 / 62b63ea2 is unmoved.
  Shots: `silence-before|after-f600/1000/1200/1500.jpg`.
- **Identity under real audio is not exact:** a cold-start file run's presence ramps from 0 over ~25 frames, so the gate is below 1
  there. The fake timeline (presence 1) is the exact proof; real-audio music frames are compared within 10 %.
- **Known gaps** (DECISIONS §149 addendum) [§151: the confinement half of this gap is gone with the confinement]: a quiet room on a live mic can hold presence at .15–.3, which gives partial confinement and a
  noise seed. The engine findings (`perc` → 1 on silence; the beat clock coasting at the held bpm) are logged as follow-ups. nav3,
  core and engine are untouched.

## Unit 3 — the edge is a paddle (DECISIONS §151; Toma: the fluid curls and swirls far too much with the music — the edge should act as a paddle, the fluid pushed where the edge is going and still moving afterwards)

**What went.** Nothing forces curl from the audio any more. The vorticity confinement is gone: the CURL / VORT passes and shaders, the curl
target, `KS.CURL`, `SIM.gate`, armSim's gate (`armSim(dt, on, now)` takes `env.now`). The orbit stir and the kick burst drop INK ONLY
(`F.splat(x, y, 0, 0, …)`; `PK.V` / `PK.KICK_V` / `dirUv` deleted): their thrusts wrapped round the attracting cycle, a vortex driven by
mid × presence. Their ink stays (D1b: it is what makes the motion visible). The drop ring (`RING_V`) and the kick's wall shove
(`KICK_WALL`) stay. The edge's own audio reaction (the dance, the zoom pulse) is untouched.

**The paddle.** Step: mask → splat → WALLV → **EDGE** → **PADDLE** → div → Jacobi → grad → advect → adye.
- `edgeRates(view, prev, dt)` (pure, node-tested by finite difference against `pool.js toUv`): the view's raw rigid rates, spin = dθ/dt
  (wrapped, clamped `SPIN_MAX` 6), grow = ln(s/s')/dt (clamped `GROW_MAX` 4), slide (0 today). Field ṗ = −spin·J·p − grow·p − R(−w)·ẋy/s,
  p = (2uv − 1)(asp, 1). A +rot view turn is a clockwise screen field: L < 0.
- GAP (rates 0, `edg` cleared, msk[1] := msk[0]): the first step, a re-alloc, the switch off, a wall-clock step 50 ms off dt (a stall,
  an off-screen gap, a seek), |dθ| > `EDGE_JUMP` .5, |dγ| > .3. `npinfo().pool.gaps` counts them.
- EDGE: on wall cells raw = WALLV's velocity (× `EDGE_NORM` 1) + the rigid field's tangential part; `edg` = mix(raw, edgOld, e^(−dt/EDGE_TAU)),
  `EDGE_TAU` .06 s.
- PADDLE: a fluid cell within `PADDLE_BAND` 4 cells (8 directions) of a solid tap takes up ue = `PADDLE_GAIN` 3 × mean(edg) (capped
  `PADDLE_VMAX` 1 in HEIGHT units/s, uv·(asp, 1)), one-sided: v += ê·min(gap, |ue|)·w·(1 − e^(−PADDLE_K·dt)), `PADDLE_K` 8/s. It never brakes.
- `SLIP` 1: the velocity back-trace is mask-weighted (a solid tap reads the cell's own velocity) — free slip at the staircase wall.

**Deviations from the signed-off plan.** (1) The impulse is capped at |ue|: the plan's uncapped gap BRAKED — after a stop edg decays with
a noise direction and flow opposing it was dragged to ~0 (rim .11 → .05 in 6 frames). (2) `PADDLE_VMAX` is in height units, not uv/s.
(3) `rim.curl` in the probe is read on the near-wall band (fluid, 4 fluid neighbours, a solid within 3: `rim.nc` cells), because the
stencil rule excludes every rim cell. (4) Toma's defaults GAIN 3 / BAND 4 / SLIP 1 instead of the plan's 1 / 3 / (none): at gain 1
the paddle added too little motion over the removal-only pool (A12). `SLIP` and `EDGE_NORM` are new knobs.

**Seeing it.** `CARD.REG[7].scene.hooks.npwall()`: per class `ke`, `curl` (`nc`), overall `L` (signed angular momentum about the screen
centre, aspect-true), `nf`, `nan`, `wall.edge` (mean |edg|). `npinfo().pool`: `spin`, `grow`, `gaps`, `spinTh`. Hooks (harness only):
`npspin(rate, frames)` / `&npspin=1.5,60` turns the drawn view for N updates then HOLDS (θs 0 by default: bit-exact); `nppk` /
`&nppk=KEY:v` sets `pool.js PK`. A/B: `&npsim=PADDLE_GAIN:0` (removal only), `PADDLE_GAIN:1,PADDLE_BAND:3,SLIP:0` (the plan's).

**Recipes / tables.** `tools/accept/navpool/momentum-step4.txt` (the calibration BEFORE / PRED-S2a / PRED-S2b, the S2a / S2b re-measures,
AFTER), `scene-md5-step4.txt`, the shot strips `momentum-*.jpg`. Real audio is not run-to-run deterministic (the file's push alignment):
real columns are means of two runs; muted recipes are accepted only at "MUTED at frame 600 sample 1424896".

**Results** (02215d7, the tester's runs; `momentum-step4.txt` §5). Curl AFTER/BEFORE mean .472 (all 12 points < 1: fake deep .37/.37/.10,
rim .80/.71/.27; real deep .34/.26/.32, rim .69/.86/.59). Spin recipe (+1.5 rad/s for 60 frames at f900, muted, DYE_DISS 0): ΔL(f960)
−.274 (74 % of solid body; removal-only −.0022), coast .78 at +.5 s and .60 at +1 s, the edge's velocity at 3.5 % 12 frames after the
stop; mirrored −1.5 gives +.319, .83 / .63. Real audio vs removal-only: rim speed 1.21×, |L| 1.52×. Silence still rests (recipe B deep
.0043 at f1200, .0013 at f1500). Cost +.12 ms (loaded machine, within noise). s7 md5 de6085f2 / fa715035; s0–s6 unmoved.

**Known consequences.** (1) The rim holds less ink on real audio (A8c: .49× BEFORE at f900): the orbit's thrust no longer carries ink
to the wall (D1). (2) Recipe A's f60 deep speed .0242 is the pre-existing start-up transient (BEFORE .0217) plus ~.0025 from the paddle
on the start-up edge motion; ≤ .003 from f160. (3) After a fast spin the sheared near-wall band rolls up into a ring of small eddies near
the rim — edge-driven curl, decaying; A3c (the curl cap calibrated against audio curl) is not a gate for it (Toma's ruling).

## The edge is main's nav3 again (DECISIONS §152; Toma: navpool's edge must move like main's nav3)

§149 had cloned the v0.45 tree's NAV3, i.e. §147's (a kit's shift ARMED for 4 bars and waited for a slam main's engine never sends, so
the implosion never fired on the shift). Now `implode.js` and `look2.js` are byte copies of nav3's (pinned in test_navpool section 1:
a nav3 tune of either fails npm test until navpool re-clones it), `nav.js` is nav3's + §149's seven idle-gate hunks only (section 9
reverts them and compares with nav3/nav.js byte for byte), and `knobs.js` is gone. On a kit the shift implodes on its own frame, as on
scene 6. URL knobs: `&npswell` takes 12 fields (nav3's `&n3swell`), `&npimp` 25 (nav3's `&n3imp`); a link with more fields ignores the
rest. npinfo has no `pend` / `pends` / `pendSlams` / `pendLapsed` / `lift` and `imp` no `kickP` / `steps`. To re-sync after a nav3
change: copy nav3/nav.js, re-apply H1–H7 (section 9's replace list names them), copy implode.js / look2.js.

