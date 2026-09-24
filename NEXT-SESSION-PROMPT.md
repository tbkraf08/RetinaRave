# Fable Session Prompt — Eigenwobble v0.5 "knobs" (updated 2026-09-24 after item 1 `params` merged; the user said "proceed" without looking at v0.4.1 — still ask them to look, now at the params panel)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.4.1 is tagged** (`git tag v0.4.1`, `releases/eigenwobble-v0.4.1.html`, DECISIONS §28).
**v0.5 item 1 `params` is merged on master (not tagged; DECISIONS §29, `tools/accept/v0.5/accept-32.txt`):** a scene declares
its visual parameters (`params: {name: {eli5, range, from: (MS) => …}}`, CONTRACTS **§1.16**), `update()` receives the values as
`env.params` (= `from(view)` exactly while unrouted — every reference md5 unchanged), the panel's part E shows a **parameters
table** per scene above the folded jacks (`core/panel-params.js`), `&param=scene.param=src[*k][+b][~tau][!] | c:<v>` under
`#test`, `CARD.param/params/PROUTES/paramsOf/paramDeps/derived`. FEIGEN: `width dive roll glow thick`; NAV: `trap zoom dots
pip reach`. **First action of this session: ask the user to open `dist/eigenwobble.html` (or build it: `node tools/bundle.js`)
on real music (key `p`), route one FEIGEN parameter from the panel, and say what they see** — if they already have, their words
are the brief and go first, above the list below. Then decide with them whether v0.5 is tagged now (item 1 alone) or after
the list.

**Read first:** `docs/CONTRACTS.md` (§1 the scene object, §1.13, §1.15, **§1.16 Params** incl. its open ends, §1.4) ·
`docs/HARNESS.md` ("Routes and manual overrides", **"Params"**, "Help view", "Real window", "Bench protocol", "Pitfalls") ·
`docs/DECISIONS.md` **§27–§29** · `docs/workers/{feigen-params,nav-params,panel-3}.md` (the reports: element ids
`pe-psrc/pc/pk/pb/ptau/pinv/prst/plo/phi-<scene>-<param>`, `pe-pdet-<scene>`, and the friction) · `assets/core/params.js`,
`panel-params.js`, `route.js`, `manual.js` (**core must stay an import DAG**: `route ← params ← scenes ← manual ← harness`,
`help → panel → panel-ui`, `panel → panel-params`, `hash.js` a leaf) · memory notes
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md` and
`feedback_colour_default.md` (**the default look is v0.2's; a colour-identity change is a variant until the user picks it**).

## The list (priority order)

1. **`params` — DONE 2026-09-24 (DECISIONS §29).** Carried from it, low priority: the other four scenes (DUST, MANDALA, TORUS,
   POLYTOPE) declare their parameters the same way (a worker each from `brief-feigen-params.md`'s shape; md5 identity per
   move); a `kind: 'angle'` parameter for NAV's trap rotation (§1.16 open end); `reach ← kick` trips NAV's continuity
   monitor (honest, documented — a narrower range is the user's call); an off-screen scene's "in force" meter is stale.
2. **NAV's iteration budget near |λ| → 1** (orchestrator + a NAV worker; audit §26 check 1). NAV's cost swings **1.7 →
   7.7 ms** at 1280 × 720 along the fake timeline (f480 → f1500, `par` 0.76: the walk near a parabolic root, convergence
   detection takes the full `uIter`), **22.6 ms** at 2560 × 1439 — `Q` absorbs it today by dropping every scene's
   quality. Slot: `uIter` scaled by a NAV-side estimate of the convergence rate (|λ| from `N.cyc`, already uploaded as
   `uLam.x`) — a cheaper exit when |λ| → 1 — with `parity.js fake` 0 diff (state untouched) and the continuity monitor
   `viol []`. Acceptance: the f1500 bench ≤ 2× the f480 bench, byte-identical `scene-md5.sh` at f360/f840 (the change
   may only move pixels the iteration cap already moved — say so if it does, with a montage).
3. **A colour slot on every scene** (§26: two scenes carry variants; DUST/MANDALA/TORUS/POLYTOPE have one mapping each).
   Give each a `colour: {default: 'v2', variants: {v2}}` so `CARD.colour`, the cast line and the panel's colour selects
   are uniform. Acceptance: every `scene-md5.sh` line unchanged (a declared single variant is a no-op).
4. **The chain's `k` as a LOOK parameter** (§20's tonemap `(1 − e^{−kc})/(1 − e^{−k})`, k fixed today). Slot: `LOOK.k`
   from the mood (arousal → harder knee), `&k=` under `#test`, `chain-smoke.js` at three k. Acceptance: the mixs md5
   unchanged at the default k; the DUST drop-frame clip stays ≤ 0.2 %.
