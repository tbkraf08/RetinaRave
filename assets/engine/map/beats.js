// The beat and bar grid, non-causally, from a percussive onset envelope. A JS port of tools/truth/trackmap.py's E0 grid, and
// it is graded against it: on SeeYouDrop the python tool gives 150.030 BPM, beat 0.39992 s, phase 0.0172 s, downbeat = beat
// index 0 mod 4.
export const TEMPO_C = 60 / 135;     // the log-normal tempo prior's centre (s per beat)
export const TEMPO_SIG = 0.7;        // ... and its width in octaves. 0.7 is what makes 0.40 s beat 0.80 s on SeeYouDrop,
                                     // whose plain ACF peak is the half-time 0.80 (the truth tool reports 75 BPM).
export const DP_ALPHA = 680;         // Ellis 2007 transition tightness on the log-period penalty
export const REFIT_HOPS = 1.5;       // the sub-hop period search half-width, in ANALYSIS HOPS: the ACF peak is quantised to
                                     // the hop (11.6 ms at 512/44.1k, so lag 34 = 0.3947 s and lag 35 = 0.4064 s and the
                                     // true 0.3999 s sits between them), and this covers both neighbours.
export const REFIT_STEP = 2e-5;      // ... its step: 20 us, so the grid is good to ~1 ms over 157 s
export const DRIFT_MAX = 0.015;      // if the period refitted on the first half and on the second half differ by more than
                                     // this fraction, the track's tempo really moves and the DP beats are kept instead of a
                                     // single linear grid. Measured, and this is why it is NOT a residual test against the
                                     // DP beats: those are hop-quantised, so the DP's median interval on SeeYouDrop is
                                     // 0.3947 s (152.00 BPM) although the track is 150.06 — every residual or agreement
                                     // test against them "failed" and kept the wrong tempo.

// Comb ACF with the prior. -> { per, score } (per in seconds).
export function tempoPeak(env, fps, lo = 0.25, hi = 1.0) {
  const n = env.length;
  let mean = 0; for (let i = 0; i < n; i++) mean += env[i];
  mean /= n;
  const a = new Float64Array(n);
  for (let i = 0; i < n; i++) a[i] = env[i] - mean;
  let e0 = 0; for (let i = 0; i < n; i++) e0 += a[i] * a[i];
  if (!(e0 > 0)) return { per: TEMPO_C, score: 0 };
  const L = Math.min(n - 2, Math.round(hi * fps) * 4 + 2);
  const ac = new Float64Array(L + 1);
  for (let lag = 0; lag <= L; lag++) { let s = 0; for (let i = 0; i + lag < n; i++) s += a[i] * a[i + lag]; ac[lag] = s / e0; }
  let best = -1e9, bl = Math.round(lo * fps);
  for (let lag = Math.max(2, Math.round(lo * fps)); lag <= Math.round(hi * fps); lag++) {
    const c = ac[lag] + 0.6 * ac[Math.min(L, 2 * lag)] + 0.3 * ac[Math.min(L, 4 * lag)];
    const z = Math.log2(lag / fps / TEMPO_C) / TEMPO_SIG;
    const s = c * Math.exp(-0.5 * z * z);
    if (s > best) { best = s; bl = lag; }
  }
  return { per: bl / fps, score: best };
}

