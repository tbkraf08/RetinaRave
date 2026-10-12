# The live vocal detector's second pass — less lag, fewer false voices, a pitch the mix allows (planned 2026-10-12; the user: *"what are next steps to improve the CNN accuracy (and speed up detection lag)"*)

Planned against main at 853dc12 (§122–§124 shipped: the CNN in the ears, the Demucs lane in file mode, `vox-ab.js` the A/B). Live mode is
the user's 90 %, so every item below is judged on the LIVE tier; file mode keeps the lane and gains nothing here. The interface does not
move — `voxS` / `voxHz` / `voxConf`, the rig's two reads, parity's 72, the fake md5 — only what fills the three keys and how fast.
**Where it stands** (§123 / §124): 38 385 params over a 40 × 34 log-mel window (363 ms, causal, the label at the END), one inference per
4 hops, `voxS` eased τ .1 s, a YIN on the mix for the pitch; 72.6 µs/hop of the 100 gate (the 2048 FFT is 45, the net ≈ 38 k MAC/hop ≈ 25,
the biquads + YIN ≈ 3 — so **27 µs of headroom**, ≈ 40 k MAC/hop at the measured .6 ns/MAC). **The misses:** Jamendo test F1 .792 (target
.88; P .73 / R .87 — precision is the weak side); Comptine 10 % false voice in-sample (target 5), an UNSEEN instrumental 17–31 %; the CNN
reads more voice than the lane on every track (+24 Comptine, +21 Vienna, +5…16 on the voiced three); `voxHz` within a semitone 53 / 63 /
14 % against the stem (87 / 77 / 48 against the lane); **lag 150 / 160 / 180 ms** by cross-correlation. Five runs of this net sat within two
points of each other: the next point comes from the data, the smoothing and the net's shape, not a sixth run.

