# Worker: TORUS (§4) — 2026-09-22

**Brief:** `brief-common.md` (rules/report only) + `brief-torus.md` + `assets/math/hopf.js` + `tools/test_hopf.js`;
PORT 8773; own worktree. Model: opus. ~33 min (the longest: a new scene, not a lift).

**Outcome:** accepted. 212 + 120 lines. `check.js` 0 fail; the GLSL port of `fibre4→rotSU2→poleOffset→stereo` and the
knot were diffed against `hopf.js` in node: max 6e-16. `#test&scene=3`: t6 nested magenta/gold/violet ring arcs with a
braided caustic near the pole; t14 collapsed to a cyan-white core ring and re-bloomed (drop). House: dense green nest ·
sparse two-torus breakdown · dense red/magenta/teal. Ambient (30 s): the family visibly re-shapes with the chroma at
8/19/30 s (dominant pc0 torus → cyan cap → four equal classes interleaved). `bench(3)` 0.03–0.12 ms (timer floor).
feats (16) exact; post `{fb:{decay:.85}, bloom:{thr:.3}, kaleido:0}`; cuts 'continuous'; `hooks.probe(k)` returns
CPU reference points. Commit 26dc178 in the worktree.

**Friction (11) and fixes:** `tier()` named in CONTRACTS but not in `ctx` → `ctx.tier()` added (§1.1/§1.6); target not
pre-cleared + GL entry state (already fixed after DUST); `ctx.use` on raw programs (stated); empty VAO for POINTS
(`gl.createVertexArray()` — brief says so now); `LOOK.mood` hue units → turns (stated); `GROOVE.rot` unbounded (stated
in §1.5); `MS.chroma` is zero on `#test` (ENGINE.md now says so; parity forbids filling it) → the scene blends in a
chroma implied by `harmAngle` when the vector is dead (continuous, off with real audio); no readback path for POINTS
positions → node diff of the shader expressions + a probe hook; `Q` tier flips vs `cuts:'continuous'` → ring count is
tier-independent, only dot density scales.
**Deviations from the brief (all argued from the geometry):** `alpha = 0.18·sin(GROOVE.rot)` not `0.6·rot` (the SU(2)
tumble moves the projection pole through every family's latitude once α ≳ 0.65 and sends that torus to infinity);
`delta = 0.6·tension` for the same singularity; each family's fibres cover the whole latitude circle (a narrow
longitude band merges into a sheet — the full circle IS the torus); bass pulse via θ (the "radial from the centre
circle" option is undefined once tumbled: the fibres lie on cyclides); camera at ~2.9× the family radius, fov 54°,
tracking a CPU-sampled centroid of the lit families (the nest slides around the stereographic window).
Temptations: engine/sources/fake.js (why chroma is zero), core/gl.js — neither opened.
