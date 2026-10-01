# Vienna — the jerk hunt (worker report, 2026-09-30; DECISIONS §61)

The user's notes, verbatim, in the order they arrived:

> "still finding some observations on the visualization that make it feel jerky -> just downloaded a new flac file to pull into
> the test folder … this track has fast elements to it but actually has a slow rolling flowy groove to it. The nudge on this
> looked weird and jerky around 1:40-1:50 (probably more) -> run test tuning on new song"

> "lots of modularization and some panning; 1:05 - 1:25 sound gets interesting and feels like in a dream before first drop at
> 1:25 where it adds a double time; the double time should be accenting rather than driving."

> "rewatching see you drop, think nudge is jerky there also."

The third note is the one that re-ranked everything: the jerk is not Vienna's, it is the NUDGE'S OWN SHAPE as §58 left it,
and Vienna is where it is loudest because Vienna's clock was also running at twice the felt beat there.

## The track

`~/Music/RetinaRave/Vienna.flac` — Thom Sonny Green, *Vienna (Original Mix)*, 192.4 s, 20 MB.

**90.00 BPM, dead constant, bar 2.6667 s, 4-bar phrase 10.667 s, D# minor.** `tools/truth/Vienna.json` carries the grid
(phase 0.00260 s, `downbeat_mod4` 0) and is marked `provisional`: measured, not listened to.

`tools/truth/trackmap.py` got the octave WRONG on this track — 178.21 BPM with a 68 ms DP residual, so it kept the wobbling
DP beats (the first five gaps are 0.3367 / 0.3251 / 0.3250 / 0.3251 / 0.3367 s). Its log-normal tempo prior scores 180 at
0.84 and 90 at 0.70. What settles it (`tools/work/v/{tempo,fit,fit2,acf,pat,roll,grid,down,nov}.py`):

| evidence | reading |
|---|---|
| onset-envelope ACF, LOW lane (kicks) | lag 0.3333 s **−0.005** · 0.6667 s **+0.052** · 5.333 s +0.137 · 10.667 s **+0.217** |
| onset-envelope ACF, MID lane (snare / clap) | 0.3333 **+0.038** · 0.6667 **+0.299** · 1.3333 **+0.414** · 2.6667 +0.310 · 10.667 +0.379 |
| onset-envelope ACF, HIGH lane (hats) | 0.1667 +0.229 · **0.3333 +0.329** · 0.6667 +0.363 |
| the MID lane fitted | P 0.666779 s = **89.985 BPM**, resultant 0.642 over the whole track |
| its phase, P pinned to 0.666667, per 20 s | 0.660 / 0.030 / 0.660 / – / 0.022 / 0.663 / 0.659 / 0.650 / 0.657 s — a 37 ms spread in 180 s |
| kick onsets per beat of bar | **169 / 117 / 117 / 72** (and the 40–150 Hz flux mean 0.819 / 0.808 / 0.636 / 0.722) |
| a grid-free Foote novelty (4-bar kernel) | boundaries 21.223 / 43.514 / 66.502 / 85.310 / 106.626 s, median 113 ms from these BAR lines (random: 667) |

So the kick has **no 180 BPM periodicity at all**, the snare's finest pulse is the 0.6667 s beat, and only the hats run at
0.3333 and 0.1667 — the hats ARE the "fast elements", and the beat a listener nods to is 0.6667 s. The user's own note
confirms the structure: the dream is bar 25 (66.669 s) → bar 32, **the first drop is bar 32 = 85.336 s**, and the jerk
window 1:40–1:50 = 100–110 s sits inside the double-time section that starts there. trackmap's own `drops` list had only
105.639 (→ bar 40, 106.669) and missed 85.336.

## The jerk sources, ranked by what they measure

