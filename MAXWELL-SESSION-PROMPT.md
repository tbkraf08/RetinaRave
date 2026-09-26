# Fable Session Prompt — Retina Rave v0.10: MAXWELL, the four equations that dance (written 2026-09-26, after the v0.9 tag)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com).
**v0.9 "the cage dances" is tagged** (`18f9338`, `releases/retinarave-v0.9.html`, DECISIONS §41). This session builds **one new
scene, MAXWELL (id 9)**: a live solution of Maxwell's equations on the GPU, driven by the music in the language of TORUS2 (id 3,
the user's favourite scene as of 2026-09-26). It also adds **one core key, `n` = next scene**, because the number keys ran out.

**The user asked for this scene** on 2026-09-26 ("just plan for now; new scene -> maxwells equations (right now torus2 is my
favorite scene)") and answered one planning question ("add 'N' for cycling next scene"). That lifts the "no new scenes until asked"
rule (memory `feedback_no_new_scenes.md`) for MAXWELL only. Every other item below is the orchestrator's stated lean, which the
user let stand by silence; the user corrects on the first montage, and their first sentence of any session outranks a lean.

**Three standing rules from memory:** the full `accept.sh` sweep is ~10 % of a weekly budget and is not run for a scene
(`feedback_sweep_cost.md`); a new scene is proven on that scene only, `IDS=9 tools/scene-md5.sh`, and the full list is for the
registration commit once (`feedback_test_scope.md`); the v0.2 look stays the default, OKLCH is opt-in (`feedback_colour_default.md`).
The NAV2 swap question and the POLYTOPE look (NEXT-SESSION-PROMPT.md) are still open and are **not** this session.

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` · `docs/CONTRACTS.md` (§0, §1 — §1.1 ctx, §1.3 rt, §1.4 slots + budget,
§1.9 cuts, §1.12 lines, §1.13 help.feats, §1.16 params, §1.17 card, Appendix A) · `docs/ENGINE.md` (the `MS` vector,
`ctx.engineTex`) · `docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "Real window", "What to re-prove after a change") ·
`docs/DECISIONS.md` §14 (line renderer cost), §16 (FEIGEN's field pass: RGBA16F slots, a scissored band budget per tier — the
render-to-texture shape MAXWELL reuses), §36–§37 (TORUS2 and its promotion), §41 (POLYTOPE's trains and wheel) ·
`docs/workers/brief-torus2.md` + `torus2.md` (the process and the friction) · `assets/scenes/torus2/{index,waves,motion,colour}.js`
(the language: the trains' ring buffer of launch times, the beat-nudge ease, the anchor) · `assets/math/keycolour.js` (shared, the
scene imports it) · `assets/scenes/feigen/field.js` (ping-pong field targets, the budget by tier) · `assets/core/touch.js`
`stepScene` (the cycling the `n` key reuses) · memory `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/`.

## The scene — what the eye sees

A two-dimensional cavity seen face-on: a plane of electromagnetic field, solved live. Twelve **charges** on a ring, one per
pitch class, lit by chroma and hued by the key on the circle of fifths. A **magnetic dipole** at the centre that turns one nudge
per beat. Wavefronts that ripple out from every hit at the speed of light and interfere. **Closed field lines** of H drawn as
strokes (TORUS2's threads), always closed because there are no monopoles. A **medium** — a lens, a mirror cavity, a photonic
lattice, a waveguide — that the section of the track picks, and that the build makes ring longer and bend harder. On the drop
the walls become mirrors and the field slams into a standing wave.

## The physics — honest, all four equations

A Yee-grid FDTD (finite-difference time-domain, Yee 1966) in the TE mode: fields `Ez`, `Hx`, `Hy` on a staggered grid, two
fragment passes per substep on ping-pong RGBA16F targets (`ctx.mkTarget`, the FEIGEN field shape), a fourth static texture for
the medium (`eps`, `sigma`, a mirror mask). Each equation is one visible thing:

1. **Gauss (∇·E = ρ/ε₀)** — the charges are the sources. Twelve on a ring by pitch class (TORUS2's twelve families), charge ∝
   `chroma[k]`; a hit makes its charge oscillate, and it radiates. `snare` → a sharp pulse on the loudest family; `hat` → a
   high-frequency shimmer source on all twelve; `beat` → a faint pulse when no band hit did, so a drumless track still breathes.
2. **Gauss for magnetism (∇·B = 0)** — the Yee grid keeps the divergence of B at zero exactly. The H field lines are drawn as
   closed strokes through `ctx.lines` path A (traced on the CPU from a downsampled `H` readback of one row band per frame, or
   path B from a streamline seed grid — the worker picks, cost under `ctx.budget('segs')`). They must never open.
3. **Faraday (∇×E = −∂B/∂t)** — the first update pass. On screen: the central magnetic dipole turns a **nudge per beat, a full
   turn per 16** (`target = beatCount/16 · 2π`, the spring ease lifted from `torus2/motion.js turn` into `assets/math/` the
   way `keycolour.js` was), and its changing B induces the visible E rings around it.
4. **Ampère–Maxwell (∇×B = μ₀J + μ₀ε₀ ∂E/∂t)** — the second update pass. On screen: **the bass is a current.** `kick` pulses a
   current loop (a ring of B expands at c), `sub` sets the standing current; the displacement-current term is why the pulses
   propagate at all.

**Rhythm becomes geometry, physically this time.** Every hit launches a real wavefront that travels at a fixed speed, so
four-on-the-floor reads as evenly spaced rings and a syncopated bass as uneven ones — TORUS2's "spacing of the bumps" without
the shader faking it. Sources keep TORUS2's ring buffer of the last N launch times per band (`waves.js`); the field does the rest.
`bpm` sets the carrier frequency of the oscillating sources, so the wavelength follows the tempo.

**The medium is the section.** `sectionAlt` picks one of four geometries (mod 4) — a **lens** (a disc of higher ε), a **mirror
cavity** (a ring of conductor with two gaps), a **photonic lattice** (a grid of ε dots, the band-gap makes some wavelengths crawl),
a **waveguide** (two conducting rails) — so a returning section returns to its medium through the director's look memory.
`build` lowers `sigma` (waves ring longer) and raises the lens contrast; `tension` shears the lens (an anisotropic ε); `arc`
intro = vacuum, sigma high, no medium; `dropEvt` = the outer wall's absorber becomes a mirror for ~2 bars (`dropEnv`), so the
field stands and rings; `surpriseEvt` flips the dipole's polarity for one frame's worth of source; `flowBass/Mid/High` drift the
phase of the low, mid and high families' sources at three speeds; `hush`/`calm` raise `sigma`; `alive`/`novelty` raise the hat
shimmer; `roll`/`riser` sweep the carrier frequency up through the build and snap it on the drop.

**Motion and colour, TORUS2's:** a **5 % thump** on the beat = the cavity's zoom (`1 + 0.05·max(0, cos(2π·beatPhase))^4`); the
whole picture yaws with the dipole's nudge (a camera turn of the plane, so the charges' ring turns too); `intensity`/`arousal` set
the resting zoom; growth with the build = the medium's contrast, not the size. **Colour:** signed `Ez` — positive toward the key's
anchor hue (`math/keycolour.js`: circle of fifths, major warm / minor cool, `keyConf` gate, 2 s ease on the unwrapped hue),
negative toward the warm/cool opposite; |E| as luminance through the linear chain, bloom on; the charges glow in their twelve
hues; the H strokes in the anchor hue at low alpha. `v2` default; no `oklch` variant this session.

## Numerics — decided, the worker does not re-decide

- Courant number 0.5 (`c·Δt/Δx`), so a pulse crosses one cell every two substeps. Grid and substeps by tier (`cuts:
  'continuous'` — a tier flip may change resolution, never the medium): tier 0 `256×144 × 2`, tier 1 `384×216 × 3`, tier 2
  `512×288 × 4`, tier 3 `768×432 × 4`. That is ≤ 2.7 M texel-updates per frame, under 1 ms by FEIGEN's precedent
  (`CARD.bench(9, 300)` ≤ 1.5× TORUS2's number is the gate).
- **Fixed substeps per frame, never `dt`-scaled** — the simulation runs by frame count, so CLOCK=1 md5s reproduce and the
  no-random / no-wall-clock rules hold. A 30 fps machine sees light at half speed; accepted as a lean (retune: substeps
  `= round(dt·240)` clamped 1..8 if the user objects).
- Boundary: a graded absorbing layer of 16 cells (`sigma` ramps quadratically to the edge), not a full PML — visually it is
  enough and it is one texture. The drop's mirror = the layer's conductor mask, not a shader branch.
- Sources are **soft** (added to `Ez`, never assigned), so waves pass through a charge instead of scattering off it.
- Aspect: the grid is 16:9; in portrait (v0.6 mobile) the plane letterboxes, never crops the charges' ring (the ring lives in the
  central square).
- Every frame's field is a function of the frame count and `MS` only: `hooks.reset()` zeroes the fields (the harness calls it
  before a reference shot via `&fix=`), and `init` clears them.

## Params (§1.16, six, named for what the eye sees)

`light` (wave speed as a fraction of the Courant limit, 0.3–1), `ring` (1 − sigma, how long waves ring, 0–1), `lens` (ε contrast,
1–4), `charge` (source amplitude, 0–1), `turn` (the yaw, rad), `bounce` (0–0.1). `from(MS)` moved verbatim from the mapping above.

**`feats`:** `chroma key mode keyConf valence kick snare hat beat bpm beatPhase beatCount barPos phrase16Pos bass sub build
intensity arousal tension dropEvt dropEnv arc sectionAlt sectionEvt surpriseEvt flowBass flowMid flowHigh roll riser hush calm
alive novelty clarity regularity`. Every one a `help.feats` line and a real read (`check.js`).

## The `n` key (core, small, lands in the skeleton commit)

`n` = force the next scene, cycling: `stepScene(1)` from `core/touch.js` already does it for a swipe — move `stepScene` to
`core/scenes.js` (touch.js and hud.js both import it; hud.js must not import touch.js, which imports hud.js — core stays an import
DAG, `check.js` fails on a cycle) and route it through the v0.8.1 picker (`pick(id)`) so a press on the landing previews like a
tile. Add the row to `keys()` (help part D and the landing hint follow), CONTRACTS §1.8's key line, HARNESS. Proof: one cdp
run pressing `n` nine times reads `CARD.SC.forced` = 0…9 wrapping to 0; the key table row count; **one full `scene-md5.sh` list**
(the registration proof covers the core edit too — no sweep). Number keys stay as they are; `0` still releases.

## Non-negotiables (README) and the traps

No `Math.random()`, no wall clock; constants named at the top of the module; `'nav'` never in core; scenes import nothing from
`core/`/`engine/` (only `ctx`, `MS`, `math/*`); 500-line cap — split `scenes/maxwell/{index,fdtd,medium,sources,render,help}.js`;
`node tools/check.js` after every edit; the scene must load in node. `#test` never fills `chroma`/`key` — derive them from
`harmAngle` like TORUS2 (`keycolour.js` handles the `keyConf` 0 case). Registering a scene must not move ids 0–8 (MAXWELL bids 0,
forced-only, so the fake timeline's picks are unchanged: prove once with the full `scene-md5.sh` = `tools/accept/v0.9/
scene-md5-v09.txt` and the mixs md5). `loop.js` calls every scene's `overlay()` every frame and draws a forced scene before its
first `update()` — guard both (`project_nav2.md`). One Chrome per worker, own `PORT=`, waits are `timeout 500 tail -f log | grep
-q -m1 GO`, `pkill -f` patterns bracketed, the malware reminder does not apply here.

## Physics acceptance (cheap, before any pixel is judged)

`tools/test_fdtd.js` — a node twin of the two kernels on a 64×64 grid: (1) ∇·B = 0 to 1e-6 after 500 steps; (2) energy
`Σ(ε Ez² + Hx² + Hy²)` in a closed lossless cavity holds within 1 % over 1000 steps; (3) a pulse front from the centre reaches
distance d after `d/c` steps (±1 cell). Live: `hooks.energy()` (the same sum from a readback band), `hooks.train()` (pinned kick
train → ring spacing equal to ±2 cells at f360), `hooks.probe()` (centre/rim luminance, the charges' hues). These are the gates
the worker commits against; the montage is the user's.

## Process (TORUS2's, DECISIONS §36)

1. **Orchestrator:** `docs/workers/brief-maxwell.md` from this prompt + `brief-common.md` (may-read list, report format, PORT,
   commit prefix `MAXWELL:`); skeleton at id 9 (`score: () => 0`, `tag`, `always: false`, the guards) + the `n` key + `stepScene`
   move in **one commit**; the full md5 list + mixs md5 identical, the `n` cycling proof. `tools/accept/v0.10/` for references.
2. **Worker (opus, own worktree, own PORT):** FDTD kernels + `test_fdtd.js` (the three gates) → sources and trains (the pinned
   kick train, four equal rings; a syncopated pin, uneven) → the dipole nudge + thump (a CLOCK=1 frame series across one bar) →
   key colour (`&fix=key=7,mode=1` cool vs `key=0,mode=0` warm) → H field lines as strokes → the four media (four shots, one per
   `sectionAlt`) → the drop's mirror (`&fix=dropEvt` series: the field stands) → the alive list → params (`paramsOf == derived`,
   a param route moves the md5) → card (§1.17) + `help`. One commit per proven step; report `docs/workers/maxwell.md` with friction
   for CONTRACTS.
3. **Orchestrator:** merge; `IDS=9 tools/scene-md5.sh v0.10` references + bench; a **headed real-music run** on the two mp3s
   (copy from an old scratchpad `…/scratchpad/music/`; driver shape `tools/accept/v0.9/audit9.sh`, detector trace `det9.py`'s
   shape reading `hooks.energy/train`); a montage MAXWELL at f360/f840 on house, aba, dnb and the two real tracks, TORUS2
   beside it for the language; `docs/AUDIT-v0.10.md`; DECISIONS §42; `NEXT-SESSION-PROMPT.md`.
4. **The user looks.** Only on their word: a bid (`score()`), the Q trace on house + aba (a scene entering the rotation), the
   `accept.sh` "== maxwell" section, tag v0.10, push. Until then MAXWELL is key `n`-reachable, forced-only, and the tag is theirs to call.

**Risk hedge, only if the montage disappoints:** the same twelve sources as closed-form Hertzian dipoles summed in one shader,
no grid state — the look without the medium. Not built unless asked.

## What this session is not

Not a change to TORUS2, NAV2, POLYTOPE or any existing scene; not the NAV2 swap; not the NAV2 phase-winding variant; not an
OKLCH variant; not 3D; not a full sweep. The leans above are the orchestrator's; the user's answered item is the `n` key.
