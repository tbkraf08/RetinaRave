// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The sub's pitch, NON-CAUSALLY, for the track map (file mode only). A port of `tools/truth/trackmap.py`'s own contour —
// the same 130 Hz zero-phase low-pass, the same decimation to sr/20, the same 100 ms / 10 ms YIN with the same threshold,
// walk-down, two octave checks and parabolic refinement, and the same voiced rule. It is the reference the ±30-cents
// ruler grades against (`truth.contour.f0td`), so reproducing it rather than approximating it is the whole point.
//
// CENTRED, which is the one thing the causal `ears/sub.js` cannot be: the truth stamps frame f at the window's CENTRE,
// `(f*hop + W/2)/ysr`, so the value describes the music AT that instant. The causal track reads a window that ENDS at the
// sample it has, so its estimate lags by W/2 plus the ring's tmax guard plus a 5-frame median — pass 1 paid for that with
// a 60 ms `NOTE_LAG` backdate (docs/workers/ears.md §5) and still landed the walk notes +11..+42 ms late. Here there is no
// latency to backdate: the frame time IS the instant.
//
// Events are derived the same way the causal track derives them (a gate edge, a >= 1 semitone change held NOTE_HOLD, an
// 808 re-trigger) but with a non-causal flutter filter: runs of the raw voiced flag shorter than MIN_RUN are erased in
// both directions, which is what the causal GATE_DWELL / GATE_CONFIRM pair approximates one frame at a time.
export const LP_HZ = 130;            // the truth's `butter(6, 130, 'low')`, applied forward and backward (zero phase)
export const DEC = 20;               // ... then `[::20]`
export const YWIN = 0.1, YHOP = 0.01;   // the truth's `int(0.1*ysr)` / `int(0.01*ysr)`
export const YFMIN = 28, YFMAX = 130;   // `tmin = int(ysr/130)`, `tmax = int(ysr/28)+1`
export const YTHR = 0.15;            // the truth's CMND threshold (the causal track uses 0.16)
export const YOCT = 0.35;            // ... and its octave-check ceiling
export const VCONF = 0.6, VRMS = 0.1, VSHARE = 0.05;    // the truth's voiced rule
// `subGate`'s frozen formula, non-causally: the 25-60 Hz RMS over the TRACK's p90 (the causal track chases a ~32 s p90;
// over the whole file that IS the p90) crossing 0.16 up / 0.075 down, AND the sub owning >= 30 % of 25-600 Hz, with a
// 45 ms dwell. Measured: the truth's own per-frame `voiced` flag has no hysteresis at all and flickers 5.74 gate edges
// per bar through the gated drop (105.7-130.5 s) against the causal track's 0.77, and it put `subIn` at drop 1 on the
// wrong beat. The hysteresis is what makes the edge mean "the sub came in".
export const GATE_ON = 0.16, GATE_OFF = 0.075;
export const GATE_SHARE_ON = 0.30, GATE_SHARE_OFF = 0.26;
export const GATE_P = 90;            // the percentile of the 25-60 Hz RMS the thresholds are relative to
export const SHARE_W = 0.22;         // the share's centred moving-maximum half-width (s) — SHARE_DOWN 0.45 s, both ways
// How long a rejected YIN frame may keep showing the last accepted pitch, in frames. ZERO: swept 0 / 1 / 2 / 3 / 5 and
// both sub rulers fall monotonically with it — +-30 cents 100.0 / 99.9 / 99.8 / 99.8 / 99.7 % and `subNote` against the
// truth's per-beat slice note 91.1 / 90.4 / 85.1 / 82.5 / 80.5 %. Holding sounds kinder to a scene but it is exactly
// wrong on the climbs (38-44 s, 89-92 s), where the sub slides up to D#1/E1 through frames the YIN rejects and the held
// value is still the C#1 before them. `subGate` is the field that says "there is a sub"; `subHz` says what it is or 0.
export const HOLD_MAX = 0;
export const MIN_RUN = 0.045;        // s: a gate run shorter than this is flutter and is erased
export const NOTE_HOLD = 0.032;      // s: a >= 1 semitone change must hold this long to be a new note
export const RETRIG_DB = 7;          // ... or the sub's own level jumps this much inside an open gate
export const RETRIG_MIN = 0.09;      // ... at most this often
export const GLIDE_TAU = 0.03;       // the semitone/s derivative's smoothing, as in ears/sub.js

