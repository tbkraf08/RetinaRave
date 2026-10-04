# Open items outside the v0.15 session (moved out of NEXT-SESSION-PROMPT.md on 2026-09-27)

**Director roster + fit model (DECISIONS §93 + addendum, 2026-10-04):** only NAV, DUST, TORUS2 bid; MANDALA, GIELIS, CHLADNI, MAXWELL,
DRUM, FEIGEN, POLYTOPE, TORUS v1, NAV2 forced-only (the §93 territory formulas are kept in each scene's comment). **§95:** each scene
stays at least 30–90 s (drawn per landing; drops / silence / builds still go home at once). §94: a boot never revives a forced scene. The territories are a first cut from the formulas and the demo traces — **open: the user's eye on
the picks over the real tracks** (remarks in track time → retune the bids; `tools/director-trace.sh`, `tools/accept/v0.32/`).

The user (2026-09-27): *"next session prompt should just be the engine update and new scene (and any offline analysis that might be
needed)"*. Everything the old next-session prompt carried besides that work lives here, unchanged, for when the user brings it back:
the GIELIS look (v0.14 tagged and pushed 2026-09-27, not validated), NAV2 (paused), the validated scenes, the standing list.

**Live step 3 (2026-09-28, DECISIONS §50, AUDIT-live-grid "Step 3") — open after the session:** the user's look at the A/B
(NEXT-SESSION-PROMPT.md) and any default it decides · v0.16 + step 3 are local only (not pushed / deployed; retinarave.com serves
v0.15) · the section test's features (synapse per-beat `F`), recall (the 0.35 gate / a soft `predKickP`), section annotations for a
second track · the headless `file://` demo: the ears hear no onsets (`kickAge` 99, before step 3 too) · step 4 (build detector v2).

**GIELIS (id 10, "slot 11", no digit key: `n` / `&scene=10`; forced-only; it bid for part of 2026-10-04, DECISIONS §93 + addendum)** — the superformula nest the user asked for on
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
  on 2026-09-26). It stays as it is: id 9 (key `9` then `n`); no bid (§93 addendum, 2026-10-04). Do not retune its look unasked. Still owed, not urgent: the
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

**2026-09-29, live step 5 (the queue):** `tools/parity.js fake` reports `nav.*` mismatches (nav.c 2.09, nav.lg 7.85 …) since
`22eb969` — NAV reads `buildLive` / `dropLiveEvt` by default and the fake timeline carries v3's builds and drops, none of the live
detector's, so NAV no longer parks or exits where cardioid3's NAV does (§54 addendum 2's f840 md5 move). The 72 MS fields are still
0 diff; the verdict line is red for the NAV rows alone (identical on the e23db09 tree). Either exempt NAV's rows on the fake path
or give the fake timeline a live-detector drop — a tool decision, not a scene one. Also open from step 5: the bar line's truth on
WhoLikesToParty (`nextBarIn` F 0.30 page / 0.00 node) and CyborgNinja's clock (`nextBeatIn` F 0.01) — the queue inherits both.

**2026-09-30, §62 (`key` = the tonic):** two items the fix left standing, both measured. **Item 1 is CLOSED by DECISIONS §84**
(2026-10-02: `keyConf` is the ears' `tonicConf` = the KS tonic margin × the bass's agreement; `&kc=0` is the A/B the item asked for);
**item 2 is half closed** — Malicious is C MINOR by an independent ruler (KEY-PLAN §1; the ears had it) and CyborgNinja is ambiguous
in the audio itself; both still wait for the user's ear (the cues at the end of this file).
1. ~~**`keyConf` is the clarity of a read that is no longer published.**~~ (CLOSED by §84) `key` / `mode` are the ears' tonic; `keyConf`
   is still synapse's `keyClar` = `clamp01((best r − .35)/.45)` on synapse's own chroma. The same formula on the EARS'
   chroma was built, measured over 20–100 s of the five tracks (p50 **0.548** SeeYouDrop / 0.648 CyborgNinja / 0.767
   Malicious / 0.976 WhoLikesToParty / 1.000 Vienna) and reverted: `keycolour.js` gates at `KEYC1` 0.3, so every one
   of those opens the gate to 1.0 and the hue stops being `LOOK.mood` slid part of the way toward the key and becomes
   the key's own hue outright, on all five scenes that read `mkAnchor()`. SeeYouDrop's gate would go **0.27 → 1.00**.
   The consequence of holding it: the hue only moved −0.0197 / −0.0045 / −0.0153 turns at TORUS2 f2400 / f3600 / f4800
   on SeeYouDrop, so the *right* key is now barely more visible than the wrong one was. **This wants the user's A/B**
   (`&key=<k>` pins the key on DUST and GIELIS; the gate itself has no switch yet — one would be the first step).
2. **CyborgNinja and Malicious are still wrong, and so may the truth be.** The ears read G#M for C#m (+7) and Cm for
   GM (+5). On both, the TRUTH's own Krumhansl–Kessler margin is nearly nothing — CyborgNinja C#m .521 / C#M .430
   (conf .174), Malicious GM .639 / CM .537 / Gm .529 / Cm .516 (conf .159, a .10 race over four candidates) — and
   only SeeYouDrop has a human annotation to corroborate it (`SeeYouDrop.sections.json`: the sub loop C#1–A1–F#1–E1 =
   i–VI–iv–III). Before any further tuning of the tonic tracker, those two tracks want a human key, the way
   SeeYouDrop got one; tuning KK against a KK read of the same signal proves nothing.

**2026-09-30, §64 (the hat's trigger quality, and the sub void):** four items, all measured.
1. **The ears' HIGH-class picker publishes swells as hats.** `ears/perc.js` is an HPSS-lite whose harmonic part is a
   RUNNING MEDIAN of each band's dB envelope, and a median lags a swell — so the leading edge of a pad, an arp or a
   reverb tail rises above it and is released as a percussive onset. `hatEvt`'s precision against the truth's `high`
   onsets (±50 ms, `&map=0`): **0.56 Vienna 20–110 · 0.71 SeeYouDrop 20–110 · 1.00 CyborgNinja 20–50**. §64 vetoes the
   swell case in DUST's own trigger (`highS` > 1.05 × its 2 s average), but the onsets still go to every other reader —
   `engine/drums` does not use them for the hat, the queue's `predHat*` and the bars store do. A spectral-flatness or a
   per-bin habituation term INSIDE the picker would fix it for everyone; an engine change, not a scene one.
2. **The SNARE's picker has the same shape and is worse.** On Vienna 20–65 s (`drumcheck.py`): `snareEvt` vs the truth's
   `mid` onsets P **0.38** / R 0.75, `snare2` P **0.51** / R 0.84. DUST's snare voice drives the flash ring on the body
   annulus — the loudest of the three voices — so this is the next one to measure. Not touched in §64.
3. **`SUBV_RET` 2 is tuned on one drop.** The sub-void slam's threshold: 1.5 changes nothing on any of the five tracks,
   3 loses Vienna's drop, and Vienna's own ratio is 2.14. One drop tunes a threshold, it does not prove one — another
   track with a sub-return drop would.
4. **Vienna's second drop (106.6693 s) is not detectable causally.** Of 60 candidates × 7 grains × 4 transforms in
   `buildstudy.py`, at PRE 4 and PRE 8 bars, every one gives it a lead of **0 beats**; `hp`'s 5 s mean is 0.000 before
   it, `bassS` 2 s / 32 s bottoms at 0.887, the sub gate is open throughout, and at the drop `bassS` reaches 1.25 × its
   2 s mean and `sub` 1.32 ×. It is a density / texture jump (the double-time layer thickening). Every candidate that
   would arm it also arms on CyborgNinja (0.35–6.71 false arms / min). If the user wants something there it has to come
   from the file map (`&map=1` has it) or a hand annotation.

**2026-10-01, §69 (the snare lane):** §68's first open item below is **CLOSED**, and with it **§66 item 2 and §64
item 2** — `assets/engine/ears/perc.js`'s snare lane is now the MEAN of the 150-600 and 150-2500 Hz bands' RISE
over their own 85 ms local means, against an absolute 3.75 dB floor, refractory 75 ms, lag 10 ms (DECISIONS §69,
`docs/AUDIT-drums.md` "§69"). `snareEvt` mean F over the five tracks **0.528 -> 0.646** against the truth's `mid`
and **0.482 -> 0.624** against the new `<T>.snare.json` grid reference — 10 of 10 rows up or flat — with Vienna
**P 0.24 -> 0.54** (page 0.29 -> **0.77**) and its rim/clap list **P 0.37 -> 0.84 / F 0.48 -> 0.68 at +2 ms**. Lag
unchanged (mean +0.4 ms). **CyborgNinja's recall is 0.59 -> 0.57, not the 0.51 §68 previewed, and the 101 `mid`
onsets it drops are HATS** (median two-band rise 2.46 dB against the kept 7.56; 21 % on the snare reference against
92 %), so nothing was added to buy them back. The map, the LOW lane, the HAT and the live build / drop detector are
byte-identical; the bar store and the predicted-snare queue improve on 4-5 of 5; **§59's clock tables moved** —
CyborgNinja's PCM lock **17.9 -> 3.4 s** and Vienna's |lag| p90 82 -> 67 ms, against SeeYouDrop's lock 9.2 -> 12.0 s
and **Malicious's bias +23 -> +30 ms** (its bias-removed steadiness unchanged). **Three things it leaves open:**
- ~~**`snare2` did NOT move** and is now the loose half of DUST's union~~ **(ANSWERED by §70, below: the scenes
  moved instead of the level. `snare2` stays synapse's and stays published — DUST and TORUS2 now fire on the lane
  itself, so no new `snare` / `snareFl` stream out of the ears was needed.)**
- ~~**DUST's snare voice could take the lane ALONE**~~ **(DONE in §70, below, with a size: the "not another number"
  it needed turned out to be one — `snareAmp`.)**
