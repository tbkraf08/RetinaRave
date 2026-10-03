// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Synapse ANALYZER — everything musical derived from raw PCM at a fixed ~10 ms hop, independent of the render loop.
// Lifted from synapse2.html 217–336 (constructor, push, hopStep). anatomy/longFrame live in anatomy.js, the beat-
// synchronous structure (grid, Foote novelty, sections) in structure.js; both are mixed into the prototype below.
// Output lands in this.A (synapse's global `A`); features-synapse.js copies it into MS under non-colliding names.
import { FFT, Band, Onset, Tempo, clamp01, lerp, smooth, smoothAR, SPEC_W, WAVE_W, HIST_H, FDIM } from './dsp.js';
import * as ANAT from './anatomy.js';
import * as STRUCT from './structure.js';

export { SPEC_W, WAVE_W, HIST_H, FDIM };

export function makeA() {
  return {
    bass: 0, mid: 0, high: 0, sub: 0, bassS: 0, midS: 0, highS: 0, level: 0,
    kick: 0, snare: 0, hat: 0, drop: 0, tension: 0, intensity: 0, calm: 0, hush: 0,
    flow: 0, flowBass: 0, flowMid: 0, flowHigh: 0, centroid: 0, flux: 0, kickCount: 0, novelty: 0,
    rms: 0, alive: 0, dropAge: 99, dropHold: 0, beat: 0, beatConf: 0, bpm: 0,
    eFast: 0, eShort: 0, eMed: 0, eLong: 0, kicks: [], events: [],
    spec: new Uint8Array(SPEC_W), wave: new Uint8Array(WAVE_W), silentFor: 0, fresh: false, period: 0.47, gridTrust: 0,
    dropExpectedIn: -1, dropConf: 0, resolve: 0, drops: 0, fakeouts: 0,
    barPos: 0, phrasePos: 0, phrase16Pos: 0, barConf: 0, phraseConf: 0, phrase32Conf: 0,
    valence: 0.5, arousal: 0.3, family: 0, moodShifts: 0, dirty: 0, punchy: 0.5, perc: 0, harm: 0, key: 9, mode: 1, keyClar: 0,
    chroma: new Float32Array(12), foote: 0, section: -1, sectionReturn: 0, sectionAge: 0, sectionCount: 0, boundaries: 0, returns: 0,
    ev: { roll: 0, riser: 0, hp: 0, swell: 0, gap: 0, all: 0 },
  };
}

