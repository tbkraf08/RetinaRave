# Open items outside the v0.15 session (moved out of NEXT-SESSION-PROMPT.md on 2026-09-27)

The user (2026-09-27): *"next session prompt should just be the engine update and new scene (and any offline analysis that might be
needed)"*. Everything the old next-session prompt carried besides that work lives here, unchanged, for when the user brings it back:
the GIELIS look (v0.14 tagged and pushed 2026-09-27, not validated), NAV2 (paused), the validated scenes, the standing list.

**Live step 3 (2026-09-28, DECISIONS §50, AUDIT-live-grid "Step 3") — open after the session:** the user's look at the A/B
(NEXT-SESSION-PROMPT.md) and any default it decides · v0.16 + step 3 are local only (not pushed / deployed; retinarave.com serves
v0.15) · the section test's features (synapse per-beat `F`), recall (the 0.35 gate / a soft `predKickP`), section annotations for a
second track · the headless `file://` demo: the ears hear no onsets (`kickAge` 99, before step 3 too) · step 4 (build detector v2).

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

**2026-09-29, live step 5 (the queue):** `tools/parity.js fake` reports `nav.*` mismatches (nav.c 2.09, nav.lg 7.85 …) since
`22eb969` — NAV reads `buildLive` / `dropLiveEvt` by default and the fake timeline carries v3's builds and drops, none of the live
detector's, so NAV no longer parks or exits where cardioid3's NAV does (§54 addendum 2's f840 md5 move). The 72 MS fields are still
0 diff; the verdict line is red for the NAV rows alone (identical on the e23db09 tree). Either exempt NAV's rows on the fake path
or give the fake timeline a live-detector drop — a tool decision, not a scene one. Also open from step 5: the bar line's truth on
WhoLikesToParty (`nextBarIn` F 0.30 page / 0.00 node) and CyborgNinja's clock (`nextBeatIn` F 0.01) — the queue inherits both.

**2026-09-30, §62 (`key` = the tonic):** two items the fix left standing, both measured.
1. **`keyConf` is the clarity of a read that is no longer published.** `key` / `mode` are the ears' tonic; `keyConf`
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
   `lpSweep`, which read a p50 of exactly 0.000 on all five tracks, is a live channel for the first time.
2. **CHLADNI's plate ring still reads `snareVel`** (`U.snF = 0.55 · clamp(snareVel) · exp(-snareAge/0.16)`). It
   flashed at full brightness on 52-91 % of hits; since §73 fixed the quantile it flashes at a GRADED brightness on
   86-88 % and the ring is no longer a binary. Moving it to `snareAmp` instead takes it to 0.33-0.69 — a BRIGHTNESS
   recalibration of a validated scene's default (`SNAMP` would be re-tuned either way), not a trigger change. The
   worker on priority 3 (`kickAmp` -> CHLADNI) now has three options, not two, and it wants the user's A/B.
3. **`kickAmp` is published and no kick consumer moved** (the §70 brief forbade it). DUST's kick voice and TORUS2's
   kick wave still size themselves from `kick2`, whose strength RANK §51 built precisely because `kickVel`
   saturated. Rank vs `kickAmp` is now a measurable question and is not measured.
4. **The fake timeline carries no percussion EVENTS**, so `#test` cannot exercise an event-driven channel at all:
   `snareEvt` false, `snareAge` 99, `snareAmp` 0 (read off the page at f840), while `snare2` is synapse's own fake
   level. That is why **4 of the 24 md5 lines moved** (DUST s1 and TORUS2 s3, f360 + f840) and the other 20 did
   not — both scenes' snare channels are simply silent there, as **CHLADNI's has been since v0.15** for the same
   reason. Giving `sources/fake.js` the ears' event channels would move CHLADNI's lines too: a tools decision, like
   the `parity.js` NAV rows above, not a scene one.
5. **Vienna's recall** — DUST 0.73 -> 0.56 and TORUS2 0.41 -> 0.56 against a truth beat grid still marked
   `provisional`. One down, one up, on the track the user watches most. The eye decides.

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
