# v0.11 acceptance — MAXWELL (id 9) after the user's first look

Two passes live in this folder. The **before** files were shot on the v0.10 tree (`57f3f2e`) while the scaffold was written; the
**after** files were shot by the orchestrator on the merged v0.11 tree (`64adee4`) on 2026-09-26 at `PORT=8810 GPU=1`, one Chrome at a
time. Worker report: `docs/workers/maxwell-wobble.md`. Audit: `docs/AUDIT-v0.11.md`. Plan: `MAXWELL-WOBBLE-SESSION-PROMPT.md`.

## Scripts

- **`audit11.sh <track> <tag>`** — v0.10's real-window recipe (key `9` then `n`, tab capture, 90 s) plus a **paused start**: right after
  the keys land, `evalTab` pauses the media tab, waits 8 s, shoots `<tag>-paused8s` with a `TPAUSE` STAT eval, waits 2 s more (10 s
  paused), `.play()`s, then the 20/40/60/80 s shots exactly as v0.10. `evalTab` needs no `{"activate":…}` around it (see the header).
  Prints `T8`/`TPAUSE`/`T20`…`T80` STAT lines, `LONG`, `Q1HZ`, `END`. Note: the script pipes through `cut -c1-1500`, so the `LONG` line
  is **truncated** when a run has hundreds of black frames — read the black/long counters in the STAT lines instead.