- ~~**Malicious's PCM clock bias**~~ **(ANSWERED by §71: it is the TRUTH GRID, and the clock is not changed)** — see
  the new item below.

**2026-10-01, §70 (the scenes' snare onto the lane, and a hit's SIZE):** §69's first two open items above are
**CLOSED**. The ears publish `kickAmp` / `snareAmp` = `clamp01(rise_dB / SPAN)` with SPAN 16 / 12 dB — each lane's
MEDIAN TRACK's p95 rise at a true hit, rounded, FLOOR 0 so both lanes' thresholds map to the same 0.31 "only just
fired" size (DECISIONS §70, commits `074061b` / `e2c950a` / `7d679d2`). **DUST's flash ring and TORUS2's snare wave
now fire on `snareEvt` ALONE and take their size from `snareAmp`**; `snare2` stays published, routable and the floor
under DUST's envelope. DUST on Vienna 24-60 s: **3.17 -> 1.36 flashes/s at P 0.45 -> 0.80** against a groove of
1.94, the median gap 267 -> **667 ms** (the half note at 90 BPM), **11 % -> 0 %** of flashes floor-sized, lumC lift
per flash +13.9 -> **+26.1**; SeeYouDrop F 0.72 -> 0.73 with 72 % -> **0 %** at the floor and CyborgNinja F 0.68 ->
**0.87** — both controls better, which is the test §64's hat had to fail. TORUS2 on **SeeYouDrop 20-110 s: 17
launches in 90 s -> 349** (F 0.06 -> **0.73**) — `snare2`'s edge needed 0.45 and its mean at a snare line there is
0.125, so the channel was dead on the user's own reference track; CyborgNinja F 0.53 -> **0.87**, Vienna 0.46 ->
**0.66**, luminance within 2-4 % everywhere. Cost flat (interleaved bench ratios 0.538 -> 0.541 and 0.577 -> 0.567).
**Five things it leaves open:**
1. ~~**`dsp.js`'s `Quantile(q)` settles on the (1 - q) quantile**~~ — **CLOSED by DECISIONS §73** (2026-10-01,
   commits `4264bce` / `dee2190`). The two Robbins-Monro weights were swapped; `Quantile(0.95)` on U(0,10) read
   **0.508** against a true p95 of 9.495, and that is why `kickVel` / `snareVel` / `hatVel` saturated (§51's
   "p50 1.0"): they divided the rise by the lane's **p5**. All four readers were re-calibrated with it — `lvl`'s
   `GATE_DB` -34 -> -54, `p95`'s step 0.02 -> 0.2, `sub.js` `P90_STEP` x10 with `GATE_ON` / `GATE_OFF` /8, and
   `rollP90`'s step x10 — and the five-track tables HELD: every P / R / F in the 60-row drum table identical,
   §64's build table identical, every v3 clock row identical (the PCM clock's beat F 0.903 -> 0.915 on
   SeeYouDrop), the offline map byte-identical. `*Vel` now spreads p10 0.24-0.30 / p50 0.51-0.63 with **12-14 %**
   of true hits at the ceiling instead of 43-92 %, so it CAN be tuned against — but it is a per-track RANK (its
   per-track p95 is 1.000 on all five tracks) and `kickAmp` / `snareAmp` remain the absolute SIZE a scene reads.
   `lpSweep`, which read a p50 of exactly 0.000 on all five tracks, is a live channel for the first time —
   **and §74 found it is a RELATIVE measure whose middle means nothing**: its p50 over the five whole tracks is
   0.35 / 0.55 / 0.73 / 0.41 / 0.35 and it is over 0.5 on 27-74 % of their frames, while a real closing filter
   reads 0.94-0.98 (only SeeYouDrop's outro, 0.956 against 0.371 for the body; on CyborgNinja, WhoLikesToParty
   and Malicious the last 20 s read LOWER than the body). Its one reader anywhere, CHLADNI's fog, now takes it
   through `smoothstep(0.80, 0.97, ·)` eased at 0.5 s; **nothing about that channel is validated by an eye.**
