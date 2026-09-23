# DUST fibre-overlay worker brief (v0.2 §14) — read docs/workers/brief-common.md first (the "may read" rules, the synapse
# mapping table and the report format all apply)

Target: `assets/scenes/dust/` — the overlay goes into `index.js` (181 lines today; add `fibre.js` in the same folder if
the cap needs it: warn 350 / fail 500 per file, `node tools/check.js`). PORT=8776. You are in your own git worktree;
commit there with a message starting `DUST-FIBRE:`. Nothing is registered: DUST is id 1 already.

**You may read:** `docs/workers/brief-common.md`, `docs/CONTRACTS.md` (§0, §1.1 `ctx.budget`/`ctx.lines`, §1.4, §1.6,
§1.12 **path A**, §1.13), `docs/HARNESS.md`, `assets/scenes/dust/*` (yours), `assets/math/hopf.js` (pure functions; its
header comment is the mathematics), `assets/scenes/polytope/index.js` lines 50–60 and 130–165 (the only other path-A
scene: `mk` in init, `set` + `draw` with an `mvp` at the end of `draw`), and synapse2.html lines **1168–1172** (`hopf()`)
and **1207** (the scene-4 call that sizes it) — nothing else of synapse. Do NOT open `assets/core/`, `assets/engine/`,
other scenes, or `tools/lines-smoke.js`.

**What it is.** Synapse's swarm drew, over the particles and in the same camera, a few Hopf tori: `nl` latitude circles of
the base S², each carrying `nF` fibres (linked circles in R³ after stereographic projection), each fibre a polyline of
`N` segments. They read as faint linked rings threading the dust — the swarm stays the subject. v0.1 dropped them
because synapse's depth test was broken; `ctx.lines` exists now. TORUS (id 3) *is* the Hopf fibration done as a scene:
your overlay must not look like a second TORUS (144 rings, bright, the whole frame) — it is 2–4 tori of 5–10 fibres,
dim, additive, inside and around the cloud.