- **`det11.py <track> <tag>`** — the 2 s / 80 s detector trace. v0.10's `det10.py` plus `sub`/`bassFast`/`centroid`/`dirty`/`punchy`/
  `presence`/`alive`/`absentT` from `CARD.MS` (null-guarded), the lit chroma sectors, the **same paused start** as `audit11.sh` (its D
  line is preceded by the marker `PAUSED8S`), and a **dominant-hue read** built from the worker's `hooks.mxcol()`: `dom` (the w-weighted
  circular mean palette hue along the +x ray beyond r = 8 field cells), `exphue` (the chroma-weighted circular mean of all twelve
  sectors' hues), `tophue` (the strongest chroma bin) and `dhue`. **Caveat measured on the 2026-09-26 runs and written into the script's
  header:** on real music the chroma vector is flat and the twelve hues are symmetric about the anchor, so `exphue` collapses onto the
  anchor and `dhue` only asks "is the wave the anchor's colour". Read `dom`'s own spread instead; the clean per-note proof is the
  worker's pinned `hooks.mxchroma("k")` one. Do **not** pipe this script into `head` — the SIGPIPE kills the run mid-trace.

## Reference

- **`scene-md5-v011.txt`** — the v0.11 CLOCK=1 scene-md5 list. s9 = `d268a071…` / `473e474c…`, **measured on the merged tree and equal to
  the worker's report**; s0–s8 carried from the v0.10 list (only `assets/scenes/maxwell/` was touched, so they were not re-shot).
- **`scene-md5-v011-before.txt`** — the same two lines on the v0.10 tree (`4e26a427…` / `57bac88e…`), shot before the worker started.
- **`headed-v011.txt`** — every line of the six headed runs: `audit11.sh` then `det11.py` for `mx2-cn` (CyborgNinja), `mx2-wltp`
  (WhoLikesToParty) and `mx2-mal` (Malicious, a Kevin MacLeod 140 BPM CC-BY track standing in for dubstep — it is **not** dubstep and has
  no wobble bass). 0 long frames, ERRS `[]`, nonFinite `[]`, `probe().gap` 0 on all 120 detector samples, q .39 → .87 on all three.

## Shots — the v0.10 tree ("before")

- `v011-before-s9-f360.jpg` / `-f840.jpg` — the scene-md5 pair on v0.10: a green/magenta ring field with faint white contours threading
  the crests and loose loops running off into the corners.
- `before-{house,aba,dnb}-t{6,14}.jpg` — the three demo synths at 6 s and 14 s on v0.10: a hard **two-hue** disc (green on magenta,
  blue on gold, lime on violet) with contour scribble in all four corners.
- `before-test-f360.jpg` / `-f840.jpg` — `CLOCK=1 test&scene=9` on v0.10, identical md5 to the scene-md5 pair (confirms the fake-timeline
  recipe reproduces the deterministic reference); f840 also shows `#test`'s diagonal HUD watermark bands.

## Shots — the merged v0.11 tree ("after")

- `v011-after-s9-f360.jpg` / `-f840.jpg` — the v0.11 scene-md5 pair (copied from `tools/work/v0.11-s9-f*.jpg`).
- `after-{house,aba,dnb}-t{6,14}.jpg` — the same six demo frames re-shot on v0.11 (`test&fake=0&demo=<style>&scene=9`, ERRS `[]`,
  q .47–.55): clean black corners, a soft-edged porthole, pale cream shells whose colour varies around and along the ring.
- `mx2-{cn,wltp,mal}-{20,40,60,80}s.jpg` — the real-track clock shots from `audit11.sh`.
- `mx2-{cn,wltp,mal}-paused8s.jpg` — **the item-1 proof in a picture**: the same scene 8 s after the media tab was paused. CN and WLTP
  keep one hair-thin violet arc (the porthole/medium boundary) on black; Malicious is pure black with a barely-visible circular edge.
  Not one of the twelve charges is lit and not one contour is drawn; `energy` 0.002 / 0.021 / 0.000034 and `segs`/`drawn` 0.
- `no-v010-reference.jpg` — a flat placeholder tile. `Malicious` has no v0.10 row (`git worktree` is refused in this repo, so the v0.10
  tree was never checked out to shoot one); this fills the left half of that montage row and labels itself.

## Montages

- **`montage-maxwell2-real.jpg`** (orchestrator, 8 cols × 3 rows) — one row per real track, v0.10's four clock shots left · v0.11's four
  right; Malicious's left half is the placeholder. v0.10: saturated two-tone discs with loose contour loops outside them. v0.11: a clean
  round porthole with **twelve distinct coloured beads on the rim** (green, gold, magenta, pink, orange in one frame) around a
  white-silver spiral core; big bright spirals at 40 s and 60 s, dim and small at 20 s and 80 s. The corner scribble is gone everywhere.
- **`montage-maxwell2-demo.jpg`** (orchestrator, 4 cols × 3 rows) — house / aba / dnb, `before-<style>-t{6,14}` left · `after-…` right.
  The clearest picture of the release: a hard two-hue disc with corner scribble becomes a soft-edged porthole of pale cream shells,
  many-coloured around the ring (house magenta with a gold sector low-right; aba cream through cyan to magenta and green; dnb cream and
  yellow with pink at the rim). Also visibly **paler and lower-contrast** than v0.10 — that is `TROUGH` 0.35.
- **`montage-maxwell2-paused.jpg`** (orchestrator, 2 cols × 3 rows) — each track's `-paused8s` shot beside its 20 s shot. Left column
  black, right column twelve lit beads in six or seven hues around a bright core. **The montage to show the user first.**
- **`montage-maxwell2.jpg`** (worker) — v0.10 left · v0.11 right at f360 and f840, plus the silence pair. Top: a blue/gold concentric
  ring disc becomes a blue-white spiral rimmed in magenta, green and gold. Middle (f840, the drop): blue/gold standing pattern becomes
  magenta, orange, lime and blue-white quadrants — unmistakably *many* colours, and the contour scribble outside the disc is gone.
  Bottom: `mx2-i1-q-f360` and `mx2-fin-q-f360`, both a black disc inside a dim amber rim — silence, on the item-1 tree and on the final one.
- **`montage-maxwell2-colour.jpg`** (worker) — one sector lit, two sectors a tritone apart, a key change, and the three house frames.
- **`montage-maxwell2-wobble.jpg`** (worker) — the `hooks.wob(2)` pair (`wobhi` bright with a hard core and tight rings; `woblo` fifteen
  frames later, dim and broad with the core gone), the `dirty` pair (every band splitting into a fat one and a thin one) and the
  `timbre` pair (wide slow bands at centroid 0.3, fine dense ripple at 0.7).

## Drafts for the orchestrator

- **DECISIONS §43** — drafted here as `DECISIONS-43-draft.md`, then merged into `docs/DECISIONS.md` and the draft removed: what the worker changed against the plan and
  why, the numbers, the ranked leans, the docs owed.

## Numbers, in one place

```
md5  s9 f360 d268a0711df4cfb93880572ffcde972d   f840 473e474cd5992eda5d1a2179818a6b9c   (= the worker's, exactly)
bench (two pages, 7 NAV-interleaved pairs each, cold pair dropped, median of ratios, PORT 8810 GPU=1, tier 3)
      MAXWELL 1.969 ms / NAV 1.559 -> 1.230        TORUS2 1.914 / NAV 1.508 -> 1.216        1.01x TORUS2   gate <= 1.5x
      (worker's own tree read 1.24x; early pair here 1.35x, late 1.17x — the NAV drift both reports warn about)
static  check.js 0 fail / 3 warn (maxwell index.js 498 lines, 2 under the hard cap) · param-smoke 49/0 · test_fdtd OK (incl. group 5)
paused vs playing energy   CN 0.002269 / 2885    WLTP 0.021039 / 1808    MAL 0.000034 / 2729     segs = drawn = 0 in all three
black frames   291 / 202 / 392, every one inside the paused window (the counter is identical at 20, 40, 60 and 80 s)
thumb   site/thumbs/maxwell.jpg re-shot (tools/thumbs.sh "9:360"): be726d74 -> 12de063b
```
