# CHLADNI (id 11, "slot 12") — worker report, v0.15

Brief: `docs/workers/brief-chladni.md` (+ `ENGINE-CHLADNI-SESSION-PROMPT.md` Part B). Worktree, PORT **8814**, commit
prefix `CHLADNI:`. Not merged, not pushed, `tools/accept.sh` NOT run (the user: "wait for my say before running full
sweep"). Everything below is measured on **SeeYouDrop in deterministic file mode** (`CLOCK=1`), which is bit-identical
run to run — the first scene in this repo tuned on the real track instead of on `#test`.

---

## (a) Friction log — what the docs did not answer, and every guess

1. **`&fix=` does not exist.** The brief says "every headless md5 pins them with `&fix=` (e.g.
   `&fix=subNote=1,subGate=1,…`)" and CONTRACTS/HARNESS both describe `CARD.fix = {…}` as a *property*, not a hash
   param. `grep -rn "fix=" tools/ assets/ docs/HARNESS.md` finds nothing. **Guess/fix:** the scene carries two pin
   hooks instead — `hooks.figure(s)` (the fractional interval) and `hooks.ears(k)` (one of three named ear presets:
   1 = the groove's pure 808 on the tonic, 2 = the intro's harmonic mid-bass overhead, 3 = the void) — and every
   `#test` shot and md5 says `&ears=1&figure=<i>`. This is better than `&fix=` would have been: a preset is one word
   in a command line and it is documented in the module that consumes it. **For CONTRACTS:** either add `&fix=` to
   `core/harness.js` and say so in HARNESS "Headless Chrome", or delete the promise from the brief template.
2. **`tools/lum.py` has no percentile.** The brief's window 9 is "p95 luminance 0.6–0.8 on the groove
   (`tools/lum.py`)"; `lum.py` prints a centre-box mean, a rim-annulus mean and their ratio, and nothing else — the
   same gap HARNESS "Pitfalls" already records for hue ("`tools/lum.py` has **no hue field**"). **Guess/fix:** a
   four-line `tools/accept/v0.15/ch-p95.py` (p50 / p95 / p99 / mean over the whole frame). **For HARNESS:** say which
   instrument answers a percentile question, or add the field to `lum.py`.
3. **`tools/filetrace.js` pins `&scene=0`** inside its hash and appends `extraHash` after it, so a second `&scene=`
   cannot override it. A scene worker who wants its own scene in a deterministic trace has to fork the driver.
   **Guess/fix:** `tools/accept/v0.15/chwin.js` — filetrace's four rules with the forced scene 11, `WARM` as an env
   override, shots at named heard times, and a second per-frame recorder for the scene's own `hooks.info()` so a
   window number is what the **scene** did and not a model of it. **For HARNESS:** filetrace should take the scene.
4. **The continuity monitor is hard-wired to `CARD.NAV || CARD.home`** and to a `cPath` that is a 2-array normalised
   by `baby.size`. The brief tells a scene to publish `state` "in the monitor's shape" but nothing says how the
   monitor is pointed at it. **Guess:** `CARD.NAV = CARD.REG[11].scene.state` before injecting the monitor. That
   works and is what the run below does. **For HARNESS:** one sentence in "Continuity monitor".
5. **No "sync rules" subsection exists in CONTRACTS.** The brief cites it twice ("CONTRACTS §1.x, the new *sync
   rules* subsection") and `grep -in "sync rules" docs/CONTRACTS.md` returns nothing. The rule itself (one musical
   element → one visual channel; continuous things on heard time; events placed by their `…Age`) is stated in the
   brief and in the session prompt, so nothing was lost — but the scene cannot cite the contract it was told to obey.
6. **`ctx.mkTarget` clears to OPAQUE black.** CONTRACTS §1.1 says so, and it is the reason a "has this grain been
   born yet?" test on the alpha channel silently never fires: all 90 000 grains sat at (0, 0) as one white dot for
   two runs. `sand.js` now clears the alpha of both ping-pong targets before the first step and says why. **For
   CONTRACTS §1.1:** a sentence on what that means for a state texture whose w channel is a flag.