| # | source | the number, before | after |
|---|---|---|---|
| **1** | **the nudge's own velocity shape** (§58's shaped impulse) — a dead cloud that snaps and dies again | max \|a\| **186.6 / 187.1 / 186.6 rad/s²** · **75 / 73 / 75 %** of every beat under a tenth of the peak velocity · the velocity floor **0.9 / 1.2 / 0.4 %** of the peak · the cloud turned BACKWARD on **1.91 / 0 / 3.64 %** of frames | **19.1 / 15.6 / 16.8** · **0 / 0 / 0 %** · **16.7 / 18.3 / 14.2 %** · **0 / 0 / 0 %** |
| **2** | **the clock at twice the felt beat** through Vienna's double-time section | 100–110 s: **2.90** nudges/s against the music's 1.50 (**1.93×**), the spin at **0.647 rad/s** against 0.327 in a window where the clock is locked; whole track 1.890 ticks/s, 62.3 % of frames in the right octave | **1.60** /s (**1.07×**), spin **0.362** · 1.548 ticks/s, **95.6 %** |
| **3** | **a clock re-seat delivered on one frame** — the lattice check moves the beat line half a beat and a closed-form angle takes it instantly | the frame's own \|a\| up to **605 rad/s²** (SeeYouDrop 22.00 / 29.02 / 30.40 s; Vienna six times) | capped at the frame's own tempo and bled back at 0.75 beat/s: **36** on a synthetic half-beat re-seat; the traces' \|a\| max is **101 / 32 / 101** against 292 / 280 / 278 |
| **4** | **a formation pour re-started on top of one 1 % done** — `formA` jumps to a shape the cloud has not reached | Vienna 73.27 s phrase galaxy→torus, 73.28 s the drop's burst with `formT` 0.009: one frame of torus | re-aimed instead of re-poured; 0 |
| 5 | the snare's flash RING re-launches before it has left the band it was launched on | it travels **0.85 / 0.62 / 0.51** units (p50) between re-launches and the mid band sits at 0.89–1.36 | NOT changed — see "open" |
| 6 | `buildLive` / `dropLiveEvt` never fire at the user's own drop (85.3 s) | `buildLive` arms once, 70.1–74.5 s, max 0.67; `dropLiveEvt` **0 times in 190 s** | NOT changed — an engine item |

## What was measured and REJECTED

- **A per-beat weight from the beat's own strength** (the brief's own first candidate: "a beat with no kick is a smaller
  nudge"). It does not work on this track, and the measurement is unambiguous. At every clock tick in 100–110 s, on-beat
  ticks against off-beat ticks: the voices' energy `max(vk, vs)` reads **0.248 / 0.232** (ratio 1.07), the raw levels
  `max(kick2, snare2)` **0.121 / 0.148** (0.82 — the off-beat ticks are LOUDER), `bassS` 0.630 / 0.646, `lvl` 0.812 / 0.803,
  and "an attack within 80 ms of the tick" fires on 54 % of on-beat ticks against 38 % of off-beat ones. Vienna's
  double-time layer puts REAL transients on the off-eighths, which is exactly the user's point — the eighths are audible,
  they just must not drive. Presence cannot separate them; only periodicity can, and that is the clock's job.
- **A tempo-feel SCALE on the step** (step ∝ the beat's own period, so the angular rate is immune to the clock's octave).
  It works arithmetically — at 179.5 BPM it would have given 0.476 rad/s against 0.481 at 90, instead of 0.647 against
  0.327 — but it speeds Vienna's correctly-locked groove up by 67 % (0.29 → 0.48 rad/s) on every track that is not 150 BPM,
  and the clock fix removes the need for it. Rejected on "keep only what pays".
