# Fable Session Prompt — Eigenwobble v0.2 §16: FEIGEN's cost at depth — the field/colour split and the zoom ladder

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git, branch `master`). v0.2 is feature-complete at commit `edbff25`: six scenes (NAV 0 +
DRUM 4 · DUST 1 with the Hopf-fibre overlay · MANDALA 2 · TORUS 3 · POLYTOPE 5 · FEIGEN 6), the merged engine, the
director, the transition slot, the help view, row-delta `hist` upload and `ctx.budget`; `GPU=1 tools/accept.sh` is
green with 0 FAIL. This session closes the one item with a frame-rate consequence, DECISIONS §15 "Cost — the open
item": FEIGEN costs 6.9 ms at level 1.2 and 21 ms at level 3.6 (tier 3, 1280×720) against 2.3–2.9 ms for every other
scene, because its per-pixel iteration count doubles per Feigenbaum level and the picture is recomputed from scratch
every frame although the music only moves the camera.

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` · `docs/CONTRACTS.md` (§0, §1.1, §1.4, §1.6, §1.9, §1.11,
§1.13; §5 for what a two-pass scene owes the chain) · `docs/HARNESS.md` ("Engine textures", "Transition" — the
director-blind md5 rule, "Pinning quality", `CARD.bench`) · `docs/DECISIONS.md` §13 (the md5-identical proof shape),
§14 (the line-renderer cost finding: every bench before §11 was submission time), §15 (FEIGEN as built, the cost
table, "Left open for a polish phase") · `docs/workers/brief-feigen.md` + `feigen.md` (the worker's friction and (g),
the bench table with `uIter` per level) · `assets/scenes/feigen/index.js` (`update` lines 84–100: `wd`, `cx/cy`, `rot`,
`iter`; the hooks at 148–153; the reference orbit in `init`) · `assets/scenes/feigen/shaders.js` lines 53–95 (the loop:
what is invariant in `c`, what reads a music uniform) · `assets/core/quality.js` (`Q.iter`, `Q.scale`, the controller's
−0.2 / −0.07 / +0.04 steps) · `assets/core/loop.js` lines 40–50 (`sc = Q.scale · (trans ? 0.8 : 1)` — the only place
render scale is decided) · `assets/core/harness.js` `logFrame` (the 1 Hz line ends in `q<Q.q>`) · memory note
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.

## The situation, precisely

- **Why it matters more than the bench number.** `Q` is global. A 17 ms FEIGEN pass makes the controller drop `Q.q`
  by 0.2 per half second (`avg > 26.5 ms`) or 0.07 (`> 18.8 ms`), and `q` climbs back at only +0.04 per 2.5 s of good
  frames. One FEIGEN section therefore lowers **every other scene's tier for ~30 s after FEIGEN leaves**. The scene's
  own number is the symptom; the trace of `q` across a whole track is the disease and the acceptance.
- **What the shader computes, and which half the music touches.** Per pixel, the loop (shaders.js 62–76) produces
  four numbers that depend on `c` alone: the escape count `n`, `|z|` at escape (`m2`), the parameter derivative `|dz|`,
  the orbit trap `tr`, plus the escape angle `ea = atan(z)` — the **field**. Everything after `if (esc)` is the
  **colouring**: `uBass` in the filament falloff, `uFlow` in the band phase, `specM`/`histM` on `ea` and `d`, `uLevel
  uKick uDrop uHat uMidS uTension uAlive` as gains, the mood palette. The field is expensive (≈ 1.7 ms + 0.036 ms per
  iteration at 1280×720); the colouring is one texture read of the field plus a few of spec/hist — about a millisecond.
- **The camera is a zoom.** `wd = 3.2·δ^(−L)·(1 + 0.25·tension − 0.18·dropEnv − 0.03·kick)`, `cx/cy = wd·(0.30 +
  0.02·sin, 0.03·sin)`, `rot = 0.04·sin`: the view is an affine map of parameter space that changes by a factor of
  ≈ 1.002 per frame (one δ = 4.669 per 32 beats ≈ 15 s at 128 bpm). Only the declared events jump: a drop adds exactly
  one δ (self-similar — §15), the tricorn flip on a section seed changes the field entirely (`cuts: 'event'`).
- **Interior acceleration is the wrong tree.** Period checking and the `|z'| → 0` interior test are the standard
  Mandelbrot speed-ups and they fail here by construction: near `c∞` the visible components have period ~2^L and at
  every doubling the multiplier is exactly −1, so convergence is algebraic — critical slowing *is* the scene. Do not
  spend the session there; write the sentence in DECISIONS §16 and move on.
