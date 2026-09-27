# Fable Session Prompt — Retina Rave v0.13+: NAV2 "bump with the beat", continued (written 2026-09-27, after four passes on SeeYouDrop)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine, native ES
modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; **a push to `main` deploys retinarave.com — never push
without the user's word**). Live is **v0.12.1** (MAXWELL, pushed 2026-09-26). Local `main` is **ahead of origin, unpushed**: v0.13
(`abe9fef`, `ccd0b09`, `8a48e60`, `60d4d99`, then the prompts, the v0.8 jpg housekeeping and the `DROP_GAP` pass on 2026-09-27), all NAV2. `package.json` 0.13.0, `releases/retinarave-v0.13.html`
rebuilt and proven from file:// each pass. This session **continues modifying NAV2 (id 8) in place** — no new scene, no id change, still
forced-only (key `9`, `score()` 0; NAV id 0 stays home and byte-identical) — from the user's next look.

**Read first, in this order:** this file to the end · `docs/AUDIT-v0.13.md` (four sections, one per pass, each with the user's words,
the cause the trace found, the change, the numbers — and "How Green's theorem helps") · DECISIONS §46 + its three addenda · `tools/accept/
v0.13/README.md` · `assets/scenes/nav2/{detect,nav2,exit,green,index,shaders}.js` (every constant is named at the top of its module with
the user's words beside it) · `tools/test_nav2.js` + `tools/test_green.js` · then §39 / `NAV2-SESSION-PROMPT.md` for the v0.8 design
(the ball inside M, the wall = |λ|, the melody's pull, gates by Farey, the drop as the one cut) — v0.13 is retunes on that machinery.

## The user's words, in order (all on `~/Music/RetinaRave/SeeYouDrop.flac`, Ray Volpe, 150 bpm dubstep, through key `9`)

1. *"audit the NAV2 scene with SeeYouDrop.flac; can make modifications; I want the mandelbrot set to bump with the beat. no beat == more of
   a circle (some variation), as the beat happens it spirals in showing the complexity of the mandelbrot set. The edge of the set should
   always be moving with the music. How can Green's theorem help?"*
2. *"25s-1m03s set should be bumping in some way with each beat (as beat evolves the set should come back to a slightly different shape);
   1m04 it starts to get swirly/wobbly; also is a little too bright (detail is getting washed out)"*
3. *"this song is an example of the extreme; 0-13s the high rise up to their max (edge should be bumping on every beat / light oscillating
   off the edge); at 25s it really starts moving the edge on every beat"*
4. *"each beat should make the set close up (different pitches are different shapes); at 1:38 it goes double time -> should be moving
   faster / reacting more; 1:45 -> this is where the highest energy is, should be reacting more"*

The user has **not yet said** whether pass 4 is right. Start by showing `tools/accept/v0.13/montage-nav2-syd-intro2.jpg` (0–60 s) and
`montage-nav2-syd-double.jpg` (92–120 s) and asking for the next look. Times the user gives are **track time**; the harness's D lines
are probe time (≈ track + 2 s in `det13.py`) — replay the window with `nav2-window.py` (`T0=<track s>`) before reasoning.

## Where NAV2 stands (v0.13, four passes)

- **Rest = the circle.** `RHO_REST` 0.30 (`nav2.js`): with no beat and no wind c rests at |λ| 0.3, a quasi-circle the melody still turns.
  v0.8's `RHO_FREE` 0.91 (c on the rim for brightness) is gone; `uRound` (`shaders.js`, rest 0, `ROUND_G` 0.8, the exterior at half)
  pays the brightness instead.
- **The beat is the press** (`detect.js` `bump`): max(kick, hit) over the track's own running peak (`BUMP_PK_TAU` 3 s, floor 0.25) ×
  (`BUMP_E0` 0.5 + 0.5·eS), peak-held, decaying with τ = min(`BUMP_TAU` 0.35, `BUMP_IV` 0.7 × the running hit interval `ival`) —
  double time breathes at 0.14 s. `pulse` = its 2 s ema (the density). `nav2.js`: beat = `BUMP_K` 1·bump + `PULSE_K` 0.4·pulse,
  rhoT = mix(mix(`RHO_REST`, `RHO_BEAT` 0.93 + `RHO_E` 0.04·E, beat), `RHO_CAP` 0.985, wind), `K_R` 10. E = (eS − 0.5)/0.5 (`E_LO`).
- **The beat's note** (`nav2.js` `NOTE_V` 8, `NOTE_MIN` 0.08): on each hit (`D.onset`) the bass note's pitch class (argmax `bchroma`) is
  latched, names the internal angle (k + ½)/12, and c is pulled around the rim to that point at `NOTE_V` × bump while q = 1. Twelve
  pitches, twelve species. The wall still owns the radius.
- **Light off the edge:** `uBump` (rest 0): the exterior halo's reach 1/(1 + e·0.011/(1 + `BUMP_H` 1.5·bump·(1 + E))). `CURL_B` 0.5·bump·(1 + E)
  curls the arms on the beat; `zoom` pumps in (3 + 6·eS) % on the kick.
- **Gates leak** (`GATE_LEAK` 0.3, `GATE_RHO_MIN` 0.72, `GATE_HOLD` 1): held pressure leaks between pulses. On a fixed-note beat in node
  8 gates/min; **on SeeYouDrop's last trace 0 in 80 s** — the note keeps c moving, so it is never held beside a root. The "shape comes
  back different" now comes from the notes. If the user wants the species changes back, that is where to look (a note held for N beats
  could arm a gate; or the note's angle could be snapped to the nearest low-q root so the note itself lands on a gate).
- **The drop** is NAV's one cut, then `EXT_BEATS` 8 outside (3 s at 150 bpm) and home (was NAV's 48-beat peak rule = 20 s of dust;
  1:04 was that). `BUMP_LG` 0.5 pulls the exterior target in on the beat. The spin gains are halved (`SPIN_SW` 0.3, `SPIN_W` 0.25).
  The engine fires `dropEvt` at 58 s **and** at 1:45 on this track (4 s outside each) — 1:45 is the user's "highest energy"; if it
  still under-reacts, the drop event is the suspect, not the gains.
