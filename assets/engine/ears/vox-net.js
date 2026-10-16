// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The live vocal detector's net, run as a STREAM — one output EVERY hop (DECISIONS §123 the first net, §133 this one; the weights:
// ears/vox-weights.js, written by tools/truth/voxtrain.py). Pure: Float32Arrays and loops — no runtime, no WebGL, no DOM — so it runs
// in node, in the page and in the ears Worker, and costs the same.
//
// THE NET (§133, `--net=tcn` in voxtrain.py): a causal temporal convolution over the normalised 40-band log-mel column —
//   layer 0   40 → C, kernel 3 over the hops t−2, t−1, t                          (3 840 multiply-adds at C = 32)
//   blocks     C → C, kernel 3 at dilations 1 2 4 8 (16) (the taps t−2d, t−d, t), ReLU, added to the block's input (residual)
//                                                                                   (5 × 3 072)
//   the heads on the last block's column h_t (C wide, shared): the VOICE logit (C → 1, sigmoid) and the PITCH (C → 61, softmax:
//   60 semitone bins C3..B7 and a 61st "none")                                     (32 + 1 952)
// ≈ 21 k multiply-adds per hop at C = 32 (21 438 parameters; 43 k at the shipped C = 48 — the width is read from the module), a receptive field of 65 hops (693 ms at 48 kHz / 512). Everything is CAUSAL and
// the pre-history is ZERO: the batch model (voxtrain.py) left-pads every layer's input with zeros in time, and this stream keeps a
// 64-slot ring per layer that starts at zero and is never read further back than 32 hops — so the column at hop t here is EXACTLY
// the batch model's column t on the window that ends at t (tools/test_vox.js (ii) proves it against onnxruntime to 1e-4, every
// column, both heads). The §123–§126 net was a 40 × 34 window with one inference per four hops; this one has no hold at all.
import { VOX_W } from './vox-weights.js';

export const N_MEL = 40, RB = 64, RM = RB - 1;
export const PITCH_BINS = 60, PITCH_NONE = PITCH_BINS, PITCH_C3 = 130.8127826502993;   // the head's classes: bins 0..59 = C3..B7, 60 = none
export const hiddenOf = (W = VOX_W) => W.hidden || W.shapes['inp.weight'][0];           // the hidden width C (32 in run 1, 48 from run 3 — voxtrain.py --tcn-c)
export const dilOf = (W = VOX_W) => W.dil || [1, 2, 4, 8, 16];                           // the blocks' dilations (voxtrain.py --tcn-dil); the deepest tap is 2·max ≤ 32 < RB
export const rfOf = (W = VOX_W) => 3 + 2 * dilOf(W).reduce((a, d) => a + d, 0);         // the receptive field (hops): 65 at 1 2 4 8 16, 33 at 1 2 4 8
export const frontOf = (W = VOX_W) => W.front || 0;                                       // §134: the 2-D front layer's channels (0 = none, as run 6)
export const FPOOL = 4, FQ = N_MEL / FPOOL;                                                // its frequency pool and the pooled bands (10)
export const inDimOf = (W = VOX_W) => N_MEL + frontOf(W) * FQ;                            // the TCN's input width: the raw 40 (+ F × 10 pooled features)
export const macPerHop = (W = VOX_W) => { const C = hiddenOf(W), nb = dilOf(W).length, F = frontOf(W); return F * 9 * N_MEL + inDimOf(W) * C * 3 + nb * C * C * 3 + C + C * (PITCH_BINS + 1); };

// Float16 (little-endian, base64) → Float32Array. A hand-rolled decode: Float16Array is not everywhere yet, and this runs once.
export function decodeF16(b64) {
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const n = bin.length >> 1, out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const h = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
    const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff;
    out[i] = e === 0 ? s * m * 2 ** -24 : e === 31 ? (m ? NaN : s * Infinity) : s * (1 + m / 1024) * 2 ** (e - 15);
  }
  return out;
}

// A torch Conv1d weight (O, I, 3) re-laid as [tap][o][i] so the inner loop over the inputs is contiguous (the sums are the same floats
// in the same order per output: tap by tap, input by input — the order the parity test's tolerance covers).
function relay(w, O, I) {
  const out = new Float32Array(3 * O * I);
  for (let o = 0; o < O; o++) for (let i = 0; i < I; i++) for (let j = 0; j < 3; j++) out[(j * O + o) * I + i] = w[(o * I + i) * 3 + j];
  return out;
}

