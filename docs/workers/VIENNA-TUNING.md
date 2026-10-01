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

---

# Vienna — the hat and the drop (worker report, 2026-09-30; DECISIONS §64)

The user's notes, verbatim, after watching Vienna on DUST (key 2, stream mode):

> "looks better on vienna, but the high hat that starts at 0:25-1:00 still seems jerky also (wonder if the sparkly /
> dreamy sounds are interfering in the high section?)"

and, on §61's open item "`dropLiveEvt` never fires on Vienna":

> "fix it"

Both guesses were right, and both had a number behind them.

## Task 1 — the hat voice

**What "jerky" is.** It is not the rate and it is not the decay. Over Vienna 20–110 s the hat voice fires **310 times
for 224 truth hats** — about the right density — but only **59 % of those fires are hats**. The 125 that are not land
a median **86 ms off the 8th-note line** (the real ones land 3 ms off), they flash at the voice's **floor 0.200**
against a confirmed hat's **0.757**, and they happen where `highS` reads **0.643 against the real hats' 0.283** and is
RISING. Only **76.8 %** of the fires sit on the truth's 16th grid, against the truth's own 91.1 %. So the eye is given
an uneven, stumbling rhythm where the ear hears even 8ths — and the flashes alternate big and tiny on it.

**Where it comes from.** `ears/perc.js` is an HPSS-lite whose harmonic part is a RUNNING MEDIAN of each band's dB
envelope. A median lags a swell, so the leading edge of a pad, an arp or a reverb tail rises above it and is published
as a percussive onset. The user's "sparkly / dreamy sounds" are exactly that. Synapse's `hat2` is the precise picker
here (P 0.96–0.99 on all three tracks) and it confirms **90 % of the real ears events and 2 % of the false ones** on
Vienna (75 / 30 % on SeeYouDrop, 98 % / — on CyborgNinja, which has no false ones).

**The fix, in the scene.** The ears' hat EVENT no longer fires the voice while the high band is more than **1.05 ×**
its own **2 s** average — a band getting louder on its own is a swell, and a swell's edge is not a stick. `hat2`'s
rising edge still fires the voice, and the ears' age still places a hit the level confirms, so no timing moves.
Knob: `&bed=<ratio>,<seconds>` under `#test`, or `CARD.REG[1].scene.hooks.bed(r, tc)` from the console on a live page.

| page window | fires/s | P | §58 coverage | at the floor | on the 16th grid |
|---|---|---|---|---|---|
| **Vienna 20–110** (truth 2.49/s) | 3.44 → **2.38** | 0.59 → **0.80** | 96.8 → 91.9 % | 49 → **26 %** | 76.8 → **88.8 %** |
| **Vienna 85–107** (the double time, 3.00/s) | 4.32 → **3.23** | 0.60 → **0.77** | 95.4 → 93.8 % | 45 → **27 %** | 76.8 → **88.7 %** |
| SeeYouDrop 20–110 (3.29/s) | 4.33 → 3.91 | 0.71 → **0.74** | 95.9 → **94.9 %** | 51 → 44 % | 80.0 → 80.7 % |
| CyborgNinja 20–50 (7.67/s) | 7.63 → 7.57 | 0.99 → 0.99 | 94.7 → **94.7 %** | 8 → 7 % | 79.5 → 79.3 % |

The median gap between flashes on Vienna becomes the 8th note itself — 250 → **333 ms**, against the truth's 325. The
rim's own picture is untouched where it was right: `lumR` p95/p05 range 4.572 → 4.632 on Vienna, 4.196 → 4.199 on
SeeYouDrop, 2.794 unchanged on CyborgNinja.

## Task 2 — `dropLiveEvt` on Vienna

**Why it never armed.** Not a bug: **Vienna has no void of the kind §54 reads.** `bassS` sits at 0.51–0.83 for the whole
track, its 2 s / 32 s ratio bottoms at **0.514** for 4.6 s (the dream section, 1:09–1:14) and is back over 0.85 **eleven
seconds** before the drop; `hp`'s 5 s mean peaks at **0.166** over the same 4.6 s and is 0 from 1:14 on. One void run in
192 s, armed 69.3–76.3 s, and the drop is at 1:25.3. The slam could not have fired either: at 85.343 s `bassS` reads
**0.97 ×** its own 2 s mean (the rule wants 1.75) and `sub` **2.14 ×** (the rule wants 5) — against SeeYouDrop drop 1's
2.80 × and 15.7 ×, where the bass had been at 0.04.

**What IS out: the sub.** The ears' causal sub gate is shut from **69.7 to 85.8 s — 6.02 bars** — and the drop is the sub
note coming back (`sub` 0.356 → 0.991 on one frame, two low onsets on the beat line, +7 ms from the truth). A **four-bar
hold** on that reading separates Vienna's 6.02 bars from the longest sub-gate-shut run on any other track in the set
(SeeYouDrop 3.85, Malicious 3.37, WhoLikesToParty and CyborgNinja none) by 57 %, so the new path cannot arm anywhere
else: the replayed traces for all four control tracks are **md5-identical with the path on and off**.

