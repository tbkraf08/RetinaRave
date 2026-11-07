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
one-cell soft edge from the distance estimate; fluid is m > .75) → splats → curl → vort → WALLV (solid cells move at −Δm/Δt along ∇m,
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

**Quiet-machine bench** (2026-10-28, after the tester's sign-off; GPU=1, `CARD.bench(id, 300)` × 4 at f600, q pinned .95 = tier 3, each
scene on its own page; medians): NAV3 1.75 ms · FLUID2 0.53 ms (its show pass only — the shared substrate step is outside `bench`) ·
NAVPOOL 2.63 ms draw only, **3.87 ms with its mask + solver** (`&npsim=BENCH:1`). Unpinned, all three hold q 1.000 at f900.

## Silence — the pool coasts to rest, the dance idles (DECISIONS §149 addendum; Toma: *"when the music stops something weird happens where the fluid speeds up really quickly"* · *"I also noticed that the set keeps rotating even though there is no sound, it was just faint"*)
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
- **The gate.** `knobs.js idleGate(p) = isFinite(p) ? sstep(ROLL.IDLE, ROLL.IDLE + ROLL.IDLE_W, p) : 1` (`IDLE_W` .15): exactly 1 for
  presence ≥ .3 (every library track after its lead-in), 0 at ≤ .15 (the §142 idle threshold), smooth between. It is an instantaneous
  function of MS.presence, which is already the engine's ema. The finite guard is load-bearing: `30·NaN` would poison `vel` until reload.
  (1) pool: `armSim(dt, on, idleGate(S.presence))` → `SIM.gate` (initial 1 for the BENCH / first-draw path) → `uCurlK = KS.CURL * SIM.gate`.
  (2) the dance (Toma's choice **a**): `N.turn += ps·g·…`, the sway `g·DANCE.SWAY·sin(…)`, the breath as read `ROLL.BREATH·M2.breath·N.g`,
  and (tester round 1, A7) §145's centroid running range eased with `dt * g`. With a frozen centroid, cLo crept up to it, the range fell
  under its .05 floor, and θ drifted about .0017 per 100 frames in a run muted from the start.
  Under music g = 1.0 and every term is `x·1`, which is bit-exact, so the fake pair `eedd6403 / 62b63ea2` does not move. No new uniform,
  feat or param. KS.CURL stays 30.
- **Which files diverged from nav3 and why.** `nav.js` and `knobs.js` are no longer copies of nav3's: the gate is navpool's local idle.
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
- **Known gaps** (DECISIONS §149 addendum): a quiet room on a live mic can hold presence at .15–.3, which gives partial confinement and a
  noise seed. The engine findings (`perc` → 1 on silence; the beat clock coasting at the held bpm) are logged as follow-ups. nav3,
  core and engine are untouched.
