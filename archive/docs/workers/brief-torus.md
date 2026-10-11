# TORUS worker brief (§4) — read docs/workers/brief-common.md first (the "may read" rules and the report format apply;
# the synapse mapping table does not — this scene is new, not lifted)

Target: `assets/scenes/torus/` → `index.js` + `shaders.js`. Scene `name: 'torus'`, `id: 3`, `cuts: 'continuous'`.
PORT=8773. You may ALSO read `assets/math/hopf.js` (pure functions; scenes may import `assets/math/*`) and
`tools/test_hopf.js` (shows what the functions guarantee). Nothing else beyond the common brief's list.

**What it is — sacred geometry that is real geometry.** The Hopf fibration: S³ ⊂ C² fibres over S² by circles.
Stereographic projection to R³ sends the fibres over one latitude circle of S² onto a torus (a Clifford torus at the
equator), each fibre a Villarceau circle of that torus. Nested latitudes → nested tori: the classic "torus field", except
every ring here is a genuine fibre. `hopf.js` gives you `fibre(theta, phi, psi, psi0, alpha, delta)` → R³ (theta =
colatitude of the base point, phi = longitude, psi = position along the fibre, psi0 = Hopf flow, alpha = SU(2) tumble,
delta = pole offset), `torusRadii(theta)`, `knot(theta, p, q, t, …)` (the (p,q) torus knot on the same torus) and
`hopfMap`. Read its header comment: the math is there.

**Rendering.** Like a particle scene: K fibres × N points per fibre, drawn as `gl.POINTS` with NO vertex buffer — the
vertex shader derives (fibre index, point index) from `gl_VertexID` (`ctx.mkProg(vs, fs, 'torus')`, an empty VAO
bound). **Do the fibration math in GLSL** (port `fibre4` → `rotSU2` → `poleOffset` → `stereo` from hopf.js into the
vertex shader; keep the JS functions as the reference and make sure a few CPU-computed points match the GPU's — e.g.
render with a known uniform set and compare against `fibre()` in an `{eval}`, or just trust the port if it renders the
tori). Tier scales K·N with `ctx.Q.q`: `[20000, 45000, 90000, 150000][tier]` points total. Additive blending, points
sized by depth. A simple camera (eye on a slow orbit at distance ~4, looking at the origin, fov ~50°) — the tumble
comes from the SU(2) rotation on S³, not from the camera; keep the camera gentle.

**Music → geometry (all through MS; read nothing else):**
- The 12 pitch classes are 12 base-point *families* at longitudes φ_k = 2πk/12. `chroma[k]` (0..1) sets family k's
  brightness AND its latitude: `theta_k = 0.12 + chroma[k] * (π/2 − 0.12)` (louder pitch class → nearer the equator →
  fatter torus). Each family has K/12 fibres spread in a small longitude band around φ_k (or all at φ_k with different
  psi offsets — your call; nested distinct tori must be visible). The chroma vector literally is the torus family.
- `interval` (0..11) picks the (p,q) of a highlighted torus-knot fibre traced by the melody: use the table
  `[[0,1],[1,15],[1,8],[1,5],[1,4],[1,3],[2,5],[1,2],[3,5],[2,3],[4,5],[7,8]][interval]` (the same rotation numbers
  NAV uses for its bulbs — mathematically coherent with NAV). Draw the knot brighter/warmer on the torus of the
  loudest family, as one extra strand of points, its parameter advancing with `harmUnw` (melody position).
- `beatPhase` advances the Hopf flow: `psi0 = 2π·(beatCount + beatPhase)/8` (every circle rotates in place, in lockstep —
  the breathing; one full turn per 8 beats). `GROOVE.rot` drives the SU(2) tumble `alpha = 0.6·GROOVE.rot`.
- `bass` → tube-radius pulse: scale the projected point radially from its fibre's torus centre-circle by
  `1 + 0.25·bass` (or scale theta slightly); `tension` → pole offset `delta = 0.9·tension` (the picture pinches toward
  the pole as roughness rises); `dropEvt` → collapse to the core circle over one beat and bloom back: keep a spring or
  ema `collapse` that jumps to 1 on dropEvt and decays with `exp(-dt·bpm/60)`; blend theta toward 0 by it.
- `valence`/`arousal` → colour via `LOOK.mood` (hue/sat/bri); `presence` → overall brightness so muted audio idles.
- `score(MS)`: `MS.arc === 'build' ? 0 : 0.25 + 0.45 * MS.clarity + 0.3 * MS.regularity` (favours harmonically clear,
  steady music; never auto-picks during builds).
- `post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0 }` (the geometry is its own symmetry; no kaleidoscope).
- `help`: eli5 "every ring is one fibre of the Hopf map: a circle in the 3-sphere that you see through a stereographic
  window; rings over the same latitude of the base sphere nest on one torus", why (louder pitch class = fatter torus;
  the melody's interval picks the knot's (p,q), the same numbers that pick NAV's bulb), math (the fibre formula, the
  torus radii R = 1/cos(θ/2), r = tan(θ/2), and why Villarceau circles never meet).

**Acceptance (in addition to the common items 1, 2, 4):** the t6 and t14 shots on `#test&scene=3` show nested tori of
rings that are clearly *different* between the two (t14 is just after the drop: collapse/bloom, different chroma
brightness); and a 30 s `&demo=ambient` run: `PORT=8773 GPU=1 node tools/cdp.js 'test&fake=0&demo=ambient&scene=3'
'[{"wait":8000},{"shot":"work/torus-a8"},{"wait":11000},{"shot":"work/torus-a19"},{"wait":11000},{"shot":"work/torus-a30"},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),bench:CARD.bench(3,60),chroma:Array.from(CARD.MS.chroma).map(x=>+x.toFixed(2))})"}]'`
shows the torus family visibly re-shaping with the chroma across the three shots (ambient changes chords every 8
beats at 60 BPM). Report `bench` at the default tier; it must stay under ~4 ms.
