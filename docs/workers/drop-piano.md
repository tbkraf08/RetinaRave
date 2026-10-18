# The drop-piano worker — the engine's drop on a delicate piece, the energy shift, NAV3's hold (branch `drop-piano`, DECISIONS §143)

Worker report for `docs/workers/brief-drop-piano.md` (2026-10-18). Branch `drop-piano` in a worktree off `nav3-comptine` 1e20a18,
NOT merged, PORT 8815. Three `DROP:` commits: the engine (items 1 + 2), NAV3 (item 3), the gesture resume + docs + records.
The record is DECISIONS §143; this file is the friction log and the pointers.

## Pointers

* **The measurement** — `tools/work/drop/measure.py` (every drop event on the nine page traces with its witnesses), `measure2.py`
  (the slow / fast ladder at the events), `measure3.py` (which path armed the live detector, with the sub gate's 32 s history —
  the finding), `subdiag.mjs` / `slamdiag.mjs` (the sub gate and the ladders after every pre-§143 slam on the node traces),
  `v3diag.mjs` (v3's dropEvt through the same confirmation, emulated), `slams.mjs` (the live slams before / after per track).
* **The replays** — `tools/work/drop/shift-replay.mjs` (the shift stage through any trace: `--pat 'tools/work/drop/page/{T}-after.json'`,
  `--set LEVEL=…`; replay = page to the frame), `replay3.mjs` (NAV3's updateNav through a trace with §143's fields; `--before` =
  v0.43's reads), `n3rec.mjs` (the page's own NAV3 record on a track), `chain.sh` (the Chrome gate in one script, one Chrome at a time).
* **The node harness** — `tools/build-node.js` now runs the loud stage (page = node on loudRel to 6e-4) and records the loud fields;
  `build-replay.js` feeds them to the detector and sweeps `SUBV_HAD` / `SUB_BACK` / `LEVEL` / `PEND`; its main is guarded so the
  `tools/work/drop/*.mjs` rulers can import `replay()`. The node traces: `tools/work/drop/node/node-<T>.json` (whole tracks).
* **The page traces** — `tools/work/drop/page/<T>-after.json`: the nine whole tracks on the live lanes (`&map=0&scene=2`, from 0, no
  warm-up) with the fields the gate reads; `Comptine-after-map1.json` the file map too.
* **The records** — `tools/accept/drop/`: the md5 list, the q traces, the director traces, the parity line; the strips
  `tools/work/drop/comptine-after.jpg` / `seeyoudrop-after.jpg`.

## Friction log — what the docs did not say, every guess, every lean that moved

1. **Page ≠ node on Comptine's live detector.** §54 proved page = node on the four dance tracks; on Comptine v3's clock in node locks
   differently (beatCount off by up to 23) and the arms land elsewhere (42.9 / 45.1 against the page's 47.5 / 52.2 / 58.9 / 107.9). The
   node harness designed the gate; the page traces are the gate. The 0–110 s page traces (`tools/truth/traces/`) do not carry the
   detector's inputs (the low-onset lane), so the detector cannot be replayed from them — hence the whole-track page runs.
2. **The brief's "an arm needs the evidence a drop has" was two findings, not one.** (a) The ARM: every Comptine arm was the sub-void
   path (§64) with the causal sub gate's 32 s mean at 0.00 — the path assumed a sub exists. `SUBV_HAD` .3. (b) The SLAM: the sub gate
   opens within .25 s after every confirmed drop and never after a piano's or a breakdown's; the loudness ladder sits at .53–.99
   after a drop and at .17–.38 after a fill or a quiet-passage kick. `SUB_BACK` .5 + `LEVEL` .5 within `PEND` 4 beats.
3. **The ladder's RISE — the witness the brief named first — did not survive the measurement.** At the confirmed drops the slow
   ladder's rise over the bar before reads +.16 … +.52, the false slams −.48 … +.10 — but the fast ladder (loudM, 400 ms) reads
   +.34 on TheChain's quiet-passage kick and −.61 on Vienna's drop (the 400 ms window straddles the slam), and the slow one reads
   −.33 on Raindrops' drop after a gap (the 3 s window is full of the gap). Neither ladder's rise separated what the sub gate and the
   level did not, so the rise is not a knob. Comptine's 47.5 (−.48) vs 52.17 (+.52) is the SHIFT stage's business (item 2).
4. **A mid-track start lies to the ladder.** `&at=36` on Comptine: the loud stage restarts, the §67 warm-up guard holds `loudRel`
   near .8 and `loudRange` grows from 0, so the ladder reads .28 → .58 across 48–53 s where the whole-track one reads 0 → .9 — a
   real slam could have waited for a level the track would never show on that run. `LEVEL_RNG` 4 LU: the level test applies once the
   track has shown that much range. The shift stage has the same cold start: the brief's eye URL `&at=44` cannot show the 52 shift;
   the URLs below start at 0 / 30 s. In live mode the stream runs from the start of listening, which is the user's 90 %.
5. **The shift's level, twice.** `STEP` .3 alone chained NAV3's implosions on Comptine into one 50 s exterior (steps 0 → .3 at 31.9 /
   42.7 / 81.8 / 89.8, each a re-arm); `LEVEL` .5 still fired the four-second swells (44.4 at .56, 90.5 at .69 — the user's "too
   harsh at 1:34"); .7 fired the 1:34 swell on the whole-track page trace (.711); **.75** sits .04 above the loudest swell and .11
   under the softer drop (.86 at 1:49; .93 at 52). A number fitted on one track with its margins stated — the knob is `SHIFT.LEVEL`.
6. **No shift while the live detector is armed.** SeeYouDrop's riser read +.33 a bar before its slam (a shift at 104.7, the slam at
   105.6 — an early drop by the user's own rule); Vienna's dream +.3 three seconds before 85.3. `ARMED` 1. With `SUBV_HAD` Comptine
   never arms, so its shifts are free.
7. **The hold needed its own cap.** "EXT holds while shiftHold" held every dance-track drop to the 48-beat `PEAK` (19–25 s: a drop
   section stays up for a minute). `HOLD_MAX` 32 beats (Comptine's 52 → 1:07 is 27).
8. **A re-arm during IN.** Jumping c from the way back to the ε point would have been a visible jump of up to the ball-to-root
   distance; the way in restarts from where c is (`st.start`) — continuous, the petals light again. `st.from` stays the ball
   (the return's target: a point on the IN path is outside M at small u, and findCycle would fail there).
9. **The worktree had no `tools/truth/traces/` and no `tools/work/vox/`** (untracked in main): `npm test` failed on test_fluid
   ("no trace … record it") and test_vox ("missing mel-SeeYouDrop.json") until both were symlinked from the main checkout. Not a
   code fault; HARNESS could say a worktree needs them.
10. **`build-replay.js` ran its sweep on import** (top-level argv parsing) — guarded with `import.meta.url`.
11. **Appendix A is stale against feats.js on nine rows** (the PCM clock's "is bpm by default", keyConf, tonicConf, modeShade, the
    vox trio): `tools/feats-doc.js` regenerated them; reverted to keep this diff its own, the two new rows added by hand.
12. **The fake timeline leaves on its own shift now.** With `OUT3.ANY` 0 NAV3 no longer fires on the fake's `dropEvt`; the fake runs
    the real `Shift` on its mirrored ladder (as it mirrors the loud fields), so `#test` still shows the implosion — on the s6 pair's
    frames the shift lands where the fake's ladder steps, not at 13.0 s exactly, which is why both s6 lines move.
13. **v3's drop in node and under `&loud=0` is the pre-§143 one** (the candidate fires at once with `loudAbs` < 0) — the A/B, and
    why `v3diag.mjs` emulates the gate over the node trace's columns rather than reading node's `dropEvt`.
14. **Tempted to open a forbidden file:** none the brief forbade; `core/` untouched.

## The eye (PORT 8815, the branch)

* `http://127.0.0.1:8815/#test&track=Comptine&at=0&scene=6` — the drop at ~52 (the shift at 51.7), the exterior held to ~1:07 and
  the settle to ~1:11; nothing at 47; the next at ~1:51 held to 2:05. **From 0**: a `&at=44` start has a cold ladder (friction 4).
* `http://127.0.0.1:8815/#test&track=Comptine&at=30&scene=6` — the same from 30 s (the ladder has 20 s to warm; the 52 shift lands).
* `http://127.0.0.1:8815/#test&track=Comptine&at=100&scene=6` — cold: the 1:49 shift needs the range — use `&at=60` for that one.
* `http://127.0.0.1:8815/#test&track=SeeYouDrop&at=40&scene=6` — the drop at 57.6 as before (+50 ms), the exterior held 32 beats.
* `&n3drop=any` restores v3's dropEvt on NAV3; `&n3imp=…,HOLD,REARM,HOLD_MAX` (the 9th–11th numbers; `…,0,0` = v0.43's settle and discard);
  `&loud=0` = the pre-§143 detectors and no shift.
