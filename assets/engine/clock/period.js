// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The PERIOD estimator of the PCM beat clock (live step 6, docs/AUDIT-live-grid.md "Step 6"): tempo.js's harmonic-comb ACF
// (DECISIONS §9, §21) as a pure object over its own 100 Hz onset ring, so the same math that reads ±1 BPM on every demo style
// runs on the sample-timed onset stream instead of the frame-rate one. The math is tempo.js's steps 1–6 to the letter
// (high-pass + loudness normalisation + recency taper; ACF lags 8..410; comb l + .6·2l + .3·4l under the 130-centred
// log-normal prior on a 0.25-lag grid; the harmonics' parabolic vertices; the contrast / y1 evidence gates; the 6 % track,
// the 25 % margin, the metrical-relative votes; the 2.5 s 3:2 arbitration) — only the state lives here instead of MS / XS,
// so v3's estimator is untouched (its trace stays byte-identical; the additive proof in the audit).
// What is NOT here: the comb-aligned PLL target and phaseCorr — the PCM clock's phase is the Kalman filter's (clock.js),
// fed by the onsets themselves; `line()` gives the comb's own 8-beat alignment as one more measurement for it.
//   ring(t, o)      write the onset strength o into the 100 Hz slot of audio time t (zero-order hold over skipped slots)
//   estimate()      run the comb on the ring; -> this.bpm / this.y1 / this.contrast / this.clear / this.dbg
//   line(bps)       the comb-aligned beat line nearest the ring's newest slot, in audio time (or NaN)
import { clamp } from '../../math/util.js';

export const N = 800, LMIN = 30, LMAX = 102, AMIN = 8, AMAX = 410;   // tempo.js: 8 s at 100 Hz, 200..59 BPM, ACF lags
export const RATE = 100;                                              // the ring's rate (slots / s)
const REL = [0.5, 2, 0.25, 4, 1 / 3, 3, 2 / 3, 1.5];

function vertex(acf, L0, span) {
  let L = L0;
  for (let i = 0; i < span; i++) {
    if (acf[L + 1] > acf[L]) L++;
    else if (acf[L - 1] > acf[L]) L--;
    else break;
  }
  const y0 = acf[L - 1], y1 = acf[L], y2 = acf[L + 1], den = y0 - 2 * y1 + y2;
  return [L + (den < -1e-9 ? 0.5 * (y0 - y2) / den : 0), y1];
}

