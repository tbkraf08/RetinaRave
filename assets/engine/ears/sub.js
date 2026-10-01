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
// Hysteresis on the sub band's RMS as a share of its running p90. §73 RE-FITTED the pair: until v0.25 `q90` settled
// on the p10 (dsp.js's swapped weights), so `rel = ms / q90` ran 3-25x larger than the number this pair was written
// against and the level half of the gate was all but always satisfied — the gate was effectively the SHARE gate
// below. With the sign fixed and `P90_STEP` corrected, `q90` lands within 0-7 % of the trailing-32 s p90 on all five
// tracks, so the pair is divided by 8 to hold the gate's OWN TIMELINE: frame agreement with the v0.25 gate
// 98.1 / 98.9 / 93.0 / 100.0 / 99.5 %, gate-open share 81.5 / 99.7 / 77.6 / 49.7 / 80.8 % against 83.2 / 98.6 /
// 81.0 / 49.6 / 80.4, and `subIn` 29 / 7 / 506 / 127 / 38 against 29 / 41 / 533 / 127 / 55 (the two that fall are
// CyborgNinja and Vienna, where the old gate chattered at the edge of a gate that is open 99 % and 80 % of the
// track). The factor is fitted to that timeline and NOT derived, because the old reference's own error varies
// 3-25x across the five tracks — one scale factor cannot be right for all of them (tools/work/v73/sweep.js sub).
// What the fix buys beside the timeline: `rel` is also the `vel` of every subIn / subOut / subNote event, and
// `clamp01(rel)` with a p50 of 1.23-15.99 was 1.000 almost always — the sub's note velocity was saturated exactly
// the way `*Vel` was (§51, §73). It now spreads with a p50 of 0.22-0.62.
export const GATE_ON = 0.020, GATE_OFF = 0.0094;
// The gate also needs the sub to be the DOMINANT part of the low end, not merely present: without this the intro's 109 Hz
// mid-bass and the 101-105 s harmonic bass read as a sub (the truth's own per-beat note there is G#2 / A#2, an octave up).
// `share` = the 22-70 band's power over 22-70 + 70-150 + 150-600, set once per block from PercTrack's filter bank.
export const GATE_SHARE_ON = 0.30, GATE_SHARE_OFF = 0.26;
export const GATE_DWELL = 0.045;  // ... and once it has changed it holds for this long (a duck is ~0.8 s apart, so this only
                                  // suppresses flutter)
export const GATE_CONFIRM = 1;    // ... and the new state must hold this many frames (16 ms) before subIn / subOut fire, so
                                  // a flutter in the void does not announce the drop 150 ms early
// The running p90 of that RMS: ~32 s at the 125 Hz sub hop. A 4 s follower collapsed inside the 8 s void and the
// gate then opened on its rumble, firing three false notes before the drop.
// §73 2.5e-4 -> 2.5e-3. The two weights set the two SPEEDS as well as the quantile: the SLOW leg is the (1 - q) one,
// so for q = 0.9 it is step/10. Under the old (swapped) weights the slow leg was step*q and 2.5e-4 bought the stated
// ~32 s; with the sign right the slow leg is step*(1 - q) and the same 32 s needs ten times the step. Measured
// against the trailing-32 s p90 of the same stream, the estimator's median ratio to it reads 0.04 / 0.24 / 0.07 /
// 0.04 / 0.33x in v0.25, 0.28 / 0.87 / 0.67 / 0.35 / 0.95x with the sign alone, and **0.93 / 1.00 / 0.97 / 0.96 /
// 1.00x** at 2.5e-3 (tools/work/v73/sweep.js sub). The direction the 32 s applies to has flipped, which is what the
// void wanted all along: the fast leg now carries the level UP onto a new sub and the slow one leaks it away, so an
// 8 s void can no longer drag the reference down onto its own rumble.
export const P90_STEP = 2.5e-3;
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
    // §75: the share starts at 0, NOT at 1. `share` is the one half of the gate that can say "that is not a sub", and
    // seeded at 1 it said "the sub owns the low end" before a single sample had been measured — on a cold start that
    // claim then took SHARE_DOWN (0.45 s) to decay, which is 0.6 s of an OPEN gate the evidence never supported. 0 is
    // the honest prior and it costs a real sub nothing: SHARE_UP is 0.012 s, so two 512-sample blocks (21 ms) put the
    // share on its measured value, and the first YIN frame cannot run until 0.167 s anyway.
    this.gateN = 0; this.gateT = -9; this.share = 0;
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
