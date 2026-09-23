# POLYTOPE worker brief (v0.2 §8) — read docs/workers/brief-common.md first (the "may read" rules, the synapse mapping
# table and the report format all apply)

Target: `assets/scenes/polytope/` → `index.js` (+ `poly4.js` or `shaders.js` if you need a second file; every file ≤ 350
lines). Scene `name: 'polytope'`, `id: 5`, `cuts: 'continuous'`. PORT=8775. Register it in `assets/main.js` (the two
lines of CONTRACTS.md §1.8; the ids table there says 5 is free — update it to `5 polytope`).

**Synapse source, the only lines you may read** (`~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html`,
with `sed -n 'a,bp'`): 1133–1148 (`perms`/`mk4`/`get4`/`poly4`: the four regular 4-polytopes built from their vertex
coordinates, edges found as nearest-neighbour pairs, the double rotation, edge subdivision in 4-D, stereographic
projection with a fade near the pole), 1118 (`signs`), 1207–1215 (scene 8 "star" casting: K=1 tesseract + 24-cell
nested, K=2 600-cell / 120-cell; rotation angles from `flowBass/flowMid/flowHigh`, scale `g` from tension/drop/kick),
1585 (line gain), and 985–1010 (synapse's own line shader — for its width/fog choices only; you will NOT write a line
shader: the core has one now).

**What it is.** The regular 4-polytopes as tilings of the 3-sphere — the same S³ the TORUS scene's Hopf fibres live on,
projected by the same stereographic map. Vertices are normalised to |v| = 1 so every vertex is on S³; an edge subdivided
in 4-D and projected becomes a circular arc (a great-circle arc of S³), which is why the cells bulge: nothing is
"drawn curved", the projection does it. The double rotation (independent angles in the xy and zw planes, plus a third
xw turn) is a general element of SO(4); it moves cells through the projection pole so the picture turns itself inside
out periodically — that is the show. Tesseract 16 v / 32 e · 24-cell 24 / 96 · 600-cell 120 / 720 · 120-cell 600 / 1200.

**Rendering — `ctx.lines` path A** (CONTRACTS.md §1.12): build the segment `Float32Array` on the CPU every frame
(rotate the vertices, subdivide each edge into `sub` pieces in 4-D, project each piece, emit one 12-float segment per
piece: 3-D position at both ends, width in px at both ends, rgba), `ctx.lines.set` + `ctx.lines.draw(L, target, w, h,
{ mvp, depth: true, blend })`. `mvp` is your own perspective camera (a column-major 4×4: view then projection; eye at
distance ~4.5 on a slow orbit like synapse's `setT` roll/yaw, fov ~50°; near 0.1). Width `≈ 2.2 px · h/720 / viewZ`,
thinner for the outer/guest polytope. Fade a segment out as it approaches the pole exactly as `poly4` does (the
`den > 0.16` gate and the `(den − 0.16)·3.5` ramp), through alpha — never a jump. Budget from `ctx.tier()`: `sub`
∈ [3, 4, 6, 8]; the 120-cell only at tier ≥ 2 (600-cell below) — that swap is a discontinuity, so cross-fade it over a
second (draw both, alphas eased) or key it on a section event. Cap ≈ 12 k segments.

**Music → geometry (all through MS/LOOK/GROOVE; `feats` lists every read):**
- Rotation angles: `a = 0.1·flowBass`, `b = 0.14·flowMid`, `c = 0.04·flowHigh` (musical time — never wall-clock).
- Scale `g = (1 − 0.3·tension)·(1 + 0.6·dropEnv + 0.08·kick)`; jitter `0.05·tension²` — synapse used `Math.random()`;
  you use a hash of `MS.seed.a` and a per-frame counter (CONTRACTS §0). The scene must be bit-identical on `#test`.
- Which polytopes: the section seed picks the cast, `Math.floor(MS.seed.a·3)`: 0 = tesseract inside a 24-cell,
  1 = 600-cell alone, 2 = 24-cell inside a 600-cell (120-cell at tier ≥ 2). Re-cast only on `sectionEvt` (declared
  event cut, and even then fade). Look memory (§1.11): `look.get()` = the cast index, `set(v)` restores it.
- Brightness `0.75·(0.35 + lvl)·presence`, hue from `LOOK.mood` (palette coordinate per polytope as synapse's `ta`:
  inner 0.15, outer 0.55) — rebuild synapse's `pal()` as `palM()` on the CPU with `ctx.hsv` or a cosine palette from
  `LOOK.mood.hue/sat/bri/spread`.
- `beatPhase`/`beat`: a subtle per-beat pulse of the inner polytope's width (`1 + 0.4·hit`), nothing that cuts.
- `score`: `MS.arc === 'build' ? 0 : 0.2 + 0.4·regularity + 0.3·clarity + 0.2·calm`.
- `post`: trails `fb.decay 0.74`, `bloom.thr 0.3`, `kaleido 0`. `help` with three depths (eli5 / why / math: regular
  4-polytopes, SO(4) double rotation, stereographic projection, edges → great-circle arcs, the pole).

**Acceptance (all from the repo root, all must pass):**
1. `node tools/check.js` → `0 fail`.
2. `PORT=8775 GPU=1 node tools/cdp.js 'test&scene=5' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical,glerr:CARD.glerr})"},{"shot":"work/poly-t6"},{"wait":8200},{"shot":"work/poly-t14"}]'`
   → ERRS `[]`, nonFinite `[]`; Read both shots: a recognisable wireframe 4-polytope (cells visible, arcs curved) at
   t6, visibly expanded/brightened by the drop at t14.
3. Determinism: `CLOCK=1 PORT=8775 GPU=1 node tools/cdp.js 'test&scene=5' '[{"until":"__FRAME>=360"},{"shot":"work/poly-f360a"}]'`
   twice → the two jpgs are byte-identical (`cmp`). This is the no-`Math.random()` proof.
4. `PORT=8775 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&scene=5' '[{"wait":10000},{"shot":"work/poly-h10"},{"wait":20000},{"shot":"work/poly-h30"},{"wait":20000},{"shot":"work/poly-h50"},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),q:CARD.Q.q,b1:CARD.bench(5,300),b2:CARD.bench(5,300),b3:CARD.bench(5,300),ms:CARD.ENGINE.ms})"}]'`
   → three different frames; report bench (ms per render — includes your CPU segment build; keep it under ~1.5 ms at
   tier 3, and say what you measured) and the segment counts per tier.
5. Tier sweep as in the TORUS brief style: `{"eval":"CARD.Q.q=0.1;'q0'"}` … shot … `CARD.Q.q=0.95` … shot: fewer
   subdivisions at q0, same polytopes.
6. The scene object has `name id tag feats cuts score init update draw post help look`; `feats` is exactly the fields you
   read.

**Report:** as brief-common.md (a)–(e), plus (f) segments and bench per tier and (g) the byte-identical cmp result.
Commit in your worktree with a message starting `POLYTOPE:`.
