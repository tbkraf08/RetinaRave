# NAV / NAV2 review — read-only, 2026-10-08

Repo: /home/toma/Documents/Kraftek/RetinaRave (v0.33). Files read in full: assets/scenes/nav/{index,nav,shaders,shaders-v2}.js,
assets/scenes/nav2/{index,nav2,beat,detect,exit,green,shaders}.js, assets/math/{field,mandel,baby}.js, both NAV2 session prompts,
DECISIONS §0 §29 §30 §37–§39 §46 (+8 addenda) §54 add.2 §93–§95, CONTRACTS §0 §1 §1.3 §1.8 §1.9, main.js, core/{scenes,hud,
landing,look}.js, tools/{accept.sh,scene-md5.sh,monitor.js,parity.js,check.js,license.js,thumbs.sh}, test_nav2/test_field heads.

## 1. NAV anatomy (id 0, home; `assets/scenes/nav/`)

Per-frame pipeline: engine MS → `index.js update()` → `nav.js updateNav(dt, now, S, {isLogical, drum, P})` writes
`N.c, N.cPath, N.cyc{q,lnr,arg,zs,eps2,has}, N.par, N.vtime, N.timeScale, N.path (PiP trail), N.orbit (160 critical-orbit pts)`
→ `index.js draw()` uploads uC/uView/uIter/uIterLo/uSc/uTrapN/uTrapR/uDrum/uZs/uLam/uEps2/uPx/uPar/uMode[4] → fragment
`FS_JULIA_V2` (default colour variant `v2`) or `FS_JULIA` (OKLCH, opt-in `&colour=oklch`) → additive critical-orbit points
(VS_PT/FS_PT) → post chain (`fb.decay 0.7+0.16 eM`, bloom thr .35, kaleido 1; exposure OFF) → `overlay()` = PiP of M
(FS_MANDEL_V2) scissored top-right. HEAD uniforms uPal/uTint/uBands/uBeat come from LOOK (core/look.js), not NAV.
Scene variant DRUM (id 4) is `score 0` since §93 (forced-only); `uDrum = vmix` is 0 in practice.

