# NAV-ITER — the iteration budget near |λ| → 1 (v0.5 item 2)

Worktree `.claude/worktrees/agent-a3b9fea1250ad4d7d`, branch `worktree-agent-a3b9fea1250ad4d7d`, base `5fe61e0`.
Two commits, `NAV-ITER:` prefixed. Not merged. `PORT=8796` on every run; one Chrome at a time; every bench interleaved.

## 0. The finding that changed the brief

The brief (and `AUDIT-v0.3.md` check 1, and DECISIONS §26) attribute NAV's f1500 cost to critical slowing: as
|λ| → 1 every interior pixel runs to `uIter` before the `conv` ball catches it. **That is not what the expensive
frame is doing.** At f1500 the cycle chart is *absent*:

| frame | mode | baby | `cyc.has` | `cycBase` | `kick` | `par` | `cyc.lnr` | `q` | `Q.iter` | `uIter` |
|---|---|---|---|---|---|---|---|---|---|---|
| f360  | INT | –        | **0** | 1 | 0.343 | 0.00 | −0.128 | 1 | 198 | 198 |
| f480  | INT | –        | 1     | 1 | 0     | 0.00 | −1.221 | 3 | 206 | 264 (pinned) |
| f840  | EXT | –        | 0     | 0 | 0     | 0.00 | −0.071 | 1 | 238 | 238 |
| f900  | EXT | –        | 0     | 0 | 0.023 | 0.00 | −0.071 | 1 | 246 | 264 (pinned) |
| f1500 | INT | **P = 4** (1/5 of a period-20) | **0** | 1 | 0.147 | 0.76 | −0.036 | 4 | 264 | **420** |
| f1800 | INT | **P = 3** (1/2 of a period-6)  | **0** | 1 | 0.045 | 0.00 | −0.128 | 3 | 264 | **420** |
| f2100 | INT | **P = 4** | 1 | 1 | 0     | 0.00 | −0.119 | 4 | 264 | **420** |

`nav.js` line 256 — `if (k > 0.02) N.cyc.has = 0;` — hides the chart while the beat kick is up, and at f1500 the kick
is 0.147. So `uLam.w = 0`, the shader's `conv` test never runs, and every non-escaping pixel burns the whole budget
and lands in the flat `else` branch. The budget is **420, not 264**, because `draw()` multiplies `Q.iter` by 1.6
inside a baby copy (`Math.min(420, Math.round(Q.iter * (B ? 1.6 : 1)))` → 422 → 420).

The control is f2100: the *same* baby, the *same* 420, |λ| every bit as close to 1 (lnr −0.119 against f1500's
stale −0.036), but a chart — and it costs 2.7 ms against f1500's 6.2–6.7. **The cost is "no exit", not "slow exit".**

Two corollaries that decide everything below:

1. **Candidate 1 of the brief (a `uEps2` that widens as |λ| → 1) cannot help at f1500 at all** — there is no
   convergence test at that frame to widen. It would only touch f2100, which is already at its floor. I did not
   implement it; the table above is the number that rejects it.
2. Because `uLam.w = 0` at f360 *and* f840 too, the whole `conv` branch is dead at both scene-md5 checkpoints —
   so nothing I do to the `conv` exit could have been proved by acceptance 4 either way.

### What the budget actually buys (measured, `&itercap=N` probe, reverted)

Rendering f1500 / f1800 with the cap forced to 420 / 264 / 211 / 158 / 106 and diffing the jpgs:

* **f1800 is byte-identical at 211 and at 158** (md5 equal, 0 pixels differ); at 106 it moves 45 pixels by ≤ 6.
  Roughly **two thirds of that frame's 420 iterations change nothing at all.**
* f1500 does move with the cap (264 → 2.43 % of pixels by > 2, 0.042 % by > 32) and the diff image
  (`ni-diff-cap211-f1500.jpg`) shows *where*: two small dendrite spirals inside the dark lobe — late-escaping
  filigree, not the interior wash. The bulk interior is byte-identical from ~211 on.

So: the waste is real and large, but a plain lower cap pays for it in the exterior filigree — and would move f360
as well. The exit has to distinguish "this orbit is trapped" from "this orbit is still deciding".

