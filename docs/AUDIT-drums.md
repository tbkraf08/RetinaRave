# AUDIT — the reactive drums v2 (`kick2` / `snare2` / `hat2`, 2026-09-28)

**Why.** After the live step 3 warm-up the user watched the TORUS2 A/B again: *"I think the reactive still looks better (ie.
seems like it moves in sync with the music better)"*, then "do #1" — improve the reactive path itself. The reactive look is
synapse's `kick` / `snare` / `hat` levels (spectral-flux peaks per band, the level's peak = the hit's strength, decaying
0.16 / 0.13 / 0.06 s), read by TORUS2, DUST, MANDALA. v2 is **additive**: new levels of the same shape, taken by route.
(The plan's "step 4 — build detector v2" is a build-up / drop detector, a different thing; not this.)

## The ruler

`tools/truth/drumcheck.py` grades each reactive channel against the truth onsets: the kick against `low` (every 40–150 Hz
percussive onset — kicks AND 808 note starts, what the eye sees the low end do) and `click` (kicks with a beater), snare vs
`mid`, hat vs `high`; a level's hit = its rising edge (compare.py `riseframes`: ≥ 0.18, +0.06 — what shows). `tools/drums-node.js`
streams a track's PCM through synapse's Analyzer and the ears exactly as the page does in det mode (page = node: `kick2`
identical on all 9444 SeeYouDrop frames, max diff 0.0096) — 3.5 s per track instead of a 2.5 min page run.

## What it measured (det, the live path `&map=0`)

| F (P) | synapse kick | ears `kickEvt` (beater) | ears LOW onsets |
|---|---|---|---|
| SeeYouDrop vs low | 0.30 (0.25) — 741 hits for 504 onsets | 0.41 (0.70) | **0.49 (0.49)** |
| CyborgNinja | 0.44 (0.42) | 0.72 (0.90) | **0.77 (0.84)** |
| WhoLikesToParty | 0.54 (0.58) | 0.67 (0.95) | **0.79 (0.90)** |
| Malicious (no stable kicks) | 0.32 (0.27) | 0.13 (0.35) | 0.29 (0.29) |

Synapse's kick fires on any rise of 30–180 Hz energy (bass movement too): in SeeYouDrop's drumless walk and outro 70–75
hits per 16 s against 14–27 truth onsets. The ears' low onsets (a causal HPSS-lite, the kick band's percussive residual) are
the truth's own definition, measured causally — and the ears already computed them (`perc.js` type `low`) and dropped them.
Their thresholds are at a plateau (thrK 2–3.5, floors, refractory, gate: mean F ±0.01). Snare and hat: synapse's are better
than the ears' on 3 of 4 tracks (snare F 0.88 / 0.80 / 0.51 vs 0.72 / 0.70 / 0.29) — kept.

**Strength.** The ears' velocity saturates (v2 kick peaks p50 1.0 — the predicted route's uniform brightness again). v2's kick
strength = the onset's raw flux ranked among the last 64 low onsets, `0.2 + 0.8·rank^2.5`, × synapse's own bass loudness
`0.5 + 0.5·bass.n`; a prior of 8 median hits at a cold start. Peaks p25 / p50 / p75 / p90 0.19 / 0.30 / 0.51 / 0.72 against
synapse's 0.23 / 0.32 / 0.48 / 0.60 (the four tracks' mean).

**Timing.** In file modes synapse sees the audio 43 ms before it is heard and confirms an onset ~31 ms after its audio: its
hits lit up 6–12 ms EARLY (det and real-time file alike, the lead −43 ms in both). v2 holds each synapse hit to the frame
nearest its heard time: +5…+10 ms (one 60 Hz frame of quantisation; late is the side the eye forgives). The low onsets are
released on their heard time by the ears' own rule: +2…+7 ms. In capture nothing is held (the audio arrives after it is heard).

## Result (`kick2` / `snare2` / `hat2`)

