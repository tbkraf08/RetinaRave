# Fable Session Prompt — Eigenwobble v0.2 §17: ship v0.2 — the real-window audit, the tag, and the v0.3 triage

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git, branch `master`). v0.2 is **feature-complete and swept green** at the head of `master`
(commit `f72a6f4` + 1: "§16 accepted"): six scenes (NAV 0 + DRUM 4 · DUST 1 with the Hopf-fibre overlay at 4×12×48 ·
MANDALA 2 · TORUS 3 · POLYTOPE 5 with the 0.24 pole gate · FEIGEN 6 on the field/colour split and the zoom ladder),
the merged engine, the director with look memory on `sectionAlt`, the transition slot (morph default, mixs
byte-identical), the help view, row-delta `hist` upload, `ctx.budget`, NAV's interior smoulder, and a harness that
proves each of them (`GPU=1 tools/accept.sh` 0 FAIL, `accept/v0.2/accept-16.txt`). Nothing on the v0.2 list is open.
**No tag has ever been cut** (`git tag` is empty; v0.1 "shipped" on 2026-09-22 as a commit, not a tag).

This session does three things, in order, and none of them is a feature: (1) the audit a headless harness cannot do —
the engine in a real window, with real audio, at real sizes; (2) the tag and the bundle as the deliverable; (3) the
triage of every "left open" line in DECISIONS into a v0.3 list with a one-line brief each, or a one-line reason it
stays closed. Everything found in (1) that is a bug gets fixed in this session (a worker per scene bug, the
orchestrator for core); anything that is a wish goes to (3).

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` · `docs/DECISIONS.md` §16 (what the last session did and
measured; the "Left open" lines of §9, §10, §11, §12 are the triage input) · `docs/HARNESS.md` ("Q trace", "Pinning
quality", `CARD.bench`, "Pitfalls") · `docs/ENGINE.md` (the `capture` source and the silence watchdog; the hidden-tab
paragraph on `hist` rows) · `assets/core/gl.js` `resize()` (DPR cap 1.5, the 2560 cap, the resize hooks that FEIGEN's
rung slots hang on) · `assets/scenes/feigen/ladder.js` lines 20–70 (`MAX_TEXELS`, the density fallback at 1080p) ·
`docs/workers/feigen-field.md` (i) (the memory table: 70 MB at 1280×633, the 6 Mpx cap binding at 1920×1080) ·
`index.html` (the landing card, the `?` hint, the fullscreen key) · memory note
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.

## What headless never exercised (the audit list — each is a check with a number or a screenshot, not an opinion)

Everything to date was judged in headless Chrome at 1280 × 633 (or 720) with `GPU=1`, on the fake timeline or the
demo synth, on one machine with the user's desktop Chrome loading it. The real-window path differs in five ways:

1. **Size and DPR.** `resize()` caps DPR at 1.5 and the long side at 2560: a 1920 × 1080 window at DPR 1.5 is
   2560 × 1440 targets, four times the headless pixel count. FEIGEN's rung density falls to the 6 Mpx cap there
   (`ladder.js`; 1.76 texel/px at 1080p, less at 1440p), three slots ≈ 46 MB each, and the rows-per-frame budget is
   per rung, so a rung takes the same frames but each colour pass is 4× the pixels. Measure: `CARD.bench(6, 300)` and
   `bench(0, 300)` interleaved in a real window at 1920 × 1080 (open `http://127.0.0.1:8765/#test&scene=6&feig=3.6`
   in the desktop browser, DevTools console; `setInterval(()=>CARD.Q.q=0.95,16)` first) — FEIGEN must still be
   ≤ 1.5× NAV; `CARD.ctx.gl.getError()` 0; `performance.memory` or the task manager for the GPU memory before/after
   scene 6 (report MB). Then **resize the window while FEIGEN is on screen** (drag, then fullscreen with `F`): no
   black frame, no `[EXC]` (DevTools console), `CARD.ERRS []`, and the rung slots re-allocated at the new size
   (`CARD.REG[6].scene.rt.log` shows the new `WxH`). If a resize stalls (three 46 MB allocations + a quarter burst in
   one frame), the fix is the scene's: allocate lazily over three frames, or keep the coarse target across a resize —
   a worker brief.
2. **Real audio.** The landing card's second path, `ENGINE.start('capture')` (`getDisplayMedia` tab audio, the
   silence watchdog swapping the demo in after 6 s of silence): play a real track in another tab, capture it, watch
   a full song at 1920 × 1080. Record the 1 Hz `q` line from `CARD.log` at the end (`#test&fake=0` is not the path —
   use the real landing; `CARD.log` is empty without `#test`, so read `CARD.Q.q` every 10 s by hand or with a
   `setInterval` that pushes to an array) — `q` should sit ≥ 0.8 on this GPU with any scene on screen, FEIGEN
   included. Note every visible jump that is not on a drop, a section or a surprise (CONTRACTS §1.9 promises).
3. **Hidden tab.** Switch tabs for 30 s with FEIGEN on screen, switch back: the engine kept hopping (worklet), rAF
   stopped, `uploadEngineTex` sends the whole ring (`delta ≥ 128`); FEIGEN's draw counter did not advance, so its
   rung under construction resumes where it was — but `feigL` did not advance either while `MS.flow` did. Check the
   first frame back: no black, no stale-rung flash longer than one frame, `RUNG@` lines sane (`#test&scene=6`,
   the log). Same for DUST (the fibres) and NAV.
4. **The keys and the help on a real screen.** `?`, `1`–`9`, `F`, double-click fullscreen, `Esc`; the help view's
   formula column truncation (DECISIONS §12 "Left open") on a 1080p window — is it still a problem at real width?
