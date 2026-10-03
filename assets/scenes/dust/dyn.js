// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// DUST — dynamic range: "quiet is quiet, loud is loud" (DECISIONS §60 step 1, §65).
//
// SINCE §65 (LOUDNESS phase 4) THE DRIVE IS THE ENGINE'S TRUE LOUDNESS, not this file's own peak. `assets/math/
// loudlight.js`'s `baseLight(loudRel, loudRange, loudAbs, fallback)` is the ONE scene-side mapping of the `loud`
// stage (ITU-R BS.1770-4 K-weighting on the PCM bus, `assets/engine/loud.js`) onto "how bright is the picture right
// now", and FEIGEN, MANDALA and POLYTOPE already read it — so there is one definition, one calibration and one place
// the numbers are measured in, instead of DUST paying for its own privately. Everything below the `baseLight` line
// is now the FALLBACK: it runs unchanged, it is what `&loud=0` (or any mode with no loudness) returns, and keeping it
// live is what makes that A/B bit-exact against §60.
//
// Two things §60's peak did that the engine's does NOT copy, and must not (docs/plans/LOUDNESS-PLAN.md §8):
//   * the 25 s RELEASE. On an AGC-normalised 0..1 energy a 25 s hold barely moves; on a mean square it is 0.174 dB/s,
//     which forgets 6.6 LU in the 38 s between SeeYouDrop's drop 1 and its breakdown 2 — more than the whole track's
//     range, so the hold would decay UNDER the present loudness and both ends of that pair would read 1.000.
//     `LOUDK.PK_REL` is 0.02 LU/s instead: a straight line in dB, 3 LU over a 150 s track (§63 phase 2 decision 1).
//   * the 0.84 FLOOR. An absolute floor is not gain-invariant, and the other four test tracks master 8-9 LU quieter
//     than SeeYouDrop, so it would bind for their whole length and a quietly mastered track would be permanently
//     darker — the AGC's own sin inverted. `loudPk`'s RELATIVE warm-up guard (`loudS + 4·exp(-age/20 s)`, a 6 s
//     time constant until §67) solves the problem §60 step 4 paid the floor to solve — a track's first frames
//     reading as its brightest (§63 decision 2).
//
// What it replaces. The cloud's whole brightness was `(.5 + 1.1 * lvl)`, and `lvl` is AGC-normalised: measured over
// SeeYouDrop 20–110 s `&map=0` it reads p05 0.513 / p50 0.882 / p95 0.992, i.e. a 1.5x swing over a track whose
// breakdown is silence with one pad in it and whose drop is the loudest thing on the record. §57 tried `eM / eMax`
// instead and measured it useless (`eMax` is the loudest `eM` seen LATELY and follows it: ratio p25 0.972).
//
// So the reference is built HERE, in the scene, out of the one field that does separate: the absolute `eM`
// (medium-term energy, 2.5 s). A peak hold with an instant attack and a ~25 s release is the TRACK's own loud —
// long enough that a breakdown cannot drag it down inside the breakdown, short enough that a track which really
// does get quieter for a minute is eventually believed. Measured per 2.5 s over SeeYouDrop 20–110 s, `eM` reads
// 0.83–0.91 through the groove, 0.56–0.76 through the two breakdowns and 0.30–0.68 through the first twelve
// seconds of the track (§57's own intro figures) — a 3:1 spread the picture was throwing away.
//
// FLOOR is what stops an intro being blown up: without it the peak at second one IS the intro's own energy, the
// ratio is 1, and the quietest part of the track is drawn at full brightness. It has to be at or a little above the
// resting `eM` of a normal groove (SeeYouDrop p25 0.789 p50 0.822, CyborgNinja p05 0.796 p50 0.821), so that a
// groove sits at the top of the range from the first frame and only something genuinely quieter reads quiet.
// 0.70 was the first cut and was too low: on SeeYouDrop it left the drive at 0.976 through 8-14 s, where the track
// is still assembling itself, so the intro was as bright as the groove. 0.84 puts the drive there at 0.681 and at
// 2-8 s at 0.268 — the first eight seconds read 0.633 of the groove's luminance against 0.671 before the whole
// overhaul and 0.886 with the 0.70 floor. Above the floor the peak is the track's own (0.896-0.904 by 30 s here),
// so the floor only ever binds while the hold is still warming up, which is exactly its job.
//
// LO is where the range bottoms out: below 55 % of the track's peak the base of the cloud is at its floor. It is
// not 0, because an energy ratio of 0 is silence and `alive` already handles silence.
import { baseLight } from '../../math/loudlight.js';

