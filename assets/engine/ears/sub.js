// The sub track: the 25-70 Hz 808 that IS this music's identity. Low-pass, decimate to ~2 kHz, YIN over >= 120 ms
// (40 ms holds 1.4 cycles of 35 Hz — measured in tools/truth, it fails), octave check, parabolic refinement, hop <= 10 ms.
// Pure and causal: every value it reports is derived from samples at or before the newest one pushed.
import { Biquad, Band, Yin, Quantile, clamp01, noteOf } from './dsp.js';

export const SUB_LP = 100;        // the isolation low-pass before decimation (Hz), 4th order. The truth tool uses 130; at 130 the
                                  // intro's 109 Hz mid-bass passed at full level and YIN locked to it instead of the arriving sub. A
                                  // 200 Hz version also let the 70-150 Hz bass layer in. 35 Hz is flat, 109 Hz is ~6 dB down.
export const GATE_BAND = [22, 60];  // the gate and the level are measured on THIS band (6th order), not on the YIN low-pass, so
                                  // "the sub is sounding" means the sub and not the octave above it. A causal 6th-order 22-60 Hz
                                  // band puts 100 Hz 27 dB down; on drop 1 it crosses GATE_ON at 57.621, 15 ms after the bar line.
export const SUB_SRD = 2000;      // the decimated rate we aim for (the decimation factor is round(sr / this))
export const SUB_WIN = 0.120;     // the YIN window (s): 4.2 cycles of 35 Hz. 0.040 s holds 1.4 and fails, measured.
export const SUB_HOP = 0.008;     // the YIN hop (s): the brief's ceiling is 0.010
export const SUB_FMIN = 22, SUB_FMAX = 130;   // the truth tool searches 28-130 Hz
export const SUB_THR = 0.16;      // the YIN CMND threshold
export const GATE_ON = 0.16, GATE_OFF = 0.075;   // hysteresis on the sub band's RMS as a share of its running p90
// The gate also needs the sub to be the DOMINANT part of the low end, not merely present: without this the intro's 109 Hz
// mid-bass and the 101-105 s harmonic bass read as a sub (the truth's own per-beat note there is G#2 / A#2, an octave up).
// `share` = the 22-70 band's power over 22-70 + 70-150 + 150-600, set once per block from PercTrack's filter bank.
export const GATE_SHARE_ON = 0.30, GATE_SHARE_OFF = 0.26;
export const GATE_DWELL = 0.045;  // ... and once it has changed it holds for this long (a duck is ~0.8 s apart, so this only
                                  // suppresses flutter)
export const GATE_CONFIRM = 1;    // ... and the new state must hold this many frames (16 ms) before subIn / subOut fire, so
                                  // a flutter in the void does not announce the drop 150 ms early
export const P90_STEP = 2.5e-4;   // the running p90 of that RMS: ~32 s at the 125 Hz sub hop. A 4 s follower collapsed inside the
                                  // 8 s void and the gate then opened on its rumble, firing three false notes before the drop.
