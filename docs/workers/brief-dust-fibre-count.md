# DUST fibre-count worker brief (v0.2 §16 ride-along) — read docs/workers/brief-common.md first (the "may read" rules
# and the report format apply; no synapse source this time)

Target: `assets/scenes/dust/fibre.js` (and `index.js` only if a count is read there). PORT=8779. Own worktree; commit
messages start `DUST-FIBRE-COUNT:`. **One Chrome at a time from you.**

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/CONTRACTS.md` (§1.4, §1.6, §1.12), `docs/HARNESS.md`,
`docs/DECISIONS.md` §14 only, `docs/workers/dust-fibre.md`, `assets/scenes/dust/*`, `tools/check.js`. Not `core/`,
not other scenes.

**Why.** §14 measured the Hopf-fibre overlay at **+1.37 ms at tier 3 for 3168 segments** (4 tori × 12 fibres × 66
segments; the line renderer costs 0.4 µs per segment, CONTRACTS §1.12), against +0.17 ms at tier 0. DUST at tier 3 is
2.7 ms with it, the same as NAV. §14's polish note: `4 × 10 × 56 = 2240` (tier 2's counts) is visually the same picture.

**The change.** Tier 3's fibre count becomes 2240 segments: in `fibre.js`, `QT = [0.4, 0.7, 1, 1.4]` → `[0.4, 0.7, 1, 1]`
(so `counts(3) === counts(2)`; `CAP` follows by construction). Nothing else: the points path, `hooks.fibres`, `feats`,
`help`, `look`, `post`, `cuts: 'onset'` untouched. If you find a cheaper way to keep 12 fibres per torus at tier 3
within +0.9 ms (e.g. fewer segments per fibre, `N` 66 → 48, at the same `nF`), you may propose it in the report with
its bench, but ship the `QT` change.

**Acceptance (repo root, all must pass):**
1. `node tools/check.js` → 0 fail, 0 warn on your files.
2. **The points path is untouched:** `CLOCK=1 PORT=8779 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=1&fibres=0' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"dustc-off-f360"},{"until":"window.__FRAME>=840"},{"shot":"dustc-off-f840"}]'`
   → md5 **`e49cf54e…` / `7119a542…`** (§14's fibres-off md5s; print the full hashes).
3. Determinism with fibres on: the same command without `&fibres=0` twice (`dustc-on-f360a/b`, `f840a/b`) → identical
   pairs. They will differ from §14's on-md5s (`669aac71…` / `f26d50de…`) only because the count changed — say so.
4. **Bench, interleaved on/off as §14 did**, tier 3 pinned (`setInterval(()=>CARD.Q.q=0.95,16)`, wait 8 s):
   `PORT=8779 GPU=1 node tools/cdp.js 'test&scene=1' '[{"until":"window.CARD"},{"eval":"setInterval(function(){CARD.Q.q=0.95},16);1"},{"wait":8000},{"eval":"(function(){var on=[],off=[];CARD.bench(1,400);for(var i=0;i<3;i++){CARD.hooks.fibres(1);on.push(CARD.bench(1,400));CARD.hooks.fibres(0);off.push(CARD.bench(1,400));}CARD.hooks.fibres(1);var s=function(a,b){return a-b};on.sort(s);off.sort(s);return JSON.stringify({on:on,off:off,tier:CARD.ctx.tier(),segs:CARD.REG[1].scene.rt.log,glerr:CARD.ctx.gl.getError(),errs:CARD.ERRS})})()"}]'`
   → the on−off median difference ≤ **0.95 ms** (was 1.37); report the six numbers.
5. Shots: `PORT=8779 GPU=1 node tools/cdp.js 'test&scene=1' '[{"wait":6000},{"shot":"work/dustc-t6"},{"wait":8200},{"shot":"work/dustc-t14"}]'`
   → montage against `tools/accept/v0.2/s1-t6.jpg` / `s1-t14.jpg` (`python3 tools/montage.py tools/work/dustc-ab.jpg 2 tools/accept/v0.2/s1-t6.jpg tools/work/dustc-t6.jpg tools/accept/v0.2/s1-t14.jpg tools/work/dustc-t14.jpg`);
   Read it: the rings still read as linked Hopf tori threading the swarm, no torus lost.
6. Real path 45 s: `PORT=8779 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'` → `[]`, `[]`, 0 `[EXC]`.

**Report** (`docs/workers/dust-fibre-count.md`): brief-common (a)–(e), the md5 lines of 2–3 verbatim, the bench
numbers, what the montage showed. Leave the worktree committed; do not merge.
