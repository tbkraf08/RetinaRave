# AUDIT — the live clocks and the capture lag, measured (2026-09-28)

Step 1 of the live-mode plan (the user, 2026-09-28: "focus on live mode … I don't expect to have the file normally"): measure
before building. Two new rulers:

- `tools/truth/gridcheck.py` — the v3 clock (`bpm`, `beatPhase`, `beat`) and the synapse grid (`bpmSyn`, `beatSyn`, `barPos`,
  `phrase16Pos`, `dropExpectedIn`) against the truth grid (`trackmap.py` `beats` / `downbeats`), plus `dropEvt`. Self-test: a
  synthetic trace built from the truth reads 0 ms / 100 %; shifted 25 ms it reads +25 ms; a bar offset of one beat is caught.
- `tools/caplag.js` + `tools/capsrc.html` — the capture path's lag (SYNC_OFS) from a click train, and a capture-mode trace
  whose `t` is the track second the listener hears (docs/HARNESS.md "File source", the capture paragraph).

Every row: `tools/accept/live-grid/*.md`. "det" = a CLOCK=1 file trace of the live code (v3 + synapse run exactly as live; the
analysers see the audio `DET_LEAD` = 42.7 ms **before** it is heard, as in a real-time file or the demo). "capture" = a real
headed tab capture of SeeYouDrop 20–90 s (the analysers see it 27 ms **after** it is heard). Lag + = the visual beat is late.

## The capture lag

**27 ms** median (p10 24, p90 32) over 60 clicks, 60/60 matched (`clicks.json`); the first ~3 s read 15–23 ms (a start-up
transient). Declared with `&sync=27`, which reached capture mode only after the one-line fix in `core/harness.js` (before, only
a file start applied it).

## The beat clocks (SeeYouDrop — the only hand-checked grid)

| | det, whole track | det, 22–90 s | capture, 22–90 s | capture + `&sync=27` |
|---|---|---|---|---|
| v3 tempo ±1 BPM | 95.5 % | 100 % | 95.2 % | — |
| v3 `beatPhase` lag (median) | **−47 ms** | −50 ms | **+14 ms** | +14 ms |
| v3 jitter around its own median, p50 / p90 | 8 / 32 ms | 7 / 16 ms | 7 / 18 ms | 8 / 18 ms |
| v3 `beat` events F ±50 ms | 0.74 | 0.63 | 0.88 | 0.91 |
| synapse `bpmSyn` ±1 BPM | 61.6 % (half-time 14 %) | 87.7 % | 86.2 % | — |
| synapse `beatSyn` lag / jitter p50 | −43 / 10 ms | −40 / 9 ms | +14 / 9 ms | +16 / 6 ms |
| synapse bar line right (`barPos`) | 58.7 % | 90.4 % | 87.0 % | 93.2 % |
| `barConf` median when right / wrong | 0.99 / 0.22 | | 0.98 / 0.00 | |
| 16-beat line within 1 beat of a drop | 0 / 2 | | 0 / 1 | |
| `dropExpectedIn` armed 16 / 8 / 4 beats before a drop | never | | never | |
| `dropEvt` within 2 beats | 2/2 (−6, +4 ms) | | 1/1 (+63 ms) | 1/1 (+62 ms) |

The ears in capture, 25–45 s, **placed** by `…Age`: kick +32 / snare +24 / hat +26 ms at sync 0 → **+7 / −1 / 0 ms** at sync 27
(kick F with the bias removed 0.77, as file mode's causal 0.79). **First-frame** lag stays +52 / +41 / +38 ms at any sync.

Other tracks — tempo only (their truth phase is not trustworthy, below): CyborgNinja v3 99.2 % / synapse 98.2 %;
WhoLikesToParty 99.2 / 98.7 %; Malicious 78.8 / 34.3 % (truth DP residual 90 ms — the truth may be the one wrong).
`dropEvt`: WhoLikesToParty 0 of its 3 truth drops, Malicious 0 of 1 with 3 false (12.0, 18.8, 25.7 s) — truth drops on
these tracks are the tool's, not hand-checked.

## What it says

1. **The clocks are good; their offset is not.** Tempo is right ≥ 95 % of the time on 3 of 4 tracks and the jitter is small
   (p50 7–10 ms). Nearly all the phase error is one constant: where the audio is analysed relative to when it is heard —
   −47 ms in a real-time file / demo (analysis leads by the output latency), +14 ms in capture (analysis trails by 27 ms).
   The clock's own error is about −5 ms (−47 + 42.7 in det; the truth grid sits 4 ms before the kicks), so capture predicts
   +22 against the +14 measured — 8 ms unexplained, inside the two clock fits' 3–5 ms rms plus the 24–32 ms spread.
2. **`&sync` fixes the ears, not the beat.** Neither clock reads `heardT`, so sync 27 left them at +14 / +16 ms. Step 2
   (run the clocks ahead) needs one number per mode, "analysis time − heard time" (demo / real-time file −outputLatency,
   capture +SYNC_OFS, mic unmeasured), plus a display lead for the 1–3 frames to the glass that no number here contains.
   Picture-late is the direction BT.1359 notices first (45 ms), and capture sits at +14 + display ≈ 30–65 ms.
3. **Live anticipation of drops is absent.** `dropExpectedIn` never armed before either SeeYouDrop drop; the synapse 16-beat
   line missed both — SeeYouDrop's drops are 30 bars apart, so no fixed 16-beat count from the start can hit both. A phrase
   counter has to re-anchor at boundaries. v3's `dropEvt` is reactive (on the drop, +63 ms late in capture).
4. **The bar line is trustworthy exactly when `barConf` says so** (0.99 right vs 0.22 / 0.00 wrong) — usable as a gate.
5. **Reacting to hits has a 38–52 ms floor in capture.** Ages place a motion right but cannot start it before the audio
   arrives; only prediction (step 3, bar fingerprints) can put a hit on time.

## Open

- Truth grids: CyborgNinja's kicks sit at beat phase 0.19 / 0.69 (its grid phase is ~70 ms off); Malicious' kicks are uniform
  over the beat. Fix in `trackmap.py` before grading phase on them.
- SYNC_OFS is this desktop's: re-measure (`node tools/caplag.js clicks 30`) on any other machine; mic mode is unmeasured.
- The display path (compositor + vsync) is unmeasured; a photodiode-free proxy would be a headed screenshot timestamp loop.
- Not run: `tools/accept.sh`, parity (the one engine-side change, `&sync` in `core/harness.js`, is inert without the hash).

## Step 2 — the lead (`engine/lead.js`, `&lead=1` / the `L` key)

The clocks' own state is untouched; after every stage the engine publishes the clocks moved by `leadT` = heardT − the
analysers' newest audio time (+ `&disp`), and puts the raw values back before the next frame. Off is the default.

| SeeYouDrop 22–90 s | v3 `beatPhase` lag, off → on | v3 `beat` F ±50 ms, off → on | synapse `beatSyn` lag, off → on | `leadT` |
|---|---|---|---|---|
| file-det | −50 → **−7 ms** | 0.63 → **0.95** | −40 → **+3 ms** | −42.7 ms |
| real-time file (headless; 2 lead runs) | −54 → **−7 / −20 ms** | 0.60 → **0.94 / 1.00** | −52 → **−6 / −6 ms** | −43 ms |
| capture (headed, audible) | +14 → **−11 ms** | 0.88 → **0.94** | +14 → **−7 ms** | +27 ms |

Jitter is unchanged (it is a pure shift). Every clock now sits within 20 ms of the beat, mostly early (−3…−20; synapse det
+3; real-time runs differ by ~13 ms run to run with the same lead — where the v3 PLL settles); the 1–3 frames to the glass (not
measured) are later still, so `&disp` stays 0 until they are. Lead off: the whole-track det trace is byte-identical to the
pre-change one (`cmp`), parity fake 0 diff, `check.js` 0 fail, `npm test` OK; the bundle runs from `file://` with the lead.
The real-time bar-line share (84 % off, 61 % on) is run-to-run synapse voting, not the lead: a 0.1-beat move cannot change
which beat rounds to bar 1.

A pitfall found on the way: in the first frames after a context starts `getOutputTimestamp().performanceTime` can trail
`performance.now()` by 250 ms, so `AU.ctxHeard()` reads +0.24 s for a frame. An EMA seeded there still read +40 ms three
seconds later (the demo from `file://`, 4 runs in 6); `lead.js` now drops stale timestamps (> 50 ms) and takes the median of
64 samples (6 of 6 runs −29…−32 ms). `heardT` itself has the same first-frame glitch in real-time file / demo mode (open).

## Step 3 — bar fingerprints (`engine/bars/`, predicted hits, section starts, returns)

Built on the **live path** only: `&map=0` (3.0) makes a file run the causal ears, deterministically; the store is graded by
`tools/truth/predcheck.py` (3.2, self-tested) on a `&map=0&lead=0` det trace replayed through `tools/bars-replay.js` (the page
and the replay agree on 9442 of 9444 event frames; the lead on / off changes nothing in the stage's output — 0 frames), then on one
**audible capture run** (SeeYouDrop 20–90 s, `&sync=27`, `FIELDSX=…`). "reactive" = the ears' own `<cls>Evt` on its first
frame, in the same trace. Lag + = late; F / P / R within ±30 ms of `onsets.click` / `mid` / `high`.

| | kick F (P) · lag | snare F (P) · lag | hat F (P) · lag | reactive kick / snare / hat F · kick lag |
|---|---|---|---|---|
| det, groove 25.6–44.8 | 0.67 (0.76) · −5 ms | 0.64 (0.77) · +1 | 0.55 (0.64) · +3 | 0.80 / 0.74 / 0.69 · +5 |
| det, groove-return 89.6–96.0 | 0.64 (0.56) · −13 | 0.82 (0.82) · −1 | 0.68 (0.59) · +5 | 0.59 / 0.72 / 0.74 · +4 |
| det, gated 105.6–131.2 | 0.26 (0.37) · −6 | 0.46 (0.67) · +2 | 0.54 (0.83) · +2 | 0.27 / 0.64 / 0.84 · +2 |
| det, whole track | 0.47 (0.58) · 0 | 0.59 (0.80) · −1 | 0.52 (0.74) · +2 | 0.53 / 0.59 / 0.72 · +4 |
| **capture, 22–90 s** | **0.46 (0.65) · +5** | **0.47 (0.74) · +1** | **0.53 (0.86) · +3** | **0.02 / 0.06 / 0.11** (first frame +38–52 ms, outside ±30) |
| CyborgNinja det, whole | 0.33 (0.68) · +5 | 0.34 (0.74) · +2 | 0.45 (0.75) · 0 | 0.65 / 0.64 / 0.82 · +7 |
| WhoLikesToParty det, whole | 0.27 (0.76) · +8 | 0.26 (0.73) · +7 | 0.35 (0.83) · +5 | 0.52 / 0.52 / 0.61 · +6 |
| Malicious det, whole | nothing released (3 events in 150 s: the grid never locks — "never invent") | | | 0.16 / 0.23 / 0.55 |

In capture **100 %** of the matched predictions were released before the audio reached the analysers (release < truth + 27 ms);
42 % of the frames carry `predConf` ≥ 0.35 (the release gate). Predictions in the first bar after an annotated boundary (det,
whole): kick 14 released / 4 false (P 0.71, elsewhere 0.56), snare 20 / 0, hat 29 / 10 (P 0.66, elsewhere 0.75).

| Section events, SeeYouDrop | det, whole (10 boundaries, 3 returns) | capture 20–90 (5 / 1) |
|---|---|---|
| `barNovelEvt` (new) | **3 / 10**, +1.4 / +1.2 / +2.0 beats (void, slides = drop 1, groove-return); 6 false | 2 / 5 at +3.2 beats; 1 false |
| synapse `boundaryEvt` | 3 / 10, +5.0 / +5.0 / +3.0 beats; 3 false | 2 / 5 at +5.2; 1 false |
| `barReturnEvt` (new) | **1 / 3** (groove-return, +2.0 beats); 4 false | 0 / 1; 1 false |
| synapse `sectionAlt` + `sectionReturn` | 0 / 3 (never labelled) | 0 / 1 |

Cost: 5.1 µs per frame mean, worst frame 0.66 ms (node, the whole track).

### What it says

1. **Prediction puts hits on time where reaction cannot.** In capture the predicted kick / snare / hat land at +5 / +1 / +3 ms
   against the reactive +52 / +41 / +38; the per-class micro-timing offset (the causal kicks sit +25 ms after the heard v3 line,
   the hats on it) is what brings the kick from −16 to −5 ms. Precision is near the ears' own (0.58–0.86 vs 0.42–0.99); recall
   is lower (0.35–0.6) — only a confident majority vote is released, and every onset the ears miss or add is noise in the history.
2. **The v3 grid carries it, synapse only proposes the bar phase.** Synapse's tempo is right 61.6 % of the whole-track det frames
   (half-time through the groove-return and climb-double), v3's 95.5 %; the v3 bar lines landed on all 10 annotated downbeats.
3. **Section starts are faster, not more.** The energy test (the three dims that moved most, against the last 4–8 bars) finds
   the energy changes (void, drop 1, groove-return) 1.2–2 beats in; the changes that are only rhythm or arrangement (groove,
   climb, climb-double, gated's first bar, turn, outro) do not separate from the in-section spread with the causal ears' bits
   at 5–8 steps (per-bar table: tools/work only — see DECISIONS §50). Returns: the groove-return is found on its first bar;
   the climb-double's material follows the groove's in the original order, so it reads as the return continuing.
4. **Degrade works.** Malicious (no stable grid) releases nothing; silence, a tempo jump, a seek give `predConf` 0.

### Open (step 3)

- Richer per-beat features for the section test (synapse's per-beat 23-dim `F` — chroma + 9 log bands — is the obvious next
  input); a bits test robust to the ears' noise (the void's single broadband onset reads as kick + snare + hat at once).
- Only SeeYouDrop has section annotations; CyborgNinja's truth grid is now phase-right (`f0e69e8`, docs/workers/truth-grid-s3.md)
  but has no sections file; WhoLikesToParty's beat phase is right, its bar line is not verified.
- Recall: the confidence gate (0.35) and the majority vote. A per-step soft probability (`predKickP`) would let a scene weight
  instead of gate — not built (no scene asks yet).

## Step 3 — warm-up (the first bars after a cold start; `LIVE-STEP3-WARMUP-SESSION-PROMPT.md`)

The user, after the TORUS2 A/B: *"the predicted seems to bring more energy / brighter strands which I like, but seems like
beat is off slightly in the beginning and gets better over time"*. In live use every start is cold and mid-song.

### W.0 — the cold-start ruler

`tools/warm-rec.sh` records ten det traces on the causal path (`&map=0&lead=0`): per track the whole track and four **cold**
starts (`WARM=0 tools/filetrace.js`: the engine starts AT t0, 40 s each) — SeeYouDrop 25.6 (groove), 57.6 (drop 1), 89.6
(groove-return), 105.6 (drop 2); CyborgNinja 12.02, 48.02, 84.02, 144.02 (its truth section starts). `tools/warm-ruler.sh`
replays them all through the current tree's store (seconds) and `tools/truth/warmcheck.py` grades: P of the releases in the
first 12 s after each cold start's first release, P after, the quiet seconds before the first release, the whole-track F / P.
`predcheck.py --bins W` bins P / lag per W s since a trace's first frame (it reproduces the prompt's capture table exactly);
`bars-replay.js --from <s>` starts the store cold on a warm trace (the store's warm-up apart from the clocks'), `--diag`
logs the store per stored bar.

| baseline (`cd6d305`) | first 12 s of releases: kick · snare · hat P (median lag) | after | quiet s | whole-track F (P) kick · snare · hat |
|---|---|---|---|---|
| SeeYouDrop ×4 | 0.63 (+2) · 0.69 (+1) · 0.65 (+1) — all 0.66 | 0.68 · 0.82 · 0.79 | 20.8 10.7 12.4 20.0 | 0.46 (0.58) · 0.59 (0.80) · 0.52 (0.74) |
| CyborgNinja ×4 | 0.57 (+5) · 0.85 (+4) · 0.76 (+3) — all 0.75 | 0.50 · 0.43 · 0.50 | 18.4 29.4 21.8 26.6 | 0.37 (0.66) · 0.40 (0.73) · 0.51 (0.74) |

What each hypothesis measured to (SeeYouDrop unless named):
1. **Thin history — yes, second.** Precision by bars stored since the start (store cold on warm clocks, 4 starts): 0.52–0.65
   under 5 bars, 0.74 from 16. `predConf` does not separate right from wrong in 0.35–0.6 (P flat ~0.65), so a higher gate
   alone buys nothing. Reliability starts at 0.5 and the first graded bar replaces it (0.79–0.94 after one bar).
2. **Offsets from 0 — small.** The kick offset climbs 0 → 0.2 step (20 ms) over ~10 bars; the wrong releases are **whole
   steps** wrong (0–1 of ~140 within 30–60 ms, the rest ≥ 60 ms), so the offset moves the lag, not the precision.
3. **Bar phase moving — real on a true cold start**: 4 of 8 cold starts move the phase 10–24 s in (0 moves when only the
   store is cold, on warm clocks; 0 on the whole tracks).
4. **The clocks settle — first.** The v3 heard-grid line from a cold start: −139 / −75 ms (10–36 % in octave) in the first
   4 s, −44 / −28 ms at 4–8 s, the warm run's value from 8–12 s. Mechanism: one tempo cut (> 4 %) 1.5–5.6 s in, then the phase
   converges (cold − warm +69 +30 +15 +8 +3 ms per s), settled (< 15 ms for 4 s) 5.8–7.8 s in. The kicks' residual against
   the grid reads −28…−26 ms for bars 1–4, +28…+37 from bar 5 (the warm run's): the first bars are stored **one 16th late**
   and stay in the history as trusted bars — the store's `cut()` keeps every bar stored before it, `ok` is presence only.
   CyborgNinja is not a warm-up case: v3 sits 80–180 ms off its kick-anchored truth warm and cold alike (near half a beat at
   160 BPM) — a clock item for later, the store rides it on its offsets.
5. **Real-time file** (what the user watched): not re-measured yet.

**W.0 re-read on 24 cold starts** (8 more per track, 12 each; SeeYouDrop 38.4 44.8 62.4 70.4 78.4 96 115.2 120, CyborgNinja
24 36 60 72 96 120 132 156). With the store's release grades set beside the WARM store's on the same audio (the whole-track
run inside exactly those windows), the baseline's first releases are **not less precise than a warm store's**: SeeYouDrop
0.73 vs 0.72, CyborgNinja 0.66 vs 0.71 — the reliability grading already went quiet after the bad first bars (0.15–0.2),
and what stays wrong is the audio's own (the ears' kicks in the sub-drop, the first bars of a new section). What IS off is
the **timing**: the first 4 s of releases land early (SeeYouDrop kick / snare / hat −13 / −9 / −5 ms against +0 / −1 / +2
later; the start-at-0 run the user watched: −11 det, −7 / −11 / −10 real-time, then +3…+7) — released on a grid still pulling
in, with offsets learned from 0 and from the pull-in's residuals. "Slightly off, gets better over time."

### W.1 — the warm-up (`engine/bars/bars.js` `WARM`)

- **The grid settles before it is trusted (hypothesis 4).** Per bar the store sums the clock's slip (`ΔB − bpm/60·dt`: the
  PLL pulling; `dt` now in the feed). After a start or a discontinuity, bars are untrusted and nothing is released until two
  bars in a row slip < 0.05 beat — or 6 bars have passed (CyborgNinja's clock hunts ±0.1–0.2 beat a bar for good, and
  waiting longer buys nothing). Settled, a bar slipping > 0.12 beat is untrusted. A tempo cut before the grid lived 8 bars
  untrusts that grid's bars. The section tests keep their own trust (`okE`: presence only) — a per-beat energy mean does not
  care about a grid 50 ms off, a 16th pattern does (without it the void boundary was lost: 3/10 → 2/10; with it 3/10 again).
