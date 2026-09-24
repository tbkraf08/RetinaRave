# hue-follows-the-set — which hue coordinate makes the colour match the set (v0.3 close, item 2)

Worker from `docs/workers/brief-hue-follows-set.md`. The question behind it is the user's sentence on the §24/§25
OKLCH passes: *"the colours don't seem to match up with the set."* The orchestrator's diagnosis — that hue is the
**external angle** in both passes, so the colour cells are the radial sectors of the binary decomposition and cut
across the filaments — was to be **tested, not assumed**. It tested true, and harder than the diagnosis said: at
depth the external angle does not merely cut across the shape, it stops being a colouring at all.

Nothing is applied here. The probe is a `#test` hook; the shipped mapping is untouched and byte-identical.
Montages: `tools/work/hue-set-feigen.jpg` (4 rows × 3), `tools/work/hue-set-nav.jpg` (3 rows × 2). The nine/four
full-size shots are `tools/work/hs-{f,n}-{c0,c1,c2,v2}-{f360,f840,d360}.jpg` (all of `tools/work/` is gitignored).

---

## The two verdicts

**FEIGEN — the shipped external angle cuts across the set; both alternatives follow it; the winner is the distance
(`hueco 2`), and it is clearly better than `ea`.** Iso-hue must be a curve parallel to the boundary, and only a
scale-free quantity keeps the same number of those curves in frame at every depth of the dive: the distance does
(1.6 → 2.9 hue turns from L0.37 to L4.15), the potential does not (0.8 → 16.1). v0.2's look is itself a
potential/distance colouring — so **the OKLCH variant should colour by the distance too**, not by the angle.

**NAV — the shipped mapping cuts across the set; the Koenigs coordinate inside + the smooth escape count outside
(`hueco 1`) follows it, and is clearly better than the shipped `arg λ` / external angle.** The shipped exterior
divides the frame into two or four enormous radial sectors whose seams run straight through the set's own lobes;
the escape count wraps every lobe in concentric hue rings that trace its outline. Same conclusion as FEIGEN, same
reason, and it agrees with what v0.2's bands already do.

---

## 1. The experiment

A `#test` hook `hueco(v)` on each scene sets module state that a `#define HUECO 1` build of the fragment source
reads through a `uniform int uHueCo`. Everything in each pass stays as shipped **except**, on `hueco ≠ 0`, the
lightness (`min(L, 0.5)`) and the chroma (the full `okCmax(L)`): the pale field the user saw was L 0.7 under the
linear tonemap (§24), and it must not confound the hue question. The interior branch of FEIGEN and the PiP of NAV
are shipped in every column, as the brief asked.

- **FEIGEN** (`colour.js`): `0` = `H = ea + uHue + 0.5·uInvert` (shipped) · `1` = `H = K_G·lG + uHue` · `2` =
  `H = K_D·log2(d) + uHue`.
- **NAV** (`shaders.js`, `FS_JULIA`): `0` = shipped (`arg λ` inside, the external angle outside) · `1` =
  `H = Lk·K_LK + uPal.x` inside (the Koenigs bands become hue bands) and `H = sn·K_SN·uSc.y + uPal.x` outside
  (iso-hue = an equipotential of J_c).

**The shipped pass is byte-identical by construction, not by luck.** The first build gated the override on a plain
runtime `if (uHueCo != 0)`. FEIGEN survived it, NAV did not: `s0-f360` moved from `87d5f8bd…` to `5824724c…` with
`uHueCo` pinned at 0 — the same arithmetic, reproducible across runs, a different picture. The only plausible
cause is the GLSL optimiser: once `hlc` has to survive a branch it can no longer be folded into `palOKs`, and one
ulp is enough to move a JPEG's md5. So the probe is now behind `#ifdef HUECO`, and the `#define` is prepended
**only** when the hook is set — at `hueco 0` the preprocessor deletes the probe and the compiler sees the shipped
token stream. `s0-f360` came back to `87d5f8bd…`. Generalisation worth keeping: *a "bit-identical when off" switch
in GLSL is a preprocessor switch, never a uniform branch.*

## 2. The k constants, and why

They were measured before they were chosen. `hooks.clipdbg=2` writes `(−lG)/512` and `(log2 d + 24)/24` into the
red and green channels of an RGBA8 readback; percentiles over the **exterior** pixels of a 1280×720 `scene.draw()`:

