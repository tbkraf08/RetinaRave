// Slow stages of the v3 extractor: tempo (autocorrelation + comb PLL), harmony/tension from the long window,
// section fingerprint identification. Lifted from cardioid3 tempoEstimate / slowAnalysis / identifySection.
import { TAU, clamp, ema, frac, mix, sstep, wrap1 } from '../math/util.js';
import { AU } from './audio.js';
import { MS, XS } from './state.js';

export function tempoEstimate() {
  const S = MS, X = XS, x = X.tmp;
  let mean = 0;
  for (let i = 0; i < 800; i++) {
    x[i] = X.env[(X.ei + i) % 800];
    mean += x[i];
  }
  mean /= 800;
  let a0 = 0;
  for (let i = 0; i < 800; i++) {
    x[i] -= mean;
    a0 += x[i] * x[i];
  }
  if (a0 < 1e-6) {
    S.regularity = ema(S.regularity, 0, 0.5, 1);
    return;
  }
  a0 /= 800;
  const acf = X._acf || (X._acf = new Float32Array(104));
  let best = 0, bL = 50;
  for (let L = 30; L <= 102; L++) {
    let a = 0;
    for (let t = L; t < 800; t++) a += x[t] * x[t - L];
    a /= (800 - L) * a0;
    acf[L] = a;
  }
  for (let L = 31; L <= 101; L++) {
    const bpm = 6000 / L, w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 124) / 0.55, 2)), v = acf[L] * w;
    if (v > best && acf[L] >= acf[L - 1] && acf[L] >= acf[L + 1]) {
      best = v;
      bL = L;
    }
  }
  const y0 = acf[bL - 1], y1 = acf[bL], y2 = acf[bL + 1], den = y0 - 2 * y1 + y2;
  const Lf = bL + (Math.abs(den) > 1e-9 ? 0.5 * (y0 - y2) / den : 0), bpm = 6000 / Lf;
  S.regularity = ema(S.regularity, clamp(y1 * 1.6, 0, 1) * sstep(0.05, 0.3, S.presence), 0.5, 1.2);
  if (y1 > 0.08) {
    if (Math.abs(bpm - S.bpm) / S.bpm < 0.06) S.bpm += (bpm - S.bpm) * 0.3;
    else {
      if (Math.abs(bpm - X.candBpm) / bpm < 0.05) X.candN++;
      else {
        X.candBpm = bpm;
        X.candN = 1;
      }
      if (X.candN >= 3) {
        S.bpm = bpm;
        X.candN = 0;
      }
    }
    const Lc = 6000 / S.bpm;
    let bs = -1e9, bphi = 0;
    for (let phi = 0; phi < Math.floor(Lc); phi++) {
      let sc = 0;
      for (let k = 0; k < 8; k++) {
        const idx = 799 - phi - Math.round(k * Lc);
        if (idx < 0) break;
        sc += x[idx];
      }
      if (sc > bs) {
        bs = sc;
        bphi = phi;
      }
    }
    const tgt = frac((bphi + X.envAcc) / Lc + 0.03);
    S.phaseCorr += wrap1(tgt - S.beatPhase - S.phaseCorr) * 0.35 * clamp(y1 * 3, 0, 1);
  }
}

const A2M = 0.1151292546; // ln(10)/20: dB -> linear magnitude

