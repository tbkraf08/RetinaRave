// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// MAXWELL — the readback-based test hooks, kept out of index.js so the scene object stays readable.
//   hooks.energy()  Sum(eps Ez^2 + Hx^2 + Hy^2) over the WHOLE field, from a readback. A test hook may stall the
//                   pipeline; the per-frame path (render.js's H lines) may not, and reads one band of rows instead.
//   hooks.probe()   centre / rim luminance of the display target (tools/lum.py's own windows, measured pre-composite
//                   so the vignette does not flatter it), the twelve charges' hues, and the H loops' closure gap.
//   hooks.mxinfo()  every live number of the scene, so a shot can be read as numbers as well as pixels.
import { COURANT, energyOf, readBand, readType } from './fdtd.js';
import { NAMES } from './medium.js';
import { chains } from './render.js';
import { colourSize, colourTex } from './colour.js';
import { detInfo } from './onsets.js';
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
  const out = { gap: c.gap, loops: c.loops, open: c.open, segs: U.segs, drawn: U.drawn, levels: U.nlev, arange: U.arange, alev: U.alev, cap: ST.ctx.budget('segs'), readType: ST.cur ? readType(ST.ctx, ST.cur) : '-', hues: [] };
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
  return JSON.stringify({ grid: [ST.gw, ST.gh], cgrid: [U.cw, U.ch], sub: U.sub, tier: U.tier, S: +(COURANT * U.light).toFixed(4), sig: +SRC.OUT.sig.toFixed(2), spb: +SRC.OUT.spb.toFixed(2), step: SRC.OUT.step, geo: NAMES[U.geoA] + (U.geoF < 1 ? '<' + NAMES[U.geoB] : ''), fade: +U.geoF.toFixed(3), lens: +U.lens.toFixed(3), shear: +U.shear.toFixed(3), wob: +U.wob.toFixed(4), subS: +U.subS.toFixed(4), lfo: +U.lfo.toFixed(4), cent: +U.cent.toFixed(3), dirty: +U.dirty.toFixed(3), punchy: +U.punchy.toFixed(3), sigma: +U.sigma.toFixed(4), mir: +U.mir.toFixed(4), vac: U.vac, pol: U.pol, yaw: +U.yaw.toFixed(4), rate: +U.yawRate.toFixed(4), zoom: +U.zoom.toFixed(4), key: U.key, mode: U.mode, hue: +U.hue.toFixed(4), loud: U.loud, lab: U.lab, float32: !!(ST.cur && ST.cur.float32), segs: U.segs, loops: U.loops, gap: U.gap, src: SRC.info(), det: detInfo() });
}

// hooks.mxcol() — the colour field read as numbers (v0.11 item 2). A screenshot cannot answer "does the wave carry
// the note's hue": the camera yaws, the glows and the medium hint are added on top, and the JPEG moves the chroma.
// This reads the colour target itself and reports, per probe point, the palette hue of rgb/w, its saturation and w.
// The palette is 0.5 + 0.5 cos(TAU (h + [0, .33, .67])), which is not HSV, so the hue is recovered by a fit: the h
// on a 1/720 grid whose colour is nearest the measured chromaticity. The points are the twelve charges' own feet,
// the midpoints of consecutive pairs, and the centre.
const COFF = [0, 0.33, 0.67];
export function hueFit(r, g, b) {
  const m = Math.max(r, g, b);
  if (!(m > 0)) return { h: 0, sat: 0 };
  const c = [r / m, g / m, b / m];
  let best = 0, bd = 1e9;
  for (let i = 0; i < 720; i++) {
    const h = i / 720;
    let d = 0;
    for (let k = 0; k < 3; k++) { const v = 0.5 + 0.5 * Math.cos(2 * Math.PI * (h + COFF[k])); d += (v - c[k]) * (v - c[k]); }
    if (d < bd) { bd = d; best = h; }
  }
  return { h: best, sat: (m - Math.min(r, g, b)) / m };
}

export function hMxcol(ST) {
  const t = colourTex();
  if (!t || !ST.cur) return '{}';
  const cs = colourSize(), cw = cs[0], chh = cs[1];
  const px = readBand(ST.ctx, t, 0, chh);
  const sc = cw / ST.gw;
  const at = (x, y) => {
    const i = Math.max(0, Math.min(cw - 1, Math.round(x * sc))), j = Math.max(0, Math.min(chh - 1, Math.round(y * sc)));
    const o = 4 * (j * cw + i), w = px[o + 3];
    const f = hueFit(px[o], px[o + 1], px[o + 2]);
    return { h: +f.h.toFixed(4), sat: +f.sat.toFixed(3), w: +w.toFixed(5) };
  };
  const feet = [], mid = [];
  for (let k = 0; k < 12; k++) {
    feet.push(at(SRC.CX[k], SRC.CY[k]));
    mid.push(at(0.5 * (SRC.CX[k] + SRC.CX[(k + 1) % 12]), 0.5 * (SRC.CY[k] + SRC.CY[(k + 1) % 12])));
  }
  const hues = [];
  for (let k = 0; k < 12; k++) hues.push(+ST.hues[k].toFixed(4));
  // ... and the +x ray the Ez crests are measured along (hRow), in FIELD cells, so the two can be compared directly:
  // does the colour arrive WITH the wave, or behind it.
  const ray = [];
  for (let r = 0; r < ST.gw / 2; r += 2) { const q = at(ST.gw / 2 + r, ST.gh / 2); ray.push([r, q.w, q.h]); }
  return JSON.stringify({ grid: [cw, chh], hues, feet, mid, centre: at(ST.gw / 2, ST.gh / 2), ray });
}
