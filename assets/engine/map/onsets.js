// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NON-CAUSAL percussion onsets for the track map (file mode only). This is the truth tool's own front end, ported:
// a 2048-point STFT at hop 512, Fitzgerald-2010 HPSS, per-band dB flux, peak picking, and the beater-click test at the
// truth's OWN definition (15 ms) — not the causal ears' 25 ms compromise. Nothing here is causal and nothing here runs
// in a live mode: `features-ears.js` reads these events at heard time in file mode and falls back to `ears/perc.js` live.
//
// The truth tool's HPSS is SEPARABLE, not 2-D: `median_filter(S, (1,17))` along TIME is the harmonic estimate and
// `median_filter(S, (17,1))` along FREQUENCY is the percussive one, combined by a squared Wiener mask
// (trackmap.py: `Pp = S * Sp**2 / (Sh**2 + Sp**2 + 1e-12)`). That is exactly Fitzgerald's two 1-D medians; a 2-D median
// would be one filter over a 17x17 neighbourhood and is NOT what the reference does. Ported separably, both medians
// sliding (O(K) per sample), with scipy's 'reflect' edge mode so the first and last frames match too.
//
// Why this and not the causal detector: the ears' 40-150 Hz flux front end scores kick F 0.53 whole-track / 0.79 on
// 25-45 s against `onsets.click` and puts 8.6 % of its kicks on a truth `bare808`, because a causal 512-hop band-pass
// bank cannot separate an 808 note start from a kick without the beater window being wide enough to catch a hat by luck
// (docs/workers/ears.md 3.2). With the truth's own front end the file-mode channel IS the reference, to a frame.
import { FFT } from '../ears/dsp.js';
import { ANA_SR, resample } from './resample.js';

export const N2 = 2048;              // the truth's short STFT (trackmap.py `n2`), 46 ms at 44.1 kHz
export const H2 = 512;               // ... and its hop (`h2`) — the same 512 the PCM bus delivers
export const HP_MED = 17;            // the separable HPSS median, in frames (time) and in bins (frequency)
export const ON_BANDS = [[40, 150], [150, 2500], [5000, 12000]];    // low (kicks AND 808 starts) / snare+clap / hat
export const ON_THR = [5, 3, 3];     // the flux peak height, dB (the truth's 5 / 3 / 3)
export const ON_GATE_DB = 30;        // ignore flux more than this far under the band's own p95 level
export const ON_DIST = 0.09;         // the peak distance, s (the truth's `distance=int(0.09*fps2)`)
export const CLICK_W = 0.015;        // a low onset is a KICK when a snare/hat onset is within this — the truth's definition
export const VEL_P = 0.95;           // velocity = the peak's flux over this quantile of the class's own peak fluxes

const r4 = (x) => Math.round(x * 1e4) / 1e4;
const r3 = (x) => Math.round(x * 1e3) / 1e3;

// A sliding median of width K over `len` values at src[so + ss*i], writing dst[do_ + ds*i] for i in [i0, i1).
// The two layouts differ (the frequency median reads a strided column of the bin-major plane and writes a contiguous
// scratch column), and `i0 > 0` lets a caller skip a range of bins it will not read: the window is still primed from
// i0 - half, so every output in [i0, i1) is the same value a filter over the whole axis would give — provided
// i0 >= half, which is how the two frequency segments below are cut.
// scipy.ndimage.median_filter's 'reflect': (d c b a | a b c d | d c b a) — index -1 is 0, index len is len-1.
// Sorted insert / remove with a memmove of at most K-1 floats, written out flat: the closure version of this loop cost
// 1.8x as much (829 ms against 455 for the two planes).
function slideMed(src, so, ss, dst, do_, ds, len, K, srt, i0 = 0, i1 = len) {
  const half = K >> 1;
  let cnt = 0;
  for (let q = i0 - half; q <= i0 + half; q++) {
    const j = q < 0 ? -q - 1 : q >= len ? 2 * len - q - 1 : q;
    const v = src[so + ss * j];
    let lo = 0, hi = cnt;
    while (lo < hi) { const m = (lo + hi) >> 1; if (srt[m] < v) lo = m + 1; else hi = m; }
    for (let i = cnt; i > lo; i--) srt[i] = srt[i - 1];
    srt[lo] = v; cnt++;
  }
  dst[do_ + ds * i0] = srt[half];
  for (let i = i0 + 1; i < i1; i++) {
    let q = i - half - 1;
    let j = q < 0 ? -q - 1 : q >= len ? 2 * len - q - 1 : q;
    let v = src[so + ss * j];
    let lo = 0, hi = cnt - 1;                            // remove the value leaving the window
    while (lo < hi) { const m = (lo + hi) >> 1; if (srt[m] < v) lo = m + 1; else hi = m; }
    for (let k = lo; k < cnt - 1; k++) srt[k] = srt[k + 1];
    cnt--;
    q = i + half;
    j = q < 0 ? -q - 1 : q >= len ? 2 * len - q - 1 : q;
    v = src[so + ss * j];
    lo = 0; hi = cnt;                                    // ... and insert the one entering it
    while (lo < hi) { const m = (lo + hi) >> 1; if (srt[m] < v) lo = m + 1; else hi = m; }
    for (let k = cnt; k > lo; k--) srt[k] = srt[k - 1];
    srt[lo] = v; cnt++;
    dst[do_ + ds * i] = srt[half];
  }
}

