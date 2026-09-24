# Panel worker report 3 (v0.5 `params`) — the parameters table: music into what the eye sees

Targets delivered: a new leaf **`assets/core/panel-params.js` (125 lines)**, **`assets/core/panel-ui.js` 89 → 122**
(the preview engine, generalised out of panel.js), **`assets/core/panel.js` 347 → 328** (three lines added, twenty-two
removed) and **7 new lines in the `#help` style block of `index.html`** (119 → 126). Nothing else was touched:
`params.js`, `route.js`, `help.js`, `scenes.js`, `manual.js`, `check.js`, `feats.js` and the scenes are as I found them.
Three `PANEL3:` commits on `worktree-agent-a62b35327a17cfd8d`, on top of `ed55aea`. Not merged.

The user's sentence, in the panel, in a real window (`p3-real-1.jpg`): **`how thick the glowing filaments are ·
thick [0, 1] · centroid · level · ×1 +0 τ0 · reset lo hi · 0.331 → 0.455`** — the row is lit as routed, the left meter
keeps showing what FEIGEN's own `from(MS) = MS.bass` would give (0.331) and the right what `update()` actually
received (0.455, the centroid through the transfer into `[0, 1]`).

---

## (a) What I built

**A — the parameters table.** One per scene with `hasParams(sc)`, above the jacks, under a heading line reading
*"what the eye sees on this scene, and what feeds it — the second level; the inputs behind these are below"*.
Columns, in the brief's order: **what it moves** (the `eli5`, `hd here` — bright, first, `min-width:20em`) ·
**parameter** (the name in `.hk`, `[lo, hi]` under it in `.pkind`) · **source** · **transfer** · **reset + lo/hi** ·
**`derived → in force`**. The source `<select>`'s first option (value `''`) is the sentence the user reads first:
`derived: tension, dropEnv, kick` from `paramDeps(sc, p)`, or `derived: constant` when `from()` read nothing
(FEIGEN's `roll`, `from: () => 0.04`); then every `paramSources()` entry labelled `<name> · <FEATS[name].kind>`
(`centroid · level`, `onset · event`, `bpm · raw`), with `const` last and unlabelled (it has no `FEATS` entry).

The transfer cell is `panel-ui.js`'s `transferCell` — the same widget the jacks use, so `c` is shown exactly when the
source is `const`, as there. On top of that rule: a constant **hides `k`, `b` and `invert`** (§1.16: a constant takes
no transfer) and keeps `τ`, and the `c` input carries `min`/`max` = the range with `step = (hi − lo)/100` to one
significant figure (`width [0.4, 1.8]` → `min 0.4 max 1.8 step 0.01`). See friction 1 for the one sentence of the
brief I had to interpret here.

The meter is the jacks' two-segment `meterCell` with a bar on both sides: left `derived(sc, p)` — always live, so a
routed row still says what the music *would* do — right `paramsOf(sc)[p]`, what `update()` received last; both bars
`(v − lo)/(hi − lo)` clamped, both numbers the value itself. A routed row gets `prouted`. While a row is unrouted the
two numbers are equal on every tick, which is the identity of §1.16 shown rather than claimed (`p3-panel-s6-f120.jpg`:
`1.027 → 1.027`, `1.339 → 1.339`, `0.040 → 0.040`, `0.726 → 0.726`, `0.462 → 0.462`).

**B — the jacks fold.** For a scene with params the jacks table, its one-sentence explanation above it and its
"not routable" note below travel together into `details#pe-pdet-<scene>`, `summary` = *"the inputs behind these — 16
jacks"*, **closed at build**. A scene without params gets no `details` at all and keeps the v0.4.1 block byte for byte
(id 1, DUST: `pdet false · tables 1 · details 0 · missing src ids []`, 15 rows, first child after the `h3` still the
v0.4.1 sentence).

**C — set / read back / store.** Every control calls `setParam(name, p, spec | null)`, puts an error in the row's
`.herr`, re-reads `PROUTES` into the controls (`syncRow` never trusts an input) and calls the panel's `save()` —
handed to me as a callback by `buildP(sc, box, save)`, because a leaf may not import `panel.js`. "reset scene" →
`resetP(sc.name)`, "reset everything" → `resetP()`, "copy to all scenes" → `copyP(sc, SCENES)`, which copies a param
route only to a scene declaring a parameter of the same name (`try/catch` per target) and adds its count to the
message the button already prints. The preset block rides along in `routesJSON()` untouched: the stored string after
one param route is `{"routes":{},"params":{"feigen":{"glow":{…,"tau":0.2}}},"manual":{…}}`.

