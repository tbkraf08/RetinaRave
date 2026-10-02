# Next session — Retina Rave (written 2026-10-02, after the v0.29 deploy)

**State:** **v0.29 DEPLOYED 2026-10-02** (`dca98f5`; retinarave.com serves v0.29 — everything from §49 to §82 is live: the six live
steps, the DUST overhaul passes 1–2, LOUDNESS, the ears' kick/snare lanes + `kickAmp`/`snareAmp`, the Quantile fix, key = tonic,
the clock fixes, the Arnold tongues §76–§80, `tension` normalised §81, `modeShade` ON by default §82). `main` == origin.
Tracks: `~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3, Malicious.mp3, Vienna.flac}`; truth grids
`tools/truth/<T>.json` (+ `.kick/.snare/.loud.json`). The user's words that still govern: "lets go one scene at a time" · the
legibility brief in `DUST-OVERHAUL-SESSION-PROMPT.md` is the standard for every scene · reactive over predicted · "the double time
should be accenting rather than driving" · **"always plan with fable" / "do work with fable"** (memory `feedback_plan_with_fable`).

**Rules (unchanged):** the orchestrator delegates; planners AND builders are `model: fable`; a push to `main` deploys — push /
tag / deploy only on the user's word; the user's dev server is `node tools/serve.js` on **8765 with no port in its command line
— never `pkill -f serve.js`, kill test servers by port only** (a worker killed it once, §73); one page Chrome per worker, two
workers at most in parallel on disjoint files; every before/after pair across commits in an isolated `git worktree` (HARNESS);
never `trackmap.py <T> --pcm` on a track with a truth dir (it overwrites the grid); no audible runs without saying so first;
commit per step with the numbers; DECISIONS §83+ ; memory `project_dust_overhaul` is the running log.

## Do, in order

### 1. The guard rails cover what we built (S–M, engine/harness, no look change)
- `tools/accept.sh` references date from v0.14: every scene that legitimately moved (s1, s2, s3, s5, s6, s0-f840, s4-f840,
  NAV2 stills, the `mixs` 0→3 route, s11 never recorded) now prints FAIL. Re-record the reference list at v0.29
  (`tools/accept/v0.29/`, `scene-md5-v029.txt`), keep the v0.14 list as history, and make the script's reference path a
  variable so the next refresh is one line. The node-colour bug is already fixed (`FORCE_COLOR=0`, v0.27).
- The fake timeline (`assets/engine/sources/fake.js`) carries NO percussion events — `kickEvt/snareEvt/hatEvt`, the ages,
  `kickAmp/snareAmp`, `tongue*` are constants there — so the md5 sweep was blind to all of §57–§80's voice work and to §82's
  shade. Give the fake a deterministic kick / snare / hat event lattice (on its 60 Hz clock; a 4-bar pattern with one soft and
  one hard hit per class so `*Amp` has a range), mirror ages/amps/`modeShade` from it, and re-record every scene's line once.
  Receipt: a one-constant change in DUST's `voices.js` must now move s1's md5 (prove it, then revert). Expect every scene
  that reads a voice to move on this one commit — record the new list as the baseline; nothing else may move after it.

### 2. The key itself (M, engine)
`modeShade` is ON (§82) and only as good as the key: §62's table has CyborgNinja and Malicious against WRONG keys (G♯m vs C♯m,
Cm vs GM — low-margin KK reads of the same signal) and `keyConf` on synapse's scale (0.27 on SeeYouDrop's human-confirmed C♯m).
Measure `tonic.js` per track and section (the ears' tonic vs the truth, with the truth re-checked by ear — see "validating"
below), decide a `tonicConf` that is high where the key is right and low where it is not (receipt: the five tracks' confusion
table before/after; a wrong key must read conf < the shade gate), and re-fit `keyConf`'s scale (§62 held it deliberately —
`KEYC1` 0.3 opens every gate; measure the five-track distribution before moving it). Every key scene (DUST, TORUS2, POLYTOPE,
MAXWELL, GIELIS, CHLADNI's figure) is the consumer: fake-timeline md5 0 lines until a constant changes, real-track hue tables
before/after. Fix the detector only where the measurement says the fifth / relative-minor confusion is systematic.

### 3. The overhaul, next scene: MANDALA (scene id 2, key 3) — pass 1, in place
MANDALA today (`assets/scenes/mandala/index.js`, 231 lines): a box-fold fractal through a kaleidoscope; the fold count N moves
only with the section `seed` / the **64-kick epoch** (`kickCount`); reads `flow / flowMid` (synapse's flow clocks — **no beat
grid**), `bass / bassS / midS / high`, `kick` and `hat` (synapse's levels — **no snare, no ages**), `tension` (roughness —
**no build**), `dropEnv`, `lvl` + `loudRel/Range/Abs` (§63 moved its base light to true loudness), `arc / regularity /
onsetRate / alive`. The same shape DUST had before §57. Pass 1, in order, each measured with `tools/dust-trace.js <T> … 2`
(works on any scene; add a `dinfo()` with N, the fold phase, the kaleidoscope angle) and committed with its numbers:
1. **On the grid** — the kaleidoscope rotation and the fold's phase advance per beat on the PCM clock (`beatCount`/`beatPhase`,
   the §61 velocity profile: glide + raised-cosine accent peaking ON the beat, `K.WREF`), the downbeat a bigger step, N changes
   only on a phrase boundary / `barNovelEvt` / a section return (`barReturnEvt` restores the filed N) — **never the 64-kick
   count**. Flow clocks stay as the slow drift only.
