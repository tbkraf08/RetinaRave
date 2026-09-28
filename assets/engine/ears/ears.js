// The ears: one causal, pure-DSP facade over the stream. Blocks of 512 go in, one reused `out` object comes out,
// evaluated at HEARD time. No DOM, no window, no clock, no Math.random — so it runs in node, in the page and in a Worker.
//
// Continuous fields are kept in a ring by audio time and read back (interpolated) at `tHeard`; the newest value is
// returned when tHeard is past the analysis (capture mode). Events are released at heard time: an onset detected with
// audio time t fires its `…Evt` on the first read(tHeard) with tHeard >= t, exactly once, and `…Age` = tHeard - t from
// then on (99 before any). An onset found late fires on the next read with its TRUE age — never re-timed to the read.
import { SubTrack } from './sub.js';
import { PercTrack, B_SUB, B_LOWBASS, B_HARM } from './perc.js';
import { TonicTrack } from './tonic.js';
import { TextureTrack } from './texture.js';
import { PulseTrack } from './pulse.js';
import { clamp01 } from './dsp.js';

export const EARS_FIELDS = [
  'subHz', 'subCents', 'subNote', 'subConf', 'subGlide', 'subNoteEvt', 'subPure', 'subGate', 'subIn', 'subOut',
  'tonic', 'tonicMinor', 'tonicConf', 'bassReg',
  'kickEvt', 'snareEvt', 'hatEvt', 'kickAge', 'snareAge', 'hatAge', 'kickVel', 'snareVel', 'hatVel',
  'denK', 'denS', 'denH', 'pulse', 'lpSweep', 'width',
];
// the continuous fields, in the order the history ring stores them
const CONT = ['subHz', 'subCents', 'subNote', 'subConf', 'subGlide', 'subPure', 'subGate',
  'tonic', 'tonicMinor', 'tonicConf', 'bassReg', 'kickVel', 'snareVel', 'hatVel', 'denK', 'denS', 'denH',
  'pulse', 'lpSweep', 'width'];
const EVENTS = { subNote: 'subNoteEvt', subIn: 'subIn', subOut: 'subOut', kick: 'kickEvt', snare: 'snareEvt', hat: 'hatEvt' };
const AGES = { kick: 'kickAge', snare: 'snareAge', hat: 'hatAge' };
// The sub-share smoothing the gate sees, asymmetric: the sub ARRIVING must be seen at once (a symmetric 0.45 s made subIn
// 262 ms late at drop 1), the sub losing ownership of the low end is a section-level fact and may take its time (a fast
// fall made the gate chatter 5.4 times a bar through the ducked drop 2 and halved the slide count).
export const SHARE_UP = 0.012, SHARE_DOWN = 0.45;
export const HIST = 512;            // history frames (~4 s at the sub hop) — read() may look back ~60 ms
// THE RELEASE RULE. An onset at audio time t fires on the read whose heard time is NEAREST t, not on the first read at
// or after it: `t <= tHeard + lead`, with `lead = min(REL_LEAD, half the measured read interval)`. The old rule ("the
// first read with tHeard >= t") is unbiased about nothing — it always rounds UP, so it added a uniform [0, 1/60) s on
// top of the detector's own error: a mean and median of 8.3 ms and a maximum of 16.7 ms, which is why pass 1's
// first-frame kick lag was +18 ms median while its PLACED lag (t - kickAge) was +9 (tools/accept/v0.15/ruler-det-a.md).
// Rounding to the nearer frame makes the quantisation symmetric, median ~0 and |max| <= half a frame.
// The cost is that on the release frame the event is up to `lead` EARLY, so `kickAge` / `snareAge` / `hatAge` are then
// NEGATIVE, in [-lead, 0). That is stated in EARS_FEATS' formula text for the three age fields and a scene that cannot
// take a negative age must clamp at 0 — it is at most 8.3 ms, a third of a frame at 60 Hz.
// `lead` never exceeds half a frame at any frame rate: REL_LEAD caps it at 8.3 ms (half of 1/60) and the measured half
// interval caps it below that whenever the page runs FASTER than 60 Hz.
export const REL_LEAD = 1 / 120;
export const DT_MAX = 0.05;         // a read interval longer than this is a seek or a stall, not a frame, this is ample

export class Ears {
  constructor(sr, opts = {}) {
    this.sr = sr;
    this.sub = new SubTrack(sr, opts.sub || {});
    this.perc = new PercTrack(sr, opts.perc || {});
    this.tone = new TonicTrack(sr, opts.tonic || {});
    this.tex = new TextureTrack(sr);
    this.pulse = new PulseTrack(opts.pulse || {});
    this.RB = 1 << 14; this.mid = new Float32Array(this.RB); this.mask = this.RB - 1; this.w = 0;
    this.t0 = null;                  // audio time of mid[0] of the stream
    this.tEnd = 0;                   // audio time one past the newest sample
    this.hi = 0; this.hn = 0;        // history write index / count
    this.ht = new Float64Array(HIST);
    this.hv = CONT.map(() => new Float32Array(HIST));
    this.pending = [];               // detected, not yet released
    this.released = [];              // released by the last read()
    this.lastEv = Object.create(null);
    this.out = {};
    for (const k of EARS_FIELDS) this.out[k] = 0;
    for (const k of Object.values(AGES)) this.out[k] = 99;
    this.out.subNote = -1; this.out.tonic = -1; this.out.pulse = 1;
    this.blocks = 0;
    this.relLead = opts.relLead === undefined ? REL_LEAD : opts.relLead;
    this.tRead = -1; this.dtRead = 1 / 60;           // the measured read interval, for the release lead
  }
  get events() { return this.released; }
  // The release lead for this read: half a frame, never more than REL_LEAD.
  lead() { return Math.min(this.relLead, 0.5 * this.dtRead); }