| | kick F (P) vs low · lag | snare F · lag | hat F · lag |
|---|---|---|---|
| SeeYouDrop det | **0.49 (0.55)** vs 0.30 (0.25) · +4 vs −11 | 0.63 = · +5 vs −12 | 0.75 = · +5 vs −11 |
| CyborgNinja det | **0.78 (0.99)** vs 0.44 (0.42) · +7 vs −5 | 0.88 = · +10 vs −7 | 0.98 = · +9 vs −7 |
| WhoLikesToParty det | **0.67 (0.97)** vs 0.54 (0.58) · +7 vs −6 | 0.79 vs 0.80 · +10 vs −6 | 0.89 = · +10 vs −7 |
| Malicious det | 0.26 (0.31) vs 0.32 (0.27) | 0.50 vs 0.51 | 0.86 vs 0.87 |
| SeeYouDrop real-time file | **0.55 (0.62)** vs 0.31 (0.26) · +5 vs −14 | 0.65 vs 0.64 · +5 vs −11 | 0.74 vs 0.75 · +5 vs −11 |
| **SeeYouDrop capture** (24–74 s, audible), each source's lag removed | **0.54 (0.80)** at +50 ms, chance 0.15 | 0.64 = at +45 | 0.74 = at +40 |
| … synapse kick in capture | 0.39 (0.40) at +45 ms, chance 0.29 | | |

Every reactive channel is +40…+50 ms late in capture (the capture lag + detection); that is under what the eye reads as
out of sync for a picture trailing its sound, and no reactive detector can beat it.
Proofs: `check.js` 0 fail, `npm test` (+ `tools/test_drums.js`), the 32-field whole-track det trace `cmp`-identical to the
pre-change tree (no existing MS value moved), the bundle from `file://` clean, the TORUS2 route live.

## Open

- Malicious: neither detector finds its kicks (109 clicks among 681 low onsets); v2 is slightly worse there.
- SeeYouDrop's 808 note starts: 188 of v2's 262 misses are bare 808s (a glide or a sub below the 40 Hz band edge).
- **TORUS2 reads v2 by default since 2026-09-29** (the user: "v2 looks good" → "default on TORUS2 only"); every other scene
  keeps synapse's `kick` / `snare` / `hat`. TORUS2's old look: `&route=torus2.kick2=kick,torus2.snare2=snare,torus2.hat2=hat`.
  The TORUS2 md5s are unchanged (7189a6ba / 48113eda: on the fake timeline v2 mirrors synapse).

---

## §68 — the low lane is a 60–150 Hz RISE (2026-10-01, DECISIONS §68, commit `fbc57ae`)

**Why.** §51 built the kick on "the ears' low onsets" because they were "the truth's own `low` definition computed
causally". On Vienna that definition is the bug: the track's low end is a continuous **D♯1 / F♯1 808 drone with no
pulse** and a soft thud above it, so a 40–150 Hz band whose high-pass is 3 dB down at 40 Hz *is the drone*, and
`kick2`'s AUC against the kick lines came out **0.316 — below chance** (§66 Q1), peaking 200 ms late. The truth's own
`low` list shares the blindness: it reads **2.46 onsets/s where the groove has 1.74 kicks/s**.