| feature | drives (nav.js / index.js / shader) |
|---|---|
| interval (0–11 semitones) | `BULBS[S.interval]` = the target bulb p/q (nav.js:318); retarget only on a beat while INT, any frame in EXT |
| repeat, seed.a | `repeat` → dive into `BABIES[floor(seed.a·3)]` at the next root; seed.a also offsets α in the cardioid and φ's phase |
| seed.th | the exterior angle offset while EXT (`th ← harmUnw/TAU + seed.th`) |
| beat | retarget gate; counts `loud` (sustain ∧ I>.55) toward the loud-exit (>14 beats) |
| beatPhase, beatCount | trap-line rotation `ta = π·(beatCount+1−(1−phase)³)` (half a turn per beat); extBeat / settle timers; which landing ray (`rays[beatCount&1]`) |
| dropLiveEvt | `navDrop`: the one cut → EXT along a landing ray (§54 add.2: live detector since 2026-09-29; v3's dropEvt by route) |
| dropStrength | exit depth `lg = −2.2 + 1.7·ds` |
| dropEnv | zoom ×(1+.25), `reach` +3.2 (deeper), HOME gate (<.2), exterior dust lit `exp(−7d)·(.05+.6 dropEnv)` |
| intensity I | cardioid radius `h → −(1 − .93·max(I,park))`; bulb depth `h → clamp(1−(.12+.8 I), .02, 1)`; α/h spring speeds |
| buildLive, suspension | `park` = max(sstep(.45,.85,buildLive), sstep(.5,.8,susp)) → h → .004 (c parked ON the root), φ → 0, kicks off |
| presence | idle <.15 freezes α, h → −1 (cardioid centre), vtime slowed, PiP fades |
| harmUnw | cardioid angle α (w 1.2), bulb angle φ = 1.3·sin(.7 harmUnw + seed.a·TAU), exterior θ (w 2.2) |
| arc | sustain → loud count; `peak` keeps EXT up to 48 beats instead of 8 |
| onset, hitStrength, eS | Misiurewicz kick: nearest of 14 MISI pts, `c = mix(cPath, M, k)`, k = clamp(.3+.55 hs, 0, .85), spring w 9 back |
| hit | zoom −.07, PiP head brightness, exterior edge flash `.3+.4·uBeat.y` |
| eS, tension | `reach` = mix(−2.6, −9, .55 eS + .5 tension) + 3.2 dropEnv (exterior depth target); DRUM mode amplitude |
| eM | trail length only |
| resolveEvt | `timeScale` ≥ 2 for a moment |
| bass / mid / high | uBands: interior glow + line-trap gain; `trap` radius .35+.9 mid; circle-trap highlight ×high; dots size, zoom −.05 bass |
| peaks | the four DRUM Koenigs modes (uploaded always, mixed by uDrum = 0) |

Three "variants": colour `v2` (default, DECISIONS §26) vs `oklch`; scene variant DRUM id 4. Params (§29): trap, zoom, dots,
pip, reach — all panel-routable.

## 2. NAV's navigation — the finite set of places, and what moves c

State (nav.js NAV): mode INT | OUT | EXT | HOME | IN; springs `alpha` (turns), `h` (radial, h≤0 cardioid r=1+h; h>0 bulb
ρ=1−h), `phi`, `th`, `lg`, `kick`, `bz`; tables BULBS (12), BABIES (3, P=3/4/5), MISI (14).

**The places c can be (enumerated):**
1. Main cardioid, chart λ = r·e^{2πiα}, c = λ/2 − λ²/4 (nav.js:386). r = 1+h with h → −(1 − .93·max(I,park)):
   loud I≈1 → r≈.93 (near the rim), quiet → centre. α ← harmUnw/TAU·.5 + seed.a through a w=1.2 spring. Continuous but
   two slow scalar inputs.
2. A root of one of **12 bulbs** (interval → p/q ∈ {0/1,1/15,1/8,1/5,1/4,1/3,2/5,1/2,3/5,2/3,4/5,7/8}); reached by walking
   the cardioid rim to α=p/q, then `h>0`: multiplier chart of the bulb (`bulbChart` / Newton `solveMult`) at
   ρ = min(1−h, .985), φ = 1.3·sin(...)·sstep(0,.3,h). h target `clamp(1−(.12+.8 I), .02, 1)`: for a loud section
   I≈.8–1 → h .02–.24 → **ρ .76–.98, pinned beside the root**. With `park` (build/suspension) h → .004: exactly on the root.
3. The same 12 bulbs inside **3 baby copies** (P=3 at −1.755, P=4 at −.157+1.032i, P=5 at −1.625): entered on `S.repeat`
   only at a root crossing (`babySwap`, a declared chart cut, `pathCut 0`).
4. **14 Misiurewicz points** (8 + conjugates) as momentary kick targets: c = mix(cPath, M, k), spring w 9 back (<1 s).
5. **Outside**: c = extC(θ, log₂G) on the inverse-Böttcher table; θ ← harmUnw/TAU + seed.th (slow), log₂G ← `reach`
   (−2.6…−9 by eS/tension, +3.2 on dropEnv). Entered via `navDrop` (dropLiveEvt) or the loud-exit (>14 sustain beats at
   I>.55 while logical). Home after 8 beats (48 if `arc==='peak'`) or silence → HOME (θ → nearest landing ray, lg −4 then
   LG_MIN) → IN bridge .7 s → INT at the target root (`h .001`, `landed = beatCount`) → immediately climbs to the I-depth.

**Transitions:** interval change (beat-gated) → walk rim → new root (seconds); repeat → baby dive; onset → kick; drop/loud → EXT;
settle → HOME → IN. Everything else is a spring on I, harmUnw, eS/tension.

**Continuity (§0 / monitor.js):** a violation is a spike `d > .06 ∧ d > 2.5·d_prev + .01` on `cPath` (baby-size normalised);
legal: `pathCut ≤ 2`, a kick rise, a mode change, 300 ms after one. Springs may be fast (MON.fast); only cuts count.

**Why the user sees "stuck in defined locations":**
- The only *discrete* chooser is `interval` (semitones above the bass): in dance music it is a constant for a whole section,
  so c sits beside **one** bulb root for minutes; the pinch (ρ→1) at a fixed internal angle gives one fixed species.
- Inside that bulb the two continuous inputs are I (radius) and harmUnw (±1.3 rad of φ, i.e. never a full turn) — both slow
  emas, so on a steady groove c barely moves; nothing reads pitch, kick size, snare, hats, bars, or the live detectors
  (`kick2/snare2/hat2`, `kickAmp`, `loudM`, `tongue*`, `modeShade`, `bars`) that every post-v0.15 scene uses.
- The beat is visible only as (a) the trap-line rotation (half a turn per beat — the exterior sweep), (b) the kick toward a
  Misiurewicz point (gated hs>.55 ∧ eS>.3 ∧ no kick in flight — rare on a groove), (c) `uPal.w` brightness. c itself does
  not bump: the "no beat = circle, beat = pinch" rebound the user liked in NAV at 38–42 s (§46 add.5) is the basilica
  root (interval 7 → 1/2) reached by the `park` on the build, not a beat response.
- The park (`buildLive`/`suspension`) puts c exactly on the root → par → 1 → the smoulder and the edge flash both max out
  (the "too bright" at the build), and the look freezes until the drop.
- Drops: θ follows harmUnw (slow) and `reach` a fixed function of eS/tension, so every drop lands in the same region of
  the dust and stays ≥ 8 beats, up to 48 (19 s at 150 bpm) at `arc==='peak'`.

## 3. NAV's rendering — what is bright, what is green, where the circles and spirals come from

`pal(t)` (core/gl.js HEAD) = cos palette: `.5+.5cos(2π(t + uPal.x + uPal.y·(0,.33,.67)))`, tinted, `c·c·1.3`, saturated by
uPal.z, **× uPal.w**. LOOK (look.js): `uPal.x = hueT = hue + seed.hue + .2·harmAngle/TAU` where `hue` DRIFTS at
`.004 + .05 eS + .12·clamp(.4 harmVel)` turns/s (≈ a full turn per 20 s at eS 1); `uPal.w = (.28 + .55 eS^.8 + .2 hit + .2 dropEnv)·(.7+.3 presence)`.

**"Green" is not a feature-driven state.** It is where the drifting hue wheel happens to be: the exterior base
`pal(t)` with t = `.035·sn + .06·uTime + .12·sin(2·arg z)` is green when hueT + .035·sn lands in the green third. Greens and
yellows are 3–10× the sRGB luminance of the blues (NAV2 §46 add.5 measured exactly this), so "I like it when it turns
green" and "too bright" are the SAME palette phase at different exposures — the user is seeing the hue wheel pass through
green, which is when the boundary is brightest AND most legible. Nothing today chooses green; harmony/key could
(GIELIS/TORUS2 use `keycolour.js`).

Exterior branch (FS_JULIA_V2, esc): with d = distance estimate, e = d/px, halo = 1/(1+.011 e), edge = exp(−.3 e):
- base glow `pal(t)·(.07+.93 halo²)` — the Green's-equipotential ripple `.035·sn` (hue bands per doubling of potential)
  **animated by `uTime·.06`** = the exterior sweep the eye reads as the dust "breathing/sweeping";
- **line trap** `pal(t+.35)·lt·(.25+1.2 bass)·halo`, lt = exp(−16·min|z·n̂|): preimages of a line through 0 under f_c^{−n}
  — these are the exterior "spirals" and filaments; the line rotates π per beat (`uTrapN`), so on every beat the whole
  filament pattern re-threads = "too chaotic";
- **circle trap** `pal(t+.6)·ct·high·.9·halo`, ct = exp(−22·||z|−trap|), trap = .35+.9 mid: preimages of a circle of radius
  `trap` = **the circles that pop out on the filaments** (user likes); their size follows `mid`, their brightness `high`;
- drop dust `pal(t+.2)·exp(−7d)·(.05+.6 dropEnv)`;
- **boundary flash** `col = mix(col, mix(white, pal(t+.2)·2, .6)·uPal.w, edge·(.3+.4 hit))`: within a few px of J_c the
  colour is replaced by 60 % of a 2× palette + 40 % white, 30 % always and 70 % on a hit. This is the exterior "too bright at
  the boundary" term — it scales only with uPal.w and hit, never with how much filament is on screen.
Interior branch (conv, chart known): Koenigs `Lk = log|w|/(−ln ρ) + n/q`, `ai = arg w − arg λ·log|w|/ln ρ`. bands =
cos(2π Lk) (rings), spokes = cos(2 ai + .4 uTime). The spoke curves `ai = const` are log-spirals of pitch **arg λ / ln|λ|**:
tighter as ρ → 1, more turns as φ grows — so **spiral tightness is the navigation state (h, φ), not a knob**. Base
`pal(.55+.1 bands+.08 spokes)·(.03+.16 bands(.3+bass)+.05 spokes)` is dark; then the **smoulder**
`pal(.5+.1 bands)·par²·(.35+.3 bass)·(.3+.7 bands)`, par = sstep(.8,.98,ρ) (×.4 in the cardioid): at the root this adds up
to .65·pal on top of a .2 base — a 3–4× jump. Parked on a root (build) the interior washes out; that is "@38 s too bright".
No-chart branch (kick in flight, or outside the chart): near-black + line trap.
Post: bloom adds `.4+.4 eS+.3 dropEnv` above encoded .35; feedback trails .7–.86; tonemap knee k 1.5; exposure effect off.
"@1m10s boundary section too bright, can't see the fractal": most likely the EXT dust after the 58 s drop (SeeYouDrop,
arc peak → up to 48 beats = 19 s outside, i.e. until ~1:17): deep outside at `reach` the frame is all halo/dust and the
flash term saturates — NAV2 §46 add.5 measured the same frames at 0.75 luminance and built uExtG/uLum for it. (Track not
named by the user — inferred from §46; needs a trace to confirm.)

**Knobs.** (a) Boundary exposure: the flash mix `edge·(.3+.4 hit)` and its white share `.6`, the halo base `.07+.93 halo²`,
`uPal.w`, the smoulder gain `.35` / window `sstep(.8,.98)`, drop dust `.6 dropEnv`, bloom thr; NAV2's `uLum` knee (0.2, 3)
+ `uExtG` .35 + `uRound` are drop-in (IEEE-identity rests). (b) Spiral tightness: ρ (the h target `1−(.12+.8 I)`, the park
.004, rhoMax .985) and φ amplitude 1.3; NAV2's `uCurl` (ai += uCurl·Lk) decouples visual tightness from ρ. (c) Exterior
chaos: trap rotation π/beat (`ta`), `lt` sharpness 16, `uTime·.06` hue drift, `reach` depth, the `.12 sin(2 arg z)` wobble.

## 4. NAV2 anatomy (id 8, key 9, forced-only, `score 0`; paused mid-tune per §46 add.8)

- **nav2.js** force model: wishes `wy = Y_REACH·hN` (centroid motion normalised to the track's 8 s range, spring W_Y 14),
  `wx = ema(X_HOME + X_AMP(bass−high))` in musical time; the pull `(wish−c)/TAU_M·(1−.8 wind)` projected onto the rim's
  TANGENT (the wall owns the radius); `beatStep` adds the radial spring `K_R 20·(rhoT−ρ)·n̂`, rhoT = mix(mix(.30, .985+.04E,
  beat), cap, wind²), the note pull (bass pitch class → one of 12 root angles `NOTE_ANG`, NOTE_V 8×bump) while q=1, cap V_INT
  3.5, slew = the monitor's growth rule; `moveInt` probes `findCycle` (same period, ρ ≤ .985) with tangent projection + 6
  bisections. Gates: pressed (ρ>.72 or blocked) beside a Farey root p/q (q≤7, child ≥ .02) for 1 beat (leak .3) → walk λ
  to e^{2πip/q} via dλ/dc, push into the child; locked under build ≥ .4 or a driving note. Measured 0 gates on real tracks.
- **field.js**: `findCycle` (critical orbit 4096 steps, nearest return q ≤ 64, divisor test, 8 Newton steps → λ), `rhoGrad`
  (central differences → n̂ and component size 1/|dλ/dc|), `pot/dist/potGrad/rayTo/cleanLine` (exterior ruler),
  `nearestRational`. ~2 ms/frame with the probes (NAV's chart is ~free).
- **detect.js**: pitch (high-passed centroid), lift, hN, sweep (sustained climb / riser / hp), roll, scratch (pitch-bend
  flicks gated by flux), swirl (soft-OR), wind (build·(.35+.25 tension) + countdown·(.45+.55 tension) + .3 hush, released by
  dropEvt, leaks after a fakeout), **bump** (max(kick,hit) over the track's running peak × (.5+.5 eS), grid press GRID_K 1 while
  kicks are recent, hold .4·ival, decay min(.35, .3·ival)), pulse (2 s ema), E (eS vs its own 20 s peak), spin, curl, glow.
- **exit.js**: the drop on v3 `dropEvt` (NOT dropLiveEvt), ray along n̂ to log₂G −2.2+1.7 ds with ±45° retries, EXT 8 beats on
  ∇log₂G with `reach − .5·bump`, HOME unwinds drift, IN bridge 1.1 u/s, DROP_GAP 32 beats.
- **green.js — "Green's ruler" (§46 (4))**: traces c's equipotential |φ_c| = 1.06 (256 pts, 7 inverse pull-backs ±√(z−c)),
  then Green's theorem: A = ½∮(x dy − y dx), L, **Q = 4πA/L²** (1 = circle), mean edge speed v, dA/dt. **It drives nothing** —
  `hooks.green()`, `rt.log`, `hud()` only; it is the audit instrument ("no beat = circle" ⇔ Q→1, "edge always moves" ⇔ v>0).
  Answer to the user's question: Green's theorem can *still* help, as the acceptance ruler for any NAV retune (per-frame Q
  and v on a real track), and it could drive one thing cheaply — e.g. normalise the boundary flash by Q or by L (more edge
  on screen → less gain), or gate the smoulder on dA/dt — but it has never been wired to a pixel.
- **shaders.js** additions (all IEEE-identity at rest): uKoen (pitch slides bands / rotates spokes), uCurl (ai += uCurl·Lk),
  uGlow (smoulder × (1+.8 hush)), uRound (×(1+.8(1−ρ)) interior, half outside), uBump (halo reach 1/(1+.011e/(1+uBump))),
  uLum (luminance knee `col /= 1+K·max(0, L−L0)`, interior (0.2, 3), exterior off), uExtG (.35 outside), uView.xy lift,
  uView.w spin.

**Salvageable into a NAV clone, ranked by value/risk:**
1. The three brightness tools — `uLum` knee, `uExtG` dim, `uBump` — and the `uCurl` gain: pure shader lines with exact
   rests, directly aimed at complaints 1–2; byte-identical when off, so each lands as its own proven commit.
2. `detect.js` `bump / pulse / E` (running-peak-normalised beat) and `wind`: as modulators of NAV's **existing** h target
   (ρ = 1 − h in `bulbChart`) — "beat presses c toward the root, silence lets it fall back to the centre" without any
   chart-free machinery (NAV's chart already gives ρ, φ as coordinates). This is the cheap route to "moves with the music".
3. The real-track trace tooling (`tools/accept/v0.13/nav2-window.py`, `det13.py`, `perbeat13.py`) — needs an `n2info`-shaped
   hook on the clone; and `green.js` as the ruler.
4. `field.js` only if NAV2's "any c" freedom is wanted later; it brings the gate/period complexity and ~2 ms.
Not salvageable as-is: the note→species pull (conflicts with interval→bulb), the force wall, the v3-`dropEvt` drop.

**What "I like NAV better" probably reacted to (honest):** code cannot tell look from motion. What the code says: NAV lives
at ρ .76–.98 (arms, spirals, the smoulder, baby copies, Misiurewicz dendrites) — every item on the user's "likes" list is a
high-ρ / near-root feature; NAV2 RESTS at ρ .30 (a near-circle, dark under the uLum knee, ratio ≈ .3 of NAV's luminance in
§39) and shows the pinch for ~.12 s per beat, never enters a baby, never kicks to a dendrite, and 0 gates fire on real
tracks so it stays in the cardioid. NAV2's c also moves at up to 3.5 u/s on every beat, which may read as jitter. And the
present ask ("stuck in defined locations") is the v0.8 brief verbatim ("bounded by known locations") — NAV2 was that answer
and the user still prefers NAV: the lesson is keep NAV's chart and look, make the walk INSIDE the chart continuous and
music-driven, rather than replace the chart again.

## 5. Mechanics of "reset NAV2 as NAV" (a clone at id 8, key `9`)

Steps (one commit, proven as a no-op, then tuning commits on id 8 alone):
1. Replace `assets/scenes/nav2/*` with copies of `nav/{index.js, nav.js, shaders-v2.js, shaders.js}` (shaders.js only for
   VS_PT/FS_PT + the OKLCH pair; drop OKLCH and the `clipdbg` hook if not wanted). Delete `beat.js detect.js exit.js green.js`.
   Rename: `name 'nav2'`, `id 8`, `home: false`, `always: false`, `score: () => 0`, **no `variants`** (DRUM's `id: 4` must stay
   unique — a second id 4 collides in REG), own state object (`NAV` → `N2`; `hooks.baby` must set the clone's `forceBaby`),
   distinct mkProg names (`julia2-v2`), `rt.label 'nav2'`. `startGridWorker()` is once-per-page (GRIDW) — safe to call twice;
   `extC/getGrid` are shared. Keep the three-line license header (tools/license.js, check.js audits it).
2. `main.js`: nothing — nav2 is already imported and registered at id 8; key `9` → `REG[8]` (hud.js) and `n` cycle work as is.
3. Proof: `IDS="0 8" tools/scene-md5.sh <tag>` twice — **s0 must stay `fb74fee4 / 8a0715df`** (NAV untouched) and s8 should
   equal s0 if the clone is exact (§39's skeleton did: s8 = s0). Then `node tools/check.js` 0 fail (500-line cap, import
   cycles, feats ⊂ FEATS, help.feats ⊂ feats, license, `from(MS)` rule), `node tools/test_field.js` still OK if field.js stays.
4. md5 guard: `tools/accept/v0.29/scene-md5-v029.txt` s8 lines (`2daaa2c0 / f2342b7f`) and `nav2-still-md5.txt` go stale →
   per §83 re-base into a new `tools/accept/v0.34/` (copy the list, replace s8 lines; drop the still file) and point
   `ACC` default + HARNESS at it. `accept.sh` "== nav2" section must be rewritten: it shoots `&still=1` (hook gone), runs
   `test_nav2.js` and `test_green.js`, injects `CARD.NAV = REG[8].scene.state` into the monitor (that part still works: NAV's
   state has the monitor's shape `{mode, cPath, pathCut, kick:{x}, baby}`).
5. Tests: `tools/test_nav2.js` (imports N2/updateNav2/resetNav2/V_MAX/V_INT/RHO_CAP + detect.js) and `tools/test_green.js`
   **break** — delete or rewrite; neither is in `npm test`, both are in accept.sh. A NAV clone cannot be node-tested
   (needs the ray-grid Worker, §39) unless `setGrid(buildRayGrid(...GRIDP))` is seeded as test_field.js does — that is a
   viable new `test_nav2.js`. `assets/math/field.js` can stay (only test_field.js uses it) or go with its test.
6. Director (§93 roster): NAV2 is in the forced-only row — unchanged, no Q trace (§38: bid 0 is never picked). **Gotcha:**
   `core/scenes.js:50` `if (scene.home) SC.home = id` — the LAST registered home wins; a cloned `home: true` would silently
   make id 8 the director's home. Keep `home: false` until the swap. `tools/parity.js` forces `&scene=0` + `CARD.NAV||CARD.home`
   — untouched until a swap (then `&scene=8` + `REG[8].scene.state`, §39's replacement recipe).
7. Landing/site: NAV2 has no `card`, so no tile (no `site/thumbs/nav2.jpg`, `thumbs.sh` PICK untouched); `site/about.html:66`
   describes NAV2 as melody-driven → rewrite; CONTRACTS §1.8 id table + `NAV2*-SESSION-PROMPT.md` + the help text go stale;
   `releases.json` top entry must match package.json on a tag (check.js) + `node tools/whatsnew.js`.
8. Tuning afterwards: every change proven on `IDS=8` lines only (HARNESS "What to re-prove", scene-folder row); s0 is the
   byte-identical control. Port the §46 trace tools: an `n2info()`-shaped hook on the clone (mode, c, h, alpha, ρ=1−h, φ,
   par, bulb p/q, baby, kick, θ, lg) so `nav2-window.py`/`det13.py` keep working (they read `REG[8].scene.hooks.n2info()` and
   `.green()`), and keep `green.js` + `measure()` as the ruler (0.03 ms).
9. Memory rule "no new scenes until asked": not triggered — id 8 is reused, no new id.

## 6. Open questions for the user (max 8)

1. Which track and mode are "@38 s" and "@1m10s" (SeeYouDrop file mode? stream?) — I inferred the basilica pinch at the 1/2
   root (§46 add.5) and the post-58 s drop dust; a per-second trace would confirm before touching a constant.
2. "Move with the music" — which input should move c inside a bulb: the beat (press to the root / rebound to the centre, as
   NAV2's bump), the melody (pitch → angle φ or radius), the bars (a new place per bar/section), or loudness?
3. Keep `interval → bulb` as the species chooser (12 fixed roots), or let the species change on something continuous
   (bass pitch class, key degree, section id) — i.e. is the "stuck" complaint about WHICH place or about not moving within it?
4. Keep the Misiurewicz kicks and the baby dives (the dendrite/filament complexity the user likes comes from them) — yes?
5. The exterior after a drop: shorten NAV's 48-beat peak rule to NAV2's 8 beats (the 1:04 "wobbly" fix), or keep the long
   excursion and only dim it (uExtG / uLum)?
6. "Green when it turns green": should the palette be tied to the key (keycolour.js, as GIELIS/TORUS2) so green is a chosen
   state, or is the drifting hue wheel fine and only the exposure at green needs the knee?
7. Spirals "too chaotic": is that the exterior line-trap sweep (rotates π per beat) or the interior spokes? Slow the trap
   rotation (one turn per bar?) vs reduce `uCurl`-style tightness.
8. Drop OKLCH from the clone (saves a shader pair and the clipdbg hook) and DRUM (already score 0)? And should the swap
   (NAV2 → id 0 / home) be planned now or only after the look is approved?
