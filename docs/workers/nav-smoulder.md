# NAV interior smoulder — worker report (v0.2 §16 ride-along, `docs/workers/brief-nav-smoulder.md`)

Worktree `.claude/worktrees/agent-a07545c578096fe79`, branch `worktree-agent-a07545c578096fe79`, PORT=8781.
Files touched: `assets/scenes/nav/shaders.js` (+4 lines), `assets/scenes/nav/index.js` (+1 uniform upload, `help.why`).
**`assets/scenes/nav/nav.js` untouched** — `git diff` names exactly those two files.

## The term shipped

```glsl
uniform float uPar;                                    // in FS_JULIA's uniform line, before uSc

// conv branch (a known cycle: Koenigs bands + spokes), after col=mix(base,drum,uDrum)+pal(.8)*lt*.15;
col+=pal(.5+.1*bands)*uPar*uPar*(.35+.3*uBands.x)*(.3+.7*bands);

// plain interior else branch
}else{col=pal(.6)*.03+pal(.4)*lt*.25*(.3+uBands.x);col+=pal(.45)*uPar*uPar*(.16+.2*uBands.x);}
```

```js
gl.uniform1f(u('uPar'), N.par);   // index.js draw(), next to uPx
```

`uPar*uPar` makes the term **exactly zero** at `par = 0`, so every frame where NAV is not near a parabolic root is
byte-identical to before the edit (proved by md5 below). The exterior (`esc`) branch is untouched.

`help.why` gained the clause "The interior smoulders as the multiplier nears 1 — critical slowing, the orbit taking
longer and longer to settle." `help.feats` and `feats` unchanged — `par` is derived inside `nav.js` from fields NAV
already reads, so no new `MS` read.

### Deviation from the brief's suggested coefficients (tuned, as the brief asked)

The brief proposed `uPar*uPar*(.15+.35*uBands.x)*(.5+.5*bands)` for `conv` and `uPar*uPar*.12` for `else`. Shot at a
forced `par = 1` those are invisible: `uBands.x` (`MS.bass`) is **0** through the fake timeline's build — exactly the
passage where `par` rises — so a bass-dominant coefficient collapses to 0.15 / 0.12 against an interior base of
0.03–0.13 and the composite's tonemap flattens the rest. Measured mean |Δ| over the whole frame at f720 was 0.23/255,
peak 17/255: not a picture. Retuned to a solid floor with bass as a modulation on top (`.35 + .3·bass`,
`.16 + .2·bass`) and a wider band contrast (`.3 + .7·bands` instead of `.5 + .5·bands`, so the Koenigs rings separate
rather than sitting on a pedestal). Bass gain was then trimmed from the value I photographed (`.45`) to `.3` so a
loud bar cannot push the term past ~0.6 pre-tonemap into the bloom's runaway; that change is strictly darker and
leaves the verified `bass = 0` appearance bit-for-bit as shot.

## (a) Friction log

1. **The brief's acceptance frames do not see the effect.** `par` on the fake timeline at the shot frames is
   f360 `0`, f660 `0.4618`, f720 `0.7772`, f840 `0` — the brief's expectation ("frames 600–780 are the fake
   timeline's build, where NAV parks at a root and `par` rises") holds, but at f660/f720 the Julia set of that `c` is
   thin and dendritic: almost every pixel takes the `esc` branch, so there is nearly no interior to smoulder. The
   frame that actually shows it is **f760** (`par` 0.186 naturally), where the set is fat and the `conv` branch owns
   the middle of the screen. Added f760 to the shot set. Guess made: that "the montage of the `par > 0` frames shows
   the interior glowing" means *any* frame with interior area, not specifically 660/720.
2. **No document says how to see the term at `par ≈ 1`.** `par` never exceeds 0.79 on the fake timeline (max over
   1440 frames, sampled per frame; the only 1.0 is a frame-34 start transient). The brief asks to "tune so that at
   `par ≈ 1` … the interior reads as glowing embers" with no way to reach it. Built one from the harness instead of
   touching `nav.js`: wrap the registered scene's `update` from an `{eval}` step and assign `CARD.home.par` after
   `updateNav` has run —
   `(function(){var S=CARD.REG[0].scene,u=S.update;S.update=function(){u.apply(this,arguments);CARD.home.par=1;};})()`.
   This is safe because every write to `N.par` in `nav.js` is an assignment, never an accumulation, and `N.timeScale`
   is computed from `par` *inside* `updateNav`, before the override — so nothing else in the state moves. **Proved:**
   on the un-edited build, forcing `par = 1` gives a frame byte-identical to the natural one
   (`916539c0…` twice at f760), so every pixel that differs in the A/B is the new term and nothing else.
