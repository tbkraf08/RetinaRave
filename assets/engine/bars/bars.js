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
//
// WARM-UP (2026-09-28, docs/AUDIT-live-grid.md "Step 3 — warm-up"): from a cold start the v3 clock cuts its tempo once and
// then pulls its phase in for 2-4 s; onsets placed meanwhile sit up to a 16th off (the reliability grading goes quiet on
// the bars they fill: measured, the first releases are as precise as a warm store's) and would teach the micro-timing
// offsets the pull-in instead of the groove. So the grid must SETTLE before the offsets learn from it: per bar the clock's SLIP (how far B moved against its own tempo, the PLL pulling) is summed,
// and after a start or a discontinuity the grid counts as settled once WARM.SET_BARS bars in a row slipped less than
// WARM.SLIP_SET (or WARM.SET_MAX bars passed). The micro-timing offsets learn on a settled grid only, as the MEDIAN of each
// class's last OFF_WIN residuals (a new groove after an intro is followed within half a window), and the reliability is
// earned (x relN / WARM.REL_N0) and reset at a discontinuity. WARM.GATE = 1 also untrusts an unsettled grid's bars and
// releases nothing until it settles (off: measured no better, 2-3 s quieter — docs/AUDIT-live-grid.md "W.1").

import { SECTIONS } from './sections.js';
import { MATCH, STEPS, TOPK, TAU } from './vote.js';
import { NBAR, DIM, W_CLS, EPS, pop } from './common.js';

export { NBAR, DIM, STEPS, TOPK, TAU };

export const CONF_MIN = 0.35;     // predConf below this releases no predicted event
export const CLOSE_M = 0.35;      // beats after a bar's end before it is closed: the capture path's +52 ms detection lag and
                                  // a late onset's rounding must land in it first
export const NOV_STEPS = [5, 8];  // the steps at which a bar is tested for a section change (bars/sections.js)
export const OFF_MAX = 0.4;       // steps: the largest micro-timing offset a class may learn (+-40 ms at 150 BPM)
export const OFF_RING = 32;       // the residual ring's size (WARM.OFF_WIN <= it)
export const OFF_WIN = 16;        // the offset is the MEDIAN of a class's last OFF_WIN residuals (a settled grid's): it follows a
                                  // new groove within half a window (an EMA at 0.05 took 13 s when the drums came in after an intro)
// the warm-up's knobs (a mutable object so tools/bars-replay.js --set can tune them; nothing else writes it)
export const WARM = {
  GATE: 0,                        // 1: an unsettled grid's bars are untrusted and release nothing (measured: no gain in timing or
                                  //    precision once the offsets are a median, 2-3 s more quiet — off); 0: settling times the offsets
  OFF_SET: 1,                     // 1: the offsets learn on a settled grid only; 0: from the first onset (GATE / OFF_SET = the
                                  //    ruler's A/B switches, docs/AUDIT-live-grid.md "W.1")
  SLIP_SET: 0.05,                 // beats: a bar slipping less than this counts toward settling
  SET_BARS: 2,                    // ... this many in a row settle the grid (they are trusted, the bars before are not)
  SET_MAX: 6,                     // bars after a start / discontinuity: settled anyway (a hunting clock does not get better)
  SLIP_BAR: 0.12,                 // beats: settled, a bar slipping more than this is untrusted
  LIFE_MIN: 8,                    // bars: a tempo cut before the grid lived this long untrusts the bars it stored
  OFF_WIN,                        // residuals in the offset's median (bars.js OFF_WIN)
  REL_N0: 2                       // graded bars before the reliability counts in full (x relN / REL_N0 until then)
};


export const BARS_OUT = ['predKickEvt', 'predSnareEvt', 'predHatEvt', 'predKickAge', 'predSnareAge', 'predHatAge', 'predKick', 'predSnare',
  'predHat', 'predKickIn', 'predConf', 'barMatch', 'barNovelEvt', 'barReturnEvt'];
export const PRED_DECAY = 0.16;   // s: predKick / predSnare / predHat decay like synapse's kick / snare / hat levels (TORUS2)
const AGE_OUT = ['predKickAge', 'predSnareAge', 'predHatAge'], LVL_OUT = ['predKick', 'predSnare', 'predHat'];

