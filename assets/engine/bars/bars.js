// THE BAR FINGERPRINT STORE (live step 3, 2026-09-28; docs/AUDIT-live-grid.md "Step 3", DECISIONS §50). Pure DSP: no DOM,
// no clock, no Math.random — node-testable (tools/test_bars.js), fed once per frame by features-bars.js.
//
// Electronic music repeats bar by bar, so the next hit is predictable from what followed the bars that looked like this
// one. Per bar the store keeps three 16-step onset patterns (kick / snare / hat as 16-bit ints, quantised on the beat grid
// it is given) and a per-beat energy vector (DIM floats, the mean of `feat` over each beat; bars/feed.js). The bar being heard is
// matched against the history (a flat ring of NBAR bars) by
//     sim = the weighted mean of: the two bars before it vs the two before a candidate (context), the steps of this bar
//           ALREADY HEARD vs the same steps of the candidate (bits + the completed beats' energies), + a small bonus
//           for a candidate 4 / 8 / 16 bars back,
// and each step is predicted by a similarity-weighted vote of the best TOPK candidates' bits at that step (for the next
// bar, the candidates' successors). A step is decided only from steps BEFORE it — its own onset never votes for it —
// and released when the grid crosses its line (the frame nearest it, the ears' release rule).
//
// Time: every position is in beats on ONE grid, the caller's heard beat count `B` (onsets arrive placed on it by their
// ages). Bars are 4 beats from `a`, the bar phase (0..3), which the caller may move (`anchor`); a move, a tempo jump or a
// seek is a discontinuity: the open bars are dropped and the context restarts.
//
// Section events: a bar whose first steps contradict a confident prediction is a section start (`novel`, released on
// the step it is found, ~1.25-2 beats into the bar); if those steps instead match an older bar (>= RET_MIN bars back)
// clearly better than the prediction, it is a return (`ret`). Degrade: no trusted history, `ok` false, silence, a
// discontinuity -> conf 0 and no predicted events. Never invent.

import { SECTIONS } from './sections.js';
import { NBAR, DIM, W_CLS, EPS, pop } from './common.js';

export { NBAR, DIM };

export const STEPS = 16;          // per bar: 16ths
export const TOPK = 8;            // candidates in a vote
export const TAU = 0.04;          // vote weight exp((sim - best) / TAU)
export const CONF_MIN = 0.35;     // predConf below this releases no predicted event
export const CLOSE_M = 0.35;      // beats after a bar's end before it is closed: the capture path's +52 ms detection lag and
                                  // a late onset's rounding must land in it first
export const NOV_STEPS = [5, 8];  // the steps at which a bar is tested for a section change (bars/sections.js)
export const OFF_MAX = 0.4;       // steps: the largest micro-timing offset a class may learn (+-40 ms at 150 BPM)
export const OFF_RATE = 0.05;     // the offset's EMA rate per onset


export const BARS_OUT = ['predKickEvt', 'predSnareEvt', 'predHatEvt', 'predKickIn', 'predConf', 'barMatch', 'barNovelEvt', 'barReturnEvt'];

function mkBar(k) {
  // guess: the steps predicted for this bar, released or not (graded against `bits` when it closes); g: any step decided
  return { k, bits: [0, 0, 0], E: new Float32Array(4 * DIM), n: new Float32Array(4), ok: true, guess: [0, 0, 0], g: 0 };
}