3. `CARD.home` is the NAV state object (`monitor.js` uses `CARD.NAV||CARD.home`), but neither HARNESS's `window.CARD`
   section nor CONTRACTS says so in words — inferred from `monitor.js`, which the brief lists as a legal read.
4. **`CARD.bench` and the quality knob.** HARNESS says to take three medians of `bench(id, 300)` and discard the cold
   first call, but benching hammers the frame and `Q` adapts *during* the measurement: `q` fell 0.586 → 0.186 and
   `Q.scale` 0.75 → 0.5 across the four calls. A before/after comparison is therefore only meaningful if both runs
   have the same warm-up; with a bare `{"wait":8000}` the two sides started at q 0.286 and 0.156. Used
   `{"wait":15000}` on both sides, which put both at q 0.584/0.586, `iter` 181, `scale` 0.75 at the first call and
   0.184/0.186, 101, 0.5 at the last — matched trajectories. Worth a sentence in HARNESS's bench note.
5. The gate/tooling note in my orchestration prompt suggested `read -t 5 < /dev/zero` as a sleep substitute; it
   returns instantly and the poll loop span a core at 100 %. Not a repo doc, but recording it: `tail -n +2 -f` on a
   sentinel file is the idiom that actually blocks.

## (b) Forbidden files

Not opened. Twice tempted:

- **`assets/scenes/nav/nav.js` beyond the permitted `grep -n "par"`** — to see whether `par` could be made to reach 1
  on the fake timeline, and whether the `sstep(0.9, 0.995, r) * (b.q > 1 ? 1 : 0.4)` factor on the baby path (line
  155) means a baby copy can never smoulder fully. Did not: the grep gave the three assignment sites and their
  line numbers, which is all the colouring needs, and the `par = 1` question was answerable by experiment (friction 2).
  The baby-path 0.4 cap is left as an observation for whoever owns the chart — inside a baby copy the smoulder tops
  out at 0.16 of its full strength, which may or may not be intended.
- **`assets/core/`** — to learn whether `bench` renders at `Q.scale` or full resolution, since the before/after
  medians looked confounded by `q`. Did not: matching the session shape on both sides (friction 4) settles it without
  reading the core.

## (c) Acceptance outputs

**1. Static check** (`node tools/check.js`, with the edit applied):

```
check: 55 modules · uniforms 107 · MS keys 117 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
```

(106 uniforms before the edit, 107 after — `uPar` is fetched, no dead uniform.)

**2. State parity** — `PORT=8781 GPU=1 node tools/parity.js fake`, verbatim:

```
max |diff| over all numeric fields: 0 · fields compared 72
MS/NAV parity: every field identical to 1e-9
```

**3. Continuity monitor**, 60 s on `test&fake=0`, verbatim:

```
EVAL JSON.stringify({n:MON.n,fast:MON.fast,viol:MON.viol,errs:CAR => "{\"n\":3606,\"fast\":104,\"viol\":[],\"errs\":[]}"
```

