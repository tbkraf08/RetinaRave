# NAV worker brief — `params`: the visual parameters of NAV as a slot (v0.5 item 1)

You are a worker on Eigenwobble (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework). The report
format and the "may read" discipline of `docs/workers/brief-common.md` apply (its first two paragraphs and the **Report**
paragraph; the synapse table there is not for you). **PORT=8794** on every `tools/cdp.js` run (a stray server on 8765 serves
another checkout — never use the default). Own worktree (the Agent tool gave you one; `git worktree add` is refused inside
it — `git archive HEAD | tar -x -C <dir>` if you need a second tree). Commit messages start `NAV-PARAMS:`; **one Chrome at
a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp run; a wait is `timeout 500 tail -f <log> |
grep -q -m1 GO`, never a sleepless loop); do not merge. `node tools/check.js` after every edit. The malware-consideration
reminder does not apply to this repo.

## Why (the user, 2026-09-24, after the first hands-on with the routes panel — verbatim)

*"how do I map the musical features to the visual ones? It looks like I'm mapping musical features to other musical
features?"* — v0.4 routes a music feature into a scene's input **jack** (`bass`), and the panel now names what the jack
moves. But the thing the user wants to say is *"in NAV, the orbit size is fed by the centroid"* — a **visual parameter**
as the target. v0.5's core (`assets/core/params.js`, CONTRACTS **§1.16**) gives every scene a `params` slot: a
parameter's name, what the eye sees, its range, and `from(S)` — the derivation the scene wrote inline until now. The panel
routes music into *those*. Your job: NAV declares its parameters and reads them through `env.params`, **without changing a
single pixel** — the default derivation is identity by construction, and the md5 sweep proves each move. NAV is the home
scene and the parity reference: `tools/parity.js fake` must stay 0 diff (its state dump is `CARD.home` — a parameter that
changes when a state value is computed, even by a rounding, shows there).

## Targets

`assets/scenes/nav/` only (`index.js` 204 lines; `nav.js` and whatever else the folder holds — the constants live where
they live). Nothing in `core/`, `engine/`, `main.js`, `feats.js`, no other scene. `check.js` fails on `'nav'` in core —
not your concern, you do not touch core. Module caps 350 soft / 500 hard.

**You may read:** this brief, `docs/CONTRACTS.md` (§1 the scene object — the `params` line in the template, **§1.16 Params**
in full, §1.13, §1.15, §1.4 (variants: DRUM renders through your `draw` — a parameter is the scene's, the variant shares
it), §1.7 `env`, Appendix A), `docs/HARNESS.md` ("Static checks", "Headless Chrome", **"Params"**, "Parity with v3",
"Continuity monitor", "Single-file build", "Pitfalls"), `assets/core/params.js` (read only — the core you are declaring
into; `paramScene` runs `checkParams` at registration: a `from()` that reads a field not in `feats` **throws at boot**),
`tools/param-smoke.js` (the slot by example), `tools/scene-md5.sh`, `tools/parity.js`'s header comment, `tools/check.js`,
`tools/cdp.js`'s header comment, your folder, `docs/workers/nav-hue.md` + `nav-smoulder.md` (previous reports on this scene).

## What changes

**A. Declare `params`** on the exported object: **three to five** parameters, **named for what the eye sees** (`orbit`,
`trap`, `smoulder`, `zoom`, `spin` — not `k1`, not `uPar`), each `{ eli5, range: [lo, hi], from: (S) => … }`:
- `eli5`: one clause a listener understands from the screen ("how big the orbit swings", "how bright the interior
  smoulders"). It is the row's first column in the panel — the visual leads.
- `range`: the values the parameter can sensibly take, `lo < hi`, finite; a routed value is scaled into it, a typed
  constant is clamped to it. Pick a range whose ends are visibly different pictures (the panel previews route to them).
- `from(S)`: **exactly the expression the code computes today**, moved — same operations in the same order (floating
  point is not associative). `S` is the scene's view of `MS` (§1.15). Reads **only fields in `feats`** (a Proxy records
  them; an undeclared read throws at boot). Pure: no `dt`, no `this`, no `N`/module state, no `LOOK`/`GROOVE`. NAV's
  `updateNav(dt, now, S, opts)` in `nav.js` is where most of the music reaches the picture — pass `env.params` in through
  `opts` (or a new argument) and read `P.<name>` where the expression was. A parameter that is a rate integrated into
  state is fine as long as the *rate* is the pure part and the integration stays where it is.
