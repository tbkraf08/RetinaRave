// THE PCM BEAT CLOCK (live step 6, 2026-09-30; docs/AUDIT-live-grid.md "Step 6", DECISIONS §56): tempo + phase estimated
// from a sample-timed onset stream instead of once per video frame from the frame-rate flux, and a Kalman filter on
// (beat position, beat rate) instead of a PLL — so one odd onset cannot yank the beat line, the line coasts through silence
// on its own rate, and a strong on-grid onset corrects more than a weak or off-grid one.
// Pure: no DOM, no clock, no Math.random, no MS. Blocks of mono PCM in (the PCM bus's 512, stamped with audio time), one
// read-out at any audio time. Runs in node (tools/test_clock.js, tools/build-node.js) and in the page (features-clock.js).
//
//   push(mono, t0)         one block, t0 = the audio time of its first sample (any length; the hop is HOP samples): the comb's input
//   onset(t, cls, vel)     one of the ears' percussion onsets (perc.js: sample-timed kick / snare / hat): a phase measurement
//   at(t) -> { b, phase, count, bps }   the clock evaluated at audio time t (b = the continuous beat position)
//   read(t, st) -> { bpm, phase, count, beat }   the same, published: the count never steps back (st = the reader's memory)
//   bpm / conf / locked / onsets / est  read-outs
//
// THE ONSET STRENGTH is v3's (features.js): the positive log-magnitude spectral flux over 20 Hz–9.8 kHz of a 2048-point
// FFT plus three times the bass bins' (< 150 Hz), o = (flux + 3·bassFlux)/100 — but per HOP of 512 samples (10.7 ms at
// 48 kHz) of the PCM bus, timed by the sample count, not once per video frame from an AnalyserNode read at rAF time. The
// ears' per-band dB flux was measured first and rejected: its beat-lag autocorrelation reads 0.11 in SeeYouDrop's intro
// and 0.44 in its groove where v3's spectral flux reads 0.59 / 0.79 — a detector's flux (HPSS residual, gated) is not a
// periodicity function. Synapse's Analyzer has the same FFT, but on its own tap without sample stamps (a relative t):
// the clock computes its own (0.07 ms per 60 Hz frame equivalent, measured in node; the ears' FFT class).
//
// THE MODEL. x = [b, f]: the beat position (beats, continuous) and the beat rate (beats / s) at time this.t.
//   predict:  b += f·dt;  P += [[Qb·dt + Qf·dt³/3, Qf·dt²/2], [Qf·dt²/2, Qf·dt]]    (constant-rate model, white rate noise)
//   an ONSET at audio time t with strength s in (0, 1] says "a beat line is here": z = round(b(t)), innovation y = z − b(t),
//   R = R_ON / s. The update is a probabilistic-data-association step: the onset is either on the grid (likelihood N(y; 0, S),
//   S = P00 + R) or clutter (an off-grid hit, density CLUTTER per beat), and the gain is scaled by the posterior weight
//   beta = N / (N + CLUTTER). At y = 0 beta ~ 0.9; three sigma out ~0.6; four sigma out ~0.06 — the soft gate. So an onset
//   corrects in proportion to how sure the clock already is and how well it fits: cold (P00 large) the first onset sets
//   the phase outright, locked a stray 16th moves it by nothing.
//   the comb's LINE (period.js line(): the 8-beat alignment of the whole 8 s window, every EVERY s) is one more phase
//   measurement with R_LINE — the consensus that resolves a cold start's half-beat ambiguity, gated the same way.
//   the comb's TEMPO (period.js, tempo.js's estimator on the 100 Hz ring of the same onset strength) is a rate measurement
//   z = bpm / 60 with R_F / y1 whenever the comb is clear; a SWITCH (tempo.js's votes: octave, unrelated, 3:2) re-seats f
//   and its variance outright and keeps b where it is (the beat line stays; the rate changes).
// THE PHASE MEASUREMENTS are the ears' own onsets (engine/ears/perc.js: the per-band HPSS detectors with the beater-click
// rule, sample-timed at the 512 hop), not onsets picked from this flux: measured against the four truth tracks' kicks the
// ears' kicks sit +3 / +8 / +6 / +2.5 ms (sd 6-8), snares and hats within ±3, where onsets picked from the spectral flux
// (first hop over mean + 1.5 sd, timed by the rise's split between hops) sit +3 / +18 / +19 / +9 — a kick's full-spectrum
// flux peaks a hop after its click on two of the four tracks. So the flux is the comb's input (periodicity: tempo and the
// 8-beat line) and the ears' onsets are the clock's ticks, each weighted by its class (R_CLS) and velocity.
import { FFT } from '../ears/dsp.js';
import { Period, RATE } from './period.js';