// Ellis 2007 dynamic-programming beat tracker. -> beat times (s), quantised to the hop.
export function dpBeats(env, fps, per, alpha = DP_ALPHA) {
  const n = env.length;
  let sd = 0, mean = 0;
  for (let i = 0; i < n; i++) mean += env[i];
  mean /= n;
  for (let i = 0; i < n; i++) sd += (env[i] - mean) * (env[i] - mean);
  sd = Math.sqrt(sd / n) || 1;
  const o = new Float64Array(n);
  const w = [0.25, 0.5, 1, 0.5, 0.25], ws = 2.5;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = -2; k <= 2; k++) s += w[k + 2] * env[Math.min(n - 1, Math.max(0, i + k))];
    o[i] = s / ws / sd;
  }
  const P = per * fps, tmin = Math.max(1, Math.round(P * 0.5)), tmax = Math.round(P * 2);
  const F = new Float64Array(tmax - tmin + 1);
  for (let k = 0; k < F.length; k++) { const l = Math.log((tmin + k) / P); F[k] = -alpha * l * l; }
  const C = new Float64Array(n).fill(-1e18), B = new Int32Array(n).fill(-1);
  for (let i = 0; i < Math.min(tmin, n); i++) C[i] = o[i];
  for (let i = tmin; i < n; i++) {
    let bv = -1e18, bj = -1;
    const j0 = Math.max(0, i - tmax);
    for (let j = j0; j <= i - tmin; j++) { const v = C[j] + F[i - j - tmin]; if (v > bv) { bv = v; bj = j; } }
    C[i] = o[i] + bv; B[i] = bj;
  }
  const tail = Math.max(1, Math.round(2 * P));
  let i = n - tail, bv = -1e18;
  for (let k = Math.max(0, n - tail); k < n; k++) if (C[k] > bv) { bv = C[k]; i = k; }
  const out = [];
  while (i >= 0) { out.push(i / fps); i = B[i]; }
  return out.reverse();
}

export const RESEED = 512;           // the phasor recurrence is re-seeded from Math.cos/sin every this many hops
// Sub-hop period + phase: maximise |<env, e^{2 pi i t / p}>|. -> { per, phase, coh }
// The inner sum advances e^{i k i} by one complex multiply per hop instead of a cos and a sin (1600 candidate periods x
// 14 775 hops is 23.6 M transcendental pairs, 274 ms of the 649 ms buildGrid cost; two re-seeds per 1024 hops keep the
// unit-modulus recurrence's drift under 1e-13, five orders under the 1e-5 the grid is rounded to, and the map's JSON
// comes out byte-identical).
export function refitGrid(env, fps, per, span = REFIT_HOPS / fps, step = REFIT_STEP) {
  const n = env.length;
  let sum = 0; for (let i = 0; i < n; i++) sum += env[i];
  if (!(sum > 0)) return { per, phase: 0, coh: 0 };
  let bp = per, bm = -1, ba = 0;
  for (let p = per - span; p < per + span; p += step) {
    let re = 0, im = 0;
    const k = 2 * Math.PI / p / fps;
    const wr = Math.cos(k), wi = Math.sin(k);
    let cr = 1, ci = 0;
    for (let i = 0; i < n; i++) {
      if ((i & (RESEED - 1)) === 0 && i) { const a = k * i; cr = Math.cos(a); ci = Math.sin(a); }
      const e = env[i];
      if (e !== 0) { re += e * cr; im += e * ci; }
      const nr = cr * wr - ci * wi;
      ci = cr * wi + ci * wr; cr = nr;
    }
    const m = Math.sqrt(re * re + im * im) / sum;
    if (m > bm) { bm = m; bp = p; ba = Math.atan2(im, re); }
  }
  let ph = ((-ba / (2 * Math.PI)) * bp) % bp;
  if (ph < 0) ph += bp;
  return { per: bp, phase: ph, coh: bm };
}

// The circular phase estimate is biased by the envelope's SHAPE (flux is a sawtooth, not a symmetric bump). This puts the
// beats on the actual onset peaks instead: scan the phase over one period in PHASE_STEP steps and take the comb sum of the
// envelope at the beat times. Measured on SeeYouDrop: it moves the grid from 54 ms before the truth's bar lines to within
// a frame of them.
export const PHASE_STEP = 0.001;
export function combPhase(env, fps, per, ofs, step = PHASE_STEP) {
  const n = env.length, dur = n / fps;
  let bp = 0, bv = -1;
  for (let ph = 0; ph < per; ph += step) {
    let s = 0;
    for (let t = ph; t < dur - ofs; t += per) {
      const x = (t - ofs) * fps, i = Math.floor(x), f = x - i;
      if (i < 0 || i + 1 >= n) continue;
      s += env[i] + (env[i + 1] - env[i]) * f;
    }
    if (s > bv) { bv = s; bp = ph; }
  }
  return bp;
}

