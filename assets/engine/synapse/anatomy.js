// Analyzer mixin: DROP ANATOMY (five kinds of evidence, a phrase-snapped expected line, detonate-or-resolve) and the
// LONG FRAME (chroma → Krumhansl–Kessler key/mode, texture axes, the slow mood plane). Lifted from synapse2.html 338–410.
import { clamp, clamp01, smooth, smoothAR } from './dsp.js';

const KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export function anatomy(dt, now, age, kicked, B) {
  const A = this.A, T = this.tempo, beat = T.beat, ev = this.ev, H = this.hist;
  // (1) roll acceleration: kick/snare onsets per beat, in octaves (1/4 -> 0, 1/8 -> 1, 1/16 -> 2 ...), must RISE and keep rising
  while (this.onsets.length && now - this.onsets[0].t > 6) this.onsets.shift();
  // (2) riser / (3) high-pass sweep: regression slope + monotonicity of centroid, roll-off and the low spectral edge over ~4 s
  const reg = (arr, from, n) => {
    let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const y = arr[(H.i - from - n + 1 + i + 128) & 63];
      sx += i; sy += y; sxy += i * y; sxx += i * i; syy += y * y;
    }
    const cov = n * sxy - sx * sy, vx = n * sxx - sx * sx, vy = n * syy - sy * sy;
    return [cov / vx / (8 * dt), vy > 1e-9 ? cov * cov / (vx * vy) : 0];
  };
  // a riser climbs the WHOLE time: both halves of the window must slope up and the whole must be near-linear
  const trend = (arr) => {
    const a = reg(arr, 22, 22), b = reg(arr, 0, 22), w = reg(arr, 0, 44);
    return clamp01(Math.min(a[0], b[0], w[0]) / 0.011) * clamp01((w[1] - 0.55) / 0.3);
  };
  if ((this.hops & 7) === 1) {
    ev.riser = Math.max(trend(H.cen), trend(H.roll));
    const pulled = clamp01(1 - this.bShort / (this.bLong * 0.55 + 0.02)) * (A.eShort > 0.25 ? 1 : 0);
    ev.hp = Math.max(pulled * 0.8, trend(H.edge) * (0.5 + 0.5 * pulled));
    ev.swell = Math.max(clamp01((A.eShort / (A.eMed + 0.02) - 1.04) * 5), trend(H.lvl) * 0.7);
    const r = this.rollHist, rise = r[0] - Math.min(r[4], r[6], r[8]);
    let mono = 0;
    for (let i = 0; i < 8; i++) if (r[i] >= r[i + 1] - 0.3) mono++;
    ev.roll = clamp01((rise - 0.45) / 0.6) * clamp01((mono - 5) / 2) * (r[0] > 2.3 ? 1 : 0.3); // r = log2(onsets/s), every 0.5 s
  }
  const hushNow = A.tension > 0.35 && A.eFast < 0.32 * A.eShort && A.alive > 0.5;
  ev.gap = hushNow ? 1 : 0;
  if (hushNow) this.lastHush = now;
  A.hush = smoothAR(A.hush, hushNow ? 1 : 0, dt, 0.04, 0.12);
  const ctx = clamp01(Math.max(A.gridTrust * 1.5 - 0.3, ev.roll)); // swells in beatless music are not builds
  const all = (0.4 + 0.6 * ctx) * (1 - (1 - 0.7 * ev.roll) * (1 - 0.65 * ev.riser) * (1 - 0.5 * ev.hp) * (1 - 0.4 * ev.swell)) * A.alive * (age > 6 ? 1 : 0);
  ev.all = all;
  this.evS = smooth(this.evS, all, dt, 0.8);
  if (all > 0.3) A.tension = Math.min(1, A.tension + all * dt / 5);
  else if (!hushNow) A.tension = Math.max(0, A.tension - dt / (A.resolve > 0.05 ? 1.6 : 5));
  if (A.tension > 0.15) { if (this.tenseSince < 0) this.tenseSince = beat; } else this.tenseSince = -1;
  // expected line: next 16-beat phrase line (the one after, if the build has only just begun and nothing terminal is heard yet)
  const gridOK = A.gridTrust > 0.4 && A.phraseConf > 0.3;
  const terminal = clamp01(Math.max(ev.gap, this.rollHist[0] - 2.6, (A.tension - 0.6) * 2.5));
  if (gridOK && A.tension > 0.3 && now > this.noArmUntil) {
    let to = 16 - ((((beat - this.o16) % 16) + 16) % 16);
    if (!this.exp || this.exp.line - beat > 2.5 || this.exp.line - beat < -2) {
      let line = beat + to;
      if (to < 5 && terminal < 0.3 && A.tension < 0.5) line += 16;
      this.exp = { line, hadEv: 0 };
    }
  } else if (this.exp && (A.tension < 0.2 || !gridOK) && beat < this.exp.line - 0.5) this.exp = null;
  A.dropExpectedIn = this.exp ? Math.max(0, this.exp.line - beat) : -1;
  A.dropConf = smooth(A.dropConf, this.exp ? clamp01(A.tension * (0.45 + 0.55 * terminal) * Math.sqrt(Math.min(A.gridTrust, A.phraseConf) * 1.4)) : 0, dt, 0.25);
  const hushed = now - this.lastHush < 1.6, absent = this.kickGap > 1.2 || hushed;
  const slam = kicked > 0.25 && Math.max(B.bass.n, B.bass.fast) > 0.45 && absent, okAge = now - this.lastDrop > 6 && age > 8;
  let fire = 0;
  // reactive rule (always live — a wrong grid must never veto a real drop): bass slams back after an absence
  let rk = 0;
  if (slam) for (const o of this.onsets) if (o.k && now - o.t < 4) rk++; // a drop ends a stretch WITHOUT a steady kick
  if (slam && (rk <= 4 || hushed) && kicked > 0.3 && B.bass.n > 0.6 && this.bLag < 0.34 && this.bShort < 0.6 && okAge &&
    (A.tension > 0.3 || hushed || (A.calm > 0.45 && A.beatConf > 0.3))) {
    fire = clamp01(0.35 + A.tension * 0.6 + (hushed ? 0.3 : 0) + A.calm * 0.2);
  }
  if (this.exp && beat > this.exp.line - 0.35) { // the window on the expected line: a plain slam is enough
    if (slam && okAge && this.bLag < 0.5) fire = Math.max(fire, clamp01(0.55 + 0.45 * A.tension + (hushed ? 0.2 : 0)));
    else if (!fire && beat > this.exp.line + 0.8) {
      if (this.evS > 0.3 && !hushed) this.exp = null; // the build simply carries on: re-arm for the next line
      else {
        if (A.tension > 0.4) {
          A.events.push({ type: 'fakeout', s: A.tension });
          A.fakeouts++;
          A.resolve = Math.max(A.resolve, A.tension);
          A.tension *= 0.5;
          this.addGrid(Math.round(beat - 0.8), 1.5);
        }
        this.exp = null;
        this.noArmUntil = now + 2;
      }
    }
  }
  if (fire) {
    this.lastDrop = now;
    A.drop = fire; A.dropHold = fire; A.dropAge = 0; A.tension = 0; A.kick = 1; A.drops++;
    this.exp = null;
    this.noArmUntil = now + 4;
    const b = Math.round(beat);
    this.addGrid(b, 4);
    A.events.push({ type: 'drop', s: fire, predicted: A.dropConf });
    this.boundary(b, now, true);
  }
}