**The change** (`assets/engine/ears/perc.js`, the only engine file). `BANDS[2]` **40–150 → 60–150 Hz** (band 2 is the
lane's own; `map.js` already left it out of every energy sum) and the onset function from `flux = res[i] − res[i−1]`
on a median-9 residual to the band's **RISE over a short local baseline**: `rise = dB[i] − mean(dB[i−1 … i−8])`,
rectified, against an **absolute 5.0 dB floor with no adaptive term**, the same 85 ms refractory — now applied to the
LANE (`lastLow`; `last[0]` is set only in `emit()`, so a bare 808 never reached it) — and the lane's own
`KICK_LAG` 0.012 s. Snare and hat keep the HPSS-lite flux untouched.

Each piece was swept and sits on a plateau: floor 4.5 / 5.0 / 5.5 / 6.0 dB → mean F .594 / **.605** / .604 / .596 ·
baseline 7 / 8 / 9 hops → .589 / **.605** / .600 · 60–150 Hz against 40–150 .570, 70–150 .595, 60–120 .571. An
adaptive `fm + 3·fd` term on the rise costs CyborgNinja **R 0.96 → 0.53** — a rise is a RATIO, so one dB floor
travels and an adaptive one does not.

**AUC against the kick truth**, old lane → the new one: SeeYouDrop 0.653 → **0.816** · CyborgNinja 0.954 → **0.997** ·
WhoLikesToParty 0.790 → **0.892** · Malicious 0.522 → **0.811** · **Vienna 0.511 → 0.713**. The band alone buys
Vienna 0.666 and the onset function alone 0.600, so neither half is the fix. §66's 0.999 was a zero-phase
`sosfiltfilt` measurement of the statistic that DEFINES the truth and is not a causal target; a finer hop (256 / 128
/ 64) buys 0.02 and was rejected.

**Result** (`tools/drums-node.js` + `tools/truth/drumcheck.py`, whole track, `kick2` F):

| | vs `low` | vs `click` | vs `kick` (new) |
|---|---|---|---|
| SeeYouDrop | 0.49 → **0.54** | 0.46 → **0.48** | 0.40 → **0.53** |
| CyborgNinja | 0.78 → **0.83** | 0.79 → **0.84** | 0.84 → **0.90** |
| WhoLikesToParty | 0.67 → **0.72** | 0.74 → **0.78** | 0.71 → **0.78** |
| Malicious | 0.26 → **0.32** | 0.10 → **0.13** | 0.23 → **0.39** |
| **Vienna** | 0.26 → 0.23 | **0.08 → 0.30** | **0.19 → 0.42** |

14 of 15 rows up; the one that falls is Vienna against the contaminated `low`, where its precision still rises
(0.30 → 0.39). Lag p50 vs `low` **+4 / +5 / +3 / +6 / +4 ms** against the old +4 / +7 / +7 / +2 / +2 — the same mean,
§58's +3/+4 ms preserved. The page's det traces (`&map=0`, 20–110 s) agree: Vienna `kick2` vs `kick` **F 0.16 → 0.51**
(P 0.15 → 0.56), vs `click` 0.11 → **0.41**; CyborgNinja 0.87 → 0.91; WhoLikesToParty 0.70 → 0.77; Malicious 0.21 →
0.38; SeeYouDrop 0.50 → 0.62.

**DUST's kick voice** (`tools/dust-trace.js`, scene 1, `&map=0`, `tools/work/v68/dustkick.py`, ±50 ms): Vienna 24–60 s
**74 fires at P 0.11 / R 0.14 → 54 fires at P 0.72 / R 0.68**, the voice's rate 2.06 → **1.50 /s** against the music's
1.58, and §66's signature inverted — the amp at a MATCHED fire goes 0.323 → **0.458** while the unmatched ones fall
0.374 → 0.292. Control SeeYouDrop 20–110 s is better too: 271 fires at P 0.68 / R 0.54 → **305 at P 0.79 / R 0.70**.

**A fourth kick reference.** `tools/truth/kicktruth.py` writes `tools/truth/<T>.kick.json` — the offline 60–150 Hz
rise at the truth beat grid's 16th lines (`tools/work/v66/kick3.py`'s method off each track's own `beats`) — and
`drumcheck.py` grades `kick` against it beside `low` and `click`. Validated where `click` is trustworthy: CyborgNinja
P 0.99 / R 0.89, WhoLikesToParty 0.82 / 0.66, and §66's Vienna hand-grid list P 0.96 / R 0.92.

**Unmoved:** the whole-track map byte-identical on all five tracks (its `densE` input moved, no drop or section line
did) · §59's lattice jumps and lock times (CyborgNinja +3 → +1 ms, still 17.9 s) · the fake-timeline md5 sweep, 0 of
24 lines, taken as an isolated pair in a worktree of HEAD · cost `Ears.push` 70.36 → 70.92 µs/block (+0.6 %).

### Open after §68

- Malicious still has no stable kicks (§51's own note); the lane doubles its F (0.23 → 0.39 against the kick
  reference) and that is all the track allows.
- SeeYouDrop's BEATER-gated `kick` class loses a little (`ears` vs `click` P 0.71 → 0.66 / R 0.57 → 0.51 on the page):
  its kicks are 808-ish with fundamentals under 60 Hz, which is §51's own "a sub below the 40 Hz band edge" from the
  other side. The LOW lane — what `kick2` and the scenes read — gains there.
- **The snare / rim lane is the same shape and was not built** (DECISIONS §68 "Open"): the same rise on the EXISTING
  150–2500 Hz band takes the snare's mean F against the truth's `mid` from **0.528 → 0.633**, Vienna's P from **0.22
  → 0.76**, at the cost of CyborgNinja's recall 0.61 → 0.51 — one decision, not a measurement.

---

## §69 — the snare lane is the two MID bands' RISE (2026-10-01, DECISIONS §69, commit `e136243`)

**Why.** §51 kept the snare on the HPSS-lite flux because "synapse's are better than the ears' on 3 of 4 tracks".
§64 then found the mechanism that makes that family wrong — *a running median lags a swell* — on the HIGH band, and
§66 found its scene-side cost on the MID one: on Vienna DUST's snare voice fires **4.81 /s against a groove of
1.94 /s at P 0.29**, and §64's own swell veto does not transfer (AUC 0.615). §68 built the same fix for the LOW
lane and measured the snare's, leaving one decision — CyborgNinja's recall — which the user took ("yes").

**The change** (`assets/engine/ears/perc.js`, the only engine file). Class 1 leaves `flux = res9[i] − res9[i−1]`
for `rise = ½·[rect(dB₃[i] − mean₈(dB₃)) + rect(dB₄[i] − mean₈(dB₄))]` over the two EXISTING mid bands — `B_HARM`
150–600 Hz (the body) and `B_SNARE` 150–2500 Hz (the noise) — against an **absolute 3.75 dB floor with no adaptive
term**, `REFRACT[1]` **0.060 → 0.075 s**, and the lane's own `SNARE_LAG` 0.010 s. No new filter: both bands are
already in the bank. The hat keeps the flux; the low lane is untouched.

**Why TWO bands.** The two references disagree about which band to grade on *because each was built on one of them*
— the truth's `mid` is a 150–2500 Hz list and §69's new grid reference a 150–800 Hz one. Mean F over the five
tracks against both, at each candidate's own best floor:

| lane | vs `mid` | vs `snare` | sum |
|---|---|---|---|
| the old flux lane | 0.528 | 0.498 | 1.026 |
| rise on 150–2500 alone | **0.647** | 0.570 | 1.217 |
| rise on 150–600 alone | 0.571 | 0.594 | 1.165 |
| rise on a NEW 150–800 filter | 0.615 | **0.601** | 1.216 |
| **the MEAN of 150–600 and 150–2500** | 0.621 | 0.609 | **1.230** |
| MAX of the two (a union) | 0.586 | 0.589 | 1.176 |
| MIN of the two (a hard AND) | 0.628 | 0.573 | 1.201 |

The mean is the only candidate near the top on both, it needs no new filter, and the weight sweep (0 / .25 / .4 /
.5 / .6 / .75 / 1 on the 150–600 term) plateaus over .25–.6, so plain half-and-half is the centre rather than a fit.
Each knob sits on a plateau too: floor 3.5 / 3.75 / 4.0 / 4.25 dB → sum 1.262 / 1.270 / 1.275 / 1.275, baseline
6 / 7 / 8 / 9 hops → 1.270 / 1.275 / 1.270 / 1.194, refractory 0.060 / 0.070 / 0.075 / 0.085 / 0.100 s → 1.224 /
1.275 / 1.275 / 1.275 / 1.266. 3.75 dB is the end of the floor plateau where CyborgNinja keeps the most recall and
Vienna fires closest to its own rate; 8 hops is `KICK_BASE`, one number for both lanes; 0.075 s is the shortest
refractory on its plateau (0.085 would block a 16th above 176 BPM).

**Result** (`tools/drums-node.js` + `tools/truth/drumcheck.py`, whole track, `snareEvt`):

| | vs `mid` | vs `snare` (new) |
|---|---|---|
| SeeYouDrop | 0.59 → **0.69** (P 0.52→0.63, R 0.69→0.77) | 0.51 → **0.59** |
| CyborgNinja | 0.72 → 0.72 (P 0.92→**0.99**, R 0.59→0.57) | 0.78 → **0.90** (P 0.77→0.94, R 0.79→0.87) |
| WhoLikesToParty | 0.69 → **0.82** (P 0.79→0.82, R 0.62→0.81) | 0.52 → **0.64** |
| Malicious | 0.29 → **0.41** | 0.28 → **0.46** |
| **Vienna** | 0.35 → **0.59** (P 0.24→**0.54**) | 0.32 → **0.53** (P 0.25→0.65) |
| **mean F** | **0.528 → 0.646** | **0.482 → 0.624** |

**10 of 10 rows up or flat.** Lag p50 vs `mid` **+1 / +1 / +1 / +1 / −2 ms** against the old +0 / +2 / +1 / −2 / +1
— the same mean (+0.4 ms), §58's "ears +0" preserved. The page agrees (`&map=0`, 20–110 s): vs `mid` 0.69 → 0.73 ·
0.70 → 0.71 · 0.70 → **0.82** · 0.32 → **0.46** · Vienna 0.42 → **0.72** (P 0.29 → **0.77**); vs `snare` 0.63 →
0.68 · 0.78 → **0.91** · 0.54 → 0.65 · 0.25 → 0.45 · Vienna 0.32 → 0.55.

**CyborgNinja's recall, diagnosed rather than bought back.** The 101 `mid` onsets the new lane drops have a median
two-band rise of **2.46 dB** against the kept ones' 7.56 and a median HAT-band rise of 9.18 against 9.63 — they are
**hats**, which a 150–2500 Hz flux list counts and a mid-band rise rightly does not: **21 %** of them are on the
§69 snare reference against **92 %** of the kept ones, and **97 %** are on the truth's `high` list. A lower floor
does buy the recall back (2.0 dB → R 0.69) and takes **92 % of the lane's fires onto a hat**; at 3.75 dB that
share is 98 % *of fires that are also snares*, and the lane's F against the snare reference goes the other way,
0.78 → **0.90**. So the measured "recall 0.61 → 0.51" the user accepted is really 0.59 → 0.57 here, and it is a
precision gain in disguise. Nothing was added to recover it.

**A fourth snare reference.** `tools/truth/snaretruth.py` writes `tools/truth/<T>.snare.json` — the offline
150–800 Hz rise at the truth beat grid's 16th lines, `kicktruth.py`'s method on the mid band — and `drumcheck.py`
grades `snare` against it beside `mid`. It exists because `mid` is itself a median-residual flux list and on Vienna
reads **1.04 onsets/s where §66's hand-built rim/clap list reads 2.0**. Validated: it reproduces that hand list at
**P 1.00 / R 0.97 at lag +0 ms** (150–600 reads 0.87 / 0.81, 150–2500 0.98 / 0.90), lists **1.83 hits/s** on Vienna
against §66's own measured 1.81, and reproduces CyborgNinja's `mid` at **P 0.97** and WhoLikesToParty's at 0.81.

**DUST's snare voice** (`tools/dust-trace.js`, scene 1, `&map=0`, `tools/work/v69/dustsnare.py`, ±50 ms): Vienna
24–60 s **173 fires at 4.81 /s, P 0.29 → 114 at 3.17 /s, P 0.45** against a groove of 1.94 /s — §66's own 4.81 /s
reproduced to the digit — with the share of floor-sized flashes **39 % → 11 %**. Controls: SeeYouDrop 20–110 s
333 → 367 fires, P 0.64 → 0.66 / F 0.67 → **0.72**; CyborgNinja 20–50 s 197 → 193, F 0.66 → **0.68**.

**Unmoved:** the whole-track map byte-identical on all five tracks (`md5 d809f6e7`) · the LOW lane, the HAT and the
live build / drop detector byte-identical, column for column · the fake-timeline md5 sweep, 0 of 24 lines, taken as
an isolated pair in a worktree of HEAD · cost `Ears.push` 72.85 → 72.92 and 73.36 → 73.03 µs/block over two
interleaved runs — the two disagree in sign, so it is under the ±0.5 % a machine at load 3.5 can resolve.

### Open after §69

- **`snare2` did NOT move** (DECISIONS §69 "the `snare2` decision"): it is still synapse's level, and it is now the
  loose half of DUST's union. On Vienna 24–60 s the voice's three policies read **union 3.19 /s at P 0.45 · the
  lane alone 1.39 /s at P 0.80 · `snare2` alone 3.03 /s at P 0.42** against a truth of 1.94 /s.
- Malicious's PCM clock bias moves +23 → +30 ms (its bias-removed steadiness is unchanged at 94 → 95 %); on a
  track whose own truth grid is "tempo only" and 0.33 BPM off, the 30 ms gate cliff-edges from 80 % to 50 %.
- `tools/accept.sh` still has not been run since v0.14 (§65 item 5, unchanged).

## §73 — the `Quantile` sign: the `*Vel` saturation was never the music

DECISIONS §73. `assets/engine/ears/dsp.js`'s `Quantile(q)` had its two Robbins-Monro weights swapped and settled on
the **(1 − q)** quantile, so `perc.js`'s `p95[c]` — the divisor of `kickVel` / `snareVel` / `hatVel` — was the
lane's **p5**. The receipt is `tools/test_dsp.js` (in `npm test`): `Quantile(0.95)` on U(0,10) read **0.508**
against a true p95 of 9.495, and on a two-level signal (80 % at 1.0, 20 % at 9.0 — a band that is quiet most of the
time with hits in it) `Quantile(0.90)` read **0.925** instead of 8.999.

**The drum table did not move.** 5 tracks x {`ears`, `v2`} x {kick, snare, hat} x their references = 60 rows,
`tools/drums-node.js` + `tools/truth/drumcheck.py`, both runs from `git worktree`s at `35242cf`:

| `GATE_DB` | rows differing from v0.25 | worst |
|---|---|---|
| −34 (the sign alone) | 22 | SeeYouDrop kick 192 → 188 fires, F 0.40 → 0.38 (`low`) / 0.50 → 0.48 (`click`) |
| −44 | 8 | WhoLikesToParty v2 kick F 0.78 → 0.77 |
| **−54 (shipped)** | **6** | 1–3 fires, **every P / R / F identical to two decimals** |

`GATE_DB` had to move because `lvl[i]` was the band's **p10** and is now its **p90**, 10–30 dB higher per band on
this material, so the same −34 offset suddenly had teeth: it blocked 0.0–24.2 % of hops instead of 0.0–1.1 %, and
what it blocked on SeeYouDrop was four real kicks in the **ducked 51–56 s bar before drop 1**, where the 60–150 Hz
band genuinely sits 34–44 dB under its own p90. −54 restores §68's measured posture — *"swept with and without and
on three bands, identical to every digit, so it costs nothing and still protects a silent band's noise floor"* —
now read off the loud level the comment always named. (At −34 the intro also lost SeeYouDrop's 2.4–4.0 s hats as
silence at −51 dB: hat F unchanged at 0.72, but `denH` 7/s → 0/s through four seconds of "the intro's rising hats".)

**`*Vel` after the fix**, pooled over the five tracks' TRUE hits (every lane fire matched to
`tools/truth/<T>.{kick,snare}.json` at ±50 ms; the hat has no truth list, so its row is every fire):