- **Offsets learned on the settled grid only, 1/n until n = 20, then the EMA; reset with the reliability at a
  discontinuity (hypothesis 2).**
- **Reliability earned (hypothesis 1):** ×relN/2 until two bars were graded (the first graded bar replaced the 0.5 seed).
- **The phase move (hypothesis 3):** not re-cut — after W.1 no row blames it (the moves come 10–24 s in, after the first
  releases; the release timing after them is on the steady rows).

| 12 cold starts / track, det | first 12 s of releases P (median lag) kick · snare · hat | first 4 s median lag | quiet s (12 starts; − = none in 40 s) | whole F (P) |
|---|---|---|---|---|
| SeeYouDrop baseline | 0.67 (−5) · 0.75 (−3) · 0.74 (0) — 0.73; warm same audio 0.72 | −13 · −9 · −5 | 20.8 − − 10.7 16.4 12.0 12.4 12.8 12.0 9.2 20.0 14.7 | 0.46 (0.58) · 0.59 (0.80) · 0.52 (0.74) |
| SeeYouDrop W.1 | 0.56 (+1) · 0.73 (−1) · 0.75 (+1) — 0.70; warm same audio 0.73 | **+1 · −2 · −1** | 19.2 14.0 − 15.2 16.0 13.6 12.0 14.0 11.6 16.0 19.9 18.4 | 0.47 (0.59) · 0.57 (0.80) · 0.51 (0.75) |
| CyborgNinja baseline | 0.54 (+9) · 0.69 (+4) · 0.69 (+4) — 0.66; warm 0.71 | +9 · +4 · +4 | 18.4 22.1 24.2 29.4 11.1 29.6 19.7 21.8 14.1 26.3 26.6 34.8 | 0.37 (0.66) · 0.40 (0.73) · 0.51 (0.74) |
| CyborgNinja W.1 | 0.55 (+8) · 0.68 (+4) · 0.67 (+4) — 0.65; warm 0.69 | +5 · +4 · +4 | 15.2 22.1 24.2 − 11.1 35.5 33.2 21.7 14.1 26.5 30.5 34.8 | 0.37 (0.67) · 0.40 (0.73) · 0.51 (0.75) |

The kick P row moves 0.67 → 0.56 on SeeYouDrop because the first releases now fall on other audio (later): the warm store on
those same seconds reads 0.57. Sections unchanged (`barNovelEvt` 3/10 at +1.4/+1.2/+2.0 beats, `barReturnEvt` 1/3). The rows
per variant (`--set GATE=0,OFF_SET=0,REL_N0=0` = the old store, then each lever on its own) are in `tools/work/warm-*/`;
`tools/test_bars.js` gained the cold-start case (the loop entered mid-way on a clock that cuts its tempo and pulls its phase
in, kicks +25 ms: first 12 predicted kicks median 0.0 ms, nothing released while the clock is off; the control with the
warm-up off −8.3 ms).

**The price (W.2, W.1 as committed — W.1b below removed it):** B's LOOK is untouched (`predKick` / `predSnare` / `predHat` still peak 1.0 on every predicted hit), but
it is quiet longer after a cold start — SeeYouDrop's median first release 15.2 s against 12.6 before (11 of 12 starts
release within 40 s, 10 before); CyborgNinja's 24.2 against 23.2, and one of its starts releases nothing in 40 s (its clock
never settles there — 12 of 12 released before). The user decides.

### W.1b — the offsets are a median; the gate is off (supersedes W.1's defaults)

The real-time **start-at-0** run (the page opened on the track, as the user watched it: the 25 s walk, then the groove) still
released the groove's first 8 s early after W.1 (−7 / −7 / −7 ms). Cause: on a quiet intro the grid settles during the walk
(12.9 s), so the gate never sees the groove arrive, and the kick offset learned from the walk (0.03 step at 25.8 s) crawled
to the groove's 0.23 at the EMA's 0.05 — reached at 38.5 s. So the offset is now the **median of each class's last 16
residuals** (a settled grid's): it follows a new groove within half a window. With it the settle GATE buys nothing
measurable, and it cost 2–3 s of quiet and one silent CyborgNinja start, so `WARM.GATE = 0` (kept as a switch):

| 12 cold starts / track, det | first 12 s P — all (warm same audio) | first 4 s median lag kick · snare · hat | quiet s, median | whole F kick · snare · hat |
|---|---|---|---|---|
| SeeYouDrop baseline | 0.73 (0.72) | −13 · −9 · −5 | 12.6 (2 of 12 silent) | 0.46 · 0.59 · 0.52 |
| SeeYouDrop W.1 (gate on, EMA) | 0.70 (0.73) | +1 · −2 · −1 | 15.2 (1 silent) | 0.47 · 0.57 · 0.51 |
| SeeYouDrop gate on + median | 0.70 (0.73) | +4 · 0 · −2 | 15.2 (1 silent) | 0.47 · 0.57 · 0.51 |
| **SeeYouDrop W.1b (gate off + median)** | **0.72 (0.72)** | **0 · 0 · −6** | 12.2 (2 silent) | 0.46 · 0.59 · 0.52 (= baseline) |
| CyborgNinja baseline | 0.66 (0.71) | +9 · +4 · +4 | 23.2 | 0.37 · 0.40 · 0.51 |
| **CyborgNinja W.1b** | **0.65 (0.72)** | +5 · −2 · 0 | 23.2 | 0.37 · 0.39 · 0.53 |

Start-at-0, det: the groove's first 8 s kick −11 → **+5 ms** (later +5), snare +1 → +1, hat −4 → +5 (later +2). Sections
unchanged (3/10 at +1.4 / +1.2 / +2.0 beats, returns 1/3). The steady kick lag reads +4 ms against the EMA's 0 (the kick
residuals are skewed late; the median sits in the bulk). `tools/test_bars.js`: the cold-start case plus the same after a 6-bar
intro whose pads read as kicks 20 ms early — the first 12 groove kicks median 0.0 / −2.1 ms, nothing released while the clock
is off, the last 8 bars exact, 2 first-sight guesses per run (a bar not yet stored; the first groove bar carrying an intro
kick).

### W.1c — real-time, the same inputs through both stores; the audible capture

`bars-replay.js` now replays a **lead-on** trace (a real-time file or a capture run on the default hash): the raw clocks are
rebuilt as published − `leadT`·bpm/60, `LEAD.L` = `leadT`, dt from the trace. Checked against the page on the start-at-0
real-time run: kick 57 / 57, snare 67 / 69, hat 62 / 64 events on the same frame. So the 12 real-time cold starts recorded
this session (three rounds × SeeYouDrop 25.6 / 57.6 / 89.6 / 105.6, `tools/work/warm-rt{0,1,2}/`) were replayed through the
old store and the new one on identical inputs:

| real-time, 12 cold starts, same inputs | first 12 s P — all | first 4 s median lag kick · snare · hat | after |
|---|---|---|---|
| old store (`cd6d305`) | 0.71 | −9 · −5 · −6 ms | −4 · −6 · −1 |
| **W.1b** | 0.70 | **+7 · +3 · −5** | **+1 · 0 · +2** |

The settled state is centred now; the first releases no longer run early, but the kick's overshoot to +7…+8 ms for the
first 8 s does not move with the median's window (8 / 16 / 24 / 32 residuals all read +7…+8): the groove's first kicks are
DETECTED late by the ears (their own warm-up), and the offset follows them. The old EMA's early bias used to cancel it by
accident. That is the ears' warm-up — step 4 (detector v2) territory, not the store's.

**The audible capture, cold** (`caplag.js track SeeYouDrop 24 50 27`, W.1b, `tools/work/caplag/SeeYouDrop-cap-cold24-w1b.json`;
the pre-warm-up capture kept as `…-cap-sync27-fx-prewarmup.json`): P kick / snare / hat **0.75 / 0.87 / 0.75** (the 3.4 capture
0.65 / 0.74 / 0.86), F 0.51 / 0.48 / 0.45, median lag +8.5 / +10.9 / +9.1 ms (3.4: +5 / +1 / +3), 98–100 % released before the
audio arrived; first releases 12 s in, +13…+19 ms for their first 8 s, then +1…+16. One run each, different start points
(19 vs 24 s), not the same input — the capture's own run-to-run spread is not measured; `FIELDSX` with the replay's inputs
(`node tools/bars-replay.js --fields`) would make the next capture replayable.

## Step 4 — build / drop (`LIVE-STEP4-BUILD-SESSION-PROMPT.md`)

Live, nothing anticipates a drop ("What it says" 3). Step 4 measures first: B.0 a ruler and the existing fields graded on it,
B.1 a node harness and a study of the causal candidates. Truth drops (heard s, `tools/truth/<Track>.json`, the tool's, only
SeeYouDrop's hand-checked): SeeYouDrop 57.6 / 105.6, WhoLikesToParty 57.5 / 131.4 / 188.8, Malicious 148.3; **CyborgNinja has
none — the false-alarm control.**

### B.0 — the ruler (`tools/truth/dropcheck.py`) and the existing fields

`dropcheck.py` (numpy only, `--selftest` on synthetic traces: a 16-beat ramp over 0.5 reads 8 beats, a count-down its own
length with 0 pointing error, an event +50 ms, a flicker bridged, a 50 % mask ~0.5 chance) grades an ARM RULE per field —
a level `f>=x`, a count-down `f<=n` (beats; negative = none), an event `f:evt`. Per truth drop: the **anticipation** = beats
the armed run live at the drop has been armed (it may end ≤ 1 beat before the slam — a gap bar; gaps ≤ 1 beat bridged),
0 = not armed; an event's **lag** (nearest within ±2 beats). **False arms / min** = arm onsets with no truth drop in the next
16 bars (64 beats: a longer lead is no anticipation a visual can use), on the drop tracks and on CyborgNinja apart.
**Armed %** and a **chance hit** rate beside it (the arm mask circularly shifted 200×: the drops it would "anticipate" by
luck). Traces: `tools/build-rec.sh` — whole tracks, det, `&lead=0`, `&map=0` (the causal path — what stream mode runs) and
`&map=1` (the file map, the non-causal ceiling); `dropcheck.py … --summary` pools them. Drops in the order SeeYouDrop 1 2 ·
WhoLikesToParty 1 2 3 · Malicious 1.

| rule | anticipation per drop, beats (event: lag ms) | armed at drop | false /min drop tracks | false /min CN | armed % drop / CN | chance hit |
|---|---|---|---|---|---|---|
| v3 `build>=0.5` | 7.9 2.2 · 0 0 0 · 0 | 2/6 | 0.57 | 0.33 | 6.5 / 7.0 | 0.08 |
| v3 `build>=0.3` | 10.2 3.0 · 0 0 0 · 0 | 2/6 | 0.57 | 0.33 | 10.5 / 11.0 | 0.12 |
| v3 `dropEvt` (event) | −6 +4 · — — — · — | 2/6 | 0.28 | 0 | — | 0.01 |
| synapse `riser>=0.5` / `>=0.2` | 0 on all · (0.1 on WLTP 2) | 0/6 · 1/6 | 2.55 / 3.11 | 0.33 | 4.7 / 0.2 · 6.9 / 0.3 | 0.07 / 0.09 |
| synapse `dropConf>=0.3` / `>=0.1` | 0 on all / 0.4 on SYD 1 | 0/6 · 1/6 | 0.09 | 0 | 1.1 · 1.7 / 0 | 0.02 |
| synapse `dropExpectedIn<=16` / `<=8` | 1.0 (pointing +11.9 beats late) on SYD 1, else 0 / 0 on all | 1/6 · 0/6 | 0.09 | 0 | 1.7 · 0.6 / 0 | 0.03 / 0.01 |
| synapse `hush>=0.5` | never armed anywhere | 0/6 | 0 | 0 | 0 / 0 | 0 |
| synapse `hp>=0.5` (high-pass sweep evidence) | **18.0** 0.8 · 0 0 0 · 0 | 2/6 | 0.75 | **0** | 2.6 / 0 | 0.03 |
| synapse `roll>=0.5` / `swell>=0.5` | 0 4.7 · 0 0 0.6 · 0 / 3.3 on SYD 1 | 2/6 · 1/6 | 5.00 / 3.40 | 3.34 / 0.33 | 10.7 / 5.0 · 11.3 / 1.2 | 0.18 / 0.17 |
| MS `tension>=0.5` (v3's roughness, not synapse's) | 0 on all | 0/6 | 5.66 | 5.67 | 6.1 / 2.1 | 0.10 |
| synapse's own tension `synTension>=0.3` (node) | 1.0 on SYD 1 | 1/6 | 0.38 | 0 | 3.4 / 0 | 0.04 |
| synapse's evidence `synAll>=0.3` (node) | 10.6 6.6 · 0 0 1.6 · 0 | 3/6 | 6.13 | 5.33 | 13.3 / 4.7 | 0.23 |
| synapse's drop event `synDropEvt` (node; not in MS) | never fired | 0/6 | 0 | 0 | — | 0 |
| **ceiling** map `buildProg>0` | 20.0 12.0 · 0 0 0 · 0 | 2/6 | 0 | 0 | 3.9 / 0 | 0.06 |
| **ceiling** map `toDrop<=16` / `<=32` | 16 16 · 0 0 0 · 15.9 / 32 32 · 0 0 0 · 31.8 | 3/6 | 0 | 0 | 7.0 / 0 · 13.9 / 0 | 0.07 / 0.18 |
| **ceiling** map `mapDropEvt` (event) | +11 +4 · **−1007 −1019 −1021** · +39 | 6/6 | 0 | 0 | — | 0.02 |

What it says:
1. **Nothing live anticipates.** The best existing causal arm is v3's `build` (an energy-arc level): 2 of 6 drops, both on
   SeeYouDrop (7.9 / 2.2 beats at 0.5), 0.57 false arms / min and armed as often on CyborgNinja (7 %) as on the drop tracks —
   it is "the energy went up", not "a drop is coming". Synapse's anticipation chain is dead on the live path: `dropExpectedIn`
   armed once (1 beat before SeeYouDrop's drop 1, pointing 12 beats late), `dropConf` peaks at 0.1–0.3, `hush` never set, and
   synapse's own drop event never fired — its `tension` needs `ev.all > 0.3`, which the riser / roll / swell evidence reaches
   mostly where no drop comes (`synAll>=0.3` 6.1 false / min, 5.3 on CyborgNinja).
2. **The one existing field with a real signal is synapse's `hp`** (the high-pass sweep: bass pulled + the low spectral edge
   rising): 18 beats before SeeYouDrop's drop 1, never armed on CyborgNinja, armed 2.6 % of the time. At 0.5 it misses the
   other four; B.1 below finds its 5 s mean the best single arm.
3. **The reactive events are on time where they fire:** v3 `dropEvt` −6 / +4 ms on SeeYouDrop, 0 false on CyborgNinja — but
   0 of 4 on WhoLikesToParty / Malicious (their drops do not follow a bass absence ≥ 1.8 s).
4. **The ceiling is not a ruler on WhoLikesToParty.** The file map puts all three of its drops **2.0 beats (half a bar) before
   the truth** (56.50 / 130.33 / 187.77 vs 57.51 / 131.35 / 188.79 s, beat 0.513 s) — WhoLikesToParty's truth bar line is the
   unverified one (step 3 "Open"). The node study below sees the bass return in the truth's bar 0, not the map's; either way
   the map's `toDrop` counts to its own drop, 2 beats early, and its 16 / 32 beats read as 0 here (the run ends > 1 beat before
   the truth drop). On SeeYouDrop and Malicious the ceiling is the ideal: 16 / 32 beats of warning, 0 false.
