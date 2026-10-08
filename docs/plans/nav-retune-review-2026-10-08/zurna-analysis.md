# Zurna (TroyBoi & Jon Casey) — 92 s NAV-recording clip: what the music does at the user's timestamps

Source: `zurna-92s.wav` (mono 44.1 kHz, 92.0 s). Clip time = the user's timestamps.
Tools: `zurna_hop.py` (0.25 s hop, 0.5 s window: RMS dB, centroid 25–12 kHz, band energies, dB-flux onsets, comb-ACF beat grid)
and a scratchpad copy of `tools/truth/trackmap.py` run with `--grains=8,5,3,2,1,0.569,0.224` (outputs in `truth/ZurnaClip*`, repo untouched).
Raw tables: `zurna-hop.txt`, `truth/trackmap-stdout.txt`, `truth/ZurnaClip/grain-*.txt`; JSON: `zurna-hop.json`, `truth/ZurnaClip.json`.

## Tempo and grid

- **BPM 145.0** (period 0.4139 s; half-time trap, so the felt pulse is 72.5 — the strongest ACF peak is 0.83 s = 2 beats: kick on 1, snare on 3).
  trackmap's DP tracker said 143.6 with a 136 ms residual / coherence 0.20 (sparse 808 kicks); the hi-hat lattice
  (31.17, 31.59, 32.01, 32.45, 32.84 … 69.67, 70.08, 70.29, 70.50 …) spaces at 0.414 s and the 145.0 grid sits within ~30 ms of it at both
  32 s and 70 s, so 145.0 is used here. Both agree on the downbeat (beat 3 mod 4 of their own grids).
