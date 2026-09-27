# Next session — Retina Rave after v0.13 (written 2026-09-27; v0.13 tagged and pushed 2026-09-27 on the user's word)

**Live:** v0.13 (retinarave.com, tagged and pushed 2026-09-27): NAV2 "bump with the beat", eight passes (DECISIONS §46 + addenda 1–7,
`docs/AUDIT-v0.13.md` §1–8), `NAV2-BEAT-SESSION-PROMPT.md`. **The user tagged pass 8 but did NOT validate it** (*"nav2 looks good, can tag and deploy it. (leave
it at slot9)"*, then the same day: *"I wouldn't say nav2 validated. (I'm just taking a break tuning it)"*) — NAV2 is **paused mid-tune**,
stays id 8 / key `9`, forced-only; **the swap question (§39: NAV2 → id 0 / home) is answered: no swap.** A push to
`main` deploys; push only on the user's word.

**Validated by the user (2026-09-27):**
- **MAXWELL v0.12 / v0.12.1 is good** (*"I validated v0.12 maxwell scene and is good now"*; the user also said "done with maxwell for now"
  on 2026-09-26). It stays as it is: id 9, forced-only (key `9` then `n`), no bid. Do not retune it unasked. Still owed, not urgent: the
  launch-weighted expected hue in `tools/accept/v0.12/det12.py` (the instrument for the per-note gate on two-note basslines) and the `CDIP`
  comment in `assets/scenes/maxwell/colour.js` (describes v0.11's workaround). The retune menu of the old prompt (REARM / HATA / FGAIN /
  the waveguide / the hat by chroma) is retired unless the user brings it back.
- **POLYTOPE v0.9 is fine** (*"Polytope has been reviewed and is fine now"*). Untouched; its portrait cropping stays on the standing list.

**NAV2 is paused, not validated** (id 8, key `9`, forced-only, pass 8 tagged; the user is "taking a break tuning it"). Its mechanics (`beat.js` press, roots, `K_R`, `V_INT`, the running-peak bump) are not a proven model — do not copy them into another scene. When the user brings it back, read `NAV2-BEAT-SESSION-PROMPT.md` first — the user's four rounds of words on
`~/Music/RetinaRave/SeeYouDrop.flac`, the state constant by constant, the workflow (window replay → cause in the numbers → constants →
re-prove → audit section → commit), the pitfalls, and the ranked open list (the user's look at pass 4; gates vs notes; 1:45 measured as a
full-strength drop, the choice is the user's; the other three tracks measured + `DROP_GAP` 32 beats from Malicious on 2026-09-27, AUDIT §5,
montages ready to show; `beat.js` holds the press; measure per frame with `perbeat13.py`). The swap (§39 step 4) is declined: "leave it at slot9". Do not raise it again unless the user does.

**Tracks:** `~/Music/RetinaRave/` (SeeYouDrop.flac + CyborgNinja / WhoLikesToParty / Malicious mp3); the v0.12 and v0.13 accept scripts take
the name with or without its extension (`$MUSIC` overrides the folder). The user reports timestamps in TRACK time; `nav2-window.py
T0=<s>` replays that window with a shot and a D line per second.

**Standing, unchanged:** the Cloudflare dashboard steps (v0.6: www → apex, disable `*.workers.dev`, Search Console, Web Analytics); TORUS2's
leans; deleting `torus-v1`; folding `torus2/motion.js turn` onto `math/nudge.js` (waits for a TORUS2 session); the OKLCH variants;
POLYTOPE's portrait cropping; the NAV2 phase-winding colour variant (the argument principle; opt-in, `IDS=8` proof, after the swap
question). The six `tools/accept/v0.8/{ew,v3}-t*.jpg` deletions were committed 2026-09-27 on the user's word; two untracked
`tools/accept/v0.8/trans-*.jpg` remain: they are `tools/accept.sh` outputs (`$OUT` once pointed there), regenerable, left untracked.

**Not this:** a MAXWELL bid or retune, a full acceptance sweep, 3D, an OKLCH default, a carrier "bed" behind MAXWELL's hits, the
Hertzian-dipole hedge, fallback B (the `vec4` Yee), a new scene other than GIELIS (the user asked for GIELIS on 2026-09-27 — `GIELIS-SESSION-PROMPT.md`, id 10; every other new scene waits for the user's ask; see the memory).
