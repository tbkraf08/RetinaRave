# Fable Session Prompt — Retina Rave v0.14: GIELIS, the superformula nest that breathes with the music (written 2026-09-27, after the v0.13 tag)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com —
push only on the user's word). **v0.13 is tagged and pushed.** This session builds **one new scene, GIELIS (id 10, "slot 11")**,
a from-scratch scene on the Gielis superformula, designed on **TORUS2's music-to-visual model** (id 3, the user's favourite
"visually for how music lines up to the viz") and tuned on **`~/Music/RetinaRave/SeeYouDrop.flac`** (Ray Volpe, 150 BPM, G♯ minor
from 20 s). Nothing else changes: no other scene's pixels move.

**The user asked for this scene** on 2026-09-27 ("goal new scene (slot 11); use 'see you drop' as the inspiration for the scene …
how can we use the superformula to visualize music?"). That lifts the standing "no new scenes until asked" rule (memory
`feedback_no_new_scenes.md`) for GIELIS only — not for NEWTON or anything else.

**Two corrections the user made the same day, which outrank the repo's own words:**
1. **NAV2 v0.13 is NOT validated.** "I wouldn't say nav2 validated. (I'm just taking a break tuning it)". `NEXT-SESSION-PROMPT.md`,
   DECISIONS §46's closing addendum and the last commit message say "validated" — they are wrong; fix the sentence in
   `NEXT-SESSION-PROMPT.md` (and add a one-line addendum to §46) in this session's first housekeeping commit. NAV2's *mechanics*
   (`beat.js` press, roots, `K_R`, `V_INT`, the running-peak bump) are **not** a proven model and are **not copied** into GIELIS.
   Only the user's **music descriptions** from the NAV2 sessions carry over (quoted below). Do not touch NAV2 (id 8, key `9`).
