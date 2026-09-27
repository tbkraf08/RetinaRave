# Worker: GIELIS (v0.14, scene id 10) — 2026-09-27

**Brief:** `docs/workers/brief-gielis.md` (+ `brief-common.md`'s first two paragraphs and Report paragraph). PORT 8811,
own worktree from `b01a0a4` (the branch was one commit behind; fast-forwarded to it before starting). Model: opus.
Eight commits, one per proven step, all `GIELIS:`. Not merged.

**Outcome:** built. `assets/scenes/gielis/` = 4 modules, 819 lines, plus `assets/math/gielis.js` (133) and
`tools/test_gielis.js` (98). `node tools/check.js` 0 fail throughout; the only GIELIS warning is the missing thumbnail.
All nine acceptance items pass. Cost: **0.50× TORUS2** at tier 3 with all twelve families (cap 1.5×), 7 140 segments,
the CPU path 0.052 ms. Continuity monitor `viol []` on both the fake timeline and 60 s of the house synth.
**Three leans changed and one added, every one for a measured reason** — the brief's resting lean is provably a circle,
its beat depth double-counts `eS`, and its pinch ramp spends two thirds of its travel where the eye sees nothing.

---

## (a) Friction log — every sentence the docs lack, every guess, every lean changed and why

Nineteen items. The four marked **[lean changed]** are the substantive ones; items 1, 2, 5 and 6 are *mathematical*
corrections to the brief, not taste.

1. **[lean changed] The brief's resting lean `(n2, n3, a, b) = (2, 2, 1, 1)` is EXACTLY a circle** — for every `m` and
   every `n1`. `|cos t|² + |sin t|² = 1`, so `r = 1^(−1/n1) = 1`. Pythagoras. With it the whole breath would have been
   a no-op at rest and the beat would have deformed nothing until a section pulled the lean off round, which is the
   opposite of the user's sentence. `BASE = (1, 1, 1, 1)` — the same family one exponent lower: still a circle as
   `n1 → ∞` (rest Q ≥ 0.9876 on all twelve families), and the pinch acts. Measured in `tools/test_gielis.js` item 4.
2. **[lean changed] `N1_BEAT` 1.5 → 1.2.** At 1.5 the ROOT family (m = 4) swings only **0.106** of Q through a beat —
   under the brief's own ≥ 0.15 gate — while the starry families swing 0.15–0.32. 1.2 puts all twelve over it
   (0.158–0.414) with rest Q ≥ 0.988. The sweep is in the commit message of step 1.
3. **[lean changed, a reparametrisation] The press must travel along `1/n1`, not along `n1`.** `1/n1` IS the exponent
   of the superformula, and the shape is a circle for every `n1` above about 4, so the brief's linear ramp
   `N1_REST − (N1_REST − N1_BEAT)·d` spends two thirds of its travel where nothing happens. **Measured**, first step-3
   series (f600–720 of `#test`, every 3 frames): `n1` dipped to 7.8–8.4 on every beat and Q moved **0.9916 → 0.9791** —
   invisible. `pinchOf(d) = 1 / (1/N1_REST + (1/N1_BEAT − 1/N1_REST)·d)` makes a half press `n1` 2.56 and Q 0.92, a
   shape. This is the single most important change in the scene.
4. **[lean changed] `depth = breath`, not `(0.5 + 0.5·eS)·breath`.** The `breath` parameter's own `from()` IS
   `0.5 + 0.5·eS` (the brief's own table), so the brief's product squares `eS` and left the fake's build window at
   d = 0.41 where the same expression unsquared gives 0.64.
5. **The brief's interval table has one entry that cannot close in ≤ 8 turns.** `16/15` gives `m = 64/15`, whose ring
   needs **15** turns — over the brief's own test gate (`closes in ≤ 8 turns for every entry`). Every `m` is therefore
   snapped to the nearest rational with denominator ≤ `QCAP` 5; **only the minor second moves** (4.2667 → 17/4 = 4.25,
   0.4 %), every other entry is exact. Max turns 5.
6. **The brief's closure arithmetic is loose in two places.** (i) "the fifth six lobes over **two** turns (m 6)": m = 6
   is an integer and closes in **one** turn — the "q turns" rule uses the denominator of the REDUCED `m = M0·p/q`, not
   the ratio's own `q`. (ii) The rule holds only under a **symmetric** lean (`n2 = n3`, `a = b`), where the half-period
   swap `|cos| ↔ |sin|` is itself a symmetry; a lopsided lean needs `2q` turns when the numerator is odd (m = 3/2:
   2 turns symmetric, 4 lopsided — both proven in `test_gielis.js` item 2). The scene draws the symmetric count and
   **skips the wrapping segment** (`uOpen`) whenever the lean or the unwind has opened the ring, so no chord is drawn
   across the gap. `math/gielis.js closure()` returns both counts.
7. **`state.pathCut: 0` (the brief's literal shape) makes the continuity monitor vacuous.** `tools/monitor.js` reads
   `legal = N.pathCut <= 2 || …`, so a constant 0 declares EVERY frame a legal cut and `viol` is `[]` by construction.
   GIELIS has no cuts, so `pathCut` is a constant **9** and every frame is measured.
8. **The monitor's witness cannot be "the loudest family's rim".** The loudest family changes by a *swap*: a
   discontinuity in the witness and not on screen. First 60 s run: **16 violations, every one a reorder.** The witness
   is now the chroma-weighted mean family radius (continuous in chroma) times the mean radius of the SHARED latitude
   profile at the pinch and lean in force (`nest.js witnessR()`), so it sees the breath, the lean, the growth, the
   drop and the sub's fattening, and never the species. The brief's sentence ("the nest's centroid on screen") is
   exactly 0 for a centred nest and would have proven nothing.
9. **`cuts: 'continuous'` versus three event-driven quantities.** `dropEvt` → collapse, `surpriseEvt` → twist and
   `sectionEvt` → the rings' phase all STEPPED in the first cut. The drop stepped the witness by 0.063–0.072 per frame
   on the fake timeline's own drops at 13 s and 37 s — over the monitor's 0.06 spike rule, and a genuine on-screen
   jump. All three now attack/ease (`ATK` 0.12 s for the drop and the twist, `PHITC` 0.35 s for the phase, the latter
   the short way round the turn). At 124 bpm a 0.12 s attack is a quarter of a beat: it still reads as a slam.
10. **The `still` gate earned its keep twice in step 7.** The sub/bar fattening of `a, b` and the `sectionEvt` ring-phase
    offset were music-driven uniforms with no rest value; both moved the still md5s and both are now pinned. This is
    exactly the mechanism the brief describes and it is worth keeping in every future scene brief.
11. **Step 2 has no visual proof without an `n1` pin.** At `N1_REST` the nest is a circle whatever `m` is, so the
    species is invisible until the beat's breath (step 3) bites. Added `hooks.pinch(v)` / `&pinch=1.2` — NAV2's
    `hooks.rho` as an instrument — and step 2's montage pins the pinch. `&param=` was not available (the params slot
    arrives at step 8, per the brief's own Process).
12. **The brief's step-3 window (f600–720) is the fake timeline's BUILD**, where `kick` is 0 and `eS` is 0.145–0.289,
    so the press cannot reach 1 — the shallow end *by design* (the same rule that makes 25 s press harder than 0–13 s
    on the track). Both windows are reported: the PEAK window f840–960 (kick 1 on every beat) is the gate window and
    clears ≥ 0.15 on every beat; the brief's window reads 0.118–0.212.
13. **A 3-frame series aliases the trough.** `press = cos⁴` is above 0.9 for only ±1.6 frames of a 29-frame beat, so
    the brief's "every 3 frames" series misses the pinch entirely (it read swings of 0.005–0.008 where the true swing
    was 0.12–0.21). Every series here is a **per-frame rAF collector** reading `hooks.green()`, which is also much
    faster than 80 `{until}` steps. AUDIT-v0.13 §8's lesson, one level finer.
14. **`wave` is the one parameter move that is not a no-op**, and the brief's Process is why: steps 1–7 had no inline
    expression for it (the shader read the constant `WAVE0`), so adopting `WAVE0 + 0.1·kick` is a real visual change.
    Proven exactly: with `&param=gielis.wave=c:0.26` (the constant it replaced) the post-move md5s are **byte-identical
    to the pre-move pair** `d7806c9b` / `a0097ad3`, so the other five moves are verbatim and `wave` is the only change.
15. **The 8 000-segment cap is about 3× conservative for path B.** DECISIONS §14's 0.4 µs/segment is *path A*
    (`ctx.lines.set` + the instanced draw). TORUS2's own measured path-B cost is 23 040 segments at 1.556 ms =
    **0.067 µs/segment**, and GIELIS measures 7 140 segments at 0.658 ms = 0.092 µs/segment. The cap was honoured
    anyway; `SEGT` is the first knob if the q-turn families read coarse (they do — see the tune-first list).
16. **`sat13.py` p95 in 0.6–0.8 is met on the bright frames only.** The drop rebound reads 0.686, the beat's own press
    0.619, the house groove 0.542–0.580, the breakdown 0.150. "Silence is quiet" and that band are in tension; the
    numbers are all reported and `KNEE` is the named knob.
17. **`hooks.key` is a name TORUS2 already uses** (CONTRACTS §1.4's collision note). `&key=0` fires both scenes' hooks;
    harmless here (only the forced scene draws), and every proof spells `CARD.REG[10].scene.hooks.key(k, mode)`.
18. **`CARD.fix` drove the morph at step 7.** The `lean` parameter does not exist until step 8, so the four-template ×
    three-morph montage pins `tension` through the harness's own `CARD.fix` — the cleanest available pin, and one the
    docs do not point at for this purpose.
19. **`tools/scene-md5.sh` names its shots `<tag>-s10-f360.jpg`**, not `gi-…`; the brief asks for shots prefixed `gi-`
    in `tools/work/`, which is true of every shot this worker took by hand but not of the md5 script's own.

**Guesses made and kept:** the second (latitude) curve's lobe count is a single shared `M_PHI` 4 rather than the
family's own `m` (the brief does not say which; sharing it keeps the pitch in the equatorial lobes, which is what the
ruler measures, and keeps the monitor's witness species-free); the wave's displacement is **radial** (the brief says
"displacement" without naming a direction — radial is the only direction a supershape point has that survives every
lean); the wave hue is a `g`-weighted mean of the launching families' hues, linearly, not round the wheel (the spread
is under 0.75 of a turn, so a linear mean cannot wrap).

## (b) Temptations — forbidden files I wanted and did not open

- `assets/core/scenes.js` — whether `CARD.bench` runs `update()` before rendering, and how `stepScene` orders ids 8/9/10.
  Answered by the acceptance-7 run instead (key `9` → 8, `n` → 9, `n` → 10), and by pinning the state before the bench.
- `assets/core/harness.js` — what a valueless `&still` passes to a hash hook. Copied NAV2's
  `v === undefined || v === '' ? 1 : +v` idiom, which covers both.
- `assets/engine/features-synapse.js` — whether `sectionAlt` is ever negative on the real path. Guarded with
  `MS.sectionAlt < 0 ? 0 : …` as TORUS2 does.

None opened.

## (c) Acceptance — the exact lines

| # | item | result |
|---|---|---|
| 1 | `node tools/check.js` | **PASS** — `check: 105 modules · uniforms 176 · MS keys 118 · scenes 10 (help.feats gaps 0) · 0 fail · 4 warn`; the four warns are FEIGEN 352 / MAXWELL 467 / NAV2 400 lines (pre-existing) and `scene gielis: card without site/thumbs/gielis.jpg` (the allowed one) |
| 2 | `PORT=8811 GPU=1 node tools/cdp.js 'test&scene=10' …` | **PASS** — `{"errs":[],"bad":[],"scene":10}`, `glerr` absent. `gi-t6` the nest at rest under the fallback key; `gi-t14` the drop's rebound |
| 3 | the house run, `scene=10` | **PASS** — `{"errs":[],"bad":[],"q":0.694,"tier":2,"bench":0.987}`, three different frames, `q` 0.694 ≥ 0.6 |
| 4 | every proof shot montaged and read | **PASS** — the table below |
| 5 | the scene object's shape | **PASS** — `name id tag card feats cuts rt state hooks score init update draw hud params post colour help`; `feats` 38, `help.feats` 38 (0 gaps), `score()` 0, `state` = `{n1, Q, cPath, pathCut, kick, baby, mode}` |
| 6 | `IDS=10 tools/scene-md5.sh` stable, `&still=1` the reference | **PASS** — plain `2c1b21c8` / `2e978a09` twice, still `89664dad` / `fe2809bc` twice |
| 7 | `node tools/bundle.js` + the real start path | **PASS** — `bundled 105 modules → dist/retinarave.html (919 KB)`; key `9` → id **8**, `n` → **9**, `n` → **10**; `{"errs":[],"bad":[],"scene":10}` |
| 8 | `param-smoke`, `test_gielis`, `test_torus2` | **PASS** — `param-smoke: 49 checks, 0 fail` · `test_gielis: OK` · `test_torus2 … OK` |
| 9 | the continuity monitor | **PASS** — `#test` 40 s: `{"n":2407,"fast":0,"max":0.0583,"viol":[]}`; `fake=0` 60 s: `{"n":3606,"fast":0,"max":0.0533,"viol":[]}` |

### The exact EVAL lines that matter

```
# acceptance 2
EVAL … => "{\"errs\":[],\"bad\":[],\"scene\":10}"
# acceptance 3 (house)
EVAL … => "{\"errs\":[],\"bad\":[],\"q\":0.694,\"tier\":2,
            \"hud\":\"gielis pc9 m 4.00 n1 3.27 Q 0.975 waves 24 key 9M turn 41.50 size 0.66 tmpl round morph 0.18 seg 38/5222 t2\",
            \"bench\":0.987}"
# acceptance 7 (bundle, file://)
EVAL CARD.SC.logical => 8      (key 9)
EVAL CARD.SC.logical => 9      (n)
EVAL … => "{\"errs\":[],\"bad\":[],\"scene\":10,\"hud\":\"gielis pc5 m 6.40 n1 3.76 Q 0.929 waves 23 …\"}"   (n)
# acceptance 9 (monitor; CARD.NAV = CARD.REG[10].scene.state before the MON snippet)
EVAL … => "{\"n\":3606,\"fast\":0,\"max\":0.0533,\"viol\":[],\"errs\":[],\"bad\":[]}"
# the parameters
EVAL CARD.paramsOf("gielis") => {breath 0.7897972667038737, wave 0.2917958841655991, turn 4.71238898038469,
                                size 0.6615594059217454, lean 0.1799988940417764, glow 0.12239999999999998}
EVAL … paramDeps / identity => [["breath",["eS"],true,0],["wave",["kick"],true,0],["turn",["beatCount"],true,0],
       ["size",["intensity","arousal","build"],true,0],["lean",["tension","arc"],true,0],["glow",["hush","calm"],true,0]]
```

## The s10 md5s (the v0.14 reference)

```
plain   f360  2c1b21c8c5553ab84008ac7060cbfa00        (stable across two runs: gi, gi2)
plain   f840  2e978a09fc3ebb8d1aa428911a6be16d
still   f360  89664dad910bea6b916849a9e8cbf85f        (stable across two runs: gis, gis2)
still   f840  fe2809bc052f4f9b75b4d8e4cd049a8e
```
The still pair was set at **step 2** and is byte-identical through steps 3, 4, 5, 6, 7 and 8. It was re-based once,
at step 2, because the species has no rest value for `still(1)` to pin (the brief allows exactly this). The step-1
still pair was `cfe06ce3` / `921ea881`, which at step 1 equalled the plain pair (every uniform `still` pins was already
at rest — the identity proving itself, as NAV2's `still f360 == plain f360` did).

## (c) The bench (HARNESS "Bench protocol": `q` pinned 0.95, 9 s of settling, the cold call discarded, n = 300, five interleaved pairs)

Two page loads, each with its own scene forced so that scene's `update()` actually runs at tier 3 (§36 friction 12),
with `CARD.fix = {build: 1, tension: 1, arousal: 1, arc: 'peak'}` so both scenes are benched at their **widest**
(GIELIS all twelve families, `seg 52/7140`; TORUS2 `fib 144 seg 160`, morph 0.90).

| pair | GIELIS s10 (ms) | NAV (ms) | s10/NAV | | TORUS2 s3 (ms) | NAV (ms) | s3/NAV |
|---|---|---|---|---|---|---|---|
| 1 | 0.6613 | 1.5070 | 0.4388 | | 1.3267 | 1.5523 | 0.8546 |
| 2 | 0.5967 | 1.5027 | 0.3971 | | 1.3383 | 1.5223 | 0.8792 |
| 3 | 0.5920 | 1.5223 | 0.3889 | | 1.3677 | 1.5237 | 0.8976 |
| 4 | 0.6580 | 1.4810 | 0.4443 | | 1.2437 | 1.5200 | 0.8182 |
| 5 | 0.6623 | 1.4653 | 0.4520 | | 1.2503 | 1.5330 | 0.8156 |
| **median** | **0.6580** | **1.5027** | **0.4388** | | **1.3267** | **1.5237** | **0.8546** |

| statistic | GIELIS / TORUS2 | cap |
|---|---|---|
| medians of the raw ms | **0.496×** | 1.5 |
| NAV-normalised (median s / median NAV) | **0.503×** | 1.5 |
| median of the per-pair ratios | **0.513×** | 1.5 |

`glerr` 0 and `errs []` after every bench. Cold first calls (discarded): GIELIS 0.798, TORUS2 1.570.

**The CPU side** (`hooks.timeUpdate(300)` — `updateNest` + `measureQ`, i.e. the twelve families, the species table,
the waves and the 512-sample Green trace): four batches of 300, `{med 0.100, mean 0.1290}` (cold), then
`{med 0.100, mean 0.0527}`, `{med 0, mean 0.0510}`, `{med 0.100, mean 0.0517}`. The browser's `performance.now()`
quantises to 0.1 ms, so a single call is below its resolution and **the batch mean is the number**: **0.052 ms**
against the 0.5 ms gate. (`test_gielis` item 7 measures the ruler alone in node at 0.0525 ms — i.e. the Green trace is
essentially the whole CPU cost, and `N_Q` 512 is the knob.)

### Segments per tier (all twelve families drawn; `hud()`'s `seg <perRing>/<total>`)

| tier | `SEGT` per turn | per ring, q = 1 / 2 / 3 / 4 / 5 | total |
|---|---|---|---|
| 0 | 16 | 16 / 32 / 48 / 64 / 80 | **4 144** |
| 1 | 26 | 26 / 52 / 78 / 96 / 96 | **5 726** |
| 2 | 38 | 38 / 76 / 96 / 96 / 96 | **6 566** |
| 3 | 52 | 52 / 96 / 96 / 96 / 96 | **7 140** |

`SEGMAX` 96 caps a ring; `RINGS` 7 never changes with the tier (`cuts: 'continuous'` — a tier flip may only change
segments per ring). The twelve families always cover all twelve intervals, so the multiset of turn counts
{1,1,1,2,2,3,3,4,5,5,5,5} is the same in every key and the totals above are key-independent. The resting count of six
or seven families draws 3 200–3 800 at tier 3.

## The bar-series Q table of step 3 (`hooks.green()`, per frame)

**The gate window — f840–960 of `#test`, the fake's PEAK (kick 1 on every beat, `eS` 0.54–0.57):**

| beat | m | rest Q | trough Q | swing | beatPhase at the trough | n1 min |
|---|---|---|---|---|---|---|
| 29 | 5.000 | 0.9954 | 0.7761 | **0.2193** | 0.002 | 1.200 |
| 30 | 5.000 | 0.9954 | 0.7761 | **0.2193** | 0.001 | 1.200 |
| 31 | 5.000 | 0.9952 | 0.7761 | **0.2191** | 0.034 | 1.200 |
| 32 | 7.500 | 0.9911 | 0.6664 | **0.3247** | 0.998 | 1.200 |

n1 dips at beatPhase 0 on all four beats, the swing is ≥ 0.15 on all four, rest Q ≥ 0.991, and the pinch reaches
`N1_BEAT` exactly. (Beats 28 and 33 are the window's partial edges, two samples each, and are not counted.)

**The brief's window — f600–720, which on the fake timeline is the BUILD (kick 0, `eS` 0.145–0.289, so the depth is
0.57–0.64 and the press cannot reach 1):**

| beat | rest Q | trough Q | swing | beatPhase at the trough | n1 min |
|---|---|---|---|---|---|
| 20 | 0.9916 | 0.8741 | 0.1175 | 0.977 | 1.968 |
| 21 | 0.9916 | 0.8675 | 0.1241 | 0.976 | 1.901 |
| 22 | 0.9916 | 0.8608 | 0.1308 | 0.010 | 1.838 |
| 23 | 0.9916 | 0.7914 | 0.2002 | 0.973 | 1.808 |
| 24 | 0.9897 | 0.7777 | 0.2120 | 0.008 | 1.786 |

n1 dips at beatPhase 0 on every beat here too, rest Q ≥ 0.9897, and the swing is 0.118–0.212 — two of five over the
0.15 gate. That is the shallow end by construction: the depth scales with `eS`, which is the rule that makes 25 s
press harder than 0–13 s on SeeYouDrop. The orchestrator's per-frame track ruler on 25–63 s is the real test.

## The wave positions of step 4 (`hooks.info()`, `&pinch=6`)

| pin | frame | `info().kick` | gaps | `snare` | `hat` |
|---|---|---|---|---|---|
| `train('4x4')` | 480 | .1333 .1333 .3833 .3833 .6333 .6333 .8833 .8833 | **.25 .25 .25** | — | — |
| `train('sync')` | 700 | .0278 .0278 .1528 .1528 .5278 .5278 .6528 .6528 | **.125 .375 .125** | — | — |
| edge detector | 900 | .2497 .4994 .7492 .9989 | .25 | .4994 .9989 | .1206 .2497 .3703 .4994 .62 .7492 .8697 .9989 |

Each pinned position is doubled because a wave a bar old sits exactly where the new one launches (TORUS2's
de-duplication note). The absolute offset of the 4x4 train is 0.1333 and not 0 because f480 is not a bar line — the
brief's "`[0, .25, .5, .75]` ± 0.01" holds at a bar line; the **gaps** are what the pattern promises, and they are
exact. At f900 all three bands are live (`live` 14) — `math/waves.js`'s `HI` 0.45 is below `#test`'s hat, which is
exactly 0.5.

## The m-per-family table of step 2 (`math/gielis.js mTable()`, `M0` 4, `QCAP` 5)

| interval | name | ratio p/q | exact M0·p/q | m drawn | turns q (symmetric / lopsided) | lobes over those turns |
|---|---|---|---|---|---|---|
| 0 | unison | 1/1 | 4.0000 | **4** | 1 / 1 | 4 — a rounded square |
| 1 | minor 2nd | 16/15 | 4.2667 | **17/4** | 4 / 8 | 17 — *the one snapped entry* |
| 2 | major 2nd | 9/8 | 4.5000 | **9/2** | 2 / 4 | 9 |
| 3 | minor 3rd | 6/5 | 4.8000 | **24/5** | 5 / 5 | 24 |
| 4 | major 3rd | 5/4 | 5.0000 | **5** | 1 / 2 | 5 |
| 5 | fourth | 4/3 | 5.3333 | **16/3** | 3 / 3 | 16 |
| 6 | tritone | 7/5 | 5.6000 | **28/5** | 5 / 5 | 28 |
| 7 | fifth | 3/2 | 6.0000 | **6** | 1 / 1 | 6 |
| 8 | minor 6th | 8/5 | 6.4000 | **32/5** | 5 / 5 | 32 |
| 9 | major 6th | 5/3 | 6.6667 | **20/3** | 3 / 3 | 20 |
| 10 | minor 7th | 9/5 | 7.2000 | **36/5** | 5 / 5 | 36 |
| 11 | major 7th | 15/8 | 7.5000 | **15/2** | 2 / 4 | 15 |

Twelve distinct lobe counts, so twelve distinct shapes; consonances are simple and close in one turn, dissonances are
starry and take three to five. Verified live: with `hooks.key(0)` `info().m` is `0:4/q1 · 7:6/q1 · 4:5/q1 · 6:5.6/q5 ·
1:4.25/q4 …`; with `hooks.key(7)` the whole table rotates (`7:4/q1 · 2:6/q1 · 11:5/q1`).

## The parameters (CONTRACTS §1.16)

| name | eli5 | range | from(MS) | deps | lo → hi |
|---|---|---|---|---|---|
| `breath` | how deep every shape pinches on the beat | [0, 1] | `0.5 + 0.5·eS` | eS | smooth round rings (Q 0.992, n1 10.07) → densely pinched stars on every beat (Q 0.689, n1 1.275) — `gi-br-lo/hi` |
| `wave` | how deep the bump a kick sends travelling round every ring | [0, 0.4] | `WAVE0 + 0.1·kick` | kick | a clean ring → a ring with four deep travelling lobes |
| `turn` | where the whole nest has been nudged to, in the turn it makes every sixteen beats | [0, 6.2832] | `((beatCount/16)·2π) mod 2π` | beatCount | the yaw the ease is chasing; a route can spin the nest freely |
| `size` | how much of the screen the nest fills | [0.4, 0.9] | `.58 + .1·intensity + .07·arousal + .15·min(1, max(0, 2·build−1))` | intensity, arousal, build | a small nest adrift → filling the short edge (clamped at `FILLMAX` 0.85) |
| `lean` | how far the lobes are pulled toward the section's template | [0, 1] | `MORPHK·tension·(arc === 'idle' ? 0 : 1)` | tension, arc | the base pinch (Q 0.857) → the section's own template (Q 0.714) — `gi-ln-lo/hi` |
| `glow` | how brightly the inner shapes are kept lit | [0, 0.5] | `FLOOR·(1 − GLOWQ·max(hush, calm))` | hush, calm | 0 = a dark interior, 0.5 = every family near the loudest one's brightness |

`CARD.paramsOf('gielis')` at f360 = `{breath 0.7897972667038737, wave 0.2917958841655991, turn 4.71238898038469,
size 0.6615594059217454, lean 0.1799988940417764, glow 0.12239999999999998}` — all finite and in range;
`paramsOf === derived` for all six with a difference of exactly **0**. `&param=gielis.breath=c:1` → `PROUTE.n` 1 and
the s10 md5s move to `794e40d0` / `7c210b0a`. `lean`'s `deps` are `[tension, arc]` and not `[arc]` alone, because it is
written `a·(cond ? 0 : 1)` (TORUS2's short-circuit find, §1.16).

**The move itself:** five of the six `from()`s are the inline expressions of steps 1–7 moved whole, and are
byte-identical — proven by `&param=gielis.wave=c:0.26` (the constant the sixth replaced) reproducing the pre-move pair
`d7806c9b` / `a0097ad3` exactly. `wave` is the one behavioural change and is declared as such (friction 14).

## The shots (all in `tools/work/`, untracked)

| file | what it shows |
|---|---|
| `gi-step1.jpg` | four-up: `#test` f360/f840 and `&demo=house` f360/f840 at rest — a nest of twelve rounded shells, the loudest outermost and brightest, none dark, the interior full of visible rings rather than fog. |
| `gi-step2.jpg` | `&key=0` beside `&key=7` at the same CLOCK frame 420 with the same pinch and the same loudest pitch class: m 6.667 over three turns (Q 0.626) against m 4.5 over two (Q 0.747) — the families re-shaped by the key alone. |
| `gi-step3.jpg` | beat 30 at beatPhase 0 / .25 / .5 / .75 (n1 1.20 / 5.21 / 7.37 / 9.43): pinched starry diamonds on the beat, round rings half a beat later. This is the user's "collapses into interesting shapes, then the silence rebounds to the circle". |
| `gi-step4.jpg` | the 4x4 train (four evenly spaced bumps round every ring), the sync train (bunched in pairs), and the real `#test` edge detector — magenta bumps of the launching family riding the cyan rings. |
| `gi-step5.jpg` | `hooks.key(0, 0)` beside `hooks.key(0, 1)`: identical geometry, two different halves of the wheel — magenta/red against yellow/green. A pull, not an offset. |
| `gi-portrait.jpg` | `WIN=720,1280` (aspect 0.6035) at f720: the nest fits the width with room above and below; nothing crops. |
| `gi-step7a.jpg` | five-up: petal at lean 0 / 0.43 / 0.84 (a pinched star relaxing into full round rings), shard at 0.90 (sharp square lobes, smaller), blade at 0.90 (lopsided and stretched, the b 1.31 axis visible). |
| `gi-step7b.jpg` | the drop at f775 / f785 / f800: the full nest, then the collapse (a small white core inside the composite's flash), then the rebound at about half size climbing back. |
| `gi-step8.jpg` | the parameter lo/hi pairs — `breath` 0 vs 1 (smooth rings vs dense stars) and `lean` 0 vs 1 (rounder vs sharper lobes). |
| `gi-acc2.jpg` | acceptance 2's t6 and t14: the resting nest, then the drop's rebound with pink lobes thrown out. |
| `gi-acc3.jpg` | acceptance 3's house 10/30/50 s: a dense gold-and-pink groove nest, a calm violet breakdown of clean round rings, a bright pink-and-gold nest with the waves visible. Three different frames. |

## Test hooks and the exact shapes they return

`CARD.REG[10].scene.hooks.<name>` — `key` and `pinch` share a word with other scenes, so every proof spells the `REG`
path. One-argument hooks also answer `&name=v` in the hash (`&still=1`, `&pinch=1.2`, `&key=7`, `&template=2`).

| hook | arguments | returns |
|---|---|---|
| `info()` | — | the JSON string below |
| `green()` | — | `{Q, A, L, n1, m}` of the loudest family — read only, never a pin |
| `train(v)` | `'4x4' \| 'sync' \| null` | the mode it set |
| `key(k, mode)` | two | `'{"k":0,"m":1}'` or `null` — pins the key for BOTH the colours and the shapes |
| `pinch(v)` | one | the pinned `n1`, or −1 |
| `template(i)` | one | the pinned template index, or −1 |
| `still(v)` | one (or none) | — ; pins every uniform a later step introduced at its rest value |
| `timeUpdate(n)` | one | `{med, mean, tot, n}` in ms — measurement only; it advances the nest's state |

```js
green()  →  { Q: 0.884000, A: 2.985000, L: 6.510000, n1: 2.1317, m: 6 }

info()   →  { n1, pinch, Q, loudest, m: ["9:6.667/q3", …, twelve "pc:m/qTurns" in LOUDNESS order],
              draw, seg, segs, morph, template: "round"|"petal"|"blade"|"shard", tFade,
              lean: [n2, n3, a, b], collapse, slip, twist, key, mode, hue, sat, spread,
              beat, press, med, flash, shim, turn, turnT, bounce, wave, fibF,
              size, dist, tier, still, live, kick: [positions], snare: [positions], hat: [positions] }
```

`hud()` is one line: `gielis pc<loudest> m <m> n1 <n1> Q <Q> waves <live> key <k><M|m> turn <turn> size <fill>
tmpl <name> morph <morph> seg <perRing>/<total> t<tier>`.

## The final `feats` (38) and the `post` params

```
chroma harmAngle key mode keyConf valence beat beatPhase beatCount bpm barPos phrase16Pos kick snare hat sub bass
eS build tension intensity arousal arc sectionAlt sectionEvt dropEvt dropEnv surpriseEvt riser roll flowBass flowMid
flowHigh presence hush calm alive novelty
```
`clarity` and `regularity` are **dropped**: `score(MS) { return 0; }` reads nothing, so listing them would be a lie the
help view shows. `check.js`'s static read check finds all 38 (no `the bid:` lines, no stale entries).
`post: { fb: { decay: 0.85 }, bloom: { thr: 0.3 }, kaleido: 0, morph: { flow: 0.4 } }` — TORUS2's, unchanged: the
geometry is its own symmetry so no kaleidoscope, and long trails suit strokes.
`colour: { default: 'v2', variants: { v2: {} } }` — **the oklch variant is not built** (the brief forbids adding it).

## Line counts

| module | lines |
|---|---|
| `assets/scenes/gielis/nest.js` | 326 |
| `assets/scenes/gielis/index.js` | 254 |
| `assets/scenes/gielis/shaders.js` | 191 |
| `assets/scenes/gielis/help.js` | 48 |
| **scene total** | **819** |
| `assets/math/gielis.js` | 133 |
| `tools/test_gielis.js` | 98 |

All four scene modules are under the 350 soft cap; nothing near the 500 hard cap.

---

## What I would tune first when the user looks — the leans I am least sure of

1. **`SEGT` / `SEGMAX` and the q-turn coarseness (`nest.js`).** This is the one place where the brief's budget and the
   picture visibly disagree. A five-turn family (the tritone, 28 lobes) gets 96 segments for five turns = 19 per turn,
   under seven per lobe, and its lobes read as a polygon rather than a curve at the rim. The 8 000-segment cap that
   forces it comes from DECISIONS §14's **path-A** rate; path B measures 0.067–0.092 µs/segment here, so the true
   headroom is roughly 3×. `SEGT = [24, 40, 60, 84]` with `SEGMAX` 160 would be ~11 700 segments and, on this bench,
   about 1.0 ms — still 0.75× TORUS2. First thing I would change.
2. **`N1_BEAT` 1.2 and `HIT_K` 0.3 (`nest.js`).** The reparametrisation (friction 3) is the important part and I am
   confident in it; the *endpoint* is a taste call. 1.2 puts every family over the brief's swing gate, but on the
   fake's peak the whole nest reaches the full pinch on every single beat, which may read as too much once the track's
   own dynamics are under it. `N1_BEAT` 1.5 with the reciprocal law is the obvious next try (swing 0.14–0.30).
3. **`M0` 4 and the ratio table against the fallback `m = k + 3`.** The ratios are the reason the shapes differ, and
   they differ a lot — but the STARRY families (m 7.2, 7.5, 32/5) are much busier than the consonant ones, so a nest
   whose loudest family is a minor seventh looks categorically different from one on the tonic. If the user reads that
   as noise rather than as species, `mOf()` is one function and the swap is one line (the whole table lives in
   `math/gielis.js`).
4. **`KNEE` 0.8 / `KNEE_S` 3 and `FLOOR` 0.18 (the `glow` parameter).** The measured p95 luminance is 0.54–0.69 on the
   bright frames and 0.15 in a breakdown — under the brief's 0.6–0.8 band on everything but the drop. If the user says
   "too dim", raising `FLOOR` toward 0.3 lights the interior without touching the rim; if "too bright", `KNEE` 0.6.
   I have not seen this on a real track.
5. **`WAVE0` 0.26 and `WAVEW` (`nest.js`).** Inherited from TORUS2, where 0.26 was the number the user accepted on a
   144-ring nest; on twelve shells with far fewer rings the same fraction may be too fat. The `wave` parameter's
   resting value is `WAVE0`, so a route can answer this question without a code change.
6. **The four templates.** `round` is now `(1, 1, 1, 1)` and therefore identical to `BASE` — which means a `round`
   section shows no lean at all, and only three of the four templates do anything. That is defensible (one section in
   four is "plain") but it was not the brief's intent, and a fourth distinct lean (e.g. `(2, 0.7, 1, 1)`) would make
   every section its own shape.
7. **`RINGS` 7 and `PHI_MAX` 0.85.** Seven rings reads as a stack of hoops more than as a surface; 9 or 11 would look
   like a shell, at a proportional cost. The brief fixed 7 and I did not move it.
8. **`ATK` 0.12 s (the drop's attack).** Chosen as the smallest value that keeps the continuity monitor at `viol []`
   (0.06 gave two violations of 0.063–0.072). If the user wants the drop to hit harder, the honest answer is not a
   faster attack but a declared cut — `cuts: 'event'` and a `pathCut` that goes to 0 on `dropEvt` — which is a
   contract change and the orchestrator's call.

## Not done

- **The `oklch` colour variant** — the brief forbids it ("OKLCH is a later opt-in; do not add it"). `colour` declares
  `v2` alone, which is honest.
- **`site/thumbs/gielis.jpg`** — `tools/thumbs.sh` pins a frame per scene and is outside this worker's file list, so
  `check.js` warns. One `tools/thumbs.sh "10:<frame>"` run when the user approves the look.
- **Any run on SeeYouDrop.** A track cannot be played headlessly; every number above is `#test` or a demo synth. The
  intro / groove / breakdown / double-time / drop windows and the per-beat rulers are the orchestrator's after the merge.
- **The `score()` expression behind the 0** — the brief asked for `score(MS) { return 0; }` with no reads, and that is
  what is there.

---

# Pass 1 — the retune, 2026-09-27 (v0.14, scene id 10)

**Prompt:** the user on the first build — *"shouldn't the superformula be making more shapes?"* — then "yes retune" to
three items: lobes at rest, a lean that differs per family, and a species in the second curve plus meridians.
Worktree `.claude/worktrees/agent-a749d206f4a01c782`, branch `worktree-agent-a749d206f4a01c782`, reset onto `main`
(`e651a5c`, the merged v0.14) — the branch was still at v0.13 and had no GIELIS at all. Three commits, one per item,
each proven before the next. Not merged. `PORT=8811` on every cdp run; one Chrome at a time.

## The constants, before → after

| constant | file | before | after | why |
|---|---|---|---|---|
| `N1_REST` | nest.js | 12 | **2.0** | 12 is a circle for every m (root Q 0.998), so the species existed only during the thump. Swept against the brief's "root Q about 0.90–0.95". |
| `N1_BEAT` | nest.js | 1.2 | **0.6** | the pinch now travels from a shape to a star; `N1_MIN` 0.5 untouched and never reached |
| `SUBK`'s target | nest.js | `a, b` | **the family's radius** | `a > 1` scales r by `a^(n2/n1)` = 1.18^6.67 at the new pinch and puts a narrow spike at θ = 0 that a drawn ring at φ = 0 lands on (2.85× measured) |
| — | nest.js | — | **`NRM` 64 / `NRM_PHI` 65 / `normOf()`** | new: each family scaled by 1/max(1, r1max·r2max) of its own profile |
| `LEAN_C` | nest.js | — (no per-family lean) | **0.7, `n2 = 1 − LEAN_C·chroma[k]`** | the brief's `1 + 1.5·chroma` pulls the exponent UP toward 2, and (2, 2) is exactly a circle — see friction 1 |
| `LEAN_V` | nest.js | — | **1.0, `n3 = 1 + LEAN_V·(0.5 − valence)·2`** | the brief's, unchanged |
| `LEAN_MIN` / `LEAN_MAX` | nest.js | — | **0.2 / 6** | `pow(0, 0)` is undefined in GLSL; an exponent at 0 is a NaN waiting |
| `TEMPLATES[0]` | nest.js | `round` (1, 1, 1, 1) = BASE | **`bloom` (2, 0.5, 1, 1)** | `round` was BASE, so one section in four showed no lean (AUDIT-v0.14 §5 item 3) |
| template composition | nest.js | replacement: `mix(BASE, T, morph)` | **offset: `base_k + morph·(T − BASE)`** | so a family keeps its own identity through every section |
| `M_PHI` | nest.js | 4, the shared latitude lobe count | **the family's own m** (M_PHI survives as the *witness's* reference profile only) | the body was a ball of hoops |
| `N1_PHI` | nest.js | — (the latitude used `uN1`) | **4** | shaped in latitude, never spiky |
| `MERID` | nest.js | — | **6 per family**, `SEGM` = `SEGT[tier]` | so the 3D shape reads (AUDIT-v0.14 §5 item 4) |
| `SEGMAX` | nest.js | 96 | **112** | the headroom §5 item 4 identified; `SEGT` [16, 26, 38, 52] unchanged |
| `uLean` | shaders.js | `vec4` | **`vec4[12]`** | per slot |
| `uOpen` | shaders.js | `float` | **`float[12]`** | an odd numerator with a lopsided lean needs 2q turns, so only those rings skip the wrapping segment |
| `uMPhi` | shaders.js | `float` | **removed**; `uN1Phi`, `uSegR[12]`, `uSegM`, `uMerid`, `uNorm[12]` are new | |

Unchanged and deliberately so: `HIT_K` 0.3, the reciprocal press law `pinchOf`, `RINGS` 7, `PHI_MAX` 0.85, `SEGT`,
`FLOOR` 0.18, `KNEE` 0.8, `WAVE0` 0.26, `MORPHK` 0.9, `ATK` 0.12, the six parameters, `M0` 4 and the ratio table.

## Rest Q per species at `N1_REST` 2.0 (base lean, `tools/test_gielis.js` item 4)

| interval | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| m | 4.000 | 4.250 | 4.500 | 4.800 | 5.000 | 5.333 | 5.600 | 6.000 | 6.400 | 6.667 | 7.200 | 7.500 |
| **rest Q** | **0.936** | 0.892 | 0.877 | 0.885 | 0.906 | 0.851 | 0.845 | 0.870 | 0.811 | 0.811 | 0.798 | **0.776** |
| beat Q | 0.569 | 0.478 | 0.452 | 0.451 | 0.468 | 0.378 | 0.371 | 0.383 | 0.309 | 0.309 | 0.281 | 0.262 |
| swing | 0.367 | 0.414 | 0.425 | 0.434 | 0.438 | 0.473 | 0.474 | 0.487 | 0.502 | 0.502 | 0.517 | 0.514 |

As built these read **0.998 … 0.991** at rest, i.e. twelve circles. The root is now a clearly rounded square (0.936,
inside the brief's 0.90–0.95 band) and the major seventh a visible fifteen-lobed star at 0.776 **with no beat landing**.
The n1 sweep behind the choice (root / fifth / tritone): 1.6 .904/.811/.786 · 1.8 .923/.844/.819 · **2.0 .936/.870/.845**
· 2.2 .947/.890/.866 · 2.4 .955/.906/.882 · 3.0 (the brief's lean) .971/.938/.917 · 12 (as built) .998/.996/.991.
The per-family lean then pushes them further: at a plausible chroma the twelve rest at **0.744–0.860** at one and the
same m, from the lean alone.

## The bar series (per frame, `#test` f840–960, the fake's peak; `tools/work/qtrace.sh` + `perbeat.py`)

| beat | as built | after item 1 | after items 2 & 3 (final) |
|---|---|---|---|
| 29 | rest .995 → .776, swing **0.219** | rest .807 → .329, swing **0.478** | rest .728 → .271, swing **0.457** |
| 30 | rest .995 → .776, swing **0.219** | rest .820 → .337, swing **0.484** | rest .733 → .264, swing **0.469** |
| 31 | rest .995 → .776, swing **0.219** | rest .838 → .342, swing **0.496** | rest .727 → .258, swing **0.469** |
| 32 | rest .991 → .666, swing **0.325** | rest .834 → .303, swing **0.531** | rest .698 → .190, swing **0.508** |

4/4 beats over the 0.15 gate on every pass, n1 reaching exactly `N1_BEAT` 0.600 at beatPhase 0 on all four. The rest
state is **not** a circle any more: 0.698–0.733 on the loudest family with the section's lean on it (0.776–0.936 at the
base lean, per species, table above). Between beats n1 tops out at 1.78–1.85 rather than at `N1_REST`, because the
fake's peak holds `kick` ≈ 0.12 between hits and `HIT_K` 0.3 rides on top — by design.

## The continuity monitor (60 s of `test&fake=0&scene=10`, `CARD.NAV = CARD.REG[10].scene.state` before the MON snippet)

```
as built   n 3606  fast 0  max 0.0533  viol []
item 1     n 3607  fast 0  max 0.0466  viol []      errs [] bad [] scene 10
item 2     n 3603  fast 0  max 0.0557  viol []      errs [] bad [] scene 10
item 3     n 3607  fast 0  max 0.0414  viol []      errs [] bad [] scene 10
```
Under the 0.06 spike rule throughout, and the deeper pinch did **not** move it up: the radius normalisation bounds the
witness's travel, which is why item 1 came out *below* the build. The witness keeps `M_PHI` as its own reference
latitude profile deliberately — it must stay species-free, and the loudest family changes by a swap.

## The bench (HARNESS "Bench protocol": `q` pinned .95, `CARD.fix` widest, 9 s settle, cold discarded, n = 300, five interleaved pairs, each scene forced in its own page)

| pair | GIELIS s10 (ms) | NAV (ms) | | TORUS2 s3 (ms) | NAV (ms) |
|---|---|---|---|---|---|
| 1 | 0.677 | 3.175 | | 1.227 | 3.162 |
| 2 | 0.686 | 3.074 | | 1.223 | 3.069 |
| 3 | 0.662 | 2.569 | | 1.561 | 2.635 |
| 4 | 0.691 | 2.552 | | 1.537 | 2.632 |
| 5 | 0.642 | 2.632 | | 1.523 | 2.607 |
| **median** | **0.677** | **2.632** | | **1.523** | **2.635** |

| statistic | GIELIS / TORUS2 | cap |
|---|---|---|
| medians of the raw ms | **0.444×** | 1.5 |
| NAV-normalised | **0.445×** | 1.5 |
| median of the per-pair ratios | **0.418×** | 1.5 |

Cold calls discarded: GIELIS 1.147, TORUS2 1.371. `errs []`, no `glerr`. CPU side `hooks.timeUpdate(300)`:
mean **0.153 ms** (median reads 0.200 — the browser's 0.1 ms timer quantum), against the 0.5 ms gate; ~0.1 ms of that
is the new per-family normalisation (12 × (64 + 65) `sf()` calls). It was 0.052 ms as built.

### Segments per tier (all twelve families drawn, `CARD.Q.q` pinned per tier, read off `hooks.info()`)

| tier | `SEGT` per turn | segments on a ring, q = 1 / 2 / 3 / 4 / 5 | per meridian | rings | meridians | **total** |
|---|---|---|---|---|---|---|
| 0 | 16 | 16 / 32 / 48 / 64 / 80 | 16 | 4 144 | 1 152 | **5 296** |
| 1 | 26 | 26 / 52 / 78 / 104 / 112 | 26 | 6 230 | 1 872 | **8 102** |
| 2 | 38 | 38 / 76 / 112 / 112 / 112 | 38 | 7 350 | 2 736 | **10 086** |
| 3 | 52 | 52 / 104 / 112 / 112 / 112 | 52 | 8 036 | 3 744 | **11 780** |

`SEGMAX` 112 caps a ring; `RINGS` 7 and `MERID` 6 never change with the tier (`cuts: 'continuous'`). The turn-count
multiset {1,1,1,2,2,3,3,4,5,5,5,5} is the same in every key, so the totals are key-independent.

## The md5s (`IDS=10 tools/scene-md5.sh`, two runs each, all stable)

```
                          f360                              f840
as built (re-measured)    2c1b21c8c5553ab84008ac7060cbfa00  2e978a09fc3ebb8d1aa428911a6be16d
item 1  plain             e91161023972672f8868a9732c48e84b  6970bebf5ae044c00f7721a5275654b5
item 1  still             210b10a729a6db429bd4346147682d87  71d961375e18d3b59783497758f91202   (RE-BASED)
item 2  plain             0b60b4146b1173562d52d484aa71ad87  e280f33f8d487c7e341d2e7b6f67b950
item 2  still             210b10a729a6db429bd4346147682d87  71d961375e18d3b59783497758f91202   (unchanged — the gate held)
item 3  plain (FINAL)     4f6c8cb0967dc1a84bda3b3a297b575f  1dc4cb4c398172f5339af25aac1cd469
item 3  still (FINAL)     fd8e256b9f1b8c9a5d38000bfa0d4d47  88f6d5cbc667aac1d39321e3b32fd46b   (RE-BASED)
```
The build's plain pair reproduced **exactly** on this machine before any edit (the previous commit's scene files checked
back out into the tree, shot, then restored) — which is what makes the before/after montages comparable.
**Two re-bases, both declared.** Item 1: the rest state itself is what changed, so a rest frame must change.
Item 3: the meridians and the latitude species are *geometry*, not music-driven uniforms, so `still` cannot pin them
away. Item 2 is the interesting one — it re-laid `uLean` from a `vec4` to a `vec4[12]` and `uOpen` to an array, and the
still pair came out **byte-identical**, which is exactly the no-op gate earning its keep.

## The shots (all `tools/work/`, untracked)

| file | one sentence |
|---|---|
| `gi-p1-item1.jpg` | before/after, `#test` f360 + f840 and house 10 + 30 s: every ring is a lobed polygon on every frame where before it was a smooth circle — the species are visible with no beat landing. |
| `gi-p1-item1b.jpg` | house 50 s before/after: the same nest of stacked hoops becomes a stack of four- and five-lobed plates, and the beat's pinch now bites from a shape rather than from a circle. |
| `gi-p1-item2.jpg` | before/after: the families no longer share one outline — the loud outer ones are sharp lopsided stars while the quiet inner ones stay round, so the nest reads as twelve different things rather than twelve sizes of one thing. |
| `gi-p1-item2-tmpl.jpg` | `hooks.template(0..3)` at `&param=gielis.lean=c:1`: bloom (tall, spiky, leaning), petal (wide and fluffy), blade (a fat rounded barrel), shard (a small sharp star) — four visibly different sections where one used to be a no-op. |
| `a2-key81.jpg` | `hooks.key(8, 1)` at f360 with the numbers: loudest three `9:m4.25 lean 0.30/1.54`, `2:m5.6 0.37/1.54`, `4:m6.4 0.41/1.54` — one n2 per family, one n3 for the nest, `open` 1 on four of twelve. |
| `gi-p1-item3.jpg` | before/after: the six meridians tie the seven hoops into one surface and the latitude species bulges the silhouette, so the thing reads as a solid instead of a lantern. |
| `gi-p1-item3b.jpg` | house 50 s: the same frame gains a woven pole-to-pole cage; the shape is now legible as a 3D body at a glance. |
| `gi-p1-overall.jpg` | the whole pass, build vs final on four frames: smooth stacked circles → a lobed, meridian-tied solid whose twelve species are visible at rest. |
| `gi-p1-acc.jpg` | `t6` (the nest at rest with the fallback key, meridians and all), `t14` (the 13 s drop's rebound), and the portrait run. |
| `a3-portrait.jpg` | `WIN=720,1280` at f720: a globe of rings and meridians, comfortably inside the short edge — nothing crops. |

## Friction — what the docs and the brief lacked, and every lean changed

1. **[lean changed, the big one] The brief's per-family lean has the wrong sign.** `n2 = 1 + LEAN_C·chroma` with
   `LEAN_C` 1.5 pulls the exponent **up** toward 2, and (2, 2) is exactly a circle — the build's own finding, one
   section above this one. Built as written and measured on the first montage: the loudest family on `#test` drew
   n2 **2.50**, and its rest Q went 0.936 → **0.976** while its beat Q went 0.569 → **0.808**. The one shape the eye
   follows became the roundest thing on screen and item 1's whole gain was spent on it. Inverted:
   `n2 = 1 − LEAN_C·chroma`, `LEAN_C` **0.7** — the largest span that keeps all twelve clear of the `LEAN_MIN` clamp
   (n2 0.30–0.93, rest Q 0.744–0.860). The loudest family is now both the most lopsided *and* the most shaped, which
   is what "more shapes" asks for. `LEAN_V` is the brief's 1.0, untouched.
2. **[lean changed] `N1_REST` 2.0, not the brief's 3.** The brief gave the lean *and* the measurement that overrides
   it ("root Q about 0.90–0.95"); 3 measures 0.971, still a circle to the eye. 2.0 is mid-band. This is the brief
   working as designed, not a disagreement.
3. **A deep pinch needs a radius normalisation, and the brief does not mention one.** `r = base^(−1/n1)` amplifies any
   `base < 1` by the exponent, which is now 1.667 instead of 0.833. Over every reachable lean × the twelve species the
   *unnormalised* drawn radius reaches **9.8×** the family's own (it hits the `R_MAX` 4 clamp) where the camera frames
   `RAD` 1. This is not a taste question — it crops. `normOf()` scales each family by 1/max(1, r1max·r2max) of its own
   profile; a symmetric lean normalises by exactly 1, so it is provably a no-op on those frames. Worst case after:
   **1.0095×** over 46 656 cases, inside `FILLMAX` 0.85. It is also *what a pinch should look like*: the valleys pull
   in and the lobe tips stay at the family's radius.
4. **The normaliser must be sampled in the superformula's own argument.** `t = m·θ/4` has period π whatever m is, so 64
   samples of [0, π) resolve every family equally; the same 64 spread over θ under-read the peak by 10 % at m 7.5.
   The latitude arm cannot use the trick (its φ range is fixed, not a period), and once the latitude carries the
   family's m its range spans up to 1.6 periods — hence `NRM_PHI` 65, and odd so that φ = 0, where r2 peaks, is sampled.
5. **[lean changed] `sub` may not fatten `a, b` at this pinch.** `a > 1` scales r by `a^(n2/n1)` = 1.18^6.67 = 3.1,
   *and* puts a narrow radial spike at θ = 0 (base = (1/a)^n2 < 1) that a 64-sample normaliser cannot see but a drawn
   ring at φ = 0 lands exactly on — 2.85× measured. Moved onto the family's **radius**, where it is linear, means the
   same thing to the eye, and cannot touch the exponents. It also makes a = 1 everywhere, which is what makes the
   normalisation accurate.
6. **A pre-existing bug the deep pinch exposed:** `nest.js` computed `N.open` from the lean and then assigned
   `N.open = 0` eleven lines later, so a lopsided template's ring drew a chord across the shape instead of skipping
   its wrapping segment. Invisible at n1 12; not invisible at n1 0.6.
7. **The open flag has to be per slot, and only odd numerators need it.** `closure()` already says so (`gen = 2q` for
   odd p, `q` for even), and the build's own test proves it — but the scene used one global flag. With a per-family
   lean *every* ring is lopsided, so a global flag would gap all twelve when only four need it. Measured live under
   key 8 minor: `open` = [1,0,0,1,0,1,0,0,0,1,0,0].
8. **The brief's "`uLean` becomes per-slot … keep every declared uniform fetched" is the whole story for `check.js`,**
   but the thing that actually needed care was `uMPhi`: once the latitude carries the family's m the uniform is dead,
   and a dead *declared* uniform fails the check. Removed, not left at a constant.
9. **`tools/cdp.js`'s step list is JSON on argv, so a `'` or a `"` inside an `eval` is a fight.** `'` did not
   survive the round trip in this session's shell. Every multi-step eval here is written to a file
   (`tools/work/steps-*.json`) and passed as `"$(cat …)"`. Worth a line in HARNESS.
10. **The worktree the Agent tool handed over was at v0.13** and contained no `assets/scenes/gielis/` at all — it had
    to be reset onto `main` before anything could start. Worth checking first in any pass-N session.
11. `tools/work/` is gitignored, so the helper scripts written there (`qtrace.sh`, `perbeat.py`, `steps-*.json`) are
    not committed. `perbeat.py` is a slimmer `perbeat14.py` that reads the per-frame collector's own trace format; if
    another pass wants it, it belongs in `tools/accept/v0.14/`.

## What I would tune next, in order

1. **Brightness.** Untouched this pass and still AUDIT-v0.14 §5 item 2: p95 luminance 0.20–0.45 on the groove against
   the brief's 0.6–0.8. The meridians add strokes, so the pass has probably moved it up a little, but nobody has
   measured it on the real track. `FLOOR` 0.18 → 0.3 lights the interior without touching the rim; `KNEE` 0.8 is the
   other end. **This is now the top item, ahead of everything below.**
2. **Size.** §5 item 1, also untouched: the nest fills ~40 % of the frame height on a black rim. `FILL0` 0.6,
   `FILLMAX` 0.85, `CAM_D` = FOV/fill. One constant.
3. **`LEAN_C` 0.7 and the sign.** I am confident the sign is right and can prove it; the *magnitude* is a taste call.
   At 0.7 the loudest family sits at n2 0.30, close to the 0.2 clamp — if the user wants the loud families gentler,
   0.5 keeps them at 0.50 and the twelve still separate cleanly.
4. **`N1_BEAT` 0.6.** Every beat now takes the whole nest to Q 0.19–0.33. That is a lot of deformation, and on a real
   track with `eS` already high it may read as thrashing rather than as breathing. 0.8 is the obvious next try
   (root beat Q ≈ 0.66, swing ≈ 0.28).
5. **`MERID` 6 and `RINGS` 7.** The meridians did the work the hoops could not, so the balance between the two is now
   the open question: 9 rings and 4 meridians is the same budget and a different object.
6. **`N1_PHI` 4.** Chosen as the brief's lean and not swept. If the body reads too smooth top-to-bottom, 2.5 shapes it
   harder; if it reads lumpy, 6.
7. **`M0` 4 and the ratio table against `m = k + 3`** — unchanged from the build's list, and now more consequential,
   because the species shows at rest and in latitude as well as on the beat.
8. **The hue wander** (§5 item 5) and **`WAVE0`** — both untouched, both still on the build's list.

## Not done this pass

- Anything on SeeYouDrop. Every number above is `#test` or the house synth; the track windows are the orchestrator's.
- `site/thumbs/gielis.jpg` — still the one allowed `check.js` warning, plus three pre-existing line caps
  (`nest.js` is now 438 lines against the 350 soft cap, 500 hard).
- The brightness and size items, which are the top of the list above and were not in this pass's three.
