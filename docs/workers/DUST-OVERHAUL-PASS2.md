# DUST overhaul — pass 2 (2026-09-30, one worker)

Pass 1 is `DUST-OVERHAUL-PASS1.md` (DECISIONS §57, §58); this is the three items that prompt deferred, plus a
fourth the measurements forced. DECISIONS **§60**. Four commits: `10bde08` `54e3033` `5bd7d7d` `55f7021`.
**Not tagged, not pushed, not deployed.** The user's word on pass 1 was *"is looking good"*, so the rule for every
step was: the groove keeps the brightness it already has, and everything else moves relative to it.

---

## The A/B for the user — stream mode, tab capture, in TRACK TIME

Two Chrome windows, same track, key **2** (DUST is scene id 1):

- **A (old):** `file:///home/toma/Documents/Kraftek/RetinaRave/releases/retinarave-v0.21.html` — v0.21 is pass 1 +
  pass 1.5, i.e. what you last looked at. (v0.20 is pass 0, if you want the longer A/B.)
- **B (new):** the dev server, `http://127.0.0.1:8765/`.

In each: press **2**, Share a tab, play the track. **SeeYouDrop** is the reference (drops at **57.6** and
**105.6** s). What to watch, in order of how much the numbers say you should see it:

1. **50 → 57.6 s, and again 101 → 105.6 s — the breakdown and the void should now be genuinely DARK.** The 2.6 s
   of void before the first drop measures 41 % dimmer than before (49.9 → 29.6 mean luminance), and the cloud is
   smaller there too. The slam should feel like the lights coming back on: the void is now 0.28 of the drop's
   brightness where it used to be 0.48.
2. **Everywhere — the picture should be busier between the beats.** The per-frame change in the picture is up 37 %
   and the per-beat peak-to-trough contrast 1.35 → 1.44. This is the habituation: a grain now answers to what is
   NEW in its band, so the parts of the mix that are changing get the light and the parts that are holding fade
   back. The clearest place is **CyborgNinja**, which is one long groove — the numbers there are +32 % motion and
   per-beat 1.36 → 1.45 on a track that has no structure to borrow from.
3. **The hi-hats.** Their lift at the rim goes from nothing (p50 +0.1 %) to +8.6 %, mean 6.4 → 14.8 %, because a
   hat is a fresh sound in a band nothing else is using.
4. **The colour.** The cloud and the rings now take their hue from the KEY, the same way TORUS2 does — so put
   TORUS2 (key **4**) and DUST side by side on the same track and they should be the same colour family. On
   SeeYouDrop the engine is not confident of the key, so the palette is mostly the mood's own hue slid a quarter of
   the way toward the key's; on CyborgNinja it is confident, and the key wins outright. A key change is a slow turn
   of the whole wheel, ~2 s, never a jump.
5. **0 → 14 s of SeeYouDrop, the intro.** The first eight seconds are dimmer than the groove (0.63 of it, against
   0.67 before the overhaul — and 0.89 at one point during this session, which is what step 4 fixed). **But 8–14 s,
   where the track is bringing its instruments in one per bar, is now BRIGHTER than the groove** (1.28×). That is
   the novelty channel doing exactly what the brief asks and the loudness channel losing the argument. If it reads
   wrong to you, it is one number: `HAB` in `assets/scenes/dust/habit.js` (0.35 → higher = less novelty), or the
   two rejected fixes in §60 step 4, both of which fix it and both of which cost most of item 2.
6. **100.5 → 105.6 s, the second breakdown.** This one is NOT better, and the reason is in the engine, not the
   scene: its `eM` reads 0.771 against the drop's 0.729, so by the engine's own loudness the breakdown is the
   louder of the two. Worth a look so you can say whether the eye agrees.

Everything from pass 1 and 1.5 is unchanged: the nudge per beat, the three drum voices and the snare's travelling
ring, the void's contraction and the slam, the shape sequence (sphere / doughnut / galaxy / ribbon), the band → radius
mapping. **CyborgNinja still makes 0 formation changes and never pretends a build is coming.**

---

## What was built, and what it replaced

### Step 1 — dynamic range (`10bde08`)

`lvl` is AGC-normalised — p05 0.513 / p50 0.882 / p95 0.992 over the whole reference window — and it was the whole
of the cloud's brightness, so a breakdown was as bright as a drop. §57 had already measured the obvious replacement,
`eM / eMax`, as useless (`eMax` follows `eM`: ratio p25 0.972).

`assets/scenes/dust/dyn.js` holds a peak of the track's own energy: instant attack, 25 s release, floored at 0.84
(step 4). `energy / peak`, mapped through a 0.55 knee, is the cloud's BASE brightness, its grain size and the
swarm's radius. The three transient voices and the sub ride on a gain that barely moves — between the groove and
the breakdown the base loses 76 % and the hits 24 % — because the brief's own words are "a quiet section's kick is
still a kick". The fibre rings dim with the cloud.

