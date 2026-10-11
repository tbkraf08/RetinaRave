# FLUID diagnosis — the 2026-10-09 recording (`retinarave-v0.34-fluid-2026-10-09T14-50-22.webm`)

Diagnosis only; no code changed (HEAD 55548b5). Artefacts under `tools/work/fluid-diag/` (gitignored): the 2 fps montage,
three 5 fps strips, the spectrogram, the engine's input audio (`rec-audio-48k.wav`), the two traces, the replay tool, the tables.

## Summary (for the orchestrator)

**The grammar is not missing frames of the music — it has no channel for this music.** The take is tab-capture mode
(sidecar `source "capture"`; 60 fps, tier 2, ink rendered: (f) dead). Its audio track is exactly what the engine heard (the recorder taps `AU.bus`): **a sustained low-mid
pad/bass-chord piece** — trackmap sub 0 %, bass 20 %, low-mid 75 %, mid 4 %, high 0 %; 2–12 kHz at −63 dBFS; two 42 Hz kick
tails in 22 s, no beater clicks. Not a library track, not the demo; 0–2.53 s is digital silence.

Re-running the engine on that audio as a file source on the live lanes (`&map=0`, cold, `CLOCK=1`) and replaying
`inject.js`'s `plan()` reproduces the take to the frame: the only channel that fires is the **snare lane**, six floor-sized
hits (amp .34–.44, floor .31; five of them are the recording's p99 jumps at 11.6 / 17.9 / 18.7 / 23.6 / 23.9 s, within 0.05 s), plus a burst at 2.52 s as the signal steps out of silence (the "slight stuff"). **The sub gate never opens** (22–70 Hz
share 0.0012 vs 0.30), **no kick** after the step (the lane needs a ≥ 5 dB 60–150 Hz rise with a 2.5–8 kHz click), **no
hat**. **Zero splats on 17 of 22 seconds.** 17–18 s "working" = two snare shears; 19–21 s "miss" = the same chord attacks
rising 2.5–2.9 dB under the fixed 3.75 dB `SNARE_RISE` (not a refractory, not an AGC); the wings growing 19–22 s are the
18.7 s ink advected, 0.00 uv/s injected. Gates and warm-ups are not the cause (g ≥ .63 from 3 s, hush 0, calm ≤ .2 after 4 s).

