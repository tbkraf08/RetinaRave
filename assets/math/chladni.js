// The Chladni plate — the numerics CHLADNI (id 11) is made of. Pure: no GL, no DOM, node-importable (tools/check.js
// imports every scene, and a scene may import only math/*). The GLSL twin at the bottom is written FROM these exported
// constants, so the shader cannot drift from the JS (math/gielis.js and torus2/attractors.js do the same).
//
// THE PLATE. A square plate clamped nowhere, driven at one frequency, vibrates in a standing wave; sand is shaken off
// wherever the plate moves and piles up where it does not, so the sand draws the NODAL SET of that mode. The classical
// approximation for a free square plate is the antisymmetric combination of two product modes,
//
//   u(x, y; n, m) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy)         on the plate x, y ∈ [−1, 1]
//
// which is antisymmetric under swapping n and m (u(n, m) = −u(m, n)) and therefore identically zero at n = m: a FIGURE
// is an ordered pair n ≠ m. Two facts make it a good instrument: the two diagonals y = ±x are nodal for every (n, m)
// (put y = x into the formula and the two terms are equal), so every figure shares a skeleton the eye can lock onto,
// and |u| ≤ 2 everywhere, so one normalisation serves every figure.
//
// THE CIRCULAR PLATE. A round plate's modes are Bessel: u = J_n(k r)·cos(n θ), nodal on n diameters and on the circles
// k r = j_{n,s} (the zeros of J_n). For large argument J_n(x) ≈ sqrt(2/πx)·cos(x − nπ/2 − π/4), so the RINGS are
// asymptotically equally spaced in r with spacing π/k — and the cheap form
//
//   uC(r, θ; n, k) = cos(k r − nπ/2 − π/4)·cos(n θ)
//
// has exactly n diameters and rings of exactly that spacing. That is what this module draws for the circular sections.
// tools/test_chladni.js measures it against the true zeros of J_n: the SPACING is right (the true zeros' gaps converge
// to π — within 3.5 % from the third ring on) and for n = 0 and 1 the ring RADII are right too (< 1 % of a spacing). For
// a high sector count the whole ring pattern sits inside its true radii by the McMahon term (4n² − 1)/(8β) — 14 % of a
// spacing at n = 3, ring 2 — which moves where the rings are, never how many or how far apart, so the figure the eye
// reads is the right one. The correction is not applied: it costs a division per pixel to move a line by a hair.
// The amplitude envelope sqrt(2/πx) is dropped on purpose — the sand cares where u is zero, not how big it is between
// the lines, and a 1/sqrt(r) envelope would make the rim's lines invisible.
//
// THE TABLE. Twelve figures, indexed by the SUB NOTE'S INTERVAL TO THE TONIC, ordered so that a consonant interval
// draws a simple figure and a dissonant one a busy figure — "different pitches are different shapes", with the order
// of the shapes carrying the order of the harmony. The complexity order is the Tenney height log2(p·q) of the
// interval's just ratio (RATIO, the same twelve ratios GIELIS's species use); the figures are a ladder of (n, m) pairs
// sorted by n + m. SeeYouDrop's bass walk C#1 → A1 → F#1 → E1 is intervals 0, 8, 5, 3 to the C# tonic, which lands on
// (1, 2), (2, 5), (2, 3), (1, 5) — four figures with 1, 4, 2 and 4 interior nodal lines each. Distinct by eye.
//
// THE SLIDE. The sub's pitch is continuous through a slide, so the FIGURE must be: the fractional interval
// s = ((subNote − tonic) mod 12) + subCents/100 blends the two neighbouring table entries, u = mix(u_i, u_{i+1}, frac).
// This is continuous in s by construction — at every integer s the weight of the entry leaving is exactly 0, at the
// wrap from 12 to 0 the pair is (11, 0) with frac → 1 — and the test sweeps s across all twelve boundaries to prove it.
//
// THE PURITY. A sine sub excites one mode; a harmonic-rich bass excites its multiples too. h = 1 − subPure mixes in
// the (2n, 2m) and (3n, 3m) figures at W2 / W3, so a pure 808 draws clean lines and the intro's harmonic mid-bass
// draws a busy, rough figure. The normalisation divides by the mix's own bound so |field| ≤ 1 whatever h is.

import { RATIO } from './gielis.js';

