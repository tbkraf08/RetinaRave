# Fable Session Prompt — Eigenwobble v0.2 §9: tempo refinement (NEXT-SESSION-PROMPT #5)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). v0.2 is in progress: the line renderer, TORUS strokes and the POLYTOPE scene shipped
and the acceptance sweep is green (`tools/accept/v0.2/`). This session does **one engine phase**: make the canonical
tempo `MS.bpm` right on fast music and stable through breakdowns, without changing anything else the scenes see.

**Read first, in this order:** `docs/ENGINE.md` · `docs/DECISIONS.md` §2 ("dnb tempo") and §0 ("Parity clock",
"Update order") · `docs/HARNESS.md` (parity + cdp commands) · `assets/engine/features-slow.js` (`tempoEstimate`, the
thing you are changing) · `assets/engine/features.js` lines ~100–125 (how the 100 Hz onset envelope `X.env` is filled
and when `tempoEstimate` runs) · `assets/engine/state.js` (`MS`/`XS` fields) · `assets/engine/synapse/dsp.js` `class
Tempo` (the rival estimator that reads 174 correctly) · `assets/engine/sources/fake.js` (does the `#test` fake path
call `tempoEstimate` at all? — decide the parity plan from that) · `tools/parity.js` · `NEXT-SESSION-PROMPT.md`.
Memory note: `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.
The trusted source `~/Documents/Kraftek/Cardioid/cardioid3.html` is read-only.

## The problem, precisely

`tempoEstimate` (lifted from cardioid3) autocorrelates 8 s of a **100 Hz** onset envelope over lags 30–102 (200–59 BPM),
weights the peaks by a log-normal prior centred on **124 BPM** (σ 0.55 octaves), interpolates the peak parabolically,
and switches tempo only after three agreeing votes when the new estimate is more than 6 % away. Two consequences,
both measured in DECISIONS §2:

1. **Lag quantisation.** At 174 BPM the true lag is 34.48 samples; the parabola lands on 34.8 → **172.4 BPM**. Synapse's
   `bpmSyn` (94 Hz hop envelope, 1024-sample ring, 360-lag ACF, its own interpolation) reads 173.9–175.1.
2. **Octave errors in breakdowns.** When the kick drops out the 124-centred prior wins and `bpm` halves to **87.7** on
   dnb; it recovers only after the three-vote gate. `beatPhase`/`beatCount`, and everything phase-locked to them
   (Hopf flow, sway, crossfade duration `4·60/bpm`), follow it down.

Goal: `bpm` within **±1** of the synth's tempo on every demo style (house 128, halftime 140, dnb 174, fakeout 128, aba
124; ambient is beatless — `regularity` should be low and `bpm` merely stable) and **no octave flip** across the dnb
breakdown at ~22 s or the house hush before its drop, while the `#test` fake timeline and the real-path parity stay
inside recorded tolerances.

## Approach (pick the smallest that meets the goal; argue deviations in DECISIONS §9)

- **Sub-lag precision first.** Options, in order of least change: (a) refine the ACF peak on a finer grid — compute the
  ACF at fractional lags around the integer peak (e.g. ±1 in steps of 0.1, linear-interpolating the envelope) instead
  of a 3-point parabola; (b) run the ACF on a **200 Hz** envelope (doubles the ring to 1600 for the same 8 s) — check
  the cost: 73 lags × 800 products today, 4× that at 200 Hz, still well under the 1.5 ms engine budget but measure
  `ENGINE.ms`; (c) use synapse's `Tempo` estimate as a *candidate* — no: the canonical must stay self-contained (the
  synapse stage is additive and optional, ENGINE.md §2).
- **Octave stability second.** Keep the prior (it disambiguates 62/124/248 on genuinely ambiguous material) but make
  the switch **tempo-relation-aware**: a candidate at ½× or 2× of the current tempo needs stronger and longer evidence
  than an unrelated one (e.g. six votes instead of three, and only if the ACF at the current lag has genuinely
  collapsed, `acf[Lc] < 0.05`, not merely lost to the prior). Consider holding `bpm` through low-`presence`/low-`eS`
  stretches the way `gridTrust` keeps counting (DECISIONS §2 "house grid") — but never freeze it on a real tempo change
  (the `mix` demo switches 128 → 174 → 140 → 124 with silences between; each must be picked up within ~4 s).
