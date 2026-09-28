// Bars mixin: the SECTION tests on the bar being heard (live step 3; bars.js assigns these to Bars.prototype, as synapse's
// structure.js is to its Analyzer). A section start and a return are found on the first steps of a bar (NOV_STEPS), from
// the bar's heard part against the recent bars and the history — see change().
import { DIM, NBAR, EPS, W_CLS, pop } from './common.js';

export const NREC_MIN = 4;        // ... at least this many of them (contiguous and trusted)
export const NREC = 8;            // the recent bars (the section being played: two 4-bar phrases) a change is tested against
export const NOV_SIM = 0.5;       // the heard part is a section start when its best energy match to the recent bars is below this
export const NOV_GAP = 0.3;       // ... and at least this below how alike the recent bars were to each other
export const RET_MIN = 8;         // bars: a return's source is at least this far back
export const RET_SIM = 0.8;       // ... matches the heard part (energy + bits) at least this well
export const RET_GAIN = 0.15;     // ... this much better than the recent bars do
export const RET_OTHER = 0.7;     // ... and is itself less like the recent bars than this (another section's material)
export const REFRACT = 2;         // bars between two section events

export const SECTIONS = {
  // the energy similarity of a SECTION change: 1 - the mean of the TOP3 largest per-dim distances (a change moves a few
  // dims a lot — the sub arriving moves sub / bassS / subGate / subPure — and the plain mean over DIM dilutes it)
  simTop(A, ia, Bv, ib) {
    let d1 = 0, d2 = 0, d3 = 0;
    for (let k = 0; k < DIM; k++) {
      const x = A[ia + k], y = Bv[ib + k], d = Math.abs(x - y) / (Math.abs(x) + Math.abs(y) + EPS);
      if (d > d1) { d3 = d2; d2 = d1; d1 = d; } else if (d > d2) { d3 = d2; d2 = d; } else if (d > d3) d3 = d;
    }
    return 1 - (d1 + d2 + d3) / 3;
  },
  // over the beats < qb: the heard bar (tq) vs stored slot j, or stored slot i vs stored slot j
  topHeard(j, qb) { let v = 0; for (let q = 0; q < qb; q++) v += this.simTop(this.tq, q * DIM, this.E, (j * 4 + q) * DIM); return v / qb; },
  topSlots(i, j, qb) { let v = 0; for (let q = 0; q < qb; q++) v += this.simTop(this.E, (i * 4 + q) * DIM, this.E, (j * 4 + q) * DIM); return v / qb; },

  // Tested on the heard part of bar kc (steps < s, beats < s/4), against the last NREC bars (the section being played):
  //   A SECTION START: unlike every recent bar while those were like each other (a homogeneous section), in energy
  //     (simTop: near < NOV_SIM and near < hom - NOV_GAP).
  //   A RETURN: an older bar (>= RET_MIN back) matches the heard part (energy + bits) >= RET_SIM and RET_GAIN better than
  //     the recent bars do, and that bar is itself unlike the recent bars (< RET_OTHER: material from another section,
  //     not an earlier bar of this one). A return is a section start too (both events fire).
  change(kc, s, ok) {
    if (!ok || kc - this.lastEvtK < REFRACT || this.lastK !== kc - 1) return;
    const cur = this.open.get(kc), qb = s >> 2;
    if (!cur || !qb) return;
    const rec = [];
    for (let n = 0; n < NREC; n++) {
      const j = this.slot(n);
      if (j < 0 || !this.okE[j] || this.kOf[j] !== kc - 1 - n) break;
      rec.push(j);
    }
    if (rec.length < NREC_MIN) return;
    this.heardE(cur, qb);
    const both = (j) => { const [x, y] = this.heardSim(cur, j, s, 1, 0); return 0.5 * this.topHeard(j, qb) + 0.5 * x / y; };
    const bothSlots = (i, j) => {
      let dif = 0, uni = 0;
      for (let c = 0; c < 3; c++) { const x = this.bits[i * 3 + c], y = this.bits[j * 3 + c]; dif += W_CLS[c] * pop(x ^ y); uni += W_CLS[c] * pop(x | y); }
      return 0.5 * this.topSlots(i, j, qb) + 0.5 * (1 - dif / (uni + 1));
    };
    let near = 0, hom = 0, recB = 0;
    for (const j of rec) { near = Math.max(near, this.topHeard(j, qb)); recB = Math.max(recB, both(j)); }
    for (let n = 1; n < rec.length; n++) hom += this.topSlots(rec[n - 1], rec[n], qb);
    hom /= rec.length - 1;
    const nb = Math.min(this.seq, NBAR);
    let best = 0, bj = -1;
    for (let n = rec.length; n < nb; n++) {
      const j = this.slot(n);
      if (!this.okE[j] || kc - this.kOf[j] < RET_MIN) continue;
      const v = both(j);
      if (v > best) { best = v; bj = j; }
    }
    let other = 0;
    if (bj >= 0) for (const j of rec) other = Math.max(other, bothSlots(bj, j));
    // the returned material simply going on is not a new return: its source moving forward no faster than time since the
    // last return (a fill bar in a returned loop; the source a return first matches is ambiguous by a bar or two)
    const R = this.lastRet, dk = this.kOf[bj] - (R ? R.src : 0), onward = R && bj >= 0 && kc - R.k <= NREC && dk >= 0 && dk <= kc - R.k;
    const ret = best >= RET_SIM && best - recB >= RET_GAIN && other < RET_OTHER && !onward;
    const nov = ret || (near < NOV_SIM && near < hom - NOV_GAP);
    this.nov = { near, hom, best, recB, other };
    if (!nov) return;
    this.lastEvtK = kc;
    this.out.barNovelEvt = 1;
    if (ret) { this.out.barReturnEvt = 1; this.lastRet = { k: kc, src: this.kOf[bj] }; }
  }
};