**Root cause: the grammar maps sub, kick, snare, hats, drop, beat — nothing for pads, chords, mids, vocals: 95 % of this
track.** Smallest fix: a dye-only "harmonic floor" from `mid`/`eS` (moves only FLUID's two md5 lines, no roster trail moves);
then a chord-onset channel from the v1 `snare`/`hit` levels (all 26 lines move). Ranked list in §9.

## 1. The recording

| field | value | source |
|---|---|---|
| container | vp9 1282×1310 @ 60 fps + opus 48 kHz stereo, 39.1 MB, 24.54 s of audio | ffprobe |
| sidecar | `version 0.34.0` (HEAD's `VER`), `started 2026-10-09T14:50:22.293Z`, `durationS 24.601`, **`source "capture"`, `track null`**, `size [1282,1310]`, `render [1282,1309]`, `dpr 0.75`, `fps 60`, `frames 1475`, `q 0.75`, `q0 1`, `bps 30e6`, `scenes [{t 0, id 12, name fluid}]`, `flags {lead true, shade true, clock "pcm", map true}` | the Matroska COMMENT tag (`rec.js` sidecar) |
| frame rate | 1475 / 24.601 = 59.96 fps — nothing dropped | |
| window | 1282×1309 render at dpr 0.75 = a 1709×1745 CSS window (near-square portrait; a 75 % zoom or a tall window). Tier 2 at q .75 (`quality.js` `tier()`): sim short edge 128 → ≈125×128, dye ≈501×512. **Not** 1×1: ink is visible from f156 on, so `G.FLOAT` targets existed and the step ran | `fluid.js` SIM / DYE tables |
| `flags.map` | `ENGINE.useMap` (the *setting*), not `mapOn`. In capture mode `features-ears.js:140` clears `mapOn` and every map field: `mapDropEvt` is never set | |

**The audio = the engine's input.** `rec.js` taps `AU.bus` through one `MediaStreamAudioDestinationNode`; `capture.js`
connects the captured stream straight into `AU.bus`. What is in the webm's audio track is, sample for sample, what the ears,
the loudness stage, the PCM clock and the tongues analysed.

## 2. What the audio is (step 1 + step 4)

- **0 → 2.529 s: digital zero** (every sample 0). The tab had not started playing when `R` was pressed. `presence` 0, `g` 0.
- **From 2.53 s: −17 dBFS rms, steady**, abrupt start (−18 dBFS in its first 0.25 s block).
- Band powers (0.25 s, dBFS; `tools/work/fluid-diag/rec_bands.txt`): sub 30–90 Hz **−46**, low 90–200 **−23**, mid 200–2000
  **−18**, hi 2–12 kHz **−63** (bursts to −35…−42 at 14.5 s, 18.0–20.9 s, 24.0 s; the click band 2.5–8 kHz reads −45 there and
  −66 elsewhere). The mid drops out for 1.5 s at 10.0–11.5 and 22.0–23.5 s (the low stays).
- `trackmap.py rec` (default grains; `tools/work/fluid-diag/trackmap-rec.txt`, `trackmap-rec-grains/`): *loud half: sub 0 %
  bass 20 % lm 75 % mid 4 % high 0 % · bass f0 116.1 Hz A#2 held 42 % · centroid 218 Hz · tempo 115.4 (percussive) / grid
  119.7 bpm coherence 0.198 (weak) · tonic A# major conf 0.064 (Gm +0.478 next) · sub note runs: none ("." for 227 steps) ·
  onsets low 12 / click 9 / mid 49 / high 4 · sections 0.06–14.04 and 14.04–23.9 s · drops: one "absence" at 2.027 (the
  signal start)*.
- Kick tails (36–52 Hz envelope peaks, where a 150→42 Hz kick lands): **2 in 22 s**, at 18.83 and 24.32 s.
- Chords (peaks 100–700 Hz per beat-block): Bb-D, A-C, Bb-D, C-Eb, D-G-Bb, C-Eb … a G-minor / Bb set, all ~+20 cents.
- **Not in the library**: 1 s windows, 60–2500 Hz, normalised cross-correlation against every track at nine speeds
  0.976–1.024: max 0.22 at 1.000×; the only value above 0.3 is Comptine at 1.012× (0.43) and its best offsets per window are
  98.6 / 121.1 / −4.0 / 24.4 / 33.8 / 84.5 … s — a self-similar piano piece matching generic patterns, not a hit (a true hit
  gives one offset; the control SeeYouDrop-against-itself gives 1.00). The envelope match that first said "SeeYouDrop at
  53.1 s" (score 0.545, second-best 0.445) was spurious: the waveform ncc there is 0.05. **Track identity: unknown, not one
  of the seven; offset: the recording's own clock is the only time base (rec t = track t for the engine).**
- **Not the demo synth**: the silent-capture watchdog starts `demo.js` only after 6 s with nothing heard; sound arrived at
  2.53 s, so `AU.heard` latched and the demo never ran. The audio confirms it: every demo style puts a kick on every beat
  (0.47–0.48 s) in its groove/drop and `demo.js`'s chords are Am / F / C / G; this has two kick tails in 22 s and Gm / Cm / Bb.

## 3. The mode and what the grammar reads (step 2)

Capture mode = the **live causal lanes** for everything; the map fields do not exist. What each `FLUID_FEATS` read is in
this mode, its warm-up, and what it did on this take (from the trace `rec-live.json`, per-second means in
`rec-live-persec.txt`):

| read | capture-mode source | warm-up / gate | on this take |
|---|---|---|---|
| `subGate subNote subHz subGlide bassReg` | `ears/sub.js`: YIN on a 22–100 Hz low-pass; gate = RMS ≥ `GATE_ON` 0.020 × running p90 **and** the 22–70 Hz share of (22–70 + 70–150 + 150–600) ≥ `GATE_SHARE_ON` 0.30 | the p90 is a ~32 s follower (cold = the first blocks) | share median **0.0012**, p90 0.0023, max 0.0028 → the gate opened only on the silence step (90 % of second 2, `subHz` 15 Hz — a YIN artefact) and never after 3.1 s |
| `kickEvt kickAmp kickAge` | `ears/perc.js` LOW lane: 60–150 Hz rise ≥ `KICK_RISE` 5 dB over an 8-hop median, plus a 2.5–8 kHz click ≥ 1 dB within 25 ms, or a clickless onset on the PCM clock's beat line at conf ≥ 0.85 (§90). `kickAmp` = rise / 16 dB, floor 0.31 | none (no running quantile since §70) | **1 kickEvt in 24 s**, at 2.517 s (the step, amp 1.00). The band analysis finds 0 kick-like frames 3–24 s except one each at 10 and 22 s (the mid dropouts); the clock jumped 124 → 157 bpm at 18 s so the line rule had no confidence. Truth low onsets 12 → coverage 1/12, and that one is not a kick |
| `snareEvt snareAmp` | SNARE lane: the min of the 150–600 and 150–2500 Hz rises ≥ `SNARE_RISE` 3.75 dB, refractory 75 ms; `snareAmp` = rise / 12 dB, floor 0.31 | none | **7 fires**: 2.03, 2.52, 2.62 (the step) then 8.60 (.34), 11.55 (.44), 17.92 (.34), 18.67 (.40), 23.55 (.43), 23.92 (.36). Truth mid onsets 49 → 6/49 after the step. The seconds with no fire have max two-band rises of 0.4–3.5 dB |
| `hat2 denH` | synapse's hat hits (5–12 kHz HPSS flux) | — | hat band −63…−67 dBFS → `hat2` > .3 on 35 % of second 2 only (the step); 0 after 3.1 s; `denH` 1–5 (meaningless without hits) |
| `presence loudRel hush calm` → `g` | extractor / `loud.js` (3 s window, relative in capture: `loudAbs` 0) | the loudness window fills in 3 s | `g` 0 (silence) → 0.15 (s2) → 0.63 (s3) → 0.75 → ≥ 0.80 from s5; `presence` 1 from 3.0 s, `loudRel` .76–.89, `hush` 0 throughout, `calm` .75 → .10 over s2–s5, 0 after 10 s. **Never a gate** |
| `tongueOn tongueAmbig` | `features-tongues.js`: 16 beats of the PCM clock | 16 beats; cleared on a clock re-seat | 0 → 0.6 (s8) → 1 (s9–s16) → 0.5 → **0 from s18** (the clock re-seated 124 → 157 bpm). `tongueAmbig` .81–1.0 (nothing locks) → `dyeDiss` 1.0 → .54 → **.13–.23 for s9–s16** → 1.0. Only effect: ink lingers (the void rule), no injection |
| `buildLive dropLiveEvt` | `engine/build`: `MIN_HIST` 32 s of music | 32 s | 0 / never |
| `mapDropEvt` | file+map only | — | never set (capture): the §107 clear can only come from `dropLiveEvt` on a live night |
| `beatPhase beatCount bpm` → the breath | the PCM clock | — | bpm 124 (s0–17) → 139.6 → 157–159 (s18–24): the clock moved; the breath ran at −0.09…−0.13 mean, a continuous kneading with nothing to knead |
| `tension lpSweep` → `curl velDiss` | roughness 30 s p10/p98; synapse's sweep | 30 s | `curl` 11–50, `velDiss` 0.20 after s3 — parameters, not sources |
| `key mode keyConf tonicConf valence harmAngle modeShade` → the colour | ears tonic / synapse | 2 s ema | key 5 → 11 → 10 (lilac/magenta) → 3 (cyan at 23.5 s): the colour changes the eye saw |
| `seed` | engine | — | the hats' x only |

So in this mode the grammar's injecting channels are: the sub emitter (shut), the kick (silent), the snare (six threshold
hits), the hats (silent), the drop (impossible without `buildLive`), and the breath (a body force that cannot create ink).
**There is no read of `mid`, `bass`, `high`, `eS`, `rms`, `hit`, `kick`/`snare`/`hat` (the v1 levels), `novelty` or `chroma`.**

## 4. Reproduction (step 3)

No grammar change: the recording's audio is served as a track and the pure `plan()` is replayed over the MS trace.

```
ffmpeg -i <take>.webm -vn -c:a pcm_s16le tools/work/fluid-diag/rec-audio-48k.wav       # the engine's input, 48 kHz stereo
MUSIC=<dir holding rec.wav> WARM=0 PORT=8816 node tools/filetrace.js rec 0 24.4 rec-live.json '<FLUID_FEATS + mapOn,dropEvt,loudS,loudPk,loudAbs,loudRange,eS,bass,mid,high,liveT,kickVel,snareVel,hatVel,rms,heardT,fileOn,dropLiveIn,subIn,subOut,hat,kick,snare,clarity,arc>' '&map=0'
node tools/work/fluid-diag/replay.mjs rec-live.json 0 25 sec       # per second · 'events' = every frame with a splat · 'frame' = every frame
```
`&map=0` is HARNESS's "the live path on a file": causal ears, no map, deterministic under `CLOCK=1` (1464 frames, 57 fields,
`fileStart` f0 2). Differences from the user's capture session: `heardT` through `DET_LEAD` rather than `SYNC_OFS` 0.027, the
display lead 40 vs 0 ms, `loudAbs` 1 vs 0 (the grammar reads `loudRel`, which is gain-invariant) — all ≤ 45 ms placements.