export const HOP = 512, NFFT = 2048;
export const CLOCK = {
  BASS: 3,                      // the bass bins' extra weight in the strength (v3: flux + 3·bflux)
  R_CLS: [1, 1.5, 3],           // the onset variance per class: kick, snare, hat (a hat is the subdivision; a kick is the beat)
  KICK_LAG: 0.004,              // s: the ears' kicks read +3 / +8 / +6 / +2.5 ms against the four truth tracks' kicks (median 4.5); snares / hats +-2
  EVERY: 0.5,                   // s between comb estimates (tempo.js: every 0.5 s)
  R_ON: 0.03 * 0.03,            // beats²: an onset's timing variance at strength 1 (±12 ms at 150 BPM)
  R_LINE: 0.08 * 0.08,          // beats²: the comb line's (Infinity = off)
  LINE_JUMP: 0.3,               // beats: a comb line this far from the clock's line is a vote for the other lattice ...
  LINE_W: 8, LINE_N: 7,         // ... and LINE_N of the last LINE_W clear lines (4 s) voting so move the clock's line onto the comb's
  R_F: 0.01 * 0.01,             // (beats/s)²: the comb tempo's at y1 = 1 (0.6 BPM)
  Q_B: 0.01 * 0.01,             // beats²/s: phase random walk beyond the rate
  Q_F: 0.003 * 0.003,           // (beats/s)²/s: rate random walk (0.18 BPM per √s)
  CLUTTER: 1,                   // off-grid onsets per beat (the PDA clutter density)
  P0_B: 1, P0_F: 0.3 * 0.3,     // the cold covariance: any phase; the rate ±18 BPM around the prior
  TRACK: 0.06,                  // a comb tempo within this ratio of f is a measurement; beyond it, a switch (period.js decides)
  PRESENT: 1e-7,                // hop strength below which nothing is written (silence)
};

export class Clock {
  constructor(sr = 48000, bpm0 = 124) {
    this.sr = sr;
    this.fft = new FFT(NFFT); this.mag = new Float32Array(NFFT / 2); this.lm = new Float32Array(NFFT / 2); this.lmPrev = new Float32Array(NFFT / 2);
    this.RB = 1 << 13; this.buf = new Float32Array(this.RB); this.bmask = this.RB - 1; this.w = 0; this.n = 0; this.tw = NaN;
    this.pkAll = 1e-5;                         // v3's XS.pkAll: the spectrum's peak follower (τ 40 s), the log gain's reference
    const binF = sr / NFFT;
    this.iB = Math.max(2, Math.min(40, Math.round(150 / binF))); this.iT = Math.min(NFFT / 2 - 1, Math.round(9843.75 / binF));   // v3: bins 1..419 at 48 kHz
    this.per = new Period(bpm0);
    this.b = 0; this.f = bpm0 / 60; this.t = NaN;
    this.P00 = CLOCK.P0_B; this.P01 = 0; this.P11 = CLOCK.P0_F;
    this.tEst = -Infinity;
    this.onsets = 0; this.hits = 0; this.est = 0; this.lines = 0; this.lineN = 0; this.jumps = 0;
    this.lastOnset = null;                     // { t, cls, vel, y, beta } of the last onset seen (tests, the trace)
    this.hops = 0;
  }
  get bpm() { return this.f * 60; }
  // how sure the phase is: 1 at σ 0, 0 at σ >= 0.25 beat
  get conf() { const s = Math.sqrt(Math.max(0, this.P00)); return s >= 0.25 ? 0 : 1 - s / 0.25; }
  get locked() { return this.conf > 0.6 && this.hits >= 4; }

