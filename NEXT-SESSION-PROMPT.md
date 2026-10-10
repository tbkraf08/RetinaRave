# Next session — Retina Rave (rewritten 2026-10-09 evening: **v0.35 tagged + pushed — a pool of ink under every scene**)

**2026-10-09 ~18:16 EDT: v0.35 TAGGED + PUSHED** (DECISIONS §104–§112, tag `v0.35`, on the user's word *"tag and deploy once done ;
(i'll validate once i'm home later)"*). Cloudflare's Git-connected build deploys it (5–85 min on v0.30–v0.34): poll `curl -s https://retinarave.com/ | grep -o "VER = '[0-9.]*'"` for `0.35.0`, `/whats-new` and `/THIRD-PARTY.md` 200, the *New in v0.35* card line; do not re-push to kick it (the live time is in the release report / memory). The push carried 35 commits (§104–§111 were never pushed; origin sat at `39c4a78`).

## What is live (the truth of the tree)
- **The fluid substrate** (§104, `assets/core/fluid/`): a Stam solver on the GPU, one step per frame under every scene, after Pavel Dobryakov's
  WebGL-Fluid-Simulation (MIT — the credit on about.html, README, THIRD-PARTY.md, all served). `CARD.fluid`, key `W` toggles it, `&fluid=0` under `#test`.
- **Advection is opt-in** (§105 built it as the default; **§109 turned it off** on the user's look: "I don't like the fluid dynamics effecting the
  other scenes … nav, particles, torus"): `post.fb.advect` default 0, only FLUID sets 1. NAV / DUST / TORUS2 render the v0.2 scalar program —
  the `&fluid=0` list equals the default list on every line but s12's (HARNESS "## Fluid").
- **FLUID, id 12** (§106): the dye lit as a liquid surface; forced-only, `n` cycles to it, `#scene=12`; card + thumb. The grammar (`inject.js`,
  pure, `FLUID_FEATS`): the bass note at the key's place on the tonic axis (§111 item 6), kicks lift / snares shear / hats sprinkle at ranked sizes
  (§111 items 2–4), the key is the colour and pins on evidence (item 5), the drop clears the pool — confirmed by the sub within 1.5 beats (§107, item 9),
  the harmonic floor from `mid` on the track's own range (§108, item 7), chord shears (§108), the harmonic branch + the noise guard (item 8).
- **The real-music harness** (§109): the fake's lattice events reach the scenes now; `tools/accept/v0.35/real-md5-v035.txt` (232 lines: the roster +
  FLUID × 7 tracks × both map modes × 4 windows + the take) and `real-rulers-v035.txt` are the PROOF, the fake lists the smoke; `tools/real-md5.sh`,
  `tools/real-rulers.sh`, `tools/traces.sh`, `tools/test_music.js`. Malicious is in every sweep for the record but is NOT a gate.
- **The glitch switch** (§110): `#glitch=0` on any page, key `G`, `post.glitch` per scene.
- **The release** (§112): releases.json top entry v0.35 (class scene, scenes [12]), `releases/retinarave-v0.35.html` 177 modules, the gates all green.

## What the user validates at home (each remark in track time = a retune request; DECISIONS §112 has the list with the file paths)
1. **FLUID on every track** — key `n` (or `#scene=12`), file mode; the references are §111's montages `tools/accept/v0.35/fluid-s111-<Track>-montage.jpg`.
2. **The drop flashes dimmer** (§111 item 1, SeeYouDrop drop1 57.5 / drop2 105.5).
3. **Vienna's dream at half the floor** (item 7, dream-75) — should the dream keep the full floor?
4. **Comptine's melody placement** (item 8: the hits walk with the melody; the applause 137–144 s reads as noise, nothing inked).
5. **The pad take at half the floor** after 5 s (`fluid-s111-rec-strip.jpg`).
6. **The roster scenes look as v0.34 did** (advect opt-in). `#post=nav2.fb.advect=1` under `#test` is the §105 look for an A/B.
7. **The glitch switch** — `G`, `retinarave.com/#glitch=0`.
8. **The map's sub ruler on Malicious** (the user's ruler validation, pending since §109 — until then Malicious is ignored in every gate).

