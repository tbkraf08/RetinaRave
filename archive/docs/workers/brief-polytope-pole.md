# POLYTOPE pole-streak worker brief (v0.2 §16 ride-along) — read docs/workers/brief-common.md first (the "may read"
# rules and the report format apply; no synapse source this time)

Target: `assets/scenes/polytope/poly4.js` (the projection + emit loop; `index.js` only if a constant lives there).
PORT=8780. Own worktree; commit messages start `POLYTOPE-POLE:`. **One Chrome at a time from you.**

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/CONTRACTS.md` (§1.9, §1.12), `docs/HARNESS.md`,
`docs/DECISIONS.md` §8 only, `docs/workers/polytope.md`, `assets/scenes/polytope/*`, `tools/check.js`,
`tools/accept/v0.2/poly-t6.jpg` and `s5-t6.jpg` / `s5-t14.jpg` (the pictures with the streaks). Not `core/`, not
other scenes.

**Why.** DECISIONS §8's polish note: edges crossing near the projection pole leave long straight streaks off-frame at
t6 (`accept/v0.2/poly-t6.jpg`, `s5-t6.jpg`). The pole `(0,0,0,1)` is the point at infinity of the stereographic map;
the current gate is `den = 1 − w/|v| > 0.16` with the ramp `min((den − 0.16)·3.5, 1)` and a view-depth term. A
subdivided edge piece with one end near the gate projects to a segment of enormous length: the gate passes it, the
fade does not kill it, and it draws as a streak.

**The change (pick by the shots, ship one):** (a) fade by **projected segment length** — attenuate a piece by
`smooth((Lmax − |p1 − p0|)/Lmax)` (a piece longer than `Lmax` ≈ 1.5 × the polytope's projected radius vanishes), through
brightness/alpha as §1.12 says (alpha is coverage; a fade is colour), or (b) a tighter gate (`den > 0.24` with the ramp
re-based so that at `den = 0.16 + 0.29` it is 1 as today). Both are continuous in the rotation angles (`cuts:
'continuous'` — nothing may pop: a piece must fade in and out, never appear). Counts, subdivisions, the cast, the
camera, `feats`, `help`, `look`, `post` untouched.

**Acceptance (repo root, all must pass):**
1. `node tools/check.js` → 0 fail, 0 warn on your files.
2. Shots `PORT=8780 GPU=1 node tools/cdp.js 'test&scene=5' '[{"wait":6000},{"shot":"work/polyp-t6"},{"wait":8200},{"shot":"work/polyp-t14"}]'`
   → montage against `tools/accept/v0.2/s5-t6.jpg` / `s5-t14.jpg` (`python3 tools/montage.py tools/work/polyp-ab.jpg 2 tools/accept/v0.2/s5-t6.jpg tools/work/polyp-t6.jpg tools/accept/v0.2/s5-t14.jpg tools/work/polyp-t14.jpg`);
   Read it: the streaks at t6 gone or clearly shorter, the cells otherwise the same picture. Count the streaks you see
   before and after in one line.
3. Continuity: `CLOCK=1 PORT=8780 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=5' '[{"until":"window.CARD"},{"until":"window.__FRAME>=350"},{"shot":"polyp-f350"},{"until":"window.__FRAME>=351"},{"shot":"polyp-f351"},{"until":"window.__FRAME>=352"},{"shot":"polyp-f352"},{"until":"window.__FRAME>=360"},{"shot":"polyp-f360"},{"until":"window.__FRAME>=840"},{"shot":"polyp-f840"}]'`
   → the mean |Δ| per pixel between 350→351 and 351→352 (python3 + PIL + numpy, grey) is in the same range as the
   same pair on the unmodified scene (measure both: `git stash` is not available to you — shoot the baseline first,
   before your edit, into `polyp-base-f35x`); run the f360/f840 pair twice → identical md5s (determinism).
4. Bench, tier 3 pinned, before and after your edit in the same session shape: `CARD.bench(5,300)` × 3 medians —
   within noise (the emit loop gains one length test per piece).
5. Real path 45 s: `PORT=8780 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'` → `[]`, `[]`, 0 `[EXC]`.

**Report** (`docs/workers/polytope-pole.md`): brief-common (a)–(e), which of (a)/(b) shipped and why, the |Δ| and md5
lines verbatim, the bench numbers, the streak counts. Leave the worktree committed; do not merge.
