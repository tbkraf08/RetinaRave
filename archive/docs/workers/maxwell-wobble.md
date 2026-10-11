# MAXWELL2 — worker report (v0.11, scene id 9, key `n`, still forced-only)

The user looked at v0.10 on 2026-09-26 and said three things. This session answers all three, in place, on id 9.
Brief: `docs/workers/brief-maxwell-wobble.md`. Plan: `MAXWELL-WOBBLE-SESSION-PROMPT.md`. Worktree
`.claude/worktrees/agent-a3491c6384b7dce2e`, PORT 8830, one Chrome at a time.

Files written: `assets/scenes/maxwell/{index,fdtd,medium,sources,render,probe,help}.js`, new
`assets/scenes/maxwell/colour.js`, `tools/test_fdtd.js` (group 5). Nothing else was touched — no `core/`, no
`engine/`, no `main.js`, no `feats.js`, no `math/`, no other scene.

**Three commits, one per proven item:**

```
24cab80  item 1: silence is quiet
98ffcb4  item 3: the wobble, the carrier is the timbre, the bass pumps the centre
706f8f5  item 2: the wave carries the colour of the note that launched it — shipped (A), 1.24x TORUS2
```

```
IDS=9 PORT=8830 tools/scene-md5.sh mx2
scene 9 errs [] hop 840 row 72
d268a0711df4cfb93880572ffcde972d  s9-f360.jpg
473e474cd5992eda5d1a2179818a6b9c  s9-f840.jpg
```

(v0.10's were `4e26a427…` / `57bac88e…`. The scene's whole picture changed, so both moved.)

---

## The headline: where the plan's diagnosis was right, and the three places it was not

The diagnosis was **right on every claim about v0.10's code**. Verified line by line before anything was changed:
nothing read `presence` or `absentT`; `alive` reached only the hat shimmer; the `beat` event launched the `FAINT`
kick every beat through silence; `chroma` zero fell back to `harmAngle` and lit all twelve at the `charge` floor of
0.45; `DIPR` held 40 % of the dipole's current between nudges; `FLOOR` 0.010 lifted the plane; the contour levels
were spaced from the frame's own A range down to `AFLOOR` 1e-6; `render.js:37-38` was exactly two hues off a soft
sign of Ez; the carrier was `LAM0 · 120/bpm` and nothing else; `centroid`, `dirty` and `punchy` were unread.

Three things in the plan did not survive a measurement.

**1. A uniform breath of eps cannot bunch a wave that is already in flight.** The plan: "light slows across the
whole cavity when the sub swells, so every ring in flight bunches and stretches at the wobble rate: the rings
wobble." A spatially uniform `eps(t)` leaves every plane wave an eigenmode with its **k unchanged** — only the
frequency moves — so the wavelength of a wave already in flight is frozen. Measured at 2 Hz with eps swinging
0.74 → 1.26: the crest spacing moved **4 %** against the gate's 12 %. Grading the breath (a lens that breathes,
which is what shipped) is the right physics, but at a dubstep LFO rate it cannot be resolved either: light crosses
the porthole in ~1.5 s, the carrier is ~33 cells and one 2 Hz cycle is 36 cells of travel, so a wavelength chirp has
**one crest per period** and is not a chirp. What a bass that wobbles does to a spectrum is pump the LEVEL, so that
is what the scene draws — `WOBA` 0.85 on the carrier's amplitude, which leaves shells of bright and dark 36 cells
apart marching outward at c. The graded breath stayed (it is real: it moves the local speed and the loss), the
gate did not.

**2. `hooks.quiet(1)` pinning `presence`, `alive` and `absentT` is not a picture of silence.** `MS.kick`, `snare`
and `hat` are flux peaks and `MS.sub` is a band follower, so in real silence they are zero by construction — but on
the `#test` timeline they keep firing, and the first pinned frame came back with the energy only **13 % down**. And
the params are derived by the ENGINE from the real `MS` (§1.16), so a hook that pins `presence` inside `update()`
leaves `charge` at exactly the value silence is supposed to take away. The hook now pins the three band impulses and
`sub` as well, and takes `charge` and `ring` to what their own `from()`s give on the pinned fields. Then the energy
is **0**.

