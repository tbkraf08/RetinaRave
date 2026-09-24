# FEIGEN — `params`: the scene's visual parameters as a slot (v0.5 item 1)

Worker report. Worktree `.claude/worktrees/agent-aea68f58bb7a763dd`, branch `worktree-agent-aea68f58bb7a763dd`, five
commits `FEIGEN-PARAMS:` on top of `2b9fd7e`. Not merged. Touched: `assets/scenes/feigen/{index.js, colour-v2.js,
colour.js}` and this report — nothing else (`git diff 2b9fd7e --stat` = those three files, 27 insertions, 11 deletions).

## The parameters

Five, three to five as asked, **two on the draw side** (`glow`, `thick` — both colour passes read them as their own
uniforms). `from()`'s argument is named `MS`, not `S` — see the friction log, item 1.

| name | eli5 (what the panel shows first) | range | `from(MS)` | deps (`CARD.paramDeps`) | what the eye sees, lo → hi |
|---|---|---|---|---|---|
| `width` | how much of the set is in view | `[0.4, 1.8]` | `1 + 0.25*MS.tension - 0.18*MS.dropEnv - 0.03*MS.kick` | `tension, dropEnv, kick` | lo: the cardioid and its bulb fill the frame edge to edge, the filaments crowd the corners; hi: the same set shrinks to a small island in the middle of a black field with the needle short and thin. (It multiplies the view width `3.2·δ^−L`, so it is a zoom, not a move.) |
| `dive` | how fast the dive falls | `[0, 2]` | `0.25 + 1.5*MS.lvl` | `lvl` | lo (0): the fall is frozen — at f360 the depth is still `L0.00` and the picture is the shallow arrival view; hi (2): by f360 it has fallen to `L0.66` (rung 1), the cardioid is already twice the size and pushed off the right edge — the same shape, further down. |
| `roll` | how far the frame rocks from side to side | `[0, 0.4]` | `() => 0.04` (a constant: a manual setting) | — | lo (0): the spine of the set lies dead level, the needle exactly horizontal; hi (0.4): the whole frame is tilted several degrees, the needle running down to the left and the bulb lifted — a slow rock, not a spin (it is the amplitude of `sin(flowMid·0.17)`). |
| `glow` | how brightly the filaments burn | `[0, 1]` | `MS.lvl` | `lvl` | lo (0): a dim green outline, the Green's-function bands in the far field almost invisible; hi (1): the filaments burn near-white at the boundary, the bands behind them light up and the black interior reads darker by contrast. |
| `thick` | how thick the glowing filaments are | `[0, 1]` | `MS.bass` | `bass` | lo (0): a hairline boundary — a thin bright line with black right up against it; hi (1): the same boundary drawn fat and soft, the glow bleeding a visible band outward into the exterior (under `&colour=oklch` the same value narrows the black edge instead). |

`thick` is the user's sentence made literal: `&param=feigen.thick=centroid*1.5` is *"in FEIGEN, the filament
sharpness is fed by the centroid"*, and `tools/work/fp-thick-centroid.jpg` is what it looks like (thick 0.6825 at
f360 against 0 derived from bass — the filaments are fat where the unrouted frame draws them thin).

Where they are read (all in `update()`, `const P = env.params;`):
`P.width` → `wd = 3.2·Math.pow(DELTA_F, -L)·P.width` · `P.dive` → `S.feigL += dt/(32·period)·P.dive·(1 − 0.8 MS.tension)·MS.alive`
· `P.roll` → `S.rot = P.roll·Math.sin(MS.flowMid·0.17)` · `P.glow` → `S.lvl` → `uLevel` · `P.thick` → `S.thick` → `uThick`
(new uniform in both colour passes, replacing HEAD's `uBands.x` in `mix(160., 70., ·)` (v2) and `mix(0.65, 0.38, ·)` (oklch);
`uBands.x` still lights the interior trap in both, so `bass` stays a read of the scene).

## The no-op proof, per commit

