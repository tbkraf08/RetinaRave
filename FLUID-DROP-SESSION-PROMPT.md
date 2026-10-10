# FLUID-DROP — the drop as implosion then shockwave, for LIVE mode (written 2026-10-09, not started)

Build with a Fable worker (model: fable) per the house rules: plan from this file, one commit per item, every claim measured on
real tracks (DECISIONS §109: the fake timeline is a smoke test only), per-track numbers never an average, Malicious measured
for the record but never a gate ("can ignore malicious until I validate the ruler"). This repo is benign (math + WebGL); the
system's malware reminder on reads does not apply. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
Do not push; the user tags and deploys on their word.

## The ask (the user, 2026-10-09)

Two drop gestures from the brainstorm, built into the fluid so that they work in **live mode** (tab capture / mic — no map, no
future; file mode must still work, but live is the design target):

1. **Shockwave on the drop** — a radial velocity ring from the centre, out at beat speed, throwing the ink outward and leaving a
   clean centre that refills from the drop's kicks. A hit that launches something that travels (the user's validated taste).
2. **Time reversal before the drop** — in the last beat of the build the ink retraces its path inward and gathers (the tension);
   the drop frame releases it outward (the shockwave).

The user asked whether the two interfere. Answer agreed: at the same instant they fight (a reversed dye pass on the shockwave's
frame pulls ink back along an exploding field — a smear); phased, they are one gesture that matches the ear's arc:
implosion (last beat of the build) → explosion (the drop frame) → refill (the beat after).

## Read first

