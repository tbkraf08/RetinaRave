// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The live vocal detector's net, run as a STREAM (DECISIONS §123; the weights: ears/vox-weights.js, written by tools/truth/voxtrain.py).
// Pure: Float32Arrays and loops — no runtime, no WebGL, no DOM — so it runs in node, in the page and in a Worker, and costs the same.
//
// The batch model (voxtrain.py) is 40 mel bands × 34 hops → conv 3×3 ×16 (padded in frequency, VALID in time) → ReLU → max-pool 2 →
// conv 3×3 ×16 (the same) → ReLU → max-pool 2 → dense 32 → ReLU → dense 1 → sigmoid. Because the convolutions are valid in time, every
// column of every layer depends on a fixed neighbourhood of the columns before it, so the same arithmetic runs one column at a time as the
// hops arrive — one conv1 column per hop (~6 k multiply-adds), one conv2 column per two hops (~46 k), the dense every four (~36 k): ≈ 38 k
// multiply-adds per hop, 20–40 µs in plain JavaScript, where a batch inference of the whole window every four hops would be ~1 M per run.
// The output at hop N is EXACTLY the batch model on the window [N − 33, N] (tools/test_vox.js proves it against onnxruntime to 1e-4),
// and it fires at hops N ≡ 1 (mod 4) counted from the first column — the first at hop 33, the 34th column. Where the stream is:
//   hop h          the input column h (40 normalised log-mel values); conv1 centred at c = h − 1 needs h − 2 .. h, so it is computed now
//   c even ≥ 2     pool1 pairs (c − 1, c) → the pooled column p = (c − 2) / 2  (16 ch × 20)
//   p ≥ 2          conv2 centred at m = p − 1 needs p − 2 .. p
//   m even ≥ 2     pool2 pairs (m − 1, m) → q = (m − 2) / 2  (16 × 10)
//   q ≥ 6          the dense over q − 6 .. q, flattened in torch's (channel, frequency, time) order, then the sigmoid
import { VOX_W } from './vox-weights.js';

export const N_MEL = 40, T_WIN = 34, C1 = 16, C2 = 16, F1 = 20, F2 = 10, TQ = 7, H1 = 32;

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

const CACHE = new WeakMap();
// The decoded, sliced weights of a weights module (memoised per module object: a new Ears on every stream jump must not decode 44 k floats again).
export function weightsOf(W = VOX_W) {
  let w = CACHE.get(W);
  if (w) return w;
  const all = decodeF16(W.f16);
  let o = 0;
  const take = (n) => { const v = all.subarray(o, o + n); o += n; return v; };
  w = {
    w1: take(C1 * 1 * 9), b1: take(C1),              // conv1 (16, 1, 3, 3): [ch][0][df][dt]
    w2: take(C2 * C1 * 9), b2: take(C2),             // conv2 (16, 16, 3, 3): [o][i][df][dt]
    w3: take(H1 * C2 * F2 * TQ), b3: take(H1),       // fc1 (32, 1120): [j][c·70 + f·7 + t]
    w4: take(1 * H1), b4: take(1),                   // fc2 (1, 32)
  };
  if (o !== all.length) throw new Error('vox-net: weights length ' + all.length + ' != ' + o);
  CACHE.set(W, w);
  return w;
}