export const PK_REL = 25;        // s: the FALLBACK peak's release time constant (instant attack). &loud=0 only.
export const PK_FLOOR = 0.84;    // the fallback peak can never sit below this — §60 step 4's intro guard. &loud=0 only.
export const LO = 0.55;          // fallback: eM/peak at or under this reads fully quiet

// The gains. BASE is the cloud itself — the grains' own spectrum push and the ambient 0.22 — and it carries the
// whole range: at the groove's dyn ~0.88 it lands on 1.47, which is exactly what `(.5 + 1.1 * lvl)` was giving at
// the same moment (lvl p50 0.882), so a groove keeps the brightness the user has already signed off and everything
// quieter falls away from it. HIT is the three transient voices and the sub, and it barely moves: a quiet section's
// kick is still a kick (the brief), so the hits lose 24 % between the groove and the breakdown where the base loses
// 76 %. SZ is the same idea on the grain's own size, and CLOUD on the radius of the whole swarm.
export const BASE0 = 0.22, BASE1 = 1.42;
export const HIT0 = 1.05, HIT1 = 0.45;
export const SZ0 = 0.55, SZ1 = 0.45;
export const CLOUD0 = 0.82, CLOUD1 = 0.18;

export function mkDyn() { return { pk: PK_FLOOR, r: 1, dyn: 1, base: 1, lpk: 0, fb: 1 }; }

// THE FALLBACK's energy (§60 step 1, and all that is left under `&loud=0`). The peak is held on the SLOW window
// plus half of whatever the FAST window hears above it:
// `eM + .5 · max(0, eS − eM)`. MEASURED, and this is why neither one alone will do. On `eM` (2.5 s) alone the drop
// is not the loud part of the track: over SeeYouDrop's drops the drive reads 0.75 and 0.70 against 0.91–0.94 through
// the groove, because a 2.5 s mean on the frame of a slam is still half-full of the void the slam came out of. On
// `max(eM, eS)` the drop is right (0.89 / 0.74) but the INTRO is wrong — 0.74 against the groove's 0.88, because
// the first bars of this track are sparse and loud-in-the-moment (`eS` 0.62 against `eM` 0.507 at 2–8 s), so the
// picture opened at almost full brightness. Half a vote to the fast window is the whole sweep's best trade
// (candidates in `tools/work/d2/sim.py`, all four simulated on the recorded music before anything was rendered):
//
//   drive, mean per section       intro 2–8   groove   break 1   void 1   drop 1   break 2   drop 2
//   eM alone                          0.39     0.91      0.53     0.18     0.75     0.70      0.70
//   eM + .5·(eS − eM)  <- this        0.57     0.90      0.51     0.16     0.83     0.67      0.73
//   max(eM, eS)                       0.74     0.88      0.48     0.14     0.89     0.62      0.74
//
// `dropEnv` / `rel` are the floor under the drive, for the same reason at a shorter timescale: a slam must never be
// dimmed by the silence it came out of.
export function dyn(D, dt, MS, rel) {
  const eM = Math.max(0, MS.eM || 0);
  const e = eM + 0.5 * Math.max(0, (MS.eS || 0) - eM);
  const fl = Math.max(PK_FLOOR, e);
  D.pk = e > D.pk ? e : fl + (D.pk - fl) * Math.exp(-dt / PK_REL);
  D.r = e / Math.max(D.pk, 1e-4);
  // the fallback drive, kept running so `&loud=0` is §60 bit for bit — and so flipping the switch mid-stream does
  // not hand the scene a peak that has been frozen since the track started
  D.fb = Math.min(1, Math.max(0, (D.r - LO) / (1 - LO)));
  // ...and the drive itself: the engine's TRUE loudness, through the shared mapping (§65). `loudPk` is the peak this
  // file used to hold privately and `loudRange` is how much of its own range the track has actually shown, so the
  // section ladder lands across the full 0..1 instead of inside `loudRel`'s own fixed 18 LU span (loudlight.js).
  D.lpk = MS.loudPk === undefined ? 0 : MS.loudPk;
  D.base = baseLight(MS.loudRel, MS.loudRange, MS.loudAbs, D.fb);
  // the drop's own envelope and its release still FLOOR the drive, for the reason they always did: a 3 s loudness
  // window on the frame a slam lands is still two thirds full of the void the slam came out of.
  D.dyn = Math.min(1, Math.max(D.base, MS.dropEnv || 0, rel || 0));
  return D.dyn;
}
