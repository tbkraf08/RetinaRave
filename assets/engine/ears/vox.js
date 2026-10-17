// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The vocal track: is someone SINGING, and at what pitch (DECISIONS §123, the vocal detector's step 2 — the live tier; the user:
// "do the demucs for file; do cnn for live (note: I listen to live mode 90% of the time -> live mode is first concern)"; §133 the
// streaming net with the pitch head). A causal stage beside the sub / perc / tonic lanes, read-only to every other feature: it keeps
// its own ring of the mid signal, publishes three numbers and touches nothing else. Pure: no DOM, no clock, no Math.random; node, the
// page and the ears Worker.
//
//   voxS     the vocal presence 0..1 — the net (ears/vox-net.js, its weights ears/vox-weights.js, trained by tools/truth/voxtrain.py:
//            §133 a causal TCN over a 40-band log-mel front end, an output EVERY hop; the §123–§126 net was a 40 × 34 window read once
//            per four hops) eased toward the net's output — VOX_ATTACK while the vote (below) says voice and the output is above the
//            eased value, VOX_RELEASE otherwise (§126: the one ease of .1 s was HALF the measured 160 ms lag — attack .03 / release
//            .05 under the vote took it to 120 with the flicker under the lane's own; §133: the per-hop output has no hold to pay for,
//            the vote is per hop and the ruler re-tuned the ease — tools/vox-ab.js --stage). Everything here is causal: no look-ahead.
//   voxHz    the sung pitch in Hz while the vote is on, voxS > VOX_GATE and the pitch head is sure enough (its "none" class under
//            1 − PITCH_PER), −1 otherwise: the net's PITCH HEAD (61 classes: 60 semitone bins C3..B7 + none, trained on the vocal
//            stems' pYIN — a pitch learned from the STEM, read on the mix) names the semitone; HARMONIC SALIENCE on the ears' own
//            2048-point FFT refines it inside the bin (Σ k = 1..SAL_HARM of |X| at k·f over SAL_CANDS candidates across the bin's
//            ±50 cents, the argmax published). WHAT BECAME OF THE YIN: §123's second YIN on a 200–1000 Hz band-passed, decimated copy
//            of the stream — a pitch read on a MIX, wrong whenever anything else was pitched in that band (45 / 55 / 9 % within a
//            semitone of the lane, §126's table) — is PULLED from this stage: no band-pass, no decimation ring, no CMND per hop. The
//            Yin class stays in dsp.js for the sub lane.
//   voxConf  voxS × the head's voiced mass (1 − p(none)), measured on every hop whether or not the gate is open — so it is 0 only where
//            there is no read at all (the fake timeline, digital silence), which is the rig's cue to fall back to `interval` (core/fluid/inject2.js)
//
// THE FRONT END, hop by hop (tools/truth/voxtrain.py re-implements it in numpy; tools/test_vox.js proves the two equal to 1e-4):
// every VOX_HOP = 512 samples a VOX_N = 2048-point periodic-Hann FFT (the ears' FFT class: |X|·2/Σwin) over the 2048 samples ending at
// the hop, the POWER in 40 triangular HTK-mel bands 100 Hz–8 kHz (peak 1, on the bin centres), ln(E + MEL_FLOOR), then a per-band
// CAUSAL running mean / variance — an exact cumulative mean until the count passes the NORM_TAU = 30 s exponential window, exponential
// after — → (x − m) / sqrt(v + VAR_FLOOR): the net sees the track's own range, never an absolute level (§111 item 7's shape). The
// first FFT runs at hop 3 (2048 samples in); hop h covers samples [512·(h+1) − 2048, 512·(h+1)) of the stream.
import { FFT, clamp01 } from './dsp.js';
import { VoxNet, N_MEL, PITCH_NONE, binHz } from './vox-net.js';

