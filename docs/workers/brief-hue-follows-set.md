# hue-follows-the-set worker brief (v0.3 close, item 2 — a diagnosis gated on a montage) — read brief-common.md first

**The user's sentence (2026-09-23, on the §24/§25 OKLCH passes):** "the colours don't seem to match up with the set."
The orchestrator's diagnosis to *test, not assume*: in both OKLCH passes the hue is the **external angle**, so the colour
cells are the radial sectors of the binary decomposition — they cut *across* the filaments and the Green's bands instead
of following them, and a viewer reads the colour as unrelated to the shape. This brief answers with one montage per
scene: which hue coordinate makes the colour follow the set? **No new mapping is chosen before the montage is read.**
The default look is v0.2's (item 1, a parallel worker, restores it); whatever wins here becomes the mapping of the
opt-in `oklch` variant only.

Targets (experiment only, on a `#test` hook): `assets/scenes/feigen/colour.js` + `feigen/index.js`,
`assets/scenes/nav/shaders.js` + `nav/index.js`. **Do not touch** `feigen/field.js`, `feigen/ladder.js`, `nav/nav.js`,
`core/`, `engine/`, `effects/`. PORT=8792. Own worktree; commit messages start `HUE-SET:`. **One Chrome at a time from
you**; never `pgrep -f`/`pkill -f` a pattern that can match your own shell (bracket a letter); a wait loop always sleeps.

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/CONTRACTS.md` (§0, §1.1, §1.4, §1.10, §1.14),
`docs/HARNESS.md` ("Static checks", "Headless Chrome", "OKLab"), `docs/DECISIONS.md` §15, §16, §19, §24, §25,
`docs/workers/feigen-oklch.md`, `nav-hue.md`, `brief-feigen-oklch.md`, `brief-nav-hue.md`, your target folders,
`assets/core/oklch.js` (read only; `okCmax(L)` is the every-hue chroma budget), `tools/montage.py`, `tools/check.js`.

**The experiment.** A `#test` hook `hueco(v)` on each scene (hooks fire before `init`, keep the value on the module's
state object, CONTRACTS §1.4) → a uniform `uHueCo` (int) the OKLCH branch reads to pick the hue coordinate. Everything
else in the pass stays as shipped **except** the lightness and chroma for this montage: **L ≤ 0.5 and C = `okCmax(L)`
(full chroma)** on every coordinate — the pale look the user saw was L 0.7 under the linear tonemap (§24), and it must
not confound the hue question. Use the shipped L where it is already ≤ 0.5, `min(L, 0.5)` where it is not.
- FEIGEN (`colour.js`, the decoded `(d, lG, ea, trap)` at line ~133): `uHueCo` 0 = **ea** (shipped: `H = ea + uHue…`);
  1 = **the Green's potential** `H = k·lG + uHue` (level sets = iso-hue, colour follows the boundary's contours; pick
  `k` so one hue turn spans a few doublings of the potential in view — say what you chose and why, try two values if
  the first is a wash); 2 = **the distance** `H = k·log2(d) + uHue` (bands parallel to the boundary; same care with
  `k`). Interior branch unchanged.
- NAV (`shaders.js`, `FS_JULIA`): `uHueCo` 0 = shipped (arg λ inside, ea outside); 1 = **the Koenigs coordinate
  `Lk`** inside (`H = Lk·k + uPal.x`, the bands become hue bands) and **the escape count** outside (`H = sn·k + uPal.x`
  with the smooth count `sn` — iso-hue = equipotentials of J_c). The PiP: leave as shipped in both.

**Montage (the deliverable).** CLOCK shots, `GPU=1 CLOCK=1`, `{until:'window.__FRAME>=N'}` then `{shot}`:
- FEIGEN: `test&scene=6&hueco=X` at f360 and f840, and `test&scene=6&feig=3.6&hueco=X` at f360 (a deep rung —
  `feig` is the dive hook), for X = 0, 1, 2 → `python3 tools/montage.py tools/work/hue-set-feigen.jpg 3 <9 shots, row =
  coordinate, column = shot>`. Add a fourth row: the same three shots from a detached worktree at the `v0.2` tag
  (`git worktree add --detach ../wt-v02-hue v0.2; cd there; PORT=8792 …` — the v0.2 chain, not the linear one; that is
  fine for a question about hue geometry, and say so) → a 4-row montage, v2 the last row. Remove the worktree after.
- NAV: `test&scene=0&hueco=X` at f360 and f840 for X = 0, 1, plus the same two from the v0.2 worktree → a 3-row
  montage `tools/work/hue-set-nav.jpg`.
- Two montages max; if a row is unreadable at montage scale, also keep the full shots (they are in `tools/work/`).

**Read the montages and answer, per scene, in `docs/workers/hue-follows-set.md`:** for each coordinate, do the colour
cells *follow* the set (iso-hue lines parallel to the boundary, the filaments and the Green's bands each one colour
along their length, a bulb one hue) or *cut across* it (radial sectors pinching at the boundary, one filament crossing
several hues)? Which one makes the colour "match up with the set" the way v0.2's row does? Is the winner clearly better
than the shipped ea mapping — or is v0.2's cosine palette (which is a potential/distance colouring) simply the thing the
user recognises, in which case say "the OKLCH variant should colour by potential/distance too" or "none beats v2, leave
the shipped mapping as the variant"? One verdict line per scene, then the evidence.

**Acceptance:** `node tools/check.js` 0 fail (the hook's uniform is fetched); `hooks.clipdbg` still 0 clipped at f360
for X = 0 on both scenes (the chroma is `okCmax`, so it should hold at every X — report the count for each X);
`PORT=8792 GPU=1 node tools/parity.js fake` 0 diff (you must not have moved state). Commit the hook + shader branches
(`HUE-SET: hue-coordinate probe`) — with `hueco` = 0 the shipped pass must be **byte-identical**: `PORT=8792
tools/scene-md5.sh hueset` s0/s6 = `tools/accept/v0.3/scene-md5-v03.txt`'s s0/s6 (the L/C change applies only when
`hueco` ≠ 0 — gate it on the uniform so 0 is the shipped pass, bit for bit).

**Then stop and report.** Do not apply the winner to master's mapping yourself: item 1 is landing the colour-variant
slot in parallel, and the winner goes into the `oklch` variant only, on a second instruction from the orchestrator
(you will be messaged in this same session — keep your worktree). Report shape: brief-common's (friction, temptations,
outputs verbatim, doc errors) + the two verdicts + the `k` constants you settled on and why.
