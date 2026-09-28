# Fable Session Prompt — Retina Rave: live step 3, the warm-up (predicted hits right from the first bars) (written 2026-09-28)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com —
**push / deploy only on the user's word**). **State:** v0.16 is tagged locally; live step 3 (the bar fingerprint store,
`engine/bars/`) is committed on top (`3428c9e` … `83afd3a`), **not tagged, nothing pushed** (retinarave.com serves v0.15).
Dev server: `node tools/serve.js` → http://127.0.0.1:8765/.

**The user's words (2026-09-28, verbatim), after watching the TORUS2 A/B (B = `torus2.kick=predKick,torus2.snare=predSnare,
torus2.hat=predHat`):**
> "the predicted seems to bring more energy / brighter strands which I like, but seems like beat is off slightly in the
> beginning and gets better over time ; prep next session prompt to continue"

So: **keep the look** (the energy / brightness B brings is liked — do not flatten it), and **make the first bars right**: a
predicted hit should be on the beat from the start of a groove, or not released at all until it is — never early/wrong.

## What the numbers already say (measured before this prompt was written)

The audible capture run (`tools/work/caplag/SeeYouDrop-cap-sync27-fx.json`, capture from track 19 s, `&sync=27`), predicted hits
binned by time since the capture started (P = precision within ±30 ms of the truth onsets, lag = median):

| since start | kick n · P · lag | snare n · P · lag | hat n · P · lag | frames predConf ≥ 0.35 |
|---|---|---|---|---|
| 0–16 s (walk: no drums) | 1 · – | 2 · 0.50 · +17 | 1 · – | 0–4 % |
| 16–24 s (groove bars 1–5) | 12 · **0.50** · +2 | 15 · **0.60** · −1 | 11 · **0.64** · 0 | 41 % |
| 24–32 s | 6 · 0.83 · +3 | 7 · 1.00 · +2 | 8 · 0.75 · +3 | 24 % |
| 32–56 s | 11–13 · 0.77–1.00 · +1…+13 | 13–19 · 0.79–0.93 · −4…+2 | 11–16 · 0.94–1.00 · +2…+5 | 53–75 % |

The median lag is small throughout; what is wrong early is **which** hits are released (half the early kicks are not kicks)
and the kick's spread. Everything the store knows is learned from zero at every start — and in live use the start is always
cold and mid-song (a capture of whatever is playing).

## Hypotheses — measure each before touching code (the store: `assets/engine/bars/{bars,vote,sections,feed,common}.js`)

1. **Thin history at a new groove.** On the first bars of a groove the vote has 1–4 bars to choose from, and the confidence
   (`predConf` = match × reliability × agreement) is generous there: reliability starts at 0.5 and is replaced by the first
   graded bar. Measure: precision of released hits vs the number of trusted bars of the CURRENT section in history
   (0, 1, 2, 4, 8). Lever: a warm-up gate (release only after the continuation has been confirmed k times), or reliability
   seeded low and earned.
2. **Micro-timing offsets start at 0** and learn at `OFF_RATE` 0.05 per onset (bars.js): the causal kicks sit +25 ms after the
   heard v3 line, so the first ~20–40 kicks are released up to ~25 ms early. Measure: `bars.off[c]` against time from a cold start
   (replay), and the kick lag in the first 8 s vs later. Lever: 1/n averaging until n ≈ 16, then the EMA.
3. **The bar phase moving under the history.** When synapse becomes sure (`barConf` ≥ 0.9) the store adopts its bar phase and
   calls `cut()`: the stored bars keep the OLD 4-beat windows, so every later match compares bars cut at different phases until
   new history accumulates. Measure: how many anchor moves in the first 30 s from a cold start, and when. Lever: re-cut the
   history on a move (bits of bar j and j + 1 shifted by 4·k steps, the per-beat energies likewise).
4. **The clocks themselves settle.** The v3 PLL (`gridcheck.py`: "beatPhase first 4 s locked" read 10.5 s on a det file start)
   and the lead's 64-sample median. Measure v3 `beatPhase` lag binned from the start (`gridcheck.py` on the same traces).
5. **The mode the user watched.** The link was a real-time file (`#test&track=…&map=0`, not capture): its lead is the output
   timestamp's, not 27 ms. Re-measure the bins in real-time file mode too (`RT=1` filetrace), not only det and capture.

