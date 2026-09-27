# Fable Session Prompt — Retina Rave v0.15: the engine's ears (the sub, the slides, the gates, sections that know where they are going) + CHLADNI (id 11, "slot 12") (written 2026-09-27, after v0.14 pass 1)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com —
push only on the user's word). **State:** v0.14 tagged, pushed and live (2026-09-27). **This session is only the engine update, the
new scene and the offline analysis they need** (the user: "next session prompt should just be the engine update and new scene (and any
offline analysis that might be needed)"); everything else waits in `docs/OPEN-ITEMS.md` and is not touched.

**The user's ask (2026-09-27, verbatim):**
> "what needs to be added to the engine to extract the highest quality possible elements from music to make the most intuitive and
> legible visualization that make it looked synced with the music? create prompt for next session. additionally create a net new
> scene (slot 12) to highlight engine updates ; tune for SEE YOU DROP specifically; wait for my say before running full sweep; think"

So this session builds two things, in this order: **(A) the engine upgrades below, strictly additive** (no existing MS field changes
value, no existing scene's pixels move), and **(B) one new scene, CHLADNI, at id 11 ("slot 12" — the user's slot N is id N−1:
"slot 11" was GIELIS at id 10)**, built to show off (A) and tuned on `~/Music/RetinaRave/SeeYouDrop.flac` (Ray Volpe, 150 BPM).
The ask lifts "no new scenes until asked" (memory `feedback_no_new_scenes.md`) for CHLADNI only.

**"wait for my say before running full sweep":** `tools/accept.sh` is NOT run in this session, even though the diff touches
`engine/` (HARNESS "What to re-prove" would normally demand it). The cheap proofs ARE run after every engine step: `node
tools/check.js`, the node unit tests, `node tools/parity.js fake` (0 diff), one full `tools/scene-md5.sh` list (ids 0–10 identical to
the v0.14 references, ~6 min), the mixs md5. The session ends by reporting and waiting for the user's look and their word on the sweep.

