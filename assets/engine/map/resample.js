// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Resampling for the track map's NON-CAUSAL channels only (file mode). Nothing causal and nothing live uses it.
//
// Why it exists: `tools/truth/trackmap.py` analyses a track at the FILE's own rate — 44.1 kHz for SeeYouDrop.flac — and
// every ruler in `tools/truth/compare.py` grades against those 44.1 kHz numbers. The page decodes through
// `decodeAudioData`, so `AudioBuffer.sampleRate` is the AudioContext's, 48 kHz here. Measured (tools/work/probe_rate.py):
// the truth tool's OWN onset front end, run on the same music resampled to 48 kHz, reproduces only 70 % of its own
// 44.1 kHz low-onset list (F 0.702, kick F 0.724, 12.2 % of its kicks on its own bare808 list) — because the 2048-point
// STFT's bins are 21.53 Hz wide at 44.1 kHz and 23.44 Hz at 48 kHz, so "40-150 Hz" is bins 2-6 = 43-129 Hz at one rate
// and 47-141 Hz at the other, the 17-frame HPSS medians span 197 ms against 181 ms, and `int(0.09*fps2)` is 7 frames
// against 8. The disagreement is the reference's, not an implementation's: this JS port matches python's numbers exactly
// at BOTH rates. So the map brings the audio to the truth's rate first and the front end then has one definition.
export const ANA_SR = 44100;         // the rate every non-causal map channel analyses at
export const RS_T = 8;               // the windowed-sinc half-length, in INPUT samples (16 taps)
export const RS_MAXPH = 8192;        // above this many distinct phases, evaluate the kernel per sample instead of tabling

const gcd = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
// Blackman over [-T, T]; `fc` is the cutoff as a fraction of the INPUT Nyquist (1 when up-sampling, ratio when down).
const kern = (u, T, fc) => {
  if (Math.abs(u) > T) return 0;
  const w = 0.42 + 0.5 * Math.cos(Math.PI * u / T) + 0.08 * Math.cos(2 * Math.PI * u / T);
  return fc * sinc(fc * u) * w;
};

// Linear-phase band-limited resample of `x` from `sr` to `to`. Returns `x` itself when the rates match.
export function resample(x, sr, to, T = RS_T) {
  if (sr === to) return x;
  const n = x.length, ratio = to / sr, m = Math.max(1, Math.floor(n * ratio));
  const out = new Float32Array(m);
  const fc = Math.min(1, ratio);
  const g = gcd(Math.round(sr), Math.round(to));
  const step = Math.round(sr) / g, den = Math.round(to) / g;              // input position of output j = j*step/den
  const K = 2 * T;
  if (den <= RS_MAXPH && Number.isInteger(step) && Number.isInteger(den)) {
    // the fractional phase of output j is (j*step mod den)/den — exactly `den` distinct values, so table them once
    const tab = new Float64Array(den * K);
    for (let p = 0; p < den; p++) {
      const frac = p / den;
      let s = 0;
      for (let k = 0; k < K; k++) { const v = kern(k - T + 1 - frac, T, fc); tab[p * K + k] = v; s += v; }
      if (s > 1e-9) for (let k = 0; k < K; k++) tab[p * K + k] /= s;      // unit DC gain, no ripple across phases
    }
    for (let j = 0; j < m; j++) {
      const num = j * step, i0 = Math.floor(num / den), o = (num - i0 * den) * K, b = i0 - T + 1;
      let s = 0;
      if (b >= 0 && b + K <= n) for (let k = 0; k < K; k++) s += tab[o + k] * x[b + k];   // the interior: no clamping
      else for (let k = 0; k < K; k++) { const i = b + k; s += tab[o + k] * x[i < 0 ? 0 : i >= n ? n - 1 : i]; }
      out[j] = s;
    }
    return out;
  }
  for (let j = 0; j < m; j++) {                                            // the generic path: evaluate the kernel
    const xx = j / ratio, i0 = Math.floor(xx), frac = xx - i0;
    let s = 0, w = 0;
    for (let k = 0; k < K; k++) {
      const v = kern(k - T + 1 - frac, T, fc), i = i0 + k - T + 1;
      s += v * x[i < 0 ? 0 : i >= n ? n - 1 : i]; w += v;
    }
    out[j] = w > 1e-9 ? s / w : s;
  }
  return out;
}
