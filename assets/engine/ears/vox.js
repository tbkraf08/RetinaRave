// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The vocal track: is someone SINGING, and at what pitch (DECISIONS §123, the vocal detector's step 2 — the live tier; the user:
// "do the demucs for file; do cnn for live (note: I listen to live mode 90% of the time -> live mode is first concern)").
// A causal stage beside the sub / perc / tonic lanes, read-only to every other feature: it keeps its own ring of the mid signal,
// publishes three numbers and touches nothing else. Pure: no DOM, no clock, no Math.random; node, the page and a Worker.
//
//   voxS     the vocal presence 0..1 — a small CNN (ears/vox-net.js, its weights ears/vox-weights.js, trained by tools/truth/voxtrain.py)
//            over the last 34 hops of a 40-band log-mel front end, eased VOX_EASE; the net's output is the WINDOW'S END, so the read
//            trails the sound by the ease (~.1 s) plus the net's own lag — fine for a sustained line, late for a consonant
//   voxHz    the sung pitch in Hz while voxS > VOX_GATE and the pitch is periodic enough, −1 otherwise: a second YIN (the sub's class)
//            on a 200–1000 Hz band-passed, decimated copy of the stream — a pitch read on a MIX, unreliable whenever anything else is
//            pitched in that band (the honest ceiling of this tier; step 3's Demucs lane is the accurate file-mode read)
//   voxConf  voxS × the YIN's periodicity, measured on every inference whether or not the gate is open — so it is 0 only where there
//            is no read at all (the fake timeline, digital silence), which is the rig's cue to fall back to `interval` (core/fluid/inject2.js)
//
// THE FRONT END, hop by hop (tools/truth/voxtrain.py re-implements it in numpy; tools/test_vox.js proves the two equal to 1e-4):
// every VOX_HOP = 512 samples a VOX_N = 2048-point periodic-Hann FFT (the ears' FFT class: |X|·2/Σwin) over the 2048 samples ending at
// the hop, the POWER in 40 triangular HTK-mel bands 100 Hz–8 kHz (peak 1, on the bin centres), ln(E + MEL_FLOOR), then a per-band
// CAUSAL running mean / variance — an exact cumulative mean until the count passes the NORM_TAU = 30 s exponential window, exponential
// after — → (x − m) / sqrt(v + VAR_FLOOR): the net sees the track's own range, never an absolute level (§111 item 7's shape). The
// first FFT runs at hop 3 (2048 samples in); hop h covers samples [512·(h+1) − 2048, 512·(h+1)) of the stream.
import { FFT, Band, Yin, clamp01 } from './dsp.js';
import { VoxNet, N_MEL } from './vox-net.js';

export const VOX_HOP = 512, VOX_N = 2048;
export const VOX_LO = 100, VOX_HI = 8000;      // the mel bands' range (Hz)
export const MEL_FLOOR = 1e-9;                 // ln(E + this): −90 dB re a full-scale sine's band power
export const NORM_TAU = 30;                    // s: the causal normaliser's window
export const VAR_FLOOR = 0.0625;               // the sd floor (.25 nat ≈ 2.2 dB)
export const VOX_EASE = 0.1;                   // s: voxS's ease toward the net's output
export const VOX_GATE = 0.3;                   // voxS above which the pitch is reported
export const PITCH_BAND = [200, 1000];         // Hz: the YIN's band (a 4th-order high-pass + low-pass, dsp.js 'steep')
export const PITCH_SRD = 12000;                // the decimated rate the YIN runs at (the factor is round(sr / this))
export const PITCH_WIN = 0.020;                // s: the YIN window — 4 periods of 200 Hz
export const PITCH_THR = 0.15;                 // the YIN CMND threshold
export const PITCH_PER = 0.6;                  // the least periodicity (1 − CMND at the period) at which a pitch is published

// The 40 triangles (HTK mel, peak 1) over the FFT's bin centres i·sr/VOX_N — the same table voxtrain.py's mel_bank() builds.
export function melBank(sr, nMel = N_MEL, lo = VOX_LO, hi = VOX_HI, n = VOX_N) {
  const m = (f) => 2595 * Math.log10(1 + f / 700), mi = (x) => 700 * (Math.pow(10, x / 2595) - 1);
  const e0 = m(lo), e1 = m(hi), edges = [];
  for (let j = 0; j < nMel + 2; j++) edges.push(mi(e0 + (e1 - e0) * j / (nMel + 1)));
  const nb = n >> 1, bank = [];
  for (let j = 0; j < nMel; j++) {
    const a = edges[j], c = edges[j + 1], b = edges[j + 2];
    let i0 = -1, i1 = -1; const w = [];
    for (let i = 0; i < nb; i++) {
      const f = i * sr / n, v = Math.min((f - a) / (c - a), (b - f) / (b - c));
      if (v > 0) { if (i0 < 0) i0 = i; i1 = i; w.push(v); }
    }
    bank.push({ i0, n: i1 - i0 + 1, w: Float64Array.from(w) });
  }
  return bank;
}

