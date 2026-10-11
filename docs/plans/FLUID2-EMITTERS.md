# FLUID2 — the emitter array: WHERE the music enters the pool (2026-10-11, the design; not built)

The user, after pulling the §116 band grammar (*"it moves too quickly"*): *"for the input that enters the scene — how is position
selected? I'm thinking of having an array of different sizes that line the sides and top where input is added to the scene (and
also inside of the scene — should be symmetric / tasteful); how would a professional light designer do it?"*

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
