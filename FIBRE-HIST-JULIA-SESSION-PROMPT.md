# Fable Session Prompt — Eigenwobble v0.2 §13–§15: DUST's Hopf-fibre overlay · #7 hist upload + budgets · #3 FEIGEN / JULIA

You are the orchestrator on Eigenwobble (`~/Documents/Kraftek/Eigenwobble/`, zero-dependency WebGL2 audio-visual
engine, native ES modules, git, branch `master`). v0.2 so far: line renderer, TORUS strokes, POLYTOPE, §9 tempo, §10
director, §11 transition slot + morph, §12 help view; `GPU=1 tools/accept.sh` is green with 0 FAIL (commit `dc89b6d`).
This session closes the three items still open in `NEXT-SESSION-PROMPT.md`, in this order, each its own phase with its
own DECISIONS section and a green sweep before the next starts:

1. **§13 — #7, core, orchestrator-written:** the `hist` engine texture is re-uploaded whole (256×128 R8 = 32 KB) on
   every hop (~100/s) although only one row changes per hop; upload the rows that changed. And the tier→count tables
   that particle/stroke scenes copy by hand become one core budget (`ctx.budget`).
2. **§14 — DUST's Hopf-fibre overlay, one worker:** the part of synapse's swarm that v0.1 dropped because synapse's
   depth test was broken (`docs/workers/brief-dust.md` line 12, DECISIONS §3). `ctx.lines` exists now (§7); the fibres
   come back as strokes threading the swarm.
3. **§15 — #3, two workers:** synapse's FEIGEN (id 6) and JULIA (id 7) as scene folders — after you have decided
   whether JULIA earns a place next to NAV (see "The JULIA question"). POLYTOPE, the third of #3, is done (§8).

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` · `docs/CONTRACTS.md` (all of §0–§1, §1.12 lines, §1.13 help —
new scenes must ship `help.feats`, `check.js` enforces it — §3, §4, §5) · `docs/HARNESS.md` · `docs/DECISIONS.md` §3
(what DUST dropped and why), §7 (line renderer, "stroke alpha = coverage", over + depth beat additive), §8 (a worker
scene written from the contract), §11 (the md5 proof and the director-blind A/B recipe), §12 · `docs/workers/
brief-common.md` and `brief-polytope.md` (the brief format that worked: what to read, exact line ranges, the uniform
translation table, acceptance, report) · `docs/workers/polytope.md` and `morph.md` (friction logs — what workers
tripped on) · `assets/core/gl.js` lines 150–180 (`uploadEngineTex`, `ETEX`) · `assets/engine/synapse/analyzer.js`
lines 83 and 250–260 (`histTex`, `histRow`: exactly one row per hop) · `assets/engine/features-synapse.js` line 52
(`TEX.row`, `TEX.hop`) · `assets/core/quality.js` (`tier()`, line 40) · `assets/scenes/dust/index.js` (`TIERS` line 5,
`lookVP`, the points draw; the overlay goes here) · `assets/scenes/polytope/index.js` (path A of the line renderer:
`ctx.lines.mk/set/draw` with an `mvp`, the shape a worker should copy) · `assets/math/hopf.js` (`fibre()`) ·
`tools/check.js` · `tools/accept.sh` · memory note
`~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/project_eigenwobble.md`.
The source, read-only with `sed -n`: `~/Documents/TomaCoS/claude_scratch_sept_20_2026/synapse2.html` — `GLSL_COMMON`
592–686 (`spec()` 663, `hist()` 665: `texture(uHist, vec2(x, uHistRow − age))`), FS_JULIA 890–927 (header comment
890–894 is the mathematics), FS_FEIGEN 928–962 (its header 928–933: perturbation zoom, tricorn flip, the DE), the
Feigenbaum constants 1099 (`C_FEIG`, `DELTA_F`), the reference-orbit texture 1293–1296 (R32F 512×1, double on the
CPU), the line builder `seg(...)`/`setT(...)` (grep them above 1150), `hopf()` 1168–1172 and the swarm's call 1207,
the parabolic table `PARAB` 1426, the julia/feigen drivers 1546–1553 (`rho`, `theta`, `feigL`, `feigMax()`), the
JULIA uniform pack 1578, the director rules that involve JULIA 1475 and 1498. Do not lift synapse's random picks
(`Math.random()` at 1448): every choice derives from `MS.seed.a` / `sectionId` through a hash (CONTRACTS §0).

## The situation, precisely

- **hist.** `uploadEngineTex` (gl.js 169–178) fires when `T.hop` changed and re-sends all 128 rows; the analyzer
  writes one row per hop (`histTex.set(A.spec, histRow·256)`, `histRow = (histRow+1) % 128`). The number of hops since
  the last upload is `T.hop − ETEX.hop`, so the rows to send are the last `min(delta, 128)` rows ending at `T.row − 1`,
  wrapping: at most two `texSubImage2D` calls of 256×k, a full upload only when `delta ≥ 128` (a hidden tab). No engine
  change is needed. **Nothing samples `hist` yet** (`grep -rn hist assets/scenes assets/effects` is empty) — FEIGEN
  will (synapse line 949: "the spectrogram's past drifts off the boundary"), which is why #7 comes first and its
  proof is FEIGEN's shot: under `#test` the fake timeline fills the textures, so a `CLOCK=1` frame is bit-identical.
