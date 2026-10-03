# Handoff — §90 IBelongHere's three times (2026-10-02, builder worker)

**STATUS: DONE 2026-10-02** — the chain finished (md5: 10 lines identical, s2 = the MANDALA worker's §87/§88; accept.sh 201 lines 0 FAIL), the placeholders are filled, the docs committed, the v90 worktrees removed. Kept as the record of the session.

**Stopping point (as written mid-session):** the three fixes are committed on `main` (not pushed / tagged / deployed): `54cfbe8` step 1 (0:10, `CLOCK.SW_Y1`
measured and left OFF), `a45f5d6` step 2 (0:47, the kick lane's clock-line rule `PERCK.lineKick`), `9985bcf` step 3 (1:04,
`HOLD_Y1` 0.3 / `R_Y1` 0.2 / `RATE_Y1` 0.15). Docs written but NOT committed: `docs/DECISIONS.md` §90 (three placeholders
`{DUST_TABLE}`, `{MD5}`, `{ACCEPT}`), `docs/OPEN-ITEMS.md` (§90 entry at the end), `docs/HARNESS.md` (knob lines + the page=node wire),
`docs/CONTRACTS.md` (the kick event's `line` flag).

**Running / to finish (the Chrome chain, one page at a time, background):** `../RetinaRave-v90-after` (worktree of `9985bcf`):
`tools/work/v90/dust-after.json` (dust-trace IBelongHere 0–75, scene 1, WARM=0, port 8902) → `tools/work/v90b-md5.txt` in
`../RetinaRave-v90-before` and `tools/work/v90a-md5.txt` in the after worktree (scene-md5.sh, ports 8903 / 8904; the diff in
`../RetinaRave-v90-after/tools/work/v90/md5.diff` must be EMPTY — the fake has no clock / ears) → `tools/work/v90/accept.log` in the
after worktree (accept.sh, port 8905, ACC=v0.29; expect 0 FAIL except s2 lines = the parallel MANDALA worker's §85/§86 commits —
compare against the before worktree's s2 md5 in v90b-md5.txt to attribute).

**How to continue:** 1. `python3 tools/work/v90/dustwin.py ../RetinaRave-v90-before/tools/work/v90/dust-before.json
../RetinaRave-v90-after/tools/work/v90/dust-after.json` → fill `{DUST_TABLE}` in DECISIONS §90 (before row is already measured:
42–52 crest −37.2 med, page clock −38.4, kick 9/21; 59–65 crest −16.6 (p90 −3.6), page clock −19.9 p90 32.9; 65–69 −38.4 / −42.3).
2. Fill `{MD5}` (0 moved lines, or stop and explain) and `{ACCEPT}` (FAIL count + attribution). 3. `git add docs/DECISIONS.md
docs/OPEN-ITEMS.md docs/HARNESS.md docs/CONTRACTS.md data/handoffs/2026-10-02-v90-ibelonghere.md` and commit "§90 docs …".
4. Remove the worktrees: `git worktree remove ../RetinaRave-v90-before ../RetinaRave-v90-after` (NOT the `-m*` ones). 5. The final
report (under 20 lines; the numbers are all in §90).

**Decisions + rationale:** fix 1 rejected by measurement (the five right cold locks switch at y1 0.19–0.64, the wrong at 0.25; six
discriminators tried); fix 2 = beat line only at ph 0.06 / conf 0.85 (the 8th line puts 17 % of SeeYouDrop's kicks on 808 notes), and
the clock NEVER takes a line kick as a tick (fed, Vienna's clock breaks) — so the six clock-study traces stay byte-identical; fix 3 =
dynamic knobs instead of the static R_CLS [1,3,6] (which breaks four tracks); Vienna's whole-track |p90| is a knife edge (119 ↔ 314).

**Pitfalls:** never `git stash` in the main tree (the MANDALA worker's modified files are there); clock.js / period.js carried the
fix-3 knobs before their commit — commits were sliced by regenerating the file; background sweeps spawn a node per track, so do not
edit engine files while one runs; `tools/work/*` is git-ignored — the worktrees need the six `<T>.48000.st.f32(.json)` symlinks.
