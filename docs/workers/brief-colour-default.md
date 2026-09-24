# colour-default worker brief (v0.3 close, item 1) — read docs/workers/brief-common.md first
# (the "may read" rules and the report format apply; this brief overrides its file list)

**The user's feedback (2026-09-23, after the §24/§25 montages):** "I don't like the colour pastel change — the colours
don't seem to match up with the set. Not opposed to pastel, but it shouldn't be the default." So: **the v0.2 colour
passes come back as the defaults** on FEIGEN and NAV, and the OKLCH passes (§24, §25) stay as **opt-in variants**,
untouched. The core slot for this already exists (commit `4d00d89`, CONTRACTS §1.4 "Colour variants", HARNESS
`&colour=`): `scene.colour = { default: 'v2', variants: { v2: {…}, oklch: {…} } }`, the core sets `colour.cur`,
`draw(target, {w, h, variant, vmix, colour})` receives the current name, a variant's `post` replaces the scene's,
`&colour=<name>` under `#test` switches every scene that declares it, `CARD.colour` lists the current one per scene.

Targets: `assets/scenes/feigen/{index,colour}.js` (+ a new `colour-v2.js`), `assets/scenes/nav/{index,shaders}.js`
(+ a new `shaders-v2.js`). **Do not touch** `feigen/field.js`, `feigen/ladder.js`, `nav/nav.js` (state; `parity.js
fake` must stay 0 diff), anything in `core/`, `engine/`, `effects/`. PORT=8791. Own worktree; commit messages start
`COLOUR-DEFAULT:`. **One Chrome at a time from you**; never `pgrep -f`/`pkill -f` a pattern that can match your own
shell (bracket a letter: `chr[o]me`); a wait loop always sleeps.

**You may read:** `docs/workers/brief-common.md`, this brief, `docs/CONTRACTS.md` (§0, §1.1, §1.4, §1.10, §1.13,
§1.14), `docs/HARNESS.md` ("Static checks", "Headless Chrome", "Transition" — the mixs md5 recipe, "Parity", "Single-file
build", "Acceptance sweep"), `docs/DECISIONS.md` §17, §20, §24, §25, `docs/workers/feigen-oklch.md` and `nav-hue.md`
(what the OKLCH passes upload and why), your target folders, `assets/core/oklch.js` (read only), `assets/core/scenes.js`
lines 20–60 and `postOf` (how the slot is resolved — read, never edit), `tools/check.js`, `tools/scene-md5.sh`, and the
v0.2 tag's versions of your files through git: `git show v0.2:assets/scenes/feigen/colour.js`,
`git show v0.2:assets/scenes/feigen/index.js`, `git show v0.2:assets/scenes/nav/shaders.js`,
`git show v0.2:assets/scenes/nav/index.js` (and `git diff v0.2 HEAD -- assets/scenes/feigen assets/scenes/nav` — the
whole of what §24/§25 changed).

**The shape.**
- Lift the v0.2 shaders **verbatim** into `feigen/colour-v2.js` and `nav/shaders-v2.js` (`git show v0.2:… > file`),
  renaming only the exports (`FS_COLOUR_V2`, `FS_JULIA_V2`, … — HEAD already defines `pal()`/`rot()`/`hash()` so the
  v0.2 sources compile as they did). The OKLCH sources in `colour.js` / `shaders.js` stay byte-for-byte as shipped.
- `index.js` compiles both programs at `init` and draws with the one `colour` names. The per-variant uniform uploads
  differ (the v0.2 `index.js` diff shows exactly which — `uHue`, `uInvert`, `uSat`, `uAlive`, `uClipDbg`… vs the v0.2
  set). `feigen/index.js` is at 349 lines: put each variant's upload in its own module (`upload(gl, pr, …)` exported
  from `colour.js` / `colour-v2.js`) so `index.js` stays under 350 (`check.js` warns > 350, fails > 500); `check.js`'s
  dead-uniform rule needs every uniform a GLSL string declares to be fetched by a `pr.u('name')` somewhere.
- `colour: { default: 'v2', variants: { v2: { post: {fb .55, bloom thr 0.3, kaleido 0} }, oklch: { post: {…, bloom
  thr 0.6} } } }` on FEIGEN (0.6 was the OKLCH pass's need — §24; 0.3 is v0.2's); NAV's post is the same for both, so
  its variants carry no `post` (`scene.post` stays). The variant objects may also hold the program handle / shader
  source — that is the scene's business. `hooks.clipdbg` keeps working under `oklch` (it is a `#test` probe of that
  pass); under `v2` it is a no-op.
- `help`: one sentence in `help.why` or `help.math` of each scene naming the two colourings (the v2 one is the
  default: FEIGEN's cosine palette over the distance/potential grade, NAV's v3 `pal()` blue exterior with the Koenigs
  bands inside; the OKLCH one is §24/§25 — "opt-in, `&colour=oklch`").