  predict(t) {
    if (!(this.t === this.t)) { this.t = t; return; }        // the first sample: the state is AT t
    const dt = t - this.t, a = Math.abs(dt);
    this.b += this.f * dt;
    const qf = CLOCK.Q_F;
    this.P00 += CLOCK.Q_B * a + qf * a * a * a / 3 + 2 * this.P01 * dt + this.P11 * dt * dt;
    this.P01 += qf * a * a / 2 + this.P11 * dt;
    this.P11 += qf * a;
    this.t = t;
  }
  // a phase measurement: "a beat line is at t", variance R (beats²); -> beta (the weight it got)
  measureLine(t, R) {
    this.predict(t);
    const y = Math.round(this.b) - this.b, S = this.P00 + R;
    const N = Math.exp(-0.5 * y * y / S) / Math.sqrt(2 * Math.PI * S), beta = N / (N + CLOCK.CLUTTER);
    const K0 = this.P00 / S, K1 = this.P01 / S;
    this.b += beta * K0 * y; this.f += beta * K1 * y;
    // PDA covariance: P − beta·K S Kᵀ + beta(1−beta)·(K y)(K y)ᵀ
    const sp = beta * (1 - beta) * y * y;
    this.P00 += -beta * K0 * K0 * S + sp * K0 * K0;
    this.P01 += -beta * K0 * K1 * S + sp * K0 * K1;
    this.P11 += -beta * K1 * K1 * S + sp * K1 * K1;
    if (this.P00 < 1e-8) this.P00 = 1e-8;
    if (this.P11 < 1e-10) this.P11 = 1e-10;
    return [y, beta];
  }
  // a rate measurement z (beats/s), variance R
  measureRate(z, R) {
    const y = z - this.f, S = this.P11 + R, K0 = this.P01 / S, K1 = this.P11 / S;
    this.b += K0 * y; this.f += K1 * y;
    this.P00 -= K0 * K0 * S; this.P01 -= K0 * K1 * S; this.P11 -= K1 * K1 * S;
    if (this.P00 < 1e-8) this.P00 = 1e-8;
    if (this.P11 < 1e-10) this.P11 = 1e-10;
  }
  // a tempo switch: the rate re-seated, the beat line kept
  reseat(bps) {
    this.f = bps; this.P11 = CLOCK.R_F; this.P01 = 0;
    if (this.P00 < CLOCK.R_ON) this.P00 = CLOCK.R_ON;
  }

