# Panel worker brief (v0.4 item 3, `panel-ui`) — the routes control panel, part E of the `?` help view

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework). The
report format and the "may read" discipline of `docs/workers/brief-common.md` apply (read its first two paragraphs and
the **Report** paragraph; the synapse table there is not for you). PORT=8790. Own worktree (if `git worktree add` is
refused inside an agent worktree, `git archive HEAD | tar -x -C <dir>`); commit messages start `PANEL:`; **one Chrome
at a time from you, never while a bench runs on the machine**; do not merge. `node tools/check.js` after every edit.

**Target:** `assets/core/panel.js` (**≤ 350 lines, DOM only, no GL, no wall clock**) and the `#help` style block of
`index.html` (CSS for your elements only — reuse the existing `.htab .hk .hd .hl .hbar .hfill .hnote .hcast .cur .hdl`
classes where they fit). A stub `panel.js` exists with the four exports the core calls; keep their names. Nothing else
in `core/` changes: `help.js` already gives you a `<section id="helpE">` and calls you; `hud.js` already maps key `p`;
`harness.js` already calls `restore()` at boot when not under `#test`.

**You may read:** this brief, `docs/CONTRACTS.md` (§0, §1 the scene object — `feats`, `post`, `colour`, `help.feats`;
§1.4 "Per-scene post params" and "Colour variants"; **§1.13 the help view; §1.15 routes**; Appendix A), `docs/HARNESS.md`
("Static checks", "Headless Chrome", "Help view", **"Routes and manual overrides"**, "Single-file build", "Pitfalls"),
`assets/core/help.js` (how part A builds its rows and refreshes live values — the shape to follow; you may not edit it),
`assets/core/route.js`, `assets/core/manual.js`, `assets/core/hash.js` (the modules you import; read them, never edit
them), `assets/engine/feats.js` (the schema; never edit), `index.html`, `tools/check.js`, `tools/cdp.js`'s header
comment, and `assets/core/hud.js` for the key table. Not the scenes, not `engine/` beyond `feats.js`/`state.js`, not
`scenes.js` beyond its exports named below, not `harness.js`.

**Imports you may use** (all from `assets/core/panel.js`; anything else → friction log): `FEATS` from
`../engine/feats.js`; `MS` from `../engine/state.js`; `SC, REG, SCENES, TRANSITIONS` from `./scenes.js`;
`ROUTES, ROUTE, view, sources, setRoute, clearRoutes, routesJSON, loadRoutes, kindOf` from `./route.js`;
`MANUAL, manual, clearPost, resetManual, POST_PARAMS` from `./manual.js`; `TEST` from `./hash.js`. **Never** `help.js`
or `harness.js` (a cycle — the bundler cannot order it) and never `gl.js`.

## What the core calls

- `buildE(section)` — once, on the first open of the help view, with the empty `<section id="helpE">`. Build everything
  here (the DOM stays; nothing is rebuilt per frame).
- `markE()` — when the logical scene changes while the view is open: mark the current scene's block (class `cur`, as
  part C does) and move it to the top of the list (the current scene first).
- `refreshE(frameN)` — on the help view's tick, every 6th frame while open (`CARD.HELP.ticks` counts them: 100/600
  open, 0/600 hidden). Update **only** the live meters and the read-only readouts here; do not rebuild, do not touch
  inputs the user may be editing. **Do not add a second `requestAnimationFrame` or any timer.**
- `restore()` — at boot (not under `#test`): load the `localStorage` preset if there is one (`loadRoutes`), swallowing
  and logging (`console.warn`) a preset that no longer parses (a renamed scene) rather than throwing.

## Part E — what it shows (all text from `feats.js` and the scenes; none re-typed in `panel.js`)

