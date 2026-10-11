# Next session — Retina Rave (rewritten 2026-10-11 after **v0.37 tagged and pushed**: §116 FLUID2, §117 the eighth track, §118 the lean-down + the Share-a-tab seat)

**The live tree is v0.37** (tag `v0.37`, 2026-10-11; the user: *"tag and deploy"*). `main` == the tag == what
retinarave.com serves; nothing is unreleased. The deploy is the PUSH: Cloudflare Workers is git-connected to
`github.com/tbkraf08/RetinaRave` and builds `npm run build` → serves `dist/` on a push to `main` (`wrangler.jsonc`
points assets at `./dist`; `dist/` is NOT in git). Poll `https://retinarave.com/` for the `VER` line after a push —
**never push a second time to force a deploy** (DECISIONS §115, §119).

## The shape of the page as it ships (read this before any command)

**`REG` is dense 0..5 and every scene has a digit key** (§118; `archive/README.md` maps old → new whenever an old
number appears in a note written before 2026-10-11):

| id | key | scene | bids? |
| --- | --- | --- | --- |
| 0 | `1` | FLUID (was 12) | yes, since §114 |
| 1 | `2` | FLUID2 (was 13) | **no — forced-only**, the user's word |
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

## The first thing before ANY further FLUID2 work: the eight-track sweep (owed, deferred twice on the user's word — not skipped)

Every K2 in `inject2.js` was tuned and proven on **RaindropsOnRoses alone** (from 24 s, the live lanes first), and
v0.37 shipped it that way knowing it (the user: *"only tune with Raindrops, don't do full sweep"*, then *"tag and
deploy"*). The other seven tracks are MEASURED by the no-GL table (`INJECT=assets/core/fluid/inject2.js node
tools/fluid-tracks.js`, the `bands` column — §116 S7 carries the rows) and **UNTUNED**. The sweep, as planned
(FLUID2-PLAN §4 S7): the table beside grammar 1's per track → the strips per band on each track (HARNESS "## Fluid",
the FLUID2 recipe) → retune K2 where a track reads outside the others' band (the §111 rule: a change on ≥ 3 of the six,
Malicious never a gate) → the full references (`SCENES=1 tools/real-md5.sh` 58 lines twice cmp-equal into
`real-md5-v037.txt`; `real-rulers.sh` 8 rows; the roster 174 / 174) → the per-track montages. What the table already
says (§116 S7): the breath needs a sub that moves (CyborgNinja / Comptine / Malicious never leave `dtSim` 1 — no sub
cut, no latched void); IBelongHere's clock reaches .5 in its breakdown (latched 10 %) and bursts on five file-map
clears; the grain's p50 reads .75 / .79 on SeeYouDrop / CyborgNinja against Raindrops' .41 (`HI_SRC` 0 — a track's own
range is the `HI_SRC` 1 switch) — the first knob to re-read per track.

## What the user validates at home on v0.37 (every remark in track time = a retune request)

1. **§118 itself, on the live site:** the six scenes on keys `1`–`6` in the order asked for, the **arrow keys** stepping
   forward and back (and wrapping), `n` unchanged, a page load still opening on NAV2.
2. **Share a tab opens on FLUID and STAYS** (the §118 addendum, after the user's *"still goes to nav"*): the pool on the
   first frames of a real tab share, held through its dwell (`dwellMin` ~84 s on the headless demo), then the director
   §93–§95 as before.
3. **FLUID2 on RaindropsOnRoses from 24 s** — `#scene=1` (`#scene=13` in every note written before §118) — at **27.4**
   (the 808 enters: the pool heaves, the pair launches), **41.1** (drop 1: the clear + the shockwave, the clock's burst
   on the file map), **55–57** (the sub pins: the breath per attack), **65.4–68.6** (the two-bar cut: the pool stills,
   its clock slackens to ~.84, the return at 1.1–1.2× — the music, or a framerate wobble?), **84** (the groove: the
   pair per kick, the snare jets from the walls), **111–137** (the breakdown: the pen draws the chords, the pads at half
   time), **137.1** (drop 3), **180+**. References: `tools/accept/v0.37/fluid2-s116-s7-RaindropsOnRoses-arc.jpg` (the
   live lanes) and `-arc-map1.jpg` (the file map). **On a live tab this track carries no clear, no shockwave and no
   clock burst** — the live detector never confirms its drops (§117), so the burst is file-mode only here.
4. **The time switches** (`&k2=` on the live page): the clock OFF `#scene=1&k2={"DT_SUB":0,"DT_VOID":1,"DT_DROP":0}` ·
   the breath alone `#scene=1&k2={"DT_VOID":1,"DT_DROP":0}` · with the level `#scene=1&k2={"DT_LVL":0.4}` · the honest
   drop `#scene=1&k2={"DT_DROP":1}` · the pulse `#scene=1&k2={"DT_BEAT":0.3}` (§116 S6 has the whole list).
5. **The switch itself:** `n` or `→` from FLUID (key 1) to FLUID2 (key 2) mid-groove — the pool must not blink.
6. **The pad take** through FLUID2 (`tools/work/rec/s7-pad-s13/grey.txt`, named before the renumber): the pen in place
   of the floor cloud reads 3.0 grey under FLUID's on average (−5.7 at most, 3–9 s), the same shape, the p99s alike.
7. Carried, still unvalidated: from v0.36 the shockwave on the drop in FLUID (the four dropping tracks), FLUID in the
   rotation, the drop's flash with the ring and no droplets; from v0.35 FLUID on every track, Vienna's dream,
   Comptine's melody, the glitch switch.

## The saved pieces — do not start unasked

- **FLUID-DROP item 2, the reversal** (`FLUID-DROP-SESSION-PROMPT.md`; where it meets FLUID2's `composeDt` and the pen
  is in the file). `DROP_DISS` 6 is the knob to re-read after it, on every track.
- **S5b, the vocal-presence feature** (one extractor session: `voxS / voxHz / voxConf` as §116 S5 specified them;
  `PEN_SRC 2` is reserved).
- **FLUID2 on the bid / a landing tile / a thumbnail** — the user's word only. Forced-only today (`score()` 0, no
  `card`), and `site/thumbs/` has no `fluid2.jpg`, so the v0.37 release entry renders five thumbs for six scenes.
