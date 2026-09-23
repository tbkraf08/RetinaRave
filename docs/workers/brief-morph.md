# MORPH transition worker brief (v0.2 §11) — read docs/workers/brief-common.md first (its "may read" rules and report
# format apply; its uniform-translation table is the vocabulary)

Target: `assets/transitions/morph.js` — one file, ≤ 350 lines, `name: 'morph'`. PORT=8776. Register it in
`assets/main.js`: an import next to `import mixs from './transitions/mixs.js';` and `morph` appended to the list
`for (const tr of [mixs]) addTransition(tr, ctx)`. Leave `setTransition('mixs')` alone — the default is the
orchestrator's decision, made on your A/B shots.

**You may read ONLY:** `docs/CONTRACTS.md` (§5 is your contract; §0, §1.1, §1.2, §3 for ctx/HEAD/the uvS rule),
`docs/HARNESS.md`, this brief, `docs/workers/brief-common.md`, `assets/transitions/mixs.js` (the worked example: v3's
crossfade as a transition — same shape, same `use/tex/tri` idiom, note its `smp()` clamp), `tools/check.js` (for the
uniform idiom), and these lines of `~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html` with `sed -n 'a,bp'`:
**672–676** (`hash11`/`hash21`/`vnoise`), **1012–1032** (`POST_HEAD` + `FS_MORPH`, the shader you are lifting),
**1350–1354** (how the pass was driven: `uT = (trans, flow, kick)`), **1453** (`morph()` — `trans` starts at 0) and
**1505** (the musical advance: `trans += dt·rate·(0.35 + 1.3·level) + kick·dt·0.9`). Do NOT open `assets/core/`,
`assets/engine/`, `assets/effects/` or `assets/scenes/`. A question the docs do not answer goes in your friction log;
guess and continue.

**What it is.** Synapse's crossfade: scene B eats through scene A along a value-noise front (`n` from two `vnoise`
octaves plus a radial term; `m = smoothstep(...)` on `t·1.5 − .25 − (1−n)·.9 + .1`), both textures are advected by a
noise flow field `wv` (A pushed forward by `t`, B pulled back by `1−t`, both scaled by `1 + kick`), and a bright
additive edge `exp(−((m−.5)·5)²)·sin(πt)·(a+b)·.9` rides the front. One pass, four texture reads, six `vnoise`.

**Translation (CONTRACTS §5 says the same; the mapping):**
- `gl_FragCoord.xy/uR` → `vUv`. `uR` → HEAD's `uRes` (already declared and uploaded by `ctx.use`; do not declare it).
- Sampling `uA`/`uB`: the targets hold the scene at `(sw, sh)` inside `(w, h)`, so every sample coordinate is
  `clamp(uv', 0., 1.) * uUvS` — like `mixs.js`'s `smp()`. Unclamped, the advected edges read a stale border.
- `POST_HEAD` is replaced by HEAD (§1.2): drop `#version`, `precision`, `out vec4 o`. Bring `hash21` and `vnoise` in
  your own source (HEAD has only `hash(vec2)`; keep your names distinct from `hash`, `pal`, `rot`, `cmul`).
- `uT.y` (flow) → `MS.flow` · `uT.z` (kick) → `MS.kick` · `uT.x` (trans) → `t`, below. Declare your own uniforms and
  fetch each with `pr.u('name')` (check.js fails on a declared-but-never-fetched uniform).
- **`t` — the musical push on the director's clock.** `io.m` is the crossfade position and the director's clock; your
  picture must be `a` at `m → 0` and `b` at `m = 1` (the core stops rendering `b` on that frame). Synapse advanced its
  own `trans` with level and kicks; here that is a *shape* on top of `m`: `t = max(m, ease)` where `ease` is a
  per-transition accumulator that runs ahead of `m` on level and kicks but never lags it. Deterministic: derive it from
  `m`, `MS.lvl`, `MS.kick` and `io.dt` only (no wall clock, no `Math.random()`); reset it to `m` whenever `m` is not
  ≥ last frame's `m` (a new fade starts at `m = dt/dur`; a reversed fade jumps to `1 − m` with `a`/`b` swapped). A
  starting point: `ease = min(1, ease + dm·(1 + 1.3·lvl) + kick·dt·0.5)` with `dm = m − mPrev` — tune it so that on
  the fake timeline's first fade (below, frame 290, `m ≈ 0.50`) the front is still mid-screen (`t` in roughly
  0.5–0.75), otherwise the A/B against `mixs` on the same frame is meaningless. Say what you chose and what `t` is at
  frame 290 (`ctx.log` it under `#test`, or keep it on `this` and read it with an eval).
