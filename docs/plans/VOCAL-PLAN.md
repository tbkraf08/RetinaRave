# The vocal detector — ground truth, the live CNN, the file-mode Demucs lane (planned 2026-10-11; the user: *"plan next session: 1. ground truth first 2. live mode with tier2 CNN 3. file mode with demucs vocal stem"*)

Planned against main at 7b2d9aa (§121 the rig; FLUID2's LEAD channel reads `interval` as a stand-in for the voice). Three sessions,
one worker each, in the user's order. Every claim measured on the eight library tracks (CONTRACTS §1.1); the fake timeline is a smoke test.
What the engine has: a causal ears facade on 512-sample hops (`assets/engine/ears/`, node / page / Worker, no DOM), with an `FFT` and a
`Yin` class in `ears/dsp.js`; a file source that fetches `/music/<T>` from `$MUSIC` (local only, never shipped) and builds the file map
in JS at load (`engine/map/`); truth tooling in Python (`tools/truth/`: numpy + scipy + soundfile, torch 2.12 CPU, onnxruntime 1.23;
**no Demucs, no librosa yet**; ffmpeg; no CUDA — CPU only, 1.6 TB free). What it lacks: any notion of a voice.

**The interface all three steps feed** (one, so the rig never knows which lane fed it): three music-state keys —
`voxS` (0–1, the vocal presence, eased .1 s), `voxHz` (the sung pitch in Hz, −1 none), `voxConf` (0–1). FEATS entries with the
fake timeline's defaults (0 / −1 / 0), parity untouched (not in the 72), the md5 lists unmoved until FLUID2 reads them (then the s1
lines move and nothing else: the rig runs only while FLUID2 owns the pool). The rig's hook (`inject2.js`, two reads): the LEAD's ink
share = `LEAD_SHARE · voxS` (an instrumental passage keeps the floor whole — not `presence = voxS`, which would darken every
instrumental track), its height from `voxHz` (`p = 12·log2(voxHz / 440) + 69`, the scale degree of `p mod 12` above the tonic as today,
the octave `clamp(log2(voxHz / 110) / 4, 0, 1)` as a second, smaller term — a soprano line sits higher than a baritone's), `interval`
kept only as the fallback while `voxConf` is 0 (the HUD says which).

## Step 1 — ground truth first (one session; the user's ears are the ruler, Demucs is the labeller)

The cheapest accurate labeller is the separation model itself, so it runs here, once, offline, and its output is proposed to the ear:

1. `pip install --user demucs librosa` (torch is present; CPU — `htdemucs` takes 2–4 min per track here). `demucs -n htdemucs
   --two-stems=vocals -o tools/work/vox/ ~/Music/RetinaRave/<T>.*` for all eight tracks + the pad take → `tools/work/vox/htdemucs/<T>/
   {vocals,no_vocals}.wav`. Never in git (`tools/work/` is ignored); never served; never bundled.
2. `tools/truth/voxtruth.py <T>` (new; numpy + soundfile + librosa): per 10 ms hop over the stem — the vocal share `rms(stem) /
   rms(mix)` smoothed .1 s, pYIN f0 on the stem (`librosa.pyin`, 65–1050 Hz, voiced probability), the proposed sung WINDOWS (share above
   a knee on the track's own range for ≥ 1 s, gaps under .5 s bridged) → `tools/truth/<T>.vox.json` `{ hop: .01, share[], f0[], vprob[],
   windows: [{from, to}], provenance: 'htdemucs' }` and a table to stdout (per track: % of music frames voiced, the windows in track time,
   the f0 range). This file is ALSO step 3's lane, so it is written once and copied there.
3. The user's ruler (HARNESS "Hearing a truth grid", [[feedback-listen-via-paplay]]): per track two renders into `~/Music/RetinaRave-clicks/`
   — `<T>-vox-windows.wav` (the mix with a short high click at each proposed window's start and a low one at its end) and
   `<T>-vox-stem.wav` (the stem alone, so a leaked synth or a reverb tail is heard as what it is) — and the `! paplay …` lines in
   listening order. The user answers in track time ("vocals 48–64, the 112 one is a synth"); the hand goes into the json as
   `windows_hand` (the file never re-generated over a hand), and `windows.json` gets a `vox` key per track pointing at it.
   Known from the survey: IBelongHere is vocal house (the intro 0–16, breakdowns 48–64, 112–130, 144–178, 208–233 s); RaindropsOnRoses'
   breakdown lead 111–137 is pitched and continuous and is marked `kind: 'lead'` on purpose — the detector SHOULD read it; which of the
   other six carry a voice the Demucs pass answers before anyone listens (Comptine, solo piano, is the no-voice control).
4. The public training set for step 2, fetched now so step 2 starts warm: the **Jamendo singing-voice dataset** (Ramona et al., 93
   CC-licensed full tracks with frame-level vocal annotations, the standard 61 / 16 / 16 split) → `~/Datasets/jamendo-svd/`. The
   library's confirmed windows are the second, in-domain set. **Check the licence line before step 2 ships weights** trained on it
   (the audio never ships; the weights are a derived work — the user decides; MUSDB18's research-only terms are worse, not better).
5. Credit ([[feedback-credit-where-due]]): Demucs (Défossez et al., MIT) and librosa (ISC) in THIRD-PARTY.md the day they are used.

Deliverable: eight `.vox.json` + the pad's, the hand windows, `windows.json`'s `vox` keys, the two renders per track, the credits.
Gates: nothing in the engine moves (no key yet) — `check.js` and `npm test` as they stand.

## Step 2 — live mode: the tier-2 CNN (one build session + one training run; the user's eye after)

- **The front end** (`assets/engine/ears/vox.js`, a causal stage beside the lanes): per 512 hop a 2048-point FFT (the ears' own
  `FFT`) at the stream's rate → 40 log-mel bands 100 Hz–8 kHz, log-compressed, normalised per track by a running mean / sd over the last
  30 s (§111 item 7's shape: the model sees the track's own range, not an absolute level), a ring of the last 32 hops (≈ 370 ms of
  context, CAUSAL — the label is the window's END, so the estimate is ≈ 100 ms behind the sound by the smoothing alone; fine for a
  sustained line, wrong for consonants — the lead stays a glide).
- **The model**: input 40 × 32 → conv 3×3 ×16 → max-pool 2 → conv 3×3 ×16 → max-pool 2 → dense 32 → sigmoid: ~25 k parameters, ≈ 1 M
  multiply-adds per inference, run every 4 hops (≈ 21 Hz) → < 50 µs per hop amortised in plain JavaScript, hand-rolled (`ears/vox-net.js`:
  conv / pool / dense in Float32Arrays, no runtime, no WebGL — the ears run in node and a Worker). The weights as a JS module
  (`ears/vox-weights.js`, Float32 base64, ≈ 100 KB — `bundle.js` inlines JS, nothing is fetched: the landing's on-device promise holds).
  ONNX is the EXPORT CHECK only: `torch → onnx → onnxruntime` on 200 held frames must equal the JS inference to 1e-4 (`tools/test_vox.js`).
- **The pitch**: a second `Yin` (the sub stage's class) on a 200–1000 Hz band-passed copy of the hop stream, gated by the net's presence:
  `voxHz` = its f0 while `voxS` > .3 and the periodicity is above the Yin's own threshold, −1 otherwise; `voxConf` = voxS × periodicity.
  A pitch read on a MIX is unreliable whenever anything else is pitched in the band (the honest ceiling of this tier; step 3 fixes it).
- **Training** (`tools/truth/voxtrain.py`, torch CPU — minutes, not hours): Jamendo train + the library's confirmed windows (two library
  tracks held out with Jamendo test), the same mel front end re-implemented in numpy to the hop (a parity test: numpy mel == the ears'
  mel on one track to 1e-4 — the front end is where these models usually drift), BCE, gain / tilt / mix-level jitter as augmentation,
  frame F1 and AUC. **Targets**: F1 ≥ .88 on Jamendo test (the 2015 nets at ten times the size reach ~.9); on the library ruler `voxS`
  p50 inside the hand windows > 2× outside on every voiced track, < 5 % false-positive frames on Comptine, Raindrops' lead read as
  voice (by design), `voxHz` within a semitone of the stem's pYIN on ≥ 70 % of the voiced frames (the mix ceiling — recorded, not gated).
- **The keys and the tests**: FEATS entries, `state.js`, the fake's defaults, `EARS_FIELDS` + the ring, `help.js`'s text; `tools/test_vox.js`
  replays the PCM dumps (`tools/work/<T>.48000.st.f32`, as `test_ears.js`) through the stage and asserts the ruler per track; the bench
  (HARNESS "Bench protocol"): the stage ≤ .1 ms per hop on this machine, the frame budget unmoved.
- **The rig reads it** (the hook above) — the s1 real-md5 lines move, nothing else; the user's eye on `#scene=1` with the HUD's vox line.

## Step 3 — file mode: the Demucs lane (one plumbing session; the accurate lane, zero live cost)

- **The sidecar**: step 1's `<T>.vox.json` copied to `~/Music/RetinaRave/<T>.vox.json` (`tools/truth/voxlane.py <T>` does the copy and
  the format: `{ sr, hop: .01, voxS[], voxHz[] (−1 unvoiced: vprob < .5), voxConf[] }`). Local only by construction: `tools/serve.js`
  serves it from `$MUSIC` beside the track; `bundle.js` and `npm run build` cannot see it; nothing on retinarave.com changes.
