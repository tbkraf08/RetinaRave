# Panel worker report (v0.4 item 3, `panel-ui`) — part E of the `?` help view

Target delivered: `assets/core/panel.js` (**340 lines**, DOM only — no GL, no wall clock, no timer, no second
`requestAnimationFrame`, no literal scene or MS field name) and the part-E CSS block in the `#help` `<style>` of
`index.html`. One file outside the target had to be touched: `tools/bundle.js` (see friction (f) — the bundle was
already broken at HEAD and acceptance item 7 cannot run without the fix).

---

## (a) Friction log — what the docs did not answer, and what I guessed

**1. The event meters cannot see most events.**
The brief: *"events: two dots, lit for half a second after firing (latch the frame as help.js does with `hot`)"*.
`help.js` latches in `drawHelp`, which runs **every** frame (`for (const k of EV) if (S[k]) hot[k] = frameN;`); the
panel is only ever called on `refreshE`, *"every 6th frame while open"*, and the brief forbids a second rAF. An event
is true for exactly one frame, so a latch inside `refreshE` sees roughly one event in six.
**Guess:** latch inside `refreshE` anyway (`if (a) R.ha = frameN; if (b) R.hb = frameN;`, lit while
`frameN - hot < 30`). It is the only place I am allowed to run. The dots therefore under-report; they did light in
practice (`sectionEvt` on FEIGEN at f360, shot `panel-s6-f360-routed.jpg`). Fixing this properly needs one line in
`help.js` (pass its own `hot` map, or call a `latchE(S, frameN)` from `drawHelp`) — I may not edit `help.js`, so it is
left for the orchestrator.

**2. A checkbox has no empty state.**
The brief: *"a number input each (**a checkbox for `exposure.on`**) whose **empty state means 'the scene's own value'**"*.
**Guess:** the checkbox is rendered `indeterminate` while there is no override (its `checked` is then the scene's own
value, so a real state is still carried underneath), and an explicit `×` button next to it (`pe-postx-<scene>-…`)
clears the override back to that state. The three numeric params keep the literal empty-string semantics the brief
asks for.

**3. Which post param is a flag, without naming it.**
`manual.js` exports `POST_PARAMS` (the four paths) but **not** its `PARAMS` table, which is the only place that says
`exposure.on` is a `bool`. `check.js` forbids me from writing the name as a literal, and a positional index into
`POST_PARAMS` would be a silent trap if the order ever changes.
**Guess:** a param is a flag when **some registered scene's own `post` holds a boolean at that path**
(`isFlag = (path) => SCENES.some((s) => typeof ownPost(s, path) === 'boolean')` — DUST declares `exposure: {on: true}`).
If no scene ever declared it the control falls back to a number input, which `setPost` still coerces correctly for a
bool param (`'1'`/`'0'`), so the fallback is safe rather than wrong.

**4. Where the "copy to all scenes" count is shown.** The brief says *"count what was copied, show it"* but not where.
**Guess:** a `.pmsg` span in the block's own button bar, next to the two buttons ("copied 3 routes to the other
scenes"). The same span carries the error if one of the copies throws.