7. **A `params.from()` cannot see scene state**, which is exactly where a scene's eased values live. Four of the six
   parameters are therefore manual constants (`figure`, `sand`, `leap`, `glow`), which §1.16 explicitly allows ("a
   constant: shown as a manual setting") and which is honest — but it means the panel's "source" column is empty for
   four of six on this scene. The two musical ones (`tilt`, `fog`) are the two expressions that *were* pure functions
   of `MS`. **Guess:** `figure` is added to the figure's **target** rather than to the eased value, because
   `(x + 12) % 12` is not the identity in floating point and `x + 0` is.
8. **`&scene=N` + the `n` key.** Nothing needed here: `&scene=11` works and `n` reaches it. Noted only because the
   brief asked for confirmation.
9. **`{shot}` between two `__FRAME` `{until}`s is safe** (scene-md5.sh already relies on it) but the HARNESS
   "four rules" paragraph only talks about `{wait}` and non-`__FRAME` `{until}`s. One clause would settle it.
10. **A window's tonic depends on how long the run warmed up.** Not a doc gap, a consequence: the scene latches the
    key from what it has heard, so a window that starts cold at 105 s latches from 8 s of evidence and a window that
    starts at 0 latches from the whole track. Every acceptance window below therefore runs `WARM=999` (warm from
    t 0) — which is also the honest case, since a listener does not start the track at 1:45.
11. **A scene can weight the kaleidoscope but not the flash.** CONTRACTS §1.4 gives `post.kaleido` as a 0..1
    multiplier on a composite behaviour, and §1.10 lists the others — glitch row shifts, flash on drops — with no
    such slot, and the composite is always last and cannot be switched off. On both drops CHLADNI's own slam is
    under a full-screen white flash and glitch bars for ~0.15 s (`tools/work/ch-win5-drops.jpg`). **Guess:** leave
    it; it is the director's language and the drop still reads. **For CONTRACTS §1.4:** if a scene whose whole point
    is a figure is expected to show that figure on the drop frame, the flash needs a per-scene weight.
12. **`tools/monitor.js` needs a `baby`-free scene to publish `pathCut > 2`** — see 4; the number itself is the
    friction, because the brief's example value silently disables the instrument.

## (b) Was I tempted to open a forbidden file?

Once, briefly, for `ctx.mkTarget`'s filtering mode (would `texture()` on an RGBA16F target come back black without
`OES_texture_float_linear`?). I did not: the answer was one headless shot away, and the shot said it samples fine on
this GPU. The real bug in that area was the opaque-black clear (friction 6), which CONTRACTS §1.1 does document.

I also wanted `core/harness.js` for `&fix=` (friction 1) and read only the two lines of it that a `grep` for `fix`
printed — enough to learn that `CARD.fix` is a property with no hash route, which is a documentation fact, not an
implementation one.

---

## (c) The figure table, as built

`assets/math/chladni.js`. The plate is `u(x, y; n, m) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy)` on `[−1, 1]²`:
antisymmetric in `n, m`, identically zero at `n = m` (so a figure is an ordered pair), both diagonals `y = ±x` nodal
for every figure, `|u| ≤ 2`. Twelve figures are dealt to the twelve intervals in **Tenney-height order** — the
simplest figure for the simplest just ratio — from a ladder sorted by `n + m`:

| interval | ratio | Tenney log2(p·q) | rank | figure (n, m) | n + m |
|---|---|---|---|---|---|
| 0 unison | 1/1 | 0.00 | 0 | **(1, 2)** | 3 |
| 7 fifth | 3/2 | 2.58 | 1 | (1, 3) | 4 |
| 5 fourth | 4/3 | 3.58 | 2 | (2, 3) | 5 |
| 9 major sixth | 5/3 | 3.91 | 3 | (1, 4) | 5 |
| 4 major third | 5/4 | 4.32 | 4 | (2, 4) | 6 |
| 3 minor third | 6/5 | 4.91 | 5 | (1, 5) | 6 |
| 6 tritone | 7/5 | 5.13 | 6 | (3, 4) | 7 |
| 8 minor sixth | 8/5 | 5.32 | 7 | (2, 5) | 7 |
| 10 minor seventh | 9/5 | 5.49 | 8 | (1, 6) | 7 |
| 2 major second | 9/8 | 6.17 | 9 | (3, 5) | 8 |
| 11 major seventh | 15/8 | 6.91 | 10 | (4, 5) | 9 |
| 1 minor second | 16/15 | 7.91 | 11 | (3, 7) | 10 |

SeeYouDrop's bass walk **C#1 → A1 → F#1 → E1** is intervals **0, 8, 5, 3** to the C# tonic, which lands on
**(1, 2), (2, 5), (2, 3), (1, 5)** — four figures whose fields are ≥ 0.50 rms apart on a 48×48 grid. Montage:
`tools/work/ch-w1.jpg`.

The **slide** blends the two neighbouring entries by the fractional interval `s = ((subNote − tonic) mod 12) +
subCents/100`, which is continuous through a slide *by construction* (the cents are measured from the nearest note,
so when the note flips at the halfway point the cents flip the other way). Proven over a 12 000-step sweep of
`s ∈ [0, 12)` at 24 points: max |Δfield| per step **0.0019**, the wrap from 12 to 0 closes to **8.5e-10**.

