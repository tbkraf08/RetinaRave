# AUDIT v0.14 — GIELIS, the superformula nest that breathes with the music (scene id 10, 2026-09-27)

**The ask (the user, after the v0.13 tag):** *"goal new scene (slot 11); use 'see you drop' as the inspiration for the scene …
how can we use the superformula to visualize music?"* · *"torus2 is my favorite visually for how music lines up to the viz"*.

**The user has not looked at GIELIS yet.** Every number below is measured — headless on `#test` and the demo synths by the worker,
and on `~/Music/RetinaRave/SeeYouDrop.flac` by the orchestrator after the merge. Nothing here is approved, the scene is
forced-only (`score()` 0), and the two sentences the measurements do NOT satisfy are named in §3.

## §0 What v0.14 is, and the housekeeping (NAV2 is NOT validated)

One new scene, nothing else. `assets/scenes/gielis/` (4 modules, 819 lines) + `assets/math/gielis.js` (133) +
`tools/test_gielis.js` (98), registered at **id 10**, reached by `n` cycling or `&scene=10` — **no digit key** (the digit keys
stop at 9; the user accepted this in the interview). `score()` returns 0, so the director never picks it.

Four housekeeping commits before the worker, each with its own proof:

- **`d3422a1`** — **NAV2 v0.13 is tagged and deployed but NOT validated.** The user, the same day: *"I wouldn't say nav2
  validated. (I'm just taking a break tuning it)"*. The word "validated" in `NEXT-SESSION-PROMPT.md`, in the §46 closing line and
  in the v0.13 commit message is wrong; corrected, with **DECISIONS §46 addendum 8**. NAV2 is paused mid-tune. Its *mechanics*
  (`beat.js`'s press, the roots, `K_R`, `V_INT`, the running-peak bump) are therefore **not** a proven model and are **not**
  copied into GIELIS; only the user's music sentences from the NAV2 sessions carry over. NAV2 (id 8, key `9`) is untouched.
- **`20c7971`** — `torus2/waves.js`'s launch ring buffer lifted to `assets/math/waves.js` as **`mkWaves()`**, per caller (a
  module-level `AT/AM/W/PREV` would have made TORUS2's eight slots and GIELIS's the same slots — the trap `nudge.js` and
  `keycolour.js` already closed); `torus2/waves.js` re-exports TORUS2's own instance. **TORUS2's pixels did not move:**
  `IDS=3` s3 md5 `7189a6ba` / `48113eda` before and after, twice, = the v0.12 reference.
- **`b01a0a4`** — the empty GIELIS skeleton registered at id 10, so the no-op proof exists *before* any pixel: all twenty md5
  lines of ids 0–9 identical to the v0.12/v0.13 references before and after, mixs identical, parity fake 0. The skeleton's own
  s10 pair was `496ce9a8` twice (a cleared black frame).
- **`428e753`** — the instruments: `tools/accept/v0.13/nav2-window.py` extended **in place** (`KEY=` is now a comma chain of key
  presses, `KEY=9,n,n` reaches id 10; `SCENE=10` reads GIELIS's `hooks.info()` + `hooks.green()` as a GIELIS-shaped D line, full
  or `MIN=1` short) and **`tools/accept/v0.14/perbeat14.py`** (the per-beat Q swing / rest / n1 trough / waves / kick table).

Then the worker's eight `GIELIS:` commits (`a73894f` … `438aa5e`), one per proven step, merged as **`d4d3540`**.

Still open from earlier versions, unchanged by this one: the **Cloudflare dashboard steps** (open since v0.6), and
`site/thumbs/gielis.jpg` (one `tools/thumbs.sh "10:<frame>"` run when the user approves the look).

## §1 The no-op proof — GIELIS costs the rest of the engine nothing

Measured on the merged tree (`d4d3540`, PORT 8904/8907, `CLOCK=1`):

- **ids 0–9: all twenty md5 lines identical** to `tools/accept/v0.12/scene-md5-v012.txt` (s0–s7, s9) and
  `tools/accept/v0.13/scene-md5-v013.txt` (s8) — measured on the v0.13 tag, again after the `waves.js` lift, and again after the
  registration. `tools/accept/v0.14/scene-md5-v014.txt` is the full eleven-scene list.
- **s10 = `2c1b21c8` / `2e978a09`** at f360 / f840, stable across two runs and equal to the worker's own two runs.
  **`&still=1` = `89664dad` / `fe2809bc`** (`gielis-still-md5.txt`) — set at the worker's step 2 and byte-identical through steps
  3–8, re-measured on the merged tree. That pair is the no-op gate for every future GIELIS change: `hooks.still(1)` pins every
  music-driven uniform at its rest value (n1 at `N1_REST`, no waves, no flash, no shimmer, morph 0, the fallback key).
- **mixs 0→3 f178 `641f6633`** before and after the registration, and on a leftover shot of 2026-09-25. `tools/accept.sh` records
  **`f0c9d637`** for that line — a **pre-existing mismatch on this machine**, present on the 2026-09-25 shot too, and **not moved
  by v0.14**. It is an open item, not a v0.14 regression (§6).
- **parity fake: every field identical to 1e-9** (`parity-fake.jpg`).
- `node tools/check.js`: **0 fail, 4 warn** — three pre-existing line caps (FEIGEN 352, MAXWELL 467, NAV2 400) and
  `scene gielis: card without site/thumbs/gielis.jpg`, the allowed one.
- `tools/test_gielis.js` **OK**, `tools/test_torus2.js` **OK**, `param-smoke` **49 checks, 0 fail**.
- **Q trace** (`none`, house + aba, `ACC=v0.14`, three runs each, GIELIS not forced): GIELIS never appears in any run's scene sequence (bid 0), no FEIGEN visit; house q mean 0.73 / min 0.35, windows 0–40 · 40–70 · 70–100 · 100– = 0.56 · 0.71 · 0.83 · 0.93; aba 0.83 / 0.35, 0.56 · 0.71 · 0.83 · 0.98 — within 0.04 of the only earlier `none` trace (v0.2's: house 0.76, 0.60 · 0.74 · 0.86 · 0.96; aba 0.85, 0.59 · 0.73 · 0.85 · 0.99); the min 0.35 vs 0.48 is the load-time dip (`tools/accept/v0.14/q-{house,aba}-none.txt`, `node tools/q-stats.js`).
  <!-- orchestrator: one line here with q-house-none.txt / q-aba-none.txt medians and the verdict -->