- **A rate limit on each voice** (the brief's candidate b: hits faster than ~6–8 Hz merge into a level). Measured on all
  three tracks, the voices' own fire rates are: kick 3.01 / 3.23 / 2.04 Hz, snare 3.70 / **6.37** / 4.17, hat 4.32 /
  **7.62** / 3.94 (SeeYouDrop / CyborgNinja / Vienna; worst single second 10 / 10 / 11 and 12 / 9 / 9). **CyborgNinja is
  the densest of the three** and it is the control the user has already signed off. A 6–8 Hz limiter would fire hardest
  there and barely on Vienna. Rejected.
- **A mid-band lattice voter and an even/odd "the clock is at the double" test** inside the clock — both measured, both
  false-positive on a control track. See §61 step 1.

## The picture, before → after

| | SeeYouDrop 20–110 | CyborgNinja 20–80 | Vienna 0–190 |
|---|---|---|---|
| the window's range p95/p05 lum | 4.195 → **4.482** (+6.9 %) | 2.314 → **2.152** (−7.0 %) | 3.243 → **3.347** (+3.2 %) |
| the rim's range | 3.986 → **4.196** (+5.3 %) | — | 4.615 → **4.978** (+7.9 %) |
| mean luminance | 100.4 → 99.8 | 109.05 → 109.02 | 96.2 → 95.0 |
| \|Δlum\| per frame p50 | 2.085 → **1.967** (−5.6 %) | 2.243 → **2.170** (−3.3 %) | 1.542 → **1.393** (−9.6 %) |
| the body's \|Δlum\| p99 | 29.5 → **26.7** (−9.7 %) | — | 20.1 → **19.2** |
| per-beat peak/trough | 1.408 → 1.381 | 1.446 → 1.418 | 1.389 → 1.385 |
| the spin's velocity p05 / p50 | 0.033 → **0.221** / 0.136 → **0.331** | 0.041 → **0.236** / 0.147 → **0.354** | 0.007 → **0.132** / 0.099 → **0.199** |
| the spin's velocity p95 / p99 | 3.017 → 1.417 / 3.456 → 1.823 | 2.464 → 1.476 / 3.188 → 1.892 | 2.316 → 0.953 / 3.180 → 1.195 |
| the spin's own rate rad/s | 0.559 → **0.558** | 0.591 → **0.589** | 0.419 → 0.344 (step 1) |
| formation pours | 8 → 8 (the same ones) | 0 → 0 | 11 → 12 (step 1 moved the phrase lines) |

**The one number that got worse anywhere**: CyborgNinja's window range p95/p05 2.314 → 2.152 (−7.0 %), because on a track that
is one long groove the old spike's own overdraw WAS some of the range. SeeYouDrop's range went up by as much as CyborgNinja's
came down, the per-frame flicker is down on all three, and the brief's own measure is that a viewer can read the song.

## What changed

Three commits, each with its own numbers in DECISIONS §61.

1. **`assets/engine/clock/period.js`** — the clock does not leave a tempo whose own ACF lag is still a live peak. One
   expression; the four other truth tracks' whole-track node traces are **byte-identical**.
2. **`assets/scenes/dust/grid.js`** — the nudge is a velocity profile: a base glide (45 % of the step, spread evenly
   through the beat) plus a raised-cosine accent (width 0.55 beat) that STARTS a quarter-beat before the line and PEAKS
   ON it. The angle is the profile's exact integral, a closed form of `beatCount` / `beatPhase`, so it still cannot drift.
   A re-seat is capped at the frame's own tempo and bled back; the angle can never run backward.
3. **`assets/scenes/dust/index.js`** — a pour that lands on one less than 20 % done is re-aimed, not re-started.

## The A/B for the user — in track time

Old = `releases/retinarave-v0.22.html` opened from `file://`. New = `http://127.0.0.1:8765/`. **Key 2** (DUST), stream mode,
same track. Watch the CLOUD'S ROTATION, not the hits.

### Vienna (`~/Music/RetinaRave/Vienna.flac`) — load it with the landing control

| time | what to watch | what should be different |
|---|---|---|
| **0:40–1:10** | the cloud's turn between hits | OLD: it stands still and snaps on the beat. NEW: it never stops — a glide with a crest on the beat. This is the §58-vs-§61 nudge, nothing else: the clock is already right here. |
| **1:25** (the first drop, where the double time comes in) | the rate the cloud turns at | OLD: from here the turn DOUBLES and stays doubled for 20 s. NEW: the rate does not change — the double time arrives in the hats' sparkle and the snare's ring, not in the rotation. |
| **1:40–1:50** (the user's own window) | the same | OLD: 2.90 nudges/s over a 1.50 Hz groove, and half of them landing 186 ms off the beat. NEW: 1.60/s, on the beat. |
| **2:12–2:40** | the turn | OLD: the clock reads 120 BPM here and the nudge drifts against the music — a limp. NEW: 90, on the beat. |
| **1:13** | the shape | OLD: one frame of doughnut in the middle of a galaxy→doughnut pour. NEW: no flash. |
| 1:50–2:10 | the turn | STILL WRONG in both, and known: the clock sits on the wrong half-beat here for ~18 s after a re-seat (Vienna's low-band margin is the thinnest of the five tracks). |

### SeeYouDrop — the reference

| time | what to watch | what should be different |
|---|---|---|
| **0:30–0:50** | the cloud's turn | the same glide-with-a-crest: the motion never stops. The hits, the colours, the shapes and the drops are untouched. |
| **0:57.6** and **1:45.6** | the two drops | unchanged — the slam, the burst into the galaxy and the void before each are byte-for-byte the same inputs. |
| 0:22, 0:29, 0:30 | the turn | three clock re-seats in the first ten seconds of the window. OLD: a snap. NEW: absorbed. |

### CyborgNinja — the no-drop control

Nothing should move except the glide. Its clock, its drums, its 0 formation changes and its `buildLive` (never armed) are all
byte-identical.

### The knob, if the glide is too much or too little

`&nudge=<glide>,<width>` under `#test`, or `CARD.REG[1].scene.hooks.nudge(g, w)` from the console on a live page.
`0.45,0.55` is the default; `0.2,0.4` is nearly §58's snap again; `0.6,0.7` is smoother than TORUS2.

## Open, for the orchestrator

- **`dropLiveEvt` never fires on Vienna** and `buildLive` arms only in the dream section (70.1–74.5 s, max 0.67). The user
  names a drop at 1:25 and the independent novelty agrees (85.310 s). DUST's whole tension machinery — the contraction, the
  palette drain, the slam — therefore does nothing on this track. §54's detector, not the scene.
- **Vienna sits on the wrong half-beat lattice for 110–130 s.** Its 40–150 Hz on-beat / half-beat margin is **+0.082 ln**,
  the thinnest of the five tracks and barely past §59's `LAT_MARG` 0.06, so the check takes ~18 s after a re-seat to move
  the line. Fewer re-seats (step 1) already helped; the rest is §59's own cost structure.
- **The snare ring never leaves its band** on any of the three tracks (0.85 / 0.62 / 0.51 units of travel against a band at
  0.89–1.36). §58 task A launched it ON the band so it lands at 0 ms; it then re-launches before it has gone anywhere, so
  what the eye gets is a flicker on the band, not a shell leaving. Changing it changes all three tracks equally, so it is
  the user's call.
- **synapse's bar line is 2 beats off on Vienna** (`barPos`: engine bar 1 is truth beat +2 in 82 % of frames, `barConf`
  0.00 when right and 0.67 when wrong) and its 16-beat line hits 2 of 22 section starts. The downbeat's bigger nudge is
  therefore on the wrong beat of the bar there — a consistent 4-cycle, so it reads as a pattern rather than a jerk.
- **`bpmSyn` reads 164.93 on Vienna** (median) — synapse's own tempo is a third voice and it is wrong on this track too.
- "Lots of panning": DUST reads no stereo field at all (its 42 `feats` are mono), so panning cannot drive a flicker here.
