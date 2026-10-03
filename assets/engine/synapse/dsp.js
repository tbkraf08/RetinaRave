// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Synapse DSP primitives: radix-2 FFT with Hann window, AGC band follower, median-thresholded onset detector, comb/PLL
// tempo tracker with hysteresis and rival-tempo arbitration. Lifted from synapse2.html 131–215 (reformatted only).
export const SPEC_W = 256, WAVE_W = 512, HIST_H = 128;
export const FDIM = 23; // per-beat feature: 12 chroma + 9 log bands + onset density + percussiveness

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (cur, target, dt, tau) => cur + (target - cur) * (1 - Math.exp(-dt / tau));
export const smoothAR = (cur, target, dt, up, down) => smooth(cur, target, dt, target > cur ? up : down);

// Hann-windowed magnitude spectrum straight out of the sample ring.
export class FFT {
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
    for (let i = 0; i < n >> 1; i++) {
      this.cs[i] = Math.cos(2 * Math.PI * i / n);
      this.sn[i] = -Math.sin(2 * Math.PI * i / n);
    }
    this.re = new Float32Array(n);
    this.im = new Float32Array(n);
    this.win = new Float32Array(n);
    let ws = 0;
    for (let i = 0; i < n; i++) {
      this.win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n);
      ws += this.win[i];
    }
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
          re[b] = re[a] - tr;
          im[b] = im[a] - ti;
          re[a] += tr;
          im[a] += ti;
        }
      }
    }
    const h = n >> 1, nm = this.norm;
    for (let i = 0; i < h; i++) out[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) * nm;
  }
}

export class Band {
  constructor(lo, hi, floor) {
    this.lo = lo;
    this.hi = hi;
    this.floor = floor;
    this.pk = floor;
    this.n = 0;
    this.fast = 0;
    this.slow = 0;
  }
  bins(binHz, n) {
    this.a = Math.max(1, Math.floor(this.lo / binHz));
    this.b = Math.min(n - 1, Math.ceil(this.hi / binHz));
  }
  update(mag, dt) {
    let s = 0;
    for (let i = this.a; i <= this.b; i++) s += mag[i] * mag[i];
    const raw = Math.sqrt(s / (this.b - this.a + 1));
    this.pk = Math.max(raw, this.floor, this.pk * Math.exp(-dt / 14)); // AGC: running peak, slow release
    this.n = Math.pow(clamp01(raw / (this.pk * 0.92)), 0.8);
    this.fast = smoothAR(this.fast, this.n, dt, 0.008, 0.14);
    this.slow = smooth(this.slow, this.n, dt, 0.5);
  }
}

// Onset = local peak of band-limited spectral flux over a MEDIAN-based threshold (a steady kick train cannot inflate
// a median). Peaks are confirmed one hop late (~10 ms) so the flux maximum itself is known.
export class Onset {
  constructor(lo, hi, refractory, k) {
    this.lo = lo;
    this.hi = hi;
    this.ref = refractory;
    this.k = k;
    this.h = new Float32Array(96);
    this.s = new Float32Array(96);
    this.i = 0;
    this.last = -9;
    this.flux = 0;
    this.p1 = 0;
    this.p2 = 0;
    this.med = 0;
    this.mean = 0;
    this.c = 0;
  }
  bins(binHz, n) {
    this.a = Math.max(1, Math.floor(this.lo / binHz));
    this.b = Math.min(n - 1, Math.ceil(this.hi / binHz));
  }
  update(lg, prev, now) {
    let f = 0;
    for (let i = this.a; i <= this.b; i++) {
      const d = lg[i] - prev[i];
      if (d > 0) f += d;
    }
    f /= (this.b - this.a + 1);
    this.flux = f;
    if ((this.c++ & 3) === 0) {
      this.s.set(this.h);
      this.s.sort();
      this.med = this.s[48];
      let m = 0;
      for (let i = 0; i < 96; i++) m += this.h[i];
      this.mean = m / 96;
    }
    this.h[this.i] = f;
    this.i = (this.i + 1) % 96;
    const th = this.med * this.k + this.mean * 0.6 + 0.008, c = this.p1;
    let out = 0;
    if (c > th && c >= this.p2 && c > f && now - this.last > this.ref) {
      this.last = now;
      out = clamp(0.25 + (c - th) / (th + 0.01) * 0.35, 0.25, 1);
    }
    this.p2 = this.p1;
    this.p1 = f;
    return out;
  }
}