## §2 What the worker built and proved headlessly

`math/gielis.js` is the superformula `r(φ) = (|cos(mφ/4)/a|^n2 + |sin(mφ/4)/b|^n3)^(−1/n1)`, its 3D spherical product, the
generated GLSL twin (constants equal to the JS to 0), the interval table and Green's **Q = 4πA/L²** on a 512-sample equatorial
profile. Green's Q is the only instrument that could see a per-beat pinch on NAV2 and it is the ruler here too.

### The species — twelve pitch classes, twelve lobe counts (`mTable()`, `M0` 4, `QCAP` 5)

| interval | ratio | exact `M0·p/q` | m drawn | turns to close (symmetric / lopsided) | lobes |
|---|---|---|---|---|---|
| unison | 1/1 | 4.0000 | **4** | 1 / 1 | 4 — a rounded square |
| minor 2nd | 16/15 | 4.2667 | **17/4** | 4 / 8 | 17 — *the one snapped entry* |
| major 2nd | 9/8 | 4.5000 | **9/2** | 2 / 4 | 9 |
| minor 3rd | 6/5 | 4.8000 | **24/5** | 5 / 5 | 24 |
| major 3rd | 5/4 | 5.0000 | **5** | 1 / 2 | 5 |
| fourth | 4/3 | 5.3333 | **16/3** | 3 / 3 | 16 |
| tritone | 7/5 | 5.6000 | **28/5** | 5 / 5 | 28 |
| fifth | 3/2 | 6.0000 | **6** | 1 / 1 | 6 |
| minor 6th | 8/5 | 6.4000 | **32/5** | 5 / 5 | 32 |
| major 6th | 5/3 | 6.6667 | **20/3** | 3 / 3 | 20 |
| minor 7th | 9/5 | 7.2000 | **36/5** | 5 / 5 | 36 |
| major 7th | 15/8 | 7.5000 | **15/2** | 2 / 4 | 15 |

Twelve distinct lobe counts, so twelve distinct shapes; consonances are simple and close in one turn, dissonances are starry and
take three to five. Only the minor second moved (4.2667 → 17/4, 0.4 %) because `16/15` needs **15** turns to close — over the
brief's own "≤ 8 turns" gate; every other entry is exact. Verified live: `hooks.key(0)` gives
`0:4/q1 · 7:6/q1 · 4:5/q1 · 6:5.6/q5 · 1:4.25/q4 …`, and `hooks.key(7)` rotates the whole table.

### The breath — the bar-series Q table (`hooks.green()`, per frame, `#test`)

**The gate window, f840–960 — the fake's PEAK (kick 1 on every beat, `eS` 0.54–0.57):**

