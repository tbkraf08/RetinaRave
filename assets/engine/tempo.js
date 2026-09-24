// Canonical tempo (MS.bpm, regularity, comb-PLL phase target) from the 100 Hz onset envelope XS.env — v0.2 §9,
// replacing cardioid3's tempoEstimate (DECISIONS §9). Called every 0.5 s by features.js.
//   1. ACF of the 8 s window (high-passed and loudness-normalised — 1 s running mean, 2 s running RMS — so ramps and
//      swells add neither a trend nor a lag-dependent decay; recency-tapered)
//      over lags 8..410 (32nd notes at 200 BPM up to 2 bars of 59 BPM).
//   2. Period search on a 0.25-sample grid with a harmonic comb (l + 0.6·2l + 0.3·4l) and v3's log-normal prior
//      re-centred on 130 BPM, so a fractional period scores its own harmonics and the bar backs the beat. No
//      sub-harmonic term (it rewards the slower level whenever the beat is strong) and no gentle prior: on v3's
//      bass-weighted envelope every beat multiple of dnb reads ≈ 0.45 and the 1-beat lag of halftime reads a quarter
//      of the 2-beat lag, so only the prior separates 174 from 87 (124 is their geometric mean; 130 is not) and 140 from 70.
//   3. Sub-lag refinement: the parabolic vertex of each harmonic peak (k = 1, 2, 4) estimates the period with k× the
//      precision of the fundamental; they are averaged with weight k·height. (174 BPM = lag 34.48: the k=1 parabola on
//      a 100 Hz grid lands ±0.3, the k=4 vertex at lag 137.9 lands ±0.08.)
//   4. Evidence gates: regularity and every tempo update read the metrical family's strongest lag (P, 2P or 4P: halftime's
//      beat is at 2P) scaled by the grid contrast (best comb / mean comb: 7–22 on a beat, 2–3 on pads → regularity ≈ 0
//      on ambient) with a 0.15 floor; an unrelated switch also has to beat the current tempo's own comb score by 25 %
//      (a 16th/32nd-note build lights every lag equally and its winner beats the beat by 2 %: the old tempo holds).
//   5. Relation-aware switching: within 6 % → track; an unrelated candidate → 3 votes (1.5 s; 2 once the current lag
//      has collapsed, which a real tempo change does within the window's recency taper); a metrical relative
//      (½×, 2×, ¼×, 4×, ⅓×, 3×, ⅔×, 3/2×; not 4/3) is explained by the current tempo while the current lag is still alive → refused; once the
//      current lag has collapsed a slower relative needs 16 votes (8 s: the whole window), a faster one 4. A tempo that
//      has seen 8 s of solid evidence (y1 > 0.3) without being confirmed lets any candidate through with 3 votes.
//   6. 3:2 arbitration (v0.3 §21): a 3:2 / 2:3 change is invisible to the whole-window comb for 8 s (the old tempo's
//      2l/4l harmonics sit on the new grid), so the last 2.5 s decide it — three estimates with the relative's beat lag
//      > 0.3 and > 1.5× the current one switch the tempo (4 s up, 3 s down in test_tempo.js; was never / 8 s).
import { clamp, ema, frac, sstep, wrap1 } from '../math/util.js';
import { MS, XS } from './state.js';

const N = 800, LMIN = 30, LMAX = 102, AMIN = 8, AMAX = 410; // ACF from lag 8 so P/4 of a 200 BPM period is visible to the sub-multiple gate
const REL = [0.5, 2, 0.25, 4, 1 / 3, 3, 2 / 3, 1.5]; // metrical relatives (not 4/3: 128 → 174 is one and must switch fast)

// walk uphill from L0 (at most `span` steps) to the local maximum, return its parabolic vertex and height
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

