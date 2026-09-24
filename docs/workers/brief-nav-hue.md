# NAV hue worker brief (v0.3 items 5 + 6, `nav-multiplier-hue` + `pip-hue`) — read docs/workers/brief-common.md first
# (the "may read" rules and the report format apply)

Target: `assets/scenes/nav/shaders.js` (`FS_JULIA`'s interior branches and its exterior branch; the PiP program's
exterior) and `assets/scenes/nav/index.js` (uniform uploads, `help`). **`nav.js` — the state, the chart walk, `N.cyc`,
`N.par` — is not to be touched: `parity.js fake` compares NAV's state with cardioid3 and must stay 0 diff.** PORT=8783.
Own worktree; commit messages start `NAV-HUE:`. **One Chrome at a time from you.**

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/workers/brief-nav-smoulder.md` and its report
`docs/workers/nav-smoulder.md` (the last worker on these branches: what they found), `docs/CONTRACTS.md` (§0, §1.1,
§1.2, §1.10, §1.13, **§1.14 — the OKLCH chunk**), `docs/HARNESS.md` ("Static checks", "Headless Chrome", "Continuity
monitor", "Parity", "OKLab"), `docs/DECISIONS.md` §15 (JULIA → NAV) and §19 (the chunk), `assets/scenes/nav/index.js`,
`assets/scenes/nav/shaders.js`, `grep -n "cyc\|par\|lam" assets/scenes/nav/nav.js` (to see what `N.cyc` holds — not
the file beyond that), `assets/scenes/feigen/field.js` (**only** for how it accumulates the external angle `ea` per
iteration — the itinerary bits; copy the idea, not the file), `assets/core/oklch.js` (read, never edit),
`tools/check.js`, `tools/monitor.js`. Not `core/` beyond `oklch.js`, not `engine/`, not other scenes beyond that one
function.

**Why.** NAV's picture is the Julia set of the parameter the music walks, with the interior coloured by the Koenigs
coordinate (bands + spokes) and lit by the critical-slowing smoulder (`uPar`). The interior already *has* the
multiplier: `uLam = (ln|λ|, arg λ, q, has)` is uploaded every frame (`N.cyc`). Its argument is the internal angle of
the component — the rotation number's direction — and its modulus says how close the component's centre is to its
boundary (a root or a cusp at |λ| = 1). Colouring the interior by them makes a component's internal rays and its
root/cusps read off the image: **hue ← arg λ**, **lightness ← |λ|**. On the exterior, the external angle of a point of
J_c (connected) equals the external angle of the parameter's ray in M, so **hue ← external angle** on the main
Julia's exterior *and* on the PiP's exterior (item 6) makes a ray in M and its image in J_c read the same. OKLCH
(`ctx.oklch`, CONTRACTS §1.14) is what makes hue and lightness independent: `palOKs(h, L, C)` (encoded, what the
chain reads today).

**The mapping.**
- Interior, `conv` branch (a known cycle): `h = uLam.y / TAU + uPal.x` (the mood hue rotates the wheel — keep the
  LOOK dependency the smoulder brief kept), `L = 0.30 + 0.35·exp(uLam.x)` (|λ| → lightness: a centre is dark, a root
  bright) modulated by the Koenigs bands as today's brightness term (`·(0.6 + 0.4·bands)`), the spokes as a small
  chroma modulation, `C = 0.11·(0.6 + 0.4·bands)`; **the smoulder term stays** (`uPar²` lift on L, as the last worker
  shipped it) and **at `uLam.w < .5` (no cycle known) the branch is not taken** — nothing changes there. The plain
  interior branch (`else`): hue from `uPal.x + .5`, low chroma, its smoulder as today.
- Exterior (`esc`): accumulate the external angle in the iteration loop the way `feigen/field.js` does (the binary
  itinerary bits of the orbit, `ea` in 0..1, valid for a connected J_c which is where NAV lives; where the set is
  disconnected the angle is still a continuous function of the escape and just colours), `h = ea + uPal.x`, keep
  today's exterior lightness (the trap `lt` term and the escape smoothing) as `L`, `C = 0.11·(escape smoothing)`.
  Keep the exterior's behaviour under drops/kicks exactly as it is (the hue is the only new channel).
- PiP: the same external-angle hue on its exterior, the same `uPal.x` offset, so the ray colours coincide with the
  main view's. Interior of the PiP's M: unchanged.
- Rule: hue is *additive to the mood* (`uPal.x`), never replaces it — `LOOK` must still change the picture.

**Acceptance (repo root, all must pass):**
1. `node tools/check.js` → 0 fail, 0 warn on your files (`shaders.js` is 59 lines; stay under 350).
2. **State parity:** `PORT=8783 GPU=1 node tools/parity.js fake` → `0 diff` (the line with `parity`/`max |diff|`).
3. **Continuity monitor**, 60 s, `viol` must be `[]`:
   `MON=$(grep -v '^//' tools/monitor.js | tr '\n' ' ' | sed 's/"/\\"/g'); PORT=8783 GPU=1 node tools/cdp.js 'test&fake=0' "[{\"wait\":1500},{\"eval\":\"$MON;'ok'\"},{\"wait\":60000},{\"eval\":\"JSON.stringify({n:MON.n,fast:MON.fast,viol:MON.viol,errs:CARD.ERRS})\"}]"`
4. **Montage (the gate — items 5 and 6 are taste):** baseline first (before your edit), then after, at CLOCK f360,
   f660 (the fake build, `par` > 0 — print `CARD.home.par` there) and f840, `test&scene=0`; plus one real-path shot
   at 40 s (`NOAUTO=1 … 'real'`, click the demo link) with the PiP visible. `python3 tools/montage.py
   tools/work/nav-hue-ab.jpg 2 <before/after pairs>`. Read it. Say what the hues show: do the internal rays of the
   component read as hue sweeps, does the root/cusp read as the bright rim, do the external rays' colours match
   between the PiP and the main view (pick one ray, name its hue in both)?
5. **Gamut:** a `#test`-only hook `hooks.clipdbg` (as the FEIGEN brief: write `okClip` into `o.r`, count `< 255` in a
   readback) → 0 clipped pixels at f360 and f840.
6. Real path 45 s: `PORT=8783 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":45000},{"eval":"JSON.stringify({bad:CARD.nonFinite(),errs:CARD.ERRS})"}]'` → `[]`, `[]`, 0 `[EXC]`.
7. `CARD.bench(0,300)` × 3 medians before/after in one session shape — the itinerary accumulation is one compare and
   one add per iteration: within 10 %.
8. `help.why` gains one sentence (hue is the internal angle inside, the external angle outside — the two coordinates
   of a ray); `help.feats` unchanged (no new `MS` read).

**Report** (`docs/workers/nav-hue.md`): brief-common (a)–(e), the parity and monitor lines verbatim, the bench
medians, the clipped counts, what the montage showed (with the named ray), the exact `h/L/C` formulas shipped. Leave
the worktree committed; do not merge.
