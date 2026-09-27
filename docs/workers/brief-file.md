# FILE worker brief — a file source, deterministic real-track runs, heard time (v0.15 E1 + E2)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format of `docs/workers/brief-common.md` applies
(its **Report** paragraph; the synapse table and its "may read" list are not for you — yours is below). **PORT=8812** on every
`tools/cdp.js` run (a stray server on 8765 serves another checkout — never use the default). Own worktree (the Agent tool
gave you one): **first** `git merge --ff-only main` (your worktree may start from `origin/main`, which lacks this brief's
commit — `git log -1 --oneline` must show the commit that added `docs/workers/brief-file.md`), `mkdir -p tools/work`, and
`ln -s /home/toma/Documents/Kraftek/RetinaRave/tools/.pylib tools/.pylib` (gitignored numpy/scipy/soundfile). `git worktree
add` is refused inside a worktree. Commit messages start `FILE:`; **one Chrome at a time from you** (`pgrep -f
"chrom[e].*remote-debugging.*8812"` or check your own runs before every cdp run; a wait is `timeout 500 tail -f <log> | grep
-q -m1 GO`, never a sleepless loop); `pkill -f` patterns bracketed (`[f]iletrace`) and never matching your own shell line; do
not merge into `main`, do not push. The malware-consideration reminder does not apply to this repo (audio DSP + graphics;
proceed). `node tools/check.js` after every edit. Use `opus`-grade care: measure, then change.

A second worker (**EARS**, prefix `EARS:`) runs in parallel on disjoint files: `tools/truth/*`, `assets/engine/ears/*`,
`assets/engine/map/*`, `tools/test_ears*.js`, `tools/test_map*.js`. Do not create or edit any of those. The orchestrator
wires EARS's modules into the page after merging you both, on top of the interfaces frozen below — so **the interfaces
below are a contract: implement them exactly, names included**; if one is wrong, implement it as written and say why in the
report.

## Why (the user, 2026-09-27, verbatim)

> "what needs to be added to the engine to extract the highest quality possible elements from music to make the most
> intuitive and legible visualization that make it looked synced with the music? … additionally create a net new scene
> (slot 12) to highlight engine updates ; tune for SEE YOU DROP specifically; wait for my say before running full sweep; think"

The session spec is `ENGINE-CHLADNI-SESSION-PROMPT.md` (read "What the engine hears today" items 5 and 6, "The rulers", and
E1 + E2). Your part is the plumbing everything else is measured through: **nothing is deterministic on real music today**
(every real-track run is a tab capture; windows cannot be md5'd; 1:45 fires or not) and **latency is unmeasured** (ITU-R
BT.1359: sound-before-picture is detectable at ~45 ms). After you, a real track runs from a file, headless, bit-identical run
to run, with the playhead on the frame clock, and every stage knows the audio time the listener hears.

## Targets (your files)