| beat | m | rest Q | trough Q | swing | beatPhase at the trough | n1 min |
|---|---|---|---|---|---|---|
| 29 | 5.000 | 0.9954 | 0.7761 | **0.2193** | 0.002 | 1.200 |
| 30 | 5.000 | 0.9954 | 0.7761 | **0.2193** | 0.001 | 1.200 |
| 31 | 5.000 | 0.9952 | 0.7761 | **0.2191** | 0.034 | 1.200 |
| 32 | 7.500 | 0.9911 | 0.6664 | **0.3247** | 0.998 | 1.200 |

**The brief's own window, f600–720 — which on the fake timeline is the BUILD (kick 0, `eS` 0.145–0.289):** swing
0.1175 / 0.1241 / 0.1308 / 0.2002 / 0.2120 over beats 20–24, rest Q ≥ 0.9897, n1 trough 1.79–1.97 — two of five over the 0.15
gate. That is the shallow end **by construction**: the depth scales with `eS`, which is the rule that makes 25 s press harder
than 0–13 s on the track. n1 dips at beatPhase 0 on every beat in both windows.

### The waves — every sound a bump travelling round every ring (`hooks.info()`, `&pinch=6`)

| pin | frame | `info().kick` positions | gaps |
|---|---|---|---|
| `train('4x4')` | 480 | .1333 .1333 .3833 .3833 .6333 .6333 .8833 .8833 | **.25 .25 .25** |
| `train('sync')` | 700 | .0278 .0278 .1528 .1528 .5278 .5278 .6528 .6528 | **.125 .375 .125** |
| the real `#test` edge detector | 900 | kick .2497 .4994 .7492 .9989 | .25 (snare .4994 .9989; hat eight, all three bands live, `live` 14) |

