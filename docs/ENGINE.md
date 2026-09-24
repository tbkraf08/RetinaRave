# Engine contract — audio in, `MS` out

The engine (`assets/engine/`) has no GL and no DOM. Every frame the core calls `ENGINE.frame(dt, now, nowMs)` and
gets back a filled `MS`, plus `GROOVE`. Scenes program against `MS` (§1 of CONTRACTS.md); this file is for whoever adds
an **analysis stage** or an **audio source**.

## `MS` — the music state vector

`MS` is one flat object. Its schema is `assets/engine/feats.js`:

```js
FEATS.bass = { kind: 'level', eli5: 'how strong the bass is right now',
               formula: 'pow(band(20-150Hz)/peakFollower, .8)·presence', drives: 'uBands.x, view scale', range: [0,1] }
```

`kind` tells you how to read it:

| kind       | meaning                                                                                  |
|------------|------------------------------------------------------------------------------------------|
| `level`    | 0..1, smoothed; safe to feed straight into a uniform                                     |
| `raw`      | unbounded number (bpm, angles unwrapped, seconds); scale it yourself                     |
| `event`    | `true` for exactly one frame (`dropEvt`, `beat`, `onset`, `sectionEvt`, …)               |
| `count`    | integer that only grows (`beatCount`, `sectionId`)                                       |
| `angle`    | radians                                                                                  |
| `enum`     | a string from `range` (`arc`: idle / valley / sustain / build / peak)                    |
| `vector`   | Float32Array or array (`chroma[12]`, `wave[2048]`, `peaks[4]` = [[Hz, amp], …])          |
| `internal` | a stage's own state parked on MS; scenes should not read it                              |

Rules:
- **Scenes read `MS` and never write it.** The test hook `CARD.fix` and the director's look memory (`seed.scene`) are
  the only writers outside the engine.
- **Every key of `MS` has a `FEATS` entry** — `tools/check.js` fails otherwise. Declare the default value in
  `assets/engine/state.js` (`MS = {...}`) so the schema is closed and the fake timeline leaves it finite and idle.
- `event` fields are cleared at the top of every frame by the v3 extractor; a stage that adds an event clears it
  itself at the top of its function.

## Frame order

```
ENGINE.frame(dt, now, nowMs):
  if fakeOn:  sources.fake.update(dt, now)          // #test: the deterministic 24 s timeline writes MS directly
  else:       sources.capture.tick(nowMs)          // silence watchdog
              updateMusic(dt, now)                  // v3 extractor: bands, onsets, tempo, arc, drops, harmony, tension,
                                                    //   surprisal, sections (features.js + tempo.js + features-slow.js)
  for stage of stages (registration order): stage.fn(dt, now, MS)
  if ENGINE.fix: Object.assign(MS, ENGINE.fix)     // test pins
  updateGroove(dt, MS)                              // GROOVE.rot = drift + sway + nod
  ENGINE.ms = ema(cpu ms of all of the above)
```

`dt` is clamped to ≤ 1/24 s; `now` is seconds on the rAF clock (all `*Evt` timestamps and refractory periods use it).