The energy is `eM + ½·max(0, eS − eM)`. Four candidates were simulated on the recorded music first
(`tools/work/d2/sim.py` — the drive is a pure function of `eM` / `eS` / `dropEnv`, so it needs no page run):

| drive, mean per section | intro 2–8 | groove | break 1 | void 1 | drop 1 | break 2 | drop 2 |
|---|---|---|---|---|---|---|---|
| `eM` alone | 0.39 | 0.91 | 0.53 | 0.18 | 0.75 | 0.70 | 0.70 |
| `eM + ½(eS − eM)` ← shipped | 0.57 | 0.90 | 0.51 | 0.16 | 0.83 | 0.67 | 0.73 |
| `max(eM, eS)` | 0.74 | 0.88 | 0.48 | 0.14 | 0.89 | 0.74 | 0.74 |

On `eM` alone a drop is not the loud part of the track (a 2.5 s mean on the frame of a slam is still half-full of
the void); on `max` the intro opens at nearly full brightness. Half a vote to the fast window is the trade.

### Step 2 — novelty and per-bin habituation (`54e3033`)

Each grain's drive is its bin's level minus that bin's own 1.2 s average, floored at 0.35 of a fully novel band.
The state lives in a 256×1 ping-pong of the scene's own targets — one 256-pixel pass a frame and one extra fetch
per grain. The alternatives: a CPU-side EMA is impossible (the array behind `ctx.engineTex.spec` is core state a
scene may not read), and building the average out of `ctx.engineTex.hist` taps would be 600 k fetches a frame at
tier 3 and capped at 1.3 s of history.

**The detector was swept offline before anything was rendered.** New `tools/work/d2/spec-trace.js` records the 256
bytes of `ENGINE.tex.spec` — the grains' own input — every frame; `nov.py` / `nov2.py` then try candidates in
python. Per bin over SeeYouDrop 20–110 s (5401 × 256):

| novelty (all with the 0.35 floor) | nov p50 | p75 | p90 | a sustained bin-onset's drive, +0.1 → +2.5 s | a new bar's novel bins |
|---|---|---|---|---|---|
| `(level − slow) / level`, τ 2 s | 0.010 | 0.048 | 0.090 | 0.439 → 0.387 (88 %) | ×1.00 |
| `(level − slow) / 1.5·EMA\|Δ\|`, τ 2 s | 0.141 | 0.620 | 1.000 | 0.734 → 0.640 (87 %) | ×1.02 |
| `(level − slow) / 0.10`, τ 3 s | 0.088 | 0.416 | 0.782 | 0.690 → 0.662 (96 %) | ×1.09 |
| `(level − slow) / 0.10`, τ 2 s | 0.076 | 0.393 | 0.754 | 0.717 → 0.613 (85 %) | ×1.22 |
| `(level − slow) / 0.10`, **τ 1.2 s ← shipped** | 0.061 | 0.367 | 0.729 | **0.776 → 0.502 (65 %)** | **×1.20** |

- **The brief's own form measures as nothing.** `uSpec` is floor-subtracted and peak-normalised, so a bin's level is
  a spectral SHAPE and barely moves: a median novelty of 0.010 is a flat 0.35 on every grain, a 65 % dimming and
  not a detector.
- **A z-score on the bin's own deviation is worse than it looks**: as a bin settles its deviation shrinks with it,
  so a quiet steady bin reads novel on rounding noise.
- **An absolute step is right** — 0.10 of full scale is a real onset in a band whatever that band's resting level.
- "A new bar's novel bins" = the share of bins with novelty > 0.5 in the bar carrying `barNovelEvt` against the
  three bars after it, measured **from the bar LINE**, because the event fires 1.2–3 beats into the bar
  (CONTRACTS §1.18): 24.1 % against 20.1 %.

**The gain is normalised every frame** by its own RMS over the bins, weighted by the grain density (`fx = .95·u^1.4`,
so the density goes as `fx^(−2/7)`) and by `raw²`. Four divisors, all measured on the picture (mean luminance,
step 1 = 100.3):

| divisor | mean lum | the void before drop 1 | the window's p95/p05 |
|---|---|---|---|
| none (the raw gain) | the base of the cloud four times darker | — | — |
| the gain's mean over the window (0.4945) | 125.1 (+25 %) | — | — |
| its RMS over the window (0.5318) | 117.5 (+17 %) | 54.2 | 3.88 |
| its per-frame RMS, unweighted | 107.9 (+8 %) | 39.9 | 4.39 |
| **its per-frame RMS, weighted ← shipped** | **104.3 (+4 %)** | **32.1** | **4.39** |

