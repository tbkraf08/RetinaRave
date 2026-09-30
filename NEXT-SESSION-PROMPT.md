# Next session — Retina Rave (written 2026-09-29, evening)

**State:** **v0.18 tagged LOCALLY** (`6e4f1d1`), **not deployed** (the user, earlier the same day: "don't deploy"); retinarave.com
serves v0.15; `main` 31 commits ahead of origin. Since v0.17.1: the display lead is file-mode only (§53: 40 ms in file / demo,
0 in capture / mic — the user's stream A/B "B looks better"); **live step 4, the build / drop detector** (§54: `engine/build/`,
`buildLive` / `dropLiveIn` / `dropLiveEvt`; page causal 5/6 drops armed 7–16 beats ahead, 0.28 false/min, 0 on CyborgNinja;
capture 14 / 6 beats ahead, 0 false in 111 s); NAV reads it by default ("B looks good" → "#1" = NAV only), MAXWELL / POLYTOPE /
GIELIS still on v3's `build` / `dropEvt`.

**The user's words this session (verbatim, in order):** "B looks better" (stream, `#disp=0`) · "don't deploy, go to live step 4" ·
"B looks good" (NAV on the live route, stream) · "#1" (default on NAV only).

**Do, in order:**
1. **Deploy only on their word** (push `main` + tags; a push deploys). Ask once at the start whether v0.18 goes live.
2. **Live step 5 — the predicted-event queue** (the six-step plan, DECISIONS §49): one queue of the events the engine expects
   (the bar store's `pred*` hits, `dropLiveIn`'s bar line, the beat lines) released on heard time minus the display lead, so a
   scene can read "what comes next" from one place instead of three. Measure first (predcheck / dropcheck rulers exist); additive;
   A/B by route in stream mode; a default only on their word.
3. Smaller, only on the user's go: the other three build readers (MAXWELL / POLYTOPE / GIELIS) onto the live detector; a
   second no-drop control track + a hand check of WhoLikesToParty's drops (truth ±2 beats — its drops sit at v3 bar phase 3);
   the slam threshold `RET` 1.75 (margin 1.56–1.87 rests on two WLTP pickups); the fake-timeline thumbnails (NAV's f840 moved:
   no live drops on the fake timeline — `site/thumbs/nav.jpg` may want a file-mode frame like CHLADNI's); the earlier list
   (CyborgNinja's v3 clock 80–180 ms off, the ears' events under the display lead in file modes, v2 drums on other scenes).
   Everything else: `docs/OPEN-ITEMS.md`.

**Read first:** DECISIONS §53–§54, `docs/AUDIT-live-grid.md` "Step 4", HARNESS "Build", memory `project_live_mode`,
`feedback_display_lead`, `feedback_reactive_over_predicted`. Step 6 (tempo on the PCM bus / Kalman) only if jitter demands it.