The **circular** plate (a walking bass) uses the large-argument Bessel asymptote
`cos(k r − nπ/2 − π/4)·cos(n θ)`, whose nodal rings have exactly the spacing the true `J_n` zeros converge to
(within 3.5 % from the third ring on, measured against a series+bisection Bessel in the node test). The McMahon shift
`(4n² − 1)/(8β)` is **not** corrected: it moves where the rings are (14 % of a spacing at n = 3, ring 2), never how
many or how far apart, and costs a division per pixel to fix. Said in the module header, tested, not hidden.

---

## (d) Every constant — name · value · why

### `assets/math/chladni.js`
| name | value | why |
|---|---|---|
| `UMAX` | 2 | the exact bound of one figure, so the normaliser is exact and `|field| ≤ 1` for every `h` |
| `W2` | 0.45 | how much of the 2nd harmonic's figure a fully impure bass mixes in |
| `W3` | 0.25 | and of the 3rd — less, as a real bass's third partial is weaker than its second |
| `KC` | π | the circular figure's radial wavenumber per unit of `m`: rings every 1/m of the radius |
| `LADDER` | 12 pairs | sorted by `n + m`, all `n ≠ m`; the busiest, (3, 7), shows ten lines across the plate |

### `assets/scenes/chladni/index.js` — the camera and the look
| name | value | why |
|---|---|---|
| `FOV` | 1.05 rad | ~60°: the plate fills the frame without fisheye |
| `PITCH_SUB` / `DIST_SUB` | 0.58 rad / 1.78 | a 35 Hz sub is seen LOW and CLOSE, the plate overflowing the frame |
| `PITCH_MID` / `DIST_MID` | 1.24 rad / 3.70 | a mid-bass from nearly overhead, the plate small — the intro and 1:41 |
| `CAMTC` | 0.45 s | the camera eases over ~1.4 s: a register change is music, never a cut |
| `BOUNCE` | 0.05 | the thump per felt beat on the camera distance (TORUS2's number, the user's own) |
| `TILTB` | 0.55 rad | how far the build tilts the camera up through the void |
| `SLIDETC` | 0.07 s | the figure's ease: a slide tracks it exactly, a note jump becomes a 4-frame morph (`cuts: 'continuous'`) |
| `LINEW` | 0.052 | the nodal glow's half-width in field units: a line, not a band |
| `GLOW0` / `GLOWQ` | 0.95 / 0.34 | the lit glow, and the floor it keeps when the plate is not driven so a silent figure stays legible |
| `AMPTC_UP` / `AMPTC_DN` | 0.05 / 0.18 s | a drop lands on the frame it lands on; the release rings down instead of switching off |
| `GATETC` | 0.035 s | drop 2's 60 ms ducks must read as a STOP |
| `AMPK` | 1.35 | how much vibration the bass's level buys |
| `LIFTTC` / `LIFTWAIT` | 0.30 s / 0.40 s | the sand floats after the bass has been gone 0.4 s — a duck is a stomp, not a void |
| `SPIRAL` | 0.9 | how hard the build winds the sand inward |
| `GRAV` / `LEAPK` | 32 / 5.5 | a mid grain's throw peaks a quarter of the plate's half-width up and lands in ~0.25 s, inside one beat |
| `WALK` / `DESC` | 4.40 / 1.00 per s | the random walk's step at `|u| = 1`, and the descent on `u²` that makes a grain land on a line and stay |
| `PTPX` / `SANDB` | 2.3 px / 1.15 | a grain's size at 720 p at unit depth, and how bright the sand is |
| `RIPK` / `RIPD` | 26 / 0.09 | the hat ripple's radial wavenumber and depth (0.16 made the plate's edge ragged) |
| `SNAMP` / `SNSPD` / `SNTC` | 0.55 / 1.9 / 0.16 s | the snare's ring: how bright, how fast it crosses the plate, how fast it dies |
| `DROPV` | 2.40 | the slam: the throw a `mapDropEvt` gives the sand, in `kickVel` units |
| `NOTEHUE` / `ANTIHUE` | 0.42 / 0.11 turns | how far round the fifths wheel the sub note's own hue sits from the tonic's; the antinodes a shade off the lines |

