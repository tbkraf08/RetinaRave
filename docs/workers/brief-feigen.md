# FEIGEN worker brief (v0.2 §15) — read docs/workers/brief-common.md first (the "may read" rules, the synapse mapping
# table and the report format all apply)

Target: `assets/scenes/feigen/` → `index.js` + `shaders.js` (each ≤ 350 lines). Scene `name: 'feigen'`, `id: 6`,
`cuts: 'event'`. PORT=8777. Register it in `assets/main.js` (the two lines of CONTRACTS §1.8) and update the ids table
there to `6 feigen`. You are in your own git worktree; commit with a message starting `FEIGEN:`.

**You may read:** `docs/workers/brief-common.md`, `docs/CONTRACTS.md`, `docs/HARNESS.md`, `docs/ENGINE.md` (the
"Textures derived from engine arrays" bullet), `assets/scenes/mandala/index.js` + `shaders.js` (a fragment scene lifted
from synapse: the shape to copy — `palM`, aspect-corrected `p`, uniform uploads, `feats`, `help`), `tools/check.js` (the
uniform idiom), and these lines of `~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html` with `sed -n`:
**928–962** (`FS_FEIGEN` and its header — the mathematics: perturbation zoom, tricorn flip, the DE), **660–668**
(`spec()`, `hist()`, `rot()` — copy `spec`/`hist` as `specM`/`histM`, HEAD has `rot`), **1099** (`C_FEIG`, `DELTA_F`),
**1293–1296** (the reference orbit: 512 doubles of `z ← z² + c∞` uploaded once as an R32F 512×1 texture, NEAREST),
**1450** (on entering the scene: `feigL = min(feigL, 1.2)`), **1468** (the drop: `tricorn` flips and `feigL += 1`),
**1489** (the kick-hidden wrap), **1550–1551** and **1554** (the phase driver and `feigMax()`), **1580–1581** (the
uniform pack: `wd`, `P0`, `P1`). Nothing else of synapse; do NOT open `assets/core/`, `assets/engine/`, other scenes.

**What it is.** A dive down the real axis of the Mandelbrot set toward the Feigenbaum point `c∞ = −1.401155189…`, the
limit of the period-doubling cascade. Each unit of `feigL` zooms by one Feigenbaum factor `δ = 4.6692…`, and because the
cascade is asymptotically self-similar under exactly that factor, level `L + 1` looks like level `L`: the dive can loop
forever. Precision comes from perturbation theory: the reference orbit `Z_n` of `c∞` itself is computed in double on the
CPU (it is real and bounded), and each pixel iterates only its offset `e_n`: `e' = 2·Z·e + e² + dc`, exact algebra, so
float32 never runs out however deep `L` goes. The tricorn flip `z → conj(z)² + c` keeps the same real reference orbit
(the real slice of the Tricorn is the real slice of M): `e' = conj(2·Z·e + e²) + dc`. Colouring: distance-estimated
filaments (`d ≈ |z| ln|z| / |z'|` with `z' ← 2·z·z' + 1`, `z'_0 = 0`), Green's-function bands (level sets spaced by
factors of 2 in G, `lG = log2(log r) − n`), and the spectrogram's past `hist()` drifting off the boundary.

