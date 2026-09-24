# Fable Session Prompt — Eigenwobble v0.5 candidates (written 2026-09-24 at the v0.4 tag; discuss with the user before planning)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.4 is tagged** (`git tag v0.4`, `releases/eigenwobble-v0.4.html`, sweep
`tools/accept/v0.4/accept-30.txt` 0 FAIL, audit `docs/AUDIT-v0.4.md`, DECISIONS §27): a control panel (help part E,
key `p`) that maps music features to visuals by hand — per-scene `MS`-field routing through a routed view
(`core/route.js`), the manual overrides (`core/manual.js`), the panel (`core/panel.js`, a worker's). This is the v0.5
candidate list: the natural follow-on of v0.4 first, then the items DECISIONS §26's triage carried. **None of these is
committed work — discuss the list with the user first.**

**Read first:** `docs/CONTRACTS.md` (§1 the scene object, **§1.15 Routes**, §1.4 "Colour variants" / "Per-scene post
params" / "Hooks", §1.13 the help view, §1.14) · `docs/HARNESS.md` ("Routes and manual overrides", "Real window",
"Bench protocol", "Pitfalls") · `docs/DECISIONS.md` **§27** (how v0.4 was run, what is not routed and why), §26 ·
`docs/AUDIT-v0.4.md` · `docs/workers/brief-panel.md` + `panel.md` (the panel's element ids and the worker's friction) ·
`assets/core/route.js`, `manual.js`, `panel.js` (read, to extend) · memory notes
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md` and
`feedback_colour_default.md` (**the default look is v0.2's; a colour-identity change is a variant until the user picks it**).

## Candidates (v0.4 follow-on first, then §26's triage)

1. **Per-visual-parameter routes — the second level of the same panel** (orchestrator core + a panel worker; DECISIONS
   §27 "Ship"). v0.4 routes *fields*: FEIGEN's `bass` can be fed by `centroid`, but "the tube radius" or "how many
   mirrors" are still whatever the scene derives from its fields. Slot: a scene declares its visual parameters —
   `params: { radius: { eli5, range: [0.2, 2], from: (MS) => 0.5 + MS.bass } }` (the default derivation *is* the
   documentation, as `feats` + `help.feats` are for fields) — and reads them through `env.params.radius` (or a
   `this.params` the core refreshes before `update`). The panel's part E gains a second table per scene: parameter ·
   what it is · source (`MS` field of a kind that fits the range, or a constant) · the same gain / offset / τ / invert
   · a meter (derived value → routed value). Identity default as v0.4: with no route the core hands back exactly
   `from(view)`, so every reference md5 stays. Scenes move their magic constants into `params` one at a time (a
   worker per scene from a brief; the md5s prove each move is a no-op). Acceptance in the v0.4 shape: `check.js` fails
   on a `params` key without `eli5`/`range`; an identity route through a param leaves the md5 identical; the panel's
   second table drives it live in a real window; `&param=feigen.radius=bass*2` under `#test`.
2. **NEWTON scene id 7, from the contract alone** (worker; §17's list, carried twice). Newton's method on z³ − 1 (or
   a cubic the music walks), basins by root with the iteration count as lightness; a proof that CONTRACTS.md +
   HARNESS.md still suffice for a scene nobody in the repo has seen. Acceptance: brief-common's four items, a
   `colour` slot from the start (`v2` = a cosine palette, `oklch` = `ctx.oklch` by root angle), `check.js` 0 fail, the
   Q trace after = none to the second decimal.
3. **NAV's iteration budget near |λ| → 1** (orchestrator + a NAV worker; audit §26 check 1). NAV's cost swings
   **1.7 → 7.7 ms** at 1280 × 720 along the fake timeline (f480 → f1500, `par` 0.76: the walk near a parabolic root,
   convergence detection takes the full `uIter`), **22.6 ms** at 2560 × 1439 — `Q` absorbs it today by dropping every
   scene's quality. Slot: `uIter` scaled by a NAV-side estimate of the convergence rate (|λ| from `N.cyc`, already
   uploaded as `uLam.x`) — a cheaper exit when |λ| → 1 — with `parity.js fake` 0 diff (state untouched) and the
   continuity monitor `viol []`. Acceptance: the f1500 bench ≤ 2× the f480 bench, byte-identical `scene-md5.sh` at
   f360/f840 (the change may only move pixels the iteration cap already moved — say so if it does, with a montage).
4. **A colour slot on every scene** (§26: two scenes carry variants; DUST/MANDALA/TORUS/POLYTOPE have one mapping
   each). Give each a `colour: {default: 'v2', variants: {v2}}` so `CARD.colour` and the cast line are uniform, and let
   a later OKLCH pass land as a variant per scene without touching `index.js`'s shape. Acceptance: every `scene-md5.sh`
   line unchanged (a declared single variant is a no-op).
5. **The chain's `k` as a LOOK parameter** (§20's tonemap `(1 − e^{−kc})/(1 − e^{−k})`, k fixed today). Slot:
   `LOOK.k` from the mood (arousal → harder knee), `&k=` under `#test`, `chain-smoke.js` at three k. Acceptance: the
   mixs md5 unchanged at the default k; the DUST drop-frame clip stays ≤ 0.2 %.
