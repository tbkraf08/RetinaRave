// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Slow stages of the v3 extractor: harmony/tension from the long window, section fingerprint identification.
// Lifted from cardioid3 slowAnalysis / identifySection (tempoEstimate moved to tempo.js and was rewritten in v0.2 §9).
import { TAU, clamp, ema, mix, wrap1 } from '../math/util.js';
import { AU } from './audio.js';
import { MS, XS } from './state.js';
import { ROUGHK, RoughNorm } from './roughnorm.js';

export { ROUGHK };               // &rough=0 (core/harness.js): the pre-§81 follower pair, the A/B
const RN = new RoughNorm(ROUGHK);  // the windowed p10 / p98 of `rough` over the last 30 s (DECISIONS §81)

const A2M = 0.1151292546; // ln(10)/20: dB -> linear magnitude

export function slowAnalysis(dt, now) {
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
  // §81: `rLo` / `rHi` are the p10 / p98 of `rough` over the last 30 s (roughnorm.js; `&rough=0` = the follower pair
  // v0.28 had: rLo creeping up 0.002/step, rHi leaping onto any maximum and leaking back at 0.002/step, floor rLo + 0.03).
  // Both run only while there is music (presence > 0.3): silence is not a roughness.
  if (S.presence > 0.3) {
    if (ROUGHK.win) { RN.push(r, now); S.rLo = RN.lo; S.rHi = RN.hi; }
    else {
      S.rLo = Math.min(S.rLo + (r - S.rLo) * 0.002 + 1e-5, r);
      S.rHi = Math.max(S.rHi - (S.rHi - r) * 0.002, r, S.rLo + 0.03);
    }
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
