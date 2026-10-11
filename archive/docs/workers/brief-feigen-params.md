# FEIGEN worker brief — `params`: the visual parameters of FEIGEN as a slot (v0.5 item 1)

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework). The report
format and the "may read" discipline of `docs/workers/brief-common.md` apply (its first two paragraphs and the **Report**
paragraph; the synapse table there is not for you). **PORT=8793** on every `tools/cdp.js` run (a stray server on 8765 serves
another checkout — never use the default). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside
it — `git archive HEAD | tar -x -C <dir>` if you need a second tree). Commit messages start `FEIGEN-PARAMS:`; **one Chrome
at a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run; a wait is `timeout 500 tail -f <log> |
grep -q -m1 GO`, never a sleepless loop); do not merge. `node tools/check.js` after every edit. The malware-consideration
reminder does not apply to this repo.

## Why (the user, 2026-09-24, after the first hands-on with the routes panel — verbatim)

*"how do I map the musical features to the visual ones? It looks like I'm mapping musical features to other musical
features?"* — v0.4 routes a music feature into a scene's input **jack** (`bass`), and the panel now names what the jack
moves. But the thing the user wants to say is *"in FEIGEN, the filament sharpness is fed by the centroid"* — a **visual
parameter** as the target. v0.5's core (`assets/core/params.js`, CONTRACTS **§1.16**) gives every scene a `params` slot:
a parameter's name, what the eye sees, its range, and `from(S)` — the derivation the scene wrote inline until now. The
panel routes music into *those*. Your job: FEIGEN declares its parameters, and reads them through `env.params`, **without
changing a single pixel** — the default derivation is identity by construction, and the md5 sweep proves each move.

## Targets

`assets/scenes/feigen/` only (`index.js`, and the module that holds the constant if it lives in `ladder.js` / `field.js` /
`colour.js` / `colour-v2.js` / `shaders-v2.js`). Nothing in `core/`, `engine/`, `main.js`, `feats.js`, no other scene.
`index.js` is 336 lines (cap 350 soft / 500 hard): a `params` block of five entries with `eli5` lines will push it over
350 — that is a **warning, allowed**; do not split the module for it, and do not exceed 500.

**You may read:** this brief, `docs/CONTRACTS.md` (§1 the scene object — the `params` line in the template, **§1.16 Params**
in full, §1.13, §1.15, §1.4, §1.7 `env`, Appendix A), `docs/HARNESS.md` ("Static checks", "Headless Chrome", **"Params"**,
"Single-file build", "Pitfalls"), `assets/core/params.js` (read only — the core you are declaring into; note `paramScene`
runs `checkParams` at registration: a `from()` that reads a field not in `feats` **throws at boot**), `tools/param-smoke.js`
(how the slot behaves, by example), `tools/scene-md5.sh`, `tools/check.js`, `tools/cdp.js`'s header comment, your folder,
`docs/workers/feigen-field.md` + `feigen-oklch.md` (the previous reports on this scene — what each constant does).

## What changes

