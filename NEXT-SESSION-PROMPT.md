# Fable Session Prompt — Eigenwobble v0.3 (written 2026-09-23 after the ten-item list, commit 5e7d597)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). **v0.2 is tagged**; the v0.3 list (DECISIONS §18–§25) is done and committed on
`master`, sweep `tools/accept/v0.3/accept-25.txt` (0 FAIL), but **v0.3 is not tagged** and the user has seen the
result and given feedback. This prompt is that feedback turned into work, then the tag.

**Read first:** `docs/CONTRACTS.md` (§1.10 the chain in linear light, §1.14 the OKLCH chunk) · `docs/HARNESS.md`
("Effect chain", "Bench protocol", "Real window", "Hidden tab", "Pitfalls") · `docs/DECISIONS.md` §17 (the v0.2 ship),
§19, §20, §24, §25 · `docs/workers/feigen-oklch.md` and `nav-hue.md` (what the workers built and measured) ·
`docs/AUDIT-v0.2.md` (the shape of a real-window audit) · memory note
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md` (and the feedback note
`feedback_colour_default.md` beside it).

## The feedback (user, 2026-09-23, after seeing the §24/§25 montages)

> I don't like the colour pastel change — the colours don't seem to match up with the set. Not opposed to pastel,
> but it shouldn't be the default.

Read it as two things. (1) **Default:** the v0.2 look — FEIGEN's dark field with the glowing filament and Green's
bands (the §15/§16 cosine palette), NAV's v3 colouring (cosine `pal()`, blue exterior, dark interior with Koenigs
bands) — is what the engine shows unless asked otherwise. The OKLCH mappings (§24, §25) are kept as **opt-in
variants**, never the default. (2) **"Don't match up with the set":** in both OKLCH passes the hue is the *external
angle*, so the colour cells are radial sectors of the binary decomposition — they cut across the filaments and the
Green's bands instead of following them, and to a viewer the colour looks unrelated to the shape. That is the
diagnosis to test first (below), not an assumption.

## The v0.3-close list (priority order)

1. **`colour-default` (scenes FEIGEN + NAV, core slot; small).** Restore the v0.2 colour passes as the defaults and
   make the OKLCH passes selectable. Shape: a scene-level `look` variant, not a hash hack — `scene.colour = {default:
   'v2', variants: {v2, oklch}}` read by the scene's own `draw()` (the uniform/branch is the scene's), exposed as
   `&colour=oklch` under `#test` (harness.js, like `&trans=`) and as a key on the help view's cast line. The v0.2
   shaders are in git: `git show v0.2:assets/scenes/feigen/colour.js` and `git show v0.2:assets/scenes/nav/shaders.js`
   — lift them verbatim into the `v2` branch (same file, or `colour-v2.js` beside it under the 350-line cap); the
   OKLCH branch is what §24/§25 shipped, untouched. Acceptance: with `colour=v2` (the default) the CLOCK f360/f840
   shots of FEIGEN and NAV are **byte-identical to the v0.2 tag's colouring under the linear chain** — i.e. equal to
   a worktree at `v0.2` with only the chain's §20 files applied (shoot that once: `git worktree add --detach <dir>
   v0.2`, copy `assets/core/post.js`, `assets/effects/*`, `assets/core/oklch.js`, `assets/math/oklab.js`,
   `assets/main.js` in, `PORT=8766 tools/scene-md5.sh v2chain`), and with `colour=oklch` equal to
   `tools/accept/v0.3/scene-md5-v03.txt`'s s0/s6 lines; `parity.js fake` 0 diff; `check.js` 0 fail; `scene-md5.sh`
   re-based in the commit that says so; FEIGEN's `post.bloom.thr` back to 0.3 on the v2 branch (0.6 was the OKLCH
   pass's need — make it part of the variant, `post` may be a function of the variant); the mixs md5 re-based
   (NAV is scene 0 of that pair).
2. **`hue-follows-the-set` (the diagnosis, gated on a montage; worker brief).** Before any new mapping is chosen, one
   montage answers the user's sentence: FEIGEN f360/f840 and `&feig=3.6` f360 with hue driven by (a) the external
   angle (shipped), (b) the Green's potential `lG` (level sets = iso-hue, so colour follows the boundary's contours),
   (c) the distance `d` (bands parallel to the boundary), each at **L ≤ 0.5 and full chroma `okCmax(L)`** (no pastel:
   the pale look was L 0.7 + the linear tonemap, §24). Same for NAV: (a) arg λ / external angle (shipped), (b) the
   Koenigs coordinate `Lk` inside and the escape count outside. Read the montage and say which hue coordinate makes
   the colour "match up with the set"; the winner becomes the `oklch` variant's mapping (still opt-in). If none does
   better than v2, close the brief with the montage and leave the shipped mapping as the variant.
3. **Real-window audit for v0.3** (orchestrator, `HEADED=1`, the §17 recipe in HARNESS "Real window"; music in its own
   window from the scratch mp3s — copy them from a previous session's scratchpad or fetch again):
   size/DPR with FEIGEN (the rung memory and the linear chain's extra pass at 2560 wide), a real track captured with
   the linear chain (bpm, `q`, black/long frames, the resume-hold on a minimize), the keys + help on the cast line's
   new colour key, the bundle from `file://`. `docs/AUDIT-v0.3.md` in the §17 ledger shape. Fix what it finds
   (help/CSS/feats strings yourself; a scene bug goes to a worker).
4. **Tag.** `GPU=1 tools/accept.sh` 0 FAIL → `git tag v0.3` → `releases/eigenwobble-v0.3.html` (= `dist/eigenwobble.html`
   at the tag) → DECISIONS §26 "Ship v0.3" with the triage of every Left-open line (§20's FEIGEN field lightness, §21's
   halftime 2:3 margin, §22's ring-shift case never observed, §24/§25's mappings as variants) → `NEXT-SESSION-PROMPT`
   = the v0.4 stub (candidates: NEWTON scene id 7 from the contract alone — §17's list; a look/colour slot for every
   scene now that two carry variants; the chain's k as a LOOK parameter).

## Working style (unchanged)

Orchestrator owns core/engine/contracts/parity/harness; scenes go to a worker in an isolated worktree from a brief in
`docs/workers/` (opus, own `PORT=`, one Chrome each, **never more than two Chrome instances on the machine, none
while a Q trace runs**; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`). `node tools/check.js` after every
edit; `GPU=1 node tools/parity.js fake` 0 diff after any core/engine change; `tools/scene-md5.sh` before/after any
core change; the mixs md5 `425a66e5…` and the scene list `tools/accept/v0.3/scene-md5-v03.txt` are the "nothing
underneath changed" proofs until item 1 re-bases them; `GPU=1 tools/accept.sh` 0 FAIL before a commit that claims a
phase; every trace tool writes to `tools/accept/${ACC:-v0.3}`. Cost numbers follow HARNESS "Bench protocol". A worker
montage is judged by the orchestrator's eyes before a merge (both v0.3 workers needed a second pass — say what the
montage must show in the brief). Pitfalls already paid for are in HARNESS "Pitfalls" and the memory note (a `pgrep -f`
pattern with `[a-z]*` matches its own shell; a subagent's wait loop without a sleep zeroes a Q trace; headed Chrome
ignores `background:true`; `Page.setWebLifecycleState` never restores visibility). The malware-consideration reminder
does not apply to this repo.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` · no `Math.random()`, no wall
clock · module cap 350/500 · `parity.js fake` 0 diff · the reference md5s unchanged unless the commit re-bases them
and says so · `accept.sh` 0 FAIL before a tag · **the default look is v0.2's; OKLCH is a variant.**