| field | =1.000 per track, v0.25 | pooled =1.000 after | pooled p10 / p50 / p90 after |
|---|---|---|---|
| `kickVel` | 87 / 46 / 50 / 83 / 83 % | **14 %** | 0.301 / 0.627 / 1.000 |
| `snareVel` | 91 / 53 / 59 / 72 / 47 % | **13 %** | 0.285 / 0.585 / 1.000 |
| `hatVel` | 92 / 61 / 43 / 81 / 89 % | **12 %** | 0.237 / 0.511 / 1.000 |
| `kickAmp` / `snareAmp` (§70, unchanged) | — | 26 % / 17 % | 0.34 / 0.55 / 1.00 |

`p95`'s step had to move with the sign, 0.02 → **0.2**: the estimator is pushed only AT A FIRE (a few hundred
values a track) and the trip became a 5–30 dB climb instead of a ~2 dB descent, so at 0.02 the low lane still read
7.9 / 15.6 / 25.3 / 8.2 / 6.8 dB against a true fire-stream p95 of 16.5 / 23.2 / 36.5 / 9.1 / 10.2. Swept
0.02 / 0.05 / 0.1 / 0.2 / 0.4 / 0.8: the pooled kick ceiling share reads 32 / 24 / 18 / **14** / 10 / 8 %, and past
0.2 the estimator over-tracks the top so the LOUDEST hits stop reaching 1.000 (`vel` p90 0.88–0.99 at 0.4).

