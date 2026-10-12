# Next session — Retina Rave (rewritten 2026-10-11 after **v0.37 tagged and pushed**: §116 FLUID2, §117 the eighth track, §118 the lean-down + the Share-a-tab seat; **§120 the same evening: FLUID2 RESET to FLUID, unreleased on main**)

**The live tree is v0.37** (tag `v0.37`, 2026-10-11; the user: *"tag and deploy"*). **`main` is one step past the tag:
§120 reset FLUID2 to FLUID** (the band grammar pulled — the user: *"it moves too quickly"*; `inject2.js` the identity, the
scene files re-cloned, FLUID2 = FLUID to the pixel; not tagged, not pushed — retinarave.com still serves v0.37's FLUID2). The deploy is the PUSH: Cloudflare Workers is git-connected to
`github.com/tbkraf08/RetinaRave` and builds `npm run build` → serves `dist/` on a push to `main` (`wrangler.jsonc`
points assets at `./dist`; `dist/` is NOT in git). Poll `https://retinarave.com/` for the `VER` line after a push —
**never push a second time to force a deploy** (DECISIONS §115, §119).

## The shape of the page as it ships (read this before any command)

**`REG` is dense 0..5 and every scene has a digit key** (§118; `archive/README.md` maps old → new whenever an old
number appears in a note written before 2026-10-11):

| id | key | scene | bids? |
| --- | --- | --- | --- |
| 0 | `1` | FLUID (was 12) | yes, since §114 |
| 1 | `2` | FLUID2 (was 13) — **FLUID to the pixel since §120**; the experimental slot | **no — forced-only**, the user's word |
| 2 | `3` | NAV2 (was 0) — **the HOME** | yes, `0.5 + buildLive` |
| 3 | `4` | DUST (was 1) | yes |
| 4 | `5` | TORUS2 (was 3) | yes |
| 5 | `6` | MANDALA (was 2) | no — forced-only since §93 |

The roster is `SCENES="0 2 3 4"`. The HOME is NAV2 **by name** (`core/scenes.js register()` seats `SC.cur` /
`SC.logical` / `SC.hist` on whichever scene declares `home: true`) — a page load opens on NAV2, not on the literal 0.
**Share a tab opens on FLUID:** the button calls `seatScene(0)` before `ENGINE.start('capture')` — a SEAT, not a force
(`SC.forced` untouched, a picked landing tile wins), and since the §118 addendum the seat draws its §95 dwell and holds
`SC.seatHold` so the director's silence / drop / build home rules cannot undo it in the first seconds.

**Keys:** `1`–`6` force a scene · `0` releases to the director · `n` **or `→`** next · **`←` previous** · `?`/`h` help ·
`p` the routes panel · `w` the substrate · `g` the glitch rows · `r` record · `l` the lead.

**The archive** is `archive/` — frozen, imported by nothing in `assets/`, not walked by `check.js`, not bundled. The one
live dependency: `tools/test_nav2.js` reads `archive/scenes/nav/` as its A/B control. `docs/DECISIONS.md` is §104 onward
with a **"Standing rules (from §0–§103)"** block at the top (§0–§103 are in `docs/DECISIONS-ARCHIVE.md`).
`tools/parity.js` is a MUSIC-STATE parity now (62 fields; the ten `nav.*` rows went with the archived control).
`releases/` keeps **the last three** frozen pages and the tag step `git rm`s the fourth (HARNESS "## Release notes").

## NEXT: the vocal detector, step 1 — ground truth (`VOCAL-SESSION-PROMPT.md`; the plan `docs/plans/VOCAL-PLAN.md`)

The user (2026-10-11): *"plan next session: 1. ground truth first 2. live mode with tier2 CNN 3. file mode with demucs vocal stem"*.
Step 1 is one Fable session: install Demucs + librosa, the htdemucs pass on the eight tracks, `tools/truth/voxtruth.py` → `<T>.vox.json`,
the two renders per track + the `! paplay` list, Jamendo fetched, the credits. The user's ear closes it. Steps 2 and 3 follow in order.

## FLUID2 now: the RIG grammar (§121, on main, unreleased) — the user's five decisions built in one step; the eye is owed

`inject2.js` is the rig (`docs/plans/FLUID2-EMITTERS.md` §0 has the decisions and the eight-track table): 23 invisible mouths,
the chases, every splat in its note's hue (luminance-normalised, the budget the base's), the LEAD channel (`interval` over the
bass note — a chroma proxy, 12 degree bins on every track, glide .35 s), no shockwave, the blinder on the clear. `K2=` on any
page reaches every knob (`FLOOR_DX`, `SIDE_Y`, `TOP_DX`, `QUAD_T`, `OUTER_T`, `SPREAD_B`, `LEAD_SHARE / Y0 / Y1 / TAU / V`,
`BLIND_V / DYE`, `NOTE_COL 0` = the key's colour on everything). **Owed:** the user's eye on `#scene=1` (the groove, a build, a
drop, a breakdown — RaindropsOnRoses 84 / 118 / 137 s, SeeYouDrop 57.6 s); the S5b vocal detector (`voxS / voxHz`) to replace
the lead's two reads; the real-md5 s1 lines (stale since §120, re-based by the next real sweep). The §116 band grammar is at
v0.37. Every remark in track time = a retune of K2 (CONTRACTS §1.1: on all eight tracks, Malicious for the record).

## What the user validates at home on v0.37 (every remark in track time = a retune request)

1. **§118 itself, on the live site:** the six scenes on keys `1`–`6` in the order asked for, the **arrow keys** stepping
   forward and back (and wrapping), `n` unchanged, a page load still opening on NAV2.
2. **Share a tab opens on FLUID and STAYS** (the §118 addendum, after the user's *"still goes to nav"*): the pool on the
   first frames of a real tab share, held through its dwell (`dwellMin` ~84 s on the headless demo), then the director
   §93–§95 as before.
3. **FLUID2 (§121 on main, not live):** `#scene=1` on the dev server — the rig section above says where to look.
4. (the v0.37 page's FLUID2 is the pulled band grammar — nothing there to validate.)
5. **The switch itself:** `n` or `→` from FLUID (key 1) to FLUID2 (key 2) mid-groove — the pool must not blink.
7. Carried, still unvalidated: from v0.36 the shockwave on the drop in FLUID (the four dropping tracks), FLUID in the
   rotation, the drop's flash with the ring and no droplets; from v0.35 FLUID on every track, Vienna's dream,
   Comptine's melody, the glitch switch.

## The saved pieces — do not start unasked

- **FLUID-DROP item 2, the reversal** (`FLUID-DROP-SESSION-PROMPT.md`; its `composeDt` / pen notes refer to the pulled
  grammar — a base `dtSim` of 0 still wins in `fluid.js`). `DROP_DISS` 6 is the knob to re-read after it, on every track.
- **S5b, the vocal-presence feature** (one extractor session: `voxS / voxHz / voxConf` as §116 S5 specified them; the
  pen that would read it is gone with §120 — the feature stands on its own).
- **FLUID2 on the bid / a landing tile / a thumbnail** — the user's word only. Forced-only today (`score()` 0, no
  `card`), and `site/thumbs/` has no `fluid2.jpg`, so the v0.37 release entry renders five thumbs for six scenes.
- **Owed from §118:** `accept.sh`'s "== routes" and "== params" blocks were re-pointed from FEIGEN (archived) to NAV2
  (id 2) and have never run on the new vehicle — the next full `GPU=1 tools/accept.sh` is their first sweep.
- Open findings carried past the tag: the live detector misses Raindrops' drops 1 / 2 (the sub cuts leave no "bass came
  back" edge — `engine/build`, not the grammar) and the void term arms 2.1 s into the cut; IBelongHere's live return is
  36 frames late; Vienna's bar 40 arms nothing in either mode;   the **mixs 12→13 mid-dip** (the incoming scene's cold `U.expo`, measured and left open at §116 S7); **DUST's bid
  share** (0 of 5 away picks on the demo traces, §115); §109's seven ruler FAILs on DUST / TORUS2; the idle bench, still
  unseen on this machine.

## Rules (unchanged)

The orchestrator delegates; planners AND builders are `model: fable`; push / tag / deploy only on the user's word; the
user's dev server is `node tools/serve.js` on **8765 with no port in its command line — never `pkill -f serve.js`, kill
test servers by pid only** (and never `pgrep -f '<pattern>' | xargs kill` from a shell whose own command line contains
the pattern — it kills the shell; `pgrep -f 'tools/serve.js 8975$'`); one page Chrome per worker, two workers at most in
parallel on disjoint files; **two workers committing in one tree fold each other's hunks — give a builder its own
`git worktree` + branch and merge**; every before/after pair in an isolated worktree; never `trackmap.py <T> --pcm` on
any library track; no audible runs without saying so; no `Math.random` / `Date.now`; commit per step with the numbers;
DECISIONS §121+; `node tools/license.js` on any new public file; **a grammar change is tuned and proven on every library
track** (CONTRACTS §1.1, HARNESS "## Fluid") — the FLUID2 exception ended with §120; the tag ritual is HARNESS "## Release notes" (bump both versions → the entry → `npm run build` → check
→ the gates → the frozen page + the `git rm` of the fourth-newest → commit, `git tag -a`, push ONCE; poll, never
re-push); **a scene entering the rotation is proven by the director traces on house + aba**. Tracks (eight):
`~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3, Malicious.mp3, Vienna.flac,
IBelongHere.flac, Comptine.flac, RaindropsOnRoses.flac}` (Raindrops from 24 s); the user's pad take
`tools/work/fluid-diag/music/rec.wav`. The user's words that still govern: reactive over predicted · "the double time
should be accenting rather than driving" · a look remark = a retune request · plan AND build with Fable · "lets go one
scene at a time" · (§120) "I'm not a fan of fluid2 (it moves too quickly)" — the pool must not move faster than FLUID's.
