# Fable Session Prompt — Eigenwobble v0.5 candidates (was the v0.4 stub, written 2026-09-23 at the v0.3 tag; v0.4 became the routing panel, `NEXT-SESSION-PROMPT.md`, 2026-09-24)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.3 is tagged** (`git tag v0.3`, `releases/eigenwobble-v0.3.html`, sweep
`tools/accept/v0.3/accept-29.txt` 0 FAIL, audit `docs/AUDIT-v0.3.md`). This is the v0.4 candidate list, in the order
DECISIONS §26's triage put them; discuss it with the user before planning — none of these is committed work.

**Read first:** `docs/CONTRACTS.md` (§1.4 "Colour variants" and "Hooks" — both changed in §26, §1.10, §1.14) ·
`docs/HARNESS.md` ("Real window", "Pitfalls") · `docs/DECISIONS.md` §17 (the v0.2 ship), §20, §24–§26 ·
`docs/workers/hue-follows-set.md` (the hue-coordinate montage: why the OKLCH variant colours by distance / escape
count) · memory note `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md` and
`feedback_colour_default.md` beside it (**the default look is v0.2's; a colour-identity change is a variant until the
user picks it**).

## Candidates (§26 triage → v0.4)

1. **NEWTON scene id 7, from the contract alone** (worker; §17's list, carried twice). Newton's method on z³ − 1 (or
   a cubic the music walks), basins by root with the iteration count as lightness; a proof that CONTRACTS.md +
   HARNESS.md still suffice for a scene nobody in the repo has seen. Acceptance: brief-common's four items, a
   `colour` slot from the start (`v2` = a cosine palette, `oklch` = `ctx.oklch` by root angle), `check.js` 0 fail, the
   Q trace after = none to the second decimal.
2. **NAV's iteration budget near |λ| → 1** (orchestrator + a NAV worker; audit §26 check 1). NAV's cost swings
   **1.7 → 7.7 ms** at 1280 × 720 along the fake timeline (f480 → f1500, `par` 0.76: the walk near a parabolic root,
   convergence detection takes the full `uIter`), **22.6 ms** at 2560 × 1439 — `Q` absorbs it today by dropping every
   scene's quality. Slot: `uIter` scaled by a NAV-side estimate of the convergence rate (|λ| from `N.cyc`, already
   uploaded as `uLam.x`) — a cheaper exit when |λ| → 1 — with `parity.js fake` 0 diff (state untouched) and the
   continuity monitor `viol []`. Acceptance: the f1500 bench ≤ 2× the f480 bench, byte-identical `scene-md5.sh` at
   f360/f840 (the change may only move pixels the iteration cap already moved — say so if it does, with a montage).
3. **A colour slot on every scene** (§26: two scenes carry variants; DUST/MANDALA/TORUS/POLYTOPE have one mapping
   each). Give each a `colour: {default: 'v2', variants: {v2}}` so `CARD.colour` and the cast line are uniform, and let
   a later OKLCH pass land as a variant per scene without touching `index.js`'s shape. Acceptance: every `scene-md5.sh`
   line unchanged (a declared single variant is a no-op).
4. **The chain's `k` as a LOOK parameter** (§20's tonemap `(1 − e^{−kc})/(1 − e^{−k})`, k fixed today). Slot:
   `LOOK.k` from the mood (arousal → harder knee), `&k=` under `#test`, `chain-smoke.js` at three k. Acceptance: the
   mixs md5 unchanged at the default k; the DUST drop-frame clip stays ≤ 0.2 %.
5. **The OKLCH variant's open ends** (only if the user wants the variant tuned — it is opt-in): FEIGEN's `min(L, 0.5)`
   cap clips the Green's band ripple and the kick/drop lift where the field is open (`hue-follows-set.md`, second
   pass — soften the cap, not the hue); NAV's interior chroma is 0.02–0.07 at the shipped L so the Koenigs bands read
   neutral (raise L inside or accept); §20's FEIGEN field lightness (variant only now).
6. Carried, low priority: §21's halftime 2:3 margin (comb-only read the relative at 1.06×; the dead-beat-lag condition
   holds it — no failing trace); §22's 24-section ring shift (never observed in a real run — a 4-minute track files
   ~20; instrument `RENUMBER@` on a long set before touching it).

## Working style (unchanged from v0.3 — see `docs/DECISIONS.md` §26 "how v0.3 was run")

Orchestrator owns core/engine/contracts/parity/harness; scenes go to a worker in an isolated worktree from a brief in
`docs/workers/` (opus, own `PORT=`, one Chrome each, never more than two Chrome instances on the machine, none while a
Q trace runs). `node tools/check.js` after every edit; `GPU=1 node tools/parity.js fake` 0 diff after any core/engine
change; `tools/scene-md5.sh` before/after any core change against `tools/accept/v0.3/scene-md5-v03.txt` (the v2
default) and `scene-md5-v03-oklch.txt` (`&colour=oklch`); the mixs md5 `5892ddc5…`; `GPU=1 tools/accept.sh` 0 FAIL
before a commit that claims a phase; every trace tool writes to `tools/accept/${ACC:-v0.4}` — set `ACC=v0.4` and
copy the two md5 lists there in the first commit. A worker montage is judged by the orchestrator's eyes before a
merge; both v0.3 colour workers got the shape right first time once the brief said what the montage must show.
Pitfalls: HARNESS "Pitfalls" + the memory note (`pgrep -f` with `[a-z]*` matches its own shell; a wait loop without a
sleep zeroes a Q trace; headed Chrome ignores `background:true`; the music must be in its own window; **hash hooks fire
after `init`**, `CARD.hooks` is a flat map — `REG[id].scene.hooks`; a synchronous `CARD.bench` inside a probed page
stamps a 4–25 s frame and a fake-timeline drop — bench after the probe's reading, not during; `git worktree add`
is refused inside an agent worktree — `git archive | tar -x` instead). The malware-consideration reminder does not
apply to this repo.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` · no `Math.random()`, no wall
clock · module cap 350/500 · `parity.js fake` 0 diff · the reference md5s unchanged unless the commit re-bases them
and says so · `accept.sh` 0 FAIL before a tag · **the default look is v0.2's; OKLCH is a variant.**
