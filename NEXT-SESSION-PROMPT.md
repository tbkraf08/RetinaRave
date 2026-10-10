# Next session — Retina Rave (rewritten 2026-10-10: **v0.36 tagged + pushed — the drop as a shockwave, FLUID in the rotation**)

**2026-10-10 ~01:45 EDT: v0.36 TAGGED + PUSHED** (DECISIONS §113–§115, tag `v0.36`, on the user's word *"add fluid to the bid; tag and
deploy"*). Cloudflare's Git-connected build deploys it: 5–85 min on v0.30–v0.35 (v0.35 went live 1 min after the push); the LIVE time is in the release report / memory. Poll `curl -s https://retinarave.com/ | grep -o "VER = '[0-9.]*'"`
for `0.36.0`, the *New in v0.36* card line, `/whats-new`'s top card; do not re-push to kick it. The push carried v0.35's live tree + §113 (the
shockwave, branch fluid-drop-1) + §114 (the bid, branch fluid-bid) + the release commit.

## What is live (the truth of the tree)
- **Everything v0.35 shipped** (§104–§112): the fluid substrate under every scene, advection opt-in (only FLUID), FLUID id 12 with the §111
  grammar tuned on all seven tracks, the real-music harness (`tools/real-md5.sh`, `tools/real-rulers.sh`, `tools/traces.sh`, `test_music.js`),
  the glitch switch (`G`, `#glitch=0`), the credit to Pavel Dobryakov on about.html / README / THIRD-PARTY.md.
- **The drop is a shockwave** (§113, item 1 of FLUID-DROP): on the CONFIRMED drop (the §111 item 5 clear — `dropLiveEvt || mapDropEvt`, the sub
  returning within `CLEAR_PEND`) `inject.js`'s `plan()` returns a `ring {a, r, w}`: a radial velocity front from the screen centre at one screen
  radius per beat (`SW_C` .5, `SW_W` .08, `SW_T` .5 beats), SET on the velocity pass (curl-free — never added) with the ring's analytic divergence
  on the dye pass so the ink is CARRIED outward; amplitude = the confirming frame's `bass` ranked among the track's own kicks (`rkB`), ×
  loudRel × presence (A 0.67–1.60 uv/s per clear). `FLUID.wave` / `ctx.fluid.ring(a, r, w)` are the API; no extra draw (the ADVECT pass's
  uniforms); the scene's six droplets are gone; `DROP_DISS` stays 12 (the ring throws, the spike holds). Fires on SeeYouDrop ×2, Vienna ×1,
  WhoLikesToParty ×3, IBelongHere ×5 file / ×1 live (0.6 s late), nowhere else. The proofs: `tools/accept/v0.36/fluid-s113-<Track>-drops.jpg`,
  `-variants.jpg`, `real-md5-v036.txt` (232 lines), `real-rulers-v036.txt`.
- **FLUID bids** (§114): the roster is NAV2 (home) + DUST + TORUS2 + FLUID; `score = 0.35 + 0.4 bassS + 0.2 min(1, keyConf/0.6) + 0.15 (1 −
  centroid)`, 0 in a build; `core/scenes.js` untouched (0.1 noise, the history dock, the §95 dwell). `test_director` step 10 is the Node proof;
  §115 carries the Chrome traces on house + aba (FLUID 0 of 2 away picks on house — a steady tonal groove, TORUS2's territory — and 1 of 3 on
  aba, a 46.0 s stay; DUST 0 of 5 on both, as the §95 dwell traces already had on house).
- **The release** (§115): releases.json top entry v0.36 (class scene, scenes [12], decisions §113 + §114), `releases/retinarave-v0.36.html`
  (177 modules, 1 770 383 bytes), the gates all green on the tree after the bump (the numbers in §115).

## What the user validates at home (each remark in track time = a retune request; DECISIONS §115 has the list with the file paths)
1. **The shockwave on the drop in FLUID** on the four dropping tracks — SeeYouDrop 57.5 / 105.5, WhoLikesToParty 56.5 / 130.3 / 187.8 (file;
   live a bar later), Vienna 85.3, IBelongHere 16.4 / 32.7 / 65.2 / 130.3 / 179.1 (file) — `#scene=12`, file mode; the eye's references are
   `tools/accept/v0.36/fluid-s113-<Track>-drops.jpg` (the front crossing the centre at +0.1 / +0.2 / +0.3 s, the clean centre, the refill) and the
   two `-variants.jpg` (spike alone / ring alone / both). The live night: a tab capture fires it on SeeYouDrop ×2, Vienna ×1 (85.3 only),
   WhoLikesToParty ×3, IBelongHere ×1 (the 179 s return, 0.6 s late).
2. **FLUID in the rotation** — the director now lands on FLUID on its own (sub-driven passages under a sure key in a dark mix); does it
   pick it where the ear would? Too often / not enough / on the wrong passage are the retune remarks (§114's terms are a first cut, as §93's were).
3. **Does the drop's flash still read right** with the ring and no droplets (the composite's flash on SeeYouDrop's clears; none on WhoLikesToParty
   — the extractor never fires a drop there, the ring is the whole gesture).
