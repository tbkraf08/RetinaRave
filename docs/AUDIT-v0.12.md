# AUDIT v0.12 — MAXWELL "every sound a wave" (2026-09-26, orchestrator; DECISIONS §44, worker report `docs/workers/maxwell-onset.md`, plan `MAXWELL-ONSET-SESSION-PROMPT.md`, shots + scripts `tools/accept/v0.12/`)

**What was asked (the user, verbatim, after looking at v0.11 on 2026-09-26):** "it still seems like the waves coming out of the center
are at a constant rate -> I'm expecting every sound to generate a wave (and the wave color is based on musical note being played)
sometimes the music goes double time, doesn't seem like what is being immited from middle matches ; also why are there a pattern of
small circles in the background?" Then: "1. no sound -> quiet (ie. wave not generated) 2. what are the media?" and, told, "follow your
rec" — drop the photonic lattice, keep the lens and the mirror cavity, decide the waveguide after seeing sound-only ripples in the cavity.

MAXWELL is **modified in place** (id 9, still forced-only: bid 0, key `9` then `n`). Gate as v0.10/v0.11: the user's word, no sweep,
proof on id 9 only. **The user has not looked at v0.12.**

## Headline

- **Silence is silence.** The continuous carrier (all twelve charges + the dipole + the sub's standing current oscillating at the
  timbre's wavelength) and the beat-locked `FAINT` metronome ring are **removed, not zeroed**. With the music playing and every hit
  pinned off, `hooks.energy()` reads **0** exactly (v0.11 on the same frame: 396.41) and the contour count is 0. On the three real
  tracks, 8 s into a paused window, **0 launches** in every band, field energy 1e-5 … 2e-2 (the decayed tail of the last shells),
  the picture pure black.
- **Every sound a wave, in its note's hue.** Five launch sources, each a Ricker shell injected into the colour field with one hue:
  kicks (`kickCount` delta, from the centre, hue = `argmax(bchroma)` — the bass note), snares and hats (a re-armed edge with a 70 ms
  refractory, from the pitch class that rose most / all twelve), the engine's `onset` event (anything that hits and is not a drum),
  and a soft per-pitch-class **note** onset (a chroma bin rising by `NOTEK` 0.05 in 150 ms, from its own sector). On `#test` one bar
  gives exactly the fake timeline's 4 kicks + 2 snares + 8 hats. Double time follows: `train('8')` vs `('4')` ring spacing **0.4999**.
- **The lattice is gone.** Rotation is lens · mirror cavity (`sectionAlt mod 2`); the waveguide is reachable by `hooks.medium(3)` only;
  `medium(2)` is empty space. The trace never saw a `2` in force.
- **Cost fell:** MAXWELL **0.80× TORUS2** at tier 3 (orchestrator, two pages, median of ratios; the worker's tree read 0.92×) — v0.11 was 1.01× / 1.24×. Gate ≤ 1.5×.
- `index.js` 497 → **465** (a new `onsets.js`, 151 lines, holds the detectors). check.js 0 fail, param-smoke 0 fail, `test_fdtd` OK.

## The md5 reference

s9 on the merged tree: `4ad6d2ea0b2818a9d9cb1b0ad5dc6f70` (f360) / `4c2ab3c8da487a007521cbc0112b2e50` (f840) — **equal to the worker's
report exactly**. v0.11 was `d268a071` / `473e474c`. Full list `tools/accept/v0.12/scene-md5-v012.txt` (s0–s8 carried; only
`assets/scenes/maxwell/` changed). The f840 frame is now the cavity — on v0.11 it was the waveguide, which left rotation.

## Item A — no carrier, no metronome (the user's 1)

**What changed:** `sources.js` no longer radiates anything continuous — `CHG`, `SUBK`, `WOBA`, `CENTK`, `RSWEEP`, the `ph`/`dph`
phase, the `beat`-event `FAINT` ring: deleted (two comments still quote the names as history). The dipole is a geometry that fires only
when a kick is routed through it, in the kick's hue. The sub still breathes the medium's ε (`WOBK`) — it moves the light, it is not a
source. Timbre survives on the shell only: `TSIGK` (ring thickness by centroid) and `DIRTK` (a second lobe for `dirty`). `feats` lost
`beat roll riser novelty flowHigh dropEnv` and gained `bchroma onset kickCount` (41).

**Worker's proof** (CLOCK=1 f360, `train('off')` + `quiet(0)`, music on): energy **0**, segs **0**; v0.11 same recipe 396.41 / 468.
The plain `#test` pair is alive: energy 258.7 / 615.7, centre/rim 1.42 / 1.47, segs 1301 / 2434, gap 0.

**Orchestrator's headed proof (the paused start, `audit12.sh` / `det12.py`, three tracks):** 8 s into the pause, `dn` = **0** in every band
on CyborgNinja, WhoLikesToParty and Malicious; energy 0.0099 / 0.022 / 0.000019 against playing medians 505 / 286 / 73; `presence` 0.
The black-frame counter is identical at 20, 40, 60 and 80 s (398 / 381 / 414 — every black frame is inside the paused window), 0
long frames, ERRS `[]`, nonFinite `[]` on all six runs. `montage-maxwell3-paused.jpg`: the left column is black to the rim.

## Item B — every sound a wave, in its note's hue (the user's 1 and 2)

**What changed:** `onsets.js` (new) — the detectors; `sources.js` — one shared 32-slot launch ring (`NSLOT`) instead of 8 per band,
each launch carrying `band, sector, hue, amp, step`; `hooks.launches()` (read-only) reports them. Constants: `KICKA`, `KPUN0/1`,
`HI`, `REARM` 0.5, `REFR` 0.07 s, `NOTEW` 0.15 s, `ONSETW` 0.05 s, `ONSETA` 0.07, `NOTEK` **0.05** (the plan said 0.08 — at 0.08 the
note source fired 4 times in 14 s of house; the worker measured the chroma-rise distribution over 481 frames per synth and set 0.05),
`NOTEA` 0.045, `NOTEREFR` 0.2 s. `colour.js` is untouched in mechanism. `hooks.mxchroma` no longer silences the centre in the colour
field (v0.11 did, because the centre carried the pitchless anchor hue; now the centre carries the last kick's bass note, so the
silencing zeroed the only source under the plan's own gate — the worker's friction 3).

**Worker's proof:** one `#test` bar → kick 4, snare 2, hat 8, onset 0 (the fake `onset` lands on the kick's frame and `ONSETW` suppresses
it), note 0 (`fake.js` leaves `chroma` at zero) — the timeline's numbers exactly. `train('8')` / `('4')` measured crest gaps 17.52 /
35.06 = **0.4999** (bookkeeping 0.50001). `mxchroma("3")` + `train('4')`: every launch sector 3, plane hue **0.0018 turns** off the
target, sat 0.983. Demo synths, launches in the last 2 s: house 32 / 40, aba 32 / 36, dnb 37 / 39 at 6 s / 14 s, all five bands firing
on all three (note 3–9 per 2 s).

**Orchestrator's headed read (`det12.py`, 40 samples × 2 s per track):**

```
                 launches / 2 s        per band over 80 s (kick snare hat onset note)   engine kickCount   dkick ≤ .08   dbass ≤ .08
CyborgNinja      22–37, median 29      499  155  141  135  184                            547               17 %  (med .13)   30 %
WhoLikesToParty  17–30, median 23      466  156  204   61   22                            513               45 %  (med .11)   47 %
Malicious         7–24, median 16      429    3   14  111   72                            468               79 %  (med .02)   82 %
```

`dkick` is the circular distance (turns) between the plane's dominant hue and the newest kick's hue (= the bass note at that kick);
`dbass` the same against `argmax(bchroma)` now. The plan's gate was ≤ 0.08 on ≥ 70 % of samples: **met on Malicious only.**

**What this says:** the launches follow the music — a kick-heavy track launches kicks (Malicious: 429 kicks, 3 snares), a busy one
launches everything (CyborgNinja: all five bands in the hundreds); the rate per 2 s moves with the track (16 / 23 / 29). The kick's
hue **has a referent now** (the bass note), which v0.11 never had. On Malicious, whose bass sits on one note, the plane is that note's
colour four samples in five.

**What this does not say, bluntly:** (a) on CyborgNinja the bass alternates between two notes ~0.3 turns apart (`kickhue` flips
−0.22 ↔ 0.04 from sample to sample) and the plane's dominant hue sits at 0.75–0.90 — a mixture of the last several shells, not the
last one; a hue distance to *the newest kick alone* is the wrong instrument for a plane that remembers a second of launches, and
`det12.py` should carry a launch-weighted expected hue next time. (b) The plan's other number, launches within 30 % of the engine's
`onsetRate`, **cannot hold by construction** — the scene launches per band while `onsetRate` counts one onset per frame for the
whole drum stack — measured 2.9 / 3.6 / 3.2× (the worker's friction 6; not detector ringing — the inter-launch gaps are 8ths and
16ths at the track's tempo). Read `dpb`. (c) The note source and `TSIGK`/`DIRTK` are proven on the demo synths and by pin only;
`#test` pins `chroma`, `centroid` and `dirty` flat. (d) No dubstep, still: Malicious stood in again. (e) A double-time *passage* was
not found in these three tracks' 80 s windows (`onsets` per 2 s never doubles for more than one sample); the double-time proof is the
`train('8')` one.

## Item C — the media (the user's 2)

**What changed:** the lattice (`PLAT`, `RLAT`, its ε grid and its hint) removed from `medium.js` and `render.js`; rotation `sectionAlt
mod 2` = lens · mirror cavity; waveguide by `hooks.medium(3)`; `medium(2)` is empty space (the control); the drop's mirror (2.2 s) stays.
`NAMES`, `help.js`, the card blurb say lens · cavity.

**Proof:** `mx3-c-med{0,1,2,3}-f360.jpg` (`montage-maxwell3-media.jpg`): the lens bends the four shells into a soft blue spiral inside
a dim disc; the cavity puts an amber rim around the same shells and one reflection folds back across the next; the waveguide is two
diagonal rails with the shells running between them — the one composition in the scene that is not concentric; empty space is the
bare shells. On the three real tracks `medium` read 0 or 1 only (`sectionAlt` reached 2 on WLTP → medium 0). No small circles anywhere.

## Cost

Two-page protocol (HARNESS "Bench protocol"; `q` pinned 0.95 by `setInterval`, 10 s settle, 8 interleaved `bench(id,300)` /
`bench(0,300)` pairs, the cold pair dropped, medians of the seven; PORT 8810 GPU=1, tier 3, merged tree `11f264b`):

```
test&scene=9   maxwell  NAV   ratio       test&scene=3   torus2   NAV   ratio
               1.777  1.445  1.229                       1.873  1.508  1.242
               1.938  1.478  1.311                       1.763  1.432  1.231
               1.665  1.471  1.132                       1.635  1.448  1.130
               1.356  1.369  0.990                       1.647  1.475  1.117
               1.287  1.393  0.924                       2.104  1.468  1.433
               1.216  1.437  0.846                       2.099  1.459  1.439
               1.213  1.467  0.827                       1.950  1.746  1.117
        median 1.356  1.445  0.990              median   1.873  1.468  1.231       MAXWELL / TORUS2 = 0.80×   (gate ≤ 1.5×)
```

The MAXWELL page drifts down across its seven pairs (1.23 → 0.83 — the warm-up the v0.11 reports warn about; the last four pairs say
0.85–0.99); the worker's own run read 1.185 / 1.799 → 0.659 against TORUS2 0.717 = 0.92×. Either way under 1× TORUS2: v0.11's 1.01× /
1.24× with the carrier's twelve oscillating charges gone. Tier-3 substeps stay at 3 (lean 6).

## What the eye sees

**`montage-maxwell3-paused.jpg`** — left column: black, not even the rim. Right (20 s): CyborgNinja a dense gold-green field of fine
shells around a lime centre; WhoLikesToParty a dim brown disc with the twelve glows in magenta, red, orange, gold and a single pink shell
at the centre; Malicious a dim violet disc, the glows, a pink shell at the centre. **One stray contour stroke** runs from WLTP's upper-left
glow out past the porthole at 20 s (`mx3-wltp-20s.jpg`) — a lean below.

**`montage-maxwell3-demo.jpg`** (house / aba / dnb, v0.11 left · v0.12 right) — v0.11's pale cream concentric shells become **many small
overlapping shells in many hues**: house gold and lime with magenta and green at the rim; aba gold concentric at 6 s, then a scattered
field of yellow, violet, green and red at 14 s; dnb magenta and violet with a lime shell at the rim. Busier and finer-grained than v0.11,
and no longer cream. The 6 s frames are still concentric (one source dominates early), the 14 s frames are a crowd of ripples.

**`montage-maxwell3-real.jpg`** (v0.11 four left · v0.12 four right) — v0.11: big bright multi-ring spirals filling the porthole at 40 and
60 s. v0.12: **dimmer**, the shells thin and dense at 40–60 s (CyborgNinja: many fine gold-green rings; WhoLikesToParty: orange-pink;
Malicious: pink-magenta), and at 80 s **separate small shells sitting at the rim sectors** — a ripple per sound, visibly, where v0.11 had
one spiral. Between hits the plane is the medium's dim disc and the glows.

**`montage-maxwell3.jpg`** — the CLOCK=1 pair: f360 near-identical blue spiral with coloured beads (the shells are the same launches);
f840 the waveguide's rails (v0.11) become the cavity's amber rim and a broad blue ring (v0.12). The `train('off')` pair: a blue spiral
(v0.11's carrier) vs black with twelve glows.

## Leans for the user's eye, ranked

1. **The rate** — 13–20 launches a second on house, 16–29 per 2 s on the real tracks. It is "every sound" taken literally, per band. If
   it reads as busy rather than as music: `REARM` 0.5 → 0.35 first (a band must fall further before it re-arms), then `HATA`.
2. **Brightness between hits** — dimmer than v0.11 by construction (no carrier lit the plane); `FGAIN` 6.0 was tuned for a lit plane.
   Centre luminance 0.13 / 0.19 at f360 / f840. `FGAIN` is the knob; a floor is not (it would be a carrier by another name).
3. **The hat is the last all-twelve source** — it injects into all twelve sectors in their own hues, the one thing left that pulls the
   plane toward a mixture. Weighting a hat by the chroma (`W12[k]`) is one line, not done (the plan said the hat stays).
4. **The waveguide** — hook-only now; the worker votes to put it back as a third geometry (the rails are the only non-concentric
   composition). The user's call after seeing the cavity — `montage-maxwell3-media.jpg`.
5. **The stray stroke** at WLTP 20 s outside the porthole — one contour escaped; a `strokes()` clip check, small.
6. **Tier-3 substeps 3 → 4** — ~0.25× of headroom under the 1.5× gate to make light a quarter faster at the top tier.
7. **`TSIGK` / `DIRTK`** — unproven on real music (flat on `#test`); a dubstep mp3 would exercise `DIRTK`.

## What was not done

No bid, no sweep, no Q trace, no NAV2 swap, no POLYTOPE, no TORUS2 fold, no 3D, no OKLCH, no fallback B. No dubstep. `det12.py`'s
`lr` gate stays in the script as a number, documented as unmeetable. The `CDIP` comment in `colour.js` describes v0.11's workaround
(history, left).

## Docs owed

**Paid this session:** HARNESS (the 500-line cap as a scene's budget, `lum.py` has no hue field, palettes are cosine so hues are
palette turns), CONTRACTS §1.4 (the release-on-`undefined` convention makes every pin hook a mutator when read), this audit, DECISIONS
§44, `tools/accept/v0.12/README.md`, the thumb, the release proven from `file://`.
**Owed:** a launch-weighted expected hue in `det12.py` (the right instrument for (a) above); the `CDIP` comment in `colour.js`.


## Addendum 2026-09-26 — the first dubstep: SeeYouDrop (Ray Volpe, FLAC)

Tracks moved out of the session scratchpad to `$MUSIC` (default `~/Music/RetinaRave`); `audit12.sh`/`det12.py` resolve the name with
or without its extension. `SeeYouDrop.flac` (16-bit/44.1 kHz, 2:38, 150 BPM) is the dubstep the audit above was still missing.
`audit12.sh SeeYouDrop mx3-syd` (`mx3-syd-{paused8s,20s,40s,60s,80s}.jpg`) + `det12.py SeeYouDrop mx3-syd` (`det12-syd.txt`), the
same clock and the same columns as the table above:

```
                 launches / 2 s        per band over 80 s (kick snare hat onset note)   engine kickCount   dkick ≤ .08   dbass ≤ .08
SeeYouDrop        0–21, median 17      401   14   46  111    8                            441 (Δ401)        80 %  (med .02)   73 %
```

- **The paused start holds on it:** `dn` 0 on both D lines inside the paused window (the same shape as the three above); every black
  frame inside the pause but seven in the first frames after `.play()`, none after 20 s; `errs []`, `medium` 0/1 only, tempo 150.0
  throughout, key G♯ minor from 20 s.
- **The per-note gate (≤ .08 on ≥ 70 %) is met** — the second track to meet it after Malicious, and for the same reason: kick-led,
  401 kick launches against 14 snares. The engine's `kickCount` grew by exactly the kick launches (441 − 40 = 401).
- **A double-time passage exists here.** `onsets` per 2 s sits at a median 5.6 and reads 11.9 on two consecutive samples (t 59.0 and
  61.2 s, 2.1×) — the fill into the breakdown (bass collapses .92 → .11 at 63 s, `build` climbs to .67, `arc` peak with `dropEnv` .78
  at 69.5 s). The launches did **not** double with it (`dn` 21 then 15 against a running 15–19): the 70 ms refractory and the 32-slot
  ring cap the scene's rate, so the double-time proof the audit asked for now has a real passage to run against — the question of
  whether MAXWELL *should* double there is open, and the retune constants (`REARM`, `HATA`) are where it would be answered.

## Addendum 2 (2026-09-26) — v0.12.1: thin waves, fat waves, the breakdown rule (DECISIONS §45)

The user's look at SeeYouDrop: "the part that was missing ripples was 50s-57s", "feel like there should be more skinnier waves,
(vs bass fatter waves)?". That window is the breakdown — `kick` 0 six seconds, `bass` .04, snare/hat under HI, mids and highs loud
— and v0.12's launches there were dim sector pulses on the ring (`montage-syd-breakdown.jpg`). Two retunes: a per-launch shell width
(`WSIG` per band, the kick x (1 + `KWB` x bass)) and the breakdown rule (`KSIL`: with the kick silent a second, every launch comes
from the centre, thin, at `ONSETC` .85 of a kick's current). After (`montage-syd-breakdown-v0121.jpg`): thin concentric shells all
through 52–58 s, the drop's kick rings wider from 58 s.

```
                 launches / 2 s        per band over 80 s (kick snare hat onset note)   engine kickCount   dkick ≤ .08   dbass ≤ .08
SeeYouDrop        0–25, median 18      406   15   47  139    8                            441 (Δ406)        80 %  (med .02)   78 %
Malicious         0–22, median 15      385    2   15   90   67                            (Δ385)            73 %  (med .03)   68 %
```

The per-note gate holds on both; Malicious fell from 79 % / 82 % because the centre's hue now follows the breakdown's loud sector
while `dkick` is measured against the last kick's note. Paused start on SeeYouDrop: black frames inside the pause only (six on
resume), `long` 0, `errs []`. s9 md5 re-based 95fd7d73 / 4e2108a7 (twice). Files: `det12-{syd,mal}-v0121.txt`,
`det12-syd-breakdown{,-v0121}.txt`, `breakdown-window.py`, `syd-v0121-{paused8s,20s,40s,60s,80s}.jpg`.