- **The switches left at 0 with their numbers** (§116): `SWIRL`, `FLIP`, `CURL_MASK`, `JIT_V`, `PEN_V`, `DT_LVL` (.4 =
  +9–14 % on every groove), `DT_BEAT` (.3 = a ±15 % tick), `DT_DROP 1` (the substeps, +.5 ms for one beat).
- **Owed from §118:** `accept.sh`'s "== routes" and "== params" blocks were re-pointed from FEIGEN (archived) to NAV2
  (id 2) and have never run on the new vehicle — the next full `GPU=1 tools/accept.sh` is their first sweep.
- Open findings carried past the tag: the live detector misses Raindrops' drops 1 / 2 (the sub cuts leave no "bass came
  back" edge — `engine/build`, not the grammar) and the void term arms 2.1 s into the cut; IBelongHere's live return is
  36 frames late; Vienna's bar 40 arms nothing in either mode; a **tier-0 phone measure** of the whole band grammar;
  the **mixs 12→13 mid-dip** (the incoming scene's cold `U.expo`, measured and left open at §116 S7); **DUST's bid
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
DECISIONS §120+; `node tools/license.js` on any new public file; **a grammar change is tuned and proven on every library
track** (CONTRACTS §1.1, HARNESS "## Fluid") — FLUID2 is the one standing exception, on the user's word, and the sweep
above closes it; the tag ritual is HARNESS "## Release notes" (bump both versions → the entry → `npm run build` → check
→ the gates → the frozen page + the `git rm` of the fourth-newest → commit, `git tag -a`, push ONCE; poll, never
re-push); **a scene entering the rotation is proven by the director traces on house + aba**. Tracks (eight):
`~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3, Malicious.mp3, Vienna.flac,
IBelongHere.flac, Comptine.flac, RaindropsOnRoses.flac}` (Raindrops from 24 s); the user's pad take
`tools/work/fluid-diag/music/rec.wav`. The user's words that still govern: reactive over predicted · "the double time
should be accenting rather than driving" · a look remark = a retune request · plan AND build with Fable · "lets go one
scene at a time" · "only tune with Raindrops, don't do full sweep".
