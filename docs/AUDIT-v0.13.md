# AUDIT v0.13 — NAV2 "bump with the beat" on SeeYouDrop, and Green's theorem (2026-09-26)

**The ask (the user):** *"audit the NAV2 scene with SeeYouDrop.flac; can make modifications; I want the mandelbrot set to bump with
the beat. no beat == more of a circle (some variation), as the beat happens it spirals in showing the complexity of the mandelbrot
set. The edge of the set should always be moving with the music. How can Green's theorem help?"*

## What NAV2 did before (`det13-syd-before.txt`, `montage-nav2-syd-before.jpg`, key 9, 80 s from 11 s)

- c rested ON the rim: ρ = |λ| 0.877 / 0.926 / 1.000 (min / median / max) on all 29 interior samples — v0.8's `RHO_FREE` 0.91 plus
  the wind. The Julia set was always a spiky blob; a hit nudged ρ by `K_HIT` 0.35 × hit, invisible.
- One gate (into the period-2 disc at ~40 s). The drop at 58 s threw c outside the set for 20 s of Cantor dust (10 samples EXT,
  NAV's 48-beat settle rule at `arc` peak), then HOME.
- Nothing measured the shape: "is it a circle" and "is the edge moving" had no numbers.

## What changed (DECISIONS §46) — two retunes on the v0.8 machinery, one instrument, one uniform

1. **The beat is the press.** `detect.js` `bump` = a peak-hold of `kick` / `hit` decaying with `BUMP_TAU` 0.35 s, and `pulse` = its
   2 s ema (the beat's density). `nav2.js`: the radial target is `mix(RHO_REST 0.30, RHO_CAP, press)` with press = wind +
   `BUMP_K` 1.0 × bump + `PULSE_K` 0.8 × pulse; `K_R` 4 → 10 so ρ follows within a beat. No beat, no wind: c rests at ρ 0.3, a
   quasi-circle the melody still turns. A kick: ρ → 0.98, the Koenigs arms wind up (their tightness is arg λ / ln|λ|), and
   `CURL_B` 0.5 × bump curls them further — "spirals in showing the complexity". Between kicks it breathes back.
2. **Gates under a pulse** (`GATE_RHO_MIN` 0.86 → 0.80, `GATE_LEAK` 0.3): the held pressure leaks between pulses instead of
   resetting, so a beat landing on a root a few times in a row opens the gate. Chosen by a node sweep (16 combinations of
   `BUMP_TAU` / `PULSE_K` / `GATE_RHO_MIN` / `GATE_LEAK`): the mildest setting where a plain kick-per-beat timeline opens AND closes a
   gate in 60 s with 0 continuity violations.
3. **Outside the set** (`exit.js` `BUMP_LG` 1.5): the exterior target potential is pulled in by the beat, so the dust condenses
   toward the set on every kick — the edge bumps out there too.
4. **Green's ruler** (`green.js`, `hooks.green()`, `tools/test_green.js`) — below.
5. **`uRound`** (`shaders.js`, rest 0 = an exact x*1, the `&still=1` convention kept): the picture brightens by 1 + 1.5 (1 − ρ).
   A round set is a smooth one, and the distance-estimate glow has less edge to light: on the same ten window frames the centre
   luminance had fallen to 0.02–0.35 (median 0.06) against v0.12's 0.05–0.47 (median 0.20); with `uRound` it reads 0.09–0.29
   (median 0.19), rim 0.17–0.59 against 0.17–0.48.

## What the trace says now (`det13-syd-after.txt`, `montage-nav2-syd-after.jpg`, `nav2-window-*.txt`)

```
                          rho (INT) min / med / max     Q = 4πA/L²  min / med / max    edge speed v med / max   v > 0    gates   ms
SeeYouDrop v0.12 NAV2     0.877 / 0.926 / 1.000         —                               —                        —        1       2.02
SeeYouDrop v0.13 NAV2     0.671 / 0.827 / 0.985         0.700 / 0.805 / 0.947           0.189 / 0.578            29/29    1       2.04
```

- **Bumps with the beat:** the per-second window 46–70 s reads ρ 0.70 → 0.89 → 0.94 → 0.96 → 0.93 → 0.80 → 0.98 across the
  breakdown's hits and the drop, `bump` 0.04 → 0.73, Q 0.86 → 0.74; the 80 s trace never sees a beatless sample on this track
  (`bump` ≥ 0.15 on all 29), which is the track, not the scene.
- **No beat == a circle, proven twice:** (a) the paused start (`montage-nav2-syd-paused.jpg`: the tab paused 8 s at 46 s) — ρ
  0.97 → 0.39 over the eight seconds (the pre-drop build's wind holds the last 0.09), Q 0.71 → 0.96, v 0.09 → 0.006; the first
  kick after play: ρ 0.74, v 0.31. (b) `test_nav2.js` on a beatless timeline: ρ settles at 0.300 = `RHO_REST`, Q ≥ 0.977 over
  the last 10 s, the melody keeps the edge moving on 100 % of frames.
- **The edge always moves:** v > 0 on every interior sample of the 80 s trace (median 0.19 units of c per second along the
  equipotential, max 0.58 on a kick); with the music paused it falls to 0.006 — silence is the one place it may stand still.
- **The drop** is unchanged (the one cut, 20 s outside); out there the beat pulls the dust in by `BUMP_LG`.
- Cost unchanged (2.04 vs 2.02 ms engine median); `measure()` 0.032 ms in node; `errs []`; s8 md5 17f888e8 / 83d37910, twice.

## How Green's theorem helps

The Julia set's edge is a fractal: its length is infinite and "how round is it" has no answer on the edge itself. Its
**equipotentials** — the curves |φ_c(z)| = R of the Böttcher coordinate — are smooth closed curves that shrink onto it, and
Green's theorem turns a trace of one of them into the three numbers the user's sentences need:

- **Area from the boundary alone:** A = ½ ∮ (x dy − y dx). No filling, no counting pixels — 256 points on the curve, 0.03 ms.
- **Roundness:** Q = 4πA / L² (the isoperimetric quotient), 1 for a circle and less for anything else. "No beat == more of a
  circle" is now a gate: Q → 1 as ρ → 0 (c = 0 gives ψ = id and Q = 1 exactly; 0.99 at ρ 0.2, 0.93 at 0.5, 0.81 at 0.8, 0.72 at
  0.95 along the 1/3 root, `test_green.js`).
- **Edge motion:** dA/dt = ∮ (v · n) ds — Green's divergence form: the area's rate of change is the flux of the boundary's
  velocity — plus the mean |v| of the material points (the same external angles, frame to frame). "The edge should always be
  moving" is now a gate: v > 0.
- **Why it is the right ruler:** Gronwall's area theorem (Green applied to ψ_c(w) = w + a₀ + a₁/w + …) says A = π (R² − Σ n |aₙ|²
  R⁻²ⁿ) — the area the curve LOSES against the disc is exactly the weight of the Laurent tail, i.e. how far the set is from
  round. One scalar, and it is the same "complexity" the arms show.
- The curve is traced by pulling a large circle back through z ← ±√(z − c) with the branch continuous in the external angle
  (level m at angle t is level m−1 at angle 2t, since φ(f(z)) = φ(z)²); for c in M it closes by itself. Outside M the level curve
  pinches and Q means nothing — a trace reads it with the mode.
- What Green's theorem does NOT do: move the set. ρ = |λ| does that (the multiplier of the attracting cycle, chart-free every
  frame), and arg λ / ln|λ| is the spiral. The theorem is the measurement that makes the three sentences testable — and the
  argument principle (Cauchy's theorem, Green in complex form) is the same tool behind the phase-winding colour variant still
  on the list.

## Not proven / open

- A beatless passage on a real track: SeeYouDrop has hits throughout; the circle is proven by the paused start and in node.
- `RHO_REST` 0.30, `BUMP_K` 1.0, `PULSE_K` 0.8, `CURL_B` 0.5, `BUMP_LG` 1.5, `ROUND_G` 1.5 were chosen by eye on this one track
  (the four gate/press constants by the node sweep). CyborgNinja / WhoLikesToParty / Malicious were not re-watched.
- The drop's 20 s outside is NAV's settle rule, untouched; whether a drop should throw c out at all is the user's call.
- v0.8's `nav2-still-md5.txt` identity (NAV2 `&still=1` = NAV byte-for-byte) no longer holds: c's path differs. `&still=1`
  still zeroes every NAV2-only uniform including `uRound`.
- NAV2 stays id 8 / key 9 / forced-only; the swap question (NEXT-SESSION-PROMPT) is unchanged.

## After the user's look (the same day): "25s-1m03s set should be bumping in some way with each beat (as beat evolves the set should come back to a slightly different shape); 1m04 it starts to get swirly/wobbly; also is a little too bright (detail is getting washed out)"

The first cut's trace names each: between kicks the beat's density held ρ at ~0.74, so the outline hardly moved; on every kick the
press reached `RHO_CAP` 0.985, where the smoulder (`par²`) is the drop's light — the wash-out; and 1:04 is the drop's exterior
leg (20 s of dust under NAV's 48-beat rule at `arc` peak) with the swirl detector at 0.93–1.0 turning the frame at 0.66–0.79 rad/s.

- `RHO_BEAT` 0.93: the beat presses to this, the wind alone reaches `RHO_CAP`. `PULSE_K` 0.8 → 0.4: ρ falls to ~0.6 between kicks.
  `zoom` pumps in 6 % on the kick. `GATE_RHO_MIN` 0.80 → 0.72 (second node sweep: 0 gates at 0.80 under the capped press, 8 in 60 s
  at 0.72 / leak 0.3 — "come back to a slightly different shape" IS a gate, period 1 → 3 → 1).
- `EXT_BEATS` 8: the drop is a two-bar excursion (3 s outside at 150 bpm, home by 64 s) instead of 20 s; `SPIN_SW` / `SPIN_W` /
  `SPIN_SC` halved (0.3 / 0.25 / 0.3); `BUMP_LG` 1.5 → 0.5 (the cloud no longer lurches); `ROUND_G` 1.5 → 0.8, the exterior at half.
- `arc` left NAV2's `feats` (nothing reads it now).

```
                          rho (INT) min / med / max     Q min / med / max        v med / max   v > 0    EXT samples   spin max   gates   ms
SeeYouDrop v0.12 NAV2     0.877 / 0.926 / 1.000         —                        —             —        10 (20 s)     0.79       1       2.02
first cut                 0.671 / 0.827 / 0.985         0.700 / 0.805 / 0.947    0.189 / 0.578 29/29    10 (20 s)     0.79       1       2.04
after the look            0.493 / 0.660 / 0.925         0.641 / 0.877 / 0.953    0.120 / 0.608 37/37     2 (4 s)      0.43       1       2.00
```

Per second across 46–88 s (`nav2-window-after2.txt`, `montage-nav2-syd-after2.jpg`): ρ 0.54–0.87 and Q 0.81–0.95 swing with the
kicks, the exterior leg is 58.5–63 s and the set is back, round, by 64 s. Luminance on the 46–55 s frames: centre median 0.08
(v0.12 0.20, the first cut 0.19 — the interior is now darker than v0.12 between beats, with the rim lit: 0.38 median, = v0.12),
so "washed out" is gone and the breakdown reads as a dark disc with a lit edge; if that is too dark the knob is `ROUND_G`.
s8 md5 1da850ba / 6d46c51f, twice.

## Third pass — the user on the extremes: "0-13s the high rise up to their max (edge should be bumping on every beat / light oscillating off the edge); at 25s it really starts moving the edge on every beat"

The 0–30 s replay (`nav2-window-intro.txt`) showed why the intro barely bumped: the engine's `kick` reads 0.1–0.3 there and 0.2–0.55
in the groove on this track (its kick detector is gated on bass level), so against a fixed scale the bump was a third of its size.

- **The beat is read against the track's own running kick/hit peak** (`detect.js` `BUMP_PK_TAU` 3 s, floor `BUMP_PK_MIN` 0.25), scaled
  by energy (`BUMP_E0` 0.5: half at silence, full at `eS` 1) — the intro's beats bump, the drop's bump harder.
- **Light off the edge:** `uBump` (rest 0, exact) widens the exterior halo's reach 1/(1 + e·0.011) to 1/(1 + e·0.011/(1 + 1.5·bump)) on
  each bump and lets it fall back with it.
- The gate test's kick timeline carries `eS` 0.9 (a beat has energy behind it).

60 s from the start (`montage-nav2-syd-intro.jpg`, 8 per row): 0–13 s ρ 0.64–0.84 and `bump` 0.22–0.79 per sample (median 0.47 over
the window against 0.31 before), Q 0.79–0.89 breathing with it; 19 s the build's wind presses to 0.98; **25 s the gate into the
period-2 disc** — the shape comes back different (Q 0.65 flat for 24 s: a two-lobed set is never round) and back to period 1 at
49 s, the breakdown rounding to Q 0.94; the drop at 58 s, home by 62 s. s8 md5 34ee5482 / d81945bd, twice.
The 80 s trace on the final build (`det13-syd-final.txt`), the same columns as the second table: ρ 0.559 / 0.734 / 0.977, Q 0.689 /
0.878 / 0.950, v 0.220 median / 0.622 max and > 0 on 37/37, EXT 2 samples, spin max 0.43, one gate, bump median 0.46 (0.31 before
the normalisation), ms 2.02, errs []. The release rebuilt and proven from file:// (key 9 → scene 8, errs [], Q 0.977 on the test page).

## Fourth pass — "each beat should make the set close up (different pitches are different shapes); at 1:38 it goes double time -> should be moving faster / reacting more; 1:45 -> this is where the highest energy is, should be reacting more"

The 92–120 s replay before (`nav2-window-double-before.txt`): at 1:38 onsets 4.7–5.9 a second and the bump never decayed (0.54–0.90),
so ρ sat at 0.87–0.93 — pinned, reacting LESS; from 1:48 the melody had parked c near the cusp (internal angle 0, the fat round blob)
and Q read 0.93–0.95 whatever the beat did. Three changes:

- **The beat's note** (`nav2.js` `NOTE_V` 8, `NOTE_MIN` 0.08; `feats` gains `bchroma`): on each hit the bass note's pitch class k is
  latched and names an internal angle (k + ½)/12 around the cardioid; c is pulled AROUND the rim toward that note's point at
  `NOTE_V` × bump. The wall keeps the radius; in a child bulb (q > 1) the note waits. Twelve pitches, twelve species — near 1/2 two
  lobes, near 1/3 three arms, near 0 the round blob.
- **The decay follows the hit interval** (`detect.js` `BUMP_IV` 0.7 of the running interval, `IV_TAU` 1.5 s; a hit is an onset when
  it clears the decaying envelope): straight time at 150 bpm breathes with τ 0.28 s, double time 0.14 s.
- **The energy gain** E = (eS − 0.5)/0.5 (`E_LO`): lifts the beat's ceiling by `RHO_E` 0.04, the halo's reach and the curl by (1 + E),
  the kick's zoom pump from 3 % to 9 %.

```
                          rho (INT) min / med / max     Q min / med / max        v med / max     notes latched
92–120 s before           0.574 / 0.775 / 0.958         0.729 / 0.933 / 0.957    0.138 / 0.621   —
92–120 s after            0.541 / 0.690 / 0.922         0.736 / 0.897 / 0.955    0.333 / 0.624   1 4 6 7 8 9 10
0–60 s after              0.476 / 0.659 / 0.979         0.673 / 0.894 / 0.955    0.360 / 0.620   0 1 4 6 7 8 9 11
```

At 1:38 the interval reads 0.17–0.23 s and the edge speed's median across the stretch is 2.4× before (0.333 vs 0.138), hitting the
navigator's own speed cap (0.62 = `V_MAX` on the equipotential) on nine of 22 interior samples; E reads 0.73–0.88 through 1:33–1:41
(the engine's energy peak sits there, not at 1:45 — at 1:45 the engine fired a second `dropEvt`, 4 s outside). The set no longer
parks round: seven notes latched in 30 s, the Q median down from 0.93 to 0.90 with the same range. s8 md5 253b19c4 / 778fb7e2, twice.
The 80 s trace on this build (`det13-syd-final2.txt`): ρ 0.475 / 0.667 / 0.966, Q 0.785 / 0.898 / 0.953, v 0.493 median / 0.623 max
and > 0 on 37/37, eight notes latched, E median 0.64, spin max 0.47, EXT 4 s, ms 2.20 (2.02: the note pull's findCycle probes), errs [];
**no gate in these 80 s** — the note keeps c moving around the rim, so it is rarely held beside a root for `GATE_HOLD`; the shape now
comes back different through the notes rather than through a gate (the node test still opens eight per minute on a fixed-note beat).
The release rebuilt and proven from file:// (key 9 → scene 8, errs [], Q 0.977 on the test page).


## Fifth pass — the other three tracks under v0.13, and the drop that came back (2026-09-27, no new word from the user)

Pass 4 waits for the user's look. Meanwhile the open list's item 4: CyborgNinja, WhoLikesToParty and Malicious had been re-measured but
never re-watched under v0.13, and the beat's normalisation and the note mapping were tuned on one dubstep track. `det13.py` on each
(80 s, the D line now carrying `ds` = dropStrength and `arc`), then `nav2-window.py` 0–60 s and a montage:

```
                    bpm   modes (40 samples)        rho (INT) min / med / max   Q min / med / max        v med / max   notes latched          kick max  eS med
CyborgNinja         160   INT 40                    0.483 / 0.682 / 0.923       0.838 / 0.940 / 0.966    0.166 / 0.624 0 1 3 5                0.71      0.83
WhoLikesToParty     117   INT 40                    0.459 / 0.645 / 0.798       0.811 / 0.884 / 0.956    0.377 / 0.622 0 1 3 4 5 6 7 9        0.66      0.71
Malicious           140   INT 31 EXT 5 HOME 2 IN 2  0.450 / 0.581 / 0.779       0.830 / 0.914 / 0.952    0.306 / 0.620 0 1 3 6 7 8            0.30      0.67
SeeYouDrop (pass 4) 150   INT 37 EXT 2 HOME 1       0.475 / 0.667 / 0.966       0.785 / 0.898 / 0.953    0.493 / 0.623 0 1 4 6 7 8 9 11       0.60      0.82
```

- **CyborgNinja** breathes on every beat (bump 0.04–0.90, ρ 0.50 ↔ 0.92 between samples) but latches almost only notes 0 and 1 — the
  bass sits on one pitch — so the species hardly changes: a fat set near the cusp, Q median 0.94, the edge slow (v median 0.17). That is
  the note mapping doing what it says on a one-note bassline; whether it should also vary is the user's (item 2, gates vs notes).
- **WhoLikesToParty** at 117 bpm latches ten pitch classes in 60 s (the window: ρ 0.424 / 0.622 / 0.832, v median 0.48, > 0 on 60/60);
  the beat's press reads 0.87 at its peaks; nothing to name.
- **Malicious is the fault.** Its intro's bass stutters in and out for more than 1.8 s at a time, so the engine's bass-returns rule fired
  `dropEvt` at probe 15.5, 21.5 and 27.5 s, `dropStrength` 1.0 each, and NAV2 cut every time: EXT → HOME → IN → INT → cut again. 18 of
  its first 25 s were the exterior dust, the very thing the user rejected at 1:04 on SeeYouDrop ("swirly/wobbly"); `EXT_BEATS` 8 made the
  drop a two-bar excursion, and a re-drop simply undid it (the non-INT branch of `doDrop` also restarted the 8-beat clock).

**The change — one constant, no new machinery:** `DROP_GAP` 32 beats (`exit.js`): a `dropEvt` inside 32 beats of NAV2's last cut is a
hit, not a cut — `doDrop` returns, the beat's own press answers the kick (the engine's flash / glitch still fire; only NAV2's ray does
not). `N.dropBeat` (the beat of the last cut, reset to −∞) is the only state. No drop recurs inside eight bars; SeeYouDrop's two (58 s and
1:45, 47 s apart) both stand, so pass 4's look is untouched — s8 md5 253b19c4 / 778fb7e2 twice, `test_nav2` 21 ok (its one drop), `test_green`
OK, `check` 0 fail, `npm test` / `test_fdtd` / `test_field` OK, the release rebuilt and proven from file:// (key 9 → scene 8, errs [],
Q 0.869 on the test page).

```
Malicious                        modes                        rho (INT) min / med / max   Q min / med / max        v med / max   notes
0–60 s window, after (1 s)       INT 48 EXT 6 HOME 4 IN 2     0.411 / 0.600 / 0.787       0.826 / 0.918 / 0.967    0.251 / 0.624 0 1 3 5 6 7 8
80 s trace, before (2 s)         INT 31 EXT 5 HOME 2 IN 2     0.450 / 0.581 / 0.779       0.830 / 0.914 / 0.952    0.306 / 0.620 0 1 3 6 7 8
80 s trace, after (2 s)          INT 37 EXT 1 HOME 1 IN 1     0.461 / 0.592 / 0.786       0.825 / 0.917 / 0.963    0.249 / 0.618 0 1 3 6 7 8
SeeYouDrop 80 s, after           INT 37 EXT 2 HOME 1          0.459 / 0.656 / 0.866       0.777 / 0.905 / 0.954    0.348 / 0.625 0 1 4 6 7 8 9 11   (pass 4: INT 37 EXT 2 HOME 1, 0.475 / 0.667 / 0.966, 0.785 / 0.898 / 0.953, 0.493 / 0.623, the same eight notes)
```

In the after window the engine still fires at track 5.9, 12.6, 19.2 and 25.9 s (`drop` 0.48 / 0.60 / 0.70 / 0.84 on the sample after
each): the first and the fourth cut (20 s apart, both two-bar excursions of ~6 s to the landing), the second and third — 18 and 36 beats
after the first cut's beat, the third just inside the gap at 140 bpm — are hits, and the set stays in: ρ 0.50 with bump 0.84 at 12.6 s.
Two excursions in 40 s instead of three in 14 s; the rest of the minute is the interior bumping.

**1:45 on SeeYouDrop, measured** (`nav2-window-syd-145.txt`, 1:40–1:56 with `ds`): the bars before it are the breakdown (eS 0.58–0.66, E
0.15–0.32, arc `build`), the drop lands at track 105.9 s with `ds` 1.0 and arc `peak`, and NAV2 is outside 105.9–111.4 s (EXT 4 s, HOME,
IN) — back in at 112.5 s with eS 0.77–0.82, ρ 0.62–0.72. So the engine agrees with the user that 1:45 is the biggest moment; NAV2 answers it
with the cut and six seconds of dust, and the interior afterwards reads a *lower* energy (eS 0.78) than 1:33–1:39 (0.87–0.94). `DROP_GAP`
does not touch it (47 s after the first). If the user wants 1:45 to be the interior reacting more, the options are: no cut at all above
some `away` (the drop as a press to `RHO_CAP` instead), or the energy gain read against the track's own peak the way the beat is
(`BUMP_PK_TAU`), so 1:45 and 1:33 both read E ≈ 1.

## Sixth pass — the user's look at pass 4 (2026-09-27): "the movement is still too subtle"

The user's words, in order: *(1) "the shape is doing a better job moving to the music, but the movement is still too subtle -> all the
shapes. When I say breathing with the music I [mean] that the beat causes the set (ie. black circle in the middle) collapses into
interesting shapes, then the silence rebounds to the circle (original NAV does this, it just didn't line up with music ~38s-42s on SEE
YOU DROP); on the montage-nav2-syd-double.jpg -> in the second row, the last two screen shots are example of the color being too bright
and can't see the complexity of the shape. (2) do 'energy gain read against the track's own peak'. (3) there are some interesting shapes
being generated but still seems all the same (I know there is infinite complexity in mandelbrot/julia sets, why does different sounds look
so similar?)"*

**What NAV does at 38–42 s** (`montage-nav-syd-35-45.jpg`, key 0): the black disc pinches into a chain of beads with thin necks — c at the
1/2 root (−0.75) with |λ| → 1, the basilica. That is the answer to (3) as well: the species of a Julia set is the internal angle p/q of c's
root, and the necks between its q-fold beads close only as ρ → 1. Pass 4 put the twelve notes at (k + ½)/12 — *between* the roots by
construction (never 1/2, 1/3, 1/4, 1/6) — and capped the beat at ρ 0.93 under the smoulder; every note was therefore a dimpled circle, and
they all looked alike. The Q trace said so: 0.78–0.95 with a median 0.90 (a circle is 1; the basilica at the pinch is ≈ 0.7).

**Changes (`nav2.js`, `detect.js`, `exit.js`, `shaders.js`, `index.js`; every constant carries the user's words):**

- **The twelve notes are the twelve simplest roots** (`NOTE_ANG` = 1/6 1/5 1/4 1/3 2/5 1/2 3/5 2/3 3/4 4/5 5/6 6/7, ascending with pitch
  around the cardioid). **The beat presses to the cap** (`RHO_BEAT` 0.93 → 0.985 = `RHO_CAP`). **The smoulder is the wind's alone**
  (`PAR_WIND`: par × wind), so the press no longer lights the interior — that was the pass-2 wash-out and the reason for the 0.93 cap.
  **Gates lock while a note drives** (`NOTE_LOCK`: pulse > 0.1 with a latched note zeroes the gate's press) — a period-q bulb never rounds
  again (Q ≈ 0.65 flat), and the user's rebound is to the circle. The wall (`probe()`: the period must not change) keeps c in the cardioid
  at the root, so the pinch forms without crossing.
- **The press holds its peak** (`BUMP_HOLD` 0.3 of the hit interval before the decay). The node sweep (`press-sweep.mjs`: a kick on
  every beat, the bass on pitch class 5 → 1/2, the farthest root radially) found the radial spring was not the lever: at `K_R` 10 / 20 / 30
  the press peaked at ρ 0.89 / 0.87 / 0.86 — a stiffer spring only follows the *falling* target faster, and `V_MAX` 1.2 needs ~0.2 s from
  the trough to the pinch at 1/2. With the hold: peak 0.982–0.985 at 124 / 150 / 175 bpm, trough 0.83–0.85, the angle error at the press
  0.0000 turns, Q 0.71–0.79 through the beat, and 15 s of silence → Q 0.977 at ρ 0.300 (`test_nav2` §8, four new assertions).
- **(2) E against the track's own peak** (`E_PK_TAU` 20 s, `E_PK_MIN` 0.3): E = ((eS / ePk) − 0.5)/0.5. On SeeYouDrop E now reads 0.96–1.00
  through 1:33–2:00 (1:45 read 0.56 before), 0.2–0.6 in the breakdown bars.
- **The brightness.** Measured with `lum.py`: the frames the user pointed at, and every "washed" frame since, are the *green/yellow* phase
  of the palette — 3–10× the luminance of the blues in sRGB — and the interior's own bands. In the pass-6a groove window the green frames'
  centre read 0.36–0.38 (a bright banded interior) where the blue ones read 0.03–0.05; NAV's collapse at 38–42 s is dark inside. Two NAV2-only
  uniforms, both exact identities at rest: **`uLum`**, a soft luminance knee col /= 1 + K·max(0, L − L0), (0.12, 6) for the interior (the set
  stays dark whatever the phase: the green frames' centre 0.36 → 0.10–0.22) and (0.35, 2) for the exterior; and **`uExtG`** = `EXT_DIM` 0.5,
  eased over 0.5 s, on the exterior branch while c is *outside* the set — there every pixel is near the Cantor dust, the halo term saturates
  and the frame is a wash by construction, which no knee fixes (a knee flattens; 0.5 → 0.4). Applied after the knee. `EXT_ENV` 1.2 (NAV's 3.2)
  lands the drop nearer the set. The 58 s drop's dust, centre luminance by second: pass 4 (the 1:45 window) 0.53 / 0.75 / 0.66 / 0.21; the
  knees alone 0.39 / 0.39 / 0.58 / 0.50; final 0.38 / 0.30 / 0.26 / 0.10 (the first second is the cut itself, the ease not yet down).

```
SeeYouDrop                       rho (INT) min / med / max   Q min / med / max        v med / max   notes latched     centre lum (green / blue frames)
80 s, pass 4  (det13-syd-final2) 0.475 / 0.667 / 0.966       0.785 / 0.898 / 0.953    0.493 / 0.623 0 1 4 6 7 8 9 11
80 s, pass 6  (det13-syd-p6)     0.536 / 0.772 / 0.964       0.712 / 0.843 / 0.951    0.323 / 0.625 0 1 4 6 7 8 9 11
26–50 s, pass 6a (knee 0.35/2)   0.446 / 0.807 / 0.953       0.771 / 0.834 / 0.947    —             8 1 7 4 9        0.36–0.38 / 0.03–0.05
26–50 s, pass 6  (split knees)   0.516 / 0.877 / 0.976       0.705 / 0.815 / 0.926    0.281 / 0.635 1 3 4 7 8 9      0.10–0.22 / 0.02–0.06
```

The set is now less round on average (Q median 0.90 → 0.84 over 80 s, 0.82 in the groove) and reaches the pinch (ρ 0.976 sampled at 1 s; 0.98
in node); the interior stays dark in every phase; the same eight notes latch. s8 md5 f5d4f051 / 0671f15a twice (re-based; pass 4 was
253b19c4 / 778fb7e2), `check` 0 fail, `test_nav2` 25 ok, `test_green`, `npm test`, `test_fdtd`, `test_field` OK, the release rebuilt and
proven from file:// (key 9 → scene 8, errs [], Q 0.703 on the test page). ms 2.4–2.6 (the note pull's probes at the rim).

**Not proven / open:** the user has not seen pass 6. The 1:45 drop did not fire in either pass-6 run (it did in two earlier ones) — it is
the engine's bass-returns rule, run to run; the exterior was proven on the 58 s drop instead. `nav2.js` is 452 lines (soft cap 350, hard
500): the next machinery change moves the note / press block to a `beat.js`. The other three tracks were not re-watched under pass 6.

## Seventh pass — the user's look at pass 6 (2026-09-27): "still not deforming enough"; "a bit too muted now"

*"1. still not deforming enough. 2. is a bit too muted now (looks almost pastel sometimes). I like the bright / glowy look, but I don't want
it to be so bright that can't see the mandelbrot shapes."*

**(1) The deformation.** Pass 6 reached the pinch (ρ 0.98) but the trough between kicks sat at 0.84, so the set went from pinched to
slightly-less-pinched. The node sweep (`press-sweep.mjs`) found, in order: the speed cap was *not* the lever — `V_INT` 1.2 → 3.0 left the
trough at 0.84 to the third decimal; the radial spring was not either on its own; the *target's* fall was: the press decays with τ = 0.7 ×
the hit interval after its hold, so the target itself never fell below ~0.7 before the next kick, and the spring lagged it. Three constants:

- `V_INT` 2.4 — the interior's own speed cap, with **`A_MAX` 30 units/s², a velocity slew** (`N.vx`, `N.vy`). The continuity monitor's rule
  is a *spike* rule (a step over 2.5× the last + 0.01), not an absolute, so speed is free and acceleration is what must be bounded: the first
  step from rest is A_MAX·dt² (0.052 at the loop's 1/24 s cap, 0.008 at 60 Hz) and each next step is under 2.5× the last at any frame rate.
  `test_nav2`'s monitor: viol [], max step 0.0400 = V_INT·dt. Gates, the walk back to `cGood` and the exterior keep `V_MAX` 1.2. The Green
  edge speed's ceiling moved with it (v max 0.62 → 1.26 on the equipotential).
- `BUMP_IV` 0.7 → 0.5 (τ 0.2 s at 150 bpm after the hold) — the target falls to ~0.5 by the next kick.
- `K_R` 10 → 20 — with the peak *held* a stiffer spring no longer costs the peak (that was pass 6's finding at K_R 20/30 without the hold),
  and it follows the fall. 30 lost the peak at 150 bpm (0.95).

```
150 bpm, a kick per beat, the bass on 1/2       peak rho   trough (median)   Q through the beat
pass 6 (K_R 10, BUMP_IV 0.7, hold 0.3)           0.979      0.841             0.715 .. 0.793
pass 7 (K_R 20, BUMP_IV 0.5, hold 0.3, V_INT)    0.985      0.667             0.710 .. 0.872
```

The Q swing through a beat doubled (0.08 → 0.16). On the track (26–50 s, 1 s samples): ρ 0.92 / 0.95 / 0.79 / 0.71 / 0.95 / 0.83 / 0.56 /
0.61 / 0.62 / 0.96 / 0.98 / 0.97 / 0.52 / 0.61 / 0.93 / 0.97 / 0.96 / 0.94 / 0.97 / 0.63 / 0.67 / 0.48 / 0.82 / 0.64 — the set is at the pinch
or near the circle, rarely between; the montage shows both. 80 s: ρ 0.544 / 0.685 / 0.983 (pass 6: 0.536 / 0.772 / 0.964), Q 0.697 / 0.901 /
0.950, the same eight notes, errs 0, ms 2.33.

**(2) The pastel.** `sat13.py` on the montages: saturation is unchanged (0.64–0.66 on the bright pixels in every pass); what pass 6 lost is
the *peaks* — the 95th-percentile luminance 0.72 (pass 4) → 0.53 (pass 6). That is the exterior knee compressing the halo. So: the exterior
knee is **off** (`LUM_EX` (1, 0), an exact identity); the interior knee is milder, (0.12, 6) → **(0.2, 3)**, so the bands keep their
gradation to 0.2 and a 0.5 comes to 0.26 (the set still reads dark against the halo: rim − centre 0.34 in the green frames, pass 6 0.18);
and the dust's dim, which is what the two frames the user first pointed at needed, carries that alone: `EXT_DIM` 0.6 → **0.35** (at 0.6
with the knee gone the dust read 0.55–0.67 again).

```
                          p95 luminance   green-frame centre   rim (green frames)   dust after the 58 s drop (centre, by second)
pass 4                    0.72            0.36–0.38            0.5–0.76             0.53 / 0.75 / 0.66
pass 6                    0.53            0.10–0.22            0.28–0.42            0.38 / 0.30 / 0.26
pass 7                    0.81            0.26–0.42            0.53–0.71            0.33 / 0.30 / 0.26
```

s8 md5 c0373ec5 / d61162a7 twice (re-based; pass 6 f5d4f051 / 0671f15a), `check` 0 fail, `test_nav2` 25 ok (the gate test still opens 1 in
/ 1 out at 124 bpm at `BUMP_IV` 0.5 — the hold carries it now), `test_green`, `npm test`, `test_fdtd`, `test_field` OK, the release rebuilt
and proven from file:// (key 9 → scene 8, errs [], Q 0.749). **The user has not seen pass 7.** `nav2.js` is 470 lines (hard cap 500): the
next machinery change must move the note / press / slew block out to a `beat.js`.