**Geometry (all from `assets/math/hopf.js`, CPU, per frame — ≈ 2 k points, trivial):** synapse's `hopf(nF, lat, N, tw,
r4, ta, w, it)` parametrised a fibre by hand; here `fibre4(theta, phi, psi)` → S³, `rotSU2(z, alpha)` (the same
one-parameter tumble synapse applied in its `(y, q)` plane: rotates the base about the x axis, fibres go to fibres),
`stereo(z, out)` → R³, or `fibre(theta, phi, psi, psi0, alpha, delta, out)` for all three at once. Mapping of the 1207
call: `theta = lat = π·(l+1)/(nl+1) + 0.25·sin(0.2·flowMid + l)` (colatitude of torus `l`), `phi = f/nF·2π + tw` with
`tw = 0.15·flowMid·(l % 2 ? 1 : −1)`, `psi = i/N·2π` (`i = 0..N`, closed), `alpha = r4 = 0.06·flowBass`, `psi0 = 0`,
`delta = 0`. Counts by tier exactly as synapse's `q = [0.4, 0.7, 1, 1.4][tier]`: `nl = floor(2 + 2q)`, `nF = floor(5 +
5q)`, `N = floor(30 + 26q)` (tier 3: 4 × 10 × 56 = 2240 segments). **The total must stay ≤ `ctx.budget('segs')`** at
every tier (2500 at tier 0 — it does; assert it, drop fibres if not); `ctx.lines.mk(2560)` once in `init`. Pole gate as
synapse: with `den = 1 − z[3]` (the fourth S³ coordinate *before* `stereo`), emit the segment only when
`min(den_i, den_{i−1}) > 0.14` and scale its brightness by `min(1, (min(den) − 0.14)·4)` — through the colour, alpha
stays 1 (CONTRACTS §1.12 "alpha is coverage"). Scale: synapse's `setT(0,0,0, 1.25·g, …)` with `g = (1 − 0.3·tension)·
(1 + 0.6·dropEnv + 0.08·kick)` — multiply the projected points by `s = S0·g`; pick `S0` so the tori thread the cloud
(the swarm's formations have radius ≈ 1; the camera is `lookVP` at `dist` 4.4, fov 55°, so the half-height of the frame
at the origin is 2.3 world units): start at `S0 = 0.9`, judge on the shot, say what you chose.

**Rendering — path A, after the points, same target, no depth:** `ctx.lines.set(this.L, segs, n)` then
`ctx.lines.draw(this.L, target, w, h, { mvp: this.vp, blend: 'add' })` as the last thing in `draw()` (after the points'
`drawArrays`, after your BLEND/DEPTH restore — `draw` binds its own program and restores state itself). The points
have no depth test (the target's depth buffer is cleared but unwritten by them), so `depth: false`: the fibres add over
the cloud. `this.vp` is the matrix DUST already builds in `lookVP` for `uVP` — the same world space as the particles.
Segment layout: 12 floats `x0 y0 z0 w0 x1 y1 z1 w1 r g b a`, `w` = stroke width in **px** at that end: use
`wpx = 1.5·(h/720)·dist/viewZ` where `viewZ` is the clip `w` of the point (`vp[3]·x + vp[7]·y + vp[11]·z + vp[15]`),
so near fibres are wider like the points. Colour = synapse's per-fibre brightness `it·(0.35 + 1.3·b)` with
`it = 0.3·(0.35 + lvl)` and a palette coordinate `ta + f/nF·0.6` (`ta = 0.15 + 0.22·l`) through a `palM` built from
`LOOK.mood` like DUST's shader does (`hue + spread·t`, sat, bri — you may do it on the CPU with `ctx.hsv`). `b` was
`spec(f/nF·0.85)` — scenes have no spectrum array: use **`[bassS, midS, highS][l % 3]`** per torus (a third band read,
`highS`, goes into `feats`), optionally modulated per fibre by `MS.chroma[(5·f) % 12]` (note ENGINE.md: chroma is zero
on the fake timeline, so a chroma term must have a floor). `a = 1`. `presence`-scaled like the points if DUST does that.

**Rules.** No `Math.random()`, no wall clock (`#test` is bit-identical: `CLOCK=1` frame-360 shots must match across two
runs). `look` untouched (the formation pair), `cuts` stays `'onset'` (the fibres are continuous — no reform, no jump).
`feats` gains every new read (`flowBass`, `highS`, `chroma` if used, …) and **`help.feats` gets a line for each** and an
updated line for the existing fields the overlay now also moves (`flowMid`: twist + latitude wobble; `bassS/midS`: torus
brightness; `lvl`; `tension/dropEnv/kick`: the scale `g`) — `check.js` warns on a gap. Update the header comment of
`index.js` (it says the overlay is dropped) and add one sentence to `help.eli5` and `help.math` (linked Hopf circles;
TORUS's help has the full mathematics — keep yours to what is on this screen). A test hook `hooks: { fibres(v) {…} }`
(`this.fibresOn = +v`, default 1) — under `#test` `&fibres=0` calls it before the first frame.

**Acceptance (repo root, all must pass):**
1. `node tools/check.js` → 0 fail (0 warn on your files).
2. `PORT=8776 GPU=1 node tools/cdp.js 'test&scene=1' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),glerr:CARD.ctx.gl.getError()})"},{"shot":"work/dustf-t6"},{"wait":8200},{"shot":"work/dustf-t14"}]'`
   and the same with `&fibres=0` → `dustf-t6-nofibre`, `dustf-t14-nofibre`. Read all four: legible rings threading the
   cloud, the swarm still the subject, visibly different from TORUS; no white-out at t14 — measure it:
   `python3 -c "from PIL import Image;im=Image.open('tools/work/dustf-t14.jpg').convert('RGB');px=list(im.getdata());print('white',sum(1 for p in px if min(p)>250)/len(px)*100,'%')"`
   (report the number; §11 accepted 0.000 % pure white).
3. **The A/B md5 (the points path untouched):** `CLOCK=1 PORT=8776 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=1&fibres=0' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"dustf-f360-off"},{"until":"window.__FRAME>=840"},{"shot":"dustf-f840-off"}]'`
   → `md5sum` must be **`e49cf54ee319db5cd6ac78150a3f977d`** (f360) and **`7119a54250be3ea0c09b1590ce3b9171`** (f840):
   today's DUST, byte for byte. Then the same without `&fibres=0` twice → `dustf-f360-on` identical across the two runs
   (determinism) and different from `-off`.
4. `PORT=8776 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&scene=1' '[{"wait":10000},{"shot":"work/dustf-h10"},{"wait":20000},{"shot":"work/dustf-h30"},{"wait":20000},{"shot":"work/dustf-h50"},{"eval":"CARD.bench(1,300);JSON.stringify({errs:CARD.ERRS,q:CARD.Q.q,on:[CARD.bench(1,300),CARD.bench(1,300),CARD.bench(1,300)],off:(CARD.hooks.fibres(0),[CARD.bench(1,300),CARD.bench(1,300),CARD.bench(1,300)]),glerr:CARD.ctx.gl.getError()})"}]'`
   → medians on vs off, back to back in one page (the absolute numbers swing with load; only the difference counts —
   ~0.1 ms is the expectation). Report the segment count per tier (log it from `draw` once via `this.rt.log`).
5. Tier sweep: `{"eval":"setInterval(function(){CARD.Q.q=0.1},16);'q0'"}` … wait 8 s … shot; `0.95` … shot: fewer
   fibres and segments at tier 0, the same look.
6. `feats` is exactly the fields you read; `help.feats` covers them; `hooks.fibres` exists; DUST's `look`, `score`,
   `post`, `cuts`, `id` unchanged.

**Report** (`docs/workers/dust-fibre.md`, the deliverable): brief-common (a)–(e), plus (f) `S0`, the width and the
brightness you settled on and why, (g) the md5 lines of step 3 verbatim, (h) the bench medians on/off and the segment
counts per tier, (i) the white-pixel percentage, (j) what each shot showed in one line each.
