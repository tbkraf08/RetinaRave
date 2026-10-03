// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The track map: the music is known in advance in file mode, so use it. One non-causal pass over the decoded track gives
// the beat / bar grid, bar-synchronous sections with returns, bar-pinned drops, the whole-track energy arc and the tonic.
// Pure and deterministic: no DOM, no window, no clock, no Math.random — two calls give identical JSON.
import { PercTrack, B_SUB, B_LOWBASS, B_HARM, B_SNARE, B_CLICK, B_HAT, PHOP } from '../ears/perc.js';
import { SubTrack } from '../ears/sub.js';
import { FFT } from '../ears/dsp.js';
import { buildGrid } from './beats.js';
import { buildSections, kkTonic } from './sections.js';
import { findDrops } from './drops.js';
import { buildOnsets } from './onsets.js';
import { buildSubPitch } from './subpitch.js';
import { ANA_SR, resample } from './resample.js';

export const MAP_V = 2;              // v2 adds `onsets` (non-causal, the truth's front end) and `sub` (a centred YIN)
export const EG_FPS = 10;            // the energy arc's rate
export const EG_LO = 5, EG_HI = 98;  // percentiles mapped to 0 and 1 — the macro arc the AGC flattens
export const CH_N = 8192;            // the chroma FFT per bar
export const CH_LO = 65, CH_HI = 2100;   // the same 65-2100 Hz band the truth tool bins, so the two tonics are comparable
export const CH_PER_BAR = 4;         // chroma windows per bar
export const SUB_W = 2.0;            // how hard the sub's own pitch class leans on each bar's chroma
export const MED_W = 5;              // the non-causal median (in hops) that splits harmonic from percussive for the envelope

const pctOf = (a, q) => { const b = Array.from(a).sort((x, y) => x - y); return b[Math.max(0, Math.min(b.length - 1, Math.floor(q / 100 * b.length)))]; };

