// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Bars mixin: THE MATCHER (bars.js assigns these to Bars.prototype, as synapse's structure.js is to its Analyzer) — the
// context cache, the heard part of a bar, the vote over the stored bars and the prediction it fills.
import { NBAR, DIM, W_CLS, pop } from './common.js';

export const STEPS = 16;          // per bar: 16ths
export const TOPK = 8;            // candidates in a vote
export const TAU = 0.04;          // vote weight exp((sim - best) / TAU)

export const MATCH = {
  // the context similarities of every stored slot, for the newest stored bar (recomputed once per stored bar):
  // ctx1[j] = the bar before j vs the newest, ctx2[j] = the bar two before j vs the one before the newest (NaN = none)
  context() {
    if (this.ctxSeq === this.seq) return;
    this.ctxSeq = this.seq;
    const nb = Math.min(this.seq, NBAR), p1 = this.slot(0), p2 = p1 >= 0 && this.cont[p1] && nb > 1 ? this.slot(1) : -1;
    this.p2ok = p2 >= 0;
    for (let n = 0; n < nb; n++) {
      const j = this.slot(n);
      const jp = this.cont[j] && n + 1 < nb ? this.slot(n + 1) : -1;
      const jpp = jp >= 0 && this.cont[jp] && n + 2 < nb ? this.slot(n + 2) : -1;
      this.ctx1[j] = jp >= 0 ? this.simSlots(jp, p1) : NaN;
      this.ctx2[j] = jpp >= 0 && p2 >= 0 ? this.simSlots(jpp, p2) : NaN;
    }
  },

  // the heard bar's per-beat energy means for its completed beats (< qb) into tq
  heardE(cur, qb) {
    for (let q = 0; q < qb; q++) {
      const m = cur.n[q] ? 1 / cur.n[q] : 0;
      for (let d = 0; d < DIM; d++) this.tq[q * DIM + d] = cur.E[q * DIM + d] * m;
    }
  },

  // similarity of the heard part of `cur` (steps < s, beats < s/4) to stored slot j: bits (weight wb) + energies (we each)
  heardSim(cur, j, s, wb, we) {
    const mask = s >= STEPS ? 0xffff : (1 << s) - 1, qb = s >> 2;
    let dif = 0, uni = 0;
    for (let c = 0; c < 3; c++) { const x = cur.bits[c] & mask, y = this.bits[j * 3 + c] & mask; dif += W_CLS[c] * pop(x ^ y); uni += W_CLS[c] * pop(x | y); }
    let num = wb * (1 - dif / (uni + 1)), den = wb;
    for (let q = 0; q < qb; q++) if (cur.n[q]) { num += we * this.simE(this.tq, q * DIM, this.E, (j * 4 + q) * DIM); den += we; }
    return [num, den];
  },

  // score every stored bar as the one the heard bar kc (steps < s heard) repeats; the newest stored bar is kc - 1
  vote(kc, s) {
    const nb = Math.min(this.seq, NBAR), cur = this.open.get(kc);
    const ctx = this.lastK === kc - 1;
    if (ctx) this.context();
    if (cur && s > 0) this.heardE(cur, s >> 2);
    const idx = [], sc = [];
    for (let n = 0; n < nb; n++) {
      const j = this.slot(n);
      if (!this.okS[j]) continue;
      let num = 0, den = 0;
      if (ctx) {                                                 // a candidate with no bar before it scores a neutral 0.5 there
        const a = this.ctx1[j], b = this.ctx2[j];
        num += a === a ? a : 0.5; den += 1;
        if (this.p2ok) { num += 0.5 * (b === b ? b : 0.5); den += 0.5; }
      }
      if (cur && s > 0) { const [x, y] = this.heardSim(cur, j, s, 2 * s / STEPS, 0.5); num += x; den += y; }
      if (den <= 0) continue;
      const back = kc - this.kOf[j];
      const bonus = back % 16 === 0 ? 0.03 : back % 8 === 0 ? 0.02 : back % 4 === 0 ? 0.01 : 0;
      idx.push(j); sc.push(num / den + bonus);
    }
    const ord = idx.map((_, n) => n).sort((x, y) => sc[y] - sc[x]).slice(0, TOPK);
    const best = ord.length ? sc[ord[0]] : 0;
    return { k: kc, s, idx: ord.map((n) => idx[n]), sc: ord.map((n) => sc[n]), w: ord.map((n) => Math.exp((sc[n] - best) / TAU)), best };
  },

  // the successors of a vote's candidates, as the vote for the next bar kc (its first steps, before kc - 1 is closed)
  succ(V, kc, s) {
    // scored as their parents were: a best candidate with no stored successor (the bar just before kc) leaves the
    // prediction to the others at THEIR score, so the confidence says how good the continuation really is
    const idx = [], sc = [];
    for (let n = 0; n < V.idx.length; n++) {
      const j = V.idx[n], nx = (j + 1) % NBAR;
      if (nx === (this.seq % NBAR) || this.kOf[nx] !== this.kOf[j] + 1 || !this.cont[nx] || !this.okS[nx]) continue;
      idx.push(nx); sc.push(V.sc[n]);
    }
    const best = idx.length ? Math.max(...sc) : 0;
    return { k: kc, s, idx, sc, w: sc.map((x) => Math.exp((x - best) / TAU)), best };
  },

  // fill pred[] for bar kc from step s on, and for bar kc + 1 from the candidates' successors
  predict(V) {
    this.pred.fill(0);
    const W = V.w.reduce((x, y) => x + y, 0);
    if (!W) return;
    for (let c = 0; c < 3; c++) {
      for (let st = V.s; st < STEPS; st++) {
        let p = 0;
        for (let n = 0; n < V.idx.length; n++) if (this.bits[V.idx[n] * 3 + c] >> st & 1) p += V.w[n];
        this.pred[c * 2 * STEPS + st] = p / W > 0.5 ? 1 : 0;
      }
      let p2w = 0;
      const p2 = new Float32Array(STEPS);
      for (let n = 0; n < V.idx.length; n++) {
        const j = V.idx[n], nx = (j + 1) % NBAR;
        if (this.kOf[nx] !== this.kOf[j] + 1 || !this.cont[nx] || !this.okS[nx]) continue;
        p2w += V.w[n];
        for (let st = 0; st < STEPS; st++) if (this.bits[nx * 3 + c] >> st & 1) p2[st] += V.w[n];
      }
      for (let st = 0; st < STEPS; st++) this.pred[c * 2 * STEPS + STEPS + st] = p2w > 0 && p2[st] / p2w > 0.5 ? 1 : 0;
    }
    this.predK = V.k;
  }
};
