# Fable Session Prompt — Retina Rave v0.9: POLYTOPE dances (written 2026-09-25, after the v0.8.1 tag)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git, branch `main`, GitHub `git@github.com:tbkraf08/RetinaRave.git`; a push to `main` deploys retinarave.com).
**v0.8.1 "this is what it sees" is tagged** (commit `033f800`, `releases/retinarave-v0.8.1.html`, DECISIONS §40; `package.json`
0.8.1). This session improves **POLYTOPE (id 5) in place** — the same scene, the same id, the same bid — so that the 4-polytope cage
dances to the music the way TORUS2 does, with the musical language TORUS2 established (DECISIONS §36) and with grooves read per band
from bass, mids and highs. Then **tag v0.9 and deploy**.

**The user asked for this** on 2026-09-25 (verbatim): *"write a prompt to improve the polytope scene (can modify existing polytope
scene; only work on scene -> don't need full testing sweep; can tag and deploy when done); what musical/visual language can we
leverage from torus2 update? how can this shape dance to the music? I liked color tied to circle of fifths; should extract grooves
from bass, mid, highs."* That is a change to an existing scene, not a new one: the "no new scenes until asked" rule
(memory `feedback_no_new_scenes.md`) is untouched, and NEWTON is still not asked for.

**Three standing rules from memory that shape this session:** the full `accept.sh` sweep is ~10 % of a weekly budget and is
**not** run for a scene change (`feedback_sweep_cost.md`); a scene change is proven on that scene only, the full list/trace/sweep
is for registration, core and rotation changes (`feedback_test_scope.md`) — this session changes none of those; the v0.2 look
stays the default and OKLCH is opt-in (`feedback_colour_default.md`).

