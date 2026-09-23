# Worker: MANDALA (§3) — 2026-09-22

**Brief:** `docs/workers/brief-common.md` + `brief-mandala.md`; allowed reads: CONTRACTS/HARNESS/ENGINE + synapse2.html
769–798, 592–686, 1535; PORT 8772; own worktree. Model: opus. Duration ~7 min.

**Outcome:** accepted. 107 + 82 lines. `check.js` 0 fail. `#test&scene=2`: ERRS [], t6 a 12-fold green mandala, t14
cyan-white centre flare + brighter + expanded petals (drop). House run: three clearly different frames (bright green
groove · dark ochre/magenta breakdown · violet 8-fold build). `bench(2)` ≈ 0.19 ms. feats (17) exact. post
`{fb:{decay:.6}, bloom:{thr:.35}, kaleido:.6}`. Registered as id 2, commit b043bdc in the worktree.

**Friction (10) and doc fixes:**
1. Does `feats` include fields read in `score()`? → yes; CONTRACTS §1 now says "read anywhere in the object".
2. Do HEAD-delivered fields (`uBands`) count? → list them (they are MS fields you depend on); stated in §1.2.
3. Kick epoch: briefs said 64, synapse source says `floor(uKickCount/32.)`. The 64 came from the session spec; kept 64
   (the docs are the contract; the source is only the shape) and fixed feats.js's `drives` text to match.
4. `cuts: 'event'` vs the kick-epoch step → §1.9 now says `'event'` includes declared beat-counted epochs.
5. `uQuality` range → mapping table now says `ctx.Q.q` is 0..1 and gives the iteration formula.
6. `rt` existence before first update → §1.3: the core assigns `{}` at registration, before `init`.
7. `ctx.tex` with an engine texture → §1.1: any `{t}` object.
8. `MS.seed.a` range → Appendix/feats: `a`, `hue` ∈ [0,1), `th` ∈ [−.5,.5).
9. `ctx.use(pr, target, …)` takes the object → stated.
10. Texture units → §1.1: scenes may use units 0–7; effects use 0–3 on their own programs.
Doc errors: reversed `smoothstep(1.25,.2,r0)` in the lifted source (brief now says flip it); HEAD already declares
`out vec4 o; in vec2 vUv;` (brief now says drop those lines); `tools/check.js` is a legal read (added to the common brief).
Temptations: nav/index.js (uniform idiom) — resolved by reading check.js; effects/composite.js (kaleido tiles) — §1.10.