export const TAU = Math.PI * 2;
export const PI = Math.PI;
export const UMAX = 2;        // |cos·cos − cos·cos| ≤ 2: the bound of one figure, so the normaliser is exact
export const W2 = 0.45;       // how much of the 2nd harmonic's figure a fully impure bass mixes in
export const W3 = 0.25;       // and of the 3rd — less, as a real bass's third partial is weaker than its second
export const NFIG = 12;       // one figure per semitone of the interval to the tonic
export const KC = PI;         // the circular figure's radial wavenumber per unit of m: rings every 1/m of the radius

// The ladder of figures, simplest first: ordered by n + m (then by the narrower pair), all with n ≠ m so none is the
// zero field. Twelve entries, the busiest (3, 7) reaching ten nodal lines across the plate.
export const LADDER = [[1, 2], [1, 3], [2, 3], [1, 4], [2, 4], [1, 5], [3, 4], [2, 5], [1, 6], [3, 5], [4, 5], [3, 7]];

// Tenney height log2(p·q) of each interval's just ratio — how complex the interval is as a frequency ratio.
export const tenney = (i) => Math.log2(RATIO[((i % 12) + 12) % 12][0] * RATIO[((i % 12) + 12) % 12][1]);

// The intervals in increasing Tenney height: unison, fifth, fourth, major sixth, major third, minor third, tritone,
// minor sixth, minor seventh, major second, major seventh, minor second. This is the order the ladder is dealt in.
export const RANK = Array.from({ length: NFIG }, (_, i) => i).sort((a, b) => tenney(a) - tenney(b) || a - b);

// FIG[interval] = the (n, m) of that interval: the r-th simplest figure for the r-th simplest interval.
export const FIG = (() => {
  const t = new Array(NFIG);
  RANK.forEach((iv, r) => { t[iv] = LADDER[r]; });
  return t;
})();

// The figure one interval draws, with its complexity key n + m and how many interior nodal lines it shows.
export const figOf = (interval) => {
  const i = ((interval | 0) % NFIG + NFIG) % NFIG;
  const [n, m] = FIG[i];
  return { interval: i, n, m, sum: n + m, rank: RANK.indexOf(i), tenney: tenney(i), ratio: RATIO[i] };
};

export const figTable = () => Array.from({ length: NFIG }, (_, i) => figOf(i));

// The fractional interval s, wrapped into [0, 12), split into the pair of table entries it sits between.
export function blendOf(s) {
  const w = ((s % NFIG) + NFIG) % NFIG;
  const i = Math.floor(w) % NFIG;
  return { i, j: (i + 1) % NFIG, f: w - Math.floor(w), s: w };
}

// The square plate's mode. x, y ∈ [−1, 1]; |u| ≤ UMAX.
export const uSq = (x, y, n, m) => Math.cos(n * PI * x) * Math.cos(m * PI * y) - Math.cos(m * PI * x) * Math.cos(n * PI * y);

// The circular plate's mode, asymptotic Bessel (see the header). r ∈ [0, 1], θ in radians; |uC| ≤ 1, so it is scaled
// to UMAX to sit in the same normalisation as the square figure.
export const uCirc = (r, th, n, m) => UMAX * Math.cos(KC * m * r - n * PI * 0.5 - PI * 0.25) * Math.cos(n * th);

// The mix's bound, so the field below is in [−1, 1] for every h: one figure plus its two harmonic copies.
export const norm = (h) => 1 / (UMAX * (1 + h * (W2 + W3)));

// The figure at fractional interval s, with harmonic content h ∈ [0, 1] and plate shape `bnd` (0 = square, 1 = round).
// Every term is the same mix in f, so the whole field is continuous in s.
export function field(x, y, s, h, bnd = 0) {
  const b = blendOf(s);
  const A = FIG[b.i], B = FIG[b.j];
  const r = Math.min(1, Math.hypot(x, y));
  const th = Math.atan2(y, x);
  const one = (k) => {
    const sq = uSq(x, y, k * A[0], k * A[1]) + b.f * (uSq(x, y, k * B[0], k * B[1]) - uSq(x, y, k * A[0], k * A[1]));
    if (bnd <= 0) return sq;
    const ci = uCirc(r, th, k * A[0], k * A[1]) + b.f * (uCirc(r, th, k * B[0], k * B[1]) - uCirc(r, th, k * A[0], k * A[1]));
    return sq + bnd * (ci - sq);
  };
  let u = one(1);
  if (h > 0) u += h * (W2 * one(2) + W3 * one(3));
  return u * norm(h);
}

