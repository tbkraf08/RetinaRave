// Analyzer mixin: beat-synchronous structure. Per-beat 23-dim feature vectors, Foote novelty (checkerboard kernel on
// the self-similarity of centred beat features), section boundaries + fingerprint clustering (returns), and the
// bar / 16 / 32-beat phrase grid with confidences. Lifted from synapse2.html 417–494.
import { clamp01, lerp, smooth, FDIM } from './dsp.js';

// BEAT — close the beat's feature vector, feed the bar/phrase histogram, run Foote novelty, track sections.
export function onBeat(bNew, now) {
  const A = this.A, b = this.done = bNew - 1; // the beat that just completed started at beat-time b
  const F = this.F[b % this.BN], acc = this.acc, n = Math.max(1, this.accN), nc = Math.max(1, this.accC);
  let cn = 0;
  for (let i = 0; i < 12; i++) { F[i] = acc[i] / nc; cn += F[i] * F[i]; }
  cn = Math.sqrt(cn) + 1e-6;
  let hd = 0;
  for (let i = 0; i < 12; i++) { F[i] /= cn; hd += F[i] * this.prevBeatChroma[i]; }
  this.harm = smooth(this.harm, this.accC ? clamp01((1 - hd) * 2.5) : this.harm, 1, 12);
  for (let i = 0; i < 12; i++) this.prevBeatChroma[i] = F[i];
  for (let j = 12; j < 21; j++) F[j] = acc[j] / n * 1.6;
  F[21] = Math.min(1, this.accOn / 6) * 0.6;
  F[22] = A.perc * 0.5;
  const E = this.E[b % this.BN] = this.accLvl / n;
  acc.fill(0);
  this.accN = 0; this.accC = 0; this.accLvl = 0; this.accOn = 0;
  this.muN = Math.min(this.muN + 1, 256);
  for (let i = 0; i < FDIM; i++) this.mu[i] += (F[i] - this.mu[i]) / this.muN;
  if (A.alive < 0.5) return;
  // Foote novelty: fast kernel = timbre only (chord loops must not read as boundaries), half-width 4 beats; slow
  // kernel = everything, half-width 16 beats, used in hindsight to align the phrase grid.
  const nf = this.foote(b - 3, 4, 12), nl = b > 40 ? this.foote(b - 15, 16, 0) : 0;
  this.novFast[b % this.BN] = nf;
  A.foote = nf;
  const dE = Math.abs(E - this.E[(b - 1 + this.BN) % this.BN]);
  this.addGrid(b, Math.max(0, dE - 0.04) * 3); // changes vote for where phrase lines are — novelty only at its PEAKS
  if (this.nf1 > 0.25 && this.nf1 >= nf && this.nf1 > this.nf2) this.addGrid(b - 4, this.nf1 * 1.5);
  if (this.nl1 > 0.3 && this.nl1 >= nl && this.nl1 > this.nl2) this.addGrid(b - 16, this.nl1 * 3);
  this.nf2 = this.nf1; this.nf1 = nf; this.nl2 = this.nl1; this.nl1 = nl;
  this.novPk = Math.max(nf, 0.3, this.novPk * 0.995);
  const pf = this.novFast[(b - 1 + this.BN) % this.BN];
  if (pf > 0.42 && pf > this.novPk * 0.45 && pf >= nf && b - 4 - this.lastBoundary > 7) {
    // confirm against the WHOLE current section, not just the previous bar: a 2-bar call/response is not a new section
    let ok = this.secN < 12;
    if (!ok) {
      let ab = 0, am = 0, bm = 0;
      const mu = this.mu;
      for (let k = 12; k < FDIM; k++) {
        let a = 0;
        for (let i = b - 4; i <= b; i++) a += this.F[(i + this.BN * 4) % this.BN][k];
        a /= 5;
        const s = this.secSum[k] / this.secN;
        ab += (a - s) * (a - s); am += (a - mu[k]) * (a - mu[k]); bm += (s - mu[k]) * (s - mu[k]);
      }
      ok = Math.sqrt(ab) / (Math.sqrt(am) + Math.sqrt(bm) + 0.05) > 0.3;
    }
    if (ok) this.boundary(b - 4, now, false);
  }
  // section fingerprint accrues; identity is re-examined as evidence grows
  for (let i = 0; i < FDIM; i++) this.secSum[i] += F[i];
  this.secN++;
  A.sectionAge = b - this.secStart;
  if (this.secN === 4 || this.secN === 8 || this.secN === 16 || (this.secN % 32) === 0) this.identify();
}