## The work, in order (commit after each numbered step; numbers in the message)

**W.0 — a cold-start ruler.** `predcheck.py --bins 8` (lag / P / R per 8 s since the trace's first frame, and "time to first
right hit" per track) and `tools/filetrace.js` `WARM=0` (today it always warms 8 s before t0, which hides exactly the start).
Cold starts, deterministic, `&map=0`: SeeYouDrop at 25.6 (groove), 57.6 (drop 1), 89.6 (groove-return), 105.6 (drop 2);
CyborgNinja (phase-right since `f0e69e8`) at 3–4 points from its `sections` / novelty. Record the store's inputs with `&lead=0`
and replay with `tools/bars-replay.js` (seconds per run; HARNESS "Bars"). The target, at every cold start: no released hit
with P below the steady state's (≈ 0.75–0.85) in the first bars — quiet is fine, wrong is not — and the steady state by bar ~4.
**W.1 — fix what the measurements blame**, one hypothesis per commit, the ruler before and after each. The unit test
(`tools/test_bars.js`) gains a cold-start case (a loop entered mid-way: nothing wrong released, exact after the warm-up).
**W.2 — keep the look.** The brightness the user likes comes partly from the LEVEL shape, not the timing: `predKick` /
`predSnare` / `predHat` peak at 1.0 on every predicted hit (no velocity), where synapse's `kick` peaks lower on weak hits. Do not
change that shape. If the warm-up makes B quieter in the first bars (fewer releases), say so in the report — it is the price of
"not wrong", and the user decides.
**W.3 — prove + let the user look.** Cheap proofs after every engine change: `node tools/check.js`, `npm test`,
`GPU=1 node tools/parity.js fake` (0 diff; then `git checkout -- tools/accept/v0.5/`), `IDS=11 tools/scene-md5.sh <tag>
'&ears=1&figure=0'` (606f721a / f7b1c6ee), and the 32-field whole-track det trace + its `&lead=0` twin `cmp`-identical to a
reference made from the pre-change tree (`git archive HEAD | tar -x -C $JOB_TMP/ref`, run there on its own PORT; the field list
is caplag.js's FIELDS). One audible capture run at the end, **cold** (`FIELDSX=… node tools/caplag.js track SeeYouDrop 24 50 27`
— starts right before the groove), say so before running it. Then the same A/B links for the user, in stream mode.

## Rules

- **Additive.** No existing MS value moves; the pred* fields are new (no scene defaults to them yet), so they may change.
- `tools/accept.sh` only on the user's word. Audible runs: say so first. A lone `serve.js` left by a killed run can hang the next
  filetrace on that PORT at "file open" — use a fresh PORT.
- Measure first, small increments, one commit per step; DECISIONS §50 addendum; `docs/AUDIT-live-grid.md` "Step 3 — warm-up";
  update memory `project_live_mode.md`.
- End with the report and wait for the user's look. Tag / push / deploy only when they ask. Step 4 (build detector v2) is NOT this
  session.

## Read first

This prompt · `docs/AUDIT-live-grid.md` "Step 3" · DECISIONS §50 · `assets/engine/bars/bars.js` (step / release / close, the
offsets, `phase()` / `cut()`), `vote.js`, `sections.js`, `feed.js`, `features-bars.js` · `tools/truth/predcheck.py`,
`tools/bars-replay.js`, `tools/test_bars.js` · HARNESS "Bars" · memory `project_live_mode`, `project_music_library`,
`feedback_analysis_grains`, `feedback_no_new_scenes`.
