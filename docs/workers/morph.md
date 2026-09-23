# MORPH transition — worker report (v0.2 §11)

`assets/transitions/morph.js`, 61 lines, `name: 'morph'`, registered in `assets/main.js` (import + `[mixs, morph]`).
`setTransition('mixs')` left alone. PORT=8776 on every cdp run, shots in `tools/work/` prefixed `morph-`.

## (e) The ease rule and `t` at frame 290

```js
const EASE_LVL = 0.18;   // extra fraction of dm per unit MS.lvl
const EASE_KICK = 0.12;  // ease per second at full MS.kick (kick decays over 0.16 s, so ~0.01 per kick)

if (!(m >= this.mPrev)) this.ease = m;               // new fade, or a reversed one (core swapped a/b)
const dm = Math.max(0, m - this.mPrev);
this.ease = Math.min(1, this.ease + dm * (1 + EASE_LVL * MS.lvl) + MS.kick * io.dt * EASE_KICK);
this.mPrev = m;
const t = Math.max(m, this.ease);
```

Deterministic: only `io.m`, `MS.lvl`, `MS.kick`, `io.dt`. No wall clock, no `Math.random()`. `mPrev` starts at 2 so the
first frame of the first fade resets. Equal `m` (a paused clock) keeps `ease`; only a *decrease* resets it.

**`t` at frame 290 = 0.5888** (`m = 0.4994`, `lvl = 0.498`) — inside the brief's 0.5–0.75 window, and the whole first
fade traces cleanly:

```
frame 233  morph m=0.0086 t=0.0106 lvl=0.891     <- first frame of the fade (the switch at 3.88 s)
frame 234  morph m=0.0172 t=0.0223 lvl=0.828
frame 290  morph m=0.4994 t=0.5888 lvl=0.498     <- 58 frames in, m = 58/116
frame 347  morph m=0.9903 t=1.0000 lvl=0.499     <- ease saturates ~1 % before m does
frame 348  morph m=0.9989 t=1.0000 lvl=0.498     <- 116 frames total, as the brief says
```

The brief's starting point (`1 + 1.3·lvl`, `kick·dt·0.5`) gave `t = 0.6784` at frame 290. See (d): with synapse's
front constants *any* `t ≥ 0.5` is already all-B, so both the ease **and** the front had to be retuned.

Exposed for measurement with `ctx.log` (no-op outside `#test`): one line per fade frame,
`morph m=… t=… lvl=…`, read back with `CARD.log.filter(l=>/^morph /.test(l))`. It contains neither `@` nor `|`, so
`tools/director-trace.sh` (which filters `/@|\|/`) does not pick it up.

## (f) Uniforms declared

| uniform | fetched | source |
|---|---|---|
| `uniform sampler2D uA` | `ctx.tex(pr,'uA',0,io.a)` | outgoing scene target |
| `uniform sampler2D uB` | `ctx.tex(pr,'uB',1,io.b)` | incoming scene target |
| `uniform vec2 uUvS` | `pr.u('uUvS')` | `io.uvS` — every sample is `clamp(uv,0,1)*uUvS` |
| `uniform vec3 uT` | `pr.u('uT')` | `(t, MS.flow, MS.kick)` — synapse's `uT = (trans, flow, kick)` |

`uRes` comes from HEAD (declared and uploaded by `ctx.use`) — not redeclared. MS fields read: `lvl`, `kick`, `flow`.

## (a) Friction log

1. **§5 does not say whether a transition has a `feats` list.** It gives the object as `{name, init, run}` and §0 says
   "Event fields you gate on … belong in `feats` like any other read", but `assets/main.js` only checks `feats` for
   scenes and `tools/check.js` only checks MS-vs-FEATS globally. *Guess:* no `feats` on a transition; the MS fields I
   read are listed in this report and in the file header instead.
2. **§5 does not say how to observe per-transition state from the harness.** The brief offers "keep it on `this` and
   read it with an eval", but nothing documented (`CARD.SC`, `CARD.EFFECTS`, …) exposes the transition object, and
   `CARD.TRANSITIONS` is not in HARNESS.md's `window.CARD` list. *Guess:* `ctx.log` instead.