5. **The OKLCH variant's open ends** (only if the user wants the variant tuned — it is opt-in): FEIGEN's `min(L, 0.5)`
   cap clips the Green's band ripple and the kick/drop lift where the field is open (`hue-follows-set.md`, second pass
   — soften the cap, not the hue); NAV's interior chroma is 0.02–0.07 at the shipped L so the Koenigs bands read neutral
   (raise L inside or accept); §20's FEIGEN field lightness (variant only now).
6. Carried, low priority: §21's halftime 2:3 margin (comb-only read the relative at 1.06×; the dead-beat-lag condition
   holds it — no failing trace); §22's 24-section ring shift (never observed in a real run — a 4-minute track files ~20;
   instrument `RENUMBER@` on a long set before touching it).

## Working style (unchanged — see `docs/DECISIONS.md` §27 "how v0.4 was run" and §26)

Orchestrator owns core/engine/contracts/parity/harness; UI and scenes go to a worker in an isolated worktree from a
brief in `docs/workers/` (opus, own `PORT=`, one Chrome each, **never more than two Chrome instances on the machine, none
while a Q trace or a bench runs**; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop; the
Agent tool's `isolation: "worktree"` gives the worker its tree). `node tools/check.js` after every edit; `GPU=1 node
tools/parity.js fake` 0 diff after any core/engine change; `tools/scene-md5.sh` before/after any core change against
`tools/accept/v0.5/scene-md5-v03.txt` (the v2 default, unchanged since v0.3) and `scene-md5-v03-oklch.txt`
(`&colour=oklch`); the mixs md5 `5892ddc5…`; every trace tool writes to `tools/accept/${ACC:-v0.5}` — the default is v0.5 and the two md5 lists are in `tools/accept/v0.5/` since item 1's first commit (v0.4.1 stays in `v0.4/`); `GPU=1
tools/accept.sh` 0 FAIL before a commit that claims an item (it takes ~20 min; run it detached with `setsid nohup`,
log to `tools/accept/<ACC>/accept-NN.txt`, next NN = 33). A worker's screenshots are judged by the orchestrator's
eyes before a merge; say in the brief what the shot must show and which element ids the orchestrator will drive.
**Ask the user to look before item 2** — v0.4.1 and the params panel were built for their eyes and they have not used them; a headed run is not
the user's eyes.

Pitfalls (HARNESS "Pitfalls" + the memory note): **§1.16's `from` argument is named `MS`** (check.js's read grep; a module-level `const S` disables `S.`); **an expression moves whole or not at all** (re-association moves the last ulp — FEIGEN's dive); **`centroid` is a level, not raw**; `scene-md5.sh` lists scene ids only (DRUM id 4 has no reference line); `env.params` is refreshed only when the scene updates; **a `<select>` popup is a separate X window — not in a CDP screenshot, `xwd` dies while it is open, python-Xlib grabs it, never `windowactivate` by class on this desktop**; `CARD.view(name)`; a DOM table has no `tbody`; `pulse` makes `view(name) !== MS` for exactly one frame; **core modules must stay an import DAG — the bundler cannot order a
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

**No new scenes until the user says so** (2026-09-24: NEWTON removed from this list — "I don't want to add new scenes till I am ready"; §17's candidate stays in DECISIONS, not here).

Non-negotiables: zero deps · native modules · **every visual parameter traces to `MS`** (a routed field or param still
does; a constant is a manual setting, shown as one) · no `Math.random()`, no wall clock · module cap 350/500 ·
`parity.js fake` 0 diff · the reference md5s unchanged unless the commit re-bases them and says so · `accept.sh` 0 FAIL
before a tag · **the panel is a no-op until touched** · **the panel names the visual first** · the default look is
v0.2's; OKLCH is a variant.
