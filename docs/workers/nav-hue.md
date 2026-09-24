# NAV hue — worker report (v0.3 items 5 + 6, `docs/workers/brief-nav-hue.md`)

Worktree `.claude/worktrees/agent-a0eebe117e44e3956`, branch `worktree-agent-a0eebe117e44e3956`, PORT=8783.
Files touched: `assets/scenes/nav/shaders.js` and `assets/scenes/nav/index.js`.
**`assets/scenes/nav/nav.js` untouched** — `git diff --stat` on the commit names exactly those two files, and
`parity.js fake` is still `0` over 72 fields.

Montage: **`tools/work/nav-hue-ab.jpg`** (copied, uncommitted, to `tools/accept/v0.3/nav-hue-ab.jpg`; `tools/work/`
is gitignored and `tools/accept/**/*.jpg` is not, but the brief forbids touching files outside `assets/scenes/nav/`
so neither copy is staged). The LOOK-dependency pair is `tools/accept/v0.3/nav-hue-look.jpg`.

**Two passes.** The first pass is kept in its own paragraph below ("First pass"); everything else in this report —
formulas, acceptance numbers, montage — is the **second pass**, which carries the orchestrator's decisions (a)–(e)
and the levels fix the first montage asked for.

---

## The formulas shipped (second pass — what is committed)

Both fragment programs are built as `ctx.mkProg(ctx.oklch + OK_NAV + FS, name)`, so HEAD, then §1.14's chunk, then
`OK_NAV`'s one function, then the source. The colour of a pixel is `palOKs(h, L, C)`.

**The gamut envelope** (`OK_NAV`, new export in `shaders.js`):

```glsl
float cMax(float L){return .95*min(.17*L,.47*(1.-L));}
```

**Exterior of J_c** (`esc`), and the same three lines in the PiP:

```glsl
// in the loop, before z <- z^2 + c, for every i:
if(z.y<0.)ea+=ew;ew*=.5;                                 // the itinerary bit b_n = sign(Im z_n)  [decision (a)]
// after the break on |z|^2 > 1e4:
ea+=fract(atan(z.y,z.x)/TAU+1.)*2.*ew;                   // theta_N, weight 2^-N
float gb=.5+.5*cos(TAU*(sn*.035*uSc.y+uTime*.06+.12*sin(atan(z.y,z.x)*2.)));
float lw=(.07+.93*halo*halo)*(.28+.72*gb)+lt*(.25+1.2*uBands.x)*halo
        +exp(-d*7./uSc.x)*(.05+.6*uBeat.w)+ct*uBands.z*.9*halo;
float cs=.55+.45*gb;                                     // fl = edge*(.3+.4*uBeat.y)
h = ea + uPal.x
L = .55*pow(clamp(lw,0.,1.),.73)                         // the cap: L stays where cMax is usable
C = cMax(L) * cs
col = palOKs(h,L,C) + vec3(1.)*fl*.45*uPal.w             // the boundary flash, additive, outside the request
```

**Interior with a known cycle** (`conv`, taken only at `uLam.w > .5`):

```glsl
bm = .6 + .4*bands
h = uLam.y/TAU + uPal.x
L = clamp((.10 + .32*exp(uLam.x))*bm, 0., .92)            // 0.10 … 0.42: a centre dark, a root a lit mid-tone
C = cMax(L) * bm * (.88 + .12*spokes)
```

`base = palOKs(h, L, C)`, then `col = mix(base, drum, uDrum) + pal(.8)*lt*.15` exactly as before — the DRUM variant's
Koopman term and the line-trap add are untouched — and then the smoulder, **additive and outside the mix** so the
membrane keeps it (decision (d)), byte-for-byte the term the NAV-SMOULDER worker shipped:

```glsl
col += pal(.5+.1*bands)*uPar*uPar*(.35+.3*uBands.x)*(.3+.7*bands);
```

The spokes are kept as the small chroma modulation the brief asked for; the orchestrator's line named only
`cMax(L)·(0.6+0.4·bands)`, and `(.88 + .12·spokes)` is that times a ±12 % ripple.

**Plain interior** (`else`, no cycle known):