export function sim(i, j, from) {
  const a = this.F[(i + this.BN * 4) % this.BN], b = this.F[(j + this.BN * 4) % this.BN], mu = this.mu;
  let d = 0, na = 0, nb = 0;
  for (let k = from; k < FDIM; k++) {
    const x = a[k] - mu[k], y = b[k] - mu[k];
    d += x * y; na += x * x; nb += y * y;
  }
  return d / (Math.max(Math.sqrt(na), 0.12) * Math.max(Math.sqrt(nb), 0.12));
}

export function foote(c, L, from) {
  if (c - L < Math.max(1, this.beatI - this.BN + 2) || c - L < this.gridStart) return 0;
  let same = 0, cross = 0, ws = 0, wc = 0;
  for (let i = -L; i < L; i++) {
    for (let j = i + 1; j < L; j++) {
      const g = Math.exp(-((i + 0.5) * (i + 0.5) + (j + 0.5) * (j + 0.5)) / (L * L * 0.8)), s = this.sim(c + i, c + j, from);
      if ((i < 0) === (j < 0)) { same += g * s; ws += g; } else { cross += g * s; wc += g; }
    }
  }
  return Math.max(0, same / ws - cross / wc);
}

export function boundary(b, now, isDrop) {
  const A = this.A;
  // snap to the grid when it is trusted
  if (!isDrop && A.phraseConf > 0.3) {
    const r = (((b - this.o16) % 16) + 16) % 16;
    if (r <= 3) b -= r;
    else if (r >= 13) b += 16 - r;
    else if (A.barConf > 0.3) { const q = (((b - this.o4) % 4) + 4) % 4; b += q <= 1 ? -q : q === 3 ? 1 : 0; }
  }
  if (b - this.lastBoundary < 6 && !isDrop) return;
  if (this.cur) this.cur.lastLen = b - this.secStart;
  this.lastBoundary = b; this.prevSec = this.cur; this.cur = null; this.secStart = b;
  this.secSum.fill(0);
  this.secN = 0;
  A.boundaries++;
  for (let i = b; i <= this.done; i++) {
    const F = this.F[(i + this.BN * 4) % this.BN];
    for (let k = 0; k < FDIM; k++) this.secSum[k] += F[k];
    this.secN++;
  }
  A.events.push({ type: 'boundary', drop: isDrop, predict: this.prevSec && this.prevSec.next >= 0 ? this.prevSec.next : -1 });
  if (this.secN >= 4) this.identify();
}