3. **`io` has no `frameN`.** §3's effect `io` has one ("`frameN` monotonic (it keeps counting while you are skipped)"),
   §5's list is `{a, b, m, out, w, h, sw, sh, uvS, MS, FX, GROOVE, LOOK, dt}` — no `frameN`, and §5 does not say whether
   the omission is deliberate. *Guess:* deliberate (a transition only runs during a fade), so `m`/`dt` carry all timing.
4. **"a reversed fade jumps to `1 − m` and swaps `a`/`b`" — §5 never says who does the swap.** Read as: the core hands
   me the swapped targets and a decreased `m`, and my only duty is to reset the accumulator. *Guess:* implemented as
   `if (!(m >= mPrev)) ease = m`, which is correct under either reading (a decrease always restarts).
5. **§5 does not give the aspect ratio convention for a lifted post shader.** `vUv` is "0..1 over the viewport", the
   viewport is `(sw, sh)`; synapse's radial term `length(uv-.5)` was therefore an ellipse in screen space. Nothing says
   whether to keep that or correct it. *Guess:* correct it (`c.x *= uRes.x/uRes.y`) — see (d).
6. **Nothing documents that `check.js` fails any transition whose source contains the word "nav"** (`rel.startsWith
   ('assets/transitions/')` + `/\bnav\b/i`). CONTRACTS §0 and HARNESS both say only "'nav' in core/". Found by reading
   `tools/check.js` (a legal read). Cost: I had to avoid naming the scene in the file's comments.
7. **The "no black border at the edges" requirement and the clamp.** `clamp(uv,0,1)*uUvS` is what `mixs.smp()` does and
   what §5 mandates; confirmed empirically (no border in any of the four shots). No friction, recorded for the next worker.

## (b) Forbidden files

Tempted twice, opened neither.
- `assets/core/scenes.js` — to find out whether the transition object is reachable from `CARD` for the frame-290 `t`
  readout (friction 2). Guessed `ctx.log` instead; it worked first try.
