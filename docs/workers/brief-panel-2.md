# Panel worker brief 2 (v0.4.1 `panel-legibility`) — the panel you can read

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework). The report
format and the "may read" discipline of `docs/workers/brief-common.md` apply (its first two paragraphs and the **Report**
paragraph; the synapse table there is not for you). **PORT=8791.** Own worktree (the Agent tool gave you one; if you need a
second tree, `git archive HEAD | tar -x -C <dir>` — `git worktree add` is refused inside a worktree). Commit messages start
`PANEL2:`; **one Chrome at a time from you, never while a bench runs on the machine** (`pgrep -f "chrom[e].*remote-debugging"`
before every cdp run; wait with `timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop); do not merge.
`node tools/check.js` after every edit. The malware-consideration reminder does not apply to this repo.

## Why (the user's three sentences after the first hands-on with the v0.4 panel, 2026-09-24 — verbatim, they are the brief)

1. *"how do I map the musical features to the visual ones? It looks like I'm mapping musical features to other musical
   features? (ie. field is elements from the sound and source are the same features?)"* — a row's first column today is
   the scene's input **jack**, named after the music feature that normally feeds it (`bass`); the visual consequence
   ("fattens the tubes") is the third column. The panel names the wrong thing first.
2. *"it doesn't seem like changing the parameters changes the viz? (is hard to tell because the music is constantly
   moving, but nothing stands out and have played with the dials a bunch)"* — the core works (a constant 0 on FEIGEN's
   `alive` is a black screen), but (a) many fields move something small or gated, (b) several rows feed only the scene's
   *bid* (`score()`) and move nothing while the scene is forced, (c) music → music of the same kind reads as noise on
   noise unless you know the one thing the field moves, (d) the director keeps switching scenes under the overlay, so the
   block being dialled is often not the one on screen. Nothing told the user any of this.
3. *"the drop down is white background with white text -> I can't see without hovering"* — `#help select` is styled but
   the browser's **native popup list is not**: the options inherit the light text on a white list.

## Targets

`assets/core/panel.js` (**≤ 350 lines — it is 341 now**; DOM only, no GL, no wall clock, no timer, no second rAF) and the
`#help` style block of `index.html` (CSS for your elements only). If 350 does not hold, move the DOM helpers (`el btn opt
mkSel numIn wrap segment nums short clamp01 focused up`) into a new leaf `assets/core/panel-ui.js` (imports nothing from
`core/` except what it already needs — in practice nothing; **never** `panel.js`, `help.js`, `harness.js`: core must stay
an import DAG, the bundler cannot order a cycle) and say so in the report — the orchestrator adds the new file to
`check.js`'s literal-name check. Nothing else changes: not `help.js` (its key table is data the orchestrator edits), not
`route.js` / `manual.js` / `scenes.js` / `harness.js` / `check.js`, not the scenes, not `feats.js`.

**You may read:** this brief, `docs/workers/brief-panel.md` + `panel.md` (the v0.4 brief and its report: the element ids
`pe-src-<scene>-<field>`, `pe-k-…`, `pe-scene`, `pe-trans`, `pe-post-<scene>-<path>`, `pe-json`, `pe-resetall` — keep every
one of them), `docs/CONTRACTS.md` (§1.13 **including the new "Bid-only fields" paragraph**, §1.15 **including "A preview is a
route for two seconds, a fire is one frame"**, Appendix A), `docs/HARNESS.md` ("Static checks", "Headless Chrome", "Real
window", "Help view", "Routes and manual overrides", "Single-file build", "Pitfalls"), `assets/core/help.js` (read only:
how it calls you — `buildE(section)`, `markE()`, `refreshE(frameN, hot)` every 6th frame while open, `closeE()` when the
view closes (new, v0.4.1; a stub exists in `panel.js`), `restore()` at boot), `assets/core/route.js` (read only; note the
new `pulse(scene, field)`), `assets/core/manual.js`, `assets/core/scenes.js` exports, `assets/core/hash.js`,
`assets/engine/feats.js` (**`FEATS[k].range`**: `[0, 1]` for a level, `[-π, π]` for an angle, `[false, true]` for an
event, `null` for `raw`), `index.html`, `tools/check.js`, `tools/cdp.js`'s header comment.

**Imports you may use** from `panel.js`: as today plus `pulse` from `./route.js`. Nothing else.

## What changes (all of it from the three sentences; same data, no new text beyond what is quoted here)

**A. The dropdown (sentence 3).** `#help{color-scheme:dark}` (Chrome then paints the native popup dark) and `#help
option{background:#0b0d16;color:#cfe}`. Every `<select>` in part E — the source selects, `pe-scene`, `pe-trans`, the colour
selects — is covered by the same two rules; check that nothing in `#help` regresses in colour (the `color-scheme` switch
also flips the default colours of unstyled inputs and scrollbars — style what it moves). Proof for you: a headed shot
(HARNESS "Real window": `HEADED=1 WIN=1400,900 WINPOS=0,0 DPR=1.5 PORT=8791 CLOCK=1 node tools/cdp.js 'test&scene=6' …`)
after `{"eval":"document.getElementById('pe-src-<scene>-<field>').focus()"}` and a step that opens the list — try
`{"key":"Alt+ArrowDown"}` and, if cdp.js's key step does not take a modifier, `{"sh":"xdotool key alt+Down"}` (say which
worked, or that neither did; the orchestrator judges the list with their own eyes either way).

