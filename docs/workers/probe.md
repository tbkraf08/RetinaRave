# Worker: `_probe` scene (§1 contract test) — 2026-09-22

**Brief given:** only `docs/CONTRACTS.md` + `docs/HARNESS.md` + the target folder `assets/scenes/_probe/` + the two
acceptance commands (check.js green; `#test&scene=1` renders a solid colour driven by `MS.bass`, ERRS empty, shots at
3 s / 14 s). Forbidden: every other file. Model: opus.

**Outcome:** rendered first try (49 lines, one program). `check.js` 0 fail. ERRS `[]`, nonFinite `[]`. Screenshots: a
dark teal field at 3 s, a bright cyan field at 14 s (the drop). Tempted to open `engine/feats.js` (to confirm a feat
name) and `scenes/nav/index.js` (to see how ctx travels from init to draw); resisted both.

**Friction (13 items, all fixed in CONTRACTS.md / HARNESS.md the same day):**
1. Registration is two lines (import + list), doc said one. → §1.8 rewritten.
2. No stated channel from `init` to `draw`; guessed `this.pr = …`. → "methods on your exported object" paragraph.
3. `ctx` not passed to `draw` — follows from 2. → same paragraph.
4. `feats` vocabulary pointed at `engine/feats.js`, a forbidden file. → Appendix A generated from feats.js by
   `tools/feats-doc.js`.
5. `rt.time` optional vs load-bearing. → fallback stated (never NaN).
6. `dt` units. → seconds, stated.
7. `cuts` values undefined. → §1.9.
8. Off-values for post params; `kaleido` "damping" vs template value 1. → defined as multiplier, off-values listed.
9. `post.<name>.on` mentioned only in §3. → implemented in core/post.js, documented in §1.4 and §3.
10. `ctx.targets` "do not draw into them" vs `draw(target)`. → reworded.
11. Which ids are taken. → registry table in §1.8.
12. `CARD.REG` shape undocumented. → HARNESS.md + §1.8.
13. Composite alters a flat colour (vignette, tonemap, trails). → §1.10.
Also: HARNESS.md "`&scene=N` 0-based" conflated the hash param (scene id) with the number keys (offset by one). Fixed.