**5. Which controls `refreshE` must re-read.** The brief names only `MANUAL.scene` / `MANUAL.trans` (*"refreshE
re-reads them into the selects when they differ (unless the select has focus)"*). It is silent about the colour selects
and the post placeholders, which `CARD.setColour` / `CARD.manual(...)` can move from outside the panel.
**Guess:** re-read those too (`syncPosts()` on the tick — 24 inputs and 2 selects, all guarded by
`document.activeElement`), because the brief's general rule is *"every control reflects the state in force after a
change"*. Measured cost: none visible — `HELP.ticks` is still exactly 100 in 600 open frames, 0 in 600 hidden.

**6. `input` vs `change`.** The brief drives the controls with *"dispatch `input`/`change`"*. Listening to `input`
would call `setRoute` on every keystroke of a number field and re-sync the caret away.
**Guess:** the rows listen to `change` only. Dispatching `input` then `change` (as the brief's acceptance does) works;
dispatching `input` alone does not. The acceptance runs below dispatch both.

**7. Row order inside a block.** *"FEATS order as part A"* — walked `for (const k in FEATS)` and kept the keys the scene
lists, exactly as `help.js`'s `split()` does. A field of `feats` that is not in `FEATS` at all would silently vanish,
but `check.js` already fails on that case.

**8. The heading's id.** *"heading `NAME · id N` (`REG[id]`'s `scene.name` upper-cased as part C does)"* — a block is
per **scene**, and a scene's own id is `scene.id`, so the heading uses `scene.id` (NAV's DRUM variant, id 4, has no
block of its own and reads NAV's — as the brief says: *"a variant is not a block"*). When a variant is logical,
`REG[SC.logical].scene.name` marks and floats the parent's block; verified at f360 (FEIGEN) below.

**9. Nothing ran into a forbidden file.** I was tempted once: to find out whether `exposure.on` is a bool I wanted
`manual.js`'s `PARAMS` — `manual.js` is a legal *read*, so I read it, confirmed it is not exported, and inferred the
type from the scenes instead (guess 3). I never opened `harness.js`, a scene's code beyond its `feats`/`post`/`colour`
declarations, or `engine/` beyond `feats.js`.

## (d) What is wrong in the docs

**(e) `docs/workers/brief-panel.md` acceptance 2 quotes a stale number.** It says the help-coverage eval
*"still prints `help fields 107/107 (unique 107) · top table = feats on 6/6 ids`"*. The current reference is **7/7** —
`CARD.REG` has 7 entries (6 scenes + NAV's DRUM variant, id 4) and the eval counts registry entries, not scenes.
`tools/accept/v0.3/accept-29.txt:46`, `accept-28.txt:46`, `accept-25.txt:44` and `tools/accept/v0.2/accept-15.txt:35`
all print `7/7`; only the pre-variant `accept-13/14` print `6/6`. `docs/DECISIONS.md:500` carries the same stale `6/6`.
My run prints `7/7`, i.e. identical to the reference — part A is untouched.

**(f) `tools/bundle.js` was already broken at HEAD (`eba7582`) — acceptance 7 could not run as written.**
```
Error: assets/core/scenes.js: unhandled import form:
  import { routeScene, view, isRouted } from './route.js'; // v0.4 routes: the MS view a scene reads (…)
```
`IMPORT_RE` / `SIDE_RE` anchor on `['"]…['"]\s*;?[ \t]*$`, so an `import` line with a **trailing `//` comment** is not
rewritten and the "unhandled import form" guard throws. Four of the v0.4 core modules carry one (`scenes.js`,
`help.js`, `manual.js`, `route.js`), so `node tools/bundle.js` has failed since `9a0c2c9` (route-core) — nothing to do
with this worker. Proved pre-existing by bundling a clean `git archive HEAD` tree: same error.
**Fix applied** (`tools/bundle.js` is not in the brief's do-not-edit list, and item 7 is blocked without it): one
shared tail `const TAIL = "\\s*;?[ \\t]*(?://[^\\n]*)?$"` appended to `IMPORT_RE`, `SIDE_RE` and the `export { … }`
regex. Nothing else changed; `node tools/bundle.js` → `bundled 63 modules → dist/eigenwobble.html (451 KB)`.
If the orchestrator would rather keep `bundle.js` untouched, the alternative is dropping the trailing comments from
those four import lines.

**(g) `index.html` had no form styling at all.** The `#help` block styled only text; every `input` / `select` /
`textarea` would have rendered as the browser default (white boxes on the dark overlay). Added under a
`/* part E */` comment, scoped to `#help`.

**(h) `docs/HARNESS.md` "Routes and manual overrides" says `accept.sh` "== routes" runs *"a panel-open shot"* — there
is no such line in `tools/accept.sh` yet (the section only exists for `== help`). The orchestrator will want to add it.

---

## (c) Acceptance — the exact commands and outputs

All from the worktree root, `PORT=8790` on every `cdp.js` run, one Chrome at a time, never in the background.

### 1. Static checks — PASS
```
node tools/check.js
check: 63 modules · uniforms 109 · MS keys 118 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
wc -l assets/core/panel.js  →  340        (soft cap 350, no warn)
node tools/route-smoke.js   →  route smoke: 60 checks · 0 fail
node tools/manual-smoke.js  →  manual smoke: 43 checks · 0 fail
```
No literal MS field, no literal scene name, no `Math.random`, no `Date.now`, no timer, no second rAF.

### 2. Help coverage unchanged — PASS (against the real reference; the brief's `6/6` is stale, see (e))
```
PORT=8790 CLOCK=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"key":"h"},{"until":"window.__FRAME>=120"},
  {"eval":"<accept.sh's == help coverage IIFE, verbatim>"}]'
EVAL => "help fields 107/107 (unique 107) · top table = feats on 7/7 ids"
```

### 3a. Two CLOCK shots with E open (NAV, f120) — PASS
```
PORT=8790 CLOCK=1 GPU=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"key":"p"},{"until":"window.__FRAME>=120"},
 {"eval":"document.getElementById(\"helpE\").scrollIntoView();\"E at \"+document.getElementById(\"help\").scrollTop"},
 {"shot":"work/panel-s0-f120"},
 {"eval":"document.getElementById(\"help\").scrollTop+=900;…"},{"shot":"work/panel-s0-f120b"},
 {"eval":"document.getElementById(\"help\").scrollTop=1e5;…"},{"shot":"work/panel-s0-f120c"},
 {"eval":"JSON.stringify({errs:CARD.ERRS,n:CARD.ROUTE.n,ticks:CARD.HELP.ticks})"}]'
EVAL => "E at 3502"        EVAL => "now 4402"        EVAL => "bottom 8205"
EVAL => "{\"errs\":[],\"n\":0,\"ticks\":20}"
```
*`work/panel-s0-f120.jpg`* — the heading `E · ROUTES — WHICH MUSIC FEATURE DRIVES WHICH FIELD, BY HAND`, the identity
note, `reset everything`, then **NAV's block first, marked** (the `.hcast.cur` blue left rule and tinted panel). Its
rows, in FEATS order: `presence level`, `bass level`, `mid`, `high`, `onset event`, `hitStrength`, `hit`, `beat event`,
`beatPhase`, `eS` … each with the bright per-scene "what it drives here" clause, a `— (engine)` select, `× 1 + 0 τ 0`
and an `invert` box (absent on the two event rows, as specified), a `reset`, and a live two-segment meter
(`1.000 ▬▬▬ → 1.000 ▬▬▬`, `0.462 → 0.462`, …) — identical on both sides because nothing is routed. The two event rows
show `● → ●` dim.
*`work/panel-s0-f120c.jpg`* (bottom) — the tail of NAV's rows, `not routable: arc (enum), seed (vector)`, the
`copy to all scenes` / `reset scene` bar, then **manual overrides**: `forced scene` (`auto — the director chooses`),
`transition` (`morph`), `NAV colour` / `FEIGEN colour` (`v2`), and one `post` line per scene with the four params —
placeholders showing each scene's **own** value (`NAV bloom.thr 0.35 · fb.decay fn · kaleido 1`, `DUST 0.3 / 0.95 /
0.5`, `MANDALA 0.35 / 0.6 / 0.6`, `TORUS 0.3 / 0.85 / 0`, `POLYTOPE 0.3 / 0.74 / 0`, `FEIGEN 0.3 / 0.55 / 0`), the
indeterminate `exposure.on` boxes with their `×`, a `clear`; then **presets** with the textarea holding
`{"routes":{},"manual":{"scene":-1,"trans":"morph","colour":{"nav":"v2","feigen":"v2"},"post":{}}}`, `load` / `copy`,
and the storage line `localStorage[ew.routes.v1] · under #test it is neither read nor written, so the harness shots
stay deterministic`.

### 3b. FEIGEN at f360 with two routes set **through the panel's own controls** — PASS
Driven by eval (`e.value = …; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change'))`) on
`pe-src-feigen-bass` → `centroid`, `pe-k-feigen-bass` → `1.5`, `pe-src-feigen-kick` → `snare`:
```
PORT=8790 CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6' "$(cat tools/work/steps3.json)"
EVAL (the three controls)    => "pe-src-feigen-bass=centroid pe-k-feigen-bass=1.5 pe-src-feigen-kick=snare"
EVAL JSON.stringify(CARD.ROUTES) =>
  {"feigen":{"bass":{"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0},
             "kick":{"src":"snare","c":0,"k":1,"b":0,"inv":false,"tau":0}}}
EVAL CARD.routesString()     => "feigen.bass=centroid*1.5,feigen.kick=snare"
EVAL #pe-json                => {"routes":{"feigen":{…same…}},"manual":{"scene":6,"trans":"morph",
                                 "colour":{"nav":"v2","feigen":"v2"},"post":{}}}
EVAL final                   => {"errs":[],"n":2,"ls":null}          (ls = localStorage under #test: null)
shot work/panel-s6-f360-routed
```
*`work/panel-s6-f360-routed.jpg`* — FEIGEN's block, both routed rows tinted (`.prouted`): `bass` shows source
`centroid`, gain `1.5`, meter **`0.455 → 0.682`** (the two segments genuinely differ: 0.455 × 1.5 = 0.68, still inside
the level's 0..1 clamp, and the routed bar is visibly longer); `kick` shows source `snare`, meter `0.004 → 0.004`
(gain 1, so source and routed agree — the route is live, the value is just small at that frame). The `sectionEvt` row's
two dots are **lit yellow** (the latch works). Every other row still says `— (engine)`.

### 4. Identity with the panel open — PASS (both md5s exact)
```
PORT=8790 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"key":"p"},
 {"until":"window.__FRAME>=300"},{"key":"Escape"},{"until":"window.__FRAME>=360"},{"shot":"panel-id-s6-f360"},
 {"eval":"JSON.stringify({n:CARD.ROUTE.n,errs:CARD.ERRS,ticks:CARD.HELP.ticks,on:CARD.HELP.on})"}]'
EVAL => {"n":0,"errs":[],"ticks":50,"on":false}
md5  8d6ac4a6234d1bbaaaac2bca65d8439d  tools/work/panel-id-s6-f360.jpg   == accept/v0.4/scene-md5-v03.txt s6-f360.jpg
 (re-run after the last edit as panel-id2-s6-f360.jpg: 8d6ac4a6234d1bbaaaac2bca65d8439d — same)

… same steps on 'test&scene=0' →
EVAL => {"n":0,"errs":[],"ticks":50,"on":false}
md5  fb74fee47170b2d1f043db9f96319c7e  tools/work/panel-id-s0-f360.jpg   == …scene-md5-v03.txt s0-f360.jpg
```

### 5. Zero cost hidden — PASS
```
PORT=8790 CLOCK=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"until":"window.__FRAME>=600"},
 {"eval":"\"help ticks hidden \"+CARD.HELP.ticks+\" (600 frames, want 0)\""},{"key":"p"},{"until":"window.__FRAME>=1200"},
 {"eval":"\"help ticks open \"+CARD.HELP.ticks+\" (600 frames, want 100) errs \"+JSON.stringify(CARD.ERRS)+
          \" E rows \"+document.querySelectorAll(\"#helpE tr\").length"}]'
EVAL => "help ticks hidden 0 (600 frames, want 0)"
EVAL => "help ticks open 100 (600 frames, want 100) errs [] E rows 98"
[EXC] lines: 0
```
(98 `<tr>` in part E = 6 header rows + 92 routable field rows across the six blocks.)

### 6. Storage — PASS (both halves)
Real path, a route set through the panel, reload:
```
PORT=8790 NOAUTO=1 GPU=1 node tools/cdp.js 'real' "$(cat tools/work/steps6.json)"
EVAL (set pe-src-feigen-bass=centroid, pe-k-feigen-bass=1.5) => "feigen.bass=centroid*1.5"
EVAL localStorage.getItem('ew.routes.v1') =>
  {"routes":{"feigen":{"bass":{"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0}}},
   "manual":{"scene":-1,"trans":"morph","colour":{"nav":"v2","feigen":"v2"},"post":{}}}
EVAL #pe-store => "localStorage[ew.routes.v1] · saved (173 chars) — every change made here is stored and loaded again at boot"
EVAL location.reload() => "reloaded"      (the landing card is shown again, the music is not started)
EVAL JSON.stringify(CARD.ROUTES) => {"feigen":{"bass":{"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0}}}
EVAL => "ROUTE.n 1 errs []"          [EXC] lines: 0
```
The `#test` rule, proved by eval (a fresh profile per run, so the preset is seeded by hand and the page reloaded):
```
PORT=8790 GPU=1 node tools/cdp.js 'test&scene=6' "$(cat tools/work/steps6b.json)"
EVAL => "at boot, before any key: ROUTE.n 0 storage null"                     ← restore() did not run
EVAL => "set through the panel: feigen.bass=centroid"
EVAL => "storage after the change: null"                                     ← nothing was written
EVAL => "seeded a preset by hand, reloading"
EVAL => "after the reload under #test: ROUTE.n 0 (the seeded preset was not read) storage still there: true errs []"
[EXC] lines: 0
```

### 7. Bundle — PASS, **after the `tools/bundle.js` fix of friction (f)**
```
node tools/bundle.js            →  bundled 63 modules → dist/eigenwobble.html (451 KB)
FILE=$PWD/dist/eigenwobble.html PORT=8790 NOAUTO=1 GPU=1 node tools/cdp.js 'real' "$(cat tools/work/steps7.json)"
shot work/panel-bundle
EVAL (set pe-src-feigen-bass=centroid) => {"feigen":{"bass":{"src":"centroid","c":0,"k":1,"b":0,"inv":false,"tau":0}}}
EVAL location.reload() => 1
EVAL => {"feigen":{"bass":{"src":"centroid","c":0,"k":1,"b":0,"inv":false,"tau":0}}} errs []
[EXC] lines: 0
```
*`work/panel-bundle.jpg`* — from `file://`, key `p` opens the view already scrolled to E: the same NAV block, meters
running on the real demo signal (`presence 0.964`, `bass 0.598`, `mid 0.915`, `beatPhase 0.957`), controls styled and
usable. The route survives the reload from `localStorage`.

### 8. Key table
`p` is already in `help.js`'s part D data (`KEYS` holds `['P', 'this view opened at part E, the routes panel (what
drives what, by hand)']`) and in `hud.js`'s header comment. I did not edit `help.js`. Noted here as the brief asks.

### Extra checks (not in the acceptance list, all green)
```
PORT=8790 CLOCK=1 GPU=1 node tools/cdp.js 'test' "$(cat tools/work/steps8.json)"
"f120 first block pe-blk-nav marked pe-blk-nav logical 0"
"f360 first block pe-blk-feigen marked pe-blk-feigen logical 6"     ← markE floats + marks on a director switch
"copied 3 routes to the other scenes | torus.bass=high,nav.bass=high,mandala.bass=high,feigen.bass=high"
"err: route: nosuchfield (unknown) cannot feed bpm (raw) | routes still torus.bass=high,…"   ← a bad preset changes nothing
"forced 5 post torus.bloom.thr=0.9,dust.exposure.on=0"             ← manual scene + a number post + the flag checkbox
errs [] · [EXC] 0

PORT=8790 CLOCK=1 GPU=1 node tools/cdp.js 'test' "$(cat tools/work/steps9.json)"
"set: routes [nav.bass=high] posts [torus.bloom.thr=0.9] forced 5 trans morph"
"after reset everything: routes [] posts [] forced -1 trans morph scene select now []"       ← clearRoutes + resetManual

PORT=8790 CLOCK=1 GPU=1 node tools/cdp.js 'test' "$(cat tools/work/steps10.json)"
"transitions [mixs,morph] -> mixs then morph"                       ← the transition select really sets it
"feigen colour nav:v2 feigen:oklch"                                 ← manual('colour', …) through pe-col-feigen
"const box display inline-flex -> nav.bass=c:0.4"                   ← the c input appears only while const is selected
"meter: 0.400→0.400"                                                ← a constant reads back through the meter
shot work/panel-const
```
*`work/panel-const.jpg`* — only the `bass` row shows the `c 0.4` box; every other row hides it, and the routed row is
tinted. (The step files `tools/work/steps{3,6,6b,7,8,9,10}.json` hold the exact JSON; `tools/work/` is gitignored, so
they are reproduced above.)

---

## The elements and ids (so a real-window check can drive them by eval)

Every id is `pe-…`; `<s>` is the **scene name** (`SCENES[i].name`), `<f>` an MS field name, `<p>` one of
`POST_PARAMS` (`bloom.thr`, `fb.decay`, `kaleido`, `exposure.on`). `getElementById` handles the dot in `<p>` fine.

| id | element | how to drive it |
|---|---|---|
| `pe-resetall` | button | `.click()` → `clearRoutes()` + `resetManual()` |
| `pe-blocks` | div | holds the scene blocks; `firstChild` is the current scene's |
| `pe-blk-<s>` | div `.hcast.pblk` | the scene's block; `.cur` while it is logical |
| `pe-src-<s>-<f>` | select | `''` = no route, else a source name or `const`; `value=…` + `new Event('change')` |
| `pe-c-<s>-<f>` | number | the constant (its `<label>` is `display:none` unless `const` is selected) |
| `pe-k-<s>-<f>` | number | gain, step .05, default 1 |
| `pe-b-<s>-<f>` | number | offset, step .05, default 0 |
| `pe-tau-<s>-<f>` | number | τ seconds, step .05, min 0, default 0 |
| `pe-inv-<s>-<f>` | checkbox | invert |
| `pe-r-<s>-<f>` | button | per-row reset → `setRoute(s, f, null)` |
| `pe-copy-<s>` | button | copy this scene's routes to every other scene that lists the field |
| `pe-rst-<s>` | button | `clearRoutes(s)` |
| `pe-scene` | select | forced scene: `''` = auto, else the id as a string |
| `pe-trans` | select | the transition name |
| `pe-col-<s>` | select | colour variant (only `nav`, `feigen` today) |
| `pe-post-<s>-<p>` | number, or checkbox for `exposure.on` | empty = the scene's own value (placeholder) |
| `pe-postx-<s>-<p>` | button `×` | only beside a flag: clears that override |
| `pe-postc-<s>` | button `clear` | `clearPost(s)` for the whole scene |
| `pe-json` | textarea | `routesJSON()`; type into it and click `pe-load` |
| `pe-load` / `pe-copybtn` | buttons | load the textarea / copy it to the clipboard (falls back to selecting the text) |
| `pe-err` | p `.herr` | the load error (nothing else changes when it is set) |
| `pe-store` | p `.hnote` | the storage line |

A rejected route's message lands in the row's own `div.herr` inside the source cell; the copy count and the manual
errors land in `#pe-blk-<s> .pmsg` and in the `.herr` at the end of the manual list.

**New CSS classes** (all in `index.html`'s `#help` block, scoped): `.pbtn .ptab .pkind .pblk .pctl .pnum .pbar .pmsg
.herr .pmeter .pm .parrow .pdot(.lit) .prouted`, plus `#help input / select / textarea`. Reused from part A–C:
`.htab .hk .hd(.here) .hl .hv .hbar .hfill .hnote .hcast .cur .hdl`.

## The storage key's JSON, as saved

`localStorage['ew.routes.v1']`, written after setting `feigen.bass ← centroid` gain 1.5 through the panel on the real
path (173 chars), and read back intact after a reload:
```json
{"routes":{"feigen":{"bass":{"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0}}},
 "manual":{"scene":-1,"trans":"morph","colour":{"nav":"v2","feigen":"v2"},"post":{}}}
```
It is exactly `routesJSON()` — the `routes` table plus `route.js`'s `BLOCKS.manual`. `restore()` feeds it straight to
`loadRoutes`, and a preset that no longer parses (a renamed scene) is swallowed with
`console.warn('panel: the stored preset no longer loads (…) — ignored')`, never thrown. Every storage access is inside
a try/catch, and both the read and the write are skipped entirely when `TEST`.

## Line count

`assets/core/panel.js` — **340 lines** (cap 350, `check.js` 0 warn).
