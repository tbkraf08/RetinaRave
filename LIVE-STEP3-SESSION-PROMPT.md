# Fable Session Prompt — Retina Rave v0.17: live step 3, bar fingerprints (predict the next bar, know a return when it starts) (written 2026-09-28, after v0.16)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com —
**push / deploy only on the user's word**). **State:** v0.16 is tagged locally (not pushed, not deployed): live steps 1 and 2 —
the clocks measured, the capture lag measured, and **the lead** (`engine/lead.js`, on by default) that publishes the beat / bar /
phrase clocks on heard time. The user watched it in stream mode: "looks good".

**The user's words that set this work (2026-09-28, verbatim):**
> "focus on live mode (while file mode is useful, I don't expect to have the file normally)"
> (to the six-step live plan) "yes" · (to step 2) "yes"
> "I've reviewed in stream mode and looks good; commit and tag work completed so far then write prompt to resume on step 3"

**The six-step live plan** (agreed; one step per session, each measured before and after): 1 measure ✅ · 2 run the clocks ahead
(the lead) ✅ · **3 bar fingerprints → next-bar hit prediction + faster returns (this session)** · 4 build detector v2 fed by the
ears (`denS` climbs, `subOut` / `subGate`, `lpSweep`, hat density; graded against the truth drops) · 5 a predicted-event queue
(beats, downbeats, predicted hits, drop lines, each with a confidence) · 6 tempo on the PCM bus / a Kalman filter — only if a
ruler shows jitter that needs it.

**Live mode is the target.** The v0.15 track map (`mapOn`, `toDrop`, `mapDropEvt`, the non-causal file-mode kicks) does not exist
live: judge everything by the causal path — v3 clock, synapse grid, the causal ears in `engine/ears/`, and the lead.

## Why step 3 (the numbers that ask for it — `docs/AUDIT-live-grid.md`)

- **A reaction cannot be on time in capture.** The ears' kick / snare / hat fire +52 / +41 / +38 ms after the listener heard the
  hit (first frame, capture, SeeYouDrop 25–45 s), at any `&sync`; the ages *place* a motion right (+7 / −1 / 0 ms with sync 27) but
  cannot *start* it before the audio arrives. The beat is now on time because it is predictable (step 2). The hits are
  predictable too — electronic music repeats bar by bar — and prediction is the only way to put them on time.
- **Sections are recognised late or not at all live.** Synapse names a section 4–8 beats after its boundary (DECISIONS §10);
  `boundaryEvt` hit 0 of 11 annotated boundaries on SeeYouDrop; `dropExpectedIn` never armed before either drop; the 16-beat
  phrase line missed both drops (they are 30 bars apart — a fixed count from the start cannot hit both).
- **The grid is usable as a gate:** the synapse bar line is right 87–93 % of the time in the grooves and `barConf` separates
  right from wrong (median 0.98–0.99 vs 0.00–0.22). The v3 / synapse tempo is right ≥ 95 % of frames on 3 of 4 tracks.

## Read first, in this order

This prompt · `docs/AUDIT-live-grid.md` (step 1 + step 2, every number above) · `docs/DECISIONS.md` §49 (v0.16, the two leans) and
§48 (v0.15: the ears, the file source, the map) · `assets/engine/lead.js` (72 lines: the raw / published swap and where it runs in
`engine.js` `frame()`) · `assets/engine/engine.js` (the frame order: `leadRestore` → extractor → stages → `leadApply` → fix →
groove → trace) · `assets/engine/features-ears.js` + `engine/ears/ears.js` (the model for a pure-DSP stage: no DOM, no clock,
node-testable; the release rule; the map override in file mode) · `assets/engine/features-synapse.js` (the grid fields, `an.o4`
/ `o16` / `o32` anchors) · `assets/engine/synapse/structure.js` (per-beat 23-dim features, Foote, the section fingerprints — reuse,
do not re-derive) · `docs/CONTRACTS.md` §1.18 (sync rules, including the lead bullet) and Appendix A (every MS name — new names
must not collide: `bar`, `repeat`, `sectionId`, `kick`, `snare`, `hat` are taken) · `docs/HARNESS.md` ("File source", the capture
paragraph with `caplag.js`, "What to re-prove") · `tools/truth/gridcheck.py`, `compare.py`, `trackmap.py` docstring ·
`tools/truth/SeeYouDrop.txt` + `SeeYouDrop.sections.json` · memory `~/.claude/projects/-home-toma-Documents-Kraftek-RetinaRave/
memory/{project_live_mode,project_music_library,feedback_analysis_grains,feedback_no_new_scenes}.md`.