2. ~~**CHLADNI's plate ring still reads `snareVel`**~~ — **CLOSED by DECISIONS §74** (2026-10-01, commits
   `64a9b19` / `c8a8d6a`), and the reason to move turned out not to be the brightness at all. The ring's
   BRIGHTEST frame is the event frame (`exp(-snareAge/0.16)` = 1 there) and that is exactly where a `*Vel` is one
   hit stale, so the flash's size correlated with the hit it belonged to at **-0.011 / 0.305 / -0.027 / 0.073**
   on SeeYouDrop / CyborgNinja / Vienna / Malicious in v0.25 — nothing at all on two of them — and 0.18-0.45
   after §73. On `snareAmp` it is **0.997-1.000**. `SNAMP` is UNCHANGED at 0.55: brightness is linear in the
   field so there is no square to undo, and the loudest hits on the two reference tracks still reach the
   validated ceiling (snF p95 0.510 / 0.550) while the quiet masters' loudest read 0.41 / 0.35, which is §70's
   own sentence in this channel. The median flash in the body annulus is 4-27 % smaller (lumM lift p50 +41.3 ->
   +39.7 CyborgNinja, +27.0 -> +19.8 SeeYouDrop). Still wants the user's A/B, now as a look and not a question.
3. **`kickAmp` is published and DUST's and TORUS2's kick consumers still have not moved** (the §70 brief forbade
   it; CHLADNI's did, in §74). DUST's kick voice and TORUS2's kick wave still size themselves from `kick2`, whose
   strength RANK §51 built precisely because `kickVel` saturated. Rank vs `kickAmp` is still not measured there —
   but §74 adds an argument that applies to any one-shot armed on an event: a `*Vel` read ON the event frame is
   the PREVIOUS hit's velocity (correlation **0.172** with the hit it arms, against `kickAmp`'s **0.986**), so a
   rank is only usable a frame or two late.
4. **The fake timeline carries no percussion EVENTS**, so `#test` cannot exercise an event-driven channel at all:
   `snareEvt` false, `snareAge` 99, `snareAmp` 0 (read off the page at f840), while `snare2` is synapse's own fake
   level. That is why **4 of the 24 md5 lines moved** (DUST s1 and TORUS2 s3, f360 + f840) and the other 20 did
   not — both scenes' snare channels are simply silent there, as **CHLADNI's has been since v0.15** for the same
   reason. Giving `sources/fake.js` the ears' event channels would move CHLADNI's lines too: a tools decision, like
   the `parity.js` NAV rows above, not a scene one.
5. **Vienna's recall** — DUST 0.73 -> 0.56 and TORUS2 0.41 -> 0.56 against a truth beat grid still marked
   `provisional`. One down, one up, on the track the user watches most. The eye decides.

**2026-10-02, §81 (`tension`'s normaliser: the p10 / p98 of `rough` over the last 30 s — `53c2ae9`):** the user has NOT seen it (no
audible run; the A/B watch-list is at the end of §82, `&rough=0` the exact v0.28). Open: (1) **CyborgNinja is the one track whose
ordinary moment moved** (0.32 → 0.26: DUST's cloud jitters less, the mood saturates ~8 % more, TORUS2's rim 3 % dimmer, the whole
track) — if the eye prefers the old, the knob is `ROUGHK.HI` (0.98; p95 moves SeeYouDrop and Vienna up by the same amount instead)
or `&rough=0`; (2) the plan's gate "the groove ≤ 0.3" is not met and cannot be by a quantile pair that keeps the medians — if the
user wants the groove LOW rather than UNCHANGED, that is a different design (a p40 floor, or the 3-point map `sim.mjs` carries that
pins the median to 0.3) and a look change on every scene; (3) `tension`'s direction across SeeYouDrop's drop 1 is the measure's
(the void is rougher than the drop) — a scene wanting the build-to-drop shape reads `buildLive` (§54) / `tongueAmbig` (§79), and
every reader of `tension` today reads it as roughness, which is right; (4) the prior pair 0.010 / 0.050 is the five test tracks' —
a track whose roughness lives elsewhere reads against it for its first 5 s only; (5) the mood hue's ORBIT (`look.js`, speed
0.10 · intensity²) lands on a different seat of the wheel after a minute of slightly different `tension` (SeeYouDrop DUST 0.26 turns
p95 against the before) — not a mapping change, but the before / after screenshots of a scene with a free mood hue will not match
pixel for pixel on real music.

**2026-10-02, §82 (`modeShade` — the chord quality of the bass's degree in the key; the per-bar pull on the key hue behind
`&shade=1` — `55da70e` + `2efc3fd`):** the pull is OFF by default and the user has NOT seen it (no audible run; the headline is
TORUS2 on SeeYouDrop 0:13–0:26 with `&shade=1`). Open: (1) **`SHADE.ON` 0.25 is coarse**: on the A bar of the walk it crosses the cosine
palette's teal → orange band (HSV hue 0.446 → 0.089) while `&shade=0.1` barely moves it (→ 0.432) — the eye picks the K, and the band
structure of `palM` may want the pull expressed in the palette's own terms; (2) the pull is asymmetric in a minor key by
construction (the key's hue already sits at the COOL pull, so i / iv / v bars move 0.008 of a turn and III / VI / VII bars the full
K) — a major key is the mirror; (3) the field is exactly as good as the key under it: **CyborgNinja (G for C♯) and Malicious (C for
G) read wrong degrees** — §62's open `tonicConf` item is the lever, not this one; (4) the ease is the anchor's 0.7 s on top of the
field's third of a bar, so a bar's shade lands ~1–1.5 s in — right for a two-bar walk, late for Vienna's one-beat III; `SHADEK.TAU_BARS`
and `HUETC` are the knobs; (5) in file mode the sub is the map's centred YIN and in stream mode the causal ears' — the walk reads
the same on both (8 / 8), the per-track distributions were taken on the map's; (6) the harmonic-minor V (a bass on the raised 7th
or a major V) is read as the natural v / 0 — on the five tracks it never occurs; a track that leans on V–i would want the table
to say so; (7) `keyConf` still gates the hue (the §62 note): on SeeYouDrop's drops `keyConf` is 0.10, so the pull — like the key's
own hue — is off there whatever the bass does.

**2026-10-02, §79 (TORUS2's fog on the tongues — `1f77931`):** the user has NOT seen it (no audible run; the A/B watch-list is in
§79, Vienna 1:05–1:25 then 1:25.3 the headline, `&tongues=0` the exact before). Open: (1) **the mist starts at 1:10, the user's
dream at 1:05** — `tongueAmbig` is a 16-beat trailing window and reads 0.75 only at 1:09; a leading read would be the engine's
(a shorter window, or the ambiguity's own rise as §77 reads it) and nothing in the scene can bring it earlier without hazing
SeeYouDrop's intro (0.686, 0.064 under the dead zone); (2) the look's five numbers (`DEEP` 0.30, `SAT` 0.45, `VEIL` 0.045, `BLOOM`
0.15, `FOGK` 0.6) were set by one eye on one frame (Vienna 80 s) after the first cut dimmed the whole nest to the fog's floor — the
user's remark retunes them, all in `haze.js`; (3) **v3's `dropEvt` fires at 73.3 s on Vienna with no track map — inside the
dream — and not at 85.3**, so TORUS2's collapse-and-bloom lands mid-dream under the mist (pre-existing, measured here for the
first time; the fog reads `dropLiveEvt`, the collapse still reads `dropEvt` — moving it is a look change the user has not asked
for); (4) after a slam the fog is held off for up to 16 beats — a false `dropLiveEvt` inside a real dream would clear it for a bar;
(5) a track whose intro locks nothing for 20 s (SeeYouDrop reads 0.64–0.67 over 20–24 s) sits 0.06 under the dead zone — the
next such intro may haze faintly, which may be right.

