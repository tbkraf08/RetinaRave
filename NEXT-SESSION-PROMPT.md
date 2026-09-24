# Fable Session Prompt — Eigenwobble v0.4 "routes": a control panel that maps music features to visuals by hand (written 2026-09-24 at the v0.3 tag, after an interview with the user)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.3 is tagged** (`git tag v0.3`, `releases/eigenwobble-v0.3.html`, sweep
`tools/accept/v0.3/accept-29.txt` 0 FAIL, audit `docs/AUDIT-v0.3.md`, DECISIONS §26). v0.4 is one feature, decided with
the user on 2026-09-24: **a control panel where the user picks, by hand, which music feature drives which visual** — and
the manual overrides that already exist as keys gathered into the same panel. The earlier v0.4 candidate list (NEWTON,
NAV's iteration budget, a colour slot on every scene, the chain's k) moved to `V05-CANDIDATES-SESSION-PROMPT.md`.

**Read first:** `docs/CONTRACTS.md` (§0, §1 the scene contract — `feats`, `update(dt, MS, …)`, §1.4 slots incl. "Colour
variants" and "Hooks" — both changed in §26, §1.5 LOOK/GROOVE, §1.13 the help view, Appendix A the `MS` vocabulary and
`FEATS` kinds) · `docs/ENGINE.md` (what `MS` is, how stages write it) · `docs/HARNESS.md` ("Static checks", "Headless
Chrome", "Help view", "Real window", "Pitfalls") · `docs/DECISIONS.md` §12 (the help view), §17, §26 (how v0.3 was run) ·
`assets/core/help.js` (part A: one row per `feats` field with its live value — the panel's rows come from the same place)
· `assets/core/scenes.js` (`register`, `updateScenes`, `renderScene`, `postOf`, `setColour`) · `assets/engine/feats.js`
(`FEATS[k].kind`) · memory notes `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`
and `feedback_colour_default.md`.

## The design (the user's answers, 2026-09-24 — these are decisions, not options)

- **Level:** per scene, at the music-field level. "In FEIGEN, `bass` is fed by `centroid`." The core hands each scene
  a *routed view* of `MS`; scenes are not touched; all six get it at once. Per-visual-parameter routing (a scene
  declaring its visual parameters as a slot) is the follow-on milestone, not this one.
- **Sources:** any `MS` field of the same kind, or a constant. Not LOOK/GROOVE, not mixes of two fields.
- **Transfer per route:** gain, offset, invert, smoothing (an ema with a time constant, on `dt`). No curves.
- **The same panel holds the manual overrides:** forced scene, transition, colour variant, and the per-scene `post`
  params (bloom thr, fb decay, kaleido, exposure on/off).
- **The director is off limits** this milestone (routes feed scenes, not `pickScene`).
- **Where:** a new part **E · routes** of the existing `?` help overlay; key **`p`** opens the help scrolled to it.
  Dropdowns per row plus a small live meter (source value → routed value) per route.
- **Persistence:** `localStorage` autosave, JSON export/import in the panel, and a **hash form for the harness**
  (`&route=…`, `&post=…`) — under `#test` storage is ignored so shots stay deterministic.
- **Reset:** per route, per scene, global.
- **Identity default (non-negotiable):** with no routes set every reference md5 and `parity.js fake` are unchanged —
  the panel is a no-op until touched. **Cost:** no measurable `ENGINE.ms` change (< 0.05 ms with ten routes).
  **Bundle:** works in the single-file `file://` build like the help view.
- **Who:** core routing + harness + contract + proofs by the orchestrator; the panel UI by a worker from a brief in
  `docs/workers/`.

## The list (priority order)

1. **`route-core` (orchestrator; `assets/core/route.js`, `scenes.js`, `harness.js`, CONTRACTS §1.15).**
   - `ROUTES[sceneName][field] = { src: '<MS field>' | 'const', c, k, b, inv, tau }`; defaults k 1, b 0, inv false,
     tau 0, c 0. Kinds from `FEATS[k].kind`: a `level` field routes from any `level` field or a constant; an `event`
     (boolean) only from another event, no transfer; strings, counts and arrays (`chroma`, `wave`, `seed`) are not
     routable — the panel never offers them. `inv` = `1 − x` for levels. Smoothing is an ema on the routed value with
     `tau` seconds on `dt` (no wall clock).
   - **The view:** a scene with no routes receives `MS` itself (the same object — identity by construction, zero cost).
     A scene with routes receives a per-scene object built once with `Object.create(MS)` (unrouted fields fall through
     the prototype) whose routed fields are own properties refreshed every frame before `update`; the same view goes to
     `draw`-time reads (scenes hold what they read in `update`, but hand the view wherever the core hands `MS` to a
     scene: `update`, `score`, `post` fn, `look`), never to transitions/effects/director (`io.MS` stays the real `MS`).
   - API: `setRoute(scene, field, spec | null)`, `clearRoutes(scene?)`, `routesJSON()` / `loadRoutes(json)`,
     `CARD.ROUTES`, `CARD.route(...)`. Hash under `#test`: `&route=feigen.bass=centroid*1.5+0.1~0.2!` — grammar
     `scene.field=src[*k][+b|-b][~tau][!]`, a constant `scene.field=c:0.4`, several separated by `,`; an unknown scene,
     field, source or kind mismatch throws (a typo must not pass silently, as `&colour=` does).
   - Proofs, all in the commit that claims the item: `check.js` 0 fail; `tools/scene-md5.sh` identical to
     `scene-md5-v03.txt` and (with `&colour=oklch`) `scene-md5-v03-oklch.txt` with the module loaded and no routes;
     mixs md5 `5892ddc5…` unchanged; `parity.js fake` 0 diff; **the view path is exact:** `&route=feigen.bass=bass`
     (an identity route through the view) leaves s6's md5 identical, `&route=feigen.bass=high` changes it (say which
     md5s); `tools/route-smoke.js` (node, no DOM): parse/serialise round-trip, kind rules, the ema, prototype
     fall-through, an unknown name throws; `ENGINE.ms` and `CARD.bench(6,300)` unchanged with ten routes on FEIGEN
     (HARNESS "Bench protocol" — back to back, interleaved).
2. **`manual-core` (orchestrator).** One place for the overrides the keys already do: `MANUAL = { scene, trans, colour,
   post: { [sceneName]: { bloom: {thr}, fb: {decay}, kaleido, exposure: {on} } } }` in `core/manual.js`; `postOf`
   merges `MANUAL.post[scene]` over the resolved post (after the colour variant's); `&post=feigen.bloom.thr=0.3,
   nav.kaleido=0` under `#test`; `CARD.MANUAL`, `CARD.manual(...)`; `routesJSON()` carries the manual block too.
   Proofs: md5 identity with nothing set; `&post=feigen.bloom.thr=2` changes s6's md5 (bloom off) and `=0.3` (the v2
   default's value) leaves it identical; parity 0 diff; `check.js` fails on `'nav'` in core as always — the names in
   `MANUAL` come from `REG`, never literals.
3. **`panel-ui` (worker, brief `docs/workers/brief-panel.md`; `assets/core/panel.js` ≤ 350 lines, DOM only, no GL).**
   Part E of `#help`: for every registered scene (the current one first, marked as part C marks it) one block with a
   row per `feats` field: the field's name + `help.feats[k]` clause (from part A's data, not re-typed), a source
   `<select>` (same-kind `MS` fields + `const`), gain / offset / tau inputs, an invert checkbox, a reset button, and
   a two-segment live meter (source → routed) updated on the help view's tick (`HELP.ticks`, 100/600 open — do not
   add a second rAF). Per-scene "copy to all scenes" and "reset scene"; a global reset. Below it the **manual**
   section: scene (incl. auto), transition (`CARD.TRANSITIONS`), colour variant per scene that declares one, the four
   post params per scene. Then **presets**: a textarea with `routesJSON()`, "load", "copy", `localStorage`
   (`ew.routes.v1`) autosave on change and load on start — **not under `#test`**. Key `p` opens the help at E (`h`/`?`
   unchanged, `Esc` closes). All text from `feats.js`/scenes; `'nav'` must not appear in `panel.js`; every `MS`
   field name the panel shows must be in `FEATS` (`check.js`). Acceptance in the brief: `check.js` 0 fail; the help
   coverage evals unchanged (`CARD.HELP.rows()` 107/107); a CLOCK shot with E open at f120 on NAV and one at f360 on
   FEIGEN with two routes set through the panel (drive the `<select>` by eval, then read `CARD.ROUTES`); the md5s of
   the *canvas* unchanged with the panel open and no routes (the overlay is DOM); `panel.js` costs nothing when the
   help is closed (`HELP.ticks` 0/600 hidden); the bundle from `file://` opens E and a route set there survives a
   reload (storage) and is ignored under `#test`.
