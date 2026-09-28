# Next session — Retina Rave: the user's look at the live step 3 warm-up (written 2026-09-28)

**State:** v0.16 tagged locally; live step 3 (`engine/bars/`) + its warm-up (`8997eda` W.0 ruler, `842010c` W.1, `b12aaa3` W.1b,
`939d128` W.1c) committed on top, **not tagged, nothing pushed** (retinarave.com serves v0.15). Read `docs/AUDIT-live-grid.md`
"Step 3 — warm-up" (W.0 → W.1c) and DECISIONS §50's warm-up addendum.

**What changed for the eye:** B's look is untouched (predKick / predSnare / predHat still peak 1.0 on every predicted hit).
The first predicted hits after a start no longer run early: det first 4 s kick / snare / hat −13 / −9 / −5 → 0 / 0 / −6 ms;
real-time (same inputs, 12 starts) −9 / −5 / −6 → +7 / +3 / −5, settled +1 / 0 / +2. The early PRECISION was already a warm
store's on the same audio (0.72 / 0.72) and still is. Mechanism: micro-timing offsets are now the median of the last 16
residuals, learned only on a settled grid (the v3 clock's cold-start pull-in no longer teaches them); reliability earned.

**Do first:** ask the user to look at the same A/B in stream mode (TORUS2, scene 3; B's route string
`torus2.kick=predKick,torus2.snare=predSnare,torus2.hat=predHat`; file-mode link
`http://127.0.0.1:8765/#test&track=SeeYouDrop&map=0&scene=3&route=torus2.kick=predKick,torus2.snare=predSnare,torus2.hat=predHat`).
- "Good" → tag / push only on their word (v0.17?).
- "Still off at the start" → the two levers left, measured: `WARM.GATE = 1` (quiet until the grid settles: 2–3 s more
  silence, CyborgNinja's hunting clock may stay silent — `tools/warm-ruler.sh` + `EXTRA='--set GATE=1'` shows the rows), and
  the ears' own warm-up (the groove's first kicks are detected late → +7…+8 ms for 8 s real-time) — step 4, detector v2.
- Wrong steps in hard sections (P 0.55–0.75, same as warm) are the ears' noise, also step 4.

Tools: `tools/warm-rec.sh` (7 min; 24 det cold starts are in `tools/work/warm/`), `tools/warm-ruler.sh [tag]` (seconds),
`tools/truth/warmcheck.py`, `predcheck.py --bins`, `bars-replay.js` (now replays real-time / capture traces too; `--set`).
Open: CyborgNinja's v3 clock sits 80–180 ms off its truth (hunting near half a beat) — a clock item. Step 4 only on their go.
