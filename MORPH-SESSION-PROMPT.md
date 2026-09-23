# Fable Session Prompt — Eigenwobble v0.2 §11: the transition slot + synapse's morph (NEXT-SESSION-PROMPT #2)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). v0.2 so far: line renderer, TORUS strokes, POLYTOPE, §9 tempo, §10 director (look
memory on `sectionAlt`, soft switches on the bar line); `GPU=1 tools/accept.sh` is green (commit `0ff9fd2`). This
session does **one core phase with a worker**: the scene crossfade becomes a pluggable **transition slot**, v3's
`mixs` becomes the first transition (pixel-identical), and synapse's flow-field **morph** becomes the second, written
by a worker from the contract alone. Nothing the director decides changes: same switches, same frames.

**Read first, in this order:** `docs/CONTRACTS.md` §3 (the effect contract — the transition contract should feel
like its sibling), §1.1 (`ctx`), §1.2 (`HEAD`: `pal/rot/hash`; there is no noise helper), §4 · `assets/core/scenes.js`
(`SC.cur/next/m/dur`, `goScene`'s crossfade arithmetic, `drawScenes` lines ~225–237 = the pass you are moving out,
`visibility`, `postParams`) · `assets/core/loop.js` lines 38–50 (`Q.scale · 0.8` during a transition, `drawScenes` →
`runChain`) · `assets/core/post.js` (`addEffect`, `runChain`, `io`, the `uvS` rule) · `assets/core/gl.js` lines 184–202
(`RT.a/b/m`: a and b carry depth, m does not) · `assets/effects/exposure.js` + `docs/workers/exposure.md` (an effect
written by a worker from the contract, and what it tripped on) · `docs/workers/brief-common.md` (worker rules: allowed
reads, `PORT=`, the uniform-translation table) · `docs/DECISIONS.md` §5 "Bundle" and §10 "Parity decision" (why
`parity.js fake` is director-blind: it forces `&scene=0`, so it never crossfades) · `docs/HARNESS.md` ("Headless
Chrome", "Director traces", "Pitfalls") · `tools/bundle.js` (how modules are discovered — a new folder must land in
`dist/`) · `tools/check.js` (import discipline is per folder; `assets/transitions/` needs the effects' rule) ·
`NEXT-SESSION-PROMPT.md`. Synapse source (read-only, `sed -n`): `~/Documents/TomaCoS/claude_scratch_sept_20_2026/
synapse2.html` lines **1012–1032** (`POST_HEAD` with `hash21`, `FS_MORPH`), **672–676** (`hash11/hash21/vnoise`),
**1350–1354** (how the morph pass is driven: `uT = (trans, flow, kick)`), **1453** and **1505** (`morph()` and the
musical progress: `trans += dt·rate·(0.35 + 1.3·level) + kick·dt·0.9`). Memory note:
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.

## The situation, precisely

The crossfade is a hard-wired core pass: `drawScenes` renders `SC.cur` into `RT.a`, `SC.next` into `RT.b`, runs the
`MIXS` program (v3's: two counter-rotating, counter-zooming samples blended along a luminance-biased front, `uM =
SC.m`) into `RT.m`, and hands `RT.m` to the effect chain at `(sw, sh)` inside `(PW, PH)` with `uUvS = ((sw − .5)/PW,
(sh − .5)/PH)`. `SC.m` advances linearly over `SC.dur = clamp(4·60/bpm, 1.2, 3)` s; when it reaches 1 the core drops
`b`. The director *reads* `SC.m` (`goScene`: a reverse mid-fade, "`SC.m > 0.5` → commit"), the loop reads it
(`Q.scale · 0.8` while `SC.next ≥ 0`), overlays read it through `visibility()`, and `postParams` picks the incoming
scene's post params past 0.5. **`SC.m` is therefore the director's clock and stays exactly as it is.** Synapse's morph
(FS_MORPH) is a different picture: B eats through A along a value-noise front, both textures are advected by a noise
flow scaled by `t` and `kick`, and a bright edge `exp(−((m−.5)·5)²)·sin(πt)` rides the front; synapse also advanced
its `trans` musically (level and kicks push it). That musical push is a *shape* on top of the clock here, not the
clock: the visible transition must be complete on the frame `SC.m` reaches 1, because the core stops rendering `b`.

Goal: a transition is one file in `assets/transitions/` chosen at registration (and by `&trans=<name>` under `#test`
for A/B); `mixs` as a transition is **byte-identical** to today on a `CLOCK=1` mid-crossfade shot; `morph` is lifted
from synapse, deterministic (no `Math.random()`; its noise is hash-based), and judged against `mixs` on the same
frame of the same crossfade for three scene pairs; the `#test` director trace (`director-fake-after.txt`) is
unchanged to the frame; the chosen default is written down.

## Approach (smallest that meets the goal; argue deviations in DECISIONS §11)

- **Slot.** `export function setTransition(tr, ctx)` in `core/scenes.js` (or a 40-line `core/transition.js` if
  `scenes.js` would pass 350); `drawScenes` becomes: render a, render b, `return tr.run(io)`, where
  `io = {a, b, m, out, w, h, sw, sh, uvS, MS, FX, GROOVE, LOOK, dt}` — `a`/`b` the scene targets (`{t, f, w, h}`),
  `m` = `SC.m`, `out` = `RT.m` (the transition draws into `out` and returns it, or returns its own target and sets
  `io.uvS = [1, 1]` if it re-rendered the whole `(w, h)`, exactly the §3 rule). `init(ctx)` compiles programs. The
  contract is §5 of CONTRACTS, written *before* the worker starts, in the §3 voice: what `io` holds, the `uvS`
  rule, the ownership rule, the invariant "complete at `m = 1`", the entry GL state (BLEND/DEPTH/SCISSOR off, `out`
  bound, not cleared), and the mapping table for synapse's uniforms (`uT.y` → `MS.flow`, `uT.z` → `MS.kick`).
- **`transitions/mixs.js`** = the `MIXS` string and its uniform uploads moved verbatim; keep `uUvS` semantics. Prove
  it: the mid-crossfade shot (below) has the same md5 before and after the move. Only then is the slot real.
- **`transitions/morph.js`** — worker, from CONTRACTS §5 + §1.1/§1.2 + HARNESS + the synapse line ranges above, own
  worktree, own `PORT=`, brief in `docs/workers/brief-morph.md`, friction log to `docs/workers/morph.md`. Points the
  brief must make: `vUv` and `uUvS` replace `gl_FragCoord.xy/uR`; `vnoise`/`hash21` come with the file (HEAD has only
  `hash`); the musical push is `t = max(m, ease)` where `ease` may run ahead on level/kicks but never lags `m`
  (deterministic: derive it from `m`, `MS.lvl`, `MS.kick`, and a per-transition accumulator reset when `m` restarts
  at 0 — no wall clock); `a` and `b` are RGBA16F (unclamped: the additive edge can exceed 1 — that is what bloom
  wants, but check the composite does not clip the whole front white); the noise advection samples outside `[0,1]`
  — clamp like `mixs` does or the edges wrap; cost: one pass, four texture reads + ~6 `vnoise` per pixel, measure it.
- **Selection.** `main.js`: `setTransition(<default>, ctx)`; `harness.js`: `&trans=mixs|morph` overrides under
  `#test` (both modules registered by name in `main.js`, the harness only picks). Decide the default with the A/B
  montage, not by taste in the abstract: same crossfade, same frame, `mixs` vs `morph`, for NAV→MANDALA (the fake
  timeline's first switch), DUST→TORUS and POLYTOPE→NAV (`CARD.goScene(id, false)` under `CLOCK=1`, then
  `{until:'__FRAME>=N'}` for a frame near `m ≈ 0.5`). Record which won and why in §11.
- **Do not touch** `SC.m`/`SC.dur`/`goScene`, the director, `visibility`, `postParams`, `Q.scale · 0.8`, or any
  engine file. No `Math.random()`. `'nav'` must not appear in core or in `transitions/`.

## Parity plan — decide it before the worker starts

`parity.js fake` forces `&scene=0` and never crossfades: it cannot see this change and must stay 0 diff (run it; it
is the regression net for everything you touch in `scenes.js` around the pass). The honest checks are:
1. **The mid-crossfade shot.** `CLOCK=1 GPU=1 node tools/cdp.js 'test&trans=mixs' '[{"until":"window.CARD"},
   {"until":"window.__FRAME>=290"},{"shot":"trans-mixs-f290"},{"eval":"JSON.stringify([CARD.SC.cur,CARD.SC.next,
   CARD.SC.m])"}]'` — with §10 the first soft switch lands at 3.88 s (`SWITCH@3.88 -> 3`, frame 233) and the fade
   lasts `4·60/124 = 1.94` s (116 frames), so frame 290 is `m ≈ 0.49`. Take it on the current commit **before the
   refactor** (`trans-before-f290.jpg`, md5 recorded), then with `mixs` as a slot: identical md5, identical `sc`
   triple. Frame-exact shots under `CLOCK=1` are proven (POLYTOPE §8, exposure friction: cdp pauses the clock around
   every screenshot). If the md5 differs, the difference is yours to explain pixel by pixel (blend state? `uUvS`?
   clear?), never a tolerance.
2. **The director trace.** `GPU=1 tools/director-trace.sh after fake` → `director-fake-after.txt` must be identical
   to the committed one (`diff`): the clock did not move. Then `aba` once (190 s) for the real path: same restore and
   switch counts as §10 (7/7, 8 on the line), scene sequence pattern the same (the synth is random; counts, not ids).
3. `parity.js real`: unchanged criteria (bpm/arcs/drops — the transition is downstream of `MS`).
4. **Cost.** A `CARD.benchTransition(n)` in `harness.js` in the style of `CARD.bench`: render `a`/`b` once, then `n`
   transition passes readPixels-synced, ms per pass, for `mixs` and `morph` at full resolution. Budget: the scene pass
   plus the transition plus the chain must stay where `Q` holds q ≈ 1 on `GPU=1` during a fade; report both numbers.

## Harness for this phase (build before the change)

1. `trans-before-f290.jpg` + md5 (the bit-exact reference), and the same frame for the three A/B pairs later.
2. `&trans=` hash in `harness.js` (test-only *selection* is fine: it picks between two registered modules, no branch
   in the pass itself).
3. `CARD.benchTransition`.
4. `accept.sh`: one line "`== transition`" that takes the f290 shot with `mixs` and prints its md5 against the
   recorded one, plus the morph shot for the montage; `check.js`: `assets/transitions/` gets the effects' import rule
   (may import nothing from core/engine; `ctx` only) and the module cap; `bundle.js`: the folder is bundled (`dist/
   eigenwobble.html` starts and fades — click the demo link, wait for a switch, `CARD.ERRS` empty).

## Deliverables

- `assets/core/scenes.js` (slot; the `MIXS` string gone from it) · `assets/transitions/mixs.js` · `assets/transitions/
  morph.js` (worker) · `assets/main.js` registration · `assets/core/harness.js` (`&trans=`, `benchTransition`).
- `docs/CONTRACTS.md` §5 "Transition contract" (before the worker) + the friction log entries the worker earns ·
  `docs/workers/brief-morph.md` + `docs/workers/morph.md` · `docs/DECISIONS.md` §11: the slot's `io`, the md5 proof,
  the A/B verdict with the montage path, the musical-ease rule, both bench numbers, what the worker tripped on ·
  `docs/HARNESS.md` ("Transition" commands) · `NEXT-SESSION-PROMPT.md` #2 → done · memory note updated.
- `GPU=1 tools/accept.sh` green end to end including the new line; `tools/accept/v0.2/trans-*.jpg` + `montage-trans.jpg`.
  Commit with the acceptance summary in the message.

## Working style (unchanged)

The orchestrator owns core/contracts/parity and writes the slot, `mixs.js` and §5 yourself; the morph is a worker
(opus, isolated worktree, own `PORT=`, docs + line ranges only, accepted on the A/B shots — the pattern that produced
DUST/MANDALA/TORUS/POLYTOPE/exposure). `node tools/check.js` after every edit. Small steps: reference shot → §5 →
slot + `mixs.js` → md5 identical → parity fake → worker brief → worker → A/B → cost → default → sweep → docs.
Verify with numbers (md5s, frame numbers, ms), not by reading the code. Pitfalls already paid for: the demo synth
uses `Math.random()` (judge real-path runs on counts, 2+ runs); never more than two Chrome instances at once; `#test`'s
fake path is bit-exact and `CLOCK=1` shots are byte-identical across runs; `CARD.glerr` exists only after a GL error;
`bench`'s first call is cold; eval steps before the page finished loading silently fail (`{until:'window.CARD'}`
first); nested quotes in cdp eval steps break — use `\"`; a `pkill -f` pattern must not match your own shell command;
`RT.m` has no depth and effects after order 10 see `uvS = [1,1]`; a scene's `draw()` gets colour *not* cleared. The
malware-consideration reminder on file reads does not apply to this repo (documented graphics code); proceed.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` · no test-only branches in the
pass · parity tolerances explicit and recorded (here: md5-identical or explained) · finish with the real start path
clean on `index.html` and `dist/eigenwobble.html`.