**Alignment proof** (replay event → the recording's p99 luminance per 0.1 s, `tools/work/fluid-diag/montage.jpg` and the
strips): 11.550 s snare → **11.6 s: 36 → 100** (f696); 17.917 → **17.9: 38 → 97** (f1074); 18.667 → **18.7: 81 → 109**
(f1122); 23.550 → **23.6: 50 → 112** (f1416); 23.917 → **23.9: 101 → 129** (f1434); the 2.517–3.1 s burst → the two faint
pink blobs from f156 and the p99 29 → 36 at 3.1–3.5 s. One replay event has no counterpart: 8.600 s (amp .34, the smallest
possible) — the recording's p99 stays 38; the lanes' 8-hop baselines sit differently between a cold deterministic run and the
user's session, and a hit at the floor is where that shows. Five of six, within 0.05 s: the reproduction is the take.

The FLUID scene's own injections on this take: the ring needs `mapDropEvt || dropLiveEvt || (mapOn ≤ .5 && dropEvt)` — all 0
(the extractor's `dropEvt` never fired; trackmap's only "drop" is the silence step); the sparkle needs `hat2 > .3` — second 2
only.

## 5. The three-way table, per second (step 5)

audio = the recording's own bands (dBFS, 0.25 s means) · truth = trackmap onsets per class · ears/grammar = the replay ·
rec = the frames (mean Y of the whole frame / max p99 per second, 160 px grey; the empty pool reads ~29 at exposure 0.9, 16.5
at the ladder's bottom).

| s | audio rms / sub / low / mid / hi | truth low/mid/high | subGate | kickEvt (amp) | snareEvt (amp) | hat2>.3 | g | splats | Σ\|dv\| uv/s | dyeDiss | tongueOn | rec Y / p99 | what the frames show |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | silence | 0/0/0 | 0% | 0 | 0 | 0% | 0.00 | 0 | 0.00 | 1.00 | 0 | 17 / 31 | dark pool, a faint green residue (ink from before R) |
| 1 | silence | 0/0/0 | 0% | 0 | 0 | 0% | 0.00 | 0 | 0.00 | 1.00 | 0 | 16 / 30 | same |
| 2 | starts at 2.53 s | 1/1/1 | 90% | 1 (1.00) | 3 (0.74 1.00 1.00) | 35% | 0.15 | 125 | 3.74 | 1.00 | 0 | 16 / 29 | f152 signal; two faint pink blobs at x .3/.7 from f156 |
| 3 | −17 / −46 / −23 / −19 / −63 | 0/0/0 | 10% | 0 | 0 | 2% | 0.63 | 9 | 0.49 | 1.00 | 0 | 22 / 39 | the faint pair; the pool brightening (exposure on loudRel) |
| 4 | −17 / −46 / −24 / −18 / −63 | 2/4/0 | 0% | 0 | 0 | 0% | 0.75 | 0 | 0.00 | 1.00 | 0 | 27 / 41 | pair fading; flat grey from ~4.5 s |
| 5 | −18 / −46 / −23 / −19 / −63 | 0/3/0 | 0% | 0 | 0 | 0% | 0.80 | 0 | 0.00 | 1.00 | 0 | 29 / 42 | flat grey, nothing |
| 6 | −18 / −47 / −22 / −21 / −63 | 0/1/0 | 0% | 0 | 0 | 0% | 0.83 | 0 | 0.00 | 1.00 | 0 | 29 / 41 | nothing |
| 7 | −17 / −46 / −22 / −19 / −63 | 0/1/0 | 0% | 0 | 0 | 0% | 0.85 | 0 | 0.00 | 1.00 | 0 | 29 / 39 | nothing |
| 8 | −17 / −49 / −22 / −19 / −65 | 0/2/0 | 0% | 0 | 1 (0.34) | 0% | 0.86 | 2 | 0.35 | 0.54 | 0.6 | 29 / 38 | nothing (the replay's 8.6 s floor hit did not show — §4) |
| 9 | −17 / −51 / −22 / −19 / −67 | 0/5/0 | 0% | 0 | 0 | 0% | 0.86 | 0 | 0.00 | 0.23 | 1 | 29 / 38 | nothing |
| 10 | −20 / −46 / −21 / −51 / −63 | 1/1/0 | 0% | 0 | 0 | 0% | 0.87 | 0 | 0.00 | 0.17 | 1 | 29 / 38 | nothing (the mid drops out) |
| 11 | −20 / −47 / −22 / −40 / −63 | 1/1/0 | 0% | 0 | 1 (0.44) | 0% | 0.88 | 2 | 0.46 | 0.13 | 1 | 29 / 100 | **f696 (11.6 s): two bright lilac blobs at x .3/.7, mid height** |
| 12 | −18 / −46 / −22 / −21 / −63 | 0/3/0 | 0% | 0 | 0 | 0% | 0.88 | 0 | 0.00 | 0.14 | 1 | 28 / 88 | the pair, fading slowly (void: dyeDiss .13) |
| 13 | −17 / −46 / −24 / −18 / −63 | 3/6/0 | 0% | 0 | 0 | 0% | 0.89 | 0 | 0.00 | 0.17 | 1 | 29 / 105 | the pair, fading |
| 14 | −17 / −46 / −23 / −18 / −51 | 1/2/0 | 0% | 0 | 0 | 0% | 0.89 | 0 | 0.00 | 0.20 | 1 | 30 / 81 | the pair, faint |
| 15 | −17 / −46 / −23 / −19 / −58 | 0/0/0 | 0% | 0 | 0 | 0% | 0.90 | 0 | 0.00 | 0.20 | 1 | 30 / 58 | traces |
| 16 | −17 / −46 / −24 / −18 / −63 | 1/6/0 | 0% | 0 | 0 | 0% | 0.90 | 0 | 0.00 | 0.18 | 1 | 30 / 46 | traces |
| 17 | −18 / −46 / −23 / −19 / −56 | 0/4/1 | 0% | 0 | 1 (0.34) | 0% | 0.90 | 2 | 0.37 | 0.57 | 0.5 | 30 / 97 | **f1074 (17.9 s): a bright magenta pair** |
| 18 | −18 / −46 / −22 / −20 / −39 | 0/2/0 | 0% | 0 | 1 (0.40) | 0% | 0.91 | 2 | 0.44 | 1.00 | 0 | 32 / 109 | **f1122 (18.7 s): a second pair on top; wings begin** |
| 19 | −17 / −46 / −22 / −18 / −40 | 0/2/0 | 0% | 0 | 0 | 0% | 0.91 | 0 | 0.00 | 1.00 | 0 | 32 / 103 | the wings grow by advection — **no new ink** |
| 20 | −17 / −48 / −22 / −19 / −42 | 0/1/1 | 0% | 0 | 0 | 0% | 0.91 | 0 | 0.00 | 1.00 | 0 | 33 / 118 | wings spreading downward, no new ink |
| 21 | −17 / −51 / −21 / −20 / −65 | 1/1/0 | 0% | 0 | 0 | 0% | 0.92 | 0 | 0.00 | 1.00 | 0 | 34 / 109 | wings, fading |
| 22 | −21 / −46 / −21 / −52 / −63 | 1/1/0 | 0% | 0 | 0 | 0% | 0.92 | 0 | 0.00 | 1.00 | 0 | 32 / 91 | wings fading (the mid drops out) |
| 23 | −20 / −47 / −22 / −39 / −56 | 0/2/1 | 0% | 0 | 2 (0.43 0.36) | 0% | 0.91 | 4 | 0.86 | 1.00 | 0 | 30 / 129 | **f1416 / f1434 (23.6 / 23.9 s): two cyan pairs** (key anchor moved) |
| 24 | −18 / −46 / −23 / −20 / −40 | 0/0/0 | 0% | 0 | 0 | 0% | 0.91 | 0 | 0.00 | 1.00 | 0 | 31 / 125 | cyan pair |

Totals 3–24 s: **0 splats on 17 of 22 seconds**; 12 splats in all, every one a snare shear; Σ|dv| 2.5 uv/s over 22 s against
SeeYouDrop's groove at 60–80 splats and 8–12 uv/s **per second** (§6).

### The three windows the user named

- **0–12 s ("slight stuff, then nothing till 12 s, but there is sound").** 0–2.53 s is silence in the audio too. At 2.52 s
  the lanes all fire on the step from digital zero to −17 dBFS (kick 1.00, three snares 0.74–1.00, `hat2` .76, the sub gate on
  a 15 Hz YIN ghost) while `g` is still 0.01–0.5: that burst is the faint pink pair at x .3/.7 (f156–f270) — the "slight
  stuff", an artefact of the start, not music. From 3 s the music is pads and bass chords: truth mid onsets 17 in 3–11 s, the
  snare lane's best two-band rise per second 0.9–3.1 dB (< 3.75), no click, no sub share → **0 splats for 8 s**. The pool
  brightens 16.5 → 29.7 (3.0–6.0 s) because the exposure follows `loudRel` as the loudness ruler fills — light, not ink. The
  first visible event is the 11.55 s chord attack (rise 5.8 dB, amp .44): f696.
- **17–18 s ("seems like it is working").** Two chord attacks clear the lane: 17.917 s (.34) and 18.667 s (.40) — f1074 and
  f1122, the magenta pairs. A high-band layer enters (click band −45 dBFS, MS `high` .5–.6): `hat2` stays 0 (the hat lane is
  5–12 kHz flux; this layer is 2.5–8 kHz), so no droplets and no sparkle. The 42 Hz kick tail at 18.83 s has no click and the
  60–150 Hz band, held at −22 dBFS by the bass pad, does not rise 5 dB: no `kickEvt`; the clock re-seated to 157 bpm in the
  same second, so the §90 line rule had no confidence either.
- **19–21 s ("misses the same sounds").** Truth mid onsets at 19.42, 19.52, 20.16 (+ a high at 20.16), the same chord
  texture at the same level (mid −18 dBFS). The lane's maximum two-band rise: **2.5 dB (s19), 2.9 (s20), 2.1 (s21)** against
  the fixed 3.75 dB — the attacks are softer against a baseline that is already loud. Not a refractory (75 ms; the fires are
  seconds apart), not an AGC (`SNARE_RISE` has no adaptive term; the running p95 only scales `snareVel`, which the grammar does
  not read), not the clear (`clearLeft` 0 throughout), not `dyeDiss` (1.0 here). The picture keeps moving — the wings at f1140–
  f1320 — because the 17.9 / 18.7 s ink is carried by the shears' velocity and the breath; **the Σ|dv| injected in 19–22 s is
  0.00**.

## 6. Control: SeeYouDrop on the same live path (cold, `&map=0`, 0–60 s; `syd-live-cold-persec.txt`)

| window | subGate | kicks/s (amp) | snares/s (amp) | splats/s | Σ\|dv\|/s |
|---|---|---|---|---|---|
| 0–11 s (the intro: pads, vocal, no drums, no sub) | 0 % (60 % in s0 = the start) | 0–2 at 0.31–0.37 | 1–2 at 0.32–0.41 | **0–10** | 0.3–1.5 |
| 13–24 s (the sub arrives at 12.6 s) | 100 % | 0–1 | 1–3 | 60–75 | 4.4–7.2 |
| 26–49 s (groove) | 100 % | 2–5 at 0.4–1.0 | 3–9 | 70–89 | 8.4–14.5 |
| 57 s (drop 1) | — | | | | `dropLiveEvt` **1** (the live detector fires here; `buildLive` .94 before it) |

So the live lanes are not the problem on drum-and-sub material — they open within half a second of the sub and the live
drop fires. The intro is as empty as the user's take: §106's own file-mode intro shot says the same ("the empty pool, a few
lilac hat droplets"). **The gap is the material, in both modes: whatever has no sub, no clicky kick and no hat has no
channel.**

## 7. Confirmed root causes

1. **No channel for the harmonic content** — hypothesis (a), confirmed. The track's energy is 95 % in 90–600 Hz (sub 0 %,
   bass 20 %, low-mid 75 %, mid 4 %, high 0 %); the grammar's five sources read the 22–70 Hz sub (share 0.0012 vs 0.30 needed),
   the 60–150 Hz rise with a 2.5–8 kHz click (0 after the step; click band −66 dBFS), the 150–2500 Hz rise ≥ 3.75 dB (6 of 49
   truth onsets), and 5–12 kHz hits (−63 dBFS). 12 splats in 22 s. The user's word for it is right: missing channels.
2. **The 19 s miss = the same channel under its fixed floor**: chord attacks rising 2.5–2.9 dB where the lane needs 3.75,
   with ink from 18.7 s still moving on screen — the eye reads "it heard that one, why not this one".
3. **The 2.5 s "slight stuff" is the silence step**: the lanes fire on the first audio block after digital zero (kick 1.00,
   snare 1.00, `hat2` .76, a 15 Hz sub ghost) — an ears-side start artefact, scaled down by `g` ≈ 0.0–0.5, still visible.
4. Contributing, not causal: the tongues' void rule (`tongueAmbig` ≥ .8 on a beatless pad → `dyeDiss` .13 for s9–s16) kept the
   11.6 s blobs on screen for 6 s and then the clock re-seat (124 → 157 bpm at 18 s) snapped `dyeDiss` back to 1.0 — the ink's
   persistence changed for reasons unrelated to the sound.

## 8. Killed hypotheses, with the number that killed each

| hypothesis | killed by |
|---|---|
| (b) warm-ups gate injection for ~12 s | `g` = 0.63 at s3, 0.75 at s4, ≥ 0.80 from s5 (`presence` 1 from 3.0 s, `loudRel` .76 by s3 — the loudness ruler is relative and reads .72 on SeeYouDrop's **first** second too); `tongueOn` and `buildLive` reach only `dyeDiss`; `tonicConf` only the colour's saturation. The snare lane fired at 8.6 s with everything else still "warming" |
| (c) hush / calm / loudRel quieting | `hush` 0.00 on every frame; `calm` ≤ .21 from s4 (factor ≥ .9), .75 only during the silent step; `loudRel` ≥ .76 → the loud factor ≥ .83 |
| (d) a refractory / AGC / sub hysteresis / the clear at 19 s | no fire to be refractory from (fires 18.667 → 23.550); `SNARE_RISE` is a constant 3.75 dB (perc.js:142, "no adaptive term"); `kickAmp` has no running quantile since §70; `subGate` 0 on every frame after 3.1 s (nothing to hysterese); `clearLeft` 0 throughout (`dropLiveEvt`/`mapDropEvt`/`dropEvt` all 0); `dyeDiss` 1.00 at 18–24 s |
| (e) live vs map lanes, the beater click | partly true, not the cause: the map would have placed the 12 truth low onsets (9 with a click by the truth's rule) — but §6 shows the live lanes carry SeeYouDrop from 12.6 s on, and no map exists on a live night by design. The click requirement did drop the two 42 Hz tails (18.83, 24.32 s) |
| (f) the recorder's hold / the fluid tier / 1×1 placeholders / `G.FLOAT` | q pinned .75 → tier 2 (sim ≈125×128, dye ≈501×512); ink visible from f156; 1475 frames / 24.601 s = 59.96 fps; the headless reproduction at tier 2 reads `fluid on, steps 2711, errs []` |
| the capture carried the demo synth (silent-tab watchdog) | sound at 2.53 s < the 6 s watchdog; two kick tails in 22 s vs a kick per 0.47 s in every demo style; chords Gm / Cm / Bb vs `demo.js`'s Am / F / C / G; −17 dBFS from the first block vs the demo's −28 dBFS pad intro |
| a library track (SeeYouDrop at 53 s, then Comptine at 1.012×) | waveform ncc 0.05–0.15 at 1.0×; the 1.012× Comptine 0.43 has offsets 98.6 / 121.1 / −4.0 / 24.4 … per window (self-similar piano, no single hit) against a 1.00 control |

## 9. Fix proposals, smallest first (not implemented)

Side-effect legend: **md5** = `tools/accept/v0.35/scene-md5-v035.txt` (26 lines: 24 roster + the s12 pair; the fake timeline
stirs the pool from frame 0, so any change to a *velocity* the grammar emits moves all 26; a change to *dye only* moves the s12
pair alone, because `feedback.js` back-traces on `engineTex.vel` and no roster scene reads `dye`). The `&fluid=0` list
(`v0.34`, 24 lines) holds under every proposal. **Trails** = the roster scenes' advection (`fb.advect` 1 under every scene,
§105: the ambient field is a few hundredths of a uv/s and a parcel moves ~1 px/frame between hits).

1. **A dye-only harmonic floor** (`inject.js`, one `add` + one `K` row + `mid`/`eS` into `FLUID_FEATS`): while `presence > 0`,
   ink at the key's sector (`sectorPc(S.key)+½)/12`, y 0.5, radius ×1.5, **dx = dy = 0**, dye `K.FLOOR_DYE·mid·g·f` with
   `FLOOR_DYE` ≈ 0.003 (the sub emitter's 0.015 is the loudest continuous source; a fifth of it keeps the pool readable without
   filling it — at `dyeDiss` 1 the steady state is ≈ 0.003·60 = 0.18 at the mouth). On this take `mid` reads .84–.99 from 3 s:
   the pool shows the music's level and the key's colour from the first second of sound instead of a flat grey, and the chord
   attacks' shears land in ink that is already there. **Side effects: md5 — only the s12 pair moves (no velocity); trails —
   none; the §107 clear still empties it (DROP_DISS 12 beats 0.003/frame); the empty-pool idle (`&fluid=0`) unchanged.** The
   one thing to decide by eye: whether a never-empty pool reads as "music" or as "the lights are on".
2. **A chord-onset channel from the v1 `snare` level** (`'snare'` into `FLUID_FEATS`; the extractor's mid-band flux peak,
   0.13 s decay, which reads .04–.25 per second on this take): emit the two shears at `K.SNARE_V·0.3·Δsnare` when `snare`
   rises by > 0.05 in a frame and no `snareEvt` fired this frame (the lane's hit keeps its full size). Covers the 2/s of
   truth mid onsets the 3.75 dB lane misses (max rises 2–3.5 dB) at a third of the force. **Side effects: md5 — all 26 lines
   move (velocity; the fake timeline has `snare`); trails — a small lateral push at mid height per chord (≤ 0.18·0.25 =
   0.045 uv/s impulse, under the sub column's 0.08/frame class); the `hit` field (max(hit, hitStrength)·exp(−dt/.14)) is the
   alternative if the ears' `snare` level proves too clicky — it is what every v1 flash reads.**
3. **A bass-movement lift from the v1 `kick` level** (`'kick'`: median-thresholded low-band flux gated on bass level, 0.16–
   0.32 mean here where `kickEvt` is 0): a half-size impulse from the floor, `0.4·K.KICK_V·Δkick`, when the level jumps > 0.1
   with no `kickEvt`. Gives the bass chord changes (truth low onsets 12) and the clickless kicks (18.83, 24.32 s) a lift the
   §68 lane cannot by design. **Side effects: md5 all 26; trails — vertical pushes at the sub's x; the §68 reasoning
   ("a bare low onset is an 808 note start") stands for the *event* lane — this is a level, sized to be weaker than one.**
4. **A second sparkle source for the scene** (`assets/scenes/fluid/index.js` only): `high` > .4 (MS `high` read .5–.6 while
   the 2.5–8 kHz layer played at 18–21 s and `hat2` stayed 0) → the same droplet at a quarter of the ink. **Side effects: s12
   lines only; no trails (the scene's splats are gated on being on screen).**
5. **Latch the void rule on "drums exist"**: apply `voidT = max(buildLive, tongueOn === 1 ? tongueAmbig : 0)` only once a
   `subGate` or `kickEvt` has been seen in the last 8 bars; otherwise `dyeDiss` 1.0. On a beatless pad `tongueAmbig` ≈ .9
   forever and the pool fills with stale ink (`dyeDiss` .13 for s9–s16 here, the lingering lilac pair). **Side effects: md5 —
   to measure (`tongueOn` on the fake timeline is the switch's value; if it is 1 there the 26 lines move); trails — none
   (dye only).**
6. **An ears-side start guard** (outside the grammar; `perc.js` / `sub.js`): ignore lane fires in the first 0.3 s after
   `presence` rises from 0 — the digital-silence step fired every lane at 1.00 and the sub gate on a 15 Hz ghost. **Side
   effects: the ears' md5 / parity lines, not the pool's; the §106–§107 strips unaffected (SeeYouDrop never starts from
   zero).** Low priority: `g` ≈ 0 at that moment already.
7. Not proposed: lowering `SNARE_RISE` / `KICK_RISE`. They are the ears' measured truths (§68–§70, §90, swept against five
   tracks); a pad's 2.5 dB attack is not a snare, and CONTRACTS §1.18 says the level fields are the place for "how much is
   there", the event fields for "a hit". The grammar is the layer that lacks the read, so proposals 1–3 add reads, not
   thresholds.

Recommended order: 1 (dye only, two md5 lines, the user's eye decides) → 4 → 2 → 3 → 5, re-basing the v0.35 list once at the
first velocity change (2) rather than per step.

## 10. Artefacts (`tools/work/fluid-diag/`, gitignored)

`montage.jpg` (2 fps, 0–24.5 s, labelled) · `strip_2-5.jpg`, `strip_11-14.jpg`, `strip_17-22.jpg` (5 fps) · `spec.png` (the
audio, 20 Hz–12 kHz log) · `rec-audio-48k.wav` (the engine's input; serve it as `&track=rec` with `MUSIC=` pointing at its
directory) · `rec-live.json` (the trace, 1464 frames × 57 fields) · `syd-live-cold.json` (the control) · `replay.mjs` (the
`plan()` replay: `sec` / `events` / `frame`) · `rttrace.mjs` (a real-time trace driver over cdp.js) · `rec-live-persec.txt`,
`rec-live-events.txt`, `syd-live-cold-persec.txt` · `rec_bands.txt` (0.25 s band table) · `trackmap-rec.txt`, `rec.json`,
`trackmap-rec-grains/` (the user's grains) · `match3.py`, `match4.py` (the library scans).
