// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// GROOVE: one rotation angle shared by the scenes. drift turns at a rate set by energy (direction per section),
// sway is a pendulum locked to pairs of beats (amplitude from bass, only when the rhythm is regular), nod is an
// onset jerk — kicks and snares pull opposite ways. Lifted from cardioid3 updateGroove.
import { Spring } from '../math/util.js';

export const GROOVE = { rot: 0, drift: 0, sway: 0, nod: new Spring(0, 6), vel: 0, dir: 1, dirSet: 0 };

export function updateGroove(dt, S) {
  const G = GROOVE, pr = S.presence, prev = G.rot;
  if (S.sectionEvt || !G.dirSet) {
    G.dir = S.seed.th < 0 ? -1 : 1;
    G.dirSet = 1;
  }
  G.drift += dt * G.dir * (0.03 + 0.35 * S.eS) * pr;
  const e = 1 - Math.pow(1 - S.beatPhase, 2.5), A = (0.12 + 0.3 * S.bass) * S.regularity * pr;
  G.sway = A * Math.sin(Math.PI * (S.beatCount + e) / 2);
  // critically damped, w=6: peak angle = v/(w e) ~ 0.1 rad per full-strength hit
  if (S.onset && S.hitStrength > 0.4) G.nod.v += S.hitStrength * (S.bassFast > 0.5 ? 1 : -1) * 1.8;
  G.nod.step(0, dt);
  G.rot = G.drift + G.sway + G.nod.x;
  G.vel = (G.rot - prev) / Math.max(dt, 1e-4);
}
