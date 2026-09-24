# Panel worker report 2 (v0.4.1 `panel-legibility`) — the panel you can read

Targets delivered: `assets/core/panel.js` (**347 lines**, cap 350) and the `#help` style block of `index.html`. One new
file, exactly as the brief allows: `assets/core/panel-ui.js` (**89 lines**) — the DOM helpers, a leaf that imports
**nothing at all**. Nothing else was touched (`git show --stat` on the two commits: `assets/core/panel.js`,
`assets/core/panel-ui.js`, `index.html`, plus this report).

> **The orchestrator must add `assets/core/panel-ui.js` to `tools/check.js`'s two literal-name loops** (line 55's
> `for (const f of ['assets/core/help.js', 'assets/core/panel.js'])` and line 120's per-scene-name check). The file
> holds no scene and no MS field name today — it is handed every name by `panel.js` — but nothing enforces that yet.

---

## (a) What I built

**A — the dropdown (sentence 3).** `#help{…;color-scheme:dark}` and `#help option,#help optgroup{background:#0b0d16;color:#cfe}`,
plus `#help input:disabled,#help select:disabled{opacity:.45;cursor:not-allowed}` (new, for the preview's disabled row).
Every `<select>` in part E is inside `#help`, so the source selects, `pe-scene`, `pe-trans` and the colour selects are
all covered by the same two rules. Nothing in `#help` regressed: every `input` / `select` / `textarea` there already
carries an explicit background and colour, the checkbox has `accent-color`, and `color-scheme:dark` additionally
repaints the scrollbar and the number spinners dark — an improvement on the overlay, verified in the headed shots.

**B — the visual leads the row (sentence 1).** The row is now
**what it drives here** (first, `.ptab .hd{width:30%;min-width:24em}`) · **input** (the jack: the field name in `.hk`
with `.pkind` under it) · source · transfer · reset+previews · `source → routed`. Under every block heading one plain
sentence: *"each row is one input of this scene: the left column is what it moves on screen, the source is the music
feature you plug into it"*. The E heading and its note are untouched; every control keeps its v0.4 id.

**C — bid-only rows (sentence 2b).** `BID = /^the bid:/` against `sc.help.feats[k]` — the prefix test and nothing else.
A match adds `pbid` to the `<tr>` (`.pbid td{opacity:.55}`), leaves the drives cell without `here` (not bright), and
appends `span.hnote` *"bid only — moves nothing while the scene is forced; changes when the director picks it"*.
12 such rows across the six blocks today; FEIGEN's are `regularity clarity calm` (its fourth `the bid:` field, `arc`,
is an enum and has no row at all).

**D — preview the extremes (sentence 2a/2c).** Per transfer-kind row `0` / `1` (`pe-p0-…`, `pe-p1-…`, class
`pbtn pprev`); per event row `fire` (`pe-fire-…`). A preview remembers `ROUTES[name][k] || null`, sets
`{src:'const', c}`, counts `frameN - at < 120` on the help tick, shows *"preview: constant &lt;c&gt; · &lt;s&gt; s left"* in a
`span.pprev-msg` in the reset cell, disables that row's select and inputs, and puts the remembered spec back on the
first tick at 120. A second click restarts the clock with the new constant and **keeps the first remembered spec**.
Constants: `FEATS[k].range[0]`/`[1]`, or for a `raw` jack `0` and twice the routed view's live value (1 when it is 0).
No `save()` ever runs from a preview, and `syncJSON()` returns early while `nPrev > 0` (so even a `save()` triggered by
another row cannot leak the constant into the textarea), then runs once when the last preview ends. `fire` calls
`pulse(name, k)` and shows *"fired"* for 30 frames; an error from either lands in the row's `.herr`.
`closeE()` ends every running preview at once.

**E — which scene am I dialling (sentence 2d).** `p.hnote#pe-force-line` under the E heading, carrying both buttons
(`pe-force`, `pe-release`; the one that does not apply is `display:none`) and the sentence for the state in force.
Each block heading carries `span.pon#pe-on-<scene>` reading ` · on screen` / ` · not on screen`, set in `markE()` from
`REG[SC.logical].scene.name` (a variant counts as its parent, as the block does). The line is refreshed in `markE()`
and on every `refreshE` tick, so the number keys and `&scene=` move it too.

