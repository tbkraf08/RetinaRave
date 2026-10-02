# The key itself — the five-track truth, tonic.js's confusion table, `tonicConf`, `keyConf`'s re-fit (2026-10-02)

NEXT-SESSION-PROMPT item 2, the MEASUREMENT and the PLAN, on v0.29 (`616f212`). **Nothing in the engine moved**: `assets/`
untouched, no Chrome, no audible run. Everything here is reproducible from three scripts (the raw outputs sit in
`tools/work/v84/`, git-ignored):

```
node tools/truth/key-ears.mjs [--variant=held]          # synapse key/mode/keyConf + the ears' tonic/tonicMinor/tonicConf + the ears' chroma + sub note, per 60 Hz frame
python3 tools/truth/key-truth.py --md tools/work/v84/truth.md          # the INDEPENDENT key per section (numpy STFTs, KS on KK + Temperley, the bass-note histogram)
python3 tools/truth/key-confusion.py [--suffix .held] --md tools/work/v84/confusion.md   # truth vs ears per section, keyConf's distribution, every tonicConf candidate's separation
```

The one sentence: **the ears' tonic is right on SeeYouDrop, Malicious and Vienna, never right on CyborgNinja (whose bass is a
wobble the YIN cannot name) and half right on WhoLikesToParty (a walking bass in a major key — the relative-minor coin toss is in
the audio); `keyConf` today is synapse's clarity of a read nobody publishes and opens the gate on 100 % of CyborgNinja's wrong
frames; the one conf that separates is the KS tonic margin × the bass histogram's agreement with the KS tonic, which closes
16 of 17 wrong sections and opens 38 of 46 right ones with the existing 0.1 / 0.3 gate; and §62's "Malicious is G major" was
wrong — the track is C minor and the ears had it.**

---

## 1. The truth, independent of tonic.js (`key-truth.py`)