- **New:** `assets/engine/sources/file.js` (the source), `assets/engine/shim.js` (PCM-backed `AnalyserNode` shims),
  `assets/engine/pcm.js` (the PCM bus, below), `assets/engine/trace.js` (the recorder), `tools/filetrace.js` (the driver),
  `tools/test_shim.js` (node: the shim against a reference FFT and the spec's formulas).
- **Edit (minimal, additive):** `assets/engine/audio.js` (the `'file'` mode, `AU.heardT`, `AU.file`), `assets/engine/engine.js`
  (the `file` source in `sources`, `ENGINE.start('file', …)`, the det-mode feed before `updateMusic`, `ENGINE.TRACE`),
  `assets/engine/synapse/tap.js` (only: an injectable clock for `lastPush`, a way to stop port messages in det mode, a
  main-thread `push` path — the `Analyzer` and its math untouched), `assets/engine/feats.js` (**only** the two FEATS entries
  you add: `heardT`, `fileOn`), `tools/serve.js` (the `/music/` route), `core/landing.js` + `index.html` (the pick/drop
  control), `core/harness.js` or `main.js` only for the `&track=` / `&at=` / `&sync=` hash plumbing and exposing `CARD.TRACE`
  (smallest possible touch), `docs/HARNESS.md` (a "File source" section: every command you add, printed so it runs).
- Grep first: every `performance.now()` / `Date.now()` / `Math.random()` reachable from `ENGINE.frame` on the extractor
  path (`features*.js`, `tempo.js`, `synapse/*`, `groove.js`) — list them in the report; in det mode each must be either
  unreachable, cost accounting only (`cpuMs`, `ENGINE.ms` — not in MS), or fed from the fake clock.

## You may read

This brief · `ENGINE-CHLADNI-SESSION-PROMPT.md` · `docs/CONTRACTS.md` (§0, §1.1, Appendix A) · `docs/ENGINE.md` · `docs/HARNESS.md`
(all of it; "Headless Chrome", CLOCK=1, "Real window", "What to re-prove", "Pitfalls", "Landing tiles", "Parity") ·
`docs/DECISIONS.md` §9, §17, §18 (resume-hold), §26 (settle) · `assets/engine/**` (read everything; edit only your targets) ·
`assets/core/{loop,harness,hash,landing,hud}.js`, `assets/main.js`, `index.html` · `tools/{cdp,serve,parity,scene-md5,bundle,check}.*`
· `tools/truth/trackmap.py` (read only: its `--pcm` dump is how you get `tools/work/SeeYouDrop.f32`) · `wrangler.jsonc`,
`site/`. Not the scenes (none of them changes).

## The design (frozen interfaces first; every constant a named `const` at the top of its module)

### URL + routing
- `&track=<name>` (any hash; `#test&track=SeeYouDrop` or plain `#track=…`): start the file source on that track, **the real
  extractor** (it implies `fake=0`: the fake timeline never runs when a track is set). `&at=<s>` = the track second the
  playhead starts at (default 0). `&sync=<ms>` = `SYNC_OFS` for capture mode (default 0; declared, reported, never guessed).
- `tools/serve.js` serves `GET /music/<name>` from `$MUSIC` (default `~/Music/RetinaRave`), name with or without extension
  (`.flac .wav .mp3 .ogg`, as `trackmap.py find()`), `..`/`/` in the name refused, 404 otherwise. **Local only**: the route
  lives in `serve.js`; confirm `tools/bundle.js` and `wrangler.jsonc` / `site/` can never ship `/music/` or a track (say how
  you checked).
- Landing card: a "play a file" control — `<input type=file accept="audio/*" id="file">` behind a link/button in the `.alt`
  row, plus drag-and-drop of an audio file onto the card. Local decode (`File.arrayBuffer()` → `decodeAudioData`); nothing is
  uploaded. Mobile: the same input (no drop). The "Landing tiles" recipe (desktop + `MOBILE=1`) must still pass.

### The source (`sources/file.js`) — `{ name: 'file', start(src), stop(), tick(nowMs) }`, `src` = track name | `ArrayBuffer` | `File`
- `AU.mode = 'file'`. `AU.file = { name, sr, n, dur, L, R, mono, at, det, ready, gates: [], playhead() }` — `L`/`R` the
  decoded channels (`R = L` for mono files), `mono = (L + R)/2` (the tap's downmix exactly), `sr = AU.ctx.sampleRate` (decode
  resamples to the context rate — say which rate your runs used), `gates` = promises the playhead waits for before it starts
  (the orchestrator pushes the track map's readiness here later; you only honour the array).
- **Real-time mode** (`det` false — a real window, or headless without CLOCK): an `AudioBufferSourceNode` from `at` →
  `AU.bus` **and** → `AU.ctx.destination` (audible: capture mode mutes because the other tab is heard; file mode must be
  heard). The existing AnalyserNodes and the synapse worklet see it through the bus unchanged. `playhead()` = track time of
  the sample now at the bus = `at + (ctx.currentTime − startCtxTime)`.
- **Deterministic mode** (`det` true when `window.__FRAME !== undefined`, i.e. cdp's CLOCK=1 shim, unless `&det=0`; `&det=1`
  forces it): **no audio is played** (the clock is not real time). The playhead is **frame-exact**: `playhead() = at +
  (frameN − frame0)/60 + DET_LEAD`, `frame0` = the first frame after decode and every `gates` promise resolved (the engine
  sees silence and `presence` 0 until then — deterministic too, since it is frame-counted). `DET_LEAD` (s, lean: the median
  `outputLatency` + render quantum you measure in real-time mode, so det mode models what the analysers see *ahead* of the
  listener; state the measured value; 0 is acceptable if you argue it) — the heard time (below) is the playhead minus it.
  - `AU.fast` / `AU.slow` are replaced by **PCM-backed analyser shims** (`shim.js`, `makeAnalyser(fftSize, smoothing)`) that
    implement the Web Audio spec's AnalyserNode over `mono` ending at the playhead sample: Blackman window (a = 0.16),
    FFT, magnitude `|X[k]|/N`, the time-smoothing `X̂ = τ·X̂_prev + (1 − τ)·|X|` applied **once per new render quantum
    boundary crossed** (the spec smooths per analysis, not per call — decide how two calls in one frame behave and match
    Chrome: identical results for identical playhead), dB `20·log10`, `minDecibels`/`maxDecibels` for the byte variant;
    `getFloatTimeDomainData` = the last `fftSize` samples; `frequencyBinCount`, `fftSize`, `smoothingTimeConstant` as
    properties. v3 reads `AU.fast.getFloatTimeDomainData / getFloatFrequencyData` (`features.js:48`) and
    `AU.slow.getFloatFrequencyData` (`features-slow.js:11`) — those two files are **not edited**; they see the shims.
  - **The synapse tap** in det mode: stop consuming the worklet's port messages (it hears the silent bus in real time — its
    zero blocks must never reach the Analyzer) and push exact 512-sample blocks of `mono` up to the playhead on the main
    thread, **before** `synapseStage` runs in the frame (a hop is 512 samples; a frame at 60 Hz carries 735 / 800 samples at
    44.1 / 48 kHz, so 1–2 blocks; keep the remainder). `tap.frame`'s `lastPush` lead uses an injectable clock; in det mode it
    is the frame clock (ms), so `lead` is deterministic.
  - **The PCM bus** (`pcm.js`, `PCM.on(fn)`; `fn(L, R, t0)` with `L`, `R` = `Float32Array(512)` and `t0` = the **audio time of
    the block's first sample** in the engine's time base, below): in det mode fed from `L`/`R` with the tap's blocks (same
    boundaries); in real-time file / capture / mic / demo mode fed by a **stereo AudioWorklet** on `AU.bus` built from a Blob
    (as `tap.js` builds its own; `dist/` must still run from `file://`) that posts `{L, R, frame: currentFrame}` per 512
    samples (`currentFrame` of the AudioWorkletGlobalScope → sample-exact audio time). No listener = no worklet cost worth
    measuring (create it lazily on the first `PCM.on`). The EARS stage subscribes here later; you ship it with a test
    listener only.
