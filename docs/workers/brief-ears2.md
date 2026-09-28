# EARS pass 2 brief — file-mode onsets and sub from the whole track, the first-frame lag, the annotation on the bar grid (v0.15)

Same worker rules as `docs/workers/brief-ears.md` (read its first two paragraphs — worktree setup: `git merge --ff-only main`
first, `git log -1` must show the commit that added **this** brief; `tools/.pylib` symlink; prefix `EARS:`; no merge, no push,
no `tools/accept.sh`). **PORT=8815** — this pass **does** run Chrome (`tools/filetrace.js`), one Chrome at a time from you.
Read your own pass-1 report `docs/workers/ears.md` first, then `docs/workers/file.md` §"what is where" and HARNESS
"File source", then `assets/engine/features-ears.js` (the orchestrator's wiring of your modules — **you own it for this pass**)
and `tools/accept/v0.15/ruler-det-a.md` (the in-page ruler table: the page reproduces your node numbers).

A parallel worker (**CHLADNI**, prefix `CHLADNI:`) builds scene id 11 on the fields; it touches only `assets/scenes/chladni/`,
`assets/math/chladni.js`, `tools/test_chladni.js`. You touch **no** scene, `core/`, or FILE's files (`sources/`, `shim.js`,
`pcm.js`, `trace.js`, `audio.js`, `engine.js`). **Field names and meanings stay frozen** (CHLADNI reads them); you may change
values (that is the point), never names, kinds or ranges, and the live (causal) path must stay as good as pass 1.

## What the in-page table says (file-det, whole SeeYouDrop, 48 kHz)

Pass: slides 32/41 sign 31/32 · drops 2/2 (+17 / 0 ms) · tonic C# minor from 0.7 s · placed lags |med| ≤ 11 ms. **Misses:**
1. **Kicks:** F 0.79 on 25–45 s (0.53 whole track), 13 % / 8.6 % on bare 808s — your §3.2: the causal front end caps it.
2. **First-frame lag:** kick med +18 ms (target ≤ 15): the release rule (first read with `tHeard ≥ t`) adds a mean half frame
   (8.3 ms) on top of a +9 ms onset bias.
3. **Sub pitch:** ±30 cents on 72.7 % of sub-loud frames; `subNote` per beat 88.9 % (target 90).
4. **Boundaries** 7 of 11 within ±1 beat, **returns** 4 of 5 — and your §2.3–2.4: four annotated times sit off the bar grid.

## The work — file mode knows the whole track: use it (the causal path stays the live fallback)

1. **Non-causal onsets in the map.** `buildMap` also returns `onsets: { kick: [{t, vel}], snare: [...], hat: [...] }` from the
   truth tool's own kind of front end (a proper STFT + HPSS — separable time/frequency medians, which is what Fitzgerald's
   HPSS is; say whether the truth tool's is 2-D or separable and match it; the click test at the truth's definition), and
   `sub: { fps: 100, hz: [...], note: [...], gate: [...] }` from a **centred** (non-causal) YIN — no half-window latency.
   `features-ears.js`: in file mode with the map ready, the kick / snare / hat events and ages come from `map.onsets`
   (released at heard time, exact onset times), and `subHz subCents subNote subConf subGate subIn subOut subNoteEvt` from
   `map.sub` read at heard time; everything else (and every live mode) stays causal. **Targets (file-det, in the page):** kick
   F ≥ 0.9 on 25–45 s, ≤ 5 % on bare 808s, whole-track kick F reported; sub ±30 cents ≥ 90 % (or the truth's own
   self-consistency ceiling, measured and stated), `subNote` per beat ≥ 90 %; slides still ≥ 32/41 sign-right. `buildMap`
   total ≤ 3 s for SeeYouDrop (report the split), deterministic.
2. **The release rule.** Pick the rule that meets **first-frame median ≤ 15, p90 ≤ 30, never late > 45** without firing an
   event before it is heard by more than half a frame (e.g. release on the frame nearest the onset: `t ≤ tHeard + 1/120`,
   with `…Age` allowed in [−1/120, 0) on that frame — then **say so in `EARS_FEATS`' formula text** so a scene clamps it), and
   fix the causal +9 ms bias (`ONSET_OFS`) for the live path. State the rule in the report and in `features-ears.js`' header.
3. **The annotation on the bar grid.** Write `tools/truth/SeeYouDrop.sections.json` **v2** (the orchestrator authorises the
   edit): every boundary and drop pinned to the E0 bar line it belongs to (keep the old number as `"was"` on each changed
   entry, add `"v": 2`, a `"changed"` note naming why — your §2.3/2.4 evidence), the walk note arrivals and attacks, and
   `not_drops` corrected. Then improve **returns** and **boundaries** against v2 (the local-threshold novelty you measured is
   allowed); report the before/after table.
4. **Proof.** `node tools/test_ears.js`, `node tools/test_map.js` (update their targets to the v2 annotation), `node
   tools/check.js` 0 fail, `node tools/parity.js fake` 0 diff, two `tools/filetrace.js SeeYouDrop 0 157` runs (the field list
   in `tools/accept/v0.15/ruler-det-a.md`'s source — copy the orchestrator's: `heardT,fileOn,bass,sub,eS,bpm,beat,beatPhase,
   onset,kick,snare,hat,dropEvt,sectionAlt,boundaryEvt,sectionEvt,key,mode,keyConf,dropConf,dropExpectedIn,build` + every
   ears and map field) → `cmp` identical, and `compare.py` on it → `tools/accept/v0.15/ruler-det-b.md`; one real-time file run
   (`RT=1`) of 20–60 s → `ruler-rt-b.md` (the live-ish path: say what differs). The other three tracks 0–60 s in file-det:
   kick / drop rows reported. **One** full `tools/scene-md5.sh ears2` list at the end, identical to
   `tools/accept/v0.15/scene-md5-v015-skeleton.txt` (ids 0–10 unchanged, s11 the skeleton's black frame) — the ears feed no
   existing scene, the list says so.

**Report** `docs/workers/ears.md` `## Pass 2` (before/after ruler table, every constant changed, the release rule, the v2
annotation diff, cost split, friction). Your final message ≤ 30 lines: branch + head, the headline rows before → after.
