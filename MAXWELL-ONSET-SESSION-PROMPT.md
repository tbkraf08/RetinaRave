# Fable Session Prompt — Retina Rave v0.12: MAXWELL "every sound a wave" (written 2026-09-26, after the v0.11 tag)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine, native ES
modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com). **v0.11 "the wave
remembers its note" is tagged** (`805afc3`, DECISIONS §43, `docs/AUDIT-v0.11.md`, worker report `docs/workers/maxwell-wobble.md`). This
session **modifies MAXWELL (id 9) in place** — no new scene, no id change, still forced-only (bid 0, key `9` then `n`) — and tags **v0.12**.

**The user looked at v0.11 on 2026-09-26 and said (verbatim):**
> it still seems like the waves coming out of the center are at a constant rate -> I'm expecting every sound to generate a wave (and the
> wave color is based on musical note being played) sometimes the music goes double time, doesn't seem like what is being immited from
> middle matches ; also why are there a pattern of small circles in the background?

The orchestrator explained the carrier, the beat-locked fallback ring, the hysteresis detector, the chroma mix and the four media, and
proposed: kill the carrier, launch a pulse on every onset in its note's hue, a fast-retriggering detector, drop the lattice. **The user
answered (verbatim):** "1. no sound -> quiet (ie. wave not generated) 2. what are the media?" and, told what the media are, "follow your
rec" — **drop the photonic lattice, keep the lens and the mirror cavity, decide the waveguide after seeing sound-only ripples in the
cavity.** Those sentences are the spec and outrank every lean below. **Gate:** as v0.10/v0.11 — the user's word; no sweep
(`feedback_sweep_cost`), proof on id 9 only (`feedback_test_scope`), v0.2 look default (`feedback_colour_default`). The NAV2 swap,
POLYTOPE's look and a MAXWELL bid are still not this session.

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` · `MAXWELL-WOBBLE-SESSION-PROMPT.md` (the v0.11 plan) · `docs/DECISIONS.md` §42–§43 ·
`docs/AUDIT-v0.11.md` · `docs/workers/{brief-maxwell-wobble,maxwell-wobble}.md` (the friction log is the trap list) · `docs/CONTRACTS.md`
§0, §1 (§1.4 hooks — a pinning hook must also pin its derived params; §1.16) · `docs/HARNESS.md` ("Headless Chrome", "Bench protocol",
"What to re-prove") · `assets/scenes/maxwell/{index,fdtd,colour,medium,sources,render,probe,help}.js` in full (2 160 lines; `index.js` is
at **498 of the 500-line hard cap** — this session must take lines out of it) · `assets/engine/feats.js` for `onset onsetRate kick snare
hat kickCount flux chroma bchroma presence alive` · `assets/engine/sources/fake.js` (what the `#test` timeline does to `kickCount` and
`onset` — verify, the plan below assumes `kickCount` increments per fake kick) · `tools/accept/v0.11/{README.md,audit11.sh,det11.py}` ·
memory `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_maxwell.md`.

## The diagnosis (the orchestrator read the code on 2026-09-26; the worker verifies before changing anything)

**"Waves at a constant rate."** `sources.js` radiates a continuous **carrier**: all twelve charges (`CHG` × chroma weight, with the
`harmAngle` fallback), the dipole and the sub's standing current (`SUBK`) oscillate at one frequency (`lam` from `centroid`, `WOBA` on its
amplitude) the whole time the music plays. That is the steady train the user sees, and it has nothing to do with any sound. Discrete
launches exist only for three drum bands (`launch()` at `sources.js:175`): kick from the centre, snare from the loudest sector, hat on all
twelve at `HATA` 0.025 — gated by a **hysteresis** edge (`HI` 0.45 after `LO` 0.25) on the engine's decaying impulses, which cannot
re-fire while hits overlap (double time: every other hit is missed). And when no band hit came within 0.9 of a beat, the `beat` event
launches a `FAINT` 0.30 ring at the tempo grid (`sources.js:178`) — a metronome. Nothing in the scene launches on a **note**.