Each position is doubled because a wave a bar old sits exactly where the new one launches (TORUS2's de-duplication note). The
4x4 train's absolute offset is 0.1333 and not 0 because f480 is not a bar line — the **gaps** are what the pattern promises and
they are exact.

### The cost — 0.50× TORUS2 (cap 1.5×)

Bench protocol (`q` pinned 0.95, 9 s settling, the cold call discarded, n = 300, five interleaved pairs), both scenes forced and
`CARD.fix = {build: 1, tension: 1, arousal: 1, arc: 'peak'}` so both are benched at their **widest** (GIELIS all twelve families,
`seg 52/7140`; TORUS2 `fib 144 seg 160`, morph 0.90):

| | median ms | NAV median | ratio to NAV |
|---|---|---|---|
| GIELIS s10 | **0.6580** | 1.5027 | 0.4388 |
| TORUS2 s3 | **1.3267** | 1.5237 | 0.8546 |

GIELIS / TORUS2 = **0.496×** on the raw medians, 0.503× NAV-normalised, 0.513× as the median of the per-pair ratios. `glerr` 0,
`errs []` after every bench. The CPU side (`hooks.timeUpdate(300)` — the twelve families, the species table, the waves and the
512-sample Green trace) is **0.052 ms** against the 0.5 ms gate (the browser quantises `performance.now()` to 0.1 ms, so the
batch mean is the number; `test_gielis` item 7 measures the ruler alone in node at 0.0525 ms, i.e. the Green trace is
essentially the whole CPU cost and `N_Q` 512 is the knob).

**Segments per tier** (all twelve families drawn, `SEGT` per turn, `SEGMAX` 96 per ring, `RINGS` 7 in every tier because
`cuts: 'continuous'`):

| tier | `SEGT` | per ring, q = 1 / 2 / 3 / 4 / 5 | total |
|---|---|---|---|
| 0 | 16 | 16 / 32 / 48 / 64 / 80 | **4 144** |
| 1 | 26 | 26 / 52 / 78 / 96 / 96 | **5 726** |
| 2 | 38 | 38 / 76 / 96 / 96 / 96 | **6 566** |
| 3 | 52 | 52 / 96 / 96 / 96 / 96 | **7 140** |

The twelve families always cover all twelve intervals, so the multiset of turn counts {1,1,1,2,2,3,3,4,5,5,5,5} is the same in
every key and these totals are key-independent. The resting six or seven families draw 3 200–3 800 at tier 3.

### The continuity monitor — `viol []`, and two findings

`viol []` on `#test` 40 s (`{n 2407, fast 0, max 0.0583}`) and on 60 s of the house synth (`{n 3606, fast 0, max 0.0533}`).
Two things had to change before that was worth anything:

- **`state.pathCut` is a constant 9, not 0.** `tools/monitor.js` reads `legal = N.pathCut <= 2 || …`, so the brief's literal
  `pathCut: 0` would have declared **every** frame a legal cut and made `viol []` true by construction. GIELIS has no cuts, so
  every frame is now measured.
- **The witness cannot be "the loudest family's rim"** (the brief's sentence): the loudest family changes by a *swap*, a
  discontinuity in the witness and not on screen — the first 60 s run read **16 violations, every one a reorder**. The witness is
  now the chroma-weighted mean family radius times the mean radius of the shared latitude profile at the pinch and lean in force
  (`nest.js witnessR()`): it sees the breath, the lean, the growth, the drop and the sub's fattening, and never the species. (The
  brief's other suggestion, the nest's centroid on screen, is exactly 0 for a centred nest and would have proven nothing.)
- **Three event-driven quantities stepped** in the first cut — `dropEvt` → the collapse, `surpriseEvt` → the twist,
  `sectionEvt` → the rings' phase. The drop stepped the witness by 0.063–0.072 per frame on the fake's own drops at 13 s and
  37 s: over the 0.06 spike rule, and a genuine on-screen jump. All three now attack/ease (**`ATK` 0.12 s** for the drop and the
  twist, **`PHITC` 0.35 s** for the phase, the short way round the turn). At 124 bpm a 0.12 s attack is a quarter of a beat: it
  still reads as a slam.

### The four leans the worker changed, with the worker's reasons

1. **The resting lean (2, 2, 1, 1) → `BASE` (1, 1, 1, 1).** The brief's tuple is **exactly a circle for every m and every n1**:
   `|cos t|² + |sin t|² = 1`, so `r = 1^(−1/n1) = 1`. Pythagoras, not taste. With it the whole breath would have been a no-op at
   rest and the beat would have deformed nothing until a section pulled the lean off round — the opposite of the user's sentence.
   (1, 1, 1, 1) is the same family one exponent lower: still a circle as n1 → ∞ (rest Q ≥ 0.9876 on all twelve families) and the
   pinch acts. `test_gielis.js` item 4.
2. **`N1_BEAT` 1.5 → 1.2.** At 1.5 the ROOT family (m = 4) swings only **0.106** of Q through a beat — under the brief's own
   ≥ 0.15 gate — while the starry families swing 0.15–0.32. 1.2 puts all twelve over it (0.158–0.414) with rest Q ≥ 0.988.
3. **The press travels along `1/n1`, not along `n1`** — the single most important change in the scene. `1/n1` IS the exponent of
   the superformula and the shape is a circle for every n1 above about 4, so the brief's linear ramp spent two thirds of its
   travel where nothing happens: measured, the first step-3 series dipped n1 to 7.8–8.4 on every beat and Q moved
   **0.9916 → 0.9791** — invisible. `pinchOf(d) = 1 / (1/N1_REST + (1/N1_BEAT − 1/N1_REST)·d)` makes a half press n1 2.56 and
   Q 0.92 — a shape.
4. **`depth = breath`, not `(0.5 + 0.5·eS)·breath`.** The `breath` parameter's own `from()` IS `0.5 + 0.5·eS` (the brief's own
   table), so the brief's product squares `eS` — it left the fake's build window at d = 0.41 where the unsquared expression gives
   0.64.

Two further corrections that are arithmetic, not taste: the brief's "the fifth six lobes over **two** turns" is wrong (m = 6 is
an integer and closes in **one** turn — the q-turn rule uses the denominator of the *reduced* m), and the rule holds only under a
**symmetric** lean; a lopsided lean needs 2q turns when the numerator is odd, so the scene draws the symmetric count and skips
the wrapping segment (`uOpen`) whenever the lean or the unwind has opened the ring.

### The six parameters (§1.16) and what else is in

`breath` (0.5 + 0.5·eS) · `wave` (`WAVE0` + 0.1·kick) · `turn` ((beatCount/16)·2π mod 2π) · `size`
(.58 + .1·intensity + .07·arousal + .15·min(1, max(0, 2·build − 1))) · `lean` (`MORPHK`·tension·(arc idle ? 0 : 1)) ·
`glow` (`FLOOR`·(1 − `GLOWQ`·max(hush, calm))). `paramsOf === derived` for all six with a difference of exactly **0**;
`&param=gielis.breath=c:1` moves the s10 pair to `794e40d0` / `7c210b0a`. Five of the six `from()`s are the inline expressions
moved whole and byte-identical (proven with `&param=gielis.wave=c:0.26`, the constant the sixth replaced, reproducing the
pre-move pair `d7806c9b` / `a0097ad3`); **`wave` is the one behavioural change** and is declared as such — steps 1–7 read the
constant `WAVE0`, so `WAVE0 + 0.1·kick` is a real visual change.
`feats` is 38 fields with `help.feats` 38 and 0 gaps; `clarity` and `regularity` were **dropped** because `score(MS) { return 0; }`
reads nothing and listing them would be a lie the help view shows. `post` is TORUS2's, unchanged. `colour` declares **`v2` alone
— the `oklch` variant is not built** (the brief forbids it; it stays a later opt-in).

