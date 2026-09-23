# Eigenwobble contracts

**This is the one required read.** To add a scene, an effect, or an analysis stage you read this file, the folder you
are writing, and `docs/HARNESS.md` for the commands. You never open `assets/core/` or `assets/engine/`. If something here
cannot be understood without opening the core, the contract is wrong: log it in the friction section at the bottom and
fix the doc, not the reader.

## 0. Rules that apply to everything

- Zero runtime dependencies. Native ES modules. WebGL2, fragment-shader-first. No bundler, no framework, no TypeScript.
- Every visual parameter traces to a field of `MS` (the music state vector, schema in `assets/engine/feats.js`) or to
  `GROOVE` / `LOOK`, which are themselves derived from `MS`. Never a hidden timer, never `Date.now()`, never
  `Math.random()` (`#test` must be bit-identical: derive randomness from `MS.seed.a`/`sectionId` and a counter through
  a hash), never a magic constant that moves. Muted audio must visibly idle. Event fields you gate on (`dropEvt`,
  `onset`, `beat`) belong in `feats` like any other read.
- Module cap: `tools/check.js` warns above 350 lines and fails above 500 (GLSL template strings count). Split
  `shaders.js` from `index.js` early. One statement per line, `//` comments are fine.
- Import discipline (enforced by `check.js`): a scene, effect or transition imports only from its own folder and from
  `assets/math/*` (pure functions). It never imports `assets/core/*` or `assets/engine/*`. Everything it needs from the
  core arrives in `ctx` (§1.1) and in the per-frame arguments.
- Scenes read `MS` and never write it. Stages add fields, never overwrite (§2).
- The mathematics must be correct to someone who knows it and legible to someone who doesn't: every scene ships a
  `help` entry with three depths.
- Every scene respects `Q` (adaptive quality, §1.6): iteration counts and particle counts scale with it.
- Verify with screenshots, not by reading the shader. `docs/HARNESS.md` has the commands.

## 1. Scene contract

A scene is a folder `assets/scenes/<name>/` whose `index.js` has a default export shaped like this:

```js
export default {
  name: 'dust',                 // folder name
  id: 1,                        // integer, unique across scenes and variants; keys 1–9 force id 0–8
  tag: 'one line for the HUD',
  feats: ['bass', 'flow'],      // every MS field you read anywhere in this object (score/update/draw); HEAD-delivered
                                // ones too (bass/mid/high via uBands). Names: Appendix A (typo = CARD.ERRS entry)
  cuts: 'continuous',           // your promise about discontinuities (§1.9): 'continuous' | 'onset' | 'event'
  score(MS, rt, SC) {},         // → 0..1 — your bid to be auto-picked now. Return 0 = never auto-pick now.
  init(ctx) {},                 // build programs and buffers. Called once, before the first frame. Keep ctx: this.ctx = ctx
  update(dt, MS, GROOVE, LOOK, env) {},   // CPU state. dt in seconds. Called every frame you are on screen (or always: see `always`).
  draw(target, { w, h, variant, vmix }) {},   // render into `target` (one of the core's targets, handed to you) at (w, h). Nothing else.
  post: { fb: { decay: 0.7 }, bloom: { thr: 0.35 }, kaleido: 1 },   // effect params (object or fn(MS) → object)
  help: { eli5: '', why: '', math: '',   // three depths, all required (§0); shown by the help view (§1.13)
    feats: { bass: 'fattens the tubes' } },   // optional: per field of `feats`, what it moves on THIS screen (§1.13)
  // optional slots:
  overlay(PW, PH, vis, dt) {},  // post-composite, direct to screen; you scissor. vis = your on-screen weight 0..1
  hud() { return 'one line'; }, // extra HUD line while you are the logical scene
  hooks: { baby(v) {} },        // test hooks: exposed as CARD.hooks.<name>; &<name>=v in a #test hash calls it
  variants: [{ id: 4, name: 'drum', tag: '', score(MS, rt, SC) {} }],  // sub-modes with their own id (§1.4)
  look: { get() {}, set(v) {} }, // look memory (§1.11): what to remember per section and restore on a return
  always: false,                // true = update() runs every frame even when off screen
  home: false,                  // true = the director's home scene (exactly one; NAV)
  rt: {},                       // runtime readout you publish (§1.3); the core creates {} if you leave it out
};
```

The core calls these as **methods on your exported object**: `this` is the scene. There is no channel between `init`
and `draw` other than what you keep yourself — stash `ctx`, programs and buffers on `this` (or in module-level
variables of your `index.js`). `ctx` is not passed again to `update`/`draw`/`overlay`.

### 1.1 `ctx` — everything a scene or effect may touch in the core