`viol` `[]`, `ERRS` `[]`. (`fast` 104 is the usual exterior spring motion after drops, HARNESS's `fast = 97` band.)

**4. Deterministic shots** — `CLOCK=1 PORT=8781 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=0' …`,
`CARD.ERRS` `[]`, `CARD.nonFinite()` `[]`, `CARD.REG[0].scene.rt.log` at the end `"EXT h-0.07 lg-4.0 par0.00"`
(identical before and after).

| frame | `CARD.home.par` | before (pristine) | after (shipped term) | |
|---|---|---|---|---|
| f360 | `0` (INT) | `92438f2da223f77c7a001f4cf45bd236` | `92438f2da223f77c7a001f4cf45bd236` | **identical** |
| f660 | `0.4617767174141431` | `f993e2f451e663d94cb509a5ece4cba9` | `eeded31f8ccae68ba7ba1defad70b4ad` | differs |
| f720 | `0.7771599445147408` | `d942fc81353403914a12a716514dd3f2` | `6f08b8053d92ec578d68130b4fe9c112` | differs |
| f760 | `0.18564430167589455` | `916539c0c95950933e223c4ef2c8400a` | `70697cf87bc3ac02af6dcdaae6b1d7cb` | differs |
| f840 | `0` (EXT) | `d697789c4f40f87b6f07e763c25da108` | `d697789c4f40f87b6f07e763c25da108` | **identical** |

Both `par = 0` frames — one interior (f360, mode INT) and one exterior (f840, mode EXT) — are byte-identical across
the edit, which is the no-op claim. The forced-`par` control pair at f760:
baseline with `par` forced to 1 = `916539c0c95950933e223c4ef2c8400a` (equal to the baseline's natural frame, since the
baseline ignores `par` altogether), shipped term with `par` forced to 1 = `b2400364d7078644a84c779258b733b5`.

`par` sampled every frame over the 24 s loop (mode in brackets): 0 through the sustain and valley apart from two
brief brushes past a root (f31 `0.112`, f301 `0.131`, f541 `0.268`), then the build — f661 `0.600`, f691 `0.606`,
f721 `0.788`, f751 `0.287` — then `0` for the whole of EXT (f781–f1231) and HOME (f1261 on). Maximum over the loop
after the start transient: `0.788`.

**5. Real path**, `PORT=8781 NOAUTO=1 GPU=1 node tools/cdp.js 'real' …` 45 s after the click:

```
EVAL JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS}) => "{\"bad\":[],\"errs\":[]}"
```

No `[EXC]` line in the run.

**6. Cost** — `CARD.bench(0,300)`, matched session shape (`test&scene=0`, `{"wait":15000}`, four calls, first
discarded as cold per HARNESS):

| | cold (discarded) | three kept | median |
|---|---|---|---|
| before | 2.239 | 2.411, 2.364, 1.888 | **2.364 ms** |
| after | 2.172 | 2.061, 2.035, 2.106 | **2.061 ms** |

Within noise — the spread inside the "before" triple alone is 0.52 ms and the *after* median is the lower of the two.
Two multiply-adds per interior pixel, and only on the pixels that do not escape. Both runs walked the same `Q`
trajectory (q 0.584/0.586 → 0.184/0.186, `iter` 181 → 101, `scale` 0.75 → 0.5).

### What the shots showed

`tools/accept/v0.2/nav-smoulder.jpg` (also `tools/work/navs-montage.jpg`), 2 columns × 2 rows, before | after:

- **Row 1, f720, `par = 0.777` (natural).** Two near-identical frames: the same dendritic set, the same orange
  Green's-function rays and DE filaments outside, the same PiP. The change is real but small (mean |Δ| 0.23/255,
  peak 17) because at that `c` there is almost no filled interior on screen — this row is the honest "nothing else
  moved" panel.
- **Row 2, f760, `par` forced to 1.** Left, the set is a flat dark-green silhouette inside a teal DE boundary. Right,
  the same silhouette is lit from within: the Koenigs bands and the `ai` spokes come up as visible concentric
  smouldering rings, the interior reads as warm embers rather than a hole, and the boundary filaments, the exterior
  rays, the black background and the picture-in-picture are pixel-for-pixel unchanged. Centre-crop mean goes
  (16.7, 38.1, 31.6) → (32.8, 76.8, 61.2); peak Δ 87/255 in green, so nothing clips to white under the composite's
  `1 − exp(−1.5c)` tonemap — the brightest interior pixel sits around 0.3 of full scale.

## (d) Wrong in the docs

- `docs/HARNESS.md` "Continuity monitor" prints the command without `PORT=`; correct as written, but a parallel worker
  must add it (the brief does). No command failed as printed.
- `docs/HARNESS.md`'s bench note ("run it three times, read the median") does not warn that `Q` adapts during the
  measurement, which makes an unmatched before/after comparison meaningless — see friction 4.
- `docs/CONTRACTS.md` §1.13's help rules and `check.js` behaved exactly as documented (`help.feats` gaps 0 both
  before and after; extending `help.why` needs no `feats` change).
- `docs/DECISIONS.md` §15's polish note ("NAV could take the smoulder term on `N.par`") is now done; §15 says the
  synapse term was `slow = clamp(lastStep·40, 0, 1)` measured *inside the shader* from the last orbit step. NAV's
  `N.par` is the analytic multiplier modulus from the chart instead, i.e. the same quantity taken from the navigator
  rather than re-derived per pixel — worth one line if §15 is ever revised.

## (e) `feats` and `post`

Unchanged, as the brief required: `feats` is still the 27 fields listed in `index.js` (no new `MS` read — `par` is
derived inside `nav.js` from `intensity`/`build`/`suspension`/`beatCount`, all already declared), `help.feats` still
covers 27/27, and `post` is still `{ fb: { decay: S => 0.7 + 0.16·eM }, bloom: { thr: 0.35 }, kaleido: 1 }`. The only
`help` change is the added clause in `why`.
