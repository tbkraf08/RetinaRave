# Live step 3.1: a second gradeable truth grid

Worker report, 2026-09-28. Scope: `tools/truth/trackmap.py` plus the regenerated `CyborgNinja.*` and `WhoLikesToParty.*`.
SeeYouDrop and Malicious are byte-identical: I regenerated all four tracks into a temp copy and ran `cmp` on each json, the
SeeYouDrop stdout table and all ten SeeYouDrop grain tables.

**Verdict.** CyborgNinja is now gradeable in beat phase and bar phase, and its grid is tighter than SeeYouDrop's.
WhoLikesToParty is gradeable in beat phase only, and with care. Its bar line is not verified. Malicious was not attempted.

## What was wrong

- **CyborgNinja.** `refit_grid` picks the phase from the beat-rate component of the onset envelope. On this track the kicks
  land on both eighths of every beat (330 on one half, 359 on the other), so that component cancels: the kicks' resultant at
  the beat period is 0.04, while at the eighth period it is 0.96. The fitted phase therefore fell between the two eighth-note
  positions, 72 ms before one set of kicks and 115 ms after the other. The offset is constant for the whole track (+71 to
  +74 ms in every 8 s slice), so the tempo is right and only the phase is wrong.
- **WhoLikesToParty.** The phase is right on average (−2 ms), but the period is 83 µs too long. The kicks' offset from the
  grid drifts linearly from +20 ms to −22 ms across 256 s (weighted R² 0.86 over 32 slices of 8 s).

## What changed in trackmap.py

Everything new lives in one branch. It runs only for a linear grid (DP residual ≤ 60 ms), and SeeYouDrop never enters it.

1. `anchor_grid`: if the kicks' eighth-note grid sits more than 25 ms off the beat grid and the kicks lock to it
   (resultant ≥ 0.5), move the grid onto the kicks. That leaves two candidate beat grids an eighth apart; the beat is the one
   with more 40–150 Hz onset strength on it. The period is not touched. The kick set is `onsets.click`, or `low` when there
   are fewer than 64 clicks.
   - SeeYouDrop: offset +2.9 ms, so the grid is left alone.
   - WhoLikesToParty: −2.1 ms, left alone.
   - CyborgNinja: +72.1 ms (resultant 0.96), so the grid moves.
2. `drift_fit`: re-fits the period when the kicks' offset drifts in a straight line across the track. Conditions: at least
   16 usable 8 s slices, weighted R² ≥ 0.8, and a total drift of more than 25 ms.
   - WhoLikesToParty: fires.
   - SeeYouDrop: 10 slices, R² 0.48, so it does not fire. A plain kick-based period fit *would* have moved SeeYouDrop's ends
     by −12 / +20 ms, which is why the linear-drift test is there.
   - CyborgNinja: zero drift after re-anchoring, so it does not fire.
3. **Bar line, inside this branch only** (`downbeat_novelty`):
   - Per-beat percussive band levels feed a 16-beat step kernel, which gives a novelty curve. Each peak adds its novelty to
     one of the four beat-in-bar positions, and the position with the most wins.
   - It is used only when the winner has at least 1.5× the runner-up's weight; otherwise `downbeat_phase` decides.
   - Reason: in a syncopated pattern, "the low band is loudest on beat 1" follows the syncopation.
4. **Record.** `bpm_grid.anchor` holds the evidence: offsets, the two candidate grids and their scores, the drift fit, both
   downbeat votes, and the previous period and phase. The key exists only when the grid moved.
5. `at_time`: a sampler that reads the envelopes at the correct time. Short-STFT frame i is centred at 23 ms + i/fps, which
   `downbeat_phase` does not account for (see below).

## CyborgNinja: before and after

Kick-candidate onsets (`onsets.click`, n = 701), graded against the truth beats. An "on-beat kick" is one within a quarter
beat of a beat. "Per slice" means the median |error| of each slice, reported as p50 / p90 / max across slices.

| | before | after |
|---|---|---|
| phase (s) | 0.13544 | 0.02005 (moved −115.4 ms) |
| on-beat kicks, median \|err\| | 71.7 ms | **3.2 ms** |
| on-beat kicks, signed median | +71.7 ms | **+0.1 ms** |
| on-beat kicks within ±30 ms | 0 % | **97 %** |
| all kicks to the nearest eighth, within ±30 ms | 1 % | 98 % |
| share of kicks on the beat | 47 % | 53 % (the rest sit exactly on the offbeat eighth) |

Per-slice median |error| of the on-beat kicks, after the fix:

| grain (s) | p50 | p90 | max |
|---|---|---|---|
| 8 | 3.3 | 4.0 | 4.1 |
| 5 | 3.2 | 4.3 | 6.0 |
| 3 | 3.0 | 5.0 | 7.1 |
| 2 | 3.5 | 5.2 | 7.2 |
| 1 | 3.0 | 6.9 | 48 |
| 0.569 | 3.6 | 7.1 | 46 |
| 0.224 | 3.2 | 8.0 | 92 |