- `assets/effects/composite.js` — to know the tone curve before judging whether the additive edge clips (§5: "check the
  composite does not clip a whole front white"). Measured the JPEGs instead, which is the better answer anyway: across
  the four shots **0.000 % of pixels are white** and at most **0.008 %** clip in any single channel. The edge stays at
  synapse's `.9`; nothing scaled down.

## (c) Acceptance

### 1 — static checks
```
$ node tools/check.js
check: 49 modules · uniforms 89 · MS keys 117 · 0 fail · 0 warn
```

### 2 — fake timeline, first fade, frame 290 (run twice + the mixs A/B)
```
PORT=8776 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&trans=morph' '[{"until":"window.CARD"},{"until":"window.__FRAME>=290"},{"shot":"morph-f290"},{"eval":"JSON.stringify([CARD.SC.cur,CARD.SC.next,CARD.SC.m,CARD.ERRS,CARD.nonFinite()])"}]'

run 1  EVAL … => "[0,3,0.49944444444444386,[],[]]"     morph m=0.4994 t=0.5888 lvl=0.498
run 2  EVAL … => "[0,3,0.49944444444444386,[],[]]"     morph m=0.4994 t=0.5888 lvl=0.498
mixs   EVAL … => "[0,3,0.49944444444444386,[],[]]"

4775571949db4941443c039930cba15c  tools/work/morph-f290-run1.jpg
4775571949db4941443c039930cba15c  tools/work/morph-f290.jpg        <- identical: deterministic
```
`[0,3,0.4994…,[],[]]` as specified, ERRS and nonFinite empty.

**morph-f290.jpg vs morph-f290-mixs.jpg** (same frame, same two scenes, scene 0 → scene 3).
- *mixs*: the two scenes are superimposed over the whole frame, each rigidly rotated and zoomed — scene 0's ridged
  teal field fills the background everywhere, scene 3's magenta/yellow/green ribbon ball sits over it, sharp. It reads
  as a dissolve: nothing is displaced, both pictures are whole, the blend is per-pixel luminance.
- *morph*: spatially separated. The ribbon ball owns the centre and is **larger and sharper** than in mixs (the front
  has already passed there); scene 0 survives only outside the front — a smeared teal/green band down the left third,
  a wedge of its striped chart texture in the top-left corner, teal streaks along the bottom and right. Everything is
  dragged along the flow field: the teal is stretched into long curved filaments instead of the crisp ridges mixs
  shows, and the ribbons trail short comet streaks. No hard boundary, no black border, no white-out; the additive edge
  reads as a soft brightening where the teal meets the ribbons rather than a visible line (scene 0 is dim here).
- Mean luminance 23.7 (morph) vs 14.0 (mixs) — the additive edge is doing real work without clipping anything.

### 3 — three pairs at m ≈ 0.5 (frame 178 after releasing the director at frame 120)
```
(0,2) EVAL … => "[0,2,0.49944444444444386,[]]"    morph m=0.4994 t=0.5889 lvl=0.729   tools/work/morph-0-2-f178.jpg
(1,3) EVAL … => "[1,3,0.49944444444444386,[]]"    morph m=0.4994 t=0.5889 lvl=0.729   tools/work/morph-1-3-f178.jpg
(5,0) EVAL … => "[5,0,0.49944444444444386,[]]"    morph m=0.4994 t=0.5889 lvl=0.729   tools/work/morph-5-0-f178.jpg
```
ERRS `[]` in all three.
- **0 → 2**: the green star-burst mandala has eaten a round hole in the middle of the frame; its serrated petal ring is
  ringed by the brightest edge of the three shots (yellow-green, one near-white crest top-left, 0.002 % of pixels
  clipping in one channel — not a white-out). Scene 0 survives as dark-teal filaments at the far left, far right and
  the corners, visibly smeared outward by the flow field. Front clearly visible, both scenes recognisable, content to
  every edge of the frame.
- **1 → 3**: the torus ribbon ball (pale yellow/green/magenta, strongly streaked by the flow — it looks combed) sits
  centre-left; DUST survives as the sparse cyan speckle field in the left third and a cyan ripple patch top-right, and
  the flow shear is visible as the diagonal seam between the two. Darkest of the three (mean 37.1) because both scenes
  are mostly black; front visible as the speckle/ribbon boundary. No border, no white-out (0.008 % single-channel).
- **5 → 0**: scene 0's teal ridged filigree has taken the middle band with a bright cream core, and POLYTOPE's thin
  magenta/violet arcs survive down the left edge and as faint curves on the right. The strongest "eaten through" read
  of the three — the ridges terminate in a ragged noise front against the dark polytope field. No border, no clipping.

### 4 — cost (`CARD.benchTransition`, 1280×720 headless, GPU=1)
```
n=300   [{"mixs":0.2353,"morph":0.0390},{"mixs":0.0170,"morph":0.0157},{"mixs":0.0153,"morph":0.0117}]
        median  mixs 0.0170 ms   morph 0.0157 ms   ratio 0.92×
n=3000  (after one discarded warm-up call)
        [{"mixs":0.01593,"morph":0.00753},{"mixs":0.00663,"morph":0.00507},{"mixs":0.00693,"morph":0.00693}]
        median  mixs 0.00693 ms  morph 0.00693 ms  ratio 1.00×
```
Budget was ~3×; measured ≈ 1×. Both sit far below the 0.1 ms that HARNESS.md says is the floor where the number "only
says cheap", and the first call of each series is the documented cold one (0.235 / 0.039). **Caveat:** 0.007 ms for a
full-resolution pass is not physical (≈ 140 k fps), so unlike `CARD.bench` the transition bench does not appear to be
readPixels-synced — the honest reading is "both are below the measurement floor, morph is not measurably dearer than
mixs". No octave dropped; six `vnoise` (18 `hash21`) and four texture reads stand.

### 5 — real path, no errors
```
PORT=8776 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&trans=morph' '[{"until":"window.CARD"},{"wait":20000},…]'
run 1 => {"errs":[],"bad":[],"log":["SCENE@0.23 -> 0 bar0.00 gt0.00"]}      0 morph frames
run 2 => {"errs":[],"bad":[],"log":["SCENE@0.14 -> 0 bar0.00 gt0.00"]}      0 morph frames
```
`errs` `[]`, `bad` `[]`, `glerr` absent from the JSON (= `undefined`) — but **no fade ran inside 20 s**: the only
`SCENE@` is the boot line. See (d). Extending the same command to 45 s:
```
=> {"errs":[],"bad":[],"log":["SCENE@0.13 -> 0 bar0.00 gt0.00","SCENE@1.07 -> 4 bar0.96 gt0.00",
    "SCENE@3.95 -> 0 bar3.91 gt0.21","SCENE@23.12 -> 2 bar3.67 gt1.00","SCENE@29.50 -> 0 bar2.34 gt0.94"]}
    last morph frames: m=0.9872 t=1.0000 / m=0.9960 t=1.0000
```
Two soft switches with real fades through morph, still `errs []`, `bad []`, `glerr undefined`.

## (d) Wrong in the docs

1. **brief-morph, acceptance 5: 20 s is not long enough on `demo=house`.** Two runs of the printed command produced
   only the boot `SCENE@`; the demo synth's first soft switch landed at 23.1 s and 29.5 s. The brief's own pass
   condition ("at least one `SCENE@` switch happened (the fade ran)") therefore fails as printed. `{"wait":45000}`
   satisfies it. (The demo synth uses `Math.random()`, so the timing varies — but 20 s looks systematically short.)
2. **brief-morph's tuning target is unreachable with synapse's front constants.** "tune it so that … at frame 290 the
   front is still mid-screen (`t` in roughly 0.5–0.75)". With the lifted `n` and `m`, the front's threshold is
   `n* = (1.05 − 1.5t)/0.9`, while `n`'s screen mean runs 0.75 (centre) → 0.43 (corner). It crosses the whole frame in
   Δt ≈ 0.19 and its midpoint is at **t ≈ 0.40**, so `t = 0.5` — the *minimum* possible, since `t ≥ m` — is already
   ~95 % B, and `t = 0.678` (my first run, brief's suggested ease) was visually pure B with a few teal smudges at the
   left edge. Since the ease can only push `t` *up*, no ease satisfies the brief. Per §5 ("Between the two ends the
   shape is yours") I retuned the front, keeping every term of the lifted shader and changing three constants:
   - `c.x *= uRes.x/uRes.y` — a round front instead of a 16:9 ellipse (uncorrected, the front is an ellipse wider than
     tall: it clears top and bottom early and leaves A only in thin left/right strips — exactly the first shot);
   - radial weight `.35 → .75` — the radial term now spans a larger share of `n` than the noise does, so the front
     takes Δt ≈ 0.45 to cross the frame instead of 0.19;
   - sweep `t*1.5 − 1.05 → t*2.1 − 1.65` — recentres the midpoint on `t = 0.5` and restores the endpoint margins.

   The §5 invariants then hold *analytically*, for any aspect ratio: with `min(length(c),.9)` bounding the radial term,
   `n ∈ [−0.1275, 1.55]`, so `X = 2.1t − 1.65 + 0.9n` satisfies `X(t=0) ≤ −0.255 < −0.15` (picture is exactly `a`) and
   `X(t=1) ≥ +0.335 > +0.15` (picture is exactly `b`). Verified in the log above: `t=0.0106 → m=0` everywhere,
   `t=1.0 → m=1` everywhere. No `step()`/gate hack was needed. Measured result: the front leaves the centre at
   `t ≈ 0.3`, sits mid-screen at `t ≈ 0.5`, clears the corners at `t ≈ 0.73`.
3. **brief-common's uniform table maps `uTime → MS.flow`, but `MS.flow` is not what `uT.y` was in synapse's morph
   pass.** Line 1352 passes `A.flow` directly, so `uT.y → MS.flow` is right here — the table's wording ("uTime |
   MS.flow (musical time — never wall-clock)") happens to agree. Not an error, just worth stating: the front's noise
   drift is on musical time and stops when the music stops, which is the intended idle behaviour.
4. **CONTRACTS §5 sub-heads are out of order in §1** (`1.10` after `1.12`) — cosmetic, noticed while navigating.
5. Everything else in HARNESS.md and the brief ran exactly as printed, including the `&scene=A` /
   `CARD.SC.forced=-1; CARD.goScene(B,false)` recipe for acceptance 3 and the `{"until":"window.CARD"}` first step.
