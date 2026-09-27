# tools/accept/v0.13 — NAV2 "bump with the beat" (DECISIONS §46, docs/AUDIT-v0.13.md)

Tracks from `$MUSIC` (default `~/Music/RetinaRave`), the v0.12 rule: the name with or without its extension.

- **`det13.py <track> <tag>`** — NAV2's `n2info` (mode, c, ρ, q, wind, **bump, pulse**, curl, pitch, swirl, par, gate) + the beat
  (`kick`, `hit`, `beatPhase`, `bass`, `eS`, `onsetRate`) + **`hooks.green()`** (Q, A, L, v, dA) every 2 s for 80 s after key 9
  (`KEY=` for another scene). `det13-syd-{before,after}.txt` are SeeYouDrop through v0.12's NAV2 and v0.13's.
- **`nav2-window.py <track>`** — `OUT=<dir> T0=<s> N=<n> [PAUSE=<s>]`: seek the tab to T0, a shot + D line every second; `PAUSE`
  pauses the music for the first seconds (the no-beat proof). `nav2-window-{before,after,paused}.txt` + `montage-nav2-syd-{before,
  after,paused}.jpg` (46–70 s; the paused one 46 s with 8 s paused).
- `scene-md5-v013.txt` — s8 re-based (twice); the rest of the list is v0.12's.
- `../../test_green.js`, `../../test_nav2.js` (the kick on every beat, the no-beat circle) — node.
