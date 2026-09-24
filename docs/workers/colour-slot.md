# COLOUR-SLOT — a declared colour slot on every scene (v0.5 item 3)

Branch `worktree-agent-a9e27401ec462d56b`, four commits off `fc963ba`, one per scene, not merged. The whole change is
four identical four-line insertions after each scene's `post:`

```js
// One colour mapping, declared (CONTRACTS §1.4) so every scene answers `CARD.colour`, the cast line and the panel's
// colour select the same way. No `post` on the variant: the scene's own `post` above stays in force.
colour: { default: 'v2', variants: { v2: {} } },
```

in `assets/scenes/{dust,mandala,torus,polytope}/index.js` — 16 inserted lines, nothing deleted, no core, no `feats.js`,
no other scene (`git diff fc963ba --stat` = those four files only). All six scenes now declare a colour slot; DUST,
MANDALA, TORUS and POLYTOPE declare exactly one variant, NAV and FEIGEN keep their two.

## (c) The acceptance outputs

**1. `node tools/check.js`** after every edit — `0 fail`, and the one `warn` is the pre-existing
`assets/scenes/feigen/index.js has 351 lines (soft cap 350)`, present at `fc963ba` and in a file this worker never
opened for writing. The colour-slot check (check.js:134–137: default ∈ variants, every variant an object) passes on
all six.

**2. Every `tools/scene-md5.sh` line unchanged — both mappings.**

```
PORT=8797 tools/scene-md5.sh cs                      → tools/work/cs-md5.txt
PORT=8797 tools/scene-md5.sh cs-ok '&colour=oklch'   → tools/work/cs-ok-md5.txt
diff <(sort tools/work/cs-md5.txt)    <(sort tools/accept/v0.5/scene-md5-v03.txt)        → no output
diff <(sort tools/work/cs-ok-md5.txt) <(sort tools/accept/v0.5/scene-md5-v03-oklch.txt)  → no output
```

All 14 lines of each list byte-identical, and every sweep line read `scene N errs [] hop 840 row 72` for N = 0…6. The
diffs are sorted because of a **line-order** difference that is not a pixel difference: `scene-md5.sh` now sorts the
scene ids numerically (`sort -n`), so DRUM's `s4` pair lands between TORUS and POLYTOPE, while both v0.5 reference
lists have the `s4` pair *appended at the end* (commit `fc963ba`). Unsorted, `diff` reports exactly those two lines
moved and nothing else. Worth a one-line fix to the reference lists by whoever owns them, so a plain `diff` passes.

**3. `CARD.colour`** (`PORT=8797 CLOCK=1 GPU=1 node tools/cdp.js 'test' …`):

```
EVAL JSON.stringify(CARD.colour)                        => {"nav":"v2","dust":"v2","mandala":"v2","torus":"v2","polytope":"v2","feigen":"v2"}
EVAL CARD.setColour("v2");JSON.stringify(CARD.colour)   => {"nav":"v2","dust":"v2","mandala":"v2","torus":"v2","polytope":"v2","feigen":"v2"}
EVAL CARD.setColour("oklch");JSON.stringify(CARD.colour)=> {"nav":"oklch","dust":"v2","mandala":"v2","torus":"v2","polytope":"v2","feigen":"oklch"}
EVAL try{CARD.setColour("nope")}catch(e){e.message}      => colour variant nope is not declared by any scene
```

Six scenes listed, all `v2` both times; `oklch` still moves exactly NAV and FEIGEN and leaves the four at their default;
an unknown name still throws.

**4. The help cast — shot `tools/work/cs-cast.jpg`** (the `C · the cast` heading scrolled into view at frame 120).
Every card's last line names the variant:

```
NAV      reads 27 fields · cuts: event      · colour: v2 (variants: v2, oklch)
DUST     reads 15 fields · cuts: onset      · colour: v2 (variants: v2)
MANDALA  reads 17 fields · cuts: event      · colour: v2 (variants: v2)
TORUS    reads 16 fields · cuts: continuous · colour: v2 (variants: v2)
DRUM     reads 27 fields · cuts: event      · colour: v2 (variants: v2, oklch)   (NAV's variant, NAV's slot)
POLYTOPE reads 16 fields · cuts: continuous · colour: v2 (variants: v2)
FEIGEN   reads 18 fields · cuts: event      · colour: v2 (variants: v2, oklch)
```

Before this change the four middle scenes had no `colour:` clause on that line at all.

**5. The panel — shot `tools/work/cs-panel.jpg`** (the `manual overrides` section). Six colour selects, ids from
`panel-ui.js`'s `ID('col', sc.name)` = `pe-col-<scene>`:

```
EVAL pe-col-nav=v2 pe-col-dust=v2 pe-col-mandala=v2 pe-col-torus=v2 pe-col-polytope=v2 pe-col-feigen=v2
```

The shot also settles the post question by eye: the DUST/MANDALA/TORUS/POLYTOPE post rows still show their own
placeholders (`fb.decay` 0.95 / 0.6 / 0.85 / 0.74), i.e. the empty variant object does not shadow the scene's `post`
(`panel.js:155 ownPost` = `(cv && cv.post) || sc.post`, and `cv.post` is `undefined`).

