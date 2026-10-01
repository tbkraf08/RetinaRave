// BASE LIGHT FROM TRUE LOUDNESS — the one scene-side mapping of the engine's `loud` stage onto "how bright is the
// picture right now" (DECISIONS §63 phase 5, docs/plans/LOUDNESS-PLAN.md §5). Pure, no imports: `assets/math/`, shared
// the way `keycolour.js` is shared, so there is ONE definition to tune and one place the numbers are measured in.
//
// WHY A SCENE DOES NOT JUST READ `loudRel`. `loudRel` is `clamp01((loudS − loudPk + 18) / 18)` — 18 LU is the EBU-style
// dynamic window, and it is the right span for a field that has to mean the same thing on any music. But the section
// ladders of real tracks span **1.4 to 7.8 LU** (SeeYouDrop 4.96, CyborgNinja 1.37, WhoLikesToParty 2.86,
// Malicious 7.82, Vienna 3.25 — §63 phase 1), so a whole song lives inside the top fifth of `loudRel` and the
// headline breakdown → drop pair reads ×1.13 where the music is ×1.94 in power. Dividing by the range the track has
// ACTUALLY shown puts that ladder across the full 0..1 and recovers most of the ratio (measured ×1.51 on the headline
// pair and ×1.86 on the void → drop 1 one, `node tools/test_loud.js --truth`; §63 read ×1.94 there against a peak
// hold that was 1.46 LU too high — see L_RNG_MIN below and DECISIONS §67). `loudRange` is gain-invariant, so this
// stays gain-invariant.
//
// The identity it uses: `(loudRel − 1) * L_SPAN === loudS − loudPk` whenever `loudRel` is not clamped, so this is
// "how many LU under the track's own peak, over how many LU the track uses" — nothing but the two published fields.
//
// THE TOP IS ANCHORED, which is what keeps a migrated scene recognisable: at the track's own loudest this returns 1.0,
// exactly where `lvl` sat (p95 0.99 on SeeYouDrop). What changes is the bottom — a breakdown stops reading full.

export const L_SPAN = 18;        // LU: `LOUDK.RANGE`, the span `loudRel` itself is mapped over (see FEATS loudRel)
export const L_RNG_MIN = 6;      // LU: the floor under `loudRange`. A track that has shown less range than this has
                                 // not shown enough of itself to be stretched over the full 0..1 — and `loudRange`
                                 // starts at 0 on a cold stream, where dividing by it would make the first seconds
                                 // black. 6 LU is just above the widest ladder of the four dance tracks (4.96), so
                                 // only Malicious (7.82) ever divides by more.
                                 //
                                 // 7 UNTIL §67 (and re-swept there): §63 fitted it against a `loudPk` that was
                                 // pre-seeded by a partially-filled short-term window and so read up to 1.46 LU too
                                 // high for a whole track (`assets/engine/loud.js`, "WHY THE PEAK WAITS"). With the
                                 // hold honest, the track's own loudest moment pins the base light to 1.0 and a
                                 // breakdown sits at `1 - dLU/max(loudRange, R)`, so the ratio this floor buys is
                                 // bounded by `1/(1 - dLU/R)` and the whole sweep moved. RE-SWEPT, 3 .. 18 LU over
                                 // all five tracks (`node tools/work/v67/{sweep,warm,clamp}.mjs`), on the headline
                                 // breakdown 2 -> drop 2 pair (equal 5.1 s windows) and on how much of each track
                                 // the mapping CLAMPS to 0:
                                 //   R            4      4.5    5      6      7      8
                                 //   headline     x2.04  x1.82  x1.68  x1.51  x1.40  x1.34
                                 //   SYD p05      0.000  0.000  0.015  0.179  0.296  0.384
                                 //   clamped      6.1 %  6.0 %  4.5 %  0.0 %  0.0 %  0.0 %   (SeeYouDrop)
                                 //   ... WLTP     4.2 %  3.3 %  1.2 %  0.0 %  0.0 %  0.0 %   (from 52 s, MID-track)
                                 //   ... Vienna   3.6 %  1.4 %  0.7 %  0.0 %  0.0 %  0.0 %   (from 69 s, MID-track)
                                 // The MUSIC's own power ratio on that pair is x1.94, which now needs R ~ 4.3 — and
                                 // there it clamps 4 % of WhoLikesToParty and 3 % of Vienna to black MID-TRACK, which
                                 // is what §63 rejected R < 6 for ("the ratio stops meaning anything"). The two
                                 // criteria no longer meet, so the hard constraint wins: 6 IS THE SMALLEST FLOOR
                                 // THAT CLAMPS NO FRAME of any of the five tracks, and it takes the largest ratio
                                 // available under that — x1.51 on equal windows, x1.65 on §60's own breakdown-2
                                 // window, against §65's x1.29 / x1.15. Erring UNDER the music's ratio keeps §63's
                                 // rule ("by as much as the sound does and no more") on the safe side of it.
                                 // 6 also restores §63's other anchor: the four tracks that are not SeeYouDrop read
                                 // p50 0.914 / 0.803 / 0.814 / 0.880 (CyborgNinja / Malicious / WhoLikesToParty /
                                 // Vienna), mean 0.853 against §63's measured 0.871 and `lvl`'s own p50 0.882 (§60
                                 // step 1), so they look as they did; SeeYouDrop reads p05 0.179 / p50 0.818 /
                                 // p95 0.973 (§63: 0.150 / 0.474 / 0.907 — the p50 rises because the honest hold is
                                 // ~1.5 LU lower, which is the defect being paid back) and loses 23 % of its base
                                 // light between the groove at 28-40 s and breakdown 1 at 49-55 s. Above 8 LU the
                                 // ladder is back inside the top third of `loudRel` it came from.
                                 // NOTE (§67, measured): because every migrated scene's shader is AFFINE with a large
                                 // constant term (DUST `gBase = .22 + 1.42*uDyn`), a base light nearer 1 COMPRESSES
                                 // the picture's own ratio. In DUST's luminance the headline pair reads x1.225 here
                                 // against §65's x1.290 — i.e. the field is now right and the PICTURE separates the
                                 // breakdown from the drop slightly less, because §65's figure was bought by a hold
                                 // 1.46 LU too high pushing the breakdown down to base 0.460. R cannot buy it back
                                 // (R=4 would give only x1.33, and it clamps); the lever for absolute contrast is the
                                 // scene's own gain, which §65's watch-list item 4 already named.

// The base light, 0..1. `loudAbs < 0` means the loudness stage is not running (`&loud=0`, or a mode with no source):
// the caller's own pre-loudness value is returned untouched, which is what makes `&loud=0` a bit-exact A/B.
export function baseLight(loudRel, loudRange, loudAbs, fallback) {
  if (!(loudAbs >= 0)) return fallback;
  const g = (loudRange > L_RNG_MIN ? loudRange : L_RNG_MIN) / L_SPAN;
  const v = (loudRel - 1) / g + 1;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
