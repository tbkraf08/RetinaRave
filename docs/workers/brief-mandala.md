# MANDALA worker brief (§3) — read docs/workers/brief-common.md first

Target: `assets/scenes/mandala/` → `index.js` + `shaders.js`. Scene `name: 'mandala'`, `id: 2`, `cuts: 'event'` (the
fold count N changes only on section events / every 64 kicks). PORT=8772.

Source: synapse scene 2 "mandala". Read exactly these ranges of synapse2.html:
- 769–798: `FS_MANDALA`. N-fold angular fold with `N = 4 + 2*floor(hash*5)` ∈ {4,6,8,10,12} from the section seed;
  7–10-iteration box-fold / inversion `z = abs(z)/clamp(dot(z,z)) − c; z = R·z` with the spectrum injected per iteration
  (line 785); orbit-trap glow; spectrum ring; centre kick flare; vignette. It writes `gl_FragDepth = 1.` — drop that
  line (you render into a colour-only target). It ignores `camPix()` — there is no camera here at all.
- 592–686: `GLSL_COMMON` — copy only the helper functions FS_MANDALA uses.
- 1535 (±2 lines): synapse damps its post-kaleidoscope to 0.6 on this scene → express as `post: { kaleido: 0.6 }`
  (plus `fb: { decay: 0.6 }`, `bloom: { thr: 0.35 }` or what looks right).
- Its 24-cell wireframe overlay is optional — skip it.

Fullscreen fragment scene: `ctx.mkProg(fs, 'mandala')` (HEAD prepended), `ctx.use(pr, target, w, h)`, set your
uniforms, `ctx.tri()`. Reads (from the mapping): `seed kickCount flowMid flow bass bassS midS kick tension dropEnv lvl
high hat alive` + `LOOK.mood` (incl. `angular`) + `ctx.Q.q` + `uSpec`. Do not read anything else. Iteration count
scales with `ctx.Q.q` (7 at q=0 → 10 at q=1).

`score(MS)`: `MS.arc === 'build' ? 0 : 0.25 + 0.55 * MS.regularity + 0.2 * Math.min(1, MS.onsetRate / 6)` — but only
list `onsetRate` in `feats` if you use it. `help`: eli5 "a kaleidoscope whose mirrors are a real Kleinian-style fold:
abs() folds and a sphere inversion, iterated", why (the fold group is what makes the symmetry exact, not a post effect),
math (the box-fold / sphere-fold map and why the orbit trap gives the glow).
