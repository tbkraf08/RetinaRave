# Worker: TORUS strokes (v0.2 §7) — 2026-09-22

**Brief:** `brief-common.md` (rules/report) + `brief-torus-lines.md` + `math/hopf.js`, `test_hopf.js`, `lines-smoke.js`,
`workers/torus.md`, v0.1 shots; PORT 8774; own worktree. Model: opus. ~16 min, 63 tool calls.

**Outcome:** accepted, cherry-picked as-is. 222 + 156 lines; `check.js` 0 fail; ERRS/nonFinite empty; `gl.getError()`
0; GLSL port re-derived in node vs hopf.js: fibre 1.5e-14, knot 9e-16; `hooks.probe` intact, `hooks.lmode(0|1)` added
(additive/no-depth vs over/depth A/B). Every ring a continuous closed stroke at every tier; the nest is visibly brighter
and more saturated than v0.1; drop still collapses at t14; house h10/h30/h50 three distinct frames, h30 shows an
edge-on torus occluding the rings behind it. Bench 0.012–0.038 ms (tier 1), 0.019–0.023 ms (tier 3) — timer floor.

**Friction (8) and fixes:** `drawN` VAO ownership unstated → §1.12 says the renderer owns it; semi-transparent strokes
bead at joints under 'over' → "alpha is coverage" paragraph in §1.12; transparent fragments write depth → `discard`
rule in §1.12 + built-in program; `CARD.glerr` undefined (only set after an error) → HARNESS; tier-sweep step in the
brief too short for the scene's 2 s tier EMA → HARNESS pinning note; `size / v.z` ambiguous → "px at unit depth"
wording in §1.12/friction; v0.1 had a reversed `smoothstep` (fixed in place); `bench` first call cold → HARNESS.
Temptations: `core/lines.js` (cap geometry), `effects/feedback.js` (decay vs brighter input) — neither opened.