const pctLin = (a, q) => {                       // numpy.percentile, linear interpolation
  const b = Array.prototype.slice.call(a).sort((x, y) => x - y);
  if (!b.length) return 0;
  const p = q / 100 * (b.length - 1), i = Math.floor(p), f = p - i;
  return i + 1 < b.length ? b[i] + (b[i + 1] - b[i]) * f : b[i];
};

// scipy.signal.find_peaks(x, height, distance): strict local maxima (plateau -> its midpoint), then the height filter,
// then the distance filter applied highest-peak-first.
function findPeaks(x, n, height, distance) {
  const pk = [];
  let i = 1;
  while (i < n - 1) {
    if (x[i - 1] < x[i]) {
      let j = i;
      while (j + 1 < n && x[j + 1] === x[i]) j++;
      if (j < n - 1 && x[j + 1] < x[i]) { if (x[i] >= height) pk.push((i + j) >> 1); i = j + 1; continue; }
      i = j + 1;
      continue;
    }
    i++;
  }
  const d = Math.ceil(distance);
  const ord = pk.map((_, k) => k).sort((a, b) => x[pk[b]] - x[pk[a]] || a - b);
  const keep = new Uint8Array(pk.length).fill(1);
  for (const k of ord) {
    if (!keep[k]) continue;
    for (let j = k - 1; j >= 0 && pk[k] - pk[j] < d; j--) keep[j] = 0;
    for (let j = k + 1; j < pk.length && pk[j] - pk[k] < d; j++) keep[j] = 0;
  }
  return pk.filter((_, k) => keep[k]);
}

