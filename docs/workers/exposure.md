# Worker: exposure effect (§5) — 2026-09-22

**Brief (inline):** CONTRACTS §3/§1.1, HARNESS, synapse2.html 1225–1236, bloom.js as the worked example; PORT 8774;
own worktree. Model: opus. ~6 min.

**Outcome:** accepted. `assets/effects/exposure.js` (90 lines): 16×16 luminance → 1×1 ping-pong (asymmetric
τ 0.6 s up / 1.5 s down) → gain `clamp(0.22/metered, .14, 2.2)` applied to the chain; `enabled: false`, order 30.
Chain `feedback:10 bloom:20 exposure:30 composite:100`. On/off pair on NAV: mean luminance 16.7 → 18.4 (0.3 s) → 26.5
(3 s) vs 14.8 control; off = byte-identical to a build without the effect. Commit c80e9fa in the worktree.

**Friction (9) and fixes:** the `uvS` rule stated as a rule (§3); returned-target ownership (§3); `frameN` continuity
across skipped frames (§3); `mkTarget` cleared to black + when `onResize` first fires (§1.1); `ctx.tex` counts as a
fetch (§1.2); `io` field types (§3); the exposure target constant was outside the readable lines (chose 0.22 — noted);
`enabled` flip at runtime works without a `post.exposure` entry (documented behaviour: `on` overrides, else `enabled`).
Harness finding: `CLOCK=1` shots were not frame-exact (6–9 frames ticked during `captureScreenshot`) → cdp.js now
pauses the fake clock around every screenshot. Also: the brief's nested-quote `eval` broke in bash (use `\"`).
Temptations: core/post.js (uvS threading), tools/check.js — neither opened.
