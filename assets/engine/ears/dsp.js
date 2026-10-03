// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The ears' own DSP primitives. Pure: no DOM, no window, no clock, no Math.random, no imports outside engine/ears.
// `FFT` is copied verbatim from assets/engine/synapse/dsp.js (the brief allows copying a small function rather than
// importing synapse/dsp.js, so the ears stay node-importable on their own); everything else is new.

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
// map v in [a, b] to [0, 1] on a log scale (a, b > 0)
export const logmap = (v, a, b) => clamp01(Math.log(Math.max(v, 1e-12) / a) / Math.log(b / a));

export class FFT {                                        // copied from synapse/dsp.js (see the header)
  constructor(n) {
    this.n = n;
    const bits = Math.log2(n);
    this.rev = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
      this.rev[i] = r;
    }
    this.cs = new Float32Array(n >> 1);
    this.sn = new Float32Array(n >> 1);
    for (let i = 0; i < n >> 1; i++) { this.cs[i] = Math.cos(2 * Math.PI * i / n); this.sn[i] = -Math.sin(2 * Math.PI * i / n); }
    this.re = new Float32Array(n); this.im = new Float32Array(n); this.win = new Float32Array(n);
    let ws = 0;
    for (let i = 0; i < n; i++) { this.win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n); ws += this.win[i]; }
    this.norm = 2 / ws;
  }
  mags(ring, start, mask, out) {
    const n = this.n, re = this.re, im = this.im, rev = this.rev, w = this.win, cs = this.cs, sn = this.sn;
    for (let i = 0; i < n; i++) re[rev[i]] = ring[(start + i) & mask] * w[i];
    im.fill(0);
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0, k = 0; j < half; j++, k += step) {
          const a = i + j, b = a + half, wr = cs[k], wi = sn[k];
          const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
    const h = n >> 1, nm = this.norm;
    for (let i = 0; i < h; i++) out[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) * nm;
  }
}