## §3 SeeYouDrop, window by window (the merged tree, `KEY=9,n,n SCENE=10`, `au capture`, `errs []`, `scene 10` on all eleven runs)

The five windows the user chose in the interview: `T0/N` = 0/14, 25/40, 49/10, 96/6, 104/8, one shot + one D line every ~1.1 s,
plus four **per-frame** traces (`DT=16 SHOT=0 MIN=1`, 250 samples ≈ 5 s each) read by `perbeat14.py`. Every D line's probe clock
runs ≈ 2 s ahead of the track; the track times quoted below are the media element's own `currentTime`.

**The ruler, first, because it is the thing that is NOT met.** The brief's gate is *Q of the loudest family swings ≥ 0.15 on ≥ 90 %
of the beats in 25–63 s*:

```
trace (250 frames)      track      beats  Q swing med  swing >= 0.15   Q rest med  back to Q >= 0.9  n1 trough med  waves med  kick med
groove-trace            27–32 s      13      0.130       1/13   (8 %)     0.994        13/13             1.25          7        0.34
groove-trace2           33–38 s      13      0.155       8/13  (62 %)     0.994        13/13             1.24          9        0.46
break-trace             50–55 s      12      0.095       0/12   (0 %)     0.997        12/12             1.56         11        0.00
double-trace            97–102 s     12      0.157       7/12  (58 %)     0.997        12/12             1.33         10        0.27
```

- **The swing ruler is NOT met** anywhere: 8 %, 62 %, 0 %, 58 % against 90 %. The two groove traces, five seconds apart on the
  same groove, disagree by a factor of eight on the same gate — a 13-beat window is too short to settle the number, and a longer
  trace overflows the argv (§6).
- **The rest between beats IS met, on every beat of all four traces** (Q ≥ 0.9 reached on 49 of 49 beats, median rest Q 0.994–0.997).
  The user's "the silence rebounds to the circle" is satisfied exactly.
- **The breakdown is shallower with `kick` 0, as designed** (the depth scales with `eS`): n1 trough 1.56 against 1.24–1.33 in the
  groove, swing median 0.095, and the hats carry the edge (waves median 11, the highest of the four traces).
- **The depth is bounded by the shape, not by the press.** n1 reaches 1.24–1.33 against `N1_BEAT` 1.2 on the groove — the pinch is
  essentially full on every beat, and the Q swing is still only 0.13–0.16. More press buys nothing; the levers are `N1_BEAT`, the
  lean at the pinch and the number of rings (§5 items 3 and 4).

### "this song is an example of the extreme; 0-13s the high rise up to their max (edge should be bumping on every beat / light oscillating off the edge)" — the intro, 1.4–15.9 s (14 shots, `montage-gi-syd-intro.jpg`)

A **full nest from the first shot** — twelve families drawn on the first three shots and 9–11 thereafter, cyan/green, `size` 0.64–0.70, `waves` 4–8, `eS` 0.51–0.86. The breath
is visible at the 1.1 s sampling: n1 1.42 / Q 0.760 at 4.8 s, n1 2.64 / Q 0.927 at 9.2 s, n1 1.23 / Q 0.759 at 13.7 s, against
n1 8–10 / Q 0.992–0.996 between. `kick` reads 0.09–0.44 here, exactly the weak intro the brief warned about, and the breath does
not care: it is read off the engine's beat **grid** (`press = max(0, cos 2π·beatPhase)^4`), never the kick detector.
**Not as the user described it:** there is no *rise* to a max — the nest is already full at 1.4 s, so "the highs rise up to their
max" has nothing to grow into. The growth lever (`FIBMIN/FIBMAX` 6→12 on `build`) is spent before the window starts.
**Measured, and not in the track notes:** the engine fired a **full-strength `dropEvt` between 9.2 and 10.4 s** (`ds` 0.96,
`dropEnv` 0.71 → 0.20 → 0.06 → 0.02 → 0 by 15.9 s, `arc` → peak). The track was documented as having **two** drops, 47 s apart.
This is the engine's bass-returns rule, not the scene's, and GIELIS answers it with the collapse-and-rebound because there is no
cut and no refractory — but it means the intro carries a drop the user has never been told about.

### "25s-1m03s set should be bumping in some way with each beat (as beat evolves the set should come back to a slightly different shape) … at 25s it really starts moving the edge on every beat" — the groove, 26.4–69.7 s (40 shots, `montage-gi-syd-groove.jpg`)