Heading `E · routes — which music feature drives which field, by hand` and one note line (the identity promise: with
no route set the panel is a no-op; a route keeps the field's kind; a constant is a manual setting).

1. **One block per registered scene** (`SCENES`, the current logical scene first and marked): heading `NAME · id N`
   (`REG[id]`'s `scene.name` upper-cased as part C does; a variant is not a block — it reads its parent's fields).
   Then one row per field of `scene.feats` **that is routable** (`sources(k).length > 0`), FEATS order as part A
   (walk `FEATS` keys, keep those in `feats`), with columns:
   - the field name (`.hk`) and its kind;
   - the "what it drives here" clause: `(scene.help && scene.help.feats && scene.help.feats[k]) || FEATS[k].drives`,
     bright when it is the scene's own line, dimmed when it is the schema's fallback (exactly part A's rule);
   - a source `<select>`: first option `— (engine)` = no route, then every name from `sources(k)` (same-kind fields,
     itself included, `const` last for the transfer kinds); for an event field only events, no `const`;
   - for the transfer kinds: gain `k` (number, step .05, default 1), offset `b` (step .05, default 0), `τ` seconds
     (step .05, min 0, default 0), an invert checkbox; a constant value `c` input shown only while `const` is selected;
     for an event field none of these (an event routes as a boolean, no transfer);
   - a per-row **reset** (`setRoute(scene, k, null)`);
   - a **two-segment live meter**: source value → routed value. Levels: two bars (`.hbar/.hfill`, 0..1) with the
     numbers; raw/angle: the two numbers only (unbounded); events: two dots, lit for half a second after firing (latch
     the frame as help.js does with `hot`). Source = `MS[spec.src]` (or `c`), routed = `view(scene)[k]`; with no route
     both are `MS[k]` and the meter still runs (it is then a readout).
   Any change on a row → build the spec from the row's controls → `setRoute(scene, k, spec)`; if it throws, show the
   message in the row (`.herr`, red) and put the controls back to the route in force. The non-routable fields of
   `feats` (vector / enum / count) are listed in one dim line under the block: `not routable: chroma, seed, arc`.
   Per block: **copy to all scenes** (for every other scene and every routed field of this block that the other scene
   also lists in `feats`, `setRoute` the same spec; count what was copied, show it) and **reset scene**
   (`clearRoutes(scene)`). Above the blocks: **reset everything** (`clearRoutes()` + `resetManual()`).
2. **Manual** (a sub-heading `manual overrides` — the same things the keys do): forced scene `<select>` (`auto` +
   every `REG` entry including variants, `id · NAME [/ VARIANT]`, current = `MANUAL.scene`), transition `<select>`
   (`Object.keys(TRANSITIONS)`, current = `MANUAL.trans`), per scene that declares `colour` a variant `<select>`
   (`Object.keys(scene.colour.variants)`, current = `scene.colour.cur`; set via `manual('colour', name, variant)`),
   and per scene the four post params (`POST_PARAMS`: `bloom.thr fb.decay kaleido exposure.on`): a number input each
   (a checkbox for `exposure.on`) whose **empty state means "the scene's own value"** — placeholder = the scene's own
   value when `scene.post` (or the current colour variant's `post`) holds a number there, `fn` when it is a function,
   `—` when unset; a typed value → `manual('post', name, path, v)`, cleared → `manual('post', name, path, null)`.
   `MANUAL.scene` and `MANUAL.trans` are live views of the director's own state (the keys `1–9`/`0` change them too):
   `refreshE` re-reads them into the selects when they differ (unless the select has focus).
3. **Presets** (sub-heading): a `<textarea>` holding `routesJSON()` (refreshed after every change made through the
   panel and on `refreshE` while it does not have focus), **load** (`loadRoutes(textarea.value)`; an error shows under
   it, nothing else changes — the core checks the whole preset before applying it), **copy** (clipboard, with a
   fallback of selecting the text), and the storage line: `localStorage['ew.routes.v1']` **autosaved on every change
   made through the panel** (routes, manual, load, resets) and loaded by `restore()` at boot — **never under `#test`**
   (`TEST` from `hash.js`: neither read nor written there, so the harness shots stay deterministic; say so in a note
   line of the panel). Wrap every storage access in try/catch (a private window throws).

Rules: **no `'nav'` (or any scene or field name) as a literal in `panel.js`** — names come from `SCENES`, `REG`,
`feats`, `FEATS`, `sources()` (`check.js` fails on a quoted `FEATS` key or scene name in `panel.js`); no `Math.random`,
no `Date.now`; the panel must be a no-op until touched (the identity md5s below are the proof); every control reflects
the state in force after a change (read `ROUTES[name][k]` back — never trust the input alone); `panel.js` does no work
while the help view is closed (nothing of yours runs outside the four calls above).

## Acceptance (repo root, all must pass; `PORT=8790` on every cdp run)

1. `node tools/check.js` → 0 fail (panel.js ≤ 350 lines, no literal names).
2. **Help coverage unchanged**: the `accept.sh` "== help" eval (copy it from `tools/accept.sh`, add `PORT=8790`) still
   prints `help fields 107/107 (unique 107) · top table = feats on 6/6 ids` — part A is untouched by your section.
3. **Two CLOCK shots with E open**, read them:
   ```
   PORT=8790 CLOCK=1 GPU=1 node tools/cdp.js 'test' '[{"until":"window.CARD"},{"key":"p"},{"until":"window.__FRAME>=120"},{"eval":"document.getElementById(\"helpE\").scrollIntoView();\"E at \"+document.getElementById(\"help\").scrollTop"},{"shot":"work/panel-s0-f120"}]'
   ```
   → NAV's block first and marked, its rows with selects and running meters, the manual and preset sections below
   (scroll as needed for a second shot of them). Then on FEIGEN at f360 with **two routes set through the panel's own
   controls** (drive them by eval: set the `<select>` value and dispatch `new Event('change')`, type into the gain
   input and dispatch `input`/`change`) — e.g. `bass ← centroid` gain 1.5 and `kick ← snare` — then read back
   `JSON.stringify(CARD.ROUTES)` and `CARD.routesString()` and shoot: the two rows show their source, the meters show
   two different values (source → routed), the textarea shows the JSON. Say in the report which elements you drove
   and print the read-back.
4. **Identity with the panel open**: under `CLOCK=1`, `{"key":"p"}` at start, `{"until":"window.__FRAME>=300"}`,
   `{"key":"Escape"}`, `{"until":"window.__FRAME>=360"}`, `{"shot":…}` on `test&scene=6` → the md5 equals
   `tools/accept/v0.4/scene-md5-v03.txt`'s `s6-f360.jpg` line (`8d6ac4a6234d1bbaaaac2bca65d8439d`; the overlay is DOM,
   the canvas underneath never changed), and `CARD.ROUTE.n` is 0. The same on `test&scene=0` (`fb74fee4…`).
5. **Zero cost hidden**: the HARNESS "Help view" ticks check → `0` after 600 frames hidden, `100` after 600 open with
   E built (`{"key":"p"}` instead of `h`); `CARD.ERRS` `[]`, 0 `[EXC]` lines.
6. **Storage**: `PORT=8790 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":3000},{"key":"p"},{"wait":500},{"eval":"<set one route through the panel>"},{"eval":"localStorage.getItem(\"ew.routes.v1\")"},{"eval":"location.reload();\"reloaded\""},{"wait":4000},{"eval":"JSON.stringify(CARD.ROUTES)"}]'`
   → the route is back after the reload (note: the landing card is shown again after a reload; `CARD.ROUTES` is
   readable without starting the music). Then the same page under `'test'` with the same user-data-dir is not
   possible (cdp.js uses a fresh profile per run) — instead prove the `#test` rule by eval: under `'test'`, after
   setting a route through the panel, `localStorage.getItem("ew.routes.v1")` is `null`, and `restore()` was not
   called (`CARD.ROUTE.n` 0 at `window.CARD` before any key).
7. **Bundle**: `node tools/bundle.js`, then `FILE=$PWD/dist/eigenwobble.html PORT=8790 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":3000},{"key":"p"},{"wait":1000},{"shot":"work/panel-bundle"},{"eval":"<set one route through the panel>;JSON.stringify(CARD.ROUTES)"},{"eval":"location.reload();1"},{"wait":4000},{"eval":"JSON.stringify(CARD.ROUTES)+\" errs \"+JSON.stringify(CARD.ERRS)"}]'`
   → E opens from `file://`, the route survives the reload, 0 `[EXC]`.
8. `help.js`'s part D key table is data in `help.js` — do not edit it; note in the report that `p` belongs there (the
   orchestrator adds the line).

**Report** (`docs/workers/panel.md`): brief-common (a)–(d) — friction log with the missing sentence quoted, every
guess, the exact EVAL lines of 2–7 and what each shot showed, anything wrong in the docs; plus the list of elements
and ids you created (so the orchestrator's real-window check can drive them), the line count, and the storage key's
JSON as saved. Leave the worktree committed; do not merge.