```glsl
lw = .6*(.03 + lt*.25*(.3+uBands.x))
h = uPal.x + .5 ; L = clamp(pow(clamp(lw,0.,1.),.73), 0., .25) ; C = cMax(L)*.4
col = palOKs(h,L,C) + pal(.45)*uPar*uPar*(.16+.2*uBands.x)    // its smoulder as today, additive
```

**PiP exterior** (`FS_MANDEL`), the bits taken off the critical orbit `z_1, z_2, …` (so `Phi_M(c) = phi_c(c)`):

```glsl
gb = .5+.5*cos(TAU*sn*.03) ; lw = .35/(1.+e*.05)*(.35+.65*gb) ; cs = .55+.45*gb
h = ea + uPal.x ; L = .55*pow(clamp(lw,0.,1.),.73) ; C = cMax(L)*cs
col = palOKs(h,L,C) + vec3(.9)*exp(-e*.6)       // the white DE rim is unchanged
```

`hooks.clipdbg` (both programs, `#test` only): 1 writes `okClip(h, L, C)` of the shipped colour into `o.r`, 2 writes
`okClip(h, L, .11*cs)` — the flat chroma the brief named — so the probe also says how much work the envelope does.

---

## (a) Friction log

1. **`assets/scenes/feigen/field.js` does not accumulate an external angle.** The brief says "accumulate the external
   angle in the iteration loop the way `feigen/field.js` does (the binary itinerary bits of the orbit, `ea` in 0..1)".
   `field.js` has no itinerary and no `ea`: it writes `atan(z.y,z.x)/TAU + 0.5` — the *escape* argument, one number
   from the final point, with no doubling expansion (line 51, `o = vec4(n, log(sqrt(m2)), log(max(length(dz),1e-20)),
   atan(z.y,z.x)/TAU+0.5)`). `grep -n "ea\|angle\|itiner\|bit"` over the file confirms it. Guess made: implement the
   expansion from the doubling law myself, `theta_n = (theta_{n+1} + b_n)/2`, accumulated forward as
   `ea += b_n 2^-(n+1)` and closed with `theta_N 2^-N` where `theta_N = arg(z_N)/TAU` (valid because `phi(z) ~ z` at
   |z|^2 > 1e4). The bit `b_n` is which of the two halves of the basin cut by `R_0 u R_(1/2)` the point is in; I used
   `Im z_n < 0`, which is that partition exactly in the far field and to within a thin set near J. Nothing in the
   repo names a convention for it. **Orchestrator decision (a): accepted**, and now stated in a comment on the
   accumulating line of both shaders.
2. **`C = 0.11` is not safe over the lightness range the brief itself asks for.** §1.14 guarantees C .11 "at L 0.7";
   the brief then asks for `L = 0.30 + 0.35 exp(uLam.x)` (0.30…0.65) with `C = 0.11·(0.6+0.4·bands)`. At L 0.30 the
   min-over-hue max chroma is **0.051** (hue 200°), so more than half the interior would be gamut-clipped and the
   brief's own acceptance item 5 (0 clipped pixels) would fail. Guess made: keep the brief's *shape* and make the
   constant a function of L — `C = cMax(L)·x` with `cMax(0.7) = 0.113`, i.e. identical to `0.11·x` where §1.14
   measured it, and shrinking where the gamut does. `cMax` was derived by bisecting `okLabToLin` (the matrices
   re-implemented in node from `assets/core/oklch.js`, which is a legal read) on a 200 × 720 (L, hue) grid: the true
   curve is above `0.95·min(.17 L, .47 (1−L))` everywhere, worst margin **4.3 %** at L 0.99. `hooks.clipdbg=2`
   measures the size of the problem: the flat `.11·cs` would be clipped on **646 052 of 810 240 pixels** at f360.
   **Orchestrator decision (b): accepted**, and §1.14 will spell the L-dependence out.
3. **"the root/cusp reads as the bright rim" cannot be a rim.** `uLam` is *one* `(ln|λ|, arg λ)` per frame for the
   whole component (`N.cyc`, set once per update in `nav.js` 144/153/170), so `L = .30 + .35|λ|` is a per-frame
   global lightness, not a spatial gradient: the component brightens *in time* as c walks to the root, it does not
   grow a bright edge. The spatial structure inside the component is still the Koenigs bands (`bm`) and the spokes.
   Kept the brief's formula and reported what it actually does (see the montage, f360 → f660).
   **Orchestrator decision (c): "rim" was an error in the brief; a temporal brightening is what `uLam` allows.**
