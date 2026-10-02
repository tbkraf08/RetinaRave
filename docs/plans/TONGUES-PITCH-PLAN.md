# Arnold tongues on PITCH — consonance as phase-locking, a plan and a probe (2026-10-02)

Written on the user's word ("plan — do not build — the pitch side"), on v0.27 (`311d09a`). **STATUS: phases 2 and 3 BUILT 2026-10-02
(DECISIONS §81 `53c2ae9`, §82 `55da70e` + `2efc3fd`; phase 2's stop rule was reached and is answered in §81 — the void outranks
the drop in the MEASURE, not the normaliser; phase 3's pull is behind `&shade=1`); phase 1 declined — see §9.** The brief, in one line: the same circle map as
the rhythm bank (`docs/plans/TONGUES-PLAN.md`, §76–§78), with Ω the frequency ratio of two tones; inside the p/q tongue
the partials phase-lock and fuse, just outside they drift and beat; tongue width ~ K^q is the mistuning tolerance, so
consonance follows the Farey order (2:1 > 3:2 > 4:3 > 5:4 …) and equal temperament works because the ET fifth (1.4983)
sits well inside the 3:2 tongue at any realistic K. Asked of it: which rationals lock, how deep, the implied K, a
continuous harmonic tension, a major / minor shading per bar, and a look at Vienna's drop 2 (§66: a REGISTER change
that energy and pitch events could not see before the beat). The plan answers with the engine's numbers and a probe.

## 1. The problem, in numbers — what harmony the engine carries today

