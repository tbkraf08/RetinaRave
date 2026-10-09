# GRAMMAR — a fixed cross-scene visual grammar (saved 2026-10-09, not started)

The user asked (2026-10-09) to save this for a later session, after the fluid substrate work
(docs/plans/FLUID-PLAN.md, DECISIONS §104+). Do not start it unasked.

## The claim

The engine publishes ~150 fields (docs/CONTRACTS.md §1, assets/engine/feats.js, assets/engine/ears/feats.js).
The eye reads about six pre-attentive channels at once: position, size, hue, motion onset, fullness/density,
texture. Every scene builds its own private mapping of a dozen fields onto those channels, so the viewer
relearns the code at every scene switch. The user's validated verdicts already say what the grammar is:

- coverage + dynamics beat ms timing (feedback_reactive_over_predicted, 2026-09-28)
- reactive lanes beat predicted ones (same)
- TORUS2 is the favourite because hits launch something that then travels at beat speed — timing is carried
  by geometry, not by a flash (project_music_library, 2026-09-27)
- "on time" for the eye is ~40 ms early in file mode, 0 in stream (feedback_display_lead)

## The grammar to pin (one channel per musical question)

| question | channel | engine source |
|---|---|---|
| WHEN did something happen | motion onset (a thing starts moving / a front launches) | kickEvt / snareEvt / hatEvt, kick2 / snare2 / hat2 |
| HOW HARD | size (√ of an amp when the field names a height — §74) | kickAmp, snareAmp |
| WHAT (which instrument / which note) | position, then hue | register → y; pitch class / circle of fifths → x; key → hue anchor, modeShade warm/cool |
| WHERE in the phrase | fullness / memory (how much of the screen is still lit by the past) | buildLive, tongueAmbig (gated by tongueOn), dropLiveEvt clears, hush/calm empties |
| HOW ROUGH | texture (laminar ↔ turbulent) | tension (30 s relative), lpSweep through the knee |
| HOW LOUD, overall | brightness floor, not size | loudRel (gain-invariant) |

Rules carried from CONTRACTS §1.18: one musical element → one visual channel; never size from `*Vel` on its
event frame; `dropEvt` is not a clear; `tension` is not a dream detector.

## The work

1. Write the grammar into docs/CONTRACTS.md as a new section (§1.19 "The grammar") with the table above and
   the measured reasons (link the DECISIONS sections: §57/§58 lanes, §70/§73/§74 amp vs vel, §79/§81 tension,
   §93–§95 roster).
2. Audit the three roster scenes (NAV id 0, DUST id 1, TORUS2 id 3) against it: for each channel, which field
   drives it today, and where two musical things share a channel or one thing is split over two. Write
   docs/plans/GRAMMAR-AUDIT.md. Montages at the SeeYouDrop windows (intro 0:10, groove 0:58, build 1:30,
   drop 1:45) per docs/HARNESS.md "## Headless Chrome".
3. Propose per-scene retunes (NOT new scenes) that close the gaps, smallest first; the fluid substrate's
   inject.js (assets/core/fluid/inject.js, if step 1 of FLUID-PLAN shipped) is the reference implementation
   of the grammar and scenes can read its fields instead of re-mapping.
4. Each retune is a separate commit with the user's eye as the gate (the user reports in track time).

## Pitfalls

- The user's eye, not the ruler, decides a look (feedback_display_lead). Montages cannot judge a per-beat
  motion; use per-frame windows (nav2-window.py, perbeat13.py) for timing claims.
- No new scenes without the user's ask (feedback_no_new_scenes).
- MAXWELL v0.12 and POLYTOPE v0.9 are validated — do not retune unasked.