**D — the tick.** `refreshP(frameN, hot)`, one call from `refreshE`, before its `syncJSON()` so that a parameter
preview ending on this tick refreshes the textarea on the same tick. Meters, the preview countdown, and for a param
routed from an **event** the left segment lights from `hot[src]` for 30 frames (`.pptab .hv.lit{color:#ff8}`).

**The previews, generalised rather than copied.** The brief asked for the v0.4.1 mechanism "by generalising it (a row
object with `set`/`get` closures) rather than copying it", so `preview` / `endPreview` / `msgFor` / `able` / `PREV` /
`nPrev` left `panel.js` and became `startPreview` / `endPreview` / `tickPreview` / `endPreviews` / `nPreviews()` in
`panel-ui.js`, over a row protocol both tables implement: `{ tr, msg, err, ctl: [inputs to grey out], get() → the spec
in force, set(spec), done() }`. `panel-ui.js` still imports nothing and still knows no scene, no field and no route —
it never calls `setRoute` or `setParam`, only `R.set`. Consequences, all of them wanted: one shared `RUN` list, so
`nPreviews()` covers both tables (a parameter preview also keeps the preset textarea off the constant) and `closeE()`
is now `endPreviews()` — one line that ends a jack's preview and a parameter's alike. `buildE`'s `nPrev = 0` became
`resetRows()`. **panel.js's three added lines are exactly the ones the brief names**: the import, `buildP(sc, box,
save)` at the end of `block()`, `refreshP(frameN, hot)` on the tick. `resetP` / `copyP` ride on lines that already
existed (`(n += copyP(sc, SCENES))` inside the message that was already being built).

I re-ran the v0.4.1 preview / fire / closeE acceptance against the generalised engine — see (c) 11: identical.

**New element ids** (`<scene>` = the scene's name, `<param>` = the parameter's):
`pe-psrc-<scene>-<param>` · `pe-pc-…` · `pe-pk-…` · `pe-pb-…` · `pe-ptau-…` · `pe-pinv-…` · `pe-prst-…` ·
`pe-plo-…` · `pe-phi-…` · `pe-pdet-<scene>`.
**New classes:** `.pptab` (the parameters table) and `.hv.lit` (an event source's left segment).
**Kept, every one:** `pe-src/c/k/b/tau/inv/r/p0/p1/fire-<scene>-<field>`, `pe-force`, `pe-release`, `pe-force-line`,
`pe-on-<scene>`, `pe-scene`, `pe-trans`, `pe-col-`, `pe-post-/postx-/postc-<scene>-<path>`, `pe-blk-`, `pe-blocks`,
`pe-copy-`, `pe-rst-`, `pe-resetall`, `pe-json`, `pe-load`, `pe-copybtn`, `pe-err`, `pe-store`.

---

## (b) Was I tempted to open a forbidden file?

Twice, both resolved without opening one.

1. **`harness.js`**, to see whether `CARD.derived` takes a scene name or a scene object — `params.js`'s own
   `derived(scene, p)` does `needP(scene, p)`, which needs the object, while HARNESS.md documents `derived(name, p)`.
   I guessed that the harness wraps it (as it does `CARD.view(name)`, the v0.4.1 worker's find), passed the object
   from inside the panel, and tested the name from `CARD` in acceptance 4: both work, and they agree to the digit
   (`DOM left 1.038 · CARD derived 1.038`).
2. **`scenes.js`**, for the scene list `copyP` needs. Not opened: `panel.js` already has `SCENES` and hands it over as
   an argument, which is also the only shape that keeps `panel-params.js` a leaf.

## (c) The acceptance, line by line (`PORT=8795` on every run; shots in `tools/work/`, prefixed `p3-`)

### 1. `node tools/check.js` — PASS
```
warn assets/scenes/feigen/index.js has 351 lines (soft cap 350)      <- pre-existing, the brief allows it
check: 66 modules · uniforms 110 · MS keys 118 · scenes 6 (help.feats gaps 0) · 0 fail · 1 warn
```
`panel-params.js` 125 ≤ 350, `panel.js` 328 ≤ 350, no MS field and no scene name as a literal in either (check.js
already had `assets/core/panel-params.js` in its `VIEWS` list and in the per-scene-name loop — it caught nothing).

### 2. Help coverage unchanged — PASS
`accept.sh` line 65 extracted with `sed -n '65p'` and run verbatim under `OUT=tools/work PORT=8795`:
```
help fields 107/107 (unique 107) · top table = feats on 7/7 ids
```

### 3. Identity with the panel open — PASS, both md5s exact
```
PORT=8795 CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"key":"p"},{"until":"window.__FRAME>=300"},
  {"key":"Escape"},{"until":"window.__FRAME>=360"},{"shot":"work/p3-id-s6-f360"},{"eval":"JSON.stringify({pn:CARD.PROUTE.n,rn:CARD.ROUTE.n,errs:CARD.ERRS,ticks:CARD.HELP.ticks,on:CARD.HELP.on})"}]'
