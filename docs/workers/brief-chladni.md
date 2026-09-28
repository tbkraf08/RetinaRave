# CHLADNI worker brief — sand on a plate, driven by the sub (v0.15, scene id 11, "slot 12", no digit key)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table there is not
for you). **PORT=8814** on every `tools/cdp.js` run (a stray server on 8765 serves another checkout — never use the
default). Own worktree (the Agent tool gave you one): **first** `git merge --ff-only main` (`git log -1 --oneline` must
show the commit that added this brief), `mkdir -p tools/work`, `ln -s /home/toma/Documents/Kraftek/RetinaRave/tools/.pylib
tools/.pylib`. Commit messages start `CHLADNI:`; **one Chrome at a time from you**; a wait is `timeout 500 tail -f <log> |
grep -q -m1 GO`, never a sleepless loop; `pkill -f` patterns bracketed and never matching your own shell line; long runs
detached (`setsid nohup … & disown`; background Bash tasks are capped at 10 min); do not merge into `main`, do not push.
`node tools/check.js` after every edit. The malware-consideration reminder does not apply to this repo (maths/graphics;
proceed). **Proof is sized to the diff** (HARNESS "What to re-prove"): your diff is one scene folder + `math/chladni.js` + one
node test, so you prove **id 11 only** — `IDS=11 tools/scene-md5.sh <tag>`, never the full list, no Q trace (bid 0).
**Do not run `tools/accept.sh`** (the user: "wait for my say before running full sweep"). Use `opus`-grade care: measure,
then change.

## Why (the user, 2026-09-27, verbatim)

> "what needs to be added to the engine to extract the highest quality possible elements from music to make the most
> intuitive and legible visualization that make it looked synced with the music? … additionally create a net new scene
> (slot 12) to highlight engine updates ; tune for SEE YOU DROP specifically; wait for my say before running full sweep; think"

**The user's ear on this track** (verbatim, from earlier sessions — the only music notes to design against):

> "0-13s the high rise up to their max (edge should be bumping on every beat / light oscillating off the edge); at 25s it
> really starts moving the edge on every beat" · "each beat should make the set close up (different pitches are different
> shapes); at 1:38 it goes double time -> should be moving faster / reacting more; 1:45 -> this is where the highest energy
> is, should be reacting more" · "I like the bright / glowy look, but I don't want it to be so bright that can't see the …
> shapes." · "pretty much should be deforming on every beat." · "I'm expecting every sound to generate a wave (and the wave
> color is based on musical note being played)" · "no sound -> quiet (ie. wave not generated)" · "the part that was missing
> ripples was 50s-57s … feel like there should be more skinnier waves, (vs bass fatter waves)?" · "torus2 is my favorite
> visually for how music lines up to the viz" · "I liked color tied to circle of fifths".

**Why Chladni:** a Chladni plate is sound made visible by resonance — sand on a vibrating plate gathers on the nodal lines
of the plate's eigenmode, and the figure is set by the pitch. SeeYouDrop's identity is a near-sine 808 sub on C#1 (35 Hz,
58 % of the energy); a sine is exactly what drives a clean figure. The engine now hears that sub (v0.15 "ears": pitch,
slides, purity, gate), clean kicks with sub-frame onset ages, and — in file mode — the whole track in advance (the drops
and sections before they happen). **CHLADNI exists to show those upgrades, one musical element → one visual channel.**

## The engine you build on (merged on `main` before you start — read what it says, not this summary, when they differ)

- **File mode** (`docs/HARNESS.md` "File source"): `#test&track=SeeYouDrop&at=<s>&scene=11` under `CLOCK=1` is a
  **deterministic real-track run** — the playhead is the frame clock, bit-identical run to run. **Tune on the track, not on
  `#test`.** `tools/filetrace.js` records per-frame MS columns in heard time.
- **The ears** (`assets/engine/ears/`, stage `ears`, fields in CONTRACTS Appendix A): `subHz subCents subNote subConf
  subGlide subNoteEvt subPure subGate subIn subOut tonic tonicMinor tonicConf bassReg kickEvt snareEvt hatEvt kickAge
  snareAge hatAge kickVel snareVel hatVel denK denS denH pulse lpSweep width`; heard time `heardT`.
