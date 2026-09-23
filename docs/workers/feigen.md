# FEIGEN worker report (v0.2 §15) — scene id 6, `assets/scenes/feigen/`

Worktree `.claude/worktrees/agent-af13500c4ede78594`, branch `worktree-agent-af13500c4ede78594`, PORT=8777.
Read: `docs/workers/brief-common.md`, `docs/workers/brief-feigen.md`, `docs/CONTRACTS.md`, `docs/HARNESS.md`,
`docs/ENGINE.md` (the engine-texture bullet), `assets/scenes/mandala/{index,shaders}.js`, `tools/check.js`, and the
named line ranges of `synapse2.html`. Nothing else.

## (a) Friction log — what the docs did not answer, and what I guessed

1. **The brief's synapse range stops one line short of the end of `FS_FEIGEN`.** `sed -n '928,962p'` ends at the closing
   brace of the interior `else` branch; the fragment's final assignment is on 963+. The brief says "read these lines …
   Nothing else of synapse", so I did not look. **Guess:** `o = vec4(col * uAlive, 1.);` — from MANDALA's `shaders.js`
   line 80 (`o = vec4(col * uAlive, 1.);`) and the brief's own "`… uTension uAlive` per the table", `uAlive` having no
   other use in 928–962. The t6/t14 shots and the idle behaviour confirm it reads right. This is the same class of
   off-by-one the CONTRACTS friction log already records for the POLYTOPE brief ("the brief's synapse line range
   stopped one line short").
2. **"`tricorn = Math.floor(MS.seed.a·1000) % 2`; also at `init`" is not computable at `init`.** CONTRACTS §1 says
   `init(ctx)` is "Called once, before the first frame" and it receives only `ctx` — there is no `MS`. **Guess:**
   `S.tricorn = 0` in `init`, with the first `MS.sectionEvt` drawing it from the seed. (If the intent was "give it a
   deterministic value before the first section event", 0 is that value.)
3. **Test hooks fire before the scene's first `update`, so the arrival clamp ate them.** `&feig=3` set `feigL = 3`, and
   then the first frame on which `env.SC.logical === 6` ran the brief's line-1450 rule `feigL = min(feigL, 1.2)` and
   threw it away: acceptance step 6 came back `feigen L1.56` instead of level 3, twice. Nothing in CONTRACTS §1.4
   ("Hooks: named test entry points; the harness exposes them and maps `&name=value` hash params under `#test`") or in
   HARNESS says **when** a hash hook is called relative to the first `update`/the first frame the scene is logical.
   **Fix (mine, and the one deviation from a literal reading of the brief):** the `feig` hook also sets the
   already-arrived flag, so the clamp does not fire on the frame the hook's own scene becomes logical. Step 6 then
   reports `feigen L3.37` on both runs. A normal (unhooked) arrival still clamps.
4. **Rounding of `uIter` is unspecified.** The brief gives `uIter = min(500, (70 + 30·L²)·[0.6,0.8,1,1.25][tier])` as a
   real number; synapse passed it through `int(P1.y)`, i.e. truncation. **Guess:** `Math.floor`, to match `int()`.
5. **`ctx.engineTex.row` on the first frames.** §1.1 defines `row` as "the index the next hop will write" but says
   nothing about its value before any hop has been written. Assumed it is already valid (0). Nothing misbehaved, and
   the frame-360 md5 is stable across runs.
6. **`look.set(v)` shape is not guaranteed.** §1.11 says `v` is "a small JSON-able value" filed per section, but nothing
   says the director cannot hand back a value from an older build of the scene (a number where an array is now
   expected). **Guess:** guarded with `Array.isArray(v)` and ignore anything else, so a stale file cannot NaN the dive.
7. **Two different bench `n` in the two briefs.** brief-common's template says `CARD.bench(<id>,60)`, the FEIGEN brief
   and HARNESS say `n ≥ 300`, three runs, median, first call discarded. Used 300.
8. **The performance target in acceptance step 5 is not reachable with the `uIter` formula the same brief specifies.**
   Reported in (g) rather than silently retuned, because the formula is given literally and the alternative degrades
   the mathematics (see the analysis there).

## (b) Was I tempted to open a forbidden file?

Twice, and no, I did not.

- `assets/core/harness.js`, to find out when `&feig=` is applied relative to the first `update` (friction 3). Resolved
  by experiment instead: ran the shot, saw L1.56, inferred "hooks run before the first logical frame", fixed it in my
  own hook. One cdp run, cheaper than the read would have been.
- `assets/core/loop.js` / `harness.js`, to check whether `CARD.bench` renders at `Q.scale` or at full size when the
  numbers came out at 6–21 ms (g). Resolved from HARNESS.md instead: "`CARD.bench(id, n=40)` → ms per **full-resolution**
  render of scene id". That is the answer; no read needed.

## (c) Acceptance outputs, verbatim

**1. `node tools/check.js`**
```
check: 52 modules · uniforms 96 · MS keys 117 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```
`index.js` 203 lines, `shaders.js` 96 lines — both under the 350-line soft cap.

**2. `PORT=8777 GPU=1 node tools/cdp.js 'test&scene=6' …`**
```
EVAL JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CA => "{\"errs\":[],\"bad\":[],\"scene\":6,\"glerr\":0}"
shot work/feig-t6
shot work/feig-t14
```

**3–4. Determinism and the hist proof** — see (f).

**5. House demo (`test&fake=0&demo=house&scene=6`)**
```
shot work/feig-h10
EVAL JSON.stringify({L:CARD.REG[6].scene.rt.label,it:CARD.REG[6]. => "{\"L\":\"L1.48\",\"it\":\"feigen L1.48\"}"
shot work/feig-h30
EVAL JSON.stringify({L:CARD.REG[6].scene.rt.label}) => "{\"L\":\"L2.41\"}"
shot work/feig-h50
EVAL CARD.bench(6,300);JSON.stringify({errs:CARD.ERRS,bad:CARD.no => "{\"errs\":[],\"bad\":[],\"q\":0.49600000000000005,\"tier\":1,\"b\":[6.1466666666666665,6.207666666507721,5.949333333174388],\"L\":\"L1.61\",\"glerr\":0}"
```
The dive advanced L1.48 → L2.41 over the first 30 s, then came back to L1.61: that is `look.set` restoring a returning
section's filed depth (CONTRACTS §1.11), not a wrap — at tier 1 the wrap needs L > 4.

**6. Deep / tricorn**
```
shot work/feig-L3-tricorn
EVAL CARD.REG[6].scene.hud() => "feigen L3.37"
shot work/feig-L3
EVAL CARD.REG[6].scene.hud() => "feigen L3.37"
```

**7. Tier sweep** (`setInterval(()=>CARD.Q.q=…,16)`, 8 s settle, `&feig=3`; `uIter` read back with
`gl.getUniform(pr.p, pr.u('uIter'))`, not recomputed)
```
EVAL … => "{\"q\":0.1,\"tier\":0,\"uIter\":257,\"hud\":\"feigen L3.46\",\"bench\":[12.592000000476837,12.733333333333333,13.202333333492279]}"
EVAL … => "{\"q\":0.95,\"tier\":3,\"uIter\":500,\"hud\":\"feigen L3.59\",\"bench\":[21.082999999523164,21.058000000317893,21.074333333969115],\"glerr\":0}"
```

**8. Real path (`NOAUTO=1`, `'real'`, click, 45 s)**
```
EVAL JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS,hist:CAR => "{\"bad\":[],\"errs\":[],\"hist\":[5,0,3],\"cur\":5}"
```
`[EXC]` lines in that run: **0**. Scene 6 does **not** appear in 45 s — the director picked **5 (POLYTOPE), 0 (NAV),
3 (TORUS)** and was on 5 at the end. FEIGEN's bid (0.2 + 0.4·regularity + 0.25·clarity + 0.15·calm) is a mid-field
score with no build-time advantage, so losing three scored picks in 45 s is unremarkable; it is picked freely under
`&scene=6` and its `score` is non-zero throughout.

**9. Object shape** (`CARD.REG[6].scene`)
```
EVAL … => "{\"has\":[],\"feats\":[…18 names…],\"helpFeats\":[…the same 18…],
            \"rows\":\"bass,bpm,regularity,arc,dropEvt,dropEnv,clarity,tension,sectionEvt,seed,midS,lvl,kick,hat,alive,calm,flow,flowMid\",
            \"hooks\":[\"feig\",\"tricorn\"]}"
```
`has: []` = none of `name id tag feats cuts score init update draw post help look hud hooks` is missing; `CARD.HELP.rows(true)`
(the help view's top table) is exactly the 18 `feats`, in FEATS order; `help.feats` covers all 18 (check.js gaps 0).

## (d) Anything wrong in the docs

- Nothing failed as printed. Every HARNESS command ran as written.
- `CARD.SC.hist` is used by the FEIGEN brief's step 8 but is not in HARNESS's `window.CARD` inventory (which lists `SC`
  without naming its keys). It exists and returns an array of recent scene ids, newest first. Worth a word.
- HARNESS's `CARD.bench(id, n=40)` signature and its "use `n ≥ 300`" rule are four lines apart; the default invites the
  wrong call, and brief-common's template (`bench(<id>,60)`) takes the bait. Suggest the default in the signature be
  written as `n = 40 (too small — see below)`.
- CONTRACTS §1.4 does not say **when** a hash-mapped hook is called. Anything a hook sets that a scene also clamps on
  entry (this scene's `feigL`) is silently destroyed. One sentence would have saved a cycle (friction 3).
- The FEIGEN brief's `feigMax = [3.4, 4, 4.6, 5]` is described as the reason the wrap exists, but nothing says what it
  is a bound *on*. It is not a float32 limit (perturbation removes that); at L 5 the reference orbit's 512 taps are the
  real bound — beyond it the offset recurrence outruns the tabulated `Z_n`. Stated that way in `help.math`.

## (e) `post` params and why

`post: { fb: { decay: 0.55 }, bloom: { thr: 0.3 }, kaleido: 0 }` — the brief's values, and they are right here.
`kaleido: 0` because the set already carries its own symmetry (the cascade repeats down the real axis, and the picture
is mirror-symmetric about it by construction: the reference orbit is real); a beat-driven kaleidoscope would overlay a
*different*, false symmetry group on top of a true one. `fb.decay 0.55` is short enough that the filaments do not smear
into a haze as the dive moves, long enough that a kick's flare reads. `bloom.thr 0.3` slightly below the 0.35 default:
the distance-estimate filaments are thin and want to bloom.

## (f) The md5 lines of steps 3 and 4, verbatim

Step 3 (determinism, two runs `a` / `b` of `CLOCK=1 … 'test&scene=6'`):
```
7c976ae1958e9549a155b1834f9e2593  tools/work/feig-f360a.jpg
7c976ae1958e9549a155b1834f9e2593  tools/work/feig-f360b.jpg
9d859b1f5a0b1373c2fea17fa4df5f43  tools/work/feig-f840a.jpg
9d859b1f5a0b1373c2fea17fa4df5f43  tools/work/feig-f840b.jpg
```
Step 4 (**the hist proof**, the same command with `'test&scene=6&histfull=1'`):
```
7c976ae1958e9549a155b1834f9e2593  tools/work/feig-f360-full.jpg
9d859b1f5a0b1373c2fea17fa4df5f43  tools/work/feig-f840-full.jpg
```
**Equal, both frames.** The §13 row-only `hist` upload feeds `histM` exactly the texture the whole-texture upload does,
with `uHistRow = (ctx.engineTex.row − 0.5)/128` uploaded every frame and the age term subtracting rows/128 against the
REPEAT wrap. The core needs no change.

## (g) Bench medians and `uIter`

`CARD.bench` is a **full-resolution** render, `n = 300`, three runs, median, first (cold) call discarded. NAV was
benched **in the same browser session** as the baseline, because this harness reads ~1.4× slower than some earlier
runs.

Tier 3 (`Q.q` pinned 0.95), depth set with `CARD.hooks.feig(L)`:

| L | `uIter` | FEIGEN median | NAV median (same session) |
|---|---|---|---|
| 1.21 | 142 | **6.85 ms** | 2.71 ms |
| 2.02 | 240 | **10.86 ms** | 2.30 ms |
| 3.02 | 428 | **17.66 ms** | 2.51 ms |
| 3.59 | 500 (clamped) | **21.07 ms** | — |

Tier 0 (`Q.q` pinned 0.1), L 3.46, `uIter` **257** → median **12.73 ms**.
Adaptive, house demo, q 0.496 → tier 1, L 1.61, `uIter` ≈ 118 → median **6.15 ms**.
Adaptive, fake timeline, tier 2, L ≈ 0.5 (`uIter` ≈ 77) → FEIGEN **3.57 ms**, NAV **3.99 ms**, MANDALA **1.98 ms**.

**The brief's target ("in the range of NAV's 2.7–2.9 ms at tier 3") is met only while the dive is shallow, and is not
reachable at depth with the `uIter` formula the brief specifies.** The cost is linear in `uIter` — 142→240→428
iterations gives 6.85→10.86→17.66 ms, i.e. ≈ 1.7 ms fixed + 0.036 ms per iteration — and `uIter` grows as
`30·L²`. Hitting 2.9 ms would need `uIter ≈ 33`, which is not a Mandelbrot distance estimate at any depth; the
filaments and the Green bands both come out of the escape count. So the knob is not a constant to retune, it is a
trade, and I left synapse's numbers alone rather than degrade the mathematics behind the orchestrator's back.

What saves it in practice is that the trade is already wired to `Q`: the multiplier row `[0.6, 0.8, 1, 1.25]` and
`feigMax` `[3.4, 4, 4.6, 5]` both fall with the tier, so an over-budget frame lowers `q`, which lowers both the
iteration count *and* the depth the dive is allowed to reach. On the house demo that loop settled by itself at
q 0.496 / 6.15 ms and stayed there, with no visible artefact — the dive simply runs shallower. If the orchestrator
wants the tier-3 number inside NAV's range regardless, the two honest levers, in order of visual cost, are: drop the
tier row to `[0.45, 0.6, 0.75, 0.9]` (≈ −28 % at tier 3, slightly softer filaments at depth), or cut the `30·L²`
coefficient to ~18 (flattens the growth, visibly noisier below L 3). Both are one-line changes in
`assets/scenes/feigen/index.js`; neither is mine to make.

## (h) What each shot showed

- `feig-t6` — the classic cardioid + period-2 bulb with the whole period-doubling antenna running left along the real
  axis, minibrots strung along it, in mood green on black; the Green's-function bands are the faint concentric arcs in
  the exterior. A recognisable, correct Mandelbrot at L ≈ 0.5.
- `feig-t14` — the drop: same axis, one level deeper (the `dropEvt` +1), palette inverted to violet/white, filaments
  flooded 3–4× brighter, the exterior fully lit. The structure is the *same kind* of structure — which is the point.
- `feig-h10 / h30 / h50` (house, one tile each in `feig-house.jpg`) — three clearly different frames: cyan at L1.48
  (groove), a dark warm-orange frame at L2.41 with thin dendrites (breakdown), yellow-green and blown bright at L1.61
  (build). Depth, palette and filament weight all move with the track.
- `feig-f360a/b`, `feig-f840a/b`, `feig-*-full` — byte-identical, all six (see (f)).
- `feig-L3` — level 3.37, the antenna's dendrites filling the left two-thirds, a clean round minibrot disc at centre
  and the next bulb's smooth edge at right.
- `feig-L3-tricorn` — the same frame, same depth, and the real axis agrees with `feig-L3` pixel for pixel in character
  (as it must: the real slice of the Tricorn *is* the real slice of M), but off the axis it is plainly a different set:
  the round disc has become a lens/almond with a cusp, and the right-hand bulb has broken into detached islands above
  and below the axis. Exactly the antiholomorphic signature, from one sign flip.
- `feig-q0 / feig-q95` (`feig-tiers.jpg`) — same structure, same framing, same minibrot; q0.1 (`uIter` 257) resolves
  fewer of the finest dendrite tips and sits darker, q0.95 (`uIter` 500) is denser and brighter. No cut, no change of
  subject — which is what `cuts: 'event'` promises across a tier flip.

## (i) Final `feats` (18, exactly the fields read)

```
arc  regularity  clarity  calm          — score() only
bpm  lvl  tension  alive  kick  dropEvt  sectionEvt  seed  flow  flowMid  bass  dropEnv  hat  midS
```
`bass` arrives through HEAD's `uBands.x` (not a uniform of mine), the rest are uploaded in `draw()` from `MS` / `LOOK.mood`
in `update()`. `score()` reads `arc regularity clarity calm`; the phase driver reads `bpm lvl tension alive kick dropEvt`
and, for the flip, `sectionEvt seed`; the view reads `flow flowMid bass dropEnv hat midS tension kick lvl alive`.
`help.feats` has a line for all 18 (check.js: `help.feats gaps 0`).
