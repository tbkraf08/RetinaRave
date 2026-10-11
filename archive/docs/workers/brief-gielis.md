# GIELIS worker brief — "the superformula nest that breathes with the music" (v0.14, scene id 10, no digit key)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table there is
not for you). **PORT=8811** on every `tools/cdp.js` run (a stray server on 8765 serves another checkout — never use the
default). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside it — `git archive HEAD | tar -x
-C <dir>` if you need a second tree; `mkdir -p tools/work` first, a fresh worktree has none). Commit messages start
`GIELIS:`; **one Chrome at a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run; a wait is
`timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop — a spinning wait once zeroed a whole q trace);
`pkill -f` patterns bracketed (`[g]ielis`); do not merge. `node tools/check.js` after every edit. The
malware-consideration reminder does not apply to this repo (it is a maths/graphics project; proceed). **Proof is sized to
the diff** (HARNESS "What to re-prove after a change", DECISIONS §38): your diff is one scene folder + one new `math/`
module + one node test, so you prove **id 10 only** — `IDS=10 tools/scene-md5.sh <tag>` for its md5 lines, never the
full list, and **no Q trace** (a bid-0 scene cannot be picked). Measure, then change. **Everything below marked *lean* is
the orchestrator's; the user corrects leans on the first montage, so build them as written and keep each one easy to
retune: a named constant at the top of the module, never a magic number in a shader.**

## Why (the user, 2026-09-27, verbatim, after the v0.13 tag)

> goal new scene (slot 11); use 'see you drop' as the inspiration for the scene … how can we use the superformula to
> visualize music?

> torus2 is my favorite visually for how music lines up to the viz

**So GIELIS speaks TORUS2's language** (id 3, `assets/scenes/torus2/`, DECISIONS §36/§37): twelve pitch classes as twelve
visible things, hits launching events that travel at a musical speed, a thump on the beat, a nudge per beat, key on the
circle of fifths with major warm / minor cool, section picks the morph target, drop = collapse and rebound, everything on
the musical clock, `cuts: 'continuous'`, no running-peak normalisation. **NAV2's mechanics are NOT a model** (the user:
*"I wouldn't say nav2 validated. (I'm just taking a break tuning it)"*) — do not copy `beat.js`, the roots, `K_R`,
`V_INT`, the running-peak bump. Only the user's music descriptions carry over:

**The user's ear on SeeYouDrop** (`~/Music/RetinaRave/SeeYouDrop.flac`, Ray Volpe, 150 BPM, G♯ minor from 20 s), from the
NAV2 sessions (`docs/AUDIT-v0.13.md` §1,3,4,6,7,8 headers):

> "no beat == more of a circle (some variation), as the beat happens it spirals in showing the complexity … The edge of
> the set should always be moving with the music."
> "25s-1m03s set should be bumping in some way with each beat (as beat evolves the set should come back to a slightly
> different shape) … also is a little too bright (detail is getting washed out)"
> "this song is an example of the extreme; 0-13s the high rise up to their max (edge should be bumping on every beat /
> light oscillating off the edge); at 25s it really starts moving the edge on every beat"
> "each beat should make the set close up (different pitches are different shapes); at 1:38 it goes double time -> should
> be moving faster / reacting more; 1:45 -> this is where the highest energy is, should be reacting more"
> "When I say breathing with the music I [mean] that the beat causes the set (ie. black circle in the middle) collapses
> into interesting shapes, then the silence rebounds to the circle … there are some interesting shapes being generated
> but still seems all the same … why does different sounds look so similar?"
> "I like the bright / glowy look, but I don't want it to be so bright that can't see the … shapes."
> "pretty much should be deforming on every beat."

From the MAXWELL sessions (`docs/AUDIT-v0.12.md:3–8, 201–202`, DECISIONS §45):

> "I'm expecting every sound to generate a wave (and the wave color is based on musical note being played)"
> "no sound -> quiet (ie. wave not generated)"
> "the part that was missing ripples was 50s-57s … feel like there should be more skinnier waves, (vs bass fatter waves)?"

From TORUS2 (DECISIONS §36/§37): "I liked color tied to circle of fifths"; "torus2 looks good, promote it."

**The track, as measured (TRACK time; the probe's D lines run ≈ 2 s later):** 0–13 s intro, highs rising, engine `kick`
only 0.1–0.3 · ~19 s the build's wind · 25 s–1:03 groove, `bass` 0.6–1.0, `eS` 0.80–0.95 · **49/50.5–58 s breakdown:
`kick` 0 for six seconds, `bass` .04, `hat` .57, mids/highs loud** · **drop 1 ≈ 55–58 s** (`dropEvt`, `arc` → peak) ·
59–61 s double-time fill (onsets 2.1×) · 1:33–1:41 the energy peak, 1:38 double time (hit interval 0.17–0.23 s) · **drop
2 = 1:45 (105.9 s), `dropStrength` 1.0**. Only two `dropEvt`s on the track, 47 s apart. (`docs/AUDIT-v0.12.md:179–197`,
`docs/AUDIT-v0.13.md:114–135, 210–216`.) You cannot play the track headlessly — the orchestrator runs the SeeYouDrop
windows after the merge. Your instruments are `#test`, `&demo=house`, the hooks and the node test.

