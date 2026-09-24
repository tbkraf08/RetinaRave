# Fable Session Prompt — Eigenwobble v0.4.1 "the panel you can read" → v0.5 "knobs" (written 2026-09-24 after the user's first hands-on with the v0.4 panel)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.4 is tagged** (`git tag v0.4`, `releases/eigenwobble-v0.4.html`, sweep
`tools/accept/v0.4/accept-30.txt` 0 FAIL / 17 sections, audit `docs/AUDIT-v0.4.md`, DECISIONS §27): the routes panel —
per-scene `MS`-field routing through a routed view (`core/route.js`), the manual overrides (`core/manual.js`), part E of
the `?` help view on key `p` (`core/panel.js`, a worker's). The user then used it on real music and said three things
(2026-09-24, verbatim, **these are the brief**):

1. *"how do I map the musical features to the visual ones? It looks like I'm mapping musical features to other musical
   features? (ie. field is elements from the sound and source are the same features?)"* — true at the v0.4 level: a
   row's first column is the scene's input *jack*, named after the music feature that normally feeds it; the visual
   consequence is the "what it drives here" text. The panel names the wrong thing first.
2. *"it doesn't seem like changing the parameters changes the viz? (is hard to tell because the music is constantly
   moving, but nothing stands out and have played with the dials a bunch)"* — the core works (proven again with
   constants: FEIGEN `alive` ← c:0 is black, `lvl` ← c:1 dives deep, NAV `presence` ← c:0 is a different picture, `mid`
   ← c:1 draws the trap rings — `tools/work/vis/m-feigen.jpg`, `m-nav.jpg` in the last session; redo them, they are
   `tools/work`), but (a) many fields move something small or **gated** (NAV's `eS`/`tension` only set the exterior
   depth — pixel-identical inside a bulb; FEIGEN's `bass` is one filament-sharpening mix), (b) several rows feed only
   the scene's *bid* (`score()`), which moves nothing while the scene is forced and is invisible otherwise (FEIGEN
   `regularity clarity calm arc`, NAV `build intensity`…), (c) music → music of the same kind reads as noise on noise
   unless you know the one thing the field moves, (d) the director keeps switching scenes under the overlay so the block
   being dialled is often not the one on screen. Nothing told the user any of this.
3. *"the drop down is white background with white text -> I can't see without hovering"* — the `<select>` is styled
   (`#help select`, `index.html`) but its **native popup list is not**: options inherit the light text on the browser's
   white list. Fix = `color-scheme: dark` on `#help` (Chrome then paints the popup dark) plus `#help option
   {background:#0b0d16;color:#cfe}`; **judge it in a real window with the list open** (headless cannot pop a native
   list; a headed run and a screenshot after focusing the select and sending `Alt+ArrowDown`, or `{sh}` + a desktop
   screenshot). The user hit this on the first select they touched — it is item 1.

