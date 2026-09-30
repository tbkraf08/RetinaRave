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
