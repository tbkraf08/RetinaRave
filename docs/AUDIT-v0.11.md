# AUDIT v0.11 — MAXWELL after the user's first look (2026-09-26, orchestrator; DECISIONS §43, worker report `docs/workers/maxwell-wobble.md`)

**What was asked (the user, verbatim, after looking at v0.10 on 2026-09-26):**
> 1) it feels too noisy when there is no sound ; 2) the color of the wave should match the color associated with the coord/note (it seems
> to just be two colors that switches sometimes?) ; 3) the waves don't wobble like I was expecting listening to dubstep (different music
> kinda looked similar)

Three sentences, three items, **modified in place on id 9** — no new scene, still forced-only (bid 0, key `9` then `n`). Gate as v0.10:
no `accept.sh` sweep, proof on id 9 only, v0.2 look default. One opus worker (`MAXWELL-WOBBLE-SESSION-PROMPT.md`, four commits merged at
`64adee4`); this document is the orchestrator's verification of that tree. **The user has not looked at v0.11.**

## Headline

All three items shipped. Item 1 is **emphatic and measured on real music for the first time** — with the track paused the picture is
literally black (energy 2e-3 … 2e-5 against 1.8e3 … 2.9e3 playing, zero contour segments, zero lit charges). Item 2 shipped as plan A (a
second, coarser wave equation carrying rgb and a weight `w`, hue = rgb/w) and proves to **0.0018 turns** under a pinned sector; on real
music the wave is no longer anchor-coloured, but a per-note agreement **cannot be measured** on real chroma and is not claimed (below).
Item 3 shipped as an **amplitude** wobble, not a wavelength wobble, because a uniform breath of ε cannot bunch a wave already in flight —
the worker measured 4 % of crest-spacing movement against a 12 % gate and changed the mechanism. The plan's "different music must look
different" gate (≥ 20 % mean carrier spacing between demo styles) is **not met and cannot be**: the three demo synths share a spectral
centroid to 4 %. What separates them is `dirty`, `sub` and `punchy`, which is visible in the montage but is not the thing the plan named.

## The md5 reference

```
IDS=9 PORT=8810 tools/scene-md5.sh v0.11      (GPU=1, CLOCK=1, merged tree 64adee4)
scene 9 errs [] hop 840 row 72
d268a0711df4cfb93880572ffcde972d  s9-f360.jpg     (v0.10: 4e26a427…)
473e474cd5992eda5d1a2179818a6b9c  s9-f840.jpg     (v0.10: 57bac88e…)
```

**Both equal the worker's report exactly** — the merge changed no pixel. Full list: `tools/accept/v0.11/scene-md5-v011.txt` (s0–s8
carried from the v0.10 list unchanged; only `assets/scenes/maxwell/` was touched, so by HARNESS "What to re-prove" they were not re-shot).

## Item 1 — "too noisy when there is no sound"

**What changed:** `presence` gates every source (`charge.from` × presence, the `harmAngle` `W12` fallback × presence, `GAFL` 0.10 ×
presence, `FAINT` only while `alive`, `DIPR` × presence); `ring.from` × `1 − SIL(absentT, presence)` over `VACT` 1.0 → 2.0 s; `FLOOR`
0.010 → 0.005; the contour levels got an absolute floor (`ASCALE` 0.55, `AFLOOR` 1e-6 → 2e-3); **and the strokes got the plane's own
porthole** — `PORTW`/`PORTE`/`portFade` are now shared between the shader and `strokes()`, so a segment outside the disc is not emitted.
That last one is the single biggest part of "noisy" and the plan only half-named it: in v0.10 the plane faded to black on a disc and the
contours did not, so the near-empty corners were stroked over the black. 64 of 994 segments at f360, **1315 of 3480 at f840**.

**Worker's proof** (tier 1, CLOCK=1, `quiet=1` pin): lum centre 0.3804 → 0.0039 (1.0 %), segs 994 → 0, energy 693.79 → 0. Gates were
15 / 10 / 5 %.

**Orchestrator's headed proof (new — the paused start in `audit11.sh` / `det11.py`):** the media tab is paused for 10 s right after the
keys land, then resumed.

