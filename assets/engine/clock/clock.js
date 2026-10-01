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
  // THE LATTICE CHECK (§59): the half-beat choice is the LOW BAND's, re-read while the period stays locked
  LAT_LO: 40,                   // Hz: the band the check reads, 40..150 (the truth tool's own: trackmap.py anchor_grid)
  LAT_W: 0.15,                  // beats: the half-width of the two windows — the clock's line, and its half-beat
  LAT_TAU: 90,                  // s: the two energies' leak (the margin is a whole-arrangement fact, not a bar's)
  LAT_MARG: 0.06,               // the natural-log margin: the half-beat must carry 6 % more low band to move the line
  LAT_SUS: 4,                   // s of NET time past the margin before the line moves (below: time inside it counts down)
  LAT_EPS: 1e-9,                // the ratio's floor: silence reads 0, not ±Infinity
};

export class Clock {
  constructor(sr = 48000, bpm0 = 124) {
    this.sr = sr;
    this.fft = new FFT(NFFT); this.mag = new Float32Array(NFFT / 2); this.lm = new Float32Array(NFFT / 2); this.lmPrev = new Float32Array(NFFT / 2);
    this.RB = 1 << 13; this.buf = new Float32Array(this.RB); this.bmask = this.RB - 1; this.w = 0; this.n = 0; this.tw = NaN;
    this.pkAll = 1e-5;                         // v3's XS.pkAll: the spectrum's peak follower (τ 40 s), the log gain's reference
    const binF = sr / NFFT;
    this.iB = Math.max(2, Math.min(40, Math.round(150 / binF))); this.iT = Math.min(NFFT / 2 - 1, Math.round(9843.75 / binF));   // v3: bins 1..419 at 48 kHz
    this.i40 = Math.max(1, Math.round(CLOCK.LAT_LO / binF));   // the lattice check's band floor (bins i40..iB = 40..150 Hz)
    this.per = new Period(bpm0);
    this.b = 0; this.f = bpm0 / 60; this.t = NaN;
    this.P00 = CLOCK.P0_B; this.P01 = 0; this.P11 = CLOCK.P0_F;
    this.tEst = -Infinity;
    this.onsets = 0; this.hits = 0; this.est = 0; this.lines = 0; this.lineN = 0; this.jumps = 0;
    this.s40 = 0;                                                      // the newest hop's 40–150 Hz flux (the lattice check's input)
    this.lat = 0; this.latOn = 0; this.latOff = 0; this.latHold = 0; this.latT = NaN; this.latJumps = 0;   // the lattice check's state (below)
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
    this.latClear();                     // the lattice windows were a different period wide: the evidence is void (below)
  }
  // the lattice check's evidence, thrown away
  latClear() { this.latOn = 0; this.latOff = 0; this.lat = 0; this.latHold = 0; }

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
    const g = 100 / this.pkAll, iB = this.iB, iT = this.iT, i40 = this.i40;
    let flux = 0, bflux = 0, f40 = 0;
    for (let i = 1; i <= iT; i++) {
      const v = Math.log(1 + g * mag[i]), d = v - prev[i];
      prev[i] = v;
      if (d > 0) { flux += d; if (i <= iB) { bflux += d; if (i >= i40) f40 += d; } }
    }
    this.s40 = f40 * 0.01;                                   // the lattice check's band; the published strength is unchanged
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
            // the LOW BAND's veto (§59): the comb line is the FULL-spectrum envelope's, and on a track whose hats sit on the
            // offbeat that envelope peaks there (CyborgNinja: the comb's line is half a beat off the truth's on 264 of its
            // 344 windows). When the lattice check below says the clock's own line carries the low band by the margin, the
            // vote does not move it. Cold, both energies are ~0, the ratio is 0 and §56's vote is untouched.
            const veto = this.lat > CLOCK.LAT_MARG;
            if (n >= CLOCK.LINE_N) { if (!veto) { this.b += y < 0 ? y + 1 : y; this.jumps++; if (this.P00 < CLOCK.R_LINE) this.P00 = CLOCK.R_LINE; } this.lineN = 0; }   // always FORWARD onto the comb's lattice: the count never steps back
            else if (!far) this.measureLine(tl, CLOCK.R_LINE / Math.max(per.y1, 0.15));
          }
        }
      }
    }
    this.predict(t);
    this.lattice(t);
  }
  // THE LATTICE CHECK (§59): which of the two half-beat lattices is the beat, re-read while the period stays locked.
  // The ears' onsets cannot tell them apart on a track whose kicks land on every 8th (CyborgNinja: 236 of them on the truth
  // beat against 213 on the offbeat, and the Kalman's own weight 485 against 477 — a coin flip the cold start wins and the
  // PDA gate then keeps for the whole track), and the comb line cannot either: it is the FULL-spectrum flux's line, and this
  // track's hats sit on the offbeat (the truth tool measured 90 against 64), so the comb's line is half a beat off the truth's
  // on 264 of its 344 windows. The LOW BAND does tell them apart — it is the truth tool's own rule (trackmap.py anchor_grid:
  // "the beat is the one with more 40–150 Hz onset strength on it") and it holds on all four truth tracks.
  // So: two leaky energies of the 40–150 Hz flux, one over the hops within LAT_W of the clock's beat line and one over the
  // hops within LAT_W of its half-beat, leaking with LAT_TAU; `lat` is their log ratio, and the two windows are the same
  // width and swap under a half-beat shift, so it is exactly antisymmetric — the clock reading its own line, not a grid.
  // Measured in the loop over the four truth tracks (t > 15 s, the flip disabled, min / p50): the three the clock already
  // has right read +0.213 / +0.363 SeeYouDrop · +0.054 / +0.399 WhoLikesToParty · +0.110 / +0.151 Malicious (a track with
  // NO lattice — its kicks are uniform over the beat — and still on the right side of 0), and CyborgNinja, half a beat off,
  // reads −0.193 / −0.167 with a maximum of −0.044. LAT_MARG 0.06 sits in that gap with the nearest 'right' reading 0.11
  // away and CyborgNinja's median 0.11 past it; LAT_SUS keeps a momentary excursion from moving anything. CyborgNinja's
  // line moves 19 s in. FORWARD by half a beat, like the comb line's vote: the count never steps back.
  lattice(t) {
    const K = CLOCK, s = this.s40;
    const dt = this.latT === this.latT ? t - this.latT : 0;
    if (dt > 0) { const g = Math.exp(-dt / K.LAT_TAU); this.latOn *= g; this.latOff *= g; }
    this.latT = t;
    // NOT while the rate is still a guess: on a cold start the Kalman rate is dragged down by the first onsets before the
    // first comb estimate arrives (measured on the page, CyborgNinja: 116 -> 57 -> 34 -> 9.7 -> 5.0 BPM over the first 2 s),
    // and at 5 BPM every hop is inside the on-window — 2 s of one-sided energy that a 90 s leak then carries for 90 s (the
    // page read the flip at 63 s where node read it at 14). The comb's own evidence gate is the condition; reseat() throws
    // the evidence away as well, because a period switch makes every window before it the wrong width.
    if (!this.per.clear) return;
    const d = this.b - Math.round(this.b), a = d < 0 ? -d : d;   // the phase against the clock's own line, |d| <= 0.5
    if (a < K.LAT_W) this.latOn += s;
    else if (a > 0.5 - K.LAT_W) this.latOff += s;                 // the two windows are the same width and swap under a half-beat shift
    this.lat = Math.log((this.latOn + K.LAT_EPS) / (this.latOff + K.LAT_EPS));
    // the hold is NET time past the margin, not an unbroken run: the margin is only 0.06 wide, so a run rule turns a 1e-4
    // difference between the page and node into tens of seconds of delay (measured: 19 s against 63 s). Time past the margin
    // counts up, time inside it counts down, and the floor is 0.
    const past = this.locked && this.lat < -K.LAT_MARG;
    this.latHold += past ? dt : -dt;
    if (this.latHold < 0) this.latHold = 0;
    if (this.latHold >= K.LAT_SUS) {
      this.b += 0.5;
      const o = this.latOn; this.latOn = this.latOff; this.latOff = o;   // the windows swapped roles with the line
      this.lat = -this.lat; this.latHold = 0; this.latJumps++; this.jumps++;
      if (this.P00 < K.R_LINE) this.P00 = K.R_LINE;
    }
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