**The verdict: `*Amp` is still the SIZE, `*Vel` is now an honest RANK.** `*Vel`'s divisor is a running quantile of
THIS track's fire magnitudes, so its per-track p95 is **1.000 on all five tracks** — the same 12 dB snare reads
1.00 on Malicious (fire-stream p95 7.5 dB) and 0.55 on WhoLikesToParty (21.8 dB). `*Amp`'s per-track p95 reads
0.99 / 1.00 / 1.00 / 0.65 / 0.75 (snare), which is one absolute mapping saying that two of the five tracks are
quieter. Both stay published. **No scene changed**, and field by field over every frame of all five tracks
`snareAmp` is bit-identical on all five and `snareEvt` too, so DUST's flash ring and TORUS2's snare wave — whose
whole input that is since §70 — cannot have moved. `kickAmp` is identical on four tracks and differs on 0.1 % of
WhoLikesToParty's frames (mean 0.0006). The two fields a scene reads that DID move are `subGate` (0.0 / 1.1 /
**7.2** / 0.0 / 0.5 % of frames) and `subNoteEvt` (0.4 / 0.8 / **3.8** / 0.0 / 0.3 %): DUST's core hold, its core
swell and the RIBBON formation test read them, so WhoLikesToParty is the track to look at.

**Unmoved:** §64's build table identical (`buildLive>=0.4` 6/8 armed, Vienna drop 1 at 4.4 beats, CyborgNinja
0.14 false arms/min) and all 18 of `dropcheck.py`'s default rules · every v3 clock row identical on all five
tracks, the PCM clock's beat F 0.903 → **0.915** on SeeYouDrop and within 0.003 elsewhere · the queue's every F
identical to 2 dp but SeeYouDrop `nextHatIn` 0.56 → 0.55 · the bar store within 0.002 · the OFFLINE map
byte-identical (bpm, phase, bar, `drops`, `dropWhy`, sections, every onset list, beats, downbeats, novelty) and so
is the map's own `SubTrack` gate · the fake-timeline md5 sweep, 0 of 24 lines (nothing on the `#test` path imports
from `engine/ears/` at all; `engine/clock/clock.js` takes only `FFT` from `dsp.js`) · cost flat.

### Open after §73

- **CHLADNI reads `kickVel` and `snareVel`.** Its plate ring flashed at full brightness on 52–91 % of hits and now
  flashes at a graded one on 86–88 %. Priority 3 (`kickAmp` → CHLADNI) has a third option: keep `*Vel`, which
  finally means something. `SNAMP` wants a re-tune either way, and the user's A/B.
- **`lpSweep` is live for the first time.** It read a p50 of exactly **0.000 on all five tracks** in v0.25
  (`rollP90` was a p10, so `1 − roll/p10` clamped to 0); it now reads 0.407 / 0.547 / 0.732 / 0.413 / 0.347.
  CHLADNI's `fog` is its only reader and the plate now takes fog through the outro where it never did.
- **The reactive drums' `kick2` RANK vs `kickAmp` vs the now-honest `kickVel`** — §70's open question, still not
  measured.
- Malicious's rows above are from the **v0.25 truth grid** by construction (both worktrees at `35242cf`, while a
  parallel worker re-phases that grid). When the re-phase lands, its base and final move together: the deltas
  stand, the absolute numbers do not.
