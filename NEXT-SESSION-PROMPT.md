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

## Candidates for v0.2 (pick by taste; each is one worker brief)

1. **Line renderer in core** (`ctx.lines`: instanced quads from a Float32Array of segments, depth-tested). Unblocks
   TORUS fibres as strokes instead of points and DUST's Hopf-fibre overlay (dropped in v0.1 for synapse's broken depth).
2. **Synapse's morph transition as an effect** (`effects/morph.js`): the crossfade today is v3's `mixs`; synapse had a
   flow-field morph. Slot exists: the crossfade is a core pass — make it a pluggable `transition` slot first.
3. **Synapse's julia / feigen / polytope scenes** as workers (`synapse2.html` scenes 1/3/5; the polytope needs the
   line renderer). Each is a folder + two lines in `main.js`.
4. **The v4 config-panel / help idea rebuilt on `feats.js`**: `FEATS` already carries eli5/formula/drives for every
   field and every scene ships `help`; a `?` overlay that shows the live `MS` vector with its glossary and each scene's
   three-depth help is mostly UI.
5. **Tempo refinement for v3's canonical `bpm`** (dnb reads 172.4 not 174 and halves in breakdowns; `bpmSyn` is right):
   a parity-changing engine change — do it as its own phase with the parity tolerance recorded in DECISIONS.
6. **Beat-quantised director actions** when `gridTrust > 0.5` (deferred from §5, see DECISIONS).
7. **Row-only `hist` upload** (32 KB/hop today) and `Q`-aware particle budgets shared across POINTS scenes.

## Non-negotiables (unchanged)
Zero deps · native modules · every visual parameter traces to `MS` · core closed except in a phase that targets it ·
module cap 350/500 · parity on `#test` is the acceptance for any engine/core change · finish every phase with the
real start path (`NOAUTO=1 … 'real'`, click the demo link, `CARD.nonFinite()` empty, `CARD.ERRS` empty) on both
`index.html` and `dist/eigenwobble.html`.
