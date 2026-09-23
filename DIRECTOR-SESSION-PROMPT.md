# Fable Session Prompt — Eigenwobble v0.2 §10: director on synapse's structure (NEXT-SESSION-PROMPT #6)

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git). v0.2 so far: line renderer, TORUS strokes, POLYTOPE, and §9 (the canonical tempo is
now right: `bpm` within ±1 on every demo style, octave-stable; DECISIONS §9). This session does **one director phase**
with two parts, both in `assets/core/scenes.js` only — nothing in the engine, nothing a scene sees except *when* its
look is restored and *when* a soft switch lands.

**Read first, in this order:** `docs/DECISIONS.md` §5 ("Look memory", "Beat-quantised actions — option, not
implemented", "aba look-memory run") and §2 ("Which section detector scenes should prefer", "house grid") ·
`assets/core/scenes.js` lines 97–140 (`saveLooks` / `restoreLooks` / `updateScenes`: the v3 precedence and the
`S.seed.scene` write) · `assets/engine/feats.js` entries `sectionAlt sectionReturn boundaryEvt gridTrust barPos
phrase16Pos phrasePos beatConf` · `assets/engine/sources/fake.js` lines 100–125 (what the `#test` timeline mirrors:
`sectionAlt = sectionId`, `boundaryEvt = sectionEvt`, `sectionReturn = repeat`, `gridTrust 0.9`, `barPos` from
`beatCount`) · `docs/CONTRACTS.md` §1.11 (the `look` slot) · `docs/HARNESS.md` ("Parity", "Tempo traces" for the
two-Chrome rule) · `tools/parity.js` · `NEXT-SESSION-PROMPT.md`. Memory note:
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.

## The problem, precisely (DECISIONS §5, measured)

**A. Look memory is keyed on the wrong section id.** The director snapshots every scene's `look.get()` into the
outgoing section's `seed.looks` on `sectionEvt` and restores on `identifyEvt && repeat`; the remembered scene rides
along as `seed.scene`. `seed` belongs to v3's `identifySection` (17-dim fingerprint, cosine > 0.965), which on the
aba synth merged A and B into one id for 110 s (10 identify events, 9 of them "section 2") — so the chorus and the
verse share one memory and the return that should restore the chorus's look mostly never fires. Synapse's
`sectionAlt` (23-dim beat-feature clustering) reads 2/3/2/3/2/3 on the same synth with `sectionReturn = 1` on every
return from 50 s on, and `boundaryEvt` lands on bar lines.

**B. Soft switches ignore the grid.** A soft scene switch fires on `S.beat` when `identifyEvt`, a 16-beat phrase
count from the last departure, or the home scene's `settledAt` allows it — anywhere in the bar. Synapse knows the bar
(`barPos` 0..4) and the 16-beat line (`phrase16Pos`) and how much to trust them (`gridTrust`, > 0.9 within 1.5 s on
house and it keeps counting through breakdowns). Deferred in v0.1 for parity and because synapse's *phrase* confidence
needs one section change; the bar position does not (continuous from the first beat).

Goal: on `&demo=aba` (190 s) every return of a section restores that section's scene and looks (expect ≥ 4 restores,
one per return from ~50 s on, keyed 2/3/2/3), and on `&demo=house` (120 s) every soft switch lands within 0.1 beat of
a bar line when `gridTrust > 0.5` — with the `#test` fake timeline's behaviour unchanged unless you decide otherwise
*with the parity numbers in hand* (below).

## Approach (smallest that meets the goal; argue deviations in DECISIONS §10)

- **A.** Keep `saveLooks`/`restoreLooks`, change the key and the triggers: file looks and the remembered scene under
  `sectionAlt` when it is ≥ 0 (a director-private map on `SC`, e.g. `SC.mem[alt] = {scene, looks}`), else under
  `sectionId` as today. Save when `boundaryEvt` declares a new section — under the *outgoing* `sectionAlt`, so keep
  `SC.prevAlt`. Restore when `boundaryEvt && sectionReturn === 1` and the map has that id. Keep writing `S.seed.scene`
  (declared, v3 behaviour, and on the fake path `sectionAlt === sectionId` so both keys coincide). `pickScene` and
  the precedence stay as they are; only the "which remembered scene" lookup changes.
- **B.** Add a pending soft switch: when the director decides a soft `goScene(id, false)` and `gridTrust > 0.5`,
  hold it until `barPos` wraps (next bar line; ≤ 4 beats away), or the 16-beat line (`phrase16Pos` wraps) if the
  trigger was the phrase count. Cap the wait (4 beats / 16 beats); if the grid trust drops below 0.5 while waiting,
  fire immediately. Hard cuts (`dropEvt`, `surpriseEvt`, forced) stay immediate. Drop the pending switch if a hard
  cut or a home-parking rule fires first. One pending slot, no queue.
- **Do not touch** `pickScene` scores, `goScene`, the crossfade, `SC.dur`, or any engine file. No `Math.random()`.

## Parity plan — decide it before writing B