```
ctx.gl            the WebGL2 context (raw). On entry to draw(): BLEND off, DEPTH_TEST off, SCISSOR off, the target bound
                  and viewport set, colour NOT cleared (clear it yourself if you need to), depth cleared to 1. Leave it
                  that way on return.
ctx.mkProg(fs, name)          fullscreen program: HEAD + your fragment source, the shared triangle vertex shader
ctx.mkProg(vs, fs, name)      raw program (own vertex shader, e.g. gl_VertexID particles). No HEAD is prepended.
ctx.use(pr, target, w, h)     bind program + target (null = screen) + viewport and upload the common uniforms (§1.2);
                              fine for raw programs too (only the uniforms that exist are set)
ctx.tri()                     draw the fullscreen triangle
ctx.tex(pr, 'uName', unit, t)        bind t.t (any {t}: a target or an engine texture) to a unit and set the sampler.
                              Scenes may use units 0–7.
ctx.dynBuf(floats, comps)     a DYNAMIC_DRAW VAO with one float attribute at location 0 → {vao, buf}
ctx.upload(buf, Float32Array, n)     bufferSubData
ctx.mkTarget(w, h, rgba8=false, depth=false)   render target {t, f, w, h}; RGBA16F when available (rgba8 for CPU
                              readback); depth=true attaches a depth buffer (the core's scene targets have one)
ctx.lines                     the line renderer (§1.12): {VS, FS, mk, set, draw, drawN} — anti-aliased strokes with depth
ctx.freeTarget(t)
ctx.onResize(fn(w, h))        register a callback; allocate your own targets there (they are freed/rebuilt by you)
ctx.targets                   {a, b, m}: the core's full-size scene targets. draw() receives one of them as `target`;
                              draw into the one you are handed, never pick one yourself
ctx.engineTex                 {spec, wave, hist, row}: engine textures (R8, LINEAR). spec 256×1 log spectrum (30 Hz–16 kHz,
                              floor-subtracted, peak-normalised), wave 512×1 zero-crossing-triggered waveform (0.5 = silence),
                              hist 256×128 spectrogram ring (one row per ~10 ms hop, T wrap = REPEAT); row = the index the
                              next hop will write, so the newest row is row − 1: sample v = (row − 0.5)/128 for "now" and
                              subtract age/128 rows to go back in time (REPEAT wraps it; 128 rows ≈ 1.3 s). Bind with
                              ctx.tex(pr, 'uSpec', unit, ctx.engineTex.spec). Under #test the fake timeline fills them.
                              The core uploads only the hist rows written since the last frame (§13), so sampling hist
                              costs nothing extra; `hist` rows older than 128 hops (~1.3 s) are overwritten in place.
ctx.Q                         adaptive quality (§1.6) · ctx.tier() → 0..3 (q<.25, <.5, <.8, else) for particle budgets
ctx.budget(kind)              the count for the current tier from the core's tables (§1.4): 'points' → particles of a
                              gl_VertexID cloud, 'segs' → segments of a ctx.lines path-A buffer. Read it every draw.
ctx.LOOK                      the palette block (§1.5)
ctx.hsv(h, s, v) → [r,g,b]
ctx.log(string)               append to CARD.log (only under #test)
```

Programs from `mkProg` are `{p, name, u(name) → location}`; `u()` caches lookups. `mkTarget` targets are cleared to
opaque black on creation. `ctx.onResize` callbacks fire on the first resize at boot (before the first frame) and on
every later size change — allocate there and you are ready by frame 1. Shader compile/link errors are
pushed to `CARD.ERRS` (and `console.error`), never thrown.

### 1.2 Shared GLSL (`HEAD`)

Every fragment program built with `ctx.mkProg(fs, name)` starts with this, and `ctx.use()` uploads the uniforms:

```glsl
#version 300 es
precision highp float; precision highp int;
in vec2 vUv; out vec4 o;
uniform vec2  uRes;    // target size in pixels
uniform float uTime;   // visual clock: the current scene's rt.time, else a presence-scaled wall clock
uniform vec3  uBands;  // MS.bass, MS.mid, MS.high
uniform vec4  uBeat;   // MS.beatPhase, MS.hit, beats (beatCount+1-(1-beatPhase)^3), MS.dropEnv
uniform vec4  uArc;    // MS.eS, MS.build, MS.tension, MS.surprisal
uniform vec4  uHarm;   // MS.harmAngle, MS.harmVel, MS.clarity, MS.regularity
uniform vec4  uPal;    // hue, spread, saturation, brightness (LOOK.pal)
uniform vec3  uTint;   // LOOK.tint (rgb of the current hue)
#define TAU 6.2831853
vec3  pal(float t);            // the shared palette: cosine palette in uPal, tinted, gamma'd
vec2  cmul(vec2 a, vec2 b);    // complex multiply
mat2  rot(float a);            // 2D rotation
float hash(vec2 p);            // 0..1 hash
```

Uniforms you declare yourself must be fetched with `pr.u('name')` (or bound with `ctx.tex(pr, 'name', …)`) somewhere in
your folder: `check.js` fails on a
declared-but-never-fetched uniform (arrays: fetch `'uName[0]'`; a loop over a name array is invisible to it — write the
literal). HEAD already declares `in vec2 vUv; out vec4 o;` — do not redeclare them. Never name a GLSL variable `gl_*`.
`smoothstep(a,b,x)` needs `a<b` (lifted sources sometimes reverse it: write `1.-smoothstep(b,a,x)`). `readPixels` from
an RGBA16F target returns black: use `mkTarget(w,h,true)` for readback. `tools/check.js` is a legal read for the
uniform/import idioms — use it instead of peeking at a sibling scene.

### 1.3 `rt` — what a scene publishes

`scene.rt` is a plain object the scene fills in `update()` (the core assigns `{}` at registration, before `init`, if
you leave it out). The core reads only these keys, all optional:

| key         | meaning                                                                                          |
|-------------|--------------------------------------------------------------------------------------------------|
| `time`      | the scene's own visual clock (seconds); becomes `uTime` while the scene is on screen. Leave it out and `uTime` is the core's presence-scaled wall clock (never NaN) |
| `label`     | short string for the HUD                                                                          |
| `log`       | string appended to the 1 Hz test log line                                                         |
| `home`      | (home scene only) true while the scene is in its stable/interior state                            |
| `awayBeat`  | (home scene only) the beat count at which it last left home                                       |
| `settledAt` | (home scene only) the beat count at which it settled back home; the director zeroes it when it acts on it |