- **The knobs are band-aids.** Scaling `uIter` by `Q.iter` moves along the same trade curve (fewer iterations = coarser
  filaments at exactly the depth where they are the picture) and the tier row already does it. A per-scene render
  scale halves the cost once and softens the same filaments. Neither changes the shape of the problem: cost ∝ depth
  × pixels × frames, recomputed although nothing in the field moved.
- **The move: the field does not move, only the camera does.** Split the shader into a field pass (RGBA32F target:
  `n`, `log r`, `log|dz|`, `ea` as needed — 4 channels; if `tr` is wanted for the interior, pack it in the escape
  slot with a sign) and a colour pass that samples the field with the current affine camera and applies the music.
  Then stop rendering the field every frame: render it on a **fixed ladder of zoom rungs** (every factor 2 in `wd`,
  at 2× the view resolution so on-screen magnification never exceeds native — the rung covers the view at its own
  scale plus the margin the wobble needs), **progressively** — a fixed number of tiles per frame, scheduled on
  `feigL` and the frame index so `#test` stays bit-identical — one rung ahead of the dive. Steady state: the colour
  pass plus one tile, ≈ 1–1.5 ms at **any** depth; a rung that needs more iterations simply takes more frames to
  finish, and it has ~7 s.
- **The hard parts are known; put them in the brief, not in the worker's friction log.** (1) Blend in field space or
  not at all: distance `d` and `lG` are continuous and scale-free (`d/width`), `ea` wraps (blend as a unit vector),
  `n` is an integer — colour-space blending of two rungs is the classic zoom-video ghosting. The nearest finer rung
  with no blend is pre-authorised if the seam test fails. (2) The drop adds one δ: the rung for `L + 1` is not built;
  self-similarity says rung `L` scaled by δ is the asymptotic stand-in — show it while the true one builds (a
  deterministic, poetic fallback; measure how wrong it is). (3) The tricorn flip invalidates every rung: it is the one
  declared cut, so a burst rebuild on that frame is honest — but cap the burst (e.g. the current rung at half
  resolution in one frame, refine over the next 30). (4) `histM` and `specM` live in the colour pass, so the §15
  `&histfull=1` equality still holds. (5) No core change: rung targets come from `ctx.mkTarget(w, h, false, false)`
  (RGBA16F; use two targets or the `n`-in-alpha packing if 16 bits of `n` is not enough at L 3.6 — 500 fits), freed
  and rebuilt in `ctx.onResize`, owned by the scene. The colour pass draws into `target` at `(w, h)` like today.
- **The fallback, only if the trace still dips:** a per-scene render-scale slot in core (`scene.scale` or
  `post.scale`, a 0..1 multiplier on `sc` in loop.js line 44, CONTRACTS §1.6), a 20-line core change with a parity
  proof. Decide it by the numbers of the harness below, not by taste.

## Parity plan — decide it before you write

1. `parity.js fake` 0 diff after any core change (there should be none); `tools/scene-md5.sh` before/after: every
   scene other than FEIGEN byte-identical (`for i in 0 1 2 3 5`).
