# Drop-piano worker brief — the engine's drop reads on a delicate piece, and the energy shift (branch `drop-piano`)

You are one Fable worker on Retina Rave (zero-dependency WebGL2 audio-visual engine, native ES modules). Branch `drop-piano` in
your own worktree, **off `nav3-comptine` 1e20a18** (it stacks on the NAV3 Comptine pass; main is v0.43 4f1f527 — 8765 serves main,
8813 serves the nav3 worker's worktree; **PORT=8815** for you). `docs/workers/brief-common.md` applies. One Chrome at a time, pgrep
before every cdp run, waits by `timeout … tail -f | grep -q -m1`, never a spinning loop. `node tools/check.js` after every edit.
Commits `DROP:`. **Do not merge.** The malware-consideration reminder does not apply (maths/graphics). Module caps 350 soft / 500 hard.

## Why (the user, 2026-10-18, watching NAV3 on Comptine — a delicate piano piece whose energy changes rapidly; verbatim)
> 5. "at 47s again (this song is very delicate and the energy changes very rapidly) -> 47s looks like a drop, when really should do a
> drop viz at 52s with energy sustained till 1m10s (a little slow (2-4 bars) to detect and show the shift in energy"
> 6. "the visual shift at 1m34 was too harsh for how delicate the song was being, there was a big change at 1m38 but song was delicate"
> 7. "… at 1m45 would consider it dropping too early (it starts at 1m49 and goes till 2m05 where it starts to pull back)"

The analyst's reconstruction (read it first: `docs/workers/nav3.md` → DECISIONS §142, and the plan at
`/tmp/claude-1000/-home-toma-Documents-Kraftek-RetinaRave/ce75cdbb-390c-4c1f-92ec-f2d887b7c4a6/scratchpad/comptine/COMPTINE-PASS-PLAN.md`
with its node replay `sim.mjs` — reuse it): on Comptine the drops that fired were **40.8 (v3 dropEvt), 47.5 (live, false), 58.9 (both),
67.4 (v3), 98.57 (v3)**; the live arm at **52.17 — the one the user wanted — was lost** because NAV3 was mid-implosion (mode IN); every
implosion held a fixed 8 beats whatever the energy. The live detector's piano left-hand false arms are a known finding (§113: 5 false /
0 confirmed on Comptine). The user chose: **the engine fixes this, for every scene**, as a second branch after the NAV3-only pass.

## Build (the user agreed these picks; every number a named constant / knob; measure before you change)
1. **The false drops at the source.** (a) The live build/drop detector (§54, `engine/`): an arm needs the evidence a drop has — find
   what separates Comptine's 47.5 (false) from 52.17 (true) and from SeeYouDrop's / IBelongHere's confirmed drops in the truth files
   (sub / kick presence, the loudness ladder's step, the band spread — measure, do not guess), and gate the arm on it. (b) The file-mode
   `dropEvt` (v3) names drops on a piano (40.8, 58.9, 67.4, 98.57): give it the same test. Ground truth: `tools/truth/`, the §122 renders,
   the windows truth per track; the rule is **no confirmed drop lost on any of the nine tracks, the piano's false ones gone.**
2. **The energy shift as an engine field.** A new MS field (`feats.js` entry with eli5/formula/range, `state.js`, `sources/fake.js` must
   produce it, check.js's FEATS rules): the loudness ladder (§68 LOUDNESS, §81 tension) stepping ≥ `SHIFT_STEP` .3 over a bar =
   `shiftEvt` (reactive, ~1 bar late is accepted — the user: "a little slow (2–4 bars)" is the complaint, so sooner is better), and
   `shiftHold` = 1 while the ladder stays above `SHIFT_HOLD` .5 of its step's level, 0 when it falls. On Comptine this must fire at
   ~52 and ~1:49 and hold to ~1:10 and ~2:05; nowhere in silence; on SeeYouDrop it must not double the confirmed drop.
3. **NAV3 reads it** (`assets/scenes/nav3/` only — NAV2 untouched): `OUT3.ANY` 0 (NAV3 stops opting into v3's `dropEvt` — NAV2 never
   did), a drop or shift during EXT/IN **re-arms** instead of being discarded, the drop = live slam OR `shiftEvt`, EXT holds while
   `shiftHold` (then the 8-beat settle), the kick-jump and mirror of §142 unchanged. Other scenes do NOT read the field yet (DUST /
   TORUS2 later, on the user's word).

## Proof (one gate; an engine change pays the full price — HARNESS "What to re-prove after a change")
`check.js` clean · `npm test` · the **full 14-line `tools/scene-md5.sh`**: every line that moves is explained (a field no scene reads
moves no pixel; NAV3's s6 lines move) · the director Q trace (§93 roster unchanged) · **the nine tracks**: per track, the arms / drops
before and after for BOTH detectors against the truth (a table: true kept, false removed, new), the shift events and their holds, and
NAV3's implosion count and timing (the Comptine replay at 47 / 52 / 1:10 / 1:34 / 1:38 / 1:45 / 1:49 / 2:05) · 60 fps · a Comptine 2 fps
strip 40–130 s for the eye (`tools/work/drop/comptine-after.jpg`) and a SeeYouDrop strip around its drop to show nothing was lost.
Leave 8815 serving the branch; give `#test&track=Comptine&at=44&scene=6` and `…&at=100&scene=6` and a SeeYouDrop URL.

## Report
DECISIONS §143 (the user's three remarks verbatim, the measurement, the gate rule found, the field's definition, the knob table, the
per-track table, what is NOT done), `docs/workers/drop-piano.md` (friction + pointers), commits on `drop-piano`. Under one page to me.