const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 1e4) / 1e4;
// numpy's np.round: half to EVEN. The octave check's `np.round(ti/2)` hits .5 on every odd ti, so this matters.
const rnd2even = (x) => { const f = Math.floor(x), d = x - f; return d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1); };
const pctLin = (a, q) => {
  const b = Array.prototype.slice.call(a).sort((x, y) => x - y);
  if (!b.length) return 0;
  const p = q / 100 * (b.length - 1), i = Math.floor(p), f = p - i;
  return i + 1 < b.length ? b[i] + (b[i + 1] - b[i]) * f : b[i];
};
// One second-order section, RBJ low-pass, run over a whole array (forward when `back` is false, else in reverse).
function biq(x, y, n, b0, b1, b2, a1, a2, back) {
  let z1 = 0, z2 = 0;
  for (let q = 0; q < n; q++) {
    const i = back ? n - 1 - q : q, v = x[i];
    const o = b0 * v + z1;
    z1 = b1 * v - a1 * o + z2; z2 = b2 * v - a2 * o;
    y[i] = o;
  }
}
const BW6 = [0.5176380902, 0.7071067812, 1.9318516526];     // the section Qs of a 6th-order Butterworth
// `sosfiltfilt` of a 6th-order Butterworth low-pass: three sections forward, then the same three backward. The edge
// padding scipy adds (`padtype='odd'`, padlen 3*(2*3+1) = 21 samples) is not reproduced; it only moves the first and
// last ~0.5 ms of the track.
function lp6(x, sr, fc) {
  const n = x.length, a = new Float32Array(n), b = new Float32Array(n);
  let src = x, dst = a;
  for (let s = 0; s < 3; s++) {
    const w = 2 * Math.PI * Math.min(fc, sr * 0.49) / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * BW6[s]);
    const a0 = 1 + al;
    biq(src, dst, n, (1 - cw) / 2 / a0, (1 - cw) / a0, (1 - cw) / 2 / a0, (-2 * cw) / a0, (1 - al) / a0, false);
    src = dst; dst = dst === a ? b : a;
  }
  for (let s = 0; s < 3; s++) {
    const w = 2 * Math.PI * Math.min(fc, sr * 0.49) / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * BW6[s]);
    const a0 = 1 + al;
    biq(src, dst, n, (1 - cw) / 2 / a0, (1 - cw) / a0, (1 - cw) / 2 / a0, (-2 * cw) / a0, (1 - al) / a0, true);
    src = dst; dst = dst === a ? b : a;
  }
  return src;
}