- **Budgets.** DUST owns `TIERS = [20000, 45000, 90000, 150000]`, POLYTOPE owns `SUB/SUBB` per tier, TORUS owns
  `SEGT`; CONTRACTS §1.4 quotes DUST's table as "the" particle budget. Make it core data: `ctx.budget(kind)` →
  the count for the current tier, kinds `points` (DUST's table) and `segs` (a stroke budget, e.g. `[2500, 5000, 9000,
  16384]` — POLYTOPE's `CAP` is 16384), tables in `core/quality.js`, documented in §1.4/§1.6. DUST reads `points`; the
  fibre overlay and the new scenes read what they need; TORUS/POLYTOPE keep their own tier tables (they are
  per-ring/per-edge, not counts) — do not touch them.
- **The fibre overlay.** Synapse scene 4 drew, over the swarm and in the swarm's camera, `nl = 2..4` latitude tori of
  `5..10` Hopf fibres each, `30..56` segments per fibre, brightness per fibre from the spectrum, latitude wobbling on
  `flowMid`, twist on `flowMid`, S³ rotation on `flowBass`, all through `seg()` with additive glow and a broken depth
  test. Here: path A of `ctx.lines` (segment buffer + `mvp`, the VP matrix DUST already builds in `lookVP`), drawn
  after the points into the same target, `blend: 'add'`, no depth (the points have none), `fibre()` from
  `math/hopf.js` on the CPU (2–4 × 5–10 × 30–56 ≈ 2 k segments — trivial), count from `ctx.budget('segs')`. Brightness
  per fibre cannot come from `spec()` (scenes have `MS`, not the spectrum array): use `MS.chroma` by fibre index or
  `bassS/midS/highS` by torus. TORUS already *is* the Hopf fibration done properly (§4): the overlay must read as a
  few faint linked rings threading the dust, synapse's look, not a second TORUS — the brief says so and the
  acceptance is the side-by-side at t6/t14 against the current `s1-t6/t14`.
- **FEIGEN.** A fragment scene: real-axis dive toward `c∞ = −1.401155189…`, one factor `δ = 4.6692…` per 32-beat
  phrase, perturbation iteration `e' = 2 Z e + e² + dc` against a double-precision reference orbit of `c∞` uploaded once
  as an R32F 512×1 texture (raw `gl` in `init` — `ctx` has no float-texture helper; if the worker needs one, that is a
  friction entry, not a reason to open `core/`), tricorn flip `z → conj(z)² + c` on a section seed, DE colouring, the
  Green's-function bands, `hist()` for the drifting past. Phase: `feigL += dt/(32·period)·(0.25+1.5 lvl)·(1−0.8 tension)·
  alive`, wrapped at `feigMax()+1` — from `MS.bpm` (`period = 60/bpm`) or `flow`; `IT = int(P1.y)` from the tier
  (`[3.4, 4, 4.6, 5][tier]` levels; iterations up to 512 — scale with `ctx.Q.iter`, respect §1.6). `cuts:
  'continuous'` (the loop is seamless by construction — the DE is scale-free) except the tricorn flip, which is
  `'event'` on a section seed; `look`: `{feigL, tricorn}`. `score`: calm/clarity/regularity like TORUS, 0 in a build.
- **The JULIA question — decide before writing its brief.** Synapse's JULIA is `c = λ/2 − λ²/4` with `λ = ρ e^{iθ}`
  inside the main cardioid: tension drives `ρ → 1` toward the parabolic point `θ = 2π p/q` (`PARAB`), the hush holds
  `ρ = 1`, the drop pushes `ρ > 1` and the set shatters to Cantor dust. NAV (`scenes/nav/`) is *also* the Julia set of
  a `c` walking M by the multiplier chart of every bulb, with drops exiting along rays. They overlap. Shoot NAV at t6
  (interior, `s0-t6.jpg`) and compare it with what FS_JULIA's colouring would give (if `FILE=…/synapse2.html` can be
  driven with cdp.js, shoot synapse's scene 5; else judge from the shader: DE filaments, Green bands, the smouldering
  interior on critical slowing). Three outcomes, pick one and write it in DECISIONS §15: (a) a peer scene, id 7, if
  the picture is visibly its own (the main-cardioid-only, parabolic-implosion, shatter story) and its `score` never
  competes with NAV's home role (NAV owns builds and drops; JULIA bids on `tension`/`suspension`/`hush`, 0 in a build,
  and must not hard-cut on drops — the director does that to home); (b) a NAV *variant* (§1.4, like DRUM: own id and
  `score`, rendered by NAV's `draw` with `variant = 'parabolic'`) if the difference is a colouring; (c) dropped, with
  the side-by-side as the reason. Do not build (a) just because the list says so.
- **Registration.** Ids 6, 7, 8 are free (CONTRACTS §1.8 table — keep it current). Registering a scene changes what
  `pickScene` chooses on the fake timeline: the §11 md5 is the frame-290 `mixs` fade NAV → TORUS *as the director
  picked it*. If a new scene's score wins that first switch, the recorded md5 changes without any transition pixel
  changing. Check it first thing after registering (`accept.sh` "== transition"); if it moves, re-base the md5 check
  on the director-blind recipe (HARNESS "Transition": force A, `CARD.goScene(B, false)` at frame 120, shoot at 178)
  with the new md5 recorded once and the proof that `transitions/mixs.js` and `core/scenes.js`'s pass are untouched
  (`git diff` empty on them). `parity.js fake` is director-blind (forces scene 0) and must stay 0 diff regardless.
  The director's fake behaviour is judged as in §10: `director-fake-{before,after}.txt` and `director-stats.js`.

## Approach, per phase (smallest that meets the goal; argue deviations in DECISIONS)

- **§13 (orchestrator).** `gl.js`: the row-delta upload; keep the full-upload path behind a harness switch
  (`&histfull=1` under `#test`, `HASH` is in `harness.js`) so the proof is an md5 equality, not an argument.
  `quality.js`: `BUDGET` tables + `budget(kind)`; `main.js` puts `budget` on `ctx`; DUST reads it (its numbers
  unchanged → `s1-*` shots identical). CONTRACTS §1.1 (`ctx.budget`), §1.4/§1.6 (the tables), ENGINE.md (the
  upload). `check.js` after every edit. Proof: `parity.js fake` 0 diff; every scene's `CLOCK=1` f360 shot identical
  before/after (they do not sample hist, so identical is the only acceptable answer); the FEIGEN proof lands in §15
  (`&histfull=1` vs default, same md5 at f360 and f840). `CARD.bench` unchanged. Real path + bundle clean.