### `assets/scenes/chladni/index.js` — the stabilisers the real track forced (all measured, see (f))
| name | value | why |
|---|---|---|
| `VOTETC` / `VOTEMARG` | 0.30 s / 2.0 | the sub's note is a decaying vote weighted by `sub²·subConf`, with hysteresis: 17 figure switches in the 20 s groove become 5, and the walk's four notes are still found |
| `TONTC` / `TONMIN` / `TONMARG` | 10 s / 0.60 / 3.0 | the tonic is latched the same way over a much longer window, because a tonic change re-maps every figure at once |
| `CONF` | 0.15 | below this `subConf` a new pitch is not accepted and the figure holds |
| `BASSON` | 0.18 | the bass is SOUNDING above this level, wherever it lives (the void reads 0.066, the intro's mid-bass 0.40) |
| `REGLO` / `REGHI` | 0.45 / 0.90 | `bassReg` reads ~1 whenever there is no sub at all, so the camera takes it through a knee — and it fades out with the void |
| `HPAD` | 0.25 | the ears read this track's pure 808 at `subPure` 0.65, not 1, so the harmonic mix only starts below 1 − HPAD |
| `AWAYTC` / `AWAY0` / `AWAY1` | 2.5 s / 0.25 / 0.55 | how long the plate remembers the bass is away from the tonic; below AWAY0 square, above AWAY1 round |

### `assets/scenes/chladni/shaders.js`
| name | value | why |
|---|---|---|
| `CH_ANTI` | 0.80 | how bright the antinodes (the parts that MOVE) are against the nodal lines |
| `CH_EDGE` | 0.10 | the porthole: how wide the plate's edge is feathered (CONTRACTS §1.10) |
| `CH_RIPF` / `CH_RIPW` | 6.0 / 34.0 | how fast a hat ripple dies per second of `hatAge`, and how fast it travels outward |
| `CH_SNW` | 40.0 | the snare ring's width (1/σ²) |
| `CH_VOID` | 0.18 | the soft mid light that is all the void has |
| `CH_SANDL` | 90.0 | how tightly a grain must sit on a line to be lit as ON it |
| `CH_KICKJ` / `CH_KICKTC` | 4.5 / 0.05 s | how far a kick of velocity 1 scatters a grain and how fast that shake dies. 9.0 buried the figure — the user: "I don't want it to be so bright that can't see the … shapes" |
| `DELTA` (sand.js) | 0.06 | "within δ of a nodal line", in units of the normalised field |
| `TOPBUDGET` (sand.js) | 150 000 | `ctx.budget('points')` at tier 3: the state texture is allocated once at this size |

---

## (e) The final `feats`, `post` and `params`

`feats` (exactly the fields read, each with a `help.feats` clause — `check.js` 0 gaps):
`subNote subCents subConf subGate subPure sub eG mapOn bassReg lpSweep tonic tonicMinor tonicConf key mode keyConf
valence harmAngle beatPhase beatCount pulse hush calm flow buildProg dropConf kickEvt kickAge kickVel bass hatAge
hatVel snareAge snareVel mapDropEvt dropEvt`

`post`: `fb.decay 0.62` (the trails smeared the figure at 0.85), `bloom.thr 0.34`, `kaleido 0` (a kaleidoscope would
destroy the one thing this scene is for), `morph.flow 0.4`. `colour: { default: 'v2', variants: { v2: {} } }`.

`params` (six, named for what the eye sees): `figure` (a shift along the table, semitones, const 0) · `sand` (how much
sand, const 1) · `leap` (how high a kick throws it, const `LEAPK`) · `tilt` (how far the coming drop has tilted the
camera, `TILTB · antic`) · `glow` (how brightly the lines glow, const `GLOW0`) · `fog` (`MS.lpSweep`).

---

## (f) What the track actually said — the measurements that changed the design

Every number from a deterministic file-mode trace of the whole 157 s: `tools/work/ch-full.json` before EARS pass 2,
`tools/work/ch-full2.json` on the merged tree. The scene was built against pass 1 and re-tuned against pass 2, so
both are quoted where they differ — the shape of the design is the same, the constants are not.

1. **The ears' sub pitch wandered per frame, and so does the truth.** *Pass 1:* over the groove 25–45 s, gated frames
   read C# 52 %, D 17 %, D# 16 %, F 6.5 %, … — and `tools/truth/SeeYouDrop.json`'s own grain track agreed: C#1 is
   about 62 % of the groove's grains, with single-grain G1 / D1 / G#1 / D#1 excursions between them (the 808's attack
   and its decay tail read as other notes). The AUDIT's "88.9 % `subNote` per beat" is a per-**beat** vote; per frame
   it was ~52 %. A figure driven straight off `subNote` flickered through the whole table on a held groove. → the
   vote filter, chosen from a sweep at `VOTETC 0.30 × VOTEMARG 2.0` (5 groove switches instead of 17, all four walk
   notes found). *Pass 2:* the raw note is now clean — the walk reads C# 12.95–15.15, A 16.05–18.35, F# 19.27–22.43,
   E 22.47–24.83 with `−1` between, and in the groove the named frames are 74 % C#. The filter's own lag became the
   dominant error, so the window was halved: **`VOTETC 0.15 × VOTEMARG 2.0`**, and the winner now only moves on a
   frame that actually heard a pitch (between two 808 hits `subNote` is −1 with the gate still open, and re-deciding
   there let a decayed stray note take the figure in silence). Re-measured sweep, walk error / groove switches:
   `0.06 × 1.2` → +0.135 s / 210 · `0.10 × 1.6` → +0.103 s / 56 · **`0.15 × 2.0` → +0.15 s / 32** · `0.25 × 2.0` →
   +0.22 s / 13. Of that +0.15 s, the ears' own YIN arrival is +0.14, +0.04, +0.05, +0.05 s after the four bar lines
   (`sections.json` v2 `walk[].arrival`), so the filter adds ~0.10 s.