**New ids:** `pe-p0-<scene>-<field>` · `pe-p1-<scene>-<field>` · `pe-fire-<scene>-<field>` · `pe-force-line` ·
`pe-force` · `pe-release` · `pe-on-<scene>`.
**New classes:** `.pbid` `.pprev` `.pprev-msg` `.ppreview` `.pon` (+ the `#help option` / `:disabled` rules).
**Kept, all of them:** `pe-src-` `pe-c-` `pe-k-` `pe-b-` `pe-tau-` `pe-inv-` `pe-r-` `pe-copy-` `pe-rst-` `pe-blk-`
`pe-blocks` `pe-resetall` `pe-scene` `pe-trans` `pe-col-` `pe-post-` `pe-postx-` `pe-postc-` `pe-json` `pe-load`
`pe-copybtn` `pe-err` `pe-store`.

**Why the split.** With everything above, `panel.js` was **403** lines. The brief's list (`el btn opt mkSel numIn wrap
segment nums short clamp01 focused up`) moved to `panel-ui.js` and it was still 370, so four whole-cell builders moved
with them — `drivesCell` (the drives text + the bid note), `jackCell`, `transferCell` (`c × + τ invert`), `meterCell`
(the two segments and the arrow) — plus `ID()`. They are pure DOM: `panel.js` hands them every name and every callback.
That brought it to 347 with the comments intact.

## (b) Friction log — the sentences the docs do not contain, and every guess

**1. `CARD.view` takes a name, not a scene object (a wrong command in the brief).** Acceptance 5 says to read
`CARD.view(CARD.REG[6].scene)`. That throws:
```
[EVAL-ERR] Error: no scene [object Object]
```
`harness.js:45` is `view: (name) => { const s = SCENES.find((x) => x.name === name); … }`, and HARNESS.md's `CARD`
paragraph says `view(name)`. **Used `CARD.view(CARD.REG[6].scene.name)`.**

**2. Where the preview message goes.** The brief offers a choice — *"a `span.pprev-msg` in the reset cell or the
`.herr` slot"*. **Guess:** the reset cell, beside the buttons that caused it; the same span carries `fired`, so the
`.herr` slot stays what it has always been (the message of a rejected route or a refused pulse).

**3. The `0` / `1` `title`s.** The brief fixes only the raw case (*"0"*, *"twice the live value (raw field, no fixed
range)"*). **Guess:** for a jack with a range, `a constant <range[hi]> for 2 s` (`a constant 1 for 2 s`,
`a constant -3.14159 for 2 s` on an angle).

**4. The `the bid:` prefix is left in the drives text.** The brief says the prefix is the detection and that the row
gets the note; it does not say whether to strip it for display. **Guess:** keep it — it is the scene author's own
sentence, and CONTRACTS §1.13's example reads as a whole (*"the bid: a steady groove raises it"*). The cell therefore
shows the line, then the note on its own line under it.

**5. One sentence per block, not one per panel.** *"The block heading gains one plain sentence under it"* — read
literally (and the sentence itself says *"this scene"*), so it repeats once per block, six times.

**6. `markE()` is now called at the end of `buildE()`.** Nothing says when the `pe-on-*` words are first written;
`help.js` calls `markE()` right after `initHelp()` on an open, but `HELP.rows()` builds the view without it and would
have left them empty. **Guess:** call it at the end of the build (DOM only, no cost).

**7. The preview's frame origin.** Implemented exactly as written — a module `lastF` updated on every `refreshE`, copied
into the row's `pv.at` at the click. A click before the first tick (possible only via `HELP.rows()`) previews from
frame 0, i.e. ends on the first tick: harmless.

**8. `syncJSON` suppression is global, not per row.** *"`syncJSON` is skipped while any preview runs"* — a counter
`nPrev` guards the function itself, so a `save()` from another row during a preview also leaves the textarea alone.
The textarea is refreshed once from `endPreview` when the last one ends.

**9. The force line's `textContent` always ends `forcerelease`.** Both buttons stay in the DOM (one `display:none`) so
that their ids never disappear. A test must use *contains*, not equality:
`pe-force-line` reads `the director is choosing scenes — force this one while you dial forcerelease`.

**10. A `<select>`'s native popup cannot be screenshotted through CDP** (the brief's *"the orchestrator judges the list
with their own eyes either way"* is why it is written that way, but it is worth writing down). The popup is a separate,
override-redirect X window; `Page.captureScreenshot` only ever contains the renderer's frame, so the first headed run
produced a shot with no list in it at all. `xwd -root` — the only screenshot tool on this box (no `import`, no `scrot`,
no `ffmpeg`, no `maim`) — **fails while the popup is up**:
```
X Error of failed request:  BadColor (invalid Colormap parameter)
```
**Wrote `tools/work/xshot.py`** (python-Xlib `root.get_image` + PIL, ~20 lines, in the gitignored `tools/work/`) and
grabbed the root rectangle with it. See (c) item A for which step opened the list.

**11. `xdotool search --class chrome windowactivate` raises somebody else's window.** It matched other Chrome-class
windows on this desktop (a Slack window, then an editor) and brought them to the front over the run — two wasted
captures, and it disturbs the desktop of whoever is logged in. Do not window-activate by class in a headed run; the
cdp window is already focused when it opens.

**12. A DOM-built `<table>` has no `<tbody>`.** `document.createElement('table')` + `appendChild(tr)` leaves the rows
as direct children, so an eval selector `#pe-blk-feigen tbody tr` matches nothing (my own first attempt at the item-8
eval). `#pe-blk-feigen tr` is the one that works — noted for the orchestrator's own evals against part E.