EVAL => "{\"pn\":0,\"rn\":0,\"errs\":[],\"ticks\":50,\"on\":false}"
md5  8d6ac4a6234d1bbaaaac2bca65d8439d  tools/work/p3-id-s6-f360.jpg   == tools/accept/v0.5/scene-md5-v03.txt s6-f360.jpg
… the same on 'test&scene=0':
EVAL => "{\"pn\":0,\"rn\":0,\"errs\":[],\"ticks\":50,\"on\":false}"
md5  fb74fee47170b2d1f043db9f96319c7e  tools/work/p3-id-s0-f360.jpg   == …s0-f360.jpg
```
Building five parameter rows, five selects, a `<details>` and moving the jacks table into it costs the picture nothing.

### 4. Set through the panel, by eval — PASS
`CLOCK=1 GPU=1 'test&scene=6'`, key `p`, at f120 `P = Object.keys(CARD.REG[6].scene.params)[0]` = **`width`**:
```
f120  EVAL (set pe-psrc-feigen-width = centroid, dispatch change; pe-pk-feigen-width = 1.5, dispatch change)
      => "P=width select=centroid k=1.5"
f126  EVAL JSON.stringify(CARD.PROUTES.feigen) => {"width":{"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0}}
f126  EVAL => "row class [prouted] · DOM left 1.038 right 1.355 · CARD derived 1.038 paramsOf 1.355
               · raw derived 1.037502052358672 raw paramsOf 1.3554999999999997 · bars scaleX(0.455) scaleX(0.682)"
      shot work/p3-set-s6-f126
f126  EVAL click pe-prst-feigen-width
f132  EVAL => "PROUTE.n 0 · PROUTES {} · row [] select [] · meters 1.043 = 1.043 · equal true · ls null"
      EVAL => {"errs":[],"bad":[]}                                   EXC lines: 0
```
All four numbers printed: the DOM's two are `nums()` of the CARD's two, and the bars are `(1.038 − 0.4)/1.4 = 0.455`
and `(1.355 − 0.4)/1.4 = 0.682`. *`p3-set-s6-f126.jpg`* — FEIGEN's block with `width` lit as routed, its source reading
`centroid · level`, `×1.5`, its `c` box gone, and its meter `1.038 ⟶ 1.355` with the right bar half again as long as
the left; the four unrouted rows below it read `derived: …` and equal numbers on both sides.

### 5. Preview — PASS
```
f130  EVAL click pe-phi-feigen-width (range 0.4,1.8) · ls null
f136  EVAL => {"src":"const","c":1.8,"k":1,"b":0,"inv":false,"tau":0} · want c 1.8
             · row [ppreview] msg [preview: constant 1.8 · 2 s left] select disabled true c disabled true
             · in force 1.8 · ls null · textarea {"routes":{},"params":{},"manual":{"scene":6,…     <- the constant never reaches the preset
      shot work/p3-prev-s6-f136
f300  EVAL => "f300 PROUTES {} · PROUTE.n 0 · row [] msg [] select disabled false · ls null"        <- null went back as null: no entry
f300  EVAL click pe-plo-feigen-width => {"width":{"src":"const","c":0.4,…}}
f310  {"key":"Escape"}
f316  EVAL => "after Escape mid-preview: help on false · PROUTES {} · PROUTE.n 0 · ls null"
      EVAL => {"errs":[],"bad":[]}                                   EXC lines: 0
```
`localStorage` was `null` at every step. *`p3-prev-s6-f136.jpg`* — the `width` row amber (`ppreview`), its select and
all five inputs greyed, *"preview: constant 1.8 · 2 s left"* wrapped under `reset lo hi`, and the meter reading
`1.043 → 1.800` with the right bar full: the left keeps telling the truth about the music while the right is held.

### 6. Storage on the `'real'` path — PASS
`NOAUTO=1 GPU=1 'real'`, demo clicked, key `p`, `pe-psrc-feigen-glow = centroid` + `pe-ptau-feigen-glow = 0.2`:
```
EVAL => "set through the panel: feigen.glow=centroid~0.2 · PROUTES {"feigen":{"glow":{"src":"centroid","c":0,"k":1,"b":0,"inv":false,"tau":0.2}}}"
EVAL => "stored: {"routes":{},"params":{"feigen":{"glow":{"src":"centroid","c":0,"k":1,"b":0,"inv":false,"tau":0.2}}},"manual":{"scene":-1,…}}"
EVAL => "store line: localStorage[ew.routes.v1] · saved (185 chars) — every change made here is stored and loaded again at boot"
EVAL location.reload();1 · key p
EVAL => "after the reload: PROUTES {"feigen":{"glow":{…,"tau":0.2}}} · PROUTE.n 1 · select [centroid] tau [0.2] row [prouted]"
      shot work/p3-real-storage
EVAL click pe-resetall
EVAL => "after reset everything: PROUTES {} · PROUTE.n 0 · stored {"routes":{},"params":{},"manual":{…}}"
EVAL => {"errs":[],"bad":[]}                                          EXC lines: 0
```
The storage key is unchanged and `restore()` is unchanged: the block comes back through `loadRoutes`.

### 7. The details — PASS
```
'test&scene=6': "params width,dive,roll,glow,thick · details true open false · summary [the inputs behind these — 16 jacks]
                 · ids 111111111 111111111 111111111 111111111 111111111"     <- psrc pc pk pb ptau pinv prst plo phi, per parameter
'test&scene=1': "dust params false · pdet false · rows 15 · tables 1 · details 0 · missing src ids [] · first child after h3
                 [hnote] each row is one input of this scene: the"
```
(`missing src ids []` = every routable field of DUST still has its v0.4 `pe-src-dust-<field>`.)

### 8. The user's sentence in a real window — PASS
`HEADED=1 WIN=1400,900 WINPOS=0,0 DPR=1.5 PORT=8795 CLOCK=1 node tools/cdp.js 'test&scene=6' …`, `thick` routed from
`centroid` through the panel at f120, two shots 60 frames apart:
```
f180  EVAL => "f180 thick derived 0.331 → in force 0.455 · centroid 0.455 · row [prouted]"      shot work/p3-real-1
f240  EVAL => "f240 thick derived 0.237 → in force 0.455 · centroid 0.455 · row [prouted]"      shot work/p3-real-2
EVAL => {"errs":[],"bad":[],"dpr":1.5,"w":1356,"h":769}                                          EXC lines: 0
```
**The row reads, in one sentence: "how thick the glowing filaments are — the parameter `thick`, range [0, 1] — is fed
by `centroid`, a level, ×1 +0 with no smoothing, and while the scene's own recipe would be asking for 0.33 the value
in force is 0.455."** Between the two shots the four unrouted rows move (`width 1.032 → 1.036`, `dive 1.241 → 1.170`,
`glow 0.661 → 0.614`) and `thick`'s left meter moves with them (`0.331 → 0.237`) while its right stays at `0.455`:
on the fake timeline `MS.centroid` is flat across those 60 frames, which is exactly what a routed row should show —
the picture now follows the centroid and no longer follows the bass. Worth knowing for the next worker who wants a
moving right-hand meter in a shot: pick a source that moves at the frame you shoot (`lvl`, `bass`), or shoot across
the drop at f780.

### 9. Two CLOCK shots with E open — PASS
- **`tools/work/p3-panel-s6-f120.jpg`** — FEIGEN on screen: the heading line, then the five parameters in declaration
  order (`width` `dive` `roll` `glow` `thick`) with their eli5 first and widest, `[0.4, 1.8]` / `[0, 2]` / `[0, 0.4]` /
  `[0, 1]` / `[0, 1]` under the names, the sources reading `derived: tension, dropEnv, kick` · `derived: lvl` ·
  `derived: constant` · `derived: lvl` · `derived: bass`, `× 1 + 0 τ 0 ☐ invert` (no `c`: none is a constant route),
  `reset lo hi` on every row, and five equal meter pairs. Under them the collapsed `▸ the inputs behind these — 16
  jacks`, then `copy to all scenes  reset scene`. NAV's block below is the v0.4.1 layout, unfolded, unchanged.
- **`tools/work/p3-panel-s0-f120.jpg`** — NAV on screen (`FEIGEN · id 6 · not on screen`), scrolled to FEIGEN's block:
  the same table with every **right** meter at `0.000` while the left ones run. That is honest and worth a sentence in
  the docs (friction 3): `paramsOf` is what `update()` last received, and FEIGEN's `update()` has never run.

### 10. Bundle — PASS
```
node tools/bundle.js  →  bundled 66 modules → dist/eigenwobble.html (483 KB)
FILE=$PWD/dist/eigenwobble.html PORT=8795 NOAUTO=1 GPU=1 node tools/cdp.js 'real' …
EVAL => "from file:// set feigen.thick=centroid · param rows 5 · pdet true · stored 184 chars"     shot work/p3-bundle
EVAL location.reload();1 · key p
EVAL => "after the reload from file://: PROUTES {"feigen":{"thick":{"src":"centroid",…}}} · select [centroid] row [prouted] · param rows 5"
      shot work/p3-bundle-reloaded
EVAL => {"errs":[],"bad":[],"on":true,"ticks":7}                      EXC lines: 0
```

### 11. Not asked: the v0.4.1 previews through the generalised engine — PASS (no regression)
`'test&scene=6&route=feigen.bass=centroid*1.5'`, key `p`:
```
f120 click pe-p1-feigen-bass → f150 {"src":"const","c":1,…} · row [prouted ppreview] · msg [preview: constant 1 · 2 s left]
     · select disabled true k disabled true · textarea still {"routes":{"feigen":{"bass":{"src":"centroid","c":0,…
f246 back to {"src":"centroid","c":0,"k":1.5,…} · ROUTE.n 1 · textarea refreshed
f246 click pe-fire-feigen-dropEvt → f247 "view dropEvt true view===MS false" → f252 msg [fired]
f252 click pe-p0-feigen-bass, Escape at f258 → "after closeE mid-preview: {"src":"centroid","c":0,"k":1.5,…} · ROUTE.n 1"
EVAL => {"errs":[],"bad":[]}                                          EXC lines: 0
```

### 12. Not asked: the rest of part C
```
EVAL set feigen.dive=lvl (param) and feigen.bass=centroid (jack), then click pe-copy-feigen
     => "copy to all scenes: [copied 3 routes to the other scenes] · PROUTES {"feigen":{"dive":{"src":"lvl",…}}} · ROUTE.n 4"
        (three jack routes travelled; no other scene declares a parameter named `dive`, so no param route did)
EVAL CARD.param('feigen','dive',{src:'seed'}) => "param: seed (vector) cannot feed a parameter"   <- the row's .herr shows the same text
EVAL click pe-rst-feigen => "reset scene: PROUTES {} · PROUTE.n 0 · ROUTE.n 3"   <- this scene's params and routes, not the copies
f132 EVAL => "after reset scene the row reads [] select []"
EVAL set pe-psrc-feigen-width = const
     => "const row: {"src":"const","c":0.4,…} · c min 0.4 max 1.8 step 0.01 value 0.4 · c shown true k hidden true
         · after c=1.5 {"src":"const","c":1.5,"k":1,"b":0,"inv":false,"tau":0}"
```

---

## (d) Friction log — what the docs did not tell me, and every guess

1. **Which transfer inputs an *event* source shows.** The brief: *"the transfer inputs are shown for the source's kind
   exactly as the jacks table does, plus: a `const` source hides `k b inv`, keeps `τ`"*. In the jacks table an event
   row has **no transfer cell at all** (`if (R.ev) R.tr.appendChild(el('td', 'pctl'))`), but a parameter's row is one
   row whose source changes, and §1.16 defines `k`, `b`, `inv` **and** `τ` for an event source (`x̃` = 1 on its frame
   else 0, `inv = 1 − x̃` "for a level or event"), and part D of the brief itself expects "the τ tail" on an
   event-routed parameter. Taking "exactly as the jacks table does" literally would make `k b inv` unreachable from
   the panel for a legal spec, and would leave hidden inputs whose values `specOf` would still push. **Guess:** the
   rule that carries over from the jacks is the one about `c` — shown exactly when the source is `const` — and `const`
   is the only source that hides `k b inv`. An event source therefore shows `× k + b τ ☐ invert` like a level.
   If the intent was the other reading, it is one line in `syncRow`.
2. **Which value `c` shows while no constant is routed.** Nothing says. It starts at the range's `lo` (and `min`/`max`
   are the range), so the first click on `const` sets a legal value inside the range rather than `0`, which for
   `width [0.4, 1.8]` would be outside it and silently clamped by `routed()`.
3. **"while unrouted the two meter values are equal by construction — the panel proves it every tick"** holds only for
   a scene whose `update()` ran this frame. `paramsOf` is the object `update()` last received, so for a scene that is
   **not on screen** (and is not `always`) the right-hand meter is stale — `0.000` before its first update ever, as
   `p3-panel-s0-f120.jpg` shows for all five of FEIGEN's rows. This is the FEIGEN worker's "paramsOf reads 0 before a
   scene's first update", one level up. CONTRACTS §1.16 says "identity by construction" without the qualifier "on the
   frame the scene updates"; HARNESS's `paramsOf(name)` line ("the value object `update()` received") is the accurate
   one. I did not add a caption for it — that is a scene-state question, not a panel bug — but the orchestrator may
   want one word in the meter header for an off-screen scene.
4. **`CARD.derived(name, p)` vs `derived(scene, p)`.** HARNESS.md documents the harness form with a name; the module
   exports the form that needs the scene object (`needP(scene, p)` reads `scene.params`). Both are right, in their own
   places, but a worker reading only `params.js` and only HARNESS.md cannot tell there are two. Same shape as the
   v0.4.1 worker's `CARD.view(name)` find — worth one clause in §1.16's harness bullet: *"`CARD.derived` takes the
   scene's name; the module's `derived` takes the scene object."*
5. **`save()` cannot be imported, only handed over.** The brief says "every change calls the panel's `save()`" while
   also forbidding an import of `panel.js`. The only shape that is both is a callback, so `buildP(sc, box, save)`
   takes it — which is also why `copyP` takes `SCENES` instead of importing `scenes.js`. Worth saying in the brief's
   target paragraph, since it constrains the signature of the "call that puts the table into the block".
6. **"at most 3 net lines" in `panel.js` and "reset scene also calls `clearParams`" are in tension.** Three buttons
   live in `panel.js` (`pe-rst-<scene>`, `pe-resetall`, `pe-copy-<scene>`) and all three must reach the parameters.
   I read "net" as the file's line count (it went **down**, 347 → 328) and edited those three lines in place rather
   than adding to them; `(n += copyP(sc, SCENES))` inside the existing message expression is the ugliest of the three,
   and it is there to keep the count honest rather than because it reads best.
7. **The parameters table had nobody to sync it at build.** `buildE` calls `syncAll()`, which walks `panel.js`'s
   `rows` only, so on the first paint every unrouted parameter row showed a `c` box (visible in the first CLOCK shot).
   Fixed in the second commit with one line at the end of `buildP`. A brief sentence — "the table is built and then
   synced once, as `buildE` does for the jacks" — would have saved the round trip.
8. **The `<details>` has to adopt siblings it did not build.** `block(sc)` appends the jacks' explanation, the table
   and the "not routable" note straight into the block, so folding the jacks means moving three existing children
   (found by `box.querySelector('table')` and index arithmetic against the trailing button bar) rather than building
   them inside the `details`. It works and it keeps `panel.js` at three lines, but it is the one place where this
   module reaches into another's DOM: if `block()` ever appends something else after the table, the fold takes it too.
   (I chose it over a fourth line in `panel.js` that would have passed the pieces in.)
9. **Two Chromes.** `pgrep -f "chrom[e].*remote-debugging"` showed another worktree's `GPU=1` headless Chrome twice
   during this run (`agent-ade31699508f6d445`, ports 9401 and 9740). I waited it out with a bounded
   `until [ "$(pgrep … | wc -l)" = 0 ]; do sleep 5; done` before the headed run, and never ran two of my own at once.
   The headed run needed no `xdotool`, no `xwd` and no popup capture — nothing in this table is a native `<select>`
   popup — so none of the v0.4.1 friction 11 pitfalls applied.
10. **No malware-consideration escape memo.** The reminder fired on the reads; per CLAUDE.md and the brief the
    condition is false in this repo. Proceeded.

## What is wrong in the docs (§1.16 is new — what it did not tell me)

1. **§1.16 never says what the panel shows for an *unrouted* parameter.** It documents `from()` as "the documentation
   of what feeds the parameter" and says the core records the reads "(the panel's 'source' column while the parameter
   is not routed)" — but not that the column is a `<select>` whose *first option* is that list, nor what to write when
   the list is empty (`from: () => 0.04`). The brief supplied `derived: constant`; §1.16's own words for that case are
   "a constant: shown as a manual setting", which is a different sentence and would have produced a different label.
2. **§1.16 does not say a parameter route may come from a field the scene does not read** — it does, in the fourth
   bullet ("whether or not it is in your `feats`"), but the *panel* consequence (the source list is `paramSources()`,
   i.e. every level/raw/angle/event field of MS, not `sc.feats`) is only in `params.js`'s header comment. A reader of
   §1.16 alone would build the list from `feats` and be wrong.
3. **§1.16 and HARNESS both describe the transfer for an event source and neither says what a panel should offer for
   one** — friction 1. One sentence in §1.16's third bullet ("an event source takes the same `k`, `b`, `inv`, `τ` as a
   level; only a constant takes none") would settle it.
4. **HARNESS.md "Params"** lists `CARD.paramsOf(name)` and `CARD.derived(name, p)` without saying the module-level
   twins take the scene object (friction 4), and its **"Routes and manual overrides"** section still claims
   `accept.sh` "== routes" runs "a panel-open shot" — the v0.4 and v0.4.1 reports both flagged this and `tools/accept.sh`
   still has no such line. v0.5 adds two more candidates: `p3-panel-s6-f120` and `p3-prev-s6-f136`.
5. **CONTRACTS §1.16's identity sentence needs the frame qualifier** — friction 3.
6. **`check.js` already knew about `panel-params.js`** (both the `VIEWS` list and the per-scene-name loop), which the
   brief said and which is true — no change needed. The v0.4.1 report's open item (`panel-ui.js` in those loops) is
   also closed: it is in the list.

## Line counts

| file | lines | cap / note |
|---|---|---|
| `assets/core/panel-params.js` | **125** | new leaf, ≤ 350; imports `params.js`, `feats.js`, `panel-ui.js` — nothing else |
| `assets/core/panel.js` | **328** (was 347) | ≤ 350; +3 lines of wiring, −22 moved into `panel-ui.js` |
| `assets/core/panel-ui.js` | **122** (was 89) | leaf, still imports nothing |
| `index.html` | **126** (was 119) | 7 new lines, all inside the `#help` style block |

## The shots, for the orchestrator's eyes

| file | what it shows |
|---|---|
| `tools/work/p3-panel-s6-f120.jpg` | FEIGEN on screen: the five parameters, the column order, the `lo`/`hi` buttons, the folded jacks, equal meters |
| `tools/work/p3-panel-s0-f120.jpg` | NAV on screen: no `details` on NAV, FEIGEN's table with the right meters at 0 (it has not updated) |
| `tools/work/p3-real-1.jpg`, `p3-real-2.jpg` | the real window, DPR 1.5: `thick` routed from `centroid`, 60 frames apart, the meters moving |
| `tools/work/p3-set-s6-f126.jpg` | the routed `width` row (acceptance 4), `centroid · level`, `×1.5`, `1.038 ⟶ 1.355` |
| `tools/work/p3-prev-s6-f136.jpg` | the `hi` preview: amber row, greyed controls, "preview: constant 1.8 · 2 s left", `1.043 → 1.800` |
| `tools/work/p3-id-s6-f360.jpg`, `p3-id-s0-f360.jpg` | the identity pair (md5s above) |
| `tools/work/p3-real-storage.jpg` | the `'real'` path after a reload: the route back in the controls from `localStorage` |
| `tools/work/p3-bundle.jpg`, `p3-bundle-reloaded.jpg` | the single file from `file://`, before and after the reload |
