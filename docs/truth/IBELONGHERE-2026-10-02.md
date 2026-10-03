# IBelongHere (Set Mo feat. Woodes) — import, the grid, and DUST's sync at 0:10 / 0:47 / 1:04 (2026-10-02, one worker, headless)

The user: "I just added another track to the test collection … this one has more vocals; noticed on dust it feels like the beat is out of
sync (at ~10s in, ~47s in, ~1m04s in as example)". This doc is the import (NEXT-SESSION-PROMPT / HARNESS recipe), the four-way grid
validation (NEXT-SESSION-PROMPT "Validating a truth grid" steps 2–4; step 1 is the user's, the WAVs are in `~/Music/RetinaRave-clicks/`),
and the diagnosis of the three times on the deterministic file path. **Nothing under `assets/` was edited**; the fixes are proposed.
Scripts: `tools/truth/{trackmap,gridcheck,clicktrack,kicktruth,snaretruth,v83-hand,v83-drift,v83-barfold,v83-nov,key-truth}.py`,
`tools/truth/key-ears.mjs`, `tools/work/v72/ruler_a.py`, `tools/{drums-node,clock-study,dust-trace}.js`, `tools/work/v85/nudge85.py`
(`COL=d_spin`); the one-off folds are described inline. Outputs in `tools/work/v86/` (git-ignored); the montage copied to `docs/truth/v83/`.

Conventions as in `GRID-VALIDATION-2026-10-02.md`: an offset is attack minus grid line, ms, **positive = the line is EARLY of the music**;
a clock's lag is its beat line minus the truth beat, **positive = the clock is LATE**. ±5 ms = the three rulers agree; ±30 ms = a clock is
"within"; the user's eye reads ~40 ms (memory `feedback_display_lead`).

## 0. Import — what is where

- `~/Music/RetinaRave/IBelongHere.flac` (44.1 kHz stereo, 232.9 s; 28.4 MB). The library keeps SHORT names, not the originals
  (`SeeYouDrop.flac`, `Vienna.flac`, `Comptine.flac`), so the Downloads file was copied under `IBelongHere`. Not in the repo.
- `python3 tools/truth/trackmap.py IBelongHere --pcm --sr=48000` (allowed once: no truth dir yet) → `tools/truth/IBelongHere.json` (1.0 MB),
  `tools/truth/IBelongHere/grain-{8,5,3,2,1,0.569,0.224,beat,bar,4bar}.txt` (the seven time grains + the three beat-synchronous ones),
  `tools/work/IBelongHere.{f32,48000.f32,48000.st.f32}` (+ `.json`; git-ignored). Then `kicktruth.py` → `.kick.json` (553 kicks, 2.37/s,
  p50 rise 13.5 dB, beat-slots [297 37 171 48]), `snaretruth.py` → `.snare.json` (602, 2.58/s), `trackmap.py --loud` → `.loud.json`.
- `tools/truth/others-brief.txt` (the `--brief` line), `tools/test_ears.js` KEY_TRACKS (a sixth row, `expect: false`, §1 below),
  HARNESS "Hearing a truth grid". Click WAVs: `~/Music/RetinaRave-clicks/IBelongHere-click.wav`, `IBelongHere-bar-line-only.wav` (§6).

## 1. The track

| fact | value |
|---|---|
| length | 232.9 s (233.1 at the loudness ruler's framing) |
| tempo | **118.00 BPM, dead constant.** The tool's onset lists fold best at 118.004 (low, R 0.48) / 118.008 (click, R 0.56) / 118.03 (mid); the engine's PCM clock reads 118.03 once locked; `bpm_grid.bpm` **117.4538 is the DP list's hop-median** (gaps 43/44/45 hops of 11.61 ms: 91 / 347 / 13 of 457) — the same artefact as Malicious's §72 `tempo_note` (139.67 → 140.00). The `beats` list itself FOLLOWS the audio (§3), so the number is cosmetic for every reader that uses `beats`, and wrong for `gridcheck.py`'s "tempo ±1 BPM" row (it reports the clocks "off 33 %" against 117.46 while they sit on 118.0). |
| grid provenance | `gridcheck.py IBelongHere`: **tool**, dp_residual 169.8 ms, `dp_t0 yes` (§72's t0 applied), `!! beat phase never placed on the audio` → the DP list was kept, t0-corrected. §3 places it. |
| bar line | `downbeat_mod4 3`; **confirmed** (§3): the 40–150 Hz rise is 21.1 dB on the grid's beat 1 vs 9.6 / 10.4 / 13.1 on 2/3/4 (groove 1), 22.4 vs 10.3 / 11.6 / 16.0 (groove 2); all four tool drops are bar-beat 1 and 96 / 128 / 96 beats apart (8-bar phrases from the first kick bar). |
| sections (tool, bar-synchronous) | intro **1.64–15.88** (no drums: sub 0 %, bass 3–6 %, mid 35–83 %, YIN unvoiced — a sung / pad opening), groove **15.88–50.46**, breakdown **50.46–64.69** (sub 6 %, a D pedal), drop **64.69–113.51**, breakdown 113.51–129.78, drop 129.78–144.01, long break **144.01–178.85** (drumless, pad), drop 178.85–209.35 (the loudest, −6.63 LKFS), outro 209.35–231.78. |
| drops (tool, bar-pinned) | 15.882 (the kick's entry; +5.36 LU, ×3.44), **64.691** (+3.98 LU, ×2.50), 129.776 (+4.48, ×2.81), 178.852 (+7.97, ×6.26). No `drops_user` yet — the user has not named one. |
| loudness | integrated −9.19 LKFS; short-term p10 / p50 / p95 −14.22 / −9.20 / −6.43 (range 7.78 LU). |
| bass | A1 54.8 Hz held 49 % of the loud half (sub 34 %, bass 30 %); sub note runs alternate A1 / A#1 (a semitone wobble on the pedal); 106 sub slides. |
| key | **A minor by the independent ruler, D minor by the KK readers — a FIFTH pair, the user's ear decides.** `key-truth.py`: KS mid+bass Am +0.598 / Dm +0.582 (margin 0.017), bass tonic A 51 % → "confirmed-by-bass"; the grooves 15.9–50.5 and 64.7–113.5 Am CONFIRMED (bass A 49 / 48 %), the breakdown 50.5–64.7 **Dm CONFIRMED** (bass D 46 %), 144–179 F major / split. `trackmap.py` whole-track KK: Dm +0.760 (conf 0.178). The ears (`key-ears.mjs`): **Dm 80 % of frames 20–100 s** (Am 1093 vs Dm 687 frames in 20–50, Dm everywhere after), tonicConf p50 **0.13** — under the §84 shade gate 0.3, so `modeShade` stays shut; synapse's key Am 100 %, keyConf 0.97 (its saturated scale). The KEY_TRACKS row records truth = Am (pc 9, minor) with `expect: false` (the ears' Dm is the known read) until the ear speaks: the cue is the bass under the drop at 1:04.7 — if home is the A, Am. |

### The vocal curve (the user: "this one has more vocals")

Method (one-off, `tools/work/v86/vocal2.npy`): a 4096/1024 STFT of the 44.1 kHz mono dump, HPSS-lite (median 17 along time = harmonic,
17 along frequency = percussive, soft mask), **`hshare` = the harmonic energy in 200–4000 Hz as a share of ALL energy** per second, plus
a lead-voice salience (harmonic-sum over f0 150–700 Hz on the harmonic part). The salience did not separate a voice from a pad on this
material (0.18–0.32 everywhere), so the curve that is reported is `hshare` — **sung-or-held mid-band content**, which the ear must split
into voice and pad; the per-second peaks inside the grooves are the vocal phrases (a pad does not come and go in 1–2 s).

| window | hshare mean | reading |
|---|---|---|
| intro 1.6–15.9 | **0.75** (100 % of seconds > 0.35) | sung / pad opening, no drums; centroid 300–550 Hz, h/f 3–78 |
| groove 15.9–50.5 | 0.25 (11 %) | bumps 0.52 @ 32 s, 0.47 @ 39 s, 0.33 → **0.59 @ 49–50 s** (the vocal lead-in to the breakdown) |
| breakdown 50.5–64.7 | **0.52** (100 %) | sung breakdown over a D pedal; 0.55–0.69 over 58–64 s |
| drop 64.7–113.5 | 0.26 (12 %) | bumps 0.48 @ 74 s, 0.93 h/f @ 95 s |
| breakdown 113.5–129.8 | 0.52 (94 %) | the second sung breakdown |
| drop 129.8–144.0 | 0.26 (7 %) | — |
| break 144.0–178.9 | 0.70 (97 %) | pad / sung, drumless |
| drop 178.9–209.4 | 0.28 (3 %) | — |
| outro 209.4–231.8 | 0.75 (86 %) | — |

**47 % of the track's seconds are harmonic-mid-dominant** (the five tracks' grooves sit at 0.1–0.3). The three times the user named are
all inside or at the edge of sung material: 0:10 in the sung intro, 0:47 two bars before the vocal lead-in (hshare 0.11 → 0.59 over
48–50 s), 1:04 at the end of the sung breakdown. That is not a coincidence (§4).

## 2. Provenance, the hand montage

`docs/truth/v83/hand-IBelongHere.png` (lane high 5–12 kHz, 16 marks from 185 on-beat candidates): **t20 median −2.0 ms, implied
correction +0.1 ms** (CAL −2.1), sd 10.9; 14 of 16 attacks start on the black line; the two misses are low-snr panels (beat 246 snr 9
−14.6 ms; beat 443 snr 2 in the outro, no transient). Mid lane: see the ruler-(a) row. **On the line.**

## 3. The three automatic rulers, the drift, the bar line

| ruler | value | |
|---|---|---|
| (a) `ruler_a.py` zero-phase bands, med | **−2.2 all bands**; 25–60 +36.6 (the sub pedal's slow rise, not a transient), 40–150 +7.2, 150–800 −3.5, 0.8–2.5 k −6.0, 5–12 k −2.2 | the `+t0` column is the pre-§72 reading and does not apply (`dp_t0 yes`) |
| (b) ears' lanes folded on the grid (`v83-drift.py`, vel-weighted mean) | **+1.6 all** (kick +5.9 n 160, snare −0.2 n 293, hat +0.7 n 291) | the kick's +4…+8 is the §71 band profile, as on SeeYouDrop |
| (c) the tool's own onset lists vs its beats (`v83-drift.py` per 20 s slice) | low +0.3 +0.4 +5.8 +0.2 +0.4 +0.3 +0.2 +11.3 +0.1 +5.7 +5.9 · click the same · mid 0.0 ±0.1 · high ±0.4 | **+0.3 median**; the two +11 cells are the DP's hop steps |
| spread (a,b,c) | 3.8 ms | **agree → the beat phase is on the audio**; no §72 t0 class offset |
| drift | slopes +0.025 / +0.015 / +0.0006 / −0.0018 ms/s → bpm corr −0.003…+0.0002 | **none** (the DP list rides the audio; the only "drift" is `bpm_grid.bpm`'s label, §1) |
| half-beat (§59) | the attacks fold on the grid's own beat (offsets 0–7 ms, not ~P/2 = 255 ms) | none |
| bar line (`v83-barfold.py` + the rise fold) | ears kick 31 / 12 / 39 / 19 % on 1/2/3/4 (vel-weighted 33 / 11 / 39 / 17), ears low 24 / 29 / 25 / 21, tool low 23 / 29 / 24 / 24 — a four-on-the-floor with the ears' kick lane on 1 and 3; **40–150 Hz RISE per beat-of-bar 21.1 / 9.6 / 10.4 / 13.1 dB** (groove 1), 22.4 / 10.3 / 11.6 / 16.0 (groove 2); full-band energy per beat mod 16 peaks at the grid's 1 (1.00, next 0.91 / 0.90); the drops 15.882 / 64.691 / 129.776 / 178.852 = beats 31 / 127 / 255 / 351 = all bar-beat 1, **96 / 128 / 96 beats apart**; `v83-nov.py` 2-bar peaks 7 / 7 / 4 / 0 on 1/2/3/4 (the 16.39 peak is the first kick, one beat after the bar line — a pickup; 50.39 and 178.89 on 1), 4-bar 3 / 3 / 1 / 1 | **confirmed by the kick weight and the phrase arithmetic**; the novelty is split 1/2 because the first kick of the groove is on beat 2 (16.393, 21.6 dB) and the heavy one on the next 1 (17.914, 36.0 dB) |

Verdict: **beat phase right (±4 ms), tempo 118.00 (the label 117.45 is the hop-median), bar line right.** Proposed json edits (after the
user has listened, §6): `bpm_grid.tempo_note: "118.00 BPM — the onset lists fold at 118.004 / 118.008 (R 0.48 / 0.56), the PCM clock reads
118.03; bpm 117.4538 is the DP list's hop-median (§72's Malicious case)"`; `bpm_grid.hand: { anchor: "hand", date: <the day the user
listened>, validation: "docs/truth/IBELONGHERE-2026-10-02.md" }`. No number in `beats` / `downbeats` moves.

## 4. DUST's sync at 0:10, 0:47, 1:04

Setup: `PORT=8891 WARM=0 node tools/dust-trace.js IBelongHere 0 75 tools/work/v86/dust-ibh-0-75.json 1` (scene 1, `&map=0`, CLOCK=1,
the file path the user watches on 8765; 4500 frames, CARD.ERRS 0; the tree = main at 5191d8a — DUST's s1 md5 is byte-identical to
v0.29 by §85/§86's receipts, so this is the deployed DUST), beside `tools/clock-study.js IBelongHere` (node, no display lead) and
`tools/drums-node.js IBelongHere` (the ears). DUST rides the PCM clock by default (v0.20); `bpm` in the trace = `bpmPcm`.

### (a) The clocks on the truth grid (beat lines vs the nearest truth beat; + = late)

| window (s) | PCM clock, node (`clock-study`) | PCM clock as DUST saw it (page, file mode) | v3 (not read by DUST) |
|---|---|---|---|
| 0–5 | +41 med, sd 48, bpm 122.7, conf 0.09 | +1.5, sd 47 | −114 |
| 5–10 | −47 med, sd 121, **bpm 129.8**, conf 0.35 | −72, sd 142 | +159 |
| **10–16** | **−113 med, sd 135, p90 242, within ±30 ms 23 %, bpm 136.3 (157.6 from 9.0 to 12.5 s), conf 0.82** | +123, sd 147 | +21, sd 114 |
| 16–26 | −1.0, sd 4.5, **100 % within**, bpm 118.04, conf 0.93 | −41.5, sd 4.6 (= the 40 ms file lead, §52) | −13 |
| 26–36 / 36–42 | −4.3 / +4.1, sd 5 | −45 / −36 | −13 / −10 |
| **42–52** | **+1.5 med, sd 3.7, p90 6.6, 100 % within, 118.01, conf 0.92** | **−38.4, sd 3.6** (the lead) | −120 |
| 52–59 | +7.3, sd 11, conf 0.86 | −33 | +149 |
| **59–65** | **+21.2 med, sd 11, p90 36, 75 % within, 117.92, conf 0.87** | **−19.9, sd 11, p90 33** (half the lead gone) | +161 |
| 65–69 | −1.2, sd 4 (the drop re-seats it: −22 ms inside one beat) | −42 | +145 |
| 69–75 | +0.6, sd 3.5 | −40 | −7 |

Lock (first 8 consecutive lines within ±30 ms): **15.38 s** (v3: 14.38). The clock's first confident tempo is **157.6 BPM from 9.0 to
12.5 s** — it is NOT an octave of 118 (4/3 of it: 0.381 s = three 16ths); `pcmY1` (the comb's own strength) reads 0.18–0.30 there against
0.32 → 0.75 once the real lock forms (13–16.5 s), and 0.03–0.11 through the sung breakdown 56–64 s — while `clockConfPcm` reads 0.77–0.80
at the wrong tempo and 0.82–0.89 in the breakdown: **the confidence does not see the comb strength.** `pcmSd` likewise (0.05 → 0.03 → 0.04).

### (b) The nudge, the voices, the ears (`dust-trace` + `drums-node`)

The §61 velocity profile on `d_spin` (nudge85.py, 0–75 s): crest **−8.3 ms** of the clock's beat line (±10 ✓), floor/peak 15.7 %, dead
0 %, 25/50/90 % +0/+250/+583 ms, max |a| p50 17.2 — the receipts' shape. Per window, the crest against the TRUTH beat: 5–15 s **p10 −203 /
p90 +229 ms** (the clock, not the profile); 42–52 **−37 med** (p10 −47, p90 −26); 59–69 **−29 med (p10 −47, p90 −7)**; 20–30 −46; 69–75 −37.
In file mode the visuals lead by 40 ms by design, so −37 at 0:47 is the normal picture and −29 with a p90 of −7 at 1:04 is the clock's
+21 ms eating half the lead.

| lane (events / 10 s) | 5–15 s | 42–52 s | 59–69 s | clean grooves 26–36 / 70–80 |
|---|---|---|---|---|
| ears `kickEvt` — n, on-beat, OFF any 16th | 5, 60 %, 20 % (6.03 8.77 9.78 12.32 13.10: no kick in the music) | 9, **100 %**, 0 % | 10, 60 %, 0 % | 15 / 21, 73 / 71 %, 7 / 0 % |
| truth kicks hit by `kickEvt` (±60 ms) | — | **11 of 26 = 42 %** | **9 of 21 = 43 %** | 21 of 31 = 68 % |
| truth kicks hit by the ears' LOW lane (`lowEvt`, the 60–150 Hz rise) | — | **24 of 26 = 92 %** (FP 4 of 29) | 17 of 21 = 81 % (FP 1) | 90 % |
| ears `snareEvt` — n, on-beat, OFF any 16th | 13, 62 %, 0 % | 30, 47 %, **10 %** (42.15 43.77 **47.62**) | 29, 45 %, **17 %** (60.15 60.92 61.17 62.97 64.90) | 27 / 35, 70 / 57 %, 7 / 3 % |
| ears `hatEvt` — n, on-beat, OFF | 34, 38 %, 3 % | 36, 25 %, **17 %** (42.27 42.92 43.55 **49.25 49.50 49.65**) | 26, 35 %, **23 %** (60.42 62.37 62.48 63.73 66.9 68.95) | 44 / 33, 27 / 52 %, 14 / 9 % |
| DUST `d_fK` flashes — n, on-beat, OFF | 10, 40 %, 20 % | 17, 76 %, 0 % | 16, 69 %, 0 % | — |
| DUST `d_fS` / `d_fH` flashes — n, OFF | 13 / 18, 0 / 6 % | 30 / 39, 10 / 13 % | 29 / 18, 17 / 22 % | — |

`drumcheck.py` whole track: ears kick vs `kick` P 0.89 **R 0.40** (vs `click` R 0.54), snare 0.69 / 0.70, hat 0.72 / 0.79. The truth kick
list in 42–49 s is a syncopated four-on-the-floor (kicks on every beat plus 43.60 44.73 45.63 47.66 48.17 48.81 on the "and"); `kickEvt`
fires on 9 of the 17 beat kicks (43.35 → 48.43) and on none of the "and" kicks, and nothing from 48.43 to the breakdown. The mechanism is
`engine/ears/perc.js`: a low onset is a kick only with a 2.5–8 kHz click within `CLICK_W` 25 ms (line 308); a bare one is an 808 note start
(line 312). **This kick is a soft deep-house kick under a held A1 pedal: half of it has no beater click inside 25 ms**, so the low lane hears
92 % of the kicks and the kick lane 42 %. (The `--perc rise=` sweep reaches only the low stream in node — `lowEvt` 92 → 96 % at rise 4
with FP 4 → 6 of 33; `kickEvt` is the first ears instance and unreachable by that switch.)

### (c) The tempo estimator in the three windows

`bpmPcm`: 9.0–12.5 s **157.6** (then 118.1 from 12.5 s, 118.0 ±0.1 for the rest); 42–52 **118.01 ±0.05**, no lattice move, no wobble;
52–65 **117.80–117.92** (a −0.1 BPM lean while the comb strength is 0.03–0.11), 118.1 again from 63 s. No octave flip, no re-phase at 47 or
64 s; `beatCountPcm` has no jump in 0–75. `bpmSyn` is absent from the node trace (synapse's clock is not what DUST reads).

### (d) The §72 t0 class

None: the three rulers agree at −2.2 / +1.6 / +0.3 ms and `dp_t0 yes`. The grid is not the cause of any of the three.

### The one cause per time

| time | what the user sees | the ONE cause, with its number | smallest fix (proposed, not built) |
|---|---|---|---|
| **0:10** | DUST's wedge turning at the wrong rate, the kick pulse on syllables | **The PCM clock holds 157.6 BPM (4/3 of 118) with conf 0.77–0.80 from 9.0 to 12.5 s** on the intro's shaker 8ths / 16ths (the pcm onsets 9.8–16.4 s are 0.25 s apart; its lag med −113 ms, p90 242, 23 % within ±30; the §61 crest ±200 ms of the truth beat). The lock forms at 15.38 s on the 8ths that start at 12.5 s, before the first kick (16.39). The switch is `period.js` `estimate()`'s unrelated-tempo branch: `need = !rel ? 2` votes (1 s) while `alive` is false — the cold prior 124 is never "alive", so the first clear comb lag takes the clock. This is the known warm-up class (OPEN-ITEMS "SeeYouDrop's PCM lock 9.2 → 12.0 s", §56/§69), but a 4:3 lattice the §59 half-beat check cannot see. Secondary: `kickEvt` 5 fires on vocal low onsets (6.03–13.10) with no kick in the music → DUST's fold-depth pulse on syllables. | `assets/engine/clock/period.js` `estimate()`: gate the unrelated switch on the comb's own strength — `need = !rel ? (y1 >= 0.3 ? 2 : 1e9)` (the wrong lock read y1 0.18–0.30, the right one 0.32 → 0.75); receipt = the 157.6 plateau gone, lock ≤ 15.4 s, the five tracks' `clock-study` columns byte-identical. Cheaper and scene-side: publish `clockConfPcm × min(1, y1 / 0.3)` in `features-clock.js` and let DUST's nudge amplitude (`beatgrid.js` `mkSpin`) ride `clockConf` — no scene reads it today. What the user will see unchanged: nothing beat-locked before the first bar of the shaker (12.5 s); that is the warm-up and is expected. |
| **0:47** | the kick pulse skipping beats, flashes on consonants | **Not the clock: +1.5 ms, sd 3.7, 100 % within, 118.01 BPM; the nudge crest −8.3 ms of the line.** The cause is the ears' kick lane: **`kickEvt` hits 11 of 26 truth kicks (42 %) in 40–52 s while the low lane hits 24 of 26 (92 %)** — the beater-click gate (`perc.js` `CLICK_W` 25 ms, line 308) classes the soft kicks as bare 808s, so DUST's kick voice fires on 9 beats of 17 and on none of the syncopated "and" kicks, then drops out from 48.43 s into the breakdown while the snare voice fires 3/s with 10 % off any 16th (47.62) and the hat voice 13 % off (49.25 / 49.50 / 49.65 = the vocal lead-in, hshare 0.11 → 0.59). | `assets/engine/ears/perc.js` kick lane: accept a clickless low onset as a kick when it lands on the clock's beat line (|beatPhasePcm| < 0.08 beat and `clockConfPcm` ≥ 0.75) — the ears already carry the clock's phase for `KICK_LAG`; or lower `CLICK_FLOOR` 1.0 / widen `CLICK_W` 25 → 35 ms and re-grade the five tracks' `drumcheck.py` rows (§68's bare-808 rate 6.0 % is the guard). Receipt: `kickEvt` R 0.40 → ≥ 0.7 on IBelongHere with P ≥ 0.85, SeeYouDrop / Vienna rows unchanged within 0.02 F. |
| **1:04** | the beat line sliding late through the breakdown, a snap at the drop | **The PCM clock is +21 ms late (median; p90 36, 75 % within) over 59–65 s and re-seats by −22 ms inside one beat at the drop 64.691** — the breakdown has no kick (`pcmY1` 0.03–0.11), the clock follows the vocal / hat onsets (snare lane 17 % off any 16th: 60.15 60.92 61.17 62.97 64.90; hat 23 %) with its confidence still 0.82–0.89. In file mode that eats half the 40 ms lead (the page's crest −29 med, p90 −7 ms vs the truth beat) and the drop's snap is the jerk. Secondary: `kickEvt` 43 % of the truth kicks in 59–69 (the breakdown's soft kick from 62.67 s), the snare / hat voices on consonants. | `assets/engine/clock/clock.js` `CLOCK.R_CLS` [1, 1.5, 3] → **[1, 3, 6]** (the snare / hat onset variance): measured in node with the knob (`CLOCKK='{"R_CLS":[1,3,6]}' node tools/clock-study.js IBelongHere`): 59–65 s **+21 → +12 ms median, p90 36 → 30, within 75 → 92 %**, the grooves untouched (42–52 +0.8 sd 3.8, 16–26 −1.1, 69–75 +1.0), lock 15.38 unchanged; the five tracks' columns must be re-run before it moves (not done here). The better-shaped fix is the same variance scaled by `1 / max(y1, 0.1)` so a kick-less passage holds the phase and lets only the tempo ride. |

The common factor the user heard: **all three windows are sung** (§1's curve) — the clock and the voices are fed by vocal onsets where the
kick is absent (0:10, 1:04) or classed as an 808 (0:47). Vocals were never a case in DECISIONS (one mention, §19's "snare-and-vocal
lane"); this track is the first in the set with a sung intro and sung breakdowns.

## 5. What was not measured

- The user's ear on the grid (step 1) — the WAVs below; and on the key (Am vs Dm).
- A page-side A/B of the two proposed engine fixes (the engine is in use by the MANDALA worker; `R_CLS` was A/B'd in node only, the
  `period.js` gate and the kick-lane rule not at all).
- `tools/test_ears.js` could not run to its key rulers here: it dies before them on a missing `tools/work/SeeYouDrop.st.f32.json`
  (the five tracks' native-rate stereo dumps are absent from this checkout and `--pcm` on them is forbidden). The new row's logic was
  checked against `key-ears.mjs`'s node read (ears Dm over 20–100 s ≠ truth Am → `expect: false` holds).
- Voice vs pad inside the harmonic-mid curve (the salience ruler did not separate them); the ear does.

## 6. What the user must listen for (`~/Music/RetinaRave-clicks/`, both WAVs = track 0:00–1:15)

- `! paplay ~/Music/RetinaRave-clicks/IBelongHere-click.wav` — a click on every beat, the downbeat lower and louder, a long low click
  on each tool drop (0:15.9, 1:04.7) and a double-click at each section start. **0:10**: the clicks run through the sung intro with no drum
  under them — count whether they feel like the song's pulse (118) or too fast / too slow; the engine's clock here ran at 158.
  **0:47**: every click should land on a kick with no flam (the grid is on the audio by three rulers); if the kicks feel like they
  skip, that is the music's syncopation, not the clicks. **1:04**: the clicks through the sung breakdown, then the long low click ON
  the first kick of the drop at 1:04.7 — a flam there = a phase we did not measure.
- `! paplay ~/Music/RetinaRave-clicks/IBelongHere-bar-line-only.wav` — one click per bar (the grid's "1"). From 0:16 the accent
  should sit on the heavy kick of each bar (the first kick at 0:16.4 is a pickup; the accent is the next one at 0:17.9); at 1:04.7 it
  should be the drop's first kick. If it sits one beat late or early, the bar line is off by one (it is not, by the kick weight).

## The user's ear, 2026-10-02 evening (the orchestrator)
`~/Music/RetinaRave-clicks/IBelongHere-click.wav` (0–75 s, every beat, downbeat accented, drops + sections) — the user: **"good"**.
The grid is confirmed by ear across all three disputed times (0:10, 0:47, 1:04.7), so the DUST sync complaint is the engine's —
the three fixes above (period.js cold gate, perc.js click gate, clock.js R_CLS) are being built as DECISIONS §90. `IBelongHere.json`:
`bpm_grid.hand.anchor: hand` 2026-10-02, `checked`, `tempo_note` 118.00, a `notes` entry. Still for the ear: the key (Am vs the ears' Dm).
