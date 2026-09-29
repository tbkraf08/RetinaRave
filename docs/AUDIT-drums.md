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
- The default stays synapse's: `kick2` etc. reach a scene only by route until the user says otherwise.
