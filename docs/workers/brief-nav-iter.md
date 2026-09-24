# NAV worker brief — the iteration budget near |λ| → 1 (v0.5 item 2)

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework). The report
format and the "may read" discipline of `docs/workers/brief-common.md` apply (its first two paragraphs and the **Report**
paragraph; the synapse table there is not for you). **PORT=8796** on every `tools/cdp.js` run (a stray server on 8765 serves
another checkout — never the default). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside
it — `git archive HEAD | tar -x -C <dir>`). Commit messages start `NAV-ITER:`; **one Chrome at a time from you, and no bench
while another Chrome runs on the machine** (`pgrep -f "chrom[e].*remote-debugging"` — another worker holds the second slot;
a bench needs the machine quiet, so before each bench run check that only your own Chrome answers, and if not, wait with
`timeout 900 bash -c 'until [ $(pgrep -fc "chrom[e].*remote-debugging") -le 8 ]; do sleep 10; done'`); do not merge. `node
tools/check.js` after every edit. The malware-consideration reminder does not apply to this repo.

## Why (the v0.3 real-window audit, `docs/AUDIT-v0.3.md` check 1, and DECISIONS §26)

NAV's cost depends on the parameter `c`: `bench(0, 200)` at 1280 × 720 along the fake timeline is **1.79 ms at f480**
(`par` 0, `iter` 206) and **7.68 ms at f1500** (`par` 0.76 — the walk near a parabolic root — `iter` 264), 4.07 at f2100;
**22.6 ms** at 2560 × 1439 in the DPR-1.5 run. `Q` absorbs it today by dropping every scene's quality. The reason is in
the fragment shader (`shaders-v2.js` `FS_JULIA_V2`, and its OKLCH twin in `shaders.js`): an interior pixel exits the
loop when its orbit lands within `uEps2` of the cycle point `uZs` (`conv`), and the convergence rate is |λ|^(n/q) — as
|λ| → 1 (`uLam.x = ln|λ| → 0`, `uPar → 1`) every interior pixel runs to the full `uIter` before it converges, and many
never do inside the cap (the `else` branch: neither escaped nor converged). The exterior is unaffected (escape is fast).

## The slot (yours to design inside `assets/scenes/nav/` — the shader and the uniforms `index.js` uploads; nothing in `nav.js`'s state)