export class Analyzer {
  constructor(sr) {
    this.A = makeA();
    this.sr = sr;
    this.hop = 512;
    this.dt = this.hop / sr;
    this.RN = 32768;
    this.mask = this.RN - 1;
    this.ring = new Float32Array(this.RN);
    this.w = 0;
    this.pending = 0;
    this.t = 0;
    this.hops = 0;
    this.f1 = new FFT(1024);
    this.f2 = new FFT(2048);
    this.f3 = new FFT(8192);
    this.m1 = new Float32Array(512);
    this.m2 = new Float32Array(1024);
    this.m3 = new Float32Array(4096);
    this.lg = new Float32Array(512);
    this.prev = new Float32Array(512);
    this.lg2 = new Float32Array(1024);
    const b1 = sr / 1024, b2 = this.binHz = sr / 2048;
    this.b3 = sr / 8192;
    this.bands = { sub: new Band(25, 60, 4e-4), bass: new Band(40, 150, 4e-4), mid: new Band(300, 2500, 1.2e-4), high: new Band(5000, 16000, 3e-5) };
    for (const k in this.bands) this.bands[k].bins(b2, 1024);
    this.oKick = new Onset(30, 180, 0.11, 1.5);
    this.oSnare = new Onset(200, 4000, 0.05, 1.8);
    this.oHat = new Onset(6000, 16000, 0.045, 1.8);
    for (const o of [this.oKick, this.oSnare, this.oHat]) o.bins(b1, 512);
    this.tempo = new Tempo(1 / this.dt);
    this.specIdx = new Float32Array(SPEC_W + 1);
    for (let i = 0; i <= SPEC_W; i++) this.specIdx[i] = 30 * Math.pow(16000 / 30, i / SPEC_W) / b2;
    this.specS = new Float32Array(SPEC_W);
    this.specPk = 0.3;
    this.nov = { med: new Float32Array(32), long: new Float32Array(32) };
    this.fbEdge = [30, 60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000].map((f) => Math.min(1023, Math.round(f / b2)));
    this.lvlPk = 0.004; this.wavePk = 0.05; this.cFast = 0.4; this.cSlow = 0.4; this.dens = 0; this.densSlow = 0;
    this.bShort = 0; this.bLag = 0; this.bLong = 0; this.bHold = 0; this.lastDrop = -99; this.lastHush = -99; this.aliveSince = 0; this.lastKickT = -99; this.kickGap = 0;
    this.yp = new Float32Array(512); this.cPk = 0; this.cMs = 0; this.cN = 0; this.crestDb = 12; this.flat = 0.2; this.fluxS = 0;
    this.hist = { cen: new Float32Array(64), roll: new Float32Array(64), edge: new Float32Array(64), lvl: new Float32Array(64), i: 0 };
    this.onsets = []; this.rollHist = new Float32Array(16); this.ev = this.A.ev; this.evS = 0;
    this.exp = null; this.noArmUntil = 0; this.tenseSince = -1;
    this.chroma = new Float32Array(12); this.chromaS = new Float32Array(12); this.chromaL = new Float32Array(12);
    this.key = 9; this.mode = 1; this.keyClar = 0; this.keyHold = 0; this.modeVal = 0; this.harm = 0;
    this.val = 0.5; this.aro = 0.3; this.anchor = { v: 0.5, a: 0.3 }; this.moodOff = 0; this.moodInit = false;
    // beat-synchronous memory
    this.beatI = 0; this.acc = new Float32Array(FDIM); this.accN = 0; this.accC = 0; this.accLvl = 0; this.accOn = 0; this.prevBeatChroma = new Float32Array(12);
    this.BN = 128; this.F = [];
    for (let i = 0; i < this.BN; i++) this.F.push(new Float32Array(FDIM));
    this.E = new Float32Array(this.BN); this.mu = new Float32Array(FDIM); this.muN = 0;
    this.H32 = new Float32Array(32); this.barK = new Float32Array(4); this.o4 = 0; this.o16 = 0; this.o32 = 0;
    this.novFast = new Float32Array(this.BN); this.lastBoundary = -99; this.novPk = 0.3;
    this.gridStart = 0; this.prevSec = null; this.done = 0; this.nf1 = this.nf2 = this.nl1 = this.nl2 = 0;
    this.sections = []; this.cur = null; this.secStart = 0; this.secSum = new Float32Array(FDIM); this.secN = 0; this.secChecked = 0;
    // spectrogram ring for the uHist texture (one row per hop, oldest row overwritten)
    this.histTex = new Uint8Array(SPEC_W * HIST_H); this.histRow = 0;
    this.cpuMs = 0; // accumulated hop cost since the last frame() (features-synapse.js drains it)
  }

  push(x) {
    const r = this.ring, m = this.mask;
    let w = this.w;
    for (let i = 0; i < x.length; i++) {
      r[w] = x[i];
      w = (w + 1) & m;
    }
    this.w = w;
    this.pending += x.length;
    if (this.pending > this.sr) this.pending = this.hop * 4; // long stall (hidden tab): drop the backlog, keep the newest audio
    const t0 = performance.now();
    while (this.pending >= this.hop) {
      this.pending -= this.hop;
      this.hopStep();
    }
    this.cpuMs += performance.now() - t0;
  }

