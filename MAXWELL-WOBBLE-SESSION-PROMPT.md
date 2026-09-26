# Fable Session Prompt — Retina Rave v0.11: MAXWELL after the user's first look (written 2026-09-26, after the v0.10 tag)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine, native ES
modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com). **v0.10 "the four
equations that dance" is tagged** (`458c0f0`, DECISIONS §42, `docs/AUDIT-v0.10.md`, worker report `docs/workers/maxwell.md`). This
session **modifies MAXWELL (id 9) in place** — no new scene, no id change, still forced-only (bid 0, key `9` then `n`) — and tags **v0.11**.

**The user looked at v0.10 on 2026-09-26 and said (verbatim):**
> 1) it feels too noisy when there is no sound ; 2) the color of the wave should match the color associated with the coord/note (it seems
> to just be two colors that switches sometimes?) ; 3) the waves don't wobble like I was expecting listening to dubstep (different music
> kinda looked similar)

Those three sentences are the spec and outrank every lean below. The user asked for a plan ("plan for now"); nothing is built yet.
**Gate:** as v0.10 — the user's word; no sweep (`feedback_sweep_cost`), proof on id 9 only (`feedback_test_scope`), v0.2 look default
(`feedback_colour_default`). The NAV2 swap, POLYTOPE's look and a MAXWELL bid are still not this session.

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` · `MAXWELL-SESSION-PROMPT.md` (the v0.10 plan — what was decided and why) ·
`docs/DECISIONS.md` §42 (what the worker changed against that plan, the ranked leans, the docs owed) · `docs/AUDIT-v0.10.md` ·
`docs/workers/brief-maxwell.md` + `maxwell.md` (the friction log is the trap list; "If this is picked up again") · `docs/CONTRACTS.md`
§0, §1 (§1.1, §1.4, §1.12, §1.13, §1.16) · `docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "What to re-prove") ·
`assets/scenes/maxwell/{index,fdtd,medium,sources,render,probe,help}.js` in full (1 300 lines; every constant is named at the top of its
module) · `assets/engine/feats.js` for `presence alive absentT lvl sub bassFast centroid dirty punchy flux` (the fields this session
adds) · `tools/accept/v0.10/{README.md,audit10.sh,det10.py}` · memory `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/`.

## The diagnosis (the orchestrator read the code on 2026-09-26; the worker verifies before changing anything)

**1 — "too noisy when there is no sound."** Nothing in the scene reads `presence`, `alive` (only the hat shimmer, `index.js:319`) or
`absentT`. In silence: the engine holds `bpm` and `beatPhase` keeps ticking, so `beat` fires and `sources.js:158` launches the `FAINT`
(0.30) kick every beat; `chroma` is zero so `W12` falls back to the `harmAngle` weights and all twelve charges radiate the carrier at
`CHG` × `params.charge` — whose `from()` floors at **0.45** with no music (`index.js:393`); the dipole keeps `DIPR` = 40 % of its
current between nudges; `FLOOR` 0.010 lifts the plane; and the H contours are drawn at levels spaced from the frame's own A range down
to `AFLOOR` 1e-6, so a near-empty field is contoured into a full picture of noise loops (the faint contours outside the porthole in
every real-track shot). The silence is drawn as loudly as a chorus.

