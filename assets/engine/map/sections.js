// Bar-synchronous sections: self-similarity on band shares + purity + voiced share + onset densities + a SUB-INCLUSIVE
// chroma, Foote novelty with a Gaussian checkerboard kernel, boundaries at bar lines, greedy cosine clustering for labels,
// `ret` for a return. A JS port of tools/truth/trackmap.py's E0 sections, graded against it.
// The checkerboard half-width, in bars. 6, raised from v0.15 pass 1's 4 together with REFINE below: swept refine 0/1 x
// minBars 1/2/3 x kernel 3/4/6 x novK 0.4/0.6/0.8 against the v2 annotation (tools/work/probe_sweep.js output is in
// docs/workers/ears.md "## Pass 2"). `refine 1, kernel 6` is a PLATEAU — 10 of 11 boundaries and 3 of 3 return pairs at
// minBars 1, 2 and 3 and at novK 0.4 and 0.6 — and it does it with 13 sections where `refine 0, kernel 3, novK 0.6` needs
// 21 for the same 10 of 11. kernel 4 with refine 1 is the one bad corner (7 of 11): a 4-bar mean is too short for the
// left/right distance to beat the novelty's own peak.
export const KERNEL = 6;
export const MIN_BARS = 2;           // the minimum distance between boundaries, in bars
export const CLUSTER = 0.65;        // swept 0.35 / 0.5 / 0.65 / 0.8 against the annotation's three return pairs (with KERNEL 3/4/6
                                     // and NOV_K 0.4-0.85): 0.65 is the only point that recovers all three AND keeps 8 of the
                                     // 12 boundaries within a beat. Midpoint to midpoint none of them reach 3/3, because a
                                     // 20-bar annotated section legitimately splits into two clusters and only one returns.
export const NOV_K = 0.6;            // the novelty threshold is mean + NOV_K * sd of the whole curve
// A Gaussian checkerboard kernel deliberately smears, so its peak is only good to about a bar: on SeeYouDrop the two
// boundaries the detector still missed against the v2 annotation (bar 60, the double-time climb, and bar 82, the turn)
// both had a novelty peak exactly ONE BAR early, with the right bar second (6.660 / 5.665 and 5.294 / 4.884 against a
// 4.912 threshold), because the double-time onsets and the thinning drums both start inside the bar before. REFINE moves
// each peak to whichever bar line within +-REFINE bars maximises the UNWEIGHTED cosine distance between the mean feature
// vector of the KERNEL bars before it and the KERNEL bars after it — the same quantity the novelty estimates, without the
// Gaussian's smear. 1 bar, so a boundary can never be relocated to a different musical place.
export const REFINE = 1;
export const KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
export const KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Foote novelty from a self-similarity matrix. -> Float64Array(n)
export function foote(SSM, n, L = KERNEL) {
  const g = new Float64Array(2 * L);
  for (let i = 0; i < 2 * L; i++) { const x = (i - L + 0.5) / (L * 0.5); g[i] = Math.exp(-0.5 * x * x); }
  const nov = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (i - L < 0 || i + L > n) continue;
    let s = 0;
    for (let a = 0; a < 2 * L; a++) for (let b = 0; b < 2 * L; b++) {
      const sign = (a < L) === (b < L) ? 1 : -1;
      s += sign * g[a] * g[b] * SSM[(i - L + a) * n + (i - L + b)];
    }
    nov[i] = Math.max(0, s);
  }
  return nov;
}

// Greedy cosine clustering of segment feature means. -> { labels, ret }
export function clusterLabels(F, dim, thr = CLUSTER) {
  const n = F.length / dim, labels = new Int32Array(n), reps = [];
  for (let i = 0; i < n; i++) {
    let nr = 0; for (let d = 0; d < dim; d++) nr += F[i * dim + d] * F[i * dim + d];
    nr = Math.sqrt(nr) || 1;
    let hit = -1;
    for (let k = 0; k < reps.length; k++) {
      let dot = 0; for (let d = 0; d < dim; d++) dot += (F[i * dim + d] / nr) * reps[k][d];
      if (1 - dot < thr) { hit = k; break; }
    }
    if (hit < 0) { const r = new Float64Array(dim); for (let d = 0; d < dim; d++) r[d] = F[i * dim + d] / nr; reps.push(r); labels[i] = reps.length - 1; }
    else {
      labels[i] = hit; const r = reps[hit];
      let m = 0; for (let d = 0; d < dim; d++) { r[d] += F[i * dim + d] / nr; m += r[d] * r[d]; }
      m = Math.sqrt(m) || 1;
      for (let d = 0; d < dim; d++) r[d] /= m;
    }
  }
  const seen = new Set(), ret = [];
  for (let i = 0; i < n; i++) { ret.push(seen.has(labels[i]) ? 1 : 0); seen.add(labels[i]); }
  return { labels, ret };
}

// Krumhansl-Kessler on a 12-vector. -> { pc, minor, conf, scores }
export function kkTonic(ch) {
  let mean = 0; for (let i = 0; i < 12; i++) mean += ch[i];
  mean /= 12;
  let cn = 0; for (let i = 0; i < 12; i++) cn += (ch[i] - mean) * (ch[i] - mean);
  cn = Math.sqrt(cn);
  const scores = new Array(24).fill(0);
  if (!(cn > 0)) return { pc: 0, minor: 0, conf: 0, scores };
  for (let mi = 0; mi < 2; mi++) {
    const pr = mi ? KK_MIN : KK_MAJ;
    let pm = 0; for (let i = 0; i < 12; i++) pm += pr[i];
    pm /= 12;
    let pn = 0; for (let i = 0; i < 12; i++) pn += (pr[i] - pm) * (pr[i] - pm);
    pn = Math.sqrt(pn);
    for (let k = 0; k < 12; k++) {
      let d = 0;
      for (let i = 0; i < 12; i++) d += (ch[i] - mean) * (pr[(i - k + 12) % 12] - pm);
      scores[mi * 12 + k] = d / (cn * pn);
    }
  }
  let bi = 0; for (let i = 1; i < 24; i++) if (scores[i] > scores[bi]) bi = i;
  const srt = scores.slice().sort((a, b) => b - a);
  return { pc: bi % 12, minor: bi >= 12 ? 1 : 0, conf: Math.max(0, (srt[0] - srt[1]) / (Math.abs(srt[0]) + 1e-9)), scores };
}

