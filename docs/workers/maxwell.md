# MAXWELL — worker report (v0.10, scene id 9, key `n`)

The scene: a live 2-D Yee-grid FDTD solution of Maxwell's equations in the TE mode, driven by the music in TORUS2's
language. Brief: `docs/workers/brief-maxwell.md`. Plan: `MAXWELL-SESSION-PROMPT.md`. Worktree:
`.claude/worktrees/agent-a1ef9fb013d34a8f5`, PORT 8820, one Chrome at a time.

Files written: `assets/scenes/maxwell/{index,fdtd,medium,sources,render,probe,help}.js`, `assets/math/nudge.js`,
`tools/test_fdtd.js`. Nothing else was touched.

---

## Step 1 — the kernels and `tools/test_fdtd.js`

`fdtd.js` holds the two GLSL passes and the ping-pong; `tools/test_fdtd.js` holds a 64×64 node twin in the same
update order at the same Courant number, plus five groups of gates. `node tools/test_fdtd.js` verbatim:

```
0. the constants: the emitted GLSL vs the module exports
  ok   blob cutoff — 16 = CUT^2 16
  ok   charge blob width SRCW — 2.3
  ok   current-loop width KW — 3.4
  ok   lab pulse — 1 / 3
  ok   Faraday: the curl of E with the right signs
  ok   Ampere: the curl of H
  ok   Faraday has no source term at all (no magnetic current, so no magnetic charge)
  ok   the dipole is a pair of antiparallel z-currents, in the Ampere pass
  ok   the lossy-medium coefficients ca / cb
1. div B = 0 after 500 steps from a point source (the interior; the clamped edge is not in the identity)
  ok   max |div B| over the interior after 500 steps — 2.706e-16 (max |H| 0.2345)
  ok   the field is not trivially zero — max |H| 0.2345
2. energy in a closed lossless cavity (sigma 0, perfect-conductor wall) over 1000 steps
  ok   EXACT: the Yee energy over 1000 steps, (max - min) / W(0) — 1.231e-14  (W 28.274330)
  ok   NAIVE: drift of its 100-step mean, last window vs first — 0.4071 %
       NAIVE ripple band (max - min) / mean = 10.40 % — the leapfrog half-step, not a leak
3. the front travels at c: the crest advances S cells per step (a well-resolved pulse)
  ok   worst |advance - (n - 40) S| in cells — 0.408  [n40 r21.64 (nS 20, offset 1.64)  n80 r41.48 (nS 40, offset
       1.48)  n120 r61.35 (nS 60, offset 1.35)  n160 r81.23 (nS 80, offset 1.23)]
  ok   the measured speed over 120 steps vs S — 0.4966 vs 0.5
4. the graded absorber: monotone to the edge, zero in the interior, and it swallows the pulse
  ok   sigma falls monotonically inward over the 16 absorber cells — edge 0.750 → 0.000
  ok   zero in the interior, ABSSIG at the outermost cell
  ok   after 400 steps the absorbing cavity holds under a fifth of the mirrored one — absorber 3.356e-1 vs mirror
       28.6011
test_fdtd: OK
```

**The energy gate as the brief words it cannot pass, and the reason is not a bug.** `Σ(ε Ez² + Hx² + Hy²)` is not an
invariant of a leapfrog: E lives at integer steps and H at half-integer ones, so the sum mixes two time levels and
ripples at the local wave frequency with an amplitude of order S. Measured: **10.40 %** band over 1000 steps in a
lossless cavity. What *is* conserved, identically, is the Yee scheme's own discrete energy, with the H term taken as
the product of the two half steps — `Σ(ε Ez_n² + Hx_{n−½}·Hx_{n+½} + Hy_{n−½}·Hy_{n+½})`: **1.2e-14** over the same
1000 steps. The honest reading of the brief's sentence is then the *drift of the naive sum's mean*, which is what
"no energy is created or destroyed" means for it: **0.41 %** between the first and last 100-step window. All three
numbers are printed; only the two that can pass are gated. **Doc item for CONTRACTS / the next brief.**

**Gate 3 likewise needed a measurement that is about the physics and not about the pulse.** The crest of a
well-resolved gaussian sits a constant ~1.3 cells ahead of the ideal point-source front (a constant, not a growing
error: 1.64 → 1.48 → 1.35 → 1.23 at n = 40, 80, 120, 160), so the moving claim is read off the *advance* between
samples. A narrow pulse is the wrong instrument in the other direction: at 1.2 cells of width the spectrum reaches
the Nyquist cell where the scheme's numerical dispersion is worst, and the crest measured **0.426** cells per step
instead of 0.5. At PULSE_W = 3 the measured speed is **0.4966** vs S = 0.5.

### GPU kernel vs the twin

