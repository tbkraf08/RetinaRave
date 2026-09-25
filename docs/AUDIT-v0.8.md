# Retina Rave v0.8 candidate — NAV2 in a real window (2026-09-25, DECISIONS §39)

The shape of `AUDIT-v0.7.md`: a real track in its own Chrome window captured through the landing card's `Share a tab`, the page at
1920 × 1080 native DPR 0.75, the scene forced by key at 6 s, shots at 20 / 40 / 60 / 80 s, `tools/probe.js` per frame. Two tracks ×
two scenes — **NAV2 (key `9`) beside NAV (key `1`) at the same clock times** — "Who Likes to Party" (~117 BPM, B minor) and "Cyborg
Ninja" (~160 BPM, minor, key 2 → 7 → 8 as it settles). Plus something v0.7 did not have: an **80 s detector trace at 2 s** on each
track (`hooks.n2info()` + the MS fields the detectors read, `tools/accept/v0.8/det8.py`), run **before** the two retune passes and
**after** (`audit8-detectors-{before,after}.txt`). Raw shot-run lines: `audit8-headed.txt`; the driver `audit8.sh`.

## Engine side (the four shot runs after pass 3)

| what | NAV2 (WLTP · CN) | NAV (WLTP · CN) | verdict |
|---|---|---|---|
| capture | `mode capture`, `heard` by 8 s, bpm 116.5 / 159.7 | same | ✓ |
| frames in 81 s | **4847 · 4845**, 0 black, 0 > 100 ms, max dt 17 · 17 ms | 4846 · 4850, max dt 17 · 33 | ✓ 60 fps; the chart-free finder (≤ 32 k steps/frame) never shows |
| `q` at 1 Hz | 0.39 → 0.54 (8 s) → 0.59 (20 s) → 0.75 (60 s) → 0.83 (80 s) | **the same digits** | ✓ the controller never saw NAV2 as dearer |
| engine ms | 1.7–2.3 | 1.9–2.2 | ✓ |
| `CARD.bench` (worker, q .95 + Q.iter pinned, interleaved) | NAV2 1.698 ms vs NAV 1.719 = **0.99×** | — | ✓ cap 1.5× |
| `update()` CPU (node, 2880 frames) | median 0.004 ms, max 0.20 (a drop) | — | ✓ gate 0.5 ms |
| continuity monitor, 60 s `test&fake=0&scene=8` | `n 3606, fast 0, max 0.0202, viol []` | — | ✓ max = V_MAX·dt exactly |
| end | `ERRS []`, `nonFinite []`, 0 `[EXC]` | same | ✓ |

## What the traces found, and what two retune passes did (the numbers the user cannot see in a shot)

The worker's headless build passed every gate in the brief. The first real-music trace said two things the fake timeline cannot
say (DECISIONS §39 has the mechanism; `docs/workers/nav2.md` "Retune" and "Pass 3" the detail):

| | before (build `4f38399`) | after pass 3 (`376a4b2`) |
|---|---|---|
| `sweep` on a plain groove — CN median (max) | **0.67** (0.93), with `riser`/`hp` = 0 on 40/40 samples | **0.01** (0.14) |
| `sweep` — WLTP median (max) | **0.86** (0.98) | **0.03** (0.38) |
| `swirl` median CN · WLTP | 0.80 · 0.88 (the frame stirred all the time) | 0.30 · 0.25 (the `roll` term; `rate` max 0.23 · 0.51 rad/s) |
| c in INT, CN (80 s) | x −0.70..−0.61, y 0.03..0.13 — a box 0.1 wide while the centroid ran 0.45..0.63 | x −0.80..−0.52, **y −0.20..+0.42** |
| c in INT, WLTP | x −0.73..−0.46, y 0.05..0.31 | **x −0.68..+0.29, y −0.37..+0.56** (the whole cardioid) |
| resting ρ median CN · WLTP | 0.91 · 0.96 at the 1/2 root (the cardioid's neck) | 0.92 · 0.92 on the rim, anywhere |
| gates in 80 s | none · none | **three (1/2 root, q 1 ↔ 2)** · none |
| `scratch` max | 0.28 · 0.33 (never fires) | 0.27 · 0.22 (never fires) |
| `dropExpectedIn` armed | 0/40 · 0/40 | 0/40 · 0/40 |

Pass 2 (`5cd3e13`): the swirl's centroid term is a *sustained monotone climb* (≥ 1.2 s, rate-scaled, capped at 0.85 so only
`riser`/`hp` reach 1) and the resting place moved into the cardioid's belly with a running centroid normaliser. Pass 3 (`376a4b2`):
the wall owns the radial direction (a two-sided spring to `RHO_FREE` 0.91, the melody's pull projected onto the ρ-contour's tangent,
unconditionally — a conditional projection made its threshold an unstable equilibrium where c parked), so the Koenigs arms exist at
rest and a gate is reachable under the melody alone (the 60 s synthetic melody in `tools/test_nav2.js` gates 1 → 3 → 1 three times).

## What the eye sees (`montage-nav2-real.jpg`, NAV left · NAV2 right, 8 rows)

NAV2 changes species with the music now (WLTP 60 → 80 s: a dark clover → a lit period-2 set with arms; CN 40 s: the 1/2 gate, a
lit two-lobed set with spirals; CN 60 s: filaments), the frame turns only on the swirl, and the blob floats with the pitch (`lift`
−0.17..+0.11 view units on both tracks). **It is darker than NAV in most frames**: `tools/lum.py` centre luminance on the same clock
frames — WLTP 0.17/0.03/0.08/0.39 vs NAV 0.48/0.19/0.70/0.31, CN 0.35/0.55/0.10/0.04 vs 0.84/0.61/0.76/0.39 (ratios 0.10–1.28,
median ≈ 0.3). NAV is bright because it parks at parabolic roots (`par` 1, the smoulder) and rides external rays (the exterior dust);
NAV2 rests on the rim at ρ 0.92 with `par` ≈ 0.3 and drops only on `dropEvt`, which neither track fired in these 80 s windows. The
knob is `RHO_FREE` (0.91 → 0.95 doubles the `#test` centre luminance, 0.13 → 0.18; the worker's table in `nav2.md`) and `GATE_HOLD`.

## Not proven

- **The scratch detector never fired on either track** (max 0.33). Its formula is only ever proven by its pin (`hooks.scratch`); the
  thresholds are guesses until a track with an audible scratch is captured.
- **The pre-drop wind-up** rode on `build` alone: synapse never armed `dropExpectedIn` on these tracks (it needs tension > .3 and a
  trusted grid), so `count` stayed 0 and the countdown branch is proven on `#test` only.
- **No `dropEvt` in any 80 s window on either track**: the exit/return legs are proven on `#test` (f780 ± 1) and by the monitor on
  the demo synth; a real-music drop was not captured.

## Verdict

NAV2 costs nothing the controller can see, never picks itself, and every mechanism the user asked for is visible in the HUD, the
traces and the shots: the melody draws the path (c across the whole cardioid on WLTP), gates open through roots under the melody
alone, the swirl detector is quiet on a groove and the frame turns only when it fires, the blob floats with pitch. Whether the *look*
is right — the resting brightness (`RHO_FREE`), how eager the gates are (`GATE_HOLD`), the pitch amplitudes, the curl gain — is the
user's call on `montage-nav2-real.jpg` and the build (`dist/retinarave.html`, key `9`). Nothing is replaced until they say so.
