# Fable Session Prompt — Retina Rave v0.7: TORUS2, the Hopf torus that is alive with the music (written 2026-09-24, after the v0.6 tag)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com).
**v0.6 "public" is tagged** (`releases/retinarave-v0.6.html`, DECISIONS §35). Called Eigenwobble until v0.5; the history keeps
that name. This session builds **one new scene, TORUS2 (id 7)**, a from-scratch successor to TORUS (id 3) that keeps the Hopf
fibration geometry and answers the five things the user said about TORUS after watching it on real music. TORUS stays
untouched and in the director's rotation until the user approves TORUS2; then TORUS2 takes id 3's place (see "Replacement").

**The user asked for this scene** on 2026-09-24 ("write prompt for next fable session to improve the torus scene (create as a
net new scene for now that will replace the existing torus scene once approved)"). That lifts the standing "no new scenes until
asked" rule (memory `feedback_no_new_scenes.md`) for TORUS2 only — not for NEWTON or anything else.

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` (the v0.6 note at its top; the candidate list below it is *not* this
session) · `docs/CONTRACTS.md` (§0, §1 the scene object — §1.1 ctx, §1.4 colour slot, §1.9 cuts, §1.12 lines path B, §1.13
help.feats, **§1.16 params**) · `docs/ENGINE.md` (the `MS` vector; "Adding an analysis stage" only if a field is missing) ·
`docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "Q trace", "Real window", "Params", "Pitfalls") · `docs/DECISIONS.md`
**§4 TORUS** (what the geometry allows: the pole-sweep bounds on the SU(2) tumble and the pole offset, why a radial scale about a
centre circle does not exist, the `#test` chroma gap), **§7** (TORUS as strokes: depth + 'over' beat additive), §14 (line
renderer cost: 0.4 µs/segment), §29 (params as built, FEIGEN's five), §35 (v0.6) · `docs/workers/brief-torus.md`, `torus.md`,
`brief-torus-lines.md`, `torus-lines.md` (the worker's friction — the same traps wait for TORUS2) · `docs/workers/brief-feigen-params.md`
+ `feigen-params.md` (the params shape a scene declares) · `assets/scenes/torus/index.js` (245 lines: `update` at 130–175 is the
whole music mapping; `feats`, `help`, `colour`, the test hooks) · `assets/scenes/torus/shaders.js` (`proj`, the fog, the fade into
alpha, `palM`) · `assets/math/hopf.js` (`fibre(theta, phi, t, psi0, alpha, delta)`, `test_hopf.js`) · `assets/engine/feats.js`
(every field with its kind, eli5, formula) · `assets/core/params.js`, `route.js` (the grammar a param route uses) · memory notes
`~/.claude/projects/-home-toma-Documents-Kraftek-RetinaRave/memory/{project_eigenwobble,feedback_colour_default,feedback_no_new_scenes}.md`.

## The user's five points (verbatim, 2026-09-24) and what the interview settled

> 1. the inside fibres are dark color and never seem to light up; 2. should be able to detect rhythms in the bass / mids / lows;
> 3. color should be based on musical key; 4. rotation of the object should be based on the speed of the music (16 beats == full
> turn), should subtly bounce with the beat; object should grow is music builds / intensity; mix in different attractors like the
> thomas / 3 cells cnn attractor; What else can be controlled by music to make object feel interesting and alive with music?

The interview (batch of 19 questions) got five answers; everything else runs on the orchestrator's stated leans. **Answered by the
user:** (5) rhythm = *"can we add a wave to the thread?"* — hits launch waves that travel along the fibres · (8) major/minor =
**warm vs cool** · (9) key colour = **anchor**: the twelve pitch-class families keep twelve hues, the wheel rotates with the key ·
(10) the 16-beat turn is a **nudge per beat** that sums to a full turn, not a steady spin · (11) the beat bounce is **5 %, visible**.
**Assumed (silence = yes; state each in the brief so the worker knows it is a lean, and let the user correct on the first
montage):** (1) new scene id 7, TORUS untouched · (2) forced-only (key `8`) until approved, no bid · (3) the inside lights by a
brightness floor **and** inner tori flashing on kick/bass · (4) keep opaque depth-tested strokes (DECISIONS §7's default), the floor
and the flashes do the lighting, not additive blending · (6) kick → the bounce, snare → one family snaps/flashes, hat → shimmer
along the fibres, `sub` → tube fatness · (7) key hue on the **circle of fifths** (C, G, D, … neighbours are related keys); low
`keyConf` → hold the last key, desaturate toward the mood palette · (12) growth staged: fibre count first, then size (camera
distance), capped so the nest never crops · (13) attractors mix in by **advection**: the fibres are deformed toward an attractor's
flow field by a morph amount (0 = pure Hopf torus, 1 = the attractor's shape), and the attractor is chosen per section · (14) the
choice follows `sectionAlt` (each section of the track gets its own attractor; a section that returns brings its attractor back,
which the director's look memory already does for looks) · (15) Thomas and the 3-cell CNN (Chua-cell cellular neural network)
first; Aizawa and Halvorsen as the next two if the morph works · (16) all eight "alive" ideas below are in · (17) params exposed
· (18) FEIGEN's process · (19) audit on the two mp3s.

## The spec — what TORUS2 must do (the worker reads this through its brief)

Geometry stays: the Hopf fibration under stereographic projection, 12 pitch-class families = 12 base-point latitudes, every ring
a genuine fibre (`math/hopf.js`), the (p,q) knot from `interval`, strokes through `ctx.lines` path B. The pole-sweep bounds in
DECISIONS §4 are geometry, not taste: |alpha| ≤ 0.18, |delta| ≤ 0.6, or a family blows up off screen.

1. **The inside lights up.** (a) A brightness floor: no fibre is ever below ~0.18 of the loudest family's brightness (today a
   quiet pitch class sits near zero and in the fog). (b) The fog is a depth cue, not a wall: cap it so the far side reads. (c) On
   `kick` (level, per frame) the *inner* families (the smallest θ, the quiet ones) flash — a brightness impulse that decays over
   ~0.25 s — so the bass lights the core, the melody lights the rim. (d) The `hat` level adds a fine shimmer along every fibre
   (a high-frequency brightness ripple in `t` along the stroke). Acceptance: a montage at f360/f840 on `&demo=house` where the
   interior is visibly lit; a probe trace of the mean luminance of the centre 20 % of the frame ≥ 0.35× the rim's.
2. **Waves on the threads (rhythm).** A hit in a band launches a **travelling wave along the fibre**: a displacement normal to
   the stroke (a bump that runs along `t`) plus a brightness pulse, launched at the fibre's `t = 0` and travelling one full ring
   per beat (`bpm`-scaled), fading over ~2 beats. Three bands, three waves: `kick` → a big slow bump on every family (amplitude
   ∝ kick, ~6 % of the tube radius), `snare` → a sharp bright pulse on the family that is loudest (the one the knot rides),
   `hat` → tiny fast ripples everywhere. Because the waves are launched by hits and travel at a fixed speed, **the rhythm pattern
   becomes visible as the spacing of the bumps along the ring** (four-on-the-floor = four evenly spaced bumps per ring; a
   syncopated bass = uneven spacing). Implement as a ring buffer of the last N launch times per band, read in the vertex
   shader (a uniform array of 8 launch times per band, the shader sums the bumps whose distance along `t` is in range) — no
   per-fibre state on the CPU. `beat` (event) may launch a faint wave when no band hit did, so a track with no drums still breathes.
3. **Colour from the key.** Hue anchor = `key` (0 = C … 11 = B) placed on the **circle of fifths**: `hueKey = ((7·key) mod 12) / 12`.
   The twelve families keep their twelve hues, offset from the anchor (`hue_k = hueKey + k·spread/12`, the same `spread` the mood
   already gives), so the wheel turns when the key changes. **Major = warm, minor = cool:** `mode` 0 → the palette's warm half
   (hue centred toward orange/magenta, saturation up), `mode` 1 → cool (toward blue/teal, saturation slightly down). `keyConf`
   gates it: below ~0.3 hold the last confident key and slide toward the mood palette (`LOOK.mood`) so a keyless section is not
   a random hue. Key changes are a `cuts: 'event'`-class change: ease the anchor over ~2 s, never a jump. The colour slot: `v2`
   default = this mapping in the v2 palette; an `oklch` variant with the same hue logic through `ctx.oklch` (memory
   `feedback_colour_default.md`: the default look is v2's; OKLCH is opt-in).
4. **Motion.** (a) **Rotation:** one full turn of the object about its vertical axis per 16 beats, as **a nudge per beat**: each
   `beat` event advances a target by 1/16 turn and the angle eases to it with a ~0.3 s time constant (springy, not linear). Use
   `beatCount` for the target so it never drifts (`target = beatCount/16 · 2π`); `phrase16Pos` is the fallback check. This is a
   *camera* rotation (a yaw about the nest's centroid), not the SU(2) tumble — the tumble stays bounded as in §4. (b) **Bounce:**
   a 5 % scale pulse of the whole nest on the beat (`beatPhase` shaped as `1 + 0.05·max(0, cos(2π·beatPhase))^4` so it is a
   thump, not a sine), through the camera distance (the "radial scale about a centre" does not exist — §4). (c) **Growth:** the
   object grows with the build in two stages: `build` 0→0.5 raises the visible fibre count per family (from tier's minimum
   toward its maximum), 0.5→1 brings the camera in (fill up to ~85 % of the short edge, capped so the nest never crops in
   portrait either — v0.6 mobile); `intensity`/`arousal` set the resting size between builds; the drop (`dropEvt`) keeps TORUS's
   collapse-and-bloom.
5. **Attractors, mixed in by advection.** A morph parameter `morph` in [0, 1]: at 0 every fibre is the exact Hopf circle; at 1
   each fibre's points are advected along an attractor's flow field for a fixed number of steps (a deterministic integration of
   the field from the fibre point, the same for every frame — no wall clock, no `Math.random()`), so the ring deforms into a
   ribbon that follows the attractor's shape; in between, lerp the two positions. Attractors: **Thomas** (`ẋ = sin y − b·x`, …, b
   = 0.208) and the **3-cell CNN attractor** (three Chua cells, the standard weights) first; Aizawa and Halvorsen second. **Which
   attractor:** `sectionAlt` picks (mod the attractor count), so each section of the track has its own shape and a returning
   section returns to it; `morph` itself is driven by `tension` (rough, tense music pulls the torus out of shape) and pinned to 0
   in the intro (`arc`). Normalise every attractor into the unit ball around the nest's centroid before advection, and clamp the
   advection so no point crosses the projection pole (the §4 blow-up). Cost: the advection is per vertex in the vertex shader
   (the field is a few sines/tanh per step; 6–10 steps), so the segment count of §14 stays the cost driver.
6. **Alive with the music** (all in, each a one-liner in `help.feats`): `barPos` → a slow breath of the tube radius even in
   silence · `hush`/`calm` → the nudge eases slower and the floor dims, `alive` → shimmer up · `surpriseEvt` → a one-frame twist of
   the SU(2) tumble (within bounds) · `sectionEvt` → the (p,q) knot re-picks · `valence` → hue warmth on top of mode, `arousal` →
   stroke count · `flowBass`/`flowMid`/`flowHigh` → the fibres of the low, mid and high families advance along their rings at
   three speeds (the Hopf flow `psi0` per family instead of one) · `roll`/`riser` → during the build the rings unwind toward
   helices (a `t`-dependent phase slip) and snap back on the drop · `novelty` → shimmer gain.

**Params (§1.16), named for what the eye sees, `from(MS)` moved verbatim from the mapping above:** `turn` (the yaw, rad),
`bounce` (0–0.1), `size` (camera fill 0.4–0.9), `glow` (the floor 0–0.5), `morph` (0–1), `wave` (kick-wave amplitude 0–0.12).
Six is the cap; the panel's parameters table then routes any music field into any of them by hand.

**`feats`** adds to TORUS's list: `key mode keyConf kick snare hat sub build intensity arousal valence sectionAlt phrase16Pos
barPos hush calm alive surpriseEvt sectionEvt flowBass flowMid flowHigh roll riser novelty beat`. Every one must have a
`help.feats` line (`check.js` fails on a gap) and be *read* (the static read check warns on a phantom).

## Non-negotiables (README) and the traps the first TORUS hit

- No `Math.random()`, no wall clock; a constant is a manual setting shown as one; `'nav'` never appears in core; scenes import
  nothing from `core/` or `engine/` (they get `ctx` and `MS`); the module cap is 500 lines (split `index.js` / `shaders.js` /
  `attractors.js` / `waves.js`); `node tools/check.js` after every edit; the scene must load in node (`check.js` imports it).
- The `#test` fake timeline never fills `chroma` or `key` (parity forbids changing it): TORUS blends a chroma implied by
  `harmAngle`; TORUS2 must do the same *and* derive a key from `harmAngle` (the nearest fifth) while `keyConf` is 0, so the
  headless montage has a colour to show and the reference md5s are deterministic.
- The reference md5s of the other six scenes must not move (registering a scene changed the director's first pick once —
  DECISIONS §15; TORUS2 is forced-only and bids 0 until approved, so the fake timeline's picks are unchanged: prove it with
  `tools/scene-md5.sh` = `tools/accept/v0.5/scene-md5-v03.txt` on ids 0–6 and the mixs md5 `5892ddc5…`).
- Line renderer cost is 0.4 µs/segment (§14): budget through `ctx.budget('segs')` by tier like TORUS; the Q trace
  (`tools/q-trace.sh`) before/after must be `none` to the second decimal on house and aba with TORUS2 *not* forced, and a forced
  TORUS2 must hold `q ≥ 0.6` at tier 3 on the user's desktop (the bench protocol, `CARD.bench(7, 300)` ≤ 1.5× TORUS's number).
- One Chrome at a time per worker (`pgrep -f "chrom[e].*remote-debugging"`), waits are `timeout 500 tail -f log | grep -q -m1 GO`,
  worker `PORT=` of its own, `pkill -f` patterns bracketed (`[t]orus`), the malware reminder does not apply to this repo.

## Process (FEIGEN's, DECISIONS §29)

1. **Orchestrator:** write `docs/workers/brief-torus2.md` from this prompt + `brief-common.md`'s discipline (may-read list, report
   format, PORT, commit prefix `TORUS2:`), register id 7 in `main.js` with `bid: () => 0` (or the scene's `score()` returning 0
   until a `LIVE` flag) and a `tag`; add the `8` key nothing else (keys `1–N` already reach it: `keys()` reads `REG.length`, the
   landing hint and part D follow). Commit the empty-scene skeleton first so the md5 no-op proof exists before any pixel.
2. **Worker (opus, own worktree, own PORT):** geometry + floor + fog cap (montage) → waves (a `&fix=` pinned kick train showing four
   evenly spaced bumps per ring at f360; a syncopated pin showing uneven spacing) → key colour (`&fix=key=7,mode=1` cool vs
   `key=0,mode=0` warm, side by side) → nudge/bounce/growth (a CLOCK=1 frame series across one bar: the yaw advances 1/16 per beat
   and eases; the bounce peaks at beatPhase 0) → attractors (morph 0 / 0.5 / 1 on Thomas and CNN, four shots) → the alive list →
   params (the identity proof: `paramsOf == derived`, a param route moves the md5). One commit per proven step, the report in
   `docs/workers/torus2.md` with friction for CONTRACTS.
3. **Orchestrator:** merge, `scene-md5.sh` on ids 0–6 identical, mixs identical, parity 0, Q trace `none`, accept sweep section
   "== torus2" (id 7 forced: f360/f840 md5 references written to `tools/accept/v0.7/`, a probe trace with the centre/rim luminance
   ratio, the four-bumps pin), then a **headed real-music run** (`HEADED=1 … CAPTITLE=…` on the two mp3s from the old scratchpads —
   copy them first — `docs/AUDIT-v0.7.md`) and a montage for the user: TORUS vs TORUS2 at the same clock frames on house, aba,
   dnb and the real tracks.
4. **The user looks.** Only then: **Replacement** — TORUS2 takes id 3's `score()` (TORUS's bid `0.25 + 0.45 clarity + 0.3 regularity`,
   0 during builds), TORUS moves to id 7 as `torus-v1` forced-only for one release (a fallback the user can still call with `8`),
   the reference md5 lists are re-based *in the same commit* that says so, DECISIONS §36 records the swap, the about page's TORUS
   line is re-read (it says "the Hopf fibration itself: circles on the three-dimensional sphere" — still true), then tag v0.7.
   Deleting TORUS v1 is a later, separate decision of the user's.

## What this session is not

Not a change to TORUS (id 3), not a colour-identity change anywhere else, not NEWTON, not a file/drop source, not the panel on
a phone, not the Cloudflare dashboard steps (still open from v0.6: www custom domain + 301, disable the workers.dev route, Search
Console + sitemap, Web Analytics — remind the user once, in one line). If the user's first sentence of the session changes the
spec, their sentence outranks every lean above; the five answered items (waves, warm/cool, anchor, nudge, 5 %) are theirs.