**Result, on the page** (`&map=0&lead=0`, whole track): `buildLive` arms **4.9 beats** before the drop and runs
82.10 → 85.35 s at max 1.00, `dropLiveEvt` fires at **+14 ms**, and there are **0 false arms in 3.2 minutes**. In node
the same path reads 4.4 beats and −3 ms. SeeYouDrop 15.9 / 7.9 beats and −6 / +21 ms, WhoLikesToParty 11 / 7 / 11 and
+10 / +48 / +12, Malicious 0, CyborgNinja **0 arms and 0 events** — all unchanged. DUST's whole tension machinery (the
contraction over the last 1.2 bars, the palette drain, the slam's release) therefore does something on this track for
the first time.

One caveat the user will not see but the next worker should: `dropLiveIn` points **+3.0 beats late** on Vienna, because
synapse's `barConf` never reaches the 0.9 anchor gate here and §61 measured its bar line 2 beats off, so the detector
sits on v3's own arbitrary count mod 4. The EVENT is right anyway — the slam keys on BEAT lines — but the last-bar
wind-up a scene builds from `nextDropIn` is on the wrong beat of the bar on this track.

**Vienna's SECOND drop (2:06.7) is not detectable and nothing was shipped for it.** Of 60 candidates × 7 grains × 4
causal transforms in `buildstudy.py`, at 4 bars and at 8 bars, **every one gives it a lead of 0 beats**. In the 20 s
before it `hp`'s 5 s mean is 0.000, `bassS` 2 s / 32 s bottoms at 0.887, the sub gate is open throughout, and at the
drop `bassS` reaches 1.25 × its 2 s mean and `sub` 1.32 ×. It is a density / texture jump — the double-time layer
thickening — and every candidate that would arm it also arms on CyborgNinja (0.35–6.71 false arms / min).

## The A/B for the user — in track time

New = `http://127.0.0.1:8765/` on this tree. **Key 2** (DUST), stream mode, Vienna
(`~/Music/RetinaRave/Vienna.flac`, loaded with the landing control).

| time | what to watch | what should be different |
|---|---|---|
| **0:25–1:00** | the RIM's sparkle, not the cloud | OLD: the sparkle stumbles — flashes between the hats, and big/tiny/big/tiny. NEW: an even 8th-note sparkle; the extra flashes between the hats are gone and the ones that stay are bigger. This is the whole of task 1. |
| **1:05–1:25** (the dream) | the rim | the swelling pad no longer sparkles. If the section now looks too dark, that is the knob: `hooks.bed(1.18, 2)` lets more through, `hooks.bed(99)` turns the veto off entirely. |
| **1:22.7 → 1:25.3** | the whole cloud | NEW only: the cloud CONTRACTS over the last bar and the palette drains, then everything lets go on the drop. OLD: nothing at all happened here. |
| **1:25.3** (the drop) | the slam | NEW: the release lands within a frame of the double time arriving. |
| **2:06.7** (the second drop) | — | UNCHANGED, and known: no void, no bass return, no sub return — nothing announces it. See above. |
| 1:50–2:10 | the cloud's turn | STILL WRONG in both, and known (§61): the clock reads 120 BPM there. |

**SeeYouDrop** and **CyborgNinja** are the controls: their drops, their clocks and their formations are untouched, and
the only thing that should look different at all is a slightly thinner hat sparkle on SeeYouDrop (coverage 95.9 →
94.9 %, precision 0.71 → 0.74).

## Open, for the orchestrator

- **The ears' high-class picker is the engine item.** `hatEvt`'s precision against the truth's `high` onsets is **0.56
  on Vienna, 0.71 on SeeYouDrop, 1.00 on CyborgNinja**; the scene now vetoes the swell case, but the picker itself
  publishes those onsets to every reader. `ears/perc.js`: the harmonic part is a running median, and a median lags a
  swell. A spectral-flatness or a per-bin habituation term inside the picker would fix it for everyone.
- **The snare's picker has the same shape and is worse**: on Vienna 20–65 s, `snareEvt` vs the truth's `mid` onsets
  reads P 0.38 / R 0.75, `snare2` P 0.51 / R 0.84 (`drumcheck.py`). The snare's flash ring is the louder voice on the
  body annulus, so this is the next one to measure — not done here.
- **`SUBV_RET` 2 is tuned on one drop.** 1.5 changes nothing, 3 loses it; Vienna's own ratio is 2.14. One drop tunes a
  threshold, it does not prove one.
- **Vienna's second drop** — above. If the user wants something to happen there, it has to be the file map's
  (`&map=1` has the drop) or a hand annotation, not a causal read.