**13. `width:30%` on the drives column is only a hint.** `.ptab` is `table-layout:auto`, so the browser gave the first
column ~140 px and the sentence wrapped into six lines (first shot). Added `min-width:24em`; the brief's *"or so"*
covers it. At 1280 px the column is now ~24 em and the sentence takes one or two lines.

**14. Nothing was read outside the brief's list.** I opened `assets/core/harness.js` once — with `grep -n view`, to
find `CARD.view`'s signature after friction 1 — and read only the three matching lines. `tools/accept.sh` was read to
copy the "== help" eval verbatim, as acceptance 2 instructs.

## (c) Acceptance — the exact lines

All from the worktree root, `PORT=8791` on every `cdp.js` run, `pgrep -f "chrom[e].*remote-debugging"` before each one
(never more than one Chrome from me, none while anything else ran). The driver scripts are in the gitignored
`tools/work/` (`a4.sh a5a.sh a5b.sh a5c.sh a5d.sh a6.sh a7.sh a89.sh a9b.sh aA4.sh a10.sh`).

### 1. Static checks — PASS
```
node tools/check.js
check: 64 modules · uniforms 109 · MS keys 118 · scenes 6 (help.feats gaps 0) · 0 fail · 0 warn
wc -l assets/core/panel.js assets/core/panel-ui.js  →  347   89
```
No literal MS field, no literal scene name, no `Math.random`, no `Date.now`, no `performance.now`, no timer, no second rAF.

### 2. Help coverage unchanged — PASS
`accept.sh` line 50's coverage IIFE, copied verbatim (extracted from the file, not retyped), `PORT=8791 CLOCK=1`:
```
EVAL (function(){var out=[],ok=0,n=0,all=Object.keys(CARD.FEATS). => "help fields 107/107 (unique 107) · top table = feats on 7/7 ids"
```

### 3. Identity with the panel open — PASS, both md5s exact
```
PORT=8791 CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"key":"p"},{"until":"window.__FRAME>=300"},
  {"key":"Escape"},{"until":"window.__FRAME>=360"},{"shot":"work/p2-id-s6-f360"},{"eval":"JSON.stringify({n:CARD.ROUTE.n,errs:CARD.ERRS,ticks:CARD.HELP.ticks,on:CARD.HELP.on})"}]'
EVAL => "{\"n\":0,\"errs\":[],\"ticks\":50,\"on\":false}"
md5  8d6ac4a6234d1bbaaaac2bca65d8439d  tools/work/p2-id-s6-f360.jpg   == accept/v0.4/scene-md5-v03.txt s6-f360.jpg
 (re-run after the last CSS edit as p2-id2-s6-f360.jpg: 8d6ac4a6234d1bbaaaac2bca65d8439d — same)
… the same steps on 'test&scene=0':
EVAL => "{\"n\":0,\"errs\":[],\"ticks\":50,\"on\":false}"
md5  fb74fee47170b2d1f043db9f96319c7e  tools/work/p2-id-s0-f360.jpg   == …s0-f360.jpg
```

