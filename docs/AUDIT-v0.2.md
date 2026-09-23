# Eigenwobble v0.2 — the real-window audit (2026-09-23, §17)

Everything before this file was judged in headless Chrome at 1280 × 633/720 on the fake timeline or the demo synth.
This is the engine in a real window on the desktop (`HEADED=1 tools/cdp.js`, HARNESS "Real window"): Intel iGPU
(`00:02.0 a780`), Chrome 153 (`/usr/bin/google-chrome`, its own profile), GNOME at text scaling 0.75 → native
`devicePixelRatio` **0.75**, monitor 2560 × 1440. One line per check: what · where · number · verdict. Shots in
`tools/accept/v0.2/audit-*.jpg`. Harness artefacts found on the way are in HARNESS, not here.

## 1. Size and DPR — FEIGEN at 1920 × 1080, DPR 1.5, resize, fullscreen

| what | where | number | verdict |
|---|---|---|---|
| canvas at `--window-size=1920,1080 --force-device-scale-factor=1.5` | `#test&scene=6&feig=3.6` | viewport 1708 × 873 CSS → canvas **2560 × 1309** (the 2560 cap binds; 3.35 Mpx, 4.1× headless) | as designed |
| FEIGEN rung at that size | `rt.log` | **4632 × 1295** texels (6.0 Mpx: `MAX_TEXELS` binds), `it500`, 7 rows/draw at t3 → 3 slots × 48 MB + quarter = **~150 MB** RGBA16F | as the §16 table predicted (45.8 MB/slot at 1080p) |
| FEIGEN vs NAV, `q` pinned .95, interleaved pairs, n 300 | `CARD.bench` | feig **5.58 / 4.70 / 5.53** ms · nav **5.27 / 5.15 / 5.04** → ratio **0.93–1.10×** | ≤ 1.5× NAV ✓ (both scale with the 4× pixels: 1.2 / 2.0 ms headless) |
| GL error / shader errors / NaN | `gl.getError()`, `CARD.ERRS`, `nonFinite()` | 0 · [] · [] · `[EXC]` 0 | ✓ |
| GPU process RSS (i915 GEM is not in RSS — a floor, not the VRAM figure) | `ps -o rss` on `--type=gpu-process` | 194 MB on load → 194 MB after 30 s at L 4.17 → 199 MB after fullscreen | flat; the ~150 MB of slots live in GEM |
| JS heap | `performance.memory` | 6 MB | ✓ |
| drag-resize while FEIGEN is on screen | `Browser.setWindowBounds` 1400 × 800 | canvas 1920 × 951, rung re-allocated **4698 × 1276**, first rung rebuilt as `coarse` (quarter burst) then refined; `ERRS []`, `getError` 0, no `[EXC]`; probe: **no black frame**, one frame of dt 33 ms | ✓ no stall |
| fullscreen (`F`) while FEIGEN is on screen | 2560 × 1440 monitor | canvas **2560 × 1439**, rung **4440 × 1351**, `built b1351/1351` within 4 s; probe: no black frame, one frame of **83 ms** (three 46 MB allocations + the burst) | ✓ — one long frame, not a stall; lazy allocation not needed |
| `Esc` out of fullscreen | | canvas back to 2560 × 1172, rung `coarse` → refine | ✓ |
| resize on every other scene (probe, mean luminance per 100 ms for 3 s) | `#test`, `forced` 0/1/2/3/5 | NAV / DUST / MANDALA / TORUS / POLYTOPE: **0 black frames**, brightness continuous across the size change | ✓ core `resize()` is clean |
| the desktop's native path (DPR 0.75) | `real`, 1920 × 1080 window | canvas **1407 × 712** (0.77× headless pixels); fullscreen 2560 × 1439 | as designed: the canvas is 1:1 with physical pixels either way |
| native 1407 × 712, `q` pinned .95, pairs of `bench(6/0/1, 300)` | `#test&scene=6&feig=3.6` | feig **1.37 / 1.41 / 1.39** · nav **1.87 / 1.90 / 1.85** · dust 1.78 / 1.28 / 1.75 ms → FEIGEN **0.74×** NAV, DUST 0.7–0.95× | ✓ |
| fullscreen 2560 × 1439, same pairs | `F` | feig **4.28 / 4.26 / 5.81 / 5.05** · nav **8.74 / 8.39 / 5.02 / 5.06** (the first two pairs a load spike — pairs, not triples) · dust **1.40 / 1.11 / 1.20 / 1.09** → FEIGEN 0.5–1.2× NAV, DUST **0.13–0.28×** NAV | ✓ FEIGEN ≤ 1.5× at every size; DUST's cost does not scale with pixels — §14 `stride` stays closed |
| `audit-1-nav-native-1080p.jpg` | NAV, real window | the interior smoulder at `par` > 0 | §15 JULIA stays closed |