## The work, in order (commit after each numbered step; measure before building)

**3.0 — the live path on a file (`&map=0`).** In file mode `features-ears.js` replaces the causal kicks / snares / hats / sub
with the map's NON-causal ones (`mapOverride`). Anything built on those cheats: it would see the whole track. Add `&map=0` (under
`core/harness.js` like `&lead`), which skips `armMap` / the override so a file runs the **causal** ears — the live path, but
deterministic under `CLOCK=1` (`tools/filetrace.js … '&map=0'`). Prove: map-on traces unchanged byte for byte (the default); with
`&map=0` SeeYouDrop 25–45 s kick F (placed) ≈ 0.77–0.79 (capture with the bias removed read 0.77; v0.15 pass 1 read 0.79). This is
the development harness for the whole session; capture runs are the confirmation at the end.

**3.1 — a second gradeable track (small, optional if it balloons).** Only SeeYouDrop's truth grid is hand-checked. CyborgNinja's
kicks sit at beat phase 0.19 / 0.69 (its grid phase is ~70 ms off), Malicious' are uniform (DP residual 90 ms); WhoLikesToParty is
unchecked. Fix or re-anchor the grid phase in `trackmap.py` for at least one more track, checking it at the user's grains (8, 5, 3,
2, 1, 0.569, 0.224 s — `feedback_analysis_grains`), never from one slice. If it does not converge quickly, grade on SeeYouDrop and
say so.

