# Worker: DUST (§3) — 2026-09-22

**Brief:** `brief-common.md` + `brief-dust.md`; synapse2.html 848–887, 592–686, 1431/1456/1468/1488/1506; PORT 8771;
own worktree. Model: opus. ~12 min.

**Outcome:** accepted. 159 + 104 lines. `check.js` 0 fail. `#test&scene=1`: ERRS [], t6 a dense green granular
plume, t14 burst 3× wider, blue/violet (drop). House run: torus/ribbon lozenge (groove) · dim magenta smear
(breakdown) · big violet ring-cloud (build). `bench(1)` 0.04–0.08 ms (below the headless timer floor). feats (13)
exact; post `{fb:{decay:.95}, bloom:{thr:.3}, kaleido:.5}`, cuts 'onset'. Commit 4b3380e in the worktree.
Post-merge by the orchestrator: `exposure: { on: true }` (§5) and the look-memory hook (formation pair).

**Friction (11) and fixes:** `score()` reads count in `feats` (now stated; the brief's read list omitted arc/punchy/
regularity); drop detection without `dropEvt` in the read list → rising edge of `dropEnv` (fine; briefs now say
"event fields you gate on belong in feats"); deterministic randomness → local hash of a reform counter (§0 now names
`hash(seed.a, counter)` as the pattern); the core's expected GL state on return (§1.1 now states it: BLEND off, DEPTH
off, SCISSOR off; the target is NOT pre-cleared — clear it yourself); `ctx.use` works on raw programs (only uRes
matters; stated); `ctx.engineTex` entries are `{t}` (stated earlier); camera distance in the brief was wrong for its fov
(3.2 → 4.4 to match synapse's framing; brief fixed); the source's second (yz) rotation fights a real camera (dropped);
`uSceneAge` unused; `rt.time` = flow (fine). Temptations: core (GL state, target clearing), harness.js (bench) — read
`String(CARD.bench)` at runtime instead; none opened. HARNESS: bench quantises to ~1/24 ms in headless — use n≥300 and
read the median (noted).