## Open items (findings, none retuned; DECISIONS §111 "Open" + §112)
- §109's **seven ruler FAILs**: DUST 3 rows (black 391 on IBelongHere 159–219, black 1409 on the take, a jump at Vienna 184.35), TORUS2 4 rows (jump
  viol on CyborgNinja 121.1, IBelongHere 189.8 / 196.9, SeeYouDrop 42.4–44.2 / 76.8, WhoLikesToParty 12.4–53.4) — look at each on the track.
- **The two trace sets disagree on the ears' key timeline** (IBelongHere, CyborgNinja — different HEADs): re-record the survey's whole-track traces
  (`tools/work/fluid-tracks/<Track>/trace-map{1,0}.json`, `WARM=0 node tools/filetrace.js …`) at this HEAD before the next grammar pass.
- CyborgNinja's key is a guess (keyConf p50 .01), its C♯ at the wall · WhoLikesToParty's clear in file mode is the map's line a bar early ·
  the rec rulers row one frame off §109's (244 / 1463 vs 245 / 1464) · the kick / snare / hat INK constant per hit (only the force is ranked).
- **The bench at idle** is owed: §112 read 0.96 ms (ratio 0.44 to NAV, = §104's 0.43) with the desktop Chrome at 2 × 50 % CPU; the budget ≤ 1.0 ms
  at tier 3 holds on the ratio; an idle run should read ≈ 0.6 ms (HARNESS "## Fluid" bench).
- `accept.sh` end to end (its real-music block = §109 / §111's sweeps, ~1 h with PAR 1) · the §83 `nav.*` parity MISMATCH line (pre-existing).

## The saved next piece — do not start unasked
**`FLUID-DROP-SESSION-PROMPT.md`** (saved 2026-10-09, the user's ask after v0.35): the drop as implosion then shockwave in FLUID, for live
mode — item 1 a radial velocity ring on the confirmed drop trigger (replaces or joins the §107 clear by measurement), item 2 exact
time reversal by a ring of dye frames armed on the live build detector's last beat (`buildLive` latched + `dropLiveIn ≤ 1`), with a
cross-faded resume and a fake-out budget per track. Start it only on the user's word.

**`GRAMMAR-SESSION-PROMPT.md`** (saved 2026-10-09): one fixed cross-scene visual grammar — one musical question → one pre-attentive channel
(WHEN = motion onset, HOW HARD = size, WHAT = position then hue, WHERE in the phrase = fullness, HOW ROUGH = texture, HOW LOUD = the brightness
floor); CONTRACTS §1.19, then the audit of NAV / DUST / TORUS2 against it (`docs/plans/GRAMMAR-AUDIT.md`). §111's grammar on FLUID is the first
scene already on it (CONTRACTS §1.1's grammar sentence).

## Rules (unchanged)
The orchestrator delegates; planners AND builders are `model: fable`; push / tag / deploy only on the user's word; the user's dev server is
`node tools/serve.js` on **8765 with no port in its command line — never `pkill -f serve.js`, kill test servers by port only**; one page Chrome
per worker, two workers at most in parallel on disjoint files (a third is fine if it needs no Chrome); **two workers committing in one tree fold
each other's hunks — give a builder its own `git worktree` + branch and merge**; every before/after pair in an isolated worktree; never
`trackmap.py <T> --pcm` on any of the seven (all have truth dirs); no audible runs without saying so; commit per step with the numbers;
DECISIONS §113+; `node tools/license.js` on any new public file; **a grammar change is tuned and proven on every library track** (CONTRACTS §1.1,
HARNESS "## Fluid" the per-track recipe: the table first, then the shots, then the real-music gates); the tag ritual is HARNESS "## Release notes"
(bump both versions → the entry → `npm run build` → check → the gates → the frozen page → commit, `git tag -a`, push; poll, never re-push).
Tracks (seven): `~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3, Malicious.mp3, Vienna.flac, IBelongHere.flac, Comptine.flac}`;
the user's pad take `tools/work/rec/<tag>/music/rec.wav` through `tools/rec-strip.sh`. The user's words that still govern: reactive over predicted ·
"the double time should be accenting rather than driving" · a look remark = a retune request · plan AND build with Fable · click tracks to
`~/Music/RetinaRave-clicks/` with a ready `! paplay` line · "lets go one scene at a time".
