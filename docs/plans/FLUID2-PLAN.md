# FLUID2 plan — the bands as different kinds of coupling; point sources and time explored (2026-10-10)

Planned against main at e1830f9 (v0.36, live). A Fable worker builds it step by step, one worker-session per step, one commit per
step, every claim measured on the seven library tracks (DECISIONS §109: the fake timeline is a smoke test), per-track numbers never an
average, Malicious for the record only. No tag, no push — the user tags.

## 1. The ask

The user, 2026-10-10, verbatim: **"clone fluid -> do work in fluid2 -> do the different bands intuitively; explore: point sources and time"**.

It follows the user's question *"what are different grammars that can show sound in fluid? (besides the splat we are doing now?); can
subbass/bass/mid/highs/vocals all be treated differently intuitively?"* and the orchestrator's answer, which the user acted on: sound can
enter a Stam solver in five places — **point sources** (the splat, and its unused variants: a line stroke, a dipole that launches a vortex
pair which travels on its own, a sustained emitter whose position drifts with pitch), **body forces** (the shockwave ring is the first;
gravity / buoyancy, shear, rotation, radial breathing — free as uniforms on the advect pass), **material parameters** (dissipation,
vorticity confinement, radius — global today, could be per band or spatially masked), **time** (dt, freezing, substeps, the reversal) and
**display** (pressure as brightness, curl as hue, the dye height as a lit normal, velocity as streaks).

**The frame — each band gets a different KIND of coupling, not the same splat at another size:**

| band | kind | what it does to the pool | where it enters the solver |
|---|---|---|---|
| sub | a **field** | the whole pool heaves with the sub envelope; gravity flips; (time breathes — §S6) | a shaped body force / a swirl uniform on the velocity advect pass — never a dot |
| bass / kick | **mass** | the splats as now, plus each kick launches something that travels (the user's validated taste) | the splat pass: dipole / stroke / jet variants |
| mids | **material** | dense mids tighten the curls, thin mids go laminar; the snare is a jet; chords as §108 | `curl` (vorticity confinement) from the mid level; the snare's splat shape |
| highs | **surface** | sparkle (hat2 as now), small-scale velocity noise, a dip in dye dissipation that sharpens trails, specular light on the ink | a hashed noise term on the advect pass; `dyeDiss`; the show pass (display only) |
| vocals | a **pen** | a continuous emitter following pitch, brightness = presence, leaving a stroke the fluid carries off | the splat pass with a drifting position — needs a vocal-presence feature the engine does not have (§3) |

The user's scope words — *explore: point sources and time* — make those two axes exploratory: build the variants, strip them per track,
let the number and then the eye choose. The band mapping is the frame the variants sit in.

Memory rules that bind: one scene at a time; the double time accents, it does not drive; a look remark is a retune request; no new
scenes unasked (this one IS asked, 2026-10-10); reactive over predicted (never `pred*`); tune and prove on all seven tracks; no
advection on the roster scenes; credit where due (nothing new to credit — the solver's §104 lineage; the dipole / stroke ideas are
classical, Stam 1999 / Harris 2004 already cited).

## 2. The architecture — one pool, two grammars, the scene card names its grammar

**Where the grammar lives today.** `core/fluid/inject.js` `plan(S, dt, st)` is pure: MS → `{splats[k-tagged], body, params, ring, …}`;
`core/fluid/fluid.js` owns ONE state (`st = mkState()`), calls `plan()` once per step (`stepFluid(dt, S, resumed)`, loop.js:39, before
any scene updates) and applies the result. The scene `scenes/fluid/index.js` only reads the dye (`ctx.engineTex.dye`) and adds the
sparkle through `ctx.fluid.splat`. `loop.js` already imports `SC` and `REG` (it iterates `SCENES` and reads `SC.cur / SC.next`), and
`fluid.js` imports nothing from `scenes.js` (no cycle to create).

**The three options, settled:**

| option | FLUID + roster pixel-identical? | the switch deterministic? | item 2 (the reversal) still buildable in inject.js? | cost |
|---|---|---|---|---|
| **A. a grammar selector on the substrate** — `inject2.js` beside `inject.js`, the scene card names its grammar, `fluid.js` dispatches | yes — the default grammar path is byte-identical (inject.js untouched at S0–S6) | yes — the owner is a function of `SC` | yes — `plan2` calls `plan()` inside it, so whatever item 2 adds to `plan()` / `fluid.js` reaches both grammars | one `if`, one state field |
| B. a scene-owned plan hook (`scene.fluid.plan(S, dt)` called by the step) | yes | yes | no — the scene's hook would have to re-implement the clear / shockwave / key pin, or reach into core state (a scene must not import `core/fluid`, check.js) | the §111 logic duplicated in a scene folder |
| C. FLUID2 owns a second solver instance | yes | the two pools are different pictures — the FLUID → FLUID2 fade crosses two pools (a visible cut in the medium) | yes | the step ×2 (0.7 → 1.4 ms at tier 3: over the ≤ 1.0 ms budget); VRAM +9 MB at tier 3 (dye 1035×512 RGBA16F ×2 ping-pong is 8.5 MB — the VRAM is not the real cost, the ms and the cut are) |

**Decision: A.** The recommendation, and the reason: the grammar is the core's (CONTRACTS §1.4 "slots, not patches": the scene declares
a slot, the core serves it), the §111 machinery (the ranks, the key pin, the confirmed clear, the shockwave, the noise guard, the harmonic
branch, the ink governor) must not be duplicated, and item 2 must land once and reach both.

**The mechanism (S0 builds it):**

