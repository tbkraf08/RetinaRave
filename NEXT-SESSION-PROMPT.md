# Next session — Retina Rave (rewritten 2026-10-10 late: **FLUID2 built S0–S7 on branch `fluid2`, on RaindropsOnRoses only — NOT tagged, NOT pushed**)

**The live tree is v0.36** (tag `v0.36`, 2026-10-10 ~01:45 EDT: §113 the shockwave, §114 FLUID on the bid, §115 the release; the previous version of
this file carries its validation list — folded in below as item 5). **Since then, on branch `fluid2` (worktree `RetinaRave-wt-fluid2`), DECISIONS §116
S0–S7:** FLUID2, scene id 13 — FLUID's pool under a second grammar (`core/fluid/inject2.js`, composing on inject.js's shared base state through the
card's `fluid: { grammar: 'bands' }` slot) in which **each band is a different KIND of coupling**: the sub a FIELD (the whole pool heaves with the sub
envelope — S1), the kick a MASS that travels (a vortex pair seeded inward — S2), the mids the MATERIAL (the vorticity confinement from the mid band's
own range; the snare one jet from a wall — S3), the highs the SURFACE (a hashed grain on the velocity, a dye dip per hat, the specular from `highS` —
S4), the voice a PEN (the harmony's angle drawn on the tonic axis as the stand-in; the vocal feature deferred — S5), TIME the solver's own clock (it
breathes with the sub, slows in the latched void, bursts on the drop — S6). S7 closed it: the arc strip FLUID vs FLUID2 across Raindrops' moments in both
map modes, the per-track table's band columns, the S0 fade finding fixed, the gates, the docs. **main has merged S0–S6 (ce5ab6f); S7 waits on `fluid2`
for the orchestrator's merge.** The user: *"clone fluid -> do work in fluid2 -> do the different bands intuitively; explore: point sources and time"*,
then *"only tune with Raindrops, don't do full sweep"*.

## The first thing before ANY tag: the seven-track sweep (owed, on the user's word deferred — not skipped)
Every K2 in `inject2.js` was tuned and proven on RaindropsOnRoses alone (from 24 s, the live lanes first). The other seven tracks are MEASURED by the
no-GL table (`INJECT=assets/core/fluid/inject2.js node tools/fluid-tracks.js`, the `bands` column — §116 S7 carries the rows) and UNTUNED. The sweep
(FLUID2-PLAN §4 S7 as planned): the table beside grammar 1's per track → the strips per band on each track (HARNESS "## Fluid", the FLUID2 recipe) →
retune K2 where a track reads outside the others' band (the §111 rule: a change on ≥ 3 of the six, Malicious never a gate) → the full references
(`SCENES=13 tools/real-md5.sh` 58 lines twice cmp-equal into `real-md5-v037.txt`; `real-rulers.sh` 8 rows; the roster 174 / 174) → the per-track
montages. What the table already says (§116 S7): the breath needs a sub that moves (CyborgNinja / Comptine / Malicious never leave dtSim 1 — no sub
cut, no latched void on their traces); IBelongHere's clock reaches .5 in its breakdown (latched 10 %) and bursts on five file-map clears; the grain's p50
reads .75 / .79 on SeeYouDrop / CyborgNinja against Raindrops' .41 (the high band's level, `HI_SRC` 0 — a track's own range is the `HI_SRC` 1 switch) — the
first knob to re-read per track.

## What the user validates at home (every remark in track time = a retune request; DECISIONS §116 S7 "The close" has the full list with paths)
1. **FLUID2 on RaindropsOnRoses from 24 s** — `https://retinarave.com/#scene=13` once deployed; today `http://localhost:8765/#scene=13` on the dev
   server from the `fluid2` worktree's tree — at **27.4** (the 808 enters: the pool heaves, the pair launches), **41.1** (drop 1: the clear + the
   shockwave, the clock's burst on the file map), **55–57** (the sub pins: the breath per attack), **65.4–68.6** (the two-bar cut: the pool stills and
   its clock slackens to ~.84, then the return at 1.1–1.2× — does it read as the music or as a framerate wobble?), **84** (the groove: the pair per
   kick, the snare jets from the walls), **111–137** (the breakdown: the pen draws the chords, the pads at half time), **137.1** (drop 3), **180+**.
   The references: `tools/accept/v0.37/fluid2-s116-s7-RaindropsOnRoses-arc.jpg` (the live lanes) and `-arc-map1.jpg` (the file map).