// Cluster the running fingerprint against every remembered section. d -> 0 for the same material, -> 1 for material on
// the far side of the track mean.
export function identify() {
  const A = this.A, f = new Float32Array(FDIM), mu = this.mu;
  for (let i = 0; i < FDIM; i++) f[i] = this.secSum[i] / this.secN;
  const from = this.secN < 8 ? 12 : 0;
  let best = 9, bi = -1, second = 9;
  const dist = (a, b) => {
    let ab = 0, am = 0, bm = 0;
    for (let i = from; i < FDIM; i++) { ab += (a[i] - b[i]) * (a[i] - b[i]); am += (a[i] - mu[i]) * (a[i] - mu[i]); bm += (b[i] - mu[i]) * (b[i] - mu[i]); }
    return Math.sqrt(ab) / (Math.sqrt(am) + Math.sqrt(bm) + 0.05);
  };
  this.sections.forEach((s, i) => {
    if (s === this.cur) return;
    const d = dist(f, s.f);
    if (d < best) { second = best; best = d; bi = i; } else if (d < second) second = d;
  });
  const thr = this.secN < 8 ? 0.22 : 0.32;
  if (this.cur && !this.cur.fresh) { // identity settled: just refine the fingerprint
    for (let i = 0; i < FDIM; i++) this.cur.f[i] = lerp(this.cur.f[i], f[i], 0.2);
    return;
  }
  if (bi >= 0 && best < thr && second - best > 0.04) { // a return
    const s = this.sections[bi];
    if (this.cur && this.cur.fresh) { // the fresh section was this one all along: it goes, the ids above it move down
      const k = this.sections.indexOf(this.cur), map = this.sections.map((x, i) => (i < k ? i : i === k ? -1 : i - 1));
      this.sections.splice(k, 1); this.sections.forEach((x, i) => (x.id = i));
      A.events.push({ type: 'renumber', map });
    }
    this.cur = s; s.fresh = false; s.n++;
    A.section = s.id; A.sectionReturn = 1; A.returns++;
    if (this.prevSec && this.prevSec !== s) this.prevSec.next = s.id;
    A.events.push({ type: 'section', id: s.id, ret: true, d: best });
  } else if (!this.cur && this.secN >= 8) {
    const s = { id: this.sections.length, f, n: 0, fresh: true, next: -1, look: null };
    this.sections.push(s);
    this.cur = s;
    A.section = s.id; A.sectionReturn = 0;
    if (this.prevSec) this.prevSec.next = s.id;
    if (this.sections.length > 24) { // the ring is full: the oldest goes, every id moves down
      A.events.push({ type: 'renumber', map: this.sections.map((x, i) => i - 1) });
      this.sections.shift(); this.sections.forEach((x, i) => { x.id = i; x.next = -1; });
    }
    A.events.push({ type: 'section', id: s.id, ret: false, d: best });
  } else if (this.cur && this.cur.fresh) {
    this.cur.f = f;
    if (this.secN >= 16) this.cur.fresh = false;
  }
  A.sectionCount = this.sections.length;
}

// GRID — where do changes land modulo 32 beats? bar -> 16 -> 32, each level constrained by the one below, with confidences.
export function addGrid(b, w) {
  if (b < this.gridStart) return;
  this.H32[((b % 32) + 32) % 32] += w;
}
export function resetGrid() {
  const A = this.A;
  this.H32.fill(0);
  this.barK.fill(0);
  this.gridStart = this.beatI + 1;
  A.barConf = A.phraseConf = A.gridTrust = 0;
  this.exp = null;
}
export function grid() {
  if ((this.hops & 15) !== 0) return;
  const A = this.A, H = this.H32, T = this.tempo, d = Math.pow(0.997, 16 * this.dt / T.period);
  let tot = 0;
  for (let i = 0; i < 32; i++) { H[i] *= d; tot += H[i]; }
  for (let i = 0; i < 4; i++) this.barK[i] *= d;
  const pick = (score, n, step, base) => {
    let b = -1, bi = base, s2 = -1;
    for (let i = base; i < n; i += step) { const s = score(i); if (s > b) { s2 = b; b = s; bi = i; } else if (s > s2) s2 = s; }
    return [bi, b > 1e-6 ? (b - Math.max(0, s2)) / b : 0];
  };
  let kt = 0;
  for (let i = 0; i < 4; i++) kt += this.barK[i];
  const kn = (i) => (kt > 1 ? (this.barK[i] / kt - 0.25) * 2 : 0);
  const f4 = (i) => { let s = 0; for (let k = i % 4; k < 32; k += 4) s += H[k]; return s / (tot + 1e-6) + kn(i % 4); };
  const [o4, c4] = pick(f4, 4, 1, 0);
  const [o16, c16] = pick((i) => H[i] + H[(i + 16) % 32], 16, 4, o4);
  const [o32, c32] = pick((i) => H[i], 32, 16, o16);
  const mass = clamp01(tot / 6);
  this.o4 = o4; this.o16 = o16; this.o32 = o32;
  A.barConf = smooth(A.barConf, clamp01(c4 * 2 * mass) * clamp01(A.gridTrust * 2), 0.17, 1);
  A.phraseConf = smooth(A.phraseConf, clamp01(c16 * 2.5 * mass) * clamp01(A.gridTrust * 2), 0.17, 1);
  A.phrase32Conf = c32 * mass;
  const beat = T.beat;
  A.barPos = (((beat - o4) % 4) + 4) % 4;
  A.phrasePos = (((beat - o32) % 32) + 32) % 32;
  A.phrase16Pos = (((beat - o16) % 16) + 16) % 16;
}