- `assets/core/fluid/inject2.js` — pure, same module interface as `inject.js` (`export { plan, mkState, K, FLUID_FEATS }` — so
  `tools/fluid-tracks.js`'s `INJECT=` env already replays it, and `fluid-replay.js` gains the same env). Internally
  `plan(S, dt, st)` calls inject.js's `plan(S, dt, st.base)` first, then edits the result by kind (`k`): removes the kinds it replaces,
  appends its own (new kinds: `'heave'` is a field not a splat; `'dip'`, `'stroke'`, `'jet'`, `'pen'`), rewrites `params`, adds the new
  return fields (`swirl`, `noise`, `dtSim`, `curlMask`, `spec`). `FLUID_FEATS` of inject2 = inject's list ∪ its own reads (check.js
  enforces per file; S0 generalises the fluid block to both files, main.js's boot check too).
- **One state, shared.** `fluid.js` keeps its one `st` (inject.js's `mkState()`); for grammar 2 it holds `st2 = { base: st, …inject2's own }`
  — `st.base` IS the same object. So the key pin, the rank buffers, the clear's refractory, the shockwave's countdown, the ink ema and
  the `midRing` keep running across a scene switch in both directions (plan() runs inside plan2 every frame FLUID2 owns the pool; the
  pool grammar's state is warm the frame a roster scene takes the pool back). Grammar 2's own state (dipole timers, the pen's position,
  the noise seed phase, `dtSim`'s ease) starts cold on the first FLUID2 frame — every one of them is a transient or eases from its
  neutral value (`dtSim` from 1), so the switch is not a cut.
- **The owner.** `loop.js:39` becomes `stepFluid(dt, S, ENGINE.resumed, grammarOf(SC))` with `grammarOf = (SC) => REG[SC.next >= 0 ?
  SC.next : SC.cur].scene.fluid?.grammar || 'pool'` — the INCOMING scene takes the pool on the crossfade's first frame (so the pool is
  already in its grammar when it is fully visible); a forced scene (`&scene=13`, key `n`) is `SC.cur` the moment `goScene` lands it.
  `fluid.js` dispatches on the name: `'pool'` → `plan` on `st`; `'bands'` → inject2's `plan` on `st2`. The scene card's slot: `fluid: {
  grammar: 'bands' }` on FLUID2; FLUID has none (`'pool'`). `CARD.fluid.grammar` reports the live name; `benchFluid(n, S, ring, grammar)`
  benches either. Optional (cheap, harness only): `&grammar=bands` forces grammar 2 under any scene for a one-shot A/B on scene 12's
  windows; not required — `&scene=13` is the recipe.
- **What happens to the pool at FLUID → FLUID2.** The dye and the velocity are carried (one pool, no reset, no copy); the grammar changes
  on the frame the fade begins; the base state is warm. **FLUID2 → anything:** the pool grammar resumes with the same warm base state.
  Determinism: the owner depends only on `SC`, which the harness forces; nothing reads a wall clock.
- **What item 2 needs from this.** The reversal's freeze and the ring-of-frames live in `fluid.js` + `plan()`; the precedence rule written
  now so item 2 does not have to reopen this: **a `dtSim` of 0 from the base (the freeze) wins over any grammar-2 `dtSim`** — `fluid.js`
  multiplies `base.dtSim × grammar2.dtSim` and the base is 1 until item 2 lands. S6 (time) must not build a freeze or a replay.
- **The proof that the switch is free (S0's gate):** inject.js unchanged, the roster's 174 real-md5 lines and FLUID's 58 unchanged, the fake
  26 unchanged; FLUID2's 58 new lines **hash-for-hash equal to FLUID's 58** (same show pass, `plan2` a pass-through at S0) — the one
  commit on which the clone is byte-identical to its parent.

**Registration touchpoints (S0, all of them):** `assets/scenes/fluid2/{index.js, shaders.js (a copy — it diverges at S4), help.js}`;
`main.js` the import + the list (thirteen scenes); `name: 'fluid2', id: 13, cuts: 'continuous', always: false, score() → 0` (forced-only:
`&scene=13`, the `n` key; NOT on the bid unless asked — `tools/test_director.js` untouched); **no `card`** at S0 (the landing's `TILES 10`
unchanged; a tile when the user asks); `feats` = FLUID's five own reads (`loudRel, loudRange, loudAbs, hat2, presence` — not the four
`the bid:` fields); `post` as FLUID's (`fb.advect 1` — the one other scene allowed to ride the current, by the same opt-in); CONTRACTS §1.8's
table (**13 fluid2**), §1.4 the `fluid.grammar` slot; `site/about.html` the scenes list; `help.js` part B lists the active grammar's reads
(data); `tools/scene-md5.sh`'s `IDS` grep finds `id: 13` on its own (the fake reference gains a pair, as §106 appended s12's); `real-md5.sh` /
`real-rulers.sh` take `SCENES=13`.

## 3. The feature inventory per band — what exists, what is missing, what a thin one costs

Every read of a grammar must be in its `FLUID_FEATS` (check.js FAILS on a read outside it). The engine's vocabulary (feats.js,
ears/feats.js, features-synapse.js) per band:

| band | exists (field · source · rate) | missing for the mapping | a thin new feature would cost |
|---|---|---|---|
| **sub** | `sub` (25–60 Hz, fast, synapse) · `subGate / subNote / subHz / subGlide / subCents / subPure / subIn / subOut / bassReg` (ears, heard time) · `bassS` (40–150, .5 s) · `subAge` (the grammar's own) | nothing — a sub ENVELOPE is `sub` eased in the grammar (τ a tenth of a beat: inertia the look needs, said so per §1.18) | — |
| **bass / kick** | `kickEvt / kickAmp / kickAge` (ears) · `kick / kick2` (levels) · `bass` (20–150 AGC) · `bassFast` · `denK` · `pulse` (the felt beat ×½ / 1 / 2) · the grammar's `rkK` rank, `rkB` (the slam's rank) | nothing | — |
| **mids** | `mid` (150–2000 Hz, pow .7 · presence, AGC) · `midS` (300–2500, slow) · `snare / snareEvt / snareAmp / denS` · `chord` (the grammar's own §108 rise) · `clarity` · `centroid` · `rough / rLo / rHi` (the §81 roughness ruler) · `tension` · the grammar's `midRing` (30 s own-range p20 / p80) | nothing — "mid energy on the track's own range" is §111 item 7's `own`, already in `st.base` | — |
| **highs** | `high` (2–12 kHz AGC) · `highS` (5–16 kHz slow) · `highM` (3 s) · `hat / hat2 / hatEvt / hatAge / denH` · `lpSweep` (the 5–12 k roll-off) · `dirty` (flatness) | an **"air" band above 8 kHz** does not exist (`highS` 5–16 k is the nearest; `hatEvt` is a 5–12 k flux peak) — S4 uses `highS` for the light and says so | a `Band(8–16k).slow` in features-synapse.js: additive, one line, a fake-timeline default, a `FEATS` entry; parity untouched (the parity set is the 72 v3 fields); no md5 moves until a scene reads it. ~half a session WITH the ruler. **Not needed for S4** |
| **vocals** | **nothing** — no vocal-presence, harmonicity-in-the-formant-band or pitch-continuity feature. Nearest proxies: `mid · clarity · (1 − dirty)` with `centroid` mid-range; the harmonic branch (`st.subAge > HARM_BARS` bars — "a piano, a pad, a vocal breakdown"); the §108 floor IS "the mids are singing" today. The tongues (`tongue*`) are rhythm descriptors, not voice | **a vocal presence** | a new ears stage: a harmonic-to-noise ratio in 200–3000 Hz on the PCM bus with pitch continuity over ~100 ms (the classical HNR / pitched-ness test), `voxS` as a level; a hand-marked vocal window on IBelongHere + WhoLikesToParty as the `test_music` ruler. Additive (parity untouched), md5 unmoved until read. **One full session**, the extractor's, not this plan's — S5 defers it |
| **stereo** | `width` (ears: RMS side / mid, .35 s) — unused by the grammar | — | — (free: a pen or a field can lean on it) |
| **time** | `bpm / beatPhase / beatCount` (the PCM clock) · `buildLive` (the live build detector, causal) · `dropLiveIn` (beats to the next bar line while armed — a CLOCK prediction, item 2's arming cue: **not read by S6**) · `nextBeatIn` · `arc` · `hush / calm` · the grammar's `latched` void, `clearLeft` | nothing | — |

Finding: **no new extractor feature is needed for S1–S4 and S6.** The one band the engine cannot hear as a band is the voice; S5 is
conditional on it (§4 S5).

## 4. The steps — one worker-session each

Common to every step: the worker reads DECISIONS §104, §107, §109, §111, §113–§115, this plan, inject.js, inject2.js, fluid.js,
shaders.js; builds in a worktree off main (symlink `tools/work/fluid-tracks` and `tools/truth/traces` from main's checkout — both are
git-excluded, the traces are not in a fresh worktree); never pushes. The gates per step (§8 has the full set): `node tools/check.js` 0 fail
(the fluid block on both inject files), `npm test` exit 0 (test_fluid gains a `bands` block per step: determinism of `plan2` — two fresh
`st2` → identical JSON over 600 frames; the Proxy MS that throws on a read outside inject2's list; the step's own claim), the fake smoke
`tools/scene-md5.sh` (the 26 v035 lines + s12's pair unmoved, **only s13's pair moves**), and the per-track replay table
`INJECT=assets/core/fluid/inject2.js node tools/fluid-tracks.js` (the existing columns + the step's new column). The full real-music
proof (SCENES=12 unmoved, SCENES=13 twice cmp-equal, 717 s each) at S0 and S7; the roster's 174 (1440 s) at S7.

### S0 — the clone and the switch (pixel-identical to FLUID on the first commit)

- **Files:** `assets/scenes/fluid2/{index.js, shaders.js, help.js}` (FLUID's, with `name 'fluid2'`, `id 13`, `fluid: { grammar: 'bands' }`,
  `score() → 0`, no `card`, the five feats, the help text saying what FLUID2 is — "the same pool, a different grammar: each band a
  different kind of coupling"); `assets/core/fluid/inject2.js` (the pass-through: `plan2 = (S, dt, st) => plan(S, dt, st.base)` plus the
  empty extension points, `mkState2 = () => ({ base: null })`, `K2 = {}`, `FLUID_FEATS2 = [...FLUID_FEATS]`); `fluid.js` (the two
  states, the dispatch, `FLUID.grammar`, `FLUID.K2`, `benchFluid`'s grammar arg); `loop.js:39` (the owner); `main.js` (the import, the list,
  the boot check on both lists); `tools/check.js` (the fluid block over both files); `tools/fluid-replay.js` (`INJECT=`); `tools/test_fluid.js`
  (`bands` block: the pass-through returns `plan()`'s JSON to the byte on 600 synthetic frames; the shared state is the same object);
  docs: CONTRACTS §1.4 (the slot), §1.8 (13 fluid2); HARNESS "## Fluid" (the grammar name, `SCENES=13`); `site/about.html`.
- **K constants:** none new.
- **The measured claim:** the switch is free. `SCENES="12 13" tools/real-md5.sh s0a` / `s0b` (78 runs ×2): s12's 58 lines = `real-md5-v036.txt`;
  **s13's 58 lines = s12's 58, hash for hash**, cmp-equal twice; the fake `tools/scene-md5.sh s0`: 26 = v035 + s13's pair = s12's pair
  (f360 / f840 `13e9acae` / `85cd3023`-class equality); `&fluid=0` list = `scene-md5-v035-fluid0.txt` + s13's idle pair = s12's. The
  continuity monitor on scene 13 (`CARD.NAV=CARD.REG[13].scene.state`, 60 s real time on SeeYouDrop at=25): viol []. The crossfade
  12 → 13 and 13 → 0 under `&trans=mixs` at f178: errs [], and a 0.1 s strip across the 12 → 13 fade on SeeYouDrop's groove (at=25, keyed on
  `__FRAME`): the whole-frame grey continuous (no step > the §1.9 rule — 2.5 × the last step + 0.01 on the grey mean).
- **Gates:** as common; plus `node tools/releases.js check` untouched (no entry), `help.feats gaps 0`, landing `TILES 10`.
- **Commit:** `§116 S0 FLUID2 (id 13) — the clone and the grammar switch; pixel-identical to FLUID (s13 = s12 on 58 / 58 + the fake pair)`.

### S1 — sub = a field

The sub is never a dot in FLUID2: the §104 emitter's splat (`k: 'sub'`) is removed from the list and the sub enters as a FIELD. The void's
behaviour (§111 item 4: `VOID_FLOOR`, the latch) stays the base's; the sub's x (`st.base.xSub`) keeps being computed by `plan()` (the kick
still lifts from under it).

- **Variants (the exploration, each a K switch, strip them all):**
  (a) **the heave** — a shaped vertical body force on the existing `uBody` channel: `body += HEAVE · (subEnv − subSlow) · g`, `subEnv` =
  `sub` eased τ `SUB_TAU` (a tenth of a beat), `subSlow` its 2 s ema — the pool heaves with the sub's envelope, centre down / edges up
  (the §104 profile; a UNIFORM vertical force is a pressure gradient the projection removes — §104's lesson, so it rides the shaped channel);
  (b) **the gravity flip** — the heave's sign by bar parity (`beatCount >> 2 & 1`) or by `subGlide`'s sign (a rising bass lifts, a
  falling one sinks) — two sub-variants;
  (c) **the swirl** — a solid-body rotation `F = SWIRL · subEnv · g · (−(y − ½), (x − ½)·aspect)` as a new uniform `uSwirl` on the velocity
  advect pass (curl 2ω: the projection keeps the bulk of it in a closed box, only the walls' normal component goes) — the whole pool turns
  with the sub, the direction by the bar parity so it does not wind up;
  (d) **the mouth kept as ink only** — the sub emitter's DYE without its velocity (the ink still enters at the bass note's place on the tonic
  axis so the pool is not colourless on a sub-only passage; dx = dy = 0) — a sub-variant that can combine with (a)–(c).
- **K2:** `HEAVE` (uv/s² per unit envelope; start 1.0 — the breath's `BODY` .35 is the ruler, the heave must read beside it, not over it),
  `SUB_TAU` .04 s, `SUB_SLOW` 2 s, `FLIP` 0 / 1 / 2 (none / bar / glide), `SWIRL` 0 / 0.8 (1/s), `SUB_INK` 0 / 1.
- **Files:** inject2.js; shaders.js ADVECT (`uSwirl` — a uniform branch, `0` the identical path: the roster's identity proof rests on it,
  as the ring's does); fluid.js (the uniform); test_fluid (the sub splat absent in grammar 2; the heave's sign per variant; a sub-only frame
  gives no velocity splat).
- **The measured claim:** the pool MOVES with the sub and the ink does not thin. Numbers per track × variant: (1) **the pool's mean speed**
  from a `&fluiddbg=2` shot (the velocity drawn as 0.5 + v: PIL's mean |c − 0.5| over the frame — a crude Σ|v|, but one number per shot;
  the same ruler on grammar 1's shot is the control) at the survey's windows; (2) the replay table's Σ|dv| and ink/s (the governor's factor
  must not rise — the sub's ink is the same or less); (3) the sub's **coverage** (the seconds the sub band is up that the pool visibly
  moves: mean speed above the control's p10) — the user's "coverage + dynamics" rule; (4) the §1.9 grey step on 31 s strips (no jump at
  a flip).
- **Per-track strip recipe:** `SCENE=13 tools/work/fluid-s111/shots.sh <track> s1-<variant> "<the survey's windows>"` with `K2='{"FLIP":1}'`
  etc. (the strip tools gain `SCENE=` and `K2=` — the latter sets `CARD.fluid.K2` from an eval after `__FRAME>=1`, exactly as `K=` sets
  `CARD.fluid.K` today); the two 31 s strips (SeeYouDrop's groove, CyborgNinja's busiest) per variant; the velocity shots beside the dye
  shots.
- **Decision rule:** the variant whose mean speed tracks the sub envelope best (the correlation of the per-shot speed with `sub` over the
  31 s strip, ≥ the control's) at ≤ the control's ink/s, then the eye on the montage (`tools/accept/v0.37/fluid2-s1-<track>.jpg`, rows =
  variants). Ship one default; the others stay as K switches for the user's remark.
- **Commit:** `§116 S1 FLUID2 the sub as a field — the heave / the flip / the swirl, the emitter's dot gone (per-track table)`.

### S2 — bass = mass; the kick launches something that travels (the point-source exploration)

The kick stays an impulse from the floor under the sub (`k: 'kick'`, the §111 rank, the sqrt law) — that IS a dipole after the projection:
a Gaussian upward impulse becomes a counter-rotating vortex pair that self-propels. What decides how far it travels is the impulse's
shape in time and space, so the variants are shapes, at the SAME total momentum (Σ dy · area over the hit's frames = the control's):

- **Variants:** (a) **control** — the one-frame impulse + the 40 % tail (§104/§111); (b) **the jet** — the same momentum spread over
  `JET_N` frames (3–5) at `(xSub, 0.06)` (a longer push rolls up a tighter pair); (c) **the stroke** — the splat's y rises with the kick's
  heard age (`y = 0.06 + STROKE_L · min(1, kickAge / STROKE_T)`) over `STROKE_T` (a tenth of a beat), a line source drawn upward — the
  "line stroke" the user asked after; (d) **the true dipole** — two splats `(xSub ∓ DIP_D, 0.06)` with velocities `(±DIP_V·sz, +KICK_V·√sz)`
  (the pair's sideways components opposite so the roll-up is seeded, the lift shared) — launches a pair whose spacing is `DIP_D`; (e) **the
  local ring** — a small radial puff round the kick's place: needs `uRing` to take a CENTRE (a `vec2` uniform added, `(0.5, 0.5)` the
  identical path for the shockwave) — one uniform, no draw; the puff `r 0 → RING_K·beat` in `KICK_T` beats, `w` .03. The shockwave's set-
  semantics would stamp the velocity near the floor every kick; measure whether it interferes with the pair (it may — record, do not fix).
- **K2:** `JET_N` 4, `STROKE_L` .25, `STROKE_T` .05 s, `DIP_D` .03, `DIP_V` .3, `KPUFF_A` .4, `KPUFF_T` .25 beats, `KICK_SHAPE` 0–4 (the
  selector). `kickAge` is already in the list (an age-placed motion, §1.18's kind).
- **Files:** inject2.js; shaders.js (`uRingC` centre — only for (e)); fluid.js; test_fluid (momentum equality across shapes within 1 %;
  the stroke's y monotone in age; a dipole's two splats mirror in dx).
- **The measured claim — TRAVEL:** per kick, the **ink front's height** above the kick's place at +½ beat and +1 beat: from the `&fluiddbg=1`
  dye shots (PIL: in the column `xSub ± 0.05` the highest row whose luminance exceeds the pre-kick row value + 10), on 8 kicks per track
  (the groove window, both map modes — the live lanes first). Also: **does it keep its shape** — the blob's width at +1 beat (the row
  extent above the threshold) — a pair that travels stays compact, a smeared push widens. Per track × shape, p50 of the 8.
- **Per-track strip recipe:** `SCENE=13 K2='{"KICK_SHAPE":2}' tools/work/fluid-s111/shots.sh <track> s2-stroke "k1:<t> k1h:<t+½b> k1b:<t+b> …"` —
  the eight kick times per track from the trace (`fluid-replay.js … events` lists every `kickEvt` frame); SeeYouDrop's groove kicks first
  (the reference), then the six; the beat per track from the trace's `bpm` (SeeYouDrop .4 s, Vienna .667, WhoLikesToParty .51).
- **Decision rule:** the shape with the greatest p50 travel at +1 beat that keeps its width ≤ 1.5 × the control's, at the control's ink/s
  (the governor's factor within .1) — a number first; then the eye on the montage (rows = shapes, columns = +0 / +½ / +1 beat).
  TORUS2's rule as the taste ruler: a hit launches something that travels at beat speed.
- **Commit:** `§116 S2 FLUID2 the kick as mass that travels — jet / stroke / dipole / puff at one momentum, the travel per track`.

### S3 — mids = material

- **What:** (a) **vorticity confinement from the mids** — `params.curl = CURL0 + CURL_MID · own`, `own` the §111 item 7 own-range position
  of `mid` in the track's last 30 s (`st.base.midRing` — read, not duplicated) — dense mids tighten the curls, thin mids go laminar; the
  base's `10 + 40·tension` is the control; (b) **a spatial mask** on the confinement — `uCurlMask` a y-profile uniform (a band at mid height,
  `CURL_Y0 / CURL_Y1`) so the curls live where the mids' ink is (the §108 floor enters at mid height) — a uniform on the vort pass, free;
  (c) **the snare as a jet** — in place of the two mid-height shears at (0.3, 0.5) / (0.7, 0.5): one jet from a wall, `(0.02, 0.5, +SNARE_V·sz)`
  alternating walls by snare count, spread over `JET_N` frames (S2's jet shape) — a stroke that crosses; a variant keeps the pair; (d) chords
  as §108 (the chord shears — untouched, `k: 'chord'` kept).
- **K2:** `CURL0` 10, `CURL_MID` 40, `CURL_Y0` .3, `CURL_Y1` .7, `CURL_MASK` 0 / 1, `SNARE_JET` 0 / 1.
- **Files:** inject2.js; shaders.js VORT (`uCurlMask` — a uniform branch, `(0, 1)` the identical path); fluid.js; test_fluid (curl rises
  with `mid`'s own-range; the jet alternates walls; the chord splats unchanged).
- **The measured claim:** the TEXTURE follows the mids. The number: the velocity's **small-scale energy** — on the `&fluiddbg=2` shot the
  mean |Laplacian| of the velocity image (PIL: a 3×3 Laplacian, mean abs) at the survey's windows: dense-mid windows (SeeYouDrop's build-100,
  CyborgNinja's busiest) must read above thin-mid ones (Comptine's piano, IBelongHere's breakdown) by a margin the control does not show;
  per track. The snare jet: its travel (S2's ruler, horizontal) and whether the snare still reads as the snare (the eye).
- **Decision rule:** the mask on if the dense / thin margin grows with it; the jet if its travel ≥ the pair's shear reach and the eye
  prefers it; else the pair stays.
- **Commit:** `§116 S3 FLUID2 the mids as material — confinement from the mid band's own range, the mask, the snare jet`.

### S4 — highs = surface (never a force on the mass)

- **What:** (a) the sparkle — the scene's own (as FLUID's, unchanged); (b) **small-scale velocity noise** — `uNoise · hash(texel, uSeed)`
  added on the velocity advect pass, amplitude `NOISE_V · high · g`, the seed from the step count (`FLUID.steps` — deterministic under
  CLOCK=1 from `at=0`; **never** `Math.random`); grain, not force: the amplitude is bounded so the pool's mean speed does not move (the S1
  ruler as the guard); (c) **the dissipation dip** — `dyeDiss × (1 − HI_SHARP · high)` (bounded .3): sharper trails while the highs are up;
  (d) **specular from the highs** — FLUID2's show pass: `SPEC = SPEC0 + SPEC_HI · highS`, the exponent `48 → 48 + 80 · highS` (a tighter
  highlight on bright highs) — display only, no pool change; "air above 8 kHz = light only" is served by `highS` (5–16 kHz) and said so
  (§3: no 8 k band exists).
- **K2:** `NOISE_V` .02, `HI_SHARP` .3, `SPEC0` .6, `SPEC_HI` .5, `SPEC_POW` 80. FLUID2's `feats` gains `high, highS` with help lines (the show
  pass reads `highS`; the grammar reads `high` — `FLUID_FEATS2` gains it).
