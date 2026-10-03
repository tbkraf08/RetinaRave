// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The tonic, on a chroma the sub is PART OF. Synapse's key chroma starts at 65 Hz (anatomy.js:106), so on this track the
// 35 Hz root is invisible and the engine reports the fifth (G# instead of C#). Here the spectrum above CH_LO is binned by
// pitch class and the sub's own YIN pitch class LEANS on it while the note is SETTLED (subConf >= SUB_HELD), at a rate
// times its confidence (§84 — until then every gated frame leaned equally hard: the old `SUB_W x conf` one-bin vector was
// normalised to exactly 1 by blend(), so a 10 %-confidence glide frame of an 808 attack leaned like a settled note; the
// held lean is +9 points RIGHT on SeeYouDrop and WhoLikesToParty, +11 on SeeYouDrop's mode, nothing lost), then
// Krumhansl-Kessler over a long window.
import { FFT, clamp01 } from './dsp.js';

export const CH_N = 8192;         // 5.4 Hz bins at 44.1 kHz — the finest the ring affords
export const CH_EVERY = 32;       // one chroma FFT per this many hops (~0.37 s): the tonic is slow, the cost is amortised
export const CH_LO = 130, CH_HI = 2100;
export const TAU = 11;            // the chroma's time constant (s) — the brief's lean is 20-30 s
export const SUB_WGT = 0.6;       // how much of the chroma's update budget the sub's own class gets (the FFT gets 1)
export const SUB_HELD = 0.8;      // the least subConf at which the sub's class leans on the chroma (§82's own "settled" rule for the shade)
// §84 — tonicConf: "is the TONIC clear, and does the bass agree?". The KS margin over the best r of any OTHER tonic (the
// parallel mode ignored: C#M vs C#m is a coin toss about the MODE, not the tonic) rescaled at TM1, times the share of the
// settled sub note's exponential histogram (tau TAU_H, counted while gated and conf >= H_CONF) on the tonic's bin. Measured
// on the five tracks (docs/plans/KEY-PLAN.md §3): 38 of 46 right sections open at 0.3, 16 of 17 wrong closed at 0.1 —
// CyborgNinja's G major is a clear, stable, WRONG read of a chroma with no tonic in it, and only the bass can say so.
export const TM1 = 0.08;          // the KS tonic margin (r units) at which the margin term reads 1
export const TAU_H = 12;          // s: the bass histogram's time constant (~ the chroma's own TAU) — it holds through a silent sub
export const H_CONF = 0.5;        // the least subConf a sub note is counted into the histogram at
// §84: who owns `keyConf` — the ears' tonicConf whenever the ears have a tonic (the key the scenes anchor on IS the tonic
// since §62, so its gate is the tonic's confidence). `&kc=0` (core/harness.js) hands it back to synapse's keyClar and the
// shade's keyW back to §82's "1 when the ears have a tonic": the A/B of the old look, the `&shade=` pattern.
export const KEYOWN = { ears: true };
export const KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
export const KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export class TonicTrack {
  constructor(sr, o = {}) {
    this.sr = sr; this.fft = new FFT(CH_N); this.mag = new Float32Array(CH_N >> 1);
    this.tau = o.tau === undefined ? TAU : o.tau;
    this.binPc = new Int8Array(CH_N >> 1);
    const df = sr / CH_N;
    for (let i = 0; i < (CH_N >> 1); i++) {
      const f = i * df;
      this.binPc[i] = (f >= CH_LO && f < CH_HI) ? ((Math.round(69 + 12 * Math.log2(f / 440)) % 12) + 12) % 12 : -1;
    }
    this.ch = new Float32Array(12); this.acc = new Float32Array(12); this.H = new Float32Array(12); this.r = new Float64Array(24);
    this.k = 0; this.tFft = 0; this.tLean = 0; this.warm = 0;
    this.out = { pc: -1, minor: 0, conf: 0 };
    this.pcOut = -1; this.minor = 0; this.conf = 0;
  }
  hop(t, ring, w, mask, sub) {
    this.subLean(t, sub);                      // every hop: the root the FFT cannot resolve
    if (++this.k < CH_EVERY) return;
    this.k = 0;
    if (w < CH_N) { this.tFft = t; return; }
    this.fft.mags(ring, (w - CH_N) & mask, mask, this.mag);
    const acc = this.acc; acc.fill(0);
    const m = this.mag, p = this.binPc;
    for (let i = 0; i < m.length; i++) { const c = p[i]; if (c >= 0) acc[c] += m[i] * m[i]; }
    // EACH source keeps its own dt. Sharing one `tPrev` made the FFT's dt the 11.6 ms hop instead of its own 372 ms and
    // stretched the chroma's effective time constant to ~75 s; the tonic then needed 32 s to settle instead of 11.
    this.blend(acc, Math.max(0, t - this.tFft), 1);
    this.tFft = t;
    this.solve();
  }
  subLean(t, sub) {
    const dt = Math.max(0, t - this.tLean); this.tLean = t;
    const H = this.H, hd = Math.exp(-dt / TAU_H);
    for (let i = 0; i < 12; i++) H[i] *= hd;                  // the whole histogram decays together: its SHAPE holds while the sub is silent
    if (!sub || !sub.gate || sub.note < 0 || !(sub.conf >= H_CONF)) return;
    H[sub.note] += sub.conf;
    if (!(sub.conf >= SUB_HELD)) return;                      // a glide frame names no root
    const acc = this.acc; acc.fill(0);
    acc[sub.note] = 1;
    this.blend(acc, dt, SUB_WGT * Math.min(1, sub.conf));
  }
  blend(acc, dt, wgt) {
    let s = 0; for (let i = 0; i < 12; i++) s += acc[i];
    if (!(s > 0)) return;
    const a = Math.min(1, (1 - Math.exp(-dt / this.tau)) * wgt);
    for (let i = 0; i < 12; i++) this.ch[i] += (acc[i] / s - this.ch[i]) * a;
    this.warm += dt;
  }
  solve() {
    const c = this.ch; let mean = 0;
    for (let i = 0; i < 12; i++) mean += c[i];
    mean /= 12;
    let cn = 0; for (let i = 0; i < 12; i++) cn += (c[i] - mean) * (c[i] - mean);
    cn = Math.sqrt(cn);
    if (!(cn > 0)) return;
    let best = -2, bi = 0;
    const r = this.r;
    for (let mi = 0; mi < 2; mi++) {
      const pr = mi ? KK_MIN : KK_MAJ;
      let pm = 0; for (let i = 0; i < 12; i++) pm += pr[i];
      pm /= 12;
      let pn = 0; for (let i = 0; i < 12; i++) pn += (pr[i] - pm) * (pr[i] - pm);
      pn = Math.sqrt(pn);
      for (let k = 0; k < 12; k++) {
        let d = 0;
        for (let i = 0; i < 12; i++) d += (c[i] - mean) * (pr[(i - k + 12) % 12] - pm);
        r[mi * 12 + k] = d / (cn * pn);
        if (r[mi * 12 + k] > best) { best = r[mi * 12 + k]; bi = mi * 12 + k; }
      }
    }
    const pc = bi % 12;
    this.pcOut = pc; this.minor = bi >= 12 ? 1 : 0;
    // §84: the margin over the best OTHER tonic, times the bass's agreement (0 until a bass has ever been heard)
    let other = -2; for (let k = 0; k < 24; k++) if (k % 12 !== pc && r[k] > other) other = r[k];
    const H = this.H; let hs = 0; for (let i = 0; i < 12; i++) hs += H[i];
    this.conf = hs < 1e-6 ? 0 : clamp01((best - other) / TM1) * (H[pc] / hs);
  }
  get pc() { return this.pcOut; }
}
