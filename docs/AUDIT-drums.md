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