// mono at ANA_SR (the resampled signal buildOnsets already made) plus the STFT band energies, in -> the map's sub channel.
// `B = { e60, e600, share, t0, fps }` from buildOnsets: E(25-60), E(25-600) and E(25-60)/E(25-12000) per STFT frame.
export function buildSubPitch(mono, sr, B, opts = {}) {
  const thr = opts.thr === undefined ? YTHR : opts.thr;
  const holdMax = opts.holdMax === undefined ? HOLD_MAX : opts.holdMax;
  const filt = lp6(mono, sr, LP_HZ);
  const m = Math.floor(filt.length / DEC), ysr = sr / DEC;
  const y = new Float32Array(m);
  for (let i = 0; i < m; i++) y[i] = filt[i * DEC];
  const W = Math.floor(YWIN * ysr), hop = Math.floor(YHOP * ysr);
  const tmin = Math.floor(ysr / YFMAX), tmax = Math.floor(ysr / YFMIN) + 1;
  const nfr = Math.max(0, Math.floor((m - W - tmax) / hop));
  const fps = ysr / hop;
  const t = new Float64Array(nfr);
  for (let f = 0; f < nfr; f++) t[f] = (f * hop + W / 2) / ysr;     // the CENTRE of the window, as the truth stamps it
  // --- the gate first, from the STFT band energies: the YIN then runs only where the sub is actually sounding
  const at = (a, tt) => {
    if (!a || !a.length) return 0;
    const x = (tt - B.t0) * B.fps, i = Math.max(0, Math.min(a.length - 1, Math.floor(x)));
    const j = Math.min(a.length - 1, i + 1), fr = Math.max(0, Math.min(1, x - i));
    return a[i] + (a[j] - a[i]) * fr;
  };
  const rel = new Float64Array(nfr), shr = new Float64Array(nfr), sh4 = new Float64Array(nfr);
  const amp = new Float64Array(nfr);
  for (let f = 0; f < nfr; f++) {
    const e6 = at(B.e60, t[f]), e66 = at(B.e600, t[f]);
    amp[f] = Math.sqrt(Math.max(0, e6));
    shr[f] = e66 > 0 ? e6 / e66 : 0;
    sh4[f] = at(B.share, t[f]);
  }
  const p90 = pctLin(amp, GATE_P) + 1e-12;
  for (let f = 0; f < nfr; f++) rel[f] = amp[f] / p90;
  // The share is a SECTION-level fact ("does the sub own the low end"), not a per-frame one: the causal track smooths it
  // asymmetrically (SHARE_UP 0.012 s, SHARE_DOWN 0.45 s) because the per-hop value swings with every kick, and without
  // that the gate chattered 5.4 times a bar through the ducked drop. The non-causal form of "rises at once, falls slowly"
  // is a CENTRED moving maximum over SHARE_W: measured on 105.7-130.5 s it takes the gate from 4.84 edges a bar to the
  // causal track's order (see docs/workers/ears.md "Pass 2").
  const shS = maxFilt(shr, nfr, Math.max(1, Math.round(SHARE_W * fps)));
  const raw = new Uint8Array(nfr);
  let on = 0;
  for (let f = 0; f < nfr; f++) {                          // one-sided hysteresis, then erased both ways by closeOpen
    on = on ? (rel[f] < GATE_OFF || shS[f] < GATE_SHARE_OFF ? 0 : 1)
      : (rel[f] > GATE_ON && shS[f] >= GATE_SHARE_ON ? 1 : 0);
    raw[f] = on;
  }
  const gate = closeOpen(raw, nfr, Math.max(1, Math.round(MIN_RUN * fps)));
  // --- the YIN. It runs wherever the sub is at all present (the gate's OFF threshold), because `subHz` follows the
  // TRUTH's voiced rule, not the gate: the ruler grades `subHz` against `contour.f0td` frame by frame, and the truth
  // reports a pitch on frames its own `conf > 0.6 & rms > 0.1*p95(rms)` rule accepts, some of which the amplitude gate
  // has already closed on. Measured: gating the pitch as well took the frame-by-frame agreement from 100.0 % to 97.6 %.
  const raw0 = new Float64Array(nfr), conf = new Float64Array(nfr), rms = new Float64Array(nfr);
  const cm = new Float64Array(tmax + 1);
  const doF = new Uint8Array(nfr);
  for (let f = 0; f < nfr; f++) doF[f] = gate[f] || rel[f] > GATE_OFF ? 1 : 0;
  let yframes = 0;
  for (let f = 0; f < nfr; f++) {
    if (!doF[f]) continue;
    yframes++;
    const base = f * hop;
    let acc = 0, sq = 0;
    for (let i = 0; i < W; i++) sq += y[base + i] * y[base + i];
    rms[f] = Math.sqrt(sq / W);
    cm[0] = 1;
    for (let tau = 1; tau <= tmax; tau++) {
      let s = 0;
      for (let i = 0; i < W; i++) { const a = y[base + i] - y[base + i + tau]; s += a * a; }
      acc += s; cm[tau] = s * tau / (acc + 1e-12);
    }
    let ti = -1;
    for (let tau = tmin; tau < tmax; tau++) if (cm[tau] < thr) { ti = tau; break; }     // np: below.argmax over [tmin,tmax)
    if (ti < 0) { ti = tmin; for (let tau = tmin; tau < tmax; tau++) if (cm[tau] < cm[ti]) ti = tau; }
    while (ti < tmax && cm[Math.min(ti + 1, tmax)] < cm[ti]) ti = Math.min(ti + 1, tmax);
    for (let k = 0; k < 2; k++) {                          // the truth's two octave-check passes
      const h = Math.max(rnd2even(ti / 2), 1);
      const hb = Math.min(Math.max(h - 1, 1), tmax), hn = Math.min(h + 1, tmax);
      const hm = cm[hb] < cm[h] ? hb : cm[hn] < cm[h] ? hn : h;
      if (hm >= tmin && cm[hm] < YOCT) ti = hm;
    }
    if (ti < 2) ti = 2; else if (ti > tmax - 1) ti = tmax - 1;
    const y0 = cm[ti - 1], y1 = cm[ti], y2 = cm[ti + 1];
    const tau = ti + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2 + 1e-12);
    raw0[f] = ysr / tau; conf[f] = 1 - Math.max(0, Math.min(1, y1));
  }
  // The truth's voiced rule, verbatim: conf > 0.6, the window RMS over a tenth of its own p95, and no sub-range pitch
  // without sub energy. `subHz` is reported exactly on these frames, so the +-30-cents ruler compares like with like.
  const rp = VRMS * pctLin(rms, 95);
  const vcd = new Uint8Array(nfr);
  const hz = new Float64Array(nfr);
  let held = 0, hn = 0;
  for (let f = 0; f < nfr; f++) {
    const v = raw0[f];
    vcd[f] = doF[f] && conf[f] > VCONF && rms[f] > rp && !(v < 60 && sh4[f] < VSHARE) && v >= YFMIN && v <= YFMAX ? 1 : 0;
    if (vcd[f]) { hz[f] = v; held = v; hn = 0; }
    else if (gate[f] && held > 0 && hn < holdMax) { hz[f] = held; hn++; }
    else { hz[f] = 0; held = 0; hn = 0; }
  }
  // --- notes, glide, events
  const note = new Int8Array(nfr).fill(-1), cents = new Float64Array(nfr), glide = new Float64Array(nfr);
  const inT = [], outT = [], noteT = [];
  let st = null, candSt = null, candT = 0, lastSt = null, lastT = 0, lastNote = -9, prevDb = -120, g = 0;
  for (let f = 0; f < nfr; f++) {
    if (hz[f] > 0) {
      const mi = 69 + 12 * Math.log2(hz[f] / 440), rr = Math.round(mi);
      note[f] = ((rr % 12) + 12) % 12; cents[f] = (mi - rr) * 100;
    }
    if (!gate[f]) {
      if (f && gate[f - 1]) outT.push(r4(t[f]));
      st = candSt = lastSt = null; g = 0; prevDb = -120;
      continue;
    }
    const db = 20 * Math.log10(rms[f] + 1e-9);
    if (!f || !gate[f - 1]) {
      inT.push(r4(t[f]));                                  // the gate opening IS a note start (ears/sub.js does the same)
      if (t[f] - lastNote >= RETRIG_MIN) { noteT.push(r4(t[f])); lastNote = t[f]; }
      st = null; prevDb = db;
    } else if (db - prevDb >= RETRIG_DB && t[f] - lastNote >= RETRIG_MIN) {
      noteT.push(r4(t[f])); lastNote = t[f]; st = null; candSt = null; prevDb = db;
    } else prevDb = db;
    if (!(hz[f] > 0)) continue;
    const s = 12 * Math.log2(hz[f] / 55);
    if (lastSt !== null && t[f] > lastT) {
      const gg = (s - lastSt) / (t[f] - lastT), al = 1 - Math.exp(-(t[f] - lastT) / GLIDE_TAU);
      g += (Math.max(-48, Math.min(48, gg)) - g) * al;
    } else g = 0;
    glide[f] = g; lastSt = s; lastT = t[f];
    if (st === null) st = s;
    else if (Math.abs(s - st) >= 1) {
      if (candSt === null || Math.abs(s - candSt) >= 1) { candSt = s; candT = t[f]; }
      else if (t[f] - candT >= NOTE_HOLD) {
        st = s; candSt = null;
        if (candT - lastNote >= RETRIG_MIN) { noteT.push(r4(candT)); lastNote = candT; }
      }
    } else candSt = null;
  }
  return {
    fps: r4(fps), t0: r4(nfr ? t[0] : 0), n: nfr, anaSr: sr, yframes,
    hz: Array.from(hz, r2), cents: Array.from(cents, Math.round), note: Array.from(note),
    conf: Array.from(conf, r2), gate: Array.from(gate), vcd: Array.from(vcd), glide: Array.from(glide, r2),
    inT, outT, noteT,
  };
}

// A centred moving maximum of width 2k+1 (the non-causal form of "rise at once, fall slowly").
function maxFilt(a, n, k) {
  const o = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let m = -Infinity;
    for (let j = Math.max(0, i - k); j <= Math.min(n - 1, i + k); j++) if (a[j] > m) m = a[j];
    o[i] = m;
  }
  return o;
}

// Erase runs shorter than `k` frames, in both directions: the non-causal form of GATE_DWELL + GATE_CONFIRM.
function closeOpen(v, n, k) {
  const o = Uint8Array.from(v);
  for (let pass = 0; pass < 2; pass++) {
    const want = pass ? 0 : 1;                             // pass 0 erases short ON runs, pass 1 short OFF runs
    let i = 0;
    while (i < n) {
      if (o[i] !== want) { i++; continue; }
      let j = i;
      while (j < n && o[j] === want) j++;
      if (j - i < k) for (let q = i; q < j; q++) o[q] = want ? 0 : 1;
      i = j;
    }
  }
  return o;
}