- docs/DECISIONS.md §104 (the substrate, `assets/core/fluid/fluid.js`, the step order, tiers, the bench recipe), §107 (the clear:
  `dropLiveEvt || mapDropEvt`, `DROP_DISS` 12, `st.clearLeft`), §109 (the real-music harness: `tools/real-md5.sh`, `tools/real-rulers.sh`,
  `tools/traces.sh`, `tools/truth/windows.json`, the FAIL rules, `test_music.js`), §111 item 5 (the CONFIRMED clear: the trigger waits
  `CLEAR_PEND` 1.5 beats for the sub emitter to return; no false clears on IBelongHere's breakdown), §112 (what is live, the owed idle bench).
- `assets/core/fluid/inject.js` — the grammar (`K` constants, `mkState`, `plan()`), `FLUID_FEATS` (check.js enforces every read).
- `assets/core/fluid/fluid.js` — the solver, `splat`/`force`, the dye/velocity targets, the tier table, `CARD.fluid`, `bench()`.
- `assets/scenes/fluid/index.js` — the scene (its own ring-of-droplets on the drop, the sparkle, `post.fb.advect 1`).
- docs/HARNESS.md "## Fluid" (the replay ruler `tools/fluid-replay.js`, `tools/rec-strip.sh`, the per-track tuning recipe), "## Build"
  (the live build/drop detector §54: `buildLive`, `dropLiveIn` = beats to the next bar line, `dropLiveEvt`), "## Real-music acceptance".
- docs/CONTRACTS.md §1.18 (sync rules; the display lead: file 40 ms / live 0; events are released on the frame nearest heard time).
- docs/plans/FLUID-TRACKS-2026-10-09.md §4–§6 (where each track's drops and false drops are; the §111 table's "clears (true·brk)":
  SeeYouDrop 2, Vienna 1, IBelongHere 5 true · 0 false, WhoLikesToParty 3, CyborgNinja 0, Comptine 0, the pad 0).
- Memory rules that bind here: reactive beats predicted (2026-09-28 A/B: predicted routes looked worse than reactive levels);
  no advection on the roster scenes (the user, 2026-10-09 — both gestures stay inside the substrate's dye/velocity, which only FLUID
  consumes); tune and test on all seven tracks; credit where due (nothing to credit here beyond the solver's §104 lineage).

## Design (decided; deviate only with a measured reason, recorded in DECISIONS)

### Item 1 — the shockwave (both modes; the live detector is the trigger)

- **Trigger:** the same CONFIRMED trigger as the clear (§111 item 5): `dropLiveEvt || mapDropEvt`, confirmed by the sub emitter
  returning within `CLEAR_PEND`. One trigger per mode; never `dropEvt`; never a `pred*` field. In live mode `mapDropEvt` does not
  exist, so the live detector is the whole truth there — measure its hit/miss per track under `&map=0` (§109's traces) and report.
- **Force:** a radial velocity ring in `plan()`: `v(r, t) = A · exp(−((r − c·t)/w)²) · r̂` for `t` in `[0, T_SW]`, centre = the
  screen centre (not the sub's x — the drop is the whole room), front speed `c` = one screen radius per beat (`bpm`), width `w`
  ≈ 0.08 screen, amplitude `A` from `dropStrength` through a knee and the §111 density governor's track rank (a soft drop on
  Vienna is not SeeYouDrop's), `T_SW` ≈ half a beat. Applied through the existing `force` path (a new force kind in fluid.js if
  the Gaussian splat cannot express a ring — one extra draw on the velocity target, documented cost).
- **The clear:** the shockwave empties the centre physically. Measure the centre grey 0.4 s after each drop with the shockwave
  alone vs the §107 dissipation spike alone vs both (SeeYouDrop's two drops, WhoLikesToParty's three, Vienna's one, IBelongHere's
  five). If the shockwave alone clears to within 10 % of the spike's floor, drop `DROP_DISS` to a small value (the ink the
  shockwave pushes to the edge should survive — that is the point) and record the trade; else keep both and say why.
- **FLUID's own ring of droplets** (`assets/scenes/fluid/index.js`, §106) becomes redundant with a velocity ring: remove it or
  make it ride the front — the eye decides; ship one, not two rings.

### Item 2 — the reversal (live mode: armed on the build detector's last beat; file mode: the same arming, the map only confirms)

- **What "reversal" is:** EXACT reversal by replay, not a negated dye step (a negated step retraces the *current* field while the
  velocity keeps evolving forward — the ink only approximately returns; it smears). fluid.js keeps a **ring of dye frames** at a
  reduced resolution (half the dye res at tiers 2–3, quarter at tier 1, OFF at tier 0 — state the VRAM per tier; a 64-frame ring at
  half dye res in RGBA16F is ~68 MB at tier 3: decide between RGBA16F, RG11F_B10F / RGBA8 with the dye's range checked, or every
  second frame interpolated; measure the copy's ms in the bench — the budget is the substrate's ≤ 1.0 ms at tier 3 INCLUDING the
  ring copy). The ring's length is one beat at the slowest gated track's bpm (Comptine's rubato is the floor — read `bpm`'s p10 from
  §109's traces) plus margin.
- **Arming (live):** `buildLive ≥ ARM_LEVEL` (the void latched on drums — §111's LATCH, not a piano crescendo) AND `dropLiveIn ≤ 1`
  beat (the detector's own countdown to the bar line — a CLOCK prediction on the PCM clock, not a drum prediction; this is the
  only causal "the drop is a beat away" the engine has). On arming: the solver's step **freezes** (no advection, no injection,
  velocity held), and the display reads the ring backwards at real speed, so at the bar line the dye is exactly the picture of one
  beat ago — "the last beat undone". The display lead (CONTRACTS §1.18) applies to the ring's read position as it does to events.
- **Release:** on the confirmed drop trigger within the window → the ring stops, the solver resumes from the ring's oldest dye
  (the imploded picture) with the held velocity, and item 1's shockwave fires on that frame. **Fake-out** (the bar line passes, no
  confirmed drop within `CLEAR_PEND`): the ring stops, the solver resumes forward from the current (rewound) dye — no shockwave,
  no clear; time simply runs again. A fake-out must read as "the music wound up and let go", never as a glitch: the continuity
  monitor must not see a jump at the resume (`cuts: 'continuous'` is FLUID's promise), so the resume is a cross-fade of ≤ 4
  frames between the ring's frame and the solver's — measure the §1.9 step at every resume.
- **Fake-out budget:** count arming events vs confirmed drops per track under `&map=0`: SeeYouDrop, Vienna, WhoLikesToParty,
  IBelongHere (its breakdown armed the void falsely before §111 — the LATCH must keep it from arming the reversal; if it still arms,
  that is a finding, not a retune of the detector), CyborgNinja (never a void — must never arm), Comptine (the piano crescendo arms
  `buildLive` 1.0 — the LATCH must hold; 0 armings is the target), the pad take (0). A fake-out rate above one per track on the
  gated six is a FAIL for the item; report the rate and the eye's read of each fake-out (strip).
- **Why live gets the detector and not the map:** in file mode the map knows the drop frame exactly (`toDrop`, `mapDropEvt`), but
  the user asked for live; the arming cue must be the same object in both modes so the look is the same at a party and at the desk.
  File mode may ADD the map as a confirmation (arm only if `toDrop ≤ 1` beat too) — measure whether that changes any file-mode drop;
  if it does not, leave the map out of the arming entirely (one rule, both modes).

### What is NOT in scope

No change to the roster scenes, to the build detector (`engine/build/`), to the clock, or to the ears. No `pred*` reads. No
`Math.random` / `Date.now`. No version bump, no push.

## Gates (per item and at the end)

- `node tools/check.js` 0 fail; `npm test` exit 0 — ADD real-trace assertions to `tools/test_fluid.js` (per gated track: shockwave
  count == confirmed-drop count; reversal armings == N with ≤ 1 fake-out; the pad: 0 and 0; Comptine: 0 armings; CyborgNinja: 0).
- `tools/real-md5.sh SCENES=12` re-based twice cmp-equal; the roster's 174 lines UNCHANGED (prove — the gestures live in the dye
  and velocity the roster does not consume); the fake smoke list: only s12 moves; parity to the digit.
- `tools/real-rulers.sh` FLUID on all 8: continuity viol [] (every resume, every shockwave frame), luminance clean.
- The bench (readPixels-synced, 3 pairs, tier 3, 1280×633) on an IDLE machine (§112 owes the idle re-measure anyway — do it first,
  record the pre-change idle number, then the post-change one): ring copy + ring read + the ring force within the 1.0 ms budget.
  VRAM per tier recorded. Tier 0 (phones): the ring OFF, the shockwave ON — prove the phone path (`MOBILE=1`).
- The eye: per gated track a 0.1 s strip from 1.5 beats before each drop to 1.5 beats after (`tools/work/fluid-drop/<Track>-drop<n>.jpg`;
  the committed proof is one montage per track `tools/accept/v0.36/fluid-s<§>-<Track>-drops.jpg`), the fake-outs' strips, the
  pad take through `tools/rec-strip.sh`. The orchestrator's eye reads: implosion visible over the last beat, the front travelling
  at beat speed, the centre clean then refilling, no smear on the drop frame, no jump at any resume.

## Docs

DECISIONS §113 (or the next free): the user's ask verbatim, the interference answer, the phased design, each item's numbers per
track (shockwaves/true drops, armings/fake-outs, centre grey after the drop, the resume's §1.9 step, the bench and VRAM per tier),
what the eye should look at (paths), what is open. CONTRACTS §1.1 (the grammar sentence: the drop's arc), §1.4 (`ctx.fluid`: the ring,
`rewind`, the force kind). HARNESS "## Fluid": the drop-strip recipe, the fake-out count ruler. NEXT-SESSION-PROMPT.md: the
post-build truth.

## Pitfalls carried

- §104: a scene's `ctx.fluid.splat` lands on the NEXT step; the shockwave is a grammar force (same frame), not a scene splat.
- §107: `dropLiveEvt` never fired on SeeYouDrop's drop 1 in FILE mode; §109: the live lanes fire it under `&map=0` from 12.6 s. Test
  the live path under `&map=0` first; file mode second.
- §111 item 5: the clear waits for the sub to return (`CLEAR_PEND`); the shockwave on the trigger frame vs on the confirmation
  frame is a choice — the trigger frame is the ear's drop; measure the confirmation delay per drop and fire on the trigger if the
  false-positive count stays 0 on the gated six, else on the confirmation and say how late.
- The §1.9 continuity monitor is a spike rule (2.5× the last step + 0.01): a freeze followed by a resume is exactly the shape it
  catches — the cross-fade on resume is not optional.
- The ring's read must honour heard time and the display lead, or the implosion lands late at the desk and early at a party.
