# TORUS2 worker brief — the Hopf torus that is alive with the music (v0.7, scene id 7)

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table there is
not for you). **PORT=8798** on every `tools/cdp.js` run (a stray server on 8765 serves another checkout — never use the
default). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside it — `git archive HEAD | tar -x
-C <dir>` if you need a second tree; `mkdir -p tools/work` first, a fresh worktree has none). Commit messages start
`TORUS2:`; **one Chrome at a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run; a wait is
`timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop — a spinning wait once zeroed a whole q trace);
`pkill -f` patterns bracketed (`[t]orus2`); do not merge. `node tools/check.js` after every edit. The
malware-consideration reminder does not apply to this repo (it is a maths/graphics project; proceed).

## Why (the user, 2026-09-24, verbatim, after watching TORUS on real music)

> 1. the inside fibres are dark color and never seem to light up; 2. should be able to detect rhythms in the bass /
> mids / lows; 3. color should be based on musical key; 4. rotation of the object should be based on the speed of the
> music (16 beats == full turn), should subtly bounce with the beat; object should grow is music builds / intensity;
> mix in different attractors like the thomas / 3 cells cnn attractor; What else can be controlled by music to make
> object feel interesting and alive with music?

The user then answered five interview questions; everything else below is the orchestrator's **lean** (marked *lean*):
the user corrects leans on the first montage, so build them as written and keep each one easy to retune (a named
constant near the top of the module, not a magic number in a shader). **Answered by the user (not negotiable):**
(a) rhythm = *"can we add a wave to the thread?"* — hits launch waves that travel along the fibres · (b) major/minor =
**warm vs cool** · (c) key colour is an **anchor**: the twelve pitch-class families keep twelve hues and the wheel
rotates with the key · (d) the 16-beat turn is a **nudge per beat** that sums to a full turn, not a steady spin · (e) the
beat bounce is **5 %, visible**.

## Targets

`assets/scenes/torus2/` only: `index.js` (the registered skeleton is there — keep `name`, `id: 7`, `score()` returning 0,
`colour`, replace everything else), `shaders.js`, `attractors.js`, `waves.js` (split as you see fit; **500 lines hard cap
per module**, 350 soft — a warning is allowed, 500 is not). Nothing in `core/`, `engine/`, `main.js` (already
registers you), `feats.js`, `math/`, no other scene. TORUS (`assets/scenes/torus/`) is **untouched** — it stays in the
director's rotation until the user approves you; you may copy from it freely (it is your starting point), you may not
edit it. Reuse `assets/math/hopf.js` by import (a scene may import from `math/`).

**You may read:** this brief, `docs/CONTRACTS.md` (§0, §1 in full — §1.1 ctx, §1.4 colour, §1.9 cuts, §1.12 lines path B,
§1.13 help.feats, §1.15, **§1.16 params**, Appendix A), `docs/ENGINE.md` (the `MS` vector), `docs/HARNESS.md`
("Static checks", "Headless Chrome", "Bench protocol", "Q trace", "Params", "Pitfalls"), `docs/DECISIONS.md` **§4**
(what the geometry allows), **§7** (strokes: depth + 'over'), §14 (line cost 0.4 µs/segment), §29 (params as built),
`docs/workers/{brief-torus,torus,brief-torus-lines,torus-lines,brief-feigen-params,feigen-params}.md` (the previous
workers' friction — the same traps wait for you), `assets/scenes/torus/index.js` + `shaders.js` (your starting point),
`assets/math/hopf.js` + `tools/test_hopf.js`, `assets/engine/feats.js` (read only: every field's kind, eli5, formula —
the source of truth for what a field means and its range), `assets/core/params.js` and `assets/core/route.js` (read
only: the params slot you declare into, the route grammar), `tools/check.js`, `tools/scene-md5.sh`, `tools/param-smoke.js`,
`tools/cdp.js`'s header comment, `tools/montage.py`, `tools/probe.js`'s header. Not `core/scenes.js`, not `engine/features*.js`,
not `engine/synapse/`, not `fake.js` — if a field's behaviour is unclear, `feats.js` + a `CARD.MS` eval in the page is
your instrument; write the question in the friction log and continue.

## The geometry (kept from TORUS — DECISIONS §4 is geometry, not taste)

The Hopf fibration under stereographic projection, 12 pitch-class families = 12 base-point latitudes θ_k, every ring a
genuine fibre (`math/hopf.js`: `fibre4 → rotSU2 → poleOffset → stereo`, ported to GLSL in `torus/shaders.js`), the
(p,q) knot from `interval`, every ring a closed depth-tested opaque stroke through `ctx.lines` path B (`drawN`, one
instance per segment, `lineCorner`, `lineMask`; alpha is coverage — CONTRACTS §1.12). **Bounds:** |alpha| ≤ 0.18,
|delta| ≤ 0.6, or a family's torus crosses the projection pole and blows up off screen. A "radial scale about a centre
circle" does not exist once the family is tumbled (the fibres lie on cyclides): size changes go through θ (tube
fatness) or the **camera distance** (whole-nest scale). The camera tracks the centroid of a CPU sample (`reframe`).
The `#test` fake timeline **never fills `chroma`** (parity forbids changing it): TORUS blends in a chroma
implied by `harmAngle` while Σchroma < 0.5, continuously — do the same. The fake timeline **does** fill the synapse
fields you need (orchestrator checked `sources/fake.js`, 2026-09-24): `key` 9, `mode` 1, `keyConf` 0.8 (A minor → cool
on every `#test` shot), `kick` 1 on every beat while kicks are on (sustain 0–6 s and peak 13–21 s), `snare` 0.7 on odd
beats, `hat` twice a beat outside valleys, `sub`, `alive` 1, `hush` at the end of the build, `calm`, `barPos`,
`phrase16Pos`, `sectionAlt` = `sectionId`, `valence`, `arousal`, `riser = roll = build`, `flowBass`; `flowMid`/`flowHigh`
— check with a `CARD.MS` eval. So the headless md5 shots carry waves, a cool key and a real kick train; the
`harmAngle`-derived key (nearest fifth, `mode` 0) is the fallback for **real audio with `keyConf` below 0.3** (spec 3's
hold-and-slide), not for `#test`. Real audio: the real `chroma`, `key`, `mode`, `keyConf` verbatim.