// The whole decoded track in, a plain JSON-able map out.
export function buildMap(L, R, sr0, opts = {}) {
  const dur = L.length / sr0;
  const prof = opts.prof || {};                // buildMap's own cost split (ms), for the report and for test_map
  const clk = typeof performance !== 'undefined' && performance.now ? () => performance.now() : () => Number(process.hrtime.bigint()) / 1e6;
  let mark = clk();
  const lap = (k) => { const t = clk(); prof[k] = +(t - mark).toFixed(1); mark = t; };
  // THE WHOLE MAP ANALYSES AT ANA_SR (44.1 kHz), whatever the AudioContext decoded at. `resample.js`' header has the
  // measurement: the truth tool's own front end, run on the same music at 48 kHz, reproduces only 70 % of its own
  // 44.1 kHz onsets, because a 2048-point STFT's bins, a 17-frame median and `int(0.09*fps2)` all mean different things
  // in Hz and in seconds at a different rate. Bringing the audio to one rate first also makes the map RATE-INDEPENDENT:
  // the 48 kHz build's grid, sections, drops and tonic now come out as the 44.1 kHz build's instead of drifting
  // (before: phase 0.0400 against 0.0360, coherence 0.122 against 0.129, tonic confidence 0.158 against 0.222).
  const mono0 = new Float32Array(L.length);
  for (let i = 0; i < L.length; i++) mono0[i] = 0.5 * (L[i] + (R ? R[i] : L[i]));
  const mono = resample(mono0, sr0, ANA_SR), sr = ANA_SR, n = mono.length;
  lap('resample');
  // --- one pass: band powers per hop, and the sub's pitch / gate per hop
  const perc = new PercTrack(sr), sub = new SubTrack(sr);
  const NH = Math.floor(n / PHOP);
  const NB = 7;
  const bp = new Float64Array(NH * NB);
  const sHz = new Float64Array(NH), sNote = new Int8Array(NH).fill(-1), sGate = new Uint8Array(NH);
  const onKick = [];                   // kick onset times: the drop rule's density measure (see the bar loop)
  let h = 0;
  for (let i = 0; i < n; i++) {
    const m = mono[i];
    const pe = perc.e, den0 = pe[B_SUB] + pe[B_LOWBASS] + pe[B_HARM];
    if (i % PHOP === 0) sub.share = den0 > 0 ? pe[B_SUB] / den0 : 1;
    perc.step(m, (i + 1) / sr);
    if (perc.out.length) { for (const ev of perc.out) if (ev.type === 'kick') onKick.push(ev.t); perc.out.length = 0; }
    sub.step(m, (i + 1) / sr);
    if ((i + 1) % PHOP === 0 && h < NH) {
      for (let b = 0; b < NB; b++) bp[h * NB + b] = perc.e[b];
      sHz[h] = sub.hz; sNote[h] = sub.gate ? sub.note : -1; sGate[h] = sub.gate;
      h++;
    }
  }
  lap('pass');
  // --- the non-causal channels: the truth tool's own onset front end and its own centred YIN
  const ons = buildOnsets(mono, sr, Object.assign({ mono44: mono }, opts.onsets || {}));
  lap('onsets');
  const subP = buildSubPitch(mono, sr,
    { e60: ons.e60, e600: ons.e600, share: ons.share, t0: ons.t0, fps: ons.fps }, opts.sub || {});
  lap('subpitch');
  delete ons.mono44; delete ons.share; delete ons.e60; delete ons.e600;
  const fps = sr / PHOP;
  // --- the percussive onset envelope: each band's dB minus a CENTRED median (non-causal), positive flux, summed
  const env = new Float64Array(NH), elow = new Float64Array(NH), emid = new Float64Array(NH);
  const dbv = new Float64Array(NH), res = new Float64Array(NH), win = new Float64Array(2 * MED_W + 1);
  const bandFlux = (b, out) => {
    for (let i = 0; i < NH; i++) dbv[i] = 10 * Math.log10(bp[i * NB + b] + 1e-12);
    for (let i = 0; i < NH; i++) {
      let k = 0;
      for (let j = i - MED_W; j <= i + MED_W; j++) win[k++] = dbv[Math.max(0, Math.min(NH - 1, j))];
      const w = Array.prototype.slice.call(win, 0, k).sort((x, y) => x - y);
      res[i] = dbv[i] - w[k >> 1];
    }
    out[0] = 0;
    for (let i = 1; i < NH; i++) out[i] = Math.max(0, res[i] - res[i - 1]);
  };
  // The TEMPO envelope is the drums only (150-600, 150-2500, 2.5-8k, 5-12k). Measured: including the 22-70 and 70-150 bands
  // pulls the circular phase fit a 16th note early, because the 808 on this track plays 16ths — the grid came out 99 ms
  // (a quarter beat) before the truth's. `elow` (the low bands) is still what picks the downbeat out of the four beats.
  const tmp = new Float64Array(NH);
  for (const b of [B_HARM, B_SNARE, B_CLICK, B_HAT]) {
    bandFlux(b, tmp);
    for (let i = 0; i < NH; i++) env[i] += tmp[i];
    if (b === B_SNARE) for (let i = 0; i < NH; i++) emid[i] = tmp[i];
  }
  for (const b of [B_SUB, B_LOWBASS]) { bandFlux(b, tmp); for (let i = 0; i < NH; i++) elow[i] += tmp[i]; }
  lap('flux');
  // --- the grid
  const grid = buildGrid(env, elow, emid, fps, dur);
  lap('grid');
  const db = grid.downbeats.slice();
  if (db.length < 4) return emptyMap(sr, dur, grid);
  if (db[db.length - 1] < dur) db.push(Math.min(dur, db[db.length - 1] + grid.bar));
  const nBars = db.length - 1;
  // --- per-bar features, the chroma, the energies
  const fft = new FFT(CH_N), mag = new Float32Array(CH_N >> 1), ring = new Float32Array(CH_N);
  const binPc = new Int8Array(CH_N >> 1).fill(-1);
  for (let i = 0; i < (CH_N >> 1); i++) {
    const f = i * sr / CH_N;
    if (f >= CH_LO && f < CH_HI) binPc[i] = ((Math.round(69 + 12 * Math.log2(f / 440)) % 12) + 12) % 12;
  }
  const DIM = 11 + 12;
  const F = new Float64Array(nBars * DIM);
  const lowE = new Float64Array(nBars), barE = new Float64Array(nBars), densE = new Float64Array(nBars), ch12 = new Float64Array(nBars * 12);
  for (let b = 0; b < nBars; b++) {
    const h0 = Math.max(0, Math.min(NH - 1, Math.round(db[b] * fps))), h1 = Math.max(h0 + 1, Math.min(NH, Math.round(db[b + 1] * fps)));
    const e = new Float64Array(NB);
    for (let i = h0; i < h1; i++) for (let k = 0; k < NB; k++) e[k] += bp[i * NB + k];
    // 22 Hz - 12 kHz, skipping BANDS[2] (40-150) which duplicates 22-70 + 70-150. B_CLICK matters: the void is 42 % highs,
    // and leaving it out lifted the 70th-percentile energy gate enough to reject drop 1.
    const tot = e[B_SUB] + e[B_LOWBASS] + e[B_HARM] + e[B_SNARE] + e[B_CLICK] + e[B_HAT] + 1e-14;
    lowE[b] = e[B_SUB] + e[B_LOWBASS]; barE[b] = tot;
    // the chroma of this bar, with the sub's own pitch class added
    const c = new Float64Array(12);
    // CH_PER_BAR windows across the bar, not one at its centre: one 8192-point window is 0.19 s of a 1.6 s bar, and a
    // single sample of it gave a different tonic from the python tool's whole-bar STFT average on all three other tracks.
    for (let q = 0; q < CH_PER_BAR; q++) {
      const ct = db[b] + (db[b + 1] - db[b]) * (q + 0.5) / CH_PER_BAR;
      const mid = Math.max(0, Math.min(n - CH_N, Math.round(ct * sr) - (CH_N >> 1)));
      ring.set(mono.subarray(mid, mid + CH_N));
      fft.mags(ring, 0, CH_N - 1, mag);
      for (let i = 0; i < mag.length; i++) { const p = binPc[i]; if (p >= 0) c[p] += mag[i] * mag[i]; }
    }
    let cs = 0; for (let i = 0; i < 12; i++) cs += c[i];
    let nv = 0, gv = 0; const cnt = new Int32Array(12);
    for (let i = h0; i < h1; i++) { if (sGate[i]) { gv++; if (sNote[i] >= 0) { cnt[sNote[i]]++; nv++; } } }
    if (nv) { let bi = 0; for (let i = 1; i < 12; i++) if (cnt[i] > cnt[bi]) bi = i; c[bi] += SUB_W * cs * (e[B_SUB] / tot); }
    cs = 0; for (let i = 0; i < 12; i++) cs += c[i];
    for (let i = 0; i < 12; i++) ch12[b * 12 + i] = c[i] / (cs + 1e-14);
    // the feature row
    let fl = 0, fm = 0, fh = 0;
    for (let i = h0; i < h1; i++) { fl += elow[i]; fm += emid[i]; fh += env[i]; }
    const dt = Math.max(1e-6, db[b + 1] - db[b]);
    const row = [e[B_SUB] / tot, e[B_LOWBASS] / tot, e[B_HARM] / tot, e[B_SNARE] / tot, (e[B_CLICK] + e[B_HAT]) / tot,
      Math.min(4, e[B_HARM] / (e[B_SUB] + e[B_LOWBASS] + 1e-14)) / 4, gv / Math.max(1, h1 - h0),
      Math.min(60, fl / dt) / 60, Math.min(60, fm / dt) / 60, Math.min(200, fh / dt) / 200, Math.log10(tot + 1e-12) / 10];
    // The drop rule's "does this bar carry the BEAT" measure: KICKS per second. Measured and rejected first, in this order:
    // total bar energy (SeeYouDrop is limited, so the quiet-looking walk at 12.8 s and drop 1 have the same energy, 0.85 and
    // 0.86 of the track p90 — no threshold separates them); the 150 Hz - 12 kHz power (walk 0.59, drop 1 0.62); the drum
    // bands' flux sum (0.56 / 0.67); snare+hat onset counts, with and without a velocity floor (0.50 / 0.65). The walk has NO
    // kick at all and the drop sections have ~2/s, which is the one clean gap on this track.
    let nOn = 0;
    for (let k = 0; k < onKick.length; k++) if (onKick[k] >= db[b] && onKick[k] < db[b + 1]) nOn++;
    densE[b] = nOn / dt;
    for (let d = 0; d < 11; d++) F[b * DIM + d] = row[d];
    for (let i = 0; i < 12; i++) F[b * DIM + 11 + i] = 2 * ch12[b * 12 + i];
  }
  lap('bars');
  // --- sections, drops, tonic, the energy arc
  const sec = buildSections(F, DIM, db, opts);
  if (sec.sections.length) {                   // the section list covers the whole track: the first bar line is not t = 0
    sec.sections[0].t0 = 0;
    sec.sections[sec.sections.length - 1].t1 = r6(dur);
  }
  const dr = findDrops(lowE, barE, densE, db);
  const lm = pctOf(barE, 50);
  const chAvg = new Float64Array(12);
  let nl = 0;
  for (let b = 0; b < nBars; b++) if (barE[b] > lm) { for (let i = 0; i < 12; i++) chAvg[i] += ch12[b * 12 + i]; nl++; }
  for (let i = 0; i < 12; i++) chAvg[i] /= Math.max(1, nl);
  const tonic = kkTonic(nl ? chAvg : ch12.subarray(0, 12));
  const NE = Math.max(1, Math.floor(dur * EG_FPS));
  const raw = new Float64Array(NE);
  for (let i = 0; i < NE; i++) {
    const h0 = Math.max(0, Math.min(NH - 1, Math.round(i / EG_FPS * fps))), h1 = Math.max(h0 + 1, Math.min(NH, Math.round((i + 1) / EG_FPS * fps)));
    let s = 0;
    for (let k = h0; k < h1; k++) for (let b = 0; b < NB; b++) if (b !== B_KICKDUP) s += bp[k * NB + b];
    raw[i] = s / (h1 - h0);
  }
  const lo = pctOf(raw, EG_LO), hi = pctOf(raw, EG_HI);
  const v = new Array(NE);
  for (let i = 0; i < NE; i++) v[i] = Math.max(0, Math.min(1, (raw[i] - lo) / (hi - lo + 1e-14)));
  lap('tail');
  return {
    onsets: ons, sub: subP,        // `prof` is NOT returned: it would make two builds differ. It fills `opts.prof`.
    v: MAP_V, sr: sr0, anaSr: sr, dur: r6(dur), bpm: r4(grid.bpm), beat: r6(grid.beat), phase: r5(grid.phase), bar: r6(grid.bar),
    grid: { coh: r4(grid.coh), dpResMs: r4(grid.dpRes * 1000), dpAgree: r4(grid.dpAgree), downbeatMod4: grid.downbeatMod4, downbeatScores: grid.downbeatScores.map(r4) },
    beats: grid.beats.map(r4), downbeats: grid.downbeats.map(r4),
    sections: sec.sections.map((s) => ({ t0: r4(s.t0), t1: r4(s.t1), id: s.id, label: s.label, ret: s.ret, bars: s.bars })),
    novelty: { bars: db.slice(0, sec.novelty.length).map(r4), v: sec.novelty.map(r4), thr: r4(sec.thr) },
    drops: dr.drops.map(r4), dropWhy: dr.why,
    energy: { bars: db.slice(0, nBars).map(r4), low: dr.lrel.map(r4), e: dr.erel.map(r4), den: dr.drel.map(r4) },
    eG: { fps: EG_FPS, v: v.map(r4) },
    tonic: { pc: tonic.pc, minor: tonic.minor, conf: r4(tonic.conf), scores: tonic.scores.map(r4) },
  };
}
const B_KICKDUP = 2;                 // BANDS[2] is 40-150, which overlaps 22-70 and 70-150: leave it out of the energy sum
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const r5 = (x) => Math.round(x * 1e5) / 1e5;
const r6 = (x) => Math.round(x * 1e6) / 1e6;
function emptyMap(sr, dur, grid) {
  return { v: MAP_V, sr: sr0, anaSr: sr, dur: r6(dur), bpm: r4(grid.bpm), beat: r6(grid.beat), phase: r5(grid.phase), bar: r6(grid.bar),
    grid: { coh: r4(grid.coh), dpResMs: r4(grid.dpRes * 1000), dpAgree: r4(grid.dpAgree), downbeatMod4: grid.downbeatMod4, downbeatScores: grid.downbeatScores.map(r4) },
    beats: grid.beats.map(r4), downbeats: grid.downbeats.map(r4), sections: [], novelty: { bars: [], v: [], thr: 0 },
    drops: [], dropWhy: [], energy: { bars: [], low: [], e: [] }, eG: { fps: EG_FPS, v: [] },
    tonic: { pc: 0, minor: 0, conf: 0, scores: new Array(24).fill(0) },
    onsets: { fps: 0, t0: 0, nfr: 0, kick: [], snare: [], hat: [], low: [], bare: [] },
    sub: { fps: 0, t0: 0, n: 0, hz: [], cents: [], note: [], conf: [], gate: [], vcd: [], glide: [], inT: [], outT: [], noteT: [] } };
}