export class Bars {
  constructor() {
    this.a = 0;                    // bar phase: bar k = beats [4k + a, 4k + a + 4)
    this.aCand = -1; this.aT = 0;  // a proposed phase and the beat it was first proposed at
    this.seq = 0;                  // bars stored
    this.bits = new Uint16Array(NBAR * 3);
    this.E = new Float32Array(NBAR * 4 * DIM);
    this.kOf = new Float64Array(NBAR);  // the bar number each slot holds
    this.cont = new Uint8Array(NBAR);   // 1: the slot before holds bar k - 1 (a contiguous predecessor)
    this.okS = new Uint8Array(NBAR);    // 1: trusted (the grid was ok all bar)
    this.open = new Map();              // bar number -> the bar being filled
    this.lastK = null;                  // the newest stored bar number
    this.gRel = null;                   // the next global step to release
    this.pred = new Uint8Array(3 * 2 * STEPS);  // this bar's and the next bar's predicted steps, per class
    this.predK = null;                  // the bar number pred[0..15] is for
    this.conf = 0; this.match = 0; this.rel = 0.5; this.relN = 0;
    this.lastV = null;                  // the last vote (its successors predict the first steps of the next bar)
    this.ctx1 = new Float32Array(NBAR); this.ctx2 = new Float32Array(NBAR); this.ctxSeq = -1;
    this.tq = new Float32Array(4 * DIM);  // the heard bar's per-beat means (scratch)
    this.lastEvtK = -99;
    this.lastRet = null;                // the last return: { k: its bar, src: the bar it matched }
    this.pB = null; this.pBpm = 0;
    // MICRO-TIMING: per class, where its onsets land against their step line (steps, EMA over onsets). A class is released
    // at its line + its offset, so a predicted hit lands where that class's hits are heard, not on the bare grid (on the
    // SeeYouDrop groove the causal kicks sit +25 ms after the heard v3 line, the hats on it)
    this.off = new Float64Array(3);
    this.q = [];                        // decided, not yet released: { c, y } (y = the release position, grid beats)
    this.out = {};
    for (const k of BARS_OUT) this.out[k] = 0;
    this.out.predKickIn = -1;
  }

  // one frame. i = { B, rel, bpm, ok, anchor, onsets: [{c, x}], feat, lead }:
  //   B      heard beat position (continuous) · rel  the position predictions are released at (B + a display lead)
  //   bpm    the grid's tempo · ok  the grid is usable now · anchor  a proposed bar phase 0..3 or -1
  //   onsets new onsets placed on the grid (c 0 kick / 1 snare / 2 hat, x in beats) · feat  DIM floats now
  //   lead   the release rule's lead in beats (half a frame)
  step(i) {
    const o = this.out;
    o.predKickEvt = o.predSnareEvt = o.predHatEvt = o.barNovelEvt = o.barReturnEvt = 0;
    const B = i.B;
    if (!(i.bpm > 0) || !isFinite(B)) { this.degrade(); return o; }
    // a discontinuity: a seek (B jumps), a tempo jump (> 4 %) -> the open bars go, the context restarts
    if (this.pB !== null && (B < this.pB - 0.5 || B > this.pB + 2 || Math.abs(i.bpm / this.pBpm - 1) > 0.04)) this.cut();
    this.pB = B; this.pBpm = i.bpm;
    this.phase(i.anchor, B);
    const y = B - this.a;
    // onsets into their bar's bits (the nearest 16th); the bar is opened on demand, so a slightly early downbeat onset lands
    // in the next bar even while the previous one is still open
    for (const e of i.onsets) {
      const g = Math.round((e.x - this.a) * 4), k = Math.floor(g / STEPS), s = g - k * STEPS;
      if (this.lastK !== null && k <= this.lastK) continue;       // its bar is already closed
      const b = this.bar(k);
      b.bits[e.c] |= 1 << s;
      const d = (e.x - this.a) * 4 - g, lim = OFF_MAX;
      this.off[e.c] += (Math.max(-lim, Math.min(lim, d)) - this.off[e.c]) * OFF_RATE;
    }
    // the energies into the beat being heard
    const kc = Math.floor(y / 4), q = Math.min(3, Math.floor(y - 4 * kc));
    const bc = this.bar(kc);
    if (!i.ok) bc.ok = false;
    const E = bc.E, off = q * DIM;
    for (let d = 0; d < DIM; d++) E[off + d] += i.feat[d];
    bc.n[q]++;
    // close every bar that ended CLOSE_M beats ago
    for (const [k, b] of this.open) if (y >= 4 * (k + 1) + CLOSE_M) this.close(b);
    // decide every step whose line (+ the earliest class offset) the grid crossed since the last frame, then release each
    // decided class when the grid reaches its line + that class's offset (the nearest frame: y + lead >= it)
    const yr = i.rel - this.a + i.lead, dmin = Math.min(0, this.off[0], this.off[1], this.off[2]);
    const gNow = Math.floor(yr * 4 - dmin);
    if (this.gRel === null) this.gRel = gNow + 1;
    let n = 0;
    while (this.gRel <= gNow && n++ < 8) { this.release(this.gRel, i.ok); this.gRel++; }
    if (this.gRel <= gNow) this.gRel = gNow + 1;                 // a stall: skip, never burst
    let k = 0;
    for (let j = 0; j < this.q.length; j++) {
      const e = this.q[j];
      if (yr >= e.y) { if (e.c === 0) o.predKickEvt = 1; else if (e.c === 1) o.predSnareEvt = 1; else o.predHatEvt = 1; }
      else if (yr > e.y - 1) this.q[k++] = e;                    // (a stale entry after a jump is dropped)
    }
    this.q.length = k;
    o.predConf = this.conf; o.barMatch = this.match;
    o.predKickIn = this.kickIn(yr);
    return o;
  }

