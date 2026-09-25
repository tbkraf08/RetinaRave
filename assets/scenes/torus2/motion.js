// TORUS2 — where the nest is and how the camera looks at it (brief-torus2 spec 4).
//
// reframe(): the SU(2) tumble and the pole offset slide the whole nest around the stereographic window, so the camera
// tracks the centroid of a coarse CPU sample of the lit families (the same math/hopf.js functions the vertex shader
// ports) and holds its radius. Both are eased, never cut. Inherited from TORUS (DECISIONS §4).
//
// turn(): the user's nudge per beat. The target is beatCount/16 of a turn — it never drifts, because it is read off
// the beat count and not integrated — and the angle EASES to it with a ~0.3 s time constant, so each beat is a nudge
// that springs into place rather than a steady spin. hush/calm double the time constant. Sixteen nudges = one turn.
//
// dist(): the camera distance that makes the nest fill `size` of the SHORT edge, with the beat bounce dividing into
// it. A point at radius r and view depth d lands at ndc_y = focal·r/d and ndc_x = focal·r/(d·aspect), so the short
// edge binds at d = focal·r/(size·min(1, aspect)) — portrait included (v0.6's phone is 390×844).

import { fibre } from '../../math/hopf.js';

const TAU = Math.PI * 2;
export const TURNTC = 0.3;    // the nudge's time constant in seconds
export const BOUNCE = 0.05;   // the beat bounce: 5 % of the size, visible (the user's own number)
const TMP = [0, 0, 0];
const S = [];

let turnA = 0;                // the eased yaw (radians, unwrapped)
export const reset = () => { turnA = 0; };
export const angle = () => turnA;

// One eased step toward the target yaw. `slow` (0..1 from hush/calm) doubles the time constant.
export function turn(dt, target, slow) {
  let d = target - turnA;
  d -= TAU * Math.floor(d / TAU + 0.5);        // the short way: the target is wrapped to [0, 2pi), the angle is not
  turnA += d * (1 - Math.exp(-dt / (TURNTC * (1 + slow))));
  return turnA;
}

// The camera distance for a given fill of the short edge, with the bounce pulse dividing into it.
export function dist(radius, focal, fill, aspect, pulse) {
  return focal * radius / (Math.max(0.05, fill) * Math.min(1, aspect)) / pulse;
}

// Centroid + radius of the lit part of the nest, eased into CEN = [x, y, z, r].
export function reframe(dt, th, ch, psi0, alpha, delta, CEN) {
  let n = 0, cx = 0, cy = 0, cz = 0, s2 = 0;
  S.length = 0;
  for (let k = 0; k < 12; k++) {
    if (ch[k] < 0.3) continue;                       // only the pitch classes that are actually lit
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < 5; i++) {
        const p = fibre(th[k], j / 5 * TAU, i / 5 * TAU, psi0, alpha, delta, TMP);
        if (!(Math.hypot(p[0], p[1], p[2]) < 6)) continue;
        S.push(p[0], p[1], p[2]);
        cx += p[0]; cy += p[1]; cz += p[2]; n++;
      }
    }
  }
  if (!n) return CEN;
  cx /= n; cy /= n; cz /= n;
  for (let i = 0; i < S.length; i += 3) s2 += (S[i] - cx) ** 2 + (S[i + 1] - cy) ** 2 + (S[i + 2] - cz) ** 2;
  // second pass: drop the runaway tails, so the frame follows the dense body of the nest and not its spray
  const cut = 1.3 * Math.sqrt(s2 / n);
  let m = 0, dx = 0, dy = 0, dz = 0, far = 0;
  for (let i = 0; i < S.length; i += 3) {
    const q = Math.hypot(S[i] - cx, S[i + 1] - cy, S[i + 2] - cz);
    if (q > cut) continue;
    dx += S[i]; dy += S[i + 1]; dz += S[i + 2]; m++;
    if (q > far) far = q;
  }
  if (m) { cx = dx / m; cy = dy / m; cz = dz / m; }
  const rad = Math.max(1.2, Math.min(3.4, far * 1.15));
  const e = Math.min(1, 2.5 * dt);
  CEN[0] += (cx - CEN[0]) * e;
  CEN[1] += (cy - CEN[1]) * e;
  CEN[2] += (cz - CEN[2]) * e;
  CEN[3] += (rad - CEN[3]) * e;
  return CEN;
}