- **Per beat:** the two traces above, inside this window. The bump is there on every beat and the rebound is there on every beat;
  the *amplitude* is 0.13–0.16 of Q where the brief asked for 0.15 on 90 % of beats.
- **"comes back to a slightly different shape" is met by the species, not by a gate:** the loudest pitch class walks
  8 → 11 → 3 → 1 → 7 → 4 → 2 → 0 across the window, and with it m walks 4 → 4.8 → 6 → 5.33 → 7.5 → 6.4 → 5.6 → 5 — a rounded
  square, then 24 lobes over five turns, then six lobes, then sixteen over three. Twelve species, by construction.
- **The luminance.** `lum.py` on the first ten groove shots: centre **0.15–0.31**, rim **0.009–0.07**, ratio 3.7–23. The nest is
  the bright thing and the frame around it is black. `sat13.py` p95 luminance on the same shots: **0.20–0.45**, bright fraction
  0.08–0.16, `sat(bright)` 0.51–0.74. **The brief's gate (p95 luminance in 0.6–0.8 on the groove) is NOT met** — the groove reads
  0.20–0.45, i.e. **the nest is dark, not too bright**. The user's own sentence for v0.13 was the opposite complaint ("too
  bright … detail washed out"), so this is the risk in the other direction, and the knobs are `FLOOR` 0.18 / `GLOWQ` / `KNEE` 0.8
  (§5 item 2). Saturation is not the problem: 0.51–0.74 on the bright pixels.
- **The sections do change the lean:** `sectionAlt` 1 → 2 → 3 across the window, template `petal` → `blade` (40.0 s) → `shard`
  (47.8 s), morph 0.15–0.57. Only three of the four templates do anything, because `round` is now `(1, 1, 1, 1)` = `BASE` (§5 item 3).
- **The hue sweeps more than a full turn:** the reported hue coordinate climbs monotonically 0.278 → 1.631 over the 43 s, fastest
  after the 58 s drop (0.81 at 58.6 s → 1.63 at 69.7 s). On the montage that reads as the whole wheel — blue, pink, cyan, green,
  yellow, red. **But the key is not what moves it here:** the engine reports **key 6 major** for the first three samples
  (26.4–28.6 s, wrong on a G♯ minor track) and then **key 8 minor** — the right key — for the remaining 37 samples, while the hue
  goes on climbing. So the sweep is the anchor's own ease plus valence/spread under a *stable* key, not a wandering key, and a
  scene-side slower ease is the lever (§5 item 5).
- **The drop at 58 s reads.** `ds` 1 with `dropEnv` 0.35 at 58.6 s, `draw` falling 12 → 8, `waves` 12 → 15, and on the montage a
  burst. Cost through the window: `ms` 0.62–2.37, `q` 0.55–0.58, `errs` 0.

### "the part that was missing ripples was 50s-57s … feel like there should be more skinnier waves, (vs bass fatter waves)?" / "no sound -> quiet (ie. wave not generated)" — the breakdown, 50.4–60.4 s (10 shots, `montage-gi-syd-break.jpg`)

`kick` is **0.00** from 51.5 s to 57.1 s — six seconds, as documented — and the nest keeps breathing on the grid: per frame, 12
beats with n1 trough median 1.56 and the rest at Q 0.997. **The ripples the user missed are there:** `waves` 6–11 through the
quiet bars with `hat` up to 0.68 at 53.8 s, i.e. the thin band (`WAVEW` 0.008) carrying the edge while the fat kick band is
silent — exactly §45's thin-waves rule. At the 1.1 s sampling two shots catch the nest fully at rest (n1 = 12, Q 0.998) — the
montage cannot see a 0.1 s pinch, which is why the per-frame trace exists.
The **58 s drop** lands inside this window: `ds` 1 / `dropEnv` 0.55 at 57.1 s, then n1 1.32 / Q 0.890 with `waves` 15 at 58.2 s
and `waves` 17 at 59.3 s. p95 luminance 0.14–0.38 through the quiet bars, **rising to 0.545 / 0.490 / 0.718** on `break-07..09` —
the drop is the only place in the whole session that reaches the brief's brightness band, and it reads as a yellow burst.

### "at 1:38 it goes double time -> should be moving faster / reacting more" — double time, 97.4–103.0 s (6 shots, `montage-gi-syd-double.jpg`)

