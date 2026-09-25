# Worker: POLYTOPE-DANCE (v0.9) — the 4-polytope cage dances to the music — 2026-09-25

**Brief:** `docs/workers/brief-polytope-dance.md` + `brief-common.md` (¶1–2 and Report) + `CONTRACTS.md` §0, §1.1,
§1.4, §1.9, §1.12 path A, §1.13, §1.15, §1.16, §1.17, Appendix A + `HARNESS.md` + `ENGINE.md` + `DECISIONS.md`
§7, §8, §14, §29, §36–§40 + `docs/workers/{brief-polytope,polytope,brief-polytope-pole,polytope-pole,torus2}.md`.
PORT 8790, own worktree, branch `worktree-agent-a24cf96485994aee3`. Nine commits, one per proven step.

**The worktree was NOT at 753f985** as the prompt said — it was at 033f800, before the orchestrator's before-proof
commits. `git merge` is forbidden, so `docs/workers/brief-polytope-dance.md` and `tools/accept/v0.9/` were taken
out of the `main` ref with `git archive main <paths> | tar -x` and left untracked; they are already on `main`.

---

## What it does now

Nine things, in the order they were built and proven:

1. **A groove per band** (`grooves.js`). An onset is a rise of `bass`/`mid`/`high` over that band's own ~0.4 s mean;
   the beat it lands on is filed (snapped to the nearest 16th while `gridTrust > .5`) and the last eight per band are
   kept as ages in beats. `kick`/`snare`/`hat` are a ×1 / ×0.6 confirming vote, never the source. `beat` files a
   faint bass entry when a bar goes by unfiled.
2. **A lock and a nudge per plane** (`dance.js`). xy targets `beatCount/16` of a turn and zw `beatCount/32`, read off
   the count so they cannot drift, eased the short way with a 0.3 s spring; each train entry adds a critically damped
   impulse that overshoots and settles to exactly zero net.
3. **The 5 % thump** on `max(0, cos 2π beatPhase)⁴` and a ±2 % **breath** on `barPos`, so silence still moves.
4. **A bass wobble** in the xw plane, bounded (below).
5. **Beads along every edge** (`poly4.emit`). Each entry paints a brightness and width bump where its age lands,
   travelling one edge length per bar, fading over two bars. The rhythm is the spacing of the beads.
6. **A cued inside-out sweep** — a phrase boundary, a section or a drop swings one vertex through the projection
   pole over one beat and the cage turns itself inside out.
7. **The cage is a colour wheel** (`colour.js` + `assets/math/keycolour.js`). A vertex's angle in the xy plane,
   quantised to twelve, is its pitch class on the circle of fifths and so its hue; chroma lights the sounding ones.
8. **Growth with the build** in two stages — rounder arcs, then a bigger figure.
9. **Six parameters** the panel can route, and a `feats` list that is exactly what is read.

---

## (a) Friction log — every sentence the docs lack, every guess

1. **The brief's pole clamp is not writable, and the premise is false.** It asks for the xw excursion to be clamped
   so `1 − w` stays above the gate for every vertex, "compute the margin from the vertex nearest the pole after the
   xy/zw rotation". Measured in node (`poly4.js` imports cleanly): **the 24-cell, the 600-cell and the 120-cell each
   reach `1 − w` = 0 EXACTLY under the xy/zw rotation alone**, before any xw angle exists — only the tesseract keeps
   a floor, 0.2929 = 1 − 1/√2, itself outside the 0.24 gate. Such a clamp would pin the plane at zero for most of
   every bar. What I built instead is a bound with a proof: after the xy/zw rotation a vertex's `w` under the xw turn
   is `R sin(a + φ)` with `R = hypot(x, w) ≤ 1`, so `|den(a) − den(0)| ≤ |a|` for every vertex; capping the excursion
   at `XWMAX` gives **no vertex outside `den = GATE + XWMAX` can be gated by the dance**, and it costs not one
   per-vertex operation. `hooks.pole()` and 600-frame logs confirm it (§ Pole margin below).
2. **DECISIONS §8 and the brief both quote the OLD pole gate** (`den > 0.16`, ramp `(den − 0.16)·3.5`). It has been
   `GATE = 0.24`, `RAMP = 4.861` since v0.2 §16b (`docs/workers/polytope-pole.md`, which says so and asked for §8 to
   be folded). The brief copied §8. Two workers have now paid for this.
