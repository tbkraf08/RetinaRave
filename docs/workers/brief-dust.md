# DUST worker brief (§3) — read docs/workers/brief-common.md first

Target: `assets/scenes/dust/` → `index.js` + `shaders.js`. Scene `name: 'dust'`, `id: 1`, `cuts: 'onset'` (formations
flip on kicks/drops). PORT=8771.

Source: synapse scene 4 "swarm". Read exactly these ranges of synapse2.html:
- 848–887: `VS_SWARM` (848–883) and `FS_SWARM` (884–887). The formation logic `form()` is inside 851–860: Fibonacci
  sphere · torus · 3-arm galaxy · waveform ribbon, cross-faded per particle with a hash-staggered smoothstep.
- 592–686: `GLSL_COMMON` — copy only the helper functions VS_SWARM/FS_SWARM use (`hash11`, `pal`, `ang`, …).
- 1431, 1456, 1468, 1488, 1506 (read ±3 lines around each): the CPU formation state `formA/formB/formT/formKick`
  (1431), `reform()` (1456), reform on drop (1468), reform every 64 kicks (1488), `formT` integration (1506).
- The swarm's Hopf-fibre line overlay (the "line renderer" parts of that scene) is DROPPED: its depth test is broken.
  Draw points only.

What DUST is: `gl.drawArrays(gl.POINTS, 0, count)` with NO vertex buffer — every particle's position comes from
`gl_VertexID` in the vertex shader (use `ctx.mkProg(vs, fs, 'dust')`, the raw two-source form; create an empty VAO with
`ctx.gl.createVertexArray()` and bind it before drawing). `count = [20000, 45000, 90000, 150000][tier]` where
`tier = q<.25?0 : q<.5?1 : q<.8?2 : 3` from `ctx.Q.q`; upload `uCount` so brightness is normalised by count. Additive
blending `ONE, ONE`; clear colour AND depth (enable depth test as the source does, and disable it again after drawing —
you are rendering into a colour-only target the core hands you, so if a depth attachment is needed you must not assume
one: prefer `gl.disable(gl.DEPTH_TEST)` and rely on additive blending, unless the source really depends on depth).
It is the highest-trail scene: declare `post: { fb: { decay: 0.95 }, bloom: { thr: 0.3 }, kaleido: 0.5 }` — never fake
trails in the shader. Reads (from the mapping): `flow flowMid bassS midS lvl kick dropEnv tension hat alive` +
`LOOK.mood` + `uSpec` (per-particle frequency ownership) + `uWave` (the ribbon formation). Do not read anything else.

Camera: synapse used a director camera. Build a minimal one in `update()`: eye at distance ~4.4 (synapse's framing at this fov) on a slow orbit whose
yaw = `0.35 * GROOVE.rot + 0.05 * MS.flow`, pitch a gentle `0.3 * sin(0.03 * MS.flow)`, looking at the origin, vertical
fov ~55°, near 0.1 far 10.1 (match VS_SWARM's depth convention). Pass view-projection as one `mat4` uniform (or the
pieces VS_SWARM expects). `GROOVE` is the 3rd argument of `update`.

`score(MS)`: `MS.arc === 'build' ? 0 : 0.3 + 0.5 * MS.punchy + 0.2 * MS.regularity` (the director's home scene owns
builds). `help`: eli5 "every dot is a particle that owns one frequency band of the spectrum", why, and the math of the
Fibonacci sphere / torus parametrisation.