2. **Three transient voices** on the ears' lanes — kick: a fold *depth* pulse (`kickEvt` placed by `kickAge`, sized by
   `kickAmp`); snare (new): a kaleidoscope *segment flash* or a mirror flip (`snareEvt`/`snareAge`/`snareAmp`); hat: edge
   glint (`hatEvt`, the §64 bed gate). Fast attack, slow decay from the ages; DUST's `voice()` in `dust/voices.js` is the
   pattern — lift it into `assets/math/voice.js` so both scenes share it (one receipt: DUST's s1 md5 unchanged).
3. **Real tension** — `buildLive` + `tongueAmbig` (§77/§79: the void and the ambiguity) tighten the fold (N up by one, the
   palette drains, the mirror count rises), `dropLiveEvt` releases; roughness `tension` becomes a small jitter only (§81's
   normalised field, `&rough=0` old).
4. **Dynamic range + the accent** — base light already on `loudRel` (§63); add §78's `acc` (the 2:1/4:1 tongue rise) as the
   accent amplitude on the rotation step and the hat glint (§80's `1 + 0.5·acc`), so a double-time layer accents, never drives.
   Harmony: the key hue + `modeShade` are already in `keycolour.js` — read them (CONTRACTS §1.4 colour slot).
Receipts per step: SeeYouDrop 20–110 (drops 57.6 / 105.6), Vienna 24–60 + 80–110 (85.336 / 106.669), CyborgNinja 20–80 (the
no-drop control: 0 N changes in a steady groove, the accent never fires), per-frame luminance + the §61 nudge metrics (max |a|,
dead time, floor/peak, crest within ±10 ms of the beat), `CARD.bench(1,300)` flat, s2's md5 recorded per step (it will move;
no other scene's may), `check.js` 0 fail, files < 350 lines (split `grid.js` / `voices.js` as DUST did). A/B for the user in
stream mode: old = `releases/retinarave-v0.29.html` from `file://`, new = `http://127.0.0.1:8765/`, key 3, same track;
their eye is the ruler, a look remark = a retune request. DECISIONS §-numbered per step; a session prompt
`MANDALA-OVERHAUL-SESSION-PROMPT.md` written first (Fable), shown to the user, then built (Fable).

## Validating a truth grid (the user asked; do this before item 2 leans on the keys)
A grid is right when the audio agrees with it four ways; `tools/truth/gridcheck.py` already prints the provenance flag
(`anchor` / `hand` / `dp_residual_ms > 60` — §71/§72; Malicious was the one grid that failed it).
1. **Hear it** (the only ruler that is the user's): build `tools/truth/clicktrack.py <T> [--downbeat] [--drops]` → a WAV of
   the track with a short click on every truth beat (accented on the downbeat, a different click on each truth drop / section
   start); the user listens at the track's own volume — a late grid is heard as a flam, a wrong bar line as the accent on the
   wrong beat, a wrong drop as a click where nothing happens. ~60 lines of numpy; the PCM is at `tools/work/<T>.48000.st.f32`
   (never regenerate it with `--pcm` on a track that has a truth dir). Vienna (`provisional`, nobody has listened) and
   Malicious's BAR line (unverified) are the two that need it first; SeeYouDrop's and CyborgNinja's hands are the controls.
2. **See it**: the §72 hand montages (`tools/work/v72/hand3-*.png` — the waveform ±60 ms around 16 marked beats, the grid's
   line drawn; the attack should start ON the line, as SeeYouDrop's does and Malicious's did not). Regenerate per track.
3. **Three automatic rulers must agree within ±5 ms** (§72's method): the zero-phase `filtfilt` band-attack scan, the ears'
   kick/snare lanes folded on the grid's period (`tools/drums-node.js --perc`), and the tool's own onset lists vs its beats.
   A constant offset = the §72 `t0` class of bug; a drift = the tempo; a half-beat = the §59 lattice.
4. **The user's notes in track time** go into the json as `drops_user` / `sections_hand` / `notes` (Vienna has them) and
   `--loud` / `dropcheck.py` grade against those first. Any beat the user disputes becomes a `hand` entry; the grid is
   re-phased to the hand, never the other way (§72: do not fit the engine to an unverified grid).
Once a grid passes 1–4, mark it `anchor: hand` with the date; drop `provisional`.

## Smaller, on their go
Vienna's grid provisional + Malicious's bar line (above) · SeeYouDrop's PCM lock 12 s · the page/node clock gap on
CyborgNinja/Malicious · CHLADNI's slow tonic latch + the frozen opening figure (§75 options) · DUST/TORUS2's kick size onto
`kickAmp` (§74) · `&hatacc=` K by eye (§80) · §81's CyborgNinja groove shift (`ROUGHK.HI`) · LOUDNESS phase 6 (NAV2 paused),
CHLADNI's file-only `eG` · the `tools/truth/Vienna/` grain tables are untracked (commit or ignore). Everything else:
`docs/OPEN-ITEMS.md`.
