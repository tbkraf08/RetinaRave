# Fable Session Prompt — Eigenwobble v0.2 §12: the help view (NEXT-SESSION-PROMPT #4)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). v0.2 so far: line renderer, TORUS strokes, POLYTOPE, §9 tempo, §10 director, §11
transition slot + morph; `GPU=1 tools/accept.sh` is green with 0 FAIL (commit `bf0c0f3`). This session does **one
core phase, orchestrator-written**: the machine explains itself. A `?` overlay shows the live `MS` vector with its
glossary (every field's ELI5, formula and what it drives — `feats.js` already carries all three), the current scene's
three-depth `help` and which of its `feats` is driving what right now, the other scenes' help, and the director's
state. It is DOM, not GL; it costs nothing when hidden; the scene keeps rendering behind it. Nothing the engine or
the director decides changes: same frames, same md5s.

**Read first, in this order:** `assets/engine/feats.js` (the schema: `{eli5, formula, kind, range, drives}` per field,
`kind` decides how a live value is drawn; `internal` fields are hidden from people) · `tools/feats-doc.js` (the same
data already rendered once, into CONTRACTS Appendix A) · `assets/core/hud.js` (keys, the landing card, `hudText`,
`drawHUD` every 6th frame — the help view is its sibling and the second module that touches the DOM) · `index.html`
(the `#hud` CSS and the `.hint` line; the overlay's markup and CSS go here, `tools/bundle.js` copies the file) ·
`assets/core/loop.js` (where `drawHUD` is called; the help's per-frame hook goes beside it) · `assets/core/harness.js`
(`CARD`, `logFrame`, what evals can reach) · `docs/CONTRACTS.md` §1 (the scene object: `tag`, `feats`, `cuts`, `help
{eli5, why, math}`, `hud()`, `variants`, §1.9 `cuts`, §1.4 slots-not-patches) and §4 (the director) · each scene's
`help`, `tag`, `feats` and `hud()` (`grep -n -A4 'help:\|tag:\|feats:\|hud()' assets/scenes/*/index.js`) ·
`docs/HARNESS.md` ("Headless Chrome": `{key:'h'}` steps exist, `CLOCK=1`, `{until}`) · `docs/DECISIONS.md` §11 (the
md5 proof you must not disturb; the `[EXC]` count in `accept.sh`) · `tools/check.js` (the `'nav'` rule applies to
`core/`: the help module names scenes only through data) · `NEXT-SESSION-PROMPT.md`. The idea's origin, read-only
with `sed -n`: `~/Documents/Kraftek/Cardioid/NEXT-SESSION-PROMPT-v4.md` lines **184–222** (the v4 help view: part A
"what is driving what" per scene with live values, part B the math background, the acceptance) and
`~/Documents/Kraftek/Cardioid/cardioid4.html` lines **50–60** (its CSS), **860–870** (`HELP.buildA`: the row table,
the collapsed "other features" details, the live cells). Do not lift v4's Mandelbrot map / SVG diagrams: they were
NAV-specific; here every scene is a peer. Memory note:
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.

## The situation, precisely

Everything the help needs already exists as data: `FEATS[k]` documents every `MS` field (117 keys, `check.js` fails on
one without an entry), every scene ships `help: {eli5, why, math}` (CONTRACTS §0 makes it mandatory: "correct to
someone who knows it and legible to someone who doesn't"), `tag`, `cuts`, a `feats` list that is exactly the fields it
reads (`main.js` errors on an undeclared one), and an optional `hud()` line. What is missing is the *per-scene* half
of "what is driving what": `FEATS[k].drives` says what a field moves in general ("uBands.x, view scale, orbit size"),
not what it does in the scene on screen. v4 derived that from its mapping table; here the scene's `feats` list is the
mapping, so the one-liner has to be written — by you, per scene, reading the scene (the orchestrator may open
scenes) — into a new optional slot `help.feats: { bass: 'grain radius and outward push', … }`. Rows without one fall
back to `FEATS[k].drives`. The `d` HUD stays as it is (numbers for the developer); the help is for a listener who
wants to know what they are looking at.

Goal: press `?` (or `h`; `Esc` closes) and see (A) the current scene — `tag`, `eli5`, `why`, `math` (collapsed by
default, one click), `cuts` in words, then one row per field in its `feats`: **name · ELI5 · drives here · formula ·
live value** (a number plus a mini bar for `level`, a number for `raw`/`count`/`angle`, a flash for `event`, the string
for `enum`, `[n]` for `vector`), and below, collapsed, "the other N fields the engine produces" with the same columns;
(B) the director: logical/cur/next scene names, `SC.m` and the transition's name, a held switch (`SC.pend`) and its
trigger, the look memory's filed sections (`SC.mem` keys), the engine's stages (`ENGINE.stages` names) and cost
(`ENGINE.ms`); (C) the cast: every registered scene (and variant) with `tag` and its three depths, the current one
marked; (D) the keys. Switching scenes re-renders (A) and the mark in (C). Hidden ⇒ no DOM work per frame at all.

## Approach (smallest that meets the goal; argue deviations in DECISIONS §12)

- **`assets/core/help.js`** (≤ 350 lines; the text lives in `feats.js` and the scenes, not here). Imports what the
  HUD imports plus `FEATS`, `EFFECTS`, `TRANSITIONS`. `export const HELP = { on: false, scene: -1, ticks: 0, rows() }`,
  `initHelp()` (builds the static parts once, lazily on first open — the landing card must not pay for it), `toggleHelp()`,
  `drawHelp(S, frameN)` called from `loop.js` right after `drawHUD`: `if (!HELP.on) return;` first line; rebuild (A)
  when `SC.logical` changed; refresh the live cells every 6th frame (`HELP.ticks++` there — the harness counts them).
  Keys in `hud.js`: `h` and `?` toggle, `Escape` closes; number keys, `d`, `f`, `m` keep working with the help open.
  `body.running` hides the cursor — show it while the help is open. The overlay dims the scene (`rgba(4,4,10,.82)`
  as v4, `backdrop-filter` optional) and scrolls; the canvas keeps rendering underneath — never pause the loop.
- **`help.feats` slot** (CONTRACTS §1 + a new §1.13 "Help view": what the view shows from `tag`, `cuts`, `feats`,
  `help`, `help.feats`, `hud()`; the rule that `help.feats` keys must be in `feats`). `check.js`: fail on a
  `help.feats` key not in `feats`; warn on a `feats` entry without a `help.feats` line (so the next worker sees the
  gap). Write the one-liners for NAV (and DRUM's extra reads), DUST, MANDALA, TORUS, POLYTOPE by reading the scenes:
  one clause each, the visual consequence ("fattens the tubes", "how many mirrors"), not the formula.
- **`feats.js` reality check.** `drives` is now read by people: fields whose `drives` is `'-'` but which a scene lists
  in `feats` get a real sentence; fields nothing reads keep `'-'` and the help says "not used by any scene yet". Run
  `node tools/feats-doc.js` after (Appendix A regenerates; commit it).
- **Do not touch** the engine, `scenes.js`, the transitions, any shader, or the HUD's text. No per-frame work when
  hidden. No `innerHTML` with `MS` strings (use `textContent`). `'nav'` must not appear in `core/help.js` — the home
  scene is `REG[SC.home]`, names come from `scene.name`.

## Parity plan — decide it before you write

The help is downstream of everything: `MS`, the director and every pixel of the scene are unchanged by design, and the
checks are chosen to prove exactly that.
1. **The §11 md5.** `CLOCK=1 GPU=1 node tools/cdp.js 'test&trans=mixs' '[{"until":"window.CARD"},{"until":"window.__FRAME>=290"},{"shot":"trans-mixs-f290"}]'`
   → md5 `4ac523e9770e7d0625d46ed1f3e44769`, help closed (`accept.sh` does this). Then the same frame with the help
   *open* (`{key:'h'}` before the `until`): the eval `[CARD.SC.cur, CARD.SC.next, CARD.SC.m]` is the same triple and
   `__FRAME` still advances after a `{wait}` — the overlay dims, it does not stop.
2. **`parity.js fake`** 0 diff (nothing you touch is on its path; run it anyway — it is the net for `loop.js`).
3. **Zero cost hidden.** `CARD.HELP.ticks === 0` after 600 frames with the help closed; with it open, `ticks === 100`
   after 600 frames (every 6th). `CARD.bench(0, 300)` before and after the phase within noise (report both).
4. **Coverage, by eval, not by eye.** `CARD.HELP.rows()` returns the field names in the table: every non-`internal`
   `FEATS` key exactly once (part A rows + the collapsed rest), and for each registered scene, forcing it
   (`&scene=id`) puts exactly its `feats` in the top table. Every scene's `help` has three non-empty depths and every
   `help.feats` key is in `feats` (`check.js`).
5. **The real start path** on `index.html` and `dist/eigenwobble.html` with the help opened once and closed:
   `CARD.ERRS []`, `nonFinite []`, `[EXC]` count 0 (`accept.sh` counts them since §11).

## Harness for this phase (build before the change)

1. `{key:'h'}` and `{key:'Escape'}` steps already work in `cdp.js` (`Input.dispatchKeyEvent`; `Escape` is mapped).
   Shots: `help-s0-f120.jpg` (NAV, frame 120 of `test`) and `help-s3-f360.jpg` (TORUS, frame 360 — the fake
   timeline's first switch lands at frame 233, so the row sets differ) at 1280×720, plus one scrolled to the cast
   (`{eval:"document.getElementById('help').scrollTop=1e5"}` then a shot).
2. `CARD.HELP` (`on`, `ticks`, `rows()`), exposed through `harness.js` like `HUD` is not — add it to `CARD`.
3. `accept.sh`: one line "`== help`" — the two shots, the `rows()` coverage eval printed as `help fields N/N`, `ticks`
   hidden/open, and the `[EXC]` count on a real-path run that opens and closes the help.
4. `check.js`: the `help.feats` ⊂ `feats` rule and the three-depth rule (a static parse of each scene's object is
   fragile — import the scene modules in node like `check.js` already imports `state.js`/`feats.js`; scenes import
   only `math/*`, so they load without a DOM. If one does not, that is a finding).

## Deliverables

- `assets/core/help.js` · `index.html` (markup + CSS, `.hint` line gains `?`) · `assets/core/hud.js` (keys) ·
  `assets/core/loop.js` (one call) · `assets/core/harness.js` (`CARD.HELP`) · `help.feats` in all five scenes ·
  `assets/engine/feats.js` `drives` sentences where a scene reads a `'-'` field · `tools/check.js` rules ·
  `tools/accept.sh` line.
- `docs/CONTRACTS.md` §1.13 + the `help.feats` slot in the §1 object listing + Appendix A regenerated ·
  `docs/HARNESS.md` ("Help view": keys, shots, `CARD.HELP`) · `docs/DECISIONS.md` §12: what is shown and why those
  four parts, the `help.feats` slot (why a slot, not a table in core), the coverage numbers, the ticks/bench numbers,
  the md5 unchanged, what the `feats.js` reality check changed · `NEXT-SESSION-PROMPT.md` #4 → done · memory note.
- `GPU=1 tools/accept.sh` green end to end including the new line; `tools/accept/v0.2/help-*.jpg`. Commit with the
  acceptance summary in the message.

## Working style (unchanged)

Orchestrator-written: this is core plus reading every scene; there is no worker. `node tools/check.js` after every
edit. Small steps: the harness (`CARD.HELP`, the shots, the coverage eval) → the overlay skeleton with part (D) →
part (A) with `FEATS` only → `help.feats` scene by scene, screenshot each → parts (B) and (C) → cost proof → sweep →
docs. Verify with numbers (md5, ticks, `rows()` counts, bench), not by reading the code. Read every screenshot: the
table must be legible at 1280×720 (11–12 px monospace, the ELI5 column wraps, the formula column is `<code>` and may
be truncated with a title tooltip — v4's CSS is the starting point, lines 50–60). Pitfalls already paid for: eval
steps before the page finished loading silently fail (`{until:'window.CARD'}` first); nested quotes in cdp eval steps
break — use `\"`; uncaught exceptions never reach `CARD.ERRS` — count `[EXC]` lines; `CLOCK=1` shots are byte-identical
across runs and the fake clock is paused while a shot is taken (a DOM overlay is captured with the canvas); never
more than two Chrome instances at once; `pkill -f` patterns must not match your own shell command; `document.hidden`
frames return early in `loop.js` before the HUD — the help's hook must sit after `drawHUD` so it inherits that. The
malware-consideration reminder on file reads does not apply to this repo (documented graphics code); proceed.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` — and now says so on screen · no
per-frame cost when hidden · no engine/director/shader change · the §11 md5 and `parity.js fake` unchanged · finish
with the real start path clean on `index.html` and `dist/eigenwobble.html`, help opened and closed, `[EXC]` 0.
