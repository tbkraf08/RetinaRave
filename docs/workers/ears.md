# EARS worker report — v0.15 E0 (truth + comparator), E3 (the ears), E4-DSP (the track map)

Branch `agent-a3315f44703afd482` (worktree), seven commits `EARS:`, head at the time of writing = the commit that adds this
file. Nothing merged into `main`, nothing pushed, `tools/accept.sh` never run, no page file touched.

Everything below was measured. Where a frozen ruler is missed it says so, by how much, and what would fix it.

---

## 1. Acceptance, item by item

| # | item | result |
|---|---|---|
| 1 | `node tools/check.js` → 0 fail | **pass** — `check: 117 modules · uniforms 180 · MS keys 118 · scenes 10 (help.feats gaps 0) · 0 fail · 4 warn` (the 4 warns are the pre-existing >350-line scene files) |
| 1 | `node tools/test_ears.js` at 44.1 **and** 48 kHz | **fail (exit 1)** — 3 of 19 rulers miss at 44.1 kHz, 4 of 19 at 48 kHz. Every miss is listed in §3 with its cause |
| 1 | `node tools/test_map.js` at 44.1 **and** 48 kHz | **pass (exit 0)** — 27 of 27 rulers, both rates |
| 2 | `trackmap.py SeeYouDrop --pcm` regenerates everything, old keys and tables unchanged | **pass** — see §2 for how it was checked |
| 3 | `compare.py` on the node trace → every ruler row filled, each pass/fail stated | **pass** (the tool); 7 pass / 7 fail / 16 reported on the trace — §6 |
| 4 | `buildMap` drops = [57.6 ± 0.017, 105.7 ± 0.017], nothing else | **pass against the truth's bar lines** (57.611 = +5 ms of 57.606, 105.590 = −6 ms of 105.596, both inside a 60 Hz frame, nothing else). Against the ANNOTATION's literal 105.7 it is −110 ms: the annotation's number is wrong, see §2.3 |
| 5 | cost table: push+read ≤ 0.19 ms median per block | **pass** — 0.060 ms at 44.1 kHz, 0.058 ms at 48 kHz (p99 0.36 / 0.34 ms). 3.2× of headroom |

---

## 2. E0 — the truth, and three things the annotation had wrong

### 2.1 Byte compatibility

`tools/truth/trackmap.py` gained ~300 lines, all additive. Checked three ways, not by eye:

* `tools/work/probe_compat.py` parses the pre-change `SeeYouDrop.json` and the new one and compares each v0.14 key
  independently: `summary`, `grains`, `slices["8"|"5"|"3"|"2"|"1"|"0.569"|"0.224"]`, `sub_runs`, `onsets`, `contour` — all
  **byte-identical**. New top-level keys: `bare808 beats bpm_grid downbeats drops energy novelty sections sub_slides tonic`.
  New `slices` keys: `beat bar 4bar`. Nothing removed.
* `cmp` on all seven `tools/truth/SeeYouDrop/grain-*.txt` → identical. `cmp` on `others-brief.txt` → identical.
* `git diff --numstat tools/truth/SeeYouDrop.txt` → `35 0` and later `+13 −2` (the drop-rule description line changed once):
  additions and the one line whose own text changed, no deletions of data rows.

The JSON is one line, so `git diff` necessarily shows it as 1 changed line; that is why the key-by-key parse exists.

Determinism: two consecutive runs → byte-identical `SeeYouDrop.json` and identical stdout. 10–18 s per track.

### 2.2 The grid

| | value |
|---|---|
| tempo | **150.030 BPM**, beat **0.39992 s** |
| phase | **0.0172 s** (beat 0 at 0.0172, bar 0 at 0.0172) |
| coherence | 0.253 |
| DP residual | 32 ms |
| downbeat | beat index **0 mod 4**, scores `[6.832, 6.544, 6.194, 6.654]` |
| bars | 99 of 1.5997 s |

How the downbeat phase was checked, as the brief asks: the drops. Bar 36 = 0.0172 + 36·1.5997 = **57.606** and bar 66 =
**105.596**, and the 22–60 Hz sub energy (causal, 8 ms hop) crosses its p90/8 at 57.61 and 105.62 — i.e. both drops land ON
downbeats of the chosen phase, within 25 ms. The same holds for the walk's first note (bar 8 = 12.815, sub attack 12.799)
and the turn's C#1 (bar 82 = 131.191, attack 131.221).

The plain ACF peak of this track is 0.80 s (75 BPM — the half-time feel; the v0 tool reports exactly that). The log-normal
tempo prior (centre 135 BPM, σ 0.7 octaves) is what makes 0.40 s win: at σ 1.0 the 0.80 s comb still wins, at σ 0.7 the
0.40 s one does. Per-8 s-window phase with the period fixed stays inside 0.03 s from 24 s to 152 s, which is why one global
linear grid is right for this track rather than a per-beat DP output.

### 2.3 **A measurement error of mine, and what it corrected in the annotation**

My first probes computed a 1 ms envelope with `hop = int(sr/1000)` = **44** samples at 44.1 kHz and then labelled frame *i*
as `i` milliseconds. 44/44100 = 0.9977 ms, so every label was 0.23 % long — 135 ms by the end of the track. That made drop
1's sub entry look like 57.740 and drop 2's like 105.861, and for an hour I believed the two drops were 120.25 beats apart
(i.e. that no 150 BPM grid could put both on bar lines) and chased a phantom 130 ms of false anticipation in the sub gate.

Corrected: the real sub entries are **12.799 / 57.609 / 105.621 / 131.221**, every one of them within 25 ms of an E0 bar
line. The annotation's `drops: [57.6, 105.7]` is right for the first and **0.10 s late for the second** — it came from the
10 Hz `sub_runs` coding (`105.8s C#1x5`) of a 0.372 s STFT. E0's 105.596 is the bar line and the audible entry is 105.621.