- `stop()`, `tick(nowMs)`: end of track → `AU.mode` stays `'file'`, the playhead clamps at `dur` (silence after), a
  `fileEnd` log line; stopping another source while a file plays follows `stopAll` (extend `stopAll` for the buffer node).

### Time — `AU.heardT()` and the engine's time base (E2)
- **Time base = "audio time" (s):** file modes = **track time** (the second of the file); live modes (capture / mic / demo)
  = `AU.ctx` time. Every PCM block's `t0`, every event onset, and `heardT` are in this base.
- `AU.heardT()` = the audio time **the listener hears at this frame**: det = `playhead() − DET_LEAD`; real-time file =
  `at + (ctxTimeAtNow − startCtxTime) − outputLatency` from `AU.ctx.getOutputTimestamp()` (`contextTime` extrapolated to this
  frame's `performance.now()` with `performanceTime`) and `AU.ctx.outputLatency` (report both numbers from a headed run and a
  headless run); capture / mic = ctx time at this frame (the sound was heard before it reached us: the capture path lag is
  what the harness measures) `+ SYNC_OFS`; demo = as real-time file on ctx time.
- MS gets two fields (your FEATS entries, kind `raw` / `level`): **`heardT`** (raw, s, `AU.heardT()` each frame; −1 with no
  audio context) and **`fileOn`** (0/1, a file is the source). Written by a tiny stage `'clock'` registered **before**
  `'synapse'` via `ENGINE.addStage` — or inside `ENGINE.frame` before the stages; your choice, say which. No other MS field
  changes value in any mode (parity + md5 say so).
