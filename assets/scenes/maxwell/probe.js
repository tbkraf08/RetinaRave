// MAXWELL — the readback-based test hooks, kept out of index.js so the scene object stays readable.
//   hooks.energy()  Sum(eps Ez^2 + Hx^2 + Hy^2) over the WHOLE field, from a readback. A test hook may stall the
//                   pipeline; the per-frame path (render.js's H lines) may not, and reads one band of rows instead.
//   hooks.probe()   centre / rim luminance of the display target (tools/lum.py's own windows, measured pre-composite
//                   so the vignette does not flatter it), the twelve charges' hues, and the H loops' closure gap.
//   hooks.mxinfo()  every live number of the scene, so a shot can be read as numbers as well as pixels.
import { COURANT, energyOf, readBand, readType } from './fdtd.js';
import { NAMES } from './medium.js';
import { chains } from './render.js';
import * as SRC from './sources.js';

export function hEnergy(ST) {
  if (!ST.cur) return 0;
  const px = readBand(ST.ctx, ST.cur, 0, ST.gh);
  let eps = null;
  if (!ST.U.lab) { const mp = readBand(ST.ctx, ST.med, 0, ST.gh); eps = (i, j) => mp[4 * (j * ST.gw + i)]; }
  return +energyOf(px, ST.gw, ST.gh, eps).toFixed(6);
}

// The crests of Ez along the +x ray from the centre, in cells, to sub-cell accuracy — the ring radii MEASURED off
// the field itself, one row of readback, so hooks.train()'s spacings are not only the launch bookkeeping.
export function hRow(ST) {
  if (!ST.cur) return [];
  const gw = ST.gw, gh = ST.gh, c = gw >> 1;
  const px = readBand(ST.ctx, ST.cur, gh >> 1, 1);
  let mx = 0;
  for (let i = c; i < gw; i++) mx = Math.max(mx, px[4 * i]);
  const out = [];
  for (let i = c + 2; i < gw - 1; i++) {
    const a = px[4 * (i - 1)], b = px[4 * i], d = px[4 * (i + 1)];
    if (b > a && b >= d && b > 0.02 * mx) {
      const den = a - 2 * b + d;
      out.push(+(i - c + (Math.abs(den) > 1e-12 ? 0.5 * (a - d) / den : 0)).toFixed(2));
    }
  }
  return out;
}

export function hProbe(ST) {
  const U = ST.U;
  const c = chains(ST.seg, U.segs);
  U.loops = c.loops;
  U.gap = c.gap;
  const out = { gap: c.gap, loops: c.loops, open: c.open, segs: U.segs, levels: U.nlev, cap: ST.ctx.budget('segs'), readType: ST.cur ? readType(ST.ctx, ST.cur) : '-', hues: [] };
  for (let k = 0; k < 12; k++) out.hues.push(+ST.hues[k].toFixed(4));
  if (ST.tgt && U.tw > 0) {
    const px = readBand(ST.ctx, ST.tgt, 0, U.th), sw = ST.tgt.w, w = U.tw, h = U.th, half = Math.min(w, h) / 2;
    let cs = 0, cn = 0, rs = 0, rn = 0;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const o = 4 * (j * sw + i), v = 0.3 * px[o] + 0.59 * px[o + 1] + 0.11 * px[o + 2];
        if (Math.abs(i - w / 2) <= 0.1 * w && Math.abs(j - h / 2) <= 0.1 * h) { cs += v; cn++; }
        const r = Math.hypot(i - w / 2, j - h / 2) / half;
        if (r >= 0.6 && r <= 0.9) { rs += v; rn++; }
      }
    }
    out.centre = +(cs / Math.max(1, cn)).toFixed(5);
    out.rim = +(rs / Math.max(1, rn)).toFixed(5);
    out.ratio = +(out.centre / Math.max(1e-9, out.rim)).toFixed(3);
  }
  return JSON.stringify(out);
}

export function hInfo(ST) {
  const U = ST.U;
  return JSON.stringify({ grid: [ST.gw, ST.gh], sub: U.sub, tier: U.tier, S: +(COURANT * U.light).toFixed(4), lam: +SRC.OUT.lam.toFixed(2), sig: +SRC.OUT.sig.toFixed(2), spb: +SRC.OUT.spb.toFixed(2), step: SRC.OUT.step, geo: NAMES[U.geoA] + (U.geoF < 1 ? '<' + NAMES[U.geoB] : ''), fade: +U.geoF.toFixed(3), lens: +U.lens.toFixed(3), shear: +U.shear.toFixed(3), sigma: +U.sigma.toFixed(4), mir: +U.mir.toFixed(4), yaw: +U.yaw.toFixed(4), rate: +U.yawRate.toFixed(4), zoom: +U.zoom.toFixed(4), key: U.key, mode: U.mode, hue: +U.hue.toFixed(4), loud: U.loud, lab: U.lab, float32: !!(ST.cur && ST.cur.float32), segs: U.segs, loops: U.loops, gap: U.gap, src: SRC.info() });
}
