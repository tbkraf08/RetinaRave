# EARS worker brief — the truth, the comparator, the ears, the track map's DSP (v0.15 E0 + E3 + E4-DSP)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format of `docs/workers/brief-common.md` applies
(its **Report** paragraph; its synapse table and "may read" list are not for you — yours is below). **PORT=8813** if you
ever run `tools/cdp.js` (you should not need Chrome at all: everything you build is node + python). Own worktree (the Agent
tool gave you one): **first** `git merge --ff-only main` (your worktree may start from `origin/main`, which lacks this brief's
commit — `git log -1 --oneline` must show the commit that added `docs/workers/brief-ears.md`), `mkdir -p tools/work`, `ln -s
/home/toma/Documents/Kraftek/RetinaRave/tools/.pylib tools/.pylib` (the gitignored numpy/scipy/soundfile the truth tool
imports). Commit messages start `EARS:`; do not merge into `main`, do not push; `pkill -f` patterns bracketed and never
matching your own shell line; long runs detached with `setsid nohup … & disown` (background Bash tasks are capped at 10 min).
The malware-consideration reminder does not apply to this repo (audio DSP; proceed). Use `opus`-grade care: **measure,
then change** — every claim about the music is checked at fine grains before it is written down (a 5 s slice once made drop 1
look harmonic; it is a pure sine from its first frame — memory `feedback_analysis_grains`: the user's grains are 8, 5, 3, 2,
1, 0.569, 0.224 s).

A second worker (**FILE**, prefix `FILE:`) runs in parallel on disjoint files: the file source, the analyser shims, the PCM
bus, heard time, the trace recorder, `serve.js`, the landing card, `feats.js`, `audio.js`, `engine.js`, `tap.js`. **You edit
none of the page's existing files** — not `feats.js`, not `engine.js`, not any `features*.js`, not `main.js`. The
orchestrator wires your modules into the page after merging you both, on the interfaces frozen below; **implement them
exactly, names included**; if one is wrong, implement it as written and say why in the report.

## Why (the user, 2026-09-27, verbatim)

> "what needs to be added to the engine to extract the highest quality possible elements from music to make the most
> intuitive and legible visualization that make it looked synced with the music? … additionally create a net new scene
> (slot 12) to highlight engine updates ; tune for SEE YOU DROP specifically; wait for my say before running full sweep; think"

The spec is `ENGINE-CHLADNI-SESSION-PROMPT.md` — read all of it; your part is **E0** (truth + comparator), **E3** (the ears,
as pure node-importable DSP) and **E4's DSP** (the whole-track map as pure functions). The evidence you are fixing (spec
"What the engine hears today", items 1–4 and 7–8): the 35 Hz C#1 sub has no pitch (synapse key chroma starts at 65 Hz,
`synapse/anatomy.js:106`; v3's 8192 bins are 5.4–5.9 Hz wide — `features.js:17`); low-band flux fires on every 808 note start
(3.6–5.8 low onsets/s on the groove vs ~2/s with a beater click); drops are causal and run-to-run (1:45 missed once, a false
intro drop ~9–10 s); sections are named 4–8 beats late and nothing knows where the music is going; brightness is AGC'd;
no low-pass signal, no stereo.

## Targets (your files)

- **E0:** `tools/truth/trackmap.py` (extend; keep every existing output byte-compatible — new JSON keys only, new tables
  appended), **new** `tools/truth/compare.py`, regenerated `tools/truth/SeeYouDrop.{txt,json}` + `tools/truth/SeeYouDrop/`,
  `tools/truth/others-brief.txt` (re-run), and **new** `tools/truth/<Other>.json` for the other three tracks if you run them
  full. `SeeYouDrop.sections.json` is the orchestrator's hand annotation — do not edit it; write your automatic sections
  into `SeeYouDrop.json` and a side-by-side comparison into your report.
- **E3:** `assets/engine/ears/` — `ears.js` (the facade class), `sub.js`, `perc.js`, `tonic.js`, `texture.js` (register,
  low-pass, width), `pulse.js`, `feats.js` (**`EARS_FEATS`**: the FEATS entries for every field below, in `engine/feats.js`'s
  entry shape `{kind, eli5, formula, drives, range}` — the orchestrator spreads it into `FEATS`), any `dsp` helpers you need
  (own FFT/biquad/YIN: do not import `synapse/dsp.js` — copying a small function is fine, say so). `tools/test_ears.js`.
