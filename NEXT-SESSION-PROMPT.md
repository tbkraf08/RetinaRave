# Fable Session Prompt — Eigenwobble v0.5 "knobs" (written 2026-09-24 after v0.4.1 shipped; the user has not yet looked at v0.4.1 — ask first)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.4.1 is tagged** (`git tag v0.4.1`, `releases/eigenwobble-v0.4.1.html`, sweep
`tools/accept/v0.4/accept-31.txt`, DECISIONS §28): the panel you can read — the visual leads the row, bid-only rows
dimmed under the `the bid:` convention (CONTRACTS §1.13, `check.js` warns both ways), `0` / `1` / `fire` previews
(`route.js pulse`, `closeE`), the force-this-scene line, the dark native dropdown (`color-scheme`). It answers the
user's three sentences of 2026-09-24 at the v0.4 level; **the user has not seen it yet. First action of this session:
ask the user to open v0.4.1 on real music (key `p`) and say what they see, before any v0.5 work** — if they already
have, their words are the brief and go first, above the list below.

**Read first:** `docs/CONTRACTS.md` (§1 the scene object, §1.13 incl. "Bid-only fields", **§1.15 Routes** incl. the
preview/pulse paragraph, §1.4 "Per-scene post params"/"Colour variants") · `docs/HARNESS.md` ("Routes and manual
overrides" incl. the v0.4.1 panel paragraph, "Help view", "Real window", "Bench protocol", "Pitfalls") · `docs/DECISIONS.md`
**§27 + §28** · `docs/workers/brief-panel-2.md` + **`panel-2.md`** (the element ids — `pe-src/k/b/tau/inv/c/r/p0/p1/fire-<scene>-<field>`,
`pe-force`, `pe-release`, `pe-force-line`, `pe-on-<scene>`, `pe-scene`, `pe-trans`, `pe-post-<scene>-<path>`, `pe-json`,
`pe-resetall` — and the worker's friction) · `assets/core/panel.js` + `panel-ui.js`, `route.js`, `manual.js`, `help.js`
(**core must stay an import DAG**: `route ← scenes ← manual ← harness`, `help → panel → panel-ui`, `hash.js` a leaf) ·
`assets/scenes/*/index.js` `feats` + `help.feats` + `score()` · memory notes
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md` and
`feedback_colour_default.md` (**the default look is v0.2's; a colour-identity change is a variant until the user picks it**).

## The list (priority order)

1. **`params` — per-visual-parameter routes, the second level of the same panel (orchestrator core +
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
   the user has looked at), three to five params each, named for what the eye sees. Acceptance as v0.4.1's plus the per-scene
   md5 identity per move + a headed run where the user's own sentence is the test: *"in FEIGEN, the filament sharpness
   is fed by the centroid"* set from the panel, visible, in a real window.
2. **NEWTON scene id 7, from the contract alone** (worker; §17's list, carried four times). Newton's method on z³ − 1 (or a
   cubic the music walks), basins by root with the iteration count as lightness; a proof that CONTRACTS.md +
   HARNESS.md still suffice for a scene nobody in the repo has seen — **and, after 1, that a new scene declares
   `params` from day one.** Acceptance: brief-common's four items, a `colour` slot from the start (`v2` = a cosine
   palette, `oklch` = `ctx.oklch` by root angle), `check.js` 0 fail, the Q trace after = none to the second decimal.
3. **NAV's iteration budget near |λ| → 1** (orchestrator + a NAV worker; audit §26 check 1). NAV's cost swings **1.7 →
   7.7 ms** at 1280 × 720 along the fake timeline (f480 → f1500, `par` 0.76: the walk near a parabolic root, convergence
   detection takes the full `uIter`), **22.6 ms** at 2560 × 1439 — `Q` absorbs it today by dropping every scene's
   quality. Slot: `uIter` scaled by a NAV-side estimate of the convergence rate (|λ| from `N.cyc`, already uploaded as
   `uLam.x`) — a cheaper exit when |λ| → 1 — with `parity.js fake` 0 diff (state untouched) and the continuity monitor
   `viol []`. Acceptance: the f1500 bench ≤ 2× the f480 bench, byte-identical `scene-md5.sh` at f360/f840 (the change
   may only move pixels the iteration cap already moved — say so if it does, with a montage).
4. **A colour slot on every scene** (§26: two scenes carry variants; DUST/MANDALA/TORUS/POLYTOPE have one mapping each).
   Give each a `colour: {default: 'v2', variants: {v2}}` so `CARD.colour`, the cast line and the panel's colour selects
   are uniform. Acceptance: every `scene-md5.sh` line unchanged (a declared single variant is a no-op).
5. **The chain's `k` as a LOOK parameter** (§20's tonemap `(1 − e^{−kc})/(1 − e^{−k})`, k fixed today). Slot: `LOOK.k`
   from the mood (arousal → harder knee), `&k=` under `#test`, `chain-smoke.js` at three k. Acceptance: the mixs md5
   unchanged at the default k; the DUST drop-frame clip stays ≤ 0.2 %.
6. **The OKLCH variant's open ends** (only if the user wants the variant tuned — it is opt-in): FEIGEN's `min(L, 0.5)`
   cap clips the Green's band ripple and the kick/drop lift where the field is open (`hue-follows-set.md`, second pass
   — soften the cap, not the hue); NAV's interior chroma is 0.02–0.07 at the shipped L so the Koenigs bands read neutral
   (raise L inside or accept); §20's FEIGEN field lightness (variant only now).
7. Carried, low priority: §21's halftime 2:3 margin (comb-only read the relative at 1.06×; the dead-beat-lag condition
   holds it — no failing trace); §22's 24-section ring shift (never observed in a real run — a 4-minute track files ~20;
   instrument `RENUMBER@` on a long set before touching it).

