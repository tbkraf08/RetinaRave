# Fable Session Prompt — Retina Rave: the DUST overhaul, pass 1 (written 2026-09-30)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine, native ES
modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; **a push to `main` deploys retinarave.com — push /
deploy only on the user's word**; every deploy since v0.15 has been held). Dev server: `node tools/serve.js` → http://127.0.0.1:8765/
(the user's; it has no port in its command line — kill test servers by port only). **State:** v0.20 tagged locally (all six live steps
in, DECISIONS §49–§56; the PCM beat clock is the default), `main` ~46 commits ahead of origin, retinarave.com serves v0.15.

## The ask (the user, 2026-09-30, verbatim)

> "lets go one scene at a time; start with DUST (can do a full overhaul in place, not limited to whats new)"

and the brief they pasted, which is the acceptance standard for every scene from here on:

> Build the visualizer to be legible: a viewer with the sound off should be able to roughly reconstruct the song's structure.
> Transients (kick/snare) produce sharp, fast-attack/slow-decay impulses driven by band-limited onset detection. Frequency bands map
> to distinct visual behaviors so instruments are separable. Motion is phase-locked to the beat grid with emphasis on downbeats and
> phrase boundaries. Maintain a slow "tension" accumulator (energy slope, centroid rise, onset density, filter sweeps) that visibly
> tightens the scene during builds and releases all at once on the drop. Detect timbral novelty and give new sounds a new visual
> voice; let sustained sounds habituate. Preserve dynamic range: quiet is quiet, loud is loud. Zero perceptible latency; nothing
> moves without an audible reason.

The plan below was shown to the user ("looks good, can start"). Build it **in place** in `assets/scenes/dust/` (the old DUST stays
reachable as `releases/retinarave-v0.20.html` — that is the A/B). DUST is scene id 1, key 2.

## DUST today (what to keep and what to replace)

Grains (`gl_VertexID`, 20k–150k by tier) each own one bin of the 256-bin log spectrum (`uSpec`) and are pushed outward by it — the
core idea, **keep**. Four formations cross-faded per grain ("pour"): Fibonacci sphere, torus (tube ← `bassS`), three-arm galaxy,
the waveform ribbon (`uWave`). Hopf-fibre rings threaded through (`fibre.js`, `hooks.fibres`). Reads 15 fields: `flow / flowMid /
flowBass` (synapse's continuous flow clocks — **no beat grid at all**), `bassS / midS / highS / lvl`, `kick` (synapse's level; the
64th kick re-pours to a random formation), `dropEnv` (re-pour + fling), `tension` (**this is dissonance / roughness, not a build**),
`hat`, `alive`, and the bid (`arc`, `punchy`, `regularity`). No snare. Nothing harmonic beyond `LOOK.mood`. `lvl` is AGC-normalised
(a quiet verse is as bright as the drop).

## Pass 1 (this session) — in order, each measured, committed with its numbers

1. **On the grid.** Spin / arm rotation / torus turn advance per beat on the PCM clock (`beatPhase`, `beat`, `beatCount`), a bigger
   nudge on the downbeat (`barPos` / `barPhase`), a formation change only on the phrase boundary (`phrase16Pos` wrap) or a section
   event (`barNovelEvt`) — never on a kick count. The continuous flow clocks may remain as a slow drift underneath, never as the beat.
2. **Three transient voices, reactive v2** (the user prefers reactive over predicted for "in sync", memory
   `feedback_reactive_over_predicted`): kick = `kick2` shove + `kickAge` decay on the inner (low-bin) grains; **snare = a new voice**
   — a radial flash ring on the mid grains, `snare2` / `snareAge`; hat = the edge sparkle on `hat2` / `hatAge`. Sub notes (`subNoteEvt`,
   `subGate`) as a slow swell of the core. Fast attack, slow decay, from the ages — not the 60 Hz levels alone.