// mono (Float32Array) at the decoded rate in -> the truth's three onset streams, the kick / bare split, the frame grid,
// and the ANA_SR-rate signal it analysed (so the sub-pitch pass can share one resample).
// `opts.thr` / `opts.clickW` / `opts.med` override the constants (the sweeps use them, the page does not);
// `opts.mono44` passes an already-resampled signal in.
export function buildOnsets(mono0, sr0, opts = {}) {
  const thr = opts.thr || ON_THR, clickW = opts.clickW === undefined ? CLICK_W : opts.clickW;
  const med = opts.med === undefined ? HP_MED : opts.med;
  const mono = opts.mono44 || resample(mono0, sr0, ANA_SR), sr = ANA_SR;
  const n = mono.length, nfr = Math.floor((n - N2) / H2) + 1, fps = sr / H2, df = sr / N2;
  const empty = { fps: r4(fps), t0: 0, kick: [], snare: [], hat: [], low: [], bare: [], nfr: 0, anaSr: sr, mono44: mono };
  if (nfr < 3) return empty;
  // the bins each band needs, plus the HPSS frequency median's half-window; bin 0 upward, so scipy's reflect at 0 matches
  const bandBins = ON_BANDS.map(([lo, hi]) => {
    const b0 = Math.max(0, Math.ceil(lo / df)), b1 = Math.min((N2 >> 1) - 1, Math.ceil(hi / df) - 1);
    return [b0, b1];
  });
  const half = med >> 1;
  const nb = Math.min(N2 >> 1, bandBins[bandBins.length - 1][1] + half + 1);
  // The three bands leave a gap the HPSS never has to touch (at 44.1 kHz: 40-150 Hz is bins 2-6, 150-2500 is 7-116 and
  // 5-12 kHz is 233-557, so bins 125-224 are read by nothing). `segs` are the merged band ranges; the frequency median is
  // primed from `a - half` on GLOBAL bin indices, so an output inside a segment is bit-identical to one from a filter over
  // the whole axis, reflection at bin 0 included. Measured: 474 of 566 bins, and Sh over 440 rows instead of 566.
  const segs = [];
  for (const [a, b] of bandBins.slice().sort((p, q) => p[0] - q[0])) {
    const last = segs[segs.length - 1];
    if (last && a - last[1] <= med + 1) last[1] = Math.max(last[1], b); else segs.push([a, b]);
  }
  const rowOf = new Int32Array(nb).fill(-1);
  let nrow = 0;
  for (const [a, b] of bandBins) for (let i = a; i <= b; i++) if (rowOf[i] < 0) rowOf[i] = nrow++;
  // --- the STFT. scipy's stft(..., padded=False, boundary=None) frame k covers samples [k*H2, k*H2+N2) and is stamped at
  // its CENTRE, (N2/2 + k*H2)/sr — the same non-causal convention the truth's YIN contour uses. Its magnitude scaling is
  // |fft(win*x)| / sum(win); FFT.mags returns twice that, so halve it (a constant factor cancels in the flux and in the
  // level gate, but not against the 1e-10 floor inside the log).
  const fft = new FFT(N2), mag = new Float32Array(N2 >> 1), ring = new Float32Array(N2);
  const S = new Float32Array(nb * nfr);                 // bin-major: S[b*nfr + f]
  // Three band energies ride along for free, for the sub channel's gate (`subpitch.js`): E(25-60), E(25-600) and
  // E(25-12000 Hz), all power. `share` = E(25-60)/E(25-12000) is the truth's `share4` (its own comes from a 4096-point
  // window at the same 512 hop; the voiced rule only tests it against 0.05, so the window length does not matter).
  const share = new Float32Array(nfr), e60 = new Float32Array(nfr), e600 = new Float32Array(nfr);
  const s0 = Math.ceil(25 / df), s1 = Math.ceil(60 / df) - 1;
  const s6 = Math.ceil(600 / df) - 1, t1 = Math.min((N2 >> 1) - 1, Math.ceil(12000 / df) - 1);
  for (let f = 0; f < nfr; f++) {
    ring.set(mono.subarray(f * H2, f * H2 + N2));
    fft.mags(ring, 0, N2 - 1, mag);
    for (const [a, b] of segs) for (let q = Math.max(0, a - half); q <= Math.min(nb - 1, b + half); q++) S[q * nfr + f] = 0.5 * mag[q];
    let su = 0, lo6 = 0, to = 0;
    for (let q = s0; q <= t1; q++) { const p = mag[q] * mag[q]; to += p; if (q <= s6) lo6 += p; if (q <= s1) su += p; }
    share[f] = to > 0 ? su / to : 0; e60[f] = su; e600[f] = lo6;
  }
  // --- separable HPSS. Sh: a median over HP_MED frames of each bin (what is steady in time is harmonic), band bins only.
  const srt = new Float32Array(med);
  const Sh = new Float32Array(nrow * nfr);
  for (let b = 0; b < nb; b++) if (rowOf[b] >= 0) slideMed(S, b * nfr, 1, Sh, rowOf[b] * nfr, 1, nfr, med, srt);
  // Sp: a median over HP_MED bins of each frame (what is spread in frequency is percussive) — one column at a time, and
  // the masked band sums are accumulated straight away, so no third plane of nb x nfr floats is ever held.
  const NBD = ON_BANDS.length;
  const L = [];                                          // the band dB envelopes
  for (let k = 0; k < NBD; k++) L.push(new Float32Array(nfr));
  const col = new Float32Array(nb);
  for (let f = 0; f < nfr; f++) {
    for (const [a, b] of segs) slideMed(S, f, nfr, col, 0, 1, nb, med, srt, a, b + 1);
    for (let k = 0; k < NBD; k++) {
      const [b0, b1] = bandBins[k];
      let s = 0;
      for (let b = b0; b <= b1; b++) {
        const v = S[b * nfr + f], h = Sh[rowOf[b] * nfr + f], p = col[b];
        s += v * (p * p) / (h * h + p * p + 1e-12);
      }
      L[k][f] = 10 * Math.log10(s + 1e-10);
    }
  }
  // --- flux, the level gate, the peaks
  const fl = new Float32Array(nfr);
  const streams = [];
  for (let k = 0; k < NBD; k++) {
    const Lk = L[k], g = pctLin(Lk, 95) - ON_GATE_DB;
    fl[0] = 0;                                         // np.diff(L, prepend=L[0])[0] is 0
    for (let f = 1; f < nfr; f++) fl[f] = Lk[f] > g ? Math.max(0, Lk[f] - Lk[f - 1]) : 0;
    const pk = findPeaks(fl, nfr, thr[k], Math.floor(ON_DIST * fps));   // the truth's int(0.09*fps2), truncated
    const p95 = pctLin(pk.map((f) => fl[f]), 100 * VEL_P) || 1;
    streams.push(pk.map((f) => ({ f, t: (N2 / 2 + f * H2) / sr, v: fl[f] / p95 })));
  }
  // --- the click test, exactly as the truth states it: a low onset is a kick when the nearest snare-or-hat onset is
  // within CLICK_W; a bare low onset is an 808 note start and belongs to subNoteEvt, not to kickEvt.
  const click = streams[1].concat(streams[2]).map((e) => e.t).sort((a, b) => a - b);
  const kick = [], bare = [];
  for (const e of streams[0]) {
    let best = 9;
    for (let i = 0; i < click.length; i++) { const d = Math.abs(click[i] - e.t); if (d < best) best = d; if (click[i] > e.t + best) break; }
    (best < clickW ? kick : bare).push(e);
  }
  const ev = (a) => a.map((e) => ({ t: r4(e.t), vel: r3(Math.max(0, Math.min(1, e.v))) }));
  const o = {
    fps: r4(fps), t0: r4(N2 / 2 / sr), nfr, anaSr: sr,
    kick: ev(kick), snare: ev(streams[1]), hat: ev(streams[2]), low: ev(streams[0]), bare: ev(bare),
  };
  o.mono44 = mono; o.share = share; o.e60 = e60; o.e600 = e600;    // for buildSubPitch; dropped before the map is returned
  if (opts.dbg) o.dbg = { L: L.map((x) => Array.from(x)), bins: bandBins, nb, S0: Array.from(S.subarray(0, 0)) };
  return o;
}
