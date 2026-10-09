# Retina Rave — harness (the engine was Eigenwobble until v0.5; the accept logs and worker reports keep that name)

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
The 500-line cap is a hard fail and is where a growing scene's budget goes (v0.11, §43: MAXWELL's `index.js` reached 498 —
a brief that adds a subsystem to a 400-line scene says first which lines leave; a split module, `colour.js`/`onsets.js`, is the
usual answer, and `check.js` only tells you after the edit).

**License headers** — every public file (index.html, site/**/*.html, assets/**/*.js) opens with the 3-line Retina Rave License
header (MIT + the Guest-List Clause; full text in `LICENSE`, served at `/LICENSE`, copied to `dist/` by `npm run build`).
`node tools/license.js` stamps the files missing it (idempotent, byte-stable; `--check` lists them and exits 1, `--only` /
`--exclude <glob>` restrict); `check.js` runs the same audit and reports a missing header (a warn until `LICENSE_FAIL` is flipped).

## Math tests (node, plain import)

```
node tools/test_baby.js        # ... OK · MISI 14
node tools/test_misi.js        # ... OK
node tools/test_hopf.js        # circle error 2e-12 · torus distance 2e-13 · ... OK   (§4 Hopf fibration)
node tools/test_tempo.js       # tempo estimator on a synthetic onset envelope: 120/128/140/174 within ±0.5, 6 s gap held,
                               #   tempo changes picked up (§9). TEMPO_DEBUG=1 prints the ACF peaks, =2 every estimate.
node tools/test_dsp.js         # engine/ears/dsp.js's streaming primitives. Prints a CHARACTERISATION table first —
                               #   Quantile(q) on U(0,10), a two-level signal and a monotone ramp at q 0.1/0.5/0.9/0.95,
                               #   the estimate read as the mean of v over the last fifth of 200k pushes — then asserts
                               #   the SIGN (v must rise with q: the §73 bug had Quantile(0.95) read 0.508 on U(0,10)),
                               #   convergence within 2 % of the range, a tracked 20 dB step change, rel-mode scale
                               #   invariance, determinism and the 16-push warm-up. The ramp's rows are informational:
                               #   a causal tracker has no stationary quantile on a non-stationary stream.
```

**A change to `engine/ears/dsp.js` reaches everything the ears feed**, so `Quantile`, `RunMedian`, `Band` or `FFT` is the
one place in the engine where the whole live-grid list is the proof, not a slice of it (DECISIONS §73 ran it): the drum
table (five tracks x {`ears`, `v2`} x their references), §64's build table, §59's clock, the queue, the bar store, the
OFFLINE map (`tools/work/v73/mapsum.js` — `map.js` builds its own `PercTrack` and `SubTrack`, so the file+map path moves
with the causal one) and the fake-timeline md5 sweep. Nothing on the `#test` path imports from `engine/ears/` —
`sources/fake.js`, `features.js` and `shim.js` do not, and `engine/clock/clock.js` takes only `FFT` from `dsp.js` — so
**0 of the 24 md5 lines may move**, and that is worth checking as an isolated pair in two worktrees rather than against a
recorded list (jpg bytes drift with the driver). Record each consumer's input stream ONCE per track
(`tools/work/v73/rec.js`: the real `Ears` on the det time base, hooked) and sweep the constants off the recording in
milliseconds instead of a 20 s engine run each.

## OKLab (change to `core/oklch.js`, `math/oklab.js`, or a scene that uses `ctx.oklch`)

```
node tools/test_oklab.js           # the JS twin: Ottosson's reference triples, round trips, C .11 in gamut at L .7 for all hues → test_oklab: OK
GPU=1 node tools/oklch-smoke.js    # the GLSL chunk through CARD.ctx: GPU = twin to 1/255, 0 clipped hues at L .7 C .11, OKLab midpoint keeps L → oklch-smoke: OK
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
node tools/test_director.js                                 # scripted MS, no Chrome: look memory, bar-line hold, cap, cancel, the §95 dwell
DWELL=0 GPU=1 tools/director-trace.sh before house          # §95: the dwell off (&dwell=0) for a before/after; &dwell=a[:b] seconds under #test
```
Under `#test` the log carries `SCENE@t -> id bar<pos> gt<trust>`, `RESTORE@t alt<id> scene<id>` (a section's looks came
back) and `SWITCH@t -> id bar<pos> (held N beats, <trigger>)` (an event-branch soft switch landed); the 1 Hz line ends
with `alt ret bar gt`. `QOFF=1` traces with the grid hold off (`CARD.SC.quantise = false`); `RENUMOFF=1` with the look
memory's key renumbering off (`CARD.SC.renumberOn = false`, v0.3 §21 — the log also carries `FILE@t alt<id> scene<id>`
and `RENUMBER@t <map> kept<n> dropped<n>`, and `director-stats.js` replays the maps to count stale restores). aba is 190 s, house 120 s,
mix 360 s, fake 72 s (`CLOCK=1`, deterministic); two styles at a time, never more Chrome than that. `demo` synths use
`Math.random()` — the section ids and pick order differ between runs, the counts are what to compare.

## Bench protocol (every cost number in DECISIONS comes from this — v0.2 §17 consolidated the three copies)

`CARD.bench(id, n)` is ms per full-resolution render of scene `id`, readPixels-synced. The number is only comparable when:
1. **`q` is pinned first**: `setInterval(() => CARD.Q.q = 0.95, 16)` (or 0.1 for the low tier), then wait longer than
   the scene's own smoothing (TORUS eases its tier over ~2 s; wait 8 s) — a scene that reads `Q.iter` (NAV) otherwise
   changes its own work between calls as pacing sinks `q`.
   `CARD.bench` runs its `n` `update()`s with the thread **blocked**, so a `setInterval` cannot pin state a scene recomputes on an
   event (POLYTOPE re-picks its cast on `sectionEvt`: the first v0.9 bench ran at 4291 segs instead of 960) — pin such state through a
   scene hook (`hooks.cast`) before the calls.
2. **`n ≥ 300`**, three calls, the median — headless timers quantise to ~1/24 ms; below ~0.1 ms it only says "cheap".
   The first call after any pause is cold (0.5–1.5 ms, shader warm-up): discard it.
3. **Interleave with NAV in the same page**: `bench(id,300)` then `bench(0,300)`, as pairs, and report the ratio as
   well as the ms — machine load drifts 2× across a session (0.7 ↔ 1.8 ms on the same page), so only interleaved
   pairs compare, and a "×3 medians" without the interleave once read a fake 1.8× regression (§16 ride-alongs).
4. **Pairs, not triples, and nothing else on the machine**: no second Chrome, no worker shooting, no wait loop
   spinning (a `while ! test -e …` without a sleep zeroed a whole q trace; gate on `timeout 500 tail -f log | grep -q
   -m1 GO`). The user's desktop Chrome loads every bench (flatpak, GPU process ~18 %).
5. A threshold is decidable from interleaved pairs, never from absolute ms: `accept.sh`'s FEIGEN gate is
   `max(2.9 ms, 1.5 × NAV)` for this reason. `tools/feigen-bench.sh` is the worked example of all five.

## Q trace (any scene whose cost could move the global quality knob) and the FEIGEN bench (v0.2 §16)

```
GPU=1 tools/q-trace.sh before|none|after [house aba]   # q + scene at 1 Hz, 3 runs per style -> tools/accept/v0.2/q-<style>-<tag>.txt
node tools/q-stats.js tools/accept/v0.2/q-house-before.txt   # per run: q mean/min, the 0-40 / 40-70 / 70-100 / 100- windows, every FEIGEN visit
GPU=1 tools/feigen-bench.sh before|after [levels]            # per-level bench at tier 3 (NAV interleaved), flip cost, seam ratio -> feigen-bench-<tag>.txt
```
`Q` is global (`core/quality.js`: −0.2 per half second over 26.5 ms, −0.07 over 18.8, +0.04 per 2.5 s of good frames),
so one expensive scene lowers every scene's tier for ~30 s after it leaves; the trace of `q` across a track is the
measurement, the scene's own bench only the symptom. The recipe forces scene 6 at 40 s with the dive set to L 2.5 (the
depth a minute-long section reaches; a visit from the arrival depth stays under L 1.3 for 30 s and costs nothing) and
releases it into a soft switch home at 70 s (`VISIT=40:70:2.5`; `VISIT=` for the director's own picks — the third
field is FEIGEN's dive depth through `hooks.feig`; no other scene has a depth, so a scene that ever needs a forced deep
visit brings its own hook and its own `VISIT` shape in its brief), so every run
has the same deep visit on the same clock; tag `none` makes its `score` 0 after load instead (never auto-picked, as good as unregistered — no file edit).
**One Chrome at a time and nothing else on the machine**: a second instance alone sinks `q` to 0 (`director-aba-after.txt`
was traced beside house and sat at 0.00–0.06 for 190 s), so the runs are sequential (house 3 × 2 min, aba 3 × 3.2 min)
and no worker shoots meanwhile — nor computes: a sibling's wait loop spinning on one core, with the desktop browser's
renderers, held `q` at 0.00–0.05 for a whole run before FEIGEN was even on screen (§16). Check the 0–40 s window
against `none` (0.60) before reading anything else. `demo` synths are random: compare the means of three runs, and compare `after` against
`none`, not against `before`. `feigen-bench.sh` is the worker's and the orchestrator's one source of cost numbers:
`&feig=<L>` per level under the "Bench protocol" above (`q` pinned .95, `bench(6,300)` interleaved with `bench(0,300)`),
the cost of a tricorn flip (every rung rebuilt after §16), and
the seam ratio: `CLOCK=1` shots of frames 300–340 at `SEAM_L`, mean |Δ| per pixel between consecutive frames, max /
median, and the |Δ| at each frame the scene logged a `RUNG@` change. Kick flares are the baseline spikes in that
window (f305 / f334 ≈ 4.5, f320 ≈ 42 on the fake timeline before §16).

## Transition (change to the crossfade pass, or a new `assets/transitions/*.js`)

`&trans=<name>` under `#test` picks a registered transition for the run (`CARD.TRANSITIONS` lists them; the default
is set in `assets/main.js`). The reference frame is **director-blind** (since §15): force scene 0, release the director
at frame 120 and start the fade to 3 by hand, shoot 58 frames later (`58/60/1.935 s = 0.499`):

`&colour=<name>` under `#test` picks a scene colour variant (CONTRACTS §1.4) for every scene that declares it: `&colour=oklch`
shows the §24/§25 OKLCH passes on FEIGEN and NAV; no param = each scene's default (v0.2's palettes). `CARD.colour` lists
the current name per scene, `CARD.setColour(name)` switches at runtime. `tools/scene-md5.sh oklch '&colour=oklch'` is the
variant's md5 list; the plain list is the default's.

```
CLOCK=1 GPU=1 OUT=tools/accept/v0.2 node tools/cdp.js 'test&scene=0&trans=mixs' '[{"until":"window.CARD"},{"until":"window.__FRAME>=120"},{"eval":"CARD.SC.forced=-1;CARD.goScene(3,false);CARD.SC.next"},{"until":"window.__FRAME>=178"},{"shot":"trans-mixs-0-3-f178"},{"eval":"JSON.stringify([CARD.SC.cur,CARD.SC.next,CARD.SC.m])"}]'
# EVAL … => "[0,3,0.4994…]"   md5sum tools/accept/v0.3/trans-mixs-0-3-f178.jpg → 5892ddc5c1f553cbca140bbc1ef6b54d (GPU=1, 1280×720; 425a66e5… under the §24/§25 OKLCH default, a6e2b8cd… on the v0.2 chain)
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

A per-scene transition slot is judged the same way with the slot set by eval before the fade: `{"eval":"CARD.REG[3].scene.post.morph={flow:0.4};CARD.SC.forced=-1;CARD.goScene(3,false)"}` (v0.3 §23: DUST → TORUS at
flow 1 / 0.4 / 0 in `tools/accept/v0.3/morph-flow-slot.jpg`; the stroke-scene pairs 3 → 0, 5 → 0, 1 → 3 for mixs and
morph in `morph-flow-ab.jpg`).

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
The list at the §20 re-base (linear chain, FEIGEN OKLCH, NAV hue, TORUS morph slot) is `tools/accept/v0.3/scene-md5-v03.txt`;
the v0.2 tag's list is what `git worktree add --detach <dir> v0.2` + `PORT=8766 tools/scene-md5.sh base` reproduces.

## Fluid (the substrate — `core/fluid/`, `loop.js`'s step, anything that reads `engineTex.vel` / `.dye` or calls `ctx.fluid`; DECISIONS §104)

One Stam step per frame right after `uploadEngineTex`, on the finished MS, before any scene updates (`core/fluid/fluid.js`); the
MS → force grammar is `core/fluid/inject.js` (pure, `FLUID_FEATS` = its reads, checked by `main.js` at boot and by `check.js`'s
fluid block — a read outside the list FAILS, stricter than a scene's warn). Velocity is in screen fractions per second, everywhere.

- **Switches** (under `#test`): `&fluid=0` — no step, the two 1×1 black placeholders stay bound on `engineTex.vel / .dye` (the
  identity proof below); `&fluiddbg=1` — the dye drawn over the composite (encoded for the eye) with the velocity as an inset
  bottom-right (0.5 + v, ±0.5 uv/s spans the range), `&fluiddbg=2` the velocity alone; harness only — `FLUID.dbg` is 0 on every
  normal path. Key `W` toggles the substrate live (`CARD.setFluid(on)`), a toast says so; where there are no float render
  targets (`CARD.fluid.avail` false) it stays off.
- **`CARD.fluid`** = `{on, avail, ms, tier, simW, simH, dyeW, dyeH, nSplat, steps, params, tex, queue}` — `ms` the step's CPU
  submission time (EMA, like `ENGINE.ms`; the GPU cost is the bench below), `nSplat` the last step's splat count, `params` the
  grammar's live values. The HUD (`D`) has the line `fluid <ms> ms sim WxH dye WxH tier N iters I splats n curl c vd … dd …`;
  the help view's part B says the same and lists `FLUID_FEATS` ("the substrate reads: …", data, never literals).
- **Tiers** (`ctx.tier()`): sim short edge `64 / 96 / 128 / 128`, dye `256 / 384 / 512 / 512`, Jacobi `10 / 14 / 20 / 20` — at
  the canvas aspect, so the cost is set by the short edge and not by DPR (1280×633 headless: sim 259×128, dye 1035×512; a 1440p
  canvas costs the same sim). A tier change re-allocates with a bilinear copy of the old velocity and dye (the picture never
  resets). Under `CLOCK=1` the tier never drops (dtRaw is 1/60), so the md5 runs are one tier.
- **Bench** (the "Bench protocol" above): `CARD.benchFluid(300)` = ms per step at the current tier, readPixels-synced on the dye
  target, interleaved with `bench(0, 300)` as pairs, q pinned (`setInterval(()=>CARD.Q.q=0.95,16)`, wait 8 s), `CLOCK=0`, GPU=1,
  nothing else on the machine. Budget **≤ 1.0 ms at tier 3**, ≤ 0.4 ms at tier 0 (§104 has the numbers on this machine).