## 1. The exit rule I chose

`assets/scenes/nav/shaders-v2.js` and `shaders.js`, the same three lines in both (one new uniform, one loop-local
float, one `else if`), plus the upload in `index.js`:

```glsl
    float dd=1e31;
    if(!big){dz=2.*cmul(z,dz);dd=dot(dz,dz);if(dd>1e30)big=true;}
    ...
    if(uLam.w>.5){vec2 w=z-uZs;if(dot(w,w)<uEps2){conv=true;break;}}
    else if(i>=uIterLo&&dd<1.)break;
```

```js
const ITER_LO = 0.5;
...
const it = Math.min(420, Math.round(Q.iter * (B ? 1.6 : 1)));
gl.uniform1i(u('uIter'), it);
gl.uniform1i(u('uIterLo'), Math.round(it * ITER_LO));
```

**The argument.** `dd` is `|(f^n)'(z₀)|²`, which the loop already computed for the `big` test — I only gave it a
name, so it stays loop-local and nothing new is carried between iterations. When there is no chart (`uLam.w = 0`)
a pixel can only end as `esc` or as the flat `else`, and the `else` branch reads **nothing from the loop but `tL`**
(`col = pal(.6)*.03 + pal(.4)*lt*.25*(…) + pal(.45)*uPar²*(…)`; `n`, `m2`, `tC` and `dz` are all `esc`-only). An
orbit whose accumulated derivative has fallen below 1 is inside a basin: it is contracting, it cannot escape, and
its line-trap minimum settled long before. Such an orbit stops at `uIterLo`; everything still growing a derivative —
which is exactly the filigree — keeps the whole budget. The exterior path, `tL`, `tC` and the escape branch are
byte-for-byte what they were: nothing they read depends on where this loop stops.

`ITER_LO = 0.5` is the **lowest fraction at which all eight scene-md5 lines stay byte-identical in both mappings**
(§4). At 0.4 the frame is another ~8 % cheaper at f1500 and everything else still holds, but the OKLCH `s0-f360`
jpg moves — by 2/255 at its single worst pixel, 0 pixels above 2 — because that mapping's flat branch runs `lt`
through `pow(lw, .73)`, which lifts a `tL` difference the v2 ramp quantises away. Below ~0.2 the v2 pair moves too.

## 2. The rules I rejected, and the number that rejected each

| rejected | why (measured) |
|---|---|
| **Cand. 1** — `uEps2` widened by ~1/(−lnr) | `cyc.has = 0` at f1500 and f1800: the `conv` test those frames would need does not run. Dead on arrival at the frames the item is about. |
| **Cand. 2** — a settling test (Brent power-of-two orbit save + a contraction certificate `dot(z−zB,z−zB) < (K·uPx)² && dd < ddB`) | Implemented in both shaders and benched. It **never fires at f1500**: with lnr ≈ −0.036 the orbit has not returned within a pixel after 420 iterations, and it costs the four extra loop-carried registers everywhere — f480 2.85 vs 2.34, f900 2.49 vs 2.05, f1500 9.82 vs 8.32 in adjacent runs (+18…22 %). It also moved f360 (1353 px > 2, max 12) and oklch f360 (384 px > 2, max 9). A pure loss. |
| **Cand. 3 alone** — just a smaller cap, no guard | At f1500 a cap of 264 already moves 2.43 % of pixels (0.042 % by > 32) with no way to spare the dendrite, and a cap low enough to matter moves f360 too. The guard is what makes the same saving free at f1800 and cheap at f1500. |
| guard `dd*uPx*uPx < 1.` (scale-free: "neighbouring pixels' orbits have separated by a pixel") | Roughly doubles the f1500 damage — at the same budget fraction, 4.27 % of pixels > 2 against `dd<1.`'s 1.62 % — and only holds f360 down to ≈ 0.3. |
| guard `dd*uPx < 1.` (the geometric middle) | **Breaks f360** outright (`d14e873d…` against the reference `fb74fee4…`) and still doubles the f1500 damage (3.13 % > 2). |

## 3. Bench (HARNESS "Bench protocol")