**2026-10-01, §78 (DUST's accent on the tongue ladder — `c849b38`):** the user has NOT seen it (no audible run; the A/B
watch-list is in §78). Open: (1) ~~the hat voice's gain is the second lever the brief allowed and is untouched~~ **done 2026-10-02,
§80 (`0da9fb2`): the hit's gain 1 + 0.5·acc on the same accent, `&hatacc=0` the exact before — the user has NOT seen it**; (2) `ACC.K` 0.25 / `LO` 0.15 / `HI` 0.45 are set from
five tracks' rise statistics (CyborgNinja's max 0.13 under the knee by 0.02) — a track with a steady 16th layer whose depth
breathes by 0.2 would accent on the breathing; (3) Vienna's 0:27–0:40 accent is 0.26–0.37 (a 7–9 % step), under what an eye
may notice — raise `ACC.K` or lower `LO` only on the user's word; (4) the §76 cold-normaliser line changed every depth by
≤ 0.014 and the 1:1 width by one bank step: the §76 table in DECISIONS carries the first run's numbers and the re-taken
ones are in `tools/work/tongues/node-table.md` (gitignored) — within the noise, named so the next reader is not surprised.

**2026-10-02, §80 (DUST's hat voice as the second accent lever — `0da9fb2`):** the user has NOT seen it (no audible run; the A/B
watch-list is in §80, Vienna 1:25–1:43 the headline, `&hatacc=0` the exact before). Open: (1) `HATACC.K` 0.5 was chosen on one
window (Vienna 1:30–1:38) by a noise criterion (the rim lift per hit ≥ 2× |ΔlumR|) — the eye may want 0.25 (a quarter, §78's
own number) or 1.0; the knob is there; (2) the hit's `gain` is wired for the hat only — the kick and the snare voices accept it
and read 1; a kick accent on the 2:1 depth was not asked for and is not measured; (3) SeeYouDrop's returns get the gain on hats
of amp 0.23, so the rim lift there is 0.76 → 0.93 — if the eye wants the returns to sparkle, the floor (0.2) is the lever, not K.

**2026-10-01, §77 (the build detector's ambiguity path — `a761b43`):** Vienna drop 1 now has 8.9 beats of lead on the page
(12.2 in the replay). Open: (1) `AMB_ARM` 0.9 / `AMB_HOLD` 8 are tuned on ONE drop with a 7-beat margin to SeeYouDrop's
outro at 0.9 (18 beats at 0.85) — the next track with a long breakdown that locks nothing will arm, which is the design, and
the next with a 2-bar one will not; (2) the page's lead is bar-quantised and waits for the bass void's re-arm rule (77.1 s)
— an ambiguity arm could be allowed to re-arm without the bass void's bar, worth 0 beats here (the next bar line is 79.4
either way) and untested elsewhere; (3) Vienna's drop 2 stays at 0 beats (§64, §66, §77 all measured it: a texture jump with
no causal precursor in any of energy, sub, bass octave or the tongue ladder).