3. **The brief's bump widths cannot be drawn.** σ 0.18 / 0.08 / 0.04 of an edge, on an edge that has only `sub + 1`
   sample points with `sub ≤ 8`: at 0.18 the four bumps of a four-on-the-floor bar merge into ONE maximum (measured
   on the live profile). 0.055 / 0.042 / 0.032 reads. The docs nowhere say that the subdivision is the resolution
   limit of anything painted along an edge — it is filed as "geometry" (§1.4) and its second role is invisible.
4. **`tools/bundle.js` cannot rewrite `export { … } from '…'`** and throws `unhandled export form`. `check.js`
   passes, the http page runs, `npm test` passes — and the single-file build, which is what `releases/*.html` ships,
   is broken. Nothing in HARNESS or CONTRACTS says which export forms are legal. `check.js` should refuse the form
   the bundler cannot build.
5. **`CARD.bench(id, n)` runs your `update()` 300 times with the main thread blocked**, so a `setInterval` pin cannot
   hold state the scene recomputes on an event. My first cast-0 bench ran at 4291 segments in a permanent cross-fade
   instead of the reference's 960, because `sectionEvt` re-picked the cast mid-bench and my interval never got a
   turn. CONTRACTS §1.4 has the rule ("a hook that sets state your scene recomputes on an event must pin it for the
   run") but HARNESS's Bench protocol does not repeat it, and `docs/workers/polytope-pole.md` friction 5 says only
   "the cast has to be pinned" — it pinned by `setInterval` and got away with it at a different `n`. A line in the
   Bench protocol would have saved two runs.
6. **`CARD.derived(name)` needs the parameter as a second argument** (`derived(name, p)`); HARNESS lists
   `CARD.derived(name, p)` correctly but `CARD.paramsOf(name)` right beside it takes one, and the two read as a pair.
   A call with one argument returns `undefined` silently and the whole eval prints `undefined`.
7. **The demo synths are random, and I forgot it for about forty minutes.** Two single `fake=0` runs of the same
   scene measured mean saturation 0.25 and 0.85. I built two hypotheses (the imported saturation floor; the
   end-to-end colour lerp), changed code for both, and measured no improvement, because the variable was the synth.
   HARNESS says it plainly ("the demo synth uses `Math.random()`: `fake=0` runs are not bit-identical — judge on 2+
   runs"); the honest instrument is a route on the deterministic timeline, which settled it in one run (§ e below).
   I would add to HARNESS: *a look question is decided by a routed parameter on `#test`, never by two `fake=0` runs.*
8. **`arc` has no `'intro'`** — known (§36) and the brief repeats the warning; correct, and I used `'idle'`.
9. **`#test` sets `hat` to exactly 0.5** — known (§36), and `DRUMHI` is 0.45 accordingly.
10. **Guess: the refractory in beats, not seconds.** The brief says "one 16th at `bpm` (`15/bpm` s)". 15/bpm seconds
    *is* 0.25 beats exactly, at any tempo, so I wrote 0.25 beats and never read `bpm`. `bpm` is therefore not in
    `feats`, against the brief's spec-8 list.
11. **Guess: `sub` and `bpm` are not read at all.** The brief's spec-8 `feats` list includes them; the brief also says
    to drop what I do not read. Dropped.
12. **Guess: the sweep's `from()`.** Spec 3 calls the `sweep` parameter "its progress" and spec 7 says "its `from` is
    the state-free part". A progress is state. I made `from` the state-free gate — whether a sweep may run at all,
    `1 · (arc === 'idle' ? 0 : 1)` — and `update()` multiplies the live progress by it, so unrouted the parameter's
    effect *is* the progress, and `c:0` disables sweeps.
13. **Guess: the outer figure's "offset by a fifth".** Read as a hue offset of one twelfth of a turn on the same
    wheel (a second 12-entry table), not as a re-index of the sector table. Both are "a fifth"; this one keeps the
    inner and outer figures' sectors in register so a vertex's sector means one thing.
14. **Guess: `hooks.train` pins the BASS train only**, as TORUS2's does (its `PAT` launches band 0). The brief says
    "pins the bass train", so this is stated, but it means the "all three trains live" bench cannot use the pin —
    I benched on house instead, where all 24 slots are genuinely full.
15. **"A cap that never crops in portrait" is not achievable and is not new.** `MOBILE=1` at 390×844 shows the outer
    120-cell cage running off the left, right and bottom edges at every size including the smallest — in portrait
    the x direction is tighter by `1/aspect` = 2.16 and this scene has no aspect term at all. TORUS2's rule
    (`g ∝ min(1, aspect)`) is the fix and would shrink the phone view to 46 % of today's; that is a look change the
    user has not asked for, so it is flagged, not shipped.
16. **`CARD.ctx` is the whole scene ctx** (`CARD.ctx.tier()`), and `CARD.REG[5].scene` is the live object whose
    `p`, `cast` and `nSeg` you may read and write. Both are how every pin in this report works and neither is in
    HARNESS's `window.CARD` list. `docs/workers/polytope-pole.md` friction 7 already said so; still not in the docs.

## (b) Forbidden files — tempted, opened none

- `assets/core/post.js` — to see how `bloom.thr` interacts with a scene whose brightest strokes are now concentrated
  in three lit sectors rather than spread evenly. Guessed from §1.4's one-line description and settled the question
  with a routed A/B instead (§ e).
- `assets/engine/features.js` — to find out why `bass` on the house demo rises 13–15 frames *after* the kick's edge
  about half the time. Answered it without opening anything: 14 frames at 124 bpm is half a beat, so it is not lag,
  it is the off-beat bassline, and the ±1 frame vote correctly refuses it.
- `assets/core/scenes.js` — to check whether `look.set` is called by the director's look memory during a `sectionEvt`
  (it fought my cast pin). Wrote `hooks.cast` instead, which is the documented answer.

## (c) Acceptance — the exact outputs

```
1  node tools/check.js  → check: 87 modules · uniforms 131 · MS keys 118 · scenes 8 (help.feats gaps 0) · 0 fail · 2 warn
                          (the two warns are pre-existing: feigen/index.js 352, nav2/nav2.js 393)
   npm test             → test_baby / test_misi / test_hopf / test_tempo / test_director all OK, unchanged
   node tools/param-smoke.js → param-smoke: 49 checks, 0 fail
   node tools/test_polytope.js → test_polytope: OK   (39 checks, new file)

2  PORT=8790 GPU=1 node tools/cdp.js 'test&scene=5' '[{"until":"window.CARD"},{"wait":6000},{"eval":…},{"shot":"pd-t6"},{"wait":8200},{"shot":"pd-t14"}]'
   EVAL … => "{\"errs\":[],\"bad\":[],\"scene\":5}"

3  PORT=8790 GPU=1 node tools/cdp.js 'test&fake=0&demo=house&scene=5' '[…10 s…30 s…50 s…]'
   EVAL CARD.REG[5].scene.hud() => "24-cell ⊂ 120-cell 6306 segs · key 9M lit 4 · bumps 8/8/8 · xy 1.97→1.96 · sweep 0.00"
   EVAL CARD.REG[5].scene.hud() => "600-cell 3337 segs · key 9M lit 2 · bumps 1/1/3 · xy 5.76→0.00 · sweep 0.39"
   EVAL CARD.REG[5].scene.hud() => "24-cell ⊂ 120-cell 6177 segs · key 9M lit 3 · bumps 8/8/4 · xy 3.79→3.93 · sweep 0.00"
   EVAL … => "{\"errs\":[],\"bad\":[],\"q\":0.698}"

6  IDS=3 PORT=8790 GPU=1 tools/scene-md5.sh   (four times across the session, every time:)
     7189a6ba6899e1e34d077eddbaaf4de8  s3-f360.jpg
     48113eda4d94ff1f48c35b7b29f06a38  s3-f840.jpg     = the s3 lines of tools/accept/v0.8/scene-md5-v08.txt
   PORT=8790 GPU=1 tools/scene-md5.sh pd  → ids 0–4 and 6–8 byte-identical to scene-md5-v08.txt (diff empty)
   git diff --stat main -- assets/core assets/engine assets/main.js  → empty

7  node tools/bundle.js → bundled 87 modules → dist/retinarave.html (701 KB), 0 errors
   FILE=$PWD/dist/retinarave.html PORT=8790 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[…{"key":"6"}…]'
   EVAL … => "{\"errs\":[],\"bad\":[],\"scene\":5}"
```

### The s5 md5s — the v0.9 reference

```
177c300f85a8ad6ecf4f8f1ce785b31a  s5-f360.jpg
84a6bb55ed967982c1bc1a549c2342df  s5-f840.jpg
```
Stable across two runs (`pd5x`, `pd5y`). A route moves them: `&param=polytope.groove=c:0` at f360 gave
`45ade547c7f548459b77bcf81ad7c8dd` at the time that route was taken.

### The params move was a byte-exact no-op

Taken immediately before and after moving the six constants into `params`, with nothing else changed:
```
6acc6fe3325530fd0f577ce841a85bf4  s5-f360.jpg      (identical before and after)
3279571591b0f75cd61f678b395dd513  s5-f840.jpg
```
The first attempt moved the constants *and* retuned `SIZEA`/`SIZEB` in one edit and the md5 moved; reverting only
the two size terms brought it back bit for bit, which isolates the slot adoption from the tuning.

### Bench (HARNESS protocol: `q` pinned .95, settle, three throw-aways, three interleaved pairs, `&scene=5` forced, cast pinned by `hooks.cast`, `glerr` 0)

| condition | s5 / NAV pairs (ms) | s5 median | NAV median | ratio | vs before |
|---|---|---|---|---|---|
| **cast 0** tesseract ⊂ 24-cell, tier 3, 960 segs — **before** (`tools/accept/v0.9/bench-before.txt`) | `[[.476,2.219],[.429,2.235],[.332,2.225]]` | 0.429 | 2.225 | 0.193 | — |
| **cast 0**, the same conditions — **after** | `[[.554,2.184],[.528,2.192],[.379,2.144]]` | 0.528 | 2.184 | 0.242 | **raw 1.23× · NAV-normalised 1.25×** |
| **cast 2** 24-cell ⊂ 120-cell, tier 3, 6279 segs, house, **all 24 train slots live** | `[[.967,1.932],[1.118,1.917],[1.262,1.889]]` | 1.118 | 1.917 | 0.583 | — (v0.2 measured 0.66 for this pinned cast) |

Cap is 2×; the heavy cast is *cheaper* against NAV than it was in v0.2. The pulses cost one dot product and two
multiplies per sample and **no exponential**: the three bump profiles are built once per frame at the `sub + 1`
points the subdivision already visits (3 × 9 × 8 exponentials), not per emitted sample (~7 k × 24).

### CAP

Worst case is a cast cross-fade with the 600→120 swap also fading — cast 1 (720 × subB) against cast 2
(96 × sub + (720 + 1200) × subB) — **13968 pieces at tier 3, 85.3 % of CAP 16384**. No clamp is needed and none was
added; `emit` already truncates at `cap`. Over 2400 free-running frames with every section change and cast swap the
scene peaked at **9613 (59 %)**. Stage 1 raises the subdivision only as far as one tier up, capped at `SUB[3]`, so
the worst case is the tier-3 figure above and the music can never exceed it.

## (d) What is wrong in the docs

- `DECISIONS.md` §8 quotes the superseded pole gate twice (friction 2). Its "Polish for later" bullet is done.
- `HARNESS.md` "Bench protocol" should say that `CARD.bench` runs 300 `update()`s with the thread blocked, so state
  a scene recomputes on an event must be pinned by a hook and not by `setInterval` (friction 5).
- `HARNESS.md` `window.CARD` should list `CARD.ctx` (the scene ctx, e.g. `CARD.ctx.tier()`) and that
  `CARD.REG[id].scene` is the live scene object (friction 16). Raised once before, in `polytope-pole.md`.
- `tools/check.js` should refuse `export { … } from '…'`, which `tools/bundle.js` cannot build (friction 4).
- `HARNESS.md` "Pitfalls" deserves: *a look question is decided by a routed parameter on `#test`, never by two
  `fake=0` runs* (friction 7).
- Everything else ran exactly as printed, including `tools/scene-md5.sh` with `IDS=`, the `CLOCK=1` `until`-chain,
  `MOBILE=1`, `tools/montage.py` and `tools/bundle.js` from `file://`.

## (e) The look question, settled the honest way

Two single `fake=0` runs disagreed by 0.6 on mean saturation, and I chased it into two wrong hypotheses. The
controlled measurement — the **same deterministic frames**, groove routed to `c:0` versus live:

| frame | mean luminance | mean saturation of lit pixels | pixels blown to white |
|---|---|---|---|
| f360 groove off → on | 4.35 → 4.55 (+4.6 %) | 0.547 → 0.559 | 0.000 % → 0.000 % |
| f840 groove off → on | 10.19 → 11.57 (+13.5 %) | 0.548 → 0.549 | 0.000 % → 0.000 % |

The groove does not wash the picture out and does not desaturate it. That is the **zero-mean profile** doing its
job: the bumps redistribute light along an edge instead of adding a DC lift. The first version did add one — the
first before/after montage was about twice as bright and saturating through the bloom, DECISIONS §7's exact failure
— and fixing it *raised* the contrast (4x4 peak/trough 1.74× → 2.26×, sync 8.4×).

---

## The numbers

### Per-band thresholds — what they are and why

`grooves.js`, three named constants, a one-line edit each:

| constant | value | entries per beat / median gap in beats, measured over 50 s per-frame logs |
|---|---|---|
| `THR_BASS` | **0.18** | house 0.55 / 1.00 · aba 0.77 / 1.01 · dnb 0.29 / 2.00 · #test 0.61 / 1.00 |
| `THR_MID` | **0.15** | house 0.60 / 1.00 · aba 0.71 / 1.00 · dnb 0.33 / 2.46 · #test 0.05 |
| `THR_HIGH` | **0.17** | house 0.85 / 0.98 · aba 0.94 / 0.60 · dnb 0.49 / 1.98 · #test 0.01 |

Each is a rise over that band's own running mean, so it is loudness-independent. The detector was re-run offline
over the logs at 0.10 … 0.25 and each value picked in the **flat middle** of the sweep, so a retune cannot fall off
a cliff. `#test`'s mid and high are step functions, not onsets, so those trains are correctly near-empty there.

Two things the sweep found that the brief's lean did not foresee:

- **`ARMF` (0.5), the hysteresis latch.** A band that ramps and then holds — a riser, a pad — filed **six** entries
  for one musical event, because the mean takes a second to catch up. The detector now disarms on a launch and
  re-arms only when the rise has fallen back below half the threshold. One swell is one entry, and the launch rate
  became nearly threshold-independent, which is what makes these safe knobs for someone else to turn.
- **`AMPN` (0.45), the amplitude normaliser.** A typical rise on real music is 0.2–0.4, not 1, so taking "the rise
  clamped to 1" as the amplitude delivered every nudge and every bead at a third of its designed size — the bar
  series read 0.002–0.046 rad where lean 13 wants the groove visible at arm's length. 0.45 is the 1st percentile of
  the positive rises on house, i.e. about as hard as a band ever hits.

The drum vote's ±1 frame window is kept exactly as specified. On house and aba, **mid and high land at lag 0–1 on
85 % and 97 % of launches**; the bass has a second cluster at 13–15 frames, which is half a beat at 124 bpm — the
off-beat bassline, correctly denied the vote (its amplitude is ×0.6, not zero).

### Train positions

`hooks.info()` positions along an edge, `(age/4) mod 1`, de-duplicated (a bump a bar old sits where a new one
launches), at f360 on the fake clock, tier 3, cast 0:

| pin | positions | gaps |
|---|---|---|
| `hooks.train('4x4')` | `.10 .35 .60 .85` | **.25 .25 .25 .25** |
| `hooks.train('sync')` | `.10 .225 .60 .725` | **.125 .375 .125 .375** |

And the multiplier `emit` actually applies, piece by piece, along **every** edge of the inner figure — `sub = 8`,
so nine sample points at t = 0, .125, … 1 (`hooks.info().prof`):

```
4x4    0.785  1.714  0.759  1.449  0.649  1.184  0.538  0.922  0.785
       ^peak         ^peak         ^peak         ^peak          four maxima, every other piece, spaced .25
sync   0.688  2.120  1.649  0.293  0.507  1.412  1.078  0.252  0.688
       ^--pair--^    ^gap                 ^--pair--^    ^gap    two tight pairs and two deep gaps
```

### Bar series (spec 2) — house, one bar from a bar start, every 8 frames

`hooks.motion()`, xy angle wrapped to [0, 2π):

| frame | beat | xy angle | its target | nudge | bounce | breath | bass | wobble |
|---|---|---|---|---|---|---|---|---|
| 683 | 24.029 | 2.6852 | 3.1416 | 0.0145 | 0.0467 | 0.0005 | 0.246 | 0.0546 |
| 691 | 24.316 | 2.9454 | 3.1416 | 0.1057 | 0.0000 | 0.0090 | 0.812 | 0.0770 |
| 699 | 24.601 | 2.9930 | 3.1416 | 0.0450 | 0.0000 | 0.0158 | 0.465 | 0.0734 |
| 707 | 24.886 | 3.0313 | 3.1416 | 0.0139 | 0.0163 | 0.0196 | 0.326 | 0.0614 |
| 715 | 25.172 | 3.2464 | 3.5343 | 0.0891 | 0.0025 | 0.0195 | 1.000 | 0.0644 |
| 723 | 25.457 | 3.3567 | 3.5343 | 0.0641 | 0.0000 | 0.0155 | 0.633 | 0.0791 |
| 731 | 25.742 | 3.4015 | 3.5343 | 0.0223 | 0.0000 | 0.0086 | 0.441 | 0.0693 |
| 739 | 26.027 | 3.4625 | 3.9270 | 0.0064 | 0.0472 | 0.0000 | 0.238 | 0.0537 |
| 747 | 26.304 | 3.8088 | 3.9270 | 0.1838 | 0.0000 | −0.0086 | 0.841 | 0.0766 |
| 755 | 26.584 | 3.8196 | 3.9270 | 0.0862 | 0.0000 | −0.0156 | 0.484 | 0.0744 |
| 763 | 26.866 | 3.8302 | 3.9270 | 0.0273 | 0.0098 | −0.0195 | 0.328 | 0.0619 |
| 771 | 27.146 | 4.0223 | 4.3197 | 0.0796 | 0.0068 | −0.0195 | 1.000 | 0.0638 |
| 779 | 27.427 | 4.1332 | 4.3197 | 0.0553 | 0.0000 | −0.0158 | 0.646 | 0.0796 |
| 787 | 27.710 | 4.1838 | 4.3197 | 0.0191 | 0.0000 | −0.0090 | 0.430 | 0.0692 |
| 795 | 27.994 | 4.2257 | 4.3197 | 0.0055 | 0.0498 | −0.0004 | 0.235 | 0.0534 |

Over the bar (beat 24.03 → 28.03, exactly 4.00 beats) the target advanced **1.5708 rad = exactly 4 sixteenths of a
turn**, i.e. one full turn per sixteen beats. The angle tracks it with the spring's lag and lurches at each bass
entry (f747: 0.1838 rad). The bounce peaks at `beatPhase` .99–.03 and is zero elsewhere — a thump, not a sine. The
breath spans ±0.0196 over the four beats. Nudge extremes over the bar: **0.0046 … 0.1873 rad**, against the 0.3927
rad the lock advances per beat.

### Pole margin — 600 frames, `hooks.pole()` every frame

| run | vertices the dance newly gated | min den | min den without the excursion | max excursion | worst worsening |
|---|---|---|---|---|---|
| `#test`, cast c600 | **0** | 0.00003 | 0.00003 | 0.0307 | 0.0186 |
| house, cast tess+c24 | **0** | 0.00437 | 0.00152 | 0.1394 | 0.0690 |

`min den` sits below the gate on nearly every frame of both — that is the 600-cell's and the 24-cell's own vertex
sweeping the pole, which is what the scene is about and what `GATE` exists to fade. **`gatedTotal` 0 is the claim
that holds**: no vertex outside `GATE + XWMAX` was ever put inside the gate by the dance, over 1200 frames. The
excursion never reached `XWMAX` = 0.18 (peak 0.139), so the cap is headroom, not a binding constraint.

### Parameters (CONTRACTS §1.16)

| name | eli5 | range | `from(MS)` | deps | lo → hi |
|---|---|---|---|---|---|
| `turn` | where the cage has been nudged to, in the turn it makes every sixteen beats | `[0, 6.2832]` | `((MS.beatCount / TURNB) * TAU) % TAU` | `beatCount` | the xy plane's lock target; a constant freezes the turn, a level sweeps it |
| `bounce` | how hard the figure thumps on the beat | `[0, 0.1]` | `DA.BOUNCE * pow(max(0, cos(TAU * MS.beatPhase)), 4)` | `beatPhase` | 0 = no thump, 0.1 = a 10 % pump on every beat |
| `size` | how much of the screen the figure fills between builds | `[0.5, 1.2]` | `SIZE0 + SIZEI·intensity + SIZEA·arousal + SIZEB·min(1, max(0, 2·build − 1))` | `intensity`, `arousal`, `build` | 0.5 = a distant model, 1.2 = it fills the frame |
| `groove` | how strongly the rhythm shows as bumps travelling along every edge | `[0, 1]` | `GROOVE0 * (0.3 + 0.7 * MS.presence)` | `presence` | 0 = plain strokes (the identity), 1 = every edge a string of beads |
| `glow` | how brightly a pitch class that is not sounding is still kept lit | `[0, 0.6]` | `GLOW0 * (1 − GLOWQ * max(MS.hush, MS.calm))` | `hush`, `calm` | 0 = only the sounding notes are visible, 0.6 = the whole wheel is lit and chroma barely reads |
| `sweep` | how far the cage is through turning itself inside out | `[0, 1]` | `1 * (MS.arc === 'idle' ? 0 : 1)` | `arc` | 0 = sweeps off, 1 = the cue drives the full crossing |

At f360 on the fake clock, `paramsOf` **equals** `derived` for all six (the §1.16 identity), every value finite and
in range: `turn` 4.712389, `bounce` 0, `size` 1.020695, `groove` 0.8, `glow` 0.238, `sweep` 1.

### Shots (all in `tools/work/`, prefixed `pd-`)

| file | what it shows |
|---|---|
| `pd-montage.jpg` | **the deliverable.** Six before frames (the orchestrator's) beside six after, house / aba / dnb at f360 and f840. Every before frame is one hue end to end; every after frame carries the wheel — house red at the top through yellow to green at the bottom, aba green and gold, dnb blue, cyan and magenta — with the strokes beaded rather than evenly lit. |
| `pd-t6.jpg` | the fake timeline at 6 s: a quiet 24-cell inside the outer cage, green at the top and blue at the bottom, thin strokes, nothing blown up. |
| `pd-t14.jpg` | one second after the drop: the same figure swollen, the outer cage lit, a bright cyan ring through the middle, the wheel clearly readable from gold to blue. |
| `pd-h10 / h30 / h50.jpg` | the house demo at 10 / 30 / 50 s: a dense 120-cell cast, then a sparse 600-cell breakdown (the hud caught a sweep at 0.39 progress there), then the dense cast again. Three different frames. |
| `pd-trains.jpg` | groove off · `4x4` · `sync`, all at f360 with the cast pinned to 0 and tier 3, zoomed 2× on one corner. The off panel's strokes are evenly lit; 4x4 puts regularly spaced bright beads along every one; sync bunches them in pairs. |
| `pd-colour.jpg` | `hooks.key(0,0)` · `hooks.key(7,1)` · a pinned C major triad, all at f360. Warm (red / magenta / olive) against cool (green / teal / blue) — the same strokes that were red are green, so the wheel turned rather than tinted — and the triad keeps only three sectors lit while the rest fall to the floor. |
| `pd-sweep.jpg` | f301 · f308 · f315 · f322 · f330 across one pinned sweep. The cage is compact at f301; by f308 the outer 120-cell has inflated across the frame; at f315 it is at its widest with the inner ring fully open and the core white; by f322 it is collapsing; at f330 it is the compact figure again. |
| `pd-sweep-ba.jpg` | f60 and f570, four seconds either side of the sweep: the same cast, the same cage, the same colours, the same lock — only the level differs (f570 is the fake timeline's quiet valley). |
| `pd-build.jpg` | build 0 and build 1 with the cast pinned: sub 6 → 8, g 0.9265 → 1.2115, 718 → 960 segments. The figure is a third bigger and the arcs are visibly rounder. |
| `pd-mobile.jpg` | `MOBILE=1` portrait at the smallest and largest size — the evidence for friction 15. |
| `pd-g0-f360/840.jpg` | the groove routed to `c:0` at the deterministic frames, against `pd5x-s5-f360/840.jpg` — the controlled A/B of § e. |

### Line count per module

| module | lines |
|---|---|
| `assets/scenes/polytope/index.js` | 349 |
| `assets/scenes/polytope/poly4.js` | 336 |
| `assets/scenes/polytope/grooves.js` | 247 |
| `assets/scenes/polytope/dance.js` | 162 |
| `assets/scenes/polytope/colour.js` | 132 |
| `assets/scenes/polytope/help.js` | 47 |
| `assets/math/keycolour.js` | 85 |
| `assets/scenes/torus2/colour.js` | 17 (was 64) |
| `tools/test_polytope.js` | 220 (new) |

All under the 350-line soft cap; `check.js` reports 0 fail and only the two pre-existing warnings.

### `feats` — 36 fields, exactly what is read

`flow flowHigh tension dropEnv kick hit lvl presence seed sectionEvt arc regularity clarity calm bass mid high
snare hat beat beatCount beatPhase gridTrust barPos hush key mode keyConf chroma harmAngle valence phrase16Pos
dropEvt build intensity arousal`

`flowBass` and `flowMid` left: spec 2 replaced them with the beat lock and the trains. `sub` and `bpm` from the
brief's list are not read. Every field has a `help.feats` line; `regularity` and `clarity` keep their `the bid:`
prefix and `arc` and `calm` correctly lost theirs (both are now read outside `score()`). `score()` is verbatim,
`id` 5, `name`, `cuts: 'continuous'`, `colour: {default: 'v2'}` and `look` unmoved.

`card.blurb` **changed**, and why: the tile's job is to say what the picture is, and the picture's character is now
that it dances. "turning on the 3-sphere and cast into three dimensions" describes v0.2's screensaver.

---

## What I would tune first when the user looks — the leans, ranked by how likely they are to want them changed

1. **The bump widths, `grooves.SIG` = 0.055 / 0.042 / 0.032** (the brief's lean was 0.18 / 0.08 / 0.04). This is the
   lean I changed furthest and the one that decides whether the groove reads as beads or as a glow. It is bounded
   below by the mesh — an edge has `sub + 1 ≤ 9` sample points — so there is not much room to go finer, but 0.07–0.09
   is a legitimate softer look.
2. **The nudge gains, `dance.KICK_XY / ZW / XW` = 10 / 7 / 1.8**, with `grooves.AMPN` 0.45 behind them. A full-strength
   bass onset lurches the xy plane by 0.31 rad (18°) — four fifths of what the lock advances in a whole beat. Lean 13
   asked for visible and this is visible; it is also the thing most likely to read as too much on a busy track.
3. **The pole bound, `dance.XWMAX` = 0.18 rad, and the whole reinterpretation of the brief's clamp.** The measurement
   behind it is solid (friction 1) but the *policy* — bound the excursion, let the drift do what it always did — is
   my choice, not the user's.
4. **Portrait cropping (friction 15).** Not introduced by this session, but now that the figure can grow 26 % it is
   more visible. One line in `size` fixes it and shrinks the phone view by half; it needs a decision, not a guess.
5. **`colour.SPREAD0 / SPREAD1` = 0.30 / 0.45** (the wheel spans 0.30–0.75 of the hue wheel). Straight from TORUS2 and
   approved there in v0.7, but TORUS2's twelve families are spatially separated and POLYTOPE's twelve sectors
   interleave. A narrower wheel is calmer; a wider one makes the twelve keys more distinct.
6. **`index.PBRI / PWID` = 1.7 / 1.2, the bead's brightness against its thickness.** The zero-mean profile makes both
   exposure-neutral, so this is purely a question of whether a bead should read as a bright patch or a thick one.
7. **`colour.GLOW0` = 0.35, the floor a silent pitch class keeps.** Lower and the cage is mostly dark with three lit
   sectors; higher and chroma stops reading. It is a routable parameter, so the user can try it live.
8. **`dance.WOBBLE` = 0.12 rad, the bass lean toward the pole.** Small and easy to miss; also the term most likely to
   be wanted *bigger*.
9. **`grooves.LIFE` = 8 beats and the one-edge-per-bar travel.** Both are the brief's, both unquestioned, and both
   decide how crowded an edge gets.
10. **The three thresholds `THR_BASS/MID/HIGH`.** Ranked low on purpose: the `ARMF` latch made the launch rate nearly
    threshold-independent, so these are the safest knobs in the scene, not the sharpest.
11. **`SWEEP_MIN` = 4 beats and the cue set** (phrase boundary · section · drop). On a track with 16-beat phrases the
    sweep lands about once a phrase; on a busy one the spacing does the limiting.
12. **`SIZE0/I/A/B` = 0.95 / 0.10 / 0.05 / 0.10.** The resting figure is 5 % smaller than v0.8's and a full build
    makes it 26 % bigger. Chosen so `size` fits the brief's `[0.5, 1.2]` exactly.
13. **`colour.SECB` = 0.3, the sector cross-fade width.** Invisible unless you look for it; it exists only to keep
    `cuts: 'continuous'` honest.

## Nothing I could not finish

Every step of the brief's Process is committed with its proof. The one thing built differently from the brief is the
pole clamp (friction 1), and the one thing I could not meet is portrait cropping (friction 15) — both measured,
both reported, neither guessed.
