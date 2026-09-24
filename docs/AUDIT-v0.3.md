# Eigenwobble v0.3 — the real-window audit (2026-09-23, §26)

The same five checks as `AUDIT-v0.2.md` (§17), on the v0.3 candidate (master at `72b74db`: the linear chain, the v2
colour default with the OKLCH variant, the resume hold, tempo 3:2, `SC.mem` renumber, `post.morph.flow`), in a headed
Chrome on the desktop (`HEADED=1 tools/cdp.js`, HARNESS "Real window"). Raw outputs: `tools/accept/v0.3/audit-{a1,a2,b,b2,b3,b4,c,d}.txt`;
the step lists are in the session scratchpad (`audit/audit.sh`, reproduced in HARNESS "Real window" where they differ from §17).
`GPU=1 tools/accept.sh` before the audit: `accept-26.txt`, 0 FAIL, 0 exceptions; after the §3 fix: `accept-29.txt` (`accept-27.txt`: the new check's verdict grep, not the data; `accept-28.txt`: the drop-rule flake, §3 last lines).

## 1. Size and DPR — FEIGEN at 1920 × 1080, DPR 1.5 and native 0.75, resize, fullscreen (runs A1, A2)

| what | where | number | verdict |
|---|---|---|---|
| canvas at `--window-size=1920,1080 --force-device-scale-factor=1.5` | `#test&scene=6&feig=3.6` | viewport 1708 × 873 CSS → canvas **2560 × 1309** (the cap binds, as §17) | unchanged |
| FEIGEN rung at that size | `rt.log` | **4632 × 1295**, `it500`, `r8 built` at 9 s | as §17 |
| FEIGEN / NAV / DUST, `q` pinned .95, three interleaved triples, n 300, DPR 1.5 window | `CARD.bench` | feig **3.65 / 3.56 / 3.54** · nav **5.98 / 6.06 / 5.88** · dust 1.30 / 1.65 / 0.90 ms → FEIGEN **0.60×** NAV | ≤ 1.5× NAV ✓ (§17: 0.93–1.10× — the colour pass is v0.2's again, the field is the §16 ladder) |
| GL error / shader errors / NaN / `[EXC]` | `getError`, `CARD.ERRS`, `nonFinite()` | 0 · [] · [] · 0 | ✓ |
| GPU process RSS | `ps -o rss` on the gpu process | 198 MB on load → 203 MB after fullscreen (i915 GEM is not in RSS) | flat, as §17 |
| JS heap | `performance.memory` | 11–12 MB | ✓ |
| drag-resize while FEIGEN is on screen | `Browser.setWindowBounds` 1400 × 800 | canvas 1920 × 951, rung re-allocated **4698 × 1276**, first rung `coarse` then refined; probe: **0 black frames**, the size event's frame dt 17 ms | ✓ |
| fullscreen while FEIGEN is on screen | 2560 × 1440 monitor | canvas **2560 × 1439**, rung **4440 × 1351**; probe: **0 black frames, no frame > 100 ms from the transition itself** (§17 had one 83 ms frame; the only long frames in these runs are the synchronous benches, 4–25 s, which also stamp a fake-timeline drop — a harness artefact of benching in the probed page) | ✓ |
| fullscreen bench, DPR 1.5, three triples | | feig **4.46 / 3.77 / 3.75** · nav **22.61 / 22.64 / 22.66** · dust 1.50 / 1.47 / 1.41 ms | FEIGEN 0.17× NAV — see the NAV line below |
| the desktop's native path (DPR 0.75), 1920 × 1080 | run A2 | canvas **1407 × 712**, rung 3671 × 1017; bench feig **1.34 / 1.20 / 1.21** · nav **2.15 / 2.17 / 2.06** · dust 1.64 / 1.26 / 1.44 → FEIGEN 0.58× NAV | ✓ (§17: 0.74×) |
| native fullscreen 2560 × 1439 | | feig **4.67 / 3.74 / 3.77** · nav **5.53 / 5.44 / 5.40** · dust 1.31 / 1.48 / 0.80 → FEIGEN 0.69×, DUST 0.15–0.27× NAV | ✓ |
| **NAV's cost depends on the parameter** | headless CLOCK, `bench(0,200)` at 1280 × 720 along the fake timeline | f480 **1.79** ms (`par` 0, iter 206) · f900 1.65 (iter 246) · f1500 **7.68** (`par` 0.76, iter 264) · f2100 4.07 → a **4.6× swing** with `c`; the 22.6 ms fullscreen figure above is the DPR-1.5 run's bench landing after the fake drop (t ≈ 25–35 s, the walk near a parabolic root, 3.7 Mpx), the native run's 5.4 ms is the same size at t ≈ 18–25 s | not a v0.3 change (the Julia loop is v3's, parity-bound; `Q` absorbs it); **v0.4 candidate**: NAV's iteration budget near |λ| → 1 |
| `Esc` out of fullscreen | | canvas back, rung `coarse` → `built` | ✓ |

## 2. Real audio — `ENGINE.start('capture')`, a real track through the linear chain (run B)

The track: "Who Likes to Party" (Kevin MacLeod, 4:16, ~117 BPM) in **its own Chrome window** (HARNESS "Real window"),
captured through the landing card's `Share a tab` (`CAPTITLE`), Eigenwobble at 1920 × 1080 native DPR 0.75 (canvas
1407 × 670 with the tab-share infobar), 164 s with a 20 s minimize at 120 s. `audit-b.txt` holds the 1 Hz `q` line.

