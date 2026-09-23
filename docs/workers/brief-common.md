# Common brief for synapse-scene workers (DUST, MANDALA) — §3

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules).

**You may read ONLY:** `docs/CONTRACTS.md`, `docs/HARNESS.md`, `docs/ENGINE.md`, your target folder, and the named
line ranges of `~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html` (read them with `sed -n 'a,bp'`; never
modify that file; do not read outside the ranges). You may open `assets/main.js` only to add the two registration
lines CONTRACTS.md §1.8 describes. Do NOT open `assets/core/`, `assets/engine/`, `assets/effects/` or other scenes. If
you feel you must, don't: write the question down in your friction log, guess, continue.

**Environment:** run every `tools/cdp.js` command with your own `PORT=<given>` env so parallel workers don't collide
(`PORT=8771 GPU=1 node tools/cdp.js …`). Shots land in `tools/work/` (use names prefixed with your scene name).

**Translating synapse's uniform block.** Synapse feeds shaders through one std140 UBO (`#define uX U[i].y`, lines
596–658). Here every shader gets `HEAD` (uRes uTime uBands uBeat uArc uHarm uPal uTint + pal()/rot()/hash()) and you
declare the rest as ordinary uniforms, uploaded in `draw()` from `MS` / `LOOK.mood` / `ctx`. Mapping:

| synapse | Eigenwobble source (in `draw`/`update`) |
|---|---|
| uTime | `MS.flow` (musical time — never wall-clock) |
| uBeat | `MS.beatCount + MS.beatPhase` · uBar → `MS.barPos` · uBeatConf → `MS.beatConf` · uBeatI → `MS.beatSyn` |
| uBass uMid uHigh uSub | `MS.bass MS.mid MS.high MS.sub` (uBands.xyz already carries bass/mid/high) |
| uBassS uMidS uHighS uLevel | `MS.bassS MS.midS MS.highS MS.lvl` |
| uKick uSnare uHat | `MS.kick MS.snare MS.hat` (decaying impulses) · uKickCount → `MS.kickCount` |
| uDrop | `MS.dropEnv` · uDropAge → your own counter: `+= dt`, reset to 0 on `MS.dropEvt` · uDropIn/uDropConf → `MS.dropExpectedIn` / `MS.dropConf` · uResolve → `MS.resolve` |
| uTension uIntensity uCalm uHush | `MS.tension MS.intensity MS.calm MS.hush` |
| uFlow uFlowBass uFlowMid uFlowHigh | `MS.flow …` |
| uHue uSat uBri uSpread uInvert uAngular uSpiky | `LOOK.mood.hue .sat .bri .spread .invert .angular .spiky` |
| uValence uArousal uDirty uPunchy uCentroid uFlux uAlive | same names on `MS` |
| uPhrase uPhraseConf uSectionAge | `MS.phrasePos MS.phraseConf MS.sectionAge` |
| uSeed | `MS.seed.a * 100` (a per-section constant; changes on section events) |
| uQuality | `ctx.Q.q` (0..1; synapse's was an integer tier — e.g. iterations `7 + int(q*3.+.5)`) · uRes → HEAD's `uRes` |
| uSceneAge | `MS.flow - flowAtEnter` (keep `flowAtEnter` = MS.flow when you become `env.SC.logical`) |
| uShock (drop ring) | radius `dropAge*1.15`, amplitude `dropAge<1.6 ? dropEnv*exp(-dropAge*1.6)*1.2 : 0` |
| KICKS[8] (travelling rings) | keep your own ring of the last 8 kicks `{age, s}` from rising edges of `MS.kick`, or skip |
| uSpec / uWave / uHist / uHistRow | `ctx.engineTex.spec / .wave / .hist` bound with `ctx.tex(pr,'uSpec',unit,ctx.engineTex.spec)`; uHistRow = `(ctx.engineTex.row − 0.5)/128` (`row` is the next row to be written; synapse's `R.histRow` was the newest — CONTRACTS §1.1) |
| CAM / camPix() | there is no director camera. Fullscreen scenes ignore it; a 3D point scene builds its own simple camera (see your brief) |
| GLSL_COMMON helpers you need (hash11, pal, ang, …) | copy the specific functions you use into your own `shaders.js`; do NOT copy the UBO block or the `#define`s. Note HEAD already defines `pal()`, `rot()`, `hash()`, `TAU` — name yours differently (`palM`, `hash11`) to avoid redefinition |

Synapse's `pal()` was hue/spread/sat/bri driven; rebuild it from `LOOK.mood` (uHue etc.) in your shader as `palM(t)`.
Lifted fragment sources start with their own `out vec4 o;` — drop it (HEAD declares it). Some contain a reversed
`smoothstep(hi, lo, x)` — rewrite as `1.-smoothstep(lo, hi, x)`. `tools/check.js` is a legal read for the uniform idiom.

**Acceptance (all from the repo root, all must pass):**
1. `node tools/check.js` → `0 fail` (≤350 lines per file: keep `shaders.js` separate from `index.js`).
2. `PORT=<yours> GPU=1 node tools/cdp.js 'test&scene=<id>' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical})"},{"shot":"work/<name>-t6"},{"wait":8200},{"shot":"work/<name>-t14"}]'`
   → ERRS `[]`, nonFinite `[]`; Read both shots: the scene must be a distinct, non-black image at t6 and visibly react
   to the drop at 13 s in the t14 shot (brighter / burst / reformed — say what you see).
3. `PORT=<yours> GPU=1 node tools/cdp.js 'test&fake=0&demo=house&scene=<id>' '[{"wait":10000},{"shot":"work/<name>-h10"},{"wait":20000},{"shot":"work/<name>-h30"},{"wait":20000},{"shot":"work/<name>-h50"},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),q:CARD.Q.q,bench:CARD.bench(<id>,60)})"}]'`
   → three different-looking frames across the house track (groove → breakdown → build); report `bench` (ms).
4. The scene object has: `name id tag feats cuts score init update draw post help` and the `feats` list is exactly the
   MS fields you read (nothing more, nothing missing).

**Report (the deliverable):** (a) friction log — every question the docs did not answer (quote the missing sentence),
every guess you made; (b) whether you were tempted to open a forbidden file and why; (c) the exact acceptance outputs
(EVAL lines, bench) and what each screenshot showed; (d) anything wrong in the docs (a command that failed as printed,
a field that did not exist); (e) the final `feats` list and the `post` params you chose. Leave the scene registered.
