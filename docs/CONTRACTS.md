# Eigenwobble contracts

**This is the one required read.** To add a scene, an effect, or an analysis stage you read this file, the folder you
are writing, and `docs/HARNESS.md` for the commands. You never open `assets/core/` or `assets/engine/`. If something here
cannot be understood without opening the core, the contract is wrong: log it in the friction section at the bottom and
fix the doc, not the reader.

## 0. Rules that apply to everything

- Zero runtime dependencies. Native ES modules. WebGL2, fragment-shader-first. No bundler, no framework, no TypeScript.
- Every visual parameter traces to a field of `MS` (the music state vector, schema in `assets/engine/feats.js`) or to
  `GROOVE` / `LOOK`, which are themselves derived from `MS`. Never a hidden timer, never `Date.now()`, never a magic
  constant that moves. Muted audio must visibly idle.
- Module cap: `tools/check.js` warns above 350 lines and fails above 500 (GLSL template strings count). Split
  `shaders.js` from `index.js` early. One statement per line, `//` comments are fine.
- Import discipline (enforced by `check.js`): a scene or effect imports only from its own folder and from
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
  feats: ['bass', 'flow'],      // every MS field you read (checked at load against feats.js; typo = ERRS entry)
  cuts: 'continuous',           // what you promise about discontinuities: 'continuous' | 'onset' | 'event'
  score(MS, rt, SC) {},         // → 0..1 — your bid to be auto-picked now. Return 0 = never auto-pick now.
  init(ctx) {},                 // build programs and buffers. Called once, before the first frame.
  update(dt, MS, GROOVE, LOOK, env) {},   // CPU state. Called every frame you are on screen (or always: see `always`).
  draw(target, { w, h, variant, vmix }) {},   // render into `target` at (w, h) only. Nothing else.
  post: { fb: { decay: 0.7 }, bloom: { thr: 0.35 }, kaleido: 1 },   // effect params (object or fn(MS) → object)
  help: { eli5: '', why: '', math: '' },
  // optional slots:
  overlay(PW, PH, vis, dt) {},  // post-composite, direct to screen; you scissor. vis = your on-screen weight 0..1
  hud() { return 'one line'; }, // extra HUD line while you are the logical scene
  hooks: { baby(v) {} },        // test hooks: exposed as CARD.hooks.<name>; &<name>=v in a #test hash calls it
  variants: [{ id: 4, name: 'drum', tag: '', score(MS, rt, SC) {} }],  // sub-modes with their own id (§1.4)
  always: false,                // true = update() runs every frame even when off screen
  home: false,                  // true = the director's home scene (exactly one; NAV)
  rt: {},                       // runtime readout you publish (§1.3); the core creates {} if you leave it out
};
```

### 1.1 `ctx` — everything a scene or effect may touch in the core

```
ctx.gl            the WebGL2 context (raw; you own your GL state inside draw/overlay, restore blend/scissor when done)
ctx.mkProg(fs, name)          fullscreen program: HEAD + your fragment source, the shared triangle vertex shader
ctx.mkProg(vs, fs, name)      raw program (own vertex shader, e.g. gl_VertexID particles). No HEAD is prepended.
ctx.use(pr, target, w, h)     bind program + target (null = screen) + viewport and upload the common uniforms (§1.2)
ctx.tri()                     draw the fullscreen triangle
ctx.tex(pr, 'uName', unit, target)   bind target.t to a texture unit and set the sampler uniform
ctx.dynBuf(floats, comps)     a DYNAMIC_DRAW VAO with one float attribute at location 0 → {vao, buf}
ctx.upload(buf, Float32Array, n)     bufferSubData
ctx.mkTarget(w, h, rgba8=false)      render target {t, f, w, h}; RGBA16F when available (rgba8 for CPU readback)
ctx.freeTarget(t)
ctx.onResize(fn(w, h))        register a callback; allocate your own targets there (they are freed/rebuilt by you)
ctx.targets                   {a, b, m}: the core's full-size scene targets (read-only; do not draw into them yourself)
ctx.Q                         adaptive quality (§1.6)
ctx.LOOK                      the palette block (§1.5)
ctx.hsv(h, s, v) → [r,g,b]
ctx.log(string)               append to CARD.log (only under #test)
```

Programs from `mkProg` are `{p, name, u(name) → location}`; `u()` caches lookups. Shader compile/link errors are
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

Uniforms you declare yourself must be fetched with `pr.u('name')` somewhere in your folder: `check.js` fails on a
declared-but-never-fetched uniform (arrays: fetch `'uName[0]'`). Never name a GLSL variable `gl_*`. `smoothstep(a,b,x)`
needs `a<b`. `readPixels` from an RGBA16F target returns black: use `mkTarget(w,h,true)` for readback.

### 1.3 `rt` — what a scene publishes

`scene.rt` is a plain object the scene fills in `update()`. The core reads only these keys, all optional:

| key         | meaning                                                                                          |
|-------------|--------------------------------------------------------------------------------------------------|
| `time`      | the scene's own visual clock (seconds); becomes `uTime` while the scene is on screen              |
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
- **Per-scene post params** (`post`): `fb.decay` (0..1, trail persistence; the feedback effect multiplies by
  presence and drops to 0.2 on a drop), `bloom.thr`, `kaleido` (0..1 damping of the kaleidoscope). Number or `fn(MS)`.
  During a crossfade the incoming scene's params apply past the midpoint.
- **Overlay**: drawn after the composite, direct to the screen, with your on-screen weight `vis` (0..1, follows the
  crossfade). You enable/disable SCISSOR and BLEND yourself.
- **`Q`-scaled work**: `ctx.Q.iter` (64..264 per-pixel iterations), `ctx.Q.scale` (render scale, applied by the core),
  `ctx.Q.q` (0..1 knob). Particle scenes use `tier()`: `[20000, 45000, 90000, 150000][tier]`.
- **Hooks**: named test entry points; the harness exposes them and maps `&name=value` hash params under `#test`.
- **`always`**: update every frame regardless of visibility (the home scene needs it; most scenes should not).

### 1.5 `LOOK` and `GROOVE`

`LOOK` (in `update` args and `ctx.LOOK`): `{hue, hueT, pal:[hue,spread,sat,bri], tint:[r,g,b], bands, beat, arc,
harm, time, peak}` — the v3 palette, derived from `MS` every frame. `LOOK.mood` (valence/arousal palette) arrives in
§2 for the synapse scenes.

`GROOVE`: `{rot, drift, sway, nod:{x}, vel}` — one shared rotation angle (radians) that breathes with the beat.
`rot = drift + sway + nod.x`. Use `rot` for your view rotation (NAV does), `vel` for angular velocity, `sway` alone
for a subtler wobble.

### 1.6 `Q`

`{q: 0..1, iter, scale, fps}`. The core adapts `q` from frame time. Scenes read, never write. Headless Chrome pacing
sinks `q`; `CARD.bench(id, n)` is the perf verdict (see HARNESS.md).

### 1.7 `env` (5th argument of `update`)

`{SC: {logical, cur, next, m, variant, vT, vmix, home, forced}, Q, now}`. `SC.logical === this.id` tells you the
director considers you the current scene; `SC.vT > 0.5` that your variant is the target. `now` is the frame time in
seconds (the same clock `MS` events are stamped with).

### 1.8 Registration

Add your scene to the list in `assets/main.js` (`for (const scene of [nav, dust, ...])`). That is the only line outside
your folder you touch. The harness then knows it: `&scene=<id>` forces it, `CARD.SCENES` lists it, `check.js` checks it.

## 2. Engine contract — see `docs/ENGINE.md`

Short form: `MS` is produced by the engine (`assets/engine/`), documented field-by-field in `assets/engine/feats.js`
(`FEATS[name] = {eli5, formula, kind, range, drives}`). A new analysis stage registers with
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

`io` per frame: `{src, w, h, sw, sh, uvS, aux, MS, FX, GROOVE, dt, frameN, post, Q}`.
- `src` is the current chain input (a target). The scene pass was rendered at `(sw, sh)` inside a `(w, h)` target:
  sample it with `vUv * uvS` — after the first effect that re-renders at full size (feedback does) `uvS` is `[1,1]`.
- `aux` is a scratch object for side-chains: bloom publishes `aux.bloom = {b1, b2}` for the composite.
- `FX` is the core's per-frame fx state `{glitch, flash, kal, ca, seed}` (derived from `MS`; you read it).
- `post` is the current scene's `post` object; read your params as `post.<name>`.
- The composite draws to the screen and is always last. Anything after it draws over it.

Register in `assets/main.js`: `for (const fx of [feedback, bloom, composite]) addEffect(fx, ctx)`.

## 4. Director (what the core decides, so you don't)

- Forced (`&scene=N`, keys) → drop hard-cuts to the home scene → low presence drifts home → a build parks home →
  otherwise soft switches only on musical events (`surpriseEvt` hard; `identifyEvt`, 32-beat phrase, home settled +4
  beats soft), at least 8 beats apart. Your `score()` is consulted only then.
- Crossfades render both scenes and mix them (`mixs`) over `clamp(4·60/bpm, 1.2, 3)` s. Both `draw` calls happen
  each frame of the fade; both `update`s run.
- Scores: `score()` + 0.25 per-section seed noise − 0.6 if you were the last scene − 0.25 if the one before.

## Friction log

Questions workers had to ask, and what changed in this doc as a result.

- (none yet — §1 fills this)
