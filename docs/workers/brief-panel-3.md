# Panel worker brief 3 (v0.5 `params`) — the parameters table: route music into what the eye sees

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework). The report
format and the "may read" discipline of `docs/workers/brief-common.md` apply (its first two paragraphs and the **Report**
paragraph; the synapse table there is not for you). **PORT=8795** on every `tools/cdp.js` run (a stray server on 8765
serves another checkout — never the default). Own worktree (the Agent tool gave you one; `git worktree add` is refused
inside it — `git archive HEAD | tar -x -C <dir>`). Commit messages start `PANEL3:`; **one Chrome at a time from you, never
while a bench runs on the machine** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run; wait with `timeout 500
tail -f <log> | grep -q -m1 GO`, never a sleepless loop); do not merge. `node tools/check.js` after every edit. The
malware-consideration reminder does not apply to this repo.

## Why (the user, 2026-09-24 — verbatim, it is the brief)

*"how do I map the musical features to the visual ones? It looks like I'm mapping musical features to other musical
features? (ie. field is elements from the sound and source are the same features?)"* — v0.4.1 made the row name the
visual first, but the *target* of a route is still a music-feature jack. v0.5 adds the second level: a scene declares
its **visual parameters** (`params`, CONTRACTS **§1.16**: name · `eli5` · `range` · `from(S)` the default derivation) and
the core routes music into those (`assets/core/params.js`: `PROUTES[scene][param] = {src | 'const', c, k, b, inv, tau}`,
the transfer in the parameter's unit interval, the range scales it). FEIGEN and NAV declare parameters now (three to five
each — read their `params` blocks; other scenes have none yet). The panel must let the user say **"in FEIGEN, the
filament sharpness is fed by the centroid"** and see it.

## Targets

A **new leaf** `assets/core/panel-params.js` (≤ 350 lines; DOM only; imports **only** `./panel-ui.js`, `./params.js`,
`./route.js` (for `view` if you need it), `../engine/feats.js`, `../engine/state.js` — never `panel.js`, `help.js`,
`harness.js`, `scenes.js`: core must stay an import DAG, the bundler cannot order a cycle) that builds one scene's
parameters table and refreshes it; `assets/core/panel.js` (**347 lines — you may add at most 3 net lines there**: the
import, the call that puts the table into the block, the call on the tick; move helpers into `panel-ui.js` if you need
room, saying so); the `#help` style block of `index.html` (CSS for your elements only). Nothing else: not `help.js`,
`route.js`, `params.js`, `manual.js`, `scenes.js`, `harness.js`, `check.js` (it already checks your new file for literal
names), not the scenes, not `feats.js`.

