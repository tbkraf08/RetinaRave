// DUST's Hopf-fibre overlay — geometry, palette and segment packing, kept out of index.js.
//
// Over the swarm, in the same camera, a few Hopf tori. For each of `nl` latitude circles of the base S2 (colatitude
// theta) we draw `nF` of its fibres, each a closed polyline of `N` segments. The fibre over (theta, phi) is the circle
//     psi -> ( cos(theta/2) e^{i(psi + phi/2)},  sin(theta/2) e^{i(psi - phi/2)} )   on S3
// (assets/math/hopf.js — its header is the mathematics). Stereographic projection from (0,0,0,1) sends every fibre to
// a circle in R3, and the nF fibres of one latitude onto a torus of revolution: any two of them are linked exactly
// once, which is the whole reason to draw them. The tumble rotSU2(alpha) is in SU(2) but not in the Hopf U(1), so it
// carries fibres to fibres and the family turns rigidly instead of deforming.
//
// Near the projection pole the image runs to infinity. The gate den = 1 - z[3] > GATE at BOTH ends drops the run-away
// arc, and the surviving end fades through the colour, never through alpha (CONTRACTS 1.12: alpha is coverage).
import { fibre4, rotSU2, stereo } from '../../math/hopf.js';

const TAU = Math.PI * 2;
const QT = [0.4, 0.7, 1, 1.4];                 // synapse's per-tier count knob, q = QT[tier]
const GATE = 0.14;                             // pole gate on den; the fade runs over the next 0.25 of den
const LUM = [0.299, 0.587, 0.114];
const PHASE = [0, 0.33, 0.67];

// Counts for a quality tier, exactly synapse scene 4's: nl tori, nF fibres each, N segments per fibre.
export function counts(tier) {
  const q = QT[tier] === undefined ? 1 : QT[tier];
  return { nl: Math.floor(2 + 2 * q), nF: Math.floor(5 + 5 * q), N: Math.floor(30 + 26 * q) };
}

// Buffer capacity: the largest nl*nF*N any tier asks for (tier 3: 4 x 12 x 66).
export const CAP = (() => {
  let m = 0;
  for (let t = 0; t < 4; t++) { const c = counts(t); m = Math.max(m, c.nl * c.nF * c.N); }
  return m;
})();

// The CPU twin of the shader's palM (shaders.js): the same hue centre, spread, invert, saturation and brightness, so
// the fibres sit in the swarm's palette rather than beside it.
function palM(t, d, out) {
  let lum = 0;
  for (let i = 0; i < 3; i++) {
    let c = 0.5 + 0.5 * Math.cos(TAU * (d.hue + (t - 0.5) * d.spread + PHASE[i]));
    c = Math.pow(c, 1.7);
    c = c + (1 - c - c) * (d.invert * 0.85);   // mix(c, 1-c, k)
    out[i] = c;
    lum += c * LUM[i];
  }
  for (let i = 0; i < 3; i++) out[i] = (lum + (out[i] - lum) * d.sat) * d.bri;
  return out;
}

// How many fibres per torus actually fit in `cap` segments. The brief's counts always fit, but the budget is the
// core's to change (CONTRACTS 1.4), so fibres are dropped rather than a polyline truncated mid-ring.
export function fit(c, cap) {
  return Math.max(0, Math.min(c.nF, Math.floor(cap / Math.max(1, c.nl * c.N))));
}

// Pack the overlay into `segs` (12 floats per segment: x0 y0 z0 w0 x1 y1 z1 w1 r g b a). Returns the segment count.
// o: {nl, nF, N, flowMid, alpha, band[3], lvl, alive, s, wpx, dist, mood, vp}
export function emit(segs, cap, o) {
  const d = o.mood, vp = o.vp, s = o.s, col = [0, 0, 0], z = [0, 0, 0, 0], p = [0, 0, 0];
  const it = 0.3 * (0.35 + o.lvl);             // synapse's intensity: 0.3 * lv
  let n = 0;
  for (let l = 0; l < o.nl; l++) {
    // colatitude of torus l, wobbling on mid-band time; odd tori twist the other way so the family never moves as one
    const theta = Math.PI * (l + 1) / (o.nl + 1) + 0.25 * Math.sin(0.2 * o.flowMid + l);
    const tw = 0.15 * o.flowMid * (l % 2 ? 1 : -1);
    const bri = it * (0.35 + 1.3 * o.band[l % 3]) * o.alive;
    const ta = 0.15 + 0.22 * l;                // this torus's place in the palette
    for (let f = 0; f < o.nF; f++) {
      const phi = f / o.nF * TAU + tw;
      palM(ta + f / o.nF * 0.6, d, col);
      let px = 0, py = 0, pz = 0, pw = 0, pd = 0;
      for (let i = 0; i <= o.N; i++) {
        fibre4(theta, phi, i / o.N * TAU, z);
        rotSU2(z, o.alpha);
        const den = 1 - z[3];                  // the pole distance, before the projection divides by it
        stereo(z, p);
        const x = p[0] * s, y = p[1] * s, zz = p[2] * s;
        const vz = vp[3] * x + vp[7] * y + vp[11] * zz + vp[15];   // clip w: distance along the view axis
        const wpx = o.wpx * o.dist / Math.max(vz, 0.2);            // near fibres widen like the points do
        const dm = den < pd ? den : pd;
        if (i && dm > GATE && n < cap) {
          const k = bri * Math.min(1, (dm - GATE) * 4), j = n * 12;
          segs[j] = px; segs[j + 1] = py; segs[j + 2] = pz; segs[j + 3] = pw;
          segs[j + 4] = x; segs[j + 5] = y; segs[j + 6] = zz; segs[j + 7] = wpx;
          segs[j + 8] = col[0] * k; segs[j + 9] = col[1] * k; segs[j + 10] = col[2] * k; segs[j + 11] = 1;
          n++;
        }
        px = x; py = y; pz = zz; pw = wpx; pd = den;
      }
    }
  }
  return n;
}
