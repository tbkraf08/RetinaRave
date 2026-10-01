// BASE LIGHT FROM TRUE LOUDNESS — the one scene-side mapping of the engine's `loud` stage onto "how bright is the
// picture right now" (DECISIONS §63 phase 5, docs/plans/LOUDNESS-PLAN.md §5). Pure, no imports: `assets/math/`, shared
// the way `keycolour.js` is shared, so there is ONE definition to tune and one place the numbers are measured in.
//
// WHY A SCENE DOES NOT JUST READ `loudRel`. `loudRel` is `clamp01((loudS − loudPk + 18) / 18)` — 18 LU is the EBU-style
// dynamic window, and it is the right span for a field that has to mean the same thing on any music. But the section
// ladders of real tracks span **1.4 to 7.8 LU** (SeeYouDrop 4.96, CyborgNinja 1.37, WhoLikesToParty 2.86,
// Malicious 7.82, Vienna 3.25 — §63 phase 1), so a whole song lives inside the top fifth of `loudRel` and the
// headline breakdown → drop pair reads ×1.21 where the music is ×1.94 in power. Dividing by the range the track has
// ACTUALLY shown puts that ladder across the full 0..1 and recovers the ratio (measured ×1.86 on the headline pair,
// `node tools/test_loud.js --truth`). `loudRange` is gain-invariant, so this stays gain-invariant.
//
// The identity it uses: `(loudRel − 1) * L_SPAN === loudS − loudPk` whenever `loudRel` is not clamped, so this is
// "how many LU under the track's own peak, over how many LU the track uses" — nothing but the two published fields.
//
// THE TOP IS ANCHORED, which is what keeps a migrated scene recognisable: at the track's own loudest this returns 1.0,
// exactly where `lvl` sat (p95 0.99 on SeeYouDrop). What changes is the bottom — a breakdown stops reading full.

export const L_SPAN = 18;        // LU: `LOUDK.RANGE`, the span `loudRel` itself is mapped over (see FEATS loudRel)
export const L_RNG_MIN = 7;      // LU: the floor under `loudRange`. A track that has shown less range than this has
                                 // not shown enough of itself to be stretched over the full 0..1 — and `loudRange`
                                 // starts at 0 on a cold stream, where dividing by it would make the first seconds
                                 // black. 7 LU is just above the widest ladder of the four dance tracks (4.96), so
                                 // only Malicious (7.82) ever divides by more.
                                 // SWEPT, 4 .. 18 LU, over all five tracks (tools/test_loud.js --truth, and the base
                                 // light's own p05/p50/p95 per track). 7 is where the mapping's ratio on SeeYouDrop's
                                 // headline breakdown 2 -> drop 2 pair is x1.93 — the MUSIC's own power ratio is
                                 // x1.94 — so the picture moves by as much as the sound does and no more:
                                 //   R  4     5     6     7     8     10    12    18
                                 //   x  14.5  3.46  2.36  1.93  1.71  1.48  1.37  1.21   (the headline pair)
                                 // and where the other four tracks' base light keeps the median `lvl` already had
                                 // (p50 0.857 / 0.861 / 0.866 / 0.900 against `lvl`'s measured p50 0.882, §60 step 1),
                                 // so they look as they did while SeeYouDrop — the one track with real breakdowns —
                                 // gets the dynamic (p05 0.150 / p50 0.474 / p95 0.907, and 52 % of the base light
                                 // lost between the groove at 28-40 s and breakdown 1 at 49-55 s, against the 76 %
                                 // §60 step 1 measured for DUST and the user signed off as "dust looks good").
                                 // Below 6 LU the void before drop 1 clamps to 0 and the ratio stops meaning anything
                                 // (x738 at R=4); above 10 the ladder is back inside the top third it came from.

// The base light, 0..1. `loudAbs < 0` means the loudness stage is not running (`&loud=0`, or a mode with no source):
// the caller's own pre-loudness value is returned untouched, which is what makes `&loud=0` a bit-exact A/B.
export function baseLight(loudRel, loudRange, loudAbs, fallback) {
  if (!(loudAbs >= 0)) return fallback;
  const g = (loudRange > L_RNG_MIN ? loudRange : L_RNG_MIN) / L_SPAN;
  const v = (loudRel - 1) / g + 1;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
