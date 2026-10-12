# Next session — Retina Rave (rewritten 2026-10-12 after **v0.38 tagged and pushed**: §120 the FLUID2 reset, §121 the RIG, §122 the vocal ground truth, §123 the live tier-2 CNN, §124 the file-mode Demucs lane)

**The live tree is v0.38** (tag `v0.38`, 2026-10-12; the user: *"tag and deploy"*). **`main` == the tag** — nothing is
held back this time: the rig and all three steps of the vocal detector are live. The deploy is the PUSH: Cloudflare
Workers is git-connected to `github.com/tbkraf08/RetinaRave` and builds `npm run build` → serves `dist/` on a push to
`main` (`wrangler.jsonc` points assets at `./dist`; `dist/` is NOT in git). Poll `https://retinarave.com/` for the
`VER` line after a push — **never push a second time to force a deploy** (DECISIONS §115, §119, §125).

**The vocal detector is DONE, all three steps** (§122 the ground truth, §123 the live tier-2 CNN in the ears + the rig
reading the voice — validated by the user's eye, §124 the file-mode Demucs lane that wins where it exists). **Next: the
CNN's accuracy / lag plan and the per-scene vocal reads — both being planned in parallel right now, so read their plans
before starting either.**

## The shape of the page as it ships (read this before any command)

**`REG` is dense 0..5 and every scene has a digit key** (§118; `archive/README.md` maps old → new whenever an old
number appears in a note written before 2026-10-11):

| id | key | scene | bids? |
| --- | --- | --- | --- |
| 0 | `1` | FLUID (was 12) | yes, since §114 |
| 1 | `2` | FLUID2 (was 13) — **the RIG** (§121: 23 invisible mouths; §123 / §124: the LEAD reads the voice) | **no — forced-only**, the user's word |
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

## The vocal detector as it ships (§122 → §124; the plan `docs/plans/VOCAL-PLAN.md`)

Three music-state keys — `voxS` (presence 0–1, eased .1 s), `voxHz` (the sung pitch, −1 none), `voxConf` — from
`engine/ears/vox.js` (a causal stage beside sub / perc / tonic, read-only to every other feature): a 40-band log-mel
front end with a causal per-band normaliser, `ears/vox-net.js` running a 38 385-parameter CNN as a STREAM (one column
per hop, ~38 k multiply-adds, **72.6 µs per hop median**, the output exactly the batch model on the last 34 hops), the
weights inlined from `ears/vox-weights.js` (104 297 bytes, Float16 base64, **Jamendo CC BY 4.0** credited in its header,
in `THIRD-PARTY.md` and in `site/about.html`), and a second `Yin` on a 200–1000 Hz band-passed copy for the pitch.
**In FILE mode a Demucs sidecar WINS** (§124): `tools/truth/voxlane.py <T> --all` writes `$MUSIC/<T>.vox.json`
(208–367 KB), `serve.js` serves it on the audio's route, `map.js` / `features-ears.js` overwrite the three keys from it
exactly as `map.sub` overwrites the causal sub. **`&vox=live` is the A/B** (the CNN's values on a file); `&vox=lane` is
the default; the HUD's vox line says `lead ← lane | live | interval` off `EARS.voxFrom`. Live mode (a tab share, the
mic, the demo) is the CNN alone and fetches nothing — which is why step 2 came first (the user listens live 90 % of the
time). `tools/vox-ab.js` is the ruler: no GL, the live stage replayed over the PCM dumps against the lane the page
fetches, per track.

**What is MEASURED and owed, in numbers** (§123's five training runs and its ruler, §124's A/B table):
the Jamendo-test F1 target ≥ .88 is **MISSED at .79–.80** · an **unseen** instrumental reads as a voice on **17–31 %**
of its frames (Comptine's solo piano, Vienna's synth leads — the control misses its < 5 % at 10.0 %, recorded as a note,
never a FAIL) · the CNN reads MORE voice than the lane on **every** track (+24 points on Comptine, +5 to +16 on the
voiced three) · `voxHz` on a mix is within a semitone of the lane on **87 / 77 / 48 %** (IBelongHere / Raindrops /
SeeYouDrop) · and the **CNN's lag is 150 / 160 / 180 ms** on the voiced three by cross-correlation. §123's own verdict
on the fix: a piano / lead-synth negative set or a longer window, **not** a sixth run of this net.

## FLUID2 now: the RIG (§121), with the voice in its LEAD (§123, validated by eye)

`inject2.js` is the rig (`docs/plans/FLUID2-EMITTERS.md` §0 has the five decisions and the eight-track table): 23
invisible mouths lining the sides and the top and inside, the chases, every splat in its note's hue
(luminance-normalised, the budget the base's), no shockwave, the blinder on the clear. **The LEAD channel reads the
voice** since §123: while `voxConf > 0` its ink share is `LEAD_SHARE · voxS` (nothing under `VOX_ON` .1), its height is
`p = 12·log2(voxHz / 440) + 69` (the scale degree plus `LEAD_OCT` .3 of the octave term), its hue the SUNG note's, and
a voiced frame with no pitch read holds the last height and hue; `voxConf` 0 falls back to §121's `interval` stand-in
exactly as before. `K2=` on any page reaches every knob (`FLOOR_DX`, `SIDE_Y`, `TOP_DX`, `QUAD_T`, `OUTER_T`,
`SPREAD_B`, `LEAD_SHARE / Y0 / Y1 / TAU / V / OCT`, `VOX_ON`, `BLIND_V / DYE`, `NOTE_COL 0`). Every remark in track
time = a retune of K2 (CONTRACTS §1.1: on all eight tracks, Malicious for the record).
**The real-md5 s1 lines are stale** (§121 moved the rig onto s1; §123 and §124 both swept s1 and recorded the moved
lists at `tools/accept/v0.38/real-md5-s12{3,4}-s1.txt` without re-basing the full reference) — **the next real sweep
re-bases them.** The roster's 264 lines (s0 / s2 / s3 / s4) held against the v0.37 reference through both steps.

## What the user validates at home on v0.38 (every remark in track time = a retune request)

1. **The voice in FLUID2, on the live site** (`#scene=1`, key `2`): the lead mouth rides the singer — its height the
   pitch, its hue the sung note — and goes quiet when nobody sings. The voiced tracks are the test: RaindropsOnRoses
   (its breakdown lead 111–137 s reads .987), IBelongHere, SeeYouDrop. On a **shared tab** this is the CNN alone.
2. **The two sources, side by side** (dev server only, a file): `#track=<T>&scene=1` is the lane and
   `#track=<T>&scene=1&vox=live` is the CNN, with the HUD's `lead ←` saying which. §124's A/B says they agree on
   70 / 76 / 73 % of frames and the CNN runs 150–180 ms late — the question for the eye is whether that is visible.
3. **The false voice:** Comptine's solo piano and Vienna's synth leads on a LIVE tab (where there is no lane) — the
   measured 10 % / 6 % of frames above the gate, seen rather than counted.
4. **§121 the rig itself**, still owed from before the tag: the groove, a build, a drop, a breakdown
   (RaindropsOnRoses 84 / 118 / 137 s, SeeYouDrop 57.6 s) — the chases, the note hues, the blinder on the clear.
5. **The switch:** `n` or `→` from FLUID (key 1) to FLUID2 (key 2) mid-groove — the pool must not blink.
6. **§118 on the live site:** the six scenes on keys `1`–`6`, the arrow keys forward and back, `n` unchanged, a page
   load opening on NAV2, and **Share a tab opening on FLUID and STAYING** through its dwell.
7. Carried, still unvalidated: from v0.36 the shockwave on the drop in FLUID (the four dropping tracks), FLUID in the
   rotation, the drop's flash with the ring and no droplets; from v0.35 FLUID on every track, Vienna's dream,
   Comptine's melody, the glitch switch.

## The saved pieces — do not start unasked

- **FLUID-DROP item 2, the reversal** (`FLUID-DROP-SESSION-PROMPT.md`; its `composeDt` / pen notes refer to the pulled
  grammar — a base `dtSim` of 0 still wins in `fluid.js`). `DROP_DISS` 6 is the knob to re-read after it, on every track.
- **S5b, the vocal-presence feature — DONE** (§122 → §124; the keys are in FEATS, the rig reads them, the HUD says
  which source). What is left of it is the accuracy / lag plan, being written now.
- **FLUID2 on the bid / a landing tile / a thumbnail** — the user's word only. Forced-only today (`score()` 0, no
  `card`), and `site/thumbs/` still has no `fluid2.jpg`, so the v0.38 release entry renders **no** thumbs at all.
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
DECISIONS §125+; `node tools/license.js` on any new public file; **a grammar change is tuned and proven on every library
track** (CONTRACTS §1.1, HARNESS "## Fluid") — the FLUID2 exception ended with §120; **never play audio unasked**; the tag ritual is HARNESS "## Release notes" (bump both versions → the entry → `npm run build` → check
→ the gates → the frozen page + the `git rm` of the fourth-newest → commit, `git tag -a`, push ONCE; poll, never
re-push); **a scene entering the rotation is proven by the director traces on house + aba**. Tracks (eight):
`~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3, Malicious.mp3, Vienna.flac,
IBelongHere.flac, Comptine.flac, RaindropsOnRoses.flac}` (Raindrops from 24 s); the user's pad take
`tools/work/fluid-diag/music/rec.wav`. The user's words that still govern: reactive over predicted · "the double time
should be accenting rather than driving" · a look remark = a retune request · plan AND build with Fable · "lets go one
scene at a time" · (§120) "I'm not a fan of fluid2 (it moves too quickly)" — the pool must not move faster than FLUID's.