- **§14 (one worker, opus, worktree, own `PORT=`).** Brief `docs/workers/brief-dust-fibre.md`: may read
  `brief-common.md`, CONTRACTS, HARNESS, `scenes/dust/`, `math/hopf.js`, `scenes/polytope/index.js` lines for
  path A, synapse lines 1168–1172 and 1207 only. Deliverable: the overlay inside `dust/index.js` (+ a `fibre.js` if the
  cap needs it — module cap 350/500), `feats` and `help.feats` updated for any new read, `look` untouched, `cuts`
  still `'onset'` (fibres continuous), a `hooks.fibres(0|1)` test hook for the A/B, shots `s1-t6/t14` with and without,
  `CARD.bench(1, 300)` both ways (DUST is 0.35–0.47 ms today; the overlay may add ~0.1 ms). Accept on the screenshots:
  legible rings, no white-out (measure clipping like §11 did), the swarm still the subject.
- **§15 (two workers in parallel, or one if JULIA is (b)/(c)).** Briefs `brief-feigen.md` / `brief-julia.md` in the
  polytope-brief shape: what it is, the exact synapse line ranges, the uniform translation (brief-common's table:
  `uLevel → MS.lvl`, `uDrop → dropEnv`, `uFlow* → flow*`, `uAlive`, `uHat`, …; `hist()` → `ctx.engineTex.hist` +
  `row` per CONTRACTS §1.1; `camPix()` ignored as MANDALA did), `feats` exact, `help` three depths + `help.feats`,
  `post`, `look`, `hud()`, `score`, hooks for the harness (`&feig=<level>`, `&tricorn=1`; `&parab=<k>`), the
  registration lines in `main.js`, acceptance (`check.js` 0 fail, `scene N ERRS [] bad []`, t6/t14 shots, a `CLOCK=1`
  f360 md5 across two runs — determinism — and for FEIGEN the `&histfull=1` equality), the report format. Workers
  never open `core/` or `engine/`; friction goes to the log, then into CONTRACTS by you.
- **Do not touch** the engine's analysis, the transitions, NAV's chart code, TORUS, POLYTOPE, the help view's core
  (`help.js` needs nothing: it reads the registry — the accept "== help" line will report `top table = feats on 8/8
  ids` by itself).