function mkBar(k) {
  // guess: the steps predicted for this bar, released or not (graded against `bits` when it closes); g: any step decided
  return { k, bits: [0, 0, 0], E: new Float32Array(4 * DIM), n: new Float32Array(4), ok: true, guess: [0, 0, 0], g: 0, slip: 0 };
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
    this.okS = new Uint8Array(NBAR);    // 1: trusted (the grid was ok all bar, settled, did not move under it: its BITS vote)
    this.okE = new Uint8Array(NBAR);    // 1: its energies are usable (the grid was ok all bar: the section tests, bars/sections.js —
                                        //    a per-beat energy mean does not care about a grid 50 ms off, a 16th pattern does)
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
    // WARM-UP: settled once WARM.SET_BARS quiet bars in a row closed after the last start / discontinuity
    this.settled = false; this.quietN = 0; this.pend = []; this.lifeSeq = 0;
    // MICRO-TIMING: per class, where its onsets land against their line (steps, EMA); a class is released at line + offset
    // (on the SeeYouDrop groove the causal kicks sit +25 ms after the heard v3 line, the hats on it)
    this.off = new Float64Array(3); this.offN = new Float64Array(3);  // learned on a settled grid only
    this.offR = [0, 1, 2].map(() => new Float64Array(OFF_RING)); this.offS = new Float64Array(OFF_RING);
    this.q = [];                        // decided, not yet released: { c, y } (y = the release position, grid beats)
    this.lastY = [NaN, NaN, NaN];       // per class, the grid position of the last released prediction (its age's origin)
    this.out = {};
    for (const k of BARS_OUT) this.out[k] = 0;
    this.out.predKickIn = -1;
    for (const k of AGE_OUT) this.out[k] = 99;
  }

  // one frame. i = { B, rel, bpm, ok, anchor, onsets: [{c, x}], feat, lead }:
  //   B      heard beat position (continuous) · rel  the position predictions are released at (B + a display lead)
  //   bpm    the grid's tempo · ok  the grid is usable now · anchor  a proposed bar phase 0..3 or -1
  //   onsets new onsets placed on the grid (c 0 kick / 1 snare / 2 hat, x in beats) · feat  DIM floats now
  //   lead   the release rule's lead in beats (half a frame) · dt  the frame interval (s; absent = no slip measured)
  step(i) {
    const o = this.out;
    o.predKickEvt = o.predSnareEvt = o.predHatEvt = o.barNovelEvt = o.barReturnEvt = 0;
    const B = i.B;
    if (!(i.bpm > 0) || !isFinite(B)) { this.degrade(); return o; }
    // a discontinuity: a seek (B jumps), a tempo jump (> 4 %) -> the open bars go, the context restarts
    let slip = 0;
    if (this.pB !== null && (B < this.pB - 0.5 || B > this.pB + 2 || Math.abs(i.bpm / this.pBpm - 1) > 0.04)) { this.cut(); this.unsettle(); }
    else if (this.pB !== null && i.dt > 0) slip = B - this.pB - i.bpm / 60 * i.dt;
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
      if (this.settled || !WARM.OFF_SET) this.learnOff(e.c, Math.max(-lim, Math.min(lim, d)));
    }
    // the energies into the beat being heard
    const kc = Math.floor(y / 4), q = Math.min(3, Math.floor(y - 4 * kc));
    const bc = this.bar(kc);
    if (!i.ok) bc.ok = false;
    bc.slip += slip;
    const E = bc.E, off = q * DIM;
    for (let d = 0; d < DIM; d++) E[off + d] += i.feat[d];
    bc.n[q]++;
    // close every bar that ended CLOSE_M beats ago
    for (const [k, b] of this.open) if (y >= 4 * (k + 1) + CLOSE_M) this.close(b);
    // decide each step whose line (+ the earliest class offset) was crossed, release each class at line + its offset (the
    // nearest frame: y + lead >= it)
    const yr = i.rel - this.a + i.lead, dmin = Math.min(0, this.off[0], this.off[1], this.off[2]);
    const gNow = Math.floor(yr * 4 - dmin);
    if (this.gRel === null) this.gRel = gNow + 1;
    let n = 0;
    while (this.gRel <= gNow && n++ < 8) { this.release(this.gRel, i.ok); this.gRel++; }
    if (this.gRel <= gNow) this.gRel = gNow + 1;                 // a stall: skip, never burst
    let k = 0;
    for (let j = 0; j < this.q.length; j++) {
      const e = this.q[j];
      if (yr >= e.y) { if (e.c === 0) o.predKickEvt = 1; else if (e.c === 1) o.predSnareEvt = 1; else o.predHatEvt = 1; this.lastY[e.c] = e.y; }
      else if (yr > e.y - 1) this.q[k++] = e;                    // (a stale entry after a jump is dropped)
    }
    this.q.length = k;
    // the ages of the last predicted hits in heard s (as kickAge: within half a frame of 0 on the release frame), and levels
    const yNow = i.rel - this.a;
    for (let c = 0; c < 3; c++) {
      const y0 = this.lastY[c], age = y0 === y0 ? (yNow - y0) * 60 / i.bpm : 99;
      o[AGE_OUT[c]] = age; o[LVL_OUT[c]] = age < 99 ? Math.exp(-Math.max(0, age) / PRED_DECAY) : 0;
    }
    o.predConf = this.conf; o.barMatch = this.match;
    o.predKickIn = this.kickIn(yr);
    return o;
  }

  // the class's offset = the median of its last OFF_WIN residuals (fewer until the ring fills)
  learnOff(c, d) {
    const R = this.offR[c], W = Math.min(WARM.OFF_WIN, OFF_RING), n = Math.min(++this.offN[c], W);
    R[(this.offN[c] - 1) % OFF_RING] = d;
    const S = this.offS;
    for (let k = 0; k < n; k++) S[k] = R[(this.offN[c] - 1 - k + OFF_RING * 4) % OFF_RING];
    const v = S.subarray(0, n).sort();
    this.off[c] = n & 1 ? v[n >> 1] : 0.5 * (v[n / 2 - 1] + v[n / 2]);
  }

  degrade() { this.conf = 0; this.out.predConf = 0; this.out.predKickIn = -1; }
  // a discontinuity (a seek, a tempo jump): the grid must settle again; a grid that lived under WARM.LIFE_MIN bars was a
  // clock still looking, and the bars it stored are untrusted
  unsettle() {
    if (WARM.GATE === 1 && this.seq - this.lifeSeq < WARM.LIFE_MIN) for (let n = this.lifeSeq; n < this.seq; n++) this.okS[n % NBAR] = 0;
    this.settled = false; this.quietN = 0; this.pend.length = 0; this.lifeSeq = this.seq;
    this.rel = 0.5; this.relN = 0; this.off.fill(0); this.offN.fill(0);   // measured on the old grid
  }
  cut() { this.open.clear(); this.lastK = null; this.gRel = null; this.predK = null; this.conf = 0; this.q.length = 0; this.lastY.fill(NaN); this.lastV = null; this.cand0 = null; this.ctxSeq = -1; }

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
    // WARM-UP: trusted only on a settled grid that did not move under the bar (see the header)
    const sl = Math.abs(b.slip);
    this.okE[j] = b.ok ? 1 : 0;
    if (this.settled) this.okS[j] = b.ok && (sl <= WARM.SLIP_BAR || WARM.GATE !== 1) ? 1 : 0;
    else {
      this.okS[j] = b.ok && WARM.GATE !== 1 ? 1 : 0;
      if (b.ok && sl < WARM.SLIP_SET) { this.quietN++; this.pend.push(j); } else { this.quietN = 0; this.pend.length = 0; }
      if (this.quietN >= WARM.SET_BARS || this.seq + 1 - this.lifeSeq >= WARM.SET_MAX) { this.settled = true; for (const q of this.pend) this.okS[q] = 1; this.pend.length = 0; }
      if (!b.ok) this.okS[j] = 0;
    }
    this.kOf[j] = b.k;
    // grade what was released for this bar against what it heard: the continuation reliability behind predConf
    // (precision: of the steps it predicted, the share heard — an extra or a missed onset in what the ears heard is their
    // noise, a predicted hit that did not come is the harm a released event does)
    if (b.g >= STEPS / 2 && this.okS[j]) {
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
    this.conf = ok && (this.settled || WARM.GATE !== 1) && V.idx.length ? cl((V.best - 0.5) / 0.4) * cl(this.rel) * (WARM.REL_N0 > 0 ? Math.min(1, this.relN / WARM.REL_N0) : 1) * (0.5 + 0.5 * agree) : 0;
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

  // THE STEPS STILL TO COME (live step 5, the queue): every hit the store will release after the release position yr0
  // (bar-relative beats, no half-frame lead) — the decided ones waiting for their class offset (q) and the predicted ones of
  // this bar and the next (pred[], the same bits release() reads), each as { c, dy: beats ahead, conf }. Nothing is
  // re-predicted: a bit the next re-vote clears is gone from the next call (a withdrawal), and below CONF_MIN the store
  // releases nothing, so nothing is listed. `out` is reused. Read-only: the store's state is untouched.
  upcoming(yr0, out) {
    out.length = 0;
    for (let j = 0; j < this.q.length; j++) { const e = this.q[j]; if (e.y > yr0) out.push({ c: e.c, dy: e.y - yr0, conf: this.conf }); }
    if (this.predK === null || this.conf < CONF_MIN) return out;
    const g0 = this.gRel === null ? Math.floor(yr0 * 4) + 1 : this.gRel;
    for (let g = g0; g < (this.predK + 2) * STEPS; g++) {
      const k = Math.floor(g / STEPS), st = g - k * STEPS, row = k === this.predK ? 0 : k === this.predK + 1 ? STEPS : -1;
      if (row < 0) continue;
      for (let c = 0; c < 3; c++) {
        if (!this.pred[c * 2 * STEPS + row + st]) continue;
        const dy = (g + this.off[c]) / 4 - yr0;
        if (dy > 0) out.push({ c, dy, conf: this.conf });
      }
    }
    return out;
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

Object.assign(Bars.prototype, MATCH, SECTIONS);