export function slowAnalysis(dt) {
  const S = MS, X = XS, d = X.sdb;
  AU.slow.getFloatFrequencyData(d);
  const ch = X._ch || (X._ch = new Float32Array(12)), bc = X._bc || (X._bc = new Float32Array(12));
  ch.fill(0);
  bc.fill(0);
  const P = [];
  let prev = 0, cur = d[X.bLo - 1] > -160 ? Math.exp(d[X.bLo - 1] * A2M) : 0, mx = 1e-9;
  for (let b = X.bLo; b < X.bHiT; b++) {
    const nx = d[b + 1] > -160 ? Math.exp(d[b + 1] * A2M) : 0;
    prev = cur;
    cur = d[b] > -160 ? Math.exp(d[b] * A2M) : 0;
    const pv = d[b - 1] > -160 ? Math.exp(d[b - 1] * A2M) : 0;
    if (cur > pv && cur >= nx) {
      if (cur > mx) mx = cur;
      if (b < X.bHiC) {
        ch[X.pcOf[b]] += cur;
        if (b < X.bLowC) bc[X.pcOf[b]] += cur;
      }
      const den = pv - 2 * cur + nx, off = Math.abs(den) > 1e-12 ? 0.5 * (pv - nx) / den : 0;
      P.push([(b + off) * X.binS, cur]);
    }
  }
  let sum = 0, bs = 0;
  for (let i = 0; i < 12; i++) {
    sum += ch[i];
    bs += bc[i];
  }
  if (sum > 1e-7) {
    for (let i = 0; i < 12; i++) {
      S.chroma[i] = ema(S.chroma[i], ch[i] / sum, dt, 0.25);
      S.bchroma[i] = ema(S.bchroma[i], bs > 1e-8 ? bc[i] / bs : ch[i] / sum, dt, 0.35);
    }
  }
  // harmonic angle on the circle of fifths
  let hx = 0, hy = 0, cs = 0;
  for (let pc = 0; pc < 12; pc++) {
    const a = TAU * ((pc * 7) % 12) / 12, w = S.chroma[pc];
    hx += w * Math.cos(a);
    hy += w * Math.sin(a);
    cs += w;
  }
  if (cs > 1e-6) {
    hx /= cs;
    hy /= cs;
  }
  S.hx = ema(S.hx, hx, dt, 0.7);
  S.hy = ema(S.hy, hy, dt, 0.7);
  S.clarity = clamp(Math.hypot(S.hx, S.hy) * 2.2, 0, 1) * S.presence;
  const ang = Math.atan2(S.hy, S.hx), da = wrap1((ang - S.harmAngle) / TAU) * TAU;
  S.harmAngle = ang;
  if (S.clarity > 0.05) {
    S.harmUnw += da;
    S.harmVel = ema(S.harmVel, Math.abs(da) / dt, dt, 0.8);
  } else S.harmVel = ema(S.harmVel, 0, dt, 0.8);
  // interval above the bass -> which bulb
  let root = 0, rv = -1;
  for (let i = 0; i < 12; i++) if (S.bchroma[i] > rv) { rv = S.bchroma[i]; root = i; }
  let oth = root, ov = -1;
  for (let i = 0; i < 12; i++) if (i !== root && S.chroma[i] > ov) { ov = S.chroma[i]; oth = i; }
  const iv = ov < 0.45 * S.chroma[root] ? 0 : (oth - root + 12) % 12;
  if (iv === S.intervalCand) S.intervalT += dt;
  else {
    S.intervalCand = iv;
    S.intervalT = 0;
  }
  if (S.intervalT > 0.45 && S.presence > 0.2) S.interval = iv;
  // Sethares roughness over the strongest partials
  P.sort((a, b) => b[1] - a[1]);
  const n = Math.min(12, P.length);
  let R = 0, W = 0;
  S.peaks = P.slice(0, 4);
  for (let i = 0; i < n; i++) {
    if (P[i][1] < 0.04 * mx) break;
    for (let j = i + 1; j < n; j++) {
      if (P[j][1] < 0.04 * mx) break;
      const f1 = Math.min(P[i][0], P[j][0]), df = Math.abs(P[i][0] - P[j][0]);
      const sx = 0.24 / (0.0207 * f1 + 18.96) * df, a = Math.min(P[i][1], P[j][1]);
      R += a * (Math.exp(-3.51 * sx) - Math.exp(-5.75 * sx));
      W += a;
    }
  }
  const r = W > 0 ? R / W : 0;
  S.rough = r;
  if (S.presence > 0.3) {
    S.rLo = Math.min(S.rLo + (r - S.rLo) * 0.002 + 1e-5, r);
    S.rHi = Math.max(S.rHi - (S.rHi - r) * 0.002, r, S.rLo + 0.03);
  }
  S.tension = ema(S.tension, clamp((r - S.rLo) / (S.rHi - S.rLo), 0, 1) * S.presence, dt, 0.35);
}

export function identifySection() {
  const S = MS, X = XS, fp = X.fp;
  let best = -1, bs = 0, n = 0;
  for (let i = 0; i < 17; i++) n += fp[i] * fp[i];
  n = Math.sqrt(n) + 1e-9;
  X.lib.forEach((e, k) => {
    let d = 0, m = 0;
    for (let i = 0; i < 17; i++) {
      d += e.fp[i] * fp[i];
      m += e.fp[i] * e.fp[i];
    }
    const c = d / (n * Math.sqrt(m) + 1e-9);
    if (c > bs) {
      bs = c;
      best = k;
    }
  });
  if (best >= 0 && bs > 0.965 && X.lib[best].id !== S.sectionId) {
    const e = X.lib[best];
    for (let i = 0; i < 17; i++) e.fp[i] = mix(e.fp[i], fp[i], 0.3);
    S.sectionId = e.id;
    S.seed = e.seed;
    S.repeat = true;
  } else if (!(best >= 0 && bs > 0.965)) {
    const id = X.lib.length ? Math.max(...X.lib.map((e) => e.id)) + 1 : 1;
    const seed = { hue: Math.random(), th: Math.random() - 0.5, a: Math.random(), scene: -1 };
    X.lib.push({ id, fp: Float32Array.from(fp), seed });
    if (X.lib.length > 14) X.lib.shift();
    S.sectionId = id;
    S.seed = seed;
    S.repeat = false;
  }
}