Every commit ran, from the repo root, `PORT=8793 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=6' …` and the
same with `&colour=oklch` (f360 + f840 shots, `fp-` / `fpo-`). **All four md5s were identical to
`tools/accept/v0.5/scene-md5-v03.txt` / `-oklch.txt` after every one of the five commits** — the same four lines each time:

```
8d6ac4a6234d1bbaaaac2bca65d8439d  fp-s6-f360.jpg     8d6ac4a6234d1bbaaaac2bca65d8439d  s6-f360.jpg   (v2, reference)
9adb1f5b764f55f68e13e3e83f4eecd2  fp-s6-f840.jpg     9adb1f5b764f55f68e13e3e83f4eecd2  s6-f840.jpg
d673746000e608ffdbee08d9a3d01f88  fpo-s6-f360.jpg    d673746000e608ffdbee08d9a3d01f88  s6-f360.jpg   (oklch, reference)
0d6e78aa9f8900bf6832035bdf9b2335  fpo-s6-f840.jpg    0d6e78aa9f8900bf6832035bdf9b2335  s6-f840.jpg
```

| commit | parameter | `CARD.paramsOf('feigen')` at f840 (the EVAL of that run) | md5 |
|---|---|---|---|
| `1c7d7af` | `width` | `{"width":1.0865292150948396}` | the four lines above |
| `6a6678c` | `roll` | `{"width":1.0865292150948396,"roll":0.04}` | identical |
| `eccfa88` | `dive` | `{"width":1.0865292150948396,"dive":0.9988474047222593,"roll":0.04}` | identical |
| `e305447` | `glow` | `…,"glow":0.4992316031481729}` | identical |
| `9c2ddcc` | `thick` | `…,"glow":0.4992316031481729,"thick":0.008463206296345775}` | identical |

`CARD.ERRS` was `[]` on every run. The baseline (before any edit) was measured first and already matched the reference,
so the four hashes above are this machine's FEIGEN, not a coincidence of the toolchain.

## Acceptance

