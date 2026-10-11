# tools/accept/v0.13 — NAV2 "bump with the beat" (DECISIONS §46, docs/AUDIT-v0.13.md)

Tracks from `$MUSIC` (default `~/Music/RetinaRave`), the v0.12 rule: the name with or without its extension.

- **`det13.py <track> <tag>`** — NAV2's `n2info` (mode, c, ρ, q, wind, **bump, pulse**, curl, pitch, swirl, par, gate) + the beat
  (`kick`, `hit`, `beatPhase`, `bass`, `eS`, `onsetRate`) + **`hooks.green()`** (Q, A, L, v, dA) every 2 s for 80 s after key 9
  (`KEY=` for another scene). `det13-syd-{before,after,after2}.txt` are SeeYouDrop through v0.12's NAV2, v0.13's first cut, and v0.13 after the user's look.
- **`nav2-window.py <track>`** — `OUT=<dir> T0=<s> N=<n> [PAUSE=<s>]`: seek the tab to T0, a shot + D line every second; `PAUSE`
  pauses the music for the first seconds (the no-beat proof). `nav2-window-{before,after,after2,paused}.txt` + `montage-nav2-syd-{before,
  after,after2,paused}.jpg` (46–70 s, after2 46–88 s; the paused one 46 s with 8 s paused). `nav2-window-intro.txt` + `montage-nav2-syd-intro.jpg` are 0–60 s on the final build (the intro's beat, the 25 s gate, the drop). `nav2-window-double{-before,}.txt` + `montage-nav2-syd-double{-before,}.jpg` are 92–120 s (double time at 1:38, the energy peak) before and after the fourth pass; `intro2` is 0–60 s on the final build. **Show `intro2` and `double` first.**
- **The other three tracks under v0.13 (2026-09-27)** — `det13-{cn,wltp,mal}-v013.txt` (CyborgNinja / WhoLikesToParty / Malicious, 80 s
  each, the pass-4 build; the D line now also carries `ds` = dropStrength and `arc`), `nav2-window-{cn,wltp}-intro.txt` + `montage-nav2-
  {cn,wltp}-intro.jpg` (0–60 s). Malicious's intro fired the engine's drop three times in 14 s and NAV2 cut every time (18 of its first
  25 s outside) → `DROP_GAP` 32 beats (`exit.js`): `det13-mal-gap.txt`, `nav2-window-mal-intro-gap.txt` + `montage-nav2-mal-intro-gap.jpg`
  after; `det13-syd-gap.txt` is SeeYouDrop on the same build (its two drops are 47 s apart, both stand). `nav2-window-syd-145.txt` +
  `montage-nav2-syd-145.jpg` are 1:40–1:56 with `ds`: the 1:45 drop is a full-strength one (ds 1.0, arc build → peak).
- **Pass 6 (2026-09-27, the user's look at pass 4: "the movement is still too subtle"; "the beat causes the set to collapse into
  interesting shapes, then the silence rebounds to the circle"; "why do different sounds look so similar?"; two frames "too bright")** —
  `montage-nav-syd-35-45.jpg` is NAV (key 0) on 35–45 s, the collapse the user pointed at (beads at the 1/2 root). `press-sweep.mjs <bpm>`
  is the node sweep (a kick per beat with the bass on pitch class 5 → the 1/2 root: the press's peak, the trough, Q, the angle error, the
  silence's rebound). `nav2-window-groove-p6{a,}.txt` + `montage-nav2-syd-groove-p6{a,}.jpg` are 26–50 s (a = before the split luminance
  knees), `nav2-window-double-p6a.txt` + `montage-nav2-syd-double-p6a.jpg` 92–120 s, `nav2-window-syd-145-p6.txt` + `montage-nav2-syd-145-p6.jpg`
  1:40–1:56 (the engine fired no drop at 1:45 in this run, nor in the 92–120 s one — it did in two earlier runs; the drop is the
  engine's, run to run), `nav2-window-syd-58-p6{a,}.txt` + `montage-nav2-syd-58-p6{a,}.jpg` 50–62 s (the 58 s drop: a = the exterior
  knee alone, the final one with `uExtG`). `det13-syd-p6.txt` is the 80 s trace.
- **Pass 7 (2026-09-27, the user's look at pass 6: "still not deforming enough"; "a bit too muted now (looks almost pastel sometimes); I
  like the bright / glowy look, but not so bright that [I] can't see the mandelbrot shapes")** — `nav2-window-groove-p7.txt` +
  `montage-nav2-syd-groove-p7.jpg` (26–50 s), `nav2-window-syd-58-p7{a,}.txt` + `montage-nav2-syd-58-p7{a,}.jpg` (the 58 s drop; a = `EXT_DIM`
  0.6, the final one 0.35), `det13-syd-p7.txt` (80 s). `sat13.py <images>` — the fraction of bright pixels, their mean saturation and
  luminance, and the 95th-percentile luminance (the "pastel" instrument: pass 6's p95 read 0.53 against pass 4's 0.72; pass 7 reads 0.81).
- **Pass 8 (2026-09-27, the user's look at pass 7: "getting closer but still not deforming enough with the music (this is an extreme
  example and pretty much should be deforming on every beat)")** — `nav2-window.py` gained `DT=<ms>` / `SHOT=0` / `MIN=1` (a short D line)
  for beat traces: `nav2-beat-fine.txt` (pass 7, 10 Hz, 27–37 s) and `nav2-beat-fine8.txt` (pass 8a, 10 Hz) — the 10 Hz sampling misses
  a 0.12 s pinch, so **`perbeat13.py`** reads the per-FRAME traces: `nav2-beat-ff8.txt` (pass 8a: V_INT 3.5, BUMP_IV 0.3, PULSE_K 0.3, GRID_K
  0.85), `nav2-beat-ff8b.txt` (+ WIND_P 2, GRID_K 1.0; 27–33 s), `nav2-beat-ff8c.txt` (the same, 1:46–1:52), `nav2-beat-ff8d.txt` (final: +
  BUMP_HOLD 0.4). `nav2-window-groove-p8.txt` + `montage-nav2-syd-groove-p8.jpg` (26–50 s), `nav2-window-syd-58-p8.txt` + `montage-nav2-syd-
  58-p8.jpg`, `det13-syd-p8.txt`. `beat.js` holds the press now (a pure move first, md5 identical).
- **`tab13.py <file> [full]`** — tabulates a det13 trace or a window log (ρ / bump / ival / E / eS / note / kick / hit / drop / ds / arc /
  gate / Q / v per line, and one summary line: modes, ρ and Q min / med / max, v med / max and > 0 count, notes latched, gates, ms).
- `scene-md5-v013.txt` — s8 re-based (twice); the rest of the list is v0.12's (unchanged by `DROP_GAP`: 253b19c4 / 778fb7e2, twice).
- `../../test_green.js`, `../../test_nav2.js` (the kick on every beat, the no-beat circle) — node.