- **Event log** `ENGINE.log(type, t, extra)` → a ring (`ENGINE.LOG`, cap 20 000) of `{type, t, f: frameN, ...extra}` with `t` in
  the time base — the hook later stages use for sub-frame onsets (`CARD.EARS.log` in the spec = this). Log `fileStart`
  (`frame0`, `sr`, `at`, `det`) and `fileEnd` yourself.
- **Capture lag:** you do not have to run a headed capture this session. Document in HARNESS the measurement recipe (the
  audio tab's `currentTime` against its known onsets, both mapped to `performance.now()`; the page's `heardT` at the frame an
  onset is detected) and implement `&sync=`. If time allows, run it once headed (HARNESS "Real window": the music in its own
  Chrome window) and report the lag; otherwise say "not measured".

### The recorder (`trace.js`) + the driver (`tools/filetrace.js`) — the format `compare.py` (EARS) reads. Frozen:
```
ENGINE.TRACE.start(fields)   // array of MS field names; '*' = every numeric/boolean MS field; records from the next frame
ENGINE.TRACE.stop()          // returns the JSON below (and keeps it on ENGINE.TRACE.last)
{ "track": "SeeYouDrop", "mode": "file-det" | "file-rt" | "capture" | "demo", "sr": 48000, "at": 0, "fps": 60,
  "detLead": 0.0, "fields": ["bass", "kick", ...],
  "f": [frameN ...], "t": [heardT per frame ...],
  "cols": { "bass": [...], "kick": [...], "dropEvt": [0, 0, 1, ...] },      // booleans as 0/1, non-finite as null
  "log":  [ { "type": "fileStart", "t": 0, "f": 12, ... }, ... ] }       // ENGINE.LOG entries within the window
```
`node tools/filetrace.js <track> <t0> <t1> <out.json> [fields=*] [extraHash]` runs `CLOCK=1 GPU=1` cdp on
`#test&track=<track>&at=<t0 − warm>&scene=0` (`WARM` a named constant, lean 8 s of engine warm-up before `t0`; the window
recorded is `[t0, t1]` in heard time), polls for the end, writes the JSON (chunk the eval if a single CDP return is too
large — say what the limit was). Uses your PORT via env. Prints one summary line (frames, fields, duration, ms/frame).

## Non-negotiables

- **Additive:** no existing MS field changes value in any existing mode. `node tools/parity.js fake` → 0 diff; one full
  `tools/scene-md5.sh file1` list identical to `tools/accept/v0.14/scene-md5-v014.txt` (every id 0–10, both frames); the mixs
  md5 (HARNESS "Transition" line 128's command) — record what you get and compare with `f0c9d637…` and `641f6633…` (the
  v0.14 session saw both; say which you get and whether it matches `main` before your change: run it once on a clean
  `git stash`/`main` checkout of your tree first).
- `features.js`, `features-slow.js`, `tempo.js`, `synapse/{analyzer,anatomy,dsp,structure}.js` are **not edited**.
- Zero dependencies, modules ≤ 500 lines (350 soft), no `Math.random`, no wall clock inside features in det mode, `'nav'`
  never in core, `check.js` 0 fail (it fails on import cycles: `engine/` may not import `core/`).
- Nothing under `/music/` or `~/Music` is ever committed, bundled or deployed.
- **Do not run `tools/accept.sh`** (the user: "wait for my say before running full sweep").