// Which beat index mod 4 is the bar line: the low band is loudest on 1, the mid band on 3. -> { phase, scores }
export function downbeatPhase(beats, elow, emid, fps) {
  const pick = (e, t) => { const i = Math.max(0, Math.min(e.length - 1, Math.round(t * fps))); return Math.max(e[Math.max(0, i - 1)], e[i], e[Math.min(e.length - 1, i + 1)]); };
  const scores = [];
  for (let ph = 0; ph < 4; ph++) {
    let sl = 0, nl = 0, sm = 0, nm = 0;
    for (let i = 0; i < beats.length; i++) {
      if (i % 4 === ph) { sl += pick(elow, beats[i]); nl++; }
      if (i % 4 === (ph + 2) % 4) { sm += pick(emid, beats[i]); nm++; }
    }
    scores.push(sl / Math.max(1, nl) + 0.5 * (sm / Math.max(1, nm)));
  }
  let bi = 0; for (let i = 1; i < 4; i++) if (scores[i] > scores[bi]) bi = i;
  return { phase: bi, scores };
}

// The whole grid. -> { bpm, beat, phase, coh, dpRes, downbeatMod4, downbeatScores, beats, downbeats, bar }
// `ofs` is the audio time of env[0]: a hop's band power covers [i*hop, (i+1)*hop), so its centre is half a hop in.
export function buildGrid(env, elow, emid, fps, dur, ofs = 0.5 / fps) {
  const t0 = tempoPeak(env, fps);
  // The ACF peak's OCTAVE is not reliable: at 48 kHz the same track's drum envelope peaked at 0.80 s (74.85 BPM) where at
  // 44.1 kHz it peaked at 0.40. Refit the peak and its half and double, and keep whichever locks best (coherence weighted
  // by the same log-normal tempo prior), so the octave is decided by how well the comb actually fits.
  let g = null, gs = -1;
  for (const cand of [t0.per, t0.per / 2, t0.per * 2]) {
    if (cand < 0.25 || cand > 1.0) continue;
    const r = refitGrid(env, fps, cand);
    const z = Math.log2(r.per / TEMPO_C) / TEMPO_SIG;
    const sc = r.coh * Math.exp(-0.5 * z * z);
    if (sc > gs) { gs = sc; g = r; }
  }
  if (!g) g = refitGrid(env, fps, t0.per);
  const h = env.length >> 1;
  const a = refitGrid(env.subarray(0, h), fps, g.per, 0.6 / fps);
  const b = refitGrid(env.subarray(h), fps, g.per, 0.6 / fps);
  const drift = Math.abs(a.per - b.per) / g.per;
  let beats = [], per = g.per, phase = combPhase(env, fps, g.per, -ofs);
  const nb = Math.floor((dur - phase) / per) + 1;
  for (let i = 0; i < nb; i++) beats.push(phase + per * i);
  let res = 0;
  const dp = drift > DRIFT_MAX ? dpBeats(env, fps, t0.per) : null;
  if (dp && dp.length > 4) {                   // the tempo really moves: a single linear grid is wrong
    beats = dp.slice();
    const d = []; for (let i = 1; i < beats.length; i++) d.push(beats[i] - beats[i - 1]);
    for (let i = 0; i < beats.length; i++) beats[i] += ofs;
    d.sort((x, y) => x - y); per = d[d.length >> 1]; phase = beats[0];
    let s = 0;
    for (let i = 0; i < dp.length; i++) { const e = dp[i] - (g.phase + g.per * Math.round((dp[i] - g.phase) / g.per)); s += e * e; }
    res = Math.sqrt(s / dp.length);
  }
  const agree = 1 - drift;
  const dbp = downbeatPhase(beats, elow, emid, fps);
  const downbeats = [];
  for (let i = dbp.phase; i < beats.length; i += 4) downbeats.push(beats[i]);
  return { bpm: 60 / per, beat: per, phase, coh: g.coh, dpRes: res, dpAgree: agree, downbeatMod4: dbp.phase,
    downbeatScores: dbp.scores, beats, downbeats, bar: 4 * per };
}
