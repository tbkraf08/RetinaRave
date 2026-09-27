# tools/accept/v0.14 — GIELIS, the superformula nest (id 10; DECISIONS §47, docs/AUDIT-v0.14.md)

Everything here was measured on the merged tree `d4d3540` (2026-09-27). Tracks come from `$MUSIC` (default
`~/Music/RetinaRave`), the v0.12 rule: the name with or without its extension. The scene is **forced-only** — `score()` 0 — so
every run reaches it with `KEY=9,n,n` (key `9` forces id 8, `n` cycles the registry twice to id 10) or with `&scene=10`; the digit
keys stop at 9. **Show the user `montage-gi-syd-groove.jpg` and `montage-gi-syd-break.jpg` first.**

## The md5 references

- **`scene-md5-v014.txt`** — the full eleven-scene list. Lines s0–s7 and s9 equal `../v0.12/scene-md5-v012.txt`, s8 equals
  `../v0.13/scene-md5-v013.txt` (measured before the `waves.js` lift, after it, and after GIELIS's registration — GIELIS moves
  nothing). **s10 = `2c1b21c8` / `2e978a09`** is the v0.14 reference, stable across two runs. The header also records the mixs
  line (`641f6633` here, `f0c9d637` in `tools/accept.sh` — a pre-existing mismatch on this machine, not moved by v0.14) and the
  parity result.
  ```
  IDS=10 tools/scene-md5.sh gi            # the s10 pair alone (what the worker proved)
  tools/scene-md5.sh v014                 # the whole list, ids 0–10
  ```
- **`gielis-still-md5.txt`** — the `&still=1` pair, **`89664dad` / `fe2809bc`**: `hooks.still(1)` pins every music-driven uniform
  at its rest value (n1 at `N1_REST`, no waves, no flash/shimmer, morph 0, the fallback key), so a change that moves this pair has
  moved something it should not have. Set at the worker's step 2 and byte-identical through steps 3–8.
  ```
  CLOCK=1 node tools/cdp.js 'test&scene=10&still=1' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"gi-still-f360"}]'
  ```
- Both are checked by the **`== gielis`** section of `tools/accept.sh`, which also runs `test_gielis`, the pinned kick train
  (`hooks.train('4x4')` → four bumps per ring at gaps of exactly .25) and the continuity monitor over 30 s with GIELIS's `state`
  injected (`viol []`).

## The parity shots

- **`parity-fake.jpg`** — the montage of `ew-t6.jpg` / `ew-t14.jpg` / `ew-t20.jpg` (this checkout) beside `v3-t6.jpg` /
  `v3-t14.jpg` / `v3-t20.jpg` (the v3 reference checkout) at frames 360 / 840 / 1200 on the fake path. Every sampled MS/NAV field
  identical to 1e-9 — GIELIS's registration did not move the feature pipeline.
  ```
  GPU=1 ACC=v0.14 node tools/parity.js fake
  ```

## The SeeYouDrop windows — one shot + one D line every ~1.1 s

The five windows the user chose in the interview. Each `gielis-window-<tag>.txt` holds, per sample, the media element's
`currentTime` and a full GIELIS D line (n1, Q, A, L, m, the loudest pitch class, draw / seg / morph / template, key / mode / hue /
turn / size, the waves live and their positions per band, flash / shim, the MS fields, `ms`, `q`, `errs`), and ends with
`{errs, au, scene}`. Each `gi-<tag>-NN.jpg` is that sample's shot; `montage-gi-<tag>.jpg` is the sheet to show the user.

| window | file | track | shots | what it is for |
|---|---|---|---|---|
| intro | `gielis-window-gi-syd-intro.txt` | 1.4–15.9 s | `gi-syd-intro-00…13` | the weak-kick intro; the grid press carries it. An engine `dropEvt` fires at 9–10 s |
| groove | `gielis-window-gi-syd-groove.txt` | 26.4–69.7 s | `gi-syd-groove-00…39` | the user's 25 s–1:03; the species walk, the section templates, the hue sweep, the 58 s drop |
| breakdown | `gielis-window-gi-syd-break.txt` | 50.4–60.4 s | `gi-syd-break-00…09` | `kick` 0 for six seconds: the hats carry the ripples; then the 58 s drop (`break-07…09`) |
| double time | `gielis-window-gi-syd-double.txt` | 97.4–103.0 s | `gi-syd-double-00…05` | 1:38, the energy peak (`eS` 0.86–0.94); the minor seventh's 36 lobes |
| the 1:45 drop | `gielis-window-gi-syd-drop.txt` | 105.4–113.1 s | `gi-syd-drop-00…07` | **the engine fired no `dropEvt` in this run** (`ds` 0 on all eight) — the breath at high energy |

