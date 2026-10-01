# An AGC-free loudness for the engine — a plan (2026-09-30)

Written on the user's word ("plan it") after DECISIONS §60 step 1 / §60's pass-2 table.
**STATUS, 2026-09-30, on the user's word "loudness plan approved": phases 1, 2, 3, **4**, 5, 7, **8** are BUILT — see the
phase table in §8 for the commit of each, `docs/DECISIONS.md` §63 for phases 1–3/5/7 and **§65 for phase 4 (DUST)**.
Only phase 6 (NAV2) is NOT built, still blocked on the user un-pausing NAV2. Nothing is tagged, pushed or deployed.
The user's eye on the look — four scenes now — is the one gate still open.** The measured numbers below are from the planning session; where the build disagreed with them §63 says
so (the headline pair is +2.88 LU / ×1.94 in power, not +2.65 / ×1.84).

## 1. The problem, in numbers

§60's one failure: SeeYouDrop's breakdown 2 did not improve, because **the engine's energy does not know the drop
after it is louder**. Equal 5.1 s windows, breakdown 2 = 100.5–105.596 s, drop 2's head = 105.596–110.7 s
(`tools/filetrace.js SeeYouDrop 95 135`, det, 2401 frames):

| | `eM` | `eS` | `lvl` | `eMax` | `eG` | **true loudness (BS.1770)** |
|---|---|---|---|---|---|---|
| breakdown 2 | 0.739 | 0.644 | 0.606 | 0.862 | 0.152 | **−4.84** LKFS (short-term p50) |
| drop 2 | 0.735 | 0.784 | 0.866 | 0.794 | 0.597 | **−2.19** LKFS |
| ratio | **×0.994** | ×1.22 | ×1.43 | ×0.92 | ×3.94 | **+2.65 LU = ×1.84 in power** |

On §60's own windows (breakdown 100.5–104, drop 2 whole) `eM` is 0.770 → 0.769, ×0.999. Window-integrated LKFS:
−4.02 → −2.14, **+1.88 LU**; momentary (400 ms) p50 −3.83 → −2.10. The whole track integrates to −3.89 LKFS, and
the section ladder is unambiguous: intro −8.32, groove −3.99, breakdown 1 −6.09, void −4.67, drop 1 −2.90,
breakdown 2 −4.02, drop 2 −2.14, outro −6.62. **The music says +1.9 to +2.7 LU; `eM` says 0.0 and `eMax` says −0.4.**

Why. `eM` = `ema(pow(.45·bass + .35·mid + .2·high, .8), 2.5 s)` (`features.js:152`) over band followers that are each
AGC-normalised by a **running peak with a 14 s release** (`synapse/dsp.js:79`: `pk = max(raw, floor, pk·exp(−dt/14))`,
then `n = (raw/(pk·.92))^.8`). 14 s is shorter than a dubstep breakdown, so by the end of one the peak has decayed
onto the breakdown's own level and every band reads near full. `lvl` is the same thing at the master
(`pow(rms/peak·.9, .7)`, p05 0.513 / p50 0.882 / p95 0.992 over 20–110 s — §60 step 1). `eMax` is a 60 s decay on
`eM` and so inherits it. **`eG` already gets it right (×3.94)** — it is the track map's per-bar energy mapped p5→0,
p98→1 over the whole track — but it is **non-causal, file-mode only** (`mapOn` 0 in every live mode) and bar-grained.
`eG` is the proof that the quantity is useful; this plan is the causal, continuous, every-mode version of it.

Two scenes have already paid for this privately: **DUST's `dyn.js`** (§60 step 1 — a track-level running peak, instant
attack / 25 s release / floored 0.84, driving base brightness, grain size and swarm radius) and **NAV2's
`detect.js`** (`ePk` on `eS`, `E_PK_TAU` / `E_PK_MIN`). Two independent workarounds for one engine gap.

## 2. The measure

**ITU-R BS.1770-4 K-weighting**, which is the one measure of "how loud does this sound" with a standard behind it,
is two biquads per channel (a +4 dB high shelf, then an RLB high-pass) and a mean square:
`L = −0.691 + 10·log10(Σ_ch G_ch · mean(y_ch²))`, `G_L = G_R = 1.0`. Windows: **momentary 400 ms**, **short-term 3 s**.
The 48 kHz coefficients are the spec's constants; other rates need them re-derived (the spec's bilinear recipe) —
so the stage must either hold a small table or derive at `AU.ctx.sampleRate`, and the engine already sees 44.1 and 48.