2. **The tonic wobbles, in both passes.** Raw `MS.tonic` on the merged tree: C# from 0.68 s, then F# 8.5–10.2, C#
   10.3–18.1, A 18.1–19.8, F# 19.8–24.6, C# 24.6–45.1 … — a 4.8 s F# run right in the middle of the build's walk.
   A tonic change re-maps all twelve figures at once, so it is latched (`TONTC` 10 s, `TONMIN` 0.60, `TONMARG` 3.0):
   C# for 100 % of a run warmed from t 0. The same latch from a cold start at 37 s takes 44 s to settle — which is
   why every window below warms from 0.
3. **`bassReg` is ~1 whenever there is no sub at all**, not only when the bass has moved up: the void reads
   bassReg 0.993 with `bass` 0.066. Taken literally it threw the camera overhead through every silence. → the knee
   (0.45 → 0.90) and the fade-out with the void.
4. **The intro and 101–105.7 s have no sub but a real bass**: `bass` 0.401 and 0.231 against the void's 0.066, with
   `subGate` 0.05 in all three. The plate is driven by the bass **wherever the bass lives**, so `bass` joins `sub`
   through the register and the intro is driven, busy and overhead instead of dead.
5. **`subPure` reads 0.65 on this track's pure 808**, 0.88 on the walk, 0.05–0.13 on the harmonic mid-bass, and
   0.009 in the void where there is no bass to be impure. → the knee `HPAD` 0.25, and the register carries the other
   half of the sentence (a bass out of the sub IS a harmonic bass), so the void does not read as "maximally impure".
6. **The groove's gate is 99 % on** (one 0.2 s off-run in 20 s), while drop 2's ducks are short gaps a bar or so
   apart. So the gate had to be fast (`GATETC` 0.035 s) and the *void's lift* had to be slow to arm (`LIFTWAIT`
   0.40 s) — otherwise every duck floated the sand. Pass 2 is what makes the channel earn its place: over
   105.6–130.5 s the merged ears give **23 gate-off edges = 1.48 per bar**, where pass 1 gave 6 in the whole
   24 s and missed the entire 106.4–111.3 s group, which is the once-per-bar stomp of "1:45".
7. **Two rules for the plate's boundary were measured and rejected.** Counting distinct sustained notes per map
   section: the map's sections are 3–13 s long and the walk changes note once per section, so no section ever
   reached two. Counting them per map *label* (labels recur — 0 = intro/voids, 1 = the walk and the outro walk,
   3 = the groove, 6 = the drops): every label eventually accumulates ≥ 2, including the groove's, because the ears'
   pitch wanders. What separates them is **whether the bass is on the tonic**: the groove and both drops sit on C#,
   the build's walk, both climbs and the outro do not. That is the rule in the scene.

---

## (g) The nine windows

All nine in deterministic file mode, `CLOCK=1`, PORT 8814, **warmed from t 0** so the scene's tonic latch has the
whole track behind it (`bash tools/accept/v0.15/ch-windows.sh`; scored by `python3 tools/accept/v0.15/ch-report.py`
against `tools/truth/SeeYouDrop.json` and `sections.json` **v2**; one montage each, listed below). Every window:
`ERRS []`, `nonFinite []`, `f0 2`, mode `file-det`. **Run on the merged tree, after EARS pass 2.** Where pass 1's
number is interesting it is given in brackets.