// Tempo: autocorrelation of the onset envelope at hop rate, then a comb phase search; a free-running beat clock is
// steered to both. Hysteresis: the clock keeps its tempo (refined locally) unless a rival clearly and persistently
// out-scores it — breakdowns hallucinate tempi, and syncopated styles score 1/2x, 2/3x, 2x almost as well as the truth.
export class Tempo {
  constructor(fr) {
    this.fr = fr;
    this.N = 1024;
    this.env = new Float32Array(this.N);
    this.w = 0;
    this.c = 0;
    this.period = 0.469;
    this.conf = 0;
    this.phConf = 0;
    this.beat = 0;
    this.ac = new Float32Array(360);
    this.x = new Float32Array(this.N);
    this.jump = false;
    this.peaky = 0;
  }
  push(v) {
    this.env[this.w] = v;
    this.w = (this.w + 1) % this.N;
    this.c++;
    this.beat += 1 / (this.fr * this.period);
    if (this.c % 47 === 0) this.estimate();
    if (this.c % 12 === 6) this.phase();
  }
  acAt(l) {
    const i = Math.floor(l), f = l - i;
    return i + 1 < 360 ? this.ac[i] * (1 - f) + this.ac[i + 1] * f : 0;
  }
  estimate() {
    const N = this.N, x = this.x, len = 660;
    let mean = 0;
    for (let i = 0; i < N; i++) {
      x[i] = this.env[(this.w - 1 - i + N * 2) % N]; // x[0] = newest
      mean += x[i];
    }
    mean /= N;
    if (mean < 2e-4 || this.c < 300) {
      this.conf *= 0.8;
      return;
    }
    { // spiky onset envelope = percussive; flat = sustained
      let mx = 0, m4 = 0;
      for (let i = 0; i < 400; i++) {
        m4 += x[i];
        if (x[i] > mx) mx = x[i];
      }
      this.peaky = lerp(this.peaky, mx > 1e-5 ? clamp01(1.15 - 4.5 * (m4 / 400) / mx) : 0, 0.2);
    }
    for (let i = 0; i < N; i++) x[i] -= mean;
    let a0 = 0;
    for (let i = 0; i < len; i++) a0 += x[i] * x[i];
    for (let l = 10; l < 360; l++) {
      let s = 0;
      for (let i = 0; i < len; i++) s += x[i] * x[i + l];
      this.ac[l] = Math.max(0, s / (a0 + 1e-9));
    }
    const lo = 60 * this.fr / 190, hi = 60 * this.fr / 68, cl = this.period * this.fr;
    let best = 0, bl = 0, sum = 0, cnt = 0, cur = 0, curL = cl;
    for (let l = lo; l <= hi; l += 0.25) {
      let s = this.acAt(l) + 0.6 * this.acAt(l * 2) + 0.3 * this.acAt(l * 4) + 0.3 * this.acAt(l * 0.5);
      const pr = Math.exp(-0.5 * Math.pow(Math.log2(60 * this.fr / l / 128) / 0.6, 2));
      s *= 0.55 + 0.45 * pr;
      sum += s;
      cnt++;
      if (s > best) {
        best = s;
        bl = l;
      }
      if (Math.abs(l - cl) / cl < 0.04 && s > cur) {
        cur = s;
        curL = l;
      }
    }
    if (!bl) return;
    const mS = sum / cnt + 1e-9, locked = this.conf >= 0.03;
    let conf = clamp01(((locked ? cur : best) / mS - 1.3) / 1.4);
    this.jump = false;
    if (!locked) {
      this.period = bl / this.fr;
      conf = clamp01((best / mS - 1.3) / 1.4);
    } else {
      if (cur > 0 && conf > 0.25) this.period = lerp(this.period, curL / this.fr, 0.3);
      if (Math.abs(bl - cl) / cl >= 0.04 && best > cur * 1.35 && best / mS > 1.9) {
        if (this.cand && Math.abs(bl - this.cand) / bl < 0.03) this.candN++;
        else {
          this.cand = bl;
          this.candN = 1;
        }
        if (this.candN >= 6) {
          this.jump = true;
          this.period = bl / this.fr;
          this.candN = 0;
        }
      } else this.candN = 0;
    }
    this.conf = Math.max(0.031 * (locked ? 1 : 0), lerp(this.conf, conf, 0.5));
  }
  phase() {
    if (this.c < 300) return;
    const N = this.N, P = this.period * this.fr, K = Math.min(14, Math.floor(700 / P));
    let best = -1, bo = 0, sum = 0;
    const n = Math.ceil(P);
    for (let o = 0; o < n; o++) {
      let s = 0;
      for (let k = 0; k < K; k++) {
        const j = o + k * P, i = Math.floor(j), f = j - i, a = (this.w - 1 - i + N * 4) % N, b = (a - 1 + N) % N;
        s += (this.env[a] * (1 - f) + this.env[b] * f) * (1 - k / (K * 1.5));
      }
      sum += s;
      if (s > best) {
        best = s;
        bo = o;
      }
    }
    const c = clamp01((best / (sum / n + 1e-9) - 1.5) / 3);
    this.phConf = lerp(this.phConf, c, 0.2);
    let e = (this.beat - Math.floor(this.beat)) - bo / P;
    e -= Math.round(e);
    this.beat -= e * 0.22 * c;
  }
}
