# Fable Session Prompt — Eigenwobble v0.3 (stub, written at the v0.2 tag, 2026-09-23)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.2 is tagged** (`git tag v0.2`; `releases/eigenwobble-v0.2.html` runs from
`file://` anywhere; `tools/accept/v0.2/accept-17.txt` is the sweep behind the tag). It was audited in a real window
(`docs/AUDIT-v0.2.md`: five checks, no engine bug, two help-view fixes) and every "Left open" line of v0.2 was decided
in DECISIONS §17's triage table. This file is the v0.3 list that table produced, in priority order, with the numbers
that motivate each item. Nothing here is started.

**Read first:** `docs/CONTRACTS.md` (the one required read for scene/effect/stage authors) · `docs/HARNESS.md`
("Bench protocol", "Q trace", "Real window", "Pitfalls") · `docs/DECISIONS.md` §16–§17 · `docs/AUDIT-v0.2.md` ·
`docs/workers/*.md` (what workers tripped on) · memory note
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.

## The v0.3 briefs (priority order)

1. **`newton` — scene id 7, the contract's real test.** The first scene written from CONTRACTS alone with no source to
   lift: Newton's-method basins of `z³ − 1` (and a music-chosen polynomial), per-pixel with an affine camera, so the
   §16 field/colour split applies verbatim — `scenes/feigen/ladder.js` is scene-agnostic in its geometry; the field is
   `(root id, log convergence rate, arg)`; the colour pass is the scene's. Acceptance: `check.js` 0/0; `scene-md5.sh`
   deterministic across two runs; `bench(7,300)` ≤ 1.5 × NAV interleaved at 1280 × 720 **and** in a real window at
   2560 × 1439 (HARNESS "Real window": FEIGEN is 0.5–1.2× NAV there); a Q trace after = none to the second decimal
   (`q-trace.sh` needs a `VISIT` shape of the scene's own if it has a depth — HARNESS says so); `help` three depths +
   `help.feats`; parity fake 0 diff (a new scene moves the director's first pick on the fake timeline — the mixs md5 is
   director-blind since §15, so it must not move). Candidates (b)–(d) in DECISIONS §17 (MODULAR, KLEIN, LORENZ) are
   the list for id 8 if (a) goes well.
2. **`resume-hold` (engine, small, parity-neutral).** Audit 3: the first frames back from a hidden tab carry the
   composite's drop rows — the v3 followers were frozen for the gap and read the step as a drop (on `#test` the fake
   `now` jumped over DROP@13). On `visibilitychange` → visible, hold `drop`/`hit` detection for 1 s and let the
   followers re-seat (`ENGINE.resumeAt`); the fake path untouched. Acceptance: `parity.js fake` 0 diff; the probe's
   first 5 frames back show no glitch rows (luminance step ≤ 10 %; today FEIGEN 155 → 125 over 5 frames);
   `audit-3-*-back*.jpg` re-shot on the worklet path (minimize recipe).
3. **`tempo-3to2` (engine/tempo.js).** §9: a 3:2 tempo change with the old lag alive takes up to 8 s (the 25 %
   margin over the current tempo's score holds it). Acceptance: `test_tempo.js`'s 3:2 case (128 → 192 → 128) locks
   within 4 s, every other case unchanged to ±1 BPM, `parity real` both within 1 of 126, `tempo-trace.sh` before/after.
4. **`director-renumber` (features-synapse.js + scenes.js).** §10: `SC.mem` is not renumbered when synapse merges or
   drops a section (one stale restore). A `sectionRenumber` event (old → new, −1 dropped) applied to `SC.mem` keys.
   Acceptance: `director-trace.sh mix` × 3 → 0 `RESTORE@` lines whose filed `sectionAlt` no longer exists, and the
   renumber count per run reported — 0–1 per run closes the brief as "measured, harmless".
5. **`morph-flow-slot` (low).** §11: the morph combs TORUS's ribbons mid-fade. One `&trans=morph` vs `mixs` A/B pair
   per stroke scene (TORUS 3, POLYTOPE 5, DUST 1 with fibres) at CLOCK f178 in one montage; the slot is
   `scene.post.morph.flow` (default 1) read by `transitions/morph.js`. If the comb is not visible in the montage the
   brief closes without the slot.
6. **Probe polish (harness, tiny).** `tools/probe.js` logs `cur` changes (a fade's end or a cut); log `next` changes
   too so a hard cut is distinguishable from a soft switch in the real-window `SCENES` line.

Closed in §17's table, do not reopen without a new number: sub-59 / over-200 BPM octave reads; the 8–12-beat restore
after a surprise cut; the reversed-fade jump; DRUM's own `help.feats`; FEIGEN's memory at 1080p (150 MB, no stall,
0.74–1.1× NAV), the brief's rectangle error (history), the `&standin=0` burst; DUST's `stride` (0.13–0.28× NAV at
1440p); JULIA (NAV smoulders); `VISIT` is FEIGEN's.

## Working style (unchanged)

Orchestrator owns core/engine/contracts/parity/harness; scenes and scene fixes go to a worker in an isolated worktree
from a brief in `docs/workers/` (opus, own `PORT=`, one Chrome each, never more than two on the machine, none while a
Q trace runs; a wait loop is `timeout 500 tail -f <log> | grep -q -m1 GO`). `node tools/check.js` after every edit;
`GPU=1 node tools/parity.js fake` 0 diff after any core/engine change; `tools/scene-md5.sh` before/after any core
change; the director-blind mixs md5 `a6e2b8cd…` and FEIGEN's `dee30d91…`/`eb8aa082…` are the "nothing underneath
changed" proofs; `GPU=1 tools/accept.sh` 0 FAIL before a commit that claims a phase. Cost numbers follow HARNESS
"Bench protocol" (pin `q`, n ≥ 300, medians, NAV interleaved, pairs, nothing else on the machine). Real-window checks:
HARNESS "Real window" (the music in its own window; minimize for a hidden check). Pitfalls already paid for are in
HARNESS "Pitfalls" and the memory note; the malware-consideration reminder does not apply to this repo.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` · no `Math.random()`, no wall
clock · module cap 350/500 · `parity.js fake` 0 diff · the reference md5s unchanged · `accept.sh` 0 FAIL before a tag.