**6. The single-file build — FAILS, and fails identically at `fc963ba`.** `node tools/bundle.js` succeeds
(`bundled 66 modules → dist/eigenwobble.html (488 KB)`), but the page throws before the loop starts:

```
[EXC] TypeError: Cannot destructure property 'G' of '__m.assets/core/gl.js' as it is undefined
[EVAL-ERR] ReferenceError: CARD is not defined
```

`dist/eigenwobble.html:2788` is inside `__m["assets/core/post.js"]`, whose `const { G } = __m["assets/core/gl.js"]`
runs before `gl.js` has been emitted — a module-ordering bug in `tools/bundle.js`, not a scene bug. **Proof it is not
mine:** `git archive fc963ba | tar -x` into a scratch dir, `node tools/bundle.js` there, same cdp command → the same
exception at the same line, with no colour slots in the tree. Out of this worker's four folders, so left alone.

The same real start path on the module server passes, which is the closest thing to item 6 I can honestly report:

```
PORT=8797 NOAUTO=1 GPU=1 node tools/cdp.js 'real' '[{"wait":1500},{"click":[695,440]},{"wait":4000},{"eval":…}]'
EVAL => {"errs":[],"bad":[],"c":{"nav":"v2","dust":"v2","mandala":"v2","torus":"v2","polytope":"v2","feigen":"v2"}}
```

`errs []`, `nonFinite []`, six entries, 0 `[EXC]`.

**Passed:** 1, 2, 3, 4, 5. **Failed:** 6 (pre-existing bundle break, reproduced at the base commit).

## (a) Friction log

1. **`tools/work/` does not exist in a fresh worktree.** The first `scene-md5.sh` run printed
   `tools/scene-md5.sh: line 7: tools/work/cs-md5.txt: No such file or directory` — `: > tools/work/$TAG-md5.txt` runs
   before anything creates the directory; `cdp.js` creates it later for the shots, so the `>>` appends then work and the
   run self-heals with one scary line. One `mkdir -p tools/work` at the top of the script fixes it. HARNESS says
   "shots land in `tools/work/`" and never says the directory is untracked.
2. **The reference md5 lists are in a different order from what the script now emits** (item 2 above). The brief says
   "diff against `…/scene-md5-v03.txt`" as if a plain `diff` should be empty; it is not, for a reason with no pixels in
   it. Guess made: sorting both sides is the intended comparison. Someone should re-sort the two reference files.
3. **Nothing says where the help's cast section is.** HARNESS's example uses `help.scrollTop=1e5`, which lands on the
   *bottom* of the view — part E, the manual overrides — not the cast. My first `cs-cast` shot was therefore a second
   panel shot. Fixed by `querySelectorAll('h2,h3')` → the `C · the cast` heading → `scrollIntoView()`. The HARNESS line
   could say the cast is part C and the panel part E.
4. **The panel select's id is not documented, only derivable.** The brief allowed for this ("or whatever id `panel.js`
   gives them — read it"): `panel.js:204` `mkSel(ID('col', sc.name), …)` plus `panel-ui.js:17`
   `ID = (what,a,b) => 'pe-' + what + …` ⇒ `pe-col-<scene>`. `panel-ui.js` was not on the may-read list; I read the one
   `export const ID` line to resolve the id and nothing else.
5. **CONTRACTS §1.4 does not say what a variant with no `post` does.** It says "the one key the core reads is `post`",
   which implies an absent `post` changes nothing, but never states it. Verified empirically instead (item 5's
   placeholders, and the byte-identical md5s). A half-sentence in §1.4 — "a variant without `post` leaves the scene's
   own in force" — would have removed the guess.
6. **Whether the soft-cap warn counts as a "new warn".** Acceptance 1 says "no new warn"; there is exactly one warn and
   it is feigen's 351 lines. Checked it is pre-existing (`git show fc963ba:…/feigen/index.js`, and `git diff --stat`
   naming only four files) rather than asking.

## (b) Forbidden-file temptation

Twice, both minor. Once for `assets/core/scenes.js` / `help.js`, to see how `postOf` merges a variant's `post` and how
the cast line is built — resolved by the panel shot and the cast shot instead, which answer the same question from the
outside. Once for `tools/bundle.js`, to fix item 6 — deliberately not opened: the failure reproduces at the base commit,
so it is another worker's bug, and the brief's boundary is the four scene folders.

## (d) Docs that were wrong as printed

- HARNESS "Help view": the printed `document.getElementById("help").scrollTop=1e5` is labelled "the cast scrolled into
  view" and its shot is named `help-cast`, but at the current help length it lands on part E (the panel). The shot it
  produces is a panel shot. (Friction 3.)
- `tools/scene-md5.sh` as invoked in the brief leaves a `No such file or directory` line on a fresh worktree.
  (Friction 1.)

Chrome discipline: `pgrep -f "chrom[e].*remote-debugging"` before every run; the only debugging Chrome ever alive
alongside mine was another checkout's (`user-data-dir=…/Eigenwobble/tools/chr95xx`, the main tree, never mine). One at a
time from this worker, no bench, `PORT=8797` on every run.
