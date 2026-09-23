# Fable Session Prompt — Eigenwobble v0.2

Eigenwobble v0.1 shipped (2026-09-22): the modular successor to Cardioid — one `index.html` + `assets/`, four scenes
(NAV/DRUM · DUST · MANDALA · TORUS), a merged music engine (v3 extractor + synapse Analyzer as an additive stage,
117 documented `MS` fields), an effects registry (feedback · bloom · exposure · composite), a director with look
memory, a headless harness with a frame-exact fake clock, and `dist/eigenwobble.html` from `tools/bundle.js`.
Parity with `cardioid3.html` on `#test` is 0 diff on every field; the v3 NAV scene survives intact.

**Read first:** `docs/CONTRACTS.md` (the one required read for scene/effect/stage authors), `docs/HARNESS.md`,
`docs/DECISIONS.md` (every deviation and why, including the open items below), `docs/workers/*.md` (what workers
tripped on). Memory note: `~/.claude/projects/-home-toma-Documents-TomaCoS/memory/project_eigenwobble.md`.

**Working style that worked:** the orchestrator owns core/engine/contracts/parity; every scene and effect was written
by a worker in an isolated git worktree (own `PORT=`), from the contract docs alone, accepted on screenshots, and its
friction went straight back into the docs. Keep it. `node tools/check.js` after every edit; `GPU=1 node tools/parity.js
fake` after any core/engine change (must print 0 diff); `GPU=1 tools/accept.sh` before a commit that claims a phase.

## v0.2 progress (2026-09-22)

Done and swept green (`tools/accept/v0.2/`, `GPU=1 tools/accept.sh`: check · math · lines smoke · parity fake 0 diff ·
parity real · monitor 0 spikes · 5 scenes · transition md5 · real start path · bundle 49 modules):
- **#1 line renderer** → `core/lines.js`, `ctx.lines` (CONTRACTS §1.12, DECISIONS §7). Scene targets carry depth.
- **TORUS as strokes** (worker, DECISIONS §7): over + depth, 144 rings × [48..160] segments, occlusion is real.
- **#3 polytope** → `scenes/polytope/` id 5 (worker, DECISIONS §8): tesseract / 24 / 600 / 120-cell on S³, path A,
  cast by section seed, deterministic. Polish item: pole streaks at t6.
- **#5 tempo refinement** → `engine/tempo.js` (DECISIONS §9): harmonic-comb ACF, sub-lag vertices on the harmonics,
  octave-aware switching with evidence gates; `bpm` within ±1 on every demo style, no octave flip in breakdowns,
  `regularity` ≈ 0 on ambient; `tools/test_tempo.js` (node, synthetic envelope) + `tools/tempo-trace.sh` (per-style
  traces in `accept/v0.2/tempo-*-{before,after}.txt`). Parity fake still 0 diff (the fake path never ran the
  estimator); parity real now judges both engines against the synth's 126.
- **#6 director** → `core/scenes.js` (DECISIONS §10): look memory keyed on synapse's `sectionAlt` (filed at
  `boundaryEvt`, restored when a return is identified — every aba return now restores), soft switches held to the bar
  line while `gridTrust > .5` (`SC.quantise`), grid positions per frame in `features-synapse.js`;
  `tools/test_director.js` + `tools/director-trace.sh` / `director-stats.js` (traces in `accept/v0.2/director-*`).
- **#2 transition slot + morph** → `assets/transitions/{mixs,morph}.js` (DECISIONS §11, CONTRACTS §5): the crossfade
  is a plug-in; `mixs` moved out byte-identical (frame-290 md5 checked by `accept.sh`), synapse's flow-field morph
  written by a worker from the contract and made the default on the A/B montage (`accept/v0.2/montage-trans.jpg`);
  `&trans=<name>`, `CARD.benchTransition`. Harness fix: the benches never synced before (byte readback from RGBA16F).
- **#4 help view** → `core/help.js` (DECISIONS §12, CONTRACTS §1.13): `?`/`h` opens a DOM overlay over the still-rendering
  canvas — the current scene's `tag`, three depths, `cuts`, and one row per `feats` field (ELI5 · what it drives *here*
  from the new `help.feats` slot · formula · live value), the director's state, the cast, the keys. Zero DOM work while
  hidden (`CARD.HELP.ticks`), the §11 md5 and `parity.js fake` untouched, coverage by eval (`CARD.HELP.rows()`:
  107/107 fields, top table = `feats` on all 6 ids). NAV's `feats` trimmed to what it reads (11 v3-era leftovers).
Still open below: #3 julia/feigen, #7, plus DUST's Hopf-fibre overlay (now unblocked by `ctx.lines`).

## Candidates for v0.2 (pick by taste; each is one worker brief)

1. **Line renderer in core** (`ctx.lines`: instanced quads from a Float32Array of segments, depth-tested). Unblocks
   TORUS fibres as strokes instead of points and DUST's Hopf-fibre overlay (dropped in v0.1 for synapse's broken depth).
2. ~~Synapse's morph transition~~ — done (DECISIONS §11): `assets/transitions/`, morph is the default.
3. **Synapse's julia / feigen / polytope scenes** as workers (`synapse2.html` scenes 1/3/5; the polytope needs the
   line renderer). Each is a folder + two lines in `main.js`.
4. ~~The v4 help idea rebuilt on `feats.js`~~ — done (DECISIONS §12): `core/help.js`, the `help.feats` slot.
5. ~~Tempo refinement for v3's canonical `bpm`~~ — done (DECISIONS §9).
6. ~~Key look memory on `sectionAlt` + beat-quantised director actions~~ — done (DECISIONS §10).
7. **Row-only `hist` upload** (32 KB/hop today) and `Q`-aware particle budgets shared across POINTS scenes.

## Non-negotiables (unchanged)
Zero deps · native modules · every visual parameter traces to `MS` · core closed except in a phase that targets it ·
module cap 350/500 · parity on `#test` is the acceptance for any engine/core change · finish every phase with the
real start path (`NOAUTO=1 … 'real'`, click the demo link, `CARD.nonFinite()` empty, `CARD.ERRS` empty) on both
`index.html` and `dist/eigenwobble.html`.
