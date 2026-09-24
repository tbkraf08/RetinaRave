# Fable Session Prompt — Eigenwobble v0.3 (stub, written at the v0.2 tag, 2026-09-23)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.2 is tagged** (`git tag v0.2`; `releases/eigenwobble-v0.2.html` runs from
`file://` anywhere; `tools/accept/v0.2/accept-17.txt` is the sweep behind the tag). It was audited in a real window
(`docs/AUDIT-v0.2.md`: five checks, no engine bug, two help-view fixes) and every "Left open" line of v0.2 was decided
in DECISIONS §17's triage table. This file is the v0.3 list that table produced — plus the colour block (items 2–6,
added after the tag from a note on OKLCH and escape-data channels; DECISIONS §17 "Added after the tag") — in priority
order, with the numbers that motivate each item. **All ten items were done on 2026-09-23 (DECISIONS §18–§25);
the sweep behind them is `tools/accept/v0.3/accept-25.txt`. v0.3 is not tagged: a real-window audit like §17's
(AUDIT-v0.2.md) is the next session's first job, then the tag and `releases/eigenwobble-v0.3.html`.**

Ids 7–8 stay free: no new scene is on the v0.3 list (the candidate list — NEWTON, MODULAR, KLEIN, LORENZ — is in
DECISIONS §17's triage table for whenever a scene phase is opened).

**Read first:** `docs/CONTRACTS.md` (the one required read for scene/effect/stage authors) · `docs/HARNESS.md`
("Bench protocol", "Q trace", "Real window", "Pitfalls") · `docs/DECISIONS.md` §16–§17 · `docs/AUDIT-v0.2.md` ·
`docs/workers/*.md` (what workers tripped on) · memory note
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.

## The v0.3 briefs (priority order)

1. ✅ **DONE 2026-09-23 (DECISIONS §18; probe polish, item 10, with it).** **`resume-hold` (engine, small, parity-neutral).** Audit 3: the first frames back from a hidden tab carry the
   composite's drop rows — the v3 followers were frozen for the gap and read the step as a drop (on `#test` the fake
   `now` jumped over DROP@13). On `visibilitychange` → visible, hold `drop`/`hit` detection for 1 s and let the
   followers re-seat (`ENGINE.resumeAt`); the fake path untouched. Acceptance: `parity.js fake` 0 diff; the probe's
   first 5 frames back show no glitch rows (luminance step ≤ 10 %; today FEIGEN 155 → 125 over 5 frames);
   `audit-3-*-back*.jpg` re-shot on the worklet path (minimize recipe).
2. ✅ **DONE 2026-09-23 (DECISIONS §24, worker `feigen-oklch.md`; L from the scale-free DE, field 0.5 under the linear chain).** **`feigen-oklch` — FEIGEN's colour pass on OKLCH channels (scene, worker brief, no re-tune cost).** The field
   already decodes every texel to `(log d, log₂G, ea, trap)` — the distance estimate, the Green's potential and the
   external angle. Today they go through a cosine `palM` in sRGB. New mapping in `scenes/feigen/colour.js` only:
   **L ← log₂G** (log/sqrt before mapping so depth > 50 does not saturate), **H ← external angle** (external rays
   become iso-hue lines: wakes and Misiurewicz points read off the picture), **C ← DE / pixel size** (chroma fades to
   black below threshold — what keeps the boundary crisp at depth), interior from the trap; a cyclic hue at constant
   L ≈ 0.7, C ≈ 0.11 (the largest chroma in sRGB gamut at every hue), OKLCH → OKLab → linear → encode, clip after.
   Acceptance: the field and its build md5s untouched (the colour pass is the only change); Q trace after = `none` to
   the second decimal (the decode already exists — cost neutral); 0 gamut-clipped pixels on a full hue sweep; the
   L 4 boundary before/after shot and the seam ratio at `RUNG@` frames unchanged; the FEIGEN reference md5s re-based
   in the brief's report.
