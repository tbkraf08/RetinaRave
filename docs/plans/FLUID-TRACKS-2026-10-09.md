# FLUID across the seven tracks — the survey a tuning pass acts on (2026-10-09, HEAD 35fbb1a)

Read-only survey: no code changed. Every number below is measured on this machine (headless `GPU=1 CLOCK=1`, the 1280×633 canvas, tier 2, sim 259×128, dye 1035×512) from whole-track MS traces replayed through the pure `plan()` of `assets/core/fluid/inject.js` (FLUID-DIAG-2026-10-09 §4's method, `tools/fluid-replay.js`'s classification) and from FLUID (scene 12) shots keyed on `__FRAME` at `at=0` (`frame0` 2 on all seven runs, `errs []`). Artefacts under `tools/work/fluid-tracks/<track>/` (gitignored): `trace-map1.json` / `trace-map0.json` (the whole track, 78 fields, file mode with the map / the live lanes), `replay-map{1,0}.txt` (the per-second injection table) and `.json` (the constants' effective ranges), `shots/*.jpg` + `shots/grey.txt` (whole-frame grey mean / p99 per shot) + `shots/evals.txt` (heard t, `dyeDiss`, `velDiss`, `curl`, `nSplat`, exposure at each shot), `montage.jpg` (the windows), `montage-strip0.jpg` (1 fps, 0–30 s), `montage-busy.jpg` (1 fps, the busiest 31 s by injected Σ|dv|). The tools: `analyze.mjs`, `windows.mjs`, `shots.sh`, `run-shots.sh`, `montage.sh`, `doc-track.mjs`, `cross.mjs`, `greystats.sh` in the same directory; `windows.txt` holds every window's track second (frame = 2 + 60·t).

## Summary

Tuned on SeeYouDrop (+ the pad, §108), and it shows. **SeeYouDrop reads**: the sub column at its sector, the groove at grey 46–60, both drops clear to 37, the key held cool. **Vienna reads where its drums are** (indigo D♯ minor, the 85.3 s return clears) and goes still for the 19 s dream (Σ|dv| 0, the floor blob alone). **WhoLikesToParty's three drops read**, but the pool is packed (22 of the busiest 31 s above grey 60). **CyborgNinja does not read**: a constant boil (31/31 s above 60, 12.8 uv/s every second, the sub emitter on the left wall at C all track). **IBelongHere's grooves read, its breakdowns do not**: vocals = two snare blobs, four false live drops clear the pool, 46 % syrup. **Comptine (solo piano) does not read**: three fixed points for 132 s, no "where", nothing travels (velDiss 3.0 on 62 %), five false drops, applause read as music. Malicious: measured for the record only.

The three biggest cross-track problems:

1. **No dynamics in the density.** Injection follows the ears' event rate, not the music's range: hit sizes sit on the lanes' amp floor (kick dy p10–p90 .49–.84 everywhere), the hats add 26–29 droplets/s on the incompetech pair, nothing scales the ink to the pool — CyborgNinja and WhoLikesToParty saturate.
2. **The colour is not the key's on 4 of 6.** `keyConf` reaches the anchor's trust (.3) only on SeeYouDrop and Vienna; the others ride `LOOK.mood.hue` — IBelongHere walks seven hues in one key.
3. **The solver maps answer the wrong questions.** `velDiss` (syrup) fires on dark mixes with no sweep (Comptine 62 %, IBelongHere 46 %); `dyeDiss` (the void) follows the tongues' ambiguity and `buildLive` (1.0 on a piano crescendo); the clear fires on false live drops (IBelongHere ×4, Comptine ×5) and twice per real drop on WhoLikesToParty.

Ranked proposal §10.1; per-material branches §10.2.

## 1. Method, and the two modes

- **Traces.** `WARM=0 node tools/filetrace.js <track> 0 <dur> … '<FLUID_FEATS + 42 more>'` twice per track: file mode (`&map=1` default: the map's non-causal onsets and sub ruler, `mapDropEvt` on the bar lines) and the live lanes (`&map=0`: the causal ears, what a live night sees). The user plays files from the device, so **file mode is what he hears**; the live columns say what a capture night would do and where the two rulers disagree.
- **Replay.** `plan()` per frame with `mkState()`, the hats seeded at 0.37 (as `fluid-replay.js`), the colour's `moodHue` fixed at 0.6 (so the replay's hue column only says "key trusted or not" — the shots show the real colour). Per second: the channels' splat counts, Σ|dv| injected (uv/s), Σ dye, the floor's ink, `dyeDiss` / `velDiss` / `curl`, the drop and clear frames, the gain. "Music" = `presence` > .5 and `rms` > .003 over the second.
- **Shots.** One deterministic FLUID run per track (`test&track=<t>&at=0&scene=12`, `CLOCK=1 GPU=1`), 4–14 windows from the track's structure plus two 1 fps strips of 31 s (the first 31 s, the busiest 31 s by Σ|dv|). The metric is rec-strip.sh's: PIL `convert('L')` whole-frame mean (the empty pool reads **24**, §107's clear 27, SeeYouDrop's groove 46–60, its drop flashes 71–78) and p99 (a cloud at one sector moves it by 20–80 levels).
- **What the two modes disagree on** (the ruler the user has not validated): the map's sub ruler opens the gate far less than the causal ears on CyborgNinja (116 s vs 180 s; sectors spread vs pinned at C) and Malicious (4 s vs 172 s); the map doubles the drum events on CyborgNinja (701 kicks vs 562, 1078 snares vs 619) and WhoLikesToParty; the live detector's drops are ORed into file mode by §107, so IBelongHere's and Comptine's false live drops clear the pool in file mode too.

## 2. SeeYouDrop — Ray Volpe, dubstep, 150 bpm grid (half-time feel), C♯ minor; drops 57.6 / 105.6 s. The reference: tuned here.

**Totals.** map=1: music 158 s · injecting 158 s (floor-only 7) · sub 138 s · kick 97 s / 229 hits · snare 114 s / 387 · chord 67 s / 85 shears (54 blocked by the refractory) · hats 93 s / 863 droplets · floor 158 s · drops live/map/evt 2/2/2 · clear 4 s · void (dyeDiss < .5) 75 s · syrup (velDiss > 1) 29 s  
map=0: music 158 s · injecting 158 s (floor-only 2) · sub 139 s · kick 114 s / 243 hits · snare 139 s / 471 · chord 65 s / 89 shears (65 blocked by the refractory) · hats 94 s / 869 droplets · floor 158 s · drops live/map/evt 2/0/2 · clear 3 s · void (dyeDiss < .5) 75 s · syrup (velDiss > 1) 29 s
**Drops (s, map=1):** live 57.6, 105.62 · map 57.62, 105.6 · extractor dropEvt (not a trigger) 57.6, 105.6. **map=0:** live 57.6, 105.62.
**Key (frames, map=1):** C#m 7189 · F#m 984 · A 623 · C# 613 · E 21 · keyConf p50 0.43 (p90 0.59) · tonicConf p50 0.47 · hue p10/p50/p90 0.49/0.58/0.63 · sub sectors (x·12: frames) 7:2634 6:1558 4:751 3:715

Per 30 s (map=1; the map=0 Σ|dv| beside it): Σ|dv| uv/s · splats · kicks · snares · chords · hats · sub % · floor dye · dyeDiss · velDiss · curl · g · mid · key
| s | Σ\|dv\| (map0) | splats | kicks | snares | chords | hats | sub % | floor dye | dyeDiss | velDiss | curl | g | mid | key |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0–29 | 93 (127) | 2886 | 8 | 21 | 9 | 40 | 54 | 8.5 | 0.70 | 0.81 | 19 | 0.87 | 0.83 | C#m 15, F#m 8, C# 6, A 1 |
| 30–59 | 259 (271) | 3803 | 70 | 100 | 23 | 284 | 73 | 8.9 | 0.74 | 0.20 | 28 | 0.89 | 0.81 | C#m 29, A 1 |
| 60–89 | 263 (290) | 3986 | 51 | 93 | 27 | 171 | 92 | 9.3 | 0.55 | 0.20 | 24 | 0.98 | 0.77 | C#m 25, A 3, C# 2 |
| 90–119 | 298 (301) | 3886 | 83 | 136 | 15 | 255 | 74 | 8.9 | 0.70 | 0.20 | 24 | 0.95 | 0.79 | C#m 29, C# 1 |
| 120–149 | 166 (193) | 3675 | 17 | 37 | 11 | 98 | 91 | 7.4 | 0.37 | 1.62 | 20 | 0.89 | 0.72 | C#m 19, F#m 5, A 4, C# 2 |
| 150–157 | 26 (32) | 811 | 0 | 0 | 0 | 15 | 73 | 2.2 | 0.14 | 2.06 | 17 | 0.85 | 0.71 | F#m 5, A 3 |

The windows (map=1, the second the shot falls in; frame = 2 + 60·t at `at=0`; grey = the shot's whole-frame mean / p99, empty pool ≈ 24):
| window | t s | frame | g | sub % x | kicks (amp) | snares (amp) | chords (Δ) | hats | floor dye/s | Σ\|dv\| | dyeDiss | velDiss | curl | key conf | shot grey | shot dd/vd/curl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| intro-5 | 5 | 302 | 0.80 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.26 | 0.0 | 1.00 | 3.00 | 13 | C#m 0.54 | 22 / 45 | 1.00 / 3.00 / 13 |
| subin-13 | 13 | 782 | 0.88 | 100 % C# | 0 () | 0 () | 0 () | 0 | 0.17 | 4.2 | 1.00 | 0.20 | 18 | C#m 0.35 | 26 / 51 | 1.00 / 0.20 / 27 |
| groove-35 | 35 | 2102 | 0.95 | 100 % C# | 2 (0.57 0.53) | 2 (0.27 0.40) | 1 (0.23) | 3 | 0.32 | 7.9 | 0.62 | 0.20 | 30 | C#m 0.45 | 51 / 154 | 0.65 / 0.20 / 30 |
| drop1-57.5 | 57.5 | 3452 | 0.72 | 38 % C# | 2 (0.77 1.00) | 2 (0.67 1.00) | 1 (0.54) | 22 | 0.26 | 10.8 | 4.83 | 0.20 | 26 | A 0.26 | 71 / 175 | 0.05 / 0.20 / 28 |
| drop1p-58.0 | 58 | 3482 | 0.84 | 100 % C# | 3 (1.00 1.00 1.00) | 3 (1.00 0.77 0.93) | 1 (0.54) | 32 | 0.26 | 14.6 | 0.78 | 0.20 | 25 | C#m 0.29 | 37 / 109 | 12.00 / 0.20 / 26 |
| build-100 | 100 | 6002 | 0.94 | 35 % A | 1 (0.41) | 7 (0.43 0.43 0.41 0.42 0.30 0.50 0.39) | 0 () | 0 | 0.35 | 5.8 | 0.77 | 0.20 | 40 | C#m 0.34 | 61 / 159 | 0.76 / 0.20 / 38 |
| drop2-105.5 | 105.5 | 6332 | 0.85 | 37 % C# | 5 (0.33 0.78 0.59 0.53 0.32) | 6 (1.00 1.00 0.28 0.63 0.54 0.54) | 2 (0.51 0.34) | 6 | 0.29 | 15.5 | 4.99 | 0.20 | 20 | C#m 0.34 | 78 / 226 | 0.30 / 0.20 / 19 |
| drop2p-106.0 | 106 | 6362 | 0.92 | 92 % C# | 2 (0.32 0.36) | 2 (0.29 0.37) | 0 () | 3 | 0.32 | 6.9 | 0.83 | 0.20 | 26 | C#m 0.34 | 37 / 76 | 12.00 / 0.20 / 25 |
| outro-150 | 150 | 9002 | 0.87 | 78 % F# | 0 () | 0 () | 0 () | 3 | 0.30 | 3.7 | 0.18 | 2.97 | 15 | A 0.59 | 33 / 116 | 0.20 / 3.00 / 17 |

**Grey line, 1 fps** (montage-strip0.jpg / montage-busy.jpg):  
first 31 s 0–30 s mean: 24 20 21 22 22 22 22 23 24 25 25 25 25 26 27 28 29 31 33 34 36 39 41 44 48 50 50 48 50 49 49  
p99: 31 40 64 62 52 45 52 56 66 73 82 66 60 51 75 79 76 88 92 99 119 146 151 150 156 158 150 142 158 150 146  
busiest 31 s 89–119 s mean: 54 55 57 57 55 54 51 50 55 58 63 61 57 49 50 62 73 37 42 46 49 51 56 61 69 69 69 69 67 62 65  
p99: 153 178 182 181 173 186 153 144 201 192 180 159 142 121 145 210 220 76 159 162 164 174 180 184 196 190 178 177 180 170 189

**Reads.** The intro (0–12 s) is the empty pool with the floor blob at C♯'s sector and a few hat droplets (grey 20–25, the strip's first 13 s); the sub arrives at 12.6 s and the column grows in its sector (x .63, sector 7) to grey 50 by 30 s — *where = what* and *when = onset* read. The groove sits at 46–60 (17 of the busiest 31 s), the builds reach 60–73 and both drops clear: 57.5 s grey 71 (the flash) → 58.0 s **37** (`dyeDiss` 12), 105.5 s 78 → 106.0 s **37**. The key is held (keyConf p50 .43 ≥ .3) so the pool is blue-cyan the whole track: *minor = cool* reads. *How hard = size*: kickAmp spans .28–1.00 here (p10/p90 .32/1.00), the widest of the seven, so this track is the one where the sqrt law has room.

**Empty / wrong.** The outro (120–157 s): `lpSweep` ≥ .8 on the last 30 s with no filter sweep in the music → `velDiss` 1.6–3.0 ("syrup", 29 s of the track) while the void rule holds `dyeDiss` at .14–.37 — the sub column stands as a lit, motionless mushroom (outro-150: grey 33 / p99 116, two stationary clouds). The chord channel (85 shears at |dx| .046) is invisible under the snare's .24 — right on a drum track. The floor is 4 % of the dye.

## 3. Vienna — 90 bpm, D♯ minor, sub 30–40 % of the energy; the dream 64–88 s has no committed beat.

**Totals.** map=1: music 193 s · injecting 193 s (floor-only 31) · sub 148 s · kick 75 s / 109 hits · snare 125 s / 201 · chord 86 s / 174 shears (104 blocked by the refractory) · hats 119 s / 2144 droplets · floor 193 s · drops live/map/evt 1/0/1 · clear 2 s · void (dyeDiss < .5) 75 s · syrup (velDiss > 1) 10 s  
map=0: music 193 s · injecting 193 s (floor-only 14) · sub 172 s · kick 94 s / 123 hits · snare 138 s / 241 · chord 89 s / 196 shears (106 blocked by the refractory) · hats 121 s / 2125 droplets · floor 193 s · drops live/map/evt 1/0/1 · clear 2 s · void (dyeDiss < .5) 75 s · syrup (velDiss > 1) 10 s
**Drops (s, map=1):** live 85.33 · map — · extractor dropEvt (not a trigger) 73.28. **map=0:** live 85.33.
**Key (frames, map=1):** D#m 11547 · keyConf p50 0.36 (p90 0.56) · tonicConf p50 0.38 · hue p10/p50/p90 0.60/0.62/0.66 · sub sectors (x·12: frames) 8:1743 9:1724 10:1561 7:909

Per 30 s (map=1; the map=0 Σ|dv| beside it): Σ|dv| uv/s · splats · kicks · snares · chords · hats · sub % · floor dye · dyeDiss · velDiss · curl · g · mid · key
| s | Σ\|dv\| (map0) | splats | kicks | snares | chords | hats | sub % | floor dye | dyeDiss | velDiss | curl | g | mid | key |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0–29 | 262 (221) | 4447 | 30 | 51 | 89 | 490 | 100 | 7.1 | 0.76 | 0.21 | 23 | 0.88 | 0.80 | D#m 30 |
| 30–59 | 292 (278) | 4408 | 28 | 51 | 30 | 568 | 100 | 8.2 | 0.67 | 0.30 | 26 | 0.96 | 0.74 | D#m 30 |
| 60–89 | 95 (99) | 2618 | 13 | 20 | 6 | 121 | 34 | 7.4 | 0.51 | 0.44 | 18 | 0.89 | 0.74 | D#m 30 |
| 90–119 | 178 (211) | 3415 | 21 | 33 | 14 | 268 | 67 | 8.2 | 0.73 | 0.27 | 26 | 0.98 | 0.79 | D#m 30 |
| 120–149 | 179 (245) | 3461 | 9 | 23 | 19 | 479 | 60 | 8.0 | 0.84 | 0.20 | 21 | 0.98 | 0.74 | D#m 30 |
| 150–179 | 139 (203) | 3203 | 8 | 22 | 15 | 209 | 61 | 8.1 | 0.52 | 0.28 | 24 | 0.98 | 0.75 | D#m 30 |
| 180–192 | 12 (30) | 904 | 0 | 1 | 1 | 9 | 17 | 2.9 | 0.33 | 0.58 | 17 | 0.95 | 0.65 | D#m 13 |

The windows (map=1, the second the shot falls in; frame = 2 + 60·t at `at=0`; grey = the shot's whole-frame mean / p99, empty pool ≈ 24):
| window | t s | frame | g | sub % x | kicks (amp) | snares (amp) | chords (Δ) | hats | floor dye/s | Σ\|dv\| | dyeDiss | velDiss | curl | key conf | shot grey | shot dd/vd/curl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| intro-3 | 3 | 182 | 0.83 | 100 % A# | 2 (1.00 0.53) | 2 (0.35 1.00) | 3 (0.15 0.11 0.17) | 15 | 0.19 | 9.7 | 1.00 | 0.20 | 17 | D#m 1.00 | 24 / 67 | 1.00 / 0.20 / 16 |
| groove-30 | 30 | 1802 | 0.94 | 100 % G# | 3 (0.56 0.57 1.00) | 3 (1.00 0.31 0.86) | 1 (0.49) | 33 | 0.27 | 15.4 | 0.75 | 0.20 | 21 | D#m 0.42 | 50 / 142 | 0.75 / 0.20 / 19 |
| subout-64 | 64 | 3842 | 0.98 | 100 % F# | 0 () | 0 () | 0 () | 0 | 0.27 | 4.7 | 0.50 | 2.12 | 19 | D#m 0.33 | 50 / 140 | 0.50 / 0.20 / 19 |
| dream-75 | 75 | 4502 | 0.85 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.15 | 0.0 | 0.07 | 0.94 | 14 | D#m 0.32 | 30 / 100 | 0.08 / 0.20 / 15 |
| return-85.0 | 85 | 5102 | 0.95 | 67 % D# | 3 (0.89 0.84 0.71) | 3 (0.49 0.39 0.33) | 1 (0.22) | 21 | 0.27 | 13.3 | 8.02 | 0.50 | 27 | D#m 0.32 | 33 / 137 | 0.05 / 0.20 / 16 |
| returnp-85.5 | 85.5 | 5132 | 0.95 | 67 % D# | 3 (0.89 0.84 0.71) | 3 (0.49 0.39 0.33) | 1 (0.22) | 21 | 0.27 | 13.3 | 8.02 | 0.50 | 27 | D#m 0.32 | 34 / 111 | 12.00 / 0.20 / 28 |
| groove2-110 | 110 | 6602 | 1.00 | 100 % A# | 1 (0.67) | 1 (0.50) | 0 () | 9 | 0.22 | 8.1 | 1.00 | 0.20 | 29 | D#m 0.33 | 41 / 113 | 1.00 / 0.20 / 27 |
| late-130 | 130 | 7802 | 0.98 | 40 % D# | 0 () | 2 (0.33 0.30) | 0 () | 12 | 0.27 | 4.4 | 0.85 | 0.20 | 18 | D#m 0.31 | 38 / 133 | 0.51 / 0.20 / 18 |
| end-190 | 190 | 11402 | 0.98 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.28 | 0.0 | 0.15 | 0.20 | 13 | D#m 0.50 | 35 / 100 | 0.14 / 0.20 / 11 |

**Grey line, 1 fps** (montage-strip0.jpg / montage-busy.jpg):  
first 31 s 0–30 s mean: 24 21 22 24 26 26 26 27 28 30 30 30 30 31 37 39 40 40 42 44 48 46 46 47 50 52 54 53 52 49 50  
p99: 31 58 52 67 71 67 62 71 93 93 90 83 89 92 133 122 115 111 118 127 150 125 125 135 145 147 151 143 140 135 142  
busiest 31 s 17–47 s mean: 40 42 44 48 46 46 47 50 52 54 53 52 49 50 52 53 51 53 54 56 53 54 50 50 49 48 45 45 43 44 44  
p99: 111 118 127 150 125 125 135 145 147 151 143 140 135 142 152 156 143 153 160 152 141 145 131 142 138 135 130 162 129 148 137

**Reads.** Cool indigo from 3 s (keyConf hits 1.00 at 3 s and the anchor holds the key; p50 .36) — *hue = key*, *minor = cool*. The grooves (0–64, 86–180 s) stir the pool at 40–56 with the sub column walking G♯ / D♯ / A♯ (sectors 8–10, the right third of the frame) and the hats busy at the top edge (2144 droplets, 11/s; p99 111–162). The return at 85.33 s is the live detector's drop (the map has **no** drop line on Vienna: `mapDropEvt` 0) and it clears: 33 → the ring's six blobs over an empty pool (returnp-85.5: `dyeDiss` 12). The extractor's `dropEvt` at 73 s, inside the dream, is rightly ignored (never a trigger).

**Empty.** The dream: from 66 to 84 s the grammar injects **0.00 uv/s for 19 s** (31 still seconds on the track in file mode) — the sub gate shuts at 65 s, the lanes find no hit, and the only ink is the floor's .15–.35 dye/s at D♯'s sector (dream-75: one lilac blob, grey 30 / p99 100). The music is there (loudRel .76–.95, mid .5–.95): a pad and chords with no channel but the floor. The void rule (`dyeDiss` .41 → .05 across the dream) does not hold the groove's ink either: the mean falls 50 → 30 in ten seconds. The end (185–193 s, sub shut) is the same floor-only picture.

## 4. IBelongHere — Set Mo, vocal house, 117.6 bpm; vocal intro 0–16 s, breakdowns 48–64, 112–130, 144–178, 208–233 s (sub 0 %).

**Totals.** map=1: music 230 s · injecting 229 s (floor-only 19) · sub 133 s · kick 153 s / 337 hits · snare 202 s / 526 · chord 148 s / 237 shears (49 blocked by the refractory) · hats 131 s / 1992 droplets · floor 229 s · drops live/map/evt 5/5/3 · clear 13 s · void (dyeDiss < .5) 67 s · syrup (velDiss > 1) 114 s  
map=0: music 230 s · injecting 230 s (floor-only 6) · sub 148 s · kick 165 s / 331 hits · snare 217 s / 612 · chord 149 s / 231 shears (66 blocked by the refractory) · hats 131 s / 1952 droplets · floor 229 s · drops live/map/evt 5/0/3 · clear 8 s · void (dyeDiss < .5) 68 s · syrup (velDiss > 1) 114 s
**Drops (s, map=1):** live 157.23, 166.87, 168.93, 173.05, 178.58 · map 16.4, 32.67, 65.22, 130.28, 179.1 · extractor dropEvt (not a trigger) 64.45, 130.03, 178.33. **map=0:** live 157.23, 166.87, 168.93, 173.05, 178.58.
**Key (frames, map=1):** Dm 10047 · F 1844 · Am 1493 · C 390 · Gm 41 · keyConf p50 0.13 (p90 0.26) · tonicConf p50 0.13 · hue p10/p50/p90 0.41/0.58/0.62 · sub sectors (x·12: frames) 3:1469 2:1152 10:1029 1:960

Per 30 s (map=1; the map=0 Σ|dv| beside it): Σ|dv| uv/s · splats · kicks · snares · chords · hats · sub % · floor dye · dyeDiss · velDiss · curl · g · mid · key
| s | Σ\|dv\| (map0) | splats | kicks | snares | chords | hats | sub % | floor dye | dyeDiss | velDiss | curl | g | mid | key |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0–29 | 184 (172) | 3176 | 44 | 65 | 46 | 273 | 43 | 7.3 | 1.07 | 2.33 | 25 | 0.87 | 0.71 | Am 14, Dm 7, F 6, C 3 |
| 30–59 | 224 (239) | 3455 | 48 | 74 | 35 | 256 | 59 | 8.2 | 0.78 | 1.37 | 22 | 0.92 | 0.75 | Dm 23, Am 7 |
| 60–89 | 241 (253) | 3575 | 58 | 90 | 28 | 110 | 71 | 9.1 | 0.77 | 1.50 | 24 | 0.93 | 0.73 | Dm 30 |
| 90–119 | 254 (270) | 3715 | 53 | 89 | 42 | 287 | 68 | 10.2 | 0.66 | 0.86 | 21 | 0.93 | 0.76 | Dm 27, Am 3 |
| 120–149 | 214 (231) | 3300 | 43 | 71 | 29 | 365 | 46 | 9.9 | 0.76 | 0.71 | 22 | 0.89 | 0.74 | Dm 24, F 6 |
| 150–179 | 45 (51) | 2086 | 14 | 32 | 9 | 109 | 3 | 6.1 | 1.44 | 1.80 | 23 | 0.65 | 0.64 | Dm 19, F 7, C 4 |
| 180–209 | 354 (373) | 4404 | 75 | 89 | 46 | 571 | 88 | 10.5 | 0.69 | 0.21 | 20 | 0.98 | 0.77 | Dm 29, Gm 1 |
| 210–233 | 13 (23) | 1237 | 2 | 16 | 2 | 21 | 3 | 2.6 | 0.22 | 1.86 | 23 | 0.44 | 0.46 | Dm 13, F 11 |

The windows (map=1, the second the shot falls in; frame = 2 + 60·t at `at=0`; grey = the shot's whole-frame mean / p99, empty pool ≈ 24):
| window | t s | frame | g | sub % x | kicks (amp) | snares (amp) | chords (Δ) | hats | floor dye/s | Σ\|dv\| | dyeDiss | velDiss | curl | key conf | shot grey | shot dd/vd/curl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vocal-2 | 2 | 122 | 0.80 | 0 % — | 1 (0.72) | 0 () | 1 (0.25) | 0 | 0.24 | 0.9 | 1.00 | 3.00 | 20 | Am 0.00 | 23 / 85 | 1.00 / 3.00 / 15 |
| vocal-10 | 10 | 602 | 0.86 | 0 % — | 2 (0.37 0.49) | 2 (0.40 0.68) | 1 (0.28) | 0 | 0.29 | 2.6 | 1.00 | 3.00 | 23 | Dm 0.00 | 28 / 113 | 1.00 / 3.00 / 14 |
| beatin-16.0 | 16 | 962 | 0.89 | 57 % A# | 3 (0.50 0.43 0.46) | 3 (0.47 0.45 0.89) | 1 (0.29) | 6 | 0.29 | 10.0 | 6.68 | 2.52 | 19 | C 0.00 | 32 / 124 | 1.00 / 2.43 / 19 |
| beatinp-16.5 | 16.5 | 992 | 0.89 | 57 % A# | 3 (0.50 0.43 0.46) | 3 (0.47 0.45 0.89) | 1 (0.29) | 6 | 0.29 | 10.0 | 6.68 | 2.52 | 19 | C 0.00 | 33 / 116 | 12.00 / 2.71 / 22 |
| groove-30 | 30 | 1802 | 0.94 | 88 % A | 2 (0.72 0.36) | 3 (1.00 0.46 0.58) | 1 (0.21) | 18 | 0.23 | 10.7 | 0.69 | 1.44 | 26 | Am 0.00 | 54 / 161 | 0.68 / 2.09 / 27 |
| break-60 | 60 | 3602 | 0.84 | 0 % — | 0 () | 3 (0.70 0.65 0.39) | 1 (0.35) | 1 | 0.25 | 2.0 | 0.35 | 1.96 | 18 | Dm 0.29 | 35 / 148 | 0.34 / 2.99 / 16 |
| groove2-100 | 100 | 6002 | 0.91 | 95 % D | 3 (0.75 0.46 0.73) | 3 (0.87 0.51 0.74) | 2 (0.41 0.30) | 9 | 0.32 | 11.0 | 0.65 | 1.43 | 18 | Dm 0.09 | 40 / 124 | 0.66 / 0.20 / 20 |
| break2-150 | 150 | 9002 | 0.58 | 0 % — | 1 (0.43) | 2 (0.67 0.33) | 0 () | 18 | 0.16 | 2.9 | 0.40 | 2.16 | 19 | Dm 0.13 | 32 / 109 | 0.43 / 2.86 / 18 |
| falsedrop-157.0 | 157 | 9422 | 0.69 | 0 % — | 0 () | 1 (0.37) | 1 (0.41) | 0 | 0.29 | 2.1 | 6.32 | 0.72 | 25 | Dm 0.17 | 36 / 139 | 0.05 / 2.85 / 25 |
| falsedropp-157.5 | 157.5 | 9452 | 0.69 | 0 % — | 0 () | 1 (0.37) | 1 (0.41) | 0 | 0.29 | 2.1 | 6.32 | 0.72 | 25 | Dm 0.17 | 24 / 52 | 12.00 / 0.20 / 24 |
| return-178.5 | 178.5 | 10712 | 0.45 | 0 % — | 4 (1.00 0.81 0.82 0.75) | 4 (0.60 0.83 0.79 0.64) | 2 (0.34 0.19) | 0 | 0.17 | 5.2 | 5.03 | 1.25 | 31 | C 0.10 | 60 / 87 | 0.05 / 0.20 / 30 |
| returnp-179.2 | 179.2 | 10754 | 0.72 | 87 % C | 4 (0.69 0.40 0.37 0.75) | 4 (0.59 0.42 0.54 0.62) | 0 () | 6 | 0.28 | 11.1 | 7.62 | 0.20 | 20 | C 0.07 | 22 / 78 | 12.00 / 0.20 / 23 |
| groove3-200 | 200 | 12002 | 0.99 | 100 % A | 3 (0.49 0.45 0.67) | 3 (0.47 0.41 0.59) | 2 (0.18 0.39) | 18 | 0.34 | 12.7 | 0.71 | 0.21 | 20 | Dm 0.09 | 59 / 166 | 0.71 / 0.20 / 23 |
| outro-220 | 220 | 13202 | 0.41 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.10 | 0.0 | 0.05 | 1.44 | 21 | F 0.13 | 19 / 66 | 0.07 / 2.73 / 24 |

**Grey line, 1 fps** (montage-strip0.jpg / montage-busy.jpg):  
first 31 s 0–30 s mean: 23 23 23 23 22 23 23 23 26 27 28 29 29 29 29 30 32 28 39 43 45 47 50 51 51 52 51 52 55 57 54  
p99: 31 104 85 71 49 62 48 54 106 119 113 124 120 114 126 117 124 96 149 142 145 161 166 159 155 168 159 161 157 171 161  
busiest 31 s 179–209 s mean: 18 33 44 59 58 62 66 66 60 57 53 54 56 56 56 57 55 55 55 57 62 59 63 63 60 59 57 57 58 57 60  
p99: 71 112 133 178 153 181 182 176 163 156 133 152 147 150 154 157 149 149 143 161 174 166 171 162 157 158 148 153 158 149 168

**Reads.** The grooves (16–48, 64–112, 176–208 s): the pool stirred at 54–66, the sub column walking A♯ / A / D / G (sectors 1–3 and 10 — both sides of the frame), 8–13 uv/s per second — SeeYouDrop's groove picture. The map's section lines (16.4, 65.2, 130.3, 179.1 s) clear the pool where the beat returns, and the return at 179 s reads exactly as a drop should: 178.5 s the flash (grey 60), 179.2 s the empty pool with the ring (22 / 78), then 44 → 59 → 66 as the groove refills it (the busiest strip's first seconds).

**Wrong.** (1) **The colour**: keyConf never reaches .3 (p50 .13, p90 .26, the key guess walks Dm / F / Am / C), so the pool rides the mood hue — **magenta (2 s) → green (16) → cyan (30) → yellow (60) → salmon (100) → olive (150) → lilac (157, 220) → green-salmon (200)**: seven hues on a track in one key; *major warm / minor cool* is not what the eye gets. (2) **The breakdowns**: no sub, so no "where"; the vocal's consonants fire the snare lane (2–3 per second at amp .35–.70) and the chord channel, and the picture is the snare's two blobs at x .3 / .7 plus the floor blob (break-60: three yellow blobs, grey 35; break2-150: 32). (3) **Syrup**: `lpSweep` p50 .83 on this dark mix → `velDiss` > 1 on **114 s (46 % of frames)** — the shears sit where they land (break-60 `velDiss` 2.99: the blobs do not travel; the user's "hits must launch something that travels" fails here). (4) **Four false drops**: the live detector fires at 157.2 / 166.9 / 168.9 / 173.1 s inside the 144–178 s breakdown (bass .07–.19, no sub, loudRel .6–.8) and §107's OR lets each one clear the pool in file mode — falsedropp-157.5: **24 / 52, the empty pool**, the ring's blobs over nothing. The outro (208–233 s) is the floor alone at g .41–.48.

## 5. CyborgNinja — incompetech, 162 bpm, bass C2 held 85 %, `loudRange` 1 LU (the music has no dynamics).

**Totals.** map=1: music 180 s · injecting 180 s (floor-only 0) · sub 116 s · kick 180 s / 701 hits · snare 180 s / 1078 · chord 154 s / 281 shears (209 blocked by the refractory) · hats 180 s / 5279 droplets · floor 180 s · drops live/map/evt 0/0/0 · clear 0 s · void (dyeDiss < .5) 0 s · syrup (velDiss > 1) 0 s  
map=0: music 180 s · injecting 180 s (floor-only 0) · sub 180 s · kick 180 s / 562 hits · snare 180 s / 619 · chord 177 s / 531 shears (189 blocked by the refractory) · hats 180 s / 5293 droplets · floor 180 s · drops live/map/evt 0/0/0 · clear 0 s · void (dyeDiss < .5) 0 s · syrup (velDiss > 1) 0 s
**Drops (s, map=1):** live — · map — · extractor dropEvt (not a trigger) —. **map=0:** live —.
**Key (frames, map=1):** G# 4103 · G 3279 · Gm 2395 · Cm 552 · Dm 277 · keyConf p50 0.01 (p90 0.03) · tonicConf p50 0.01 · hue p10/p50/p90 0.62/0.62/0.63 · sub sectors (x·12: frames) 0:1161 2:597 7:457 9:322

Per 30 s (map=1; the map=0 Σ|dv| beside it): Σ|dv| uv/s · splats · kicks · snares · chords · hats · sub % · floor dye · dyeDiss · velDiss · curl · g · mid · key
| s | Σ\|dv\| (map0) | splats | kicks | snares | chords | hats | sub % | floor dye | dyeDiss | velDiss | curl | g | mid | key |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0–29 | 345 (406) | 3862 | 116 | 165 | 56 | 818 | 29 | 8.7 | 0.82 | 0.20 | 19 | 0.88 | 0.80 | Gm 13, G 12, Dm 5 |
| 30–59 | 377 (428) | 3635 | 120 | 197 | 43 | 804 | 14 | 9.4 | 0.70 | 0.20 | 19 | 0.97 | 0.80 | G 20, Cm 5, G# 5 |
| 60–89 | 413 (463) | 4045 | 117 | 179 | 48 | 852 | 36 | 9.2 | 0.70 | 0.21 | 22 | 0.98 | 0.76 | G# 30 |
| 90–119 | 481 (511) | 4422 | 117 | 186 | 39 | 1041 | 46 | 9.7 | 0.70 | 0.27 | 23 | 0.98 | 0.82 | G 13, Gm 9, G# 5, C# 3 |
| 120–149 | 401 (458) | 3972 | 116 | 173 | 50 | 852 | 32 | 9.8 | 0.68 | 0.21 | 21 | 0.99 | 0.81 | Gm 19, G 8, Cm 3 |
| 150–179 | 444 (471) | 4339 | 115 | 178 | 45 | 912 | 49 | 8.5 | 0.72 | 0.21 | 21 | 0.97 | 0.70 | G# 29, Cm 1 |

The windows (map=1, the second the shot falls in; frame = 2 + 60·t at `at=0`; grey = the shot's whole-frame mean / p99, empty pool ≈ 24):
| window | t s | frame | g | sub % x | kicks (amp) | snares (amp) | chords (Δ) | hats | floor dye/s | Σ\|dv\| | dyeDiss | velDiss | curl | key conf | shot grey | shot dd/vd/curl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| intro-3 | 3 | 182 | 0.83 | 20 % C | 3 (0.57 0.57 0.45) | 8 (0.67 0.25 0.24 0.41 0.21 0.26 0.51 0.35) | 1 (0.21) | 30 | 0.21 | 10.0 | 1.00 | 0.20 | 26 | Dm 0.05 | 36 / 119 | 1.00 / 0.20 / 31 |
| early-10 | 10 | 602 | 0.87 | 42 % C | 3 (0.59 0.61 0.66) | 6 (0.36 0.74 0.79 0.22 0.97 0.27) | 2 (0.17 0.62) | 42 | 0.27 | 14.1 | 0.84 | 0.20 | 25 | Dm 0.13 | 47 / 132 | 0.86 / 0.20 / 25 |
| groove-40 | 40 | 2402 | 0.96 | 0 % — | 3 (0.69 0.81 0.97) | 6 (0.46 0.66 0.92 0.23 1.00 0.31) | 1 (0.55) | 24 | 0.32 | 11.7 | 0.71 | 0.20 | 22 | G 0.00 | 70 / 184 | 0.70 / 0.20 / 21 |
| busy-88 | 88 | 5282 | 0.95 | 88 % C | 3 (0.89 0.77 0.89) | 8 (0.32 0.86 0.66 0.25 0.45 1.00 0.21 0.41) | 0 () | 39 | 0.21 | 18.4 | 0.73 | 0.20 | 23 | G# 0.00 | 68 / 177 | 0.73 / 0.20 / 24 |
| mid-100 | 100 | 6002 | 0.98 | 52 % C | 3 (0.61 0.71 1.00) | 5 (0.67 0.94 0.39 1.00 0.26) | 1 (0.79) | 30 | 0.34 | 14.9 | 0.73 | 0.20 | 25 | G 0.03 | 77 / 190 | 0.72 / 0.20 / 26 |
| loudest-138 | 138 | 8282 | 1.00 | 23 % C | 3 (0.63 0.56 0.49) | 7 (0.71 0.21 0.37 0.23 0.31 0.51 0.28) | 2 (0.20 0.40) | 27 | 0.33 | 11.9 | 0.68 | 0.21 | 21 | Gm 0.01 | 75 / 200 | 0.67 / 0.51 / 23 |
| quiet-157 | 157 | 9422 | 1.00 | 32 % C | 3 (0.87 0.41 0.64) | 5 (0.29 0.80 0.52 0.65 0.40) | 1 (0.24) | 12 | 0.35 | 9.6 | 0.67 | 0.20 | 16 | G# 0.01 | 71 / 187 | 0.68 / 0.20 / 17 |
| end-178 | 178 | 10682 | 0.94 | 100 % A# | 3 (1.00 0.39 0.94) | 7 (0.40 0.93 0.61 0.26 0.43 1.00 0.41) | 0 () | 57 | 0.20 | 20.7 | 0.77 | 0.20 | 23 | G# 0.00 | 70 / 174 | 0.76 / 0.20 / 23 |

**Grey line, 1 fps** (montage-strip0.jpg / montage-busy.jpg):  
first 31 s 0–30 s mean: 24 27 31 36 36 36 38 39 40 44 47 48 51 51 51 55 52 51 53 53 53 56 55 52 51 49 50 54 52 50 50  
p99: 31 117 102 119 114 110 125 124 126 126 132 136 157 151 151 168 157 146 150 152 156 159 144 135 162 143 139 146 140 139 152  
busiest 31 s 79–109 s mean: 73 74 76 79 77 78 73 69 71 68 66 69 67 69 72 72 73 76 76 72 76 77 72 75 72 72 71 72 72 78 75  
p99: 186 191 189 195 190 195 177 180 186 177 173 177 179 179 178 185 189 204 205 176 190 190 188 196 185 189 177 179 180 202 185

**Does not read.** Every second injects (180/180, never a void, never a clear, never a drop): kick 3.9 + snare 6.0 hits per second, 1.6 chord shears/s (209 more blocked by the refractory), **29 hat droplets per second** (5279 in 180 s; SeeYouDrop 5.5/s), Σ|dv| p50 **12.8 uv/s** (SeeYouDrop's groove 6.8) and 24 dye/s (SeeYouDrop 7). The pool is packed from 10 s on: the first strip climbs 24 → 51 in 12 s and holds, the busiest 31 s read **66–79 on all 31 seconds** (mean 73; p99 205) — a constant boil with no empty region, the relief a continuous texture: *fullness = phrase* and *how hard = size* have nothing to work with ("I want to see the shapes" fails). The music's own dynamic range is 1 LU, so some of this is honest — but the grammar adds no range of its own and the ink never drains.

**Also wrong.** (1) The sub emitter's **x is the left wall**: the bass is C (sector 0 → x = 0.5/12 = .042) for 1161 of 3699 open frames in file mode and 99 % of the track on the live lanes; the kicks launch from `xSub` too, so the whole bass end of the picture is at the wall (intro-3, busy-88: the column hugging the left edge). (2) The colour: keyConf p50 **.01** (the key guess G / G♯ / Gm / Cm) → the mood hue: violet (3 s) → pink (10) → **green for 40–178 s** with a cyan passage at 100–138 — the hue says nothing about the music. (3) The map's sub ruler opens the gate 34 % of the time vs the causal 99 % (the ruler disagreement, §1).

## 6. WhoLikesToParty — incompetech, 117.6 bpm, sub 37 %; drops (map / live) 56.5 / 57.5, 130.3 / 131.4, 187.8 / 188.8 s.

**Totals.** map=1: music 256 s · injecting 256 s (floor-only 1) · sub 254 s · kick 255 s / 972 hits · snare 255 s / 1219 · chord 168 s / 242 shears (212 blocked by the refractory) · hats 246 s / 6692 droplets · floor 256 s · drops live/map/evt 3/3/0 · clear 8 s · void (dyeDiss < .5) 26 s · syrup (velDiss > 1) 52 s  
map=0: music 256 s · injecting 256 s (floor-only 0) · sub 256 s · kick 254 s / 805 hits · snare 255 s / 1212 · chord 169 s / 235 shears (281 blocked by the refractory) · hats 245 s / 6501 droplets · floor 256 s · drops live/map/evt 3/0/0 · clear 5 s · void (dyeDiss < .5) 29 s · syrup (velDiss > 1) 52 s
**Drops (s, map=1):** live 57.52, 131.38, 188.78 · map 56.5, 130.33, 187.77 · extractor dropEvt (not a trigger) —. **map=0:** live 57.52, 131.38, 188.78.
**Key (frames, map=1):** D 9298 · Bm 5189 · Em 593 · G 204 · F#m 82 · keyConf p50 0.11 (p90 0.17) · tonicConf p50 0.12 · hue p10/p50/p90 0.62/0.65/0.74 · sub sectors (x·12: frames) 3:2618 4:1796 2:975 5:869

Per 30 s (map=1; the map=0 Σ|dv| beside it): Σ|dv| uv/s · splats · kicks · snares · chords · hats · sub % · floor dye · dyeDiss · velDiss · curl · g · mid · key
| s | Σ\|dv\| (map0) | splats | kicks | snares | chords | hats | sub % | floor dye | dyeDiss | velDiss | curl | g | mid | key |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0–29 | 419 (473) | 4761 | 122 | 161 | 37 | 1084 | 66 | 8.1 | 0.77 | 0.26 | 21 | 0.88 | 0.78 | D 29, Em 1 |
| 30–59 | 312 (389) | 3895 | 105 | 129 | 25 | 618 | 50 | 8.3 | 0.91 | 0.41 | 21 | 0.92 | 0.75 | Bm 21, D 6, G 3 |
| 60–89 | 436 (489) | 4671 | 126 | 157 | 33 | 1026 | 64 | 7.9 | 0.58 | 0.91 | 21 | 0.93 | 0.76 | D 20, Bm 10 |
| 90–119 | 329 (390) | 4057 | 108 | 134 | 26 | 515 | 64 | 9.1 | 0.55 | 0.52 | 20 | 0.97 | 0.83 | D 22, Bm 7, G 1 |
| 120–149 | 427 (498) | 4624 | 127 | 160 | 24 | 1113 | 57 | 7.9 | 0.98 | 0.80 | 21 | 0.92 | 0.73 | Bm 23, Em 7 |
| 150–179 | 308 (381) | 3919 | 98 | 122 | 29 | 570 | 56 | 9.0 | 0.55 | 0.60 | 22 | 0.96 | 0.81 | D 19, Bm 11 |
| 180–209 | 403 (465) | 4514 | 128 | 161 | 28 | 978 | 57 | 7.2 | 0.96 | 0.85 | 21 | 0.91 | 0.71 | D 20, Bm 7, Em 3 |
| 210–239 | 353 (403) | 4209 | 114 | 143 | 30 | 646 | 63 | 8.6 | 0.57 | 0.45 | 19 | 0.98 | 0.83 | D 30 |
| 240–256 | 118 (172) | 1748 | 44 | 52 | 10 | 142 | 43 | 4.9 | 0.52 | 0.55 | 20 | 0.96 | 0.76 | D 8, Bm 6, Em 3 |

The windows (map=1, the second the shot falls in; frame = 2 + 60·t at `at=0`; grey = the shot's whole-frame mean / p99, empty pool ≈ 24):
| window | t s | frame | g | sub % x | kicks (amp) | snares (amp) | chords (Δ) | hats | floor dye/s | Σ\|dv\| | dyeDiss | velDiss | curl | key conf | shot grey | shot dd/vd/curl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| intro-2 | 2 | 122 | 0.81 | 50 % A | 5 (0.13 0.33 0.35 0.85 0.28) | 6 (0.20 0.26 0.34 0.86 0.31 0.26) | 1 (0.51) | 39 | 0.26 | 12.5 | 1.00 | 0.20 | 22 | D 0.46 | 33 / 118 | 1.00 / 0.20 / 27 |
| early-10 | 10 | 602 | 0.87 | 57 % A | 3 (0.46 0.51 0.86) | 7 (0.23 0.39 0.18 0.51 0.30 0.70 0.41) | 1 (0.37) | 48 | 0.22 | 14.1 | 1.00 | 0.20 | 26 | D 0.12 | 46 / 134 | 1.00 / 0.20 / 26 |
| groove-35 | 35 | 2102 | 0.95 | 68 % B | 4 (0.25 0.23 0.39 0.21) | 4 (0.29 0.24 0.25 0.26) | 1 (0.30) | 0 | 0.28 | 7.1 | 0.50 | 0.22 | 21 | G 0.05 | 62 / 176 | 0.50 / 0.20 / 20 |
| groove-48 | 48 | 2882 | 0.95 | 50 % A | 5 (0.70 0.29 0.56 0.13 0.41) | 5 (0.32 0.36 0.33 0.18 0.33) | 1 (0.44) | 33 | 0.34 | 13.7 | 0.55 | 0.20 | 17 | Bm 0.18 | 63 / 177 | 0.53 / 0.20 / 19 |
| drop-57.0 | 57 | 3422 | 0.87 | 35 % E | 4 (0.68 0.31 0.31 0.51) | 5 (0.51 0.54 0.44 0.29 0.30) | 0 () | 9 | 0.28 | 10.1 | 6.11 | 0.20 | 27 | Bm 0.19 | 24 / 96 | 12.00 / 0.20 / 25 |
| dropp-57.5 | 57.5 | 3452 | 0.87 | 35 % E | 4 (0.68 0.31 0.31 0.51) | 5 (0.51 0.54 0.44 0.29 0.30) | 0 () | 9 | 0.28 | 10.1 | 6.11 | 0.20 | 27 | Bm 0.19 | 30 / 125 | 0.21 / 0.20 / 27 |
| mid-112 | 112 | 6722 | 0.98 | 48 % A | 3 (0.65 0.29 0.66) | 3 (0.83 0.46 0.80) | 2 (0.24 0.43) | 9 | 0.30 | 9.4 | 0.52 | 1.19 | 19 | D 0.11 | 75 / 216 | 0.52 / 1.55 / 19 |
| drop2-131.0 | 131 | 7862 | 0.86 | 60 % E | 3 (0.51 0.40 1.00) | 5 (0.14 0.31 0.35 0.59 1.00) | 1 (0.18) | 33 | 0.23 | 14.3 | 6.36 | 0.22 | 28 | Em 0.04 | 25 / 105 | 0.24 / 0.20 / 23 |
| groove2-160 | 160 | 9602 | 0.97 | 65 % A | 4 (0.79 0.79 1.00 0.74) | 6 (0.34 0.84 0.60 0.39 0.31 0.14) | 1 (0.28) | 24 | 0.29 | 14.7 | 0.55 | 0.20 | 24 | D 0.07 | 74 / 219 | 0.58 / 0.20 / 20 |
| drop3-188.0 | 188 | 11282 | 0.83 | 17 % A | 5 (0.73 0.55 0.12 0.37 0.22) | 6 (0.71 0.17 0.68 0.58 0.49 0.22) | 0 () | 30 | 0.26 | 12.9 | 6.11 | 0.20 | 27 | Em 0.15 | 31 / 84 | 12.00 / 0.20 / 22 |
| late-200 | 200 | 12002 | 0.92 | 58 % D | 5 (0.67 0.42 0.13 0.81 0.28) | 5 (0.88 0.79 0.22 0.70 0.16) | 0 () | 48 | 0.22 | 16.6 | 0.61 | 0.58 | 21 | D 0.14 | 58 / 172 | 0.62 / 0.20 / 16 |
| late-240 | 240 | 14402 | 0.99 | 75 % B | 3 (0.27 0.20 0.29) | 4 (0.35 0.20 0.25 0.18) | 2 (0.09 0.23) | 3 | 0.34 | 7.4 | 0.55 | 0.20 | 21 | D 0.19 | 68 / 168 | 0.54 / 0.20 / 21 |
| end-252 | 252 | 15122 | 0.98 | 13 % A | 2 (0.52 0.33) | 3 (0.29 0.45 0.38) | 1 (0.29) | 9 | 0.33 | 5.1 | 0.54 | 0.20 | 20 | D 0.06 | 71 / 196 | 0.51 / 0.20 / 21 |

**Grey line, 1 fps** (montage-strip0.jpg / montage-busy.jpg):  
first 31 s 0–30 s mean: 23 26 33 38 41 44 42 44 46 46 46 47 50 53 53 56 64 68 69 70 71 75 75 72 72 72 71 67 65 65 65  
p99: 31 119 118 144 150 136 133 158 141 132 134 147 168 165 164 169 185 185 175 189 198 199 188 189 193 190 179 173 184 175 167  
busiest 31 s 123–153 s mean: 63 65 64 55 54 59 60 57 25 27 43 55 57 65 70 72 71 73 74 73 72 72 70 71 71 71 73 74 70 70 74  
p99: 176 202 196 157 162 170 188 162 105 72 165 214 203 210 209 216 210 209 200 198 198 198 179 186 187 216 190 197 210 219 203

**Reads.** The three drops: the map's bar line and the live detector agree within a second on all three, and each clears the pool — drop-57.0 **24 / 96** (empty), dropp-57.5 30 (the ring's blobs re-entering), drop2-131.0 **25**, drop3-188.0 **31** — then the groove refills to 58–75. The sub walks A / B / D / E (sectors 2–5: the left-centre of the frame, never the wall). The kick lane's amps span .12–1.00 (p10 .20) — the widest floor-to-ceiling of the seven — so the kicks do read in sizes.

**Wrong.** (1) **Packed**: 8.6 drum hits + 26 hat droplets per second, Σ|dv| p50 12.3 uv/s, 21 dye/s → the pool above grey 60 on 15 of the first 31 s and **22 of the busiest 31** (mean 64, p99 219: mid-112 75/216, groove2-160 74/219, end-252 71/196); only the clears make room. (2) **The colour**: keyConf p50 .11 (D / Bm / Em / G) → the mood hue: blue-pink (2 s) → violet (10) → salmon (35) → green (48) → lime (112, 160) → lilac-pink (200) → cyan (240) → yellow (252): nine hues. (3) **Two clears per drop**: the map's line and the live detector fire 1.0–1.1 s apart (56.5 / 57.52, 130.33 / 131.38, 187.77 / 188.78 — 8 clear seconds for 3 drops), so the second clear empties what the first clear's ring and the drop's kicks had just put back. (4) Syrup on 52 s (19 %), the void half-on all track (`dyeDiss` p50 .56 from `tongueAmbig` .46).

## 7. Comptine — Yann Tiersen, *Comptine d'un autre été* (C'était ici, live 2002), solo piano 0–132 s, silence 130–132 s, applause 133–144 s; tag D major, 105 bpm. The hardest case.

**Totals.** map=1: music 145 s · injecting 144 s (floor-only 17) · sub 0 s · kick 68 s / 85 hits · snare 119 s / 294 · chord 87 s / 158 shears (66 blocked by the refractory) · hats 23 s / 147 droplets · floor 143 s · drops live/map/evt 5/1/6 · clear 9 s · void (dyeDiss < .5) 58 s · syrup (velDiss > 1) 93 s  
map=0: music 145 s · injecting 145 s (floor-only 10) · sub 1 s · kick 69 s / 75 hits · snare 115 s / 191 · chord 107 s / 236 shears (64 blocked by the refractory) · hats 23 s / 188 droplets · floor 143 s · drops live/map/evt 5/0/6 · clear 9 s · void (dyeDiss < .5) 58 s · syrup (velDiss > 1) 93 s
**Drops (s, map=1):** live 47.5, 52.17, 58.88, 107.92, 128.95 · map 107.37 · extractor dropEvt (not a trigger) 21, 40.8, 58.87, 67.4, 98.57, 129. **map=0:** live 47.5, 52.17, 58.88, 107.92, 128.95.
**Key (frames, map=1):** D 7044 · Bm 1165 · Em 226 · G 142 · E 69 · keyConf p50 0.00 (p90 0.00) · tonicConf p50 0.00 · hue p10/p50/p90 0.62/0.62/0.62 · sub sectors (x·12: frames) —

Per 30 s (map=1; the map=0 Σ|dv| beside it): Σ|dv| uv/s · splats · kicks · snares · chords · hats · sub % · floor dye · dyeDiss · velDiss · curl · g · mid · key
| s | Σ\|dv\| (map0) | splats | kicks | snares | chords | hats | sub % | floor dye | dyeDiss | velDiss | curl | g | mid | key |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0–29 | 70 (46) | 2084 | 18 | 59 | 28 | 67 | 0 | 7.7 | 0.96 | 2.81 | 24 | 0.85 | 0.73 | D 18, Bm 5, Em 4, G 2, E 1 |
| 30–59 | 70 (40) | 2073 | 22 | 57 | 46 | 12 | 0 | 7.8 | 1.06 | 2.85 | 21 | 0.85 | 0.73 | D 20, Bm 10 |
| 60–89 | 69 (39) | 2090 | 18 | 71 | 40 | 23 | 0 | 6.2 | 0.52 | 2.18 | 26 | 0.78 | 0.63 | D 26, Bm 4 |
| 90–119 | 84 (36) | 2112 | 21 | 82 | 36 | 21 | 0 | 7.1 | 1.13 | 0.65 | 22 | 0.81 | 0.70 | D 30 |
| 120–144 | 21 (18) | 1414 | 6 | 25 | 8 | 24 | 0 | 4.8 | 0.48 | 0.29 | 31 | 0.69 | 0.60 | D 24, Bm 1 |

The windows (map=1, the second the shot falls in; frame = 2 + 60·t at `at=0`; grey = the shot's whole-frame mean / p99, empty pool ≈ 24):
| window | t s | frame | g | sub % x | kicks (amp) | snares (amp) | chords (Δ) | hats | floor dye/s | Σ\|dv\| | dyeDiss | velDiss | curl | key conf | shot grey | shot dd/vd/curl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| intro-3 | 3 | 182 | 0.83 | 0 % — | 0 () | 3 (0.60 0.63 0.60) | 2 (0.17 0.41) | 0 | 0.22 | 2.0 | 1.00 | 3.00 | 26 | Em 0.00 | 25 / 94 | 1.00 / 3.00 / 26 |
| early-10 | 10 | 602 | 0.86 | 0 % — | 1 (0.74) | 3 (1.00 0.72 0.90) | 0 () | 0 | 0.28 | 3.9 | 1.00 | 3.00 | 22 | D 0.00 | 27 / 106 | 1.00 / 3.00 / 33 |
| phrase-30 | 30 | 1802 | 0.67 | 0 % — | 1 (0.94) | 4 (1.00 0.99 0.98 0.68) | 3 (0.34 0.33 0.25) | 0 | 0.20 | 4.2 | 0.44 | 3.00 | 25 | Bm 0.00 | 19 / 82 | 0.41 / 3.00 / 32 |
| falsedrop-47.0 | 47 | 2822 | 0.77 | 0 % — | 0 () | 1 (0.72) | 0 () | 0 | 0.17 | 2.6 | 6.03 | 3.00 | 28 | D 0.00 | 28 / 141 | 0.05 / 3.00 / 28 |
| falsedropp-47.5 | 47.5 | 2852 | 0.77 | 0 % — | 0 () | 1 (0.72) | 0 () | 0 | 0.17 | 2.6 | 6.03 | 3.00 | 28 | D 0.00 | 26 / 139 | 12.00 / 3.00 / 28 |
| busy-50 | 50 | 3002 | 0.86 | 0 % — | 1 (0.56) | 4 (0.51 0.59 0.94 0.68) | 1 (0.36) | 0 | 0.30 | 3.7 | 0.05 | 3.00 | 19 | Bm 0.00 | 29 / 158 | 0.05 / 2.99 / 24 |
| void-64 | 64 | 3842 | 0.94 | 0 % — | 0 () | 0 () | 3 (0.17 0.21 0.19) | 0 | 0.30 | 0.2 | 0.05 | 2.90 | 18 | D 0.00 | 44 / 187 | 0.05 / 2.94 / 18 |
| late-90 | 90 | 5402 | 0.86 | 0 % — | 0 () | 3 (0.71 0.56 0.80) | 1 (0.28) | 0 | 0.31 | 2.2 | 0.92 | 0.48 | 22 | D 0.00 | 33 / 133 | 0.81 / 0.89 / 24 |
| late-110 | 110 | 6602 | 0.86 | 0 % — | 0 () | 4 (0.83 0.72 0.63 0.65) | 1 (0.11) | 9 | 0.33 | 4.1 | 1.00 | 0.20 | 13 | D 0.00 | 27 / 103 | 1.00 / 0.20 / 12 |
| fade-125 | 125 | 7502 | 0.68 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.11 | 0.0 | 0.05 | 0.59 | 20 | D 0.00 | 32 / 114 | 0.05 / 0.29 / 25 |
| silence-131 | 131 | 7862 | 0.26 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.00 | 0.0 | 0.26 | 0.20 | 28 | D 0.00 | 16 / 21 | 0.28 / 0.20 / 20 |
| applause-135 | 135 | 8102 | 0.71 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.25 | 0.0 | 0.31 | 0.20 | 39 | D 0.00 | 26 / 75 | 0.32 / 0.20 / 41 |
| applause-140 | 140 | 8402 | 0.96 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.37 | 0.0 | 0.18 | 0.20 | 33 | D 0.00 | 33 / 124 | 0.26 / 0.20 / 35 |

**Grey line, 1 fps** (montage-strip0.jpg / montage-busy.jpg):  
first 31 s 0–30 s mean: 24 21 26 25 25 25 25 26 26 26 27 28 28 29 30 30 31 30 29 24 19 153 32 31 32 31 31 26 26 22 19  
p99: 31 71 108 94 85 91 78 97 95 97 106 116 103 120 111 114 123 104 99 106 79 198 113 100 116 133 156 103 82 65 82  
busiest 31 s 94–124 s mean: 28 22 18 20 21 25 27 36 38 39 34 34 29 31 23 22 27 34 35 36 34 36 37 34 33 30 31 38 39 39 37  
p99: 85 75 47 79 102 92 116 153 140 134 114 107 93 111 77 67 103 119 121 132 120 140 136 109 134 109 107 136 140 141 137

**Does not read.** The piano has no sub (the gate never opens: 0 %), no click, and its attacks rise more than a drum snare does — the snare lane calls **294 "snares" at amp p50 .66** (the drum tracks' p50 .34–.54) and the low notes 85 "kicks" — so the picture for 132 s is **three fixed points**: the two shears at x .3 / .7 (every attack, in place) and the kick's blob at (.5, .06), the `xSub` default that never moved because the sub never opened (intro-3 to late-110: the same tri-blob at every window). *Where = what* is absent — the melody's place (`harmAngle`, `centroid`) is not read by the grammar — and nothing travels: `lpSweep` p50 .93 on the dark piano mix → **`velDiss` 3.0 on 62 % of the frames** (the shears decay before they move: busy-50 `velDiss` 2.99). The void rule reads `buildLive` **1.0** (p90) on the crescendos and `tongueAmbig` on a rubato clock → `dyeDiss` .05 on 44 % of the frames → stale ink sits still: void-64 **44 / 187**, a frozen tri-blob. **Five false drops** (live 47.5, 52.2, 58.9, 107.9, 128.9 s; the map adds 107.4): each a full clear + a 2.5 uv/s impulse + the scene's ring on a piano piece (falsedrop-47: the flash, then 26). The colour: keyConf **.00** throughout (the ears never trust D) → the mood hue: indigo (3 s) → magenta (10) → pink (30–47) → teal (50) → cyan (64, 125) → purple (90, 110) — six hues on one piece in D. The applause (133–144 s: mid .85–.93, high .83–.94, no bass) is music to the grammar: the floor at .25–.37 dye/s, the snare lane 5 hits at 133 s (grey 26–33); the real silence at 130–132 s is read right (g .26, floor 0 — the only place the floor's knee ever acts on the six tracks).

**What does read**: coverage — 121 of 145 seconds have a kick-or-snare splat (the ears hear every attack), so the pool pulses with the playing; it just pulses at the same three points.

## 8. The pad recording (§108's take, `tools/work/fluid-diag/rec-live.json`, live lanes, 22 s of music)

Replayed under HEAD's grammar: 22/22 music seconds inject (the floor on 23 s at .19–.33 dye/s — **48 % of the take's dye**, the only track where the floor is the picture), 14 chord shears (Δ .36–.86 at 17–20 s, the 19.4 / 20.2 s attacks the §108 fix was for), 9 snare-lane hits, 1 kick (the silence step), 2 s of sub (the 15 Hz YIN ghost at the step). Σ|dv| p50 .2 uv/s — a tenth of Comptine's. The §108 before/after strip (`tools/accept/v0.35/fluid-s108-rec-strip.jpg`) stands; nothing in this survey re-shot it. Open as §108 left it: whether a never-empty floor reads as "music" or "the lights are on" is the user's eye.

## 9. Malicious — measured, **ignored until the user validates the ruler** (the user: "can ignore malicious until I validate the ruler")

Not in the cross-track table (§10.0) and not counted in the proposal's "wrong on ≥ 3 tracks". For the record:

**Totals.** map=1: music 221 s · injecting 221 s (floor-only 37) · sub 4 s · kick 85 s / 105 hits · snare 151 s / 234 · chord 62 s / 80 shears (3 blocked by the refractory) · hats 111 s / 614 droplets · floor 221 s · drops live/map/evt 0/0/3 · clear 0 s · void (dyeDiss < .5) 161 s · syrup (velDiss > 1) 3 s  
map=0: music 221 s · injecting 221 s (floor-only 1) · sub 172 s · kick 169 s / 270 hits · snare 215 s / 543 · chord 55 s / 65 shears (28 blocked by the refractory) · hats 108 s / 606 droplets · floor 221 s · drops live/map/evt 0/0/3 · clear 0 s · void (dyeDiss < .5) 161 s · syrup (velDiss > 1) 3 s
**Drops (s, map=1):** live — · map — · extractor dropEvt (not a trigger) 12.02, 18.82, 25.68. **map=0:** live —.
**Key (frames, map=1):** Cm 8370 · G 2834 · Gm 1289 · D 800 · Dm 20 · keyConf p50 0.07 (p90 0.69) · tonicConf p50 0.24 · hue p10/p50/p90 0.31/0.62/0.73 · sub sectors (x·12: frames) 11:33 6:16 7:15 4:5

Per 30 s (map=1; the map=0 Σ|dv| beside it): Σ|dv| uv/s · splats · kicks · snares · chords · hats · sub % · floor dye · dyeDiss · velDiss · curl · g · mid · key
| s | Σ\|dv\| (map0) | splats | kicks | snares | chords | hats | sub % | floor dye | dyeDiss | velDiss | curl | g | mid | key |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0–29 | 26 (78) | 1962 | 11 | 17 | 3 | 12 | 5 | 6.6 | 0.70 | 0.23 | 20 | 0.78 | 0.70 | D 14, Cm 8, G 6, Gm 2 |
| 30–59 | 25 (119) | 1900 | 8 | 19 | 6 | 29 | 0 | 8.5 | 0.52 | 0.20 | 26 | 0.93 | 0.68 | Cm 18, Gm 7, G 5 |
| 60–89 | 62 (175) | 2079 | 13 | 43 | 21 | 120 | 0 | 6.5 | 0.46 | 0.21 | 29 | 0.95 | 0.62 | Cm 26, G 4 |
| 90–119 | 67 (158) | 2101 | 15 | 44 | 20 | 133 | 0 | 6.3 | 0.45 | 0.20 | 20 | 0.92 | 0.59 | Cm 16, G 14 |
| 120–149 | 46 (152) | 1997 | 15 | 31 | 11 | 75 | 0 | 6.1 | 0.45 | 0.20 | 22 | 0.92 | 0.63 | Cm 18, G 8, Gm 4 |
| 150–179 | 56 (143) | 2026 | 17 | 31 | 8 | 108 | 0 | 5.5 | 0.45 | 0.21 | 24 | 0.88 | 0.57 | Cm 21, G 7, Gm 2 |
| 180–209 | 62 (159) | 2053 | 19 | 35 | 8 | 122 | 0 | 6.5 | 0.47 | 0.20 | 25 | 0.92 | 0.64 | Cm 20, G 5, Gm 5 |
| 210–222 | 23 (63) | 677 | 7 | 14 | 3 | 15 | 0 | 2.2 | 0.45 | 0.78 | 29 | 0.87 | 0.52 | Cm 13 |

The windows (map=1, the second the shot falls in; frame = 2 + 60·t at `at=0`; grey = the shot's whole-frame mean / p99, empty pool ≈ 24):
| window | t s | frame | g | sub % x | kicks (amp) | snares (amp) | chords (Δ) | hats | floor dye/s | Σ\|dv\| | dyeDiss | velDiss | curl | key conf | shot grey | shot dd/vd/curl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| stutter-5 | 5 | 302 | 0.84 | 0 % — | 1 (1.00) | 1 (0.48) | 0 () | 0 | 0.26 | 1.9 | 1.00 | 0.20 | 30 | D 0.00 | 22 / 50 | 1.00 / 0.20 / 23 |
| stutter-12 | 12 | 722 | 0.70 | 0 % — | 2 (1.00 1.00) | 1 (0.51) | 0 () | 0 | 0.26 | 2.4 | 0.55 | 0.20 | 26 | D 0.82 | 25 / 62 | 1.00 / 0.20 / 20 |
| groove-30 | 30 | 1802 | 0.91 | 0 % — | 0 () | 2 (0.47 0.44) | 0 () | 0 | 0.26 | 1.0 | 0.57 | 0.20 | 15 | Cm 0.04 | 32 / 76 | 0.56 / 0.20 / 16 |
| quiet-45 | 45 | 2702 | 0.96 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.32 | 0.0 | 0.49 | 0.20 | 25 | Cm 0.00 | 33 / 84 | 0.49 / 0.20 / 25 |
| bassin-56 | 56 | 3362 | 0.92 | 0 % — | 0 () | 1 (0.81) | 2 (0.27 0.34) | 3 | 0.10 | 1.5 | 0.45 | 0.20 | 44 | Cm 0.02 | 36 / 105 | 0.46 / 0.20 / 41 |
| busy-83 | 83 | 4982 | 0.99 | 0 % — | 0 () | 2 (0.62 0.52) | 0 () | 6 | 0.21 | 2.2 | 0.46 | 0.20 | 22 | Cm 0.02 | 35 / 87 | 0.45 / 0.20 / 22 |
| mid-135 | 135 | 8102 | 0.92 | 0 % — | 1 (0.48) | 1 (0.45) | 0 () | 0 | 0.17 | 1.3 | 0.41 | 0.20 | 19 | Cm 0.04 | 36 / 89 | 0.41 / 0.20 / 16 |
| late-200 | 200 | 12002 | 0.94 | 0 % — | 1 (1.00) | 1 (0.59) | 0 () | 0 | 0.19 | 2.2 | 0.54 | 0.20 | 22 | G 0.06 | 36 / 114 | 0.54 / 0.20 / 21 |
| end-220 | 220 | 13202 | 0.89 | 0 % — | 0 () | 0 () | 0 () | 0 | 0.00 | 0.0 | 0.44 | 2.17 | 43 | Cm 0.63 | 34 / 67 | 0.46 / 1.41 / 33 |

**Grey line, 1 fps** (montage-strip0.jpg / montage-busy.jpg):  
first 31 s 0–30 s mean: 23 22 22 22 22 22 24 27 26 25 26 25 25 28 28 28 30 30 29 58 28 28 27 30 31 32 39 33 34 32 32  
p99: 31 89 62 57 49 50 77 99 77 64 90 75 62 112 117 101 97 97 83 84 98 95 85 82 85 101 102 113 104 89 76  
busiest 31 s 69–99 s mean: 36 39 42 41 41 39 37 37 38 40 38 37 36 34 35 36 38 38 37 36 36 35 37 37 38 38 36 43 45 45 43  
p99: 101 119 139 121 114 97 81 87 100 109 89 83 79 66 87 89 102 100 89 83 104 96 110 119 115 108 88 135 132 125 115

**The finding is the ruler, not the grammar.** In file mode the map's sub ruler opens the gate on **83 frames of 13 368** (4 s of 223; `subIn` 2) against the causal ears' 6593 (172 s; `subIn` 126) — the map (`engine/map/subpitch.js`, `mapSubAt`) and the ears disagree 80× on this track's bass (f0 95 Hz G2, sub share 1 %), and the map's onsets place 105 kicks against the lanes' 270. So in the mode the user hears, Malicious has **no sub emitter at all** (the kicks at the `xSub` default .5), Σ|dv| p50 1.7 uv/s (live 4.7), the pool at 34–45 for the whole busiest strip, no drop of any kind (the hand-anchored grid's drops never reach `mapDropEvt`), `dyeDiss` < .5 on **161 of 221 s** (`tongueAmbig` .5–.9: the void rule on for 73 % of the track), keyConf p50 .02. Until the ruler is validated none of this says anything about the grammar.

## 10. Cross-track: the constants and the proposal (six tracks + the pad; Malicious excluded)

### 10.0 Every `K` constant and solver map — its effective range on the six tracks (file mode; the live-lane table is `cross-map0.md`)

p10/p50/p90 (min–max, n frames) on music frames unless said. **Limiting** = the constant sets what the eye sees on that track.

| quantity | SeeYouDrop | Vienna | IBelongHere | CyborgNinja | WhoLikesToParty | Comptine |
|---|---|---|---|---|---|---|
| music s / inj s / floor-only s | 158 / 158 / 7 | 193 / 193 / 31 | 230 / 229 / 19 | 180 / 180 / 0 | 256 / 256 / 1 | 145 / 144 / 17 |
| sub s · kick s (hits) · snare s (hits) | 138 · 97 (229) · 114 (387) | 148 · 75 (109) · 125 (201) | 133 · 153 (337) · 202 (526) | 116 · 180 (701) · 180 (1078) | 254 · 255 (972) · 255 (1219) | 0 · 68 (85) · 119 (294) |
| chord s (shears) · blocked · hat s (droplets) | 67 (85) · 54 · 93 (863) | 86 (174) · 104 · 119 (2144) | 148 (237) · 49 · 131 (1992) | 154 (281) · 209 · 180 (5279) | 168 (242) · 212 · 246 (6692) | 87 (158) · 66 · 23 (147) |
| drops live/map/evt | 2/2/2 @ 57.6,105.62,57.62,105.6 | 1/0/1 @ 85.33 | 5/5/3 @ 157.23,166.87,168.93,173.05,178.58,16.4,32.67,65.22,130.28,179.1 | 0/0/0 @ — | 3/3/0 @ 57.52,131.38,188.78,56.5,130.33,187.77 | 5/1/6 @ 47.5,52.17,58.88,107.92,128.95,107.37 |
| clear s · void s (dd<.5) · syrup s (vd>1) | 4 · 75 · 29 | 2 · 75 · 10 | 13 · 67 · 114 | 0 · 0 · 0 | 8 · 26 · 52 | 9 · 58 · 93 |
| g p10/p50/p90 | 0.79/0.94/0.99 (0.42–1.00, n 9441) | 0.86/0.97/0.99 (0.42–1.00, n 11547) | 0.58/0.92/0.99 (0.09–1.00, n 13821) | 0.91/0.98/1.00 (0.42–1.00, n 10791) | 0.86/0.95/0.99 (0.41–1.00, n 15366) | 0.65/0.83/0.94 (0.16–0.98, n 8649) |
| loudRel · hush · calm (p50) | 0.93 · 0.00 (max 0.00) · 0.00 (max 0.62) | 0.96 · 0.00 (max 0.00) · 0.00 (max 0.29) | 0.90 · 0.00 (max 0.00) · 0.02 (max 0.87) | 0.97 · 0.00 (max 0.00) · 0.00 (max 0.00) | 0.94 · 0.00 (max 0.00) · 0.00 (max 0.25) | 0.77 · 0.00 (max 0.00) · 0.02 (max 0.70) |
| kickAmp p10/p50/p90 | 0.32/0.55/1.00 (0.28–1.00, n 229) | 0.55/0.70/0.98 (0.53–1.00, n 109) | 0.39/0.56/0.93 (0.36–1.00, n 336) | 0.35/0.58/0.93 (0.23–1.00, n 701) | 0.20/0.50/0.94 (0.12–1.00, n 971) | 0.56/0.72/0.98 (0.55–1.00, n 85) |
| kick dy uv/s (KICK_V .9·√amp·g) | 0.49/0.61/0.79 (0.42–0.89, n 229) | 0.63/0.71/0.84 (0.55–0.88, n 109) | 0.52/0.63/0.82 (0.23–0.89, n 336) | 0.51/0.66/0.84 (0.38–0.90, n 701) | 0.37/0.58/0.80 (0.24–0.89, n 971) | 0.48/0.61/0.73 (0.14–0.80, n 85) |
| snareAmp | 0.28/0.42/0.72 (0.26–1.00, n 387) | 0.31/0.41/0.76 (0.29–1.00, n 201) | 0.36/0.54/0.87 (0.32–1.00, n 525) | 0.23/0.46/0.90 (0.20–1.00, n 1078) | 0.16/0.34/0.81 (0.13–1.00, n 1218) | 0.53/0.66/0.94 (0.49–1.00, n 294) |
| snare |dx| (SNARE_V .6·amp·g) | 0.16/0.24/0.41 (0.12–0.59, n 387) | 0.17/0.24/0.43 (0.13–0.59, n 201) | 0.19/0.30/0.49 (0.09–0.59, n 525) | 0.13/0.26/0.52 (0.09–0.60, n 1078) | 0.09/0.19/0.44 (0.07–0.59, n 1218) | 0.25/0.31/0.43 (0.07–0.53, n 294) |
| chord Δ (CHORD_RISE .05) | 0.22/0.28/0.45 (0.12–0.70, n 84) | 0.08/0.25/0.50 (0.05–0.85, n 173) | 0.19/0.27/0.50 (0.11–0.88, n 237) | 0.10/0.23/0.63 (0.05–0.81, n 280) | 0.15/0.30/0.64 (0.05–0.87, n 242) | 0.17/0.27/0.52 (0.08–0.88, n 157) |
| chord |dx| (CHORD_V .18·Δ·g) | 0.037/0.046/0.077 (0.011–0.110, n 84) | 0.013/0.042/0.085 (0.008–0.146, n 173) | 0.032/0.046/0.086 (0.017–0.149, n 237) | 0.017/0.041/0.108 (0.009–0.139, n 280) | 0.025/0.051/0.106 (0.008–0.155, n 242) | 0.024/0.042/0.078 (0.009–0.106, n 157) |
| v1 snare level | 0.00/0.00/0.19 (0.00–0.88, n 9441) | 0.00/0.01/0.33 (0.00–0.88, n 11547) | 0.00/0.04/0.26 (0.00–0.88, n 13821) | 0.10/0.24/0.47 (0.02–0.88, n 10791) | 0.02/0.16/0.46 (0.00–0.88, n 15366) | 0.00/0.05/0.29 (0.00–0.88, n 8649) |
| sub open frac · subHz | 77 % · 0/35/48 (0–77, n 7240) | 67 % · 0/39/57 (0–100, n 7708) | 50 % · 0/53/73 (0–105, n 6865) | 34 % · 0/65/75 (0–96, n 3699) | 59 % · 0/37/61 (0–118, n 8990) | 0 % · — |
| mouth ×wide · bassReg → y | 1.40/1.47/1.50 (1.24–1.50, n 7240) · 0.16/0.19/0.29 (0.14–0.37, n 7240) | 1.35/1.45/1.50 (1.11–1.50, n 7708) · 0.21/0.29/0.37 (0.16–0.37, n 7708) | 1.26/1.37/1.50 (1.09–1.50, n 6865) · 0.19/0.30/0.37 (0.16–0.37, n 6865) | 1.25/1.30/1.50 (1.13–1.50, n 3699) · 0.20/0.25/0.36 (0.18–0.37, n 3699) | 1.33/1.46/1.50 (1.01–1.50, n 8990) · 0.18/0.26/0.37 (0.14–0.37, n 8990) | — · — |
| sub sectors (x·12 → n frames) | 7:2634 6:1558 4:751 3:715 5:516 | 8:1743 9:1724 10:1561 7:909 6:852 | 3:1469 2:1152 10:1029 1:960 0:657 | 0:1161 2:597 7:457 9:322 10:295 | 3:2618 4:1796 2:975 5:869 1:834 |  |
| |subGlide| st/s (SUB_X per 12) | 0.0/0.3/16.8 (0.0–47.6, n 7240) | 0.0/0.5/5.5 (0.0–47.9, n 7708) | 0.0/2.9/26.3 (0.0–47.9, n 6865) | 0.0/12.3/26.9 (0.0–46.8, n 3699) | 0.0/0.7/14.3 (0.0–47.7, n 8990) | — |
| hat2>.3 frac · denH | 3 % · 2.0/3.0/8.0 (0.0–9.0, n 311) | 7 % · 2.0/5.0/7.0 (0.0–8.0, n 760) | 5 % · 3.0/4.0/6.0 (0.0–8.0, n 687) | 16 % · 7.0/8.0/9.0 (0.0–9.0, n 1762) | 15 % · 4.0/5.0/6.0 (0.0–8.0, n 2243) | 1 % · 1.0/2.0/5.0 (0.0–7.0, n 69) |
| mid p10/p50/p90 | 0.65/0.78/0.94 (0.11–1.00, n 9441) | 0.60/0.75/0.91 (0.24–1.00, n 11547) | 0.50/0.73/0.91 (0.01–1.00, n 13821) | 0.54/0.82/0.96 (0.33–1.00, n 10791) | 0.61/0.79/0.92 (0.02–1.00, n 15366) | 0.45/0.69/0.93 (0.06–1.00, n 8649) |
| mid < LO .15 · > HI .40 (frac) | 0 % · 100 % | 0 % · 100 % | 1 % · 96 % | 0 % · 99 % | 0 % · 99 % | 2 % · 94 % |
| floor on frac · dye/frame | 100 % · 0.0034/0.0048/0.0061 (0.0000–0.0077, n 9436) | 100 % · 0.0033/0.0044/0.0053 (0.0004–0.0067, n 11547) | 99 % · 0.0025/0.0048/0.0065 (0.0000–0.0088, n 13714) | 100 % · 0.0035/0.0053/0.0064 (0.0002–0.0086, n 10791) | 100 % · 0.0034/0.0047/0.0058 (0.0000–0.0081, n 15320) | 98 % · 0.0023/0.0040/0.0057 (0.0000–0.0068, n 8500) |
| tension → curl | 0.10/0.32/0.52 (0.01–0.96, n 9441) → 14/23/31 (10–48, n 9441) | 0.10/0.29/0.57 (0.00–0.90, n 11547) → 14/21/33 (10–46, n 11547) | 0.15/0.31/0.49 (0.01–0.92, n 13821) → 16/22/30 (11–47, n 13821) | 0.14/0.26/0.43 (0.05–0.69, n 10791) → 15/20/27 (12–38, n 10791) | 0.14/0.26/0.42 (0.06–0.77, n 15366) → 16/20/27 (12–41, n 15366) | 0.12/0.34/0.63 (0.02–0.99, n 8649) → 15/24/35 (11–50, n 8649) |
| lpSweep → velDiss (frac >1) | 0.01/0.41/0.97 (0.00–1.00, n 9441) → 0.20/0.20/3.00 (0.20–3.00, n 9441) (18 %) | 0.00/0.35/0.77 (0.00–0.99, n 11547) → 0.20/0.20/0.20 (0.20–3.00, n 11547) (5 %) | 0.20/0.83/0.98 (0.00–1.00, n 13821) → 0.20/0.49/3.00 (0.20–3.00, n 13821) (46 %) | 0.00/0.54/0.74 (0.00–0.91, n 10791) → 0.20/0.20/0.20 (0.20–2.22, n 10791) (1 %) | 0.00/0.73/0.90 (0.00–1.00, n 15366) → 0.20/0.20/1.89 (0.20–3.00, n 15366) (19 %) | 0.00/0.93/0.99 (0.00–1.00, n 8649) → 0.20/2.65/3.00 (0.20–3.00, n 8649) (62 %) |
| buildLive · tongueOn frac · tongueAmbig|on | 0.00/0.00/0.00 (0.00–1.00, n 9441) · 91 % · 0.34/0.53/0.75 (0.24–0.95, n 8587) | 0.00/0.00/0.00 (0.00–1.00, n 11547) · 77 % · 0.27/0.53/0.90 (0.21–0.98, n 8842) | 0.00/0.00/1.00 (0.00–1.00, n 13821) · 91 % · 0.30/0.39/0.70 (0.24–0.89, n 12608) | 0.00/0.00/0.00 (0.00–0.00, n 10791) · 95 % · 0.25/0.32/0.36 (0.14–0.41, n 10217) | 0.00/0.00/0.00 (0.00–0.84, n 15366) · 94 % · 0.35/0.46/0.52 (0.28–0.59, n 14515) | 0.00/0.00/1.00 (0.00–1.00, n 8649) · 29 % · 0.21/0.52/0.87 (0.17–0.97, n 2539) |
| dyeDiss (frac <.5) | 0.27/0.51/0.77 (0.05–12.00, n 9441) (48 %) | 0.23/0.55/1.00 (0.05–12.00, n 11547) (39 %) | 0.05/0.65/1.00 (0.05–12.00, n 13821) (30 %) | 0.66/0.70/0.78 (0.61–1.00, n 10791) (0 %) | 0.49/0.56/0.69 (0.20–12.00, n 15366) (13 %) | 0.05/1.00/1.00 (0.05–12.00, n 8649) (44 %) |
| bpm → clear s | 150/150/150 (123–150, n 9441) → 0.40/0.40/0.40 (0.40–0.40, n 4) | 90/90/90 (89–166, n 11547) → 0.67/0.67/0.67 (0.67–0.67, n 1) | 118/118/118 (117–158, n 13821) → 0.51/0.51/0.51 (0.51–0.51, n 10) | 160/160/160 (122–160, n 10791) → — | 117/117/117 (116–124, n 15366) → 0.51/0.51/0.51 (0.51–0.51, n 6) | 99/111/142 (99–166, n 8649) → 0.42/0.54/0.55 (0.42–0.55, n 6) |
| body (BODY .35·cos⁴·g) | -0.302/-0.078/-0.000 (-0.349–0.000, n 9441) | -0.314/-0.083/-0.000 (-0.350–0.000, n 11547) | -0.292/-0.071/-0.000 (-0.350–0.000, n 13821) | -0.319/-0.085/-0.000 (-0.350–0.000, n 10791) | -0.310/-0.082/-0.000 (-0.349–0.000, n 15366) | -0.271/-0.065/-0.000 (-0.343–0.000, n 8649) |
| key hist (frames) | C#m:7189 F#m:984 A:623 C#:613 | D#m:11547 | Dm:10047 F:1844 Am:1493 C:390 | G#:4103 G:3279 Gm:2395 Cm:552 | D:9298 Bm:5189 Em:593 G:204 | D:7044 Bm:1165 Em:226 G:142 |
| keyConf · tonicConf · hue | 0.04/0.43/0.59 (0.00–0.94, n 9441) · 0.10/0.47/0.66 (0.00–0.94, n 9441) · 0.49/0.58/0.63 (0.00–1.00, n 9441) | 0.24/0.36/0.56 (0.02–1.00, n 11547) · 0.26/0.38/0.49 (0.00–1.00, n 11547) · 0.60/0.62/0.66 (0.59–0.93, n 11547) | 0.00/0.13/0.26 (0.00–0.33, n 13821) · 0.01/0.13/0.19 (0.00–0.33, n 13821) · 0.41/0.58/0.62 (0.00–1.00, n 13821) | 0.00/0.01/0.03 (0.00–0.36, n 10791) · 0.00/0.01/0.02 (0.00–0.36, n 10791) · 0.62/0.62/0.63 (0.00–1.00, n 10791) | 0.02/0.11/0.17 (0.00–0.88, n 15366) · 0.02/0.12/0.18 (0.00–0.88, n 15366) · 0.62/0.65/0.74 (0.00–1.00, n 15366) | 0.00/0.00/0.00 (0.00–0.09, n 8649) · 0.00/0.00/0.00 (0.00–0.00, n 8649) · 0.62/0.62/0.62 (0.62–0.93, n 8649) |
| splats/s · Σ|dv|/s · Σdye/s (music s) | 74/126/146 (26–168, n 158) · 2.4/6.8/12.2 (0.0–24.4, n 158) · 1.2/6.9/16.8 (0.0–46.8, n 158) | 60/127/162 (37–200, n 193) · 0.0/6.0/11.7 (0.0–19.6, n 193) · 0.3/5.2/18.8 (0.1–31.3, n 193) | 62/122/157 (0–181, n 230) · 0.2/8.0/13.0 (0.0–19.1, n 230) · 0.5/8.5/21.7 (0.0–40.9, n 230) | 102/127/181 (88–200, n 180) · 9.8/12.8/19.8 (7.1–22.6, n 180) · 17.0/23.9/35.2 (12.5–41.5, n 180) | 115/144/170 (33–186, n 256) · 7.5/12.3/16.3 (0.0–21.1, n 256) · 11.0/20.9/29.6 (0.0–42.6, n 256) | 60/68/76 (0–100, n 145) · 0.0/2.2/4.2 (0.0–6.9, n 145) · 0.3/2.6/5.2 (0.0–15.8, n 145) |
| fields: bass · high · eS · centroid | 0.78 · 0.79 · 0.80 · 1 | 0.74 · 0.58 · 0.76 · 0 | 0.50 · 0.53 · 0.70 · 1 | 0.78 · 0.82 · 0.82 · 1 | 0.59 · 0.62 · 0.73 · 1 | 0.55 · 0.32 · 0.64 · 0 |
| fields: width · subPure · dirty · punchy · perc | 0.52 · 0.73 · 1.00 · 0.00 · 0.21 | 0.43 · 0.27 · 0.36 · 0.11 · 0.18 | 0.64 · 0.00 · 0.65 · 0.22 · 0.32 | 0.00 · 0.53 · 1.00 · 0.18 · 0.68 | 0.49 · 0.11 · 0.90 · 0.34 · 0.77 | 0.92 · 0.00 · 0.00 · 0.25 · 0.09 |
| fields: loudRange · arousal · valence · modeShade | 4.0 · 0.47 · 0.37 · -0.22 | 3.5 · 0.37 · 0.08 · -0.59 | 6.0 · 0.44 · 0.28 · -0.01 | 1.0 · 0.83 · 0.26 · 0.00 | 3.0 · 0.78 · 0.18 · -0.00 | 6.5 · 0.29 · 0.46 · 0.00 |
| fields: v1 kick lvl · hit · novelty | 0.19 · 0.09 · 0.03 | 0.19 · 0.07 · 0.02 | 0.14 · 0.08 · 0.03 | 0.20 · 0.12 · 0.01 | 0.20 · 0.13 · 0.02 | 0.14 · 0.05 · 0.04 |

**Read across the columns:**

| constant / map | what it does across the six | limiting on |
|---|---|---|
| `RADIUS` .0025 | the same blob on every track; never the variable | — |
| `SUB_V` .08 /frame (4.8·g uv/s continuous), `SUB_DYE` .015 | the strongest continuous source; open 34–77 % of the time on five tracks, **0 %** on Comptine (and the pad); `SUB_X` .02 per 12 st/s moves the column ≤ .02/frame except CyborgNinja's slides (\|glide\| p50 12 st/s) | Comptine / pad (absent → no "where"); CyborgNinja (present but at the wall: sector 0 = x .042) |
| the sub's x = (sector + ½)/12, y = .12 + .25·bassReg | sectors spread on SeeYouDrop (7, 6, 4, 3), Vienna (8–10), IBelongHere (1–3, 10, 0), WhoLikesToParty (1–5); pinned at **0** (the wall) on CyborgNinja; y spans .16–.37 only (bassReg p10–p90 .16–.37) — the register axis is a quarter of the frame | CyborgNinja (wall); IBelongHere's 1617 frames in sectors 0–1 |
| `KICK_V` .9·√amp, radius ×2 | kickAmp p10 .20–.56 (the lane's .31 floor) → dy p10–p90 **.49–.84** on every track: the smallest kick is ≥ 56 % of the biggest (√.31); the law has no room below the floor; rates .5–3.9 hits/s | CyborgNinja, WhoLikesToParty (every kick big; 3.9 / 3.8 per s) |
| `SNARE_V` .6·amp | snareAmp p10 .16–.53, \|dx\| p50 .19–.31; Comptine's piano attacks read .66 p50 — bigger than any drum track's snare | Comptine (the only lateral motion it has, in place) |
| `HAT_V` −.15, `HAT_DYE` .3, up to 3 droplets/frame while hat2 > .3 | hat2 > .3 on 1–16 % of frames, denH p50 3–8 → 3 droplets on most of those frames: **5279 / 6692 droplets** (29 / 26 per s) on CyborgNinja / WhoLikesToParty, 863 (5.5/s) SeeYouDrop, 147 Comptine | CyborgNinja, WhoLikesToParty (the surface packed, the top-edge p99 ≥ 170) |
| `BODY` .35 | body p50 −.07…−.09, p10 −.30 on every track — including Comptine's rubato (the clock runs on anything: bpm 99–166 there) | — (uniform; not seen to help or hurt) |
| `DROP_V` 2.5, `DROP_DYE` 1, `DROP_DISS` 12, clear 60/bpm (.40–.67 s) | right on SeeYouDrop 2/2, Vienna 1/1 (the live detector; the map has none), WhoLikesToParty 3/3 but **doubled** (map + live 1 s apart); **wrong** on IBelongHere (4 false live drops of 10) and Comptine (5 false live drops of 6) | IBelongHere, Comptine (clears on nothing); WhoLikesToParty (two clears per drop) |
| `FLOOR_DYE` .004 × mid × g, `FLOOR_LO` .15 / `FLOOR_HI` .40 | mid p50 .69–.82 and **above HI on 94–100 % of frames** on all six: the floor is a constant .0040–.0053 ink/frame (.24–.32 dye/s) everywhere; 1–4 % of the dye on the drum tracks, 8 % on Comptine, 48 % on the pad; the knee acts only on Comptine's 2 s of silence and the pad's | never limiting — and never varying: "the lights are on" (§108's open question) |
| `CHORD_V` .18·Δ, `CHORD_DYE` .08, `CHORD_RISE` .05, `CHORD_REF` .15 s | Δ p10 .08–.22 (the rise threshold is rarely the gate), \|dx\| p50 **.041–.051** — a sixth of a snare shear, invisible inside a 7–13 uv/s field; 84–281 shears per track with **49–212 more blocked by the refractory** (CyborgNinja 209 of 490 rises) | the pad only (where it is the channel); on the drum tracks it is noise at a sixth of a snare |
| `curl` 10 + 40·tension | tension p50 .26–.34 → curl 14–35 (p10–p90) on all six; Comptine's p90 .63 → 35 | — |
| `velDiss` .2 + 2.8·sstep(.80, .97, lpSweep) + 2·hush | hush **0.00 on all seven** (a dead term); lpSweep p50 .35 (Vienna) … **.83 (IBelongHere), .93 (Comptine)** → velDiss > 1 on 1 / 5 / 18 / 19 / **46 / 62 %** of frames (CyborgNinja / Vienna / SeeYouDrop / WhoLikesToParty / IBelongHere / Comptine); the knee .80–.97 sits where a dark mix lives | Comptine, IBelongHere (nothing travels), SeeYouDrop's outro |
| `dyeDiss` 1 → .05 by max(buildLive, tongueOn ? tongueAmbig : 0); 12 for the clear | tongueOn 29–95 % of frames, tongueAmbig p50 .32–.53; buildLive p90 **1.0 on IBelongHere and Comptine** (a vocal swell, a piano crescendo); dyeDiss < .5 on 0 % (CyborgNinja) / 13 / 30 / 39 / 44 / 48 % (WhoLikesToParty / IBelongHere / Vienna / Comptine / SeeYouDrop); even at .05–.4 the pool empties in ~10 s (Vienna 64 → 75 s: 50 → 30) | Comptine (stale ink), SeeYouDrop's outro; and it is *not* holding Vienna's dream |
| `g` = presence·(.3 + .7·loudRel)·(1 − .8·hush)·(1 − .5·calm) | p10 .58–.91, p50 .83–.98: calm > 0 only at the starts (max .25–.87), hush 0 → g is a near-constant ≥ .8 — no dynamics come from it | — (it never quiets anything mid-track) |
| the colour: `anchor(key, mode, keyConf …)` → hsv(hue, sat·(.4 + .6·tonicConf)) | the key is taken only at keyConf ≥ `KEYC1` .3 (held after): **SeeYouDrop p50 .43, Vienna .36 — held; IBelongHere .13 (p90 .26), WhoLikesToParty .11, CyborgNinja .01, Comptine .00 — never**, the pool slides to `LOOK.mood.hue` (`look.js:35`: the mood family's anchor swung by intensity × arousal); tonicConf the same numbers → saturation .4 of max on those four | IBelongHere, WhoLikesToParty, CyborgNinja, Comptine (the hue walks) |

Strip grey statistics (the two 1 fps strips per track; empty ≈ 24, SeeYouDrop's groove 46–60, > 60 = SeeYouDrop's drop/build level):

| track | strip | mean of means | min–max | s < 28 (empty) | s 28–45 | s 46–60 | s > 60 (packed) | p99 max |
|---|---|---|---|---|---|---|---|---|
| SeeYouDrop | first 31 s | 33 | 20–50 | 15 | 9 | 7 | 0 | 158 |
| SeeYouDrop | busiest 31 s | 57 | 37–73 | 0 | 2 | 17 | 12 | 220 |
| Vienna | first 31 s | 37 | 21–54 | 9 | 11 | 11 | 0 | 151 |
| Vienna | busiest 31 s | 49 | 40–56 | 0 | 7 | 24 | 0 | 162 |
| IBelongHere | first 31 s | 36 | 22–57 | 11 | 9 | 11 | 0 | 171 |
| IBelongHere | busiest 31 s | 56 | 18–66 | 1 | 2 | 22 | 6 | 182 |
| CyborgNinja | first 31 s | 46 | 24–56 | 2 | 8 | 21 | 0 | 168 |
| CyborgNinja | busiest 31 s | 73 | 66–79 | 0 | 0 | 0 | 31 | 205 |
| WhoLikesToParty | first 31 s | 56 | 23–75 | 2 | 6 | 8 | 15 | 199 |
| WhoLikesToParty | busiest 31 s | 64 | 25–74 | 2 | 1 | 6 | 22 | 219 |
| Comptine | first 31 s | 31 | 19–152 | 17 | 13 | 0 | 1 | 198 |
| Comptine | busiest 31 s | 31 | 18–39 | 9 | 22 | 0 | 0 | 153 |
| Malicious | first 31 s | 29 | 22–58 | 16 | 14 | 1 | 0 | 117 |
| Malicious | busiest 31 s | 38 | 34–45 | 0 | 31 | 0 | 0 | 139 |

### 10.1 Ranked proposal — per-track-invariant first (wrong on ≥ 3 of the six), then per-material

Side-effect legend as FLUID-DIAG §9: **26** = every line of `tools/accept/v0.35/scene-md5-v035.txt` moves (a velocity the fake timeline exercises); **s12** = the s12 pair alone (dye only); **0** = no line (the fake pins the field out of reach). `trans-mixs-md5.txt` / `gielis-still-md5.txt` move with any velocity change (§108).

1. **A density governor — the track's own range, not the lane's floor** (packed on CyborgNinja and WhoLikesToParty, 6 packed seconds in IBelongHere's grooves; the hit-size compression on all six). Three parts, all in `inject.js`:
   (a) size the hits by their rank in the track's own distribution the way `loudRel` ranks loudness: `amp' = clamp((amp − q10)/(q90 − q10))` with running quantiles of `kickAmp` / `snareAmp` in `st` (SeeYouDrop's .32/1.00 maps ≈ identity, so the reference does not move visibly; CyborgNinja's .35/.93 and WhoLikesToParty's .20/.94 get a bottom again);
   (b) one hat droplet per frame at most, ink ÷ max(1, denH): 29/s → ≤ 10/s on the incompetech pair, SeeYouDrop's 5.5/s untouched;
   (c) an ink budget: raise `dyeDiss` with the injected dye rate — `dyeDiss = max(grammar, Σdye_1s / BUDGET)` with BUDGET = SeeYouDrop's groove (≈ 8 dye/s): CyborgNinja's 24/s drains three times faster, SeeYouDrop's groove at 1.0 as now. Fields: `denK`, `denS`, `denH` (in FEATS, not yet in `FLUID_FEATS`), `perc`, `punchy`, `loudRange` (CyborgNinja 1.0 vs 3–6.5: a track with no range is where the governor must supply one). md5: **26** (the fake's kicks, snares and hats are velocities).
2. **The pool's colour from the key at a lower trust, never from the mood** (wrong on IBelongHere, WhoLikesToParty, CyborgNinja, Comptine — 4 of 6). In `plan()`: pass `pin = keyConf ≥ .1 ? {k: key, m: mode} : null` to the anchor (`pin` gives `kw` 1, so the key wins at .1 instead of .3 — IBelongHere p50 .13 and WhoLikesToParty .11 hold their key most of the time), and for keyConf < .1 pass a `moodHue` computed from `harmAngle`'s nearest fifth (`fifthKey`, the anchor's own fallback) with the mode from `tonicMinor` instead of `LOOK.mood.hue` — the hue then changes only when the harmony does, never with arousal. Fields: `key`, `mode`, `keyConf`, `harmAngle`, `valence` (declared) + `tonic`, `tonicMinor`, `tonicConf` (to declare). md5: **0 / s12 at most** — `#test` pins keyConf .8 so the trust change never fires on the fake, and the colour is dye only. The cheapest fix in the list.
3. **Syrup only on a sweep that moves** (`velDiss` > 1 on 62 % Comptine, 46 % IBelongHere, 18–19 % SeeYouDrop / WhoLikesToParty — 3 of 6 where it fires without a filter sweep). `velDiss = .2 + 2.8·sstep(.80, .97, lpSweep)·sstep(0, .05, |Δ lpSweep| over 1 s)` — a closed filter that is not closing is a dark mix, not syrup — and drop the dead `2·hush` term (hush 0.00 on all seven). Fields: `lpSweep`, `centroid` (a sweep closes it against its own 30 s range), `buildLive` (a sweep inside a build is the real case). md5: **26**.
4. **Bound the void and latch it on drums** (dyeDiss < .5 on 30–48 % of four tracks from `tongueAmbig` alone; `buildLive` 1.0 on a piano crescendo and a vocal swell). `dyeDiss ≥ .3` unless `buildLive > .5` with a sub or kick seen in the last 8 bars (DIAG §9.5's latch) — the tongues' ambiguity is a clock-lock measure, not the music's emptiness, and the measured hold is ten seconds anyway (Vienna 50 → 30). Fields: `tongueOn`, `tongueAmbig`, `buildLive`, `subGate`, `kickEvt`. md5: **s12**.
5. **The clear: one trigger per mode, confirmed by bass** (IBelongHere 4 false, Comptine 5 false, WhoLikesToParty doubled — 3 of 6). In file mode with the map on (`mapOn` > .5) arm on `mapDropEvt` alone (§107's OR was for drop 1 where the live detector never fires — the map fires there; the live detector is for live nights); in both modes confirm: the clear and the impulse hold until `bass` or `subGate` rises within one beat of the trigger, else no clear (IBelongHere's 157 s has bass .09, Comptine's drops .3–.4 and no sub; every true drop on SeeYouDrop / Vienna / WhoLikesToParty brings the sub within the beat). Fields: `mapOn` (to declare), `bass` (to declare), `subGate`, `dropLiveIn`. md5: **26** (§107: the fake's drop frame).
6. **The bass end relative to the tonic** (CyborgNinja at the left wall for the whole track; IBelongHere 1617 frames in sectors 0–1; Comptine's kick at the never-set default .5): `x = (sectorPc(subNote − key) + 6.5)/12` — the tonic at the centre, the fifth to its right, the fourth to its left, every track's "where" on the same axis — and `st.xSub` initialised to the tonic's x, so a track with no sub still lifts at the tonic. Wrong on 2 of 6 only; listed because it also makes "where = what" musical rather than absolute. Fields: `subNote`, `key`. md5: **26**.
7. **The floor on the track's own range** (never wrong, never varying: mid > HI on 94–100 %): `FLOOR_LO/HI` as quantiles of `mid` over the running 30 s (p20 / p80) so a pad swell brightens and a steady level does not — or leave it; §108's open question is the user's eye. Fields: `mid`. md5: **s12**.

### 10.2 Per-material branches (what the fields say the material is, and what the pool should do there)

| material | the tracks | the fields that name it (p50, file mode) | what the grammar should do differently | md5 |
|---|---|---|---|---|
| **solo piano / pad** | Comptine 0–132 s; the pad recording; Vienna's dream 66–84 s; IBelongHere's outro | `subPure` 0, `subGate` never, `perc` .09 (the pad: no `hat2`), `dirty` 0, `width` .92, `centroid` 0 (Comptine) · `mid` .7–.95, `high` low | **a harmonic branch**: (i) the snare-lane and chord hits placed at the harmony's place — x from `harmAngle`'s sector on the same circle (the melody's "where"), y from `centroid` / `bassReg` (a high note high) — one directed splat each instead of the fixed .3 / .7 pair; (ii) the kick-lane hits (the low notes) at `harmAngle`'s x, not at `xSub`'s stale default; (iii) syrup and void off (no sweep, no build on a piano — proposals 3–4 cover it); (iv) the floor on `mid`'s own range (7); (v) **applause / noise** (`high` > .8 and `bass` < .15 with no `hit`): inject nothing | 26 (velocity) |
| **vocal house** | IBelongHere's breakdowns (48–64, 112–130, 144–178, 208–233 s) | `perc` .32, `subPure` 0 while `subGate` shut, `mid` .5–.8, `width` .64, `loudRange` 6 (the widest ladder) | the harmonic branch while the sub is shut (the vocal's consonants and the chord rises go to `harmAngle`'s x — the tune has a place), the drum grammar back when the sub returns; the clear only on the confirmed return (5); the colour held (2) | 26 |
| **dubstep / party** | SeeYouDrop, WhoLikesToParty, CyborgNinja | `subPure` .11–.73, `dirty` .9–1.0, `perc` .21–.77, `punchy` 0–.34, `arousal` .47–.83, `loudRange` 1–4 | the density governor (1) and the hat cap are the whole change; SeeYouDrop is the reference and (1a) maps ≈ identity on it; the clear once per drop (5) | 26 |

What a tuning pass should prove, per step: the SeeYouDrop windows of this survey re-shot (groove-35, drop1 57.5 / 58.0, build-100, drop2 105.5 / 106.0, outro-150) within ±5 grey of today's numbers (51 / 71 → 37 / 61 / 78 → 37 / 33) — the reference must not move — and the CyborgNinja busiest strip's packed count (31/31 today) and the Comptine tri-blob (three fixed points at every window today) as the two "it changed" rulers; IBelongHere's falsedropp-157.5 (24 today) must read as the breakdown's pool, not the empty one; IBelongHere's hue at 2 / 16 / 30 / 60 / 100 s one hue.

## 11. Artefacts

- `tools/work/fluid-tracks/<track>/` for the seven tracks: `trace-map{1,0}.json`, `replay-map{1,0}.txt` (the per-second table), `replay-map{1,0}.json`, `section.md`, `shots/` (the windows `<name>.jpg`, the strips `a00–a30.jpg` / `b00–b30.jpg`, `grey.txt`, `evals.txt`), `montage.jpg`, `montage-strip0.jpg`, `montage-busy.jpg`.
- `tools/work/fluid-tracks/PadRec/replay-map0.{txt,json}` — §108's take under HEAD's grammar.
- `tools/work/fluid-tracks/cross-map1.md`, `cross-map0.md` (six tracks), `cross-all-map{1,0}.md` (with Malicious), `greystats.md`.
- The tools: `analyze.mjs` (the replay + the constants' ranges), `windows.mjs` (the busiest / quietest windows), `windows.txt`, `shots.sh` + `run-shots.sh` (one deterministic run per track; `cdp.js` here is `tools/cdp.js` with a fixed `DBG` debug port per stream — two parallel streams of the stock driver collided on a stale Chrome's `/json` list and shot the wrong track), `montage.sh` + `montage.py`, `doc-track.mjs`, `cross.mjs`, `greystats.sh`, `doc.tpl.md` + `assemble.sh` (this document).
- Nothing tracked was touched; `tools/truth/` was not written (every track already had its grain tables).