Method (nothing shared with `ears/tonic.js`): the PCM at `tools/work/<T>.48000.st.f32` → mono → (a) a **mid chroma** 130–2100 Hz
(6 kHz decimate, 4096-point STFT = 1.46 Hz bins, power per pitch class), (b) a **bass chroma** 25–260 Hz from the spectral peaks
(1.2 kHz decimate, 2048 points = 0.59 Hz bins, parabolic interpolation, 1.7 s window), (c) a **bass-note histogram**: the loudest
bass peak per 0.25 s frame, energy-weighted — its mode is the *tonic-by-bass*, its top share the *pedal strength*. Then
Krumhansl-Schmuckler on 24 profiles — Krumhansl-Kessler (the ears' table) AND Temperley's — over mid, bass and mid+bass; top-3
with the margin r₁ − r₂; the relation of the top two (fifth / relative / parallel / other). Per whole track, loud half, the 16 s
after each truth drop, and every truth section. Verdict rule: CONFIRMED when KS (mid+bass, KK) and the bass tonic agree with
margin ≥ 0.05; confirmed-by-bass when they agree under it; BASS-PICKS-SECOND when the KS top two are a fifth / relative pair and
the bass names the second; SPLIT otherwise. `tools/work/v84/truth.md` is the full table (90 rows).

### The track table

| track | §62's "truth" | **this measurement** | KS mid+bass (whole) | bass tonic (share) | the user's ear |
|---|---|---|---|---|---|
| **SeeYouDrop** | C♯m (human) | **C♯ minor — CONFIRMED** (whole: C♯m +0.794 over F♯m +0.587, margin 0.207; loud half C♯m over C♯M 0.233; drop 2 C♯m 0.102) | C♯m | C♯ 34 % (47 % loud: the walk / climb / void share the bass) | confirmed already |
| **CyborgNinja** | C♯m (KK .174) | **C♯, AMBIGUOUS** — the bass tonic is C♯ at 87–95 % in EVERY section by the 1.7 s peak picker, but the bass is a **wobble spanning C2–D2** (the map's YIN f0 p10/p50/p90 = 61 / 67 / 76 Hz, pitch classes C 33 / C♯ 16 / D 22 %; the ears' sub note the same: C 28 / C♯ 20 / D 26 %), and the mid band carries **no C♯ at all** (C♯ 2–11 %; G 15–41 %, D 10–18 %). KS mid+bass: the drops read C♯M / C♯m with margin **0.001–0.007** (the parallel modes tie), the breakdowns G major / D minor. | C♯M +0.449 / C♯m +0.420 / G♯M +0.264 (margin 0.029, parallel) | **C♯ 91 %** (peak 0.82) | **cue: the wobble bass under the drop at 0:48 — hum its centre: is it C♯, the same note as SeeYouDrop's drop bass? And major or minor: does the lead at 0:48–1:24 feel dark (minor) or bright?** |
| **WhoLikesToParty** | DM (KK .191) | **D major — CONFIRMED by KS** (whole DM +0.723 over Bm +0.575, margin 0.148, every profile and both rulers agree; drops 0.21 / 0.28 / 0.26 over GM / Bm) — but **no bass pedal**: the bass WALKS E B G D F♯ (the top share 21–34 %), and the sections sit on different degrees: the L1 sections on G (IV, KS GM 0.18–0.21), the L3 sections on B (KS Bm / Em, margin 0.06–0.09 — the relative), the L4 sections on **E at 73–98 %** (KS Em; the ii of D or E dorian — the same seven notes) | DM +0.723 / Bm +0.575 / Em +0.556 (relative) | E 21 % / F♯ 25 % (no pedal) | cue: the drop at 0:57 is home (D major); 0:37 / 1:49 / 2:48 lean to B minor; 0:47 / 2:03 / 3:01 sit on E — all the same seven notes |
| **Malicious** | GM (KK .159) | **C MINOR — §62's GM is REFUTED.** Whole: Cm +0.737 / CM +0.723 / **GM +0.652**; bass C 55 % / G 40 %. The track ALTERNATES: an intro on D♯ (the relative major, 0.9–54 s, D♯ 49–76 %), then **C sections** (labels 3 / 4: C at 84–95 %, KS Cm first on every one, G♯ 11 % in the mid band = the minor sixth) and **G sections** (labels 2 / 5: G at 72–100 %, KS Gm / GM tie within 0.002–0.049) in turn, ~14 s each — i and v. The drop (148.3 s) is on C: Cm +0.811 / CM +0.759, C 76 %. The map's whole-track KK (`Malicious.json` `tonic`: G .138) is the subdominant confusion §62 itself named, on the detector it trusted. | Cm +0.737 / CM +0.723 / GM +0.652 (parallel) | **C 55 %**, G 40 % | **cue: the bass under the drop at 2:28 is the tonic (C); the sections at 0:54 / 1:21 / 1:49 / 2:18 / 3:11 sit on the fifth (G)** — if the drop bass sounds like "home", it is C minor |
| **Vienna** | D♯m (KK .451) | **D♯ minor — CONFIRMED** (whole D♯m +0.934, margin 0.339; every graded section D♯m at margin 0.18–0.39 except the 2.7–4 s L5 / L6 riff cells on A♯ (v) and the 4 s L1 on F♯ (III)) | D♯m +0.934 / D♯M +0.596 | D♯ 48 % (62 % loud) | no question |

### Where the ambiguity is in the AUDIO (not the detector)

- **The parallel modes** (C♯M / C♯m on CyborgNinja 0.001–0.007; Cm / CM on Malicious 0.008–0.065; D♯M / D♯m on Vienna's last
  three cells): an electronic bass + a fifth carries no third; the mode is in the mid band's sixth / seventh (Malicious's G♯
  11 % says minor; CyborgNinja's E 6 % vs F 3 % leans minor by a hair). A `tonicConf` cannot and should not resolve the mode —
  §82's 2 s hold already keeps the flips off the shade; `modeMarg` (§3) is reported for the record.
- **The relative pair** on WhoLikesToParty (DM / Bm / Em, the same seven notes): in the audio per section. The key is DM over
  the track; a detector that reads Bm on a B-bass section is reading what is there.
- **The fifth** on SeeYouDrop's walk (C♯m / F♯m / AM, §82's "the set agrees", KS margin 0.002–0.065) and Malicious's G sections.
- **Local roots that are not the key** (`key-confusion.py`'s LOCAL ruler: a section's bass pedal ≥ 60 %): SeeYouDrop's climb on
  **G** (97 % / 81 %), the void on **D** (85 % / 66 %), s8 on D♯ (77 %); Malicious's G sections; WhoLikesToParty's E sections;
  Vienna's A♯ / F♯ cells. A detector that follows them is early, not confused.

---

## 2. The ears today — the BEFORE confusion table (`key-ears.mjs` + `key-confusion.py`)