**The baseline you must match — shoot it once, first.** The acceptance is *byte identity with v0.2's colouring under
the linear chain*: a worktree at the `v0.2` tag with only the chain's §20 files copied in from HEAD.
```
WT=$(pwd)/../wt-v2chain; git worktree add --detach $WT v0.2
for f in assets/core/post.js assets/core/oklch.js assets/math/oklab.js; do cp $f $WT/$f; done
cp -r assets/effects/. $WT/assets/effects/
cp assets/main.js $WT/assets/main.js   # if the v0.2 tree then fails to load (a missing engine export), keep v0.2's main.js
                                       # and apply only the chain-related lines of `git diff v0.2 HEAD -- assets/main.js`
(cd $WT && PORT=8766 tools/scene-md5.sh v2chain)   # s0 (NAV) and s6 (FEIGEN) f360/f840 are the reference md5s
```
Say in the report exactly what the worktree contained (`git -C $WT status --short`). Remove the worktree when done
(`git worktree remove --force $WT`).

**Acceptance (repo root of your worktree, all must pass; paste every output):**
1. `node tools/check.js` → 0 fail (0 warn on your files).
2. `PORT=8791 tools/scene-md5.sh v2` → **s0 and s6 lines identical to the v2chain list**; every other scene identical
   to `tools/accept/v0.3/scene-md5-v03.txt`. If FEIGEN or NAV differ by a byte, find why (a uniform the v0.2 pass read
   from a value that has since moved — the diff of `index.js` against v0.2 is the whole list of suspects) and fix it
   until identical; do not accept "visually the same".
3. `PORT=8791 tools/scene-md5.sh oklch '&colour=oklch'` → s0 and s6 identical to `scene-md5-v03.txt`'s s0/s6 lines.
4. `PORT=8791 GPU=1 node tools/parity.js fake` → `every field identical` / 0 diff.
5. The mixs md5 (HARNESS "Transition", the director-blind recipe: `test&scene=0&trans=mixs`, release at frame 120,
   `goScene(3,false)`, shoot 178): it changes because NAV is scene 0 of that pair — report the new md5 and the
   `[cur,next,m]` triple (must be `[0,3,0.499…]`).
6. `PORT=8791 GPU=1 node tools/cdp.js 'test&scene=6&colour=oklch' '[{"until":"window.CARD"},{"wait":3000},{"eval":"JSON.stringify(CARD.colour)"}]'`
   → `{"nav":"oklch","feigen":"oklch"}`; without `&colour=` → both `v2`; `&colour=nope` → an `[EXC]` line naming it.
7. Help: `PORT=8791 GPU=1 node tools/cdp.js 'test&scene=0' '[{"until":"window.CARD"},{"wait":2000},{"eval":"CARD.HELP.open?CARD.HELP.open():document.dispatchEvent(new KeyboardEvent(\"keydown\",{key:\"?\"}));\"x\""},{"wait":500},{"eval":"[...document.querySelectorAll(\"#helpC .hnote\")].map(e=>e.textContent).filter(t=>/colour/.test(t)).join(\" | \")"}]'`
   (read `assets/core/help.js` only for how the overlay opens if that eval misses) → the cast lines of NAV and FEIGEN
   read `colour: v2 (variants: v2, oklch)`.
8. Montage: `python3 tools/montage.py tools/work/colour-default.jpg 4 <v2 s6 f360> <oklch s6 f360> <v2 s6 f840> <oklch s6 f840> <v2 s0 f360> <oklch s0 f360> <v2 s0 f840> <oklch s0 f840>`.
   Read it. The v2 shots must show the v0.2 look: FEIGEN's dark field with the glowing filament and the Green's bands,
   NAV's blue exterior with a dark interior and Koenigs bands; the oklch shots the §24/§25 look. Say what you see.
9. `node tools/bundle.js` builds and `FILE=dist/eigenwobble.html PORT=8791 GPU=1 node tools/cdp.js 'test&scene=6' '[{"until":"window.CARD"},{"wait":4000},{"eval":"JSON.stringify({errs:CARD.ERRS,c:CARD.colour})"}]'` → errs `[]`, 0 `[EXC]`.
10. **Re-base the references in your last commit and say so in its message:** copy `tools/work/v2-md5.txt` over
    `tools/accept/v0.3/scene-md5-v03.txt` and `tools/work/oklch-md5.txt` to `tools/accept/v0.3/scene-md5-v03-oklch.txt`;
    the new mixs md5 goes in the report (the orchestrator writes it into DECISIONS §26 and HARNESS).

**Report:** `docs/workers/colour-default.md` — the brief-common shape (friction log, forbidden-file temptations, every
acceptance output verbatim, doc errors) plus: the v2chain worktree contents, the two md5 lists side by side, the new mixs
md5, and the exact byte-identity result for s0/s6 (and how many fixes it took).
