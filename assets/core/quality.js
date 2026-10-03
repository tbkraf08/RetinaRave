// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Q: adaptive quality. Frame-time controller that lowers/raises a single knob q in [0,1]; scenes read the derived
// iter / scale (and their own tier tables) and never touch q. Lifted from cardioid3 updateQuality (tongueN dropped).
import { clamp } from '../math/util.js';

// A coarse-pointer device (phone, tablet) starts lower so the first two seconds do not stutter before the controller catches
// up (v0.6); the controller then finds the device's level as before. Headless Chrome and node have a fine pointer: unchanged.
export const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches;
export const Q = { q: COARSE ? 0.35 : 0.55, ceil: 1, acc: 0, n: 0, worst: 0, good: 0, iter: 150, scale: 0.75, fps: 60, hold: null };
// hold: null = the controller is free. A number = the recorder's pin (DECISIONS §92): the controller still measures (Q.fps), but q and
// its ceiling are set back to the pin at every window, so a take renders at one tier. Set through pinQ(), never by a scene.

const derive = () => { Q.iter = Math.round(64 + 200 * Q.q); Q.scale = Math.round((0.38 + 0.62 * Q.q) * 16) / 16; };
export function pinQ(q) { // q: the tier to hold (0..1) · null: release (the controller resumes from the current q)
  Q.hold = q === null ? null : clamp(q, 0, 1);
  if (Q.hold !== null) { Q.q = Q.ceil = Q.hold; derive(); }
}

export function updateQuality(dtRaw) {
  Q.acc += dtRaw;
  Q.n++;
  Q.worst = Math.max(Q.worst, dtRaw);
  if (Q.acc >= 0.5) {
    const avg = Q.acc / Q.n;
    Q.fps = 1 / avg;
    if (avg > 0.0265) {
      Q.ceil = Math.max(0, Q.q - 0.05);
      Q.q -= 0.2;
      Q.good = 0;
    } else if (avg > 0.0188) {
      Q.ceil = Math.max(0, Q.q - 0.02);
      Q.q -= 0.07;
      Q.good = 0;
    } else if (avg < 0.0175) {
      Q.good += Q.acc;
      if (Q.good > 2.5) {
        Q.q = Math.min(Q.q + 0.04, Q.ceil);
        Q.good = 1.5;
      }
    }
    Q.ceil = Math.min(1, Q.ceil + 0.002);
    if (Q.hold !== null) Q.q = Q.ceil = Q.hold;
    Q.q = clamp(Q.q, 0, 1);
    Q.acc = 0;
    Q.n = 0;
    Q.worst = 0;
    derive();
  }
}

// Tier 0..3 from q, for scenes with particle-count tables.
export const tier = () => (Q.q < 0.25 ? 0 : Q.q < 0.5 ? 1 : Q.q < 0.8 ? 2 : 3);

// Shared count budgets per tier (v0.2 §13, CONTRACTS §1.4): `points` for gl_VertexID particle clouds (DUST's table),
// `segs` for CPU stroke buffers (ctx.lines path A; 16384 is POLYTOPE's cap). Scenes read ctx.budget(kind) and never
// copy the numbers; per-ring / per-edge subdivision tables stay with the scene that owns the geometry.
export const BUDGET = { points: [20000, 45000, 90000, 150000], segs: [2500, 5000, 9000, 16384] };
export const budget = (kind) => BUDGET[kind][tier()];
