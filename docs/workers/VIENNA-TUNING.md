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

---

# Vienna — the bounce and the second drop (worker report, 2026-09-30; DECISIONS §66)

The user's notes, verbatim, after watching Vienna on DUST (key 2, stream mode):

> "something still feels off about 0:25-1m the bounce feel slow and jerky on the kick and high hat (?is what I think
> is there); drop 2 -> at 1:46 what plays? it feels like there is bass starting"

Both halves of the first note are right, and they are two different things. The second note is right and is a
register change, not an addition.

## Q1 — what actually plays at 0:25–1:00, and what the eye was given instead

**The music, from the PCM** (Butterworth band envelopes, the peak in [line − 10 ms, line + 120 ms] at each 16th line
of the 90.00 BPM hand grid, bars 9–21, odd and even bars averaged apart — the groove's own cycle is TWO bars). dB over
the window mean, the four beats first:

| band | beat 1 | beat 2 | beat 3 | beat 4 | the four off-8ths | the odd 16ths |
|---|---|---|---|---|---|---|
| sub 20–60 | 6.7 / 8.9 | 5.1 / 5.5 | 8.3 / 9.6 | 7.3 / 4.0 | 3.7–8.8 | 4.8–8.1 |
| **kick 60–150** | **11.4 / 10.1** | 4.2 / 6.5 | **10.8 / 12.4** | 4.2 / 3.5 | 1.6–6.3 | 1.5–6.0 (**slot 15: 5.7 / 11.1**) |
| **click 150–800** | 2.8 / 6.1 | **13.3 / 12.0** | 4.4 / 6.3 | **13.0 / 11.9** | −3.4–5.2 | odd bars: slots 3 and 7 at 6.4 |
| mid 800–5 k | 4.4 / 3.6 | 3.3 / 2.0 | 3.6 / **11.5** | 5.2 / 8.2 | −5.7–10.8 | — |
| **hat > 5 k** | 10.0 / 10.9 | **13.0 / 12.4** | 6.4 / 10.8 | **12.6 / 12.6** | **9.3–12.4** | **−8.8 to +4.3** |

**In plain words.** There is no kick on every beat and no hi-hat on 16ths.

- **the kick** is a soft, masked 60–150 Hz thud on **beats 1 and 3** plus a **16th pickup into the next bar** (loud on
  the even bars) — **2–3 hits a bar, 0.75–1.125 Hz**, not 1.5.
- **what sits on beats 2 and 4** is a **dry rim / clap in 150–800 Hz** (+12 to +13 dB), with 16th pickups into them on
  the odd bars. That is almost certainly what the ear takes for the second half of the "kick" pattern.
- **the hats** are **dead-straight 8ths** — **3.00 Hz**, swing ratio **1.000:1** (the median off-8th phase is 0.5001 of
  the beat, 0.1 ms late; the on-8ths land 7.9 ms off the line) — and they fill to **16ths on bars 17 and 21 only**
  (45.3–48.0 and 56.0–58.7 s).
- **the sub** is a **continuous D♯1 / F♯1 drone with no pulse at all** (a 7 dB span over all 16 slots).
- **the 800–5 kHz layer gates on a two-bar cycle**: −6 dB over the first half of every even bar, +8 to +11.5 over the
  second. That is "lots of modulation".

**The clock is right.** 89.98 bpm, **1.500 ticks/s** against the music's 1.500, **100 %** of them on the beat at a
constant −35.9 ms, **zero** line moves over 24–60 s. §61's fix holds and the jerk is not the clock.

**What the eye was given.** Four things, ranked:

| # | what | the number |
|---|---|---|
| **1** | **the KICK voice fires in the wrong place** | **73 fires** for 56 kicks (2.03 /s); its biggest slot bins are **slot 1 (14)** and **slot 3 (10)** where there is no kick, against **6 on slot 0** and **2 on slot 8** which are the kick; **P 0.21 / R 0.27**; the real kicks flash at the voice's **floor (0.250)** and the false ones **bigger (0.371)** |
| **2** | **the SNARE voice fires 2.7× too often** | **4.81 /s** against a truth `mid` of 1.81; **P 0.35**; 39 % at the floor; gap p50 167 ms = the 16th, so tc 0.30 s leaves **57 %** of each hit on the body annulus |
| **3** | **the nudge's crest is 67 % longer at 90 BPM than at 150** | **367 ms** against 220, peaking at **1.08 rad/s** against 1.78, starting **183 ms** before the line instead of 110; only **53 of 108** 8th lines carry a nudge |
| 4 | the HAT voice is **fine** | §64's veto leaves it **96 %** on the truth's 16th grid, |dev| p50 **2.6 ms**, amp p50 **0.757**, **8 %** at the floor |

**Item 1 is not fixable in the scene, and the proof is one number.** `kick2`'s AUC against the kick lines is **0.316**
— below chance. It reads **0.031** at a kick and **0.130** at a non-kick 16th, and its mean shape from the beat-1 line
peaks at **+200 ms** (0.07 → 0.35), which is exactly the slot-1 / slot-3 bins. The **60–150 Hz band's own rise**
separates the same lines at **AUC 0.999** (+11.21 dB against +4.56), so the information is in the audio; the lane
throws it away because Vienna's low end is a loud continuous drone and the kick is a soft thud above it. `bassS` 0.546,
`eS` 0.543, `subGate` 0.500 — nothing low carries it. An **engine** item (DECISIONS §66 open, `docs/OPEN-ITEMS.md`).

## Q1 — what changed: the accent is a wall-clock shape (`assets/scenes/dust/grid.js`, `c027e8c`)

`W` is a width in BEATS, so §61's own pair gave a different crest at every tempo — 206 / 220 / 236 / 282 / **367 ms**
on CyborgNinja / SeeYouDrop / Malicious / WhoLikesToParty / **Vienna**. Below `K.WREF` (145 BPM) the accent now keeps
its width in **milliseconds** (`wFor`), and the glide is raised by exactly as much as holds the velocity floor/peak
**ratio** where the reference pair puts it (`gFor`) — narrowing the accent alone put §61's dead time back at **52.6 %**.
Both are exact identities at `w = K.W`, so every track at or above 145 BPM is untouched.

Page A/B, Vienna 24–60 s, the only difference being this file, **all 50 MS columns md5-identical**:

| | before | after |
|---|---|---|
| the accent · the lead · GLIDE · W | 366.8 ms · 183.3 ms · .450 · .550 | **227.3 ms · 113.7 ms · .569 · .341** |
| the spin's own rate | 0.3300 rad/s | **0.3300** |
| velocity p05 / p99 | 0.132 / 1.074 | **0.167** (+26 %) / **1.339** (+25 %) |
| floor/peak · dead time · backward frames | 11.27 % · 0.0 % · 0 | 11.43 % · **0.0 %** · **0** |
| \|a\| p50 / p99 / max | 1.3154 / 16.62 / 26.46 | **0.0042** / 20.68 / 37.59 (SeeYouDrop's own: 25.44 / 93.67) |
| the three voices · pours · re-seats | 2.028 / 4.806 / 2.639 /s · 1 · 37 | **identical** |

**The controls do not move**: SeeYouDrop 20–110 s and CyborgNinja 20–80 s have `d_nv`, `d_nu`, `d_nstep` and `d_noff`
**md5-identical on all 5401 / 3601 frames**, and the only difference anywhere is a constant **0.053° / 0.103°** offset
on the absolute angle from the un-recorded warm-up.

## The A/B for the user — in track time

New = `http://127.0.0.1:8765/` on this tree. **Key 2** (DUST), stream mode, Vienna
(`~/Music/RetinaRave/Vienna.flac`, loaded with the landing control). Watch the CLOUD'S TURN, not the hits.

| time | what to watch | what should be different |
|---|---|---|
| **0:25–1:00** | the cloud's turn between hits | OLD: the crest is a 367 ms push that starts 183 ms before the beat and only reaches 1.08 rad/s. NEW: a **227 ms** crest starting **114 ms** early and reaching **1.34** — SeeYouDrop's own shape — on top of a glide that is **26 % faster** between crests. The RATE is unchanged (1.5 /s, 0.330 rad/s): same tempo, crisper pop. |
| **0:25–1:00** | the CENTRE of the cloud (the kick's shove) | **STILL WRONG, and known.** The shove fires 2.03 /s mostly on the 16th AFTER the beat and the 16th after that, and the two real kicks (beats 1 and 3) get the SMALLEST shoves in the window. This is the engine's low lane, not the scene: `kick2`'s AUC on this track is 0.316, below chance, and it peaks 200 ms late. Nothing in DUST can fix it. |
| 0:25–1:00 | the RIM's sparkle | unchanged and correct since §64: an even 8th sparkle, 96 % on the grid. |
| 0:25–1:00 | the BODY annulus (the snare's ring) | **STILL WRONG, and known.** 4.81 flashes/s against 1.81 real ones, each leaving 57 % of itself behind — a 6 Hz smear. §64's swell veto does not work on it (AUC 0.615). |
| **1:25.3** (drop 1) | the slam | unchanged from §64: contraction over the last 1.2 bars, palette drain, release on the drop. |
| **1:40–1:56** | the cloud's turn | the clock still reads 120 BPM here (§61's open item), but the dead time in that window halves — **19.6 → 8.4 %** — because the crest no longer stretches with the wrong tempo. |
| **1:46.7** (drop 2) | the CORE and the RIM | no detector fires (see Q2), but the picture does read the hand-over: the kick voice **+144 %** and the hat **+51 %** on the drop's own beat, then over two bars the core's sub swell drains **−33 %**, the rim darkens **−20 %** and the rim's sparkle rate **doubles** (1.69 → 3.37 /s). |

**SeeYouDrop** and **CyborgNinja** should look EXACTLY as they did — their nudge columns are md5-identical.

**The knob**: `&nudge=<g>,<w>` / `hooks.nudge(g, w)` still moves the REFERENCE pair and both derivations follow it.
`hooks.nudge(0.45, 0.55)` is what shipped (0.569 / 0.341 at 90 BPM); **`hooks.nudge(0.45, 0.917)` is §61's old look
back** at 90 BPM (0.917 × 90 / 145 = 0.55); `hooks.nudge(0.45, 0.341)` is the narrow crest WITHOUT the glide
correction, which is the 52.6 %-dead row and is there to show why the correction exists.

## Q2 — 1:46.7: the bass is starting, one octave up

Band RMS per beat, dB over the 8 bars before the drop:

| beat of the drop bar | sub 20–60 | bass 60–150 | lowmid 150–800 | mid 800–5 k | high > 5 k |
|---|---|---|---|---|---|
| +0 (106.669) | **−2.1** | +1.7 | +0.6 | −5.6 | **+7.6** |
| +1 | **−5.7** | +3.2 | +4.0 | −4.8 | +5.3 |
| +2 | **−9.8** | +5.1 | +4.9 | −4.0 | +7.0 |
| +3 | **−15.7** | **+6.5** | **+5.1** | −1.3 | +7.0 |
| the 4 bars after | **−3.6** | **+2.6** | **+3.8** | −0.4 | **+5 to +10** |

**What enters** is a **60–150 Hz bass line** (+6.5 dB over four beats) with the 150–800 layer (+5.1) and a **hat /
noise layer above 5 kHz (+7.6 dB on the very first beat** — the biggest single jump). **What leaves** is the **20–60 Hz
sub drone** that has held the whole track (−15.7 dB by beat 4; the engine's `subGate` closes at 108.30 s). The
800–5 kHz band does not move at all.

**It is the same instrument moving up an octave.** The bass/sub band ratio goes from **p50 −0.31 dB over the 30 beats
before** to **+3.6 / +8.8 / +14.8 / +22.1 dB** across the drop bar, and the sub note goes from **D♯1 / F♯1 (38–46 Hz)**
to **A1 / F♯2 / D♯2 (46–92 Hz)** (the truth's f0: p50 46.4 Hz over the 4 bars before, **77.0** over the 4 after). A
40 Hz drone is felt; an 80–92 Hz line is heard. That is exactly "it feels like there is bass starting".

**BS.1770** (the existing `tools/work/Vienna.loud.json`; `trackmap.py --loud` was NOT re-run, so the truth dir was not
touched): short-term **−7.16 → −6.08 LUFS = +1.1 LU**, against **drop 1's +3.2 LU**. And the drop's own beat is the
**quietest momentary in the window** (−7.92 LUFS, 1.9 LU under beat −3) because the sub leaves before the bass arrives.

**No detector, and the pitch channel does not help.** §64 searched 60 energy candidates and got 0 beats of lead; the
new hypothesis was a sub-register / pitch precursor. It is not one: the bass/sub ratio at **beat −1 (106.003) reads
−0.01 dB**, inside the 30-beat pre-window (p50 −0.31, max +2.78), and the crossover starts **on the drop beat**
(+3.64) — **0 beats of lead**. The truth's `sub_runs` does carry an F♯2 at 106.0, one beat early, but F♯2 also appears
at 100.20, 101.10 and 103.00 in the same four bars (the bass slides constantly: `sub_slides` has ten 1.6-semitone
glides) and the band ratio cannot see it. A ratio threshold is not gateable either — **+8 dB fires on 14 consecutive
beats in the dream section (70.3–81.0 s)**. **Nothing was shipped for drop 2**, and the eye's own read of it is the
row in the watch-list above.

## The one-line diff NOT applied (another worker holds `index.js`)

If the user ever wants Vienna's rim to keep CyborgNinja's tail instead of SeeYouDrop's, this is the whole change, in
`update()` just before the hat's `voice()` call:

```js
    // the hat's decay is the one voice decay that travels with tempo (§66): tc / median inter-fire gap reads
    // 0.45 / 0.90 / 0.27 on SeeYouDrop / CyborgNinja / Vienna. 0.09 s is 0.23 beat at WREF; below WREF hold the
    // share of the BEAT instead of the seconds.
    this.vH.tc = 0.09 * Math.max(1, NUDGE.WREF / (MS.bpm || NUDGE.WREF));
```

Replayed exactly off the recorded `d_ageH` / `d_aH` / `hat2` columns (`tools/work/v66/hattc.py`, which reproduces
`d_vh` to 2.5e-6): SeeYouDrop and CyborgNinja are **identical on every number** (their bpm is ≥ 145); Vienna's tc goes
**90 → 145 ms**, its rim envelope p50 **0.068 → 0.151**, the envelope just before the next flash **0.0224 → 0.0851**
and the time under 0.05 **43.0 → 21.9 %**. The reason it was NOT shipped: SeeYouDrop's own envelope just before a
flash is **0.0265**, so Vienna at 0.0224 already matches the control; the change would move it PAST SeeYouDrop toward
CyborgNinja's 0.1043. It is a taste call, not a correction.

## Open, for the orchestrator

- **The ears' LOW lane is blind to a masked kick** — `kick2` AUC **0.316** on Vienna (below chance), peaking 200 ms
  late, while the 60–150 Hz rise separates the same lines at **0.999**. DUST's kick voice is the shove at the centre of
  the picture and it fires in the wrong places on this track. The third picker of the same shape, after §64's HIGH and
  MID. The remedy: a 60–150 Hz lane kept separate from the sub, graded on its RISE.
- **The snare voice**: 4.81 /s at P 0.35 on Vienna, and §64's swell veto does not transfer (AUC 0.615). §64 open item 2
  stands, now with the scene-side number.
- **`barPos` is still 2 beats off on Vienna**: the engine's bar wrap lags the truth downbeats by **+1297 ms** over
  24–60 s, so the downbeat's bigger nudge is on the wrong beat of the bar.
- **Vienna's hats fill to 16ths on bars 17 and 21** (45.3–48.0, 56.0–58.7 s) and nothing in the engine reads a lattice
  change; `denH` is a count.
- **`tools/truth/Vienna.json` is still `provisional`** — nobody has listened to the grid against the track.
