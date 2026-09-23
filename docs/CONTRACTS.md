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
  feats: ['bass', 'flow'],      // every MS field you read anywhere in this object (score/update/draw); HEAD-delivered
                                // ones too (bass/mid/high via uBands). Names: Appendix A (typo = CARD.ERRS entry)
  cuts: 'continuous',           // your promise about discontinuities (§1.9): 'continuous' | 'onset' | 'event'
  score(MS, rt, SC) {},         // → 0..1 — your bid to be auto-picked now. Return 0 = never auto-pick now.
  init(ctx) {},                 // build programs and buffers. Called once, before the first frame. Keep ctx: this.ctx = ctx
  update(dt, MS, GROOVE, LOOK, env) {},   // CPU state. dt in seconds. Called every frame you are on screen (or always: see `always`).
  draw(target, { w, h, variant, vmix }) {},   // render into `target` (one of the core's targets, handed to you) at (w, h). Nothing else.
  post: { fb: { decay: 0.7 }, bloom: { thr: 0.35 }, kaleido: 1 },   // effect params (object or fn(MS) → object)
  help: { eli5: '', why: '', math: '' },
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
                  and viewport set, NOT cleared (clear it yourself if you need to). Leave it that way on return.
ctx.mkProg(fs, name)          fullscreen program: HEAD + your fragment source, the shared triangle vertex shader
ctx.mkProg(vs, fs, name)      raw program (own vertex shader, e.g. gl_VertexID particles). No HEAD is prepended.
ctx.use(pr, target, w, h)     bind program + target (null = screen) + viewport and upload the common uniforms (§1.2);
                              fine for raw programs too (only the uniforms that exist are set)
ctx.tri()                     draw the fullscreen triangle
ctx.tex(pr, 'uName', unit, t)        bind t.t (any {t}: a target or an engine texture) to a unit and set the sampler.
                              Scenes may use units 0–7.
ctx.dynBuf(floats, comps)     a DYNAMIC_DRAW VAO with one float attribute at location 0 → {vao, buf}
ctx.upload(buf, Float32Array, n)     bufferSubData
ctx.mkTarget(w, h, rgba8=false)      render target {t, f, w, h}; RGBA16F when available (rgba8 for CPU readback)
ctx.freeTarget(t)
ctx.onResize(fn(w, h))        register a callback; allocate your own targets there (they are freed/rebuilt by you)
ctx.targets                   {a, b, m}: the core's full-size scene targets. draw() receives one of them as `target`;
                              draw into the one you are handed, never pick one yourself
ctx.engineTex                 {spec, wave, hist, row}: engine textures (R8, LINEAR). spec 256×1 log spectrum (30 Hz–16 kHz,
                              floor-subtracted, peak-normalised), wave 512×1 zero-crossing-triggered waveform (0.5 = silence),
                              hist 256×128 spectrogram ring (one row per ~10 ms hop, T wrap = REPEAT); row = the newest row's
                              index (sample v = (row + 0.5)/128 for "now", subtract to go back in time). Bind with
                              ctx.tex(pr, 'uSpec', unit, ctx.engineTex.spec). Under #test the fake timeline fills them.
ctx.Q                         adaptive quality (§1.6)
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
  `ctx.Q.q` (0..1 knob). Particle scenes use `tier()`: `[20000, 45000, 90000, 150000][tier]`.
- **Hooks**: named test entry points; the harness exposes them and maps `&name=value` hash params under `#test`.
- **`always`**: update every frame regardless of visibility (the home scene needs it; most scenes should not).

### 1.5 `LOOK` and `GROOVE`

`LOOK` (in `update` args and `ctx.LOOK`): `{hue, hueT, pal:[hue,spread,sat,bri], tint:[r,g,b], bands, beat, arc,
harm, time, peak, mood}` — the v3 palette, derived from `MS` every frame. NAV reads `pal`/`tint` (through `HEAD`'s
`pal()`); the synapse scenes read **`LOOK.mood`** = `{hue, sat, bri, spread, invert, angular, spiky}`: hue orbits a
family anchor chosen by `moodFamily` (valence/arousal), `sat`/`bri`/`spread` follow intensity/tension/drops, `invert`
pulses to 1 on a drop and decays in 0.3 s, `angular`/`spiky` are texture axes (percussive·punchy, dirty·arousal). Upload
them as your own uniforms; synapse's `pal()` was `hue + spread·t` with `sat`/`bri` — see the DUST/MANDALA shaders.

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

Two lines in `assets/main.js`, the only edits outside your folder: an import next to the other scene imports
(`import dust from './scenes/dust/index.js';`) and your name appended to the list `for (const scene of [nav, dust])`.
The harness then knows it: `&scene=<id>` forces it, `CARD.SCENES` lists it, `check.js` checks it.

