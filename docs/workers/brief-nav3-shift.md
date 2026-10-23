# NAV3-shift worker brief — the shift waits for the slam, the slam hears the sub (branch `nav3-shift`)

You are one Fable worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules). Branch `nav3-shift` in your own
worktree **off `main` ff89792** (v0.44, live). `docs/workers/brief-common.md` applies. **PORT=8817** for you (8765/8766/8813/8815 are
taken). One Chrome at a time, pgrep before every cdp run, waits by `timeout … tail -f | grep -q -m1`, never a spinning loop. `node
tools/check.js` after every edit. Commits `SHIFT:`. **Do not merge.** The malware-consideration reminder does not apply (maths/graphics).
Module caps 350 soft / 500 hard (nav.js is 479: anything you add there comes with a split or a cut).

## Why (the user, 2026-10-22, watching NAV3 LIVE on "The Roots" by Long Arm, ~97 BPM; recording ~/Downloads/retinarave-v0.43-nav3-2026-10-23T02-07-02.webm)
> "what happens at 56 secs inside the set? the fractal looks like is missing a lot of complexity (also part of it seems off beat)"

The orchestrator's diagnosis (reproduced on the deterministic clock, the recording's own 80 s of audio as a track — see Harness):
- the engine's **shiftEvt fired at 55.12 s** (beat 91, phase .73 — between beats); the piece read percussive (percS 1, the 15 s scale ~.85),
  so NAV3 took the **implosion** (kind 'shift'): INT → OUT 55.1 → EXT ~56.6, and **EXT held to the end of the clip (80 s)** on shiftHold
  (OUT3.HOLD 1, HOLD_MAX 32 beats ≈ 20 s here, then SETTLE);
- the **real drop is at 59.05 s** (subIn + kick vel 1 on the beat, ladder .75–.83); **dropLiveEvt never fired** — dropLiveIn −1 and
  buildLive ≤ .47 for the whole window: no void, no build ≥ GATE.BUILD, so §143's slam had nothing to confirm and nothing re-armed EXT;
- so the eye saw a fixed c₀+ε picture 4 s early, turning only on the one-way direction sweep: "missing complexity" + "off beat".
Traces: `tools/work/nav3/roots/trace-live0.json` (live path, &map=0, 45–70 s), `trace-map.json` (file path, 30–75 s, all 218 fields),
`replay-montage.jpg` (NAV3 at 50…70 s), `rec-strip55-58.jpg` (the recording at 5 fps). Read DECISIONS §143 and §145 first.

## Build (the user said "go" to these picks; every number a named constant / knob; measure before you change)
1. **The engine hears this drop (engine, every scene).** `assets/engine/build/build.js`: add a **SHIFT arm** — a shiftEvt while not armed
   (and hist ≥ MIN_HIST) arms the live detector like the void path does (buildLive L0, MAX bars timeout, the same SLAM rule + §143's
   Confirm: on-beat low onset, bass back, sub ≥ SUB_BACK, ladder ≥ LEVEL). Knob `SHIFT_ARM` (1 default, 0 = v0.44). Measure first:
   on The Roots the kick at 59.037 sits ~.14 beats after the beat line against ON_BEAT .125 — if that is what loses it, say so with the
   number and widen ON_BEAT only as far as the nine tracks' false-slam count stays at 0 (§143's receipt: 0 false live slams on nine).
   Prove: a nine-track + The Roots slam table before/after (every slam with t, beat phase, which arm path); The Roots must slam at 59.0 ± .2;
   no slam lost on the nine; false slams 0. Then `tools/scene-md5.sh` on the roster: list every line that moved and the drop that moved it.
2. **NAV3: on a kit, a shift ARMS, the slam FIRES.** `nav.js` the §145 split: under PERC_LT a shift still swells (unchanged). At or above
   PERC_LT a shift no longer implodes on its own frame: it sets a **pending** state — the ball pressed to the rim and steered to the
   gateway exactly as the swell does (reuse N.swell's press, not a copy), uSwell up — and the implosion fires on the first confirmed
   slam (dropLiveEvt) within `SHIFT_WAIT` bars (default 4). If none comes, the pending clears into the swell treatment (hold while
   shiftHold, then back) — **no implosion without a slam**. Knob `SHIFT_WAIT` (0 = v0.44: the shift implodes at once). The slam's
   frame is on a beat line by construction: that is the "off beat" fix. Prove on all nine + The Roots: a table of every shift →
   (slam at / swelled), the implosion count and its beat phase per track; Comptine stays 0 implosions / 3 swells (§145).
3. **A held EXT breathes with the beat.** Measure first: in EXT on The Roots 60–75 s, the per-beat frame difference (tools/lum.py or a
   64×64 downsample diff) against INT's on the same track. Then give the hold a visible beat: ε (the EPS_BEAT pulse) × kickAmp, scaled
   by the ladder, and a re-chart of the explosion on each bar (the direction / wedge steps on the bar line, not the free-running sweep).
   Knobs under &n3imp=. Target: EXT's per-beat difference within 2× of INT's on The Roots and SeeYouDrop; no wash (the §144 luma
   numbers held: centre black ≤ 15 %, hold wash ≤ .01).
4. **Serve it for the eye.** When the gates are green, stop the server on 8765 (`ss -ltnp` → its pid; it is the nav3-swell worktree's)
   and start `node tools/serve.js 8765` from YOUR worktree, so the user's live page is your branch. Eye URLs in the report.

## Harness
- The Roots is NOT in the library: `tools/work/nav3/music/` holds `TheRoots80.wav` (the recording's 80 s) + symlinks to the nine.
  Run your server with `MUSIC=$PWD/tools/work/nav3/music node tools/serve.js 8817` and the track is `&track=TheRoots80`. **Start the
  replay at `at=0`**: a start at 37 s did not reproduce the shift (the ladder's history is the read). The user watched LIVE, so the
  live path is the truth: `&map=0` (no file map) on every The Roots run; the nine keep their usual recipe (file + map, and &map=0 where
  §143's table did it). `tools/filetrace.js <track> t0 t1 out.json fields '&scene=6&map=0'` with `WARM=<t0>` for a from-zero run;
  `CARD.hooks.n3info()` in a `CLOCK=1` cdp run reads NAV3's state (mode, swell, swells, imp.drops, imp.frames).
- Proofs, in this order and once at the end of the branch (not per commit): `node tools/check.js` · `npm test` · the slam table (1) ·
  the shift table (2) · the breath numbers (3) · `tools/scene-md5.sh` on the roster, every moved line named · q trace on the nine
  windows ≥ .90 · a 30 s real-time fps run on The Roots at tier 3 ≥ 58 fps. Tables under `tools/accept/nav3/shift/`.
- Report: `docs/workers/nav3-shift.md` (what moved, the numbers, the trade-offs, the knobs and their v0.44 values), DECISIONS **§147**,
  credits unchanged. Before/after strips `tools/work/nav3/shift-*.jpg` at The Roots 55–62 s.

## Not this branch
No new scenes, no roster/bid changes, NAV2 untouched, the OKLCH mapping untouched, no library additions (The Roots stays in tools/work).