| track | paused: energy | segs / drawn | probe centre / rim | playing: energy median | paused ÷ playing |
|---|---|---|---|---|---|
| CyborgNinja | 0.002269 | 0 / 0 | 0.00154 / 0.00157 | 2885 | 7.9e-7 |
| WhoLikesToParty | 0.021039 | 0 / 0 | 0.00299 / 0.00298 | 1808 | 1.2e-5 |
| Malicious | 0.000034 | 0 / 0 | 0.00207 / 0.00208 | 2729 | 1.2e-8 |

`presence` 0, `alive` 0, `absentT` 1.65 / 1.78 / 4.02 at the shot. **PROBE counted 291 / 202 / 392 black frames in each run and every one
of them is inside the paused window** (the counter is identical at the 20 s, 40 s, 60 s and 80 s checkpoints — 0 black frames in the 72 s
of play). The three `-paused8s` shots are below.

## Item 2 — "the colour of the wave should match the note"

**What changed:** a second, half-resolution wave equation (`assets/scenes/maxwell/colour.js`, `GRIDC` = exactly half the field's grid)
carries `rgb` and a non-negative weight `w` with the same sources; the hue is `rgb/w` after a `min(rgb, w)` projection (the one line not
in the plan, and without which "chromaticity" reaches 2950 where the Green's function is negative). The sign of Ez became brightness,
`TROUGH` 0.35. `CHUE0` 0.0 (the key anchor no longer rotates the wheel — it shifts the whole wheel, which is what made a note change
colour with the key), `CSPREAD` 1.6 (v0.10's spacing is `CSPREAD` 1), `FGAIN` 3.4 → 6.0 to pay for the trough dimming.

**Worker's proof:** `mxchroma("3")`, one sector lit — worst hue error **0.0018 turns**, min saturation 0.983 (gate 0.04 / 0.5).
`mxchroma("3,9")`, a tritone apart — foot 3 0.8722 (own 0.8663), foot 9 0.1236 (own 0.1337), their midpoint 0.0000 = the exact circular
midpoint. `key("0,0")` vs `("7,1")` — the anchor moves 0.0090 → 0.2933 and the twelve note hues are **identical to four decimals**. The
colour front tracks Ez's to about an eighth of a ring spacing.

**Orchestrator's headed read (new — `hooks.mxcol()` pulled into `det11.py` as `dom`):** the w-weighted circular mean palette hue of the
colour field along the +x ray beyond r = 8 cells, every 2 s.

| track | mean \|dom − anchor\| | half the 12-sector span | dom concentration | dom outside the sector arc |
|---|---|---|---|---|
| CyborgNinja | 0.254 turns | 0.238 | 0.901 | 24/39 (62 %) |
| WhoLikesToParty | 0.252 | 0.186 | 0.692 | 22/39 (56 %) |
| Malicious | 0.153 | 0.152 | 0.991 | 13/39 (33 %) |

**What this says:** the wave is no longer anchor-coloured — `dom` sweeps most of the wheel (0.07…0.96 on CN) and sits on average a whole
half-span away from the anchor. That is the v0.10 failure mode gone.

**What this does not say, bluntly:** it is **not** a proof that the wave carries the right note's colour on real music, and this audit
does not claim one. Three reasons, all measured: (a) real chroma is flat — no bin clears 0.3 in 37 of 39 CyborgNinja samples, so
"the note that is sounding" has no referent; (b) the twelve hues are laid out symmetrically about the anchor, so a chroma-weighted mean
of all twelve collapses **onto the anchor** (measured `exphue` sits at 0.93–1.00 every single sample on all three tracks) and the
resulting agreement number is at chance (median 0.25 / 0.26 / 0.16 turns; lags of 2, 4 and 6 s do not improve it); (c) a third to
two-thirds of the `dom` samples land on a hue **no sector owns**, which is what a w-weighted mixture of several notes plus a near-white
chromaticity does to `hueFit`. The worker's pinned-sector measurement remains the only clean one. If the user's eye says "still not the
note's colour", the instrument to build is a pinned-chroma *real-track* hook, not a bigger `CSPREAD`.

## Item 3 — "the waves don't wobble; different music looked similar"

**What changed:** the carrier is the **timbre** (`lam = LAM0 · 2^(−CENTK(centroid − CENT0))`, `CENT0` 0.45 `CENTK` 2.5; `bpm` no longer
sets the wavelength at all and `regularity` left `feats`); `dirty` adds a **cosine** second harmonic (`DIRTK` 1.8 — `sin t + a sin 2t`
has the same two extrema a sine has and drew no second ripple; `sin t + a cos 2t` has four once a > 1/4); the bass pumps the centre
(`SUBK` 0.004 → 0.030, the kick's pulse × `(0.6 + 0.8 punchy)`); the lens flexes on each pump; and the wobble is `sub` against a 0.6 s ema
of itself, which breathes the medium (`WOBK` 0.6, clamped `[0.70, 1.60]` for Courant) **and takes `WOBA` 0.85 of the carrier's amplitude**.

**Where the plan died:** a spatially uniform ε(t) leaves a plane wave an eigenmode with **k unchanged**, so the wavelength of a wave
already in flight is frozen — measured, the crest spacing moved **4 %** against the 12 % gate. And at an LFO rate it could not be resolved
anyway: light crosses the porthole in ~1.5 s and one 2 Hz cycle is 36 cells of travel, so a wavelength chirp has one crest per period.
What a wobbling bass does to a spectrum is pump the **level**, so that is what the scene draws. Worker's `hooks.wob(2)` series at tier 1,
CLOCK=1: energy 356.8 → 495.9 over a clean 30-frame period, **39 % peak-to-trough**, peaks one cycle apart agreeing to 2 %.

**The 20 % demo-style gate is not met and cannot be:** house / aba / dnb have mean spectral centroid 0.485 / 0.459 / 0.459, so their mean
carrier is the same to 4 %. What separates them is `dirty` (3.0× aba↔dnb), `sub` (10× — aba's wobble swings ε 0.89…1.49 against dnb's
0.83…1.06) and `punchy` (1.6×). Within a style the carrier does move: house's centroid ran 0.37 → 0.77 across the 20 s window, i.e. `lam`
42.3 → 19.2 cells, a factor of **2.2**.

**Orchestrator's headed read, and its limit:** `Malicious` (Kevin MacLeod, 140 BPM, CC-BY) was used as the **dubstep stand-in** — no
dubstep mp3 was supplied. It is not dubstep and has no wobble bass, so this is not a test of the user's 3. Worse, **the 2 s trace cadence
cannot resolve a wobble at all**: Nyquist is 0.25 Hz against an LFO at 1–4 Hz, so the per-2 s series is aliased by construction. What it
does show, on the merged tree with real audio:

| track | sub range | centroid | dirty | punchy | crest gap median (sd) | energy sd/mean | corr(energy, sub) |
|---|---|---|---|---|---|---|---|
| CyborgNinja (160 bpm) | 0.24–1.00 | 0.51–0.63 | 0.97–1.00 | 0.13–0.25 | 20.5 (5.9) | 0.53 | +0.05 |
| WhoLikesToParty (117) | 0.13–1.00 | 0.51–0.80 | 0.84–1.00 | 0.24–0.64 | 19.7 (3.4) | 0.54 | +0.16 |
| Malicious (140) | 0.11–0.98 | 0.37–0.60 | 0.38–0.76 | 0.23–0.42 | 23.5 (3.7) | 0.38 | +0.31 |

Malicious's per-2 s energy series — `688 3665 2677 714 2975 2351 1037 2340 4342 4159 4170 4141 739 1630 2386 2515 2863 1984 1979 2553
1764 3073 1457 1483 3391 2340 2726 2723 3015 3757 4976 2968 3329 3658 3054 2729 3108 3836 3309` — has **no visible periodicity**, as
expected from the aliasing, and its spacing series (17–34 cells) has no periodicity either. The three tracks **do** separate on the three
new fields: Malicious has half the `dirty` and the widest `centroid` swing, and it is the one whose energy tracks `sub` (+0.31). **The
wobble itself is proven only by the worker's CLOCK=1 `hooks.wob(2)` series, not by any real-track measurement in this audit.**

## The runs (`tools/accept/v0.11/headed-v011.txt`, `audit11.sh` + `det11.py`, PORT 8810, GPU=1, tab capture, key `9` then `n`)

| track | bpm | key | frames | black | long | errs | nonFinite | q at 20/40/60/80 s |
|---|---|---|---|---|---|---|---|---|
| CyborgNinja | 159.4 → 160.0 | 7m → 8m (keyConf .46 → .91) | 5388 | 291 (all in the paused window) | 0 | [] | [] | .63 .71 .79 .87 |
| WhoLikesToParty | 116.9 | 11m (keyConf .68 – .92) | 5387 | 202 (idem) | 0 | [] | [] | .63 .71 .79 .87 |
| Malicious | 140.0 | 7M → 0m → 7m (keyConf .62 – .88) | 5385 | 392 (idem) | 0 | [] | [] | .63 .71 .79 .87 |

`probe().gap` **0 on every one of the 120 detector samples**; `drawn` runs 0 (silence) to ~2500 and is a third under `segs` on a wide
frame (the porthole cull); `energy` finite everywhere. `q` climbs .39 → .87 across every run — much healthier than v0.10's .10 → .34,
which the v0.10 audit had already attributed to the machine and the capture start rather than the scene.

## Cost

Two-page protocol (`docs/workers/maxwell.md` "Bench": q pinned .95 by `setInterval`, 10 s settling, `bench(id,300)` interleaved with
`bench(0,300)`, seven pairs a page, cold pair dropped, median of the NAV-normalised ratios), re-run by the orchestrator on the merged
tree at PORT 8810, GPU=1, tier 3 confirmed in `mxinfo()`:

```
                    scene ms   NAV ms   ratio (median of 6)
MAXWELL (page 1)      1.969     1.559       1.230
TORUS2  (page 2)      1.914     1.508       1.216
                                MAXWELL vs TORUS2 = 1.01x      gate <= 1.5x
```

The worker measured **1.24×** on its own tree; the orchestrator measures **1.01×** on the merged tree. Both are comfortably inside the
gate and the difference is the same NAV drift both reports warn about (this run's early pair says 1.35×, the late pair 1.17×). Take the
number as "MAXWELL and TORUS2 now cost about the same, somewhere between 1.0× and 1.35×".

Static gates re-run on the merged tree: `check.js` 96 modules · 9 scenes · help.feats gaps 0 · **0 fail, 3 warn** (soft 350-line cap:
feigen 352, nav2 393, maxwell **498** — two lines under the 500 hard cap); `param-smoke` 49 checks 0 fail; `test_fdtd` **OK** including
the new group 5 (the colour field's 64×64 twin: energy bounded, rgb/w inside [0, 1.000000]).

## What the eye sees

**`montage-maxwell2-demo.jpg`** (house / aba / dnb rows; `before-<style>-t{6,14}` = the v0.10 tree left, fresh v0.11 shots right) — the
clearest picture of the whole release. Left: a hard **two-hue** disc (green on magenta, blue on gold, lime on violet) with contour
scribble spilling into all four corners. Right: the corners are **clean black**, the porthole is a soft-edged disc, and the rings are
pale cream shells whose colour now **varies around and along the ring** — house magenta with a gold sector low-right, aba cream through
cyan to magenta and green, dnb cream and yellow with pink at the rim. The crest/trough alternation (`TROUGH` 0.35) reads as embossed
shells rather than painted bands. It is unmistakably many colours, and it is also noticeably **paler and lower-contrast** than v0.10.

**`montage-maxwell2-real.jpg`** (CyborgNinja / WhoLikesToParty / Malicious rows, 20 · 40 · 60 · 80 s; v0.10 four left, v0.11 four right;
Malicious has no v0.10 row — `git worktree` is refused in this repo, so no v0.10-tree shots were taken and the left half of that row is a
flat placeholder) — v0.10's tiles are saturated two-tone discs with loose contour loops outside them; v0.11's are a clean round porthole
with **twelve distinct coloured beads on the rim** (green, gold, magenta, pink, orange all in one frame) around a white-silver spiral
core. At 40 s and 60 s the v0.11 field is a big bright spiral; at 20 s and 80 s it is dim and small, with the rim beads carrying the frame.
The corner scribble is gone in every tile.

**`montage-maxwell2-paused.jpg`** (the three `-paused8s` shots beside the same tracks' 20 s shots) — the left column is black. CyborgNinja
and WhoLikesToParty keep one hair-thin violet arc, the porthole/medium boundary, and nothing else; Malicious is pure black with only a
barely-visible circular edge and a faint diagonal moiré low-left. **Not one of the twelve charges is lit and not one contour is drawn.**
The right column is the same scene three seconds after `.play()`: twelve lit beads in six or seven different hues on the rim, a bright
core, a dim wash inside. Silence and sound are now different pictures. This is the montage to show the user first.

## Leans for the user's eye, ranked

1. **`TROUGH` 0.35 — the picture is 15 % dimmer and flatter than v0.10** (centre/rim 1.69 → 1.37 at the reference frame). This is the
   price of "the sign of Ez is brightness", which is what makes the hue readable. Raising `TROUGH` gives contrast back and washes the
   hue out; it is one constant in `colour.js`.
2. **`CSPREAD` 1.6 vs 1.** `CSPREAD` 1 is exactly v0.10's hue spacing, for the user to put back. 1.6 was chosen because a third of the
   wheel is right for twelve small glows and wrong once those hues colour every wave in the picture. Note that 1.6 makes the twelve hues
   span up to 0.52 turns — more than half the circle — which is why some mixtures land on a hue no note owns (item 2 above).
3. **The wobble is amplitude, not wavelength**, and the reason is physics, not effort: a uniform ε(t) cannot change a wave's k. What the
   eye gets is shells of bright and dark 36 cells apart marching outward at c. If the user wanted the *rings themselves* to bunch and
   stretch, the mechanism is a graded lens with a much shorter travel time or a source-side chirp, and it is a new plan.
4. **The demo styles look different, but not for the reason the plan named.** The 20 % carrier gate is unmeetable (centroids agree to
   4 %); `dirty`, `sub` and `punchy` do the separating. `CENTK` (2.5) is the lever with the most room, and putting `bpm` back as a second
   carrier term is the next one.
5. **`FGAIN` 6.0** (from 3.4), the brightness that pays for the trough. Cheap to move and the first thing to touch if v0.11 reads too dim
   or too hot beside TORUS2.
6. **The dubstep stand-in.** `Malicious` is a 140 BPM Kevin MacLeod CC-BY track, not dubstep. The user's 3 has never been tested on the
   music it was about. A dubstep mp3 in the scratchpad is the single cheapest thing that would improve the next round.
7. **Tier-3 substeps 4 → 3** (the session's one numerics change, `GRIDT[3][2]`). Undoing it costs about 0.25× of TORUS2 and gives the top
   tier its speed of light back.
8. `VACT` / `VACW` 1.0 / 1.0 s — how long silence takes to start letting the rings go, and how long to finish. A guess, kept.

## What was not done

- No `accept.sh` sweep, no Q trace, no bid — the user's standing word (`feedback_sweep_cost`, and bid 0 stands from §42).
- No v0.10-tree shots of `Malicious` for the real montage: `git worktree` is refused in this repo, and re-shooting on a detached v0.10
  checkout was judged not worth a working-tree swap. That row's left half is a labelled placeholder.
- The wobble is **not** proven on real audio (the 2 s trace cannot resolve 1–4 Hz), and item 2 is **not** proven per-note on real audio
  (flat chroma, symmetric wheel). Both are stated above rather than papered over.
- `releases/retinarave-v0.11.html` (bundle of the merged tree, proven from `file://` — see DECISIONS §43), `package.json` 0.11.0,
  `NEXT-SESSION-PROMPT.md`, the tag and the deploy are in the release commit, after this document.

## Docs owed

**Paid this session:** the four CONTRACTS sentences from v0.10 (§1.2 readback, §1.4 hook naming + read-only hooks, §1.10 the
porthole and whole-target readback; commit `06de82a`) and the two this session found (§1.4: a test hook that pins a field must also pin
the params derived from it — `hooks.quiet(1)` silently left `charge` at its musical value until it did; a `hud`/`info` hook's object
literal keeps its keys unique — `mxinfo`'s second `sub:` silently won, renamed `subS`; commit `6587f06`). **Still owed to HARNESS:**
`tools/lum.py` has no hue field (v0.10's report quotes a "saturation-weighted mean hue" from an instrument that was never committed),
and the scene palette is `0.5 + 0.5 cos(TAU(h + [0, .33, .67]))`, not HSV, so every hue number in these reports is in palette turns
recovered by `probe.js hueFit`.