**The interview (2026-09-27) — answered by the user (not negotiable):**
1. Renderer = **3D supershape nest as strokes** (TORUS2's lineage: path B through `ctx.lines`).
2. Species = **interval-to-key ratios** (the lobe count from the just-intonation ratio of the interval above the key).
3. **Section morph on the lobe lean is in.**
4. **id 10, reached by `n` / `&scene=10`, no digit key, forced-only until approved; the folder and card are `GIELIS`.**
5. Acceptance windows on SeeYouDrop = intro 0–13 s, groove 25–63 s, breakdown 49–58 s, double time 1:38, drop 1:45,
   per-beat rulers on the n1 swing and the wave spacing (the orchestrator runs these after the merge).

## Targets

`assets/scenes/gielis/` (the skeleton is there and registered: `index.js` with `name 'gielis'`, `id 10`, `score() → 0`,
`tag`, `card`, colour `v2` alone, `cuts: 'continuous'`, `help` three depths; keep `name`, `id`, `score`, `colour`, `card`,
`cuts`, replace everything else) — split from the start: **`index.js`** (the scene object, the MS → uniform mapping —
TORUS2's `index.js:159–177` is the model), **`nest.js`** (the twelve families: chroma → size/brightness, the species,
the breath, the templates, the Q ruler call), **`shaders.js`** (the vertex shader that builds every stroke point from the
generated GLSL twin of the superformula, the fragment shader), **`help.js`** (data only, TORUS2's shape); **500 lines hard
cap per module**, 350 soft — a warning is allowed, 500 is not. **New `assets/math/gielis.js`** (pure numerics,
node-importable, no DOM: the superformula `r(φ, m, n1, n2, n3, a, b)`, the 3D spherical product, the GLSL twin as a
generated string the way `torus2/attractors.js` generates its twin from the same constants, the interval → ratio table,
Green's Q of a sampled closed curve) and **`tools/test_gielis.js`** (yours; the repo's tests live in `tools/`, not beside
the module). **New `assets/math/waves.js`** is already there (`mkWaves()`, per caller — lifted from `torus2/waves.js` by the
orchestrator, TORUS2's md5s proven identical): import it, never `torus2/waves.js`. Nothing in `core/`, `engine/`, `main.js`
(already registers you), `feats.js`, no other scene, **not `math/keycolour.js`, `math/nudge.js`, `math/waves.js`,
`math/util.js`** (import them freely; a helper you need goes in `gielis.js`). TORUS2, NAV2, MAXWELL, POLYTOPE are
**untouched** — read them, never edit them; **the scene imports only `math/*`, never `torus2/`** (`check.js` fails on it).

**You may read:** this brief, `docs/CONTRACTS.md` (§0, §1 in full — §1.1 ctx, §1.2 palette, §1.4 post/budget, §1.6 tiers,
§1.9 cuts, §1.12 lines path B, §1.13 `help.feats`, §1.14 OKLCH (read, not used), **§1.16 params**, §1.17 the card,
**Appendix A** — every MS field, generated from `assets/engine/feats.js`), `docs/ENGINE.md` (the `MS` vector kinds),
`docs/HARNESS.md` ("Static checks", "Headless Chrome", "Bench protocol", "Q trace", "Real window", "Params", "Continuity
monitor" ~433–440, **"What to re-prove after a change"**, "Pitfalls"), `docs/DECISIONS.md` **§0** (the continuity
monitor), **§14** (line renderer cost 0.4 µs/segment), **§29** (params, FEIGEN's process — the shape you copy), **§36
TORUS2** (the leans that stood, the five user answers), §37, §45 (thin waves / fat waves, the breakdown rule), §46 (only
the **user quotes** and the *measuring* lessons in AUDIT-v0.13 §8: a montage cannot judge a per-beat pinch; measure per
frame), `docs/workers/{brief-torus2,torus2,brief-nav2,nav2,brief-maxwell,maxwell}.md` (the previous workers' friction —
torus2.md's 16 items are the same traps: 6 % amplitude invisible → 0.26; every band needs displacement AND pulse; `#test`
hat is exactly 0.5; warm/cool is a pull not an offset; `paramDeps` misses short-circuits; `budget('segs')` does not apply
to path B, item 8), **`assets/scenes/torus2/`** whole (979 lines: `index.js` 345 — the MS → uniform mapping is the model;
`shaders.js` 239 — `waves()` at ~117–124, flash/shimmer ~203–205; `motion.js` the bounce and the camera; `attractors.js`
the generated GLSL twin; `help.js`; `colour.js`), `assets/scenes/nav2/green.js` (read only — the Green's-theorem ruler's
shape; you re-implement it in `math/gielis.js` on a sampled polygon because a scene may not import another scene's
folder), `assets/math/{keycolour,nudge,waves,util,hopf}.js` + `tools/test_{torus2,hopf,green}.js` (`mkAnchor()`:
key anchor on the fifths, warm/cool PULL, keyConf gate, eased hue — import it, do not re-derive it; `mkNudge()`: the per-
caller nudge spring; `mkWaves()`: the launch ring buffer), `assets/engine/feats.js` (read only: every field's kind, eli5,
formula), `assets/engine/sources/fake.js` (read only: what `#test` fills — see below), `assets/core/params.js` and
`assets/core/route.js` (read only), `assets/core/lines.js` (read only: path B's `VS_CHUNK`/`FS_CHUNK`, `mk`, `drawN`),
`tools/monitor.js`, `tools/check.js`, `tools/scene-md5.sh`, `tools/param-smoke.js`, `tools/cdp.js`'s header comment,
`tools/montage.py`, `tools/lum.py`, `tools/accept/v0.13/{sat13.py,perbeat13.py}`. Not `core/scenes.js`, not
`engine/features*.js`, not `engine/synapse/` — if a field's behaviour is unclear, `feats.js` + a `CARD.MS` eval in the
page is your instrument; write the question in the friction log and continue.

**What `#test` (the fake timeline, `sources/fake.js`) gives you, checked by the orchestrator 2026-09-24:** 24 s loop,
sustain 0–6 → valley 6–10 → build 10–13 → DROP at 13 s (f780 at CLOCK=1's 60 Hz) → peak 13–21 → valley 21–24.
`riser = roll = build`; `centroid = .35 + .3·high`; `hush` = 1 after 12.6 s; `tension` .9 in the build, .6 in the peak,
.2 otherwise (ema .5 s); `build` ema 1 s; `kick` 1 on every beat while kicks are on, `snare` .7, **`hat` exactly .5**
(thresholds below it); `key 9 / mode 1 / keyConf .8`; **`chroma` all zero** — so the nest's sizes come from the
`harmAngle` fallback on `#test`, exactly as TORUS2's latitudes do (`index.js:159–177`); `beat`, `beatPhase`, `beatCount`,
`bpm` run; `dropEvt` fires once at 13 s, `sectionAlt` / `sectionEvt` / `surpriseEvt` — check `fake.js` and say in the
report which fire. Fields the fake never fills you pin with a hook (`&fix=` in the hash fixes any MS field for the run:
`&fix=key=8,mode=1`, `&fix=dropEvt=1`; HARNESS "Params"). The demo synths (`&fake=0&demo=house|aba|dnb`) are random run
to run; `#test` with `CLOCK=1` is bit-identical — use it for every md5.

## The superformula (goes in `assets/math/gielis.js`)

```
r(φ) = ( |cos(m φ / 4) / a|^n2 + |sin(m φ / 4) / b|^n3 )^(−1 / n1)          (Gielis 2003)
```

`m` = the lobe count (an integer closes in one turn; a rational p/q closes after q turns with p lobes) · `n1` = the
pinch: n1 → ∞ is a circle whatever the rest, small n1 a star · `n2, n3` = the lean of the lobes (unequal = lopsided) ·
`a, b` = axis stretch. The 3D supershape is the spherical product of two curves:
`P(θ, φ) = ( r1(θ) cos θ · r2(φ) cos φ,  r1(θ) sin θ · r2(φ) cos φ,  r2(φ) sin φ )`, θ ∈ (−π, π], φ ∈ [−π/2, π/2].
Drawn as **latitude rings** (fixed φ, θ round the ring) of strokes. **Green's Q** = 4πA/L² of the equatorial curve
(φ = 0: `r1(θ)` alone), sampled at 512 θ on the CPU per frame (shoelace area, chord length), is the roundness ruler
(`Q` 1.0 = circle, a star well below) — cheap, exact, and the only instrument that made the user's "collapse / rebound"
sentences testable on NAV2. Expose it as `hooks.green()` → `{Q, A, L, n1, m}` of the loudest family.
`tools/test_gielis.js`: the circle limit (n1 = 1e6 → Q > 0.999 for m = 4 and m = 7/2), the p/q closure (m = 3/2 closes
after exactly 2 turns: r(φ + 4π) = r(φ) to 1e-9, r(φ + 2π) ≠ r(φ)), a known star's Q (m = 5, n1 = 1, n2 = n3 = 1 →
Q well below 0.8; report the number), the GLSL twin's constants vs the JS to 0 (`attractors.js`'s pattern), the
interval table (12 entries, root 1/1, fifth 3/2, closes in ≤ 8 turns for every entry).

## The design (each constant below is a lean unless marked otherwise)

### 1. The nest — twelve pitch classes, twelve supershapes (`nest.js`, `shaders.js`)

Family k (pitch class) is one nested supershape drawn as latitude rings of strokes (path B through `ctx.lines`: the
vertex shader builds every point from `gl_VertexID` → (family, ring, segment); budget the segments per ring by
`ctx.tier()` from a table in the scene as TORUS2's `SEGT` does — `budget('segs')` does not apply to path B; smooth the
tier yourself, `cuts: 'continuous'`). Its **size and brightness follow `chroma[k]`** exactly the way TORUS2's latitude
and brightness do (`index.js:159–177`): the loudest family is the outermost and brightest, quiet ones nest inside; the
`harmAngle` circle-of-fifths fallback blended by `w = min(1, 2·Σchroma)` so `#test` and silence still have a nest. A
brightness floor (no family below `FLOOR` 0.18 of the loudest) and a capped fog (the far side never below half), as
TORUS2 spec 1. **`kick` flashes the quiet inner families** (max-hold follower, `FLASHT` 0.25 s decay, on the families
below the median brightness); **`hat` shimmers along every ring** (the `SHIMK` 24 ripple in the ring parameter,
amplitude `SHIM` 0.55·hat, gated by `alive`). Rings per family `RINGS` 7 (φ from −π/2·0.85 to +π/2·0.85), the family's
size `SIZE0 + SIZEK·chroma` with the loudest at the rim; `sub` fattens `a, b` (`SUBK` 0.15). Lean: `RINGS` 7, `FLOOR`
0.18, `SIZE0` 0.25, `SIZEK` 0.75.

### 2. The species — m from the interval to the key (`math/gielis.js`, `nest.js`)

Family k's lobe count is its interval above the key root, `(k − key) mod 12`, as a **just-intonation ratio**:
0 → 1/1 · 1 → 16/15 · 2 → 9/8 · 3 → 6/5 · 4 → 5/4 · 5 → 4/3 · 6 → 7/5 · 7 → 3/2 · 8 → 8/5 · 9 → 5/3 · 10 → 9/5 ·
11 → 15/8, scaled so the root reads as a clean low lobe count: **lean `m = M0 · p/q` with `M0` 4**, so the root is a
rounded square (m 4), the fifth six lobes over two turns (m 6), the tritone 28 lobes over five turns (m 28/5), the major
third five lobes (m 5). Consonant families are simple, dissonant ones are starry and take turns to close — **"different
pitches are different shapes"** by construction, and the shape logic agrees with the hue logic (both on the key). A ring
of a family with m = p/q must run **q turns** of θ to close (the ring parameter t ∈ [0, 1) maps to θ = 2πq·t; the
segment budget is per ring, so a q = 5 family is coarser per turn — say so in the report if it shows). `keyConf` gates it
exactly as `keycolour.js` gates the hue: below `KEYC1` 0.3 hold the last confident key; the `#test`/silence fallback key
is the nearest fifth of `harmAngle` (`sectorPc` in `keycolour.js`). A key change eases over `MTC` ~2 s: **a rational m
does not interpolate cleanly — cross-fade the two radii `r(m_old)` and `r(m_new)` in the vertex shader (two m per family
+ a fade), never lerp m.** Fallback if the ratios read as noise on the montage (the orchestrator decides, on the user's
word): `m = k + 3` — keep the table in one place so the swap is one line.

### 3. The breath — n1 pinches on every beat (`nest.js`)

`n1` sits at a rest value near the circle (lean `N1_REST` 12) and on each beat drops toward a pinch (lean `N1_BEAT` 1.5)
with **TORUS2's thump** envelope `press = max(0, cos 2π·beatPhase)^4` — read off `beatPhase` / `beatCount`, the engine's
grid, **never the kick detector** (which reads 0.1–0.3 in this intro and misses a third of the beats). The depth of the
pinch scales with `eS`: `depth = (0.5 + 0.5·eS)·breath` so 25 s presses harder than 0–13 s, 1:38–1:45 hardest; a hit
(`kick`) in the same beat adds `HIT_K` 0.3 on top, so the beat deforms, the hit deforms more. `n1 = N1_REST − (N1_REST −
N1_BEAT)·min(1, depth·press + HIT_K·kick)`, per family with the same press (the whole nest breathes together; lean — a
per-family phase lag is a retune). `sub` fattens `a, b`; the groove's `build`/`tension` go to the **lean (n2 ≠ n3, a ≠ b,
spec 6)**, never to n1 — the wind must not floor the breath (the NAV2 pass-8 trap: a 0.3 wind-up through the groove floored
the trough). Because `press` is the beat's own shape it cannot trip the continuity monitor's spike rule; expose `state =
{n1, Q, cPath: <a 2-vector that moves by ≤ 0.06 per frame — the nest's centroid on screen>, pathCut: 0, kick: {x: 0},
baby: null, mode: 'nest'}` so the monitor can be pointed at you (`CARD.NAV = CARD.REG[10].scene.state`, HARNESS ~433).
Acceptance ruler, headless: a `CLOCK=1` frame series across one bar of `#test` (f600 … f720 every 3 frames, `hooks.green()`)
→ n1 dips at beatPhase 0 on all four beats, **Q swing ≥ 0.15 per beat, rest Q ≥ 0.9 between beats**. (The orchestrator's
ruler on the track: per frame at `DT=16`, Q of the loudest family swings ≥ 0.15 on ≥ 90 % of the beats in 25–63 s; in
50.5–57 s the beat-grid thump keeps pinching but shallower and the hat ripples carry the edge.)

### 4. Waves on the rings — every sound a wave (`math/waves.js`, `shaders.js`)

`const WV = mkWaves()` from `math/waves.js` (never `torus2/waves.js`); `hooks.train` = `WV.train`. As TORUS2: rising
edges in kick / snare / hat launch a bump running round every ring at one ring per bar, gaussian widths `WAVEW [0.05,
0.017, 0.008]`, **both displacement and pulse** (torus2.md's trap), 2-beat decay, 8-beat life; kick on every family fat
and slow (`WAVED` kick = `params.wave`, `WAVE0` 0.26 — 6 % was invisible on TORUS2), snare on the loudest family sharp,
hat tiny everywhere; the `beat` event's faint wave when nothing hit (`FAINT` is in `math/waves.js`). The rhythm reads as
bump spacing; 1:38 doubles the density by itself. The wave rides the **ring parameter t** (θ = 2πq·t), so on a q-turn
family one wave runs the whole closed curve in one bar. **Silence is quiet:** `presence`/`hush` gate the floor (`presence`
scales the whole nest's opacity; below `PRES0` 0.05 nothing is drawn), no carrier. **Wave hue = the launching family's
hue** (the note: the loudest family at launch; store the family index per slot beside the ages — extend your own copy of
the upload, `uWaveH[24]`, not `math/waves.js`; if you need `mkWaves` to carry a third array, add it there behind an
optional argument and prove `IDS=3` unchanged — TORUS2's pixels must not move), as MAXWELL was validated to do.

### 5. Motion — nudge, thump, growth (`index.js`, `nest.js`)

`const NG = mkNudge()` from `math/nudge.js` yaws the nest 1/16 turn per beat about its centroid (target `(beatCount/16)·2π`,
`slow = max(hush, calm)`). The 5 % bounce is a second thump on the camera distance, as TORUS2 (`motion.js:36–38`, `BOUNCE`
0.05). Growth: `build` 0→0.5 raises the drawn family count 6→12 (fractional fade of the newest, TORUS2's `uFibF` idea:
`FIBMIN/FIBMAX` 6/12, the families drawn in loudness order), 0.5→1 brings the camera in; `intensity`/`arousal` set the
resting size (TORUS2's `size` param verbatim); fill ≤ 85 % of the short edge, never crops in portrait (`ctx.onResize`, the
short edge binds). `flowBass/Mid/High` advance the low / mid / high families' ring phase at three speeds (`PSIK` as TORUS2).
Camera: a fixed elevation `CAM_EL` 0.55 rad, distance `CAM_D` 3.2 · size, the tumble `surpriseEvt` twists (spec 6) bounded
`|twist| ≤ 0.4` rad and eases back over 1 s.

### 6. Section and drop (`nest.js`)

`sectionAlt mod 4` picks a **lean template** — four (n2, n3, a, b) tuples: `round` (2, 2, 1, 1) · `petal` (1, 4, 1, 1) ·
`blade` (4, 1, 1, 1.3) · `shard` (0.6, 0.6, 1, 1) — cross-faded over `MORPHTC` 1 s, the amount `morph = 0.9 · tension ·
(arc idle ? 0 : 1)` written as `a·(cond ? 0 : 1)` so `paramDeps` records every field; exactly TORUS2's attractor rule with
a tuple in place of a flow field: the lean applied is `mix((2, 2, 1, 1), template, morph)`; a returning section returns
to its template. `dropEvt` → **collapse** (all n1 to `N1_BEAT`, the nest to `DROP_SZ` 0.4 of its size) for one beat
(`exp(−dt·bpm/60)` as TORUS2's `collapse`), **rebound** on the `dropEnv` gain ×1.6 on the brightness; `surpriseEvt` → the
one-frame twist target (spec 5); `riser`/`roll` → the rings unwind toward helices through the build (a φ-drift per ring
proportional to `max(riser, roll)`, `UNWIND` 0.35) and snap back on the drop. Both of this track's drops (58 s, 1:45) must
read; there is no refractory to tune because there is no cut.

### 7. Colour (`index.js`, `shaders.js`)

`const KC = mkAnchor()` from `math/keycolour.js`: key on the fifths, major warm / minor cool by pull, `keyConf` gate,
`HUETC` ease; the twelve families spread `0.3 + 0.45·mood.spread` centred on the anchor (`sectorHue`), `valence` warmth
on top (all inside `mkAnchor`). Colour slot `{ default: 'v2', variants: { v2: {} } }` (OKLCH is a later opt-in; do not add
it). **Bright but legible:** the luminance knee the user asked for on NAV2 — glow peaks kept, the stroke's core never
above the tonemapper's knee so the lobes read: a soft knee on the stroke luminance in the fragment shader (`KNEE` 0.8,
`KNEE_S` 3) — prove with `tools/lum.py` on the house shots and `sat13.py` p95 in 0.6–0.8 (report the numbers; the
orchestrator re-measures on the groove).

### 8. Params (CONTRACTS §1.16) — six, the cap, named for what the eye sees

| name | eli5 | range | from(MS) (the target; the ease is state) |
|---|---|---|---|
| `breath` | how deep every shape pinches on the beat | [0, 1] | `0.5 + 0.5·MS.eS` |
| `wave` | how deep the bump a kick sends travelling round every ring | [0, 0.4] | `WAVE0 + 0.1·MS.kick` (TORUS2's, verbatim) |
| `turn` | where the whole nest has been nudged to, in the turn it makes every sixteen beats | [0, 6.2832] | `((MS.beatCount/16)·TAU) % TAU` (TORUS2's) |
| `size` | how much of the screen the nest fills | [0.4, 0.9] | TORUS2's `size` from(), verbatim |
| `lean` | how far the lobes are pulled toward the section's template | [0, 1] | `MORPHK·MS.tension·(MS.arc === 'idle' ? 0 : 1)` |
| `glow` | how brightly the inner shapes are kept lit | [0, 0.5] | `GLOW·(1 − GLOWQ·max(MS.hush, MS.calm))` (TORUS2's) |

`from(MS)` is **moved verbatim** from your own update (name the argument `MS`; reads only fields in `feats`; pure). Read
them as `env.params.<name>` in `update()`. Prove: `CARD.paramsOf('gielis')` at f360 = finite numbers in range,
`CARD.paramDeps('gielis', p)` per parameter listed in the report, `paramsOf == derived` (identity), one route moves the
md5 (`&param=gielis.breath=c:1` vs none at f360), lo/hi shot pairs for `breath` and `lean` with a sentence each.

### 9. `feats` and `help.feats`

Exactly the fields read: `chroma harmAngle key mode keyConf valence beat beatPhase beatCount bpm barPos phrase16Pos kick
snare hat sub bass eS build tension intensity arousal arc sectionAlt sectionEvt dropEvt dropEnv surpriseEvt riser roll
flowBass flowMid flowHigh presence hush calm alive novelty clarity regularity` (the last two only in `score()` → a
`the bid:` line; `score()` returns 0 today but keep TORUS2's expression behind the 0 — `return 0 * (…)` is not it; write
`score(MS) { return 0; }` and read `clarity`/`regularity` nowhere else, then drop them from `feats` — say which you did).
**Every field in `feats` must be read** (the static read check warns on a phantom; `check.js` fails on a `help.feats` gap
and on an undeclared read at param registration) — drop anything you end up not reading. `help` three depths (eli5 / why /
math), written for a listener (the skeleton's text is a start; rewrite it to what you built); `tag` one line; `hud()` one
line (loudest pc, m of the loudest, n1, Q, waves live, key, turn, size, template, morph); `hooks`: `info()` (the live
numbers as a plain object: n1, Q, m per family, loudest, draw count, seg, morph, template, key, mode, hue, beatNow, waves
live + positions per band), `green()`, `train(v)`, `key(k, mode)` (pin the key), `template(i)` (pin the template), `still(1)`
(every music-driven uniform at rest: n1 = N1_REST, no waves, no flash/shimmer, morph 0 — the no-op gate as NAV2's).

## Non-negotiables (README, CONTRACTS §0) and the traps the previous workers hit

- No `Math.random()`, no wall clock (`performance.now`, `Date`) — musical time (`beatCount + beatPhase`) or `dt`. A
  constant is a named manual setting at the top of the module. Scenes import nothing from `core/`, `engine/` or another
  scene's folder — **only `math/*`**. Module cap 500 lines. `node tools/check.js` 0 fail after every edit; the scene must
  load in node (`check.js` imports it: no DOM, no GL at import time — build shader sources in `init`; `gielis.js` must
  import in node with no DOM). No MS field literals outside the scene folder (`check.js`).
- Path B programs get `ctx.lines.VS`/`FS` chunks (`mkVS`/`mkFS` as TORUS2's `shaders.js`): never redefine HEAD's `pal`,
  `rot`, `hash`, `TAU`, `uRes`, `uTime`, `uBands`, `uBeat`, `uPal`; never name a GLSL variable `gl_*`; `smoothstep(a, b, x)`
  with a > b is undefined; **every uniform declared must be fetched** (`check.js` fails on a dead one); `pow(x, y)` with
  x < 0 is undefined in GLSL — the superformula takes `abs()` before every power, and `n1` must never reach 0 (clamp at
  `N1_MIN` 0.5).
- `#test` never fills `chroma` or `key` from audio: blend from `harmAngle` and take the nearest fifth as the key while
  `keyConf` is 0 (it is 0.8 on `#test` with key 9 — say which path each proof uses), so the headless montage has a nest
  and the md5s are deterministic. `#test` hat is exactly 0.5 — thresholds below it (`math/waves.js` HI 0.45 already is).
- **The reference md5s of ids 0–9 cannot move** (you touch nothing outside your folder + `math/gielis.js` + one test) — do
  not shoot them. Your **s10 lines** (`IDS=10 tools/scene-md5.sh <tag>`) are what you prove. GIELIS bids 0 until approved.
- Cost: line renderer 0.4 µs/segment (§14): 12 families × `RINGS` × `SEGT[tier]` segments — at tier 3 with 7 rings and
  160 segments that is 13 440 segments ≈ 5.4 ms, too much: **size `SEGT` so tier 3 is ≤ 8 000 segments** (the q-turn
  families need more per ring — budget per family by q, cap the total) and prove `CARD.bench(10, 300)` ≤ 1.5× `bench(3,
  300)` (TORUS2), interleaved, each in a page where it is the forced scene (a bench of an off-screen scene measures its
  last update's state — §36 friction 12), `CARD.Q.q` pinned .95 in both; plus the CPU side (the Q ruler at 512 samples,
  the per-family shape state): the median of 300 timed `update()` calls ≤ 0.5 ms (`hooks.timeUpdate(n)` as NAV2's).
  Forced GIELIS `q ≥ 0.6` at tier 3 on the house run.
- Headless `Q.q` is not a perf verdict (`CARD.bench` is). Two-argument hooks are reached through
  `CARD.REG[10].scene.hooks.f(a, b)` in an eval; `&name=v` fires one-argument hooks after `init`, before the first frame.
  `goScene` does not beat a sticky `&scene=`. `paramDeps` misses a field behind a short-circuit on the defaults.
- **`overlay()` is called every frame for every registered scene** (loop.js), whether or not that scene was ever
  updated: if you define one, guard it (`if (!this._S) return;`) — an exception anywhere in a frame aborts the frame for
  every scene and moves other scenes' md5s. Same for `draw()`: a forced scene is drawn on its first frame before its
  first `update()` — guard it.
- Continuity: `cuts: 'continuous'`; the thump on n1 is fast but it is the beat's own length; `state` exposed (spec 3).
- Measuring: a 1 s montage cannot see a per-beat pinch (AUDIT-v0.13 §8) — your headless instrument is the **`CLOCK=1`
  frame series** with `hooks.green()`; the orchestrator's is the per-frame track trace. Never pipe a `det*.py` into `head`.

## Process — one commit per proven step, in this order (TORUS2's shape, DECISIONS §36)

1. **`math/gielis.js` + `tools/test_gielis.js`** (the superformula, the spherical product, the GLSL twin string, the
   interval table, Green's Q on a sampled curve): the test passes (the circle limit, the p/q closure, the star's Q, the
   twin's constants, the table). Then **the nest**: twelve families by chroma with the `harmAngle` fallback, the floor,
   the fog, drawn as rings of strokes at rest (n1 = `N1_REST`, no waves) — `IDS=10 tools/scene-md5.sh g1` stable across
   two runs; a montage on `&demo=house` f360/f840 (`test&fake=0&demo=house&scene=10`, `CLOCK=1`): a nest of twelve
   rounded shapes, the loudest outermost and brightest, none dark. **The still reference:** `&still=1` s10 md5s at
   f360 / f840 (two runs) — every later step keeps these (still = every music-driven uniform at rest, so a visual step
   that changes a still frame has changed something it should not have). Commit.
2. **The species** (`&fix=key=8,mode=1` on `#test`): the root family a rounded square, the fifth six lobes over two
   turns; `hooks.key(0)` vs `hooks.key(7)` at f360 side by side (montage): the families re-shaped; `info()` lists m per
   family = the table. The still md5s unchanged (the species is not music-driven — say so: the still reference is with
   the fallback key; if the key path moves the still, re-base it here and say why). Commit.
3. **The breath**: a `CLOCK=1` frame series across one bar (f600 … f720 every 3 frames, `hooks.green()` + `info().n1`) as
   a table: n1 dips at beatPhase 0 on all four beats, Q swing ≥ 0.15, rest Q ≥ 0.9; a 4-shot montage at beatPhase 0 / .25
   / .5 / .75 of one beat. Still md5s unchanged. Commit.
4. **Waves** (`mkWaves`): the `train('4x4')` pin at f480 — `info().kick` positions `[0, .25, .5, .75]` ± 0.01 and a shot
   where four evenly spaced bumps sit on every ring; then `train('sync')`; then the edge detector on `#test` (kick / snare
   / hat all launch — `live` > 0 in every band by f360). Wave hue = the launching family's. Still md5s unchanged. Commit.
5. **Flash / shimmer / colour**: `info()` at f360 (flash, shim, hue, sat, key, mode); `hooks.key(0, 0)` vs `(0, 1)`
   montage (major warm vs minor cool — a hue pull, not an offset); `lum.py` centre/rim on the house shots; `sat13.py` p95.
   Still md5s unchanged. Commit.
6. **Nudge / bounce / growth**: `info().turn` at f360 vs f840 (`(beatCount/16)·TAU`), the bounce's thump in a 4-frame
   series, the family count 6 → 12 across the fake's build (f600 → f780 `info().draw`), a portrait run (`WIN=720,1280`)
   shot: nothing cropped. Still md5s unchanged. Commit.
7. **Section templates + drop**: `hooks.template(i)` × morph 0 / 0.5 / 1 on two templates → four shots montaged; the drop
   collapse on `&fix=dropEvt=1` (or the fake's own drop at f780: f780 / f800 / f840 series — n1 to the pinch, size to
   0.4, the rebound) with `green()` per frame. Still md5s unchanged. Commit.
8. **Params + cost + monitor + report**: the six, identity (`paramsOf == derived`), one route (`&param=gielis.breath=c:1`)
   moves the md5, lo/hi pairs for `breath` and `lean`; the unrouted s10 md5s unchanged by the move (from() moved verbatim);
   `CARD.bench(10, 300)` vs `bench(3, 300)` interleaved, `q` .95 pinned — **≤ 1.5× TORUS2** — plus the `update()` median
   ≤ 0.5 ms; the continuity monitor over 60 s of `test&fake=0&scene=10` with `CARD.NAV = CARD.REG[10].scene.state` before
   the MON snippet → `viol []` (report `n`, `fast`, `max`); `check.js` 0 fail; `docs/workers/gielis.md`. Commit.

## Acceptance (repo root, all must pass; `PORT=8811` on every cdp run; shots in `tools/work/` prefixed `gi-`)

1. `node tools/check.js` → 0 fail; no new warning except a soft line-cap one and the missing thumb.
2. `PORT=8811 GPU=1 node tools/cdp.js 'test&scene=10' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical,glerr:CARD.glerr})"},{"shot":"work/gi-t6"},{"wait":8200},{"shot":"work/gi-t14"}]'`
   → ERRS `[]`, nonFinite `[]`, logical 10; t6 the nest at rest with the fallback key; t14 the collapse's rebound after
   the 13 s drop.
3. The house run (brief-common item 3 with `scene=10`, shots `gi-h10/h30/h50`) → three different frames; `bench`
   reported; `errs []`; `q ≥ 0.6`.
4. Every proof shot of steps 1–8, montaged, Read with your own eyes, one sentence each on what it shows.
5. The scene object has `name id tag card feats cuts score init update draw post colour params help hud hooks state rt`;
   `feats` is exactly the fields you read; `help.feats` has a line for every one; `score()` returns 0; `state` has the
   monitor's shape.
6. `IDS=10 tools/scene-md5.sh gi` → your s10 f360/f840 md5s are stable across two runs, and the `&still=1` two are the
   step-1 reference (write all four in the report — they become the v0.14 reference).
7. `node tools/bundle.js` → 0 errors; `FILE=$PWD/dist/retinarave.html PORT=8811 NOAUTO=1 GPU=1 node tools/cdp.js 'real'
   '[{"wait":1500},{"clickSel":"#demo"},{"wait":3000},{"key":"9"},{"wait":500},{"key":"n"},{"wait":500},{"key":"n"},{"wait":3000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical})"}]'`
   → errs `[]`, scene 10 (key `9` reaches id 8, `n` twice reaches id 10 through id 9 — check `stepScene`'s order in the
   page and adjust the count; report what reached it).
8. `node tools/param-smoke.js`, `node tools/test_gielis.js`, `node tools/test_torus2.js` pass.
9. The continuity monitor `viol []` (step 8).

**Report** (`docs/workers/gielis.md`): brief-common (a)–(e) — the friction log (every sentence the docs lack, every guess,
every lean you changed and why), the temptation list, the exact EVAL lines, the bench table (interleaved pairs, ratios,
the update() median, the segment count per tier), the shot file names with one sentence each, the parameter table (name ·
eli5 · range · from · deps · what lo→hi does), the bar-series Q table of step 3, the wave positions of step 4, the m-per-
family table of step 2, the s10 md5s (plain and still), the line count of every module, and **what you would tune first
when the user looks** (the leans you are least sure of — the orchestrator's own ranking: `N1_REST`/`N1_BEAT`/`HIT_K`;
`M0` and the ratio table vs `k + 3`; `RINGS`/`SEGT` and the q-turn coarseness; `WAVE0`/`WAVEW`; the four templates;
`KNEE`; `FLOOR`/`GLOW`). Leave the worktree committed (`GIELIS:` messages); do not merge.