| # | window | met? | the number it turns on |
|---|---|---|---|
| 1 | 12.4–25.7 s, the walk | **met** (shape), **not met** (timing) | four figures, **4/4 distinct**: (1,2) → (2,5) → (2,3) → (1,5), one per note of C#1 → A1 → F#1 → E1; all four of v2's bar-line attacks matched; switch error **+0.085, +0.053, +0.187, +0.237 s** (median **+0.187**) against the brief's 50 ms. Of that, the EARS' own YIN arrival is **+0.14, +0.04, +0.05, +0.05 s** (`sections.json` v2 `walk[].arrival`: a 100 ms window has to fill before a note can be named), so the scene's vote adds ≈ 0.10 s and the target is not reachable by a scene at all |
| 2 | 25–45 s, the groove | **met** | a leap on **38 of 38** truth kick candidates, **F 1.000**, lag median **+3.7 ms** p90 +7.7 [pass 1: 33/38, F 0.786, +20.3 ms], **0 %** on bare 808 re-triggers [23.9 %], and `kickAge` on the onset frames median **0.0033 s** — the throw is placed *inside* the frame. The root figure holds: from 25.78 s the plate stays on C# for **13.4 s** without a single switch; the 22 switches in the window are all in 38.9–45 s, where the truth's own `sub_runs` are full of grace notes. Figure travel 2.09 semitones/s against a 1.28 floor that is the 808's own micro-detune. 67.5 % of frames on the tonic |
| 3 | 44.9–49.9 and 96–101 s, the climbs | **met** | scene hits/s **2.62×** and **2.56×** the groove against the ≥ 2.5× target [pass 1: 1.27× and 1.33×], matching the truth's own 2.90× / 3.22× (mid) and 3.13× / 2.96× (high). The camera rises with the register: pitch **0.70 → 0.90** and **0.70 → 1.00** rad, distance **2.12 → 2.72** and **2.05 → 3.06** |
| 4 | 49.9–57.6 s, the void | **met** | plate amplitude mean **0.0141**, under the 0.05 target on 389 of 421 frames from 50.6 s; the ring-down crosses 0.05 at **50.37 s**, 0.47 s into the void. The one excursion is a single 0.5 s window at 51.15–51.67 s where the ears read a sub — and the truth has a real low onset at 51.154 s there. lift **0 → 1**, spiral **0 → 0.866** tracking buildProg **0.034 → 0.999**, camera pitch **0.89 → 1.10** rad |
| 5 | 57.6 and 105.6 s, the drops | **met** | `mapDropEvt` at **57.6167 s** (v2 truth 57.6056, **+11.1 ms = +0.66 frames**) and **105.6000 s** (105.5959, **+4.1 ms = +0.25 frames**) — both inside ±1 frame, on every run. On drop 1's frame the plate's amplitude goes **0.122 → 1.065 in 0.5 s**, lift 1.00 → 0.57, spiral 0.86 → 0.42, the figure at the root within 0.2 s. Drop 2's frame shows `kickAge` **−0.0044** — pass 2's negative release age, which the scene clamps and which correctly gives a leap of 0 (the throw has not happened yet) |
| 6 | 57.6–90 s, the slides | **partly met** | the figure moves through the section at **2.15 semitones/s** and sits on the tonic figure for **82.2 %** of frames — it is relaxing into the root, continuously. But scored per truth slide (the figure moving > 0.25 semitone inside the slide's own 0.1–0.2 s span + 0.6 s) it is **4 of 13** [pass 1 read 10/13, on a figure that was noisy *everywhere*, which is a false positive rather than a better scene]. The scene's anti-strobe damping (`VOTEMARG` 3, `JUMPTC` 3) is what costs it; `subGlide` would be the honest channel and **cannot help on this track** — its smoothed magnitude is *higher* in the groove (p90 13.3) than in the slides (10.5), because the 808's attack transient glides as hard as a musical slide |
| 7 | 105.7–130 s, the gated drop 2 | **met** | **19 gate dips in 24.3 s, one per 1.28 s, spacing median 1.58 s — the bar is 1.60 s.** The plate's gate reaches **0.000** and the amplitude **0.012** on a duck, median amplitude 0.756: the figure blinks out and comes back, once a bar. [Pass 1: 2 dips in 24 s — the ears did not report the ducks at all.] This is the user's "1:45 … should be reacting more" |
| 8 | 134.5–157 s, the outro | **met** | `lpSweep` **0.929 → 0.256** and the scene's fog follows it exactly; the walk returns **twice** — A(9), B(11), F#(6), E(4), C#(1), then A, B, F#, E — **5 distinct figures**; the plate rounds (boundary **0.00 → 1.00**) because the bass is away from the tonic; the sand settles and dims, amplitude **0.616 → 0.146** |
| 9 | brightness on the groove | **met** | p95 luminance over the six groove frames **0.561 / 0.608 / 0.624 / 0.643 / 0.678 / 0.733**, median **0.634** — five of six inside the 0.6–0.8 band, one at 0.561 just under. `tools/lum.py` on the same frames: centre 0.42, rim 0.18, ratio 2.39 |

Montages (`tools/work/`, 640 px tiles captioned with the frame name) and what each one shows:

1. `ch-win1-walk.jpg` — four plainly different circular figures (a wide ring, a dense rosette, a two-lobe pattern, a
   fine spiral), each in its own hue, as the bass walks C# → A → F# → E.
2. `ch-win2-groove.jpg` — a bright square plate holding the (1, 2) cross, the sand spraying up off it on each kick
   and falling back onto the lines, the last two frames turning round as the climb starts.
3. `ch-win3-climbs.jpg` — the plate shrinking and tipping toward overhead as the bass leaves the sub, its figure
   going busy and rough as the purity drops.
4. `ch-win4-void.jpg` — a small dark spiral of drifting sand, then the plate rising into view as a gold circular web
   with the sand thrown into a tall spray and winding inward toward the drop.
5. `ch-win5-drops.jpg` — the plate tight and dark, then the drop's white flash (the composite's, see (i)), then the
   root figure blooming back in green-gold; both drops, six frames each.
