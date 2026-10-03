// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The beat-nudge spring ease — shared. Lifted out of assets/scenes/torus2/motion.js (its `turn`, TURNTC, reset,
// angle) the way keycolour.js was lifted out of torus2/colour.js (DECISIONS §36), so MAXWELL (id 9) can speak the
// same motion language without importing another scene's folder (CONTRACTS §0: shared code goes to assets/math/*).
// Pure: no GL, no DOM, node-importable.
//
// The user's nudge per beat. The target is read off the BEAT COUNT (beatCount/16 of a turn), so it can never drift —
// nothing is integrated — and the angle EASES to it with a ~0.3 s time constant, so each beat is a nudge that springs
// into place rather than a steady spin. hush / calm double the time constant. Sixteen nudges = one turn.
//
// The state is PER CALLER: mkNudge() returns its own {turn, reset, angle, rate} set, so two scenes never share one
// angle (a module-level `let turnA` would have made TORUS2's ease and MAXWELL's the same variable, and the second
// scene to update would have read the first one's target — the same trap keycolour.js's mkAnchor() closed).
//
// torus2/motion.js keeps its own copy this release (the MAXWELL plan: "not a change to TORUS2"), so TORUS2's pixels
// cannot move; the duplication is noted for the orchestrator to fold later.

const TAU = Math.PI * 2;
export const TURNTC = 0.3;    // the nudge's time constant in seconds

export function mkNudge() {
  let a = 0, rate = 0;

  // One eased step toward the target yaw. `slow` (0..1 from hush/calm) doubles the time constant. `rate` is the
  // angular velocity of that step (rad/s) — what a turning magnetic dipole's moment RATE is made of.
  function turn(dt, target, slow) {
    let d = target - a;
    d -= TAU * Math.floor(d / TAU + 0.5);        // the short way: the target is wrapped to [0, 2pi), the angle is not
    const da = d * (1 - Math.exp(-dt / (TURNTC * (1 + slow))));
    a += da;
    rate = dt > 1e-6 ? da / dt : 0;
    return a;
  }

  return { turn, reset: () => { a = 0; rate = 0; }, angle: () => a, rate: () => rate };
}