```
OUT=tools/accept/v0.14 KEY=9,n,n SCENE=10 PORT=8861 T0=25 N=40 TAG=gi-syd-groove python3 tools/accept/v0.13/nav2-window.py SeeYouDrop
#   the other four: T0=0 N=14 TAG=gi-syd-intro · T0=49 N=10 TAG=gi-syd-break · T0=96 N=6 TAG=gi-syd-double · T0=104 N=8 TAG=gi-syd-drop
python3 tools/montage.py tools/accept/v0.14/montage-gi-syd-groove.jpg 8 tools/accept/v0.14/gi-syd-groove-*.jpg
```

## The per-frame traces — the brief's ruler

`DT=16 SHOT=0 MIN=1` gives a short D line per **frame** and no shots: the only instrument that can see a 0.1 s pinch (a 1 s
montage cannot — AUDIT-v0.13 §8). `N=250` is the ceiling: **500 overflows the argv**, and 250 samples is ~5 s, i.e. 12–13 beats.
The realised interval is 19–21 ms, not 16.

| trace | track | beats | Q swing med | swing ≥ 0.15 |
|---|---|---|---|---|
| `gielis-window-gi-syd-groove-trace.txt` | T0 27 | 13 | 0.130 | 1/13 (8 %) |
| `gielis-window-gi-syd-groove-trace2.txt` | T0 33 | 13 | 0.155 | 8/13 (62 %) |
| `gielis-window-gi-syd-break-trace.txt` | T0 50 | 12 | 0.095 | 0/12 (kick 0 — shallower by design) |
| `gielis-window-gi-syd-double-trace.txt` | T0 97 | 12 | 0.157 | 7/12 (58 %) |

```
OUT=tools/accept/v0.14 KEY=9,n,n SCENE=10 PORT=8861 DT=16 SHOT=0 MIN=1 T0=27 N=250 TAG=gi-syd-groove-trace \
  python3 tools/accept/v0.13/nav2-window.py SeeYouDrop
python3 tools/accept/v0.14/perbeat14.py tools/accept/v0.14/gielis-window-gi-syd-groove-trace.txt        # the summary line
python3 tools/accept/v0.14/perbeat14.py tools/accept/v0.14/gielis-window-gi-syd-groove-trace.txt full   # every beat
```

- **`perbeat14.py <trace> [full]`** — the per-beat table of a per-frame GIELIS trace: the n1 trough and peak, the Q swing
  (max − min of the loudest family's Green's Q inside the beat), the share of the beat back at rest, the waves alive, the kick and
  `eS`. Env `SWING=0.15` (the brief's gate) and `REST=0.9`. Beats with fewer than six samples are dropped as partial edges.

## The other two tracks — shown, not tuned

The user has not asked for either; 0–30 s so nothing is a surprise later. `gielis-window-gi-cn-intro.txt` +
`gi-cn-intro-00…29.jpg` + `montage-gi-cn-intro.jpg` (CyborgNinja, 159.8 bpm — a one-note bassline, so four of twelve species in
30 s) and `gielis-window-gi-wltp-intro.txt` + `gi-wltp-intro-00…29.jpg` + `montage-gi-wltp-intro.jpg` (WhoLikesToParty,
116.7 bpm — one stable key, eight loudest pitch classes, all four templates, the deepest pinch of the session).

```
OUT=tools/accept/v0.14 KEY=9,n,n SCENE=10 PORT=8861 T0=0 N=30 TAG=gi-cn-intro python3 tools/accept/v0.13/nav2-window.py CyborgNinja
OUT=tools/accept/v0.14 KEY=9,n,n SCENE=10 PORT=8861 T0=0 N=30 TAG=gi-wltp-intro python3 tools/accept/v0.13/nav2-window.py WhoLikesToParty
```

## The Q trace

`q-house-none.txt` and `q-aba-none.txt` — the director's own picks with **GIELIS not forced** (a bid-0 scene cannot be picked), so
they prove the registration did not move the show or its cost. Still being written at the time of the audit: **see the addendum**.

```
ACC=v0.14 tools/q-trace.sh none house      # and: ACC=v0.14 tools/q-trace.sh none aba
```

## The look instruments (from v0.13, re-used unchanged)

```
python3 tools/lum.py tools/accept/v0.14/gi-syd-groove-0*.jpg              # centre / rim luminance: 0.15–0.31 against 0.009–0.07
python3 tools/accept/v0.13/sat13.py tools/accept/v0.14/gi-syd-break-*.jpg # p95 luminance: 0.14–0.38, 0.49–0.72 on the 58 s drop
```

`../../test_gielis.js` (node: the circle limit, the p/q closure, the star's Q, the GLSL twin's constants, the interval table, the
ruler's cost) and `../../test_torus2.js` (the `waves.js` lift left TORUS2 alone) are the node side.
