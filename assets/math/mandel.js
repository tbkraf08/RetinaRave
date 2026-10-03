// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Charts on the Mandelbrot set. Pure functions, node-importable, no DOM (the ray-grid worker is
// started explicitly by whoever needs the exterior chart). Lifted from cardioid3 "MATH".
import { TAU, clamp, mix, frac } from './util.js';

// The worker source is built from buildRayGrid.toString(), so it must only reference TAU_ (defined
// here and again inside the worker) and nothing else from this module.
const TAU_ = Math.PI * 2;

// Exterior chart. Inverse Böttcher map sampled on a (theta, log2 G) grid by Newton-tracing every
// external ray inward once. Per frame we only interpolate the table.
export function buildRayGrid(NT, S, octHi, octLo) {
  const NK = (octHi - octLo) * S + 1;
  const out = new Float32Array(NT * NK * 2);
  const L = 7.0;
  for (let i = 0; i < NT; i++) {
    const th = (i + 0.5) / NT;
    const R0 = Math.exp(Math.pow(2, octHi));
    let cr = R0 * Math.cos(TAU_ * th);
    let ci = R0 * Math.sin(TAU_ * th);
    for (let k = 0; k < NK; k++) {
      const G = Math.pow(2, octHi - k / S);
      const n = Math.max(0, Math.ceil(Math.log2(L / G)));
      const p2 = Math.pow(2, n);
      const mag = Math.exp(p2 * G);
      const ang = TAU_ * ((p2 * th) % 1);
      const tr = mag * Math.cos(ang);
      const ti = mag * Math.sin(ang);
      for (let it = 0; it < 24; it++) {
        let zr = cr, zi = ci, dr = 1, di = 0;
        for (let j = 0; j < n; j++) {
          const ndr = 2 * (zr * dr - zi * di) + 1;
          const ndi = 2 * (zr * di + zi * dr);
          const nzr = zr * zr - zi * zi + cr;
          zi = 2 * zr * zi + ci;
          zr = nzr;
          dr = ndr;
          di = ndi;
        }
        const fr = zr - tr, fi = zi - ti;
        const dd = dr * dr + di * di;
        const sr = (fr * dr + fi * di) / dd;
        const si = (fi * dr - fr * di) / dd;
        cr -= sr;
        ci -= si;
        if (sr * sr + si * si < 1e-26 * (1 + cr * cr + ci * ci)) break;
      }
      out[(k * NT + i) * 2] = cr;
      out[(k * NT + i) * 2 + 1] = ci;
    }
  }
  return { grid: out, NT, NK, S, octHi, octLo };
}

export const GRIDP = [2048, 8, 1, -12];
export const LG_MIN = -11.9;
export const LG_MAX = 0.9;

let GRID = null;
export const getGrid = () => GRID;
export const setGrid = (g) => { GRID = g; };

// Build the grid off the main thread; falls back to a synchronous build. Browser only.
let GRIDW = false;   // v0.8: NAV and NAV2 both ask at init — one worker, one table (the second caller's onReady is not honoured; nobody passes one)
export function startGridWorker(onReady) {
  if (GRIDW) return;
  GRIDW = true;
  const src = 'const TAU_=Math.PI*2;' + buildRayGrid.toString() +
    ';onmessage=e=>{const g=buildRayGrid(...e.data);postMessage(g,[g.grid.buffer]);}';
  const fallback = () => setTimeout(() => { GRID = buildRayGrid(...GRIDP); onReady && onReady(GRID); }, 50);
  try {
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    w.onmessage = (e) => { GRID = e.data; w.terminate(); onReady && onReady(GRID); };
    w.onerror = () => fallback();
    w.postMessage(GRIDP);
  } catch (e) {
    fallback();
  }
}

// (external angle, log2 potential) -> c, bilinear in the table.
export function extC(th, lg, out) {
  const g = GRID;
  let k = clamp((g.octHi - lg) * g.S, 0, g.NK - 1.001);
  const k0 = Math.floor(k), fk = k - k0;
  let x = frac(th) * g.NT - 0.5;
  if (x < 0) x += g.NT;
  const xf = Math.floor(x), fx = x - xf;
  const i0 = xf % g.NT, i1 = (i0 + 1) % g.NT;
  const G = g.grid, N = g.NT;
  for (let d = 0; d < 2; d++) {
    const a = mix(G[(k0 * N + i0) * 2 + d], G[(k0 * N + i1) * 2 + d], fx);
    const b = mix(G[((k0 + 1) * N + i0) * 2 + d], G[((k0 + 1) * N + i1) * 2 + d], fx);
    out[d] = mix(a, b, fk);
  }
  return out;
}