**A. Declare `params`** on the exported object: **three to five** parameters, **named for what the eye sees** (`sharp`,
`width`, `wobble`, `glow`, `drift` — not `k1`, not `uSharp`), each `{ eli5, range: [lo, hi], from: (S) => … }`:
- `eli5`: one clause a listener understands from the screen ("how sharp the filaments are", "how much of the set is in
  view", "how fast the frame drifts sideways"). It is the row's first column in the panel — the visual leads.
- `range`: the values the parameter can sensibly take, `lo < hi`, finite. A routed value is scaled into it; a constant
  the user types is clamped to it. Pick a range whose ends are visibly different pictures (the panel's `lo` / `hi`
  previews route to them).
- `from(S)`: **exactly the expression update() computes today**, moved — same operations in the same order (floating
  point is not associative: `a * (1 + b) - c` and `a + a * b - c` are different pixels). `S` is the scene's view of `MS`
  (§1.15 — a v0.4 field route still feeds it). Reads **only fields in `feats`** (a Proxy records them; an undeclared read
  throws). Pure: no `dt`, no `this`, no module state, no `LOOK`/`GROOVE` (a parameter that needs `LOOK.mood` is not a
  parameter of this slot — say so in the friction log and leave it inline). A phase you integrate (`S.feigL`) is state,
  not a parameter — but the **rate** the dive advances at, or the width the depth maps to, is.
- A visual constant nobody derives (`0.03` in `S.cy = wd * 0.03 * sin(…)`) becomes `from: () => 0.03` — a constant is a
  manual setting, shown as one. Prefer parameters the music already moves; include one constant if one is obviously
  "a knob the user would want".
- Candidates from `update()` (yours to judge — what the eye sees, not what the code names): the view width `wd`
  (`3.2 · δ^−L · (1 + 0.25 tension − 0.18 dropEnv − 0.03 kick)` — the music-modulated factor is a parameter; `δ^−L` is
  the depth, state), the dive speed factor `(0.25 + 1.5 lvl)(1 − 0.8 tension)·alive`, the sideways wobble of `S.cx`, the
  rotation amplitude `S.rot`; and on the draw side, whatever `colour-v2.js` / `colour.js` uploads from `S.lvl S.kick
  S.drop S.hat S.flow S.midS S.tension` (sharpness, glow, band ripple…) — **at least two parameters must be on the draw
  side**, where the eye sees them most directly; read `colour-v2.js` to find what a uniform does before naming it.

**B. Read them through `env.params`** in `update(dt, MS, GROOVE, LOOK, env)`: `const P = env.params;` then `P.width`
where the inline expression was. Hold on `S`/`this` what `draw()` needs (the existing rule). `env.params` is the same
object every frame, refreshed before your `update()`; it is `null` only for a scene with no `params` (never you, once A
is in). Note `update()` also runs while FEIGEN is off screen only if `always` — it is not; fine.

**C. One commit per parameter (or per move), each proven a no-op:** after every commit run the FEIGEN md5 pair for both
colour variants and compare against the reference lines (`tools/accept/v0.5/scene-md5-v03.txt` and `…-oklch.txt`, the
`s6-f360` / `s6-f840` lines):
```
PORT=8793 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"fp-s6-f360"},{"until":"window.__FRAME>=840"},{"shot":"fp-s6-f840"},{"eval":"JSON.stringify({errs:CARD.ERRS,p:CARD.paramsOf(\"feigen\")})"}]'
md5sum tools/work/fp-s6-f360.jpg tools/work/fp-s6-f840.jpg     # = the s6 lines of scene-md5-v03.txt
PORT=8793 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=6&colour=oklch' '[… the same with shots fpo-s6-f360 / fpo-s6-f840 …]'   # = the s6 lines of scene-md5-v03-oklch.txt
```
A parameter that **cannot** be made byte-identical (the expression could not be moved without re-associating it, or it
mixes state and music) is left inline and named in the friction log with the reason — do not ship a moved pixel. Also
`git diff --stat` per commit stays inside your folder.

**D. Prove a route moves it, and what it moves:** with all parameters in, one shot pair per parameter with `&param=` at
each end of its range (`'test&scene=6&param=feigen.<p>=c:<lo>'` and `…=c:<hi>`, f360, `fp-<p>-lo` / `fp-<p>-hi`), and one
with a music source (`feigen.<p>=centroid*1.5`). Look at each pair and write **one sentence per parameter** on what the
eye sees change between lo and hi (the orchestrator judges the shots with their own eyes; your sentence says what to
look for). If a pair is identical, the parameter is a lie — fix or drop it.

## Acceptance (repo root, all must pass; `PORT=8793` on every cdp run; shots in `tools/work/` prefixed `fp-`)

1. `node tools/check.js` → 0 fail (the >350-line warning on `feigen/index.js` is allowed; nothing else new).
2. After **every** commit: the four FEIGEN md5s (v2 f360/f840, oklch f360/f840) equal the reference lines; `CARD.ERRS` `[]`.
3. `CARD.paramsOf('feigen')` at f360 prints every declared parameter as a finite number inside its range; `CARD.paramDeps
   ('feigen', p)` for each is the list of fields you expect `from()` to read (write the list in the report).
4. The route shots of D (one lo/hi pair per parameter, one music-routed) with the sentence per parameter.
5. `node tools/bundle.js`; then `FILE=$PWD/dist/eigenwobble.html PORT=8793 NOAUTO=1 GPU=1 node tools/cdp.js 'real'
   '[{"wait":1500},{"click":[695,440]},{"wait":4000},{"eval":"JSON.stringify({errs:CARD.ERRS,n:CARD.PROUTE.n,p:CARD.paramsOf(\"feigen\")})"}]'`
   → `errs []`, 0 `[EXC]` lines.
6. `node tools/param-smoke.js` and `node tools/route-smoke.js` unchanged (you did not touch them; run them anyway).

**Report** (`docs/workers/feigen-params.md`): brief-common (a)–(d) — the parameter table (name · eli5 · range · from · deps
· what the eye sees lo→hi), the md5 lines after each commit, the exact EVAL lines, the shot file names, the friction log
(every sentence the docs lack, every guess, every parameter you could not move and why), the line count of every module
you touched. Leave the worktree committed (`FEIGEN-PARAMS:` messages); do not merge.
