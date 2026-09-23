# FEIGEN-FIELD worker brief (v0.2 §16) — read docs/workers/brief-common.md first (its "may read" rules and report
# format apply; there is no synapse source this time — the scene exists, you are restructuring how it renders)

Target: `assets/scenes/feigen/` — the existing scene (`index.js` 203 lines + `shaders.js` 96). You split its one
fragment pass into a **field pass** (the mathematics, rendered once per zoom rung, progressively) and a **colour
pass** (the music, every frame), so the cost stops depending on depth. Files: `index.js`, `field.js` (field shader),
`colour.js` (colour shader), `ladder.js` (pure JS: rung geometry + tile schedule, no `gl`, node-importable) — each
≤ 350 lines, `shaders.js` goes away. Scene `name`, `id: 6`, `tag`, `cuts: 'event'`, `score`, `look`, `hud`, `post`,
`feats` (18) and `help.feats` stay exactly as they are; `help.why` / `help.math` gain the amortisation story.
PORT=8778. You are in your own git worktree; commit with messages starting `FEIGEN-FIELD:`. **Never more than one
Chrome from you** (the orchestrator has one running; the machine holds two).

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/CONTRACTS.md`, `docs/HARNESS.md`, `docs/ENGINE.md`
(the engine-texture bullet), `docs/DECISIONS.md` §15 only (FEIGEN as built, its cost table), `docs/workers/feigen.md`
(the previous worker's friction: hooks fire before `init`; the arrival clamp), `assets/scenes/feigen/*`,
`tools/check.js`, `tools/feigen-bench.sh` and `tools/accept/v0.2/feigen-bench-before.txt` (the baseline numbers your
report is measured against). Do NOT open `assets/core/`, `assets/engine/`, `assets/effects/`, `assets/transitions/`,
other scenes, or `assets/main.js` (nothing to register: the scene is registered). Log what the docs did not answer,
guess, continue.

## Why (read DECISIONS §15 "Cost — the open item" for the numbers)

FEIGEN costs 8–22 ms at tier 3 (`feigen-bench-before.txt`: 8.0 ms at L 1.6, 13.1 at 2.4, 20.5 at 3.4, 22.2 at 4.0;
NAV 1.5–1.8 ms in the same pages) because the per-pixel iteration count grows as `30·L²` and the whole picture is
recomputed every frame. `Q` is global: one 17 ms scene makes the controller drop every scene's tier and it takes ~30 s
to climb back after FEIGEN leaves. Interior speed-ups (period checking, `|z'| → 0`) are ruled out — near `c∞` the
visible components have period ~2^L with multiplier −1 at every doubling, so convergence is algebraic; critical
slowing *is* the scene. Do not spend time there.

**The move: the field does not move, only the camera does.** Per pixel the loop produces numbers that depend on `c`
alone — the escape count `n`, `log r` at escape, `log|dz|`, the escape angle `ea`, the orbit trap `tr` (interior):
the **field**. Everything after `if (esc)` is **colouring** — `uBass` in the filament falloff, `uFlow` in the band
phase, `specM`/`histM` on `ea` and `d`, the level/kick/drop/hat/midS/tension/alive gains, the mood palette — one
texture read of the field plus a few of spec/hist, about a millisecond at any depth. The camera is an affine map of
parameter space that changes by ≈ 1.002 per frame (`wd = 3.2·δ^(−L)·(1 + 0.25·tension − 0.18·dropEnv − 0.03·kick)`,
`cx/cy = wd·(0.30 + 0.02·sin, 0.03·sin)`, `rot = 0.04·sin`; one δ per 32 beats ≈ 15 s at 128 bpm). Only the declared
events jump: a drop adds exactly one δ (self-similar), the tricorn flip on a section seed changes the field entirely.

So: render the field on a **ladder of zoom rungs**, each at a fixed width in parameter space, at higher resolution
than the view, **progressively** (a bounded amount of work per frame, one rung ahead of the dive), and every frame draw
the colour pass by sampling the built rung through the current camera. Steady state = colour pass + one slice of the
next rung, ≈ 1–1.5 ms at **any** depth. A rung that needs 500 iterations simply takes more frames to finish, and it
has ≥ 6 s.

## The design (follow it; deviations go in the friction log with the reason)

**Field layout.** One RGBA16F target per rung from `ctx.mkTarget(w, h, false, false)` (LINEAR, CLAMP_TO_EDGE — you
will not rely on its filtering, see sampling). Channels: `R = esc ? n : −(sqrt(tr) + 1)` (exterior: the escape count,
exact in half float up to 2048; interior: negative, the trap in the magnitude — the sign is the interior test),
`G = log(r)` at escape (`r² > 1e4`, so `log r ∈ (4.6, ~9.3)`), `B = log(length(dz))` (the parameter derivative grows
like 2ⁿ: store the log), `A = ea` in turns `[0, 1)`. The colour pass rebuilds `d = exp(G + log(G) − B) / wdV`
(= `r·log r / |dz|` over the *virtual* view width, see stand-ins — scale-free, as today), `lG = log2(G) − n`, `ea`,
`t = sqrt(tr)`, and applies the colouring **exactly as `shaders.js` lines 77–92 do today** — same palette, same gains,
same `specM`/`histM` (uniforms `uSpec`, `uHist`, `uHistRow` move to the colour pass unchanged; `histM` stays in the
colour pass so the `&histfull=1` equality still holds). If 16-bit `log|dz|` (spacing ≈ 0.03 at 50) visibly roughens
the filaments, an RGBA32F target built with raw `gl` (`texImage2D(…, gl.RGBA32F, …, gl.RGBA, gl.FLOAT, null)` +
framebuffer; the R32F orbit texture in `init` is the idiom, and float colour buffers are on — the core's targets are
RGBA16F) is pre-authorised; say which you shipped and why.

**The ladder.** `LR = ln 2 / ln δ = 0.449946` levels per rung (a factor 2 in the base width). Rung `r = floor(L / LR)`,
base width `W_r = 3.2·2^(−r)` (the unmodulated `wd` at `L = r·LR`). Inside rung `r` the actual `wd` ranges over
`[0.395, 1.25]·W_r` (tension +25 %, dropEnv −18 %, kick −3 %, and the next rung starts at half). The rung's rectangle
in parameter space (offset from `c∞`, unrotated; the view is `wd` wide, `wd·PH/PW` tall — take the aspect from the
`ctx.onResize(w, h)` callback, never assume 16:9 — centred at `(0.30 ± 0.02, ± 0.03)·wd`, rolled ± 0.04 rad) must
contain every view of the rung: `x ∈ [−0.32, 1.07]·W_r`, `y ∈ [−0.44, 0.44]·W_r` covers it at 16:9 with the roll —
`ladder.js` computes it from the aspect and the modulation bounds, and `test_feigen_ladder.js` checks that the four
rotated corners of the extreme views (wd = 1.25·W_r, every sign of the wobble) lie inside. **Symmetry:** both the
Mandelbrot set and the tricorn are symmetric under `c → conj(c)` (the reference orbit is real), and the colouring's
two `ea` reads are `abs(fract(·)·2 − 1)` terms, symmetric under `ea → 1 − ea` — so storing the **upper half-plane only**
(`y ∈ [0, 0.44]·W_r`) and sampling `|y|` is exact and halves the memory. Take it. **Resolution:** 2× the view's texel
density at the rung's base width — `2·PW` texels per `W_r` — so the finest view of a rung (wd = 0.395·W_r) is
magnified 1.27× and the coarsest (1.25·W_r) minified 2.5×. At 1280×720 that is ≈ 3560 × 1130 texels per half-plane
rung, 4 Mpx, 32 MB in RGBA16F. Cap a rung at 6 Mpx and at `MAX_TEXTURE_SIZE` per side (scale the density down to fit at
1920×1080+; report the density you got). Keep a **ring of three rung slots** (the rung on screen, the next one being
built, the previous one for the blend), each with `{r, tricorn, iter, rowsBuilt, rows}`; allocate them in
`ctx.onResize` (free the old ones with `ctx.freeTarget`, invalidate everything), so you are ready by frame 1. If the
2.5× minification sparkles on the shots (aliased filaments at the top of a rung), the ×√2 ladder (`LR/2`, the same
rectangle formulas with `[0.56, 1.25]`, ≈ 3.3 s per rung at full dive speed) is pre-authorised; say which you shipped.

**Iterations per rung.** `iter = min(500, floor((70 + 30·L_r²)·1.25))` with `L_r = (r + 1)·LR` (the deepest level the
rung serves): the tier-3 value for **every** tier — with the field amortised, the tier no longer trades iterations
away. What `ctx.tier()` scales instead is the **work per frame** (below). `FEIG_MAX` per tier stays as it is (it
bounds `feigL` against the 512-tap reference orbit, DECISIONS §15). Keep the loop bound 512 and `uOrbit` as built.

**Progressive build — the tile schedule (deterministic: keyed on `feigL` and your own draw counter, nothing else).**
Each `draw()` advances the rung under construction by a run of texture rows. The budget is texel-iterations per frame:
`BUDGET = [6, 9, 12, 18]·10⁶` by tier (the field pass costs ≈ 0.048 ms per 10⁶ texel-iterations on this GPU: 22 ms
for 0.92 Mpx × 500, `feigen-bench-before.txt`), so `rows = max(1, floor(BUDGET[tier] / (rungW · iter)))` per frame —
a 500-iteration rung at 1280×720 builds in ≈ 100 frames at tier 3, a 142-iteration one in 30. Render the rows with the
field program into the rung target under `gl.SCISSOR_TEST` + `gl.viewport` on the row band (restore: SCISSOR off on
return, CONTRACTS §1.1), then switch back to `target` for the colour pass. **Which rung to build:** the rung for the
current `L` if it is not complete, else the next rung `r + 1` (the dive only goes deeper except on events; when `L` is
within the last 15 % of rung `r` and `r + 1` is still incomplete, spend double the budget). The build order and the
budget depend on `L`, `tier()` and your counter — never on wall time, `Math.random()` or `performance.now()`. Count
draws on the object literal (`bench` calls `draw` 300 times without `update`; that is fine — it just finishes rungs).

**Sampling (the colour pass).** The camera of the frame — `(cx, cy, wd, rot)` as `update` computes it today — maps
the pixel `p = (gl_FragCoord.xy − .5·uRes)/uRes.y` to `dc = centre + (p·rot(rot))·wd` in parameter space (unchanged),
then `dc` to rung texel coordinates `(dc.x − x0)/(x1 − x0)·rungW, |dc.y|/y1·rungH` via a `vec4 uRect` uniform per rung.
Sample **manually**: 4 `texelFetch` at the surrounding texels with bilinear weights — blend `R/G/B` linearly, blend
`ea` as a unit vector (`atan(Σw·sin(TAU·ea), Σw·cos(TAU·ea))/TAU`, back to `[0,1)`) because it wraps, and where the four
`R` signs disagree (an interior/exterior boundary texel) take the nearest texel alone. Out-of-rectangle coordinates
cannot happen inside a rung by construction (the test proves it); clamp anyway.

**Rung change (the blend rule).** When `floor(L/LR)` moves from `r` to `r + 1` and both are built, cross-fade **in
field space** over 30 draws: sample both rungs, blend the four channels as above (`ea` as a vector), then colour once.
Colour-space blending of two rungs is the classic zoom-video ghosting; field-space blending of the same mathematics at
two resolutions is a resolution fade. If the seam test (acceptance 5) shows the blend itself as a spike, the **hard
switch to the finer rung with no blend** is pre-authorised — the seam ratio decides, not taste. Log every change of the
rung actually sampled: `ctx.log('RUNG@' + drawCount + ' r' + r + ' L' + L.toFixed(3) + ' ' + how)` where `how` is
`built | blend | standin(k) | coarse` (forced from frame 1 with no transition your draw count equals the frame number
under `CLOCK=1`; `feigen-bench.sh` reads these lines).

**The three event rules.**
1. **Drop (`feigL += 1`) and the kick-hidden wrap (`feigL −= 1`):** the rung for the new `L` is not built. Self-
   similarity says the picture at `L ± 1` is the picture at `L` scaled by δ: keep a **virtual level** `Lv` — start at
   `L`; while the rung for `Lv` is not built and `|L − Lv| ≤ 3`, step `Lv` by ∓1 toward a built one; sample the rung of
   `Lv` with the camera of `Lv` (`wd·δ^(L−Lv)`, `cx`, `cy` likewise, same `rot`) and use `wdV = wd·δ^(L−Lv)` in `d`. The
   frame after the drop is then *exactly* the frame before it (the poetic fallback), and the true rung builds behind it
   (it gets the budget); when it completes, blend to it over 30 draws. Report how wrong the stand-in was: hook
   `standin(0)` disables it (a coarse burst instead, rule 3) — the mean |Δ| between the two f781 shots (acceptance 6).
2. **Tricorn flip (`sectionEvt`, `&tricorn=`)** invalidates every rung (they carry the flag). It is the one declared
   cut, so a burst on that frame is honest — but capped: rule 3.
3. **Nothing usable (entry, flip, `look.set` to a far depth):** render the current rung at **quarter resolution
   per side** (1/16 of the texels: ≈ 0.25 Mpx, ≤ 6 ms once at 500 iterations, ≤ 2 ms at entry depth) into a fourth,
   small target in one draw, show it (same sampling, its own `uRect`/size), and refine the full rung over the next
   frames at the budget; blend to the full rung when it completes. Never a black frame, never a frame without a field.

**What stays.** The reference orbit and `uOrbit`; `feigL`'s driver, `FEIG_MAX`, the wrap, the arrival clamp, the
`feig`/`tricorn` hooks (add `standin`); `look`; `feats` and `help.feats` (unchanged unless a new `MS` read appears —
the schedule reads none); `post`; `hud()`; `rt.time`/`rt.label`. Add `rt.log = 'r<r> <how> b<rowsBuilt>/<rows> next
r<r+1> b…/… it<iter> rows<rows/frame>'` — it lands in the 1 Hz test line and in `feigen-bench.sh`'s output. The colour
pass draws into `target` at `(w, h)` exactly as `draw` does today; the rung targets are yours (`ctx.mkTarget`, freed
and rebuilt in `ctx.onResize`). GL state on return from `draw`: BLEND/DEPTH_TEST/SCISSOR off, as you found it.

**No `Math.random()`, no wall clock, no `Date.now()`, no `performance.now()` in the scene** (the schedule included).
Module cap 350 lines each. `node tools/check.js` after every edit (it fails on a declared-but-never-fetched uniform:
fetch every uniform of both programs with `pr.u('name')` / `ctx.tex`).

## Acceptance (repo root, all must pass; paste outputs verbatim in the report)

1. `node tools/check.js` → 0 fail, 0 warn on your files.
2. `node tools/test_feigen_ladder.js` (yours, node, imports `ladder.js` only): rung index / rectangle / sample
   transform round-trips; the rotated corners of the extreme views of rungs 0, 3, 8 at aspects 16:9 and 4:3 lie inside
   the rectangle; the schedule for a fixed `(L, tier)` sequence is the same on two calls → prints `ladder OK`.
3. Determinism, twice (`a`/`b`) and then with `&histfull=1`:
   `CLOCK=1 PORT=8778 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"feigf-f360a"},{"until":"window.__FRAME>=840"},{"shot":"feigf-f840a"},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),glerr:CARD.ctx.gl.getError(),log:CARD.REG[6].scene.rt.log,rungs:CARD.log.filter(function(l){return /RUNG@/.test(l)})})"}]'`
   → `md5sum` identical pairs across the two runs (the progressive schedule running — if the tile order is keyed on
   anything but `feigL`/the draw counter, this is where it shows) and identical again with `'test&scene=6&histfull=1'`
   (`feigf-f360-full`, `feigf-f840-full`). ERRS `[]`, glerr 0. Read the f360 shot: the same kind of picture as
   `tools/accept/v0.2/s6-t6.jpg` (the whole set, the antenna, the Green bands).
4. **The bench:** `PORT=8778 GPU=1 tools/feigen-bench.sh after` → `tools/accept/v0.2/feigen-bench-after.txt`.
   (a) steady state at every level ≤ 2.9 ms **and** ≤ 1.5 × the interleaved NAV median (before: 8.0 / 13.1 / 20.5 /
   22.2 ms); (b) the flip: first two renders and the 60-frame build mean — report them, the build mean must stay under
   4 ms at tier 3 (the tile budget is the knob); (c) is the seam test, item 5. Run it with nothing else on the machine.
5. **Seam:** choose `SEAM_L` so a rung change lands between frames 300 and 340 (your `RUNG@` log tells you where a
   change falls; `L` moves ≈ 0.03 per 40 frames on the fake timeline at these depths, and `&feig=1.3` reached L 1.61 by
   frame 300) and run `SEAM_L=<L> PORT=8778 GPU=1 tools/feigen-bench.sh after` (the whole script again, or copy its
   part (c)). The baseline (`feigen-bench-before.txt`) has median 1.59, kick beats 4.5 at f305/f334 and the flare 42.5
   at f320: your `RUNG@` frame's |Δ| must be ≤ 3 × your median and the pair of frames around it (montage) must show no
   double image, no resolution pop. If the blend is the spike, switch to the hard rung change and run it again.
6. **Events:** the drop (`test&scene=6`, the fake DROP at 13 s):
   `CLOCK=1 PORT=8778 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"until":"window.__FRAME>=779"},{"shot":"feigf-f779"},{"until":"window.__FRAME>=781"},{"shot":"feigf-f781"},{"until":"window.__FRAME>=800"},{"shot":"feigf-f800"},{"until":"window.__FRAME>=900"},{"shot":"feigf-f900"},{"eval":"'RUNG '+CARD.log.filter(function(l){return /RUNG@/.test(l)}).join(' | ')+' errs '+JSON.stringify(CARD.ERRS)"}]'`
   and the same with `'test&scene=6&standin=0'` → `feigf-f781-nostandin`; the montage of 779/781/800/900, the mean |Δ|
   779→781 with and without the stand-in, and 781 vs 781-nostandin (the stand-in's error) — use the python of
   `feigen-bench.sh` part (c) on the files. No black, no double exposure, no frame without a field. The tricorn:
   `'test&scene=6&tricorn=1'` and `…&tricorn=0` at f360 (visibly different sets, DECISIONS §15), and a flip mid-run:
   `[{"until":"window.CARD"},{"until":"window.__FRAME>=300"},{"eval":"CARD.hooks.tricorn(1)"},{"until":"window.__FRAME>=301"},{"shot":"feigf-flip301"},{"until":"window.__FRAME>=302"},{"shot":"feigf-flip302"},{"until":"window.__FRAME>=340"},{"shot":"feigf-flip340"}]`
   → 301 shows the coarse field (rule 3), 340 the refined one; count `[EXC]` lines (0).
7. Tier sweep (HARNESS "Pinning quality"): `setInterval(()=>CARD.Q.q=0.1,16)`, 8 s, shot + `rt.log` + `bench(6,300)`
   median; then `0.95` — same picture, the budget line differs.
8. House, forced: `PORT=8778 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&scene=6' '[{"wait":10000},{"shot":"work/feigf-h10"},{"wait":20000},{"shot":"work/feigf-h30"},{"wait":20000},{"shot":"work/feigf-h50"},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),q:CARD.Q.q,L:CARD.REG[6].scene.rt.label,log:CARD.REG[6].scene.rt.log,glerr:CARD.ctx.gl.getError()})"}]'`
   → three different frames, `q` reported (before §16 the controller settled at 0.50 here; it should now sit near
   its ceiling), no black.
9. Real path, 75 s, then the bundle: `PORT=8778 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":75000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS,hist:CARD.SC.hist})"}]'`
   → `bad []`, `errs []`, 0 `[EXC]`; `node tools/bundle.js && FILE=$PWD/dist/eigenwobble.html PORT=8778 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":30000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'` → the same, 0 `[EXC]`.
10. The scene object still has `name id tag feats cuts score init update draw post help look hud hooks`; `feats` is
    exactly the fields read (`CARD.HELP.rows(true)` = `feats`); `help.feats` covers them (check.js gaps 0).

**Report** (`docs/workers/feigen-field.md`, the deliverable): brief-common (a)–(e), plus (f) the md5 lines of step 3
verbatim, (g) `feigen-bench-after.txt` verbatim with the seam run, (h) one line per shot, (i) the design as shipped —
ladder step, rung size and density at 1280×720, memory, channel layout and target format, the blend rule you ended
with and why, the stand-in error from step 6, the budget table and the rows per frame per level — and (j) the final
`feats`. Leave the worktree committed; do not merge.