The offline truth tool does **not** use this today: `trackmap.py` measures per-bar band energy and percentiles
("the macro arc an AGC flattens"), which is what `eG` reproduces. So phase 1 below adds the reference, not just the
field — otherwise there is nothing to grade the engine against.

## 3. The proposed fields

| field | kind | what | formula |
|---|---|---|---|
| `loudM` | level | momentary loudness, LKFS | BS.1770 K-weighted mean square over 400 ms |
| `loudS` | level | short-term loudness, LKFS | the same over 3 s |
| `loudPk` | level | the track's own loudest `loudS` so far, LKFS | instant attack, ~25 s release, floored (DUST `dyn.js`'s shape, in LU) |
| `loudRel` | level | **the one a scene wants**: how loud this is for THIS track, 0–1 | `clamp01((loudS − loudPk + RANGE) / RANGE)`, `RANGE` ≈ 18 LU |
| `loudRange` | level | how much dynamic range the track has shown, LU | p95 − p10 of `loudS` so far (a scene scales its own contrast by it) |
| `loudAbs` | count | are `loudM`/`loudS`/`loudPk` absolute? | 1 in file + demo, 0 in capture + mic (§6) |

`loudRel` is deliberately the same *shape* as DUST's `dyn` drive, so §60 step 1's measured result is the floor, not a
risk. `loudI` (gated integrated loudness) was considered and left out: it needs the −70/−10 LKFS relative gate and a
scene that is 10 s into a track has nothing to integrate; `loudPk` answers the same question causally.

## 4. Where it is computed, and what it costs

A **PCM-bus stage**, exactly as the ears are: `assets/engine/loud.js` (pure DSP, node-importable, no DOM — so
`tools/test_loud.js` can run it) subscribed with `PCM.on(fn)` from `assets/engine/features-loud.js`, which registers
`ENGINE.addStage('loud', …)` after `ears` and before `clock`. The filters are per-sample; the windows are
**cumulative sums over the per-block mean square** (one float per 512-sample block, a ring of 282 blocks = 3.0 s),
so `read(heardT)` is two subtractions, and the whole thing is heard-time correct for free.

**Measured cost** (node, two biquads × 2 channels + the power sum over a 512-sample stereo block, 20 000 blocks):
**2.61 µs/block → 4.08 µs/frame at 48 kHz / 60 fps**, i.e. 0.024 % of real time. DUST at tier 3 is 1.238 ms/frame
(§60), so this is **0.3 % of one scene's frame**. It is the cheapest thing in the engine that would be added.

**What keeps the AGC.** Every *detector*: the band followers' `fast`/`slow`, the onset flux and its median threshold,
`kick`/`snare`/`hat`, `hush`, `tension`, `surprisal`, the drop rule (`e > 2·eM + 0.1`), `build` (`eM − eL`), `arc`.
AGC-normalisation is what makes a detector work across tracks, masters and tab-capture gain, and §57 already measured
`eM/eMax` useless for *brightness* without finding anything wrong with it as a *gate*. Nothing in `features.js`,
`synapse/`, `ears/perc.js` or `clock/` changes. **What moves to true loudness:** the scenes' base light, base size and
base radius — "how bright is the picture right now", which is the only question the AGC actively lies about.

## 5. Migration, per scene

Reads today (`grep -rn 'MS.lvl|MS.eM|MS.eS|S.lvl|S.eM|S.eS' assets/scenes`), brightness-relevant only:

| id | scene | reads | how it would switch |
|---|---|---|---|
| 1 | **DUST** | `lvl` ×3, `eM` ×2 (`dyn.js`, `formations.js`), `eS` ×1 | **first.** `dyn.js`'s peak → `loudPk`; its drive → `loudRel`. Shape identical, so §60's table is the before/after. `&loud=0` restores §60 exactly, as `&hab=0` does for step 2. |
| 6 | **FEIGEN** | `lvl` ×2 params + `uLevel` in both colour passes | `uLevel` ← `loudRel` (it IS "the brightness of the filaments, the bands and the interior"); the two params stay listener-rewirable. |
| 2 | **MANDALA** | `lvl` ×3 | body brightness ← `loudRel`; the per-hit lift stays on `lvl` (a quiet section's kick is still a kick — §60 step 1's rule). |
| 5 | **POLYTOPE** | `lvl` ×1 | the same split. |
| 8 | **NAV2** | `eS` ×5 (`detect.js` `ePk`), `eM` ×1 | `ePk` → `loudPk` / `loudRel`, deleting the second private workaround. **Gated on the user un-pausing NAV2** (OPEN-ITEMS: do not touch it meanwhile). |
| 0/4 | **NAV** | `eM` ×2 (one a bloom param), `eS` ×3 | mostly gates, not light. Review only; expect 1 line (the bloom's `eM` term). |
| 10 | **GIELIS** | `eS` ×1 | one `feats` param. Review only. |
| 3, 7, 9, 11 | TORUS2, torus-v1, MAXWELL, CHLADNI | `hush` only | **nothing changes.** |

One scene per commit, `IDS=<id> tools/scene-md5.sh` as the proof each time.

## 6. Parity and capture

- **The capture path's gain is the tab's**, set by the user's OS/browser mixer, so `loudM` / `loudS` / `loudPk` are
  **not** absolute there. `loudAbs` says so, and no scene may read an absolute field without checking it.
- **`loudRel` and `loudRange` are gain-invariant** and that is the point: a constant gain `g` adds `20·log10(g)` LU to
  `loudS` *and* to `loudPk`, which cancels in the difference. A scene that reads only `loudRel` behaves identically in
  file and capture mode. This is why `loudRel` is the field scenes are told to use.
- **det / capture parity:** in deterministic file mode the bus is `PCM.local` and the source pushes exact 512 blocks,
  so two runs are byte-identical and `tools/parity.js` applies unchanged. In capture, `SYNC_OFS` already aligns heard
  time; the loudness ring is read at `heardT` like every ears field, so no new lag term appears.
- **`#test`:** `sources/fake.js` must mirror the five fields from its synthetic energy, or the fake timeline becomes a
  hole where `loudRel` is 0 and a migrated scene goes dark. Same obligation `fake.js` already meets for `eM` / `lvl`.

## 7. Proofs

1. **The fake timeline does not move** while no scene reads the new fields: `tools/scene-md5.sh` over all 12 ids,
   line-for-line, through phases 1–3. After that, exactly the migrated scene's two lines per commit, and no others.
2. **Truth-graded breakdown/drop ratios**, the assertion §60 could not make: for every annotated drop on the five
   tracks, `loudRel(drop head) > loudRel(breakdown before it)` with a stated margin, where `eM` reads ×0.994.
   SeeYouDrop's pair is the headline; CyborgNinja has no drop and is the control (nothing may claim one).
3. **The engine against the reference**: `tools/test_loud.js` grades `loudS` / `loudM` against phase 1's BS.1770
   reference on the five PCM dumps, target **within 0.1 LU** per frame (the only real risk is the non-48 kHz
   coefficients, which is why 44.1 is graded too).
4. **Cost**: `CARD.bench` on DUST and NAV, 5 interleaved pairs, `q` pinned, tier 3 — §60's recipe. Budget: the
   measured 4.08 µs/frame must not become more than **+0.02 ms** on DUST/NAV.
5. **`eG` vs `loudRel`** on all five tracks, reported: does the causal continuous field agree with the non-causal bar
   arc, and should `eG` be retired or kept as the file-mode refinement?
6. `node tools/check.js` 0 fail (five new FEATS entries, five new Appendix A rows, a `help.feats` line per migrated
   scene), `npm test` 0 FAIL, **no audible run**.

## 8. Phases

| # | phase | size | gate | status |
|---|---|---|---|---|
| 1 | `trackmap.py --loud`: BS.1770 momentary / short-term / integrated + the section ladder, into `tools/truth/<name>.loud.json`. No engine change. | **S** | the five tracks' numbers match this plan's table | **DONE `a3a3a0e`** |
| 2 | `engine/loud.js` + `features-loud.js`: the K-weighted PCM-bus stage, the six fields, FEATS + CONTRACTS Appendix A + `fake.js`'s mirror, `tools/test_loud.js` against phase 1 | **M** | proofs 1, 3, 6 | **DONE `70c6624`** |
| 3 | the truth grading: `loudRel` on every annotated breakdown/drop pair, in `test_loud.js` | **S** | proof 2 | **DONE `fec7131`** |
| 4 | **DUST** migrates (`dyn.js` → `loudPk`/`loudRel`, `&loud=0` for the A/B) | **M** | §60's pass-2 table re-taken back to back, breakdown 2 improves, proof 4 | **DONE `94e4d8b`** — breakdown 2 → drop 2 **×0.875 → ×1.154** on §60's own windows (×1.039 → ×1.290 on equal 5.1 s ones), `&loud=0` bit-exact, DECISIONS §65 |
| 5 | **FEIGEN**, then **MANDALA**, then **POLYTOPE** — one commit each, `IDS=<id>` md5 each | **M** | the user's look per scene | **DONE `99c9cb7` / `f94b1c0` / `630fdf1`** (the user's look is still OPEN) |
| 6 | **NAV2** `ePk` → `loudRel` | **M** | blocked on the user un-pausing NAV2 | **SKIPPED** — still blocked |
| 7 | **NAV** + **GIELIS** review (expect ≤ 2 lines); the `eG` decision (proof 5) | **S** | — | **DONE `05b06cf`** — 0 lines changed; `eG` kept, documented as a rank |
| 8 | **the `loudPk` seeding defect** (§65 open item 1) + the re-calibration it forces: the peak and the range histogram attack only on a FULL 3 s window, `L_RNG_MIN` and the warm-up guard re-swept on the five tracks | **M** | `test_loud.js`'s new `transient` case, §65's three gates re-taken, the md5 list | **DONE `ff747da`** — SeeYouDrop's `loudPk` at 100 s **−1.03 → −2.72** against a true max of −1.69 (the overshoot 3.01 → 0.00 LU); `L_RNG_MIN` **7 → 6**, `LOUDK.WARM_T` **6 → 20 s**, DECISIONS §67 |