- **Pass 6 (2026-09-27, the user's look at pass 4; addendum 5 / AUDIT §6):** *"the movement is still too subtle"; "the beat causes the
  set to collapse into interesting shapes, then the silence rebounds to the circle (NAV does this ~38-42 s)"; "why do different sounds
  look so similar?"; two frames "too bright"; "do energy gain read against the track's own peak".* The notes are the twelve simplest roots
  (`NOTE_ANG`), the beat presses to the cap (`RHO_BEAT` 0.985) with a peak hold (`BUMP_HOLD` 0.3), the smoulder is the wind's (`PAR_WIND`),
  gates lock under a note (`NOTE_LOCK`), E against the track's own peak (`E_PK_TAU`), the luminance knees (`uLum`) and the dust's dim
  (`uExtG`, `EXT_DIM`, `EXT_ENV` 1.2). `press-sweep.mjs` is the node instrument. **The user has not seen pass 6** — show
  `montage-nav2-syd-groove-p6.jpg` (26–50 s) and `montage-nav2-syd-58-p6.jpg` (the 58 s drop) first.
- **The drop's refractory** (`exit.js` `DROP_GAP` 32 beats, 2026-09-27, addendum 4 / AUDIT §5): a `dropEvt` inside eight bars of NAV2's
  last cut is a hit, not a cut (`N.dropBeat`). Found on Malicious (three engine drops in 14 s of its intro, 18 of 25 s outside); SeeYouDrop's
  two drops (58 s, 1:45, 47 s apart) both stand, s8 md5 unchanged. The 1:45 drop is measured full-strength (`ds` 1.0): NAV2 answers the
  user's "highest energy" with the cut and ~6 s of dust — whether that is "reacting more" is the user's call.
- **Green's ruler** (`green.js`, `hooks.green()`): c's equipotential |φ_c| = 1.06 traced by 7 pull-backs of a big circle through
  ±√(z − c) (256 points, branch continuous in the external angle), then A = ½∮(x dy − y dx), Q = 4πA/L², dA/dt, mean edge speed v.
  0.03 ms. Q = 1 at c = 0 exactly; meaningful in mode INT only. The audit's last section is the user's Green's-theorem answer.

**Last trace (80 s, `det13-syd-final2.txt`):** ρ 0.475 / 0.667 / 0.966 (min / med / max), Q 0.785 / 0.898 / 0.953, v 0.493 med / 0.623 max
(= `V_MAX` on the equipotential) and > 0 on 37/37, eight notes latched, EXT 4 s, spin max 0.47, ms 2.20 (v0.12 2.02), errs []. s8 md5
253b19c4 / 778fb7e2 (twice). Luminance on 46–55 s: centre median 0.08 (v0.12 0.20), rim 0.38 (= v0.12) — the knob is `ROUND_G`.

## The workflow that worked (every pass)

1. **Replay the window the user names:** `OUT=<scratch> T0=<track s> N=<n> [PAUSE=<s>] TAG=<t> python3 tools/accept/v0.13/nav2-window.py
   SeeYouDrop` (a shot + det13's D line every second; `PAUSE` is the no-beat proof), `python3 tools/montage.py <out.jpg> <cols> <shots>`,
   read the montage, tabulate ρ / bump / ival / E / note / Q / v. Name the cause in the numbers before changing a constant.
2. **Change constants, not machinery** where possible; every new number gets the user's words beside it. `node tools/check.js` (0 fail;
   a new MS read needs the `feats` entry + a `help.feats` line; an unread `feats` entry warns), `node tools/test_nav2.js` (the gate test
   runs a kick-per-beat timeline with eS 0.9 — when a press change kills the gate, **sweep in node** as the audit did: edit the constants
   in a loop, run the test, restore; pick the mildest passing point), `node tools/test_green.js`.
3. **Re-prove:** the window again (+ `lum.py` on the same frames when brightness is in question), `python3 tools/accept/v0.13/det13.py
   SeeYouDrop <tag>` (80 s at 2 s), `IDS=8 tools/scene-md5.sh <tag>` **twice** (must agree; re-base `tools/accept/v0.13/scene-md5-v013.txt`),
   `node tools/bundle.js releases/retinarave-v0.13.html` + the file:// proof (`FILE=$PWD/releases/... node tools/cdp.js 'test' '[…{"key":"9"}…]'`
   reading `CARD.SC.logical` 8, `CARD.ERRS []`, `hooks.green().Q`), `npm test`, `test_fdtd`, `test_field`.