// How far inside the plate a point is: 1 at the centre, 0 at the boundary, negative outside. `bnd` morphs the boundary
// from the square (Chebyshev radius) to the disc (Euclidean radius) — CONTRACTS §1.10's porthole, made musical.
export const inside = (x, y, bnd) => 1 - (Math.max(Math.abs(x), Math.abs(y)) + bnd * (Math.hypot(x, y) - Math.max(Math.abs(x), Math.abs(y))));

// --- Bessel J_n, for the test only (the shader never calls it) -------------------------------------------------
// The ascending series, which converges fast for the arguments the ring test needs (x ≤ ~20), plus the large-argument
// asymptote as a cross-check. Not exported into the GLSL twin: the twin uses the asymptotic form by design.
export function besselJ(n, x) {
  let term = 1;
  for (let k = 1; k <= n; k++) term *= x / (2 * k);
  let sum = term, t = term;
  for (let k = 1; k < 60; k++) {
    t *= -(x * x) / (4 * k * (k + n));
    sum += t;
    if (Math.abs(t) < 1e-16 * Math.abs(sum)) break;
  }
  return sum;
}

// The s-th positive zero of J_n (s = 1, 2, …), by bisection from McMahon's estimate.
export function besselZero(n, s) {
  const g = (s + n / 2 - 0.25) * PI;
  let a = Math.max(1e-6, g - 1.2), b = g + 1.2;
  let fa = besselJ(n, a);
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2, fm = besselJ(n, m);
    if (fa * fm <= 0) { b = m; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

const n6 = (x) => x.toFixed(6);
const figList = FIG.map(([n, m]) => `vec2(${n6(n)}, ${n6(m)})`).join(', ');

// The GLSL twin. Every constant is written from the exported JS values; tools/test_chladni.js parses them back out of
// this string and compares them to the JS to 0.
export const GLSL = `
#define CH_PI 3.14159265
#define CH_UMAX ${n6(UMAX)}
#define CH_W2 ${n6(W2)}
#define CH_W3 ${n6(W3)}
#define CH_KC ${n6(KC)}
const vec2 CH_FIG[${NFIG}] = vec2[${NFIG}](${figList});
// the square plate's mode — the exact twin of uSq()
float chSq(vec2 p, vec2 nm) {
  return cos(nm.x * CH_PI * p.x) * cos(nm.y * CH_PI * p.y) - cos(nm.y * CH_PI * p.x) * cos(nm.x * CH_PI * p.y);
}
// the circular plate's mode, asymptotic Bessel — the exact twin of uCirc()
float chCirc(float r, float th, vec2 nm) {
  return CH_UMAX * cos(CH_KC * nm.y * r - nm.x * CH_PI * 0.5 - CH_PI * 0.25) * cos(nm.x * th);
}
// one harmonic of the blended figure — the exact twin of field()'s one(k)
float chOne(vec2 p, float r, float th, vec2 A, vec2 B, float f, float bnd) {
  float sq = mix(chSq(p, A), chSq(p, B), f);
  if (bnd <= 0.0) return sq;
  return mix(sq, mix(chCirc(r, th, A), chCirc(r, th, B), f), bnd);
}
// the figure at fractional interval s, harmonic content h, plate shape bnd — the exact twin of field(). The harmonic
// terms sit behind a UNIFORM branch (h is the same for every pixel), so a pure sub costs a third of an impure one.
float chField(vec2 p, float s, float h, float bnd) {
  float w = mod(mod(s, ${n6(NFIG)}) + ${n6(NFIG)}, ${n6(NFIG)});
  int i = int(floor(w));
  int j = int(mod(float(i + 1), ${n6(NFIG)}));
  float f = w - floor(w);
  vec2 A = CH_FIG[i], B = CH_FIG[j];
  float r = min(1.0, length(p));
  float th = atan(p.y, p.x);
  float u = chOne(p, r, th, A, B, f, bnd);
  if (h > 0.0) u += h * (CH_W2 * chOne(p, r, th, 2.0 * A, 2.0 * B, f, bnd) + CH_W3 * chOne(p, r, th, 3.0 * A, 3.0 * B, f, bnd));
  return u / (CH_UMAX * (1.0 + h * (CH_W2 + CH_W3)));
}
// how far inside the plate — the exact twin of inside()
float chIn(vec2 p, float bnd) {
  return 1.0 - mix(max(abs(p.x), abs(p.y)), length(p), bnd);
}
`;
