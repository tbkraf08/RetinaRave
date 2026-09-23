# DUST — the Hopf-fibre overlay (v0.2 §14) — worker report

Files: `assets/scenes/dust/fibre.js` (new, 92 lines), `assets/scenes/dust/index.js` (181 → 225 lines).
Nothing outside `assets/scenes/dust/` changed. DUST is id 1 already, so no registration edit.

---

## (a) Friction log — what the docs did not answer, and every guess

1. **`rotSU2` is not what synapse rotated with.** The brief says *"`rotSU2(z, alpha)` (the same one-parameter tumble
   synapse applied in its `(y, q)` plane: rotates the base about the x axis…)"*. Synapse2.html line 1171 rotates only
   `(y, q)` = `(Im z1, Im z2)`:
   `const t = y*cr - q*sr; q = y*sr + q*cr; y = t;`
   That is `hopf.js`'s **`poleOffset(z, delta)`**, not `rotSU2` (which rotates `(x1,x2)` *and* `(y1,y2)`). The two are
   different one-parameter subgroups. **Guess:** followed the brief's explicit parameter assignment (`alpha = r4 =
   0.06·flowBass`, `psi0 = 0`, `delta = 0`) rather than the parenthetical claim, i.e. `rotSU2`. It is the better of
   the two for this picture anyway — it is in SU(2), so it carries fibres to fibres and the family tumbles rigidly;
   `poleOffset` is a rotation of S³ but not of the Hopf family. On screen the difference is invisible: either way the
   family sweeps through the projection pole and the gate cuts the run-away arcs.
2. **The tier-3 segment count in the brief is arithmetically wrong.** *"(tier 3: 4 × 10 × 56 = 2240 segments)"* — with
   `q = QT[3] = 1.4`, `nl = floor(2+2·1.4) = 4`, `nF = floor(5+5·1.4) = **12**`, `N = floor(30+26·1.4) = **66**`, so
   tier 3 is **4 × 12 × 66 = 3168**. 2240 is tier 2 (`q = 1`). Confirmed in node against `fibre.js`.
3. **…which makes `ctx.lines.mk(2560)` too small.** The brief says *"`ctx.lines.mk(2560)` once in `init`"*, but 2560 <
   3168. **Guess:** sized the buffer from the formulas instead — `CAP` is computed in `fibre.js` as the max of
   `nl·nF·N` over the four tiers (= 3168) and `init` calls `ctx.lines.mk(CAP)`. `ctx.budget('segs')` is 16384 at tier
   3, so nothing is dropped; `fit()` would drop whole fibres (never truncate a ring) if the core's budget ever shrank
   below the tier's demand, and `emit` also refuses to write past `cap`. Had I obeyed 2560 literally, tier 3 would have
   silently lost 3 of its 12 fibres per torus.
4. **Where does `hooks` get its `this`?** CONTRACTS §1.4 only says *"Hooks: named test entry points; the harness
   exposes them and maps `&name=value` hash params under `#test`."* — nothing about the receiver. Acceptance step 4
   calls `CARD.hooks.fibres(0)`, where `this` would be the aggregated `CARD.hooks` object, not the scene. **Guess:**
   wrote `fibres(v) { SELF.fibresOn = +v; }` against the module-level `SELF` so the receiver never matters. Verified
   both entry points work: `&fibres=0` in the hash and `CARD.hooks.fibres(0)` from an eval.
