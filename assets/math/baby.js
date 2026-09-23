// Baby Mandelbrot copies (tuning). Pure, node-importable. Lifted from cardioid3 "MATH".
// A period-P copy with centre c0 is charted exactly as M is, by multipliers: its cardioid is the period-P
// component (lambda in the disc), its p/q bulb the period-P*q satellite whose root is the point where the
// period-P multiplier is e^{2 pi i p/q}. Affine maps are used only as Newton seeds. A=(f^{P-1})'(c0):
// f^P(z)=f^P(0)+A z^2+.., so w=A z conjugates f^P to w^2+c_t near 0 — the little Julia set sits at
// z-scale 1/|A|, rotated by -arg A.
import { TAU } from './util.js';
import { BULBS, solveMult } from './mandel.js';

// Period-P cycle of baby B continued to multiplier lambda (the disc is convex: straight paths are legal).
export function cardChart(B, lr, li) {
  let st = B.st;
  if (!st) {
    st = B.st = { zr: 0, zi: 0, cr: B.c0[0], ci: B.c0[1] };
    B.lam = [0, 0];
  }
  const dr = lr - B.lam[0], di = li - B.lam[1];
  const steps = Math.max(1, Math.ceil(Math.hypot(dr, di) / 0.1));
  for (let k = 1; k <= steps; k++) {
    const res = solveMult(st, B.P, B.lam[0] + dr * k / steps, B.lam[1] + di * k / steps);
    if (!(res < 1e-7) || Math.hypot(st.cr - B.c0[0], st.ci - B.c0[1]) > 4 * B.size) {
      B.st = null;
      return null;
    }
  }
  B.lam = [lr, li];
  return st;
}

// f_c^n(0)=0 by Newton from (cr,ci).
export function centreNewton(cr, ci, n) {
  for (let it = 0; it < 60; it++) {
    let zr = 0, zi = 0, dr = 0, di = 0;
    for (let j = 0; j < n; j++) {
      const ndr = 2 * (zr * dr - zi * di) + 1;
      const ndi = 2 * (zr * di + zi * dr);
      const nzr = zr * zr - zi * zi + cr;
      zi = 2 * zr * zi + ci;
      zr = nzr;
      dr = ndr;
      di = ndi;
    }
    const dd = dr * dr + di * di;
    const sr = (zr * dr + zi * di) / dd, si = (zi * dr - zr * di) / dd;
    cr -= sr;
    ci -= si;
    if (sr * sr + si * si < 1e-34) break;
  }
  return [cr, ci];
}

// (preperiod k, period p) of a Misiurewicz point by direct iteration.
export function misiType(m) {
  const o = [];
  let zr = m[0], zi = m[1];
  for (let n = 0; n < 16; n++) {
    o.push([zr, zi]);
    const t = zr * zr - zi * zi + m[0];
    zi = 2 * zr * zi + m[1];
    zr = t;
  }
  for (let k = 1; k < 9; k++) {
    for (let p = 1; p < 7; p++) {
      if (Math.hypot(o[k + p - 1][0] - o[k - 1][0], o[k + p - 1][1] - o[k - 1][1]) < 1e-5) return [k, p];
    }
  }
  return [2, 1];
}

// Misiurewicz points (verified preperiodic by Newton on f^{k+p}(c)=f^k(c)); conjugates added.
export const MISI = [
  [-0.101096363846, 0.956286510809], [-1.543689012692, 0], [0, 1], [-2, 0], [0.366362983423, 0.591533773261],
  [0.437924241359, 0.341892084338], [-1.296355138173, 0.441851605735], [-0.228155493654, 1.115142508040],
];
for (const m of MISI.slice()) if (m[1] !== 0) MISI.push([m[0], -m[1]]);