**Read first, in this order:** this prompt · `tools/truth/SeeYouDrop.txt` + `SeeYouDrop.sections.json` + `trackmap.py`'s docstring
(the ground truth this session is measured against — written the day this prompt was; per-grain tables in `tools/truth/SeeYouDrop/`) · `docs/CONTRACTS.md` (§0, §1 the scene
object, §1.4 budget, §1.6 tiers, §1.9 cuts, §1.13 `help.feats`, §1.16 params, Appendix A — every MS field) · `docs/ENGINE.md` (MS
kinds, the stage rule: stages only ADD declared fields) · `assets/engine/engine.js` (73 lines: `addStage`, the frame order) ·
`audio.js` (the graph: bus → AnalyserNodes 2048 / 8192 → muted sink) · `sources/capture.js` (tab capture is the only real-audio path
today) · `synapse/tap.js` (the worklet posts mono 512-sample PCM blocks — the ears subscribe here) · `features.js:10–20` (`pcOf`, the
8192-bin pitch map) · `features-slow.js:15–45` (v3 chroma / `bchroma`) · `synapse/anatomy.js:100–130` (synapse key chroma, 65–2100 Hz) ·
`features-synapse.js` (the model for a stage that copies an analyzer into MS under its own names) · `docs/HARNESS.md` ("Headless
Chrome", CLOCK=1, "Real window", "What to re-prove", "Pitfalls", the continuity monitor) · `docs/DECISIONS.md` §9 (tempo), §10
(director), §36/§37 TORUS2 (the user's favourite mapping), §45 (thin waves / fat waves — the user's ear on this track), §47 GIELIS (the
last scene built on this track: what its rulers missed — dark p95, the 1:45 drop not firing in one run, the intro drop) ·
`docs/AUDIT-v0.14.md` §3 (SeeYouDrop window by window, what the engine fired) · `GIELIS-SESSION-PROMPT.md` (the format this prompt
follows; the worker-brief shape) · `docs/workers/brief-common.md` · `assets/math/{keycolour,nudge,waves}.js` (import, never re-derive)
· `tools/accept/v0.13/nav2-window.py` + `tools/accept/v0.14/{README.md,perbeat14.py}` (the real-track window instruments) · memory
`~/.claude/projects/-home-toma-Documents-Kraftek-RetinaRave/memory/{project_eigenwobble,project_music_library,project_gielis,
feedback_colour_default,feedback_no_new_scenes}.md`.

## The user's ear on this track (verbatim; the only music notes to design against)

> "0-13s the high rise up to their max (edge should be bumping on every beat / light oscillating off the edge); at 25s it really starts
> moving the edge on every beat" · "25s-1m03s set should be bumping in some way with each beat (as beat evolves the set should come back
> to a slightly different shape)" · "each beat should make the set close up (different pitches are different shapes); at 1:38 it goes
> double time -> should be moving faster / reacting more; 1:45 -> this is where the highest energy is, should be reacting more" ·
> "I like the bright / glowy look, but I don't want it to be so bright that can't see the … shapes." · "pretty much should be deforming
> on every beat." · "I'm expecting every sound to generate a wave (and the wave color is based on musical note being played)" · "no
> sound -> quiet (ie. wave not generated)" · "the part that was missing ripples was 50s-57s … feel like there should be more skinnier
> waves, (vs bass fatter waves)?" · "torus2 is my favorite visually for how music lines up to the viz" · "I liked color tied to circle
> of fifths".

## What the music is, measured (TRACK time — `tools/truth/SeeYouDrop.txt`, `python3 tools/truth/trackmap.py SeeYouDrop`)

The bass is the whole identity: **a near-sine 808 sub on C#1 (35 Hz)**, 58 % of the loud half's energy, harmonics/fundamental 0.06.
The other three tracks, same tool (`tools/truth/others-brief.txt`): WhoLikesToParty sub 37 % / F#1 / h/f 0.19 · CyborgNinja sub 7 %,
its bass an octave up (C#2) · Malicious sub 1 %, a harmonic G2 mid-bass (h/f 0.53). The sections are **moves in where the bass lives**
(sub / mid / gone), not chord changes:

| track s | label | bass | drums |
|---|---|---|---|
| 0–13 | intro | harmonic mid-bass walks G#2/A2 → F#2 → E2 (the sub's walk an octave up), no sub | none; hats rise |
| 13–25 | walk | sine sub walks C#1 13.0 → A1 16.1 → F#1 19.3 → E1 22.6 (68–79 % of energy) | none |
| 25–44.9 | groove | C#1 held; 60–150 Hz pulses every 0.395 s | kick candidates ~2/s |
| 44.9–49.9 | climb | G1 → D#2 | mid+high onsets 7.4/s (3×) |
| 49.9–57.6 | void | none (sub 1 %, bass 1 %) | hats + mids |
| **57.6** | **drop 1** | sub 0 → 83 % in 0.2 s, pure from the first frame | |
| 57.6–90 | slides | every hit slides D#1 / D1 → C#1 in ~0.3 s | kick candidates ~2/s |
| 90–96 | groove return | as 25–45 | |
| 96–105.7 | climb, double time | G1 → D#2, then no sub; a harmonic ~110 Hz mid-bass (h/f 1.5–4.9) | mid/high 5.4–7.2/s |
| **105.7** | **drop 2** | C#1, ducked every ~0.8 s, deepest once per 1.6 s bar; octave / fifth grace notes | ~2.5/s |
| 130.5–134.5 | turn | C#1 held | sparse |
| 134.5–157 | outro walk | the walk returns twice (A1, F#1, E1, C#1 …) | none; highs 1 % (a low-pass closed) |

Grid 150 BPM (0.40 s beat); the percussive-onset ACF picks 75 in the loudest 30 s — half-time feel in the drop sections. **Tonic
hypothesis: C# minor** (the loop C#–A–F#–E is i–VI–iv–III; every groove sits on C#1) — the engine reports **G# minor**, the fifth.

## What the engine hears today, and what it misses (the evidence for part A)

1. **The sub has no pitch.** Synapse's key chroma starts at **65 Hz** (`anatomy.js:106`) — the 35 Hz root is invisible to `key`.
   v3's `bchroma` bins the 8192 analyser: bins are 5.4 Hz (44.1 kHz) or 5.9 Hz (48 kHz) wide, a semitone at C#1 is 2 Hz, so below
   ~65 Hz only one pitch class in two or three exists at all and *which* depends on the sample rate (`pcOf`, `features.js:17`). The
   "one-note bassline, notes 0/1 only" NAV2 found is this quantisation, not the music. Nothing measures the **slides**, the **purity**
   (sine vs harmonic bass — the one thing that tells this track from Malicious), the **gate**, or the **register**.
2. **Percussion conflates kicks and 808 re-triggers.** Low-band flux fires on every sub note start: on the groove the truth has 3.6–5.8
   low onsets/s but only ~2/s with a beater click (`trackmap.py` "click" column). The `kick` level cannot tell them apart.
3. **Drops are run-to-run and causal.** The 1:45 drop did not fire in one v0.14 run (AUDIT-v0.14 §3); a full-strength drop fired in
   the intro (~9–10 s) where the truth has only the sub's first entry at 13.0 s; Malicious's stutter fired three in 14 s (§46 add. 4).
   The rule "bass returns after > 1.8 s absence" is right for 57.6 s and wrong as a definition of a drop.
4. **Sections are identified late** — synapse names a section 4–8 beats after its boundary (§10) — and nothing knows *where the music
   is going*: a build cannot wind up to the exact drop frame, which is the single most "synced"-looking thing a visual can do.
5. **Nothing is deterministic on real music.** Every real-track run is a tab capture: the numbers drift run to run, windows cannot be
   md5'd, and the only way to see 1:45 is to hope it fires.
6. **Latency is unmeasured.** Tab capture adds the other tab's output path + the capture path; the analysers look back 23 ms (2048) /
   93 ms (8192); the frame adds 16–33 ms. ITU-R BT.1359 puts the detectability threshold for *sound before picture* (= our visuals
   late) at **~45 ms** — we are probably over it, and nobody has measured by how much.
7. **Brightness is AGC'd, not track-relative.** Every level is normalised over 0.5–2.5 s, so the track's macro arc flattens; GIELIS's
   groove read dark (p95 0.2–0.45) and only the drop reached the band.
8. **No low-pass signal** (the outro's closing filter: highs 1 %) — `hp` exists, its mirror does not. **No stereo** (the tap
   downmixes; drops often widen).

## The rulers for "looks synced" (every engine and scene step reports against these)

- **Event lag:** visual onset − audible onset. File mode: median ≤ 15 ms, p90 ≤ 30 ms, never late > 45 ms. Capture mode: measured and
  reported, then compensated where the estimate is stable (a declared `SYNC_OFS`, not a fudge).
- **Event truth:** per class, F-measure within ±30 ms of `tools/truth/<track>.json` onsets: kick candidates ≥ 0.9 on 25–45 s, and
  ≤ 5 % of kicks fired on bare 808 re-triggers.
- **Sub pitch:** within ±30 cents of truth on ≥ 90 % of sub-loud frames; each truth slide detected as a glide (sign and ~0.3 s span).
- **Structure:** in file mode, drops at exactly 57.6 and 105.7 s (pinned to the truth bar line) on **every** run and none elsewhere;
  boundaries within ±1 beat of the annotated table; returns labelled as returns (the three pairs in `sections.json`).
- **Legibility:** one musical element → one visual channel (a scene never mixes the sub's pitch and the kick into the same knob);
  continuous things on heard time, events at sub-frame time, anticipation only from what is actually known.

## Part A — the engine work, ranked (each step its own commit, its own proof)

**E0 — Truth and the comparator (do first; everything else is judged by it).** `tools/truth/trackmap.py` exists (v0: bands, purity,
HPSS percussive onsets low / click / mid / high, note runs, JSON) and slices the track at **the user's seven grains — 8, 5, 3, 2, 1,
0.569, 0.224 s** (`--grains=`; tables in `tools/truth/<track>/grain-<g>.txt`, the JSON's `slices` keyed by grain). A grain uses the
longest STFT window ≤ 40 % of itself (16384 / 8192 / 4096) so slices do not smear into each other; slice pitch is a time-domain YIN
(100 ms window, 10 ms hop, octave-checked, no sub-range pitch without sub energy), and its 100 Hz contour (`contour.f0td`) is the
frame-by-frame truth for `subHz`. Known limits: `subwob` needs ≥ 3 s slices; at 0.224 s onsets are counts (0–2), not rates; a slice
that straddles two notes shows a low `held`. Lean: add **beat-synchronous grains** (1 beat, 1 bar, 4 bars) once the beat grid exists —
fixed-time slices cut across events (a 5 s slice once made drop 1 look harmonic when it is a pure sine from its first frame). Extend it with: a
dynamic-programming beat tracker (Ellis 2007) + downbeats from the kick/snare pattern → a bar grid; bar-synchronous sections (self-
similarity on band shares + sub note + purity + onset density + a sub-inclusive chroma; Foote novelty; cluster labels; returns);
the tonic with the sub root included (settle C# vs G#). Then **`tools/truth/compare.py`**: reads an engine trace (E2's event log +
per-frame MS dump) and the truth JSON → the ruler table above. Keep it engine-independent (numpy/scipy/soundfile in the gitignored
`tools/.pylib`). `--pcm` already dumps `tools/work/<track>.f32` for node tests. Stems (Demucs etc.) stay out of the engine (zero
deps); an offline stems pass inside the truth tool, only to grade the classifiers, is an allowed lean if E0's HPSS is not enough.

**E1 — A file source, and deterministic real-track runs.** `engine/sources/file.js`: decode with `decodeAudioData`, play through
`AU.bus` **and** to `ctx.destination` (audible — capture mode mutes because the other tab is heard; file mode must not). Entry:
`&track=<name>` served by `tools/serve.js` from `$MUSIC` (default `~/Music/RetinaRave`) under `/music/` — local only, never bundled,
never deployed (check `bundle.js`, `wrangler.jsonc`) — and a drop-a-file / pick-a-file control on the landing card (local decode,
nothing uploaded; the "Landing tiles" re-prove row). **Under CLOCK=1** the playhead is `frame / 60` exactly, and the realtime
extractor must see exactly what it would have heard: replace `AU.fast` / `AU.slow` in file mode with **PCM-backed analyser shims**
that implement the Web Audio spec's `AnalyserNode` (Blackman window, `smoothingTimeConstant`, dB, `getFloat/ByteFrequencyData`,
`getFloatTimeDomainData`) over the decoded samples ending at the playhead, and feed the synapse tap exact 512-sample blocks up to the
playhead on the main thread. The v3 and synapse math stays byte-identical. **Proof:** two CLOCK=1 runs of SeeYouDrop 0–60 s give
identical per-frame MS dumps; a real-time file-mode run matches the shim within a stated tolerance on `bass eS kick beatPhase bpm`;
capture / mic / demo paths untouched (parity fake 0, the md5 list identical).

**E2 — Heard time and sub-frame events.** `AU.heardT()`: in file mode `getOutputTimestamp()` + `outputLatency` → the audio time the
listener hears at this frame's `performance.now()`; under CLOCK=1 it is the playhead. Every new event carries the **audio time of its
onset** (from the hop index, not the frame), and the MS gets `<x>Age` = heard time − onset time, so a scene can place a fast event
exactly (a leap that began 7 ms before this frame is drawn 7 ms along). An event log hook (`CARD.EARS.log`) for `compare.py`. Capture
mode: measure the lag with the harness (the audio tab's `currentTime` against truth onsets, both on the machine clock) and report it;
`SYNC_OFS` as a declared manual setting.

**E3 — The ears (a new additive stage, both modes).** `engine/ears/` as pure, node-importable DSP modules (tested in node on
`tools/work/SeeYouDrop.f32` against the truth JSON — no Chrome in the inner loop), wired as one stage `features-ears.js` that
subscribes to the tap's PCM (a second listener; synapse's `Analyzer` is not modified) plus its own stereo worklet for width. Fields
(names checked against Appendix A — `mode` is taken, so the scene's plate modes are "figures"):
- **Sub:** `subHz`, `subCents` (vs `tonic`), `subNote` (0–11, −1 none), `subConf`, `subGlide` (semitones/s, signed), `subNoteEvt`,
  `subPure` (1 = sine, from harmonics/fundamental), `subGate` (0/1, with hysteresis), `subIn` / `subOut` events. Lean: low-pass,
  decimate to ~2 kHz, YIN over ≥ 120 ms (40 ms holds 1.4 cycles of 35 Hz — measured, it fails), parabolic refinement.
- **Tonic:** `tonic`, `tonicMinor`, `tonicConf` — Krumhansl–Kessler on a chroma that includes the sub's note (weighted).
- **Register:** `bassReg` (octave position of the 30–600 Hz centroid: 0 = sub, 1 = mid-bass) — the 1:38 climb and the intro.
- **Percussion:** `kickEvt snareEvt hatEvt` (one frame) + `kickAge snareAge hatAge` + `kickVel snareVel hatVel`, from a causal
  HPSS-lite percussive estimate; a kick needs the beater click (2–8 kHz transient within 15 ms) — a bare low onset is an 808 note
  start and goes to `subNoteEvt`. `denK denS denH` (onsets/s over 1 s: the climbs, double time).
- **Feel:** `pulse` (0.5 / 1 / 2 × the grid beat, from the kick/snare pattern) so a scene can breathe on the felt beat.
- **Texture:** `lpSweep` (0..1, the low-pass closing: roll-off against the track's running p90), `width` (side/mid energy).
- Cost: the stage ≤ 0.3 ms/frame on the main thread; `ENGINE.ms` ≤ 1.3 ms at tier 3.

**E4 — The track map (file mode only: the music is known in advance, so use it).** `engine/map/` in a Worker built from a Blob (as
`tap.js` builds its worklet, so `dist/` still runs from `file://`): the E3 DSP run non-causally over the whole decoded buffer + the E0
beat / bar / section / drop logic in JS. Ready within ~3 s of load (CLOCK=1 waits for `mapOn` before starting). MS evaluated at heard
time: `mapOn`, `toDrop` (beats to the next drop, −1 none), `toBoundary`, `buildProg` (0..1 across the current build), `mapSection`
(label id), `mapNext`, `mapReturn`, `eG` (energy normalised to the whole track: the macro arc the AGC flattens), `mapDropEvt` and
`mapBoundaryEvt` (frame-exact, deterministic). Live mode: `mapOn` 0 and scenes fall back to the live fields (`dropConf`,
`dropExpectedIn`, `build`). **Proof:** on SeeYouDrop `mapDropEvt` fires at 57.6 and 105.7 s only (never 9–13 s), every run; sections
within ±1 beat of the annotated table; the three returns labelled.

**E5 — Contracts.** CONTRACTS gets a "sync rules" subsection (the rulers above as the scene author's rules) and Appendix A regenerated
(`node tools/feats-doc.js`); HARNESS documents `&track=`, the shims, `compare.py`, the new window mode; DECISIONS §48.

**Non-negotiable for part A:** additive only — v3 stays canonical for `bpm beat dropEvt sectionId chroma tension`, synapse's names
untouched, every new field has a FEATS entry and is written only by its own stage, nothing existing changes value (the md5 list and
parity say so after every step); no `Math.random`, no wall clock inside features (audio time only); zero dependencies; modules ≤ 500
lines; `'nav'` never in core.

## Part B — CHLADNI (id 11, "slot 12"), the scene that shows the ears

**Why Chladni:** a Chladni plate is sound made visible by resonance — sand on a vibrating plate gathers on the nodal lines of the
plate's eigenmode, and the figure is set by the pitch. It is the literal *eigen-wobble*, it is universally legible (people know the
sand-on-a-plate videos), and every new ear maps onto one physical, intuitive channel. A sine sub is exactly what drives a clean figure.

**The plate:** figure `u(x, y) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy)` (the square-plate Chladni approximation, `(n, m)` a "figure"),
in `assets/math/chladni.js` (pure, node-importable, `tools/test_chladni.js`: the nodal set of known figures, the antisymmetry, a
blend's continuity) with a generated GLSL twin. **Sand:** particles (`ctx.budget('points')`, tiered) that random-walk with step ∝
|u|·amplitude and settle where u = 0 — the real mechanism — plus an instant nodal-line glow so a figure change reads at once while the
sand re-forms (lean: GPU ping-pong state; hash noise, no `Math.random`).

| the music (field) | CHLADNI (one channel each) |
|---|---|
| sub note vs tonic (`subNote`, `subCents`, `tonic`) | the figure: a 12-entry table by interval to the tonic, simple for consonant (unison, fifth, fourth), complex for dissonant (lean: order by just-intonation complexity, as GIELIS's species) — the build's walk is four distinct figures |
| slide (`subGlide`) | the figure morphs continuously between neighbouring table entries by fractional semitone — every hit at 57.6–90 s visibly relaxes into the root figure in ~0.3 s |
| purity (`subPure`) | mixes in the 2nd / 3rd harmonic's figures (+12, +19): a sine sub = clean lines, a harmonic bass (intro, 101–105 s) = busy, rough figures |
| sub level (`sub`, `eG`) | vibration amplitude: how hard the sand dances, how bright the antinodes glow |
| gate (`subGate`) | the plate stops: sand freezes and drops for the duck — drop 2's once-per-bar stomp |
| kick (`kickEvt`, `kickAge`, `kickVel`) | the sand leaps, higher on antinodes, phase placed by `kickAge` — exact to the sub-frame |
| snare / hat (`snareEvt`, `hatEvt`) | a brief mid figure flash / fine high-mode ripples on the surface — the "skinnier waves" the user missed at 50–57 s |
| register (`bassReg`) | camera elevation: sub = low, heavy, the plate fills the frame; mid-bass = high overhead, the plate small (1:38) |
| void (`subOut`, no sub) | the plate is silent; sand lifts and floats; only hat ripples and a soft mid light move — "no sound → quiet" |
| anticipation (`toDrop`, `buildProg`, `mapDropEvt`) | through the void the sand spirals inward and the camera tilts with `buildProg`; on the exact drop frame it is thrown up and lands into the root figure a beat later (live fallback: `dropConf` / `dropExpectedIn`) |
| low-pass (`lpSweep`) | fog and desaturation rise — the outro dims into the root figure |
| sections (`mapSection`, `mapReturn`) | plate boundary + palette (lean: square for the sub-locked sections, circular — Bessel figures — for the walks); a return restores its look |
| beat grid (`beatPhase`, `pulse`) | TORUS2's small thump on the camera and a `mkNudge()` turn of the plate per felt beat |
| key / note colour | `mkAnchor()` (key on the fifths, major warm / minor cool) on `tonic`; the figure's glow takes the sub note's hue (MAXWELL's validated "colour = the note") |

**SeeYouDrop acceptance windows (file mode, CLOCK=1, deterministic — every one a per-frame trace plus a montage):**
1. 13–25 s walk: four distinct figures; each switch within 1 frame of `subNoteEvt`, which is within 50 ms of the truth run starts
   (13.0 / 16.1 / 19.3 / 22.6); ≥ 70 % of the sand within δ of the nodal lines 0.4 s after each switch (a "settle %" instrument).
2. 25–45 s groove: a leap on ≥ 90 % of the truth kick candidates, onset frame within 1 frame; no leap on bare 808 re-triggers; the
   root figure holds. "at 25s it really starts moving the edge on every beat."
3. 44.9–49.9 and 96–101 s climbs: leap / ripple density ≥ 2.5× the groove; the camera rises with `bassReg`.
4. 49.9–57.6 s void: plate amplitude < 5 %, sand floating, hat ripples only, the inward spiral growing with `buildProg`.
5. 57.6 s drop 1 and 105.7 s drop 2: the slam on the `mapDropEvt` frame = truth ± 1 frame, on every run.
6. 57.6–90 s slides: each slide shows as a figure morph into the root (count against the truth runs).
7. 105.7–130 s gated: the figure blinks out on the ducks, deepest once per bar. "1:45 … should be reacting more."
8. 134.5–157 s outro: fog up with `lpSweep`, the walk's figures return, the sand settles and dims.
9. Brightness: p95 luminance 0.6–0.8 on the groove (`tools/lum.py`) — bright and glowy with the figure legible, set from the start.
Also shown, not tuned: CyborgNinja and WhoLikesToParty 0–30 s in file mode, and one capture-mode run of 25–45 s with the lag table.

**Scene rules:** id 11, forced-only (`score()` 0), no digit key (`n` cycling or `&scene=11`), folder and card `CHLADNI`; `cuts:
'continuous'` with a `state` path for the continuity monitor; colour slot `{ default: 'v2', variants: { v2: {} } }` (OKLCH stays
opt-in); six params named for what the eye sees (lean: `figure` complexity, `sand` amount, `leap`, `tilt`, `glow`, `fog`) with the
identity proof; `feats` = exactly the fields read, each with a `help.feats` clause; imports only `math/*`; modules ≤ 500 lines
(`index.js` / `shaders.js` / `sand.js` / `help.js` from the start); bench `CARD.bench(11, 300)` ≤ 1.5× TORUS2; the scene loads in node;
`#test` never fills the new fields — pin them with `&fix=` for the headless shots and md5s.

## Process

1. **Orchestrator, housekeeping:** this prompt, `tools/truth/*` and the memory are already committed. Verify the evidence claims
   against the code in five minutes (the 65 Hz floor, `pcOf`, the mute sink). Write `docs/workers/brief-ears.md` (E0, E3, E4's DSP as
   node modules), `brief-file.md` (E1, E2) and later `brief-chladni.md`, each in `brief-nav2.md`'s shape (Why verbatim / Targets / You
   may read / The design / Non-negotiables / Process / Acceptance / Report) + `brief-common.md`. Freeze the new field names in the
   briefs before anyone codes.
2. **Two workers in parallel** (opus, own worktrees, own `PORT=`, commit prefixes `EARS:` / `FILE:`): **FILE** = E1 + E2 (sources,
   serve route, shims, tap PCM path, heard time, landing control, the determinism proof); **EARS** = E0 + E3 + E4's DSP as pure modules
   with node tests against `tools/work/SeeYouDrop.f32` and the truth JSON. Disjoint files by construction.
3. **Orchestrator:** merge FILE, then EARS; wire `features-ears.js` and the map worker; FEATS entries; regenerate Appendix A; the cheap
   proofs (check, node tests, parity fake 0, the full md5 list ids 0–10 identical, mixs); `compare.py` on SeeYouDrop in file mode and in
   capture mode → the ruler table into `docs/AUDIT-v0.15.md`. Register the empty CHLADNI skeleton at id 11 (`score` 0) in its own commit
   with the md5 list identical — the no-op proof before any pixel.
4. **Worker CHLADNI** (opus, own worktree, own PORT, prefix `CHLADNI:`): `math/chladni.js` + test → the figure table on `&fix=` pins →
   sand + settle % → leaps on `kickAge` → purity → gate → register camera → void / anticipation / drop → hat and snare ripples → colour
   → sections → params. One commit per proven step; report `docs/workers/chladni.md` with friction for CONTRACTS.
5. **Orchestrator:** merge; `IDS=11 tools/scene-md5.sh` references; the nine SeeYouDrop windows in file mode (extend
   `nav2-window.py` with a file-source mode rather than forking it; per-frame traces + a per-beat / per-event table after
   `perbeat14.py`'s shape + montages); `lum.py`; bench; AUDIT-v0.15 sections; DECISIONS §48; `NEXT-SESSION-PROMPT.md`; memory.
6. **Stop and report.** The ruler table (engine, both modes), the nine montages, what met and what did not. **Do not run
   `tools/accept.sh`** — the user said "wait for my say before running full sweep". No bid, no tag, no push until the user's word.

## What this session is not

Not a change to any other scene (ids 0–10 stay pixel-identical), not a change to any existing MS field's value, not machine-learning
stems inside the engine, not an OKLCH default, not anything in `docs/OPEN-ITEMS.md`. If the user's first sentence of the session changes the spec, it
outranks every lean here. The concept (Chladni), the figure table, the section boundary shapes and every constant are the
orchestrator's leans, stated as leans in the briefs; the user corrects them at the first montage.