The bins that read novel are preferentially the LOUD ones, and most so where the mix is sparse (the spectrum is
peak-normalised PER FRAME), so a fixed divisor raises the quiet end far more than the loud one and half undoes
step 1.

### Step 3 — harmony (`5bd7d7d`)

The palette's centre is `assets/math/keycolour.js`'s anchor — TORUS2's and POLYTOPE's own module — with DUST's own
`mkAnchor()` state (two scenes easing one `hueU` would fight during a crossfade). Twelve keys, twelve hues round
the circle of fifths; the mode pulls the anchor the short way toward warm or cool; `keyConf` gates it; the hue eases
over ~2 s on the unwrapped angle. `hooks.key(k, m)` / `&key=<k>` pins it for a shot.

**DUST and TORUS2 are bit-for-bit the same colour.** Both forced on SeeYouDrop `&at=12&map=0`, sampled at frames
2400 / 3600 / 4800:

| | heard 51.97 s | 71.97 s | 91.97 s |
|---|---|---|---|
| DUST | key 8 mode 1 fifth 11 hue −0.33410 | key 8 mode 1 fifth 9 hue 0.92363 | key 8 mode 1 fifth 6 hue 1.85418 |
| TORUS2 | key 8 mode 1 fifth 11 hue −0.33410 | key 8 mode 1 fifth 9 hue 0.92360 | key 8 mode 1 fifth 6 hue 1.85420 |

Against the truth grids' `tonic`: SeeYouDrop is C# minor and the scene holds **G# 93.5 % of frames** — the FIFTH
above the tonic, which is the v0.14 `key` behaviour on sub-heavy tracks that CONTRACTS §1.18 already records. The
MODE, which is what warm-or-cool actually turns on, is right on both tracks (minor 93 % / 100 %). On SeeYouDrop
`keyConf` p50 is 0.154, so the gate sits at 0.27 and the palette is mostly `LOOK.mood` slid a quarter of the way
toward G# minor; on CyborgNinja `keyConf` p50 is 0.693 and the gate is 1.00. Hue speed p50 0.029 turns/s, p99 0.361
— an ease, never a jump.

### Step 4 — the intro guard, and two rejected fixes (`55f7021`)

The intro came out brighter than the groove. Two causes, one fix kept:

- **the peak hold's floor was too low.** At 8–14 s the track's `eM` is 0.697 and the floor was 0.70, so the drive
  was 0.976 — the quietest part of the track at full brightness, which is what the floor exists to stop. 0.84 is at
  or a little above the resting `eM` of a normal groove on both test tracks (p25 0.789 / p05 0.796), puts the drive
  at 0.681 there and 0.268 through 2–8 s, and only ever binds while the hold is warming up.
- **the habituation leaks light into a sparse mix** — holding the mean of `amp²` is not holding the light, because
  the brightness carries `min(1, sz)` (a sub-pixel grain fades) and a grain's area buys overdraw. Both fixes were
  measured and rejected:

| candidate | window p95/p05 | \|Δlum\| p50 | per-beat | intro 2–8 | intro 8–14 |
|---|---|---|---|---|---|
| the gain as it is ← kept | 4.123 | 2.10 | 1.436 | 0.89 | 1.56 |
| the gain to the power 0.6 | 4.227 | 1.72 | 1.366 | 0.75 | 1.32 |
| the SIZE left on the raw level | 4.177 | 1.63 | 1.366 | 0.65 | 1.09 |

The per-frame motion and the per-beat contrast ARE the novelty, and they travel through the grain's size — so both
fixes give back almost all of what step 2 bought. The intro is dimmed where it belongs instead.

---

## Pass 2 end to end — `765b61c` against HEAD, traced back to back on one clock

| SeeYouDrop 20–110 s | before | after |
|---|---|---|
| the window's range p95/p05 luminance | 2.921 | **4.179** (+43 %) |
| mean luminance | 101.8 | 101.0 |
| \|Δlum\| per frame p50 | 1.52 | **2.08** (+37 %) |
| per-beat peak/trough | 1.349 | **1.440** |
| the hat's rim lift p50 / mean | 0.1 / 6.4 % | **8.6 / 14.8 %** |
| the snare's body lift p50 / mean | 3.2 / 9.5 % | 5.5 / 11.3 % |
| the void before drop 1 (55–57.6 s) | 49.9 | **29.6** (−41 %) |
| breakdown 1 (49–55 s) | 59.8 | 57.9 |
| drop 1 (57.6–64 s) | 103.3 | 106.0 |
| the void / drop 1 | 0.483 | **0.279** |
| breakdown 2 (100.5–104 s) | 103.8 | 106.9 |
| drop 2 (105.6–112 s) | 127.8 | 121.3 |
| the intro's first 8 s / the groove at 28–40 s | 0.671 | **0.633** |
| 8–14 s / the groove | 0.922 | 1.283 |