export function tempoEstimate() {
  const S = MS, X = XS, x = X.tmp;
  const acf = X._acf || (X._acf = new Float32Array(AMAX + 2));
  // high-pass the window (1 s running mean removed) and normalise its loudness (2 s running RMS): a build's rising
  // ramp or a pad swell otherwise makes every ACF lag decay with distance, which let 32nd-note builds vote a 4/3
  // candidate (171 at 128) over the prior. The silence gate stays on the raw energy.
  let m = X.env[X.ei], raw = 0, pw = 0;
  for (let i = 0; i < N; i++) {
    const v = X.env[(X.ei + i) % N];
    m += (v - m) * 0.01;
    x[i] = v - m;
    raw += x[i] * x[i];
  }
  if (raw / N < 1e-6) {
    S.regularity = ema(S.regularity, 0, 0.5, 1);
    return;
  }
  let a0 = 0;
  pw = raw / N; // warm start at the window's mean power: silence at the window's start must not be amplified
  for (let i = 0; i < N; i++) {
    pw += (x[i] * x[i] - pw) * 0.005;
    x[i] = x[i] / Math.sqrt(pw + 1e-4) * (0.5 + i / (2 * N)); // + recency taper: the oldest samples count half
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
  const Lcur = 6000 / S.bpm;
  for (let l = LMIN; l <= LMAX; l += 0.25) {
    const v = comb(l) * prior(l);
    sum += Math.max(0, v);
    cnt++;
    if (v > best) {
      best = v;
      bl = l;
    }
    if (Math.abs(l - Lcur) < 0.03 * Lcur && v > cur) cur = v; // the current tempo's own score
  }
  const contrast = best / (sum / cnt + 1e-6); // ≈1 when the ACF is flat (pads, 16th-note bursts), ≫1 on a beat
  // sub-lag refinement on the harmonics of the winning period
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
  // evidence of the metrical family (halftime's beat lives at 2P) vs its sub-multiples (a 16th-note build lights every
  // lag equally: nothing to switch to) and vs the whole grid (pads: a flat, slowly varying ACF has no tempo at all)
  const y1 = Math.max(0, at(P), at(2 * P), at(4 * P));
  const clear = contrast > 4 && y1 > 0.15; // 0.15: white noise over 800 samples peaks at ~0.1
  X._tempoDbg = { bl, P, bpm, y1, h1, contrast, cur, best, clear };
  S.regularity = ema(S.regularity, clamp(y1 * 1.6, 0, 1) * sstep(0.05, 0.3, S.presence) * sstep(2, 5, contrast), 0.5, 1.2);
  // 3:2 arbitration (v0.3 §21): a 3:2 or 2:3 change cannot be seen by the whole-window comb for 8 s — the old tempo's
  // 2l/4l harmonics sit on the new beat grid (2·L128 = 3·L192), so its comb keeps winning while its own lag dies. The
  // last 2.5 s decide instead, with the same harmonic comb (l + .6·2l + .3·4l — the beat lag alone is no reference:
  // halftime's 1-beat lag is a quarter of its 2-beat lag, and 140's 2:3 relative flipped the mix demo on it): when the
  // relative's short comb is > 0.6 and > 1.25× the current tempo's for three estimates (1.5 s), the tempo is the
  // relative. Only these two ratios: ½/2/¼/4 are drum patterns a tempo explains (halftime, double-time) and keep §9's rules.
  if (clear && y1 > 0.08) {
    const M = 250, short = (l) => {
      const i = Math.floor(l), f = l - i;
      if (i + 1 >= M - 8) return 0; // a lag the window cannot hold
      let a = 0, b = 0, n = 0;
      for (let t = N - M; t < N; t++) { a += x[t] * x[t - i]; b += x[t] * x[t - i - 1]; n += x[t] * x[t]; }
      return (a * (1 - f) + b * f) / (n + 1e-9); // normalised by the window's power: a long lag has fewer products and reads lower — a taper, kept (per-product normalisation flipped dnb to its 2:3 relative)
    };
    const combS = (l) => short(l) + 0.6 * short(2 * l) + 0.3 * short(4 * l);
    const sc = combS(Lcur), s1 = short(Lcur);
    let bq = 0, bv = 0;
    for (const q of [1.5, 2 / 3]) { const v = combS(Lcur / q); if (v > bv) { bv = v; bq = q; } }
    // three conditions: the relative's comb carries the window, beats the current comb, and the current BEAT lag has
    // died relative to the relative's (a steady groove keeps its beat lag ≈ 0.8 while a relative's comb can reach 0.7)
    if (bv > 0.6 && bv > 1.25 * sc && s1 < 0.5 * short(Lcur / bq)) { X.relN = (X.relQ === bq ? X.relN : 0) + 1; X.relQ = bq; } else X.relN = 0;
    X._tempoDbg.rel32 = { sc: +sc.toFixed(2), q: bq, v: +bv.toFixed(2), n: X.relN, s1: +s1.toFixed(2), sq: +short(Lcur / bq).toFixed(2) };
    if (X.relN >= 3) {
      const [v] = vertex(acf, Math.round(Lcur / bq), 2), L2 = Math.abs(v / (Lcur / bq) - 1) < 0.05 ? v : Lcur / bq;
      S.bpm = 6000 / L2;
      X.relN = 0; X.candN = 0; X.tempoAge = 0;
    }
  }
  if (y1 > 0.08) {
    const r = bpm / S.bpm;
    if (!clear) { /* hold */ } else if (Math.abs(r - 1) < 0.06) {
      S.bpm += (bpm - S.bpm) * 0.3;
      X.tempoAge = 0;
    } else if (best < 1.25 * cur && !(X.tempoAge > 16)) {
      // margin (synapse's rule): an unrelated candidate has to beat the current tempo's own score by 25 %. A 16th- or
      // 32nd-note build lights every lag and its comb winner (3 or 6 grid steps) beats the beat by 2 %: hold.
    } else {
      if (Math.abs(bpm - X.candBpm) / bpm < 0.05) X.candN++;
      else {
        X.candBpm = bpm;
        X.candN = 1;
      }
      let rel = 0;
      for (const q of REL) if (Math.abs(r / q - 1) < 0.04) rel = q;
      const alive = vertex(acf, Math.round(Lcur), 1)[1] > 0.5 * h1;
      if (y1 > 0.3 && !alive) X.tempoAge++; // a tempo whose own lag is alive explains its relatives: it does not age
      const need = X.tempoAge > 16 ? 3 : !rel ? (alive ? 3 : 2) : rel > 1 ? 4 : alive ? 1e9 : 16;
      X._tempoDbg.sw = { cand: +X.candBpm.toFixed(1), n: X.candN, rel, alive, need, age: X.tempoAge };
      if (X.candN >= need) {
        S.bpm = bpm;
        X.candN = 0;
        X.tempoAge = 0;
      }
    }
    // comb-aligned PLL target (unchanged from v3): the phase that puts 8 beats of the comb on the envelope peaks
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