Anything else in `rt` is yours (e.g. NAV publishes `c` and `cycBase` for its drum variant's `score`).

### 1.4 Slots, not patches

Whatever a scene needs from the core is a declared slot above, never a special case in `core/`. The ones a lifted scene
needed, now generic:

- **Variants** (`variants: [...]`): a sub-mode with its own id and `score`. The director treats it as a scene for
  picking, history and forcing, but it renders through the parent's `draw` with `variant` = its name and `vmix` = a
  0.8 s eased 0→1 (the parent decides what that means: NAV's DRUM fades the interior membrane in).
- **Per-scene post params** (`post`): `fb.decay` (0..1 trail persistence, 0 = no trails; the feedback effect
  multiplies by presence and drops to 0.2 on a drop), `bloom.thr` (luminance threshold, 0.35 default, 2 = bloom off),
  `kaleido` (0..1 multiplier on the beat-driven kaleidoscope: 1 = as the director drives it, 0 = never on this scene).
  Any effect can be switched per scene with `post.<effectName>.on: true|false` (e.g. `exposure: { on: true }`).
  Number or `fn(MS)` for the numeric ones. During a crossfade the incoming scene's params apply past the midpoint.
- **Overlay**: drawn after the composite, direct to the screen, with your on-screen weight `vis` (0..1, follows the
  crossfade). You enable/disable SCISSOR and BLEND yourself.
- **`Q`-scaled work**: `ctx.Q.iter` (64..264 per-pixel iterations), `ctx.Q.scale` (render scale, applied by the core),
  `ctx.Q.q` (0..1 knob). Count budgets come from the core, never from a table copied into a scene (§13):
  `ctx.budget('points')` = `[20000, 45000, 90000, 150000]` per tier for gl_VertexID particle clouds (DUST),
  `ctx.budget('segs')` = `[2500, 5000, 9000, 16384]` for CPU stroke buffers (`ctx.lines.mk` capacity = the top entry).
  Per-ring / per-edge subdivision tables (TORUS's segments per ring, POLYTOPE's subdivisions per edge) are geometry,
  not counts, and stay in the scene, indexed by `ctx.tier()`.
- **Hooks**: named test entry points; the harness exposes them as `CARD.hooks.<name>` and maps `&name=value` hash
  params under `#test`. They are called as plain functions (the receiver is `CARD.hooks`, not your scene — refer to
  your module-level object, never `this`) and a hash hook fires **before your `init`** and before the first frame: keep
  the state a hook sets on the object literal (`fibresOn: 1`), not in `init`, or `init` clobbers it. A hook that sets
  a phase your scene clamps on arrival (FEIGEN's `feigL`) must also mark the scene as arrived.
- **`always`**: update every frame regardless of visibility (the home scene needs it; most scenes should not).

### 1.5 `LOOK` and `GROOVE`

`LOOK` (in `update` args and `ctx.LOOK`): `{hue, hueT, pal:[hue,spread,sat,bri], tint:[r,g,b], bands, beat, arc,
harm, time, peak, mood}` — the v3 palette, derived from `MS` every frame. All hues are in turns (0..1). NAV reads `pal`/`tint` (through `HEAD`'s
`pal()`); the synapse scenes read **`LOOK.mood`** = `{hue, sat, bri, spread, invert, angular, spiky}`: hue orbits a
family anchor chosen by `moodFamily` (valence/arousal), `sat`/`bri`/`spread` follow intensity/tension/drops, `invert`
pulses to 1 on a drop and decays in 0.3 s, `angular`/`spiky` are texture axes (percussive·punchy, dirty·arousal). Upload
them as your own uniforms; synapse's `pal()` was `hue + spread·t` with `sat`/`bri` — see the DUST/MANDALA shaders.

`GROOVE`: `{rot, drift, sway, nod:{x}, vel}` — one shared rotation angle (radians) that breathes with the beat.
`rot = drift + sway + nod.x`; `drift` (and so `rot`) grows without bound — wrap or `sin()` it where a bounded angle matters. Use `rot` for your view rotation (NAV does), `vel` for angular velocity, `sway` alone
for a subtler wobble.

### 1.6 `Q`

`{q: 0..1, iter, scale, fps}`. The core adapts `q` from frame time. Scenes read, never write. `ctx.tier()` maps `q`
to 0..3 (`q<.25 → 0, <.5 → 1, <.8 → 2, else 3`); `ctx.budget('points' | 'segs')` is the count for that tier (§1.4).
Smooth it yourself if tier flips would be visible (a particle count can jump; a ring count cannot if `cuts` is
`'continuous'`). `draw()`'s `(w, h)` is already the `Q.scale`-scaled size. Headless Chrome pacing
sinks `q`; `CARD.bench(id, n)` is the perf verdict (see HARNESS.md).

**`Q` is global, so a scene's cost is everyone's** (v0.2 §16): one scene over budget drops `q` for every scene and the
climb back takes ~30 s (`tools/q-trace.sh`, HARNESS). Before scaling iterations or resolution down, **separate what the
mathematics computes from what the music changes per frame, and amortise the first over musical time.** A fractal
field, an orbit, a distance transform depends on the parameters the music moves slowly (a zoom, a seed) — render it
once into your own target (`ctx.mkTarget`), progressively if it is large (a bounded slice per `draw()`, scheduled on
your own state and draw counter, never on wall time, so `#test` stays bit-identical), and let the per-frame pass be a
colouring that reads it through the current camera and the current `MS`. NAV's Böttcher table and FEIGEN's reference
orbit were already this; FEIGEN's field/colour split and zoom ladder (DECISIONS §16) is the shape for a per-pixel
scene whose picture is expensive but whose camera is an affine map. TORUS and POLYTOPE rebuild seed-fixed geometry
every frame and could not take it: their cost is the stroke count (§1.12), not the mathematics.

### 1.7 `env` (5th argument of `update`)

`{SC: {logical, cur, next, m, variant, vT, vmix, home, forced}, Q, now}`. `SC.logical === this.id` tells you the
director considers you the current scene; `SC.vT > 0.5` that your variant is the target. `now` is the frame time in
seconds (the same clock `MS` events are stamped with).

### 1.8 Registration

Two lines in `assets/main.js`, the only edits outside your folder: an import next to the other scene imports
(`import dust from './scenes/dust/index.js';`) and your name appended to the list `for (const scene of [nav, dust])`.
The harness then knows it: `&scene=<id>` forces it, `CARD.SCENES` lists it, `check.js` checks it.

Registered ids (keep this table current): **0 nav** (home) · **4 drum** (nav variant) · 1 dust · 2 mandala · 3 torus ·
5 polytope · 6 feigen · 7–8 free. `CARD.REG[id]` is `{id, base, scene, variant}` (`scene` is your exported object; `variant` is null for a
scene's own id); `CARD.SCENES` is the array of scene objects in registration order.

### 1.9 `cuts` — what you promise about discontinuities

The continuity monitor (HARNESS.md) checks the home scene; for every scene `cuts` documents what a reviewer should
expect frame to frame: `'continuous'` — nothing on screen ever jumps (all motion is springs/emas of MS);
`'onset'` — visible jumps only on `MS.onset`/`MS.beat` (kicks, formation flips); `'event'` — jumps only on
`dropEvt`/`sectionEvt`/`surpriseEvt`, declared chart cuts and declared beat-counted epochs (e.g. "every 64 kicks").
Anything else is a bug.

### 1.10 What the composite does to your pixels

After your `draw` and the crossfade, the chain is feedback (trails: `max(scene, prev·decay)` with a zoom/twist) →
bloom (added at `0.4 + 0.4·eS + 0.3·dropEnv`) → composite: chromatic aberration (`FX.ca`), glitch row shifts on
surprises/drops, kaleidoscope on peaks, flash on drops, tonemap `1 − exp(−1.5·c)`, vignette `1 − 0.9·|uv−.5|²`, dither.
A flat colour therefore arrives on screen as a vignetted, tonemapped field with trails — that is not a bug in your scene.

### 1.11 Look memory

If your scene has a discrete "look" that a returning listener would notice (DUST's formation pair, MANDALA's fold
count N, TORUS's knot), export `look: { get() → v, set(v) }` where `v` is a small JSON-able value. When synapse
declares a section boundary (`boundaryEvt`) the director files each scene's `get()` together with the scene on screen
under the outgoing section's `sectionAlt`; when synapse identifies a return (`sectionAlt` changes with `sectionReturn`
1, a few beats after the boundary) it calls every scene's `set(v)` with what it had then **and** brings the filed scene
back at the next soft switch (see §4: that switch lands on a bar line). Before synapse has identified any section
(`sectionAlt` < 0) v3's seed carries the memory (`sectionEvt` saves, `identifyEvt` with `repeat` restores). Keep `set`
cheap and continuous-safe (it may be called while you are on screen). Both are called with `this` = your scene object.

### 1.12 Lines — `ctx.lines`

Anti-aliased strokes of any pixel width, depth-testable, drawn as one instanced quad per segment with a capsule cut
out of it in the fragment shader — so consecutive segments of a polyline join seamlessly and ends are round. Two ways
in; both produce premultiplied colour and restore GL state (BLEND/DEPTH_TEST off) on return.

**A. CPU segments** — edges you compute in JS (polytopes, graphs, a handful of fibres):
```js
this.L = ctx.lines.mk(1200);                        // capacity in segments, once, in init()
ctx.lines.set(this.L, segs, n);                     // Float32Array, 12 floats per segment:
                                                    //   x0 y0 z0 w0   x1 y1 z1 w1   r g b a
                                                    //   (w = stroke width in px at that end; rgba straight, a = opacity)
ctx.lines.draw(this.L, target, w, h, { mvp, depth: true, blend: 'over' });
```
`mvp` is a column-major `Float32Array(16)` (clip = mvp · [x y z 1]); leave it out when the positions are already in
clip space. `draw` binds its own program, so call it after your own passes, never between your `ctx.use` and your draw.

**B. GPU polylines** — analytic curves; the vertex shader computes the points, there is no buffer. A raw program
whose vertex shader includes `ctx.lines.VS` and whose fragment shader includes `ctx.lines.FS`:
```js
const VS = '#version 300 es\nprecision highp float;precision highp int;\n' + ctx.lines.VS + `
uniform float uPts; flat out vec3 vCol;
vec4 P(int ring, int i) { ... return vec4(clip); }          // point i of ring `ring`, in clip space
void main() {
  int s = gl_InstanceID, ring = s / int(uPts), i = s - ring * int(uPts);
  vec4 c0 = P(ring, i), c1 = P(ring, (i + 1) % int(uPts));  // closed ring: the last segment wraps to point 0
  vCol = ...;
  gl_Position = lineCorner(c0, c1, w0px, w1px);             // width in px at each end (a 3D width is size / c.w)
}`;
const FS = '#version 300 es\nprecision highp float;\n' + ctx.lines.FS + `
flat in vec3 vCol; out vec4 o;
void main() { float m = lineMask(); o = vec4(vCol * m, m); }`;   // lineMask() = anti-aliased coverage 0..1
```
Per frame: `ctx.use(pr, target, w, h)`, your uniforms, then `ctx.lines.drawN(nSegments, { depth: true, blend: 'add' })`.
The renderer owns the quad and its VAO: bind nothing, create no VAO. `gl_InstanceID` is the segment; `gl_VertexID`
(0..3) is the quad corner and belongs to `lineCorner` — do not read it. The chunk declares `uniform vec2 uRes` (filled by `ctx.use`, so do not declare your own `uRes`) and the varyings
`vLineSeg`/`vLineHW`; name yours differently. A segment with an endpoint at or behind the camera plane (`w ≤ 0`) is
dropped whole.

**Options** (both paths): `depth: true` tests and writes (LEQUAL) against the target's depth buffer · `'test'` tests
only · omitted/false ignores depth. `blend: 'over'` (default; correct occlusion with depth in any draw order) or
`'add'` (glow accumulates; with depth on, a far stroke drawn before a near one still adds under it — draw near-to-far
or accept the overlap). The core's scene targets have a depth buffer, cleared to 1 before every `draw()`; your own
targets get one with `ctx.mkTarget(w, h, false, true)`. Clip `z` must lie in (−w, w): for a pinhole camera with view
depth `v.z` (and `w = v.z`) use `z = v.z − 2·near`, which increases with distance.

**Alpha is coverage, not brightness.** Consecutive capsules of a polyline overlap inside every joint, so with
`'over'` a semi-transparent stroke composites twice there and shows a bead on every join. Keep the stroke opaque —
`o = vec4(col · m, m)` with `m = lineMask()` — and put brightness, fog and fades into the colour; let alpha fall only
where a stroke must genuinely vanish (e.g. a fibre leaving through the projection pole). A fragment that ends up
invisible still writes depth: `discard` below a small threshold (`if (a < 0.004) discard;`) or it will hide what is
behind it. Path A's built-in program does both already.

Widths under 1 px dim instead of thinning (constant energy), so distant hairlines fade rather than sparkle. Cost: four
vertices per segment; path B evaluates `P` twice per vertex. Measured (§14, `CARD.bench` at 1280×720, GPU=1): path A
`set` + `draw` ≈ **0.4 µs per segment** — 3.2 k segments ≈ 1.3 ms, so 50 k would be ~20 ms; plan against that, and take
the count from `ctx.budget('segs')` (§1.4). Put the `tier()` budget in the number of segments per ring, never in the
number of rings, if your `cuts` is `'continuous'`. `tools/lines-smoke.js`
(HARNESS.md) is the reference for a minimal path-A and path-B program.

### 1.13 Help view — what the `?` overlay shows from your scene

`core/help.js` (keys `?` / `h`, `Esc` closes) explains the machine to a listener from data alone; it never reads your
code. From your object it shows: `tag` (the variant's `tag` while a variant is logical), the three depths of `help`
(`math` collapsed), `cuts` in words (§1.9), your `hud()` line as "developer readout" (refreshed every 6th frame), and
one row per field in `feats` with **name · ELI5 · what it drives here · formula · live value** — the ELI5 and formula
come from `FEATS` (Appendix A), the live value is `MS[k]` drawn by its `kind` (a bar for a level, a flash for an event,
`[n]` for a vector), and the "drives here" column is your **`help.feats[k]`**: one clause, the visual consequence on
your screen ("fattens the tubes", "how many mirrors"), not the formula. A field without a line falls back to
`FEATS[k].drives`, the field's general role, shown dimmed. Below, collapsed, the other fields the engine produces. The
cast section lists every registered scene and variant with `tag` + three depths. Rules (`check.js`): every key of
`help.feats` must be in `feats` (fail); a `feats` entry without a `help.feats` line is a warning; `help.eli5/why/math`
must all be non-empty (fail). Keep `feats` exactly the fields you read — the top table *is* that list, so a stale
entry is a visible lie. `CARD.HELP.rows(true)` returns the top table's names for a test.

## 2. Engine contract — see `docs/ENGINE.md`

Short form: `MS` is produced by the engine (`assets/engine/`), documented field-by-field in `assets/engine/feats.js`
(`FEATS[name] = {eli5, formula, kind, range, drives}`) — scene authors read Appendix A below instead of that file. A new analysis stage registers with
`ENGINE.addStage(name, fn(dt, now, MS), feats)`; stages run after the v3 extractor in registration order; each may only
add the fields it declares in `feats.js`, never overwrite another stage's. `check.js` fails on an `MS` key without a
`FEATS` entry. A source is `{name, start(), stop(), tick?(nowMs)}` plugged into `ENGINE.sources`.

## 3. Effect contract

An effect is one file `assets/effects/<name>.js`:

```js
export default {
  name: 'bloom',
  order: 20,                    // chain position: feedback 10 · bloom 20 · [yours] · composite 100 (always last)
  enabled: true,                // default on/off; a scene can flip it via post.<name>.on (see below)
  init(ctx) {},                 // programs, targets (allocate in ctx.onResize)
  when(io) {},                  // optional gate per frame
  run(io) {},                   // return a new src target, or null to leave io.src as is
};
```

`io` per frame: `{src, w, h, sw, sh, uvS, aux, MS, FX, GROOVE, dt, frameN, post, Q}` — `src` a target; `w,h` the
full target size, `sw,sh` the scene-pass size inside it; `uvS` `[u,v]` scale to sample `src`; `dt` seconds; `frameN`
monotonic (it keeps counting while you are skipped — a gap means you were just switched on).
- `src` is the current chain input (a target). The scene pass was rendered at `(sw, sh)` inside a `(w, h)` target:
  sample it with `vUv * uvS`. Rule: an effect that returns a target has re-rendered the whole `(w, h)` target and must
  set `io.uvS = [1, 1]` (feedback does; so anything after order 10 sees `[1,1]`). The target you return stays yours:
  the core never frees or recycles it, and it reads it only until the next effect runs.
- `aux` is a scratch object for side-chains: bloom publishes `aux.bloom = {b1, b2}` for the composite.
- `FX` is the core's per-frame fx state `{glitch, flash, kal, ca, seed}` (derived from `MS`; you read it).
- `post` is the current scene's `post` object; read your params as `post.<name>`. The core skips you when
  `post.<name>.on === false`, and runs an `enabled: false` effect only when `post.<name>.on === true`.
- The composite draws to the screen and is always last. Anything after it draws over it.

Register in `assets/main.js`: `for (const fx of [feedback, bloom, composite]) addEffect(fx, ctx)`.

## 4. Director (what the core decides, so you don't)

- Forced (`&scene=N`, keys) → drop hard-cuts to the home scene → low presence drifts home → a build parks home →
  otherwise soft switches only on musical events (`surpriseEvt` hard; `identifyEvt`, a synapse-recognised section
  return, 32-beat phrase, home settled +4 beats soft), at least 8 beats apart. Your `score()` is consulted only then.
- Soft switches land on the grid: while `gridTrust` > .5 the decision waits for the next bar line (`barPos` wrap; the
  16-beat line for the phrase trigger), at most 4 (16) beats; grid trust lost meanwhile fires it at once, a hard cut
  or home parking cancels it. Hard cuts are immediate. `SC.quantise = false` (harness) restores immediate switches.
- Crossfades render both scenes and hand them to the transition (§5; `mixs` by default) over `clamp(4·60/bpm, 1.2, 3)` s.
  Both `draw` calls happen each frame of the fade; both `update`s run.
- Scores: `score()` + 0.25 per-section seed noise − 0.6 if you were the last scene − 0.25 if the one before.

## 5. Transition contract

A transition is one file `assets/transitions/<name>.js` — the sibling of an effect (§3): it takes the two scene targets
of a crossfade and produces the one target the effect chain starts from. The core renders both scenes every frame of
the fade and advances the crossfade position; the transition only draws the picture in between.

```js
export default {
  name: 'morph',
  init(ctx) {},                 // programs, own targets (allocate in ctx.onResize). Called once, before the first frame
  run(io) {},                   // draw the blend into io.out and return it, or return your own full-size target
};
```

`io` per frame (only while a crossfade is running): `{a, b, m, out, w, h, sw, sh, uvS, MS, FX, GROOVE, LOOK, dt}`.
- `a`, `b` are the core's scene targets (`{t, f, w, h}`, RGBA16F when available): the outgoing scene rendered in `a`,
  the incoming in `b`, both at `(sw, sh)` inside the full `(w, h)` target — sample them with `vUv * uvS` exactly as an
  effect samples `src`, and **clamp** the sample coordinate into `[0, uvS]` when you displace it (the targets are
  CLAMP_TO_EDGE over the whole `(w, h)`, so an unclamped sample past `sw` reads the stale border of a larger frame).
  They are unclamped floats: `a + b` can exceed 1, which bloom likes — but check the composite does not clip a whole
  front white.
- `m` is the crossfade position 0 → 1, the director's clock: it advances linearly over `clamp(4·60/bpm, 1.2, 3)` s,
  the director commits on it, overlays and post params follow it, and on the frame it reaches 1 the core stops
  rendering `b`. **Invariant: at `m = 1` your picture is `b`, at `m = 0` it is `a`** (`m` is never exactly 0 on entry:
  the first frame of a fade has `m = dt/dur`). Between the two ends the shape is yours: a musical push may run ahead
  of `m` (level and kicks pulling the front forward) but never lag it — `t = max(m, ease)` with `ease` derived from
  `m`, `MS.lvl`, `MS.kick` and a per-transition accumulator that resets whenever `m` is not ≥ last frame's `m` (a new
  fade restarts at 0; a reversed fade jumps to `1 − m` and swaps `a`/`b`). No wall clock, no `Math.random()`: the same
  `#test` frame must render byte-identical across runs.
- `out` is the core's crossfade target (full size, no depth, RGBA16F, **not cleared**): draw at `(sw, sh)` into it with
  `ctx.use(pr, io.out, io.sw, io.sh)` and return it. Rule (§3): a transition that returns a target it rendered at the
  full `(w, h)` must set `io.uvS = [1, 1]`; then the chain samples the whole target. The target you return stays yours.
- `w, h` full target size; `sw, sh` the scene-pass size inside it (the core renders both scenes at `0.8 · Q.scale`
  during a fade); `uvS = [(sw − .5)/w, (sh − .5)/h]`.
- `MS`, `FX`, `GROOVE`, `LOOK`, `dt` as in §3 — every parameter of the blend traces to them. There is no `frameN` and no
  `feats` list for a transition: a fade's start is `m` restarting (reset your state on it), and the core does not check
  the `MS` fields a transition reads (keep them few and name them in a comment).
- A reversal (`goScene` back to the outgoing scene mid-fade) is the core's: it swaps `a`/`b` and sets `m = 1 − m` on
  the same frame — you only see `m` drop. Lifted synapse post shaders use an uncorrected `uv − .5` for radial terms;
  the targets here are 16:9, so correct `c.x *= uRes.x / uRes.y` if a round front is wanted (the morph does).
- The `'nav'` rule of `check.js` applies to `assets/transitions/` as it does to the core: a transition must not name a
  scene, not even in a comment.

Entry GL state: BLEND, DEPTH_TEST and SCISSOR off, `out` bound with the viewport at `(sw, sh)`, colour not cleared.
Leave it that way on return. Programs come from `ctx.mkProg(fs, name)` (HEAD prepended: `vUv`, `o`, `uRes`, `pal()`,
`rot()`, `hash()` — §1.2; there is **no** noise helper: bring `hash21`/`vnoise` in your own file, named so they do not
collide with `hash`). Lifted synapse post shaders read `gl_FragCoord.xy / uR`: here that is `vUv` (0..1 over the
viewport, which is `(sw, sh)`), and the sample coordinate into `a`/`b` is `vUv * uUvS`. Synapse's `uT = (trans, flow,
kick)` maps to `t` (above), `MS.flow`, `MS.kick`; its `uR` is HEAD's `uRes`.

Registration (`assets/main.js`): `for (const tr of [mixs, morph]) addTransition(tr, ctx)` and `setTransition('mixs')`
picks the default. Under `#test`, `&trans=<name>` picks another registered one for A/B (HARNESS.md "Transition").
The transition object is reachable from the harness as `CARD.TRANSITIONS.<name>` (keep a readout on `this` — the
morph keeps `this.t`). Cost: `CARD.benchTransition(n)` gives ms per full-resolution pass for every registered transition; the scene pass, the
transition and the chain together must keep `Q.q ≈ 1` on a GPU during a fade — one pass, a few texture reads and a
handful of noise evaluations per pixel is the budget.

## Appendix A — the `MS` vocabulary

Every field a scene may list in `feats` and read in `update`. Kinds: `level` 0..1 smoothed · `raw` unbounded ·
`event` true for one frame · `count` · `angle` radians · `enum` string · `vector` array. (Internal fields are omitted.)

<!-- FEATS:begin (generated by node tools/feats-doc.js — do not edit by hand) -->
| field | kind | what it is | what it drives |
|---|---|---|---|
| `presence` | level | is there music at all | idle behaviour, palette wobble |
| `bass` | level | how strong the bass is right now | uBands.x, view scale, orbit size |
| `mid` | level | how strong the mids are | uBands.y, trap radius |
| `high` | level | how strong the highs are | uBands.z |
| `bassFast` | level | bass with a very fast attack (for kicks) | drop detection, beat phase lock |
| `rms` | raw | raw loudness of the waveform | nothing directly |
| `wave` | vector | the last 2048 audio samples | the engine's wave texture (DUST's ribbon formation is the waveform); no scene reads it from MS |
| `onset` | event | a hit just happened (one frame) | kick toward a Misiurewicz point, nod |
| `hitStrength` | level | how hard that hit was | kick amplitude |
| `hit` | level | the hit, decaying over ~0.14 s | uBeat.y, palette brightness, flash |
| `onsetRate` | raw | hits per second | build cue |
| `beat` | event | a beat boundary just passed | retargeting, scene switch gating |
| `beatPhase` | level | where we are inside the beat, 0→1 | uBeat.x, sway, trap rotation |
| `beatCount` | count | beats since start | phrase alignment, hysteresis |
| `bpm` | raw | tempo (±1 BPM on the demo styles; holds its octave through breakdowns) | beat rate, crossfade duration |
| `regularity` | level | how steady the rhythm is | sway amplitude, scene scores |
| `eS` | level | short-term energy (0.3 s) | uArc.x, intensity, drift rate |
| `eM` | level | medium-term energy (2.5 s) | arc classification, palette |
| `eL` | level | long-term energy (12 s) | build cue (eM-eL) |
| `eMax` | level | the loudest eM seen lately | valley/sustain threshold |
| `build` | level | a build-up is happening | uArc.y, park at the root, scene precedence |
| `absentT` | raw | seconds since the bass left | first drop path |
| `arc` | enum | which part of the song this is | scene precedence, kal |
| `arcT` | raw | seconds in the current arc | drop gating |
| `dropEvt` | event | THE DROP just landed | hard cut to NAV EXT, flash, glitch |
| `dropStrength` | level | how big the drop was | exterior depth after the drop |
| `dropEnv` | level | the drop, decaying over ~2 beats | uBeat.w, zoom, feedback zoom |
| `lastDrop` | raw | time of the last drop (s) | refractory |
| `buildPk` | level | recent peak of build | second drop path |
| `liveT` | raw | seconds of continuous presence | drop warm-up guard |
| `highM` | level | slow highs (3 s) | riser cue |
| `chroma` | vector | how much of each of the 12 pitch classes is present | fingerprint, surprisal, torus latitudes |
| `bchroma` | vector | the same, bass only (<240 Hz) | root note for interval |
| `harmAngle` | angle | where the harmony sits on the circle of fifths | uHarm.x, palette hue offset |
| `harmUnw` | raw | the same angle, unwrapped (keeps turning) | alpha on the cardioid, EXT theta, phi |
| `harmVel` | raw | how fast the harmony is moving | uHarm.y, hue drift rate |
| `clarity` | level | how clearly tonal the music is | uHarm.z, harmony gating, scene scores |
| `interval` | count | the interval (semitones) between the bass note and the strongest other note | which bulb / torus knot |
| `peaks` | vector | the four strongest partials [Hz, amp] | DRUM Koenigs modes |
| `rough` | raw | Sethares roughness of the strongest partials | tension |
| `tension` | level | how dissonant / tense it feels | uArc.z, exterior depth, park, mood |
| `suspension` | level | tension held high for a while | park at the root |
| `resolveEvt` | event | a held tension just released | visual time release |
| `intensity` | level | overall intensity | depth into a bulb, palette |
| `surprisal` | level | how unexpected the music just got | uArc.w, glitch |
| `surRaw` | raw | raw surprisal before shaping | HUD |
| `surpriseEvt` | event | a real surprise (one frame) | hard scene switch, glitch |
| `lastSurprise` | raw | time of the last surprise | refractory |
| `sectionEvt` | event | the song moved to a new section | groove direction, fingerprint reset |
| `sectionId` | count | which section this is (repeats get the same id) | seed noise in scene scores, kaleido segments |
| `lastSection` | raw | time of the last section event | refractory |
| `identifyEvt` | event | the section was just identified | soft scene switch |
| `repeat` | level | is this section one we have seen before | baby dive, look memory |
| `seed` | vector | per-section random constants {hue, th, a, scene, looks}: hue, a ∈ [0,1), th ∈ [−.5,.5), scene = remembered scene id, looks = remembered scene looks | palette offset, drift direction, alpha offset, remembered scene |
| `bassS` | level | synapse bass, slow (0.5 s) | DUST/MANDALA body |
| `midS` | level | synapse mids, slow | DUST/MANDALA |
| `highS` | level | synapse highs, slow | - |
| `sub` | level | sub bass (25-60 Hz), fast | low rumble |
| `lvl` | level | synapse loudness | DUST/MANDALA brightness, flow rate |
| `kick` | level | a kick just hit, decaying (0.16 s) | DUST kick flare, MANDALA centre |
| `snare` | level | a snare just hit, decaying (0.13 s) | - |
| `hat` | level | a hat just hit, decaying (0.06 s) | DUST/MANDALA sparkle |
| `kickCount` | count | kicks since start | MANDALA fold epoch (every 64 kicks; synapse used 32) |
| `alive` | level | is sound present (synapse) | idle behaviour |
| `hush` | level | the silence before a drop | DUST/MANDALA hold |
| `calm` | level | quiet and unhurried | scene scores |
| `resolve` | level | a held tension that released (fake-out) | DUST/MANDALA release |
| `flow` | raw | musical time: seconds weighted by energy | DUST/MANDALA motion — never wall-clock |
| `flowBass` | raw | musical time driven by bass | DUST |
| `flowMid` | raw | musical time driven by mids | DUST/MANDALA |
| `flowHigh` | raw | musical time driven by highs | POLYTOPE: the xw turn of the 4-D rotation |
| `centroid` | level | spectral brightness | arousal, MANDALA colour |
| `flux` | raw | raw spectral flux (kick + .6 snare bands) | - |
| `dirty` | level | noisy / distorted texture | mood spiky, valence |
| `punchy` | level | transient-heavy mix | mood angular |
| `perc` | level | percussive (spiky onset envelope) | arousal, angular |
| `beatConf` | level | confidence in the synapse beat clock | gridTrust |
| `gridTrust` | level | trust in the bar/phrase grid (keeps counting through breakdowns) | director: soft switches are held to the bar line while > .5 (§10) |
| `barConf` | level | confidence in the bar (4-beat) line | boundary snapping |
| `phraseConf` | level | confidence in the 16-beat phrase line | drop expectation, boundary snapping |
| `bar` | count | bar number on the synapse grid | phrase-aware scenes |
| `barPos` | raw | position inside the bar, 0..4 (beats) | MANDALA fold rotation, director: a held soft switch lands when it wraps (§10) |
| `barPhase` | level | position inside the bar, 0..1 | TORUS breathing (alt) |
| `phrasePos` | raw | position inside the 32-beat phrase, 0..32 | - |
| `phrase16Pos` | raw | position inside the 16-beat phrase | director: a phrase-triggered soft switch lands when it wraps (§10) |
| `beatSyn` | raw | synapse beat clock (continuous beats) | grid fields |
| `bpmSyn` | raw | synapse tempo estimate (rival to bpm; bpm is canonical) | HUD, DECISIONS.md comparison |
| `key` | count | the key, 0=C … 11=B | TORUS knot / palette anchor |
| `mode` | count | 0 major, 1 minor | valence |
| `keyConf` | level | how sure the key is | TORUS |
| `novelty` | level | timbre just changed (quick, causal) | early warning for the director |
| `foote` | level | Foote novelty at the last beat (careful, 4-beat kernel) | boundaries |
| `boundaryEvt` | event | a section boundary was just declared (synapse) | director: files the outgoing section's scene + looks (§10) |
| `sectionAlt` | count | synapse section id (23-dim fingerprint clustering); sectionId is canonical | director look-memory key (§10); sectionId stays the seed key |
| `sectionReturn` | level | this section is a return of an earlier one (synapse) | director: a sectionAlt change with 1 restores that section's scene + looks (§10) |
| `sectionAge` | raw | beats since the section started | - |
| `dropExpectedIn` | raw | beats until the expected drop line (-1 = none armed) | anticipation |
| `dropConf` | level | how sure a drop is coming | TORUS pinch (alt) |
| `fakeoutEvt` | event | the expected drop did not come | release |
| `valence` | level | mood: dark ↔ bright | LOOK.mood hue anchor |
| `arousal` | level | mood: calm ↔ fierce | LOOK.mood hue swing |
| `moodFamily` | count | 0 calm-dark · 1 calm-bright · 2 fierce-dark · 3 euphoric | LOOK.mood anchor |
| `moodEvt` | event | the mood family shifted | palette re-anchor |
| `riser` | level | a riser is climbing | build evidence |
| `roll` | level | the drum roll is accelerating | build evidence |
| `swell` | level | energy swelling | build evidence |
| `hp` | level | the bass was pulled (high-pass sweep) | build evidence |
<!-- FEATS:end -->

## Friction log

Questions workers had to ask, and what changed in this doc as a result.

- **2026-09-22, probe scene (solid colour from bass), worker given only CONTRACTS.md + HARNESS.md.** Rendered first
  try, ERRS empty. 13 questions logged (`docs/workers/probe.md`); fixes: registration is two lines (§1.8); how state
  travels from `init` to `draw` (methods on the exported object, keep `ctx` on `this`); the `feats` vocabulary is now
  Appendix A, generated from feats.js, instead of a pointer to a forbidden file; `rt.time` fallback stated; `dt` in
  seconds; `cuts` defined (§1.9); off-values for `bloom.thr`/`kaleido`/`fb.decay` and `post.<effect>.on` made real;
  `ctx.targets` wording; registered-id table and `CARD.REG` shape; what the composite does to a flat colour (§1.10);
  HARNESS.md `&scene=N` is "scene id N" (the 0-based offset only applies to the number keys).
- **2026-09-22, TORUS strokes (v0.2 §7), worker given CONTRACTS §1.12 + the v0.1 scene.** Rendered strokes first try;
  8 friction items (`docs/workers/torus-lines.md`). Fixes here: `drawN` needs no VAO (stated); alpha = coverage,
  brightness in colour, `discard` invisible fragments (new paragraph in §1.12; the built-in program now discards too);
  a 3D width is "px at unit depth ÷ view depth" — pick the constant so a stroke at your framing distance is 2–3 px.
  HARNESS: `CARD.glerr` exists only after a GL error, `bench`'s first call after a pause is cold, pinning `Q.q` must
  outlast the scene's own smoothing.
- **2026-09-22, POLYTOPE (v0.2 §8), worker given CONTRACTS + brief, path A.** Rendered first try, deterministic
  (byte-identical frame 360 across runs); 8 friction items (`docs/workers/polytope.md`). Fixes: `look.get/set` are
  now called with `this` = the scene (§1.11); width wording (§1.12 friction above); the brief's synapse line range
  stopped one line short and the worker derived the missing fact itself — stereographic projection is a central
  projection, so a 4-D chord projects to a straight line: subdivided edge samples must be renormalised onto S³ to
  bend. Recorded in DECISIONS §8 for the next S³ scene.
- **2026-09-23, MORPH transition (v0.2 §11), worker given CONTRACTS §5 + brief + `transitions/mixs.js`.** Rendered
  first try, deterministic (frame 290 md5 identical across runs and across the worktree/main), accepted on the A/B
  montage; 7 friction items (`docs/workers/morph.md`). Fixes here: no `feats`/`frameN` for a transition (§5); who
  swaps `a`/`b` on a reversal (§5); the aspect convention for lifted post shaders (§5); the `'nav'` rule covers
  `transitions/` (§0, §5); `CARD.TRANSITIONS.<name>` as the harness handle (§5, HARNESS); §1 sub-heads reordered
  (1.10 was after 1.12). Substantive: the brief's tuning target ("front mid-screen at m ≈ 0.5") was unreachable with
  synapse's front constants at 16:9 — the worker showed it analytically and retuned three constants (DECISIONS §11);
  and its real-path check waited 20 s for a fade that lands at ~23 s on the house demo (brief fixed to 45 s). Harness
  finding (orchestrator): `CARD.bench`/`benchTransition` read back UNSIGNED_BYTE from RGBA16F targets — an
  INVALID_OPERATION that never reached the GPU, so no bench before §11 was synced (HARNESS "Transition").
