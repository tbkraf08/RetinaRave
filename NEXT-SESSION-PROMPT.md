# Next session — Retina Rave: the user's look at live step 3 (written 2026-09-28)

**State:** live step 3 is built and measured on `main`, **not tagged, not pushed** (v0.16 is also local only; retinarave.com
still serves v0.15). `engine/bars/` (the bar fingerprint store) predicts the next bar's kick / snare / hat from the bars that
looked like this one and releases them ON the heard hit: in a real tab capture of SeeYouDrop the predicted hits land at
+5 / +1 / +3 ms (the reactive ones +52 / +41 / +38 ms), 100 % before the audio reaches the analysers, precision 0.65 / 0.74 / 0.86.
Section starts come 1.2–2 beats into the bar (3 of 10, synapse 3 of 10 at +3–5 beats), returns 1 of 3 (synapse 0). Everything is
additive (new MS fields only; every existing trace and md5 unchanged). Numbers: `docs/AUDIT-live-grid.md` "Step 3", DECISIONS §50.

**Do first: let the user see it (no new scene — routes only).** In stream mode, TORUS2 (their favourite mapping) A/B:
- A (reactive, today): the page as it is.
- B (predicted): the routes panel `P` on TORUS2 → `kick ← predKick`, `snare ← predSnare`, `hat ← predHat`; or under #test on a
  file: `#test&track=SeeYouDrop&map=0&scene=3&route=torus2.kick=predKick,torus2.snare=predSnare,torus2.hat=predHat`.
- Listen for: the wave bump and the core flash landing WITH the kick instead of just after it (≈ 1/20 s — a snap vs a smear),
  and in a new section the first bar or two where B goes quiet or wrong before it relearns (the prediction needs history).
- CHLADNI's sand (ballistic, age-placed) is the second A/B: `chladni.kickEvt=predKickEvt,chladni.kickAge=predKickAge,
  chladni.snareAge=predSnareAge,chladni.hatAge=predHatAge`.
Ask one line: which reads better, and should any scene default to the predicted hits. Their look decides; nothing changes default
until they say so. Tag / push / deploy only on their word (v0.16 and this are both unpushed).

**Then:** step 4 (build detector v2) waits for the user's go — write its prompt from `LIVE-STEP3-SESSION-PROMPT.md`'s six-step plan.
Everything else: `docs/OPEN-ITEMS.md`.