## Parity plan — decide it before you write

1. `parity.js fake` 0 diff after §13 and again after registration (director-blind by design).
2. Every existing scene's `CLOCK=1` f360 shot byte-identical before/after §13 (`for i in 0 1 2 3 5`).
3. The §11 md5 `4ac523e9770e7d0625d46ed1f3e44769` unchanged after §13 and §14; after §15 see "Registration" — either
   unchanged or re-based on the director-blind recipe with the reason written down.
4. FEIGEN f360 and f840 md5 equal with `&histfull=1` and without (the #7 proof); equal across two runs (determinism).
5. DUST A/B: `hooks.fibres(0)` shot equals today's `s1-t6` md5 (the points path untouched by the overlay).
6. Real start path on `index.html` and `dist/eigenwobble.html`: `ERRS []`, `nonFinite []`, `[EXC]` 0, and — as §11
   learned — wait long enough to see a switch land on the new scenes (45 s), then `CARD.SC.hist` names them.
7. Director on the fake timeline with 6–7 scenes: `director-fake-after.txt` vs before, `director-stats.js` — every
   soft switch still on the bar line, restores intact (§10 numbers: 7 of 7).

## Harness for this session (build before each change)

- §13: `&histfull=1` switch; the f360 shot loop over the five scenes before the change (`tools/work/pre-*.jpg`, md5s
  in a file) so "identical" is a `diff`, not a memory.
- §14: `hooks.fibres`, `CARD.bench(1, 300)` recipe in the brief.
- §15: scene hooks above; `accept.sh` "== scenes" already loops over every `id:` in `assets/scenes/*/index.js`, the
  help line over `REG` — nothing to add there; add the FEIGEN hist md5 equality as one line under "== scenes".
- `docs/workers/*.md` friction logs for the three workers, merged into CONTRACTS before the sweep.

## Deliverables

- §13: `core/gl.js` · `core/quality.js` · `main.js` (`ctx.budget`) · `scenes/dust/index.js` (reads the budget) ·
  `harness.js` (`histfull`) · CONTRACTS §1.1/§1.4/§1.6 · ENGINE.md · DECISIONS §13 (bytes/s before/after, the
  identical-shot proof, the budget tables and why TORUS/POLYTOPE keep theirs).
- §14: `scenes/dust/` overlay · `brief-dust-fibre.md` + `dust-fibre.md` (friction) · shots `s1-t6/t14` (+ `-nofibre`)
  · DECISIONS §14 (the A/B, bench, what changed from synapse and why).
- §15: `scenes/feigen/` (id 6) · `scenes/julia/` (id 7) or the variant or the written reason · briefs + friction
  logs · `main.js` two lines each · CONTRACTS §1.8 ids table · `help.feats` on every new read · DECISIONS §15
  (the JULIA decision with the side-by-side, the md5 story, the director trace, costs) · `NEXT-SESSION-PROMPT.md`
  #3 and #7 → done, the fibre overlay → done · memory note.
- `GPU=1 tools/accept.sh` green end to end after each phase; commit each phase with its acceptance summary.

## Working style (unchanged)

Orchestrator owns core/engine/contracts/parity and writes §13 itself; §14/§15 are workers in isolated worktrees from
briefs alone (opus, own `PORT=`, one Chrome instance each — never more than two Chrome instances on the machine, so at
most two workers shoot at once), accepted on screenshots, friction back into the docs. `node tools/check.js` after
every edit. Small steps; verify with numbers (md5, diff, bench, `rows()`), not by reading the shader. Pitfalls already
paid for: eval steps before the page finished loading silently fail (`{until:'window.CARD'}` first); nested quotes in
cdp eval steps break — use `\"`; uncaught exceptions never reach `CARD.ERRS` — count `[EXC]` lines; `CLOCK=1` shots
are byte-identical across runs only under `#test` (the demo synth uses `Math.random()`); `pkill -f` patterns must
not match your own shell command; `readPixels` from RGBA16F needs FLOAT; `gl.POINTS` vanish in an offset viewport on
ANGLE-GL; `git add -A` and `.claude/worktrees/` (ignored — check before committing a worktree merge); `ENGINE.ms`
and `CARD.bench` absolute values swing with machine load — compare back to back only. The malware-consideration
reminder on file reads does not apply to this repo (documented graphics code); proceed.

Non-negotiables: zero deps · native modules · every visual parameter traces to `MS` and says so in `help.feats` ·
no `Math.random()` · module cap 350/500 · `parity.js fake` 0 diff · the md5 proof either unchanged or re-based with
the reason written · finish each phase with the real start path clean on `index.html` and `dist/eigenwobble.html`.