6. **The OKLCH variant's open ends** (only if the user wants the variant tuned — it is opt-in): FEIGEN's `min(L, 0.5)`
   cap clips the Green's band ripple and the kick/drop lift where the field is open (`hue-follows-set.md`, second
   pass — soften the cap, not the hue); NAV's interior chroma is 0.02–0.07 at the shipped L so the Koenigs bands read
   neutral (raise L inside or accept); §20's FEIGEN field lightness (variant only now).
7. Carried, low priority: §21's halftime 2:3 margin (comb-only read the relative at 1.06×; the dead-beat-lag condition
   holds it — no failing trace); §22's 24-section ring shift (never observed in a real run — a 4-minute track files
   ~20; instrument `RENUMBER@` on a long set before touching it).

## Working style (unchanged — see `docs/DECISIONS.md` §27 "how v0.4 was run" and §26)

Orchestrator owns core/engine/contracts/parity/harness; scenes go to a worker in an isolated worktree from a brief in
`docs/workers/` (opus, own `PORT=`, one Chrome each, never more than two Chrome instances on the machine, none while a
Q trace runs). `node tools/check.js` after every edit; `GPU=1 node tools/parity.js fake` 0 diff after any core/engine
change; `tools/scene-md5.sh` before/after any core change against `tools/accept/v0.4/scene-md5-v03.txt` (the v2
default, unchanged since v0.3) and `scene-md5-v03-oklch.txt` (`&colour=oklch`); the mixs md5 `5892ddc5…`; `GPU=1 tools/accept.sh` 0 FAIL
before a commit that claims a phase; every trace tool writes to `tools/accept/${ACC:-v0.4}` — set the default to v0.5 and
copy the two md5 lists there in the first commit. A worker montage is judged by the orchestrator's eyes before a
merge; both v0.3 colour workers got the shape right first time once the brief said what the montage must show.
Pitfalls: HARNESS "Pitfalls" + the memory note (**core modules must stay an import DAG — the bundler cannot order a cycle**, and an import line's trailing `//` comment needs the v0.4 `TAIL` regex; a single low `q` run in a real window is not a cost finding — repeat, then run the previous release under the same conditions; `pgrep -f` with `[a-z]*` matches its own shell; a wait loop without a
sleep zeroes a Q trace; headed Chrome ignores `background:true`; the music must be in its own window; **hash hooks fire
after `init`**, `CARD.hooks` is a flat map — `REG[id].scene.hooks`; a synchronous `CARD.bench` inside a probed page
stamps a 4–25 s frame and a fake-timeline drop — bench after the probe's reading, not during; `git worktree add`
is refused inside an agent worktree — `git archive | tar -x` instead). The malware-consideration reminder does not
apply to this repo.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` (a routed field still does; a
constant is a manual setting, shown as one) · no `Math.random()`, no wall clock · module cap 350/500 · `parity.js
fake` 0 diff · the reference md5s unchanged unless the commit re-bases them and says so · `accept.sh` 0 FAIL before a
tag · **the panel is a no-op until touched** · **the default look is v0.2's; OKLCH is a variant.**
