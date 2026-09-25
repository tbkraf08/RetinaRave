# Retina Rave v0.7 candidate — TORUS2 in a real window (2026-09-24, §36)

Four headed runs (HARNESS "Real window"), the shape of `AUDIT-v0.4.md`: a real track in its own Chrome window captured through
the landing card's `Share a tab`, the page at 1920 × 1080 native DPR 0.75, the scene forced by key at 6 s, shots at 20 / 40 / 60 /
80 s, `tools/probe.js` per frame. Two tracks × two scenes: **TORUS2 (key `8`) beside TORUS (key `4`) at the same clock times** —
"Who Likes to Party" (Kevin MacLeod, 4:16, ~117 BPM, detected B minor) and "Cyborg Ninja" (~160 BPM, detected minor, key 2 → 7 → 8
as it settles). Raw lines: `tools/accept/v0.7/audit7-headed.txt`; the step list is the session scratchpad's `audit/audit7.sh`.

| what | TORUS2 (WLTP · CN) | TORUS (WLTP · CN) | verdict |
|---|---|---|---|
| capture | `mode capture`, `heard` true by 8 s (hop 752 · 752), bpm 116.8 / 159.8 | same (746 · 751) | ✓ |
| frames in 81 s | **4844 · 4847**, 0 black, 0 > 100 ms, max dt 33 · 17 ms | 4844 · 4845, max dt 17 · 33 | ✓ 60 fps, no long frame from the waves or the advection |
| `q` at 1 Hz | 0.39 → 0.54 (8 s) → 0.59 (20 s) → 0.75 (60 s) → 0.83 (80 s) | **the same digits** | ✓ the controller never saw TORUS2 as dearer |
| engine ms | 1.97 / 1.93 / 1.83 / 1.43 | 2.27 / 1.89 / 1.88 / 1.92 | ✓ unchanged band |
| key → hue | `key 11m` held for the whole of WLTP (keyConf .68–.83); CN moved 2 → 7 → 8 (keyConf .49 → .87) and the picture went pink → blue → green-yellow with it | — | ✓ the anchor follows the key; **but** CN's minor mode read *pink* at 20–40 s (key 7 → anchor near red, the cool pull is 45 % of the short way) — the user decides whether "minor = cool" must win over the anchor |
| the mechanisms (HUD) | `waves 15–24` live, attractor per section `cnn .19 → halvorsen .24 → thomas .21 → aizawa .22`, `turn` 8.53 → 24.07 → 39.52 rad over 40 s at 117 BPM (78 beats = 4.9 turns = 30.6 rad ✓), `size` .69–.75, `slip` .56 in a build, `glow .18` | — | ✓ |
| end | `ERRS []`, `nonFinite []`, `glerr` undefined, 0 `[EXC]` | same | ✓ |

Shots: `tools/accept/v0.7/montage-torus2-real.jpg` (8 rows, TORUS left · TORUS2 right) and `montage-torus2-demo.jpg` (the worker's:
`#test` f360/f840 and house / aba / dnb at 10 / 30 / 50 s). What the eye sees across every row: TORUS2 is lit through the middle
of the nest where TORUS is a dark tangle, it fills more of the frame, and it is a two-or-three-hue picture where TORUS was a
twelve-hue one (the spread narrowed so warm/cool can read — §36, the user has not judged this).

## Verdict

TORUS2 costs nothing the controller can see on real music, never picks itself, and every mechanism the user asked for is
visible in the HUD and the shots. Whether the *look* is right — the wave amplitude, the narrowed palette, the morph gain, and
whether minor must always read cool — is the user's call on `montage-torus2-real.jpg` / `-demo.jpg` and the build (`dist/retinarave.html`,
key `8`). Nothing is replaced until they say so.