| what | number | verdict |
|---|---|---|
| capture starts | `mode capture`, `heard` true within 8 s (hop 749), the infobar's resize 712 → **670** rows at t ≈ 0.25 | ✓ |
| tempo | `bpm` **116.82** / `bpmSyn` 116.97 at 8 s; 116.88 / 116.93 at 30 s; 116.96 / 116.93 at 120 s; 117.01 at 164 s | ✓ both estimators, no flip |
| `q` at 1 Hz | starts **0.39** (the page-load dip; §17 started at 0.56), 0.54 at 8 s, **0.80 at 72 s, 1.00 at 154 s** and to the end; mean 0.78 over 164 s (§17: 0.90 over 247 s — the climb is the same +0.01 per 2.5 s, the start lower) | ✓ reaches 1.0 with every scene incl. the linear chain |
| frames | **8627** in 164 s with 20 s hidden = 60 fps while visible; **0 black**, **1 frame > 100 ms = the minimize itself** (19 999 ms) | ✓ |
| engine cost | `ENGINE.ms` 2.1–2.5 ms with the worklet (§17: 1.7–1.9) | as measured, plus the desktop's load |
| the chain | `CHAIN.linear` true throughout, `ERRS []`, `nonFinite []`, `glerr` 0, 0 `[EXC]` | ✓ |
| scene switches | **11** in 164 s: 4 fades (`next` first), **7 hard cuts** (surprise cuts — every one on `arc: sustain`, `dropEnv` 0, none a drop: the director sends a drop home to NAV and none went there) → the song's baseline: **one surprise cut per 23 s** | the number §3 is judged against |
| shots | `audit-2-song-{30,80,120}s.jpg` | MANDALA · MANDALA · POLYTOPE on real music |
| end | `mode capture`, hop 15 364, `hist [5, 2, 1]`, `colour {nav: v2, feigen: v2}` | ✓ |

## 3. Hidden — a 20 s minimize on the worklet path, the resume hold (runs B, B2, B3, B4)