4. **Persistence + harness closure (orchestrator).** `&route=`/`&post=` documented in HARNESS ("Routes" section with
   the grammar and the identity/route md5 pair), CONTRACTS §1.15 "Routes" (what a scene may assume: its `MS` view
   may be routed; a scene must not cache `MS` fields across frames on its own object — say which scenes do and fix
   them in place if any), `accept.sh` "== routes" (identity md5 pair + the smoke + a panel-open shot), the MS
   appendix regenerated if `feats.js` gains text.
5. **Real window + ship.** A headed check in the shape of `AUDIT-v0.3.md` §2: a real track through capture, open `p`,
   route FEIGEN's `bass` ← `centroid` and NAV's `hit` ← `snare` while it plays, meters move, no frame > 100 ms, the
   route survives a scene switch and a resume; `docs/AUDIT-v0.4.md` (short). Then `GPU=1 tools/accept.sh` 0 FAIL →
   DECISIONS §27 "routes" (design, proofs, the per-parameter follow-on as the next milestone's first line) → `git tag
   v0.4` → `releases/eigenwobble-v0.4.html` → `NEXT-SESSION-PROMPT.md` = v0.5 from `V05-CANDIDATES-SESSION-PROMPT.md`
   with "per-visual-parameter routes" added at the top.

## Working style (unchanged — DECISIONS §26 "how v0.3 was run")

Orchestrator owns core/engine/contracts/parity/harness; UI and scenes go to a worker in an isolated worktree from a
brief in `docs/workers/` (opus, own `PORT=`, one Chrome each, **never more than two Chrome instances on the machine, none
while a Q trace or a bench runs**; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`). `node tools/check.js` after
every edit; `GPU=1 node tools/parity.js fake` 0 diff after any core/engine change; `tools/scene-md5.sh` before/after
any core change against `tools/accept/v0.3/scene-md5-v03.txt` (v2) and `scene-md5-v03-oklch.txt` (`&colour=oklch`);
the mixs md5 `5892ddc5…`; every trace tool writes to `tools/accept/${ACC:-v0.4}` — set `ACC=v0.4` and copy the md5
lists there in the first commit; `GPU=1 tools/accept.sh` 0 FAIL before a commit that claims an item. A worker's
screenshots are judged by the orchestrator's eyes before a merge; say in the brief what the shot must show. Pitfalls:
HARNESS "Pitfalls" + the memory note — hash hooks fire **after `init`**, `CARD.hooks` is a flat map
(`REG[id].scene.hooks`); a synchronous `CARD.bench` in a probed page stamps a long frame and a fake drop (bench after
the reading); `git worktree add` is refused inside an agent worktree (`git archive | tar -x`); `FILE=` absolute; a
`pgrep -f` pattern with `[a-z]*` matches its own shell; the music must be in its own window; a hidden-tab finding
needs a no-hide control before it is an artefact. The malware-consideration reminder does not apply to this repo.

Non-negotiables: zero deps · native modules · **every visual parameter traces to `MS`** (a routed field still does; a
constant is a manual setting, shown as one) · no `Math.random()`, no wall clock · module cap 350/500 · `parity.js fake`
0 diff · the reference md5s unchanged unless the commit re-bases them and says so · `accept.sh` 0 FAIL before a tag ·
**the panel is a no-op until touched** · the default look is v0.2's; OKLCH is a variant.