`PORT=8796 CLOCK=1 GPU=1`, headless 1280 × 720, `CARD.Q.iter = 264` pinned at every point (the clock is paused, so
`updateQuality` cannot undo it), a discarded `bench(0,50)` then the median of three `bench(0,300)`.

The machine drifted **2.5× across the session** (the same HEAD read f480 1.79, then 2.34, then 3.69, then 1.26), so
**every number below is from an A/B where the two variants were swapped in and out inside the same few minutes**, and
the ratio is the only thing worth reading. `A` = `5fe61e0` (HEAD), `B` = this branch.

| frame | run 1 A | run 1 B | B/A | run 2 A | run 2 B | B/A |
|---|---|---|---|---|---|---|
| f480  | 1.48 | 1.28 | **0.86** | 1.33 | 1.30 | **0.98** |
| f900  | 1.09 | 1.06 | **0.97** | 1.02 | 1.07 | **1.05** |
| f1500 | 6.69 | 4.67 | **0.70** | 6.17 | 4.87 | **0.79** |
| f2100 | 3.07 | 2.73 | **0.89** | 2.71 | 2.85 | **1.05** |

**f1500 / f480** — before **4.52** and **4.64**; after **3.65** and **3.75**.

One run at **1920 × 1080** (`HEADED=1 WIN=1920,1080` on `$DISPLAY=:1`; headless cannot be resized — `cdp.js` hard-codes
`--window-size=1280,720` in its headless branch and exposes no env for it), same interleaving:

| frame | A | B | B/A |
|---|---|---|---|
| f480  | 1.69 / 1.78 | 1.66 / 1.77 | 0.98 / 0.99 |
| f1500 | 7.79 / 7.75 | 5.79 / 5.85 | **0.74 / 0.76** |

f1500 / f480 there: before 4.61 / 4.35, after 3.49 / 3.30 — the same story at the bigger viewport.

## 4. md5 (acceptance 4) — all eight lines byte-identical

`tools/work/ni-ship-md5.txt`, the `scene-md5.sh` recipe restricted to NAV's two ids, both mappings:

```
9ced2e67a9133790be819f2741bdbee0  oklch-s0-f360.jpg   = accept/v0.5/scene-md5-v03-oklch.txt
599ad98597c55d116a3195c1a17b7517  oklch-s0-f840.jpg   = accept/v0.5/scene-md5-v03-oklch.txt
ca053b0fd746ee80913f62bb403d80f4  oklch-s4-f360.jpg   = my HEAD baseline (ni-base)
c4e54245fffc38797a95d3abfdd0397b  oklch-s4-f840.jpg   = my HEAD baseline (ni-base)
fb74fee47170b2d1f043db9f96319c7e  v2-s0-f360.jpg      = accept/v0.5/scene-md5-v03.txt
7225ea02adab09c37055b85189ac5d49  v2-s0-f840.jpg      = accept/v0.5/scene-md5-v03.txt
0bff278ab9e8e89e5f1e53b985fbd8f2  v2-s4-f360.jpg      = my HEAD baseline (ni-base)
be2e3c8d6f2484ef55753e4d5213ef97  v2-s4-f840.jpg      = my HEAD baseline (ni-base)
```

s4 had no reference line, so I baselined it at HEAD first (`tools/work/ni-base-md5.txt`) — and the four s0 lines of
that baseline reproduced `scene-md5-v03*.txt` exactly, which is what says the baseline itself is trustworthy.
`par` is **0.00 at both f360 and f840** (and `cyc.has` is 0 at both), i.e. both checkpoints are far from a
parabolic root, as the brief expected.

`GPU=1 PORT=8796 node tools/parity.js fake` → `max |diff| over all numeric fields: 0 · fields compared 72`,
`MS/NAV parity: every field identical to 1e-9`. Nothing on the CPU side moved; `nav.js` was not opened for writing.

## 5. Montage (acceptance 5) — for the orchestrator's eyes

In `tools/work/`:

* `ni-1500-montage.jpg` — before / after / diff (×6 gain) stacked, f1500, `par` 0.76
* `ni-1800-montage.jpg` — the same at f1800
* singles: `ni-1500-before.jpg` `ni-1500-after.jpg` `ni-1500-diff.jpg`, `ni-1800-…` likewise
* the cap-probe evidence: `ni-cap420-f1500.jpg` … `ni-cap106-f1500.jpg`, `ni-diff-cap211-f1500.jpg`