export const VOX_HOP = 512, VOX_N = 2048;
export const VOX_LO = 100, VOX_HI = 8000;      // the mel bands' range (Hz)
export const MEL_FLOOR = 1e-9;                 // ln(E + this): −90 dB re a full-scale sine's band power
export const NORM_TAU = 30;                    // s: the causal normaliser's window
export const VAR_FLOOR = 0.0625;               // the sd floor (.25 nat ≈ 2.2 dB)
export const VOX_ATTACK = 0.03;                // s: voxS's ease toward a HIGHER net output while the vote says voice (§126; was one VOX_EASE .1)
export const VOX_RELEASE = 0.05;               // s: voxS's ease otherwise (§126: .1 → .05 — the release owed as much lag as the attack, and a false voice's spike dies sooner)
export const VOX_EASE = VOX_RELEASE;           // the old name, kept for readers: the release IS the §123 ease
export const VOX_GATE = 0.3;                   // voxS above which the pitch is reported; the vote's threshold on the net's output
export const VOX_VOTE_OF = 4, VOX_VOTE_ON = 3; // the hysteresis (§126, per HOP since §133): the vote is ON when VOX_VOTE_ON of the last VOX_VOTE_OF hops read >= VOX_GATE
export const PITCH_PER = 0.5;                  // the least voiced mass of the pitch head (1 − p(none)) at which a pitch is published (§133; was the YIN's periodicity .6)
export const SAL_HARM = 5;                     // the harmonics the salience sums (k = 1..5; a harmonic past the mel's top bin is left out)
export const SAL_CANDS = 11;                   // the candidates across the bin: −50..+50 cents in 10-cent steps
export const PITCH_LO = binHz(0, -50), PITCH_HI = binHz(59, 50);   // Hz: what voxHz can be — the head's 60 bins, C3 − 50 cents .. B7 + 50 cents

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
    this.kMax = this.bank[N_MEL - 1].i0 + this.bank[N_MEL - 1].n - 1;   // §130: the highest bin a band reads — the pruned FFT (dsp.js magsLo) stops there
    this.mel = new Float32Array(N_MEL);          // the last hop's raw log-mel …
    this.x = new Float32Array(N_MEL);            // … and its normalised column (the net's input)
    this.m = new Float64Array(N_MEL); this.v = new Float64Array(N_MEL); this.n = 0;
    this.A = 1 - Math.exp(-(VOX_HOP / sr) / NORM_TAU);
    // §133: the ease and the vote are overridable per instance for the ruler's sweep (tools/vox-ab.js --ease=attack,release,of,on); the engine never passes them
    this.attack = o.attack || VOX_ATTACK; this.release = o.release || VOX_RELEASE;
    this.voteOf = o.voteOf || VOX_VOTE_OF; this.voteOn = o.voteOn || VOX_VOTE_ON;
    this.easeA = 1 - Math.exp(-(VOX_HOP / sr) / this.attack);   // per hop, toward a rising output under the vote
    this.easeR = 1 - Math.exp(-(VOX_HOP / sr) / this.release);  // per hop, otherwise
    this.ease = this.easeR;                      // the old name (the release)
    this.net = new VoxNet(o.weights);
    this.p = 0;                                  // the net's latest output (§133: a new one every hop)
    this.s = 0; this.hz = -1; this.per = 0; this.conf = 0; this.rhz = 0;
    this.fired = 0;                              // inferences so far (§133: one per hop from the first FFT)
    this.votes = 0; this.vote = 0; this.on = false;   // the last VOX_VOTE_OF hops' reads at the gate, as bits; their count; the vote
    this.bin = PITCH_NONE;                       // the pitch head's argmax at the newest hop (60 = none)
    this.binHz = sr / VOX_N;                     // Hz per FFT bin, for the salience
    this.onHop = o.onHop || null;                // a test hook: (track, hopIndex) after each hop
    // §130: true = the stage is SKIPPED — Ears.push does not call step(), so no ring write, no band-pass, no FFT, no net, no YIN; the
    // three keys stay 0 / −1 / 0 (exactly the stage stubbed, tools/test_vox.js (iv)). Set by Ears.setVoxSkip while the file-mode lane
    // (§124) feeds voxS / voxHz / voxConf and the CNN's read would be thrown away; turning it back on replaces the track with a fresh
    // one (the ring, the normaliser and the net re-prime as on a new source). Never read inside this class: step() always computes.
    this.skip = false;
  }
  // One mid sample at audio time t. Returns true when a hop ran.
  step(m, t) {
    this.ring[this.w & this.mask] = m; this.w++;
    if (this.w < this.nextHop) return false;
    this.nextHop += VOX_HOP;
    this.hop(t);
    return true;
  }
  hop(t) {
    const h = this.hops++;
    if (this.w < VOX_N) { if (this.onHop) this.onHop(this, h, false); return; }
    this.fft.magsLo(this.ring, (this.w - VOX_N) & this.mask, this.mask, this.mag, this.kMax);   // §130: bins 0..kMax, bit-identical to mags()
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
    const net = this.net, p = net.push(x);
    this.p = p; this.fired++;
    // the vote (§126, per hop since §133): the last VOX_VOTE_OF hops at the gate, VOX_VOTE_ON of them on = voice. One hop above the gate
    // alone neither opens the fast attack nor publishes a pitch; one below alone does not close them — the hysteresis a .03 s attack needs.
    this.votes = ((this.votes << 1) | (p >= VOX_GATE ? 1 : 0)) & ((1 << this.voteOf) - 1);
    let c = 0; for (let v = this.votes; v; v >>= 1) c += v & 1;
    this.vote = c; this.on = c >= this.voteOn;
    // the pitch: the head's bin, the salience's Hz inside it (every hop, gate or not — `rhz` is the read, `hz` the published one)
    this.bin = net.bin; this.per = 1 - net.pNone;
    this.rhz = net.bin < PITCH_NONE ? this.salience(net.bin) : -1;
    this.s += (this.p - this.s) * (this.on && this.p > this.s ? this.easeA : this.easeR);
    this.hz = this.on && this.s > VOX_GATE && this.per >= PITCH_PER && this.rhz > 0 ? this.rhz : -1;
    this.conf = clamp01(this.s * this.per);
    if (this.onHop) this.onHop(this, h, true);
  }
  // Harmonic salience inside a semitone bin: of SAL_CANDS candidate fundamentals across the bin's ±50 cents, the one whose first
  // SAL_HARM harmonics add up to the most magnitude in THIS hop's 2048-point FFT (bins 0..kMax, linearly interpolated between bin
  // centres). The head says WHICH semitone; this says where inside it the harmonics actually stand — a 2048-point bin is 23 Hz wide,
  // a semitone at C3 is 7.8 Hz, so the low bins lean on the upper harmonics, which the sum gives them for free.
  salience(bin) {
    const mag = this.mag, kMax = this.kMax, bh = this.binHz;
    let best = -1, bestHz = -1;
    for (let c = 0; c < SAL_CANDS; c++) {
      const f = binHz(bin, -50 + 100 * c / (SAL_CANDS - 1));
      let s = 0;
      for (let k = 1; k <= SAL_HARM; k++) {
        const pos = k * f / bh, i = pos | 0;
        if (i + 1 > kMax) break;
        const fr = pos - i;
        s += mag[i] * (1 - fr) + mag[i + 1] * fr;
      }
      if (s > best) { best = s; bestHz = f; }
    }
    return bestHz;
  }
}
