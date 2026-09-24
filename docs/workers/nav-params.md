# NAV params — worker report (v0.5 item 1, `docs/workers/brief-nav-params.md`)

Worktree `.claude/worktrees/agent-ade31699508f6d445`, branch `worktree-agent-ade31699508f6d445`, **PORT=8794** on every
`tools/cdp.js` run. Five commits, `NAV-PARAMS:`, not merged.

Files touched (only these two, `git diff 2b9fd7e HEAD --stat`):

| file | lines before → after |
|---|---|
| `assets/scenes/nav/index.js` | 204 → 217 |
| `assets/scenes/nav/nav.js` | 285 → 285 |

`shaders.js` / `shaders-v2.js` untouched — no uniform changed name, value or order; only *who computes the number* moved.

## The five parameters

```js
params: {
  trap:  { eli5: 'how wide the ring is that the orbit trap lights up', range: [0.35, 1.25], from: (S) => 0.35 + 0.9 * S.mid },
  zoom:  { eli5: 'how far the view is pulled back from the Julia set', range: [0.5, 2],     from: (S) => (1 - 0.05 * S.bass - 0.07 * S.hit) * (1 + 0.25 * S.dropEnv) },
  dots:  { eli5: 'how big the dots of the critical orbit are',         range: [0, 3],       from: (S) => 1 + S.bass },
  pip:   { eli5: 'how visible the little map of the Mandelbrot set is',range: [0, 1],       from: (S) => sstep(0.05, 0.3, S.presence) },
  reach: { eli5: 'how far outside the set the drop throws the picture',range: [LG_MIN, LG_MAX], from: (S) => clamp(mix(-2.6, -9, clamp(0.55 * S.eS + 0.5 * S.tension, 0, 1)) + 3.2 * S.dropEnv, LG_MIN, LG_MAX) },
}
```