**2 — "the colour of the wave should match the note; it seems to be two colours."** It is exactly two: `render.js:37–38` reads a soft
sign of Ez and maps it to `uCol.x` (the key's anchor hue) and `uCol.x + 0.5` turns (its opposite). The twelve charges glow in their
twelve sector hues (`uGH[k]`, `render.js:56`), but the field they radiate carries no memory of who launched it — Ez is one scalar.
The "switches sometimes" is the anchor hue easing to a new key (`keycolour.js`, 2 s).

**3 — "the waves don't wobble to dubstep; different music looked similar."** The carrier wavelength is a function of **`bpm` alone**
(`sources.js:123`: `LAM0 · 120/bpm`, swept by roll/riser) and the ring spacing is the kick train — so every 4/4 track near 120–140 bpm
draws the same wavelength and the same spacing, and nothing in the mapping moves at the **wobble rate** (a dubstep bass is an LFO on a
filter at 1/4–1/8 note, i.e. 1–4 Hz, sitting in `sub` / `bassFast`, which the scene reads only as the tiny standing current `SUBK` 0.004
and the `charge` param's `0.2 · bass`). Timbre (`centroid`, `dirty`, `punchy`) is unread. The medium (ε) and the wave speed never move
with the music inside a section — `light` is `0.70 + 0.25 · intensity`, a slow ema.

## The plan — three items, each a proven step, in place, constants at the top of the module

### Item 1 — silence is quiet (the user's 1)

- **`presence` gates the sources.** Add `presence`, `alive`, `absentT` to `feats`. `params.charge.from` becomes
  `presence · (0.45 + …)` (a routed param must still move the md5: keep the param, change its derivation); the `harmAngle` fallback for
  `W12` is weighted by `presence` (silent = twelve dark charges, not a lit ring); `FAINT` launches only while `alive` (the `#test`
  timeline is always alive, so this is proven by the hook below); `DIPR` (the dipole's resting share) × `presence`; the hat shimmer keeps
  its `alive` gate.
- **Silence swallows the field.** `params.ring.from` drops toward 0 as `absentT` grows past ~1 s (sigma → `VACSIG`), so the last rings
  fade in a second instead of ringing.
- **The contours have an absolute floor.** `NLEV` levels are spaced from a **fixed** A scale (a named `ASCALE`, the A range of a
  `hooks.train('4')` frame at `charge` 1) not the frame's own max, and `AFLOOR` rises so a quiet field draws few or no loops; the loops that
  remain are the field's, not the noise's. `FLOOR` (the plane's black level) halves.
- **Proof:** `hooks.quiet(1)` pins `presence = alive = 0`, `absentT = 10` inside `update()` (never touching MS — TORUS2's `hooks.key`
  shape). CLOCK=1 f360 with the pin: `tools/lum.py` mean luminance ≤ 15 % of the unpinned frame, `hooks.probe().segs` ≤ 10 % of the
  unpinned count, `hooks.energy()` ≤ 5 % — three numbers in the report. **Headed:** `audit11.sh` starts the track **paused** for 10 s
  (`{"evalTab":"document.querySelector('video,audio').pause()"}`, then `.play()`), shot at 8 s: the plane near black, the twelve charges
  dark, then the 20/40/60/80 s shots as v0.10.

### Item 2 — the wave carries the colour of the note that launched it (the user's 2)

**The lean — a colour field by linearity.** Maxwell's equations are linear in a linear medium, so the field radiated by twelve charges is
the sum of twelve fields, and a colour-weighted sum `C(x,t) = Σ_k rgb_k · E_k(x,t)` obeys the **same wave equation** as Ez
(`ε ∂²u/∂t² + σ ∂u/∂t = ∇²u` for the TE scalar, μ = 1). Run that equation on **one extra RGBA target pair** (`u_n`, `u_{n−1}`; second-order
leapfrog `u_{n+1} = 2u_n − u_{n−1} + S²·∇²u_n − damping`, sampling the same `MED` texture for ε, σ and the mirror mask) with channels
`(r, g, b, w)`: every source injects `amp · rgb(hue_k)` into `rgb` and `amp` into `w` (an unsigned magnitude field, same equation, so
`rgb / w` is a chromaticity that stays bounded). The display pass keeps **Ez for the sign and the luminance** (the physics), and takes
the **hue from `rgb / max(w, floor)`** where `w` is above a floor, falling back to the anchor below it. The sign still flips between the
hue and its opposite? **No — the user wants the note's colour.** The sign becomes brightness modulation only (crest bright, trough dark:
`L ∝ |ez|`, the trough dips to `TROUGH` = 0.35 of the crest), and the hue is the colour field's. Colours: the charges' twelve sector hues
(`sectorHue`, as their glows); the kick current and the dipole in the **key's anchor hue** (the tonic — a kick has no pitch class);
the hat launches with `HATSAT` = 0.3 saturation (near white); the sub standing current in the anchor hue.
- **Cost:** the colour field runs at **half the grid** (its own `GRIDC = [[128,72],[192,108],[256,144],[384,216]]`, bilinear at display —
  hue varies slowly) so the extra pass is ≈ a quarter of the Yee pair's texels. Take the cost lever the worker left (§42 item 6): **tier 3
  substeps 4 → 3** (`GRIDT[3]`), which the worker measured at ~0.8× the v0.10 cost; the colour field must then land the whole scene at
  **≤ 1.5× TORUS2** on the worker's two-page protocol — the same gate as v0.10.
- **Fallback if the colour field visibly disagrees with Ez** (a crest whose hue lags or leads its own ring by more than a ring width on
  the `hooks.train('4')` frame — the two discretisations differ at the mirror and the lens edge): the full Yee scheme on `vec4` fields
  (Ez, Hx, Hy each `(r,g,b,true)` — three targets per side, MRT via `drawBuffers` or three passes) at the full grid; costlier, exact.
  The worker measures A first and only builds B on a failed A.
- **Proof:** `hooks.chroma("k")` pins one lit pitch class (weight 1, the rest 0; `"k,j"` two) inside `update()`. One class lit → the whole
  plane in that sector's hue (`lum.py` mean hue within `HUETOL` = 0.04 turns of `GH12[k]`, saturation ≥ 0.5); two classes a fifth
  apart → two hues, each purest near its own charge, mixed between (three probes: the two charges' feet and the midpoint); `hooks.key`
  changes the anchor and the charges' hues do **not** move (they are the sector's, keyed to the circle of fifths — say what
  `sectorHue(hue, k, spread)` does to them and whether the anchor still shifts the whole wheel; if it does, that is the v0.10 behaviour
  and the user's sentence decides: the note's colour is the note's colour, so `spread` stays and the anchor's offset goes). Real track:
  `det11.py` reports the dominant hue per 2 s and the lit sectors — they must agree.

### Item 3 — the wobble, and music that looks like itself (the user's 3)

Three mappings, each a named constant, each visible on the montage against the other two demo styles and a dubstep track:
- **The wobble bends the light.** `sub` (25–60 Hz, the fast follower) and `bassFast` carry the LFO. The medium's ε breathes with it:
  `eps(x,t) = eps_geom(x) · (1 + WOBK · (sub − subSlow))` (`subSlow` an ema of ~0.6 s kept in the scene; `WOBK` ≈ 0.6) — light slows
  across the whole cavity when the sub swells, so every ring in flight bunches and stretches at the wobble rate: **the rings wobble**.
  The lens's shear (`tension` today) also takes `WOBSH · (bassFast − bass)`, so the lens flexes on each bass pump. A uniform ε factor is
  one uniform in `FS_E`, no medium rebuild.
- **The carrier is the timbre, not the tempo.** Wavelength: `lam = LAM0 · f(centroid)` with `f` = `pow(2, −CENTK · (centroid − 0.45))`
  (bright music = short waves, sub-heavy = long; `CENTK` ≈ 2.5, clamped by `LAMLO`) **and** `dirty` adds a second harmonic to the
  carrier at `DIRTK · dirty` (the growl of a distorted bass draws as a doubled ripple on each crest); `bpm` still sets the sweep (roll /
  riser) and the ring spacing is still the train. The beat-locked `regularity` term (§42 lean 5, a guess) goes.
- **The bass pumps the centre.** `SUBK` 0.004 → ~0.03 so the sub's standing current is visible (a slow breathing of the centre), and
  the kick current's pulse amplitude follows `punchy` (`KICKA · (0.6 + 0.8 · punchy)`); a launch's amplitude follows the band's own
  level at the hit, not `params.charge` alone. `flux` is not read (the kick already is a flux peak).
- **Proof:** `hooks.wob(f)` pins `sub = 0.5 + 0.5 · sin(2π f · frame/60)` in `update()`; at `f` = 2 Hz the crest spacing measured by
  `probe.js hRow()` on a `hooks.train('4')` frame series (f300 … f330, every 5 frames) must vary by ≥ `WOBMIN` = 12 % across the cycle
  and return; `hooks.timbre(c, d)` pins `centroid` / `dirty`: `c` = 0.3 vs 0.7 gives crest spacings in the ratio `pow(2, CENTK·0.4)` ± 10 %;
  `d` = 1 shows the doubled ripple (a shot). **Montage** (the deliverable for the user's 3): house · aba · dnb from the demo synths and
  the real tracks side by side at the same frames, v0.10 left, v0.11 right, plus a **dubstep track** — the user drops an mp3 into the
  session scratchpad `…/scratchpad/music/` (the two v0.10 tracks are CyborgNinja and WhoLikesToParty; neither is dubstep; if none is
  supplied, `demo=dnb` stands in and the report says so). The three demo styles must have **measurably different** crest spacings
  (`det11.py`: mean spacing per style, ≥ 20 % apart), and the dubstep run's spacing series must oscillate at the wobble rate (the
  report plots it by hand: a list per 2 s).

### Also in this session (small, orchestrator)

- The four CONTRACTS sentences owed from v0.10 (§42's last paragraph): §1.2 readback, §1.4 hook naming + read-only hooks, §1.10 the
  porthole under a rotating camera, the readback-band sentence. `check.js` only.
- `help.js`: every new feats entry (`presence alive absentT sub bassFast centroid dirty punchy`) a line; `eli5` / `why` / `math` updated
  for the colour field (one sentence each: "the colour rides the same equation").
- `AUDIT-v0.11.md`, DECISIONS §43, `NEXT-SESSION-PROMPT.md`, package.json 0.11.0, `releases/retinarave-v0.11.html`, the thumb re-shot
  if the f360 frame changed (it will: `tools/thumbs.sh "9:360"`).

## Numerics and non-negotiables (unchanged from v0.10 unless named here)

Courant 0.5 · `GRIDT` tier 3 substeps **3** (this session's one numerics change, taken for the colour field's budget) · fixed substeps
by frame count (CLOCK=1 md5s) · soft sources · the 16-cell absorber · the porthole · `hooks.reset()` zeroes the colour field too ·
no `Math.random()`, no wall clock · scenes import nothing from `core/`/`engine/` · 500-line cap (`index.js` is at 401 — the colour
field's setup goes in `fdtd.js` or a new `colour.js`, not `index.js`) · `node tools/check.js` after every edit · `CARD.hooks` names
collide across scenes (`maxwell.md` friction 5): every new hook is called as `CARD.REG[9].scene.hooks.<name>` and named `mx`-prefixed
where TORUS2 or POLYTOPE has the same word (`quiet`, `chroma`, `wob`, `timbre` are free today — check).

## Process (v0.10's, DECISIONS §36/§42)

1. **Orchestrator:** `docs/workers/brief-maxwell-wobble.md` from this prompt + `brief-common.md`'s discipline (PORT **8830**, commit
   prefix `MAXWELL2:`, may-read = the list above + `tools/accept/v0.10/*`); `tools/accept/v0.11/` with `audit11.sh` (the paused start)
   and `det11.py` (hue, lit sectors, crest spacing per 2 s) adapted from v0.10's; the v0.10 "before" shots for the montage
   (`IDS=9 tools/scene-md5.sh v011-before` = the v0.10 reference, and the three demo styles at f360/f840).
2. **Worker (opus, own worktree, own PORT):** item 1 → item 3 → item 2 (the cheap ones first, the colour field last because it is the
   cost risk; if the budget fails at item 2 the user still gets 1 and 3) → help + report `docs/workers/maxwell-wobble.md` with the
   friction log. One commit per proven item; every proof number in the report; `IDS=9 tools/scene-md5.sh mx2` at the end.
3. **Orchestrator:** merge; `IDS=9 tools/scene-md5.sh v0.11` (re-base `tools/accept/v0.11/scene-md5-v011.txt` = v0.10's list with s9
   moved); bench (worker's two-page protocol, ≤ 1.5× TORUS2); the headed runs on the two tracks + the dubstep track with the paused
   start; `montage-maxwell2{,-real}.jpg` (v0.10 left · v0.11 right); AUDIT-v0.11; DECISIONS §43; NEXT-SESSION-PROMPT; tag **v0.11**;
   push (deploys). Same gate as v0.10: the user's word was the tag; the montage is theirs to judge after.
4. **The user looks.** Only on their word: a bid, the Q trace, the `accept.sh` section, the NAV2 question.

## What this session is not

Not a new scene, not a bid for MAXWELL, not the NAV2 swap, not POLYTOPE, not TORUS2 (the `motion.js turn` fold onto `math/nudge.js`
stays owed to a TORUS2 session), not 3D, not an OKLCH variant, not a full sweep. If item 2's colour field cannot meet the budget even
at half resolution and three substeps, ship items 1 and 3 as v0.11, keep the two-hue render, and say so in the AUDIT — the user then
chooses between the exact `vec4` Yee (fallback B, at a higher gate) and the cheaper nearest-launch attribution (hue from the launch whose
ring passes nearest the pixel — good for hits, wrong for the continuous carrier; not built unless asked).

**One thing to bring:** a dubstep mp3 for the scratchpad's `music/` (the user's 3 is judged on it).