### What phase 4 (DUST) should do, written after phases 1–3 and 5 (for the next worker)

`dust/dyn.js` holds a private track-level running peak on `eM + ½·max(0, eS − eM)` (instant attack, 25 s release,
floored 0.84) and drives the base brightness, the grain size and the swarm radius with `energy / peak`. The engine now
publishes the same shape, measured: **replace `dyn.js`'s peak with `MS.loudPk` and its drive with
`baseLight(MS.loudRel, MS.loudRange, MS.loudAbs, <the old drive>)`** from `assets/math/loudlight.js` — the shared
mapping the other three migrated scenes use, so there is one definition and one calibration. Three things to carry
over from this session:

1. **Do NOT reuse the 25 s release.** On a mean square that is 0.174 dB/s, which forgets 6.6 LU in the 38 s between
   SeeYouDrop's drop 1 and its breakdown 2 — more than the whole track's 4.96 LU of range. `loudPk` releases at
   **0.02 LU/s** for that reason (§63 phase 2 decision 1). `dyn.js` got away with 25 s only because it holds an
   AGC-normalised 0..1 quantity whose peak barely moves.
2. **The 0.84 floor has no analogue and must not be re-invented as an absolute one** — the other four test tracks
   master 8–9 LU quieter than SeeYouDrop, so an absolute floor binds for their whole length (§63 phase 2 decision 2).
   `loudPk`'s warm-up guard already solves the problem the 0.84 was solving (§60 step 4's bright intro).
3. **`&loud=0` must restore §60 exactly**, which `baseLight`'s `loudAbs < 0` fallback gives for free: the other three
   scenes' `&loud=0` md5 lines are v0.14's own, bit for bit. That is the A/B, and it is also the proof that the
   migration is the only thing that moved.

The gate is unchanged: §60's pass-2 table re-taken BACK TO BACK on one tree (§60's own measurement hazard), and
**breakdown 2 must improve** — the field says it is +2.88 LU / ×1.94 in power louder than the breakdown before it,
where `eM` said ×0.994. The mapping's own ratio there is ×1.935 and the void → drop 1 pair is ×4.87.

Phase 4 is the one that answers the user's §60 observation; 1–3 are the engine work that makes it provable.
Phases 5–7 are opt-in and want the user's eye one scene at a time, the way §57–§60 ran DUST.