  // one block of mono samples; runs a hop every HOP samples
  push(mono, t0) {
    const buf = this.buf, m = this.bmask;
    for (let i = 0; i < mono.length; i++) {
      buf[this.w & m] = mono[i]; this.w++;
      if (++this.n >= HOP) { this.n = 0; this.hop(t0 + (i + 1) / this.sr); }
    }
  }
  // the onset strength of the hop ending at audio time t: v3's spectral flux on the newest NFFT samples
  strength() {
    const mag = this.mag, lm = this.lm, prev = this.lmPrev;
    this.fft.mags(this.buf, this.w - NFFT, this.bmask, mag);
    let mx = 0;
    for (let i = 0; i < mag.length; i++) if (mag[i] > mx) mx = mag[i];
    this.pkAll = Math.max(this.pkAll * Math.exp(-(HOP / this.sr) / 40), mx, 1e-5);
    const g = 100 / this.pkAll, iB = this.iB, iT = this.iT;
    let flux = 0, bflux = 0;
    for (let i = 1; i <= iT; i++) {
      const v = Math.log(1 + g * mag[i]), d = v - prev[i];
      prev[i] = v;
      if (d > 0) { flux += d; if (i <= iB) bflux += d; }
    }
    return (flux + CLOCK.BASS * bflux) * 0.01;
  }
  // an onset from the ears (perc.js: kick 0 / snare 1 / hat 2) at audio time t with velocity vel in (0, 1]: a phase measurement
  onset(t, cls, vel) {
    this.onsets++;
    const R = CLOCK.R_ON * (CLOCK.R_CLS[cls] || 1) / Math.max(+vel || 0, 0.25), ot = t - (cls === 0 ? CLOCK.KICK_LAG : 0);
    const [y, beta] = this.measureLine(ot, R);
    if (beta > 0.5) this.hits++;
    this.lastOnset = { t: ot, cls, vel, y, beta };
    return beta;
  }
  hop(t) {
    this.hops++;
    let o = this.strength();
    if (!(o >= 0)) o = 0;
    this.per.ring(t, o);
    // the comb, every EVERY s of audio
    if (t - this.tEst >= CLOCK.EVERY) {
      this.tEst = t;
      const per = this.per;
      if (per.estimate()) {
        this.est++;
        const z = per.bpm / 60;
        if (per.switched) this.reseat(z);
        else if (per.clear) {
          if (Math.abs(z / this.f - 1) < CLOCK.TRACK) this.measureRate(z, CLOCK.R_F / Math.max(per.y1, 0.05));
          else this.reseat(z);      // the comb's filtered tempo has walked away from the rate: follow it (a slow drift the votes never saw)
        }
        if (per.clear && isFinite(CLOCK.R_LINE)) {
          const [tl] = per.line(this.f);
          if (tl === tl) {
            this.lines++;
            // the LATTICE vote first: on a half-beat pattern (kicks on every 8th: CyborgNinja, WhoLikesToParty) the onsets fit
            // both lattices and the gate keeps whichever the cold start chose; the 8-beat comb line says which one carries the
            // envelope's energy. LINE_N of the last LINE_W clear lines more than LINE_JUMP beats from the clock's line move the line
            // onto the comb's (the same 8-beat comb v3's PLL follows, as a vote instead of a pull: no tearing between the two).
            const bl = this.b + this.f * (tl - this.t), y = Math.round(bl) - bl, far = Math.abs(y) > CLOCK.LINE_JUMP;
            this.lineN = ((this.lineN << 1) | (far ? 1 : 0)) & ((1 << CLOCK.LINE_W) - 1);
            let n = 0; for (let m = this.lineN; m; m >>= 1) n += m & 1;
            if (n >= CLOCK.LINE_N) { this.b += y < 0 ? y + 1 : y; this.lineN = 0; this.jumps++; if (this.P00 < CLOCK.R_LINE) this.P00 = CLOCK.R_LINE; }   // always FORWARD onto the comb's lattice: the count never steps back
            else if (!far) this.measureLine(tl, CLOCK.R_LINE / Math.max(per.y1, 0.15));
          }
        }
      }
    }
    this.predict(t);
  }
  at(t, out = {}) {
    const b = this.t === this.t ? this.b + this.f * (t - this.t) : this.b;
    out.b = b; out.count = Math.floor(b); out.phase = b - out.count; out.bps = this.f;
    return out;
  }
  // the PUBLISHED clock at audio time t (lead.js's rule for the moved v3 clock): the count never steps back, so a beat fires
  // exactly once — a pull back across a line holds on the line (phase 0) until the clock catches up. `st` = { n } is the
  // reader's own memory (one per published pair); -> out.{ bpm, phase, count, beat }
  read(t, st, out = {}) {
    this.at(t, out);
    const n = out.count;
    if (st.n === null || st.n === undefined) st.n = n;
    if (n >= st.n) { out.beat = n > st.n; st.n = n; }
    else { out.beat = false; out.count = st.n; out.phase = 0; }
    out.bpm = this.bpm;
    return out;
  }
}
export { RATE };