| frame | > 2 | > 8 | > 32 | max | mean |
|---|---|---|---|---|---|
| f1500 | 9 696 (1.20 %) | 2 367 (0.29 %) | 301 (0.037 %) | 85 | 0.113 |
| f1800 | **0** | 0 | 0 | **0** | 0.000 |

**One sentence:** f1800 does not move a single byte while costing a third less; at f1500 nothing moves but two small
dendrite spirals deep inside the dark lobe — late-escaping filigree whose pixels the 420-iteration cap was already
deciding — and the exterior dust, the equipotential ripple, the orbit-trap ring, the set's outline, the flat interior
wash and the picture-in-picture are all untouched.

## 6. The rest of the acceptance

| # | result |
|---|---|
| 1 | `node tools/check.js` → **0 fail, 1 warn** — the warn is the pre-existing `feigen/index.js has 351 lines`, present at HEAD. `uniforms 110 → 111`: `uIterLo` is declared and fetched, so the dead-uniform check is clean. |
| 2 | **f1500 ≤ 2 × f480: NO** — 3.65 / 3.75 (was 4.52 / 4.64). **f1500 after ≤ 0.5 × before: NO** — 0.70 / 0.79. f900 0.97 / 1.05 and f2100 0.89 / 1.05, both inside the 10 % band: **yes**. See §7 for why the first two are not reachable. |
| 3 | parity fake **0 diff** over 72 fields — **yes** |
| 4 | all eight md5 lines byte-identical — **yes** |
| 5 | montage + numbers above — **yes** |
| 6 | continuity monitor, 60 s on `test&fake=0`: `{"n":3606,"fast":34,"viol":[],"errs":[]}` — **yes** |
| 7 | Q trace — not required, not run |
| 8 | `node tools/bundle.js` → `bundled 66 modules → dist/eigenwobble.html (486 KB)`; the `real` click run → `{"errs":[]}`, no `[EXC]` — **yes** |

## 7. Why acceptance 2's two headline numbers are not reachable

Cost against the cap at f1500, `Q.iter` swept (so `uIter` = 1.6 ×) on one page:

```
uIter    6     13    26    51    106   211   422
f480   1.11  1.30  1.43  1.52  1.62  1.62  1.62     <- flat: nothing at f480 reaches the cap
f1500  1.01  1.84  2.43  2.93  3.60  4.86  6.74     <- linear above ~106, slope .0099 ms/iter, intercept 2.55
f2100  0.91  1.67  2.18  2.51  2.98  3.06  3.09     <- flat above ~106: the chart's exit already does this
```

