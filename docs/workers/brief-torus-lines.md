# TORUS strokes worker brief (v0.2 §7) — read docs/workers/brief-common.md first (the "may read" rules and the report
# format apply; the synapse mapping table does not)

Target: `assets/scenes/torus/` (`index.js` + `shaders.js`, both already exist — this is an upgrade, not a new scene).
Scene stays `name: 'torus'`, `id: 3`, `cuts: 'continuous'`; keep `feats`, `score`, `post`, `help`, `hooks.probe`, the
look of the music mapping and the camera/reframe logic. PORT=8774. You may ALSO read `assets/math/hopf.js`,
`tools/test_hopf.js`, `tools/lines-smoke.js` (the reference path-A/path-B programs) and `docs/workers/torus.md` (what
the first worker decided and why). Nothing else beyond the common brief's list.

**What changes.** v0.1 draws every fibre as `gl.POINTS` (12 families × 12 fibres × ~320 dots): at tier 1–2 the rings
read as dotted threads and TORUS is the dimmest of the four scenes (`tools/accept/v0.1/s3-t6.jpg`, `s3-t14.jpg` — look
at them first). The core now has a line renderer, `ctx.lines` (CONTRACTS.md §1.12). Re-render the fibres and the knot
strand as **strokes**: path B (GPU polyline — your vertex shader already computes every point analytically from
`gl_VertexID`; move that into a `P(ring, i)` function indexed from `gl_InstanceID`, one instance per segment, closed
rings wrapping to point 0), `ctx.lines.drawN(n, {...})` instead of `drawArrays(POINTS)`.

**Design targets (argue from the geometry if you deviate, as the first worker did):**
- Every ring is a continuous closed stroke at every tier. Segment count per ring scales with `ctx.tier()` (e.g. 48 /
  72 / 108 / 160 — a Villarceau circle under stereographic projection is smooth, 48 chords already read as a circle);
  the number of rings stays fixed (`cuts: 'continuous'`). The knot strand gets more segments (it winds p+q times).
- Width in 3D: `size / v.z` px (near strokes thicker), `size` ≈ 2–3 px at 720 p scaled by `h/720`, times
  `(1 + 0.6·bass)`; the knot ~1.6× wider. Brightness per family from `chroma` as today, times `presence`.
- Depth: the fibres of different tori do occlude each other in R³ — try `depth: true` with `blend: 'over'` (correct
  occlusion in any order; a torus in front hides the one behind) versus `blend: 'add'` (the v0.1 glow; overlaps
  brighten). Pick on screenshots and say why. Set clip `z = v.z − 2·near` with `w = v.z` (§1.12) — the current
  shader puts `0.0` in z, which would make depth meaningless.
- Colour stays `palM(hueT)` from `LOOK.mood`; keep the fade near the projection pole and the centroid framing.
- Your program declares `uRes2` today: with the chunk you get `uRes` for free from `ctx.use` — drop `uRes2`.
- Do not read `gl_VertexID` any more (it is the quad corner and belongs to `lineCorner`).

**Acceptance (all from the repo root, all must pass):**
1. `node tools/check.js` → `0 fail`. Files ≤ 350 lines.
2. `PORT=8774 GPU=1 node tools/cdp.js 'test&scene=3' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical,glerr:CARD.glerr})"},{"shot":"work/torusl-t6"},{"wait":8200},{"shot":"work/torusl-t14"}]'`
   → ERRS `[]`, nonFinite `[]`, glerr undefined/0. Read both shots next to `tools/accept/v0.1/s3-t6.jpg` /
   `s3-t14.jpg`: rings must be continuous strokes (no dotting), the nest visibly brighter than v0.1, and the drop at
   13 s still collapses to the core ring at t14.
3. Tier sweep: `PORT=8774 GPU=1 node tools/cdp.js 'test&scene=3' '[{"wait":4000},{"eval":"CARD.Q.q=0.1;'q0'"},{"wait":300},{"shot":"work/torusl-q0"},{"eval":"CARD.Q.q=0.95;'q3'"},{"wait":300},{"shot":"work/torusl-q3"}]'`
   → both shots show the same rings (the count never changes with the tier), only smoothness differs. (Q adapts back
   within a second; 300 ms is enough for one frame.)
4. `PORT=8774 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&scene=3' '[{"wait":10000},{"shot":"work/torusl-h10"},{"wait":20000},{"shot":"work/torusl-h30"},{"wait":20000},{"shot":"work/torusl-h50"},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),q:CARD.Q.q,b1:CARD.bench(3,300),b2:CARD.bench(3,300),b3:CARD.bench(3,300)})"}]'`
   → three different frames across the track; report the three bench medians (v0.1 POINTS was 0.03–0.12 ms; strokes
   may cost more — up to ~0.5 ms at tier 3 is acceptable, say what you measured).
5. `PORT=8774 GPU=1 node tools/cdp.js 'test&fake=0&demo=dnb&scene=3' '[{"wait":12000},{"shot":"work/torusl-dnb12"}]'` → one shot, sanity.
6. `hooks.probe(k)` still returns the CPU reference points and the GLSL port still matches `hopf.js` (you moved the
   math into `P()`; keep it verbatim).

**Report:** as brief-common.md (a)–(e), plus (f) the blend/depth choice with the screenshots that decided it, and (g)
segments per ring per tier and the bench numbers. Commit in your worktree with a message starting `TORUS strokes:`.
