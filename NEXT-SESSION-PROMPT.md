# Next session — Retina Rave (written 2026-10-02 late, after the §83–§90 session; v0.29 still the deploy)

**State:** `main` at `39a17e4`+ (ahead of origin — **nothing pushed, tagged or deployed since v0.29 `dca98f5`**; a push to `main`
deploys). Today's session landed, each with receipts in DECISIONS: **§83** accept.sh re-based at v0.29 (`ACC` variable,
`tools/accept/v0.29/scene-md5-v029.txt`, all 12 ids guarded) + the fake timeline's deterministic kick/snare/hat lattice (the md5 sweep
now sees the voices: s1 s3 s5 s9 s10 s11 moved once, the baseline re-recorded) · **§84** `tonicConf` (KS margin × sub-note histogram)
owns `keyConf`; the dead `SUB_W` lean fixed (`held`); `&kc=0` = synapse's old keyConf; Malicious is **C minor** (§62's "GM" refuted)
· **§85–§88 MANDALA pass 1** (grid on the PCM clock via `assets/math/beatgrid.js`, three voices via `assets/math/voice.js`, real
tension from `buildLive`/`tongueAmbig`, the §78 accent + key hue) — built on the prompt's five defaults, **the user has not seen it** ·
**§89 the `R` recorder** (compositor canvas on the frame's last task, `AU.bus` tap, VP9/Opus webm + sidecar json, watermark,
`&rec=0`; 60 → 47 fps at 1080p, stop rule closed; `tools/test_rec.js` 36 ok; `tools/clip.js` needs ffmpeg) · **§90 the DUST sync on
IBelongHere** (`PERCK.lineKick`: a clickless low onset on the clock's line is a kick, kick F 0.55 → 0.68; `CLOCK.HOLD_Y1/R_Y1/RATE_Y1`:
the clock no longer slides late on vocals, 59–65 s +21 → +8 ms, the drop re-seat 22 → 10 ms; the 0:10 4:3 cold lock measured and
**left**, `CLOCK.SW_Y1` off) · **LICENSE** = MIT + the Guest-List Clause (Toma gets into the party), the 3-line header on all 173
public files (`tools/license.js`, `check.js` fails without it), `/LICENSE` served and in `dist/`.
Tracks (six): `~/Music/RetinaRave/{SeeYouDrop.flac, CyborgNinja.mp3, WhoLikesToParty.mp3, Malicious.mp3, Vienna.flac, IBelongHere.flac}`.
**Truth grids validated by the user's ear today:** Malicious (both windows), Vienna (the current grid; the dream's chord swells are an
anacrusis, noted), IBelongHere (0–75 s) — `anchor: hand` 2026-10-02 in each json; SeeYouDrop + CyborgNinja hand since §72;
WhoLikesToParty tool-anchored. `docs/truth/GRID-VALIDATION-2026-10-02.md`, `docs/truth/IBELONGHERE-2026-10-02.md`.
The user's words that still govern: "lets go one scene at a time" · the legibility brief in `DUST-OVERHAUL-SESSION-PROMPT.md` ·
reactive over predicted · "the double time should be accenting rather than driving" · **plan AND build with Fable** · click tracks go to
`~/Music/RetinaRave-clicks/` with a ready `! paplay` line · a look remark = a retune request.

**Rules (unchanged):** the orchestrator delegates; planners AND builders are `model: fable`; push / tag / deploy only on the user's word;
the user's dev server is `node tools/serve.js` on **8765 with no port in its command line — never `pkill -f serve.js`, kill test servers
by port only**; one page Chrome per worker, two workers at most in parallel on disjoint files (a third is fine if it needs no Chrome);
**two workers committing in one tree fold each other's hunks — give a builder its own `git worktree` + branch and merge** (§83/§90 both
rode into another worker's commit); every before/after pair in an isolated worktree; never `trackmap.py <T> --pcm` on any of the six
(all have truth dirs); no audible runs without saying so; commit per step with the numbers; DECISIONS §91+; `node tools/license.js`
on any new public file; memory `project_session_2026_10_02_pm` is the running log.

## Do, in order

### 0. The user's gates (nothing deploys before these; each remark is a retune)
- **MANDALA A/B** in stream mode, key 3: old = `releases/retinarave-v0.29.html` from `file://`, new = `http://127.0.0.1:8765/`.
  Watch: SeeYouDrop 0:40–1:02 (the void darkens, odd N, 0:57.6 lets go; 16ths arrive = heavier crest, harder glints), 1:30–1:50;
  Vienna 1:12–1:26 (the dream tightens, 1:25.3 releases), 1:30–1:38 (double time accents, gone by 1:43), 1:46.7 nothing on purpose;
  CyborgNinja 0:20–1:20 the control (N never changes, nothing accents). The five defaults taken (§85–§88 "defaults"): one wedge per
  bar, snare = segment flash, kick sized by the level's confirm, N+1 literal, `acc` from the lifted `spin()`.