**Read first:** `docs/CONTRACTS.md` (§1 the scene object, **§1.15 Routes**, §1.13 the help view, §1.4 "Per-scene post
params"/"Colour variants") · `docs/HARNESS.md` ("Routes and manual overrides", "Help view", "Real window", "Bench
protocol", "Pitfalls") · `docs/DECISIONS.md` **§27** (design, what is not routed and why, how v0.4 was run) ·
`docs/AUDIT-v0.4.md` · `docs/workers/brief-panel.md` + **`panel.md`** (the element ids — `pe-src-<scene>-<field>`,
`pe-k-…`, `pe-scene`, `pe-trans`, `pe-post-<scene>-<path>`, `pe-json`, `pe-resetall` — and the worker's friction) ·
`assets/core/panel.js`, `route.js`, `manual.js`, `help.js` (to extend; **core must stay an import DAG**: `route ←
scenes ← manual ← harness`, `help → panel`, `hash.js` a leaf) · `assets/scenes/*/index.js` `feats` + `help.feats` +
`score()` (to audit which fields are bid-only) · memory notes
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md` and
`feedback_colour_default.md` (**the default look is v0.2's; a colour-identity change is a variant until the user picks it**).

## The list (priority order)

1. **`panel-legibility` — v0.4.1 (a small worker from a brief `docs/workers/brief-panel-2.md`, or the orchestrator if
   it stays under ~60 lines of change; `panel.js` ≤ 350 lines still).** All from the user's three sentences:
   - **The dropdown** (sentence 3): `color-scheme: dark` on `#help`, `#help option` styled; every `<select>` in the
     panel and the manual section. Proof: a headed shot with a source list open, read by the orchestrator.
   - **The visual leads the row** (sentence 1): column order `what it drives here` (bright, first, wide) · the jack
     (`field` small, with its kind) · source · transfer · meter. The block heading gains the plain sentence *"each row is
     one input of this scene: the left column is what it moves on screen, the source is the music feature you plug
     into it"*. Same data, no new text in `panel.js` beyond that sentence.
   - **Bid-only rows** (sentence 2b): a contract convention, not a heuristic — CONTRACTS §1.13: *a field a scene reads
     only in `score()` (and nowhere in `update`/`draw`/`post`) has a `help.feats` line beginning `the bid:`*. Audit the
     six scenes' `score()` against their `update`/`draw` reads and fix the lines (FEIGEN already writes "the bid: …" for
     `regularity clarity calm`; check `arc`, `bpm`; NAV `build intensity suspension`? — read the code, list what you
     found in the commit). The panel dims such a row and appends *"bid only — moves nothing while the scene is forced;
     changes when the director picks it"*; `check.js` warns on a `help.feats` line beginning `the bid:` whose field is
     read anywhere but `score` (a static grep of `S.<field>`/`MS.<field>` outside `score` is enough; say if it is not).
   - **Preview the extremes** (sentence 2a/2c): per row two buttons `0` `1` (events: `fire`) that route the jack to a
     constant 0 / 1 **for 2 s on the help tick** (`refreshE` counts ticks — no timer, no rAF) and then put the previous
     route back (including "none"); while held the row shows *"preview: constant 0"*. For `raw` fields the two constants
     are the field's typical extremes: take them from a new optional `FEATS[k].range` already present for most (`raw`
     has `range: null` — use 0 and the row's current live value × 2, and say so on the button's title). A preview
     never touches storage.
   - **Which scene am I dialling** (sentence 2d): when the panel opens with no forced scene, a line under the heading
     *"the director is choosing scenes — force this one while you dial"* with a button that sets `MANUAL.scene` to the
     logical scene (and a button to release it); each block's heading says `on screen` / `not on screen` live.
   - Acceptance (the v0.4 shape, `accept.sh` "== routes" unchanged and still green): `check.js` 0 fail; identity md5
     with the panel opened and closed (`8d6ac4a6…` s6, `fb74fee4…` s0); ticks 0/600 hidden, 100/600 open; a preview
     started by eval at f120 shows `ROUTES.feigen.bass.src === 'const'` at f150 and the previous route at f300 with
     `localStorage` untouched; the headed dropdown shot; `CARD.HELP.rows()` 107/107 on 7/7 ids; the bundle from
     `file://`. Then `GPU=1 tools/accept.sh` 0 FAIL → DECISIONS §28 (short: the three sentences and what each changed)
     → `git tag v0.4.1` → `releases/eigenwobble-v0.4.1.html`. **Ask the user to try it before going on** — the whole
     point of 1 is their eyes.