2. **TORUS2 is the reference mapping.** "torus2 is my favorite visually for how music lines up to the viz". GIELIS speaks TORUS2's
   language: twelve pitch classes as twelve visible things, hits launching events that travel at a musical speed, a thump on the
   beat, a nudge per beat, key on the circle of fifths with major warm / minor cool, section picks the morph target, drop = collapse
   and rebound, everything on the musical clock, `cuts: 'continuous'`, no running-peak normalisation.

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` (correct its NAV2 sentence, see above) · `docs/CONTRACTS.md` (§0, §1 the
scene object — §1.1 ctx, §1.2 palette, §1.4 post/budget, §1.6 tiers, §1.9 cuts, §1.12 lines path B, §1.13 `help.feats`, §1.14
OKLCH, §1.16 params, §1.17 the card thumbnail, **Appendix A** — every MS field, generated from `assets/engine/feats.js`) ·
`docs/ENGINE.md` (the `MS` vector kinds) · `docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "Q trace", "Real window",
"Params", "Pitfalls", the continuity monitor at ~433–440) · `docs/DECISIONS.md` **§36 TORUS2** (the leans that stood, the five user
answers), §37 (promoted as built), §29 (params, FEIGEN's process), §14 (line renderer cost 0.4 µs/segment), §45 (thin waves / fat
waves, the breakdown rule — the user's ear on this track), §46 (NAV2: read only the **user quotes** and the *measuring* lessons in
AUDIT-v0.13 §8: a montage cannot judge a per-beat pinch; measure per frame) · **`assets/scenes/torus2/`** whole (979 lines:
`index.js` 345 — the MS → uniform mapping is the model; `waves.js` 105 — the launch ring buffer you will lift; `shaders.js` 239 —
`waves()` at ~117–124, flash/shimmer ~203–205; `motion.js`, `attractors.js`, `help.js`, `colour.js`) · `assets/math/keycolour.js`
(`mkAnchor()`: key anchor on the fifths, warm/cool PULL, keyConf gate, eased hue — import it, do not re-derive it) ·
`assets/math/nudge.js` (`mkNudge()`: the per-caller nudge spring — import it) · `docs/workers/brief-torus2.md` + `torus2.md`
(the worker's 16 friction items — the same traps wait here: 6 % amplitude invisible → 0.26; every band needs displacement AND
pulse; `#test` hat is exactly 0.5; warm/cool is a pull not an offset; `paramDeps` misses short-circuits) · `docs/workers/brief-nav2.md`
(the **template shape** of a full brief: Why verbatim / Targets / You may read / `#test` / The design / Non-negotiables / Process /
Acceptance / Report) + `brief-common.md` · `assets/main.js` (registration: an import + the name in the `for (const scene of [...])`
list at ~57; `id` 10 is the next free — CONTRACTS ~268) · `assets/core/hud.js` ~67 + `help.js` ~35 (digit keys stop at 9: id 10 is
reached by `n` cycling or `&scene=10`; the user accepts this) · `tools/check.js` (WARN 350 / FAIL 500 lines per module, the
scene may import only `math/*`, MS field literals only in scenes, every feat needs a `help.feats` line, colour default must be a
variant) · `tools/accept/v0.13/README.md` + `nav2-window.py` (`OUT= T0= N= KEY= DT= SHOT= MIN=` — the real-track window replay; it
takes `KEY=`, so for id 10 use a `{key:'n'}` step chain or `&scene=10`: check its args and extend it, don't fork it) ·
`tools/accept/v0.12/audit12.sh` · memory notes `~/.claude/projects/-home-toma-Documents-Kraftek-RetinaRave/memory/{project_eigenwobble,
project_music_library,feedback_colour_default,feedback_no_new_scenes}.md`.

## The user's ear (verbatim, the only music notes to design against)

On SeeYouDrop, from the NAV2 sessions (`docs/AUDIT-v0.13.md` §1,3,4,6,7,8 headers; `NAV2-BEAT-SESSION-PROMPT.md:16–26`):

> "no beat == more of a circle (some variation), as the beat happens it spirals in showing the complexity … The edge of the set
> should always be moving with the music."
> "25s-1m03s set should be bumping in some way with each beat (as beat evolves the set should come back to a slightly different
> shape) … also is a little too bright (detail is getting washed out)"
> "this song is an example of the extreme; 0-13s the high rise up to their max (edge should be bumping on every beat / light
> oscillating off the edge); at 25s it really starts moving the edge on every beat"
> "each beat should make the set close up (different pitches are different shapes); at 1:38 it goes double time -> should be moving
> faster / reacting more; 1:45 -> this is where the highest energy is, should be reacting more"
> "When I say breathing with the music I [mean] that the beat causes the set (ie. black circle in the middle) collapses into
> interesting shapes, then the silence rebounds to the circle … there are some interesting shapes being generated but still seems
> all the same … why does different sounds look so similar?"
> "I like the bright / glowy look, but I don't want it to be so bright that can't see the … shapes."
> "pretty much should be deforming on every beat."

From the MAXWELL sessions (`docs/AUDIT-v0.12.md:3–8, 201–202`, DECISIONS §45):

> "I'm expecting every sound to generate a wave (and the wave color is based on musical note being played)"
> "no sound -> quiet (ie. wave not generated)"
> "the part that was missing ripples was 50s-57s … feel like there should be more skinnier waves, (vs bass fatter waves)?"

From TORUS2 (DECISIONS §36/§37, AUDIT-v0.9:4): "I liked color tied to circle of fifths"; "torus2 looks good, promote it."

**The track, as measured (TRACK time; probe D lines run ≈ 2 s later):** 0–13 s intro, highs rising, engine `kick` only 0.1–0.3 ·
~19 s the build's wind · 25 s–1:03 groove, `bass` 0.6–1.0, `eS` 0.80–0.95 · **49/50.5–58 s breakdown: `kick` 0 for six seconds,
`bass` .04, `hat` .57, mids/highs loud** · **drop 1 ≈ 55–58 s** (`dropEvt`, `arc` → peak) · 59–61 s double-time fill (onsets 2.1×) ·
1:33–1:41 the energy peak, 1:38 double time (hit interval 0.17–0.23 s) · **drop 2 = 1:45 (105.9 s), `dropStrength` 1.0**. Only two
`dropEvt`s on the track, 47 s apart. Files: `docs/AUDIT-v0.12.md:179–197`, `docs/AUDIT-v0.13.md:114–135, 210–216`.