### 4. Zero cost hidden — PASS
```
EVAL => "help ticks hidden 0 (600 frames, want 0)"
EVAL => "help ticks open 100 (600 frames, want 100) errs [] E rows 98 pbid rows 12"
EXC lines: 0
```

### 5. The preview, by eval — PASS
`'test&scene=6&route=feigen.bass=centroid*1.5'`, `CLOCK=1 GPU=1`, key `p`:
```
f120  EVAL JSON.stringify(CARD.ROUTES.feigen.bass) => {"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0}
f120  EVAL document.getElementById("pe-p1-feigen-bass").click() => "clicked pe-p1-feigen-bass at f120"
f150  EVAL JSON.stringify(CARD.ROUTES.feigen.bass) => {"src":"const","c":1,"k":1,"b":0,"inv":false,"tau":0}
f150  EVAL (the row) => "row class [prouted ppreview] msg [preview: constant 1 · 2 s left] select disabled true k disabled true ls null"
      shot work/p2-preview-s6-f150
f240  EVAL JSON.stringify(CARD.ROUTES.feigen.bass) => {"src":"centroid","c":0,"k":1.5,…}      ← back on the first tick at 120 frames
f300  EVAL => {"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0} | ROUTE.n 1 | ls null | json {"routes":{"feigen":{"bass":{"src":"centroid","c":0,"k":1.5,…
      EVAL => {"errs":[],"bad":[]}        EXC lines: 0
```
*`p2-preview-s6-f150.jpg`* — FEIGEN's block: the `bass` row tinted amber, its select and four numbers greyed and
disabled, `preview: constant 1 · 2 s left` wrapped under the `reset 0 1` buttons in the same cell (it is `display:block`
so a running preview cannot widen the table), the meter reading `1.000 → 1.000` with both
bars full; `regularity` and `clarity` under it dimmed with the bid-only note; the `dropEvt` row with `fire` and no
transfer cell.

The `'real'` path (`NOAUTO=1 GPU=1`, demo clicked, key `p`), the storage half:
```
EVAL (set pe-src-feigen-bass=centroid, dispatch change) => "set through the panel: feigen.bass=centroid"
EVAL "stored before the preview: "  => {"routes":{"feigen":{"bass":{"src":"centroid","c":0,"k":1,"b":0,"inv":false,"tau":0}}},"manual":{"scene":-1,"trans":"morph","colour":{"nav":"v2","feigen":"v2"},"post":{}}}
EVAL click pe-p0-feigen-bass, wait 500 ms
EVAL "stored 500 ms into the preview: " => …identical, byte for byte…
EVAL "in force while previewing: {"src":"const","c":0,…} · textarea {"routes":{"feigen":{"bass":{"src":"centroid","c":0,"k":1,"b…"   ← the textarea still shows the user's route
wait 2.5 s
EVAL "after the preview: {"src":"centroid",…} src centroid"
EVAL "stored after the preview: " => …identical again…
EVAL "select value centroid disabled false row [prouted]"          EVAL {"errs":[],"bad":[]}   EXC lines: 0
```
`fire`, on `'test&scene=6'`:
```
f120  EVAL "view===MS before true dropEvt false"
f120  EVAL click pe-fire-feigen-dropEvt
f121  EVAL "f121 view dropEvt true view===MS false ROUTE.n 0"
f122  EVAL "f122 view===MS true ROUTES {} ls null"
f126  EVAL "msg [fired] err []"      f180  EVAL "f180 msg after 30 frames []"
      EVAL "no fire button on the level rows, as specified"        EVAL {"errs":[],"bad":[]}   EXC lines: 0
```
Extra (not asked, both stated behaviours of D): a second click while previewing, and a raw jack's `1`:
```
f120 first click (1): {"src":"const","c":1,…}
f180 second click (0): {"src":"const","c":0,…}
f246 (the first preview would have ended at 240): {"src":"const","c":0,…}     ← the clock restarted, not the spec
f306 after the restarted preview: {"src":"centroid","c":0,"k":1.5,…}          ← the user's own route, never lost
EVAL "raw jack, live bpm 124.000 → {"src":"const","c":248,…}"                 ← twice the live value
EVAL titles => "twice the live value (raw field, no fixed range) | 0 | a constant 1 for 2 s"
f432 "bpm back to: undefined · bass {"src":"centroid","c":0,"k":1.5,…} · ROUTE.n 1"   ← a preview over no route clears again
```