3. **Real tension.** `buildLive` (the void, 2–4 bars before a drop) contracts the cloud, tightens the rings, thins the torus tube and
   drains the palette; `dropLiveEvt` / `dropEnv` release everything at once (the fling stays). The roughness `tension` becomes
   jitter only. `nextDropIn` / `nextBarIn` may wind the last bar up (the queue is untested by the user's eye — measure, don't assume).
4. **Formations as sections.** Trigger: phrase boundary / `barNovelEvt`; a **return** (`barReturnEvt`, `sectionReturn`) pours back
   into the shape that section had (file it like the director's look memory, keyed on the store's section / `sectionAlt`). Which
   shape: from the section's energy — sphere for intro / low energy, galaxy for the groove, torus for the build (it tightens through
   the void), ribbon for the breakdown / a lone voice; the drop bursts the torus into the galaxy. No new shapes in pass 1.

Pass 2 (next session, not now): dynamic range (`eM` against the track's running peak, not `lvl`), novelty + per-bin habituation
(a second slow spectrum EMA in the shader), harmony (ring hues from `harmAngle`, major warm / minor cool, as TORUS2).

## Rules, harness, proofs

- Docs are the contract: `docs/CONTRACTS.md` (§1 scene slots, feats / help.feats every field read, params, `check.js` fails on
  core imports from a scene, MS keys without a feats entry, >500 lines — split into files), `docs/HARNESS.md`, `docs/DECISIONS.md`
  (write **§57** with the leans + numbers), `docs/ENGINE.md`. Fields available: `node tools/feats-doc.js` / CONTRACTS Appendix A (188).
- Measure: the live path on a file is `#test&track=<Track>&map=0` under `CLOCK=1` (deterministic; `tools/filetrace.js`); tracks in
  `~/Music/RetinaRave/` (SeeYouDrop = the reference dubstep, drops 57.6 / 105.6; CyborgNinja no drop; WhoLikesToParty; Malicious).
  Scene-side rulers: `tools/probe.js` (per-frame luminance / events) around every truth drop and the 16 bars before; per-beat
  montages (`tools/montage.py`, `DT=16` windows — a montage cannot judge a per-beat motion, measure per frame: memory
  `project_music_library` pass 8 lessons); the truth grids `tools/truth/<Track>.json`. Cost: `CARD.bench(1, 300)` before / after
  at the same tier, the Q trace if cost moved (`tools/q-trace.sh`). The fake-timeline md5 for s1 will move (expected — record the new
  `scene-md5.sh` line); every other scene's must not.
- A/B for the user in **stream mode** (tab capture): old = `releases/retinarave-v0.20.html` opened from `file://`, new = the dev
  server, key 2, same track. Their eye is the ruler; they report in track time; a look remark = a retune request.
- Delegate the build to a worker (opus / the default model, in place, own `PORT=` 8880+, no audible runs, never two page Chromes
  beyond two lanes); the orchestrator reviews against the brief, runs the one audible capture run at the end (say so first), and
  writes the report + the A/B. Commit after each numbered step; **tag / push / deploy only when asked**. Update memory
  `project_live_mode.md` (or a new `project_dust_overhaul.md`).
- Standing: no new scenes unless asked (`feedback_no_new_scenes`); the display lead is 40 ms in file modes, 0 in capture
  (`dispNow()`); `tools/accept.sh` has not been run since v0.14 — run it before any deploy.

## Read first

This prompt · `assets/scenes/dust/{index,shaders,fibre}.js` · `docs/CONTRACTS.md` §1 · DECISIONS §51 (drums v2), §54–§56 ·
`assets/scenes/torus2/` (the user's favourite music-to-visual mapping: waves launched by hits at beat speed, nudge-per-beat
rotation, key on the circle of fifths) · `assets/scenes/nav/nav.js` (the only anticipatory move today: the cusp park on `buildLive`) ·
memory `project_live_mode`, `feedback_reactive_over_predicted`, `feedback_display_lead`, `project_music_library`, `feedback_no_new_scenes`.