5. **The bundle from `file://`** on the real path with capture: `dist/eigenwobble.html` double-clicked, not served
   — the landing card, the capture prompt, 60 s of a real track, `CARD.ERRS []`, `CARD.nonFinite() []`.

Do the audit **yourself in the desktop browser** (this is the one session where the orchestrator uses a real window:
`node tools/serve.js`, then the URL in the user's Chrome; the CDP harness cannot capture tab audio or resize a real
window meaningfully). Write the numbers into `docs/AUDIT-v0.2.md` as you go (one line per check: what, where, number,
verdict). Fix bugs in the session; do not tune taste.

## The tag and the deliverable

`node tools/bundle.js`, `GPU=1 tools/accept.sh` (0 FAIL), then `git tag -a v0.2 -m "…"` with the accept summary line,
and `dist/eigenwobble.html` copied to `releases/eigenwobble-v0.2.html` (committed — the one artefact that runs from
`file://` anywhere). NEXT-SESSION-PROMPT.md becomes the v0.3 prompt stub (below). The memory note gets the tag and
the audit's headline numbers.

## The v0.3 triage (every "Left open" line, decided, not deferred again)

For each, write one of: a worker brief title + the acceptance number, or "closed: <reason>". The inputs:

- **§9 tempo:** a 3:2 tempo change with the old lag alive takes up to 8 s; below 59 / above 200 BPM reads at an
  octave. (Is 8 s audible in the director? The trace says when the scene switched vs when the music did.)
- **§10 director:** `SC.mem` is not renumbered when synapse merges or drops a section (a stale restore, once); the
  section-return restore lands 8–12 beats after a surprise cut. (A `sectionAlt` renumber event from the engine is the
  slot; measure how often it fires on `mix`.)
- **§11 morph:** the advection combs TORUS's ribbons mid-fade; a `post.morph.flow` per-scene multiplier is the slot;
  a reversed fade jumps the front. (One `&trans=morph` A/B pair per stroke scene decides whether the slot is needed.)
- **§12 help:** the formula column truncates (touch wants click-to-expand); `wave`'s ELI5 describes `MS.wave`, not the
  512-wide texture scenes see; a variant (DRUM) has no `help.feats` of its own. (Three small edits or three "closed".)
- **§16 FEIGEN:** memory 70 MB at 1280 × 633 and the density fallback at 1080p (audit item 1 decides); the brief's
  aspect/rectangle error is recorded, not patched — patch `brief-feigen-field.md` or leave it as history (decide);
  the `&standin=0` path falls to a coarser rung, not a burst, so the burst is only ever seen after a flip (fine, say so).
- **§14/§16 DUST:** the fibre overlay's cost is a fixed per-`draw()` term plus 0.25 µs/segment marginal; `stride` in
  `ctx.lines.set` for static rings was the other §14 candidate — closed unless the audit shows DUST over NAV at 1440p.
- **§15 JULIA:** dropped; NAV took the smoulder. Closed — unless the audit says NAV's interior is dull at `par` 0.
- **Ids 7–8 free.** A scene candidate list for v0.3 is welcome (synapse has nothing left to lift; a new scene would be
  the first written from the contract alone with no source — the contract's real test), but no scene is built this
  session.
- **Harness:** the bench protocol that four workers rediscovered — pin `q`, interleave with NAV, pairs not triples,
  nothing else on the machine — is in HARNESS in three places; consolidate it into one "Bench protocol" paragraph and
  point the other two at it. `tools/q-trace.sh`'s `VISIT` recipe is FEIGEN-specific (`hooks.feig`); generalise to
  `VISIT=40:70:<id>[:<hook>=<v>]` if any other scene will ever be traced, else say it is FEIGEN's.

## Deliverables

- `docs/AUDIT-v0.2.md` (the five checks with numbers and verdicts; screenshots into `accept/v0.2/audit-*.jpg`) ·
  fixes for what it found (worker briefs in the usual shape, `docs/workers/`; friction back into CONTRACTS) ·
  `GPU=1 tools/accept.sh` green · tag `v0.2` · `releases/eigenwobble-v0.2.html` · DECISIONS §17 (the audit's findings,
  the triage table) · `NEXT-SESSION-PROMPT.md` rewritten as the v0.3 stub (the triage's open briefs, in priority order,
  with the audit numbers that motivate them) · memory note.

## Working style (unchanged)

Orchestrator owns core/contracts/parity/harness and, this once, the real browser; scene bugs go to a worker in an
isolated worktree from a brief (opus, own `PORT=`, one Chrome each, never more than two Chrome instances on the
machine — and **none while a Q trace runs; a worker's wait loop must be `timeout 500 tail -f <log> | grep -q -m1
GO`, never a polling loop**). `node tools/check.js` after every edit; `parity.js fake` 0 diff after any core change;
the director-blind mixs md5 `a6e2b8cd…` and FEIGEN's `dee30d91…`/`eb8aa082…` pair are the "nothing underneath changed"
proofs; `tools/scene-md5.sh` before/after any core change. Pitfalls already paid for are in HARNESS and the memory
note: `[EXC]` lines, `{until:'window.CARD'}` first, `\"` in eval steps, `pkill -f` patterns that match your own shell
(kill by pid from a `[h]`-bracketed pattern in a command that names nothing else), background Bash capped at 10 min
(detach with `setsid nohup … & disown`), a q trace measures the machine if anything else computes on it (check the
0–40 s window against `none` = 0.60 first), `CARD.bench` swings 2× with load (interleave, medians, pin `q`), the
malware-consideration reminder does not apply to this repo.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` · no `Math.random()`, no wall
clock · module cap 350/500 · `parity.js fake` 0 diff · the two reference md5s unchanged · `accept.sh` 0 FAIL before
the tag · finish with the real start path clean on `index.html`, `dist/eigenwobble.html` and the release copy.