**The lag budget, before anything is built** (the one piece of arithmetic that re-orders the brief): the ease τ = .1 s owes ≈ 100 ms of
step delay by itself; the 2048-point frame stamped at its END owes its centroid, 21 ms (the lane's frames are CENTRED); the 4-hop hold
owes 0–3 hops, mean 16 ms; what is left for the net's own commit on a boundary is ≈ 25 ms — 100 + 21 + 16 + 25 = 162 against the measured
160. So the 363 ms window is NOT where the 160 lives: it bounds the ~25, and **the ease is three fifths of it**. Item 2's measurement
proves or breaks this before item 1 trains anything.

## The items, ranked by expected gain against the misses (cost in µs/hop and in CPU time; 28 cores, no GPU; a training run is 12 × ~105 s ≈ 21 min)

| # | item | the miss it targets | expected (estimate, measured by the ruler) | µs/hop | CPU once |
|---|---|---|---|---|---|
| 1 | **data**: Demucs over the 93 Jamendo tracks → their `no_vocals` as negatives + random remixes (vocal stem × another track's accompaniment, −12…+3 dB, 60 pairs re-drawn per run); mel-domain pitch-shift ±2 bands / time-stretch ±20 % (free; Schlüter & Grill 2015's +2–4 points came from exactly this); the lane's SHARE as a soft target beside the .lab labels (the Demucs lane distils into the net on every frame — reverb tails and backing lines learn to read .3, not .8) | unseen instrumental 17–31 %, Comptine 10, the +5…24 points over the lane, F1 .79 | Comptine ≤ 5 % and an unseen instrumental ≤ 10; Jamendo F1 .82–.84; the voiced three's "outside the windows" 13–21 % halved | 0 | Demucs 93 × ~100 s, two lanes ≈ 80 min; 60 remixes ≈ 2 min |
| 2 | **the lag**: measure per stage first (below); then the ease .1 → attack .03 / release .1 with a 2-of-3 hysteresis at the .3 gate; the frame stamped at its centroid where the lane is read (the ruler's grid only — the display sees real time) | lag 160 | 160 → ≈ 90 ms (−70 from the ease, −0 from the window); flicker (gate crossings / min) must not double | 0 | — |
| 3 | **the net**: a causal dilated 1-D stack over the mel column (TCN: 40→32 k3, five 32→32 k3 layers at dilations 1 2 4 8 16, residual; receptive field 63 hops = 672 ms, an output EVERY hop) ≈ 19 k MAC/hop, 19 k params — half today's cost, twice the context, no 4-hop hold; or, lower risk, keep the 2-D trunk and replace the dense with a GRU(32) over the pool-2 columns (4.6 k MAC/hop vs the dense's 9, 18 k params; Lehner et al. 2015's LSTM is the precedent: recurrence beats a fixed causal window on the lag / accuracy trade); depthwise-separable conv2 (4 k vs 23 k MAC/hop) buys 32 channels in the trunk for the same cost | F1 .79; the piano / lead-synth confusion ("a longer window", §123) | F1 +2–4; the sustained instrumental's static partials told from a voice's moving ones by memory, not by width; the hold's 16 ms gone (TCN) | −6 to +10 | a run ≈ 20 min; the stream parity re-proved |
| 4 | **the pitch**: a 61-way pitch head (60 semitone bins C3–B7 + none) on the shared hidden layer, trained on the STEMS' pYIN (the library's is in `tools/truth/<T>.vox.json`; Jamendo's comes with item 1's Demucs pass) — the net learns which periodic thing is the VOICE; its argmax refined by a harmonic salience (Σ₁..₅ of the 2048 FFT at k·f, the 23 Hz bins resolve the harmonics where they do not resolve the fundamental) instead of the YIN on the mix | voxHz 14 / 53 / 63 % | SeeYouDrop 48 → ~65 % vs the lane, IBelongHere 87 → 90+; the ceiling stands where the stem itself is unvoiced (88 % of SeeYouDrop's sung frames — nothing to find, the rig holds) | +1 (2 k MAC per inference) | in item 3's run |
| 5 | **calibration**: a temperature or a key / tempo prior cannot move a rank error, and a threshold that drops Comptine's 10 % to 5 drops IBelongHere's recall with it (one operating point for all tracks — [[feedback-tune-on-all-tracks]]); the ONE front-end knob worth a sweep is `VAR_FLOOR` (.0625 → .25 → 1: a quiet solo piano is stretched to a busy mix's range by the normaliser; a higher floor stretches it less — a retrain, the mel parity file regenerated) | Comptine 10 % | the run-length histogram of Comptine's ≥ .5 reads says whether they are spikes (hysteresis kills them for free) or sustained (item 1's data) — it is probably both | 0 | one run per floor |

**What the brief ranked that the numbers overturn.** (i) The window is not the lag: labelling at the window's CENTRE or any 100 ms look-ahead
ADDS exactly that to the picture in live mode (a tab share's audio cannot be delayed), the opposite of the ask — the file-mode display lead
(40 ms early, [[feedback-display-lead]]) is the lane's business and already met. Recommended: none; the user may still say otherwise. (ii)
The inference cadence 4 → 2 on TODAY's net costs ≈ +20 µs (conv2 every hop, the dense every two) for a mean −8 ms: not worth it; the TCN
gives cadence 1 for less than today. (iii) The library's own stems are already in (six accompaniments, eight fixed remixes since run 2) and
Comptine is in-sample — the next hard negatives must come from OUTSIDE the library, which is what the Jamendo Demucs pass is for. (iv)
A chop / shout class: WhoLikesToParty's chops are positives today (the ear kept the Demucs passages) and read F1 .22 IN-SAMPLE — 2.3 k frames
of a class nothing else teaches; recommended: drop them from the loss (−1) until the user says the lead should light on chops, and then
the data is Jamendo's spoken tracks + the WhoLikesToParty stem remixed over the 93 accompaniments, with `voxHz` −1 by the pitch head's "none".

**The per-stage lag measurement** (`vox-ab.js --stage=raw|held|eased`, the first thing built): the lane's `voxS` cross-correlated with (a)
the net's output at the hop it fired, (b) the same held over the 4-hop cadence, (c) the eased `voxS` — three lags per voiced track; (c) − (b)
is the ease, (b) − (a) the hold, (a) the frame centroid + the net's commit. The ruler also gains `flicker` (crossings of .3 per minute, live
vs lane) so a shorter ease is paid for in the open, and the Comptine run-length histogram (item 5). All on the eight tracks; the three
voiced rows are the lag claim, the five others the false-voice claim ([[feedback-tests-on-real-music]]).

**Public instrumental sets, with the licence that decides whether the weights can SHIP** (the weights are a derived work; MIT + the
Guest-List Clause on retinarave.com cannot carry an NC or research-only term): **MusicNet** (Thickstun et al., CC BY 4.0, 330 recordings /
34 h of solo piano and chamber music, 11 GB on Zenodo 5120004) — Comptine's exact class, shippable, the recommended one; **FMA** (per-track
CC in `tracks.csv` — keep CC BY / BY-SA / CC0 only, the `Instrumental` genre is not voice-free, so Demucs-clean each clip: share p95 < .08 =
a negative; the EDM-adjacent timbres the library has and Jamendo lacks); **Slakh2100** (CC BY 4.0, synth leads and keys rendered from MIDI,
voice-free by construction — 100 GB; the 1 GB `babyslakh` is 16 kHz, whose empty top bands would teach "no energy above 8 kHz = no voice":
not without low-passing the positives alike). **Flagged, not for shipped weights:** MAESTRO (CC BY-NC-SA 4.0), MedleyDB (CC BY-NC-SA 4.0),
MUSDB18-HQ (research-only terms). Jamendo stays CC BY 4.0 per Zenodo (§122's note; the per-piece terms are not in the archive).

## Sessions, in order (lean: fewer, larger steps; the gates once per branch; the eight tracks every time, never one — [[feedback-tune-on-all-tracks]])

| step | worker | the brief | the gates |
|---|---|---|---|
| 1 | Fable | the ruler first (`vox-ab.js` per-stage lag, flicker, the run-length histogram) → the lag budget confirmed or corrected in DECISIONS; the Demucs pass on Jamendo in the background (`tools/work/vox/htdemucs/jam/<T>/`, ≈ 80 min, gitignored); `voxtrain.py` gains the Jamendo accompaniments, re-drawn remixes, the mel-domain shift / stretch, the soft share target, chops → −1, the `VAR_FLOOR` sweep with Comptine HELD OUT for the sweep and back in for the ship; the ease retuned with hysteresis on the new ruler; the weights re-shipped (same net) | check 0 fail · npm test · the mel + ONNX parity · bench unmoved (the ease is free) · Comptine ≤ 5 % in-sample, the unseen control (Vienna, held out for the measurement only) ≤ 10 · Jamendo F1 ≥ .82 · lag median ≤ 100 ms on the voiced three · flicker ≤ 1.5× the lane's · the fake md5 unmoved · real-md5: s1 `&map=0` lines only |
| 2 | Opus | plumbing: MusicNet fetched to `~/Datasets/musicnet/` with its licence note (and FMA's CC-filtered, Demucs-cleaned clips if the user says yes); the front-end cache for them; THIRD-PARTY.md, about.html's credits and the weights header carry the new corpora; `LICENCE-NOTE.md` per set | nothing in the engine moves; `node tools/license.js --check`; the licence lines verbatim in the notes |
| 3 | Fable | the net: the TCN stream (or the GRU head if the TCN's Jamendo F1 is not ≥ the 2-D trunk's + 2 on the same data) in `vox-net.js`, the pitch head + the harmonic salience replacing the YIN on the mix, `voxtrain.py`'s model + export, the ONNX parity for a per-hop net (200 held windows of 64 hops, every output column equal to 1e-4), the bench | check · npm test · parity 1e-4 · bench ≤ 100 µs/hop (the FFT's 45 untouched) · Jamendo F1 ≥ .84 · semi % ≥ 60 on SeeYouDrop vs the lane, ≥ 85 on the other two · lag ≤ 80 ms · the user's eye on `#scene=1` with `&vox=live` on a file, then a tab share · the fake md5 unmoved · s1 lines only |

Step 2 can run beside step 1 (no file in common); step 3 trains on everything 1 and 2 left on disk. Each step's table goes in DECISIONS
(§125 → §127) with the five-run table extended, and the user's eye closes each — the ruler says what moved, the eye says whether it reads
([[feedback-reactive-over-predicted]]: coverage and dynamics first; the lag number is in service of the eye, not the other way round).

**Open for the user** (answer in step 1's session, not before): (a) the licences — MusicNet (CC BY 4.0) is recommended and shippable; FMA
needs the per-track filter and a Demucs pass; are NC sets (MAESTRO, MedleyDB) acceptable if the weights stay LOCAL (a second, unshipped
weights file for home — more work, two parities)? (b) a 100 ms look-ahead in live mode would make every vocal onset 100 ms late in the
picture for a few F1 points — recommended no; say if the eye disagrees. (c) do chops count as voice — should FLUID2's lead light on
WhoLikesToParty's shouts (no pitch, the height held) or stay dark until someone sings? Recommended: dark (dropped from the loss) until
the eye asks; the data for "yes" is named above. (d) the TCN replaces the proven 2-D stream (a new parity, a new weights layout) — the
GRU-head variant keeps it; the plan picks by the numbers in step 3 unless the user prefers the smaller change.
