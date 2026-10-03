// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV2's numerics (docs/workers/brief-nav2.md §1): the force model needs no chart and no table, so everything it
// asks of the Mandelbrot set is computed from c itself.
//
//  * findCycle(c)  the attracting cycle of an ARBITRARY interior c: iterate the critical orbit, read the period off a
//                  nearest return, polish by Newton on f^q(z) - z. lambda = (f^q)'(z) comes out of the same pass.
//  * rho = |lambda| is the interior coordinate whose level set rho = 1 IS the boundary of the component (smooth, unlike
//                  the exterior distance estimate, which collapses like sqrt(d) at the cusp and is useless as a wall).
//  * rhoGrad(c)    central differences of the polish: the wall's normal. The same differences give dlambda/dc, whose
//                  reciprocal is the component's size in c (the gate's child-size proxy and the tiny-bulb trap).
//  * pot / dist    the exterior Green's potential log2 G and its distance estimate: the drop's ruler.
//  * nearestRational  the Farey neighbour of an internal angle: the gate's address, q <= 7.
//
// Pure, node-importable, no DOM (tools/test_field.js imports it; assets/scenes/nav2/ imports it in the browser).
// Every budget is a named constant: the force model's whole cost is bounded by these five numbers.
import { clamp, TAU } from './util.js';

export const SUB = 512;        // critical-orbit steps between two nearest-return probes
export const N_ITER = 4096;    // the per-frame budget (rho <= 0.985 converges to RET_TOL inside 1000 steps)
export const N_MAX = 32768;    // the bound: only the rare off-frame seek (a drop's return) is allowed to grow this far
export const P_MAX = 64;       // the longest period the nearest-return detector will name
export const NEWTON = 8;       // Newton steps on f^q(z) - z (the 9th pass is the evaluation that reports lambda)
export const POT_ITER = 512;   // escape iterations for the potential (log2 G in [-11.9, 0.9] escapes inside ~14)
export const ESC_R2 = 1e8;     // |z|^2 at which the orbit is called escaped
export const RET_TOL = 1e-6;   // a nearest return this close names the period
export const POL_TOL = 1e-14;  // Newton is done at this residual
export const HAS_TOL = 1e-10;  // a polished residual above this is not a cycle
export const RHO_HAS = 0.9999; // |lambda| at or above this is parabolic/repelling: no attracting cycle
export const GRAD_H = 1e-5;    // central-difference step in c for d/dc
export const DIV_TOL = 1e-9;   // a divisor of the named period that the POLISHED point already satisfies is the real one
export const EPS_LO = 0.003;   // the shader's convergence radius, as NAV sets it from the cycle's own spacing
export const EPS_HI = 0.03;

const SC = { zr: 0, zi: 0, lr: 0, li: 0, res: 1 };   // polish scratch: one object, no per-frame allocation

export function mkCyc() {
  return { has: 0, q: 1, zr: 0, zi: 0, lr: 0, li: 0, rho: 1, arg: 0, eps2: 9e-4, n: 0, res: 1 };
}

// Newton on f_c^q(z) - z = 0 in z at fixed c, from the seed (zr, zi). The last pass is a pure evaluation, so
// SC.lr/li = (f^q)'(z) at the returned z (not at the previous one). Writes and returns SC.
export function polish(cr, ci, q, zr, zi) {
  for (let it = 0; it <= NEWTON; it++) {
    let wr = zr, wi = zi, dr = 1, di = 0;
    for (let j = 0; j < q; j++) {
      const ndr = 2 * (wr * dr - wi * di), ndi = 2 * (wr * di + wi * dr);
      const nwr = wr * wr - wi * wi + cr;
      wi = 2 * wr * wi + ci;
      wr = nwr;
      dr = ndr;
      di = ndi;
    }
    const fr = wr - zr, fi = wi - zi, res = Math.sqrt(fr * fr + fi * fi);
    const ar = dr - 1, ai = di, dd = ar * ar + ai * ai;
    if (it === NEWTON || res < POL_TOL || !(dd > 1e-300)) {
      SC.zr = zr;
      SC.zi = zi;
      SC.lr = dr;
      SC.li = di;
      SC.res = res;
      return SC;
    }
    zr -= (fr * ar + fi * ai) / dd;
    zi -= (fi * ar - fr * ai) / dd;
  }
  return SC;
}

// The spacing of the cycle's own points, as NAV derives the shader's convergence radius from the chart (nav.js:169).
export function cycleEps2(cr, ci, q, zr, zi) {
  if (q <= 1) return EPS_HI * EPS_HI;
  let wr = zr, wi = zi, md = 1;
  for (let j = 1; j < q; j++) {
    const t = wr * wr - wi * wi + cr;
    wi = 2 * wr * wi + ci;
    wr = t;
    const dr = wr - zr, di = wi - zi, d = Math.sqrt(dr * dr + di * di);
    if (d < md) md = d;
  }
  const ep = clamp(0.4 * md, EPS_LO, EPS_HI);
  return ep * ep;
}