| what | where | number | verdict |
|---|---|---|---|
| the first second back (run B, minimize at 120 s) | `back` event + the HARNESS "Hidden tab" read | hidden 20.0 s; hop **11 309 → 13 185** while hidden (94/s: the worklet kept hopping); first frame back dt **68 ms**, then 16.7; lum 6 → 10 (POLYTOPE in a quiet bar, not black); first 60 frames: **0 onsets, 0 surprise, 0 drops, glitch 0, hit 0** | ✓ the §18 hold holds |
| **but 3 s later** | `audit-3-song-back.jpg`, the probe's events | a **hard cut** 5 → 1 at +3.07 s with the composite's glitch rows on screen, no drop, no `next`: a **surprise cut** | suspect — one sample |
| three more minimizes (run B2, at 60 / 119 / 168 s) | `audit-b2.txt` | restores followed by a surprise at **+2.05 s** (cut at +2.07) and **+1.52 s** (mid-fade), the third by nothing for 8 s; with run B: **3 of 4** restores → a surprise cut within 3.1 s against a baseline of one per 23 s (≈ 13 % each by chance) | **a resume artefact, not the song** |
| the mechanism | headless, `&demo=dnb`, the probe's new `sr/su/pr` fields (`MS.surRaw/surprisal/presence` per frame) | after `back` the raw surprisal **ramps 0.10 → 1.51 over 1.1 s** (surprisal 0.76 at 1.2 s, threshold 0.62) then decays by 2.8 s; the demo's own surprise at +3.5 s is in the no-hide control at the same clock time (43.4 s) | the ramp is an input follower settling after the gap while the model's mean lags at 1.5 s; and `va` advanced by `dtF` on the reseed frame collapsed to one stale d² |
| the fix (engine, `features.js`; ENGINE.md "Resume") | headless dnb / house traces, before → after | (1) `va` never advanced by the gap, the reseed frame's error not scored; (2) the band followers `aB/aM/aH/fB` and `slowAnalysis`'s chroma snap with `dtF`; (3) a 2.5 s `settle` window: mean at 0.25 s, no variance learning. dnb raw peak in the first 2.5 s **1.51 → 1.18 → 0.86** (steps 1, 2, 3), surprisal peak **0.76 → 0.35 → 0**; house **0.45**, 0; the demos' own surprise + drop still fire at their control times (dnb +3.2 s, house +3.9 / +4.0 s) | ✓ headless |
| the headed proof, intermediate code (run B3: steps 1 + 2 only) | three minimizes | surprise cuts at **+1.0 s** and **+1.9 s**, the third clean → the real track's inputs settle more slowly than the demos' — step 3 followed | not enough |
| **the headed proof, final code (run B4)** | three minimizes at 60 / 119 / 168 s, `audit-b4.txt` | first second back: nothing fires, all three; 8 s after: restores 1 and 3 **clean** (no surprise, no cut; glitch 0 / 0.27), restore 2 a surprise at **+3.05 s** (after the settle window; cut 2 → 0) — **1 of 3** within 3.1 s against the song's one-per-23 s baseline (0.4 expected), where the shipped code had 3 of 4 at +1.0 … +3.1 s | ✓ the cluster is gone; the remaining cut is at the song's rate |
| **the sweep's own hidden check flaked next** (accept-28: v3's demo `&fake=0`, hidden 15 s at 9 s) | no-hide control ×2, the probe's `bf ab es em bp hs` fields | the demo's own drops are at 2.9 and 18.2 s, none at the 24.4 s where 2 of 3 hidden runs fire one (+1.3 s after `back`); the trace: `eS = eM = 0.24` on the resume frame (the snap is one instantaneous energy), `eS` **0.65** a second later, `eM` 0.43 — the second drop rule's `e > eM + 0.25` gate open for every kick until `eM` has a time constant of data; fired whenever an onset coincided | (4) **both drop rules wait for `settle`** (2.5 s); `absentT` zeroed on the reseed frame → 3 of 3 clean for 8 s; dnb / house own events still at +3.2 / +4.0 s. The headed run B4 preceded step 4 (it tightens only) |
| `parity.js fake` after the fix | | **0 diff** (the fake path never resumes; `dtF = dt` on every other frame) | ✓ |
| `accept.sh` | new "== hidden worklet" line | dnb hidden 20 s at 15 s: 150 frames back, 0 surprise, 0 drops, `srMax` < 1.4 | the regression guard |

## 4. Keys and the help view (run C, demo, 1920 × 1080, native DPR)

