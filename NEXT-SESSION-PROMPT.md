# Next session — Retina Rave (written 2026-09-29)

**State:** v0.17.1 tagged LOCALLY (`bcf0e9d`), **not deployed** (the user: "tag as v0.17.1, don't deploy yet"); retinarave.com
serves v0.15; `main` 21+ commits ahead of origin. Since v0.16: live step 3 (bar store, predictions — opt-in, unused by default),
its warm-up, the reactive drums v2 (`kick2` / `snare2` / `hat2`; TORUS2 reads them by default), the 40 ms display lead (§52).

**The user's words this session (verbatim, in order):** "I think the reactive still looks better (ie. seems like it moves in
sync with the music better)" · "do #1" · "v2 looks good" · (TORUS2 default) "Default on TORUS2 only" · "it seems like v0.15 is
better then what we have now (was looking on scene 0 …), in theory v0.16 should be on par with v0.15" · (&lead=0 / &disp=40)
"second and third look good" · "ok I can see that" (v2 in SeeYouDrop's drumless walk) · "tag as v0.17.1, don't deploy yet".

**Do, in order:**
1. **The stream-mode look at the display lead** (NAV + TORUS2, capture) — the clocks run 40 ms further ahead there since
   `afaa40d`; v0.16 was approved in stream mode at 0. Good → deploy only on their word (push `main`). Early → make the display
   lead file-mode only (`&disp`), re-look.
2. **Live step 4 — the build-up / drop detector:** `LIVE-STEP4-BUILD-SESSION-PROMPT.md` (live, nothing anticipates a drop today).
3. Smaller, only on the user's go: the ears' events (`kickEvt` …, CHLADNI) released by the display lead in file modes; v2
   drums on other scenes (DUST / MANDALA kick flares); CyborgNinja's v3 clock (80–180 ms off its truth, hunting near half a
   beat); prediction as a supplement (`predKickIn` anticipation). Everything else: `docs/OPEN-ITEMS.md`.
