// Register, purity, the low-pass, the stereo width. All four read the filter bank PercTrack already runs, so nothing is
// filtered twice; only the side/mid sums need the raw L and R.
import { Quantile, clamp01, logmap } from './dsp.js';
import { B_SUB, B_LOWBASS, B_HARM, B_SNARE, B_HAT } from './perc.js';

export const REG_LO = 35, REG_HI = 140;   // bassReg: 0 at a 35 Hz sub, 1 at a 140 Hz mid-bass and above
export const PURE_LO = 0.05, PURE_HI = 1.0;  // subPure: 1 at h/f 0.05 (a sine), 0 at h/f 1 (a harmonic bass) — the truth's `hf`
export const ROLL_TAU = 0.25;             // the high/mid roll-off smoothing (s)
export const WID_TAU = 0.35;
export const CTR = [39.2, 102.5, 300.0];  // the geometric band centres of BANDS[B_SUB], [B_LOWBASS], [B_HARM]

export class TextureTrack {
  constructor(sr) {
    this.sr = sr; this.sAcc = 0; this.mAcc = 0; this.n = 0;
    this.rollP90 = new Quantile(0.9, 4e-4);   // the track's p90, not the last second's: ~30 s at the 86 Hz hop
    this.roll = 0; this.lpSweep = 0; this.width = 0; this.bassReg = 0; this.subPure = 0;
    this.tPrev = 0;
  }
  step(l, r, m) { const s = 0.5 * (l - r); this.sAcc += s * s; this.mAcc += m * m; this.n++; }
  hop(t, perc) {
    const dt = Math.max(1e-4, t - this.tPrev); this.tPrev = t;
    const e = perc.e;
    // register: the log-frequency centroid of the three low bands, mapped between a 35 Hz sub and a 140 Hz mid-bass
    const w0 = e[B_SUB], w1 = e[B_LOWBASS], w2 = e[B_HARM], ws = w0 + w1 + w2 + 1e-14;
    const lf = (w0 * Math.log(CTR[0]) + w1 * Math.log(CTR[1]) + w2 * Math.log(CTR[2])) / ws;
    this.bassReg = clamp01((lf - Math.log(REG_LO)) / Math.log(REG_HI / REG_LO));
    // purity: harmonics over fundamental, the truth tool's h/f. 1 = a sine sub, 0 = a harmonic-rich bass.
    const hf = w2 / (w0 + w1 + 1e-14);
    this.subPure = 1 - logmap(hf, PURE_LO, PURE_HI);
    // the low-pass: how far the highs have rolled off against their own running p90
    const roll = e[B_HAT] / (e[B_SNARE] + 1e-14);
    const a = 1 - Math.exp(-dt / ROLL_TAU);
    this.roll += (roll - this.roll) * a;
    const p = this.rollP90.push(this.roll);
    this.lpSweep = clamp01(1 - this.roll / (p + 1e-12));
    // width: side over mid
    const wd = Math.sqrt(this.sAcc / Math.max(1, this.n)) / (Math.sqrt(this.mAcc / Math.max(1, this.n)) + 1e-9);
    this.sAcc = 0; this.mAcc = 0; this.n = 0;
    this.width += (clamp01(wd) - this.width) * (1 - Math.exp(-dt / WID_TAU));
  }
}