- After the fix, the signed slice medians stay within ±6 ms (p10 to p90) at every grain.
- Before the fix, every grain read about 72 ms (p10 +66 to +71 ms).
- For comparison, SeeYouDrop's hand-checked grid gives: median 10.2 ms, signed +3.2 ms, 80 % within ±30 ms, and a per-slice
  p90 of 42–89 ms.

**Which set of eighths is the beat.** Picked by low-band strength, 10.87 against 9.93 (a thin 9 % margin). Other evidence
agrees:

- The file's first attack is at 25 ms, which is on the chosen grid (0.020 s). The first detected click is at 0.395 s only
  because onset flux needs a frame before it.
- Read on the chosen grid, the 2-bar kick pattern is a four-on-the-floor bar with a pickup on the last eighth, followed by a
  syncopated bar. Hats are stronger on its offbeats (the classic offbeat hat): 90 against 64, summed over 8 positions.
- 7 of 9 sub-entry jumps at the section changes fall on the chosen grid's beats (phase 0.98–0.06), not on the offbeats.

**Downbeat** (beat index mod 4 = 0, so bar lines at 0.020 + 1.5k s):

- The novelty vote is 8.38 against 2.32 (margin 3.6), and 4 of its 5 peaks fall on bars 32, 56, 64 and 112, all multiples of
  8 bars.
- The automatic section starts now fall on 8-bar lines: 12.02, 48.02, 84.02, 108.02, 120.02, 132.02, 144.02 and 168.02 s
  (34.52 s is the exception). Before, they sat at x.135.
- `downbeat_phase` voted for beat 3, because the low band is loudest on the beat before the syncopated bar. Its scores are
  kept in the json.
- Tonic (C# minor) is unchanged, drops are still none, and the onset lists are byte-identical.

**gridcheck** on the existing `tools/work/grid/CyborgNinja-det.json` (no new engine traces were made):

| truth | v3 beatPhase lag | v3 beat events F | synapse beatSyn lag | bar line |
|---|---|---|---|---|
| old | median +86 ms, \|lag\| p50 93 | 0.262 | median −47 ms, p50 52 | 0 % |
| new | median −112 ms, \|lag\| p50 139, jitter p90 260 | 0.069 | median +64 ms, p50 68 | 0 % (engine bar 1 = truth beat +1 in 54 %, +3 in 44 %) |
| new, shifted half a beat (the other set of eighths) | median +17 ms, p50 49 | 0.44 | median −87 ms | not run |

Both engine clocks wander between the two sets of eighths on this track, so CyborgNinja is a good test of half-beat
ambiguity. The engine's grade depends on which set is the beat, so that choice is the one thing to confirm by ear: the kick
at 0.025 s should be beat 1.

## WhoLikesToParty: beat phase only

- Period 0.512899 → 0.512816 s (116.982 → 117.001 BPM); phase 0.0532 → 0.0716 s.
- On-beat kicks: median |error| 14.0 → **7.8 ms**, signed median −4.0 → +1.9 ms, 72 → 71 % within ±30 ms.
- The kicks' offset per 8 s slice went from a drift of +20 to −22 ms to −15 to +6 ms with no trend.

Per-slice median |error| of the on-beat kicks, after the fix:

| grain (s) | p50 | p90 | max |
|---|---|---|---|
| 8 | 7.8 | 12.9 | 17 |
| 5 | 8.1 | 13.6 | 21 |
| 3 | 8.3 | 14.7 | 73 |
| 2 | 8.3 | 40 | 73 |
| 1 | 8.5 | 63 | 128 |
| 0.569 | 10.1 | 64 | 128 |
| 0.224 | 8.8 | 114 | 128 |

The long tails at short grains come from slices where only non-kick "clicks" land: 38 % of this track's click set is off
the beat.

**Downbeat not verified.** The novelty vote says beat 2 but with margin 1.42, under the 1.5 threshold, so `downbeat_phase`'s
beat 0 stands (unchanged from before). The low band is equally strong on beats 0 and 2 (22.9 against 22.7), and so is the
mid band (13.6 against 13.6). The bar line could be off by two beats, so **do not grade barPos or phrase on this track.**

## Not trusted, or not done

- **Malicious:** DP beats (residual 90 ms), kick resultant 0.13 at the eighth period. There is no lattice to anchor to, so it
  stays tempo-only.
- **The CyborgNinja beat choice** rests on a 9 % low-band margin plus the supporting evidence above. It is a judgement the
  user can check by ear.
- **`bpm_grid.dp_residual_ms`** on both re-anchored tracks still measures the DP beats against the *old* linear grid.
- **Latent, left alone for byte compatibility:** the linear grid's phase is computed in frame-index time, and short-STFT
  frames are centred 23 ms later. `downbeat_phase` reads `int(t * fps)`, two frames late. SeeYouDrop's grid still lands
  +3 ms from its kicks.
- **Stale caveat in `gridcheck.py`:** its docstring still calls CyborgNinja's phase ~70 ms off. I did not touch that file
  (out of scope).
