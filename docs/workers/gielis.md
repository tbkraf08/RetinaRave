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