| CyborgNinja 20–80 s (no drop — the control) | before | after |
|---|---|---|
| p95/p05 luminance | 1.982 | **2.380** (+20 %) |
| mean luminance | 106.2 | 106.2 |
| \|Δlum\| per frame p50 | 1.64 | **2.17** (+32 %) |
| per-beat peak/trough | 1.364 | **1.446** |
| the hat's rim lift p50 / mean | −0.8 / 2.8 % | 0.2 / **9.0 %** |
| formation changes | 0 | 0 |

---

## A measurement hazard, for the harness

An engine worker was editing `assets/engine/clock/clock.js` in the same worktree; its md5 moved from `45eb547f` to
`3ddf490b` in the middle of this session. Only `beatCount` changed — the md5s of the `dropEnv` and `eM` columns are
identical across every trace either side of it — but that was enough: on the second clock SeeYouDrop 20–110 s reads
**227 beats instead of 225**, the build and the formation sequence land differently, and drop 1's mean luminance
moved 160 → 106 for reasons that are not the scene's. Two candidate tables were thrown away before the cause was
found.

**The rule this buys: when two workers share a worktree, a scene's before/after is only valid if the two traces
were taken back to back, and the proof is the md5 of the MS columns of both traces.** `beatCount`, `dropEnv` and
`eM` are enough to catch a clock change, an analyser change and a source change. Every headline number above was
re-taken that way; the per-step numbers in the four commit messages are each internally consistent (each step's
before and after share a clock) and are labelled where they are not comparable across steps.

---

## Proofs

`check` 0 fail (help.feats gaps 0) · `npm test` 0 FAIL · s1 fake-timeline md5 per step:

| | f360 | f840 |
|---|---|---|
| §58 (v0.21 + pass 1.5) | `a73fbe67` | `35fe02c6` |
| step 1 | `8934dc86` | `d3545bc8` |
| step 2 | `5f1b796b` | `984ed577` |
| step 3 | `4781f104` | `b70a98e1` |
| step 4 | `5a9b6bc7` | `b70a98e1` (unmoved: at frame 840 the peak has already grown past 0.84) |

No other scene's folder was touched and DUST's files are imported by nothing else, so no other scene's lines can
move for anything in this pass. Cost, HEAD and FINAL benched back to back on the same machine (5 pairs interleaved
with NAV, `q` pinned 0.95, tier 3, `&dyn=1` so the drive is not the fake timeline's own 0.40): **DUST/NAV 0.527 →
0.580, DUST 1.169 → 1.238 ms** — the whole of pass 2 is **+0.07 ms** at 150 k points. Within it, isolated with
`&hab=0` (which leaves the two new passes and the two extra fetches running and restores pass 1's fill): about
+0.07 ms for the passes and fetches and +0.03 ms for the novel grains' extra fill. Sampling the normaliser on every
fourth bin would save 5 % of the step and was rejected — it would put sampling noise on the brightness of the whole
cloud. No audible run (the worker's brief forbids it): every number is the deterministic file path
(`#test&track=<T>&map=0`, `CLOCK=1`).

## Open items

1. **Breakdown 2 does not get dimmer** (103.8 → 106.9 on SeeYouDrop). The engine's own energy says it is louder
   than the drop that follows it (`eM` 0.771 against 0.729, `eS` 0.62 against 0.78) and its bands are all new, so
   both of pass 2's channels read it as loud. A loudness that is not AGC-flattened is an engine job.
2. **The intro's 8–14 s is brighter than the groove** (1.28×). The novelty channel beats the loudness channel where
   a track assembles itself. Both fixes are measured and in §60 step 4 if the user's eye disagrees with the brief.
3. **The key the engine reads is the fifth above the tonic** on both test tracks. CONTRACTS §1.18 already records
   this for the v0.14 `key`; DUST deliberately uses the same field TORUS2 uses so the two never disagree on screen,
   but if the anchor should read `tonic` instead it is a one-line change in `assets/math/keycolour.js` that moves
   three scenes at once — the user's call, not a worker's.
4. **Three constants are fitted on two tracks**: the peak floor 0.84, the novelty step 0.10 and the habituation
   floor 0.35. WhoLikesToParty and Malicious were not traced (time). All three are exported constants in
   `dyn.js` / `habit.js`.
5. **`shapeFor()` still uses the absolute `eM < 0.74`**, not the new track-relative drive — deliberately, so the
   shape sequence §58 verified is untouched. Moving it onto the drive would make the shape rule track-independent
   and is the obvious next tidy.
6. **No audible run**, and `tools/accept.sh` has still not been run since v0.14.