The energy peak: `eS` 0.86–0.94 on the first four shots, the highest of the session. Per frame (97–102 s): 12 beats, Q swing
median **0.157** — the best of the four traces — and 7 of 12 beats over the gate, n1 trough median 1.33, waves median 10. So the
double-time stretch **does** react more than the groove, by the numbers. The loudest family is pitch class 4 with **m 7.2** (the
minor seventh, 36 lobes over five turns) at 98.6–99.7 s: the densest species in the table, and on the montage the frames are
dense magenta rings — with **one glitch row at ~101 s**, the composite's own surprise. `ds` 0 throughout: no drop here.

### "1:45 -> this is where the highest energy is, should be reacting more" — the 1:45 drop, 105.4–113.1 s (8 shots, `montage-gi-syd-drop.jpg`)

**The engine fired no drop at 1:45 in this run.** `dropStrength` is **0** and `dropEnv` is **0** on all eight samples of the
window (105.4 → 113.1 s), `arc` build → sustain. AUDIT-v0.13 saw the same thing twice under NAV2: 1:45 is the engine's
bass-returns rule and it is run to run. So **GIELIS's answer to the user's biggest moment is untested** — what the window shows
is the ordinary breath at high energy (`eS` 0.69–0.81): the pinch sampled at 110.9 s is n1 1.31 / Q 0.851 with p95 luminance
0.503 (the cyan frame on the montage, `gi-syd-drop-06`), and the rest of the window sits at p95 0.19–0.35. The 58 s drop
(§3, the breakdown window) is the proof that the collapse-and-rebound reads at all; the 1:45 one has to be caught on another run.
The key here reads **6** (major → minor) for the whole window, again not the track's G♯ minor.

## §4 The other two tracks — shown, not tuned

The user has not asked for either; these are 0–30 s montages so nothing is a surprise later (`gielis-window-gi-{cn,wltp}-intro.txt`,
`montage-gi-{cn,wltp}-intro.jpg`, 30 shots each, `errs []`, `scene 10`, no `dropEvt` in either).

```
                  bpm    key(s) reported   hue span     n1 min..max   Q min..max     waves   kick max  eS         loudest pcs seen   templates
CyborgNinja       159.8  2m, 7m            0.272–0.325  1.21 .. 9.17  0.830 .. 0.999 11–21   0.83      0.69–0.89  0, 1, 2, 7         petal, blade
WhoLikesToParty   116.7  11m (stable)      0.450–0.461  1.30 .. 9.65  0.658 .. 0.997 18–24   0.59      0.59–0.81  0, 2, 4, 6, 7-9,11 all four
```

- **CyborgNinja** breathes on every beat (the deepest sampled pinch n1 1.21) but its loudest family is almost always pitch class
  0, 1, 2 or 7 — the one-note bassline NAV2 found on this track — so the species barely changes: four of twelve shapes in 30 s.
  Its hue is nearly fixed because the key only flickers between two minor keys a fifth apart.
- **WhoLikesToParty** is the best-behaved of the three: one stable key for 30 s, a hue that does not wander (0.450–0.461), eight
  different loudest pitch classes, all four section templates, the deepest pinch of the session (Q 0.658), and 18–24 waves alive.
  Nothing to name.
- Both cost the same as SeeYouDrop (`ms` 0.52–2.23).

## §5 The retune list for the user's look — ranked

Ranked by how much the measurements say it matters, not by how easy it is. Every item is one named constant or one table.

1. **Size — the nest fills only ~40 % of the frame height** on a black rim (`lum.py`: rim 0.009–0.07 against a centre of
   0.15–0.31). `size` is 0.64–0.76 through the groove, `FILL0` 0.6, `FILLMAX` 0.85, `CAM_D` 3.2·size. This is the first thing the
   eye reports.
2. **Brightness — p95 luminance 0.20–0.45 against the brief's 0.6–0.8.** `FLOOR` 0.18 (the `glow` parameter's ceiling), `GLOWQ`
   0.4, `KNEE` 0.8 / `KNEE_S` 3. Raising `FLOOR` toward 0.3 lights the inner families without touching the rim; the knee is the
   knob if the peaks then wash. The one place the band is met is the 58 s drop (0.49–0.72).