## Working style (unchanged — see `docs/DECISIONS.md` §27 "how v0.4 was run" and §26)

Orchestrator owns core/engine/contracts/parity/harness; UI and scenes go to a worker in an isolated worktree from a
brief in `docs/workers/` (opus, own `PORT=`, one Chrome each, **never more than two Chrome instances on the machine, none
while a Q trace or a bench runs**; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop; the
Agent tool's `isolation: "worktree"` gives the worker its tree). `node tools/check.js` after every edit; `GPU=1 node
tools/parity.js fake` 0 diff after any core/engine change; `tools/scene-md5.sh` before/after any core change against
`tools/accept/v0.4/scene-md5-v03.txt` (the v2 default, unchanged since v0.3) and `scene-md5-v03-oklch.txt`
(`&colour=oklch`); the mixs md5 `5892ddc5…`; every trace tool writes to `tools/accept/${ACC:-v0.4}` — for item 1 set the
default to v0.5 and copy the two md5 lists there in that milestone's first commit (v0.4.1 stays in `v0.4/`); `GPU=1
tools/accept.sh` 0 FAIL before a commit that claims an item (it takes ~20 min; run it detached with `setsid nohup`,
log to `tools/accept/<ACC>/accept-NN.txt`, next NN = 32). A worker's screenshots are judged by the orchestrator's
eyes before a merge; say in the brief what the shot must show and which element ids the orchestrator will drive.
**Ask the user to look before item 1** — v0.4.1 was built for their eyes and they have not used it; a headed run is not
the user's eyes.

Pitfalls (HARNESS "Pitfalls" + the memory note): **a `<select>` popup is a separate X window — not in a CDP screenshot, `xwd` dies while it is open, python-Xlib grabs it, never `windowactivate` by class on this desktop**; `CARD.view(name)`; a DOM table has no `tbody`; `pulse` makes `view(name) !== MS` for exactly one frame; **core modules must stay an import DAG — the bundler cannot order a
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
