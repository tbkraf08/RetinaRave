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

