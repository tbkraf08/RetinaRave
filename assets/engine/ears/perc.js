// Percussion: a causal HPSS-lite (a short running median of each band's dB envelope is the harmonic part; what rises above
// it is percussive) and one onset stream per class. THE rule that matters on this music: a kick needs the beater click —
// a 2.5-8 kHz transient within CLICK_W hops of the low onset. A bare low onset is an 808 note start and belongs to subNoteEvt.
//
// Two things were measured and rejected here: a 128-sample hop (finer timing, but 2-5x the false onsets, kick F 0.21-0.61
// against 0.73 at 512) and integrating each band over several hops (it smears the attack; kick F fell from 0.71 to 0.52).
import { Band, RunMedian, Quantile, clamp01 } from './dsp.js';

export const PHOP = 512;             // the analysis hop, in samples (11.6 ms at 44.1 kHz, 10.7 ms at 48 kHz)
export const BANDS = [[22, 70], [70, 150], [40, 150], [150, 600], [150, 2500], [2500, 8000], [5000, 12000]];
// the four low bands need steep skirts (the sub, the bass and the kick band are within an octave of each other and of the
// 150-600 Hz harmonic band that `subPure` divides by); the three upper bands are more than two octaves wide, so wide is fine
export const BAND_KIND = ['steep', 'steep', 'steep', 'steep', 'wide', 'wide', 'wide'];
export const B_SUB = 0, B_LOWBASS = 1, B_KICK = 2, B_HARM = 3, B_SNARE = 4, B_CLICK = 5, B_HAT = 6;
export const INT_N = [1, 1, 1, 1, 1, 1, 1];      // hops each band integrates (measured: > 1 smears the attack and costs F)
export const MED_N = 9;              // the harmonic median window, in hops (~105 ms)
export const THR_K = 3.0;            // flux threshold = running mean + THR_K * running deviation of the band's flux
export const THR_FLOOR = [1.2, 1.2, 1.2];        // ... and never under this many dB, per class (kick, snare, hat)
export const CLICK_FLOOR = 1.0;      // the same floor for the beater-click band
// A kick also has a BODY: 150-600 Hz rises with it. A pure 808 (h/f 0.05 on this track) has none, so requiring the body as
// well as the beater is what separates a kick from an 808 note start far better than the 2.5-8 kHz click alone (hats fire
// every ~0.1 s, so a 15-25 ms click window catches one by luck a quarter of the time).
export const BODY_REQ = false;    // measured: requiring the body cost F (0.73 -> 0.62) without reliably cutting bare hits
export const BODY_FLOOR = 0.8;
export const BODY_W = 0.035;         // the body may lag the beater: a kick's 150-600 Hz thud decays over tens of ms
export const REFRACT = [0.085, 0.060, 0.045];    // per-class refractory (s)
// The beater window. The truth tool's own definition is 15 ms; measured on SeeYouDrop, 15 ms gives kick F 0.37 on 25-45 s with
// 6.0 % of kicks on a truth bare808 (chance is 5.3 %: a 15 ms window around 275 bare onsets covers 5.3 % of 157 s), and 25 ms
// gives F 0.73 with 12.6 %. 25 ms is chosen: it matches the truth's kick COUNT (207 against 229) and gives a usable channel.
export const CLICK_W = 0.025;
export const ONSET_OFS = 0.5;        // the onset's audio time is (hop end) - ONSET_OFS * hopDur: the transient sits inside the hop
export const DEN_WIN = 1.0;          // den* window (s)
export const GATE_DB = -34;          // ignore flux while a band sits this far under its own running p90 level
export const FM_A = 0.02;            // the flux mean / deviation smoothing per hop (~0.6 s)