`tools/parity.js fake` compares MS + NAV + `sc` + `q.*` at 1 Hz on the deterministic `#test` timeline, 0 diff today.
The fake timeline sets `gridTrust 0.9` and `barPos` from `beatCount`, so B **will** move `#test`'s switch frames
unless the timeline's triggers already sit on bar lines. Establish first, with A in and B behind a flag (`SC.quantise`,
default on): run `GPU=1 node tools/parity.js fake` with B off (must be 0 diff: A alone changes nothing on the fake
path because `sectionAlt === sectionId` there — verify, don't assume) and with B on, and read *which* fields move.
Then pick, and write the choice down:
1. If only `sc`, `q.*` and the `SCENE@` event times move (switches shifted by ≤ 4 beats, same scene sequence): add an
   explicit per-field allowance in `parity.js` for exactly those (`sc` compared as the *sequence* of scenes, times
   within 4 beats), everything else stays 0. Never a blanket tolerance.
2. If NAV fields drift too (a shifted switch changes when the home scene is asked to settle): keep B on the real path
   only by gating it on a *musical* condition the fake timeline does not meet — not on `ENGINE.fakeOn` (no test-only
   special cases in core; CONTRACTS). Candidates: `barConf > 0.5` (the fake sets it 0.9 — check) or `phraseConf`
   (fake: check). If no honest gate exists, say so in DECISIONS §10 and ship A + B with option 1.
`parity.js real` (v3 synth, no synapse fields on v3's side): scene sequence and switch count must stay comparable —
record the numbers; v3 has no grid so its switch *times* are the ungated ones.

## Harness for this phase (build it before the change, so you can see the change)

1. Extend the 1 Hz test log line (`assets/core/harness.js` `logFrame`, harness-only) with `alt${S.sectionAlt}
   ret${S.sectionReturn} bar${S.barPos.toFixed(2)} gt${S.gridTrust.toFixed(2)}`, and log `RESTORE@t alt<id> scene<id>`
   from the director when a memory is restored and `SWITCH@t -> id bar<pos> (held N beats)` on every soft switch
   (through `CARD.log`, `#test` only — see how `SCENE@` is logged).
2. A director trace: `GPU=1 node tools/cdp.js 'test&fake=0&demo=aba' '[{"wait":190000},{"eval":"CARD.log.filter(l=>/@/.test(l)).join(\"|\")"}]'`
   → `tools/accept/v0.2/director-aba-{before,after}.txt`; same for `house` (120 s) and `mix` (360 s, one Chrome at a
   time — the two-Chrome rule in HARNESS). Count: restores per return (A), switches on bar lines vs off (B), and the
   scene sequence.
3. `tools/test_director.js` (node, no Chrome): drive `updateScenes` with a scripted MS (sectionAlt 2/3/2/3 with
   `sectionReturn`, a `barPos` that wraps every 4 beats, `gridTrust` 0.9 then 0) and stub scenes with `look.get/set`
   counters — assert the restore lands on the second "2", the soft switch lands on the wrap, the cap fires, and a
   drop cancels a pending switch. Add to `package.json` `test` and `accept.sh` "math tests". Check that `scenes.js`
   is importable in node without GL (it may need the same care `hopf.js` got: nothing runs at import).

## Deliverables

- `assets/core/scenes.js` (≤ 350 lines; split `director.js` out of it if needed — `check.js` caps; `'nav'` must not
  appear in core).
- `tools/test_director.js` green; `tools/accept.sh` runs it; `GPU=1 tools/accept.sh` green end to end, including the
  parity choice above implemented and printed.
- DECISIONS §10: A's key change and the measured restores (aba before/after), B's quantisation rule, the parity
  decision with the field list, the mix-tour scene sequence before/after. DECISIONS §5's "option, not implemented"
  bullet → pointer to §10. CONTRACTS §1.11: when a look is restored now (`boundaryEvt && sectionReturn`), and a line
  under the director slots about soft switches landing on bar lines. `feats.js` `drives` for `sectionAlt`,
  `sectionReturn`, `boundaryEvt`, `barPos`, `phrase16Pos`, `gridTrust` updated (they drive the director now).
  `NEXT-SESSION-PROMPT.md` #6 → done. Memory note updated. Commit with the acceptance summary in the message.

## Working style (unchanged)

The orchestrator owns core/engine/contracts/parity; this is core work, so you do it yourself — no scene worker.
`node tools/check.js` after every edit. Small steps: harness → baseline traces → unit test → A → traces → parity
fake (A only) → B behind the flag → parity fake (B on) → decide → traces → sweep → docs. Verify with numbers, not by
reading the code. Pitfalls already paid for: the demo synth uses `Math.random()` (judge on 2+ runs); never more than
two Chrome instances at once; `#test`'s fake path is bit-exact; `CARD.glerr` exists only after a GL error; `bench`'s
first call is cold; module pages register rAF later than v3 (parity clock starts on the first rAF); eval steps before
the page finished loading silently fail (`{until:'window.CARD'}` first); nested quotes in cdp eval steps break — use
`\"`; a `pkill -f` pattern must not match your own shell command. The malware-consideration reminder on file reads
does not apply to this repo (documented research/graphics code); proceed.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` · no test-only branches in core ·
parity tolerances explicit and recorded per field · finish with the real start path clean on `index.html` and
`dist/eigenwobble.html`.