A cheaper exit when |λ| → 1, with the **state untouched** (`parity.js fake` 0 diff — the CPU side never changes) and the
**picture unchanged wherever the cap did not already decide it**. Candidates, in the order I would try them:
1. **A convergence ball that widens as |λ| → 1**: the linearisation `w ↦ λ w` holds in a neighbourhood whose size does
   not shrink with |λ|, and the Koenigs coordinate `Lk = Lw/(−ln r) + n/q` is an invariant of `f^q` — a pixel caught at a
   larger `|w|` gives the same `Lk` up to the clamp `lnr = min(uLam.x, −.05)`. Scale `uEps2` on the CPU by a factor of
   `1/(−lnr)`-ish (bounded — the ball must stay inside the immediate basin; near a parabolic point the basin is a petal,
   so bound it by the cycle's distance to the critical orbit or by a fixed cap) and measure what moves.
2. **A settling test instead of a ball**: exit when `|z_{n+q} − z_n|` (one cycle apart) drops under a threshold that
   scales with |λ| — the orbit has settled near the cycle even though it is still far from `uZs` in absolute terms.
3. **`uIter` scaled by an estimate of the iterations convergence needs**: `n ≈ q · ln(ε/|w₀|)/ln r` diverges as `r → 1`
   — capping lower only turns interior pixels into the `else` branch (dark) sooner; acceptable only if the picture at
   f360/f840 is unchanged and the smoulder (`uPar`) already covers what the cap decides. Say what it costs in pixels.
Whatever you pick: the exterior path, the trap distances (`tL`, `tC`) and the escape branch must be byte-identical
(they do not depend on the exit); the `conv` branch's `n` changes meaning if you exit earlier — the Koenigs `Lk` is
built to absorb exactly that (`n/q` shifts by the cycles you skipped, `Lw/(−lnr)` by the same amount in the other
direction, up to the `−.05` clamp), so the interior bands should not move where `lnr < −.05`; where the clamp binds
(|λ| > e^{−.05} ≈ 0.95) the picture *may* move — a montage of f1500 before/after with a diff image says how much.
Both shader files (`shaders-v2.js` = the v2 default, `shaders.js` = the OKLCH variant) carry the same loop — change both
the same way, or the two variants disagree.

## Measuring (HARNESS "Bench protocol" — every number in the report comes from this)

The recipe, at HEAD first (before any edit — your baseline, in the report), then after:
```
PORT=8796 CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=0' '[{"until":"window.CARD"},{"until":"window.__FRAME>=480"},{"eval":"CARD.Q.iter=264;CARD.bench(0,50);[CARD.bench(0,300),CARD.bench(0,300),CARD.bench(0,300)].map(function(x){return +x.toFixed(2)}).join(\"/\")+\" par \"+CARD.home.par.toFixed(2)+\" lnr \"+CARD.home.cyc.lnr.toFixed(3)"},{"until":"window.__FRAME>=900"},{"eval":"…the same…"},{"until":"window.__FRAME>=1500"},{"eval":"…the same…"},{"until":"window.__FRAME>=2100"},{"eval":"…the same…"}]'
```
`CLOCK=1` pauses the frame clock at each `until`, so the page is frozen at that timeline point while you bench;
`CARD.Q.iter = 264` pins the cap to the same value at every point (with the clock paused `updateQuality` does not run
and the pin holds) — the ratio f1500 / f480 is then the parameter's cost alone. The warm-up `bench(0,50)` is
discarded; three `bench(0,300)`, report the median. Run the whole recipe twice (machine drift is 2× across a session)
and only compare runs made back to back. Also one run at 1920 × 1080 (`WIN=1920,1080` is headed — headless: `tools/cdp.js`'s
header says how to size the viewport; if it cannot, say so and skip).

## Acceptance (repo root; `PORT=8796`; shots in `tools/work/` prefixed `ni-`)

1. `node tools/check.js` → 0 fail, no new warn (dead-uniform check: a uniform you add must be fetched).
2. **The f1500 bench ≤ 2 × the f480 bench** (same run, `Q.iter` pinned 264), and f1500 after ≤ 0.5 × f1500 before — in the
   same table as the baseline; f900 and f2100 not worse than before by more than the noise band (10 %).
3. `GPU=1 PORT=8796 node tools/parity.js fake` → 0 diff (the state is untouched).
4. **`tools/scene-md5.sh`'s s0 and s4 lines at f360/f840, v2 and `&colour=oklch`** — byte-identical to
   `tools/accept/v0.5/scene-md5-v03.txt` / `…-oklch.txt` (s4 has no reference line: baseline it at HEAD before your edit, as the
   params worker did). If one moves, the change touched pixels the cap did not already decide: say which frame, show
   `ni-<frame>-before.jpg` / `-after.jpg` / a diff (`compare` or a python diff) and how many pixels by how much; the
   orchestrator decides whether that is acceptable. Expected: f360/f840 identical (both are far from a parabolic root —
   check `CARD.home.par` there and say what it was).
5. **f1500 montage**: before / after / diff at f1500 (`par` 0.76) and f1800 — the frames the change is *for*. Say in one
   sentence what moved and what did not (the exterior, the trap ring, the bands).
6. **Continuity monitor** (HARNESS "Continuity monitor"): 60 s on `test&fake=0`, `viol []`.
7. **Q trace is NOT required** (two Chromes are on the machine today; the orchestrator runs it on the merged code).
8. `node tools/bundle.js`; `FILE=$PWD/dist/eigenwobble.html PORT=8796 NOAUTO=1 GPU=1 node tools/cdp.js 'real'
   '[{"wait":1500},{"click":[695,440]},{"wait":4000},{"eval":"JSON.stringify({errs:CARD.ERRS})"}]'` → `errs []`, 0 `[EXC]`.

**You may read:** this brief, `docs/CONTRACTS.md` (§1, §1.4 "Q-scaled work", §1.6 `Q`, §1.9 `cuts`), `docs/HARNESS.md`
("Static checks", "Headless Chrome", "Bench protocol", "Continuity monitor", "Parity with v3", "Single-file build",
"Pitfalls"), `docs/AUDIT-v0.3.md` (check 1's row), `docs/DECISIONS.md` §26 (the NAV cost paragraph) and §25 (the Koenigs
coordinate's derivation — `nav-hue.md` too), `docs/workers/nav-hue.md`, `nav-params.md`, your folder, `assets/math/mandel.js`
(read only — `solveMult`, the cycle solver whose output is `N.cyc`), `tools/parity.js`'s header, `tools/cdp.js`'s header,
`tools/scene-md5.sh`, `tools/check.js`.

**Report** (`docs/workers/nav-iter.md`): brief-common (a)–(d) — the bench table (before / after, four timeline points, two
runs, ratios), the exit rule you chose and the ones you rejected with the number that rejected them, the md5 lines, the
montage file names and the sentence, the friction log (every sentence the docs lack, every guess), the line count of every
module you touched. Leave the worktree committed (`NAV-ITER:` messages); do not merge.