// Bars x dim feature matrix (z-scored) -> sections. `downbeats` has nBars + 1 entries.
export function buildSections(F, dim, downbeats, o = {}) {
  const KER = o.kernel === undefined ? KERNEL : o.kernel;
  const NK = o.novK === undefined ? NOV_K : o.novK;
  const CL = o.cluster === undefined ? CLUSTER : o.cluster;
  const MB = o.minBars === undefined ? MIN_BARS : o.minBars;
  const n = F.length / dim;
  const mu = new Float64Array(dim), sd = new Float64Array(dim);
  for (let d = 0; d < dim; d++) { let s = 0; for (let i = 0; i < n; i++) s += F[i * dim + d]; mu[d] = s / n; }
  for (let d = 0; d < dim; d++) { let s = 0; for (let i = 0; i < n; i++) { const e = F[i * dim + d] - mu[d]; s += e * e; } sd[d] = Math.sqrt(s / n) || 1e-9; }
  const Z = new Float64Array(n * dim);
  for (let i = 0; i < n; i++) for (let d = 0; d < dim; d++) Z[i * dim + d] = (F[i * dim + d] - mu[d]) / sd[d];
  const U = new Float64Array(n * dim);
  for (let i = 0; i < n; i++) {
    let m = 0; for (let d = 0; d < dim; d++) m += Z[i * dim + d] * Z[i * dim + d];
    m = Math.sqrt(m) || 1;
    for (let d = 0; d < dim; d++) U[i * dim + d] = Z[i * dim + d] / m;
  }
  const SSM = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    let s = 0; for (let d = 0; d < dim; d++) s += U[i * dim + d] * U[j * dim + d];
    SSM[i * n + j] = s; SSM[j * n + i] = s;
  }
  const nov = foote(SSM, n, KER);
  let m = 0; for (let i = 0; i < n; i++) m += nov[i];
  m /= n;
  let v = 0; for (let i = 0; i < n; i++) v += (nov[i] - m) * (nov[i] - m);
  const thr = m + NK * Math.sqrt(v / n);
  const peaks = [];
  for (let i = 1; i < n - 1; i++) {
    if (nov[i] <= thr || nov[i] < nov[i - 1] || nov[i] < nov[i + 1]) continue;
    if (peaks.length && i - peaks[peaks.length - 1] < MB) { if (nov[i] > nov[peaks[peaks.length - 1]]) peaks[peaks.length - 1] = i; continue; }
    peaks.push(i);
  }
  // --- refine each peak to the bar line of the largest plain left/right mean-feature distance within +-RF bars
  const RF = o.refine === undefined ? REFINE : o.refine;
  if (RF > 0) {
    const mL = new Float64Array(dim), mR = new Float64Array(dim);
    const split = (j) => {
      if (j - KER < 0 || j + KER > n) return -1;
      mL.fill(0); mR.fill(0);
      for (let i = j - KER; i < j; i++) for (let d = 0; d < dim; d++) mL[d] += U[i * dim + d];
      for (let i = j; i < j + KER; i++) for (let d = 0; d < dim; d++) mR[d] += U[i * dim + d];
      let a = 0, b = 0, dot = 0;
      for (let d = 0; d < dim; d++) { a += mL[d] * mL[d]; b += mR[d] * mR[d]; dot += mL[d] * mR[d]; }
      return a > 0 && b > 0 ? 1 - dot / Math.sqrt(a * b) : -1;
    };
    for (let p = 0; p < peaks.length; p++) {
      let bj = peaks[p], bd = split(bj);
      for (let j = peaks[p] - RF; j <= peaks[p] + RF; j++) {
        if (j < 1 || j >= n - 1 || j === peaks[p]) continue;
        const d = split(j);
        if (d > bd) { bd = d; bj = j; }
      }
      peaks[p] = bj;
    }
    peaks.sort((a, b) => a - b);
    for (let p = peaks.length - 1; p > 0; p--) if (peaks[p] - peaks[p - 1] < MB) peaks.splice(p, 1);
  }
  const bnd = [0, ...peaks, n];
  const segs = [];
  for (let i = 0; i < bnd.length - 1; i++) if (bnd[i + 1] > bnd[i]) segs.push([bnd[i], bnd[i + 1]]);
  const SF = new Float64Array(segs.length * dim);
  for (let s = 0; s < segs.length; s++) {
    const [a, b] = segs[s];
    for (let d = 0; d < dim; d++) { let q = 0; for (let i = a; i < b; i++) q += Z[i * dim + d]; SF[s * dim + d] = q / (b - a); }
  }
  const { labels, ret } = clusterLabels(SF, dim, CL);
  const last = downbeats.length - 1;
  return { sections: segs.map(([a, b], i) => ({ t0: downbeats[Math.min(a, last)], t1: downbeats[Math.min(b, last)], id: i, label: labels[i], ret: ret[i], bars: b - a })),
    novelty: Array.from(nov), thr };
}
