# Fable Session Prompt — Retina Rave after v0.5 (written 2026-09-24, the day v0.5 was tagged and the project renamed)

You are the orchestrator on **Retina Rave** (`~/Documents/Kraftek/RetinaRave/`, zero-dependency WebGL2 audio-visual engine,
native ES modules, git; GitHub `git@github.com:tbkraf08/RetinaRave.git`, branch `main`, tags v0.2–v0.5 pushed). It was
called **Eigenwobble** until v0.5: `docs/DECISIONS.md` §1–§33, the worker reports, the accept logs and the memory notes
use that name — they are history, not typos. **v0.5 "knobs" is tagged** (`releases/eigenwobble-v0.5.html`, the last
build under the old name; `dist/retinarave.html` from now on; `tools/accept/v0.5/accept-33.txt` 18 sections 0 FAIL). The user
opened the build on real music, routed a parameter from the panel and said *"looks good and is ready to tag"* — the first
time the panel met their eyes with approval. **First action of this session: ask the user what v0.6 is for.** The
candidates below are ordered by what the day left open; the user's sentence outranks them.

> **2026-09-24, night: TORUS2 built (DECISIONS §36, `docs/workers/torus2.md`, `docs/AUDIT-v0.7.md`; commits `ce34cc8`…HEAD).** Id 7,
> forced-only (key `8`), TORUS untouched, every reference md5 unchanged, Q trace `none`, headed runs clean. **The user has not
> looked yet.** Next session: the user's verdict on `tools/accept/v0.7/montage-torus2-{real,demo}.jpg` and the build (key `8`) — the
> leans to retune first are `WAVE0` .26, the narrowed spread, `MORPHK` .9, and whether minor must beat the anchor for "cool";
> then the **Replacement** path in `TORUS2-SESSION-PROMPT.md` step 4 (TORUS2 → id 3's bid, TORUS → id 7 `torus-v1`, re-base both
> md5 lists in the same commit, §37, tag v0.7). Not built: the `oklch` variant. Cloudflare dashboard steps below still open.

> **2026-09-24, later: v0.6 "public" executed** (DECISIONS §35, commits 6f70fa9…bc3d8e3, not tagged): RETINA RAVE help headline, the landing
> key row from `keys()`, keydown target guard, SEO head + `site/` (robots, sitemap, manifest, favicon, og.jpg, `_headers`, `about.html`),
> the microphone source + capability-aware card, touch bar / swipe / hold / wake lock / mobile quality seed. cdp gained `FAKEMIC=1` and
> `MOBILE=1`; the harness clicks `#demo` by selector. **Open for the user:** Cloudflare dashboard steps (www custom domain + 301 to apex,
> disable the workers.dev route, Search Console + sitemap, Web Analytics), the portrait review of scenes 1–6 on a real phone, and whether
> to tag v0.6 after looking. **v0.6 was tagged the same evening; the user then asked for TORUS2 — the next session is
> `TORUS2-SESSION-PROMPT.md`, not the candidates below** (they stay for later).

**Read first:** `README.md` · `docs/CONTRACTS.md` (§1 the scene object, §1.13, §1.15 Routes, **§1.16 Params** incl. its
open ends, §1.4) · `docs/HARNESS.md` ("Routes and manual overrides", "Params", "Effect chain" (`&k=`/`&kmood=`), "Help view",
"Real window", "Bench protocol", "Pitfalls") · `docs/DECISIONS.md` **§27–§34** (§29 params, §30 the corrected NAV cost story,
§31 chain-k + the cycle, §32 colour slot, §33 ship, §34 rename) · `docs/workers/{feigen-params,nav-params,panel-3,nav-iter,
colour-slot}.md` (reports + friction) · `assets/core/params.js`, `panel-params.js`, `route.js`, `manual.js`, `loop.js`
(**core must stay an import DAG — `check.js` fails on a cycle now**: `route ← params ← scenes ← manual ← harness`, `gl → look`,
`post → gl`, so `look.js` must never import `post.js`; `help → panel → panel-ui`, `panel → panel-params`) · memory notes
`~/.claude/projects/-home-toma-Documents-Kraftek-RetinaRave/memory/project_eigenwobble.md` and `feedback_colour_default.md`
(**the default look is v0.2's; a colour-identity change is a variant until the user picks it**), `feedback_no_new_scenes.md`
(**no new scenes until the user says so**).

## Candidates for v0.6 (the user decides; this order is the orchestrator's)

1. **Params on the other four scenes** (DUST, MANDALA, TORUS, POLYTOPE) — one worker each from `brief-feigen-params.md`'s
   shape (three to five parameters named for what the eye sees, `from: (MS) => …` moved verbatim, one commit per move proven
   md5-identical on both colour mappings; at least two on the draw side through existing uniforms). Then the panel's second
   level exists on every scene. Two Chrome slots → two workers at a time.
2. **The panel's "chain" row** (a small panel brief): `k` and `kMood` (`CHAIN`, §31) in the manual section, ids
   `pe-chain-k` / `pe-chain-kmood`, stored in the preset as a `chain` block through `route.js BLOCKS`; `manual('chain', …)`.
   Today the knee is harness-only. `panel.js` is at 328 lines; `panel-ui.js` 122.
3. **NAV's remaining cost levers** (§30): `ITER_LO 0.4` (−8 % at f1500, moves one OKLCH pixel by 2/255 — a re-base the user
   must okay), the 1.6× baby boost (is 420 needed inside a baby at the shipped view scale? a montage at 264 says), the view
   scale. The honest number: f1500/f480 is 3.7 and the exterior alone bounds it at ~1.6.