  hopStep() {
    const A = this.A, dt = this.dt, now = (this.t += dt), ring = this.ring, mask = this.mask, hop = this.hop;
    const end = (this.w - this.pending + this.RN * 8) & mask;
    this.hops++;
    let rs = 0, pk = 0;
    for (let i = 0; i < hop; i++) {
      const v = ring[(end - hop + i) & mask];
      rs += v * v;
      const a = v < 0 ? -v : v;
      if (a > pk) pk = a;
    }
    const rms = A.rms = Math.sqrt(rs / hop);
    this.cPk = Math.max(this.cPk, pk);
    this.cMs += rs;
    if (++this.cN >= 47) {
      const r = Math.sqrt(this.cMs / (47 * hop));
      if (r > 1e-4) this.crestDb = lerp(this.crestDb, 20 * Math.log10(this.cPk / r), 0.25);
      this.cPk = 0; this.cMs = 0; this.cN = 0;
    }
    const m1 = this.m1, m2 = this.m2, lg = this.lg, prev = this.prev, lg2 = this.lg2;
    prev.set(lg);
    this.f1.mags(ring, end - 1024, mask, m1);
    this.f2.mags(ring, end - 2048, mask, m2);
    for (let i = 0; i < 512; i++) { const v = m1[i]; lg[i] = v > 1e-7 ? clamp01((8.6859 * Math.log(v) + 100) / 80) : 0; }
    for (let i = 0; i < 1024; i++) { const v = m2[i]; lg2[i] = v > 1e-7 ? clamp01((8.6859 * Math.log(v) + 100) / 80) : 0; }
    // --- liveness; slow trackers warm up fast after sound (re)appears so a cold average can't fake a build ---
    if (rms < 2e-4) {
      A.silentFor += dt;
      if (A.silentFor > 3) { this.aliveSince = now; this.resetGrid(); }
    } else A.silentFor = 0;
    A.alive = smoothAR(A.alive, A.silentFor < 0.7 ? 1 : 0, dt, 0.25, 0.9);
    const age = now - this.aliveSince, W = (tau) => Math.min(tau, 0.15 + age * 0.4);
    // --- bands & loudness over four windows ---
    const B = this.bands;
    for (const k in B) B[k].update(m2, dt);
    A.sub = B.sub.fast; A.bass = B.bass.fast; A.mid = B.mid.fast; A.high = B.high.fast; A.bassS = B.bass.slow; A.midS = B.mid.slow; A.highS = B.high.slow;
    this.lvlPk = Math.max(rms, 0.004, this.lvlPk * Math.exp(-dt / 22));
    const lvl = Math.pow(clamp01(rms / (this.lvlPk * 0.9)), 0.7);
    A.level = smoothAR(A.level, lvl, dt, 0.03, 0.2);
    A.eFast = smooth(A.eFast, lvl, dt, 0.1); A.eShort = smooth(A.eShort, lvl, dt, 1.0); A.eMed = smooth(A.eMed, lvl, dt, W(4.0)); A.eLong = smooth(A.eLong, lvl, dt, W(20.0));
    this.bShort = smooth(this.bShort, B.bass.n, dt, 0.3); this.bLag = smooth(this.bLag, B.bass.n, dt, W(2.5)); this.bLong = smooth(this.bLong, B.bass.n, dt, W(10));
    this.bHold = Math.max(B.bass.n, this.bHold * Math.exp(-dt / 0.9));
    // --- onsets (confirmed one hop late; the band level has had time to peak, so gating on it is safe) ---
    let onsets = 0, kicked = 0;
    const k = this.oKick.update(lg, prev, now), s = this.oSnare.update(lg, prev, now), h = this.oHat.update(lg, prev, now);
    A.flux = this.oKick.flux + this.oSnare.flux * 0.6;
    if (k && Math.max(B.bass.n, B.bass.fast) > 0.15) {
      kicked = k * (0.5 + 0.5 * B.bass.n);
      A.kick = Math.max(A.kick, kicked);
      A.kickCount++;
      onsets++;
      A.kicks.unshift({ age: 0, s: kicked });
      if (A.kicks.length > 8) A.kicks.pop();
      A.events.push({ type: 'kick', s: kicked });
      this.kickGap = (now - this.lastKickT) / this.tempo.period;
      this.lastKickT = now;
      this.onsets.push({ t: now, b: this.tempo.beat, k: 1 });
      const nb = Math.round(this.tempo.beat);
      if (Math.abs(this.tempo.beat - nb) < 0.2) this.barK[((nb % 4) + 4) % 4] += kicked;
    }
    if (s && B.mid.n > 0.12) {
      A.snare = Math.max(A.snare, s);
      onsets++;
      if (!k) this.onsets.push({ t: now, b: this.tempo.beat, k: 0 });
    }
    if (h && B.high.n > 0.1) {
      A.hat = Math.max(A.hat, h);
      onsets += 0.5;
    }
    this.tempo.push(this.oKick.flux * 1.6 + this.oSnare.flux * 0.8 + this.oHat.flux * 0.25);
    if (this.tempo.jump) { this.tempo.jump = false; this.resetGrid(); }
    A.beatConf = smooth(A.beatConf, clamp01(Math.min(this.tempo.conf * 1.2, 0.1 + 1.3 * this.tempo.phConf)) * A.alive, dt, 0.6);
    A.bpm = 60 / this.tempo.period;
    A.gridTrust = Math.max(A.beatConf, A.gridTrust * Math.exp(-dt / 25)) * A.alive; // a DJ keeps counting through the breakdown
    this.dens = this.dens * Math.exp(-dt / 1.2) + onsets;
    this.densSlow = smooth(this.densSlow, this.dens, dt, W(7));
    { // transient share of the (floor-proof) spectrum
      let fl = 0, ys = 0;
      const yp = this.yp;
      for (let i = 4; i < 360; i++) { const v = Math.log1p(200 * m1[i]); ys += v; if (v > yp[i]) fl += v - yp[i]; yp[i] = v; }
      this.fluxS = smooth(this.fluxS, fl / (ys + 2), dt, W(4));
    }
    // --- spectral shape: centroid, 85 % roll-off, 10 % low edge, flatness ---
    let cw = 0, cs = 0, tot = 0;
    for (let i = 2; i < 716; i++) { const m = m2[i]; cw += m * Math.log2(i * this.binHz / 60); cs += m; tot += m * m; }
    const cen = cs > 1e-7 ? clamp01(cw / cs / 7.5) : this.cFast;
    this.cFast = smooth(this.cFast, cen, dt, 0.35);
    this.cSlow = smooth(this.cSlow, cen, dt, W(5));
    A.centroid = this.cFast;
    if ((this.hops & 7) === 0) {
      let c = 0, e10 = 0, e85 = 0;
      for (let i = 2; i < 716; i++) { c += m2[i] * m2[i]; if (!e10 && c > tot * 0.1) e10 = i; if (!e85 && c > tot * 0.85) { e85 = i; break; } }
      const H = this.hist, n = (x) => clamp01(Math.log2(Math.max(x, 2) * this.binHz / 30) / 9.4);
      H.i = (H.i + 1) & 63;
      H.cen[H.i] = this.cFast;
      H.roll[H.i] = smooth(H.roll[(H.i + 63) & 63], n(e85), 8 * dt, 0.3);
      H.edge[H.i] = smooth(H.edge[(H.i + 63) & 63], n(e10), 8 * dt, 0.3);
      H.lvl[H.i] = A.eShort;
      let gl = 0, gm = 0, gn = 0;
      for (let i = 13; i < 342; i++) { gl += Math.log(m2[i] + 1e-9); gm += m2[i]; gn++; }
      this.flat = smooth(this.flat, gm > 1e-7 ? Math.exp(gl / gn) / (gm / gn) : this.flat, 8 * dt, W(4));
      this.longFrame(dt * 8, W, age);
    }
    if (this.hops % 47 === 0) {
      let cnt = 0;
      for (const o of this.onsets) if (now - o.t <= 0.75) cnt++;
      const r = this.rollHist;
      r.copyWithin(1, 0);
      r[0] = Math.log2(Math.max(1, cnt / 0.75));
    }
    this.anatomy(dt, now, age, kicked, B);
    // --- calm / intensity ---
    const calmT = clamp01(1 - this.bHold * 1.7) * clamp01(1.45 - A.eShort * 1.5) * (1 - 0.6 * A.tension);
    A.calm = smooth(A.calm, calmT, dt, 1.4);
    const intT = clamp01(0.55 * A.eShort + 0.42 * this.bHold + 0.035 * Math.min(this.dens, 6) - 0.1) * A.alive;
    A.intensity = smoothAR(A.intensity, Math.max(intT, A.dropHold * 0.85 * A.alive), dt, 0.8, 3.0);
    // --- timbre novelty (causal and quick — the early warning; Foote in structure.js is the careful one) ---
    {
      const M = this.nov.med, L = this.nov.long;
      let dot = 0, mm = 0, ll = 0;
      for (let j = 0; j < 32; j++) {
        const a = Math.floor(this.specIdx[j * 8]), b = Math.max(a + 1, Math.floor(this.specIdx[j * 8 + 8]));
        let v = 0;
        for (let i = a; i < b && i < 1024; i++) v += lg2[i];
        v /= (b - a);
        M[j] = smooth(M[j], v, dt, W(2.5)); L[j] = smooth(L[j], v, dt, W(14));
        dot += M[j] * L[j]; mm += M[j] * M[j]; ll += L[j] * L[j];
      }
      const cosd = mm > 1e-6 && ll > 1e-6 ? 1 - dot / Math.sqrt(mm * ll) : 0;
      A.novelty = clamp01(cosd * 8 + Math.abs(A.eShort - A.eMed) * 0.7);
    }
    // --- per-beat accumulation -> grid, structure, memory ---
    const fb = this.fbEdge, acc = this.acc;
    for (let j = 0; j < 9; j++) { let v = 0; for (let i = fb[j]; i < fb[j + 1]; i++) v += lg2[i]; acc[12 + j] += v / Math.max(1, fb[j + 1] - fb[j]); }
    this.accN++; this.accLvl += lvl; this.accOn += onsets;
    while (Math.floor(this.tempo.beat) > this.beatI) { this.beatI++; this.onBeat(this.beatI, now); }
    this.grid();
    // --- textures: log spectrum (floor-subtracted) + zero-crossing-triggered waveform + spectrogram ring ---
    let smax = 0;
    const sp = this.specS;
    for (let j = 0; j < SPEC_W; j++) {
      const a = this.specIdx[j], b = this.specIdx[j + 1];
      let v = 0;
      if (b - a < 1) { const i = Math.floor(a), f = a - i; v = lg2[i] * (1 - f) + lg2[Math.min(1023, i + 1)] * f; }
      else { for (let i = Math.floor(a); i < b; i++) if (lg2[i] > v) v = lg2[i]; }
      v = Math.max(0, v - 0.18) * (0.85 + 0.6 * j / SPEC_W);
      sp[j] = v > sp[j] ? v : smooth(sp[j], v, dt, 0.11);
      if (sp[j] > smax) smax = sp[j];
    }
    this.specPk = Math.max(smax, 0.22, this.specPk * Math.exp(-dt / 10));
    for (let j = 0; j < SPEC_W; j++) A.spec[j] = clamp01(sp[j] / this.specPk) * 255;
    this.histTex.set(A.spec, this.histRow * SPEC_W);
    this.histRow = (this.histRow + 1) % HIST_H;
    this.wavePk = Math.max(pk, 0.02, this.wavePk * Math.exp(-dt / 6));
    let z = 0;
    const s0 = end - 2048;
    for (let i = 1; i < 1000; i++) if (ring[(s0 + i - 1) & mask] < 0 && ring[(s0 + i) & mask] >= 0) { z = i; break; }
    const g = 0.5 / this.wavePk;
    for (let i = 0; i < WAVE_W; i++) A.wave[i] = clamp01(0.5 + ring[(s0 + z + i * 2) & mask] * g) * 255;
    A.fresh = true;
  }
}
Object.assign(Analyzer.prototype, ANAT, STRUCT);
