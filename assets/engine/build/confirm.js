// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// THE SLAM'S CONFIRMATION (DECISIONS §143 item 1): a drop candidate — the live detector's bass-confirmed onset (build.js) or v3's own
// dropEvt (features.js) — is PENDING until the music shows the evidence a drop has, measured on the nine tracks (build.js's header):
//   the sub is back      the ears' causal sub gate at or above SUB_BACK (every confirmed drop within .25 s; a piano never)
//   the energy is there  the loudness ladder (math/loudlight baseLight on loudRel) at or above LEVEL (confirmed drops .53–.99; a kick
//                        in a quiet passage .17, a fill .38)
// released on the first frame both hold (the same frame when they already do; up to PEND beats later — WhoLikesToParty 131.4 reaches
// the level at .5 s), dropped after PEND beats without them. One definition for both detectors, one knob set (build.js's BUILD, handed
// in — no import, so build.js can import this). Pure, no state but the candidate: node replays it over a trace's columns
// (tools/work/drop/v3diag.mjs).
import { baseLight } from '../../math/loudlight.js';
// The ladder the level test reads: NaN (= the test passes) with the loud stage off (loudAbs < 0, `&loud=0`, node's v3 harness) or
// while the track has shown less than LEVEL_RNG LU of range — a mid-track start (`&at=`, a seek) restarts the loud stage with the
// §67 warm-up guard holding loudRel near .8 and the range growing from 0, and a ladder read off that is not the track's (measured:
// Comptine from 36 s reads .28 → .58 across 48–53 s where the whole-track ladder reads 0 → .9).
export function ladderOf(loudRel, loudRange, loudAbs, k) {
  const ab = loudAbs === undefined || loudAbs === null ? -1 : +loudAbs;
  if (!(ab >= 0) || !(+loudRange >= k.LEVEL_RNG)) return NaN;
  return baseLight(+loudRel, +loudRange, ab, NaN);
}

export class Confirm {
  constructor(k) { this.k = k; this.B = null; }
  get pending() { return this.B !== null; }
  arm(B) { if (this.B === null) this.B = B; }   // a second candidate while one is pending is the same drop
  clear() { this.B = null; }
  // one frame while pending: 1 = release the drop now, 0 = keep waiting, -1 = dropped (PEND beats passed). subGate: the ears' causal
  // gate; lad: the ladder, NaN when the loud stage is off (then the level test passes — `&loud=0` is the pre-§143 slam)
  step(B, subGate, lad) {
    if (this.B === null) return 0;
    const k = this.k;
    const subOk = k.SUB_BACK <= 0 || subGate >= k.SUB_BACK, levelOk = k.LEVEL <= 0 || !isFinite(lad) || lad >= k.LEVEL;
    if (subOk && levelOk) { this.B = null; return 1; }
    if (B - this.B > k.PEND) { this.B = null; return -1; }
    return 0;
  }
}