const CACHE = new WeakMap();
// The decoded, re-laid weights of a weights module (memoised per module object: a new Ears on every stream jump must not decode again).
export function weightsOf(W = VOX_W) {
  let w = CACHE.get(W);
  if (w) return w;
  if (W.net !== 'tcn') throw new Error('vox-net: the weights module is a ' + W.net + ' net; this stream runs the §133 TCN');
  const all = decodeF16(W.f16), C = hiddenOf(W), DIL = dilOf(W), F = frontOf(W), IN = inDimOf(W);
  if (2 * Math.max(...DIL) >= RB) throw new Error('vox-net: a dilation of ' + Math.max(...DIL) + ' reads past the ' + RB + '-slot ring');
  if (W.front && W.frontPool !== FPOOL) throw new Error('vox-net: the front layer pools x' + W.frontPool + ', this stream pools x' + FPOOL);
  let o = 0;
  const take = (n) => { const v = all.subarray(o, o + n); o += n; return v; };
  w = { C, DIL, F, IN };
  if (F) { w.wf = take(F * 9); w.bf = take(F); }           // f2d (F, 1, 3, 3): [f][0][df][dt]
  w.w0 = relay(take(C * IN * 3), C, IN); w.b0 = take(C); w.blocks = [];
  for (let k = 0; k < DIL.length; k++) w.blocks.push({ w: relay(take(C * C * 3), C, C), b: take(C) });
  w.wv = take(C); w.bv = take(1);                     // voice (1, 32, 1)
  w.wp = take((PITCH_BINS + 1) * C); w.bp = take(PITCH_BINS + 1);   // pitch (61, 32, 1)
  if (o !== all.length) throw new Error('vox-net: weights length ' + all.length + ' != ' + o);
  CACHE.set(W, w);
  return w;
}