3. **The breath's visible depth.** The Q swing is 0.13–0.16 with n1 already at its trough (1.24–1.33 vs `N1_BEAT` 1.2), so the
   press is spent: the remaining levers are the **lean at the pinch** (`n2` / `n3`; and the templates — `round` is now
   `(1, 1, 1, 1)` = `BASE`, so a `round` section shows **no** lean at all and only three of four templates do anything; a fourth
   distinct tuple, e.g. `(2, 0.7, 1, 1)`, makes every section its own shape) and **`N1_BEAT`** itself (1.5 with the reciprocal
   law is the worker's own next try: swing 0.14–0.30).
4. **The hoops → a shell.** The nest reads as a stack of seven glowing hoops, a lantern, not a surface: `RINGS` 7 and `PHI_MAX`
   0.85. 9 or 11 rings would read as a shell at a proportional cost — and there is room, because the 8 000-segment cap comes from
   §14's **path-A** rate (0.4 µs/segment) while path B measures 0.067–0.092 µs/segment here, roughly **3×** headroom.
   `SEGT = [24, 40, 60, 84]` with `SEGMAX` 160 would be ~11 700 segments at about 1.0 ms — still 0.75× TORUS2 — and would also
   fix the q-turn coarseness (a five-turn family gets 19 segments per turn today, under seven per lobe: its lobes read as a
   pentagon/heptagon outline on the pinched frames, which is visible on the montages).
5. **The hue wander.** The hue coordinate climbs 0.278 → 1.631 across the 43 s groove — more than a full turn — while the engine's
   key is stable at 8 minor for 37 of 40 samples, so this is the anchor's ease and the mood terms, not the key. It is the same
   `mkAnchor()` TORUS2 uses, so the honest lever is a **scene-side slower ease** (`HUETC` 0.7 s as passed) rather than a change in
   `math/keycolour.js`. The engine's key is separately wrong at the start of three of the five windows (key 6 major, and 1 and 4,
   on a G♯ minor track) — that is the extractor, not GIELIS.
6. **`M0` 4 and the ratio table, against the fallback `m = k + 3`.** The ratios are the reason the shapes differ, and they differ
   a lot: a nest whose loudest family is a minor seventh (36 lobes over five turns) looks categorically different from one on the
   tonic (a rounded square). If the user reads that as noise rather than as species, `mOf()` is one function and the whole table
   lives in `math/gielis.js`.

Also on the list, lower: `WAVE0` 0.26 and `WAVEW` (inherited from TORUS2's 144-ring nest; on twelve shells the same fraction may
be too fat — and the `wave` parameter's resting value is `WAVE0`, so a route can answer it without a code change), and `ATK`
0.12 s if the drop should hit harder — for which the honest answer is not a faster attack but a declared cut (`cuts: 'event'` and
a `pathCut` that goes to 0 on `dropEvt`), which is a contract change and not a lean.

**The digit-key question is the user's**, to be raised once when they approve: a tenth digit key, or GIELIS taking a slot. Until
then id 10 stays forced-only, `score()` 0, reached by `n` or `&scene=10`.

## §6 Measuring notes

- **Reaching id 10 headlessly.** `nav2-window.py` takes `KEY=9,n,n` (key `9` forces id 8, `n` cycles the registry twice to 10) and
  `SCENE=10` to read GIELIS's own hooks. Every run confirmed `scene 10`, `au capture`, `errs []` before the numbers were read.
  `&scene=10` is the other way in; the digit keys stop at 9.
- **250 samples, not 500.** `DT=16 SHOT=0 MIN=1` gives a per-frame trace, but the whole step list is one argv: at 500 samples it
  overflows. 250 samples is ~5 s, i.e. 12–13 beats per trace, which is why the two groove traces disagree (8 % vs 62 % over the
  swing gate) — the ruler needs a longer trace than the argv allows, so it should be read as several windows, not one.
  The realised sample interval is **19–21 ms**, not 16: the eval round trip, not the page.
- **`perbeat14.py <trace> [full]`** (`SWING=0.15 REST=0.9` overridable) is the per-beat table; `full` prints every beat.
- **A montage cannot judge a per-beat pinch** (AUDIT-v0.13 §8, one level finer here): the 1.1 s window sampling caught the nest
  fully at rest (n1 = 12, Q 0.998) on several breakdown shots where the per-frame trace shows the thump pinching to 1.56 on every
  beat. Shots are for the look; the trace is for the ruler.
- **Probe time ≠ track time** (≈ +2 s on the D line's own clock). The track times in §3 are the media element's `currentTime`,
  read immediately before each shot; the shots land ~1.1 s apart, not 1.0 s, so shot index × 1 s is not the track time — e.g.
  `gi-syd-drop-06` is track **110.9 s**, not 1:45.
- **The mixs mismatch is pre-existing.** `mixs 0→3 f178` measures `641f6633` on this machine (before the registration, after it,
  and on a leftover shot of 2026-09-25) where `tools/accept.sh` records `f0c9d637`. Not moved by v0.14; it belongs to whatever
  changed this machine's transition rendering earlier, and it should be re-based or explained before the next release.
- **`check.js`'s four warns** are three pre-existing line caps and the missing `site/thumbs/gielis.jpg`. One `tools/thumbs.sh`
  run closes the fourth when the look is approved.