5. The rows marked "node" come from the B.1 harness (`tools/build-node.js` — synapse's internals MS does not carry); it
   agrees with the page runs field for field (B.1), so they are the live code too.

### B.1 — the node harness and the candidate study

**The harness** (`tools/build-node.js`, on `tools/node-stream.js` — the det time base now shared with `drums-node.js`, whose
output is byte-identical after the move, md5 `94a34ac0`): a track's PCM through synapse's Analyzer behind its own `Tap`
(`frame()` decays, beat-clock lead, as the page), the causal ears, and **v3 itself** — `features.js updateMusic` runs in node
on the det analyser shims (`engine/shim.js`, as `file.js armDet`), one process per track (MS is a module singleton). 80 fields
per frame, 6–9 s per track (the page: ~3 min). **Page = node** (`build-node.js --cmp`), whole tracks: the ears on the `&map=0`
traces — `denK/S/H`, `subGate`, `subIn`, `subOut`, `lpSweep` equal (≤ 5e-5) on 100 % of frames on SeeYouDrop, CyborgNinja,
WhoLikesToParty (subGate / subOut 2 frames of 15366 off), Malicious 99.1 % (`denS` / `denH` 120 frames); synapse `hp`,
`dropConf`, `dropExpectedIn`, `hush` 99.7–100 % (riser 96.5–99.9 %, max 0.036); v3 `dropEvt` identical, `build` / `eM` within
0.015, v3's beat position = the page's + 1.00 beat (a count offset from the page's pre-roll frames) ± 0.01 beat, `bpm` differs
by > 1 on 0.03 % of frames. On `&map=1` the ears read the map (not causal), so parity is graded on `&map=0`.

**The study** (`tools/truth/buildstudy.py`, numpy): 60 candidates (levels; events as rates) × the user's seven grains
(8 5 3 2 1 0.569 0.224 s) × four causal transforms (trailing mean `lvl`, its change across one grain `rise`, and against the
last 32 s `dev` / `rel`), graded as a directional AUC of "in the PRE window before a truth drop" vs "elsewhere" (after 10 s),
per drop track and pooled with CyborgNinja; CyborgNinja apart (AUC vs CN, the share of its frames past the PRE median); the
lead in beats at the elsewhere p90 and that arm's false arms / min. Rows `tools/accept/live-grid/build-study-pre{16,8,4}.md`,
per-drop signatures `build-signature.txt`, arms `build-arms.txt`, strip plots `build-<Track>.png`.

| PRE window | best candidates (transform, grain): pooled AUC · worst track · vs CN | lead beats (SYD 1 2 · WLTP 1 2 3 · Mal) at the elsewhere p90 · false/min drop / CN |
|---|---|---|
| **16 bars** (the brief's) | nothing separates: best `phraseConf` rel 8 s **0.73** · 0.70 · 0.66; `width` rel 8 s 0.76 · 0.49; `high` rel 8 s 0.68; the densities `denK/S/H`, `lpSweep`, `riser` ≤ 0.62 | ≤ 1 drop anticipated by any |
| 8 bars | `subConf` rise 5 s 0.81 · 0.78 · 0.87; `subPure` dev 5 s 0.83 · 0.71; `subGate` rise 5 s 0.78; `bassS` rise 5 s 0.76 · 0.64 · 0.80 | bassS: 15 7 · 13 12 11 · 12 · 2.37 / 0 |
| **4 bars** | `subConf` dev 5 s **0.94** · 0.95 · 0.97; `subGate` dev 5 s 0.92 · 0.95 · 0.96; `subOut` rise 8 s 0.90; `bassS` rise 5 s 0.87 · 0.81 · 0.92; `eFast` rise 5 s 0.88; synapse `hp` rise 8 s 0.91 · 0.68 (Malicious) · 0.94 | subGate: 17 9 · 13 12 12 · 17 · 1.38 / 0.35 · hp: 18 10 · 14 13 13 · 0 · 1.19 / 0.35 |

**By grain** (4 bars): the build is a **2–8 s** thing — `subConf` / `subGate` dev peak at 3–5 s (0.94 / 0.93), `bassS` / `eFast`
rise at 5 s (0.87 / 0.88), `hp` rise at 8 s (0.91); at 0.224–0.569 s every one of them falls to 0.50–0.88 (the rises to chance).

**The signature** (`build-signature.txt`: per drop, each bar's mean as a percentile of that track's non-build frames) is one
shape on all five SeeYouDrop / WhoLikesToParty drops — **a void of 2–5 bars before the slam**: `bassS` and `eShort` at the
0–3rd percentile (SeeYouDrop drop 1 from bar −5, drop 2 from −3, WhoLikesToParty from −3), the sub gate open, the centroid at
the 86–99th (only highs left), synapse's `hp` (bass pulled + the low edge rising) on through it and `riser` set in 4 of 5;
before the void a climb shows on SeeYouDrop only (`denH` at the 100th in bars −8…−6 of drop 1, −6…−4 of drop 2). The drop bar
itself: bass back (percentile 11–80). Malicious' tool-made drop has no void (`bassS` 26–43 through bars −3…−1; `lvl` dips only
in −2…−1) — no candidate anticipates it, and its intro (10–30 s) carries three bass cuts with slams that look like builds (v3
`dropEvt` fires on them, B.0).

**Arms** (`buildstudy.py --arms`, causal trailing means, graded like dropcheck):

| arm rule | anticipation beats, SYD 1 2 · WLTP 1 2 3 · Mal | false /min drop tracks | CN | armed % SYD / WLTP / Mal / CN |
|---|---|---|---|---|
| **synapse `hp`, 5 s mean > 0.1** | **16.6 8.6 · 11.1 10.0 10.2 · 0** | **0.20** | **0** | 11.7 / 8.3 / 8.8 / 0 |
| `hp` 5 s > 0.05 | 17.5 9.5 · 12.9 12.1 12.2 · 0 | 0.69 | 0 | 15.8 / 11.3 / 13.0 / 0 |
| `bassS` 2 s < 0.6 × its 32 s mean | 16.0 8.0 · 11.2 11.0 11.1 · 0 | 0.59 | 0 | 8.3 / 7.2 / 5.2 / 0 |
| `hp` 5 s > 0.1 & `bassS` 2 s < 0.8 × | 16.6 8.6 · 11.1 10.0 10.2 · 0 | 0.30 | 0 | 8.4 / 7.4 / 5.0 / 0 |
| `subGate` 5 s < 0.7 × its 32 s | 14.0 5.4 · 6.5 0 0 · 16.5 | 1.38 | 0 | 10.6 / 1.3 / 28.7 / 0 |
| v3 `build >= 0.5` (B.0's best, same traces) | 7.9 2.2 · 0 0 0 · 0 | 0.59 | 0.35 | 8.1 / 0.9 / 2.0 / 2.8 |

`hp 5 s > 0.1`: 5 of 6 drops 8.6–16.6 beats (2–4 bars) ahead, against a chance hit of ~0.1 at 10 % armed; its only false
arms are Malicious' intro (10.0–29.6 s, the bass-cut figures) and the last 0.3 s of WhoLikesToParty (the fade); nothing on
CyborgNinja. Its run outlives the drop by 2–4 s (the 5 s mean) — a detector disarms on the slam. The slam itself: the ears'
nearest `kickEvt` lands −6 / +10 / +15 / +12 ms from four of the drops (SeeYouDrop drop 2 −396, Malicious +106); `subIn`
+44…+312 ms; `bassS` back to 0.8× its mean −255…+571 ms — the kick on the bar line is the only on-time slam cue.

What it says:
1. **Live, a drop is announced 2–5 bars ahead, not 16.** Over 16 bars no causal signal separates build from elsewhere (AUC ≤
   0.76, CyborgNinja-safe ones ≤ 0.73); the separable part is the **void** — the bass and sub pulled out for the last 2–5 bars,
   highs left, synapse's high-pass evidence on. A 16-bar build ramp (`buildProg`'s shape) cannot be read live on these tracks.
2. **The climb is not a general cue.** Hat / snare density climbs (`denH` / `denS`) show before SeeYouDrop's drops only; on
   WhoLikesToParty the densities stay mid-range through the void. `lpSweep` never moves before a drop (0 or ~70 flat); `width`
   rises in SeeYouDrop's voids only. The riser is set in the void, not before it (`riser` AUC ≤ 0.62 at every window).
3. **The best existing field is synapse's `hp`, smoothed** — 0 CyborgNinja false at every threshold tried; synapse's own
   chain throws it away (`hp` feeds `ev.all` at weight 0.5 behind a grid gate; `tension` never climbs, B.0).
4. Malicious is the open case: a truth drop with no void, and an intro whose bass cuts look like builds; its drops are the
   tool's, not hand-checked (the ruler's weakest truth).

**Proposal for B.2 (not built).** Inputs: synapse `hp` (5 s mean), `bassS` against its 32 s mean, the ears' `kickEvt` /
`subGate`, the v3 grid (`beatCount`, `beatPhase`, `bpm`) with synapse's `barConf` ≥ 0.9 gate, `presence`. **Arm** (`buildLive`
0..1): `hp5 > 0.1` or `bassS2 < 0.6×` held ≥ 1 bar, starting on a bar line; the level ramps with the void's length in bars
(1 bar 0.4 → 4 bars 1.0). **`dropLiveIn`**: beats to the next bar line while armed (the drop is on a bar line — every truth
drop is; the void's length varies 2–5 bars, so the count is to the NEXT candidate line, not to a phrase end; a 4-bar phrase
counter re-anchored at the void's start is the alternative to A/B). **`dropLiveEvt`**: the first ears kick within ±⅛ beat of a
bar line while armed (or while armed within the last beat) — expected lag −6…+15 ms (det), capture +38…52 ms like every reactive
event (the drop cannot be released early live; in file modes the lead can). **Disarm**: the slam; 8 bars armed with no slam
(a breakdown, not a void); silence (`presence` < 0.15), a seek, a v3 tempo jump. Expected on these four tracks: armed 5 / 6
at 8.6–16.6 beats (2–4 bars), ≤ 0.2–0.3 false arms / min on drop tracks, 0 on CyborgNinja, `dropLiveEvt` 4–5 / 6 within ±20 ms
(det). Needed first: a second no-drop control and a hand check of WhoLikesToParty's / Malicious' drops (the map disagrees with
the truth by 2 beats on WhoLikesToParty, B.0).

### B.2 — the detector (`engine/build/build.js`, stage `features-build.js`; `buildLive` / `dropLiveIn` / `dropLiveEvt`)

Built as B.1 proposed, then every knob measured on the node loop (`tools/build-node.js` runs the stage on the det time base
and records its inputs; `tools/build-replay.js` replays a knob change over the recorded inputs in < 1 s — replay = node, the
same `feed()` and `Build`). Additive: a new stage after the drums (registered before the lead, on the raw clocks, the bars
stage's heard time base `B = beatCount + beatPhase + LEAD.L·bpm/60`); it reads synapse's `hp` / `bassS` / `sub` / bar line,
v3's clock and presence, and the ears' CAUSAL low-onset lane (`Ears.lowReleased` + `pendLow` — never the file map's onsets,
so a file with its map and a capture run the same detector); no scene reads the new fields by default.

**The detector.** `void` = `hp` 5 s mean > 0.1 **or** `bassS` 2 s mean < 0.6 × its 32 s mean, after 32 s of music
(presence ≥ 0.15), gaps ≤ 1 beat bridged. **Arm** on the next bar line of the heard grid once the void is on (`HOLD` 0 —
below); `buildLive` = 0.4 + 0.15 per bar of void (1 at 4 bars); `dropLiveIn` = beats to the next bar line (0 through the
first ⅛ beat after a line: "now"), −1 when not armed. The bar phase: v3's own count (`beatCount` mod 4) until synapse proposes
a sure bar line (`barConf` ≥ 0.9, same octave) for 8 beats running — the bars store's rule. **The slam** (`dropLiveEvt`): a low
onset within ⅛ beat of a beat line while armed for ≥ 1 bar (a bass return inside a void's first bar is a pickup — a void is
2–5 bars, B.1), confirmed within ¼ beat by the bass coming back — `bassS` ≥ 1.75 × its 2 s
mean as the onset arrived, or `sub` ≥ 5 × its own — released on the confirming frame (never before the onset less the display
lead), then disarmed (`buildLive` 0). **Disarm** also after 8 bars armed with no slam, on silence, a seek (the heard beat
jumps), a tempo jump (> 4 %); after a slam or a timeout it re-arms only once the void has been gone a bar.

**Node, `&map=0`, det (`dropcheck.py`; drops SeeYouDrop 1 2 · WhoLikesToParty 1 2 3 · Malicious):**

| rule | anticipation beats / event lag ms | armed at drop | false /min drop tracks | false /min CN | armed % drop / CN | chance hit |
|---|---|---|---|---|---|---|
| **`buildLive>=0.4`** | **15.9 7.9 · 11.0 7.0 11.0 · 0** | 5/6 | 0.19 | **0** | 4.1 / 0 | 0.05 |
| `dropLiveIn<=16` (pointing error) | same runs; err −0.0 −0.0 · +1.0 +1.0 +1.0 · — | 5/6 | 0.19 | 0 | 4.1 / 0 | 0.06 |
| **`dropLiveEvt`** (event) | **−6 +21 · +10 +48 +12 · —** | 5/6 | **0** | **0** | — | 0.02 |
| v3 `build>=0.5` (B.0, same traces) | 7.9 2.2 · 0 0 0 · 0 | 2/6 | 0.57 | 0.33 | 6.5 / 7.0 | 0.08 |
| v3 `dropEvt` (B.0) | −6 +4 · — — — · — | 2/6 | 0.28 | 0 | — | 0.01 |
| ceiling: map `toDrop<=16` / `mapDropEvt` (B.0) | 16 16 · 0 0 0 · 15.9 / +11 +4 · −1007 −1019 −1021 · +39 | 3/6 / 6/6 | 0 | 0 | 7.0 / 0 | 0.07 |

The two false arms are 0.9 s long: SeeYouDrop 120.0–120.9 (a bar with the bass out, 14 s after drop 2; peak 0.49) and
Malicious 222.0–222.9 (the fade at the track's end; 0.54). The WhoLikesToParty arms are quantised to 4k + 3 beats because
its truth drops sit at v3's bar phase 3 (the map put them 2 beats early, synapse's anchor 1 beat late — the WhoLikesToParty
downbeat is the unverified one, B.0); hence `dropLiveIn` points +1.0 beat late there and 0.0 on SeeYouDrop. With the display
lead (`--disp 40`, the default file page) the WhoLikesToParty events land a frame earlier (−7 +31 −5 ms); SeeYouDrop's are
bound by the bass confirmation (−6 +21). Malicious' drop has no void (B.1) — not armed, no event, as accepted.

**Knob sensitivity** (`build-replay.js --sweep`, one step either side; "=" = the default row above):

| knob (default) | step | anticipation SYD 1 2 · WLTP 1 2 3 | false /min drop · CN | `dropLiveEvt` lags / hits |
|---|---|---|---|---|
| `HP_ARM` 0.1 | 0.05 | 15.9 7.9 · 11 11 11 | 0.38 · 0 | = |
| | 0.2 | = | = | = |
| `BASS_ARM` 0.6 | 0 (hp alone) | 15.9 7.9 · 11 7 **7** | **0** · 0 | = |
| | 0.4 | 15.9 7.9 · 11 7 7 | 0.09 · 0 | = |
| | 0.8 | 15.9 7.9 · **0** 11 11 | **1.23** · 0 | 4/6 |
| `MIN_HIST` 32 s | 16 | = | 0.28 · 0 | +1 false event (Malicious' intro bass cuts, 19.4 s) |
| | 48 | = | = | = |
| `HOLD` 0 bars | 0.5 or 1 | **12 4 · 7 7 7** | 0 · 0 | = |
| `MAX` 8 bars | 4 | = | = | SeeYouDrop 1 lost (armed 15.9 beats: the timeout lands first) |
| | 16 | = | = | = |
| `SLAM_AFTER` 1 bar | 0 | = | = | a pickup 2 beats after WLTP 3's arm reads 1.72 × — one step from a false slam |
| | 2 | = | = | WLTP 2 lost (armed 7 beats) |
| `ON_BEAT` ⅛ beat | 1/16 | = | = | SeeYouDrop 2 lost (its 808 lands 0.09 beat off the line) |
| | ¼ | = | = | WLTP 1 3 fire a ¼ beat early (−124 −121: an off-beat pickup) |
| `CONF` ¼ beat | ⅛ | = | = | = |
| | ½ | 15.9 7.9 · 11 7 **0** | 0.19 · 0 | WLTP 1 −290, WLTP 3 fires a beat early (a pickup kick's bass bump) |
| `RET` 1.75 | 1.5 | · · 11 7 0 | | WLTP 1 3 fire a beat early (−407; the pickup's bassS 1.56 × its mean) |
| | 1.6 | = | = | −6 +71 +10 +15 +12 (no sub path) |
| | 2 | = | = | **3/6**: WLTP 1 2 lost (their bass comes back to 1.87–1.93 ×) |
| `SUB_RET` 5 | 0 (off) | = | = | −6 **+87** +10 +48 +12 (SeeYouDrop 2's 808 return: `bassS` reaches 1.75 × only at +87 ms) |
| | 3 | · · **0** 7 11 | | WLTP 1 fires early on a void kick's sub (0.09 false /min) |
| | 8 | = | = | −6 +37 |

What it says:
1. **The arm is the B.1 proposal and it is not sensitive:** `HP_ARM` 0.1–0.2 and `MIN_HIST` 32–48 change nothing; 0.05 and
   16 s add false arms (Malicious' intro). The bass term buys WhoLikesToParty 3 one bar (7 → 11 beats) for 0.19 false /min
   (the two 0.9 s arms); `hp` alone is the zero-false variant. A hold before the arm costs a bar of anticipation on every
   drop (12 4 · 7 7 7) and buys nothing here: the 5 s mean is the hold.
2. **The slam is the tight one.** Within ¼ beat of an on-beat low onset, `bassS` over its 2 s mean reaches 1.56 at most on a
   void's pickup kicks (WhoLikesToParty, 1 beat before drop 3) and at least 1.87 on a drop (WhoLikesToParty 2) — 1.75 is the
   middle of that gap (−11 % / +7 %); 1.5 fires on the pickups (−407 ms), 2 loses two drops. Without `SLAM_AFTER` a pickup two
   beats into WhoLikesToParty 3's arm reads 1.72 — the rule "no slam in the void's first bar" (a void is 2–5 bars) is what
   keeps the gap. The sub path (`SUB_RET` 5) exists for one drop — SeeYouDrop 2, an 808 return whose `bassS` climbs slowly
   (+87 → +21 ms); its margin is 3.0 (a void kick's sub, WhoLikesToParty 1) to 17. On-beat ⅛ and confirm ¼ beat are each one
   step from losing a drop or firing on a pickup. Six drops tune a slam, they do not prove one — the capture run and more
   tracks decide; on WhoLikesToParty the truth itself is ±2 beats (the map's non-causal drop fires 1 s before it, B.0).
3. **A bar gate on the slam does not work live** (measured, not kept): requiring the onset on a BAR line of the detector's
   phase fires 2/6 (WhoLikesToParty's phase is off by a beat, and SeeYouDrop 1's void carries a kick on every bar line — only
   the bass return tells the slam from the build's own kicks).

### B.3 — the proofs (no audible run in this pass; the capture run is the orchestrator's)

- `node tools/check.js` 0 fail (180 MS keys, help.feats gaps 0) · `npm test` OK with `tools/test_build.js` (20 cases: steady music
  never arms, nothing arms before 32 s, a void arms on a bar line and ramps, the slam fires once on its frame and disarms, an
  off-beat onset / a bass-less onset / a slam when not armed never fire, silence decays, a seek resets, 8 bars time out, a tempo
  jump disarms) · `GPU=1 node tools/parity.js fake` 0 diff (72 fields to 1e-9; the new fields "missing in v3" = info).
- **Additive:** SeeYouDrop whole-track det traces from a `git archive d216ec3` tree on its own port against this tree — the
  32-field caplag set (default hash) md5 `87f5c70d`, its `&lead=0` twin `5128572a`, and a 72-field set (build-rec's fields +
  `kick2/snare2/hat2`, `kickEvt/kickAge`, `subConf`, the bars' `predKickEvt/predKick/predConf/barMatch`) `a9aa9c80`: all three
  `cmp`-identical, event log included (1270 entries). No existing value moved.
- **Page = node** (`build-node.js --cmp`, the four `&map=0&lead=0` page traces vs the `--disp 0` node runs): `dropLiveEvt`
  identical frame for frame on all four tracks; `buildLive` / `dropLiveIn` equal on 92.8–100 % of frames (CyborgNinja 100 %),
  the rest at the thresholds — the page's WhoLikesToParty 1 arm lands one bar later (53.4 s vs 51.9: `hp` differs by ≤ 0.007
  on 51 of its frames, enough to move the 5 s mean across 0.1 at that bar line) and Malicious has one more 0.2 s flicker
  (113.7 s); synapse's `hp` / `bassS` / `sub` agree to ≤ 2.3e-4.
- **Page `&map=0` (the numbers for the table; `tools/accept/live-grid/build-b2-page-map0.md`, node `build-b2-node.md`, the sweep
  `build-b2-sweep.txt`; traces `tools/work/build/pg-*-map0.json`):**

| rule | anticipation beats / event lag ms (SYD 1 2 · WLTP 1 2 3 · Mal) | armed at drop | false /min drop tracks | false /min CN | armed % drop / CN | chance hit |
|---|---|---|---|---|---|---|
| **`buildLive>=0.4`** | **15.9 8.0 · 8.0 7.0 11.0 · 0** | 5/6 | 0.28 | **0** | 4.0 / 0 | 0.05 |
| `dropLiveIn<=16` | same; pointing err −0.0 −0.0 · −0.0 +1.0 +1.0 · — | 5/6 | 0.28 | 0 | 3.9 / 0 | 0.06 |
| **`dropLiveEvt`** | **−6 +21 · +10 +48 +12 · —** | 5/6 | **0** | **0** | — | 0.02 |
| v3 `build>=0.5` | 7.9 2.2 · 0 0 0 · 0 | 2/6 | 0.57 | 0.33 | 6.5 / 7.0 | 0.06 |
| v3 `dropEvt` | −6 +4 · — — — · — | 2/6 | 0.28 | 0 | — | 0.01 |
| ceiling map `toDrop<=16` / `mapDropEvt` (B.0) | 16 16 · 0 0 0 · 15.9 / +11 +4 · −1007 −1019 −1021 · +39 | 3/6 / 6/6 | 0 | 0 | 7.0 / 0 | 0.07 |

Against the targets: armed 5/6 (target ≥ 5/6) — 2–4 bars ahead on SeeYouDrop 1 (4.0 bars) and WhoLikesToParty 3 (2.75),
2.0 / 2.0 / 1.75 bars on the other three (the 4k + 3 quantisation of WhoLikesToParty's phase, and SeeYouDrop 2's void is the
short one, 8.6 beats of `hp` in B.1); false arms 0.28 / min (target ≤ 0.3; three 0.2–1 s flickers), CyborgNinja 0 (target 0);
`dropLiveEvt` 5/6 at −6…+48 ms det (target "±1 frame-ish": three within a frame, +21 and +48 are the bass confirmation), 0
outside an armed window (by construction), 0 false. Malicious' drop: no void, not armed, no event (accepted in B.1).
- **The stream-mode A/B is a route on the running page**, not a link: `&route=` is applied under `#test` only, and `#test` hides the
  card with the capture button (no key starts a capture; headless Chrome never resolves `getDisplayMedia`, so the headless proof
  covers the route, the headed caplag run covers capture). Recipe (HARNESS "Build"): `http://127.0.0.1:8765/`, key `1` (NAV),
  Share a tab; console `CARD.routes('nav.build=buildLive,nav.dropEvt=dropLiveEvt')` = B, `CARD.clearRoutes('nav')` = A — the
  same capture, toggled live, nothing stored (the panel `p` stores its preset). Proved headless on the real page: with
  `CARD.fix={buildLive:0.7,dropLiveEvt:true,build:0.1}` NAV's view reads `build` 0.1 / `dropEvt` false unrouted, 0.7 / true
  routed, 0.1 / false after the clear; `localStorage['ew.routes.v1']` null throughout; `CARD.ERRS` []. Route kinds: level ←
  level, event ← event. What NAV does with them: `build` ≥ 0.45…0.85 parks `c` at the bulb's root (so B parks through the void
  and springs at the slam), `dropEvt` runs `navDrop` (the ray launch; its `dropStrength` stays v3's).

### B.3 addendum — the audible capture run (orchestrator, 2026-09-29)

`FIELDSX='buildLive,dropLiveIn,dropLiveEvt,hp,bassS,sub,presence' node tools/caplag.js track SeeYouDrop 0 110 27` →
`tools/work/caplag/SeeYouDrop-cap-sync27-fx.json` (6720 frames, listener time −1.0 → 111.0 s, sync 27 ms, outLat 32 ms), graded
with `dropcheck.py --rule 'buildLive>=0.4' --rule 'dropLiveEvt:evt'`:

| rule | SYD 1 | SYD 2 | false/min | armed |
|---|---|---|---|---|
| `buildLive>=0.4` | 14.0 beats ahead | 6.0 beats ahead | 0.00 | 7.3 % (chance hit 0.08) |
| `dropLiveEvt` | +61 ms | +89 ms | 0.00 | 2 events |

Live, the detector arms 14 / 6 beats (3.5 / 1.5 bars) before both SeeYouDrop drops with no false arm in 111 s; the slam event
is reactive in capture (+61 / +89 ms: the low onset's capture lag + the bass confirmation, the same order as v3's `dropEvt`
+63 ms) — the anticipation is `buildLive` / `dropLiveIn`, the event only marks the slam.

### B.4 — the SUB VOID, a second arming path (one worker, 2026-09-30; DECISIONS §64 task 2)

**The ask.** The user watched Vienna on DUST and, on the §61 open item "`dropLiveEvt` never fires on Vienna", said "fix it".
Vienna's own truth (`tools/truth/Vienna.json`, hand grid): 90.00 BPM, drops at **bar 32 = 85.3359** (the user: "first drop at
1:25 where it adds a double time") and **bar 40 = 106.6693**. `drops` in that file is now the hand list; `drops_tool` keeps
trackmap.py's own 105.639.

**Why it never armed** (`tools/build-node.js Vienna`, whole track, `&map=0`, det):

| the arming rule's own reading, over 192.6 s | Vienna | SeeYouDrop | CyborgNinja |
|---|---|---|---|
| `hp` 5 s mean: max · % of frames over `HP_ARM` 0.1 | **0.166** · 2.2 % | 0.744 · 11.7 % | 0.119 · 0.5 % |
| `bassS` 2 s / 32 s: min · % under `BASS_ARM` 0.6 | **0.514** · 1.2 % | 0.048 · 8.3 % | 0.836 · 0 % |
| void runs ≥ 0.3 s, after `MIN_HIST` | **one: 68.90–73.50 s** | seven | none |
| `buildLive` armed · `dropLiveEvt` | 69.3–76.3 s only · **0 in 192 s** | 15.9 / 7.9 beats · 2 | never · 0 |

So the detector is not broken on Vienna — **the track has no void of the kind §54 reads.** `bassS` sits at 0.51–0.83 for the
whole track (the groove rolls through), the one dip is the dream section at 1:09–1:14, and it is back over 0.85 **eleven
seconds** before the drop; `hp` is 0 from 74 s on. And the slam could not have fired either: at 85.343 s `bassS` reads
**0.97 ×** its own 2 s mean (`RET` 1.75) and `sub` **2.14 ×** (`SUB_RET` 5) — against SeeYouDrop drop 1's 2.80 × and 15.7 ×,
where the bass had been at 0.04. The clock is also in the wrong octave from 88 to 108 s (`bpm` 119.9 against the truth's 90,
§61's open item) and `barConf` reads 0.02–0.75, so synapse's bar anchor is never taken.

**What IS out before the drop: the SUB.** The ears' causal sub gate is shut from **69.7 to 85.8 s** — 16.05 s, **6.02 bars** —
and the drop is the sub note coming back (`sub` 0.356 → 0.991 on one frame, with two low onsets at 85.343 / 85.354, +7 ms
from the truth). Over all five tracks, the sub-gate-shut runs (2 s box mean < 0.2, after `MIN_HIST`, in bars of each track's
own tempo):

| track | runs ≥ 1 bar | the longest | ends on a truth drop |
|---|---|---|---|
| **Vienna** | 1 | **6.02 bars** (69.7–85.8) | yes, 85.34 |
| SeeYouDrop | 2 | 3.85 (51.9–58.1) · 1.03 | both — but the void path already arms them 15.9 / 7.9 beats ahead |
| WhoLikesToParty | 0 | — | — |
| Malicious | 12 | **3.37** (0.70–3.37 bars; 200.8–206.6) | no |
| CyborgNinja | 0 | — | — |

**A four-bar hold is the separation**: Vienna's 6.02 clears the longest run on any other track (3.85) by 57 %, so the path
cannot arm anywhere else in the set. The slam needs its own confirmation — the void path's `RET` / `SUB_RET` key on a bass
that left, and Vienna's never did — so on a sub-void arm the bass-return test is `sub` ≥ **`SUBV_RET` 2** × its 2 s mean, and
`SLAM_AFTER` does not apply (the void has already run four bars before the arm, so the first bass return is not a pickup).
The bass/hp void lifting now disarms a bass/hp arm only.

**The gate must be the causal one.** In file mode with the map ready, `MS.subGate` is the MAP's (`features-ears.js`
`mapOverride`), and this stage runs the same inputs in every mode — which is why §54 took the ears' low lane rather than the
map's onsets. `features-build.js` therefore passes `EARS.ears.out.subGate` to `feed()` explicitly; node and `build-replay.js`
read it from the trace, where it is already causal. §54's own objection to `subGate` ("a detector on them would run two
different inputs in file and stream mode") is answered, not overruled.

**Knobs** (`engine/build/build.js`): `SUBV_OFF` 0.2 (the gate's 2 s mean below which the sub is out; 0 = the path off),
`SUBV_HOLD` 4 bars, `SUBV_RET` 2.

**Node, `&map=0`, det, five tracks** (`tools/build-replay.js tools/work/v64/b/node-*.json`; drops SeeYouDrop 1 2 ·
WhoLikesToParty 1 2 3 · Malicious · **Vienna 1 2**):

| rule | before | after |
|---|---|---|
| `buildLive>=0.4`, anticipation beats | 15.9 7.9 · 11.0 7.0 11.0 · 0 · **0 0** | 15.9 7.9 · 11.0 7.0 11.0 · 0 · **4.4 0** |
| `dropLiveIn<=16` | the same runs | the same runs |
| `dropLiveEvt`, lag | −6 +21 · +10 +48 +12 · — · **— —** | −6 +21 · +10 +48 +12 · — · **−3 —** |
| armed at drop · events | 5/8 · 5 | **6/8 · 6** |
| false arms / min, drop tracks · CyborgNinja | 0.14 · **0** | 0.14 · **0** |
| false events anywhere | 0 | **0** |

The replayed traces for SeeYouDrop, WhoLikesToParty, Malicious and CyborgNinja are **md5-identical with the path on and off**
(`d61565e3` / `498acde0` / `cb8e2724` / `54759f6d`): only Vienna moves.

**Page `&map=0&lead=0`, Vienna whole track** (`tools/filetrace.js Vienna 0 192 … '&map=0&lead=0'`, `dropcheck.py`):

| rule | Vienna 1 (85.3359) | Vienna 2 (106.6693) | false/min | armed |
|---|---|---|---|---|
| `buildLive>=0.4` | **4.9 beats ahead** | 0 | **0.00** | 3.2 % (chance hit 0.03) |
| `dropLiveIn<=16` | 4.9, pointing **+3.0 beats** | 0 | 0.00 | 3.1 % |
| `dropLiveEvt` | **+14 ms** | — | **0.00** | 1 event |

`buildLive` runs 71.42–76.23 (the dream, max 0.66) and **82.10–85.35 (max 1.00)**, so a scene's contraction gets the last
1.2 bars and its release lands on the drop. The `dropLiveIn` pointing error is the bar phase, not the path: synapse's
`barConf` never reaches the 0.9 anchor gate on Vienna (§61 measured its bar line 2 beats off), so the detector is on v3's
own arbitrary count mod 4 — the EVENT is right because the slam keys on BEAT lines.

**Page = node** (`build-node.js --cmp`, 11520 frames): **`subGate` identical on 11520/11520 frames, max |diff| 0.00** — the
causal gate is the same quantity in both, which is what the implementation rests on; `bassS` / `sub` to ≤ 5.8e-5; `hp`
99.8 %; `dropLiveEvt` 11519/11520 (the one frame is the event, node −3 ms / page +14 ms, one frame apart); `buildLive`
94.7 % and `dropLiveIn` 95.8 %, the difference being the arm's bar line (node 82.38, page 82.10).

**The causal gate, proved:** the same Vienna page run with `&map=1` (the file map on, so `MS.subGate` IS the map's)
against `&map=0`. `MS.subGate` differs on **1748 of 11520 frames** (a boolean flip, max |diff| 1) — and `buildLive`,
`dropLiveIn` and `dropLiveEvt` are **identical on all 11520 frames**, with `dropLiveEvt` at 85.35 s and the arm at
82.10 s in both. The stage reads `EARS.ears.out.subGate`, so the map cannot reach it.

**A node-only grading of anything clock-dependent on Vienna is not the page's answer.** The node harness's v3 clock is in
the wrong octave for part of this track (`bpm` p50 **143.1 / 119.9 / 120.0** over 0–20, 80–100, 140–160 s) while the page
reads **90.1 for the whole track**. Vienna's octave margin is the thinnest in the set (§61: its 40–150 Hz on-beat /
half-beat ratio is 1.031), so the small input differences between `tools/node-stream.js`'s det stream and the page's file
source flip it. The page is the one that is right, and it is the page the user watches.

**Knob sensitivity** (`build-replay.js --set`, one step either side; "=" = the row above):

| knob | step | Vienna 1 anticipation / event | elsewhere |
|---|---|---|---|
| `SUBV_OFF` 0.2 | 0.1 | = | = |
| | 0.5 | 8.3 beats / = | **Malicious arms 3.9 beats before its drop, false arms 0.14 → 0.36** |
| `SUBV_HOLD` 4 | 3 | 8.3 beats / = | **false arms 0.14 → 0.22** (Malicious' 3.23 and 3.37-bar runs) |
| | 5 | 0.0 beats / +14 ms (the arm lands inside the last beat) | = |
| `SUBV_RET` 2 | 1.5 | = | = |
| | 3 | **the event is lost** (Vienna's ratio is 2.14) | = |

So 4 bars is the only hold that buys the drop and changes nothing else; `SUBV_RET` 2 sits between 1.5 (no change) and 3 (the
drop lost) — **one drop tunes that threshold, it does not prove it.**

**Vienna's SECOND drop (106.6693) is not detectable causally, and nothing was shipped for it.** `tools/truth/buildstudy.py`
over all five tracks: of 60 candidates × 7 grains × 4 transforms, at PRE 4 bars and PRE 8 bars, **every one gives it a lead
of 0 beats.** In the 20 s before it, `hp`'s 5 s mean is **0.000**, `bassS` 2 s / 32 s bottoms at **0.887**, `subGate` is 1.00
throughout, and at the drop `bassS` reaches 1.25 × its 2 s mean and `sub` 1.32 × — there is no void, no bass return and no sub
return. The brief's second lean (a tension accumulator: energy slope, centroid rise, onset density) was measured in the same
study: the candidates that would arm it at all (`presence` dev 5 s, `novelty`, `flux` dev, `eFast`, `eShort`) all carry
CyborgNinja false arms of 0.35–6.71 / min. Vienna's bar 40 is a **density / texture jump** — the double-time layer thickening
— with no causal precursor, and reading it would mean firing on CyborgNinja.

#### B.4's tests

`tools/test_build.js` gains six cases for the sub-void path: a sub void shorter than `SUBV_HOLD` does not arm; one longer arms
on a bar line **with the bass still in** (which the §54 path cannot see); the void's own bass-less on-beat kicks never fire;
the sub coming back at 2.5 × its 2 s mean fires once on the onset's frame with `bassS` flat (so `RET` cannot fire) and under
`SUB_RET`; `SUBV_OFF` 0 makes the same stream inert; an input with no `subGate` at all reads as "the sub is there" (so every
caller written before §64 behaves exactly as it did); and `SLAM_AFTER` raised to 4 bars does not gate the sub-void slam.

## Step 5 — the predicted-event queue (`engine/queue/`, `features-queue.js`; one worker, 2026-09-29)

Step 3 releases predicted hits, step 4 counts to a drop, the lead moves the clocks — three places a scene must read to know
what comes next, and none of them a count-down in seconds. Step 5 puts ONE ordered list of the expected events on heard time
net of the display lead (`ENGINE.QUEUE.list` / `CARD.QUEUE`: `{ cls, t, conf }`), and hands MS the numbers a scene wants:
`nextBeatIn` / `nextBarIn` / `nextKickIn` / `nextSnareIn` / `nextHatIn` / `nextDropIn` (s, −1 = none), `next<Cls>Conf`,
`next<Cls>Up` (a wind-up 0 → 1 over the last 0.25 s), `queueN`. Measure first (Q.0), build (Q.1), numbers (Q.2), proofs + the
A/B (Q.3). The lesson it serves (the 2026-09-28 A/B: reactive beats predicted for "in sync"): a queue is for ANTICIPATION — a
motion that winds up and PEAKS at the hit — not a second copy of the hit.

### Q.0 — the ruler (`tools/truth/queuecheck.py`) and the baseline

A count-down field is graded by its ROLL-OVERS: the last frame of an entry (v < 1.5 frames, then a larger v or none) predicts
the event at t + v. Per class: P / R / F within ±30 ms of the truth onsets (kick `click`, snare `mid`, hat `high`, beat `beats`,
bar `downbeats`, drop `drops`), the lag (+ = late), a CHANCE F (the same arrivals circularly shifted in time, 50×), the HORIZON
delivered (s before a matched hit the field first pointed at it, back through consecutive frames within ±40 ms of the same
time), and the JUMP RATE per live minute — frames where v moved by other than one frame's worth ± 10 ms — split into
roll-overs (legit), withdraws (v jumped up or to none before reaching 0), inserts (a nearer entry appeared) and jitter (the
clock nudged). The drop goes through `dropcheck.py`'s `grade_level` (beats ahead, pointing error, false arms / min).
`--selftest` (17 checks): a perfect count-down reads F 1, lag 0, horizon = the interval, 0 jumps; 20 ms late reads +20; one
entry pulled to none reads one withdraw; a nearer entry for 0.1 s reads one insert + one withdraw; a field always −1 reads R 0;
the beat phase → next beat reads F 1; an 8-beat drop count-down reads 8.0 beats, pointing error 0. Baselines graded from the
same trace: `predKickIn` (beats → s at `bpm`), `beatPhase` (the clock moved by `leadT`, or −`detLead` on a det / node trace with the
lead off, to its next line), `dropLiveIn` (beats → s).

**Baseline, node det `&map=0` whole tracks** (`tools/build-node.js` now runs the bars store too; `tools/accept/live-grid/queue-q2-sweep.txt`):

| field | track | F (P R; chance) | lag med / p90 | horizon (truth ioi) | jumps /min live (withdraw insert jitter) |
|---|---|---|---|---|---|
| `predKickIn` | SeeYouDrop | 0.38 (0.54 0.29; 0.04) | **−18** / 27 ms | 0.39 s (0.39) | **90** (93 7 0) |
| `predKickIn` | CyborgNinja | 0.36 (0.64 0.26; 0.13) | −3 / 21 | 0.19 (0.20) | 99 (155 19 0) |
| `predKickIn` | WhoLikesToParty | 0.55 (0.80 0.42; 0.16) | −10 / 18 | 0.25 (0.25) | 34 (93 20 0) |
| `beatPhase` → next beat | SeeYouDrop | 0.88 (0.88 0.87; 0.14) | −2 / 19 | 0.39 (0.40) | 0.8 (0 1 1) |
| `beatPhase` → next beat | CyborgNinja | **0.00** | — | — (0.38) | 0.3 |
| `beatPhase` → next beat | WhoLikesToParty · Malicious | 0.93 · 0.69 | +2 · +17 | 0.50 · 0.42 | 0.9 · 0.5 |
| `dropLiveIn` | SYD 1 2 · WLTP 1 2 3 · Mal | 15.9 7.9 · 11 7 11 · 0 beats (§54's node row) | | | |

What it says: `predKickIn` is not a count-down a scene can use — it jumps ~90 times a minute (93 withdrawals against 122
roll-overs on SeeYouDrop; the store's confidence gate flickers under 0.35 between 16ths and the field goes to −1), and it
points −18 ms early (it is the step line without the kick's +25 ms micro-timing offset the release itself carries). The moved
beat clock IS a count-down (F 0.88 / 0.93, 0.8 jumps / min) except on CyborgNinja, whose v3 clock sits 80–180 ms off its
kick-anchored truth (§50 addendum: F 0). The drop's count-down is §54's.

### Q.1 — the stage (`engine/queue/queue.js` + `feed.js`, `features-queue.js` after 'build'; `Bars.upcoming`)

The queue predicts nothing: every frame it rebuilds the list from what the other stages decided — the lead-moved v3 clock's
next beat lines (at least 4), the bar lines of the build detector's phase (v3's count, or synapse's sure anchor held 8 beats:
the bars store's rule, no third line), the store's own steps still to come (`Bars.upcoming`: the decided ones waiting for their
class offset + the bits `release()` reads for this bar and the next, at `predConf`; nothing under `CONF_MIN`) and, while armed,
the drop on `dropLiveIn`'s line at `buildLive`. The time base is the store's release position (`rel` = the heard v3 beat +
`dispNow()`), so `nextKickIn` reaches 0 on the frame `predKickEvt` fires. An entry whose time passes is dropped; a step the
store's re-vote clears is gone — unless it was already inside **HOLD** (below); a seek, silence, a tempo jump flush.
`tools/test_queue.js` (38 checks, in `npm test`): order, the count-down decreases by dt and rolls over, the beat / bar lines,
a withdrawn step gone (HOLD 0) / kept inside HOLD, the flushes, the drop entry follows the detector (its line, `buildLive` as
conf, gone on disarm), the wind-up levels, `Bars.upcoming` lists every released prediction ahead of its release (112 of 112 on a
taught loop, median 5.4 beats ahead; nothing under `CONF_MIN`), the feed.

**HOLD — the one deviation from "withdrawn is withdrawn", measured first.** Rebuilt from the store alone, `nextKickIn` jumped
96 times a live minute on SeeYouDrop: 97 withdrawals against 148 roll-overs, 87 of them TO NONE (the confidence gate, not a
bit flipping), and 56 / 76 / 67 % of the withdrawn kick / snare / hat entries pointed at a real onset. A hit entry already
inside HOLD s stays for its time when the store withdraws it. Sweep (node, `QUEUEK`, `queue-q2-sweep.txt`):

| HOLD | SeeYouDrop kick F (P R) · jumps/min | snare · jumps | hat · jumps | CyborgNinja kick F (P R) · jumps | WLTP kick F (P R) · jumps |
|---|---|---|---|---|---|
| 0 | 0.46 (0.59 0.38) · 96 | 0.53 (0.77 0.41) · 88 | 0.48 (0.71 0.36) · 73 | 0.37 (0.66 0.26) · 106 | 0.56 (0.82 0.43) · 42 |
| 0.1 | 0.47 (0.59 0.39) · 92 | 0.55 (0.75 0.43) · 75 | 0.51 (0.70 0.40) · 54 | 0.38 (0.63 0.27) · 87 | 0.57 (0.81 0.44) · 34 |
| **0.25** | **0.48 (0.58 0.41) · 39** | **0.59 (0.73 0.50) · 25** | **0.54 (0.70 0.45) · 20** | **0.39 (0.59 0.29) · 54** | **0.60 (0.80 0.48) · 19** |
| 0.5 | 0.50 (0.58 0.44) · 20 | 0.59 (0.70 0.52) · 8 | 0.55 (0.68 0.47) · 7 | 0.39 (**0.52** 0.32) · 22 | 0.61 (0.79 0.50) · 9 |
| HORIZON 4 (HOLD 0) | = HOLD 0 on every `next*In` (only `queueN` moves) | | | | |

0.25 s = the wind-up's own length is the knee: the jump rate falls 2.4–3.7× (SeeYouDrop kick 96 → 39, hat 73 → 20), F rises
0.02–0.06 through recall, precision holds (−0.01 … −0.07); 0.5 buys smoothness with precision (CyborgNinja kick P 0.66 → 0.52).
The cost of HOLD: a held entry the store then decides against still rolls over (a `nextKickIn` arrival `predKickEvt` does not
fire) — inside 250 ms. HORIZON bounds the list, not the reach: the hit fields see this bar and the next (the store's), the
drop's `dropLiveIn`'s (≤ 4 beats).

**Page = node** (SeeYouDrop `&map=0&lead=0`, HOLD 0 both): `nextBeatIn` is a pure function of the page's own clock — `(ceil(B) − B) /
bps`, B = beatCount + beatPhase − detLead·bps — to 1e-14 on 9442 of 9444 frames (the 2 others: presence < 0.2, none);
`nextDropIn` = `dropLiveIn` / bps on every armed frame outside the detector's ⅛-beat hold after a line (median 0.0000 s);
listed on 0 unarmed frames, none on 0 armed frames. The hits follow the store: within 20 ms on 97.1 / 97.1 / 96.6 % of frames
(kick / snare / hat), the rest the confidence gate at its threshold (213–219 frames "none" on one side, 2 %; `predKickEvt` itself
differs page vs node on 33 frames); `nextKickConf` within 0.05 on 96.6 %, `nextKickUp` within 0.1 on 98.8 %, `queueN`
within 2 on 96.9 %. (The v3 clock itself differs page vs node by 0.048 beat at p90 — 19 ms — so the beat / bar count-downs
agree to 20 ms on 89 %, to 1e-3 on 12 %; the pure-function check above is the proof that holds.)

### Q.2 — the numbers (page `&map=0&lead=0` det, whole tracks, HOLD 0.25; `tools/accept/live-grid/queue-q2-page-map0.md`)

| track | class | F (P R; chance) ±30 ms | lag med / |p90| | horizon med (truth ioi) | jumps /min (withdraw insert jitter) | baseline: F · lag · jumps |
|---|---|---|---|---|---|---|
| SeeYouDrop | kick | **0.50** (0.59 0.43; 0.05) | **+1** / 15 ms | 0.39 s (0.39) | **39** (44 5 0) | `predKickIn` 0.33 · −20 · 95; HOLD 0 0.45 · +1 · 102 |
| | snare | 0.60 (0.73 0.51; 0.09) | −2 / 14 | 0.31 (0.27) | 25 (19 14 0) | HOLD 0 0.53 · −2 · 96 |
| | hat | 0.56 (0.70 0.46; 0.15) | −0 / 11 | 0.20 (0.22) | 22 (18 11 0) | HOLD 0 0.49 · −0 · 79 |
| | beat | 0.87 (0.87 0.86; 0.13) | −4 / 21 | 0.39 (0.40) | 0.4 | `beatPhase` 0.87 · −4 · 0.4 |
| | bar | 0.87 (0.88 0.87; 0.08) | −5 / 21 | 1.59 (1.60) | 0.4 | — |
| | drop | 15.9 / 8.0 beats ahead, pointing err 0.0 / 0.0, 0.38 false / min, armed 6.6 % | | | | `dropLiveIn` the same |
| SeeYouDrop groove 25.6–44.8 | kick · snare · hat | 0.67 (0.76 0.59) · 0.57 (0.62 0.53) · 0.49 (0.51 0.48) | +5 · −0 · +2 | 0.39 · 0.21 · 0.20 | | predcheck §50: 0.67 · 0.64 · 0.55 |
| CyborgNinja | kick | 0.39 (0.56 0.30; 0.16) | +5 / 25 | 0.20 (0.20) | 49 (57 35 7) | `predKickIn` 0.36 · −5 · 101 |
| | snare | 0.43 (0.63 0.32; 0.23) | +1 / 24 | 0.18 (0.19) | 23 (26 22 1) | |
| | hat | 0.57 (0.70 0.48; 0.37) | +0 / 25 | 0.10 (0.10) | 15 (3 19 10) | |
| | beat · bar | **0.01 · 0.00** (the v3 clock 80–180 ms off its kick-anchored truth, §50 addendum) | | | 0.3 | `beatPhase` 0.01 |
| | drop | no drops; 0 false arms, armed 0 % | | | | |
| WhoLikesToParty | kick | 0.54 (0.78 0.41; 0.18) | +6 / 17 | 0.25 (0.25) | 39 (86 33 0) | `predKickIn` 0.48 · −10 · 67 |
| | snare | 0.49 (0.64 0.39; 0.23) | +2 / 20 | 0.13 (0.16) | 24 (49 26 1) | |
| | hat | 0.66 (0.80 0.56; 0.23) | +2 / 15 | 0.24 (0.25) | 10 (23 7 1) | |
| | beat | 0.93 (0.93 0.93; 0.10) | +2 / 10 | 0.50 (0.51) | 0.0 | `beatPhase` 0.93 |
| | bar | **0.30** (the unverified downbeat, §54: its drops sit at v3's bar phase 3) | +3 / 11 | 2.04 (2.05) | 0.2 | |
| | drop | 8.0 / 7.0 / 11.0 beats ahead (err +4.0 +1.0 +1.0), 0 false, armed 5.2 % | | | | `dropLiveIn` 8 7 11 (err 0 +1 +1) |
| Malicious | kick · snare · hat | 0.00 · 0.01 · 0.03 (3 / 9 / 7 roll-overs in 223 s: the store releases nothing — "never invent", §50) | | | | |
| | beat · bar | 0.66 (0.66; 0.15) · 0.00 | +16 / 25 | 0.42 (0.43) | 0.3 | `beatPhase` 0.66 · +16 |
| | drop | 0 beats (no void, as accepted §54), 0.54 false / min (the end fade), armed 0.5 % | | | | |

What it says:
1. **The count-downs to the hits land where the store's events land.** Kick lag +1 / +5 / +6 ms (SeeYouDrop / CyborgNinja /
   WhoLikesToParty), snare −2 / +1 / +2, hat 0 / 0 / +2 — the class offsets are in the count-down (`predKickIn` without them
   reads −20 / −5 / −10); F 0.39–0.66 against a chance 0.05–0.37, the groove window reproduces predcheck's step-3 row (kick
   0.67 = 0.67). Recall is the store's (0.30–0.56): a "next" field can only count to what will be released.
2. **A "next" field's horizon is the class's inter-onset interval, and no more.** SeeYouDrop's kicks are on every beat, so
   `nextKickIn` first points at a kick 0.39 s before it (median; p25 0.33 with HOLD, 0.12 without) — the hit before hides the
   one after. A wind-up longer than a beat needs the list (`CARD.QUEUE`), not the field.
3. **Smooth enough to drive a motion, with HOLD.** The beat / bar count-downs jump ≤ 0.4 times a minute (the moved clock is
   steady); the hits 10–49 times a minute (CyborgNinja's kick the worst: 35 inserts — a nearer step appearing as the vote
   firms up — plus 57 withdrawals), against 67–102 for `predKickIn` / HOLD 0. What remains is the store's own vote moving
   between 16ths, not the queue's.
4. **The drop count-down is §54's**, in seconds: 15.9 / 8.0 · 8.0 7.0 11.0 · 0 beats ahead, the same false arms (0.38 / 0 /
   0.54 per min on SeeYouDrop / WhoLikesToParty / Malicious — the SeeYouDrop bar with the bass out 14 s after drop 2, Malicious'
   end fade), the same +1.0-beat pointing on WhoLikesToParty (its bar phase); WhoLikesToParty 1's "+4.0" and the node
   SeeYouDrop 2 "+3.9" are the ruler reading the frame before the truth after the queue's line has passed and rolled to the
   next bar (the detector holds 0 for ⅛ beat there, the queue does not).
5. **The bar line's truth is open where it was open:** WhoLikesToParty's downbeat (F 0.30 — the page's phase, 0.00 in node),
   CyborgNinja's clock (beat F 0.01). The queue inherits them; it adds no error of its own (SeeYouDrop bar F 0.87 = beat F).

### Q.3 — the proofs and the A/B

- `node tools/check.js` 0 fail (193 MS keys, help.feats gaps 0) · `npm test` OK with `tools/test_queue.js` · `node tools/bundle.js`
  → 1267 KB, 145 modules; from `file://` 347 frames in 6 s, `ERRS` [], `nonFinite` [], the 12 `next*` keys on MS, `CARD.QUEUE`
  empty on the fake timeline (by design: no source).
- **Additive:** SeeYouDrop whole-track det traces from a `git archive e23db09` tree on its own port against this tree — the 32-field
  caplag set (default hash) md5 `87f5c70d`, its `&lead=0` twin `5128572a` (both §54's values), a 72-field set `6eecc7f9`: all three
  `cmp`-identical, event log included. No existing value moved.
- `GPU=1 node tools/parity.js fake`: the 72 MS fields identical to 1e-9 on both trees; the `nav.*` rows mismatch **identically on
  the e23db09 tree** (nav.c 2.09, nav.lg 7.85, …) — pre-existing since 22eb969 (NAV reads `buildLive` / `dropLiveEvt` by default and
  the fake timeline has no live drops, so NAV no longer parks or exits where cardioid3's does; the s0 f840 md5 move recorded in
  §54 addendum 2). The tool's verdict line is red for that reason, not this step's; noted in OPEN-ITEMS.
- **The A/B is a PARAM route on TORUS2** (CONTRACTS §1.16; TORUS2 is the user's favourite mapping): `torus2.wave` (the kick bump's
  depth, range [0, 0.4], default `WAVE0 + 0.1·kick2` = 0.26–0.36) fed by `nextKickUp` with `k 0.35 b 0.65` → u = clamp01(0.35·Up +
  0.65): 0.26 with no prediction (the default look), rising to 0.40 over the 250 ms before each predicted kick, back to 0.26 as
  the entry passes. Why a level and not the count-down: a wind-up on `nextKickIn` needs k < 0 and its −1 "none" then clamps to the
  TOP (clamp01(−4·−1 + 1) = 1: the wave deepest exactly when nothing is predicted). Proved headless on the real page (demo source,
  key `4`, `CARD.fix`): unrouted `paramsOf('torus2').wave` = the derived 0.264 (kick2 0.04); `CARD.params('torus2.wave=nextKickUp*0.35+0.65')`
  with Up 0.5 → **0.33** (= 0.4·0.825), Up 0 → **0.26**, Up 1 → **0.40**; `CARD.clearParams('torus2')` → the derived 0.270 again;
  `paramsString()` '' after, `localStorage['ew.routes.v1']` null throughout, `CARD.ERRS` 0; the queue on the demo lists beat / bar
  entries (0.149 / 0.627 s ahead). Not run here: the audible capture run (the orchestrator's; `FIELDSX` recipe in HARNESS "Queue").

### Step 5 addendum — the audible capture run (orchestrator, 2026-09-29)

`FIELDSX='nextBeatIn,nextKickIn,nextSnareIn,nextHatIn,nextDropIn,nextKickConf,nextKickUp,predKickIn,buildLive,dropLiveIn,queueN'
node tools/caplag.js track SeeYouDrop 0 110 27` → `tools/work/caplag/SeeYouDrop-cap-sync27-fx.json` (6715 frames), `queuecheck.py`
(fixed on the way: a trace without `beatCount` — caplag's FIELDS — has no phase baseline row instead of a crash):

| field | F (P R; chance) ±30 ms | lag med / p90 | horizon med (p25; ioi) | jumps /min (withdraw insert jitter) | live |
|---|---|---|---|---|---|
| `nextKickIn` | 0.38 (0.60 0.28; 0.05) | +3 / 18 ms | 0.39 s (0.33; 0.39) | 309 (37 8 173) | 38 % |
| `nextSnareIn` | 0.45 (0.72 0.33; 0.09) | +0 / 19 | 0.30 (0.17; 0.27) | 335 (12 6 253) | 43 % |
| `nextHatIn` | 0.38 (0.69 0.26; 0.09) | +2 / 14 | 0.30 (0.19; 0.22) | 344 (10 7 262) | 44 % |
| `nextBeatIn` | 0.68 (0.83 0.58; 0.16) | −8 / 23 | 0.39 (0.39; 0.40) | 1.6 (1 0 2) | 100 % |
| `nextDropIn` | 14.0 / 8.0 beats ahead (err +2.0 / 0.0), 0 false/min, armed 8 % | | | | |
| base `predKickIn` | 0.25 (0.47 0.17; 0.04) | −20 / 28 | 0.38 (0.10; 0.39) | 130 (74 7 0) | 33 % |

Live, the hits' zero crossings land +0…+3 ms (the base `predKickIn` −20), the beat line −8 ms, both drops queued 14 / 8 beats
ahead with no false entry. The hit count-downs' "jitter" (173–262 / min, |dv + dt| > 10 ms) is the real-time frame: the beat's
own count-down (2 jitter frames in 110 s) shows the clock is smooth, so the hits' jitter is the store's per-class offsets
moving under it in real time — sub-frame, an open item to measure by eye rather than tighten.

## Step 6 — the beat clock on the PCM bus (`engine/clock/`, `features-clock.js`; one worker, 2026-09-30)

The user (2026-09-30): "on the PCM bus seems more accurate and would be wanted regardless … still need to work on the predictions
→ continue onto step 6". The plan's last step (§49): tempo + phase from the raw samples on the audio's own clock instead of once
per video frame, and a proper filter so one odd onset cannot yank the beat line. Measure first (T.0), then the input (T.1), then
the clock (T.2), then the numbers with the bar store / build / queue riding it (T.3), then the proofs and the A/B (T.4).

### T.0 — the clock we have, precisely

Page traces `&map=0&lead=0` det, whole tracks (`tools/work/clock/t0-<Track>.json`, 38 fields: the clocks, the hits, the pred* /
next* / build fields), graded by `gridcheck.py --heard` (new: a det trace with the lead off carries the RAW clocks, 42.7 ms before
heard time; `--heard` moves v3's and the PCM clock's beat position by −detLead at their own tempo — the lead's rule under `&disp=0` —
so every lag below is the clock's OWN error on heard time, 0 = the truth beat; `tools/accept/live-grid/clock/t0-<Track>.md`).
"Lock" = the first second from which 4 s have ≥ 90 % of frames within ±30 ms; "jitter" = |lag − its median|.

| v3 clock (T.0) | tempo ±1 BPM | lag med (|lag| p50 / p90) | jitter p50 / p90 | `beat` F ±50 ms (lag med / p90) | lock from cold |
|---|---|---|---|---|---|
| SeeYouDrop | 95.5 % | −4 ms (8 / 30) | 8 / 32 ms | 0.91 (+3 / 22) | 10.5 s |
| CyborgNinja | 99.2 % | **−87 ms (111 / 183)** | **43 / 244 ms** | **0.05** (−45 / 45) | never |
| WhoLikesToParty | 99.2 % | +3 ms (4 / 13) | 4 / 11 ms | 0.945 (+11 / 20) | 8.0 s |
| Malicious | 78.8 % | +22 ms (22 / 88) | 10 / 67 ms | 0.75 (+27 / 41) | 6.1 s |

SeeYouDrop by section (the same trace): intro 0–25.6 s lag −9, jitter p90 76 (tempo right 72 %); groove 25.6–57.6 −16 / p90 30;
after drop 1 (57.6–70) −12 / 12; groove-return 89.6–105.6 −5 / 23; after drop 2 (105.6–120) +1 / 8; outro 130–157 the p90 climbs
to 38. v3 does not LOSE lock at either drop — it wobbles: the 5 s bins 45–55 s (climb / void / slides) read p90 62 / 46 against
4–9 around them. The synapse clock beside it (bpmSyn / beatSyn): SeeYouDrop 61.6 % / lag −43 (p50 45), CyborgNinja +64 (68 / 126),
WhoLikesToParty −41 (45 / 207), Malicious 34.3 % — not a candidate.

**CyborgNinja's "half-beat offset" is a tearing, not an offset.** Its kicks sit on EVERY 8th (the ears' 460 kicks against the
truth grid: 162 in the beat's first eighth, 158 in its fifth — two lattices half a beat apart, near-equal), and the truth's
own downbeat rests on a 9 % low-band margin (`tools/truth/CyborgNinja.json` anchor). v3's PLL is pulled by the comb target
toward one lattice and by its `bassFast` onset corrections toward whichever kick came last: median −87 ms with a jitter p50 of 43
ms and p90 244 — torn between the two, on neither. (The truth's beats were re-anchored onto its kicks in step 3.1, so "kick-
anchored" here means one of the two kick lattices.)

**The input, as timed today.** `features.js` computes ONE spectral-flux value per video frame from an AnalyserNode read at rAF
time (the newest 2048 samples the analyser holds when the frame runs; `o = (flux + 3·bflux)/100`), and writes it into the 100 Hz
ring `XS.env` by zero-order hold: `envAcc += (now − envNow)·100` from the raw frame clock, so a 16.7 ms frame fills 1–2 slots, a
33 ms frame fills 3 with the same value — an onset's position in the ring is the FRAME's time, quantised to the frame interval
(± half a frame, 8 ms at 60 Hz, 17 at a dropped frame) plus wherever the analyser's window happened to sit. In capture the
analyser's own time advances in 512-sample blocks (a trace's heardT steps 10.7 / 21.3 ms per frame: 55 % of frames see two
blocks), so the flux of one frame is the rise over 1 or 2 blocks. The onset EVENTS v3 fires against the truth kicks (the
frame's analysis time, det): **+17 ms median, p90 33 ms** on SeeYouDrop, +32 / 40 on CyborgNinja, +32 / 42 on WhoLikesToParty,
+23 / 36 on Malicious — late by half a frame plus the window, and the `phaseCorr` PLL then bleeds each correction over τ 0.18 s.
The comb target itself carries a hand-tuned `+0.03` beat (12 ms early at 150 BPM) that hides part of that lag in the phase rows.

### T.1 — the PCM onset stream (`engine/clock/clock.js` `push()` + the ears' onsets; `tools/clock-study.js`)

Three candidate inputs, each measured in node on the page's det time base (`tools/node-stream.js`: the same blocks the page
pushes, `tools/clock-study.js` writes a compare.py trace + every onset into its `log`), against the truth kicks (`onsets.click`,
±50 ms match, the whole track after 10 s):

| onset stream (sample-timed) | SeeYouDrop err med / p90 (sd) | CyborgNinja | WhoLikesToParty | Malicious |
|---|---|---|---|---|
| v3's frame onsets, for reference (the frame's analysis time) | +17.0 / 32.5 (8.8) | +32.5 / 40 (6.9) | +32.0 / 42 (12.8) | +22.7 / 36 (11.7) |
| the ears' 7-band dB flux (perc.js), picked at mean + 1.5 sd | — rejected before timing: not periodic (below) | | | |
| v3's spectral flux per 512 hop, picked at mean + 1.5 sd, hop centre − 6 ms | −0.5 / 16.7 (10.0) | +14.7 / 22.8 (6.1) | +14.0 / 22.7 (7.5) | +4.2 / 18.0 (10.8) |
| … timed by the rise's split between hops k / k+1 | +3.2 / 20.4 (9.5) | +18.3 / 25.0 (5.2) | +18.8 / 26.7 (6.8) | +9.1 / 22.1 (10.0) |
| **the ears' kicks** (perc.js, ONSET_LAG 6 ms) | **+3.0 / 10.8 (7.6)** | **+7.7 / 14.3 (6.2)** | **+6.0 / 14.3 (8.4)** | **+2.5 / 35 (19)** |
| the ears' snares / hats | −0.7 / −1.3 (10 / 10) | +2.7 / +0.7 (8 / 5) | +0.7 / +1.7 (10 / 8) | −1.0 / −1.7 (17 / 8) |

- **The ears' band flux is a detector's, not a periodicity function.** Its autocorrelation at the beat lag reads 0.11 in
  SeeYouDrop's intro (8–26 s) and 0.44 in its groove (30–50 s) where v3's full-spectrum log flux reads 0.59 / 0.79 (the same
  audio, both resampled to 100 Hz): the HPSS-residual dB rise, gated at −34 dB under each band's own level, is nearly binary
  per hop. Fed to tempo.js's comb it locked SeeYouDrop's intro to 121 BPM for 20 s (v3: 150 within 5 s).
- **The comb's input is therefore v3's own onset function, per hop:** a 2048-point FFT (the ears' FFT class) on the PCM
  bus's newest 2048 samples every 512, the positive log-magnitude flux over bins 1..419 plus 3× the bass bins' (< 150 Hz),
  timed by the sample count. Synapse's Analyzer has this FFT already but on its own tap without sample stamps (a relative
  `t`), so the clock runs its own: 0.045 ms per hop in node = **0.07 ms per 60 Hz frame** at 48 kHz. The comb on it reads the
  same tempo as v3's (95 / 98 / 99 / 79 % of frames within ±1 BPM on the four tracks; v3 95.5 / 99.2 / 99.2 / 78.8).
- **The ticks are the ears' onsets, not onsets picked from that flux.** A kick's full-spectrum flux peaks a hop after its
  click on two of the four tracks (+15 / +14 ms, and the rise-split timing makes it worse: +18 / +19), where the ears' per-band
  detectors with the beater-click rule place the kicks +3 / +8 / +6 / +2.5 ms (sd 6–8) and snares / hats within ±3 — sample-
  timed, already computed, already validated (v0.15). So `push()` feeds the comb and `onset(t, cls, vel)` takes the ears'
  pending events (features-clock.js reads `EARS.ears.pending` after the ears' own PCM listener ran; in node the same loop).
  KICK_LAG 4 ms = the median of the four kick placements; snares / hats none.

### T.2 — the clock (`engine/clock/period.js` + `clock.js`; `tools/test_clock.js`)

- **`Period`** is tempo.js's steps 1–6 copied to the letter (the high-pass / loudness-normalised / recency-tapered 8 s ring, the
  ACF over lags 8..410, the harmonic comb under the 130-centred prior on the 0.25-lag grid, the vertex refinement, the contrast
  / y1 gates, the 6 % track, the 25 % margin, the metrical-relative votes, the 2.5 s 3:2 arbitration) with its state in the
  object instead of MS / XS — v3's estimator is untouched (its trace stays byte-identical, T.4). Its ring is written by AUDIO
  time (`ring(t, o)`: the 100 Hz slot of the hop's end, zero-order hold over a skipped slot — the 512 hop is 10.7 ms, so one
  slot in 15 is held), never by a frame clock. `line(bps)` is v3's comb-aligned PLL target (8 beats of the comb on the
  envelope's peaks) with a parabolic vertex over the offset and WITHOUT the `+0.03` beat fudge, returned as an audio time.
- **`Clock`** is a 2-state Kalman filter, x = [beat position b, rate f] at audio time `t`: predict `b += f·dt`, P grows by the
  constant-rate model's noise (Q_B 0.01² beats²/s, Q_F 0.003² (beats/s)²/s); every ears onset is a phase measurement "a line is
  at t" (z = round(b), R = R_ON·R_CLS[cls] / vel, R_ON 0.03², R_CLS kick 1 / snare 1.5 / hat 3) applied as a probabilistic-
  data-association step: the gain is scaled by beta = N(y; 0, S) / (N + CLUTTER), the posterior weight of "on the grid" against
  "one of CLUTTER off-grid hits per beat" — at y = 0 beta ≈ 0.9, three sigma out 0.6, four sigma out 0.06. Cold (P00 = 1) the
  first onset sets the phase outright; locked (σ ≈ 0.02 beat) a stray 16th moves the line by nothing (test: a vel-1.5 hit half a
  beat off moves the next beat 0.4 ms). Every 0.5 s of audio the comb's tempo is a rate measurement (R_F 0.01² / y1) when it is
  within 6 % of f, a re-seat of f (P11 reset) when the votes switched; the comb's LINE is one more phase measurement (R_LINE
  0.08² / y1) — and, first, the **lattice vote**: 7 of the last 8 clear lines more than 0.3 beat from the clock's line move it
  onto the comb's, always forward (the count never steps back). No presence gate: the clock coasts through silence on its rate
  (P grows, the next onsets pull harder).
- **Why the vote and not a pull.** On a half-beat kick pattern (CyborgNinja, WhoLikesToParty: kicks on every 8th) the onsets fit
  both lattices and the gate keeps whichever the cold start chose (WhoLikesToParty first read −249 ms = exactly half its
  beat); a continuous pull toward the comb line is what tears v3 on CyborgNinja (the line itself flips lattice on ~30 % of its
  8 s windows there). A 3-consecutive vote flipped CyborgNinja 4 times in 40 s (p90 72 ms); 7 of 8 (4 s) never flips it and
  still moves WhoLikesToParty onto the comb's lattice within its first bars (+7 ms from then on).
- **`read(t, st)`** publishes with the lead's rule: the count never steps back — a pull back across a line holds on it (phase
  0) until the clock catches up, so `beatPcm` fires exactly once per line.
- **`tools/test_clock.js`** (in `npm test`): a synthetic click train at 48 kHz (a 4 ms noise burst + a decaying 60 Hz thump
  per hit, ±4 ms jitter) through `push()` in 512 blocks with each hit handed to `onset()` — lock at 4.5 s, then |median| 2.0
  ms / p90 3.5 against the true grid, tempo 127.91; a 128 → 132 ramp over 20 s followed within 0.48 BPM (1.27 mid-ramp); 6 s
  of silence coasted within 21 ms (p90) and 16 ms at the return, no jump; the outlier above; kicks on every 8th with the
  on-beat ones louder → the loud lattice within 0.7 ms (the other reads ±234); two runs bit-identical.
- **Knobs (round, few) and their sensitivity** (`tools/clock-study.js` on the four tracks, node, heard time; "lag jitter-p50/p90
  lock" per track — SeeYouDrop · CyborgNinja · WhoLikesToParty · Malicious):

| knobs | SeeYouDrop | CyborgNinja | WhoLikesToParty | Malicious |
|---|---|---|---|---|
| default | +2 6/19 7.6 s | −184 1/2 (the other lattice, stable) | +7 2/6 10.9 | +22 6/23 6.1 |
| R_LINE ∞ (no comb line) | −1 7/21 7.6 | −185 1/19 | **−21 25/50 27.4** | **+65 21/65** |
| R_ON 0.02² / 0.05² | +0 6/28 · +2 7/16 | −184 1/3 · −179 2/6 | +7 2/6 · +4 4/10 | +20 6/21 · +27 6/23 |
| CLUTTER 3 | +1 7/24 **22.4** | −184 1/3 | +7 2/5 | +22 5/17 |
| Q_F ×10 · Q_B ×10 | +2 6/18 · +2 7/21 | −184 · −183 1/4 | +7 · +8 3/12 | +22 · +23 7/26 |
| KICK_LAG 0 · R_CLS all 1 | +2 · −1 | −183 · −184 | +9 · +8 | +23 · +18 |
| LINE_N 5 of 8 | +2 6/19 | −184 **1/186** (flips) | +7 | +21 6/34 |
| EVERY 1 s | −0 7/30 23.2 | −184 2/187 | +6 2/6 14.0 | +21 6/21 11.1 |

The comb line is the one input that matters (without it two tracks lose 20–65 ms and their jitter triples); the vote's
majority must be near-unanimous (5 of 8 flips CyborgNinja); the rest move things by ±3 ms. The onset ruler, the phase
ruler and the lattice are three different questions, and the sweep says the answers do not trade against each other.

### T.3 — the numbers (page `&map=0&lead=0` det, whole tracks, default clock and `&clock=pcm`; `tools/work/clock/t3{v3,pcm}-<Track>.json`, `tools/accept/live-grid/clock/t3*`)

**The clocks** (`gridcheck.py --heard`; every lag = the clock's own error on heard time; the PCM clock's rows are the same on
both traces — the switch changes what `bpm` / `beatPhase` publish, not the clock):

| track | v3: lag med (|lag| p50 / p90) · jitter p50 / p90 · `beat` F · lock | PCM: lag med (|lag| p50 / p90) · jitter p50 / p90 · `beatPcm` F · lock |
|---|---|---|---|
| SeeYouDrop | −4 ms (8 / 30) · 8 / 32 · 0.912 · 10.5 s | **+2 ms (6 / 19) · 6 / 19 · 0.970 · 7.6 s** |
| CyborgNinja | −66 (144 / 183) · 93 / 247 · 0.138 · never (this run; the T.0 run −87 · 43 / 244 · 0.05) | **+179 (179 / 181) · 1 / 3** · 0.004 · never — the OTHER kick lattice, exactly half a beat (187 ms), stable to 3 ms |
| WhoLikesToParty | +3 (4 / 13) · 4 / 11 · 0.945 · 8.0 s | +7 (7 / 10) · **2 / 6** · 0.956 · 10.9 s |
| Malicious | +9 (10 / 100) · 10 / 92 · 0.770 · 6.1 s (T.0 run +22 · 10 / 67 · 0.75) | +11 (13 / 28) · **7 / 25** · **0.944** · 6.1 s |

- The PCM clock is steadier on every track (jitter p90 19 / 3 / 6 / 25 ms against 32 / 247 / 11 / 92) and its beat events hit
  more (0.97 / 0.96 / 0.94 against 0.91 / 0.945 / 0.77). SeeYouDrop through drop 1 (45–55 s): p90 1–6 ms against v3's 46–62;
  at 133–145 s (the turn / outro) both drift (−20 / p90 10 against −87 / 71). Frame-to-frame |dlag| is 0.0 for both in det
  (v3's PLL bleeds; the Kalman corrects in steps: 0.7 % of frames move > 5 ms, 58 of those 66 in the first 10 s of the cold start).
- **CyborgNinja is a lattice question, not a clock question.** Both kick lattices carry near-equal energy; the comb line picks
  one on 70 % of its windows and the truth's downbeat tool the other by a 9 % low-band margin. v3 sits between them and tears
  (p90 247); the PCM clock sits ON one of them to 3 ms — and the bar store's predictions ride that (below). Which one is "the
  beat" is not decidable from the audio alone; a stable line is the useful one.
- **v3 is not deterministic run to run at the 1e-8 level.** Two page runs of the same 4a1e24c code hours apart differ in v3's
  `regularity` at frame 28 (the first comb estimate) by 4e-7 and in `beatPhase` by 6e-9; on SeeYouDrop / WhoLikesToParty that
  stays below 1e-5 for the whole track, on CyborgNinja's torn cold start it snowballs into a different lock (−87 vs −66 ms
  median), on Malicious into +22 vs +9. Three runs in one hour (the 4a1e24c tree, this tree twice, 25 s) are bit-identical
  and the whole-track additive proofs are identical (T.4): the decode or Chrome's state moved between the hours, not the code.
  The T.3 v3 column is today's run, the same run the `&clock=pcm` twin was recorded beside.

**The predictions with the switch on — the user's question** (`predcheck.py` F ±30 ms (P), the release lag med / p90;
`queuecheck.py` `next*In` F (P; chance), lag, jumps / live minute; `dropcheck` beats ahead):

| track · clock | pred kick · snare · hat F (P) | `nextKickIn` F (P) lag / jumps | `nextBeatIn` F, jumps | `nextBarIn` F | drops (beats ahead) |
|---|---|---|---|---|---|
| SeeYouDrop · v3 | 0.465 (0.58) · 0.586 (0.80) · 0.524 (0.75); lag +3 / 11 · 0 / 7 · +2 / 9 | 0.50 (0.59) +1 / 15 ms, 39 /min | 0.87, 0.4 | 0.87 | 15.9 · 8.0, 0.38 false/min |
| SeeYouDrop · pcm | 0.440 (0.57) · 0.526 (0.73) · 0.492 (0.72); lag +4 / 9 · 0 / 6 · +3 / 9 | 0.46 (0.57) +2 / 8, 55 | 0.94, 27 (58 of 68 in the first 10 s) | 0.63 | 14.0 · 8.0, 0.38 |
| SeeYouDrop · pcm, v3's bar phase (node, CLOCKKOFF=14) | **0.470 (0.59) · 0.585 (0.80) · 0.532 (0.76)** | 0.49 (0.59) | 0.94 | **0.94** | |
| CyborgNinja · v3 | 0.332 (0.72) · 0.329 (0.73) · 0.432 (0.75); lag −7 / 16 · −12 / 14 · −12 / 14 | 0.36 (0.61) −4 / 22, 53 | 0.05 | 0.00 | — |
| CyborgNinja · pcm | **0.696 (0.95) · 0.684 (0.97) · 0.861 (1.00)**; lag −5 / 4 · −10 / 0 · −11 / 3 | **0.72 (0.93) −4 / 10, 12** | 0.00 (the other lattice) | 0.00 | — |
| WhoLikesToParty · v3 | 0.512 (0.80) · 0.462 (0.69) · 0.619 (0.82); lag +6 / 19 · +2 / 14 · +2 / 14 | 0.54 (0.78) +6 / 17, 39 | 0.93, 0.0 | 0.30 (unverified line) | 8.0 (err +4) · 7 · 11 |
| WhoLikesToParty · pcm | **0.559 (0.86) · 0.484 (0.71) · 0.669 (0.86)**; lag +6 / 16 · +2 / 12 · +2 / 12 | **0.58 (0.83) +6 / 16, 31** | 0.96, 1.9 | 0.29 | 8.0 (err 0) · 7 · 11 |
| WhoLikesToParty · pcm, v3's bar phase (node, CLOCKKOFF=−1) | **0.611 (0.86) · 0.557 (0.73) · 0.723 (0.86)** | 0.63 (0.86) | 0.96 | | |
| Malicious · either | nothing predicted (F ≤ 0.03), as before | | 0.72 → **0.91** | 0.16 / 0.18 | 0 · 0.54 false/min |

- **Yes, they improve — where the clock was the limit.** CyborgNinja: the store's hits go from F 0.33 / 0.33 / 0.43 to 0.70 /
  0.68 / 0.86 at P 0.95–1.00, the kick count-down from 0.36 to 0.72 with a quarter of the jumps — the store's per-class
  offsets ride a line that no longer tears. WhoLikesToParty +0.05 / +0.02 / +0.05. The release lags' p90 tighten on every
  track (SeeYouDrop kick 11 → 9, CyborgNinja 16 → 4, WhoLikesToParty 19 → 16 ms).
- **SeeYouDrop's −0.02…−0.06 is the bar phase, not the clock.** The build / bars / queue stages keep the bar phase in COUNT
  units (bar k = beats [4k + a, 4k + a + 4), `a` from synapse's sure anchor when it has one, else 0 = the count's own mod 4).
  v3's count from t = 0 lands ≡ the truth downbeat by the accident of a track that starts on one (`t3v3`: offset 0 on every
  frame; synapse is sure on 0–30 % of the frames outside 60–90 s); the PCM clock's count, 14 beats behind after its own cold
  start, lands 2 beats off — `nextBarIn` 0.87 → 0.63, and the store's confidence share drops 8 points, the F 0.02–0.06. Put the
  same bar phase under both (node, `CLOCKKOFF=14`: the swapped-in count offset forced to the settled v3 − PCM difference) and
  the PCM clock wins on SeeYouDrop too (0.470 / 0.585 / 0.532 vs 0.465 / 0.586 / 0.524, `nextBarIn` 0.94 vs 0.87) and by
  more on WhoLikesToParty (0.611 / 0.557 / 0.723). In live use no start is at t = 0, so v3's mod-4 luck is not a property the
  A/B has — the switch (below) keeps whatever bar phase the stages hold.
- **The switch keeps the count.** Flipped live, `features-clock.js` sets a whole-beat offset `k` at the flip so the swapped-in
  count matches v3's to within half a beat: the beat LINE moves by the two clocks' difference (SeeYouDrop +6 ms, CyborgNinja
  up to half a beat) and `beatCount` / the bar phase do not. Measured the other way first: k set at LOCK time (7.6 s into a
  from-0 run) jumped the count under the stages after they had anchored and put the bar line 2 beats off for 50 s — so k is
  set at the flip and never later; a new Clock (a new stream, a seek) re-seats it. Flipping BACK to v3 holds the published
  line for up to the two clocks' difference (lead.js's "a pull back across a line holds on it": SeeYouDrop `beatPhase` 0 for
  ~50 ms at the flip back, proved headless below).
- **Cost.** `CARD.ENGINE.CLOCK.cpuTotal / frameN` = **0.17 ms per frame** in the headless page (SeeYouDrop, 1200 frames: the
  mono mix, the 2048 FFT per 512-sample hop, the flux, the ring, the filter, the pending scan); in node 0.09 ms per frame
  against the ears' 0.12 (`ENGINE.ms` at the end of a whole-track CLOCK=1 run with two Chromes in parallel reads 1.4–5.2 and is
  not a ruler). Under the 0.2 ms target; on the main thread because that is where the PCM bus and the ears' onsets are.

### T.4 — the proofs and the A/B

- `node tools/check.js` 0 fail (148 modules, 199 MS keys) · `npm test` OK with `test_clock.js` (13 checks) · `GPU=1 node
  tools/parity.js fake`: the 72 MS fields 0 diff, the `nav.*` rows red as since 22eb969 (OPEN-ITEMS) · the bundle 1299 KB / 148
  modules, from `file://` 346 frames in 6 s, errs [], nonFinite [], `clockPcm` 0 / `bpmPcm` 124 (the fake timeline has no PCM).
- **Additive:** SeeYouDrop whole-track det traces from a `git archive 4a1e24c` tree (port 8866) against this tree (8867), in the
  same hour: the 32-field caplag set on the default hash md5 `22bfb9e9`, its `&lead=0` twin `01d9c307`, the 80-field set
  (build-rec's + drums / bars / build / queue fields) `25107502` — all three `cmp`-identical (9444 frames). No existing value
  moved; the v3 clock, the lead, the stores and the queue are what they were with the switch off.
- **Page = node** (`build-node.js --cmp`, SeeYouDrop 0–40 s): `beatPhasePcm` within 2.4e-4 on 2400 / 2400 frames,
  `beatCountPcm` / `beatPcm` / `clockPcm` exact; under the switch `predKickIn` / `nextKickIn` within 5e-5 on 9443 / 9444 frames
  (the v3 path itself differs page / node in its first seconds — B.1, pre-existing).
- **The switch, headless on the real page** (`#test&track=SeeYouDrop&at=30&scene=4&map=0`, CLOCK=1): at frame 900 `clock` 'v3',
  `bpm` 150.026 / `bpmPcm` 149.968, `beatPhase` 0.507 / `beatPhasePcm` 0.503; `CARD.setClock('pcm')` → three frames later
  `bpm === bpmPcm` (149.9702), `beatPhase === beatPhasePcm` to 1e-14, `beatCount` 35 → 35 (k 0); at frame 1200 still equal,
  `beatCount` 48 = `beatCountPcm`, `nextBeatIn` 0.397, ERRS [], nonFinite []; `CARD.setClock('v3')` → `bpm` 149.939 (v3's
  own) with `bpmPcm` 149.990, `clockPcm` 0, `beatPhase` 0 on the flip frame (the hold across the line), errs [].
- **The A/B for the user (stream mode, the capture page):** A = the default; B = `CARD.setClock('pcm')` in the console on
  TORUS2 (key 4) and NAV (key 1) — every beat-driven motion (the wave's pulse, NAV's bump, the bars' predicted hits, the queue's
  wind-ups) rides the PCM clock; `CARD.setClock('v3')` back. Or start B with `HASHX='&clock=pcm'`. The capture run for the
  ruler: `FIELDSX='beatCount,bpmPcm,beatPhasePcm,beatPcm,beatCountPcm,clockConfPcm,clockPcm,predKickEvt,predKickIn,nextBeatIn,
  nextBarIn,nextKickIn,nextSnareIn,nextHatIn,nextDropIn,queueN,buildLive,dropLiveIn' node tools/caplag.js track SeeYouDrop 0 110
  27` (caplag's own FIELDS carry heardT / beat / beatPhase / bpm / leadT / the ears' events; FIELDSX must not repeat them), once
  as is and once with `HASHX='&clock=pcm'`; then `gridcheck.py` (the pcm rows beside v3's, no `--heard`: a capture trace is on
  heard time already), `predcheck.py`, `queuecheck.py` on both.

### Step 6 addendum — the publish time (after the audible capture run, 2026-09-30)

The capture run had `nextBeatIn` jumping 1479 / min under the PCM clock (v3 3.2) with a small phase jitter: the clock followed heardT
exactly (phase advance − heardT advance 0.00 ms) and heardT in capture steps 10.7 / 21.3 ms per frame (v3 integrates the frame's dt:
16.1 / 16.7 / 17.0). Fix: the clock is evaluated at `now` + median(heardT − now, 64 frames) — DECISIONS §56 addendum has the numbers
(the emulation on the capture trace: 16.7 / 16.7 / 16.7 per frame, 0 % of frames off by > 10 ms; det bit-identical; RT file 16.6 /
16.7 / 16.8). `tools/work/clock/rt-{v3,pcm}.json`.

### Step 6 addendum 2 — the audible capture runs (orchestrator, 2026-09-30)

SeeYouDrop 0–110 s in tab capture (`&sync=27`), three runs: the default clock (`cap-v3`), `&clock=pcm` before the heardT
smoothing (`cap-pcm`), and after it at `5648097` (`cap-pcm2`). gridcheck (the published clock vs the truth grid), predcheck,
queuecheck:

| | v3 (default) | pcm, before 5648097 | pcm, after |
|---|---|---|---|
| beatPhase lag med / p50 / p90 | +11 / 15 / 45 ms | +1 / 5 / 12 | **+0 / 6 / 14** |
| beatPhase jitter p50 / p90 | 9 / 53 ms | 4 / 11 | 6 / 14 |
| beat events F ±50 ms | 0.876 | 0.949 | 0.938 |
| pred kick F (P) · lag | 0.189 (0.34) · +24.5 ms | 0.299 (0.55) · +9.5 | **0.384 (0.66) · +4.2** |
| `nextBeatIn` F (P) · lag · jumps/min | 0.65 (0.79) · +11 · 3.2 | 0.77 (0.95) · +1 · **1479** | 0.75 (0.92) · −0 · 16 |
| `nextKickIn` F (P) · lag · jumps/min | 0.18 (0.29) · +22 · 262 | 0.37 (0.61) · +8 · 1532 | 0.43 (0.65) · +4 · 281 |
| `nextDropIn` beats ahead · false | 12.1 / 8.0 · 0 | 14.0 / 8.0 · 0 | 14.0 / 8.0 · 0 |

The 1479 / min was heardT stepping in capture (10.7 / 21.3 ms per frame), which the PCM clock followed faithfully and v3
(integrated on dt) never saw; evaluated at `now` + the median heardT offset the count-down advances evenly (16 / min, the cold
start). The remaining `nextKickIn` jumps (281 vs v3's 262) are the store's per-class offsets, not the clock.

### Step 6 addendum 3 — the half-beat lattice is the low band's call (one worker, 2026-09-30; DECISIONS §59)

§58's accuracy review found the DEFAULT clock (the PCM clock) **half a beat off on CyborgNinja** — page det
`&map=0&lead=0`, whole track: `beatPhasePcm` **+179 ms** (p50 179, p90 181; half a beat is 187.5 ms at 160.0003 BPM),
`beatPcm` F **0.004**, never locked. The truth grid is right (its five downbeat-novelty peaks are integer beats from its
phase to within 1 ms, so the section starts are on the chosen beat); the clock is wrong, because neither of its two phase
inputs can tell the lattices apart there — the ears' kicks land on every 8th (236 against 213, Kalman weight 485 / 477)
and the comb's 8-beat line, which is the FULL-spectrum flux's, follows this track's offbeat hats (half a beat off the
truth's on 264 of its 344 clear windows, so §56's lattice vote never fires). The 40–150 Hz flux does tell them apart on
all four tracks (truth lattice / its half-beat: 1.199 CyborgNinja · 1.299 SeeYouDrop · 1.684 WhoLikesToParty · 1.009
Malicious), which is the truth tool's own rule. `engine/clock/clock.js lattice()` now reads it every hop and moves the
line forward half a beat when the half-beat carries it by `LAT_MARG`; the comb line's vote may not move the line onto a
lattice the low band has ruled against. The A/B is one knob: `CLOCKK='{"LAT_MARG":1e9}' node tools/filetrace.js …`
(new in `filetrace.js`) gives §56's published clock exactly.

| page det, `gridcheck.py --heard` | before | after |
|---|---|---|
| CyborgNinja (whole track) lag med / p50 / p90 · `beat` F · locked | +179 / 179 / 181 ms · 0.004 · never | **−9 / 9 / 13 ms · 0.896 · 19.3 s** |
| SeeYouDrop 0–120 s | −0 / 5 / 13 · 0.959 · 7.6 s | −0 / 5 / 13 · 0.959 · 7.6 s (identical) |
| WhoLikesToParty 0–120 s | +7 / 7 / 10 · 0.906 · 10.9 s | +7 / 7 / 10 · **0.949** · **5.6 s** |
| Malicious 0–120 s | +10 / 11 / 27 · 0.960 · 6.1 s | +10 / 11 / 27 · 0.960 · 6.1 s (identical) |
| CyborgNinja v3 (`&clock=v3`, untouched) | −65 / 144 / 183 · 0.138 · never | the same |

Synapse's grid is untouched (`barPos` / `beatSyn` / `barConf` / `phrase16Pos` identical before and after: CyborgNinja's
bar line 10.7 % on the truth downbeat, SeeYouDrop's 74.6 %). Cost flat (node `Clock.push` 56.5–57.0 µs per hop either
way). `tools/work/clock/s59/*`. Not tagged, not pushed, not deployed.

### Step 6 addendum 4 — Malicious's +30 ms is its TRUTH GRID (one worker, 2026-10-01; DECISIONS §71)

§69's clock table had one losing row: the PCM clock's line on Malicious **+23 → +30 ms**, within ±30 ms **80 → 50 %**,
bias-removed steadiness **94 → 95 %** (a pure offset — jitter p50 7 / p90 24 ms, frame-to-frame |dlag| p50 0.0). Both
numbers reproduced here in isolated `git worktree`s of HEAD (`9b164e2`) and `4e175e5`, node, whole track.

**The mechanism, stated in the clock's own terms.** `clock.js measureLine()` is a PDA update, so the line settles on
the **β-weighted centre** of its phase measurements (weight `vel / R_CLS[cls]` × the gate's `beta`). Summed over the
whole track from `clock-study.js`'s `log` — each onset's offset to the nearest truth beat, inside ±0.15 beat:

| β-weighted offset (ms), pre-§69 → HEAD | kick | snare | hat | all | the clock's lag |
|---|---|---|---|---|---|
| SeeYouDrop | +2.5 → +3.0 | −2.7 → −1.4 | −4.9 → −4.3 | −1.3 → −0.5 | +1 → +3 |
| CyborgNinja | −0.4 → −0.5 | +2.7 → +1.3 | +3.0 → +3.0 | +1.4 → +0.9 | +1 → +1 |
| WhoLikesToParty | +2.9 → +3.0 | +4.7 → +6.4 | +4.8 → +4.9 | +3.8 → +4.7 | +6 → +6 |
| **Malicious** | +18.5 → **+21.4** | +21.0 → **+31.1** | +12.9 → **+13.8** | +18.0 → **+24.2** | +23 → **+30** |
| Vienna | +2.8 → +2.5 | +11.1 → +3.5 | +4.0 → +3.6 | +7.3 → +3.2 | +6 → +4 |

The "all" column predicts the lag within 6 ms on every track. §69 moved Malicious both ways at once: the snare lane's
placement +21.0 → +31.1 ms and its share of the weight 43 → 49 % (β·w 119.5 → 142.8). But **all three classes there
are late together** (+21 / +31 / +14), including the kick lane that reads −0.5…+3.0 on the other four — a common mode,
which no class weighting can remove.

**Four rulers say the grid's lines are ~20 ms before the music's attacks, and only on this track.** (1) the truth
tool's own offline onset lists against its own beats: `mid` median **+23.3 ms, p25 +23.0 / p75 +23.6** — a near-delta —
`click` +23.5, `high` +22.8, where the other four read within ±7; (2) a zero-phase `filtfilt` attack-time measurement
using no engine and no truth list: **every** band from 25 Hz to 12 kHz late (+11.5 / +21.4 / +22.9 / +17.3 / +13.8 for
25–60 / 40–150 / 150–800 / 0.8–2.5 k / 5–12 k), where the controls straddle the line (SeeYouDrop +28.5 … −11.1); (3)
`trackmap.py anchor_grid`'s own 40–150 Hz rule run as a continuous offset scan — the energy at the grid's own line is
**0.53** of the best line's in 150–800 Hz (argmax +41 ms), the only reading under 0.82 in the set; (4) the provenance:
`if dpres > 0.06: beats = bdp` fires on its 89.7 ms DP residual, so its `beats` are the raw Ellis DP tracker's
(hop-quantised 11.6 ms, 15.9 ms rms off a straight line) and the whole kick-anchor branch is skipped — and the anchor
could not have run anyway, its kicks' eighth-lattice resultant being **0.134** against `ANCHOR_R` 0.5 (CyborgNinja
0.959 / WhoLikesToParty 0.544 / SeeYouDrop 0.500 / Vienna 0.351). The other four grids all have an anchor, a drift fit
or a hand.

With that ~23 ms off, the ears' lanes on Malicious are ordinary — kick **+0.0**, snare **+8.2**, hat **+0.0** ms against
their own bands' measured attacks — and the clock reads **+7 ms** (node) / **−4 ms** (page). The page's own det run
(`&map=0&lead=0`, whole track, one `filetrace.js`) reads **+19 ms, 81 % within ±30**, the ~11 ms page/node gap being
addendum 3's own recorded one (page +10 vs node +22 there).

**The three candidates, measured by knob, no code change** (`CLOCKK='{"R_CLS":[…]}'`, five node runs each):

| `R_CLS` | SeeYouDrop | CyborgNinja | WhoLikesToParty | **Malicious** | Vienna |
|---|---|---|---|---|---|
| **1 / 1.5 / 3 (ships)** | +3, 97 %, 12.0 s | +1, 97 %, **3.4 s** | +6, 99 %, 5.6 s | **+30, 50 %** | +4, 74 %, p90 **67** |
| kick only (1 / 1e9 / 1e9) | +13, 84 %, 12.6 s | −0, 92 %, 17.1 s | +6, 99 %, 3.3 s | **+36, 33 %**, 27.4 s | +6, 63 %, p90 329 |
| 1 / 3 / 12 | +6, 94 %, 12.2 s | −2, 93 %, 18.7 s | +5, 99 %, 5.6 s | **+37, 29 %** | +4, 69 %, p90 320 |
| 1 / 6 / 24 | +8, 89 %, 13.1 s | −2, 93 %, 18.7 s | +4, 99 %, 5.6 s | **+39, 24 %** | +4, 73 %, p90 320 |

Kicks-define-the-beat is backwards here (the hat lane is the early one, so dropping hats moves the line LATER) and it
gives back exactly what §69 bought. A per-class lag compensation has nothing to compensate: ±3 ms of spread on the four
anchored tracks. **So nothing in `engine/clock/` changed.**

**What did change, both in tools.** `tools/test_clock.js` gains a **`backbeat`** case — kicks on every beat, snares
**40 ms late on 2 and 4** (loud 1.3, no low band, class 1) — and the clock's line stays on the kicks at **med +3.20 /
p90 4.17 ms**, gate 5 ms: the property the diagnosis rests on, now guarded (14 checks, 12 before). And
`tools/truth/gridcheck.py` prints a caveat above the table when the truth file says the beat phase was never placed on
the audio (no `bpm_grid.anchor`, no `bpm_grid.hand`, `dp_residual_ms > 60`) — it fires on Malicious alone, and the five
tables are byte-identical with and without it.

```
node tools/clock-study.js <Track> --no-v3 --out tools/work/clock/x-<Track>.json   # in a worktree; the PCM clock + every onset in `log`
python3 tools/truth/gridcheck.py tools/work/clock/x-<Track>.json --heard          # the pcm rows, now with the un-anchored-grid caveat
CLOCKK='{"R_CLS":[1,1e9,1e9]}' node tools/clock-study.js <Track> --no-v3 …        # the kick-only phase A/B, one knob, no tree
```

`node tools/check.js` 0 fail · `npm test` OK · the engine byte-identical to `9b164e2` (so the md5 sweep, the bar / queue
tables and `Clock.push` µs/hop are HEAD's by construction; the sweep was taken anyway in an isolated worktree,
`PORT=8908 tools/scene-md5.sh s71`, `errs []` on all 12 ids, and the three lines §56/§59 pinned read `fb74fee4` /
`8a0715df` / `05bf21c0`). No audible run. Not tagged, not pushed, not deployed.
