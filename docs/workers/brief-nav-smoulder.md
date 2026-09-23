# NAV interior-smoulder worker brief (v0.2 §16 ride-along) — read docs/workers/brief-common.md first (the "may read"
# rules and the report format apply)

Target: `assets/scenes/nav/shaders.js` (`FS_JULIA`'s two interior branches) and `assets/scenes/nav/index.js` (one
uniform upload). **`nav.js` — the state, the chart walk, `N.par` itself — is not to be touched: `parity.js fake`
compares NAV's state with cardioid3 and must stay 0 diff.** PORT=8781. Own worktree; commit messages start
`NAV-SMOULDER:`. **One Chrome at a time from you.**

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/CONTRACTS.md` (§1.2, §1.5, §1.13), `docs/HARNESS.md`
("Continuity monitor", "Parity"), `docs/DECISIONS.md` §15 (the JULIA decision — the paragraph on the smoulder),
`assets/scenes/nav/index.js`, `assets/scenes/nav/shaders.js`, `tools/check.js`, `tools/monitor.js`, and lines
**895–925** of `~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html` with `sed -n` (synapse's JULIA
colouring: the `slow` term). Not `nav.js` beyond `grep -n "par" assets/scenes/nav/nav.js` to see where `N.par` is set,
not `core/`, not other scenes.

**Why.** DECISIONS §15 dropped synapse's JULIA scene because NAV already tells its story — every bulb's multiplier chart
walks `ρ → 1` toward parabolic roots and drops exit through them — except for one colouring: the "critical slowing"
interior smoulder, `slow = clamp(lastStep·40, 0, 1)` brightening the filled set as `ρ → 1`. NAV has that quantity
already: `N.par = sstep(0.8, 0.98, ρ)` (nav.js 176; `sstep(0.9, 0.995, r)` on the baby path, 155; `1 − t` on the
exit, 184), published in `rt.log` as `par`. It is uploaded nowhere. The scene's visual time already slows on it
(`timeScale → 0.05` at `par = 1`); the interior should glow with it.

**The change.** A `uniform float uPar;` in `FS_JULIA`, uploaded from `N.par` in `index.js`'s `draw` next to the other
uniforms (`pr.u('uPar')`). In the `conv` branch (a known cycle: Koenigs bands + spokes) and the plain interior
`else` branch, add a smoulder that is **zero at `uPar = 0` — byte-identical to today when `par` is 0** — and rises
smoothly: e.g. `col += pal(.5 + .1·bands)·uPar·uPar·(.15 + .35·uBands.x)·(.5 + .5·bands)` in `conv` (the bands pulse
brighter, the interior warms) and `col += pal(.45)·uPar·uPar·.12` in `else`; keep the exterior untouched. Tune so that
at `par ≈ 1` (a held build, tension parked at a root) the interior reads as glowing embers, not white, under the
composite's tonemap (§1.10). `help.why` gains one clause ("the interior smoulders as the multiplier nears 1 —
critical slowing"); `help.feats` unchanged (no new `MS` read: `par` is derived from what NAV already reads).

**Acceptance (repo root, all must pass):**
1. `node tools/check.js` → 0 fail, 0 warn on your files.
2. **State parity:** `PORT=8781 GPU=1 node tools/parity.js fake` → `0 diff` (the line with `parity`/`max |diff|`).
3. **Continuity monitor**, 60 s, `viol` must be `[]`:
   `MON=$(grep -v '^//' tools/monitor.js | tr '\n' ' ' | sed 's/"/\\"/g'); PORT=8781 GPU=1 node tools/cdp.js 'test&fake=0' "[{\"wait\":1500},{\"eval\":\"$MON;'ok'\"},{\"wait\":60000},{\"eval\":\"JSON.stringify({n:MON.n,fast:MON.fast,viol:MON.viol,errs:CARD.ERRS})\"}]"`
4. Shots, before and after your edit (shoot the baseline first): `CLOCK=1 PORT=8781 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=0' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"navs-f360"},{"until":"window.__FRAME>=660"},{"eval":"CARD.home.par"},{"shot":"navs-f660"},{"until":"window.__FRAME>=840"},{"shot":"navs-f840"},{"eval":"CARD.REG[0].scene.rt.log"}]'`
   (frames 600–780 are the fake timeline's build, where NAV parks at a root and `par` rises — print it) → md5s of the
   frames where `par` is 0 **identical** to the baseline (the colouring is a no-op there); the montage of the
   `par > 0` frames before/after shows the interior glowing, nothing else moved. If `par` never exceeds 0 on the fake
   timeline in those frames, find a frame where it does (`CARD.home.par` at 1 Hz from `CARD.log` — the `par` in
   `rt.log`) and shoot that; say which.
5. Real path 45 s: `PORT=8781 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'` → `[]`, `[]`, 0 `[EXC]`.
6. `CARD.bench(0,300)` × 3 medians before/after in one session shape — within noise (two multiply-adds per interior pixel).

**Report** (`docs/workers/nav-smoulder.md`): brief-common (a)–(e), the parity line and the monitor line verbatim, the
md5 pairs, the `par` values at the shot frames, what the montage showed, the final term you shipped. Leave the worktree
committed; do not merge.