**Translation (brief-common's table, plus):**
- `camPix((gl_FragCoord.xy − .5·uRes)/uRes.y)` → `p = (gl_FragCoord.xy − .5·uRes)/uRes.y` (MANDALA's line 45; no camera).
- `P0 = (centre − c∞, width, tricorn)`, `P1 = (rot, maxIter)` → your own uniforms: `uCentre` (vec2), `uWidth`, `uTricorn`,
  `uRot`, `uIter` (int, fetched as `'uIter'`). From 1580–1581: `wd = 3.2·δ^(−L)·(1 + 0.25·tension − 0.18·dropEnv −
  0.03·kick)`, `uCentre = (wd·(0.30 + 0.02·sin(0.2·flowMid)), wd·0.03·sin(0.13·flowMid))`, `uWidth = wd`, `uRot =
  0.04·sin(0.17·flowMid)`, `uIter = min(500, (70 + 30·L²)·[0.6, 0.8, 1, 1.25][ctx.tier()])` (the loop bound stays 512).
  `roll = 0.4·sway` is the director camera — ignore it.
- `uOrbit`: build in `init` with raw `gl` (`ctx` has no float-texture helper — `ctx.gl.createTexture()`, `texImage2D(…,
  gl.R32F, 512, 1, 0, gl.RED, gl.FLOAT, orb)`, MIN/MAG NEAREST, CLAMP_TO_EDGE; R32F + `texelFetch` needs no extension in
  WebGL2), keep it as `this.orbit = { t }` and bind with `ctx.tex(pr, 'uOrbit', 2, this.orbit)`. The 512 values are
  computed in JS doubles (`z = z·z + C_FEIG`, `orb[i] = z` before the step) and stored as float32 — that is synapse's
  choice and the point of the method (only the *offset* needs precision).
- `spec(x)` → `specM` on `ctx.engineTex.spec` (unit 0); `hist(x, age)` → `histM` on `ctx.engineTex.hist` (unit 1) with
  **`uHistRow = (ctx.engineTex.row − 0.5)/128`** uploaded every frame (`row` is the next row to be written; the texture
  wraps, REPEAT). `uFlowHigh` is not read by FS_FEIGEN; `uBass uLevel uKick uDrop uHat uFlow uMidS uTension uAlive` per
  the table; `pal()` → `palM` from `LOOK.mood` exactly as MANDALA's `shaders.js` does. HEAD provides `uRes`, `rot`, `TAU`.
- The phase (`update`): `period = 60 / max(MS.bpm, 40)`; `feigL += dt/(32·period)·(0.25 + 1.5·lvl)·(1 − 0.8·tension)·
  alive`; `if (feigL > feigMax() + 1) feigL −= 1` with `feigMax = [3.4, 4, 4.6, 5][ctx.tier()]`; the kick-hidden wrap of
  line 1489 on a rising edge of `MS.kick > 0.5` (`feigL > feigMax()` → `−= 1`); `MS.dropEvt` → `feigL += 1` (a jump by one
  δ is self-similar, so it is nearly invisible — say in `help.why` that this is the trick); on becoming the logical scene
  (`env.SC.logical === this.id`, rising edge) `feigL = min(feigL, 1.2)`. **The tricorn flip is keyed on the section
  seed, not the drop** (this engine's director hard-cuts to the home scene on drops; a drop flip would never be seen):
  on `MS.sectionEvt`, `tricorn = Math.floor(MS.seed.a·1000) % 2`; also at `init`. That flip is the one declared jump
  (`cuts: 'event'`); everything else is continuous by construction (the DE is scale-free).
- `score(MS)`: `MS.arc === 'build' ? 0 : 0.2 + 0.4·MS.regularity + 0.25·MS.clarity + 0.15·MS.calm` (home owns builds).
- `look: { get() → [feigL, tricorn], set(v) }`; `hud()` → `'feigen L' + feigL.toFixed(2) + (tricorn ? ' tricorn' : '')`;
  `hooks: { feig(v) { feigL = +v }, tricorn(v) { tricorn = +v } }` (`&feig=3&tricorn=1` under `#test`); `post`:
  `{ fb: { decay: 0.55 }, bloom: { thr: 0.3 }, kaleido: 0 }` (the set has its own symmetry; a kaleidoscope would fake it).
- `feats`: exactly the fields you read (score + update + draw), `help` three depths (eli5 / why / math — the cascade,
  δ, why the loop is seamless, perturbation, the tricorn, the DE and Green bands), and a `help.feats` line per field.
- `rt.time = MS.flow`; `rt.label = 'L' + feigL.toFixed(2)`.

**Acceptance (repo root, all must pass):**
1. `node tools/check.js` → 0 fail, no warn on your files.
2. `PORT=8777 GPU=1 node tools/cdp.js 'test&scene=6' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical,glerr:CARD.ctx.gl.getError()})"},{"shot":"work/feig-t6"},{"wait":8200},{"shot":"work/feig-t14"}]'`
   → ERRS `[]`, nonFinite `[]`, glerr 0; Read both shots: a recognisable Mandelbrot-antenna zoom (period-doubling
   minibrots along a horizontal axis, filaments, bands) at t6, brighter/flared by the drop at t14.
3. Determinism: `CLOCK=1 PORT=8777 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"feig-f360a"},{"until":"window.__FRAME>=840"},{"shot":"feig-f840a"}]'`
   twice (`…b`) → `md5sum` identical pairs.
4. **The hist proof (this is why the scene exists first):** the same command with `'test&scene=6&histfull=1'` →
   `feig-f360-full`, `feig-f840-full`: md5 **equal** to step 3. (`&histfull=1` makes the core upload the whole spectrogram
   texture every frame instead of the rows that changed; equality proves the row path feeds your `histM` the same
   texture.) If they differ, do not touch the core: make sure `uHistRow` and the age term are what the brief says, then
   report the md5s and the difference (a montage) — it is the orchestrator's problem.
5. `PORT=8777 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&scene=6' '[{"wait":10000},{"shot":"work/feig-h10"},{"wait":20000},{"shot":"work/feig-h30"},{"wait":20000},{"shot":"work/feig-h50"},{"eval":"CARD.bench(6,300);JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),q:CARD.Q.q,b:[CARD.bench(6,300),CARD.bench(6,300),CARD.bench(6,300)],L:CARD.REG[6].scene.rt.label,glerr:CARD.ctx.gl.getError()})"}]'`
   → three different frames (the dive advances: report `L` at each), bench medians (ms; keep it in the range of NAV's
   2.7–2.9 ms at tier 3 — say what you measured and the `uIter` it ran at).
6. `PORT=8777 GPU=1 node tools/cdp.js 'test&scene=6&feig=3&tricorn=1' '[{"wait":6000},{"shot":"work/feig-L3-tricorn"},{"eval":"CARD.REG[6].scene.hud()"}]'`
   and `…&feig=3` (no tricorn) → `feig-L3`: both deep (level 3), the tricorn one visibly different off the axis.
7. Tier sweep as in HARNESS ("Pinning quality"): `setInterval(()=>CARD.Q.q=0.1,16)`, wait 8 s, shot; `0.95`, shot —
   fewer iterations at q0 (report `uIter`), the same structure.
8. Real path: `PORT=8777 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS,hist:CARD.SC.hist})"}]'`
   → `bad []`, `errs []`, 0 `[EXC]` lines in the output; report whether 6 appears in `hist` (it may not in 45 s —
   the director's picks are scored; say what it picked).
9. The scene object has `name id tag feats cuts score init update draw post help look hud hooks`; `feats` is exactly the
   fields you read; `help.feats` covers them.

**Report** (`docs/workers/feigen.md`, the deliverable): brief-common (a)–(e), plus (f) the md5 lines of steps 3 and 4
verbatim, (g) bench medians and `uIter` per tier, (h) what each shot showed in one line, (i) the final `feats`.
