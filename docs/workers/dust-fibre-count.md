# DUST — the tier-3 fibre count (v0.2 §16 ride-along) — worker report

> **What shipped is in (k).** Sections (a)–(j) are the brief as written — tier 3 = `4 × 10 × 56`. The measurements in
> (d) turned up a better row, the orchestrator took it, and tier 3 ships as **`4 × 12 × 48`** (all twelve fibres,
> 2304 segments). Read (k) for the final counts, md5s and bench; read (a)–(j) for how they were arrived at.

One file changed: `assets/scenes/dust/fibre.js`, one line of code —
`QT = [0.4, 0.7, 1, 1.4]` → `[0.4, 0.7, 1, 1]`, plus the three comments that quoted the old numbers.
`counts(3) === counts(2) = {nl: 4, nF: 10, N: 56}` = **2240** segments (was `4 × 12 × 66` = 3168), and `CAP` follows by
construction: it is now **2240**, so `ctx.lines.mk(CAP)` and `this.segs = Float32Array(CAP * 12)` in `index.js`
allocate 26 880 floats instead of 38 016 without `index.js` being touched. The points path, `hooks.fibres`, `feats`,
`help`, `look`, `post`, `score`, `cuts: 'onset'` and the id are untouched. `fit()`, `emit()`, `palM()`, `GATE`, `S0`
and the pole gate are untouched.

Verified in node against the shipped file:

```
tier 0  {"nl":2,"nF":7,"N":40}    560   fit 7
tier 1  {"nl":3,"nF":8,"N":48}   1152   fit 8
tier 2  {"nl":4,"nF":10,"N":56}  2240   fit 10
tier 3  {"nl":4,"nF":10,"N":56}  2240   fit 10
CAP 2240
```

---

## (a) Friction log — what the docs did not answer, and every guess

1. **Acceptance 4's threshold cannot be decided by acceptance 4's command.** The brief asks for the on−off median
   difference from three interleaved pairs and sets the bar at *"≤ 0.95 ms"*. Five runs of that exact command, same
   binary, same machine, gave **0.891 / 1.064 / 1.129 / 0.091 / 0.705 ms** — a spread of 1.0 ms around a 0.95 ms
   threshold, with one run (0.091) where the `off` triple itself drifted 0.75 → 2.20 ms mid-eval. HARNESS says
   *"load drift is 2× across a session — only interleaved pairs compare"*, which is what the command does, and §14
   learned the same lesson the same way; what neither says is that **three pairs is not enough interleaving**, because
   the drift is inside the run as well as across it. **Guess:** kept the prescribed command and report all five runs
   verbatim in (c), then added a design that is immune to drift — one Chrome, the three candidate geometries
   **rotated** so each takes every position in the cycle, each `on` bench paired with the `off` bench that immediately
   follows it, 33 pairs, median of the per-pair differences. That is the number I would defend: **0.948 ms** (see (d)).
2. **Sibling workers were on the machine during my bench window.** The Chrome gate covers the orchestrator's q-trace,
   and HARNESS's *"One Chrome at a time and nothing else on the machine"* is written for `q-trace.sh`. Nothing says
   what a ride-along worker does when the other ride-alongs bench at the same time. At 13:53 there was a foreign
   `--headless=new --remote-debugging-port=9766` Chrome running, and the 1-minute load average sat at 3.9–5.4 for the
   whole session. **Guess:** wrote a wait loop that polls for zero other headless Chromes and starts the bench in that
   window (`pgrep -f -- '--headless=new --remote-debugging-port'`), and printed the load average either side of every
   number. It helps and it is not enough — the user's own 19-day-old Chrome alone keeps the load near 4.
3. **Acceptance 5 cannot see the change.** The brief's montage command (`{"wait":6000}` … `{"wait":8200}`, no `q` pin)
   runs at **tier 2** on this machine: `q` 0.55 at t6 and 0.58 at t14, `fib 4x10x56` in both. Tier 2's counts are
   unchanged by construction, so the shots are the accepted reference frames and always will be, whatever tier 3 does.
   Nothing in the brief or HARNESS says which tier an unpinned `#test` run reaches. **Guess:** ran it as printed (it
   passes — see (c) 5), then built a second montage that actually exercises the change: `CLOCK=1`, `q` pinned 0.95,
   frames 360 and 840, old count vs new count.