export class Period {
  constructor(bpm0 = 124) {
    this.env = new Float32Array(N); this.ei = 0;   // the ring: env[ei] is the OLDEST slot (tempo.js's convention)
    this.slot = -1;                                // the 100 Hz slot index of the newest written sample
    this.tNew = NaN;                               // the audio time of the newest slot's END
    this.x = new Float32Array(N); this.acf = new Float32Array(AMAX + 2);
    this.bpm = bpm0; this.y1 = 0; this.contrast = 0; this.clear = false; this.h1 = 0;
    this.candBpm = 0; this.candN = 0; this.tempoAge = 99; this.relN = 0; this.relQ = 0;
    this.n = 0;                                    // samples written since the start
    this.switched = false;                         // the last estimate() changed the tempo by more than the 6 % track
    this.dbg = null;
  }
  ring(t, o) {
    const s = Math.floor(t * RATE);
    if (this.slot < 0) { this.slot = s - 1; this.tNew = t; }
    const skip = s - this.slot;
    if (skip <= 0) { const i = (this.ei + N - 1) % N; if (o > this.env[i]) this.env[i] = o; return; }   // the same slot: keep the max
    const hold = skip > 1 ? this.env[(this.ei + N - 1) % N] : o;
    for (let k = 1; k < skip; k++) { this.env[this.ei] = hold; this.ei = (this.ei + 1) % N; this.n++; }
    this.env[this.ei] = o; this.ei = (this.ei + 1) % N; this.n++;
    this.slot = s; this.tNew = (s + 1) / RATE;
  }
  reset(bpm0) {
    this.env.fill(0); this.ei = 0; this.slot = -1; this.tNew = NaN; this.n = 0;
    if (bpm0) this.bpm = bpm0;
    this.y1 = 0; this.contrast = 0; this.clear = false; this.candBpm = 0; this.candN = 0; this.tempoAge = 99; this.relN = 0; this.relQ = 0;
  }
  // tempo.js tempoEstimate() steps 1–6 on this ring; returns true when the ring carried enough signal to estimate
  estimate() {
    const X = this, x = X.x, acf = X.acf, env = X.env;
    X.switched = false;
    let m = env[X.ei], raw = 0, pw = 0;
    for (let i = 0; i < N; i++) {
      const v = env[(X.ei + i) % N];
      m += (v - m) * 0.01;
      x[i] = v - m;
      raw += x[i] * x[i];
    }
    if (raw / N < 1e-6) { X.clear = false; X.y1 = 0; X.contrast = 0; return false; }
    let a0 = 0;
    pw = raw / N;
    for (let i = 0; i < N; i++) {
      pw += (x[i] * x[i] - pw) * 0.005;
      x[i] = x[i] / Math.sqrt(pw + 1e-4) * (0.5 + i / (2 * N));
      a0 += x[i] * x[i];
    }
    a0 /= N;
    for (let L = AMIN; L <= AMAX + 1; L++) {
      let a = 0;
      for (let t = L; t < N; t++) a += x[t] * x[t - L];
      acf[L] = a / ((N - L) * a0);
    }
    const at = (l) => {
      const i = Math.floor(l), f = l - i;
      return i >= AMIN && i <= AMAX ? acf[i] * (1 - f) + acf[i + 1] * f : 0;
    };
    const comb = (l) => at(l) + 0.6 * at(2 * l) + 0.3 * at(4 * l);
    const prior = (l) => Math.exp(-0.5 * Math.pow(Math.log2(6000 / l / 130) / 0.55, 2));
    let best = -1e9, bl = 50, sum = 0, cnt = 0, cur = 0;
    const Lcur = 6000 / X.bpm;
    for (let l = LMIN; l <= LMAX; l += 0.25) {
      const v = comb(l) * prior(l);
      sum += Math.max(0, v);
      cnt++;
      if (v > best) { best = v; bl = l; }
      if (Math.abs(l - Lcur) < 0.03 * Lcur && v > cur) cur = v;
    }
    const contrast = best / (sum / cnt + 1e-6);
    let num = 0, den = 0, h1 = 0;
    for (const k of [1, 2, 4]) {
      if (k * bl + 3 > AMAX) break;
      const [v, h] = vertex(acf, Math.round(k * bl), k + 1);
      if (k === 1) h1 = h;
      else if (h < 0.3 * h1) continue;
      if (Math.abs(v / k - bl) > 0.75) continue;
      num += k * h * (v / k);
      den += k * h;
    }
    const P = den > 0 ? num / den : bl, bpm = 6000 / P;
    const y1 = Math.max(0, at(P), at(2 * P), at(4 * P));
    const clear = contrast > 4 && y1 > 0.15;
    X.y1 = y1; X.contrast = contrast; X.clear = clear; X.h1 = h1;
    X.dbg = { bl, P, bpm: +bpm.toFixed(2), y1: +y1.toFixed(3), contrast: +contrast.toFixed(2), cur: +cur.toFixed(3), best: +best.toFixed(3), clear };
    // 3:2 arbitration (§21)
    if (clear && y1 > 0.08) {
      const M = 250, short = (l) => {
        const i = Math.floor(l), f = l - i;
        if (i + 1 >= M - 8) return 0;
        let a = 0, b = 0, n = 0;
        for (let t = N - M; t < N; t++) { a += x[t] * x[t - i]; b += x[t] * x[t - i - 1]; n += x[t] * x[t]; }
        return (a * (1 - f) + b * f) / (n + 1e-9);
      };
      const combS = (l) => short(l) + 0.6 * short(2 * l) + 0.3 * short(4 * l);
      const sc = combS(Lcur), s1 = short(Lcur);
      let bq = 0, bv = 0;
      for (const q of [1.5, 2 / 3]) { const v = combS(Lcur / q); if (v > bv) { bv = v; bq = q; } }
      if (bv > 0.6 && bv > 1.25 * sc && s1 < 0.5 * short(Lcur / bq)) { X.relN = (X.relQ === bq ? X.relN : 0) + 1; X.relQ = bq; } else X.relN = 0;
      if (X.relN >= 3) {
        const [v] = vertex(acf, Math.round(Lcur / bq), 2), L2 = Math.abs(v / (Lcur / bq) - 1) < 0.05 ? v : Lcur / bq;
        X.bpm = 6000 / L2;
        X.relN = 0; X.candN = 0; X.tempoAge = 0; X.switched = true;
      }
    }
    if (y1 > 0.08) {
      const r = bpm / X.bpm;
      if (!clear) { /* hold */ } else if (Math.abs(r - 1) < 0.06) {
        X.bpm += (bpm - X.bpm) * 0.3;
        X.tempoAge = 0;
      } else if (best < 1.25 * cur && !(X.tempoAge > 16)) {
        // the 25 % margin: a 16th-note build lights every lag; hold
      } else {
        if (Math.abs(bpm - X.candBpm) / bpm < 0.05) X.candN++;
        else { X.candBpm = bpm; X.candN = 1; }
        let rel = 0;
        for (const q of REL) if (Math.abs(r / q - 1) < 0.04) rel = q;
        const alive = vertex(acf, Math.round(Lcur), 1)[1] > 0.5 * h1;
        if (y1 > 0.3 && !alive) X.tempoAge++;
        // `alive` IS THE FIRST TEST (DECISIONS §61, Vienna): the tempo the clock already holds is not abandoned while its
        // own ACF lag is still a peak at least half as tall as the comb's winner. tempo.js already had exactly this rule,
        // but only on the DOWN-octave branch (`alive ? 1e9 : 16`) — so a half-time track could be doubled on 4 votes
        // (2 s) and then could not come back, and an unrelated lag could take it on 3. Measured on Thom Sonny Green's
        // Vienna, which is dead-constant 90.00 BPM with its hats on the 8ths and 16ths and a double-time layer from
        // 85 s (the user: "the double time should be accenting rather than driving"): the clock read 179.5 BPM over
        // 85-107 s and 120.0 over 132-161, ticking 1.89 beats/s against the music's 1.50 and putting every beat-locked
        // motion in every scene twice per felt beat. Promoting `alive` to the first test leaves the FOUR other truth
        // tracks' whole-track node traces BYTE-IDENTICAL (tools/clock-study.js, every column) and takes Vienna from
        // 62.3 % of frames in the right tempo octave to 95.6 %, |lag| p50 29.7 -> 8.6 ms and p90 314.9 -> 86.1 ms,
        // 1.890 -> 1.548 ticks/s against the music's 1.500. The escape hatch is unchanged and is the only one: when the
        // held lag DIES (`y1 > 0.3 && !alive` for 16 estimates = 8 s) `tempoAge` opens the gate at 3 votes, which is how
        // a real tempo change is followed; a drift inside TRACK is the `|r - 1| < 0.06` branch above and never a vote,
        // and the 3:2 arbitration is before this and untouched. The cost, stated: a track that moves to a genuinely
        // unrelated tempo while the old lag stays a live peak is not followed. test_clock.js's 17 checks cover the lock,
        // the 128 -> 132 ramp, 6 s of silence, the outlier and both lattice cases.
        const need = X.tempoAge > 16 ? 3 : alive ? 1e9 : !rel ? 2 : rel > 1 ? 4 : 16;
        X.dbg.sw = { cand: +X.candBpm.toFixed(1), n: X.candN, rel, alive, need, age: X.tempoAge };
        if (X.candN >= need) { X.bpm = bpm; X.candN = 0; X.tempoAge = 0; X.switched = true; }
      }
    }
    return true;
  }
  // The comb-aligned beat line (tempo.js's PLL target, refined): the integer offset phi (slots back from the newest) that puts
  // 8 beats of the comb on the envelope's peaks, then the parabolic vertex over phi; -> [audio time of that line, score].
  // The 8 comb taps are summed on the normalised, tapered x[] of the last estimate(), so it is only valid right after one.
  line(bps) {
    const x = this.x, Lc = RATE / bps;
    if (!(Lc > 1) || !(this.n >= N)) return [NaN, 0];
    const score = (phi) => {
      let sc = 0;
      for (let k = 0; k < 8; k++) {
        const idx = N - 1 - phi - Math.round(k * Lc);
        if (idx < 0) break;
        sc += x[idx];
      }
      return sc;
    };
    let bs = -1e9, bphi = 0;
    const top = Math.floor(Lc);
    for (let phi = 0; phi < top; phi++) { const sc = score(phi); if (sc > bs) { bs = sc; bphi = phi; } }
    const y0 = score((bphi + top - 1) % top), y2 = score((bphi + 1) % top), den = y0 - 2 * bs + y2;
    const f = den < -1e-9 ? clamp(0.5 * (y0 - y2) / den, -0.5, 0.5) : 0;
    // slot N-1 ends at tNew; a slot's onset sits at its centre
    return [this.tNew - (bphi + f + 0.5) / RATE, bs];
  }
}
