# Arnold tongues for the engine — a circle-map phase-locking descriptor, a plan (2026-10-01)

Written on the user's word ("start planning tongues"), on v0.26 (`1a5eadb`). **STATUS: phases 1–4 built on the user's word
("rec for tongues approved"), 2026-10-01 — see the phase table in §8 for the hashes; DECISIONS §76 / §77 / §78.** The probe in
`tools/truth/tongues/{env,probe}.py` is the measurement the build was graded against. The brief, in one
line: θₙ₊₁ = θₙ + Ω − (K/2π)·sin(2πθₙ); the winding number locks to p/q over whole intervals of Ω (the tongues, width
~ K^q, Farey-ordered); a bank of such oscillators driven by the onset envelope gives, per window, which rationals lock,
how deep inside the tongue each sits (robustness), the implied K (accent salience) and 1 − depth as tension. The plan
below answers the brief with the engine's own numbers and a probe run on the five truth tracks.

## 1. The problem, in numbers — three places this session fought phase-locking by hand

| # | the fight | before | after | what decided it |
|---|---|---|---|---|
| i | **octave / half-beat.** Vienna's PCM clock at 2× the felt beat (§61): 179.5 BPM over 85–107 s, 120 over 132–161 on a 90.00 track | 62.3 % of frames in octave, \|lag\| p90 315 ms | 95.6 %, p90 86 ms | `period.js alive`: a tempo whose own ACF lag is still alive is not left |
| i | CyborgNinja on the OTHER lattice (§59): kicks on every 8th, 236 vs 213 within 0.15 beat of each lattice, Kalman weight 485 vs 477 — a coin flip | +179 ms, `beat` F 0.004, never locked | −9 ms, F 0.896, locked 19.3 s | `lattice()`: two 90 s leaky energies of the 40–150 Hz flux, margin 0.06, 4 s net hold |
| i | SeeYouDrop's PCM lock 9.2 → 12.0 s (§71 item 3, open) | — | — | not decided |
| ii | **"the double time should accent, not drive"** (Vienna 1:25, §61/§66): 2.90 nudges/s against the music's 1.50 | 1.93× | 1.07× | the octave fix above; an 8th nudge was measured and REJECTED (§66: CyborgNinja's 16th hats fire the same gate at 5.33 crests/s) |
| iii | **a continuous tension for the build detector.** Vienna's drop 2 (106.669): §64 searched 60 candidates × 7 grains × 4 transforms on energy, §66 the bass/sub ratio (−0.01 dB at beat −1, crossover ON the drop beat) | 0 beats of lead | 0 beats | nothing shipped; "a texture jump with no causal precursor" |

Each of (i) is a hand-built phase-locking rule with its own band, window and margin. The question the brief asks is
whether one principled object — the tongue bank — gives the same three answers, plus a tension, from first principles.

## 2. The measure