4. Carried from v0.35 (unvalidated): FLUID on every track (`fluid-s111-<Track>-montage.jpg`), Vienna's dream at half the floor, Comptine's
   melody placement, the pad take, the roster scenes as v0.34, the glitch switch, the map's sub ruler on Malicious.

## Open items (findings, none retuned; DECISIONS §113 "Open", §114 "NOT proven here", §115)
- **`DROP_DISS` 6 with the ring** — untested; the one knob to try after the reversal lands, on every track, WhoLikesToParty's drop 3 as the ruler.
- **The idle bench is still unseen** — every substrate reading on this machine has the desktop Chrome on it (§112 0.96 / §113 0.67–0.72 ms at
  ratio 0.43–0.46); a truly idle run should read ≈ 0.6 ms (HARNESS "## Fluid" bench).
- **IBelongHere's live return lands 36 frames late** (the detector arms at 178.58, the sub returns at 179.13, the clear 179.18) — the live
  build/drop detector's placement (`engine/build`), not the grammar's.
- **Vienna's bar 40 (106.67) never arms the live detector** and the map has no line there — one of its two drops has no shockwave in any mode.
- The first-frame `mapDropEvt` clear on a mid-track `at=` throws the ring too (two groove references moved for it, §113) · a whole-track `'*'`
  trace overflows `filetrace.js`'s chunk cap (the survey's traces are still the §111 set) · the fit model's real-track read (whether a real drop
  window reads `bassS` .95 / `keyConf` .4) is for the user's eye and a real-track director trace.
- Carried from §112: §109's seven ruler FAILs on DUST (3) and TORUS2 (4) · the two trace sets' key-timeline disagreement · CyborgNinja's key a
  guess · WhoLikesToParty's file-mode clear a bar early · the kick / snare / hat INK constant per hit · `accept.sh` end to end · the §83 `nav.*`
  parity MISMATCH line (pre-existing, to the digit).

## The saved next piece — do not start unasked
**`FLUID-DROP-SESSION-PROMPT.md` item 2 — the reversal** (item 1 is DONE, §113; the file's top carries the decisions that bind item 2): exact
time reversal by a ring of dye frames at reduced resolution, armed on the live build detector's last beat (`buildLive` latched + `dropLiveIn ≤ 1`),
released into item 1's shockwave on the confirmed drop (`plan()`'s `drop` 1 / `ring` frame), a cross-faded resume (≤ 4 frames, the §1.9 step
measured at every resume) on a fake-out, the fake-out budget per track under `&map=0`, the ring copy inside the ≤ 1.0 ms budget at tier 3, OFF at
tier 0. Then `DROP_DISS` 6 on every track. Start it only on the user's word.

**`GRAMMAR-SESSION-PROMPT.md`** (saved 2026-10-09): one fixed cross-scene visual grammar; CONTRACTS §1.19, then the audit of NAV / DUST / TORUS2
against it. §111's grammar on FLUID is the first scene already on it.

## Rules (unchanged)
The orchestrator delegates; planners AND builders are `model: fable`; push / tag / deploy only on the user's word; the user's dev server is
`node tools/serve.js` on **8765 with no port in its command line — never `pkill -f serve.js`, kill test servers by pid only** (and never
`pgrep -f '<pattern>' | xargs kill` from a shell whose own command line contains the pattern — it kills the shell; `pgrep -f 'tools/serve.js 8975$'`);
one page Chrome per worker, two workers at most in parallel on disjoint files; **two workers committing in one tree fold each other's hunks —
give a builder its own `git worktree` + branch and merge**; every before/after pair in an isolated worktree; never `trackmap.py <T> --pcm` on
any of the seven; no audible runs without saying so; no `Math.random` / `Date.now`; commit per step with the numbers; DECISIONS §116+;
`node tools/license.js` on any new public file; **a grammar change is tuned and proven on every library track** (CONTRACTS §1.1, HARNESS "## Fluid");
the tag ritual is HARNESS "## Release notes" (bump both versions → the entry → `npm run build` → check → the gates → the frozen page → commit,
`git tag -a`, push; poll, never re-push); **a scene entering the rotation is proven by the director traces on house + aba** (HARNESS "Director traces",
`ACC=v0.36 PORT=89xx tools/director-trace.sh <tag> house` then `aba` — one style at a time when PORT is set, two lanes on one PORT would share a
debug port). Tracks (seven): `~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3, Malicious.mp3, Vienna.flac, IBelongHere.flac,
Comptine.flac}`; the user's pad take `tools/work/fluid-diag/music/rec.wav`. The user's words that still govern: reactive over predicted · "the
double time should be accenting rather than driving" · a look remark = a retune request · plan AND build with Fable · click tracks to
`~/Music/RetinaRave-clicks/` with a ready `! paplay` line · "lets go one scene at a time" · "add fluid to the bid; tag and deploy".