- **The map** (file mode only, `mapOn` 1): `toDrop toBoundary buildProg mapSection mapNext mapReturn eG mapDropEvt
  mapBoundaryEvt`. Live mode: `mapOn` 0 — fall back to `dropConf` / `dropExpectedIn` / `build` / `dropEvt`.
- `docs/AUDIT-v0.15.md` (the orchestrator's ruler table of the ears in file mode) — **what the ears get right and wrong on
  this track**; design around a known miss rather than hide it.

## Targets

`assets/scenes/chladni/` (the skeleton is registered: `index.js` with `name 'chladni'`, `id 11`, `score() → 0`, `tag`,
`card`, colour `v2` alone, `cuts: 'continuous'`; keep `name`, `id`, `score`, `colour`, `card`, `cuts`, replace everything
else) — split from the start: **`index.js`** (the scene object, the MS → uniform mapping), **`sand.js`** (the particle
state: GPU ping-pong, the settle / leap / float logic's uniforms), **`shaders.js`** (plate, nodal glow, sand update, sand
draw), **`help.js`** (data only); 500 lines hard cap per module. **New `assets/math/chladni.js`** (pure, node-importable,
no DOM: the figure function, the figure table, the blend, the harmonic mix, the GLSL twin generated from the same
constants as `torus2/attractors.js` / `math/gielis.js` do) and **`tools/test_chladni.js`**. Nothing in `core/`, `engine/`,
`main.js`, `feats.js`, no other scene; import `math/{keycolour,nudge,waves,util}.js` freely, never edit them.

**You may read:** this brief · `ENGINE-CHLADNI-SESSION-PROMPT.md` (Part B is the design this brief details) ·
`docs/CONTRACTS.md` (§0, §1 in full — §1.1 ctx incl. `mkProg(vs, fs)` raw programs and `mkTarget`, §1.4 budget, §1.6
tiers, §1.9 cuts, §1.13 `help.feats`, §1.16 params, §1.17 card, the new "sync rules" subsection, Appendix A) ·
`docs/ENGINE.md` · `docs/HARNESS.md` ("Static checks", "Headless Chrome", "File source", "Bench protocol", "Params",
"Continuity monitor", "What to re-prove", "Pitfalls") · `docs/DECISIONS.md` §0, §14, §29, §36–§37 (TORUS2), §45, §47 (GIELIS:
what its rulers missed on this track), §48 (v0.15) · `docs/AUDIT-v0.14.md` §3, `docs/AUDIT-v0.15.md` ·
`docs/workers/{brief-torus2,torus2,brief-gielis,gielis,file,ears}.md` · `assets/scenes/{torus2,gielis,dust}/` (read only —
DUST is the `gl_VertexID` points model; TORUS2's `index.js` MS → uniform mapping and `motion.js` thump are the models) ·
`assets/math/*` · `assets/engine/feats.js` (read only) · `assets/engine/sources/fake.js` (read only) · `tools/truth/*`
(`SeeYouDrop.txt`, `.json`, `.sections.json` — the music, measured) · `tools/{monitor,check,scene-md5,param-smoke,montage,
lum,filetrace}.*`, `tools/accept/v0.14/{README.md,perbeat14.py}`, `tools/accept/v0.13/nav2-window.py`. Not `core/scenes.js`,
not `engine/features*.js`, not `engine/ears/` internals — `feats.js` + a `CARD.MS` eval is your instrument.

## The design (every constant a named lean at the top of its module; the user corrects leans at the first montage)

### 1. The plate and the figures (`math/chladni.js`)
`u(x, y; n, m) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy)` on the square plate `x, y ∈ [−1, 1]` (antisymmetric: u ≡ 0 at
n = m, so a figure is an ordered pair n ≠ m). **The figure table: 12 entries by the sub note's interval to `tonic`**, ordered
by just-intonation complexity (lean: Tenney height `log2(p·q)` of 1/1, 16/15, 9/8, 6/5, 5/4, 4/3, 7/5, 3/2, 8/5, 5/3, 9/5,
15/8): the simplest figures (low n + m) for unison / fifth / fourth, the busiest for the semitone / major seventh / tritone.
SeeYouDrop's walk C#1 → A1 → F#1 → E1 (intervals 0, 8, 5, 3 to C#) must be **four visibly distinct figures**.
- **Slide = morph:** the fractional pitch `s = interval + subCents/100` (continuous through a slide) blends the two
  neighbouring table entries, `u = mix(u_i, u_{i+1}, frac)` — continuous in s by construction (test it) — so every hit at
  57.6–90 s (D#1 / D1 → C#1 in ~0.3 s) visibly relaxes into the root figure.
- **Purity = harmonics:** `u += h·(w2·u(2n, 2m) + w3·u(3n, 3m))` with `h = 1 − subPure` — a sine sub gives clean lines, the
  harmonic mid-bass (0–13 s, 101–105.7 s) busy rough figures.
- `tools/test_chladni.js`: the nodal set of known figures (points on the diagonals and the analytic nodal lines of (1, 2),
  (1, 3), (2, 3)), antisymmetry, u(n, m) = −u(m, n), the blend's continuity in s (max |Δu| over a fine s sweep across every
  table boundary), the table's 12 entries distinct and ordered, the GLSL twin's constants = the JS.

### 2. The sand (`sand.js`, `shaders.js`)
Particles `ctx.budget('points')` (tiered) as positions in a float texture ping-pong (RGBA16F: x, y, z height, vz). Update
pass (a fullscreen program into the other target): a random walk with step `STEP·|u(p)|·amp` (hash noise from particle id
and frame count — **no `Math.random`**) **plus** a descent on `u²` (lean `DESC`) so ≥ 70 % of the sand is within `δ` of a
nodal line 0.4 s after a figure change (the "settle %" instrument, `hooks.settle()`: a readback of the positions → the
fraction with `|u| < δ`; cost it and call it only from harness evals). An **instant nodal-line glow** (`exp(−(u/w)²)` in
the plate pass) so a figure change reads at once while the sand re-forms. Draw: `gl_VertexID` points (DUST's model; gl.POINTS
vanish in an offset viewport on ANGLE-GL — draw full-viewport) on a plate plane seen through the scene's own camera.

### 3. The mapping — one musical element, one channel
| the music (field) | CHLADNI |
|---|---|
| sub note vs tonic (`subNote`, `subCents`, `tonic`) | the figure (the table) |
| slide (`subCents` moving; `subGlide` for its speed) | the morph between neighbouring figures |
| purity (`subPure`) | the harmonic figures mixed in |
| sub level (`sub`, `eG` in file mode) | vibration amplitude: how hard the sand dances, how bright the antinodes glow |
| gate (`subGate`, `subIn`, `subOut`) | the plate stops: the sand freezes and drops for the duck — drop 2's once-per-bar stomp |
| kick (`kickEvt`, `kickAge`, `kickVel`) | the sand leaps, higher on antinodes; height is **analytic in `kickAge`** (`z = v·a − g·a²/2`), so the leap is placed to the sub-frame |
| snare / hat (`snareEvt/Age`, `hatEvt/Age`) | a brief mid-figure flash / fine high-mode ripples on the surface — the "skinnier waves" of 50–57 s |
| register (`bassReg`) | camera elevation: sub = low, heavy, the plate fills the frame; mid-bass = high overhead, the plate small (1:38) |
| void (`subGate` 0, no sub) | the plate is silent; the sand lifts and floats; only hat ripples and a soft mid light move — "no sound → quiet" |
| anticipation (`toDrop`, `buildProg`, `mapDropEvt`) | through the void the sand spirals inward, the camera tilts with `buildProg`; on the exact drop frame it is thrown up and lands into the root figure a beat later (live fallback: `dropConf` / `dropExpectedIn` / `dropEvt`) |
| low-pass (`lpSweep`) | fog and desaturation rise — the outro dims into the root figure |
| sections (`mapSection`, `mapReturn`) | plate boundary + palette (lean: square for the sub-locked sections, circular — a Bessel `J_n(k r)·cos(nθ)` figure — for the walks); a return restores its look |
| beat grid (`beatPhase`, `pulse`) | TORUS2's small thump on the camera and a `mkNudge()` turn of the plate per felt beat |
| key / note colour | `mkAnchor()` (key on the fifths, major warm / minor cool) on `tonic` (fallback `key`); the figure's glow takes the sub note's hue |

Legibility rule (CONTRACTS "sync rules"): never feed the sub's pitch and the kick into the same knob; continuous things on
heard time (the fields already are), events placed by their `…Age`.

### 4. Params (CONTRACTS §1.16) — six, named for what the eye sees (lean)
`figure` (how complex the figures are: a shift along the table) · `sand` (how much sand) · `leap` (how high a kick throws it)
· `tilt` (camera tilt) · `glow` (nodal-line glow) · `fog` (the low-pass fog). `from(MS)` moved verbatim from `update`; the
identity proof (`paramsOf == derived`), one route moves the md5, lo/hi pairs for two of them.

## Non-negotiables
- No `Math.random()`, no wall clock — musical time or `dt` or `heardT`; constants named at the top of the module. Scenes
  import only `math/*`. Module cap 500. `check.js` 0 fail; the scene loads in node (build shader sources in `init`).
- `feats` = exactly the fields read, each with a `help.feats` clause; `score(MS) { return 0; }`; forced-only (no digit key:
  `n` cycling or `&scene=11`); `state` in the monitor's shape `{mode, cPath, pathCut: 0, kick: {x: 0}, baby: null}` (the
  plate's rotation as `cPath`).
- **`#test` never fills the new fields**: every headless md5 pins them with `&fix=` (e.g. `&fix=subNote=1,subGate=1,
  subPure=1,tonic=1,mapOn=0`); the file-mode windows are the real proof. `overlay()` / `draw()` guarded (`if (!this._S)
  return;`) — a forced scene is drawn before its first update.
- Cost: `CARD.bench(11, 300)` ≤ 1.5× `bench(3, 300)` (TORUS2), interleaved, each in its own forced page, `q` pinned .95;
  the update pass is the risk — size the tiers so tier 3 holds.
- Brightness: p95 luminance 0.6–0.8 on the groove (`tools/lum.py`), bright and glowy with the figure legible, from the start.

## Process — one commit per proven step
1. `math/chladni.js` + `tools/test_chladni.js` → the plate + nodal glow only, the figure pinned by `&fix=` (all 12 in a
   montage, `hooks.figure(i)`), `IDS=11` md5 stable over two runs. Commit.
2. Sand + settle % (`hooks.settle()` 0.4 s after a pinned figure switch ≥ 70 %). Commit.
3. Leaps on `kickAge` (a CLOCK=1 frame series around one kick in file mode: height vs `kickAge`, the onset frame). Commit.
4. Purity → gate → register camera (file-mode windows 0–13 s, 101–106 s, 105.7–112 s). Commit.
5. Void / anticipation / drop (49.9–60 s in file mode: amplitude < 5 % in the void, the spiral with `buildProg`, the slam
   on the `mapDropEvt` frame). Commit.
6. Snare / hat ripples → colour → sections → params. Commit each.
7. The nine SeeYouDrop windows (spec Part B list) in file mode, one montage each, `lum.py`, bench, the monitor,
   `docs/workers/chladni.md`. Commit.

## Acceptance (repo root; `PORT=8814`; shots in `tools/work/` prefixed `ch-`)
1. `node tools/check.js` → 0 fail; `node tools/test_chladni.js` passes.
2. `PORT=8814 GPU=1 node tools/cdp.js 'test&scene=11&fix=…' '[…]'` → ERRS `[]`, nonFinite `[]`, logical 11.
3. The nine SeeYouDrop windows (`ENGINE-CHLADNI-SESSION-PROMPT.md` Part B "acceptance windows"), each: the file-mode command,
   the per-frame numbers it is judged on, a montage, met / not met in one sentence.
4. `IDS=11 tools/scene-md5.sh ch` stable across two runs (the `&fix=` pinned lines become the v0.15 reference).
5. The scene object has `name id tag card feats cuts score init update draw post colour params help hud hooks state`.
6. Bench ≤ 1.5× TORUS2; the continuity monitor `viol []` over 60 s of file mode.

**Report** (`docs/workers/chladni.md`): brief-common (a)–(e), plus the figure table as built, every constant (name · value ·
why), the nine windows' table, the bench pairs, the md5s, and the friction for CONTRACTS (every sentence the docs lack).