// The attracting cycle of c, chart-free. `nMax` is the caller's iteration budget (N_ITER per frame, N_MAX off-frame).
// out.has is 1 only for a genuine ATTRACTING cycle: a polished residual under HAS_TOL and |lambda| under RHO_HAS, so a
// parabolic c (-0.75, the cusp) and a Misiurewicz point (i, whose critical orbit lands on a repelling 2-cycle) say 0.
export function findCycle(cr, ci, out = mkCyc(), nMax = N_ITER) {
  let zr = 0, zi = 0, n = 0, q = 0;
  while (n < nMax) {
    const blk = Math.min(SUB, nMax - n);
    for (let i = 0; i < blk; i++) {
      const t = zr * zr - zi * zi + cr;
      zi = 2 * zr * zi + ci;
      zr = t;
      if (zr * zr + zi * zi > ESC_R2) {
        out.has = 0;
        out.n = n + i + 1;
        out.q = 0;
        return out;
      }
    }
    n += blk;
    // nearest return: the SMALLEST q inside RET_TOL (a period-3 cycle returns at 3 and at 6 alike), else the argmin
    let br = 1e300, bq = 1, wr = zr, wi = zi;
    q = 0;
    for (let k = 1; k <= P_MAX; k++) {
      const t = wr * wr - wi * wi + cr;
      wi = 2 * wr * wi + ci;
      wr = t;
      const dr = wr - zr, di = wi - zi, d = Math.sqrt(dr * dr + di * di);
      if (d < br) {
        br = d;
        bq = k;
      }
      if (d < RET_TOL) {
        q = k;
        break;
      }
    }
    if (q) break;
    q = bq;
  }
  out.n = n;
  let s = polish(cr, ci, q, zr, zi);
  // Primitive period. Where lambda is near -1 (the cusp side of a component) the critical orbit approaches the period-1
  // point ALTERNATING, so |f(z)-z| ~ |1-lambda|e stays above RET_TOL while |f^2(z)-z| ~ |1-lambda^2|e is already under it
  // and the nearest return names 2. The polished point satisfies f^d(z) = z for the true d, so reduce through the
  // divisors: without this, c = (-0.74, 0.02) reports q 2 and lambda^2, which would halve the shader's Koenigs bands.
  if (q > 1) {
    for (let d = 1; d < q; d++) {
      if (q % d) continue;
      let wr = s.zr, wi = s.zi;
      for (let j = 0; j < d; j++) {
        const t = wr * wr - wi * wi + cr;
        wi = 2 * wr * wi + ci;
        wr = t;
      }
      const er = wr - s.zr, ei = wi - s.zi;
      if (er * er + ei * ei < DIV_TOL * DIV_TOL) {
        q = d;
        s = polish(cr, ci, d, s.zr, s.zi);
        break;
      }
    }
  }
  const rho = Math.sqrt(s.lr * s.lr + s.li * s.li);
  out.q = q;
  out.zr = s.zr;
  out.zi = s.zi;
  out.lr = s.lr;
  out.li = s.li;
  out.res = s.res;
  out.rho = rho;
  out.arg = Math.atan2(s.li, s.lr);
  out.has = (s.res < HAS_TOL && rho < RHO_HAS) ? 1 : 0;
  out.eps2 = out.has ? cycleEps2(cr, ci, q, s.zr, s.zi) : EPS_HI * EPS_HI;
  return out;
}

// The wall's normal and the component's scale, from central differences of the polish (warm-started at the cycle point,
// so each of the four probes is a handful of Newton steps). lambda is holomorphic in c, so dlambda/dc = d lambda/d(Re c).
const GR = { gx: 0, gy: 0, dlr: 0, dli: 0, dl: 0 };
export function rhoGrad(cr, ci, q, zr, zi, out = GR) {
  const h = GRAD_H;
  let s = polish(cr + h, ci, q, zr, zi);
  const r1 = Math.sqrt(s.lr * s.lr + s.li * s.li), a1r = s.lr, a1i = s.li;
  s = polish(cr - h, ci, q, zr, zi);
  const r2 = Math.sqrt(s.lr * s.lr + s.li * s.li), a2r = s.lr, a2i = s.li;
  s = polish(cr, ci + h, q, zr, zi);
  const r3 = Math.sqrt(s.lr * s.lr + s.li * s.li);
  s = polish(cr, ci - h, q, zr, zi);
  const r4 = Math.sqrt(s.lr * s.lr + s.li * s.li);
  out.gx = (r1 - r2) / (2 * h);
  out.gy = (r3 - r4) / (2 * h);
  out.dlr = (a1r - a2r) / (2 * h);
  out.dli = (a1i - a2i) / (2 * h);
  out.dl = Math.sqrt(out.dlr * out.dlr + out.dli * out.dli);
  return out;
}