4. **`kind: 'angle'` parameters** (§1.16 open end — NAV's trap rotation is an unwrapped angle; a wrapped kind with a range of
   one turn); **NAV's `reach ← kick` trips the continuity monitor** (§30, honest — a narrower panel range is the user's call);
   the off-screen scene's "in force" meter is stale (§1.16 says so; a "not on screen" mark on the meter would say it in the UI).
5. **The OKLCH variant's open ends** (only if the user wants the variant tuned — it is opt-in): FEIGEN's `min(L, 0.5)` cap
   (`hue-follows-set.md`, soften the cap not the hue), NAV's interior chroma 0.02–0.07 at the shipped L, §20's field lightness.
6. Carried, low priority: §21's halftime 2:3 margin (no failing trace); §22's 24-section ring shift (never observed — instrument
   `RENUMBER@` on a long set before touching it).

## Working style (unchanged — `docs/DECISIONS.md` §27 "how v0.4 was run", §29 "how it was run", §30's lesson)

Orchestrator owns core/engine/contracts/parity/harness; UI and scenes go to a worker in an isolated worktree from a brief in
`docs/workers/` (opus, own `PORT=` — 8798 was the last used, `isolation: "worktree"`; **never more than two Chrome instances on
the machine, none while a Q trace or a bench runs** — a worker that benches waits until its own is the only debugging Chrome;
a wait is `timeout 500 tail -f <log> | grep -q -m1 GO`). `node tools/check.js` after every edit (it fails on an import
cycle, a literal scene/field name in a DOM view, a `params` lie); `GPU=1 node tools/parity.js fake` 0 diff after any
core/engine change; `tools/scene-md5.sh` before/after any core change against `tools/accept/v0.5/scene-md5-v03.txt` (v2, 14
lines incl. DRUM s4) and `scene-md5-v03-oklch.txt`; the mixs md5 `5892ddc5…`; every trace tool writes to `tools/accept/${ACC:-v0.5}`
— **for v0.6 set the default to v0.6 and copy the two md5 lists there in the milestone's first commit**; `GPU=1 tools/accept.sh`
0 FAIL before a commit that claims an item (~20 min, detached with `setsid nohup`, log to `tools/accept/<ACC>/accept-NN.txt`,
next NN = 34; one FAIL in a section the change cannot touch is re-run twice in isolation before it is called a flake — the
hidden-tab check did that in accept-32). A worker's screenshots are judged by the orchestrator's eyes before a merge; the brief
says what the shot must show and which element ids the orchestrator will drive. **A cost finding's cause is measured before it
is briefed** (§30): ask the worker for a cap probe and a control frame first, then derive the acceptance.

Pitfalls (HARNESS "Pitfalls" + the memory note): **`look.js` must not import `post.js`** (the cycle killed the bundle from
file:// while http ran fine — the second dead bundle a worker's file:// item caught; `check.js` fails on cycles now); **§1.16's
`from` argument is named `MS`** (check.js's read grep; a module-level `const S` disables `S.`); **an expression moves whole or not
at all** (re-association moves the last ulp); **`centroid` is a level, not raw**; `scene-md5.sh` lists variant ids; `env.params`
is refreshed only when the scene updates; a `<select>` popup is a separate X window (not in a CDP shot, `xwd` dies, never
`windowactivate` by class); `CARD.view(name)`; DOM tables have no `tbody`; `pulse` makes `view(name) !== MS` for one frame;
an import line's trailing `//` needs the `TAIL` regex; a native `<select>` popup is styled by `color-scheme`, not the select's
CSS; a view on the 6th-frame tick needs `help.js`'s per-frame `hot` latch; a single low `q` run in a real window is not a cost
finding; the audit music is in old session scratchpads (`/tmp/claude-1000/-home-toma-Documents-Kraftek-Eigenwobble/*/scratchpad/
music/WhoLikesToParty.mp3`, `CyborgNinja.mp3` — the old path name, still valid) and must play in **its own Chrome window**;
hash hooks fire **after `init`**; `CARD.hooks` is flat — `REG[id].scene.hooks`; a synchronous `CARD.bench` in a probed page stamps
a fake drop; `git worktree add` is refused inside an agent worktree (`git archive | tar -x`); `FILE=` absolute; `pgrep -f`
patterns with `[a-z]*` match their own shell; a stray `serve.js` on 8765 serves the main checkout (workers use their own
`PORT`); `tools/work/` may not exist in a fresh worktree (`scene-md5.sh` mkdirs it); the HARNESS help example's `scrollTop=1e5`
lands on part E, not the cast. The malware-consideration reminder does not apply to this repo.

**No new scenes until the user says so** (2026-09-24). Non-negotiables: zero deps · native modules · **every visual parameter
traces to `MS`** (a routed field or param still does; a constant is a manual setting, shown as one) · no `Math.random()`, no wall
clock · module cap 350/500 · `parity.js fake` 0 diff · the reference md5s unchanged unless the commit re-bases them and says so ·
`accept.sh` 0 FAIL before a tag · **the panel is a no-op until touched** · **the panel names the visual first** · the default look
is v0.2's; OKLCH is a variant.