1. **PASS** — `node tools/check.js` → `warn assets/scenes/feigen/index.js has 351 lines (soft cap 350)` /
   `check: 65 modules · uniforms 110 · MS keys 118 · scenes 6 (help.feats gaps 0) · 0 fail · 1 warn`. The one warn is the
   line-count one the brief allows (350 by `wc -l`, 351 by check.js's count); it appeared only with the fifth commit.
   Nothing else is new — in particular no `stale` warning, no `help.feats` gap, and `uniforms` went 109 → 110 (`uThick`).
2. **PASS** — the four md5s after every commit, table above; `CARD.ERRS` `[]` throughout.
3. **PASS** — at f360, unrouted (`CARD.PROUTE.n` 0), every value finite and inside its range, and `derived()` equal to it:
   ```
   EVAL => {"errs":[],"n":0,
     "p":   {"width":1.0404609275397028,"dive":0.45999999999999996,"roll":0.04,"glow":0.13999999999999999,"thick":0},
     "deps":{"width":["tension","dropEnv","kick"],"dive":["lvl"],"roll":[],"glow":["lvl"],"thick":["bass"]},
     "rng": {"width":[0.4,1.8],"dive":[0,2],"roll":[0,0.4],"glow":[0,1],"thick":[0,1]},
     "drv": {"width":1.0404609275397028,"dive":0.45999999999999996,"roll":0.04,"glow":0.13999999999999999,"thick":0}}
   ```
   The deps are exactly the lists expected from each `from()`; `roll` reads nothing (a constant) and the panel will show
   it as a manual setting.
4. **PASS** — eleven shots, all at f360 under `CLOCK=1`, hash `test&scene=6&param=…`, `CARD.PROUTE.n` 1 and `CARD.ERRS`
   `[]` on every one; all eleven md5s differ, so no pair is a lie. Sentences in the table above. Files below.
5. **PASS** — `node tools/bundle.js` → `bundled 65 modules → dist/eigenwobble.html (473 KB)`; then
   `FILE=$PWD/dist/eigenwobble.html PORT=8793 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":4000},…]'`
   → `EVAL … => {"errs":[],"n":0,"p":{"width":0,"dive":0,"roll":0,"glow":0,"thick":0}}`, **0 `[EXC]` lines** (counted).
   The zeros are the untouched initial value object: FEIGEN is not the scene on screen 4 s into the real path, so its
   `update()` (and therefore `refreshParams`) has not run yet — `null` would have meant "no params", `0` means "not yet
   refreshed". One extra run in the same bundle with `CARD.goScene(6,1)` and 3 s more proves the slot lives off the
   single file too: `{"errs":[],"cur":0,"p":{"width":0.8274122259619022,"dive":1.0294965541189356,"roll":0.04,
   "glow":0.5196643694126237,"thick":0.915029354231313},"hud":"feigen L1.04 r2"}` — five live values, all in range,
   on the real extractor.
6. **PASS** — `node tools/param-smoke.js` → `param-smoke: 49 checks, 0 fail`; `node tools/route-smoke.js` →
   `route smoke: 68 checks · 0 fail`. Neither file was touched.

**Nothing failed.**

## Shots (in `tools/work/`, for the orchestrator's eyes)

| file | what it is |
|---|---|
| `fp-s6-f360.jpg` `fp-s6-f840.jpg` | the v2 pair after the last commit — byte-identical to the v0.5 reference |
| `fpo-s6-f360.jpg` `fpo-s6-f840.jpg` | the same under `&colour=oklch` — byte-identical to the reference |
| `fp-width-lo.jpg` `fp-width-hi.jpg` | `feigen.width=c:0.4` / `c:1.8` |
| `fp-dive-lo.jpg` `fp-dive-hi.jpg` | `feigen.dive=c:0` / `c:2` (HUD `L0.00` vs `L0.66 r1` at the same frame) |
| `fp-roll-lo.jpg` `fp-roll-hi.jpg` | `feigen.roll=c:0` / `c:0.4` |
| `fp-glow-lo.jpg` `fp-glow-hi.jpg` | `feigen.glow=c:0` / `c:1` |
| `fp-thick-lo.jpg` `fp-thick-hi.jpg` | `feigen.thick=c:0` / `c:1` |
| `fp-thick-centroid.jpg` | `feigen.thick=centroid*1.5` — the music route, thick 0.6825 at f360 |
| `fpm-width.jpg` `fpm-dive.jpg` `fpm-roll.jpg` `fpm-glow.jpg` `fpm-thick.jpg` | the lo/hi pairs side by side (`tools/montage.py`, 2 columns) — quickest way to judge them |

## Friction log

1. **`from(S)`'s argument cannot be called `S` in this scene, and the docs do not warn about it.** CONTRACTS §1.16 and
   `tools/param-smoke.js` both name it `S`. FEIGEN's `index.js` has a module-level `const S = {…}` (its own held state),
   and `tools/check.js`'s static read grep deliberately disables `S.` as an MS receiver for a file that has such a decoy
   (`reads()`: *"a module-level `const S = {…}` decoy disables `S.` for that file"*). So a `from: (S) => S.lvl` would have
   moved the only textual `MS.lvl` out of the file and earned a new warning — *"feats entries the static read check cannot
   find"* — for `lvl`, exactly the warning the brief forbids. The argument is named `MS` in all five declarations. It reads
   well (the argument *is* the scene's view of `MS`), but §1.16 should say the name is the scene's choice.
2. **The dive's full factor cannot move — the product re-associates.** The brief offered
   `(0.25 + 1.5 lvl)(1 − 0.8 tension)·alive` as one parameter. `update()` computes
   `dt/(32·period) * A * B * C` left to right, i.e. `((x·A)·B)·C`; a parameter holding `A·B·C` makes it `x·(A·B·C)`.
   Measured in node over 200 000 plausible draws: **46.2 %** of them differ in the last ulp, and `feigL` is an integrator,
   so the whole dive would walk off the reference within a few frames. Only the leading factor `(0.25 + 1.5 lvl)` can move
   with the association intact, and that is what `dive` is; `(1 − 0.8 tension)` (the brake) and `alive` (the silence gate)
   stay inline and are named in the code comment. A parameter that wanted the whole factor would need `update()` to
   multiply `dt/(32·period)` *last*, which is a pixel change, not a move.
3. **A parameter can only move a constant it multiplies at the same point in the expression.** Three other candidates were
   examined and left inline for the same associativity reason or because they are not one number: the centre wander
   `wd * (0.30 + 0.02·sin(flowMid·0.2))` (moving `0.02` alone is safe, but `0.30` and `0.02` together are the shape of the
   wander, and `roll` already gives the panel the camera's one obvious knob), `S.cy`'s `0.03`, and the filament gain
   `(0.45 + 1.3 uLevel + 1.1 uKick + 2. uDrop)` in the v2 shader — that last one is computed per pixel in fp32 inside the
   shader; folding it into a JS parameter would compute it in fp64 and round once, which is a different number and very
   likely a different byte. **A shader-side expression can only become a parameter when the parameter is a value the
   shader already receives as a uniform, not a combination the shader computes.** That is why the two draw-side
   parameters (`glow`, `thick`) are single uniforms.
4. **`uBands.x` really is `MS.bass`, to the bit** — guessed from `docs/workers/brief-common.md`'s table and CONTRACTS
   §1.15 ("the HEAD uniforms are direct reads of `bass mid high`"), because the may-read list does not include
   `assets/core/` or `assets/engine/`, where the upload lives. Replacing `uBands.x` with the new `uThick` in the two
   `mix()` calls left all four md5s identical, which proves the guess; had it not, the commit would have been reverted.
   Whoever documents this next can state it as fact: a scene may take a HEAD-delivered band over its own uniform without
   moving a pixel.
5. **A backtick in a GLSL comment ends the shader's template literal.** Writing ``// the scene's `thick` parameter`` inside
   `FS_COLOUR_V2` produced `SyntaxError: Unexpected identifier 'thick'` from `check.js`. Obvious in hindsight; not in
   HARNESS's "Pitfalls already paid for", and worth a line there since every shader in this repo is a template literal.
6. **`CARD.paramsOf(name)` reads `0` for a scene that has not been on screen yet**, not `null` and not `from(view)` — the
   value object is created at registration and only refreshed before that scene's `update()`. Acceptance item 5's EVAL
   therefore prints five zeros on the real path (FEIGEN is not the scene at t=4 s). HARNESS's line, *"the value object
   `update()` received"*, is accurate but easy to misread as "the current derived values"; `CARD.derived(name, p)` is the
   one that always answers.
7. **No temptation to open a forbidden file was acted on.** The one real pull was toward `assets/engine/feats.js` /
   `assets/core/scenes.js` to confirm item 4 (`uBands` upload) and to see where `refreshParams` is called from; both were
   answered by guessing and then proving with the md5 sweep, as instructed. `assets/core/params.js` is on the may-read
   list and was read (read-only).
8. **Nothing in the docs failed as printed.** Every command in the brief and in HARNESS "Params" ran as written with
   `PORT=8793`. One observation rather than an error: `tools/scene-md5.sh` sweeps every scene, so the per-commit proof in
   the brief (the two explicit `cdp.js` lines) is the cheaper form and the one used here.

## Line counts of every module touched

| module | before | after | note |
|---|---|---|---|
| `assets/scenes/feigen/index.js` | 336 | **350** (`check.js` counts 351) | over the 350 soft cap by one, as the brief anticipated — warn only, not split |
| `assets/scenes/feigen/colour-v2.js` | 152 | 153 | `uThick` declared, used, uploaded |
| `assets/scenes/feigen/colour.js` | 213 | 214 | same, plus one comment line re-worded |