  push(L, R, t0) {
    const n = L.length, sr = this.sr;
    if (this.t0 === null) this.t0 = t0;
    const sub = this.sub, perc = this.perc, tex = this.tex, mid = this.mid, mask = this.mask;
    // The sub gate needs to know whether the sub OWNS the low end; PercTrack's bank already has the three low bands.
    // Smoothed over SHARE_TAU: which layer owns the low end is a section-level fact, and the per-hop value swings with
    // every kick (unsmoothed it made the gate chatter 5.4 times a bar through drop 2 and cut the slide count in half).
    const pe = perc.e, den = pe[B_SUB] + pe[B_LOWBASS] + pe[B_HARM];
    const sh = den > 0 ? pe[B_SUB] / den : 1;
    sub.share += (sh - sub.share) * (1 - Math.exp(-(n / sr) / (sh > sub.share ? SHARE_UP : SHARE_DOWN)));
    for (let i = 0; i < n; i++) {
      const l = L[i], r = R ? R[i] : l, m = 0.5 * (l + r), t = t0 + (i + 1) / sr;
      mid[this.w & mask] = m; this.w++;
      perc.step(m, t);
      tex.step(l, r, m);
      if (sub.step(m, t)) this.snap(t);
    }
    this.tEnd = t0 + n / sr;
    this.blocks++;
    // the block-rate work: collect the percussion onsets found at the 128-sample hop, then the readouts and the slow chroma
    const ev = perc.take();
    for (let i = 0; i < ev.length; i++) if (ev[i].type !== 'low') this.pending.push(ev[i]);
    this.pulse.push(ev);
    tex.hop(this.tEnd, perc);
    this.pulse.hop(this.tEnd);
    this.tone.hop(this.tEnd, mid, this.w, mask, sub);
    if (sub.events.length) { for (const e of sub.events) this.pending.push(e); sub.events.length = 0; }
    this.snap(this.tEnd);
  }

  // one history frame: every continuous field as it stands at audio time t
  snap(t) {
    const sub = this.sub, perc = this.perc, tex = this.tex, tone = this.tone, i = this.hi;
    this.ht[i] = t;
    const v = this.hv;
    v[0][i] = sub.hz; v[1][i] = sub.cents; v[2][i] = sub.gate ? sub.note : -1; v[3][i] = sub.conf;
    v[4][i] = sub.glide; v[5][i] = tex.subPure; v[6][i] = sub.gate;
    v[7][i] = tone.pc; v[8][i] = tone.minor; v[9][i] = tone.conf; v[10][i] = tex.bassReg;
    v[11][i] = perc.vel[0]; v[12][i] = perc.vel[1]; v[13][i] = perc.vel[2];
    v[14][i] = perc.den[0]; v[15][i] = perc.den[1]; v[16][i] = perc.den[2];
    v[17][i] = this.pulse.pulse; v[18][i] = tex.lpSweep; v[19][i] = tex.width;
    this.hi = (i + 1) % HIST; if (this.hn < HIST) this.hn++;
  }

  read(tHeard) {
    const out = this.out;
    for (const k of Object.values(EVENTS)) out[k] = 0;
    this.released.length = 0;
    if (this.tRead >= 0) { const d = tHeard - this.tRead; if (d > 0 && d <= DT_MAX) this.dtRead += (d - this.dtRead) * 0.2; }
    this.tRead = tHeard;
    const rel = tHeard + this.lead();                 // the release rule: the frame NEAREST the onset
    // release every pending onset whose audio time has been reached
    let k = 0;
    for (let i = 0; i < this.pending.length; i++) {
      const e = this.pending[i];
      if (e.t <= rel) {
        const f = EVENTS[e.type];
        if (f) { out[f] = 1; this.lastEv[e.type] = e.t; }
        this.released.push(e);
      } else this.pending[k++] = e;
    }
    this.pending.length = k;
    for (const cls in AGES) out[AGES[cls]] = this.lastEv[cls] === undefined ? 99 : tHeard - this.lastEv[cls];
    // continuous fields at tHeard: the bracketing history frames, interpolated (newest when tHeard is past them)
    const n = this.hn;
    if (n === 0) return out;
    const newest = (this.hi - 1 + HIST) % HIST, oldest = (this.hi - n + HIST) % HIST;
    let a = newest, b = newest, f = 0;
    if (tHeard >= this.ht[newest]) { a = b = newest; }
    else if (tHeard <= this.ht[oldest]) { a = b = oldest; }
    else {
      let lo = 0, hi = n - 1;                              // binary search over the ring's logical order
      while (lo < hi) { const m = (lo + hi) >> 1; if (this.ht[(oldest + m) % HIST] < tHeard) lo = m + 1; else hi = m; }
      b = (oldest + lo) % HIST; a = (oldest + Math.max(0, lo - 1)) % HIST;
      const dt = this.ht[b] - this.ht[a]; f = dt > 0 ? (tHeard - this.ht[a]) / dt : 0;
    }
    const v = this.hv;
    for (let j = 0; j < CONT.length; j++) {
      const name = CONT[j], x = v[j][a], y = v[j][b];
      // a pitch class, a note index, a gate and a pulse are categorical: take the nearer frame, never the average
      out[name] = (name === 'subNote' || name === 'tonic' || name === 'tonicMinor' || name === 'subGate' || name === 'pulse')
        ? (f < 0.5 ? x : y) : x + (y - x) * f;
    }
    out.subGate = out.subGate > 0.5 ? 1 : 0;
    out.subPure = clamp01(out.subPure);
    return out;
  }
}