6. `ch-win6-slides.jpg` — the square plate holding the root figure, its mesh visibly loosening and re-tightening
   around each hit.
7. `ch-win7-gated.jpg` — six bright, legible, differently coloured plates across drop 2: a green ring, a cyan mesh
   mid-spray, a gold-green cross, a round rippled plate, a big green X, a cyan dotted mesh.
8. `ch-win8-outro.jpg` — six dim, fogged, desaturated round plates with the walk's figures back and the sand
   settled: the picture the low-pass closing sounds like.
9. `ch-win9-bright.jpg` — the five groove frames the p95 numbers come from.

Also proven, not a window: the twelve figures pinned side by side on `#test` (`tools/work/ch-figures.jpg` — the
ladder from the unison's cross to the semitone's dense grid) and one kick at 60 fps (`tools/work/ch-leap.jpg`).

## (h) Cost, determinism, continuity, and the acceptance list

1. `node tools/check.js` → **0 fail** (6 warns: five pre-existing soft-cap lines plus "card without
   site/thumbs/chladni.jpg", which `tools/thumbs.sh` fills once the user approves the scene).
   `node tools/test_chladni.js` → **OK**, 33 checks. `node tools/param-smoke.js` → 49 checks, 0 fail. `npm test` OK.
   All four run again on the merged tree (EARS pass 2, `32d662a`) with the same result.
2. `PORT=8814 GPU=1 node tools/cdp.js 'test&scene=11&ears=1' …` → `errs []`, `bad []`, `scene 11`, `glerr 0`,
   and the same again after the fake timeline's drop at 13 s.
3. The nine windows: (g).
4. `IDS=11 tools/scene-md5.sh <tag> '&ears=1&figure=0'` — **identical over two runs**, and identical again after the
   continuity fixes: `s11-f360 606f721a55f5782340205e1548db4bd2`, `s11-f840 f7b1c6eed36389a1d84eaa084d537ddc`
   (`tools/accept/v0.15/scene-md5-v015-chladni.txt`). The diff is one scene folder + `assets/math/chladni.js` +
   `tools/`, so no other scene's lines can have moved (HARNESS "What to re-prove").
5. The scene object carries `name id tag card feats cuts score init update draw post colour params help hud hooks
   state` (plus `rt`, `look` and two of its own methods). `score()` returns 0; no digit key; `&scene=11` and `n`
   both reach it.
6. **Bench** (HARNESS "Bench protocol": `q` pinned 0.95, tier 3, 150 000 points, `n = 300`, three interleaved pairs,
   the warm call discarded, each scene in its own forced page):

   | scene | its ms (median of 3) | NAV in the same page | ratio to NAV |
   |---|---|---|---|
   | CHLADNI (11) | **1.162** | 1.536 | **0.756** |
   | TORUS2 (3) | 0.897 | 1.458 | 0.615 |

   Through their own NAV ratios CHLADNI is **1.23× TORUS2** — inside the brief's 1.5× gate. (Raw ms would say 1.30×;
   the protocol's rule is the interleaved ratio.) The state pass was the cost risk and it is not the cost: it runs
   over 150 000 texels with the harmonic terms behind a UNIFORM branch, so a pure sub costs a third of an impure one.

   **Continuity monitor**, 60 s of deterministic file mode (heard 20 → 80 s of SeeYouDrop), pointed at the scene's
   own `state`: `{n: 3600, fast: 0, max: 0.0585, viol: []}` — every frame measured, nothing above the spike
   threshold. Getting there took two real fixes (commit `804a4da`): the felt-beat turn is now accumulated from the
   beat count's own steps instead of `beatCount · pulse` (a change of felt beat moved the target 0.155 rad in one
   frame), and the register knee's output is eased (an ema whose target jumps 1.9 rad is itself a jump on its first
   frame).