**3.2 — the ruler first: `tools/truth/predcheck.py`** (engine-independent, like `gridcheck.py`, reusing `compare.py`'s matcher):
- predicted hits vs truth onsets (`onsets.click` / `mid` / `high`): F ±30 ms, lag median / p90 **at heard time** (the target is
  ON time: |median| ≤ 10 ms — against the reactive +38–52), and the share released before the audio arrived;
- false predictions in the first bar after each annotated boundary (a prediction across a change is wrong — measure how wrong);
- section-change detection latency vs the annotated boundaries, and return labelling vs `sectionReturn` (4–8 beats late today);
- a self-test on a synthetic trace built from the truth (perfect prediction reads F 1.0 / lag 0; a one-step shift is caught).

**3.3 — the stage: `engine/bars/` (pure DSP) + `features-bars.js`** (registered after `ears`, so before the lead). The shape the
design notes the user pasted on 2026-09-28 proposed ("bar fingerprint store"), adapted to this engine:
- **Per bar:** three 16-step onset patterns (kick / snare / hat quantised on the synapse grid, as 16-bit ints), a mean band-energy
  vector (~12 floats: synapse `bassS/midS/highS/sub`, the ears' `bassReg`, densities…), the centroid. Close a bar only when
  `barConf` / `gridTrust` say the grid is right; an unsure bar is stored flagged, not trusted.
- **Store:** a flat ring of the last N bars (N ≈ 256) + a map pattern → bar indices. **Match** the bar being played against
  history by Hamming distance on the bits + cosine on the energies; **predict** the next bar from what followed the best matches
  (a vote over the top k, weighted by similarity); **confidence** from the match quality and how often that continuation held.
- **Mid-bar:** the steps already heard narrow the match as the bar goes (a bar is 16 chances to be surprised, not one).
- **Novelty / returns:** a bar that matches nothing recent is a section start (an event, on the bar line — not 4–8 beats later);
  a bar that matches a bar from an earlier section is a return (on its first bar, or its first beats).
- **Degrade:** no match, low `barConf`, silence, a tempo re-lock → confidence 0 and no predicted events. Never invent.
- **THE TIME BASES — the pitfall of this step.** Stages run BEFORE the lead: this stage sees the RAW synapse clocks (aligned to the
  analysers' newest audio), the ears stamp onsets in audio time and publish `…Age` in heard time. An onset's position in beats on
  the raw grid is `barPos_raw − (age − LEAD.L)·bpmSyn/60` (`LEAD.L` = heardT − the analysis time; `MS.leadT` includes `&disp`).
  Predicted hits are for the listener: release a predicted step when the HEARD grid crosses it — `barPos_raw + leadT·bpmSyn/60`,
  which is what the lead will publish — or release them in a hook right after `leadApply`. Pick one, say why in DECISIONS, and
  prove it with the ruler (a wrong base shows up as a constant ±27–43 ms).
- **New MS fields, additive only** (FEATS entries in `feats.js`, `node tools/feats-doc.js`, names checked against Appendix A).
  Suggested, not binding: `predKickEvt / predSnareEvt / predHatEvt` (the predicted step, released at heard time), `predKickIn`
  (beats to the next predicted kick), `predConf`, `barMatch` (similarity of this bar to its best match), `barNovelEvt`,
  `barReturnEvt`. Nothing existing changes value.

**3.4 — prove.** A node unit test (`tools/test_bars.js`, in `npm test`): a synthetic 4-bar loop → prediction exact after one
cycle; a pattern change → the novelty event on that bar and the confidence drop; a return → the return event on its first bar.
Then `&map=0` det traces of SeeYouDrop (the groove 25.6–44.8, the groove-return 89.6–96.0, the gated 105.6–131.2) through
`predcheck.py`; then one audible capture run (`HASHX='…' node tools/caplag.js track SeeYouDrop 20 70`) as the live confirmation.
The cheap proofs after every engine change: `node tools/check.js`, `npm test`, `GPU=1 node tools/parity.js fake` (0 diff — then
`git checkout -- tools/accept/v0.5/`, the run rewrites those montages), `IDS=11 tools/scene-md5.sh <tag> '&ears=1&figure=0'`
(606f721a / f7b1c6ee), and the 27-field SeeYouDrop det trace unchanged (`tools/filetrace.js SeeYouDrop 0 157.4 <out> '<fields>'`
vs a reference made before the change — `tools/work/` is gitignored, so make the reference first if it is gone).

**3.5 — let the user see it.** **No new scene** (`feedback_no_new_scenes`: only on the user's ask). The v0.4 routes can feed a
predicted field into an existing scene's channel with no scene edit (`#test&…&route=<scene>.<field>=<src>` — the hash form is
#test-only; in a normal page the routes panel (`P`) or `CARD.route(...)` — CONTRACTS §1.15; find the
channel a kick drives via `CARD.paramDeps` / `help.feats`); TORUS2 is the user's favourite mapping (`project_music_library`).
Propose one A/B (reactive vs predicted) as a route string plus what to listen for, and let the user's look decide any default.

## Rules

- **Additive.** No existing MS value, no existing pixel moves; the lead stays as v0.16 made it.
- **`tools/accept.sh` (the full sweep) only on the user's word**, as in v0.15; the cheap proofs above are always run.
- **Audible runs:** `caplag.js` opens windows and plays through the speakers — say so before running one.
- Measure first, then build; small increments; one commit per step with the numbers in the message; DECISIONS §50 for the leans;
  `docs/AUDIT-live-grid.md` gets a "Step 3" section in the same shape as step 2; update `project_live_mode.md` in memory.
- End with the report and wait for the user's look in stream mode. Tag / push / deploy only when they ask.

## Not this session (in `docs/OPEN-ITEMS.md` or the audit's "Open")

The display path (compositor + vsync, `&disp` stays 0 until measured) · mic-mode lag · `heardT`'s first-frame stale-timestamp
glitch in real-time file / demo mode (`lead.js` guards itself; `AU.ctxHeard()` does not) · the v0.15 CHLADNI items (drop flash,
slides) · GIELIS / NAV2 · step 4 (the build detector) — do not start it here, even where the fingerprints make it tempting.