export class VoxTrack {
  constructor(sr, o = {}) {
    this.sr = sr;
    this.RB = 4096; this.ring = new Float32Array(this.RB); this.mask = this.RB - 1; this.w = 0;
    this.nextHop = VOX_HOP; this.hops = 0;
    this.fft = new FFT(VOX_N); this.mag = new Float32Array(VOX_N >> 1);
    this.bank = melBank(sr);
    this.mel = new Float32Array(N_MEL);          // the last hop's raw log-mel …
    this.x = new Float32Array(N_MEL);            // … and its normalised column (the net's input)
    this.m = new Float64Array(N_MEL); this.v = new Float64Array(N_MEL); this.n = 0;
    this.A = 1 - Math.exp(-(VOX_HOP / sr) / NORM_TAU);
    this.ease = 1 - Math.exp(-(VOX_HOP / sr) / VOX_EASE);
    this.net = new VoxNet(o.weights);
    this.p = 0;                                  // the net's latest output (held between inferences)
    this.s = 0; this.hz = -1; this.per = 0; this.conf = 0; this.rhz = 0;
    this.fired = 0;                              // inferences so far
    // the pitch lane: band-pass, decimate, YIN
    this.band = new Band(sr, PITCH_BAND[0], PITCH_BAND[1], 2, 'steep');
    this.D = Math.max(1, Math.round(sr / PITCH_SRD)); this.srd = sr / this.D; this.phase = 0;
    this.PB = 1024; this.pring = new Float32Array(this.PB); this.pmask = this.PB - 1; this.pw = 0;
    this.yin = new Yin(this.srd, PITCH_BAND[0], PITCH_BAND[1], Math.round(PITCH_WIN * this.srd), PITCH_THR);
    this.need = this.yin.W + this.yin.tmax + 2;
    this.onHop = o.onHop || null;                // a test hook: (track, hopIndex) after each hop
  }
  // One mid sample at audio time t. Returns true when a hop ran.
  step(m, t) {
    this.ring[this.w & this.mask] = m; this.w++;
    const y = this.band.power(m);
    if (++this.phase >= this.D) { this.phase = 0; this.pring[this.pw & this.pmask] = y; this.pw++; }
    if (this.w < this.nextHop) return false;
    this.nextHop += VOX_HOP;
    this.hop(t);
    return true;
  }
  hop(t) {
    const h = this.hops++;
    this.band.e = 0;
    if (this.w < VOX_N) { if (this.onHop) this.onHop(this, h, false); return; }
    this.fft.mags(this.ring, (this.w - VOX_N) & this.mask, this.mask, this.mag);
    const mag = this.mag, bank = this.bank, mel = this.mel, x = this.x, M = this.m, V = this.v;
    const a = Math.max(1 / (this.n + 1), this.A); this.n++;
    for (let j = 0; j < N_MEL; j++) {
      const b = bank[j], w = b.w; let e = 0;
      for (let k = 0, i = b.i0; k < b.n; k++, i++) e += w[k] * mag[i] * mag[i];
      const lm = Math.log(e + MEL_FLOOR);
      mel[j] = lm;
      const d = lm - M[j];
      M[j] += a * d;
      V[j] = (1 - a) * (V[j] + a * d * d);
      x[j] = (lm - M[j]) / Math.sqrt(V[j] + VAR_FLOOR);
    }
    const p = this.net.push(x);
    if (p >= 0) {
      this.p = p; this.fired++;
      if (this.pw >= this.need) {
        const r = this.yin.run(this.pring, this.pw, this.pmask);
        this.per = r.hz >= PITCH_BAND[0] && r.hz <= PITCH_BAND[1] ? r.conf : 0;
        this.rhz = r.hz;
      }
    }
    this.s += (this.p - this.s) * this.ease;
    this.hz = this.s > VOX_GATE && this.per >= PITCH_PER ? this.rhz : -1;
    this.conf = clamp01(this.s * this.per);
    if (this.onHop) this.onHop(this, h, true);
  }
}