2. **The time switches** (`&k2=` on the live page): the clock OFF `#scene=13&k2={"DT_SUB":0,"DT_VOID":1,"DT_DROP":0}` · the breath alone
   `#scene=13&k2={"DT_VOID":1,"DT_DROP":0}` · with the level `#scene=13&k2={"DT_LVL":0.4}` · the honest drop `#scene=13&k2={"DT_DROP":1}` · the
   pulse `#scene=13&k2={"DT_BEAT":0.3}` (DECISIONS §116 S6 has the whole list).
3. **The switch itself:** `n` from FLUID (12) to FLUID2 (13) mid-groove — the pool must not blink (S7: the mixs fade's mid-dip is fixed; the hard cut
   starts the exposure at the frame's light).
4. **The pad take** (the user's own recording replayed through scene 13: `tools/work/rec/s7-pad-s13/grey.txt`): the pen in place of the floor cloud
   reads 3.0 grey under FLUID's on average (−5.7 at most, 3–9 s: the pen is a thinner mark than the floor cloud), the same shape, the p99s alike.
5. Carried from v0.36 (unvalidated): the shockwave on the drop in FLUID (the four dropping tracks), FLUID in the rotation, the drop's flash with the ring
   and no droplets; from v0.35: FLUID on every track, Vienna's dream, Comptine's melody, the glitch switch.

## The saved pieces — do not start unasked
- **FLUID-DROP item 2, the reversal** (`FLUID-DROP-SESSION-PROMPT.md`; the note where it meets FLUID2's `composeDt` and the pen is in the file).
- **S5b, the vocal-presence feature** (one extractor session: `voxS / voxHz / voxConf` as §116 S5 specified them; `PEN_SRC 2` is reserved).
- **FLUID2 on the bid / a landing tile** — the user's word only (forced-only today: `score()` 0).
- **The switches left at 0 with their numbers** (§116): `SWIRL`, `FLIP`, `CURL_MASK`, `JIT_V`, `PEN_V`, `DT_LVL` (.4 = +9–14 % on every groove), `DT_BEAT`
  (.3 = a ±15 % tick), `DT_DROP 1` (the substeps, +.5 ms for one beat).
- Open findings: the live detector misses Raindrops' drops 1 / 2 (the sub cuts leave no "bass came back" edge — `engine/build`, not the grammar); the
  void term arms 2.1 s into the cut (the breath reads the cut, the void cannot); a tier-0 phone measure of the whole band grammar; `DROP_DISS` 6 after
  item 2; §115's own list (the idle bench, IBelongHere's late live return, Vienna's bar 40, the director's per-track sweep).

## Rules (unchanged)
The orchestrator delegates; planners AND builders are `model: fable`; push / tag / deploy only on the user's word; the user's dev server is
`node tools/serve.js` on **8765 with no port in its command line — never `pkill -f serve.js`, kill test servers by pid only** (and never
`pgrep -f '<pattern>' | xargs kill` from a shell whose own command line contains the pattern — it kills the shell; `pgrep -f 'tools/serve.js 8975$'`);
one page Chrome per worker, two workers at most in parallel on disjoint files; **two workers committing in one tree fold each other's hunks —
give a builder its own `git worktree` + branch and merge**; every before/after pair in an isolated worktree; never `trackmap.py <T> --pcm` on
any library track; no audible runs without saying so; no `Math.random` / `Date.now`; commit per step with the numbers; DECISIONS §118+;
`node tools/license.js` on any new public file; **a grammar change is tuned and proven on every library track** (CONTRACTS §1.1, HARNESS "## Fluid") —
FLUID2 is the one standing exception, on the user's word, and the sweep above closes it; the tag ritual is HARNESS "## Release notes" (bump both
versions → the entry → `npm run build` → check → the gates → the frozen page → commit, `git tag -a`, push; poll, never re-push); **a scene entering the
rotation is proven by the director traces on house + aba**. Tracks (eight): `~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3,
Malicious.mp3, Vienna.flac, IBelongHere.flac, Comptine.flac, RaindropsOnRoses.flac}` (Raindrops from 24 s); the user's pad take
`tools/work/fluid-diag/music/rec.wav`. The user's words that still govern: reactive over predicted · "the double time should be accenting rather than
driving" · a look remark = a retune request · plan AND build with Fable · "lets go one scene at a time" · "only tune with Raindrops, don't do full sweep".