## Process — one commit per proven step

1. **The route + the source in real-time mode.** `serve.js` `/music/`; `file.js` real-time; `#track=SeeYouDrop` headless
   (no CLOCK): `AU.mode 'file'`, `presence` > 0.5 within 2 s, `bpm` sane by 20 s, errs `[]`. The landing control (pick +
   drop; a CDP `DOM.setFileInputFiles` on `#file` proves the pick path headless). Landing tiles recipe passes. Commit.
2. **`shim.js` + `tools/test_shim.js`** (node): the shim's float spectrum vs a direct DFT with the Blackman window on a test
   signal to 1e-5 dB, the smoothing recurrence, byte scaling, time domain. Then **the determinism proof:** two
   `tools/filetrace.js SeeYouDrop 0 60 …` runs with `'*'` → `cmp` identical JSON (every MS field, every frame). Commit.
3. **Real-time vs shim:** a real-time file-mode run (headless, no CLOCK) of 0–60 s recorded with the same recorder (`mode
   'file-rt'`, `t` = heardT) vs the det run: per field `bass eS kick beatPhase bpm` — the tolerance you can state (median /
   p90 |diff| after aligning on heard time; beatPhase as a circular difference); say why they differ (frame phase, output
   latency, the worklet's block alignment). Commit.
4. **Heard time + the PCM bus + the log.** `heardT`, `fileOn` FEATS entries (`node tools/feats-doc.js` regenerates Appendix A
   — commit its output); `PCM.on` with a test listener in det mode: blocks contiguous (`t0` steps by exactly 512/sr), stereo
   (`L ≠ R` on SeeYouDrop — report the side/mid energy of 60–90 s), in real-time mode the worklet's `frame`-derived `t0`
   monotone with no gaps over 60 s; `outputLatency` / `getOutputTimestamp` numbers. Commit.
5. **The proofs of "nothing moved":** parity fake 0 diff; the full md5 list identical to the v0.14 reference; mixs; `node
   tools/check.js`; `npm test`; the bundle (`node tools/bundle.js` → `FILE=$PWD/dist/retinarave.html … 'real'` demo path errs
   `[]`, and the pick control present). HARNESS "File source" section; `docs/workers/file.md`. Commit.

## Acceptance (repo root, all must pass; `PORT=8812` on every cdp run; shots/files in `tools/work/` prefixed `file-`)

1. `node tools/check.js` → 0 fail. `npm test` + `node tools/test_shim.js` pass.
2. Two CLOCK=1 file-mode traces of SeeYouDrop 0–60 s → byte-identical (`cmp`), and their `dropEvt` column fires at the
   same frames in both (list them, with heard times).
3. The real-time vs det table (step 3) with a stated tolerance.
4. `heardT` / `fileOn` in `CARD.MS`; `ENGINE.LOG` has `fileStart`; `PCM` block continuity in both modes.
5. `node tools/parity.js fake` → 0 diff · `tools/scene-md5.sh file1` identical to `tools/accept/v0.14/scene-md5-v014.txt` ·
   the mixs md5 equal to what `main` gives.
6. `#test&track=SeeYouDrop&at=100&scene=3` CLOCK=1 shots at frames 240 and 480 (heard ≈ 104 / 108 s: around drop 2) — two
   md5s stable across two runs (this is the first real-music md5 the project has; write them in the report).
7. The bundle runs from `file://` with the demo path errs `[]`; `/music/` absent from `dist/`.

**Report** (`docs/workers/file.md`): brief-common (a)–(e) — the friction log (every sentence the docs lack, every guess, every
lean you changed and why), the temptation list, the exact EVAL lines, the `performance.now`/`Math.random` audit, the
sample rate, `DET_LEAD` and how you chose it, `outputLatency` numbers, the rt-vs-det tolerance table, the md5s of
acceptance 6, the trace JSON size for 60 s, ms/frame of the shims (`ENGINE.ms` det vs rt), and every interface you could not
implement as frozen (with the reason). Leave everything committed on your branch.