2. **`params` — per-visual-parameter routes, the second level of the same panel (v0.5 item 1; orchestrator core +
   contract, a worker per scene, a panel worker).** The real answer to sentence 1: a row that says *"filament
   sharpness ← centroid"*. Slot: a scene declares its visual parameters — `params: { sharp: { eli5: 'how sharp the
   filaments are', range: [0, 1], from: (S) => S.bass } }` — the default derivation **is** the documentation, as
   `feats` + `help.feats` are for fields — and reads them through `this.params.sharp` (or `env.params`), which the
   core refreshes before `update()` from `from(view)` (so a field route still feeds it) or from a param route
   (`PROUTES[scene][param] = {src, k, b, inv, tau}` into the declared range). **Identity default as v0.4:** with no
   param route the core hands back exactly `from(view)` — every reference md5 stays while scenes move their constants
   into `params` one at a time (a worker per scene from a brief; the md5 sweep proves each move is a no-op; a scene
   that cannot be made byte-identical says why). The panel's part E gains, per scene, a **parameters** table above the
   jacks table: parameter · what it is · source (a field whose kind fits, or a constant) · transfer · meter (derived →
   routed), and the jacks table folds under a `details` ("the inputs behind these"). `&param=feigen.sharp=centroid*1.5`
   under `#test`; `CARD.PROUTES`, `CARD.param(...)`; the preset JSON gains a `params` block (`route.js BLOCKS`).
   `check.js` fails on a `params` key without `eli5`/`range`/`from`, and on a `from` that reads a field not in `feats`
   (call it once with a Proxy of MS in node — a read of an undeclared key throws). Start with FEIGEN and NAV (the two
   the user has looked at), three to five params each, named for what the eye sees. Acceptance as 1 + the per-scene
   md5 identity per move + a headed run where the user's own sentence is the test: *"in FEIGEN, the filament sharpness
   is fed by the centroid"* set from the panel, visible, in a real window.
3. **NEWTON scene id 7, from the contract alone** (worker; §17's list, carried thrice). Newton's method on z³ − 1 (or a
   cubic the music walks), basins by root with the iteration count as lightness; a proof that CONTRACTS.md +
   HARNESS.md still suffice for a scene nobody in the repo has seen — **and, after 2, that a new scene declares
   `params` from day one.** Acceptance: brief-common's four items, a `colour` slot from the start (`v2` = a cosine
   palette, `oklch` = `ctx.oklch` by root angle), `check.js` 0 fail, the Q trace after = none to the second decimal.
4. **NAV's iteration budget near |λ| → 1** (orchestrator + a NAV worker; audit §26 check 1). NAV's cost swings **1.7 →
   7.7 ms** at 1280 × 720 along the fake timeline (f480 → f1500, `par` 0.76: the walk near a parabolic root, convergence
   detection takes the full `uIter`), **22.6 ms** at 2560 × 1439 — `Q` absorbs it today by dropping every scene's
   quality. Slot: `uIter` scaled by a NAV-side estimate of the convergence rate (|λ| from `N.cyc`, already uploaded as
   `uLam.x`) — a cheaper exit when |λ| → 1 — with `parity.js fake` 0 diff (state untouched) and the continuity monitor
   `viol []`. Acceptance: the f1500 bench ≤ 2× the f480 bench, byte-identical `scene-md5.sh` at f360/f840 (the change
   may only move pixels the iteration cap already moved — say so if it does, with a montage).
5. **A colour slot on every scene** (§26: two scenes carry variants; DUST/MANDALA/TORUS/POLYTOPE have one mapping each).
   Give each a `colour: {default: 'v2', variants: {v2}}` so `CARD.colour`, the cast line and the panel's colour selects
   are uniform. Acceptance: every `scene-md5.sh` line unchanged (a declared single variant is a no-op).
6. **The chain's `k` as a LOOK parameter** (§20's tonemap `(1 − e^{−kc})/(1 − e^{−k})`, k fixed today). Slot: `LOOK.k`
   from the mood (arousal → harder knee), `&k=` under `#test`, `chain-smoke.js` at three k. Acceptance: the mixs md5
   unchanged at the default k; the DUST drop-frame clip stays ≤ 0.2 %.
7. **The OKLCH variant's open ends** (only if the user wants the variant tuned — it is opt-in): FEIGEN's `min(L, 0.5)`
   cap clips the Green's band ripple and the kick/drop lift where the field is open (`hue-follows-set.md`, second pass
   — soften the cap, not the hue); NAV's interior chroma is 0.02–0.07 at the shipped L so the Koenigs bands read neutral
   (raise L inside or accept); §20's FEIGEN field lightness (variant only now).
