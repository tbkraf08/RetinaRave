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
Fails on: syntax, >500 lines, a declared-but-never-fetched uniform, a scene/effect importing core/engine, 'nav' in
core/, an MS key without a FEATS entry. Warns above 350 lines.

## Math tests (node, plain import)

```
node tools/test_baby.js        # ... OK · MISI 14
node tools/test_misi.js        # ... OK
node tools/test_hopf.js        # circle error 2e-12 · torus distance 2e-13 · ... OK   (§4 Hopf fibration)
```

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
# deterministic: exactly frame 360 / 840, bit-identical between runs
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

## `window.CARD` (available in every page)

`MS` (music state) · `SC` (director) · `Q` · `FX` · `ERRS` (shader errors — must be `[]`) · `GROOVE` · `LOOK` · `ENGINE`
(`ENGINE.ms` = engine CPU ms/frame EMA) · `SCENES` (scene objects, registration order) · `REG[id]` = `{id, base, scene, variant}` ·
`EFFECTS` · `FEATS` · `log` (event log under #test:
`DROP@t`, `SECTION@t arc`, `SCENE@t -> id`, 1 Hz status lines) · `frameN` · `home` (the home scene's state; `NAV` in v3) ·
`hooks` (scene test hooks) · `GRID` (the exterior ray table, null until the worker finishes).

- `CARD.fix = {bass: 1, arc: 'peak'}` pins MS fields every frame after extraction (works with `fake=0` too). `null` clears.
- `CARD.goScene(id, hard)` · `CARD.bench(id, n=40)` → ms per full-resolution render of scene id, readPixels-synced.
- `CARD.nonFinite()` → keys of MS holding a non-finite number (must be `[]`).

## Continuity monitor (NAV invariant)

```
MON=$(grep -v '^//' tools/monitor.js | tr '\n' ' ' | sed 's/"/\\"/g')
GPU=1 node tools/cdp.js 'test&fake=0' "[{\"wait\":1500},{\"eval\":\"$MON;'ok'\"},{\"wait\":60000},{\"eval\":\"JSON.stringify({n:MON.n,fast:MON.fast,viol:MON.viol})\"}]"
# => {"n":3590,"fast":36,"viol":[]}     <- viol must be []; fast = smooth fast frames (exterior after drops), fine
```

## Parity with v3 (core/engine changes only)

```
GPU=1 node tools/parity.js fake     # MS/NAV identical to 1e-9 at 1 Hz for 24 s + montage tools/accept/v0.1/parity-fake.jpg
GPU=1 node tools/parity.js real     # fake=0: bpm within 1, arc sequence identical, drops within 0.5 s
```

## Single-file build

```
node tools/bundle.js                                  # → dist/eigenwobble.html (all modules inlined, works from file://)
FILE=$PWD/dist/eigenwobble.html GPU=1 node tools/cdp.js 'test&scene=0' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite()})"}]'
```

## Acceptance sweep

```
GPU=1 tools/accept.sh               # everything above, shots → tools/accept/v0.1/
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