export const CONF_MIN = 0.55;     // below this the pitch is not reported (subHz 0)
export const NOTE_HOLD = 0.032;   // a pitch change of >= 1 semitone must hold this long to be a new note
// A YIN window straddles a pitch change, so the FIRST frame showing the new pitch already sits ~W/2 after the real change.
// The truth's own contour is a 0.100 s YIN, so its transitions sit ~0.050 s late; backdating by (SUB_WIN-0.100)/2 puts the
// ears on the truth's clock rather than 15 ms behind it. The event still carries an audio time, never a read time.
// Measured on the walk (the truth's f0td arrivals 12.98 / 16.09 / 19.30 / 22.51): without a backdate the events land
// 61-92 ms late, which is W/2 for the pitch to appear in the window plus NOTE_HOLD/2 to confirm it. Backdating by that
// amount puts them inside +-25 ms. The event still carries an audio time and `subNoteAge` stays true.
// v0.15 pass 2 RE-MEASURED this against a reference that is read at the right frame rate. Pass 1's 0.060 s was fitted to
// `contour.f0td` indexed at its NOMINAL 100 Hz; the contour's real rate is 2205/22 = 100.2273 Hz, so at 13-23 s the
// reference itself was 30-50 ms early and the events looked 11-42 ms late when they were 62-73 ms late. The structural
// budget is bigger than pass 1 assumed: the ring's YIN window ENDS `tmax/srd` = 46 ms before the newest sample (the guard
// Yin.run needs for its longest lag), then SUB_WIN/2 = 60 ms for the new pitch to reach the window's centre, then two
// frames of the 5-frame median (16 ms) and NOTE_HOLD/2 (16 ms) — 138 ms. Swept 0.060 / 0.100 / 0.110 / 0.120 / 0.125 /
// 0.130 / 0.140 against the v2 annotation's walk arrivals: 0.125 s gives +6 / +8 / -1 / -3 ms (0.060 gave +71 / +73 /
// +64 / +62), and past 0.130 the nearest event to the first two arrivals becomes an earlier pickup note (-84 / -82 ms).
// 13 ms under the structural budget, because the new pitch is visible a little before the window's centre passes it.
export const NOTE_LAG = 0.125;
export const RETRIG_DB = 7;       // a jump of this many dB in the sub RMS while the gate is open is an 808 re-trigger
export const RETRIG_MIN = 0.090;  // ... at most this often
export const GLIDE_TAU = 0.030;   // the smoothing of the semitone/s derivative
// A 5-frame (40 ms) median over the accepted YIN pitches. Measured: on this track's kicked / ducked sub BOTH this and the
// truth's own 100 ms contour wobble by several hundred cents during a transient (the truth tool's `held` column says only
// 69-78 % of its own voiced frames sit within half a semitone of its slice median on the groove). A median is what turns a
// per-frame estimate into the note a listener hears; it costs 2 frames (16 ms) of lag on a 150 ms slide.
export const MED_N = 5;
// `subNote` is the nearest note of the median subHz. A mode filter over the last N frames was measured and rejected: at
// N = 9 it dropped the per-beat agreement with the truth from 87.1 % to 83.9 % (the window straddles a slide's landing).
// NOTE_MODE = 1 keeps the code path with no window.
export const NOTE_MODE = 1;

