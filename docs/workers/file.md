# FILE worker — a file source, deterministic real-track runs, heard time (v0.15 E1 + E2)

Brief: `docs/workers/brief-file.md`. Branch: the FILE worktree. `PORT=8812` on every `tools/cdp.js` run, one Chrome at a
time. `tools/accept.sh` was **not** run (the user: "wait for my say before running full sweep").

Machine for every number here: this desktop, headless Chrome (`GPU=1`, SwiftShader off), **AudioContext sample rate
48 000 Hz** — `decodeAudioData` resamples the 44.1 kHz `SeeYouDrop.flac` to the context rate, so `AU.file.sr` is 48000 while
`tools/work/SeeYouDrop.f32` (from `trackmap.py --pcm`) is 44100. Anything comparing the two must resample; nothing in this
session did (the shim tests feed the 44.1 kHz dump its own rate).

---

## (a) What was built

| file | what |
|---|---|
| `assets/engine/sources/file.js` | the source: real-time (audible `AudioBufferSourceNode`) and deterministic (nothing played, frame-exact playhead, shims, main-thread tap feed) |
| `assets/engine/shim.js` | `makeAnalyser(fftSize, smoothing)` — the Web Audio `AnalyserNode` algorithm over a `Float32Array` ending at a playhead. Pure, node-importable |
| `assets/engine/pcm.js` | the PCM bus: 512-sample **stereo** blocks + the audio time of the first sample. Live = an `AudioWorklet` on `AU.bus`, built lazily on the first `PCM.on`; det = the source pushes |
| `assets/engine/trace.js` | the event ring (`LOG`, cap 20 000) behind `ENGINE.log`, and `TRACE` — the per-frame MS recorder in the frozen format |
| `tools/filetrace.js` | the driver: `node tools/filetrace.js <track> <t0> <t1> <out.json> [fields=*] [extraHash]` |
| `tools/test_shim.js` | node: the shim against a second implementation of the spec's formulas |
| `tools/setfile.mjs` | a helper for a cdp `{sh:…}` step that drives `DOM.setFileInputFiles` (cdp.js has no step for it and cdp.js is not mine to edit) |
| edits | `audio.js` (`AU.file`/`heardT`/`ctxHeard`/`lat`/`sync`/`stopFile`, `PCM.arm`), `engine.js` (`frameN`, `log`, `TRACE`/`LOG`, the `file` source, the det feed, the `clock` stage), `synapse/tap.js` (`TAPS`, injectable clock, `mute`, `pushBlock`), `feats.js` + `state.js` (`heardT`, `fileOn`), `core/harness.js` (`&track=`/`&at=`/`&sync=`/`&det=`, `CARD.TRACE`/`CARD.LOG`), `core/landing.js` + `index.html` (the pick/drop control), `tools/serve.js` (`/music/`), `docs/HARNESS.md`, `docs/CONTRACTS.md` (regenerated) |

Not edited, as required: `features.js`, `features-slow.js`, `tempo.js`, `synapse/{analyzer,anatomy,dsp,structure}.js`, any
scene, `tools/cdp.js`, `package.json`.

---

## (b) Determinism: the wall clock audit, and the three races that had to be closed

`grep -rn "performance\.now\|Date\.now\|Math\.random\|currentTime" assets/engine/` — every hit, and its status in
deterministic file mode:

| site | what it feeds | status in det mode |
|---|---|---|
| `engine.js:52,70` `performance.now()` | `ENGINE.ms` (the CPU EMA) | **cost accounting only**, not in MS. It is the one number that legitimately differs run to run |
| `synapse/analyzer.js:97,102` `performance.now()` | `an.cpuMs` → `ENGINE.extraMs` → `ENGINE.ms` | cost accounting only. (In det mode the hop work happens inside `ENGINE.frame`, so it is counted twice — `ENGINE.ms` is an upper bound there) |
| `audio.js:40` `performance.now()` → `AU.t0` | `watchCapture`'s 6 s silence timer | **unreachable**: `watchCapture` returns at once unless `AU.mode` is `capture`/`mic` |
| `synapse/tap.js` `lastPush` / `lead` (3 sites) | `A.beat` → `beatSyn`, `barPos`, `barPhase`, `phrasePos`, `phrase16Pos`, `bar`, the grid confidences | **fed from the fake clock**: `Tap.clock` is injectable and `sources/file.js` sets it to the frame clock's ms (`detMs`). With a block pushed in the frame, `lead` is exactly `0.03` |
| `synapse/tap.js` fallback `ctx.currentTime` | the analyser-poll path | **unreachable**: `mute(true)` pins `mode` to `'worklet'` and the fallback branch is guarded by `!this.silent` |
| `sources/demo.js` / `demo-synapse.js` `Math.random`, `ctx.currentTime` | the demo synths | **unreachable**: no demo runs when a track is the source |
| `features-slow.js:125` `Math.random()` ×3 | **`MS.seed.{hue,th,a}`** → `LOOK` hue, `GROOVE.dir`, MANDALA `uSeed`, POLYTOPE, FEIGEN, NAV | **replaced**: `features-slow.js` may not be edited, so in det mode the source installs a seeded mulberry32 over `Math.random` (`DET_SEED = 0x9e3779b9`) and restores the original on stop. The MS *trace* does not carry `seed` (it is an object), so this is invisible to `cmp` and essential to any screenshot — a section boundary re-rolls the palette |
| `features-slow.js:125` (again) | — | nothing else in `assets/` calls `Math.random` at run time: `assets/core/`, `assets/effects/`, `assets/transitions/`, `assets/math/` and every scene are clean (the three hits there are comments saying so) |

**Race 1 — the decode's length.** A 24 MB flac decodes in a different number of milliseconds each run. Three consequences,
all closed:

1. *The page's warm-up.* The deterministic clock keeps running while the decode is in flight, so the playhead used to start
   on a different frame each time (`frame0` was 26, 103, …). `core/loop.js`'s `wall` advances even on silence
   (`wall += dt·(0.15 + 0.85·presence)`), so the MS trace matched frame for frame while every **screenshot** differed.
   Fix: in det mode the source sets `window.__pauseAt = 1` before the decode and clears it when the track is open, so
   **`frame0` is 2 on every run**. (`window.__pauseAt`/`__PAUSE` are `tools/cdp.js`'s CLOCK shim; on a page without it they
   are two harmless properties.) *Pitfall for every future driver:* cdp's `{wait}` step clears `__pauseAt` as well as
   `__PAUSE` — release the hold with `{eval:"window.__PAUSE=0"}` or with a `__FRAME` target, never with `{wait}`.
2. *Silent hops.* The synapse worklet is attached to `AU.bus` from `initAudio` and posts 512-sample blocks of **zeros** in
   real time while the decode runs; a different number of them reached the `Analyzer` each run. Fix: `mute(true)` is called
   **before** the decode (`armTap`), not after it (`armDet`).
3. *`Tap.mode`.* It is `'none'` until `audioWorklet.addModule` resolves and `'worklet'` after; `tap.frame`'s `lead` is `0`
   in the first case and `0.03+` in the second, so the frame the flip landed on moved `beatSyn` and everything downstream.
   Fix: `mute(true)` pins `mode = 'worklet'` and restores it on unmute.

Before those three fixes, two 0–60 s traces differed in **37 of 113 columns** — `kick snare hat kickCount alive calm flow
dirty punchy perc beatConf gridTrust barConf phraseConf bar barPos barPhase phrasePos phrase16Pos beatSyn bpmSyn key mode
keyConf novelty foote sectionAge dropExpectedIn dropConf valence arousal moodFamily moodEvt riser roll swell hp` — every one
of them synapse's, while **every v3 column already matched to the bit**. That asymmetry is what identified the tap as the
culprit and cleared the shims.

---

## (c) The numbers

### Determinism (acceptance 2)

