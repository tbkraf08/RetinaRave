# Next session — Retina Rave (written 2026-09-30)

**State:** **v0.27 DEPLOYED 2026-10-02** (`311d09a`, first push since v0.15; retinarave.com serves v0.27). `main` == origin.
serves v0.15; `main` ~45 commits ahead of origin. **All six steps of the live plan (DECISIONS §49) are in:** the lead (§49), the bar
store + warm-up (§50), reactive drums v2 (§51), display lead 40 ms file-mode only (§52–§53), the live build / drop detector (§54, NAV
reads it by default), the predicted-event queue (§55, no scene reads it by default), the PCM beat clock (§56, THE DEFAULT CLOCK).

**The user's words (verbatim, latest first):** "B really seems to handle the double time as it builds before drop better; default
and tag what has been done so far" (PCM clock) · "on the PCM bus seems more accurate and would be wanted regardless … still need to
work on the predictions" · "B looks good" / "#1" (live detector on NAV) · "B looks better" (stream: no display lead) · "don't deploy".

**Do, in order:**
0. **The DUST overhaul, pass 1 — `DUST-OVERHAUL-SESSION-PROMPT.md`** (the user, 2026-09-30: "start with DUST (can do a full
   overhaul in place)", the legibility brief inside it, "looks good, can start"). This is the live work; items 1–4 below wait.
1. **Ask once: does v0.20 go live?** Deploy = push `main` + tags, only on their word. Before a deploy: `tools/accept.sh` has not been
   run since v0.14 — run it (or say so), regenerate the fake-timeline thumbnails (`site/thumbs/nav.jpg` — NAV's f840 moved), and
   check `site/` copy mentions nothing stale.
2. **"Still need to work on the predictions"** — the store on the PCM clock (capture pred kick F 0.38, P 0.66; CyborgNinja 0.70). Next
   levers, measured in AUDIT-live-grid: (a) **a bar-line source of its own** — the bar phase is beat count mod 4 wherever synapse isn't
   sure (SeeYouDrop's downbeat lands right by from-0 luck on both clocks; WhoLikesToParty's drops sit at v3 bar phase 3); (b) the
   store's per-class offsets in real time (the `nextKickIn` count-down jumps 281/min are theirs, not the clock's); (c) CyborgNinja's
   lattice choice (two equal-energy kick lattices; the truth's pick rests on a 9 % margin) needs a musical rule; (d) recall: precision
   0.66 but recall 0.27 — what the store never predicts.
3. **Scenes on the queue** (`next*Up` wind-ups) only if the user asks for the TORUS2 wind-up A/B again (§55 recipe:
   `CARD.params('torus2.wave=nextKickUp*0.35+0.65')`) — they have not looked at it.
4. Smaller, on their go: MAXWELL / POLYTOPE / GIELIS onto the live detector; parity's `nav.*` rows (mismatch since 22eb969, expected);
   v3's run-to-run 1e-8 nondeterminism hours apart (Chrome / decode state, not code); a second no-drop control track; WLTP truth ±2 beats.
   Everything else: `docs/OPEN-ITEMS.md`.

**Read first:** DECISIONS §53–§56 (tail), `docs/AUDIT-live-grid.md` steps 4–6, HARNESS "Build" / "Queue" / "Clock", memory
`project_live_mode`, `feedback_display_lead`, `feedback_reactive_over_predicted`. Lessons this round: heardT STEPS in capture
(10.7 / 21.3 ms per frame) — evaluate anything on heard time at `now` + the median offset, never at heardT itself; the dev server on
8765 is the user's and has no port in its command line — kill test servers by port only; audible runs: say so first.
