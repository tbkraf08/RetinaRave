// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The Gielis superformula and the numbers GIELIS (id 10) measures itself with. Pure: no GL, no DOM, node-importable
// (tools/check.js imports every scene, and a scene may import only math/*).
//
//   r(φ) = ( |cos(m φ / 4) / a|^n2 + |sin(m φ / 4) / b|^n3 )^(−1 / n1)            (Gielis 2003)
//
// m is the lobe count · n1 the PINCH (n1 → ∞ is a circle for any m, small n1 a star) · n2, n3 the LEAN of the lobes
// (unequal = lopsided) · a, b the axis stretch. The 3D supershape is the spherical product of two such curves,
//   P(θ, φ) = ( r1(θ) cos θ · r2(φ) cos φ,  r1(θ) sin θ · r2(φ) cos φ,  r2(φ) sin φ ),  θ ∈ (−π, π], φ ∈ [−π/2, π/2]
// which is the unit sphere when r1 = r2 = 1 (n1 large), so the rest state of the nest is a sphere drawn as latitude rings.
//
// CLOSURE. |cos| and |sin| have period π, so r(φ + 2πk) = r(φ) needs k·m/2 ∈ ℤ. With m = num/den in lowest terms that
// is k = 2·den/gcd(num, 2) turns. When the lean is SYMMETRIC (n2 = n3 and a = b) the half-period swap |cos| ↔ |sin| is
// itself a symmetry of r, so k = den turns suffice — that is the familiar "m = p/q closes after q turns with p lobes".
// Both are returned; the scene draws `turns` (the symmetric count) and skips the wrapping segment when the lean has
// made the ring open, exactly as TORUS2's unwound rings do.
//
// SPECIES. Family k's lobe count is the just-intonation ratio of the interval (k − key) mod 12 above the key, scaled by
// M0 so the root reads as a clean low count: m = M0 · p/q. Consonant intervals are simple and close in one or two
// turns, dissonant ones are starry and take five — "different pitches are different shapes" by construction, on the
// same key the hue logic is on (math/keycolour.js). One entry needs a word: the minor second's 16/15 gives m = 64/15,
// which closes only after 15 turns — over the ≤ 8 the scene can afford — so every m is snapped to the nearest rational
// with denominator ≤ QCAP (the minor second alone moves, 64/15 = 4.2667 → 17/4 = 4.25, 0.4 %).
//
// THE RULER. Green's theorem on the equatorial profile: A = ½∮(x dy − y dx) (the shoelace sum) and L = Σ|Δz| of the
// polygon (r(θ)cos θ, r(θ) sin θ) over ONE turn of θ, Q = 4πA/L² — 1 for a circle, less for anything else. One turn,
// not the full q turns, so Q is comparable across families (a circle traced q times has 4πA/L² = 1/q, which would make
// the ruler read the species instead of the pinch). This is the only instrument that made the user's "collapse into
// interesting shapes, then rebound to the circle" sentences testable on NAV2 (DECISIONS §46 item 4).

export const TAU = Math.PI * 2;
export const N1_MIN = 0.5;     // n1 never reaches 0: pow(x, −1/n1) with n1 → 0 is an overflow, and the shader's pow agrees
export const R_MAX = 4;        // a radius clamp in units of the family's own size — no lean can throw a point off screen
export const BASE_MIN = 1e-4;  // |cos|^n2 + |sin|^n3 can be made small by a lean; never raise 0 to a negative power
export const M0 = 4;           // the scale of the species: the root (1/1) is m = 4, a rounded square
export const QCAP = 5;         // the most turns a ring may need to close (the segment budget is per ring)
export const N_Q = 512;        // samples of the equatorial profile for the ruler

// The twelve just-intonation ratios of the intervals above the key, in semitones (the scene's one table — swapping the
// species for the fallback `m = k + 3` is a change to mOf() alone).
export const RATIO = [[1, 1], [16, 15], [9, 8], [6, 5], [5, 4], [4, 3], [7, 5], [3, 2], [8, 5], [5, 3], [9, 5], [15, 8]];

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// r(φ) — the superformula. abs() before every power (GLSL's pow is undefined on a negative base), n1 floored.
export function sf(phi, m, n1, n2, n3, a, b) {
  const t = m * phi * 0.25;
  const c = Math.abs(Math.cos(t) / a), s = Math.abs(Math.sin(t) / b);
  const base = Math.max(Math.pow(c, n2) + Math.pow(s, n3), BASE_MIN);
  const r = Math.pow(base, -1 / Math.max(n1, N1_MIN));
  return r > R_MAX ? R_MAX : r;
}