## The interview (2026-09-27) — five answers, everything else a lean

**Answered by the user:** (1) renderer = **3D supershape nest as strokes**, TORUS2's lineage · (2) species = **interval-to-key
ratios** · (3) **section morph on the lobe lean is in** · (4) **id 10, reached by `n` / `&scene=10`, no digit key, forced-only until
approved; the folder and card are `GIELIS`** · (5) acceptance windows on SeeYouDrop = intro 0–13 s, groove 25–63 s, breakdown
49–58 s, double time 1:38, drop 1:45, per-beat rulers on the n1 swing and the wave spacing. **Leans (state each in the brief as a
lean; the user corrects on the first montage):** every constant below; the fallback species `m = k + 3`; the drop as collapse-and-
rebound only (no 2D → 3D lift); TORUS2's numbers as the starting values wherever the same thing is meant (`WAVE0` 0.26, `BOUNCE`
0.05 thump, `FLASHT` 0.25 s, `SHIM` 0.55, `GLOW` 0.18, `FIBMIN/FIBMAX` 6/12, `MORPHTC` 1.0 s, `HUETC` 0.7 s).

## The superformula

```
r(φ) = ( |cos(m φ / 4) / a|^n2 + |sin(m φ / 4) / b|^n3 )^(−1 / n1)          (Gielis 2003)
```

