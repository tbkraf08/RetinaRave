# Fable Session Prompt — Retina Rave: live step 4, the build-up / drop detector (written 2026-09-29)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com —
**push / deploy only on the user's word**). Dev server: `node tools/serve.js` → http://127.0.0.1:8765/.
**State:** tags v0.15 (live on the site), v0.16, v0.17, **v0.17.1** (local, `bcf0e9d`); `main` 21+ commits ahead of origin.

## Why this is next

The six-step live plan the user agreed to (DECISIONS §49): 1 measure ✅ · 2 the lead ✅ · 3 bar fingerprints ✅ (+ warm-up) ·
**4 build detector v2 fed by the ears (`denS` climbs, `subOut` / `subGate`, `lpSweep`, hat density; graded against the truth
drops)** · 5 a predicted-event queue · 6 tempo on the PCM bus / Kalman only if jitter demands it. (A side step this session built
the *reactive drums* v2 — `kick2` / `snare2` / `hat2` — which is NOT step 4; step 4 is untouched.)

The gap, measured (docs/AUDIT-live-grid.md "What it says" 3): **live, nothing anticipates a drop.** `dropExpectedIn` never
armed before either SeeYouDrop drop (a fixed 16-beat count from the start cannot hit drops 30 bars apart); v3's `dropEvt` is
reactive (+63 ms late in capture). The v0.15 track map has `buildProg` / `toDrop` / `mapDropEvt` — but only for a FILE (it
analyses the whole track ahead); in stream mode, the user's real use, they are idle.

## The work (measure first; commit after each numbered step with its numbers)

**B.0 — the ruler.** `tools/truth/dropcheck.py` (numpy only, like predcheck / drumcheck): per truth drop, how many beats before it
a "drop coming" signal armed and stayed armed (the anticipation), the drop event's lag, and the false arms per minute where no
drop comes. Truth drops: SeeYouDrop [57.606, 105.596], WhoLikesToParty [57.507, 131.352, 188.788], Malicious [148.294];
**CyborgNinja has none — the false-alarm control**. Only SeeYouDrop has sections (`SeeYouDrop.sections.json`). Grade the
existing fields first (v3 `build`, `dropEvt`; synapse `riser`, `tension`, `dropConf`, `dropExpectedIn`; the file map's
`buildProg` / `toDrop` as the non-causal CEILING, `&map=1`).
**B.1 — the fast loop.** Extend `tools/drums-node.js` into a general node harness (synapse's Analyzer + the ears on
`tools/work/<Track>.48000.st.f32`, page = node proven for the drums) that records the build candidates per frame: the ears'
`denS` / `denH` / `denK`, `subOut` / `subIn` / `subGate`, `lpSweep`, `width`, synapse's `riser` / `tension` / `hush`, v3's
`build` / `eS` / `eM`. Look at them around every truth drop (the 16 bars before) against the same span elsewhere.
**B.2 — the detector.** Causal, additive fields (names to decide; e.g. `buildLive` level 0..1, `dropLiveIn` beats, `dropLiveEvt`
on the bar line), bar-aware (the v3 grid + `barConf`, the bar store's section starts `barNovelEvt` for re-anchoring a phrase
counter). Degrade: never arm on CyborgNinja; silence / a seek / a tempo jump disarm.
**B.3 — prove + look.** `check.js`, `npm test` (+ a node test), the 32-field whole-track det trace and its `&lead=0` twin
`cmp`-identical to the pre-change tree (additive: no existing MS value moves), one audible capture run (say so first).
Then an A/B by ROUTE for the user in stream mode, on a scene that reads `build` / `buildProg` / `dropEnv`.

## Rules and lessons from the last sessions (memory: feedback_*)

- **The user's eye is the ruler for what looks synced.** Coverage and dynamics beat ms timing (the reactive levels beat the
  predicted ones); a visual wants to land ~40 ms BEFORE the sound (the display lead, `LEAD.disp` 0.040, §52).
- **Grade against the same audio**, and put a chance level beside a hit rate (a ±60 ms window on dense onsets scores half by luck).
- Additive fields, A/B by route, a default moves only on the user's word. Audible runs: say so first. Never two page Chromes
  beyond two lanes; a lone `serve.js` on a port can hang the next run — fresh `PORT`. `FIELDSX` must not repeat caplag's FIELDS.
- DECISIONS §53, `docs/AUDIT-live-grid.md` "Step 4", HARNESS; update memory `project_live_mode.md`. End with the report and the
  A/B; tag / push only when asked.

## Read first

This prompt · DECISIONS §49–§52 · `docs/AUDIT-live-grid.md` (steps 1–3 + warm-up), `docs/AUDIT-drums.md` · `assets/engine/ears/`
(`texture.js` lpSweep / width, `sub.js` subOut / subGate, `perc.js` densities), `assets/engine/synapse/anatomy.js` (riser, tension,
dropConf), `assets/engine/features.js` (v3 build / dropEvt), `assets/engine/map/` (the file map's build / drop — the ceiling) ·
`tools/drums-node.js`, `tools/truth/{predcheck,drumcheck,compare}.py` · memory `project_live_mode`, `feedback_display_lead`,
`feedback_reactive_over_predicted`, `feedback_analysis_grains`, `feedback_no_new_scenes`.