f1500's extrapolated zero-iteration cost is **≈ 2.55 ms** in that session's units, against f480's **1.62 ms total** —
the exterior alone at that view (a period-4 baby, `scale ≈ 0.20`, the host's boundary filling the frame) costs more
than the whole of f480. So **f1500 / f480 ≥ ~1.6 even if the interior became free**, and `0.5 ×` would require
cutting essentially all of it — which, per §0, is paid for in the dendrite spirals and in f360. The honest ceiling
for a picture-preserving rule at f1500 is about what this delivers; the remaining gap is the exterior, and the lever
for *that* is the `1.6 ×` baby boost or the view scale, neither of which is in my slot.

If the orchestrator will accept the OKLCH f360 jpg moving by 2/255 at one pixel (0 pixels above 2), `ITER_LO = 0.4`
is a one-character change and buys a further ~8 % at f1500.

## 8. Friction log — every sentence the docs lack, every guess

1. **`AUDIT-v0.3.md` check 1 and DECISIONS §26 state a cause that the measurement contradicts.** They say the f1500
   cost is convergence near |λ| → 1; it is `cyc.has = 0` (the beat kick) times the baby's 1.6 × boost. Neither
   document mentions that `nav.js` zeroes `cyc.has` under the kick, nor that `uIter` is 420 rather than 264 inside a
   baby. **Both should be corrected** — a future worker sent at "the |λ| → 1 iteration budget" will lose the same
   half-day I did before the first probe.
2. **`docs/HARNESS.md` "Bench protocol" rule 4 says "nothing else on the machine" but gives no way to tell.** The
   brief's `pgrep -fc "chrom[e].*remote-debugging" -le 8` counts only *debugging* Chromes; during my session that
   count was 0 while the user's desktop Chrome held 72 processes and load average 3.4, and HEAD itself read 1.26 …
   3.69 ms at f480 across the session. **The protocol needs a sentence saying the interleave is not optional and an
   absolute ms is never reportable** — rule 3 says it for FEIGEN ride-alongs; it is true of every worker.
3. **`tools/check.js` imports every scene module in node.** A module-scope `location.hash` read (my first
   `ITERCAP` probe) crashes it with `ReferenceError: location is not defined`. Nothing in HARNESS "Static checks"
   or CONTRACTS says a scene module's top level must be DOM-free. **Guessed** that it must be, and moved the read
   into `init()`.
4. **`tools/scene-md5.sh` cannot produce an s4 line.** It greps `^  id: [0-9]*`, which matches a scene's own `id`
   at two spaces but not a variant's at four, so the DRUM variant is not in `scene-md5-v03.txt` and cannot be. The
   brief asked for "scene-md5.sh's s0 and s4 lines"; I **guessed** that `test&scene=4` with the same step list is
   what was meant and wrote my own two-id runner. Either the script should walk `variants[]` too, or the brief
   should say the s4 line is hand-rolled.
5. **`tools/cdp.js`'s header does not say the viewport cannot be resized in headless.** The size is hard-coded in
   the headless spawn and only `HEADED=1 WIN=…` can change it. The brief anticipated this ("if it cannot, say so
   and skip"), but the header itself should.
6. **`{eval: …}` is an expression context**, not a statement one — a leading `var` is a `SyntaxError`. Undocumented;
   cost me one run. And a `"` inside an eval string has to survive being hand-written into the JSON step list; I
   gave up and generate the step list with node.
7. **`CARD.ENGINE.W` / `.H` do not exist.** I used them to print the canvas size in the headed 1920 × 1080 run and
   got `undefinedxundefined`. I did not hunt for the real names (they would be in `core/`, which I may not read), so
   the 1920 × 1080 table reports the window size, not the confirmed drawing-buffer size. **Guess flagged.**
8. **`docs/HARNESS.md` gives no pixel-diff tool.** `compare`/ImageMagick is not installed; I wrote a nine-line
   Pillow script in my scratchpad. A worker asked for "a diff image and how many pixels by how much" has to invent
   one every time — `tools/` could carry it.
9. `parity.js fake` **overwrites `tools/accept/v0.5/parity-fake.jpg`** as a side effect of being run. It came out
   byte-identical so git stayed clean, but a worker told not to touch anything outside its folder is quietly made to
   write into `tools/accept/`. Worth a line in the brief or in HARNESS.
10. Not a doc gap, a judgement I made without asking: **`ITER_LO` is a fraction of the already-boosted `uIter`**,
    not of `Q.iter`. That is why the short budget is 79 at f360 (no baby) but 210 at f1500 — the frames that need
    the margin get it. Tying it to `Q.iter` instead would have been the other defensible reading.

## 9. Was I tempted to open a forbidden file?

Twice. Once to find where `Q.iter` is set, because the whole question is "what is this budget for" and
`updateQuality` lives in `core/` — I did not open it; I inferred the behaviour from `CARD.Q.iter` being writable
while the clock is paused, which the brief's own recipe relies on. Once to find `CARD.ENGINE`'s field names for
item 7 above — I did not open it and reported the gap instead. `assets/math/mandel.js` (a legal read) I skimmed only
for `solveMult`'s output shape; the answer turned out to live in `nav.js`, which is in my folder.

## 10. Lines touched

| module | before | after | Δ |
|---|---|---|---|
| `assets/scenes/nav/index.js` | 217 | 228 | +11 (9 of them the comment that carries §1's argument) |
| `assets/scenes/nav/shaders.js` | 104 | 107 | +3 |
| `assets/scenes/nav/shaders-v2.js` | 54 | 61 | +7 (4 of them comment) |
| `assets/scenes/nav/nav.js` | 285 | 285 | **0 — the state was not touched, and parity proves it** |