export class PercTrack {
  // `o` overrides the constants above (thrK, thrFloor, refract, clickW, gateDb, clickFloor, intN, medN) — the tuning sweeps
  // use it, the page does not.
  constructor(sr, o = {}) {
    this.sr = sr;
    this.thrK = o.thrK === undefined ? THR_K : o.thrK;
    this.thrFloor = o.thrFloor || THR_FLOOR;
    this.refract = o.refract || REFRACT;
    this.clickW = o.clickW === undefined ? CLICK_W : o.clickW;
    this.gateDb = o.gateDb === undefined ? GATE_DB : o.gateDb;
    this.clickFloor = o.clickFloor === undefined ? CLICK_FLOOR : o.clickFloor;
    this.bodyReq = o.bodyReq === undefined ? BODY_REQ : o.bodyReq;
    this.bodyFloor = o.bodyFloor === undefined ? BODY_FLOOR : o.bodyFloor;
    this.bodyW = o.bodyW === undefined ? BODY_W : o.bodyW;
    this.intN = o.intN || INT_N;
    const medN = o.medN === undefined ? MED_N : o.medN;
    this.b = BANDS.map(([lo, hi], i) => new Band(sr, lo, hi, 2, BAND_KIND[i]));
    this.n = 0; this.hopDur = PHOP / sr;
    this.e = new Float32Array(BANDS.length);       // the integrated mean power per band (intN hops)
    this.e1 = new Float32Array(BANDS.length);      // ... and the newest hop alone
    this.hbuf = BANDS.map((_, i) => new Float32Array(this.intN[i]));
    this.hk = new Int32Array(BANDS.length);
    this.db = new Float32Array(BANDS.length);
    this.med = BANDS.map(() => new RunMedian(medN));
    this.res = new Float32Array(BANDS.length);     // the percussive residual, dB
    this.prev = new Float32Array(BANDS.length);
    this.flux = new Float32Array(BANDS.length);
    this.lvl = BANDS.map(() => new Quantile(0.9, 0.05, 'abs'));      // dB: absolute step, ~3 s at the 86 Hz hop
    this.fm = new Float32Array(BANDS.length);
    this.fd = new Float32Array(BANDS.length);
    this.p95 = [0, 1, 2].map(() => new Quantile(0.95, 0.02, 'abs'));
    this.vel = new Float32Array(3);
    this.den = new Float32Array(3);
    this.hist = [[], [], []];                      // onset times per class, last DEN_WIN s
    this.last = [-9, -9, -9];
    this.clickT = -99; this.bodyT = -99; this.pendKick = null;
    this.out = [];                                 // onsets found since the last take()
  }
  // one input sample and its audio time; runs an analysis hop every PHOP samples
  step(x, t) {
    const b = this.b;
    for (let i = 0; i < b.length; i++) b[i].power(x);
    if (++this.n < PHOP) return;
    this.frame(t);
  }
  take() { const o = this.out; this.out = []; return o; }

  frame(t) {
    const nb = BANDS.length, n = this.n; this.n = 0; this.hopDur = n / this.sr;
    for (let i = 0; i < nb; i++) {
      const e1 = this.b[i].take(n); this.e1[i] = e1;
      const N = this.intN[i], hb = this.hbuf[i];
      hb[this.hk[i]] = e1; this.hk[i] = (this.hk[i] + 1) % N;
      let e = 0; for (let q = 0; q < N; q++) e += hb[q];
      e /= N; this.e[i] = e;
      const d = 10 * Math.log10(e + 1e-12); this.db[i] = d;
      const h = this.med[i].push(d); this.res[i] = d - h;
      const p = this.lvl[i].push(d);
      let fl = this.res[i] - this.prev[i]; this.prev[i] = this.res[i];
      if (fl < 0) fl = 0;
      if (d < p + this.gateDb) fl = 0;             // a band far below its own loud level cannot produce an onset
      this.flux[i] = fl;
      this.fm[i] += (fl - this.fm[i]) * FM_A; this.fd[i] += (Math.abs(fl - this.fm[i]) - this.fd[i]) * FM_A;
    }
    const ot = t - ONSET_OFS * this.hopDur;
    // the click band decides what a low onset was
    if (this.flux[B_CLICK] > Math.max(this.fm[B_CLICK] + this.thrK * this.fd[B_CLICK], this.clickFloor)) this.clickT = ot;
    if (this.flux[B_HARM] > Math.max(this.fm[B_HARM] + this.thrK * this.fd[B_HARM], this.bodyFloor)) this.bodyT = ot;
    const clicked = ot - this.clickT <= this.clickW && (!this.bodyReq || ot - this.bodyT <= this.bodyW);
    // a low onset held from an earlier hop: confirm it as a kick if the beater has arrived since
    if (this.pendKick !== null) {
      if (clicked) { this.emit(0, this.pendKick.t, this.pendKick.vel); this.pendKick = null; }
      else if (ot - this.pendKick.t > this.clickW) this.pendKick = null;   // bare: it was an 808 note start
    }
    if (this.fire(0, B_KICK, ot)) {
      this.out.push({ type: 'low', t: ot, vel: this.vel[0] });   // every low-band onset, kick or bare 808 note start
      if (clicked) this.emit(0, ot, this.vel[0]);
      else this.pendKick = { t: ot, vel: this.vel[0] };
    }
    if (this.fire(1, B_SNARE, ot)) this.emit(1, ot, this.vel[1]);
    if (this.fire(2, B_HAT, ot)) this.emit(2, ot, this.vel[2]);
    for (let c = 0; c < 3; c++) {
      const h = this.hist[c];
      while (h.length && t - h[0] > DEN_WIN) h.shift();
      this.den[c] = h.length / DEN_WIN;
    }
  }
  fire(c, band, ot) {
    const fl = this.flux[band], thr = Math.max(this.fm[band] + this.thrK * this.fd[band], this.thrFloor[c]);
    if (fl <= thr || ot - this.last[c] < this.refract[c]) return false;
    this.vel[c] = clamp01(fl / (this.p95[c].push(fl) + 1e-6));
    return true;
  }
  emit(c, t, vel) {
    this.last[c] = t; this.hist[c].push(t);
    this.out.push({ type: c === 0 ? 'kick' : c === 1 ? 'snare' : 'hat', t, vel });
  }
}