- **Files:** inject2.js; shaders.js ADVECT (`uNoise`, `uSeed` — `0` the identical path); scenes/fluid2/{index.js, shaders.js, help.js};
  test_fluid (noise 0 on `high` 0; the dip bounded; determinism with the noise on — the seed is the state's).
- **The measured claim:** the surface changes, the mass does not: on the hat-dense windows (CyborgNinja 79–109 s, WhoLikesToParty's
  double-time) the S3 Laplacian ruler rises and the S1 mean speed does not (±10 % of the control); the dye's **edge sharpness** (PIL: the
  mean gradient magnitude of the dye shot) rises with the dip on; the trails' length at +1 beat unchanged. Per track, both map modes.
- **Decision rule:** `NOISE_V` at the largest value whose mean-speed delta stays ≤ 10 %; the dip on if the sharpness rises and the ink/s
  does not; the specular by the eye (it is light).
- **Commit:** `§116 S4 FLUID2 the highs as surface — hashed grain on the velocity, the dissipation dip, specular from the highs`.

### S5 — vocals = the pen (conditional)

§3's finding: the engine has no vocal-presence feature; a thin one does not exist (a harmonic-to-noise ratio with pitch continuity is one
extractor session with its own ruler). **The pen's FEATURE is deferred; the pen's MECHANICS are built** so the feature is a one-line hook:

- **S5a (this plan, half a session):** a continuous emitter with a drifting position — x from the harmony's centre (`st.base.hx / hy`: the
  §111 fifths centre, eased 15 s — a PITCH-like axis the engine has), y from `centroid`, presence = `mid · clarity · (1 − dirty)` through a
  knee (`PEN_LO / PEN_HI` on the track's own range, the §111 `own` method), ink only or ink + a small velocity along its drift (`k: 'pen'`);
  it REPLACES §108's floor (`k: 'floor'` removed) in grammar 2 — the floor was a fixed cloud at the tonic's x; the pen is the same ink
  budget as a stroke that moves. The stroke the fluid carries off IS the §105 advection — nothing to build.
- **K2:** `PEN_DYE` .004 (the floor's), `PEN_V` .02, `PEN_LO` .15, `PEN_HI` .4, `PEN_TAU` .3 s (the position's ease).
- **The measured claim:** the pen's x span per track (the replay table's "x sub span" column for `k: 'pen'`) and the floor's ink/s equality
  (the pen's ink/s = the floor's within 10 %, so the governor does not move); on the pad take (`tools/rec-strip.sh`) the pen reads where the
  floor read (the §108 strip's "it heard that one" ruler stays green: no second of sound with 0 splats).
- **S5b (deferred, out of this plan):** `voxS` in the ears (§3's cost); the hook is `presence = voxS` in place of the proxy. Record in
  DECISIONS §116 that the pen draws the HARMONY today, not the voice, and say so in help.js (the user must not read it as a vocal detector).
- **Commit:** `§116 S5 FLUID2 the pen — a drifting emitter on the harmony's centre in place of the floor; the vocal feature deferred (cost stated)`.

### S6 — time (the exploration; freeze and replay are item 2's — not built here)

The solver's clock, not the grammar's: `dtSim` is a multiplier `fluid.js` applies to `uDt` on the **vort and advect passes only** (the
splat impulses, the per-frame emitters' `×60·dt`, the key evidence, the refractories, the clear's countdown and the shockwave's front all
stay on the grammar's dt — musical time). Determinism: `dtSim` is a function of MS and the state only.

- **Variants:** (a) **dt breathes with the sub** — `dtSim = 1 + DT_SUB · (subEnv − subSlow)` (bounded .6–1.6): the pool's time quickens on
  the sub's attack and slackens in its tail; (b) **the breakdown slowdown** — `dtSim → DT_VOID` (.5) as the LATCHED void deepens
  (`st.base`'s `latched` + `voidT`, eased `DT_TAU` 1 s — a real build's void, not a piano crescendo), back to 1 on the confirmed clear
  (eased over `DT_TAU`, so no §1.9 jump — the ring must not run at half time: the ring's front is grammar time, which is right, but its
  SET into a half-time field is measured); (c) **the drop's double-step** — two solver substeps per frame for the clear's beat (`clearLeft >
  0`): the real thing (cost ×2 for ~0.4 s, bounded — measured as a burst in the bench, `benchFluid` with `clearLeft` held) against the cheap
  stand-in `dtSim 2` (semi-Lagrangian is unconditionally stable; the compressible ring term at `2·dt` is bounded in the shader, check it
  cannot go negative — `1 − dv·dt` with dv < 0 only grows; the positive branch is `1/(1 + dv·dt)`): measure both, ship the cheaper if the
  centre grey at +0.4 s agrees within 10 %.
- **K2:** `DT_SUB` .4, `DT_VOID` .5, `DT_TAU` 1 s, `DT_DROP` 0 / 1 / 2 (none / substep / ×2), the bounds `DT_MIN` .5, `DT_MAX` 2.
- **Files:** inject2.js (`dtSim` returned), fluid.js (the multiplier; the substep loop — the passes from curl to the dye advect twice,
  the splats once), test_fluid (`dtSim` 1 on a neutral frame; the bounds; eased, never a step > `DT_TAU`'s slope).
- **Touchpoints with item 2 (said, not built):** item 2's freeze = `dtSim 0` from the base with the solver's injection masked; the precedence
  rule in §2; the reversal's arming reads `dropLiveIn` — **S6 does not read it** (`FLUID_FEATS2` must not list it, so the future item has
  the field to itself). The display lead (CONTRACTS §1.18): a `dtSim` change moves no event's placement — the events are the grammar's;
  nothing here adds an offset.
- **The measured claim:** per track, the **mean speed vs time** on the 31 s strips (S1's ruler) with (a) on: its modulation depth follows
  the sub envelope (the correlation ≥ the S1 result's); (b): the speed in the latched void (SeeYouDrop 52–57 s, Vienna's dream) reads ≤
  .6 × the groove's, back within one beat of the clear; (c): the centre grey at +0.4 s per confirmed drop (the §113 table's eleven drops,
  both variants) and the bench burst. The §1.9 grey step on every strip; `real-rulers` jump viol [] on FLUID2's eight rows.
- **Decision rule:** (a) and (b) ship if the §1.9 rule holds on all eight rulers and the eye reads "the pool breathes" rather than
  "the framerate wobbles" (the montage at 0.1 s cannot judge this — the user's eye in track time decides; say so); (c) by the 10 % rule.
- **Commit:** `§116 S6 FLUID2 time — the solver's clock breathes with the sub, slows in the void, doubles on the drop; freeze left to item 2`.

### S7 — the seven-track tune, the gates, the montages, the docs (no tag)

- The replay table over all seven tracks × both modes + the pad with every S1–S6 default on (`INJECT=inject2.js`), beside grammar 1's
  (the §111 `before.md` method): coverage per band, ink/s + the governor, Σ|dv|, void / syrup %, clears / shockwaves (must equal grammar
  1's — the clear is the base's), the pen's x span, the kick's travel p50, the mean speed p50 / p90, the Laplacian p50 at dense / thin
  windows. Retune K2 where a track reads outside the others' band (the §111 rule: a change on ≥ 3 of the six, Malicious never a gate).
- The committed montages `tools/accept/v0.37/fluid2-s116-<Track>-{windows,strip}.jpg` (grammar 1 row above grammar 2 row, the survey's
  windows) and the per-step variant montages from S1, S2, S6.
- The full gates (§8). The docs: DECISIONS §116 (the ask verbatim, the frame, the architecture and why, the feature finding, each step's
  per-track table, the variants and which shipped and why, the bench per tier, the pitfalls paid, what the user validates at home, the
  open list — item 2's touchpoints, the vocal feature's cost, the 8 k band), CONTRACTS §1.4 (the slot, the precedence rule for `dtSim`),
  §1.8 (13), §1.18 (one line: a grammar's clock vs the solver's), HARNESS "## Fluid" (`SCENE=`, `K2=`, `INJECT=` on both replay tools,
  the travel / speed / Laplacian rulers as scripts under `tools/`), help.js (FLUID2's feats lines; part B's grammar line),
  NEXT-SESSION-PROMPT (the post-build truth), FLUID-DROP-SESSION-PROMPT (one line: item 2's precedence over `dtSim`). No `releases.json`
  entry, no version bump: the user tags.

## 5. The A/B recipes and the decision rules, per exploratory variant

| variant (step) | the strip | the number | the decision rule |
|---|---|---|---|
| heave / flip / swirl (S1) | the survey's windows + the two 31 s strips, `&fluiddbg=2` beside `=1` | pool mean speed (|c − .5| mean of the velocity shot); its correlation with `sub` over the strip; ink/s | best correlation at ≤ the control's ink/s; then the eye |
| jet / stroke / dipole / puff (S2) | 8 kicks per track at +0 / +½ / +1 beat, `&fluiddbg=1` | the ink front's height above xSub (travel); the blob's width | max p50 travel with width ≤ 1.5× control, governor within .1; then the eye |
| confinement from mids / mask / snare jet (S3) | dense vs thin windows per track, `&fluiddbg=2` | mean |Laplacian| of the velocity image; the jet's horizontal travel | the dense / thin margin ≥ the control's and growing with the mask; then the eye |
| grain / dip / specular (S4) | hat-dense windows, `&fluiddbg=1` and the composite | mean speed delta ≤ 10 %; the dye's mean gradient magnitude; ink/s | the largest `NOISE_V` under the 10 % guard; the dip if sharpness rises at equal ink/s; specular by eye |
| the pen (S5a) | the pad take through `rec-strip.sh`; the survey's windows | the pen's x span; its ink/s = the floor's ± 10 %; 0 silent-with-sound seconds | ship if the §108 ruler stays green |
| dt breath / void slowdown / drop double (S6) | the 31 s strips; the void windows; the eleven confirmed drops (the §113 strip recipe on scene 13) | mean speed vs sub; the void's speed ratio; the centre grey at +0.4 s; the §1.9 grey step; the bench burst | the §1.9 rule on all eight rulers; the 10 % rule on the drop; the user's eye on the breathing |

Every number is per track, both map modes (the live lanes first — the design target since §113), never an average across tracks.
Every A/B is one deterministic run per variant on the same frames (`CLOCK=1 GPU=1`, `at=0`, keyed on `__FRAME`, `frame0` 2, nothing else
on the GPU), the variant chosen by `K2=` so the run differs in one knob.

## 6. Budgets

The substrate's budget is **≤ 1.0 ms at tier 3, ≤ 0.4 ms at tier 0** (HARNESS "## Fluid"); the honest pre-change numbers are §113's:
0.67–0.72 ms median at tier 3 under the desktop's load (ratio 0.43–0.46 against NAV), 0.35 ms at tier 0 on the phone canvas with the ring.
The grammar's CPU (`plan` + `plan2`, ~0.15 ms) is inside the step's `ms`.

| addition | kind | ms at tier 3 (expected) | VRAM | the measure |
|---|---|---|---|---|
| S0 the dispatch | one `if`, one state | 0 | 0 | the bench pair unchanged (±0.03) |
| S1 heave (uBody) | an existing uniform | 0 | 0 | — |
| S1 swirl (`uSwirl`) | a uniform branch on ADVECT | ≈ 0 (the ring measured ±0.03 for the same kind) | 0 | `benchFluid(300, null, 'bands')` with `SWIRL` held |
| S2 jet / stroke / dipole | 1–2 more splats per kick frame (one draw per 16 — the queue rarely passes 8) | ≈ 0 | 0 | the bench on the groove MS |
| S2 puff (`uRingC`) | a `vec2` uniform | ≈ 0 | 0 | — |
| S3 curl from mids | a parameter | 0 | 0 | — |
| S3 mask (`uCurlMask`) | a uniform branch on VORT (sim res, cheap) | ≈ 0 | 0 | — |
| S4 grain (`uNoise`, a hash per texel) | a term on ADVECT, both passes' size (259×128 + 1035×512 texels) — the first real per-texel cost | **≤ 0.05** (the hash is a `sin`; measure, and gate the dye pass out of it — the noise is velocity only) | 0 | the bench with `NOISE_V` held |
| S4 dip, specular | a parameter; the scene's show pass (FLUID's 0.41 ms, ratio .30) | 0 / unchanged | 0 | `CARD.bench(13, 300)` ≤ 0.5 (FLUID's budget) |
| S5 the pen | one splat per frame (the floor's today) | 0 | 0 | — |
| S6 dtSim | a uniform value | 0 | 0 | — |
| S6 the substep | **a second curl → advect chain for the clear's beat** (≈ 25 of the 29 draws) | **+0.6–0.7 for ~0.4 s per drop** (a burst, not the median) | 0 | `benchFluid` with `clearLeft` held = the burst's cost; the median over a track unchanged |
| item 2 (not here) | the ring of dye frames | its own budget (FLUID-DROP item 2) | ~68 MB at half dye res RGBA16F ×64 — item 2's decision | — |

**The ink budget** (`INK_BUDGET` 14 area-weighted dye/s, `INK_TAU` 12 s) governs grammar 2 over ITS final splat list: `plan2` sums its
own `ink` and keeps its own ema (`st2.inkRate`) and derives `dyeDiss` from the base's void part × `max(1, st2.inkRate / INK_BUDGET)` — the
base's own factor divided out (or a 3-line `govern()` export from inject.js — the builder's call; an export moves no md5, `test_fluid`'s
determinism block proves it). The claim per step: the governor's factor per track within .1 of grammar 1's (the table's column) — a band's
new coupling must not buy its look with ink.

## 7. Pitfalls carried from §104–§115 that bite here

- **A scene's `ctx.fluid.splat` lands on the NEXT step** (the step precedes `update()`); the grammar's splats land on their frame. FLUID2's
  sparkle is a scene splat (one frame late, as FLUID's); everything in S1–S6 is the grammar's.
- **A scene's write to `ctx.fluid.params` is overwritten** by the step before any pass reads it (§106 deviation 2) — the mid-band curl (S3)
  and the dip (S4) are `plan2`'s, not the scene's.
- **The display lead** (CONTRACTS §1.18: file 40 ms / live 0, the events placed on heard time by the engine): read events on their frame,
  ages for placement (`kickAge` for the stroke), never an offset of your own.
- **`at=` mid-track whose first frame carries a map line** fires the clear AND the ring on frame 1 (§107's `at=80`, §113's two moved groove
  lines) — the strips run `at=0` (the whole track, keyed on `__FRAME`) as `fluid-drop-strip.sh` does.
- **The live detector's 32 s warm-up** — a live drop shot from mid-track (`at=40`) arms nothing; `at=0`, `&map=0`.
- **The §111 state needs its own warm-up:** the `midRing` (5 one-second means before `own` is anything but 1), the rank buffers (8 hits
  before the track's own p10 / p90), the key pin (`KEY_EV0` .5 of evidence) — all in `st.base`, warm across a scene switch; a FLUID2 ruler
  taken in a track's first 10 s measures the priors, not the track.
- **A whole-track `'*'` trace overflows `filetrace.js`'s chunk cap** (25.6 of 40.5 MB on WhoLikesToParty) — trace the field subset (`FLUID_FEATS2`
  + the survey's), as §113 did.
- **`tools/truth/traces` and `tools/work/fluid-tracks` are git-excluded** — a worktree has neither; symlink them from main's checkout before
  the first replay.
- **A builder waiting on the continuity monitor stalls** — poll with a bash loop (`until grep -q viol out.txt; do sleep 5; done`), never a
  foreground wait on the monitor's own exit.
- **`frame0` must read 2** in the first eval; a shared GPU moves it (md5 runs and strips never in parallel on one machine; `PAR=2` is two
  scene lanes of one tool, not two tools).
- **The fake `#test` timeline has no drop and sets `hat` to exactly 0.5** — a rising-edge threshold under 0.5; the fake proves nothing about
  the clear, the shockwave, or S6's drop variants (real tracks only).
- **`Math.random` nowhere; `Date.now` nowhere** — S4's grain hashes on `FLUID.steps` (deterministic from `at=0`) and the frame's MS; the
  demo synths are random, so `fake=0` runs are not bit-identical (judge the fake on `#test`).
- **The uniform-branch identity:** every new uniform's neutral value (`0`, `(0, 1)`, `(0.5, 0.5)`) must be the byte-identical program path —
  the roster's 174 lines and FLUID's 58 rest on it, as the ring's `A = 0` does; a `mix(…, 0.)` is NOT identical to no mix on every driver —
  branch on the uniform (`if (uX > 0.)`), as `uRing` does.
- **One PORT per lane;** two Chrome lanes on one `PORT=` share the debug port (§115).
- **The 16-splat chunk:** more than 16 splats in a frame is a second draw per target — the S2 dipole + S5 pen + hats can reach 10–12; fine,
  but the bench on a dense frame says so.
- **The `K` objects:** `FLUIDK=` reaches inject.js's `K` (the base's constants, which `plan2` inherits through `plan()`); `K2=` / `FLUIDK2=`
  reach inject2's. A knob A/B names the right one.

## 8. The gates at the end, the docs owed, what the user validates at home

**Gates (S7, each with its wall time in §116):** `node tools/check.js` 0 fail (both inject files in the fluid block; `help.feats gaps 0`);
`npm test` exit 0 (`test_fluid` with the `bands` blocks, `test_music`, `test_director` untouched); `SCENES=12 tools/real-md5.sh` **58 / 58 =
`real-md5-v036.txt`** (FLUID unmoved by six steps of grammar 2 — the switch is free, proven at the end as at S0); `SCENES=13 tools/real-md5.sh`
twice, cmp-equal (the new reference `tools/accept/v0.37/real-md5-v037.txt` = v036's 232 lines + s13's 58); `SCENES="0 1 3" PAR=2
tools/real-md5.sh` **174 / 174** (every new uniform's neutral path, 1440 s); `SCENES=13 tools/real-rulers.sh` **8 / 8 ok** — jump viol [],
mon viol [], black 0, clip25 0 (the new reference `real-rulers-v037.txt` = v036's rows + FLUID2's eight); the fake `tools/scene-md5.sh`
26 / 26 = v035 + s12's pair unmoved + s13's pair (its own new line); `&fluid=0` = `scene-md5-v035-fluid0.txt` + s13's idle pair; parity
fake (ACC v0.37) max 7.852214593751443 / 72 fields / the §102 `nav.*` line to the digit; the bench — three interleaved pairs per grammar at
tier 3 (q .95) and tier 0 (`MOBILE=1`), the S6 burst, with `uptime` beside them; `CARD.bench(13, 300)` ≤ 0.5; the continuity monitor 60 s on
scene 13 viol []; the crossfade 12 → 13 → 0 errs [] with the grey strip across the fade; `license.js --check` 0 without the header (every new
file carries it); the bundle from `file://` `&scene=13` errs [] bad []; `help` rows unchanged in count except FLUID2's own, the credit
sentence present on 13's page.

**Docs owed:** DECISIONS §116 (§4 S7 lists it), CONTRACTS §1.4 / §1.8 / §1.18, HARNESS "## Fluid", help.js, NEXT-SESSION-PROMPT.md,
FLUID-DROP-SESSION-PROMPT.md (the precedence line), THIRD-PARTY.md untouched (nothing vendored), `site/about.html` the scenes list.
`releases.json` and the version: untouched — the release prompt (the §91 ritual) is the user's word.

**What the user validates at home (every remark in track time is a retune request):** (1) `#scene=13` on SeeYouDrop's groove (0:35) and
build (1:30–1:45): does the pool heave with the sub and do the kicks send something travelling (S1, S2) — the references
`tools/accept/v0.37/fluid2-s116-SeeYouDrop-windows.jpg` and the S2 montage; (2) CyborgNinja 1:19–1:49 and WhoLikesToParty's double-time:
the texture tightens with the mids, the grain on the hats, and the pool does not pack (the §111 ruler: seconds above grey 60 = 0); (3)
Comptine and IBelongHere's breakdown: the pen draws the harmony and the void slows the pool (S5a, S6b) — and whether "time breathing" reads
as the music or as a framerate wobble (the eye alone decides this; the montage cannot); (4) the four dropping tracks' drops on scene 13:
the clear + the shockwave as in FLUID, with the double-step (S6c); (5) the switch itself: `n` from FLUID to FLUID2 mid-groove — the pool
must not blink. What the user is NOT asked to judge yet: FLUID2 on the bid (not built — on the user's word), a landing tile (none), the vocal
pen as a voice (it is the harmony until S5b).

**Open at the end of this plan (carried, not hidden):** the vocal-presence feature (S5b, one extractor session); the 8 k "air" band (not
needed); item 2's reversal (its own prompt; the `dtSim` precedence written for it); the idle bench still unseen on this machine; §115's own
open list (the `DROP_DISS` 6 knob after item 2, IBelongHere's late live return, Vienna's bar 40, the director's per-track sweep).