4. **Docs:** a new section in `docs/AUDIT-v0.13.md` (the user's words → the cause → the change → a table), a §46 addendum in DECISIONS,
   the accept README, evidence copied into `tools/accept/v0.13/` (montages, window logs, det13 traces). Commit with the numbers in the
   message. **Do not push.** Tag when the user says the look is right.

## Pitfalls met

- **Tab-capture runs are sequential.** `nav2-window.py` / `det13.py` / `audit12.sh` pick the media tab by title; two at once can capture
  each other's tab. `scene-md5.sh` (CLOCK, no capture) may run beside one. Ports: window 8861, det13 8860, md5 8862/8863, release 8864.
- **The engine's `kick` reads 0.1–0.3 on this track's intro** (gated on bass level) — hence the running-peak normalisation. Do not
  read a small bump as a scene fault before checking `kick` / `hit` in the D line.
- **The smoulder is the wash-out:** `par = sstep(0.8, 0.98, ρ)` squared in the shader lights the interior hard above ρ ≈ 0.9; that is why
  the beat is capped at `RHO_BEAT` 0.93 and only the wind reaches `RHO_CAP`. Raising the beat's ceiling brings the brightness back.
- **A period-2 (or any q > 1) set is never round** — Q ≈ 0.65 flat inside a bulb. "No beat = circle" is a cardioid statement.
- **Probe time ≠ track time** (above). **`det13.py` prints only D lines**; a truncated line breaks the JSON — never cap its output.
- `tools/accept/v0.13/__pycache__` must not be committed (`.gitignore` has it now). `arc` left NAV2's `feats` (unread since `EXT_BEATS`).
- v0.8's `nav2-still-md5.txt` identity (`&still=1` = NAV byte-for-byte) no longer holds: c's path differs. `&still=1` still zeroes every
  NAV2-only uniform (`uKoen`, `uCurl`, `uGlow`, `uRound`, `uBump`).

## Open, ranked

1. **The user's next look** at pass 6 (the groove 26–50 s, the 58 s drop, the intro). Then tag v0.13 and, on the user's word, push.
2. **Gates vs notes:** 0 gates on the real track now. Decide with the user whether the species should also change through gates.
3. **1:45:** measured (`nav2-window-syd-145.txt`, `montage-nav2-syd-145.jpg`): a full-strength engine drop (`ds` 1.0), NAV2 outside
   105.9–111.4 s, the interior after it at eS 0.78 (1:33–1:39 read 0.87–0.94). `dropStrength` cannot gate it (1.0 at both drops); the
   options if the user wants the peak inside: no cut above some `away` (the drop as a press to `RHO_CAP`), or E read against the track's
   own energy peak the way the beat is. Ask with the montage.
4. **The other three tracks** re-measured and re-watched under v0.13 (AUDIT §5; `montage-nav2-{cn,wltp}-intro.jpg`, `montage-nav2-mal-
   intro-gap.jpg`): CyborgNinja is a one-note bassline (notes 0 / 1 → a fat near-cusp set, Q median 0.94 — item 2's question in another
   form), WhoLikesToParty fine, Malicious fixed by `DROP_GAP`. The user has not watched any of the three; show the montages.
5. **Cost:** 2.20 ms with the note pull (the wall's `findCycle` probes); the budget is fine, but `nav2.js` is 415 lines (soft cap 350, hard
   500) — the next machinery change should move the note / press block out (a `beat.js` beside `exit.js`, importing `detect.js` only).
6. The NAV2 swap question (§39: NAV2 → id 0 / home) is unchanged and waits for the user; the phase-winding colour variant is still not built.
