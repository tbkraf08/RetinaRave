// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// PCM-BACKED ANALYSER SHIMS (v0.15 E1). makeAnalyser(fftSize, smoothing) returns an object with the AnalyserNode surface
// the v3 extractor uses (getFloatFrequencyData / getFloatTimeDomainData / the byte variants / fftSize /
// frequencyBinCount / smoothingTimeConstant / minDecibels / maxDecibels), computed from a Float32Array of mono samples
// ENDING AT a caller-set playhead instead of from a live graph. In deterministic file mode sources/file.js puts these in
// AU.fast / AU.slow, so features.js:48 and features-slow.js:11 — untouched — read exactly what Chrome's AnalyserNode
// would have read at that playhead, frame for frame, run after run.
//
// The Web Audio spec's algorithm (§AnalyserNode): the most recent fftSize samples, Blackman window (α = 0.16), FFT,
// magnitude |X[k]| / fftSize, the time smoothing X̂[k] = τ·X̂_prev[k] + (1 − τ)·|X[k]|, then 20·log10(X̂[k]).
// Two Chrome details matched on purpose (Blink modules/webaudio/realtime_analyser.cc):
//   1. The analysis happens at MOST ONCE per distinct render quantum. Blink writes the input every 128 samples and sets
//      one boolean `should_do_fft_analysis_`, cleared by the first read — so several reads at one playhead return the
//      identical array AND the smoothing recurrence advances once per read-with-new-data, not once per 128 samples.
//      (The brief said "once per new render quantum boundary crossed"; Chrome advances it once however many boundaries
//      were crossed, and "identical results for identical playhead" is the contract — see docs/workers/file.md.)
//   2. The analyser only ever sees WHOLE render quanta, so the playhead is floored to a multiple of 128 before use.
//      A frame-exact playhead is not quantum-aligned; flooring is what the real node does and it is what makes the
//      real-time and deterministic runs agree to a quantum instead of to a sample.
//   3. 20·log10(0) is −1000, not −Infinity (Blink AudioUtilities::LinearToDecibels) — features.js's `d > -160` test
//      reads either as zero magnitude, but −1000 is a finite number the trace can carry.
// Pure: no AudioContext, no DOM, no clock, no Math.random. tools/test_shim.js imports it in node.

const QUANTUM = 128;          // the Web Audio render quantum
const BLACKMAN_A = 0.16;      // the spec's α
const DB_ZERO = -1000;        // Blink's LinearToDecibels(0)
const MIN_DB = -100;          // AnalyserNode defaults
const MAX_DB = -30;
const BYTE_MAX = 255;

const TBL = new Map();        // fftSize -> { cos, sin, rev, w }

// Twiddles, the bit-reversal permutation and the Blackman window for one size, built once.
function tables(n) {
  let t = TBL.get(n);
  if (t) return t;
  if (!(n >= 32 && (n & (n - 1)) === 0)) throw new Error('shim: fftSize must be a power of two >= 32, got ' + n);
  const h = n >> 1, cos = new Float64Array(h), sin = new Float64Array(h), rev = new Uint32Array(n), w = new Float64Array(n);
  for (let i = 0; i < h; i++) { const a = -2 * Math.PI * i / n; cos[i] = Math.cos(a); sin[i] = Math.sin(a); }
  let bits = 0;
  while (1 << bits < n) bits++;
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
  const a0 = (1 - BLACKMAN_A) / 2, a1 = 0.5, a2 = BLACKMAN_A / 2;
  for (let i = 0; i < n; i++) w[i] = a0 - a1 * Math.cos(2 * Math.PI * i / n) + a2 * Math.cos(4 * Math.PI * i / n);
  t = { cos, sin, rev, w };
  TBL.set(n, t);
  return t;
}