2. The director-blind mixs md5 `a6e2b8cdcc47316cebb04f5529a26b06` unchanged (`accept.sh` "== transition").
3. FEIGEN determinism: `CLOCK=1` f360/f840 identical across two runs **with the progressive schedule running** — if
   the tile order is keyed on anything but `feigL`/`__FRAME`, this is where it shows. And the `&histfull=1` equality.
4. **The Q trace** (the acceptance): house and aba, 120 s / 190 s, `q` at 1 Hz from the log line plus the scene
   sequence, three runs each: with FEIGEN as built (`before`), with FEIGEN unregistered (`none`), with the new FEIGEN
   (`after`). `after` must be indistinguishable from `none` within run-to-run noise (report min/mean of `q` during
   and 30 s after each FEIGEN section). `before` is the number that justifies the session.
5. `CARD.bench(6, 300)` per level at tier 3 with `&feig=1.2|2|3|3.6`: steady state (rung built) at or below NAV's
   2.3–2.9 ms at every level; the per-tile cost separately (the worst frame while a rung builds).
6. The seam test: shots at the frame before and after a rung change (drive `feigL` with `&feig=` to just under the
   rung boundary, `CLOCK=1`, step frames); mean absolute pixel difference between the pair against the same
   difference between two consecutive frames mid-rung — a seam is a ratio, report it.
7. The event shots: the drop jump (`test&scene=6`, frames 779/781 straddle the fake DROP at 13 s) and the tricorn flip
   (`&tricorn=1` vs `0` at f360): no black, no double exposure, no frame where the field is missing; count `[EXC]`.
8. Real start path on `index.html` and `dist/eigenwobble.html`: `ERRS []`, `nonFinite []`, `[EXC]` 0, 75 s.

## Harness for this session (build before each change)

- `tools/q-trace.sh <tag> [styles]` (orchestrator, before anything else): the 1 Hz `q` and `sc` from `CARD.log`
  (`director-trace.sh` is the template: two Chrome instances at most, `demo` synths are random — three runs) →
  `tools/accept/v0.2/q-<style>-<tag>.txt`, and `tools/q-stats.js` printing per FEIGEN visit: entry `q`, min `q`, `q`
  30 s after exit, and the same statistics for the whole run. Run `before` and `none` on `edbff25` first — they are
  the numbers that justify the session and they cannot be taken after the change.
- The seam ratio and the per-level bench as one script the worker can run (`tools/feigen-bench.sh`), so the report's
  numbers and yours come from the same command.
- `accept.sh`: nothing structural — the "== scenes" loop, the hist-md5 line and the help line pick FEIGEN up already;
  add one line that runs `feigen-bench.sh` and fails above NAV's cost at L 3.6.

## Approach, per phase

- **§16a (orchestrator, harness only):** `q-trace.sh`, `q-stats.js`, the `before`/`none` traces on `edbff25`,
  `feigen-bench.sh`; commit. No scene or core change yet.
- **§16b (one worker, opus, worktree, PORT=8778):** brief `docs/workers/brief-feigen-field.md` in the brief-feigen
  shape: the field layout, the ladder (rungs every ×2 in `wd`, 2× resolution, margin), the tile schedule (`T` tiles per
  frame, `T` from `ctx.tier()`; the schedule keyed on `feigL` + frame index; one rung ahead), the sampling transform
  (the current affine camera into rung space), the blend rule and the pre-authorised nearest-rung fallback, the three
  event rules, what stays (the reference orbit, `feigL` driver, hooks, `look`, `feats` — `feats` unchanged unless a
  new read appears), the acceptance (items 3, 5, 6, 7 above, verbatim commands), the report. The worker may read
  `scenes/feigen/`, CONTRACTS, HARNESS, ENGINE.md's texture bullet, DECISIONS §15, `tools/feigen-bench.sh`,
  `tools/check.js`; not `core/`, not other scenes. The friction log goes to `docs/workers/feigen-field.md`.