| what | number | verdict |
|---|---|---|
| `?` opens, `Esc` closes | `HELP.on` true → false; **107** rows | ✓ |
| formula column | **0 of 107** truncated (`.hinner` 1556 px) | ✓ (§17's fix holds) |
| **the cast line's colour key** | NAV, DRUM (a variant of NAV) and FEIGEN read `colour: v2 (variants: v2, oklch)`; `CARD.colour` `{nav: v2, feigen: v2}` | ✓ the default is v2 on a real page, the variant is named |
| `1`–`7` | forced 0 1 2 3 4 5 6 (key 5 = DRUM) | ✓ |
| `8`, `9` | forced stays 6 | ✓ harmless (ids 7–8 free) |
| `0` | forced −1 | ✓ |
| `f` / `Esc` | fullscreen true (canvas 2560 × 1439) → false (1407 × 712) | ✓ |
| double-click ×2 | fullscreen true → false | ✓ |
| `d`, `h` | HUD `display: block`; help on → off | ✓ |
| end | `ERRS []`, `nonFinite []` | ✓ |

## 5. The bundle from `file://` with capture (run D)

`dist/eigenwobble.html` (59 modules, 410 KB) opened as `file://`; "Cyborg Ninja" (160 BPM) in its own window.

| what | number | verdict |
|---|---|---|
| landing on `file:` | `location.protocol` `file:`, `audit-5-bundle-landing.jpg` | ✓ |
| capture | `mode capture`, heard, hop 561 at 6 s → 3383 at 36 s → 5732 at 60 s | ✓ |
| tempo | `bpm` **159.94** / `bpmSyn` 160.23 at 36 s, 159.85 at 60 s | ✓ |
| help on the bundle | `?` → 107 rows, the cast lines carry the colour key | ✓ |
| 60 s | `ERRS []`, `nonFinite []`, 0 `[EXC]`, `hist [6, 2, 5]`, `colour {nav: v2, feigen: v2}` | ✓ |

## Verdict

Five checks, **one engine bug**, found by the one thing headless never did (a real window minimized on a real track):
the §18 resume hold stopped the spurious drop on the first frames back, but a surprise cut followed the hold in 3 of 4
restores — an input follower settling after the gap while the surprisal model's mean lagged, and a variance tracker
advanced by the gap. Fixed in `features.js` (ENGINE.md "Resume"), proven headless on the demos against no-hide controls
and headed on the track (1 of 3, at the song's own rate), guarded by `accept.sh` "== hidden worklet"; the sweep's older
hidden check then exposed the same class on the drop rules (a snapped `eM` is not a mean for one time constant) — both
rules wait for the 2.5 s settle window now, 3 of 3 clean. Everything else
behaved as the contracts promise: the 2560 cap and the rung sizes as §17, FEIGEN 0.6–0.7× NAV at every size (the v0.2
colour pass is back), no black frame on resize or fullscreen, a real track at `q` 1.0 with the linear chain, both
tempo estimators at 117, the keys, the help with the cast line's new colour key, the bundle from `file://` with capture.
One observation for v0.4 (NEXT-SESSION-PROMPT item 2): NAV's cost swings 4.6× with the parameter (22.6 ms at fullscreen
near a parabolic root) — v3's loop, not a v0.3 change, but the thing `Q` pays for most.

**Correction (v0.5 item 2, 2026-09-24, `docs/workers/nav-iter.md`):** check 1's stated cause — "convergence detection takes the full `uIter` near a parabolic root" — is wrong. At f1500 `cyc.has` is 0 (the beat kick hides the chart while `k > 0.02`), so the shader has **no convergence exit at all** there, and the budget is 420, not 264 (c is inside a period-4 baby: `draw()` multiplies `Q.iter` by 1.6). f2100 — the same baby, the same 420, |λ| as close to 1, but with a chart — costs 2.7 ms against f1500's 6.2–6.7. The cost is *no exit*, not *slow exit*; and the exterior alone at that baby view (~2.55 ms extrapolated to zero iterations) exceeds all of f480, so the f1500/f480 ratio cannot go below ~1.6 by the interior alone. DECISIONS §30.