export class VoxNet {
  constructor(W = VOX_W) {
    this.W = weightsOf(W);
    this.h = 0;                                       // the next input column's hop index
    this.inp = [0, 1, 2].map(() => new Float32Array(N_MEL));          // the 3 newest input columns, by hop % 3
    this.c1 = [0, 1].map(() => new Float32Array(C1 * N_MEL));        // conv1 columns by centre % 2
    this.p1 = [0, 1, 2].map(() => new Float32Array(C1 * F1));        // pooled columns by p % 3
    this.c2 = [0, 1].map(() => new Float32Array(C2 * F1));           // conv2 columns by centre % 2
    this.q = []; for (let i = 0; i < TQ; i++) this.q.push(new Float32Array(C2 * F2));   // the pool2 columns by q % 7
    this.hid = new Float32Array(H1);
    this.p = -1;                                      // the last output (0..1), -1 before any
  }
  // One hop: the normalised 40-band column. Returns the sigmoid output when the dense fired on this hop, else -1.
  push(col) {
    const h = this.h++;
    this.inp[h % 3].set(col);
    if (h < 2) return -1;
    const c = h - 1;
    this.conv1(c);
    if (c & 1 || c < 2) return -1;
    const p = (c - 2) >> 1;
    this.pool1(c, p);
    if (p < 2) return -1;
    const m = p - 1;
    this.conv2(m);
    if (m & 1 || m < 2) return -1;
    const q = (m - 2) >> 1;
    this.pool2(m, q);
    if (q < 6) return -1;
    return (this.p = this.dense(q));
  }
  conv1(c) {                                          // centred at hop c: the columns c-1, c, c+1
    const W = this.W, w = W.w1, b = W.b1, out = this.c1[c & 1];
    const x0 = this.inp[(c - 1) % 3], x1 = this.inp[c % 3], x2 = this.inp[(c + 1) % 3];
    for (let ch = 0; ch < C1; ch++) {
      const wo = ch * 9, bb = b[ch], oo = ch * N_MEL;
      const w00 = w[wo], w01 = w[wo + 1], w02 = w[wo + 2], w10 = w[wo + 3], w11 = w[wo + 4], w12 = w[wo + 5], w20 = w[wo + 6], w21 = w[wo + 7], w22 = w[wo + 8];
      for (let f = 0; f < N_MEL; f++) {
        let s = bb;
        if (f > 0) s += w00 * x0[f - 1] + w01 * x1[f - 1] + w02 * x2[f - 1];
        s += w10 * x0[f] + w11 * x1[f] + w12 * x2[f];
        if (f < N_MEL - 1) s += w20 * x0[f + 1] + w21 * x1[f + 1] + w22 * x2[f + 1];
        out[oo + f] = s > 0 ? s : 0;
      }
    }
  }
  pool1(c, p) {                                       // the pair (c-1, c) → p: 2×2 max
    const a = this.c1[(c - 1) & 1], b = this.c1[c & 1], out = this.p1[p % 3];
    for (let ch = 0; ch < C1; ch++) {
      const io = ch * N_MEL, oo = ch * F1;
      for (let f = 0; f < F1; f++) {
        const i = io + 2 * f;
        let m = a[i]; if (a[i + 1] > m) m = a[i + 1]; if (b[i] > m) m = b[i]; if (b[i + 1] > m) m = b[i + 1];
        out[oo + f] = m;
      }
    }
  }
  conv2(m) {                                          // centred at pooled m: the pooled columns m-1, m, m+1
    const W = this.W, w = W.w2, b = W.b2, out = this.c2[m & 1];
    const x0 = this.p1[(m - 1) % 3], x1 = this.p1[m % 3], x2 = this.p1[(m + 1) % 3];
    for (let o = 0; o < C2; o++) {
      const oo = o * F1, bb = b[o];
      for (let f = 0; f < F1; f++) out[oo + f] = bb;
      for (let i = 0; i < C1; i++) {
        const wo = (o * C1 + i) * 9, io = i * F1;
        const w00 = w[wo], w01 = w[wo + 1], w02 = w[wo + 2], w10 = w[wo + 3], w11 = w[wo + 4], w12 = w[wo + 5], w20 = w[wo + 6], w21 = w[wo + 7], w22 = w[wo + 8];
        for (let f = 0; f < F1; f++) {
          let s = w10 * x0[io + f] + w11 * x1[io + f] + w12 * x2[io + f];
          if (f > 0) s += w00 * x0[io + f - 1] + w01 * x1[io + f - 1] + w02 * x2[io + f - 1];
          if (f < F1 - 1) s += w20 * x0[io + f + 1] + w21 * x1[io + f + 1] + w22 * x2[io + f + 1];
          out[oo + f] += s;
        }
      }
      for (let f = 0; f < F1; f++) if (out[oo + f] < 0) out[oo + f] = 0;
    }
  }
  pool2(m, q) {                                       // the pair (m-1, m) → q
    const a = this.c2[(m - 1) & 1], b = this.c2[m & 1], out = this.q[q % TQ];
    for (let ch = 0; ch < C2; ch++) {
      const io = ch * F1, oo = ch * F2;
      for (let f = 0; f < F2; f++) {
        const i = io + 2 * f;
        let v = a[i]; if (a[i + 1] > v) v = a[i + 1]; if (b[i] > v) v = b[i]; if (b[i + 1] > v) v = b[i + 1];
        out[oo + f] = v;
      }
    }
  }
  dense(q) {                                          // over q-6 .. q, flattened (channel, frequency, time)
    const W = this.W, w3 = W.w3, b3 = W.b3, w4 = W.w4, hid = this.hid, Q = this.q;
    for (let j = 0; j < H1; j++) {
      let s = b3[j];
      const jo = j * C2 * F2 * TQ;
      for (let t = 0; t < TQ; t++) {
        const col = Q[(q - 6 + t) % TQ], wt = jo + t;
        for (let ch = 0; ch < C2; ch++) {
          const co = ch * F2, wc = wt + ch * F2 * TQ;
          for (let f = 0; f < F2; f++) s += w3[wc + f * TQ] * col[co + f];
        }
      }
      hid[j] = s > 0 ? s : 0;
    }
    let z = W.b4[0];
    for (let j = 0; j < H1; j++) z += w4[j] * hid[j];
    return 1 / (1 + Math.exp(-z));
  }
}