export function buildBaby(P, sr, si) {
  const c0 = centreNewton(sr, si, P);
  const B = { P, c0, size: 1, st: null, lam: [0, 0], bulbs: [], ok: true };
  let ar = 1, ai = 0, zr = c0[0], zi = c0[1];
  for (let j = 1; j < P; j++) {
    const t = 2 * (ar * zr - ai * zi);
    ai = 2 * (ar * zi + ai * zr);
    ar = t;
    const n = zr * zr - zi * zi + c0[0];
    zi = 2 * zr * zi + c0[1];
    zr = n;
  }
  B.A = Math.hypot(ar, ai);
  B.argA = Math.atan2(ai, ar);
  B.size = 4 / (B.A * B.A); // a-priori size ~1/A^2 up to a bounded factor; refined from the cusp below
  let st = cardChart(B, 1, 0);
  if (!st) {
    B.ok = false;
    return B;
  }
  B.cusp = [st.cr, st.ci];
  B.size = Math.hypot(st.cr - c0[0], st.ci - c0[1]) * 4; // |sigma|
  B.sigma = [(st.cr - c0[0]) * 4, (st.ci - c0[1]) * 4];
  for (const b of BULBS) {
    if (b.q === 1) {
      B.bulbs.push({ i: b.i, p: 0, q: 1, per: P, alpha: 0, root: B.cusp, center: c0, rays: b.rays, R: B.size / 4, ok: true });
      continue;
    }
    const a = TAU * b.alpha, lr = Math.cos(a), li = Math.sin(a), e = 1e-3;
    const nb = { i: b.i, p: b.p, q: b.q, per: P * b.q, alpha: b.alpha, rays: b.rays, ok: false };
    B.bulbs.push(nb);
    st = cardChart(B, lr * (1 - e), li * (1 - e));
    if (!st) continue;
    const c1 = [st.cr, st.ci];
    st = cardChart(B, lr, li);
    if (!st) continue;
    nb.root = [st.cr, st.ci];
    // local scale of the copy at this root: (dc_baby/dlambda)/(dc_M/dlambda), dc_M/dlambda=(1-lambda)/2
    const gr = (nb.root[0] - c1[0]) / e, gi = (nb.root[1] - c1[1]) / e;
    const dbr = gr * lr + gi * li, dbi = gi * lr - gr * li;
    const mr = (1 - lr) / 2, mi = -li / 2, md = mr * mr + mi * mi;
    const sr2 = (dbr * mr + dbi * mi) / md, si2 = (dbi * mr - dbr * mi) / md;
    const vr = b.center[0] - b.root[0], vi = b.center[1] - b.root[1];
    const seed = [nb.root[0] + sr2 * vr - si2 * vi, nb.root[1] + sr2 * vi + si2 * vr];
    const Rs = Math.hypot(sr2, si2) * b.R;
    nb.center = centreNewton(seed[0], seed[1], nb.per);
    nb.R = Math.hypot(nb.center[0] - nb.root[0], nb.center[1] - nb.root[1]);
    nb.seedErr = Math.hypot(nb.center[0] - seed[0], nb.center[1] - seed[1]) / Rs;
    if (!(nb.seedErr < 0.35)) continue;
    // the satellite's own multiplier chart must run from its centre back to the same root
    const s2 = { zr: 0, zi: 0, cr: nb.center[0], ci: nb.center[1] };
    let good = true;
    for (let k = 1; k <= 10 && good; k++) good = solveMult(s2, nb.per, 0.0985 * k, 0) < 1e-7;
    nb.rootErr = Math.hypot(s2.cr - nb.root[0], s2.ci - nb.root[1]) / nb.R;
    nb.ok = good && nb.rootErr < 0.06;
    // keep float32 c-quantisation inside the component
    nb.rhoMax = Math.min(0.985, 1 - Math.max(0.015, 4 * 1.2e-7 * Math.max(1, Math.hypot(c0[0], c0[1])) / nb.R));
  }
  // Tuned Misiurewicz points for the beat kicks: m of type (k,p) -> root of f^{P(k+p)}(0)=f^{Pk}(0). Seed: affine
  // image of m, improved by solving the first-order renormalisation c_t(c)=A(c) f_c^P(0)=m (secant Newton), then
  // exact Newton on the preperiodicity equation.
  const ct = (cr, ci) => {
    let zr = 0, zi = 0, ar = 1, ai = 0;
    for (let j = 0; j < P; j++) {
      if (j) {
        const t = 2 * (ar * zr - ai * zi);
        ai = 2 * (ar * zi + ai * zr);
        ar = t;
      }
      const n = zr * zr - zi * zi + cr;
      zi = 2 * zr * zi + ci;
      zr = n;
    }
    return [ar * zr - ai * zi, ar * zi + ai * zr];
  };
  B.misi = [];
  for (const m of MISI) {
    const [k, pp] = misiType(m), a = P * (k + pp), b = P * k;
    let cr = c0[0] + B.sigma[0] * m[0] - B.sigma[1] * m[1];
    let ci = c0[1] + B.sigma[0] * m[1] + B.sigma[1] * m[0];
    let ok = false;
    for (let it = 0; it < 30; it++) {
      const g = ct(cr, ci), h = 1e-7 * B.size, g2 = ct(cr + h, ci);
      const gr = g[0] - m[0], gi = g[1] - m[1], hr = (g2[0] - g[0]) / h, hi = (g2[1] - g[1]) / h;
      const dd = hr * hr + hi * hi;
      const sr = (gr * hr + gi * hi) / dd, si = (gi * hr - gr * hi) / dd;
      cr -= sr;
      ci -= si;
      if (sr * sr + si * si < 1e-30) break;
    }
    const sd = [cr, ci];
    for (let it = 0; it < 50; it++) {
      let zr = 0, zi = 0, dr = 0, di = 0, br = 0, bi = 0, er = 0, ei = 0;
      for (let j = 1; j <= a; j++) {
        const ndr = 2 * (zr * dr - zi * di) + 1;
        const ndi = 2 * (zr * di + zi * dr);
        const nzr = zr * zr - zi * zi + cr;
        zi = 2 * zr * zi + ci;
        zr = nzr;
        dr = ndr;
        di = ndi;
        if (j === b) { br = zr; bi = zi; er = dr; ei = di; }
      }
      const gr = zr - br, gi = zi - bi, hr = dr - er, hi = di - ei, dd = hr * hr + hi * hi;
      const sr = (gr * hr + gi * hi) / dd, si = (gi * hr - gr * hi) / dd;
      cr -= sr;
      ci -= si;
      if (sr * sr + si * si < 1e-30) { ok = true; break; }
    }
    const off = Math.hypot(cr - sd[0], ci - sd[1]) / B.size;
    B.misi.push(ok && off < 0.2 ? [cr, ci, off] : null); // index-aligned with MISI
  }
  B.st = null;
  return B;
}

export const BABIES = [[3, -1.7548776662, 0], [4, -0.1565201668, 1.0322471089], [5, -1.6254137251, 0]]
  .map((s) => buildBaby(...s)).filter((B) => B.ok);