### 6. closeE — PASS
```
f120 EVAL "before: {"src":"centroid","c":0,"k":1.5,…} ROUTE.n 1"
f120 EVAL "previewing at f120: {"src":"const","c":1,…} ROUTE.n 1"
f130 {"key":"Escape"}
f140 EVAL "f140 help on false · after closeE: {"src":"centroid","c":0,"k":1.5,"b":0,"inv":false,"tau":0} ROUTE.n 1"
     EVAL "row [prouted] select centroid disabled false msg [] ls null"      EVAL {"errs":[],"bad":[]}   EXC lines: 0
```

### 7. Force / release — PASS
`'test'` (director mode), key `p`, f120:
```
EVAL "MANUAL.scene -1 · line [the director is choosing scenes — force this one while you dial forcerelease]"
EVAL click pe-force
EVAL "MANUAL.scene 0 SC.logical 0 equal true · pe-scene value [0] · line [NAV is forced — the director will not switch while you dial forcerelease]"
EVAL "pe-on-nav => · on screen | pe-on-dust => · not on screen | pe-on-mandala => · not on screen | pe-on-torus => · not on screen | pe-on-polytope => · not on screen | pe-on-feigen => · not on screen"
f240 EVAL "still forced at f240: MANUAL.scene 0 SC.logical 0"
EVAL click pe-release
EVAL "MANUAL.scene -1 · pe-scene value [] · line [the director is choosing scenes — force this one while you dial forcerelease]"
EVAL {"errs":[],"bad":[],"n":0}     EXC lines: 0
```

### 8. Bid-only — PASS
`'test&scene=6'`, every row of FEIGEN's block, name / class / has-note:
```
bass [] note:no | bpm [] note:no | regularity [pbid] note:yes | dropEvt [] note:no | dropEnv [] note:no |
clarity [pbid] note:yes | tension [] note:no | sectionEvt [] note:no | midS [] note:no | lvl [] note:no |
kick [] note:no | hat [] note:no | alive [] note:no | calm [pbid] note:yes | flow [] note:no | flowMid [] note:no
EVAL "clarity row [pbid] drives [the bid: clearly tonal musicbid only — moves nothing while the scene is forced; changes when the director picks it] hd classes [hd]"
```
Exactly the three routable `the bid:` fields (`arc` is an enum: `not routable: arc (enum), seed (vector)`), and the
drives cell is `hd` without `here` — dim, as specified. *`p2-bid-s6-f120.jpg`*: `calm` dimmed with the note under its
line while `alive` and `flow` beside it are at full brightness, then NAV's heading reading `NAV · id 0 · not on screen`.

### 9. The shots
- **`tools/work/p2-panel-s6-f120.jpg`** — E's heading and note, `FEIGEN is forced — the director will not switch while
  you dial [release]`, `reset everything`, then FEIGEN's block: `FEIGEN · id 6 · on screen`, the one-sentence
  explanation, the header row `what it drives here | input | source | transfer | | source → routed`, and rows whose
  first column is the visual ("sharpens the filaments and lights the interior trap", "zooms in hard and floods the
  filaments") with the jack (`bass` / `level`) second; `reset 0 1` on every transfer row, `reset fire` on `dropEvt`
  and `sectionEvt`, meters running.
- **`tools/work/p2-panel-s0-f120.jpg`** — the same with NAV's block first and marked (`first block pe-blk-nav · marked
  pe-blk-nav`), `NAV · id 0 · on screen`, `NAV is forced …`, the event rows `onset` and `beat` with lit dots.
- **`tools/work/p2-dropdown.jpg`** — the headed run, the native popup list open on `pe-src-feigen-bass`: a dark panel
  (`#0b0d16`) with pale rows (`— (engine) presence bass mid high bassFast hitStrength hit beatPhase regularity eS eM
  eL eMax build dropStrength …`), the current row highlighted blue. White-on-white is gone.
  Two controls for the same shot: `p2-dropdown-closed.jpg` (before, no list) and `p2-dropdown-cdpkey.jpg` (after the
  cdp key step, still no list).

### 10. Bundle — PASS
```
node tools/bundle.js  →  bundled 64 modules → dist/eigenwobble.html (460 KB)     (63 + panel-ui.js)
FILE=$PWD/dist/eigenwobble.html PORT=8791 NOAUTO=1 GPU=1 node tools/cdp.js 'real' …
shot work/p2-bundle
EVAL "set through the panel: feigen.bass=centroid · stored 171 chars"
EVAL "clicked pe-p1-feigen-bass · in force now {"src":"const","c":1,…}"
EVAL "during the preview: {"src":"const","c":1,…} · stored {"routes":{"feigen":{"bass":{"src":"centroid",…}}},"manual":{…}}"
EVAL "after the preview: {"src":"centroid","c":0,"k":1,"b":0,"inv":false,"tau":0}"
EVAL location.reload();1
EVAL "after the reload: {"feigen":{"bass":{"src":"centroid",…}}} · ROUTE.n 1 errs []"
EVAL "E rows from file:// 98 · bid rows 12 · force line [the director is choosing scenes — force this one while you dial forcerelease]"
shot work/p2-bundle-reloaded                                            EXC lines: 0
```
*`p2-bundle.jpg`* — from `file://`, key `p` opens at E with the director line in its unforced state
(*"the director is choosing scenes — force this one while you dial [force]"*), NAV's block on top, meters running on
the demo signal.