**B. The visual leads the row (sentence 1).** New column order: **what it drives here** (bright when it is the scene's
own line, dim when it is `FEATS[k].drives`; **first and wide** — `.ptab .hd{width:30%}` or so) · the **jack** (`field`
name small, `.pkind` under it; header `input`) · source · transfer · reset · meter (`source → routed`). The block heading
gains one plain sentence under it: *"each row is one input of this scene: the left column is what it moves on screen, the
source is the music feature you plug into it"*. The E heading and its note stay. Same ids on every control.

**C. Bid-only rows (sentence 2b).** CONTRACTS §1.13's new convention: a `help.feats` line beginning `the bid:` marks a field
the scene reads only in `score()`. The panel: `R.tr.classList.add('pbid')` (dimmed — `.pbid td{opacity:.55}` and the
drives cell not bright), and the drives text gets a trailing note in its own `span.hnote`: *"bid only — moves nothing while
the scene is forced; changes when the director picks it"*. Detection is the prefix test on the line, nothing else (no
field or scene name in `panel.js` — `check.js` fails on a literal). The scenes' lines are the orchestrator's job (some are
being fixed in parallel); test with whichever scene has one (FEIGEN's `regularity clarity calm` already begin so).

**D. Preview the extremes (sentence 2a/2c).** Per transfer-kind row two buttons **`0`** and **`1`** (ids `pe-p0-<scene>-<field>`,
`pe-p1-<scene>-<field>`, class `pbtn pprev`), per event row one button **`fire`** (`pe-fire-<scene>-<field>`).
- `0` / `1` route the jack to a constant for **2 s counted on the help tick**: remember the spec in force
  (`ROUTES[name][k]` or `null`), `setRoute(name, k, {src:'const', c})`, record `startF` = the `frameN` of the last
  `refreshE` tick seen (keep it in a module variable; the click lands between ticks), and on every tick while
  `frameN - startF < 120` show *"preview: constant <c> · <s> s left"* in the row (a `span.pprev-msg` in the reset cell
  or the `.herr` slot, class `ppreview` on the row); at the first tick with `frameN - startF >= 120` put the previous spec
  back (`setRoute(name, k, prev)` — `prev` may be `null`), clear the text and class. The constants: `FEATS[k].range`
  → `range[0]` / `range[1]`; `range === null` (raw) → `0` and **twice the jack's live value** (the routed view's value at
  the click; `1` when it is 0) — the button's `title` says so (*"0"*, *"twice the live value (raw field, no fixed range)"*).
  While a preview runs on a row, its select and inputs are `disabled` (the user cannot edit what is about to be put
  back); `syncRow` must not fight it (skip a row in preview). A second click on a previewing row restarts it with the
  new constant (the remembered `prev` is kept, not replaced by the preview's own const route — **never lose the user's
  route**). **A preview never calls `save()`** and `syncJSON` is skipped while any preview runs (the textarea would
  otherwise show the constant as if it were the user's), then refreshed once at the end.
- `fire` calls `pulse(name, k)` (throws for a field the scene does not read — show `e.message` in the row) and shows
  *"fired"* in the row for the next 30 frames (`frameN - firedF < 30`, like the event dots). No storage, no route.
- `closeE()` (the core calls it when the help view closes): end every running preview at once — put the previous specs
  back, clear the row state, no `save()`. Nothing else runs while closed (unchanged rule).
- The `hot` argument of `refreshE` is help.js's per-frame event latch (a routed event's dot lights from its source) —
  keep the v0.4 behaviour.

