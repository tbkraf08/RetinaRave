# Truth-grid validation — Vienna + Malicious, controls SeeYouDrop + CyborgNinja (2026-10-02, one worker, headless)

NEXT-SESSION-PROMPT "Validating a truth grid", steps 2–4. **No grid was changed**: every proposal below is an edit the user's
ear confirms or refutes first (step 1 is theirs; the click WAVs in `~/Music/RetinaRave-clicks/` were not regenerated or played).
Engine untouched; `assets/` untouched. Everything here is reproducible from `tools/truth/v83-*.py` (the scripts), the outputs
sit in `tools/work/v83/` (git-ignored) and the four canonical montages are copied to `docs/truth/v83/`.

Conventions: an offset is **attack minus grid line, ms; positive = the line is EARLY of the music** (the audio arrives after
the click). The ±5 ms band is §72's agreement criterion. "On the line" = the attack starts at the black line in the montage.

## 0. Provenance — `python3 tools/truth/gridcheck.py SeeYouDrop CyborgNinja WhoLikesToParty Malicious Vienna`

The call died in `ld('<T>')` before this session (the first argument had always been a trace path; the §71 provenance print
lived inside `run()`, behind a trace). Fixed in `ffc6a62`: a bare track name prints the provenance from the truth file alone.

| track | flag | bpm | beat s | phase s | dp_residual_ms | mod4 | hand | anchor | provisional | dp_t0 |
|---|---|---|---|---|---|---|---|---|---|---|
| SeeYouDrop | **tool** | 150.0303 | 0.399919 | 0.01724 | 32.5 | 0 | no | no | no | no |
| CyborgNinja | **anchor** | 160.0003 | 0.374999 | 0.02005 | 49.8 | 0 | no | yes | no | no |
| WhoLikesToParty | **anchor** | 117.001 | 0.512816 | 0.07159 | 22.3 | 0 | no | yes | no | no |
| Malicious | **hand** (2026-10-01) | 139.6748 | 0.429569 | 0.06966 | 89.7 | 2 | yes | no | no | yes |
| Vienna | **provisional** | 90.0 | 0.666667 | 0.0026 | 0.0 | 0 | yes | no | yes | no |

SeeYouDrop reads `tool` because its hand check (kicks +4 ms after its beats) is recorded only in `gridcheck.py`'s docstring,
not in the json — see the proposed edit in §5. The `!! never placed on the audio` caveat fires on none of the five.

## 1. The hand montages (`tools/truth/v83-hand.py <T> [low|mid|high]`)

16 beats spread across the track (the best on-beat attack in each of 16 equal beat-index bins), the native 44.1 kHz mono dump
±60 ms, the grid's line in black, the lane's zero-phase envelope in red, the 20 % crossing (`t20`) and the 100 Hz-HP departure
dotted. The implied correction = median `t20` minus the same estimator's calibration on the four validated grids (§72: low
+8.2, mid +0.4, high −2.1 ms). The canonical montage per track is the lane with the clean on-beat transient on that track.