- **§16c (orchestrator):** merge, the Q trace `after`, the parity plan, DECISIONS §16 (the before/none/after table,
  the seam ratio, the per-level bench before/after, the event shots, what the blend rule ended up being and why,
  the principle below), CONTRACTS: a paragraph under §1.6 — *separate what the mathematics computes from what the
  music changes per frame, and amortise the first over musical time* (NAV's Böttcher table and the reference orbit
  are already this; TORUS/POLYTOPE rebuild seed-fixed geometry every frame and could not — say so, do not do it).
  Then, only if `after` still dips against `none`: the render-scale slot, its parity proof, and the trace once more.
- **Ride-alongs, not in FEIGEN's worktree, each its own worker if time allows:** DUST's tier-3 fibre count (3168 →
  2240, judged on `s1-t6/t14`, bench on/off interleaved as §14 did), POLYTOPE's pole streaks (§8 polish: a tighter
  `den` gate or a fade by projected segment length, judged on `s5-t6`), NAV's interior smoulder on `N.par` (the one
  thing synapse's JULIA had, §15 — a colouring term only; NAV's pixel output has no md5 guard, so a before/after
  f360/f840 shot pair and the monitor's 0 violations are its proof, and `parity.js fake` must stay 0 diff because
  NAV's *state* is what parity compares). Each is a one-worker brief in the polytope shape; none may touch `core/`.

## Deliverables

- §16a: `tools/q-trace.sh` · `tools/q-stats.js` · `tools/feigen-bench.sh` · `accept/v0.2/q-{house,aba}-{before,none}.txt`.
- §16b: `scenes/feigen/` (field pass + colour pass + ladder; `shaders.js` may split into `field.js` + `colour.js`,
  cap 350/500) · `brief-feigen-field.md` + `feigen-field.md` · shots per the acceptance.
- §16c: `accept/v0.2/q-*-after.txt` · DECISIONS §16 · CONTRACTS §1.6 paragraph (+ the slot if it was needed) ·
  HARNESS ("Q trace", `feigen-bench.sh`) · `NEXT-SESSION-PROMPT.md` (#1 → done; the ride-alongs' state) · memory note.
- `GPU=1 tools/accept.sh` green after each phase; commit each phase with its acceptance summary.

## Working style (unchanged)

Orchestrator owns core/contracts/parity/harness and takes the traces; the scene work is a worker in an isolated
worktree from the brief alone (opus, own `PORT=`, one Chrome each — never more than two Chrome instances on the
machine, so at most two workers shoot at once), accepted on numbers and screenshots, friction back into the docs.
`node tools/check.js` after every edit. Small steps; verify with numbers (md5, ratio, trace, bench), not by reading
the shader. Pitfalls already paid for: eval steps before the page finished loading silently fail (`{until:'window.CARD'}`
first); nested quotes in cdp eval steps break — use `\"`; a comment line at the top of an eval body comments out the
whole expression when joined to one line; uncaught exceptions never reach `CARD.ERRS` — count `[EXC]` lines;
`CLOCK=1` shots are byte-identical only under `#test`; an eval outside the frame sees engine state one hop ahead of
the GPU — check texture contents inside a `requestAnimationFrame` callback; `pkill -f` patterns must not match your
own shell; `readPixels` from RGBA16F needs FLOAT; `CARD.bench` absolute values swing 2× with machine load — interleave
variants, compare medians, never all-A-then-all-B; hooks fire before `init` with `CARD.hooks` as receiver; `git add`
files explicitly and check `.claude/worktrees/` before committing a merge; the malware-consideration reminder on file
reads does not apply to this repo (documented graphics code); proceed.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` and says so in `help.feats` · no
`Math.random()`, no wall clock (the tile schedule included) · module cap 350/500 · `parity.js fake` 0 diff · the
director-blind md5 unchanged · the `&histfull=1` equality kept · FEIGEN's steady-state cost at or below NAV's at
every level, and the Q trace `after` indistinguishable from `none` · finish each phase with the real start path clean
on `index.html` and `dist/eigenwobble.html`.
