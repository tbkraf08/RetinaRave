# Session brief — the vocal detector, step by step (2026-10-11; the plan: `docs/plans/VOCAL-PLAN.md`)

One step per session, in the user's order: **1. ground truth first · 2. live mode with the tier-2 CNN · 3. file mode with the Demucs
vocal stem.** Read the plan once; this page is the brief for whichever step is next. Rules: one worker, its own worktree + branch,
`model: fable` for steps 1–2 (design), Opus for step 3 (plumbing); the user tags; push / deploy only on the user's word; no audible
runs without saying so — renders go to `~/Music/RetinaRave-clicks/` with a `! paplay …` line each; credit Demucs / librosa / the Jamendo
set in THIRD-PARTY.md the day they are used; DECISIONS §122+; `node tools/license.js` on every new public file.

## Step 1 (next): ground truth
1. `pip install --user demucs librosa`; `demucs -n htdemucs --two-stems=vocals -o tools/work/vox/` on the eight tracks + the pad take.
2. Write `tools/truth/voxtruth.py <T>` → `tools/truth/<T>.vox.json` (share / f0 / vprob per 10 ms, the proposed windows, provenance).
3. Render `<T>-vox-windows.wav` (the mix + clicks at the proposed windows' edges) and `<T>-vox-stem.wav` (the stem) per track into
   `~/Music/RetinaRave-clicks/`; hand the user the `! paplay` list in listening order; mark Raindrops' lead 111–137 `kind: 'lead'`.
4. Fetch the Jamendo singing-voice dataset to `~/Datasets/jamendo-svd/`; note its licence line in the json's provenance.
5. Credits; DECISIONS §122 with the per-track table; the user's answers in track time → `windows_hand` + `windows.json`'s `vox` keys.
Stop at the listening list: the user's ear closes the step.

## Step 2: the CNN (after the hand windows exist)
The front end (40 log-mel × 32 hops, causal, per-track normalised), the ~25 k-parameter net hand-rolled in JS with its weights as a
JS module, the Yin pitch gated by presence, the three keys, `tools/test_vox.js` (the mel parity, the ONNX parity, the ruler per
track), the bench, then the rig's two reads. Targets and gates: the plan's §2.

## Step 3: the lane (after step 2)
`voxlane.py` → `~/Music/RetinaRave/<T>.vox.json`; the file source + the map lane (the lane wins, the HUD says, `&vox=live` for the
A/B); `tools/vox-ab.js` on the eight tracks. Gates: the plan's §3.