**Resume after a hidden tab (v0.3 resume-hold).** rAF does not run while the page is hidden, so the extractor's followers
freeze for the gap while the audio (and the worklet stage) keep going; the first frames back would read the step as an
onset, a drop or a surprise (the composite's glitch rows and flash — AUDIT-v0.2 §3). `main.js` calls `ENGINE.resume()` on
`visibilitychange` → visible; the next `frame()` stamps `ENGINE.resumeAt = now` (`ENGINE.resumed` is true for that one
frame) and, on the real path only: (1) `XS.holdUntil = now + 1` — for 1 s `updateMusic` sets no `onset`, `dropEvt` or
`surpriseEvt`; (2) `XS.reseed` — on that frame the spectral-flux baseline is the current spectrum (flux 0) and the slow
followers (`presence`, `eS/eM/eL/eMax`, `highM`, `build/buildPk`, the surprisal history model's mean/variance and its
band inputs, the section fingerprint) advance by the gap they missed (`dtF = dt + now − X.envNow`: as if the current
value had held throughout), so a stale `eM` cannot fire a drop once the hold ends; (3) `MS.hit` and `MS.dropEnv` are
zeroed (transients the gap outlived — the dt clamp would carry them across). The loop zeroes `FX.glitch/flash` on the
`resumed` frame. The fake timeline is untouched (it is a function of `now`; nothing in it was frozen), so `parity.js
fake` is 0 diff by construction; the real path is byte-identical to v3 until a `resume()` happens.

## Adding an analysis stage

```js
// assets/engine/features-<name>.js
import { ENGINE } from './engine.js';   // or register from main.js — either way it is one call
export function myStage(dt, now, S) {
  S.myEvt = false;                       // clear your own events first
  S.myLevel = ...;                       // only fields you declared
}
ENGINE.addStage('my', myStage, ['myLevel', 'myEvt']);
```

- `addStage(name, fn, feats)` throws at load if any declared feat has no `FEATS` entry.
- A stage may **only add** the fields it declares. It never overwrites a v3 field or another stage's field. The
  canonical owner of every concept both engines compute is v3 (`bpm`, `beat*`, `regularity`, `drop*`, `sectionId`,
  `identifyEvt`, `chroma`, `interval`, `tension` …). If your stage computes a rival estimate, give it its own name
  (`beatConf`, `bar`, `key`, `novelty`, …) — see DECISIONS.md for which one scenes should prefer and why.
- A stage that needs raw audio frames registers a tap on `AU` (`assets/engine/audio.js`): `AU.onInit.push(ctx => …)`
  runs once the `AudioContext` exists, with `AU.bus` as the node to tap (AnalyserNode or AudioWorklet). The v3
  analysers (`AU.fast` 2048, `AU.slow` 8192) stay as they are (parity).
- Budget: the whole engine must stay under 1.5 ms per frame (`CARD.ENGINE.ms`, `GPU=1`, 60 fps).
- **Tempo.** `bpm` (`engine/tempo.js`, v0.2 §9) reads within ±1 of the synth on every demo style (house 128, halftime
  140, dnb 174, fakeout 128, aba 124), locks in 2–4 s, and holds its octave through breakdowns, hushes and 16th-note
  builds; on beatless material it holds its last value and `regularity` stays low. `beatPhase`/`beatCount`/`beat` are
  the comb PLL on that tempo. `bpmSyn` is the synapse rival kept for comparison — there is no longer a case where a
  scene should prefer it (it is the one that wobbles in the dnb breakdown now). `tools/test_tempo.js` is the
  estimator's node test; `tools/tempo-trace.sh` the per-style trace (DECISIONS §9 has the before/after table).
  v0.3 §21: a 3:2 / 2:3 change (128 ↔ 192) is decided by the last 2.5 s of the envelope — the whole-window comb cannot
  see it for 8 s because the old tempo's 2l/4l harmonics sit on the new grid — three estimates (1.5 s) with the
  relative's beat lag > 0.3 and > 1.5× the current one switch it (4 s up, 3 s down in `test_tempo.js`).
- **Section renumbering (v0.3 §21).** Synapse's section ids are indices into its ring: a fresh section merged into a
  recognised return, or the 24-section ring shifting, renumbers them. The stage publishes the map for that frame as
  `sectionRenumber` (`map[old] = new`, −1 dropped, `null` otherwise); the director moves its look-memory keys,
  `prevAlt` and `due` through it (`core/scenes.js` memory()), so a return under the new id restores what was filed
  under the old one. `#test` logs `RENUMBER@` and `FILE@` lines; `director-stats.js` replays the maps.
- The fake timeline (`sources/fake.js`) leaves v3's `chroma`/`bchroma` at zero (v3's fake never filled them and parity
  forbids changing it) — chroma-driven scenes need a fallback from `harmAngle`/`interval` (TORUS does). Your own fields
  must be finite and plausibly idle there: add a line there that sets
  them from the timeline phase if scenes will read them headlessly.
- Textures derived from engine arrays (`uSpec`, `uWave`, `uHist`) are owned by the core: a stage writes the arrays in
  `TEX` (`state.js`: `{spec: Uint8Array(256), wave: Uint8Array(512), hist: Uint8Array(256*128), row, hop}`) and bumps
  `hop` when there is a new frame; the core uploads when `hop` changes and hands them to scenes as `ctx.engineTex`.
  `hist` is a ring: write exactly one row per hop at `row`, then advance `row` and `hop` together — the core sends only
  the `hop − lastHop` rows ending at `row − 1` (two `texSubImage2D` calls when they wrap; the whole texture only when
  ≥ 128 hops passed, e.g. a hidden tab). A stage that wrote rows without bumping `hop` by the same count would leave
  stale rows on the GPU (v0.2 §13; `tools/hist-check.js` compares the two).
- The synapse stage (`features-synapse.js`) is the worked example: `SYN_FEATS` lists its 54 fields, `synapseStage`
  copies `tap.an.A` into `MS` (`barPos/phrasePos/phrase16Pos` recomputed per frame from `A.beat` and the anchors —
  `grid()` refreshes them only every 16 hops; §10), drains `A.events` into `boundaryEvt/fakeoutEvt/moodEvt` (reset only
  when the analyzer exists, so the fake mirror's events survive on `#test`), fills `TEX`.

## Sources

A source is `{ name, start(), stop(), tick?(nowMs) }` in `assets/engine/sources/`, plugged in as
`ENGINE.sources[name]`. `start()` must call `initAudio()` and connect its output to `AU.bus`. The three that exist:

- `demo` — the v3 techno sketch (126 BPM, intro / groove / break / build / drop). Default for `fake=0`.
- `capture` — `getDisplayMedia` tab audio + the silence watchdog (`tick` swaps the demo in after 6 s of silence).
- `fake` — the deterministic `#test` timeline; `update(dt, now)` instead of audio.
- `demo-synapse` — synapse's six-style synth (house halftime dnb ambient fakeout aba, `mix` tours them), selected by
  `&demo=<style>` (`ENGINE.demoStyle`); without it `demo` runs, so `fake=0` parity with v3 holds.

`ENGINE.start('demo' | 'capture', msg)` is what the landing card calls; `AU.onRun(mode, msg)` / `AU.onStop(msg)` are the
UI hooks the core sets (the engine never touches the DOM).