- `a`/`b` are RGBA16F, unclamped: the additive edge can exceed 1 (bloom likes that) — but look at the composite: if
  the whole front clips to white, scale the edge down and say so.
- Draw at `(io.sw, io.sh)` into `io.out` with `ctx.use(pr, io.out, io.sw, io.sh)` and return `io.out` (the simple path;
  no target of your own, no resize hook needed). Entry GL state is documented in §5; leave it as you found it.

**Acceptance (all from your worktree root, all must pass; shots go to `tools/work/` prefixed `morph-`):**
1. `node tools/check.js` → `0 fail`.
2. The fake timeline's first fade (NAV → TORUS, switch at 3.88 s, fade 116 frames), frame 290 = `m ≈ 0.499`:
   ```
   PORT=8776 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&trans=morph' '[{"until":"window.CARD"},{"until":"window.__FRAME>=290"},{"shot":"morph-f290"},{"eval":"JSON.stringify([CARD.SC.cur,CARD.SC.next,CARD.SC.m,CARD.ERRS,CARD.nonFinite()])"}]'
   ```
   → `[0,3,0.4994…,[],[]]`. Run it **twice**: `md5sum` of the two shots identical (determinism). Then the same
   command with `'test&trans=mixs'` → `morph-f290-mixs.jpg` — Read both images and say what differs.
3. Three more pairs at `m ≈ 0.5` (`&scene=A` forces A; at frame 120 the eval releases the director and starts the
   fade to B; 58 frames later `m = 58/60/1.935 ≈ 0.50`):
   ```
   PORT=8776 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=A&trans=morph' '[{"until":"window.CARD"},{"until":"window.__FRAME>=120"},{"eval":"CARD.SC.forced=-1;CARD.goScene(B,false);CARD.SC.next"},{"until":"window.__FRAME>=178"},{"shot":"morph-A-B-f178"},{"eval":"JSON.stringify([CARD.SC.cur,CARD.SC.next,CARD.SC.m,CARD.ERRS])"}]'
   ```
   for (A, B) = (0, 2) NAV → MANDALA, (1, 3) DUST → TORUS, (5, 0) POLYTOPE → NAV. Read each shot: both scenes must be
   recognisable, the front visible, no black border at the edges of the frame (the clamp), no white-out.
4. Cost: after the shots, in a fresh page, `CARD.benchTransition(300)` three times; report the median for `mixs` and
   `morph` (ms per full-resolution pass, 1280×720 headless). Example:
   ```
   PORT=8776 GPU=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"wait":2000},{"eval":"JSON.stringify([CARD.benchTransition(300),CARD.benchTransition(300),CARD.benchTransition(300)])"}]'
   ```
   Budget: the morph should cost no more than ~3× `mixs`; if it does, say where the time goes (drop a `vnoise` octave?).
5. A 45 s real-path run without errors (the house demo's first soft switch lands at ~23 s; the first version of this
   brief said 20 s and failed as printed): `PORT=8776 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&trans=morph'
   '[{"until":"window.CARD"},{"wait":45000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),glerr:CARD.glerr,log:CARD.log.filter(l=>/SCENE@/.test(l))})"}]'`
   → at least one `SCENE@` switch happened (the fade ran), `errs` and `bad` empty, `glerr` undefined.

Commit in your worktree when done (`git add assets/transitions/morph.js assets/main.js docs/workers/morph.md`).

**Report (the deliverable, also written to `docs/workers/morph.md`):** (a) friction log — every question CONTRACTS §5
did not answer (quote the missing sentence) and every guess; (b) whether you were tempted to open a forbidden file and
why; (c) the exact acceptance outputs (EVAL lines, md5s, the bench medians) and what each screenshot showed, morph vs
mixs; (d) anything wrong in the docs; (e) the ease rule you chose and `t` at frame 290; (f) the uniforms you declared.