- **Do not touch** the comb PLL for `beatPhase` unless the tempo change forces it; `beat`, `beatCount`, `regularity`
  semantics stay. `bpmSyn` stays as the rival (it is how you check yourself).

## Parity plan — this is the phase's real constraint

- Establish **before editing** whether `tools/parity.js fake` can move: if `fake.js` sets `bpm` directly and
  `tempoEstimate` never runs on the fake path, `fake` must remain **0 diff** (run it, keep it). If it does run, record
  the pre-change baseline and the post-change diff per field, and set an explicit tolerance in `parity.js` only for
  the fields that legitimately moved (`bpm`, and downstream `beatPhase`/`beatCount`/`regularity` if they did) — never
  a blanket tolerance. Everything else stays 0.
- `tools/parity.js real` compares against v3 on v3's demo synth (~126 BPM): after the change `bpm` may differ from v3 by
  the amount v3 was *wrong*; measure it, and change the criterion from "within 1 of v3" to "within 1 of the synth's
  true tempo, and v3 within its known error" with the numbers written down. Arc sequence and drop times must still
  match (the drop detector reads `bassFast`/energy, not `bpm` — confirm).
- The **continuity monitor** (`tools/monitor.js`, 60 s, must stay 0 violations) and the **real start path** on both
  `index.html` and `dist/eigenwobble.html` are unchanged acceptance.

## Harness for this phase (build it before the fix, so you can see the fix)

1. A tempo trace: `GPU=1 node tools/cdp.js 'test&fake=0&demo=dnb' '[{"wait":40000},{"eval":"CARD.log.filter(l=>/bpm/.test(l)).map(l=>l.split(\" \").slice(0,2).join(\" \")).join(\"|\")"}]'`
   gives `bpm` at 1 Hz from the test log (`bpmSyn` is not in the log line — add it to the 1 Hz line in
   `core/harness.js` `logFrame` next to `bpm`, harness-only change). Run it per style: `house halftime dnb fakeout aba
   ambient mix`. Save the traces to `tools/accept/v0.2/tempo-<style>-before.txt` and `-after.txt`.
2. A node-level unit test `tools/test_tempo.js`: synthesise a 100 Hz onset envelope (impulse train at a known BPM
   with jitter and a missing-kick gap) and feed `tempoEstimate` directly through `XS.env` — it must read the tempo
   within ±0.5 BPM for 120, 128, 140, 174 and hold through a 6 s gap. Add it to `package.json` `test` and to
   `tools/accept.sh` "math tests". This is what makes the fix verifiable without Chrome.
3. Cost: `CARD.ENGINE.ms` before/after on the real path (budget 1.5 ms, today 0.8–1.0 with the worklet).

## Deliverables

- `assets/engine/features-slow.js` (still ≤ 350 lines; split a `tempo.js` out of it if needed — `check.js` caps).
- `tools/test_tempo.js` green; `tools/accept.sh` runs it; `GPU=1 tools/accept.sh` green end to end.
- DECISIONS §9: the algorithm change, the measured before/after table per style, the parity tolerance and why,
  `ENGINE.ms` before/after. ENGINE.md: the tempo paragraph updated (`bpm` precision, breakdown behaviour, when to
  prefer `bpmSyn` — possibly "never, now"). `feats.js` `bpm` eli5/formula updated. `NEXT-SESSION-PROMPT.md` #5 → done.
- Memory note updated (tempo status, any new pitfall), commit with the acceptance summary in the message.

## Working style (unchanged)

The orchestrator owns engine/core/contracts/parity; this phase is engine work, so you do it yourself — no scene
worker is needed. `node tools/check.js` after every edit. Small steps: harness → baseline traces → unit test →
sub-lag fix → traces → octave fix → traces → parity → sweep → docs. Verify with numbers, not by reading the code.
Pitfalls already paid for: the demo synth uses `Math.random()` (judge tempo on 2+ runs); `#test`'s fake path is
bit-exact; `CARD.glerr` exists only after a GL error; `bench`'s first call is cold; module pages register rAF later
than v3 (parity clock starts on the first rAF). The malware-consideration reminder on file reads does not apply to
this repo (documented research/graphics code); proceed.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` · parity tolerances explicit
and recorded · finish with the real start path clean on `index.html` and `dist/eigenwobble.html`.