**Read first, in this order:** `NEXT-SESSION-PROMPT.md` (the v0.8.1 note; the NAV2 question at its top is *not* this session —
NAV2 stays at id 8 forced-only until the user looks) · `docs/CONTRACTS.md` (§0, §1 the scene object — §1.1 ctx, §1.4 colour slot,
§1.9 cuts, §1.12 lines **path A** (POLYTOPE's) and path B, §1.13 help.feats, §1.15 routed views, **§1.16 params**, §1.17 card) ·
`docs/ENGINE.md` (the `MS` vector) · `docs/HARNESS.md` ("Headless Chrome", "Bench protocol", "Q trace", "Real window", "Params",
"Pitfalls") · `docs/DECISIONS.md` **§8 POLYTOPE** (the geometry, the pole gate, the cast by section seed, the polish note),
§7 (line renderer, depth + 'over'), §14 (0.4 µs/segment), §29 (params as built), **§36 TORUS2** (the musical language: waves as a
ring buffer of hit ages, the nudge, the thump, the key anchor, the leans the user accepted), §37 (the promote/re-base shape),
§39–§40 · `docs/workers/brief-polytope.md`, `polytope.md`, `brief-polytope-pole.md`, `polytope-pole.md` (the pole streaks and the
gate that fixed them — the sweep below rides the same gate) · `docs/workers/brief-torus2.md` + `torus2.md` (the worker's friction:
the same traps wait here) · `assets/scenes/polytope/index.js` (208 lines: `update` is the whole music mapping; `CASTS`; the pole
and depth fades are in `poly4.js`'s `emit`) · `assets/scenes/polytope/poly4.js` · `assets/scenes/torus2/{colour,waves,motion}.js`
(the three modules whose ideas this session ports; `index.js` 328–340 for the six params) · `assets/engine/feats.js` (every
field: `bass mid high sub kick snare hat onset onsetRate key mode keyConf chroma beat beatCount beatPhase barPos phrase16Pos
build intensity arousal valence sectionAlt gridTrust dropEvt` all exist — verify any other name with `node tools/feats-doc.js`) ·
`tools/accept.sh` ("== torus2" and "== nav2" are the shape of the "== polytope" section to write; `ACC` default) ·
`tools/accept/v0.8/audit8.sh` (the headed real-music recipe) · memory `~/.claude/projects/-home-toma-Documents-Kraftek-Eigenwobble/memory/`
(`project_eigenwobble`, `project_torus2` — its "Harness lessons" paragraph, `project_nav2`, `feedback_*`, `project_v081_landing` — the
`*.jpg` gitignore pitfall and `thumbs.sh`).

## The interview (2026-09-25): one answer, thirteen leans

The user answered **one** question: *"1. yes; good to write prompt"* — **modify id 5 in place, tag v0.9, deploy, no forced-only
twin; git is the fallback.** Everything else below ran on the orchestrator's stated leans and the user let them stand. State each
in the brief as a lean so the worker knows what is settled and what is taste; the user corrects on the first montage if at all.

1. **Gate:** the worker's montage plus one headed run on the two real tracks, then tag and deploy **without waiting for the user**.
2. **Groove = an onset train per band**, stored as hit ages in beats; the pattern is the spacing of the last eight hits. Reactive
   to hits, snapped to the beat grid when `gridTrust` is high. Not a learned/anticipating pattern.
3. **Hit source:** the scene detects onsets on `bass`, `mid`, `high` itself (envelope rise over its own EMA, per-band threshold,
   refractory ≥ a 16th at `bpm`); `kick`/`snare`/`hat` are a confirming vote (a band onset that coincides with its drum detector
   gets full amplitude; one without gets ~0.6), never the only source.
4. **What each band drives — all three:** (a) nudges of the three rotation planes, (b) pulses travelling along the edges, three
   widths, (c) edge width and brightness per band.
5. **The full turn:** the bass plane (xy) completes one turn per **16 beats** by nudges; the mid plane (zw) one per **32 beats**;
   the high plane (xw) only jitters on hat hits and drifts on `flowHigh` as today.
6. **The inside-out sweep** (a cell through the pole) is **timed** to phrase boundaries and drops, not left to chance.
7. **Bounce:** TORUS2's visible 5 % thump; the figure breathes with `barPos` in silence.
8. **Pole wobble on the bass:** in, small — cells bulge toward the viewer with the low end.
9. **Twelve hues on the vertices by their angle in the bass rotation plane** (twelve sectors), so the cage is a colour wheel that
   turns with the key. Not cells-as-pitch-classes (a geometry job for another session).
10. **Chroma lights the sounding notes:** the sector of a sounding pitch class brightens.
11. **Share TORUS2's key colour code** by moving the anchor math to a `math/` module both scenes import, TORUS2's md5s proven unmoved.
12. **No filled faces**; strokes only, width pulses do the work.
13. **Intensity: visible** — the nudges and pulses clearly readable at arm's length, not TORUS2-subtle.

## The spec — what POLYTOPE must do after this session (the worker reads it through its brief)

Geometry stays: the four regular 4-polytopes on S³, the SO(4) double rotation, stereographic projection from (0,0,0,1), edges
subdivided on the sphere so every piece is a circular arc, the cast by section seed with its cross-fade, `ctx.lines` path A,
the pole gate and the depth fade in `emit` (§8, the pole worker). What changes is *what moves it* and *what colours it*.

1. **Grooves from the three bands** (`grooves.js`, the port of `torus2/waves.js`). Per band `{bass, mid, high}`: an onset detector
   on the band level (rise over a ~0.4 s EMA above a per-band threshold, refractory one 16th at `bpm`, amplitude = the rise, ×1 if
   the matching drum detector `kick/snare/hat` fired within ±1 frame else ×0.6), a ring buffer of the last **8 launches as ages in
   beats** (`beatCount + beatPhase` at launch — musical time, no wall clock, so a set never drifts), snapped to the nearest 16th
   when `gridTrust > .5`. Every consumer below reads these three trains. `beat` may launch a faint bass-train entry when no band
   hit did in the last bar, so a drumless track still breathes. Acceptance: a pinned four-on-the-floor train (a `hooks.train`
   like TORUS2's) shows **four evenly spaced pulses per edge** at f360 and a syncopated pin shows uneven spacing (`hooks.info`
   returns the positions, de-duplicated as TORUS2's does).
2. **Dance — the rotation planes nudge to the grooves.** (a) **xy (bass):** target angle = `beatCount/16 · 2π` (never drifts, read
   off the count, not integrated), the angle eases to it with a ~0.3 s time constant (springy), **plus** an impulse per bass-train
   hit: a critically-damped kick of amplitude ∝ hit that overshoots and settles to zero net, so the groove is visible in the turn
   and the 16-beat lock holds. (b) **zw (mid):** the same with `beatCount/32` and the mid train. (c) **xw (high):** today's
   `0.04·flowHigh` drift plus a small impulse per high-train hit (bounded so nothing crosses the pole gate on hats alone).
   `hush`/`calm` double the time constants. Replace today's `a1 = 0.1·flowBass`, `a2 = 0.14·flowMid` with these; keep the camera
   orbit on `flow`. (d) **Bounce:** `1 + 0.05·max(0, cos(2π·beatPhase))^4` on the figure scale (`p.g`) — a thump, not a sine.
   (e) **Breath:** a ±2 % scale on `barPos` so silence still moves. (f) **Pole wobble:** an extra xw angle `≤ 0.12 rad · bass`
   (eased ~0.2 s) that carries the near cells toward the pole so they bulge toward the viewer with the low end; bound it so no
   vertex passes the `den` gate on level alone. Acceptance: a CLOCK=1 frame series across one bar on `&demo=house` shows the xy
   angle advancing 1/16 per beat with an overshoot at each bass hit and the bounce peaking at `beatPhase` 0.
3. **The inside-out sweep, on cue.** On a phrase boundary (`phrase16Pos` wrap, or `sectionEvt`) and on `dropEvt`, drive a
   deterministic xw rotation over one beat that carries **one vertex through the pole** — the cell blows up, fades through the
   existing gate, and the cage turns inside out — then let the plane settle back into its 32-beat lock. Choose the vertex nearest
   the pole at the cue so the sweep is always short. Between cues the xw bounds from (2c) and (2f) must keep every vertex off the
   pole, so the move happens *only* when the music calls it. Pinned in the intro (`arc`). Acceptance: a CLOCK=1 series of five
   shots across the sweep on a pinned cue (`hooks.sweep`) and a shot 4 s later identical in structure to one 4 s before it.
4. **Pulses along the edges** (the visible groove). Each edge piece has a parameter `t ∈ [0,1)` (vertex to vertex, the subdivision
   already gives it). Each train paints a brightness (and width) bump wherever a hit's age lands, travelling **one edge length
   per bar** and fading over ~2 bars: bass → a wide slow bump on every edge, mid → a sharper pulse on the *outer* figure's edges,
   high → tiny fast ripples everywhere. Path A gives a colour and width per emitted segment, so this is a per-piece multiplier in
   `emit` (CPU, ~7 k pieces, cheap); move to path B only if the bench says so, and record it. Because launches are hits and the
   speed is fixed, the rhythm becomes the spacing of the bumps along every edge — TORUS2's proof, on the cage.
5. **Colour from the key, on the circle of fifths.** Move the anchor math from `torus2/colour.js` into `assets/math/keycolour.js`
   (pure: `hueKey = ((7·key) mod 12)/12`, the warm/cool PULL the short way round, the unwrapped ~2 s ease, the `keyConf < .3`
   hold and slide toward `LOOK.mood`) and import it from both scenes; TORUS2 keeps its palette code and its md5s **must not move**
   (`IDS=3 tools/scene-md5.sh` = `tools/accept/v0.8/scene-md5-v08.txt` s3 lines, both runs). In POLYTOPE: each vertex gets a
   **sector** = its angle in the xy plane *after* the double rotation, quantised to twelve; sector k is pitch class `(7k) mod 12`
   on the wheel, `hue_k = hueKey + k·spread/12` (the same `spread` the mood gives, as TORUS2), so the cage is a colour wheel that
   turns with the key and rolls with the bass nudges. **Chroma** lights the sounding notes: sector brightness `= floor + (1 − floor)
   · chroma[pc]`, floor ~0.35 (`glow` param), eased ~0.15 s so a chord glows and a melody walks round the wheel. Major = warm,
   minor = cool, through the shared PULL. The inner/outer split (`ta` 0.15 / 0.55) becomes inner = anchor wheel, outer = the same
   wheel offset by a fifth (one twelfth), so the two figures are related keys. Colour slot: `v2` default; no OKLCH variant this
   session. Acceptance: `hooks.key(0,0)` vs `hooks.key(7,1)` side by side (warm vs cool, wheel rotated a twelfth), a pinned chroma
   (`hooks.chroma`) of a C major triad lighting three sectors.
6. **Growth with the build, staged (TORUS2's):** `build` 0→0.5 raises the edge subdivision toward the tier's maximum (the arcs get
   rounder), 0.5→1 raises `p.g` toward a cap that never crops in portrait (v0.6 mobile); `intensity`/`arousal` set the resting
   size; the drop keeps today's 60 % swell. `tension` keeps its shrink and its hashed camera shake.
7. **Params (§1.16), six, named for the eye, `from(MS)` moved verbatim from the mapping above:** `turn` (the xy target, rad),
   `bounce` (0–0.1), `size` (0.5–1.2, the resting `p.g`), `groove` (0–1, the pulse amplitude), `glow` (0–0.6, the sector floor),
   `sweep` (0–1, the inside-out progress). The identity proof: `paramsOf == derived` while nothing is routed; a route moves the s5 md5.
8. **`feats`** adds `bass mid high sub kick snare hat key mode keyConf chroma beat beatCount beatPhase barPos phrase16Pos build
   intensity arousal gridTrust dropEvt hush calm` to today's list. Every field read, every field with a `help.feats` line, the
   score-only fields keep their `the bid:` prefix; `check.js` fails on a gap, warns on a phantom. `help.eli5/why/math` re-read so
   they still describe the scene (the "music sets the two turning speeds" sentence is now wrong; the nudge, the wheel and the sweep
   go in). The `card.blurb` (§1.17) stays unless the picture changes character; the thumb is re-shot (below).

## Non-negotiables (README) and the traps

- No `Math.random()`, no wall clock; a constant is a manual setting shown as one (named at the top of the module); `'nav'` never
  appears in core; scenes import nothing from `core/` or `engine/` (they get `ctx` and `MS`) and nothing from another scene —
  shared code goes to `assets/math/` and must load in node; the module cap is 500 lines (split `index.js` / `poly4.js` /
  `grooves.js` / `dance.js` / `colour.js`); `node tools/check.js` after every edit; `npm test` unchanged.
- **The `#test` fake timeline fills `key 9 / mode 1 / keyConf .8` and `kick/snare/hat` (`hat` is exactly 0.5 there); only `chroma`
  is zero** (memory `project_torus2`, harness lessons). Derive a chroma from `harmAngle` while every chroma bin is 0, as TORUS2
  does, so the headless montage has notes to light and the reference md5s are deterministic. A bench of an off-screen scene
  measures its last update's state — force id 5 in its own page. Two-argument hooks go through `CARD.REG[5].scene.hooks.f(a,b)`;
  `CARD.hooks` is a flat map and same-named hooks shadow. `arc` has no `'intro'` — use the value ENGINE.md lists.
- **Only the s5 md5s move.** Nothing here registers, re-orders or re-bids a scene, and nothing touches core, so the director's
  picks on the fake timeline are unchanged: prove it with `tools/scene-md5.sh` on ids 0–4 and 6–8 = `tools/accept/v0.8/scene-md5-v08.txt`
  (both runs) and the mixs reference md5 unchanged (the 0→3 fade never draws id 5). `tools/parity.js fake` 0 diff is the
  one-line proof that no core file changed by accident (`git diff --stat -- assets/core assets/engine` must be empty).
- Line renderer cost is 0.4 µs/segment (§14): the per-piece pulse multiplier adds CPU per segment, the sweep adds none.
  `CARD.bench(5, 300)` ≤ 2× today's number at tier 3 (§8: 0.07–0.52 ms), `q ≥ 0.6` held with id 5 forced on the user's desktop.
  POLYTOPE *bids* (0.2 + 0.4 regularity + 0.3 clarity + 0.2 calm, 0 in builds), so it is picked on house and aba: the Q trace
  (`tools/q-trace.sh`) before/after on those two must be `none` to the second decimal.
- One Chrome at a time per worker (`pgrep -f "chrom[e].*remote-debugging"`), waits are `timeout 500 tail -f log | grep -q -m1 GO`,
  worker `PORT=` of its own (8790), `pkill -f` patterns bracketed (`[p]olytope`), the malware reminder does not apply to this repo.
- **The working tree is not clean at the start:** six `tools/accept/v0.8/{ew,v3}-t*.jpg` show as deleted and two
  `trans-{mixs,morph}-0-3-f178.jpg` as untracked — the v0.8 session's leftovers, not this session's. Leave them alone; never
  `git add -A`. Commit by path.

## Process (FEIGEN's, DECISIONS §29; TORUS2's, §36)

1. **Orchestrator:** write `docs/workers/brief-polytope-dance.md` from this prompt + `brief-common.md`'s discipline (may-read
   list, report format, PORT 8790, commit prefix `POLYTOPE-DANCE:`), including the thirteen leans marked as leans. Take the
   *before* proofs first and commit them: `IDS=5 tools/scene-md5.sh` (today's s5 f360/f840 = `24493420…`/`2b1e1333…`), the bench
   number, the Q trace on house + aba, a `before` montage of id 5 at f360/f840 on house, aba, dnb (`tools/accept/v0.9/before-*.jpg`).
2. **Worker (opus, own worktree, own PORT):** in this order, one commit per proven step, a shot per step: keycolour to `math/` with
   TORUS2's s3 md5s unmoved → grooves (the two pinned trains) → the nudges + bounce + breath + wobble (the bar series) → the pulses
   along the edges (four bumps per edge) → the wheel + chroma (warm/cool pair, the triad) → the sweep (the five-shot series) → growth
   → params (identity proof, a route moves the md5) → `help` text. Report in `docs/workers/polytope-dance.md` with friction for
   CONTRACTS. The worker checks its own context; at 75 % it writes a handoff for re-delegation rather than a thin last step.
3. **Orchestrator:** merge; ids 0–4, 6–8 md5s identical, mixs identical, parity fake 0, core/engine diff empty, Q trace `none`,
   bench ≤ 2×; write the `accept.sh` "== polytope" section (s5 md5s against `tools/accept/v0.9/scene-md5-v09.txt` = the v0.8 lists
   with s5 re-based, the two pinned trains, the key pair, a route moving the md5) and set `ACC` default v0.9 — for the next time the
   sweep is asked for, **not run now** (`feedback_sweep_cost`). Then the **headed real-music run**: copy `CyborgNinja.mp3` and
   `WhoLikesToParty.mp3` from an old scratchpad (`/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/*/scratchpad/music/`)
   and reuse `tools/accept/v0.8/audit8.sh`'s shape with id 5 forced (key `6`): 0 black frames, 0 long frames, `errs []`, a
   `det9.py`-style trace of the three onset trains at 2 s over 80 s on each track (are the bass hits on the kicks? is the mid train
   the snare/vocal? does the high train fire on hats and not on everything?) — retune the per-band thresholds if a train is
   dead or saturated, at most two passes, each traced. `docs/AUDIT-v0.9.md`, and a montage for the user: POLYTOPE before vs after
   at the same clock frames on house, aba, dnb and the two real tracks (`tools/accept/v0.9/montage-polytope.jpg`).
4. **Ship (no user gate — lean 1):** re-shoot the landing thumb (`tools/thumbs.sh`, `site/thumbs/polytope.jpg`; `*.jpg` is
   gitignored, `git add -f` it as v0.8.1 did), re-read the about page's POLYTOPE line, DECISIONS **§41** (the build, the thirteen
   leans, the retune passes, the ranked leans to revisit first), HARNESS pointers, `NEXT-SESSION-PROMPT.md` (the user looks next;
   the NAV2 question still ahead of it), `package.json` 0.9.0, `npm run build`, `releases/retinarave-v0.9.html` = dist at the
   tag, commit, `git tag v0.9`, push (deploys). Update memory: `project_polytope` (new), the `project_eigenwobble` pitfalls if any
   new, MEMORY.md line. Tell the user in one message: the montage path, the three trains' trace verdict, the leans ranked by how
   likely they are to want them retuned.

## What this session is not

Not a new scene, not NEWTON, not the NAV2 swap (the user has not looked), not TORUS2's leans, not deleting `torus-v1`, not
cells-as-pitch-classes (lean 9's other branch — note it in §41 as the next POLYTOPE idea), not an OKLCH variant, not a full
`accept.sh` sweep, not a core or engine change (if a field the spec needs is missing from `MS`, derive it in the scene and record
it; a new engine stage is a different session), not the Cloudflare dashboard steps (still open from v0.6 — remind the user once,
in one line). If the user's first sentence of the session changes the spec, their sentence outranks every lean above; lean 1
(in place, tag, deploy, no gate) is theirs.