Two further places where the annotation's times are the 10 Hz coding rather than the attack:

* the four walk notes. The annotation says 13.0 / 16.1 / 19.3 / 22.6; the truth's own 100 Hz YIN puts the note ARRIVALS at
  12.98 / 16.09 / 19.30 / 22.51, and the 22–60 Hz ATTACK of the first one is at 12.799. "Within 50 ms of 13.0" and "on the
  attack" are 200 ms apart. §3 grades against the f0td arrivals and reports both.
* `not_drops`: "intro ~9–10 s". There is no sub before 12.799 at all; the thing the v0.14 engine fired on is the *layer
  entry* at 12.8, which E0 and the map both reject.

### 2.4 Sections vs the annotation (truth | auto | Δ beats)

```
     0.00 |   0.017 |  +0.04 b
    13.00 |  12.815 |  -0.46 b
    25.00 |  25.612 |  +1.53 b   MISS   (no bar line within 1 beat of the annotation)
    44.90 |  44.808 |  -0.23 b
    49.90 |  49.607 |  -0.73 b
    57.60 |  57.606 |  +0.02 b
    90.00 |  89.599 |  -1.00 b   MISS   (no bar line within 1 beat of the annotation)
    96.00 |  95.998 |  -0.01 b
   105.70 | 105.596 |  -0.26 b
   130.50 | 131.191 |  +1.73 b   MISS   (no bar line within 1 beat of the annotation)
   134.50 | 131.191 |  -8.27 b   MISS   (a bar line exists at 134.390, -0.27 b; the novelty there is under threshold)
   157.40 | 156.786 |  -1.54 b   MISS   (no bar line within 1 beat of the annotation)
```

**7 of 12 within ±1 beat, and 4 of the 12 annotated times have no bar line within a beat at all** (25.0, 90.0, 130.5,
157.4). A bar-pinned section detector therefore caps at 8 of 12 on this grid; the one real detector miss is **134.5**, the
turn → outro-walk boundary, where a bar line exists at 134.390 but the Foote novelty is below `mean + 0.6 σ`. What would fix
it: a local (windowed) novelty threshold instead of a global one — it finds 134.4 and also 143.99 / 150.39 (the outro walk's
own repeats, which the annotation lumps), at the cost of two more sections. Measured, not adopted, because the global rule
gives the same 8-of-12 with five fewer segments.

All three annotated return pairs come back as returns. The first pair matches the groove's SECOND half (the groove splits
into two clusters at 38.4 s and 89.6–96.0 matches the later one) — the same behaviour the JS port shows.

### 2.5 The tonic — settled

**C# minor.** KK on the sub-inclusive chroma over the loud half:

```
C#m +0.756   C#M +0.547   AM +0.491   F#m +0.431   F#M +0.287        conf 0.277
chroma: C 0.040  C# 0.328  D 0.113  D# 0.042  E 0.092  F 0.032  F# 0.061  G 0.037  G# 0.068  A 0.107  A# 0.037  B 0.045
```

G# minor is not in the top five. The hypothesis in `SeeYouDrop.sections.json` is confirmed and the mechanism named in the
spec is confirmed with it: C# carries 0.328 of the chroma only because the sub's own pitch class is in it, and synapse's key
chroma starts at 65 Hz (`anatomy.js:106`), so the live engine sees G# (the fifth, 0.068 here) as the strongest thing it can
see. How sure: C#m beats the runner-up by 0.21 correlation, 38 % of its own magnitude — a clear margin, and the map's
independent JS implementation gets `C#m 0.766, C#M 0.596, AM 0.481` from a different chroma. I would call it settled.

### 2.6 Slides, bare 808s, the dumps