**"The wave colour should be the note."** The colour field (v0.11, `colour.js`) does carry a launch's hue correctly (pinned proof 0.0018
turns), but the carrier is all twelve charges at once weighted by a chroma that is flat on real music, so the field is a mixture of all
twelve hues — the pale cream of the v0.11 montage. Remove the carrier and the launches' hues are what is left.

**"A pattern of small circles."** `medium.js`: `sectionAlt mod 4` picks lens · mirror cavity · **photonic lattice** (a square grid of ε
dots, `PLAT` 0.082, `RLAT` 0.028, drawn as a hint in `render.js:95`) · waveguide. The lattice is the pattern. The twelve dots on the rim
are the charges' glows (`GLOWW`), a different thing.

## The plan — three items, each a proven step, in place, constants at the top of the module

### Item A — silence is silence: no carrier, no metronome (the user's 1)

- **The carrier goes.** No continuous oscillation of the charges, the dipole or the centre: `CHG`-driven radiation, `SUBK`, `WOBA`,
  `lam`/`CENTK`/`DIRTK` as a carrier wavelength, `RSWEEP`, the `ph`/`dph` phase — removed, not zeroed (the line budget: `index.js`
  498). The dipole stays as a **geometry** (its axis is the beat nudge, `math/nudge.js`) but it radiates only when a launch is routed
  through it (item B). The sub's breath of the medium's ε (`WOBK`, v0.11) stays — it moves the light, it is not a source.
- **The metronome goes.** The `beat`-event `FAINT` launch is deleted. `presence`/`alive`/`absentT` gating from v0.11 stays on the
  glows and the params; with no carrier the plane between sounds is the medium hint and the twelve glows, nothing else.
- **What timbre still does** (cheap, keep only if it reads): a launch's ring thickness `TSIGH` scales with `centroid` (bright music =
  thin rings, sub-heavy = fat) and `dirty` gives the Ricker a second lobe (the growl on the shell). Named `TSIGK`, `DIRTK`.
- **Proof:** `hooks.train('off')` + `hooks.quiet(0)` (music on, no hits) at CLOCK=1 f360: `hooks.energy()` **= 0** and `probe().segs = 0`
  — a lit room with no sound in it is black. `IDS=9 tools/scene-md5.sh` re-based (the frame changes).

### Item B — every sound a wave, in its note's hue (the user's 1 and 2)

