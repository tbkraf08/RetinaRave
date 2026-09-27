# Open items outside the v0.15 session (moved out of NEXT-SESSION-PROMPT.md on 2026-09-27)

The user (2026-09-27): *"next session prompt should just be the engine update and new scene (and any offline analysis that might be
needed)"*. Everything the old next-session prompt carried besides that work lives here, unchanged, for when the user brings it back:
the GIELIS look (v0.14 tagged and pushed 2026-09-27, not validated), NAV2 (paused), the validated scenes, the standing list.

**GIELIS (id 10, "slot 11", no digit key: `n` / `&scene=10`, forced-only, `score()` 0)** — the superformula nest the user asked for on
2026-09-27 ("goal new scene (slot 11); use 'see you drop' as the inspiration … how can we use the superformula to visualize music?"),
built on TORUS2's music model (the user: "torus2 is my favorite visually for how music lines up to the viz"). Spec `GIELIS-SESSION-PROMPT.md`,
brief `docs/workers/brief-gielis.md`, the worker's report `docs/workers/gielis.md`, the audit `docs/AUDIT-v0.14.md`, DECISIONS §47,
`tools/accept/v0.14/README.md`. **Pass 1 is merged (AUDIT-v0.14 §7, §47 addendum 1: lobes at rest, the per-family lean, latitude species + meridians; groove Q swing 0.155 → 0.375, 13/13 beats) — the user has not seen it. Next: the user looks at `montage-gi-syd-{groove,intro,break}-p1.jpg`**; the build's montages (`tools/accept/v0.14/montage-gi-syd-{intro,groove,break,double,drop}.jpg`,
plus `montage-gi-{cn,wltp}-intro.jpg` shown not tuned); then the user's words drive the retune passes (window replay `OUT=tools/accept/v0.14
KEY=9,n,n SCENE=10 PORT=8861 T0=<s> N=<n> TAG=<tag> python3 tools/accept/v0.13/nav2-window.py SeeYouDrop` → cause in the numbers →
constants → re-prove `IDS=10 tools/scene-md5.sh` → audit section → commit), and only on the user's word: bid, thumbs, tag v0.14, push.
The digit-key question (a tenth key, or GIELIS taking a slot) is the user's, raised once when they approve. **What the orchestrator saw
before the user did (AUDIT-v0.14 §3/§5):** the nest reads as seven glowing hoops (a lantern) at ~40 % of the frame on a black rim; p95
luminance 0.2–0.45 (dark, the brief wanted 0.6–0.8); the per-beat Q swing 0.13–0.16 on the groove with n1 already at its trough (the
brief's ≥ 0.15 on 90 % of beats not met — the lean at the pinch is the lever, not the press); the hue climbs the whole wheel over the
groove under a stable key 8 minor (the anchor's ease + mood terms, not key wander — a scene-side slower `HUETC` is the lever); the 58 s
drop reads (p95 0.72); **the engine fired no `dropEvt` at 1:45 in this run** (as twice on NAV2 — run to run), so the 1:45 answer is
untested; a third full-strength drop fired at ~9–10 s of the intro. Retune ranking: size · brightness (`FLOOR`/`GLOW`/`KNEE`) · the
pinch's lean and `N1_BEAT` · hoops → shell (`RINGS`/`PHI_MAX`/`SEGT`, path B has ~3× headroom) · the hue climb · `M0`/the ratio table vs `k + 3`.

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