| # | field | what it is | what it reads | the gap |
|---|---|---|---|---|
| i | `tension` | **already Sethares roughness**: `features-slow.js` peak-picks the 8192 analyser 60–5000 Hz, the strongest 12 partials ≥ 4 % of the max, `Σ a·(e^{−3.51 s} − e^{−5.75 s})/Σ a` with `s = 0.24·Δf/(0.0207 f₁ + 18.96)`, then a running `rLo`/`rHi` normaliser (0.002 / step) and a 0.35 s ema | per-section p50 (the probe's offline replica, `tension~`): SeeYouDrop walk 0.17 → groove 0.28 → **void 0.56** → last 5 bars 0.36 → drop 0.32; breakdown 2 0.20 / 0.38 → drop 2 0.27. Vienna intro 0.22, **dream 0.15 (its minimum)**, drop 1 0.28, bars 36–39 0.16, drop-2 bar 0.40, after 0.19. Track ranges 0.12–0.56 (SYD), 0.18–0.33 (CN), 0.13–0.25 (WLTP), 0.12–0.52 (Mal), 0.15–0.53 (Vienna) | it peaks on the noise risers 8 s before SeeYouDrop's drop 1 and FALLS into the drop — §57 step 3's "a build that never arrived" is the shape, not a bug. It is a dissonance, read as one by DUST (jitter only), TORUS2 (`delta` 0.6·t, `morph` 0.9·t), GIELIS (`lean`), MAXWELL (shear, lens), NAV (`reach`), FEIGEN |
| ii | `chroma` + `key`/`mode`/`keyConf` | synapse's 12-bin chroma (65–2100 Hz, 12 s ema), KK key; since §62 `key`/`mode` are the ears' tonic (130–2100 Hz + the sub's YIN class, 11 s) — ONE key per ~11 s, `keyConf` on synapse's scale (SeeYouDrop 0.27, so `keycolour.js` barely moves the hue) | the five tracks' truth tonics: C♯m (human), C♯m, DM, GM, D♯m; `modeShade` would be the chord quality PER BAR (SeeYouDrop's walk C♯1–A1–F♯1–E1 = **i–VI–iv–III**, minor–major–minor–major every two bars) that one key read cannot carry | nothing in `MS` says major / minor per bar; `harmAngle` is a chroma centroid on the circle of fifths, `interval` the bass–top pitch-class gap (NAV's bulb) |
| iii | Vienna drop 2 (106.669) | §66: the 38–46 Hz sub leaves, a 60–150 Hz bass enters an octave up; **0 beats** of causal lead on energy (§64) and on the bass/sub ratio (−0.01 dB at beat −1) | a ratio-based measure folds octaves away by construction (Ω ∈ [1, 2]); the probe asks whether the CONSONANCE moves before the beat anyway | §3 — it does not |

## 2. The measure (what the probe computes; `tools/truth/tongues/pitch-probe.py`)

Per 2048-sample hop (42.7 ms) an 8192 FFT (5.86 Hz bins — the engine's slow analyser, `XS.binS`), the engine's own
peak pick (60–5000 Hz, the strongest 12 ≥ 4 % of the max, parabolic bins), plus the truth's 100 fps YIN sub f0 as a
precise low partial carrying the 25–120 Hz band's amplitude (a 5.86 Hz bin cannot place a 38 Hz root to a semitone; the
ears run the same YIN). For every pair (i < j): r = f_j/f_i folded into [1, 2) (octave equivalence), weight w =
min(a_i, a_j) — Sethares' weighting, so the bank and the control share weights. **The tongue table** is the sine circle
map's, computed exactly: for K on a 0.05 grid and Ω on a 1/6000 grid the p/q tongue is the Ω interval where a period-q
orbit exists (f^q(θ) − θ − p changes sign), the 13 rationals with q ≤ 6 in [1, 2]. Two corrections the brief did not
foresee: (a) in bare Ω the sine map's tongues are **skewed off p/q** (at K 0.5 the 5/4 tongue sits at 1.2592–1.2602 — the
ET third, by coincidence), and a measured pair of partials has no "bare" frequency, so each tongue is centred on p/q
with its measured width (Shapira Lots & Stone 2008's convention: consonance = width AT p/q); (b) the 1/1 tongue is
**132 ¢ wide at K 0.5, 276 ¢ at K 1** — the band where Plomp–Levelt hear ROUGHNESS and the circle map says "fused"; it is
kept apart as `unison` and excluded from fusion. Per pair at K₀: the lowest-q tongue holding r, depth d = 1 − |Ω −
p/q| / half-width (1 centre, 0 edge), ¢ to the edge, and the implied K = the smallest K on the grid at which r locks
to any q ≤ 6. Per frame: `fusion` = Σ w·d / Σ w (1 − fusion = **harmTension**), `cons` = Σ w·d/q / Σ w (depth in Farey
order), `beating` = the w-share in no tongue, `modeShade` = (M − m)/(M + m) over the 5/4 + 5/3 vs 6/5 + 8/5 tongues,
`pitchK` = the w-median implied K; and the control `rough` (Sethares, the engine's formula) + `tension~` (through the
engine's `rLo`/`rHi`). Aggregated per beat, bar and truth section; the drop test is probe.py's (trailing W-beat windows
ending at beats −4…−1, z against the 32 beats ending 16 earlier, FA = the share of beats > 16 from any drop at the same
|z|). 1.3–2.5 s per track; `tools/work/tongues/pitch-K{0.5,1.0}.md` hold every table.

## 3. The probe — three tables

**Theory first: the tongue table in cents (the mistuning tolerance), and where ET lands.** Width at p/q:

| K | 1/1 (unison) | 6/5 | 5/4 | 4/3 | 7/5 | 3/2 | 8/5 | 5/3 | 7/4 | 2/1 |
|---|---|---|---|---|---|---|---|---|---|---|
| 0.25 | 69 | 0 | 0 | 1 | 0 | 5 | 0 | 1 | 0 | 34 |
| 0.5 | 138 | 0 | 1 | 5 | 0 | 22 | 0 | 4 | 1 | 69 |
| 0.8 | 220 | 5 | 10 | 21 | 4 | 56 | 4 | 17 | 7 | 110 |
| 1.0 | 276 | 13 | 22 | 39 | 13 | 85 | 11 | 32 | 15 | 138 |

ET against it: the fifth (−2.0 ¢ off 3/2) locks from **K 0.25**, depth 0.82 at K 0.5 — the brief's claim holds; the
fourth (+2.0 ¢) from K 0.5 (depth 0.28); the octave from K 0.05. **The thirds and sixths never lock at any K ≤ 1**: the
ET major third is +13.7 ¢ off 5/4 against a half-width of 11 ¢ at K 1 (0.5 ¢ at K 0.5); the minor third −15.6 ¢ against
6.5 ¢; the sixths ±14–16 ¢ against 16 / 5.5 ¢. The sine map's Farey hierarchy is far steeper than the ear's: at K 0.5 the
fifth tolerates 22 ¢ and the major third 1 ¢, where Plomp–Levelt put the two intervals within a factor of ~1.5 of each
other. So on equal-tempered music the bank sees octaves, fifths and fourths; a third registers only when it is EXACT —
i.e. the 4th / 5th and 5th / 6th harmonics of one tone, which every harmonic timbre has.

**The five tracks, K₀ 0.5 (K 1.0 in brackets where it changes the reading), whole track from 8 s, p50:**

| track | truth | cons | fusion | beating | pitchK | rough (Sethares) | `tension~` | cons ~ rough r (per beat) | modeShade K 0.5 → K 1 | bars major / minor at K 1 |
|---|---|---|---|---|---|---|---|---|---|---|
| SeeYouDrop | C♯m | 0.058 (0.132) | 0.071 (0.219) | 0.867 (0.596) | 1.00 | 0.0251 | 0.258 | −0.43 | 0.000 → **+0.539** | **98 % / 0 %** |
| CyborgNinja | C♯m | 0.066 (0.140) | 0.088 (0.243) | 0.849 (0.574) | 1.00 | 0.0245 | 0.294 | −0.53 | 0.000 → **+0.664** | **99 % / 0 %** |
| WhoLikesToParty | DM | 0.099 (0.184) | 0.120 (0.290) | 0.798 (0.525) | 1.00 | 0.0196 | 0.190 | −0.61 | 0.000 → +0.551 | 100 % / 0 % |
| Malicious | GM | 0.098 (0.187) | 0.113 (0.273) | 0.802 (0.528) | 1.00 | 0.0259 | 0.329 | −0.46 | 0.000 → +0.352 | 89 % / 1 % |
| Vienna | D♯m | **0.191** (0.283) | 0.214 (0.409) | 0.678 (0.407) | 0.85 | 0.0214 | 0.247 | −0.22 | 0.000 → **+0.306** | **76 % / 14 %** |

What it says. (1) **Fusion is a timbre fact, not a harmony fact**: Vienna's D♯1/F♯1 drone with its octaves and fifths
fuses 0.21, SeeYouDrop's sine sub under noise hats 0.07; per section the spread inside a track (fusion: SYD 0.03–0.09, Vienna
0.15–0.28) is the same order as the spread between tracks. (2) **`cons` is the Sethares roughness, half seen**: r = −0.22
… −0.61 per beat on all five — the bank and the control disagree where the bank is blind (thirds, seconds, the
unison band) and agree where both see octaves and fifths. (3) **`modeShade` is dead at K 0.5 (0.000 everywhere: no
third locks) and biased MAJOR at K 1 on all five tracks — 98 / 99 / 100 / 89 / 76 % of bars on three minor and two major
keys** — because the 5/4 tongue is wider than the 6/5 at every K and every harmonic tone feeds it its own 5th / 4th
harmonic. SeeYouDrop's annotated walk, the honest per-bar test: minor-degree bars (C♯, F♯ = i, iv) +0.64, major-degree
bars (A, E = VI, III) +0.73 — no separation. (4) `pitchK` saturates at 1.00 (the median pair needs K ≥ 1 to lock to any
q ≤ 6) on four tracks; only Vienna's drone reads 0.85.

**The drops** (W 4 beats, |z| ≥ 3 held to beat −1 = lead; FA3 = the share of far beats at |z| ≥ 3; CyborgNinja's column
is the false-arm control; the 4 bars before → after, p50):

| field | SYD 57.6 | SYD 105.6 | WLTP 57.5 / 131.4 / 188.8 | Mal 148.3 | Vienna 85.3 | **Vienna 106.7** | FA3 % SYD / WLTP / Mal / Vienna | **FA3 % CyborgNinja** |
|---|---|---|---|---|---|---|---|---|
| `cons` | 0 | **5 beats, rising** (0.048 → 0.046 across) | 0 / 0 / 1 (falling) | 0 | 0 (0.204 → 0.169) | **0** (0.185 → 0.152) | 11.9 / 3.0 / 6.6 / 1.3 | **17.3** |
| `beating` | 0 | 0 | 0 / 0 / **6, rising** (z +8.6 at W 16, FA 0.5 %) | 0 | 0 (0.64 → 0.71) | 0 (0.69 → 0.72) | 9.4 / 3.0 / 3.7 / 0.0 | 19.0 |
| `pitchK` | 0 | 0 | 0 | 0 | 0 (W 16: z −10.4, FA 1.8 %: the dream is the most lockable stretch) | 0 | 6.7 / 5.7 / 6.8 / 1.3 | 1.5 |
| `rough` | 0 | 0 | 0 | 0 | 0 (0.010 → 0.022: the drop doubles it) | 0 (0.021 → 0.023) | 11.9 / 3.0 / 15.0 / 1.3 | 10.8 |
| `tension~` | 0 | 0 | 0 | 0 | 0 | **0** (z +2.6 at beat −1 only, W 2: 0.05 → 0.57 over the last bar, FA 2.7 %) | 12.8 / 2.0 / 10.7 / 1.8 | 8.1 |

**Vienna drop 2: no lead, on any field, at K 0.5 or 1.0.** The folded ratio structure of D♯/F♯ an octave up is the
same structure; `cons` moves 0.185 → 0.152 across the beat, inside Vienna's own section spread. The roughness replica
rises on the LAST bar (0.05 → 0.57, FA 2.7 %) — one beat, the same "starts on the drop" §66 measured. §64 / §66 stand.
Where a harmonic field DOES move it is a **breakdown** signal with the sign flipping between tracks — SeeYouDrop's
breakdown 2 is its most consonant stretch (cons z +11 at W 2, FA 0.0 %), WhoLikesToParty's third breakdown its most
beating (z +8.6, FA 0.5 %) — and CyborgNinja fires `cons` at |z| ≥ 3 on **17.3 %** of its beats. The void / sub-void /
tongueAmbig paths already arm those breakdowns (§54 / §64 / §77). **No fourth arming path.**

**Cost, measured in node** (`FFT` from `ears/dsp.js`, 48 kHz): one 8192 FFT **223 µs**; the peak pick + 78 pair folds
+ table lookups **17 µs**. Sharing `TonicTrack`'s existing FFT (`CH_EVERY` 32 hops = one per 0.37 s): 17 µs × 2.7 /s ≈
**0.8 µs per 60 Hz frame**. Its own FFT at a per-beat rate (4 /s): (223 + 17) × 4 ≈ **16 µs/frame** — six times the
rhythm bank's 1.6–2.7 but 1 % of the 1.5 ms budget. The tongue table is 20 × 13 half-widths, a constant.

## 4. The fields it WOULD publish (house style; written so an override has a spec, not as a recommendation)

| field | kind | what | from |
|---|---|---|---|
| `consonance` | level | Σ w·d/q over the pair bank, octaves 1 … sixths ⅓ … thirds ¼ – ⅕; eased 0.3 s | the ears' partials |
| `fusionDepth` | level | Σ w·d — the lock share of the pair energy (Vienna's drone 0.21, a sine sub under hats 0.07) | — |
| `harmTension` | level | 1 − `fusionDepth`: the brief's continuous ambiguity | — |
| `fusionP`, `fusionQ` | count | the deepest locked tongue's rational (2/1, 3/2, 4/3 …), per beat | — |
| `beating` | level | the w-share of pairs in no tongue at K₀ | — |
| `pitchK` | raw | the w-median implied K (0.05–1): how much coupling the frame's intervals need to fuse | — |
| `modeShade` | raw | **NOT from the bank** (§3 item 3) — see §6 (b) for the honest source | — |
| `pitchOn` | count | 1 running · 0 warming · −1 off (`&pitch=0`), `tongueOn`'s convention | — |

Seven FEATS entries, seven Appendix A rows, `fake.js` constants (fusion 0.3 / tension 0.7, `pitchOn` 1). **Where:**
`assets/engine/ears/pitch.js` (pure, node-importable) fed from `TonicTrack.hop` right after its `fft.mags` — the 8192
magnitude array and the sub's YIN note exist there — publishing through `features-ears.js` like `tonic`. **Parity:** the
ears' ring is the PCM bus with sample stamps (`docs/HARNESS.md` "PCM bus"), so det = node = capture is the §56 standard
and `tools/test_ears.js` grows a `--pitch` ruler against `pitch-probe.py` (node = probe within ±0.02 fusion). The
rhythm bank's drive is the clock's flux; this one's is the ears' spectrum — nothing is shared between the two banks but
the tongue idea and the `−1` convention.

## 5. Proofs (if built)

1. `node tools/check.js` 0 fail, `npm test`, `tools/test_pitch.js`: two sines at 3:2 give `fusionQ` 2 and depth → 1 at
   K 0.5; at 1.4983 depth 0.82 ± 0.02; at 1.26 (an ET third) `beating` 1.0; a sawtooth alone fuses ≥ 0.6; silence 0.
2. **Node = probe** on the five dumps: `fusionDepth` per section within ±0.02 of §3's table (the probe's sub partial is
   the truth's YIN; the engine's is its own — the one difference, bounded by `test_ears`' recorded 88.4 % `subNote` agreement, §62).
3. Page = node on the seven fields (`build-node.js --cmp`), two det runs `cmp`-identical, `scene-md5.sh` 0 / 24 until a
   scene reads a field. 4. Cost: `CARD.ENGINE.EARS.cpuTotal / frameN` ≤ +0.002 ms on the page.

## 6. Consumers and migration — each one phase, each with a receipt, each gated

- **(a) `tension`'s readers → `harmTension`?** The probe says NO for every reader: `harmTension` = 1 − fusion is r −0.22
  … −0.61 against the roughness the readers already have, blind to thirds, seconds and the unison band (where
  dissonance lives) and sensitive to octave / fifth timbre (where it does not). DUST keeps roughness as jitter (§57 step
  3), TORUS2's `delta` / `morph`, GIELIS' `lean`, MAXWELL's shear and NAV's `reach` keep `tension`. **What the probe DID
  find about `tension`**: its `rLo` / `rHi` normaliser (0.002 / step, floor `rLo + 0.03`) turns a 0.014–0.043 raw range
  into 0.12–0.56 that peaks on noise risers 8 s before a drop (SYD 44.8–49.6 s: 0.56) and sits at 0.42 through a groove —
  §57's finding is the normaliser's shape. A receipt-able fix is one phase, S: raw `rough` against a per-track 30 s
  p10 / p90 (`loudAbs`'s convention), measured on the five tracks' section tables above before any scene moves.
- **(b) `modeShade` beside `harmAngle` — from the KEY, not the bank.** The brief's per-bar major / minor is the chord
  quality the key implies for the bass's scale degree: in a minor key degrees 1, 4, 5 carry minor triads and 3, 6, 7
  major (and the mirror in major). `modeShade = quality(degree(bassPc − key), mode)` from `key` / `mode` (the ears'
  tonic, §62) and the sub's note (`subNote`, YIN, 88.4 % against the truth per `test_ears`) or `bchroma`'s root — zero DSP, per bar. Receipt:
  SeeYouDrop's walk reads i / VI / iv / III = −1 / +1 / −1 / +1 bar by bar against `SeeYouDrop.sections.json`'s annotation;
  Vienna's D♯ drone reads −1 throughout; `keycolour.js` gains an optional per-bar PULL beside its per-key one, behind a
  flag, `scene-md5.sh` unchanged until a scene opts in. S. The user's eye: TORUS2 on SeeYouDrop 0:13–0:26 in stream mode.
- **(c) The build detector's fourth arming path: NOT proposed.** 0 beats on Vienna 106.669 and 85.336, 5 beats on
  SeeYouDrop 105.6 at a threshold CyborgNinja crosses on 17.3 % of beats (§77's gate is 0 arms). The fields that move
  before SYD 105.6 and WLTP 188.8 move with opposite signs and are the breakdowns the void already reads.
- **(d) What the probe revealed:** `fusionDepth` is a per-track TIMBRE descriptor (Vienna 0.21 vs 0.07–0.12) — the
  one thing the bank measures that nothing in `MS` does. Its only honest consumer is a palette-level "how much of the
  low end is one note" (e.g. TORUS2's fog saturation), opt-in, S, and only if a scene asks for it.

## 7. The A/B shape (if any phase is built)

Stream mode, track time. (b): TORUS2 / DUST on SeeYouDrop 0:13–0:26 and 2:11–2:36 (the walk and its return), the hue
PULL per bar on / off via `&modeShade=0`; the user says whether the i / VI alternation reads. (a)'s fix: DUST's jitter on
SeeYouDrop 0:25–1:00 with `&tension=raw`, the §57 receipt table re-taken. Phase 1 has no A/B — it is shadow by design.

## 8. Phases

| # | phase | size | gate | stop if |
|---|---|---|---|---|
| 0 | **this probe** — `pitch-probe.py`, the three tables in §3, the K sweep (0.5 / 1.0) | S | done | — |
| 1 | `ears/pitch.js` + 7 fields in shadow mode (§4), `test_pitch.js`, node = probe | M | **NOT RECOMMENDED** (§9); built only on the user's explicit override | node ≠ probe beyond ±0.02 fusion; > 2 µs/frame on the shared FFT |
| 2 | `tension`'s normaliser: raw `rough` on a 30 s p10/p90, measured on the five section tables, no scene moved | S | **done 2026-10-02, §81 `53c2ae9`** — p10 / **p98** (p90 lifts every groove +0.13; p98 keeps the five medians ±0.06); drop ≥ void on **3 of 4** (v0.28: 2 of 4) and the new field moves WITH the raw roughness across all eight truth drops (v0.28 against it on three); the groove reads 0.40 (was 0.36, never ≤ 0.3 on the page); `d_nstep` and every drum / grid column bit-identical; `&rough=0` the exact before | **reached and answered**: SYD's void outranks its drop in the MEASURE (raw 0.038 vs 0.028 — a noise riser is rough) and Vienna's dream is the measure's minimum (raw 0.010); the fix is kept for what it does fix (the history dependence) and `tension` is declared not a build-to-drop tension (that is `buildLive` / `tongueAmbig`) |
| 3 | `modeShade` from the key + the bass degree; `keycolour.js` per-bar PULL behind a flag | S | **done 2026-10-02, §82 `55da70e` + `2efc3fd`** — the walk reads −1 +1 −1 +1 on **8 of 8 bars** (file and causal paths; the degree is a property of the diatonic SET, so the tonic's C♯ / A / F♯ wander on the walk does not matter); `scene-md5.sh` **24 / 24 identical** flag off AND flag on (the fake mirrors 0); `&shade=1` on real music moves the major bars warm (A: teal → orange) and the minor bars not at all | not reached: 0 misreads; Vienna's dream has NO sub (the drone leaves) and reads a steady cool lean through the bass chroma; its grooves are a riff (i / v / III within the bar), not a drone |
| 4 | `fusionDepth` to one scene's palette, opt-in | S | only if a scene asks; Vienna vs SeeYouDrop reads on screen | nobody asks |
| 5 | the build detector's fourth path | — | **not proposed** (§6 c) | — |

## 9. Verdict

**The tongue bank on pitch is not the right primitive for this engine, and phase 1 should not be built.** Three measured
reasons. (1) The sine circle map's Farey hierarchy is wrong for the ear by an order of magnitude: at K 0.5 the fifth
tolerates 22 ¢ of mistuning and the thirds 0–1 ¢, so ET thirds and sixths never lock at any K ≤ 1 and the 132–276 ¢
"unison" tongue sits exactly where Plomp–Levelt put roughness. What survives — octaves, fifths, fourths — is a timbre
fact (Vienna 0.21, the rest 0.07–0.12), correlated −0.2 … −0.6 with the Sethares roughness the engine ALREADY publishes
as `tension`. The standard roughness model is the control, and it wins: it is the thing the brief's consonance would
replace, it already exists, and its only measured fault is its normaliser (phase 2, S). (2) `modeShade` from the bank
is dead (0.000 at K 0.5) or biased major on every track at K 1 (76–100 % of bars, three minor keys) because the harmonic
series is a major chord; the per-bar major / minor the brief wants is a key-relative fact and costs nothing (phase 3,
S). (3) Vienna's drop 2 gives the pitch bank 0 beats of lead at both K, as it gave energy and pitch events (§64, §66);
the breakdowns it does see, the void already arms, and CyborgNinja fires 17.3 % of its beats at the same threshold.
Recommended: phases 2 and 3 only, each S, each with the receipt above; phase 1 and the fourth arming path are declined
on the numbers. The probe stays as the measurement that decided it, like `probe.py` did for the rhythm side.