// In-place iterative radix-2 Cooley–Tukey on (re, im), length n = a power of two.
export function fft(re, im, T) {
  const n = re.length, rev = T.rev;
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (j > i) { let x = re[i]; re[i] = re[j]; re[j] = x; x = im[i]; im[i] = im[j]; im[j] = x; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1, step = n / len;
    for (let i = 0; i < n; i += len) {
      for (let j = 0, k = 0; j < half; j++, k += step) {
        const c = T.cos[k], s = T.sin[k], p = i + j, q = p + half;
        const ar = re[q], ai = im[q], tr = ar * c - ai * s, ti = ar * s + ai * c;
        re[q] = re[p] - tr; im[q] = im[p] - ti;
        re[p] += tr; im[p] += ti;
      }
    }
  }
}

export function makeAnalyser(fftSize, smoothing) {
  const N = fftSize, bins = N >> 1, T = tables(N);
  const re = new Float64Array(N), im = new Float64Array(N);
  const mag = new Float64Array(bins);   // X̂: the smoothed magnitudes, the only state that carries between analyses
  const db = new Float32Array(bins);

  const A = {
    fftSize: N, frequencyBinCount: bins, smoothingTimeConstant: smoothing,
    minDecibels: MIN_DB, maxDecibels: MAX_DB,
    pcm: null, sr: 0, end: 0, quantum: -1, analyses: 0,

    // The samples this analyser listens to, and where the playhead is. seek() takes a sample index (exclusive end).
    setSource(pcm, sr) { A.pcm = pcm; A.sr = sr; A.end = 0; A.quantum = -1; A.analyses = 0; mag.fill(0); db.fill(DB_ZERO); },
    seek(endSample) { A.end = endSample > 0 ? endSample : 0; },
    // The quantum-aligned sample the node's ring buffer ends at.
    endQ() { return Math.floor(A.end / QUANTUM) * QUANTUM; },

    getFloatFrequencyData(out) {
      analyse();
      const n = Math.min(out.length, bins);
      for (let k = 0; k < n; k++) out[k] = db[k];
    },
    getByteFrequencyData(out) {
      analyse();
      const n = Math.min(out.length, bins), lo = A.minDecibels, k255 = BYTE_MAX / (A.maxDecibels - lo);
      for (let k = 0; k < n; k++) {
        const v = Math.floor(k255 * (db[k] - lo));
        out[k] = v < 0 ? 0 : v > BYTE_MAX ? BYTE_MAX : v;
      }
    },
    getFloatTimeDomainData(out) {
      const e = A.endQ(), p = A.pcm, len = p ? p.length : 0, n = Math.min(out.length, N);
      for (let i = 0; i < n; i++) { const s = e - N + i; out[i] = s >= 0 && s < len ? p[s] : 0; }
    },
    getByteTimeDomainData(out) {
      const e = A.endQ(), p = A.pcm, len = p ? p.length : 0, n = Math.min(out.length, N);
      for (let i = 0; i < n; i++) {
        const s = e - N + i, x = s >= 0 && s < len ? p[s] : 0, v = Math.floor(128 * (1 + x));
        out[i] = v < 0 ? 0 : v > BYTE_MAX ? BYTE_MAX : v;
      }
    },
    // No-ops so the shim can stand in for a node in a graph expression without a special case.
    connect() {}, disconnect() {},
  };

  function analyse() {
    const q = Math.floor(A.end / QUANTUM);
    if (q === A.quantum) return;   // same playhead quantum: Chrome returns the cached array and does not smooth again
    A.quantum = q;
    A.analyses++;
    const e = q * QUANTUM, p = A.pcm, len = p ? p.length : 0, w = T.w;
    for (let i = 0; i < N; i++) {
      const s = e - N + i;
      re[i] = (s >= 0 && s < len ? p[s] : 0) * w[i];
      im[i] = 0;
    }
    fft(re, im, T);
    const tau = A.smoothingTimeConstant, inv = 1 / N;
    for (let k = 0; k < bins; k++) {
      const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]) * inv;
      const x = tau * mag[k] + (1 - tau) * m;
      mag[k] = x;
      db[k] = x > 0 ? 20 * Math.log10(x) : DB_ZERO;
    }
  }

  return A;
}

export const SHIM = { QUANTUM, BLACKMAN_A, DB_ZERO, MIN_DB, MAX_DB };
