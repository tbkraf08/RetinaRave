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
node tools/test_director.js                                 # scripted MS, no Chrome: look memory, bar-line hold, cap, cancel
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
- `FILE=` must be absolute (`FILE=$PWD/dist/eigenwobble.html`); a relative path makes Chrome open `file://dist/…`.

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

Keys: `?` or `h` toggles, `p` opens it scrolled to part E (the routes panel, v0.4), `Esc` closes; `d f m 0–9` keep working with it open. It is DOM (`#help` in `index.html`) over
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
tools/scene-md5.sh after; diff <(sort -k2 tools/work/after-md5.txt) <(sort -k2 tools/accept/v0.5/scene-md5-v03.txt)
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
tools/scene-md5.sh after; diff <(sort -k2 tools/work/after-md5.txt) <(sort -k2 tools/accept/v0.5/scene-md5-v03.txt)
# a scene's move of a constant into params is a no-op per move: the same diff after each commit of the scene's worker
# a param route moves the picture; a constant route at the derived value on the defaults does not have to (from() is live, the constant is not)
CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6&param=feigen.<p>=centroid*1.5' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"work/prt-s6-f360"}]'
```

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

## Single-file build

```
node tools/bundle.js                                  # → dist/eigenwobble.html (all modules inlined, works from file://)
FILE=$PWD/dist/eigenwobble.html GPU=1 node tools/cdp.js 'test&scene=0' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite()})"}]'
```

## Acceptance sweep

Every trace/bench tool and `parity.js` write into `tools/accept/${ACC:-v0.5}/` (`ACC=v0.3` or `ACC=v0.2` to write beside the earlier
files; the v0.2 "before"/"none"/"after" traces referenced in DECISIONS §9–§17 stay in `tools/accept/v0.2/`).

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
- A `<select>`'s native popup is a separate override-redirect X window: `Page.captureScreenshot` never contains it,
  `xwd -root` fails with `BadColor` while it is open, and only `color-scheme` styles it. Open it with a trusted
  `{clickSel:'#pe-src-…'}` (`{key:'Alt+ArrowDown'}` sends no modifier) and grab the root with python-Xlib + PIL (the
  worker's `tools/work/xshot.py`, v0.4.1). Never `xdotool … windowactivate` by class in a headed run — it raised other
  Chrome-class windows on the desktop.
- A DOM-built `<table>` has no `<tbody>`: select `#pe-blk-<scene> tr`, not `tbody tr`.
- `CARD.view(name)` takes the scene name, not the scene object.