| name | eli5 | range | where it lands | deps (`CARD.paramDeps`) | what the eye sees, lo → hi |
|---|---|---|---|---|---|
| `trap` | how wide the ring is that the orbit trap lights up | [0.35, 1.25] | `draw()` → `uTrapR` | `["mid"]` | the circular trap catches a different shell of the orbit: at 0.35 the rim of the Julia set stays dark blue filigree; at 1.25 the whole boundary picks up a brighter blue halo (the diff is a clean ring hugging the set's outline, peak +92/255, 11 % of pixels moved by more than 8) |
| `zoom` | how far the view is pulled back from the Julia set | [0.5, 2] | `draw()` → `uView.z` (and the orbit points' `uView`) | `["bass","hit","dropEnv"]` | at 0.5 two lobes fill the screen and the green exterior spokes run off every edge; at 2 the whole set sits small and centred in black with a wide dark border (93 % of pixels moved) |
| `dots` | how big the dots of the critical orbit are | [0, 3] | `draw()` → `uSize` of the point program | `["bass"]` | at 0 the critical orbit disappears completely; at 3 three fat white blobs sit in the dark lobes, the innermost one a bright streak (small area, but peak 242/255 where they are) |
| `pip` | how visible the little map of the Mandelbrot set is | [0, 1] | `overlay()` → `PIP.a` (the inset's alpha) | `["presence"]` | at 0 the picture-in-picture is gone and the bottom-right corner is plain Julia set; at 1 the little M with the pink path of `c` sits in its rounded box |
| `reach` | how far outside the set the drop throws the picture | [-11.9, 0.9] (`LG_MIN`/`LG_MAX`) | `nav.js` → the target of the exterior spring `N.lg` | `["eS","tension","dropEnv"]` | **f840 (post-drop, `mode: 'EXT'`)**: at -11.9 `c` hugs the boundary and a huge pale-cyan dendrite fills the frame; at 0.9 `c` is far outside and the screen is almost black with four faint blue sparks of dust. At f360 the pair is byte-identical — NAV is interior at 6 s and this parameter is not read there (see the friction log) |

Registration probe at f360 (`test&scene=0`, `CLOCK=1 GPU=1`), acceptance item 3:

```
EVAL (function(){var sc=CARD.REG[0].scene,P=CARD.paramsOf("nav"),o={};for(var p in sc.params){var r=sc.params[p].range;
     o[p]={v:P[p],range:r,inRange:isFinite(P[p])&&P[p]>=r[0]&&P[p]<=r[1],deps:CARD.paramDeps("nav",p),derived:CARD.derived("nav",p)};}return JSON.stringify(o);})()
=> {"trap":{"v":0.575,"range":[0.35,1.25],"inRange":true,"deps":["mid"],"derived":0.575},
    "zoom":{"v":0.9832244274490757,"range":[0.5,2],"inRange":true,"deps":["bass","hit","dropEnv"],"derived":0.9832244274490757},
    "dots":{"v":1,"range":[0,3],"inRange":true,"deps":["bass"],"derived":1},
    "pip":{"v":1,"range":[0,1],"inRange":true,"deps":["presence"],"derived":1},
    "reach":{"v":-5.280168825299365,"range":[-11.9,0.9],"inRange":true,"deps":["eS","tension","dropEnv"],"derived":-5.280168825299365}}
```

Every value finite, inside its range, and equal to `derived()` — identity by construction, unrouted.

## The proof after every commit

The NAV md5 pair for both colour mappings, run as

```
PORT=8794 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=0' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"<p>-s0-f360"},{"eval":"JSON.stringify({errs:CARD.ERRS,p:CARD.paramsOf(\"nav\")})"},{"until":"window.__FRAME>=840"},{"shot":"<p>-s0-f840"},{"eval":"JSON.stringify({errs:CARD.ERRS,p:CARD.paramsOf(\"nav\")})"}]'
PORT=8794 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=0&colour=oklch' '[… <p>o-s0-f360 / <p>o-s0-f840 …]'
GPU=1 PORT=8794 node tools/parity.js fake
```

| commit | shots | md5 v2 f360 / f840 | md5 oklch f360 / f840 | parity fake | check.js | `CARD.ERRS` |
|---|---|---|---|---|---|---|
| baseline `2b9fd7e` | `base-`/`baseo-s0` | `fb74fee4…` / `7225ea02…` | `9ced2e67…` / `599ad985…` | max diff **0** | 0 fail 0 warn | `[]` |
| `d1b3c18` **trap** | `p1-`/`p1o-s0` | `fb74fee4…` / `7225ea02…` | `9ced2e67…` / `599ad985…` | max diff **0** | 0 fail 0 warn | `[]` |
| `2bc3176` **zoom** | `p2-`/`p2o-s0` | `fb74fee4…` / `7225ea02…` | `9ced2e67…` / `599ad985…` | max diff **0** | 0 fail 0 warn | `[]` |
| `4732aa8` **dots** | `p3-`/`p3o-s0` | `fb74fee4…` / `7225ea02…` | `9ced2e67…` / `599ad985…` | max diff **0** | 0 fail 0 warn | `[]` |
| `ca68e9a` **pip** | `p4-`/`p4o-s0` | `fb74fee4…` / `7225ea02…` | `9ced2e67…` / `599ad985…` | max diff **0** | 0 fail 0 warn | `[]` |
| `5570281` **reach** | `p5-`/`p5o-s0` | `fb74fee4…` / `7225ea02…` | `9ced2e67…` / `599ad985…` | max diff **0** | 0 fail 0 warn | `[]` |

Full hashes, identical at every row and equal to `tools/accept/v0.5/scene-md5-v03.txt` / `…-oklch.txt`:

```
fb74fee47170b2d1f043db9f96319c7e  s0-f360.jpg      9ced2e67a9133790be819f2741bdbee0  s0-f360.jpg (oklch)
7225ea02adab09c37055b85189ac5d49  s0-f840.jpg      599ad98597c55d116a3195c1a17b7517  s0-f840.jpg (oklch)
```

`parity.js fake` line after each commit: `max |diff| over all numeric fields: 0 · fields compared 72` ·
`MS/NAV parity: every field identical to 1e-9`. The 72 fields include `nav.lg`, `nav.c`, `nav.par`, `nav.vtime` — the
`reach` move (the only one that touches the navigator's state) is exact in the state as well as in the pixels.

**DRUM (variant id 4), once at the end** — `tools/accept/v0.5/` has no `s4` lines (`tools/scene-md5.sh` takes its ids
from `^  id: [0-9]*` in each `index.js`, and a variant's id is nested), so the reference is the baseline I shot at
`2b9fd7e` before the first edit:

```
0bff278ab9e8e89e5f1e53b985fbd8f2  s4-f360.jpg        ca053b0fd746ee80913f62bb403d80f4  s4-f360.jpg (oklch)
be2e3c8d6f2484ef55753e4d5213ef97  s4-f840.jpg        c4e54245fffc38797a95d3abfdd0397b  s4-f840.jpg (oklch)
```
`p5x-`/`p5xo-s4-f360/f840` at HEAD: all four identical. (`base-`/`baseo-s4` are the baseline shots, kept in `tools/work/`.)

## Route proofs (acceptance item 4)

`PORT=8794 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=0&param=<spec>' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"<name>"},{"eval":"JSON.stringify({errs:CARD.ERRS,n:CARD.PROUTE.n,p:CARD.paramsOf(\"nav\")})"},{"until":"window.__FRAME>=840"},{"shot":"<name>-f840"},{"eval":"JSON.stringify({p:CARD.paramsOf(\"nav\"),mode:CARD.home.mode})"}]'`

`errs []` and `n 1` on every run below; the routed value came back exactly as asked (`trap 0.35` / `1.25`, `zoom 0.5` /
`2`, `dots 0` / `3`, `pip 0` / `1`, `reach -11.9` / `0.9`) and every other parameter stayed at its derived value.

| param | lo spec | hi spec | music spec | f360 md5 lo / hi | mean abs pixel diff lo↔hi |
|---|---|---|---|---|---|
| trap | `nav.trap=c:0.35` | `nav.trap=c:1.25` | `nav.trap=centroid*1.5` → 0.96425 | `88128e4a…` / `342e7668…` | 1.74 (a ring on the set's rim; 11.2 % of pixels > 8) |
| zoom | `nav.zoom=c:0.5` | `nav.zoom=c:2` | `nav.zoom=centroid*1.5` → 1.52375 | `26148d8f…` / `547d56c0…` | 42.1 (92.8 % of pixels > 8) |
| dots | `nav.dots=c:0` | `nav.dots=c:3` | `nav.dots=centroid*1.5` → 2.0475 | `6a71b61c…` / `5131c73b…` | 0.82 (1.8 % > 8, peak 242) |
| pip | `nav.pip=c:0` | `nav.pip=c:1` | `nav.pip=centroid*1.5` → 0.6825 | `8a69baf3…` / `fb74fee4…` | 1.68 (2.6 % > 8 — the inset is 3 % of the frame) |
| reach | `nav.reach=c:-11.9` | `nav.reach=c:0.9` | `nav.reach=centroid*1.5` → -3.164 | f360 both `fb74fee4…` (see below); **f840** `d88f9820…` / `393ccf2f…` | f840 37.2 (53.0 % > 8) |

Two entries worth naming:

* `np-pip-hi` at f360 is `fb74fee47170b2d1f043db9f96319c7e` — **exactly the reference frame**: `pip`'s derived value at
  that frame is already 1, so a constant route at the derived value is a byte-identical picture. That is the case
  HARNESS's Params section predicts ("a constant route at the derived value on the defaults does not have to move it").
* `reach` at **f360** is identical in all three runs (`fb74fee4…`, the reference): at 6 s NAV is in `INT` and the
  exterior spring's target is not read, so no route on it can move that frame. Its pair is taken at **f840**
  (`mode: "EXT"` in the same run's eval), where it is the biggest visual change of the five.

### Continuity monitor (`tools/monitor.js`, 60 s, `test&fake=0`)

| run | n | fast | viol |
|---|---|---|---|
| no route (this build) | 3393 | 103 | `[]` |
| `&param=nav.trap=kick` | 3595 | 49 | `[]` |
| `&param=nav.reach=kick` | 3571 | 68 | **7 violations**, all `EXT` |
| `&param=nav.reach=kick~0.6` | 3545 | 63 | **10 violations** (9 `EXT`, 1 `HOME`) |
| `&param=nav.reach=centroid` | 3346 | 45 | **2 violations** (`EXT`, `HOME`) |

Example violation row: `[5343, 0.091, 0.032, "EXT", false]` — `d = 0.091` against a previous-frame motion of `0.032`.

**Which parameter breaks the invariant, and why.** Only `reach`. The other four are render-side (`uTrapR`, `uView.z`,
`uSize`, the inset's alpha) and cannot reach `NAV.cPath` at all — `nav.trap=kick` is the control and it is clean.
`reach` is the target of the exterior spring `N.lg` (log₂ of the potential), and `cPath = extC(θ, log₂G)` is
*exponential* in it: near the set a swing of one unit of `lg` is a small step in `c`, far out it is a large one, and the
spring's rate (3 /s) is tuned for a target that moves with `eS`/`tension`/`dropEnv` — i.e. slowly. A `kick` impulse
snaps the target across a good part of an 12.8-unit range every kick, so `c` crosses more than 0.06 in a frame outside
any declared cut. An ema does not rescue it (`~0.6` is worse: it keeps the target inside the fast band for longer
instead of stepping once), and even a plain level (`centroid`) trips it twice a minute.

This looks like the honest answer for this parameter rather than a bug: NAV's `cuts: 'event'` promise is about the
*music's* discontinuities, and `reach` is the one parameter whose value is the navigator's own state target. If the
panel ever wants a safe default it should offer a narrower range around the derived value (say `[-9, -2.6]`, the span
`from()` itself uses before `dropEnv`) rather than the full `LG_MIN…LG_MAX`; I kept the full range because that is
what the expression clamps to, and clamping to something narrower would have made the move non-identical.

## Acceptance

| # | item | result |
|---|---|---|
| 1 | `node tools/check.js` → 0 fail, 0 new warn | **pass** — `check: 65 modules · uniforms 109 · MS keys 118 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn`, after every edit |
| 2 | four NAV md5s = reference, parity 0 diff, `CARD.ERRS []` after every commit; `s4` at the end | **pass** — table above; `s4` identical in both mappings against the pre-edit baseline (no `s4` line exists in `tools/accept/v0.5/`) |
| 3 | `CARD.paramsOf('nav')` finite and in range at f360; `paramDeps` as expected | **pass** — eval above, all five `inRange: true`, deps `mid` / `bass,hit,dropEnv` / `bass` / `presence` / `eS,tension,dropEnv` |
| 4 | route shots per parameter + a sentence each; the monitor line | **pass with one named exception** — every pair differs (`reach` at f840, not f360); the monitor is `viol []` unrouted and with `nav.trap=kick`, and **not** `[]` with `nav.reach=kick` (explained above) |
| 5 | bundle + real start path | **pass** — `bundled 65 modules → dist/eigenwobble.html (473 KB)`; `EVAL … => {"errs":[],"n":0,"p":{"trap":1.1722273864629837,"zoom":1.1204406122556396,"dots":1.9252914403825574,"pip":1,"reach":-1.2679017585271293}}`, 0 `[EXC]` |
| 6 | `param-smoke` / `route-smoke` unchanged | **pass** — `param-smoke: 49 checks, 0 fail` · `route smoke: 68 checks · 0 fail` |

## Shots (all in `tools/work/`, prefix `np-`; the md5 sweeps use `base/baseo/p1…p5/p5x`)

* per-commit sweeps: `base-s0-f360/f840`, `baseo-s0-…`, `base-s4-…`, `baseo-s4-…`, `p1-`/`p1o-`, `p2-`/`p2o-`, `p3-`/`p3o-`, `p4-`/`p4o-`, `p5-`/`p5o-s0-f360/f840`, `p5x-`/`p5xo-s4-f360/f840`
* route proofs (each also has a `-f840` twin from the same run): `np-trap-lo`, `np-trap-hi`, `np-trap-mus`,
  `np-zoom-lo`, `np-zoom-hi`, `np-zoom-mus`, `np-dots-lo`, `np-dots-hi`, `np-dots-mus`, `np-pip-lo`, `np-pip-hi`,
  `np-pip-mus`, `np-reach-lo`, `np-reach-hi`, `np-reach-mus`
* **for the orchestrator's eyes** (montages, lo left / hi right): `np-m-trap.jpg`, `np-m-trap-crop.jpg` (2.5×
  crop of the corner with the largest change), `np-m-trap-diff.jpg` (|Δ|×6 and a signed red/blue map — the ring on the
  set's rim), `np-m-zoom.jpg`, `np-m-dots.jpg`, `np-m-pip.jpg`, `np-m-reach.jpg` (f840)

## (a) Friction log

1. **`spin` was built, proved a no-op, and then thrown away — an angle parameter cannot honour §1.16's range.** The
   obvious fifth knob on this screen is the orbit trap's *line*: `ta = Math.PI * (S.beatCount + 1 - (1 - S.beatPhase)³)`,
   moved verbatim, md5-identical on all four frames and parity 0 (commit made, then `git reset --hard` — it is not in
   the history). It fails acceptance item 3 by construction: the value is an **unwrapped** angle that grows with
   `beatCount` (40.16 rad at f360, 91.11 at f840), so no finite `range` contains it. Nothing in CONTRACTS §1.16 or
   HARNESS says what a parameter that is an angle should declare — the contract has a `kind` notion for *fields*
   (`level` / `raw` / `angle` / `event`, §1.15) but a parameter has only `[lo, hi]`. The two escapes both cost
   something: wrapping mod π inside `from()` is picture-identical (the shader only ever uses `abs(dot(z, uTrapN))`, so
   `n` and `−n` are one picture) but is no longer "the expression the code computes today, moved"; and a bounded
   sub-expression (`1 - (1 - beatPhase)³`, range [0, 1]) is a lie at the ends, because `ta` and `ta + π` are the same
   picture, so `c:0` and `c:1` shoot an *identical* pair. **Suggestion for the core:** let a parameter declare
   `wrap: Math.PI` (or a `kind: 'angle'`), which the panel would use for the route's scaling and `check.js` for the
   range warning. Until then NAV ships five bounded parameters and the trap's rotation stays inline.
2. **Nothing says what a parameter whose feature is unread in the current mode should do.** `reach` is only read in
   `mode === 'EXT'`; at f360 a route on it changes nothing at all. The brief's D asks for the pair "at f360"; I shot
   both f360 and f840 in one run for every parameter and use f840 for `reach`. A sentence in §1.16 like "a parameter a
   scene reads only in some of its states is legal; name the state in the eli5" would have saved the guess.
3. **`CARD.derived` / `CARD.paramDeps` take the scene *name*, not the scene object.** `CARD.paramDeps(CARD.REG[0].scene, 'trap')`
   throws `Error: no scene [object Object]` and kills the whole eval. HARNESS's Params section writes them as
   `paramDeps(name, p)` / `derived(name, p)`, which is right, but `core/params.js`'s own `paramDeps` is
   `(scene, p) => (DEPS[scene.name] || …)` — i.e. the module takes the object and `CARD` takes the name. Worth one
   sentence in HARNESS ("`CARD`'s take the name; the module's take the object").
4. **`tools/scene-md5.sh` cannot see a variant.** It greps `^  id: [0-9]*` out of each `index.js`, so `s4` (DRUM, a
   `variants[]` entry) is in neither reference list, and "the `s4` lines" the brief asks for have nothing to equal. I
   shot my own baseline at `2b9fd7e` first and compared against that. If `s4` is meant to be part of the sweep, the
   script needs the variant ids too (they are in `CARD.REG`).
5. **Guess: `env.params` is non-null for an `always: true` scene on its very first update.** `loop.js` is not on the
   "may read" list, so I did not confirm that `refreshParams` runs before NAV's update on the frame NAV is not yet the
   logical scene; I relied on `P.trap` being read unconditionally in `draw()` — a null would have thrown into
   `CARD.ERRS` / `[EXC]` on every run, and no run ever did (including the `real` start path and 60 s of `fake=0`).
6. **Guess: the "at least two parameters on the draw side" and "three to five" caps.** Shipped four on the draw/overlay
   side (`trap`, `zoom`, `dots` in `draw()`, `pip` in `overlay()`) and one in `nav.js` (`reach`), which is the brief's
   hint about `updateNav` being "where most of the music reaches the picture". No constant (`from: () => …`) is shipped:
   the brief prefers parameters the music already moves, and the five slots were all taken by real derivations. The
   obvious constant candidates if a sixth slot ever opens are the PiP's size fraction (`0.24`) and the trail's
   `fb.decay` floor — the latter cannot become a parameter today, see 7.
7. **`post` cannot reach `env.params`.** `post: { fb: { decay: (S) => 0.7 + 0.16 * S.eM } }` is the most visible
   "knob" NAV has (trail length) and the user would expect it in the same table, but §1.15 resolves a nested post
   function against the *view*, not against the parameter values, so moving it would have changed behaviour rather than
   moved it. Left inline. If the panel's parameter table is meant to be the whole answer to "how do I map music to
   visuals", `postOf` eventually wants a `(S, P)` signature.
8. **Floating point: one reassociation was needed and it was free.** `zoom` merges two of the four factors of `draw()`'s
   `scale`, so the product becomes `A * (B * C) * D` where it was `((A * B) * C) * D`. §1.16 warns that this is not
   guaranteed identical. It is identical here on both mappings at both frames, and f840 exercises it with
   `dropEnv > 0` (`zoom = 1.0959979229929266`, so the `C` factor is not exactly 1 — the f360 case would have been
   vacuous, since `C = 1` exactly there). Everything else moves a whole expression or a whole factor and cannot
   reassociate.
9. **`LG_MAX` moved module.** After `reach`, `nav.js` no longer uses `LG_MAX` (it is the parameter's range in
   `index.js`), so it left `nav.js`'s import line. `check.js` does not flag unused imports either way.

## (b) Was I tempted to open a forbidden file?

Twice, and I did not:

* `assets/core/loop.js` — to see where `refreshParams` is called relative to an `always: true` scene's `update()`
  (friction 5). Resolved by evidence instead: `CARD.paramsOf('nav')` is populated at f360 and f840 on every run, `errs`
  is always `[]`, and `draw()` dereferences `this._P` unconditionally.
* `assets/core/route.js` — for the `c:` grammar with a negative constant (`nav.reach=c:-11.9`). `core/params.js` (a
  legal read) documents the grammar in its header and `tools/param-smoke.js` shows `c:2.2`; I guessed the minus sign
  works and the run confirmed it (`"reach":-11.9`).

## (c) Anything wrong in the docs?

* HARNESS "Params" prints `CARD.paramDeps(name, p)` and `derived(name, p)` — correct for `CARD`, but the module's own
  exports of those names take the scene *object* (friction 3). Not wrong, just silently two different signatures.
* HARNESS "Params" says "a scene's move of a constant into params is a no-op per move: the same diff after each commit
  of the scene's worker" — the command it prints for the identity proof is `tools/scene-md5.sh after`, which re-shoots
  *every* scene (six runs) and cannot see `s4`. For a single-scene worker the two-run form in this brief is the right
  one; worth putting beside it.
* Everything else in the brief ran exactly as printed, including the `&param=` hash form and `CARD.PROUTE.n`.