Registered ids (keep this table current): **0 nav** (home) · **4 drum** (nav variant) · 1 dust · 2 mandala · 3 torus ·
5–8 free. `CARD.REG[id]` is `{id, base, scene, variant}` (`scene` is your exported object; `variant` is null for a
scene's own id); `CARD.SCENES` is the array of scene objects in registration order.

### 1.9 `cuts` — what you promise about discontinuities

The continuity monitor (HARNESS.md) checks the home scene; for every scene `cuts` documents what a reviewer should
expect frame to frame: `'continuous'` — nothing on screen ever jumps (all motion is springs/emas of MS);
`'onset'` — visible jumps only on `MS.onset`/`MS.beat` (kicks, formation flips); `'event'` — jumps only on
`dropEvt`/`sectionEvt`/`surpriseEvt`, declared chart cuts and declared beat-counted epochs (e.g. "every 64 kicks").
Anything else is a bug.

### 1.11 Look memory

If your scene has a discrete "look" that a returning listener would notice (DUST's formation pair, MANDALA's fold
count N, TORUS's knot), export `look: { get() → v, set(v) }` where `v` is a small JSON-able value. On every section
event the director stores each scene's `get()` on the outgoing section's seed; when a section is recognised again
(`identifyEvt` with `repeat`) it restores the remembered scene **and** calls every scene's `set(v)` with what it had
then. Keep `set` cheap and continuous-safe (it may be called while you are on screen).

### 1.10 What the composite does to your pixels

After your `draw` and the crossfade, the chain is feedback (trails: `max(scene, prev·decay)` with a zoom/twist) →
bloom (added at `0.4 + 0.4·eS + 0.3·dropEnv`) → composite: chromatic aberration (`FX.ca`), glitch row shifts on
surprises/drops, kaleidoscope on peaks, flash on drops, tonemap `1 − exp(−1.5·c)`, vignette `1 − 0.9·|uv−.5|²`, dither.
A flat colour therefore arrives on screen as a vignetted, tonemapped field with trails — that is not a bug in your scene.

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
  otherwise soft switches only on musical events (`surpriseEvt` hard; `identifyEvt`, 32-beat phrase, home settled +4
  beats soft), at least 8 beats apart. Your `score()` is consulted only then.
- Crossfades render both scenes and mix them (`mixs`) over `clamp(4·60/bpm, 1.2, 3)` s. Both `draw` calls happen
  each frame of the fade; both `update`s run.
- Scores: `score()` + 0.25 per-section seed noise − 0.6 if you were the last scene − 0.25 if the one before.

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
| `wave` | vector | the last 2048 audio samples | nothing in NAV |
| `onset` | event | a hit just happened (one frame) | kick toward a Misiurewicz point, nod |
| `hitStrength` | level | how hard that hit was | kick amplitude |
| `hit` | level | the hit, decaying over ~0.14 s | uBeat.y, palette brightness, flash |
| `onsetRate` | raw | hits per second | build cue |
| `beat` | event | a beat boundary just passed | retargeting, scene switch gating |
| `beatPhase` | level | where we are inside the beat, 0→1 | uBeat.x, sway, trap rotation |
| `beatCount` | count | beats since start | phrase alignment, hysteresis |
| `bpm` | raw | tempo | beat rate, crossfade duration |
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
| `flowHigh` | raw | musical time driven by highs | - |
| `centroid` | level | spectral brightness | arousal, MANDALA colour |
| `flux` | raw | raw spectral flux (kick + .6 snare bands) | - |
| `dirty` | level | noisy / distorted texture | mood spiky, valence |
| `punchy` | level | transient-heavy mix | mood angular |
| `perc` | level | percussive (spiky onset envelope) | arousal, angular |
| `beatConf` | level | confidence in the synapse beat clock | gridTrust |
| `gridTrust` | level | trust in the bar/phrase grid (keeps counting through breakdowns) | beat-quantised actions (§5) |
| `barConf` | level | confidence in the bar (4-beat) line | boundary snapping |
| `phraseConf` | level | confidence in the 16-beat phrase line | drop expectation, boundary snapping |
| `bar` | count | bar number on the synapse grid | phrase-aware scenes |
| `barPos` | raw | position inside the bar, 0..4 (beats) | MANDALA fold rotation |
| `barPhase` | level | position inside the bar, 0..1 | TORUS breathing (alt) |
| `phrasePos` | raw | position inside the 32-beat phrase, 0..32 | director look memory |
| `phrase16Pos` | raw | position inside the 16-beat phrase | - |
| `beatSyn` | raw | synapse beat clock (continuous beats) | grid fields |
| `bpmSyn` | raw | synapse tempo estimate (rival to bpm; bpm is canonical) | HUD, DECISIONS.md comparison |
| `key` | count | the key, 0=C … 11=B | TORUS knot / palette anchor |
| `mode` | count | 0 major, 1 minor | valence |
| `keyConf` | level | how sure the key is | TORUS |
| `novelty` | level | timbre just changed (quick, causal) | early warning for the director |
| `foote` | level | Foote novelty at the last beat (careful, 4-beat kernel) | boundaries |
| `boundaryEvt` | event | a section boundary was just declared (synapse) | director soft switch (alt) |
| `sectionAlt` | count | synapse section id (23-dim fingerprint clustering); sectionId is canonical | DECISIONS.md comparison |
| `sectionReturn` | level | this section is a return of an earlier one (synapse) | look memory |
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