// The spherical product of two superformula curves — the 3D supershape.
export function point3(theta, phi, P1, P2, out = [0, 0, 0]) {
  const r1 = sf(theta, P1[0], P1[1], P1[2], P1[3], P1[4], P1[5]);
  const r2 = sf(phi, P2[0], P2[1], P2[2], P2[3], P2[4], P2[5]);
  out[0] = r1 * Math.cos(theta) * r2 * Math.cos(phi);
  out[1] = r1 * Math.sin(theta) * r2 * Math.cos(phi);
  out[2] = r2 * Math.sin(phi);
  return out;
}

// How many turns of θ a ring of lobe count num/den needs to close: `sym` for a symmetric lean (n2 = n3, a = b),
// `gen` for any lean. Both are integers ≥ 1.
export function closure(num, den) {
  const g = gcd(num, den) || 1;
  const p = num / g, q = den / g;
  return { sym: q, gen: (q * 2) / gcd(p, 2), num: p, den: q };
}

// The nearest rational to x with denominator ≤ cap (a brute force over the cap — cap is 5).
export function snap(x, cap) {
  let best = { num: Math.round(x), den: 1, err: Math.abs(x - Math.round(x)) };
  for (let d = 2; d <= cap; d++) {
    const n = Math.round(x * d), e = Math.abs(x - n / d);
    if (e < best.err - 1e-12) best = { num: n, den: d, err: e };
  }
  const g = gcd(best.num, best.den) || 1;
  return { num: best.num / g, den: best.den / g };
}

// The species of one interval: its ratio, its lobe count m and the turns a ring of it needs.
export function mOf(interval) {
  const i = ((interval | 0) % 12 + 12) % 12;
  const [p, q] = RATIO[i];
  const exact = (M0 * p) / q;
  const f = snap(exact, QCAP);
  const c = closure(f.num, f.den);
  return { interval: i, p, q, exact, num: c.num, den: c.den, m: c.num / c.den, turns: c.sym, turnsGen: c.gen, lobes: c.num * (c.sym / c.den) };
}

export const mTable = () => RATIO.map((_, i) => mOf(i));

// Green's theorem on the equatorial profile over one turn: {Q, A, L, rMin, rMax}.
export function greenQ(m, n1, n2, n3, a, b, n = N_Q) {
  let A = 0, L = 0, rMin = 1e9, rMax = 0;
  let x0 = 0, y0 = 0, xp = 0, yp = 0;
  for (let j = 0; j < n; j++) {
    const th = (j / n) * TAU, r = sf(th, m, n1, n2, n3, a, b);
    const x = r * Math.cos(th), y = r * Math.sin(th);
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (j === 0) { x0 = x; y0 = y; } else { A += xp * y - x * yp; L += Math.hypot(x - xp, y - yp); }
    xp = x;
    yp = y;
  }
  A += xp * y0 - x0 * yp;
  L += Math.hypot(x0 - xp, y0 - yp);
  A = Math.abs(A) / 2;
  return { Q: L > 0 ? (4 * Math.PI * A) / (L * L) : 0, A, L, rMin, rMax };
}

const n6 = (x) => x.toFixed(6);
// The GLSL twin. Every constant is written from the exported JS values, so the port cannot drift from the twin
// (torus2/attractors.js's pattern; tools/test_gielis.js parses these numbers back out and compares them to 0).
export const GLSL = `
#define GTAU 6.2831853
#define N1_MIN ${n6(N1_MIN)}
#define R_MAX ${n6(R_MAX)}
#define BASE_MIN ${n6(BASE_MIN)}
// r(phi) of the superformula — the exact twin of math/gielis.js sf(). P = (m, n1, n2, n3), Q = (a, b).
float sfR(float phi, vec4 P, vec2 Qb) {
  float t = P.x * phi * 0.25;
  float c = abs(cos(t) / Qb.x), s = abs(sin(t) / Qb.y);
  float base = max(pow(c, P.z) + pow(s, P.w), BASE_MIN);
  return min(pow(base, -1.0 / max(P.y, N1_MIN)), R_MAX);
}
// the spherical product: the 3D supershape point at (theta, phi)
vec3 sfPoint(float theta, float phi, vec4 P1, vec2 Q1, vec4 P2, vec2 Q2) {
  float r1 = sfR(theta, P1, Q1), r2 = sfR(phi, P2, Q2);
  return vec3(r1 * cos(theta) * r2 * cos(phi), r1 * sin(theta) * r2 * cos(phi), r2 * sin(phi));
}
`;