### A — which step opened the native list
| step | opened the list? |
|---|---|
| `{"key":"Alt+ArrowDown"}` (cdp's key step) | **no** — `cdp.js` builds no `modifiers` field, so the event goes out as `key`/`code` `"Alt+ArrowDown"` with virtual-key 0; Chrome moved focus to the address bar instead (`p2-dropdown-cdpkey.jpg`) |
| `{"sh":"xdotool key alt+Down"}` | **not usable** — it needs the cdp window focused, and the only way I found to guarantee that (`xdotool search … windowactivate`) raised *other* people's windows on this desktop (friction 11). Under it the popup did open once (`xwd` returned `BadColor`, which only happens with a popup up) but the capture was of the wrong window. |
| **`{"clickSel":"#pe-src-feigen-bass"}`** | **yes** — cdp's trusted mouse click opens the native popup, no window juggling, and the list is in `p2-dropdown.jpg`. This is the step to use. |

## (d) What is wrong in the docs

1. **`docs/workers/brief-panel-2.md` acceptance 5:** `CARD.view(CARD.REG[6].scene)` throws — `CARD.view` takes the
   scene **name** (`harness.js:45`, HARNESS.md "`view(name)`"). Should read `CARD.view(CARD.REG[6].scene.name)`.
2. **`docs/HARNESS.md` "Real window"** has no sentence about the one thing a real window is needed for here: a
   `<select>`'s popup list is a separate X window and **`Page.captureScreenshot` never contains it**, `xwd -root` dies
   with `BadColor` while it is open, and the trusted `{"clickSel":…}` click is what opens it. Worth a line in
   "Pitfalls already paid for" next to the `gl.POINTS` one, together with: this box has no screenshot tool but `xwd`
   (python-Xlib + PIL is the way out, `tools/work/xshot.py`).
3. **`docs/HARNESS.md` "Routes and manual overrides"** still says `accept.sh` "== routes" runs *"a panel-open shot"* —
   the v0.4 report already flagged this and there is still no such line in `tools/accept.sh`. v0.4.1 adds three
   candidates: the E shot, the bid-only block and the preview round trip.
4. **`tools/check.js`'s literal-name checks name their two files by hand** (`assets/core/help.js`,
   `assets/core/panel.js`). `assets/core/panel-ui.js` is a third DOM view and is not covered — see the note at the top.
5. Minor: `docs/CONTRACTS.md` §1.15's preview paragraph says the panel's buttons *"set a constant route on the jack and
   put the previous route back after 2 s of the help view's ticks"*. It does not say that the previous route may be
   `null` (no route at all), which is the common case — the panel handles it (`setRoute(name, k, null)` clears) and the
   f432 line above proves it.

## Line counts

| file | lines | cap |
|---|---|---|
| `assets/core/panel.js` | **347** | 350 (check.js: 0 warn) |
| `assets/core/panel-ui.js` | **89** | new leaf, imports nothing |
| `index.html` | 107 → 119 (12 new CSS lines in the `#help` block) | — |