- **The identity proof**: `GPU=1 PORT=88xx tools/scene-md5.sh <tag>` with the substrate on must equal the reference list while
  nothing consumes it (Step 1: `tools/accept/v0.34/scene-md5-v034.txt`, every line), and `tools/scene-md5.sh <tag>off '&fluid=0'`
  must equal it too. From Step 2 on (the feedback pass rides the velocity) the default list re-bases to `tools/accept/v0.35/`
  and the `&fluid=0` list is what must still equal v0.34 line for line.
- **Node**: `node tools/test_fluid.js` (in `npm test`) — the grammar on a synthetic MS: the gate, the kick's sqrt law and its two-frame
  tail, the snare's two shears, the seeded hats, the drop's one-beat clear, the parameter maps, the gain, the colour, determinism
  (two fresh states → identical JSON), and a Proxy of MS that throws on any read outside `FLUID_FEATS`.
- **The eye** (FLUID-PLAN "SeeYouDrop windows"): `&track=SeeYouDrop&fluiddbg=1` at `at=0` f602, `at=25` f602 / f1958 / f1982,
  `at=80` f602 / f1202 / f1538 / f1550 — the dye itself, so the question "does the music read in the medium" is answered before any
  consumer exists; two runs of a shot are md5-equal (the four rules under "File source"). §104's set is `tools/accept/v0.35/fluid-*.jpg`.

## Effect chain (change to `core/post.js`, an effect, or the chain's colour space — v0.3 §20)