// Interior chart. Hyperbolic components attached to the main cardioid, coordinatised by the multiplier.
export function rootOf(p, q) {
  const a = TAU * p / q, mr = Math.cos(a), mi = Math.sin(a);
  return [mr / 2 - (mr * mr - mi * mi) / 4, mi / 2 - (2 * mr * mi) / 4];
}

// The two external angles landing at the root of the p/q bulb.
export function rayAngles(p, q) {
  if (q === 1) return [0, 1];
  let lo = 0, hi = 0;
  for (let j = 1; j <= q; j++) {
    const r = (j * p) % q;
    lo = lo * 2 + ((r === 0 || r > q - p) ? 1 : 0);
    hi = hi * 2 + ((r !== 0 && r >= q - p) ? 1 : 0);
  }
  const den = Math.pow(2, q) - 1;
  return [lo / den, hi / den];
}

export function bulbCenter(p, q) {
  if (q === 1) return [0, 0];
  const a = TAU * p / q, mr = Math.cos(a), mi = Math.sin(a), rt = rootOf(p, q);
  let nr = mr - (mr * mr - mi * mi), ni = mi - 2 * mr * mi;
  const nl = Math.hypot(nr, ni), R = Math.sin(Math.PI * p / q) / (q * q);
  let cr = rt[0] + R * nr / nl, ci = rt[1] + R * ni / nl;
  for (let it = 0; it < 40; it++) {
    let zr = 0, zi = 0, dr = 0, di = 0;
    for (let j = 0; j < q; j++) {
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
    if (sr * sr + si * si < 1e-30) break;
  }
  return [cr, ci];
}

// Newton in (z,c): f_c^q(z)=z and (f_c^q)'(z)=lambda. Continuation from the centre (z=0) keeps the right branch.
export function solveMult(st, q, lr, li) {
  let res = 1;
  for (let it = 0; it < 12; it++) {
    let wr = st.zr, wi = st.zi;
    let ar = 1, ai = 0, br = 0, bi = 0;
    let aar = 0, aai = 0, abr = 0, abi = 0;
    for (let j = 0; j < q; j++) {
      const naar = 2 * (ar * ar - ai * ai + wr * aar - wi * aai);
      const naai = 2 * (2 * ar * ai + wr * aai + wi * aar);
      const nabr = 2 * (ar * br - ai * bi + wr * abr - wi * abi);
      const nabi = 2 * (ar * bi + ai * br + wr * abi + wi * abr);
      const nar = 2 * (wr * ar - wi * ai), nai = 2 * (wr * ai + wi * ar);
      const nbr = 2 * (wr * br - wi * bi) + 1, nbi = 2 * (wr * bi + wi * br);
      const nwr = wr * wr - wi * wi + st.cr;
      wi = 2 * wr * wi + st.ci;
      wr = nwr;
      aar = naar; aai = naai; abr = nabr; abi = nabi;
      ar = nar; ai = nai; br = nbr; bi = nbi;
    }
    const F1r = wr - st.zr, F1i = wi - st.zi, F2r = ar - lr, F2i = ai - li;
    res = Math.hypot(F1r, F1i) + Math.hypot(F2r, F2i);
    if (res < 1e-13) break;
    const j11r = ar - 1, j11i = ai;
    const detr = (j11r * abr - j11i * abi) - (br * aar - bi * aai);
    const deti = (j11r * abi + j11i * abr) - (br * aai + bi * aar);
    const dd = detr * detr + deti * deti;
    if (dd < 1e-300) break;
    const nzr = (F1r * abr - F1i * abi) - (br * F2r - bi * F2i);
    const nzi = (F1r * abi + F1i * abr) - (br * F2i + bi * F2r);
    const ncr = (j11r * F2r - j11i * F2i) - (aar * F1r - aai * F1i);
    const nci = (j11r * F2i + j11i * F2r) - (aar * F1i + aai * F1r);
    st.zr -= (nzr * detr + nzi * deti) / dd;
    st.zi -= (nzi * detr - nzr * deti) / dd;
    st.cr -= (ncr * detr + nci * deti) / dd;
    st.ci -= (nci * detr - ncr * deti) / dd;
  }
  return res;
}

// Interval (semitones above the bass) -> just ratio n/d -> rotation number (n-d)/d. Consonant = small q = big bulb.
export const BULBS = [[0, 1], [1, 15], [1, 8], [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [2, 3], [4, 5], [7, 8]]
  .map(([p, q], i) => {
    const b = { i, p, q, per: q, alpha: p / q, root: q === 1 ? [0.25, 0] : rootOf(p, q), center: bulbCenter(p, q), rays: rayAngles(p, q) };
    b.R = Math.hypot(b.center[0] - b.root[0], b.center[1] - b.root[1]);
    return b;
  });