| view | frame | label | exterior px | −lG p10→p90 | −lG p2→p98 | log2 d p10→p90 | log2 d p2→p98 |
|---|---|---|---|---|---|---|---|
| `test&scene=6` | f360 | L0.37 | 695 155 | 2.0 → 10.0 | 2.0 → 32.1 | −7.34 → −1.04 | −13.55 → −0.56 |
| `test&scene=6` | f840 | L1.55 | 497 132 | 6.0 → 26.1 | 4.0 → 72.3 | −10.07 → −2.07 | −15.53 → −1.51 |
| `test&scene=6&feig=3.6` | f360 | L3.97 | 524 629 | 44.2 → 204.8 | 38.2 → 357.4 | −17.13 → −5.65 | −21.84 → −4.61 |
| `test&scene=6&feig=3.6` | f840 | L4.15 | 487 289 | 48.2 → 204.8 | 42.2 → 365.4 | −16.94 → −5.65 | −21.55 → −4.61 |

**`K_G = 0.1`** — one hue turn per **10 doublings** of the Green's potential. The p10–p90 spread of −lG is 8 units
shallow, so 0.1 puts a little under one turn across the open field (a single clean ramp, which is what a montage
needs to answer "do the iso-hue lines run parallel to the boundary?"). It is the only honest choice available,
because **there is no k that works at both depths**: that spread is 8 units at L0.37 and 160 at L3.97, a factor of
20. At `K_G = 0.1` the deep frame gets 16 turns; at the first value I tried, `K_G = 0.5` (one turn per period of
the shipped Green's lightness band), the shallow frame already gets 4 turns and the deep frame 80 — a barcode. So
the potential's band count is a function of how deep the dive is, exactly as §24 found when it tried to put
`log2 G` on **lightness** and the whole `&feig=3.6` frame went dark. Hue wraps where lightness saturates, so the
failure is milder — a wash instead of a black frame — but it is the same failure.

**`K_D = 0.25`** — one hue turn per **4 octaves** of the scale-free distance estimate. The p10–p90 spread of
`log2 d` is 6.3 octaves shallow and 11.5 deep, a factor of 1.8 rather than 20, so 0.25 holds the band count
between **1.6 and 2.9 turns at every depth measured**. The absolute level shifts (median −2.8 shallow, −9.8 deep),
but a shift of hue is a rotation of the wheel, which is invisible — `LOOK.pal[0]` does it on purpose every
section. This is the same property §24 chose the distance for when it put it on lightness: `d` is divided by the
view width, so it is the one exterior coordinate the cascade's self-similarity leaves alone.

**`K_LK = 1`** (NAV interior) — one hue turn per Koenigs band, i.e. the existing `bands = .5+.5cos(TAU·Lk)` becomes
the hue band. No free parameter: the band is the natural unit of the coordinate. **`K_SN = 0.2`** (NAV exterior) —
one turn per 5 units of the smooth escape count, i.e. per 5 doublings of the potential of J_c, carrying the
shipped `uSc.y` (1/P) so a baby copy's rings stay the same width as the host's. Judged on the montage: at f840 it
draws four or five complete rings around each blob, which reads as a contour map and not as a stripe pattern.

## 3. Reading the montages

### `tools/work/hue-set-feigen.jpg` — rows: `hueco 0` (shipped ea), `1` (potential), `2` (distance), v0.2

**Row 1, `ea` — cuts across, then stops colouring.** At f360 the field is a *comb* of fine radial rainbow stripes
running outward from the boundary, perpendicular to it. Travel along any filament, or along the edge of the
cardioid, and you cross a dozen hues in a centimetre; travel straight away from the set and the hue does not
change at all. That is the user's sentence, drawn: the colour cells are the sectors of the angle, and the set's
own contours are the one direction they never follow. It is worse at depth. At f840 and at `&feig=3.6` the frame
is **grey** — not pale, achromatic: adjacent pixels differ by many turns of `ea`, so the hue cells are finer than
a pixel and the picture averages to neutral. The shipped mapping does not merely mismatch the set at depth; it
deletes itself, which is the half of the diagnosis the brief did not predict.

**Row 2, the potential.** Iso-hue lines are now closed curves parallel to the boundary. At f360 a broad green
field ramps through yellow to a pink and teal rim that wraps the cardioid, the spike and every bulb; the filaments
of the antenna each hold one hue along their length. At `&feig=3.6` the same structure, but sixteen turns of it —
pastel scallops around every filament. It follows the set, and it is legible, but the band count is a function of
depth (see §2), so a viewer flying the dive watches the stripes multiply.

**Row 3, the distance.** The same geometry as row 2 with a band count that does not move: two to three turns in
every column. The rim sequence (teal → orange → pink → teal) reads as a contour map of "how far is this pixel from
the set", which is exactly the quantity the black edge already draws. A bulb is one hue at its widest; a filament
is one hue along its length; the hues pinch nowhere. This is the row that looks like a colouring *of the set*.

**Row 4, v0.2.** One hue per frame (green at f360, violet at f840, mint at `&feig=3.6`) and a *brightness* that
follows the boundary: the set glows at its edge and falls off outward. So what the user recognises in v0.2 is not
a hue mapping at all — it is a **potential/distance grading**, a cosine palette read along the smooth escape
count. Two things follow. (a) Row 3 is the OKLCH translation of exactly that grading, which is why it is the one
that "matches". (b) v0.2's grade runs the other way — bright at the boundary, dark far away — where the OKLCH
pass is bright in the far field and dark at the boundary (§24's open taste question). That is a lightness
decision, not a hue decision, and it belongs to item 1's default-look work, not here.

### `tools/work/hue-set-nav.jpg` — rows: `hueco 0` (shipped), `1` (Koenigs / escape count), v0.2

**Row 1, shipped.** At f360 a single hue seam runs vertically down the middle of the frame: everything left of it
(dust *and* the set's own lobes) is amber and rose, everything right of it teal and blue, and the seam passes
straight through the central lobe, splitting one lobe of the Julia set into a rose half and a teal half. At f840
the frame is an X of four sectors and the two blobs of the set sit across the seams, each one half teal and half
amber. The colour cell is a sector of the angle at infinity; the set is a different shape; they have nothing to do
with each other. The interior is one flat hue over its whole area (`arg λ` is one value per frame), so inside the
set there is no colour structure at all to match or mismatch.

**Row 2, `hueco 1`.** At f360 the set is outlined by a thin rainbow rim that follows the boundary everywhere —
every lobe, every decoration, every satellite gets the same hue sequence, and the far dust falls to a dark neutral
with faint equipotential rings in it. At f840 each blob is wrapped in four or five concentric hue rings that trace
its outline, and the radial shafts (which are the drop's rays, a real feature) are the only thing left that
crosses them. The colour belongs to the shape.

**One honest limit of row 2: the interior is not decided by this montage.** The Koenigs coordinate does drive hue
there, but the shipped interior lightness is 0.10–0.42 and `cMax(L)` at those lightnesses is 0.02–0.07, so the
bands come out as near-neutral scallops rather than hue bands. Inside the set, the montage says only "no worse
than the flat `arg λ`". Whether the interior should be lit enough to carry hue is the same lightness question as
FEIGEN's row 4 note.

**Row 3, v0.2.** Green at f360, blue at f840 — again one hue and a brightness that follows the potential, the
blobs burning white-cyan at their centres. The same conclusion as FEIGEN: the thing the user recognises is bands
that follow the set, and v0.2 gets them from the potential.

## 4. Acceptance — verbatim

```
node tools/check.js
check: 57 modules · uniforms 110 · MS keys 118 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```

`hooks.clipdbg=1`, `CLOCK=1 GPU=1`, `scene.draw()` into `ctx.mkTarget(1280, 720, true)` + `readPixels`, counting
`o.r < 255` of 921 600 — **0 clipped, min `o.r` 255, `glerr` 0 on every coordinate and every frame**:

| run | f360 | f840 |
|---|---|---|
| `test&scene=6&hueco=0` | 0 / 921 600 | 0 / 921 600 |
| `test&scene=6&hueco=1` | 0 / 921 600 | 0 / 921 600 |
| `test&scene=6&hueco=2` | 0 / 921 600 | 0 / 921 600 |
| `test&scene=6&feig=3.6&hueco=0 / 1 / 2` | 0 / 921 600 each | — |
| `test&scene=0&hueco=0` | 0 / 921 600 | 0 / 921 600 |
| `test&scene=0&hueco=1` | 0 / 921 600 | 0 / 921 600 |

As predicted: the probe asks for `okCmax(L)` at a capped L, which is under the envelope at every hue, so the clip
is never reached at any coordinate.

```
PORT=8792 GPU=1 node tools/parity.js fake
max |diff| over all numeric fields: 0 · fields compared 72
MS/NAV parity: every field identical to 1e-9
```

```
PORT=8792 tools/scene-md5.sh hueset      (hueco unset = the shipped pass)
diff <(sort tools/accept/v0.3/scene-md5-v03.txt) <(sort tools/work/md5-only.txt)   ->   no output
```
All **twelve** scene md5s (s0, s1, s2, s3, s5, s6 × f360/f840) are byte-identical to
`tools/accept/v0.3/scene-md5-v03.txt`, including `s0-f360 87d5f8bd…` and `s6-f360 923b314f…` / `s6-f840 b438daf2…`.
`test&scene=0&hueco=0` (the hook set, to 0) also renders `87d5f8bd…`, so the hook itself is free.

`CARD.ERRS` was `[]` on every one of the fourteen shot runs.

## 5. Friction log — questions the docs did not answer, and guesses

1. **`CONTRACTS.md` §1.4 says a hash hook fires before `init`. It does not.** Verbatim: *"a hash hook fires
   **before your `init`** and before the first frame: keep the state a hook sets on the object literal
   (`fibresOn: 1`), not in `init`, or `init` clobbers it."* Under `test&scene=6&hueco=2`, a temporary
   `ctx.log('INITDBG hueco' + S.hueco)` as the first statement of FEIGEN's `init` printed **`INITDBG hueco0`**,
   and the hook demonstrably ran afterwards (the picture changed). So the hook fires before the first *frame* but
   **after** `init`. This matters to any hook whose effect is a shader **build** rather than a uniform: my first
   `#ifdef` build compiled the program in `init` from `S.hueco`, and all three coordinates silently rendered the
   shipped picture. Fix: both scenes now build the probe program lazily in `draw`, on first use. Worth correcting
   in §1.4 — the existing hooks (`feig`, `tricorn`, `standin`, `baby`, `clipdbg`) all happen to be read at
   update/draw time, so nothing had caught it.
2. **`CARD.hooks` is a flat map and two scenes' hooks of the same name collide.** `Object.keys(CARD.hooks)` is
   `["baby","clipdbg","hueco","fibres","probe","lmode","feig","tricorn","standin"]` — one `clipdbg`, one `hueco`,
   and `CARD.hooks.clipdbg.toString()` is FEIGEN's (`clipdbg(v) { S.clipdbg = +v || 0; }`), so NAV's is
   unreachable from `CARD.hooks`. The `&name=value` hash path clearly does reach **both** scenes (both respond to
   `&hueco=`), so the dispatcher is not `CARD.hooks`. This cost a wrong measurement: a readback that called
   `CARD.hooks.clipdbg(1)` before `REG[0].scene.draw()` reported 921 575 of 921 600 NAV pixels "clipped" — it was
   reading the rendered picture, because NAV's `uClipDbg` had never been set. The probe now calls
   `REG[id].scene.hooks.clipdbg(mode)`. `HARNESS.md`'s `window.CARD` section describes `hooks` only as "(scene
   test hooks)" and does not warn that the names are shared. The `nav-hue` worker hit the neighbourhood of this
   (its friction 6, "whether `CARD.hooks` or `scene.hooks` is the right entry point") and guessed right.
3. **The `clipdbg` readback recipe is still in no doc I may read**, only in the two reports. I rebuilt it from
   `feigen-oklch.md` §4's one sentence. My pixel count is 921 600 (1280 × 720) where `nav-hue.md` reports 810 240
   for the same scene — that report drew at the `Q.scale`-scaled size and mine at the full canvas, so the two
   numbers are not comparable; 0 clipped is 0 clipped either way.
4. **Guessed:** that "a few doublings" in the brief meant "roughly one turn across the visible field", and
   resolved it by measuring the field's spread with `clipdbg=2` rather than by taste. Guessed that the NAV
   exterior's `K_SN` should carry `uSc.y` (the shipped Green's-band term does), so a baby copy is not striped
   finer than its host. Guessed that the `else` branch of `FS_JULIA` (interior with no known cycle) stays shipped:
   there is no Koenigs coordinate without a cycle, so there is nothing to test.
5. **Line caps.** `feigen/index.js` was at the soft cap (349 lines, which `check.js` counts as 350). Adding the
   hook and the lazy program put it over, so four `gl.uniform1f` lines were folded onto three, in the style the
   file already uses for `uHue`/`uSat`/`uBri`. That is diff noise in an otherwise tiny change; it is not a
   behaviour change.

## 6. Temptations

`assets/core/` — twice. Once to find where `&name=value` dispatches to scene hooks (friction 1 and 2 are both
answerable in one line of `core/`); once to read how `mkProg` assembles `HEAD` before deciding that prepending
`#define HUECO 1` after `ctx.oklch` was safe. Opened neither. Both were settled from the outside instead: the
first with a `ctx.log` in `init`, the second by shipping it and checking the md5s.

## 7. What this does **not** decide

The winner is not applied anywhere. `hueco` stays a `#test` hook and the shipped `ea` mapping is untouched, byte
for byte, per the brief: the default look is v0.2's (item 1), and the winner belongs in the opt-in `oklch` colour
variant only, on the orchestrator's second instruction. Two things this montage deliberately held constant and
that the variant will have to settle on their own: the field's **lightness grade** (v0.2 is bright at the
boundary, the OKLCH pass is bright in the far field — §24 left it open as taste) and whether NAV's **interior**
should be lit enough for `cMax(L)` to let the Koenigs bands read as hue at all.