export class SubTrack {
  constructor(sr, o = {}) {
    this.noteLag = o.noteLag === undefined ? NOTE_LAG : o.noteLag;
    this.D = Math.max(1, Math.round(sr / SUB_SRD));
    this.srd = sr / this.D;
    this.lp = [new Biquad('lp', sr, SUB_LP, 0.541), new Biquad('lp', sr, SUB_LP, 1.307)];   // 4th-order Butterworth
    this.gb = new Band(sr, GATE_BAND[0], GATE_BAND[1], 2, 'steep6');
    this.RB = 1024; this.ring = new Float32Array(this.RB); this.mask = this.RB - 1;
    this.w = 0;                       // decimated samples written
    this.phase = 0;                   // input samples since the last decimated write
    this.hop = Math.max(4, Math.round(SUB_HOP * this.srd));
    this.W = Math.round(SUB_WIN * this.srd);
    this.yin = new Yin(this.srd, SUB_FMIN, SUB_FMAX, this.W, SUB_THR);
    this.need = this.W + this.yin.tmax + 2;
    this.nextAt = this.need;          // the decimated index at which the next YIN frame runs
    this.rms = 0; this.rmsAcc = 0; this.rmsN = 0; this.prevDb = -120;
    this.q90 = new Quantile(0.9, P90_STEP);
    this.hz = 0; this.conf = 0; this.note = -1; this.cents = 0; this.gate = 0; this.glide = 0;
    this.st = null;                   // the held semitone value (log pitch) of the current note
    this.candSt = null; this.candT = 0;
    this.lastSt = null; this.lastT = 0;
    this.gateN = 0; this.gateT = -9; this.share = 1;
    this.lastNote = -9;               // audio time of the last subNote event
    this.mbuf = new Float32Array(MED_N); this.msrt = new Float32Array(MED_N); this.mk = 0; this.mn = 0;
    this.nbuf = new Int8Array(NOTE_MODE).fill(-1); this.nk = 0; this.ncnt = new Int32Array(12);
    this.events = [];                 // { type, t, vel, note }
  }
  // Push one input sample (mono / mid). `t` = its audio time. Returns true when a YIN frame ran.
  step(x, t) {
    let y = x;
    for (let i = 0; i < this.lp.length; i++) y = this.lp[i].step(y);
    const g = this.gb.power(x); this.rmsAcc += g * g; this.rmsN++;
    if (++this.phase < this.D) return false;
    this.phase = 0;
    this.ring[this.w & this.mask] = y; this.w++;
    if (this.w < this.nextAt) return false;
    this.nextAt = this.w + this.hop;
    return this.frame(t);
  }
  note1(t, vel, note) {                 // one subNote event, with a floor on how close two can be
    if (t - this.lastNote < RETRIG_MIN) return;
    this.lastNote = t; this.events.push({ type: 'subNote', t, vel, note });
  }
  frame(t) {
    const ms = Math.sqrt(this.rmsAcc / Math.max(1, this.rmsN)); this.rmsAcc = 0; this.rmsN = 0; this.gb.e = 0;
    this.rms = ms;
    const p90 = this.q90.push(ms);
    const rel = ms / (p90 + 1e-12);
    const db = 20 * Math.log10(ms + 1e-9), rise = db - this.prevDb; this.prevDb = db;
    const was = this.gate;
    const want = this.gate ? ((rel < GATE_OFF || this.share < GATE_SHARE_OFF) ? 0 : 1)
      : ((rel > GATE_ON && this.share >= GATE_SHARE_ON) ? 1 : 0);
    if (want !== this.gate && t - this.gateT >= GATE_DWELL) {
      if (++this.gateN >= GATE_CONFIRM) { this.gate = want; this.gateN = 0; this.gateT = t; }
    } else this.gateN = 0;
    if (this.gate !== was) {
      this.events.push({ type: this.gate ? 'subIn' : 'subOut', t, vel: clamp01(rel), note: this.note });
      // the gate opening IS a note start: fire it now, on the amplitude, not 120 ms later when YIN has a full window
      if (this.gate) { this.st = null; this.note1(t, clamp01(rel), -1); }
    }
    if (!this.gate) { this.hz = 0; this.conf = 0; this.note = -1; this.cents = 0; this.glide = 0; this.st = null; this.candSt = null; this.mn = 0; this.mk = 0; this.nbuf.fill(-1); return true; }
    // an 808 re-trigger inside an open gate: a hard rise in the sub's own level
    if (was && rise >= RETRIG_DB && rel > GATE_ON) { this.st = null; this.candSt = null; this.note1(t, clamp01(rel), this.note); }
    const r = this.yin.run(this.ring, this.w, this.mask);
    if (!(r.hz >= SUB_FMIN && r.hz <= SUB_FMAX) || r.conf < CONF_MIN) { this.conf = r.conf; return true; }
    this.conf = r.conf;
    this.mbuf[this.mk] = r.hz; this.mk = (this.mk + 1) % MED_N; if (this.mn < MED_N) this.mn++;
    const s = this.msrt;
    for (let i = 0; i < this.mn; i++) s[i] = this.mbuf[i];
    for (let i = 1; i < this.mn; i++) { const x = s[i]; let j = i - 1; while (j >= 0 && s[j] > x) { s[j + 1] = s[j]; j--; } s[j + 1] = x; }
    this.hz = s[this.mn >> 1];
    const n = noteOf(this.hz); this.cents = n.cents;
    this.nbuf[this.nk] = n.note; this.nk = (this.nk + 1) % NOTE_MODE;
    this.ncnt.fill(0);
    for (let i = 0; i < NOTE_MODE; i++) { const v = this.nbuf[i]; if (v >= 0) this.ncnt[v]++; }
    let bi = n.note, bc = -1;
    for (let i = 0; i < 12; i++) if (this.ncnt[i] > bc) { bc = this.ncnt[i]; bi = i; }
    this.note = bi;
    const st = 12 * Math.log2(this.hz / 55);
    if (this.lastSt !== null && t > this.lastT) {
      const g = (st - this.lastSt) / (t - this.lastT);
      const a = 1 - Math.exp(-(t - this.lastT) / GLIDE_TAU);
      this.glide += (Math.max(-48, Math.min(48, g)) - this.glide) * a;
    } else this.glide = 0;
    this.lastSt = st; this.lastT = t;
    // a pitch change of >= 1 semitone that holds NOTE_HOLD, timed at the FIRST frame that showed the new pitch
    if (this.st === null) this.st = st;
    else if (Math.abs(st - this.st) >= 1) {
      if (this.candSt === null || Math.abs(st - this.candSt) >= 1) { this.candSt = st; this.candT = t; }
      else if (t - this.candT >= NOTE_HOLD) {
        this.st = st; this.candSt = null;
        this.note1(this.candT - this.noteLag, clamp01(rel), n.note);
      }
    } else this.candSt = null;
    return true;
  }
}