## 2. Real audio — `ENGINE.start('capture')`, a full track at 1920 × 1080

The track: "Who Likes to Party" (Kevin MacLeod, archive.org, 4:16, ~117 BPM electronic) playing in **its own Chrome
window** on the other monitor, captured through the landing card's `Share a tab` (`CAPTITLE` auto-picks it with audio).
`tools/accept/v0.2/audit-q-song.txt` holds the 1 Hz `q` line, every switch and the summary.

| what | number | verdict |
|---|---|---|
| capture starts | `mode capture`, 1 audio track, **heard within 6 s** (hop 562), `AU.t0` set; the tab-share infobar shrank the viewport 712 → **670** rows (a real `resize()` at t ≈ 0) | ✓ |
| tempo | `bpm` **116.87**, `bpmSyn` **116.93** at 30 s; 116.83 at 80 s; 116.98 at 245 s | ✓ both estimators agree, no octave flip in 4 min |
| `q` at 1 Hz, whole track | starts **0.56** (the controller's page-load dip), +0.04 per 2.5 s: **0.80 at 58 s, 1.00 at 108 s, 1.00 to the end** (150 s of `q` = 1 with FEIGEN on screen 110–156, 178–194, 200–205, 236 s–); mean **0.90**, min 0.56 | ✓ ≥ 0.8 with every scene incl. FEIGEN; the sub-0.8 minute is the climb, not a scene |
| frames | **14 331** frames in 247 s (58 fps), **0 black**, **0 frames > 100 ms** | ✓ |
| engine cost | `ENGINE.ms` 1.7–1.9 ms with the worklet (0.6 in a quiet passage) | as measured headless (0.8–1.0) plus the desktop's load |
| scene switches | **18** completed switches; every one on `arc: sustain` (one on `build`), `dropEnv` 0, 8 of them `sectionReturn` restores (look memory), none on a drop or a fakeout; no hard cut recorded off a section | ✓ CONTRACTS §1.9: no jump that is not a drop, a section or a surprise (the probe logs `cur` changes, i.e. a fade's end or a cut; hard vs soft is not distinguished — `next` changes would be) |
| end of run | `ERRS []`, `nonFinite []`, `getError` 0, `[EXC]` 0, `mode capture`, `hist [6, 2, 1]`, hop 22 976 | ✓ |
| shots | `audit-2-song-{40,80,120,215}s.jpg` | DUST · MANDALA · POLYTOPE · TORUS on real music |

**Harness artefact, not the engine** (recorded in HARNESS "Real window"): with the music in a same-window tab that was
never shown, Chrome does not start the media, the captured track delivers no frames, the worklet gets zero-channel
input and never hops, and (the tab-picker having focused the shared tab) the page is hidden, so neither the loop nor
the silence watchdog runs. Every "stall" seen before the own-window recipe was this. With a silent tab in its own
window the watchdog swaps the demo in at 6 s as designed (`demo true` at 9 s, hop 845).

## 3. Hidden tab — 30 s away with FEIGEN, DUST, NAV on screen

| what | where | number | verdict |
|---|---|---|---|
| FEIGEN, fake timeline (`#test&scene=6`) | probe `vis`/`back` | hidden 30.1 s; fake source does **not** hop while hidden (hop 603 → 603: it is driven by the rAF loop, by design); first frame back **lum 153**, dt 16.7 from the second frame; `feigL` 0.47 → 1.47 on the first frame (the fake timeline's `now` moved 30 s) and the ladder answered with `standin(-1)` (`RUNG@604`), `blend` 90 draws later, `built` at 723 | ✓ no black, no stale rung, RUNG@ sane |
| DUST, same page (`forced=1`) | | first frame back lum 22.2 → 18.3 over 5 frames, 0 black | ✓ |
| NAV (`forced=0`) | | first frame back lum 20.2, steady, 0 black; `ERRS []`, `getError` 0 | ✓ |
| FEIGEN on the **worklet** path (real capture, window minimized 30 s) | probe | hidden 30.1 s; **hop 1600 → 4422** (2822 = 30 s × 94/s: the engine kept hopping), `flow` 13.06 held while hidden and moved after (per-frame integration, as ENGINE.md says); first frame back **lum 54.9**, dt 35 ms then 16.7; the restore changed the window size by a few px, so the ladder re-allocated (3663 × 961 → 3573 × 914 → back) and answered `r1 coarse` → `built` within 3 s; `ERRS []`, `getError` 0 | ✓ no black, the whole-ring upload path (`delta ≥ 128`) taken silently |
| DUST, worklet path (20 s minimized) | | hop 5287 → 7171; first frames lum 22 → 51 (the exposure re-adapting upward), 0 black | ✓ |
| NAV, worklet path (20 s minimized) | | hop 7927 → 9808; first frames lum 62–65 steady, 0 black, `nonFinite []` | ✓ |
| the one artefact | `audit-3-feigen-back.jpg`, `audit-2-feigen-back-worklet.jpg` | the first frames back carry the composite's **drop glitch rows** (fake: the timeline jumped over DROP@13; real: the v3 followers were frozen for the gap and read the step as a drop); lum decays 155 → 125 over 5 frames | not a black/stale frame — a spurious drop on resume; **v0.3 triage** (a resume hold in the loop, engine-side) |

## 4. Keys and the help view on a real screen (`real`, demo, 1920 × 1080, native DPR)

| what | number | verdict |
|---|---|---|
| `?` opens, `Esc` closes | `HELP.on` true → false | ✓ |
| formula column truncation at 1080p (DECISIONS §12 "Left open") | **47 of 107** rows truncated (cell 224 px, `.hinner` 1236 px); fullscreen 2560 wide: **still 47** (the column was capped at `max-width: 1180px`) | **confirmed at real width → fixed**: `.hf code` wraps (`pre-wrap`, `overflow-wrap: anywhere`), `.hinner` `max-width: min(1500px, 96vw)`; after: **0 of 107** truncated, cell 288 px, tallest cell 63 px (3 lines); `audit-4-help-1080p-wrapped.jpg` |
| `1`–`7` | forced 0 1 2 3 4 5 6 (key 5 = DRUM, `cur` 0 as a variant) | ✓ |
| `8`, `9` (ids 7–8 free) | forced stays 6, `cur` 6 — a no-op | ✓ harmless |
| `0` | forced −1 | ✓ |
| `F` / `Esc` | fullscreen true (canvas 2560 × 1439) → `Esc` closes the help first, a second `Esc` leaves fullscreen | ✓ (browser order) |
| double-click ×2 | fullscreen true → false | ✓ |
| `d` | HUD `display: block` | ✓ |
| end of run | `ERRS []`, `nonFinite []`, `getError` 0, `[EXC]` 0 | ✓ |

## 5. The bundle from `file://` with capture

`dist/eigenwobble.html` (55 modules, 363 KB, rebuilt after the help fix) opened as `file://`, not served; "Cyborg Ninja"
(archive.org, 160 BPM) in its own window.

| what | number | verdict |
|---|---|---|
| landing card on `file:` | `audit-5-bundle-landing.jpg`, `location.protocol` `file:` | ✓ |
| capture | `mode capture`, 1 track, heard, hop 562 at 6 s → 3383 at 36 s → 5743 at 60 s | ✓ |
| tempo | `bpm` **159.95** at 36 s, 159.79 at 60 s | ✓ (the track is 160) |
| help on the bundle | `?` → `HELP.on`, **107** rows, `Esc` closes | ✓ |
| 60 s | `ERRS []`, `nonFinite []`, `getError` 0, `[EXC]` 0, `hist [6, 2, 5]` | ✓ |

## Verdict

Five checks, **no engine bug**. Two real findings, both fixed in the session: the help view's formula column was
truncated at every real width (47/107 rows, a fixed 1180 px column) — it wraps now — and `wave`'s help line described
the wrong object. Three observations for v0.3 (DECISIONS §17 triage): the first frames back from a hidden tab carry
the composite's drop rows because the extractor's followers were frozen for the gap; DUST sits under mean luminance
2/255 for stretches of the fake timeline's quiet valley at real size (its look, noted); the probe cannot tell a hard
cut from a fade's end (`next` changes would). Everything else headless never saw — 2560 × 1309 targets with three
48 MB rung slots, the fullscreen re-allocation (one 83 ms frame), resizes on every scene, the tab-share infobar's
resize, 30 s hidden on both the fake and the worklet path, a 4-minute real track at `q` 1.0, the keys, the bundle
from `file://` with capture — behaved as the contracts promise. `GPU=1 tools/accept.sh` after the fixes:
`accept/v0.2/accept-17.txt`.