**You may read:** this brief, `docs/workers/brief-panel-2.md` + `panel-2.md` (the ids `pe-src/k/b/tau/inv/c/r/p0/p1/fire-
<scene>-<field>`, `pe-force`, `pe-release`, `pe-force-line`, `pe-on-<scene>`, `pe-scene`, `pe-trans`, `pe-post-<scene>-
<path>`, `pe-json`, `pe-resetall` — keep every one; and its friction log: the popup / xwd / windowactivate pitfalls),
`docs/CONTRACTS.md` (§1.13, §1.15, **§1.16**, §1.4, Appendix A), `docs/HARNESS.md` ("Static checks", "Headless Chrome",
"Real window", "Help view", "Routes and manual overrides", **"Params"**, "Single-file build", "Pitfalls"),
`assets/core/params.js` (the API: `PROUTES PROUTE setParam clearParams paramsOf paramDeps derived paramSources paramU
hasParams`), `assets/core/route.js` (read only), `assets/core/panel.js` + `panel-ui.js` (yours to extend), `assets/core/
help.js` (read only — how the tick reaches you), `assets/core/hash.js`, `assets/engine/feats.js` (`FEATS[k].kind` for the
source list's labels), `assets/scenes/feigen/index.js` + `assets/scenes/nav/index.js` **`params` blocks only** (`grep -n
params -A 12`), `index.html`, `tools/check.js`, `tools/param-smoke.js`, `tools/cdp.js`'s header comment.

## What changes

**A. A parameters table per scene block, above the jacks table** (only for a scene with `hasParams(sc)`). Heading line
under the block's `h3`: *"what the eye sees on this scene, and what feeds it — the second level; the inputs behind these
are below"*. Columns: **what it moves** (`eli5`, bright, first and wide) · **parameter** (its name small, `[lo, hi]` under
it in `.pkind`) · **source** (a `<select>`, id `pe-psrc-<scene>-<param>`: the first option, value `''`, reads
*"derived: <paramDeps joined by ', '>"* — or *"derived: constant"* when the list is empty; then every `paramSources()`
entry, its `FEATS[k].kind` in the label (`centroid · level`, `onset · event`, `rms · raw`), `const` last) · **transfer**
(`k` `pe-pk-…`, `b` `pe-pb-…`, `τ` `pe-ptau-…`, invert `pe-pinv-…` for a field source; a `c` number input `pe-pc-…` with
`min`/`max` = the range and a sensible `step` for `const`; the transfer inputs are shown for the source's kind exactly as
the jacks table does, plus: a `const` source hides `k b inv`, keeps `τ`) · **reset** (`pe-prst-…`, plus two preview
buttons **`lo`** / **`hi`** (`pe-plo-…`, `pe-phi-…`, class `pbtn pprev`) that set a **constant route at `range[0]` /
`range[1]` for 2 s of help ticks** and put the previous spec back — the exact mechanism of the v0.4.1 previews (`PREV
120` ticks, disabled controls, no `save()`, `syncJSON` skipped while any preview runs, `closeE()` ends it); reuse the
existing preview code by generalising it (a row object with `set`/`get` closures) rather than copying it) · **meter**
(`derived → in force`: two segments as the jacks' meter — the left is `derived(sc, p)` (always live, so the user sees what
the music *would* do), the right `paramsOf(sc)[p]`; both bars scaled to the range: `(v − lo) / (hi − lo)`; the number
text is the value). A row whose parameter is routed gets class `prouted`; while unrouted the two meter values are equal
by construction — the panel proves it every tick.

**B. The jacks table folds under a `<details>`** (id `pe-pdet-<scene>`, `summary` *"the inputs behind these — N jacks"*)
for a scene with params; **open by default** for a scene without params (then no `details` at all — the v0.4.1 layout
untouched, the ids untouched). Inside, nothing changes (rows, previews, ids).

**C. Set / read back / store:** a change on any control → `setParam(name, p, spec | null)` (errors → the row's `.herr`
as the jacks do), then re-read `PROUTES` into the controls (never trust the input); every change calls the panel's
`save()` (the preset JSON already carries the `params` block through `routesJSON()` — storage key unchanged,
`restore()` unchanged: `loadRoutes` sets the block). "reset scene" also calls `clearParams(name)`; "reset everything"
also `clearParams()`; "copy to all scenes" copies a param route only to a scene that declares a parameter of the same
name (`try { setParam … } catch` per target, counted in the message).

**D. The tick:** `refreshE(frameN, hot)` refreshes your rows (meters, previews, the derived value) — one call from
`panel.js` into your module per tick; nothing runs while the view is closed. The row's `hot` handling: a param routed
from an **event** lights its meter's left segment from `hot[src]` like the jacks (the value itself is 0/1 and the τ
tail shows on the right).

Rules unchanged: **no scene or MS field name as a literal in `panel-params.js` or `panel.js`** (`check.js` fails); no
`Math.random`, `Date.now`, `performance.now`, `setTimeout`, no second rAF; **the panel is a no-op until touched** (the
identity md5s prove it); every control reflects the state in force after a change; the visual leads the row.

## Acceptance (repo root, all must pass; `PORT=8795` on every cdp run; shots in `tools/work/` prefixed `p3-`)

1. `node tools/check.js` → 0 fail, no new warn (`panel-params.js` ≤ 350, `panel.js` ≤ 350, no literal names).
2. **Help coverage unchanged**: the `accept.sh` "== help" eval (copy it, add `PORT=8795`) still prints `help fields 107/107
   (unique 107) · top table = feats on 7/7 ids`.
3. **Identity with the panel open**: `CLOCK=1 GPU=1`, `{"key":"p"}` at start, `{"until":"window.__FRAME>=300"}`, `{"key":
   "Escape"}`, `{"until":"window.__FRAME>=360"}`, `{"shot":…}` on `test&scene=6` → the `s6-f360` md5 of `tools/accept/v0.5/
   scene-md5-v03.txt`; on `test&scene=0` → its `s0-f360` md5; `CARD.PROUTE.n` 0, `CARD.ROUTE.n` 0.
4. **Set through the panel, by eval** (`CLOCK=1 GPU=1 'test&scene=6'`, key `p`, f120): pick FEIGEN's first parameter `P`
   (read it from `Object.keys(CARD.REG[6].scene.params)[0]`), set `pe-psrc-feigen-P` to `centroid` (dispatch `change`),
   `pe-pk-feigen-P` to `1.5` (dispatch `change`); at f126 `JSON.stringify(CARD.PROUTES.feigen)` shows `{P: {src:'centroid',
   k:1.5,…}}` and the row has class `prouted`; the meter's right value equals `CARD.paramsOf('feigen')[P]` and the left equals
   `CARD.derived('feigen', P)` (read both from the DOM and from CARD, print all four); a shot at f126 of the block. Then
   `pe-prst-feigen-P` → `CARD.PROUTE.n` 0, the row unrouted, both meter values equal.
5. **Preview**: click `pe-phi-feigen-P` at f130; at f136 `CARD.PROUTES.feigen[P]` is `{src:'const', c: range[1]}`; at f300
   the previous spec is back (`null` → no entry) and `PROUTE.n` 0; `localStorage.getItem('ew.routes.v1')` null throughout.
   Escape mid-preview (a second run) puts it back at once.
6. **Storage on the `'real'` path** (`NOAUTO=1`, click the demo, key `p`): set one param route through the controls, read the
   stored string (the `params` block present), reload, key `p`: the row shows the route, `CARD.PROUTES` has it; "reset
   everything" → `PROUTES` `{}`, the stored string's `params` block `{}`.
7. **The details**: on `test&scene=6` `pe-pdet-feigen` exists and is closed at build; a scene without params (id 1) has no
   `pe-pdet-dust` and its jacks table is as before (same ids present).
8. **The user's sentence in a real window** (HARNESS "Real window": `HEADED=1 WIN=1400,900 WINPOS=0,0 DPR=1.5 PORT=8795 CLOCK=1
   node tools/cdp.js 'test&scene=6' …`): the FEIGEN block with one parameter routed from `centroid` and the meters moving —
   two shots 60 frames apart (`p3-real-1`, `p3-real-2`), the routed row visible. Say in one sentence what the row reads.
9. **Two CLOCK shots with E open** for the orchestrator's eyes (`p3-panel-s6-f120`, `p3-panel-s0-f120` — the parameters table
   above the folded jacks, the column order, the lo/hi buttons, the meters).
10. **Bundle**: `node tools/bundle.js`; `FILE=$PWD/dist/eigenwobble.html PORT=8795 NOAUTO=1 GPU=1 node tools/cdp.js 'real' …`
    (the v0.4.1 brief's item 10 shape): E opens from `file://`, a param route set through the panel survives a reload, 0 `[EXC]`.

**Report** (`docs/workers/panel-3.md`): brief-common (a)–(d) — friction log with the missing sentence quoted, every guess,
the exact EVAL lines of 2–10 and what each shot showed (file names), anything wrong in the docs (§1.16 is new — say
what it did not tell you); the new element ids; the line count of each module you touched or created. Leave the worktree
committed (`PANEL3:` messages); do not merge.
