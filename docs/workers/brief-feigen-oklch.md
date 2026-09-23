# FEIGEN OKLCH colour-pass worker brief (v0.3 item 2, `feigen-oklch`) — read docs/workers/brief-common.md first (the
# "may read" rules and the report format apply)

Target: `assets/scenes/feigen/colour.js` (the colour pass, `FS_COLOUR`) and, only for a uniform you add or drop,
`assets/scenes/feigen/index.js`'s `draw()` uploads + `help`. **`field.js`, `ladder.js` and everything in `index.js`
that is not a colour uniform or help text are not to be touched** — the field (what each texel holds), the rungs, the
camera, the events are §16's and are the "nothing underneath changed" proof. PORT=8782. Own worktree; commit messages
start `FEIGEN-OKLCH:`. **One Chrome at a time from you; never a Q trace (the orchestrator runs it after the merge).**

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/CONTRACTS.md` (§0, §1.1, §1.2, **§1.14 — the OKLCH
chunk**, §1.10, §1.13), `docs/HARNESS.md` ("Static checks", "Headless Chrome", "Engine textures" — the `scene-md5.sh`
and `&histfull=1` lines —, "Bench protocol", "OKLab"), `docs/DECISIONS.md` §16 (the field/colour split: what
`dec()` returns and why the decode happens before the blend) and §17 "Added after the tag", `assets/scenes/feigen/*`,
`assets/core/oklch.js` (the chunk you prepend — read, never edit), `assets/math/oklab.js` (its JS twin, for a
CPU-side check if you want one), `tools/check.js`, `tools/oklch-smoke.js` (how the chunk is driven and read back).
Not `core/` beyond `oklch.js`, not `engine/`, not other scenes.

**Why.** The field already decodes every texel to `(log d, log₂G, ea, trap)` — the distance estimate to M, the
Green's potential, the external angle and the interior orbit trap (`dec()` in `colour.js`, §16). Today those three
exterior quantities are pushed through a cosine palette in gamma sRGB (`palM`) with the §15 gains: the picture is a
filament at `d → 0` plus drifting Green's bands. The mathematics has a native colour space: **lightness from the
potential, hue from the external angle, chroma from the distance**. External rays are then iso-hue lines (a wake, a
Misiurewicz point, a bulb's root read off the picture as where the hues pinch), the potential's level sets are
iso-lightness, and the distance estimate keeps the boundary crisp at any depth because chroma — not lightness —
carries it. OKLCH is what makes "hue" and "lightness" mean what they say (a cosine palette's hue changes its
lightness by 2× around the wheel); `ctx.oklch` (CONTRACTS §1.14) gives you `palOK(h, L, C)` → linear sRGB, gamut-
clipped by chroma reduction, and `linToSrgb` to encode (the chain still expects encoded values today — write
`linToSrgb(col)` exactly where `col` was written before; a later core phase moves the chain to linear light).

**The mapping (exterior, `esc > 0.5`).** With `d = exp(v.x)` (distance in units of the view width), `lG = v.y`
(log₂ of the Green's potential — ≤ 0 near the set and falling with depth, so a deep view spans tens of units),
`ea = v.z` (a turn, 0..1):
- **H ← ea + uHue** (the mood hue rotates the whole wheel; a drop's `uInvert` may flip it by half a turn — say what
  you did). Hue must be *continuous across the rung blend*: `v.z` is already blended as a unit vector — keep it so.
- **L ← f(lG)**: bright near the set, darker outward, and *compressed before mapping* so depth > 50 (a deep visit,
  `&feig=3.6`) does not saturate to black or white — e.g. `L = 0.72 − 0.5·tanh(sqrt(max(−lG, 0)) / k)` or a `log1p`;
  choose `k` on the montage (the fake dive at f360 → f840 and `&feig=3.6`). Interior: `L` from the trap `v.w` as
  today's brightness term, low chroma, hue = `uHue + 0.5`.
- **C ← DE / pixel**: `px = uWidth / uRes.y` is one pixel in parameter units, so `d · uRes.y` is the distance in
  pixels; chroma `C = 0.11 · smoothstep(0.35, 2.5, d · uRes.y)` — below about half a pixel of distance the colour
  goes achromatic *and* lightness goes to 0 (`L *= smoothstep(0., 0.5, d·uRes.y)`), which is the crisp black boundary
  at every depth (the field's own DE, not a filter). `C ≤ 0.11` at `L ≈ 0.7` is in gamut at every hue (the smoke
  test proves it: min max-chroma 0.119 at hue 200°) — above that the chunk clips toward grey, never a channel clamp.
- **The music stays where it was:** `uLevel`, `uKick`, `uDrop` scale `L` (not the encoded colour — a kick lifts
  lightness by ≤ 0.15, a drop by ≤ 0.25, so nothing clips), the Green's-band term modulates `L` along `lG` on `uFlow`
  as today (band amplitude on `sp²` and `uHat`), the spectrogram term (`histM`) modulates chroma or lightness at
  `ea·2` — keep both `specM` and `histM` reads so the `&histfull=1` equality still means something; `uAlive`
  multiplies the encoded result as today; `uTension` on the interior as today.

**Acceptance (repo root, all must pass):**
1. `node tools/check.js` → 0 fail, 0 warn on your files (every uniform you declare is fetched; a dropped uniform is
   removed from `draw()` too).
2. **Only the colour pass changed:** `git diff --stat` shows `colour.js` (+ `index.js` for uniforms/help only); `md5sum
   assets/scenes/feigen/field.js assets/scenes/feigen/ladder.js` unchanged from `master`.
3. **Field proof:** `PORT=8782 tools/scene-md5.sh oklch` and `PORT=8782 tools/scene-md5.sh oklch-h '&histfull=1'` →
   FEIGEN's f360/f840 md5s equal between the two runs (rows == full), every other scene's md5 identical to `master`'s
   (shoot `master` first in the main checkout? No — you have no other checkout: the orchestrator diffs your list
   against the tag's; just report yours).
4. **Gamut:** on the fake dive, shoot `CLOCK=1 … 'test&scene=6&feig=3.6'` at f360 and f840 with an extra eval that
   counts clipped pixels — add a `#test`-only path: when `hooks.clipdbg` is 1, write `okClip(h, L, C)` into `o.r` and
   1 into `o.gb`, and count pixels with `r < 255` in a readback (`ctx.mkTarget(w, h, true)` + `readPixels`): must be
   **0** on both frames and on `&feig=1.2`. Remove nothing: the hook stays (it is how the orchestrator re-checks).
5. **Banding:** along one Green's equipotential (a row of pixels at fixed `lG`, i.e. a horizontal line at the fake
   f360 view) count distinct 8-bit triplets before (`master` shot) and after: after ≥ before, and report both.
6. **Seam and cost:** `PORT=8782 GPU=1 tools/feigen-bench.sh oklch 1.2 3.6` (writes `feigen-bench-oklch.txt`): the
   seam ratio at `RUNG@` frames within 10 % of `tools/accept/v0.2/feigen-bench-accept.txt`'s (the blend is the field's, not yours),
   and `bench(6,300)` / `bench(0,300)` interleaved medians — the ratio to NAV within 5 % of that file's (the
   decode already existed; `palOK` is three cubes and two matrices per pixel, no `pow` on the hot path).
7. **Montage:** `master` vs yours at f360, f840, `&feig=3.6` f360, and `test&fake=0&demo=house&scene=6` at 30 s
   (`python3 tools/montage.py tools/work/feigen-oklch-ab.jpg 2 …`). Read it. Say what the hues show — which wakes
   pinch, whether the black boundary holds at 3.6 — and whether the music still reads (kick lift, drop).
8. `help` (three depths, `help.feats` unchanged unless you add a read): the `why` gains the sentence "hue is the
   external angle, lightness the Green's potential, chroma the distance estimate — the three coordinates the field
   already carries".
9. Real path 45 s: `PORT=8782 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'` → `[]`, `[]`, 0 `[EXC]`.

**Report** (`docs/workers/feigen-oklch.md`): brief-common (a)–(e), the exact `L`/`C` formulas shipped with the
constants and why, the md5 lists (yours, both runs), the clipped counts, the banding counts, the bench pairs and the
seam ratios with the accept file's beside them, what the montage showed, the new FEIGEN reference md5s (f360/f840,
plain and `&histfull=1`) for the orchestrator to re-base. Leave the worktree committed; do not merge.