**2026-10-01, §76 (the Arnold tongues, shadow mode — `de64fa5`):** built on the user's word; the twelve `tongue*` fields are
published and no scene reads one. Open: (1) **the page / node clock gap on CyborgNinja and Malicious** (§59's cold start,
AUDIT-live-grid Step 6 addendum 3) now reaches the tongue fields too — they close their windows on the clock's beats, so on
those two tracks page ≠ node by the clock's own difference (SeeYouDrop / WhoLikesToParty / Vienna agree to 1e-3); the fix is
the clock's, not the bank's. (2) `tongueP` / `tongueQ` rank tongues by WIDTH and the width tie-breaker decides most windows
(a pure 1:1 click train reads 2/1) — a scene wanting "the beat family's winner" should read the depths. (3) the swing field is
measurable (a 0.6 train reads 1.51) and the test set has nothing for it to show (1.00–1.02 on all five). (4) ~~phase 5 of the
plan (TORUS2's fog on `tongueAmbig`) is not in scope and is the one scene read the plan still names~~ **done 2026-10-02, §79
(`1f77931`) — the user has NOT seen it.**

**2026-10-01, §75 (why CHLADNI's shape does not move in the opening):** the user, watching scene 11 in stream mode —
*"opening 10 secs the pitch is changing but the shape isn't?"*, low priority unless it is the engine. **Measured on
all five tracks cold (`WARM=0`), and it is the SCENE on SeeYouDrop and an engine fault on Malicious** (DECISIONS §75,
commits `3186ed9` the `dinfo()` figure columns + `d67890c` the gate's cold start). **The complaint is right and the
engine is right:** SeeYouDrop's first 12.9 s hold **no sub at all** (the 22-70 band is 0.1-0.8 % of 22-600 Hz), the
pitch the user hears move is the **70-110 Hz mid-bass** walking C#2 E2 A2 E2 F#2 E2 C#2 — six changes at 2.25 / 3.25 /
5.25 / 6.00 / 9.50 / 12.75 s — and `sub.js` rejects that layer on purpose, so `subNote` is −1 from 0.77 to 13.02 s and
the scene holds the last figure (its own header says it does, and drop 2's 60 ms ducks are why). **The engine half,
fixed:** the gate's level test cannot say no at a cold start (`Quantile` is a running mean of its first 16 samples, so
`rel` ≡ 1), and the share test was seeded at 1 and re-fed 1 on every silent block — so `subGate` / `subIn` /
`subNote` fired on the FIRST YIN frame of all five tracks (0.167 s). The share now starts at 0 and is held while there
is no low end: 4 false reports removed on Malicious inside its first 0.62 s, 0 frames changed on the other four
tracks, same first open 0.1707 s to the frame, 0 md5 lines, `test_ears.js --cold` 16 pass. **Open:**
- **The frozen figure itself is NOT fixed and was deliberately not touched** (the user's own priority). Two
  candidates, measured, for the user to choose: **(1) an absolute floor on CHLADNI's vote evidence, one constant** —
  `win` is taken outright on the first voted frame, and SeeYouDrop's first vote is worth 0.0014 against the drop's
  0.096, so a floor near 0.01 refuses it and leaves the plate on the home figure (1,2) at interval 0 instead of on an
  arbitrary fifth, figure (1,3), for 10.8 s. It makes the held shape honest; it does not make it move. **(2) Let the
  figure follow the bass where the bass LIVES** — the scene already knows (`bassReg` reads 1.000 through that intro);
  what is missing is a PITCH for the 60-200 Hz layer, which the ears do not publish. Offline the intro's intervals to
  C# are 0, 3, 8, 3, 5, 3, 0 → figures (1,2) (1,5) (2,5) (2,3), four shapes distinct by eye on the six bar lines the
  user heard. (1) is a constant; (2) is a new engine field and a second pitch channel in a scene whose premise is one
  element, one channel.
- **CHLADNI's TONIC LATCH does not engage for 2.7-16.4 s from cold** (`TONMIN` 0.60 of evidence accumulated at
  `max(0.05, tonicConf)` per second, and `tonicConf` is 0.02-0.27 through these openings): measured 2.67 s
  SeeYouDrop, 16.42 s CyborgNinja, **never inside 20 s** Malicious, 11.62 s WhoLikesToParty, 4.98 s Vienna. Until it
  engages `E.tonic` tracks the RAW `MS.tonic`, which wobbles **11 times in 12 s** on CyborgNinja and **8 times in
  6.5 s** on WhoLikesToParty — and every change re-maps every figure at once, which is the exact churn the latch
  exists to stop. The latch is right; its warm-up is not. A confidence-weighted seed (take the first tonic outright
  and defend it with `TONMARG`) is the obvious lever and was not measured.
- **The level half of the sub gate is structurally blind at a cold start** and nothing above fixes that. `rel` is
  `ms / q90` and `Quantile` is a running mean for its first 16 pushes, so the level test passes at ANY absolute level
  for the first 128 ms — and the first frame's own `ms` is an RMS over the 171 ms pre-roll (`rmsAcc` accumulates from
  input sample 0 while `frame()` first runs at `need`), where every later frame covers one 7.3 ms hop. On SeeYouDrop
  that is how YIN came to read a confident A1 off the −45 dB tail of a real −3.8 dB opening hit. Fixing it means
  either an absolute floor (against the ears' AGC-proof design) or a longer, differently seeded quantile shared with
  §73's other three readers — neither was in this session's scope.

**2026-10-01, §74 (CHLADNI's kick, snare and fog):** §70's open items 2 (above) and the CHLADNI half of §73's 1 and 2
are **CLOSED** (DECISIONS §74, commits `64a9b19` the `dinfo()` ruler + `c8a8d6a` the leans). **What §73 alone had done
to CHLADNI, which no one had measured:** the throw's height is `(v·w)²/2g` in the size fed to `uLeap.y`, so an honest
`kickVel` p50 of 0.63 threw **0.40x** as high as the validated look, not 0.63x — the median kick's throw more than
halved on three of four tracks (SeeYouDrop 1.00 -> 0.40 of full, Malicious 1.00 -> 0.48, Vienna 0.86 -> 0.55) — and a
raw `lpSweep` put a **permanent** fog on the plate (CyborgNinja fog p50 0.45 for the whole track, the plate's centre
150 -> 132). **The leans:** the kick's size is `kickAmp` floored at the lane's own 0.3125 and goes in as the throw's
ENERGY (`v = sqrt(size)`, so the HEIGHT is linear in the field and a size of 1 is byte-for-byte the validated v0.15
throw); the ring is `snareAmp` with `SNAMP` unchanged; the fog is `smoothstep(0.80, 0.97, lpSweep)` eased at 0.5 s.
`feats` / `help.feats` moved with the reads. **Measured:** the loud hits keep the validated throw on all four tracks
and the median reaches 0.40-0.56 of it; the per-kick lift is ABOVE v0.25 on both reference tracks (+54.9 -> +58.1 lumC
SeeYouDrop); Vienna's loudest throws 57 % of full where the RAW absolute reading left it at **32 %** (lumC lift per
kick 92 -> 47), which is the row that rejected it. s11's two fake-timeline md5 lines are **byte-identical across
v0.25, §73 and §74** (recorded for the first time: `8a930b26…` / `5a5c795a…`) because `#test` cannot exercise any of
the three channels. Continuity monitor on scene 11, SeeYouDrop 70 s: **4206 frames, 0 violations**, worst undeclared
jump 0.0289 of 0.06. Cost flat (interleaved ratio median 0.856 -> 0.837, eight pairs each side, spreads overlapping).
`index.js` 479 -> **428** lines with `cam.js` and `ears.js` split out (it had passed the hard 500 cap). **Open:**
- **The fog is tuned to five tracks' distributions and to no eye.** On the four A/B tracks the only place it does
  anything is **SeeYouDrop's last 20 s** — the A/B window 20-110 s never reaches it.
- **The hat's ripple is stale on its own event frame** and there is nothing to move it to: `hatVel` at `hatAge` 0 is
  the previous hat's rank and there is no `hatAmp` (§70 — the hat is the one class on the HPSS-lite flux, no dB rise).
  Either the hat lane grows a rise in dB (engine) or the depth is read a frame or two late (scene).
- **The plate's standing brightness fell and stays down** (SeeYouDrop lumC p50 185 -> 169 with the fog off entirely):
  grading the throw means less sand in the air at any moment. The lever is `LEAPK` / `SANDB`, not the field.
- **Vienna and Malicious now read softer than SeeYouDrop and CyborgNinja in BOTH hit channels** (loudest throw 57 % /
  79 % of full, loudest ring 0.41 / 0.35 against 0.51 / 0.55). That is §70's design showing for the first time on this
  scene; if the user reads it as weakness the per-track normaliser is the lever and the call is theirs.

**2026-10-01, §68 (the low lane):** item 1 below is **CLOSED** — `assets/engine/ears/perc.js`'s low lane is now a
60-150 Hz band graded on its RISE over a short local baseline against an absolute 5 dB floor (commit `fbc57ae`,
DECISIONS §68, `docs/AUDIT-drums.md` "§68"). Vienna `kick2` F **0.19 -> 0.42** against the kick truth (P 0.18 ->
0.56) and DUST's kick voice **P 0.11 / R 0.14 -> P 0.72 / R 0.68** at 1.50 fires/s against the music's 1.58; all
four controls up as well, lag unchanged, the map and §59's clock tables unmoved, 0 md5 lines. The §66 text below is
kept as the diagnosis. **Two things it leaves open:**
- **The SNARE / rim lane is the same shape, measured, and deliberately NOT built** (the §68 brief forbade it). The
  same rise on the EXISTING 150-2500 Hz band (`B_SNARE`, no new filter) against the truth's `mid` onsets: mean F over
  the five tracks **0.528 -> 0.633** at a 3.5-4.5 dB floor — SeeYouDrop 0.58 -> **0.70**, WhoLikesToParty 0.70 ->
  **0.78**, Malicious 0.29 -> 0.37, **Vienna P 0.22 -> 0.76 / F 0.34 -> 0.66** — and on Vienna's own rim/clap list
  (§66's `clap-ref-rise.json`) the rise on 150-600 Hz reads **P 0.83 / F 0.67 at +2 ms** against the current lane's
  **P 0.37 / F 0.48**. The one number that needs a decision first: **CyborgNinja's recall 0.61 -> 0.51**. Item 2
  below (and §64 open item 2) therefore stands with an engine answer in hand.
- **SeeYouDrop's beater-gated `kick` class lost a little** (`ears` vs `click` P 0.71 -> 0.66 / R 0.57 -> 0.51): its
  kicks are 808-ish with fundamentals under the new 60 Hz edge — §51's "a sub below the 40 Hz band edge" from the
  other side. `kick2` and every scene read the LOW lane, which gained there (F 0.50 -> 0.62 vs the kick truth).

**2026-09-30, §66 (the bounce and the second drop on Vienna):** two items, both measured, both engine-side.
1. ~~**The ears' LOW lane is blind to a MASKED kick**~~ **(CLOSED by §68, above)** — the third picker of the same shape, after §64's HIGH and MID.
   On Vienna 24–60 s, graded against the kick lines the 60–150 Hz band's own RISE puts at **AUC 0.999** (+11.21 dB at a
   kick against +4.56 at the other 16ths), `kick2`'s AUC is **0.316** — *below* chance. It reads **0.031** at a kick and
   **0.130** at a non-kick 16th, and its mean shape from the beat-1 line over 13 bars peaks at **+200 ms** (0.07 →
   0.35). Nothing else low carries it either: `bassS` 0.546, `eS` 0.543, `eM` 0.515, `subGate` 0.500; only `lvl` does
   (0.925), and that is the beat grid in disguise. The cause is specific: Vienna's low end is a loud continuous 38–46 Hz
   808 drone (the sub band has **no pulse at all** — a 7 dB span over all 16 slots of the bar) with a soft thud above
   it, so a lane that reads a LEVEL over a band wide enough to include the drone cannot see the thud. DUST's kick voice
   — the shove on the low grains, the CENTRE of the picture — therefore fires **2.03 /s at P 0.21 / R 0.27**, with its
   biggest slot bins on the 16th and the third 16th AFTER the beat, and the two real kicks getting the smallest shoves
   in the window. **No scene-side gate can rescue a signal with AUC 0.316**, which §66 proved by trying: the remedy is a
   60–150 Hz lane kept SEPARATE from the sub and graded on its RISE, inside the picker, where every reader benefits.
2. **§64's swell veto does not transfer to the SNARE** (§64 open item 2, now with the scene-side number). On Vienna
   24–60 s the snare voice fires **4.81 /s** against a truth `mid` of 1.81 (**P 0.35**, 39 % at the floor, gap p50
   167 ms so tc 0.30 s leaves **57 %** of each hit on the body annulus). `midS` / its own 2 s EMA separates its matched
   from its unmatched fires at **AUC 0.615** — the hat's was 0.93 — and every ratio from 1.03 to 1.18 holds precision at
   **0.34–0.36** while taking recall **0.92 → 0.83**. The snare's flash ring is the loudest of DUST's three voices, so
   this is the one that is still wrong on the user's own track.

**2026-10-01, §71 (Malicious's +30 ms clock bias) — ANSWERED, and the engine was NOT changed.** §69's one losing clock
row is the **truth grid's own annotation offset**, not the clock. The PCM clock's line is the β-weighted centre of its
phase measurements, and on Malicious **all three** ears classes sit late together against the grid (kick +21.4, snare
+31.1, hat +13.8 ms β-weighted; the "all" column +24.2 predicts the measured +30 within 6 ms, as it does on all five
tracks) — a common mode, so no class weighting can remove it. Four independent rulers put the grid's lines ~20 ms
BEFORE the music: the truth tool's own offline `mid` list sits at **+23.3 ms** (p25 +23.0 / p75 +23.6 — a near-delta)
where the other four tracks read within ±7; a zero-phase `filtfilt` attack measurement finds **every** band from 25 Hz
to 12 kHz late (+11.5 … +22.9 ms) where the controls straddle the line; `trackmap.py anchor_grid`'s own 40–150 Hz rule
as a continuous scan reads only **0.53** of the best line's energy at the grid's own line in 150–800 Hz (the only
reading under 0.82 in the set); and the provenance — `if dpres > 0.06: beats = bdp` fires on its **89.7 ms** DP
residual, so Malicious's `beats` are the raw Ellis DP tracker's and the kick-anchor branch is skipped entirely, where
the other four grids each have an anchor, a drift fit or a hand. Its kicks could not have anchored it either
(eighth-lattice resultant **0.134** against `ANCHOR_R` 0.5). With the ~23 ms off, the ears' lanes there are ordinary
(kick +0.0 / snare +8.2 / hat +0.0 ms against their own bands' attacks) and the clock reads +7 ms in node, −4 on the
page. All three candidate fixes were measured by knob and all three make Malicious WORSE (+36 / +37 / +39, within ±30
down to 33 / 29 / 24 %) while giving back CyborgNinja's lock (3.4 → 17.1 s) and Vienna's p90 (67 → 320+ ms).
**Three things it leaves open:**
- ~~**Malicious's truth grid itself, and it is the real item.**~~ **(DONE in §72, below: re-phased +23.22 ms, three
  rulers plus a 16-beat hand pass, `bpm_grid.hand` written, the clock +30 → +7 ms node / +19 → −4 ms page.)**
- ~~**`trackmap.py` converts frame indices with `index / fps`**~~ **(ANSWERED by §72, below: that IS the whole bias, and
  it reached exactly one shipping grid — the `dpres > 0.06` DP branch. `refit_grid`'s phase is deliberately left in
  frame-index units; adding `t0` there moves all four validated grids 17–25 ms off their own music.)**
- **SeeYouDrop's PCM lock 9.2 → 12.0 s** (§69's other losing row) is untouched and still open, as is the ~11 ms
  page/node gap on Malicious's clock (recorded in `AUDIT-live-grid` Step 6 addendum 3).

**2026-10-01, §72 (Malicious's truth grid) — DONE; §71's items 1 and 2 are the SAME item and both close.**
`trackmap.py`'s `dp_beats()` returns FRAME-INDEX times (`index / fps`) and the `dpres > 0.06` branch wrote them out as
the beat list, so such a grid sits `t0 = 1024/44100 = 23.2200 ms` BEFORE the audio. Malicious's `beats` are exact
multiples of the hop (residual 0.0025 of one) where the other four grids are sub-hop refits, kick anchors or hands —
**one grid of five was on that branch**, and its own `mid` list read the deficit back as a near-delta at +23.3 ms.
Fixed in that branch alone (`beats = bdp + t2[0]`): adding `t0` globally moves every validated grid 17–25 ms OFF its own
attacks, because `refit_grid`'s own lag cancels it. Four rulers agree on the correction — the tool's own lists **+23.3**,
a zero-phase band-profile shift scan **+21.0**, the ears' lanes **+18.1**, and a **16-beat hand pass at sample
resolution +21.0 / +20.7 / +26.4** (each minus the same estimator on the four validated grids). The beat LIST is kept:
the track is dead constant at **140.00 BPM** (lattice resultant 0.55 / 0.59 over 222 s, so `bpm_grid.bpm` 139.675 is not
its tempo and `bpm_grid.hand.tempo_note` says so), but every linear candidate grades worse against its own attacks than
the DP beats do. **The clock on Malicious: node +30 → +7 ms (50 → 92 % within ±30), page +19 → −4 ms (81 → 94 %, beat
events F 0.916 → 0.980)** — §71 predicted +7 and −4 exactly — with the other four tracks' rows byte-identical. The §68 /
§69 drum references ride the grid's 16th lines, so they were rebuilt and the lanes graded against them rose (ears kick
F 0.16 → 0.20 lag +9 → +3; ears snare F 0.46 → 0.48 lag +14 → +3). `gridcheck.py`'s un-anchored caveat is silent on
Malicious now, and `trackmap.py` carries a hand annotation over on a re-run (the §63 Vienna lesson: `--pcm` can no
longer destroy one). **What this leaves open:**
- **Malicious's BAR line is still not verified** — `downbeat_mod4` = 2 on `downbeat_phase`'s vote alone (the DP branch
  never runs `downbeat_novelty`). Its scores moved [5.031, 4.265, 5.038, 4.502] → [4.032, 3.864, 4.448, 4.278] with the
  shift and beat 2 still wins, by a wider margin — but do not grade `barPos` or phrase on this track.
- **Nobody has LISTENED to the new grid** (no audible run was allowed). Every number is offline and deterministic; the
  16 hand marks and their waveform montages are in `tools/work/v72/`.
- **`bpm_grid.bpm` / `beat` / `bar` are still the median of hop-quantised DP gaps on any DP-branch track** (139.6748
  where the track is 140.00). Inside `gridcheck.py`'s ±1 BPM tolerance, so nothing is mis-graded, but the field is a
  biased estimator and a future pass could fit the period from the onset lattice instead.
- **`downbeat_phase` indexes `int(t * fps)`**, two frames late, which `at_time` documents and step 3.1 left for byte
  compatibility. On a DP-branch grid the beats are now real times, so that sampling is 23 ms late there; it is absorbed
  by the function's own ±1-frame max and it did not change Malicious's winner, but it is still a latent.
- **GIELIS `&still=1` is not shade-blind (§83):** `hooks.still(1)` rests the music-driven uniforms but keycolour's anchor still
  reads `MS.modeShade`, which the fake timeline now mirrors as ±1 per bar — the still md5 pair re-based with the lattice. If the
  pair is meant to be the rest state, the still should pin the shade at 0. Also: the fake's hat has no size (no `hatAmp` exists).

**2026-10-02, §84 (`tonicConf`, `keyConf`'s owner, the held lean — `docs/plans/KEY-PLAN.md`):** built, NOT deployed; the user has not seen it.
- **The user's ear on two keys** (KEY-PLAN §7; `tools/truth/<T>.json` `tonic` untouched until then): **CyborgNinja** — the wobble bass
  under the drop at 0:48: is its centre C♯ (SeeYouDrop's drop bass), and does the lead at 0:48–1:24 feel dark (minor)? Every ruler
  puts the centre on C♯, the YINs hear it swing C–D, the mode is a coin toss; the engine treats the track as "closed gate, mood
  palette" either way (tonicConf 0.01). **Malicious** — the bass under the drop at 2:28 (148.3 s): if it sounds like home the track
  is C minor (`tonic_hand`), §62's "GM" was the map's subdominant miss, and the G sections at 0:54 / 1:21 / 1:49 / 2:18 / 3:11 are the
  fifth. `tools/test_ears.js --keys` already grades Malicious as Cm (expect true) on the plan's measurement — a one-line revert if the
  ear says otherwise.
- **The three residues of the conf, stated in §84:** SeeYouDrop's walk (F♯m 0.31–0.38, open — one twelfth of a turn, same COOL pull);
  WhoLikesToParty stays CLOSED (right p50 0.14: a walking bass in a major key gives no pedal to agree with — the lever is the
  `hooks.key` pin, not the conf); Vienna's dream at 0.24 (75 % open; τ 20 s would hold ~0.3 at a slower close). Also Malicious's first
  C section after the D♯ intro (s3, 54–68 s) reads 0.06: the histogram still remembers D♯ for one τ — open by s4 (0.59).
- **The user's A/B:** `&kc=0` (synapse's keyConf, the v0.29 gate) vs default on TORUS2 / DUST over SeeYouDrop 12–30 s (the grooves
  should land ON C♯m's hue) and CyborgNinja 48–84 s (the mood palette, no G / G♯ hue); the knob if the eye wants the grooves less
  saturated with the key's hue is `KEYC0 / KEYC1` in `math/keycolour.js`.
- **CHLADNI** reads `tonicConf` directly (`chladni/ears.js` `tconf`, its `KEYC` 0.25 fallback threshold): its figure's confidence
  channel now carries §84's scale (0.3–0.7 right, < 0.02 wrong) instead of the mode-clarity one; not re-tuned, the user's eye
  (§75's open items on CHLADNI stand).

**The recorder (`R`, v0.30, DECISIONS §89; the quality pass §92, 2026-10-03) — open:**
- **Closed by §92:** the `q` tier during a take is held (`&recq=`, default 0.75; `off` = the old governor), the encoder at 30 Mb/s
  (`&recbps=`, `&recmime=`), the sidecar inside the webm (one download; the user's three takes had none beside them), `clip.js` without
  a sidecar, ffmpeg installed (the user, 2026-10-03). Still unseen: the user's `q` at a real take (the next take's sidecar has `q0`), and
  whether 0.75 / 30 Mb/s holds 60 fps on the user's loaded desktop — the sidecar's `frames / durationS` says.
- **A fullscreen take on the 5120×1440 screen renders 2560×720** (`gl.js`'s long-edge cap): a 21:9 clip of 720 lines, soft by construction.
  A per-take render size (lift the cap while recording) is a §92 follow-up if the user records fullscreen on that screen.
- **The stop rule's alternative** (a watermark quad in `post.js`, `captureStream` on the WebGL canvas) saves the compositor's ~1.3 ms,
  not the encode: not built, the measurement says the encoder is the cost.
- **The headed receipts** (HARNESS "Recorder"): 30 s tab capture + 30 s file, Chrome + VLC with sound, the watermark by eye, one file per
  stop, the COMMENT tag in VLC's media information.
- **Phones:** no tap target for the recorder (MediaRecorder on mobile Chrome is a different animal; SOCIAL-PLAN §2.1).
- **The offline deterministic render** (`tools/render.js`, SOCIAL-PLAN §2.7) stays deferred on the user's word; the sidecar's
  `scenes[]` + `started` are enough to re-render a stretch later.
- **Two downloads per stop** = one "allow multiple downloads" prompt in Chrome the first time (a zip needs a library).
- **A resize mid-take** (fullscreen) changes the video track's resolution inside one webm; Chrome's VP9 encoder follows it,
  VLC plays it, but a transcode may want `-vf scale` pinned — untested.


**2026-10-02, §85 (MANDALA on the grid — `MANDALA-OVERHAUL-SESSION-PROMPT.md` step 1, `2a5f4af`):** built, NOT deployed; the user has not
read the prompt or seen the scene. Defaults taken without the user's word: one wedge per bar (`STEP = 2π/(4N)`, open question 1) — then
capped at DUST's 2π/32 after the jerk measurement, so at N = 4 the picture lands every two bars; the fold phase `FOLD_K` 1; a phrase
wrap does not re-draw N (the one tune — the control demanded it). Left open:
1. **The downbeat's bigger step lands one beat late in the lifted `spin()`** — the spinner's beat line is `lead(w)` = 0.275 beats before
   the beat, where `barIndex` is still the old bar's, so DOWN's 1.5× is beat 2's step on DUST and on MANDALA alike (the per-beat
   histogram: one beat in four at 1.500, the wrong one). Touching it moves DUST's s1; a section of its own, with DUST's receipts re-run.
2. **`trigger()`'s `ready` is always true for N** (a jump, not a pour): two novel bars in one phrase re-draw twice (SeeYouDrop 101.57 /
   104.45 fired, drew the same N by the hash's 20 % chance). A one-per-phrase damper if the user's eye catches an N flap before drop 2.
3. **The N draw at engine start sets the window's N** (CyborgNinja and Vienna 24–60 read N = 4 for the whole window because the bar
   store called no novel bar after 20 s): the first draw is the fake-seed hash at frame 1, not a musical choice. Fine on the fake and
   on a track from 0 s; the user's stream mode starts cold too.
4. The user's A/B of the grid itself (stream mode, key 3): CyborgNinja 0:20–1:20 is the control — N never changes, the wedge just turns.

**2026-10-02, §86 (MANDALA's voices — step 2):** built, NOT deployed. Defaults taken: the segment flash (open question 2), DUST's kick
call exactly / `kickAmp` traced not read (3). Open: (1) **the body clips to a yellow disc at every loud passage** (v0.29 and after
alike: `pow(acc·3.2, 2.6)·(0.35 + 1.3·uLevel)` at `baseLight` 1 — the base shots at SeeYouDrop 60 s / CyborgNinja 30 s) — pass 2's "the
fold's own dynamic range on eM"; (2) the snare flash is a wedge the annulus ruler under-reads (`lumM` 1.3× on SeeYouDrop) — a wedge
ruler, and the user's eye on whether one lit arm of N reads as a snare; (3) the kick's coverage 0.70 / 0.68 against the §68 kick truth
on SeeYouDrop / Vienna is the union's recall (DUST's too), not the scene's.

**2026-10-02, §87 (MANDALA's tension — step 3):** built, NOT deployed. Default taken: N + 1 (odd N) under tension (open question 4).
Open: (1) **the arm-time receipts** — `tight` is `buildLive` to the digit (0.347 at 52.0 s, 0.716 at 105.6), so "≥ 0.9 by 52.0 / ≥ 0.75
by 102.4" is the detector's reach, not the scene's; if the user wants the fold tighter sooner the knob is §54's `0.4 + 0.15/bar`;
(2) `dropLiveEvt` lands 21 ms after the truth on SeeYouDrop's drop 2 (105.617 vs 105.596) — 1.3 frames, the engine's; (3) Vienna's
dream reads ambiguous from 76.7 s on a 40 s cold start (72.0 on §77's from-0 run) — measured from 0 under §88; (4) the 0.6 body dim is
the one number the user's eye should rule on first (0:40–1:00 on SeeYouDrop: the picture goes to ~40 % before 0:57.6).

**2026-10-02, §88 (MANDALA's accent + key hue — step 4; the pass's last step):** built, NOT deployed, NOT tagged; `accept.sh` run in a
worktree of the step's commit (DECISIONS §88: 202 lines, the one FAIL — `hidden tab back onsets:1` — this session's two orphaned headless
Chromes, onsets:0 ×4 once they were killed; 24/24 md5 = reference, parity fake §83's line, mixs recorded, bundle 171 modules). Default taken: `sp.acc` from the lifted spinner (open question 5).
Open: (1) SeeYouDrop's accent fires at 1.00 on the 16ths arriving with drop 1 (58–61 s) and 0.5–0.6 in the build before it, not only at
the returns — the engine's tongue rise, identical for DUST on this engine; the user's eye says whether the heavier crest at 0:58–1:02
is right; (2) the user's A/B of the whole pass (the watch-list in §88) — a look remark is a retune request; (3) pass 2 (per-bin
habituation of the trap radius, novelty as a new trap, the fold's own dynamic range on `eM` — the yellow clip is the first thing it
should fix).

**2026-10-02, §90 (IBelongHere's three times — DUST's sync at 0:10 / 0:47 / 1:04):** three commits, NOT deployed; the diagnosis
`docs/truth/IBELONGHERE-2026-10-02.md`. **0:10 is NOT fixed and is now a known class:** a drumless sung intro with a dotted-8th
echo locks the comb at 4:3 of the tempo (157.6 at 118) for 3.5 s on evidence the five right cold locks share to the digit —
`CLOCK.SW_Y1` is the knob that was measured and left OFF (0.3 costs Vienna / Malicious / WhoLikesToParty's cold locks 6–20 s).
Open: a cold lock could hold the display at low confidence until the comb's own strength clears 0.3 — scene-side, not clock-side
(`clockConfPcm × min(1, y1 / 0.3)`, the diagnosis's alternative; no scene reads `clockConf` today). **0:47 fixed** (the kick lane's
clock-line rule, `PERCK.lineKick`); its 8th-line variant (`lineSub 2`) is a knob OFF because SeeYouDrop's 808 notes would take the
kick voice (17 % of its kicks). **1:04 fixed to +8 ms** (`HOLD_Y1` / `R_Y1` / `RATE_Y1`); the residual is the rate's drift through a
13 s kick-less passage. **The `SeeYouDrop PCM lock 9.2 → 12.0 s` item above (§69 / §71) MOVED with `RATE_Y1`: 12.4 → 9.6 s** on the
§90 ruler (the first 8 lines within ±30 ms) — not chased, recorded; the same knob costs **Malicious's lock 3.5 → 5.6 s** (its cold
start sits at y1 0.08–0.19, under the 0.15 knee, so the onsets cannot refine the rate until the comb clears) — open, small.
Also open: `test_ears.js` still dies before its key rulers (the native-rate stereo dumps are absent, §86's note); the fix-2 rule
feeds on `clockConfPcm ≥ 0.85`, which reads 0.77–0.80 inside the wrong 0:10 lock — a line kick there would be on the wrong line,
and none fired (the intro has no low onsets on it), but a 4:3 lock in a passage WITH soft kicks would promote onto the wrong lattice.

**2026-10-03, §91 (Share phases 2 + 3 — `releases.json`, `/whats-new`, the landing line; branch `share`, NOT tagged, NOT deployed):**
built for v0.31 (the orchestrator's tag step: bump `package.json` + `assets/core/version.js`, add the v0.31 entry, `npm run build`,
check.js — HARNESS "Release notes"). Open: (1) **the historical clips** — SOCIAL-PLAN §3.3's `tools/record-old.sh` (ffmpeg `x11grab` + the
PulseAudio monitor on `releases/retinarave-vX.html`, v0.15+ headed with the file source, tab capture before) is NOT built; every
`clip` is `null`, so the page carries no embed and no script yet; the poster directory `site/thumbs/whats-new/` does not exist until
the first clip; (2) the 28 backfilled bodies are one sitting's reading of the tag messages + DECISIONS' first paragraphs — the user
reads them once (the three least sure: v0.26 "thresholds measured against the right number" (the Quantile sign, said without the
word), v0.22 (pass 1.5 + 2 + the half beat folded into one entry), v0.6 (the rename + the public launch — nothing a returning visitor
"saw change" on the day)); (3) the `decisions` links point at `github.com/tbkraf08/RetinaRave/blob/main/docs/DECISIONS.md` (the header
on every public file names that URL) — dead for a visitor while the repo is private; (4) `about.html`'s long form has not been read
cold on a phone and a desktop (§4's verify step is the user's, on the deployed page); (5) the card's `about.html` link stays relative
while the new line links `/whats-new` — the dev server now resolves both; (6) SocialMediaManager (the separate repo) is not started.