// --- reading the map at heard time -----------------------------------------------------------------------------------
// out { mapOn, toDrop, toBoundary, buildProg, mapSection, mapNext, mapReturn, eG }
export function mapAt(map, t, out = {}) {
  out.mapOn = 1;
  const beat = map.beat || 0.4;
  let nd = -1;
  for (let i = 0; i < map.drops.length; i++) if (map.drops[i] > t) { nd = map.drops[i]; break; }
  out.toDrop = nd < 0 ? -1 : (nd - t) / beat;
  let si = -1;
  for (let i = 0; i < map.sections.length; i++) if (map.sections[i].t0 <= t && t < map.sections[i].t1) { si = i; break; }
  if (si < 0 && map.sections.length) si = t < map.sections[0].t0 ? 0 : map.sections.length - 1;
  const s = si >= 0 ? map.sections[si] : null;
  out.toBoundary = s ? (s.t1 - t) / beat : -1;
  out.mapSection = s ? s.label : -1;
  out.mapNext = s && si + 1 < map.sections.length ? map.sections[si + 1].label : -1;
  out.mapReturn = s ? s.ret : 0;
  // buildProg: 0 at the start of the section that ENDS in a drop, 1 at the drop frame, 0 everywhere else
  out.buildProg = 0;
  if (s) {
    for (let i = 0; i < map.drops.length; i++) {
      if (Math.abs(map.drops[i] - s.t1) <= 0.5 * beat) {
        out.buildProg = Math.max(0, Math.min(1, (t - s.t0) / Math.max(1e-6, s.t1 - s.t0)));
        break;
      }
    }
  }
  const g = map.eG;
  if (g && g.v.length) {
    const x = t * g.fps, i = Math.max(0, Math.min(g.v.length - 1, Math.floor(x)));
    const j = Math.min(g.v.length - 1, i + 1), f = Math.max(0, Math.min(1, x - i));
    out.eG = g.v[i] + (g.v[j] - g.v[i]) * f;
  } else out.eG = 0;
  return out;
}

