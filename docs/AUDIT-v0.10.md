# AUDIT v0.10 — MAXWELL, the four equations that dance (2026-09-26, orchestrator; DECISIONS §42, worker report `docs/workers/maxwell.md`)

**What was asked (the user, verbatim):** *"just plan for now; new scene -> maxwells equations (right now torus2 is my favorite scene)"*
(2026-09-26), one planning answer (*"add 'N' for cycling next scene"*), then: run `MAXWELL-SESSION-PROMPT.md`, no full sweep (only the new
scene), commit and tag v0.10 so it deploys. So: a new scene at id 9, **forced-only** (bid 0, key `n`), no montage gate on the tag. Every
lean is the orchestrator's or the worker's; **the user has not looked.**

## What the eye sees (`tools/accept/v0.10/montage-maxwell.jpg`: house / aba / dnb rows, MAXWELL f360 · f840 left, TORUS2 right)

- A round porthole of field seen face-on. **Concentric rings** of the key's hue and its warm/cool opposite (house: green on magenta;
  aba: blue on amber; dnb: lime on violet) spread from the centre — every one a real wavefront launched by a hit and carried at c by the
  Yee grid, so **the rhythm is the spacing** (`montage-maxwell-worker.jpg` third tile: the syncopated pin's close-far-close-far rings;
  measured 52.4 / 17.8 / 52.3 / 17.8 cells against 52.8 / 17.6 predicted). Where rings meet they **interfere** — the beads and lattice
  pattern on house f840 and dnb f360 are that, not a texture.
- **Closed field lines** of H threaded between the crests in the anchor hue at low alpha (marching-squares contours of the stream function;
  `gap` 0 at every tier; the loose ones only leave the window). Dense where the field is strong, sparse where it is weak, because equal
  levels are equal flux.