**3. "the crest-hue agreement: the hue boundary within one ring width of the Ez ring" has no referent any more.**
The plan itself decided that the sign of Ez becomes brightness and the hue comes from the colour field, and a smooth
hue field has no boundary at a crest. What was measured instead is whether the colour field's wave keeps step with
Ez's (it does, to an eighth of a ring spacing) and whether the hue is the right one (it is, to 0.0018 turns).

A fourth, smaller: **the plan's `ASCALE` = "the A range of a `hooks.train('4')` frame at charge 1"** measures
**1.118** at tier 1, which is ABOVE every musical frame (0.77 … 0.95), so using it as the level spacing thins every
musical frame — and, measured, does not even reduce the segment count (994 → 1147 at f360, because the levels land
differently). `ASCALE` is 0.55, half that reference and safely under every musical frame, so it is a FLOOR under the
spacing: above it the picture is v0.10's exactly, below it a field a fraction as strong reaches a fraction of the
levels.

And a fifth: the plan's `hooks.chroma("k,j")` proof, "two classes a **fifth** apart". On this ring a fifth is one
SECTOR, and one sector of hue is `spread/12` — 0.045 turns. Two hues 0.045 turns apart cannot be told apart in a
picture. The proof is run on sectors 3 and 9 (a tritone), the pair that is furthest apart, and says so.

---

## Item 1 — silence is quiet (commit 24cab80)

`params.charge.from` is `presence × (0.45 + 0.35 intensity + 0.2 bass)`. `params.ring.from` is multiplied by
`1 − SIL(absentT, presence)`, where `SIL` ramps over `VACT` 1.0 s → `VACT + VACW` 2.0 s of `absentT` and is gated by
`1 − presence`, so a pad-only breakdown keeps presence up and keeps its ringing. The `harmAngle` fallback for `W12`
is weighted by `presence`; `GA12`'s floor `GAFL` 0.10 is × presence (silence is twelve dark beads, not a lit ring);
`FAINT` launches only while `alive`; `DIPR` × presence; `FLOOR` 0.010 → 0.005.

The contours got an absolute floor: `dA = max(range, ASCALE)/NLEV` with `ASCALE` 0.55, and `AFLOOR` 1e-6 → 2e-3.

**And the strokes got the plane's own porthole.** This is the single biggest part of "too noisy" and the plan only
half-names it: in v0.10 the PLANE was faded to black on a disc (`FS_SHOW`'s `ed`) and the H lines were **not**, so
the contours of the near-empty corners were stroked over the black — the faint loops outside the porthole in every
v0.10 shot. `PORTW` / `PORTE` / `portFade` are now shared between the shader and `strokes()`, and a segment whose
midpoint is outside the disc is not emitted at all.

**Proof**, tier 1, CLOCK=1, `test&scene=9` against `test&scene=9&quiet=1`, measured on the item-1 tree:

| | lum.py centre | probe().segs | drawn | energy() |
|---|---|---|---|---|
| f360 unpinned | 0.3804 | 994 | 930 | 693.791088 |
| f360 quiet | **0.0039 = 1.0 %** | **0 = 0 %** | 0 | **0 = 0 %** |
| f840 unpinned | 0.5022 | 3480 | 2165 | 2011.82807 |
| f840 quiet | **0.0040 = 0.8 %** | **0 = 0 %** | 0 | **0 = 0 %** |

Gates were ≤ 15 % / ≤ 10 % / ≤ 5 %. On the FINAL tree (items 1 + 3 + 2) the same pair reads 0.3259 / 872 / 779.89
unpinned against 0.0039 / 0 / 0 pinned — **1.2 % / 0 % / 0 %**.

The unpinned field on the item-1 tree is bit-for-bit v0.10's (energy 693.791088 and 2011.82807, segs 994 and 3480
unchanged): what moved in the picture is the halved `FLOOR` (centre 0.3830 → 0.3804, −0.7 %) and the **64 of 994**
(f360) / **1315 of 3480** (f840) contour segments that used to be drawn in the black corners.