`m` = the lobe count (integer closes in one turn; rational p/q closes after q turns with p lobes) · `n1` = pinch: n1 → ∞ is a
circle whatever the rest, small n1 is a star · `n2, n3` = the lean of the lobes (unequal = lopsided) · `a, b` = axis stretch. A 3D
supershape is the spherical product of two curves: `P(θ, φ) = ( r1(θ) cos θ · r2(φ) cos φ,  r1(θ) sin θ · r2(φ) cos φ,  r2(φ) sin φ )`,
θ ∈ (−π, π], φ ∈ [−π/2, π/2]. Put it in `assets/math/gielis.js` (pure, node-importable, `test_gielis.js` beside it: the circle
limit, the p/q closure, a known star's Q) with a generated GLSL twin as `attractors.js` does. **Green's Q** = 4πA/L² of the
equatorial curve, sampled at 512 φ on the CPU per frame, is the roundness ruler (`Q` 1.0 = circle) — cheap here, exact, and it is
the only instrument that made the user's "collapse / rebound" sentences testable on NAV2.

## The spec — what GIELIS must do (the worker reads this through its brief)

1. **The nest: twelve pitch classes, twelve supershapes.** Family k (pitch class) is one nested supershape drawn as rings of strokes
   (latitude rings of the spherical product, path B through `ctx.lines`, budget by `ctx.tier()` as TORUS2 does — `budget('segs')`
   does not apply to path B, torus2.md item 8). Its **size and brightness follow `chroma[k]`** the way TORUS2's latitude and
   brightness do (`index.js:159–177`): the loudest family is the outermost and brightest, quiet ones nest inside; blend the
   circle-of-fifths fallback from `harmAngle` so `#test` and silence still have a nest. A brightness floor (no family below ~0.18 of
   the loudest) and a capped fog, as TORUS2 spec 1. **`kick` flashes the quiet inner families** (max-hold follower, 0.25 s decay);
   **`hat` shimmers along every ring** (the SHIMK 24 ripple in the ring parameter).
2. **The species: m from the interval to the key.** Family k's lobe count is its interval above the key root (`(k − key) mod 12`)
   as a **just-intonation ratio**: 0 → 1/1 · 1 → 16/15 · 2 → 9/8 · 3 → 6/5 · 4 → 5/4 · 5 → 4/3 · 6 → 7/5 · 7 → 3/2 · 8 → 8/5 · 9 → 5/3 ·
   10 → 9/5 · 11 → 15/8, scaled so the root reads as a clean low lobe count (lean: `m = 4 · p/q`, so the root is a rounded
   square, the fifth is six lobes over two turns, the tritone 28 lobes over five). Consonant families are simple, dissonant ones
   are starry and take turns to close — **"different pitches are different shapes"** by construction, and the shape logic agrees
   with the hue logic (both on the key). `keyConf` gates it exactly as `keycolour.js` gates the hue: below 0.3 hold the last
   confident key; the `#test` fallback key is the nearest fifth of `harmAngle`. A key change eases m over ~2 s (a rational m does
   not interpolate cleanly — cross-fade the two radii, never lerp m). Fallback if the ratios read as noise on the montage: `m = k + 3`.
3. **The breath: n1 pinches on every beat.** `n1` sits at a rest value near the circle (lean `N1_REST` 12) and on each beat drops
   toward a pinch (lean `N1_BEAT` 1.5) with **TORUS2's thump** envelope `max(0, cos 2π·beatPhase)^4` — read off `beatPhase` /
   `beatCount`, the engine's grid, never the kick detector (which reads 0.1–0.3 in this intro and misses a third of the beats).
   Depth of the pinch scales with `eS` (0.5 + 0.5·eS) so 25 s presses harder than 0–13 s, 1:38–1:45 hardest; a hit (`kick`) in
   the same beat adds `HIT_K` on top, so the beat deforms, the hit deforms more. `sub` fattens `a, b` (the bass body); the groove's
   `build`/`tension` go to the **lean (n2 ≠ n3, a ≠ b)**, never to n1 — the wind must not floor the breath (the NAV2 pass 8 trap).
   Acceptance ruler: per frame at `DT=16`, `Q` of the loudest family swings ≥ 0.15 on ≥ 90 % of the beats in 25–63 s, and the
   rest between beats returns to `Q ≥ 0.9`; in 50.5–57 s (no kick) the beat-grid thump keeps pinching but shallower (the `eS`
   scaling) and the hat ripples carry the edge.
4. **Waves on the rings: every sound a wave.** Lift `torus2/waves.js` to **`assets/math/waves.js` as `mkWaves()`** — a per-caller
   factory (the trap `nudge.js` and `keycolour.js` closed: module-level `AT/AM/W/PREV` would make TORUS2's launches and GIELIS's the
   same buffers) — and make `torus2/waves.js` a thin wrapper; **TORUS2's pixels must not move** (`IDS=3 tools/scene-md5.sh` before
   and after, identical). Then, as TORUS2: rising edges in kick / snare / hat launch a bump running round every ring at one ring
   per bar, gaussian widths `WAVEW [0.05, 0.017, 0.008]`, both displacement and pulse, 2-beat decay, 8-beat life; kick on every
   family fat and slow, snare on the loudest family sharp, hat tiny everywhere; the `beat` event's faint wave when nothing hit. The
   rhythm reads as bump spacing; 1:38 doubles the density. **Silence is quiet:** `presence`/`hush` gate the floor, no carrier.
   Wave hue = the launching family's hue (the note), as MAXWELL was validated to do.
5. **Motion: nudge, thump, growth.** `mkNudge()` from `math/nudge.js` yaws the nest 1/16 turn per beat about its centroid (`hush`/
   `calm` slow the spring). The 5 % bounce is a second thump on the camera distance, as TORUS2 (`motion.js:36–38`). Growth: `build`
   0→0.5 raises the drawn family count 6→12 (fractional fade of the newest, `uFibF`), 0.5→1 brings the camera in; `intensity`/
   `arousal` set the resting size; fill ≤ 85 % of the short edge, never crops in portrait. `flowBass/Mid/High` advance the low /
   mid / high families' ring phase at three speeds.