// LONG FRAME (~85 ms): chroma from the 8192 window -> key / mode, then the slow mood state.
export function longFrame(dt, W, age) {
  const A = this.A, m = this.m3, end = (this.w - this.pending + this.RN * 8) & this.mask;
  this.f3.mags(this.ring, end - 8192, this.mask, m);
  const ch = this.chroma;
  ch.fill(0);
  const lo = Math.ceil(65 / this.b3), hi = Math.floor(2100 / this.b3);
  let sum = 0;
  for (let i = lo; i < hi; i++) {
    const v = m[i];
    if (v > m[i - 1] && v >= m[i + 1] && v > 2e-5) {
      const pc = ((Math.round(12 * Math.log2(i * this.b3 / 440) + 69) % 12) + 12) % 12, w = Math.sqrt(v);
      ch[pc] += w;
      sum += w;
    }
  }
  if (sum > 1e-4) {
    for (let i = 0; i < 12; i++) {
      ch[i] /= sum;
      this.chromaS[i] = smooth(this.chromaS[i], ch[i], dt, 1.2);
      this.chromaL[i] = smooth(this.chromaL[i], ch[i], dt, W(12));
      this.acc[i] += ch[i];
    }
    this.accC++;
  }
  for (let i = 0; i < 12; i++) A.chroma[i] = this.chromaS[i];
  // Krumhansl-Kessler key finding on the long chroma, with hysteresis
  const c = this.chromaL;
  let cm = 0;
  for (let i = 0; i < 12; i++) cm += c[i];
  cm /= 12;
  let cv = 0;
  for (let i = 0; i < 12; i++) cv += (c[i] - cm) * (c[i] - cm);
  if (cv > 1e-8) {
    let best = -2, bk = 0, bm = 0, bMaj = -2, bMin = -2, curR = -2;
    for (let md = 0; md < 2; md++) {
      const P = md ? KK_MIN : KK_MAJ;
      let pm = 0;
      for (let i = 0; i < 12; i++) pm += P[i];
      pm /= 12;
      let pv = 0;
      for (let i = 0; i < 12; i++) pv += (P[i] - pm) * (P[i] - pm);
      for (let k = 0; k < 12; k++) {
        let d = 0;
        for (let i = 0; i < 12; i++) d += (c[(i + k) % 12] - cm) * (P[i] - pm);
        const r = d / Math.sqrt(cv * pv);
        if (r > best) { best = r; bk = k; bm = md; }
        if (md ? r > bMin : r > bMaj) { if (md) bMin = r; else bMaj = r; }
        if (k === this.key && md === this.mode) curR = r;
      }
    }
    if ((bk !== this.key || bm !== this.mode) && best > curR + 0.06) {
      this.keyHold += dt;
      if (this.keyHold > 2.5 || age < 8) { this.key = bk; this.mode = bm; this.keyHold = 0; }
    } else this.keyHold = 0;
    this.keyClar = smooth(this.keyClar, clamp01((best - 0.35) / 0.45), dt, 2);
    this.modeVal = smooth(this.modeVal, clamp((bMaj - bMin) * 5, -1, 1) * this.keyClar, dt, W(6));
  }
  A.key = this.key; A.mode = this.mode; A.keyClar = this.keyClar;
  // texture axes
  A.dirty = clamp01((this.flat - 0.1) / 0.5); A.punchy = clamp01((this.crestDb - 8) / 12); A.perc = this.tempo.peaky; A.harm = this.harm;
  const densN = clamp01((this.densSlow - 5) / 10), tempoN = clamp01((A.bpm - 80) / 100) * A.beatConf;
  const aro = clamp01(0.3 * densN + 0.3 * A.perc + 0.2 * tempoN + 0.3 * this.cSlow);
  const val = clamp01(0.5 + 0.34 * this.modeVal + 0.25 * (this.cSlow - 0.45) - 0.14 * A.dirty + 0.06 * (A.punchy - 0.5));
  if (A.alive > 0.5) { this.aro = smooth(this.aro, aro, dt, W(10)); this.val = smooth(this.val, val, dt, W(10)); }
  A.arousal = this.aro; A.valence = this.val;
  // a mood SHIFT is an event: the slow state must leave its anchor and stay away (hysteresis)
  const dv = this.val - this.anchor.v, da = this.aro - this.anchor.a, dist = Math.sqrt(dv * dv + da * da);
  if (!this.moodInit) {
    if (age > 9) { this.moodInit = true; this.anchor = { v: this.val, a: this.aro }; this.setFamily(); A.events.push({ type: 'mood', family: A.family, first: true }); }
  } else if (dist > 0.13) {
    this.moodOff += dt;
    if (this.moodOff > 2.5) {
      this.anchor = { v: this.val, a: this.aro };
      this.moodOff = 0;
      const f = A.family;
      this.setFamily();
      A.moodShifts++;
      A.events.push({ type: 'mood', family: A.family, changed: f !== A.family });
    }
  } else this.moodOff = 0;
}

export function setFamily() {
  const A = this.A, a = this.anchor, hiA = A.family >= 2, hiV = (A.family & 1) === 1;
  const na = a.a > (hiA ? 0.4 : 0.5), nv = a.v > (hiV ? 0.45 : 0.55);
  A.family = (na ? 2 : 0) + (nv ? 1 : 0);
}