5. **`hooks` fire before `init`.** The brief says *"under `#test` `&fibres=0` calls it before the first frame"* but not
   whether that is before `init(ctx)`. **Guess:** declared `fibresOn: 1` on the scene object literal, not in `init`,
   so `init` cannot clobber a hook that already ran. (Measured: `&fibres=0` does reach the first frame — the A/B md5s
   in (g) are byte-identical to today's DUST, which they would not be if one frame had drawn fibres.)
6. **"`presence`-scaled like the points if DUST does that."** DUST has no `presence` read; its points are scaled by
   `uAlive` (`shaders.js` line 91). **Guess:** multiplied the fibre brightness by `MS.alive` to match, so silence fades
   the rings exactly as it fades the grains.
7. **`spec(f/nF·0.85)`** — the brief's substitute `[bassS, midS, highS][l % 3]` is per *torus*, so every fibre of one
   torus has the same brightness, where synapse varied it per fibre. Took the brief's version and **skipped the
   optional `MS.chroma` per-fibre modulation**: ENGINE.md says chroma is zero on the fake timeline, so it would need a
   floor, and a floored chroma term is a read that does nothing for 24 s of the acceptance run — not worth the entry
   in `feats`.
8. **`this.rt.log` "once"** — the brief says *"log it from `draw` once via `this.rt.log`"*. `rt.log` is documented
   (§1.3) as *"string appended to the 1 Hz test log line"*, i.e. a value that is read every second, not an event.
   **Guess:** rebuilt it every frame (one string concat, ~200 ns) so the 1 Hz line always carries the live counts.
9. **No statement of what `ctx.lines` costs per segment.** §1.12 says *"50 k segments is fine"*. It is not, at this
   granularity — see (h): ~0.4 µs/segment here, so 3168 segments cost ~1.3 ms, an order of magnitude over the brief's
   *"~0.1 ms is the expectation"*. Measured, reported, not worked around.

## (b) Was I tempted to open a forbidden file?

Twice, both resisted:

- **`assets/core/lines.js`**, when the bench came out 10× over the brief's expectation (item 9). I wanted to know
  whether `ctx.lines.set` re-uploads the whole capacity or only `n` segments, and whether `draw` issues one
  instanced call. Instead I bisected from outside: a node micro-benchmark of `emit` alone (0.114 ms at tier 3) proves
  the CPU half is 8 % of the cost, so the remaining ~1.25 ms is `set` + `draw`, and the tier-0/tier-3 pair shows it is
  per-segment, not fixed per-call overhead. That was enough to report the number honestly without reading the file.
- **`assets/core/help.js` / whatever aggregates `hooks`**, for item 4. Resolved by binding `SELF` explicitly and
  testing both call paths.

I also wanted `assets/scenes/torus/index.js` to be sure the overlay does not read as a second TORUS. Did not open it;
judged from the brief's description (144 rings, bright, full frame) against the shots — 2–4 dim tori of 7–12 fibres,
always inside the cloud's footprint, is plainly a different object.

## (c) Acceptance outputs, verbatim

**1. `node tools/check.js`**
```
check: 51 modules · uniforms 89 · MS keys 117 · scenes 5 (help.feats gaps 0) · 0 fail · 0 warn
```

**2. `PORT=8776 GPU=1 node tools/cdp.js 'test&scene=1' …` (and `&fibres=0`)**
```
EVAL … => "{\"errs\":[],\"bad\":[],\"glerr\":0}"                                        (fibres on)
EVAL … => "{\"errs\":[],\"bad\":[],\"glerr\":0,\"on\":0,\"log\":\"fib off\"}"           (&fibres=0)
shot work/dustf-t6 · work/dustf-t14 · work/dustf-t6-nofibre · work/dustf-t14-nofibre
```
White-pixel measurement — see (i). Shots — see (j).

**3. A/B md5** — see (g).

**4. `test&fake=0&demo=house&scene=1`**
```
shot work/dustf-h10 · work/dustf-h30 · work/dustf-h50
EVAL … => "{\"errs\":[],\"q\":0,\"tier\":0,\"log\":\"fib 2x7x40 seg 535/2500\",
            \"on\":[1.556,1.532,1.759],\"off\":[5.759,9.339,8.363],\"glerr\":0}"
```
**That `off` triple is rubbish** — three consecutive benches drifting 5.8 → 9.3 ms while the machine was loaded, and
`off` cannot cost 4 ms more than `on`. The brief's own warning applies (*"the absolute numbers swing with load; only
the difference counts"*): benching all of `on` and then all of `off` cannot survive that drift. Re-measured
**interleaved** (on, off, on, off, …, median of each), which does — see (h).

**5. Tier sweep** (`setInterval(function(){CARD.Q.q=0.1},16)`, 8 s, shot; then `0.95`, 8 s, shot):
```
q 0.1  => "{\"tier\":0,\"log\":\"fib 2x7x40 seg 523/2500\"}"
q 0.95 => "{\"tier\":3,\"log\":\"fib 4x12x66 seg 3100/3168\"}"
```

**6. Scene object**
```
EVAL … => "{\"keys\":[\"name\",\"id\",\"tag\",\"feats\",\"cuts\",\"score\",\"init\",\"update\",\"draw\",\"hooks\",
            \"post\",\"look\",\"help\"],
  \"feats\":[\"flow\",\"flowMid\",\"flowBass\",\"bassS\",\"midS\",\"highS\",\"lvl\",\"kick\",\"dropEnv\",
             \"tension\",\"hat\",\"alive\",\"arc\",\"punchy\",\"regularity\"],
  \"helpKeys\":[… the same 15 …],
  \"cuts\":\"onset\",\"id\":1,
  \"post\":\"{\\\"fb\\\":{\\\"decay\\\":0.95},\\\"bloom\\\":{\\\"thr\\\":0.3},\\\"kaleido\\\":0.5,
              \\\"exposure\\\":{\\\"on\\\":true}}\",
  \"hook\":\"function\",\"on\":1,\"look\":[0,0,1]}"
EVAL CARD.goScene(1,true);CARD.HELP.rows(true).join()
  => "regularity,arc,dropEnv,tension,bassS,midS,highS,lvl,kick,hat,alive,flow,flowBass,flowMid,punchy"
```
`look`, `score`, `post`, `cuts`, `id` unchanged; `hud` still there; `help.feats` covers all 15 (`check.js` reports
`help.feats gaps 0`).

## (d) Wrong in the docs

- `docs/workers/brief-dust-fibre.md`: tier-3 counts (2240 should be 3168) and `ctx.lines.mk(2560)` (too small) —
  (a) items 2 and 3.
- `docs/workers/brief-dust-fibre.md`: `rotSU2` described as synapse's `(y, q)` rotation — that is `poleOffset` —
  (a) item 1.
- `docs/workers/brief-dust-fibre.md`: *"`presence`-scaled like the points if DUST does that"* — DUST has no
  `presence`; the field is `alive` — (a) item 6.
- `docs/CONTRACTS.md` §1.4 on hooks says nothing about the receiver of a hook function (a) item 4, and §1.12's
  *"50 k segments is fine"* is not a cost anyone can plan against — a per-segment figure would have saved the
  bisection in (b). Both are omissions, not errors.
- Everything else ran exactly as printed: `tools/cdp.js`, `tools/check.js`, `tools/montage.py`, the `PIL` white-pixel
  one-liner, `CARD.hooks`, `CARD.HELP.rows(true)`, `ctx.budget('segs')`, `ctx.tier()`, `MS.flowBass`, `MS.highS`.

## (e) Final `feats` and `post`

`post` is **unchanged**: `{ fb: { decay: 0.95 }, bloom: { thr: 0.3 }, kaleido: 0.5, exposure: { on: true } }`. The
overlay is additive into the same target before the composite, so the existing trails (0.95) are what make the rings
read as ribbons rather than wires — changing `fb.decay` for them would have changed the swarm too.

`feats` (15, two new):
```
flow  flowMid  flowBass*  bassS  midS  highS*  lvl  kick  dropEnv  tension  hat  alive  arc  punchy  regularity
```
`* new` — `flowBass` is the tumble `alpha = 0.06·flowBass`, `highS` is the third torus's brightness. Every existing
entry the overlay now also moves got its `help.feats` line extended: `flowMid` (ring twist + latitude wobble),
`bassS`/`midS` (first/second ring brightness), `lvl` (overall ring brightness), `kick`/`dropEnv`/`tension` (the scale
`g`), `alive` (silence fades the rings too). `help.eli5` gained one sentence (rings hooked through one another that
can never come apart) and `help.math` one (the fibre formula, stereographic projection, the linking, and why rings
near the pole are cut) — deliberately short, TORUS owns the full mathematics.

## (f) `S0`, the width and the brightness

**`S0 = 0.7`.** The pole gate bounds a projected ring: with `den = 1 − z₃ > 0.14` the radius is
`√((1+z₃)/(1−z₃)) ≤ √(1.86/0.14) = 3.64`, so the widest sweep the overlay can ever make is `S0 · 3.64` world units.
The camera (`lookVP`, `dist` 4.4, fov 55°) gives a frame half-height of 2.3, so `S0 = 0.7` → 2.55 puts the extreme arc
just at the top and bottom edge and everything else inside. Judged on shots at three values:

- `S0 = 0.9` (the brief's starting point) — the outer torus sweeps to 3.3 and runs off the top and down the left of
  frame; on an otherwise black background it reads as a separate mesh *beside* the cloud, not through it. Rejected.
  (`tools/work/dustf-t6.jpg` at the first pass — the arcs occupy the empty left third.)
- `S0 = 0.55` — contained, but the small tori shrink to a knot in the middle of the swarm and the rings stop being
  legible as rings. Rejected.
- `S0 = 0.7` — the inner torus (colatitude 36°, R = 1.05, r = 0.325) lands at radius 0.51–0.96, right through the body
  of a formation of radius ≈ 1; the outer one arcs around the cloud without leaving the frame. Chosen.

**Width `wpx = 1.5·(h/720)·dist/viewZ`**, exactly as the brief specifies, with `max(viewZ, 0.2)` on the denominator —
the same clamp the points' vertex shader uses on `zc`. In practice `viewZ ∈ [1.9, 6.9]` (dist 4.4 ± the ring radius),
so strokes run 1.0–3.5 px and the clamp never binds; it is there so a ring cannot become a 300 px slab if the camera
ever dollies to 2.2 with a drop-swollen `g`. Sub-1 px strokes dim instead of thinning (§1.12), which is what makes the
far half of every ring fall away on its own.

**Brightness** as specified: `it = 0.3·(0.35 + lvl)`, `bri = it·(0.35 + 1.3·b)·alive` with
`b = [bassS, midS, highS][l % 3]`, palette coordinate `ta + f/nF·0.6`, `ta = 0.15 + 0.22·l`, through a CPU copy of the
shader's `palM` (same hue/spread/invert/sat/bri from `LOOK.mood`) so the rings sit *in* the swarm's palette. Peak is
`0.405 · 1.65 ≈ 0.67 × palM` against point brightnesses that reach ~4 — dim by construction. The pole fade
`min(1, (min(den) − 0.14)·4)` goes through the colour and `a` stays 1 (§1.12: alpha is coverage), so no bead appears
on the joints. I did **not** lower it further even though the breakdown shot (h30) has the rings as the most
structured thing on screen: the A/B at (j) shows the cloud is still the brightest thing in the frame, and the rings
only dominate where the swarm has nothing to say.

## (g) The A/B md5 — the points path is untouched

```
$ CLOCK=1 PORT=8776 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=1&fibres=0' \
  '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"dustf-f360-off"},
    {"until":"window.__FRAME>=840"},{"shot":"dustf-f840-off"}]'
e49cf54ee319db5cd6ac78150a3f977d  tools/work/dustf-f360-off.jpg      <- required e49cf54ee319db5cd6ac78150a3f977d
7119a54250be3ea0c09b1590ce3b9171  tools/work/dustf-f840-off.jpg      <- required 7119a54250be3ea0c09b1590ce3b9171
```
Both match today's DUST byte for byte, first try.

Determinism with the overlay on, two independent runs:
```
669aac71ff5e0f96263c4635c6504659  tools/work/dustf-f360-on.jpg
f26d50dece29a8fc4d6483a0d2f46521  tools/work/dustf-f840-on.jpg
669aac71ff5e0f96263c4635c6504659  tools/work/dustf-f360-on2.jpg      <- identical
f26d50dece29a8fc4d6483a0d2f46521  tools/work/dustf-f840-on2.jpg      <- identical
```
Identical run to run, different from `-off`. No `Math.random()`, no wall clock anywhere in `fibre.js` / `index.js`.

## (h) Bench and segment counts

Measured **interleaved** (on, off, on, off, …) with `CARD.bench(1, 400)`, median of 7 pairs, `Q.q` pinned and 8 s of
settling, `GPU=1`, after two discarded cold calls. `glerr` 0 after every bench.

| tier | `nl × nF × N` | segments budgeted | emitted after the pole gate | `ctx.budget('segs')` | bench on | bench off | **overlay** |
|---|---|---|---|---|---|---|---|
| 0 | 2 × 7 × 40 | 560 | 523–536 | 2500 | 0.868 ms | 0.697 ms | **+0.17 ms** |
| 1 | 3 × 8 × 48 | 1152 | — | 5000 | — | — | — |
| 2 | 4 × 10 × 56 | 2240 | 2176 | 9000 | — | — | — |
| 3 | 4 × 12 × 66 | **3168** | 3051–3100 | 16384 | 2.718 ms | 1.351 ms | **+1.37 ms** |

Same interleaved measurement on the house demo at tier 3 (9 pairs): on 2.463 ms, off 1.348 ms → **+1.12 ms**, tight
(on 2.36–2.55, off 1.18–1.42), so the two runs agree.

Every tier is inside `ctx.budget('segs')` with room to spare; `fit()` never drops a fibre. The pole gate removes
4–6 % of the segments (523/560 at tier 0, 3100/3168 at tier 3) — it is the fade, not a cull, that does most of the
work at the pole.

**The cost is ~10× the brief's "~0.1 ms is the expectation", and it is not the CPU.** A node micro-benchmark of
`emit` alone (1000 iterations, warmed) gives **0.021 ms at tier 0 and 0.114 ms at tier 3** — 8 % of the measured
delta. The other ~1.25 ms is `ctx.lines.set` + `ctx.lines.draw`: ~0.33 µs/segment at tier 0 and ~0.44 µs/segment at
tier 3, i.e. per-segment, not fixed per-call overhead (which is why the `segs` budget, not the draw count, is the
knob that matters). Left as measured: the counts are the brief's, they are the tier's budget, and tier 3 is only
reached when the core has already decided there is headroom. If §14 wants it back under 0.5 ms, the lever is the
segment count per fibre (`N = 66` at tier 3 is a lot of straight line for a circle of on-screen radius ~200 px), not
`nF` — dropping fibres would change the picture, dropping `N` would not.

## (i) White pixels at t14

```
dustf-t6           white 0.0000 %
dustf-t14          white 0.0000 %          <- §11 accepted 0.000 %; unchanged
dustf-t6-nofibre   white 0.0000 %
dustf-t14-nofibre  white 0.0000 %
```
(`min(p) > 250` over every pixel, PIL, as the brief prints it.) No white-out; the overlay adds none.

## (j) What each shot showed

| shot | one line |
|---|---|
| `dustf-t6` | Green swarm, mid-sustain; a fan of ~10 nested fibre arcs sweeps through the upper-left of the cloud and out of its left edge — the family caught mid-tumble, cut where it crosses the projection pole. |
| `dustf-t14` | One second after the drop: cloud blown into blue/violet streaks, the rings swollen by `g` and spread into a wide rosette under it, palette inverted with the points, still clearly dimmer than the grains. |
| `dustf-t6-nofibre` | The same frame with the overlay off — identical swarm, the left third empty. The A/B is unambiguous: the rings add, they do not disturb. |
| `dustf-t14-nofibre` | The same drop frame without the rings; the cloud reads flatter, with nothing threading it. |
| `dustf-q0` (`Q.q` 0.1, tier 0) | Small dense cloud with only three or four faint arcs at its edge — 2 tori × 7 fibres × 40 segments, `fib 2x7x40 seg 523/2500`. Same look, less of it. |
| `dustf-q3` (`Q.q` 0.95, tier 3) | The full rosette: 4 tori × 12 fibres × 66 segments spiralling through the cloud, `fib 4x12x66 seg 3100/3168`. Clearly denser than q0 and clearly the same object. |
| `dustf-h10` (house, groove) | Green/cyan swarm stretched by the house camera, the rings a fine cross-hatch straight through the middle of it. |
| `dustf-h30` (house, breakdown) | Cloud down to a magenta ember; the rings survive as a wide dim spiral around it — the most structured thing on screen, but still dimmer than the ember. |
| `dustf-h50` (house, build) | Pink/blue swarm re-inflated, rings back inside it as texture rather than outline. |
| `dustf-h10/30/50-off` | The same three sections without the overlay (demo synth is not bit-identical, so this is a look comparison, not a diff): the cloud is the brightest thing in every one of the six frames, with or without rings. |
| `dustf-ab.jpg`, `dustf-q.jpg`, `dustf-h.jpg`, `dustf-h-off.jpg` | The montages used for the judgements above. |

Not TORUS: 2–4 tori of 7–12 fibres at 0.7 scale, additive, always within the cloud's footprint, versus TORUS's 144
bright rings across the whole frame.