6. **Section and drop.** `sectionAlt mod 4` picks a **lean template** — four (n2, n3, a, b) tuples (lean: `round` (2,2,1,1) ·
   `petal` (1,4,1,1) · `blade` (4,1,1,1.3) · `shard` (0.6,0.6,1,1)) — cross-faded over `MORPHTC` 1 s, the amount `morph = 0.9 ·
   tension · (arc idle ? 0 : 1)`, exactly TORUS2's attractor rule with a tuple in place of a flow field; a returning section
   returns to its template. `dropEvt` → collapse (all n1 to the pinch, the nest to 0.4 size) for one beat, rebound on the
   `dropEnv` gain ×1.6; `surpriseEvt` → a one-frame twist of the tumble within bounds; `riser`/`roll` → the rings unwind toward
   helices through the build and snap back on the drop. Both of this track's drops (58 s, 1:45) must read; there is no refractory
   to tune because there is no cut.
7. **Colour.** `mkAnchor()` from `math/keycolour.js`: key on the fifths, major warm / minor cool by pull, `keyConf` gate, `HUETC`
   ease; the twelve families spread `0.3 + 0.45·mood.spread` centred on the anchor; `valence` warmth on top. Colour slot `{ default:
   'v2', variants: { v2: {} } }` (memory `feedback_colour_default.md`; OKLCH is a later opt-in). **Bright but legible:** the
   luminance knee the user asked for on NAV2 — glow peaks kept, the stroke's core never above the tonemapper's knee so the lobes
   read; prove with `lum.py`/`sat13.py` p95 in 0.6–0.8 on the groove.

**Params (§1.16), six, named for what the eye sees:** `breath` (n1 depth 0–1) · `wave` (kick-wave amplitude 0–0.4) · `turn`
(yaw, rad) · `size` (camera fill 0.4–0.9) · `lean` (morph 0–1) · `glow` (floor 0–0.5). `from(MS)` moved verbatim from the
mapping above; the identity proof `paramsOf == derived`; a param route moves the md5.

**`feats`** — exactly the fields read: `chroma harmAngle key mode keyConf valence beat beatPhase beatCount bpm barPos phrase16Pos
kick snare hat sub bass eS build tension intensity arousal arc sectionAlt sectionEvt dropEvt dropEnv surpriseEvt riser roll
flowBass flowMid flowHigh presence hush calm alive novelty clarity regularity` (the last two only in `score()` → a `the bid:` line).
Every one a `help.feats` clause naming what it moves; `check.js` fails on a gap and warns on a phantom.

## Non-negotiables (README) and the traps

- No `Math.random()`, no wall clock; everything on `beatCount + beatPhase`; a constant is a manual setting shown as one; `'nav'`
  never in core; the scene imports only `math/*` (never `torus2/`); modules ≤ 500 lines (split `index.js` / `shaders.js` /
  `nest.js` / `help.js` from the start); `node tools/check.js` after every edit; the scene must load in node.
- `#test` never fills `chroma` or `key`: blend from `harmAngle` and take the nearest fifth as the key while `keyConf` is 0, so the
  headless montage has a nest and the md5s are deterministic. `#test` hat is exactly 0.5 — thresholds below it.
- **No other scene's pixels move:** `tools/scene-md5.sh` on ids 0–9 before and after (registration once changed the director's
  first pick — DECISIONS §15; GIELIS bids 0 until approved), the `waves.js` lift proven on `IDS=3` alone first, the mixs md5 unchanged.