4. **The smoulder under DRUM.** The brief says the smoulder "stays (uPar² lift on L)". A lift on L lives inside
   `base`, which `mix(base, drum, uDrum)` fades out — so at `vmix = 1` (the DRUM variant fully on) the smoulder is
   now hidden, whereas the term the last worker shipped was added *after* the mix and survived. Guess made: follow
   the brief (lift on L, inside `base`); DRUM is a variant that only bids while `cycBase` is set and `par` is
   typically 0 there, so the loss is small. **Orchestrator decision (d): put it back additive, outside the mix** —
   done in the second pass, the exact term the NAV-SMOULDER worker shipped, so DRUM keeps it and the colouring is
   still byte-identical at `par = 0`. The same for the plain interior branch.
5. **"one compare and one add per iteration" is a compare, an add and a halving.** `ew *= .5` is needed because the
   expansion is forward. Measured cost below: −1.8 % on the NAV median, i.e. inside the noise.
6. **`hooks.clipdbg`'s readback recipe is not in any doc I may read.** The brief says "as the FEIGEN brief"; I took
   the pattern from the two lines of `docs/workers/feigen-oklch.md` §4 that a `grep -n clipdbg` surfaced
   (`ctx.mkTarget(1280,720,true)` + `scene.draw()` + `readPixels`, count `r < 255`) rather than reading the FEIGEN
   brief or `feigen/colour.js`. For the PiP there is no such recipe at all: `overlay()` draws straight to the default
   framebuffer inside a scissor, so I call `scene.overlay(W, H, 1, 0)` from the eval and `readPixels` the PiP
   rectangle off framebuffer `null` in the same JS turn. It works (`getError` 0) but it is my invention.
7. **`docs/workers/brief-nav-hue.md` is not in the worktree.** It is untracked in the main checkout, so a worktree
   branched off master does not have it; read it from `/home/toma/Documents/Kraftek/Eigenwobble/docs/workers/`.
8. **The bench cannot be interleaved with itself.** HARNESS's bench protocol says a threshold "is decidable from
   interleaved pairs, never from absolute ms", and the interleave partner it names is NAV — but the scene under test
   *is* NAV. Guess made: interleave with id 3 instead and report both the absolute medians and the NAV/id-3 ratio.
   Also: pinning `CARD.Q.q = 0.95` does **not** pin `Q.iter`; `iter` still moved 190 → 214 and `scale` 0.75 → 0.875
   during the four calls, on both sides identically (same session shape), which is the only reason the comparison
   means anything. Worth a sentence in HARNESS next to the existing `q`-pinning note.
   **Orchestrator decision (e): interleaving against id 3 is the right call when NAV is the subject.**
9. **`{"shot":"name","clip":[…]}` , not `{"shot":{"path":…,"clip":…}}`.** HARNESS's step list is right; I misread it
   once and `cdp.js` died with `ERR_INVALID_ARG_TYPE` and no message about the step. A one-line guard there would
   save a Chrome start.
10. **Tuning rounds.** The brief's mapping as first written (C proportional to the brightness weight) rendered
    near-achromatic: the exterior came out a white-grey haze, brighter than the baseline's green because a neutral
    high-L field blooms in all three channels instead of one. Two rounds: chroma raised to the full `cMax(L)`
    envelope (drop the `lw` factor from `cs`), and the Green's ripple deepened from `(.55 + .45 gb)` to
    `(.28 + .72 gb)` with the `.12 sin(2 arg z)` wobble put back into its phase, because collapsing four
    differently-hued palette layers into one hue had flattened the equipotential banding. `.58` on `lw` is the
    overall level; it reads slightly darker than the baseline and I left it there rather than chase parity.

## (b) Forbidden files

Not opened. Three temptations:

- **`assets/math/oklab.js`** (it has `maxChroma(L, h)`, which is exactly friction 2's question) and
  **`tools/test_oklab.js`**. Neither is on the brief's read list. Did not: re-implemented the two matrices from
  `assets/core/oklch.js`, which is on the list, in a throwaway node script, and then *proved* the envelope on the GPU
  with `hooks.clipdbg=1` — 0 clipped pixels of 810 240 is a stronger check than agreeing with the twin anyway.
- **`assets/scenes/feigen/colour.js`**, for the `clipdbg` encoding and the readback (friction 6). Did not: the brief
  allows `feigen/field.js` only, and one grep of the *report* gave enough.
- **`assets/core/scenes.js`**, to learn whether `overlay()` may be called outside the frame loop and whether
  `CARD.hooks` or `scene.hooks` is the right entry point. Did not: called `CARD.REG[0].scene.hooks.clipdbg` directly
  and checked `gl.getError()` = 0 afterwards.

## (c) Acceptance outputs

**1. Static check** — `node tools/check.js`, verbatim:

```
check: 57 modules · uniforms 108 · MS keys 117 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```

Identical before and after (uniform count unchanged because `uClipDbg` already exists in `feigen/colour.js`).
`shaders.js` 95 lines, `index.js` 193 — both under the 350 warn line.

**2. State parity** — `PORT=8783 GPU=1 node tools/parity.js fake`, the two lines verbatim:

```
max |diff| over all numeric fields: 0 · fields compared 72
MS/NAV parity: every field identical to 1e-9
```

**3. Continuity monitor**, 60 s on `test&fake=0`, verbatim:

```
EVAL JSON.stringify({n:MON.n,fast:MON.fast,viol:MON.viol,errs:CAR => "{\"n\":3604,\"fast\":42,\"viol\":[],\"errs\":[]}"
```

`viol` `[]`, `ERRS` `[]`, `fast` 42 (HARNESS's band is 97; a colouring cannot move `cPath` and did not). The first
pass read `fast` 40 on the same run.

**4. Montage** — `tools/work/nav-hue-ab.jpg`, 2 columns × 5 rows, before | after. `CLOCK=1 PORT=8783 GPU=1
OUT=tools/work node tools/cdp.js 'test&scene=0' …`, `CARD.ERRS` `[]`, `CARD.nonFinite()` `[]` on both sides,
`rt.log` at the end `"EXT h-0.07 lg-4.0 par0.00"` on both.

| frame | `CARD.home.par` | mode | before md5 | pass 1 md5 | **pass 2 md5 (shipped)** |
|---|---|---|---|---|---|
| f360 | `0` | INT | `92438f2da223f77c7a001f4cf45bd236` | `528471fedfbdd50c846d101921106a8b` | **`f97debf2877a1e4853f277fb9181db81`** |
| f660 | `0.4617767174141431` | INT | `eeded31f8ccae68ba7ba1defad70b4ad` | `76c461341eeaab710ea1602ce82403ed` | **`fbf06c0e6a29a068b384c81869bf050b`** |
| f760 | `0.18564430167589455` | INT | `70697cf87bc3ac02af6dcdaae6b1d7cb` | `7b6712a5d026855a34542677aeb8df29` | **`59dba271c8c33c48e8e0b9890c6e1bab`** |
| f840 | `0` | EXT | `d697789c4f40f87b6f07e763c25da108` | `730d9373cfed36804289bc143757c090` | **`9eeb877702a8f1644255fefdca072108`** |
| real 40 s | — | EXT | `8a5757f6f94ea0d202d9870778cbbefe` | `cfc646bce0d962d9870a1658f3987579` | **`395d534c63529dd75ce1ed75060f3c54`** |

f760 was added because the brief's `par > 0` frames (f660, f720) put NAV on a thin dendritic set with almost no
interior on screen; f760 is where the filled set owns the middle of the frame (the last worker found the same).

**5. Gamut** — `hooks.clipdbg`, `CLOCK=1 GPU=1`, `scene.draw()` into `ctx.mkTarget(W,H,true)` for the Julia program
and `scene.overlay()` + `readPixels` off framebuffer `null` for the PiP. Verbatim:

```
EVAL PROBE(1) => "{\"mode\":1,\"julia\":{\"px\":810240,\"clipped\":0,\"min\":255},\"pip\":{\"px\":23104,\"clipped\":0,\"min\":255},\"glerr\":0}"       f360
EVAL PROBE(2) => "{\"mode\":2,\"julia\":{\"px\":810240,\"clipped\":646052,\"min\":60},\"pip\":{\"px\":23104,\"clipped\":14870,\"min\":53},\"glerr\":0}"  f360
EVAL PROBE(1) => "{\"mode\":1,\"julia\":{\"px\":810240,\"clipped\":0,\"min\":255},\"pip\":{\"px\":23104,\"clipped\":0,\"min\":255},\"glerr\":0}"       f840
EVAL PROBE(2) => "{\"mode\":2,\"julia\":{\"px\":810240,\"clipped\":696349,\"min\":40},\"pip\":{\"px\":23104,\"clipped\":16384,\"min\":39},\"glerr\":0}"  f840
```

**0 clipped pixels at f360 and f840**, in the main view *and* in the PiP — the gate. Mode 2 is the counterfactual:
the flat `.11·cs` would have needed the clip on 80 % of f360 and 86 % of f840 (all 16 384 lit PiP pixels there),
down to `okClip` 0.153, which is friction 2's evidence. Pass 1 read 621 343 / 655 138: the second pass's lower
lightnesses make the flat chroma *worse*, because `cMax` shrinks as L falls below its 0.73 peak. (One caveat: the 160 additive critical-orbit sprites are drawn over the probe target after
`ctx.tri()`; they can only push `o.r` up, so they could hide a clipped pixel under a sprite, never invent one.)

**6. Real path**, `PORT=8783 NOAUTO=1 GPU=1 node tools/cdp.js 'real' …`, 45 s after the click:

```
EVAL JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS}) => "{\"bad\":[],\"errs\":[]}"
```

No `[EXC]` line in the run. The PiP is visible in `after-real40` (bottom right).

**7. Cost** — `CARD.bench(0,300)` interleaved with `CARD.bench(3,300)`, matched session shape (`test&scene=0`,
`setInterval(() => CARD.Q.q = 0.95, 16)`, `{"wait":25000}`, a discarded cold call then three pairs; `Q.iter` walked
190 → 214 → 214 and `Q.scale` 0.75 → 0.875 identically on both sides):

| | cold (discarded) | three NAV | NAV median | three id 3 | id 3 median | ratio median |
|---|---|---|---|---|---|---|
| before | 4.608 | 4.701, 5.042, 4.998 | **4.998 ms** | 0.924, 0.853, 0.860 | 0.860 ms | **5.809** |
| pass 1 | 4.298 | 4.786, 4.932, 4.906 | 4.906 ms | 0.971, 0.872, 0.812 | 0.872 ms | 5.659 |
| **pass 2** | 4.728 | 4.441, 5.269, 5.272 | **5.269 ms** | 0.971, 0.988, 0.912 | 0.971 ms | **5.331** |

**+5.4 % on the absolute median, −8.2 % on the NAV/id-3 ratio** — both inside the brief's 10 %, and the ratio, the
only figure HARNESS says a threshold is decidable from, went *down*. The absolute rise is machine load, not the
shader: id 3, which this change does not touch, rose 0.860 → 0.971 ms (+13 %) in the same session, and the spread
inside the pass-2 triple alone is 0.83 ms.

**8. Help.** `help.why` gained: *"Hue is the angle of the ray you are on: inside a component it is the internal angle
arg lambda, outside it is the external angle of the point, which is why a ray in the picture-in-picture and its image
in the Julia set share a colour."* `help.feats` and `feats` unchanged (no new `MS` read); `check.js` still reports
`help.feats gaps 0`.

### What the montage showed (second pass — the shipped colouring)

**Is the interior dark with a lit root? Yes. Does f840 keep the drop's punch against black? Yes.**

- **f360 (INT, `par` 0, deep in a bulb).** Before: one green field, the Green's-function bands as light/dark spokes
  and annuli, a dark teal filled set. After: **the exterior splits into four broad hue sectors** — olive-gold on the
  left, rose through the centre-left, teal to the right of the set, indigo at the upper right — saturated colour on
  a black field, with the equipotential banding surviving as the fine radial striping *inside* each sector. That is
  the external angle: the hue makes one full turn of the wheel as you go once round the set, so every dynamic ray
  has its own colour. **The filled set is dark again** — a near-black maroon with the Koenigs texture just legible
  in the bulbs, because |λ| is small this far from the root (`L = (0.10 + 0.32·|λ|)·bm`, here ≈ 0.06–0.10).
- **f660 (`par` 0.462) and f760 (`par` 0.186), both approaching a parabolic root.** Before, the filled set is a
  near-black silhouette in a copper (f660) / dark green (f760) exterior. After: at f660 the component is a **lit
  olive-khaki mid-tone** (|λ| ≈ 0.94, L ≈ 0.42·bm) with its whole interior filigree readable — a root that is
  *lit*, not blown out; at f760 (|λ| ≈ 0.83, L ≈ 0.37·bm) it is a dark slate-blue carrying the same filigree.
  Pass 1 had both of these pale and washed out; the 0.30 → 0.10 floor and the 0.35 → 0.32 gain are what fixed it.
  Across f360 → f760 → f660 the interior hue sweeps maroon → slate-blue → olive as `arg λ` turns: the rotation
  number's direction, a sweep *in time* rather than a spatial fan (friction 3, decision (c)).
- **f840 (EXT, after the drop).** Before: blue lobes on near-black. After: a bold X of ray sectors — teal along the
  upper-left/lower-right diagonal, amber-gold lower-left, rose upper-right and lower-centre — all on **solid
  black**, with the drop's DE filigree and the dark critical point at the crossing reading clearly. The punch is
  there; what it cannot match is v3's *vivid* cyan, which is outside sRGB at OKLCH C ≤ 0.119 — §19's clip rule
  (a clipped colour goes greyer, never hue-shifted) is the documented price of hue-accurate rays.
- **real 40 s.** Before: green striping around a blue dendrite. After: a black field with the dendrite in pale
  blue-teal and rose / amber sectors either side, PiP unchanged in place.

Frame means (all 1280 × 633 pixels, sRGB) confirm the levels: f360 `(31.9, 67.1, 50.5) → (18.9, 19.4, 19.5)`,
f660 `(34.5, 23.7, 19.9) → (26.6, 27.3, 23.5)`, f760 `(7.4, 14.4, 11.2) → (26.9, 28.9, 31.7)`,
f840 `(14.4, 33.0, 47.5) → (28.9, 29.8, 29.9)` — the same overall level as v3 except at f360, whose baseline was
an unusually bright green wash. The channel imbalance disappears because a frame now spans the whole hue wheel
instead of one palette sector.

### First pass (superseded, kept for the record)

The first pass shipped the brief's numbers literally: interior `L = (0.30 + 0.35·exp(uLam.x))·bm` with the smoulder
as a `uPar²` lift *inside* `base`; exterior `L = mix(pow(0.58·lw, .73), 0.92·uPal.w, fl)` with the boundary flash a
mix toward white; PiP `L = pow(0.6·lw, .73)`. Its acceptance all passed — parity 0, `viol` `[]`, 0 clipped,
`[]` / `[]` on the real path, −1.8 % on the bench — and its montage settled the ray question. But it read **pastel
on white**: the interior at f660/f760 came out bright pale gold and pale lavender, f840 a cream-pink wash, and v3's
dark interior and saturated exterior were gone. The orchestrator's ruling on that montage is what the second pass
implements: keep L down where `cMax` is still usable, make both highlights (the boundary flash, the smoulder)
additive so they cannot drag L up, and let the hue carry the picture. The one number in the second pass that is
mine rather than the orchestrator's is dropping pass 1's own `0.58` factor on `lw` back to `1.0`: with the new
`0.55·` cap in front of it the two stacked and f360 came out 2.6× darker than v3 (frame mean 12.4 against 31.9);
at `1.0` it is 18.9 and the cap alone does the work.

### Do the ray colours match between the PiP and the main view?

Yes, and measured rather than eyeballed. At f360 the view parameters are `uView = (0, 0, 1.39618, 1.46128)`,
`uC = (−0.14716, 0.68575)`, the PiP's `uView = (−0.67019, 0.24289, 1.11883, 0)` and `uPal.x = 0.50983` (all read
back with a `gl.uniform4f` recorder wrapped round `scene.overlay`). Re-running the shipped itinerary in python for a
chosen screen pixel gives that pixel's external angle θ; the predicted hue is `θ + uPal.x`; the measured hue is the
pixel of `after2-f360.jpg` converted to OKLCH:

| θ | main view px | measured h | predicted h | PiP px | measured h | predicted h |
|---|---|---|---|---|---|---|
| 0.000 | (734, 300) | 0.519 | 0.510 | (1208, 501) | *0.992* | 0.513 |
| 0.125 | (839, 265) | 0.601 | 0.637 | (1218, 489) | *0.979* | 0.636 |
| 0.250 | (720, 83) | 0.769 | 0.762 | (1134, 513) | 0.851 | 0.761 |
| 0.375 | (748, 41) | 0.872 | 0.885 | (1132, 513) | 0.851 | 0.888 |
| 0.500 | (545, 335) | 0.981 | 0.010 | — | — | — |
| 0.625 | (461, 328) | 0.140 | 0.135 | (1140, 591) | 0.202 | 0.136 |
| 0.750 | (503, 517) | 0.289 | 0.260 | (1182, 607) | 0.226 | 0.259 |
| **0.875** | **(517, 587)** | **0.399** | **0.387** | **(1254, 605)** | **0.393** | **0.386** |

**The named ray: external angle θ = 7/8.** In the main view it is the dynamic ray running down-left out of the
Julia set, hue **0.399 turn (144°, a muted green)**; in the picture-in-picture it is the parameter ray at the same
angle, hue **0.393 turn** — the same green to six thousandths of a turn, and both within 0.013 of the prediction
`7/8 + 0.50983`. Every main-view row agrees to ≤ 0.036 turn, the residual being the composite (tonemap, chromatic
aberration) and JPEG. Two caveats on the PiP column: the italicised rows sit under the pink `uPc` overlay that draws
the path of c, which is added on top of the exterior colour; and the second pass's darker PiP leaves only
C ≈ 0.02 there, so a hue read off an 8-bit pixel is worth about ±0.08 — the θ = 0.25 / 0.375 rows are that noise,
not a disagreement (both landed on the same near-black pixel).

### LOOK still drives the picture

`tools/accept/v0.3/nav-hue-look.jpg`: the shipped f360 shot twice, the second with `LOOK.pal[0]` advanced 0.33 turn
in a wrapper around `scene.draw`. The whole wheel rotates with it — the left sector goes olive-gold → teal, the
right sector teal → rose-violet, the upper-right indigo → amber, and the interior maroon → olive, with every
lightness identical. Hue is additive to the mood in all three branches (`ea + uPal.x`, `uLam.y/TAU + uPal.x`,
`uPal.x + .5`), never a replacement.

## (d) Wrong in the docs

- **`docs/workers/brief-nav-hue.md`**: `feigen/field.js` has no external-angle accumulation to copy (friction 1);
  `C = 0.11` is out of gamut over the interior's own lightness range (friction 2); the promised bright *rim* at the
  root is a per-frame global lightness, not a rim (friction 3); the smoulder-as-an-L-lift loses its DRUM visibility
  (friction 4).
- **`docs/HARNESS.md`** "Bench protocol": item 3 tells you to interleave with NAV, which is not possible when the
  scene under test is NAV (friction 8); and pinning `Q.q` does not pin `Q.iter`/`Q.scale`, which still drift during
  the four calls — the same gap the NAV-SMOULDER worker recorded. No command failed as printed; the continuity
  monitor, `parity.js fake`, `montage.py` and every `cdp.js` form worked exactly as documented.
- **`docs/CONTRACTS.md` §1.14**'s "C 0.11 at L 0.7 is inside sRGB at every hue" is true and useful, but it reads as a
  global constant and the first two scenes to use the chunk have both had to work around it. A sentence giving the
  L-dependence — the min-over-hue max chroma is ≈ 0.17·L up to L 0.78 and ≈ 0.47·(1−L) above it — would have saved
  this worker an experiment.
- `tools/parity.js` writes `tools/accept/v0.3/parity-fake.jpg` as a side effect; a worker told not to touch files
  outside its scene folder produces that file anyway. Harmless, but worth a line in HARNESS.

## (e) `feats` and `post`

Unchanged, as the brief required. `feats` is still the same 27 fields (`interval repeat seed beat beatPhase
beatCount dropEvt dropStrength dropEnv intensity build suspension presence harmUnw arc onset hitStrength hit eS eM
tension resolveEvt bass mid high peaks clarity`) — the new colouring reads `uLam`/`uPar`, which `nav.js` derives from
fields already declared, and `uPal`/`uBands`/`uBeat`, which are HEAD's. `help.feats` covers 27/27. `post` is still
`{ fb: { decay: S => 0.7 + 0.16·eM }, bloom: { thr: 0.35 }, kaleido: 1 }`. The only additions to the scene object are
`hooks.clipdbg` and the sentence in `help.why`.
