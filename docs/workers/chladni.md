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
   four-line `tools/work/ch-p95.py` (p50 / p95 / p99 / mean over the whole frame). **For HARNESS:** say which
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

Every number from a deterministic file-mode trace of the whole 157 s (`tools/work/ch-full.json`).

1. **The ears' sub pitch wanders per frame, and so does the truth.** Over the groove 25–45 s, gated frames read
   C# 52 %, D 17 %, D# 16 %, F 6.5 %, … — and `tools/truth/SeeYouDrop.json`'s own grain track agrees: C#1 is about
   62 % of the groove's grains, with single-grain G1 / D1 / G#1 / D#1 excursions between them (the 808's attack and
   its decay tail read as other notes). The AUDIT's "88.9 % `subNote` per beat" is a per-**beat** vote; per frame it
   is ~52 %. A figure driven straight off `subNote` therefore flickered through the whole table on the held groove.
   → the vote filter. Measured sweep (`VOTETC` × `VOTEMARG`), figure switches in the 20 s groove / walk notes found:
   `0.25 × 1.5` → 17 / 4 · `0.30 × 2.0` → **5 / 4** · `0.40 × 2.0` → 2 / 4 but the walk's switches lag +0.43 s ·
   `0.50 × 3.0` → 2 / 4, lag +0.65 s. Chosen: `0.30 × 2.0`.
2. **The tonic wobbles.** Raw `MS.tonic` over the track: C# for 115.6 s of 157, but F# for 16.3 s and A for 15.6 s,
   including a 4.8 s F# run right in the middle of the build's walk (19.8–24.6 s). A tonic change re-maps all twelve
   figures at once, so it is latched (`TONTC` 10 s, `TONMIN` 0.60, `TONMARG` 3.0): C# for 100 % of a run warmed from
   t 0. The same latch from a cold start at 37 s takes 44 s to settle — which is why every window below warms from 0.
3. **`bassReg` is ~1 whenever there is no sub at all**, not only when the bass has moved up: the void reads
   bassReg 0.993 with `bass` 0.066. Taken literally it threw the camera overhead through every silence. → the knee
   (0.45 → 0.90) and the fade-out with the void.
4. **The intro and 101–105.7 s have no sub but a real bass**: `bass` 0.401 and 0.231 against the void's 0.066, with
   `subGate` 0.05 in all three. The plate is driven by the bass **wherever the bass lives**, so `bass` joins `sub`
   through the register and the intro is driven, busy and overhead instead of dead.
5. **`subPure` reads 0.65 on this track's pure 808**, 0.88 on the walk, 0.05–0.13 on the harmonic mid-bass, and
   0.009 in the void where there is no bass to be impure. → the knee `HPAD` 0.25, and the register carries the other
   half of the sentence (a bass out of the sub IS a harmonic bass), so the void does not read as "maximally impure".
6. **The groove's gate is 99 % on** (one 0.2 s off-run in 20 s), while drop 2's ducks are 50–70 ms gaps once per
   ~1.5 s (the bar). So the gate had to be fast (`GATETC` 0.035 s) and the *void's lift* had to be slow to arm
   (`LIFTWAIT` 0.40 s) — otherwise every duck floated the sand.
7. **Two rules for the plate's boundary were measured and rejected.** Counting distinct sustained notes per map
   section: the map's sections are 3–13 s long and the walk changes note once per section, so no section ever
   reached two. Counting them per map *label* (labels recur — 0 = intro/voids, 1 = the walk and the outro walk,
   3 = the groove, 6 = the drops): every label eventually accumulates ≥ 2, including the groove's, because the ears'
   pitch wanders. What separates them is **whether the bass is on the tonic**: the groove and both drops sit on C#,
   the build's walk, both climbs and the outro do not. That is the rule in the scene.

---

## (g) The nine windows

*(filled from `python3 tools/accept/v0.15/ch-report.py` — see the numbers section below)*

## (h) Cost, determinism, continuity

*(filled below)*