- Line renderer cost 0.4 µs/segment (§14): tier tables in the scene; Q trace `none` on house/aba with GIELIS not forced; forced
  GIELIS `q ≥ 0.6` at tier 3 (`CARD.bench(10, 300)` ≤ 1.5× TORUS2's).
- Continuity monitor: `cuts: 'continuous'` and a `state` path; the thump on n1 is fast but it is the beat's own length, so it must
  not trip the spike rule (d > 0.06 AND 2.5× the last step) — expose `state` and let the monitor say so.
- Measuring: a 1 s montage cannot see a per-beat pinch (AUDIT-v0.13 §8) — the acceptance instrument is a **per-frame Q trace**
  (`DT=16 SHOT=0 MIN=1`), a per-beat table (a `perbeat14.py` after `perbeat13.py`'s shape, on Q and the wave count), then shots.
  Probe time ≠ track time (≈ +2 s); one Chrome per worker, own `PORT=`, waits by `timeout 500 tail -f log | grep -q -m1 GO`,
  tab-capture runs sequential, never pipe `det*.py` into `head`; the malware reminder does not apply to this repo.

## Process (FEIGEN's, DECISIONS §29)

1. **Orchestrator, housekeeping commit:** the NAV2 "validated" sentence corrected in `NEXT-SESSION-PROMPT.md` + a §46 addendum
   line; memory `feedback_no_new_scenes.md` already carries the GIELIS exception. Then `assets/math/waves.js` (`mkWaves()`) lifted
   from `torus2/waves.js`, TORUS2's md5 identical — its own commit. Then the empty GIELIS skeleton registered at id 10 with
   `score: () => 0`, `tag`, `card`, `help` stubs, md5s of ids 0–9 identical — its own commit, so the no-op proof exists before any
   pixel. Write `docs/workers/brief-gielis.md` from this prompt + `brief-common.md` (may-read list, report format, PORT, commit
   prefix `GIELIS:`), mirroring `brief-nav2.md`'s headings.
2. **Worker (opus, own worktree, own PORT):** `math/gielis.js` + tests → the nest (twelve families by chroma, floor, fog; montage
   on `&demo=house` f360/f840) → species (`&fix=key=8,mode=1` on `#test`: the root family a rounded square, the fifth six lobes;
   a side-by-side of key 0 vs key 7) → the breath (a CLOCK=1 frame series across one bar: n1 dips at beatPhase 0 on all four beats,
   Q swing ≥ 0.15, rest Q ≥ 0.9) → waves (the `train` pin: four evenly spaced bumps per ring, then the syncopated pin) → flash /
   shimmer / colour → nudge / bounce / growth → section templates + drop (morph 0 / 0.5 / 1 on two templates, four shots; the
   drop collapse on `&fix=dropEvt`) → params (identity proof, a route moves the md5). One commit per proven step; the report in
   `docs/workers/gielis.md` with friction for CONTRACTS.
3. **Orchestrator:** merge; `scene-md5.sh` ids 0–9 identical, mixs identical, parity 0, Q trace `none`; accept section "== gielis"
   (id 10 forced: f360/f840 md5 references in `tools/accept/v0.14/`, the four-bumps pin, the bar-series Q table); then the
   **SeeYouDrop windows** (`nav2-window.py` extended to reach id 10; `T0=` 0, 25, 49, 96, 104 with `N=` 14, 40, 10, 6, 8;
   `DT=16 SHOT=0 MIN=1` traces for the groove and the breakdown; `perbeat14.py` per-beat Q swing and wave count; `lum.py` p95) and
   a montage for the user per window, plus one on `CyborgNinja` and `WhoLikesToParty` (the user has not asked for those; show, don't tune).
   `docs/AUDIT-v0.14.md`, DECISIONS §47.
4. **The user looks.** Then the user's words drive the retune passes (window replay → cause in the numbers → constants → re-prove
   → audit section → commit), and only on the user's word: bid, tag v0.14, push. The digit-key question (a tenth key, or GIELIS
   taking a slot) is the user's, raised once when they approve.

## What this session is not

Not a NAV2 retune (paused by the user, not validated — do not touch, do not raise the swap), not a TORUS2 or MAXWELL or POLYTOPE
change beyond the pixel-identical `waves.js` lift, not NEWTON, not a 2D per-pixel field, not an OKLCH default, not the Cloudflare
dashboard steps (still open from v0.6 — remind the user once, in one line). If the user's first sentence of the session changes the
spec, their sentence outranks every lean above; the five answered items (3D strokes, interval-to-key, section lean in, id 10 by `n`,
the five windows) are theirs.