```
GPU=1 node tools/chain-smoke.js     # the real effects on synthetic input, io.linear 0 and 1: the dark fringe of an encoded blur
                                    #   (equal-luminance magenta|green, min Y / endpoints ≈ 0.75) vs none in linear (≈ 1.0); a white
                                    #   frame through the composite: 198/255 encoded, 255 linear → chain-smoke: OK
```
`&k=1.5` sets the tonemap knee's base (`CARD.CHAIN.k`) and `&kmood=1` its mood gain (`CARD.CHAIN.kMood`, default 0): the frame's
knee is `LOOK.k = k · (1 + kMood · (2·arousal − 1))`, ≥ 0.2 (v0.5 item 4; `look.js` computes it, `loop.js` hands it to `runChain` as
`io.k`). With `kMood` 0 the knee is exactly `k` — every reference md5 holds; `chain-smoke.js` reads 0.18 grey through the linear
composite at k 0.75 / 1.5 / 3 → 135 / 150 / 177 (a harder knee lifts the mids) and checks `LOOK.k === CHAIN.k` at the default.
`&linear=0|1` under `#test` picks the chain's space (`CARD.CHAIN.linear`; the default is linear since §20, 0 is the
v0.2 chain for A/B). The pre-tonemap clip mask: `CARD.EFFECTS.find(e=>e.name==='composite').clipMask=1` turns the
composite into white-where-any-channel ≥ 1; the §20 number is DUST at the fake drop frame (`CLOCK=1`, shot at
`__FRAME>=781` with the mask set at 780; count pixels > 128 with PIL): 10.6 % encoded → 0.12 % linear. The A/B set
is `scene-md5.sh <tag> '&linear=0'` against `scene-md5.sh <tag>` tiled with `montage.py`.

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
  21–24) · `test&fake=0` (real extractor on the demo synth) · `test&scene=N` forces the scene whose `id` is N (sticky; the number keys are offset: key 1 = id 0; `{key:'n'}` steps to the next id, wrapping — v0.10, ids 9+ have no digit) ·
  `test&demo=house|dnb|…` picks the synapse synth (§2) · `real` = the real start path (no #test: landing card shown).
- steps: `{wait:ms}` · `{shot:'work/name'}` (→ `tools/work/name.jpg`; `clip:[x,y,w,h,scale]` optional) · `{eval:'expr'}`
  (printed as `EVAL … => value`; promises awaited) · `{click:[x,y]}` · `{key:'d'}` · `{until:'expr', timeout:ms}`.
- env: `GPU=1` real GL (default SwiftShader, ~10× slower) · `NOAUTO=1` no autoplay flag (use for the real start path) ·
  `FAKEMIC=1` a fake microphone granted without a prompt (Chrome's test tone: `{clickSel:'#mic'}` → `AU.mode` 'mic', `heard` true within 8 s; v0.6) ·
  `MOBILE=1` a phone (390×844, DPR 3, touch, `(pointer:coarse)` true): `#landing.mobile`, the key row hidden, `#tbar` shown while
  running, `Q.q` seeded 0.35, `CARD.TOUCH.{swipes,holds}` count synthetic `TouchEvent`s on `#gl` (a swipe > 60 px in < 700 ms steps
  `SC.forced`; a press held 600 ms toggles the help) — the v0.6 mobile proof recipe is in DECISIONS §35 ·
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
NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"clickSel":"#demo"},{"wait":4000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'
# EVAL ... => "{\"bad\":[],\"errs\":[]}"
```
```
# tile shots for review (640 px wide each, N columns)
python3 tools/montage.py tools/work/m.jpg 2 tools/work/s1-t6.jpg tools/work/s1-t14.jpg
```

## Real window (headed Chrome on the desktop — v0.2 §17's audit; the one thing headless cannot do)

```
HEADED=1 WIN=1920,1080 WINPOS=0,0 DPR=1.5 node tools/cdp.js 'test&scene=6&feig=3.6' '<steps>'   # a real window on $DISPLAY
HEADED=1 WIN=1920,1080 CAPTITLE=WhoLikesToParty node tools/cdp.js 'real' '<steps>'              # tab capture, auto-picked
```
- `HEADED=1` drops `--headless`; `WIN`/`WINPOS` size and place the window; `DPR=1.5` forces `devicePixelRatio` (this
  desktop's native value is 0.75 — GNOME text scaling — so a 1920 × 1080 window renders 1407 × 712 and only
  fullscreen reaches 2560 × 1439); `CAPTITLE=<substring>` makes Chrome pick that tab, with its audio, in the
  `getDisplayMedia` dialog (`{clickSel:'#go'}` is a trusted click — a synthetic `.click()` is not a user gesture).
- Extra steps: `{tab:'url', window:{left,top,width,height}}` opens the music in **its own window** ·
  `{evalTab:'expr'}` evaluates there · `{tab:'url'}` (no `window`) opens a same-window tab, which **hides the page**
  (headed Chrome ignores `background`) — that is the hidden-tab check; `{activate:'main'}` brings the page back ·
  `{bounds:{width,height}}` / `{bounds:{windowState:'fullscreen'}}` resize the real window · `{dblclick:[x,y]}` ·
  `{sh:'cmd'}` runs a shell command mid-run with `DBG` = the debug port (the GPU process: `pgrep -f
  "type=gpu-proces[s].*chr$DBG"`) · `[EVAL-ERR]` lines are exceptions inside an `eval` step.
- **The music must be in its own window.** A media document in a same-window tab that has never been shown does not
  start playing (Chrome's never-activated-tab rule beats the autoplay flag), a captured tab that is not playing delivers
  no audio frames, and the worklet then gets zero-channel input and never hops — the engine holds still by design and
  the watchdog swaps the demo in only if the page is visible. With the music window on the other monitor the capture
  is heard within 5 s and hops at 94/s (`tools/accept/v0.2/audit-2-*.jpg`, `docs/AUDIT-v0.2.md`).
- `tools/probe.js` is the in-page frame probe for these runs: `fetch('/tools/probe.js').then(r=>r.text()).then(eval)`
  then `PROBE.start()`; it records per frame dt, the drawn frame's mean luminance, `SC`, `q`, `FX.glitch` (`g`), `MS.hit`,
  onset/surprise flags (`o`/`s`), and events (scene switch, `next` changes — a hard cut moves `cur` with `next` still −1,
  a soft switch sets `next` first —, drops, visibility, resize, black frame `lum < 2`, long frame > 100 ms, the first
  frame back from hidden); frame-tick events carry the frame's rAF time, so `PROBE.frames.filter(f => f.t >= ev.t)`
  starts at that frame; `PROBE.summary()`. Sharing a tab adds Chrome's infobar to the page and shrinks the viewport by
  56 CSS px — a real `resize()` mid-run.

- **A minimize is the real hidden check on the worklet path** (v0.3 §26 audit): `{bounds:{windowState:'minimized'}}`,
  wait, `{bounds:{windowState:'normal'}}`, `{activate:'main'}` — the page fires `visibilitychange`, the worklet keeps
  hopping (90/s) while hidden, the first frame back is 60–70 ms, and the `back` event in `tools/probe.js` is the origin
  for the resume-hold read (HARNESS "Hidden tab"'s expression). Three minimizes in one run (`audit-b2.txt`) is the
  shape that separates a resume artefact from the song's own surprises: count the hard cuts in the 8 s after each
  `back` against the run's baseline rate (run B: one hard cut per 23 s), and **run the same demo without hiding as the
  control** — an event at +N s after `back` is the demo's own if the control has it at the same clock time (house's
  drop at 44 s). The probe's `sr/su/pr` fields show the model's inputs per frame; the §26 ramp is one line of them.
- **A single low `q` run in a real window is not a cost finding** (v0.4 audit, `AUDIT-v0.4.md`): run E1 sat at `q` 0 for
  52 s at 58 fps; the second run climbed as v0.3's did, and the control — the previous release and the candidate bundle
  from `file://`, same track, 30 s each, minutes apart (`audit-q-control.txt`) — climbed identically to the second
  decimal. Before writing a `q` difference down: repeat the run, then run the previous release under the same conditions.
- **Never bench inside a probed page's reading.** `CARD.bench(id, 300)` is synchronous: it stops the rAF loop for
  4–25 s, the probe records one frame of that dt, and the fake timeline lands its drop on the frame after — a `long`
  and a `drop` event that are the bench, not the engine. Read the probe first, bench after (or in another run).
- `git worktree add` is refused from inside an agent worktree (the harness's isolation): a worker that needs a
  second tree uses `git archive <tag> | tar -x -C <dir>` (no `.git`, so no `git status` there — list the copied files).
- `FILE=` must be absolute (`FILE=$PWD/dist/retinarave.html`); a relative path makes Chrome open `file://dist/…`.

A music-follower (a detector, a navigator's resting place) is judged by a **real-track trace of its own state at 2 s** (v0.8 NAV2:
`tools/accept/v0.8/det8.py` — `hooks.n2info()` + the MS fields it reads, 40 samples, the tab URL and `AU.mode` printed so a broken
capture cannot pass as a track); a headless `#test` proof cannot see a false-positive rate. Two "tracks" with identical numbers = one source.

## Hidden tab (change to the extractor's followers, `ENGINE.resume`, or the loop's resume line — v0.3 resume-hold)

Headless can hide the page: a second tab activated hides the main one (rAF stops, the worklet's hops queue and land in
a burst on return), `{activate:'main'}` brings it back and fires `visibilitychange`. `Page.setWebLifecycleState`
(`frozen`/`active`) is **not** it: `active` never restores visibility headless (tried, dropped).
```
GPU=1 node tools/cdp.js 'test&fake=0&scene=6' '[{"until":"window.CARD"},{"wait":1000},{"eval":"fetch('"'"'/tools/probe.js'"'"').then(r=>r.text()).then(eval).then(()=>PROBE.start())"},{"wait":8000},{"tab":"about:blank"},{"activate":"tab"},{"wait":15000},{"activate":"main"},{"wait":3000},{"eval":"(function(){var b=PROBE.ev.filter(function(e){return e.k==="back"}).pop()||{t:1e9};var fr=PROBE.frames.filter(function(f){return f.t>=b.t}).slice(0,60);return JSON.stringify({n:fr.length,onsets:fr.filter(function(f){return f.o}).length,surprise:fr.filter(function(f){return f.s}).length,drops:PROBE.ev.filter(function(e){return e.k==="drop"&&e.t>=b.t}).length,gmax:Math.max.apply(null,fr.map(function(f){return f.g})),hitmax:Math.max.apply(null,fr.map(function(f){return f.hit})),resumeAt:+CARD.ENGINE.resumeAt.toFixed(1)})})()"}]'
# => {"n":60,"onsets":0,"surprise":0,"drops":0,"gmax":0,"hitmax":0,"resumeAt":26.4}   <- the first 60 frames (1 s) back: nothing may fire
```
`accept.sh` "== hidden tab" runs exactly this, and "== hidden worklet" the same on synapse's dnb synth (150 frames, `srMax` < 1.4). Since the
v0.3 §26 audit the extractor holds events 1 s and its drop rules + surprisal-model variance 2.5 s (`settle`, ENGINE.md "Resume"): a
finding here needs a no-hide control of the same demo (its own drops/surprises at the same clock time) before it is called an artefact. Without the hold (`CARD.ENGINE.resume=function(){}` before hiding) the v3
demo fired a drop within 0.5 s of return in 3 of 8 trials (glitch 0.93, flash: the frame at luminance 172 on FEIGEN) and
carried `hit` 0.1–0.5 into the first frames on all 8; with it, 0 of 8. The real-window version (worklet path, window
minimized) is the `audit-3-*-back-worklet.jpg` recipe in "Real window" — DUST's first frames back climb (23 → 36 over
8 frames) because its exposure re-adapts; that is the effect, not a glitch.

## Help view (change to `core/help.js`, a scene's `help` / `help.feats`, or `feats.js` text)

Keys: `?` or `h` toggles, `p` opens it scrolled to part E (the routes panel, v0.4), `Esc` closes; `d f m n 0–9` keep working with it open (`n` = the next scene, cycling — v0.10, the digits ran out at id 8; `core/scenes.js stepScene`, shared with the swipe). It is DOM (`#help` in `index.html`) over
the still-rendering canvas, built on the first open, and does no work per frame while hidden. Steps `{key:'h'}` and
`{key:'Escape'}` drive it; under `CLOCK=1` press the key *before* the `until` so the shot lands on a full page (the
view completes on the frame it opens).
```
# NAV at frame 120 and TORUS at 360 (the fake timeline's first switch is at 233), then the overlay scrolled to its bottom (`scrollTop=1e5` — **part E, the panel, since v0.4**; for the cast, section C, `scrollIntoView` on its heading instead — the colour-slot worker shot the panel twice believing this line)
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

## Routes and manual overrides (v0.4 — change to `core/route.js`, `core/manual.js`, `scenes.js` postOf / renderScene, or the panel)

Per-scene routing of `MS` fields (CONTRACTS §1.15) and the manual overrides, all under `#test`; storage is ignored there.
```
&route=feigen.bass=centroid*1.5+0.1~0.2!,feigen.kick=snare      # scene.field=src[*k][+b|-b][~tau][!] — several with ','
&route=feigen.bass=c:0.4                                        # a constant source (transfer still applies)
&post=feigen.bloom.thr=0.3,feigen.kaleido=0,dust.exposure.on=0  # the four post params: bloom.thr fb.decay kaleido exposure.on
```
A `+` in a hash reaches the page as a space through `URLSearchParams` — the parser reads both. An unknown scene, field,
source, kind mismatch (`flow` → `bass`), a transfer on an event, or an unknown post param **throws at init** (cdp prints
an `[EXC]` line, the loop never starts — `CARD.frameN` stays 0: a typo must not pass silently). Lists are all-or-nothing.

`CARD`: `ROUTES[scene][field]` (the specs in force) · `ROUTE.n` / `ROUTE.ms` (routes in force / the refresh cost, 0 with none) ·
`route(scene, field, {src, k, b, inv, tau, c} | null)` · `routes('a.b=c,…')` (the grammar, all-or-nothing) · `routesString()` back
to it · `clearRoutes(scene?)` · `routesJSON()` / `loadRoutes(json)` (the panel's preset: `{routes, manual}`) · `sources(field)` (what
may feed it) · `view(name)` (the object the scene reads; `=== CARD.MS` while unrouted) · `MANUAL` (`scene` = `SC.forced`, `trans`,
`colour` per scene, `post`) · `manual('scene', 6)` / `manual('trans', 'mixs')` / `manual('colour', 'feigen', 'oklch')` /
`manual('post', 'feigen', 'bloom.thr', 0.3 | null)` · `posts('feigen.bloom.thr=0.3,…')` / `postString()` ·
`pulse(scene, event)` (v0.4.1: the event is `true` on the scene's view for exactly the next frame — `view(name) !== MS` on
that frame only; the panel's `fire` button; never a route, never stored).

**The panel (v0.4.1, `panel-legibility`)**: the row's first column is the visual ("what it drives here"), the jack second;
a `help.feats` line beginning `the bid:` (CONTRACTS §1.13) dims the row as bid-only; `0` / `1` (`pe-p0-<scene>-<field>`,
`pe-p1-…`) route the jack to the field's `FEATS.range` extremes for 2 s **of help ticks** (120 frames; a raw field: 0 and
twice the live value) and put the previous route back — `save()` is never called, the textarea is not refreshed while a
preview runs; `fire` (`pe-fire-…`) calls `pulse`; `pe-force` / `pe-release` set `MANUAL.scene` to the logical scene / −1
(the line `pe-force-line` says which); `pe-on-<scene>` reads `on screen` / `not on screen`. `closeE()` (called by
`toggleHelp(false)`) ends a running preview. The native `<select>` popup is dark through `#help{color-scheme:dark}` +
`#help option{…}` — judge it **headed** with the list open; headless cannot pop one. `check.js` warns on a `the bid:`
line whose field is read outside `score()` and on a `score()`-only field without the prefix (static; HEAD uniform
components in GLSL count as `draw()` reads).

**Proofs** (`node tools/route-smoke.js` = the grammar, kind rules, ema, fall-through, throws — node, no DOM; the rest headless):
```
# identity: the module loaded and no routes → every scene-md5 line unchanged (v2 and &colour=oklch lists), mixs md5, parity fake 0 diff
tools/scene-md5.sh after; diff <(sort -k2 tools/work/after-md5.txt) <(sort -k2 tools/accept/v0.7/scene-md5-v07.txt)
# the view path is exact: an identity route through the view leaves FEIGEN's md5s identical; a real route moves them
CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6&route=feigen.bass=bass' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"work/rid-s6-f360"}]'   # 8d6ac4a6… (= s6-f360)
CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6&route=feigen.bass=high' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"work/rhi-s6-f360"}]'   # differs
# a manual post: the v2 default's own value leaves s6 identical, bloom off (thr 2) moves it
CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6&post=feigen.bloom.thr=0.3' …   # identical · &post=feigen.bloom.thr=2 differs
# cost: ten routes on FEIGEN, q pinned, bench(6,300)/bench(0,300) interleaved before / with / after ("Bench protocol"): ratios .68 / .64 / .77 (noise),
#   ROUTE.ms 0.007–0.023 ms (tools/accept/v0.4/route-bench.txt); the refresh runs outside ENGINE.frame so ENGINE.ms cannot move
```
`accept.sh` "== routes" runs the smoke, the identity pair, the post pair and a panel-open shot.

## Params (v0.5 — change to `core/params.js`, `loop.js`'s update line, a scene's `params` slot, or the panel's parameters table)

Per-scene routing of `MS` fields into a scene's *visual parameters* (CONTRACTS §1.16), under `#test`:
```
&param=feigen.sharp=centroid*1.5+0.1~0.2!,feigen.glow=c:0.6   # scene.param=src[*k][+b|-b][~tau][!] (route.js's grammar) · a constant c:<value> in the parameter's units
```
An unknown scene or parameter, a source that is not a level / raw / angle / event field, a transfer on a constant, or a
negative τ **throws at init** (`[EXC]`, `CARD.frameN` stays 0). Lists and the preset's `params` block are all-or-nothing.

`CARD`: `PROUTES[scene][param]` · `PROUTE.n` · `param(scene, param, {src, c, k, b, inv, tau} | null)` · `params('a.b=c,…')` ·
`paramsString()` · `clearParams(scene?)` · `paramsOf(name)` (the value object `update()` received: `from(view)` per parameter unless
routed) · `paramDeps(name, p)` (the fields `from()` read at registration) · `derived(name, p)` (`from(view)` now, never stored) ·
`paramSources()` (every routable source, `const` last). `routesJSON()` / `loadRoutes()` carry the block as `params`.

**Proofs** (`node tools/param-smoke.js` = the declaration checks, identity, the transfer, events and constants, the grammar, the block — node,
no DOM; the rest headless):
```
# identity: the module loaded and no parameter routed → every scene-md5 line unchanged (v2 and &colour=oklch), mixs md5, parity fake 0 diff
tools/scene-md5.sh after; diff <(sort -k2 tools/work/after-md5.txt) <(sort -k2 tools/accept/v0.7/scene-md5-v07.txt)
# a scene's move of a constant into params is a no-op per move: the same diff after each commit of the scene's worker
# a param route moves the picture; a constant route at the derived value on the defaults does not have to (from() is live, the constant is not)
CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6&param=feigen.<p>=centroid*1.5' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"work/prt-s6-f360"}]'
```

## Landing tiles (v0.8.1 — change to `core/landing.js`, `hud.js`'s run/stop hooks, `index.html`'s card, a scene's `card` slot, `tools/thumbs.sh`)

The tiles are DOM, rendered from `REG` at `initHUD`; a click is `pick(id)`: `SC.forced = id` and, while the card is up and
`AU.mode === 'none'`, the muted demo synth starts as a live preview with the card slimmed (`#landing.peek`). Prove on the **real**
hash (the harness hides the card under `#test`, so `pick()` never previews there):

    GPU=1 node tools/cdp.js real "$(cat tools/landing-steps.json)"      # the steps: tiles + thumbnail widths, FEIGEN tile → peek state, DIRECTOR → forced -1, TORUS tile then the demo link → the show

Expected: `TILES 6 imgs 480,…` (a 0 or a missing image = the thumbnail did not load — `tools/serve.js` serves `site/` at the root since
v0.8.1; on `file://` the images are absent by design); `PEEK true 6 6 demo 0 peek` (mon 0 = silent); `DIRECTOR -1`; `START demo false 3
hide true []` — the forced scene survives the start. `MOBILE=1` for the
phone card (`.mobile`, four tiles a row) and `FAKEMIC=1` + `{clickSel:"#mic"}` for the microphone out of a preview. Thumbnails:
`tools/thumbs.sh` (all pinned frames) or `tools/thumbs.sh "1:1200"` (one scene); a frame change is a commit that says so. `accept.sh`
"== landing" runs the desktop recipe.

## `window.CARD` (available in every page)

`MS` (music state) · `SC` (director; `SC.hist` = the ids shown so far, `SC.cur/next/m`) · `Q` · `FX` · `ERRS` (shader errors — must be `[]`) · `GROOVE` · `LOOK` · `ENGINE`
(`ENGINE.ms` = engine CPU ms/frame EMA) · `SCENES` (scene objects, registration order) · `REG[id]` = `{id, base, scene, variant}` ·
`EFFECTS` · `TRANSITIONS` · `FEATS` · `HELP` (`on`, `ticks`, `nTop`, `rows(topOnly)` — "Help view" above) · `log` (event log under #test:
`DROP@t`, `SECTION@t arc`, `SCENE@t -> id`, 1 Hz status lines) · `frameN` · `home` (the home scene's state; `NAV` in v3) ·
`hooks` (scene test hooks) · `GRID` (the exterior ray table, null until the worker finishes). · `ctx` (the scene ctx: `CARD.ctx.tier()`, `CARD.ctx.gl`) · `REG[id].scene` is the **live** scene object — its `p`,
`cast`, `rt` may be read and written from an eval (every pin in `docs/workers/polytope-dance.md` works that way).

- `CARD.fix = {bass: 1, arc: 'peak'}` pins MS fields every frame after extraction (works with `fake=0` too). `null` clears.
- `CARD.glerr` is set only when a `gl.getError()` poll (every 30 frames) returns non-zero — `undefined` means clean.
  For an immediate check evaluate `CARD.ctx.gl.getError()` (0 = clean).
- Pinning quality: `CARD.Q.q` is re-adapted every frame, so pin it with `setInterval(() => CARD.Q.q = 0.1, 16)` and
  wait longer than the scene's own smoothing (TORUS eases its tier over ~2 s; wait 8 s before the shot).
- `CARD.goScene(id, hard)` · `CARD.bench(id, n)` → ms per full-resolution render of scene id, readPixels-synced (the
  default `n` is 40 for a quick look; a number you report follows the "Bench protocol" above: `q` pinned, `n ≥ 300`,
  medians, NAV interleaved) · `CARD.benchTransition(n=300)` → the same per registered transition ("Transition" above).
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

## File source — a real track, deterministically (v0.15 E1/E2)

`tools/serve.js` serves `GET /music/<name>` from `$MUSIC` (default `~/Music/RetinaRave`), name with or without extension
(`.flac .wav .mp3 .ogg`, as `tools/truth/trackmap.py find()`); a name carrying `/`, `\` or `..` is refused 400. **The route
lives in `serve.js` and nowhere else** — `tools/bundle.js` inlines `assets/**/*.js` into one HTML file and `npm run build`
copies `site/`, so no track and no `/music/` handler can be bundled or deployed (`wrangler.jsonc` deploys `./dist`).
Nothing under `~/Music` is ever committed.

Hash: `&track=<name>` (with or without `#test`) starts the file source on the **real** extractor — it implies `fake=0`
and hides the landing card. `&at=<s>` the track second the playhead starts at (default 0) · `&det=0` / `&det=1` forces
real-time / deterministic mode (the default is deterministic exactly when cdp's `CLOCK=1` shim is present) ·
`&sync=<ms>` declares `SYNC_OFS`, added to `AU.heardT()` in capture / mic mode. `&lead=1` (live step 2, `engine/lead.js`) publishes
the beat / bar / phrase clocks moved onto heard time — `MS.leadT` = heardT − the analysers' newest audio time (+ the display lead `dispNow()`: 40 ms in file modes / demo, 0 in
capture / mic by default since 2026-09-29, `&disp=<ms>` sets both):
file-det −`DET_LEAD`, real-time file / demo the output timestamp's lag (median of 64 frames, stale timestamps dropped), capture
`SYNC_OFS` or the measured 27 ms, mic `SYNC_OFS`. The `L` key toggles it live (a toast says the lead). Off = byte-identical traces.
`&map=0` (live step 3.0, `ENGINE.useMap`) skips the file's track map: the ears stay **causal** — the live path on a file,
deterministic under `CLOCK=1` (two runs `cmp`-identical), the harness every live-mode stage is developed on. SeeYouDrop 25–45 s
with `&map=0`: kick F 0.786 (P 0.717 R 0.868), placed lag +5 ms, against the map's 1.000. With no map gate the file opens a
frame earlier, so `filetrace.js` may print "frame0 is -1" (its header eval races the first frame) — the `fileStart` log still
says frame0 2, and a window with t0 ≥ 8 s records the same frames; a t0 = 0 window starts one frame earlier (heard 0).

Two modes, and only the second is reproducible:
- **real time** (a real window, or headless without `CLOCK=1`): an `AudioBufferSourceNode` into `AU.bus` **and** into
  `ctx.destination` — a file mode is **audible** (capture mode mutes because the other tab is already heard).
- **deterministic** (`CLOCK=1`): nothing is played. The playhead is `at + (frame − frame0)/60 + DET_LEAD`, `AU.fast` /
  `AU.slow` are PCM-backed `AnalyserNode` shims (`assets/engine/shim.js`) over the decoded mono ending at it, and the
  synapse tap is fed exact 512-sample blocks on the main thread before the synapse stage. Two runs are bit-identical.

```
python3 tools/truth/trackmap.py SeeYouDrop --pcm     # tools/work/SeeYouDrop.f32 — the node tests' input
node tools/test_shim.js                              # the shims against a second implementation of the spec (PCM=1 adds the real dump)
PORT=8812 node tools/filetrace.js SeeYouDrop 0 60 tools/work/a.json          # a deterministic trace of [0, 60] s heard time
PORT=8812 node tools/filetrace.js SeeYouDrop 0 60 tools/work/b.json
cmp tools/work/a.json tools/work/b.json              # must be IDENTICAL (md5 d302a35b2bd733f68ed1a1c9109a4d9b for 0-60 s)
PORT=8812 RT=1 node tools/filetrace.js SeeYouDrop 0 60 tools/work/rt.json    # the real-time path, same recorder, mode 'file-rt'
```
`filetrace.js <track> <t0> <t1> <out.json> [fields='*'] [extraHash]` runs `CLOCK=1 GPU=1` cdp on
`#test&track=<track>&at=<t0 − WARM>&scene=0` (`WARM` 8 s of engine warm-up), records `[t0, t1]` in **heard** time and
writes the frozen JSON (`{track, mode, sr, at, fps, detLead, fields, f, t, cols, log}` — booleans 0/1, non-finite null).
It prints frames / fields / heard range / mode / `f0` / `sr` / log entries / `ENGINE.ms` / size. A 60 s `'*'` trace is
3600 frames × 113 fields ≈ **5.07 MB**, returned in 400 000-character chunks from `window.__tj` (a single CDP return that
size is not attempted; `MAX_CHUNKS` caps it at 16 MB and the driver says so rather than truncating).

### The four rules of a deterministic real-track run

1. **`frame0` is 2, always.** The source sets `window.__pauseAt = 1` before the decode and clears it when the track is
   open, so the page runs exactly one warm-up frame however long the decode takes. Without it `core/loop.js`'s `wall`
   (which advances on silence) had accumulated a different amount each run and every **screenshot** differed while the MS
   trace matched. `heardT = at + (frame − 2)/60` exactly.
2. **Release the clock with `{eval:"window.__PAUSE=0"}` or a `__FRAME` target — never `{wait}`.** cdp's `{wait}` step
   clears `window.__pauseAt` as well as `__PAUSE`, which undoes the hold.
3. **Address the window by `__FRAME`, not by a `heardT` predicate.** A general `{until}` polls every 40 ms and the fake
   clock runs hundreds of frames in the gap, so it stops at a different frame in each run.
4. **Two consecutive non-`__FRAME` `{until}`s deadlock** (the first sets `__PAUSE = 1` and only a `{wait}` or a `__FRAME`
   target clears it) — put `{eval:"window.__PAUSE=0"}` between them.

The recipe, in full — the first real-music screenshots the project has (TORUS2 at heard 103.967 / 107.967 s, around drop 2):

```
PORT=8812 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&track=SeeYouDrop&at=100&scene=3' '[{"until":"window.CARD"},{"until":"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open","timeout":300000},{"until":"window.__FRAME>=240","timeout":300000},{"shot":"file-a6-f240"},{"until":"window.__FRAME>=480","timeout":300000},{"shot":"file-a6-f480"},{"eval":"JSON.stringify({heard:CARD.MS.heardT,errs:CARD.ERRS,bad:CARD.nonFinite()})"}]'
# md5sum tools/work/file-a6-f240.jpg -> 5ac81cba6423837518b7a867b04a1aff   (GPU=1, 1280x720, heard 103.96667)
# md5sum tools/work/file-a6-f480.jpg -> 6158b70f85ddebe80210cc7f021a1d52   (heard 107.96667, arc 'peak', sectionId 2)
```

### Time — `AU.heardT()` and `AU.lat()`

The time base is "audio time" (s): **track** seconds in file mode, `AU.ctx` seconds in the live modes. `MS.heardT` (raw)
and `MS.fileOn` (0/1) carry it into MS, written by the `clock` stage before every other stage; `ENGINE.LOG` (cap 20 000,
`ENGINE.log(type, t, extra)`) stamps events in the same base and holds `fileStart` / `fileEnd`.

`AU.lat()` prints every latency number in one object: `{rate, base, out, now, ctxT, perfT, heard, state}`. Measured here
(headless, 48 kHz, 1478 frames): `outputLatency` median **0.040** s (it steps between 0.032 and 0.048), `baseLatency`
0.010667 (512 samples), and `ctx.currentTime − AU.ctxHeard()` median **0.0454** / p90 0.0504 — i.e.
`getOutputTimestamp().contextTime` **already** lags `currentTime` by the output latency, so `AU.ctxHeard()` returns the
extrapolated `contextTime` as it is and does not subtract `outputLatency` a second time. `DET_LEAD` = **0.0427** s
(= median `outputLatency` + one render quantum). **`outputLatency` is the audio device's: re-measure `AU.lat()` on any
machine whose sync numbers matter** — ITU-R BT.1359's 45 ms sound-before-picture threshold is the same size as it.

Capture-mode lag, **measured 2026-09-28** (`docs/AUDIT-live-grid.md`): **27 ms** (p10 24, p90 32; a 3 s start-up transient
reads 15–23) on this desktop, Chrome tab capture, 48 kHz. Declare it with `&sync=27` — since 2026-09-28 the hash reaches
capture mode (`core/harness.js`; before, only `startFile` applied it). It moves the ears' `…Age` placement (kick +32 → +7 ms,
snare / hat +24 → 0 ms) and nothing else: the v3 and synapse beat clocks do not read `heardT`.

```
node tools/caplag.js clicks 30                          # AUDIBLE: SYNC_OFS from a 2 kHz click train -> tools/work/caplag/clicks.json
node tools/caplag.js track SeeYouDrop 20 70 [27]        # AUDIBLE: a capture trace in LISTENER time -> tools/work/caplag/SeeYouDrop-cap[-sync27].json
python3 tools/truth/gridcheck.py <trace> [--win 22,90] [--sections] [--md out.md]   # the beat / bar / phrase clocks vs the truth grid
```
`caplag.js` is headed (`HEADED=1 CAPTITLE=RR-SRC`, set by the tool; page on monitor 0, source window at x 2760): the source
`tools/capsrc.html` plays clicks or a track through its own `AudioContext` and maps context time to the wall through
`getOutputTimestamp` (the wall time a sample is **heard**); the page maps `ctx.currentTime` to the wall per rAF and stamps
clicks on the PCM bus. SYNC_OFS = captured audio time − `currentTime` at the heard wall time. A trace's `t` is rewritten to
the track second the listener hears at that frame (`tHeardCtx` keeps the original), so `compare.py` / `gridcheck.py` grade it
as they grade a file trace. Not in any number: the frame's own path to the glass (compositor + display, 1–3 frames). The
source plays a −46 dBFS 220 Hz bed from load on so the capture watchdog never swaps the demo in; the click detector is a
0.25 s refractory over 0.15, not a quiet gate (the captured click's edge rises through any low gate first).

### The PCM bus

`ENGINE.PCM.on(fn)` → `fn(L, R, t0)` with `L`, `R` = `Float32Array(512)` and `t0` = the audio time of the block's **first**
sample. Live modes are fed by a stereo `AudioWorklet` on `AU.bus` whose stamps come from the worklet's own `currentFrame`;
deterministic file mode is fed by the source from the decoded channels. **The worklet is built lazily on the first
`PCM.on`** — with no listener there is nothing to measure. Proven over heard 58 → 90 s of SeeYouDrop: `t0` steps by
512/`sr` to within 1.3e-14 s (det) / 1.5e-14 s (real time), zero non-monotone steps and zero gaps, and side/mid energy over
60–90 s is 0.218542 (det) vs 0.218494 (real time) — `L ≠ R`, and both paths agree on how much.

```
PORT=8812 CLOCK=1 GPU=1 node tools/cdp.js 'test&track=SeeYouDrop&at=58&scene=0' '[{"until":"window.CARD"},{"eval":"window.__P={n:0,last:null,dmax:-1e9,dmin:1e9};CARD.ENGINE.PCM.on(function(L,R,t0){var P=window.__P;if(t0<0)return;P.n++;if(P.last!==null){var d=t0-P.last;if(d>P.dmax)P.dmax=d;if(d<P.dmin)P.dmin=d;}P.last=t0;});1"},{"until":"CARD.ENGINE.AU.file&&CARD.ENGINE.AU.file.open","timeout":300000},{"until":"window.__FRAME>=1922","timeout":600000},{"eval":"JSON.stringify({blocks:window.__P.n,step:512/CARD.ENGINE.AU.file.sr,dmax:window.__P.dmax,dmin:window.__P.dmin})"}]'
```

### The landing control ("play a file from this device")

`index.html` carries `<a id="pickfile">` in the `.alt` row and a hidden `<input type="file" accept="audio/*" id="file">`;
`core/landing.js` `initFile()` wires the link to the input and adds drag-and-drop on the whole card (`#landing.drag` is the
hover cue). The file is decoded in the page (`File.arrayBuffer` → `decodeAudioData`) — **nothing is uploaded**. `cdp.js`
has no step for `DOM.setFileInputFiles`, so `tools/setfile.mjs` does it from a `{sh:…}` step (which gets `DBG` = the debug
port); the drop path needs no helper, a real `DragEvent` with a `DataTransfer` from an `{eval}` is the genuine event.

```
PORT=8812 GPU=1 node tools/cdp.js real '[{"until":"window.CARD"},{"wait":600},{"sh":"node tools/setfile.mjs /home/toma/Music/RetinaRave/SeeYouDrop.flac \"#file\""},{"wait":4000},{"eval":"JSON.stringify({mode:CARD.ENGINE.AU.mode,name:CARD.ENGINE.AU.file.name,presence:CARD.MS.presence,hidden:document.getElementById(\"landing\").classList.contains(\"hide\"),errs:CARD.ERRS})"}]'
# => mode 'file', name 'SeeYouDrop.flac', presence 1, hidden true, errs []          (the drop path: see docs/workers/file.md (e))
```

### What to re-prove after a change to the file source, the shims, the PCM bus or the trace

`node tools/check.js` · `npm test` · `node tools/test_shim.js` · two `filetrace.js` runs + `cmp` · `node tools/parity.js
fake` (0 diff — `heardT` and `fileOn` show as "missing in v3" **info**, never a diff) · `tools/scene-md5.sh` full list
against `tools/accept/v0.34/scene-md5-v034.txt` (the list `accept.sh` reads, §83; v0.34 = §97's NAV2 re-base) · the mixs md5 ("Transition") · the bundle. Nothing in the file path runs
on the fake timeline, so a scene's pixels cannot move — but the `clock` stage runs in every mode, which is what the md5
list and the parity run are checking.

## Bars — the bar fingerprint store (live step 3; change to `engine/bars/`, `features-bars.js`, or anything it reads)

Develop on the **causal** path: `&map=0` (the file's ears stay causal) and `&lead=0` (the trace's clocks are then the raw ones
the stage sees; the stage's own output does not depend on the lead — 0 frames differ). Record the stage's inputs once, then
replay the store in node in seconds and grade it:

```
F=$(node tools/bars-replay.js --fields)                                    # heardT, leadT + bars/feed.js FEED_IN
PORT=8851 node tools/filetrace.js SeeYouDrop 0 157.4 tools/work/in-syd.json "$F" '&map=0&lead=0'
node tools/bars-replay.js tools/work/in-syd.json tools/work/out-syd.json   # prints µs/frame; the page's run agrees on
python3 tools/truth/predcheck.py tools/work/out-syd.json [--win 25.6,44.8] [--conf 0.5] [--md out.md]   # 9442/9444 event frames
python3 tools/truth/predcheck.py --self-test
node tools/test_bars.js                                                     # in npm test: the synthetic loop / change / return
FIELDSX='predKickEvt,predSnareEvt,predHatEvt,predConf,barNovelEvt,barReturnEvt,sectionAlt,sectionReturn' \
  node tools/caplag.js track SeeYouDrop 20 70 27                            # AUDIBLE: the live confirmation (…-cap-sync27-fx.json)
```
**Warm-up** (the first bars after a cold start): `tools/warm-rec.sh` (~7 min: SeeYouDrop + CyborgNinja, whole + four `WARM=0`
cold starts each → `tools/work/warm/`), then `tools/warm-ruler.sh [tag]` after every store change (seconds; replays into
`tools/work/warm-<tag>/`, prints `warmcheck.py`'s rows). `predcheck.py --bins 8 <traces…>` = P / lag per 8 s since each
trace's start; `warmcheck.py --clock cold.json:whole.json:t0` = the v3 clock cold vs warm; `bars-replay.js --from s --diag d.json`.
A **lead-on** trace (real-time file `RT=1`, or a capture with `FIELDSX=$(node tools/bars-replay.js --fields)`) replays too: the
raw clocks are rebuilt from `leadT` (page = replay on 57/57 kicks). `--set GATE=1,OFF_WIN=24,…` tunes `bars.js` `WARM`.
The replay reads the trace's `-detLead` as `LEAD.L` (file-det). A replay starting later than the page's first frame lacks that
history (a t0 = 8 trace misses the 8 s warm-up), so `predConf` drifts while the events agree to a few frames. A lone
`serve.js` left on a port by a killed run can hang the next `filetrace.js` on that port at "file open" (300 s timeout, then
the demo) — use a fresh `PORT` or kill it. Rows: `tools/accept/live-grid/*-bars-*.md`.

The A/B the user watches (no scene edit — routes, CONTRACTS §1.15; a normal page: the routes panel `P` or `CARD.route`):
`#test&track=SeeYouDrop&map=0&scene=3&route=torus2.kick=predKick,torus2.snare=predSnare,torus2.hat=predHat` (TORUS2's wave +
core flash on the predicted hits; drop the `route=` for the reactive synapse levels), and for CHLADNI's ballistic sand
`&scene=11&route=chladni.kickEvt=predKickEvt,chladni.kickAge=predKickAge,chladni.snareAge=predSnareAge,chladni.hatAge=predHatAge`.

## Drums — the reactive drums v2 (`engine/drums/`, `features-drums.js`, or the ears' low lane)

```
python3 tools/truth/trackmap.py <Track> --pcm --sr=48000       # once per track (tools/work/<Track>.48000.st.f32)
node tools/drums-node.js [Track …] [--out dir] [--set S0=0.2,G=2.5,HOLD=0] [--perc thrK=2.5]   # seconds per track; runs the PCM clock beside the ears since §90 (the kick lane reads its line)
PERCK='{"lineKick":0}' node tools/drums-node.js IBelongHere                       # the kick lane's knobs on the FIRST ears instance (perc.js PERCK, §90): lineKick 0 = the §68 lane, lineSub 2 = the 8th line too, linePh / lineConf the gate, clickW / clickFloor the beater gate (= &kline= / &clickw= on the page)
python3 tools/work/v90/kickwin.py tools/work/drums/node-IBelongHere.json            # per-window kick-lane hits on the .kick.json truth at ±60 ms (the IBELONGHERE doc's rule); linesim.py simulates the line rule offline on a base trace + a clock-study trace
python3 tools/truth/drumcheck.py tools/work/drums/node-*.json [--src syn,ears,v2] [--tol 0.03]
python3 tools/truth/kicktruth.py [Track …] [--rise 4.0] [--sweep]  # -> tools/truth/<T>.kick.json, the KICK reference
node tools/test_drums.js                                          # in npm test (incl. the §68 synthetic masked kick)
```
**The kick has FOUR references now** (§68). `drumcheck.py` grades it against the truth's `low` (40-150 Hz: kicks AND 808
note starts), its `click` (kicks with a beater) and — when `tools/truth/<T>.kick.json` has been built — `kick`, the
OFFLINE 60-150 Hz rise at the truth beat grid's 16th lines. The fourth one exists because `low` is itself a 40-150 Hz
level picker, and on Vienna that band IS the 38-46 Hz 808 drone: `low` lists 2.46 onsets/s where the groove has 1.74
kicks/s. The reference is validated where `click` is trustworthy — it reproduces CyborgNinja's `click` at P 0.99 / R 0.89
and §66's own Vienna hand-grid list at P 0.96 / R 0.92. A one-track scene-side view: `python3 tools/work/v68/dustkick.py
tools/work/v68/dust/after-Vienna.json` grades DUST's kick VOICE (its `d_fK` steps) against the same list.
The node run = the page's det run (`kick2` identical frame by frame). TORUS2 reads v2 by default (2026-09-29); its old look for an A/B: `#test&track=SeeYouDrop&scene=3&route=torus2.kick2=kick,torus2.snare2=snare,torus2.hat2=hat`. A capture run: `FIELDSX='kick2,snare2,hat2' node tools/caplag.js track SeeYouDrop 24 50 27`
(AUDIBLE; `kick` / `snare` / `hat` are already in caplag's FIELDS — naming them again doubles their columns).

## Build — the build-up / drop ruler (live step 4; a change to anything that says "a drop is coming")

```
tools/build-rec.sh [outdir=tools/work/build]      # ~12 min, two lanes (PORTA 8831 / PORTB 8832): per track the whole track, det,
                                                  # &lead=0, twice — &map=0 (the causal path) and &map=1 (the file map, the ceiling)
cd tools/work/build && python3 ../../truth/dropcheck.py SeeYouDrop-map0.json WhoLikesToParty-map0.json Malicious-map0.json \
  CyborgNinja-map0.json SeeYouDrop-map1.json WhoLikesToParty-map1.json Malicious-map1.json CyborgNinja-map1.json --summary [--md out.md]
python3 tools/truth/dropcheck.py <trace.json> [--rule 'build>=0.5' --rule 'toDrop<=16' --rule 'dropEvt:evt']   # per trace, per rule
python3 tools/truth/dropcheck.py --selftest
```
A rule arms a field: `f>=x` (a level), `f<=n` (a count-down in beats, negative = none), `f:evt` (an event). Per truth drop:
the anticipation (beats the run live at the drop has been armed; gaps ≤ 1 beat bridged, the run may end 1 beat early), a
count-down's pointing error, an event's lag (±2 beats); false arms / min = onsets with no drop within 16 bars; armed % and
a chance hit rate (the mask circularly shifted). `--summary` pools the tracks (drops in trace order: SeeYouDrop ×2,
WhoLikesToParty ×3, Malicious ×1; CyborgNinja = the false-alarm control) and takes each map rule from the `&map=1` trace.
MS `tension` is v3's roughness; synapse's own tension and drop event are not in MS (the node harness below has them).

**The fast loop (node, seconds per track):** synapse's Analyzer behind its own Tap + the causal ears + v3's `updateMusic` on the
det analyser shims, on the page's det time base (`tools/node-stream.js`, shared with drums-node) — page = node on the ears
(`&map=0`), synapse's anatomy and v3's build / drop (AUDIT-live-grid Step 4 B.1). One process per track (v3's MS is a module
singleton; the multi-track call spawns them).
```
node tools/build-node.js [Track …] [--out tools/work/build] [--no-v3]        # -> node-<Track>.json, 80 fields, 6-9 s a track
node tools/build-node.js --cmp tools/work/build/SeeYouDrop-map0.json tools/work/build/node-SeeYouDrop.json [fields]   # page = node
python3 tools/truth/dropcheck.py tools/work/build/node-{SeeYouDrop,WhoLikesToParty,Malicious,CyborgNinja}.json --summary
python3 tools/truth/buildstudy.py tools/work/build/node-{SeeYouDrop,WhoLikesToParty,Malicious,CyborgNinja}.json [--pre 4] [--sig] [--png dir] [--md out.md]
python3 tools/truth/buildstudy.py tools/work/build/node-{SeeYouDrop,WhoLikesToParty,Malicious,CyborgNinja}.json --arms
```
Node-only names: `synTension` (synapse's tension), `synDropEvt` / `synFakeoutEvt` / `synBoundaryEvt`, `synAll` (ev.all),
`synEvS`, `rollRate`, `kickGap`, `bShort` / `bLong`, `dens`, `arcN` (v3's arc: idle 0 valley 1 sustain 2 build 3 peak 4).
v3's `beatCount` in node = the page's + 1 (the page's pre-roll frames); the phase agrees to 0.01 beat.

**The live build stage in node (B.2, `engine/build`):** `build-node.js` also runs the detector exactly as `features-build.js`
feeds it (v3's count − 1 = the page's, the lead −DET_LEAD, the ears' low lane) and records `buildLive` / `dropLiveIn` /
`dropLiveEvt` plus its inputs (`lowT`: the low onsets taken each frame); `--disp <ms>` is the display lead the onsets are taken
ahead by (0 = the `&lead=0` page, 40 = the default file page); `BUILDK='{"RET":1.6}'` overrides knobs for one run. Its SECOND
arming path (the sub void, §64) reads the ears' CAUSAL `subGate` — the page passes `EARS.ears.out.subGate` to `feed()` because
`MS.subGate` is the file map's when a map is ready, and node / the replay take it from the trace, where it is already causal;
its knobs are `SUBV_OFF` / `SUBV_HOLD` / `SUBV_RET` and `SUBV_OFF=0` turns the path off (§54's detector exactly). Its THIRD
arming path (the ambiguity, §77) reads the tongues' `tongueAmbig` / `tongueOn` (§76) — `build-node.js` attaches the bank to its
clock and records both columns, the replay takes them from the trace, `AMB_ARM=0` turns the path off (a trace without the
columns is inert). The knob sweep replays the recorded inputs instead (< 1 s a track; replay = node = page):
```
node tools/build-node.js --out tools/work/build [--disp 40]                                   # node-<Track>.json with the stage
node tools/build-replay.js tools/work/build/node-*.json [--set RET=1.6,SUB_RET=0] [--out dir]  # -> rp-<Track>.json + dropcheck rows
node tools/build-replay.js --sweep tools/work/build/node-*.json                                 # each knob one step either side
python3 tools/truth/dropcheck.py <traces> --summary --rule 'buildLive>=0.4' --rule 'dropLiveIn<=16' --rule 'dropLiveEvt:evt'
node tools/test_build.js                                                                        # the unit test (in npm test)
```
Vienna is the fifth track in the set since §64 (`tools/truth/Vienna.json`): its `drops` is the HAND list (85.3359 / 106.6693,
the user's own bar 32 and bar 40) and `drops_tool` keeps trackmap.py's automatic 105.639. `build-replay.js` sorts it last, so
the pooled drop order is SeeYouDrop ×2 · WhoLikesToParty ×3 · Malicious ×1 · Vienna ×2.
Page traces of the new fields: `filetrace.js <Track> 0 <dur> out.json 'heardT,…,buildLive,dropLiveIn,dropLiveEvt' '&map=0&lead=0'`
(the causal path, `dispNow()` 0 — compare with a `--disp 0` node run: `build-node.js --cmp page.json node.json buildLive,dropLiveIn,dropLiveEvt`).
The stream-mode A/B is a ROUTE, set live on the running page (never under `#test`: its card is hidden, so no capture can start):
open `http://127.0.0.1:8765/`, key `1` (NAV), Share a tab, then in the console `CARD.routes('nav.buildLive=build,nav.dropLiveEvt=dropEvt')`
= the v3 look (NAV reads the live detector by default since 2026-09-29 — "B looks good", "#1"), `CARD.clearRoutes('nav')` = the default (or the panel: key `p`, NAV's build / dropEvt rows — that one is stored in localStorage:
"reset scene" after). Headless, the route itself is provable on the real page (`PORT=8845 FAKECAP=1 NOAUTO=1 GPU=1 node tools/cdp.js real '[{"until":"window.CARD"},
{"clickSel":"#go"},…]'` then `CARD.fix={buildLive:0.7,dropLiveEvt:true}`, `CARD.routes(…)` → `CARD.view('nav').build` 0.7, `dropEvt` true,
`localStorage` untouched; `CARD.clearRoutes('nav')` → `MS.build` again) — but headless Chrome never resolves `getDisplayMedia`
(FAKECAP or not: `AU.mode` 'none', then 'demo' as "declined"), so capture mode itself is only proved HEADED (`tools/caplag.js`).

## Queue — the predicted-event queue (live step 5; a change to `engine/queue/`, `features-queue.js`, `Bars.upcoming`, or anything a scene reads as "what comes next")

One list, rebuilt every frame from the other stages' decisions: `ENGINE.QUEUE.list` / `CARD.QUEUE` = `[{ cls: 'beat' | 'bar' |
'kick' | 'snare' | 'hat' | 'drop', t: heard s (net of the display lead), conf }]` by `t`; MS carries numbers only — `nextBeatIn`,
`nextBarIn`, `nextKickIn` / `nextSnareIn` / `nextHatIn`, `nextDropIn` (s to the next entry, −1 = none inside 2 bars), `next<Cls>Conf`,
`next<Cls>Up` (the wind-up 0 → 1 over the last 0.25 s: the route-friendly form) and `queueN`. Develop on the causal path (`&map=0&lead=0`,
`dispNow()` 0), in node first:
```
node tools/build-node.js [Track …] [--out dir] [--disp 40]        # runs the bars store + the queue too (QUEUEK='{"HOLD":0}' overrides a knob)
python3 tools/truth/queuecheck.py tools/work/build/node-*.json [--rows kick,snare,hat,beat,bar,drop] [--win a,b] [--md out.md]
python3 tools/truth/queuecheck.py --selftest                       # 17 checks on synthetic count-downs
node tools/test_queue.js                                          # in npm test: order, the count-down, HOLD, flushes, the drop entry, Bars.upcoming = release()
```
`queuecheck.py` grades a count-down by its ROLL-OVERS (the last frame of an entry, v < 1.5 frames, predicts the event at t + v): P / R / F
±30 ms against the truth onsets (kick = `click`, snare = `mid`, hat = `high`, beat = `beats`, bar = `downbeats`, drop = `drops`), the lag,
a chance F (the arrivals circularly shifted), the HORIZON delivered (s before the hit the field first pointed at it — capped by the class's
inter-onset interval, a "next" field never sees past the hit before), and the JUMP RATE per live minute (frames where v moved by other than
one frame's worth ± 10 ms), split into roll-overs (legit) / withdraws / inserts / jitter; the drop through `dropcheck.py`'s `grade_level`.
The baselines it grades from the same trace: `predKickIn` (beats → s at `bpm`; no class offset — its kick reads −18 ms), `beatPhase` (the
clock moved by `leadT`, or −`detLead` on a det / node trace with the lead off), `dropLiveIn`.
Page traces: `PORT=8850 node tools/filetrace.js <Track> 0 <dur> out.json 'heardT,leadT,beatCount,beatPhase,bpm,presence,predKickIn,…,nextBeatIn,
nextBarIn,nextKickIn,nextSnareIn,nextHatIn,nextDropIn,nextKickConf,nextSnareConf,nextHatConf,nextKickUp,nextSnareUp,nextHatUp,queueN' '&map=0&lead=0'`.
Page = node: `nextBeatIn` is a pure function of the trace's own clock (`(ceil(B) − B) / bps`, B = beatCount + beatPhase − detLead·bps: 1e-14),
`nextDropIn` = `dropLiveIn / bps` outside the detector's ⅛-beat hold after a line; the hits follow the store (within 20 ms on 97 % of frames;
the rest is the confidence gate at its threshold, as `predKickEvt` page vs node). A lead-on trace (capture) reads the same way: `t` is
heard time and `next*In` is already net of `dispNow()`.

The A/B the user watches is a PARAM route (CONTRACTS §1.16), set live on the running page (never under `#test`: no capture button):
open `http://127.0.0.1:8765/`, key `4` (TORUS2), Share a tab, then in the console
`CARD.params('torus2.wave=nextKickUp*0.35+0.65')` = B (the wave depth winds up 0.26 → 0.40 over the 250 ms before each predicted kick, the default
0.26 in between; the transfer works in the parameter's unit interval, range [0, 0.4]) and `CARD.clearParams('torus2')` = A (the default
`WAVE0 + 0.1·kick2`). Nothing stored (the panel `p` stores its preset). `~0.05` on the spec smooths the fall after the hit. Headless the route is provable on the real
page: `CARD.fix = { nextKickUp: 0.5 }` → `CARD.paramsOf('torus2').wave` 0.33 routed (0.4 · clamp01(0.35 · 0.5 + 0.65)), the derived value
after the clear — TORUS2 must be on screen (its `update()` refreshes `env.params`). A capture run: `FIELDSX='nextBeatIn,nextKickIn,nextSnareIn,
nextHatIn,nextDropIn,nextKickConf,nextKickUp,predKickIn,buildLive,dropLiveIn,queueN' node tools/caplag.js track SeeYouDrop 0 110 27` (AUDIBLE;
`beatPhase`, `beat`, `bpm`, `leadT`, `kickEvt` … are already in caplag's FIELDS — naming them again doubles their columns).

## Loudness — the BS.1770 ruler (`tools/truth/trackmap.py --loud`, `assets/engine/loud.js`, `features-loud.js`)

"How loud does this sound" has one measure with a standard behind it — **ITU-R BS.1770-4 K-weighting** (a +4 dB high shelf,
then an RLB high-pass, per channel, and a mean square: `L = −0.691 + 10·log10(Σ_ch mean(y_ch²))`, `G_L = G_R = 1`) — and the
engine's AGC-normalised energies (`eM`, `eS`, `lvl`, `eMax`) actively lie about it: on SeeYouDrop's breakdown 2 → drop 2 pair
`eM` reads ×0.994 where the music is **+2.88 LU louder** (DECISIONS §63). The OFFLINE reference is `--loud`; the engine's
causal copy of the same measure is the `loud` stage.

```
python3 tools/truth/trackmap.py SeeYouDrop --loud            # -> tools/truth/SeeYouDrop.loud.json + the section ladder
python3 tools/truth/trackmap.py Vienna --loud --loud-out=tools/work [--loud-win=5.1]
node tools/test_loud.js                                     # in npm test: the stage against the spec (synthetic only, ~1 s)
node tools/test_loud.js --truth                              # + the five tracks: the stage against <name>.loud.json, and the
                                                             #   truth-graded breakdown -> drop ratios (needs the --pcm dumps)
python3 tools/truth/trackmap.py <Track> --pcm --sr=48000      # the dumps --truth reads (tools/work/<Track>.48000.st.f32)
```
**`--pcm` is not a dump switch — it runs the FULL analysis and REWRITES `tools/truth/<Track>.json`.** It cost this
project the Vienna worker's uncommitted provisional truth once (DECISIONS §63 phase 1): never run the truth tool on a
track somebody is annotating; the dumps for all five tracks are already in `tools/work/`. Since §72 a HAND annotation
does survive a re-run — `bpm_grid.hand` and the top-level `sections_hand` / `drops_hand` / `drops_user*` / `drops_tool` /
`drops_note` / `provisional` / `notes` / `feel` are carried over from the file on disk, never recomputed — but
everything the tool DOES compute is still overwritten, so the rule stands. `--loud` is safe — it writes
its own file and reads `<name>.json` without touching it.
`--loud` runs **only** the loudness analysis: it reads `tools/truth/<name>.json` (sections, drops) and writes
`<name>.loud.json` — it never rewrites `<name>.json`, so it is safe on a track another worker is annotating (`--loud-out=`
puts the file elsewhere). The JSON carries the whole momentary (400 ms) and short-term (3 s) contours on a 10 ms hop
(`contour.mom` / `contour.short`, `null` where the window is not yet full), the gated integrated loudness, the section
ladder and, per bar-pinned drop, the equal-window breakdown/drop pair. The 48 kHz biquads are the spec's table; every other
rate comes from the same bilinear recipe, which reproduces that table to **9e-16** (asserted in both the python and the node
tool). Measured (2026-09-30): SeeYouDrop integrates to **−3.88 LKFS**, CyborgNinja −9.05, WhoLikesToParty −10.03,
Malicious −12.46, Vienna −6.89; short-term p95−p10 4.96 / 1.37 / 2.86 / 7.82 / 3.25 LU.

In the page the fields are `loudM` `loudS` `loudPk` `loudRel` `loudRange` `loudAbs` (Appendix A). **`loudRel` is the one a
scene reads**: it is a difference of two loudnesses, so a constant gain cancels and it behaves identically in file and
capture mode, where `loudM` / `loudS` / `loudPk` are only as absolute as the tab's own mixer (`loudAbs` = 1 absolute,
0 relative, −1 the stage is off). `&loud=0` turns the stage off and every migrated scene falls back to the `lvl` formula it
had before — the A/B, and the receipt that the migration is the only thing that moved (the `#test` md5 list under `&loud=0`
is the pre-migration list, line for line).

**The peak hold waits for a full window** (§67). `loudM` / `loudS` are answered from whatever the stream has, which is the
honest causal answer; the hold and the range histogram are recursive and attack only once there are 3 s behind `t`, because
an instant attack fed a 32-sample "3 s" window is a SEED and a 0.02 LU/s release needs minutes to undo it. SeeYouDrop's file
starts on a transient and paid 1.46 LU of `loudPk` — 0.21 of every base light — for its whole length before this. If a
scene's base light looks wrong on a file whose first block is loud, this is the shape of the bug: check `loudPk` against
`node tools/test_loud.js --truth`'s per-track true maximum, and `tools/test_loud.js`'s `transient` case is the regression.

## Clock — the beat clock on the PCM bus (live step 6; a change to `engine/clock/`, `features-clock.js`, the ears' onsets, or anything that reads `bpm` / `beatPhase` / `beat` / `beatCount`)

Two beat clocks publish every frame: v3's (`bpm` / `beatPhase` / `beat` / `beatCount` — the PLL on the frame-rate flux, the default until 2026-09-30 — the PCM clock is the default since §56 addendum 3; `&clock=v3` brings v3's back
every scene reads) and the PCM clock's (`bpmPcm` / `beatPhasePcm` / `beatPcm` / `beatCountPcm` / `clockConfPcm` — tempo.js's comb on a
per-hop spectral flux of the PCM bus, the ears' sample-timed onsets as ticks, a Kalman filter on (beat position, rate); `engine/clock/`).
Both are published on the lead's time base (heard time + the display lead; the raw analysis time under `&lead=0`), so their beat lines
compare frame for frame — the PCM clock at heard time SMOOTHED onto the frame clock (`now` + a 64-frame median of heardT − now: in capture
heardT steps in render blocks, 10.7 / 21.3 ms per frame, and a clock that follows it steps on the glass; §56 addendum). **The switch:** `&clock=pcm` under `#test`, `CARD.setClock('pcm' | 'v3')` live (`CARD.clock` reads it, `clockPcm`
in MS says it) makes `bpm` / `beatPhase` / `beat` / `beatCount` publish the PCM clock's RAW values before the bars / drums / build / queue
stages and the lead, so everything downstream — every scene included — rides it; v3's own values come back at the next frame
(`ENGINE.restores`), so its PLL never sees the swap. Default `'v3'` (a default moves only on the user's word).
```
node tools/test_clock.js                                                   # in npm test: synthetic clicks — lock, phase, ramp, gap, outlier, lattice, band, band flip, determinism
node tools/clock-study.js <Track> [--out f.json] [--raw]                   # node, the det time base: both clocks on heard time + every onset in `log`; CLOCKK='{"R_ON":1e-3}' knobs
python3 tools/work/v90/clk.py study.json [--win 42,52 59,65] [--bpm 5,17] [--md5]   # §90: per-window beat-line lag med / sd / |p90| / within ±30 / bpm / conf / y1 against the truth beats, the lock (8 lines within 30 ms), the BPM trace per 0.5 s, a cols md5 for a byte-check
CLOCKK='{"SW_Y1":0.3}' node tools/work/v90/combdbg.mjs IBelongHere 17              # §90: every comb estimate of a cold start — held / comb bpm, y1, contrast, cur / best, the ACF at 4/3 L / 3/4 L / 2L, the low-band share, the PDA rate, the switch vote
CLOCKK='{"HOLD_Y1":0,"R_Y1":0,"RATE_Y1":0}' node tools/clock-study.js IBelongHere     # §90's kick-less-passage knobs OFF (= &holdy1=0&ry1=0&ratey1=0 on the page); SW_Y1 (the cold-switch strength gate) is 0 by default — measured and rejected
node tools/build-node.js [Track …] [--out dir]                             # runs the clock too; CLOCKSRC=pcm = the page's &clock=pcm (bars / build / queue ride it)
python3 tools/truth/gridcheck.py <trace> --heard                           # the 'pcm' rows beside v3's: tempo %, lag, jitter, beat F, lock, frame-to-frame |dlag|, clockConfPcm on / off the beat
PORT=8864 node tools/filetrace.js <Track> 0 <dur> out.json 'heardT,leadT,bpm,beatPhase,beat,beatCount,bpmPcm,beatPhasePcm,beatPcm,beatCountPcm,clockConfPcm,clockPcm,…' '&map=0&lead=0[&clock=pcm]'
CLOCKK='{"LAT_MARG":1e9}' PORT=8864 node tools/filetrace.js …              # the page with one knob overridden (ENGINE.CLOCK.K, set before the audio opens): a one-knob engine A/B is one run each, not two trees (§59)
node tools/build-node.js --cmp page.json node.json bpmPcm,beatPhasePcm,beatCountPcm,beatPcm,predKickIn,nextKickIn   # page = node
```
**Page = node has one more wire since §90:** every node tool that runs the ears beside a `Clock` attaches `ears.perc.line = lineHook(clk)`
(clock.js) so the kick lane's clock-line rule runs there as on the page (features-clock.js), and the clock's feed loop skips a
line-promoted kick (`e.line`) — the five tools (`drums-node`, `clock-study`, `build-node`, `tongues-node`, `tongues-cold`) carry
both lines; a new tool must too, or its `kickEvt` is not the page's.
`gridcheck.py --heard` (a det / node trace recorded with the lead off carries the RAW clocks, `detLead` before heard time): moves v3's and the
PCM clock's beat position by −detLead at their own tempo — the lead's rule under `&disp=0` — so the lag rows read each clock's own error
on heard time (0 = the truth beat) and the lock rows work. Page = node: the PCM fields agree to 2.4e-4 (`beatPhasePcm`), and under the
switch `predKickIn` / `nextKickIn` to 5e-5 (the v3 path itself differs page / node in its first seconds — pre-existing, B.1). The cost:
`CARD.ENGINE.CLOCK.cpuTotal / CARD.ENGINE.frameN` (ms per frame the PCM listener spent: the FFT per hop + the filter). Knobs:
`CARD.ENGINE.CLOCK.K` (= `CLOCK` in `engine/clock/clock.js`; the sweep in AUDIT-live-grid Step 6 T.2). **The half-beat lattice is the
LOW BAND's call** (§59, `lattice()`): the 40–150 Hz flux at the clock's line against the same window at its half-beat, leaked over 90 s, and
the line moves forward half a beat when the half-beat wins by `LAT_MARG` for `LAT_SUS` of net time — the comb line's own vote may not move
the line onto a lattice that check has ruled against. It only counts evidence while `per.clear` and a `reseat()` throws the evidence away:
cold, the Kalman rate is a guess (5 BPM two seconds in) and every hop then falls in one window. Pitfall: the comb line's
lattice vote must be near-unanimous (7 of 8 four-second windows) — 3 consecutive flipped CyborgNinja between its two kick lattices
four times in 40 s; and `R_LINE` off loses 20–65 ms on two tracks (the onsets alone cannot pick a lattice).

## Tongues — the circle-map phase-locking descriptor on the PCM clock (DECISIONS §76; a change to `engine/clock/tongues.js`, `features-tongues.js`, the clock's band fluxes, or anything that reads a `tongue*` field)

`engine/clock/tongues.js` is pure and fed inside `Clock.hop()` (clock.js) when a `Tongues` is attached — `features-clock.js`
attaches one to every new Clock while `TONGUEK.on`, `features-tongues.js` only publishes. So the bank runs in node wherever the
clock does, and the det page equals node hop for hop (the first hop already feeds it).
```
node tools/test_tongues.js                                                 # in npm test: synthetic click trains — 1:1, 2:1, the 2.46 dB accent at K 0.5 / 1 / 2, swing, silence, a re-seat, determinism
node tools/tongues-node.js [Track …] [--out tools/work/tongues] [--md out.md] [--amb 0.9]   # node, the det time base: the twelve fields per frame (node-<Track>.json) + per clock beat (`beats`), and the probe's table
TONGUEK='{"K":2}' node tools/tongues-node.js Vienna                        # one knob (= TONGUEK in tongues.js; CLOCKK still takes the clock's)
node tools/tongues-cold.js [Track …] [--starts 10,25,…] [--md out.md]        # the cold-start table (§76a): 10 starts a track, the lattice landed on, lock s, lag p50 / p90, within 30 ms, lattice moves
CLOCKK='{"LAT_SRC":"tongue"}' node tools/tongues-cold.js                     # the same with the clock's lattice decision read from the bank (the knob; default 'low' = §59)
PORT=8920 node tools/filetrace.js <Track> 0 60 out.json 'heardT,bpmPcm,beatCountPcm,tongueP,tongueQ,tongueDepth,tongueK,tongueAmbig,tongue11,tongue21,tongue41,tongueLat,tongueLatConf,swing,tongueOn' '&map=0&lead=0'
node tools/build-node.js --cmp page.json tools/work/tongues/node-<Track>.json tongue11,tongue21,tongue41,tongueAmbig,tongueLat,tongueLatConf,tongueDepth,swing,tongueOn   # page = node
python3 tools/truth/tongues/env.py && python3 tools/truth/tongues/probe.py --md tools/work/tongues/probe-K1.md              # the plan's TRUTH-centred probe (the target table)
```
`tongues-node.js`'s table is the probe's table re-taken on the CLOCK-centred bank (the one thing the probe did not do): the
medians over the full windows from 8 s, the Ω = 1 oscillator's lock phase at the TRUTH beats, the ambiguity runs (≥ 8 beats of
`tongueAmbig ≥ --amb`), the first full window, and the bank's own µs per hop (the clock's FFT excluded). `tongueDepth` in the
node trace carries the page's per-frame ease; `tongue11` is the raw per-beat depth. The switch: `&tongues=0` (no bank runs,
`tongueOn` −1). Pitfall: a clock re-seat or a lattice move clears the windows (`tongueOn` 0 for 16 beats) — a trace that reads
0 mid-track is the clock moving, not the bank failing; `tools/clock-study.js`'s `jumps` says when. A SCENE that reads a tongue
field is graded with `tools/dust-trace.js` **with the engine started at 0:00** (`WARM=<t0>`): the bank's depths need 16 beats
plus a warm normaliser, and a window that starts the engine cold inside the track (the default WARM 8) is not what the user's
play button does (§78 found CyborgNinja's cold start reading two false accents that way).

## Scene ruler on a real track — `tools/dust-trace.js` (a scene edit whose point is the SYNC, v0.20+ / DECISIONS §57)

`filetrace.js` records MS, and MS says nothing about what a SCENE did with it; `probe.js` reads the canvas but needs a
real window. `dust-trace.js` is the two of them on the deterministic file path — it forces the scene, registers its own
rAF after the loop's (so it runs once the frame is drawn AND composited) and records per frame the composited
framebuffer's mean luminance (`lum`, plus the centre 20 % `lumC`, the 25–55 % body `lumM` and the 60–90 % rim `lumR`),
the named MS fields, and every number of the scene's own `hooks.dinfo()`:

```
PORT=8880 WARM=20 node tools/dust-trace.js SeeYouDrop 20 110 tools/work/d/syd-after.json 1
python3 tools/work/d/an.py tools/work/d/syd-{before,after}.json     # the DUST overhaul's own reader
```
`WARM` is the engine warm-up before the window (default 8 s) — **the live build detector needs 32 s of music before it
can arm anything** (§54), so a window that is meant to show `buildLive` starts the page at `at` 0: `WARM=20` for a
window at 20 s. The output is the `{track, mode, at, fps, fields, f, t, cols}` shape `tools/truth/*.py` read. The
recorder costs a `readPixels` per frame (a centred half of the buffer): 90 s of track is ~3 min of wall clock, so
**never bench beside one** — the interleaved NAV ratio is the only number that survives it.

A scene that wants columns exports `hooks.dinfo()` returning a flat object of numbers; it must not mutate (CONTRACTS
§1.4). The tool passes the eval blocks to `cdp.js` as ONE line: cdp logs `EVAL <expr.slice(0,60)> => <value>`, so a
newline inside the first 60 characters splits the log line and the driver can no longer find the value.  The same rule
bites the recorder's own source: a `//` comment inside the installed block swallows the rest of it once it is flattened.

**Grade against the TRUTH, not against a detector** (DECISIONS §58): the lag of a scene's response is the time from a
`tools/truth/<track>.json` onset (`onsets.low` / `mid` / `high`) or beat to the frame the scene's own envelope moves, and
the coverage is the share of those onsets that get a response at all. Reading one detector's age at another detector's
edge measures the distance between two pickers, not a latency — the mistake §57 made and §58 corrected.

A scene may add a test hook to hold a state still for the ruler — DUST's `&form=<k>` pins the formation, because on
SeeYouDrop three of its four shapes are on screen for seconds and the fourth for 76 of 90 s. Two more kinds of hook
earn their place: one that **restores the previous behaviour exactly**, so the A/B is one build and not two
(DUST's `&hab=0` is bit-identical to the commit before it over 5401 frames), and one that **pins a slow state for a
bench**, because `CARD.bench` runs on the fake timeline and a scene whose cost depends on the music will be
measured at the fake timeline's own value (DUST's `&dyn=<v>`: the fake `eM` is 0.374, which put the grains at 73 %
of their size). A third kind: one that **hands the user the knob the measurement landed on**, so the A/B is theirs and
not a rebuild — DUST's `&nudge=<glide>,<width>` (§61) and `&bed=<ratio>,<seconds>` (§64, the hat's swell veto; `99`
turns it off), both also callable as `CARD.REG[1].scene.hooks.<name>(…)` from the console on a live page.

**MANDALA's columns (id 2, `&scene=2`; DECISIONS §85–§88).** `hooks.dinfo()` publishes the grid — `N` (the mirror count), `nN` (its
change count), `rot` (the wedge angle, the column `nudge85.py` grades), `fold`, `nv` / `nu` / `nstep` / `noff` / `njump` / `nacc` (as
DUST's `d_spin` set, from the shared `math/beatgrid.js` spinner), `why` (the seam on this frame: 0 / 1 phrase / 2 novel / 4 return) —
the voices as DUST's (`vk vs vh ageK ageS ageH fK fS fH aK aS aH srcK srcS srcH hBed hSwell`, plus `seg`, the snare's lit wedge, and
`kAmp`, `kickAmp` traced beside the kick) — the tension (`build wind rel amb tight Nt drain`) — and the accent / key (`hG hue kconf
key kmode sat`). The rulers: `tools/work/v85/nudge85.py` (§61's metrics on `d_rot`, the design step from `d_N`, the N changes with
reason), `tools/work/v86/voice86.py` (P / coverage / floor share / 16th-grid share / lag / annulus lift per fire for all three voices),
`tools/work/v87/tens87.py` (`tight` at named times, `rel` on the drop frame, the per-bar `lum` before each drop, the control's
numbers). The four windows and their WARM: `tools/work/v85/trace4b.sh <tree> <outdir> <prefix> <port>` (SeeYouDrop 20–110 WARM 20,
Vienna 24–60 WARM 24, Vienna 80–110 WARM 40, CyborgNinja 20–80 WARM 20; it also records the tongue and key MS fields).

**Grading a TRIGGER, not a lag (§64).** When the question is "does this voice fire on the right thing", precision is
the number, not coverage: match each of the scene's own fires (a `dinfo()` fire counter — DUST's `fK` / `fS` / `fH`,
with `aK` / `aS` / `aH` for the amplitude it fired at and `srcK` / `srcS` / `srcH` for which detector fired it) to the
truth's onsets within ±50 ms, and report **P, the share at the voice's floor, and the share landing on the truth's own
16th grid** beside the §58 coverage. On Vienna 20–110 s DUST's hat voice fired at 3.44/s against a truth of 2.49 with a
coverage of 96.8 % — and 41 % of those fires were not hats. Coverage alone cannot see that, and the floor share and the
grid share are what the eye is actually reading.

**A before/after is only valid if the ENGINE did not move between the two traces** (DECISIONS §60). Two workers in
one worktree is normal here, and an engine worker editing `assets/engine/clock/clock.js` mid-session moved
SeeYouDrop 20–110 s from 225 beats to 227: the build and a scene's formation sequence then land differently and one
drop's mean luminance moved 160 → 106 for reasons that were not the scene's. So: **take the before and the after
back to back, and prove it with the md5 of the MS columns of both traces.** `beatCount`, `dropEnv` and `eM` are
enough — between them they catch a clock change, an analyser change and a source change:

```python
import json, hashlib
c = json.load(open(p))['cols']
''.join(hashlib.md5(json.dumps(c[k]).encode()).hexdigest()[:8] for k in ('beatCount', 'dropEnv', 'eM'))
```
The pre-change build is `git checkout <sha> -- assets/scenes/<name>/` (stash your own work first), which is a few
seconds; re-tracing is minutes, and re-deciding on a contaminated table is an hour.

## Luminance ruler — `tools/lumtrace.js` (a scene's legibility over a track window; the NAV retune's number, 2026-10-08)

The user's NAV complaint — "it blows out to near white at the loudest sustained bars and the fractal disappears" — is a
luminance question, so a retune is judged by this ruler, not only by eye (the model is the per-frame `YAVG`/`YHIGH` study
on the v0.32 clip in `docs/plans/nav-retune-review-2026-10-08/lum.csv`, moved into the deterministic file-mode harness).

```
node tools/lumtrace.js <Track> --scene=0 --from=25 --to=55 [--fps=10] [--w=640] [--sheet=5] [--warm=8] [--port=8831] [--out=path] [--x='n2lum=0.28,2.2&n2smo=.12,.5']
# -> <out>.csv  <out>.txt  <out>-sheet.jpg  <out>.log     (default out: tools/work/lum/<Track>-s<scene>-<from>-<to>, gitignored)
```
It is a `filetrace.js`-shaped run: `CLOCK=1 GPU=1` cdp on `#test&track=<Track>&at=<from − warm>&scene=<N>` (file mode, the
deterministic clock, `heardT = at + (frame − 2)/60`, the file-mode display lead), and a rAF hook registered after
`core/loop.js`'s (which re-registers at the top of its callback) reads the GL canvas on the frame's own task — after the
last draw, before the compositor takes the buffer, the read `rec.js` and `probe.js` rely on — on every frame where
`(frame − fStart) % (60/fps) == 0`: so the samples are at exact TRACK times (`t` = heard seconds, 25.0, 25.1, …), not wall
times. Each sampled frame is `drawImage`d into a `--w` px wide 2-D canvas (the page is 1280×633 at the default `WIN`, so
640×317) and read with `getImageData`; nothing is decoded in node. `--port` is the server cdp spawns and kills for the run —
never the user's 8765. `--x=` appends hash knobs (a scene's hooks, `&n2lum=…` on NAV2 — §99's sweep was one run per setting). One headless Chrome at a time (a second one skews nothing here, but it skews every bench).

Columns (all 0..1, on the sRGB bytes, `Y = .2126 R + .7152 G + .0722 B`):
- `meanY` mean luma · `p95` its 95th percentile (256-bin histogram) · `clipFrac` the fraction of pixels with `Y ≥ 0.9` — the
  "near white" the complaint names · `grad` the **structure score**, mean `|∇Y|` over the interior (central differences, per
  pixel at the `--w` scale): a washed flat field scores low, legible fractal filaments score high, and it is the number that
  must NOT fall when a retune dims the picture · `centre` / `rim` `tools/lum.py`'s centred 20 % box and the 0.6–0.9 annulus.
- The `.txt` summary: one row per 5 s (`medY` median meanY, `p90Y` its 90th percentile, `clip` mean clipFrac, `clipMx` its
  max, `grad` mean, `ctr` / `rim` medians, `n` frames) and an `ALL` row; the counts of frames with `clipFrac ≥ 0.25` and
  `meanY ≥ 0.6`; the min-grad frame; page errors / nonFinite / `ENGINE.ms`. `lum.csv`'s "frac > 110" (8-bit YAVG) is
  `meanY > 0.43` here.
- The sheet: one 320-px tile per `--sheet` s (8 per row), captioned `t · Y · clip · grad` — one image per window for review.
  The HUD minimap inset is in the GL frame, so it is in the numbers too (a ~2 % patch, the same on every frame).

**Windows are comparable only at the same `at`.** The navigator's trajectory (where c is, whether it is parked on a root) is a
function of the whole run from `at = from − warm`, so a 35–45 s window warmed from 27 s is NOT the 35–45 rows of a 25–60 s window
warmed from 17 s (§99 measured SeeYouDrop 40–45 centre 0.558 against 0.223 on the same tree). To probe a sub-window of a long run
bit-comparably, keep its `at`: `--from=35 --to=45 --warm=18` for the 25–60 run's rows. id 0 and id 8 share a trajectory on the same
window (nav.js is a byte copy and reads the same fields), so the clone's rows ARE comparable to the baseline's.

**Determinism:** two runs on the same tree are byte-identical CSVs (`cmp`): the clock, the seeded PRNG and the GL render are
deterministic; the ruler's own reads are too (no wall time anywhere). A different GPU / driver may move a byte by 1/255.
Measured 2026-10-08: SeeYouDrop 25–60 s scene 0, two runs → `cmp` identical (351 rows).

**Baseline v0.33 (NAV, scene 0 — what every retune is judged against; the `.txt` + sheets persist under
`docs/plans/nav-retune-review-2026-10-08/baseline/`, the CSVs are in `tools/work/lum/baseline-v0.33/`):**

```
lumtrace SeeYouDrop scene 0 [25, 60] s · 10 fps · 640x317 from 1280x633 · 351 frames · heard 25.000 → 60.000
window    medY   p90Y   clip   clipMx grad    ctr    rim      n
25-30     0.150  0.218  0.005  0.054  0.0127  0.453  0.264   50
30-35     0.218  0.274  0.012  0.118  0.0114  0.490  0.400   50
35-40     0.244  0.333  0.038  0.176  0.0140  0.576  0.472   50
40-45     0.318  0.384  0.023  0.124  0.0127  0.825  0.546   50
45-50     0.218  0.268  0.001  0.002  0.0122  0.397  0.432   50
50-55     0.190  0.240  0.013  0.100  0.0168  0.417  0.347   50
55-60     0.157  0.217  0.001  0.001  0.0116  0.285  0.255   51
ALL       0.204  0.322  0.013  0.176  0.0131  0.496  0.399  351

lumtrace Vienna scene 0 [60, 95] s · 10 fps · 640x317 from 1280x633 · 351 frames · heard 60.000 → 95.000
window    medY   p90Y   clip   clipMx grad    ctr    rim      n
60-65     0.213  0.290  0.006  0.048  0.0169  0.355  0.346   50
65-70     0.103  0.145  0.001  0.003  0.0151  0.180  0.238   50
70-75     0.186  0.248  0.002  0.043  0.0125  0.132  0.423   50
75-80     0.060  0.094  0.001  0.001  0.0097  0.036  0.196   50
80-85     0.173  0.217  0.002  0.009  0.0144  0.253  0.320   50
85-90     0.193  0.262  0.008  0.092  0.0182  0.236  0.417   50
90-95     0.149  0.326  0.003  0.044  0.0117  0.075  0.262   51
ALL       0.158  0.262  0.003  0.092  0.0141  0.165  0.301  351
```
Peak frames (the CSV): SeeYouDrop **39.2 s centre 0.965 · p95 0.961 · clipFrac 0.176** (the centre blow-out at the root
bars) and **57.6 s meanY 0.596 · grad 0.0046** (the drop flash — bright AND flat, a third of the window's grad: the
complaint's signature is a high `meanY` with a low `grad`, more than `clipFrac` alone, because a saturated pink or yellow
wash keeps `Y` under 0.9 while the structure is gone); Vienna 86.2 s centre 0.922 · clipFrac 0.092. A retune is a win when
the 35–45 s / 85–90 s `clip` and `ctr` come down **and** `grad` does not — a dimmer picture with the same `grad` is a wash
turned into detail, a dimmer picture with a lower `grad` is just a dimmer wash.

Limitations: the HUD minimap inset is inside the frame (a constant ~2 % patch); `clipFrac` is a luma threshold, so a saturated
single-hue wash reads as `centre`/`p95`, not `clip`; the page is 1280×633 headless (`innerHeight`, "Pitfalls"), not a 16:9 glass;
and the numbers are post-tonemap / post-vignette, as the viewer sees them — compare scenes and tunes measured the same way only.

## Recorder (`R` — change to `core/rec.js`, `core/quality.js`'s hold, `loop.js`'s frame end, `hud.js`'s keys, `core/version.js`; DECISIONS §89, §92)

```
GPU=1 PORT=8861 node tools/test_rec.js        # headless, the REAL clock, #test&fake=0 (the demo synth on the bus); 41 checks, exit 1 on a FAIL
node tools/clip.js <take.webm> --ss 4 --to 49.5 [--dry]    # the clip bundle (ffmpeg; --dry prints the commands); the sidecar: .json beside it, else the one inside the webm, else derived
GPU=1 PORT=8951 [STEP=0.5] [FRAME=1.5] node tools/rec_probe.js <take.webm>     # measure a take WITHOUT ffmpeg (§92): EBML + the frames scored in Chrome
GPU=1 PORT=8951 [WIN=1920,1080] [N=10] [PIN=q] [TAG=x] node tools/rec_probe.js --take 'scene=0&recq=1&recbps=30'   # a headless take with the Q.q trace
```
- **The knobs (`rec.js`, read from the page hash like `&rec=0`):** `&recq=` 0..1 | hold | off — the tier held for the take (default 0.75;
  `off` = the v0.31 governor) · `&recbps=<Mb/s>` (default 30; v0.31 was 12) · `&recmime=` vp9 | vp8 | h264 | av1 | mp4 | a full mime
  (default: the first of vp9 → vp8 → h264 the browser supports) · `&recsize=<height>` the clip scaled to that height (default: the canvas's
  backing size) · `&recjson=1` the `.json` as a second download (the sidecar is inside the webm by default: a Tags element before the
  first Cluster, `ffprobe -v error -show_entries format_tags <take>` prints it as `tag:COMMENT`).
- **Measuring a take without ffmpeg (`rec_probe.js`):** the EBML walk gives the video track's codec, pixel size, block count (= encoded
  frames), the duration (last cluster + block timecode), Mb/s overall and per second, and the embedded sidecar; then headless Chrome plays
  the file (served from `tools/work/rec/`, same origin) and every `STEP` s scores a frame: `lap` the Laplacian variance of the luma at 1×,
  `l2 l4 l8` the same on the box-downsampled frame, **`r14` / `r18` the sharpness that survives a change of content** (an upscaled low-tier
  render or a starved encoder keeps little 1-px energy against its 4–8 px energy). `FRAME=<s>` saves that frame as a jpg to look at.
  Reference points (NAV): the same frame live at q 1 r14 0.59 / r18 0.37, at q 0 0.39 / 0.21; VP9 at 12 Mb/s encodes to ≈ 0.35 / 0.20,
  at 30 Mb/s ≈ 0.40–0.46 / 0.24–0.31; the user's v0.31 take 0.14 / 0.08. With ffprobe: `-count_frames -show_entries
  stream=codec_name,width,height,r_frame_rate,nb_read_frames` — note `r_frame_rate` on a MediaRecorder webm is a guess (whole-ms stamps).
- **`--take`:** opens `#test&fake=0&<hash>` at `WIN`, waits 4 s, scores the live WebGL frame (read on the rAF after the loop's, same task),
  `__REC.start()`, a 1 s trace of `Q.q` / `Q.scale` / `CARD.frameN`, `__REC.stop()` after `N` s, scores the live frame again, walks and plays
  `REC.last.blob` in the same page. One summary (encoded fps, loop fps, Mb/s, the `Q.q` trace, r14 / r18 medians); the JSON under
  `tools/work/rec/take-<TAG>.json`. `PIN=<q>` overrules the governor every 100 ms (the control for a build without `&recq=`). fps numbers
  need the machine to itself: never alongside a sweep.
- `test_rec.js` is its own CDP driver (it needs `Browser.setDownloadBehavior` and the download events, which `cdp.js` has no
  step for): keys through the public handler (`d` HUD on, `R`, `4`, `2`, `R`), the two downloads into `tools/work/rec/`, the
  name regex, the sidecar's schema and scene timeline against the key times (±0.6 s), the webm's duration (its EBML clusters
  walked in node — a MediaRecorder webm has no Duration header) against `durationS` (±0.8 s), the compositor's mean luminance
  mid-take (> 1.5: the WebGL canvas was readable on the same task), a frame decoded from the webm → `tools/work/rec/frame.jpg`
  (the watermark in it, the HUD not — look at it), `version.js` == `package.json`; since §92: ONE download, the sidecar read back out of
  the webm (`rec_probe.js`'s `walk`) and compared to `REC.last.sidecar`, `Q.hold` 0.75 / scale 0.875 during the take and null after, the
  sidecar's `bps` / `mime` / `q` / `q0` / `render` / `dpr`. Not in `npm test` (it needs Chrome). It
  runs under `CLOCK=1`'s absence on purpose: the fake clock would starve MediaRecorder.
- Under `#test` the page exposes `window.__REC = { REC, start(), stop(), cv() }` (`rec.js`, never on `CARD`); `stop()` downloads.
  `REC.last = { name, bytes, sidecar, mime, blob, embedded }` after a stop.
- **The md5 receipt after any change here:** the full `tools/scene-md5.sh` list (or `accept.sh`) with the recorder idle must be
  the v0.29 list to the byte — `recFrame()` returns on its first line when `REC.on` is false, and the sweep is the proof.
- **The cost at 1080p (the stop rule, SOCIAL-PLAN §2.2):** `GPU=1 WIN=1920,1080 node tools/cdp.js 'test&fake=0&scene=3' …` counting
  `CARD.frameN` over 5 s with `__REC.start()` between windows (§89 has the run: off 300 / on 235 / off 301 / on 233 / off 301 frames
  per 5 s — 60 → 47 fps, 0.78×, NOT halved), and the compositor's own share measured alone (100 × drawImage + the shadowed text,
  `getImageData(1 px)`-synced: ~1.3 ms per frame at 1920×993). The rest of the loss is the VP9 software encode, which the
  alternative (a watermark quad in `post.js` + `captureStream` on the WebGL canvas) would not remove. §92: with the tier held at 0.75
  and 30 Mb/s the loop stays at 60 and the encoder delivers 59.9 fps on this machine; at `recq=1` 56–57 / 54.6.
- **The by-hand receipts (`HEADED=1`, the user's desktop, sound on):** (1) 30 s in tab-capture mode — `HEADED=1 WIN=1920,1080
  CAPTITLE=<the music tab's title> node tools/cdp.js 'real' '[{"wait":1500},{"clickSel":"#go"},{"wait":4000}]'` then press `R`,
  wait 30 s, `R`; (2) 30 s in file mode — drop a track on the card (or `#track=SeeYouDrop.flac` on the dev server), `R`, 30 s, `R`;
  (3) each saved `.webm` plays in Chrome AND VLC **with sound**; (4) the watermark reads bottom-right, the red dot and the HUD
  are not in it; (5) after `sudo apt install ffmpeg`: `node tools/clip.js ~/Downloads/<take>.webm --ss 2 --to 28` and
  `ffprobe -v error -select_streams v -show_entries stream=r_frame_rate,pix_fmt -of csv=p=0 tools/work/clips/<dir>/clip.mp4`
  prints `60/1,yuv420p`, `-select_streams a -show_entries stream=codec_name` prints `aac`; (6) one take with `&shade=0` and one
  with the default, for the first post (SOCIAL-PLAN §2.8).

## Single-file build

```
node tools/bundle.js                                  # → dist/retinarave.html (all modules inlined, works from file://)
FILE=$PWD/dist/retinarave.html GPU=1 node tools/cdp.js 'test&scene=0' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite()})"}]'
```

## Release notes — `releases.json`, `/whats-new`, the card's "New in vX" line (v0.31, DECISIONS §91; SOCIAL-PLAN §3–§4)

```
node tools/releases.js check                 # the schema (class scene|engine|tuning, ISO date, unique versions, newest first, no § in the prose) + the ritual (top entry == package.json)
node tools/whatsnew.js [--check]             # releases.json → site/whats-new.html, and index.html's <a id="newin"> line; --check exits 1 when either is stale
node tools/releases.js set v0.29 clip.youtube <id>   # SocialMediaManager's post log writes the id back; the poster is site/thumbs/whats-new/<tag>.jpg (self-hosted)
npm run build                                # = whatsnew.js → bundle.js (inlines the line) → cp site/. dist/ → dist/whats-new.html, dist/index.html
```
- `releases.json` (repo root) is the one visitor-facing source: one entry per tag, newest first, `body` in a visitor's words (no
  section numbers — `decisions` carries the § list; check.js refuses a § in the prose). `tools/releases.js` is the one reader.
- **The tag ritual, in this order or check.js fails:** bump `package.json` + `assets/core/version.js` together (§89) → add the
  top entry to `releases.json` → `npm run build` (regenerates `site/whats-new.html` and the card line; both are committed sources)
  → `node tools/check.js` (0 fail: the top entry == package.json, index.html's line == the top entry's title) → the usual
  (license --check, npm test, test_rec, the release from `file://`) → commit, `git tag -a`, push.
- The page is static: no script unless an entry has a clip, and then only a click builds the YouTube iframe (youtube-nocookie)
  behind the self-hosted poster. **The no-third-party receipt** (SOCIAL-PLAN §4) on `/` and `/whats-new`:
  `node tools/cdp.js '' '[{"wait":1200},{"eval":"JSON.stringify([...new Set(performance.getEntriesByType(\"resource\").map(e=>new URL(e.name).host))])"}]' http://127.0.0.1:<port>/whats-new`
  → the one host is the page's own (`NOAUTO=1 … real` for `/`). `serve.js` resolves `/about` and `/whats-new` to `site/<p>.html` as the deploy does.
- The landing line is DOM only: the "Landing tiles" row in the table below is its proof tier (the card recipe + one full `scene-md5.sh` list).

## What to re-prove after a change (v0.7, the user: "when building/updating a scene only need to test that one scene")

The proof is sized to what the diff can reach. Scenes import nothing from `core/` or `engine/` and a forced shot runs one
scene's `update`/`draw`, so a change inside one scene folder cannot move another scene's pixels — the full eight-scene list
after every scene edit (the v0.5–v0.7 habit, four lists in the TORUS2 session) was insurance against nothing.

| the diff touches | prove | cost |
|---|---|---|
| **one scene folder only** (`assets/scenes/<x>/`) | `node tools/check.js` · `IDS=<id> tools/scene-md5.sh <tag>` (that scene's f360/f840 lines, diff against the reference) · its own proof shots · `CARD.bench(id, 300)` interleaved with NAV when cost could move | ~1 min |
| **`main.js` registration** (a new id, an id swap, the list order) | one full `tools/scene-md5.sh` list, the mixs md5, the help counts — the one file that touches every scene (`REG` order, the key row, the cast, every `init` at boot) | ~6 min, once |
| **the landing card only** (`core/landing.js`, `hud.js`'s hooks, `index.html`'s card CSS/markup, `site/`, `releases.json` / `tools/whatsnew.js`) | `check.js` · the "Landing tiles" recipe (desktop + `MOBILE=1`) · the bundle from `file://` · one full `scene-md5.sh` list as the "nothing underneath moved" receipt (DOM cannot move a pixel of the canvas, the list says so in 5 min) | 6 min |
| **`core/`, `engine/`, `effects/`, `transitions/`, `main.js` beyond registration** | the full list (v2 + `&colour=oklch`), parity fake, mixs, and the Q trace when cost could move — i.e. `tools/accept.sh` | 25 min + 16 per trace |
| **a scene enters the director's rotation** (a bid that was 0 becomes live) | the Q trace on house + aba *after* the promotion — a scene with bid 0 cannot be picked, so a trace before it measures nothing | 16 min |

v0.9 POLYTOPE (id 5 modified in place, DECISIONS §41) is the first row: `IDS=5 tools/scene-md5.sh` against `tools/accept/v0.9/scene-md5-v09.txt`
(= the v0.8 list with s5 re-based), `accept.sh` "== polytope" (the pinned trains, the key pair, the groove route), the bench both casts,
and — because id 5 bids — the Q trace on house + aba (`tools/accept/v0.9/q-*-{before,after}.txt`). The real-music trace is
`tools/accept/v0.9/det9.py <track> <tag>` (`hooks.info()`: per band launches, the last launch and its drum vote, EMA, threshold).

A worker's brief names the tier; the orchestrator runs the sweep once, at the tag, not piecemeal and then again.

## Acceptance sweep

`tools/accept.sh` writes its shots into `tools/accept/$ACC/` and — since v0.29, DECISIONS §83 — reads **every md5 reference from
the same directory**: `scene-md5-v034.txt` (every scene id at CLOCK=1 f360 / f840, `tools/scene-md5.sh`'s format — the "== scene
md5" loop checks all twelve ids against it, and the torus2 / nav2 / polytope / gielis blocks read their lines from the same
list), `gielis-still-md5.txt` and `trans-mixs-md5.txt` (the 0→3 mixs fade at f178). `ACC` is the ONE
variable at the top of the script (`ACC=${ACC:-v0.34}`); a re-base is: a new directory, those three files, that one default.
The earlier per-version lists (v0.7 / v0.8 / v0.9 / v0.14 / v0.29) stay on disk as history (v0.34 = §97's NAV2 re-base: the v0.29
list with only the s8 pair changed, to NAV's s0 values — NAV2 is a clone of NAV; `nav2-still-md5.txt` went with the `&still=1` hook; **re-based in place by §102**, 2026-10-08, the swap: s0 = the retuned navigator `a8de2f03 / 7a65fd16`, s8 = the v0.33 navigator `fb74fee4 / 8a0715df` — the file's header says which). `parity.js` compares cardioid3's navigator against id 8 since §102 (`NAVID=8` default; the home is the retuned walk). `parity.js` and the trace / bench tools
honour the same `ACC` (`ACC=v0.3` or `ACC=v0.2` to write beside the earlier files; the v0.2 "before"/"none"/"after" traces
referenced in DECISIONS §9–§17 stay in `tools/accept/v0.2/`).

```
GPU=1 tools/accept.sh                        # everything above, shots → tools/accept/v0.34/, 0 FAIL lines is the pass
GPU=1 PORT=8830 ACC=v0.34 tools/accept.sh    # a worker: own port (never the user's 8765), the reference directory named
# re-base (after a commit that legitimately moves lines — see §83 for what the fake timeline's lattice reaches):
#   mkdir tools/accept/v0.NN; PORT=88xx tools/scene-md5.sh vNN; cp tools/work/vNN-md5.txt tools/accept/v0.NN/scene-md5-v0NN.txt
#   (then the stills and the mixs value from a sweep's own shots), ACC's default → v0.NN, DECISIONS says which lines moved and why
```
The jpgs under `tools/accept/` are NOT ignored (`.gitignore`: `!tools/accept/**/*.jpg`) but past sweeps left them untracked;
add a sweep's shots only when a DECISIONS section cites them.

## Pitfalls already paid for

- A **look question is decided by a routed parameter on `#test`** (`&param=<scene>.<p>=c:0` vs none at the same CLOCK=1 frame), never by
  two `fake=0` runs — the demo synths are random and two runs once disagreed by 0.6 in mean saturation (v0.9, `polytope-dance.md` (e)).
- `gl.POINTS` vanish in an offset viewport on ANGLE-GL (fine in SwiftShader): overlays draw paths in-shader.
- `smoothstep(a,b,x)` with a>b is undefined. Never name a GLSL variable `gl_*`.
- `readPixels(UNSIGNED_BYTE)` from an RGBA16F target returns black — `ctx.mkTarget(w,h,true)` for readback.
- Headless frame pacing sinks `Q.q` on any scene; `Q.q` is not a perf verdict, `CARD.bench` is.
- A per-iteration `sin(atan)` in a unified shader sank `Q.q` to 0 — keep shaders per scene, gate work on uniforms.
- Module scripts are strict mode: no implicit globals. Import what you use.
- The demo synth uses `Math.random()` noise: `fake=0` runs are not bit-identical ("judge on 2+ runs"); `#test` is.
- `features-slow.js:125` seeds a new section's look with `Math.random()` (`MS.seed` → `LOOK`, `GROOVE`, MANDALA, POLYTOPE,
  FEIGEN, NAV), so **real music is not reproducible in pixels** unless something replaces it: deterministic file mode
  installs a seeded PRNG over `Math.random` for the run and restores it on stop (v0.15 E1).
- cdp's `{wait}` step clears `window.__pauseAt` as well as `window.__PAUSE`, and a general (non-`__FRAME`) `{until}` sets
  `__PAUSE = 1` that only a `{wait}` or a `__FRAME` target clears — so two non-frame `{until}`s in a row deadlock, and a
  `{wait}` between them silently un-holds a deterministic clock. `{eval:"window.__PAUSE=0"}` is the resume that touches
  nothing else (v0.15 E1, "File source").
- **`innerHeight` is 633 at the default `WIN=1280,720`** and the landing card's `.alt` row sits at y 629–644, so
  `{clickSel:"#demo"}` on the `real` hash dispatches a click *below the viewport* and the handler never fires — the
  documented real-start-path check passes anyway because it only asserts `CARD.ERRS` / `nonFinite()`. Add `WIN=1280,900`
  (then `AU.mode` really is `'demo'`), or assert `AU.mode` so the miss cannot hide again. Pre-existing; found v0.15 E1.
- The empty hash defaults to `test` in cdp.js — pass `real` for the real start path.
- A `<select>`'s native popup is a separate override-redirect X window: `Page.captureScreenshot` never contains it,
  `xwd -root` fails with `BadColor` while it is open, and only `color-scheme` styles it. Open it with a trusted
  `{clickSel:'#pe-src-…'}` (`{key:'Alt+ArrowDown'}` sends no modifier) and grab the root with python-Xlib + PIL (the
  worker's `tools/work/xshot.py`, v0.4.1). Never `xdotool … windowactivate` by class in a headed run — it raised other
  Chrome-class windows on the desktop.
- A DOM-built `<table>` has no `<tbody>`: select `#pe-blk-<scene> tr`, not `tbody tr`.
- `CARD.view(name)` takes the scene name, not the scene object.
- `CARD.bench(id, n)` benches whatever state that scene's **last `update()`** left: benching TORUS from a page where TORUS2 was
  forced read tier 1 (`seg 72`) because its update had barely run. Bench a scene in a page where it is the forced scene, `q`
  pinned, settled; compare pages through their NAV ratios (v0.7, TORUS2).
- `CARD.goScene(id, hard)` does not beat a sticky `&scene=N`: `SC.logical` stays at N. Load a second page instead.
- `#test` sets `hat` to **exactly 0.5** (snare 0.7, kick 1.0): a rising-edge detector's threshold must be below 0.5.
- `tools/probe.js` needs a real window (it registers its own rAF and reads the GL canvas through a 2-D canvas): headless
  luminance is `python3 tools/lum.py <shot.jpg>` on the saved screenshot (centre 20 % vs the 60–90 % rim annulus; post-composite,
  so the vignette flatters the ratio — compare against another scene's shot measured the same way).
- `tools/lum.py` has **no hue field** (v0.10's MAXWELL report quoted a hue from an instrument that was never committed): a hue
  number comes from a scene hook (`hooks.mxcol()` on MAXWELL) or `probe.js hueFit`, never from `lum.py`.
- Scene palettes are **cosine**, `0.5 + 0.5·cos(TAU·(h + [0, .33, .67]))`, not HSV: a hue number in a report is in **palette
  turns** (0–1, recovered by `probe.js hueFit`), and a proof that quotes HLS degrees against a constant in turns compares nothing.


## Hearing a truth grid (`tools/truth/clicktrack.py`, 2026-10-02)

The user's own ruler for a grid (NEXT-SESSION-PROMPT "Validating a truth grid"): the track with a click on every truth beat
(the downbeat a lower, louder click; `--drops` a long low click on each `drops_user` / `drops`; `--sections` a double-click on each
section start; `--every=N` every Nth beat — the half-time / quarter-time octaves, to hear which lattice the music nods to;
`--from/--to` a window). Reads `tools/truth/<T>.json` + `tools/work/<T>.48000.st.f32` (make the PCM once with `trackmap.py <T>
--pcm --sr=48000` ONLY while `<T>` has no truth dir yet — `--pcm` regenerates the grid). Prints the grid's provenance
(`provisional` / `hand` / `anchor` / tool-only). A late grid is a flam, a wrong bar line is the accent on the wrong beat, a wrong
drop is a click where nothing happens, a wrong octave is twice or half the clicks the music wants.

```
python3 tools/truth/clicktrack.py Vienna --drops --sections --from=60 --to=112      # tools/work/Vienna-click.wav
python3 tools/truth/clicktrack.py Comptine --every=4 --from=0 --to=60              # tools/work/Comptine-click-every4.wav (53.8 BPM heard)
```
Comptine (Tiersen, solo piano, no drums — added 2026-10-02) is the case that needs it: trackmap locked 215 BPM onto the left
hand's broken-chord notes; the felt pulse is an octave or two below, to be settled by ear.
IBelongHere (Set Mo feat. Woodes, deep house with a sung intro and sung breakdowns — added 2026-10-02, `docs/truth/IBELONGHERE-2026-10-02.md`):
118.00 BPM (`bpm_grid.bpm` 117.45 is the DP list's hop-median, as Malicious's §72 `tempo_note`); the `beats` list is on the audio
(three rulers −2.2 / +1.6 / +0.3 ms, hand montage +0.1), bar line = the kick's 1 (21 dB vs 10–13 on 2/3/4, drops 96/128/96 beats
apart), key Am by bass vs Dm by the ears — the user's ear decides; the sixth row of `test_ears.js` KEY_TRACKS (`expect: false`).
`python3 tools/truth/clicktrack.py IBelongHere --drops --sections --from=0 --to=75` + `--every=4` are the two WAVs the user has.
The user listens from the session: copy every render to `~/Music/RetinaRave-clicks/` (not the tracks folder) and hand them the
line `! paplay ~/Music/RetinaRave-clicks/<name>.wav` — one per file, in listening order.

**The other three rulers, headless** (NEXT-SESSION-PROMPT "Validating a truth grid" steps 2–4; the 2026-10-02 pass on Vienna +
Malicious with SeeYouDrop + CyborgNinja as controls is `docs/truth/GRID-VALIDATION-2026-10-02.md` — tables, montages, proposed
edits, and the sentence per track the user needs to hear): `python3 tools/truth/gridcheck.py <T> …` (the provenance line per
track, no trace needed), `tools/truth/v83-hand.py <T> [low|mid|high]` (the 16-beat waveform montage, the attack should start ON
the line), `tools/work/v72/ruler_a.py` + `node tools/drums-node.js <T> --out <dir>` folded by `tools/truth/v83-drift.py` +
`tools/work/v72/prov.py` (the three automatic rulers, ±5 ms), `tools/truth/v83-barfold.py` / `v83-nov.py` (the bar line: the
percussion weight and the grid-free structural boundaries per beat of the bar). The grid is re-phased to the hand, never the
other way: the scripts measure, the doc proposes, the json is edited only after the user has listened.