- **E4-DSP:** `assets/engine/map/` — `map.js` (`buildMap`, `mapAt`, `mapCross`), `beats.js` (the DP beat tracker +
  downbeats), `sections.js` (bar-synchronous novelty + labels + returns), `drops.js`. `tools/test_map.js`.
- Modules ≤ 500 lines (350 soft), zero dependencies, **no DOM, no `window`, no `performance`/`Date` inside the DSP, no
  `Math.random`**, imports only within `engine/ears/`, `engine/map/` and `assets/math/` (so the orchestrator can run them in
  node, in the page, or in a Worker). `node tools/check.js` 0 fail after every edit (it scans `assets/`).

## You may read

This brief · `ENGINE-CHLADNI-SESSION-PROMPT.md` · `tools/truth/*` · `docs/CONTRACTS.md` (§0, Appendix A — every MS field; your
names must not collide) · `docs/ENGINE.md` · `docs/HARNESS.md` ("Static checks", "Math tests", "Pitfalls") · `docs/DECISIONS.md`
§9 (tempo), §10 (director), §45, §46 addendum 4 (Malicious's stutter drops), §47 (GIELIS on this track) · `docs/AUDIT-v0.14.md`
§3 · `assets/engine/**` (read only — `features.js`, `features-slow.js`, `tempo.js`, `synapse/*`, `feats.js`: how the live
engine does it today and the entry shape) · `assets/math/*` (read; import if useful) · `tools/test_tempo.js` (a node test
shape) · memory `~/.claude/projects/-home-toma-Documents-Kraftek-RetinaRave/memory/{project_v015_ears_chladni,
feedback_analysis_grains,project_music_library}.md`. Tracks: `~/Music/RetinaRave/{SeeYouDrop.flac, WhoLikesToParty.mp3,
CyborgNinja.mp3, Malicious.mp3}` (read-only; never copy them into the repo).

## Frozen interfaces

### Time base
Every time is **audio time in seconds**. In your tests it is track time (sample index / sr). In the page the orchestrator
passes FILE's time base (track time in file mode, `AudioContext` time live). You never read a clock.

### E3 — `assets/engine/ears/ears.js`
```js
export class Ears {
  constructor(sr, opts = {})     // sr = the stream's sample rate (44100 or 48000 in the page — test both)
  push(L, R, t0)                 // Float32Array(512) × 2 (R may === L), t0 = audio time of L[0]; blocks arrive contiguous
  read(tHeard)                   // → this.out (one reused object, the fields below) evaluated at heard time tHeard
  get events()                   // onsets released by the last read(): [{ type: 'kick'|'snare'|'hat'|'subNote'|'subIn'|'subOut', t, vel, note? }]
}
export const EARS_FIELDS = [ /* exactly the names below */ ];
```
- **Continuous fields are evaluated at heard time:** keep a short ring of the analysed values by audio time and return the
  value at `tHeard` (interpolated; the newest available when `tHeard` is past the analysis — capture mode). The page may call
  `read` with `tHeard` up to ~60 ms *behind* the newest pushed sample (real-time file mode: the bus is ahead of the speaker)
  or ahead of it (capture); both must work.
- **Events are released at heard time:** a detected onset with audio time `t` fires its `…Evt` (true for exactly one
  `read`) on the first `read(tHeard)` with `tHeard ≥ t`, and `…Age = tHeard − t` of the latest released onset from then on
  (`99` before any). An onset detected late (its `t` already < `tHeard` when found) fires on the next read with its true
  age — never re-timed to the read.
- **Fields (all names frozen; C = pitch class 0, as the engine's `pcOf`; checked against Appendix A — `mode` is taken):**
  - Sub: `subHz` (Hz, 0 = none) · `subCents` (cents of `subHz` from the nearest equal-tempered note, −50..50) · `subNote`
    (0–11, −1 none) · `subConf` (0..1) · `subGlide` (semitones/s, signed; + = rising) · `subNoteEvt` (event: a new sub note —
    an 808 re-trigger or a pitch change of ≥ 1 semitone held ≥ `NOTE_HOLD`) · `subPure` (0..1, 1 = sine: from the
    harmonics/fundamental ratio, h/f 0.05 ↔ 1, the truth's `hf`) · `subGate` (0/1 with hysteresis: the sub is sounding) ·
    `subIn` / `subOut` (events: the gate opens / closes).
  - Tonic: `tonic` (0–11) · `tonicMinor` (0/1) · `tonicConf` (0..1) — Krumhansl–Kessler on a chroma that **includes the
    sub's note** (weighted; the lean: the sub's pitch class with weight ∝ its energy share), long window (lean 20–30 s).
  - Register: `bassReg` (0..1: octave position of the 30–600 Hz centroid, 0 = sub ≈ 35 Hz, 1 = mid-bass ≈ 140 Hz and above).
  - Percussion: `kickEvt snareEvt hatEvt` · `kickAge snareAge hatAge` · `kickVel snareVel hatVel` (0..1, per-class running
    p95 normalised) · `denK denS denH` (onsets/s over the last 1 s). **A kick needs the beater click** (a 2–8 kHz transient
    within ±15 ms of the low onset); a bare low onset is an 808 note start and goes to `subNoteEvt`, never to `kickEvt`.
    Causal HPSS-lite (lean: a short median over time per band for the percussive part — the truth tool's HPSS is the
    reference, a causal approximation is the engine's job).
  - Feel: `pulse` (0.5 / 1 / 2: the felt beat as a multiple of the grid beat, from the kick/snare pattern — SeeYouDrop's drop
    sections are half-time: 0.5).
  - Texture: `lpSweep` (0..1: how closed a low-pass is — the high-band roll-off against the track's running p90; the outro
    134.5–157 s has highs at 1 %) · `width` (0..1: side / mid energy, `S = (L−R)/2`, `M = (L+R)/2`).
- **Cost:** `push` of one 512 block (both channels) + one `read` ≤ **0.19 ms** median in node on this machine (≤ 0.3 ms per
  60 Hz frame at 48 kHz = 1.56 blocks/frame); report median / p99 per block. Lean for the sub: low-pass, decimate to ~2 kHz,
  YIN over ≥ 120 ms (40 ms holds 1.4 cycles of 35 Hz — measured, it fails), octave check, parabolic refinement, hop ≤ 10 ms.

### E4-DSP — `assets/engine/map/map.js`
```js
export function buildMap(L, R, sr, opts = {})  // whole decoded track (non-causal) → a plain JSON-able map:
  // { v: 1, sr, dur, bpm, beats: [t], downbeats: [t], sections: [{ t0, t1, id, label, ret }], drops: [t],
  //   eG: { fps: 10, v: [0..1] }, tonic: { pc, minor, conf } }
export function mapAt(map, t, out = {})        // → out { mapOn: 1, toDrop, toBoundary, buildProg, mapSection, mapNext, mapReturn, eG }
export function mapCross(map, tPrev, t)        // → { drop: bool, boundary: bool } — a drop / boundary time in (tPrev, t]
```
- `toDrop` = beats (of the map's grid) from `t` to the next drop, −1 none · `toBoundary` = beats to the next section
  boundary, −1 none · `buildProg` 0..1 across the current build (the section that ends in a drop: 0 at its start, 1 at the
  drop frame; 0 elsewhere) · `mapSection` = the current section's label id (sections with the same label share it) ·
  `mapNext` = the next section's label id (−1 none) · `mapReturn` 1 when the current section is a return of an earlier one ·
  `eG` = energy normalised to the whole track (p5 → 0, p98 → 1; the macro arc the AGC flattens).
- **Drops** are defined by the whole track, not by a causal rule: a drop is a bar line where the low end (sub + bass) enters
  at ≥ `DROP_MIN` of the track's loud-section level after ≥ 1 bar of its absence (or a large, sustained jump in `eG` across
  the bar line), pinned to the bar grid, **and** the section after it is among the track's loudest. SeeYouDrop's truth:
  57.6 and 105.7 s — and **none** at 9–13 s (the sub's first entry at 13.0 s is a layer entry into a quiet walk, not a drop).
  Say how your rule treats Malicious's stutter (DECISIONS §46 add. 4) and WhoLikesToParty / CyborgNinja.
- Cost: `buildMap` of the 157 s SeeYouDrop ≤ 3 s in node, single thread (report it). Deterministic: two calls → identical
  JSON.

## E0 — the truth extension and the comparator (first; everything else is judged by it)

`trackmap.py` gets (new JSON keys, new tables; the existing ones unchanged):
- `beats`, `downbeats` (a dynamic-programming beat tracker — Ellis 2007 — on the percussive onset envelope, tempo prior
  from the existing ACF; downbeats from the kick/snare pattern + low-band novelty), `bpm_grid`; grains **per beat, per bar,
  per 4 bars** (`slices["beat"]`, `["bar"]`, `["4bar"]`; tables `grain-beat.txt` …).
- `sections`: bar-synchronous self-similarity on band shares + sub note + purity + onset density + a sub-inclusive chroma;
  Foote novelty; boundaries at bar lines; cluster labels; `ret` for returns → `[{t0, t1, id, label, ret}]`. Compare with the
  annotated `SeeYouDrop.sections.json` (boundaries within ±1 beat? which ones move and why).
- `drops` (bar-pinned, as the rule above but offline — the reference for `map/drops.js`), `tonic` (`{pc, name, minor, conf,
  scores}`, KK with the sub root included; **settle C# minor vs G# minor** and say how sure), `sub_slides` (`[{t0, t1, from,
  to}]` from `contour.f0td`: glides ≥ 1 semitone within ≤ 0.5 s — count them on 57.6–90 s), `bare808` (low onsets with no
  click within 15 ms), and `--pcm` also writes the stereo interleaved `tools/work/<name>.st.f32` (+ `.json` sr/n/ch) and
  `--sr=48000` resamples the dumps (`scipy.signal.resample_poly`) so node tests run at both page rates.

`compare.py <trace.json> [--truth tools/truth/<track>.json] [--win t0,t1] [--md out.md]` reads the **trace format FILE
records** (frozen; FILE's brief has it):
```
{ "track", "mode": "file-det"|"file-rt"|"capture"|"node", "sr", "at", "fps", "detLead", "fields": [...], "f": [...], "t": [heardT per frame],
  "cols": { "<field>": [per frame; events 0/1; null = non-finite] }, "log": [ { "type", "t", "f", ... } ] }
```
and prints the ruler table (spec "The rulers for looks synced"), one row per ruler × source, **new ears vs the old engine
as the baseline** (old: v3 `onset` / synapse `kick snare hat` / `dropEvt` / `sectionAlt`+`boundaryEvt` / `key`+`mode`; new:
`kickEvt`+`kickAge` etc., `subHz`, `mapDropEvt`, `mapBoundaryEvt`, `tonic`), columns `value · target · pass`:
- event lag per class (first frame the event is true − truth onset; and "placed" lag = `t − <x>Age` at that frame − truth
  onset): median, p90, max; F-measure ±30 ms vs truth (`kick` vs `onsets.click`, `snare` vs `onsets.mid`, `hat` vs
  `onsets.high`); % of kicks within 15 ms of a `bare808` onset;
- sub pitch: % of sub-loud frames (truth `contour.f0td` voiced and `sub` share high) within ±30 cents; slides detected (sign
  + span) vs `sub_slides`;
- structure: drops (exact times vs truth, ± frames; any elsewhere), boundaries within ±1 beat of the annotated table,
  returns labelled; tonic.
Missing fields in a trace → the row says "absent" (the old engine's rows must work on a trace recorded today). Engine-
independent: numpy/scipy/soundfile only.

## Process — one commit per proven step

1. **E0 truth:** beats/downbeats (SeeYouDrop: 150 BPM grid, beat 0.400 s; report the downbeat phase and how you checked it —
   e.g. the drop at 57.6 s and 105.7 s land on downbeats), beat/bar/4-bar grains, automatic sections vs the annotation,
   tonic, slides, bare808, the stereo + 48 kHz dumps. Run `--brief` on the other three. Commit.
2. **`compare.py`** against a synthetic trace (the truth's own onsets written into a trace → F = 1, lag 0; the same shifted
   by 20 ms → lag 20; a trace of today's fields where you have one — there is none yet: say so). Commit.
3. **E3 sub** (`sub.js` + the `Ears` facade's sub fields) + `tools/test_ears.js`: streams `tools/work/SeeYouDrop.st.f32` in 512
   blocks through `Ears`, `read(t)` once per 1/60 s of audio (heard = pushed, the det case) — the sub rulers: ±30 cents on
   ≥ 90 % of sub-loud frames; the four walk notes 13.0 / 16.1 / 19.3 / 22.6 s give `subNoteEvt` within 50 ms; the slides on
   57.6–90 s counted against `sub_slides` (sign and ~0.3 s span); `subPure` sine on the groove / drops, harmonic on 0–13 and
   101–105.7 s; `subGate` closes on drop 2's ducks (count per bar on 105.7–130 s); `subIn` at 57.6 s within 50 ms. At 44.1
   **and** 48 kHz. Commit.
4. **E3 percussion + feel:** kicks F ≥ 0.9 vs `onsets.click` on 25–45 s (±30 ms), ≤ 5 % of kicks on bare 808s, snare / hat F
   reported per section, `den*` on the climbs ≥ 2.5× the groove, `pulse` 0.5 on the drop sections. Commit.
5. **E3 tonic, register, texture:** tonic C# minor settles within 30 s (or the truth says otherwise — then the truth wins),
   `bassReg` rises on 44.9–49.9 and 96–101 s and on the intro, `lpSweep` > 0.7 on 134.5–157 s and < 0.3 on the groove,
   `width` per section (report; drops widening or not). `EARS_FEATS` complete (every field, kind, range, eli5, formula).
   Cost table. Commit.
6. **E4-DSP map** + `tools/test_map.js`: drops at 57.6 and 105.7 s pinned to the truth bar line (± 1 frame at 60 Hz = 17 ms)
   and none elsewhere, sections within ±1 beat of the annotated table (list every boundary: truth · map · Δ beats), the three
   returns (`sections.json` "returns") labelled, `toDrop` counts down in beats through the void, `buildProg` 0 → 1 across
   49.9–57.6 s, `eG` p95 per section; determinism (two builds identical); cost ≤ 3 s. The other three tracks: the drops and
   sections it finds (report; no truth to fail against beyond `others-brief.txt`). Commit.
7. **A node trace:** `node tools/test_ears.js --trace tools/work/ears-node-SeeYouDrop.json` writes the frozen trace format
   (mode `"node"`, `t` = heard time at 60 Hz, cols = every `EARS_FIELDS` field + `mapAt`/`mapCross` fields) and `compare.py` on
   it → the ruler table for the new ears in node (this is the table the orchestrator will reproduce in the page). Report
   `docs/workers/ears.md`. Commit.

## Acceptance (repo root, all must pass)

1. `node tools/check.js` → 0 fail. `node tools/test_ears.js` and `node tools/test_map.js` pass (exit 0) at 44.1 and 48 kHz.
2. `python3 tools/truth/trackmap.py SeeYouDrop --pcm` regenerates everything; the old keys and tables unchanged
   (`git diff --stat` shows only additions to the old tables — say how you checked).
3. `compare.py` on the node trace → every ruler row filled; the pass/fail of each stated plainly (a miss is reported, not
   hidden; say what would fix it).
4. `buildMap` drops = [57.6 ± 0.017, 105.7 ± 0.017] on SeeYouDrop, nothing else; cost reported.
5. The cost table: `push`+`read` per block median ≤ 0.19 ms.

**Report** (`docs/workers/ears.md`): brief-common (a)–(e) — the friction log (every sentence the docs lack, every guess, every
lean you changed and why), the temptation list, the ruler table (node), the boundaries table (truth · auto · Δ beats), the
tonic verdict with its scores, the slide count, every constant you chose (name · value · why), the cost table, what the map
finds on the other three tracks, and every interface you could not implement as frozen (with the reason). Everything
committed on your branch.