`hooks.lab(1)` puts the page in the twin's own configuration: vacuum, no absorber, a perfect-conductor wall, no music
sources, one pinned gaussian pulse at the centre. `hooks.tier(1)` pins the grid at 384×216 / 3 substeps and
`&param=maxwell.light=c:1` pins the Courant number at 0.5.

```
test&scene=9&tier=1&lab=1&param=maxwell.light=c:1, until __FRAME>=200
EVAL CARD.hooks.mxinfo() => grid [384,216] sub 3 S 0.5 step 596 lab 1 float32 true
EVAL CARD.hooks.energy() => 28.461639
node tools/test_fdtd.js twin 384 216 595 0.5
  {"w":384,"h":216,"steps":595,"S":0.5,"energy":28.461637}
```

**7e-8 relative**; the bar was 1 %. (595 twin steps, not 596: the page's first substep runs its H pass on a zero
field and then its E pass adds the pulse, which is exactly the twin's initial state.)

`IMPLEMENTATION_COLOR_READ_TYPE` on this GPU (headless Chrome, `GPU=1`, ANGLE-GL) is **FLOAT**, and
`EXT_color_buffer_float` renders RGBA32F, so `mkField` upgrades the ping-pong targets from the RGBA16F
`ctx.mkTarget` gives and `readBand` reads FLOAT directly (`hooks.probe().readType` = `"FLOAT"`, `mxinfo().float32`
= true). The half-float decode path is written and exercised nowhere on this machine — flagged, not proven.

### The one physics bug the build had, and how it showed

The plan says the dipole is magnetic and its changing B induces the E rings. Built literally — a magnetic current
`M` added to Faraday's pass — **it breaks ∇·H = 0**. A magnetic current carries a magnetic charge density −∇·M
unless `M` is itself divergence-free, and a point dipole's is not. The visible symptom was in the field lines: the
stream function stopped being path-independent and the contours came out as a bundle of parallel lines running from
the centre to the edge of the frame *along the axis of the integration sweep*. Three wrong guesses were spent on the
sweep before the source was looked at (a plane fit removed from A, a flux-conserving restriction, the restriction's
axes) — the first two were needed anyway, the third was a real bug of its own.

Fixed the honest way: **Faraday carries no source at all**, and the dipole is what a magnetic dipole *is* — a
current loop, in two dimensions a pair of antiparallel z-currents, driven in the Ampère pass, its axis the beat
nudge. div H is then zero exactly and for ever, and `hooks.probe()` went from `loops 0 / open 18` to
`loops 44 / open 0` on the same frame. `test_fdtd` gate 0 now asserts both structurally (`FS_H` contains no source
identifier at all; `FS_E` contains the `blob(+d) − blob(−d)` pair).

### Other things paid for at step 1

- **σ = 0.45 is a decay length of five cells.** The per-substep factor is (1−a)/(1+a) with a = σS/2. The first
  montage was a glow around each source with no wave in it. `SIGMAX` is 0.035 (~70 cells).
- **A continuous source in a low-loss cavity integrates**, so the steady state is the source rate over the loss
  rate. Every amplitude came down by ~8× from the first guess.
- **The H readback must be whole-frame.** A band of rows per frame leaves the CPU copy a patchwork of up to
  `DH/BANDF` different times; a time-patchwork field is not divergence-free and nothing closes. The small target is
  1.6 % of the field's texels — the same cost class as one band of the field, which is what the brief's budget is
  about — so it is read whole. Said in `strokes()`.
- **The restriction must be flux-conserving and on the right axis.** Hx lives on vertical faces and Hy on
  horizontal ones, so the coarse Hx of a block is the mean of the fine Hx *down its left face* and the coarse Hy the
  mean of the fine Hy *along its bottom*. Then the coarse divergence of a block is (1/n) times the sum of the fine
  divergences inside it — zero. A plain block mean is not, and the same average taken along the wrong axis is not
  either; both leave a branch in the integral.

---

## Step 2 — sources and trains

`hooks.train('4' | 'synco')` pins the launches; `hooks.train()` with no argument only reports. (It used to reset:
the first train shot was taken one frame after its own hook had cleared the train it was meant to show.)

The spacings are **measured off the field**, not only predicted from the launch bookkeeping: `probe.js hRow()` reads
one row of Ez back through the centre and finds the crests along +x to sub-cell accuracy. The control is
`hooks.medium(4)` = empty space (a ring reflected off the cavity wall is not a ring of the train) plus
`&param=maxwell.charge=c:0`, which silences the twelve charges and the dipole and leaves only the train.

`test&scene=9&tier=1&train=4&medium=4&param=maxwell.charge=c:0`, f360, spb 87.1 substeps a beat, S in force 0.389:

```
train '4'      rings     [2.947, 38.171, 73.395, 108.618, 143.842, 179.065, 214.289, 249.512]
               predicted [35.224, 35.224, 35.223, 35.224, 35.223, 35.224, 35.223]
               crests    [21.07, 39.58, 74.63, 109.70, 144.60, 179.48]
               crestGaps [18.51, 35.05, 35.07, 34.90, 34.88]          worst 0.34 cells

train 'synco'  rings     [2.947, 20.559, 73.395, 91.006, 143.842, 161.453, 214.289, 231.901]
               predicted [17.612, 52.836, 17.611, 52.836, 17.611, 52.836, 17.612]
               crests    [21.99, 74.39, 92.22, 144.51, 162.27]
               crestGaps [52.40, 17.83, 52.29, 17.76]                 worst 0.54 cells
```

The bar was ±2 cells. The first entry of each `crestGaps` list is the freshest ring's own trailing wake, not a
spacing — the 2-D Green's function has a tail behind the front.

Found by that trace: **the ring geometry must follow the speed in force.** `params.light` scales the Courant number,
and `rings()` / `spacings()` / the carrier's phase step all read the constant `COURANT`, so the numbers said 43.5
cells while the picture showed 34 (light was 0.78 that frame). `OUT.S` is the speed in force now and everything
geometric reads it.

Musical shots (medium on, charges on): `mx-train4-f360` — four evenly spaced rings filling the mirror cavity;
`mx-synco-f360` — the same rings in close-far-close-far pairs. Controls: `mx-train4-vac-f360`,
`mx-synco-vac-f360` — the same two in empty space with nothing else radiating.

---

## Step 3 — the dipole nudge and the 5 % thump

`assets/math/nudge.js` is `turn` / `TURNTC` / `reset` / `angle` lifted out of `torus2/motion.js` the way
`keycolour.js` was lifted out of `torus2/colour.js` (§36), as a factory `mkNudge()` so two scenes never share one
angle, plus one addition: it publishes `rate()`, the angular velocity of the step it just took, which is what drives
the dipole's current. `torus2/motion.js` is untouched (the plan: "not a change to TORUS2"); the duplication is noted
in both files for the orchestrator to fold later.

`test&scene=9&tier=1`, CLOCK=1, every third frame across two beats (124 bpm = 29.03 frames a beat):

```
310 beat 10.678 bounce 0.0000 zoom 1.0771 yaw 3.7164 turnT 3.9270
313 beat 10.781 bounce 0.0001 zoom 1.0768 yaw 3.7437 turnT 3.9270
316 beat 10.884 bounce 0.0156 zoom 1.0920 yaw 3.7675 turnT 3.9270
319 beat 10.988 bounce 0.0494 zoom 1.1254 yaw 3.7882 turnT 3.9270
322 beat 11.091 bounce 0.0250 zoom 1.1028 yaw 3.8571 turnT 4.3197
325 beat 11.194 bounce 0.0007 zoom 1.0793 yaw 3.9171 turnT 4.3197
328 beat 11.298 bounce 0.0000 zoom 1.0787 yaw 3.9693 turnT 4.3197
331 beat 11.401 bounce 0.0000 zoom 1.0785 yaw 4.0147 turnT 4.3197
334 beat 11.504 bounce 0.0000 zoom 1.0781 yaw 4.0543 turnT 4.3197
337 beat 11.608 bounce 0.0000 zoom 1.0777 yaw 4.0887 turnT 4.3197
340 beat 11.711 bounce 0.0000 zoom 1.0773 yaw 4.1186 turnT 4.3197
343 beat 11.814 bounce 0.0012 zoom 1.0781 yaw 4.1447 turnT 4.3197
346 beat 11.918 bounce 0.0286 zoom 1.1051 yaw 4.1674 turnT 4.3197
349 beat 12.021 bounce 0.0483 zoom 1.1254 yaw 4.2049 turnT 4.7124
352 beat 12.124 bounce 0.0127 zoom 1.0912 yaw 4.2707 turnT 4.7124
355 beat 12.228 bounce 0.0000 zoom 1.0790 yaw 4.3280 turnT 4.7124
```

- **the thump peaks ON the beat and nowhere else**: `bounce` 0.0494 at beat 10.988 and 0.0483 at beat 12.021 (the
  constant is 0.05), 0.0000 through the middle of each beat; the zoom goes 1.077 → 1.125 → 1.077.
- **the yaw steps once per beat**: `turnT` 3.9270 → 4.3197 → 4.7124, a step of 0.39270 = 2π/16 exactly, read off
  `beatCount` so it can never drift; `yaw` eases up to each target with a ~0.3 s time constant and is still behind
  it when the next one arrives, which is what makes it a nudge rather than a spin.

The requested five-frame series is `mx-bar-f300`, `-f315`, `-f330`, `-f345`, `-f360`: the whole plane, its charge
ring and its medium rotate a little further anticlockwise in each, and f345 is visibly the largest (it is the frame
of the five nearest a beat).