// The sub channel at heard time. The NEAREST frame, never an interpolation: `hz` is 0 on an unvoiced frame and averaging
// a pitch with 0 would invent one an octave down, `note` and `gate` are categorical, and the grid is 100.2273 Hz so the
// nearest frame is at most 5 ms away — a third of a 60 Hz frame.
// out { hz, cents, note, conf, gate, glide }
export function mapSubAt(map, t, out = {}) {
  const P = map.sub;
  if (!P || !P.n) { out.hz = 0; out.cents = 0; out.note = -1; out.conf = 0; out.gate = 0; out.glide = 0; return out; }
  const i = Math.max(0, Math.min(P.n - 1, Math.round((t - P.t0) * P.fps)));
  out.hz = P.hz[i]; out.cents = P.cents[i]; out.note = P.note[i];
  out.conf = P.conf[i]; out.gate = P.gate[i]; out.glide = P.glide[i];
  return out;
}

// Did a drop / a section boundary fall in (tPrev, t]?
export function mapCross(map, tPrev, t) {
  let drop = false, boundary = false;
  for (let i = 0; i < map.drops.length; i++) { const v = map.drops[i]; if (v > tPrev && v <= t) drop = true; }
  for (let i = 0; i < map.sections.length; i++) { const v = map.sections[i].t0; if (v > tPrev && v <= t) boundary = true; }
  return { drop, boundary };
}