Frames from 15 s (the chroma's TAU 11 s warm-up); RIGHT = the ears' `tonic` is the key's; LOCAL = the section's bass pedal
(not the key's); WRONG = neither. Synapse's own `key` (unpublished since §62, still the owner of `keyConf`) beside it.

| track | key | frames | ears **RIGHT** | LOCAL | **WRONG** | mode right (of RIGHT) | synapse RIGHT / WRONG | the WRONG keys, modal per section |
|---|---|---|---|---|---|---|---|---|
| SeeYouDrop | C♯m | 8553 | **73 %** | 1 % | **26 %** | 85 % | 0 % / 100 % (G♯m, EM) | the walk s1 / s14: F♯m 0.45 / AM (the set); the void s5: **AM 0.76** (bass D); s10: **DM 0.46** |
| CyborgNinja | C♯m | 9901 | **0 %** | 0 % | **100 %** | – | 0 % / 100 % (G♯m, Gm, Bm) | **GM 1.00** (s1, s2, s7), G♯M 0.59–0.78 + Cm (the drops s3, s8, s9), Bm / GM (s4) — never C♯ on one frame |
| WhoLikesToParty | DM | 14478 | **50 %** | 10 % | **40 %** | 100 % | 0 % / 100 % (**Bm on every section**) | Bm 0.49–0.83 (the L3 and L0r sections), Em 0.88–0.95 (the E sections = LOCAL) |
| Malicious | Cm | 12473 | **66 %** | 18 % | **17 %** | 96 % | 14 % / 51 % (GM) | GM 0.47 on the D♯ intro; the G sections split Cm 0.49–0.61 / GM 0.39–0.51 (LOCAL) |
| Vienna | D♯m | 10656 | **100 %** | 0 % | **0 %** | 100 % | 100 % / 0 % | – |

So §62's row for CyborgNinja ("G♯M 40 %") is confirmed and worse than it read: not a low-margin miss but **0 of 9901 frames**;
its row for Malicious ("Cm 53 %, +5") was the ears being RIGHT against a wrong truth. The map's whole-track KK is 3 of 5
(it also has Malicious wrong); the ears are 3 of 5 with WhoLikesToParty half; synapse is 1 of 5.

### `keyConf` today (synapse's `keyClar`, `(best r − .35)/.45`, ema 2 s), p10 / p50 / p90, split by the EARS' key

| track | RIGHT frames | WRONG frames | LOCAL | `keyConf ≥ KEYC1 0.3` (the gate fully open) | mean gate `kw` |
|---|---|---|---|---|---|
| SeeYouDrop | 0.10 / **0.20** / 0.63 | 0.06 / 0.36 / 0.70 | 0.13 / 0.15 / 0.16 | **37 %** | 0.57 |
| CyborgNinja | – | 0.24 / **0.60** / 0.89 | – | **85 %** on a 100 %-wrong key | 0.94 |
| WhoLikesToParty | 0.73 / 0.80 / 0.86 | 0.71 / 0.79 / 0.86 | 0.72 / 0.79 / 0.83 | 100 % | 1.00 |
| Malicious | 0.70 / 0.78 / 0.90 | 0.69 / 0.76 / 0.94 | 0.71 / 0.91 / 0.96 | 100 % | 1.00 |
| Vienna | 1.00 / 1.00 / 1.00 | – | – | 100 % | 1.00 |

**What KEYC1 0.3 does today:** it is not a key gate. `keyConf` is the clarity of synapse's 65 Hz-floor chroma, which is
indifferent to whether the published (ears') key is right — RIGHT and WRONG frames have the same distribution on every track
(SeeYouDrop 0.20 vs 0.36, Malicious 0.78 vs 0.76, WhoLikesToParty 0.80 vs 0.79). The gate is **fully open ≥ 85 % of the time on
four tracks** — including CyborgNinja, whose hue sits on G / G♯ all track long at `kw` 0.94 — and 37 % open on the one
human-confirmed key, SeeYouDrop (§60's 0.27). §62 held KEYC1 because rescaling would open SeeYouDrop's gate; the measurement
says the gate is already open everywhere else, on the wrong keys included. The same `kw` is §82's shade gate when the ears have
no tonic (and 1 when they do — so the shade today trusts CyborgNinja's G major completely).

### The published `tonicConf` (`(best − second) / |best|` over all 24) — why it is not the answer

RIGHT p10 / p50 / p90 vs WRONG: SeeYouDrop 0.01 / 0.07 / 0.19 vs 0.01 / 0.11 / 0.26 — **the wrong frames read higher**; WhoLikesToParty
0.02 / 0.11 / 0.24 vs 0.01 / 0.06 / 0.15; Malicious 0.03 / 0.11 / 0.22 vs 0.02 / 0.07 / 0.14; CyborgNinja (all wrong) 0.03 / 0.14 / 0.26;
Vienna 0.20 / 0.32 / 0.39. Its "second" is usually the PARALLEL mode (the coin toss above), so it measures how clear the mode is,
not the tonic; and it is below 0.3 on 79 % of right frames. On the 0.1 / 0.3 gate it would close the right keys.

---

## 3. `tonicConf` — the candidates, replayed on the chroma the ears saw

Every candidate is computed per frame from the ears' own 12-bin chroma `TonicTrack.ch` (dumped by `key-ears.mjs`; the KS on it
reproduces the ears' `tonic` — this is a replay, not an approximation) and the ears' gated `subNote` / `subConf`:

| candidate | what it is |
|---|---|
| `cur` | the published `tonicConf` |
| `tmarg` | best r − the best r of any OTHER tonic (the parallel mode ignored), raw; `tmargR` = min(1, tmarg / 0.08) |
| `chTon` | the chroma's own share on the tonic's bin, rescaled |
| `bassPk` / `agree` | a trailing 12 s boxcar histogram of the gated sub note (conf ≥ 0.5): its top share / its share on the KS tonic |
| `agreeE6` / `agreeE12`, `pkE*` | the same histogram as an EXPONENTIAL one (`hist[note] += conf` per frame, the whole hist × e^(−dt/τ), τ 6 / 12 s) — the engine-cheap form, and it **holds its shape while the sub is silent** (both numerator and denominator decay together) |
| `stab` | the fraction of the trailing 12 s whose tonic equals this frame's |
| `modeMarg` | \|r(tonic, minor) − r(tonic, major)\| / 0.08 — the mode's own clarity, for the record |
| products | `tmargR × agree`, `× √agree`, `agree × stab`, `tmargR × agree × stab`, `min(tmargR, agree)`, `tmargR × agreeE6/12` |

### Separation, pooled over the five tracks (frames from 15 s; a SECTION is right when ≥ 60 % of its frames carry the key's tonic, wrong when ≥ 60 % carry neither the key's nor the local root)

| candidate | RIGHT p10 (min over tracks) | RIGHT ≥ 0.3 (frames) | WRONG p90 (max over tracks) | WRONG max | WRONG < 0.1 | WRONG < 0.3 | **right sections open (≥ 0.3)** | min right section | **wrong sections closed (< 0.1)** | max wrong section |
|---|---|---|---|---|---|---|---|---|---|---|
| `cur` (published) | 0.010 | 21 % | 0.263 | 0.435 | 50 % | 97 % | 16 / 46 | 0.013 | 10 / 17 | 0.204 |
| `tmargR` | 0.167 | 94 % | 1.000 | 1.000 | 6 % | 15 % | 46 / 46 | 0.420 | **0 / 17** | 1.000 |
| `chTon` | 0.177 | 78 % | 0.822 | 0.965 | 5 % | 65 % | 40 / 46 | 0.202 | 0 / 17 | 0.521 |
| `bassPk` | 0.149 | 66 % | 0.614 | 0.748 | 0 % | 75 % | 36 / 46 | 0.152 | 0 / 17 | 0.614 |
| `agree` | 0.067 | 56 % | 0.541 | 0.661 | 56 % | 89 % | 31 / 46 | 0.000 | 11 / 17 | 0.324 |
| `stab` | 0.284 | 94 % | 1.000 | 1.000 | 12 % | 29 % | 45 / 46 | 0.200 | 0 / 17 | 1.000 |
| `tmargR × agree` | 0.023 | 54 % | 0.481 | 0.661 | 74 % | 92 % | 31 / 46 | 0.000 | 16 / 17 | 0.309 |
| `agree × stab` | 0.039 | 48 % | 0.352 | 0.586 | 85 % | 94 % | 26 / 46 | 0.000 | **17 / 17** | 0.099 |
| `tmargR × agree × stab` | 0.008 | 47 % | 0.338 | 0.441 | 90 % | 96 % | 26 / 46 | 0.000 | 17 / 17 | 0.064 |
| `agreeE12` | 0.057 | 67 % | 0.378 | 0.645 | 57 % | 91 % | 38 / 46 | 0.074 | 11 / 17 | 0.405 |
| **`tmargR × agreeE12`** | 0.022 | 64 % | 0.348 | 0.608 | 76 % | 94 % | **38 / 46** | 0.059 | **16 / 17** | 0.377 |
| `tmargR × agreeE6` | 0.021 | 60 % | 0.454 | 0.684 | 74 % | 91 % | 34 / 46 | 0.057 | 16 / 17 | 0.430 |
| `modeMarg` | 0.089 | 91 % | 1.000 | 1.000 | 2 % | 5 % | 43 / 46 | 0.110 | 0 / 17 | 1.000 |

Reading it: the KS margin alone (`tmargR`, `stab`, `modeMarg`) is HIGH on the wrong keys — CyborgNinja's G major is a perfectly
clear, stable, wrong read, because the chroma it is read from has no tonic in it. The bass histogram alone (`agree`) separates
the pedal tracks but reads 0 wherever the sub is silent (Vienna's dream, 66.7–84.3 s, the sub gated off on every frame — §82) and
cannot tell a right key from a wrong one on a walking bass. `stab` multiplied in closes all 17 wrong sections but kills the
dream and half of Malicious's right sections (26 / 46). **The product of the KS tonic margin and the exponential histogram's
agreement, τ 12 s, is the one that keeps both halves**: 38 of 46 right sections open at the existing KEYC1 0.3, 16 of 17 wrong
sections closed at KEYC0 0.1, the dream at 0.25 (the histogram holds the groove's D♯ through the silence instead of
emptying), CyborgNinja ≤ 0.02 on every section.

### The chosen design

```
tonicConf = clamp01( (r_best − r_bestOtherTonic) / TM1 ) · ( H[tonic] / Σ H )        TM1 = 0.08
H[12]: per hop  H *= e^(−dt / TAU_H);  if (sub.gate && sub.conf ≥ 0.5) H[sub.note] += sub.conf        TAU_H = 12 s (≈ the chroma's own TAU 11)
      Σ H < ε  →  tonicConf = 0 (no bass has ever been heard)
```

Per track, frame-weighted, against the gate as it stands (KEYC0 0.1 → KEYC1 0.3):

| track | all p50 | all ≥ 0.3 | all < 0.1 | RIGHT p50 | RIGHT ≥ 0.3 | WRONG p50 / p90 | WRONG < 0.1 | LOCAL p50 | **mean gate `kw` new** | mean `kw` today (`keyConf`) |
|---|---|---|---|---|---|---|---|---|---|---|
| SeeYouDrop | 0.49 | 69 % | 18 % | **0.54** | 86 % | 0.13 / 0.35 | 48 % | 0.06 | **0.76** | 0.57 |
| CyborgNinja | 0.01 | 2 % | 91 % | – | – | **0.01** / 0.09 | 91 % | – | **0.05** | 0.94 |
| WhoLikesToParty | 0.13 | 3 % | 43 % | 0.14 | 0 % | 0.07 / 0.28 | 61 % | 0.24 | **0.23** | 1.00 |
| Malicious | 0.46 | 52 % | 29 % | **0.66** | 77 % | 0.05 / 0.16 | 75 % | 0.15 | **0.58** | 1.00 |
| Vienna | 0.37 | 85 % | 0 % | 0.37 | 85 % | – | – | – | **0.97** | 1.00 |

Per section (the medians; `tools/work/v84/confusion.md` has all 71 rows): **right sections** SeeYouDrop 0.34–0.71 (the climb
and void sections where the ears HOLD C♯m through a G / D pedal: 0.46–0.54 — the histogram still remembers C♯), Malicious's C
sections 0.52–0.72, Vienna 0.25 (the dream) … 0.48; **wrong sections** CyborgNinja 0.00–0.02 ×9, SeeYouDrop's void (AM) 0.04
and s10 (DM) 0.07, Malicious's intro (GM) 0.06, WhoLikesToParty's Bm sections 0.04–0.08.
**Separation: min right section 0.25 (Vienna's dream; 0.34 outside it) / max wrong section 0.08** — against KEYC0 0.1 / KEYC1 0.3.

**The three residues, stated:**
1. **SeeYouDrop's walk** (s1 12.8–25.6 s, s14 131–157 s): the ears read F♯m 0.45 / C♯m 0.33 / AM — the walk's own notes C♯ A F♯ E
   feed the histogram, so F♯m carries agreement 0.3–0.4 and the conf reads **0.38 / 0.31**, open. This is the one wrong section
   not closed. F♯m is the fifth below C♯m: one twelfth of a turn on the wheel, the same COOL pull (both minor), and §82's shade
   reads the same signs under it. The hue wobbles a twelfth, it does not flip warm.
2. **WhoLikesToParty stays CLOSED** (right p50 0.14, `kw` 0.23): a walking bass in a major key gives no pedal to agree with, and
   the ears flip DM / Bm / Em per section (§2). Today `kw` is 1.00 there — the hue swings between D's hue and B's hue (a third of
   the wheel) at every section, fully trusted. Closed = the mood palette, no swing: the honest reading of "the key is not
   stable here". If the user wants D major's hue on this track, the lever is the fixed `hooks.key` pin, not the conf.
3. **Vienna's dream** at 0.25 (75 % open): the histogram holds D♯ through 17 s of no sub (τ 12 s halves it once); a τ of 20 s
   would hold it at ~0.3 at the cost of a slower close on a real modulation. Not worth a knob; stated.

---

## 4. `keyConf`'s re-fit

**Today:** `keyConf` = synapse's `keyClar` (§2's table): p50 0.20 / 0.60 / 0.80 / 0.78 / 1.00; the gate opens 37 / 85 / 100 / 100 /
100 % — blind to the key being right.

**The re-fit (no new scale, a new OWNER):** in `features-ears.js`, where §62 already takes `key` / `mode` over from synapse when
`tonic ≥ 0`, take **`keyConf` over too: `S.keyConf = o.tonicConf`** (the §3 field), and add it to `KEY_FIELDS` — the §62 note "WHY
keyConf IS NOT IN THAT LIST" is answered by the measurement above (its reason was a look change; the look change is the point).
`KEYC0 0.1 / KEYC1 0.3` **stay**: the new conf lands on them (wrong ≤ 0.08 → closed; right 0.34–0.72 → open). Under `#test` the ears
do not run (`tonic` −1), the fake writes `keyConf 0.8` as before → the fake timeline cannot move.

**What the gates do after, per track** (the `kw` column above): SeeYouDrop **0.57 → 0.76** (the grooves and drops fully on C♯m's
hue; §62's "barely more visible than the wrong one was" ends — this IS the look change §62 deferred, and it is the smallest one on
the table), CyborgNinja **0.94 → 0.05** (off a wrong key onto the mood palette), WhoLikesToParty **1.00 → 0.23** (off the D / B swing),
Malicious **1.00 → 0.58** (on in the C sections, closed through the intro's GM and the G sections' Cm / GM flips), Vienna 1.00 → 0.97.
§82's shade follows: its `keyW` is 1 when the ears have a tonic — **change it to the same `kw` ramp on the new `keyConf`**
(one line in `shade.js`: `keyW = clamp01((keyConf − 0.1) / 0.2)` whether or not the ears have a tonic), so the shade stops trusting
CyborgNinja's G major; on SeeYouDrop's walk (§82's table) the conf is 0.31–0.38 → `keyW` 1, nothing moves there.

**The A/B the user owns:** `&kc=0` (old: synapse's `keyConf`) vs default (new) on TORUS2 / DUST over SeeYouDrop 12–30 s and
CyborgNinja 48–84 s — the same recipe as §82's `&shade=`. The constants `KEYC0 / KEYC1` are the knob if the eye wants the
grooves less saturated with the key's hue.

---

## 5. The detector — where the fifth / relative confusion comes from, and the one measured fix

Read against the data (`ears/tonic.js`, 86 lines):

1. **`SUB_W` is dead code.** `subLean()` builds a one-bin `acc[sub.note] = SUB_W · conf` and hands it to `blend()`, which divides
   `acc` by its own sum — a one-bin vector normalises to exactly 1 whatever `SUB_W · conf` was. The header's "added with a weight
   proportional to its energy share" is not what runs: the sub's lean is a fixed TIME share (`SUB_WGT` 0.6 × the hop's
   `1 − e^(−dt/τ)` against the FFT's 1 × its 0.37 s dt — about 38 % of the chroma's update budget while the sub is gated), and a
   10 %-confidence glide frame leans exactly as hard as a settled note.
2. **The KK dominant tie is real but needs a tonic-less chroma.** With the tonic, fourth and fifth equal in the chroma, the KK major
   profile prefers the fifth ABOVE (it weights degree 4 at 4.38 over degree 2 at 3.48: for G♯ vs C♯ with C♯ = G♯ = D♯ bins,
   217.7 vs 206.9). That is what CyborgNinja's drops read (t = 60 s: C♯ 14 / D♯ 13 / G♯ 14 → G♯ major). The sub lean is the designed
   counter, and on CyborgNinja it cannot work: the ears' sub note is C 28 / C♯ 20 / D 26 % (the map's YIN agrees: C 33 / C♯ 16 /
   D 22), so the lean is spread over three bins and the mid band's G / D (the lead) wins. **This is the audio** (a wobble bass a
   whole tone wide), not a profile fault; the fix is the conf (§3: ≤ 0.02 there), not the detector.
3. **The relative minor on WhoLikesToParty** is per section in the audio (§1). Not a detector fault.
4. **SeeYouDrop's walk and voids, Malicious's G sections**: local roots (§1). The chroma's 11 s memory holds C♯m through the 5–8 s
   climbs (RIGHT 84–100 % there) and loses it on the 8 s void (AM 0.76) and the 12 s intro of Malicious (GM 0.47) — the memory
   is the lever, and it is already where §62 put it.

**The one fix worth building, measured** (`key-ears.mjs --variant=held`, a prototype patch in the script — `tonic.js` untouched):
the sub leans on the chroma **only while settled** (`sub.conf ≥ 0.8`, §82's own rule for the shade's bass note) and the lean rate is
× `conf` — i.e. make the header's sentence true and drop the glide frames (the 808 attacks' F♯ → E → D♯ → C♯ in 50 ms, §82):

| ears RIGHT / LOCAL / WRONG, mode right | SeeYouDrop | CyborgNinja | WhoLikesToParty | Malicious | Vienna |
|---|---|---|---|---|---|
| **today** | 73 / 1 / 26, mode 85 % | 0 / 0 / 100 | 50 / 10 / 40 | 66 / 18 / 17, mode 96 % | 100 / 0 / 0 |
| **`held`** (conf ≥ 0.8, rate × conf) | **82 / 0 / 18, mode 96 %** | 2 / 0 / 98 | **59 / 2 / 39** | 67 / 17 / 16, mode 99 % | 100 / 0 / 0 |
| `held1` (held + `SUB_WGT` 0.6 → 1.0) | 81 / 0 / 19 | 1 / 0 / 99 | 53 / 6 / 41 | 71 / 13 / 15 | 100 / 0 / 0 |

`held` is +9 points on SeeYouDrop and WhoLikesToParty, +11 on SeeYouDrop's mode, nothing lost anywhere; `held1` trades
WhoLikesToParty for Malicious — not taken. With `held`, the chosen conf reads `kw` SeeYouDrop **0.87** (0.76), CyborgNinja 0.04 (0.05),
WhoLikesToParty 0.15 (0.23), Malicious 0.54 (0.58), Vienna 0.97 (0.97) (`tools/work/v84/confusion.held.md`). **Build it as step 2 below, behind its own receipt; CyborgNinja is not a
detector problem and no step here claims it.**

---

## 6. BUILD STEPS (the next worker; `model: fable`; one worktree per before / after pair, HARNESS)

Order matters: the conf first (the receipt needs the detector it will ride on), then the detector, then the owner change.

**Step 1 — `tonicConf` (§3) in `assets/engine/ears/tonic.js`.** Add `H = new Float32Array(12)`, `TAU_H = 12`, `TM1 = 0.08`,
`H_CONF = 0.5`; in `subLean()` (every hop) decay `H` by `e^(−dt/TAU_H)` and add `sub.conf` at `sub.note` when gated and
`conf ≥ H_CONF`; in `solve()` track `bestOther` (the best r whose tonic ≠ the winner's) and set
`this.conf = clamp01((best − bestOther) / TM1) · (H[pc] / ΣH)` (0 when ΣH < 1e-6). `ears/feats.js` `tonicConf`'s how-line
becomes "the KS tonic margin × the bass's agreement with it (a 12 s histogram of the settled sub note)". CONTRACTS §1 line
(`tonicConf | level | how clearly one key wins`) → "how clearly the TONIC wins and the bass agrees with it". The fake timeline
does not carry `tonicConf` (the ears never run under `#test`; `state.js` 0 stands) — no mirror to add.
Receipts: `node tools/truth/key-ears.mjs` → `key-confusion.py`: the published `tonicConf` column must now equal the
`tmargR × agreeE12` column within 0.02 at p50 on every track (the replay IS the spec); per-section max wrong 0.08 / min right 0.25
reproduced. `tools/test_ears.js --keys` 8 pass (the tonic itself does not move in this step — assert the five modal keys
unchanged). `node tools/check.js` 0 fail. `PORT=8841 tools/scene-md5.sh` all 12 ids == `tools/accept/v0.29/` (or the current
baseline after item 1) — **0 lines moved**.

**Step 2 — the `held` lean (§5) in `tonic.js`.** `subLean()`: return unless `sub.conf ≥ SUB_HELD` (0.8); `acc[sub.note] = 1`;
`blend(acc, dt, SUB_WGT · min(1, sub.conf))`; delete `SUB_W` (dead) and fix the header sentence. Receipts: `key-ears.mjs` →
`key-confusion.py`: the five RIGHT percentages **82 / 2 / 59 / 67 / 100** (± 2), mode 96 % on SeeYouDrop; `test_ears.js --keys`
8 pass; `test_shade.js` passes (it feeds the sub directly; if its C♯-held-2-s case moves, the conf threshold is the cause — report,
do not retune). md5 sweep 0 lines moved. **Real-track hue tables before / after** (the look DOES move here: `key` / `mode` change on
18 % of SeeYouDrop's frames): per key scene DUST (1), TORUS2 (3), POLYTOPE (5), MAXWELL (9), GIELIS (10), CHLADNI's figure (11) —
`CLOCK=1 GPU=1 PORT=8841 node tools/cdp.js 'test&track=<T>&at=<t>&scene=<id>'` shots at the §82 frames (SeeYouDrop 902 / 1106 /
1298 / 1490) + CyborgNinja at 60 s + Malicious at 100 s + WhoLikesToParty at 60 s, the mean HSV hue of the saturated pixels per
shot (the §82 recipe), one table, before = HEAD's worktree.

**Step 3 — `keyConf`'s owner (§4).** `features-ears.js`: `if (o.tonic >= 0) { S.key = …; S.mode = …; S.keyConf = o.tonicConf; }`,
`KEY_FIELDS = ['key', 'mode', 'keyConf']`, the long "WHY keyConf IS NOT IN THAT LIST" note replaced by a pointer to DECISIONS §84;
`engine/feats.js` `keyConf`'s how-line → "the ears' tonicConf where the ears have a tonic (§84), synapse's clarity otherwise";
`ears/shade.js` `keyW` → the same `clamp01((keyConf − KEYC0) / (KEYC1 − KEYC0))` ramp whether or not the ears have a tonic (import
the constants from `math/keycolour.js` or restate them with the §82 comment); `core/harness.js` `&kc=0` keeps synapse's conf (the
A/B switch, the `&shade=` pattern); CONTRACTS §2's §62 exception line gains `keyConf`, §1's `keyConf` line names the owner. The
fake: `fake.js` `S.keyConf = 0.8` stands (no ears under `#test`) — do not touch the file (another worker owns it under item 1).
Receipts: md5 sweep **0 lines moved** (the ears do not run on the fake); `key-ears.mjs` adds `keyConf` to its dump — the published
`keyConf` == `tonicConf` on every frame where `tonic ≥ 0` (5 × 100 %); the **real-track hue tables again** (the same shots, now
`kw` moves: expect SeeYouDrop's groove shots to land ON C♯m's hue, CyborgNinja's on the mood palette); `test_shade.js` + a new
case: the walk under `keyConf` 0.05 reads |shade| < 0.1 (the gate closes the shade too); `check.js` 0 fail; `npm test` 0 FAIL;
`tools/parity.js` as HARNESS prescribes (stream = file on `keyConf`).

**Step 4 — the five-track confusion table AFTER** (this file's §2 table re-taken with `key-confusion.py`, pasted into DECISIONS §84
beside the before) and the one-line `test_ears.js --keys` addition: assert `tonicConf` p50 < 0.1 on CyborgNinja and ≥ 0.3 on
SeeYouDrop 60–100 s and Vienna (the ruler that would have caught §62's table).

**DECISIONS §84 — the shape:** `## §84 tonicConf — the key's confidence is the bass agreeing with the KS tonic; keyConf changes owner;
Malicious is C minor (2026-10-xx, one worker; docs/plans/KEY-PLAN.md)` → the truth table (§1 here, with the user's ear verdicts
on CyborgNinja and Malicious filled in), the before / after confusion table, the candidate table's winning row and the two it
beat (`agree × stab`, `tmargR`), the separation numbers, the `kw` per track before / after, the `held` row, the hue table, the
three residues (§3), the proofs list (md5 0 lines ×3 steps, check, npm test, test_ears --keys, parity), and the §62 correction
("Malicious: the ears were right"). Memory `project_dust_overhaul` gets the one line; `tools/truth/<T>.json` `tonic` fields
are NOT edited by the worker — Malicious's and CyborgNinja's wait for the user's ear (the cues in §1), then `tonic_hand`.

**Files touched, in sum:** `assets/engine/ears/tonic.js` (steps 1–2), `assets/engine/ears/feats.js`, `assets/engine/features-ears.js`,
`assets/engine/feats.js`, `assets/engine/ears/shade.js`, `assets/engine/core/harness.js` (`&kc=`), `tools/test_ears.js`, `tools/test_shade.js`,
`docs/CONTRACTS.md` (§1 two lines, §2 the exception line, Appendix A), `docs/DECISIONS.md` §84, `docs/OPEN-ITEMS.md` (close §62's
item). NOT touched: `math/keycolour.js` (KEYC0 / KEYC1 / SHADE stay), the six scenes (they already pass `MS.keyConf`), `fake.js`,
`state.js`, `accept.sh`.

---

## 7. Open, for the user's ear (the two cues, one line each)

- **CyborgNinja** — the wobble bass under the drop at **0:48**: hum its centre — C♯, the same note as SeeYouDrop's drop bass? (Every
  ruler puts the centre on C♯; the YINs hear it swing C–D; the mode is a coin toss.) Until then `CyborgNinja.json` `tonic` stays
  C♯m and the plan treats the track as "closed gate, mood palette" either way.
- **Malicious** — the bass under the drop at **2:28** (148.3 s): if it sounds like home, the track is **C minor** and §62's "GM" row
  is the map's subdominant miss; the G sections at 0:54 / 1:21 / 1:49 / 2:18 / 3:11 are the fifth. `Malicious.json` `tonic` (G, .138)
  should then become `tonic_hand: C minor`.