4. **Acceptance 3's prediction is half right.** The brief says the on-md5s *"will differ from §14's on-md5s … only
   because the count changed"*. Only **f840** differs. **f360 is byte-identical to §14's `669aac71…`** — that frame
   lands at tier 2 (`q` 0.67), where the count did not change. Correct, but it looks like a failure until you log the
   tier, which the brief's command does not.
5. **`segs` in acceptance 4's eval always reads `"fib off"`.** The eval's last `CARD.bench` runs with the fibres off
   and `rt.log` is only rebuilt on the next `draw()`, so the field the brief prints as the segment count reports the
   off-state string, every time. **Guess:** appended `{"wait":600}` and a second eval to read the live count —
   `fib 4x10x56 seg 2154/2240` at tier 3.
6. **CONTRACTS §1.12's `0.4 µs per segment` is an average, not a marginal rate.** It is phrased as a constant
   (*"path A `set` + `draw` ≈ 0.4 µs per segment — 3.2 k segments ≈ 1.3 ms, so 50 k would be ~20 ms; plan against
   that"*), and multiplying it by the 928 segments removed predicts a 0.37 ms saving. The measured marginal rate
   between 2240 and 3168 segments is **0.25 µs/segment** (0.236 ms for 928), and §14's own tier-0 point is
   0.30 µs/segment (0.17 ms for 560). The figure is fine for sizing a scene, wrong for predicting a saving. Reported
   in (d), not worked around.
7. **No way to compare two geometry tables inside one process.** The tier table is a module constant, which is right,
   but it means every A/B between two counts is an A/B between two Chrome launches, i.e. between two load conditions —
   the one thing HARNESS says you must not do. **Guess:** a temporary instrumented build (`counts()` reads a
   `globalThis.__FIBOVR` override at tier 3 only), benched, then `git checkout --`'d. It never entered a commit;
   `git status` is clean and `grep -c FIBOVR assets/scenes/dust/fibre.js` is 0. If this kind of comparison is to be
   repeated, a hook (§1.4) that sets the tier-3 triple would be the honest slot for it.

## (b) Was I tempted to open a forbidden file?

Once, and harder than I expected: **`assets/core/lines.js`**. Cutting 29 % of the segments bought 20 % of the cost
(1.184 → 0.948 ms), and the obvious explanation is that `ctx.lines.set` uploads the buffer's whole **capacity** rather
than the `n` segments it was given — in which case the saving would be coming from `CAP` dropping 3168 → 2240 and the
per-segment model would be wrong in a way §1.12 does not admit. I wanted ten seconds with that file. Instead the
rotated run answered it from outside: **all three geometries there shared one process, one buffer and one `CAP` of
3168**, and A (2240 segments) still cost 0.236 ms less than C (3168), which cannot happen if `set` pays for the
capacity. So the cost tracks the emitted `n`, the unused tail is not uploaded, and what sits under the segment term is
a fixed per-`draw()` cost. (What the shipped build's smaller `CAP` saves is 11 136 floats of memory; I did not measure
it as time, and on this evidence there is none to measure.) Good enough to report honestly without reading `core/`.

Not tempted by `core/quality.js` (the tier thresholds are in §1.6) or by the other scenes.

## (c) The acceptance outputs, verbatim

**1. `node tools/check.js`**
```
check: 55 modules · uniforms 106 · MS keys 117 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```

**2. The points path is untouched** — `CLOCK=1 PORT=8779 GPU=1 OUT=tools/work node tools/cdp.js
'test&scene=1&fibres=0' '[…f360…f840…]'`
```
e49cf54ee319db5cd6ac78150a3f977d  tools/work/dustc-off-f360.jpg      <- §14 required e49cf54e…
7119a54250be3ea0c09b1590ce3b9171  tools/work/dustc-off-f840.jpg      <- §14 required 7119a542…
```
Both match §14 byte for byte, first try. The overlay is the only thing that changed and it is off in these frames.

**3. Determinism with the fibres on** — the same command twice without `&fibres=0`
```
669aac71ff5e0f96263c4635c6504659  tools/work/dustc-on-f360a.jpg
669aac71ff5e0f96263c4635c6504659  tools/work/dustc-on-f360b.jpg      <- identical
f96d0d7e8885721b7e737b05775cf1c6  tools/work/dustc-on-f840a.jpg
f96d0d7e8885721b7e737b05775cf1c6  tools/work/dustc-on-f840b.jpg      <- identical
```
Identical run to run. Against §14: **f360 is byte-identical to §14's `669aac71ff5e0f96263c4635c6504659`**, and f840
differs from §14's `f26d50dece29a8fc4d6483a0d2f46521` — exactly and only because of the count, and the tier says which
is which:
```
EVAL … => "{"f":360,"tier":2,"q":0.67,"log":"fib 4x10x56 seg 2149/2240"}"
EVAL … => "{"f":840,"tier":3,"q":0.87,"log":"fib 4x10x56 seg 2173/2240","errs":[],"bad":[]}"
```
f360 runs at tier 2, where `counts` did not change, so the pixels cannot; f840 runs at tier 3, where 3168 segments
became 2240, so the pixels must. No `Math.random()`, no wall clock in the path.

**4. Bench, interleaved on/off, tier 3 pinned** — the brief's command, five runs. `tier` 3, `glerr` 0, `errs` []
every time; `segs` reads `"fib off"` every time (friction 5), so the live count is from a follow-up eval:
`fib 4x10x56 seg 2154/2240`.

| run | `on` (sorted) | `off` (sorted) | median on − median off | load |
|---|---|---|---|---|
| 1 | 1.374 · **1.474** · 2.878 | 0.581 · **0.584** · 0.753 | **0.891 ms** | — |
| 2 | 1.639 · **1.671** · 1.858 | 0.605 · **0.607** · 0.671 | **1.064 ms** | — |
| 3 | 0.683 · **1.584** · 1.704 | 0.378 · **0.456** · 0.712 | **1.129 ms** | — |
| 4 | 1.181 · **1.493** · 4.433 | 0.748 · **1.402** · 2.201 | **0.091 ms** (drift, discard) | 5.0 |
| 5 | 1.252 · **1.512** · 2.009 | 0.790 · **0.806** · 2.844 | **0.705 ms** | 5.4 → 4.9 |

**Median of the five differences: 0.891 ms ≤ 0.95 ms — the acceptance passes**, and so does the median of the four
non-degenerate runs read as a set (0.705, 0.891, 1.064, 1.129 → 0.978) only if you round it the right way, which is
why I did not stop here. The drift-immune measurement in (d) is the number to quote: **0.948 ms**, against §14's
**1.37 ms**.

**5. Shots + montage** — `PORT=8779 GPU=1 node tools/cdp.js 'test&scene=1' '[{"wait":6000},{"shot":"work/dustc-t6"},
{"wait":8200},{"shot":"work/dustc-t14"}]'`, montaged 2-up against `tools/accept/v0.2/s1-t6.jpg` / `s1-t14.jpg` into
`tools/work/dustc-ab.jpg`. See (e) for what it showed. Both frames ran at **tier 2**
(`q` 0.55 / 0.58, `fib 4x10x56 seg 2147/2240` and `2176/2240`), `errs []`, `bad []`.

**6. Real path, 45 s** — `PORT=8779 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},
{"wait":45000},…]'`
```
EVAL JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS}) => "{"bad":[],"errs":[]}"
```
`[]`, `[]`, and no `[EXC]` line anywhere in the run's output.

## (d) The cost, measured so that load cannot explain it

One Chrome, `q` pinned 0.95, 8 s of settling, two discarded cold benches, then 11 cycles × 3 geometries, the
geometries **rotated** so each takes every position in the cycle, each `on` bench paired with the `off` bench
immediately after it, `CARD.bench(1, 400)` throughout, median of the 11 per-pair differences. `glerr` 0, tier 3,
load 3.91 → 3.88, no other headless Chrome. The tier-3 triple was swapped through a temporary `counts()` override
(friction 7), reverted before the commit.

| tier-3 geometry | segments | emitted | **overlay cost** | vs shipped |
|---|---|---|---|---|
| **A — `4 × 10 × 56` (shipped)** | **2240** | 2147–2176 | **0.948 ms** | — |
| B — `4 × 12 × 48` (the brief's alternative) | 2304 | 2236 | **0.913 ms** | −0.035 ms (noise) |
| C — `4 × 12 × 66` (§14, the old count) | 3168 | 3053–3079 | **1.184 ms** | +0.236 ms |

(`segments` is the geometry's `nl · nF · N`; `emitted` is what survived the pole gate, from the `rt.log` of runs at
that same geometry. All three rows share one Chrome, one buffer and a `CAP` of 3168.)

Per-pair differences behind those medians:
```
A  0.880 0.948 1.068 1.092 1.051 0.333 0.351 0.594 0.853 1.141 1.111
B  0.612 0.892 0.913 1.194 0.976 0.340 0.264 0.868 1.891 1.009 1.240
C  1.201 1.313 1.184 1.310 1.299 0.709 0.631 0.261 1.035 1.180 1.293
median off 0.720
```
A separate check, the brief's 7-pair shape run on the old count and the new count two minutes apart at **equal `off`
baselines** (0.626 and 0.598 ms — the closest two load conditions I got):
```
old  4x12x66  on med 2.027  off med 0.626  ->  +1.401 ms      (§14 measured +1.37 — the harness reproduces)
new  4x10x56  on med 1.495  off med 0.598  ->  +0.897 ms
```

**The finding: the saving is real but sub-linear in the count.** 928 segments removed, 29 % of them, and the cost
falls 20 % (1.184 → 0.948). §1.12's 0.4 µs/segment predicts 0.37 ms; the measured marginal rate between these two
counts is **0.25 µs/segment**. It is not an artifact of `CAP`: the three rows were measured in one process
against one buffer of capacity 3168, so the capacity was constant while `n` was not, and the B row adds that 2304
segments cost no more than 2240. What sits under the segment term is a fixed per-`draw()` cost (one `set`, one
instanced call, `emit`'s outer loop) that no count can remove. Planning rule that falls out of this: **a count cut buys you the marginal rate, not the average
one**, and at DUST's size that is ~0.25 µs/segment.

**Proposal, per the brief's invitation.** `4 × 12 × 48` (row B) keeps all **12 fibres per torus** at tier 3 — the full
§14 picture — for **0.913 ms**, i.e. within the +0.9 ms the brief allows and statistically the same cost as the
shipped `4 × 10 × 56`. It buys the fibre count back by spending the segments on fewer points per ring instead, where
they are invisible: at tier 3 the largest ring is ~200 px across, so 48 chords is a 7.5° facet, well under a pixel of
sagitta. The 3-up montage (see (e)) shows B as the closer match to the old picture. **Shipped the `QT` change as
briefed** — it is the smaller diff, it keeps one knob per tier, and `counts(3) === counts(2)` is a property worth
having — but if §16 wants the denser rings back at the same price, B is a two-character change to `N` and the bench
above is its evidence.

## (e) What the montages showed

**`tools/work/dustc-ab.jpg`** — 2 × 2, the accepted references on the left, this build on the right
(`s1-t6` / `dustc-t6`, `s1-t14` / `dustc-t14`):

- **t6**: green swarm with the fan of nested fibre arcs sweeping through its upper-left and out past the left edge.
  Reference and new are the same image to the eye, down to the individual hairlines in the fan — as they must be, both
  ran at tier 2 (friction 3).
- **t14**: one second after the drop, the cloud blown into blue/violet streaks with the rings spread into a wide
  rosette under it; again indistinguishable from the reference.

So the reference montage says **nothing regressed**, and by construction it cannot say more.

**`tools/work/dustc-q3.jpg`** — the montage that tests the change: `CLOCK=1`, `q` pinned 0.95, tier 3, frames 360 and
840, `4 × 12 × 66` (before) on the left, `4 × 10 × 56` (after) on the right.

- **f360**: all four latitude tori are present in both, in the same places, at the same brightness — the outer one
  arcing around the top-left of the cloud, the inner ones threading the green body. **No torus lost.** The one
  difference is in the arc fan on the left, where the before has a slightly denser hatch: 12 hairlines per torus
  instead of 10, spaced a little tighter. You have to be told to look for it.
- **f840**: the dark blue/green spiral frame. The two are harder to tell apart than at f360; the rings read as the
  same object with the same linking, the after marginally more open where the fan crosses the frame edge.

**`tools/work/dustc-q3-3way.jpg`** — f360 at tier 3, three up: before (`4 × 12 × 66`) · shipped (`4 × 10 × 56`) ·
proposal (`4 × 12 × 48`). The proposal is the one you cannot distinguish from the before — same 12-strand density in
the fan, no visible faceting from the shorter chords. The shipped middle panel is the one with the slightly airier
fan. All three read as linked Hopf tori threading the swarm, and in all three the swarm is still the subject.

## (f) The `feats`, `post` and the rest — unchanged

Nothing in this change touches a music read or a post parameter, so brief-common's (e) is a statement that I chose
nothing:

```
feats: ['flow','flowMid','flowBass','bassS','midS','highS','lvl','kick','dropEnv','tension','hat',
        'alive','arc','punchy','regularity']            (15, §14's list, untouched)
post:  { fb: { decay: 0.95 }, bloom: { thr: 0.3 }, kaleido: 0.5, exposure: { on: true } }   (untouched)
cuts: 'onset' · id 1 · score · look · help · hooks.fibres — untouched
```
`check.js` still reports `help.feats gaps 0`.

## (g) Wrong in the docs

- **`docs/workers/brief-dust-fibre-count.md`** — acceptance 4's `segs` field cannot report the on-state (friction 5);
  acceptance 5 runs at tier 2 and cannot observe the change (friction 3); acceptance 3's "will differ" is true of
  f840 only (friction 4); acceptance 4's ≤ 0.95 ms is not decidable by acceptance 4's own command on a machine with
  sibling workers on it (friction 1). Everything else ran exactly as printed, including the montage line.
- **`docs/CONTRACTS.md` §1.12** — `0.4 µs per segment` reads as a constant you may multiply by a count difference.
  Measured marginal rate here: 0.25 µs/segment between 2240 and 3168, and there is a fixed per-`draw()` component the
  sentence does not mention. Suggest: *"≈ 0.4 µs per segment as a total at a few thousand segments; the marginal cost
  of adding or removing segments is lower (0.25 µs/segment measured between 2240 and 3168 at 1280×720) because a
  fixed per-`draw()` cost of the same order sits under it — size a scene with the average, predict a saving with the
  marginal rate."*
- **`docs/HARNESS.md`** — *"load drift is 2× across a session — only interleaved pairs compare"* is right and
  insufficient: drift inside one eval is enough to invert a three-pair result (run 4 above, `off` 0.75 → 2.20 within
  the eval). Suggest adding: *"three pairs is the minimum shape, not a measurement; for a difference under 1 ms use
  ≥ 10 pairs, rotate the candidates so each takes every position in the cycle, and take the median of the per-pair
  differences, not the difference of the medians."* And: nothing tells a ride-along worker what to do when sibling
  workers hold Chrome at the same time — the `pgrep -f -- '--headless=new --remote-debugging-port'` wait used here is
  the cheapest version of an answer.
- **`docs/DECISIONS.md` §14** — the polish note (*"a smaller tier-3 count (`4×10×56` is visually the same picture)"*)
  is confirmed on both counts: visually the same at tier 3 (montage above), and it saves 0.24 ms of the 1.18, not the
  0.41 the per-segment figure suggests.

## (h) Files and artefacts

- `assets/scenes/dust/fibre.js` — the one-line change and its comments. Nothing else in the repo modified.
- `docs/workers/dust-fibre-count.md` — this report.
- `tools/work/` (git-ignored): `dustc-off-f360/f840`, `dustc-on-f360a/b`, `dustc-on-f840a/b`, `dustc-t6`, `dustc-t14`,
  `dustc-ab.jpg`, `dustc-q3-before-f360/f840`, `dustc-q3-after-f360/f840`, `dustc-q3-n48-f360/f840`, `dustc-q3.jpg`,
  `dustc-q3-3way.jpg`.

## (k) `4 × 12 × 48` shipped

The orchestrator took the (d) proposal: tier 3 keeps all twelve fibres per torus and spends 48 segments per fibre
instead of 66. `counts(3) = {nl: 4, nF: 12, N: 48}` = **2304** segments (was 3168; the interim `4 × 10 × 56` = 2240 is
gone), `CAP` follows at **2304**, and `fit()` returns the full 12 — no fibre is dropped. Tiers 0–2 are untouched and
still come off synapse's `q` curve; tier 3 is the one exception and it is a named constant, `N3 = 48`, read in
`counts` — deterministic, no hook, no global, nothing left behind from the bench instrumentation of friction 7
(`grep -c FIBOVR assets/scenes/dust/fibre.js` → 0).

```
tier 0  {"nl":2,"nF":7,"N":40}    560   fit 7
tier 1  {"nl":3,"nF":8,"N":48}   1152   fit 8
tier 2  {"nl":4,"nF":10,"N":56}  2240   fit 10
tier 3  {"nl":4,"nF":12,"N":48}  2304   fit 12
CAP 2304                          counts(undefined) -> {"nl":4,"nF":10,"N":56}   (the tier-2 fallback, unchanged)
```

**`node tools/check.js`**
```
check: 55 modules · uniforms 106 · MS keys 117 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```

**The points path, `&fibres=0`** — unchanged for the third time:
```
e49cf54ee319db5cd6ac78150a3f977d  tools/work/dustc48-off-f360.jpg      <- §14 required e49cf54e…
7119a54250be3ea0c09b1590ce3b9171  tools/work/dustc48-off-f840.jpg      <- §14 required 7119a542…
```

**Determinism with the fibres on**, the `CLOCK=1` f360/f840 pair run twice:
```
669aac71ff5e0f96263c4635c6504659  tools/work/dustc48-on-f360a.jpg
669aac71ff5e0f96263c4635c6504659  tools/work/dustc48-on-f360b.jpg      <- identical
ed87b7f7e4ef392d65ac713d76290d8e  tools/work/dustc48-on-f840a.jpg      <- the new f840 hash
ed87b7f7e4ef392d65ac713d76290d8e  tools/work/dustc48-on-f840b.jpg      <- identical
```
f360 is still §14's `669aac71…` byte for byte — it lands at tier 2, which this change does not touch (friction 4
again). f840 is tier 3 (`fib 4x12x48 seg 2236/2304`, `errs []`, `bad []`) and is the third distinct hash that frame
has had: `f26d50de…` at `4 × 12 × 66`, `f96d0d7e…` at `4 × 10 × 56`, **`ed87b7f7e4ef392d65ac713d76290d8e`** now.

**Bench**, the brief's interleaved three pairs, `q` pinned 0.95, tier 3, one Chrome, no other headless Chrome,
load 5.35 → 5.15, `glerr` 0, `errs` []:
```
on  [1.088, 1.141, 1.621]   off [0.610, 0.614, 0.641]   ->  median on − median off = 0.527 ms
```
The tightest triple of the session on both sides. That is under the brief's 0.95 ms and under the +0.9 ms the
proposal was allowed, and it sits below the rotated-run estimate for this geometry (0.913 ms) for the usual reason —
the machine was quieter than it was in (d), and only same-run comparisons carry across. Against **1.37 ms** at §14's
count, by any of the measurements here.

**Real path, 45 s**
```
EVAL JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS}) => "{"bad":[],"errs":[]}"
```
`[]`, `[]`, no `[EXC]`.

**Picture.** `tools/work/dustc48-f840.jpg`, 2-up at tier 3, f840: `4 × 12 × 66` left, the shipped `4 × 12 × 48` right.
Indistinguishable — the same blue/green spiral, the same twelve strands in every fan, no faceting anywhere the
shorter chords could have shown it. Which is the whole point of the row: the segments per ring were the cheap thing
to spend, the fibres were not.