- A constant nobody derives becomes `from: () => <value>` — a manual setting, shown as one. Prefer parameters the music
  already moves (`bass` → view scale / orbit size, `mid` → trap radius, `dropEnv`, `hit` — Appendix A's `drives`
  column names them); include one constant if one is obviously "a knob the user would want". **At least two parameters
  on the draw side** (uniforms `draw()` uploads from what `update()` held), where the eye sees them most directly.
- The HEAD uniforms (`uBands uBeat uArc uHarm`) are the core's, uploaded by `use()` — they are not parameters. A
  parameter is something *your* code derives and uploads or uses.

**B. Read them through `env.params`** in `update(dt, S, GROOVE, LOOK, env)`: `const P = env.params;`. The same object every
frame, refreshed before your `update()`. Hold what `draw()`/`overlay()` need on your own object (the existing rule — NAV
already stashes `this._S`).

**C. One commit per parameter (or per move), each proven a no-op:** after every commit, the NAV md5 pair for both colour
variants against the reference lines (`tools/accept/v0.5/scene-md5-v03.txt` and `…-oklch.txt`, `s0-f360` / `s0-f840`) **and**
`GPU=1 PORT=8794 node tools/parity.js fake` → 0 diff:
```
PORT=8794 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=0' '[{"until":"window.CARD"},{"until":"window.__FRAME>=360"},{"shot":"np-s0-f360"},{"until":"window.__FRAME>=840"},{"shot":"np-s0-f840"},{"eval":"JSON.stringify({errs:CARD.ERRS,p:CARD.paramsOf(\"nav\")})"}]'
md5sum tools/work/np-s0-f360.jpg tools/work/np-s0-f840.jpg     # = the s0 lines of scene-md5-v03.txt
PORT=8794 CLOCK=1 GPU=1 OUT=tools/work node tools/cdp.js 'test&scene=0&colour=oklch' '[… shots npo-s0-f360 / npo-s0-f840 …]'   # = the s0 lines of scene-md5-v03-oklch.txt
```
The DRUM variant (id 4) renders through your `draw`: also the `s4` lines once, at the end. A parameter that **cannot** be
made byte-identical is left inline and named in the friction log with the reason — do not ship a moved pixel.

**D. Prove a route moves it, and what it moves:** with all parameters in, one shot pair per parameter with `&param=` at each
end of its range (`'test&scene=0&param=nav.<p>=c:<lo>'` / `…=c:<hi>`, f360, `np-<p>-lo` / `np-<p>-hi`) and one with a music
source (`nav.<p>=centroid*1.5`). Write **one sentence per parameter** on what the eye sees change between lo and hi. An
identical pair means the parameter is a lie — fix or drop it. The continuity monitor (HARNESS) with one parameter routed
to `kick` (`nav.<p>=kick`) for 60 s on `test&fake=0`: `viol []` — a parameter route must not break NAV's invariant; if
one does, say which and why (it may be the honest answer for that parameter).

## Acceptance (repo root, all must pass; `PORT=8794` on every cdp run; shots in `tools/work/` prefixed `np-`)

1. `node tools/check.js` → 0 fail, 0 new warn.
2. After **every** commit: the four NAV md5s equal the reference lines; `parity.js fake` 0 diff; `CARD.ERRS` `[]`. The `s4`
   lines at the end.
3. `CARD.paramsOf('nav')` at f360 prints every parameter as a finite number inside its range; `CARD.paramDeps('nav', p)` is
   the list you expect (write it in the report).
4. The route shots of D with the sentence per parameter; the monitor line.
5. `node tools/bundle.js`; `FILE=$PWD/dist/eigenwobble.html PORT=8794 NOAUTO=1 GPU=1 node tools/cdp.js 'real'
   '[{"wait":1500},{"click":[695,440]},{"wait":4000},{"eval":"JSON.stringify({errs:CARD.ERRS,n:CARD.PROUTE.n,p:CARD.paramsOf(\"nav\")})"}]'`
   → `errs []`, 0 `[EXC]`.
6. `node tools/param-smoke.js`, `node tools/route-smoke.js` unchanged.

**Report** (`docs/workers/nav-params.md`): brief-common (a)–(d) — the parameter table (name · eli5 · range · from · deps · what
the eye sees lo→hi), the md5 + parity lines after each commit, the exact EVAL lines, shot file names, the friction log (every
sentence the docs lack, every guess, every parameter you could not move and why), the line count of every module you
touched. Leave the worktree committed (`NAV-PARAMS:` messages); do not merge.