// Exterior Green's potential in the SAME convention as NAV's inverse-Boettcher table (math/mandel.js buildRayGrid):
// Phi_M(c) = lim (f_c^n(c))^(1/2^n), so with z_1 = c counted as n = 0 the potential is G = log|z_{i+1}| / 2^i and
// log2 G = log2(log|z_{i+1}|) - i. (Subtracting i+1 instead — the naive reading — puts every value exactly 1 too low
// and would halve every drop depth: tools/test_field.js checks it against buildRayGrid for this reason.)
// -Infinity when the orbit never escapes (c is in M).
export function pot(cr, ci) {
  let zr = 0, zi = 0;
  for (let i = 0; i < POT_ITER; i++) {
    const t = zr * zr - zi * zi + cr;
    zi = 2 * zr * zi + ci;
    zr = t;
    const m2 = zr * zr + zi * zi;
    if (m2 > ESC_R2) return Math.log2(0.5 * Math.log(m2)) - i;
  }
  return -Infinity;
}

// Exterior distance estimate |z|log|z|/|z'| (the shader's, NAV's shaders.js line 33). 0 when c does not escape.
export function dist(cr, ci) {
  let zr = 0, zi = 0, dr = 0, di = 0;
  for (let i = 0; i < POT_ITER; i++) {
    const ndr = 2 * (zr * dr - zi * di) + 1, ndi = 2 * (zr * di + zi * dr);
    const t = zr * zr - zi * zi + cr;
    zi = 2 * zr * zi + ci;
    zr = t;
    dr = ndr;
    di = ndi;
    const m2 = zr * zr + zi * zi;
    if (m2 > ESC_R2) return 0.5 * Math.sqrt(m2 / (dr * dr + di * di)) * Math.log(m2);
  }
  return 0;
}

export const escapes = (cr, ci) => pot(cr, ci) > -Infinity;

// grad log2 G by central differences, the step scaled by the distance estimate so it is meaningful at every depth.
const PG = { x: 0, y: 0 };
export function potGrad(cr, ci, out = PG) {
  const h = Math.max(1e-10, 0.02 * dist(cr, ci));
  out.x = (pot(cr + h, ci) - pot(cr - h, ci)) / (2 * h);
  out.y = (pot(cr, ci + h) - pot(cr, ci - h)) / (2 * h);
  return out;
}

// The drop's ruler. rayTo: how far along the unit direction (dx, dy) from c the potential first reaches lgT, by
// doubling then bisection. 0 when the target is not reached inside DROP_TMAX. cleanLine: 64 samples of that segment,
// all of which must be OUTSIDE M once the first one is — a ray that re-enters the set is not a line the eye can follow.
export const RAY_T0 = 0.02;      // first probe distance
export const RAY_TMAX = 6;       // ... and the furthest
export const RAY_BIS = 28;       // bisections onto the target equipotential
export const RAY_N = 64;         // samples of the clean-line check

export function rayTo(x, y, dx, dy, lgT) {
  let t = RAY_T0, lo = 0, hi = 0;
  for (let i = 0; i < 24; i++) {
    if (pot(x + dx * t, y + dy * t) >= lgT) {
      hi = t;
      break;
    }
    lo = t;
    t *= 1.6;
    if (t > RAY_TMAX) return 0;
  }
  if (!hi) return 0;
  for (let i = 0; i < RAY_BIS; i++) {
    const m = (lo + hi) / 2;
    if (pot(x + dx * m, y + dy * m) >= lgT) hi = m;
    else lo = m;
  }
  return hi;
}

// Returns the NUMBER of samples that are back inside M after the segment has once left it: 0 is a clean line, and the
// count ranks the retry directions when none of them is clean (a drop must always happen).
export function cleanLine(x, y, dx, dy, t) {
  let seen = 0, bad = 0;
  for (let i = 1; i <= RAY_N; i++) {
    const s = t * i / RAY_N;
    if (pot(x + dx * s, y + dy * s) > -Infinity) seen = 1;
    else if (seen) bad++;
  }
  return seen ? bad : RAY_N;
}

// The best rational p/q with 1 <= q <= qMax approximating x (x is an internal angle in turns, taken mod 1).
const NR = { p: 0, q: 1, err: 1 };
export function nearestRational(x, qMax, out = NR) {
  const t = x - Math.floor(x);
  out.p = 0;
  out.q = 1;
  out.err = Math.min(t, 1 - t);
  for (let q = 2; q <= qMax; q++) {
    const p = Math.round(t * q);
    if (p <= 0 || p >= q) continue;
    let a = p, b = q;
    while (b) { const r = a % b; a = b; b = r; }
    if (a !== 1) continue;
    const e = Math.abs(t - p / q);
    if (e < out.err) {
      out.err = e;
      out.p = p;
      out.q = q;
    }
  }
  return out;
}

// The multiplier of the main cardioid in closed form: lambda = 1 - sqrt(1 - 4c). The node test's reference.
export function cardLambda(cr, ci, out = [0, 0]) {
  const ur = 1 - 4 * cr, ui = -4 * ci, m = Math.sqrt(ur * ur + ui * ui);
  const sr = Math.sqrt(Math.max(0, (m + ur) / 2)), si = (ui < 0 ? -1 : 1) * Math.sqrt(Math.max(0, (m - ur) / 2));
  out[0] = 1 - sr;
  out[1] = -si;
  return out;
}

export { TAU };
