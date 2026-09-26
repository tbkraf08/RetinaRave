# v0.12 acceptance — MAXWELL (id 9) "every sound a wave"

The **before** rows of every montage are v0.11's own accept shots (`tools/accept/v0.11/after-*`, `mx2-*`, `v011-after-s9-*`); the
**after** files were shot by the worker on its tree (`mx3-*`, copied from its `tools/work/`) or by the orchestrator on the merged v0.12
tree (`11f264b`) on 2026-09-26 at `PORT=8810 GPU=1`, one Chrome at a time. Worker report: `docs/workers/maxwell-onset.md`. Audit:
`docs/AUDIT-v0.12.md`. Plan: `MAXWELL-ONSET-SESSION-PROMPT.md`. Brief: `docs/workers/brief-maxwell-onset.md`.

## Scripts

- **`audit12.sh <track> <tag>`** — v0.11's `audit11.sh` with `OUT`/the scratchpad moved: key `9` then `n`, tab capture, the paused start
  (10 s paused right after the keys land, `<tag>-paused8s` + `TPAUSE`), then the 20/40/60/80 s shots and STAT lines, `LONG`, `Q1HZ`, `END`.
- **`det12.py <track> <tag>`** — the 2 s / 80 s trace, v0.11's D line plus the launches: `lau` (`hooks.launches()`: `n`, `perBand`, the
  last four), `dn`/`dpb` (launches since the previous line, total and per band), `onsets` (= `onsetRate` × 2), `lr` = `dn/onsets`,
  `kickhue` (the newest kick's hue = the bass note at that kick), `dkick` (circular distance, turns, between the plane's dominant hue
  `dom` and `kickhue`), `bk`/`bhue`/`dbass` (the same against `argmax(bchroma)` now — the worker fixed `bhue` to index the sector by
  the pitch class's place on the circle of fifths), `medium` (the geometry in force; `2` must never appear). The paused-window D line
  follows the `PAUSED8S` marker. Do **not** pipe this script into `head` (SIGPIPE kills the run).
  **Read `dpb`, not `lr`:** the scene launches per band (a kick + a hat in one frame are two launches) while the engine's `onsetRate`
  counts one onset per frame for the whole stack, so `lr` sits at 3–4 by construction (the worker's friction 6) — the plan's 30 % gate
  was arithmetic that cannot hold, not a failure of the scene.

## Reference

- **`scene-md5-v012.txt`** — the v0.12 CLOCK=1 list. s9 = `4ad6d2ea…` / `4c2ab3c8…`, **measured on the merged tree and equal to the
  worker's report**; s0–s8 carried from v0.11's list (only `assets/scenes/maxwell/` was touched).
- **`headed-v012.txt`** — every line of the six headed runs (`audit12.sh` then `det12.py` for `mx3-cn`, `mx3-wltp`, `mx3-mal`).
- **`release-file-9n.jpg`** — the release bundle opened from `file://`, keys `9` then `n`.

## Shots

- `v011-off-f360.jpg` / `mx3-a-off-f360.jpg` — **item A in one pair**: `hooks.train('off')` with the music playing, v0.11 (a blue spiral —
  the carrier) vs v0.12 (black inside the rim, twelve glows). `mx3-a-f360` / `-f840` the plain `#test` frames after item A.
- `mx3-c-med{0,1,2,3}-f360.jpg` — the four `hooks.medium(k)` pins on `train('4')`: lens, mirror cavity, **empty space** (2 is no longer a
  lattice), waveguide (rails; hook-only, out of rotation).
- `mx3-b-train4-f360.jpg` / `mx3-b-train8-f360.jpg` — four and eight launches a beat (double time), spacing ratio 0.4999.
- `mx3-b-mxchroma3-f360.jpg` — sector 3 pinned: every launch and the plane in one hue (0.0018 turns off the target).
- `mx3-b-{house,aba,dnb}-t{6,14}.jpg` — the demo synths on v0.12 (their v0.11 twins are `../v0.11/after-*`).
- `v012-after-s9-f{360,840}.jpg` — the md5 pair (f840 is now the cavity; on v0.11 it was the waveguide, which left rotation).
- `mx3-{cn,wltp,mal}-{paused8s,20s,40s,60s,80s}.jpg` — the real-track clock shots from `audit12.sh`.

## Montages

- **`montage-maxwell3-paused.jpg`** — each track's `-paused8s` beside its 20 s shot. **Show this first.** Left column pure black (not even a
  rim); right column the twelve glows and a few small shells.
- **`montage-maxwell3-demo.jpg`** (4 × 3) — house / aba / dnb, v0.11 `after-*` left · v0.12 `mx3-b-*` right.
- **`montage-maxwell3-real.jpg`** (8 × 3) — CyborgNinja / WhoLikesToParty / Malicious, v0.11 four left · v0.12 four right.
- **`montage-maxwell3-media.jpg`** — lens · cavity · waveguide · empty space.
- **`montage-maxwell3.jpg`** (2 × 3) — the CLOCK=1 md5 pair v0.11 left · v0.12 right, and the `train('off')` pair.
- Worker's: `mx3-montage-{demo,clock,media,quiet}.jpg`.
