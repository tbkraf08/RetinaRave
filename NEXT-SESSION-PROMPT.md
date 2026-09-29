# Next session — Retina Rave: the user's look at the reactive drums v2 (written 2026-09-28)

**State:** v0.16 tagged locally; on top, NOT tagged, nothing pushed (retinarave.com serves v0.15): live step 3 + its warm-up
(`8997eda` … `939d128`) and **the reactive drums v2** (`332eb1e`, `docs/AUDIT-drums.md`, DECISIONS §51).

**Why v2:** the user preferred the reactive levels to the predicted ones ("the reactive still looks better (ie. seems like it
moves in sync with the music better)") and chose "improve the reactive path". `kick2` / `snare2` / `hat2` are additive levels
of synapse's shape: the kick from the ears' causal low onsets (kicks + 808 note starts; capture F 0.54, P 0.80 vs synapse's
0.39 / 0.40 — half of synapse's kick flashes are on no low hit), strength by flux rank × synapse's bass loudness (synapse's
distribution); snare / hat = synapse's, held to heard time in file modes.

**Do first:** the user's look, stream mode, TORUS2 (scene 3): routes panel `P` → torus2 kick / snare / hat ← kick2 / snare2 /
hat2 (or console `CARD.routes('torus2.kick=kick2,torus2.snare=snare2,torus2.hat=hat2')`), against no route. File mode:
`http://127.0.0.1:8765/#test&track=SeeYouDrop&map=0&scene=3&route=torus2.kick=kick2,torus2.snare=snare2,torus2.hat=hat2`.
- Better → ask whether to make v2 the default for every scene (then `kick` itself moves: the full scene-md5 lists re-base,
  `tools/accept.sh` on their word), and whether to tag / push.
- Worse or no different → ask what they see (fewer kick flashes on bass wobble is the main visible change; Malicious-like
  tracks with no clear kicks get slightly fewer hits).
Other open lines (only on the user's go): the plan's step 4 = the build-up / drop detector (not started); prediction as a
supplement (predKickIn anticipation); CyborgNinja's v3 clock phase.
