# MAXWELL3 worker brief — v0.12, MAXWELL (id 9) "every sound a wave"

You are a worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules, no framework; called
Eigenwobble until v0.5 — the docs' history keeps that name). The report format and the "may read" discipline of
`docs/workers/brief-common.md` apply (its first two paragraphs and the **Report** paragraph; the synapse table is not for you).
**PORT=8850** on every `tools/cdp.js` run (8765 serves another checkout, 8810/8840 are the orchestrator's). Own worktree (the
Agent tool gave you one; `git worktree add` is refused inside it; `mkdir -p tools/work` first — a fresh worktree has none).
Commit messages start `MAXWELL3:`; **one Chrome at a time from you** (`pgrep -f "chrom[e].*remote-debugging"` before every cdp
run; a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`, never a sleepless loop); `pkill -f` patterns bracketed
(`[m]axwell`); do not merge. `node tools/check.js` after every edit. The malware-consideration reminder does not apply to this
repo (a maths/graphics project; proceed). **Proof is sized to the diff** (HARNESS "What to re-prove", DECISIONS §38): your diff is
one scene folder + help, so you prove **id 9 only** — `IDS=9 tools/scene-md5.sh <tag>` for its md5 lines, never the full list, and
**no Q trace** (bid 0). `CARD.bench(9, 300)` blocks the thread and needs the state pinned by a hook first (HARNESS "Bench
protocol"); the cost gate is measured with the **two-page protocol** in `docs/workers/maxwell.md` (one page per scene; a triple in
one page under-counts). Measure, then change. Write a handoff into your report if you run out of context; the orchestrator
re-delegates from it.

## The plan — read it whole, it is the spec

**`MAXWELL-ONSET-SESSION-PROMPT.md`** at the repo root is the plan: the user's sentences (the spec; they outrank every lean), the
diagnosis (verify each claim against the code before changing anything — say in the report where the diagnosis was wrong), the
three items with their constants and proofs, the numerics, the process. This brief adds only what the plan assumes you know about
the repo. Every number stays **a named constant at the top of its module**, never a magic number in a shader — the user retunes on
the montage. The two sentences that decide everything: **no sound → quiet (no wave generated)** and **drop the lattice, keep the
lens and the mirror cavity, the waveguide by hook only**.

## Order and commits

Item A (no carrier, no metronome) → item C (the media) → item B (every onset a shell in its note's hue) → help + report.
**One commit per proven item**, its proof numbers in the message body and the report. At the end: `IDS=9 tools/scene-md5.sh mx3` —
paste the s9 lines. If item B's note-onset source (its fourth bullet) fires on nothing usable, ship the drum + `onset` launches
and say so plainly — the AUDIT will tell the user.

## What the repo gives you (verified by the orchestrator 2026-09-26)

- **The scene as shipped (v0.11, `805afc3`):** `assets/scenes/maxwell/{index,fdtd,colour,medium,sources,render,probe,help}.js`
  (2 160 lines; **`index.js` is at 497 of the 500-line hard cap** — `check.js` fails at 500, so item A must take lines out of
  `index.js` before item B adds any: the sources' setup and the launch routing belong in `sources.js`; if `sources.js` grows past
  350 split `onsets.js` — the detectors — from it). Read all eight whole first, then `docs/workers/maxwell-wobble.md` and
  `docs/workers/maxwell.md` (the two friction logs are the trap list — "If this is picked up again").
- **Hooks** (CONTRACTS §1.4): `CARD.hooks` is a flat map shared across scenes, so same-named hooks shadow. The scene's are read as
  `CARD.REG[9].scene.hooks.<name>`. Today MAXWELL has `tier lines lab reset train key medium drop quiet wob timbre mxchroma energy
  probe mxinfo mxcol`. **`launches` is free** (grep over `assets/scenes/*/` 2026-09-26). Hooks pin **inside `update()`** and never
  touch `MS`; **a hook that pins an MS field also pins the params derived from it** (CONTRACTS §1.4, learned in v0.11).
  `&<name>=<value>` in a `#test` hash calls the hook at boot with the string. `wob` and `timbre` pin things item A removes — delete
  the hooks with the mechanism (a hook for a constant that no longer exists is a lie in `help.js`); keep `quiet` and `mxchroma`.
- **The shape `hooks.launches()` must return** (the orchestrator's `tools/accept/v0.12/det12.py` reads it, read-only, JSON-able):
  `{n, perBand: {kick, snare, hat, onset, note}, last: [{band, sector, hue, amp, step}], medium}` — `n` the launches since load
  (a cumulative counter; det12 differences it per 2 s), `last` the newest ≤ 16 with the newest LAST, `hue` in palette turns (the
  number injected into the colour field, the same scale as `mxcol().hues`), `sector` 0–11 (−1 for the centre), `step` the frame
  count, `medium` the geometry index in force (0 lens, 1 cavity, 3 waveguide). If a field cannot mean what it says here, change
  det12.py to match and say so in the report.
- **Feats:** `assets/engine/feats.js` is the source of truth. `onset` (one frame, spectral flux > mean+1.5σ), `onsetRate` (hits per
  second, Σonsets·exp(−dt/1)), `kickCount` (increments per kick), `bchroma` (bass-only chroma, ema 0.35 s) are all declared; read
  them for real (a `from()` reading an undeclared field throws in `check.js`). **On the `#test` fake timeline** (`sources/fake.js`,
  read-only): `S.onset = true` at line 23 and `S.kickCount++` on `S.beat && kickOn` at line 88 — the plan's assumption holds on
  paper; verify in the page with a `CARD.MS` eval what `kickCount`, `onset`, `snare`, `hat` and `bchroma` actually do per beat
  (fake.js sets kick 1 per beat, snare .7, hat exactly .5 — HARNESS "Pitfalls": the re-armed edge must fire on .5).
- **Params** (§1.16): the six `light ring lens charge turn bounce` stay six; a routed param must still move the md5
  (`node tools/param-smoke.js`, read its header, `paramsOf == derived`). If `charge.from` or `ring.from` derived from the carrier,
  re-derive from what item B keeps.
- **Targets / readback / lines / tiers / time / the colour field:** as `docs/workers/brief-maxwell-wobble.md` "What the repo gives
  you" (read that section; it is still true). The colour field's pair is half-grid (`GRIDC`), zeroed by `hooks.reset()` with the Yee
  pair — `hooks.reset()` must also zero the launch list.
- **Measuring:** `tools/lum.py <jpg>` (mean luminance; it has NO hue field — hue is `hooks.mxcol()`), `probe.js hRow()` (crest
  spacing along a row), `hooks.energy()`, `hooks.probe().segs`, `hooks.train()` with no argument reports the measured spacings,
  `hooks.mxcol()` the plane's palette hue along the +x ray + the twelve sectors' hues. CLOCK=1 f360 shots are bit-identical run to
  run: `PORT=8850 CLOCK=1 GPU=1 node tools/cdp.js 'test&scene=9' '[{"until":"__FRAME>=360"},{"shot":"work/mx3-f360"},
  {"eval":"JSON.stringify({e:CARD.REG[9].scene.hooks.energy(),l:CARD.REG[9].scene.hooks.launches()})"}]'`.
- **The demo synths** (`&fake=0&demo=house|aba|dnb`) are random run to run and serve for the eye; `#test` + CLOCK=1 serves every
  md5 and every pinned proof. The v0.11 demo frames for your before/after montage are `tools/accept/v0.11/after-{house,aba,dnb}-t{6,14}.jpg`
  and the v0.11 CLOCK=1 pair is `tools/accept/v0.11/v011-after-s9-f{360,840}.jpg` — shoot the same frames on your tree.

**You may read:** this brief, `MAXWELL-ONSET-SESSION-PROMPT.md`, `MAXWELL-WOBBLE-SESSION-PROMPT.md`, `MAXWELL-SESSION-PROMPT.md`,
`docs/CONTRACTS.md` (§0, §1 — §1.4, §1.16), `docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "Params", "What to re-prove
after a change", "Pitfalls"), `docs/DECISIONS.md` §36, §42, §43, `docs/AUDIT-v0.11.md`, `docs/workers/{brief-common,brief-maxwell,
brief-maxwell-wobble,maxwell,maxwell-wobble,torus2,polytope-dance}.md`, `assets/scenes/maxwell/*` (your target),
`assets/scenes/torus2/waves.js` and `assets/scenes/polytope/grooves.js` (the launch-list and refractory shapes), `assets/math/*`
(import freely, edit nothing), `assets/engine/feats.js`, `assets/engine/sources/fake.js`, `assets/core/params.js`,
`assets/core/lines.js`, `assets/core/quality.js` (read only), `tools/check.js`, `tools/scene-md5.sh`, `tools/param-smoke.js`,
`tools/test_fdtd.js`, `tools/cdp.js`'s header, `tools/probe.js`, `tools/lum.py`, `tools/montage.py`, `tools/accept/v0.11/*`,
`tools/accept/v0.12/*`. Not `core/scenes.js`, `core/loop.js`, `core/gl.js`, not `engine/features*.js`, not `engine/synapse/`.

**Targets:** `assets/scenes/maxwell/*` (a new `onsets.js` allowed; `colour.js` untouched in mechanism), `tools/test_fdtd.js` only if
a numeric change needs it, `tools/accept/v0.12/det12.py` only to match `hooks.launches()`'s shape (say so), `docs/workers/maxwell-onset.md`
(the report). Nothing in `core/`, `engine/`, `main.js`, `feats.js`, no other scene, no `math/`.

## Proofs per item (the plan's, restated as commands you run)

A. **Silence is silence.** `hooks.train('off')` + `hooks.quiet(0)` (music on, no hits) at CLOCK=1 f360: `hooks.energy()` **= 0**
   (say the exact number; ≤ 1e-6 of the v0.11 f360 energy counts as 0) and `probe().segs = 0`, the shot black inside the porthole
   but for the medium hint and the twelve glows. Then the plain `#test` f360/f840 pair non-black (the timeline has drums). Count
   the lines `index.js` lost. `git grep -n "CHG\|SUBK\|WOBA\|CENTK\|RSWEEP\|FAINT" assets/scenes/maxwell` is empty afterwards (or
   say which name survived and why).
C. **The media.** `hooks.medium(0)` and `(1)` with `hooks.train('4')` at f360: one sentence each on what the eye sees (the lens
   bends the four shells; the cavity shows one reflection crossing the next shell); `(3)` the waveguide shot; `(2)` → an error or
   empty space, never a lattice. `sectionAlt mod 2` in rotation — show the md5 pair still changes between f360 and f840 (the section
   changes on the fake timeline; if it does not, say what does). `NAMES`, `help.js`, the card blurb say lens · cavity.
B. **Every sound a wave.** `#test` CLOCK=1 over one bar: `hooks.launches().perBand` = the fake timeline's kicks + snares + hats per
   bar (say the numbers and the timeline's). `hooks.train('8')` vs `('4')`: `hooks.train()` spacings ratio 0.5 ± 5 %.
   `hooks.mxchroma("3")` + `hooks.train('4')` at f360: every entry of `launches().last` has sector 3's hue and `hooks.mxcol()` on the
   plane within `HUETOL` 0.04 turns of it. A kick with `bchroma` pinned to one bin (extend `mxchroma` to pin `bchroma` too, or add
   the pin to `launches`'s hook family — say which) launches from the centre in that bin's hue. Demo house at 6 s and 14 s: a shot
   each and the `launches()` read — say how many launches per band in the last 2 s and whether the note source fired on anything.
- **Cost:** the two-page protocol, MAXWELL ≤ 1.5× TORUS2 at tier 3 (`GRIDT[3]` substeps 3) — expect it to drop with the carrier gone;
  four numbers.
- **Always:** `check.js` 0 fail, `index.js` well under 500 (say the count); the brief-common items 2–3 on id 9 (t6/t14 non-black +
  reacting to the drop; house h10/h30/h50 differ); `ERRS []`, `nonFinite []`; `param-smoke.js`; `IDS=9 tools/scene-md5.sh mx3`.

## Report — `docs/workers/maxwell-onset.md`

(a) the friction log (every question the docs did not answer, every guess; where the plan's diagnosis was wrong); (b) forbidden
files you were tempted by; (c) every proof number and every shot's one-line description, per item; (d) anything wrong in the docs;
(e) the final `feats` list, the constants you added/removed with their values, the bench numbers, the s9 md5 lines, the line
count of every file in `assets/scenes/maxwell/`; (f) what the note-onset source did (shipped, shipped soft, or dropped) and why;
(g) the leans you would rank for the user (the montage is theirs to judge). Leave the scene registered at id 9, bid 0.