| track | canonical montage | lane | t20 median | implied | sd | the other lanes (implied) | **verdict** |
|---|---|---|---|---|---|---|---|
| Vienna | `docs/truth/v83/hand-Vienna.png` | mid 150–800 (the snare/clap — the lane the hand grid's phase came from) | −0.7 | **−1.1** | 10.3 | low −8.6 (sd 12, the 808 under the kick), high −21 (sd 21: the hats are 8ths/16ths here, not a beat transient; §72's own Vienna high pass read −39 with the same sd) | **on the line** — 13 of 16 attacks start at the black line; the 3 misses are low-snr panels (beats 4, 115, 161) |
| Malicious | `docs/truth/v83/hand-Malicious.png` (+ `-mid`) | high 5–12 k (§72's lane) | −6.9 | **−4.8** | 5.3 | mid −8.1 (sd 19, smeared 808/pad attacks), low −21 (sd 21, unusable — §72 said so) | **on the line within the track's smear**: the hat envelope starts 4–9 ms before the line in most panels, inside ±5 of the calibrated zero; not a constant offset the automatic rulers share (they read +0.2…+5.9) |
| SeeYouDrop | `docs/truth/v83/hand-SeeYouDrop.png` | mid | −1.6 | **−2.0** | 16.1 | high −9.6 (its hats lead the kick: ruler (a) 5–12 k −10.9, §72 −12.7), low −9.5 | **on the line** (control) |
| CyborgNinja | `docs/truth/v83/hand-CyborgNinja.png` | high | −0.4 | **+1.7** | 1.4 | mid −2.4 (sd 1.6), low −3.2 (sd 2.0) | **on the line** (control; the cleanest track in the set) |

No montage shows a drift (the per-mark `t20` vs time slopes are noise: sd 1–21 ms over 16 marks); the drift ruler is §2.

## 2. The three automatic rulers (±5 ms = agree)

(a) `tools/work/v72/ruler_a.py` — zero-phase `filtfilt` band, `filtfilt` envelope, the 20 % crossing, 1 ms step, five bands, no
engine, no truth list. (b) `node tools/drums-node.js <T> --out tools/work/v83/drums` (the page's ears in node, 60 Hz frames;
plain run, no `--perc` knobs, so the lanes are the page's) folded on the grid by `tools/truth/v83-drift.py` — the vel-weighted
MEAN over all lanes (a median is frame-quantised to 16.7 ms). (c) `tools/work/v72/prov.py` — the tool's own onset lists
(`low/click/mid/high`, real times) against its own beats.

| track | (a) all-bands median | (a) 40–150 kick band | (a) 150–800 | (b) ears all-lane mean (kick / snare / hat) | (c) tool low / click / mid / high | spread of (a,b,c) | **diagnosis** |
|---|---|---|---|---|---|---|---|
| **Vienna** | **−1.3** | +4.4 | −1.3 | **+1.1** (+4.9 / +2.8 / −1.9) | **+0.1 / +1.4 / +2.1 / −1.9** | 2.4 ms | **agree → the beat phase is right** |
| **Malicious** | **+3.1** | +12.8 | +3.1 | **+5.9** (−0.7 / +18.3 / −8.7) | **+0.2 / +0.3 / +0.1 / −0.4** | 5.7 ms | **agree within the band** (b is 0.9 ms over it, carried by the snare lane alone: §71 already measured that lane +8.2 ms late of its own band's attack on this track; its kick −0.7 and hat −8.7 straddle the line) → no constant offset, the §72 `t0` fix holds |
| SeeYouDrop (control) | −0.5 | +12.2 | −0.5 | −0.1 (+6.9 / +0.2 / −4.2) | +6.6 / +4.3 / −2.4 / −3.9 | 4.8 ms | agree (the hand-checked grid; its kicks sit +4…+7 after the line, its hats −4…−11 before — the band profile §71 recorded) |
| CyborgNinja (control) | +0.3 | +2.7 | −2.1 | +3.2 (+4.7 / +1.9 / +3.0) | +0.2 / +0.2 / +2.0 / +3.1 | 3.0 ms | agree |

The 40–150 Hz band reads +12 on SeeYouDrop and Malicious alike (the sub's slow rise), so Malicious's kick band is inside the
controls' range (+2.7 … +13.4 in §71).

**Drift** (`tools/truth/v83-drift.py`: the tool's own onset lists folded at the grid's period, median offset per 20 s slice):

| track | mid-lane phase per 20 s slice (ms) | slope | bpm correction | **verdict** |
|---|---|---|---|---|
| Vienna | +0.2 −0.4 +1.4 · −2.8 +2.4 +5.2 +7.6 +5.7 (high lane −6…+7, flat) | +0.05 ms/s | −0.004 | **no drift**; 90.000 BPM stands (the hand block's own "37 ms spread over 180 s") |
| Malicious | +0.1 … +0.2 in every slice (the −11.4 cells are the DP list's 11.6 ms hop steps) | +0.02 ms/s | −0.002 | **no drift** of the DP list against its own onsets; `bpm_grid.bpm` 139.6748 is still the hop-median and §72's `tempo_note` (140.00) still stands |
| SeeYouDrop | −11.6 −8.1 −2.3 +1.7 +1.4 +7.7 (all four lists slope the same way, +0.12…+0.18 ms/s) | +0.15 ms/s | **−0.02 → 150.01** | a 20 ms walk over the whole track: below the montage's resolution and the eye's 40 ms; noted, no edit proposed unless the user hears the clicks drift late by the end |
| CyborgNinja | +3.0 +2.0 +1.0 +2.1 +1.1 +0.2 +2.2 +2.2 +2.3 | −0.001 ms/s | +0.000 | no drift |

**Half-beat (§59 lattice):** none. On every track the attacks fold on the grid's own beat (the (c) offsets are 0–7 ms, not
~P/2), and the per-bar folds in §3 show the kick / snare weight on whole beats of the grid, not between them.

## 3. The bar line (`tools/truth/v83-barfold.py`, `tools/truth/v83-nov.py`)

Three rulers per track: the ears' lanes and the tool's onset lists folded on the grid's bar (share of hits on beats 1–4,
beat 1 = the grid's downbeat); the zero-phase band RISE energy per beat of the bar; the drop neighbourhoods (per-beat 40–150 Hz
and 5–12 kHz rise, the 4 beats before and 8 after each `drops_user`/`drops` entry); and a grid-free Foote novelty (12 log-band
shares, 46 ms hop, checkerboard kernel 2 bars) whose peaks are folded on the same bar.

| track | ears kick % on 1/2/3/4 (vel-weighted) | 40–150 rise | 150–800 rise | 5–12 k rise | snare / backbeat | grid-free novelty peaks on beat 1/2/3/4 | drops | **bar-line verdict** |
|---|---|---|---|---|---|---|---|---|
| **Vienna** | **48 / 18 / 34 / 0** | 33 / 19 / 34 / 14 | 17.5 / **34.6** / 14 / **33.9** | 15 / **37** / 13 / **34.5** | the snare/clap and hat RISE sit on the grid's **2 and 4** (the ears' snare lane is flat 25/26/22/27 — it fires on every beat here) | **5** / 0 / 2 / 4 | 85.336 = beat 128 = bar-beat 1: low rise **1.00** after four near-silent beats (0.03 0.00 0.01 0.02), high rise 1.00 on beat 2 and 0.73 / 0.91 on 4 and 2 of the next bars; 106.669 = beat 160 = bar-beat 1, low 1.00, high on 2 and 4 (0.73 / 1.00) | **confirmed**: kick heaviest on 1, backbeat on 2/4, both drops' first kick on the grid's 1, 5 of 11 structural peaks on 1 |
| **Malicious** | 17 / 21 / **35** / 27 | 23 / 25 / **30** / 22 | 25 / 22 / **29** / 23 | 18 / 17 / **42** / 23 | NO backbeat: the ears' snare 26/24/24/26, the mid list 26/19/34/22 — the snare is on every beat, heaviest on the grid's 3 | **0 / 0 / 9 / 0** (2-bar kernel: the intro's boundaries at 5.15 8.59 12.03 15.42 18.81 22.29 25.73 s = beats 12 20 28 … 60, every 2 bars, ALL on the grid's beat 3; 4-bar kernel 1 / 3 / 11 / 4) | 148.317 = beat 346 = bar-beat 1 of the grid: low rise 0.72 (no arrival: 0.71 0.57 0.76 0.73 before it); the hats ENTER one bar later at beat 350 = **150.036** (= the grid's own section start; high 0.73 → 1.00 at beat 351, the heaviest kick also at 351) | **two rulers say the grid's beat 3 is the one** (the percussion weight: kick, click, hat, high all heaviest on 3; the structure: 9 of 9 two-bar boundaries on 3); one says the current line (the hats' entry at 150.036 falls on the grid's 1). **Unverified, ear decides** — proposal in §5 |
| SeeYouDrop (control) | 29 / 17 / 34 / 21 | **34** / 21 / 25 / 19 | 26.5 / 22.5 / 28 / 23 | flat | no 2/4 backbeat on this track either (150–800 flat) | **7** / 3 / 2 / 0 | 57.606 = beat 144 = bar-beat 1, low **1.00** after 0.02 0.02 0.01 0.02; 105.596 = beat 264 = 1, low 1.00 / 0.07 / 0.50 / 0.06 (kick on 1 and 3, heaviest on 1) | confirmed — the method reads the known-good line |
| CyborgNinja (control) | 9 / 11 / 40 / **39** | 14 / 19 / 31 / **36** | 26 / 25 / 21 / 28 | flat | kick weight on **3–4** (an anacrusis pattern driving into the 1) | **7** / 4 / 1 / 2 (84.01 96.04 108.07 167.97 on 1 — §59's own peaks) | no drops | confirmed by STRUCTURE, not by the kick: the §59 bar line rests on the novelty peaks, and the percussion weight sits on 3–4 of it |

CyborgNinja is why the Malicious percussion fold is not proof on its own: a known-good bar line can carry its kick weight on
3–4. What makes Malicious different is that its grid-free structural boundaries fall on beat 3 too (CyborgNinja's fall on 1),
and that `downbeat_mod4 = 2` came from `downbeat_phase` alone — the DP branch never ran `downbeat_novelty` (§72). Beat 1 vs
beat 3 is a half-bar question; beats 2 and 4 are supported by nothing.

## 4. Step 4 — the user's notes, `--loud`, `dropcheck.py`

- `Vienna.json` carries `drops_user` [85.3359, 106.6693] (+ `drops_user_note`), `drops_hand`, `drops_tool` [105.639],
  `drops_note`, `sections_hand` (23 entries, bar-pinned; the dream 66.669 → 85.336 = bars 25 → 32, the first drop at bar 32),
  `notes.user_verbatim_2026_09_30` (both remarks: "1:05–1:25 … feels like in a dream before first drop at 1:25 where it adds a
  double time", the jerk at 1:40–1:50), `feel`, `provisional: true`, and `bpm_grid.hand` (not_checked: "nobody has listened").
  `drops` == `drops_user` (the §64 hand list), so every reader of `drops` already grades the user's two drops.
- `trackmap.py --loud` prefers `sections_hand` / `drops_user` (lines 371–375). Run into `tools/work/v83/loud/` (writes only
  the `.loud.json`, never `<T>.json`): Vienna integrated −6.89 LKFS; the dream section 66.669–85.336 is the quietest of the
  track at **−9.71 LKFS** (−7.67 in the bars just before it, −7.33 in the drop section after), the first drop is **+0.92 LU / ×1.235 power** over its breakdown
  window, the second +0.26 LU / ×1.063 — so the user's "dream, then the drop at 1:25" is what the loudness ruler reads too.
- `dropcheck.py` read `T['drops']` only; now `drops_user` first (`b8a9475`), Vienna's output byte-identical, selftest OK.
- What `dropcheck.py` says today (fresh `node tools/build-node.js Vienna Malicious --out tools/work/v83/build`, the causal node
  path): **no causal rule anticipates either Vienna drop or the Malicious drop** — `build>=0.5` / `>=0.3`, `riser`, `dropConf`,
  `dropExpectedIn`, `hush`, `tension`, `roll`, `hp`, `synTension`, `synAll` all read anticipation 0.0 beats at the drops;
  `swell>=0.5` is the one that arms, 5.2 beats before Vienna's 85.336 (0.0 before 106.669); `dropEvt` fires 1 event on Vienna
  (none at a drop) and 3 on Malicious (none at the drop); `synDropEvt` 0 on both. False arms 0.3–7.8 / min. This is the build
  detector's state on these two tracks, not the grid's: the grid places the drops where the audio arrives (§3), the detector
  does not see them coming. Open item for the engine, not this doc (`tools/work/v83/dropcheck.txt`).

## 5. Proposed edits — nothing applied; the user's ear confirms or refutes each one first

### Vienna — pass; promote once heard
Every ruler agrees: beat phase −1.3 / +1.1 / +0.1…+2.1 (hand montage −1.1), no drift, bar line confirmed three ways, both
drops on the bar line with the first kick. Proposed edit, **after the user has listened** (step 1):
- `provisional`: `true` → **delete the key** (or `false`); `bpm_grid.hand.provisional`: `true` → `false`
- `bpm_grid.hand.anchor`: add `"hand"`; `bpm_grid.hand.date`: add `"2026-10-02"` (the date the user listened)
- `bpm_grid.hand.not_checked` → rename to `checked`: `"user listened 2026-10-02 (Vienna-click / -beats-and-bars / -bar-line-only, 60–112 s); worker rulers docs/truth/GRID-VALIDATION-2026-10-02.md: beat phase −1.3 / +1.1 / +0.1 ms, bar line kick-on-1 + backbeat-2/4 + both drops' first kick on 1"`
- `bpm_grid.hand.validation`: add `"docs/truth/GRID-VALIDATION-2026-10-02.md"`
No number in `beats` / `downbeats` / `bpm` / `phase` moves.

### Malicious — beat phase passes; the bar line is the open question
Beat phase: three rulers +3.1 / +5.9 / +0.2, hand −4.8 (high) — inside the band, the §72 `t0` re-phase holds; **no edit to
`beats` / `phase`**. Tempo: no drift; `bpm_grid.bpm` 139.6748 stays the hop-median with §72's `tempo_note` (140.00 is the
tempo) — optional cosmetic: `bpm_grid.bpm` → `140.0` is NOT proposed because `beats` is the DP list and the two must agree.

Bar line — **if the user hears the accent on the "3"** (below):
- `downbeats`: `beats[2::4]` (130 entries, first 0.9288, 2.6471, 4.3654) → **`beats[0::4]`** (130 entries, first 0.0697, 1.7879, 3.5062, 5.2245, last 221.2049)
- `bpm_grid.downbeat_mod4`: `2` → **`0`**
- `sections[*].t0 / t1`: re-snap each to the nearest NEW bar line (±2 beats): 0.929→0.070 · 14.652→13.793 · 26.657→27.504 · 54.044→54.880 · 67.744→68.603 · 81.456→82.315 · 95.179→96.026 · 108.878→109.737 · 124.320→123.460 · 138.031→137.172 · 150.036→150.883 · 163.747→164.595 · 179.177→178.318 · 191.170→192.029 · 206.600→205.740 (then the `.kick/.snare/.loud.json` references and the `grain-{bar,4bar}` tables are rebuilt from the tool, as §72 did)
- `drops` [148.317]: the grid's drop is one bar BEFORE the hats' entry at 150.036 (beat 350, the heaviest kick at 150.454); under the new line the nearest bar lines to 148.317 are 147.458 / 149.177. Proposed: `drops_user` = whatever bar the user names at 2:28–2:31 (see §6); `drops_tool` = [148.317] kept.
- `bpm_grid.hand.bar_line`: add `"downbeat_mod4 2 → 0 on 2026-10-02: the user heard the accent on the 3; rulers: ears kick 35 % / click 43 % / high 41 % on the grid's beat 3, 9 of 9 two-bar novelty peaks on 3 (docs/truth/GRID-VALIDATION-2026-10-02.md §3)"`
**If the user hears the accent on the "1"**: no edit; set `bpm_grid.hand.bar_line_checked`: `"user confirmed 2026-10-02 (Malicious-click 20–60 s)"` and record that the percussion weight sits on 3 as CyborgNinja's does on 3–4.

### SeeYouDrop — record the hand check in the json
- `bpm_grid.hand`: add `{"anchor": "hand", "date": "2026-09-28", "source": "gridcheck.py docstring (kicks +4 ms after the beats); re-measured 2026-10-02: (a) −0.5 (b) −0.1 (c) +4.3 ms, hand montage −2.0, bar line kick-on-1 + both drops' first kick on 1", "tempo_note": "the onset lists walk +0.15 ms/s → 150.01 BPM would be flatter; 20 ms over the track, not applied"}`
  so `gridcheck.py` reads `hand` instead of `tool`.

### CyborgNinja — nothing
All rulers inside ±3.2 ms, no drift, the §59 bar line confirmed by the structural peaks (7 of 14 on 1). No edit.

## 6. What the user must listen for (the WAVs are windows: Vienna 60–112 s, Malicious 20–60 s, SeeYouDrop 40–70 s of the track)

- **Vienna** — `! paplay ~/Music/RetinaRave-clicks/Vienna-bar-line-only.wav` at WAV **0:25.3 = track 1:25.3**: the single accent
  should land ON the drop's first kick (the one after the four silent beats); if it lands a beat early or late, the bar line is
  off by one (it is not, by three rulers). Then `Vienna-click.wav` through 1:05–1:25 (WAV 0:05–0:25, the dream) and 1:40–1:50
  (WAV 0:40–0:50): every click should sit on a snare/clap or a kick with no flam; a flam = a phase offset we did not measure.
  `Vienna-beats-and-bars.wav`: the low accent every 4th click should be the kick's "one", the clicks in between on the 2/4 claps.
- **Malicious** — `! paplay ~/Music/RetinaRave-clicks/Malicious-click.wav` at WAV **0:00–0:07 = track 0:20–0:27** (the intro's
  2-bar pattern) and **0:07–0:40 = track 0:27–1:00**: count along; the louder/lower accent is the grid's "one". **If the accent
  feels like it lands on the "3"** — two clicks after where you count "one", on the heavier kick/hat hit — the bar line is two
  beats off (§5 edit). If it sits on your "one", the line stands. The plain clicks should have no flam (the beat phase passed).
  The drop needs a render this worker did not make: `python3 tools/truth/clicktrack.py Malicious --drops --sections --from=140
  --to=160` → listen at track 2:28.3 (the grid's drop click) vs 2:30.0 (where the hats come in): the long low click should be on
  the bar you feel as the drop; if the music drops at 2:30 and the click is at 2:28, `drops_user` = 150.036.
- **SeeYouDrop** (control) — `! paplay ~/Music/RetinaRave-clicks/SeeYouDrop-click.wav` at WAV **0:17.6 = track 0:57.6**: the
  accent on the drop's first kick after the silence; the clicks before it tight on the kicks (the known-good grid — if this
  one flams, the listening chain is late, not the grid).
- **CyborgNinja** — no WAV rendered; not needed unless the user wants the control heard (`clicktrack.py CyborgNinja --from=80 --to=110`).

## 7. Reproduce

```
python3 tools/truth/gridcheck.py SeeYouDrop CyborgNinja WhoLikesToParty Malicious Vienna     # §0
python3 tools/truth/v83-hand.py Vienna mid ; python3 tools/truth/v83-hand.py Malicious high  # §1 -> tools/work/v83/hand-<T>[-lane].png/.json
python3 tools/work/v72/ruler_a.py SeeYouDrop CyborgNinja Malicious Vienna                   # §2 (a)
node tools/drums-node.js Vienna Malicious SeeYouDrop CyborgNinja --out tools/work/v83/drums  # §2 (b) traces (no dev server needed)
python3 tools/truth/v83-drift.py Vienna Malicious SeeYouDrop CyborgNinja                     # §2 (b) means + the drift table
python3 tools/work/v72/prov.py                                                               # §2 (c)
python3 tools/truth/v83-barfold.py <T> ; python3 tools/truth/v83-nov.py <T>                  # §3
node tools/build-node.js Vienna Malicious --out tools/work/v83/build && python3 tools/truth/dropcheck.py tools/work/v83/build/node-*.json   # §4
python3 tools/truth/trackmap.py Vienna --loud --loud-out=tools/work/v83/loud                 # §4 (writes only the .loud.json)
```
Outputs kept: `tools/work/v83/{ruler_a,prov,laneoff,drift,barfold,nov,hand-high,hand-lowmid,dropcheck,novelty-bar}.txt`.

## 8. Not measured, and why

- **Hearing** (step 1): the user's; nothing was played.
- `drums-node.js --perc` was not used as a fold: `--perc` is a knob set for a second ears instance (`rise/base/lag/thrK…`), not
  a fold; the fold is `v83-drift.py` / `v72/laneoff.py` on the plain trace, which is the page's lanes.
- The ears' lanes are 60 Hz-frame-quantised, so ruler (b) is the coarsest (±8 ms per event); the mean over 500–1000 events is
  what is quoted.
- Malicious's `drops` (148.317 vs 150.036) is a one-bar question the drop-neighbourhood rise raises; the click render that
  settles it (140–160 s) was not made because the brief said not to regenerate WAVs.
- WhoLikesToParty: provenance only (not in scope); its bar line is still "NOT verified" per the gridcheck docstring.
- SeeYouDrop's 0.02 BPM walk is below every ruler's resolution here; a hand re-fit would need the §72 `refit_grid` path.
