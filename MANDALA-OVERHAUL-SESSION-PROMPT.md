# Fable Session Prompt — Retina Rave: the MANDALA overhaul, pass 1, in place (written 2026-10-02, after the v0.29 deploy)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine, native ES
modules, git, branch `main`; **a push to `main` deploys retinarave.com — push / tag / deploy only on the user's word**). Dev server:
`node tools/serve.js` → http://127.0.0.1:8765/ (the user's; **no port in its command line — never `pkill -f serve.js`, kill test servers
by port only**, §73). **State:** v0.29 DEPLOYED (`dca98f5`); NEXT-SESSION-PROMPT item 1 (§83: `accept.sh` re-based on `ACC`, the fake
timeline's kick / snare / hat lattice) is in progress by another worker; item 2 (the key, `docs/plans/KEY-PLAN.md`, §84) is planned.
This prompt is item 3. It was written first (Fable), is shown to the user, and is built (Fable) only after their word.

## The ask (the user's words that still govern, verbatim from NEXT-SESSION-PROMPT.md)

> "lets go one scene at a time" · the legibility brief in `DUST-OVERHAUL-SESSION-PROMPT.md` is the standard for every scene ·
> reactive over predicted · "the double time should be accenting rather than driving" · **"always plan with fable" / "do work with fable"**

and the brief itself (2026-09-30), the acceptance standard for every scene from here on:

> Build the visualizer to be legible: a viewer with the sound off should be able to roughly reconstruct the song's structure.
> Transients (kick/snare) produce sharp, fast-attack/slow-decay impulses driven by band-limited onset detection. Frequency bands map
> to distinct visual behaviors so instruments are separable. Motion is phase-locked to the beat grid with emphasis on downbeats and
> phrase boundaries. Maintain a slow "tension" accumulator (energy slope, centroid rise, onset density, filter sweeps) that visibly
> tightens the scene during builds and releases all at once on the drop. Detect timbral novelty and give new sounds a new visual
> voice; let sustained sounds habituate. Preserve dynamic range: quiet is quiet, loud is loud. Zero perceptible latency; nothing
> moves without an audible reason.

Build it **in place** in `assets/scenes/mandala/` (the old MANDALA stays reachable as `releases/retinarave-v0.29.html` — that is the
A/B). MANDALA is **scene id 2, key 3** (keys 1–9 → ids 0–8).

## MANDALA today (what to keep and what to replace)

`assets/scenes/mandala/index.js` is **149 lines** (NEXT-SESSION-PROMPT says 231 — that is `dust/voices.js`'s count), `shaders.js` 82.
A fullscreen fragment scene: an N-fold angular fold (`N = 4 + 2·floor(5·hash(seed, floor(kickCount/64)))`, shaders.js:50) feeds 7–10
iterations of box-fold + sphere inversion (`z = abs(z)/clamp(<z,z>) − c; z = R·z`, :66–67); an orbit trap on a spectrum-driven ring
and a cross trap light it. **Keep** the fold group, the traps, `palM`, the `post` line (`kaleido: 0.6` — the fold owns its symmetry).

Every MS field it reads today, by line (`update()` copies into `S`, `draw()` uploads; the shader also reads the HEAD block):
`arc` :33 · `regularity` / `onsetRate` :34 (the bid, keep) · `seed` :44 · **`kickCount` :45** (the 64-kick epoch; look memory :28–30 is
built on it) · **`flow` :46 / `flowMid` :47** (the fold constant `c` drifts on `flow` :57–58, the wedge ROTATES on `flowMid·0.11` :52, the
fold's twist `R` on `flowMid` :62 — **no beat grid**) · `bassS` :48 · `midS` :49 · **`kick` :50** (synapse's level — the zoom `−0.25·uKick`
:55, `c += 0.03·uKick` :58, the centre flare :78) · **`tension` :51** (roughness — zooms OUT `+0.5·uTension` :55, read as a build) ·
`dropEnv` :52 · `loudRel / loudRange / loudAbs / lvl` :59 (§63's `baseLight`, keep) · **`hat` :60** (the trap ring's sparkle `0.8·uHat`
:75) · `alive` :61 · `rt.time = MS.flow` :69 · in the shader only, via HEAD `uBands`: `bass` (:55, :77) and `high` (:75).
**No snare, no ages, no amps, no events, no build, no key.** The same shape DUST had before §57.

What the spec replaces: `kickCount` → `barNovelEvt` / `barReturnEvt` / the phrase wrap (step 1); `flow` / `flowMid` as the rotation
→ `beatCount` / `beatPhase` / `bpm` / `barPos` (step 1; the flow clocks stay as the slow drift of `c` only); `kick` / `hat` levels as
the hit → `kickEvt` / `kickAge` / `kickAmp`, `snareEvt` / `snareAge` / `snareAmp` (new), `hatEvt` / `hatAge` + `highS` for the §64 bed
gate, with `kick2` / `hat2` / `snare2` as the floors under the envelopes (step 2); `tension` as the build → `buildLive` /
`tongueAmbig` / `dropLiveEvt` / `nextDropIn`, `tension` as jitter only (step 3); the accent → `tongue21` / `tongue41` / `tongueOn`,
the colour → `key` / `mode` / `keyConf` / `valence` / `harmAngle` / `modeShade` through `keycolour.js` (step 4).

## Two things that changed today, and that this pass inherits

1. **The fake timeline carries a percussion lattice (§83, item 1).** `kickEvt / snareEvt / hatEvt`, the ages, `kickAmp / snareAmp`,
   the tongue depths and `modeShade` now move on the fake timeline, so **s2's md5 WILL move on every step** (step 1 already: the grid
   reads `beatCount`), and "no other scene's md5 may move" is now a real receipt. The baseline is `tools/accept/v0.29/scene-md5-v029.txt`
   **as re-recorded by item 1's commit** (`accept.sh`'s `ACC` variable; today's s2 lines `f2df3a81` / `c93dcf77` are pre-lattice). Fake
   reads a LEVEL only (`kick`, `hat`) cannot move on item 1's commit, so MANDALA's lines are item 1's to the byte until step 1 lands.
2. **The key is item 2's, not ours (`docs/plans/KEY-PLAN.md`, `4118f6f`, → §84).** `tonicConf` becomes `keyConf`'s owner inside the
   engine; `math/keycolour.js` and the scenes that pass `MS.keyConf` are NOT touched by it. MANDALA reads the key hue + `modeShade`
   through `keycolour.js` (step 4) and gets item 2's fix for free. **No key work in this pass.**
3. Malicious's truth-grid bar line is disputed (`docs/truth/GRID-VALIDATION-2026-10-02.md`): the receipts below use SeeYouDrop,
   Vienna and CyborgNinja only — do not add Malicious.

## Hard rules

- serve.js on 8765 is the user's and is never killed; a worker's pages are `PORT=8880+`, killed by port. One page Chrome per worker,
  at most two workers in parallel on disjoint files. No audible runs (the user's A/B is theirs, in stream mode).
- Every before / after pair across commits in an isolated **`git worktree`** (HARNESS "Scene ruler"; `git archive <sha> | tar -x` from
  inside an agent worktree), back to back, and prove the engine did not move with the md5 of the `beatCount` / `dropEnv` / `eM` columns.
- **Commit per step, with the numbers in the message. DECISIONS §-numbered per step: §83 = item 1, §84 = item 2, so MANDALA is
  §85 (step 1), §86 (step 2), §87 (step 3), §88 (step 4)** — check `grep -n '^## §' docs/DECISIONS.md | tail -1` before writing.
- Files < 350 lines (`check.js` warns at 350, fails at 500): split **`mandala/grid.js`** (the beat state) and **`mandala/voices.js`**
  (the voices, the tension) as DUST did, `help.js` if `help.feats` pushes index.js over. `node tools/check.js` 0 fail after every edit;
  `feats` + `help.feats` carry every new field (check.js fails on an MS key without one).
- A scene imports from `assets/math/*` only — never from `assets/scenes/dust/` (CONTRACTS §0; check.js). So **lift, do not copy**:
  the shared code moves to `assets/math/`, `dust/*.js` imports it back, and DUST's s1 md5 unchanged is the receipt of every lift.
- Push / tag / deploy only on the user's word. `accept.sh` before any deploy. Memory `project_dust_overhaul` is the running log.

## Pass 1 — four steps, in order, each measured with `tools/dust-trace.js <T> <t0> <t1> <out> 2` and committed with its numbers

`dust-trace.js` works on any scene (`CARD.REG[<id>].scene`, `&scene=2`); its scene columns are every numeric key of the scene's
read-only **`hooks.dinfo()`** (flat object of numbers; absent = no scene columns; it must not mutate). Windows and the per-window
truth: **SeeYouDrop 20–110** (`WARM=20`, drops **57.6 / 105.6**), **Vienna 24–60 + 80–110** (drops **85.336 / 106.669**), **CyborgNinja
20–80** (the no-drop control). Traces to `tools/work/v85/…v88/`. Per-frame luminance (`lum / lumC / lumM / lumR`) comes with every trace.

### Step 1 — on the grid (→ §85, `mandala/grid.js`, `assets/math/beatgrid.js`)
**Lift first.** The §61 velocity profile lives only in `dust/grid.js` (`assets/math/nudge.js` is §36's spring ease, TORUS2's — not
it). Move `K` (GLIDE .45 / W .55 / **WREF 145**), `STEP`, `DOWN`, `lead`, `wFor`, `gFor`, `phi`, `phiDot`, `barIndex`, `JUMP`, `BLEED`,
`mkSpin`, `spin`, `ACC`, `accentOf`, `accent21`, `mkTrigger`, `trigger` into `assets/math/beatgrid.js`; `dust/grid.js` keeps only
DUST's own constants (`TORUS_K`, `GAL_K`) and re-exports. Receipt: **s1 md5 identical** (both lines) and `tools/scene-md5.sh` 0 diffs.
**Then MANDALA:** the kaleidoscope angle (`uFlowMid·0.11` :52) becomes `rot = spin(S.sp, MS, dt)` with MANDALA's own `STEP` (default
`TAU/32` — one wedge per N beats is the open question below); the fold's twist `R` (:62) and the constant `c`'s phase advance on the
same angle (`fold = rot·k`); the downbeat is `DOWN`'s bigger step; `flow` / `flowMid` remain only in `c`'s slow drift (:57–58) and
`rt.time`. **N moves only on a seam**: `trigger()` says `phrase` / `novel`, `barReturnEvt` + look memory restore the filed N
(`look.get/set` become N itself, the `epochOff` / `kickCount` machinery goes); the N draw is the seed hash as now, re-drawn at the seam.
`feats`: − `kickCount`, + `beatCount beatPhase bpm barPos phrase16Pos barNovelEvt barReturnEvt`. `dinfo()`: `N nN rot fold nv nu nstep
noff njump nacc why` (why: 0 / 1 phrase / 2 novel / 4 return). Hooks: `&nudge=<g>,<w>` as DUST's.
**Receipts** (`tools/work/v78/nudge78.py` on the trace's `rot` column — point it at `rot` instead of `d_spin`, or copy it to
`tools/work/v85/nudge85.py`): rad/beat over the window = the design `STEP` to 3 decimals (no drift); per-beat **max |a| ≤ 30 rad/s²**
(DUST 19 / 16 / 26), **dead time 0 %**, **floor / peak ≥ 12 %**, **the crest within ±10 ms of the beat line** (DUST −8.3 ms) on all
three windows; the downbeat step 1.5× the others; **N changes: SeeYouDrop every one on a seam (list t, reason), CyborgNinja 20–80
`nN` = 0, Vienna only at the §82-listed section lines**; `CARD.bench(2, 300)` interleaved with `bench(0, 300)` flat; **s2's two md5 lines
move (record them), every other line = item 1's list**; `check.js` 0 fail; `&nudge=` reaches the scene.

### Step 2 — three transient voices on the ears' lanes (→ §86, `mandala/voices.js`, `assets/math/voice.js`)
**Lift first:** `THR`, `FRESH`, `REFRACT`, `mkVoice`, `voice`, `BED`, `mkBed`, `bed`, `HATACC`, `hatGain`, `mkTens`, `tens`, `WIND_BAR`
from `dust/voices.js` into `assets/math/voice.js` (DUST's ring / sub stay in `dust/voices.js`, which imports the rest back). Receipt:
**s1 md5 identical.** **Then MANDALA**, exactly DUST's three calls (index.js:134 / :141 / :149): kick = `voice(vK, dt, MS.kick2,
MS.kickAge, MS.kickEvt)` → a **fold-depth pulse** (`vk.e` replaces `uKick` in the zoom :55 and `c` :58, the flare :78 — placed by the age,
sized by the level's confirm; `kickAmp` is the open question below); snare (new) = `voice(vS, dt, MS.snare2, MS.snareAge, MS.snareEvt,
false, MS.snareAmp)` → a **segment flash** (one wedge of the N lit, `uSnare` + `uSnareSeg`) — or the mirror flip, the open question;
hat = `voice(vH, dt, MS.hat2, MS.hatAge, MS.hatEvt, bed(hBed, dt, MS.highS))` → the **trap-ring glint** (`vh.e` replaces `uHat` :75).
`voice()`'s `tc` / `floor` per voice are MANDALA's own constants (start at DUST's, then measure). `feats`: − `kick hat`, + `kick2 kickAge
kickEvt kickAmp snare2 snareAge snareEvt snareAmp hat2 hatAge hatEvt highS`. `dinfo()` adds `vk vs vh ageK ageS ageH fK fS fH aK aS
aH srcK srcS srcH hBed hSwell`. Hooks: `&bed=<r>,<tc>`.
**Receipts** (the §64 grader against `tools/truth/<T>.kick.json` / `.snare.json` / `onsets.high` at ±50 ms — P, fires/s, the share at
the floor, the share on the truth's 16th grid, the §58 coverage): **not worse than DUST's table** — snare P 0.80 / 0.68 / 0.94 and hat P
0.80 / 0.74 / 0.99 on Vienna 24–60 / SeeYouDrop 20–110 / CyborgNinja 20–50, kick coverage ≥ 0.9 everywhere; **lag**: the envelope's
first frame of motion ≤ 1 frame (+17 ms) after the truth onset, p50; **legibility**: `lumC`'s lift per kick fire and `lumR`'s per hat
fire ≥ 2× the annulus's own frame noise (§80's rule); **no false voice in silence**: Vienna 24–60's pad swells fire the hat ≤ 1.2×
the truth's rate. s2 moves, nothing else; `bench(2,300)` flat; `check.js` 0 fail.

### Step 3 — real tension (→ §87, in `mandala/voices.js`)
`tens(vT, dt, MS)` (lifted) gives `build` (`buildLive`, τ .35), `wind` (the last bar, `nextDropIn` < 1.7 s) and `rel` (`dropLiveEvt`,
τ .55). MANDALA adds the §77 / §79 ambiguity: `amb = max(0, (tongueAmbig − 0.75) / 0.25)` (TORUS2's dead zone, `tongueOn` 1 only) and
**`tight = max(build, amb)`**, eased. While `tight` > 0.5: **N + 1** (the fold's `mod` / `abs` is valid for odd N; the open question),
the palette drains (`sat × (1 − 0.55·tight)`, DUST's number), the inversion clamp tightens; `rel` springs it all back on one frame.
**Roughness `tension` becomes jitter only**: the `+0.5·uTension` zoom (:55) → `0.03·tension·sin(flow)`; `&rough=0` is §81's old field.
`feats`: + `buildLive nextDropIn dropLiveEvt tongueAmbig tongueOn`. `dinfo()` adds `build wind rel amb tight Nt drain`.
**Receipts:** SeeYouDrop — `tight` ≥ 0.9 by 52.0 s and ≥ 0.75 by 102.4 (§57's arm times), `rel` = 1 on the frame of 57.6 and 105.6 (±1
frame), per-bar median `lum` falls monotonically over the 4 bars before each drop and the drop frame's `lum` ≥ 1.5× the bar before;
Vienna — `amb` ≥ 0.75 across the dream 72.0–86.0 s (§77's 22 beats), `rel` on 85.336; at 106.669 **measure, do not assume** (§77: nothing
causal before drop 2 — record what fires); **CyborgNinja 20–80 — `tight` < 0.25 on every frame, `rel` never fires, `Nt` = N**. s2
moves, nothing else; `bench(2,300)` flat; `check.js` 0 fail.

### Step 4 — dynamic range + the accent, and the key hue (→ §88)
Base light stays `baseLight(loudRel, loudRange, loudAbs, lvl)` (§63, :59) — do not touch it. **The accent is §78's `acc`** (`accent21`,
the 16-beat rise of `tongue21` / `tongue41`, in `sp.acc` from step 1's `spin()`): the rotation step is already `STEP·(1 + DOWN + ACC.K·acc)`
by the lift; add **§80's hat lever**, `voice(vH, …, hatGain(sp.acc))` = `1 + 0.5·acc` on the glint. So a double-time layer ACCENTS, never
drives. **Harmony:** `KEY = mkAnchor()`; `A = KEY.anchor(dt, MS.key, MS.mode, MS.keyConf, MS.valence, MS.harmAngle, m.hue, keyPin,
MS.modeShade)` (DUST index.js:196); `S.hue = A.hue`, `S.sat = m.sat·A.sat` — the key hue and `modeShade`'s warm / cool pull come from
`keycolour.js` as-is. `feats`: + `tongue21 tongue41 key mode keyConf valence harmAngle modeShade`. `dinfo()` adds `nacc hG hue kconf`.
Hooks: `&hatacc=<K>`, `&key=<k>` (through `CARD.REG[2].scene.hooks.key`).
**Receipts:** Vienna 80–110 — `nacc` 0.97–1.00 over 1:30–1:38 (§80's window), the crest a quarter bigger there and 0 by 1:43; the glint's
lift per fire at acc 1 ≥ 2× the rim noise; **the rate and timing of fires unchanged — the `fK fS fH` columns md5-identical between the
step-2 and step-4 traces**; **CyborgNinja 20–80 — `nacc` = 0 on every frame (the accent never fires)**; SeeYouDrop — `nacc` ≤ 0.51 at
its returns and 0 elsewhere; dynamic range: `lum` p50 of SeeYouDrop's breakdown (90–105) / the drop (106–110) **not larger than
before step 1** (quiet stays quiet); the hue table per truth section before / after (key = C♯m on SeeYouDrop reads the same hue as DUST's).
s2 moves, nothing else; `bench(2,300)` flat; `check.js` 0 fail.

Pass 2 (next session, not now): per-bin habituation of the trap radius, novelty as a new trap, the fold's own dynamic range on `eM`.

## Measure, prove, bench

- The trace: `PORT=8880 WARM=20 node tools/dust-trace.js SeeYouDrop 20 110 tools/work/v85/syd-s1.json 2` (and `Vienna 24 60`,
  `Vienna 80 110`, `CyborgNinja 20 80`); before = the same command in a worktree of the previous commit. Graders: `nudge78.py`
  (§61 metrics), `rim80.py` (lift per fire), `tools/truth/dropcheck.py` (drops), the §64 trigger grader (P / floor / grid share).
- **`CARD.bench(2, 300)`** — the spec says `bench(1,300)`; **1 is DUST's id (copied from the DUST prompt), MANDALA is id 2**. Pin `q`
  first, three calls, interleave with `bench(0,300)`, report the NAV ratio; flat = the ratio within ±10 % before / after. Never bench
  beside a trace.
- md5: `PORT=8881 tools/scene-md5.sh v8N` after each step; `diff` against item 1's `tools/accept/v0.29/scene-md5-v029.txt` — **only
  the two s2 lines differ**; write the new s2 lines into the DECISIONS section (the list is re-based at the next tag, not now).
- `node tools/check.js` 0 fail; `npm test` green; `node tools/feats-doc.js` lists every new read.

## The user's A/B, stream mode, in track time

Old = `releases/retinarave-v0.29.html` opened from `file://`; new = `http://127.0.0.1:8765/`; **key 3** on both, the same track, tab
capture. Their eye is the ruler; they report in track time; **a look remark = a retune request** (memory `project_music_library`).
`&nudge=`, `&bed=`, `&hatacc=0`, `&rough=0`, `&shade=0` on the new page are the knobs that step back one lean at a time. Watch-list to
hand them: SeeYouDrop 0:40–1:00 (the void tightens the fold, 0:57.6 lets go), 1:30–1:50 (same at 1:45.6); Vienna 1:12–1:26 (the dream's
ambiguity tightens, 1:25.3 releases), 1:30–1:38 (the double time: a heavier swing per beat, the glints harder, never faster);
CyborgNinja 0:20–1:20 (the control: N never changes, nothing accents, the groove just turns).

## Open questions (my default stands unless the user corrects it)

1. **The rotation step.** DUST turns 2π/32 per beat. For a kaleidoscope one wedge (2π/N) per **bar** reads as the picture "landing" on
   the downbeat; per beat is 4× busier. Default: **`STEP = 2π/(4N)`** (one wedge per bar), re-derived at an N change, `&step=` hook.
2. **The snare voice: segment flash or mirror flip?** Default: **the segment flash** (one of the N wedges lit for the decay) — it is
   additive and cannot jump the picture; the flip is a discontinuity and `cuts: 'event'` would have to say so.
3. **The kick's size: `kickAmp` or the level's confirm?** DUST's kick still rides `kick2`'s edge (§74 moved only CHLADNI onto `kickAmp`;
   DUST / TORUS2 are an open item). Default: **DUST's call exactly** (lane-less, the level sizes it), so one receipt covers both scenes;
   `kickAmp` is declared and traced, not read.
4. **"N up by one" under tension: +1 (odd N, the fold allows it) or +2 (stay in the even family)?** Default: **+1**, the spec's word;
   the fold's `mod` / `abs` is exact for any N, and an odd count is itself the visible sign of the void.
5. **Where does the accent's `acc` live?** `accent21` is private to `spin()`'s state. Default: **lift it with the grid (step 1) and read
   `sp.acc`**, as DUST does — not a second copy.

## Read first

This prompt · NEXT-SESSION-PROMPT.md item 3 · `DUST-OVERHAUL-SESSION-PROMPT.md` · `assets/scenes/mandala/{index,shaders}.js` ·
`assets/scenes/dust/{index,grid,voices}.js` (the pattern — lift, don't re-invent) · `docs/CONTRACTS.md` §0, §1.4, §1.18, Appendix A ·
`docs/HARNESS.md` "Scene ruler on a real track", "Bench protocol", "Acceptance sweep" · DECISIONS §57, §61, §63, §64, §66, §74, §77,
§78, §80, §81, §82, §83 · `docs/plans/KEY-PLAN.md` (what item 2 owns) · memory `project_dust_overhaul`, `feedback_reactive_over_predicted`,
`feedback_display_lead`, `feedback_plan_with_fable`, `feedback_no_new_scenes`.