- **The file source** fetches `/music/<T>.vox.json` beside the track (a 404 → no lane, silently); the map exposes it as a lane read at
  HEARD time like the map's other lanes (`mapOn`); the feature stage publishes `voxS / voxHz / voxConf` from the lane when it exists
  and from the live stage otherwise — **the lane wins** in file mode, the HUD's vox line says `lane` / `live`, and `&vox=live` forces
  the CNN for the A/B.
- **The A/B ruler** (`tools/vox-ab.js`, no GL): on the eight tracks, live vs lane — frame agreement %, pitch within a semitone %, the
  CNN's lag by cross-correlation (the ~100 ms the front end owes), per track; the table goes in DECISIONS with the step.
- A tab share has no lane and no file: live mode is the CNN alone, which is why step 2 comes first.

## Sessions, in order (lean: one worker each, a one-page brief, the gates once per step)

| step | worker | the brief | the gates |
|---|---|---|---|
| 1 | Fable | `VOCAL-SESSION-PROMPT.md` §1: install, the Demucs pass, `voxtruth.py`, the renders + the `! paplay` list, Jamendo fetched, the credits | nothing in the engine moves; the user's ear is the gate |
| 2 | Fable | §2: `voxtrain.py`, the stage + the net + the weights, the keys, `test_vox.js`, the bench, the rig hook | check 0 fail · npm test · the mel parity · the ONNX parity · the ruler per track · bench ≤ .1 ms/hop · fake md5 unmoved · real-md5: s1 lines only |
| 3 | Opus | §3: `voxlane.py`, the file source + the lane, the HUD line, `&vox=live`, `vox-ab.js` | check · npm test · the A/B table on eight tracks · fake md5 unmoved · real-md5 s1 lines (file mode) only |

**Open for the user** (answer in step 1's session, not before): (a) the weights' licence given Jamendo's CC terms — ship or keep local;
(b) in file mode, the lane wins or the CNN (recommended: the lane, the HUD says); (c) with `voxS` low the lead falls back to `interval`
(today's chroma proxy) or goes dark (recommended: the share goes to 0, the floor keeps its ink — S5b's split).