Every launch is a Ricker shell (v0.10's `launch()`), from a place, with an amplitude and a **hue** injected into the colour field:
- **Kicks:** `kickCount` delta per frame (a counter — an edge at any rate; N kicks in one frame = N launches). From the **centre**.
  Hue = the bass note: `argmax(bchroma)` at the hit (`bchroma` is bass-only chroma, ema 0.35 s); below `BCHMIN` no bass note → the
  key's anchor. Amplitude `KICKA × (KPUN0 + KPUN1·punchy) × kick level`.
- **Snares, hats:** the engine gives decaying impulses only, so a **re-armed edge**: fire when the impulse rises above `HI` after having
  fallen to `REARM` × its last peak (not a fixed `LO`), with a refractory `REFR` ≈ 70 ms, so overlapping hits still retrigger. Snare from
  the sector of the pitch class that **rose most** over the last `NOTEW` ≈ 150 ms (`chroma` − a scene-kept copy), in that hue; hat on
  all twelve stays but at its hue per sector (`HATA`).
- **Anything else that hits:** the engine's `onset` event (one frame, spectral flux > mean + 1.5σ) when no band launched within
  `ONSETW` ≈ 50 ms → a mid-amplitude launch (`ONSETA`) from the loudest-rising sector, its hue. This is what catches a synth stab or a
  vocal onset that is not a drum.
- **Notes as such:** a chroma bin whose rise over `NOTEW` exceeds `NOTEK` launches from **its own sector** in its own hue at `NOTEA`, with
  a per-bin refractory `NOTEREFR` ≈ 200 ms. `chroma` is an ema of 0.25 s so this is soft — it is the secondary source; the drum and
  onset launches are the primary one. If it fires on nothing (the friction log will say), lower `NOTEA`, do not raise `NOTEK` past
  a value that never fires on the demo synths.
- **Double time follows** from the detector: `hooks.train('8')` (eight launches a beat) draws eight shells a beat with half the spacing
  of `'4'` — `hooks.train()` reports the spacings, ratio 0.5 ± 5 %. A **slot budget:** `SLOTS` 8 per band → 16 (a double-time bar needs
  it), and one shared launch list instead of three band arrays if that is fewer lines.
- **The colour field** (`colour.js`) is unchanged in mechanism: every launch injects `amp · rgb(hue)` and `amp` into `w`. `CSPREAD`,
  `TROUGH`, `FGAIN` untouched unless the montage says (the pale cream should go by itself once the carrier is gone; if the plane reads
  too dark between hits, `FGAIN` is the knob, not a carrier).
- **Proof:** `hooks.launches()` returns `{n, perBand, last: [{band, sector, hue, amp, step}]}` (read-only). On `#test` CLOCK=1: launches
  per bar = the fake timeline's kicks + snares + hats (say the numbers; `fake.js` sets kick 1 per beat, snare .7, hat exactly .5 — the
  re-armed edge must fire on .5, HARNESS "Pitfalls"). `hooks.mxchroma("3")` + `hooks.train('4')`: every launch's hue = sector 3's,
  `hooks.mxcol()` on the plane within `HUETOL` 0.04 turns (v0.11's instrument). Real track (`det12.py`, every 2 s, 80 s): the scene's
  launches per 2 s vs the engine's `onsetRate` agree within 30 %, the dominant plane hue vs `argmax(bchroma)` at the last kick within
  0.08 turns on ≥ 70 % of samples (a real per-note number at last — the kick's hue has a referent, unlike v0.11's flat chroma). A
  double-time passage: find one in the trace (onsetRate doubling) and show launches doubling with it — a list per 2 s.

### Item C — the media (the user's 2, the orchestrator's rec followed)

- **The photonic lattice is removed** (code and rotation). **Rotation = lens · mirror cavity** (`sectionAlt mod 2`). **The waveguide
  stays out of rotation**, reachable by `hooks.medium(3)` for one montage shot; the user decides it after seeing sound-only ripples in
  the cavity. The drop's mirror (2.2 s hold) stays. `NAMES`, `help.js` and the card's blurb say what is in rotation.
- **Proof:** `hooks.medium(0)` and `(1)` with `hooks.train('4')` at f360: the lens bends the four shells, the cavity shows one reflection
  crossing the next shell (say what you see, one sentence each); `(3)` the waveguide shot for the montage; `(2)` → an error or empty
  space, never a lattice.

### Also in this session (small, orchestrator)

- HARNESS: `tools/lum.py` has no hue field (use `hooks.mxcol()`), the palette is cosine not HSV (hue numbers are palette turns via
  `probe.js hueFit`), the 500-line cap is where a growing scene's budget goes (owed from §43).
- `help.js`: every feats entry a line (`onset onsetRate kickCount bchroma` in, `centroid`/`dirty` only if item A keeps them; `regularity`
  stays out); `eli5`/`why`/`math` say "every sound is a ripple; its colour is its note".
- `AUDIT-v0.12.md`, DECISIONS §44, `NEXT-SESSION-PROMPT.md`, package.json 0.12.0, `releases/retinarave-v0.12.html` **proven from
  `file://` before the tag** (v0.11's bundler lesson, §43: `FILE=$PWD/releases/… 'test'` with a plain wait, keys `9` `n`, errs `[]`),
  the thumb re-shot (`tools/thumbs.sh "9:360"`).

## Numerics and non-negotiables (unchanged from v0.11 unless named here)

Courant 0.5 · `GRIDT` tier-3 substeps 3 · fixed substeps by frame count (CLOCK=1 md5s) · soft sources · the 16-cell absorber · the
porthole (plane and strokes) · `hooks.reset()` zeroes both fields and the launch list · no `Math.random()`, no wall clock · scenes import
nothing from `core/`/`engine/` · **500-line cap: `index.js` must come down** (the sources' setup and the launch routing belong in
`sources.js`; if `sources.js` grows past 350 split `onsets.js` — the detectors — from it) · `node tools/check.js` after every edit ·
hooks named through `CARD.REG[9].scene.hooks.<name>`; new hook names `launches` (free — check) · **a hook that pins an MS field pins the
params derived from it** (CONTRACTS §1.4, v0.11) · cost gate ≤ 1.5× TORUS2 by the two-page protocol (fewer sources — expect it to drop).

## Process (v0.11's, DECISIONS §43)

1. **Orchestrator:** `docs/workers/brief-maxwell-onset.md` from this prompt + `brief-maxwell-wobble.md`'s discipline (PORT **8850**,
   commit prefix `MAXWELL3:`, may-read = the list above + `tools/accept/v0.11/*`); `tools/accept/v0.12/` with `audit12.sh` (= audit11's
   paused start) and `det12.py` (launches per 2 s vs `onsetRate`, dominant hue vs `argmax(bchroma)` at the last kick, the medium in
   force); the v0.11 "before" shots for the montage (`before-{house,aba,dnb}-t{6,14}`, the CLOCK=1 f360/f840 pair; a v0.11 detached
   checkout or `git archive v0.11 | tar -x` into the scratchpad serves the real-track "before" rows — `git worktree add` is refused).
   **Music:** copy `…/scratchpad/music/{CyborgNinja,WhoLikesToParty,Malicious}.mp3` from the v0.11 session's scratchpad
   (`/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/9498eb8d-7260-49ae-9998-9ccbecbfee90/scratchpad/music/`; if `/tmp` was
   cleared, `curl` `https://incompetech.com/music/royalty-free/mp3-royaltyfree/{Cyborg Ninja,Who Likes to Party,Malicious}.mp3`) — and a
   real dubstep mp3 if the user supplies one (the user's v0.10 note 3 is still untested on dubstep).
2. **Worker (opus, own worktree, own PORT):** item A → item C → item B → help + report `docs/workers/maxwell-onset.md` with the friction
   log. One commit per proven item; every proof number in the report; `IDS=9 tools/scene-md5.sh mx3` at the end.
3. **Orchestrator:** merge; `IDS=9 tools/scene-md5.sh v0.12` (re-base `tools/accept/v0.12/scene-md5-v012.txt` = v0.11's list with s9
   moved); bench; the headed runs with the paused start on the three tracks (+ dubstep if supplied); `montage-maxwell3{,-demo,-real,
   -media}.jpg` (v0.11 left · v0.12 right); AUDIT-v0.12; DECISIONS §44; NEXT-SESSION-PROMPT; the `file://` proof; tag **v0.12**; push
   (deploys). Same gate as before: the user's word was the tag; the montage is theirs to judge after.
4. **The user looks.** Only on their word: the waveguide's fate, a bid, the Q trace, the `accept.sh` section, the NAV2 question.

## What this session is not

Not a new scene, not a bid for MAXWELL, not the NAV2 swap, not POLYTOPE, not TORUS2 (the `motion.js turn` fold onto `math/nudge.js` is
still owed to a TORUS2 session), not 3D, not an OKLCH variant, not a full sweep, not fallback B (the `vec4` Yee), not a carrier "bed"
behind the hits (the user said quiet). If the note-onset source (item B's fourth bullet) fires on nothing usable, ship the drum + `onset`
launches and say so in the AUDIT; the per-note colour is then the bass note at each kick and the rising pitch class at each snare/onset.

**One thing to bring:** a dubstep mp3 for the scratchpad's `music/`.