// One biquad section, RBJ cookbook coefficients. `bp` = constant skirt-gain band-pass, `lp` = low-pass.
export class Biquad {
  constructor(kind, sr, f, q) { this.z1 = 0; this.z2 = 0; this.set(kind, sr, f, q); }
  set(kind, sr, f, q) {
    const w = 2 * Math.PI * Math.min(f, sr * 0.49) / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q);
    let b0, b1, b2;
    const a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
    if (kind === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
    else if (kind === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; }                   // band-pass, peak gain 1
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  step(x) {                                               // transposed direct form II
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

export const BW4 = [0.5412, 1.3066];                 // the section Qs of a 4th-order Butterworth
export const BW6 = [0.5177, 0.7071, 1.9319];         // ... and of a 6th-order one

// A band. `wide` (the default) is a cascade of `n` constant-skirt band-pass sections — cheap, but its skirts are gentle
// when hi/lo is large. `steep` is a 4th-order Butterworth high-pass at `lo` plus a 4th-order low-pass at `hi`: four
// sections instead of two, ~19 dB down half an octave outside the band. Measured need for `steep`: with a wide 22-75 Hz
// band the drop's 70-100 Hz impact leaked in and opened the sub gate 135 ms early.
// `steep6` is the 6th-order version (six sections): 100 Hz is 27 dB down on a 22-60 Hz band, which is what the sub gate needs.
// `power(x)` filters one sample, accumulates its square into `e`, and returns the filtered value.
export class Band {
  constructor(sr, lo, hi, n = 2, kind = 'wide') {
    this.s = [];
    if (kind === 'steep' || kind === 'steep6') {
      const Q = kind === 'steep6' ? BW6 : BW4;
      for (const q of Q) this.s.push(new Biquad('hp', sr, lo, q));
      for (const q of Q) this.s.push(new Biquad('lp', sr, hi, q));
    } else {
      const fc = Math.sqrt(lo * hi), q = fc / Math.max(hi - lo, 1);
      for (let i = 0; i < n; i++) this.s.push(new Biquad('bp', sr, fc, q * (n > 1 ? 0.7 : 1)));
    }
    this.fc = Math.sqrt(lo * hi); this.e = 0;
  }
  power(x) { let y = x; for (let i = 0; i < this.s.length; i++) y = this.s[i].step(y); this.e += y * y; return y; }
  take(n) { const v = this.e / Math.max(n, 1); this.e = 0; return v; }
}

// A running median over the last `n` values (n small and odd): the harmonic (sustained) part of a band's dB envelope.
export class RunMedian {
  constructor(n) { this.n = n; this.buf = new Float32Array(n); this.k = 0; this.f = 0; this.srt = new Float32Array(n); }
  push(v) {
    this.buf[this.k] = v; this.k = (this.k + 1) % this.n; if (this.f < this.n) this.f++;
    const m = this.f, s = this.srt;
    for (let i = 0; i < m; i++) s[i] = this.buf[i];
    for (let i = 1; i < m; i++) { const x = s[i]; let j = i - 1; while (j >= 0 && s[j] > x) { s[j + 1] = s[j]; j--; } s[j + 1] = x; }
    return s[m >> 1];
  }
}

// An exponential quantile tracker: `v` chases the q-th percentile of the stream (Robbins-Monro). Cheap, no history.
// `mode` 'rel' scales the step by |v| (for a positive, multiplicative quantity: an RMS, a ratio); 'abs' does not (for dB).
// The step is per push, so a hop rate fh and a wanted settling time T give step ~ 1/(fh*T) in 'rel' mode.
//
// THE WEIGHTS (DECISIONS §73). Write p = P(x > v). At equilibrium the up-pushes and the down-pushes balance, so
// the two weights FIX p and nothing else does. Up-weight q against down-weight (1 - q) balances at
//     p * q = (1 - p) * (1 - q)   ->   p = 1 - q
// — q of the stream sits BELOW `v`, which is the q-th quantile, the thing the class is named for. From §44 to
// v0.25 the two weights were the other way round ((1 - q) up, q down), which balances at p = q and settles on
// the **(1 - q)** quantile: `Quantile(0.95)` on U(0,10) read 0.508 instead of 9.495 (tools/test_dsp.js records
// the whole table). Every consumer had been calibrated against the number it was actually getting, so the fix
// is the sign here plus a per-consumer decision, all of it in §73.
//
// The weights also set the two SPEEDS, and they are deliberately lopsided: a q near 1 climbs at step*q and
// falls at step*(1 - q), so a p95 follower leaps onto a new loud level and leaks away from it slowly — a peak
// follower, which is what a "loud level" reference should be. A q near 0 is the mirror image, a floor follower.
export class Quantile {
  constructor(q, step, mode = 'rel') { this.q = q; this.step = step; this.abs = mode === 'abs'; this.v = 0; this.n = 0; }
  push(x) {
    if (this.n++ < 16) { this.v = this.v + (x - this.v) / this.n; return this.v; }
    const s = this.abs ? this.step : this.step * (Math.abs(this.v) + 1e-9);
    this.v += x > this.v ? s * this.q : -s * (1 - this.q);
    return this.v;
  }
}

// YIN (de Cheveigne & Kawahara 2002) on a ring: cumulative-mean-normalised difference, threshold, octave check,
// parabolic refinement. Returns { hz, conf } with hz = 0 when nothing is periodic enough.
export class Yin {
  constructor(sr, fmin, fmax, W, thr = 0.15) {
    this.sr = sr; this.W = W; this.thr = thr;
    this.tmin = Math.max(2, Math.floor(sr / fmax)); this.tmax = Math.min(W - 1, Math.ceil(sr / fmin) + 1);
    this.d = new Float32Array(this.tmax + 2); this.cm = new Float32Array(this.tmax + 2);
  }
  // ring[(end - W - tmax + i) & mask] .. ring[(end - 1) & mask] is the window; `end` is one past the newest sample.
  run(ring, end, mask) {
    const W = this.W, tmin = this.tmin, tmax = this.tmax, d = this.d, cm = this.cm;
    const base = (end - W - tmax) & mask;
    let run = 0;
    for (let tau = 1; tau <= tmax; tau++) {
      let s = 0;
      for (let i = 0; i < W; i++) { const a = ring[(base + i) & mask] - ring[(base + i + tau) & mask]; s += a * a; }
      d[tau] = s; run += s; cm[tau] = run > 0 ? s * tau / run : 1;
    }
    cm[0] = 1;
    let ti = -1;
    for (let tau = tmin; tau <= tmax; tau++) if (cm[tau] < this.thr) { ti = tau; break; }
    if (ti < 0) { let best = tmin; for (let tau = tmin; tau <= tmax; tau++) if (cm[tau] < cm[best]) best = tau; ti = best; }
    while (ti + 1 <= tmax && cm[ti + 1] < cm[ti]) ti++;   // walk down to the local minimum
    for (let k = 0; k < 2; k++) {                          // octave check: half the period, nearly as good, wins
      const h = Math.max(1, Math.round(ti / 2));
      let hb = h;
      if (h - 1 >= tmin && cm[h - 1] < cm[hb]) hb = h - 1;
      if (h + 1 <= tmax && cm[h + 1] < cm[hb]) hb = h + 1;
      if (hb >= tmin && cm[hb] < 0.35) ti = hb; else break;
    }
    if (ti < tmin + 1 || ti > tmax - 1) return { hz: 0, conf: 0 };
    const y0 = cm[ti - 1], y1 = cm[ti], y2 = cm[ti + 1], den = y0 - 2 * y1 + y2;
    const tau = ti + (Math.abs(den) > 1e-12 ? 0.5 * (y0 - y2) / den : 0);
    return { hz: this.sr / tau, conf: clamp01(1 - y1) };
  }
}

// The nearest equal-tempered note of a frequency: { note: 0..11 (C = 0), cents: -50..50, midi }.
export function noteOf(hz) {
  if (!(hz > 0)) return { note: -1, cents: 0, midi: 0 };
  const m = 69 + 12 * Math.log2(hz / 440), r = Math.round(m);
  return { note: ((r % 12) + 12) % 12, cents: (m - r) * 100, midi: r };
}