3. ✅ **DONE 2026-09-23 (DECISIONS §20; default linear, `&linear=0` = the v0.2 chain; md5s re-based, mixs 425a66e5…).** **`linear-chain` — the effect chain in linear light (core, `&linear=1` first, then re-base every md5).** Bloom is a
   blur + add and the additive scene layers (`ONE, ONE` in DUST/NAV, `blend: 'add'` in `ctx.lines`) add light — both
   are light transport and are done on gamma-encoded values today (dark fringes between complementary hues, channel-
   wise clipping to white 3× too soon). The composite's tonemap `1 − exp(−1.5c)` is a linear-radiance operator applied
   to encoded values and written to the screen without an encode step: display white is unreachable (a full-white
   input maps to 0.78). Feedback is a `max` and is space-invariant; crossfades (mixs, morph) are perceptual and stay
   encoded (a linear dissolve has the mid-fade brightness bump) — or move to OKLab with item 4. Shape: decode scene
   output as sRGB at the chain input, bloom / additive / exposure gain / tonemap in linear (RGBA16F is built for it),
   encode before dither; unblended pixels come out byte-identical, only regions where light is added change.
   Acceptance: dark-fringe depth across a blurred red/cyan edge (min luma relative to the endpoints) from ≈ 0.6 to
   ≥ 0.95; the clip fraction (any channel ≥ 1 before the tonemap) on DUST at the fake drop frame falls; display white
   reachable at 1.0; the re-tune list capped at bloom threshold, exposure `TARGET`, feedback decay, DUST point gain;
   A/B montage per scene at f360/f840 decides, then `scene-md5.sh`, the mixs and FEIGEN md5s and `accept.sh` are
   re-based in one commit that says so (`parity.js fake` stays 0 diff — it compares state, not pixels).
4. ✅ **DONE 2026-09-23 (DECISIONS §19: `ctx.oklch`, CONTRACTS §1.14, test_oklab + oklch-smoke in accept.sh).** **`oklch-palette` — an OKLCH palette chunk as a core slot (opt-in, CONTRACTS §3).** The shared `pal()` in
   `core/gl.js` is a tinted cosine palette in gamma sRGB and five scenes carry their own `palM`; no OKLab code exists
   in the repo. A GLSL chunk `palOK(h, L, C)` (OKLCH → linear sRGB, gamut-clipped), never the default. Acceptance: 0
   gamut-clipped pixels on a full hue sweep at L 0.7 / C 0.11; distinct 8-bit levels along an equipotential vs the sRGB
   palette (banding); interpolation in OKLab, never in gamma. Taken up by items 2 and 5.
5. ✅ **DONE 2026-09-23 (DECISIONS §25, worker `nav-hue.md`, two passes; with item 6).** **`nav-multiplier-hue` (taste on the v3 picture — gated on a montage).** NAV's interior already has Koenigs bands
   and `uPar` (the multiplier modulus driving the smoulder); new: **hue from arg λ** (the internal angle), so a
   component's internal rays and its root/cusps read off the image; `|λ| → L`. `nav.js` state untouched, so
   `parity.js fake` 0 diff by construction; f360/f840 A/B montage decides.
6. ✅ **DONE with item 5 (§25: θ = 7/8 reads the same hue in the PiP and the main view).** **`pip-hue` (after 5).** NAV's picture-in-picture Julia (`pipPath`): for connected J_c the exterior external angle
   equals the parameter's, so with external angle driving hue the PiP shares it — a ray in M and its image in J_c read
   the same. Small once 2 or 5 exist.
7. ✅ **DONE 2026-09-23 (DECISIONS §21: short-window 3:2 arbitration; 4 s up / 4 s down; traces clean).** **`tempo-3to2` (engine/tempo.js).** §9: a 3:2 tempo change with the old lag alive takes up to 8 s (the 25 %
   margin over the current tempo's score holds it). Acceptance: `test_tempo.js`'s 3:2 case (128 → 192 → 128) locks
   within 4 s, every other case unchanged to ±1 BPM, `parity real` both within 1 of 126, `tempo-trace.sh` before/after.
8. ✅ **DONE 2026-09-23 (DECISIONS §22: `sectionRenumber` event, SC.mem follows; measured 2/0/1/0 per mix run, all identity on filed keys, 0 stale).** **`director-renumber` (features-synapse.js + scenes.js).** §10: `SC.mem` is not renumbered when synapse merges or
   drops a section (one stale restore). A `sectionRenumber` event (old → new, −1 dropped) applied to `SC.mem` keys.
   Acceptance: `director-trace.sh mix` × 3 → 0 `RESTORE@` lines whose filed `sectionAlt` no longer exists, and the
   renumber count per run reported — 0–1 per run closes the brief as "measured, harmless".
9. ✅ **DONE 2026-09-23 (DECISIONS §23: `post.morph.flow`, TORUS 0.4, montage decided).** **`morph-flow-slot` (low).** §11: the morph combs TORUS's ribbons mid-fade. One `&trans=morph` vs `mixs` A/B pair
   per stroke scene (TORUS 3, POLYTOPE 5, DUST 1 with fibres) at CLOCK f178 in one montage; the slot is
   `scene.post.morph.flow` (default 1) read by `transitions/morph.js`. If the comb is not visible in the montage the
   brief closes without the slot.
10. ✅ **DONE with item 1 (§18).** **Probe polish (harness, tiny).** `tools/probe.js` logs `cur` changes (a fade's end or a cut); log `next` changes
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
