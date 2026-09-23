# Harness — every command a worker needs

All commands run from the repo root. Zero dependencies beyond node ≥ 20, google-chrome, python3 + PIL (montage).

## Serve

```
node tools/serve.js            # http://127.0.0.1:8765/   (file:// blocks module imports)
```
`tools/cdp.js` spawns it automatically if nothing answers on the port, so you rarely run it by hand. Open
`http://127.0.0.1:8765/#test` in a real browser to look at the fake timeline yourself, `#test&fake=0` for the demo
synth, `#test&scene=1` to force scene id 1.

## Static checks — after every edit

```
node tools/check.js
# check: N modules · uniforms N · MS keys N · 0 fail · 0 warn
```
Fails on: syntax, >500 lines, a declared-but-never-fetched uniform, a scene/effect/transition importing core/engine,
'nav' in core/ or transitions/, an MS key without a FEATS entry. Warns above 350 lines.

## Math tests (node, plain import)

```
node tools/test_baby.js        # ... OK · MISI 14
node tools/test_misi.js        # ... OK
node tools/test_hopf.js        # circle error 2e-12 · torus distance 2e-13 · ... OK   (§4 Hopf fibration)
node tools/test_tempo.js       # tempo estimator on a synthetic onset envelope: 120/128/140/174 within ±0.5, 6 s gap held,
                               #   tempo changes picked up (§9). TEMPO_DEBUG=1 prints the ACF peaks, =2 every estimate.
```

## Tempo traces (engine change to `engine/tempo.js`)

```
GPU=1 tools/tempo-trace.sh after [styles]   # bpm / bpmSyn / regularity at 1 Hz per demo style -> tools/accept/v0.2/tempo-<style>-after.txt
```
50 s per style (mix: 360 s), two styles run in parallel. Do not run more than two Chrome instances at once: dropped
frames under-fill the 100 Hz envelope ring (dt is clamped at 1/24 s) and the tempo reads high. The demo synth uses
`Math.random()`: judge on two runs. `tempo-<style>-before.txt` are the v3 estimator's traces (DECISIONS §9).

## Director traces (change to `core/scenes.js`)

```
GPU=1 tools/director-trace.sh after [aba house mix fake]   # every @-event + the 1 Hz line -> tools/accept/v0.2/director-<style>-after.txt
node tools/director-stats.js tools/accept/v0.2/director-aba-after.txt   # returns vs RESTORE@, SWITCH@ on/off the bar line, scene sequence
node tools/test_director.js                                 # scripted MS, no Chrome: look memory, bar-line hold, cap, cancel
```
Under `#test` the log carries `SCENE@t -> id bar<pos> gt<trust>`, `RESTORE@t alt<id> scene<id>` (a section's looks came
back) and `SWITCH@t -> id bar<pos> (held N beats, <trigger>)` (an event-branch soft switch landed); the 1 Hz line ends
with `alt ret bar gt`. `QOFF=1` traces with the grid hold off (`CARD.SC.quantise = false`). aba is 190 s, house 120 s,
mix 360 s, fake 72 s (`CLOCK=1`, deterministic); two styles at a time, never more Chrome than that. `demo` synths use
`Math.random()` — the section ids and pick order differ between runs, the counts are what to compare.

## Transition (change to the crossfade pass, or a new `assets/transitions/*.js`)

`&trans=<name>` under `#test` picks a registered transition for the run (`CARD.TRANSITIONS` lists them; the default
is set in `assets/main.js`). The reference frame is **director-blind** (since §15): force scene 0, release the director
at frame 120 and start the fade to 3 by hand, shoot 58 frames later (`58/60/1.935 s = 0.499`):

```
CLOCK=1 GPU=1 OUT=tools/accept/v0.2 node tools/cdp.js 'test&scene=0&trans=mixs' '[{"until":"window.CARD"},{"until":"window.__FRAME>=120"},{"eval":"CARD.SC.forced=-1;CARD.goScene(3,false);CARD.SC.next"},{"until":"window.__FRAME>=178"},{"shot":"trans-mixs-0-3-f178"},{"eval":"JSON.stringify([CARD.SC.cur,CARD.SC.next,CARD.SC.m])"}]'
# EVAL … => "[0,3,0.4994…]"   md5sum tools/accept/v0.2/trans-mixs-0-3-f178.jpg → a6e2b8cdcc47316cebb04f5529a26b06 (GPU=1, 1280×720)
```
`mixs` is v3's crossfade and must stay byte-identical to that md5. A different md5 after a core change is a pixel
difference to explain, never a tolerance. `accept.sh` checks it on every sweep. Until §15 the reference was the fake
timeline's own first fade at frame 290 (`4ac523e9770e7d0625d46ed1f3e44769`, `trans-before-f290.jpg`); registering
FEIGEN changed what the director picked there (NAV → FEIGEN instead of NAV → TORUS) without any transition pixel
changing, so the check moved to the forced pair — the same md5 with FEIGEN registered and not (DECISIONS §15).
**Registering a scene can move a director-dependent md5; the check must never depend on a pick.** The recipe for any
other pair at `m ≈ 0.5` is the same:

```
CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=1&trans=morph' '[{"until":"window.CARD"},{"until":"window.__FRAME>=120"},{"eval":"CARD.SC.forced=-1;CARD.goScene(3,false);CARD.SC.next"},{"until":"window.__FRAME>=178"},{"shot":"trans-morph-1-3-f178"},{"eval":"JSON.stringify([CARD.SC.cur,CARD.SC.next,CARD.SC.m])"}]'
```
The §11 A/B set: (0 → 2) NAV → MANDALA, (1 → 3) DUST → TORUS, (5 → 0) POLYTOPE → NAV, plus the f290 fade, for `mixs`
and `morph` → `tools/accept/v0.2/trans-<name>-<A>-<B>-f178.jpg`, tiled in `montage-trans.jpg`.

`CARD.benchTransition(n = 300)` → `{mixs: ms, morph: ms}` per full-resolution pass, readPixels-synced (the current
scene into `a`, the next registered one into `b`, then `n` passes with `m` sweeping .2 → .8). Same caveats as `bench`:
first call cold, run three, take the median. It advances a transition's own per-fade state (the morph's ease), so
bench after the shots, never before one. Both benches sync with a FLOAT `readPixels` on the RGBA16F targets since §11 —
the UNSIGNED_BYTE read they used before is INVALID_OPERATION on a float target (rejected client-side, never synced:
`CARD.bench` numbers recorded before 2026-09-23 §11 were submission times, ~0.01–0.05 ms, not render times). Check
`CARD.ctx.gl.getError()` is 0 after a bench.

## Engine textures (core change to `uploadEngineTex`, or a stage that writes `TEX`)

The core uploads only the `hist` rows the engine wrote since the last frame (§13). `tools/hist-check.js` is an eval body
that reads the GPU texture back through a framebuffer and compares every byte with the engine ring; on the real synth
wrap it in a rAF callback (the analyzer hops between frames, so an eval outside the frame sees one CPU row the GPU has
not had yet — that is the measurement, not the upload):
```
HC=$(sed '/^\/\//d' tools/hist-check.js | tr -d '\n' | sed 's/"/\\"/g'); RAF="new Promise(function(r){requestAnimationFrame(function(){r($HC)})})"
GPU=1 node tools/cdp.js 'test&fake=0&scene=1' "[{\"until\":\"window.CARD\"},{\"wait\":3000},{\"eval\":\"$RAF\"},{\"wait\":9000},{\"eval\":\"$RAF\"}]"
# => "hist fb 36053 hop 851 row 83 etexHop 851 nonzero 32768 mismatch 0 bytes 669952 full false glerr 0"   <- mismatch 0
```
`&histfull=1` under `#test` restores the v0.1 whole-texture upload (`CARD.ctx.engineTex.full`); a scene that samples
`hist` must shoot the same md5 with and without it. `CARD.ctx.engineTex.bytes` counts bytes uploaded since load.
`tools/scene-md5.sh <tag> [&extra]` shoots every registered scene at frames 360 and 840 under `CLOCK=1` into
`tools/work/<tag>-s<id>-f<N>.jpg` and lists the md5s in `tools/work/<tag>-md5.txt` — before/after a core change the
two lists must be identical (`diff`), and `tools/scene-md5.sh x '&histfull=1'` is the hist proof for every scene at once.

## Line renderer smoke (core change to `core/lines.js` or the targets)

```
GPU=1 node tools/lines-smoke.js    # 11 pixel checks: depth order both ways, coverage/width, path-B chunk compiles → lines-smoke: OK
```
Also passes without `GPU=1` (SwiftShader). Draws through `CARD.ctx` (the ctx scenes receive; harness only).

## Headless Chrome (screenshots you Read as images)