  degrade() { this.conf = 0; this.out.predConf = 0; this.out.predKickIn = -1; }
  cut() { this.open.clear(); this.lastK = null; this.gRel = null; this.predK = null; this.conf = 0; this.q.length = 0; this.lastV = null; this.cand0 = null; this.ctxSeq = -1; }

  // the bar phase: a proposal must hold for two bars before the grid moves to it
  phase(p, B) {
    if (p < 0 || p === this.a) { this.aCand = -1; return; }
    if (p !== this.aCand) { this.aCand = p; this.aT = B; return; }
    if (B - this.aT >= 8) { this.a = p; this.aCand = -1; this.cut(); }
  }

  bar(k) {
    let b = this.open.get(k);
    if (!b) { b = mkBar(k); this.open.set(k, b); }
    return b;
  }

  close(b) {
    this.open.delete(b.k);
    const j = this.seq % NBAR;
    for (let c = 0; c < 3; c++) this.bits[j * 3 + c] = b.bits[c];
    let any = 0;
    for (let q = 0; q < 4; q++) {
      const m = b.n[q] > 0 ? 1 / b.n[q] : 0;
      if (!b.n[q]) b.ok = false;
      for (let d = 0; d < DIM; d++) { const v = b.E[q * DIM + d] * m; this.E[(j * 4 + q) * DIM + d] = v; any += v; }
    }
    if (any <= 1e-6) b.ok = false;                               // silence is not a pattern
    this.cont[j] = this.lastK !== null && b.k === this.lastK + 1 ? 1 : 0;
    this.okS[j] = b.ok ? 1 : 0;
    this.kOf[j] = b.k;
    // grade what was released for this bar against what it heard: the continuation reliability behind predConf
    // (precision: of the steps it predicted, the share heard — an extra or a missed onset in what the ears heard is their
    // noise, a predicted hit that did not come is the harm a released event does)
    if (b.g >= STEPS / 2 && b.ok) {
      let hit = 0, all = 0;
      for (let c = 0; c < 3; c++) { hit += W_CLS[c] * pop(b.guess[c] & b.bits[c]); all += W_CLS[c] * pop(b.guess[c]); }
      const acc = all > 0 ? hit / all : 1;
      this.relN = Math.min(this.relN + 1, 8);
      this.rel += (acc - this.rel) / this.relN;
    }
    this.lastK = b.k; this.seq++;
  }

  // slot j of the stored bar `back` bars before the newest (0 = newest), or -1
  slot(back) { return back < this.seq && back < NBAR ? (this.seq - 1 - back) % NBAR : -1; }

  // full-bar similarity of two stored slots
  simSlots(i, j) {
    let dif = 0, uni = 0;
    for (let c = 0; c < 3; c++) { const x = this.bits[i * 3 + c], y = this.bits[j * 3 + c]; dif += W_CLS[c] * pop(x ^ y); uni += W_CLS[c] * pop(x | y); }
    const sb = 1 - dif / (uni + 1);
    let se = 0;
    for (let q = 0; q < 4; q++) se += this.simE(this.E, (i * 4 + q) * DIM, this.E, (j * 4 + q) * DIM);
    return 0.5 * sb + 0.5 * se / 4;
  }