```
PORT=8812 node tools/filetrace.js SeeYouDrop 0 60 tools/work/file-det-a.json
PORT=8812 node tools/filetrace.js SeeYouDrop 0 60 tools/work/file-det-b.json
cmp tools/work/file-det-a.json tools/work/file-det-b.json      # IDENTICAL
```
3600 frames × 113 fields, heard 0.01667 → 60.00000 s, `f0` 2, `sr` 48000, 5.07 MB (13 chunks of 400 000 characters),
**md5 `d302a35b2bd733f68ed1a1c9109a4d9b` for both runs**.

`dropEvt` fires on **exactly one frame in both runs: `f3458`, heard 57.600 s** — and `tools/truth/SeeYouDrop.txt`
annotates drop 1 at **57.6 s**. Also identical between the runs: 205 `onset`, 146 `beat`, 5 `sectionEvt`, 4 `boundaryEvt`,
1 `surpriseEvt`, final `bpm` 150.0344529077338 (the truth's 75.0 doubled — an octave error, not a wrong beat).

Trace size: **5.07 MB for 60 s of `'*'` (113 fields)** ≈ 5.07 MB/min ≈ 1.4 kB/frame. A single CDP return of that size was
never attempted; the driver chunks at 400 000 characters and fails loudly past `MAX_CHUNKS`.

### Real time vs deterministic (acceptance 3)

Both traces recorded with the same recorder, the same window, `'*'` fields. Aligned on **heard time** (nearest frame; the
residual after alignment is ≤ 1.41e-2 s = under one frame, which is itself a floor on every fast field's diff), first 10 s
dropped because both sides are still warming. `beatPhase` and `barPhase` as circular differences.

```
node tools/work/file-cmp.mjs tools/work/file-det-a.json tools/work/file-rt-a.json 'bass,eS,kick,beatPhase,bpm' 10 60
```

| field | median | p90 | max | det range |
|---|---|---|---|---|
| **bass** | 0.0065 | 0.0343 | 0.0895 | 0.016 … 1.000 |
| **eS** | 0.0038 | 0.0091 | 0.0155 | 0.445 … 0.959 |
| **kick** | 0.0738 | 0.2408 | 0.7302 | 0 … 0.886 |
| **beatPhase** (circ) | 0.0225 | 0.4101 | 0.4984 | 0 … 1 |
| **bpm** | 0.0272 | 0.2220 | 0.5225 | 149.60 … 150.27 |
| presence | 0 | 0 | 0 | 1 … 1 |
| mid | 0.0124 | 0.0356 | 0.0985 | 0.434 … 1.000 |
| high | 0.0078 | 0.0288 | 0.1341 | 0.321 … 1.000 |
| rms | 0.0041 | 0.0184 | 0.0713 | 0.009 … 0.643 |
| bassFast | 0.0068 | 0.0333 | 0.1674 | 0.009 … 1.000 |
| lvl | 0.0131 | 0.0308 | 0.1154 | 0.263 … 1.000 |
| sub | 0.0037 | 0.0207 | 0.1776 | 0.010 … 1.000 |
| bassS | 0.0032 | 0.0086 | 0.0208 | 0.025 … 0.996 |
| centroid | 3.5e-4 | 9.6e-4 | 0.0044 | 0.626 … 0.799 |
| tension | 0.0222 | 0.0729 | 0.1816 | 0.092 … 0.789 |
| arousal | 0.0143 | 0.0357 | 0.0404 | 0.295 … 0.549 |
| valence | 0.0224 | 0.0403 | 0.0414 | 0.327 … 0.488 |
| gridTrust | 0.0525 | 0.1122 | 0.2151 | 0.049 … 1.000 |
| heardT | 0.0018 | 0.0036 | 0.0141 | 10 … 60 |
| bpmSyn | 0.483 | 19.07 | 20.89 | 130.5 … 150.5 |
| beatSyn | 9.01 | 9.04 | 9.19 | 21.9 … 141.1 |
| barPhase (circ) | 0.246 | 0.712 | 0.996 | 0 … 1 |
| phrase16Pos | 2.03 | 9.54 | 15.03 | 0 … 16 |

**The tolerance I will state.** For the v3 spectral levels and arcs — `presence bass mid high bassFast rms eS lvl sub bassS
centroid tension valence arousal` — the two modes agree to **median ≤ 0.015, p90 ≤ 0.04, max ≤ 0.18**, and the canonical
tempo `bpm` to **median 0.03, p90 0.22, max 0.52 BPM**. For the impulse levels (`kick`, and `snare`/`hat` like it) the
agreement is **median ≤ 0.08, p90 ≤ 0.25** and no better: they decay with τ = 0.06–0.16 s, so the ≤ 14 ms alignment residual
alone accounts for most of it. **`beatSyn` and everything derived from it by a modulus (`barPos`, `barPhase`,
`phrasePos`, `phrase16Pos`, `bar`) are NOT comparable between the modes** and no tolerance should be claimed: the
det − rt offset drifts monotonically from −3.12 to −9.01 beats over the 50 s window, i.e. the two free-running beat clocks
ran at slightly different rates because synapse's own tempo (`bpmSyn`) sat an octave apart for part of the window
(130.5 vs 150.5). The canonical `bpm` did not.

**Why they differ at all**, in order of size:
1. **Frame phase.** The det clock is exactly 1/60 s; the real run's heard-time step measured median 0.01663, p90 0.01781,
   max 0.03437 (one dropped frame). So a real frame samples the music at a different sub-frame offset, and every follower
   is integrated with a slightly different `dt`. This is the ≤ 14 ms alignment residual and it dominates `kick`/`beatPhase`.
2. **The worklet's block alignment.** In real time the tap's 512-sample blocks fall where the audio graph's render quanta
   put them relative to the frame; in det mode they are pushed in the frame, so the Analyzer's hop grid has a different
   phase against the frame grid. Hops are 512 samples = 10.7 ms at 48 kHz.
3. **Output latency.** `heardT` in real time comes from `getOutputTimestamp()` (below) and is therefore an extrapolation
   with its own few-ms error; in det mode it is arithmetic.
4. **The analyser quantum.** The shims floor the playhead to a whole render quantum (128 samples = 2.67 ms), as the real
   node does, so up to 2.67 ms of the spectrum's window differs.

**The one thing that is not a tolerance.** Events:

| event | det | real time |
|---|---|---|
| `dropEvt` | **57.600** | **3.465**, 57.598 |
| `sectionEvt` | 0.833, 14.767, 19.667, 49.983, 55.250 | 0.624, 15.135, 49.982, 55.246 |
| `boundaryEvt` | 4.600, 8.717, 51.617, 59.600 | 4.001, 51.613, 59.579 |
| `onset` / `beat` | 205 / 146 | 207 / 145 |

The real drop lands within **2 ms** of the det one. The real run also fired a **full drop at 3.465 s**, in the intro, where
the truth has nothing (the sub's first entry is at 13.0 s) — exactly the run-to-run intro drop AUDIT-v0.14 §3 records. That
is now a *reproducible* difference between two measurable runs rather than a rumour, which is what E1 was for.

The comparator used for the two tables above (not committed — `tools/truth/compare.py` is the EARS worker's file; copy this
to `tools/work/file-cmp.mjs`):

```js
// rt vs det: align on heard time (nearest frame), then median / p90 / max |diff| per field. beatPhase circularly.
import fs from 'node:fs';
const A = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));   // reference (det)
const B = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));   // rt
const fields = (process.argv[4] || 'bass,eS,kick,beatPhase,bpm').split(',');
const T0 = +(process.argv[5] || 10), T1 = +(process.argv[6] || 60);
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const cyc = (d) => { d = d - Math.round(d); return Math.abs(d); };
let j = 0; const pairs = [];
for (let i = 0; i < A.t.length; i++) {
  const t = A.t[i]; if (t < T0 || t > T1) continue;
  while (j + 1 < B.t.length && Math.abs(B.t[j + 1] - t) <= Math.abs(B.t[j] - t)) j++;
  pairs.push([i, j, Math.abs(B.t[j] - t)]);
}
console.log(`aligned ${pairs.length} frames · max |t_det - t_rt| ${q(pairs.map((p) => p[2]), 1).toExponential(2)} s`);
for (const f of fields) {
  const d = pairs.map(([i, k]) => (/Phase$/.test(f) ? cyc(A.cols[f][i] - B.cols[f][k]) : Math.abs(A.cols[f][i] - B.cols[f][k]))).filter(Number.isFinite);
  console.log(f.padEnd(12), q(d, 0.5).toFixed(5), q(d, 0.9).toFixed(5), q(d, 1).toFixed(5));
}
```

### Heard time, the event log and the PCM bus (acceptance 4)

`MS.heardT` (raw, s) and `MS.fileOn` (0/1) are written by the `clock` stage, which `engine.js` registers with
`ENGINE.addStage` **before** `features-synapse.js` registers `'synapse'` (engine.js's module body runs first, because
features-synapse imports it), so it is the first stage every frame and nothing else reads `AU.heardT` per frame.
`node tools/feats-doc.js` regenerated Appendix A (109 non-internal fields). Verified on the page: `CARD.MS.heardT` 90.00000
and `CARD.MS.fileOn` 1 in det mode, `heardT` 90.00851 in real time; `-1` with no source.
`CARD.LOG` (= `ENGINE.LOG`, cap 20 000) holds `fileStart` with `{frame0, sr, at, det, dur, name}` on every run, and
`fileEnd` at the end of the track. `ENGINE.log(type, t, extra)` is the public hook, `t` in the engine's time base.

The PCM bus, with a test listener registered before `frame0` (the deterministic clock is held at frame 1 during the decode,
so an `{eval}` after `window.CARD` is in time), over heard 58 → 90 s of SeeYouDrop:

| | deterministic (the source pushes) | real time (the stereo AudioWorklet on `AU.bus`) |
|---|---|---|
| blocks with a stamp | 3004 | 3012 |
| blocks stamped −1 (before the node started) | 0 | 38 (the 0.06 s `START_DELAY` and the worklet's lead) |
| first / last `t0` | 57.99467 / 90.02667 | 57.91867 / 90.03600 |
| `t0` step vs 512/`sr` = 0.010666667 | max deviation **1.30e-14 s** | max deviation **1.54e-14 s** |
| non-monotone steps / gaps | **0** | **0** |
| `L` / `R` lengths | 512 / 512 | 512 / 512 |
| side / mid energy over 60–90 s | **0.218542** | **0.218494** |
| worklet built? | no (`PCM.local`) | yes |

So the blocks are contiguous to double-rounding in both modes, the real-time stamps come from the
`AudioWorkletGlobalScope`'s `currentFrame` and never drift or gap, and **`L ≠ R`**: the track carries 21.85 % as much
side energy as mid over 60–90 s. That the two modes agree on that ratio to 5e-5 — one path from the decoded
`AudioBuffer` channels, the other from the live graph through a worklet — is the cross-check that the stereo plumbing is
the same signal. `PCM.on` builds nothing until a listener exists, and never builds a worklet in deterministic mode.

### Latency, and how `DET_LEAD` was chosen

1478 frames of a real-time file run, headless, 48 kHz:

| quantity | median | p10 | p90 | min | max |
|---|---|---|---|---|---|
| `ctx.outputLatency` | **0.040** | 0.040 | 0.040 | 0.032 | 0.048 |
| `ctx.baseLatency` | 0.010667 | — | — | — | — (512 samples) |
| `ctx.currentTime − AU.ctxHeard()` | **0.04542** | 0.04037 | 0.05036 | 0.03306 | 0.05521 |
| `AU.file.ph − MS.heardT` (the constant `DET_LEAD` in det mode) | 0.04453 | 0.03936 | 0.04947 | 0 | 0.05435 |
| render quantum | 0.0026667 | — | — | — | — (128/48000) |

One spot reading, same run: `currentTime` 20.544, `getOutputTimestamp().contextTime` 20.4948, `AU.ctxHeard()` 20.5025 —
so **`contextTime` already lags `currentTime` by 0.0493 s, which is the output latency.** The brief's `heardT` formula
subtracted `outputLatency` *from* the extrapolated `contextTime`; measured, that double-counts it by ~40 ms. `AU.ctxHeard()`
therefore returns the extrapolated `contextTime` as-is and falls back to `currentTime − outputLatency` only when
`getOutputTimestamp` is unavailable. Both raw numbers are on `AU.lat()` so any future report can quote them.

**`DET_LEAD = 0.0427 s`** — the brief's recipe, median `outputLatency` 0.040 + one render quantum 0.00267. The quantity it
models (`currentTime − ctxHeard`, how far ahead of the listener the analysers look) measures 0.0454; the 3 ms gap is the
`getOutputTimestamp` extrapolation. I did not pick 0 because it is measurably wrong here by 43 ms, and the ruler the whole
session is judged against ("never late > 45 ms", ITU-R BT.1359) is the same size as the number — a 43 ms error in `heardT`
would make every later lag measurement meaningless. **`outputLatency` is the audio device's, not ours: re-measure
`AU.lat()` on any machine whose numbers matter.** On this desktop headless and headed report the same 0.032–0.048.

### CPU

`ENGINE.ms` (EMA of the engine's own per-frame cost, `GPU=1`, 1280×720, scene 0):

| mode | `ENGINE.ms` |
|---|---|
| deterministic file (both shims + the main-thread hop pushes, double-counted) | 1.37 – 3.31 |
| real-time file (real `AnalyserNode`s, hops in the worklet port handler) | 1.94 |

The shims do exactly **one analysis per frame per analyser** (measured: 975 analyses in 975 frames), which is what Chrome
does — the 2048 and the 8192 FFT together are the whole of the added cost and it is inside the existing budget. In det mode
`an.cpuMs` is drained into `ENGINE.extraMs` although the hop work already happened inside `frame()`, so the det figure is an
upper bound; it is also the only column that legitimately differs between two identical runs.

---

## (d) Friction — every sentence the docs lack, every guess, every lean changed

1. **`tools/cdp.js`'s `{wait}` clears `window.__pauseAt`.** Nothing says so. It silently undid the decode hold and cost the
   first half hour of step 2. HARNESS now says it. A `{wait}` between two `{until}`s is the documented way to resume the
   clock, and it is the one thing a deterministic file run must not do.
2. **Two consecutive non-`__FRAME` `{until}`s deadlock.** `{until}` sets `__PAUSE = 1` when the predicate turns true and
   only a `__FRAME` target or a `{wait}` clears it. `{eval:"window.__PAUSE=0"}` is the resume that does not touch
   `__pauseAt`. Also undocumented.
3. **A general `{until}` is not frame-exact.** It polls every 40 ms, and under CLOCK the page runs hundreds of fake frames
   in that gap, so `{until:"CARD.MS.heardT>=60"}` stops at a *different frame* in each run and two traces are not even the
   same length. Every deterministic window must be addressed by `__FRAME`. `filetrace.js` computes the frames from
   `f0 = 2` and warns if `frame0` is not 2.
4. **`cdp.js` has no `DOM.setFileInputFiles` step**, and `cdp.js` is not on my edit list. I added `tools/setfile.mjs`, run
   from a `{sh:…}` step (which gets `DBG` = the debug port) — one extra file beyond the brief's list, documented in HARNESS.
   The drop path needed no helper: a real `DragEvent` with a `DataTransfer` from an `{eval}` is the genuine event.
5. **`features-slow.js:125` is a determinism hole the brief's rules cannot close from inside.** `Math.random()` ×3 for a new
   section's look seed, in a file I may not edit, reachable from `ENGINE.frame` on real music. I replaced `Math.random`
   globally for the life of a det run. If that is the wrong call, the alternative is a one-line edit to
   `features-slow.js` taking the seed from a PRNG the engine owns — which I would prefer, and which is a v0.15 E5 item.
6. **Guess: the trace's `log` includes `fileStart`/`fileEnd` even when they precede the window.** The frozen format's
   example shows `fileStart` at `t: 0, f: 12` inside the JSON, while the comment says "ENGINE.LOG entries within the
   window". Both cannot hold for a warm-started window, so `LOG_ALWAYS = ['fileStart', 'fileEnd']` are kept unconditionally
   and everything else is filtered to `[t_first, t_last]`. If `compare.py` wants a strict window, drop `LOG_ALWAYS`.
7. **Guess: the shims smooth once per *analysis*, not once per quantum crossed.** The brief says "applied once per new
   render quantum boundary crossed"; Chrome (Blink `RealtimeAnalyser`) keeps a single boolean dirty flag, so crossing six
   quanta between two reads still advances the recurrence once. I matched Chrome, because "identical results for identical
   playhead" and "the real-time run must match the shim" both point that way, and `tools/test_shim.js` asserts the Chrome
   behaviour explicitly. At 60 fps / 48 kHz this is the difference between smoothing once and 6.25 times per frame — it
   would have changed `AU.slow`'s spectrum (τ = 0.3) materially.
8. **Lean changed: the shims floor the playhead to a render quantum.** The brief does not mention it. A real `AnalyserNode`
   only ever sees whole 128-sample quanta, so a frame-exact playhead would give the shim up to 127 samples the real node
   could not have had — and would have made the rt-vs-det agreement worse, not better, for no gain.
9. **Lean changed: `heardT` does not subtract `outputLatency` from `contextTime`.** Measured above; the brief's formula
   double-counts by 40 ms.
10. **`ENGINE.start('file', opt)` carries an options object where the other sources take a message string.** The frozen
    source interface is `start(src)`, and `&at=`/`&det=`/`&sync=` have to reach it somehow. `startFile(src, opt)` is
    additive and `ENGINE.start('file', {src, at, det, sync, msg})` keeps `ENGINE.start`'s two-argument shape.
11. **`engine/` may not import `core/`**, so the hash cannot be read in `sources/file.js`; `core/harness.js` parses
    `&track=` and calls `ENGINE.start`. And `sources/file.js` may not import `features-synapse.js` (that edge closes a
    cycle through `engine.js`), so `synapse/tap.js` exports `TAPS`, a registry of its instances, and the source reaches the
    live tap through it.
12. **`frame0` had to become a contract.** `f0 = 2` is now depended on by `tools/filetrace.js` and by every real-music
    screenshot recipe. It is `DET_HOLD_FRAME + 1`.
13. **The 44.1 vs 48 kHz trap.** `tools/work/SeeYouDrop.f32` is 44 100 Hz (the file's rate) and the engine runs at 48 000
    (the context's). `trackmap.py`'s truth times are in track seconds so they compare fine, but any *sample index* from the
    dump is not an index into what the engine heard.
14. **`npm test` does not run `tools/test_shim.js`** — `package.json` is not on my edit list. Run it by hand, or add it.
15. **HARNESS's "Landing tiles" expected line says `TILES 6`; it is `TILES 8` since GIELIS.** Not mine to renumber, but the
    row passes on 8 and the other three lines are exact.

### The temptation list (things I wanted to do and did not)

- Edit `features-slow.js` to take the section seed from an engine-owned PRNG (one line, the right fix) — out of scope.
- Add a `{file:'#sel', path:'…'}` step to `tools/cdp.js` instead of `tools/setfile.mjs` — out of scope.
- Add `tools/test_shim.js` to `npm test` — `package.json` out of scope.
- Use a real-input FFT (N/2 complex) in `shim.js` for ~2× — the measured cost is already inside budget and a second
  algorithm is a second place to be wrong.
- Down-rank `ENGINE.ms`'s double count in det mode by not draining `an.cpuMs` — that is `features-synapse.js`, not mine.
- Compensate the rt intro drop at 3.465 s, or the `bpm` octave error — E3/E4's job, not the plumbing's.
- Run `tools/accept.sh`. The user said to wait.

---

## (e) The exact commands

Every command in `docs/HARNESS.md` → **File source**. The ones the numbers above came from:

```bash
# the PCM dump the node tests use
python3 tools/truth/trackmap.py SeeYouDrop --pcm

# the shim, in node
node tools/test_shim.js                 # PCM=1 also runs the real dump

# determinism (acceptance 2)
PORT=8812 node tools/filetrace.js SeeYouDrop 0 60 tools/work/file-det-a.json
PORT=8812 node tools/filetrace.js SeeYouDrop 0 60 tools/work/file-det-b.json
cmp tools/work/file-det-a.json tools/work/file-det-b.json

# real time, same window, same recorder (acceptance 3)
PORT=8812 RT=1 node tools/filetrace.js SeeYouDrop 0 60 tools/work/file-rt-a.json

# real-time smoke (step 1): mode, presence, bpm, errs
PORT=8812 GPU=1 node tools/cdp.js 'track=SeeYouDrop' '[{"until":"window.CARD"},{"wait":2500},{"eval":"JSON.stringify({mode:CARD.ENGINE.AU.mode,sr:CARD.ENGINE.AU.file.sr,dur:CARD.ENGINE.AU.file.dur,presence:CARD.MS.presence,heardT:CARD.MS.heardT,fileOn:CARD.MS.fileOn})"},{"wait":18000},{"eval":"JSON.stringify({bpm:CARD.MS.bpm,bpmSyn:CARD.MS.bpmSyn,errs:CARD.ERRS,bad:CARD.nonFinite(),lat:CARD.ENGINE.AU.lat()})"}]'

# the latency sample DET_LEAD came from
PORT=8812 GPU=1 node tools/cdp.js 'track=SeeYouDrop' '[{"until":"window.CARD"},{"eval":"window.__L=[];(function s(){const A=CARD.ENGINE.AU,c=A.ctx;if(A.mode===\"file\"&&A.file&&A.file.frame0>=0)window.__L.push([c.currentTime-A.ctxHeard(),c.outputLatency,c.baseLatency,A.file.ph-CARD.MS.heardT]);requestAnimationFrame(s);})();1"},{"wait":25000},{"eval":"window.__L.length"}]'

# the pick path (a real CDP file pick) and the drop path
PORT=8812 GPU=1 node tools/cdp.js real '[{"until":"window.CARD"},{"wait":600},{"sh":"node tools/setfile.mjs /home/toma/Music/RetinaRave/SeeYouDrop.flac \"#file\""},{"wait":4000},{"eval":"JSON.stringify({mode:CARD.ENGINE.AU.mode,name:CARD.ENGINE.AU.file.name,presence:CARD.MS.presence,hidden:document.getElementById(\"landing\").classList.contains(\"hide\"),errs:CARD.ERRS,log:CARD.LOG.map(e=>e.type)})"}]'
PORT=8812 GPU=1 node tools/cdp.js real '[{"until":"window.CARD"},{"wait":600},{"eval":"(async()=>{const b=await(await fetch(\"/music/SeeYouDrop\")).arrayBuffer();const f=new File([b],\"dropped.flac\",{type:\"audio/flac\"});const dt=new DataTransfer();dt.items.add(f);const c=document.getElementById(\"landing\");c.dispatchEvent(new DragEvent(\"dragover\",{dataTransfer:dt,bubbles:true,cancelable:true}));const cue=c.classList.contains(\"drag\");c.dispatchEvent(new DragEvent(\"drop\",{dataTransfer:dt,bubbles:true,cancelable:true}));return \"dragcue \"+cue})()"},{"wait":4000},{"eval":"JSON.stringify({mode:CARD.ENGINE.AU.mode,name:CARD.ENGINE.AU.file.name,presence:CARD.MS.presence,errs:CARD.ERRS,bad:CARD.nonFinite()})"}]'

# the landing tiles row (must still pass)
PORT=8812 GPU=1 node tools/cdp.js real "$(cat tools/landing-steps.json)"
```