8. Carried, low priority: §21's halftime 2:3 margin (comb-only read the relative at 1.06×; the dead-beat-lag condition
   holds it — no failing trace); §22's 24-section ring shift (never observed in a real run — a 4-minute track files ~20;
   instrument `RENUMBER@` on a long set before touching it).

## Working style (unchanged — see `docs/DECISIONS.md` §27 "how v0.4 was run" and §26)

Orchestrator owns core/engine/contracts/parity/harness; UI and scenes go to a worker in an isolated worktree from a
brief in `docs/workers/` (opus, own `PORT=`, one Chrome each, **never more than two Chrome instances on the machine, none
while a Q trace or a bench runs**; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop; the
Agent tool's `isolation: "worktree"` gives the worker its tree). `node tools/check.js` after every edit; `GPU=1 node
tools/parity.js fake` 0 diff after any core/engine change; `tools/scene-md5.sh` before/after any core change against
`tools/accept/v0.4/scene-md5-v03.txt` (the v2 default, unchanged since v0.3) and `scene-md5-v03-oklch.txt`
(`&colour=oklch`); the mixs md5 `5892ddc5…`; every trace tool writes to `tools/accept/${ACC:-v0.4}` — for item 2 set the
default to v0.5 and copy the two md5 lists there in that milestone's first commit (v0.4.1 stays in `v0.4/`); `GPU=1
tools/accept.sh` 0 FAIL before a commit that claims an item (it takes ~20 min; run it detached with `setsid nohup`,
log to `tools/accept/<ACC>/accept-NN.txt`, next NN = 31). A worker's screenshots are judged by the orchestrator's
eyes before a merge; say in the brief what the shot must show and which element ids the orchestrator will drive.
**Ask the user to look after item 1** — the last session shipped a panel the user could not read; a headed run is not
the user's eyes.

Pitfalls (HARNESS "Pitfalls" + the memory note): **core modules must stay an import DAG — the bundler cannot order a
cycle**; an import line's trailing `//` comment needs the v0.4 `TAIL` regex (the bundle was dead for four commits until
a worker's file:// item caught it — run `node tools/bundle.js` after any import edit); a native `<select>` popup is not
styled by the select's CSS — `color-scheme` is; a view that runs every 6th frame cannot see one-frame events — pass
`help.js`'s per-frame `hot` latch; **a single low `q` run in a real window is not a cost finding** — repeat, then run the
previous release from `file://` under the same conditions (`audit-q-control.txt`); the audit music lives in old session
scratchpads (`/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/*/scratchpad/music/WhoLikesToParty.mp3`,
`CyborgNinja.mp3`) — copy it into yours first, and the music must be in **its own Chrome window**; hash hooks fire
**after `init`**; `CARD.hooks` is a flat map — `REG[id].scene.hooks`; a synchronous `CARD.bench` in a probed page
stamps a long frame and a fake drop — bench after the reading; `git worktree add` is refused inside an agent worktree
(`git archive | tar -x`); `FILE=` absolute; `pgrep -f` patterns with `[a-z]*` match their own shell; a stray
`serve.js` from another session may already answer on 8765 (cdp.js reuses it — it serves the main checkout, fine for
the orchestrator, wrong for a worker: workers use their own `PORT`). The malware-consideration reminder does not
apply to this repo.

Non-negotiables: zero deps · native modules · **every visual parameter traces to `MS`** (a routed field or param still
does; a constant is a manual setting, shown as one) · no `Math.random()`, no wall clock · module cap 350/500 ·
`parity.js fake` 0 diff · the reference md5s unchanged unless the commit re-bases them and says so · `accept.sh` 0 FAIL
before a tag · **the panel is a no-op until touched** · **the panel names the visual first** · the default look is
v0.2's; OKLCH is a variant.