  simE(A, ia, Bv, ib) {
    let d = 0;
    for (let k = 0; k < DIM; k++) { const x = A[ia + k], y = Bv[ib + k]; d += Math.abs(x - y) / (Math.abs(x) + Math.abs(y) + EPS); }
    return 1 - d / DIM;
  }

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
  }

  // the heard bar's per-beat energy means for its completed beats (< qb) into tq
  heardE(cur, qb) {
    for (let q = 0; q < qb; q++) {
      const m = cur.n[q] ? 1 / cur.n[q] : 0;
      for (let d = 0; d < DIM; d++) this.tq[q * DIM + d] = cur.E[q * DIM + d] * m;
    }
  }

  // similarity of the heard part of `cur` (steps < s, beats < s/4) to stored slot j: bits (weight wb) + energies (we each)
  heardSim(cur, j, s, wb, we) {
    const mask = s >= STEPS ? 0xffff : (1 << s) - 1, qb = s >> 2;
    let dif = 0, uni = 0;
    for (let c = 0; c < 3; c++) { const x = cur.bits[c] & mask, y = this.bits[j * 3 + c] & mask; dif += W_CLS[c] * pop(x ^ y); uni += W_CLS[c] * pop(x | y); }
    let num = wb * (1 - dif / (uni + 1)), den = wb;
    for (let q = 0; q < qb; q++) if (cur.n[q]) { num += we * this.simE(this.tq, q * DIM, this.E, (j * 4 + q) * DIM); den += we; }
    return [num, den];
  }

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
  }

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
  }

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

  // the global step g's line has been crossed: decide it from the steps before it, release it, test for a change
  release(g, ok) {
    const kc = Math.floor(g / STEPS), s = g - kc * STEPS;
    // bar kc - 1 still open (its last onsets may yet arrive): its last vote's successors are the prediction
    const V = this.lastK !== kc - 1 && this.open.has(kc - 1)
      ? (this.lastV && this.lastV.k === kc - 1 ? this.succ(this.lastV, kc, s) : { k: kc, s, idx: [], sc: [], w: [], best: 0 })
      : this.vote(kc, s);
    if (V.idx.length && (this.lastK === kc - 1)) this.lastV = V;
    else if (this.lastV && this.lastV.k !== kc - 1 && this.lastV.k !== kc) this.lastV = null;
    const W = V.w.reduce((x, y) => x + y, 0);
    // agreement of the vote at this step (1 = every candidate agrees), the mean over the classes any candidate plays
    let agree = 1;
    if (W) {
      let a = 0, na = 0;
      for (let c = 0; c < 3; c++) {
        let p = 0;
        for (let n = 0; n < V.idx.length; n++) if (this.bits[V.idx[n] * 3 + c] >> s & 1) p += V.w[n];
        p /= W;
        if (p > 0.05) { a += Math.abs(2 * p - 1); na++; }
      }
      agree = na ? a / na : 1;
    }
    const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
    this.match = V.best;
    this.conf = ok && V.idx.length ? cl((V.best - 0.5) / 0.4) * cl(this.rel) * (0.5 + 0.5 * agree) : 0;
    this.predict(V);
    const bk = this.lastK !== null && kc <= this.lastK ? null : this.bar(kc);
    if (bk && V.idx.length) bk.g++;
    for (let c = 0; c < 3; c++) {
      if (!this.pred[c * 2 * STEPS + s]) continue;
      if (bk) bk.guess[c] |= 1 << s;
      if (this.conf >= CONF_MIN) this.q.push({ c, y: (g + this.off[c]) / 4 });
    }
    if (s === 0) this.cand0 = { conf: this.conf, V };
    if (NOV_STEPS.includes(s)) this.change(kc, s, ok);
  }

  // beats from the release position to the next predicted kick (this bar's and the next bar's prediction), -1 if none
  kickIn(yr) {
    if (this.predK === null || this.conf < CONF_MIN) return -1;
    const g0 = Math.floor(yr * 4) + 1;
    for (let g = g0; g < (this.predK + 2) * STEPS; g++) {
      const k = Math.floor(g / STEPS), st = g - k * STEPS, row = k === this.predK ? 0 : k === this.predK + 1 ? STEPS : -1;
      if (row < 0) continue;
      if (this.pred[row + st]) return Math.max(0, g / 4 - yr);
    }
    return -1;
  }
}

Object.assign(Bars.prototype, SECTIONS);