- **The key A/B** (`&kc=0` = old), DUST key 1: SeeYouDrop's walk (0:20–0:57) — the A/E bars now slide to the mood palette (conf
  0.06–0.07 there); CyborgNinja — the hue stops following the wrong key's flips (gate 0.94 → 0.04); Malicious 1:40 — CM → the mood
  palette on the intro's D♯. The user's ear on the tonic: CyborgNinja "the wobble bass under the drop at 0:48 — is it C♯?";
  Malicious "the bass under the drop at 2:28 is the tonic (C)"; IBelongHere "the bass at 1:04.7 — A (the ruler) or D (the ears)?" →
  `tonic_hand` in the json, `tools/test_ears.js` KEY_TRACKS `expect`.
- **DUST on IBelongHere** (file mode, key 1): 0:47 the kick pulse on 12 of 21 kicks and through the breakdown; 1:04 the line no longer
  slides late, the drop snap halved; 0:10 unchanged by design (the 4:3 lock on the drumless dotted-8th intro — a scene-side
  `clockConf × min(1, y1/0.3)` gate is the open design, §90). Old: `&kline=0&holdy1=0&ry1=0&ratey1=0`.
- **The recorder by hand** (HARNESS "Recorder"): `sudo apt install -y ffmpeg` in a real terminal first (the `!` prefix has no tty);
  30 s tab capture + 30 s file, each webm plays in Chrome and VLC with sound, watermark reads, dot/HUD absent; then
  `node tools/clip.js ~/Downloads/<take>.webm --ss 2 --to 28` and `ffprobe … clip.mp4` → `60/1,yuv420p`, aac.
- **Read once:** `LICENSE` (the clause names Thomas Kraft, "Toma", you + one guest) and `MANDALA-OVERHAUL-SESSION-PROMPT.md`.

### 1. Tag v0.30 (on the user's word, after 0)
Bump `package.json` AND `assets/core/version.js` together (§89: the page's one version source); `npm run build` →
`releases/retinarave-v0.30.html` + `dist/`; `tools/check.js`; accept.sh 0 FAIL; `git tag v0.30`; push = deploy; `accept.sh` refs stay at
v0.29 unless a scene moved on purpose (s2 already re-recorded in §88). Memory `project_retinarave_public` gets the line.

### 2. Share phase 2 + 3 (→ v0.31; `docs/plans/SOCIAL-PLAN.md` §3–§4 is the spec, the user's answers are in §1 — do not re-ask)
`releases.json` + `tools/whatsnew.js` → `site/whats-new.html` at `npm run build` (static, per-version anchors, click-to-load YouTube
behind a self-hosted poster, no third-party request before a click); `check.js` fails a tag whose top entry ≠ `package.json`;
backfill v0.6 → v0.30 from DECISIONS / the AUDIT files in a visitor's words, one sitting; `tools/record-old.sh` for the old releases'
clips (ffmpeg x11grab + the PulseAudio monitor). Then the landing line on the card ("Everything runs on this device — no account, no
trackers, no ads. I built this for myself and wanted to share it." + "New in vX: <title> → what's new" inlined by `tools/bundle.js`) and
`about.html`'s long form. DOM only — md5s cannot move. SocialMediaManager stays a separate repo the user starts themself once a real
clip bundle exists (`docs/plans/SOCIAL-MANAGER-BRIEF.md`).

### 3. Then, on the user's word: the next scene (one at a time) or MANDALA pass 2 from the A/B remarks

## Smaller, on their go
The 0:10 class: a scene-side clock-confidence gate (no scene reads `clockConf`) · Malicious cold lock 3.5 → 5.6 s (§90's one cost) ·
SeeYouDrop's walk reads F♯m at 0.31–0.38 (one twelfth, same cool pull) · WhoLikesToParty stays gated (walking bass → mood palette) ·
CHLADNI's `tconf` on the new scale, not re-tuned · the recorder's `Q.q` sinks to 0 during a take (pin `q`?) · the fake's hat has no size
(no `hatAmp`) · GIELIS `&still=1` reads `modeShade` through the anchor · MANDALA: the body clips to a yellow disc at loud passages +
the drop frame's white-out bands (inherited from v0.29); the lifted `spin()` lands DOWN's step one beat late (DUST too) · polytope /
torus2 / dust index.js over the 350 soft cap by the header · `tools/accept/*/` jpgs stay untracked · `tools/test_ears.js` wants
`tools/work/SeeYouDrop.st.f32.json` (pre-existing) · accept.sh's `== scene md5` grep misses DRUM id 4 (22 vs 24 lines; `scene-md5.sh`
has all 24) · WhoLikesToParty's grid never listened to. Everything else: `docs/OPEN-ITEMS.md`.