Shots: `mx2-i1-u-f840` against `mx2-base-f840` is the clearest — the same drop frame, and the v0.11 one is a clean
round porthole where v0.10 had contour scribble running off into all four corners. `mx2-fin-q-f360` is silence: the
plane at its floor, the twelve charges unlit, not one contour.

---

## Item 3 — the wobble, the timbre carrier, the bass pumps (commit 98ffcb4)

- **the carrier is the TIMBRE**: `lam = LAM0 · 2^(−CENTK (centroid − CENT0))` (CENT0 0.45, CENTK 2.5), clamped by
  `LAMLO`. `bpm` no longer sets the wavelength at all — only the sweep and the launch cadence. The beat-locked
  `regularity` term (a v0.10 guess, and its own worker flagged it as one) is gone and `regularity` leaves `feats`.
- **`dirty` doubles the ripple**: the harmonic is the COSINE one. `sin t + a sin 2t` has the same two extrema a sine
  has for any `a` and drew no second ripple at all (measured, crest gaps 35.0 at dirty 1 — the fundamental's own).
  `sin t + a cos 2t` has four once `a > 1/4`, because its derivative factorises as `cos t (1 − 4a sin t)`. `DIRTK`
  is 1.8, not the plan's 0.6: a source integrated into Ez radiates at ~1/ω, so the harmonic reaches the field at
  about half its source share. The dipole carries the same waveform — it sits at the centre and a pure sine there
  drowned the charges' harmonic along the very ray `hRow()` measures.
- **the bass pumps the centre**: `SUBK` 0.004 → 0.030; the kick's pulse is `KICKA × (KPUN0 + KPUN1 · punchy)`.
- **the lens flexes on each bass pump**: `shear = eased(0.55 tension) + WOBSH (bassFast − bass)`, the pump ON TOP of
  the 0.45 s ease, which would otherwise swallow a kick's own attack.
- **the wobble**: `sub` against a `WOBTC` 0.6 s ema of itself is the LFO; the medium breathes with it (`WOBK` 0.6,
  clamped into `[WOBLO 0.70, WOBHI 1.60]` so `S/sqrt(eps)` never leaves the 2-D Courant limit, over a raised-cosine
  profile of radius `WOBR` 0.5 grid heights) and the carrier's amplitude takes `WOBA` 0.85 of it.

**Proofs** (`test&scene=9&tier=1`, CLOCK=1):

`hooks.wob(2)`, `&train=4&medium=4`, f300…f360 every 5 frames — `wa` (the carrier's amplitude factor) runs
0.625 → 1.375 on a clean 30-frame period and `hooks.energy()` follows it:

```
f300 416.9  f305 481.1  f310 484.9  f315 433.4  f320 356.8  f325 364.3  f330 441.7
f335 482.7  f340 495.9  f345 429.8  f350 374.6  f355 386.9  f360 468.5
```

**39 % peak-to-trough** (356.8 → 495.9), the peaks one cycle apart agreeing to 2 % and the troughs to 5 %. The crest
spacing over the same cycle moved **4 %** — reported, not met, for the reason in the headline.
`mx2-i3-wobhi-f310` is bright, with a hard core and tight luminous rings; `mx2-i3-woblo-f325` is the same field
fifteen frames later, dim and broad with the core gone. The eye reads it as the whole picture breathing.

`hooks.timbre(c, 0)`, `&train=off&medium=4`, f360: the carrier in force **43.42 : 21.71 cells = 2.000**, exactly
`pow(2, CENTK × 0.4)`; the crests measured off the field by `hRow()` **39.70 : 21.97 = 1.807**, −9.7 % of the
prediction and inside the ±10 % gate — the deficit is the two or three long crests that are all that fit inside the
porthole at centroid 0.3. Shots `mx2-i3-c03-f360` (wide slow bands) / `mx2-i3-c07-f360` (fine dense ripple).

`hooks.timbre(0.45, 1)` vs `(0.45, 0)`, f360: crests `[14.4 49.3 83.2 117.4 151.0 183.3]`, gaps ~34 (one ripple per
wavelength) become crests `[9.4 26.7 45.3 60.0 79.4 113.5 146.4 161.0 179.0]`, gaps `17.2 18.6 14.7 19.4` — **the
ripple is doubled** over the inner half of the porthole, where the harmonic has not yet been absorbed. On screen
(`mx2-i3-dirty1-f360` against `mx2-i3-dirty0-f360`) it reads as every band splitting into a fat one and a thin one.

The three demo styles, 20 s window (t 20 → 40 s), `&fake=0&demo=…`:

```
house  centroid 0.485  dirty 0.267  punchy 0.516  sub 0.094  bpm 128.1  lam/gh 0.1466  wob 0.797..1.083
aba    centroid 0.459  dirty 0.119  punchy 0.693  sub 0.417  bpm 124.1  lam/gh 0.1459  wob 0.890..1.487
dnb    centroid 0.459  dirty 0.356  punchy 0.433  sub 0.039  bpm 173.7  lam/gh 0.1513  wob 0.830..1.062
```

**The ≥ 20 % gate on the mean crest spacing per style is NOT met, and it cannot be**: the three demo synths have the
same mean spectral centroid (0.485 / 0.459 / 0.459), so their mean carrier is the same to **4 %**. What separates
them now is `dirty` (3.0× between aba and dnb), `sub` (10× between dnb and aba — aba's wobble swings eps
0.89 … 1.49 against dnb's 0.83 … 1.06) and `punchy` (1.6×), which are exactly the three new mappings. And within a
style the carrier does move: house's centroid ran 0.37 → 0.77 across the window, i.e. `lam` 42.3 → 19.2 cells, a
factor of **2.2**. The honest summary is that the styles look different, and the thing that makes them look
different is not the one the plan named.

No dubstep mp3 was supplied to the scratchpad, so `demo=dnb` stood in, and the montage for the user's 3 is the
`wob(2)` pair plus the three demo frames. The headed runs on the two real tracks are the orchestrator's step.

---

## Item 2 — the wave carries the note's colour (commit 706f8f5): **A, shipped**

The full detail is in the commit message; the numbers, once:

| proof | result | gate |
|---|---|---|
| `mxchroma("3")`, one sector lit (own hue 0.8663) — 12 feet, 12 midpoints, the centre | worst hue error **0.0018 turns**, min saturation **0.983** | HUETOL 0.04, sat ≥ 0.5 |
| `mxchroma("3,9")`, a tritone apart | foot 3 **0.8722** (own 0.8663) sat 0.957 · foot 9 **0.1236** (own 0.1337) sat 0.943 · midpoint **0.0000** = their exact circular midpoint, sat 0.597 | two hues, mixed between |
| `key("0,0")` vs `("7,1")` | anchor 0.0090 → **0.2933**; GH12 **identical to four decimals**; the lit note 0.8667 in both | the notes must not move |
| the colour front against Ez's | colour rings 36 cells apart vs Ez's 35.2; colour front r = 175 vs the outermost visible Ez crest 179.8 (~1/8 of a spacing); the \|w\| maximum trails the crest by ~14 cells because w accumulates a non-negative source | fallback B not needed |
| cost, two-page protocol | **1.24× TORUS2** (MAXWELL/NAV 1.280, TORUS2/NAV 1.035) after; 0.96× before | ≤ 1.5× |
| `test_fdtd` group 5, the 64×64 twin | energy bounded (max Σu² 8.77e1); rgb/w in **[0, 1.000000]** (2950 before the projection) | both |

`sectorHue(hue, k, spread)` is `hue + spread(k/12 − 1/2)` — the anchor shifts the WHOLE wheel, which is v0.10's
behaviour and is what made a note change colour with the key. The spread stays, the anchor's offset goes
(`colour.js noteHues`, `CHUE0` 0.0), and the spread is widened by `CSPREAD` 1.6 (capped at `CSPMAX` 0.92 of a turn)
because a third of the wheel is right for twelve small glows on a ring and wrong now that those hues are the colour
of every wave in the picture. `CSPREAD = 1` is v0.10's spacing exactly, for the user to put back.

`FGAIN` 3.4 → 6.0: with the sign of Ez as brightness, half the picture is dimmed to `TROUGH` 0.35 and the reference
frame's mean luminance fell 31 %; 6.0 puts f360 back to **0.3259** against v0.10's 0.3830 (−15 %, with the rim 5 %
brighter and the centre/rim ratio 1.69 → 1.37 — the picture is flatter as well as slightly dimmer). `TROUGH` is the
one constant to raise if the user wants v0.10's contrast back.

---

## Acceptance

```
node tools/check.js       96 modules · uniforms 157 · MS keys 118 · scenes 9 (help.feats gaps 0) · 0 fail · 3 warn
node tools/param-smoke.js param-smoke: 49 checks, 0 fail
node tools/test_fdtd.js   test_fdtd: OK   (groups 0-4 as v0.10, plus group 5, the colour field's twin)
```

The three warnings are file lengths over the 350-line SOFT cap: `feigen/index.js` 352, `nav2/nav2.js` 393 and
`maxwell/index.js` **497** — two lines under the 500 hard cap, which `check.js` enforced twice during this session
and which is why `noteHues` and the two long `strokes()` comment blocks live in `colour.js` and `render.js`.

**brief-common 2**, `test&scene=9`: `{"errs":[],"bad":[],"scene":9,"q":0.47}`, `probe()` `gap 0 loops 118 open 16
segs 1737 drawn 1102`. **t6** (`mx2-t6`): a clean round porthole of concentric rings, the rim coloured by sector —
magenta upper-left, orange and gold right and below — over a blue-white centre (the kick and the dipole are the
key's anchor, the only pitchless sources). **t14** (`mx2-t14`, one second after the drop, waveguide): the whole
plane fills corner to corner with a much brighter standing pattern and it is now unmistakably *many* colours —
magenta left, orange upper-right, blue between the rails, gold lower-right. The drop still reads as the drop.

**brief-common 3**, `test&fake=0&demo=house&scene=9`: `{"errs":[],"bad":[],"q":0.696,"bench":2.766}`.
`mx2-h10` / `mx2-h30` / `mx2-h50` are three clearly different frames — h10 a bright warm lens, h30 a dim photonic
lattice broken into the lattice's cells and drawn in magenta, yellow and green, h50 a bright lens again with pink
rings and gold charges on the right. lum.py centre 0.5628 / 0.3276 / 0.5717.

**Montages** (in `tools/work/`, for the orchestrator to place under `tools/accept/v0.11/`):
`montage-maxwell2.jpg` (v0.10 left · v0.11 right at f360 and f840, plus the silence pair),
`montage-maxwell2-colour.jpg` (one class, two classes, a key change, and the three house frames),
`montage-maxwell2-wobble.jpg` (the wobble pair, the dirty pair, the timbre pair).

---

## The `feats` list (43)

```
chroma harmAngle key mode keyConf valence kick snare hat beat bpm beatPhase beatCount barPos phrase16Pos bass sub
build intensity arousal tension dropEvt dropEnv arc sectionAlt sectionEvt surpriseEvt flowBass flowMid flowHigh
roll riser hush calm alive novelty clarity presence absentT bassFast centroid dirty punchy
```

v0.10's 38, **minus** `regularity` (its lock is gone), **plus** `presence absentT bassFast centroid dirty punchy`.
Each has a `help.feats` line; `check.js` reports `help.feats gaps 0`. (The item-3 commit message says "38 → 41";
the arithmetic is wrong, it is 43.)

## The hooks (16)

```
tier lines lab reset train key medium drop energy probe mxinfo    (v0.10)
quiet wob timbre mxchroma mxcol                                    (v0.11)
```

`mxchroma` and `mxcol` are mx-prefixed because POLYTOPE owns `hooks.chroma` and `CARD.hooks` is one flat map
(§1.4); `quiet`, `wob` and `timbre` were free (grepped over `assets/scenes/*/` before naming). Every one of them is
called as `CARD.REG[9].scene.hooks.<name>(v)` in every proof above, and every one pins inside `update()` and never
touches `MS`.

## The constants added or changed, with their values

| where | constant | value | what it is |
|---|---|---|---|
| index.js | `FLOOR` | 0.010 → **0.005** | the plane's black level, halved |
| | `FGAIN` | 3.4 → **6.0** | brightness, to pay for the trough dimming |
| | `GAFL` | **0.10** | a dark charge's floor on the ring, × presence |
| | `VACT` / `VACW` | **1.0** / **1.0** s | when silence starts letting the rings go, and over how long |
| | `QUIETT` | **10** | the `absentT` `hooks.quiet(1)` pins |
| | `WOBK` | **0.6** | how hard the sub's swell bends the light |
| | `WOBTC` | **0.6** s | the ema `sub` is measured against (the LFO, not the level) |
| | `WOBLO` / `WOBHI` | **0.70** / **1.60** | the eps clamp, so `S/sqrt(eps)` stays under the Courant limit |
| | `WOBSH` | **0.9** | the lens's flex per unit of `bassFast − bass` |
| render.js | `ASCALE` | **0.55** | the floor under the contour level spacing |
| | `AFLOOR` | 1e-6 → **2e-3** | below this A range, no field at all |
| | `PORTW` / `PORTE` | **2.2·ABSN** / **0.2·ABSN** | the porthole fade, now shared with the strokes |
| medium.js | `WOBR` | **0.50** grid heights | the wobble's raised-cosine radius |
| sources.js | `CENT0` / `CENTK` | **0.45** / **2.5** | the centroid that draws `LAM0`, and its halvings per unit |
| | `DIRTK` | **1.8** | the cosine second harmonic per unit of `dirty` |
| | `WOBA` | **0.85** | the LFO's share of the carrier's amplitude |
| | `SUBK` | 0.004 → **0.030** | the sub's standing current at the centre |
| | `KPUN0` / `KPUN1` | **0.6** / **0.8** | the kick's pulse as `KICKA (KPUN0 + KPUN1 punchy)` |
| | `BPM0` | *removed* | the carrier no longer reads the tempo |
| fdtd.js | `GRIDT[3][2]` | 4 → **3** | tier-3 substeps: the session's one numerics change |
| colour.js | `GRIDC` | **[[128,72],[192,108],[256,144],[384,216]]** | exactly half the field's grid |
| | `CSIG` | **0.055** | the colour field's own loss — a memory of about a second |
| | `CSRCW` / `CKW` / `CDW` / `CCUT` | **1.6** / **2.0** / **2.2** / **3.0** | its source blobs, in colour cells |
| | `CDRUM` / `CDIP` | **0.30** / **0.05** | how much of the two pitchless sources it carries |
| | `WFL` / `WFL1` | **2e-3** / **2e-2** | the w floor, and the w at which the colour field owns the hue |
| | `CSAT` / `TROUGH` | **1.0** / **0.35** | the note's saturation, and the trough's share of a crest |
| | `CHUE0` / `CSPREAD` / `CSPMAX` | **0.0** / **1.6** / **0.92** | where the wheel of twelve is pinned, and how wide |

## The bench

Two-page protocol (`docs/workers/maxwell.md`): `q` pinned at 0.95 by `setInterval`, 10 s of settling,
`bench(id,300)` interleaved with `bench(0,300)` as seven pairs, the first (cold) pair discarded, the median of the
NAV-normalised ratios. One page per scene; nothing else on the machine.

```
                          MAXWELL / NAV     TORUS2 / NAV     MAXWELL vs TORUS2
before (items 1 + 3)          1.153            1.204              0.96x
after  (+ colour field,
        tier-3 sub 4 -> 3)    1.280            1.035              1.24x        gate <= 1.5x
```

The same caveat v0.10's report gives applies: NAV drifts from ~1.95 ms to ~1.50 ms partway through every run on this
machine, so the pairs early in a run and late in a run disagree; every pair is in the commit messages and the median
is the verdict. `bench(9,300)` on the house demo at q 0.696 (tier 2) reads **2.766 ms**.

---

## Friction log — what the docs did not answer, and what is wrong in them

1. **`tools/lum.py` has no hue field.** The brief says "`tools/lum.py <jpg>` (mean luminance / hue — read its header
   for the exact fields)"; its header and its code report centre and rim **luminance** only. v0.10's report quotes a
   "saturation-weighted mean hue", which must have come from something that was never committed. A throwaway
   `tools/work/hue.py` was written for this session; it is not in the diff (the worker's targets do not include
   `tools/`), and it turned out not to be the right instrument anyway — see 3.

2. **The scene's hue is a cosine palette, not HSV, and nothing says so where a proof can find it.**
   `0.5 + 0.5 cos(TAU (h + [0, .33, .67]))` maps to an HLS hue of `(1 − h) mod 1`. Every "hue" number in this report
   is in the palette's own turns, recovered by a fit (`probe.js hueFit`), because a proof that quotes HLS degrees
   and a constant that is in palette turns cannot be compared without saying which is which.

3. **A screenshot is the wrong instrument for "is the wave the note's colour".** The camera yaws (so the lit charge
   is at a different screen angle every frame), the twelve glows and the medium hint are added on top of the field,
   and the JPEG moves the chroma. The first attempt measured a screenshot annulus and read the ANCHOR hue, 0.54
   turns away from the answer. `hooks.mxcol()` reads the colour target itself and reports the palette hue, the
   saturation and `w` at the twelve feet, the twelve midpoints, the centre and along the `+x` ray — and the same
   question then answers to 0.0018 turns.

4. **A test hook that pins a field must pin the PARAMS derived from it.** CONTRACTS §1.16 says a param's `from()` is
   the expression `update()` would have written inline, evaluated by the engine from `MS`. A hook that pins a field
   inside `update()` therefore does **not** reach the params, and `hooks.quiet(1)` silently left `charge` at its
   musical value. This belongs beside §1.4's "a hook that sets a phase your scene clamps on arrival must also mark
   the scene as arrived" and beside v0.10 friction 6 ("a read-only hook must not mutate").

5. **`mxinfo()`'s keys are not namespaced and a second `sub:` silently won.** Adding `sub: U.subS` (the sub's ema)
   to the object literal that already had `sub: U.sub` (the substeps per frame) replaced it, and the bench script
   read the wrong number for one run. Renamed to `subS`. Worth a sentence wherever `hud`/`info` hooks are described.

6. **The 500-line hard cap is the real constraint on a scene that grows, and `check.js` only says so after the
   edit.** `index.js` hit it twice. Both times the fix was right (the explanation of the H-line readback belongs
   beside the contours in `render.js`; `noteHues` belongs in `colour.js`), but a brief that adds a whole subsystem
   to a 402-line scene should say where the budget is going before the worker finds out.

7. **A second-order leapfrog cannot ping-pong between two targets.** The Yee pair gets away with two because each of
   its passes reads one field and writes the other; `u_{n+1} = f(u_n, u_{n−1})` needs three. Obvious in hindsight,
   not in the plan, and it is the difference between 2 and 3 extra targets in the cost estimate.

8. **A linear wave operator does not preserve `0 ≤ rgb ≤ w` even though every source does.** Where the Green's
   function is negative, `w` clamps to zero under a positive `rgb` and the "chromaticity" reaches 2950. The
   projection `min(rgb, w)` after `max(0)` costs one instruction and is what makes `rgb/w` a colour. This is the one
   line of `colour.js` that is not in the plan and without which item 2 does not work.

9. **`hooks.mxchroma` silences the two pitchless sources while it pins**, which is a decision and not an oversight:
   the kick and the dipole carry the key's anchor hue, are 4–19× louder than a charge and sit at the centre, so with
   them on the probe measures the dipole (every unlit foot read the anchor 0.379 exactly) and the question "did the
   note's colour TRAVEL" has no measurable answer. Named in the hook's own comment.

10. **The `#test` fake timeline holds `centroid` 0.455, `dirty` 0.2 and `punchy` 0.6 at every frame**, and
    `presence` 1 / `alive` 1 / `absentT` 0 at every frame (measured at f360 and f840). The plan guessed the second
    part ("the timeline is always alive") and it is right; nothing anywhere says the first part, and it means every
    timbre mapping is invisible on `#test` and can only be proved by a pin or on the demo synths.

11. **The plan's own cost lever was already enough.** MAXWELL measured **0.96× TORUS2** after items 1 and 3 — the
    porthole cull takes 38 % of the strokes out of the drop frame — so tier-3 substeps 4 → 3 plus the colour field
    landed at 1.24×, comfortably inside the gate. If the user wants the top tier's speed of light back, undoing the
    substep change costs about 0.25× of TORUS2.

**Was I tempted to open a forbidden file?** Twice, and neither time did I.
(a) To find out whether `CARD.bench` re-derives `env.params` between its blocked `update()` calls, which would decide
whether `hooks.quiet`'s param pin survives a bench — `core/loop.js` would have said. It does not matter for any
number in this report (no bench is run under a pin), so it went in the log and the proofs avoid the question.
(b) To find out exactly how `presence` behaves at the very start of a real track, to choose `VACT`. `engine/features*.js`
is forbidden; `assets/engine/feats.js` (a legal read) gives the formula — `ema(smoothstep(−62, −44, dB(rms)))` — and
that was enough. Guess kept: `VACT` 1.0 s and `VACW` 1.0 s, so silence takes a second to start letting go and another
to finish, which is what "the last rings fade in a second" asks for.

**Guesses made and kept:** `ASCALE` = half the train-frame A range rather than the whole of it (measured reason
above); `WOBA` 0.85 and `WOBK` 0.6 split between the amplitude and the medium (the split is a judgement — the
medium's share is the physics, the amplitude's is what reads); `CDRUM` 0.30 / `CDIP` 0.05 (tuned against the probe
until the notes owned the plane); `CSIG` 0.055 as the colour field's own loss rather than the medium's (it has to
forget, and in a drop the medium's sigma is zero); `CSPREAD` 1.6; `TROUGH` 0.35 and `FGAIN` 6.0 as the pair that
keeps the reference frame's brightness near v0.10's; sectors 3 and 9 for the two-class proof.

## What the next session should know

- **The user's 3 is answered by `dirty`, `sub` and `punchy`, not by the carrier**, because the demo synths' mean
  spectral centroid is the same across styles. If "different music must look different" is still not satisfied on
  the real tracks, the lever with the most room is `CENTK` (2.5 — an octave of wavelength per 0.4 of centroid) and
  the next one is putting `bpm` back into the carrier as a second term.
- **The picture is 15 % dimmer and flatter than v0.10** (centre/rim 1.69 → 1.37). `TROUGH` is the knob.
- **The half-float readback path is still unexercised** (everything is `FLOAT` on this machine), and the colour
  field adds three more float targets to it.
- **`hooks.probe()` now reports `drawn` as well as `segs`** — the segments actually stroked after the porthole cull.
  On a wide frame the two differ by a third, and `drawn` is the one that is about what the eye sees.
- The orchestrator still owes: `tools/accept/v0.11/{audit11.sh,det11.py}`, the headed runs with the paused start,
  the montages moved out of `tools/work/`, `AUDIT-v0.11`, DECISIONS §43, `NEXT-SESSION-PROMPT`, package.json 0.11.0,
  `releases/retinarave-v0.11.html`, the thumb re-shot (`tools/thumbs.sh "9:360"` — the f360 frame has changed), and
  the four CONTRACTS sentences owed from v0.10 plus the two this session adds (friction 4 and 5).