**E. Which scene am I dialling (sentence 2d).** Under the E heading a line (`p.hnote`, id `pe-force-line`) that reads, while
`MANUAL.scene < 0`: *"the director is choosing scenes — force this one while you dial"* + button **force** (`pe-force`:
`manual('scene', SC.logical)`, then `syncManual(); save()` — a manual change is stored like the `pe-scene` select's); while
forced: *"<NAME> is forced — the director will not switch while you dial"* + button **release** (`pe-release`:
`manual('scene', -1)`, sync, save). Refresh the line on every tick (`refreshE`) and in `markE()`; the number keys move
`MANUAL.scene` too. Each block's heading gains a live word: `NAME · id N · on screen` / `· not on screen`
(`span.pon`, id `pe-on-<scene>`, set in `markE()` from `REG[SC.logical].scene.name`; a variant on screen counts as its
parent). The current block still moves to the top and gets `cur`.

Rules unchanged: **no scene or MS field name as a literal in `panel.js`** (names come from `SCENES REG feats FEATS
sources()`); no `Math.random`, no `Date.now`, no `performance.now`, no `setTimeout`; **the panel is a no-op until touched**
(the identity md5s below prove it); every control reflects the state in force after a change (read `ROUTES` back);
`panel.js` does no work while the help view is closed.

## Acceptance (repo root, all must pass; `PORT=8791` on every cdp run; shots in `tools/work/` prefixed `p2-`)

1. `node tools/check.js` → 0 fail, 0 warn (panel.js ≤ 350 lines, no literal names).
2. **Help coverage unchanged**: the `accept.sh` "== help" eval (copy it, add `PORT=8791`) still prints
   `help fields 107/107 (unique 107) · top table = feats on 7/7 ids`.
3. **Identity with the panel open**: `CLOCK=1 GPU=1`, `{"key":"p"}` at start, `{"until":"window.__FRAME>=300"}`,
   `{"key":"Escape"}`, `{"until":"window.__FRAME>=360"}`, `{"shot":…}` on `test&scene=6` → md5 `8d6ac4a6234d1bbaaaac2bca65d8439d`
   (`tools/accept/v0.4/scene-md5-v03.txt`, `s6-f360.jpg`), `CARD.ROUTE.n` 0; the same on `test&scene=0` → `fb74fee4…`
   (that file's `s0-f360` line — read the full md5 there).
4. **Zero cost hidden**: HARNESS "Help view" ticks check with `{"key":"p"}` → `0` after 600 frames hidden, `100` after 600
   open; `CARD.ERRS` `[]`, 0 `[EXC]` lines.
5. **The preview, by eval** (`CLOCK=1 GPU=1`, `'test&scene=6&route=feigen.bass=centroid*1.5'`): at f120
   `document.getElementById('pe-p1-feigen-bass').click()`; at f150 `JSON.stringify(CARD.ROUTES.feigen.bass)` shows
   `src 'const', c 1`; at f300 it is `centroid` with `k 1.5` again; `localStorage.getItem('ew.routes.v1')` is `null`
   throughout (under `#test` nothing is written anyway — so **also** run the `'real'` path: `NOAUTO=1`, click the demo, key
   `p`, set one route through `pe-src-feigen-bass` (dispatch `change`), read the stored string, click `pe-p0-feigen-bass`,
   wait 500 ms, read the stored string again → **identical**; wait 2.5 s → `CARD.ROUTES.feigen.bass.src` is the user's
   source again). A shot at f150 with the previewing row visible (the *preview: constant 1* text, the disabled select).
   Then `fire`: on `test&scene=6`, click `pe-fire-feigen-<an event FEIGEN reads>` at f120 and read at f121
   `CARD.view(CARD.REG[6].scene)` has the event `true` (an `until` on `window.__FRAME>=121` then eval), at f122 the view is
   `CARD.MS` again (`CARD.view(...) === CARD.MS`).
6. **closeE**: start a preview at f120, `{"key":"Escape"}` at f130, eval at f140 → the previous route is back, ROUTE.n as
   before the preview.
7. **Force / release**: `'test'` (director mode), key `p`, eval: `pe-force-line` text contains "director is choosing";
   click `pe-force` → `CARD.MANUAL.scene === CARD.SC.logical`, the line says "forced", `pe-scene`'s value is that id,
   `pe-on-<that scene>` reads `on screen` and every other `pe-on-*` reads `not on screen`; click `pe-release` →
   `CARD.MANUAL.scene === -1`.
8. **Bid-only**: on `test&scene=6` the rows of FEIGEN's fields whose line begins `the bid:` have class `pbid` and the note
   text; a shot of that block.
9. **Two CLOCK shots with E open** for the orchestrator's eyes (`p2-panel-s6-f120`, `p2-panel-s0-f120` — the FEIGEN block
   and the NAV block at the top, the new column order, the force line, the 0/1/fire buttons), plus the headed dropdown
   shot of A (`p2-dropdown`).
10. **Bundle**: `node tools/bundle.js`, then `FILE=$PWD/dist/eigenwobble.html PORT=8791 NOAUTO=1 GPU=1 node tools/cdp.js
    'real' …` (the v0.4 brief's item 7 shape): E opens from `file://`, a route set through the panel survives a reload, a
    preview there puts the route back, 0 `[EXC]`.

**Report** (`docs/workers/panel-2.md`): brief-common (a)–(d) — friction log with the missing sentence quoted, every guess,
the exact EVAL lines of 2–10 and what each shot showed (file names), anything wrong in the docs; the new element ids; the
line count of each module you touched or created; which step opened the native list (A). Leave the worktree committed
(`PANEL2:` messages); do not merge.