export class VoxNet {
  constructor(W = VOX_W) {
    this.W = weightsOf(W);
    const C = this.C = this.W.C, DIL = this.DIL = this.W.DIL, IN = this.IN = this.W.IN;
    this.h = 0;                                       // the next input column's hop index
    this.mel = new Float32Array(4 * N_MEL);           // the 4 newest MEL columns, by hop & 3 (the front layer's taps read t−2 .. t)
    this.inp = new Float32Array(4 * IN);              // the 4 newest TCN input columns (the mel + the front layer's pooled features), by hop & 3
    this.f2 = this.W.F ? new Float32Array(this.W.F * N_MEL) : null;   // the front layer's unpooled column at this hop
    this.L = []; for (let k = 0; k <= DIL.length; k++) this.L.push(new Float32Array(RB * C));   // layer k's output columns, by hop & 63
    this.hid = this.L[DIL.length];                    // the last block's ring: the shared column the heads read
    this.pitch = new Float32Array(PITCH_BINS + 1);    // the pitch head's softmax at the newest hop
    this.bin = PITCH_NONE; this.pBin = 0; this.pNone = 1;   // its argmax, that class's probability, the "none" probability
    this.z = 0; this.p = -1;                          // the voice logit and its sigmoid (−1 before any hop)
  }
  // One hop: the normalised 40-band column. Returns the voice probability (0..1) — on EVERY hop from the first.
  push(col) {
    const t = this.h++, W = this.W, C = this.C, DIL = this.DIL, IN = this.IN, s0 = (t & RM) * C, F = W.F;
    this.mel.set(col, (t & 3) * N_MEL);
    const xi = (t & 3) * IN; this.inp.set(col, xi);
    if (F) {                                          // §134 (b): the 2-D front layer — conv 3×3 ×F over the mel columns t−2 .. t (causal, zero before hop 0,
      const m = this.mel, f2 = this.f2, wf = W.wf, bf = W.bf;   // frequency padded), ReLU, max-pooled ×4 in frequency → F × 10 features after the 40 raw bands
      const m0 = ((t - 2) & 3) * N_MEL, m1 = ((t - 1) & 3) * N_MEL, m2 = (t & 3) * N_MEL, z0 = t < 2, z1 = t < 1;
      for (let f = 0; f < F; f++) {
        const wo = f * 9, bb = bf[f], oo = f * N_MEL;
        const w00 = wf[wo], w01 = wf[wo + 1], w02 = wf[wo + 2], w10 = wf[wo + 3], w11 = wf[wo + 4], w12 = wf[wo + 5], w20 = wf[wo + 6], w21 = wf[wo + 7], w22 = wf[wo + 8];
        for (let b = 0; b < N_MEL; b++) {
          let s = bb;
          if (b > 0) { if (!z0) s += w00 * m[m0 + b - 1]; if (!z1) s += w01 * m[m1 + b - 1]; s += w02 * m[m2 + b - 1]; }
          if (!z0) s += w10 * m[m0 + b]; if (!z1) s += w11 * m[m1 + b]; s += w12 * m[m2 + b];
          if (b < N_MEL - 1) { if (!z0) s += w20 * m[m0 + b + 1]; if (!z1) s += w21 * m[m1 + b + 1]; s += w22 * m[m2 + b + 1]; }
          f2[oo + b] = s > 0 ? s : 0;
        }
        for (let q = 0; q < FQ; q++) {
          const i = oo + q * FPOOL; let v = f2[i];
          for (let k = 1; k < FPOOL; k++) if (f2[i + k] > v) v = f2[i + k];
          this.inp[xi + N_MEL + f * FQ + q] = v;
        }
      }
    }
    // layer 0: IN → C over the input columns t−2, t−1, t (a column before the first hop is zero: the ring starts at zero and is only written at t)
    {
      const out = this.L[0], w = W.w0, b = W.b0, x0 = this.inp, o0 = ((t - 2) & 3) * IN, o1 = ((t - 1) & 3) * IN, o2 = xi;
      const z0 = t < 2, z1 = t < 1;                   // the taps before the first column read a zero column, not a stale ring slot
      for (let o = 0; o < C; o++) {
        let s = b[o];
        const w0 = o * IN, w1 = (C + o) * IN, w2 = (2 * C + o) * IN;
        if (!z0) for (let i = 0; i < IN; i++) s += w[w0 + i] * x0[o0 + i];
        if (!z1) for (let i = 0; i < IN; i++) s += w[w1 + i] * x0[o1 + i];
        for (let i = 0; i < IN; i++) s += w[w2 + i] * x0[o2 + i];
        out[s0 + o] = s > 0 ? s : 0;
      }
    }
    // the residual blocks: x_k+1[t] = x_k[t] + relu(b + Σ taps W_j · x_k[t − (2 − j)·d]); a tap before hop 0 is a zero column (the ring is zero there)
    for (let k = 0; k < DIL.length; k++) {
      const d = DIL[k], x = this.L[k], out = this.L[k + 1], w = W.blocks[k].w, b = W.blocks[k].b;
      const a0 = ((t - 2 * d) & RM) * C, a1 = ((t - d) & RM) * C, a2 = s0;
      for (let o = 0; o < C; o++) {
        let s = b[o];
        const w0 = o * C, w1 = (C + o) * C, w2 = (2 * C + o) * C;
        for (let i = 0; i < C; i++) s += w[w0 + i] * x[a0 + i] + w[w1 + i] * x[a1 + i] + w[w2 + i] * x[a2 + i];
        out[s0 + o] = x[a2 + o] + (s > 0 ? s : 0);
      }
    }
    // the heads on the shared column
    const h = this.hid, wv = W.wv, wp = W.wp, bp = W.bp, P = this.pitch;
    let z = W.bv[0];
    for (let i = 0; i < C; i++) z += wv[i] * h[s0 + i];
    this.z = z; this.p = 1 / (1 + Math.exp(-z));
    let mx = -Infinity, bin = 0;
    for (let c = 0; c <= PITCH_BINS; c++) {
      let s = bp[c]; const wo = c * C;
      for (let i = 0; i < C; i++) s += wp[wo + i] * h[s0 + i];
      P[c] = s; if (s > mx) { mx = s; bin = c; }
    }
    let sum = 0;
    for (let c = 0; c <= PITCH_BINS; c++) { const e = Math.exp(P[c] - mx); P[c] = e; sum += e; }
    for (let c = 0; c <= PITCH_BINS; c++) P[c] /= sum;
    this.bin = bin; this.pBin = P[bin]; this.pNone = P[PITCH_NONE];
    return this.p;
  }
  // The pitch head's logits at the newest hop, for the parity test (the softmax above overwrote `pitch`; recomputed from the ring).
  logits(out = new Float32Array(PITCH_BINS + 1)) {
    const C = this.C, s0 = ((this.h - 1) & RM) * C, h = this.hid, wp = this.W.wp, bp = this.W.bp;
    for (let c = 0; c <= PITCH_BINS; c++) { let s = bp[c]; const wo = c * C; for (let i = 0; i < C; i++) s += wp[wo + i] * h[s0 + i]; out[c] = s; }
    return out;
  }
}
// The frequency of a pitch bin (0..59) at an offset in cents.
export const binHz = (bin, cents = 0) => PITCH_C3 * Math.pow(2, (bin + cents / 100) / 12);