- **The medium is the section** (`montage-maxwell-media.jpg`): the lens bends the rings inward, the mirror cavity (aba f840's amber ring)
  traps them in a bright disc with two leaks, the lattice breaks them into a grid of beads, the waveguide runs two rails. **The drop**
  (`montage-maxwell-drop.jpg`): the absorber becomes a mirror, the plane fills corner to corner with a standing pattern that is still there
  two seconds later, where without it the field has died to the charges' own glow.
- **Twelve charges** glow on a ring in their twelve hues on the circle of fifths, lit by chroma (the fake timeline lights none: the ring's
  weights come from `harmAngle` there, as TORUS2's do). The whole plane yaws with the dipole's nudge (a full turn every 16 beats) and
  thumps 5 % on the beat. Against TORUS2 beside it: broader, dimmer bands versus thin bright threads — the bloom is what lights the
  interference; the two share the key hue, the nudge and the thump.

## The real tracks (`tools/accept/v0.10/audit10.sh`, key `9` then `n`, tab capture, 80 s each; `mx-{cn,wltp}-{20,40,60,80}s.jpg`, `montage-maxwell-real.jpg`)

| track | bpm | key | frames | black | long | errs | q at 20/40/60/80 s |
|---|---|---|---|---|---|---|---|
| CyborgNinja | 160.0 | 7m → 8m (keyConf .54 → .94) | 4896 | 0 | 0 | [] | .10 .18 .26 .34 |
| WhoLikesToParty | 116.9 | 11m (keyConf .65–.82) | 4941 | 0 | 1 (2018 ms at t 2.4 s, the capture start, before the key) | [] | .07 .15 .22 .30 |

The hue **turns with the key** on CyborgNinja (green/violet at 7m → pink/green at 8m between 40 and 60 s); WhoLikesToParty holds
amber/teal at 11m. The grid is **coarse** in these shots: q sat at 0–.34 for the whole 80 s, i.e. tier 0 (256×144). v0.8/v0.9's runs
started at q .4–.6. **A/B, same night** (`ab-q-v09-vs-v010.txt`: director only, no key, first 24 s): the **v0.9 tree** collapses the
same way (q .28 → .01 at the capture start, one 984 ms frame at 1.0 s, then +.004/s) and HEAD reads 0 from the first second with a
2014 ms frame at 2.3 s. So the low q is the machine and the capture start tonight, not the scene on screen; the one number that
differs — HEAD's start frame twice as long — is a single sample and is on the watch list (§42 lean 2: the substeps at tier 3; and a
boot cost worth a second sample: nine `init`s, MAXWELL's float targets among them).

**The detector trace** (`det10.py`, `headed-v010.txt`, every 2 s): `hooks.probe()` gap **0 on every sample**, loops 9–147, open 0–11;
`hooks.energy()` 115–867 (rising through the build, falling in the sustain, never NaN); `hooks.train()` reports 2–8 live rings with
spacings that follow the kicks (WLTP's ~28 cells at 117 bpm, CN's ~19–40 at 160 bpm and its broken patterns); the medium walked
`sectionAlt` 0 → 2 (CN), 0 → 1 → 3 → 5 (WLTP) on the section changes; chroma lit ≤ 1 of 12 sectors above .3 (real chroma is sparse — the
`harmAngle` fallback carries the ring, as in v0.9).

## Cost

Worker's protocol (q pinned .95, two pages, seven NAV-interleaved pairs each, cold pair dropped): MAXWELL 1.540 ms / NAV 1.149 → 1.227;
TORUS2 1.139 / 1.193 → 0.984 ⇒ **1.25× TORUS2**, under the ≤ 1.5× gate (early pairs 1.6×, late 1.28×; every pair in `maxwell.md`).
Orchestrator's same-page sanity triple at q .53 (`headed-v010.txt`, last line): MAXWELL 2.12 (cold) 1.37 1.30 · TORUS2 1.20 (cold) .72
.70 · NAV 1.31 1.19 — TORUS2 is under-counted in a page it never drew (HARNESS pitfall), so the worker's number is the verdict. Was
3.2× before the lines were rebuilt every 2–3 frames and the charge loop was bounded by the ring.

## Physics gates (`node tools/test_fdtd.js`, the node twin of the two kernels)

∇·B = 0 to 1e-6 after 500 steps · the Yee energy invariant to 1.2e-14 over 1000 steps (the naive Σ(εEz²+Hx²+Hy²) ripples 10.4 %, its
drift .41 % — the brief's wording was not a leapfrog invariant) · a pulse front at d/c ± 1 cell (speed .4966 vs .5) · the absorber
monotone, zero inside, holds a fifth of the mirrored cavity's energy · Faraday's pass carries no source (structural: a magnetic current
there is a monopole density — the plan's error, DECISIONS §42 item 1). GPU vs twin: 7e-8 on a float32 readback.

## What was proven, what was not

- **Proven:** `check.js` 0 fail (3 soft-cap warnings); `test_fdtd` OK; `param-smoke` 49/0; the full scene-md5 list = v0.9's s0–s8 line for
  line on the skeleton commit (registering id 9 at bid 0 moved nothing), s9 4e26a427 / 57bac88e on the worker's tree and again on the
  merged tree; mixs f0c9d637 unchanged; `n` cycles 1…9 → 0 (and found the v0.8.1 `landing.js mark()` TypeError on keys 8/9, fixed);
  the release bundle from `file://` reaches id 9 by `9` then `n` with ERRS []; the two 80 s real-track runs, 0 black, ERRS [], nonFinite [].
- **Not run, by the user's word:** the `accept.sh` sweep; a Q trace (bid 0 — nothing to trace); a bid.
- **For the user's eye (§42, ranked):** brightness and the porthole's size beside TORUS2; tier 3's four substeps; the mirror's 2.2 s hold;
  the line density and alpha; the carrier's lock under `regularity`; the hit's Ricker envelope; the 1.2 s medium cross-fade; whether it bids.