Per 512-sample hop (10.67 ms, the clock's own hop) and per oscillator i with natural rate f_i = Ω_i · f_ref:

```
θ_i += f_i·dt − (K/2π)·ô·sin(2πθ_i)          ô = max(0, o − baseline_1s) / (its 8 s mean per hop · hops per cycle of i)
λ_i  = Σ ln|1 − K·ô·cos(2πθ_i)| per cycle     depth d_i = (1 − e^{λ_i}) / K  ∈ [0, 1]
```
On a click train at period T this IS the sine circle map with Ω = f_i·T. **The drive must be the novelty** (strength
minus a causal ~1 s baseline, rectified — `tempo.js` removes a 1 s running mean for the same reason): fed the raw
strength, which has a DC floor every hop (p50 0.25–0.54), nothing in the bank locks (first run: d ≤ 0.02 everywhere).
`d` is the honest lock test: at a fixed point λ = ln(1 − K·cos 2πθ*), so **d = cos 2πθ* — 1 at the tongue's centre, 0 at
its edge** — a continuous, truth-free distance into the tongue; an unlocked oscillator reads ≈ 0. Energy on the
anti-phase (the off-8th, cos = −1) RAISES λ, so d₁:₁ falls toward 0 as the two half-beat lattices become symmetric: it is
§59's `lat` in circle-map form. A tongue p/q in a window = the contiguous run of bank oscillators with |ρ − p/q| < 0.02
and d > 0.05 (ρ = the realised rotation in beats); its **width** (octaves of Ω) is the robustness to tempo drift and the
implied **K = 2π · (1:1 half-width)**. Two copies of the bank (θ₀ = 0 / 0.5) say whether a lock is **bistable**.

## 3. The probe (`tools/truth/tongues/env.py` + `probe.py`; 7 s for five tracks, no page, no audio)

`env.py` reproduces `clock.js strength()` offline (NFFT 2048, hop 512, `o = (flux + 3·bflux)/100`, `s40` = the 40–150 Hz
flux of §59's lattice check) and adds `smid` (150–2500 Hz, the §69 snare lane's band) from the same FFT — three drives.
Bank: Ω ∈ [0.25, 4] at 1/16 octave plus every p/q with q ≤ 5 (99 oscillators), **f_ref = the truth grid's beat**, K = 1
(0.5 and 2 also run). Windows: 16 beats on the truth downbeats from 8 s (the engine's warm-up). `tools/work/tongues/
probe-K{0.5,1,2.0}.md` hold every table; `tools/work` is gitignored, so the scripts live under `tools/truth/tongues/`.

**The five tracks, K = 1, median over 16-beat windows** (d at the exact Ω = 1 / 2 / 4 oscillator; "1:1 wins" = the 1:1
tongue is the widest of the q ≤ 5 tongues; lock = the Ω = 1 oscillator's phase at the truth beats, R its resultant):

| track | drive | 1:1 wins | d 1:1 (p10) | d 2:1 | d 4:1 | w 1:1 oct | K impl | lock phase | R | bistable | lock time |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SeeYouDrop 150 | `o` | 39 % | 0.314 (0.108) | 0.502 | 0.498 | 0.125 | 0.27 | +40 ms | 0.976 | no | 15.6 s |
| | `s40` / `smid` | 26 / 43 % | 0.116 / 0.287 | 0.339 / 0.409 | 0.367 / 0.376 | 0.062 / 0.125 | 0.14 / 0.27 | +48 / +46 | 0.96 / 0.98 | no | 31.6 / 119 s |
| CyborgNinja 160 | `o` | **0 %** | 0.120 (0.098) | 0.577 | 0.778 | 0.062 | 0.14 | **−84 ms** (torn) | 0.980 | no | 4.9 s |
| | **`s40`** | 0 % | **0.204** (0.099) | 0.749 | 0.485 | 0.062 | 0.14 | **+18 ms** (truth lattice) | 0.984 | no | **20.6 s** |
| | `smid` | 0 % | 0.073 | 0.613 | 0.679 | 0.062 | 0.14 | −91 ms | 0.95 | no | 42.4 s |
| WhoLikesToParty 117 | `o` | 13 % | 0.274 (0.172) | 0.600 | 0.643 | 0.062 | 0.14 | +14 ms | 0.992 | no | 1.1 s |
| | `s40` / `smid` | 37 / 20 % | 0.253 / 0.161 | 0.546 / 0.446 | 0.647 / 0.546 | 0.125 / 0.062 | 0.27 / 0.14 | +48 / +10 | 0.96 / 0.99 | no | 31.4 / 28.3 s |
| Malicious 140 | `o` | 29 % | 0.401 (0.166) | 0.488 | 0.155 | 0.125 | 0.27 | +61 ms | 0.903 | no | 31.4 s |
| | `s40` / `smid` | 26 / 13 % | 0.109 / 0.359 | 0.067 / 0.438 | 0.110 / 0.184 | 0.062 / 0.187 | 0.14 / 0.41 | +93 / +75 | 0.96 / 0.97 | no | 94.7 / 31.4 s |
| Vienna 90 | `o` | 18 % | 0.274 (0.085) | 0.523 | 0.493 | 0.125 | 0.27 | +28 ms | 0.989 | no | 22.0 s |
| | `s40` | 29 % | **0.032** (0.000) | 0.010 | 0.025 | 0.000 | 0.00 | **+179 ms** (half-beat, d 0.03) | 0.97 | no | 40.7 s |
| | **`smid`** | **82 %** | **0.363** (0.098) | 0.453 | 0.420 | **0.187** | **0.41** | **−7 ms** | 0.994 | no | 18.0 s |

What the table says, against the brief's five questions:
1. **Does the 1:1 tongue win where the truth beat is? Not by depth, on any drive.** The 2:1 tongue is DEEPER than 1:1
   on all five tracks on the full flux (0.49–0.60 vs 0.12–0.40): the 8th-note hats are the most complete click train in
   the music, and the circle map does not prefer q = 1 at 1:1 over q = 1 at 2:1 — on Vienna it reproduces `trackmap.py`'s
   own 178 BPM octave error. By WIDTH the 1:1 wins on Vienna only with the mid-band drive (82 %, 0.187 oct). **The felt
   tempo needs the prior the engine already has** (`tempo.js`'s log-normal, §61's `alive`); the bank supplies the ladder
   (d and w per p/q), not the choice. The second rig in the same directory (`tongues.py` / `ladder.py`, an absolute bank
   0.2–2.2 s at K = 2) reads the same: Vienna's widest tongue 2× in 70 % of windows (its CyborgNinja / SeeYouDrop 2:1
   rows are truncated by its 300 BPM ceiling — 320 / 300 BPM lattices — not a disagreement).
2. **Does 2:1 light up at Vienna 85 s without 1:1 losing? It was already lit.** `smid`, 16-beat windows: d₂:₁ 0.46–0.76
   over 18–61 s, 0.40–0.53 after 82.7 s (the hats were straight 8ths at 3.00 Hz before the drop too, §66); d₁:₁ 0.34–0.76
   before, 0.31–0.44 after, winning every window from 93.3 s at −4…−17 ms, R 0.98–1.00. What DOES move at 85 s is the
   dream ending: 61–83 s every tongue collapses (d₁:₁ 0.06 / 0.00, d₂:₁ 0.10 / 0.00 — the plateau is lost) and the 4:1
   reads 0.59 on the drop's window (0.41–0.55 before). The ratio d₂:₁ / d₁:₁ does not change across 85 s on any drive.
3. **CyborgNinja's half-beat: the 2:1 (8th) tongue is deep (0.58 / 0.75 / 0.61) and the 1:1 shallow (0.12 / 0.20 / 0.07)**
   on every drive — the trap in two numbers — and ONLY the low band puts the Ω = 1 oscillator on the truth lattice
   (+18 ms, locked at 20.6 s; §59's rule: 19.3 s). The full and mid flux lock it in 4.9 / 42 s at −84 / −91 ms, torn
   between the lattices as v3's PLL was (§56: p90 247 ms). §61's mid-band rejection is reproduced, not contradicted.
   d₁:₁ on `s40` tracks §59's measured low-band ratios: WhoLikesToParty 1.684 → 0.25 predicted / 0.253 measured,
   SeeYouDrop 1.299 → 0.13 / 0.116, Vienna 1.031 → 0.015 / 0.032 (CyborgNinja 1.199 → 0.09 / 0.204). Vienna's low band
   puts the oscillator on the HALF-beat (+179 ms) at d 0.03 — so a low-band verdict must be gated on depth (≈ 0.06,
   §59's own margin), and Vienna's lattice comes from the mid band (−7 ms at d 0.36).
4. **Swing: none, on any of the five.** Off-8th position from the Ω = 1 oscillator's own phase histogram (64 bins,
   parabolic mode): WhoLikesToParty 0.5006 (ratio 1.002), Vienna 0.5059 (1.024; §66 measured 0.5001 on the hats),
   SeeYouDrop 0.490, Malicious 0.478 (p10/p90 0.40/0.68 — its kicks are uniform over the beat, §59, so the mode is
   ill-defined), CyborgNinja 0.542. The field is measurable and cheap; the test set has nothing for it to show.
5. **Vienna's drop 2 — the honest test: NO lead, on either drive, at any grain.** Trailing W-beat windows ending at
   beats −4…−1 (causal), z against the 32 beats ending 16 beats earlier, FA = share of all other beats whose rolling |z|
   reaches the same maximum:

| drop | field | W 16 z (−4…−1) / FA | W 8 / FA | W 4 / FA | values W 4 at −4…−1 |
|---|---|---|---|---|---|
| **Vienna 106.669** | `o` d 1:1 | +1.2 … +0.4 / **57 %** | +0.2 … −0.6 / 61 % | −0.4 … −0.7 / 59 % | 0.06 0.08 0.09 0.07 0.05 |
| | `smid` d 1:1 | +2.4 … +1.1 / 30 % (deeper, the wrong sign) | +0.9 … −0.6 / 44 % | −0.5 … −0.7 / 46 % | 0.04 0.00 0.00 0.03 0.03 |
| Vienna 85.336 | `o` d 1:1 | −4.4 … −3.0 / 18 % | −2.1 … −1.6 / 37 % | −1.7 … −1.3 / 33 % | 0 0 0 0 (the dream) |
| SeeYouDrop 105.596 | `o` d 1:1 | **−14.3 … −8.3 / 0.0 %** | −10.0 … −0.1 / 0.0 % | −0.9 … +1.9 / 20 % | 0.30 0.41 0.44 0.44 0.36 |
| SeeYouDrop 57.606 | `o` d 2:1 | −4.9 … −0.0 / 2.4 % | +0.8 / 32 % | +0.7 / 43 % | — |

   The last bar before 106.669 collapses to d 0.00–0.09 against a 4-bar 0.23–0.39 (a fill), but ~50 % of ordinary bars
   do the same — not a detector. §64/§66 stand. Where the depth DOES collapse for bars (SeeYouDrop's breakdown 2: z −14
   at FA 0.0 %; Vienna's dream), the void / sub-void paths already arm (8.0 and 4.9 beats): the depth is a *breakdown*
   signal, the same information the void reads, in one number. **Ambiguity runs** (≥ 8 beats with trailing-16-beat d₁:₁
   < 0.05): Vienna **74.0–86.0 s** (19 beats — 17 beats before drop 1, against the sub-void's 4.9), SeeYouDrop 14.4–19.2
   (inside §54's 32 s start gate) and 137.2–142.4 (outro: one false arm in 155 s), **CyborgNinja / WhoLikesToParty /
   Malicious none** (0.0 / 0.0 / 0.2 % of beats below).

**K.** d is a property of the drive, not the knob: Vienna d₁:₁ 0.28 / 0.27 / 0.29 at K 0.5 / 1 / 2; the 1:1 width grows
with K as theory says (0.062 → 0.125 → 0.125–0.188 oct, quantised by the bank) and K = 2 shows the predicted overlap
(R 0.64–0.85, d₂:₁ 0.50 → 0.32–0.45). K = 1 is the default; K_impl 0.14–0.41 says the periodic accent is a quarter of a
clean click train. Grains: a depth needs ≥ 2 cycles — 16 / 8 / 4 / 2 beats map onto 10.7 / 5.3 / 2.7 / 1.3 s at 90 BPM
(the user's 8 / 5 / 3 / 2 / 1 s grains); 0.569 and 0.224 s carry no winding number and are not reported.

**Not run** (time-boxed): the ears' lane streams (`perc.js` `rise` / `sRise`, 60–150 and the two mid bands' dB rise, same
hop, unpublished) as the drive — `smid` is the band proxy; a bank re-centred on the ENGINE's clock instead of the truth
beat (the clock is within ±1 BPM, 0.7 % — inside the 1:1 tongue's 0.125–0.187 oct, so the table should hold, unproven);
capture mode; page = node (no engine code exists). Not in the test set: a track that swings or changes meter.

## 4. The proposed fields

| field | kind | what | from |
|---|---|---|---|
| `tongueP`, `tongueQ` | count | the widest q ≤ 4 tongue relative to the clock's beat (1/1, 2/1, 1/2, 3/2, 4/1 …), 16-beat window, updated per beat | the ladder on `smid` |
| `tongueDepth` | level | d of the Ω = 1 oscillator — how firmly the music locks the clock's own beat (0 edge, 1 centre) | `smid`, eased 0.3 s |
| `tongueK` | raw | implied K = 2π · (1:1 half-width): accent salience, 0–1 | the 1:1 run's width |
| `tongueAmbig` | level | 1 − the winner's depth: the tension; 1.0 in Vienna's dream for 7 bars | — |
| `tongue11`, `tongue21`, `tongue41` | level | the octave ladder's depths (beat, 8th, 16th) — "accent vs drive" in three numbers | `smid` |
| `tongueLat` | raw | the LOW-band Ω = 1 oscillator's phase against the clock's line, cycles (−0.5…0.5): 0 = the kick lattice | `s40` |
| `tongueLatConf` | level | that oscillator's d; a consumer reads `tongueLat` only above 0.06 | `s40` |
| `swing` | raw | the eighth-pair ratio from the Ω = 1 phase histogram, 1.0 straight, 2.0 triplet | `smid` |
| `tongueOn` | count | 1 running · 0 warming (< 16 beats) · −1 off (`&tongues=0`, `#test` with the switch off) — `loudAbs`'s A/B convention | — |

Twelve FEATS entries, twelve Appendix A rows, `help.feats` lines only when a scene reads one; the fake timeline
(`sources/fake.js`) mirrors them as constants from its phase (1/1, depth 0.6 in sustain / peak, 0 in valleys, swing 1,
`tongueOn` 1) so a scene that reads them headlessly is not dark. Not proposed: an event (the fake timeline carries no
percussion events, §70 item 4), a `tongueBpm` (the clock owns tempo), `tongue12` (0.00–0.21 on every track).

## 5. Where it is computed, what it costs, parity

`assets/engine/clock/tongues.js` (pure, node-importable, like `period.js`) fed from `Clock.push` right after
`strength()` — the FFT, `o` and `s40` exist there already; `smid` is one more accumulator over bins 7–107 in the loop
that already runs (§59's `s40` cost 0 ms the same way). Two banks (`smid`, `s40`) × 48 oscillators (1/8 oct + q ≤ 4),
cumulative θ and λ per hop; the stage `features-tongues.js` registers after `clock-pcm` (it reads `bpmPcm` for Ω = 1 and
`beatCountPcm` for the window edges), reads the windows once per beat and eases per frame. **Measured in node
(`tools/work/tongues/bench.mjs`, the per-hop loop): 48 oscillators 1.21 µs/hop, 96 2.48, 192 4.48 → 3.9 µs per 60 Hz
frame for 96** at 48 kHz; the per-beat ladder over 96 × ~30 rationals is ≈ 20 µs per beat, < 1 µs/frame amortised.
Against the clock's 170 µs/frame on the page and the 1.5 ms budget: 0.3 %. The bank's natural rates follow the clock's
tempo (f_i = Ω_i · bpmPcm / 60); phases are continuous through a re-seat, the windows are cleared on one (`latClear()`'s
rule). **Parity:** the drive is the clock's per-hop flux on the PCM bus with sample stamps — identical in det file mode
and capture (the worklet's 512 blocks); the windows close on the clock's beats in AUDIO time; only the publish is at heard
time, like every ears field. So det = node = page is the standard (§56: the PCM fields to 2.4e-4), two det runs `cmp`-
identical, capture adds no lag term. `&tongues=0` → `tongueOn` −1 and no PCM work: the md5 A/B.

## 6. Consumers and migration — one phase each, nothing replaced

- **The clock's lattice (FIRST, §59 `lattice()`).** The tempo / phase estimation is NOT replaced (the oscillator's lock
  phase is a centroid phase, +14…+93 ms late — half a beat is 187–333 ms, so it decides a LATTICE, never a line). Today
  `lat` = two leaky 40–150 Hz energies in 0.15-beat windows around the clock's OWN line; `tongueLat` is the same band's
  answer without a window on the line in question, plus the depth as its confidence, plus the mid band as a fallback
  where the low band has no lattice (Vienna d 0.03; §59's rule is silent there and the clock is right by cold-start luck,
  §66: −35.9 ms constant). Rule: move forward half a beat iff |tongueLat| > 0.3 for `LAT_SUS` on the deepest band with
  d ≥ 0.06 (low first). Receipt: §59's before/after table (CyborgNinja −9 ms / F 0.896 / 19.3 s must hold; SeeYouDrop,
  WhoLikesToParty, Malicious rows IDENTICAL) **plus a cold-start table the engine has never had**: 10 starts per track at
  `&at=` 10, 25, 40 … s, det, how many land on the truth lattice and when — §59 rule vs tongue rule.
  **The octave stays with §61**: by depth the bank would NOT have halved Vienna (d₂:₁ 0.45 > d₁:₁ 0.36 on `smid`).
- **The build detector (a third arming path beside the void and the sub-void).** `tongueAmbig ≥ 0.95 for 8 beats`
  after the 32 s gate: arms Vienna drop 1 at 74.0 s (17 beats; today 4.9), 0 arms on CyborgNinja, one false (SeeYouDrop
  137 s). Receipt: `dropcheck.py --summary` with the §54/§64 rule set + `--rule 'tongueAmbig>=0.95'`; pooled false arms
  must stay ≤ §54's 0.28 / min; Vienna drop 2 stays 0 — the plan claims nothing there.
- **DUST's accent.** §66 rejected an 8th NUDGE (CyborgNinja's 16ths fire it). The tongues give the gate §66 lacked: scale
  the hat / snare voices' AMPLITUDE by `tongue21` / `tongue41` relative to `tongue11` — an accent, no new crest. Receipt:
  `dust-trace.js` Vienna 24–60 / 82–118 s, flashes/s unchanged (`d_nstep` md5-identical), amplitude histogram moves; the
  user's eye. Gated on the DUST brief's standard.
- **TORUS2.** One opt-in read, `tongueAmbig` on the fog (the dream = 1.0, the groove 0.6); `IDS=3 tools/scene-md5.sh` moves
  by exactly that scene. Last, S.

## 7. Proofs

1. `node tools/check.js` 0 fail (12 FEATS, 12 Appendix A rows), `npm test` + `tools/test_tongues.js` (a click train at
   Ω = 1 gives d → 1 and width K/π ± one bank step; a 2:1 train gives the 2:1 tongue; a swung train 0.667 reads swing
   2.0 ± 0.05; silence d 0; a re-seat clears; bit-identical runs), `parity.js fake` 0 diff.
2. **Node = probe**: `tools/tongues-node.js` on the five dumps against `probe.py`'s truth-centred table within ±0.05 d
   and one bank step in width (the bank is re-centred on `bpmPcm`, the one thing the probe did not do).
3. **Page = node** on the twelve fields (`build-node.js --cmp`, the §56 standard), two det runs `cmp`-identical.
4. `tools/scene-md5.sh` all ids unchanged until a scene reads a field; then that scene's two lines per commit.
5. Cost: `CARD.ENGINE.CLOCK.cpuTotal / frameN` ≤ +0.01 ms on the page; `CARD.bench` DUST / NAV ≤ +0.02 ms.
6. Per consumer, its own receipt table (§6). No audible run; the user's A/B is stream mode, in track time.

## 8. Phases

| # | phase | size | gate | stop if |
|---|---|---|---|---|
| 0 | **this probe** — `env.py` + `probe.py`, the five-track tables above | S | done | — |
| 1 | `clock/tongues.js` + `features-tongues.js`: the two banks, 12 fields, FEATS / Appendix A / `fake.js`, `tools/test_tongues.js`, `tools/tongues-node.js`; **shadow mode — no consumer** | M | **DONE `de64fa5` (DECISIONS §76)**: node = probe to ±0.016 d on the mid band, md5 0/24, 1.6–2.7 µs/frame in node, page cost inside the noise | node ≠ probe beyond ±0.05 d (the clock-centred bank would be a different object); > 10 µs/frame |
| 2 | the clock's lattice reads `tongueLat` / `tongueLatConf` (low, then mid) behind `CLOCKK LAT_SRC`, §59's rule kept as the default until the cold-start table says otherwise | M | **BUILT, LEFT OFF (§76a)**: 46 / 46 cold starts on the truth lattice under both rules; the tongue rule loses on Vienna (4 spurious moves, p90 109 → 160 ms), SeeYouDrop (98.8 → 94.3 %) and CyborgNinja (2 → 4 moves) — §59's table identical on 3 tracks, CyborgNinja held, the cold-start table | any track §59 wins and the tongue loses; any line move on SeeYouDrop / WhoLikesToParty / Malicious |
| 3 | the build detector's third path | S | `dropcheck --summary`: Vienna drop 1 ≥ 8 beats, pooled false ≤ 0.28 / min, CyborgNinja 0 | one CyborgNinja arm, or false arms above §54's |
| 4 | DUST's accent on `tongue21` / `tongue41` | M | flashes/s identical, the user's eye on Vienna 0:25–1:00 and 1:25–2:00 | the user sees a crest, or any `d_nstep` change |
| 5 | TORUS2 fog on `tongueAmbig`, opt-in | S | `IDS=3` md5 pair, the user | — |

**The A/B shape for the user**, stream mode, track time: phase 2 is invisible unless a lattice moves — the test is the
cold-start table and CyborgNinja's first 20 s on the capture page (`CARD.setClock`-style `CARD.setLat('tongue' | 'low')`);
phase 3 is NAV's build route (§54's `CARD.routes('nav.buildLive=…')`) on Vienna 1:10–1:30; phase 4 is DUST on Vienna
with `&tongues=0` as the exact before.

**Verdict on phase 1 / 2.** The bank is cheap (3.9 µs/frame), deterministic, and it re-derives §59's lattice statistic
from first principles with a confidence and a mid-band fallback §59 lacks — but on the test set it reaches the same
lattice at the same time (20.6 vs 19.3 s) and the clock is already right on all five tracks. It does NOT decide the
octave (depth prefers the denser lattice on every track) and it does NOT see Vienna's drop 2. Worth building as phase
1 in shadow mode for the ladder and the tension it publishes (the dream's 7 bars at `tongueAmbig` 1.0 are real and
nothing in `MS` says so today — `tension` is roughness, `regularity` is the comb's contrast); phase 2 only if the
cold-start table shows a gain. Phases 3–5 are opt-in and want the user's eye one scene at a time.