- Bar = 1.655 s, 8-bar phrase = 13.24 s. Bar lines near the marks: 31.15, 32.81, 34.46, 36.12, 37.77, 39.43, 41.09, **42.74**, 44.40, 46.05, 47.71, 49.36, …, 55.98, 57.64, 59.30, …, 67.57, **69.23**, 70.88.
- Bars are numbered from the main drop: **D+0 = 29.50 s**. Phrase starts: D+0 29.50, D+8 42.74, D+16 55.98, D+24 69.23, D+32 82.47 (and before: D−8 16.26, D−16 3.01). trackmap's section boundaries (9.67, 16.30, 29.52, 39.46, 44.43, 52.70, 57.68, 82.51) and its three "drop (absence)" bars (9.67, 29.52, 49.40) line up with this grid.
- Tonic D (KK: D major +0.534 / D minor +0.531 — a tie; the sub is a D1 37 Hz 808 with D#1 / E1 / B0 / C#1 moves).

## Section map (clip time)

| start | bars | section | what it sounds like |
|---|---|---|---|
| 0.0 | — | silence / fade-in | first 1.4 s under −80 dB |
| 1.4 | D−17 | **intro** (quiet, bright) | RMS −12…−16 dB, centroid 1000–1700 Hz, no sub (low share 28–57 %); A#2 reed-like lead at 8 s (h/f 6.4) |
| 9.6 | D−12 | **first bass drop** (4 bars) | D1 37 Hz sub at 80–91 % of the energy, RMS −7.4…−8.8, 808 glides of −7 and −6 st (11.0, 14.4 s), hats 7–8/s |
| 16.3 | D−8 | **breakdown / build** (8 bars) | RMS −12.6…−15.9, high band −36…−46 dB (dark, filtered), sub walks D#1 → B0 → C#1 as a held bass melody; drums thin from 25 s (mid onsets 0–1/s, no kick candidates 25–29.5 = the pre-drop break); −7.3 st 808 glide 29.68→30.16 into the drop |
| **29.5** | **D+0** | **MAIN DROP, phrase 1** (8 bars) | sub 85–90 % share, RMS −7…−8, centroid 60–115 Hz, 808 riff on D1/D#1/E1 with constant small portamento slides, kick 1 / snare 3, hats 3–5/s. 30.5–30.9: the high band vanishes (−60…−83 dB) — a half-second hat hole right after the drop, hats back at 31.0. Mid-range stabs (centroid 250–400 Hz) at 32.25–33.0, 34.5–34.75, 36.0–37.2, 38.5–38.75, 40.25–40.5. 41.1–42.7 (bar D+7) = transition bar: sub pulled 5 dB, mid +3.4 dB, centroid 124→1292 Hz |
| **42.7** | **D+8** | **DROP, phrase 2 — sub call-and-response** (8 bars) | alternating bars: sub ON (D1, 90 % share, RMS −7) / sub OFF (sub −45…−52 dB, share < 1 %) with a harmonic A2 / A#2 lead-bass (f0 110–118 Hz, h/f ≈ 90) and dry kicks + claps (big 30–150 Hz transients at 44.46, 47.77, 48.15 with no sub under them). ON: 42.8–44.2, 46.0–47.6, 49.4–50.7, 52.7–55.5; OFF: 44.4–46.0, 47.7–49.3, 51.0–52.5. trackmap re-flags a drop at 49.40 |
| 56.0 | D+16 | **section 3 (lighter "second drop" / verse)** | from the 57.68 cluster change: RMS −10…−14 (4–6 dB under the drop), sub 35–55 % + harmonic bass 60–150 Hz 21–32 %, mid lead 15–25 %, hats 16ths (8–9/s), kicks sparse (1–3/s, click 0–1), half-bar sub dips every bar or two; bass melody D#1 58 → B0 59–60 → C#1 61–62 → D1 63 → D#1 64–65 → F#1 66–67 → C#1 68 → D#1 69–71 |
| 69.2 | D+24 | section 3, phrase 2 | same texture; phrase start with a bright hit (hi share 8 %), sub chopping on/off every half bar |
| 82.5 | D+32 | **outro / breakdown** | RMS −17…−19, low share 33–49 %, centroid 1300–1500 Hz; 90.8–92.0 silence (clip end) |

Clip medians (0.25 s rows): RMS −12.1 dB, centroid 694 Hz, low (<150 Hz) −15.2 dB / 67 % share, high (>4 kHz) −31.0 dB / 1.5 % share, flux 2.63.

## The user's timestamps

Values are the 0.5 s window centred on the stated second (`zurna-hop.txt`); "vs median" is against the clip medians above.
Beat position is on the 145.0 grid (bar lines above); the user's integer seconds are ±0.5 s so the neighbouring rows are quoted too.

### 32 s — D+1 beat 3 (the snare beat of the drop's 2nd bar; beat at 31.98)
- **Event:** snare on 3 (mid onset 32.01 = the strongest snare in ±1.5 s, 18.6) with an 808 under it (32.04) and the hat (32.01); 808 on D#1 (39.7 Hz) sliding −2.6 st at 31.8–31.95 and −1.3 st at 32.56–32.79 (the portamento riff). Immediately after (32.25–33.0) the **first mid-range stab since the drop**: centroid jumps 113 → 317 Hz, mid band −19.1 → −18.3, flux 1.83 → 2.86. Until then the drop's first 2.5 s were nearly pure sub (and 30.5–30.9 had no high band at all; hats re-entered at 31.0).
- **Values:** RMS −7.8 (+4.3 dB vs median), centroid 113 Hz (6x darker than median; 317 Hz at 32.25), low −9.5 (+5.7), sub share 90 %, high −35.9 (−4.9, darker than median), flux 1.83 (a calm beat) → 2.86.
- Reading: the "green" moment is the 2nd-bar snare plus the drop's first non-sub colour (a 300 Hz stab) arriving over a 90 %-sub floor.

### 33 s — D+2 beat 1 + 0.19 s (bar line 32.81)
- **Event:** the **downbeat 808/kick at 32.86** (low onset 15.5 — the strongest low hit in the drop's first four bars) with mid 32.84 and hat 32.84; then 33.25–33.75 the busiest hat/percussion fill in the window (high flux 3.39 at 33.5, hi share up to 1.1 % — the brightest point in bars D+0…D+3) while the sub stays at 94 %. 808 pitch is moving (D#1 held only 12 % at 33 s: the riff).
- **Values:** RMS −8.1 at 33.0 / −6.8 at 33.25 (loudest row in the window, +5.3), centroid 174 → 111 → 282 Hz, low −9.8…−8.5 (+5.4…+6.7), high −33.0 → −28.4 (rising), flux 2.35 → 3.27.

### 38 s — D+5 beat 1 + 0.23 s (bar line 37.77)
- **Event:** the **most sub-pure moment of the drop**: centroid 92 Hz (the lowest near any mark), low share 95.2 %, 808 on E1 (40.4 Hz) voiced 100 % of the second, hats 4/s, kicks 5/s; a snare/hat/808 cluster on beat 2 (38.22, mid 16.7, hat 19.2) and beat 3 (38.62/38.66). Steady-state groove, bar 6 of the 8-bar drop phrase — no event, just the floor at full sub; a 2 dB dip at 39.25–39.5 precedes the D+6 downbeat hit at 39.47 (low 15.4, hat 20.0).
- **Values:** RMS −7.0 (+5.1), centroid 92 Hz, low −8.6 (+6.6), sub share 95 %, high −33.5 (−2.5), flux 3.05 (hats busy: fHi 3.24).

### 42 s — D+7 beat 3 + 0.09 s (beat 41.92; last bar of drop phrase 1)
- **Event:** the **transition bar before the new phrase**: sub pulled from −9 to −14/−15 dB (low share 88 → 54 %), mid band swells −17.9 → −14.5 (+3.4 dB, mid share 18 → 24 %), centroid climbs 124 → 549 → 1102 → 1292 Hz over 41.25–42.75 (a rising/brightening lead or riser), RMS −7.2 → −10.8 (−3.6 dB), and the high band peaks at 42.75 (−23.4, hi share 7.5 % — a crash/clap). Bass pulled out + brightening = the pre-phrase fill.
- **Values at 42.0:** RMS −8.1 (+4.0), centroid 549 Hz (≈ median), low −11.1 (+4.1), sub share 69 %, high −28.0 (+3.0, brighter than median), flux 2.60.

### 43 s — D+8 beat 1 + 0.26 s (bar line 42.74 = phrase 2 start)
- **Event:** the **downbeat 808 slam of the new phrase** at 42.78 (low onset 14.6), sub back to 89–91 % share, RMS −6.8 at 43.25 (the loudest row in the window), centroid 551 → 250 Hz; the mid lead stays (−16 dB, centroid 470–680 Hz at 43.5–44.0). Then at 44.25–44.5 the **sub disappears completely** (low −43.5 dB, share 0.2 %) for one bar (D+9, 44.4–46.0) — the start of the sub call-and-response section.
- **Values at 43.0:** RMS −7.6 (+4.5), centroid 551 Hz, low −9.4 (+5.8), sub share 89 %, high −22.9 (+8.1 — the brightest high band of all eight marks), flux 2.37.
- 42 → 43 as one gesture: bass pulled + brightness up (42.0–42.7) → 808 slam on the bar line (42.78) → total sub void from 44.4.

### 47 s — D+10 beat 3 + 0.12 s (bar 46.05–47.71, the sub-ON bar of the call-and-response)
- **Event:** the sub (D1) is holding alone — mid band at its quietest (−22.5 at 47.0: the lead rests while the sub plays), 90 % low share, RMS −8.2 (−7.1 at 46.5). At 47.25–47.5 the lead comes back (mid −14.4) and the sub starts to go; **on the bar line 47.71 the sub is cut** (47.75: low −39.8 dB, share 0.3 %, and it stays out until 49.3) while dry kick + clap transients hit at 47.77 (low 16.8, hat 14.8) and 48.15 (low 20.0, mid 14.8 — the strongest 30–150 Hz transient near any mark, but a dry kick with no sub under it).
- **Values at 47.0:** RMS −8.2 (+3.9), centroid 518 Hz, low −10.1 (+5.1), sub share 90 %, high −28.1 (+2.9), flux 2.77. Half a second later: RMS −13.3, centroid 1657, low −39.8.
- Reading: 47 s is the last 1.5 beats of sub before the pull-out; the visual at 47 sits on a sub-only floor that vanishes at 47.7.

### 58 s — D+17 beat 1 + 0.36 s (bar line 57.64; next beat 58.05)
- **Event:** the **first bar of the quieter section 3** (trackmap cluster change 57.68). On the bar line the sub drops 12 dB (−10.9 → −22.8 at 57.5–57.75) and RMS falls 7 dB (−8.9 → −16.2) — a half-bar sub pull-out; 58.0–58.25 a partial return (low share 61 → 75 %, RMS −12.3 / −11.0); 58.5–59.0 the high band rises (hi share 7.2 %, −27.4; hats 9/s) while the sub thins again (−19.9). Kicks are thinned out (low flux 0.7–1.3 vs median 1.65; trackmap: 1–3 low onsets/s, click 1). Bass note D#1 held 99 % at 58 then down to B0 at 59–60.
- **Values at 58.0:** RMS −12.3 (≈ median), centroid 995 Hz (brighter than median, 10x the drop), low −15.7 (≈ median), sub share 61 %, high −32.1 (≈ median), flux 2.67.
- Reading: a "breath" right after the section change — sub ducked, kick sparse, hats bright. Everything sits at the clip median instead of +5 dB above it.

### 70 s — D+24 beat 2 + 0.36 s (bar line 69.23 = phrase start; next beat 70.06 = the snare beat, mid onset 70.08)
- **Event:** the phrase starts at 69.23 with a bright hit (69.25–69.5: high −23.5, hi share 8 %) and the sub back (60–64 %, D#1 held 100 %) after the 68.5–69.0 sub dip (41 %, −25.9). 70.0 is just before the snare on beat 3 and is the loudest row in ±2 s (RMS −10.8). Then **70.25–71.0 the sub is pulled again** (−24.6 dB, share 22 %), RMS −16.6, centroid 1756 Hz, hi share 9.9 %, flux 3.03 (hats 3.33) — a half-bar sub hole with bright busy 16th hats across beat 4 into D+25 (70.88); sub back 71.25–71.5, out again 71.75–72.0. Kicks almost absent (0–1 low onsets/s at 70–71, click 0), hats 9/s.
- **Values at 70.0:** RMS −10.8 (+1.3), centroid 844 Hz (brighter than median), low −14.1 (+1.1), sub share 64 %, high −28.4 (+2.6), flux 2.46. At 70.75: RMS −16.6, centroid 1756, low −24.5, hi share 9.9 %.
- Reading: the snare beat of the first bar of a new 8-bar phrase in the lighter section, with the sub chopping on/off every half bar around it — a bright, kick-less, hat-driven texture.

## Summary of the eight marks against the grid

| t | bar.beat (from drop) | what | RMS dB | cen Hz | low dB | hi share % |
|---|---|---|---|---|---|---|
| 32 | D+1.3 | snare on 3 + first mid stab after the drop (113 → 317 Hz) | −7.8 | 113 | −9.5 | 0.2 |
| 33 | D+2.1 | downbeat 808 (strongest low hit of the first 4 bars) + hat fill | −8.1 | 174 | −9.8 | 0.4 |
| 38 | D+5.1 | purest sub of the drop (95 % low, 92 Hz centroid), steady groove | −7.0 | 92 | −8.6 | 0.3 |
| 42 | D+7.3 | transition bar: sub pulled 5 dB, mid +3.4 dB, centroid → 1.3 kHz | −8.1 | 549 | −11.1 | 1.4 |
| 43 | D+8.1 | phrase-2 downbeat 808 slam, then total sub void from 44.4 | −7.6 | 551 | −9.4 | 3.9 |
| 47 | D+10.3 | sub-only bar (lead silent); sub cut at 47.7, dry kicks 47.8 / 48.2 | −8.2 | 518 | −10.1 | 1.4 |
| 58 | D+17.1 | section-3 start: 12 dB sub pull-out on the bar line, kick thinned, hats up | −12.3 | 995 | −15.7 | 1.4 |
| 70 | D+24.2 | phrase start in section 3: bright hit, snare beat, sub chopping on/off | −10.8 | 844 | −14.1 | 2.4 |

(median: −12.1 / 694 / −15.2 / 1.5)

---
## Appendix A — 0.25 s-hop tables around each mark (from `zurna-hop.txt`)

Columns: t (window centre), rms dB, centroid Hz, low (<150) dB, sub (<60) dB, mid (150–2k) dB, high (>4k) dB, low %, hi %, flux (all), fLo, fMid, fHi (dB-flux onset strength per band).

    === 32 s  (bar 19 beat 3 +19 ms (next beat 32.39s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     30.00   -6.7    107   -8.3   -8.6  -20.6  -32.7  93.5   0.3  2.51  1.52  2.39  2.60
     30.25   -7.1    104   -8.8   -9.2  -19.4  -33.5  91.2   0.3  2.03  2.13  2.36  1.93
     30.50   -7.4     67   -9.1   -9.1  -21.1  -61.6  94.1   0.0  1.68  1.98  2.27  1.46
     30.75   -8.0     66   -9.7   -9.8  -21.3  -83.1  93.5   0.0  1.31  1.97  2.41  0.88
     31.00   -8.1    114  -10.0  -10.5  -18.5  -34.6  87.0   0.3  2.16  2.62  3.29  1.74
     31.25   -7.1    109   -8.7   -9.2  -18.5  -34.5  90.1   0.2  2.12  2.08  2.71  1.94
     31.50   -7.2    115   -8.9   -9.5  -18.6  -36.0  90.1   0.2  1.68  1.64  2.33  1.50
     31.75   -8.8    120  -10.7  -11.4  -19.6  -35.9  88.0   0.3  1.56  1.48  2.32  1.36
     32.00   -7.8    113   -9.5  -10.1  -19.1  -35.9  89.7   0.2  1.83  1.57  2.19  1.73
     32.25   -7.1    317   -8.8   -9.3  -18.3  -34.7  89.3   0.2  2.86  2.44  3.32  2.68
     32.50   -8.2    299   -9.8   -9.9  -22.3  -36.3  93.8   0.2  2.40  1.86  2.90  2.23
     32.75   -8.9    219  -10.7  -11.4  -20.8  -31.9  89.5   0.7  2.44  1.89  2.35  2.50
     33.00   -8.1    174   -9.8  -10.3  -22.0  -33.0  93.6   0.4  2.35  1.78  2.33  2.38
     33.25   -6.8    111   -8.5   -8.6  -21.9  -30.5  94.5   0.6  2.79  1.57  2.68  2.86
     33.50   -7.5    282   -9.4  -10.0  -19.6  -28.4  88.8   1.1  3.27  2.18  3.00  3.39
     33.75   -8.0    257   -9.8  -10.3  -19.4  -31.1  88.6   0.7  2.53  1.92  2.37  2.63
     34.00   -6.7    117   -8.5   -8.7  -18.5  -33.5  90.7   0.3  2.66  1.61  2.39  2.80
    
    === 33 s  (bar 20 beat 1 +191 ms (next beat 33.22s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     31.00   -8.1    114  -10.0  -10.5  -18.5  -34.6  87.0   0.3  2.16  2.62  3.29  1.74
     31.25   -7.1    109   -8.7   -9.2  -18.5  -34.5  90.1   0.2  2.12  2.08  2.71  1.94
     31.50   -7.2    115   -8.9   -9.5  -18.6  -36.0  90.1   0.2  1.68  1.64  2.33  1.50
     31.75   -8.8    120  -10.7  -11.4  -19.6  -35.9  88.0   0.3  1.56  1.48  2.32  1.36
     32.00   -7.8    113   -9.5  -10.1  -19.1  -35.9  89.7   0.2  1.83  1.57  2.19  1.73
     32.25   -7.1    317   -8.8   -9.3  -18.3  -34.7  89.3   0.2  2.86  2.44  3.32  2.68
     32.50   -8.2    299   -9.8   -9.9  -22.3  -36.3  93.8   0.2  2.40  1.86  2.90  2.23
     32.75   -8.9    219  -10.7  -11.4  -20.8  -31.9  89.5   0.7  2.44  1.89  2.35  2.50
     33.00   -8.1    174   -9.8  -10.3  -22.0  -33.0  93.6   0.4  2.35  1.78  2.33  2.38
     33.25   -6.8    111   -8.5   -8.6  -21.9  -30.5  94.5   0.6  2.79  1.57  2.68  2.86
     33.50   -7.5    282   -9.4  -10.0  -19.6  -28.4  88.8   1.1  3.27  2.18  3.00  3.39
     33.75   -8.0    257   -9.8  -10.3  -19.4  -31.1  88.6   0.7  2.53  1.92  2.37  2.63
     34.00   -6.7    117   -8.5   -8.7  -18.5  -33.5  90.7   0.3  2.66  1.61  2.39  2.80
     34.25   -7.9    110   -9.6   -9.8  -20.9  -35.8  92.9   0.2  2.55  1.23  2.20  2.67
     34.50   -8.9    362  -10.4  -10.5  -23.8  -35.0  95.2   0.3  2.22  1.48  2.26  2.20
     34.75   -8.6    408  -10.3  -10.5  -20.9  -31.7  91.1   0.7  2.68  2.17  3.03  2.58
     35.00   -9.1    140  -10.8  -10.9  -21.5  -34.1  91.7   0.4  2.35  1.70  2.42  2.32
    
    === 38 s  (bar 23 beat 1 +225 ms (next beat 38.19s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     36.00   -7.9    894  -13.0  -14.1  -20.5  -29.7  81.8   1.7  2.96  2.50  2.69  3.10
     36.25   -7.9    523  -10.8  -11.5  -22.8  -33.5  92.9   0.5  2.32  2.02  2.26  2.35
     36.50   -7.3     94   -8.7   -8.7  -28.4  -32.0  98.0   0.5  2.49  1.30  2.32  2.58
     36.75   -7.2    217   -9.0   -9.3  -20.8  -28.6  91.7   1.0  3.17  1.87  2.83  3.37
     37.00   -7.5    311   -9.6  -10.0  -18.6  -28.3  86.3   1.2  2.80  2.30  2.43  3.01
     37.25   -6.9    238   -8.7   -8.9  -19.3  -29.5  90.6   0.8  2.57  2.23  2.30  2.72
     37.50   -6.5    127   -8.1   -8.3  -19.3  -32.4  92.6   0.3  2.60  1.83  2.53  2.67
     37.75   -6.7    110   -8.2   -8.3  -20.0  -33.0  93.5   0.3  2.70  1.42  2.33  2.90
     38.00   -7.0     92   -8.6   -8.8  -21.9  -33.5  95.2   0.3  3.05  1.65  2.69  3.24
     38.25   -6.9    102   -8.5   -8.8  -19.9  -33.1  92.9   0.3  2.73  1.66  2.52  2.86
     38.50   -6.3    286   -8.2   -8.3  -18.0  -29.6  89.1   0.6  2.63  1.72  2.46  2.71
     38.75   -6.4    278   -8.2   -8.3  -18.4  -29.9  89.9   0.6  2.56  1.50  2.47  2.60
     39.00   -6.9    191   -8.6   -8.6  -20.7  -32.6  93.9   0.4  2.65  1.44  2.44  2.74
     39.25   -8.9    264  -10.6  -11.0  -21.1  -31.2  90.7   0.8  2.87  2.06  2.88  2.86
     39.50   -9.3    237  -11.1  -11.9  -22.3  -29.2  91.1   1.4  2.70  1.84  2.38  2.83
     39.75   -7.3    171   -8.8   -9.0  -27.7  -28.0  97.4   1.2  2.73  1.44  2.32  2.88
     40.00   -7.0    134   -8.7   -9.2  -21.2  -29.1  93.4   0.9  2.50  1.82  2.51  2.49
    
    === 42 s  (bar 25 beat 3 +86 ms (next beat 42.33s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     40.00   -7.0    134   -8.7   -9.2  -21.2  -29.1  93.4   0.9  2.50  1.82  2.51  2.49
     40.25   -8.2    407  -10.2  -10.9  -19.8  -28.9  87.2   1.2  2.52  2.17  2.40  2.57
     40.50   -7.9    416  -10.0  -10.1  -20.9  -28.7  89.7   1.2  2.88  2.07  2.74  2.95
     40.75   -7.2    127   -9.0   -9.5  -19.4  -32.1  91.0   0.4  2.52  1.71  2.40  2.57
     41.00   -7.2    137   -9.0   -9.4  -17.9  -33.5  88.0   0.3  2.32  1.35  2.14  2.40
     41.25   -7.2    124   -9.2   -9.4  -17.9  -34.4  87.7   0.3  2.48  1.48  2.21  2.58
     41.50   -7.3    173   -9.6   -9.9  -15.7  -32.3  79.6   0.4  2.56  1.52  2.26  2.69
     41.75   -7.5    443  -10.3  -10.4  -14.5  -27.9  70.7   1.2  2.81  1.61  2.52  2.96
     42.00   -8.1    549  -11.1  -11.2  -15.1  -28.0  68.7   1.4  2.60  2.08  2.38  2.72
     42.25   -8.0    513  -11.2  -11.3  -14.5  -29.0  65.8   1.1  2.59  1.93  2.25  2.76
     42.50  -10.2   1102  -14.3  -14.3  -15.5  -28.8  53.5   1.9  2.62  1.59  2.22  2.81
     42.75  -10.8   1292  -14.0  -15.2  -18.4  -23.4  64.4   7.5  2.39  2.29  2.14  2.51
     43.00   -7.6    551   -9.4   -9.7  -21.6  -22.9  89.0   3.9  2.37  1.97  2.29  2.42
     43.25   -6.8    250   -8.7   -9.0  -20.7  -26.2  91.0   1.6  2.32  1.53  2.39  2.31
     43.50   -8.1    535  -10.8  -11.5  -16.0  -26.4  72.6   2.0  2.46  2.15  2.44  2.49
     43.75   -8.1    472  -10.7  -10.7  -16.9  -28.9  77.1   1.2  2.59  1.81  2.30  2.73
     44.00   -8.6    681  -11.1  -11.1  -17.2  -27.6  77.4   1.7  2.83  1.69  2.32  3.05
    
    === 43 s  (bar 26 beat 1 +259 ms (next beat 43.16s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     41.00   -7.2    137   -9.0   -9.4  -17.9  -33.5  88.0   0.3  2.32  1.35  2.14  2.40
     41.25   -7.2    124   -9.2   -9.4  -17.9  -34.4  87.7   0.3  2.48  1.48  2.21  2.58
     41.50   -7.3    173   -9.6   -9.9  -15.7  -32.3  79.6   0.4  2.56  1.52  2.26  2.69
     41.75   -7.5    443  -10.3  -10.4  -14.5  -27.9  70.7   1.2  2.81  1.61  2.52  2.96
     42.00   -8.1    549  -11.1  -11.2  -15.1  -28.0  68.7   1.4  2.60  2.08  2.38  2.72
     42.25   -8.0    513  -11.2  -11.3  -14.5  -29.0  65.8   1.1  2.59  1.93  2.25  2.76
     42.50  -10.2   1102  -14.3  -14.3  -15.5  -28.8  53.5   1.9  2.62  1.59  2.22  2.81
     42.75  -10.8   1292  -14.0  -15.2  -18.4  -23.4  64.4   7.5  2.39  2.29  2.14  2.51
     43.00   -7.6    551   -9.4   -9.7  -21.6  -22.9  89.0   3.9  2.37  1.97  2.29  2.42
     43.25   -6.8    250   -8.7   -9.0  -20.7  -26.2  91.0   1.6  2.32  1.53  2.39  2.31
     43.50   -8.1    535  -10.8  -11.5  -16.0  -26.4  72.6   2.0  2.46  2.15  2.44  2.49
     43.75   -8.1    472  -10.7  -10.7  -16.9  -28.9  77.1   1.2  2.59  1.81  2.30  2.73
     44.00   -8.6    681  -11.1  -11.1  -17.2  -27.6  77.4   1.7  2.83  1.69  2.32  3.05
     44.25  -13.4   2339  -19.5  -19.6  -17.0  -26.2  31.9   6.7  2.91  2.70  2.69  3.03
     44.50  -14.4   2617  -43.5  -48.6  -16.3  -28.4   0.2   5.4  2.65  2.36  2.38  2.77
     44.75  -11.7   1458  -22.9  -44.1  -13.8  -28.9  10.3   2.6  2.95  2.60  2.37  3.21
     45.00  -12.0   1316  -22.8  -44.7  -14.1  -27.8  10.9   3.5  2.80  2.80  2.59  2.91
    
    === 47 s  (bar 28 beat 3 +120 ms (next beat 47.29s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     45.00  -12.0   1316  -22.8  -44.7  -14.1  -27.8  10.9   3.5  2.80  2.80  2.59  2.91
     45.25  -13.1   1583  -38.5  -51.2  -14.9  -27.5   0.4   4.8  2.84  1.86  2.59  2.96
     45.50  -14.4   2054  -44.6  -51.6  -16.5  -27.6   0.1   6.2  3.22  2.58  2.85  3.42
     45.75  -13.7   1709  -43.2  -49.0  -15.5  -29.6   0.2   3.5  2.58  2.27  2.47  2.67
     46.00  -10.8    845  -15.2  -17.5  -15.5  -30.4  48.9   1.5  2.43  2.46  2.32  2.48
     46.25   -8.2    372   -9.9  -10.4  -20.9  -31.0  90.7   0.7  2.63  2.45  2.26  2.76
     46.50   -7.1    203   -8.8   -9.1  -21.6  -27.8  92.2   1.2  2.85  1.77  2.42  3.08
     46.75   -8.2    584  -10.3  -11.0  -19.7  -25.8  84.2   2.4  2.89  2.24  2.65  3.04
     47.00   -8.2    518  -10.1  -10.5  -22.5  -28.1  90.1   1.4  2.77  1.83  2.41  2.94
     47.25   -7.8    352  -10.2  -10.4  -16.3  -28.2  78.3   1.2  2.89  1.82  2.44  3.12
     47.50  -10.2   1065  -15.0  -15.7  -14.4  -26.9  44.0   2.9  2.83  1.83  2.45  3.02
     47.75  -13.3   1657  -39.8  -49.6  -15.1  -28.2   0.3   4.4  2.87  1.74  2.54  3.01
     48.00  -13.2   1669  -25.2  -48.9  -15.7  -28.7   9.0   4.0  3.01  2.87  2.82  3.12
     48.25  -12.5   1516  -25.0  -47.0  -14.5  -27.8   7.4   3.9  2.74  2.77  2.63  2.80
     48.50  -12.3   1349  -37.4  -48.3  -13.9  -27.3   0.4   4.1  2.53  2.00  2.32  2.58
     48.75  -14.4   1498  -25.7  -49.2  -17.0  -27.7   9.5   6.0  3.21  2.43  2.63  3.51
     49.00  -13.2   1411  -25.6  -46.0  -15.4  -29.0   7.8   3.5  3.04  2.36  2.68  3.25
    
    === 58 s  (bar 35 beat 1 +360 ms (next beat 58.05s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     56.00  -10.5    562  -13.4  -14.9  -17.6  -25.0  67.7   4.7  2.55  2.14  2.27  2.66
     56.25   -8.2    609  -10.3  -11.3  -19.9  -23.7  84.4   3.9  2.70  1.31  2.47  2.82
     56.50   -7.6    344   -9.8  -10.6  -18.7  -27.5  85.3   1.4  2.21  0.92  2.28  2.22
     56.75   -8.6    557  -11.1  -12.0  -17.4  -27.9  77.1   1.6  2.34  1.46  2.31  2.37
     57.00   -8.6    495  -10.6  -10.7  -20.2  -29.0  86.6   1.2  2.53  1.39  2.24  2.66
     57.25   -8.9    479  -10.8  -10.9  -22.2  -29.9  90.6   1.1  2.85  1.06  2.29  3.10
     57.50  -13.9   1125  -17.0  -17.5  -21.8  -29.2  67.2   4.0  2.93  0.69  2.43  3.16
     57.75  -16.2   1451  -21.7  -22.8  -21.1  -32.0  38.7   3.6  2.57  0.72  2.26  2.72
     58.00  -12.3    995  -15.7  -17.6  -18.6  -32.1  61.0   1.4  2.67  1.21  2.22  2.87
     58.25  -11.0    464  -13.6  -14.8  -19.2  -32.0  74.7   1.1  2.89  0.86  2.39  3.10
     58.50  -13.0   1041  -16.1  -16.7  -20.7  -28.7  66.2   3.7  3.02  0.79  2.57  3.21
     58.75  -14.4   1424  -18.7  -19.9  -21.5  -27.4  53.2   7.2  2.92  1.30  2.54  3.09
     59.00  -14.2   1213  -17.4  -19.0  -22.1  -28.3  64.5   5.3  2.55  1.16  2.18  2.73
     59.25  -11.7    894  -14.7  -16.8  -19.1  -28.7  67.9   2.8  2.57  1.24  2.18  2.76
     59.50  -11.6    662  -14.7  -16.8  -19.3  -31.1  69.4   1.6  2.73  1.40  2.23  2.95
     59.75  -13.1   1288  -18.5  -21.5  -19.3  -28.5  46.0   4.6  2.71  1.86  2.34  2.90
     60.00  -11.0   1209  -14.6  -17.2  -18.3  -26.9  62.3   3.6  2.71  2.20  2.58  2.79
    
    === 70 s  (bar 42 beat 2 +358 ms (next beat 70.06s)) ===
         t    rms    cen    low    sub    mid   high  low%   hi%  flux   fLo  fMid   fHi
     68.00  -13.5    597  -16.4  -20.7  -21.1  -30.3  70.3   2.9  2.60  1.21  2.27  2.75
     68.25  -13.3    769  -17.1  -23.4  -19.8  -27.7  57.5   5.0  2.70  1.09  2.42  2.81
     68.50  -14.4    920  -19.6  -25.9  -19.5  -28.3  41.4   5.6  2.49  1.25  2.30  2.58
     68.75  -14.4    931  -19.6  -24.4  -19.1  -28.4  41.2   5.4  2.55  1.19  2.16  2.74
     69.00  -13.8   1017  -18.4  -20.6  -19.2  -28.3  48.1   5.0  2.44  0.92  2.08  2.59
     69.25  -11.6   1133  -15.1  -16.9  -18.5  -23.9  60.2   8.0  2.47  1.40  2.12  2.64
     69.50  -11.3   1070  -14.6  -15.8  -18.7  -23.5  62.8   8.2  2.49  1.25  2.26  2.61
     69.75  -11.2    876  -14.5  -16.4  -18.1  -27.8  63.4   3.0  2.30  1.52  2.20  2.36
     70.00  -10.8    844  -14.1  -16.7  -17.9  -28.4  63.9   2.4  2.46  1.73  2.21  2.57
     70.25  -12.9    777  -16.0  -18.0  -20.8  -29.5  65.9   2.9  2.67  0.82  2.21  2.86
     70.50  -15.0   1099  -19.1  -20.6  -21.1  -28.9  51.8   5.4  2.95  1.09  2.27  3.26
     70.75  -16.6   1756  -24.5  -24.6  -20.5  -27.9  22.0   9.9  3.03  1.35  2.40  3.33
     71.00  -15.7   1598  -21.2  -22.7  -20.3  -29.7  38.0   5.3  2.86  1.15  2.16  3.15
     71.25  -12.1    834  -15.7  -18.3  -18.2  -30.7  58.9   1.9  2.73  1.25  2.03  3.00
     71.50  -12.0    576  -15.0  -17.2  -19.1  -29.6  66.1   2.3  3.03  0.70  2.32  3.34
     71.75  -14.5   1250  -18.6  -19.8  -21.2  -28.5  52.9   5.4  3.04  0.49  2.39  3.35
     72.00  -14.8   1444  -21.2  -24.4  -19.8  -28.6  32.9   6.1  2.75  1.10  2.31  2.97
    

## Appendix B — 2 s overview of the whole clip

    === 2 s overview ===
        t    rms    cen    low   high  low%  flux   fLo  fMid   fHi  bar
        0  -87.9    521  -68.7  -76.3  31.7  1.16  0.88  1.10  1.18  before grid
        2  -13.9   1077  -35.4  -40.1  41.1  2.49  2.11  2.29  2.59  bar 1
        4  -14.8   1632  -30.5  -33.2  38.5  2.71  2.31  2.42  2.82  bar 2
        6  -12.3   1259  -19.7  -32.2  57.3  2.65  2.29  2.41  2.75  bar 3
        8  -15.9   1732  -25.5  -32.4  27.7  2.69  2.89  2.42  2.79  bar 5
       10   -7.4    269   -9.3  -31.7  89.2  2.68  1.70  2.40  2.81  bar 6
       12   -8.8    588  -10.9  -32.3  86.5  2.59  2.01  2.42  2.66  bar 7
       14   -7.7    292   -9.5  -33.0  91.2  2.78  1.76  2.47  2.93  bar 8
       16  -12.6    617  -15.1  -43.3  78.2  2.43  1.13  2.15  2.54  bar 9
       18  -14.7    593  -17.9  -45.6  66.8  2.42  0.92  2.11  2.54  bar 11
       20  -12.8    487  -16.5  -45.4  68.9  2.43  1.48  2.10  2.56  bar 12
       22  -13.3    479  -16.1  -40.0  72.9  2.45  0.78  2.08  2.61  bar 13
       24  -15.2    814  -19.2  -37.6  55.5  2.45  0.94  2.14  2.60  bar 14
       26  -13.8    663  -18.5  -36.3  52.7  2.40  1.46  2.11  2.53  bar 15
       28  -15.9    591  -19.4  -36.1  62.7  2.41  1.34  2.25  2.50  bar 17
       30   -7.5    100   -9.3  -44.0  90.9  1.88  1.93  2.51  1.68  bar 18
       32   -7.8    222   -9.5  -32.7  91.0  2.56  1.90  2.64  2.55  bar 19
       34   -8.0    296   -9.8  -32.3  90.9  2.66  1.72  2.52  2.72  bar 20
       36   -7.2    314   -9.5  -30.9  90.9  2.70  1.93  2.46  2.84  bar 21
       38   -7.4    203   -9.1  -30.9  92.5  2.74  1.66  2.52  2.84  bar 23
       40   -7.4    245   -9.5  -30.9  85.9  2.57  1.72  2.40  2.65  bar 24
       42   -8.5    658  -11.3  -26.7  72.8  2.49  1.92  2.30  2.60  bar 25
       44  -12.7   1720  -30.8  -28.0  16.4  2.85  2.36  2.53  3.00  bar 26
       46   -9.2    699  -14.9  -28.3  66.1  2.77  2.02  2.44  2.93  bar 27
       48  -11.6   1156  -21.9  -28.8  32.2  2.79  2.42  2.52  2.92  bar 29
       50  -10.9   1271  -20.9  -27.6  38.0  2.87  2.38  2.54  3.02  bar 30
       52   -9.9    848  -19.8  -27.9  56.1  2.78  2.24  2.51  2.91  bar 31
       54   -7.9    366  -10.6  -29.0  73.7  2.73  1.82  2.48  2.85  bar 32
       56  -10.3    703  -13.1  -28.0  74.7  2.59  1.21  2.32  2.71  bar 34
       58  -12.7    998  -16.2  -29.6  62.9  2.76  1.23  2.33  2.95  bar 35
       60  -13.4    960  -17.5  -30.0  55.7  2.77  1.62  2.37  2.93  bar 36
       62  -10.0    583  -12.7  -28.7  75.7  2.77  1.15  2.31  2.97  bar 37
       64  -13.2    921  -16.5  -29.9  64.3  2.79  0.97  2.38  2.96  bar 38
       66  -12.5    884  -15.7  -31.0  67.3  2.55  1.43  2.25  2.68  bar 40
       68  -12.9    914  -16.9  -27.3  55.6  2.51  1.23  2.23  2.64  bar 41
       70  -13.7   1092  -18.0  -29.2  52.4  2.84  1.07  2.25  3.11  bar 42
       72  -12.6    959  -16.7  -29.3  55.9  2.70  1.56  2.26  2.90  bar 43
       74  -11.7    733  -15.6  -29.0  62.2  2.89  1.48  2.32  3.16  bar 44
       76  -13.0    877  -16.3  -28.7  64.7  2.83  0.71  2.23  3.10  bar 46
       78  -13.0    963  -17.2  -29.7  53.7  2.75  1.28  2.32  2.95  bar 47
       80  -12.8    998  -16.8  -28.5  56.0  2.71  1.43  2.24  2.91  bar 48
       82  -13.4    799  -16.9  -28.3  62.4  2.44  1.63  2.32  2.51  bar 49
       84  -19.2   1306  -26.8  -33.9  34.0  2.86  2.13  2.60  2.96  bar 50
       86  -16.8   1540  -22.4  -33.1  48.6  2.95  2.09  2.75  3.03  bar 52
       88  -17.7   1489  -28.9  -32.3  32.8  2.81  2.17  2.71  2.84  bar 53
       90 -123.3    571  -99.6  -90.2   0.0  0.54  0.48  0.50  0.55  bar 54
    

## Appendix C — discrete onsets near the marks (time(strength), 92nd-percentile peaks per band)

    === discrete onsets near marks (time, band, strength) ===
    LOW around 32: 30.60(8.1) 30.81(6.5) 31.01(9.5) 31.21(10.1) 31.62(14.2) 32.04(11.9) 32.25(6.9) 32.42(9.8) 32.86(15.5) 33.48(6.2)
    LOW around 33: 31.62(14.2) 32.04(11.9) 32.25(6.9) 32.42(9.8) 32.86(15.5) 33.48(6.2) 33.70(10.5) 33.95(5.6) 34.09(10.9)
    LOW around 38: 36.80(8.7) 37.02(9.4) 37.27(5.9) 37.41(8.3) 37.59(4.5) 37.87(5.9) 38.02(7.3) 38.23(8.9) 38.51(5.0) 38.66(8.5) 38.96(4.5) 39.10(8.6) 39.47(15.4)
    LOW around 42: 40.73(7.4) 41.34(8.1) 41.55(5.2) 41.86(4.5) 42.00(7.7) 42.17(7.2) 42.37(7.3) 42.49(5.6) 42.78(14.6) 42.97(4.9) 43.38(7.9)
    LOW around 43: 41.55(5.2) 41.86(4.5) 42.00(7.7) 42.17(7.2) 42.37(7.3) 42.49(5.6) 42.78(14.6) 42.97(4.9) 43.38(7.9) 43.53(5.5) 43.64(4.9) 44.06(7.0) 44.32(8.4) 44.46(17.4)
    LOW around 47: 45.71(14.2) 46.10(16.4) 46.73(6.9) 46.97(6.7) 47.33(8.4) 47.53(4.7) 47.77(16.8) 47.94(5.1) 48.15(20.0) 48.40(7.2)
    LOW around 58: 56.66(5.3) 56.89(5.3) 57.30(4.8) 57.90(4.8) 58.10(8.0) 58.73(5.4) 58.95(6.3) 59.16(5.0) 59.35(12.1)
    LOW around 70: 68.66(7.7) 69.11(4.9) 69.28(10.7) 69.89(12.1) 70.11(8.8) 70.58(8.1) 71.14(7.3) 71.34(4.5)
    MID around 32: 30.64(6.3) 30.84(9.4) 31.05(9.3) 31.18(16.4) 31.59(17.3) 32.01(18.6) 32.30(8.9) 32.46(14.8) 32.84(14.2) 33.30(7.3) 33.46(10.1)
    MID around 33: 31.59(17.3) 32.01(18.6) 32.30(8.9) 32.46(14.8) 32.84(14.2) 33.30(7.3) 33.46(10.1) 33.66(14.6) 33.95(6.2) 34.08(16.9)
    MID around 38: 36.59(7.3) 36.78(10.2) 36.98(12.2) 37.27(5.7) 37.42(5.6) 37.67(5.2) 37.86(4.3) 38.22(16.7) 38.50(5.8) 38.62(14.1) 38.92(6.2) 39.06(11.7) 39.46(14.8)
    MID around 42: 40.70(11.7) 41.54(8.9) 41.95(7.0) 42.16(6.0) 42.38(5.0) 42.77(6.1) 43.21(4.3) 43.39(7.7)
    MID around 43: 41.54(8.9) 41.95(7.0) 42.16(6.0) 42.38(5.0) 42.77(6.1) 43.21(4.3) 43.39(7.7) 43.59(8.7) 43.81(4.6) 43.93(4.3) 44.04(4.9) 44.24(4.4) 44.45(6.8)
    MID around 47: 45.68(6.4) 46.09(12.4) 46.53(6.1) 46.71(8.2) 46.91(9.8) 47.12(8.0) 47.32(9.6) 47.54(5.0) 47.75(8.1) 47.96(5.1) 48.15(14.8) 48.38(5.7)
    MID around 58: 56.63(7.6) 56.83(8.4) 57.07(4.8) 57.28(6.6) 57.48(4.7) 57.68(4.8) 57.89(6.1) 58.08(8.1) 58.49(12.4) 58.72(8.0) 58.94(6.9) 59.16(4.3) 59.33(11.2)
    MID around 70: 68.65(5.4) 69.26(7.2) 69.88(5.7) 70.08(8.5) 70.30(4.5) 70.52(5.2) 70.71(5.1) 70.92(5.3) 71.33(5.3)
    HI around 32: 31.17(19.4) 31.59(20.0) 32.01(19.9) 32.45(19.9) 32.84(18.9) 33.25(18.8) 33.46(10.5)
    HI around 33: 31.59(20.0) 32.01(19.9) 32.45(19.9) 32.84(18.9) 33.25(18.8) 33.46(10.5) 33.66(19.1) 33.87(16.4) 34.08(19.6) 34.49(20.0)
    HI around 38: 36.57(17.6) 36.77(12.0) 36.98(18.0) 37.19(16.8) 37.40(18.1) 37.60(14.6) 37.81(17.6) 38.22(19.2) 38.43(13.9) 38.62(19.9) 38.84(18.4) 39.04(19.9) 39.45(20.0)
    HI around 42: 40.70(12.5) 41.13(9.8) 41.54(10.3) 41.75(8.6) 41.95(9.0) 42.16(10.3) 42.37(8.1) 42.47(7.5) 42.57(8.1) 42.77(11.6) 43.19(8.0)
    HI around 43: 41.54(10.3) 41.75(8.6) 41.95(9.0) 42.16(10.3) 42.37(8.1) 42.47(7.5) 42.57(8.1) 42.77(11.6) 43.19(8.0) 43.60(9.9) 43.81(12.0) 44.02(12.2) 44.23(6.5) 44.33(6.6) 44.43(16.1)
    HI around 47: 45.67(14.9) 46.08(17.2) 46.30(14.4) 46.50(18.0) 46.91(13.9) 47.12(14.6) 47.32(14.1) 47.64(7.5) 47.74(14.8) 47.94(16.0) 48.15(15.8)
    HI around 58: 56.63(8.1) 56.84(11.8) 57.05(11.4) 57.26(11.4) 57.46(13.0) 57.67(14.9) 57.89(10.4) 58.09(12.7) 58.30(9.6) 58.50(13.4) 58.71(14.4) 58.92(14.8) 59.03(6.7) 59.13(11.3) 59.32(17.4)
    HI around 70: 68.65(8.8) 68.85(8.5) 69.06(7.0) 69.26(10.1) 69.67(6.8) 69.87(8.0) 70.08(12.6) 70.29(14.9) 70.50(13.3) 70.60(9.7) 70.71(12.2) 70.81(12.1) 70.91(17.5) 71.12(16.1) 71.33(14.2)

## Appendix D — trackmap.py (scratchpad copy) summary: 5 s grain, grid, drops, sections, slides

    
    === ZurnaClip  91.8 s  tempo 142.9 bpm (percussive onsets, loudest 30 s from 29 s)
    loud half: sub 74%  bass 9%  lm 6%  mid 8%  high 3% | bass f0 37.2 Hz D1 held 58% | centroid30-600 69 Hz  h/f 0.07
    
    # ZurnaClip  grain 5 s  STFT 16384 (0.372 s window)  pitch: YIN 100 ms / 10 ms hop  onsets: per second  subwob: yes
       t(s)  sub bass  lm  mid high | f0Hz note held vcd | cen   h/f | subwob beats depth | low click mid high
      0.000   73    6    3   13    5 |  37.0 D1   73% 26% |   83  0.13 | 0.116  0.28 1.00 |  1.6  1.2  2.8  3.6
      5.000   56   13    6   16    8 |  43.6 F1    3% 29% |  205  0.94 | 0.116  0.28 1.00 |  3.0  2.4  5.2  7.0
     10.000   84    6    2    6    3 |  37.0 D1   70% 78% |   46  0.01 | 0.116  0.28 0.75 |  4.0  2.8  5.4  7.0
     15.000   73   11    4    8    3 |  38.7 D#1  78% 85% |   76  0.08 | 0.116  0.28 0.98 |  2.6  1.6  3.2  4.8
     20.000   53   19    7   15    6 |  34.5 C#1  25% 90% |   88  0.19 | 0.116  0.28 0.93 |  1.4  1.0  2.0  3.2
     25.000   56   15    9   13    5 |  34.9 C#1  27% 76% |  105  0.30 | 0.116  0.28 0.98 |  2.2  0.2  0.4  1.2
     30.000   85    7    3    5    1 |  40.4 E1   37% 82% |   66  0.06 | 0.859  2.05 0.76 |  4.6  1.2  3.8  3.0
     35.000   88    4    1    5    1 |  39.7 D#1  40% 86% |   61  0.05 | 0.116  0.28 0.71 |  4.4  2.0  3.8  4.6
     40.000   71    5    6   13    3 |  37.1 D1   65% 65% |   93  0.15 | 0.116  0.28 1.00 |  3.4  2.6  4.4  5.4
     45.000   57    6   16   15    6 |  37.3 D1   54% 38% |  287  3.29 | 0.116  0.28 1.00 |  4.8  2.6  4.8  6.8
     50.000   66    6   12   12    4 |  37.0 D1   67% 52% |  101  0.23 | 0.116  0.28 1.00 |  3.8  2.8  5.6  8.0
     55.000   62   11    8   13    6 |  38.7 D#1  61% 75% |   76  0.09 | 0.116  0.28 0.97 |  2.6  1.8  4.4  6.8
     60.000   54   21    6   11    7 |  36.9 D1   19% 81% |   85  0.11 | 0.116  0.28 0.98 |  1.8  0.8  5.0  8.0
     65.000   34   29   11   16   10 |  38.9 D#1  34% 71% |  106  0.23 | 0.604  1.44 0.96 |  2.6  1.4  3.8  5.8
     70.000   37   25    9   19   10 |  38.8 D#1  49% 79% |  111  0.23 | 0.116  0.28 0.97 |  1.6  0.6  4.0  8.4
     75.000   37   25    9   20    9 |  38.7 D#1  67% 75% |  113  0.17 | 0.116  0.28 0.96 |  2.0  0.8  3.6  7.4
     80.000   39   23   10   17   11 |  34.8 C#1  38% 56% |  103  0.21 | 0.116  0.28 0.99 |  3.8  1.2  4.4  6.8
     85.000   31   26   13   19   11 | 111.7 A2   20% 15% |  251  1.53 | 0.116  0.28 1.00 |  3.6  2.2  5.6  7.0
     90.000    0    0    0   64   36 |   0.0 -     0%  0% |    0  0.00 | 0.116  0.28 1.00 |  0.2  0.2  0.4  0.4
    
    grain tables -> ZurnaClip/grain-8.txt ZurnaClip/grain-5.txt ZurnaClip/grain-3.txt ZurnaClip/grain-2.txt ZurnaClip/grain-1.txt ZurnaClip/grain-0.569.txt ZurnaClip/grain-0.224.txt
    
    sub note runs (start s, note, x steps of 4 hops = 0.093 s held; runs of >= 5 steps shown; '.' = sub under 15 % of the energy):
    0.2s .x9  1.5s .x17  3.3s D1x5  4.0s D1x5  4.5s .x21  7.3s .x25  9.9s D1x5  14.5s D1x5  15.1s D1x5  16.3s D#1x9  18.4s A#2x6  19.7s B0x6  21.0s B0x7  21.8s C#1x5  22.3s .x5  23.0s D#1x6  23.9s D#1x9  25.9s D#1x6  26.7s B0x5  27.5s B0x7  28.7s G#2x5  32.4s D#1x5  39.8s D1x5  41.6s D1x5  43.7s D1x5  44.1s .x21  47.0s D1x5  47.5s .x21  49.7s D1x5  50.3s D1x5  50.8s .x20  53.6s D1x5  57.4s D#1x5  58.0s D#1x8  60.7s B0x6  61.8s .x8  62.9s D1x6  63.5s D1x5  64.8s D#1x5  66.8s .x5  69.5s D#1x5  71.1s D#1x9  72.2s .x5  73.8s B0x7  75.2s C#1x5  76.1s D#1x5  77.3s D#1x5  77.7s .x14  80.5s F#2x6  82.7s D#1x5  86.7s .x26  89.4s .x26
    
    beat grid: 143.555 bpm (beat 0.41796 s), phase 0.1509 s, coherence 0.205, 221 beats, DP residual 136 ms; downbeat = beat index 3 mod 4 (scores [7.597, 5.937, 6.657, 9.33]), 55 bars of 1.6718 s
      first downbeats: 1.405 3.065 4.725 6.362 8.022 9.671
    beat-synchronous grain tables -> ZurnaClip/grain-beat.txt ZurnaClip/grain-bar.txt ZurnaClip/grain-4bar.txt
    
    drops (bar-pinned; clause 1 = low end >= 0.55 of its p90 after a bar under 0.15; clause 2 = a sustained energy jump >= 0.25 with the low end loud after and under 0.45 before; both need the 4 bars after at 0.6 of the track p90 energy and 0.3 of its p90 onset density, and 4 bars since the last drop): 9.671(absence) 29.524(absence) 49.400(absence)
      bar low-end level (share of p90) per bar, 0.5 s resolution is the bar: 1:0.00 15:0.81 28:0.06 41:0.67 54:0.65 68:0.14 81:0.18
    
    tonic: D major  conf 0.005  (KK on a sub-inclusive chroma over the loud half)
      top 5: DM +0.534  Dm +0.531  Bm +0.363  GM +0.247  A#M +0.246
      chroma: C0.033 C#0.044 D0.276 D#0.165 E0.090 F0.069 F#0.064 G0.041 G#0.030 A0.058 A#0.053 B0.078
    
    sub slides (>= 1.0 semitone within <= 0.5 s, monotonic, voiced): 29 total, 2 on 57.6-90 s
      11.02->11.49 -7.2st  11.62->12.08 -2.5st  12.24->12.53 -1.7st  14.35->14.82 -6.1st  14.95->15.40 -2.7st  15.56->15.85 -1.8st  21.54->21.95 +2.0st  29.68->30.16 -7.3st  30.45->30.56 -1.4st  30.65->30.77 -1.2st  31.06->31.19 -1.1st  31.35->31.53 -2.1st  31.76->31.95 -2.6st  32.56->32.79 -1.3st ...
    bare 808 note starts (a low onset with no 2-8 kHz click within 15 ms): 123 of 270 low onsets (46 %); kick candidates 147
    
    sections (bar-synchronous, label = cluster id, ret = a return of an earlier section):
       t0      t1     bars id label ret
        1.405   9.671    5   0     0   0
        9.671  16.300    4   1     1   0
       16.300  29.524    8   2     2   0
       29.524  39.462    6   3     3   0
       39.462  44.431    3   4     1   1
       44.431  52.698    5   5     4   0
       52.698  57.678    3   6     1   1
       57.678  82.512   15   7     5   0
       82.512  90.778    5   8     6   0
    
    json -> ZurnaClip.json
    exit 0