* **41 slides** whole-track, **13 on 57.6–90 s**, all downward, from D#1/D1 (38–40 Hz) to C#1 (34.5 Hz), −1.0 to −2.8
  semitones, median span **0.150 s** (the annotation's "~0.3 s" is generous; the YIN hop is 10 ms so 0.15 s is resolved).
  The detector is deliberately conservative (voiced and continuous throughout, no frame jumping >1 semitone, landing held
  ±0.4 semitone for 40 ms): it is the reference `subGlide` is graded against, so a false slide costs more than a missed one.
  A first version with only the monotonic test found 271, most of them YIN jitter and one octave error.
* **bare808: 275 of 504 low onsets (55 %)**; kick candidates 229. This is the evidence for the spec's item 2 in one number:
  on this track more than half of the 40–150 Hz onsets are 808 note starts, not kicks.
* `--pcm` writes `tools/work/<name>.f32` (unchanged), `<name>.st.f32` (stereo interleaved) + `.json {sr,n,ch}`, and with
  `--sr=48000` also `<name>.48000.f32` / `.48000.st.f32` via `resample_poly`. The ANALYSIS always runs at the file's own
  rate; only the dumps are resampled.

### 2.7 The other three tracks, full

| track | grid | drops | sections / returns | tonic |
|---|---|---|---|---|
| CyborgNinja 179.9 s | 160.000 BPM, phase 0.135, coh 0.171, mod4 0 | **none** | 10 / 5 | C# minor 0.19 |
| WhoLikesToParty 256.2 s | 116.982 BPM, phase 0.053, coh 0.106, mod4 0 | 57.50, 131.35, 188.80 (all clause 2) | 17 / 10 | D major 0.19 |
| Malicious 222.7 s | 139.675 BPM, phase 0.046, coh 0.255, mod4 2 | **148.29** (clause 2) | 15 / 9 | G major 0.16 |

Note CyborgNinja 160.00 where the v0 ACF said 162.2, and Malicious 139.675 where it said 69.8 — the tempo prior doubles the
half-time reading on both. **Malicious's stutter (DECISIONS §46 add. 4, three drops in 14 s) produces none**: its low end
never leaves for a full bar in that passage, so clause 1 cannot fire, and clause 2's 4-bar refractory plus the kick-density
gate reject the stutter. The only drop it finds is at 2:28. CyborgNinja gets none because its bass (an octave up, C#2) never
leaves at all — arguably a miss, arguably correct for a track with no bass drop; there is no annotation to decide.

---

## 3. E3 — the ears. Rulers, both rates

`node tools/test_ears.js` (44.1 kHz, [48 kHz] where it differs):

| ruler | value | target | |
|---|---|---|---|
| subHz ±30 cents of `contour.f0td`, frame by frame | 72.5 % [72.6] of 4564 sub-loud frames | 90 % | **reported, not asserted** — see below |
| `subNote` = the truth's per-BEAT slice note | 88.9 % [88.4] of 225 voiced beats | ≥ 90 % | **FAIL** by 1.1 points |
| the four walk notes vs the f0td arrivals | +42 +37 +20 +11 ms [+39 +33 **−53** +18] | each ≤ 50 ms | pass [**FAIL**, one of four] |
| slides on 57.6–90 s | 13 of 13, all downward, median span 0.100 s | ≥ 50 %, right sign | pass |
| `subPure` sine vs harmonic | groove 0.65, drop1 0.81 / intro 0.04, 101–105 s 0.13 | > 0.6 / < 0.45 | pass |
| `subIn` at drop 1 (bar line 57.606) | 57.645, **+39 ms** [+41], **0 flutter** in the 2 s before | ≤ 50 ms | pass |
| `subGate` ducks through drop 2 | 0.77 [0.77] gate edges per bar over 105.7–130.5 s | ≥ 0.5/bar | pass |
| kick F ±30 ms on 25–45 s vs `onsets.click` | **0.732** [0.786] (P 0.68 R 0.79, tp 30 miss 8 extra 14) | ≥ 0.90 | **FAIL** |
| kicks on a truth `bare808` | **12.6 %** [13.9] | ≤ 5 % | **FAIL** |
| snare F (25–45 / 57.6–90 / 105.7–130.5) | 0.72 / 0.83 / 0.75 [0.72 / 0.74 / 0.65] | reported | |
| hat F (same windows) | 0.72 / 0.86 / 0.83 [0.70 / 0.79 / 0.84] | reported | |
| onset time error vs truth | kick med +6 p90 +18, snare +6/+6, hat +6/+6 ms [+9/+16, +5/+12, +5/+12] | reported | |
| `den*` on the climbs vs the groove | 1.66× [1.76× / 1.82×] | ≥ 1.6× | pass |
| `pulse` on the drop sections | 0.61 / 0.61, groove 0.50 [0.56 / 0.53, groove 0.91] | 0.5 wanted | pass (reported) |
| tonic settles on C# minor | **10.0 s** [11.3] | ≤ 30 s | pass |
| `bassReg` rises on the climbs and the intro | groove 0.41, climb1 0.56, climb2 0.57, intro 1.00 | > groove | pass |
| `lpSweep` outro vs groove | 0.85 / 0.05 [0.84 / 0.02] | > 0.7 / < 0.3 | pass |
| `width` per section | intro 0.758, groove 0.597, void 0.931, drop1 0.499, drop2 0.532, outro 0.421 | reported | |
| cost push+read per 512 block | **0.060 ms** median, 0.36 p99 [0.058 / 0.34] | ≤ 0.19 ms | pass |

### 3.1 Why the ±30-cents ruler is reported and not asserted

The reference cannot support 90 % in the sections where this track's sub is kicked or ducked. Graded against a 5-frame median
of **itself**, `contour.f0td` is within ±30 cents of its own median on:

```
walk 100 %   outro 100 %   turn 98 %   gated 90 %   slides 80 %   groove 77 %   climb2 52 %   climb 45 %   gret 37 %
```

The truth tool's own `held` column says the same thing (the groove's `held` is 69–78 %). The ears score 94 % on the walk,
88 % on the outro, 84 % on the turn, 74 % on the slides, 62 % on the gated drop, 45 % on the groove: wherever the reference
is stable, the two agree to a few cents (median error on the walk: **−1 cent**). So the frozen row is printed with the
reference's own ceiling next to it, and the ruler that IS asserted is the note-level one — `subNote` against the truth's
per-beat slice note, which is what a scene actually reads (a figure or colour table is indexed by pitch class).

The 25 beats where `subNote` still disagrees are, by inspection: slide landings where the truth's beat median is D1 and the
ears settle on the C#1 it lands on (~7), and beats where the truth's own slice note is the mid-bass an octave up (~8). The
rest (~10) are in the ducked drop sections. What would close the last 1.1 points: grading on the note at the END of a beat
rather than its median, or a slide-aware beat median in the truth tool. Both change the reference, so neither was done.

### 3.2 Why the kick rulers miss, and the trade-off

Two numbers, both measured, and they pull against each other:

| beater window | kick F on 25–45 s | kicks on a bare 808 |
|---|---|---|
| 15 ms (the truth tool's own definition) | 0.37 | **6.0 %** |
| **25 ms (chosen)** | **0.73** | 12.6 % |
| 35 ms | 0.76 | 10.8 % |

Context for the 5 % target: a 15 ms window around the 275 bare onsets covers 5.3 % of the 157 s, so **chance is 5.3 %** and
the 15 ms configuration is at chance. 25 ms was chosen because it reproduces the truth's kick COUNT (207 against 229) and
gives a channel a scene can use; 12.6 % is 2.4× chance, and it is a miss, not a pass.

The ceiling is the front end, not the click test: the same detector's LOW-band onsets score only **F 0.65–0.70** against
`onsets.low`, and kicks are a subset of those. What would fix it is the truth tool's own front end — a 2048-point STFT with a
2-D (17 frame × 17 bin) median HPSS — which does not fit 0.19 ms per block on the main thread (the 2-D median alone is
~150 k ops per hop) and belongs in E4's Worker, where the map already runs a non-causal pass.

Measured and rejected on the way: a 128-sample hop (2–5× the false onsets, F 0.21–0.61); integrating each band over 4 hops
to match the truth's 46 ms STFT window (smears the attack, F 0.71 → 0.52); requiring the kick's 150–600 Hz BODY as well as
the beater (F 0.73 → 0.62 without reliably cutting bare hits).

### 3.3 The cost table

| | 44.1 kHz | 48 kHz |
|---|---|---|
| `push` of one 512 block (both channels), mean | 0.077 ms | 0.072 ms |
| `read(tHeard)`, mean | 0.0007 ms | 0.0007 ms |
| **push + read per block, median** | **0.060 ms** | **0.058 ms** |
| push + read per block, p99 | 0.356 ms | 0.344 ms |
| blocks / reads over 157 s | 13574 / 9456 | 14775 / 9456 |
| `buildMap` (157 s track) | 1.6 s | 1.6 s |
| `buildMap` (256 s WhoLikesToParty) | 2.4 s | — |

At 48 kHz a 60 Hz frame is 1.56 blocks, so the stage costs ~0.09 ms/frame against the brief's 0.3 ms budget. The p99 is the
chroma FFT's 372 ms tick (an 8192-point FFT amortises to ~4 µs/block but lands in one block); if the p99 matters in the page,
move the chroma to a Worker or split it across blocks.

Where the time goes, per block: 26 biquad sections per sample (7 perc bands — four of them 4th-order HP+LP — plus the sub's
6th-order gate band and its 4th-order low-pass), ~1.4 YIN frames of 240×66 difference terms, and one amortised FFT.

---

## 4. E4-DSP — the map. 27 of 27 rulers, both rates

| ruler | 44.1 kHz | 48 kHz |
|---|---|---|
| `buildMap` cost | 1.63 s | 1.63 s |
| grid vs the truth | 150.066 BPM, phase 19 ms off mod the beat, coh 0.129, drift 0.02 % | 150.067, 23 ms, 0.122, 0.07 % |
| downbeats vs the truth's | 99 of 99 within half a beat, median 0 ms | 99 of 99 |
| **drops** | **[57.611, 105.590]**, Δ **+5 ms / −6 ms**, nothing else | same |
| no drop at 9–13 s | 0 in 0–14 s | 0 |
| boundaries within ±1 beat | 8 of 12 (4 unreachable) | 8 of 12 |
| the three returns | 3 of 3, 8 sections carry `ret` | 3 of 3 |
| tonic | C# minor conf 0.22 | C# minor |
| `toDrop` through the void | 19.0 → 14.0 → 9.0 → 4.0 → 0.3 beats | same |
| `buildProg` across 49.9–57.6 s | 0.04 → 0.30 → 0.67 → 0.99 → 1.00 | same |
| `mapCross` | one frame per drop (57.617, 105.600) and one per boundary, never twice | same |
| determinism | two builds → identical JSON, 19.9 kB | — |

`eG` p95 per annotated section: intro 0.30, walk 0.63, groove 0.65, climb 0.56, void 0.15, slides 0.88, groove-return 0.60,
climb-double 0.56, **gated 1.00**, turn 0.34, outro-walk 0.50. That is the macro arc the AGC flattens: GIELIS read the groove
dark at p95 0.2–0.45 and only the drop reached the band (DECISIONS §47), and here the groove is 0.65 and the 1:45 drop is
1.00 without any normalisation inside the visual.

Three things could not be ported and had to be measured:

1. **The tempo envelope is the drum bands only** (150–600, 150–2500, 2.5–8k, 5–12k). Including 22–70 and 70–150 pulls the
   phase fit a 16th note early — the 808 plays 16ths — and the grid came out 99 ms before the truth's.
2. **The beat phase comes from a comb sum**, scanned over one period at 1 ms, not from the circular-mean estimator, whose
   answer is biased by the flux's sawtooth shape. This one change moved the grid from 54 ms before the truth's bar lines to
   within a frame, and took the drops from Δ −50/−61 ms to Δ +5/−6 ms.
3. **The ACF peak's octave is not reliable across sample rates.** At 48 kHz the same track's drum envelope peaked at 0.80 s
   where at 44.1 kHz it peaked at 0.40, and the whole 48 kHz map came out at 74.85 BPM with every structural ruler failing.
   The refit now tries the peak, its half and its double and keeps whichever comb locks best under the tempo prior.

### 4.1 The drop rule, and the four measures that do not work

SeeYouDrop is **limited**: its quiet-LOOKING walk at 12.8 s has the same bar energy as drop 1 (0.85 against 0.86 of the
track's p90), because the sub is 68–79 % of the energy there. So no energy threshold separates a drop from a loud bass-layer
entry. Tried, in order, and rejected:

| measure (walk / drop 1, as a share of the track p90) | verdict |
|---|---|
| total bar energy, 4 bars after — 0.85 / 0.86 | no threshold exists |
| 150 Hz – 12 kHz power — 0.59 / 0.62 | no |
| the drum bands' flux SUM — 0.56 / 0.67 | too close |
| snare+hat onset counts, with and without a velocity floor — 0.50 / 0.65 | too close; velocity is normalised by a running p95, so a quiet passage's weak hats score like loud ones |
| **kicks per second over the 8 bars after — 0.19 / 0.69** (drop 2: 0.38) | **this one.** The walk has no kick at all |

4 bars was not enough (drop 2's first two bars are ones the kick detector misses: 0.31 against the walk's 0.19); 8 bars
gives 0.38 against 0.19 and `DEN_MIN` 0.30 sits cleanly between. `trackmap.py`'s rule was changed the same way and re-run:
the four tracks' `drops` lists are unchanged by it, and the byte-compatibility checks still pass.

### 4.2 The other three tracks through `buildMap` (reported, no truth to fail against)

| track | map | truth |
|---|---|---|
| CyborgNinja | 160.01 BPM, no drops, 10 sections / 7 returns, tonic Dm 0.05 | 160.00, no drops, 10 / 5, C#m 0.19 |
| WhoLikesToParty | 117.00 BPM, drops 56.48 / 130.33 / 187.77, 21 / 15, tonic Em 0.26 | 116.98, 57.50 / 131.35 / 188.80, 17 / 10, DM 0.19 |
| Malicious | 140.04 BPM, **no drops**, 13 / 10, tonic CM 0.03 | 139.67, 148.29, 15 / 9, GM 0.16 |

WhoLikesToParty's drops are about half a bar earlier than the truth's — its grid phase differs (coherence 0.106, the weakest
of the four). Malicious's single truth drop at 148.29 is missed by the map (its clause-2 jump falls just under). The tonic
disagrees on all three, but **both** confidences there are ≤ 0.28 — neither implementation finds a key on those tracks; on
SeeYouDrop, where the truth is confident (0.277), they agree and their top-five orders match almost exactly. Malicious's
stutter produces no drops in either implementation, which is the point of the rule.

---

## 5. Every constant I chose

### `assets/engine/ears/sub.js`

| name | value | why |
|---|---|---|
| `SUB_LP` | 100 Hz, 4th order | the truth uses 130; at 130 the intro's 109 Hz mid-bass passed at full level and YIN locked to it instead of the arriving sub; at 200 the 70–150 layer got in |
| `SUB_SRD` | 2000 Hz | the brief's lean; the decimation factor is `round(sr/2000)` = 22 or 24 |
| `SUB_WIN` | 0.120 s | 4.2 cycles of 35 Hz; the brief's floor. 0.040 s holds 1.4 and fails |
| `SUB_HOP` | 0.008 s | the brief's ceiling is 0.010 |
| `SUB_FMIN/FMAX` | 22 / 130 Hz | the truth searches 28–130 |
| `SUB_THR` | 0.16 | the YIN CMND threshold; the truth uses 0.15 |
| `GATE_BAND` | 22–60 Hz, 6th order | so "the sub is sounding" means the sub and not the octave above it: 100 Hz is 27 dB down |
| `GATE_ON/OFF` | 0.16 / 0.075 of the running p90 | 0.22/0.10 put `subIn` 15 ms later and the ducks 0.65/bar instead of 0.77 |
| `GATE_SHARE_ON/OFF` | 0.30 / 0.26 | without the share test the intro's and 101–105 s's harmonic bass read as a sub (the truth's own beat note there is G#2/A#2); with it, `subNote` went 88.5 → 93.2 % before the smoothing was tuned |
| `GATE_DWELL` / `GATE_CONFIRM` | 0.045 s / 1 frame | flutter suppression; a duck is ~0.8 s apart so 45 ms only kills flutter |
| `P90_STEP` | 2.5e-4 (~32 s) | a 4 s follower collapsed inside the 8 s void and fired three false notes before the drop |
| `CONF_MIN` | 0.55 | below it the pitch is not updated |
| `NOTE_HOLD` | 0.032 s | a pitch change must hold this long to be a new note |
| `NOTE_LAG` | `SUB_WIN/2 + NOTE_HOLD/2 − 0.016` = 0.060 s | measured: without it the walk notes land 61–92 ms late, which is exactly what a straddling window plus the hold costs |
| `RETRIG_DB` / `RETRIG_MIN` | 7 dB / 0.090 s | an 808 re-trigger inside an open gate |
| `GLIDE_TAU` | 0.030 s | the semitone/s derivative's smoothing |
| `MED_N` | 5 (40 ms) | the median over accepted YIN pitches; 7 dropped `subNote` to 85.9 % |
| `NOTE_MODE` | 1 (off) | a 9-frame mode on the note index dropped `subNote` 87.1 → 83.9 % — the window straddles a slide's landing |

### `assets/engine/ears/perc.js`

| name | value | why |
|---|---|---|
| `PHOP` | 512 | a 128-sample hop gave 2–5× the false onsets (F 0.21–0.61 against 0.73) |
| `BANDS` | 22–70, 70–150, 40–150, 150–600, 150–2500, 2500–8000, 5000–12000 | the truth's bands plus a sub/low-bass split for `bassReg` and `subPure` |
| `BAND_KIND` | steep (4th-order HP+LP) for the four low bands, wide for the three upper | the low bands sit within an octave of each other; the upper ones are >2 octaves wide |
| `INT_N` | all 1 | integrating over 4 hops to match the truth's 46 ms window smeared the attack (F 0.71 → 0.52) |
| `MED_N` | 9 hops (~105 ms) | the HPSS-lite harmonic estimate |
| `THR_K` | 3.0 | swept 1.4–3.8: 3.0 gives snare/hat F 0.72 with kick F 0.73 |
| `THR_FLOOR` | 1.2 dB per class | swept 0.8–3.2; flat above 1.2 |
| `CLICK_FLOOR` | 1.0 dB | the beater band's floor |
| `REFRACT` | 0.085 / 0.060 / 0.045 s | the truth's peak distance is 0.09 s on the low band |
| `CLICK_W` | **0.025 s** | see §3.2 — the truth's own definition is 15 ms and the trade-off is measured both ways |
| `BODY_REQ` | false | requiring the kick's 150–600 Hz body cost F (0.73 → 0.62) without reliably cutting bare hits |
| `ONSET_OFS` | 0.5 hop | the transient sits inside the hop; the measured residual error is +6 ms median |
| `GATE_DB` | −34 dB | a band far under its own running p90 cannot produce an onset |
| `FM_A` | 0.02 (~0.6 s) | the flux mean/deviation smoothing |

### `assets/engine/ears/{tonic,texture,pulse}.js` and `ears.js`

| name | value | why |
|---|---|---|
| `CH_N` / `CH_EVERY` | 8192 / 32 hops (372 ms) | 5.4 Hz bins; amortises to ~4 µs a block |
| `CH_LO/HI` | 130 / 2100 Hz | below 130 the bins are coarser than a semitone; the sub's class is added explicitly instead |
| `TAU` | 11 s | 25 s and 16 s both settled the tonic at 32 s, but that was the shared-`tPrev` bug; with each source on its own dt, 11 s settles at 10.0 s |
| `SUB_W` / `SUB_WGT` | 2.5 / 0.6 | how hard the sub's class leans, and its share of the update budget |
| `REG_LO/HI` | 35 / 140 Hz | the brief's definition of `bassReg` 0 and 1 |
| `PURE_LO/HI` | 0.05 / 1.0 | the brief's h/f mapping |
| `ROLL_TAU` / `WID_TAU` | 0.25 / 0.35 s | |
| `rollP90` step | 4e-4 (~30 s) | "the track's running p90", not the last second's; at 0.05 `lpSweep` was 0.00 everywhere |
| `CTR` | 39.2 / 102.5 / 300 Hz | the geometric centres of the three low bands |
| `PulseTrack` FPS / WIN / LAG range | 100 Hz / 8 s / 0.25–1.30 s | |
| `PulseTrack.CONF_MIN` | 0.10 | the ACF peak must be this strong to move `pulse` |
| `BEAT_DEFAULT` | 0.5 s | only used when the host does not supply the grid beat — see §7 |
| `SHARE_UP` / `SHARE_DOWN` | 0.012 / 0.45 s | asymmetric: symmetric 0.45 put `subIn` 262 ms late at drop 1, and a fast fall made the gate chatter 5.4×/bar through the ducked drop 2 and halved the slide count |
| `HIST` | 512 frames (~4 s) | the heard-time ring; `read` may look back ~60 ms |

### `tools/truth/trackmap.py` and `assets/engine/map/*`

`TEMPO_C/TEMPO_SIG` 60/135 s and 0.7 oct · `DP_ALPHA` 680 · `REFIT_HOPS` 1.5, `REFIT_STEP` 2e-5 · `PHASE_STEP` 1 ms ·
`DRIFT_MAX` 1.5 % · `SEC_KERNEL` 4 bars · `SEC_MINBARS` 2 · `NOV_K` 0.6 · `SEC_CLUSTER` 0.35 (python) / `CLUSTER` 0.65 (JS,
swept 0.35/0.5/0.65/0.8 × KERNEL 3/4/6 × NOV_K 0.4–0.85; 0.65 is the only point that recovers all three return pairs AND
keeps 8 of 12 boundaries) · `DROP_QUIET` 0.15 · `DROP_MIN` 0.55 · `DROP_AFTER_MIN` 0.60 · `DROP_DEN_MIN` 0.30 over
`DROP_DEN_W` 8 bars · `DROP_JUMP` 0.25 · `DROP_SOFT` 0.45 · `DROP_REFRACT` 4 bars · `SLIDE_SEMI` 1.0, `SLIDE_MINT/MAXT`
0.08/0.5 s, `SLIDE_MAXJ` 1.0, `SLIDE_MAXS` 12, `SLIDE_HOLD/HTOL` 4 frames / 0.4 semitone · `EG_FPS` 10, `EG_LO/HI` p5/p98 ·
`CH_PER_BAR` 4 windows, `CH_LO` 65 Hz (the same band the truth bins, so the two tonics are comparable) · `MED_W` 5 hops
(the map's non-causal harmonic median).

---

## 6. The node ruler table (`compare.py` on `tools/work/ears-node-SeeYouDrop.json`)

39 fields, 9456 frames, 1.7 MB. The old engine's rows all read "absent" with their reason, because a node trace of the ears
carries no v3 or synapse column — which is the behaviour the brief asks for, and the same code path will fill them from a
trace recorded in the page.

| ruler | source | value | target | |
|---|---|---|---|---|
| kick lag first-frame | new | med +20 p90 +24 max +29 ms | med ≤15 | **FAIL** |
| kick lag **placed** (`t − kickAge`) | new | **med +6** p90 +18 max 29 ms | \|med\| ≤15 | pass |
| kick F ±30 ms | new | 0.518 whole track · **0.732 on 25–45 s** · 0.636 on 57.6–90 s | ≥ 0.90 | **FAIL** |
| snare lag first-frame / placed | new | +16 / **+6** ms | | FAIL / pass |
| snare F ±30 ms | new | 0.636 (P 0.574 R 0.713) | reported | |
| hat lag first-frame / placed | new | +16 / **+6** ms | | FAIL / pass |
| hat F ±30 ms | new | 0.725 (P 0.662 R 0.802) | reported | |
| kicks on bare 808s | new | 7.2 % whole track · 13.6 % on 25–45 s | ≤ 5 % | **FAIL** |
| sub pitch ±30 cents | new | 72.5 % of 4532 frames, median \|err\| 8.3 cents, octave errors 0.6 % | ≥ 90 % | **FAIL** (§3.1) |
| sub pitch | old | absent | | v3 has no sub pitch: `pcOf` bins are 5.4–5.9 Hz, a semitone at C#1 is 2 Hz |
| slides detected | new | 33 of 41, 33/33 signs right, median span 0.100 s (truth 0.150) | ≥ 50 % | pass |
| slides detected | old | absent | | nothing in v0.14 measures a glide |
| **drops** | new | **2/2 at 57.617 and 105.600**, max \|lag\| 11 ms, none elsewhere | exact ±1 frame | **pass** |
| drops | old | absent | | (`dropEvt` needs a page trace) |
| boundaries ±1 beat | new | 6 of 11 annotated | all | **FAIL** — 4 of the 11 have no bar line within a beat, so 7 is the ceiling |
| returns labelled | new | 5 of 5 truth sections flagged, 6 distinct labels seen | all | pass |
| returns labelled | old | absent | | synapse names a section 4–8 beats after its boundary (DECISIONS §10) |
| **tonic** | new | **C# minor, first right at 0.8 s** | C# minor | **pass** |
| tonic | old key | absent | | synapse's key chroma starts at 65 Hz (`anatomy.js:106`) |

The "first-frame" lag failing while the "placed" lag passes is the single most useful thing in this table: the ears' own
onset error is +6 ms, and everything above that is 60 Hz frame quantisation. A scene that draws at `t − kickAge` is on
the beat to 6 ms; a scene that draws "when the flag is true" is up to 29 ms late. That is what `<x>Age` is for.

`compare.py` was proved before it was trusted (`--make-synth` writes a trace from the truth's own onsets, contour, drops and
sections): shift 0 → F 1.000 on all three classes, lag median +7 ms (one frame is the floor, not zero), sub pitch 100 % of
4539 frames, kicks on bare 808s 0 %, drops 2/2 within 11 ms, returns 5/5, tonic right, slides 27 of 41 with 27/27 signs and
the truth's own median span. The same trace shifted +20 ms → lag median +24 ms and F 0.63, because a 20 ms offset plus frame
quantisation pushes ~40 % of a 0.1 s hat grid outside the ±30 ms window. The one row that fails on the perfect trace is
`boundaries ±1 beat` (7 of 11) — the trace carries E0's OWN bar-pinned boundaries, so that is the §2.4 finding, not a bug.

---

## 7. Interfaces I could not implement exactly as frozen

1. **`pulse` needs the grid beat, which the ears cannot know.** The frozen definition is "0.5 / 1 / 2: the felt beat as a
   multiple of the grid beat", and v3's `bpm` owns the grid. `PulseTrack` therefore takes `opts.pulse.beat` (seconds) and
   falls back to `BEAT_DEFAULT` 0.5 s; the node test passes `60 / truth.bpm_grid.bpm`. **The orchestrator must wire
   `Ears`'s `opts.pulse.beat = 60 / MS.bpm`** (or call `ears.pulse.setBeat()` when `bpm` changes) or `pulse` is only a shape.
2. **`pulse` is a RATE multiple, not a period multiple.** The brief says half time is 0.5, and half time means a felt period
   twice the grid beat — so the field is `grid beat / felt period`. Implemented that way.
3. **`pulse` does not distinguish SeeYouDrop's drop sections from its groove.** The felt period measured by the ACF of the
   kick+snare train is 0.800 s in the groove as well as in the drops, so `pulse` reads 0.5 through most of the track. That
   agrees with the truth tool's own ACF (75 BPM in the loudest 30 s) and disagrees with the brief's use of half-time as a
   distinguishing feature of the drop sections. Measured first: the kick inter-onset interval alone does NOT separate them
   (median 2.92 against 3.35 of the fastest layer), which is why this is an ACF and not a ratio of medians.
4. **`subCents` is cents from the nearest equal-tempered note, not from `tonic`.** The frozen field list says "cents of
   `subHz` from the nearest equal-tempered note, −50..50" and the spec's E3 paragraph says "vs `tonic`". I implemented the
   field list's version (the nearest note), because that is the one that is well defined in −50..50 and the interval to the
   tonic is `(subNote − tonic + 12) % 12`, which a scene can compute.
5. **`Ears` needs `PercTrack`'s band powers for the sub's gate.** `SubTrack` alone cannot decide whether the sub OWNS the low
   end, so `Ears.push` sets `sub.share` from `perc.e` once per block. `SubTrack` is still usable standalone (it defaults
   `share = 1`), but the share test is what takes `subNote` from 88.5 % to 93.2 % and it lives in the facade.
6. **The drop rule needed a second gate the brief does not name** — kicks per second over the 8 bars after the bar line. The
   brief's rule ("the section after it is among the track's loudest") cannot work on a limited master; §4.1 has the numbers.
7. **`buildMap` imports from `engine/ears/`.** The brief allows imports within `engine/ears/`, `engine/map/` and
   `assets/math/`, and the map reuses `PercTrack`, `SubTrack` and `FFT` rather than duplicating them. `node tools/check.js`
   is happy (both live under `assets/engine/`).
8. Not implemented, because it was not asked for and the brief's field list does not have it: a `subNoteAge`. `subNoteEvt`,
   `subIn` and `subOut` fire as events but carry no age column (only kick/snare/hat do, per the frozen list). The audio time
   is in `ears.events` and in the trace's `log`, so the orchestrator can place them; if a scene needs an age for the sub, the
   field list has to grow.

---

## 8. Friction log — every sentence the docs lack, every guess

1. **The brief's acceptance 4 (`drops = [57.6 ± 0.017, 105.7 ± 0.017]`) is not satisfiable as literally written.** The two
   annotated numbers are 48.1 s apart = 120.26 beats at 150 BPM, so they cannot both be bar lines of one grid. The audible
   entries are 57.609 and 105.621 and the bar lines are 57.606 and 105.596. I graded against the bar lines and said so.
   *Missing sentence:* the annotation's `drops` are 10 Hz-coded, ±0.1 s.
2. **"the four walk notes 13.0 / 16.1 / 19.3 / 22.6 s give `subNoteEvt` within 50 ms"** — the first of those four is 200 ms
   after its own attack (12.799). Graded against the truth's 100 Hz YIN arrivals instead, with the annotation's numbers
   reported beside them. *Missing sentence:* which of the annotation's times are attacks and which are run-length labels.
3. **"`subHz` within ±30 cents on ≥ 90 % of sub-loud frames"** is not reachable against `contour.f0td` frame by frame,
   because the reference is 37–77 % self-consistent at that tolerance in four of its own sections. §3.1. *Missing sentence:*
   what tolerance the reference itself supports, per section.
4. **"`subGate` closes on drop 2's ducks (count per bar)"** — no target number was given. I report 0.77 edges/bar and
   assert ≥ 0.5, which I chose.
5. **"a kick needs the beater click (a 2–8 kHz transient within ±15 ms)" and "≤ 5 % of kicks on bare 808s"** are in tension
   on this track, and 5 % is chance level for a 15 ms window over 275 bare onsets. §3.2. *Missing sentence:* which of the
   two to prefer when they conflict.
6. **`pulse`'s convention** (rate or period) and **where the grid beat comes from** are both unstated. §7.1–7.3.
7. **`subCents`' reference** is given two different ways in the brief and the spec. §7.4.
8. **The `Band` Q convention.** Nothing says how wide a band-pass should be; a constant-skirt cascade with
   `Q = fc/(hi−lo)` is 2 octaves wide at the skirts for a 22–75 Hz band, which let drop 1's 70–150 Hz impact into the sub
   gate. I added a `steep` (4th-order HP+LP) and a `steep6` kind and said which band uses which.
9. **`tools/.pylib` has numpy and soundfile but not scipy** — scipy 1.15.3 is a system package. `trackmap.py`'s own docstring
   says scipy lives in `.pylib`. It works either way; the docstring is wrong.
10. **`--brief` returns before the new section**, so `others-brief.txt` is unchanged by E0 and the new keys only exist on a
    full run. That is the behaviour I wanted; nothing in the brief says which.
11. **Guess:** the map's `sections[0].t0` is forced to 0 and the last `t1` to `dur`, so the section list covers the track.
    The first bar line is at 0.036 s, not 0.
12. **Guess:** `mapCross(map, tPrev, t)` treats the boundary at t = 0 as not crossed (no frame's half-open interval contains
    it), so a 60 Hz sweep sees `sections.length − 1` boundary frames. If the page wants a boundary event on frame 0, the
    orchestrator has to fire it.
13. **Guess:** `EARS_FIELDS` includes the event fields (they appear as 0/1 columns in the trace), since the frozen field list
    mixes events and continuous fields and `compare.py` needs the columns.
14. **A trap worth writing down:** node's ESM loader caches by resolved URL, so appending `?v=` to a module's path does NOT
    re-load the modules IT imports. My first constant sweep silently re-ran the same code ten times. Constants that need
    sweeping now come in through an `opts` object (`PercTrack`, `TonicTrack`, `buildSections`, `buildMap`) instead.
15. **The mislabelled time axis in §2.3** cost the most: about an hour chasing a 130 ms error that did not exist. The lesson
    is in the brief already ("measure, then change") but it needs a corollary: *check the instrument's own time base before
    believing what it says about the music.* A 1 ms hop at 44.1 kHz is 44 samples, and 44/44100 ≠ 0.001.

## 9. The temptation list

* To open `assets/engine/feats.js` — I did, and it is on the "may read" list (the entry shape). No page file was edited.
* To lower the `subHz` ruler's tolerance until it passed. Instead I measured the reference against itself and added a
  note-level ruler that means something to a scene.
* To widen `CLICK_W` to 35 ms, where kick F is 0.76. 25 ms already fails the bare-808 ruler; 35 ms fails it further for
  +0.03 of F.
* To fit the map's grid phase to the python tool with a magic offset. The comb-sum phase (§4, item 2) is a real estimator
  and lands within a frame on its own.
* To count the walk↔outro-walk return as "close enough". Instead the clustering threshold was swept and the test's return
  criterion was made explicit (a shared cluster between sections OVERLAPPING each annotated range, with `ret` set), because
  midpoint-to-midpoint is wrong for a 20-bar section that splits.
* To skip the 48 kHz run while tuning. The 48 kHz map failure (§4, item 3) would have shipped silently.

## 10. Anything wrong in the docs

* `trackmap.py`'s docstring said scipy is in `tools/.pylib`; it is a system package (§8.9). Left alone — it is a v0.14 line
  and changing it would touch a pre-existing byte.
* `SeeYouDrop.sections.json`'s `drops[1]` (105.7) is 0.10 s later than the bar line and 0.08 s later than the audible sub
  entry; its four walk-note times are run-length labels, not attacks; `not_drops[0]` ("intro ~9–10 s") should read ~12.8 s.
  I did not edit the file — the brief says not to — but the orchestrator should, before it is used as a reference again.
* `docs/workers/brief-ears.md` calls `PercTrack`'s beater window `CLICK_W` in units of hops in one place and seconds in
  another; mine is seconds.

## 11. What is where

```
tools/truth/trackmap.py                 E0: +grid +beat/bar/4bar grains +sections +drops +tonic +slides +bare808 +stereo/48k dumps
tools/truth/compare.py                  the ruler table from a frozen trace; --make-synth for its own proof
tools/truth/SeeYouDrop.{json,txt}        regenerated; v0.14 keys and tables byte-identical
tools/truth/SeeYouDrop/grain-{beat,bar,4bar}.txt   the beat-synchronous grains
tools/truth/{CyborgNinja,WhoLikesToParty,Malicious}.json + dirs   the other three, full
assets/engine/ears/{dsp,sub,perc,tonic,texture,pulse,ears,feats}.js   E3, 29 fields, 0.060 ms/block
assets/engine/map/{map,beats,sections,drops}.js                       E4-DSP, 1.6 s/track, deterministic
tools/test_ears.js                      19 rulers x 2 rates, --trace writes the frozen format, --cost, --verbose
tools/test_map.js                       27 rulers x 2 rates, --others for the other three tracks
tools/work/*                            gitignored: the probes, the sweeps, the trace, the ruler markdown
```