## The spec — what TORUS2 must do

**1. The inside lights up.** (a) A brightness **floor**: no fibre is ever below `GLOW` ≈ 0.18 of the loudest family's
brightness (today `bri = 0.05 + 1.35 cw²` puts a quiet pitch class near zero, in the fog). (b) The **fog is a depth cue,
not a wall**: cap it so the far side reads (TORUS's `fog` floor 0.32 → ≈ 0.55, and the fade radius in `proj` wider).
(c) On `kick` (a level, decaying 0.16 s) the **inner** families — the smallest θ_k, the quiet ones — **flash**: a
brightness impulse that decays over ~0.25 s (your own follower on `kick`, weighted `(1 − c_k)` so the quiet families
get it) — the bass lights the core, the melody lights the rim. (d) The `hat` level adds a fine **shimmer** along every
fibre: a high-frequency brightness ripple in the ring parameter (`sin(24 t + phase)`, amplitude ∝ hat, gain ∝ `alive`
and `novelty` — item 6). Proof: f360/f840 shots on `&demo=house` where the interior is visibly lit, and `tools/probe.js`
(or a `readPixels` eval on `ctx.mkTarget(w,h,true)` — HARNESS pitfalls) giving **mean luminance of the centre 20 % of the
frame ≥ 0.35× the rim's** (rim = the annulus between 60 % and 90 % of the short edge) on `test&scene=7` at f360.

**2. Waves on the threads (rhythm) — the user's own sentence.** A hit in a band launches a **travelling wave along the
fibre**: a displacement normal to the stroke (a bump running along the ring parameter `t ∈ [0, 1)`) plus a brightness
pulse, launched at `t = 0` of every fibre it applies to, travelling at a fixed speed and fading over ~2 bars. **Speed: one full ring per bar (4 beats)**, so the wave
launched at beat `B₀` sits at `t = ((beatNow − B₀) / 4) mod 1` with `beatNow = beatCount + beatPhase` — musical time,
no wall clock, no drift (`bpm` is implicit in the beat clock; read it for the fade in seconds if you want, or fade in
beats). Three bands, three waves: `kick` → a big slow bump on **every** family (amplitude `WAVE` ≈ 6 % of the tube
radius, width ~0.12 of the ring), `snare` → a sharp **bright pulse** (brightness ×2.5, narrow, width ~0.04) on the
loudest family only (the one the knot rides), `hat` → tiny fast ripples everywhere (amplitude ~1 %, width ~0.02; the
shimmer of 1d rides on it). Because waves are launched by hits and travel at a fixed speed, **the rhythm pattern
becomes visible as the spacing of the bumps along the ring**: four-on-the-floor puts the bar's four kicks at t = 0, ¼,
½, ¾ (evenly spaced); a syncopated bass sits unevenly. Implement as a **ring buffer of
the last 8 launch beats per band** on the CPU (`waves.js`: `launch(band, beatNow, amp)` on a rising edge of the band's
level — a level above 0.5 that was below 0.25 last frame; the fake timeline's `kick` decays, so edges exist), uploaded
as `uniform float uWave[3*8]` (launch beat) + `uniform float uWaveA[3*8]` (amplitude at launch); the vertex shader sums
the bumps whose distance along `t` is in range (`exp(−((t − tw)/width)²)`, gain `exp(−age/2 beats)`), displaces the
point along the fibre's local normal (in R³ after projection: `normalize(p − centre of the ring)` is fine; the ring
centre = the projected point at t + ½ averaged with t is a decent proxy, or use the torus normal from `torusDist` — say
which) and adds the brightness pulse. **No per-fibre state on the CPU.** `beat` (the event) launches a **faint** kick-
class wave (amplitude ×0.25) when no band hit came in the last beat, so a track with no drums still breathes.
Proof: `&fix=` does not exist — pin the train yourself with a test hook `hooks.train('4x4' | 'sync')` that replaces the
edge detector with a fixed pattern on the fake clock (four launches per bar at beats 0,1,2,3 vs 0,1.5,2,3.5); shots at
f360 of each, side by side (`python3 tools/montage.py`), where the four bumps per ring are evenly spaced in one and not in
the other. Then the same without the hook on `&demo=house` (real kick train) at f600: bumps present.

**3. Colour from the key — anchor, warm/cool (the user's).** Hue anchor `hueKey = ((7·key) mod 12) / 12` (the circle of
fifths: C, G, D, … neighbours are related keys, so a modulation to the dominant is a small hue step). The twelve
families keep their twelve hues, offset from the anchor: `hue_k = hueKey + k·spread/12` (the same `spread` `LOOK.mood`
already gives, as `SPREAD` in TORUS), so the whole wheel turns when the key changes. **Major = warm, minor = cool:**
`mode` 0 → bend the palette toward the warm half (hue centre toward orange/magenta, saturation up ~15 %), `mode` 1 →
cool (toward blue/teal, saturation down ~10 %) — a hue bias added to the anchor plus a saturation factor, both eased.
`keyConf` gates it: below 0.3 hold the last confident key and slide toward the mood palette (`LOOK.mood.hue`) so a
keyless section is not a random hue; above it the key wins. A key change is an `'event'`-class change: **ease the
anchor over ~2 s** (a follower on the *unwrapped* hue so C→G goes the short way), never a jump — `cuts` stays
`'continuous'`. `valence` adds warmth on top of `mode` (item 6). The colour slot: `colour: {default: 'v2', variants: {v2: {},
oklch: {}}}` — `v2` is this mapping in the cosine palette (`palM` of TORUS with the anchor), `oklch` the same hue logic
through `ctx.oklch` (`palOK(h, L, C)`, CONTRACTS §1.14; memory: OKLCH is opt-in, v2 is the default look — do the oklch
variant last and only if time allows; say so if you skip it). Proof: `test&scene=7&demo=house` is not enough (the demo's
key is whatever it is) — add a test hook `hooks.key(k, mode)` that pins `key`/`mode`/`keyConf = 1` inside your update
(never touching `MS`), and shoot `key 0 mode 0` (warm) beside `key 7 mode 1` (cool) at f360.

**4. Motion.** (a) **Rotation, a nudge per beat (the user's):** one full turn of the nest about its vertical axis per 16
beats, as a **nudge**: the target is `turnT = beatCount/16 · 2π` (never drifts; `phrase16Pos` is the cross-check), and the
angle **eases** to it with a ~0.3 s time constant (a critically damped spring or a two-pole ema — springy, not linear);
`hush`/`calm` slow the ease (item 6). This is a **camera yaw** about the nest's centroid (TORUS's `CAM[0]`), not the
SU(2) tumble — the tumble stays bounded as in §4. (b) **Bounce, 5 % (the user's):** a scale pulse of the whole nest on
the beat, `1 + BOUNCE · max(0, cos(2π·beatPhase))⁴` with `BOUNCE` = 0.05 (a thump, not a sine), through the **camera
distance** (`CAM[2] /= pulse`). (c) **Growth:** two stages. `build` 0 → 0.5 raises the visible **fibre count per family**
from the tier's minimum toward its maximum (TORUS draws a fixed `FIB = 12`; you draw `fibMin..fibMax` per tier, e.g. 6..12,
and the segment budget through `ctx.budget('segs')` stays the cost cap); 0.5 → 1 brings the **camera in** (fill up to
~85 % of the short edge — capped so the nest never crops, portrait included: v0.6's phone is 390×844); `intensity` and
`arousal` set the resting size between builds; the drop (`dropEvt`) keeps TORUS's collapse-and-bloom (`uCollapse`).
Proof: a `CLOCK=1` frame series across one bar on the fake timeline (frames 360, 375, 390, 405, 420, 435, 450 at 120 bpm
= every half beat) with an eval of your yaw and pulse each frame (`hooks.motion()` returning `{turn, turnT, bounce, size}`):
the yaw advances 1/16 turn per beat and eases; the bounce peaks at `beatPhase` 0.

**5. Attractors, mixed in by advection (lean, the user's choice of attractors).** A morph parameter `morph ∈ [0, 1]`: at 0
every fibre is the exact Hopf circle; at 1 each fibre point is **advected along an attractor's flow field** for a fixed
number of steps `N` (6–10, Euler or RK2, step `h`, a deterministic integration from the fibre point — the same for every
frame; no wall clock, no `Math.random()`), so the ring deforms into a ribbon that follows the attractor's shape; in
between, **lerp** the Hopf point and the advected point by `morph`. `attractors.js` exports the fields as GLSL strings
and a JS twin for a node test (`tools/test_torus2.js` of your own — a few points, GLSL vs JS to 1e-6 by re-deriving in
node as the TORUS worker did): **Thomas** (`ẋ = sin y − b x, ẏ = sin z − b y, ż = sin x − b z`, b = 0.208) and the
**3-cell CNN** (three Chua cells: `ẋᵢ = −xᵢ + Σⱼ aᵢⱼ f(xⱼ)`, `f(x) = ½(|x+1| − |x−1|)`, the standard chaotic weights —
Arena/Baglio/Fortuna/Manganaro 1995: a = [[1.24, −3.2, 3.2], [3.2, 1.1, −4.4], [−3.2, 4.4, 1]]; cite whichever you use
and show it is chaotic-looking in your shot) first; **Aizawa** and **Halvorsen** second if the morph works (four is the
target; two is acceptable if the third breaks the budget — say so). **Normalise every attractor into the unit ball
around the nest's centroid** before advection (scale the attractor's natural extent — Thomas ~±4, CNN ~±3 — into the
nest's radius `CEN[3]`, offset to `CEN.xyz`), and **clamp the advection** so no point crosses the projection pole or leaves
`1.6 × CEN[3]` (the §4 blow-up: advect in R³ *after* projection, never on S³). **Which attractor:** `sectionAlt mod count`
picks (each section its own shape; a returning section returns to it — `sectionAlt` is −1 before synapse identifies:
use 0 then); switch attractors by cross-fading the advected position over ~1 s (two fields per frame during the fade,
or precompute — say which), never a jump. **How much:** `morph = tension`-driven (rough, tense music pulls the torus out
of shape), eased ~1 s, **pinned to 0 while `arc` is the intro** (`arc === 'intro'` — check `feats.js` for the enum's
values). Cost: per vertex in the vertex shader (a few sines/`tanh`/abs per step × N steps); the §14 segment count stays
the cost driver — keep N ≤ 10 and prove it in the bench. Proof: four shots at f360, `hooks.morph(m, which)` pinning
`morph` and the attractor: Thomas 0.5, Thomas 1, CNN 0.5, CNN 1 (plus Aizawa/Halvorsen 1 if built), montaged with the
pure torus (`morph 0`) — the ribbon must visibly follow a different shape per attractor and be **continuous** with the
torus at 0.5.

**6. Alive with the music (lean — all eight in, each one line in `help.feats`):** `barPos` → a slow breath of the tube
radius (±3 % over the bar) even in silence · `hush`/`calm` → the nudge eases slower (time constant ×2) and the floor
dims (×0.6) · `alive` → shimmer gain (0 in silence) · `surpriseEvt` → a one-frame twist of the SU(2) tumble target
(within |alpha| ≤ 0.18; eased back over ~1 s) · `sectionEvt` → the (p,q) knot re-picks (TORUS's `PQ[interval]` plus a
section-seeded rotation of the table: `PQ[(interval + sectionAlt) mod 12]` — deterministic, no random) · `valence` → hue
warmth on top of `mode` (±0.04 turns) · `arousal` → the resting stroke width and fibre count · `flowBass`/`flowMid`/
`flowHigh` → the fibres of the low, mid and high families advance along their rings at three speeds (`psi0` per family
band — families 0–3, 4–7, 8–11 by θ rank (quiet → loud) or by pitch class; say which) instead of one Hopf flow · `roll`/
`riser` → during the build the rings **unwind toward helices** (a `t`-dependent phase slip: `psi += UNWIND · riser · t`,
so a ring no longer closes — draw it open: the last segment's wrap is skipped while the slip is > 0.02) and **snap back
on the drop** (the slip → 0 with the collapse) · `novelty` → shimmer gain.

## Params (CONTRACTS §1.16) — six, the cap; named for what the eye sees

Declare `params` with `from(MS)` **moved verbatim** from your own update (name the argument `MS`; reads only fields in
`feats`; pure): `turn` (the yaw the eye sees, rad, range `[0, 2π]` — this one is the *target* `turnT` before the ease,
so a route can spin it; the ease stays state), `bounce` (0–0.1, from the beat shape
`BOUNCE · max(0, cos(2π·beatPhase))⁴` so a route can feed it a kick instead), `size` (camera fill 0.4–0.9, from build/intensity/
arousal), `glow` (the floor 0–0.5, from hush/calm), `morph` (0–1, from tension), `wave` (kick-wave amplitude 0–0.12,
from kick). Read them as `env.params.<name>` in `update()`. Prove: `CARD.paramsOf('torus2')` at f360 = finite numbers in
range, `CARD.paramDeps('torus2', p)` per parameter listed in the report, `paramsOf == derived` (identity), and one route
moves the md5 (`&param=torus2.morph=c:1` vs none at f360), lo/hi shot pairs for `size` and `morph` with a sentence each.

## `feats` and `help.feats`

TORUS's list (`chroma harmAngle interval harmUnw beatPhase beatCount bass tension dropEvt dropEnv bpm presence flow arc
clarity regularity` — drop `clarity`/`regularity` if you do not read them: your `score()` is 0 and reads nothing) plus
`key mode keyConf kick snare hat sub build intensity arousal valence sectionAlt phrase16Pos barPos hush calm alive
surpriseEvt sectionEvt flowBass flowMid flowHigh roll riser novelty beat`. **Every field in `feats` must be read** (the
static read check warns on a phantom; `check.js` fails on a `help.feats` gap and on an undeclared read at param
registration). `sub` → tube fatness (replaces `bass` there; `bass` → stroke width). `help` three depths (eli5 / why / math),
non-empty, written for a listener; `tag` one line; `hud()` one line (family, knot, fibres, segs, attractor, morph).

## Non-negotiables (README, CONTRACTS §0) and the traps the first two TORUS workers hit

- No `Math.random()`, no wall clock (`performance.now`, `Date`) — musical time only (`flow`, `beatCount + beatPhase`).
  A constant is a named manual setting at the top of the module. `'nav'` never appears in what you write. Scenes import
  nothing from `core/` or `engine/`. Module cap 500 lines. `node tools/check.js` 0 fail after every edit; the scene must
  load in node (`check.js` imports it: no DOM, no GL at import time — build shader sources in `init`).
- **Raw program** (no HEAD): `palM` is yours, `uRes` comes from the lines chunk; HEAD's names (`pal`, `rot`, `hash`, `TAU`)
  are taken in HEAD programs only — you are raw, so `TAU` is yours to define once. `ctx.use(pr, target, w, h)` on your
  program; **never name a GLSL variable `gl_*`**; `smoothstep(a, b, x)` with a > b is undefined; every uniform you
  declare must be fetched (`check.js` fails on a dead uniform); `flat out` for per-segment colour.
- `ctx.lines.drawN(n, {depth: true, blend: 'over'})` — the renderer owns the VAO; alpha is coverage (opaque strokes; the
  fade lives in the colour; `discard` below 0.004 so an invisible stroke never writes depth) — CONTRACTS §1.12 in full.
- `Q` tier flips vs `cuts: 'continuous'`: ease your tier over ~2 s as TORUS does (`QS`), never add/remove a ring on a tier
  flip — only segments per ring; the build's fibre count (4c) is eased too, and a ring that appears fades in over ~0.5 s.
- The reference md5s of ids 0–6 and the mixs md5 `5892ddc5…` **must not move**: you touch nothing outside your folder,
  so they cannot — but run `tools/scene-md5.sh <tag>` once at the end and diff ids 0–6 against
  `tools/accept/v0.5/scene-md5-v03.txt` to prove it (your own s7 lines are new).
- Cost: `CARD.bench(7, 300)` at pinned `q` 0.95 interleaved with `bench(0, 300)` and `bench(3, 300)` (HARNESS "Bench
  protocol"; three pairs, medians): **TORUS2 ≤ 1.5× TORUS** at tier 3 with `morph` 1 and all waves live. Report ms and
  the ratios. The orchestrator runs the Q trace; you do not.
- Headless `Q.q` is not a perf verdict (`CARD.bench` is). The demo synths are random (`fake=0` runs differ run to run);
  `#test` with `CLOCK=1` is bit-identical — use it for every md5.

## Process — one commit per proven step, in this order

1. **Geometry + floor + fog cap + inner flash + shimmer (spec 1).** Copy TORUS into your folder as the start, rename,
   register nothing (done). Shots: `test&scene=7` f360/f840 and `test&fake=0&demo=house&scene=7` at 10/30/50 s
   (`t2-…`); the centre/rim luminance ratio. Commit.
2. **Waves (spec 2).** `waves.js`, the hook `hooks.train`, the two pinned shots + the house shot. Commit.
3. **Key colour (spec 3).** `hooks.key`, warm vs cool side by side; the `harmAngle`-derived key on `#test`. Commit.
4. **Nudge / bounce / growth (spec 4).** `hooks.motion`, the frame series across one bar (a small table in the report).
   Commit.
5. **Attractors (spec 5).** `attractors.js` + `tools/test_torus2.js`, `hooks.morph`, the four-shot (or six-shot) montage.
   Commit.
6. **The alive list (spec 6).** Every line in `help.feats`; one shot with `riser` pinned high (`hooks.unwind(1)`) showing
   open helices. Commit.
7. **Params.** The six, the identity proof, the lo/hi pairs, one route moving the md5. Commit.
8. **The bench** (interleaved pairs), `scene-md5.sh` ids 0–6 identical, and the final montage
   `tools/work/t2-montage.jpg` (`montage.py`, 3 columns): TORUS (`scene=3`) beside TORUS2 (`scene=7`) at the same
   frames — f360, f840 on `#test`; 10 s / 30 s / 50 s on `&demo=house`, `&demo=aba`, `&demo=dnb`.

## Acceptance (repo root, all must pass; `PORT=8798` on every cdp run; shots in `tools/work/` prefixed `t2-`)

1. `node tools/check.js` → 0 fail; no new warning except a soft line-cap one.
2. `PORT=8798 GPU=1 node tools/cdp.js 'test&scene=7' '[{"wait":6000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical,glerr:CARD.glerr})"},{"shot":"work/t2-t6"},{"wait":8200},{"shot":"work/t2-t14"}]'`
   → ERRS `[]`, nonFinite `[]`, logical 7; t6 a lit nest with a bright interior; t14 the drop's collapse-and-bloom.
3. The house run (brief-common item 3 with `scene=7`, shots `t2-h10/h30/h50`) → three different frames; `bench` reported.
4. Every proof shot of steps 1–7, montaged, Read with your own eyes, one sentence each on what it shows.
5. The scene object has `name id tag feats cuts score init update draw post colour params help hud hooks`; `feats` is
   exactly the fields you read; `help.feats` has a line for every one; `score()` returns 0.
6. `tools/scene-md5.sh t2` → ids 0–6 identical to `tools/accept/v0.5/scene-md5-v03.txt`; your s7 f360/f840 md5s are
   stable across two runs (write them in the report — they become the v0.7 reference).
7. `node tools/bundle.js` → 0 errors; `FILE=$PWD/dist/retinarave.html PORT=8798 NOAUTO=1 GPU=1 node tools/cdp.js 'real'
   '[{"wait":1500},{"clickSel":"#demo"},{"wait":3000},{"key":"8"},{"wait":3000},{"eval":"JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),scene:CARD.SC.logical})"}]'`
   → errs `[]`, scene 7 (key `8` reaches id 7 — `keys()` reads `REG.length`).
8. `node tools/param-smoke.js`, `node tools/test_hopf.js`, `node tools/test_torus2.js` pass.

**Report** (`docs/workers/torus2.md`): brief-common (a)–(e) — the friction log (every sentence the docs lack, every
guess, every lean you changed and why), the temptation list, the exact EVAL lines, the bench table (three interleaved
pairs, ratios), the shot file names with one sentence each, the parameter table (name · eli5 · range · from · deps ·
what lo→hi does), the frame-series table of step 4, the attractor weights you used with the citation, the s7 md5s, the
line count of every module, and **what you would tune first when the user looks** (the leans you are least sure of).
Leave the worktree committed (`TORUS2:` messages); do not merge.
