# FLUID2 — the emitter array: WHERE the music enters the pool (2026-10-11, the design; not built)

The user, after pulling the §116 band grammar (*"it moves too quickly"*): *"for the input that enters the scene — how is position
selected? I'm thinking of having an array of different sizes that line the sides and top where input is added to the scene (and
also inside of the scene — should be symmetric / tasteful); how would a professional light designer do it?"*

## 0. Status (2026-10-11, DECISIONS §121) — BUILT in one step, the user's five decisions folded in

The user, on §3's open questions and the proposal: *"remove the shockwave; add channel for vocals; pitch seems more like a vertical move
rather than horizontal slide (more for vocals or melodies); rig should be invisible; color should be based on the coloring key (ie musical
note) of circle of fifths"*. So, against the proposal below: **no shockwave** (the §113 ring is gone under FLUID2 — the clear stays, and
the blinder is the drop's cue); **a LEAD channel** (the vocal / melody line: the strongest note above the bass, `interval` over the bass
note — a chroma proxy; the S5b vocal detector `voxS / voxHz` is two reads to swap in), centre stage, **its HEIGHT its pitch** (the scale
degree above the tonic, LEAD_Y0 .3 → LEAD_Y1 .85, eased LEAD_TAU .35 s); **the sub does NOT snap to a fifths mouth** — pitch is vertical,
so the sub's ink enters at the centre wash (the inner pair joining in a build) and the KICK's mouth is the chase's; **the rig is not drawn**;
**every splat in the hue of its note** on the circle of fifths (keycolour's wheel, the mode's pull; the base colour's luminance sum kept,
so the ink budget is the base's) — the sub and the kick in the bass note's, the lead in its own, the rest in the key's. E1–E4 landed as
one grammar (`core/fluid/inject2.js`): the rig table, the floor / side / top chases, the density by tension and build, the blinder.

The eight-track table (no GL; `tools/truth/traces/*-map1.json` + the pad take; the numbers §121 stands on):

| track | frames | music s | Σ ink rig / base (NOTE_COL 1: the note hues luminance) | clears | kicks C · iL · iR · oL · oR (pairs) | outer before 1st clear | snare q0·q1·q2·q3 | beams 0..6 | lead on % · deg bins · y p10/p50/p90 | lead max step | clears = blinders | quad % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Comptine-map1 | 6601 | 110 | 1.000 | 0 | 64 · 79 · 78 · 7 · 7 (57) | 7 | 66·75·56·45 | 12 6 11 6 12 5 12 | 88 · 12 · 0.49/0.59/0.68 | 0.0192 | 0 = 0 | 45 |
| CyborgNinja-map1 | 6601 | 110 | 1.000 | 0 | 462 · 444 · 463 · 0 · 0 (283) | 0 | 156·203·153·161 | 110 142 110 133 112 137 108 | 51 · 12 · 0.41/0.54/0.70 | 0.0256 | 0 = 0 | 30 |
| IBelongHere-map1 | 6601 | 110 | 1.000 | 3 | 191 · 208 · 202 · 5 · 5 (137) | 0 | 72·73·84·68 | 51 57 49 53 53 52 49 | 86 · 12 · 0.48/0.63/0.74 | 0.0237 | 3 = 3 | 46 |
| Malicious-map1 | 6601 | 110 | 1.000 | 0 | 45 · 52 · 36 · 0 · 0 (23) | 0 | 39·32·20·21 | 21 19 22 21 18 20 22 | 70 · 12 · 0.50/0.65/0.75 | 0.0228 | 0 = 0 | 44 |
| RaindropsOnRoses-map1 | 6601 | 110 | 1.000 | 3 | 120 · 135 · 133 · 5 · 5 (93) | 0 | 85·93·83·67 | 77 101 82 95 82 98 81 | 83 · 12 · 0.52/0.65/0.71 | 0.0210 | 3 = 3 | 45 |
| SeeYouDrop-map1 | 6601 | 110 | 1.000 | 2 | 170 · 176 · 186 · 7 · 7 (108) | 7 | 84·85·89·46 | 38 37 40 38 35 37 34 | 83 · 12 · 0.42/0.49/0.65 | 0.0255 | 2 = 2 | 48 |
| Vienna-map1 | 6601 | 110 | 1.000 | 1 | 80 · 96 · 98 · 3 · 3 (47) | 3 | 32·61·36·18 | 45 65 49 63 41 63 45 | 67 · 12 · 0.49/0.62/0.77 | 0.0237 | 1 = 1 | 40 |
| WhoLikesToParty-map1 | 6601 | 110 | 1.000 | 1 | 440 · 454 · 460 · 0 · 0 (267) | 0 | 140·145·125·135 | 83 113 88 120 82 116 83 | 61 · 12 · 0.40/0.62/0.75 | 0.0256 | 1 = 1 | 24 |
| rec-map0 | 1465 | 22 | 1.000 | 0 | 0 · 3 · 0 · 0 · 0 (0) | 0 | 1·5·1·2 | 0 3 0 2 0 2 0 | 83 · 7 · 0.46/0.64/0.76 | 0.0161 | 0 = 0 | 52 |

Read: Σ area-weighted ink = the base's on every trace (1.000: the WHERE moved, the HOW MUCH did not); the inner floor pair fires equally
(L / R within 7 %); the outer pair opens only on tension / build (Comptine's 7 and SeeYouDrop's 7 are build frames above OUTER_T);
the snare's height walks all four quarters; all seven beams used, odd / even by the bar; the lead is on 51–88 % of the music frames with
12 degree bins on every track (the chroma's strongest-other-note is restless — hence the .35 s glide; the vocal detector is the real
fix); the blinder fires exactly on the clears. The eye: `tools/accept/v0.38/fluid2-s121-*-montage.jpg` (FLUID left, FLUID2 right at the same frames) — DECISIONS §121 reads them.

## 1. How position is selected today (core/fluid/inject.js — the pool grammar, FLUID and FLUID2 alike)

One point per channel; only the sub's x moves, on a pitch axis. Positions in uv (0..1, y up).

| channel | x | y | size (× RADIUS) | the rule |
|---|---|---|---|---|
| sub (the ink's entry) | the bass note's place on the circle of fifths RELATIVE TO THE TONIC: tonic at the centre, its fifth one sector right, its fourth one left, the tritone at the walls (§111 item 6) | .12 + .25 · register | 1–1.5 (a lower sub, a wider mouth) | continuous: a sliding point |
| kick | the sub's x (or the harmony's place in the harmonic branch) | .06 (the floor) | 2 | an impulse up from the floor under the sub |
| snare / chord | .3 and .7 — a fixed pair | .5 | 1 | two inward shears, always the same two points |
| hats | hash(beatCount·7 + i) — pseudo-random across the top | .9 | .5 | up to 3 droplets, no two alike |
| mids (the floor cloud) | the tonic's place (the centre) | .5 | 2 | dye only |
| the drop | the screen's centre | — | the ring | the §113 shockwave outward |
| FLUID's sparkle | the golden-ratio walk .15..85 | .93 | .4 | one per 50 ms while the hats are up |

So: a pitch axis for the bass, a fixed pair for the snare, random for the hats, the centre for everything harmonic. Nothing is a RIG:
no two channels share a position, no position is reused by pattern, nothing is symmetric by construction except the snare pair.

## 2. How a lighting designer does it

A lighting designer never places a fixture per cue. They hang a **plot** once — a fixed, symmetric rig — and the show is **which
fixtures fire, in what pattern, at what intensity**. The vocabulary, and what each maps to here:

1. **The plot is fixed and symmetric about the centre line.** Front truss, mid truss, back truss, side ladders, floor cans. Mirror
   pairs are addressed AS pairs. → an emitter table on the card, symmetric about x .5, never a hashed x.
2. **Three sizes, graded by role.** Washes (few, wide, soft), spots (medium), beams (many, tight, hard). The big ones sit low and
   central, the small ones high and wide. → wash mouths on the floor, spot mouths on the sides, beam mouths across the top.
3. **Systems, not fixtures.** Fixtures are grouped by function — key/wash, accents, texture, effects — and a musical element drives a
   SYSTEM. → the sub and the kick own the floor system, the snare the sides, the hats the top, the mids the interior, the drop all.
4. **A hit advances a chase; it does not pick a fixture.** The classic patterns: odds / evens, inside → out, outside → in, left → right
   sweep, ping-pong (L then R), random-no-repeat, ALL (the blinder). The pattern changes on the phrase (8 / 16 bars), the step on the
   beat. → a per-system pattern chosen on `bar` / `phrase16Pos`, stepped by the channel's own events.
5. **Hold something back.** The verse uses the inner mouths; the build adds mouths and speeds the chase; the drop is ALL ON. Outer
   fixtures that have not fired in the verse are what makes the drop read. → density by `buildLive` / `tension`, the outer mouths
   reserved for the drop, the shockwave = the all-on cue.
6. **Symmetry with a deliberate break.** Every off-centre fire has a mirror partner within a beat unless the pattern IS a sweep;
   the break (one side alone) is an accent, used sparingly.
7. **Low energy from the floor, high energy from above.** Floor cans uplight the verse; the beams through haze are the peak. The
   engine already does this on y (register → y); the rig keeps it: bass low, hats high.
8. **Pitch is not position.** LDs map instruments to systems, not notes to places. But the fifths axis is this engine's own grammar
   (§111) and the user validated it — keep it as the SUB's "where", **snapped to the nearest floor mouth** so the ink enters from one of
   the rig's mouths instead of sliding.

## 3. The rig (proposal — the user chooses; every number a K2 knob, the table on FLUID2's card)

Symmetric about x = .5; y up; sizes × RADIUS. 5 + 6 + 7 + 5 = 23 mouths, never all lit except on the drop.

| system | mouths | x | y | size | fires on | pattern |
|---|---|---|---|---|---|---|
| FLOOR (washes) | 5 | .5 ± {0, .2, .4} | .06 | 2 · 1.5 · 1 (centre biggest) | the sub (dye + lift), the kick (the impulse) | the sub's fifths-relative x SNAPPED to the nearest mouth (tonic → centre, fifth → +.2, fourth → −.2, far → ±.4); the kick from the sub's mouth, or ping-pong over the mirror pair in a groove |
| SIDES (spots) | 3 + 3 | .08 / .92 | .3 · .5 · .7 | 1 | the snare (a mirror PAIR, inward — today's gesture kept), the chord (the pair at the centroid's height) | inside → out over the phrase: the middle pair, then the upper, then the lower; a fill steps every hit |
| TOP (beams) | 7 | .5 ± {0, .14, .28, .42} | .92 | .5 | the hats (droplets falling) | odds / evens on alternate beats; outside → in on a fill; random-no-repeat as the verse's default |
| INTERIOR (the quad) | 4 + the centre | .5 ± .2 | .5 ± .18 | 1.5 (dye only, as the floor cloud) | the mids' floor (the centre, as today); the harmonic branch's hits on the quad | the quad joins as `tension` rises (one corner per quarter), the centre alone in a breakdown |
| ALL | 23 | — | — | — | the confirmed drop | the blinder: every mouth one pulse on the clear's frame, with the §113 shockwave (the all-on cue) |

**Density** (the LD's "hold something back"): verse = centre + the inner floor pair + the middle side pair + the odd beams; build =
the next ring joins every quarter of `buildLive`, the chase steps every half-beat instead of every beat; drop = ALL; breakdown = the
centre and the top only. **Symmetry**: a mirror partner within a beat on every off-centre fire; the sweep patterns are the one exception.

Optional, display only: FLUID2's show pass draws the mouths as dim ports (the rig visible), lit for a frame when they fire.

## 4. The steps (one worker per step; every claim measured on the eight tracks per CONTRACTS §1.1 — no Raindrops-only exception this time)

- **E1 the rig table + the floor system**: `RIG` on the card, `inject2.js` edits the base plan by kind — the sub and the kick re-placed on
  the snapped floor mouth, everything else the base's. Ruler: `x sub p10/p50/p90` collapses to the five mouths' x on every track; the ink
  rate within 5 % of the base's.
- **E2 the sides + the top as chases**: the snare pair's height by the phrase, the hats on odds / evens and the fill's outside → in.
  Ruler: the hats' x histogram on the seven beams only; the snare's y steps on `phrase16Pos` wraps.
- **E3 density by the arc**: the quad on `tension`, the outer mouths held for the drop, the breakdown's centre + top. Ruler: mouths
  active per bar vs `buildLive` on the four dropping tracks; outer-floor fires before the drop = 0.
- **E4 the blinder**: every mouth one pulse on the clear's frame. Ruler: one frame per confirmed drop, nowhere else; the shockwave's
  md5s on FLUID unmoved (the grammar is FLUID2's alone).

What the user decides first: (a) which edges carry mouths — floor + sides + top as above, or floor + top only; (b) snap the sub to
the mouths, or keep it sliding and let only the drums use the rig; (c) draw the rig or keep it invisible.