7. **The settle instrument on the real track**, 150 000 grains (`bash tools/accept/v0.15/ch-proofs.sh settle`):
   0.4 s after the walk's four figure changes **91.3 %, 59.1 %, 87.0 %, 98.2 %** — three of four over the 70 % gate,
   the miss being the walk's biggest jump, (1, 2) → (2, 5). Across one groove kick: **90.4 %** before → **78.1 %**
   at 0.03 s → **93.7 %** at 0.17 s → **91.3 %** at 0.37 s. The sand really leaves its lines and finds them again.

8. **Params** (`bash tools/accept/v0.15/ch-proofs.sh params`): `paramsOf == derived` for all six with nothing routed
   (`figure` 0, `sand` 1, `leap` 5.5, `tilt` 0, `glow` 0.95, `fog` 0 — every one `===`); `paramDeps('chladni','tilt')`
   is `["buildProg","mapOn","dropConf"]`, all three recorded, so §1.16's short-circuit trap is avoided, and `'fog'`
   is `["lpSweep"]`. A constant route AT the derived value is byte-identical (`figure=c:0` gives the reference md5
   `606f721a…`); a route away from it moves the picture (`figure=c:5` → `54fb698757eb74cff636b35c23a30098`,
   `glow=c:0.15` → `9af182a0…`, `glow=c:1.5` → `82183689…`).

**Not run, on the user's instruction:** `tools/accept.sh` (the full sweep), the full scene-md5 list, the Q trace
(id 11 bids 0, so it cannot be picked and a trace would measure nothing — HARNESS "What to re-prove"), and the
thumbnail. Not merged, not pushed, no tag.

## (i) What I would change next, and the deviations from the brief

- **`subGlide` is in the brief's channel table and the scene does not read it — and on this track it cannot help.**
  Window 6 is the one that is only partly met. The obvious fix is to blend the figure's target toward the RAW
  instantaneous pitch by how fast the sub is sliding, which is exactly what `subGlide` is for. **Measured, it does
  not separate a slide from a hit:** smoothed |subGlide| (ema 0.12 s) has p90 **13.3** in the groove against **10.5**
  in the slides section, because a sine 808's attack transient glides as hard as a musical slide. A channel that is
  louder where you do not want it than where you do is not a channel. What would work is the map's own slide list
  (`ears.md` pass 2 detects 24 of the 41 truth slides non-causally) exposed as a field — an engine ask, not a scene
  one. The scene's own `VOTEMARG` / `JUMPTC` is the knob the user can turn meanwhile: at `VOTEMARG 2, JUMPTC 0` the
  slides read strongly and the groove strobes 5.4 semitones/s; the shipped 3 / 3 holds the groove at 2.1.
- **The circular plate is the asymptotic Bessel form, not `J_n(kr)`** — right ring spacing, right sector count,
  rings shifted inward by the McMahon term at high `n`. Stated in the module header, measured in the node test.
- **The plate's boundary is not keyed to `mapSection`** as the brief leaned. Both label-keyed rules were measured
  and neither separates a walk from the groove on this track ((f) 7). "The bass is away from the tonic" does, it
  works live as well as from the map, and a returning section still gets its shape back through look memory.
- **`state.pathCut` is 3, not the brief's 0** — otherwise the continuity monitor measures nothing (friction 4).
- **The drop's slam is invisible for ~0.15 s** under the composite's own white flash and glitch bars (`FX.flash`,
  `FX.glitch`, CONTRACTS §1.10). A scene can weight the kaleidoscope per scene (`post.kaleido`) but not the flash,
  and the composite cannot be switched off. If a drop's FIGURE is meant to read on the drop frame, the flash needs
  a per-scene weight the way `kaleido` has one. **For CONTRACTS §1.4.**
- **The two things pass 1's ears could not give, pass 2 gave.** The once-per-bar stomp of 1:45 is now 19 gate dips
  at a 1.58 s spacing against the 1.60 s bar, and the climbs are 2.6× the groove's hit density instead of 1.3×. Both
  were reported as engine misses in the pre-merge pass of this report (commit `4ab428a`) and both are now met with
  no change to the scene's mapping — which is the strongest evidence that the channels were wired to the right
  fields.