```
node tools/cdp.js '<hash>' '<json steps>'
```
- hash: `test` (deterministic fake music, 24 s loop: sustain 0–6 → valley 6–10 → build 10–13 → DROP 13 → peak → valley
  21–24) · `test&fake=0` (real extractor on the demo synth) · `test&scene=N` forces the scene whose `id` is N (sticky; the number keys are offset: key 1 = id 0) ·
  `test&demo=house|dnb|…` picks the synapse synth (§2) · `real` = the real start path (no #test: landing card shown).
- steps: `{wait:ms}` · `{shot:'work/name'}` (→ `tools/work/name.jpg`; `clip:[x,y,w,h,scale]` optional) · `{eval:'expr'}`
  (printed as `EVAL … => value`; promises awaited) · `{click:[x,y]}` · `{key:'d'}` · `{until:'expr', timeout:ms}`.
- env: `GPU=1` real GL (default SwiftShader, ~10× slower) · `NOAUTO=1` no autoplay flag (use for the real start path) ·
  `FAKECAP=1` auto-accept tab capture · `CLOCK=1` deterministic 60 Hz clock (`window.__FRAME`; frame 360 = T 6 s) ·
  `OUT=dir` where shots go (default `tools/`).

Examples:
```
# a scene at T≈6 and T≈14 (the drop is at 13) on the fake timeline
GPU=1 node tools/cdp.js 'test&scene=1' '[{"wait":6000},{"shot":"work/s1-t6"},{"eval":"JSON.stringify(CARD.ERRS)"},{"wait":8000},{"shot":"work/s1-t14"}]'
# EVAL JSON.stringify(CARD.ERRS) => "[]"        <- must be empty
# shot work/s1-t6
```
```
# deterministic: exactly frame 360 / 840 (the fake clock pauses while the screenshot is taken), bit-identical between runs
CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=1' '[{"until":"__FRAME>=360"},{"shot":"work/s1-f360"},{"until":"__FRAME>=840"},{"shot":"work/s1-f840"}]'
```
```
# the real start path: landing card, click the demo link, no NaN anywhere, no shader errors
NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":4000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'
# EVAL ... => "{\"bad\":[],\"errs\":[]}"
```
```
# tile shots for review (640 px wide each, N columns)
python3 tools/montage.py tools/work/m.jpg 2 tools/work/s1-t6.jpg tools/work/s1-t14.jpg
```

## Help view (change to `core/help.js`, a scene's `help` / `help.feats`, or `feats.js` text)

Keys: `?` or `h` toggles, `Esc` closes; `d f m 0–9` keep working with it open. It is DOM (`#help` in `index.html`) over
the still-rendering canvas, built on the first open, and does no work per frame while hidden. Steps `{key:'h'}` and
`{key:'Escape'}` drive it; under `CLOCK=1` press the key *before* the `until` so the shot lands on a full page (the
view completes on the frame it opens).
```
# NAV at frame 120 and TORUS at 360 (the fake timeline's first switch is at 233), then the cast scrolled into view
CLOCK=1 GPU=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"key":"h"},{"until":"window.__FRAME>=120"},{"shot":"work/help-s0-f120"},{"until":"window.__FRAME>=360"},{"shot":"work/help-s3-f360"},{"eval":"document.getElementById(\"help\").scrollTop=1e5"},{"shot":"work/help-cast"}]'
# coverage by eval: every non-internal FEATS key once, and the top table equals the scene's feats on every id
... {"eval":"CARD.HELP.rows().length"}                     # 107
... {"eval":"CARD.goScene(1,true);CARD.HELP.rows(true).join()"}   # DUST's feats, FEATS order
# zero cost hidden: ticks count the live refreshes (every 6th frame while open)
CLOCK=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"until":"window.__FRAME>=600"},{"eval":"CARD.HELP.ticks"},{"key":"h"},{"until":"window.__FRAME>=1200"},{"eval":"CARD.HELP.ticks"}]'   # 0 then 100
```
`accept.sh` "== help" does all of the above plus the real start path with the help opened and closed (`[EXC]` must be 0;
the bundle line opens and closes it too). `check.js` enforces `help.feats ⊂ feats`, three non-empty `help` depths, and
warns on a `feats` entry without a `help.feats` line. The §11 md5 is the proof the overlay changes nothing underneath:
with the help open at frame 290 `[SC.cur, SC.next, SC.m]` is the same triple and `__FRAME` still advances after a `{wait}`.

## `window.CARD` (available in every page)

`MS` (music state) · `SC` (director; `SC.hist` = the ids shown so far, `SC.cur/next/m`) · `Q` · `FX` · `ERRS` (shader errors — must be `[]`) · `GROOVE` · `LOOK` · `ENGINE`
(`ENGINE.ms` = engine CPU ms/frame EMA) · `SCENES` (scene objects, registration order) · `REG[id]` = `{id, base, scene, variant}` ·
`EFFECTS` · `TRANSITIONS` · `FEATS` · `HELP` (`on`, `ticks`, `nTop`, `rows(topOnly)` — "Help view" above) · `log` (event log under #test:
`DROP@t`, `SECTION@t arc`, `SCENE@t -> id`, 1 Hz status lines) · `frameN` · `home` (the home scene's state; `NAV` in v3) ·
`hooks` (scene test hooks) · `GRID` (the exterior ray table, null until the worker finishes).

- `CARD.fix = {bass: 1, arc: 'peak'}` pins MS fields every frame after extraction (works with `fake=0` too). `null` clears.
- `CARD.glerr` is set only when a `gl.getError()` poll (every 30 frames) returns non-zero — `undefined` means clean.
  For an immediate check evaluate `CARD.ctx.gl.getError()` (0 = clean).
- Pinning quality: `CARD.Q.q` is re-adapted every frame, so pin it with `setInterval(() => CARD.Q.q = 0.1, 16)` and
  wait longer than the scene's own smoothing (TORUS eases its tier over ~2 s; wait 8 s before the shot).
- `CARD.goScene(id, hard)` · `CARD.bench(id, n)` → ms per full-resolution render of scene id, readPixels-synced (the
  default `n` is 40 for a quick look; a number you report needs `n ≥ 300`, see below) ·
  `CARD.benchTransition(n=300)` → the same per registered transition ("Transition" above).
  Headless timers quantise to ~1/24 ms: use `n ≥ 300`, run it three times, read the median; below ~0.1 ms it only says "cheap".
  The first call after any pause is cold (0.5–1.5 ms, shader warm-up) — discard it.
- `CARD.nonFinite()` → keys of MS holding a non-finite number (must be `[]`).

## Continuity monitor (NAV invariant)

```
MON=$(grep -v '^//' tools/monitor.js | tr '\n' ' ' | sed 's/"/\\"/g')
GPU=1 node tools/cdp.js 'test&fake=0' "[{\"wait\":1500},{\"eval\":\"$MON;'ok'\"},{\"wait\":60000},{\"eval\":\"JSON.stringify({n:MON.n,fast:MON.fast,viol:MON.viol})\"}]"
# => {"n":3519,"fast":97,"viol":[]}     <- viol must be []; fast = smooth fast frames (exterior springs after drops), fine
# It watches NAV.cPath (the chart position before the beat-kick blend); a violation is a spike: d>0.06 and d>2.5x the
# previous frame's motion, outside declared cuts (pathCut<=2, a kick rise, a mode change and the 0.3 s after it).
```

## Parity with v3 (core/engine changes only)

```
GPU=1 node tools/parity.js fake     # MS/NAV identical to 1e-9 at 1 Hz for 24 s + montage tools/accept/v0.2/parity-fake.jpg
GPU=1 node tools/parity.js real     # fake=0: both bpm within 1 of the synth's 126, arc sequence identical, drops within 0.5 s
```

## Single-file build

```
node tools/bundle.js                                  # → dist/eigenwobble.html (all modules inlined, works from file://)
FILE=$PWD/dist/eigenwobble.html GPU=1 node tools/cdp.js 'test&scene=0' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite()})"}]'
```

## Acceptance sweep

```
GPU=1 tools/accept.sh               # everything above, shots → tools/accept/v0.2/
```

## Pitfalls already paid for

- `gl.POINTS` vanish in an offset viewport on ANGLE-GL (fine in SwiftShader): overlays draw paths in-shader.
- `smoothstep(a,b,x)` with a>b is undefined. Never name a GLSL variable `gl_*`.
- `readPixels(UNSIGNED_BYTE)` from an RGBA16F target returns black — `ctx.mkTarget(w,h,true)` for readback.
- Headless frame pacing sinks `Q.q` on any scene; `Q.q` is not a perf verdict, `CARD.bench` is.
- A per-iteration `sin(atan)` in a unified shader sank `Q.q` to 0 — keep shaders per scene, gate work on uniforms.
- Module scripts are strict mode: no implicit globals. Import what you use.
- The demo synth uses `Math.random()` noise: `fake=0` runs are not bit-identical ("judge on 2+ runs"); `#test` is.
- The empty hash defaults to `test` in cdp.js — pass `real` for the real start path.
